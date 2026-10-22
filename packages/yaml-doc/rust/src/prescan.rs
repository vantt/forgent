//! Size and depth bounds checked before any parser recurses (spec section 8).
//!
//! A bound checked only on a parsed tree cannot stop a stack overflow inside the parser, and a stack
//! overflow cannot be caught. This pass is one linear scan, not a parser: it counts flow-bracket
//! nesting and block-indentation nesting together and refuses the first token that passes the
//! profile's depth bound. It errs toward counting: where it cannot tell whether a line starts a
//! collection it counts one. Memory is one small stack capped at the bound.
//!
//! Order of refusals: byte size, UTF-8, depth. A leading UTF-8 BOM is accepted.

use crate::model::{rule, Profile, Refusal};

struct Entry {
    indent: usize,
    seq: bool,
}

struct Scanner<'a> {
    limit: usize,
    file: &'a str,
    block: Vec<Entry>,
    flow: usize,
    quote: Option<u8>,
    /// Indent of the parent of the block scalar whose body is being skipped.
    body_parent: Option<isize>,
}

/// Checks size, UTF-8 and depth of `bytes` under `profile`.
pub fn check(bytes: &[u8], profile: Profile, file: &str) -> Result<(), Refusal> {
    let limits = profile.limits();
    if bytes.len() > limits.input_bytes {
        return Err(Refusal::new(rule::INPUT_TOO_LARGE)
            .with_file(file)
            .with_detail(format!("limit is {} bytes", limits.input_bytes)));
    }
    let text = match std::str::from_utf8(bytes) {
        Ok(text) => text,
        Err(error) => {
            // The prefix up to the first bad byte is valid UTF-8 by construction.
            let prefix = std::str::from_utf8(&bytes[..error.valid_up_to()]).unwrap_or("");
            let (line, column) = position_after(prefix);
            return Err(Refusal::new(rule::INVALID_UTF8)
                .with_file(file)
                .at(line, column));
        }
    };
    let text = text.strip_prefix('\u{FEFF}').unwrap_or(text);
    let mut scanner = Scanner {
        limit: limits.depth,
        file,
        block: Vec::new(),
        flow: 0,
        quote: None,
        body_parent: None,
    };
    for (index, line) in lines(text).enumerate() {
        scanner.scan_line(line, index as u32 + 1)?;
    }
    Ok(())
}

/// Line breaks as YAML reads them: LF, CRLF and a lone CR.
fn lines(text: &str) -> impl Iterator<Item = &str> {
    let bytes = text.as_bytes();
    let mut start = 0;
    let mut done = false;
    std::iter::from_fn(move || {
        if done {
            return None;
        }
        let mut i = start;
        while i < bytes.len() && bytes[i] != b'\n' && bytes[i] != b'\r' {
            i += 1;
        }
        let line = &text[start..i];
        if i >= bytes.len() {
            done = true;
            // A final line break does not start another line.
            return if line.is_empty() && start > 0 {
                None
            } else {
                Some(line)
            };
        }
        start = if bytes[i] == b'\r' && bytes.get(i + 1) == Some(&b'\n') {
            i + 2
        } else {
            i + 1
        };
        Some(line)
    })
}

/// Line and column (1-based) of the position right after `prefix`.
fn position_after(prefix: &str) -> (u32, u32) {
    let mut line = 1;
    let mut last_break = 0;
    let bytes = prefix.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        match bytes[i] {
            b'\n' => {
                line += 1;
                last_break = i + 1;
            }
            b'\r' => {
                if bytes.get(i + 1) == Some(&b'\n') {
                    i += 1;
                }
                line += 1;
                last_break = i + 1;
            }
            _ => {}
        }
        i += 1;
    }
    (line, prefix[last_break..].chars().count() as u32 + 1)
}

fn is_blank(byte: u8) -> bool {
    byte == b' ' || byte == b'\t'
}

fn starts_seq_entry(rest: &str) -> bool {
    let bytes = rest.as_bytes();
    bytes.first() == Some(&b'-') && bytes.get(1).is_none_or(|b| is_blank(*b))
}

/// Byte offset of the `:` that ends a mapping key at the start of `rest`, if the line has one.
fn key_colon(rest: &str) -> Option<usize> {
    let bytes = rest.as_bytes();
    let ends_key = |at: usize| bytes.get(at + 1).is_none_or(|b| is_blank(*b));
    let first = *bytes.first()?;
    if first == b'[' || first == b'{' {
        return None;
    }
    let mut i = 0;
    if first == b'"' || first == b'\'' {
        i = 1;
        loop {
            match bytes.get(i)? {
                b'\\' if first == b'"' => i += 2,
                b'\'' if first == b'\'' && bytes.get(i + 1) == Some(&b'\'') => i += 2,
                q if *q == first => break,
                _ => i += 1,
            }
        }
        i += 1;
        while bytes.get(i).is_some_and(|b| is_blank(*b)) {
            i += 1;
        }
        return (bytes.get(i) == Some(&b':') && ends_key(i)).then_some(i);
    }
    while i < bytes.len() {
        match bytes[i] {
            b':' if ends_key(i) => return Some(i),
            b'#' if i > 0 && is_blank(bytes[i - 1]) => return None,
            _ => i += 1,
        }
    }
    None
}

/// `|` or `>` with optional chomping and indentation indicators, then nothing or a comment.
fn is_block_scalar_header(rest: &str) -> bool {
    let bytes = rest.as_bytes();
    let mut i = 1;
    while i < bytes.len() && i <= 2 && matches!(bytes[i], b'+' | b'-' | b'0'..=b'9') {
        i += 1;
    }
    let tail = rest[i..].trim_start_matches([' ', '\t']);
    tail.is_empty() || (tail.starts_with('#') && i < rest.len() && is_blank(bytes[i]))
}

impl Scanner<'_> {
    fn too_deep(&self, line: &str, line_no: u32, byte: usize) -> Refusal {
        let column = line[..byte].chars().count() as u32 + 1;
        Refusal::new(rule::DEPTH_EXCEEDED)
            .with_file(self.file)
            .at(line_no, column)
            .with_detail(format!("nesting limit is {}", self.limit))
    }

    fn scan_line(&mut self, line: &str, line_no: u32) -> Result<(), Refusal> {
        if self.quote.is_some() {
            return self.scan_value(line, 0, line_no, 0);
        }
        let indent = line.bytes().take_while(|b| is_blank(*b)).count();
        let rest = &line[indent..];
        if rest.is_empty() {
            return Ok(());
        }
        let marker = indent == 0
            && (rest.starts_with("---") || rest.starts_with("..."))
            && rest.as_bytes().get(3).is_none_or(|b| is_blank(*b));
        if marker {
            self.body_parent = None;
            self.block.clear();
            self.flow = 0;
            return if rest.starts_with("---") {
                self.scan_value(line, 3, line_no, -1)
            } else {
                Ok(())
            };
        }
        if let Some(parent) = self.body_parent {
            if indent as isize > parent {
                return Ok(());
            }
            self.body_parent = None;
        }
        if self.flow > 0 {
            return self.scan_value(line, 0, line_no, indent as isize);
        }
        if rest.starts_with('#') {
            return Ok(());
        }
        self.scan_entries(line, indent, line_no)
    }

    fn scan_entries(&mut self, line: &str, indent: usize, line_no: u32) -> Result<(), Refusal> {
        while self.block.last().is_some_and(|top| top.indent > indent) {
            self.block.pop();
        }
        let mut at = indent;
        let mut entry_col = indent;
        loop {
            let rest = &line[at..];
            let skip = if starts_seq_entry(rest) {
                self.enter(at, true, line, line_no)?;
                1
            } else if rest.starts_with("? ") {
                self.enter(at, false, line, line_no)?;
                1
            } else {
                break;
            };
            entry_col = at;
            at += skip;
            at += line[at..].bytes().take_while(|b| is_blank(*b)).count();
            if at >= line.len() || line[at..].starts_with('#') {
                return Ok(());
            }
        }
        let rest = &line[at..];
        match key_colon(rest) {
            Some(colon) => {
                self.enter(at, false, line, line_no)?;
                self.scan_value(line, at + colon + 1, line_no, at as isize)
            }
            None => self.scan_value(line, at, line_no, entry_col as isize),
        }
    }

    /// Records a block collection entry at column `col`; a new collection deepens the nesting.
    fn enter(&mut self, col: usize, seq: bool, line: &str, line_no: u32) -> Result<(), Refusal> {
        if !seq {
            // A key at the column of a sequence's dashes ends that sequence.
            while self
                .block
                .last()
                .is_some_and(|top| top.indent == col && top.seq)
            {
                self.block.pop();
            }
        }
        let continues = self
            .block
            .last()
            .is_some_and(|top| top.indent == col && top.seq == seq);
        if !continues {
            self.block.push(Entry { indent: col, seq });
            if self.block.len() + self.flow > self.limit {
                return Err(self.too_deep(line, line_no, col));
            }
        }
        Ok(())
    }

    /// Scans the value part of a line from byte `start`: flow brackets, quotes, comments and the
    /// header of a block scalar. A flow bracket opens a collection only where a value can start.
    fn scan_value(
        &mut self,
        line: &str,
        start: usize,
        line_no: u32,
        parent: isize,
    ) -> Result<(), Refusal> {
        let bytes = line.as_bytes();
        let mut i = start;
        let mut can_start = true;
        while i < bytes.len() {
            let b = bytes[i];
            if let Some(q) = self.quote {
                if q == b'"' && b == b'\\' {
                    i += 2;
                    continue;
                }
                if b == q {
                    if q == b'\'' && bytes.get(i + 1) == Some(&b'\'') {
                        i += 2;
                        continue;
                    }
                    self.quote = None;
                    can_start = false;
                }
                i += 1;
                continue;
            }
            if is_blank(b) {
                i += 1;
                continue;
            }
            if b == b'#' && (i == 0 || is_blank(bytes[i - 1])) {
                break;
            }
            if can_start {
                match b {
                    b'[' | b'{' => {
                        self.flow += 1;
                        if self.block.len() + self.flow > self.limit {
                            return Err(self.too_deep(line, line_no, i));
                        }
                        i += 1;
                        continue;
                    }
                    b'"' | b'\'' => {
                        self.quote = Some(b);
                        i += 1;
                        continue;
                    }
                    b'&' | b'!' => {
                        while i < bytes.len()
                            && !is_blank(bytes[i])
                            && !matches!(bytes[i], b',' | b']' | b'}')
                        {
                            i += 1;
                        }
                        continue;
                    }
                    b'*' => {
                        while i < bytes.len()
                            && !is_blank(bytes[i])
                            && !matches!(bytes[i], b',' | b']' | b'}')
                        {
                            i += 1;
                        }
                        can_start = false;
                        continue;
                    }
                    b'|' | b'>' if self.flow == 0 && is_block_scalar_header(&line[i..]) => {
                        self.body_parent = Some(parent);
                        return Ok(());
                    }
                    _ => can_start = false,
                }
            }
            match b {
                b']' | b'}' if self.flow > 0 => {
                    self.flow -= 1;
                    can_start = false;
                }
                b',' if self.flow > 0 => can_start = true,
                b':' if self.flow > 0
                    && bytes
                        .get(i + 1)
                        .is_none_or(|n| is_blank(*n) || matches!(n, b',' | b']' | b'}')) =>
                {
                    can_start = true
                }
                _ => {}
            }
            i += 1;
        }
        Ok(())
    }
}
