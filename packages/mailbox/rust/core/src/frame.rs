//! The frame (spec §5.5): every offered message and notice is rendered from
//! the one contract file `packages/mailbox/contracts/frame.v1.txt`, embedded
//! at compile time. Header values are reduced to the name alphabet and
//! bounded; the body is escaped so no body text can close the frame, open
//! another one or imitate the trailing instruction lines. The escape lowers
//! the risk that a model acts on forged text; it does not remove it.
use crate::delivery::ClaimedItem;
use crate::envelope::RefusalReason;
use crate::limits::Limits;
use crate::names::in_name_alphabet;

const FRAME: &str = include_str!("../../../contracts/frame.v1.txt");

/// The prefix of every body line inside a frame.
const GUTTER: &str = "| ";

/// The `agent` value of a sender with no head.
const NO_AGENT: &str = "unregistered";

/// The contract's sections, `(name, text)`, in file order.
pub fn frame_sections() -> Vec<(&'static str, &'static str)> {
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

fn section(name: &str) -> &'static str {
    frame_sections()
        .into_iter()
        .find(|(n, _)| *n == name)
        .map(|(_, text)| text)
        .expect("the frame contract has every section; its test guards this")
}

/// Fills `{{name}}` placeholders in one left-to-right pass. Inserted text is
/// never scanned again, so a value holding a placeholder stays literal.
fn fill(template: &str, values: &[(&str, &str)]) -> String {
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
fn escape_header(value: &str, limits: &Limits) -> String {
    value
        .chars()
        .map(|c| if in_name_alphabet(c) { c } else { '_' })
        .take(limits.frame.max_header_chars as usize)
        .collect()
}

/// Unicode format characters (category Cf): invisible to a person, still
/// read by a model.
fn is_format(c: char) -> bool {
    matches!(
        u32::from(c),
        0x00AD
            | 0x0600..=0x0605
            | 0x061C
            | 0x06DD
            | 0x070F
            | 0x180E
            | 0x200B..=0x200F
            | 0x202A..=0x202E
            | 0x2060..=0x2064
            | 0x2066..=0x206F
            | 0xFEFF
            | 0xFFF9..=0xFFFB
            | 0x110BD
            | 0xE0001
            | 0xE0020..=0xE007F
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
/// characters other than tab, format characters, private-use code points
/// and noncharacters are removed; `&`, `<`, `>` become entities; every line
/// gets the gutter.
fn escape_body(body: &str) -> String {
    let unified = body
        .replace("\r\n", "\n")
        .replace(['\r', '\u{0085}', '\u{2028}', '\u{2029}'], "\n");
    let mut clean = String::with_capacity(unified.len());
    for c in unified.chars() {
        let removed = (c.is_control() && c != '\n' && c != '\t')
            || is_format(c)
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

/// The frame of one claimed message, with its body read from the store.
pub fn render_message(item: &ClaimedItem, body: &str, limits: &Limits) -> String {
    let from = escape_header(&item.from_label, limits);
    let id = escape_header(item.id.as_str(), limits);
    let agent = escape_header(
        item.from_cli.as_ref().map_or(NO_AGENT, |c| c.as_str()),
        limits,
    );
    let attempt = item.attempt.to_string();
    let reply = if item.sender_has_head {
        fill(section("message.reply"), &[("from", &from), ("id", &id)])
    } else {
        String::new()
    };
    let body = escape_body(body);
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

/// The frame of one claimed notice: its own tag, its reason, no reply.
pub fn render_notice(item: &ClaimedItem, limits: &Limits) -> String {
    let facts = item
        .notice
        .as_ref()
        .expect("render_notice takes a claimed notice");
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
