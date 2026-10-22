//! The mint door: every id that travels between machines comes from here, so
//! two machines never mint the same work item, decision number or backlog id
//! (docs/platform/identity/spec.md, section 4a).
//!
//! Random kinds (`work`, `backlog`) are `<prefix>-<10 base32>`: 50 random bits,
//! no state, never derived from content. Sequence kinds (`d-adr`,
//! `decision-file`) keep their exact format and are claimed one number at a
//! time from a counter ref through the Git component.

use crate::text::{base32_prefix, random_bytes};
use std::io;

/// Random characters of every random id: 50 bits.
pub const RANDOM_CHARS: usize = 10;

/// A kind whose id is random.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RandomKind {
    Work,
    Backlog,
}

impl RandomKind {
    fn prefix(self) -> &'static str {
        match self {
            RandomKind::Work => "tsk",
            RandomKind::Backlog => "p",
        }
    }
}

/// A kind whose id is the next number of a shared counter.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SequenceKind {
    DAdr,
    DecisionFile,
}

impl SequenceKind {
    /// The counter, `refs/fgos/seq/<this>`.
    pub fn counter(self) -> &'static str {
        match self {
            SequenceKind::DAdr => "d-adr",
            SequenceKind::DecisionFile => "decision-file",
        }
    }

    /// The id as it is written in documents and file names.
    pub fn format(self, number: u64) -> String {
        match self {
            SequenceKind::DAdr => format!("D-ADR{number:04}"),
            SequenceKind::DecisionFile => format!("{number:04}"),
        }
    }
}

/// Every kind `fgos identity mint` accepts.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Kind {
    Random(RandomKind),
    Sequence(SequenceKind),
}

/// The kind names, in the order they are listed to a caller.
pub const KIND_NAMES: &[&str] = &["work", "backlog", "d-adr", "decision-file"];

impl Kind {
    pub fn parse(name: &str) -> Option<Kind> {
        Some(match name {
            "work" => Kind::Random(RandomKind::Work),
            "backlog" => Kind::Random(RandomKind::Backlog),
            "d-adr" => Kind::Sequence(SequenceKind::DAdr),
            "decision-file" => Kind::Sequence(SequenceKind::DecisionFile),
            _ => return None,
        })
    }

    pub fn name(self) -> &'static str {
        match self {
            Kind::Random(RandomKind::Work) => "work",
            Kind::Random(RandomKind::Backlog) => "backlog",
            Kind::Sequence(kind) => kind.counter(),
        }
    }
}

/// A fresh `<prefix>-<10 base32>` id.
pub fn random(kind: RandomKind) -> io::Result<String> {
    let bytes = random_bytes::<7>()?;
    Ok(format!(
        "{}-{}",
        kind.prefix(),
        base32_prefix(&bytes, RANDOM_CHARS)
    ))
}

#[cfg(feature = "provider")]
pub use sequence::{claim_counter, claim_sequence, release_sequence, Claim, MAX_CLAIM_ATTEMPTS};

#[cfg(feature = "provider")]
mod sequence {
    use super::SequenceKind;
    use crate::project::open_repository;
    use crate::provider::Refusal;
    use crate::text::random_bytes;
    use fgos_git::{OperationError, RepoHandle, SequencePush};
    use std::fs;
    use std::path::{Path, PathBuf};

    /// A refused compare-and-swap is retried this many times before the claim gives up.
    pub const MAX_CLAIM_ATTEMPTS: usize = 5;
    /// A document this large is not read for ids.
    const MAX_DOC_BYTES: u64 = 4 * 1024 * 1024;

    /// A number claimed from a counter.
    #[derive(Debug, Clone, PartialEq, Eq)]
    pub struct Claim {
        pub kind: SequenceKind,
        pub number: u64,
        /// The id as written in documents, e.g. `D-ADR0073`.
        pub id: String,
    }

    fn git_refusal(e: OperationError) -> Refusal {
        let stderr = String::from_utf8_lossy(&e.stderr);
        let stderr = stderr.trim();
        Refusal {
            reason: "sequence-unreachable",
            detail: format!(
                "the counter could not be read or written ({}{}{}); no number was claimed. Retry when the remote is reachable: the id format never changes to work around a missing network",
                e.cause,
                if stderr.is_empty() { "" } else { ": " },
                stderr.lines().next().unwrap_or("")
            ),
        }
    }

    /// Claims the next number of `kind` for the repository containing `dir`:
    /// one more than the larger of the counter and the highest number the
    /// repository's own documents already carry. `driver_dir` is the fgOS
    /// state root the Git driver uses.
    pub fn claim_sequence(
        driver_dir: &Path,
        dir: &Path,
        kind: SequenceKind,
    ) -> Result<Claim, Refusal> {
        let (_, repo) = open_repository(driver_dir, dir)?;
        let floor = highest_in_documents(&document_root(&repo), kind);
        let number = claim_counter(driver_dir, dir, kind.counter(), floor)?;
        Ok(Claim {
            kind,
            number,
            id: kind.format(number),
        })
    }

    /// The claim loop on any counter: one more than the larger of the
    /// counter and `floor`, retrying a refused compare-and-swap.
    pub fn claim_counter(
        driver_dir: &Path,
        dir: &Path,
        counter: &str,
        floor: u64,
    ) -> Result<u64, Refusal> {
        let (driver, repo) = open_repository(driver_dir, dir)?;
        let home = driver.sequence_home(&repo);
        for _ in 0..MAX_CLAIM_ATTEMPTS {
            let tip = driver
                .sequence_tip(&repo, &home, counter)
                .map_err(git_refusal)?;
            let number = tip.as_ref().map_or(0, |t| t.number).max(floor) + 1;
            let claimant = claimant()?;
            match driver
                .sequence_push(
                    &repo,
                    &home,
                    counter,
                    tip.as_ref().map(|t| &t.oid),
                    number,
                    &claimant,
                )
                .map_err(git_refusal)?
            {
                SequencePush::Claimed(_) => return Ok(number),
                SequencePush::Stale => continue,
            }
        }
        Err(Refusal {
            reason: "sequence-contended",
            detail: format!(
                "the {counter} counter moved under {MAX_CLAIM_ATTEMPTS} claims in a row; no number was claimed, run the command again"
            ),
        })
    }

    /// Gives `number` back when the commit that was to use it failed: the
    /// counter goes back one step, but only when `number` is still its tip,
    /// that is, nobody claimed after. `Ok(false)` leaves the counter alone.
    pub fn release_sequence(
        driver_dir: &Path,
        dir: &Path,
        kind: SequenceKind,
        number: u64,
    ) -> Result<bool, Refusal> {
        let (driver, repo) = open_repository(driver_dir, dir)?;
        let home = driver.sequence_home(&repo);
        let tip = driver
            .sequence_tip(&repo, &home, kind.counter())
            .map_err(git_refusal)?;
        let Some(tip) = tip.filter(|t| t.number == number) else {
            return Ok(false);
        };
        let pushed = driver
            .sequence_push(
                &repo,
                &home,
                kind.counter(),
                Some(&tip.oid),
                number.saturating_sub(1),
                &claimant()?,
            )
            .map_err(git_refusal)?;
        Ok(matches!(pushed, SequencePush::Claimed(_)))
    }

    /// Different for every claim: the commit of a claim must differ from a racing claim's.
    fn claimant() -> Result<String, Refusal> {
        let bytes = random_bytes::<8>().map_err(|e| Refusal {
            reason: "random-unavailable",
            detail: e.to_string(),
        })?;
        Ok(format!(
            "claim-{}",
            bytes.iter().map(|b| format!("{b:02x}")).collect::<String>()
        ))
    }

    fn document_root(repo: &RepoHandle) -> PathBuf {
        repo.work_tree()
            .unwrap_or_else(|| repo.trusted_main_root())
            .to_path_buf()
    }

    /// The highest number of `kind` the documents under `root` already carry:
    /// `D-ADR####` in a heading of `docs/specs/*.md` or `docs/platform-foundations.md`, or the `NNNN-` prefix of a
    /// file directly in `docs/decisions/`. 0 when there is none.
    pub(crate) fn highest_in_documents(root: &Path, kind: SequenceKind) -> u64 {
        match kind {
            SequenceKind::DAdr => decision_documents(root)
                .into_iter()
                .filter_map(|file| fs::read_to_string(file).ok())
                .flat_map(|text| {
                    text.lines()
                        .filter(|l| l.starts_with('#'))
                        .flat_map(adr_numbers)
                        .collect::<Vec<_>>()
                })
                .max()
                .unwrap_or(0),
            SequenceKind::DecisionFile => fs::read_dir(root.join("docs/decisions"))
                .into_iter()
                .flatten()
                .flatten()
                .filter_map(|entry| {
                    let name = entry.file_name().to_string_lossy().into_owned();
                    let (digits, rest) = name.split_at_checked(4)?;
                    (rest.starts_with('-') && digits.bytes().all(|b| b.is_ascii_digit()))
                        .then(|| digits.parse().ok())?
                })
                .max()
                .unwrap_or(0),
        }
    }

    /// Every `D-ADR` followed by four digits in `line`.
    pub(crate) fn adr_numbers(line: &str) -> Vec<u64> {
        line.match_indices("D-ADR")
            .filter_map(|(at, tag)| {
                let digits = line.get(at + tag.len()..at + tag.len() + 4)?;
                digits
                    .bytes()
                    .all(|b| b.is_ascii_digit())
                    .then(|| digits.parse().ok())?
            })
            .collect()
    }

    /// The documents that define `D-ADR` ids: the area specs and the platform laws.
    fn decision_documents(root: &Path) -> Vec<PathBuf> {
        let mut files: Vec<PathBuf> = fs::read_dir(root.join("docs/specs"))
            .into_iter()
            .flatten()
            .flatten()
            .map(|entry| entry.path())
            .filter(|path| path.extension().is_some_and(|e| e == "md"))
            .collect();
        files.push(root.join("docs/platform-foundations.md"));
        files
            .into_iter()
            .filter(|path| {
                fs::metadata(path).is_ok_and(|m| m.is_file() && m.len() <= MAX_DOC_BYTES)
            })
            .collect()
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[test]
        fn adr_numbers_come_from_four_digit_ids_only() {
            assert_eq!(
                adr_numbers("### D-ADR0072 (x), replaces D-ADR0056 and D-ADR12"),
                vec![72, 56]
            );
            assert!(adr_numbers("### ADR0072 and D-ADR").is_empty());
        }
    }
}
