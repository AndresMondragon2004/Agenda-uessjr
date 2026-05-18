const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      findFiles(path.join(dir, file), fileList);
    } else if (file.endsWith('.jsx') || file.endsWith('.tsx') || file.endsWith('.js')) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const files = findFiles(srcDir);
// Find text nodes that have multiple words starting with uppercase letters
// e.g. "Some Title Like This"
// Only match inside tags: >Some Text<
const regex = />([^<]+)</g;
const titles = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  let match;
  while ((match = regex.exec(content)) !== null) {
    let text = match[1].trim();
    if (!text) continue;
    
    // Check if it looks like Title Case: at least two words, and most words start with capital
    // Disregard if it's an acronym like "TI" or "MECATRONICA"
    // Disregard if it contains { } (jsx expression)
    if (text.includes('{') || text.includes('}')) continue;
    
    const words = text.split(/\s+/);
    if (words.length < 2) continue;
    
    let uppercaseWords = 0;
    let isAllUppercase = true;
    for (const w of words) {
        if (!w.match(/^[A-ZÁÉÍÓÚÑ]/)) {
            isAllUppercase = false;
        }
        if (w.match(/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]/)) {
            uppercaseWords++;
        }
    }
    
    if (!isAllUppercase && uppercaseWords >= 2) {
        titles.push({ file: path.relative(srcDir, file), text });
    }
  }
}

// deduplicate
const unique = new Set();
titles.forEach(t => {
  const entry = `${t.file}: ${t.text}`;
  if (!unique.has(entry)) {
    unique.add(entry);
    console.log(entry);
  }
});
