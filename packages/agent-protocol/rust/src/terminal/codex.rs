use super::{bottom_lines, common::has_paste_chip, ComposerState, ExitCommand, Profile};
use crate::Inspection;

/// `/quit` leaves (the thread stays in codex's daemon). Text then Enter sent
/// back to back reads as a paste, so the gap before Enter is longer here. A
/// long typed brief still loses its first Enters to the paste handling, so the
/// brief goes through the prompt door (bracketed paste plus submit) instead.
pub const PROFILE: Profile = Profile {
    cli: "codex",
    pinned_version: "0.163.0",
    version_marker: Some("codex (v"),
    exit: ExitCommand::Text("/quit"),
    enter_gap_ms: 600,
    submit_by_prompt_door: true,
    trust_markers: &[
        "do you trust the contents of this directory",
        "trust this folder?",
    ],
    start_banners: &[],
    setup_markers: &["hooks need review"],
    composer_state,
};

fn composer_state(screen: &str, inspection: &Inspection) -> ComposerState {
    if has_paste_chip(&inspection.prompt_text) || has_paste_chip(&bottom_lines(screen, 6)) {
        return ComposerState::NotEmpty;
    }
    let lines: Vec<&str> = screen.lines().collect();
    // The model/status footer is outside the composer. Keep all preceding
    // lines, including a long draft whose prompt has scrolled above the tail.
    let composer_end = lines
        .iter()
        .rposition(|line| line.trim_start().starts_with("GPT-") && line.contains(" · "))
        .unwrap_or(lines.len());
    for (index, line) in lines[..composer_end].iter().enumerate().rev() {
        let trimmed = line.trim();
        if line.contains('›')
            || (trimmed.starts_with('>')
                && !trimmed.starts_with(">_")
                && !trimmed.starts_with(">="))
        {
            let cleaned: String = line
                .chars()
                .filter(|c| *c != '›' && *c != '>' && *c != '\u{a0}')
                .collect();
            let prompt_text = cleaned.trim();
            if prompt_text.is_empty()
                || prompt_text.eq_ignore_ascii_case("ask codex to do anything")
            {
                return if lines[index + 1..composer_end]
                    .iter()
                    .all(|line| line.trim().is_empty())
                {
                    ComposerState::Empty
                } else {
                    ComposerState::NotEmpty
                };
            }
            return ComposerState::NotEmpty;
        }
    }
    ComposerState::Unknown
}
