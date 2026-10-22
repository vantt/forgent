//! Remote transfers over ssh, scp form and `ssh://` form, through a fake `ssh` that serves a local
//! bare repository.
//!
//! This is its own test binary because the fake `ssh` must be first on `PATH` before the process's
//! first driver call: the selected git executable and the floor verdict are process-wide and
//! computed from `PATH`, and no other test binary changes `PATH`. The cases share the fake's call
//! log, so they run one at a time.
#![cfg(target_os = "linux")]
use fgos_git::*;
use fgos_holder_lock::{acquire, Acquire, Handle, Mode, Resource, Wait};
use std::{
    fs,
    os::unix::fs::PermissionsExt,
    path::{Path, PathBuf},
    process::Command,
    sync::{
        atomic::{AtomicU64, Ordering},
        Mutex, MutexGuard, OnceLock,
    },
};

static NEXT: AtomicU64 = AtomicU64::new(0);
static SERIAL: Mutex<()> = Mutex::new(());
static FAKE: OnceLock<PathBuf> = OnceLock::new();

fn git(path: &Path, args: &[&str]) -> String {
    let out = Command::new("git")
        .arg("-C")
        .arg(path)
        .args(args)
        .output()
        .unwrap();
    assert!(
        out.status.success(),
        "{args:?}: {}",
        String::from_utf8_lossy(&out.stderr)
    );
    String::from_utf8(out.stdout).unwrap().trim().into()
}

/// Installs the fake `ssh` once and returns the file in which it logs the host argument of every
/// call. The fake serves `git-upload-pack` and `git-receive-pack` on the path it is given, and
/// refuses any host other than `example.invalid` and any account other than `git`, the way a forge refuses an unknown user.
fn fake_ssh() -> &'static Path {
    FAKE.get_or_init(|| {
        let dir =
            std::env::temp_dir().join(format!("fgos-ssh-transport-bin-{}", std::process::id()));
        fs::create_dir_all(&dir).unwrap();
        let real_git = String::from_utf8(Command::new("which").arg("git").output().unwrap().stdout)
            .unwrap()
            .trim()
            .to_owned();
        let log = dir.join("ssh.log");
        let script = format!(
            r#"#!/bin/sh
while [ $# -gt 0 ]; do
  case "$1" in
    -p|-l|-i|-F|-o) shift 2 ;;
    -*) shift ;;
    *) break ;;
  esac
done
host="$1"
shift
echo "$host" >> '{log}'
case "$host" in
  *@*) user="${{host%@*}}" ;;
  *) user="" ;;
esac
if [ "${{host#*@}}" != example.invalid ]; then
  echo "fake ssh: could not resolve hostname ${{host#*@}}" >&2
  exit 255
fi
if [ -n "$user" ] && [ "$user" != git ]; then
  echo "fake ssh: permission denied for $user" >&2
  exit 255
fi
cmd="$1"
case "$cmd" in
  git-*) exec sh -c "'{real_git}' ${{cmd#git-}}" ;;
  *) echo "fake ssh: unexpected command" >&2; exit 254 ;;
esac
"#,
            log = log.display(),
            real_git = real_git
        );
        let ssh = dir.join("ssh");
        fs::write(&ssh, script).unwrap();
        fs::set_permissions(&ssh, fs::Permissions::from_mode(0o755)).unwrap();
        let old = std::env::var_os("PATH").unwrap_or_default();
        let mut paths = vec![dir.clone()];
        paths.extend(std::env::split_paths(&old));
        std::env::set_var("PATH", std::env::join_paths(paths).unwrap());
        log
    })
}

/// Takes the serial lock, installs the fake and empties its log.
fn serial() -> (MutexGuard<'static, ()>, &'static Path) {
    let guard = SERIAL.lock().unwrap_or_else(|p| p.into_inner());
    let log = fake_ssh();
    let _ = fs::remove_file(log);
    (guard, log)
}

fn ssh_calls(log: &Path) -> Vec<String> {
    fs::read_to_string(log)
        .map(|t| t.lines().map(str::to_owned).collect())
        .unwrap_or_default()
}

/// A bare `origin.git` and one working repository with a commit on `trunk`.
struct Fixture {
    root: PathBuf,
    path: PathBuf,
    driver: GitDriver,
    repo: RepoHandle,
}

impl Fixture {
    fn new() -> Self {
        let root = std::env::temp_dir().join(format!(
            "fgos-ssh-transport-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir(&root).unwrap();
        fs::set_permissions(&root, fs::Permissions::from_mode(0o700)).unwrap();
        git(&root, &["init", "-q", "--bare", "origin.git"]);
        git(&root, &["init", "-q", "--initial-branch=trunk", "repo"]);
        let path = root.join("repo");
        git(&path, &["config", "user.name", "Fixture"]);
        git(&path, &["config", "user.email", "fixture@example.invalid"]);
        fs::write(path.join("file"), "one").unwrap();
        git(&path, &["add", "."]);
        git(&path, &["commit", "-qm", "one"]);
        let fence = path.join(".fgos/locks/activation.lock");
        fs::create_dir_all(&fence).unwrap();
        fs::write(
            fence.join("TOMBSTONE"),
            r#"{"lock":"activation","by":"fgos git","at":"fixture"}"#,
        )
        .unwrap();
        let driver = GitDriver::new(&root).unwrap();
        let repo = match driver.resolve_repo(&path, &path).unwrap() {
            ResolveRepo::Repository(r) => r,
            _ => panic!("repo is not a repository"),
        };
        Self {
            root,
            path,
            driver,
            repo,
        }
    }

    fn bare(&self) -> String {
        self.root.join("origin.git").to_str().unwrap().into()
    }

    /// The origin spelled the way a forge hands it out: `git@host:path`.
    fn scp_origin(&self) -> String {
        format!("git@example.invalid:{}", self.bare())
    }

    /// The same origin spelled `ssh://git@host/path`.
    fn ssh_origin(&self) -> String {
        format!("ssh://git@example.invalid{}", self.bare())
    }

    fn set_origin(&self, url: &str) {
        git(&self.path, &["config", "remote.origin.url", url]);
    }

    /// The grant the way every caller pins it: from the driver's own read of the remote.
    fn grant(&self) -> RemoteGrant {
        RemoteGrant {
            name: "origin".into(),
            pinned_url: Inspect::remote_url(&self.driver, &self.repo, "origin").unwrap(),
        }
    }
}

impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.root);
    }
}

#[test]
fn a_repository_whose_origin_is_in_scp_form_claims_a_counter_number_through_that_origin() {
    // No existing case proves it: the sequence cases use a plain path as origin, and a path never
    // meets the scheme ladder that refuses scp form.
    let (_serial, log) = serial();
    let f = Fixture::new();
    f.set_origin(&f.scp_origin());
    let home = f.driver.sequence_home(&f.repo);
    assert!(matches!(home, SequenceHome::Remote(_)), "{home:?}");

    let claimed = match f
        .driver
        .sequence_push(&f.repo, &home, "d-adr", None, 1, "claim-a")
        .expect("a claim through an scp-form origin")
    {
        SequencePush::Claimed(oid) => oid,
        SequencePush::Stale => panic!("the claim was refused as stale"),
    };
    assert_eq!(
        git(
            &f.root.join("origin.git"),
            &["rev-parse", "refs/fgos/seq/d-adr"]
        ),
        claimed.as_str()
    );
    let tip = f
        .driver
        .sequence_tip(&f.repo, &home, "d-adr")
        .unwrap()
        .unwrap();
    assert_eq!((tip.oid, tip.number), (claimed, 1));
    assert!(ssh_calls(log)
        .iter()
        .all(|host| host == "git@example.invalid"));
}

#[test]
fn an_scp_form_origin_is_accepted_and_option_or_helper_look_alikes_are_refused() {
    // No existing case proves the grammar: the one door test only covers credentials in `://` URLs.
    // Every case goes through the real door (`inspect_remote`) and sets the origin raw, so it
    // survives a move of the classifier.
    let (_serial, log) = serial();
    let f = Fixture::new();
    let bare = f.bare();
    let names = [RefName::parse("refs/heads/trunk").unwrap()];

    for accepted in [
        format!("git@example.invalid:{bare}"),
        format!("example.invalid:{bare}"),
    ] {
        f.set_origin(&accepted);
        let grant = f.grant();
        f.driver
            .inspect_remote(&f.repo, vec![], &grant, &names)
            .unwrap_or_else(|e| panic!("{accepted:?} must be accepted: {e:?}"));
    }
    assert!(!ssh_calls(log).is_empty(), "the accepted forms reached ssh");

    let _ = fs::remove_file(log);
    for refused in [
        "-oProxyCommand=x:y".to_owned(),
        "ssh://-oProxyCommand=x@example.invalid/r".to_owned(),
        "ext::sh -c x".to_owned(),
        "fd::17".to_owned(),
        "[::1]:p".to_owned(),
        "a b@example.invalid:p".to_owned(),
        "example.invalid:p?x".to_owned(),
        "git:secret@example.invalid:p".to_owned(),
        "git%40x@example.invalid:p".to_owned(),
        "ssh://git:secret@example.invalid/r".to_owned(),
        "example.invalid:p\tq".to_owned(),
    ] {
        f.set_origin(&refused);
        let grant = f.grant();
        let err = f
            .driver
            .inspect_remote(&f.repo, vec![], &grant, &names)
            .expect_err(&format!("{refused:?} must be refused"));
        assert!(
            err.cause.contains("remote-protocol-not-supported")
                || err
                    .cause
                    .contains("remote-url-not-pinned-or-credentials-present"),
            "{refused:?}: {}",
            err.cause
        );
    }
    assert!(
        ssh_calls(log).is_empty(),
        "a refused origin never reaches ssh"
    );
}

#[test]
fn the_remote_port_hands_git_the_url_the_remote_is_configured_with() {
    // No existing case proves it: the transfer cases use path origins, which `redact` leaves alone;
    // an ssh user name is what `redact` rewrites.
    let (_serial, log) = serial();
    let f = Fixture::new();
    f.set_origin(&f.ssh_origin());
    let mappings = [RefMapping {
        source: RefName::parse("refs/heads/trunk").unwrap(),
        destination: RefName::parse("refs/heads/shared").unwrap(),
    }];
    f.driver
        .push_refs(
            &f.repo,
            vec![],
            &f.grant(),
            &mappings,
            "fixture",
            "ssh-push",
        )
        .expect("a push to an ssh:// origin with a user name");
    assert_eq!(
        git(
            &f.root.join("origin.git"),
            &["rev-parse", "refs/heads/shared"]
        ),
        git(&f.path, &["rev-parse", "refs/heads/trunk"])
    );
    assert!(ssh_calls(log)
        .iter()
        .all(|host| host == "git@example.invalid"));
}

// --- Publication ---------------------------------------------------------------------------

fn handle(path: &Path) -> Handle {
    match acquire(
        &Resource::new("event-seal", path),
        Mode::Ex,
        Wait::Ms(30_000),
        2000,
    ) {
        Acquire::Acquired(h) => h,
        other => panic!("{other:?}"),
    }
}

#[test]
fn publication_accepts_the_pin_it_is_given_for_an_ssh_url_with_a_user_name() {
    // No existing case proves it: the publication cases pin path origins. The Event Store pins what
    // `Inspect::remote_url` answers, and that is the pin used here.
    let (_serial, log) = serial();
    let f = Fixture::new();
    // The publication repository is the working repository's bare sibling.
    let publisher = f.root.join("publisher.git");
    git(&f.root, &["init", "-q", "--bare", "publisher.git"]);
    git(&publisher, &["remote", "add", "origin", &f.ssh_origin()]);
    let repo = match f.driver.resolve_repo(&publisher, &publisher).unwrap() {
        ResolveRepo::Repository(r) => {
            let fence = r.trusted_main_root().join(".fgos/locks/activation.lock");
            fs::create_dir_all(&fence).unwrap();
            fs::write(
                fence.join("TOMBSTONE"),
                "{\"at\":\"fixture\",\"v\":1,\"lock\":\"activation\",\"by\":\"fgos git\"}\n",
            )
            .unwrap();
            r
        }
        _ => panic!("publisher is not a repository"),
    };
    let reference = RefName::parse("refs/fgos/events/machine").unwrap();
    let pin = Inspect::remote_url(&f.driver, &repo, "origin").unwrap();
    let mut h = handle(&f.root.join("seal.lock"));
    let seal = h.path().to_path_buf();
    let authority =
        HolderAuthority::new(&repo, &mut h, &seal, reference.clone(), "test-writer").unwrap();
    let port = PublicationPort::new(&f.driver, authority).with_remote(RemoteGrant {
        name: "origin".into(),
        pinned_url: pin,
    });
    let blob = port.write_blob(&repo, b"seal").unwrap();
    let tree = port
        .write_tree(
            &repo,
            &[TreeEntry {
                name: b"seal.json".to_vec(),
                mode: 0o100644,
                oid: blob,
            }],
        )
        .unwrap();
    let who = || Identity {
        name: "Event Store".into(),
        email: "store@fgos.invalid".into(),
    };
    let commit = port
        .write_commit(
            &repo,
            &CommitInput {
                tree,
                parents: vec![],
                author: who(),
                committer: who(),
                author_date: "1792300000 +0700".into(),
                committer_date: "1792300000 +0700".into(),
                message: b"seal".to_vec(),
            },
        )
        .unwrap();
    port.compare_and_swap(
        &repo,
        &reference,
        &ExpectedTip::Absent,
        &ExpectedTip::Oid(commit.clone()),
        "initial",
    )
    .unwrap();
    let pushed = port
        .push_refs(&repo, "origin", &[(reference.clone(), reference.clone())])
        .expect("a publication push to an ssh:// origin with a user name");
    assert!(
        matches!(pushed.refs[0].1, PushOutcome::Accepted),
        "{:?}",
        pushed.refs
    );
    assert_eq!(
        git(
            &f.root.join("origin.git"),
            &["rev-parse", reference.as_str()]
        ),
        commit.as_str()
    );
    assert!(ssh_calls(log)
        .iter()
        .all(|host| host == "git@example.invalid"));
}
