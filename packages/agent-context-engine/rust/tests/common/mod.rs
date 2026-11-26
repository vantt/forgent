#![allow(dead_code)]
//! Builders shared by the tests: a rule file as the reader would produce it, without going through YAML.

use std::collections::BTreeSet;

use fgos_agent_context_engine::compose::{compose, Conflict, ConflictCode};
use fgos_agent_context_engine::rule::{
    Authority, Kind, Lifecycle, Mode, RuleFile, RuleUnit, Scope,
};

pub struct B(pub RuleFile);

pub fn rule(id: &str) -> B {
    B(RuleFile {
        unit: RuleUnit {
            id: id.to_string(),
            owner: "core".to_string(),
            kind: Kind::Procedure,
            mode: Mode::Append,
            scope: Scope::Repo,
            specificity: 10,
            title: id.to_string(),
            description: None,
            lifecycle: Lifecycle::Live,
            valid_from: "2026-01-01".to_string(),
            valid_to: None,
            superseded_by: None,
            refines: Vec::new(),
            depends_on: Vec::new(),
            conflicts_with: Vec::new(),
            related: Vec::new(),
            when: Default::default(),
        },
        body: format!("{id} body"),
        source: format!("core/instructions/{id}.md"),
        authority: Authority::Platform,
    })
}

fn ids(list: &[&str]) -> Vec<String> {
    list.iter().map(|s| (*s).to_string()).collect()
}

impl B {
    pub fn kind(mut self, k: Kind) -> B {
        self.0.unit.kind = k;
        self
    }
    pub fn mode(mut self, m: Mode) -> B {
        self.0.unit.mode = m;
        self
    }
    pub fn scope(mut self, s: Scope) -> B {
        self.0.unit.scope = s;
        self.0.unit.specificity = s.default_specificity();
        self
    }
    pub fn spec(mut self, n: u32) -> B {
        self.0.unit.specificity = n;
        self
    }
    pub fn refines(mut self, list: &[&str]) -> B {
        self.0.unit.refines = ids(list);
        self
    }
    pub fn depends(mut self, list: &[&str]) -> B {
        self.0.unit.depends_on = ids(list);
        self
    }
    pub fn conflicts(mut self, list: &[&str]) -> B {
        self.0.unit.conflicts_with = ids(list);
        self
    }
    pub fn related(mut self, list: &[&str]) -> B {
        self.0.unit.related = ids(list);
        self
    }
    pub fn when(mut self, key: &str, values: &[&str]) -> B {
        self.0.unit.when.insert(key.to_string(), ids(values));
        self
    }
    pub fn body(mut self, text: &str) -> B {
        self.0.body = text.to_string();
        self
    }
    pub fn lifecycle(mut self, l: Lifecycle) -> B {
        self.0.unit.lifecycle = l;
        self
    }
    pub fn replaced_by(mut self, successor: &str) -> B {
        self.0.unit.lifecycle = Lifecycle::Replaced;
        self.0.unit.superseded_by = Some(successor.to_string());
        self.0.unit.valid_to = Some("2027-01-01".to_string());
        self
    }
    pub fn source(mut self, path: &str) -> B {
        self.0.source = path.to_string();
        self
    }
    /// The unit sits under `domains/<name>/instructions/`, owned by the domain, at domain scope.
    pub fn domain(mut self, name: &str) -> B {
        self.0.authority = Authority::Domain(name.to_string());
        self.0.unit.owner = name.to_string();
        self.0.unit.scope = Scope::Domain;
        self.0.unit.specificity = 30;
        self.0.source = format!("domains/{name}/instructions/{}.md", self.0.unit.id);
        self
    }
    /// The unit sits under `components/<name>/instructions/`, owned by the component, at component scope.
    pub fn component(mut self, name: &str) -> B {
        self.0.authority = Authority::Component(name.to_string());
        self.0.unit.owner = name.to_string();
        self.0.unit.scope = Scope::Component;
        self.0.unit.specificity = 20;
        self.0.source = format!("components/{name}/instructions/{}.md", self.0.unit.id);
        self
    }
    pub fn build(self) -> RuleFile {
        self.0
    }
}

/// The ids of every rule that is live, deprecated or replaced: what pkm answers for a day inside every window.
pub fn in_force(rules: &[RuleFile]) -> BTreeSet<String> {
    rules
        .iter()
        .filter(|r| {
            matches!(
                r.unit.lifecycle,
                Lifecycle::Live | Lifecycle::Deprecated | Lifecycle::Replaced
            )
        })
        .map(|r| r.unit.id.clone())
        .collect()
}

pub fn composed_ids(rules: &[RuleFile]) -> Vec<String> {
    compose(rules, &in_force(rules))
        .expect("composition succeeds")
        .into_iter()
        .map(|r| r.unit.id)
        .collect()
}

pub fn conflicts_of(rules: &[RuleFile]) -> Vec<Conflict> {
    compose(rules, &in_force(rules)).expect_err("composition fails")
}

pub fn has(conflicts: &[Conflict], code: ConflictCode) -> bool {
    conflicts.iter().any(|c| c.code == code)
}

pub fn has_message(conflicts: &[Conflict], code: ConflictCode, needle: &str) -> bool {
    conflicts
        .iter()
        .any(|c| c.code == code && c.message.contains(needle))
}
