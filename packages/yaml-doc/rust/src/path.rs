//! Text form of a path, for the places a path must be one string (a CLI argument).
//!
//! Keys are joined by `.`; an index is `[n]`; a key containing `.`, `[`, `]`, `"`, `'` or `\` (or an
//! empty key) is written bracket-quoted as `["a.b"]`, with `\` escaping the next character. A
//! dotted string is never a path by itself: `code:implement` needs no escape.

use crate::model::{rule, Refusal, Segment};

/// Writes segments in the canonical text form; `parse_path(&format_path(s))` returns `s`.
pub fn format_path(segments: &[Segment]) -> String {
    let mut out = String::new();
    for segment in segments {
        match segment {
            Segment::Index(n) => {
                out.push('[');
                out.push_str(&n.to_string());
                out.push(']');
            }
            Segment::Key(key) if is_bare(key) => {
                if !out.is_empty() {
                    out.push('.');
                }
                out.push_str(key);
            }
            Segment::Key(key) => {
                out.push_str("[\"");
                for ch in key.chars() {
                    if ch == '"' || ch == '\\' {
                        out.push('\\');
                    }
                    out.push(ch);
                }
                out.push_str("\"]");
            }
        }
    }
    out
}

fn is_bare(key: &str) -> bool {
    !key.is_empty() && !key.contains(['.', '[', ']', '"', '\'', '\\'])
}

/// Parses the text form back into segments. An empty text is the empty path (the document root).
pub fn parse_path(text: &str) -> Result<Vec<Segment>, Refusal> {
    let chars: Vec<char> = text.chars().collect();
    let mut segments = Vec::new();
    let mut i = 0;
    // `true` when a bare key may start here: at the start, or right after a `.`.
    let mut expect_key = true;
    while i < chars.len() {
        match chars[i] {
            '.' => {
                if expect_key {
                    return Err(invalid(i, "empty segment"));
                }
                i += 1;
                if i == chars.len() {
                    return Err(invalid(i, "path ends after a dot"));
                }
                expect_key = true;
                if chars[i] == '.' {
                    return Err(invalid(i, "empty segment"));
                }
                if chars[i] == '[' {
                    return Err(invalid(i, "a bracket segment follows without a dot"));
                }
            }
            '[' => {
                i = parse_bracket(&chars, i, &mut segments)?;
                expect_key = false;
            }
            _ => {
                if !expect_key {
                    return Err(invalid(i, "a key follows a bracket without a dot"));
                }
                let (key, next) = parse_bare(&chars, i)?;
                segments.push(Segment::Key(key));
                i = next;
                expect_key = false;
            }
        }
    }
    Ok(segments)
}

fn invalid(index: usize, detail: &str) -> Refusal {
    Refusal::new(rule::INVALID_PATH)
        .at(1, index as u32 + 1)
        .with_detail(detail)
}

fn parse_bare(chars: &[char], start: usize) -> Result<(String, usize), Refusal> {
    let mut key = String::new();
    let mut i = start;
    while i < chars.len() {
        match chars[i] {
            '.' | '[' => break,
            '\\' => {
                i += 1;
                match chars.get(i) {
                    Some(ch) => key.push(*ch),
                    None => return Err(invalid(i, "path ends after a backslash")),
                }
            }
            ']' | '"' | '\'' => {
                return Err(invalid(
                    i,
                    "character needs an escape or a bracket-quoted key",
                ))
            }
            ch => key.push(ch),
        }
        i += 1;
    }
    Ok((key, i))
}

/// Parses `[n]` or `["key"]` starting at the `[`; returns the index after the closing `]`.
fn parse_bracket(chars: &[char], start: usize, out: &mut Vec<Segment>) -> Result<usize, Refusal> {
    let mut i = start + 1;
    match chars.get(i) {
        None => Err(invalid(i, "bracket is not closed")),
        Some('"') => {
            i += 1;
            let mut key = String::new();
            loop {
                match chars.get(i) {
                    None => return Err(invalid(i, "quoted key is not closed")),
                    Some('"') => break,
                    Some('\\') => {
                        i += 1;
                        match chars.get(i) {
                            Some(ch) => key.push(*ch),
                            None => return Err(invalid(i, "path ends after a backslash")),
                        }
                    }
                    Some(ch) => key.push(*ch),
                }
                i += 1;
            }
            i += 1;
            match chars.get(i) {
                Some(']') => {
                    out.push(Segment::Key(key));
                    Ok(i + 1)
                }
                Some(_) => Err(invalid(
                    i,
                    "expected a closing bracket after the quoted key",
                )),
                None => Err(invalid(i, "bracket is not closed")),
            }
        }
        Some(c) if c.is_ascii_digit() => {
            let digits_start = i;
            while chars.get(i).is_some_and(char::is_ascii_digit) {
                i += 1;
            }
            let digits: String = chars[digits_start..i].iter().collect();
            if digits.len() > 1 && digits.starts_with('0') {
                return Err(invalid(digits_start, "index has a leading zero"));
            }
            let index = digits
                .parse::<usize>()
                .map_err(|_| invalid(digits_start, "index is too large"))?;
            match chars.get(i) {
                Some(']') => {
                    out.push(Segment::Index(index));
                    Ok(i + 1)
                }
                Some(_) => Err(invalid(i, "expected a closing bracket after the index")),
                None => Err(invalid(i, "bracket is not closed")),
            }
        }
        Some(_) => Err(invalid(
            i,
            "bracket holds neither an index nor a quoted key",
        )),
    }
}
