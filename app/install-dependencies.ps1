# Script de PowerShell para instalar dependencias en Windows

# Instalar dependencias de npm
Write-Host "Instalando dependencias de npm..."
npm install pdf-parse

# Verificar si pdftotext está disponible
$pdftotext = Get-Command pdftotext -ErrorAction SilentlyContinue

if ($null -eq $pdftotext) {
    Write-Host "pdftotext no está instalado."
    Write-Host "Por favor, descarga e instala Xpdf Tools desde: https://www.xpdfreader.com/download.html"
    Write-Host "Asegúrate de añadir la carpeta bin a tu PATH después de la instalación."
    
    # Preguntar si desea abrir la página de descarga
    $openBrowser = Read-Host "¿Quieres abrir la página de descarga ahora? (s/n)"
    if ($openBrowser -eq "s") {
        Start-Process "https://www.xpdfreader.com/download.html"
    }
} else {
    Write-Host "pdftotext ya está instalado."
}

Write-Host "Configuración completada."
