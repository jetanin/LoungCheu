"""Prepare a first Cloud Run deployment. Default mode only prints a plan.

This does not provision billing, IAM, SQL, secret values or public access.
The owner must prepare/review those prerequisites before explicitly executing.
Python standard library only; commands are argument arrays, never shell strings.
"""
import argparse
import json
from pathlib import Path
import re
import shlex
import shutil
import subprocess
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
FIELDS = {
    'project', 'region', 'repository', 'service', 'migration_job',
    'runtime_service_account', 'sql_instance', 'database_secret',
    'session_secret', 'demo_password_secret', 'max_instances',
}
SECRET_FIELDS = ('database_secret', 'session_secret', 'demo_password_secret')


class DeploymentError(Exception):
    pass


def load_config(path):
    config = json.loads(Path(path).read_text(encoding='utf-8-sig'))
    if not isinstance(config, dict) or set(config) != FIELDS:
        raise DeploymentError('Config must contain exactly the non-secret keys in gcp.example.json')
    for key in ('project', 'repository', 'service', 'migration_job', 'sql_instance'):
        if not isinstance(config[key], str) or not re.fullmatch(r'[a-z][a-z0-9-]{4,61}[a-z0-9]', config[key]):
            raise DeploymentError('Invalid resource name: ' + key)
    if not re.fullmatch(r'[a-z]+-[a-z]+[0-9]', config['region']):
        raise DeploymentError('Invalid region')
    expected_sa = r'[a-z][a-z0-9-]{4,28}[a-z0-9]@' + re.escape(config['project']) + r'\.iam\.gserviceaccount\.com'
    if not re.fullmatch(expected_sa, config['runtime_service_account']):
        raise DeploymentError('Runtime service account must belong to the selected project')
    for key in SECRET_FIELDS:
        if not isinstance(config[key], str) or not re.fullmatch(r'[a-zA-Z][a-zA-Z0-9_-]{0,254}:[1-9][0-9]*', config[key]):
            raise DeploymentError('Use a secret NAME:NUMERIC_VERSION, not a secret value: ' + key)
    if len({config[key].split(':')[0] for key in SECRET_FIELDS}) != 3:
        raise DeploymentError('Database, session and demo password must use distinct secrets')
    if type(config['max_instances']) is not int or not 1 <= config['max_instances'] <= 3:
        raise DeploymentError('max_instances must be between 1 and 3')
    return config


def validate_commit(commit):
    if not re.fullmatch(r'[0-9a-f]{40}', commit):
        raise DeploymentError('Provide the full 40-character reviewed main commit SHA')


def cloud(config, *args):
    return ['gcloud', *args, '--project=' + config['project'], '--quiet']


def scoped(config, *args):
    return cloud(config, *args, '--region=' + config['region'])


def image_path(config):
    return '{region}-docker.pkg.dev/{project}/{repository}/{service}'.format(**config)


def preflight_commands(config):
    commands = [
        cloud(config, 'artifacts', 'repositories', 'describe', config['repository'], '--location=' + config['region'], '--format=value(format)'),
        cloud(config, 'sql', 'instances', 'describe', config['sql_instance'], '--format=json'),
        cloud(config, 'iam', 'service-accounts', 'describe', config['runtime_service_account'], '--format=value(email)'),
    ]
    for key in SECRET_FIELDS:
        name, version = config[key].split(':')
        commands.append(cloud(config, 'secrets', 'versions', 'describe', version, '--secret=' + name, '--format=value(state)'))
    commands.append(scoped(config, 'run', 'services', 'list', '--filter=metadata.name=' + config['service'], '--format=value(metadata.name)'))
    return commands


def migration_commands(config, image):
    connection = '{project}:{region}:{sql_instance}'.format(**config)
    return [
        scoped(config, 'run', 'jobs', 'deploy', config['migration_job'], '--image=' + image,
               '--service-account=' + config['runtime_service_account'], '--set-cloudsql-instances=' + connection,
               '--set-env-vars=NODE_ENV=production',
               '--set-secrets=DATABASE_URL=' + config['database_secret'] + ',DEMO_SEED_PASSWORD=' + config['demo_password_secret'],
               '--command=sh', '--args=^|^-c|npm run db:migrate && npm run db:seed',
               '--tasks=1', '--parallelism=1', '--max-retries=0', '--task-timeout=600s', '--cpu=1', '--memory=512Mi'),
        scoped(config, 'run', 'jobs', 'execute', config['migration_job'], '--wait'),
    ]


def deploy_command(config, commit, image):
    return scoped(config, 'run', 'deploy', config['service'], '--image=' + image,
                  '--service-account=' + config['runtime_service_account'],
                  '--set-cloudsql-instances={project}:{region}:{sql_instance}'.format(**config),
                  '--execution-environment=gen2', '--port=3000', '--cpu=1', '--memory=512Mi',
                  '--min-instances=0', '--max-instances=' + str(config['max_instances']), '--concurrency=10',
                  '--set-env-vars=NODE_ENV=production,HOST=0.0.0.0,SESSION_COOKIE_SECURE=true,APP_ORIGIN=https://bootstrap.invalid,APP_VERSION=' + commit,
                  '--set-secrets=DATABASE_URL=' + config['database_secret'] + ',SESSION_SECRET=' + config['session_secret'],
                  '--no-allow-unauthenticated')


def describe_command(config):
    return scoped(config, 'run', 'services', 'describe', config['service'], '--format=json')


def origin_command(config, image, origin):
    return scoped(config, 'run', 'services', 'update', config['service'], '--image=' + image,
                  '--update-env-vars=APP_ORIGIN=' + origin)


def validate_origin(origin):
    parsed = urlsplit(origin)
    if (parsed.scheme != 'https' or not parsed.hostname or not parsed.hostname.endswith('.run.app')
            or parsed.username or parsed.password or parsed.port or parsed.path or parsed.query or parsed.fragment):
        raise DeploymentError('Cloud Run did not return a canonical HTTPS run.app origin')
    return origin


def run(command):
    print('+ ' + shlex.join(command), flush=True)
    actual = list(command)
    actual[0] = shutil.which(actual[0]) or actual[0]
    try:
        result = subprocess.run(actual, cwd=ROOT, check=True, capture_output=True, text=True, encoding='utf-8', errors='replace')
    except (subprocess.CalledProcessError, OSError):
        # Driver output/logs are not echoed: review them privately in GCP.
        raise DeploymentError('Command failed; stopped before the next step. Review its GCP status/log privately.') from None
    return result.stdout.strip()


def execute(config, commit, confirm_project, receipt_path):
    if confirm_project != config['project'] or config['project'].startswith('your-'):
        raise DeploymentError('Confirm the actual project ID; example project cannot execute')
    if run(['git', 'branch', '--show-current']) != 'main':
        raise DeploymentError('Execute only from reviewed main; feature branches may only preview')
    if run(['git', 'rev-parse', 'HEAD']) != commit:
        raise DeploymentError('Reviewed commit does not match local main HEAD')
    if run(['git', 'status', '--porcelain=v1', '--untracked-files=all']):
        raise DeploymentError('Execute from a clean checkout; keep private config in ignored .local/')
    checks = preflight_commands(config)
    if run(checks[0]) != 'DOCKER':
        raise DeploymentError('Artifact Registry Docker repository must already exist')
    sql = json.loads(run(checks[1]))
    if sql.get('state') != 'RUNNABLE' or sql.get('region') != config['region']:
        raise DeploymentError('Prepared Cloud SQL instance is not running in the selected region')
    if run(checks[2]) != config['runtime_service_account']:
        raise DeploymentError('Runtime service account is not prepared')
    for command in checks[3:6]:
        if run(command) != 'ENABLED':
            raise DeploymentError('Pinned secret version is not enabled')
    if run(checks[6]):
        raise DeploymentError('Service already exists. Stop and use a reviewed release procedure instead.')
    tag = image_path(config) + ':' + commit
    run(scoped(config, 'builds', 'submit', '.', '--tag=' + tag, '--ignore-file=.gcloudignore', '--suppress-logs'))
    digest = run(cloud(config, 'artifacts', 'docker', 'images', 'describe', tag, '--format=value(image_summary.digest)'))
    if not re.fullmatch(r'sha256:[0-9a-f]{64}', digest):
        raise DeploymentError('Cannot resolve a valid immutable image digest')
    image = image_path(config) + '@' + digest
    for command in migration_commands(config, image):
        run(command)
    run(deploy_command(config, commit, image))
    service = json.loads(run(describe_command(config)))
    origin = validate_origin(service['status']['url'])
    run(origin_command(config, image, origin))
    ready = json.loads(run(describe_command(config)))
    status = ready['status']
    if (status.get('url') != origin or not status.get('latestReadyRevisionName')
            or status.get('latestReadyRevisionName') != status.get('latestCreatedRevisionName')):
        raise DeploymentError('Latest service revision is not ready; no public success is claimed')
    receipt = {'state': 'private-deployment-awaiting-owner-public-access-and-smoke',
               'sourceCommit': commit, 'project': config['project'], 'region': config['region'],
               'service': config['service'], 'migrationJob': config['migration_job'],
               'image': image, 'revision': status['latestReadyRevisionName'], 'url': origin}
    receipt_path = Path(receipt_path)
    receipt_path.parent.mkdir(parents=True, exist_ok=True)
    receipt_path.write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
    print('Private service ready; receipt saved. Owner must review public access, then run smoke_test.py and C-04 manually.')


def preview(config, commit):
    tag = image_path(config) + ':' + commit
    image = image_path(config) + '@sha256:' + '0' * 64
    commands = preflight_commands(config) + [
        scoped(config, 'builds', 'submit', '.', '--tag=' + tag, '--ignore-file=.gcloudignore', '--suppress-logs'),
        cloud(config, 'artifacts', 'docker', 'images', 'describe', tag, '--format=value(image_summary.digest)'),
        *migration_commands(config, image), deploy_command(config, commit, image), describe_command(config),
        origin_command(config, image, 'https://service-url-from-describe.run.app'), describe_command(config),
    ]
    print('OFFLINE PLAN ONLY. Zero gcloud calls. Zero cloud changes. Zero-filled digest and service URL below are placeholders.')
    print('Prerequisites: owner-prepared APIs, billing, repository, Cloud SQL/DB/user, runtime IAM and pinned secret versions.')
    for command in commands:
        print(shlex.join(command))
    print('Public access and C-04 remain owner-controlled follow-up steps; this plan does not claim a deployed URL.')


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', default=str(ROOT / 'deploy/gcp.example.json'))
    parser.add_argument('--commit', required=True)
    parser.add_argument('--execute', action='store_true')
    parser.add_argument('--confirm-project')
    parser.add_argument('--receipt', default=str(ROOT / '.local/first-deploy-receipt.json'))
    args = parser.parse_args(argv)
    try:
        validate_commit(args.commit)
        config = load_config(args.config)
        if args.execute:
            execute(config, args.commit, args.confirm_project, args.receipt)
        else:
            preview(config, args.commit)
    except DeploymentError as error:
        print('ERROR: ' + str(error))
        return 1
    except (ValueError, KeyError, TypeError, OSError):
        print('ERROR: Invalid configuration or deployment step failed. No later steps executed; inspect configuration/status privately.')
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
