import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { checkSeqContiguity } from "../../scripts/check-events-seq-contiguity.mjs";

function mk(seq) {
  return JSON.stringify({ seq, ts: "2026-01-01T00:00:00.000Z", type: "work.edit", payload: { id: "w1" }, v: 2 });
}

function cleanFixture(n = 10) {
  return Array.from({ length: n }, (_, i) => mk(i + 1)).join("\n") + "\n";
}

test("checkSeqContiguity accepts a clean, contiguous log", () => {
  const { totalLines, lastSeq } = checkSeqContiguity(cleanFixture(10));
  assert.equal(totalLines, 10);
  assert.equal(lastSeq, 10);
});

test("checkSeqContiguity throws on a duplicate seq", () => {
  const lines = cleanFixture(5).trimEnd().split("\n");
  lines[3] = mk(3); // line 4 repeats seq 3 instead of 4
  assert.throws(() => checkSeqContiguity(lines.join("\n") + "\n"), /seq break at line 4 -- expected 4, got 3/);
});

test("checkSeqContiguity throws on a forward jump", () => {
  const lines = cleanFixture(5).trimEnd().split("\n");
  lines[3] = mk(13); // line 4 jumps ahead instead of continuing at 4
  assert.throws(() => checkSeqContiguity(lines.join("\n") + "\n"), /seq break at line 4 -- expected 4, got 13/);
});

test("checkSeqContiguity skips lines with no numeric seq, never a break", () => {
  const raw = [mk(1), mk(2), JSON.stringify({ ts: "2026-01-01T00:00:00.000Z", type: "note", payload: {} }), mk(3)].join("\n") + "\n";
  const { lastSeq } = checkSeqContiguity(raw);
  assert.equal(lastSeq, 3);
});

test("checkSeqContiguity throws on a line that does not parse as JSON", () => {
  const raw = [mk(1), "not json", mk(3)].join("\n") + "\n";
  assert.throws(() => checkSeqContiguity(raw), /line 2 of 3 does not parse as JSON/);
});

test("CLI exits 0 on a clean fixture, prints totalLines/lastSeq", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "seq-contiguity-good-"));
  const logPath = path.join(dir, "events.jsonl");
  fs.writeFileSync(logPath, cleanFixture(10));
  const out = execFileSync("node", [path.join(import.meta.dirname, "../../scripts/check-events-seq-contiguity.mjs"), "--log", logPath], {
    encoding: "utf8",
  });
  const report = JSON.parse(out);
  assert.equal(report.totalLines, 10);
  assert.equal(report.lastSeq, 10);
});

test("CLI exits non-zero on a corrupted fixture, never silently passes", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "seq-contiguity-bad-"));
  const logPath = path.join(dir, "events.jsonl");
  const lines = cleanFixture(5).trimEnd().split("\n");
  lines[3] = mk(13);
  fs.writeFileSync(logPath, lines.join("\n") + "\n");
  assert.throws(() =>
    execFileSync("node", [path.join(import.meta.dirname, "../../scripts/check-events-seq-contiguity.mjs"), "--log", logPath], {
      stdio: "pipe",
    }),
  );
});
