use super::{bottom_lines, common::has_paste_chip, ComposerState, ExitCommand, Profile};
use crate::Inspection;

/// `/exit` leaves in under a second. The folder-trust dialog asks whether the
/// project is one the person created or trusts.
pub const PROFILE: Profile = Profile {
    cli: "claude",
    pinned_version: "2.1.302",
    version_marker: Some("claude code v"),
    exit: ExitCommand::Text("/exit"),
    enter_gap_ms: 300,
    submit_by_prompt_door: false,
    trust_markers: &["is this a project you created or one you trust"],
    start_banners: &[],
    setup_markers: &[],
    composer_state,
};

fn strip_prompt_prefix(line: &str) -> &str {
    let s = line.trim();
    s.strip_prefix('❯')
        .or_else(|| s.strip_prefix('>'))
        .unwrap_or(s)
        .trim_start()
}

fn classify_prompt_line(line: &str) -> ComposerState {
    if has_paste_chip(line) {
        return ComposerState::NotEmpty;
    }
    let trimmed = strip_prompt_prefix(line).trim();
    if trimmed.is_empty() {
        return ComposerState::Empty;
    }
    // Screen text alone cannot distinguish the placeholder from an identical draft.
    if trimmed == "Try \"refactor <filepath>\"" {
        return ComposerState::Unknown;
    }
    ComposerState::NotEmpty
}

fn composer_state(screen: &str, inspection: &Inspection) -> ComposerState {
    let pt = inspection.prompt_text.trim();
    if !pt.is_empty() {
        return classify_prompt_line(pt);
    }
    let bottom = bottom_lines(screen, 8);
    for line in bottom.lines().rev() {
        if line.contains('❯') || line.trim_start().starts_with('>') {
            return classify_prompt_line(line);
        }
    }
    ComposerState::Unknown
}
