
Write-Host "Initializing Git..."
git init

Write-Host "Adding Remote..."
git remote add origin https://github.com/JaDi03/arc-wallet

Write-Host "Checking .gitignore..."
if (-not (Test-Path .gitignore)) {
    Write-Error ".gitignore missing! Aborting to prevent leaking env vars."
    exit 1
}

Write-Host "Adding files..."
git add .

Write-Host "Committing..."
git commit -m "feat: Initial MSCA Wallet implementation with Vercel support"

Write-Host "Renaming branch to main..."
git branch -M main

Write-Host "Pushing to GitHub..."
git push -u origin main

Write-Host "Done!"
