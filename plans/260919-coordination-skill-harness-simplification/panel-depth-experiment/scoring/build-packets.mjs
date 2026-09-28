// build-packets.mjs -- packet-building driver for the panel-depth
// experiment's scoring rubric (scoring-rubric.md, commit 7421a5e61).
// Extracts the real report bodies from corpus/, applies the Section 4
// mechanical redactions (ids/paths/timestamps/executor names), coin-flips
// X/Y per case, and writes the blinded packet files. Self-referential
// "this run was deliberately blind" framing sentences specific to the
// withheld-redteam probes are NOT mechanically stripped here (too
// context-sensitive for a safe regex) -- the preparer removes them by hand
// afterward, then reruns the redaction self-check.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = 'plans/260919-coordination-skill-harness-simplification/panel-depth-experiment';

function extractReportBody(corpusPath) {
  const content = fs.readFileSync(corpusPath, 'utf8');
  const m = content.match(/## Real agent-report\.md \(verbatim\)\n\n([\s\S]*)$/);
  if (!m) throw new Error('no report body found in ' + corpusPath);
  return m[1].trim();
}

function extractObjective(corpusPath) {
  const content = fs.readFileSync(corpusPath, 'utf8');
  const m = content.match(/## Dispatched objective \(verbatim\)\n\n([\s\S]*?)\n\n## Real agent-result/);
  if (!m) throw new Error('no objective found in ' + corpusPath);
  return m[1].trim();
}

// Mechanical redactions only (Section 4 items 3-6): ids, absolute paths,
// timestamps, executor/provider/model names. Profile-name and red-team
// mentions (items 1-2, 7) need judgment and are handled by hand per case.
function redactMechanical(text) {
  let out = text;
  out = out.replace(/\/home\/vantt\/projects\/forgentX\/\.claude\/worktrees\/[a-z0-9-]+/g, '[REDACTED]');
  out = out.replace(/\/home\/vantt\/projects\/forgentX/g, '[REDACTED]');
  out = out.replace(/\/home\/vantt\/projects\/herdr-gateway/g, '[REDACTED]');
  out = out.replace(/asgn_[a-z0-9_]+/gi, '[REDACTED]');
  out = out.replace(/run_asgn_[a-z0-9_]+/gi, '[REDACTED]');
  out = out.replace(/coord_[a-z0-9_]+|aap-p052-[a-z0-9-]+|i27-[a-z0-9-]+/gi, '[REDACTED]');
  out = out.replace(/\bclaude-cli-bwrap\b|\bcodex-cli-bwrap\b|\bagy-cli[a-z0-9-]*\b|\bpi-cli-bwrap-vantt\b|\bclaude-bwrap\b|\bagy-bwrap\b|\bcodex-readonly\b/gi, '[REDACTED]');
  out = out.replace(/\bclaude\b(?=[\s,.:;)])/g, '[REDACTED]');
  out = out.replace(/\bxai\b|\bopenai\b|\bgemini\b(?!-3)/gi, '[REDACTED]');
  out = out.replace(/\b881fa33\b|\b15b1203\b|\bc1bebce\b|\b8812463\b|\babcde87\b/g, '[REDACTED-COMMIT]');
  out = out.replace(/\b202\d-\d{2}-\d{2}T[\d:.]+Z?\b/g, '[REDACTED-TIMESTAMP]');
  return out;
}

function writeIfChanged(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

const CASES = [
  {
    label: 'case-1',
    core: true,
    dir: 'p052-clear',
    question: extractObjective(path.join(ROOT, 'corpus/p052-clear/interpret-request.md')),
    fullExplanation: extractReportBody(path.join(ROOT, 'corpus/p052-clear/explain-recommendation.md')),
    withheldExplanation: extractReportBody(path.join(ROOT, 'corpus/p052-clear/withheld-redteam-explanation-v2.md')),
    redteam: extractReportBody(path.join(ROOT, 'corpus/p052-clear/red-team-packet.md')),
    critique: extractReportBody(path.join(ROOT, 'corpus/p052-clear/critique-proposals.md')),
    assess: extractReportBody(path.join(ROOT, 'corpus/p052-clear/assess-constraints.md')),
  },
  {
    label: 'case-2',
    core: true,
    dir: 'p052-unclear',
    question: extractObjective(path.join(ROOT, 'corpus/p052-unclear/interpret-request.md')),
    fullExplanation: extractReportBody(path.join(ROOT, 'corpus/p052-unclear/explain-recommendation.md')),
    withheldExplanation: extractReportBody(path.join(ROOT, 'corpus/p052-unclear/withheld-redteam-explanation-v2.md')),
    redteam: extractReportBody(path.join(ROOT, 'corpus/p052-unclear/red-team-packet.md')),
    critique: extractReportBody(path.join(ROOT, 'corpus/p052-unclear/critique-proposals.md')),
    assess: extractReportBody(path.join(ROOT, 'corpus/p052-unclear/assess-constraints.md')),
  },
  {
    label: 'case-3',
    core: false,
    dir: 'i21-h4',
    question: extractObjective(path.join(ROOT, 'corpus/i21-h4/interpret-request.md')),
    fullExplanation: extractReportBody(path.join(ROOT, 'corpus/i21-h4/explain-recommendation.md')),
    withheldExplanation: extractReportBody(path.join(ROOT, 'corpus/i21-h4/withheld-redteam-explanation.md')),
    redteam: extractReportBody(path.join(ROOT, 'corpus/i21-h4/red-team-packet.md')),
    critique: extractReportBody(path.join(ROOT, 'corpus/i21-h4/critique-proposals.md')),
    assess: extractReportBody(path.join(ROOT, 'corpus/i21-h4/assess-constraints.md')),
  },
];

const unblindingLines = ['# Unblinding key (do not open before all marks are committed)\n'];

for (const c of CASES) {
  const caseDir = path.join(ROOT, 'scoring', c.label);
  const coin = crypto.randomInt(2); // 0 -> full=X, withheld=Y ; 1 -> reversed
  const xProfile = coin === 0 ? 'full' : 'withheld';
  const yProfile = coin === 0 ? 'withheld' : 'full';
  const xExplanationRaw = coin === 0 ? c.fullExplanation : c.withheldExplanation;
  const yExplanationRaw = coin === 0 ? c.withheldExplanation : c.fullExplanation;

  const xExplanation = redactMechanical(xExplanationRaw);
  const yExplanation = redactMechanical(yExplanationRaw);
  const xWordsBefore = xExplanationRaw.split(/\s+/).filter(Boolean).length;
  const xWordsAfter = xExplanation.split(/\s+/).filter(Boolean).length;
  const yWordsBefore = yExplanationRaw.split(/\s+/).filter(Boolean).length;
  const yWordsAfter = yExplanation.split(/\s+/).filter(Boolean).length;

  writeIfChanged(path.join(caseDir, 'question.md'), c.question + '\n');
  writeIfChanged(path.join(caseDir, 'explanation-X.md'), xExplanation + '\n');
  writeIfChanged(path.join(caseDir, 'explanation-Y.md'), yExplanation + '\n');
  writeIfChanged(path.join(caseDir, 'redteam-findings-source.md'), redactMechanical(c.redteam) + '\n');
  writeIfChanged(
    path.join(caseDir, 'control-objections-source-X.md'),
    redactMechanical(coin === 0 ? c.critique + '\n\n---\n\n' + c.assess : c.critique + '\n\n---\n\n' + c.assess) + '\n',
  );
  writeIfChanged(
    path.join(caseDir, 'control-objections-source-Y.md'),
    redactMechanical(c.critique + '\n\n---\n\n' + c.assess) + '\n',
  );

  unblindingLines.push(`## ${c.label} (${c.dir})`);
  unblindingLines.push(`- X = ${xProfile} (word count ${xWordsBefore} -> ${xWordsAfter} after redaction)`);
  unblindingLines.push(`- Y = ${yProfile} (word count ${yWordsBefore} -> ${yWordsAfter} after redaction)`);
  unblindingLines.push('');
}

fs.writeFileSync(path.join(ROOT, 'scoring', 'unblinding-key.md'), unblindingLines.join('\n'));
console.log('Packets written. Unblinding key at scoring/unblinding-key.md (DO NOT commit until scoring is done).');
