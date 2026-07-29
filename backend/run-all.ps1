# Starts the Novu Lab backend - a single Django project, one process, one port: 8080
# Usage: powershell -ExecutionPolicy Bypass -File .\run-all.ps1
# Stop with: .\stop-all.ps1

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$py = Join-Path $root "..\.venv\Scripts\python.exe"
$logs = Join-Path $root ".run_logs"
New-Item -ItemType Directory -Force -Path $logs | Out-Null

$pidFile = Join-Path $root ".run_pids.txt"
if (Test-Path $pidFile) { Remove-Item $pidFile }

$appDir = Join-Path $root "novulab"
$log = Join-Path $logs "novulab.log"
$p = Start-Process -FilePath $py `
    -ArgumentList "manage.py", "runserver", "127.0.0.1:8080", "--noreload" `
    -WorkingDirectory $appDir `
    -NoNewWindow -PassThru `
    -RedirectStandardOutput $log -RedirectStandardError $log
"$($p.Id) novulab" | Out-File -FilePath $pidFile -Append -Encoding utf8
Write-Output "Started Novu Lab backend on port 8080 (pid $($p.Id))"

Start-Sleep -Seconds 2
Write-Output ""
Write-Output "Backend: http://127.0.0.1:8080"
Write-Output "Login with username: admin / password: admin  ->  POST http://127.0.0.1:8080/api/auth/token/"
Write-Output "Logs: $log"
Write-Output "To stop: .\stop-all.ps1"
