//! The subject of a commit the runner makes: the first line of the agent's own summary, or of the unit's
//! objective, kept when already conventional and otherwise filed under `chore(<unitId>)`.
//! Lengths and cuts count UTF-16 code units, as the Node module this replaces did, so a subject is byte-equal.

/// The longest subject, in UTF-16 code units.
pub const SUBJECT_MAX: usize = 100;
const TYPES: [&str; 10] = [
    "feat", "fix", "docs", "refactor", "test", "chore", "perf", "build", "ci", "style",
];

fn is_conventional(line: &str) -> bool {
    let rest = TYPES
        .iter()
        .chain(["revert"].iter())
        .find_map(|t| line.strip_prefix(t));
    let Some(mut rest) = rest else { return false };
    if let Some(scoped) = rest.strip_prefix('(') {
        match scoped.find(')') {
            Some(close) if close > 0 => rest = &scoped[close + 1..],
            _ => return false,
        }
    }
    let rest = rest.strip_prefix('!').unwrap_or(rest);
    rest.strip_prefix(": ")
        .and_then(|r| r.chars().next())
        .is_some_and(|c| !c.is_whitespace())
}

/// Every run of three or more dots, or a `…`, with the blanks around it, becomes one space.
fn drop_ellipses(line: &str) -> String {
    let chars: Vec<char> = line.chars().collect();
    let mut out = String::new();
    let mut i = 0;
    while i < chars.len() {
        let mut j = i;
        while j < chars.len() && chars[j].is_whitespace() {
            j += 1;
        }
        let mut k = j;
        while k < chars.len() && chars[k] == '.' {
            k += 1;
        }
        let ellipsis_end = if k - j >= 3 {
            Some(k)
        } else if j < chars.len() && chars[j] == '\u{2026}' {
            Some(j + 1)
        } else {
            None
        };
        if let Some(end) = ellipsis_end {
            let mut end = end;
            while end < chars.len() && chars[end].is_whitespace() {
                end += 1;
            }
            out.push(' ');
            i = end;
        } else {
            out.push(chars[i]);
            i += 1;
        }
    }
    out
}

/// The line that names `text`: its first line that is not a markdown heading, else the first heading's text;
/// without any ellipsis.
fn headline(text: &str) -> String {
    let lines: Vec<&str> = text
        .split('\n')
        .map(|l| l.trim_end_matches('\r').trim())
        .filter(|l| !l.is_empty())
        .collect();
    let line = match lines.iter().find(|l| !l.starts_with('#')) {
        Some(l) => (*l).to_string(),
        None => lines
            .first()
            .map_or("", |l| l.trim_start_matches('#').trim_start())
            .to_string(),
    };
    drop_ellipses(&line)
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

fn units(text: &str) -> Vec<u16> {
    text.encode_utf16().collect()
}

fn from_units(units: &[u16]) -> String {
    String::from_utf16_lossy(units)
}

/// `subject` within [`SUBJECT_MAX`]: cut at the last sentence end that fits, else at the last word boundary,
/// else hard; never past the `type(scope): ` prefix, never ending in punctuation.
pub fn fit_subject(subject: &str) -> String {
    let all = units(subject);
    if all.len() <= SUBJECT_MAX {
        return subject.to_string();
    }
    let colon_space = all.windows(2).position(|w| w == [':' as u16, ' ' as u16]);
    let prefix_end = colon_space.map_or(1, |p| p + 2);
    let window = &all[..SUBJECT_MAX + 1];
    let is_space = |u: u16| char::from_u32(u32::from(u)).is_some_and(char::is_whitespace);
    let mut cut: Option<usize> = None;
    for (i, &u) in window.iter().enumerate() {
        let end = u < 128 && b".!?;".contains(&(u as u8));
        if end && i > prefix_end && window.get(i + 1).copied().is_some_and(is_space) {
            cut = Some(i);
        }
    }
    let cut = cut.unwrap_or_else(|| match window.iter().rposition(|&u| u == ' ' as u16) {
        Some(space) if space > prefix_end => space,
        _ => SUBJECT_MAX,
    });
    let head = from_units(&all[..cut]);
    head.trim_end_matches(|c: char| {
        c.is_whitespace() || matches!(c, '.' | ',' | ';' | ':' | '!' | '?' | '-')
    })
    .to_string()
}

/// The runner's commit subject for a round of unit `unit_id`.
pub fn subject_from(summary: Option<&str>, unit_id: &str, objective: Option<&str>) -> String {
    let from_summary = headline(summary.unwrap_or(""));
    let line = if from_summary.is_empty() {
        headline(objective.unwrap_or(""))
    } else {
        from_summary
    };
    if is_conventional(&line) {
        return fit_subject(&line);
    }
    let own = format!("{unit_id}: ");
    let text = line.strip_prefix(&own).map_or(line.as_str(), str::trim);
    let text = if text.is_empty() { "producer changes" } else { text };
    fit_subject(&format!("chore({unit_id}): {text}"))
}

/// The subject of the merge commit a unit's `syncBase` makes.
pub fn sync_subject(reference: &str) -> String {
    fit_subject(&format!("chore(sync): merge {reference}"))
}
