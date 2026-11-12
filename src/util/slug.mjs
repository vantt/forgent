// slug.mjs -- an ASCII, path-safe name made from any text: accents and Vietnamese đ folded to ASCII, runs of
// anything else collapsed to one dash, cut at 40 characters, `fallback` when nothing is left.

/** @param {unknown} text @param {string} fallback */
export function slugOf(text, fallback) {
  return String(text).normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+/, '').slice(0, 40).replace(/-+$/, '') || fallback;
}
