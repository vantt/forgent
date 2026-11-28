use super::{ComposerState, ExitCommand, Profile};
use crate::Inspection;

/// Ctrl-D on an empty input leaves. A long paste folds into a `📄 #N`
/// attachment chip that Enter submits. No folder-trust dialog was observed.
/// A profile whose setup is older than the CLI opens a first-run setup wizard
/// (footer `Ctrl+C exit setup`) that only a person can finish.
/// The brief goes through the prompt door: a typed one is slow and a stop can
/// land mid-typing, leaving the rest in the pane shell.
pub const PROFILE: Profile = Profile {
    cli: "omp",
    pinned_version: "18.11.2",
    version_marker: None,
    exit: ExitCommand::Keys(&["C-d"]),
    enter_gap_ms: 300,
    submit_by_prompt_door: true,
    trust_markers: &[],
    start_banners: &[],
    setup_markers: &["ctrl+c exit setup"],
    composer_state,
};

/// The composer's own line starts with `╰─`; its right edge carries a hint
/// (`⇧⇥ to change thinking effort`) set off by a long run of spaces.
const COMPOSER_MARK: &str = "╰─";
/// A run of spaces this long separates the right-aligned hint from the draft;
/// typed text never has a run that wide.
const HINT_GAP: usize = 8;
/// Only the composer's own line and a few draft continuation lines may follow
/// the status line, so a `╰─` further up is transcript, not the composer.
const COMPOSER_TAIL_LINES: usize = 3;

/// omp draws the status line (` π > model > ...`) and, under it, the composer
/// line `╰─ <draft>`. Text after the mark, without the right-aligned hint, is
/// the draft; nothing is an empty composer. A screen whose last non-blank lines
/// hold no `╰─` line has no composer on it, which stays unknown.
fn composer_state(screen: &str, inspection: &Inspection) -> ComposerState {
    if !inspection.prompt_text.trim().is_empty() {
        // Any text the detector reads out of the composer is a draft or chip.
        return ComposerState::NotEmpty;
    }
    let tail: Vec<&str> = screen
        .lines()
        .filter(|line| !line.trim().is_empty())
        .collect();
    let tail = &tail[tail.len().saturating_sub(COMPOSER_TAIL_LINES)..];
    let Some(mark) = tail
        .iter()
        .rposition(|line| line.trim_start().starts_with(COMPOSER_MARK))
    else {
        return ComposerState::Unknown;
    };
    let first = tail[mark].trim_start()[COMPOSER_MARK.len()..].trim_end();
    let first = if first.starts_with(&" ".repeat(HINT_GAP)) {
        // Only the hint is on the line.
        ""
    } else {
        first.split(&" ".repeat(HINT_GAP)).next().unwrap_or("")
    };
    if first.trim().is_empty() && tail[mark + 1..].iter().all(|line| line.trim().is_empty()) {
        ComposerState::Empty
    } else {
        ComposerState::NotEmpty
    }
}
