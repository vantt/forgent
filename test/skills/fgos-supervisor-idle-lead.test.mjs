import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const skill = fs.readFileSync(path.resolve(here, '../../core/skills/fgos-supervisor/SKILL.md'), 'utf8');
const flat = skill.replace(/\s+/g, ' ');

// These rules are skill text; the existing replacement proof does not cover admission or the first idle check.
test('admission lands status, lead role and trunk base together before starting the lead', () => {
  const section = flat.slice(flat.indexOf('## Admit ready plans'), flat.indexOf('## Running plans'));
  const admission = section.slice(section.indexOf('1.'), section.indexOf('2.'));
  assert.match(admission, /In one `fgos land --paths <plan\.md> --message "\.\.\."` commit/);
  assert.equal((admission.match(/fgos land/g) ?? []).length, 1);
  assert.match(admission, /`status: running`/);
  assert.match(admission, /`lead: head:lead-<headName>` \(the role you start\)/);
  assert.match(admission, /`base: <trunk sha at admission>` \(from `git rev-parse <trunk>`\)/);
  assert.match(section.slice(section.indexOf('2.')), /fgos session start lead --name <headName from plans>/);
});

test('session-idle types a wait check into the live lead and closes only on an answer or progress', () => {
  const section = flat.slice(flat.indexOf('For `session-idle` naming a live lead'), flat.indexOf('A live lead that makes no progress'));
  assert.ok(section.length > 0, 'the first idle check must precede replacement');
  assert.match(section, /never close the event on a screen claim such as "waiting on a background shell"/);
  assert.match(section, /fgos session type head:lead-<headName> --text "Check the wait you named; if it is over, continue; if not, say what it is and when it ends\."/);
  assert.match(section, /The lead's shell can check its own background job; yours cannot/);
  assert.match(section, /Close the event only when the lead answers or makes progress/);
  assert.match(section, /within one watcher interval/);
  assert.match(section, /idle again at the next row, apply the existing `plan-no-progress` stop-then-start rule/);
  assert.match(flat, /Except for the `session-idle` check below/);
});

test('a plan-no-progress event for a plan whose lead is live replaces the lead: stop first, then start', () => {
  const section = flat.slice(flat.indexOf('## Running plans'), flat.indexOf('## Done plans'));
  const rule = section.slice(section.indexOf('For `plan-no-progress` naming a plan with `leadLive: true`'));
  assert.ok(rule.length > 0, 'the live-idle-lead rule is missing from Running plans');
  const stop = rule.indexOf('fgos session stop lead --name <headName>');
  const start = rule.indexOf('fgos session start lead --name <headName>');
  assert.ok(stop >= 0 && start > stop, 'the rule must stop the lead, then start it again');
  assert.match(rule, /idle with unfinished phases/);
  assert.match(rule, /`already-live`[^.]*never the whole answer/);
});
