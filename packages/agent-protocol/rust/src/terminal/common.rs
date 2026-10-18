//! Screen matchers and timings every terminal adapter shares. The patterns are
//! the ones the Node controller used (`herdr-round.mjs`), written by hand so
//! the crate stays free of a regex dependency; each carries its original
//! expression and is covered by vectors taken from real screens.

/// A brief that never landed is worth re-sending a couple of times; one that
/// never lands twice is a broken transport, not a slow one.
pub const MAX_RESENDS: u32 = 2;
/// An agent UI draws its prompt box before its startup work has finished
/// taking input: settle time after the prompt first looks ready.
pub const PROMPT_SETTLE_MS: u64 = 1500;
/// How often the ready and submit checks look at the detector.
pub const POLL_MS: u64 = 700;
/// How long to wait for an agent without a screen rule to draw and hold still
/// before typing at it anyway.
pub const UNRULED_READY_MS: u64 = 15_000;
/// A typed brief still sitting unsubmitted is nudged with Enter no more often
/// than this, and never more than `SUBMIT_MAX_ENTERS` times.
pub const SUBMIT_ENTER_EVERY_MS: u64 = 2500;
pub const SUBMIT_MAX_ENTERS: u32 = 6;
/// Consecutive looks with no unsent draft after which the submit check is over.
pub const SUBMIT_NO_DRAFT_POLLS: u32 = 4;
/// How long after typing the adapter keeps checking that the brief was taken.
pub const SUBMIT_CONFIRM_MS: u64 = 60_000;

/// Whitespace-free form: a prompt box wraps a long line, so text is compared
/// without breaks.
pub fn squash(text: &str) -> String {
    text.chars().filter(|c| !c.is_whitespace()).collect()
}

/// The last `n` non-empty lines, joined.
pub fn bottom_lines(screen: &str, n: usize) -> String {
    let lines: Vec<&str> = screen.lines().filter(|l| !l.trim().is_empty()).collect();
    lines[lines.len().saturating_sub(n)..].join("\n")
}

fn digits_end(c: &[char], mut i: usize) -> Option<usize> {
    let start = i;
    while i < c.len() && c[i].is_ascii_digit() {
        i += 1;
    }
    (i > start).then_some(i)
}

fn skip_ws(c: &[char], mut i: usize) -> usize {
    while i < c.len() && c[i].is_whitespace() {
        i += 1;
    }
    i
}

fn starts_with(c: &[char], i: usize, lit: &str) -> Option<usize> {
    let lit: Vec<char> = lit.chars().collect();
    (c.len() >= i + lit.len() && c[i..i + lit.len()] == lit[..]).then_some(i + lit.len())
}

/// `[label #N]` or `[label #N detail]` (detail is anything but `]`).
fn bracket_chip(c: &[char], i: usize, label: &str) -> bool {
    let Some(i) = starts_with(c, i, label) else {
        return false;
    };
    let Some(i) = digits_end(c, i) else {
        return false;
    };
    match c.get(i) {
        Some(']') => true,
        Some(' ') => {
            let rest = &c[i + 1..];
            matches!(rest.iter().position(|ch| *ch == ']'), Some(at) if at >= 1)
        }
        _ => false,
    }
}

/// Collapsed paste markers, modal paste menus and attachment chips (omp's
/// `📄 #N`) rendered in agent TUI composers.
///
/// Original, case-insensitive: `(\[paste #\d+(?: [^\]]+)?\]|\[Pasted text #\d+(?: [^\]]+)?\]|\[Paste\]|#\d+\s*(?:…|\.\.\.)\s*\+\d+\s*lines|Pasted \d+ lines|📄\s*#\d+)`
pub fn has_paste_chip(text: &str) -> bool {
    let c: Vec<char> = text.to_lowercase().chars().collect();
    (0..c.len()).any(|i| {
        bracket_chip(&c, i, "[paste #")
            || bracket_chip(&c, i, "[pasted text #")
            || starts_with(&c, i, "[paste]").is_some()
            || hash_ellipsis_lines(&c, i)
            || pasted_n_lines(&c, i)
            || attachment_chip(&c, i)
    })
}

fn hash_ellipsis_lines(c: &[char], i: usize) -> bool {
    let Some(i) = starts_with(c, i, "#") else {
        return false;
    };
    let Some(i) = digits_end(c, i) else {
        return false;
    };
    let i = skip_ws(c, i);
    let Some(i) = starts_with(c, i, "…").or_else(|| starts_with(c, i, "...")) else {
        return false;
    };
    let i = skip_ws(c, i);
    let Some(i) = starts_with(c, i, "+") else {
        return false;
    };
    let Some(i) = digits_end(c, i) else {
        return false;
    };
    starts_with(c, skip_ws(c, i), "lines").is_some()
}

fn pasted_n_lines(c: &[char], i: usize) -> bool {
    let Some(i) = starts_with(c, i, "pasted ") else {
        return false;
    };
    let Some(i) = digits_end(c, i) else {
        return false;
    };
    starts_with(c, i, " lines").is_some()
}

fn attachment_chip(c: &[char], i: usize) -> bool {
    let Some(i) = starts_with(c, i, "📄") else {
        return false;
    };
    let Some(i) = starts_with(c, skip_ws(c, i), "#") else {
        return false;
    };
    digits_end(c, i).is_some()
}

fn is_word(ch: char) -> bool {
    ch.is_alphanumeric() || ch == '_'
}

/// Active working indicators on the visible bottom lines of an unruled or
/// partially ruled TUI.
///
/// Original, case-insensitive: `(?:──\s*[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]\s*Working|\bWorking(?:…|\.\.\.)|\besc to (?:interrupt|cancel)\b)`
pub fn has_working_tail(text: &str) -> bool {
    let c: Vec<char> = text.to_lowercase().chars().collect();
    (0..c.len()).any(|i| {
        let boundary_before = i == 0 || !is_word(c[i - 1]);
        spinner_working(&c, i)
            || (boundary_before
                && starts_with(&c, i, "working").is_some_and(|j| {
                    starts_with(&c, j, "…").is_some() || starts_with(&c, j, "...").is_some()
                }))
            || (boundary_before
                && ["esc to interrupt", "esc to cancel"].iter().any(|lit| {
                    starts_with(&c, i, lit).is_some_and(|j| c.get(j).is_none_or(|ch| !is_word(*ch)))
                }))
    })
}

fn spinner_working(c: &[char], i: usize) -> bool {
    let Some(i) = starts_with(c, i, "──") else {
        return false;
    };
    let i = skip_ws(c, i);
    match c.get(i) {
        Some(ch) if "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏".contains(*ch) => {}
        _ => return false,
    }
    starts_with(c, skip_ws(c, i + 1), "working").is_some()
}

/// Whether an unsubmitted draft or collapsed paste chip sits in the agent's
/// composer. Checks the detector's composer text first, then falls back to the
/// bottom 6 non-empty lines of the visible screen so historical turns further
/// up never read as an unsent draft. Needles are 48 characters (the Node
/// original counted UTF-16 units; the two differ only past the BMP).
pub fn draft_still_in_composer(message: &str, prompt_text: &str, visible_screen: &str) -> bool {
    let squashed: Vec<char> = squash(message).chars().collect();
    let tail: String = squashed[squashed.len().saturating_sub(48)..]
        .iter()
        .collect();
    let head: String = squashed.iter().take(48).collect();
    let holds = |text: &str| {
        let text = squash(text);
        (!tail.is_empty() && text.contains(&tail)) || (!head.is_empty() && text.contains(&head))
    };
    let boxed = prompt_text.trim();
    if !boxed.is_empty() && (has_paste_chip(boxed) || holds(boxed)) {
        return true;
    }
    if !visible_screen.is_empty() {
        let bottom = bottom_lines(visible_screen, 6);
        if has_paste_chip(&bottom) {
            return true;
        }
        if boxed.is_empty() && holds(&bottom) {
            return true;
        }
    }
    false
}
