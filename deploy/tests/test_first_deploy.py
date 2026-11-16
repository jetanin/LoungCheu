import contextlib
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import first_deploy as deploy

SHA = 'a' * 40
DIGEST = 'sha256:' + 'b' * 64
EXAMPLE = Path(__file__).resolve().parents[1] / 'gcp.example.json'


def config():
    value = deploy.load_config(EXAMPLE)
    value['project'] = 'cpe334-team07'
    value['runtime_service_account'] = 'loungcheu-runner@cpe334-team07.iam.gserviceaccount.com'
    return value


class DeploymentTests(unittest.TestCase):
    def setUp(self):
        self.output = io.StringIO()
        self.capture = contextlib.redirect_stdout(self.output)
        self.capture.__enter__()
        self.addCleanup(self.capture.__exit__, None, None, None)

    def test_default_preview_cannot_invoke_any_subprocess(self):
        with patch.object(deploy.subprocess, 'run', side_effect=AssertionError('offline only')):
            self.assertEqual(deploy.main(['--config', str(EXAMPLE), '--commit', SHA]), 0)
        text = self.output.getvalue()
        self.assertIn('OFFLINE PLAN ONLY', text)
        self.assertIn('npm run db:migrate && npm run db:seed', text)
        self.assertIn('--no-allow-unauthenticated', text)
        self.assertNotIn('services enable', text)
        self.assertNotIn('add-iam-policy-binding', text)

    def test_rejects_short_or_injected_commit(self):
        for value in ('abc123', SHA + ';id', 'G' * 40):
            with self.subTest(value=value), self.assertRaises(deploy.DeploymentError):
                deploy.validate_commit(value)

    def test_config_rejects_secret_values_foreign_projects_and_shell_arguments(self):
        cases = [('password', 'private'), ('database_secret', 'postgresql://user:secret@host/db'),
                 ('session_secret', 'session:latest'), ('project', 'project;whoami'),
                 ('runtime_service_account', 'runner@other-project.iam.gserviceaccount.com'),
                 ('max_instances', 4), ('max_instances', True), ('region', 'asia-southeast1,OTHER=x')]
        for key, value in cases:
            with self.subTest(key=key, value=value), tempfile.TemporaryDirectory() as folder:
                data = config()
                data[key] = value
                path = Path(folder) / 'config.json'
                path.write_text(json.dumps(data))
                with self.assertRaises(deploy.DeploymentError):
                    deploy.load_config(path)

    def test_every_gcloud_command_scopes_the_project_and_only_references_secrets(self):
        deploy.preview(config(), SHA)
        commands = [line for line in self.output.getvalue().splitlines() if line.startswith('gcloud ')]
        self.assertGreater(len(commands), 10)
        self.assertTrue(all('--project=cpe334-team07' in command for command in commands))
        migration = deploy.migration_commands(config(), 'image@' + DIGEST)[0]
        service = deploy.deploy_command(config(), SHA, 'image@' + DIGEST)
        self.assertTrue(any('DEMO_SEED_PASSWORD=' in arg for arg in migration))
        self.assertFalse(any('SESSION_SECRET=' in arg for arg in migration))
        self.assertTrue(any('SESSION_SECRET=' in arg for arg in service))
        self.assertFalse(any('DEMO_SEED_PASSWORD=' in arg for arg in service))
        self.assertIn('--min-instances=0', service)

    def fake_run(self, failure=None, existing=False, branch='main', dirty=False, digest=DIGEST):
        def run(command):
            if failure and failure(command):
                raise deploy.DeploymentError('simulated cloud failure')
            if command[:3] == ['git', 'branch', '--show-current']:
                return branch
            if command[:3] == ['git', 'rev-parse', 'HEAD']:
                return SHA
            if command[:2] == ['git', 'status']:
                return ' M file' if dirty else ''
            if command[1:4] == ['artifacts', 'repositories', 'describe']:
                return 'DOCKER'
            if command[1:4] == ['sql', 'instances', 'describe']:
                return json.dumps({'state': 'RUNNABLE', 'region': 'asia-southeast1'})
            if command[1:4] == ['iam', 'service-accounts', 'describe']:
                return config()['runtime_service_account']
            if command[1:4] == ['secrets', 'versions', 'describe']:
                return 'ENABLED'
            if command[1:4] == ['run', 'services', 'list']:
                return 'loungcheu' if existing else ''
            if command[1:5] == ['artifacts', 'docker', 'images', 'describe']:
                return digest
            if command[1:4] == ['run', 'services', 'describe']:
                return json.dumps({'status': {'url': 'https://loungcheu-test.run.app',
                    'latestReadyRevisionName': 'loungcheu-00002-test', 'latestCreatedRevisionName': 'loungcheu-00002-test'}})
            return ''
        return run

    def execute(self, runner, confirmation='cpe334-team07'):
        with tempfile.TemporaryDirectory() as folder, patch.object(deploy, 'run', side_effect=runner) as mocked:
            receipt = Path(folder) / 'receipt.json'
            deploy.execute(config(), SHA, confirmation, receipt)
            return mocked.call_args_list, json.loads(receipt.read_text())

    def test_success_orders_migration_before_service_and_sets_real_https_origin(self):
        calls, receipt = self.execute(self.fake_run())
        commands = [call.args[0] for call in calls]
        migrate = next(i for i, command in enumerate(commands) if command[1:4] == ['run', 'jobs', 'execute'])
        release = next(i for i, command in enumerate(commands) if command[1:3] == ['run', 'deploy'])
        self.assertLess(migrate, release)
        self.assertTrue(all('--image=' + deploy.image_path(config()) + '@' + DIGEST in command
            for command in commands if command[1:4] == ['run', 'jobs', 'deploy'] or command[1:3] == ['run', 'deploy']))
        self.assertTrue(any('--update-env-vars=APP_ORIGIN=https://loungcheu-test.run.app' in command for command in commands))
        self.assertEqual(receipt['sourceCommit'], SHA)
        self.assertEqual(receipt['state'], 'private-deployment-awaiting-owner-public-access-and-smoke')

    def test_failed_migration_never_deploys_service(self):
        runner = self.fake_run(failure=lambda c: c[1:4] == ['run', 'jobs', 'execute'])
        with patch.object(deploy, 'run', side_effect=runner) as mocked, self.assertRaises(deploy.DeploymentError):
            deploy.execute(config(), SHA, 'cpe334-team07', 'unused.json')
        self.assertFalse(any(call.args[0][1:3] == ['run', 'deploy'] for call in mocked.call_args_list))

    def test_failed_build_never_runs_migrations(self):
        runner = self.fake_run(failure=lambda c: c[1:3] == ['builds', 'submit'])
        with patch.object(deploy, 'run', side_effect=runner) as mocked, self.assertRaises(deploy.DeploymentError):
            deploy.execute(config(), SHA, 'cpe334-team07', 'unused.json')
        self.assertFalse(any(call.args[0][1:3] == ['run', 'jobs'] for call in mocked.call_args_list))

    def test_guards_stop_existing_service_wrong_branch_dirty_tree_and_bad_digest(self):
        for runner in (self.fake_run(existing=True), self.fake_run(branch='feature/test'),
                       self.fake_run(dirty=True), self.fake_run(digest='missing')):
            with self.subTest(runner=runner), self.assertRaises(deploy.DeploymentError):
                self.execute(runner)

    def test_project_confirmation_checked_before_any_commands(self):
        with patch.object(deploy, 'run') as runner, self.assertRaises(deploy.DeploymentError):
            deploy.execute(config(), SHA, 'another-project', 'unused.json')
        runner.assert_not_called()

    def test_subprocess_failure_does_not_print_raw_driver_output(self):
        with patch.object(deploy.subprocess, 'run', side_effect=subprocess.CalledProcessError(1, ['gcloud'], stderr='PRIVATE-PASSWORD')):
            with self.assertRaises(deploy.DeploymentError):
                deploy.run(['gcloud', 'run', 'services', 'list', '--project=cpe334-team07'])
        self.assertNotIn('PRIVATE-PASSWORD', self.output.getvalue())

    def test_origin_rejects_injection_credentials_paths_and_non_cloud_origins(self):
        for origin in ('http://service.run.app', 'https://service.run.app/path', 'https://user:pass@service.run.app',
                       'https://service.run.app,OTHER=x', 'https://external.example', 'https://service.run.app?x=1'):
            with self.subTest(origin=origin), self.assertRaises(deploy.DeploymentError):
                deploy.validate_origin(origin)


if __name__ == '__main__':
    unittest.main()
