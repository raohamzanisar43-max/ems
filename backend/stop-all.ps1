# Stops all services + gateway started by run-all.ps1
$root = $PSScriptRoot
$pidFile = Join-Path $root ".run_pids.txt"

if (-not (Test-Path $pidFile)) {
    Write-Output "No .run_pids.txt found - nothing to stop (or it was already cleaned up)."
    exit
}

Get-Content $pidFile | ForEach-Object {
    $parts = $_ -split " ", 2
    $procId = $parts[0]
    $name = $parts[1]
    try {
        Stop-Process -Id $procId -Force -ErrorAction Stop
        Write-Output "Stopped $name (pid $procId)"
    } catch {
        Write-Output "$name (pid $procId) already stopped"
    }
}

Remove-Item $pidFile
