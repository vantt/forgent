//! Cache by content (spec section 5): a snapshot is reused while every source's size and sha256,
//! the token file, the bundle digest and the request are unchanged. The cache is a value the caller owns.
use crate::snapshot::{build, machine_sources, read_sources, token_revision, Src};
use crate::snapshot::{Context, Snapshot, SnapshotError, SnapshotRequest};

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct CacheStats {
    pub hits: u64,
    pub misses: u64,
}

type Sum = Option<(usize, String)>;
/// The request, the bundle digest, the detectors' fingerprint, each source's sum and the token file's.
type Key = (SnapshotRequest, String, String, Vec<Sum>, Sum);

#[derive(Default)]
pub struct SnapshotCache {
    held: Option<(Key, Snapshot)>,
    pub stats: CacheStats,
}

/// One open, one read and one hash per source per call; the snapshot is built only on a miss.
pub fn snapshot_cached<'c>(
    cache: &'c mut SnapshotCache,
    ctx: &Context,
    req: &SnapshotRequest,
) -> Result<&'c Snapshot, SnapshotError> {
    cached(cache, ctx, req, read_sources(req)?)
}

/// [`snapshot_cached`] for the machine view (`machine::snapshot`): the same key over the machine's
/// own sources, so it can neither hit nor evict a project read held by the same cache.
pub fn machine_cached<'c>(
    cache: &'c mut SnapshotCache,
    ctx: &Context,
    global_dir: &std::path::Path,
    class: crate::snapshot::SessionClass,
) -> Result<&'c Snapshot, SnapshotError> {
    let none = std::path::PathBuf::new();
    let req = SnapshotRequest {
        project_root: none.clone(),
        trusted_root: none,
        global_dir: global_dir.into(),
        class,
    };
    cached(cache, ctx, &req, machine_sources(&req)?)
}

fn cached<'c>(
    cache: &'c mut SnapshotCache,
    ctx: &Context,
    req: &SnapshotRequest,
    srcs: Vec<Src>,
) -> Result<&'c Snapshot, SnapshotError> {
    let sums = srcs
        .iter()
        .map(|s| s.file.as_ref().map(|f| (f.bytes.len(), f.revision.clone())));
    let token = token_revision(&req.global_dir);
    let key: Key = (
        req.clone(),
        ctx.digest.to_string(),
        ctx.detectors.fingerprint(),
        sums.collect(),
        token,
    );
    if matches!(&cache.held, Some((held, _)) if *held == key) {
        cache.stats.hits += 1;
    } else {
        cache.held = Some((key, build(ctx, req, &srcs)?));
        cache.stats.misses += 1;
    }
    cache
        .held
        .as_ref()
        .map(|(_, snapshot)| snapshot)
        .ok_or(SnapshotError::Refused(Vec::new()))
}
