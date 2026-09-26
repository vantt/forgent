#!/usr/bin/env node
// doc-inventory-artifact.mjs -- deterministic sharded JSON artifact helpers.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const SHARDED_ARTIFACT_SCHEMA = 'https://forgent.dev/schemas/sharded-json-artifact.v1.json';
export const DEFAULT_MAX_PART_BYTES = 20 * 1024 * 1024;

export function sha256Buffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function partDirForManifest(manifestPath) {
  const base = path.basename(manifestPath).replace(/\.json$/, '');
  return path.join(path.dirname(manifestPath), `${base}.parts`);
}

function posixJoin(...parts) {
  return parts.join('/').replace(/\\/g, '/');
}

function splitUtf8ByLine(text, maxPartBytes) {
  const parts = [];
  let current = '';
  let currentBytes = 0;
  for (const line of text.split(/(?<=\n)/)) {
    const lineBytes = Buffer.byteLength(line);
    if (lineBytes > maxPartBytes) throw new Error(`Cannot shard artifact: one line is ${lineBytes} bytes, above max part size ${maxPartBytes}`);
    if (current && currentBytes + lineBytes > maxPartBytes) {
      parts.push(current);
      current = '';
      currentBytes = 0;
    }
    current += line;
    currentBytes += lineBytes;
  }
  if (current || parts.length === 0) parts.push(current);
  return parts;
}

export function writeShardedJsonArtifact(manifestPath, value, options = {}) {
  const maxPartBytes = options.maxPartBytes || DEFAULT_MAX_PART_BYTES;
  const partDir = options.partDir || partDirForManifest(manifestPath);
  const manifestRelDir = path.dirname(manifestPath);
  const partDirRel = path.relative(manifestRelDir, partDir).replace(/\\/g, '/');
  const text = JSON.stringify(value, null, 2) + '\n';
  const chunks = splitUtf8ByLine(text, maxPartBytes);

  fs.mkdirSync(partDir, { recursive: true });
  for (const entry of fs.readdirSync(partDir)) fs.rmSync(path.join(partDir, entry), { recursive: true, force: true });

  const parts = chunks.map((chunk, idx) => {
    const fileName = `part-${String(idx + 1).padStart(4, '0')}.jsonl`;
    const partPath = path.join(partDir, fileName);
    const buf = Buffer.from(chunk, 'utf8');
    fs.writeFileSync(partPath, buf);
    return {
      path: posixJoin(partDirRel, fileName),
      bytes: buf.length,
      sha256: sha256Buffer(buf),
    };
  });

  const manifest = {
    $schema: SHARDED_ARTIFACT_SCHEMA,
    schemaVersion: 1,
    artifactKind: 'phase-02-doc-inventory',
    encoding: 'utf8',
    reassembly: 'ordered-concat-then-json-parse',
    canonicalJson: 'pretty-2-space-with-final-newline',
    totalBytes: Buffer.byteLength(text),
    sha256: sha256Buffer(Buffer.from(text, 'utf8')),
    partCount: parts.length,
    maxPartBytes,
    parts,
  };
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

export function loadShardedJsonArtifact(manifestPath, options = {}) {
  const manifestText = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestText);
  if (manifest?.$schema !== SHARDED_ARTIFACT_SCHEMA || manifest.reassembly !== 'ordered-concat-then-json-parse') {
    if (options.allowLegacyRawJson !== false) return JSON.parse(manifestText);
    throw new Error(`${manifestPath}: not a recognized sharded JSON artifact manifest`);
  }
  if (!Array.isArray(manifest.parts) || manifest.parts.length !== manifest.partCount) throw new Error(`${manifestPath}: partCount does not match parts array`);
  const seen = new Set();
  const manifestDir = path.dirname(manifestPath);
  const partBuffers = [];
  for (const [idx, part] of manifest.parts.entries()) {
    if (!part || typeof part.path !== 'string' || path.isAbsolute(part.path) || part.path.includes('..')) throw new Error(`${manifestPath}: invalid part path at index ${idx}`);
    if (seen.has(part.path)) throw new Error(`${manifestPath}: duplicate part path ${part.path}`);
    seen.add(part.path);
    const abs = path.join(manifestDir, part.path);
    if (!fs.existsSync(abs)) throw new Error(`${manifestPath}: missing shard ${part.path}`);
    const buf = fs.readFileSync(abs);
    if (buf.length !== part.bytes) throw new Error(`${manifestPath}: shard ${part.path} byte size mismatch: expected ${part.bytes}, got ${buf.length}`);
    const digest = sha256Buffer(buf);
    if (digest !== part.sha256) throw new Error(`${manifestPath}: shard ${part.path} sha256 mismatch: expected ${part.sha256}, got ${digest}`);
    partBuffers.push(buf);
  }

  const dirs = new Set(manifest.parts.map((part) => path.dirname(part.path)));
  for (const relDir of dirs) {
    const absDir = path.join(manifestDir, relDir);
    const expected = new Set(manifest.parts.filter((part) => path.dirname(part.path) === relDir).map((part) => path.basename(part.path)));
    for (const actual of fs.readdirSync(absDir)) {
      if (!expected.has(actual)) throw new Error(`${manifestPath}: unexpected extra shard ${posixJoin(relDir, actual)}`);
    }
  }

  const all = Buffer.concat(partBuffers);
  if (all.length !== manifest.totalBytes) throw new Error(`${manifestPath}: reassembled byte size mismatch: expected ${manifest.totalBytes}, got ${all.length}`);
  const digest = sha256Buffer(all);
  if (digest !== manifest.sha256) throw new Error(`${manifestPath}: reassembled sha256 mismatch: expected ${manifest.sha256}, got ${digest}`);
  return JSON.parse(all.toString(manifest.encoding || 'utf8'));
}
