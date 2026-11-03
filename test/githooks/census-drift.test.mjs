import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { MUTATION_CENSUS_PATH, census } from '../../scripts/git-one-door-scan.mjs';
import { createHash } from 'node:crypto';

// The real hook runs against a scratch repository that declares `src` as its product and records it
// in a census; the hook stays in the checkout under test, the staged tree is the scratch one.
const HOOK = path.resolve('.githooks/pre-commit');
const digest = (source) => createHash('sha256').update(source).digest('hex');

function fixture(t) {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'census-hook-'));
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).trim();
  const write = (name, text) => {
    fs.mkdirSync(path.dirname(path.join(repo, name)), { recursive: true });
    fs.writeFileSync(path.join(repo, name), text);
  };
  const writeCensus = (files) => write(MUTATION_CENSUS_PATH, `${JSON.stringify(census({ files, sites: [], classes: [] }), null, 2)}\n`);
  git('init', '-q', '-b', 'main'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.test');
  write('package.json', '{"files":["src"]}\n');
  write('src/door.mjs', 'export const a = 1;\n');
  write('docs/note.md', 'one\n');
  writeCensus({ 'src/door.mjs': digest('export const a = 1;\n') });
  git('add', '.'); git('commit', '-q', '-m', 'baseline');
  const hook = () => spawnSync(process.execPath, [HOOK], { cwd: repo, encoding: 'utf8' });
  return { git, write, writeCensus, hook };
}

test('a staged product file whose census digest changed is refused until the regenerated census is staged', (t) => {
  const { git, write, writeCensus, hook } = fixture(t);
  write('src/door.mjs', 'export const a = 2;\n');
  git('add', 'src/door.mjs');
  const refused = hook();
  assert.equal(refused.status, 1, refused.stderr);
  assert.match(refused.stderr, /one-door census does not match the staged files \(src\/door\.mjs\).*--write-census/);

  writeCensus({ 'src/door.mjs': digest('export const a = 2;\n') });
  git('add', MUTATION_CENSUS_PATH);
  const accepted = hook();
  assert.equal(accepted.status, 0, accepted.stderr);
});

test('a commit that stages nothing the scan judges passes without reading the census', (t) => {
  const { git, write, hook } = fixture(t);
  write('docs/note.md', 'two\n');
  git('add', 'docs/note.md');
  const result = hook();
  assert.equal(result.status, 0, result.stderr);
});

// The declarations file is a scan input, not code: the census records its digest, so the hook must
// judge it by the same digest — before this, a staged declarations file always read as drift.
test('a staged declarations file is judged by the digest the census records for it', (t) => {
  const { git, write, writeCensus, hook } = fixture(t);
  const declarations = 'scripts/lib/git-one-door-declarations.v1.json';
  write('package.json', '{"files":["src","scripts"]}\n');
  write(declarations, '{"schema":"git-one-door-declarations.v1","declarations":[]}\n');
  writeCensus({ 'src/door.mjs': digest('export const a = 1;\n'), [declarations]: digest('{"schema":"git-one-door-declarations.v1","declarations":[]}\n') });
  git('add', '.');
  const accepted = hook();
  assert.equal(accepted.status, 0, accepted.stderr);
  git('commit', '-q', '--no-verify', '-m', 'declarations');

  write(declarations, '{"schema":"git-one-door-declarations.v1","declarations":[{}]}\n');
  git('add', declarations);
  const refused = hook();
  assert.equal(refused.status, 1, refused.stderr);
  assert.match(refused.stderr, /census does not match the staged files \(scripts\/lib\/git-one-door-declarations\.v1\.json\)/);
});

test('the hook judges with the committing checkout\'s own scanner, not the one beside the hook', (t) => {
  const { git, write, hook } = fixture(t);
  // This checkout's scanner declares nothing drifted: the staged change below would be refused by the
  // scanner beside the hook, so a pass proves the committing tree's rules were the ones applied.
  write('scripts/git-one-door-scan.mjs', [
    `export const MUTATION_CENSUS_PATH = ${JSON.stringify(MUTATION_CENSUS_PATH)};`,
    'export const declaredProduct = () => (name) => name.startsWith(\'src/\');',
    'export const censusDrift = () => [];',
    '',
  ].join('\n'));
  write('src/door.mjs', 'export const a = 3;\n');
  git('add', 'src/door.mjs');
  const result = hook();
  assert.equal(result.status, 0, result.stderr);
});

test('a committing checkout whose scanner predates the census check is not refused', (t) => {
  const { git, write, hook } = fixture(t);
  write('scripts/git-one-door-scan.mjs', [
    `export const MUTATION_CENSUS_PATH = ${JSON.stringify(MUTATION_CENSUS_PATH)};`,
    'export const declaredProduct = () => (name) => name.startsWith(\'src/\');',
    '',
  ].join('\n'));
  write('src/door.mjs', 'export const a = 4;\n');
  git('add', 'src/door.mjs');
  const result = hook();
  assert.equal(result.status, 0, result.stderr);
});
