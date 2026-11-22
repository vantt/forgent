//! Whether a session rotates now, from the measured fraction, the thresholds of its persona and the at-rest facts,
//! and the `sessionRotation` config section those come from. Pure: the caller supplies every fact.

use serde_json::Value;
use std::collections::BTreeMap;

/// The `sessionRotation` section as the hook reads it (the keys the executor alone reads are not here).
#[derive(Debug, Clone, PartialEq)]
pub struct RotationConfig {
    pub soft: f64,
    pub hard: f64,
    pub quota: Option<f64>,
    /// Used when the status line reports no window size.
    pub window_size: u64,
    pub personas: BTreeMap<String, PersonaRotation>,
}

/// One persona's overrides: a threshold left `None` keeps the global one.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct PersonaRotation {
    pub soft: Option<f64>,
    pub hard: Option<f64>,
    pub quota: Option<f64>,
    /// Repo-relative portfolio paths the successor rereads.
    pub reload: Vec<String>,
}

/// A config section that cannot be used, or thresholds that contradict each other.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
#[error("session rotation config: {0}")]
pub struct ConfigError(pub String);

/// `soft` and `hard` in effect for one persona.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Thresholds {
    pub soft: f64,
    pub hard: f64,
    pub quota: Option<f64>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Level {
    None,
    Soft,
    Hard,
}

impl Level {
    /// The reason word of a verb request (`soft` or `hard`); `None` rotates nothing.
    pub fn reason(self) -> Option<&'static str> {
        match self {
            Level::None => None,
            Level::Soft => Some("soft"),
            Level::Hard => Some("hard"),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Decision {
    pub rotate: Level,
    pub reason: &'static str,
}

fn number(section: &Value, key: &str) -> Result<Option<f64>, ConfigError> {
    match section.get(key) {
        None => Ok(None),
        Some(v) => v
            .as_f64()
            .filter(|n| n.is_finite() && *n >= 0.0)
            .map(Some)
            .ok_or_else(|| ConfigError(format!("{key} must be a number of at least 0"))),
    }
}

impl RotationConfig {
    /// Reads the effective `sessionRotation` section. The bundled standard holds every key, so a missing or
    /// mistyped one is refused by name instead of defaulted here.
    pub fn from_section(section: &Value) -> Result<Self, ConfigError> {
        let soft = number(section, "soft")?.ok_or_else(|| ConfigError("soft is missing".into()))?;
        let hard = number(section, "hard")?.ok_or_else(|| ConfigError("hard is missing".into()))?;
        let quota = number(section, "quota")?;
        let window_size = section
            .get("windowSize")
            .and_then(Value::as_u64)
            .filter(|n| *n >= 1)
            .ok_or_else(|| ConfigError("windowSize must be a whole number of at least 1".into()))?;
        let mut personas = BTreeMap::new();
        if let Some(map) = section.get("personas").and_then(Value::as_object) {
            for (name, own) in map {
                let reload = match own.get("reload") {
                    None => Vec::new(),
                    Some(list) => list
                        .as_array()
                        .and_then(|items| {
                            items
                                .iter()
                                .map(|i| i.as_str().map(str::to_string))
                                .collect::<Option<Vec<_>>>()
                        })
                        .ok_or_else(|| {
                            ConfigError(format!("personas.{name}.reload must be a list of paths"))
                        })?,
                };
                personas.insert(
                    name.clone(),
                    PersonaRotation {
                        soft: number(own, "soft")?,
                        hard: number(own, "hard")?,
                        quota: number(own, "quota")?,
                        reload,
                    },
                );
            }
        }
        Ok(Self {
            soft,
            hard,
            quota,
            window_size,
            personas,
        })
    }

    /// `soft` and `hard` of `persona`: its own override where set, else the global values; refused when soft is
    /// above hard.
    pub fn thresholds_for(&self, persona: &str) -> Result<Thresholds, ConfigError> {
        let own = self.personas.get(persona);
        let soft = own.and_then(|p| p.soft).unwrap_or(self.soft);
        let hard = own.and_then(|p| p.hard).unwrap_or(self.hard);
        let quota = own.and_then(|p| p.quota).or(self.quota);
        if soft > hard {
            let owned = own.is_some_and(|p| p.soft.is_some() || p.hard.is_some());
            return Err(ConfigError(format!(
                "soft {soft} is above hard {hard}{}",
                if owned {
                    format!(" for persona {persona}")
                } else {
                    String::new()
                }
            )));
        }
        Ok(Thresholds { soft, hard, quota })
    }

    /// The portfolio paths the successor of `persona` rereads.
    pub fn reload_of(&self, persona: &str) -> &[String] {
        self.personas
            .get(persona)
            .map_or(&[], |p| p.reload.as_slice())
    }
}

/// What the session was doing when it stopped.
#[derive(Debug, Clone, Copy, Default)]
pub struct AtRest {
    pub pending_question: bool,
    pub background_tasks: usize,
    pub session_crons: usize,
}

/// A background task blocks only `soft` (hard carries it into the handoff); a cron never blocks (the
/// successor recreates it); a pending owner question blocks only `soft`, because `hard` carries the question
/// verbatim into the handoff. Weekly quota use at or above the threshold rotates hard with `weekly-quota-near-limit`
/// even below soft, and neither a pending question nor a background task holds it.
pub fn decide(
    fraction: Option<f64>,
    thresholds: Thresholds,
    rest: AtRest,
    quota: Option<f64>,
) -> Decision {
    if let (Some(limit), Some(used)) = (thresholds.quota, quota) {
        if used.is_finite() && used >= limit {
            return Decision {
                rotate: Level::Hard,
                reason: "weekly-quota-near-limit",
            };
        }
    }
    let none = |reason| Decision {
        rotate: Level::None,
        reason,
    };
    let Some(fraction) = fraction.filter(|f| f.is_finite()) else {
        return none("no-measure");
    };
    if fraction < thresholds.soft {
        return none("below-soft");
    }
    if fraction >= thresholds.hard {
        return Decision {
            rotate: Level::Hard,
            reason: "at-or-above-hard",
        };
    }
    if rest.background_tasks > 0 {
        return none("background-task-running");
    }
    if rest.pending_question {
        return none("pending-question");
    }
    Decision {
        rotate: Level::Soft,
        reason: "at-or-above-soft",
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn config() -> RotationConfig {
        RotationConfig::from_section(&json!({
            "soft": 0.4, "hard": 0.7, "quota": 0.9, "keep": 10, "windowSize": 1000000,
            "personas": { "miu": { "soft": 0.2, "hard": 0.5, "reload": ["a.md"] }, "half": { "hard": 0.9 } }
        }))
        .unwrap()
    }
    fn run_for(persona: &str, fraction: Option<f64>, rest: AtRest) -> Decision {
        decide(fraction, config().thresholds_for(persona).unwrap(), rest, None)
    }
    fn run(fraction: Option<f64>, rest: AtRest) -> Decision {
        run_for("other", fraction, rest)
    }

    #[test]
    fn below_soft_nothing_rotates() {
        assert_eq!(run(Some(0.39), AtRest::default()).rotate, Level::None);
    }

    #[test]
    fn at_rest_between_soft_and_hard_rotates_soft_and_at_or_above_hard_rotates_hard() {
        assert_eq!(run(Some(0.4), AtRest::default()).rotate, Level::Soft);
        assert_eq!(run(Some(0.7), AtRest::default()).rotate, Level::Hard);
    }

    #[test]
    fn a_pending_question_holds_soft_but_not_hard() {
        let rest = AtRest {
            pending_question: true,
            ..AtRest::default()
        };
        assert_eq!(run(Some(0.5), rest).reason, "pending-question");
        assert_eq!(run(Some(0.8), rest).rotate, Level::Hard);
    }

    #[test]
    fn a_cron_never_blocks_and_a_background_task_holds_soft_but_not_hard() {
        let cron = AtRest {
            session_crons: 1,
            ..AtRest::default()
        };
        assert_eq!(run(Some(0.5), cron).rotate, Level::Soft);
        assert_eq!(run(Some(0.9), cron).rotate, Level::Hard);

        let task = AtRest {
            background_tasks: 1,
            ..AtRest::default()
        };
        assert_eq!(run(Some(0.5), task).reason, "background-task-running");
        assert_eq!(run(Some(0.5), task).rotate, Level::None);
        assert_eq!(run(Some(0.9), task).rotate, Level::Hard);
    }

    #[test]
    fn an_unmeasured_session_never_rotates() {
        assert_eq!(run(None, AtRest::default()).reason, "no-measure");
        assert_eq!(run(Some(f64::NAN), AtRest::default()).reason, "no-measure");
    }

    #[test]
    fn a_persona_override_replaces_the_global_thresholds_and_a_partial_one_keeps_the_other_global()
    {
        let rest = AtRest::default();
        assert_eq!(run_for("miu", Some(0.25), rest).rotate, Level::Soft);
        assert_eq!(run_for("miu", Some(0.5), rest).rotate, Level::Hard);
        let c = config();
        assert_eq!(
            c.thresholds_for("half").unwrap(),
            Thresholds {
                soft: 0.4,
                hard: 0.9,
                quota: Some(0.9),
            }
        );
        assert_eq!(
            c.thresholds_for("other").unwrap(),
            Thresholds {
                soft: 0.4,
                hard: 0.7,
                quota: Some(0.9),
            }
        );
        assert_eq!(c.reload_of("miu"), ["a.md".to_string()]);
        assert!(c.reload_of("half").is_empty());
    }

    #[test]
    fn weekly_use_at_or_above_quota_rotates_hard_with_weekly_quota_near_limit_even_below_soft_and_with_pending_question_or_background_tasks(
    ) {
        let c = config();
        let thresholds = c.thresholds_for("planner").unwrap();

        // 1. Below soft (e.g. fraction 0.1), but weekly use >= quota (0.92 >= 0.9)
        let rest = AtRest {
            pending_question: true,
            background_tasks: 2,
            session_crons: 1,
        };
        let d = decide(Some(0.1), thresholds, rest, Some(0.92));
        assert_eq!(d.rotate, Level::Hard);
        assert_eq!(d.reason, "weekly-quota-near-limit");

        // 2. Exactly at quota (0.90)
        let d2 = decide(Some(0.0), thresholds, rest, Some(0.90));
        assert_eq!(d2.rotate, Level::Hard);
        assert_eq!(d2.reason, "weekly-quota-near-limit");

        // 3. Below quota (0.85) -> normal below soft
        let d3 = decide(Some(0.1), thresholds, rest, Some(0.85));
        assert_eq!(d3.rotate, Level::None);
        assert_eq!(d3.reason, "below-soft");
    }

    #[test]
    fn soft_above_hard_is_refused_by_name_and_a_missing_key_is_not_defaulted() {
        let mut c = config();
        c.personas.insert(
            "p".into(),
            PersonaRotation {
                soft: Some(0.9),
                ..PersonaRotation::default()
            },
        );
        assert!(c
            .thresholds_for("p")
            .unwrap_err()
            .0
            .contains("soft 0.9 is above hard 0.7 for persona p"));
        assert!(
            RotationConfig::from_section(&json!({ "soft": 0.4, "windowSize": 1 }))
                .unwrap_err()
                .0
                .contains("hard is missing")
        );
        assert!(
            RotationConfig::from_section(&json!({ "soft": 0.4, "hard": 0.7 }))
                .unwrap_err()
                .0
                .contains("windowSize")
        );
    }
}
