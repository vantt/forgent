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

/// The composer's own line starts with `╰─`; its right edge may carry a hint.
const COMPOSER_MARK: &str = "╰─";
/// The status line directly above the composer line starts with this while the
/// agent is idle; a busy omp swaps it for a spinner glyph.
const IDLE_STATUS_MARK: &str = "π";
/// Right-aligned hints omp draws on an otherwise empty composer line.
const KNOWN_HINTS: &[&str] = &["⇧⇥ to change thinking effort"];
/// Only the composer's own line and a few draft continuation lines may follow
/// the status line, so a `╰─` further up is transcript, not the composer.
const COMPOSER_TAIL_LINES: usize = 3;

/// omp draws the status line (` π > model > ...`) and, under it, the composer
/// line `╰─ <draft>`. A screen with no `╰─` line at the bottom, or whose status
/// line is not idle (`π`), is unknown. The composer is empty only when the line
/// is blank or holds exactly a known hint, and nothing follows it.
fn composer_state(screen: &str, inspection: &Inspection) -> ComposerState {
    let lines: Vec<&str> = screen
        .lines()
        .filter(|line| !line.trim().is_empty())
        .collect();
    let first_tail = lines.len().saturating_sub(COMPOSER_TAIL_LINES);
    let Some(mark) = lines[first_tail..]
        .iter()
        .rposition(|line| line.trim_start().starts_with(COMPOSER_MARK))
        .map(|at| at + first_tail)
    else {
        return ComposerState::Unknown;
    };
    let status_is_idle = mark > 0 && lines[mark - 1].trim_start().starts_with(IDLE_STATUS_MARK);
    if !status_is_idle {
        return ComposerState::Unknown;
    }
    if !inspection.prompt_text.trim().is_empty() {
        // Any text the detector reads out of the composer is a draft or chip.
        return ComposerState::NotEmpty;
    }
    let rest = lines[mark].trim_start()[COMPOSER_MARK.len()..].trim();
    let rest_is_empty = rest.is_empty() || KNOWN_HINTS.contains(&rest);
    if rest_is_empty && lines[mark + 1..].is_empty() {
        ComposerState::Empty
    } else {
        ComposerState::NotEmpty
    }
}
