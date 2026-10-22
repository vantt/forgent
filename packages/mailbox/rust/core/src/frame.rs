//! The frame (spec §5.5): every offered message and notice is rendered from
//! the one contract file `packages/mailbox/contracts/frame.v1.txt`, embedded
//! at compile time. Header values are reduced to the name alphabet and
//! bounded; the body is escaped so no body text can close the frame, open
//! another one or imitate the trailing instruction lines. The escape lowers
//! the risk that a model acts on forged text; it does not remove it.
use crate::delivery::{ClaimedItem, ClaimedWhat, MailFrom, NoticeFacts};
use crate::envelope::RefusalReason;
use crate::limits::Limits;
use crate::names::in_name_alphabet;
use std::sync::OnceLock;

const FRAME: &str = include_str!("../../../contracts/frame.v1.txt");

/// The prefix of every body line inside a frame.
const GUTTER: &str = "| ";

/// The `agent` value of a sender with no head.
const NO_AGENT: &str = "unregistered";

/// The contract's sections, `(name, text)`, in file order; parsed once.
pub fn frame_sections() -> &'static [(&'static str, &'static str)] {
    static SECTIONS: OnceLock<Vec<(&'static str, &'static str)>> = OnceLock::new();
    SECTIONS.get_or_init(parse_sections)
}

fn parse_sections() -> Vec<(&'static str, &'static str)> {
    let mut sections: Vec<(&'static str, &'static str)> = Vec::new();
    let mut current: Option<(&'static str, usize)> = None;
    let mut offset = 0;
    for line in FRAME.split_inclusive('\n') {
        let trimmed = line.trim_end_matches('\n');
        let header = trimmed
            .strip_prefix('[')
            .and_then(|rest| rest.strip_suffix(']'));
        if let Some(name) = header {
            if let Some((open, start)) = current.take() {
                sections.push((open, FRAME[start..offset].trim_end()));
            }
            current = Some((name, offset + line.len()));
        }
        offset += line.len();
    }
    if let Some((open, start)) = current {
        sections.push((open, FRAME[start..].trim_end()));
    }
    sections
}

/// A section of the embedded contract. Every section exists: the contract
/// is compiled in and its test proves each one, so the empty fallback is
/// never used; it keeps rendering free of panics.
pub(crate) fn section(name: &str) -> &'static str {
    frame_sections()
        .iter()
        .find(|(n, _)| *n == name)
        .map_or("", |(_, text)| text)
}

/// Fills `{{name}}` placeholders in one left-to-right pass. Inserted text is
/// never scanned again, so a value holding a placeholder stays literal.
pub(crate) fn fill(template: &str, values: &[(&str, &str)]) -> String {
    let mut out = String::with_capacity(template.len());
    let mut rest = template;
    while let Some(open) = rest.find("{{") {
        out.push_str(&rest[..open]);
        let after = &rest[open + 2..];
        let value = after.find("}}").and_then(|close| {
            let name = &after[..close];
            values
                .iter()
                .find(|(n, _)| *n == name)
                .map(|(_, v)| (*v, close))
        });
        match value {
            Some((value, close)) => {
                out.push_str(value);
                rest = &after[close + 2..];
            }
            None => {
                out.push_str("{{");
                rest = after;
            }
        }
    }
    out.push_str(rest);
    out
}

/// A header value: the name alphabet only, every other character `_`,
/// at most `frame.maxHeaderChars` characters.
pub(crate) fn escape_header(value: &str, limits: &Limits) -> String {
    value
        .chars()
        .map(|c| if in_name_alphabet(c) { c } else { '_' })
        .take(limits.frame.max_header_chars as usize)
        .collect()
}

/// Code points invisible to a person and still read by a model: every
/// format character (Unicode 16.0 category Cf), every Default_Ignorable_Code_Point
/// (the Hangul fillers, the combining grapheme joiner, both blocks of
/// variation selectors, which can carry hidden bytes, and the unassigned
/// ignorables up to U+E0FFF), and the blank braille pattern U+2800.
/// Look-alike brackets such as U+FF1C are visible and stay; whether a
/// model reads them as a tag is measured at V6.
fn is_invisible(c: char) -> bool {
    matches!(
        u32::from(c),
        0x00AD
            | 0x034F
            | 0x0600..=0x0605
            | 0x061C
            | 0x06DD
            | 0x070F
            | 0x0890..=0x0891
            | 0x08E2
            | 0x115F..=0x1160
            | 0x17B4..=0x17B5
            | 0x180B..=0x180F
            | 0x200B..=0x200F
            | 0x202A..=0x202E
            | 0x2060..=0x206F
            | 0x2800
            | 0x3164
            | 0xFE00..=0xFE0F
            | 0xFEFF
            | 0xFFA0
            | 0xFFF0..=0xFFFB
            | 0x110BD
            | 0x110CD
            | 0x13430..=0x1343F
            | 0x1BCA0..=0x1BCA3
            | 0x1D173..=0x1D17A
            | 0xE0000..=0xE0FFF
    )
}

fn is_private_use(c: char) -> bool {
    matches!(u32::from(c), 0xE000..=0xF8FF | 0xF0000..=0xFFFFD | 0x100000..=0x10FFFD)
}

fn is_noncharacter(c: char) -> bool {
    let code = u32::from(c);
    (0xFDD0..=0xFDEF).contains(&code) || code & 0xFFFE == 0xFFFE
}

/// The body escape: line breaks of every kind become `\n`; control
/// characters other than tab, invisible code points, private-use code points
/// and noncharacters are removed; `&`, `<`, `>` become entities; every line
/// gets the gutter.
fn escape_body(body: &str) -> String {
    let unified = body
        .replace("\r\n", "\n")
        .replace(['\r', '\u{0085}', '\u{2028}', '\u{2029}'], "\n");
    let mut clean = String::with_capacity(unified.len());
    for c in unified.chars() {
        let removed = (c.is_control() && c != '\n' && c != '\t')
            || is_invisible(c)
            || is_private_use(c)
            || is_noncharacter(c);
        match c {
            _ if removed => {}
            '&' => clean.push_str("&amp;"),
            '<' => clean.push_str("&lt;"),
            '>' => clean.push_str("&gt;"),
            other => clean.push(other),
        }
    }
    clean
        .split('\n')
        .map(|line| format!("{GUTTER}{line}"))
        .collect::<Vec<_>>()
        .join("\n")
}

/// The frame of one claimed item: a message wrapped with its body (read
/// from the store), or a notice in its own tag. A message whose body the
/// store could not read (`None`) gets the contract's body-missing line in
/// place of the body, and keeps its header and reply line. A notice has no
/// body, so `body` is not read for one.
pub fn render(item: &ClaimedItem, body: Option<&str>, limits: &Limits) -> String {
    match &item.what {
        ClaimedWhat::Mail(from) => render_message(item, from, body, limits),
        ClaimedWhat::Notice(facts) => render_notice(item, facts, limits),
    }
}

fn render_message(
    item: &ClaimedItem,
    sender: &MailFrom,
    body: Option<&str>,
    limits: &Limits,
) -> String {
    let from = escape_header(&sender.label, limits);
    let id = escape_header(item.id.as_str(), limits);
    let agent = escape_header(sender.cli.as_ref().map_or(NO_AGENT, |c| c.as_str()), limits);
    let attempt = item.attempt.to_string();
    let reply = if sender.has_head {
        fill(section("message.reply"), &[("from", &from), ("id", &id)])
    } else {
        String::new()
    };
    let body = match body {
        Some(text) => escape_body(text),
        None => fill(section("message.body-missing"), &[("from", &from)]),
    };
    fill(
        section("message"),
        &[
            ("from", &from),
            ("agent", &agent),
            ("id", &id),
            ("attempt", &attempt),
            ("body", &body),
            ("reply", &reply),
        ],
    )
}

/// A notice: its own tag, its reason, no reply.
fn render_notice(item: &ClaimedItem, facts: &NoticeFacts, limits: &Limits) -> String {
    let id = escape_header(item.id.as_str(), limits);
    let about = escape_header(facts.about.as_str(), limits);
    let about_to = escape_header(&facts.about_to, limits);
    let reason_section = match facts.reason {
        RefusalReason::RecordTtl => "notice.reason.record-ttl",
        RefusalReason::OfferCap => "notice.reason.offer-cap",
    };
    let values = [("about", about.as_str()), ("about_to", about_to.as_str())];
    let reason = fill(section(reason_section), &values);
    fill(
        section("notice"),
        &[
            ("id", &id),
            ("about", &about),
            ("about_to", &about_to),
            ("reason", &reason),
        ],
    )
}

/// The bytes a gutter and an entity can add per body byte: `&` becomes
/// `&amp;` (5 bytes), and a line break of one byte becomes a new line
/// with its gutter.
const ENTITY_GROWTH: usize = 5;
const GUTTER_GROWTH: usize = GUTTER.len();

/// The largest size the frame of `item` can render to when its body holds
/// `body_bytes` bytes, or when the body cannot be read: the frame around
/// an empty body, plus `5 × body_bytes` (entity growth) and
/// `2 × (body_bytes + 1)` (a gutter on every line; a body of only line
/// breaks has one more line than bytes), or the body-missing line when that
/// is longer. A notice has no body; its size is its rendered size.
pub fn worst_case_len(item: &ClaimedItem, body_bytes: u64, limits: &Limits) -> usize {
    match &item.what {
        ClaimedWhat::Notice(facts) => render_notice(item, facts, limits).len(),
        ClaimedWhat::Mail(from) => {
            let bytes = usize::try_from(body_bytes).unwrap_or(usize::MAX);
            let around = render_message(item, from, Some(""), limits).len();
            let body = bytes
                .saturating_mul(ENTITY_GROWTH)
                .saturating_add(bytes.saturating_add(1).saturating_mul(GUTTER_GROWTH));
            let label = escape_header(&from.label, limits);
            let missing = fill(section("message.body-missing"), &[("from", &label)]).len();
            around.saturating_add(body.max(missing))
        }
    }
}

/// The line a step drain prints when `count` waiting items are too large
/// for its channel: it names the count and the command that reads them.
pub fn too_large_pointer(count: u32) -> String {
    fill(
        section("message.too-large-for-channel"),
        &[("count", &count.to_string())],
    )
}

/// What a bounded step keeps free for the pointer line: its length at the
/// largest count, plus the blank line that joins it to the frames.
pub fn pointer_reserve() -> usize {
    too_large_pointer(u32::MAX).len() + FRAME_SEPARATOR.len()
}

/// What joins two frames, and the last frame to the pointer line.
pub const FRAME_SEPARATOR: &str = "\n\n";
