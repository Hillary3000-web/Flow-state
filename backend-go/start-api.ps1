# start-api.ps1
# Builds and starts the FlowState Go API server.
# Run this from an Administrator PowerShell session.

$ErrorActionPreference = "Stop"
$scriptDir = $PSScriptRoot

Set-Location $scriptDir

Write-Host "Checking PostgreSQL service..." -ForegroundColor Cyan
$pgRunning = (Test-NetConnection -ComputerName 127.0.0.1 -Port 5432 -WarningAction SilentlyContinue).TcpTestSucceeded
if (-not $pgRunning) {
    Write-Host "PostgreSQL is not running. Starting local PostgreSQL database..." -ForegroundColor Yellow
    & "$PSScriptRoot\start-db.ps1"
    Start-Sleep -Seconds 2
} else {
    Write-Host "PostgreSQL is online and ready." -ForegroundColor Green
}

Write-Host "Building FlowState API..." -ForegroundColor Cyan
go build -o api.exe ./cmd/api
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed." -ForegroundColor Red
    exit 1
}

Write-Host "Starting FlowState API on http://localhost:8080 ..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop." -ForegroundColor DarkGray
.\api.exe
