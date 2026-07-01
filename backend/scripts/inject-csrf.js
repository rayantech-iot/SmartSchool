
const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, '../views');
const includeLine = "      <%- include('../partials/csrfField') %>\n";
const includeLineRoot = "    <%- include('../partials/csrfField') %>\n";

function walk(dir, files = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (p.endsWith('.ejs')) files.push(p);
  }
  return files;
}

let count = 0;
for (const file of walk(viewsDir)) {
  if (file.includes('csrfField')) continue;
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('method="POST"')) continue;
  if (content.includes('csrfField')) continue;

  const depth = file.replace(viewsDir, '').split(path.sep).filter(Boolean).length;
  const inc = depth <= 2
    ? includeLineRoot.replace('../partials', depth === 1 ? 'partials' : '../partials')
    : includeLine;

  const updated = content.replace(/(<form[^>]*method="POST"[^>]*>\s*\n)/gi, (match) => {
    if (match.includes('csrfField')) return match;
    count++;
    const indent = match.match(/^(\s*)/)?.[1] || '      ';
    const relPath = file.includes(path.join('views', 'auth'))
      ? "    <%- include('../partials/csrfField') %>\n"
      : file.includes('partials') ? match
      : indent + "<%- include('../partials/csrfField') %>\n";
    return match + relPath;
  });

  if (updated !== content) {
    fs.writeFileSync(file, updated);
    console.log('OK:', path.relative(viewsDir, file));
  }
}
console.log(`\n${count} champs CSRF injectés.`);
