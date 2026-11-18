//! Token usage per CLI, from the survey's real samples (`tests/fixtures/usage`); one proof per CLI plus the reason
//! when counts are absent.
use fgos_run_result::usage::{parse, ClaudeSession, Usage, UsageRequest};
use std::path::{Path, PathBuf};

fn fixture(name: &str) -> String {
    std::fs::read_to_string(
        Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("tests/fixtures/usage")
            .join(name),
    )
    .unwrap()
}

fn run(command: &str, stdout: &str, stderr: &str) -> Usage {
    parse(&UsageRequest {
        command: Some(command.to_string()),
        stdout: stdout.to_string(),
        stderr: stderr.to_string(),
        ..UsageRequest::default()
    })
}

const PI_STREAM: &str = concat!(
    r#"{"type":"message_end","message":{"role":"assistant","responseId":"r1","usage":{"input":317,"output":5,"cacheRead":30592,"cacheWrite":0,"reasoning":0,"totalTokens":30914}}}"#,
    "\n",
    r#"{"type":"message_end","message":{"role":"assistant","responseId":"r1","usage":{"input":317,"output":5,"cacheRead":30592,"cacheWrite":0,"totalTokens":30914}}}"#,
    "\n",
    r#"{"type":"message_end","message":{"role":"assistant","responseId":"r2","usage":{"input":2278,"output":359,"cacheRead":27776,"cacheWrite":0,"reasoningTokens":100,"totalTokens":30413}}}"#,
    "\n",
);

#[test]
fn pi_dedupes_turns_by_response_and_reads_both_reasoning_keys() {
    let u = run("pi", PI_STREAM, "");
    assert_eq!(u.source, "pi");
    assert_eq!(u.input_tokens, Some(317 + 2278));
    assert_eq!(u.cache_read_tokens, Some(30592 + 27776));
    assert_eq!(u.total_tokens, Some(30914 + 30413));
    assert_eq!(u.reasoning_tokens, Some(100));
    assert_eq!(u.reason, None);
}

#[test]
fn pi_sums_real_multi_turn_streams_with_or_without_agent_end() {
    let u = run("pi", &fixture("pi-multiturn-normal.jsonl"), "");
    assert_eq!(
        (u.input_tokens, u.output_tokens),
        (Some(12924 + 14083), Some(391 + 172))
    );
    assert_eq!(
        (u.cache_read_tokens, u.cache_creation_tokens),
        (Some(512 + 640), Some(0))
    );
    assert_eq!(u.total_tokens, Some(13827 + 14895));
    let u = run("omp", &fixture("pi-multiturn-no-agent-end.jsonl"), "");
    assert_eq!(u.source, "omp");
    assert_eq!(
        (u.input_tokens, u.output_tokens),
        (Some(13459 + 14153), Some(415 + 233))
    );
    assert_eq!(u.total_tokens, Some(13874 + 14898));
}

#[test]
fn a_rate_limited_all_zero_turn_is_reported_zero_not_unknown() {
    let u = run("pi", &fixture("pi-codex-rate-limit.jsonl"), "");
    assert_eq!(u.total_tokens, Some(0));
    assert_eq!(u.reason.as_deref(), Some("reported-zero"));
}

#[test]
fn a_count_no_turn_reported_stays_unknown() {
    let s = r#"{"type":"message_end","message":{"role":"assistant","id":"a","usage":{"input":4,"output":2}}}"#;
    let u = run("pi", s, "");
    assert_eq!((u.input_tokens, u.total_tokens), (Some(4), Some(6)));
    assert_eq!((u.cache_read_tokens, u.reasoning_tokens), (None, None));
    let empty = r#"{"type":"message_end","message":{"role":"assistant","id":"a","usage":{}}}"#;
    let u = run("pi", empty, "");
    assert_eq!(
        (u.total_tokens, u.reason),
        (None, None),
        "no count is not a reported zero"
    );
}

#[test]
fn codex_reads_only_the_final_stderr_footer() {
    for (file, total) in [
        ("codex-cli-normal.stderr.log", 75387),
        ("codex-cli-grep-tokens-used.stderr.log", 80961),
        ("codex-cli-nested-tokens-used.stderr.log", 84606),
    ] {
        let u = run("codex", "", &fixture(file));
        assert_eq!(
            (u.source.as_str(), u.total_tokens, u.input_tokens),
            ("codex-cli", Some(total), None),
            "{file}"
        );
    }
    let footer_not_last = "tokens used\n12\nmore output\nfooter-less\n";
    assert_eq!(
        run("codex", "", footer_not_last).reason.as_deref(),
        Some("footer-missing")
    );
}

#[test]
fn the_cli_is_the_command_basename_matched_exactly_never_the_executor_id() {
    assert_eq!(run("/usr/local/bin/pi", PI_STREAM, "").source, "pi");
    assert_eq!(run("C:\\tools\\omp.exe", PI_STREAM, "").source, "omp");
    // A name that merely contains a CLI name is no CLI: the output is read by its shape.
    for name in ["copilot", "api", "openai"] {
        let u = run(name, PI_STREAM, "");
        assert_eq!(
            (u.source.as_str(), u.input_tokens),
            ("pi", Some(2595)),
            "{name}"
        );
        assert_eq!(
            run(name, "", "").reason.as_deref(),
            Some("unsupported-cli"),
            "{name}"
        );
    }
    let unnamed = parse(&UsageRequest {
        stderr: fixture("codex-cli-normal.stderr.log"),
        ..UsageRequest::default()
    });
    assert_eq!(unnamed.source, "codex-cli");
}

#[test]
fn a_pane_run_names_its_pane_reason() {
    let pane = |command: &str| {
        parse(&UsageRequest {
            command: Some(command.to_string()),
            pane: true,
            stdout: "screen dump".to_string(),
            ..UsageRequest::default()
        })
        .reason
    };
    assert_eq!(pane("codex").as_deref(), Some("no-count-in-screen"));
    assert_eq!(pane("pi").as_deref(), Some("no-structured-output"));
    assert_eq!(pane("agy").as_deref(), Some("agy-exposes-no-counts"));
}

#[test]
fn counts_absent_name_their_reason() {
    assert_eq!(
        run("claude", "plain text", "").reason.as_deref(),
        Some("no-structured-output")
    );
    assert_eq!(
        run("agy", "screen", "").reason.as_deref(),
        Some("agy-exposes-no-counts")
    );
    assert_eq!(
        run("pi", "screen dump", "").reason.as_deref(),
        Some("no-structured-output")
    );
    assert_eq!(
        run("pi", r#"{"type":"session"}"#, "").reason.as_deref(),
        Some("no-assistant-turns")
    );
    assert_eq!(run("pi", "screen dump", "").total_tokens, None);
}

#[test]
fn claude_json_result_is_read_when_no_transcript_is_known() {
    let out = r#"{"total_cost_usd":0.00967726,"usage":{"input_tokens":2,"cache_creation_input_tokens":47770,"cache_read_input_tokens":12106,"output_tokens":4}}"#;
    let u = run("claude", out, "");
    assert_eq!(
        (u.source.as_str(), u.total_tokens),
        ("claude-json", Some(59882))
    );
}

const S1: &str = "0b5b8a5e-1c1d-4b1e-9a7f-2f6f0c7d1a01";
const S2: &str = "0b5b8a5e-1c1d-4b1e-9a7f-2f6f0c7d1a02";

/// A `projects` tree as claude writes it: one session of the run inside the window, one older session.
fn projects_tree() -> PathBuf {
    let root = std::env::temp_dir().join(format!(
        "usage-claude-{}-{:?}",
        std::process::id(),
        std::thread::current().id()
    ));
    let _ = std::fs::remove_dir_all(&root);
    let dir = root.join("projects").join("-work-repo-a");
    std::fs::create_dir_all(&dir).unwrap();
    let line = |ts: &str, id: &str| {
        format!(
            r#"{{"type":"assistant","timestamp":"{ts}","message":{{"id":"{id}","usage":{{"input_tokens":2,"cache_creation_input_tokens":47770,"cache_read_input_tokens":12106,"output_tokens":4}}}}}}"#
        )
    };
    let run = [
        r#"{"type":"user","timestamp":"2026-11-18T10:00:01.000Z","message":{"role":"user"}}"#
            .to_string(),
        line("2026-11-18T10:00:02.000Z", "m1"),
        line("2026-11-18T10:00:03.000Z", "m1"),
        line("2026-11-18T10:00:04.000Z", "m2"),
    ];
    std::fs::write(dir.join(format!("{S1}.jsonl")), run.join("\n") + "\n").unwrap();
    std::fs::write(
        dir.join(format!("{S2}.jsonl")),
        line("2026-11-17T09:00:00.000Z", "old") + "\n",
    )
    .unwrap();
    std::fs::create_dir_all(dir.join("memory")).unwrap();
    root
}

fn claude(root: &Path, cwd: &str, session_id: Option<&str>, window: (&str, &str)) -> Usage {
    parse(&UsageRequest {
        command: Some("claude".to_string()),
        stdout: "plain text".to_string(),
        claude_session: Some(ClaudeSession {
            projects_dir: root.join("projects").to_string_lossy().into_owned(),
            cwd: cwd.to_string(),
            session_id: session_id.map(str::to_string),
            started_at: Some(window.0.to_string()),
            ended_at: Some(window.1.to_string()),
        }),
        ..UsageRequest::default()
    })
}

#[test]
fn claude_reads_the_transcript_once_per_message_by_session_id_or_run_window() {
    let root = projects_tree();
    let window = ("2026-11-18T10:00:00.000Z", "2026-11-18T10:05:00.000Z");
    for session_id in [Some(S1), None] {
        let u = claude(&root, "/work/repo.a", session_id, window);
        assert_eq!(u.source, "transcript", "{session_id:?}");
        assert_eq!((u.input_tokens, u.output_tokens), (Some(4), Some(8)));
        assert_eq!(u.cache_read_tokens, Some(24212));
        assert_eq!(u.total_tokens, Some(4 + 8 + 24212 + 95540));
    }
    // A window holding both sessions cannot tell them apart: nothing is guessed.
    let wide = claude(
        &root,
        "/work/repo.a",
        None,
        ("2026-11-17T00:00:00.000Z", window.1),
    );
    assert_eq!(wide.reason.as_deref(), Some("transcript-not-found"));
    std::fs::remove_dir_all(root).ok();
}

#[test]
fn claude_refuses_a_session_id_or_cwd_that_leaves_projects() {
    let root = projects_tree();
    let window = ("2026-11-18T10:00:00.000Z", "2026-11-18T10:05:00.000Z");
    std::fs::write(root.join("outside.jsonl"), "").unwrap();
    for (cwd, id) in [
        ("/work/repo.a", Some("../../outside")),
        ("/work/repo.a", Some("not-a-uuid")),
        ("/elsewhere", None),
        ("/work/repo.a", Some("0b5b8a5e-1c1d-4b1e-9a7f-2f6f0c7d1a09")),
    ] {
        assert_eq!(
            claude(&root, cwd, id, window).reason.as_deref(),
            Some("transcript-not-found"),
            "{cwd} {id:?}"
        );
    }
    #[cfg(unix)]
    {
        let dir = root.join("projects").join("-work-repo-a");
        std::fs::remove_file(dir.join(format!("{S1}.jsonl"))).unwrap();
        std::os::unix::fs::symlink(root.join("outside.jsonl"), dir.join(format!("{S1}.jsonl")))
            .unwrap();
        assert_eq!(
            claude(&root, "/work/repo.a", Some(S1), window)
                .reason
                .as_deref(),
            Some("transcript-not-found")
        );
    }
    std::fs::remove_dir_all(root).ok();
}
