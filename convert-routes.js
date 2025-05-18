const fs = require('fs');
const path = require('path');

// Función para buscar archivos de ruta con parámetros dinámicos
function findDynamicRoutes(dir) {
  const results = [];
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (file.startsWith('[') && file.endsWith(']')) {
        // Es un directorio de ruta dinámica
        const routeFiles = fs.readdirSync(filePath);
        for (const routeFile of routeFiles) {
          if (routeFile === 'route.ts') {
            results.push(path.join(filePath, routeFile));
          }
        }
      }
      // Buscar recursivamente en subdirectorios
      results.push(...findDynamicRoutes(filePath));
    }
  }
  
  return results;
}

// Función para convertir un archivo TS a JS
function convertTsToJs(filePath) {
  console.log(`Convirtiendo ${filePath} a JavaScript...`);
  
  // Leer el contenido del archivo TS
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Eliminar anotaciones de tipo
  const jsContent = content
    .replace(/: [^=,)]+/g, '') // Eliminar anotaciones de tipo simples
    .replace(/<[^>]+>/g, '') // Eliminar genéricos
    .replace(/interface [^{]+{[^}]+}/g, '') // Eliminar interfaces
    .replace(/type [^=]+=.+;/g, '') // Eliminar tipos
    .replace(/import type .+ from .+;/g, '') // Eliminar importaciones de tipo
    .replace(/import { type .+ } from .+;/g, '') // Eliminar importaciones de tipo con llaves
    .replace(/export type .+;/g, ''); // Eliminar exportaciones de tipo
  
  // Crear el nuevo archivo JS
  const jsFilePath = filePath.replace('.ts', '.js');
  fs.writeFileSync(jsFilePath, jsContent);
  
  // Eliminar el archivo TS original
  fs.unlinkSync(filePath);
  
  console.log(`Convertido: ${jsFilePath}`);
}

// Directorio principal de la aplicación
const appDir = path.join(__dirname, 'app');

// Encontrar todas las rutas dinámicas
const dynamicRoutes = findDynamicRoutes(appDir);
console.log(`Encontradas ${dynamicRoutes.length} rutas dinámicas.`);

// Convertir cada archivo
for (const route of dynamicRoutes) {
  convertTsToJs(route);
}

console.log('Conversión completada.');