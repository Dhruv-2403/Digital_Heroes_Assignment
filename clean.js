const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.join(__dirname, 'frontend/src'),
  path.join(__dirname, 'admin/src'),
  path.join(__dirname, 'backend/src')
];

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.match(/\.(js|jsx|css)$/)) results.push(file);
    }
  });
  return results;
}

let modifiedCount = 0;

targetDirs.forEach(dir => {
  const files = walk(dir);
  files.forEach(file => {
    const originalContent = fs.readFileSync(file, 'utf8');
    const lines = originalContent.split('\n');
    
    // Filter out any line that contains the decorative dash string "───"
    const newLines = lines.filter(line => !line.includes('───'));
    
    const newContent = newLines.join('\n');
    if (originalContent !== newContent) {
      fs.writeFileSync(file, newContent, 'utf8');
      modifiedCount++;
      console.log(`Cleaned: ${file.replace(__dirname, '')}`);
    }
  });
});

console.log(`\nSuccessfully removed decorative comments from ${modifiedCount} files!`);
