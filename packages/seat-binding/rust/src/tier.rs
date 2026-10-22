//! Tier vocabulary, strength order and the ladder definitions: one contract file,
//! the source of the `$comment` that `fgos setup` writes into the config and of the
//! tier names the Node config loader accepts.

use serde::{Deserialize, Serialize};
use std::sync::OnceLock;

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Tier {
    Nano,
    Mini,
    Standard,
    Advanced,
    Flagship,
    Frontier,
}

impl Tier {
    pub const ALL: [Tier; 6] = [
        Tier::Nano,
        Tier::Mini,
        Tier::Standard,
        Tier::Advanced,
        Tier::Flagship,
        Tier::Frontier,
    ];

    pub fn name(self) -> &'static str {
        self.definition().name.as_str()
    }

    /// 1 (nano) to 6 (frontier).
    pub fn strength(self) -> u8 {
        self.definition().strength
    }

    pub fn definition(self) -> &'static TierDefinition {
        &tier_ladder()[self as usize]
    }

    pub fn parse(text: &str) -> Option<Tier> {
        Tier::ALL.into_iter().find(|tier| tier.name() == text)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TierDefinition {
    pub name: String,
    pub strength: u8,
    pub work: String,
    pub self_check: String,
    pub examples: String,
}

#[derive(Deserialize)]
struct LadderFile {
    tiers: Vec<TierDefinition>,
}

const LADDER_JSON: &str = include_str!("../../contracts/seat-binding.tier-ladder.v1.json");

/// The ladder, weakest first. Names, strength and definitions live in the shared contract file
/// `seat-binding.tier-ladder.v1.json` (the Node config loader reads the same file) and nowhere else.
pub fn tier_ladder() -> &'static [TierDefinition] {
    static LADDER: OnceLock<Vec<TierDefinition>> = OnceLock::new();
    LADDER.get_or_init(|| {
        let file: LadderFile = serde_json::from_str(LADDER_JSON).expect("the tier ladder contract parses");
        assert_eq!(file.tiers.len(), Tier::ALL.len(), "the ladder contract lists every tier");
        for (tier, definition) in Tier::ALL.iter().zip(&file.tiers) {
            assert_eq!(definition.name, format!("{tier:?}").to_lowercase(), "the ladder contract is weakest first");
        }
        file.tiers
    })
}

#[derive(Debug, Clone, Serialize)]
pub struct Ladder {
    pub vocabulary: Vec<&'static str>,
    pub definitions: Vec<TierDefinition>,
}

/// The tier vocabulary and its definitions (the text behind `$comment` and `explain`).
pub fn ladder() -> Ladder {
    Ladder {
        vocabulary: tier_ladder().iter().map(|d| d.name.as_str()).collect(),
        definitions: tier_ladder().to_vec(),
    }
}

/// `--effort` levels a cell may promise; the order is the strength order.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Effort {
    Low,
    Medium,
    High,
    Max,
}

impl Effort {
    pub fn name(self) -> &'static str {
        match self {
            Effort::Low => "low",
            Effort::Medium => "medium",
            Effort::High => "high",
            Effort::Max => "max",
        }
    }
}

/// Effective rigor: decides checker count and independence strictness, never tier.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum Rigor {
    Low,
    #[default]
    Standard,
    High,
    Critical,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ladder_is_ordered_weakest_first() {
        for pair in Tier::ALL.windows(2) {
            assert!(pair[0] < pair[1]);
            assert!(pair[0].strength() < pair[1].strength());
        }
        assert_eq!(Tier::Nano.strength(), 1);
        assert_eq!(Tier::Frontier.strength(), 6);
    }

    #[test]
    fn names_round_trip_and_unknown_is_none() {
        for tier in Tier::ALL {
            assert_eq!(Tier::parse(tier.name()), Some(tier));
            assert_eq!(tier.definition().name, tier.name());
        }
        assert_eq!(Tier::parse("premium"), None);
    }

    #[test]
    fn ladder_lists_six_definitions_in_order() {
        let ladder = ladder();
        assert_eq!(
            ladder.vocabulary,
            ["nano", "mini", "standard", "advanced", "flagship", "frontier"]
        );
        assert_eq!(ladder.definitions.len(), 6);
        assert!(ladder
            .definitions
            .iter()
            .all(|d| !d.work.is_empty() && !d.self_check.is_empty()));
    }

    #[test]
    fn effort_and_rigor_orders() {
        assert!(Effort::Low < Effort::Medium && Effort::High < Effort::Max);
        assert!(Rigor::Low < Rigor::Standard && Rigor::High < Rigor::Critical);
    }
}
