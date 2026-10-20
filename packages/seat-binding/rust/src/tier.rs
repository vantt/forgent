//! Tier vocabulary, strength order and the ladder definitions: one constant,
//! the source of the `$comment` that `fgos setup` writes into the config.

use serde::{Deserialize, Serialize};

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
        self.definition().name
    }

    /// 1 (nano) to 6 (frontier).
    pub fn strength(self) -> u8 {
        self.definition().strength
    }

    pub fn definition(self) -> &'static TierDefinition {
        &TIER_LADDER[self as usize]
    }

    pub fn parse(text: &str) -> Option<Tier> {
        Tier::ALL.into_iter().find(|tier| tier.name() == text)
    }
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TierDefinition {
    pub name: &'static str,
    pub strength: u8,
    pub work: &'static str,
    pub self_check: &'static str,
    pub examples: &'static str,
}

/// The ladder, weakest first. Strength and definitions live here and nowhere else.
pub const TIER_LADDER: [TierDefinition; 6] = [
    TierDefinition {
        name: "nano",
        strength: 1,
        work: "cơ học, không suy luận",
        self_check: "chỉ nhận ra hoặc biến đổi theo mẫu?",
        examples: "classify, extract, format, route, vote",
    },
    TierDefinition {
        name: "mini",
        strength: 2,
        work: "suy luận nhẹ trên đầu vào cho sẵn, phạm vi hẹp",
        self_check: "đủ thông tin, chỉ hiểu và tóm tắt?",
        examples: "tóm tắt, trả lời từ tài liệu cho, sửa nhỏ chính xác, review diff nhỏ",
    },
    TierDefinition {
        name: "standard",
        strength: 3,
        work: "theo một kế hoạch có sẵn, nhiều bước",
        self_check: "có kế hoạch và hướng dẫn chi tiết?",
        examples: "code theo plan, viết test, refactor theo mô tả",
    },
    TierDefinition {
        name: "advanced",
        strength: 4,
        work: "tự tìm đường, không có đáp án sẵn",
        self_check: "phải điều tra và quyết cách làm?",
        examples: "debug khó, code phức tạp, nhiều file không có plan",
    },
    TierDefinition {
        name: "flagship",
        strength: 5,
        work: "phán đoán, thiết kế, phê bình",
        self_check: "kết quả là một ý kiến hay một thiết kế?",
        examples: "review, red-team, thiết kế giải pháp, synthesis của panel",
    },
    TierDefinition {
        name: "frontier",
        strength: 6,
        work: "quyết định đắt nhất",
        self_check: "khó đảo, đắt nếu sai?",
        examples: "khoá kiến trúc, synthesis cuối của hội đồng quan trọng",
    },
];

#[derive(Debug, Clone, Serialize)]
pub struct Ladder {
    pub vocabulary: Vec<&'static str>,
    pub definitions: Vec<TierDefinition>,
}

/// The tier vocabulary and its definitions (the text behind `$comment` and `explain`).
pub fn ladder() -> Ladder {
    Ladder {
        vocabulary: TIER_LADDER.iter().map(|d| d.name).collect(),
        definitions: TIER_LADDER.to_vec(),
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
