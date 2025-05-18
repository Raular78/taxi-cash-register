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

// Función para reemplazar las importaciones en un archivo
function fixImportsInFile(filePath) {
  console.log(`Procesando: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Reemplazar importaciones de componentes UI
  const uiRegex = /@\/components\/ui\/([a-zA-Z-]+)/g;
  let match;
  
  while ((match = uiRegex.exec(content)) !== null) {
    const componentName = match[1];
    const fileDir = path.dirname(filePath);
    const targetPath = path.resolve('./components/ui');
    let relativePath = path.relative(fileDir, targetPath);
    
    // Asegurarse de que la ruta comienza con ./ o ../
    if (!relativePath.startsWith('.')) {
      relativePath = './' + relativePath;
    }
    
    const newImport = `${relativePath}/${componentName}`;
    content = content.replace(match[0], newImport);
    modified = true;
  }
  
  // Reemplazar otras importaciones con @/
  const otherRegex = /@\/([a-zA-Z0-9/.-]+)/g;
  while ((match = otherRegex.exec(content)) !== null) {
    const importPath = match[1];
    const fileDir = path.dirname(filePath);
    const targetPath = path.resolve('./' + importPath);
    let relativePath = path.relative(fileDir, targetPath);
    
    // Asegurarse de que la ruta comienza con ./ o ../
    if (!relativePath.startsWith('.')) {
      relativePath = './' + relativePath;
    }
    
    content = content.replace(match[0], relativePath);
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
console.log('Iniciando corrección de importaciones...');
const appFiles = getAllFiles('./app');
const componentFiles = getAllFiles('./components');
const allFiles = [...appFiles, ...componentFiles];

let fixedCount = 0;
allFiles.forEach(file => {
  if (fixImportsInFile(file)) {
    fixedCount++;
  }
});

console.log(`Proceso completado. Se corrigieron ${fixedCount} archivos.`);