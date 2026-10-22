//! Injection guard for comment text this component writes (spec section 6). Pure functions: the
//! caller splices the returned lines into the document.
//!
//! - Every line break (LF, CR, CRLF, U+0085, U+2028, U+2029) starts a new comment line, so text can
//!   never end the comment token and become a key or a value.
//! - Control characters other than tab are removed.
//! - Bidirectional controls (U+202A-U+202E, U+2066-U+2069, the directional marks U+200E and
//!   U+200F, the Arabic letter mark U+061C) and zero-width characters (U+200B-U+200D, the word
//!   joiner U+2060, U+FEFF) are refused, the same rule values get in `strict-config`. Refusing
//!   rather than stripping keeps the text the caller supplied and the text written the same
//!   words, so a hidden-text attempt surfaces to the caller instead of being rewritten quietly.
//! - An empty line is written as `#` (no trailing space).

use crate::guard::guard;
use crate::model::{rule, Refusal};

fn is_line_break(ch: char) -> bool {
    matches!(ch, '\n' | '\r' | '\u{85}' | '\u{2028}' | '\u{2029}')
}

/// Splits on every line break; CRLF is one break.
fn split_lines(text: &str) -> Vec<&str> {
    let mut lines = Vec::new();
    let mut start = 0;
    let mut chars = text.char_indices().peekable();
    while let Some((at, ch)) = chars.next() {
        if !is_line_break(ch) {
            continue;
        }
        lines.push(&text[start..at]);
        start = at + ch.len_utf8();
        if ch == '\r' && matches!(chars.peek(), Some((_, '\n'))) {
            chars.next();
            start += 1;
        }
    }
    lines.push(&text[start..]);
    lines
}

/// The characters that hide text in a diff. The one list shared by comment text and, through the
/// profile rows, by keys and values of a parsed document.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum Hidden {
    /// Bidirectional controls and marks: they reorder how a line reads.
    Bidi,
    /// Zero-width characters: they take no room.
    ZeroWidth,
}

impl Hidden {
    pub(crate) fn of(ch: char) -> Option<Hidden> {
        match ch {
            '\u{202A}'..='\u{202E}'
            | '\u{2066}'..='\u{2069}'
            | '\u{200E}'
            | '\u{200F}'
            | '\u{061C}' => Some(Hidden::Bidi),
            '\u{200B}'..='\u{200D}' | '\u{2060}' | '\u{FEFF}' => Some(Hidden::ZeroWidth),
            _ => None,
        }
    }

    pub(crate) fn rule(self) -> &'static str {
        match self {
            Hidden::Bidi => rule::BIDI_CONTROL,
            Hidden::ZeroWidth => rule::ZERO_WIDTH,
        }
    }
}

fn check_hidden(line: &str, line_no: usize) -> Result<(), Refusal> {
    match line
        .chars()
        .enumerate()
        .find_map(|(index, ch)| Hidden::of(ch).map(|hidden| (index, hidden)))
    {
        Some((index, hidden)) => {
            Err(Refusal::new(hidden.rule()).at(line_no as u32, index as u32 + 1))
        }
        None => Ok(()),
    }
}

fn render(line: &str) -> String {
    let body: String = line
        .chars()
        .filter(|ch| *ch == '\t' || !ch.is_control())
        .collect();
    if body.is_empty() {
        "#".to_string()
    } else {
        format!("# {body}")
    }
}

/// Comment lines for a block: one `# text` line per line of `text`, never fewer than one.
pub fn sanitize(text: &str) -> Result<Vec<String>, Refusal> {
    guard(|| {
        split_lines(text)
            .into_iter()
            .enumerate()
            .map(|(index, line)| check_hidden(line, index + 1).map(|()| render(line)))
            .collect()
    })
}

/// The one comment token for an inline comment; text with a line break is refused.
pub fn sanitize_inline(text: &str) -> Result<String, Refusal> {
    guard(|| {
        if let Some((index, _)) = text.chars().enumerate().find(|(_, ch)| is_line_break(*ch)) {
            return Err(Refusal::new(rule::INLINE_COMMENT_MULTILINE).at(1, index as u32 + 1));
        }
        check_hidden(text, 1)?;
        Ok(render(text))
    })
}
