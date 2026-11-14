//! Changeset object construction; all object writes belong to Git.
use crate::{
    envelope::{sha256, Envelope, Seal},
    errors::{invalid, Error},
    layout::StreamId,
    walk::git_error,
};
use fgos_git::{CommitInput, Identity, Oid, Publication, RepoHandle, TreeEntry};
pub fn objects(
    port: &dyn Publication,
    repo: &RepoHandle,
    machine: &str,
    stream: &StreamId,
    bytes: &[u8],
    events: &[Envelope],
    mut parents: Vec<Oid>,
) -> Result<Oid, Error> {
    let first = events.first().ok_or_else(|| invalid("empty seal"))?;
    let last = events.last().unwrap();
    let mut promoted = None;
    for e in events.iter().filter(|e| e.event_type == "store.promote") {
        let oid = Oid::parse(
            e.payload["tip"]
                .as_str()
                .ok_or_else(|| invalid("missing promote tip"))?,
            repo.object_format(),
        )
        .map_err(|e| invalid(e.to_string()))?;
        if promoted.as_ref().is_some_and(|old| *old != oid) {
            return Err(invalid("one segment cannot promote multiple tips"));
        }
        promoted = Some(oid);
    }
    if let Some(oid) = promoted {
        parents.push(oid);
    }
    let header = Seal::Seal {
        v: 1,
        machine_id: machine.into(),
        origin: first.origin.clone(),
        stream: stream.as_str().into(),
        scope: stream.scope(),
        first_seq: first.seq,
        last_seq: last.seq,
        count: events.len() as u64,
        sha256: sha256(bytes),
    };
    let event_blob = port.write_blob(repo, bytes).map_err(git_error)?;
    let seal_blob = port
        .write_blob(repo, &header.canonical_line()?)
        .map_err(git_error)?;
    let tree = port
        .write_tree(
            repo,
            &[
                TreeEntry {
                    name: b"events.jsonl".to_vec(),
                    mode: 0o100644,
                    oid: event_blob,
                },
                TreeEntry {
                    name: b"seal.json".to_vec(),
                    mode: 0o100644,
                    oid: seal_blob,
                },
            ],
        )
        .map_err(git_error)?;
    event_commit(
        port,
        repo,
        tree,
        parents,
        timestamp_seconds(&last.ts)?,
        format!(
            "fgos-events seal {}:{} {}..{}",
            first.origin,
            stream.as_str(),
            first.seq,
            last.seq
        )
        .into_bytes(),
    )
}

/// Seal and merge commits use one identity and one deterministic date encoder.
pub(crate) fn event_commit(
    port: &dyn Publication,
    repo: &RepoHandle,
    tree: Oid,
    parents: Vec<Oid>,
    seconds: i64,
    message: Vec<u8>,
) -> Result<Oid, Error> {
    port.write_commit(repo, &event_commit_input(tree, parents, seconds, message))
        .map_err(git_error)
}

pub(crate) fn event_commit_input(
    tree: Oid,
    parents: Vec<Oid>,
    seconds: i64,
    message: Vec<u8>,
) -> CommitInput {
    let identity = || Identity {
        name: "fgOS Event Store".into(),
        email: "event-store@fgos.invalid".into(),
    };
    let date = format!("{} +0000", seconds.max(0));
    CommitInput {
        tree,
        parents,
        author: identity(),
        committer: identity(),
        author_date: date.clone(),
        committer_date: date,
        message,
    }
}

/// Whole Unix seconds of an event date. The envelope owns which dates are valid; the identity
/// helper owns the date arithmetic. A date before 1970 has no unsigned form and reads as 0, the
/// value a Git commit date is clamped to anyway.
pub(crate) fn timestamp_seconds(ts: &str) -> Result<i64, Error> {
    if !crate::envelope::valid_timestamp(ts) {
        return Err(invalid("invalid event date"));
    }
    Ok(fgos_identity::text::iso_utc_secs(ts).map_or(0, |secs| secs as i64))
}

#[cfg(test)]
mod tests {
    use super::timestamp_seconds;

    #[test]
    fn an_event_date_reads_as_unix_seconds_and_a_date_the_envelope_refuses_is_refused() {
        for (ts, secs) in [
            ("1970-01-01T00:00:00.000Z", 0),
            ("1970-03-01T00:00:00.000Z", 59 * 86_400),
            ("1999-12-31T23:59:59.999Z", 946_684_799),
            ("2000-02-29T23:59:59.000Z", 951_868_799),
            ("2038-01-19T03:14:08.500Z", 2_147_483_648),
            ("2100-03-01T00:00:00.000Z", 4_107_542_400),
            ("1969-12-31T23:59:59.000Z", 0),
        ] {
            assert_eq!(timestamp_seconds(ts).unwrap(), secs, "{ts}");
        }
        for bad in [
            "2023-02-29T00:00:00.000Z",
            "2024-04-31T00:00:00.000Z",
            "2024-01-01T00:00:60.000Z",
            "2024-01-01T00:00:00Z",
            "2024-01-01 00:00:00.000Z",
            "",
        ] {
            assert!(timestamp_seconds(bad).is_err(), "{bad}");
        }
    }
}
