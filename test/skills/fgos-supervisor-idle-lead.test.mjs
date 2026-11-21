import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const skill = fs.readFileSync(path.resolve(here, '../../core/skills/fgos-supervisor/SKILL.md'), 'utf8');
const flat = skill.replace(/\s+/g, ' ');

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
