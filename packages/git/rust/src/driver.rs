//! The sole Git spawn door. Raw argv and borrowed spawn are crate-private.
use crate::*;
use fgos_process::containment::{self, ContainmentDriver, SpawnSpec, StartMode};
use fgos_process::{DomainState, KillOutcome};
use std::collections::{BTreeMap, BTreeSet, VecDeque};
use std::fs::{self, File};
use std::io::Read;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{mpsc, Arc, Mutex, OnceLock};
use std::time::{Duration, Instant};

pub(crate) const PATH_LIMIT: usize = 64 * 1024 * 1024;
const DIFF_LIMIT: usize = 50 * 1024 * 1024;
/// How often a contained call rechecks its output limit while it waits.
const OVERFLOW_CHECK: Duration = Duration::from_millis(10);
const STDERR_LIMIT: usize = 64 * 1024;
/// A borrowed run is where commit hooks run, and Git sends their output to stderr: commit children
/// get the holder-lock ceiling for them (holder-lock spec, run_borrowed: 64 MiB), never a cut.
const BORROWED_STDERR_LIMIT: usize = 64 * 1024 * 1024;
static SERIAL: AtomicU64 = AtomicU64::new(0);
static GIT: OnceLock<Option<PathBuf>> = OnceLock::new();
// One selected executable and one floor result, including failures, per process.
static FLOOR: OnceLock<Result<GitFloorVerdict>> = OnceLock::new();
/// The recorded floor verdict, in the driver's trusted state root.
const FLOOR_RECORD: &str = "git-floor-verdict.json";

fn floor_record(key: &serde_json::Value, v: &GitFloorVerdict) -> serde_json::Value {
    serde_json::json!({
        "key": key,
        "version": v.version,
        "minimum": v.minimum,
        "supported": v.supported,
        "probes": v.probes.iter().map(|p| serde_json::json!({"name": p.name, "passed": p.passed, "evidence": p.evidence})).collect::<Vec<_>>(),
    })
}

/// The recorded verdict when its key equals `key` exactly; anything
/// unreadable, foreign or different is no record.
fn read_floor_record(path: &Path, key: &serde_json::Value) -> Option<GitFloorVerdict> {
    #[cfg(unix)]
    let file = {
        use std::os::unix::fs::OpenOptionsExt;
        fs::OpenOptions::new().read(true).custom_flags(libc::O_NOFOLLOW).open(path).ok()?
    };
    #[cfg(not(unix))]
    let file = fs::File::open(path).ok()?;
    let mut bytes = Vec::new();
    file.take(64 * 1024).read_to_end(&mut bytes).ok()?;
    let record: serde_json::Value = serde_json::from_slice(&bytes).ok()?;
    if record.get("key")? != key {
        return None;
    }
    let text = |v: &serde_json::Value| v.as_str().map(str::to_owned);
    let probes = record
        .get("probes")?
        .as_array()?
        .iter()
        .map(|p| {
            Some(FloorProbe {
                name: text(p.get("name")?)?,
                passed: p.get("passed")?.as_bool()?,
                evidence: text(p.get("evidence")?)?,
            })
        })
        .collect::<Option<Vec<_>>>()?;
    let supported = record.get("supported")?.as_bool()?;
    let contract: serde_json::Value = serde_json::from_str(include_str!("../../contracts/git-floor.v1.json")).ok()?;
    let required: BTreeSet<_> = contract["requiredProbes"].as_array()?.iter().map(|v| v.as_str()).collect();
    let actual: BTreeSet<_> = probes.iter().map(|p| Some(p.name.as_str())).collect();
    if actual != required || probes.len() != required.len() { return None; }
    // A record never claims more than its own probes show.
    if supported != (!probes.is_empty() && probes.iter().all(|p| p.passed)) {
        return None;
    }
    Some(GitFloorVerdict {
        version: text(record.get("version")?)?,
        minimum: text(record.get("minimum")?)?,
        supported,
        probes,
    })
}

/// Effective config record: origin, normalized key, byte-preserving value.
pub(crate) type ConfigRecord = (Vec<u8>, String, Vec<u8>);
type ConfigEnvironment = (Option<std::ffi::OsString>, Option<std::ffi::OsString>);
#[derive(Clone, PartialEq, Eq)]
struct ConfigStamp {
    paths: Vec<PathBuf>,
    // Identity includes inode, length, mtime and ctime; missing inputs are
    // tracked too, without reading whole config files on the hot path.
    files: Vec<Option<String>>,
}
impl ConfigStamp {
    fn read(paths: Vec<PathBuf>) -> Result<Self> {
        let files = paths
            .iter()
            .map(|p| match fs::metadata(p) {
                Ok(m) => {
                    #[cfg(unix)]
                    let identity = {
                        use std::os::unix::fs::MetadataExt;
                        format!(
                            "{}:{}:{}:{}:{}:{}:{}",
                            m.dev(),
                            m.ino(),
                            m.len(),
                            m.mtime(),
                            m.mtime_nsec(),
                            m.ctime(),
                            m.ctime_nsec()
                        )
                    };
                    #[cfg(not(unix))]
                    let identity = format!("{}:{:?}:{:?}", m.len(), m.modified(), m.created());
                    Ok(Some(identity))
                }
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
                Err(e) => Err(io(e)),
            })
            .collect::<Result<Vec<_>>>()?;
        Ok(Self { paths, files })
    }
}

#[derive(Clone)]
pub(crate) struct ConfigCache {
    stamp: ConfigStamp,
    records: Vec<ConfigRecord>,
    // Object format and ref storage are config facts (`extensions.*`), so
    // they stay valid exactly as long as the stamp above does.
    formats: Option<(ObjectFormat, RefStorage)>,
}

// Both caches are per process, not per driver: each Node port opens its own
// driver, and a verb opens many. Every use still rechecks the source stamps;
// the source list is keyed by the selected Git and the variables its answer
// depends on.
static CONFIG_SOURCES: Mutex<BTreeMap<(PathBuf, ConfigEnvironment), Vec<PathBuf>>> = Mutex::new(BTreeMap::new());
static REPOSITORY_CONFIG: Mutex<BTreeMap<PathBuf, ConfigCache>> = Mutex::new(BTreeMap::new());

fn io(error: std::io::Error) -> OperationError {
    failure(format!("git-driver-io: {error}"))
}
/// A child stopped by its limits is one failure whichever door ran it; `detail.path` says which.
fn child_failure(cause: &'static str, path: &'static str) -> OperationError {
    OperationError {
        detail: Some(Box::new(serde_json::json!({ "path": path }))),
        ..failure(cause)
    }
}
fn borrow_failure(e: fgos_holder_lock::BorrowError) -> OperationError {
    use fgos_holder_lock::BorrowError::{Deadline, OutputLimit};
    match e {
        Deadline { .. } => child_failure("git-timeout", "borrowed").with_diagnostic(e),
        OutputLimit(_) => child_failure("git-output-limit", "borrowed").with_diagnostic(e),
        e => failure(e.to_string()),
    }
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub(crate) enum Policy {
    Inspect,
    Publication,
    LocalMutation,
    Remote,
    HookContext,
}

/// Same-process opaque holder authority; operation layers validate the seal
/// binding before supplying it. Captured bytes return only after borrow cleanup.
pub(crate) trait BorrowedSpawn {
    fn run_borrowed(
        &self,
        spec: &fgos_holder_lock::BorrowSpec,
        io: &fgos_holder_lock::BorrowIo,
        watch: bool,
    ) -> Result<fgos_holder_lock::BorrowIoOutcome>;
}
impl BorrowedSpawn for fgos_holder_lock::Handle {
    fn run_borrowed(
        &self,
        spec: &fgos_holder_lock::BorrowSpec,
        io: &fgos_holder_lock::BorrowIo,
        watch: bool,
    ) -> Result<fgos_holder_lock::BorrowIoOutcome> {
        let run = if watch { fgos_holder_lock::run_borrowed_io_watched } else { fgos_holder_lock::run_borrowed_io };
        run(self, spec, io).map_err(borrow_failure)
    }
}

struct Scrubbed(BTreeMap<String, String>);
impl Scrubbed {
    fn new() -> Self {
        Self(
            std::env::vars_os()
                .filter_map(|(k, v)| {
                    let (k, v) = (k.into_string().ok()?, v.into_string().ok()?);
                    (!k.to_ascii_uppercase().starts_with("GIT_")).then_some((k, v))
                })
                .collect(),
        )
    }
}
pub struct GitDriver {
    state_root: PathBuf,
    hooks: PathBuf,
    git: PathBuf,
    containment: Box<dyn ContainmentDriver>,
}
impl GitDriver {
    pub(crate) fn state_root(&self) -> &Path { &self.state_root }
    /// Setup-only repair. Canonicalizes the root; hooks use a no-follow descriptor.
    /// Existing unrelated roots and foreign owners are never chmodded.
    pub fn prepare_directories(state_root: &Path) -> Result<bool> {
        let existed = state_root.exists();
        let root = if existed {
            fs::canonicalize(state_root).map_err(io)?
        } else {
            state_root.to_path_buf()
        };
        if existed && root.file_name().is_none_or(|n| n != "fgos") {
            // The driver's own floor record is an existing ownership marker.
            let marker = root.join(FLOOR_RECORD);
            let owned_marker = fs::symlink_metadata(&marker)
                .is_ok_and(|m| m.is_file() && !m.file_type().is_symlink())
                && fs::read(&marker)
                    .ok()
                    .and_then(|bytes| serde_json::from_slice::<serde_json::Value>(&bytes).ok())
                    .is_some_and(|v| {
                        v.get("key").is_some_and(|k| k.get("binary").is_some())
                            && v.get("probes").is_some_and(|p| p.is_array())
                    });
            if !owned_marker {
                // Safe roots need no permission change, but must still be checked.
                trusted_directory(&root).map_err(|_| failure(format!("untrusted-driver-directory: {}; refusing to chmod an unrelated root; point FGOS_STATE_ROOT/FGOS_STATE_HOME at an fgOS directory named fgos or repair its permissions manually", root.display())))?;
            }
        }
        let mut changed = secure_driver_directory(&root, 0o700, true)?;
        changed |= secure_driver_directory(&root.join("git-empty-hooks"), 0o500, false)?;
        Ok(changed)
    }
    /// state_root is a caller-owned trusted directory, not a repository path.
    pub fn new(state_root: &Path) -> Result<Self> {
        // An absent root is created as setup would create it; an existing one
        // is only checked, never repaired here.
        if fs::symlink_metadata(state_root).is_err() {
            Self::prepare_directories(state_root)?;
        }
        let state_root = fs::canonicalize(state_root).map_err(io)?;
        trusted_directory(&state_root)?;
        let hooks = state_root.join("git-empty-hooks");
        if fs::symlink_metadata(&hooks).is_err() {
            secure_driver_directory(&hooks, 0o500, false)?;
        }
        check_hooks(&hooks)?;
        let git = GIT
            .get_or_init(|| {
                std::env::split_paths(&std::env::var_os("PATH").unwrap_or_default())
                    .filter(|p| p.is_absolute())
                    .map(|p| p.join(if cfg!(windows) { "git.exe" } else { "git" }))
                    .find_map(|p| {
                        if p.is_file() {
                            fs::canonicalize(p).ok()
                        } else {
                            None
                        }
                    })
            })
            .clone()
            .ok_or_else(|| failure("git-unavailable"))?;
        Ok(Self {
            state_root,
            hooks,
            git,
            containment: containment::select(&Default::default())
                .map_err(|e| failure("git-containment-unavailable").with_diagnostic(e))?,
        })
    }

    pub fn git_floor_verdict(&self) -> Result<&GitFloorVerdict> {
        match FLOOR.get_or_init(|| self.recorded_floor()) {
            Ok(verdict) => Ok(verdict),
            Err(error) => {
                // Floor probes cannot publish or carry an operation receipt.
                let mut cached = failure(format!("git-floor-probe-failed: {}", error.cause));
                cached.exit_code = error.exit_code;
                cached.signal = error.signal;
                cached.stderr = error.stderr.clone();
                Err(cached)
            }
        }
    }

    /// Only the grant-check host calls this after proving its inherited borrower.
    pub(crate) fn hook_deletions(&self, repo: &RepoHandle, index: &Path) -> Result<Vec<String>> {
        let out = self.invoke_context(
            Some(repo),
            repo.work_tree
                .as_deref()
                .ok_or_else(|| failure("checkout-required"))?,
            &[
                "diff",
                "--cached",
                "--name-only",
                "--no-renames",
                "--diff-filter=D",
                "-z",
            ],
            Policy::Inspect,
            None,
            true,
            PATH_LIMIT,
            Duration::from_secs(30),
            &[],
            Some(index),
        )?;
        if !out.success {
            return Err(out.error("hook-index-unreadable"));
        }
        Ok(crate::scoped_commit::paths(&out.stdout)?
            .into_iter()
            .filter(|p| p == ".fgos" || p.starts_with(".fgos/"))
            .collect())
    }
    pub(crate) fn require_floor(&self) -> Result<()> {
        if self.git_floor_verdict()?.supported {
            Ok(())
        } else {
            Err(failure("git-floor-unsupported"))
        }
    }

    /// Resolve only from an explicit trusted main checkout (or bare repository).
    /// Linked gitdir authority is read from the main registration, never .git.
    /// The repository holding `path`, through a driver on this process's
    /// fgOS state root; `None` outside a repository. Trust is discovered on
    /// disk from `path` itself, as for a cwd.
    pub fn open_at(path: &Path) -> Result<Option<(Self, RepoHandle)>> {
        let driver = Self::new(&fgos_holder_lock::state_root::state_root().0)?;
        Ok(match driver.resolve_repo(path, path)? {
            ResolveRepo::Repository(repo) => Some((driver, repo)),
            ResolveRepo::NotARepository => None,
        })
    }
    pub fn resolve_repo(&self, path: &Path, trusted_main: &Path) -> Result<ResolveRepo> {
        self.require_floor()?;
        let mut repo = match self.resolve_topology(path, trusted_main)? {
            ResolveRepo::Repository(repo) => repo,
            other => return Ok(other),
        };
        self.read_repository_facts(&mut repo)?;
        Ok(ResolveRepo::Repository(repo))
    }

    fn read_repository_facts(&self, repo: &mut RepoHandle) -> Result<Vec<ConfigRecord>> {
        let config = self.config(repo)?;
        self.check_config(repo, &config)?;
        // Formats are config facts: reused exactly while the stamp that proved
        // them still matches, read afresh when the stamp moved.
        let formats = match self.cached_formats(repo)? {
            Some(formats) => formats,
            None => {
                let formats = self.repository_formats(repo)?;
                self.keep_formats(repo, formats)?;
                formats
            }
        };
        (repo.object_format, repo.layout.refs) = formats;
        repo.layout.promisor = config.iter().any(|(_, k, v)| {
            (k.ends_with(".promisor") && v != b"false") || k == "extensions.partialclone"
        });
        Ok(config)
    }

    // A checkout handle answers from its own operation-local cache, any other
    // handle from the process-wide one; both only ever hold a validated stamp.
    fn cached_formats(&self, repo: &RepoHandle) -> Result<Option<(ObjectFormat, RefStorage)>> {
        if let Some(local) = &repo.checkout_config {
            let local = local.lock().map_err(|_| failure("config-cache-poisoned"))?;
            return Ok(local.as_ref().and_then(|entry| entry.formats));
        }
        Ok(REPOSITORY_CONFIG.lock().map_err(|_| failure("config-cache-poisoned"))?
            .get(&repo.git_dir).and_then(|entry| entry.formats))
    }

    fn keep_formats(&self, repo: &RepoHandle, formats: (ObjectFormat, RefStorage)) -> Result<()> {
        if let Some(local) = &repo.checkout_config {
            if let Some(entry) = local.lock().map_err(|_| failure("config-cache-poisoned"))?.as_mut() {
                entry.formats = Some(formats);
            }
        } else if let Some(entry) = REPOSITORY_CONFIG.lock()
            .map_err(|_| failure("config-cache-poisoned"))?.get_mut(&repo.git_dir)
        {
            entry.formats = Some(formats);
        }
        Ok(())
    }

    fn repository_formats(&self, repo: &RepoHandle) -> Result<(ObjectFormat, RefStorage)> {
        let out = self.invoke(Some(repo), &repo.trusted_main_root,
            &["rev-parse", "--show-object-format", "--show-ref-format"], Policy::Inspect, None, true,
            PATH_LIMIT, Duration::from_secs(30))?;
        if !out.success { return Err(out.error("git-command-failed")); }
        let mut facts = std::str::from_utf8(&out.stdout).map_err(|_| failure("repository-facts-invalid"))?.lines();
        let object_format = match facts.next().ok_or_else(|| failure("unsupported-object-format"))? {
            "sha1" => ObjectFormat::Sha1,
            "sha256" => ObjectFormat::Sha256,
            _ => return Err(failure("unsupported-object-format")),
        };
        let refs = match facts.next().ok_or_else(|| failure("unsupported-ref-storage"))? {
            "files" => RefStorage::Files,
            "reftable" => RefStorage::Reftable,
            _ => return Err(failure("unsupported-ref-storage")),
        };
        if facts.next().is_some() { return Err(failure("unsupported-ref-storage")); }
        Ok((object_format, refs))
    }

    /// Disk-only authority check, kept before every checkout child. Git config
    /// and storage probes belong to the operation, not topology discovery.
    pub(crate) fn resolve_topology(&self, path: &Path, trusted_main: &Path) -> Result<ResolveRepo> {
        let mut main = fs::canonicalize(trusted_main).map_err(io)?;
        let path = fs::canonicalize(path).map_err(io)?;
        // Callers may supply a cwd beneath a checkout. Locate only on disk;
        // never let Git or GIT_* environment select topology authority.
        while !main.join(".git").exists()
            && !(main.join("HEAD").is_file() && main.join("objects").is_dir())
        {
            if !main.pop() {
                return Ok(ResolveRepo::NotARepository);
            }
        }
        // A linked cwd supplies only a discovery hint. Trust comes from the
        // main .git directory and reciprocal registered gitdir/backlink.
        let main = if main.join(".git").is_file() {
            let hint = fs::read(main.join(".git")).map_err(io)?;
            let hint = line(&hint)?
                .strip_prefix("gitdir: ")
                .ok_or_else(|| failure("untrusted-worktree"))?;
            let admin = fs::canonicalize(main.join(hint)).map_err(io)?;
            let common_hint = fs::read(admin.join("commondir"))
                .map_err(|_| failure("trusted-main-gitfile-unsupported"))?;
            let common = fs::canonicalize(admin.join(line(&common_hint)?)).map_err(io)?;
            let backlink = fs::read(admin.join("gitdir")).map_err(io)?;
            if common.file_name() != Some(std::ffi::OsStr::new(".git"))
                || admin.parent() != Some(common.join("worktrees").as_path())
                || Path::new(line(&backlink)?) != main.join(".git")
            {
                return Err(failure("untrusted-worktree"));
            }
            common
                .parent()
                .ok_or_else(|| failure("untrusted-worktree"))?
                .to_owned()
        } else {
            main
        };
        let common = if main.join(".git").is_dir() {
            let dir = main.join(".git");
            if fs::symlink_metadata(&dir)
                .map_err(io)?
                .file_type()
                .is_symlink()
            {
                return Err(failure("untrusted-worktree"));
            }
            fs::canonicalize(dir).map_err(io)?
        } else if main.join("HEAD").is_file() && main.join("objects").is_dir() {
            main.clone()
        } else {
            if main.join(".git").is_file() {
                // A worker-controlled gitfile is never topology authority. The
                // caller must supply the trusted main checkout; separate-git-dir
                // needs an explicit trusted common-dir contract before support.
                return Err(failure("trusted-main-gitfile-unsupported"));
            }
            return Ok(ResolveRepo::NotARepository);
        };
        let mut git_dir = common.clone();
        let bare = common == main;
        let mut work_tree = if bare { None } else { Some(main.clone()) };
        if path != main {
            let mut found = None;
            if let Ok(entries) = fs::read_dir(common.join("worktrees")) {
                for entry in entries {
                    let admin = entry.map_err(io)?.path();
                    let backlink = fs::read(admin.join("gitdir")).map_err(io)?;
                    let backlink = line(&backlink)?;
                    let checkout = Path::new(backlink)
                        .parent()
                        .ok_or_else(|| failure("untrusted-worktree"))?;
                    if path.starts_with(checkout)
                        && (found.is_none()
                            || work_tree.as_ref().is_none_or(|prior| {
                                checkout.components().count() > prior.components().count()
                            }))
                    {
                        let registered_common = fs::read(admin.join("commondir")).map_err(io)?;
                        if fs::canonicalize(admin.join(line(&registered_common)?)).map_err(io)?
                            != common
                        {
                            return Err(failure("untrusted-worktree"));
                        }
                        work_tree = Some(fs::canonicalize(checkout).map_err(io)?);
                        found = Some(fs::canonicalize(admin).map_err(io)?);
                    }
                }
            }
            if let Some(found) = found {
                git_dir = found;
            } else if !path.starts_with(&main)
                || path
                    .ancestors()
                    .take_while(|p| *p != main)
                    .any(|p| p.join(".git").exists())
            {
                return Err(failure("untrusted-worktree"));
            }
        }
        let repo = RepoHandle {
            checkout_config: None,
            common_dir: common.clone(),
            trusted_main_root: main,
            object_format: ObjectFormat::Sha1,
            git_dir,
            work_tree,
            layout: RepoLayout {
                refs: RefStorage::Files,
                shallow: common.join("shallow").exists(),
                alternates: common.join("objects/info/alternates").exists(),
                promisor: false,
            },
        };
        Ok(ResolveRepo::Repository(repo))
    }

    /// Shared operation-local checkout door. Resource authority is selected by
    /// the operation; topology/config and post-hook fencing belong here.
    pub(crate) fn checkout_call_borrowed(
        &self,
        repo: &RepoHandle,
        h: &fgos_holder_lock::Handle,
        args: &[&str],
        input: &[u8],
        hooks: bool,
    ) -> Result<Output> {
        self.require_floor()?;
        self.preflight(repo)?;
        let root = repo
            .work_tree
            .as_deref()
            .ok_or_else(|| failure("checkout-required"))?;
        let current = match self.resolve_topology(root, repo.trusted_main_root())? {
            ResolveRepo::Repository(r) => r,
            _ => return Err(failure("untrusted-worktree")),
        };
        if current.git_dir != repo.git_dir
            || current.common_dir != repo.common_dir
            || current.work_tree != repo.work_tree
        {
            return Err(failure("untrusted-worktree"));
        }
        fgos_holder_lock::validate(h).map_err(borrow_failure)?;
        let out = self.invoke_input(
            Some(repo),
            root,
            args,
            if hooks {
                Policy::HookContext
            } else {
                Policy::Publication
            },
            Some(h),
            true,
            PATH_LIMIT,
            Duration::from_secs(120),
            input,
        );
        if hooks {
            if let Err(mut error) = self.refresh_checkout_facts(repo) {
                if let Ok(original) = &out { error.stderr = original.stderr.clone(); }
                return Err(error);
            }
        }
        out
    }

    /// Operation-layer door: even config reads borrow the caller's seal.
    pub(crate) fn publication_call(
        &self,
        repo: &RepoHandle,
        handle: &fgos_holder_lock::Handle,
        args: &[&str],
        input: &[u8],
        remote: bool,
        transport_timeout: Duration,
    ) -> Result<Output> {
        self.require_floor()?;
        fgos_holder_lock::validate(handle)
            .map_err(|e| failure(format!("publication-borrow-unavailable: {e}")))?;
        self.publication_preflight(repo, handle)?;
        self.invoke_input(
            Some(repo),
            &repo.trusted_main_root,
            args,
            if remote {
                Policy::Remote
            } else {
                Policy::Publication
            },
            Some(handle),
            true,
            PATH_LIMIT,
            if remote {
                transport_timeout
            } else {
                Duration::from_secs(30)
            },
            input,
        )
    }

    fn config_paths(
        &self,
        repo: Option<&RepoHandle>,
        cwd: &Path,
        policy: Policy,
        loan: Option<&dyn BorrowedSpawn>,
    ) -> Result<Vec<PathBuf>> {
        let environment = (
            self.git.clone(),
            (std::env::var_os("HOME"), std::env::var_os("XDG_CONFIG_HOME")),
        );
        let mut sources = CONFIG_SOURCES
            .lock()
            .map_err(|_| failure("config-cache-poisoned"))?;
        let globals = if let Some(paths) = sources.get(&environment) {
            paths.clone()
        } else {
            let mut paths = Vec::new();
            // Ask the selected Git, including absent config inputs. Origin
            // records alone cannot reveal a missing system/global file that
            // appears later, and a custom Git prefix must never be guessed.
            for variable in ["GIT_CONFIG_SYSTEM", "GIT_CONFIG_GLOBAL"] {
                let out = self.invoke_input(
                    repo,
                    cwd,
                    &["var", variable],
                    policy,
                    loan,
                    true,
                    PATH_LIMIT,
                    Duration::from_secs(30),
                    &[],
                )?;
                if !out.success {
                    return Err(out.error("git-config-paths-unavailable"));
                }
                for path in std::str::from_utf8(&out.stdout)
                    .map_err(|_| failure("non-utf8-config-path"))?
                    .lines()
                {
                    let path = PathBuf::from(path);
                    if !path.is_absolute() {
                        return Err(failure("relative-config-path"));
                    }
                    paths.push(path);
                }
            }
            sources.insert(environment, paths.clone());
            paths
        };
        drop(sources);
        Ok(globals)
    }

    fn publication_preflight(
        &self,
        repo: &RepoHandle,
        handle: &fgos_holder_lock::Handle,
    ) -> Result<()> {
        let mut cache = REPOSITORY_CONFIG.lock()
            .map_err(|_| failure("config-cache-poisoned"))?;
        let fresh = self.validated_config(repo, cache.get(&repo.git_dir), Policy::Publication, Some(handle))?;
        cache.insert(repo.git_dir.clone(), fresh);
        Ok(())
    }

    // One cache door and staleness rule for publication and checkout operations.
    fn validated_config(
        &self,
        repo: &RepoHandle,
        cached: Option<&ConfigCache>,
        policy: Policy,
        loan: Option<&dyn BorrowedSpawn>,
    ) -> Result<ConfigCache> {
        let mut paths = self.config_paths(Some(repo), &repo.trusted_main_root, policy, loan)?;
        paths.extend([repo.common_dir.join("config"), repo.git_dir.join("config.worktree")]);
        if let Some(cached) = cached {
            paths.extend(cached.stamp.paths.iter().filter(|p| !paths.contains(p)).cloned().collect::<Vec<_>>());
            if ConfigStamp::read(paths.clone())? == cached.stamp {
                return Ok(cached.clone());
            }
        }
        loop {
            let before = ConfigStamp::read(paths.clone())?;
            let out = self.invoke_input(
                Some(repo), &repo.trusted_main_root,
                &["config", "--null", "--show-origin", "--list"], policy, loan,
                true, PATH_LIMIT, Duration::from_secs(30), &[],
            )?;
            if !out.success { return Err(out.error("git-config-failed")); }
            let records = parse_config(&out.stdout)?;
            self.check_config(repo, &records)?;
            for (origin, _, _) in &records {
                if let Some(path) = origin.strip_prefix(b"file:") {
                    let path = PathBuf::from(std::str::from_utf8(path)
                        .map_err(|_| failure("non-utf8-config-origin"))?);
                    let path = if path.is_absolute() { path } else { repo.trusted_main_root.join(path) };
                    if !paths.contains(&path) { paths.push(path); }
                }
            }
            // Newly discovered origins need a fresh read with their before-stamp.
            // Standard origins are already covered; includes are refused above.
            if paths != before.paths {
                continue;
            }
            if before != ConfigStamp::read(paths)? {
                return Err(failure("repository-config-changed-during-read"));
            }
            return Ok(ConfigCache { stamp: before, records, formats: None });
        }
    }

    fn config(&self, repo: &RepoHandle) -> Result<Vec<ConfigRecord>> {
        if let Some(config) = &repo.checkout_config {
            let mut cache = config.lock().map_err(|_| failure("config-cache-poisoned"))?;
            let previous = cache.take().ok_or_else(|| failure("checkout-facts-invalidated"))?;
            let fresh = self.validated_config(repo, Some(&previous), Policy::Inspect, None)?;
            let records = fresh.records.clone();
            *cache = Some(fresh);
            return Ok(records);
        }
        // The same config door serves Inspect and Publication. Every use
        // rechecks source stamps, including missing files; no HEAD/ref fact
        // is retained between commands. A refusal keeps the last good stamp
        // so a long-lived read handle can recover after a config repair.
        let mut cache = REPOSITORY_CONFIG.lock()
            .map_err(|_| failure("config-cache-poisoned"))?;
        let fresh = self.validated_config(repo, cache.get(&repo.git_dir), Policy::Inspect, None)?;
        let records = fresh.records.clone();
        cache.insert(repo.git_dir.clone(), fresh);
        Ok(records)
    }
    /// One unadmitted `git config --list`, for the questions that must see everything the
    /// configuration says, included files and global scope too. `annotate` is `--show-origin`,
    /// `--show-scope` or both; `parse_config` reads the answer.
    pub(crate) fn config_listing(
        &self,
        context: Option<&RepoHandle>,
        root: &Path,
        annotate: &[&str],
        timeout: Duration,
    ) -> Result<Output> {
        let mut args = vec!["config", "--null"];
        args.extend_from_slice(annotate);
        args.push("--list");
        self.invoke(context, root, &args, Policy::Inspect, None, false, PATH_LIMIT, timeout)
    }
    /// Read-only diagnostic shared with Remote admission. Scope, rather than
    /// origin spelling, determines trust even for linked worktrees and symlinks.
    pub fn untrusted_transport_config(&self, repo: &RepoHandle) -> Result<Vec<String>> {
        let mut keys = Vec::new();
        // Transfers are rooted in the trusted main checkout; a linked handle
        // also contributes its worktree-scoped policy. Refuse either source.
        for context in [None, Some(repo)] {
            if context.is_some() && repo.git_dir == repo.common_dir {
                continue;
            }
            let out = self.config_listing(context, &repo.trusted_main_root, &["--show-scope"], Duration::from_secs(30))?;
            if !out.success {
                return Err(out.error("git-config-failed"));
            }
            for (scope, key, _) in parse_config(&out.stdout)? {
                if ![b"global".as_slice(), b"system", b"command"].contains(&scope.as_slice())
                    && repository_transport_config(&key)
                {
                    keys.push(key);
                }
            }
        }
        keys.sort();
        keys.dedup();
        Ok(keys)
    }

    pub(crate) fn preflight(&self, repo: &RepoHandle) -> Result<()> {
        self.config(repo).map(|_| ())
    }
    fn check_config(&self, repo: &RepoHandle, config: &[ConfigRecord]) -> Result<()> {
        for (_, key, _) in config {
            if command_config(key)
                && (key != "credential.helper"
                    || self.untrusted_transport_config(repo)?.iter().any(|k| k == "credential.helper"))
            {
                return Err(failure(format!("repository-config-untrusted: {key}")));
            }
        }
        Ok(())
    }
    /// An owned handle local to one port call. It never escapes into the
    /// long-lived port handle; every call re-proves its facts against the
    /// config stamp and reads afresh only what the stamp no longer covers.
    pub(crate) fn checkout_repository(&self, repo: &RepoHandle) -> Result<RepoHandle> {
        self.require_floor()?;
        let mut current = match self.resolve_topology(
            repo.work_tree.as_deref().ok_or_else(|| failure("checkout-required"))?,
            &repo.trusted_main_root,
        )? {
            ResolveRepo::Repository(r) => r,
            _ => return Err(failure("untrusted-worktree")),
        };
        if !current.same_checkout(repo) {
            return Err(failure("untrusted-worktree"));
        }
        // Seeded from the process-wide entry for this git dir; the stamp check
        // inside decides whether it still stands or the config is read afresh.
        let seed = REPOSITORY_CONFIG.lock().map_err(|_| failure("config-cache-poisoned"))?
            .get(&current.git_dir).cloned();
        let config = self.validated_config(&current, seed.as_ref(), Policy::Inspect, None)?;
        current.checkout_config = Some(Mutex::new(Some(config)));
        self.read_repository_facts(&mut current)?;
        if current.object_format != repo.object_format || current.layout.refs != repo.layout.refs {
            return Err(failure("repository-format-changed"));
        }
        if current.layout.promisor != repo.layout.promisor {
            return Err(failure("repository-promisor-changed"));
        }
        // What this operation proved stands for the next handle of the same git dir.
        let proven = current.checkout_config.as_ref()
            .and_then(|local| local.lock().ok().and_then(|entry| entry.clone()));
        if let Some(proven) = proven {
            REPOSITORY_CONFIG.lock().map_err(|_| failure("config-cache-poisoned"))?
                .insert(current.git_dir.clone(), proven);
        }
        Ok(current)
    }

    pub(crate) fn refresh_checkout_facts(&self, repo: &RepoHandle) -> Result<()> {
        if let Some(config) = &repo.checkout_config {
            *config.lock().map_err(|_| failure("config-cache-poisoned"))? = None;
            let fresh = self.checkout_repository(repo)?;
            let replacement = fresh.checkout_config.ok_or_else(|| failure("checkout-facts-invalidated"))?
                .into_inner().map_err(|_| failure("config-cache-poisoned"))?;
            *config.lock().map_err(|_| failure("config-cache-poisoned"))? = replacement;
        } else {
            self.checkout_repository(repo)?;
        }
        Ok(())
    }

    pub(crate) fn checked(&self, repo: &RepoHandle, args: &[&str], policy: Policy) -> Result<Vec<u8>> {
        self.require_floor()?;
        self.preflight(repo)?;
        let out = self.invoke(
            Some(repo),
            &repo.trusted_main_root,
            args,
            policy,
            None,
            true,
            if args.first() == Some(&"diff") {
                DIFF_LIMIT
            } else {
                PATH_LIMIT
            },
            Duration::from_secs(30),
        )?;
        if out.success {
            return Ok(out.stdout);
        }
        Err(out.error(layout_cause(&repo.layout, "git-command-failed")))
    }

    #[allow(clippy::too_many_arguments)]
    pub(crate) fn invoke(
        &self,
        repo: Option<&RepoHandle>,
        cwd: &Path,
        args: &[&str],
        policy: Policy,
        loan: Option<&dyn BorrowedSpawn>,
        hardened: bool,
        limit: usize,
        timeout: Duration,
    ) -> Result<Output> {
        self.invoke_input(repo, cwd, args, policy, loan, hardened, limit, timeout, &[])
    }

    #[allow(clippy::too_many_arguments)]
    pub(crate) fn invoke_input(
        &self,
        repo: Option<&RepoHandle>,
        cwd: &Path,
        args: &[&str],
        policy: Policy,
        loan: Option<&dyn BorrowedSpawn>,
        hardened: bool,
        limit: usize,
        timeout: Duration,
        input: &[u8],
    ) -> Result<Output> {
        self.invoke_context(
            repo, cwd, args, policy, loan, hardened, limit, timeout, input, None,
        )
    }
    /// The hook directory a repository's own policy names, never the
    /// driver's empty one.
    fn repository_hooks(&self, repo: &RepoHandle) -> Result<PathBuf> {
        let configured = self
            .config(repo)?
            .into_iter()
            .rev()
            .find(|(_, k, v)| {
                k == "core.hookspath" && v.as_slice() != self.hooks.to_string_lossy().as_bytes()
            })
            .map(|(_, _, v)| v);
        Ok(match configured {
            Some(bytes) => {
                let value = std::str::from_utf8(&bytes).map_err(|_| failure("non-utf8-hook-path"))?;
                if value.starts_with('~') {
                    return Err(failure("unresolved-hook-path"));
                }
                repo.trusted_main_root.join(value)
            }
            None => repo.common_dir.join("hooks"),
        })
    }

    /// Whether user code (a hook or a filter driver) may run inside a borrowed
    /// operation. Conservative: an executable hook file, an unreadable hook
    /// directory, or any configured filter command counts.
    fn user_code_may_run(&self, repo: &RepoHandle, policy: Policy) -> Result<bool> {
        if policy == Policy::HookContext {
            let hooks = self.repository_hooks(repo)?;
            match fs::read_dir(&hooks) {
                Ok(entries) => {
                    for entry in entries {
                        let Ok(entry) = entry else { return Ok(true) };
                        let name = entry.file_name();
                        if name.to_string_lossy().ends_with(".sample") {
                            continue;
                        }
                        #[cfg(unix)]
                        let executable = {
                            use std::os::unix::fs::PermissionsExt;
                            fs::metadata(entry.path())
                                .map_or(true, |m| m.is_file() && m.permissions().mode() & 0o111 != 0)
                        };
                        #[cfg(not(unix))]
                        let executable = true;
                        if executable {
                            return Ok(true);
                        }
                    }
                }
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => {}
                Err(_) => return Ok(true),
            }
        }
        if matches!(policy, Policy::HookContext | Policy::Publication | Policy::LocalMutation) {
            return Ok(self.config(repo)?.iter().any(|(_, k, _)| {
                let key = k.to_ascii_lowercase();
                key.starts_with("filter.")
                    && [".clean", ".smudge", ".process"].iter().any(|tail| key.ends_with(tail))
            }));
        }
        Ok(false)
    }
    /// Whether the repository has a submodule: a `.gitmodules` file in the
    /// worktree, or a non-empty `<common git dir>/modules` directory.
    fn has_submodules(repo: &RepoHandle) -> bool {
        if repo
            .work_tree()
            .is_some_and(|w| w.join(".gitmodules").is_file())
        {
            return true;
        }
        match fs::read_dir(repo.common_dir().join("modules")) {
            Ok(mut entries) => entries.next().is_some(),
            Err(_) => false,
        }
    }

    #[allow(clippy::too_many_arguments)]
    fn invoke_context(
        &self,
        repo: Option<&RepoHandle>,
        cwd: &Path,
        args: &[&str],
        policy: Policy,
        loan: Option<&dyn BorrowedSpawn>,
        hardened: bool,
        limit: usize,
        timeout: Duration,
        input: &[u8],
        hook_index: Option<&Path>,
    ) -> Result<Output> {
        check_hooks(&self.hooks)?;
        let mut argv = vec![text_path(&self.git)?];
        argv.extend(
            [
                "--no-replace-objects",
                "-c",
                "core.fsmonitor=false",
                "-c",
                "gc.auto=0",
                "-c",
                "maintenance.auto=false",
                "-c",
                "rerere.enabled=false",
                "-c",
                "merge.autoStash=false",
                "-c",
                "log.showSignature=false",
                "-c",
                "log.decorate=false",
                "-c",
                "log.abbrevCommit=false",
                "-c",
                "color.ui=false",
            ]
            .map(str::to_owned),
        );
        if policy == Policy::HookContext {
            let repo = repo.ok_or_else(|| failure("hook-repository-required"))?;
            let hooks = self.repository_hooks(repo)?;
            argv.extend([
                "-c".into(),
                format!("core.hooksPath={}", text_path(&hooks)?),
            ]);
        } else {
            argv.extend([
                "-c".into(),
                format!("core.hooksPath={}", text_path(&self.hooks)?),
            ]);
        }
        if policy != Policy::Remote {
            argv.extend(["-c".into(), "protocol.allow=never".into()]);
        }
        if policy != Policy::Remote && hardened {
            argv.push("--no-lazy-fetch".into());
        }
        if policy == Policy::Inspect {
            argv.push("--no-optional-locks".into());
        }
        if let Some(repo) = repo {
            argv.push(format!("--git-dir={}", text_path(&repo.git_dir)?));
            if let Some(w) = &repo.work_tree {
                argv.push(format!("--work-tree={}", text_path(w)?));
            }
        }
        if policy == Policy::Remote {
            argv.extend(
                [
                    "-c",
                    "http.proxy=",
                    "-c",
                    "http.sslVerify=true",
                    "-c",
                    "http.extraHeader=",
                    "-c",
                    "http.followRedirects=false",
                ]
                .map(str::to_owned),
            );
        }
        for (i, arg) in args.iter().enumerate() {
            argv.push((*arg).to_owned());
            if i == 0 && *arg == "update-ref" {
                argv.push("--no-deref".into());
            }
            if i == 0 && *arg == "diff" {
                argv.extend(["--no-ext-diff", "--no-textconv", "--no-relative"].map(str::to_owned));
            }
        }
        if policy == Policy::Remote && args.contains(&"protocol.file.allow=always") {
            let verb = args
                .iter()
                .find(|a| matches!(**a, "push" | "fetch" | "ls-remote"));
            if let Some(verb) = verb {
                let service = if *verb == "push" {
                    "receive-pack"
                } else {
                    "upload-pack"
                };
                let option = if *verb == "push" {
                    "--receive-pack"
                } else {
                    "--upload-pack"
                };
                // Git's local transport scrubs the client's config. Carry the
                // hook prohibition explicitly to its server-side Git process.
                let quote = |s: &str| format!("'{}'", s.replace('\'', "'\"'\"'"));
                let command = format!(
                    "{} -c {} {}",
                    quote(&text_path(&self.git)?),
                    quote(&format!("core.hooksPath={}", text_path(&self.hooks)?)),
                    service
                );
                let at = argv.iter().position(|a| a == "--").unwrap_or(argv.len());
                argv.insert(at, format!("{option}={command}"));
            }
        }
        if policy == Policy::Remote {
            if let Some(repo) = repo {
                // Repository transport policy is untrusted, including URL-scoped
                // values which outrank generic -c values. Refuse the whole family.
                if let Some(key) = self.untrusted_transport_config(repo)?.first() {
                    return Err(failure(format!(
                        "repository-transport-config-untrusted: {key}"
                    )));
                }
            }
        }
        let mut env = Scrubbed::new();
        if let Some(index) = hook_index {
            env.0.insert("GIT_INDEX_FILE".into(), text_path(index)?);
        }
        env.0.insert("LC_ALL".into(), "C".into());
        env.0.insert("LANGUAGE".into(), String::new());
        if policy != Policy::Remote {
            env.0.insert("GIT_NO_LAZY_FETCH".into(), "1".into());
        }
        env.0.insert("GIT_TERMINAL_PROMPT".into(), "0".into());
        if policy == Policy::HookContext {
            for key in [
                "GIT_AUTHOR_NAME",
                "GIT_AUTHOR_EMAIL",
                "GIT_AUTHOR_DATE",
                "GIT_COMMITTER_NAME",
                "GIT_COMMITTER_EMAIL",
                "GIT_COMMITTER_DATE",
            ] {
                if let Ok(value) = std::env::var(key) {
                    env.0.insert(key.into(), value);
                }
            }
        }
        if policy == Policy::Publication
            || ((policy == Policy::Remote || policy == Policy::HookContext) && loan.is_some())
        {
            let loan = loan.ok_or_else(|| failure("publication-borrow-required"))?;
            // A borrowed run is spawned by holder-lock with the descriptor
            // mapped, outside any containment domain, whichever driver this
            // machine selects: its drain cannot prove gone an escapee that
            // dropped the descriptor and left the process group. Where user
            // code may run, the borrow marks the child's environment and
            // reports survivors that inherited the mark.
            // Reading the configuration runs no user code, and it is itself how
            // the check below learns the configuration.
            let watch = args.first() != Some(&"config")
                && repo.is_some_and(|r| self.user_code_may_run(r, policy).unwrap_or(true));
            let result = loan.run_borrowed(
                &fgos_holder_lock::BorrowSpec {
                    argv,
                    cwd: Some(cwd.into()),
                    env: env.0,
                    clear_env: true,
                    stdio: fgos_holder_lock::BorrowStdio::Null,
                },
                &fgos_holder_lock::BorrowIo {
                    stdin: input.to_vec(),
                    stdout_limit: limit,
                    stderr_limit: BORROWED_STDERR_LIMIT,
                    deadline: Instant::now()
                        .checked_add(timeout)
                        .ok_or_else(|| failure("invalid-git-deadline"))?,
                },
                watch,
            )?;
            // The effect stays recorded for recovery; a failed run already
            // reports failure, never plain success.
            if result.outcome.exit == Some(0) && !result.escaped.is_empty() {
                return Err(recovery("containment-unproven"));
            }
            return Ok(Output {
                stdout: result.stdout,
                stderr: redact(&result.stderr),
                success: result.outcome.exit == Some(0),
                code: result.outcome.exit,
            });
        }
        // Read-only batch plumbing needs stdin without holder authority.
        if !input.is_empty() && policy != Policy::Inspect {
            return Err(failure("git-input-requires-borrow"));
        }
        let watch_token = (self.containment.guarantee().level
            == containment::GuaranteeLevel::BestEffort
            // Reading the configuration runs no user code, and it is itself how
            // the predicate below learns the configuration.
            && args.first() != Some(&"config")
            && repo.is_some_and(|r| {
                self.user_code_may_run(r, policy).unwrap_or(true) || Self::has_submodules(r)
            }))
        .then(containment::watch_token);
        if let Some(token) = &watch_token {
            env.0.insert(containment::WATCH_ENV.into(), token.clone());
        }
        let (stdin_r, mut stdin_w) = std::io::pipe().map_err(io)?;
        let (stdout_r, stdout_w) = std::io::pipe().map_err(io)?;
        let (stderr_r, stderr_w) = std::io::pipe().map_err(io)?;
        let spec = SpawnSpec {
            argv,
            bwrap_prefix: None,
            fd_map: Vec::new(),
            env: env.0,
            cwd: cwd.into(),
            stdin: Some(pipe_file(stdin_r)),
            stdout: Some(pipe_file(stdout_w)),
            stderr: Some(pipe_file(stderr_w)),
            mode: StartMode::Direct,
        };
        let id = format!(
            "git-{}-{}",
            std::process::id(),
            SERIAL.fetch_add(1, Ordering::Relaxed)
        );
        let mut domain = self
            .containment
            .create(&id)
            .map_err(|e| failure("git-containment-failed").with_diagnostic(e))?;
        let mut spawned = self
            .containment
            .spawn_in(&mut domain, spec)
            .map_err(|e| failure("git-spawn-failed").with_diagnostic(e))?;
        let input = input.to_vec();
        std::thread::spawn(move || {
            use std::io::Write;
            let _ = stdin_w.write_all(&input);
        });
        let overflow = Arc::new(AtomicBool::new(false));
        let out = capture(stdout_r, limit, overflow.clone());
        let err = capture(stderr_r, STDERR_LIMIT, overflow.clone());
        #[cfg(unix)]
        let exit_fd = fgos_process::control::exit_descriptor(spawned.child.id());
        let start = Instant::now();
        let mut stopped = None;
        let status = loop {
            if let Some(status) = spawned.child.try_wait().map_err(io)? {
                break status;
            }
            if overflow.load(Ordering::Relaxed) || start.elapsed() >= timeout {
                stopped = Some(if overflow.load(Ordering::Relaxed) {
                    "git-output-limit"
                } else {
                    "git-timeout"
                });
                if self.containment.kill_all(&mut domain, 3000) != KillOutcome::Ok {
                    std::thread::spawn(move || {
                        let _ = spawned.child.wait();
                    });
                    return Err(failure("containment-unproven"));
                }
                break spawned.child.wait().map_err(io)?;
            }
            // Wake on the child's exit (pidfd) without a fixed sleep; the
            // short step still notices an output overflow promptly.
            let step = timeout.saturating_sub(start.elapsed()).min(OVERFLOW_CHECK);
            #[cfg(unix)]
            match &exit_fd {
                Some(fd) => {
                    use std::os::fd::AsRawFd;
                    let mut pfd = libc::pollfd { fd: fd.as_raw_fd(), events: libc::POLLIN, revents: 0 };
                    let ms = step.as_millis().max(1) as libc::c_int;
                    // SAFETY: one pollfd on a descriptor owned by this call.
                    unsafe { libc::poll(&mut pfd, 1, ms) };
                }
                None => std::thread::sleep(step.min(Duration::from_millis(1))),
            }
            #[cfg(not(unix))]
            std::thread::sleep(step.min(Duration::from_millis(1)));
        };
        // A root exit is not proof that pipe-owning descendants have exited.
        if self.containment.is_empty(&mut domain) != DomainState::Empty
            && (self.containment.kill_all(&mut domain, 3000) != KillOutcome::Ok
                || self.containment.is_empty(&mut domain) != DomainState::Empty)
        {
            // Readers are detached, never block indefinitely on an escapee.
            return Err(failure("containment-unproven"));
        }
        let stdout = out
            .recv_timeout(Duration::from_secs(1))
            .map_err(|_| failure("containment-unproven"))?
            .map_err(io)?;
        let stderr = redact(
            &err.recv_timeout(Duration::from_secs(1))
                .map_err(|_| failure("containment-unproven"))?
                .map_err(io)?,
        );
        if let Some(cause) = stopped {
            return Err(child_failure(cause, "contained"));
        }
        if overflow.load(Ordering::Relaxed) {
            return Err(child_failure("git-output-limit", "contained"));
        }
        if status.success() {
            if let Some(token) = &watch_token {
                if !containment::environment_marked(containment::WATCH_ENV, token).is_empty() {
                    return Err(failure("containment-unproven"));
                }
            }
        }
        Ok(Output {
            stdout,
            stderr,
            success: status.success(),
            code: status.code(),
        })
    }
    /// The floor verdict for the selected Git. Probing runs about fourteen
    /// contained Git invocations; its verdict is kept in the state root,
    /// keyed by everything the probes depend on (the Git binary's identity,
    /// the floor contract, and the identity of every config file the
    /// probes' Git could read), and reused by a later process only when
    /// the whole key is unchanged. Anything else probes again.
    fn recorded_floor(&self) -> Result<GitFloorVerdict> {
        let record = self.state_root.join(FLOOR_RECORD);
        let key = self.floor_key();
        if let Some(verdict) = key.as_ref().and_then(|key| read_floor_record(&record, key)) {
            return Ok(verdict);
        }
        let verdict = self.probe_floor()?;
        if let Some(key) = key {
            // A record that cannot be written only costs the next process a probe.
            let _ = fgos_durable_file::replace_durably(
                &self.state_root,
                FLOOR_RECORD,
                floor_record(&key, &verdict).to_string().as_bytes(),
            );
        }
        Ok(verdict)
    }
    fn floor_key(&self) -> Option<serde_json::Value> {
        let home = std::env::var_os("HOME").map(PathBuf::from);
        let xdg = std::env::var_os("XDG_CONFIG_HOME").map(PathBuf::from);
        let mut configs = self.config_paths(None, &self.state_root, Policy::Inspect, None).ok()?;
        let before = ConfigStamp::read(configs.clone()).ok()?;
        // Includes may depend on gitdir/onbranch/hasconfig as well as files.
        // Conservatively do not persist a verdict for any include directive,
        // including missing or currently inactive includeIf targets.
        let config = self
            .config_listing(None, &self.state_root, &["--show-origin"], Duration::from_secs(10))
            .ok()?;
        if !config.success {
            return None;
        }
        for (origin, key, _) in parse_config(&config.stdout).ok()? {
            if key == "include.path" || key.starts_with("includeif.") { return None; }
            if let Some(path) = origin.strip_prefix(b"file:") {
                let path = PathBuf::from(std::str::from_utf8(path).ok()?);
                let path = self.state_root.join(path);
                if !configs.contains(&path) { configs.push(path); }
            }
        }
        if before != ConfigStamp::read(before.paths.clone()).ok()? { return None; }
        let binary = ConfigStamp::read(vec![self.git.clone()]).ok()?;
        let configs = ConfigStamp::read(configs).ok()?;
        Some(serde_json::json!({
            "v": 2,
            "hostVersion": env!("CARGO_PKG_VERSION"),
            "probeCode": crate::wal::canonical_digest(&include_str!("driver.rs")).ok()?,
            "path": std::env::var_os("PATH").map(|p| p.to_string_lossy().into_owned()),
            "git": self.git,
            "binary": binary.files,
            "contract": crate::wal::canonical_digest(&include_str!("../../contracts/git-floor.v1.json")).ok()?,
            "home": home,
            "xdgConfigHome": xdg,
            "configs": configs.paths.iter().zip(&configs.files).collect::<Vec<_>>(),
        }))
    }
    fn probe_floor(&self) -> Result<GitFloorVerdict> {
        let out = self.invoke(
            None,
            &self.state_root,
            &["--version"],
            Policy::Inspect,
            None,
            false,
            4096,
            Duration::from_secs(10),
        )?;
        let version = line(&out.stdout)?
            .strip_prefix("git version ")
            .ok_or_else(|| failure("git-version-invalid"))?
            .to_owned();
        let numeric: Vec<u32> = version
            .split('.')
            .take(3)
            .map(|s| s.parse().unwrap_or(0))
            .collect();
        let contract: serde_json::Value =
            serde_json::from_str(include_str!("../../contracts/git-floor.v1.json"))
                .expect("floor contract");
        let minimum: Vec<u32> = contract["minimum"]
            .as_array()
            .expect("floor")
            .iter()
            .map(|n| n.as_u64().expect("number") as u32)
            .collect();
        let mut verdict = GitFloorVerdict {
            version,
            minimum: contract["minimumVersion"].as_str().unwrap().into(),
            supported: false,
            probes: Vec::new(),
        };
        if numeric < minimum {
            return Ok(verdict);
        }
        let dir = self.state_root.join(format!(
            "git-floor-{}-{}",
            std::process::id(),
            SERIAL.fetch_add(1, Ordering::Relaxed)
        ));
        driver_directory_builder(0o700).create(&dir).map_err(io)?;
        let result = self.probe_features(&dir, &mut verdict);
        // Probe evidence is diagnostic, not operation evidence; no WAL is here.
        let cleanup = fs::remove_dir_all(&dir).map_err(io);
        result?;
        cleanup?;
        verdict.supported = verdict.probes.iter().all(|p| p.passed);
        Ok(verdict)
    }
    fn probe_features(&self, dir: &Path, verdict: &mut GitFloorVerdict) -> Result<()> {
        let run = |args: &[&str]| {
            self.invoke(
                None,
                dir,
                args,
                Policy::Inspect,
                None,
                true,
                PATH_LIMIT,
                Duration::from_secs(10),
            )
        };
        if !run(&["init", "--bare", "--quiet", "."])?.success {
            return Err(failure("git-floor-probe-init"));
        }
        let marker = dir.join("hook-ran");
        fs::write(
            dir.join("hooks/reference-transaction"),
            b"#!/bin/sh\nprintf ran > hook-ran\n",
        )
        .map_err(io)?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(
                dir.join("hooks/reference-transaction"),
                fs::Permissions::from_mode(0o700),
            )
            .map_err(io)?;
        }
        // hash an empty file without stdin; --literally is intentionally absent.
        fs::write(dir.join("empty"), b"").map_err(io)?;
        let blob = run(&["hash-object", "-w", "empty"])?;
        let oid = line(&blob.stdout)?;
        let first = run(&["update-ref", "refs/probe/victim", oid])?;
        let sym = run(&["symbolic-ref", "refs/probe/symbolic", "refs/probe/victim"])?;
        let del = run(&["update-ref", "--no-deref", "-d", "refs/probe/symbolic", oid])?;
        let victim = run(&["rev-parse", "--verify", "refs/probe/victim"])?;
        let symbolic = run(&["symbolic-ref", "-q", "refs/probe/symbolic"])?;
        verdict.probes.push(FloorProbe {
            name: "update-ref-no-deref".into(),
            passed: first.success
                && sym.success
                && del.success
                && victim.success
                && line(&victim.stdout)? == oid
                && !symbolic.success,
            evidence: "exact-old symbolic delete preserves victim".into(),
        });
        let suppressed = first.success && !marker.exists();
        let control = run(&[
            "-c",
            "core.hooksPath=hooks",
            "update-ref",
            "refs/probe/control",
            oid,
        ])?;
        verdict.probes.push(FloorProbe {
            name: "hook-suppression".into(),
            passed: suppressed && control.success && marker.exists(),
            evidence: "trusted hooksPath suppresses reference-transaction; enabled control runs it"
                .into(),
        });
        let hook = run(&["hook", "run", "--ignore-missing", "pre-commit"])?;
        verdict.probes.push(FloorProbe {
            name: "hook-run".into(),
            passed: hook.success,
            evidence: "hook run --ignore-missing accepted".into(),
        });
        // A real promisor repository whose transport would leave a marker if
        // lazy fetching ran. A missing object must fail without that transport.
        let fetch_marker = dir.join("fetch-ran");
        let transport = dir.join("transport");
        if fetch_marker.to_string_lossy().contains('\'') {
            return Err(failure("unsupported-probe-path"));
        }
        fs::write(
            &transport,
            format!(
                "#!/bin/sh\nprintf ran > '{}'\nexit 1\n",
                fetch_marker.display()
            ),
        )
        .map_err(io)?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(&transport, fs::Permissions::from_mode(0o700)).map_err(io)?;
        }
        for args in [
            vec!["config", "remote.origin.promisor", "true"],
            vec!["config", "remote.origin.url", "ssh://example.invalid/repo"],
            vec![
                "config",
                "core.sshCommand",
                transport
                    .to_str()
                    .ok_or_else(|| failure("non-utf8-state-root"))?,
            ],
        ] {
            if !run(&args)?.success {
                return Err(failure("git-floor-probe-config"));
            }
        }
        let missing = "1234567890123456789012345678901234567890";
        let read = run(&["cat-file", "-e", missing])?;
        let suppressed = !read.success && !fetch_marker.exists();
        let control = self.invoke(
            None,
            dir,
            &["cat-file", "-e", missing],
            Policy::Remote,
            None,
            false,
            PATH_LIMIT,
            Duration::from_secs(10),
        )?;
        verdict.probes.push(FloorProbe {
            name: "no-lazy-fetch".into(),
            passed: suppressed && !control.success && fetch_marker.exists(),
            evidence:
                "missing promisor object does not fetch; lazy-enabled control invokes SSH transport"
                    .into(),
        });
        Ok(())
    }
}

/// Why a missing object is the layout's doing rather than a damaged repository: a promisor
/// remote or an alternate may hold it. A shallow boundary alone cuts history, never objects.
pub(crate) fn object_gap_cause(layout: &RepoLayout) -> Option<&'static str> {
    if layout.promisor {
        Some("promisor-object-unavailable")
    } else if layout.alternates {
        Some("alternate-object-unavailable")
    } else {
        None
    }
}
/// The one name for a failed read: the layout feature that explains it, else `fallback`.
pub(crate) fn layout_cause(layout: &RepoLayout, fallback: &'static str) -> &'static str {
    object_gap_cause(layout)
        .or(layout.shallow.then_some("shallow-history-incomplete"))
        .unwrap_or(fallback)
}

/// What one literal ref holds: direct, symbolic or absent. A dangling symbolic ref is listed by no
/// `for-each-ref` pattern, so a name that is not listed gets the symbolic probe before it may read
/// as absent. `run` is the door the caller's Git children must use.
pub(crate) fn read_ref_value(
    repo: &RepoHandle,
    name: &RefName,
    run: &dyn Fn(&[&str]) -> Result<Output>,
) -> Result<RefValue> {
    let listing = run(&["for-each-ref", "--format=%(refname)%00%(objectname)%00%(symref)", "--", name.as_str()])?;
    if !listing.success {
        return Err(listing.error(layout_cause(&repo.layout, "git-command-failed")));
    }
    for l in listing.stdout.split(|b| *b == b'\n').filter(|l| !l.is_empty()) {
        let fields: Vec<_> = l.split(|b| *b == 0).collect();
        if fields.len() != 3 {
            return Err(failure("invalid-ref-observation"));
        }
        if fields[0] != name.as_str().as_bytes() {
            continue;
        }
        return if fields[2].is_empty() {
            Oid::parse(line(fields[1])?, repo.object_format())
                .map(RefValue::Direct)
                .map_err(|_| failure("git-protocol-invalid-oid"))
        } else {
            symbolic_target(fields[2]).map(RefValue::Symbolic)
        };
    }
    let probe = run(&["symbolic-ref", "--quiet", "--", name.as_str()])?;
    match (probe.success, probe.code) {
        (true, _) => symbolic_target(&probe.stdout).map(RefValue::Symbolic),
        (false, Some(1)) => Ok(RefValue::Absent),
        _ => Err(probe.error("read-ref-failed")),
    }
}
fn symbolic_target(bytes: &[u8]) -> Result<RefName> {
    RefName::parse(line(bytes)?).map_err(|_| failure("invalid-symbolic-target"))
}

pub(crate) struct Output {
    pub(crate) stdout: Vec<u8>,
    pub(crate) stderr: Vec<u8>,
    pub(crate) success: bool,
    pub(crate) code: Option<i32>,
}
impl Output {
    pub(crate) fn error(self, cause: &str) -> OperationError {
        let mut e = failure(cause);
        e.exit_code = self.code;
        e.stderr = self.stderr;
        e
    }
}
fn text_path(path: &Path) -> Result<String> {
    path.to_str()
        .map(str::to_owned)
        .ok_or_else(|| failure("non-utf8-authority-path"))
}
fn line(bytes: &[u8]) -> Result<&str> {
    let bytes = bytes.strip_suffix(b"\n").unwrap_or(bytes);
    std::str::from_utf8(bytes).map_err(|_| failure("git-protocol-invalid-utf8"))
}
fn driver_directory_builder(mode: u32) -> fs::DirBuilder {
    let builder = fs::DirBuilder::new();
    #[cfg(unix)]
    let mut builder = builder;
    #[cfg(unix)]
    {
        use std::os::unix::fs::DirBuilderExt;
        builder.mode(mode);
    }
    #[cfg(not(unix))]
    let _ = mode;
    builder
}
fn secure_driver_directory(path: &Path, mode: u32, recursive: bool) -> Result<bool> {
    let existed = fs::symlink_metadata(path).is_ok();
    let mut builder = driver_directory_builder(mode);
    builder.recursive(recursive);
    let created = match builder.create(path) {
        Ok(()) => true,
        Err(e) if e.kind() == std::io::ErrorKind::AlreadyExists => false,
        Err(e) => return Err(io(e)),
    };
    // recursive create returns Ok for an existing directory; compare mode below
    // rather than reporting that as a change.
    #[cfg(unix)]
    {
        use std::os::unix::fs::{MetadataExt, OpenOptionsExt, PermissionsExt};
        let file = fs::OpenOptions::new()
            .read(true)
            .custom_flags(libc::O_NOFOLLOW | libc::O_DIRECTORY)
            .open(path)
            .map_err(|e| failure(format!("untrusted-driver-directory: {}: {e}; inspect the directory, restore owner read/search access if needed, remove foreign hooks files, then rerun fgos doctor --fix (git-driver-directories)", path.display())))?;
        let meta = file.metadata().map_err(io)?;
        if meta.uid() != current_uid() {
            return Err(failure("untrusted-driver-directory: not owned by current user; no permission repair allowed"));
        }
        if mode == 0o500 {
            hooks_empty(path)?;
        }
        let wanted = if mode == 0o500 {
            mode
        } else {
            meta.mode() & 0o777 & !0o022
        };
        if meta.mode() & 0o777 != wanted {
            file.set_permissions(fs::Permissions::from_mode(wanted))
                .map_err(io)?;
            return Ok(true);
        }
    }
    #[cfg(not(unix))]
    if mode == 0o500 { check_hooks(path)?; } else { trusted_directory(path)?; }
    Ok(created && !existed)
}
fn trusted_directory(path: &Path) -> Result<()> {
    let meta = fs::symlink_metadata(path).map_err(io)?;
    if !meta.is_dir() || meta.file_type().is_symlink() {
        return Err(failure(format!("untrusted-driver-directory: {} must be a real directory; run fgos doctor --fix (git-driver-directories)", path.display())));
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::MetadataExt;
        // The state root must belong to this process's user, not a repository.
        if meta.mode() & 0o022 != 0 || meta.uid() != current_uid() {
            return Err(failure(format!("untrusted-driver-directory: {} mode {:04o}, uid {} (current {}); group/world writable or wrong owner; run fgos doctor --fix (git-driver-directories); only current-user-owned fgOS directories can be repaired", path.display(), meta.mode() & 0o777, meta.uid(), current_uid())));
        }
    }
    Ok(())
}
#[cfg(unix)]
fn current_uid() -> u32 {
    // SAFETY: getuid has no preconditions.
    unsafe { libc::getuid() }
}
fn hooks_empty(path: &Path) -> Result<()> {
    if fs::read_dir(path).map_err(|e| failure(format!("trusted-hooks-unreadable: {}: {e}; inspect it and restore owner read/search access, then rerun fgos doctor --fix (git-driver-directories)", path.display())))?.next().is_some() {
        return Err(failure(format!("trusted-hooks-not-empty: {}; inspect it, remove foreign files, then rerun fgos doctor --fix (git-driver-directories)", path.display())));
    }
    Ok(())
}
fn check_hooks(path: &Path) -> Result<()> {
    trusted_directory(path)?;
    hooks_empty(path)?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        if fs::metadata(path).map_err(io)?.permissions().mode() & 0o777 != 0o500 {
            return Err(failure(format!("trusted-hooks-permissions: {} must have mode 0500; run fgos doctor --fix (git-driver-directories)", path.display())));
        }
    }
    Ok(())
}
#[cfg(unix)]
type OwnedPipe = std::os::fd::OwnedFd;
#[cfg(windows)]
type OwnedPipe = std::os::windows::io::OwnedHandle;
fn pipe_file(pipe: impl Into<OwnedPipe>) -> File {
    File::from(pipe.into())
}
fn capture(
    mut input: impl Read + Send + 'static,
    limit: usize,
    overflow: Arc<AtomicBool>,
) -> mpsc::Receiver<std::io::Result<Vec<u8>>> {
    let (tx, rx) = mpsc::channel();
    std::thread::spawn(move || {
        let result = (|| {
            let mut bytes = Vec::new();
            let mut buf = [0; 8192];
            loop {
                let n = input.read(&mut buf)?;
                if n == 0 {
                    return Ok(bytes);
                }
                let take = n.min(limit.saturating_sub(bytes.len()));
                bytes.extend_from_slice(&buf[..take]);
                if take < n {
                    overflow.store(true, Ordering::Relaxed);
                }
            }
        })();
        let _ = tx.send(result);
    });
    rx
}
fn redact(bytes: &[u8]) -> Vec<u8> {
    // Preserve Git's diagnostic text while redacting URL userinfo and query
    // credentials. Config refusals never include values in the first place.
    String::from_utf8_lossy(bytes)
        .split_inclusive(char::is_whitespace)
        .map(|part| {
            if let Some(scheme_end) = part.find("://") {
                let scheme = part[..scheme_end]
                    .rsplit(|c: char| !(c.is_ascii_alphanumeric() || "+-.".contains(c)))
                    .next()
                    .unwrap_or("");
                let start = scheme_end + 3;
                let end = part[start..].find('/').map_or(part.len(), |i| start + i);
                let mut result = part.to_owned();
                // An ssh account name is not a secret; keeping it makes the display form
                // the raw form, so a pinned URL binds the account.
                if let Some(at) = part[start..end].rfind('@') {
                    if crate::remote::userinfo_is_credential(scheme, &part[start..start + at]) {
                        result.replace_range(start..start + at, "[redacted]");
                    }
                }
                if let Some(q) = result.find('?') {
                    result.truncate(q);
                    result.push_str("?[redacted]");
                }
                result
            } else {
                part.to_owned()
            }
        })
        .collect::<String>()
        .into_bytes()
}
fn command_config(key: &str) -> bool {
    key == "diff.external"
        || key == "core.sshcommand"
        || key == "gpg.program"
        || key == "credential.helper"
        || key == "include.path"
        || key.starts_with("includeif.")
        || (key.starts_with("filter.")
            && [".clean", ".smudge", ".process"]
                .iter()
                .any(|s| key.ends_with(s)))
        || (key.starts_with("diff.") && key.ends_with(".textconv"))
        || (key.starts_with("merge.") && key.ends_with(".driver"))
        || key.starts_with("url.")
        || (key.starts_with("remote.")
            && [".uploadpack", ".receivepack"]
                .iter()
                .any(|s| key.ends_with(s)))
}
// Generic HTTP settings below are forcibly overridden by Remote's -c policy.
fn repository_transport_config(key: &str) -> bool {
    ![
        "http.proxy",
        "http.sslverify",
        "http.extraheader",
        "http.followredirects",
    ]
    .contains(&key)
        && (key.starts_with("http.")
            || key.starts_with("https.")
            || key.starts_with("ssh.")
            || key.starts_with("protocol.")
            || key.starts_with("credential.")
            || key == "core.gitproxy"
            || key == "remote.pushdefault"
            || (key.starts_with("remote.")
                && [".proxy", ".proxyauthmethod", ".vcs"]
                    .iter()
                    .any(|s| key.ends_with(s))))
}
/// Config --null with --show-origin or --show-scope emits metadata NUL key LF value NUL.
pub(crate) fn parse_config(bytes: &[u8]) -> Result<Vec<ConfigRecord>> {
    let fields = nul_records(bytes)?;
    if fields.len() % 2 != 0 {
        return Err(failure("git-config-protocol"));
    }
    fields
        .as_chunks::<2>()
        .0
        .iter()
        .map(|pair| {
            let split = pair[1]
                .iter()
                .position(|b| *b == b'\n')
                .unwrap_or(pair[1].len());
            let key = std::str::from_utf8(&pair[1][..split])
                .map_err(|_| failure("git-config-protocol"))?
                .to_ascii_lowercase();
            let value = pair[1].get(split + 1..).unwrap_or_default().to_vec();
            Ok((pair[0].to_vec(), key, value))
        })
        .collect()
}
/// Byte preserving; a missing final delimiter is corrupt, never partial success.
fn nul_records(bytes: &[u8]) -> Result<Vec<&[u8]>> {
    if bytes.is_empty() {
        return Ok(Vec::new());
    }
    if bytes.last() != Some(&0) {
        return Err(failure("git-nul-protocol-truncated"));
    }
    Ok(bytes[..bytes.len() - 1].split(|b| *b == 0).collect())
}

/// Read-only WAL observations use the same hardened driver as repository
/// inspection. No raw Git spawn or filesystem ref parser in the journal.
pub struct WalReader<'a> {
    pub driver: &'a GitDriver,
    pub repo: &'a RepoHandle,
}
impl crate::wal::RecoveryReader for WalReader<'_> {
    fn read_ref(&self, reference: &str) -> crate::wal::WalResult<crate::wal::ObservedRef> {
        use crate::wal::{ObservedRef, Tip, WalError};
        RefName::parse(reference).map_err(|_| WalError::RecoveryRequired)?;
        // Also catches a dangling symbolic ref, which for-each-ref omits.
        if self
            .driver
            .checked(
                self.repo,
                &["symbolic-ref", "--quiet", "--", reference],
                Policy::Inspect,
            )
            .is_ok()
        {
            return Ok(ObservedRef::Symbolic);
        }
        match self.driver.checked(
            self.repo,
            &["show-ref", "--exists", "--", reference],
            Policy::Inspect,
        ) {
            Ok(_) => (),
            Err(e) if e.exit_code == Some(2) => return Ok(ObservedRef::Direct(Tip::Absent)),
            Err(_) => return Err(WalError::RecoveryRequired),
        }
        // for-each-ref succeeds for an absent ref, unlike rev-parse. Recheck
        // exact name: its pattern argument also matches descendants.
        let bytes = self
            .driver
            .checked(
                self.repo,
                &[
                    "for-each-ref",
                    "--format=%(refname)%00%(objectname)%00%(symref)",
                    "--",
                    reference,
                ],
                Policy::Inspect,
            )
            .map_err(|_| WalError::RecoveryRequired)?;
        for line in bytes.split(|b| *b == b'\n').filter(|l| !l.is_empty()) {
            let parts: Vec<_> = line.split(|b| *b == 0).collect();
            if parts.len() != 3 {
                return Err(WalError::RecoveryRequired);
            }
            if parts[0] != reference.as_bytes() {
                continue;
            }
            if !parts[2].is_empty() {
                return Ok(ObservedRef::Symbolic);
            }
            let oid = std::str::from_utf8(parts[1]).map_err(|_| WalError::RecoveryRequired)?;
            Oid::parse(oid, self.repo.object_format()).map_err(|_| WalError::RecoveryRequired)?;
            return Ok(ObservedRef::Direct(Tip::Oid(oid.into())));
        }
        Err(WalError::RecoveryRequired)
    }
    fn candidate_intact(&self, intent: &crate::wal::Intent) -> crate::wal::WalResult<bool> {
        if let crate::wal::Tip::Oid(oid) = intent.candidate() {
            Oid::parse(oid, self.repo.object_format())
                .map_err(|_| crate::wal::WalError::RecoveryRequired)?;
            if self.repo.layout().shallow {
                return Ok(false);
            }
            // Intact means the candidate is a commit and everything it reaches is present.
            let kind = self.driver.checked(self.repo, &["cat-file", "-t", "--", oid], Policy::Inspect);
            return Ok(kind.is_ok_and(|kind| kind == b"commit\n")
                && self
                    .driver
                    .checked(
                        self.repo,
                        &["rev-list", "--objects", "--missing=error", "--end-of-options", oid],
                        Policy::Inspect,
                    )
                    .is_ok());
        }
        Ok(true)
    }
}

impl Inspect for GitDriver {
    fn walk_commits(
        &self,
        repo: &RepoHandle,
        tips: &[Oid],
        stop: &[Oid],
        cursor: Option<WalkCursor>,
        bounds: WalkBounds,
    ) -> Result<WalkPage> {
        if bounds.max_commits == 0
            || bounds.max_commits > 100_000
            || bounds.max_bytes == 0
            || bounds.max_bytes > 64 * 1024 * 1024
        {
            return Err(failure("invalid-walk-bounds"));
        }
        for o in tips.iter().chain(stop) {
            Oid::parse(o.as_str(), repo.object_format())
                .map_err(|_| failure("object-format-mismatch"))?;
        }
        let binding = wal::canonical_digest(&(
            tips.iter().map(Oid::as_str).collect::<Vec<_>>(),
            stop.iter().map(Oid::as_str).collect::<Vec<_>>(),
            &repo.common_dir(),
        ))?;
        let mut c: CommitCursor = match cursor {
            Some(c) if c.0.len() <= 64 * 1024 * 1024 => {
                serde_json::from_slice(&c.0).map_err(|_| failure("invalid-walk-cursor"))?
            }
            Some(_) => return Err(failure("walk-cursor-overflow")),
            None => CommitCursor {
                binding: binding.clone(),
                pending: tips.iter().map(|o| o.as_str().into()).collect(),
                visited: BTreeSet::new(),
            },
        };
        if c.binding != binding {
            return Err(failure("walk-cursor-request-mismatch"));
        }
        let stop: BTreeSet<_> = stop.iter().map(Oid::as_str).collect();
        let shallow: BTreeSet<String> = if repo.layout.shallow {
            fs::read_to_string(repo.common_dir().join("shallow"))
                .map_err(|e| failure(e.to_string()))?
                .lines()
                .map(str::to_owned)
                .collect()
        } else {
            BTreeSet::new()
        };
        let mut commits = vec![];
        let mut cached = BTreeMap::new();
        let mut total = 0;
        while let Some(o) = c.pending.pop_front() {
            if c.visited.contains(&o) {
                continue;
            }
            let oid =
                Oid::parse(&o, repo.object_format()).map_err(|_| failure("invalid-cursor-oid"))?;
            if !cached.contains_key(&o) {
                let mut seeds = vec![o.clone()];
                let count = bounds.max_commits - commits.len();
                seeds.extend(c.pending.iter().take(count.min(256) - 1).cloned());
                cached = self.commit_batch(repo, &seeds, &stop, count, bounds.max_bytes - total)?;
            }
            let Some(bytes) = cached.remove(&o) else {
                if commits.is_empty() {
                    return Err(failure("walk-commit-exceeds-byte-bound"));
                }
                c.pending.push_front(o);
                break;
            };
            if total + bytes.len() > bounds.max_bytes {
                if commits.is_empty() {
                    return Err(failure("walk-commit-exceeds-byte-bound"));
                }
                c.pending.push_front(o);
                break;
            }
            let header = bytes
                .windows(2)
                .position(|w| w == b"\n\n")
                .ok_or_else(|| failure("invalid-commit"))?;
            let mut tree = None;
            let mut parents = vec![];
            for l in bytes[..header].split(|b| *b == b'\n') {
                if let Some(v) = l.strip_prefix(b"tree ") {
                    if tree.is_some() {
                        return Err(failure("invalid-commit-tree"));
                    }
                    tree = Some(
                        Oid::parse(
                            std::str::from_utf8(v).map_err(|_| failure("invalid-oid"))?,
                            repo.object_format(),
                        )
                        .map_err(|_| failure("invalid-oid"))?,
                    );
                }
                if let Some(v) = l.strip_prefix(b"parent ") {
                    parents.push(
                        Oid::parse(
                            std::str::from_utf8(v).map_err(|_| failure("invalid-oid"))?,
                            repo.object_format(),
                        )
                        .map_err(|_| failure("invalid-oid"))?,
                    );
                }
            }
            if !stop.contains(o.as_str()) {
                if shallow.contains(&o) {
                    return Err(failure("shallow-history-incomplete"));
                }
                for p in &parents {
                    if !c.visited.contains(p.as_str()) {
                        c.pending.push_back(p.as_str().into());
                    }
                }
            }
            total += bytes.len();
            c.visited.insert(o);
            commits.push(WalkCommit {
                oid,
                parents,
                tree: tree.ok_or_else(|| failure("invalid-commit-tree"))?,
            });
            if commits.len() == bounds.max_commits {
                break;
            }
        }
        // Remove duplicate queued entries before declaring completion.
        c.pending.retain(|o| !c.visited.contains(o));
        let complete = c.pending.is_empty();
        let next_cursor = if complete {
            None
        } else {
            let bytes = serde_json::to_vec(&c).map_err(|_| failure("invalid-walk-cursor"))?;
            if bytes.len() > 64 * 1024 * 1024 {
                return Err(failure("walk-cursor-overflow"));
            }
            Some(WalkCursor(bytes))
        };
        Ok(WalkPage {
            commits,
            next_cursor,
            complete,
        })
    }
    fn resolve_head(&self, repo: &RepoHandle) -> Result<HeadFact> {
        self.require_floor()?;
        self.preflight(repo)?;
        let head = |args: &[&str]| {
            self.invoke(Some(repo), &repo.trusted_main_root, args, Policy::Inspect, None, true, 4096, Duration::from_secs(30))
        };
        let target_of = |name: &str| RefName::parse(name).map_err(|_| failure("invalid-head-target"));
        // HEAD is read by two children, bracketed: the symbolic target first, then the commit with
        // the target it was read under. One `rev-parse` reads HEAD several times, so a switch in
        // the middle could pair one branch's commit with another's name; the two names must agree.
        let first = head(&["symbolic-ref", "--quiet", "HEAD"])?;
        let target = if first.success {
            Some(target_of(line(&first.stdout).map_err(|_| failure("invalid-head-target"))?)?)
        } else if first.code == Some(1) {
            None
        } else {
            return Err(first.error("head-observation-failed"));
        };
        let out = head(&["rev-parse", "HEAD^{commit}", "--symbolic-full-name", "HEAD"])?;
        if out.success {
            let text = line(&out.stdout).map_err(|_| failure("invalid-head-oid"))?;
            let (value, name) = text.split_once('\n').ok_or_else(|| failure("invalid-head-oid"))?;
            let commit = Oid::parse(value, repo.object_format()).map_err(|_| failure("invalid-head-oid"))?;
            return match (target, name) {
                (None, "HEAD") => Ok(HeadFact::Detached { commit }),
                (Some(target), name) if target.as_str() == name => Ok(HeadFact::Attached { target, commit }),
                _ => Err(failure("head-changed-during-read")),
            };
        }
        // Not born: a symbolic HEAD whose target is not listed is unborn.
        if let Some(target) = target {
            let page = self.list_refs(
                repo,
                &[RefPrefix::parse(target.as_str()).map_err(|_| failure("invalid-head-target"))?],
                None,
                100_000,
            )?;
            if !page.entries.iter().any(|e| e.name == target) && page.complete {
                return Ok(HeadFact::Unborn { target });
            }
        }
        Err(out.error(layout_cause(&repo.layout, "head-object-unavailable")))
    }
    fn list_tree(
        &self,
        repo: &RepoHandle,
        revision: &Oid,
        prefix: &[u8],
        cursor: Option<TreeCursor>,
        max_entries: usize,
    ) -> Result<TreePage> {
        Oid::parse(revision.as_str(), repo.object_format())
            .map_err(|_| failure("object-format-mismatch"))?;
        if prefix.contains(&0) || prefix.len() > 4096 || max_entries == 0 || max_entries > 100_000 {
            return Err(failure("invalid-tree-bounds"));
        }
        if cursor
            .as_ref()
            .is_some_and(|c| c.revision != *revision || c.prefix != prefix)
        {
            return Err(failure("tree-cursor-query-mismatch"));
        }
        let kind = self.checked(
            repo,
            &["cat-file", "-t", revision.as_str()],
            Policy::Inspect,
        )?;
        if kind != b"commit\n" && kind != b"tree\n" {
            return Err(failure("revision-not-commit-or-tree"));
        }
        // Resolve the literal containing directory with NUL-framed byte input.
        // Git emits only that subtree, rather than the whole project each page.
        let directory = prefix
            .iter()
            .rposition(|b| *b == b'/')
            .map(|i| &prefix[..i + 1])
            .unwrap_or(b"");
        let mut tree_revision = revision.clone();
        if !directory.is_empty() {
            let mut input = revision.as_str().as_bytes().to_vec();
            input.push(b':');
            input.extend_from_slice(&directory[..directory.len() - 1]);
            input.push(0);
            let output = self.inspect_input(repo, &["cat-file", "--batch-check", "-Z"], &input)?;
            if output.ends_with(b" missing\0") {
                if let Some(cause) = object_gap_cause(&repo.layout) {
                    return Err(failure(cause));
                }
                return Ok(TreePage {
                    entries: vec![],
                    complete: true,
                    next_cursor: None,
                });
            }
            let fields: Vec<_> = output.split(|b| *b == b' ' || *b == 0).collect();
            if fields.get(1) != Some(&b"tree".as_slice()) {
                return Err(failure("prefix-parent-not-tree"));
            }
            tree_revision = Oid::parse(
                std::str::from_utf8(fields[0]).map_err(|_| failure("invalid-tree-oid"))?,
                repo.object_format(),
            )
            .map_err(|_| failure("invalid-tree-oid"))?;
        }
        let bytes = self.checked(
            repo,
            &[
                "ls-tree",
                "-r",
                "-t",
                "-z",
                "--full-tree",
                tree_revision.as_str(),
            ],
            Policy::Inspect,
        )?;
        let mut entries = Vec::new();
        for record in bytes.split(|b| *b == 0).filter(|r| !r.is_empty()) {
            let tab = record
                .iter()
                .position(|b| *b == b'\t')
                .ok_or_else(|| failure("invalid-tree-entry"))?;
            let full_path = [directory, &record[tab + 1..]].concat();
            let path = full_path.as_slice();
            if !path.starts_with(prefix)
                || cursor.as_ref().is_some_and(|c| path <= c.after.as_slice())
            {
                continue;
            }
            let fields: Vec<_> = record[..tab].split(|b| *b == b' ').collect();
            if fields.len() != 3 {
                return Err(failure("invalid-tree-entry"));
            }
            let mode = std::str::from_utf8(fields[0])
                .ok()
                .and_then(|m| u32::from_str_radix(m, 8).ok())
                .ok_or_else(|| failure("invalid-tree-mode"))?;
            let kind = match fields[1] {
                b"blob" => ObjectType::Blob,
                b"tree" => ObjectType::Tree,
                b"commit" => ObjectType::Commit,
                _ => return Err(failure("invalid-tree-type")),
            };
            let oid = Oid::parse(
                std::str::from_utf8(fields[2]).map_err(|_| failure("invalid-tree-oid"))?,
                repo.object_format(),
            )
            .map_err(|_| failure("invalid-tree-oid"))?;
            entries.push(ListedTreeEntry {
                path: path.to_vec(),
                mode,
                kind,
                oid,
            });
        }
        entries.sort_by(|a, b| a.path.cmp(&b.path));
        let complete = entries.len() <= max_entries;
        entries.truncate(max_entries);
        let next_cursor = if complete {
            None
        } else {
            Some(TreeCursor {
                revision: revision.clone(),
                prefix: prefix.to_vec(),
                after: entries.last().unwrap().path.clone(),
            })
        };
        Ok(TreePage {
            entries,
            complete,
            next_cursor,
        })
    }

    fn list_refs(
        &self,
        repo: &RepoHandle,
        prefixes: &[RefPrefix],
        cursor: Option<RefCursor>,
        max_entries: usize,
    ) -> Result<RefPage> {
        if prefixes.is_empty() || prefixes.len() > 256 || max_entries == 0 || max_entries > 100_000
        {
            return Err(failure("invalid-ref-bounds"));
        }
        let binding: Vec<String> = prefixes.iter().map(|p| p.as_str().to_owned()).collect();
        if cursor.as_ref().is_some_and(|c| c.binding != binding) {
            return Err(failure("ref-cursor-query-mismatch"));
        }
        // for-each-ref matches a pattern literally only up to a slash, so a
        // prefix that is not a directory needs the two wildcard forms to select
        // every ref that starts with those bytes. The filter below stays exact.
        let mut args = vec![
            "for-each-ref".to_owned(),
            "--sort=refname".to_owned(),
            "--format=%(refname)%00%(objectname)%00%(symref)".to_owned(),
        ];
        for prefix in &binding {
            if prefix.ends_with('/') {
                args.push(prefix.clone());
            } else {
                args.push(format!("{prefix}*"));
                args.push(format!("{prefix}*/**"));
            }
        }
        let args: Vec<&str> = args.iter().map(String::as_str).collect();
        let bytes = self.checked(repo, &args, Policy::Inspect)?;
        let mut entries = Vec::new();
        let mut more = false;
        for line in bytes.split(|b| *b == b'\n').filter(|l| !l.is_empty()) {
            let fields: Vec<_> = line.split(|b| *b == 0).collect();
            if fields.len() != 3 {
                return Err(failure("invalid-ref-observation"));
            }
            let name = std::str::from_utf8(fields[0]).map_err(|_| failure("non-utf8-ref-name"))?;
            if !binding.iter().any(|p| name.starts_with(p))
                || cursor.as_ref().is_some_and(|c| name <= c.after.as_str())
            {
                continue;
            }
            if name.starts_with("refs/fgos/git-operations/")
                && !binding
                    .iter()
                    .any(|p| p.starts_with("refs/fgos/git-operations"))
            {
                continue;
            }
            if entries.len() == max_entries {
                more = true;
                break;
            }
            let value = if fields[2].is_empty() {
                RefValue::Direct(
                    Oid::parse(
                        std::str::from_utf8(fields[1]).map_err(|_| failure("invalid-ref-oid"))?,
                        repo.object_format(),
                    )
                    .map_err(|_| failure("invalid-ref-oid"))?,
                )
            } else {
                RefValue::Symbolic(
                    RefName::parse(
                        std::str::from_utf8(fields[2])
                            .map_err(|_| failure("invalid-symbolic-target"))?,
                    )
                    .map_err(|_| failure("invalid-symbolic-target"))?,
                )
            };
            entries.push(RefEntry {
                name: RefName::parse(name).map_err(|_| failure("invalid-ref-name"))?,
                value,
            });
        }
        let next_cursor = if more {
            Some(RefCursor {
                binding,
                after: entries.last().unwrap().name.as_str().into(),
            })
        } else {
            None
        };
        Ok(RefPage {
            entries,
            complete: !more,
            next_cursor,
        })
    }
    fn read_paths_at(
        &self,
        repo: &RepoHandle,
        revision: &Oid,
        paths: &[Vec<u8>],
        max_blob_bytes: usize,
    ) -> Result<Vec<PathRead>> {
        Oid::parse(revision.as_str(), repo.object_format())
            .map_err(|_| failure("object-format-mismatch"))?;
        if paths.len() > 4096 || max_blob_bytes == 0 || max_blob_bytes > 32 * 1024 * 1024 {
            return Err(failure("invalid-path-read-bounds"));
        }
        // Validate the root separately so a missing root never becomes absent paths.
        let kind = self.checked(
            repo,
            &["cat-file", "-t", revision.as_str()],
            Policy::Inspect,
        )?;
        if kind != b"commit\n" && kind != b"tree\n" {
            return Err(failure("revision-not-commit-or-tree"));
        }
        let mut input = Vec::new();
        for path in paths {
            if path.is_empty()
                || path.len() > 4096
                || path.contains(&0)
                || path.starts_with(b"/")
                || path
                    .split(|b| *b == b'/')
                    .any(|p| p == b".." || p == b"." || p.is_empty())
            {
                return Err(failure("invalid-literal-path"));
            }
            input.extend_from_slice(revision.as_str().as_bytes());
            input.push(b':');
            input.extend_from_slice(path);
            input.push(0);
        }
        self.require_floor()?;
        self.preflight(repo)?;
        let out = self.invoke_input(
            Some(repo),
            &repo.trusted_main_root,
            &["cat-file", "--batch", "-Z"],
            Policy::Inspect,
            None,
            true,
            PATH_LIMIT,
            Duration::from_secs(30),
            &input,
        )?;
        if !out.success {
            return Err(out.error(layout_cause(&repo.layout, "path-read-failed")));
        }
        let mut rest = out.stdout.as_slice();
        let mut result = Vec::new();
        for path in paths {
            let end = rest
                .iter()
                .position(|b| *b == 0)
                .ok_or_else(|| failure("invalid-path-header"))?;
            let header = &rest[..end];
            rest = &rest[end + 1..];
            let value = if header.ends_with(b" missing") {
                object_gap_cause(&repo.layout).map_or(PathValue::Absent, |cause| PathValue::Error(failure(cause)))
            } else {
                let fields: Vec<_> = header.split(|b| *b == b' ').collect();
                if fields.len() != 3 {
                    return Err(failure("invalid-path-header"));
                }
                Oid::parse(
                    std::str::from_utf8(fields[0]).map_err(|_| failure("invalid-object-oid"))?,
                    repo.object_format(),
                )
                .map_err(|_| failure("invalid-object-oid"))?;
                let kind = match fields[1] {
                    b"blob" => ObjectType::Blob,
                    b"tree" => ObjectType::Tree,
                    b"commit" => ObjectType::Commit,
                    b"tag" => ObjectType::Tag,
                    _ => return Err(failure("invalid-object-type")),
                };
                let size = std::str::from_utf8(fields[2])
                    .ok()
                    .and_then(|s| s.parse::<usize>().ok())
                    .ok_or_else(|| failure("invalid-object-size"))?;
                if size >= rest.len() || rest[size] != 0 {
                    return Err(failure("invalid-object-size"));
                }
                let value = if kind != ObjectType::Blob {
                    PathValue::NotABlob(kind)
                } else if size > max_blob_bytes {
                    PathValue::Error(failure("blob-too-large"))
                } else {
                    PathValue::Blob(rest[..size].to_vec())
                };
                rest = &rest[size + 1..];
                value
            };
            result.push(PathRead {
                path: path.clone(),
                value,
            });
        }
        if !rest.is_empty() {
            return Err(failure("unexpected-path-output"));
        }
        Ok(result)
    }

    fn configured_fetch_refspecs(
        &self,
        repo: &RepoHandle,
        remote: &str,
    ) -> Result<Vec<ConfigFact>> {
        config_facts(self, repo, &format!("remote.{remote}.fetch"))
    }
    fn push_refspecs(&self, repo: &RepoHandle, remote: &str) -> Result<Vec<ConfigFact>> {
        config_facts(self, repo, &format!("remote.{remote}.push"))
    }
    fn remote_url(&self, repo: &RepoHandle, remote: &str) -> Result<String> {
        let out = self.checked(repo, &["remote", "get-url", "--", remote], Policy::Inspect)?;
        Ok(line(&redact(&out))?.into())
    }
    fn machine_id(&self, repo: &RepoHandle) -> Result<Option<ConfigFact>> {
        Ok(config_facts(self, repo, "fgos.machineid")?.pop())
    }
    fn git_floor_verdict(&self) -> Result<GitFloorVerdict> {
        GitDriver::git_floor_verdict(self).cloned()
    }
    fn fetch_mapping_provenance(
        &self,
        _repo: &RepoHandle,
        _remote: &str,
    ) -> Result<Option<FetchMappingProvenance>> {
        let wal = match crate::wal::Wal::open_existing(_repo.common_dir(), crate::wal::OsFileSystem)
        {
            Ok(wal) => wal,
            Err(crate::wal::WalError::Io(e)) if e.kind() == std::io::ErrorKind::NotFound => {
                return Ok(None)
            }
            Err(e) => return Err(failure(format!("git-wal-unreadable: {e}"))),
        };
        let scan = wal.scan(100_000)?;
        if !scan.complete || scan.entries.iter().any(|e| e.error.is_some()) {
            return Err(failure("git-wal-unreadable"));
        }
        let mut facts = Vec::new();
        for entry in scan.entries {
            if wal.compacted(&entry.operation_id)?.is_some() {
                continue;
            }
            let chain = wal.inspect(&entry.operation_id)?;
            if matches!(
                chain.outcome(),
                Some(crate::wal::Outcome::ConfigApproved)
                    | Some(crate::wal::Outcome::Transfer {
                        acknowledged: true,
                        unknown: false,
                        ..
                    })
            ) {
                if let crate::wal::OperationKind::ConfigChange(change) = &chain.intent().kind {
                    let crate::wal::ConfigChange {
                        remote,
                        url,
                        refspecs,
                        ..
                    } = change.as_ref();
                    if remote == _remote {
                        facts.push((
                            chain.config_sequence(),
                            FetchMappingProvenance {
                                operation_id: entry.operation_id,
                                remote_url: url.clone(),
                                refspecs: refspecs.clone(),
                            },
                        ));
                    }
                }
            }
        }
        facts.sort_by_key(|(sequence, _)| *sequence);
        if facts.len() > 1 && facts[facts.len() - 1].0 == facts[facts.len() - 2].0 {
            return Err(failure("fetch-provenance-order-unknown"));
        }
        Ok(facts.pop().map(|(_, fact)| fact))
    }

    fn resolve_repo(&self, path: &Path) -> Result<ResolveRepo> {
        GitDriver::resolve_repo(self, path, path)
    }
}
pub(crate) fn config_facts(driver: &GitDriver, repo: &RepoHandle, key: &str) -> Result<Vec<ConfigFact>> {
    driver
        .config(repo)?
        .into_iter()
        // The driver's trusted -c hooksPath suppresses hooks for safe plumbing;
        // it is not a configured user value or an installation slot.
        .filter(|(origin, k, _)| {
            k == &key.to_ascii_lowercase()
                && (key != "core.hookspath" || origin.starts_with(b"file:"))
        })
        .map(|(origin, _, value)| {
            Ok(ConfigFact {
                value,
                origin: PathBuf::from(
                    line(&origin)?
                        .strip_prefix("file:")
                        .unwrap_or(line(&origin)?),
                ),
            })
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::process::Command;
    struct Temp(PathBuf);
    impl Temp {
        fn new() -> Self {
            let p = std::env::temp_dir().join(format!(
                "fgos-git-driver-{}-{}",
                std::process::id(),
                SERIAL.fetch_add(1, Ordering::Relaxed)
            ));
            fs::create_dir(&p).unwrap();
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                fs::set_permissions(&p, fs::Permissions::from_mode(0o700)).unwrap();
            }
            Self(p)
        }
    }
    impl Drop for Temp {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }
    #[test]
    fn floor_record_is_reused_only_for_the_same_key_and_consistent_verdict() {
        let t = Temp::new();
        let driver = GitDriver::new(&t.0).unwrap();
        let key = driver.floor_key().expect("floor key");
        let verdict = GitFloorVerdict {
            version: "2.53.0".into(),
            minimum: "2.53.0".into(),
            supported: true,
            probes: ["hook-suppression", "no-lazy-fetch", "update-ref-no-deref", "hook-run"].into_iter().map(|name| FloorProbe { name: name.into(), passed: true, evidence: "e".into() }).collect(),
        };
        let path = t.0.join(FLOOR_RECORD);
        fs::write(&path, floor_record(&key, &verdict).to_string()).unwrap();
        let read = read_floor_record(&path, &key).expect("same key reuses the record");
        assert!(read.supported && read.probes.len() == 4 && read.version == "2.53.0");
        // Any change in what the probes depend on is a different key.
        let mut other = key.clone();
        other["binary"] = serde_json::json!(["changed"]);
        assert!(read_floor_record(&path, &other).is_none());
        // A record whose verdict disagrees with its own probes is ignored.
        let mut lying = floor_record(&key, &verdict);
        lying["probes"][0]["passed"] = serde_json::json!(false);
        fs::write(&path, lying.to_string()).unwrap();
        assert!(read_floor_record(&path, &key).is_none());
        // Passing an incomplete or different probe set cannot certify the floor.
        for name in ["different-probe", "hook-suppression"] {
            let mut incomplete = floor_record(&key, &verdict);
            incomplete["probes"] = serde_json::json!([{"name": name, "passed": true, "evidence": "e"}]);
            fs::write(&path, incomplete.to_string()).unwrap();
            assert!(read_floor_record(&path, &key).is_none());
        }
        // A symlink is never followed.
        fs::remove_file(&path).unwrap();
        fs::write(t.0.join("elsewhere"), floor_record(&key, &verdict).to_string()).unwrap();
        #[cfg(unix)]
        {
            std::os::unix::fs::symlink(t.0.join("elsewhere"), &path).unwrap();
            assert!(read_floor_record(&path, &key).is_none());
        }
    }
    #[test]
    fn floor_key_names_the_git_binary_and_config_identities() {
        let t = Temp::new();
        let driver = GitDriver::new(&t.0).unwrap();
        let key = driver.floor_key().expect("floor key");
        assert_eq!(key["git"], serde_json::json!(driver.git));
        assert_eq!(key["hostVersion"], env!("CARGO_PKG_VERSION"));
        assert!(key["probeCode"].as_str().is_some_and(|s| s.len() == 64));
        assert_eq!(key["path"], std::env::var("PATH").unwrap());
        assert!(key["binary"][0].is_string(), "the binary identity is recorded");
        assert!(key["configs"].as_array().unwrap().iter().any(|c| c[0] == serde_json::json!("/etc/gitconfig")));
    }
    #[test]
    fn include_directives_disable_persistent_floor_reuse_even_when_inactive() {
        let t = Temp::new();
        git(&t.0, &["init", "--quiet"]);
        git(&t.0, &["config", "includeIf.gitdir:/never-a-probe/.path", "missing-include"]);
        let driver = GitDriver::new(&t.0).unwrap();
        assert!(driver.floor_key().is_none());
    }
    fn git(dir: &Path, args: &[&str]) -> Vec<u8> {
        let out = Command::new("git")
            .current_dir(dir)
            .args(args)
            .output()
            .unwrap();
        assert!(
            out.status.success(),
            "{:?}: {}",
            args,
            String::from_utf8_lossy(&out.stderr)
        );
        out.stdout
    }
    fn resolve(driver: &GitDriver, path: &Path) -> RepoHandle {
        match driver.resolve_repo(path, path).unwrap() {
            ResolveRepo::Repository(r) => r,
            _ => panic!("not repo"),
        }
    }
    /// Points the driver at a Git that logs each argument list, so a test can count the
    /// config listings and format reads a call really spawned.
    fn log_git_children(driver: &mut GitDriver, dir: &Path) -> PathBuf {
        let log = dir.join("children.log");
        let script = dir.join("logging-git");
        fs::write(&script, format!("#!/bin/sh\necho \"$*\" >> '{}'\nexec '{}' \"$@\"\n", log.display(), driver.git.display())).unwrap();
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(&script, fs::Permissions::from_mode(0o700)).unwrap();
        }
        driver.git = script;
        log
    }
    /// (config listings, format reads) spawned so far.
    fn fact_reads(log: &Path) -> (usize, usize) {
        let text = fs::read_to_string(log).unwrap_or_default();
        (text.lines().filter(|l| l.contains("--show-origin")).count(),
         text.lines().filter(|l| l.contains("--show-object-format")).count())
    }

    #[test]
    fn checkout_stamp_rechecks_external_config_writes_between_children() {
        let state = Temp::new();
        let dir = Temp::new();
        let logs = Temp::new();
        git(&dir.0, &["init", "-q"]);
        let mut driver = GitDriver::new(&state.0).unwrap();
        // The floor probe lists config itself; settle it before counting.
        driver.require_floor().unwrap();
        let log = log_git_children(&mut driver, &logs.0);
        let repo = resolve(&driver, &dir.0);
        let proven = fact_reads(&log);
        assert_eq!(proven, (1, 1), "the first handle reads its config and formats once");
        let operation = driver.checkout_repository(&repo).unwrap();
        assert_eq!(fact_reads(&log), proven, "a checkout handle answers from the facts the stamp still proves");
        driver.checked(&operation, &["rev-parse", "--git-dir"], Policy::Inspect).unwrap();
        // An independent writer, outside cooperative checkout exclusion.
        let root = dir.0.clone();
        std::thread::spawn(move || git(&root, &["config", "filter.external.clean", "touch /unreachable"]))
            .join().unwrap();
        let error = driver.checked(&operation, &["rev-parse", "--git-dir"], Policy::Inspect).unwrap_err();
        assert!(error.cause.contains("repository-config-untrusted: filter.external.clean"));
        // A new checkout handle sees the write too: the held stamp no longer matches.
        let error = driver.checkout_repository(&repo).unwrap_err();
        assert!(error.cause.contains("repository-config-untrusted: filter.external.clean"), "{}", error.cause);
        git(&dir.0, &["config", "--unset", "filter.external.clean"]);
        assert_eq!(driver.preflight(&operation).unwrap_err().cause, "checkout-facts-invalidated");
        let next = driver.checkout_repository(&repo).unwrap();
        driver.checked(&next, &["rev-parse", "--git-dir"], Policy::Inspect).unwrap();
        let reread = fact_reads(&log);
        assert!(reread.0 > proven.0 && reread.1 > proven.1, "a moved stamp re-reads config and formats");
        let again = driver.checkout_repository(&repo).unwrap();
        driver.checked(&again, &["rev-parse", "--git-dir"], Policy::Inspect).unwrap();
        assert_eq!(fact_reads(&log), reread, "the re-read facts stand for the next handle");
    }

    // The config cache is shared by every driver in a process; a new driver must still see a
    // config written after another driver cached it, and keep its formats while nothing changed.
    #[test]
    fn a_shared_config_cache_never_hides_a_later_config_write_from_a_new_driver() {
        let state = Temp::new();
        let dir = Temp::new();
        git(&dir.0, &["init", "-q", "--object-format=sha256"]);
        let first = GitDriver::new(&state.0).unwrap();
        assert_eq!(resolve(&first, &dir.0).object_format(), ObjectFormat::Sha256);
        let cached = GitDriver::new(&state.0).unwrap();
        assert_eq!(resolve(&cached, &dir.0).object_format(), ObjectFormat::Sha256, "formats reused while the stamp holds");
        git(&dir.0, &["config", "filter.external.clean", "touch /unreachable"]);
        let error = match GitDriver::new(&state.0).unwrap().resolve_repo(&dir.0, &dir.0) {
            Err(error) => error,
            Ok(_) => panic!("a config written after the cache filled was not seen"),
        };
        assert!(error.cause.contains("repository-config-untrusted: filter.external.clean"), "{}", error.cause);
        git(&dir.0, &["config", "--unset", "filter.external.clean"]);
        assert_eq!(resolve(&GitDriver::new(&state.0).unwrap(), &dir.0).object_format(), ObjectFormat::Sha256);
    }

    #[test]
    fn read_only_hash_object_does_not_install_bytes() {
        for format in ["sha1", "sha256"] {
            let state = Temp::new();
            let dir = Temp::new();
            git(&dir.0, &["init", "-q", &format!("--object-format={format}")]);
            let driver = GitDriver::new(&state.0).unwrap();
            let repo = resolve(&driver, &dir.0);
            let oid = driver.hash_object(&repo, ObjectType::Blob, b"unpublished bytes\0").unwrap();
            assert!(!repo.common_dir().join("objects").join(&oid.as_str()[..2]).join(&oid.as_str()[2..]).exists());
            assert!(driver.hash_object(&repo, ObjectType::Tag, b"bad").is_err());
        }
    }
    #[test]
    #[cfg(unix)]
    fn publication_borrow_hash_object_binary_round_trip() {
        use fgos_holder_lock::{acquire, release, Acquire, Mode, Resource, Wait};
        let state = Temp::new();
        let dir = Temp::new();
        git(&dir.0, &["init", "-q"]);
        // A real executable hook would fail the operation if hooks were enabled.
        let hook = dir.0.join(".git/hooks/reference-transaction");
        fs::write(&hook, b"#!/bin/sh\nexit 91\n").unwrap();
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&hook, fs::Permissions::from_mode(0o700)).unwrap();
        let driver = GitDriver::new(&state.0).unwrap();
        let repo = resolve(&driver, &dir.0);
        let resource = Resource::new("event-seal", state.0.join("seal.lock"));
        let handle = match acquire(&resource, Mode::Ex, Wait::Try, 2000) {
            Acquire::Acquired(h) => h,
            other => panic!("{other:?}"),
        };
        let input: Vec<u8> = (0..=255).cycle().take(256 * 1024).collect();
        let out = driver
            .invoke_input(
                Some(&repo),
                &dir.0,
                &["hash-object", "--stdin", "-w"],
                Policy::Publication,
                Some(&handle),
                true,
                PATH_LIMIT,
                Duration::from_secs(10),
                &input,
            )
            .unwrap();
        assert!(out.success);
        assert!(out.stderr.is_empty());
        let oid = line(&out.stdout).unwrap();
        let read = driver
            .invoke(
                Some(&repo),
                &dir.0,
                &["cat-file", "blob", oid],
                Policy::Publication,
                Some(&handle),
                true,
                PATH_LIMIT,
                Duration::from_secs(10),
            )
            .unwrap();
        assert!(read.success);
        assert_eq!(read.stdout, input);
        // Also exercise a hook-capable borrowed command through the same policy.
        let commit = git(
            &dir.0,
            &[
                "-c",
                "user.name=Test",
                "-c",
                "user.email=t@e",
                "commit-tree",
                "4b825dc642cb6eb9a060e54bf8d69288fbee4904",
                "-m",
                "test",
            ],
        );
        let updated = driver
            .invoke(
                Some(&repo),
                &dir.0,
                &["update-ref", "refs/test/borrow", line(&commit).unwrap()],
                Policy::Publication,
                Some(&handle),
                true,
                PATH_LIMIT,
                Duration::from_secs(10),
            )
            .unwrap();
        assert!(updated.success, "{:?}", updated.stderr);
        let control = Command::new("git")
            .current_dir(&dir.0)
            .args(["update-ref", "refs/test/control", line(&commit).unwrap()])
            .output()
            .unwrap();
        assert!(
            !control.status.success(),
            "the installed hook must reject the control"
        );
        assert!(matches!(release(handle), fgos_holder_lock::Release::Released { .. }));
    }
    #[test]
    fn floor_and_all_repository_backends() {
        let state = Temp::new();
        let driver = GitDriver::new(&state.0).unwrap();
        let floor = driver.git_floor_verdict().unwrap();
        assert!(floor.supported, "{floor:?}");
        assert_eq!(floor.probes.len(), 4);
        for refs in ["files", "reftable"] {
            for format in ["sha1", "sha256"] {
                let repo = Temp::new();
                git(
                    &repo.0,
                    &[
                        "init",
                        "--quiet",
                        &format!("--ref-format={refs}"),
                        &format!("--object-format={format}"),
                    ],
                );
                let r = resolve(&driver, &repo.0);
                assert_eq!(
                    r.object_format(),
                    if format == "sha1" {
                        ObjectFormat::Sha1
                    } else {
                        ObjectFormat::Sha256
                    }
                );
                assert_eq!(
                    r.layout.refs,
                    if refs == "files" {
                        RefStorage::Files
                    } else {
                        RefStorage::Reftable
                    }
                );
                assert!(!r.layout.shallow && !r.layout.alternates && !r.layout.promisor);
                assert_eq!(
                    r.common_dir(),
                    fs::canonicalize(repo.0.join(".git")).unwrap()
                );
            }
        }
        let outside = Temp::new();
        assert!(matches!(
            driver.resolve_repo(&outside.0, &outside.0).unwrap(),
            ResolveRepo::NotARepository
        ));
    }
    #[test]
    fn config_preflight_reloads_and_names_every_command_key() {
        let state = Temp::new();
        let dir = Temp::new();
        git(&dir.0, &["init", "-q"]);
        let driver = GitDriver::new(&state.0).unwrap();
        let repo = resolve(&driver, &dir.0);
        for key in [
            "filter.x.clean",
            "filter.x.smudge",
            "filter.x.process",
            "diff.external",
            "diff.x.textconv",
            "merge.x.driver",
            "gpg.program",
            "include.path",
            "includeIf.gitdir:x.path",
            "credential.helper",
            "url.x.insteadOf",
            "url.x.pushInsteadOf",
            "remote.x.uploadpack",
            "remote.x.receivepack",
            "core.sshCommand",
        ] {
            git(&dir.0, &["config", key, "/nonexistent/command"]);
            let err = driver
                .checked(&repo, &["status", "--porcelain=v1", "-z"], Policy::Inspect)
                .unwrap_err();
            assert!(
                err.cause.starts_with("repository-config-untrusted:"),
                "{key}: {err:?}"
            );
            git(&dir.0, &["config", "--unset", key]);
        }
        assert!(driver
            .checked(&repo, &["status", "--porcelain=v1", "-z"], Policy::Inspect)
            .unwrap()
            .is_empty());
    }
    #[test]
    fn layouts_preserve_missing_object_diagnostics_without_fetch() {
        let state = Temp::new();
        let dir = Temp::new();
        git(&dir.0, &["init", "-q"]);
        let driver = GitDriver::new(&state.0).unwrap();
        git(&dir.0, &["config", "remote.origin.promisor", "true"]);
        git(
            &dir.0,
            &["config", "remote.origin.url", "/definitely/not/a/remote"],
        );
        let repo = resolve(&driver, &dir.0);
        assert!(repo.layout.promisor);
        let err = driver
            .checked(
                &repo,
                &["cat-file", "-t", "1234567890123456789012345678901234567890"],
                Policy::Inspect,
            )
            .unwrap_err();
        assert_eq!(err.cause, "promisor-object-unavailable");
        assert!(!err.stderr.is_empty());
        git(&dir.0, &["config", "--unset", "remote.origin.promisor"]);
        fs::write(
            dir.0.join(".git/objects/info/alternates"),
            b"/missing/alternate\n",
        )
        .unwrap();
        let repo = resolve(&driver, &dir.0);
        assert!(repo.layout.alternates);
        let err = driver
            .checked(
                &repo,
                &["cat-file", "-t", "1234567890123456789012345678901234567890"],
                Policy::Inspect,
            )
            .unwrap_err();
        assert_eq!(err.cause, "alternate-object-unavailable");
        assert!(!err.stderr.is_empty());
        fs::remove_file(dir.0.join(".git/objects/info/alternates")).unwrap();
        fs::write(
            dir.0.join(".git/shallow"),
            b"1234567890123456789012345678901234567890\n",
        )
        .unwrap();
        let repo = resolve(&driver, &dir.0);
        assert!(repo.layout.shallow);
    }
    #[test]
    fn a_failed_read_names_the_layout_cause_whichever_read_hits_it() {
        // `layouts_preserve_missing_object_diagnostics_without_fetch` checks the cause of one read.
        // The reads that turn a failed Git child into a cause each carry their own copy of the
        // promisor, alternates and shallow ladder; each read must name the layout's cause.
        let bogus = "1234567890123456789012345678901234567890";
        let state = Temp::new();
        let dir = Temp::new();
        git(&dir.0, &["init", "-q"]);
        fs::write(dir.0.join(".git/shallow"), format!("{bogus}\n")).unwrap();
        let driver = GitDriver::new(&state.0).unwrap();

        let causes = |repo: &RepoHandle| -> Vec<(&'static str, String)> {
            let mut causes = Vec::new();
            let mut note = |read: &'static str, e: OperationError| causes.push((read, e.cause));
            note(
                "checked",
                driver
                    .checked(repo, &["rev-list", bogus], Policy::Inspect)
                    .unwrap_err(),
            );
            note(
                "inspect_input",
                driver
                    .inspect_input(repo, &["rev-list", "--stdin"], bogus.as_bytes())
                    .unwrap_err(),
            );
            note("resolve_head", driver.resolve_head(repo).unwrap_err());
            causes
        };
        let expect = |causes: Vec<(&'static str, String)>, cause: &str| {
            let want: Vec<_> = ["checked", "inspect_input", "resolve_head"]
                .map(|read| (read, cause.to_owned()))
                .into();
            assert_eq!(causes, want);
        };

        // A shallow boundary only.
        fs::write(dir.0.join(".git/HEAD"), format!("{bogus}\n")).unwrap();
        expect(causes(&resolve(&driver, &dir.0)), "shallow-history-incomplete");
        // Alternates as well as the shallow boundary: alternates name the cause.
        fs::write(
            dir.0.join(".git/objects/info/alternates"),
            b"/missing/alternate\n",
        )
        .unwrap();
        expect(causes(&resolve(&driver, &dir.0)), "alternate-object-unavailable");
    }
    #[test]
    fn a_missing_tree_or_path_is_an_alternates_error_and_stays_absent_when_only_shallow() {
        // The tree and path reads answer a missing object themselves: with alternates the object
        // may live elsewhere, so absence is an error; a shallow boundary alone cuts history, not
        // trees, so absence stays absence.
        let state = Temp::new();
        let dir = Temp::new();
        git(&dir.0, &["init", "-q"]);
        git(
            &dir.0,
            &["-c", "user.name=Test", "-c", "user.email=t@e", "commit", "--allow-empty", "-qm", "initial"],
        );
        let head = String::from_utf8(git(&dir.0, &["rev-parse", "HEAD"])).unwrap();
        let driver = GitDriver::new(&state.0).unwrap();
        let reads = |repo: &RepoHandle| {
            let head = Oid::parse(head.trim(), repo.object_format()).unwrap();
            (
                driver.list_tree(repo, &head, b"nope/x", None, 10),
                driver.read_paths_at(repo, &head, &[b"nope/x".to_vec()], 1024),
            )
        };

        fs::write(dir.0.join(".git/shallow"), head.as_bytes()).unwrap();
        let (tree, paths) = reads(&resolve(&driver, &dir.0));
        assert!(tree.unwrap().entries.is_empty());
        assert!(matches!(paths.unwrap()[0].value, PathValue::Absent));

        fs::write(
            dir.0.join(".git/objects/info/alternates"),
            b"/missing/alternate\n",
        )
        .unwrap();
        let (tree, paths) = reads(&resolve(&driver, &dir.0));
        assert_eq!(tree.unwrap_err().cause, "alternate-object-unavailable");
        match &paths.unwrap()[0].value {
            PathValue::Error(e) => assert_eq!(e.cause, "alternate-object-unavailable"),
            other => panic!("{other:?}"),
        }
    }
    #[test]
    fn linked_registration_and_fake_gitdir() {
        let state = Temp::new();
        let dir = Temp::new();
        let linked = Temp::new();
        git(&dir.0, &["init", "-q"]);
        git(
            &dir.0,
            &[
                "-c",
                "user.name=Test",
                "-c",
                "user.email=t@e",
                "commit",
                "--allow-empty",
                "-qm",
                "initial",
            ],
        );
        git(
            &dir.0,
            &["worktree", "add", "--detach", linked.0.to_str().unwrap()],
        );
        let driver = GitDriver::new(&state.0).unwrap();
        fs::write(linked.0.join(".git"), b"gitdir: /untrusted\n").unwrap();
        let repo = match driver.resolve_repo(&linked.0, &dir.0).unwrap() {
            ResolveRepo::Repository(r) => r,
            _ => panic!(),
        };
        assert_eq!(
            repo.common_dir(),
            fs::canonicalize(dir.0.join(".git")).unwrap()
        );
        let alien = Temp::new();
        assert_eq!(
            driver.resolve_repo(&alien.0, &dir.0).unwrap_err().cause,
            "untrusted-worktree"
        );
        // The worker gitfile was poisoned above: inferred discovery refuses it.
        assert!(driver.resolve_repo(&linked.0, &linked.0).is_err());
    }
    #[test]
    fn output_ceiling_and_borrow_gate() {
        let state = Temp::new();
        let dir = Temp::new();
        git(&dir.0, &["init", "-q"]);
        let driver = GitDriver::new(&state.0).unwrap();
        let repo = resolve(&driver, &dir.0);
        fs::write(dir.0.join("file"), vec![b'x'; 10000]).unwrap();
        let oid = git(&dir.0, &["hash-object", "-w", "file"]);
        let err = driver
            .invoke(
                Some(&repo),
                &dir.0,
                &["cat-file", "blob", line(&oid).unwrap()],
                Policy::Inspect,
                None,
                true,
                100,
                Duration::from_secs(10),
            )
            .err()
            .unwrap();
        assert_eq!(err.cause, "git-output-limit");
        let err = driver
            .invoke(
                Some(&repo),
                &dir.0,
                &["hash-object", "-w", "file"],
                Policy::Publication,
                None,
                true,
                100,
                Duration::from_secs(10),
            )
            .err()
            .unwrap();
        assert_eq!(err.cause, "publication-borrow-required");
        fs::write(dir.0.join("large"), vec![b'x'; 16 * 1024 * 1024]).unwrap();
        let err = driver
            .invoke(
                Some(&repo),
                &dir.0,
                &["hash-object", "large"],
                Policy::Inspect,
                None,
                true,
                100,
                Duration::ZERO,
            )
            .err()
            .unwrap();
        assert_eq!(err.cause, "git-timeout");
        assert_eq!(err.detail.unwrap()["path"], "contained");
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(&driver.hooks, fs::Permissions::from_mode(0o700)).unwrap();
        }
        fs::write(driver.hooks.join("injected"), b"x").unwrap();
        let cause = driver.checked(&repo, &["status", "-z"], Policy::Inspect).unwrap_err().cause;
        assert!(cause.starts_with("trusted-hooks-not-empty"));
        assert!(cause.contains(&driver.hooks.display().to_string()));
        assert!(cause.contains("remove foreign files"));
        assert!(cause.contains("fgos doctor --fix"));
    }
    #[test]
    fn scrubbed_environment_cannot_supply_git_authority() {
        let state = Temp::new();
        let driver = GitDriver::new(&state.0).unwrap();
        let out = Command::new(std::env::current_exe().unwrap())
            .args(["--exact", "driver::tests::scrubbed_environment_child"])
            .env("GIT_DIR", "/worker/repository")
            .env("GIT_ALTERNATE_OBJECT_DIRECTORIES", "/worker/objects")
            .env("GIT_REPLACE_REF_BASE", "refs/worker/")
            .env("GIT_CONFIG_COUNT", "1")
            .env("GIT_CONFIG_KEY_0", "core.sshCommand")
            .env("GIT_CONFIG_VALUE_0", "worker-command")
            .env("FGOS_TEST_STATE", &state.0)
            .output()
            .unwrap();
        assert!(
            out.status.success(),
            "{}",
            String::from_utf8_lossy(&out.stdout)
        );
        assert!(driver.git_floor_verdict().unwrap().supported);
    }
    #[test]
    fn scrubbed_environment_child() {
        if let Some(state) = std::env::var_os("FGOS_TEST_STATE") {
            let driver = GitDriver::new(Path::new(&state)).unwrap();
            assert!(driver.git_floor_verdict().unwrap().supported);
            assert!(Scrubbed::new().0.keys().all(|k| !k.starts_with("GIT_")));
        }
    }
    #[test]
    fn every_policy_passes_the_c_locale_to_real_git_children() {
        let state = Temp::new();
        let repo_dir = Temp::new();
        git(&repo_dir.0, &["init", "-q"]);
        let driver = GitDriver::new(&state.0).unwrap();
        let repo = resolve(&driver, &repo_dir.0);
        let resource = fgos_holder_lock::Resource::new("locale", state.0.join("locale.lock"));
        let handle = match fgos_holder_lock::acquire(
            &resource,
            fgos_holder_lock::Mode::Ex,
            fgos_holder_lock::Wait::Try,
            2000,
        ) {
            fgos_holder_lock::Acquire::Acquired(h) => h,
            other => panic!("{other:?}"),
        };
        for policy in [
            Policy::Inspect,
            Policy::Remote,
            Policy::HookContext,
            Policy::Publication,
        ] {
            let loan = if policy == Policy::Publication {
                Some(&handle as &dyn BorrowedSpawn)
            } else {
                None
            };
            let out = driver
                .invoke(
                    Some(&repo),
                    &repo_dir.0,
                    &[
                        "-c",
                        "alias.locale=!printf '%s/%s' \"$LC_ALL\" \"$LANGUAGE\"",
                        "locale",
                    ],
                    policy,
                    loan,
                    false,
                    1024,
                    Duration::from_secs(5),
                )
                .unwrap();
            assert!(out.success, "{:?}", out.stderr);
            assert_eq!(out.stdout, b"C/");
        }
    }
    #[test]
    fn floor_is_shared_across_concurrent_driver_instances() {
        let first_state = Temp::new();
        let second_state = Temp::new();
        let first = GitDriver::new(&first_state.0).unwrap();
        let second = GitDriver::new(&second_state.0).unwrap();
        let (a, b) = std::thread::scope(|scope| {
            let a = scope.spawn(move || first.git_floor_verdict().unwrap() as *const _ as usize);
            let b = scope.spawn(move || second.git_floor_verdict().unwrap() as *const _ as usize);
            (a.join().unwrap(), b.join().unwrap())
        });
        assert_eq!(
            a, b,
            "all drivers must share the same process floor verdict"
        );
    }
    #[test]
    fn nul_parsers_and_redaction_preserve_bytes() {
        assert_eq!(
            nul_records(b"a\nb\0\xff \0").unwrap(),
            vec![b"a\nb".as_slice(), b"\xff ".as_slice()]
        );
        assert!(nul_records(b"partial").is_err());
        let config = parse_config(b"file:/a\0filter.x.clean\nfirst\nsecond\0").unwrap();
        assert_eq!(config[0].2, b"first\nsecond");
        assert!(parse_config(b"origin\0").is_err());
        assert_eq!(
            redact(b"fatal: https://user:secret@host/repo?token=secret\n"),
            b"fatal: https://[redacted]@host/repo?[redacted]"
        );
    }
    /// Delegates to the machine's driver but can never empty a domain, as when
    /// a member is stuck in uninterruptible I/O.
    struct UnemptiedDriver {
        inner: Box<dyn ContainmentDriver>,
    }
    impl ContainmentDriver for UnemptiedDriver {
        fn name(&self) -> &'static str {
            self.inner.name()
        }
        fn create(&self, attempt_id: &str) -> std::result::Result<containment::ContainmentDomain, containment::ContainmentError> {
            self.inner.create(attempt_id)
        }
        fn spawn_in(&self, domain: &mut containment::ContainmentDomain, spec: SpawnSpec) -> std::result::Result<containment::Spawned, containment::ContainmentError> {
            self.inner.spawn_in(domain, spec)
        }
        fn is_empty(&self, domain: &mut containment::ContainmentDomain) -> DomainState {
            self.inner.is_empty(domain)
        }
        fn kill_all(&self, domain: &mut containment::ContainmentDomain, _grace_ms: u64) -> KillOutcome {
            // End the real processes so the test leaves nothing behind, but
            // answer as a driver that could not.
            self.inner.kill_all(domain, 0);
            KillOutcome::Refused
        }
        fn guarantee(&self) -> containment::Guarantee {
            self.inner.guarantee()
        }
    }
    #[test]
    #[cfg(unix)]
    fn a_timed_out_contained_call_whose_domain_cannot_be_emptied_returns_containment_unproven_without_waiting() {
        let state = Temp::new();
        let dir = Temp::new();
        git(&dir.0, &["init", "-q"]);
        let mut driver = GitDriver::new(&state.0).unwrap();
        driver.containment = Box::new(UnemptiedDriver { inner: driver.containment });
        let repo = resolve(&driver, &dir.0);
        let start = Instant::now();
        let err = driver
            .invoke(
                Some(&repo),
                &dir.0,
                &["-c", "alias.stall=!sleep 30", "stall"],
                Policy::Inspect,
                None,
                true,
                1000,
                Duration::from_millis(200),
            )
            .err()
            .unwrap();
        assert_eq!(err.cause, "containment-unproven");
        assert!(start.elapsed() < Duration::from_secs(3), "took {:?}", start.elapsed());
    }
    #[test]
    #[cfg(target_os = "linux")]
    fn a_contained_call_whose_root_exited_but_whose_domain_cannot_be_emptied_returns_containment_unproven() {
        let state = Temp::new();
        let dir = Temp::new();
        git(&dir.0, &["init", "-q"]);
        let mut driver = GitDriver::new(&state.0).unwrap();
        // A process-group domain sees the background member the root leaves.
        driver.containment = Box::new(UnemptiedDriver { inner: Box::new(fgos_process::containment::LinuxPgroup::default()) });
        let repo = resolve(&driver, &dir.0);
        let err = driver
            .invoke(
                Some(&repo),
                &dir.0,
                &["-c", "alias.leave=!sleep 30 </dev/null >/dev/null 2>&1 &", "leave"],
                Policy::Inspect,
                None,
                true,
                1000,
                Duration::from_secs(10),
            )
            .err()
            .unwrap();
        assert_eq!(err.cause, "containment-unproven");
    }
    #[test]
    #[cfg(target_os = "linux")]
    fn submodule_filter_escapee_reported_as_containment_unproven_on_best_effort_containment() {
        let state = Temp::new();
        let super_dir = Temp::new();
        let sub_src = Temp::new();

        git(&super_dir.0, &["init", "-q", "-b", "main"]);
        git(&super_dir.0, &["config", "user.name", "Test"]);
        git(&super_dir.0, &["config", "user.email", "test@test.local"]);
        fs::write(super_dir.0.join("README"), "init").unwrap();
        git(&super_dir.0, &["add", "README"]);
        git(&super_dir.0, &["commit", "-q", "-m", "init"]);

        git(&sub_src.0, &["init", "-q", "-b", "main"]);
        git(&sub_src.0, &["config", "user.name", "Test"]);
        git(&sub_src.0, &["config", "user.email", "test@test.local"]);
        fs::write(sub_src.0.join("tracked"), "sub content").unwrap();
        fs::write(sub_src.0.join(".gitattributes"), "tracked filter=x\n").unwrap();
        git(&sub_src.0, &["add", "tracked", ".gitattributes"]);
        git(&sub_src.0, &["commit", "-q", "-m", "sub init"]);

        git(
            &super_dir.0,
            &[
                "-c",
                "protocol.file.allow=always",
                "submodule",
                "add",
                sub_src.0.to_str().unwrap(),
                "sub",
            ],
        );
        git(&super_dir.0, &["commit", "-q", "-m", "add submodule"]);

        let sub_dir = super_dir.0.join("sub");
        let script = sub_dir.join("filter.sh");
        let pid_file = sub_dir.join("survivor.pid");
        fs::write(
            &script,
            format!(
                "#!/bin/sh\n(setsid sh -c 'echo $$ > \"{}\"; exec sleep 5' </dev/null >/dev/null 2>&1 &)\ncat\n",
                pid_file.display()
            ),
        )
        .unwrap();
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(&script, fs::Permissions::from_mode(0o755)).unwrap();
        }
        git(&sub_dir, &["config", "filter.x.clean", script.to_str().unwrap()]);

        let mut driver = GitDriver::new(&state.0).unwrap();
        driver.containment = Box::new(fgos_process::containment::LinuxPgroup::default());
        let repo = resolve(&driver, &super_dir.0);

        let err = driver
            .status(
                &repo,
                crate::inspect::Untracked::All,
                crate::inspect::Submodules::Configured,
                crate::inspect::Ignored::Excluded,
                None,
                100,
            )
            .unwrap_err();
        assert_eq!(err.cause, "containment-unproven");

        if let Ok(pid_text) = fs::read_to_string(&pid_file) {
            if let Ok(pid) = pid_text.trim().parse::<u32>() {
                // SAFETY: terminating background process started by this test.
                unsafe { libc::kill(pid as libc::pid_t, libc::SIGKILL) };
            }
        }

    }
}

#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct CommitCursor {
    binding: String,
    pending: VecDeque<String>,
    visited: BTreeSet<String>,
}

impl GitDriver {
    /// Compute an object identity through Git without installing the object.
    pub fn hash_object(&self, repo: &RepoHandle, kind: ObjectType, bytes: &[u8]) -> Result<Oid> {
        let kind = match kind {
            ObjectType::Blob => "blob",
            ObjectType::Tree => "tree",
            ObjectType::Commit => "commit",
            _ => return Err(failure("unsupported-hash-object-type")),
        };
        let out = self.inspect_input(repo, &["hash-object", "-t", kind, "--stdin"], bytes)?;
        Oid::parse(std::str::from_utf8(&out).map_err(|_| failure("invalid-object-id"))?.trim(), repo.object_format())
            .map_err(|_| failure("invalid-object-id"))
    }
    pub(crate) fn inspect_input(&self, repo: &RepoHandle, args: &[&str], input: &[u8]) -> Result<Vec<u8>> {
        self.require_floor()?;
        self.preflight(repo)?;
        let out = self.invoke_input(
            Some(repo),
            &repo.trusted_main_root,
            args,
            Policy::Inspect,
            None,
            true,
            PATH_LIMIT,
            Duration::from_secs(30),
            input,
        )?;
        if out.success {
            Ok(out.stdout)
        } else {
            Err(out.error(layout_cause(&repo.layout, "git-command-failed")))
        }
    }
    fn commit_batch(
        &self,
        repo: &RepoHandle,
        seeds: &[String],
        stop: &BTreeSet<&str>,
        count: usize,
        byte_budget: usize,
    ) -> Result<BTreeMap<String, Vec<u8>>> {
        let mut revisions = seeds.join("\n");
        revisions.push('\n');
        for oid in stop {
            revisions.push('^');
            revisions.push_str(oid);
            revisions.push('\n');
        }
        let limit = format!("--max-count={}", count.min(256));
        let revisions =
            self.inspect_input(repo, &["rev-list", &limit, "--stdin"], revisions.as_bytes())?;
        let mut seen = BTreeSet::new();
        let ids: Vec<String> = seeds
            .iter()
            .cloned()
            .chain(
                std::str::from_utf8(&revisions)
                    .map_err(|_| failure("invalid-utf8"))?
                    .lines()
                    .map(str::to_owned),
            )
            .filter(|id| seen.insert(id.clone()))
            .collect();
        let input = format!("{}\n", ids.join("\n"));
        let headers = self.inspect_input(repo, &["cat-file", "--batch-check"], input.as_bytes())?;
        let mut selected = Vec::new();
        let mut remaining = byte_budget;
        let lines: Vec<_> = std::str::from_utf8(&headers)
            .map_err(|_| failure("invalid-utf8"))?
            .lines()
            .collect();
        if lines.len() != ids.len() {
            return Err(failure("invalid-batch-headers"));
        }
        for (n, (oid, header)) in ids.iter().zip(lines).enumerate() {
            let fields: Vec<_> = header.split(' ').collect();
            if fields.len() != 3 || fields[0] != oid || fields[1] != "commit" {
                if n == 0 {
                    return Err(failure("commit-missing-or-invalid"));
                }
                continue; // Future reads remain subject to their own page.
            }
            let size: usize = fields[2]
                .parse()
                .map_err(|_| failure("invalid-object-size"))?;
            if size <= remaining {
                selected.push(oid.clone());
                remaining -= size;
            } else if n == 0 {
                return Ok(BTreeMap::new());
            }
        }
        let ids = selected;
        let input = format!("{}\n", ids.join("\n")).into_bytes();
        let bytes = self.inspect_input(repo, &["cat-file", "--batch"], &input)?;
        let mut at = 0;
        let mut objects = BTreeMap::new();
        for oid in ids {
            let end = bytes[at..]
                .iter()
                .position(|b| *b == b'\n')
                .ok_or_else(|| failure("invalid-object-header"))?
                + at;
            let fields: Vec<_> = std::str::from_utf8(&bytes[at..end])
                .map_err(|_| failure("invalid-utf8"))?
                .split(' ')
                .collect();
            if fields.len() != 3 || fields[0] != oid || fields[1] != "commit" {
                return Err(failure("commit-missing-or-invalid"));
            }
            let size: usize = fields[2]
                .parse()
                .map_err(|_| failure("invalid-object-size"))?;
            let start = end + 1;
            let end = start
                .checked_add(size)
                .filter(|e| *e < bytes.len())
                .ok_or_else(|| failure("invalid-object-size"))?;
            if bytes[end] != b'\n' {
                return Err(failure("invalid-object-size"));
            }
            objects.insert(oid, bytes[start..end].to_vec());
            at = end + 1;
        }
        if at != bytes.len() {
            return Err(failure("unexpected-batch-output"));
        }
        Ok(objects)
    }
}

impl GitDriver {
    /// G-062: only RepositoryConfig-owned guard provenance permits diagnostic
    /// replay. Preserve the original commit stderr, never the replay's output.
    pub(crate) fn checkout_commit_failure(
        &self,
        repo: &RepoHandle,
        scope: &fgos_holder_lock::LockScope<'_>,
        out: crate::driver::Output,
    ) -> Result<OperationError> {
        let diagnostic = (|| -> Result<&str> {
            if let Some(path) = self.hooks_value(repo)? {
                let report = self.inspect_hooks(repo, &repo.trusted_main_root().join(&path))?;
                if report.status == "owned" && report.provenance.is_some() && !report.enforcement_missing {
                    let replay = self.checkout_call(repo, scope, &["hook", "run", "pre-commit"], &[], true)?;
                    if !replay.success { return Ok("hook-refused"); }
                }
            }
            Ok("commit-rejected")
        })();
        let cause = diagnostic.map_err(|mut error| {
            error.stderr = out.stderr.clone();
            error.exit_code = out.code;
            error
        })?;
        Ok(out.error(cause))
    }
}
