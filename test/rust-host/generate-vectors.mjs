#!/usr/bin/env node
// generate-vectors.mjs — generates golden envelope vectors and differential
// serialization corpus for Rust host cross-runtime compatibility (P03, P08).
//
// R1: Imports wrapEnvelope directly from src/state/envelope.mjs.
// NEVER shells out to bin/fgos.mjs.

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

import { wrapEnvelope } from "../../src/state/envelope.mjs";
import { COMMAND_REGISTRY } from "../../src/cli/command-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_ENVELOPE_DIR = path.join(__dirname, "vectors/envelope");
export const DEFAULT_SERIALIZATION_DIR = path.join(__dirname, "vectors/serialization");

// Deterministic reference timestamp for reproducible vector generation
export const FIXED_TIMESTAMP = "2026-09-10T17:00:00.000Z";

/**
 * Temporarily stub Date so wrapEnvelope's new Date().toISOString()
 * produces a deterministic reference timestamp for golden vectors.
 */
export function withDeterministicDate(timestamp, fn) {
  const OriginalDate = globalThis.Date;
  class MockDate extends OriginalDate {
    constructor(...args) {
      if (args.length === 0) {
        super(timestamp);
      } else {
        super(...args);
      }
    }
    static now() {
      return new OriginalDate(timestamp).getTime();
    }
  }
  globalThis.Date = MockDate;
  try {
    return fn();
  } finally {
    globalThis.Date = OriginalDate;
  }
}

/**
 * Generate envelope vectors (R2).
 * Covers at least a version-shaped payload and one array/list payload.
 */
export function generateEnvelopeVectors() {
  const vectors = new Map();

  // Vector 1: version-shaped payload (packageVersion, gitCommit, sorted verbs)
  const versionData = {
    packageVersion: "0.1.0",
    gitCommit: "0123456",
    verbs: COMMAND_REGISTRY.map((e) => e.name).sort(),
  };

  const versionCompact = JSON.stringify(versionData);
  const versionHash = createHash("sha256").update(versionCompact).digest("hex");
  const versionEnvelope = withDeterministicDate(FIXED_TIMESTAMP, () => wrapEnvelope(versionData));
  const versionEnvelopeBytes = `${JSON.stringify(versionEnvelope, null, 2)}\n`;

  vectors.set("version.json", {
    name: "version",
    description: "fgos.v1 envelope wrapping a version-shaped payload (packageVersion, gitCommit, sorted verbs)",
    data: versionData,
    compact_hash_input: versionCompact,
    data_hash: versionHash,
    envelope: versionEnvelope,
    envelope_bytes: versionEnvelopeBytes,
    timestamp_predicate: {
      format: "iso-8601",
      regex: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$",
      min_year: 2026,
      // max_year (red-team MEDIUM, P03 round 1): without an upper bound,
      // an absurdly future timestamp (e.g. 9999-12-31) satisfies the regex,
      // Date.parse, and min_year alike -- a loose predicate that would
      // accept a badly-broken serializer's output.
      max_year: 2100,
    },
    has_trailing_newline: true,
    exit_code: 0,
  });

  // Vector 2: array/list payload
  const listData = [
    {
      id: "tsk-001",
      title: "Parity harness",
      status: "done",
      stage: "validating",
      tags: ["rust", "harness"],
    },
    {
      id: "tsk-002",
      title: "Envelope vectors and serialization corpus",
      status: "in-progress",
      stage: "executing",
      tags: ["rust", "vectors", "serialization"],
    },
  ];

  const listCompact = JSON.stringify(listData);
  const listHash = createHash("sha256").update(listCompact).digest("hex");
  const listEnvelope = withDeterministicDate(FIXED_TIMESTAMP, () => wrapEnvelope(listData));
  const listEnvelopeBytes = `${JSON.stringify(listEnvelope, null, 2)}\n`;

  vectors.set("list.json", {
    name: "work_list",
    description: "fgos.v1 envelope wrapping an array/list payload",
    data: listData,
    compact_hash_input: listCompact,
    data_hash: listHash,
    envelope: listEnvelope,
    envelope_bytes: listEnvelopeBytes,
    timestamp_predicate: {
      format: "iso-8601",
      regex: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$",
      min_year: 2026,
      // max_year (red-team MEDIUM, P03 round 1): without an upper bound,
      // an absurdly future timestamp (e.g. 9999-12-31) satisfies the regex,
      // Date.parse, and min_year alike -- a loose predicate that would
      // accept a badly-broken serializer's output.
      max_year: 2100,
    },
    has_trailing_newline: true,
    exit_code: 0,
  });

  return vectors;
}

/**
 * Generate differential serialization corpus (R3).
 * Covers one fixture minimum per category from legacy-cli-transition.md §4:
 * 1. object insertion order
 * 2. integer limits
 * 3. negative zero
 * 4. floating exponent formatting
 * 5. Unicode/control characters
 * 6. nested arrays/maps
 * 7. null/booleans
 */

/**
 * Walks `value` recursively and returns the dot-path/bracket-index of every
 * location holding IEEE754 negative zero (Object.is(x, -0)). Used to derive
 * negative-zero.json's negative_zero_paths field from the real value instead
 * of a hand-typed literal that could drift out of sync with it.
 */
export function findNegativeZeroPaths(value, prefix = "") {
  const paths = [];
  if (typeof value === "number" && Object.is(value, -0)) {
    paths.push(prefix);
    return paths;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => {
      paths.push(...findNegativeZeroPaths(item, `${prefix}[${i}]`));
    });
    return paths;
  }
  if (value && typeof value === "object") {
    for (const [key, val] of Object.entries(value)) {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      paths.push(...findNegativeZeroPaths(val, nextPrefix));
    }
  }
  return paths;
}

export function generateSerializationCorpus() {
  const corpus = new Map();

  // 1. object insertion order
  const objOrderValue = {
    z_tail: "inserted first, must serialize first",
    a_head: "inserted second, must serialize second",
    m_mid: "inserted third, must serialize third",
    nested: {
      omega: 24,
      alpha: 1,
      beta: 2,
    },
  };
  corpus.set("object-insertion-order.json", {
    category: "object insertion order",
    description: "Key insertion order is preserved across serialization and must not be sorted lexicographically",
    input_value: objOrderValue,
    compact_bytes: JSON.stringify(objOrderValue),
    pretty_bytes: JSON.stringify(objOrderValue, null, 2),
  });

  // 2. integer limits
  const intLimitsValue = {
    zero: 0,
    pos_one: 1,
    neg_one: -1,
    i32_max: 2147483647,
    i32_min: -2147483648,
    max_safe_integer: 9007199254740991,
    min_safe_integer: -9007199254740991,
  };
  corpus.set("integer-limits.json", {
    category: "integer limits",
    description: "Boundary integer values including zero, signed 32-bit limits, and 53-bit safe integer limits",
    input_value: intLimitsValue,
    compact_bytes: JSON.stringify(intLimitsValue),
    pretty_bytes: JSON.stringify(intLimitsValue, null, 2),
  });

  // 3. negative zero
  const negZeroValue = {
    neg_zero: -0,
    array_neg_zero: [-0, 0],
    nested: {
      value: -0,
    },
  };
  corpus.set("negative-zero.json", {
    category: "negative zero",
    description: "ECMAScript specification serializes -0 as 0 in both compact and pretty JSON",
    // input_value alone cannot represent -0: JSON has no literal that
    // round-trips as IEEE754 negative zero through this FIXTURE FILE's own
    // JSON.stringify/JSON.parse (unlike the compact_bytes/pretty_bytes
    // strings below, which capture the real one-time serialization of the
    // real -0 held in memory here). A Rust fixture consumer must instead
    // construct -0.0_f64 directly at each dot-path/bracket-index named
    // here, assign it into the otherwise-parsed input_value, and confirm
    // ITS OWN serializer reproduces compact_bytes/pretty_bytes exactly --
    // never trust input_value's own (sign-lost) numeric fields for these
    // paths (red-team HIGH finding, P03 round 1).
    //
    // Derived by walking negZeroValue itself (MEDIUM-2, P03 round 2), not a
    // hand-typed literal: a hardcoded list can silently drift out of sync
    // with a future edit to negZeroValue (adding a fourth -0 would still
    // regenerate compact_bytes/pretty_bytes correctly via the drift guard,
    // but a hand-typed path list would keep reporting only the original
    // three paths, under-reporting where -0 actually lives).
    negative_zero_paths: findNegativeZeroPaths(negZeroValue),
    input_value: negZeroValue,
    compact_bytes: JSON.stringify(negZeroValue),
    pretty_bytes: JSON.stringify(negZeroValue, null, 2),
  });

  // 4. floating exponent formatting
  const expFormattingValue = {
    small_exp: 1.23e-7,
    large_exp: 1e21,
    fraction: 0.000001,
    tiny: 5e-324,
    large_float: 1.7976931348623157e308,
  };
  corpus.set("floating-exponent-formatting.json", {
    category: "floating exponent formatting",
    description: "Floating point exponent notation in V8/ECMAScript (lowercase e, plus sign where applicable)",
    input_value: expFormattingValue,
    compact_bytes: JSON.stringify(expFormattingValue),
    pretty_bytes: JSON.stringify(expFormattingValue, null, 2),
  });

  // 5. Unicode/control characters
  const unicodeControlValue = {
    ascii_control: "\u0000\u0001\u001f",
    common_escapes: "\b\f\n\r\t\"\\",
    utf8_vietnamese: "Hệ điều hành cho agent: ranh giới rõ ràng, không tùm lum",
    utf8_multilingual: "English, Tiếng Việt, 日本語, 한국어, 中文, العربية, Русский",
    emoji_and_symbols: "🚀 🦀 ✨ 𝄞 🤖",
    del_char: "\u007f",
  };
  corpus.set("unicode-control-characters.json", {
    category: "Unicode/control characters",
    description: "RFC 8259 mandatory control character escapes and literal UTF-8 unicode encoding",
    input_value: unicodeControlValue,
    compact_bytes: JSON.stringify(unicodeControlValue),
    pretty_bytes: JSON.stringify(unicodeControlValue, null, 2),
  });

  // 6. nested arrays/maps
  const nestedValue = {
    empty_object: {},
    empty_array: [],
    nested_arrays: [[], [1, [2, [3, []]]]],
    nested_objects: {
      level1: {
        level2: {
          level3: {
            leaf: "value",
          },
        },
      },
    },
    array_of_objects: [
      { id: 1, name: "item 1", tags: ["a", "b"] },
      { id: 2, name: "item 2", tags: [] },
    ],
    object_with_mixed_arrays: {
      records: [
        { metadata: { count: 0, active: true } },
      ],
    },
  };
  corpus.set("nested-arrays-maps.json", {
    category: "nested arrays/maps",
    description: "Arbitrary nesting depth, empty collections, and mixed object/array hierarchies",
    input_value: nestedValue,
    compact_bytes: JSON.stringify(nestedValue),
    pretty_bytes: JSON.stringify(nestedValue, null, 2),
  });

  // 7. null/booleans
  const nullBoolValue = {
    val_null: null,
    val_true: true,
    val_false: false,
    array_null_bool: [null, true, false, null],
    nested: {
      is_active: false,
      is_ready: true,
      error: null,
    },
  };
  corpus.set("null-booleans.json", {
    category: "null/booleans",
    description: "Literal null, boolean true, boolean false across object, array, and scalar contexts",
    input_value: nullBoolValue,
    compact_bytes: JSON.stringify(nullBoolValue),
    pretty_bytes: JSON.stringify(nullBoolValue, null, 2),
  });

  return corpus;
}

/**
 * Write all vectors and corpus fixtures to disk.
 */
export function writeVectors({
  envelopeDir = DEFAULT_ENVELOPE_DIR,
  serializationDir = DEFAULT_SERIALIZATION_DIR,
} = {}) {
  fs.mkdirSync(envelopeDir, { recursive: true });
  fs.mkdirSync(serializationDir, { recursive: true });

  const envelopeVectors = generateEnvelopeVectors();
  for (const [filename, vector] of envelopeVectors) {
    const filePath = path.join(envelopeDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(vector, null, 2) + "\n", "utf8");
  }

  const serializationCorpus = generateSerializationCorpus();
  for (const [filename, fixture] of serializationCorpus) {
    const filePath = path.join(serializationDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(fixture, null, 2) + "\n", "utf8");
  }
}

/**
 * Check that all committed vectors match regenerated output byte-for-byte (R4).
 */
export function checkVectors({
  envelopeDir = DEFAULT_ENVELOPE_DIR,
  serializationDir = DEFAULT_SERIALIZATION_DIR,
} = {}) {
  const diffs = [];

  function checkDir(dir, generatedMap, label) {
    if (!fs.existsSync(dir)) {
      diffs.push(`Directory does not exist: ${dir}`);
      return;
    }

    const diskFiles = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
    const genFiles = [...generatedMap.keys()].sort();

    const missing = genFiles.filter((f) => !diskFiles.includes(f));
    const extra = diskFiles.filter((f) => !genFiles.includes(f));

    if (missing.length > 0) {
      diffs.push(`Missing ${label} vectors on disk: ${missing.join(", ")}`);
    }
    if (extra.length > 0) {
      diffs.push(`Unexpected ${label} vectors on disk: ${extra.join(", ")}`);
    }

    for (const filename of genFiles) {
      if (!diskFiles.includes(filename)) continue;
      const diskPath = path.join(dir, filename);
      const diskContent = fs.readFileSync(diskPath, "utf8");
      const expectedContent = JSON.stringify(generatedMap.get(filename), null, 2) + "\n";

      if (diskContent !== expectedContent) {
        diffs.push(`Drift in ${label}/${filename}: disk content does not match regenerated content byte-for-byte`);
      }
    }
  }

  checkDir(envelopeDir, generateEnvelopeVectors(), "envelope");
  checkDir(serializationDir, generateSerializationCorpus(), "serialization");

  return {
    clean: diffs.length === 0,
    summary: diffs.join("\n"),
    diffs,
  };
}

// CLI execution
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  const isCheck = args.includes("--check");

  if (isCheck) {
    const result = checkVectors();
    if (result.clean) {
      process.exit(0);
    } else {
      console.error("Vector drift detected:");
      console.error(result.summary);
      process.exit(1);
    }
  } else {
    writeVectors();
    console.log("Vectors written successfully.");
    process.exit(0);
  }
}
