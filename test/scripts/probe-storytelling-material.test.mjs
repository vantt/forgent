import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  gatherAskVista,
  gatherDecisionVista,
  groupById,
  formatReport,
  BOILERPLATE_RATIONALES,
} from "../../scripts/probe-storytelling-material.mjs";

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

// Fixture mirrors CONTEXT.md D4's five real boilerplate patterns (each
// repeated, so they are never singletons) plus two genuine single-occurrence
// rationales (the "real" material this probe exists to find) and one
// genuine non-boilerplate duplicate (to prove ordinary repeats are excluded
// too, not just the five named patterns).
function fixtureEvents() {
  const [pattern1, pattern2, pattern3, pattern4] = BOILERPLATE_RATIONALES;
  return [
    { seq: 1, ts: "2026-01-01T00:00:00.000Z", type: "work.move", payload: { id: "tsk-a1", to: "awaiting-human", ask: "vong 2 khong dong y voi vong 1 ve pham vi test" }, v: 2 },
    { seq: 2, ts: "2026-01-01T00:00:01.000Z", type: "work.move", payload: { id: "tsk-a1", to: "todo", answer: "gioi han lai pham vi" }, v: 2 },
    { seq: 3, ts: "2026-01-01T00:00:02.000Z", type: "work.move", payload: { id: "tsk-b2", to: "awaiting-human", ask: "" }, v: 2 },
    { seq: 4, ts: "2026-01-01T00:00:03.000Z", type: "work.move", payload: { id: "tsk-c3", to: "awaiting-human", ask: "co the dung thu vien X khong?" }, v: 2 },
    { seq: 5, ts: "2026-01-01T00:00:04.000Z", type: "decision", payload: { id: "tsk-a1", text: "D1", rationale: pattern1 }, v: 2 },
    { seq: 6, ts: "2026-01-01T00:00:05.000Z", type: "decision", payload: { id: "tsk-b2", text: "D1", rationale: pattern1 }, v: 2 },
    { seq: 7, ts: "2026-01-01T00:00:06.000Z", type: "decision", payload: { id: "tsk-c3", text: "D1", rationale: pattern2 }, v: 2 },
    { seq: 8, ts: "2026-01-01T00:00:07.000Z", type: "decision", payload: { id: "tsk-d4", text: "D1", rationale: pattern2 }, v: 2 },
    { seq: 9, ts: "2026-01-01T00:00:08.000Z", type: "decision", payload: { id: "tsk-e5", text: "D1", rationale: pattern3 }, v: 2 },
    { seq: 10, ts: "2026-01-01T00:00:09.000Z", type: "decision", payload: { id: "tsk-f6", text: "D1", rationale: pattern3 }, v: 2 },
    { seq: 11, ts: "2026-01-01T00:00:10.000Z", type: "decision", payload: { id: "tsk-g7", text: "D1", rationale: pattern4 }, v: 2 },
    { seq: 12, ts: "2026-01-01T00:00:11.000Z", type: "decision", payload: { id: "tsk-h8", text: "D1", rationale: pattern4 }, v: 2 },
    { seq: 13, ts: "2026-01-01T00:00:12.000Z", type: "decision", payload: { id: "tsk-i9", text: "D1" }, v: 2 },
    { seq: 14, ts: "2026-01-01T00:00:13.000Z", type: "decision", payload: { id: "tsk-j10", text: "D1" }, v: 2 },
    { seq: 15, ts: "2026-01-01T00:00:14.000Z", type: "decision", payload: { id: "tsk-k11", text: "D1", rationale: "vong 2 (kiem tra doc lap) khong dong y: test suite co the pass ma khong cover mot scenario cu the" }, v: 2 },
    { seq: 16, ts: "2026-01-01T00:00:15.000Z", type: "decision", payload: { id: "tsk-l12", text: "D1", rationale: "goal-check failed on branch fgw/tsk-puz (exit null), thu lai lan hai van fail cung ly do" }, v: 2 },
    { seq: 17, ts: "2026-01-01T00:00:16.000Z", type: "decision", payload: { id: "tsk-m13", text: "D1", rationale: "dung thu vien X thay vi Y vi Y khong ho tro streaming" }, v: 2 },
    { seq: 18, ts: "2026-01-01T00:00:17.000Z", type: "decision", payload: { id: "tsk-n14", text: "D1", rationale: "dung thu vien X thay vi Y vi Y khong ho tro streaming" }, v: 2 },
  ];
}

function writeFixture(dir) {
  const logPath = path.join(dir, "events.jsonl");
  const raw = `${fixtureEvents().map((e) => JSON.stringify(e)).join("\n")}\n`;
  fs.writeFileSync(logPath, raw, "utf8");
  return logPath;
}

test("gatherAskVista keeps only work.move events with a non-empty ask", () => {
  const asks = gatherAskVista(fixtureEvents());
  assert.equal(asks.length, 2);
  assert.deepEqual(
    asks.map((a) => a.id),
    ["tsk-a1", "tsk-c3"],
  );
});

test("gatherDecisionVista excludes the four named boilerplate patterns and missing rationales", () => {
  const vista = gatherDecisionVista(fixtureEvents());
  assert.equal(vista.totalDecisionEvents, 14);
  assert.equal(vista.totalWithRationale, 12);
  assert.equal(vista.boilerplateCounts["(missing rationale)"], 2);
  for (const pattern of BOILERPLATE_RATIONALES) {
    assert.equal(vista.boilerplateCounts[pattern], 2, `expected pattern "${pattern.slice(0, 40)}..." to count 2`);
  }
});

test("gatherDecisionVista's singletons exclude ordinary (non-boilerplate) duplicates too", () => {
  const vista = gatherDecisionVista(fixtureEvents());
  const rationales = vista.singletons.map((d) => d.rationale);
  assert.ok(!rationales.includes("dung thu vien X thay vi Y vi Y khong ho tro streaming"), "a duplicate real rationale must not appear as a singleton");
});

test("gatherDecisionVista's singletons keep only the genuinely once-occurring real material", () => {
  const vista = gatherDecisionVista(fixtureEvents());
  assert.equal(vista.singletons.length, 2);
  const ids = vista.singletons.map((d) => d.id).sort();
  assert.deepEqual(ids, ["tsk-k11", "tsk-l12"]);
});

test("groupById groups readable entries by their work item id, preserving order", () => {
  const grouped = groupById([
    { id: "tsk-x", n: 1 },
    { id: "tsk-y", n: 2 },
    { id: "tsk-x", n: 3 },
  ]);
  assert.deepEqual([...grouped.keys()], ["tsk-x", "tsk-y"]);
  assert.equal(grouped.get("tsk-x").length, 2);
});

test("formatReport is grouped, readable text — not a flat unstructured stream", () => {
  const rawEvents = fixtureEvents();
  const report = formatReport({
    logPath: "/fake/events.jsonl",
    totalEvents: rawEvents.length,
    askVista: gatherAskVista(rawEvents),
    decisionVista: gatherDecisionVista(rawEvents),
  });
  assert.match(report, /Vista \(a\)/);
  assert.match(report, /Vista \(b\)/);
  assert.match(report, /\[tsk-a1\]/);
  assert.match(report, /\[tsk-k11\]/);
  assert.match(report, /Before filtering: 14 decision events/);
  assert.match(report, /After filtering: 2 singleton rationales remain/);
});

test("CLI reads a real events.jsonl via --log and prints both vistas, optionally writing --report", () => {
  const dir = mkTempDir("probe-storytelling-material-");
  const logPath = writeFixture(dir);
  const reportPath = path.join(dir, "report.md");

  const stdout = execFileSync(
    process.execPath,
    [path.join(process.cwd(), "scripts/probe-storytelling-material.mjs"), "--log", logPath, "--report", reportPath],
    { encoding: "utf8" },
  );

  assert.match(stdout, /Vista \(a\): ask\/question events \(2 total\)/);
  assert.match(stdout, /After filtering: 2 singleton rationales remain/);
  assert.ok(fs.existsSync(reportPath), "--report must write the report file");
  const reportContents = fs.readFileSync(reportPath, "utf8");
  assert.equal(`${reportContents}\n`, stdout, "the written report and stdout must be the same text");
  assert.match(reportContents, /Vista \(a\)/);
});
