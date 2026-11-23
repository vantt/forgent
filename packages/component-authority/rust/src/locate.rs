//! `locate`: rank the model's components, decision kinds, contracts and doors against a sentence.
//!
//! Both sides are lowercased and Vietnamese diacritics are folded, then tokenised. An exact canonical phrase
//! hit ranks above an exact alias phrase hit, which ranks above token overlap with the meaning sentence. Ties
//! break by kind, then id. Meaning search beyond this waits for the documentation search door.

use crate::model::Model;
use serde::Serialize;
use std::collections::BTreeSet;

const CANONICAL_BASE: u32 = 3_000;
const ALIAS_BASE: u32 = 2_000;

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum MatchKind {
    Component,
    DecisionKind,
    Contract,
    Door,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum MatchedOn {
    Canonical,
    Alias,
    Meaning,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Match {
    pub kind: MatchKind,
    pub id: String,
    pub canonical: String,
    pub matched_on: MatchedOn,
    pub score: u32,
}

/// Lowercases and folds Vietnamese diacritics (`đ` to `d`, combining marks dropped).
pub fn fold(text: &str) -> String {
    const GROUPS: &[(char, &str)] = &[
        ('a', "àáảãạăằắẳẵặâầấẩẫậ"),
        ('e', "èéẻẽẹêềếểễệ"),
        ('i', "ìíỉĩị"),
        ('o', "òóỏõọôồốổỗộơờớởỡợ"),
        ('u', "ùúủũụưừứửữự"),
        ('y', "ỳýỷỹỵ"),
        ('d', "đ"),
    ];
    text.chars()
        .flat_map(char::to_lowercase)
        .filter(|c| !('\u{0300}'..='\u{036f}').contains(c))
        .map(|c| {
            GROUPS
                .iter()
                .find(|(_, set)| set.contains(c))
                .map_or(c, |(base, _)| *base)
        })
        .collect()
}

fn tokens(text: &str) -> Vec<String> {
    fold(text)
        .split(|c: char| !c.is_alphanumeric())
        .filter(|word| !word.is_empty())
        .map(str::to_owned)
        .collect()
}

/// Words that carry no subject: a sentence is not matched on them alone.
fn is_filler(word: &str) -> bool {
    word.len() < 3
        || matches!(
            word,
            "the"
                | "and"
                | "for"
                | "with"
                | "that"
                | "this"
                | "from"
                | "into"
                | "are"
                | "its"
                | "how"
        )
}

fn contains_phrase(sentence: &[String], phrase: &[String]) -> bool {
    !phrase.is_empty()
        && sentence.len() >= phrase.len()
        && sentence
            .windows(phrase.len())
            .any(|window| window == phrase)
}

struct Row<'a> {
    kind: MatchKind,
    id: &'a str,
    canonical: &'a str,
    aliases: &'a [String],
    meaning: &'a str,
}

fn score(sentence: &[String], row: &Row<'_>) -> Option<(MatchedOn, u32)> {
    let canonical = tokens(row.canonical);
    if contains_phrase(sentence, &canonical) {
        return Some((
            MatchedOn::Canonical,
            CANONICAL_BASE + canonical.len() as u32,
        ));
    }
    let alias_hit = row
        .aliases
        .iter()
        .map(|alias| tokens(alias))
        .filter(|alias| contains_phrase(sentence, alias))
        .map(|alias| alias.len() as u32)
        .max();
    if let Some(words) = alias_hit {
        return Some((MatchedOn::Alias, ALIAS_BASE + words));
    }
    let meaning: BTreeSet<String> = tokens(row.meaning)
        .into_iter()
        .filter(|word| !is_filler(word))
        .collect();
    let overlap = sentence
        .iter()
        .filter(|word| !is_filler(word))
        .collect::<BTreeSet<_>>()
        .into_iter()
        .filter(|word| meaning.contains(*word))
        .count() as u32;
    (overlap > 0).then_some((MatchedOn::Meaning, overlap))
}

/// Every model row that matches `sentence`, best first.
pub fn locate(model: &Model, sentence: &str) -> Vec<Match> {
    let words = tokens(sentence);
    let mut rows: Vec<Row<'_>> = Vec::new();
    rows.extend(model.components.iter().map(|row| Row {
        kind: MatchKind::Component,
        id: &row.id,
        canonical: &row.canonical,
        aliases: &row.aliases,
        meaning: &row.meaning,
    }));
    rows.extend(model.decision_kinds.iter().map(|row| Row {
        kind: MatchKind::DecisionKind,
        id: &row.id,
        canonical: &row.canonical,
        aliases: &row.aliases,
        meaning: &row.meaning,
    }));
    rows.extend(model.contracts.iter().map(|row| Row {
        kind: MatchKind::Contract,
        id: &row.id,
        canonical: &row.canonical,
        aliases: &row.aliases,
        meaning: &row.meaning,
    }));
    rows.extend(model.doors.iter().map(|row| Row {
        kind: MatchKind::Door,
        id: &row.slug,
        canonical: &row.job,
        aliases: &[],
        meaning: row.reason.as_deref().unwrap_or(""),
    }));
    let mut found: Vec<Match> = rows
        .iter()
        .filter_map(|row| {
            score(&words, row).map(|(matched_on, score)| Match {
                kind: row.kind,
                id: row.id.to_owned(),
                canonical: row.canonical.to_owned(),
                matched_on,
                score,
            })
        })
        .collect();
    found.sort_by(|a, b| {
        b.score
            .cmp(&a.score)
            .then(a.kind.cmp(&b.kind))
            .then(a.id.cmp(&b.id))
    });
    found
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::{Component, Layers};

    fn component(id: &str, canonical: &str, aliases: &[&str], meaning: &str) -> Component {
        Component {
            id: id.into(),
            canonical: canonical.into(),
            aliases: aliases.iter().map(|a| (*a).into()).collect(),
            meaning: meaning.into(),
            parent: None,
            layer: "kernel".into(),
            tier: 0,
            paths: vec![],
            exceptions: vec![],
            owns: vec![],
            must_not_own: vec![],
            spec: "s".into(),
            source: vec![],
            status: "live".into(),
            reason: None,
        }
    }

    fn model(components: Vec<Component>) -> Model {
        Model {
            layers: Layers {
                contract: None,
                layers: vec![],
                rules: vec![],
                domains: vec![],
                tier_names: Default::default(),
                tier_exceptions: vec![],
            },
            components,
            decision_kinds: vec![],
            contracts: vec![],
            doors: vec![],
        }
    }

    #[test]
    fn a_canonical_hit_beats_an_alias_hit_which_beats_meaning_overlap() {
        let m = model(vec![
            component("m", "other", &[], "writes a file atomically to disk"),
            component("a", "other-two", &["write file"], "unrelated"),
            component("c", "write-file", &[], "unrelated"),
        ]);
        let found = locate(&m, "write file atomically");
        let order: Vec<_> = found
            .iter()
            .map(|f| (f.id.as_str(), f.matched_on))
            .collect();
        assert_eq!(
            order,
            [
                ("c", MatchedOn::Canonical),
                ("a", MatchedOn::Alias),
                ("m", MatchedOn::Meaning)
            ]
        );
    }

    #[test]
    fn vietnamese_diacritics_fold_to_the_same_match() {
        let m = model(vec![component(
            "d",
            "durable-file",
            &["ghi file nguyên tử"],
            "x",
        )]);
        assert_eq!(locate(&m, "GHI FILE NGUYEN TU").first().unwrap().id, "d");
        assert_eq!(fold("Đường nguyên tử"), "duong nguyen tu");
        assert_eq!(fold("nguye\u{302}\u{303}n tu\u{309}"), "nguyen tu");
    }

    #[test]
    fn ties_break_by_kind_then_id() {
        let m = model(vec![
            component("b", "same", &[], "x"),
            component("a", "same", &[], "x"),
        ]);
        let ids: Vec<_> = locate(&m, "same").into_iter().map(|f| f.id).collect();
        assert_eq!(ids, ["a", "b"]);
    }

    #[test]
    fn a_sentence_with_no_shared_subject_matches_nothing() {
        let m = model(vec![component("a", "alpha", &[], "the quick brown fox")]);
        assert!(locate(&m, "zebra").is_empty());
    }
}
