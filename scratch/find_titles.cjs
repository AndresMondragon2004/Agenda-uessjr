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
const regex = /<h[1-6][^>]*>(.*?)<\/h[1-6]>/g;
const titles = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  let match;
  while ((match = regex.exec(content)) !== null) {
    let text = match[1];
    // clean up jsx expressions if possible, or just log raw text
    text = text.replace(/<[^>]*>?/gm, '').trim();
    if (text) {
        titles.push({ file: path.relative(srcDir, file), text });
    }
  }
}

// Print all titles for analysis
titles.forEach(t => console.log(`${t.file}: ${t.text}`));

