#!/bin/bash

# Instalar dependencias necesarias
npm install pdf-parse

# Verificar si pdftotext está disponible
if ! command -v pdftotext &> /dev/null
then
    echo "pdftotext no está instalado. Instalando..."
    
    # Detectar sistema operativo
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo apt-get update
        sudo apt-get install -y poppler-utils
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install poppler
    elif [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "win32" ]]; then
        # Windows
        echo "En Windows, por favor instala pdftotext manualmente desde: https://www.xpdfreader.com/download.html"
    else
        echo "Sistema operativo no reconocido. Por favor, instala pdftotext manualmente."
    fi
else
    echo "pdftotext ya está instalado."
fi

echo "Configuración completada."
