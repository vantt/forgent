use std::cell::Cell;
use std::fs;
use std::path::{Path, PathBuf};
use std::rc::Rc;

use fgos_agent_protocol::terminal::{adapter_for, ExitCommand, FsOutbox, Outbox, Readiness};
use fgos_agent_protocol::{AgentIo, Inspection, IoError, SendInput};
use serde_json::{json, Value};

const CLIS: [&str; 5] = ["claude", "codex", "agy", "pi", "omp"];

fn fixture_dir(cli: &str) -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../contracts/fixtures/terminal")
        .join(cli)
}

/// One moment of the pane: what the screen, the detector and the outbox show
/// from `at` milliseconds on. A field a frame leaves out keeps its last value.
#[derive(Clone, Default)]
struct Frame {
    at: u64,
    screen: String,
    inspection: Inspection,
    result: Option<String>,
}

fn inspection_from(value: &Value) -> Inspection {
    Inspection {
        state: value["state"].as_str().map(str::to_string),
        visible_blocker: value["visibleBlocker"].as_bool().unwrap_or(false),
        visible_idle: value["visibleIdle"].as_bool().unwrap_or(false),
        visible_working: value["visibleWorking"].as_bool().unwrap_or(false),
        matched_rule: value["matchedRule"].is_string() || value["matchedRule"] == json!(true),
        prompt_text: value["promptText"].as_str().unwrap_or_default().to_string(),
    }
}

fn frames_of(cli: &str, script: &Value) -> Vec<Frame> {
    let dir = fixture_dir(cli);
    let mut frames: Vec<Frame> = Vec::new();
    for spec in script["frames"].as_array().expect("script.frames") {
        let mut frame = frames.last().cloned().unwrap_or_default();
        frame.at = spec["at"].as_u64().unwrap_or(0);
        if let Some(name) = spec["file"].as_str() {
            frame.screen = fs::read_to_string(dir.join(format!("{name}.txt"))).unwrap();
            let insp = dir.join(format!("{name}.insp.json"));
            if insp.exists() {
                frame.inspection = inspection_from(
                    &serde_json::from_str(&fs::read_to_string(insp).unwrap()).unwrap(),
                );
            }
        }
        if let Some(text) = spec["screen"].as_str() {
            frame.screen = text.to_string();
        }
        if spec.get("inspection").is_some() {
            let mut merged = json!({
                "state": frame.inspection.state, "visibleBlocker": frame.inspection.visible_blocker,
                "visibleIdle": frame.inspection.visible_idle, "visibleWorking": frame.inspection.visible_working,
                "matchedRule": frame.inspection.matched_rule, "promptText": frame.inspection.prompt_text,
            });
            for (key, value) in spec["inspection"].as_object().unwrap() {
                merged[key] = value.clone();
            }
            frame.inspection = inspection_from(&merged);
        }
        if spec.get("result").is_some() {
            frame.result = spec["result"].as_str().map(str::to_string);
        }
        frames.push(frame);
    }
    frames
}

struct ScriptedPane {
    frames: Vec<Frame>,
    now: Rc<Cell<u64>>,
    sent: Vec<SendInput>,
    fail_text_sends: usize,
}

impl ScriptedPane {
    fn frame(&self) -> &Frame {
        self.frames
            .iter()
            .rev()
            .find(|f| f.at <= self.now.get())
            .unwrap_or(&self.frames[0])
    }
}

impl AgentIo for ScriptedPane {
    fn send(&mut self, input: &SendInput) -> Result<(), IoError> {
        if input.text.is_some() && self.fail_text_sends > 0 {
            self.fail_text_sends -= 1;
            self.sent.push(input.clone());
            return Err(IoError::Io("send refused".into()));
        }
        self.sent.push(input.clone());
        Ok(())
    }
    fn read(&mut self) -> Result<Vec<String>, IoError> {
        Ok(self.frame().screen.lines().map(str::to_string).collect())
    }
    fn activity(&self) -> Option<u64> {
        None
    }
    fn screen(&mut self) -> Result<String, IoError> {
        Ok(self.frame().screen.clone())
    }
    fn inspect(&mut self) -> Result<Inspection, IoError> {
        Ok(self.frame().inspection.clone())
    }
    fn now_ms(&self) -> u64 {
        self.now.get()
    }
    fn pause(&mut self, ms: u64) {
        self.now.set(self.now.get() + ms);
    }
}

/// The outbox as the frame at the pane's clock shows it.
struct ScriptedOutbox {
    frames: Vec<Frame>,
    now: Rc<Cell<u64>>,
}

impl Outbox for ScriptedOutbox {
    fn newest_complete(&mut self) -> Option<PathBuf> {
        let now = self.now.get();
        let frame = self
            .frames
            .iter()
            .rev()
            .find(|f| f.at <= now)
            .unwrap_or(&self.frames[0]);
        frame
            .result
            .as_ref()
            .map(|name| Path::new("/run/outbox").join(name))
    }
}

fn readiness_name(readiness: Readiness) -> &'static str {
    match readiness {
        Readiness::Ready => "ready",
        Readiness::Unverified => "unverified",
        Readiness::NoDetector => "no-detector",
        Readiness::Blocked(_) => "blocked",
        Readiness::NeedsHuman => "needs-human",
        Readiness::NotReady => "not-ready",
    }
}

fn sent_texts(pane: &ScriptedPane) -> usize {
    pane.sent.iter().filter(|s| s.text.is_some()).count()
}

fn submit_sends(pane: &ScriptedPane) -> usize {
    pane.sent.iter().filter(|s| s.text.is_some() && s.submit).count()
}

fn sent_enters(pane: &ScriptedPane) -> usize {
    pane.sent
        .iter()
        .filter(|s| s.keys.as_deref() == Some(&["Enter".to_string()][..]))
        .count()
}

/// Every key pressed other than Enter, in order.
fn sent_keys(pane: &ScriptedPane) -> Vec<String> {
    pane.sent
        .iter()
        .filter_map(|s| s.keys.as_ref())
        .flatten()
        .filter(|key| key.as_str() != "Enter")
        .cloned()
        .collect()
}

#[test]
fn terminal_every_cli_vector_resolves_as_recorded() {
    for cli in CLIS {
        let doc: Value = serde_json::from_str(
            &fs::read_to_string(fixture_dir(cli).join("vectors.json")).unwrap(),
        )
        .unwrap();
        let adapter = adapter_for(cli).unwrap();
        assert_eq!(adapter.cli(), cli);
        let vectors = doc["vectors"].as_array().unwrap();
        assert!(vectors.len() >= 8, "{cli} has too few vectors");
        for vector in vectors {
            let name = format!("{cli}: {}", vector["name"]);
            let expect = &vector["expect"];
            let clock = Rc::new(Cell::new(0));
            let frames = frames_of(cli, &vector["script"]);
            let mut outbox = ScriptedOutbox {
                frames: frames.clone(),
                now: clock.clone(),
            };
            let mut pane = ScriptedPane {
                frames,
                now: clock,
                sent: vec![],
                fail_text_sends: vector["script"]["failTextSends"].as_u64().unwrap_or(0) as usize,
            };
            let message = vector["message"]
                .as_str()
                .unwrap_or("Read the brief file and do the task.");
            let got: Value = match vector["step"].as_str().unwrap() {
                "await-ready" => {
                    let readiness = adapter
                        .await_ready(&mut pane, vector["readyMs"].as_u64().unwrap_or(20_000));
                    if let Some(want) = expect["readiness"].as_str() {
                        assert_eq!(readiness_name(readiness), want, "{name}");
                    }
                    assert_eq!(
                        sent_texts(&pane),
                        0,
                        "{name}: nothing is typed while waiting"
                    );
                    readiness.outcome().to_json()
                }
                "deliver-brief" => adapter
                    .deliver_brief(&mut pane, message, &mut outbox)
                    .to_json(),
                "detect-completed" => match adapter.detect_completed(&mut pane, &mut outbox) {
                    Some(outcome) => outcome.to_json(),
                    None => json!({ "outcome": "none" }),
                },
                "classify-blocked" => {
                    let reason = adapter.classify_blocked(&pane.frame().screen);
                    match reason {
                        Some(reason) => json!({ "outcome": "blocked", "reason": reason.as_str() }),
                        None => json!({ "outcome": "none" }),
                    }
                }
                "exit-command" => match adapter.exit_command() {
                    ExitCommand::Text(text) => json!({ "outcome": "exit", "text": text }),
                    ExitCommand::Keys(keys) => json!({ "outcome": "exit", "keys": keys }),
                },
                other => panic!("{name}: unknown step {other}"),
            };
            let mut want = expect.clone();
            if let Some(map) = want.as_object_mut() {
                for key in ["readiness", "sentTexts", "sentKeys", "submitSends", "minEnters", "maxEnters"] {
                    map.remove(key);
                }
            }
            if let Some(file) = want
                .get("resultFile")
                .and_then(Value::as_str)
                .map(str::to_string)
            {
                want["resultPath"] = json!(Path::new("/run/outbox").join(file).to_string_lossy());
                want.as_object_mut().unwrap().remove("resultFile");
            }
            assert_eq!(got, want, "{name}");
            if let Some(count) = expect["sentTexts"].as_u64() {
                assert_eq!(sent_texts(&pane) as u64, count, "{name}: typed brief count");
            }
            if let Some(keys) = expect["sentKeys"].as_array() {
                let want: Vec<&str> = keys.iter().filter_map(Value::as_str).collect();
                assert_eq!(sent_keys(&pane), want, "{name}: non-Enter key presses");
            }
            if let Some(count) = expect["submitSends"].as_u64() {
                assert_eq!(submit_sends(&pane) as u64, count, "{name}: prompt-door send count");
            }
            if let Some(min) = expect["minEnters"].as_u64() {
                assert!(
                    sent_enters(&pane) as u64 >= min,
                    "{name}: Enter presses {}",
                    sent_enters(&pane)
                );
            }
            if let Some(max) = expect["maxEnters"].as_u64() {
                assert!(
                    sent_enters(&pane) as u64 <= max,
                    "{name}: Enter presses {}",
                    sent_enters(&pane)
                );
            }
        }
    }
}

fn scratch_dir(tag: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("agent-protocol-{tag}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    dir
}

#[test]
fn terminal_a_result_file_counts_only_once_it_is_complete_json() {
    let dir = scratch_dir("outbox");
    let mut outbox = FsOutbox::new(&dir);
    assert_eq!(
        outbox.newest_complete(),
        None,
        "an empty outbox has no result"
    );

    // pi creates the file empty and fills it a moment later.
    fs::write(dir.join("result-1.json"), "").unwrap();
    assert_eq!(
        outbox.newest_complete(),
        None,
        "a 0-byte file is not a result"
    );
    fs::write(dir.join("result-1.json"), "{\"status\":\"do").unwrap();
    assert_eq!(
        outbox.newest_complete(),
        None,
        "a half-written file is not a result"
    );
    fs::write(dir.join("result-1.json"), "{\"status\":\"done\"}\n").unwrap();
    assert_eq!(outbox.newest_complete(), Some(dir.join("result-1.json")));

    // claude's temp name is never a result; a newer incomplete result hides nothing it has not earned.
    fs::write(
        dir.join("result-2.json.tmp.123.ab"),
        "{\"status\":\"done\"}",
    )
    .unwrap();
    assert_eq!(outbox.newest_complete(), Some(dir.join("result-1.json")));
    fs::write(dir.join("result-2.json"), "").unwrap();
    assert_eq!(
        outbox.newest_complete(),
        None,
        "the newest result is still being written"
    );
    fs::write(dir.join("result-2.json"), "[1]").unwrap();
    assert_eq!(outbox.newest_complete(), None, "a result is a JSON object");
    fs::write(dir.join("result-2.json"), "{}").unwrap();
    assert_eq!(outbox.newest_complete(), Some(dir.join("result-2.json")));
    fs::remove_dir_all(&dir).unwrap();
}

#[test]
fn terminal_unknown_cli_has_no_adapter() {
    assert!(adapter_for("gemini").is_none());
    assert!(adapter_for(" Claude ").is_some());
}

mod terminal_matchers {
    use fgos_agent_protocol::terminal::common::{
        draft_still_in_composer, has_paste_chip, has_working_tail,
    };

    #[test]
    fn paste_chips_in_every_wording_the_clis_draw() {
        for chip in [
            "[Pasted text #1 +42 lines]",
            "[paste #1 +42 lines]",
            "[PASTE #12]",
            "[Paste]",
            "#3 … +9 lines",
            "#3 ... +9 lines",
            "Pasted 105 lines\nAttach as a wrapped block",
            "╰─ 📄 #1",
            "📄#2",
        ] {
            assert!(has_paste_chip(chip), "{chip}");
        }
        for plain in [
            "Pasted text",
            "[paste]",
            "#12 lines",
            "paste #1 +4 lines",
            "[paste #]",
            "[paste #1 ]",
            "Pasted lines",
        ] {
            let expected = plain == "[paste]";
            assert_eq!(has_paste_chip(plain), expected, "{plain}");
        }
    }

    #[test]
    fn working_indicators_on_the_bottom_of_the_screen() {
        for working in [
            "── ⠴ Working",
            "Working…",
            "Working...",
            "esc to interrupt",
            "Esc to cancel",
            "x (esc to interrupt)",
        ] {
            assert!(has_working_tail(working), "{working}");
        }
        for idle in [
            "Worked for 2s",
            "networking...",
            "esc to interrupted",
            "Working on it",
            "──  Working",
        ] {
            assert!(!has_working_tail(idle), "{idle}");
        }
    }

    #[test]
    fn draft_detection_ignores_history_that_scrolled_above_the_composer() {
        let brief = format!(
            "# Brief 1\n\n## Your task\n{}",
            (0..40)
                .map(|i| format!("line {i}"))
                .collect::<Vec<_>>()
                .join("\n")
        );
        assert!(draft_still_in_composer(
            &brief,
            "❯ [Pasted text #1 +42 lines]",
            ""
        ));
        assert!(draft_still_in_composer(
            &brief,
            "",
            "header\n[paste #1 +42 lines]\n? for shortcuts"
        ));
        assert!(draft_still_in_composer(
            &brief,
            "",
            "Pasted 105 lines\nAttach as a wrapped block"
        ));
        let historical = "❯ [Pasted text #1 +42 lines]\n● Reading files...\n● Done.\nline 1\nline 2\nline 3\nline 4\nline 5\n❯ ";
        assert!(!draft_still_in_composer(&brief, "❯ ", historical));
        let omp = " π > ◑ Gemini 3.8 Flash > 🌳 repo > ⑂ main > (sub) ▶─1%─\n╰─ 📄 #1";
        assert!(draft_still_in_composer(
            "Read the brief file and do the task.",
            "",
            omp
        ));
        assert!(draft_still_in_composer(
            "Read the brief file and do the task.",
            "📄 #1 📄 #2",
            ""
        ));
        assert!(!draft_still_in_composer(
            "Read the brief file and do the task.",
            "",
            " ⠴ 4s > ◑ Gemini 3.8 Flash\n╰─"
        ));
    }
}

#[test]
fn unreadable_results_exclude_empty_and_completed_publications_and_track_edits() {
    let dir = scratch_dir("unreadable");
    let path = dir.join("result-1.json");
    let mut outbox = FsOutbox::new(&dir);
    assert!(outbox.newest_unreadable().is_none());
    fs::write(&path, "").unwrap();
    assert!(outbox.newest_unreadable().is_none());
    fs::write(&path, "{\"summary\":\"raw\nnewline\"}").unwrap();
    let first = outbox.newest_unreadable().unwrap();
    assert_eq!(outbox.newest_unreadable(), Some(first.clone()));
    fs::write(&path, "[1]").unwrap();
    assert_ne!(outbox.newest_unreadable(), Some(first));
    fs::write(&path, "{}").unwrap();
    assert!(outbox.newest_unreadable().is_none());
    assert_eq!(outbox.newest_complete(), Some(path));
    fs::remove_dir_all(dir).unwrap();
}

/// Runs one outbox read on its own thread and reports whether it finished within
/// `limit`; a read stuck on a FIFO is released afterwards by opening the FIFO's
/// writer side, so a red run fails fast and leaves no blocked thread behind.
#[cfg(unix)]
fn outbox_read_finishes_within<T: Send + 'static>(
    fifo: &Path,
    limit: std::time::Duration,
    read: impl FnOnce() -> T + Send + 'static,
) -> Option<T> {
    let (done, finished) = std::sync::mpsc::channel();
    let reader = std::thread::spawn(move || {
        let _ = done.send(read());
    });
    let answer = finished.recv_timeout(limit).ok();
    if answer.is_none() {
        drop(fs::OpenOptions::new().write(true).open(fifo));
    }
    let _ = reader.join();
    answer
}

#[cfg(unix)]
#[test]
fn a_fifo_named_like_a_result_is_never_read_and_both_outbox_reads_return_none_promptly() {
    let dir = scratch_dir("fifo-result");
    let fifo = dir.join("result-1.json");
    let made = std::process::Command::new("mkfifo").arg(&fifo).status().unwrap();
    assert!(made.success(), "mkfifo failed");
    let limit = std::time::Duration::from_secs(2);

    let complete_dir = dir.clone();
    let complete = outbox_read_finishes_within(&fifo, limit, move || FsOutbox::new(complete_dir).newest_complete());
    let unreadable_dir = dir.clone();
    let unreadable = outbox_read_finishes_within(&fifo, limit, move || FsOutbox::new(unreadable_dir).newest_unreadable());
    assert_eq!(
        (complete, unreadable.map(|found| found.is_some())),
        (Some(None), Some(false)),
        "(newest_complete, newest_unreadable found) on a FIFO result; None = still blocked after 2 s"
    );
    fs::remove_dir_all(dir).unwrap();
}

/// Larger than any result claim an agent writes; the outbox's result size cap
/// (`MAX_RESULT_BYTES` once defined) sits below it.
const OVERSIZED_RESULT_BYTES: usize = 16 * 1024 * 1024 + 1;

#[test]
fn an_oversized_result_file_is_not_taken_as_complete() {
    let dir = scratch_dir("oversized-result");
    let padding = "a".repeat(OVERSIZED_RESULT_BYTES);
    fs::write(dir.join("result-1.json"), format!("{{\"status\":\"done\",\"pad\":\"{padding}\"}}")).unwrap();
    assert_eq!(FsOutbox::new(&dir).newest_complete(), None, "an oversized result was read whole and accepted");
    fs::remove_dir_all(dir).unwrap();
}

/// A pane whose attempt starts ending at the first pause after the brief went in:
/// from then on every call is refused, as the supervisor's pane access does.
struct EndingPane {
    now: u64,
    ending: bool,
    accepted: Vec<SendInput>,
    refused: usize,
}

impl EndingPane {
    fn new() -> Self {
        Self { now: 0, ending: false, accepted: vec![], refused: 0 }
    }

    fn gate(&mut self) -> Result<(), IoError> {
        if self.ending {
            self.refused += 1;
            return Err(IoError::Io("the attempt is ending".into()));
        }
        Ok(())
    }
}

impl AgentIo for EndingPane {
    fn send(&mut self, input: &SendInput) -> Result<(), IoError> {
        self.gate()?;
        self.accepted.push(input.clone());
        Ok(())
    }
    fn read(&mut self) -> Result<Vec<String>, IoError> {
        Err(IoError::Unsupported)
    }
    fn activity(&self) -> Option<u64> {
        None
    }
    fn screen(&mut self) -> Result<String, IoError> {
        self.gate()?;
        Ok("ready".into())
    }
    fn inspect(&mut self) -> Result<Inspection, IoError> {
        self.gate()?;
        Ok(Inspection { state: Some("idle".into()), ..Default::default() })
    }
    fn now_ms(&self) -> u64 {
        self.now
    }
    fn pause(&mut self, ms: u64) {
        self.now += ms;
        if !self.accepted.is_empty() {
            self.ending = true;
        }
    }
}

struct NoOutbox;

impl Outbox for NoOutbox {
    fn newest_complete(&mut self) -> Option<PathBuf> {
        None
    }
}

#[test]
fn terminal_delivery_sends_nothing_once_the_attempt_is_ending() {
    for cli in CLIS {
        let adapter = adapter_for(cli).unwrap();
        let mut pane = EndingPane::new();
        let outcome = adapter.deliver_brief(&mut pane, "Read the brief file and do the task.", &mut NoOutbox);
        assert_eq!(outcome.to_json(), json!({ "outcome": "delivery-unknown" }), "{cli}");
        assert_eq!(pane.accepted.len(), 1, "{cli}: only the brief itself went in before the stop");
        assert!(pane.accepted.iter().all(|s| s.text.is_some()), "{cli}: no key press after the stop");
    }
}

#[test]
fn terminal_delivery_into_an_attempt_that_is_already_ending_types_nothing() {
    for cli in CLIS {
        let adapter = adapter_for(cli).unwrap();
        let mut pane = EndingPane::new();
        pane.ending = true;
        let outcome = adapter.deliver_brief(&mut pane, "Read the brief file and do the task.", &mut NoOutbox);
        assert_eq!(outcome.to_json(), json!({ "outcome": "delivery-unknown" }), "{cli}");
        assert!(pane.accepted.is_empty(), "{cli}: nothing reaches the pane");
    }
}
