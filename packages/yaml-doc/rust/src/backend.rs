//! Adapter over the YAML parser crate: the only file that names it. It turns the parser's event
//! stream into a crate-private tree (an arena, so nothing recurses on the call stack) and derives
//! the exact byte spans the parser does not give.
//!
//! What the parser reports and what this file corrects (measured in the upgrade record, section 3):
//! - positions are character indexes although documented as bytes: one table maps them to bytes;
//! - a quoted scalar ends too late when a comment follows: the closing quote is searched again;
//! - a block scalar starts after its header and ends after trailing blank lines: the header is read
//!   back from the source and the end is trimmed;
//! - a flow collection start covers one bracket and the close event runs on through trailing
//!   blanks: the end is the close bracket plus one;
//! - an empty plain scalar gets the position of the next token: it becomes an empty span (an empty
//!   mapping value sits right after the `:` of its key);
//! - tag and anchor are outside the reported span: their start is read back from the source.
//!
//! One value the parser gets wrong is corrected here: a block scalar with no content at the end of
//! the input is read as one line break, where YAML (and today's door) read it as empty.
//!
//! The parser is driven through `next_event` only. Its recursive `load` is never called, and a
//! parser panic is caught by the guard around every public entry.

use saphyr_parser::{Event, Parser, ScalarStyle, Tag};

/// How a scalar was written.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum Style {
    Plain,
    Single,
    Double,
    Literal,
    Folded,
}

/// The tags of the YAML core schema a `tool` document may use.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum CoreTag {
    Str,
    Int,
    Float,
    Bool,
    Null,
    Seq,
    Map,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum TagKind {
    Core(CoreTag),
    /// Any tag outside the core schema, `!!binary` and local tags included.
    Other,
}

#[derive(Debug)]
pub(crate) enum Kind {
    Scalar {
        style: Style,
        /// The resolved text (escapes decoded, block scalar chomped), never the raw source.
        text: String,
    },
    Seq(Vec<usize>),
    /// Entries in source order, as (key node, value node).
    Map(Vec<(usize, usize)>),
    /// The node the alias points at.
    Alias(usize),
}

#[derive(Debug)]
pub(crate) struct Node {
    pub kind: Kind,
    pub tag: Option<TagKind>,
    pub anchored: bool,
    /// Byte span of the node's own content, tag and anchor excluded.
    pub start: usize,
    pub end: usize,
    /// Byte offsets of the tag and anchor tokens; `start` when the node has none.
    pub tag_at: usize,
    pub anchor_at: usize,
}

#[derive(Debug)]
pub(crate) struct Doc {
    /// Byte offset where the document starts (its `---` marker when explicit).
    pub at: usize,
    pub root: Option<usize>,
}

#[derive(Debug, Default)]
pub(crate) struct Tree {
    pub nodes: Vec<Node>,
    pub docs: Vec<Doc>,
}

/// Why the parser stage stopped. Positions are 1-based, the column counts characters.
#[derive(Debug)]
pub(crate) enum Failure {
    Syntax {
        line: u32,
        column: u32,
    },
    /// An implicit key longer than the parser's reach; the key bound of the profile names it.
    KeyTooLarge {
        at: usize,
    },
    /// An event order the parser promises never to produce.
    Internal,
}

/// Character index to byte offset, for the text after an optional BOM.
enum ByteMap {
    Ascii,
    Table(Vec<u32>),
}

impl ByteMap {
    fn new(body: &str) -> ByteMap {
        if body.is_ascii() {
            return ByteMap::Ascii;
        }
        let mut table: Vec<u32> = body
            .char_indices()
            .map(|(at, _)| u32::try_from(at).unwrap_or(u32::MAX))
            .collect();
        table.push(u32::try_from(body.len()).unwrap_or(u32::MAX));
        ByteMap::Table(table)
    }

    fn byte(&self, index: usize, len: usize) -> usize {
        match self {
            ByteMap::Ascii => index.min(len),
            ByteMap::Table(table) => table.get(index).map_or(len, |at| *at as usize),
        }
    }
}

struct Frame {
    node: usize,
    /// The key waiting for its value (mappings only).
    pending_key: Option<usize>,
    /// Written with brackets, so the close event bounds the span.
    braced: bool,
}

/// Parses `source` (the whole text, `base` bytes of BOM first) into a tree.
pub(crate) fn parse(source: &str, base: usize, key_bytes: usize) -> Result<Tree, Failure> {
    let body = &source[base..];
    let map = ByteMap::new(body);
    let at = |index: usize| base + map.byte(index, body.len());
    let mut tree = Tree::default();
    let mut stack: Vec<Frame> = Vec::new();
    // Anchor id (1-based, 0 means none) to the node that carries it.
    let mut anchors: Vec<usize> = vec![usize::MAX];
    let mut root: Option<usize> = None;
    let mut doc_at = 0;
    // The start and size of the scalar just read, for the implicit-key reach (see below).
    let mut last_scalar: Option<(usize, usize)> = None;
    let mut parser = Parser::new_from_str(body);
    while let Some(next) = parser.next_event() {
        let (event, span) = match next {
            Ok(pair) => pair,
            Err(error) => {
                let mark = error.marker();
                let colon = source.as_bytes().get(at(mark.index())) == Some(&b':');
                if let Some((start, size)) = last_scalar {
                    if colon && size > key_bytes {
                        return Err(Failure::KeyTooLarge { at: start });
                    }
                }
                return Err(Failure::Syntax {
                    line: u32::try_from(mark.line()).unwrap_or(u32::MAX),
                    column: u32::try_from(mark.col() + 1).unwrap_or(u32::MAX),
                });
            }
        };
        let (start, end) = (at(span.start.index()), at(span.end.index()));
        let braced_at = |open: u8| {
            span.end.index() > span.start.index() && source.as_bytes().get(start) == Some(&open)
        };
        last_scalar = None;
        match event {
            Event::DocumentStart(_) => {
                doc_at = start;
                root = None;
            }
            Event::DocumentEnd => {
                if !stack.is_empty() {
                    return Err(Failure::Internal);
                }
                tree.docs.push(Doc {
                    at: doc_at,
                    root: root.take(),
                });
            }
            Event::Scalar(text, style, anchor, tag) => {
                let style = style_of(style);
                let (start, end, header_only) =
                    scalar_span(source, style, text.is_empty(), start, end);
                if matches!(style, Style::Plain | Style::Single | Style::Double) {
                    last_scalar = Some((start, text.len()));
                }
                let mut text = text.into_owned();
                if header_only && text == "\n" && clipped_empty(source, start, end) {
                    text.clear();
                }
                let node = new_node(
                    &mut tree,
                    source,
                    Kind::Scalar { style, text },
                    tag.as_deref(),
                    anchor,
                    (start, end),
                );
                register(&mut anchors, anchor, node);
                attach(&mut tree, &mut stack, &mut root, source, node)?;
            }
            Event::Alias(id) => {
                let Some(&target) = anchors.get(id).filter(|t| **t != usize::MAX) else {
                    return Err(Failure::Internal);
                };
                let node = new_node(
                    &mut tree,
                    source,
                    Kind::Alias(target),
                    None,
                    0,
                    (start, end),
                );
                attach(&mut tree, &mut stack, &mut root, source, node)?;
            }
            Event::SequenceStart(anchor, tag) => {
                let node = new_node(
                    &mut tree,
                    source,
                    Kind::Seq(Vec::new()),
                    tag.as_deref(),
                    anchor,
                    (start, start),
                );
                register(&mut anchors, anchor, node);
                attach(&mut tree, &mut stack, &mut root, source, node)?;
                stack.push(Frame {
                    node,
                    pending_key: None,
                    braced: braced_at(b'['),
                });
            }
            Event::MappingStart(anchor, tag) => {
                let node = new_node(
                    &mut tree,
                    source,
                    Kind::Map(Vec::new()),
                    tag.as_deref(),
                    anchor,
                    (start, start),
                );
                register(&mut anchors, anchor, node);
                attach(&mut tree, &mut stack, &mut root, source, node)?;
                stack.push(Frame {
                    node,
                    pending_key: None,
                    braced: braced_at(b'{'),
                });
            }
            Event::SequenceEnd | Event::MappingEnd => {
                let Some(frame) = stack.pop() else {
                    return Err(Failure::Internal);
                };
                if frame.pending_key.is_some() {
                    return Err(Failure::Internal);
                }
                let content_end = last_child_end(&tree, frame.node);
                let node = &mut tree.nodes[frame.node];
                // The close event of a bracketed collection starts at its bracket.
                node.end = if frame.braced {
                    start + 1
                } else {
                    content_end.max(node.start)
                };
            }
            Event::StreamEnd => break,
            Event::StreamStart | Event::Nothing => {}
        }
    }
    Ok(tree)
}

fn style_of(style: ScalarStyle) -> Style {
    match style {
        ScalarStyle::Plain => Style::Plain,
        ScalarStyle::SingleQuoted => Style::Single,
        ScalarStyle::DoubleQuoted => Style::Double,
        ScalarStyle::Literal => Style::Literal,
        ScalarStyle::Folded => Style::Folded,
    }
}

fn tag_kind(tag: &Tag) -> TagKind {
    // `!!name` resolves to the handle `tag:yaml.org,2002:`; a verbatim `!<tag:yaml.org,2002:name>`
    // has an empty handle and the whole URI as suffix.
    let full = [tag.handle.as_str(), tag.suffix.as_str()].concat();
    match full.strip_prefix("tag:yaml.org,2002:") {
        Some("str") => TagKind::Core(CoreTag::Str),
        Some("int") => TagKind::Core(CoreTag::Int),
        Some("float") => TagKind::Core(CoreTag::Float),
        Some("bool") => TagKind::Core(CoreTag::Bool),
        Some("null") => TagKind::Core(CoreTag::Null),
        Some("seq") => TagKind::Core(CoreTag::Seq),
        Some("map") => TagKind::Core(CoreTag::Map),
        _ => TagKind::Other,
    }
}

fn new_node(
    tree: &mut Tree,
    source: &str,
    kind: Kind,
    tag: Option<&Tag>,
    anchor: usize,
    (start, end): (usize, usize),
) -> usize {
    let tag = tag.map(tag_kind);
    let (mut tag_at, mut anchor_at) = (start, start);
    if tag.is_some() || anchor > 0 {
        let (found_tag, found_anchor) = property_starts(source, start);
        tag_at = found_tag.unwrap_or(start);
        anchor_at = found_anchor.unwrap_or(start);
    }
    tree.nodes.push(Node {
        kind,
        tag,
        anchored: anchor > 0,
        start,
        end,
        tag_at,
        anchor_at,
    });
    tree.nodes.len() - 1
}

fn register(anchors: &mut Vec<usize>, anchor: usize, node: usize) {
    if anchor > 0 {
        if anchors.len() <= anchor {
            anchors.resize(anchor + 1, usize::MAX);
        }
        anchors[anchor] = node;
    }
}

/// Hands a finished or just-opened node to its parent, or makes it the document root.
fn attach(
    tree: &mut Tree,
    stack: &mut [Frame],
    root: &mut Option<usize>,
    source: &str,
    child: usize,
) -> Result<(), Failure> {
    let Some(frame) = stack.last_mut() else {
        *root = Some(child);
        return Ok(());
    };
    let parent = frame.node;
    match &mut tree.nodes[parent].kind {
        Kind::Seq(items) => items.push(child),
        Kind::Map(entries) => match frame.pending_key.take() {
            Some(key) => {
                entries.push((key, child));
                let key_end = tree.nodes[key].end;
                place_empty_value(tree, source, child, key_end);
            }
            None => frame.pending_key = Some(child),
        },
        _ => return Err(Failure::Internal),
    }
    Ok(())
}

/// An empty mapping value has no text, so it sits where the value would start: right after the
/// `:` of its key, or at the end of the key when the entry has no colon.
fn place_empty_value(tree: &mut Tree, source: &str, value: usize, key_end: usize) {
    let node = &mut tree.nodes[value];
    let Kind::Scalar {
        style: Style::Plain,
        text,
    } = &node.kind
    else {
        return;
    };
    if !text.is_empty() {
        return;
    }
    let bytes = source.as_bytes();
    let mut at = key_end;
    while matches!(bytes.get(at), Some(b' ' | b'\t')) {
        at += 1;
    }
    let at = if bytes.get(at) == Some(&b':') {
        at + 1
    } else {
        key_end
    };
    node.start = at;
    node.end = at;
}

fn last_child_end(tree: &Tree, node: usize) -> usize {
    let child = match &tree.nodes[node].kind {
        Kind::Seq(items) => items.last().copied(),
        Kind::Map(entries) => entries.last().map(|(_, value)| *value),
        _ => None,
    };
    child.map_or(tree.nodes[node].start, |id| tree.nodes[id].end)
}

// ---- derived spans ----

/// Start and end of a scalar, and whether it is a block scalar that has a header and no content.
fn scalar_span(
    source: &str,
    style: Style,
    empty: bool,
    start: usize,
    end: usize,
) -> (usize, usize, bool) {
    match style {
        Style::Plain if empty => (start, start, false),
        Style::Double => (start, quote_end(source, start, b'"').unwrap_or(end), false),
        Style::Single => (start, quote_end(source, start, b'\'').unwrap_or(end), false),
        Style::Literal | Style::Folded => block_scalar_span(source, start, end),
        Style::Plain => (start, end, false),
    }
}

/// Whether the one line break the parser reports for a header-only block scalar is not content: a
/// clipped scalar has none, a kept one has only the blank lines after the header's own break, so
/// nothing at all after that break means none.
fn clipped_empty(source: &str, start: usize, end: usize) -> bool {
    if !source[start..end].contains('+') {
        return true;
    }
    let rest = &source[end..];
    let after_header_break = rest.find(BREAKS).map(|at| &rest[at..]).map(|from| {
        from.strip_prefix("\r\n")
            .or_else(|| from.get(1..))
            .unwrap_or("")
    });
    after_header_break.is_none_or(str::is_empty)
}

/// End of the quoted scalar that opens at `start`: one past its closing quote.
fn quote_end(source: &str, start: usize, quote: u8) -> Option<usize> {
    let bytes = source.as_bytes();
    if bytes.get(start) != Some(&quote) {
        return None;
    }
    let mut at = start + 1;
    while at < bytes.len() {
        match bytes[at] {
            b'\\' if quote == b'"' => at += 2,
            byte if byte == quote => {
                // A doubled single quote is a quote character inside the scalar.
                if quote == b'\'' && bytes.get(at + 1) == Some(&b'\'') {
                    at += 2;
                } else {
                    return Some(at + 1);
                }
            }
            _ => at += 1,
        }
    }
    None
}

const BLANKS: &[char] = &[' ', '\t'];
const BREAKS: &[char] = &['\n', '\r'];

/// Span of a literal or folded scalar: from its header (`|`, `>-`, `|2+`) to its last content byte.
/// The parser reports the start after the header and the end after trailing blank lines. The flag
/// says the scalar has a header and no content.
fn block_scalar_span(source: &str, start: usize, reported_end: usize) -> (usize, usize, bool) {
    let start = start.min(source.len());
    let line_start = source[..start].rfind(BREAKS).map_or(0, |at| at + 1);
    let header = if source[line_start..start]
        .chars()
        .all(|c| BLANKS.contains(&c))
    {
        // The reported start is content (or the next token of an empty scalar): the header is on
        // an earlier line, behind blank lines.
        header_before(source, line_start).or_else(|| header_at(source, start))
    } else {
        // Something precedes the start on its line: the scalar is empty at the end of the input
        // and the start is the header itself.
        header_at(source, start)
    };
    let Some((header_start, header_end)) = header else {
        return (start, reported_end.max(start), false);
    };
    let reported_end = reported_end.clamp(header_end, source.len());
    let content_end = source[..reported_end]
        .trim_end_matches(|c| BLANKS.contains(&c) || BREAKS.contains(&c))
        .len();
    if content_end <= header_end {
        return (header_start, header_end, true);
    }
    // Trailing blanks of the last content line belong to the scalar.
    let tail = source[content_end..reported_end]
        .find(|c| !BLANKS.contains(&c))
        .unwrap_or(reported_end - content_end);
    (header_start, content_end + tail, false)
}

/// The header word of the block scalar whose content starts at `line_start`: the last word of the
/// closest earlier line that is not blank, with its comment cut off.
fn header_before(source: &str, line_start: usize) -> Option<(usize, usize)> {
    let mut end = line_start;
    while end > 0 {
        // Step over the line break that ends the previous line (LF, CRLF or a lone CR).
        let mut line_end = end;
        if source[..line_end].ends_with('\n') {
            line_end -= 1;
        }
        if source[..line_end].ends_with('\r') {
            line_end -= 1;
        }
        let begin = source[..line_end].rfind(BREAKS).map_or(0, |at| at + 1);
        let line = &source[begin..line_end];
        if line.trim_matches(BLANKS).is_empty() {
            end = begin;
            continue;
        }
        let cut = comment_start(line).unwrap_or(line.len());
        let head = line[..cut].trim_end_matches(BLANKS);
        let word = head.rfind(BLANKS).map_or(0, |at| at + 1);
        return head[word..]
            .starts_with(['|', '>'])
            .then_some((begin + word, begin + head.len()));
    }
    None
}

/// The header word that starts at `at`.
fn header_at(source: &str, at: usize) -> Option<(usize, usize)> {
    let rest = source.get(at..)?;
    rest.starts_with(['|', '>']).then(|| {
        let len = rest
            .find(|c: char| BLANKS.contains(&c) || BREAKS.contains(&c))
            .unwrap_or(rest.len());
        (at, at + len)
    })
}

/// Where a comment starts inside one line: a `#` at the start or after a blank.
fn comment_start(line: &str) -> Option<usize> {
    if line.starts_with('#') {
        return Some(0);
    }
    line.find(" #")
        .or_else(|| line.find("\t#"))
        .map(|at| at + 1)
}

/// Start offsets of the tag and the anchor written in front of the node content at `start`. They
/// are the words made of `!` or `&` that sit before it, on its line or on earlier lines that hold
/// only properties and comments.
fn property_starts(source: &str, start: usize) -> (Option<usize>, Option<usize>) {
    let bytes = source.as_bytes();
    let (mut tag, mut anchor) = (None, None);
    let mut at = start.min(source.len());
    loop {
        at = skip_trivia_back(source, at);
        let mut word = at;
        while word > 0 && !is_word_break(bytes[word - 1]) {
            word -= 1;
        }
        match bytes.get(word) {
            Some(b'!') if word < at => tag = Some(word),
            Some(b'&') if word < at => anchor = Some(word),
            _ => return (tag, anchor),
        }
        at = word;
    }
}

fn is_word_break(byte: u8) -> bool {
    matches!(
        byte,
        b' ' | b'\t' | b'\n' | b'\r' | b',' | b'[' | b']' | b'{' | b'}'
    )
}

/// Moves `at` back over blanks, line breaks and trailing comments.
fn skip_trivia_back(source: &str, mut at: usize) -> usize {
    let bytes = source.as_bytes();
    loop {
        while at > 0 && matches!(bytes[at - 1], b' ' | b'\t' | b'\n' | b'\r') {
            at -= 1;
        }
        let line_start = source[..at].rfind(BREAKS).map_or(0, |i| i + 1);
        match comment_start(&source[line_start..at]) {
            Some(cut) => at = line_start + cut,
            None => return at,
        }
    }
}
