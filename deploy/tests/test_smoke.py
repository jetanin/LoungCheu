import contextlib
import io
import json
from pathlib import Path
import sys
import unittest
from unittest.mock import patch
import urllib.error
import urllib.request

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import smoke_test as smoke

SHA = 'a' * 40


def responses(path, version=SHA):
    if path == '/api/ready':
        return 200, json.dumps({'data': {'status': 'ready', 'db': 'connected', 'version': version}}).encode()
    if path == '/api/health':
        return 200, json.dumps({'data': {'status': 'ok', 'version': version}}).encode()
    if path == '/login':
        return 200, b'<html><div id="root"></div></html>'
    if path == '/api/events':
        return 401, b'{"error":{"code":"AUTH_REQUIRED"}}'
    return 404, b'{"error":{"code":"ROUTE_NOT_FOUND"}}'


class SmokeTests(unittest.TestCase):
    def setUp(self):
        self.output = io.StringIO()
        capture = contextlib.redirect_stdout(self.output)
        capture.__enter__()
        self.addCleanup(capture.__exit__, None, None, None)

    def test_current_api_envelope_and_read_only_paths(self):
        with patch.object(smoke, 'request', side_effect=lambda base, path: responses(path)) as request:
            smoke.check('https://service.run.app', SHA, attempts=1)
        self.assertEqual([call.args[1] for call in request.call_args_list],
                         ['/api/ready', '/api/health', '/login', '/api/events', '/api/not-a-real-route'])

    def test_stale_version_fails_without_printing_body(self):
        with patch.object(smoke, 'request', side_effect=lambda base, path: responses(path, 'b' * 40)), self.assertRaises(smoke.SmokeError):
            smoke.check('https://service.run.app', SHA, attempts=1)
        self.assertNotIn('b' * 40, self.output.getvalue())

    def test_retries_cold_start_then_succeeds(self):
        calls = 0
        def request(base, path):
            nonlocal calls
            calls += 1
            if calls == 1:
                return 503, b'private error details'
            return responses(path)
        with patch.object(smoke, 'request', side_effect=request), patch.object(smoke.time, 'sleep') as sleep:
            smoke.check('https://service.run.app', SHA, attempts=2)
        sleep.assert_called_once_with(3)
        self.assertNotIn('private error details', self.output.getvalue())

    def test_network_errors_fail_after_bounded_retries(self):
        with patch.object(smoke, 'request', side_effect=urllib.error.URLError('private details')), patch.object(smoke.time, 'sleep'), self.assertRaises(smoke.SmokeError):
            smoke.check('https://service.run.app', SHA, attempts=2)

    def test_rejects_remote_http_credentials_paths_and_bad_commit(self):
        for origin in ('http://service.example', 'https://user:password@service.run.app', 'https://service.run.app/path'):
            with self.subTest(origin=origin), self.assertRaises(smoke.SmokeError):
                smoke.check(origin, SHA)
        with self.assertRaises(smoke.SmokeError):
            smoke.check('https://service.run.app', 'short')

    def test_only_explicit_loopback_http_allowed_for_local_testing(self):
        with patch.object(smoke, 'request', side_effect=lambda base, path: responses(path)):
            smoke.check('http://127.0.0.1:5195', SHA, allow_local_http=True)
        with self.assertRaises(smoke.SmokeError):
            smoke.check('http://127.0.0.1:5195', SHA)

    def test_html_or_auth_failures_are_not_mistaken_for_json_success(self):
        for body in (b'<html>login</html>', b'{}', b'null'):
            with self.subTest(body=body), patch.object(smoke, 'request', return_value=(200, body)), self.assertRaises(smoke.SmokeError):
                smoke.check('https://service.run.app', SHA, attempts=1)

    def test_redirects_are_not_followed(self):
        request = urllib.request.Request('https://service.run.app')
        self.assertIsNone(smoke.NoRedirect().redirect_request(request, None, 302, '', {}, 'https://elsewhere.example'))


if __name__ == '__main__':
    unittest.main()
