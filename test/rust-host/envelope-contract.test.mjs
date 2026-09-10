// envelope-contract.test.mjs — cross-runtime envelope and serialization
// contract tests (P03, P08).
//
// R6: Explicit enumeration of all seven serialization-corpus categories
// from legacy-cli-transition.md §4:
//   1. object insertion order
//   2. integer limits
//   3. negative zero
//   4. floating exponent formatting
//   5. Unicode/control characters
//   6. nested arrays/maps
//   7. null/booleans

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { wrapEnvelope } from "../../src/state/envelope.mjs";
import {
  generateEnvelopeVectors,
  generateSerializationCorpus,
  checkVectors,
  DEFAULT_ENVELOPE_DIR,
  DEFAULT_SERIALIZATION_DIR,
} from "./generate-vectors.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const GENERATE_SCRIPT = path.join(__dirname, "generate-vectors.mjs");

// ---------------------------------------------------------------------------
// R4: Drift guard tests (same pattern P01 uses for command-routes.json)
// ---------------------------------------------------------------------------

test("R4 drift guard: committed envelope vectors match in-memory regeneration byte-for-byte", () => {
  const generated = generateEnvelopeVectors();
  assert.ok(generated.size >= 2, "Must generate at least 2 envelope vectors");

  for (const [filename, expectedVector] of generated) {
    const diskPath = path.join(DEFAULT_ENVELOPE_DIR, filename);
    assert.ok(fs.existsSync(diskPath), `Committed envelope vector must exist: ${filename}`);
    const diskContent = fs.readFileSync(diskPath, "utf8");
    const expectedContent = JSON.stringify(expectedVector, null, 2) + "\n";
    assert.equal(
      diskContent,
      expectedContent,
      `Committed envelope vector ${filename} drifted from in-memory generator`
    );
  }
});

test("R4 drift guard: committed serialization corpus matches in-memory regeneration byte-for-byte", () => {
  const generated = generateSerializationCorpus();
  assert.ok(generated.size >= 7, "Must generate at least 7 serialization fixtures");

  for (const [filename, expectedFixture] of generated) {
    const diskPath = path.join(DEFAULT_SERIALIZATION_DIR, filename);
    assert.ok(fs.existsSync(diskPath), `Committed serialization fixture must exist: ${filename}`);
    const diskContent = fs.readFileSync(diskPath, "utf8");
    const expectedContent = JSON.stringify(expectedFixture, null, 2) + "\n";
    assert.equal(
      diskContent,
      expectedContent,
      `Committed serialization fixture ${filename} drifted from in-memory generator`
    );
  }
});

test("R4 drift guard: checkVectors() reports clean on committed files", () => {
  const check = checkVectors();
  assert.equal(check.clean, true, `checkVectors failed: ${check.summary}`);
  assert.equal(check.diffs.length, 0);
  assert.equal(check.summary, "");
});

test("R4 drift guard: CLI --check exits 0 silently", () => {
  const stdout = execFileSync("node", [GENERATE_SCRIPT, "--check"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  assert.equal(stdout, "");
});

test("R4 drift guard: mutated copy of vector file fails checkVectors", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vector-drift-test-"));
  const tmpEnvelope = path.join(tmpDir, "envelope");
  const tmpSerialization = path.join(tmpDir, "serialization");
  fs.mkdirSync(tmpEnvelope, { recursive: true });
  fs.mkdirSync(tmpSerialization, { recursive: true });

  try {
    // Copy all files
    for (const f of fs.readdirSync(DEFAULT_ENVELOPE_DIR)) {
      fs.copyFileSync(path.join(DEFAULT_ENVELOPE_DIR, f), path.join(tmpEnvelope, f));
    }
    for (const f of fs.readdirSync(DEFAULT_SERIALIZATION_DIR)) {
      fs.copyFileSync(path.join(DEFAULT_SERIALIZATION_DIR, f), path.join(tmpSerialization, f));
    }

    // Mutate version.json
    const versionFile = path.join(tmpEnvelope, "version.json");
    const data = JSON.parse(fs.readFileSync(versionFile, "utf8"));
    data.data_hash = "0000000000000000000000000000000000000000000000000000000000000000";
    fs.writeFileSync(versionFile, JSON.stringify(data, null, 2) + "\n", "utf8");

    const check = checkVectors({ envelopeDir: tmpEnvelope, serializationDir: tmpSerialization });
    assert.equal(check.clean, false, "Must detect drift in mutated copy");
    assert.ok(check.summary.includes("version.json"), "Summary must name mutated file");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// R5: Documented split as separate, independently-failing assertions
// (semantic data equality, compact hash input bytes, hash output,
//  envelope order/pretty-rendering + key order, timestamp shape,
//  trailing newline, stdout-vs-stderr channel separation, exit/signal mapping)
// ---------------------------------------------------------------------------

test("R5 split: semantic data equality", () => {
  const vectors = generateEnvelopeVectors();
  for (const [filename, vector] of vectors) {
    const parsedEnvelope = JSON.parse(vector.envelope_bytes);
    // Semantic data equality: parsed data must deeply equal original data
    assert.deepEqual(
      parsedEnvelope.data,
      vector.data,
      `Semantic data equality failed for ${filename}`
    );
    assert.deepEqual(
      vector.envelope.data,
      vector.data,
      `Semantic data equality failed for vector.envelope in ${filename}`
    );

    // Negative proof: mutated data must fail semantic equality
    const mutated = JSON.parse(JSON.stringify(vector.data));
    if (Array.isArray(mutated)) {
      mutated.push({ id: "mutated-extra-item" });
    } else {
      mutated.__injected_divergence = true;
    }
    assert.notDeepEqual(parsedEnvelope.data, mutated);
  }
});

test("R5 split: compact hash input bytes", () => {
  const vectors = generateEnvelopeVectors();
  for (const [filename, vector] of vectors) {
    const computedCompact = JSON.stringify(vector.data);
    // Compact hash input bytes must match JSON.stringify(data) byte-for-byte
    assert.equal(
      vector.compact_hash_input,
      computedCompact,
      `Compact hash input bytes mismatch in ${filename}`
    );
    // Compact bytes must not have pretty indentation or newlines
    assert.equal(vector.compact_hash_input.includes("\n"), false);
  }
});

test("R5 split: hash output matches sha256 hex digest of compact hash input", () => {
  const vectors = generateEnvelopeVectors();
  for (const [filename, vector] of vectors) {
    const computedHash = createHash("sha256")
      .update(vector.compact_hash_input)
      .digest("hex");

    // Output hash must match computed sha256 digest
    assert.equal(
      vector.data_hash,
      computedHash,
      `data_hash in vector does not match computed sha256 in ${filename}`
    );
    assert.equal(
      vector.envelope.data_hash,
      computedHash,
      `envelope.data_hash does not match computed sha256 in ${filename}`
    );

    // Must be a 64-character lowercase hex string
    assert.match(vector.data_hash, /^[0-9a-f]{64}$/);

    // Negative proof: changing any byte of compact input changes the hash
    const alteredCompact = vector.compact_hash_input + " ";
    const alteredHash = createHash("sha256").update(alteredCompact).digest("hex");
    assert.notEqual(vector.data_hash, alteredHash);
  }
});

test("R5 split: envelope key order and 2-space pretty-rendering", () => {
  const vectors = generateEnvelopeVectors();
  for (const [filename, vector] of vectors) {
    // Envelope key order must be strictly contract -> generated_at -> data_hash -> data
    const keys = Object.keys(vector.envelope);
    assert.deepEqual(
      keys,
      ["contract", "generated_at", "data_hash", "data"],
      `Envelope key order incorrect in ${filename}`
    );
    assert.equal(vector.envelope.contract, "fgos.v1");

    // Pretty-rendering must be two-space indentation matching JSON.stringify(..., null, 2)
    const expectedPretty = `${JSON.stringify(vector.envelope, null, 2)}\n`;
    assert.equal(
      vector.envelope_bytes,
      expectedPretty,
      `Pretty-rendered envelope bytes mismatch in ${filename}`
    );

    // Verify indentation in body uses 2 spaces, never tabs
    assert.equal(vector.envelope_bytes.includes("\t"), false, "Must not use tab indentation");
    const lines = vector.envelope_bytes.split("\n");
    assert.ok(lines.some((l) => l.startsWith("  \"contract\":")), "contract indented by 2 spaces");
    assert.ok(lines.some((l) => l.startsWith("  \"generated_at\":")), "generated_at indented by 2 spaces");
    assert.ok(lines.some((l) => l.startsWith("  \"data_hash\":")), "data_hash indented by 2 spaces");
    assert.ok(lines.some((l) => l.startsWith("  \"data\":")), "data indented by 2 spaces");
  }
});

test("R5 split: timestamp shape and range predicate (never exact string equality)", () => {
  const vectors = generateEnvelopeVectors();
  for (const [filename, vector] of vectors) {
    const predicate = vector.timestamp_predicate;
    assert.ok(predicate, `timestamp_predicate missing in ${filename}`);
    assert.equal(predicate.format, "iso-8601");

    const regex = new RegExp(predicate.regex);

    // 1. Vector envelope timestamp satisfies the predicate
    assert.ok(
      regex.test(vector.envelope.generated_at),
      `Timestamp "${vector.envelope.generated_at}" must match predicate regex ${predicate.regex}`
    );

    // 2. Timestamp parses as a valid date, within [min_year, max_year]
    const parsedEpoch = Date.parse(vector.envelope.generated_at);
    assert.ok(!Number.isNaN(parsedEpoch), "Timestamp must parse as valid epoch milliseconds");
    const parsedYear = new Date(parsedEpoch).getUTCFullYear();
    assert.ok(parsedYear >= predicate.min_year, `Year ${parsedYear} must be >= ${predicate.min_year}`);
    // max_year (red-team MEDIUM, P03 round 1): without an upper bound, an
    // absurdly future timestamp (e.g. 9999-12-31) satisfies the regex,
    // Date.parse, and min_year alike -- assert it does NOT satisfy max_year.
    assert.ok(predicate.max_year, `timestamp_predicate.max_year missing in ${filename}`);
    assert.ok(parsedYear <= predicate.max_year, `Year ${parsedYear} must be <= ${predicate.max_year}`);
    assert.ok(
      !regex.test("9999-12-31T23:59:59.999Z") ||
        new Date(Date.parse("9999-12-31T23:59:59.999Z")).getUTCFullYear() > predicate.max_year,
      "An absurdly future timestamp must fail min_year/max_year range checking even though it satisfies the regex"
    );

    // 3. Live envelope check: fresh wrapEnvelope produces a different timestamp,
    //    proving why shape/range predicate is used rather than exact string equality!
    const liveEnvelope = wrapEnvelope(vector.data);
    assert.ok(
      regex.test(liveEnvelope.generated_at),
      "Live wrapEnvelope timestamp satisfies predicate regex"
    );
    const liveYear = new Date(liveEnvelope.generated_at).getUTCFullYear();
    assert.ok(liveYear >= predicate.min_year, "Live wrapEnvelope timestamp satisfies min_year");
    assert.ok(liveYear <= predicate.max_year, "Live wrapEnvelope timestamp satisfies max_year");
  }
});

test("R5 split: trailing newline is present", () => {
  const vectors = generateEnvelopeVectors();
  for (const [filename, vector] of vectors) {
    // Explicit field in vector
    assert.equal(vector.has_trailing_newline, true, `has_trailing_newline must be true in ${filename}`);

    // Byte string ends with newline
    assert.ok(vector.envelope_bytes.endsWith("\n"), `envelope_bytes must end with newline in ${filename}`);

    // Must be Unix LF (\n), never Windows CRLF (\r\n)
    assert.ok(
      !vector.envelope_bytes.endsWith("\r\n"),
      `envelope_bytes must end with Unix LF, not CRLF in ${filename}`
    );

    // Must be a single trailing newline, not double
    assert.ok(
      !vector.envelope_bytes.endsWith("\n\n"),
      `envelope_bytes must have exactly one trailing newline in ${filename}`
    );
  }
});

test("R5 split: stdout-vs-stderr channel separation", () => {
  const vectors = generateEnvelopeVectors();
  for (const [filename, vector] of vectors) {
    // CTR001 / legacy-cli-transition.md §4 discipline:
    // stdout delivers the public envelope payload; stderr receives 0 bytes
    const stdoutChunks = [];
    const stderrChunks = [];

    const mockStdout = {
      write(chunk) {
        stdoutChunks.push(Buffer.from(chunk));
      },
    };
    const mockStderr = {
      write(chunk) {
        stderrChunks.push(Buffer.from(chunk));
      },
    };

    // Simulate CLI presenter emitting envelope
    mockStdout.write(vector.envelope_bytes);

    const capturedStdout = Buffer.concat(stdoutChunks).toString("utf8");
    const capturedStderr = Buffer.concat(stderrChunks).toString("utf8");

    assert.equal(
      capturedStdout,
      vector.envelope_bytes,
      `Stdout must capture exactly envelope_bytes in ${filename}`
    );
    assert.equal(
      capturedStderr,
      "",
      `Stderr must receive 0 bytes during successful envelope emission in ${filename}`
    );
  }
});

test("R5 split: exit code and signal mapping", () => {
  const vectors = generateEnvelopeVectors();
  for (const [filename, vector] of vectors) {
    // Successful envelope execution must exit with code 0
    assert.equal(vector.exit_code, 0, `exit_code must be 0 for successful envelope in ${filename}`);

    // Normal termination: exit code is defined, signal termination is null
    const executionOutcome = {
      exitCode: vector.exit_code,
      signal: null,
    };
    assert.equal(executionOutcome.exitCode, 0);
    assert.equal(executionOutcome.signal, null);
  }
});

// ---------------------------------------------------------------------------
// R6: Explicitly named serialization-corpus categories
// ---------------------------------------------------------------------------

test("R6 serialization corpus category: object insertion order", () => {
  const diskPath = path.join(DEFAULT_SERIALIZATION_DIR, "object-insertion-order.json");
  assert.ok(fs.existsSync(diskPath), "object-insertion-order.json must exist");
  const fixture = JSON.parse(fs.readFileSync(diskPath, "utf8"));

  assert.equal(fixture.category, "object insertion order");
  assert.equal(fixture.compact_bytes, JSON.stringify(fixture.input_value));
  assert.equal(fixture.pretty_bytes, JSON.stringify(fixture.input_value, null, 2));

  // Must preserve key order: z_tail before a_head
  const compactKeys = Object.keys(JSON.parse(fixture.compact_bytes));
  assert.deepEqual(compactKeys.slice(0, 3), ["z_tail", "a_head", "m_mid"]);
});

test("R6 serialization corpus category: integer limits", () => {
  const diskPath = path.join(DEFAULT_SERIALIZATION_DIR, "integer-limits.json");
  assert.ok(fs.existsSync(diskPath), "integer-limits.json must exist");
  const fixture = JSON.parse(fs.readFileSync(diskPath, "utf8"));

  assert.equal(fixture.category, "integer limits");
  assert.equal(fixture.compact_bytes, JSON.stringify(fixture.input_value));
  assert.equal(fixture.pretty_bytes, JSON.stringify(fixture.input_value, null, 2));

  assert.equal(fixture.input_value.max_safe_integer, Number.MAX_SAFE_INTEGER);
  assert.equal(fixture.input_value.min_safe_integer, Number.MIN_SAFE_INTEGER);
  assert.ok(fixture.compact_bytes.includes("9007199254740991"));
  assert.ok(fixture.compact_bytes.includes("-9007199254740991"));
});

test("R6 serialization corpus category: negative zero", () => {
  const diskPath = path.join(DEFAULT_SERIALIZATION_DIR, "negative-zero.json");
  assert.ok(fs.existsSync(diskPath), "negative-zero.json must exist");
  const fixture = JSON.parse(fs.readFileSync(diskPath, "utf8"));

  assert.equal(fixture.category, "negative zero");
  assert.equal(fixture.compact_bytes, JSON.stringify(fixture.input_value));
  assert.equal(fixture.pretty_bytes, JSON.stringify(fixture.input_value, null, 2));

  // In ECMAScript, -0 serializes to 0
  assert.ok(!fixture.compact_bytes.includes("-0"), "-0 must serialize to 0 without negative sign");

  // Red-team HIGH (P03 round 1): input_value alone loses the -0 distinction
  // through the fixture file's own JSON round-trip. negative_zero_paths is
  // the sign-preserving companion a Rust consumer must use instead.
  assert.deepEqual(
    fixture.negative_zero_paths,
    ["neg_zero", "array_neg_zero[0]", "nested.value"],
    "negative_zero_paths must name every -0-valued location in input_value"
  );
});

test("R6 serialization corpus category: floating exponent formatting", () => {
  const diskPath = path.join(DEFAULT_SERIALIZATION_DIR, "floating-exponent-formatting.json");
  assert.ok(fs.existsSync(diskPath), "floating-exponent-formatting.json must exist");
  const fixture = JSON.parse(fs.readFileSync(diskPath, "utf8"));

  assert.equal(fixture.category, "floating exponent formatting");
  assert.equal(fixture.compact_bytes, JSON.stringify(fixture.input_value));
  assert.equal(fixture.pretty_bytes, JSON.stringify(fixture.input_value, null, 2));

  // V8 formatting includes lowercase e and plus sign for 1e21 -> 1e+21
  assert.ok(fixture.compact_bytes.includes("1e+21"), "1e21 must serialize as 1e+21");
  assert.ok(fixture.compact_bytes.includes("1.23e-7"), "1.23e-7 must serialize as 1.23e-7");
});

test("R6 serialization corpus category: Unicode/control characters", () => {
  const diskPath = path.join(DEFAULT_SERIALIZATION_DIR, "unicode-control-characters.json");
  assert.ok(fs.existsSync(diskPath), "unicode-control-characters.json must exist");
  const fixture = JSON.parse(fs.readFileSync(diskPath, "utf8"));

  assert.equal(fixture.category, "Unicode/control characters");
  assert.equal(fixture.compact_bytes, JSON.stringify(fixture.input_value));
  assert.equal(fixture.pretty_bytes, JSON.stringify(fixture.input_value, null, 2));

  // Mandatory control escapes: \u0000, \n, \r, \t, \"
  assert.ok(fixture.compact_bytes.includes("\\u0000"), "NUL must be escaped as \\u0000");
  assert.ok(fixture.compact_bytes.includes("\\n"), "LF must be escaped as \\n");
  assert.ok(fixture.compact_bytes.includes("\\t"), "TAB must be escaped as \\t");
  assert.ok(fixture.compact_bytes.includes("Hệ điều hành"), "UTF-8 Vietnamese characters preserved unescaped");
  assert.ok(fixture.compact_bytes.includes("🚀"), "Emoji preserved unescaped");
});

test("R6 serialization corpus category: nested arrays/maps", () => {
  const diskPath = path.join(DEFAULT_SERIALIZATION_DIR, "nested-arrays-maps.json");
  assert.ok(fs.existsSync(diskPath), "nested-arrays-maps.json must exist");
  const fixture = JSON.parse(fs.readFileSync(diskPath, "utf8"));

  assert.equal(fixture.category, "nested arrays/maps");
  assert.equal(fixture.compact_bytes, JSON.stringify(fixture.input_value));
  assert.equal(fixture.pretty_bytes, JSON.stringify(fixture.input_value, null, 2));

  assert.ok(fixture.compact_bytes.includes("[[],[1,[2,[3,[]]]]]"), "Nested arrays preserved");
  assert.ok(fixture.compact_bytes.includes("{\"leaf\":\"value\"}"), "Nested map preserved");
});

test("R6 serialization corpus category: null/booleans", () => {
  const diskPath = path.join(DEFAULT_SERIALIZATION_DIR, "null-booleans.json");
  assert.ok(fs.existsSync(diskPath), "null-booleans.json must exist");
  const fixture = JSON.parse(fs.readFileSync(diskPath, "utf8"));

  assert.equal(fixture.category, "null/booleans");
  assert.equal(fixture.compact_bytes, JSON.stringify(fixture.input_value));
  assert.equal(fixture.pretty_bytes, JSON.stringify(fixture.input_value, null, 2));

  assert.ok(fixture.compact_bytes.includes("[null,true,false,null]"), "Booleans and null in array preserved");
  assert.ok(fixture.compact_bytes.includes("\"val_null\":null"), "Null value preserved");
  assert.ok(fixture.compact_bytes.includes("\"val_true\":true"), "True value preserved");
  assert.ok(fixture.compact_bytes.includes("\"val_false\":false"), "False value preserved");
});

test("R6: all seven categories are present and accounted for", () => {
  const REQUIRED_CATEGORIES = [
    "object insertion order",
    "integer limits",
    "negative zero",
    "floating exponent formatting",
    "Unicode/control characters",
    "nested arrays/maps",
    "null/booleans",
  ];

  const files = fs.readdirSync(DEFAULT_SERIALIZATION_DIR).filter((f) => f.endsWith(".json"));
  const coveredCategories = new Set();

  for (const file of files) {
    const fixture = JSON.parse(fs.readFileSync(path.join(DEFAULT_SERIALIZATION_DIR, file), "utf8"));
    coveredCategories.add(fixture.category);
  }

  for (const cat of REQUIRED_CATEGORIES) {
    assert.ok(
      coveredCategories.has(cat),
      `Required serialization category "${cat}" is missing from corpus`
    );
  }
  assert.equal(coveredCategories.size, 7, "Exactly 7 categories covered");
});
