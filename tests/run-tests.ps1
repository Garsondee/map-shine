# Map Shine Headless Test Runner

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('all', 'ui', 'config', 'managers', 'textures')]
    [string]$Suite = 'all',
    [Parameter(Mandatory=$false)]
    [int]$Timeout = 90000
)

$FoundryPath = "C:\Program Files\Foundry Virtual Tabletop\resources\app\main.js"
$World = "map-development-world"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "    MAP SHINE AUTOMATED TEST RUNNER" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-ColorOutput "📦 Test Suite: $Suite" "Yellow"
Write-ColorOutput "⏱️  Timeout: $($Timeout)ms" "Yellow"
Write-ColorOutput "🌍 World: $World" "Yellow"
Write-Host ""

if (-not (Test-Path $FoundryPath)) {
    Write-ColorOutput "❌ ERROR: Foundry VTT not found at: $FoundryPath" "Red"
    Write-Host ""
    Write-Host "Please edit this script and set the correct FoundryPath variable."
    exit 1
}

$env:MAP_SHINE_TEST_MODE = "true"
$env:MAP_SHINE_TEST_SUITE = $Suite

Write-ColorOutput "🚀 Starting Foundry VTT in headless mode..." "Green"
Write-Host ""
Write-Host "───────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

$exitCode = 1

try {
    $process = Start-Process -FilePath "node" -ArgumentList "`"$FoundryPath`"", "--headless", "--world=$World", "--timeout=$Timeout" -NoNewWindow -PassThru -Wait
    $exitCode = $process.ExitCode
    Write-Host ""
    Write-Host "───────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host ""
    if ($exitCode -eq 0) {
        Write-ColorOutput "✅ Tests completed successfully!" "Green"
    } else {
        Write-ColorOutput "❌ Tests failed with exit code: $exitCode" "Red"
    }
}
catch {
    Write-Host ""
    Write-Host "───────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host ""
    Write-ColorOutput "❌ FATAL ERROR: $($_.Exception.Message)" "Red"
    Write-Host ""
    Write-Host $_.Exception.StackTrace -ForegroundColor DarkRed
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

exit $exitCode
