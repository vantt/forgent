use super::{bottom_lines, common::has_paste_chip, ComposerState, ExitCommand, Profile};
use crate::Inspection;

/// `/exit` leaves in under a second. The folder-trust dialog asks whether the
/// project is one the person created or trusts.
pub const PROFILE: Profile = Profile {
    cli: "claude",
    pinned_version: "2.1.302",
    exit: ExitCommand::Text("/exit"),
    enter_gap_ms: 300,
    submit_by_prompt_door: false,
    trust_markers: &["is this a project you created or one you trust"],
    start_banners: &[],
    setup_markers: &[],
    composer_state,
};

fn composer_state(screen: &str, inspection: &Inspection) -> ComposerState {
    let pt = inspection.prompt_text.trim();
    if !pt.is_empty() {
        if has_paste_chip(pt) {
            return ComposerState::NotEmpty;
        }
        let cleaned: String = pt
            .chars()
            .filter(|c| *c != '❯' && *c != '>' && *c != '\u{a0}')
            .collect();
        let trimmed = cleaned.trim();
        if trimmed.is_empty() {
            return ComposerState::Empty;
        }
        let lower = trimmed.to_lowercase();
        if lower.starts_with("try \"") || lower.starts_with("try ") {
            return ComposerState::Empty;
        }
        return ComposerState::NotEmpty;
    }
    let bottom = bottom_lines(screen, 8);
    for line in bottom.lines().rev() {
        if line.contains('❯') || line.trim_start().starts_with('>') {
            let cleaned: String = line
                .chars()
                .filter(|c| *c != '❯' && *c != '>' && *c != '\u{a0}')
                .collect();
            let trimmed = cleaned.trim();
            if trimmed.is_empty() {
                return ComposerState::Empty;
            }
            let lower = trimmed.to_lowercase();
            if lower.starts_with("try \"") || lower.starts_with("try ") {
                return ComposerState::Empty;
            }
            return ComposerState::NotEmpty;
        }
    }
    ComposerState::Unknown
}
