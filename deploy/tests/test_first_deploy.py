import contextlib
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import course_cloud as course
import first_deploy

SHA = 'a' * 40
OLD_SHA = 'b' * 40
IMAGE = course.image_base() + '@sha256:' + 'c' * 64
URL = 'https://scccd8b05-example-as.a.run.app'
CONFIG = Path(__file__).resolve().parents[1] / 'gcp.example.json'


class CourseDeploymentTests(unittest.TestCase):
    def setUp(self):
        environment = patch.dict(os.environ, {}, clear=True)
        environment.start()
        self.addCleanup(environment.stop)
        self.output = io.StringIO()
        redirect = contextlib.redirect_stdout(self.output)
        redirect.__enter__()
        self.addCleanup(redirect.__exit__, None, None, None)

    def config(self):
        return course.load_config(CONFIG)

    def response(self, failure=None, dirty=False, branch='main', image=IMAGE):
        def run(command):
            if failure and failure(command):
                raise course.DeploymentError('simulated failure')
            if command[:3] == ['git', 'rev-parse', 'HEAD']:
                return SHA
            if command[:3] == ['git', 'branch', '--show-current']:
                return branch
            if command[:2] == ['git', 'status']:
                return ' M file' if dirty else ''
            if command[1:4] == ['run', 'services', 'describe']:
                return json.dumps({'status': {'url': URL, 'latestReadyRevisionName': 'scccd8b05-00002-ready',
                                              'latestCreatedRevisionName': 'scccd8b05-00002-ready'}})
            if command[1:4] == ['run', 'jobs', 'describe']:
                return 'scccd8b05-migrate'
            if command[1:5] == ['artifacts', 'docker', 'images', 'describe']:
                return image
            return ''
        return run

    def execute(self, mode='first', rollback=False, commit=SHA, **kwargs):
        with tempfile.TemporaryDirectory() as folder, patch.object(course, 'run', side_effect=self.response(**kwargs)) as run, patch.object(course.smoke_test, 'check') as smoke:
            result = course.execute(self.config(), commit, mode, rollback, course.PROJECT, Path(folder)/'receipt.json')
            return [call.args[0] for call in run.call_args_list], result, smoke.call_count

    def test_preview_uses_no_subprocess_or_http_and_preserves_portal_settings(self):
        with patch.object(course.subprocess, 'run', side_effect=AssertionError('offline only')), patch.object(course.smoke_test, 'check', side_effect=AssertionError('offline only')):
            self.assertEqual(first_deploy.main(['--commit', SHA]), 0)
        text = self.output.getvalue()
        self.assertIn('OFFLINE PLAN ONLY', text)
        self.assertIn('--update-env-vars=', text)
        self.assertIn('--update-secrets=', text)
        for forbidden in ('--set-env-vars', '--set-secrets', 'services list', 'services enable',
                          'add-iam-policy-binding', 'sql instances', 'secrets versions', 'run deploy', 'jobs deploy'):
            self.assertNotIn(forbidden, text)

    def test_fixed_scope_rejects_another_project_region_or_team(self):
        for key, wrong in (('project', 'other-project'), ('region', 'us-central1'), ('service', 'another-team'),
                           ('migration_job', 'other-migrate'), ('database_secret', 'other-db:latest')):
            with self.subTest(key=key), tempfile.TemporaryDirectory() as folder:
                config = self.config()
                config[key] = wrong
                path = Path(folder)/'config.json'
                path.write_text(json.dumps(config))
                with self.assertRaises(course.DeploymentError):
                    course.load_config(path)

    def test_secret_reference_accepts_only_allocated_slots_and_numeric_versions(self):
        for value in ('other-secret:1', 'scccd8b05-app-secret-6:1', 'scccd8b05-app-secret-1:latest',
                      'a private password', 'postgresql://private@host/db'):
            with self.subTest(value=value), patch.dict(os.environ, {'SESSION_SECRET_REF': value}), self.assertRaises(course.DeploymentError):
                self.config()
        with patch.dict(os.environ, {'SESSION_SECRET_REF': 'scccd8b05-app-secret-3:2'}):
            self.assertEqual(self.config()['session_secret'], 'scccd8b05-app-secret-3:2')

    def test_wrong_environment_scope_fails_before_commands(self):
        for variable in ('PROJECT_ID', 'REGION', 'SERVICE_NAME', 'MIGRATE_JOB_NAME'):
            with self.subTest(variable=variable), patch.dict(os.environ, {variable: 'wrong-value'}), patch.object(course, 'run') as run:
                self.assertEqual(first_deploy.main(['--commit', SHA]), 1)
                run.assert_not_called()

    def test_legacy_config_schema_is_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder)/'old.json'
            path.write_text(json.dumps({**self.config(), 'runtime_service_account': 'old@other-project.iam.gserviceaccount.com'}))
            with self.assertRaises(course.DeploymentError):
                course.load_config(path)

    def test_normal_deploy_builds_then_migrates_then_updates_exact_team(self):
        commands, receipt, smokes = self.execute()
        index = lambda predicate: next(i for i, command in enumerate(commands) if predicate(command))
        self.assertLess(index(lambda c: c[:2] == ['docker', 'push']), index(lambda c: c[1:4] == ['run', 'jobs', 'execute']))
        self.assertLess(index(lambda c: c[1:4] == ['run', 'jobs', 'execute']), index(lambda c: c[1:4] == ['run', 'services', 'update']))
        self.assertTrue(all('--project=' + course.PROJECT in command for command in commands if command[0] == 'gcloud'))
        self.assertEqual(receipt['image'], IMAGE)
        self.assertEqual(receipt['imageTag'], SHA)
        self.assertEqual(receipt['state'], 'updated-read-only-smoke-passed')
        self.assertEqual(smokes, 1)

    def test_job_uses_actual_npm_scripts_and_correct_seed_environment(self):
        command = course.migration_command(self.config(), IMAGE)
        self.assertIn('--args=^|^-c|npm run db:migrate && npm run db:seed', command)
        secrets = next(arg for arg in command if arg.startswith('--update-secrets='))
        self.assertIn('DEMO_SEED_PASSWORD=scccd8b05-demo-password:latest', secrets)
        self.assertNotIn('SESSION_SECRET=', secrets)
        self.assertNotIn('prisma:seed', ' '.join(command))

    def test_service_sets_required_runtime_config_without_replacing_existing_settings(self):
        command = course.service_command(self.config(), SHA, IMAGE, URL)
        settings = next(arg for arg in command if arg.startswith('--update-env-vars='))
        self.assertIn('APP_ORIGIN=' + URL, settings)
        self.assertIn('APP_VERSION=' + SHA, settings)
        self.assertIn('SESSION_COOKIE_SECURE=true', settings)
        self.assertIn('--update-secrets=DATABASE_URL=scccd8b05-database-url:latest,SESSION_SECRET=scccd8b05-app-secret-1:1', command)
        self.assertIn('--command=node', command)
        self.assertIn('--args=dist/server.js', command)

    def test_rollback_updates_existing_image_without_build_or_migration(self):
        commands, receipt, smokes = self.execute(mode='release', rollback=True, commit=OLD_SHA)
        self.assertFalse(any(c[0] == 'docker' or c[1:4] in (['run', 'jobs', 'update'], ['run', 'jobs', 'execute']) for c in commands))
        self.assertTrue(any('APP_VERSION=' + OLD_SHA in ' '.join(c) for c in commands))
        self.assertTrue(receipt['rollback'])
        self.assertEqual(receipt['state'], 'updated-smoke-pending')
        self.assertEqual(smokes, 0)

    def test_release_normal_does_not_rebuild_workflow_image(self):
        commands, _, _ = self.execute(mode='release')
        self.assertFalse(any(c[0] == 'docker' for c in commands))
        self.assertTrue(any(c[1:4] == ['run', 'jobs', 'execute'] for c in commands))

    def test_failed_migration_does_not_update_service(self):
        failure = lambda c: c[1:4] == ['run', 'jobs', 'execute']
        with patch.object(course, 'run', side_effect=self.response(failure=failure)) as run, self.assertRaises(course.DeploymentError):
            course.execute(self.config(), SHA, 'first', False, course.PROJECT, 'unused.json')
        self.assertFalse(any(c.args[0][1:4] == ['run', 'services', 'update'] for c in run.call_args_list))

    def test_failed_build_does_not_migrate(self):
        with patch.object(course, 'run', side_effect=self.response(failure=lambda c: c[:2] == ['docker', 'build'])) as run, self.assertRaises(course.DeploymentError):
            course.execute(self.config(), SHA, 'first', False, course.PROJECT, 'unused.json')
        self.assertFalse(any(c.args[0][1:4] == ['run', 'jobs', 'execute'] for c in run.call_args_list))

    def test_foreign_or_incomplete_digest_is_rejected_before_mutating_job(self):
        for image in (IMAGE.replace('/scccd8b05/', '/other-team/'), course.image_base() + '@sha256:abc', 'malformed'):
            with self.subTest(image=image), patch.object(course, 'run', side_effect=self.response(image=image)) as run, self.assertRaises(course.DeploymentError):
                course.execute(self.config(), SHA, 'release', False, course.PROJECT, 'unused.json')
            self.assertFalse(any(c.args[0][1:4] == ['run', 'jobs', 'update'] for c in run.call_args_list))

    def test_branch_commit_and_dirty_tree_guards(self):
        for options in ({'branch': 'feature/test'}, {'dirty': True}):
            with self.subTest(options=options), self.assertRaises(course.DeploymentError):
                self.execute(**options)
        with self.assertRaises(course.DeploymentError):
            self.execute(commit=OLD_SHA)

    def test_detached_github_main_checkout_is_supported(self):
        with patch.dict(os.environ, {'GITHUB_ACTIONS': 'true', 'GITHUB_REF': 'refs/heads/main', 'GITHUB_SHA': SHA}):
            commands, _, _ = self.execute(mode='release', branch='')
        self.assertTrue(any(c[1:4] == ['run', 'services', 'update'] for c in commands))

    def test_wrong_project_confirmation_stops_before_commands(self):
        with patch.object(course, 'run') as run, self.assertRaises(course.DeploymentError):
            course.execute(self.config(), SHA, 'first', False, 'wrong-project', 'unused.json')
        run.assert_not_called()

    def test_no_receipt_when_smoke_fails(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(course, 'run', side_effect=self.response()), patch.object(course.smoke_test, 'check', side_effect=course.smoke_test.SmokeError('failed')):
            target = Path(folder)/'receipt.json'
            with self.assertRaises(course.smoke_test.SmokeError):
                course.execute(self.config(), SHA, 'first', False, course.PROJECT, target)
            self.assertFalse(target.exists())

    def test_driver_error_output_is_not_disclosed(self):
        with patch.object(course.subprocess, 'run', side_effect=subprocess.CalledProcessError(1, ['gcloud'], stderr='PRIVATE-PASSWORD')):
            with self.assertRaises(course.DeploymentError):
                course.run(['gcloud', 'run', 'services', 'describe', course.PREFIX])
        self.assertNotIn('PRIVATE-PASSWORD', self.output.getvalue())

    def test_url_and_tag_injections_are_rejected(self):
        for value in ('abc123', SHA + ';id', 'A' * 40):
            with self.subTest(value=value), self.assertRaises(course.DeploymentError):
                course.validate_sha(value)
        for value in ('http://service.run.app', 'https://user:pass@service.run.app', URL + '/path', URL + '?x=1'):
            with self.subTest(value=value), self.assertRaises(course.DeploymentError):
                course.origin(value)

    def test_github_environment_contains_only_validated_deployment_metadata(self):
        with tempfile.TemporaryDirectory() as folder:
            target = Path(folder)/'github-env'
            with patch.dict(os.environ, {'GITHUB_ENV': str(target)}):
                self.execute(mode='release')
            text = target.read_text()
        self.assertIn('SERVICE_URL=' + URL, text)
        self.assertIn('DEPLOYED_IMAGE=' + IMAGE, text)
        self.assertNotIn('SECRET', text)


if __name__ == '__main__':
    unittest.main()
