# Compatibility wrapper: provision only a test database on the configured
# application PostgreSQL instance. This no longer starts a separate cluster.
[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
Push-Location $repo
try {
  & node scripts/setup-test-db.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Test database setup failed.' }
} finally { Pop-Location }
