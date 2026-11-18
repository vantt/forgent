//! Token usage of one run, read from what its CLI left behind: stdout, stderr or the seat's own transcript.
//!
//! The CLI is the one the launch really ran (the basename of the prepared invocation's command), matched exactly;
//! an executor id names a provider, never a CLI. One module per CLI. Counts that cannot be found come back as a
//! named `reason`, never as a guessed zero; counts a CLI reported as all zero stay zero and carry `reported-zero`.

mod agy;
mod claude;
mod codex;
mod pi;

use serde::{Deserialize, Serialize};

/// The usage of one run. `None` fields were reported by no turn: unknown, never zero.
#[derive(Debug, Clone, Default, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Usage {
    pub input_tokens: Option<u64>,
    pub output_tokens: Option<u64>,
    pub total_tokens: Option<u64>,
    pub cache_read_tokens: Option<u64>,
    pub cache_creation_tokens: Option<u64>,
    pub reasoning_tokens: Option<u64>,
    pub source: String,
    pub reason: Option<String>,
}

impl Usage {
    pub(crate) fn absent(source: &str, reason: &str) -> Self {
        Usage {
            source: source.to_string(),
            reason: Some(reason.to_string()),
            ..Usage::default()
        }
    }

    /// Counts were read: when at least one is present and every present one is zero, they are a reported zero.
    pub(crate) fn found(mut self) -> Self {
        let counts = [
            self.input_tokens,
            self.output_tokens,
            self.cache_read_tokens,
            self.cache_creation_tokens,
            self.total_tokens,
            self.reasoning_tokens,
        ];
        let mut present = counts.iter().flatten().peekable();
        if present.peek().is_some() && present.all(|n| *n == 0) {
            self.reason = Some("reported-zero".to_string());
        }
        self
    }
}

/// Adds a turn's count to a sum that stays `None` until some turn reports the field.
pub(crate) fn add(sum: &mut Option<u64>, turn: Option<u64>) {
    if let Some(n) = turn {
        *sum = Some(sum.unwrap_or(0).saturating_add(n));
    }
}

/// The sum of the counts that are present, `None` when none is.
pub(crate) fn sum_present(counts: &[Option<u64>]) -> Option<u64> {
    let mut sum = None;
    for count in counts {
        add(&mut sum, *count);
    }
    sum
}

/// Where a claude seat's session may be: the `projects` directory of its config dir, the cwd it ran in (named by
/// its slug under `projects`), and either its session id or the run's time window (RFC3339) to find the transcript.
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ClaudeSession {
    pub projects_dir: String,
    pub cwd: String,
    pub session_id: Option<String>,
    pub started_at: Option<String>,
    pub ended_at: Option<String>,
}

/// What settlement knows about one run's output.
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct UsageRequest {
    /// The command the launch ran, as prepared (a name or a path); `None` when no prepared invocation names it.
    pub command: Option<String>,
    /// The seat ran in a pane: its stdout is a screen dump, not the CLI's stream.
    #[serde(default)]
    pub pane: bool,
    #[serde(default)]
    pub stdout: String,
    #[serde(default)]
    pub stderr: String,
    pub claude_session: Option<ClaudeSession>,
}

/// The CLI a command names: its basename (without a Windows `.exe`), matched exactly.
fn cli_of(command: Option<&str>) -> Option<&'static str> {
    let base = command?.rsplit(['/', '\\']).next()?;
    let base = base.strip_suffix(".exe").unwrap_or(base);
    ["claude", "codex", "pi", "omp", "agy"]
        .into_iter()
        .find(|cli| *cli == base)
}

/// The usage of one run.
pub fn parse(request: &UsageRequest) -> Usage {
    let (stdout, stderr, pane) = (&request.stdout, &request.stderr, request.pane);
    match cli_of(request.command.as_deref()) {
        Some("claude") => claude::parse(stdout, request.claude_session.as_ref()),
        Some("agy") => agy::parse(stdout),
        Some("codex") => codex::parse(stderr).unwrap_or_else(|| {
            Usage::absent(
                "codex-cli",
                if pane {
                    "no-count-in-screen"
                } else {
                    "footer-missing"
                },
            )
        }),
        Some(cli) => pi::parse(stdout, cli).unwrap_or_else(|| {
            Usage::absent(
                cli,
                if pane {
                    "no-structured-output"
                } else {
                    pi::absent_reason(stdout)
                },
            )
        }),
        // No prepared command: read the output by its shape.
        None => pi::parse(stdout, "pi")
            .or_else(|| codex::parse(stderr))
            .unwrap_or_else(|| Usage::absent("unsupported", "unsupported-cli")),
    }
}
