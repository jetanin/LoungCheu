# NFR-02 — deployed HTTPS session cookie attributes, 27 November 2026

Issue #51 (D2). Read-only check on the live app of the assessed candidate.

| Item | Value |
|---|---|
| Requirement | NFR-02: "production cookie เป็น HttpOnly/Secure/SameSite=Lax"; session หมดอายุภายใน 2 ชั่วโมง (SRS §7); AC-05 |
| Version | `/api/ready` → `ready`, `db: connected`, version `3f80759439d628d97ee0b1f33deb1b1d87c6d39d` (`v3.0.0-sprint-3`), revision `scccd8b05-00013-nwj` |
| Run by / time | Paphangkorn Luanseng (i3artuf), 2026-11-27 14:51:47 UTC (21:51:47 Asia/Bangkok) |
| Command | `curl -s -D - -o /dev/null https://scccd8b05-4d7hbszvwq-as.a.run.app/api/auth/csrf` and keep only the status, `Set-Cookie` and `Date` headers, with the cookie value replaced by `<redacted>` before it is shown or saved |
| Result | **PASS** |

Output (cookie value redacted; the real value was never written to a file):

```
HTTP/1.1 200 OK
set-cookie: loungcheu.sid=<redacted>; Path=/; Expires=Fri, 27 Nov 2026 16:51:47 GMT; HttpOnly; Secure; SameSite=Lax
date: Fri, 27 Nov 2026 14:51:47 GMT
```

| Attribute | Expected (NFR-02) | Observed |
|---|---|---|
| HttpOnly | yes | `HttpOnly` |
| Secure | yes (HTTPS) | `Secure` |
| SameSite | Lax | `SameSite=Lax` |
| Lifetime | ≤ 2 hours | `Expires` = `Date` + 2 h 00 min |

## Scope and limits

- The cookie checked is the session cookie issued before login by `GET /api/auth/csrf`. The app sets one cookie configuration for every session (`server/src/app.ts:51` `cookieOptions`, used by the session middleware at `server/src/app.ts:64`), and login rotates the session with the same options (TEST-05).
- The cookie after a real login was not observed here because that needs a test-account password. An optional extra confirmation: log in on the live URL, open DevTools → Application → Cookies, and check the same four attributes without capturing the value.
- Logout invalidation and the 2-hour expiry rule are covered by the automated F-01 tests (TEST-03–TEST-06), which pass in the regression of `3f80759` (Deploy run 45994749187).
