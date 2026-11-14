// Shared by the source-text guards: Rust comments are blanked (newlines kept, strings left intact) and
// the `#[cfg(test)]` module or function regions are found by one brace counter. Limits: a brace inside
// a string or char literal in a test region shifts the count.

export function lexRust(source) {
  const out = source.split('');
  const blank = (from, to) => { for (let k = from; k < to; k++) if (out[k] !== '\n') out[k] = ' '; };
  const n = source.length;
  for (let i = 0; i < n;) {
    const c = source[i];
    if (c === '/' && source[i + 1] === '/') { let j = source.indexOf('\n', i); if (j < 0) j = n; blank(i, j); i = j; continue; }
    if (c === '/' && source[i + 1] === '*') { let j = source.indexOf('*/', i + 2); j = j < 0 ? n : j + 2; blank(i, j); i = j; continue; }
    const raw = /^b?r(#*)"/.exec(source.slice(i, i + 12));
    if (raw && !/[\w]/.test(source[i - 1] ?? '')) { const close = `"${raw[1]}`; const j = source.indexOf(close, i + raw[0].length); i = j < 0 ? n : j + close.length; continue; }
    if (c === '"') { let j = i + 1; while (j < n && source[j] !== '"') j += source[j] === '\\' ? 2 : 1; i = j + 1; continue; }
    if (c === "'") {
      const ch = /^'(?:\\.[^']*|[^'\\])'/.exec(source.slice(i, i + 12));
      if (ch) { i += ch[0].length; continue; }
      i++; continue; // a lifetime
    }
    i++;
  }
  return out.join('');
}

/** [start, end] offsets of each `#[cfg(test)]` mod or fn in lexed `code`. */
export function rustTestRanges(code) {
  const ranges = [];
  for (const m of code.matchAll(/#\[cfg\((?:all\()?test\b[^\]]*\]\s*(?:#\[[^\]]*\]\s*)*(?:pub(?:\([^)]*\))?\s+)?(mod\s+\w+\s*\{|fn\s+\w+[^{]*\{)/g)) {
    const open = m.index + m[0].length - 1;
    let depth = 0;
    let end = open;
    for (; end < code.length; end++) { if (code[end] === '{') depth++; else if (code[end] === '}' && --depth === 0) break; }
    ranges.push([m.index, end]);
  }
  return ranges;
}
