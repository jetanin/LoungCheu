param([Parameter(Mandatory=$true)][ValidatePattern('^[A-Za-z0-9][A-Za-z0-9_-]*$')][string]$Label)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$destination = Join-Path $repo "docs/deliverable-1/evidence/auth/$Label"
if (Test-Path -LiteralPath $destination) { throw 'Evidence label already exists; choose a new label.' }
New-Item -ItemType Directory -Path $destination -Force | Out-Null
Push-Location $repo
try {
  $files = @(& rg --files --hidden -g '!.git/**' -g '!docs/**' -g '!.local/**' -g '!node_modules/**' -g '!README.md')
  $manifest = foreach ($relative in ($files | Sort-Object -Unique)) {
    $hash = (Get-FileHash -LiteralPath $relative -Algorithm SHA256).Hash.ToLowerInvariant()
    "$hash  $($relative.Replace('\','/'))"
  }
  $baseline = & git rev-parse HEAD
  $status = & git status --short --branch
  [IO.File]::WriteAllLines((Join-Path $destination 'sha256.txt'), @("Parent commit: $baseline", 'Tested source: uncommitted working tree; SHA256 manifest below') + $manifest)
  [IO.File]::WriteAllLines((Join-Path $destination 'git-status.txt'), $status)
  Copy-Item -LiteralPath 'server/src/middleware/auth.ts' -Destination (Join-Path $destination 'auth.ts.txt')
  Copy-Item -LiteralPath 'server/tests/integration/auth.test.ts' -Destination (Join-Path $destination 'auth.test.ts.txt')
  Copy-Item -LiteralPath 'server/src/app.ts' -Destination (Join-Path $destination 'app.ts.txt')
  Copy-Item -LiteralPath 'client/src/app/App.tsx' -Destination (Join-Path $destination 'App.tsx.txt')
  Copy-Item -LiteralPath 'tests/e2e/auth.spec.ts' -Destination (Join-Path $destination 'auth.spec.ts.txt')
  Copy-Item -LiteralPath 'server/src/config/env.ts' -Destination (Join-Path $destination 'env.ts.txt')
  Copy-Item -LiteralPath 'server/src/config/database-url.ts' -Destination (Join-Path $destination 'database-url.ts.txt')
  Copy-Item -LiteralPath 'server/src/shared/errors.ts' -Destination (Join-Path $destination 'errors.ts.txt')
} finally { Pop-Location }
Write-Output "Captured source manifest and auth guard: $Label"
