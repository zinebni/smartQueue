# ================================
# Smart Queue - Lanceur Multi-Écrans
# ================================
# Ce script lance plusieurs écrans d'affichage public
# en mode plein écran pour chaque service

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Smart Queue - Lanceur Multi-Écrans" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que l'application est démarrée
Write-Host "Vérification de l'application..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 3 -UseBasicParsing
    Write-Host "✅ Application en cours d'exécution" -ForegroundColor Green
} catch {
    Write-Host "❌ L'application n'est pas démarrée" -ForegroundColor Red
    Write-Host "Veuillez d'abord exécuter: .\start.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Sélectionnez les écrans à afficher:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Tous les services (Hall principal)" -ForegroundColor White
Write-Host "2. Gestion de Compte" -ForegroundColor White
Write-Host "3. Crédit / Prêt" -ForegroundColor White
Write-Host "4. Inscription" -ForegroundColor White
Write-Host "5. Consultation" -ForegroundColor White
Write-Host "6. Paiement" -ForegroundColor White
Write-Host "7. Services Généraux" -ForegroundColor White
Write-Host "8. TOUS les écrans (mode démo)" -ForegroundColor Yellow
Write-Host "0. Quitter" -ForegroundColor Red
Write-Host ""

$choice = Read-Host "Votre choix (0-8)"

function Open-DisplayScreen {
    param (
        [string]$service,
        [string]$name
    )
    
    $url = if ($service -eq "all") {
        "http://localhost:3000/display"
    } else {
        "http://localhost:3000/display/$service"
    }
    
    Write-Host "🖥️  Ouverture: $name..." -ForegroundColor Green
    
    # Essayer Chrome/Edge en premier (mode kiosque)
    $chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
    $edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    
    if (Test-Path $chromePath) {
        Start-Process $chromePath "--new-window --start-fullscreen $url"
    } elseif (Test-Path $edgePath) {
        Start-Process $edgePath "--new-window --start-fullscreen $url"
    } else {
        # Utiliser le navigateur par défaut
        Start-Process $url
        Write-Host "   💡 Appuyez sur F11 pour le mode plein écran" -ForegroundColor Yellow
    }
    
    Start-Sleep -Seconds 1
}

switch ($choice) {
    "1" {
        Open-DisplayScreen -service "all" -name "Tous les services"
    }
    "2" {
        Open-DisplayScreen -service "account" -name "Gestion de Compte"
    }
    "3" {
        Open-DisplayScreen -service "loan" -name "Crédit / Prêt"
    }
    "4" {
        Open-DisplayScreen -service "registration" -name "Inscription"
    }
    "5" {
        Open-DisplayScreen -service "consultation" -name "Consultation"
    }
    "6" {
        Open-DisplayScreen -service "payment" -name "Paiement"
    }
    "7" {
        Open-DisplayScreen -service "general" -name "Services Généraux"
    }
    "8" {
        Write-Host ""
        Write-Host "🚀 Lancement de tous les écrans..." -ForegroundColor Yellow
        Write-Host ""
        
        Open-DisplayScreen -service "all" -name "Tous les services (Hall)"
        Open-DisplayScreen -service "account" -name "Gestion de Compte"
        Open-DisplayScreen -service "loan" -name "Crédit / Prêt"
        Open-DisplayScreen -service "payment" -name "Paiement"
        Open-DisplayScreen -service "consultation" -name "Consultation"
        
        Write-Host ""
        Write-Host "✅ Tous les écrans sont ouverts!" -ForegroundColor Green
        Write-Host "   Organisez les fenêtres sur vos différents écrans" -ForegroundColor Cyan
    }
    "0" {
        Write-Host "Au revoir!" -ForegroundColor Cyan
        exit 0
    }
    default {
        Write-Host "❌ Choix invalide" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "✅ Écran(s) ouvert(s)!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Conseils:" -ForegroundColor Yellow
Write-Host "   - Appuyez sur F11 pour le mode plein écran" -ForegroundColor White
Write-Host "   - Créez des tickets: http://localhost:3000/create-ticket" -ForegroundColor White
Write-Host "   - Console agent: http://localhost:3000/agent" -ForegroundColor White
Write-Host ""
