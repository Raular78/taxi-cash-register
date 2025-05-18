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
function fixNextAuthImports(filePath) {
  console.log(`Procesando: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Buscar importaciones incorrectas de auth[...nextauth]/options
  const incorrectImportRegex = /['"](.*)auth\[\.\.\.nextauth\]\/options['"]/g;
  let modified = false;
  
  if (incorrectImportRegex.test(content)) {
    // Reemplazar con la ruta correcta
    content = content.replace(incorrectImportRegex, '"$1auth/options"');
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Corregido: ${filePath}`);
    return true;
  }
  
  return false;
}

// Procesar todos los archivos en app/
console.log('Iniciando corrección de importaciones de NextAuth...');
const appFiles = getAllFiles('./app');

let fixedCount = 0;
appFiles.forEach(file => {
  if (fixNextAuthImports(file)) {
    fixedCount++;
  }
});

console.log(`Proceso completado. Se corrigieron ${fixedCount} archivos.`);