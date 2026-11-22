import '../helpers/process-tmp-root.mjs';
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import {
  saveProbeCacheRecord,
  loadProbeCacheRecord,
  clearProbeCache,
  resolveAttestationStoreDir,
  DEFAULT_PROBE_CACHE_TTL_MS,
} from "../../src/runner/dispatch/confinement/attestation-store.mjs";

test("the attestation store follows the state-root pin, even when XDG_STATE_HOME is blank", (t) => {
  const keys = ["FGOS_STATE_ROOT", "FGOS_CONFINEMENT_ATTESTATION_STORE_PATH", "XDG_STATE_HOME"];
  const saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  t.after(() => {
    for (const key of keys) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "fgos-attest-pin-"));
  t.after(() => fs.rmSync(scratch, { recursive: true, force: true }));
  delete process.env.FGOS_CONFINEMENT_ATTESTATION_STORE_PATH;
  process.env.FGOS_STATE_ROOT = scratch;
  process.env.XDG_STATE_HOME = path.join(scratch, "xdg-elsewhere");
  assert.equal(resolveAttestationStoreDir(), path.join(scratch, "attestations"));
  process.env.XDG_STATE_HOME = "   ";
  assert.equal(resolveAttestationStoreDir(), path.join(scratch, "attestations"));
});

test("R9: attestation store caches probe results by fingerprint with TTL", () => {
  clearProbeCache();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fgos-r9-probe-"));
  const context = { runDir: path.join(tmpDir, "run1") };
  const fingerprint = {
    policyDigest: "abc123digest",
    driverVersion: "1.0.0",
    backendConfigDigest: "def456digest",
    platformDigest: "plat789digest",
  };

  const probeResult = {
    passed: true,
    message: "all 8 local-bwrap-v1 confinement probes passed",
    results: [{ probe: "host-write-denied", passed: true, detail: "ok" }],
  };

  const t0 = 1000000;
  // Save cache record
  const saved = saveProbeCacheRecord(fingerprint, probeResult, context, { now: t0 });
  assert.ok(saved);
  assert.equal(saved.passed, true);

  // Load from cache (in-memory hit)
  const cachedHit = loadProbeCacheRecord(fingerprint, context, { now: t0 + 1000 });
  assert.ok(cachedHit);
  assert.equal(cachedHit.cached, true);
  assert.equal(cachedHit.message, probeResult.message);
  assert.deepEqual(cachedHit.results, probeResult.results);

  // Clear in-memory cache to force loading from disk
  clearProbeCache();
  const diskHit = loadProbeCacheRecord(fingerprint, context, { now: t0 + 5000 });
  assert.ok(diskHit);
  assert.equal(diskHit.cached, true);
  assert.equal(diskHit.message, probeResult.message);

  // Cache miss on different fingerprint
  const diffFingerprint = { ...fingerprint, platformDigest: "changed" };
  const missFp = loadProbeCacheRecord(diffFingerprint, context, { now: t0 + 5000 });
  assert.equal(missFp, null);

  // Cache miss on expired TTL
  const expired = loadProbeCacheRecord(fingerprint, context, {
    ttlMs: 10000,
    now: t0 + 20000,
  });
  assert.equal(expired, null);
});

