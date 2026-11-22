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
  assert.match(section, /idle again at the next wake without a verified ongoing wait, apply the existing `plan-no-progress` stop-then-start rule below, even without a fresh watcher row/);
  assert.doesNotMatch(section, /reaching the lead within one watcher interval/);
  assert.match(flat, /Except for the `session-idle` check below/);
});

// The first-idle and replacement proofs require an event; neither covers an empty queue after deduplication.
test('each wake checks running plans even without an event and raises a head-scoped help event before typing', () => {
  const wake = flat.slice(flat.indexOf('## One wake'), flat.indexOf('## Admit ready plans'));
  assert.match(wake, /inspect all running plans, even when the queue is empty/);
  const rule = flat.slice(flat.indexOf('On every wake, read'), flat.indexOf('For `session-idle` naming a live lead'));
  assert.ok(rule.length > 0, 'the no-event idle check is missing');
  assert.match(rule, /fgos supervisor plans --json/);
  assert.match(rule, /phase tables of all running plans, not only plans named by an event/);
  assert.match(rule, /An empty queue and `leadLive: true` prove neither progress nor a real wait/);
  assert.match(rule, /fgos session read head:lead-<headName>/);
  assert.match(rule, /fgos request result <ticket id>/);
  assert.match(rule, /Leave a busy lead or a genuinely running ticket alone; park an external wait with its reason in the phase table/);
  assert.match(rule, /idle without a verified ongoing wait and no open event names it/);
  assert.match(rule, /fgos supervisor raise --kind coordination-help --ref head:lead-<headName> --reason "idle lead with unfinished phases; no fresh watcher event"` before typing/);
  assert.match(rule, /an event naming only the plan does not authorize typing into its lead/);
  assert.match(rule, /Apply the same idle check below to this event/);
  assert.match(rule, /Do not wait for a fresh `session-idle` or `plan-no-progress`: handled rows may remain duplicates/);
  assert.match(rule, /next supervisor wake, not necessarily within one watcher interval/);
  assert.match(rule, /with no new event or other wake, this skill cannot detect it by itself/);
  assert.match(flat, /For `session-idle` naming a live lead \(or the `coordination-help` raised above\)/);
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
