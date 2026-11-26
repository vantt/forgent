//! The persona block: the one renderer of a persona's text for every start (head openings, worker prompts).
//! Finding and reading the persona file is the host's (its agent-definition layers); this module only renders.

/// The fields of a persona definition that its block shows, already read and checked by the host.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct PersonaFields {
    pub description: String,
    pub voice: String,
    pub style: String,
    pub archetype: String,
    pub skills: Vec<String>,
    pub can_decide: Vec<String>,
    pub must_escalate: Vec<String>,
    /// The `on_wake` text a head runs after its start ritual; empty for none.
    pub on_wake: String,
    /// The definition's `role`, the heading of its agent file.
    pub role: String,
    /// The definition's `tool-scope`: the tools its agent file grants.
    pub tools: Vec<String>,
    /// The definition's path relative to its root, named in its agent file; empty for pinned text.
    pub source: String,
}

/// What the host found for a persona name.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PersonaLookup {
    Found(PersonaFields),
    /// No layer defines the persona: the block is the bare section.
    NotFound,
    /// The definition was found but cannot be read or rendered: one visible line says why.
    Failed(String),
}

/// The persona section of a start, as lines: the frame, then the definition's fields, then its decision boundaries.
pub fn persona_section(persona: &str, lookup: &PersonaLookup) -> Vec<String> {
    let mut lines: Vec<String> = vec![
        String::new(),
        "# Persona".into(),
        format!("You are acting under the resolved persona \"{persona}\". Let this persona"),
        "shape tone, emphasis, and judgment calls for this assignment, without".into(),
        "overriding the Role, Objective, or Constraints stated elsewhere in this prompt.".into(),
    ];
    let fields = match lookup {
        PersonaLookup::Found(fields) => fields,
        PersonaLookup::NotFound => return lines,
        PersonaLookup::Failed(line) => {
            lines.push(line.clone());
            return lines;
        }
    };
    if !fields.description.is_empty() {
        lines.push(format!("Description: {}", fields.description));
    }
    for (value, label) in [
        (&fields.voice, "Voice"),
        (&fields.style, "Style"),
        (&fields.archetype, "Archetype"),
    ] {
        if !value.is_empty() {
            lines.push(format!("{label}: {value}"));
        }
    }
    if !fields.skills.is_empty() {
        lines.push(format!("Skills to load: {}", fields.skills.join(", ")));
    }
    lines.push(String::new());
    lines.push("## Decision Boundaries".into());
    for (items, label) in [
        (&fields.can_decide, "Can decide:"),
        (&fields.must_escalate, "Must escalate:"),
    ] {
        if !items.is_empty() {
            lines.push(label.into());
            lines.extend(items.iter().map(|item| format!("- {item}")));
        }
    }
    lines
}
