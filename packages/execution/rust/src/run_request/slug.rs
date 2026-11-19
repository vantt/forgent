//! `slugOf`: an ASCII, path-safe name made from any text. Accents and the Vietnamese đ fold to ASCII, runs of anything
//! else collapse to one dash, the name is cut at 40 characters, and `fallback` stands in when nothing is left.
//!
//! The fold is Unicode compatibility decomposition (NFKD) with the combining marks dropped, as `String.prototype.normalize`
//! does it in the Node twin. The table of [`super::slug_table::FOLD`] is generated from that very call: every code
//! point whose decomposition, once marks are removed, differs from it and keeps some printable ASCII, with each part
//! that is not printable ASCII written as `-` (Node lowercases it and it falls into a separator run there too, so
//! `¼` reads as `1-4`). A code point not in the table reads as a separator, as it does there. Regenerate with:
//!
//! ```text
//! for cp in 0xA0..=0x10FFFF (not surrogates, not U+0300..U+036F): s = String.fromCodePoint(cp).normalize('NFKD')
//!   .replace(/[̀-ͯ]/g,'').replace(/[đĐ]/g,'d'); keep (cp, s with every char outside 0x20..0x7E as '-') when s
//!   differs from the code point and has a char in 0x20..0x7E.
//! ```

use super::slug_table::FOLD;

const MAX_LEN: usize = 40;

fn folded_into(out: &mut String, c: char) {
    if ('\u{0300}'..='\u{036f}').contains(&c) {
        return;
    }
    if c == 'đ' || c == 'Đ' {
        out.push('d');
        return;
    }
    if c.is_ascii() {
        out.push(c.to_ascii_lowercase());
        return;
    }
    match FOLD.binary_search_by_key(&(c as u32), |(cp, _)| *cp) {
        Ok(at) => out.extend(FOLD[at].1.chars().map(|a| a.to_ascii_lowercase())),
        Err(_) => out.push('-'),
    }
}

/// The slug of `text`, or `fallback` when it has no letter or digit.
pub fn slug_of(text: &str, fallback: &str) -> String {
    let mut folded = String::with_capacity(text.len());
    for c in text.chars() {
        folded_into(&mut folded, c);
    }
    let mut collapsed = String::with_capacity(folded.len());
    let mut in_run = false;
    for c in folded.chars() {
        if c.is_ascii_lowercase() || c.is_ascii_digit() {
            collapsed.push(c);
            in_run = false;
        } else if !in_run {
            collapsed.push('-');
            in_run = true;
        }
    }
    let trimmed = collapsed.trim_start_matches('-');
    let cut: String = trimmed.chars().take(MAX_LEN).collect();
    let cut = cut.trim_end_matches('-');
    if cut.is_empty() {
        fallback.to_string()
    } else {
        cut.to_string()
    }
}
