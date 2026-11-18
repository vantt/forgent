//! Whether a verb may touch the store at `dir` from `cwd`, driven by the verb's declared store mode.
//!
//! Refusals carry the fault class the shell records them under:
//!
//! - `store-missing`: a `require` verb with no `.fgos/` at `dir` (the phantom-store hazard).
//! - `disconnected-worktree-store`: a store-mutating verb from a linked worktree whose `.fgos/` is a real, frozen
//!   snapshot, unless `--dir` named the root.
//! - `init-in-worktree`: a verb that creates the store, inside a linked worktree (worktrees never carry `.fgos/`).
//! - `worktree-identity-unreadable`: the Git state that tells a linked worktree from the main checkout could not be
//!   read.
//!
//! A `read` verb with no `.fgos/` from a linked worktree is admitted with a warning line: the view may be empty.
//!
//! Git is read lazily, through the one reader of the invocation-root door, and at most once: only a path that needs
//! the worktree identity asks for it. A verb that needs no store and does not mutate, a call that named `--dir`,
//! and a read of a store that exists all succeed when Git cannot be read. A mutating verb that needs no store
//! (`dispatch recover --action`) is judged like any other mutating verb once a `.fgos/` exists.
use crate::invocation_root::{read_repo_facts, realpath_or_self, FactsReader, Refusal, RepoFacts};
use std::cell::OnceCell;
use std::path::Path;

pub const STORE_MISSING_CLASS: &str = "store-missing";
pub const DISCONNECTED_WORKTREE_STORE: &str = "disconnected-worktree-store";
pub const INIT_IN_WORKTREE: &str = "init-in-worktree";
pub const WORKTREE_IDENTITY_UNREADABLE: &str = "worktree-identity-unreadable";

/// What a verb declares about the store.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StoreMode {
    /// The verb needs no store.
    None,
    /// The verb opens the store, creating it when it is absent.
    Open,
    /// The verb reads the store when there is one.
    Read,
    /// The verb needs an existing store.
    Require,
}

impl StoreMode {
    /// The mode a registry entry names; an unknown or absent declaration needs no store.
    pub fn parse(name: &str) -> Self {
        match name {
            "open" => Self::Open,
            "read" => Self::Read,
            "require" => Self::Require,
            _ => Self::None,
        }
    }
}

/// One admission question. `creates` is true for the verb that creates the store (the caller computes it).
#[derive(Debug, Clone, Copy)]
pub struct AdmitRequest<'a> {
    pub verb: &'a str,
    pub store_mode: StoreMode,
    pub mutates: bool,
    pub creates: bool,
    pub explicit_dir: bool,
    pub dir: &'a Path,
    pub cwd: &'a Path,
}

/// The verb may run; `warning` is a line for stderr.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Admitted {
    pub warning: Option<String>,
}

fn store_missing(dir: &Path) -> String {
    format!(
        ".fgos/ not found at \"{}\" -- run \"fgos init\" here first, or check you are not inside a linked worktree (worktrees never carry .fgos/, per ADR0020: docs/platform/runner/decisions/h-36d872fbb0e5.md#0020--chặn-fgos-khỏi-worktree-worker-không-khóa-không-cô-lập).",
        dir.display()
    )
}

/// [`admit_store_access_with`] over the real Git read.
pub fn admit_store_access(request: &AdmitRequest) -> Result<Admitted, Refusal> {
    admit_store_access_with(request, &read_repo_facts)
}

/// Whether the verb may touch the store; `read` is the Git read.
pub fn admit_store_access_with(
    request: &AdmitRequest,
    read: FactsReader,
) -> Result<Admitted, Refusal> {
    let AdmitRequest {
        verb,
        store_mode,
        mutates,
        creates,
        explicit_dir,
        dir,
        cwd,
    } = *request;
    let cell: OnceCell<Result<RepoFacts, String>> = OnceCell::new();
    let facts = || cell.get_or_init(|| read(cwd).map_err(|fault| fault.cause));
    let is_main = || -> Result<bool, Refusal> {
        let unreadable = |why: &str| {
            Refusal::new(
                WORKTREE_IDENTITY_UNREADABLE,
                format!(
                    "\"{verb}\" refused: the Git state of \"{}\" could not be read: {why}",
                    cwd.display()
                ),
            )
        };
        match facts() {
            Err(cause) => Err(unreadable(cause)),
            Ok(RepoFacts::NotARepository) => Ok(true),
            Ok(RepoFacts::Repository {
                work_tree: Some(top),
                trusted_main: Some(main),
            }) => Ok(realpath_or_self(top) == realpath_or_self(main)),
            Ok(RepoFacts::Repository { .. }) => Err(unreadable("the repository names no checkout")),
        }
    };
    let store_exists = dir.exists();
    if store_mode == StoreMode::Require && !store_exists {
        return Err(Refusal::new(STORE_MISSING_CLASS, store_missing(dir)));
    }
    // A `.fgos/`-less stripped worktree has no store to disconnect from, hence the existence check.
    if !explicit_dir && mutates && store_exists && !is_main()? {
        return Err(Refusal::new(
            DISCONNECTED_WORKTREE_STORE,
            format!(
                "\"{verb}\" refused: \"{}\" is a linked worktree whose .fgos/ at \"{}\" is a real but disconnected snapshot, never the shared store outside \"fgos pick\"/\"fgos take\" (ADR0020-stripped) -- pass --dir <mainRoot> to reach the real store explicitly, e.g. `--dir \"$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)\"`.",
                cwd.display(),
                dir.display()
            ),
        ));
    }
    if creates && !is_main()? {
        return Err(Refusal::new(
            INIT_IN_WORKTREE,
            format!(
                "\"fgos init\" refused inside a linked worktree (\"{}\") -- worktrees never carry .fgos/ by design (ADR0020); run \"fgos init\" from the main checkout instead.",
                cwd.display()
            ),
        ));
    }
    // A stderr line, not a JSON field: `ready`/`triage` can return a bare array, so a `data` field would change
    // that shape.
    let warning = if store_mode == StoreMode::Read && !store_exists && !is_main()? {
        Some(format!(
            "fgos: warning: .fgos/ not found at \"{}\" -- this view may be empty because the real store lives elsewhere (worktrees never carry .fgos/, per ADR0020); pass --dir <mainRoot> to read it.\n",
            dir.display()
        ))
    } else {
        None
    };
    Ok(Admitted { warning })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::invocation_root::test_support::{git, read, scratch, state_root};
    use crate::invocation_root::FactsFault;
    use crate::plain_path;
    use std::path::PathBuf;

    /// A main checkout with a committed `.fgos`, in its own scratch directory with its own state root.
    struct World {
        base: PathBuf,
        main: PathBuf,
        state: PathBuf,
    }

    impl World {
        fn new(label: &str) -> Self {
            let base = scratch(&format!("admit-{label}"));
            let (main, state) = (base.join("main"), state_root(&base));
            std::fs::create_dir_all(main.join(".fgos")).unwrap();
            git(&main, &["init", "-q", "-b", "main"]);
            std::fs::write(main.join(".fgos").join("events.jsonl"), "").unwrap();
            git(&main, &["add", ".fgos/events.jsonl"]);
            git(&main, &["commit", "-q", "-m", "store"]);
            Self { base, main, state }
        }

        fn linked(&self, name: &str) -> PathBuf {
            let path = self.base.join(name);
            git(
                &self.main,
                &[
                    "worktree",
                    "add",
                    "-q",
                    "--detach",
                    path.to_str().unwrap(),
                    "HEAD",
                ],
            );
            plain_path(&std::fs::canonicalize(path).unwrap())
        }

        fn read(&self, path: &Path) -> Result<RepoFacts, FactsFault> {
            read(&self.state, path)
        }

        fn admit(&self, request: AdmitRequest) -> Result<Admitted, Refusal> {
            admit_store_access_with(&request, &|p| self.read(p))
        }
    }

    impl Drop for World {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.base);
        }
    }

    fn submit<'a>(dir: &'a Path, cwd: &'a Path) -> AdmitRequest<'a> {
        AdmitRequest {
            verb: "submit",
            store_mode: StoreMode::Require,
            mutates: true,
            creates: false,
            explicit_dir: false,
            dir,
            cwd,
        }
    }

    fn unreadable(_: &Path) -> Result<RepoFacts, FactsFault> {
        Err(FactsFault {
            cause: "git-below-the-floor".into(),
        })
    }

    #[test]
    fn a_required_store_that_is_missing_is_refused_as_store_missing() {
        let world = World::new("missing");
        let dir = world.base.join("nowhere").join(".fgos");
        let refusal = world.admit(submit(&dir, &world.main)).unwrap_err();
        assert_eq!(refusal.fault_class, STORE_MISSING_CLASS);
        assert!(refusal.message.starts_with(".fgos/ not found at"));
        assert!(refusal.message.contains(&dir.display().to_string()));
        assert!(refusal.message.contains("per ADR0020"));
    }

    #[test]
    fn a_store_mutating_verb_from_a_linked_worktree_with_a_frozen_snapshot_is_refused() {
        let world = World::new("disconnected");
        let wt = world.linked("adhoc");
        assert!(
            wt.join(".fgos").join("events.jsonl").is_file(),
            "a real checked-out copy"
        );
        let refusal = world.admit(submit(&wt.join(".fgos"), &wt)).unwrap_err();
        assert_eq!(refusal.fault_class, DISCONNECTED_WORKTREE_STORE);
        assert!(refusal.message.contains("disconnected snapshot"));
        assert!(refusal.message.starts_with("\"submit\" refused: "));
    }

    #[test]
    fn a_store_mutating_verb_that_needs_no_store_is_refused_from_a_frozen_worktree_too() {
        let world = World::new("disconnected-none");
        let wt = world.linked("adhoc");
        let store = wt.join(".fgos");
        let recover = AdmitRequest {
            verb: "recover",
            store_mode: StoreMode::None,
            ..submit(&store, &wt)
        };
        let refusal = world.admit(recover).unwrap_err();
        assert_eq!(refusal.fault_class, DISCONNECTED_WORKTREE_STORE);
        assert!(refusal.message.starts_with("\"recover\" refused: "));
        let read_only = AdmitRequest {
            mutates: false,
            ..recover
        };
        assert_eq!(
            world.admit(read_only).unwrap(),
            Admitted { warning: None },
            "the non-mutating shape of the same verb is unaffected"
        );
    }

    #[test]
    fn the_main_checkout_an_explicit_dir_and_a_read_only_verb_are_admitted() {
        let world = World::new("admitted");
        let wt = world.linked("adhoc");
        let none = Admitted { warning: None };
        assert_eq!(
            world
                .admit(submit(&world.main.join(".fgos"), &world.main))
                .unwrap(),
            none
        );
        let wt_store = wt.join(".fgos");
        let explicit = AdmitRequest {
            explicit_dir: true,
            ..submit(&wt_store, &wt)
        };
        assert_eq!(world.admit(explicit).unwrap(), none);
        let read_only = AdmitRequest {
            mutates: false,
            ..submit(&wt_store, &wt)
        };
        assert_eq!(world.admit(read_only).unwrap(), none);
    }

    #[test]
    fn init_inside_a_linked_worktree_is_refused_and_allowed_at_the_main_checkout() {
        let world = World::new("init");
        let wt = world.linked("adhoc");
        std::fs::remove_dir_all(wt.join(".fgos")).unwrap();
        fn init<'a>(dir: &'a Path, cwd: &'a Path) -> AdmitRequest<'a> {
            AdmitRequest {
                verb: "init",
                store_mode: StoreMode::Open,
                mutates: false,
                creates: true,
                explicit_dir: false,
                dir,
                cwd,
            }
        }
        let refusal = world.admit(init(&wt.join(".fgos"), &wt)).unwrap_err();
        assert_eq!(refusal.fault_class, INIT_IN_WORKTREE);
        assert!(refusal
            .message
            .starts_with("\"fgos init\" refused inside a linked worktree"));
        assert_eq!(
            world
                .admit(init(&world.main.join(".fgos"), &world.main))
                .unwrap(),
            Admitted { warning: None }
        );
    }

    #[test]
    fn a_read_verb_with_no_store_from_a_linked_worktree_is_admitted_with_a_warning_and_from_main_without(
    ) {
        let world = World::new("warning");
        let wt = world.linked("adhoc");
        std::fs::remove_dir_all(wt.join(".fgos")).unwrap();
        fn read<'a>(dir: &'a Path, cwd: &'a Path) -> AdmitRequest<'a> {
            AdmitRequest {
                verb: "list",
                store_mode: StoreMode::Read,
                mutates: false,
                creates: false,
                explicit_dir: false,
                dir,
                cwd,
            }
        }
        let warning = world
            .admit(read(&wt.join(".fgos"), &wt))
            .unwrap()
            .warning
            .unwrap();
        assert!(warning.starts_with("fgos: warning: .fgos/ not found at"));
        assert!(warning.contains("this view may be empty") && warning.ends_with('\n'));
        std::fs::remove_dir_all(world.main.join(".fgos")).unwrap();
        assert_eq!(
            world
                .admit(read(&world.main.join(".fgos"), &world.main))
                .unwrap()
                .warning,
            None
        );
    }

    #[test]
    fn a_git_state_that_cannot_be_read_refuses_with_its_own_fault_class_on_the_paths_that_need_it()
    {
        let world = World::new("unreadable");
        let wt = world.linked("forged");
        // A worktree whose gitdir pointer is garbage: Git refuses to trust it, so the identity read fails.
        std::fs::write(wt.join(".git"), "gitdir: /nonexistent/forged\n").unwrap();
        let refusal = world.admit(submit(&wt.join(".fgos"), &wt)).unwrap_err();
        assert_eq!(refusal.fault_class, WORKTREE_IDENTITY_UNREADABLE);
        assert!(refusal
            .message
            .contains("\"submit\" refused: the Git state of"));
    }

    #[test]
    fn git_is_read_only_on_the_paths_that_need_the_worktree_identity() {
        let world = World::new("lazy");
        let store = world.main.join(".fgos");
        let cwd = &world.main;
        let admit = |request: AdmitRequest| admit_store_access_with(&request, &unreadable);
        // A verb that needs no store and one that opens it read nothing.
        let free = |mode| AdmitRequest {
            verb: "show",
            store_mode: mode,
            mutates: false,
            creates: false,
            explicit_dir: false,
            dir: &store,
            cwd,
        };
        assert!(admit(free(StoreMode::None)).is_ok());
        assert!(admit(free(StoreMode::Open)).is_ok());
        // A read of a store that exists, and a required store that exists and is not mutated, read nothing.
        assert!(admit(free(StoreMode::Read)).is_ok());
        assert!(admit(free(StoreMode::Require)).is_ok());
        // A mutating call that named the directory reads nothing.
        let explicit = AdmitRequest {
            explicit_dir: true,
            ..submit(&store, cwd)
        };
        assert!(admit(explicit).is_ok());
        // A mutating call that did not, a store-creating verb and a read of a missing store do read.
        let gone = world.base.join("gone").join(".fgos");
        let reads = [
            submit(&store, cwd),
            AdmitRequest {
                creates: true,
                store_mode: StoreMode::Open,
                mutates: false,
                ..submit(&store, cwd)
            },
            AdmitRequest {
                store_mode: StoreMode::Read,
                mutates: false,
                ..submit(&gone, cwd)
            },
        ];
        for request in reads {
            assert_eq!(
                admit(request).unwrap_err().fault_class,
                WORKTREE_IDENTITY_UNREADABLE,
                "{request:?}"
            );
        }
    }

    #[test]
    fn git_is_read_once_for_every_check_that_needs_it() {
        let world = World::new("once");
        let wt = world.linked("adhoc");
        let reads = std::cell::Cell::new(0);
        let counting = |p: &Path| {
            reads.set(reads.get() + 1);
            world.read(p)
        };
        // Disconnected check, then the creates check, then the warning check all need the identity.
        let wt_store = wt.join(".fgos");
        let request = AdmitRequest {
            creates: true,
            ..submit(&wt_store, &wt)
        };
        let _ = admit_store_access_with(&request, &counting);
        assert_eq!(reads.get(), 1);
    }

    #[test]
    fn a_not_a_repository_directory_is_the_main_checkout_for_every_check() {
        let world = World::new("plain");
        let plain = world.base.join("plain");
        std::fs::create_dir_all(&plain).unwrap();
        let init = AdmitRequest {
            verb: "init",
            store_mode: StoreMode::Open,
            mutates: false,
            creates: true,
            explicit_dir: false,
            dir: &plain.join(".fgos"),
            cwd: &plain,
        };
        assert_eq!(world.admit(init).unwrap(), Admitted { warning: None });
    }
}
