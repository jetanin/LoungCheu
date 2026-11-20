"""Update only the course-provisioned scccd8b05 resources. Preview by default."""
import argparse
import json
import os
from pathlib import Path
import re
import shlex
import shutil
import subprocess
import sys
from urllib.parse import urlsplit

import smoke_test

ROOT = Path(__file__).resolve().parents[1]
PROJECT = 'cpe-se-course-2026'
REGION = 'asia-southeast1'
PREFIX = 'scccd8b05'
FIXED = {'project': PROJECT, 'region': REGION, 'repository': PREFIX, 'service': PREFIX,
         'migration_job': PREFIX + '-migrate', 'database_secret': PREFIX + '-database-url:latest',
         'demo_password_secret': PREFIX + '-demo-password:latest'}


class DeploymentError(Exception):
    pass


def validate_sha(value):
    if not isinstance(value, str) or not re.fullmatch(r'[0-9a-f]{40}', value):
        raise DeploymentError('Use a full lowercase 40-character commit SHA')
    return value


def load_config(path):
    config = json.loads(Path(path).read_text(encoding='utf-8-sig'))
    if not isinstance(config, dict) or set(config) != set(FIXED) | {'session_secret'}:
        raise DeploymentError('Use the course gcp.example.json schema; legacy infrastructure configuration is unsupported')
    if any(config.get(key) != value for key, value in FIXED.items()):
        raise DeploymentError('Only the assigned project, region and scccd8b05 resource names are allowed')
    session = os.environ.get('SESSION_SECRET_REF', config['session_secret'])
    if not isinstance(session, str) or not re.fullmatch(PREFIX + r'-app-secret-[1-5]:[1-9][0-9]*', session):
        raise DeploymentError('SESSION_SECRET_REF must be an assigned app-secret slot with a numeric version')
    for variable, key in (('PROJECT_ID', 'project'), ('REGION', 'region'),
                          ('SERVICE_NAME', 'service'), ('MIGRATE_JOB_NAME', 'migration_job')):
        if os.environ.get(variable, config[key]) != config[key]:
            raise DeploymentError('Refusing an unassigned ' + variable)
    return {**config, 'session_secret': session}


def origin(value):
    parsed = urlsplit(value)
    if (parsed.scheme != 'https' or not parsed.hostname or not parsed.hostname.endswith('.run.app')
            or not re.fullmatch(r'[a-z0-9.-]+', parsed.hostname) or parsed.username or parsed.password
            or parsed.port or parsed.path or parsed.query or parsed.fragment):
        raise DeploymentError('Expected the existing Cloud Run HTTPS service origin')
    return value


def cloud(*args):
    return ['gcloud', *args, '--project=' + PROJECT, '--quiet']


def regional(*args):
    return cloud(*args, '--region=' + REGION)


def image_base():
    return f'{REGION}-docker.pkg.dev/{PROJECT}/{PREFIX}/{PREFIX}'


def validate_image(value):
    if not re.fullmatch(re.escape(image_base()) + r'@sha256:[0-9a-f]{64}', value):
        raise DeploymentError('Image digest must belong to the assigned team registry/image')
    return value


def run(command):
    print('+ ' + shlex.join(command), flush=True)
    actual = list(command)
    actual[0] = shutil.which(actual[0]) or actual[0]
    try:
        result = subprocess.run(actual, cwd=ROOT, check=True, capture_output=True,
                                text=True, encoding='utf-8', errors='replace')
    except (subprocess.CalledProcessError, OSError):
        raise DeploymentError('Command failed; later steps were stopped. Inspect the step privately; raw driver output is omitted.') from None
    return result.stdout.strip()


def guard_source(commit, rollback):
    head = validate_sha(run(['git', 'rev-parse', 'HEAD']))
    branch = run(['git', 'branch', '--show-current'])
    github_main = (os.environ.get('GITHUB_ACTIONS') == 'true'
                   and os.environ.get('GITHUB_REF') == 'refs/heads/main'
                   and os.environ.get('GITHUB_SHA') == head)
    if branch != 'main' and not github_main:
        raise DeploymentError('Execute from reviewed main only; GitHub main checkout may be detached')
    if run(['git', 'status', '--porcelain=v1', '--untracked-files=all']):
        raise DeploymentError('Deploy from a clean checkout; keep local config in ignored .local/')
    commit = validate_sha(commit or head)
    if commit == '0' * 40 or (not rollback and commit != head):
        raise DeploymentError('Normal release image tag must match the reviewed source HEAD')
    return commit


def describe_service():
    return regional('run', 'services', 'describe', PREFIX, '--format=json')


def migration_command(config, image):
    return regional('run', 'jobs', 'update', config['migration_job'], '--image=' + image,
                    '--update-secrets=DATABASE_URL=' + config['database_secret']
                    + ',DEMO_SEED_PASSWORD=' + config['demo_password_secret'],
                    '--update-env-vars=NODE_ENV=production', '--command=sh',
                    '--args=^|^-c|npm run db:migrate && npm run db:seed',
                    '--tasks=1', '--parallelism=1', '--max-retries=0', '--task-timeout=600s')


def service_command(config, commit, image, url):
    return regional('run', 'services', 'update', PREFIX, '--image=' + image,
                    '--update-env-vars=NODE_ENV=production,HOST=0.0.0.0,SESSION_COOKIE_SECURE=true,APP_ORIGIN=' + url + ',APP_VERSION=' + commit,
                    '--update-secrets=DATABASE_URL=' + config['database_secret'] + ',SESSION_SECRET=' + config['session_secret'],
                    '--command=node', '--args=dist/server.js', '--port=3000',
                    '--min-instances=0', '--max-instances=1', '--memory=512Mi', '--cpu=1')


def publish_environment(url, image, revision):
    target = os.environ.get('GITHUB_ENV')
    if target:
        with Path(target).open('a', encoding='utf-8') as output:
            output.write(f'SERVICE_URL={url}\nDEPLOYED_IMAGE={image}\nDEPLOYED_REVISION={revision}\n')


def execute(config, commit, mode, rollback, confirm_project, receipt_path):
    if confirm_project != PROJECT:
        raise DeploymentError('Confirm the assigned course project before execution')
    if mode == 'first' and rollback:
        raise DeploymentError('Rollback belongs to release mode')
    commit = guard_source(commit, rollback)
    # Only exact team resource lookups; never list the shared project or change IAM.
    before = json.loads(run(describe_service()))
    url = origin(before['status']['url'])
    job_name = run(regional('run', 'jobs', 'describe', config['migration_job'], '--format=value(metadata.name)'))
    if job_name != config['migration_job']:
        raise DeploymentError('The portal migration job is not ready')
    tag = image_base() + ':' + commit
    if mode == 'first':
        run(cloud('auth', 'configure-docker', REGION + '-docker.pkg.dev'))
        run(['docker', 'build', '--platform=linux/amd64', '--tag=' + tag, '.'])
        run(['docker', 'push', tag])
    image = validate_image(run(cloud('artifacts', 'docker', 'images', 'describe', tag,
                                    '--format=value(image_summary.fully_qualified_digest)')))
    if not rollback:
        run(migration_command(config, image))
        run(regional('run', 'jobs', 'execute', config['migration_job'], '--wait'))
    run(service_command(config, commit, image, url))
    run(regional('run', 'services', 'update-traffic', PREFIX, '--to-latest'))
    after = json.loads(run(describe_service()))
    status = after['status']
    revision = status.get('latestReadyRevisionName', '')
    if (status.get('url') != url or not re.fullmatch(PREFIX + r'-[a-z0-9-]+', revision)
            or revision != status.get('latestCreatedRevisionName')):
        raise DeploymentError('Updated revision is not ready; no successful deployment is claimed')
    receipt = {'state': 'updated-smoke-pending', 'project': PROJECT, 'region': REGION,
               'service': PREFIX, 'migrationJob': config['migration_job'], 'imageTag': commit,
               'image': image, 'revision': revision, 'url': url, 'rollback': rollback}
    if mode == 'first':
        smoke_test.check(url, commit)
        receipt['state'] = 'updated-read-only-smoke-passed'
    target = Path(receipt_path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
    publish_environment(url, image, revision)
    print('Service URL: ' + url)
    print('Receipt saved. C-04 still requires a manual sign-in and business journey.')
    return receipt


def preview(config, commit, mode, rollback):
    commit = validate_sha(commit or '0' * 40)
    image = image_base() + '@sha256:' + '0' * 64
    url = 'https://' + PREFIX + '-example-as.a.run.app'
    commands = [describe_service(), regional('run', 'jobs', 'describe', config['migration_job'], '--format=value(metadata.name)')]
    if mode == 'first':
        tag = image_base() + ':' + commit
        commands += [cloud('auth', 'configure-docker', REGION + '-docker.pkg.dev'),
                     ['docker', 'build', '--platform=linux/amd64', '--tag=' + tag, '.'], ['docker', 'push', tag]]
    commands.append(cloud('artifacts', 'docker', 'images', 'describe', image_base() + ':' + commit,
                          '--format=value(image_summary.fully_qualified_digest)'))
    if not rollback:
        commands += [migration_command(config, image), regional('run', 'jobs', 'execute', config['migration_job'], '--wait')]
    commands += [service_command(config, commit, image, url),
                 regional('run', 'services', 'update-traffic', PREFIX, '--to-latest'), describe_service()]
    print('OFFLINE PLAN ONLY: zero external commands. Zero digest and example URL are placeholders, not deployment evidence.')
    print('Portal must finish provisioning. Prepare a stable session secret in the configured team app-secret slot first.')
    for command in commands:
        print(shlex.join(command))
    print('Smoke after update: python3 deploy/smoke_test.py SERVICE_URL --expected-commit ' + commit)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=('first', 'release'))
    parser.add_argument('--config', default=str(ROOT / 'deploy/gcp.example.json'))
    parser.add_argument('--commit', default=os.environ.get('IMAGE_TAG'))
    parser.add_argument('--execute', action='store_true')
    parser.add_argument('--confirm-project')
    parser.add_argument('--receipt', default=str(ROOT / '.local/course-deploy-receipt.json'))
    parser.add_argument('--demo', action='store_true', help='Compatibility flag; LoungCheu always uses its non-destructive demo seed')
    args = parser.parse_args(argv)
    try:
        config = load_config(args.config)
        rollback_value = os.environ.get('ROLLBACK', 'false')
        if rollback_value not in ('true', 'false'):
            raise DeploymentError('ROLLBACK must be true or false')
        rollback = rollback_value == 'true'
        if args.mode == 'first' and rollback:
            raise DeploymentError('Use release mode for rollback')
        if args.execute:
            execute(config, args.commit, args.mode, rollback, args.confirm_project, args.receipt)
        else:
            preview(config, args.commit, args.mode, rollback)
    except DeploymentError as error:
        print('ERROR: ' + str(error))
        return 1
    except (ValueError, KeyError, TypeError, OSError, smoke_test.SmokeError):
        print('ERROR: Invalid configuration, response or smoke result. Inspect privately; raw response bodies are omitted.')
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
