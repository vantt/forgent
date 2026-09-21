const fs = require('fs');
const SPEC_PATH = 'docs/specs/distribution.md';
function specEnumeratedIds(marker) {
  const spec = fs.readFileSync(SPEC_PATH, 'utf8');
  const start = spec.indexOf(marker);
  const rest = spec.slice(start + marker.length);
  const end = rest.indexOf('. ');
  const sentence = rest.slice(0, end);
  const ids = [];
  const regex = /`([^`]+)`/g;
  let match;
  while ((match = regex.exec(sentence)) !== null) {
    ids.push(match[1]);
  }
  return { sentence, ids };
}
console.log(specEnumeratedIds("Today's registered checks: "));
