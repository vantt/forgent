"""Refresh only the three authorized exception digests; deterministic input at HEAD.
All original exception rationale/kind/approval fields and the baseline stay intact.
"""
import hashlib
import json
from pathlib import Path
import subprocess
P=Path('plans/260925-documentation-authority-unification')
O=P/'reports/phase-09/import3'
def git(*args):return subprocess.check_output(['git',*args]).decode()
def sha(s):return hashlib.sha256(s.encode() if isinstance(s,str) else s).hexdigest()
def dump(path,data):Path(path).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
path='scripts/check-legacy-docs-ratchet.exceptions.json'
pin=git('rev-parse','HEAD').strip();merge=git('rev-parse','571a996f5').strip()
before=json.loads(git('show',pin+':'+path));after=json.loads(json.dumps(before));rows=[]
expected={'docs/specs/confinement-authority.md','docs/specs/reading-map.md','docs/specs/seat-binding.md'}
for entry in after['exceptions']:
    if entry['path'] not in expected:continue
    source=Path(entry['path']).read_bytes()
    assert source==git('show',merge+':'+entry['path']).encode()
    digest=sha(source);assert entry['expectedDigest']!=digest
    rows.append(dict(path=entry['path'],kind=entry['kind'],owner=entry['owner'],
        revisitTrigger='Phase 09 final conservation/cutover',
        rationale='571a996f5 main import; exact parents/base/path provenance in reports/phase-09/import3/merge-accounting.json. All 24 unproven units carried or explicitly adapted in s18-import3-resync.json; live drift scan reports zero missing. Independent review pending; digest accounting is not content or authority approval.',
        approvedBy='Lead w10-import3-brief / w11-import3-resume-brief / L12-137 / L13-6, digest accounting only',
        expectedDigest=digest,reviewedAt='2026-10-24',ratchetScope='active-exception'))
    entry['expectedDigest']=digest
assert {r['path'] for r in rows}==expected
after['previousMainMergeAccounting']=dict(inputCommit=pin,path=path,commit=before['mainMergeAccounting']['commit'],
    objectSha256=sha(json.dumps(before['mainMergeAccounting'],ensure_ascii=False,separators=(',',':'))),
    meaning='Previous mainMergeAccounting retained at the exact input commit; objectSha256 is SHA256 of JSON.stringify(mainMergeAccounting). All original exception rationale/kind/approval fields retained verbatim.')
after['mainMergeAccounting']=dict(commit=merge,authorization='Lead reports/phase-09/w10-import3-brief.md + w11-import3-resume-brief.md / L12-137 / L13-6',
    meaning='Only the three existing main-import digest mismatches are refreshed. Original exception metadata, baseline, allowances and all other exception entries are unchanged. No content approval or authority cutover.',rows=rows)
for a,b in zip(before['exceptions'],after['exceptions']):
    changed={k for k in a.keys()|b.keys() if a.get(k)!=b.get(k)}
    assert not changed or (a['path'] in expected and changed=={'expectedDigest'})
assert before.keys()==after.keys()
dump(path,after)
dump(O/'ratchet-refresh.json',dict(inputHEAD=pin,merge=merge,changedPaths=sorted(expected),
    beforeSha256=sha(git('show',pin+':'+path)),afterSha256=sha(Path(path).read_bytes()),
    previousObjectSha256=after['previousMainMergeAccounting']['objectSha256'],
    originalExceptionMetadataUnchanged=True,baselineUnchanged=True,independentReview='pending'))
print(json.dumps(dict(refreshed=3,paths=sorted(expected))))
