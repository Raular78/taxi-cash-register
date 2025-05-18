const fs = require('fs');
const path = require('path');

// Función para obtener todos los archivos .ts y .tsx en un directorio y sus subdirectorios
function getAllFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      // Recursivamente buscar en subdirectorios
      results = results.concat(getAllFiles(filePath));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(filePath);
    }
  });
  
  return results;
}

// Función para corregir las rutas de importación en un archivo
function fixPathsInFile(filePath) {
  console.log(`Procesando: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Buscar rutas con barras invertidas y reemplazarlas con barras normales
  const backslashRegex = /from\s+["']([^"']*\\[^"']*)["']/g;
  let modified = false;
  
  let match;
  while ((match = backslashRegex.exec(content)) !== null) {
    const originalPath = match[1];
    const fixedPath = originalPath.replace(/\\/g, '/');
    
    // Reemplazar solo la ruta, no todo el from
    content = content.replace(originalPath, fixedPath);
    modified = true;
  }
  
  // También buscar en importaciones con llaves
  const importRegex = /import\s+{[^}]*}\s+from\s+["']([^"']*\\[^"']*)["']/g;
  while ((match = importRegex.exec(content)) !== null) {
    const originalPath = match[1];
    const fixedPath = originalPath.replace(/\\/g, '/');
    
    // Reemplazar solo la ruta, no todo el import
    content = content.replace(originalPath, fixedPath);
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Corregido: ${filePath}`);
    return true;
  }
  
  return false;
}

// Procesar todos los archivos en app/ y components/
console.log('Iniciando corrección de rutas...');
const appFiles = getAllFiles('./app');
const componentFiles = getAllFiles('./components');
const libFiles = getAllFiles('./lib');
const allFiles = [...appFiles, ...componentFiles, ...libFiles];

let fixedCount = 0;
allFiles.forEach(file => {
  if (fixPathsInFile(file)) {
    fixedCount++;
  }
});

console.log(`Proceso completado. Se corrigieron ${fixedCount} archivos.`);