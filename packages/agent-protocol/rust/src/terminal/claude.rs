use super::{common::has_paste_chip, ComposerState, ExitCommand, Profile};
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
    if trimmed.starts_with("Try \"") && trimmed.ends_with('"') {
        return ComposerState::Unknown;
    }
    ComposerState::NotEmpty
}

fn composer_state(screen: &str, inspection: &Inspection) -> ComposerState {
    let pt = inspection.prompt_text.trim();
    if !pt.is_empty() {
        let state = classify_prompt_line(pt);
        if state != ComposerState::Empty {
            return state;
        }
    }
    let lines: Vec<&str> = screen.lines().collect();
    for (index, line) in lines.iter().enumerate().rev() {
        if line.trim_start().starts_with('❯') {
            let state = classify_prompt_line(line);
            if state != ComposerState::Empty {
                return state;
            }
            // The closing separator ends the composer; status below it is
            // not draft text. A blank first line alone does not mean empty.
            return if lines[index + 1..]
                .iter()
                .take_while(|line| !line.contains("──────"))
                .all(|line| line.trim().is_empty())
            {
                ComposerState::Empty
            } else {
                ComposerState::NotEmpty
            };
        }
    }
    ComposerState::Unknown
}
