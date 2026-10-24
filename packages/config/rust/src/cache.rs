//! Cache by content (spec section 5): a snapshot is reused while every source's size and sha256,
//! the token file, the bundle digest and the request are unchanged. The cache is a value the caller owns.
use crate::snapshot::{build, read_sources, token_revision};
use crate::snapshot::{Context, Snapshot, SnapshotError, SnapshotRequest};

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct CacheStats {
    pub hits: u64,
    pub misses: u64,
}

type Sum = Option<(usize, String)>;
/// The request, the bundle digest, each source's sum and the token file's.
type Key = (SnapshotRequest, String, Vec<Sum>, Sum);

#[derive(Default)]
pub struct SnapshotCache {
    /// The key is `None` for a snapshot with a detected value: `PATH` is not a hashed source.
    held: Option<(Option<Key>, Snapshot)>,
    pub stats: CacheStats,
}

/// One open, one read and one hash per source per call; the snapshot is built only on a miss.
pub fn snapshot_cached<'c>(
    cache: &'c mut SnapshotCache,
    ctx: &Context,
    req: &SnapshotRequest,
) -> Result<&'c Snapshot, SnapshotError> {
    let srcs = read_sources(req)?;
    let sums = srcs
        .iter()
        .map(|s| s.file.as_ref().map(|f| (f.bytes.len(), f.revision.clone())));
    let token = token_revision(&req.global_dir);
    let key: Key = (req.clone(), ctx.digest.to_string(), sums.collect(), token);
    if matches!(&cache.held, Some((Some(held), _)) if *held == key) {
        cache.stats.hits += 1;
    } else {
        let snapshot = build(ctx, req, &srcs)?;
        let detected = snapshot
            .origins
            .iter()
            .any(|o| o.provenance.layer == "detected");
        cache.held = Some(((!detected).then_some(key), snapshot));
        cache.stats.misses += 1;
    }
    cache
        .held
        .as_ref()
        .map(|(_, snapshot)| snapshot)
        .ok_or(SnapshotError::Refused(Vec::new()))
}
