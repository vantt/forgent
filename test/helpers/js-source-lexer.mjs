// Shared by the source-text guard tests: comments and literal contents are blanked so that
// text inside a comment or a string is never mistaken for code.

// Words after which a slash starts a regular expression rather than a division.
const REGEX_AFTER_WORD = new Set(['return', 'typeof', 'case', 'in', 'of', 'new', 'delete', 'void', 'throw', 'else', 'do', 'yield', 'await', 'instanceof']);

/**
 * Two same-length views of a source file. `code` has comments blanked
 * (newlines kept) and everything else intact. `shape` also blanks the inside
 * of string, template and regex literals (template `${...}` code stays), so
 * brackets and separators inside literals never shift depth.
 */
export function lexSource(source) {
  const code = source.split('');
  const shape = source.split('');
  const blank = (view, from, to) => { for (let k = from; k < to; k++) if (view[k] !== '\n') view[k] = ' '; };
  const n = source.length;
  const templateResume = [];
  let braces = 0;
  let last = null; // previous significant token: { kind: 'punct'|'word'|'value', text }
  let i = 0;
  const scanTemplate = (from) => {
    let j = from;
    while (j < n) {
      if (source[j] === '\\') { j += 2; continue; }
      if (source[j] === '`') { blank(shape, from, j); return { end: j + 1, interpolation: false }; }
      if (source[j] === '$' && source[j + 1] === '{') { blank(shape, from, j); return { end: j + 2, interpolation: true }; }
      j++;
    }
    blank(shape, from, n);
    return { end: n, interpolation: false };
  };
  const enterTemplate = (from) => {
    const { end, interpolation } = scanTemplate(from);
    if (interpolation) { templateResume.push(braces); braces++; last = { kind: 'punct', text: '{' }; } else last = { kind: 'value' };
    return end;
  };
  while (i < n) {
    const c = source[i];
    const next = source[i + 1];
    if (c === '/' && next === '/') {
      let j = source.indexOf('\n', i);
      if (j < 0) j = n;
      blank(code, i, j); blank(shape, i, j); i = j; continue;
    }
    if (c === '/' && next === '*') {
      let j = source.indexOf('*/', i + 2);
      j = j < 0 ? n : j + 2;
      blank(code, i, j); blank(shape, i, j); i = j; continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && source[j] !== c && source[j] !== '\n') j += source[j] === '\\' ? 2 : 1;
      blank(shape, i + 1, Math.min(j, n));
      i = j + 1; last = { kind: 'value' }; continue;
    }
    if (c === '`') { i = enterTemplate(i + 1); continue; }
    if (c === '}' && templateResume.length && templateResume.at(-1) === braces - 1) {
      templateResume.pop(); braces--; i = enterTemplate(i + 1); continue;
    }
    if (c === '/') {
      const regexAllowed = !last
        || (last.kind === 'punct' && !')]}'.includes(last.text))
        || (last.kind === 'word' && REGEX_AFTER_WORD.has(last.text));
      if (regexAllowed) {
        let j = i + 1;
        let inClass = false;
        while (j < n && source[j] !== '\n') {
          if (source[j] === '\\') { j += 2; continue; }
          if (source[j] === '[') inClass = true;
          else if (source[j] === ']') inClass = false;
          else if (source[j] === '/' && !inClass) break;
          j++;
        }
        blank(shape, i + 1, Math.min(j, n));
        j++;
        while (j < n && /[a-z]/i.test(source[j])) j++;
        i = j; last = { kind: 'value' }; continue;
      }
    }
    if (/[A-Za-z_$]/.test(c)) {
      let j = i + 1;
      while (j < n && /[\w$]/.test(source[j])) j++;
      const word = source.slice(i, j);
      last = REGEX_AFTER_WORD.has(word) ? { kind: 'word', text: word } : { kind: 'value' };
      i = j; continue;
    }
    if (/[0-9]/.test(c)) {
      let j = i + 1;
      while (j < n && /[\w.]/.test(source[j])) j++;
      i = j; last = { kind: 'value' }; continue;
    }
    if (c === '{') braces++;
    else if (c === '}') braces = Math.max(0, braces - 1);
    if (!/\s/.test(c)) last = { kind: 'punct', text: c };
    i++;
  }
  return { code: code.join(''), shape: shape.join('') };
}
