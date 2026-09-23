import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  countXmlCases,
  parseArgs,
  buildMarker,
  writeMarker,
} from '../../scripts/write-test-marker.mjs';

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'write-test-marker-'));
}

// --- countXmlCases -----------------------------------------------------

test('countXmlCases returns 0 for a missing file', () => {
  const dir = tmpDir();
  assert.equal(countXmlCases(path.join(dir, 'nope.xml')), 0);
});

test('countXmlCases counts <testcase entries in a real junit file', () => {
  const dir = tmpDir();
  const xmlPath = path.join(dir, 'full.xml');
  fs.writeFileSync(
    xmlPath,
    '<testsuite><testcase name="a"/><testcase name="b"/></testsuite>',
  );
  assert.equal(countXmlCases(xmlPath), 2);
});

test('countXmlCases returns 0 for a junit file with zero cases', () => {
  const dir = tmpDir();
  const xmlPath = path.join(dir, 'empty.xml');
  fs.writeFileSync(xmlPath, '<testsuite></testsuite>');
  assert.equal(countXmlCases(xmlPath), 0);
});

// --- parseArgs -----------------------------------------------------------

test('parseArgs defaults exitCode to null when --exit-code is never passed', () => {
  const args = parseArgs(['--type', 'full', '--xml', 'test-results/full.xml']);
  assert.equal(args.exitCode, null);
  assert.equal(args.runType, 'full');
  assert.equal(args.xmlPath, 'test-results/full.xml');
});

test('parseArgs reads a real numeric --exit-code', () => {
  const args = parseArgs(['--exit-code', '7']);
  assert.equal(args.exitCode, 7);
});

test('parseArgs falls back to null on an unparseable --exit-code', () => {
  const args = parseArgs(['--exit-code', '']);
  assert.equal(args.exitCode, null);
});

test('parseArgs reads --plan', () => {
  const args = parseArgs(['--plan', 'selector-plan.json']);
  assert.equal(args.planPath, 'selector-plan.json');
});

// --- buildMarker: `completed` correctness (TI-02b) ------------------------

test('completed is false when the job crashed before any test ran (0 cases, no xml)', () => {
  const dir = tmpDir();
  const marker = buildMarker({
    runType: 'full',
    xmlPath: path.join(dir, 'missing.xml'),
    planPath: null,
    exitCode: 7,
    jobStatus: 'failure',
    env: {},
  });
  assert.equal(marker.completed, false);
  assert.equal(marker.reportedCases, 0);
  assert.equal(marker.exitCode, 7);
});

test('completed is false when the xml file exists but reports zero cases', () => {
  const dir = tmpDir();
  const xmlPath = path.join(dir, 'full.xml');
  fs.writeFileSync(xmlPath, '<testsuite></testsuite>');
  const marker = buildMarker({
    runType: 'full',
    xmlPath,
    planPath: null,
    exitCode: 0,
    jobStatus: 'success',
    env: {},
  });
  assert.equal(marker.completed, false);
});

test('completed is false for a cancelled job even with real cases reported', () => {
  const dir = tmpDir();
  const xmlPath = path.join(dir, 'full.xml');
  fs.writeFileSync(xmlPath, '<testsuite><testcase name="a"/></testsuite>');
  const marker = buildMarker({
    runType: 'full',
    xmlPath,
    planPath: null,
    exitCode: null,
    jobStatus: 'cancelled',
    env: {},
  });
  assert.equal(marker.completed, false);
});

test('completed is true for a real green run: xml exists, cases > 0, job succeeded', () => {
  const dir = tmpDir();
  const xmlPath = path.join(dir, 'full.xml');
  fs.writeFileSync(xmlPath, '<testsuite><testcase name="a"/><testcase name="b"/></testsuite>');
  const marker = buildMarker({
    runType: 'full',
    xmlPath,
    planPath: null,
    exitCode: 0,
    jobStatus: 'success',
    env: {},
  });
  assert.equal(marker.completed, true);
  assert.equal(marker.reportedCases, 2);
});

test('completed is true for a real red run: xml exists, cases > 0, job failed', () => {
  const dir = tmpDir();
  const xmlPath = path.join(dir, 'full.xml');
  fs.writeFileSync(xmlPath, '<testsuite><testcase name="a"/></testsuite>');
  const marker = buildMarker({
    runType: 'full',
    xmlPath,
    planPath: null,
    exitCode: 1,
    jobStatus: 'failure',
    env: {},
  });
  assert.equal(marker.completed, true);
});

test('buildMarker records the real exit code untouched, including a nonzero failure code', () => {
  const dir = tmpDir();
  const xmlPath = path.join(dir, 'full.xml');
  fs.writeFileSync(xmlPath, '<testsuite><testcase name="a"/></testsuite>');
  const marker = buildMarker({
    runType: 'full',
    xmlPath,
    planPath: null,
    exitCode: 1,
    jobStatus: 'failure',
    env: {},
  });
  assert.equal(marker.exitCode, 1);
});

test('buildMarker reads plannedFiles from a real plan file', () => {
  const dir = tmpDir();
  const planPath = path.join(dir, 'plan.json');
  fs.writeFileSync(planPath, JSON.stringify({ selectedFiles: ['a.test.mjs', 'b.test.mjs'] }));
  const marker = buildMarker({
    runType: 'related',
    xmlPath: path.join(dir, 'missing.xml'),
    planPath,
    exitCode: 0,
    jobStatus: 'success',
    env: {},
  });
  assert.equal(marker.plannedFiles, 2);
});

test('buildMarker tolerates a malformed plan file instead of crashing', () => {
  const dir = tmpDir();
  const planPath = path.join(dir, 'plan.json');
  fs.writeFileSync(planPath, '{not json');
  const marker = buildMarker({
    runType: 'related',
    xmlPath: path.join(dir, 'missing.xml'),
    planPath,
    exitCode: 0,
    jobStatus: 'success',
    env: {},
  });
  assert.equal(marker.plannedFiles, 0);
});

test('buildMarker falls back to sha "unknown" when GITHUB_SHA is absent', () => {
  const dir = tmpDir();
  const marker = buildMarker({
    runType: 'full',
    xmlPath: path.join(dir, 'missing.xml'),
    planPath: null,
    exitCode: null,
    jobStatus: 'unknown',
    env: {},
  });
  assert.equal(marker.sha, 'unknown');
});

// --- writeMarker -----------------------------------------------------------

test('writeMarker creates the output dir and writes test-marker.json', () => {
  const dir = tmpDir();
  const outDir = path.join(dir, 'test-results');
  writeMarker(outDir, { completed: true });
  const written = JSON.parse(fs.readFileSync(path.join(outDir, 'test-marker.json'), 'utf8'));
  assert.equal(written.completed, true);
});
