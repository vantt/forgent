//! Typed, bounded reads through the existing hardened driver. No repair/network.
use crate::{
    driver::{Output, Policy},
    *,
};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::time::Duration;

const LIMIT: usize = 32 * 1024 * 1024;
fn oid(repo: &RepoHandle, bytes: &[u8]) -> Result<Oid> {
    Oid::parse(
        std::str::from_utf8(bytes).map_err(|_| failure("invalid-object-id"))?,
        repo.object_format(),
    )
    .map_err(|_| failure("invalid-object-id"))
}
fn records(bytes: &[u8]) -> Result<Vec<&[u8]>> {
    if bytes.is_empty() {
        return Ok(vec![]);
    }
    let bytes = bytes
        .strip_suffix(&[0])
        .ok_or_else(|| failure("invalid-nul-protocol"))?;
    Ok(bytes.split(|b| *b == 0).collect())
}

#[derive(Debug, Clone, Copy)]
pub enum Untracked {
    None,
    Normal,
    All,
}
/// Whether `status` also reports ignored paths, Git's `--ignored=traditional`:
/// a wholly ignored directory is collapsed to `dir/`, and an ignored path
/// inside a collapsed untracked directory is still listed on its own.
#[derive(Debug, Clone, Copy, Default)]
pub enum Ignored {
    #[default]
    Excluded,
    Listed,
}
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StatusEntry {
    pub path: Vec<u8>,
    pub index: u8,
    pub worktree: u8,
    pub untracked: bool,
    pub ignored: bool,
    pub unmerged: bool,
}
#[derive(Debug, Serialize)]
pub struct DiffEntry {
    pub path: Vec<u8>,
    pub change: u8,
    /// The old path of a detected rename; only with `DiffScope::renames`.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub from: Option<Vec<u8>>,
}
/// What a `diff` compares beyond its two objects: an optional literal path
/// prefix, and whether a rename is reported once under its new path.
#[derive(Debug, Default)]
pub struct DiffScope<'a> {
    pub prefix: Option<&'a str>,
    pub renames: bool,
}
/// The two sides a `diff` compares: two pinned objects, or a commit or the
/// index against the checkout's live state.
#[derive(Debug, Clone, Copy)]
pub enum DiffSides<'a> {
    /// `before` and `after`, each a commit or a tree (`diff_text`: commits).
    Objects(&'a Oid, &'a Oid),
    /// A commit against the index (staged changes).
    IndexAgainst(&'a Oid),
    /// A commit against the work tree (staged and unstaged changes).
    WorktreeAgainst(&'a Oid),
    /// The index against the work tree (unstaged changes).
    WorktreeAgainstIndex,
}
#[derive(Debug, Clone, Copy, Default)]
pub enum Submodules {
    /// Git's own reporting, as configured.
    #[default]
    Configured,
    /// `--ignore-submodules=dirty`: a submodule's own dirt is left out; a
    /// moved submodule commit is still reported.
    IgnoreDirty,
}
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MergeTreeFact {
    pub tree: Oid,
    pub conflicted_paths: Vec<Vec<u8>>,
}
#[derive(Debug, Serialize)]
pub struct AttributeFact {
    pub path: Vec<u8>,
    pub value: String,
}
/// A canonical repository-relative prefix (a trailing `/` is accepted), never
/// pathspec magic, a glob or a traversal.
fn literal_prefix(raw: &str) -> Result<&str> {
    let prefix = raw.strip_suffix('/').unwrap_or(raw);
    if prefix.is_empty()
        || prefix.chars().any(char::is_control)
        || fgos_write_scope::canonicalize(prefix).as_deref() != Ok(prefix)
    {
        return Err(failure("invalid-literal-path"));
    }
    Ok(prefix)
}
/// Bounded canonical repository-relative paths, used under `--literal-pathspecs`.
fn literal_paths(files: &[String]) -> Result<()> {
    if files.len() > 4096
        || files.iter().map(|p| p.len() + 1).sum::<usize>() > LIMIT
        || files.iter().any(|p| crate::fgos_scope_literal(p).is_err())
    {
        return Err(failure("invalid-literal-path"));
    }
    Ok(())
}
fn count(bytes: &[u8]) -> Result<u64> {
    std::str::from_utf8(bytes)
        .ok()
        .and_then(|text| text.trim_end_matches('\n').parse().ok())
        .ok_or_else(|| failure("invalid-count"))
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorktreeFact {
    pub path: Vec<u8>,
    pub head: Option<Oid>,
    pub branch: Option<RefName>,
    pub bare: bool,
    pub detached: bool,
    pub locked: Option<Vec<u8>>,
    pub prunable: Option<Vec<u8>>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct InspectCursor {
    digest: Vec<u8>,
    offset: usize,
}
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InspectPage<T> {
    pub entries: Vec<T>,
    pub next_cursor: Option<InspectCursor>,
    pub complete: bool,
}
fn page<T>(
    entries: Vec<T>,
    bytes: &[u8],
    cursor: Option<InspectCursor>,
    max: usize,
) -> Result<InspectPage<T>> {
    if max == 0 || max > 4096 {
        return Err(failure("invalid-inspect-page-bound"));
    }
    let digest = Sha256::digest(bytes).to_vec();
    let offset = match cursor {
        Some(c) if c.digest == digest && c.offset <= entries.len() => c.offset,
        Some(_) => return Err(failure("inspect-cursor-stale")),
        None => 0,
    };
    let end = offset.saturating_add(max).min(entries.len());
    let complete = end == entries.len();
    Ok(InspectPage {
        entries: entries.into_iter().skip(offset).take(max).collect(),
        next_cursor: (!complete).then_some(InspectCursor {
            digest,
            offset: end,
        }),
        complete,
    })
}

#[derive(Debug, Serialize)]
#[serde(tag = "kind", content = "value", rename_all = "camelCase")]
pub enum TrunkFact {
    Known(RefName),
    Unknown(TrunkUnknown),
}
#[derive(Debug, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum TrunkUnknown {
    TargetAbsent,
    RemoteDefaultAmbiguous,
    MissingTarget,
}

impl GitDriver {
    fn inspect_command(&self, repo: &RepoHandle, args: &[&str]) -> Result<Output> {
        self.require_floor()?;
        self.preflight(repo)?;
        self.invoke(
            Some(repo),
            repo.trusted_main_root(),
            args,
            Policy::Inspect,
            None,
            true,
            LIMIT,
            Duration::from_secs(30),
        )
    }
    /// Work's existing fallback timing read, with bounded literal paths.
    pub fn last_path_commit_time(&self, repo: &RepoHandle, files: &[String]) -> Result<Option<i64>> {
        if files.is_empty() {
            return Err(failure("invalid-literal-path"));
        }
        literal_paths(files)?;
        let mut args = vec!["--literal-pathspecs", "log", "-1", "--format=%ct", "--"];
        args.extend(files.iter().map(String::as_str));
        let raw = self.checked(repo, &args, Policy::Inspect)?;
        let text = std::str::from_utf8(&raw).map_err(|_| failure("invalid-commit-time"))?.trim();
        if text.is_empty() { return Ok(None); }
        text.parse().map(Some).map_err(|_| failure("invalid-commit-time"))
    }
    /// Literal full refs only; missing remains distinct from errors and symbolic.
    pub fn resolve_ref(&self, repo: &RepoHandle, name: &RefName) -> Result<RefValue> {
        crate::driver::read_ref_value(repo, name, &|args| self.inspect_command(repo, args))
    }
    /// Explicit target, unique configured remote HEAD, then attached main HEAD.
    pub fn resolve_trunk(
        &self,
        repo: &RepoHandle,
        explicit: Option<&RefName>,
    ) -> Result<TrunkFact> {
        if let Some(target) = explicit {
            return Ok(match self.resolve_ref(repo, target)? {
                RefValue::Direct(_) => TrunkFact::Known(target.clone()),
                _ => TrunkFact::Unknown(TrunkUnknown::TargetAbsent),
            });
        }
        let mut defaults = std::collections::BTreeSet::new();
        let prefix = RefPrefix::parse("refs/remotes/").map_err(|_| failure("invalid-ref"))?;
        let mut cursor = None;
        loop {
            let found = self.list_refs(repo, std::slice::from_ref(&prefix), cursor, 4096)?;
            for entry in found.entries {
                if entry.name.as_str().ends_with("/HEAD") {
                    if let RefValue::Symbolic(target) = entry.value {
                        if matches!(self.resolve_ref(repo, &target)?, RefValue::Direct(_)) {
                            defaults.insert(target.as_str().to_owned());
                        }
                    }
                }
            }
            if found.complete {
                break;
            }
            cursor = found.next_cursor;
        }
        if defaults.len() > 1 {
            return Ok(TrunkFact::Unknown(TrunkUnknown::RemoteDefaultAmbiguous));
        }
        if let Some(target) = defaults.into_iter().next() {
            return Ok(TrunkFact::Known(
                RefName::parse(&target).map_err(|_| failure("invalid-ref"))?,
            ));
        }
        let main = match self.resolve_repo(repo.trusted_main_root(), repo.trusted_main_root())? {
            ResolveRepo::Repository(r) => r,
            _ => return Err(failure("trusted-main-disappeared")),
        };
        Ok(match self.resolve_head(&main)? {
            HeadFact::Attached { target, .. } if target.as_str().starts_with("refs/heads/") => {
                TrunkFact::Known(target)
            }
            _ => TrunkFact::Unknown(TrunkUnknown::MissingTarget),
        })
    }
    pub fn status(
        &self,
        repo: &RepoHandle,
        untracked: Untracked,
        submodules: Submodules,
        ignored: Ignored,
        cursor: Option<InspectCursor>,
        max: usize,
    ) -> Result<InspectPage<StatusEntry>> {
        let untracked = match untracked {
            Untracked::None => "--untracked-files=no",
            Untracked::Normal => "--untracked-files=normal",
            Untracked::All => "--untracked-files=all",
        };
        let mut args = vec![
            "status",
            "--porcelain=v2",
            "-z",
            "--no-renames",
            untracked,
            match ignored {
                Ignored::Excluded => "--ignored=no",
                Ignored::Listed => "--ignored=traditional",
            },
        ];
        if let Submodules::IgnoreDirty = submodules {
            args.push("--ignore-submodules=dirty");
        }
        let bytes = self.checked(repo, &args, Policy::Inspect)?;
        let mut entries = vec![];
        for record in records(&bytes)? {
            let entry = match record.first() {
                Some(kind @ (b'?' | b'!')) if record.get(1) == Some(&b' ') => StatusEntry {
                    path: record[2..].to_vec(),
                    index: *kind,
                    worktree: *kind,
                    untracked: *kind == b'?',
                    ignored: *kind == b'!',
                    unmerged: false,
                },
                Some(b'1') | Some(b'u') => {
                    let unmerged = record[0] == b'u';
                    let fields: Vec<_> = record
                        .splitn(if unmerged { 11 } else { 9 }, |b| *b == b' ')
                        .collect();
                    if fields.len() != if unmerged { 11 } else { 9 } || fields[1].len() != 2 {
                        return Err(failure("invalid-status-protocol"));
                    }
                    StatusEntry {
                        path: fields.last().unwrap().to_vec(),
                        index: fields[1][0],
                        worktree: fields[1][1],
                        untracked: false,
                        ignored: false,
                        unmerged,
                    }
                }
                _ => return Err(failure("invalid-status-protocol")),
            };
            if entry.path.is_empty() {
                return Err(failure("invalid-status-path"));
            }
            entries.push(entry);
        }
        page(entries, &bytes, cursor, max)
    }
    /// The `diff` arguments naming `sides`, after each pinned object is
    /// checked to be a commit (or, unless `commits_only`, a tree).
    fn diff_sides<'a>(
        &self,
        repo: &RepoHandle,
        sides: DiffSides<'a>,
        commits_only: bool,
    ) -> Result<Vec<&'a str>> {
        let require = |value: &Oid| if commits_only { self.require_commit(repo, value) } else { self.require_tree_ish(repo, value) };
        Ok(match sides {
            DiffSides::Objects(before, after) => {
                require(before)?;
                require(after)?;
                vec![before.as_str(), after.as_str()]
            }
            DiffSides::IndexAgainst(before) => {
                self.require_commit(repo, before)?;
                vec!["--cached", before.as_str()]
            }
            DiffSides::WorktreeAgainst(before) => {
                self.require_commit(repo, before)?;
                vec![before.as_str()]
            }
            DiffSides::WorktreeAgainstIndex => vec![],
        })
    }
    /// Changes between the two sides. Renames are disabled unless the scope
    /// asks for them, so both paths of a move appear independently. No
    /// cwd-relative or text conversion rules.
    pub fn diff(
        &self,
        repo: &RepoHandle,
        sides: DiffSides<'_>,
        scope: &DiffScope<'_>,
        cursor: Option<InspectCursor>,
        max: usize,
    ) -> Result<InspectPage<DiffEntry>> {
        let sides = self.diff_sides(repo, sides, false)?;
        let pathspec = scope
            .prefix
            .map(|p| literal_prefix(p).map(|p| format!(":(literal){p}")))
            .transpose()?;
        let mut args = vec![
            "diff",
            "--name-status",
            "--no-relative",
            if scope.renames { "--find-renames" } else { "--no-renames" },
            "--no-ext-diff",
            "--no-textconv",
            "-z",
        ];
        args.extend(sides);
        args.push("--");
        args.extend(pathspec.as_deref());
        let bytes = self.checked(repo, &args, Policy::Inspect)?;
        let fields = records(&bytes)?;
        let mut entries = vec![];
        let mut rest = fields.as_slice();
        while let Some((status, tail)) = rest.split_first() {
            let renamed = scope.renames
                && status.len() > 1
                && status[0] == b'R'
                && status[1..].iter().all(u8::is_ascii_digit);
            let arity = if renamed { 2 } else { 1 };
            if tail.len() < arity
                || tail[..arity].iter().any(|p| p.is_empty())
                || (!renamed && (status.len() != 1 || !b"ACDMTUXB".contains(&status[0])))
            {
                return Err(failure("invalid-diff-protocol"));
            }
            entries.push(DiffEntry {
                path: tail[arity - 1].to_vec(),
                change: status[0],
                from: renamed.then(|| tail[0].to_vec()),
            });
            rest = &tail[arity..];
        }
        page(entries, &bytes, cursor, max)
    }
    /// Bounded patch bytes for review consumers, optionally limited to literal
    /// paths and to `context` lines around each change. Never runs external
    /// diff/textconv.
    pub fn diff_text(
        &self,
        repo: &RepoHandle,
        sides: DiffSides<'_>,
        paths: &[String],
        context: Option<u32>,
        max_bytes: usize,
    ) -> Result<Vec<u8>> {
        if max_bytes == 0 || max_bytes > 50 * 1024 * 1024 || context.is_some_and(|n| n > 1_000_000) {
            return Err(failure("invalid-diff-bound"));
        }
        literal_paths(paths)?;
        let unified = context.map(|n| format!("--unified={n}"));
        let mut args = vec!["--literal-pathspecs", "diff", "--no-relative", "--no-ext-diff", "--no-textconv"];
        args.extend(unified.as_deref());
        args.extend(self.diff_sides(repo, sides, true)?);
        args.push("--");
        args.extend(paths.iter().map(String::as_str));
        let output = self.invoke(
            Some(repo), repo.trusted_main_root(),
            &args,
            Policy::Inspect, None, true, max_bytes, Duration::from_secs(30),
        )?;
        if !output.success { return Err(output.error("diff-read-failed")); }
        Ok(output.stdout)
    }
    fn require_tree_ish(&self, repo: &RepoHandle, value: &Oid) -> Result<()> {
        Oid::parse(value.as_str(), repo.object_format())
            .map_err(|_| failure("object-format-mismatch"))?;
        let kind = self.checked(repo, &["cat-file", "-t", value.as_str()], Policy::Inspect)?;
        if kind != b"commit\n" && kind != b"tree\n" {
            return Err(failure("expected-commit-or-tree"));
        }
        Ok(())
    }
    fn require_commit(&self, repo: &RepoHandle, value: &Oid) -> Result<()> {
        Oid::parse(value.as_str(), repo.object_format())
            .map_err(|_| failure("object-format-mismatch"))?;
        let kind = self.checked(repo, &["cat-file", "-t", value.as_str()], Policy::Inspect)?;
        if kind != b"commit\n" {
            return Err(failure("expected-commit"));
        }
        Ok(())
    }
    /// Positive ancestry is conclusive. A negative traversal that reaches a
    /// shallow root is incomplete, even when both endpoint objects are present.
    pub fn ancestry(&self, repo: &RepoHandle, ancestor: &Oid, descendant: &Oid) -> Result<bool> {
        self.require_commit(repo, ancestor)?;
        self.require_commit(repo, descendant)?;
        let out = self.inspect_command(
            repo,
            &[
                "merge-base",
                "--is-ancestor",
                ancestor.as_str(),
                descendant.as_str(),
            ],
        )?;
        if out.success {
            return Ok(true);
        }
        if out.code != Some(1) {
            return Err(out.error("ancestry-query-failed"));
        }
        // Query the live layout, not only the handle's initial shallow bit.
        let shallow = self.checked(
            repo,
            &["rev-parse", "--is-shallow-repository"],
            Policy::Inspect,
        )?;
        if shallow == b"true\n" {
            // rev-list --boundary cannot report shallow roots reliably; traverse
            // reachable commit ids and match the trusted shallow-file boundary.
            use std::io::Read;
            let file = std::fs::File::open(repo.common_dir().join("shallow"))
                .map_err(|_| failure("shallow-boundary-unreadable"))?;
            let mut boundary = Vec::new();
            file.take(LIMIT as u64 + 1)
                .read_to_end(&mut boundary)
                .map_err(|_| failure("shallow-boundary-unreadable"))?;
            if boundary.len() > LIMIT {
                return Err(failure("shallow-boundary-limit"));
            }
            let boundaries: std::collections::BTreeSet<_> = boundary
                .split(|b| *b == b'\n')
                .filter(|l| !l.is_empty())
                .collect();
            if boundaries.is_empty() || boundaries.iter().any(|b| oid(repo, b).is_err()) {
                return Err(failure("shallow-boundary-invalid"));
            }
            let reachable = self.checked(
                repo,
                &["rev-list", descendant.as_str(), "--"],
                Policy::Inspect,
            )?;
            if reachable
                .split(|b| *b == b'\n')
                .any(|id| boundaries.contains(id))
            {
                return Err(failure("shallow-history-incomplete"));
            }
        } else if shallow != b"false\n" {
            return Err(failure("invalid-shallow-protocol"));
        }
        Ok(false)
    }
    pub fn list_worktrees(
        &self,
        repo: &RepoHandle,
        cursor: Option<InspectCursor>,
        max: usize,
    ) -> Result<InspectPage<WorktreeFact>> {
        let bytes = self.checked(
            repo,
            &["worktree", "list", "--porcelain", "-z"],
            Policy::Inspect,
        )?;
        let mut entries = vec![];
        let mut current: Option<WorktreeFact> = None;
        for field in records(&bytes)? {
            if field.is_empty() {
                let item = current
                    .take()
                    .ok_or_else(|| failure("invalid-worktree-protocol"))?;
                if !item.bare && item.head.is_none() {
                    return Err(failure("invalid-worktree-protocol"));
                }
                entries.push(item);
                continue;
            }
            if let Some(path) = field.strip_prefix(b"worktree ") {
                if current.is_some() || path.is_empty() {
                    return Err(failure("invalid-worktree-protocol"));
                }
                current = Some(WorktreeFact {
                    path: path.to_vec(),
                    head: None,
                    branch: None,
                    bare: false,
                    detached: false,
                    locked: None,
                    prunable: None,
                });
                continue;
            }
            let item = current
                .as_mut()
                .ok_or_else(|| failure("invalid-worktree-protocol"))?;
            if let Some(head) = field.strip_prefix(b"HEAD ") {
                item.head = Some(oid(repo, head)?);
            } else if let Some(branch) = field.strip_prefix(b"branch ") {
                item.branch = Some(
                    RefName::parse(
                        std::str::from_utf8(branch)
                            .map_err(|_| failure("invalid-worktree-branch"))?,
                    )
                    .map_err(|_| failure("invalid-worktree-branch"))?,
                );
            } else if field == b"bare" {
                item.bare = true;
            } else if field == b"detached" {
                item.detached = true;
            } else if field == b"locked" {
                item.locked = Some(vec![]);
            } else if let Some(reason) = field.strip_prefix(b"locked ") {
                item.locked = Some(reason.to_vec());
            } else if field == b"prunable" {
                item.prunable = Some(vec![]);
            } else if let Some(reason) = field.strip_prefix(b"prunable ") {
                item.prunable = Some(reason.to_vec());
            } else {
                return Err(failure("invalid-worktree-protocol"));
            }
        }
        if current.is_some() {
            return Err(failure("invalid-worktree-protocol"));
        }
        page(entries, &bytes, cursor, max)
    }
    pub fn compare_content(&self, repo: &RepoHandle, before: &Oid, after: &Oid) -> Result<bool> {
        self.require_commit(repo, before)?;
        self.require_commit(repo, after)?;
        let a = self.checked(
            repo,
            &[
                "rev-parse",
                "--verify",
                &format!("{}^{{tree}}", before.as_str()),
            ],
            Policy::Inspect,
        )?;
        let b = self.checked(
            repo,
            &[
                "rev-parse",
                "--verify",
                &format!("{}^{{tree}}", after.as_str()),
            ],
            Policy::Inspect,
        )?;
        Ok(a == b)
    }
}

impl GitDriver {
    /// Batch headers first: oversized objects are refused before content capture.
    pub fn read_objects(
        &self,
        repo: &RepoHandle,
        ids: &[Oid],
        max_bytes: usize,
    ) -> Result<Vec<ReadObject>> {
        if ids.len() > 4096 || max_bytes == 0 || max_bytes > LIMIT {
            return Err(failure("invalid-object-read-bounds"));
        }
        let mut input = Vec::new();
        for id in ids {
            Oid::parse(id.as_str(), repo.object_format())
                .map_err(|_| failure("object-format-mismatch"))?;
            input.extend_from_slice(id.as_str().as_bytes());
            input.push(0);
        }
        let headers = self.inspect_input(repo, &["cat-file", "--batch-check", "-Z"], &input)?;
        let headers = records(&headers)?;
        if headers.len() != ids.len() {
            return Err(failure("invalid-object-batch"));
        }
        let mut sizes = Vec::new();
        let mut total = 0usize;
        for (header, id) in headers.iter().zip(ids) {
            if header == &format!("{} missing", id.as_str()).as_bytes() {
                if repo.layout().promisor {
                    return Err(failure("promisor-object-unavailable"));
                }
                if repo.layout().alternates {
                    return Err(failure("alternate-object-unavailable"));
                }
                sizes.push(None);
                continue;
            }
            let fields: Vec<_> = header.split(|b| *b == b' ').collect();
            if fields.len() != 3 || fields[0] != id.as_str().as_bytes() {
                return Err(failure("invalid-object-batch"));
            }
            let kind = match fields[1] {
                b"blob" => ObjectType::Blob,
                b"tree" => ObjectType::Tree,
                b"commit" => ObjectType::Commit,
                b"tag" => ObjectType::Tag,
                _ => return Err(failure("invalid-object-type")),
            };
            let size: usize = std::str::from_utf8(fields[2])
                .ok()
                .and_then(|n| n.parse().ok())
                .ok_or_else(|| failure("invalid-object-size"))?;
            total = total
                .checked_add(size)
                .ok_or_else(|| failure("object-read-limit"))?;
            if total > max_bytes {
                return Err(failure("object-read-limit"));
            }
            sizes.push(Some((kind, size)));
        }
        let bytes = self.inspect_input(repo, &["cat-file", "--batch", "-Z"], &input)?;
        let mut rest = bytes.as_slice();
        let mut results = Vec::new();
        for (header, info) in headers.iter().zip(sizes) {
            let end = rest
                .iter()
                .position(|b| *b == 0)
                .ok_or_else(|| failure("invalid-object-batch"))?;
            if &rest[..end] != *header {
                return Err(failure("object-changed-during-read"));
            }
            rest = &rest[end + 1..];
            match info {
                None => results.push(ReadObject::Missing),
                Some((kind, size)) => {
                    if rest.get(size) != Some(&0) {
                        return Err(failure("invalid-object-size"));
                    }
                    let content = rest[..size].to_vec();
                    rest = &rest[size + 1..];
                    results.push(ReadObject::Present {
                        kind,
                        bytes: content,
                    });
                }
            }
        }
        if !rest.is_empty() {
            return Err(failure("invalid-object-batch"));
        }
        Ok(results)
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum PathFingerprint {
    Missing,
    File { sha256: String, mode: u32 },
    Link { target: Vec<u8> },
    Type { mode: u32 },
    Unreadable { size: u64, mtime: String },
}
#[derive(Debug, Serialize)]
pub struct SnapshotEntry {
    pub path: Vec<u8>,
    pub fingerprint: PathFingerprint,
}
#[derive(Debug, Serialize)]
pub struct WritesSnapshot {
    pub head: Option<Oid>,
    pub files: Vec<SnapshotEntry>,
}

impl GitDriver {
    /// Capture dirty paths plus previous snapshot paths to detect a return to
    /// clean. Hashes stream with a total byte budget; FIFOs are never read.
    pub fn snapshot_writes(
        &self,
        repo: &RepoHandle,
        previous_paths: &[Vec<u8>],
        max_bytes: u64,
    ) -> Result<WritesSnapshot> {
        if max_bytes == 0 || previous_paths.iter().map(|p| p.len() + 1).sum::<usize>() > crate::driver::PATH_LIMIT {
            return Err(failure("invalid-snapshot-bounds"));
        }
        let head = match self.resolve_head(repo)? {
            HeadFact::Attached { commit, .. } | HeadFact::Detached { commit } => Some(commit),
            HeadFact::Unborn { .. } => None,
        };
        let mut paths: std::collections::BTreeSet<Vec<u8>> =
            previous_paths.iter().cloned().collect();
        let mut cursor = None;
        loop {
            let page = self.status(repo, Untracked::All, Submodules::Configured, Ignored::Excluded, cursor, 4096)?;
            paths.extend(page.entries.into_iter().map(|e| e.path));
            if paths.iter().map(|p| p.len() + 1).sum::<usize>() > crate::driver::PATH_LIMIT {
                return Err(failure("snapshot-path-limit"));
            }
            if page.complete {
                break;
            }
            cursor = page.next_cursor;
        }
        let root = repo
            .work_tree
            .as_ref()
            .ok_or_else(|| failure("snapshot-requires-worktree"))?;
        let mut remaining = max_bytes;
        let mut files = vec![];
        for path in paths {
            if path.is_empty()
                || path.len() > 4096
                || path.contains(&0)
                || path
                    .split(|b| *b == b'/')
                    .any(|p| p.is_empty() || p == b"." || p == b"..")
            {
                return Err(failure("invalid-literal-path"));
            }
            let fingerprint = fingerprint(root, &path, &mut remaining)?;
            files.push(SnapshotEntry { path, fingerprint });
        }
        let after = match self.resolve_head(repo)? {
            HeadFact::Attached { commit, .. } | HeadFact::Detached { commit } => Some(commit),
            HeadFact::Unborn { .. } => None,
        };
        if head != after {
            return Err(failure("snapshot-head-changed"));
        }
        Ok(WritesSnapshot { head, files })
    }
}

#[cfg(unix)]
#[allow(clippy::unnecessary_cast)] // libc mode/dev/ino widths differ across Unix targets.
pub(crate) fn fingerprint(
    root: &std::path::Path,
    path: &[u8],
    remaining: &mut u64,
) -> Result<PathFingerprint> {
    use std::{
        ffi::CString,
        io::Read,
        os::{
            fd::{AsRawFd, FromRawFd},
            unix::fs::{MetadataExt, OpenOptionsExt},
        },
    };
    let mut dir = std::fs::OpenOptions::new()
        .read(true)
        .custom_flags(libc::O_DIRECTORY | libc::O_NOFOLLOW)
        .open(root)
        .map_err(|_| failure("snapshot-root-unreadable"))?;
    let mut parts = path.split(|b| *b == b'/').peekable();
    while let Some(part) = parts.next() {
        let name = CString::new(part).map_err(|_| failure("invalid-literal-path"))?;
        if parts.peek().is_some() {
            let fd = unsafe {
                libc::openat(
                    dir.as_raw_fd(),
                    name.as_ptr(),
                    libc::O_RDONLY | libc::O_DIRECTORY | libc::O_NOFOLLOW | libc::O_CLOEXEC,
                )
            };
            if fd < 0 {
                if std::io::Error::last_os_error().kind() == std::io::ErrorKind::NotFound {
                    return Ok(PathFingerprint::Missing);
                }
                return Err(failure("snapshot-parent-unreadable"));
            }
            dir = unsafe { std::fs::File::from_raw_fd(fd) };
            continue;
        }
        let mut stat = std::mem::MaybeUninit::<libc::stat>::uninit();
        if unsafe {
            libc::fstatat(
                dir.as_raw_fd(),
                name.as_ptr(),
                stat.as_mut_ptr(),
                libc::AT_SYMLINK_NOFOLLOW,
            )
        } != 0
        {
            if std::io::Error::last_os_error().kind() == std::io::ErrorKind::NotFound {
                return Ok(PathFingerprint::Missing);
            }
            return Err(failure("snapshot-path-unreadable"));
        }
        let stat = unsafe { stat.assume_init() };
        let mode = stat.st_mode as u32;
        if mode & libc::S_IFMT as u32 == libc::S_IFLNK as u32 {
            let mut target = vec![0; 4097];
            let n = unsafe {
                libc::readlinkat(
                    dir.as_raw_fd(),
                    name.as_ptr(),
                    target.as_mut_ptr().cast(),
                    target.len(),
                )
            };
            if n < 0 || n as usize == target.len() {
                return Err(failure("snapshot-link-unreadable"));
            }
            target.truncate(n as usize);
            return Ok(PathFingerprint::Link { target });
        }
        if mode & libc::S_IFMT as u32 != libc::S_IFREG as u32 {
            return Ok(PathFingerprint::Type {
                mode: mode & libc::S_IFMT as u32,
            });
        }
        let unreadable = || PathFingerprint::Unreadable {
            size: stat.st_size.max(0) as u64,
            mtime: stat.st_mtime.to_string(),
        };
        let fd = unsafe {
            libc::openat(
                dir.as_raw_fd(),
                name.as_ptr(),
                libc::O_RDONLY | libc::O_NOFOLLOW | libc::O_NONBLOCK | libc::O_CLOEXEC,
            )
        };
        if fd < 0 {
            return Ok(unreadable());
        }
        let mut file = unsafe { std::fs::File::from_raw_fd(fd) };
        let metadata = file
            .metadata()
            .map_err(|_| failure("snapshot-path-unreadable"))?;
        if !metadata.is_file()
            || metadata.dev() != stat.st_dev as u64
            || metadata.ino() != stat.st_ino as u64
        {
            return Err(failure("snapshot-path-changed"));
        }
        let mut hash = Sha256::new();
        let mut buffer = [0u8; 65536];
        loop {
            let n = match file.read(&mut buffer) {
                Ok(n) => n,
                Err(_) => return Ok(unreadable()),
            };
            if n == 0 {
                break;
            }
            *remaining = remaining
                .checked_sub(n as u64)
                .ok_or_else(|| failure("snapshot-byte-limit"))?;
            hash.update(&buffer[..n]);
        }
        let after = file
            .metadata()
            .map_err(|_| failure("snapshot-path-unreadable"))?;
        if metadata.len() != after.len()
            || metadata.mtime() != after.mtime()
            || metadata.mtime_nsec() != after.mtime_nsec()
            || metadata.ctime() != after.ctime()
            || metadata.ctime_nsec() != after.ctime_nsec()
        {
            return Err(failure("snapshot-path-changed"));
        }
        return Ok(PathFingerprint::File {
            sha256: format!("{:x}", hash.finalize()),
            mode: metadata.mode(),
        });
    }
    Err(failure("invalid-literal-path"))
}
#[cfg(not(unix))]
pub(crate) fn fingerprint(
    _root: &std::path::Path,
    _path: &[u8],
    _remaining: &mut u64,
) -> Result<PathFingerprint> {
    Err(failure("snapshot-platform-unsupported"))
}

impl GitDriver {
    pub fn resolve_commit_ref(&self, repo: &RepoHandle, name: &str) -> Result<Option<Oid>> {
        if name.is_empty() || name.contains('\0') { return Err(failure("invalid-ref-name")); }
        let revision = format!("{name}^{{commit}}");
        self.require_floor()?;
        self.preflight(repo)?;
        let out = self.invoke(Some(repo), repo.trusted_main_root(), &["rev-parse", "-q", "--verify", "--end-of-options", &revision], Policy::Inspect, None, true, 4096, std::time::Duration::from_secs(30))?;
        if out.success {
            Ok(Some(Oid::parse(std::str::from_utf8(&out.stdout).map_err(|_|failure("invalid-oid"))?.trim_end_matches('\n'), repo.object_format()).map_err(|_|failure("invalid-oid"))?))
        } else if out.code == Some(1) { Ok(None) } else { Err(out.error("ref-resolution-failed")) }
    }
}

/// Bounded semantic facts used by checkout lifecycle consumers.
impl GitDriver {
    pub fn compare_commits(
        &self,
        repo: &RepoHandle,
        left: &Oid,
        right: &Oid,
    ) -> Result<serde_json::Value> {
        let base = self.checked(
            repo,
            &["merge-base", left.as_str(), right.as_str()],
            Policy::Inspect,
        )?;
        let counts = self.checked(
            repo,
            &[
                "rev-list",
                "--left-right",
                "--count",
                &format!("{}...{}", left.as_str(), right.as_str()),
            ],
            Policy::Inspect,
        )?;
        let counts = std::str::from_utf8(&counts)
            .map_err(|_| failure("invalid-count"))?
            .split_whitespace()
            .map(str::parse::<u64>)
            .collect::<std::result::Result<Vec<_>, _>>()
            .map_err(|_| failure("invalid-count"))?;
        let commits = self.checked(
            repo,
            &[
                "rev-list",
                &format!("{}..{}", left.as_str(), right.as_str()),
            ],
            Policy::Inspect,
        )?;
        if counts.len() != 2 {
            return Err(failure("invalid-count"));
        }
        let commits = std::str::from_utf8(&commits)
            .map_err(|_| failure("invalid-object-id"))?
            .lines()
            .collect::<Vec<_>>();
        Ok(
            serde_json::json!({"mergeBase":std::str::from_utf8(&base).map_err(|_| failure("invalid-object-id"))?.trim(),"left":counts[0],"right":counts[1],"commits":commits}),
        )
    }
    pub fn list_branches(&self, repo: &RepoHandle, prefix: &str) -> Result<Vec<String>> {
        RefName::parse(prefix.trim_end_matches('/')).map_err(|_| failure("invalid-ref-prefix"))?;
        if !prefix.starts_with("refs/heads/") {
            return Err(failure("invalid-ref-prefix"));
        }
        let out = self.checked(
            repo,
            &["for-each-ref", "--format=%(refname)", prefix],
            Policy::Inspect,
        )?;
        Ok(std::str::from_utf8(&out)
            .map_err(|_| failure("invalid-ref-name"))?
            .lines()
            .map(str::to_owned)
            .collect())
    }
    pub fn checkout_facts(&self, repo: &RepoHandle, revision: &Oid) -> Result<serde_json::Value> {
        let reflog = self.checked(
            repo,
            &["reflog", "show", "HEAD", "-n", "1", "--format=%H"],
            Policy::Inspect,
        )?;
        let delta = self.checked(
            repo,
            &[
                "diff",
                "--name-only",
                "-z",
                "--no-relative",
                "--no-ext-diff",
                "--no-textconv",
                revision.as_str(),
                "--",
                ":!.fgos",
            ],
            Policy::Inspect,
        )?;
        let staged = self.checked(
            repo,
            &[
                "diff",
                "--cached",
                "--binary",
                "--no-ext-diff",
                "--no-textconv",
                revision.as_str(),
                "--",
                ":!.fgos",
            ],
            Policy::Inspect,
        )?;
        let status = self.checked(
            repo,
            &[
                "status",
                "--porcelain=v1",
                "-z",
                "--untracked-files=all",
                "--",
                ":!.fgos",
            ],
            Policy::Inspect,
        )?;
        Ok(
            serde_json::json!({"lastSynced":std::str::from_utf8(&reflog).map_err(|_| failure("invalid-object-id"))?.trim(),"delta":delta,"stagedPatch":staged,"status":status,"orphanedPatches":self.restore_patch_paths(repo)?}),
        )
    }
    pub fn remote_tracking(
        &self,
        repo: &RepoHandle,
        branch: &RefName,
        remote: &str,
    ) -> Result<serde_json::Value> {
        let name = branch
            .as_str()
            .strip_prefix("refs/heads/")
            .ok_or_else(|| failure("invalid-branch"))?;
        let out = self.checked(
            repo,
            &[
                "for-each-ref",
                "--format=%(refname)%00%(upstream)",
                branch.as_str(),
            ],
            Policy::Inspect,
        )?;
        let listing = std::str::from_utf8(&out).map_err(|_| failure("invalid-ref-name"))?;
        let upstream = listing
            .lines()
            .filter_map(|line| line.split_once('\0'))
            .find(|(reference, _)| *reference == branch.as_str())
            .map_or("", |(_, upstream)| upstream);
        let url = if upstream.is_empty() {
            Some(self.remote_url(repo, remote)?)
        } else {
            None
        };
        Ok(serde_json::json!({"branch":name,"upstream":upstream,"url":url}))
    }
}

/// Bounded merge facts for the Land consumer's trusted-side resolutions.
impl GitDriver {
    /// The tree `git merge-tree --write-tree` produces for two commits and the
    /// paths it left conflicted. Exit 1 is the conflicted answer. The command
    /// may add unreferenced objects; it changes no ref, index or checkout.
    pub fn merge_tree(&self, repo: &RepoHandle, target: &Oid, source: &Oid) -> Result<MergeTreeFact> {
        self.require_commit(repo, target)?;
        self.require_commit(repo, source)?;
        let out = self.inspect_command(
            repo,
            &[
                "merge-tree",
                "--write-tree",
                "-z",
                "--name-only",
                "--no-messages",
                target.as_str(),
                source.as_str(),
            ],
        )?;
        let conflicted = match (out.success, out.code) {
            (true, _) => false,
            (false, Some(1)) => true,
            _ => return Err(out.error("merge-tree-failed")),
        };
        let fields = records(&out.stdout)?;
        let (tree, paths) = fields
            .split_first()
            .ok_or_else(|| failure("invalid-merge-tree-protocol"))?;
        let tree = oid(repo, tree)?;
        let mut conflicted_paths: Vec<Vec<u8>> = vec![];
        for path in paths.iter().filter(|p| !p.is_empty()) {
            if !conflicted_paths.iter().any(|p| p == path) {
                conflicted_paths.push(path.to_vec());
            }
        }
        if conflicted != !conflicted_paths.is_empty() {
            return Err(failure("invalid-merge-tree-protocol"));
        }
        Ok(MergeTreeFact { tree, conflicted_paths })
    }
    /// One named attribute of literal paths, from the `.gitattributes` of a
    /// commit or tree, exactly as Git reports it.
    pub fn attributes(
        &self,
        repo: &RepoHandle,
        revision: &Oid,
        attribute: &str,
        paths: &[Vec<u8>],
    ) -> Result<Vec<AttributeFact>> {
        self.require_tree_ish(repo, revision)?;
        if attribute.is_empty()
            || attribute.starts_with('-')
            || !attribute.bytes().all(|b| b.is_ascii_alphanumeric() || b"-_.".contains(&b))
        {
            return Err(failure("invalid-attribute-name"));
        }
        if paths.is_empty()
            || paths.len() > 4096
            || paths.iter().any(|p| p.is_empty() || p.contains(&0))
            || paths.iter().map(|p| p.len() + 1).sum::<usize>() > LIMIT
        {
            return Err(failure("invalid-literal-path"));
        }
        let mut input = Vec::new();
        for path in paths {
            input.extend_from_slice(path);
            input.push(0);
        }
        let source = format!("--source={}", revision.as_str());
        let bytes = self.inspect_input(repo, &["check-attr", "-z", "--stdin", &source, attribute], &input)?;
        let fields = records(&bytes)?;
        if fields.len() != paths.len() * 3 {
            return Err(failure("invalid-check-attr-protocol"));
        }
        fields
            .chunks(3)
            .zip(paths)
            .map(|(record, path)| {
                if record[0] != path.as_slice() || record[1] != attribute.as_bytes() {
                    return Err(failure("invalid-check-attr-protocol"));
                }
                Ok(AttributeFact {
                    path: path.clone(),
                    value: String::from_utf8(record[2].to_vec())
                        .map_err(|_| failure("invalid-check-attr-protocol"))?,
                })
            })
            .collect()
    }
    /// The literal paths the main checkout's ignore rules exclude, whether or
    /// not they exist yet; a tracked path is never ignored.
    pub fn ignored_paths(&self, repo: &RepoHandle, paths: &[Vec<u8>]) -> Result<Vec<Vec<u8>>> {
        // check-ignore reads its input as pathspecs and refuses literal mode,
        // so a leading colon (pathspec magic) is refused here instead.
        if paths.is_empty()
            || paths.len() > 4096
            || paths.iter().any(|p| p.is_empty() || p.contains(&0) || p.starts_with(b":"))
            || paths.iter().map(|p| p.len() + 1).sum::<usize>() > LIMIT
        {
            return Err(failure("invalid-literal-path"));
        }
        let mut input = Vec::new();
        for path in paths {
            input.extend_from_slice(path);
            input.push(0);
        }
        self.require_floor()?;
        self.preflight(repo)?;
        let out = self.invoke_input(
            Some(repo),
            repo.trusted_main_root(),
            &["check-ignore", "-z", "--stdin"],
            Policy::Inspect,
            None,
            true,
            LIMIT,
            Duration::from_secs(30),
            &input,
        )?;
        // Exit 1 means no path is ignored; anything else but 0 is a failure.
        if !out.success && out.code != Some(1) {
            return Err(out.error("git-command-failed"));
        }
        let ignored = records(&out.stdout)?;
        if ignored.iter().any(|p| !paths.iter().any(|q| q.as_slice() == *p)) {
            return Err(failure("invalid-check-ignore-protocol"));
        }
        Ok(ignored.into_iter().map(<[u8]>::to_vec).collect())
    }
    /// The earliest merge commit on the ancestry path from `ancestor` to
    /// `descendant` (both commits), or none.
    pub fn first_ancestry_merge(&self, repo: &RepoHandle, ancestor: &Oid, descendant: &Oid) -> Result<Option<Oid>> {
        self.require_commit(repo, ancestor)?;
        self.require_commit(repo, descendant)?;
        let range = format!("{}..{}", ancestor.as_str(), descendant.as_str());
        let bytes = self.checked(
            repo,
            &["rev-list", "--merges", "--ancestry-path", "--reverse", &range, "--"],
            Policy::Inspect,
        )?;
        bytes
            .split(|b| *b == b'\n')
            .find(|line| !line.is_empty())
            .map(|line| oid(repo, line))
            .transpose()
    }
}

/// Commit counts, times and the index listing for reporting consumers.
impl GitDriver {
    /// A commit's committer time, in seconds since the epoch.
    pub fn commit_time(&self, repo: &RepoHandle, commit: &Oid) -> Result<i64> {
        self.require_commit(repo, commit)?;
        let raw = self.checked(repo, &["log", "-1", "--format=%ct", commit.as_str(), "--"], Policy::Inspect)?;
        std::str::from_utf8(&raw)
            .ok()
            .and_then(|text| text.trim_end_matches('\n').parse().ok())
            .ok_or_else(|| failure("invalid-commit-time"))
    }
    /// How many commits `include` reaches that `exclude`, when given, does not.
    pub fn count_commits(&self, repo: &RepoHandle, include: &Oid, exclude: Option<&Oid>) -> Result<u64> {
        self.require_commit(repo, include)?;
        let range = match exclude {
            Some(exclude) => {
                self.require_commit(repo, exclude)?;
                format!("{}..{}", exclude.as_str(), include.as_str())
            }
            None => include.as_str().to_owned(),
        };
        count(&self.checked(repo, &["rev-list", "--count", &range, "--"], Policy::Inspect)?)
    }
    /// How many non-merge commits of `head` have no patch-equivalent commit
    /// on `upstream` (`rev-list --cherry-pick --right-only --no-merges`).
    pub fn unmatched_commit_count(&self, repo: &RepoHandle, upstream: &Oid, head: &Oid) -> Result<u64> {
        self.require_commit(repo, upstream)?;
        self.require_commit(repo, head)?;
        let range = format!("{}...{}", upstream.as_str(), head.as_str());
        count(&self.checked(
            repo,
            &["rev-list", "--count", "--cherry-pick", "--right-only", "--no-merges", &range, "--"],
            Policy::Inspect,
        )?)
    }
    /// The paths the index tracks, repository-relative bytes in index order.
    pub fn tracked_paths(
        &self,
        repo: &RepoHandle,
        cursor: Option<InspectCursor>,
        max: usize,
    ) -> Result<InspectPage<Vec<u8>>> {
        let bytes = self.checked(repo, &["ls-files", "-z", "--cached", "--full-name"], Policy::Inspect)?;
        let entries = records(&bytes)?
            .into_iter()
            .map(|path| if path.is_empty() { Err(failure("invalid-ls-files-protocol")) } else { Ok(path.to_vec()) })
            .collect::<Result<Vec<_>>>()?;
        page(entries, &bytes, cursor, max)
    }
}
