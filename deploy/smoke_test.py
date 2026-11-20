"""Read-only checks for LoungCheu; uses no credentials or business writes."""
import argparse
import json
import time
import urllib.error
import urllib.request
from urllib.parse import urlsplit


class SmokeError(Exception):
    pass


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def request(base, path):
    req = urllib.request.Request(base + path, method='GET', headers={'Accept': 'application/json, text/html'})
    opener = urllib.request.build_opener(NoRedirect)
    try:
        with opener.open(req, timeout=15) as response:
            return response.status, response.read()
    except urllib.error.HTTPError as error:
        return error.code, error.read()


def check(base, expected_commit, attempts=5, delay=3, allow_local_http=False):
    if attempts < 1 or delay < 0:
        raise SmokeError('Invalid retry settings')
    parsed = urlsplit(base)
    valid_scheme = parsed.scheme == 'https' or (allow_local_http and parsed.scheme == 'http' and parsed.hostname == '127.0.0.1')
    if (not valid_scheme or not parsed.hostname or parsed.username or parsed.password
            or parsed.path not in ('', '/') or parsed.query or parsed.fragment):
        raise SmokeError('Use an HTTPS origin, or explicitly allow loopback HTTP for local tests')
    if len(expected_commit) != 40 or any(c not in '0123456789abcdef' for c in expected_commit):
        raise SmokeError('Expected commit must be a full SHA')
    base = base.rstrip('/')
    checks = [('/api/ready', 200, lambda b: json.loads(b).get('data') == {'status': 'ready', 'db': 'connected', 'version': expected_commit}),
              ('/api/health', 200, lambda b: json.loads(b).get('data') == {'status': 'ok', 'version': expected_commit}),
              ('/login', 200, lambda b: b'<div id="root">' in b),
              ('/api/events', 401, lambda b: json.loads(b).get('error', {}).get('code') == 'AUTH_REQUIRED'),
              ('/api/not-a-real-route', 404, lambda b: json.loads(b).get('error', {}).get('code') == 'ROUTE_NOT_FOUND')]
    for path, expected_status, predicate in checks:
        for attempt in range(attempts):
            try:
                status, body = request(base, path)
                if status == expected_status and predicate(body):
                    print('PASS GET ' + path)
                    break
            except (urllib.error.URLError, TimeoutError, OSError, ValueError, TypeError, AttributeError):
                pass
            if attempt + 1 == attempts:
                raise SmokeError('Failed GET ' + path + '; response bodies omitted')
            time.sleep(delay)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('url')
    parser.add_argument('--expected-commit', required=True)
    parser.add_argument('--allow-local-http', action='store_true')
    args = parser.parse_args(argv)
    try:
        check(args.url, args.expected_commit, allow_local_http=args.allow_local_http)
    except (SmokeError, ValueError):
        print('Smoke failed; inspect URL, release version and service status. No response bodies or credentials printed.')
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
