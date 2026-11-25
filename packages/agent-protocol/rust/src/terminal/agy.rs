use super::{
    bottom_lines, common::has_paste_chip, ComposerState, ExitCommand, Profile, StartBanner,
};
use crate::Inspection;

/// A modal start banner takes the first keystroke and `esc` closes it: 1.4.2 announces a model
/// ("Meet Gemini ..."), 1.5.2 a plan change ("Changes to third-party model access", seen in a real
/// pane, where it swallowed the brief's Enter). The ready screen's other notices also say
/// "esc to dismiss" without holding focus, so only a banner's title is a marker.
pub const PROFILE: Profile = Profile {
    cli: "agy",
    pinned_version: "1.4.2",
    version_marker: Some("antigravity cli "),
    exit: ExitCommand::Text("/exit"),
    enter_gap_ms: 300,
    submit_by_prompt_door: true,
    trust_markers: &["do you trust the contents of this project"],
    start_banners: &[
        StartBanner {
            marker: "meet gemini",
            dismiss_key: "esc",
        },
        StartBanner {
            marker: "changes to third-party model access",
            dismiss_key: "esc",
        },
    ],
    setup_markers: &[],
    composer_state,
};

fn composer_state(screen: &str, inspection: &Inspection) -> ComposerState {
    let lowered = screen.to_lowercase();
    for banner in PROFILE.start_banners {
        if lowered.contains(banner.marker) {
            return ComposerState::Unknown;
        }
    }
    if has_paste_chip(&inspection.prompt_text) || has_paste_chip(&bottom_lines(screen, 6)) {
        return ComposerState::NotEmpty;
    }
    let lines: Vec<&str> = screen.lines().collect();
    let sep_indices: Vec<usize> = lines
        .iter()
        .enumerate()
        .filter(|(_, l)| l.contains("──────"))
        .map(|(i, _)| i)
        .collect();
    if sep_indices.len() >= 2 {
        let top_sep = sep_indices[sep_indices.len() - 2];
        let bot_sep = sep_indices[sep_indices.len() - 1];
        let composer_lines: Vec<&str> = (top_sep + 1..bot_sep)
            .map(|i| lines[i].trim())
            .filter(|l| !l.is_empty())
            .collect();
        if composer_lines.is_empty() {
            return ComposerState::Empty;
        }
        if composer_lines.len() == 1 {
            let line = composer_lines[0];
            if line == ">" || line == "> " {
                return ComposerState::Empty;
            }
            let cleaned: String = line.chars().filter(|c| *c != '>').collect();
            if cleaned.trim().is_empty() {
                return ComposerState::Empty;
            }
            return ComposerState::NotEmpty;
        }
        return ComposerState::NotEmpty;
    }
    ComposerState::Unknown
}
