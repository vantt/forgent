const fs = require('fs');
const file = 'scripts/test-select-compare.mjs';
let content = fs.readFileSync(file, 'utf8');

const anchor = `      const name = nameMatch ? nameMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&') : 'unknown';
      const file = fileMatch ? fileMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&') : 'unknown';
      failed.push({ name, file });`;

const replacement = `      const name = nameMatch ? nameMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&') : 'unknown';
      let filePath = fileMatch ? fileMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&') : 'unknown';
      const repoRoot = process.cwd();
      if (filePath.startsWith(repoRoot)) {
        filePath = filePath.substring(repoRoot.length + 1).replace(/\\\\/g, '/');
      }
      failed.push({ name, file: filePath });`;

content = content.replace(anchor, replacement);

const anchor2 = `  const baseJunit = 'artifacts/base-results/test-results/base.xml';
  const fullJunit = 'artifacts/full-results-ubuntu-latest/full.xml';
  const relatedJunit = 'artifacts/related-results/related.xml';`;

const replacement2 = `  const baseJunit = 'artifacts/base-results/test-results/base.xml';
  const fullJunitUbuntu = 'artifacts/full-results-ubuntu-latest/full.xml';
  const fullJunitMacos = 'artifacts/full-results-macos-latest/full.xml';
  const fullJunitWindows = 'artifacts/full-results-windows-latest/full.xml';
  const relatedJunit = 'artifacts/related-results/related.xml';`;

content = content.replace(anchor2, replacement2);

const anchor3 = `  const baseFails = fs.existsSync(baseJunit) ? getFailedTestsFromJunit(fs.readFileSync(baseJunit, 'utf8')) : null;
  const fullFails = fs.existsSync(fullJunit) ? getFailedTestsFromJunit(fs.readFileSync(fullJunit, 'utf8')) : [];
  const relatedFails = fs.existsSync(relatedJunit) ? getFailedTestsFromJunit(fs.readFileSync(relatedJunit, 'utf8')) : [];`;

const replacement3 = `  const baseFails = fs.existsSync(baseJunit) ? getFailedTestsFromJunit(fs.readFileSync(baseJunit, 'utf8')) : null;
  const fullFailsUbuntu = fs.existsSync(fullJunitUbuntu) ? getFailedTestsFromJunit(fs.readFileSync(fullJunitUbuntu, 'utf8')) : [];
  const fullFailsMacos = fs.existsSync(fullJunitMacos) ? getFailedTestsFromJunit(fs.readFileSync(fullJunitMacos, 'utf8')) : [];
  const fullFailsWindows = fs.existsSync(fullJunitWindows) ? getFailedTestsFromJunit(fs.readFileSync(fullJunitWindows, 'utf8')) : [];
  const relatedFails = fs.existsSync(relatedJunit) ? getFailedTestsFromJunit(fs.readFileSync(relatedJunit, 'utf8')) : [];

  // Combine all OS failures for iteration
  const allFullFailsMap = new Map();
  [...fullFailsUbuntu, ...fullFailsMacos, ...fullFailsWindows].forEach(f => {
    allFullFailsMap.set(f.name, f);
  });
  const fullFails = Array.from(allFullFailsMap.values());`;

content = content.replace(anchor3, replacement3);

const anchor4 = `export function classifyTestCase({
  isRedInFull,
  isRedInRelated,
  baseMissing,
  isRedInBase,
  isSelected,
  isRelatedRedSomewhere,
  rerunPassed
}) {`;
const replacement4 = `export function classifyTestCase({
  isRedInFull,
  isRedInRelated,
  baseMissing,
  isRedInBase,
  isSelected,
  isRelatedRedSomewhere,
  rerunPassed,
  isOsSpecific
}) {
  if (isOsSpecific) return 'os-specific';`;

content = content.replace(anchor4, replacement4);

const anchor5 = `    const isRedInFull = true;
    const isRedInBase = baseFails && baseFails.some(t => t.name === test.name);
    const isRedInRelated = relatedFails.some(t => t.name === test.name);
    const isSelected = selectedFiles.has(test.file);`;
const replacement5 = `    const isRedInFullUbuntu = fullFailsUbuntu.some(t => t.name === test.name);
    const isRedInMacos = fullFailsMacos.some(t => t.name === test.name);
    const isRedInWindows = fullFailsWindows.some(t => t.name === test.name);
    const isOsSpecific = !isRedInFullUbuntu && (isRedInMacos || isRedInWindows);

    const isRedInFull = true;
    const isRedInBase = baseFails && baseFails.some(t => t.name === test.name);
    const isRedInRelated = relatedFails.some(t => t.name === test.name);
    const isSelected = selectedFiles.has(test.file);`;

content = content.replace(anchor5, replacement5);

const anchor6 = `      isRelatedRedSomewhere,
      rerunPassed
    });`;
const replacement6 = `      isRelatedRedSomewhere,
      rerunPassed,
      isOsSpecific
    });`;

content = content.replace(anchor6, replacement6);

fs.writeFileSync(file, content);
