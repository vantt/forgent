//! The `fgctl` command surface: the verb table, the help text each verb
//! prints, the flag parser the verbs share, and the usage-error path. The
//! table is the one list of verbs and flags; help, parsing and the
//! did-you-mean suggestions all read it, so they cannot drift apart.

use fgos_distribution::suggest::suggest;

/// Exit code of every usage error (unknown verb or flag, missing value).
pub const EXIT_USAGE: i32 = 2;

pub struct Flag {
    pub name: &'static str,
    pub takes_value: bool,
}

pub struct Verb {
    pub name: &'static str,
    pub summary: &'static str,
    pub flags: &'static [Flag],
    pub help: &'static str,
}

const fn switch(name: &'static str) -> Flag {
    Flag {
        name,
        takes_value: false,
    }
}

const fn valued(name: &'static str) -> Flag {
    Flag {
        name,
        takes_value: true,
    }
}

pub const VERBS: &[Verb] = &[
    Verb {
        name: "init",
        summary: "Activate fgOS in this project (first run)",
        flags: &[valued("--from"), valued("--override-pin")],
        help: "\
fgctl init - fetch, verify and activate an fgOS release in this project

Changes on disk:
  Stages the release in the machine release store, writes .fgos/installation/
  and the activation record in the project, writes the pin
  .fgos/distribution.json, then runs `fgos init` and `fgos doctor --fix` there.
  Safe to repeat.

Prerequisites:
  Run inside a git repository. Network access unless --from names a local
  release or the release is already staged on this machine.

Options:
  --from <path|URL>       Release to use. Default: FGCTL_FROM, else
                          FGCTL_VERSION=<tag>, else the project pin, else the
                          latest release.
  --override-pin <reason> Recovery only. Activate the release --from names,
                          already staged on this machine, although it differs
                          from the pin. Every check still runs, the reason goes
                          into activation.json and the pin file is unchanged.
                          Default: off.
  -h, --help              Show this help.

Examples:
  fgctl init
  fgctl init --from ./dist/release
  FGCTL_VERSION=v1.2.0 fgctl init
  fgctl init --from ./staged-release --override-pin \"pinned release was withdrawn\"

Exit codes:
  0 activated, or nothing to do   1 failed (the message names the cause)
  2 usage error

Next:
  fgos doctor --json, then fgos run \"<prompt>\".
",
    },
    Verb {
        name: "upgrade",
        summary: "Move this project to a newer release",
        flags: &[valued("--from")],
        help: "\
fgctl upgrade - activate a newer release in this project and refresh fgctl

Changes on disk:
  Stages the new release in the machine release store, switches the project's
  activation to it (the old one is kept for `fgctl repair`), updates the pin,
  then replaces this fgctl with the one the release ships when they differ,
  keeping the old binary as <path>.prev. One fgctl serves every project on this
  machine.

Prerequisites:
  An initialised project (run `fgctl init` first). Network access unless --from
  names a local release.

Options:
  --from <path|URL>       Release to use. Default: FGCTL_FROM, else
                          FGCTL_VERSION=<tag>, else the latest release.
  -h, --help              Show this help.

Examples:
  fgctl upgrade
  fgctl upgrade --from ./dist/release
  FGCTL_VERSION=v1.3.0 fgctl upgrade

Exit codes:
  0 upgraded, or already current   1 failed (the activation stands when the
  failure is only the fgctl refresh)   2 usage error

Next:
  fgctl verify, then fgos doctor --json. To go back: fgctl repair.
",
    },
    Verb {
        name: "repair",
        summary: "Roll back or re-publish the activation",
        flags: &[],
        help: "\
fgctl repair - roll the project back to its previous release, or re-publish
the current one

Changes on disk:
  When the project has a previous release, reactivates it. Otherwise verifies
  the active release and re-publishes the same activation. Only
  .fgos/installation/ and the activation record change.

Prerequisites:
  An activated project.

Options:
  -h, --help              Show this help.

Examples:
  fgctl repair
  fgctl repair && fgctl verify

Exit codes:
  0 repaired   1 failed (for example no activation)   2 usage error

Next:
  fgctl verify, then fgos doctor --json.
",
    },
    Verb {
        name: "verify",
        summary: "Re-hash the active release against its manifest",
        flags: &[],
        help: "\
fgctl verify - check the active release's files against its manifest

Changes on disk:
  Nothing when every file matches. A release with drift is moved to the
  quarantine directory of the machine release store.

Prerequisites:
  An activated project.

Options:
  -h, --help              Show this help.

Examples:
  fgctl verify
  fgctl verify && echo intact

Exit codes:
  0 every file matches   1 drift or no activation (the message names it)
  2 usage error

Next:
  On failure: fgctl repair. On success: fgos doctor --json.
",
    },
    Verb {
        name: "status",
        summary: "List staged releases and the active one",
        flags: &[switch("--json")],
        help: "\
fgctl status - show the releases staged on this machine and the project's
active and previous release

Changes on disk:
  Nothing; read only.

Prerequisites:
  None. Outside an activated project it lists the machine release store only.

Options:
  --json                  Print JSON on stdout instead of text. Default: text.
  -h, --help              Show this help.

Examples:
  fgctl status
  fgctl status --json

Exit codes:
  0 printed   1 the release store could not be read   2 usage error

Next:
  fgctl verify, or fgctl upgrade when a newer release exists.
",
    },
    Verb {
        name: "stage",
        summary: "Copy a verified release into the machine store",
        flags: &[valued("--from")],
        help: "\
fgctl stage - verify a release and copy it into the machine release store

Changes on disk:
  Writes releases/<digest>/ under the machine release store
  ($FGOS_STATE_ROOT, else ${FGOS_STATE_HOME:-${XDG_STATE_HOME:-$HOME/.local/state}/fgos}).
  A release whose digests do not match is moved to quarantine/ and not staged.
  No project is touched.

Prerequisites:
  A release directory or .tar.gz.

Options:
  --from <path>           Required. The release directory or .tar.gz to stage.
  -h, --help              Show this help.

Examples:
  fgctl stage --from ./dist/release
  fgctl stage --from ./fgos-release.tar.gz

Exit codes:
  0 staged, or already staged   1 refused or quarantined   2 usage error

Next:
  fgctl init --from <path> to activate it in a project.
",
    },
    Verb {
        name: "version",
        summary: "Print the fgctl version",
        flags: &[switch("--json")],
        help: "\
fgctl version - print which fgctl this is (also: fgctl --version)

Changes on disk:
  Nothing.

Prerequisites:
  None.

Options:
  --json                  Print {\"name\",\"version\",\"commit\",\"commitTime\"} on
                          stdout. commit and commitTime are null when the build
                          did not state them. Default: one text line.
  -h, --help              Show this help.

Examples:
  fgctl --version
  fgctl version --json

Exit codes:
  0 printed   2 usage error

Next:
  fgctl status, or fgctl upgrade to move to a newer release.
",
    },
];

pub fn find_verb(name: &str) -> Option<&'static Verb> {
    VERBS.iter().find(|verb| verb.name == name)
}

pub fn print_overview() {
    println!("fgctl - install and manage fgOS releases");
    println!();
    println!("Get started:");
    println!("  1. Install fgctl:      curl -fsSL https://github.com/vantt/forgent/releases/latest/download/install.sh | sh");
    println!("  2. In your project:    fgctl init");
    println!("  3. Run a task:         fgos run \"<prompt>\"");
    println!();
    println!(
        "Agents: run `fgctl init`, then `fgos doctor --json` and run each `next` command it lists."
    );
    println!();
    println!("Commands:");
    for verb in VERBS {
        println!("  {:<9}{}", verb.name, verb.summary);
    }
    println!("  help     Show this overview, or `fgctl help <command>`");
    println!();
    println!("Run `fgctl <command> --help` for what a command changes, its options, examples and exit codes.");
    println!("Exit codes: 0 ok, 1 failed, 2 usage error.");
}

pub fn print_verb_help(verb: &Verb) {
    print!("{}", verb.help);
}

/// Prints the error, the way out and exits 2.
pub fn usage_error(verb: Option<&Verb>, problem: &str, hint: Option<String>) -> ! {
    eprintln!("Error: {problem}");
    if let Some(hint) = hint {
        eprintln!("{hint}");
    }
    match verb {
        Some(verb) => eprintln!("Run `fgctl {} --help` for usage.", verb.name),
        None => eprintln!("Run `fgctl --help` for the list of commands."),
    }
    std::process::exit(EXIT_USAGE);
}

pub fn unknown_verb(name: &str) -> ! {
    let candidates = VERBS.iter().map(|verb| verb.name).chain(["help"]);
    let hint = suggest(name, candidates).map(|near| format!("did you mean `fgctl {near}`?"));
    usage_error(None, &format!("unknown command `{name}`"), hint)
}

/// The flags one verb received, in the order given.
pub struct Flags {
    verb: &'static Verb,
    given: Vec<(&'static str, Option<String>)>,
}

impl Flags {
    pub fn has(&self, name: &str) -> bool {
        self.given.iter().any(|(given, _)| *given == name)
    }

    pub fn value(&self, name: &str) -> Option<String> {
        self.given
            .iter()
            .rev()
            .find(|(given, _)| *given == name)
            .and_then(|(_, value)| value.clone())
    }

    /// A flag the verb cannot run without.
    pub fn require(&self, name: &str) -> String {
        self.value(name).unwrap_or_else(|| {
            usage_error(
                Some(self.verb),
                &format!("{name} is required for `fgctl {}`", self.verb.name),
                None,
            )
        })
    }
}

/// Parses `args` (everything after the verb) against the verb's flag table.
/// `--help` anywhere prints the verb's help and exits 0; an unknown flag, a
/// stray argument or a missing value is a usage error.
pub fn parse_flags(verb: &'static Verb, args: &[String]) -> Flags {
    if args.iter().any(|arg| arg == "--help" || arg == "-h") {
        print_verb_help(verb);
        std::process::exit(0);
    }
    let mut given = Vec::new();
    let mut rest = args.iter();
    while let Some(arg) = rest.next() {
        let (name, inline) = match arg.split_once('=') {
            Some((name, value)) if name.starts_with("--") => (name, Some(value.to_string())),
            _ => (arg.as_str(), None),
        };
        let Some(flag) = verb.flags.iter().find(|flag| flag.name == name) else {
            let hint = if name.starts_with('-') {
                suggest(name, verb.flags.iter().map(|flag| flag.name))
                    .map(|near| format!("did you mean `{near}`?"))
            } else {
                None
            };
            let what = if name.starts_with('-') {
                "option"
            } else {
                "argument"
            };
            usage_error(
                Some(verb),
                &format!("unknown {what} `{arg}` for `fgctl {}`", verb.name),
                hint,
            )
        };
        let value = if flag.takes_value {
            match inline.or_else(|| rest.next().cloned()) {
                Some(value) => Some(value),
                None => usage_error(Some(verb), &format!("{} needs a value", flag.name), None),
            }
        } else if inline.is_some() {
            usage_error(Some(verb), &format!("{} takes no value", flag.name), None)
        } else {
            None
        };
        if given.iter().any(|(seen, _)| *seen == flag.name) {
            usage_error(
                Some(verb),
                &format!("{} was given more than once", flag.name),
                None,
            );
        }
        given.push((flag.name, value));
    }
    Flags { verb, given }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_verb_help_carries_the_required_sections() {
        for verb in VERBS {
            for section in [
                "Changes on disk:",
                "Prerequisites:",
                "Options:",
                "Examples:",
                "Exit codes:",
                "Next:",
            ] {
                assert!(verb.help.contains(section), "{} lacks {section}", verb.name);
            }
            for flag in verb.flags {
                assert!(
                    verb.help.contains(flag.name),
                    "{} help omits {}",
                    verb.name,
                    flag.name
                );
            }
        }
    }
}
