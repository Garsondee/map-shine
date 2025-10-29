# Basic diagnostic script
Write-Host "Script is running!" -ForegroundColor Green
Write-Host "Current directory: $PWD"
Write-Host "Foundry path exists: $(Test-Path 'C:\Program Files\Foundry Virtual Tabletop\resources\app\main.js')"
Write-Host "Node is available: $(Get-Command node -ErrorAction SilentlyContinue)"
