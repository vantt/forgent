//! Did-you-mean for the command-line surfaces (`fgctl` and `fgos`): the one
//! place that decides whether a mistyped verb or flag is close enough to a
//! known name to be offered back.

/// Edit distance, for did-you-mean only (names are a few characters long).
fn distance(a: &str, b: &str) -> usize {
    let b: Vec<char> = b.chars().collect();
    let mut row: Vec<usize> = (0..=b.len()).collect();
    for (i, ca) in a.chars().enumerate() {
        let mut diagonal = row[0];
        row[0] = i + 1;
        for (j, cb) in b.iter().enumerate() {
            let above = row[j + 1];
            row[j + 1] = (diagonal + usize::from(ca != *cb))
                .min(row[j] + 1)
                .min(above + 1);
            diagonal = above;
        }
    }
    row[b.len()]
}

/// The candidate closest to `input` (leading dashes ignored on both), when it
/// is close enough to be a typo. Ties go to the first candidate, so callers
/// whose candidates come from a map pass them sorted.
pub fn suggest<'a>(input: &str, candidates: impl Iterator<Item = &'a str>) -> Option<&'a str> {
    let input = input.trim_start_matches('-');
    candidates
        .map(|candidate| {
            (
                distance(input, candidate.trim_start_matches('-')),
                candidate,
            )
        })
        .filter(|(d, candidate)| *d <= 2 && *d < candidate.trim_start_matches('-').len())
        .min_by_key(|(d, _)| *d)
        .map(|(_, candidate)| candidate)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn suggestions_need_a_near_miss() {
        let names = ["upgrade", "status", "init"];
        assert_eq!(suggest("upgrde", names.into_iter()), Some("upgrade"));
        assert_eq!(suggest("staus", names.into_iter()), Some("status"));
        assert_eq!(suggest("bogus", names.into_iter()), None);
        assert_eq!(
            suggest("--overide-pin", ["--override-pin", "--from"].into_iter()),
            Some("--override-pin")
        );
    }
}
