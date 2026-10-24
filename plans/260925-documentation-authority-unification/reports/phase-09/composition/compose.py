#!/usr/bin/env python3
"""Records-only composition. Source checkout is read-only; executable bytes go to scratch.
Reuse Step 7's authored hunk parser and exact locator, never invoke its assembly door.
"""
import atexit
import collections
import difflib
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import sys
sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
P8 = HERE.parent.parent / 'phase-08'
SCRATCH = Path('/tmp/fgos-work')
SCRATCH.mkdir(parents=True, exist_ok=True)
_workspace = tempfile.TemporaryDirectory(prefix='composition-', dir=SCRATCH)
atexit.register(_workspace.cleanup)
SCRATCH = Path(_workspace.name)
spec = importlib.util.spec_from_file_location('step7', P8 / 'step-07-assemble.py')
step7 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(step7)
sha = lambda s: hashlib.sha256(s.encode() if isinstance(s, str) else s).hexdigest()
def readj(p): return json.loads(p.read_text())
def dump(name, data): (HERE/name).write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n')
def source(path):
    p = ROOT/path
    return p.read_text() if p.is_file() and not p.is_symlink() else None
PIN = subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
ORDER = readj(P8/'step-07-patch-order.json')
APPROVED = {s['path']:s for s in readj(P8/'step-07-composed-patches.json')['patches']}
MATRIX = readj(P8/'step-07-consumer-cutover-matrix.json')
CAT = {r['id']: r['path'] for r in MATRIX['recordCatalog']}
CACHE = {}
def record(r):
    path = CAT[r[1]]
    if path not in CACHE: CACHE[path] = [json.loads(l) for l in (P8/path).read_text().splitlines()]
    return CACHE[path][r[2]-1]
def item(r):
    rec = record(r)
    for x in sum([rec.get(k,[]) for k in ['edges','references','dynamicTraces','authorAddedReferences']],[]):
        ident = str(x.get('referenceId') or x.get('id') or x.get('edgeId'))
        if x.get('slotKey'): ident += '@'+sha(x['slotKey'])[:20]
        if ident == r[3]: return x
    raise ValueError(r)
ROWS = {r[0]:r for r in MATRIX['consumerRows']}
BODIES, ACTIONS, PROBLEMS, COMMANDS = [], [], [], []
BASES, AFTERS = {}, {}
def run(argv, cwd, **kw):
    result = subprocess.run(argv,cwd=cwd,capture_output=True,text=True,**kw)
    COMMANDS.append({'argv':list(map(str,argv)),'cwd':str(cwd),'exit':result.returncode,'stdout':result.stdout,'stderr':result.stderr})
    return result

def apply_diff(path, before, diff):
    with tempfile.TemporaryDirectory(dir=SCRATCH,prefix='patch-') as t:
        p=Path(t)/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(before)
        r=run(['patch','--batch','--fuzz=0','-p1'],t,input=diff)
        if r.returncode: raise ValueError(r.stdout+r.stderr)
        return p.read_text()

def baseline(path):
    if path in AFTERS: return AFTERS[path]
    before=source(path)
    if before is None: raise ValueError('source absent: '+path)
    if path in APPROVED:
        old=APPROVED[path]
        if sha(before)!=old['beforeSha256']:
            current=before; edits=set()
            for a,b,c,d,h in step7.hunk_edits(old['diff']):
                edits.add(step7.locate_edit(current,a,b,c,d))
            ordered=sorted(edits)
            assert all(r[0]>=l[1] and r[0]!=l[0] for l,r in zip(ordered,ordered[1:])),path
            for a,b,n in reversed(ordered):before=before[:a]+n+before[b:]
            rebase=make_patch(path,current,before,'recomposed-predecessor:'+path,replaces=old['patchSpecId'],historicalBeforeSha256=old['beforeSha256'],historicalAfterSha256=old['expectedAfterSha256'],requires='G9 delta review; historical approval does not transfer')
            BODIES.append(rebase)
            BASES[path]={'patchSpecId':rebase['id'],'expectedAfterSha256':sha(before),'ref':'patch-specs.json','requires':'G9 delta review'}
        else:
            before=apply_diff(path,before,old['diff'])
            assert sha(before)==old['expectedAfterSha256']
            BASES[path]={'patchSpecId':old['patchSpecId'],'expectedAfterSha256':old['expectedAfterSha256'],'ref':str((P8/'step-07-composed-patches.json').relative_to(ROOT))}
    return before

def make_patch(path,before,after,ident,**extra):
    if before==after:
        return {'id':ident,'path':path,'beforeSha256':sha(before),'expectedAfterSha256':sha(after),'diff':'','rollbackDiff':'','status':'no-byte-change','reason':extra}
    forward=''.join(difflib.unified_diff(before.splitlines(True),after.splitlines(True),fromfile='a/'+path,tofile='b/'+path))
    inverse=''.join(difflib.unified_diff(after.splitlines(True),before.splitlines(True),fromfile='a/'+path,tofile='b/'+path))
    got=apply_diff(path,before,forward);assert got==after
    got=apply_diff(path,got,inverse);assert got==before
    out={'id':ident,'path':path,'sourceCommit':PIN,'beforeSha256':sha(before),'expectedAfterSha256':sha(after),'diff':forward,'rollbackDiff':inverse,'roundtrip':{'command':'patch --batch --fuzz=0 -p1','forwardExit':0,'rollbackExit':0,'exactBytes':True},**extra}
    return out

def patch(path,after,ident,**extra):
    before=baseline(path)
    out=make_patch(path,before,after,ident,predecessor=BASES.get(path),**extra)
    BODIES.append(out);AFTERS[path]=after
    BASES[path]={'patchSpecId':ident,'expectedAfterSha256':sha(after),'ref':'patch-specs.json'}
    return out

def replace(path,pairs,ident,**extra):
    text=baseline(path)
    for old,new in pairs:
        assert text.count(old)==1,(path,old,text.count(old))
        text=text.replace(old,new)
    return patch(path,text,ident,**extra)

def recompose_record_diff(path, recpath, line):
    rec=json.loads((P8/recpath).read_text().splitlines()[line-1]);before=baseline(path);after=before;witness=[]
    for old,new,prefix,suffix,header in step7.hunk_edits(rec['diff']):
        try:
            a,b,repl=step7.locate_edit(after,old,new,prefix,suffix)
            after=after[:a]+repl+after[b:]
            witness.append({'oldSha256':sha(old),'newSha256':sha(new),'resolution':'exact-current-passage'})
        except ValueError:
            # Removed mechanisms are not revived. Only a verified absent old+new
            # passage can become a named retirement action, never a silent skip.
            witness.append({'old':old,'new':new,'resolution':'needs-current-source-judgment'})
    return after,witness

def initial():
    # Fresh tracked snapshots only. No git metadata, state, symlink traversal,
    # build products, or secret stores. Public secrets/spec.md is documentation.
    tree=SCRATCH/'current'
    files=subprocess.check_output(['git','ls-files','-z'],cwd=ROOT).decode().split('\0')
    allowed=('docs/','src/','test/','scripts/','core/','domains/','plugins/','packages/','apps/','herdr-dashboard/','.agents/skills/','.claude/skills/')
    for f in files:
        if not f or not (f.startswith(allowed) or f in ['package.json','AGENTS.md','README.md','CHANGELOG.md']):continue
        p=ROOT/f
        if p.is_symlink() or not p.is_file():continue
        to=tree/f;to.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,to)
    return tree

def simple_repairs():
    for path in ['test/cli/fgos-merge.test.mjs','docs/how-to/fix-bare-citation-findings.md']:
        old=APPROVED[path];before=source(path);assert sha(before)==old['beforeSha256']
        after=apply_diff(path,before,old['diff'])
        if path.startswith('test/'):
            # Rework asks for only the one-line path rewrite; all empty lines stay
            # exactly where they were in the source.
            edits=[]
            for a,b,c,d,h in step7.hunk_edits(old['diff']):
                if not a.strip() and not b.strip():continue
                if b.endswith('\n\n') and not a.endswith('\n\n'): b=b[:-1]
                edits.append(step7.locate_edit(before,a,b,c,d))
            after=before
            for a,b,n in sorted(set(edits),reverse=True):after=after[:a]+n+after[b:]
        else:
            after=after.replace('docs/platform/runner/spec.md','docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#business-rules')
        BODIES.append(make_patch(path,before,after,'rework:'+path,replaces=old['patchSpecId'],predecessor=None))
        AFTERS[path]=after
    path='docs/platform/agent-confinement/spec.md'
    text=source('docs/specs/confinement-authority.md')
    start=text.index('### 13.1')
    end=re.search(r'^## ',text[start:],re.M)
    carry=text[start:start+end.start()] if end else text[start:]
    before=baseline(path)
    assert '### 13.1' not in before
    # Insert under setup/doctor, before section 14 (not at document end).
    boundary=re.search(r'^## 14[. ]',before,re.M)
    assert boundary
    after=before[:boundary.start()]+carry+before[boundary.start():]
    patch(path,after,'carry:credential-store-setup',sourceRef='docs/specs/confinement-authority.md#unheaded-block-140',verbatimSourceSha256=sha(carry),rebindRequired='claim_15308eb4; Lead/G9 binds the new unit after application')

def conventions():
    path='core/skills/_shared/citation-format.md'
    text=baseline(path)
    text=text.replace('global-permanent (`ADR<n>`, `docs/decisions/*.md`)', 'global-permanent (`ADR<n>`, `docs/platform/<area>/decisions/`)')
    text=text.replace('`docs/specs/<area>.md`)', '`docs/platform/<area>/spec.md`; split rules use the exact owning subcomponent `spec.md`)')
    text=text.replace('`CONTEXT.md`) — across `docs/backlog.md`, `docs/specs/*.md`, and any', '`CONTEXT.md`) — across `docs/backlog.md`, recursive `docs/platform/**/spec.md` (including subcomponents), retained legacy specs when present, and any')
    text += '\n## Decision homes after the authority cutover\n\nDecision narratives live under `docs/platform/<area>/decisions/`; RUL ids belong\nto the area spec, or its explicitly mapped subcomponent spec when the area is split.\nUse `docs/platform/governance.md#decision-scope-to-holder-table` to resolve\nread-first, fact/rule and narrative homes, including renamed area scopes.\n`docs/decisions/index.md` remains a generated projection, not a narrative home.\nScope is free text persisted verbatim by `fgos decision --scope`; this table is\nreader routing, not a new scope enum or a second decision store.\n'
    patch(path,text,'convention:citation-homes')
    path='scripts/check-decision-citation-drift.mjs'
    text=baseline(path)
    old='  for (const dir of skillsDirs) {\n    for (const full of collectMarkdownFiles(dir)) {'
    new='''  // Add successor homes without dropping an explicit --specs-dir or retained
  // legacy source. Split decisions/rules must not disappear from the read set.
  const seen = new Set(sources.map((source) => source.file));
  const platformRoot = path.resolve(specsDir) === path.resolve(cwd, 'docs/specs')
    ? path.join(cwd, 'docs/platform') : null;
  for (const full of platformRoot ? collectMarkdownFiles(platformRoot) : []) {
    const file = path.relative(cwd, full).replaceAll('\\\\', '/');
    if (!(file.endsWith('/spec.md') || file.includes('/decisions/') ||
          file === 'docs/platform/platform-foundations.md')) continue;
    if (seen.has(file)) continue;
    seen.add(file);
    sources.push({ file, lines: fs.readFileSync(full, 'utf8').split('\\n') });
  }
  for (const dir of skillsDirs) {
    for (const full of collectMarkdownFiles(dir)) {'''
    assert old in text
    text=text.replace(old,new)
    text=text.replace('// defect across docs/backlog.md, docs/specs/*.md, and any --skills-dir', '// defect across backlog, retained specs, recursive platform specs/decisions, and --skills-dir')
    patch(path,text,'scan:recursive-platform-citations',coveragePolicy='Additive; original legacy/custom scan and baseline bytes unchanged. Findings may stay red; no rebaseline.')
    # Extend the owning CLI fixture proof, rather than duplicate parser cases.
    testpath='test/scripts/check-decision-citation-drift.test.mjs'
    test=baseline(testpath)
    test += '''
// Existing CLI fixtures prove explicit override scopes; none observes the default
// post-cutover nested platform spec/decision read set. This is its owning proof.
test('default citation scan includes nested area rules and decision narratives without losing legacy specs', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'citation-successors-'));
  try {
    const files = {
      'docs/decisions/.keep': '',
      'docs/specs/old.md': 'RUL901 bare legacy rule\\n',
      'docs/platform/sample/subcomponents/child/spec.md': 'RUL902 bare child rule\\n',
      'docs/platform/sample/decisions/settled.md': 'RUL903 bare narrative citation\\n',
      'docs/platform/sample/operations/not-a-spec.md': 'RUL904 outside the declared default read set\\n',
    };
    for (const [rel, content] of Object.entries(files)) {
      const file = path.join(dir, rel);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, content);
    }
    const result = spawnSync(process.execPath, [scriptPath], { cwd: dir, encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.match(result.stdout, /3 finding/);
    for (const id of ['RUL901', 'RUL902', 'RUL903']) assert.ok(result.stdout.includes(id));
    assert.ok(!result.stdout.includes('RUL904'));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
'''
    patch(testpath,test,'proof:recursive-platform-citation-scan',owningBehavior='Default CLI collects nested area/subcomponent specs and narrative citations; old explicit-override fixture cases unchanged.')
    dump('citation-test-integration.json',{'owningProof':testpath,'specId':'proof:recursive-platform-citation-scan','requirement':'Nested default area/subcomponent spec and decisions reader set, with retained legacy and explicit override fixtures.','status':'composed; full-file replay result is in post-move-replay.json; real-repo baseline case remains red'})


def scope_table():
    moves=readj(P8/'step-05-cutover-move-set.json')['paths']
    table=[]
    for row in moves:
        old=row['oldPath']
        if not old.startswith('docs/specs/') or old.endswith('/reading-map.md'): continue
        slug=Path(old).stem
        targets=sorted({m['to'] for m in row['moves'] if m.get('to')})
        areas=sorted({p.split('/')[2] for p in targets if p.startswith('docs/platform/') and len(p.split('/'))>3})
        area={'distribution':'packaging-distribution','confinement-authority':'agent-confinement','fgos-plugin':'claude-plugin'}.get(slug,slug)
        if len(areas)==1: area=areas[0]
        specpath='docs/platform/'+area+'/spec.md'
        if slug=='platform-foundations': specpath='docs/platform/platform-foundations.md'
        facts=sorted({p for p in targets if p.endswith('/spec.md')})
        if source(specpath) is not None and specpath not in facts: facts.insert(0,specpath)
        decisions=sorted({p for p in targets if '/decisions/' in p})
        decisions += [str(p.relative_to(ROOT)) for p in sorted((ROOT/'docs/platform'/area/'decisions').glob('*.md')) if str(p.relative_to(ROOT)) not in decisions]
        portal='docs/platform/'+area+'/README.md'
        first=portal if source(portal) is not None else (facts[0] if facts else None)
        table.append({'scope':slug,'canonicalArea':area,'readFirst':first,'factAndRuleHolders':facts,'narrativeHolders':decisions,'decisionWriteHome':'docs/platform/'+area+'/decisions/','legacySource':old,'status':'candidate-routing; acceptance at cutover' if first and facts else 'missing-live-holder; Lead/D1 carriage required'})
    dump('area-holder-table.json',{'sourceCommit':PIN,'authority':'L12-96 Q3','scopeIsFreeText':True,'repoScope':{'scope':'repo','readFirst':'docs/reading-map.md','facts':'docs/platform-foundations.md','orientation':'docs/platform/platform-foundations.md','decisions':'docs/platform/decisions/','status':'proposed repo narrative placement; Lead acceptance required','projection':'docs/decisions/index.md'},'rows':table})
    md=['\n## Decision scope to holder table\n','After the separately approved authority cutover, decision narratives live under','`docs/platform/<area>/decisions/`. RUL ids belong to the exact area/subcomponent','`spec.md` listed below. Scope remains free text, persisted unchanged; old scope','strings do not get renamed in historical decisions. The generated','`docs/decisions/index.md` remains at its retained path.\n','| Scope (legacy alias retained) | Read first | Facts and RULs | Narrative home |','|---|---|---|---|','| repo | `docs/reading-map.md` | `docs/platform-foundations.md` (exclusive binding laws; platform entry is orientation) | `docs/platform/decisions/` (proposal; not an established store) |']
    for r in table:
        md.append('| '+r['scope']+' → '+r['canonicalArea']+' | '+('`'+r['readFirst']+'`' if r['readFirst'] else '**MISSING — carry before flip**')+' | '+('; '.join('`'+p+'`' for p in r['factAndRuleHolders']) or '**MISSING**')+' | `'+r['decisionWriteHome']+'` |')
    md+=['','For split runner rules use','`docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#business-rules`;','for prior runner narratives use','`docs/platform/runner/decisions/h-36d872fbb0e5.md`. The area portal resolves','the narrower contract when a scope spans more than one holder. Missing rows','above are explicit carriage blockers, never permission to invent a home.','']
    path='docs/platform/governance.md'
    patch(path,baseline(path)+'\n'.join(md),'convention:area-holder-table',requires='Independent acceptance and D1 carriage for missing rows; this patch alone does not close G1.')
    for path,pairs in [
      ('bin/fgos.mjs',[('area name matching docs/specs/<area>.md','area name routed by docs/platform/governance.md#decision-scope-to-holder-table')]),
      ('src/state/store.mjs',[('docs/specs/<area>.md','docs/platform/governance.md#decision-scope-to-holder-table')]),
    ]:
        try: replace(path,pairs,'scope-consumer:'+path)
        except (AssertionError,ValueError) as e: PROBLEMS.append({'path':path,'reason':str(e),'gate':'G9'})
    path='src/cli/command-registry.mjs';text=baseline(path)
    text=text.replace('docs/specs/<area>.md','docs/platform/governance.md#decision-scope-to-holder-table')
    if text!=baseline(path):patch(path,text,'scope-consumer:'+path)
    path='AGENTS.md'
    try:
        text=baseline(path)
        text=text.replace('narrative lives in docs/specs/<area>.md\'s own "Lịch sử quyết định" sections (tsk-1lv-4)', 'narrative lives under docs/platform/<area>/decisions/; resolve renamed/split scopes through docs/platform/governance.md#decision-scope-to-holder-table')
        text=text.replace('A settled decision goes into\n   `docs/decisions/`; a settled spec fact goes into the relevant\n   `docs/specs/<area>.md`.', 'A settled decision narrative goes into\n   `docs/platform/<area>/decisions/`; a settled fact goes into the exact area or\n   subcomponent `spec.md`. Resolve both through\n   `docs/platform/governance.md#decision-scope-to-holder-table`.')
        patch(path,text,'scope-consumer:'+path)
    except ValueError as e: PROBLEMS.append({'path':path,'reason':str(e),'gate':'G9'})


def render_skills(tree):
    candidate=SCRATCH/'skills'
    if candidate.exists(): shutil.rmtree(candidate)
    shutil.copytree(tree,candidate)
    inputs=[]
    # Canonical source patches already composed in Step 7 are reused unchanged.
    for path,s in sorted(APPROVED.items()):
        if not path.startswith(('core/skills/','domains/')):continue
        if path in AFTERS:continue
        try:
            text=baseline(path);p=candidate/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text)
            inputs.append({'path':path,'beforeSha256':s['beforeSha256'],'expectedAfterSha256':s['expectedAfterSha256'],'ref':'step-07-composed-patches.json#'+s['patchSpecId']})
        except ValueError as e:PROBLEMS.append({'path':path,'reason':str(e),'gate':'G9'})
    for path,text in AFTERS.items():
        if path.startswith(('core/skills/','domains/')):
            p=candidate/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text)
            inputs.append({'path':path,'expectedAfterSha256':sha(text),'ref':'patch-specs.json#'+next(s['id'] for s in reversed(BODIES) if s['path']==path)})
    r=run(['npm','run','build:skills'],candidate)
    assert r.returncode==0,r.stderr
    renders=[]
    parked=[s for s in ORDER['patches'] if s['patchSpecId'] in ORDER['parkedSpecIds'] and s['path'].startswith(('.agents/skills/','.claude/skills/','plugins/fgOS/skills/'))]
    for s in parked:
        path=s['path'];before=source(path);p=candidate/path
        if before is None or not p.is_file():
            PROBLEMS.append({'path':path,'reason':'render source/output absent','gate':'G7'});continue
        after=p.read_text()
        # Persist generated diffs as evidence only; application is always via generator.
        out=make_patch(path,before,after,'render:'+path,applyVia='npm run build:skills (never hand-apply this render diff)',canonicalInputs=inputs)
        renders.append(out)
        ACTIONS.append({'id':s['patchSpecId'],'kind':'generator','path':path,'rowIds':s['rowIds'],'command':'npm run build:skills','replayCwd':str(candidate),'beforeSha256':sha(before),'expectedAfterSha256':sha(after),'evidenceRef':'skill-regeneration.json#render:'+path,'status':'scratch-replayed; independent review pending'})
    dump('skill-regeneration.json',{'sourceCommit':PIN,'canonicalInputs':inputs,'command':'npm run build:skills','exit':r.returncode,'patches':renders,'policy':'Generated diffs are evidence; source changes plus regeneration are the execution door.'})
    all_deltas=[]
    for prefix in ['.agents/skills','.claude/skills','plugins/fgOS/skills']:
        paths={str(p.relative_to(base)) for base in [tree,candidate] for p in (base/prefix).rglob('*') if p.is_file() and not p.is_symlink()}
        for path in sorted(paths):
            left=tree/path;right=candidate/path
            before=left.read_text() if left.is_file() else ''
            after=right.read_text() if right.is_file() else ''
            if before==after:continue
            all_deltas.append(make_patch(path,before,after,'generator-output:'+path,applyVia='npm run build:skills; evidence diff only',requiresAbsent=not left.exists(),generatorRemoved=not right.exists(),parked=any(s['path']==path for s in parked)))
    dump('generator-all-output-deltas.json',{'command':'npm run build:skills','exit':r.returncode,'canonicalInputs':inputs,'deltas':all_deltas,'scope':'All generated-directory changes in the scratch build, including outputs outside the 69 parked renders. No worktree output is edited.'})
    return candidate


def hunk_parks():
    retirement={
      'bin/fgos.mjs':('63b777873c44e8977d16857e80246b043240ed0b','generateId/title-derived id was replaced by Identity mint; do not revive the old comment'),
      'src/runner/merge.mjs':('63b777873c44e8977d16857e80246b043240ed0b','numbered ADR self-resolver retired; old collision and lockroot commentary was removed'),
      'test/runner/merge.test.mjs':('63b777873c44e8977d16857e80246b043240ed0b','retired numbered-file conflict resolver tests removed; current recovery-string assertion remains'),
      'src/setup/git-hooks.mjs':('44abfcfa5','hook implementation/comment replaced by typed Git configuration; the old JSDoc does not survive'),
    }
    special={
      'docs/platform/process/spec.md':[('docs/specs/runner.md','docs/platform/runner/spec.md'),('[runner.md](../../specs/runner.md)','[runner spec](../runner/spec.md)')],
      'docs/specs/workflow.md':[('[runner.md](runner.md)','[runner decisions](../platform/runner/decisions/h-36d872fbb0e5.md)'),('[work-state.md](work-state.md)','[work-state spec](../platform/work-state/spec.md)')],
    }
    parked=[s for s in ORDER['patches'] if s['patchSpecId'] in ORDER['parkedSpecIds'] and s['recordRefs']]
    for s in parked:
        path=s['path']
        if path=='docs/platform/session-identity/spec.md':
            target='docs/platform/identity/spec.md'
            replace(target,[('docs/specs/observe.md','docs/platform/observe/spec.md')],'hunk-park:identity-successor',replaces=s['patchSpecId'],preserves='Identity §7a writer scope unchanged; rename 9fdaac9ba')
            ACTIONS.append({'id':s['patchSpecId'],'kind':'renamed-source','path':path,'rowIds':s['rowIds'],'successor':target,'patchRef':'patch-specs.json#hunk-park:identity-successor','command':'apply identified successor spec with beforeSha256 guard; never recreate session-identity/spec.md'})
            continue
        if path=='docs/specs/reading-map.md':
            ACTIONS.append({'id':s['patchSpecId'],'kind':'retire-source-after-carriage','path':path,'rowIds':s['rowIds'],'beforeSha256':sha(source(path)),'successor':'docs/reading-map.md#5-detailed-product-and-source-map','command':'node --test test/scripts/doc-link-pass.test.mjs','requires':'G5 retained L11-25 banner and both compounding→knowledge lines; current reading-map union/G9 accepted first','status':'exact retirement step; current source not patched because it is removed at cutover'})
            continue
        try:
            if path in special:
                text=baseline(path)
                for old,new in special[path]:
                    assert old in text,(path,old)
                    text=text.replace(old,new)
                out=patch(path,text,'hunk-park:'+path,replaces=s['patchSpecId'],rowIds=s['rowIds'],requires='G9: current legacy workflow source must be carried before retirement' if path.startswith('docs/specs/') else 'independent review')
                witness=[]
            else:
                text=baseline(path);witness=[]
                for ref in s['recordRefs']:
                    if '#' in ref['record']:
                        ident=ref['record'].split('#')[1]
                        rec=next(x for x in readj(P8/'step-07-final-prepared-specs.json')['specs'] if x['id']==ident)
                    else:
                        recpath=ROOT/ref['record']
                        rec=json.loads(recpath.read_text().splitlines()[ref['recordLine']-1])
                    for old,new,prefix,suffix,header in step7.hunk_edits(rec['diff']):
                        try:
                            a,b,n=step7.locate_edit(text,old,new,prefix,suffix)
                            text=text[:a]+n+text[b:]
                            witness.append({'oldSha256':sha(old),'newSha256':sha(new),'resolution':'exact-current-passage'})
                        except ValueError:
                            if new and new in text:
                                witness.append({'oldSha256':sha(old),'newSha256':sha(new),'resolution':'already-composed-by-same-file-hunk'})
                            elif path in retirement and old not in source(path) and new not in source(path):
                                commit,why=retirement[path]
                                witness.append({'old':old,'new':new,'resolution':'mechanism-retired-or-replaced','commit':commit,'reason':why})
                            elif '/// had `computePriority` run' in old and 'triage-table-columns.md' in old:
                                # Supplemental truth hunk is sequenced after the path hunk.
                                rebased=old.replace('docs/reference/triage-table-columns.md','docs/knowledge/fgos-triage-table-columns/triage-table-columns.md')
                                assert text.count(rebased)==1
                                text=text.replace(rebased,new)
                                witness.append({'old':old,'new':new,'resolution':'truthful-priority-comment-composed-on-top-of-pointer'})
                            else: raise ValueError('unresolved authored hunk: '+old[:180])
                out=patch(path,text,'hunk-park:'+path,replaces=s['patchSpecId'],rowIds=s['rowIds'],hunkWitnesses=witness)
            ACTIONS.append({'id':s['patchSpecId'],'kind':'composed-current-hunks','path':path,'rowIds':s['rowIds'],'patchRef':'patch-specs.json#'+out['id'],'beforeSha256':out['beforeSha256'],'expectedAfterSha256':out['expectedAfterSha256'],'status':'fuzz-zero roundtrip; independent review pending'})
        except (ValueError,AssertionError) as e:
            PROBLEMS.append({'id':s['patchSpecId'],'path':path,'reason':str(e),'gate':'G7'})


def description_parks():
    decision='docs/platform/runner/decisions/h-36d872fbb0e5.md'
    text=source(decision)
    heads=[h for h in text.splitlines() if h.startswith('#') and ('0049' in h or '0047' in h)]
    dump('description-holder-witnesses.json',{'path':decision,'sourceSha256':sha(text),'headings':heads,'requiredCarriages':['Participant append/read/subscribe','enduser-docs-authoring','enduser-docs-index','architecture intent live evidence holders']})
    path='docs/platform/agent-coordination/contracts/assignment-run-runresult.md'
    replace(path,[('docs/specs/runner.md:3072-3081 (0049); no src/state import in src/runner/dispatch or src/runner/execution',decision+' (0049, Work Boundary: Work adapters stay above the Execution Core); no src/state import in src/runner/dispatch or src/runner/execution')],'description:work-boundary',rowIds=['f04503'])
    path='docs/platform/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md'
    replace(path,[('The current Unit-run mutating door uses the worktree and recomputed-binding checks described in docs/specs/runner.md:3058.','The current Unit-run mutating door uses the worktree and recomputed-binding checks in '+decision+' (0047, the Unit mutation-admission contract).')],'description:mutation-admission',rowIds=['f04511'])
    path='docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md'
    replace(path,[('- read docs/specs/reading-map.md and the owning area spec before touching an\n  area\'s code; a settled decision goes to the repository\'s decision surface;', '- read docs/reading-map.md, then the owning docs/platform/<area>/README.md\n  and exact area/subcomponent spec.md before touching an area\'s code; resolve\n  facts and decision narratives through docs/platform/governance.md#decision-scope-to-holder-table;')],'description:read-first',rowIds=['f06394'])
    # Missing accepted carries are explicit dependencies, not guessed destinations.
    for path in ['docs/platform/agent-coordination/vocabulary/deprecated-and-reserved.md', 'docs/platform/system-overview/spec.md','docs/platform/system-architecture/architecture/architecture-intent.md']:
        rows=[r for r in ROWS.values() if record(r)['file']==path and r[4]=='individually parked' and r[5] is None]
        PROBLEMS.append({'path':path,'rowIds':[r[0] for r in rows],'beforeSha256':sha(baseline(path)),'predecessor':BASES.get(path),'reason':'G1/G9 live-holder carriage/truth acceptance required; no source-carriage mirror promoted by path alone','gate':'G1','members':[{'rowId':r[0],'memberId':r[3],'sourceSpans':item(r).get('sourceSpans'),'blocker':item(r).get('blockedReason')} for r in rows]})
    path='docs/knowledge/why-claimwork-s-cas-reread-stays-while-its-one-redundant-ful/why-claimworks-cas-reread-stays-while-its-redundant-full-log-read-was-deduped.md'
    replace(path,[('lost-update risk — not an optimization, and not a theoretical one either:\nthis project\'s own sessions have repeatedly hit real multi-process lock\ncontention on this exact file (see\n`docs/explanation/main-checkout-lock-toctou-race.md` and the\n`main-checkout-lock` history).', 'lost-update risk — not an optimization. The `main-checkout-lock` history\ndocuments a different concurrency hazard: reading a half-written lockfile\ncould report AMBIGUOUS without real contention (see\n`docs/knowledge/why-fgos-main-checkout-lock-could-report-ambiguous-with-no-r/main-checkout-lock-toctou-race.md`).\nThat precedent does not establish actual contention on the events log.')],'description:cas-evidence-correction',rowIds=['f04005'],meaning='Preserve the CAS/fresh-read invariant; remove the unsupported actual-events-file-contention assertion and distinguish the lockfile example.')


def successor_scans():
    path='test/runner/dead-vocabulary-guard.test.mjs';text=baseline(path)
    # Keep all current roots; add recursive live spec homes and split child specs.
    marker="test('dead vocabulary guard: Phase 1-3"
    at=text.index(marker)
    helper="function collectPlatformSpecs() {\n  return collectFiles(path.join(REPO_ROOT, 'docs', 'platform'), ['.md'])\n    .filter((file) => file.endsWith(`${path.sep}spec.md`));\n}\n\n"
    text=text[:at]+helper+text[at:]
    text=text.replace("const docFiles = docDirs.flatMap((d) => collectFiles(d, ['.md']));", "const docFiles = [...docDirs.flatMap((d) => collectFiles(d, ['.md'])), ...collectPlatformSpecs()];")
    text=text.replace("const docFiles = searchDirs.flatMap((d) => collectFiles(d, ['.md']));", "const docFiles = [...searchDirs.flatMap((d) => collectFiles(d, ['.md'])), ...collectPlatformSpecs()];")
    text=text.replace("    ...roots.flatMap((d) => walk(path.join(REPO_ROOT, d))),", "    ...roots.flatMap((d) => walk(path.join(REPO_ROOT, d))),\n    ...collectPlatformSpecs(),")
    patch(path,text,'scan:successor-dead-vocabulary',policy='Original roots and assertions remain; only recursive platform spec coverage is added. GAP-05 red is not suppressed.')
    path='scripts/test-proof-inventory.mjs'
    replace(path,[('// Rust/Node package boundary by directory convention (see docs/specs','// Rust/Node package boundary by directory convention (see docs/platform/packaging-distribution/spec.md')],'scan:proof-inventory-comment')
    # Old-root membership tests in historical migration verifiers/classifiers
    # are not document readers. Keep them, prove by owning fixture tests.
    dump('scan-policy.json',{'sourceCommit':PIN,'policies':[
      {'files':['scripts/generate-shipped-path-inventory.mjs','test/scripts/generate-shipped-path-inventory.test.mjs'],'resolution':'Preserve old-root identity predicates as well as existing docs/platform classification. This classifies strings in a pinned inventory; it does not dereference docs/specs. No flat substitution, no new baseline.','owningProof':'test/scripts/generate-shipped-path-inventory.test.mjs'},
      {'file':'src/setup/registrations.mjs','symbol':'checkDocNearDuplicate','resolution':'Existing whole-docs recursive walk already covers successors; reuse it unchanged. All six old operation witnesses bind to this function at current bytes.','owningProof':'test/setup/knowledge-doctor.test.mjs','proofScope':'Registry wiring only; production check replayed directly on current/post-move scratch docs. No claimed full owning behavior test.'},
      {'file':'scripts/verify-phase-01.mjs','resolution':'Preserve historical forbidden-edit membership test: it constrains changes in the original phase, not a read of a retired root. D3 may change its Git adapter, not this identity.','owningProof':None,'proofGap':'No existing verifier owning test found; historical membership predicate retained by inspection. Verifier replay is D3-owned.'},
      {'file':'scripts/check-decision-citation-drift.baseline.json','resolution':'Preserve the entire baseline byte-for-byte, including old-root keys. New findings stay failures. No key migration or rebaseline is proposed.'},
      {'file':'test/report/helpers/docs-index-state-fixture.mjs','resolution':'Reuse Step 7 rollup capture co-cut plus enduser-index-test. SourceCaptureId stays doc-fgos-rollup-howto. Post-move generator parity must decide any missing carry, not a fixture invented to pass.'}
    ]})


def gap_proposal():
    path='docs/platform/component-boundary.md';text=baseline(path)
    start=text.index('## Added in candidate: README source carriage')
    carry=text[start:]
    assert '## Added in candidate: repo-layout-vision source carriage' in carry
    target='docs/platform/system-architecture/history/component-boundary-source-carriage.md'
    after=text[:start]+'## Historical source carriage\n\nThe complete README and repo-layout-vision source units are preserved as literal\nprovenance in [the historical source snapshot](system-architecture/history/component-boundary-source-carriage.md).\nThey are not current component names or a live layout contract.\n'
    history='# Component boundary source carriage (historical)\n\nLiteral source units relocated from `docs/platform/component-boundary.md`.\nNo current behavior or authority is established here. Wording is preserved,\nincluding retired package names and source-relative link text.\n\n`````text\n'+carry+'\n`````\n'
    removal=make_patch(path,text,after,'proposal:gap05-relocate-complete-units',predecessor=BASES.get(path))
    addition=make_patch(target,'',history,'proposal:gap05-history-snapshot',requiresAbsent=True)
    dump('gap05-placement-proposal.json',{'memberId':'dynamic-023895','rowId':'r28621','status':'proposal-only; Lead placement approval required','recommendation':'Relocate BOTH complete source-carriage sections into a literal historical snapshot, retaining a live pointer; never rename quoted historical names or exempt the guard.','sourceUnitSha256':sha(carry),'sourceUnits':['Added in candidate: README source carriage','Added in candidate: repo-layout-vision source carriage'],'patches':[removal,addition],'owningReplay':'node --test test/runner/dead-vocabulary-guard.test.mjs','note':'Last guard still reads live component-boundary.md. The history snapshot is not in that live-spec read set; no guard assertion is relaxed.'})


def compose_status_units():
    # Conditional cutover records, never applied to the worktree. These are full
    # status/paragraph units, not prefix edits or claims that the gates passed.
    jobs={}
    old='During migration, existing `docs/specs/**` and `docs/architect/**` remain valid\nlegacy/current sources until their content is promoted or redirected.'
    new='After the approved authority flip, follow `docs/reading-map.md` to the\npromoted current source. Retired `docs/specs/**` and `docs/architect/**` are\nlookup/provenance only, never authority or write destinations. The switchboard\nis migration evidence, not a second operative authority router.'
    for path in ['docs/doc-governance.md','docs/platform/governance.md']:jobs[path]=[(old,new)]
    for path in ['docs/README.md','docs/platform/documentation/operations/portals/docs-portal.md']:
        text=baseline(path);pairs=[]
        for line in text.splitlines():
            if line.startswith('| Current legacy product/source map |') or line.startswith('| legacy/current detailed source map |'):
                label='Current detailed source map' if line.startswith('| Current') else 'current detailed source map'
                target='reading-map.md' if path=='docs/README.md' else '../../../../reading-map.md'
                pairs.append((line,f'| {label} | [reading-map.md]({target}); prior-source lineage: `docs/specs/reading-map.md` (retired, not a reading route) |'))
            elif line.startswith('| User docs |'):
                prefix='' if path=='docs/README.md' else '../../../../'
                pairs.append((line,f'| User docs | [knowledge/]({prefix}knowledge/) plus retained [tutorials/]({prefix}tutorials/), [how-to/]({prefix}how-to/), [reference/]({prefix}reference/), [explanation/]({prefix}explanation/); `docs/tutorials/` contains a tracked `.gitkeep`, not tutorial content. `docs/user/**` remains a separate target, not an invented active directory. |'))
        pairs.append(('The documentation system is being migrated. Legacy roots such as\n`docs/specs/**` and `docs/architect/**` remain active until their content is\npromoted, redirected, or retired.','After the approved atomic cutover and conservation checks, maintained\n`docs/specs/**` and `docs/architect/**` are retired. These spellings describe\nprior-source lineage only. Current routing is `docs/reading-map.md`; each\nclaim has one promoted holder or explicitly retained root authority.'))
        jobs[path]=pairs
    jobs['docs/platform/host-invocation-routing/README.md']=[('The old documents under [../../architect/host-invocation-routing/](../../architect/host-invocation-routing/) remain legacy/current sources until redirected or drained. Do not delete them in this migration pass.','After accepted source conservation and the atomic cutover, the maintained\n`docs/architect/host-invocation-routing/` tree is retired. Its spelling is\nsource provenance, not a live compatibility route. Use [spec.md](spec.md) and\nthe exact contracts, architecture, decisions and verification linked by this\nportal; preserved snapshots remain non-authority history.')]
    path='docs/user/README.md';jobs[path]=[
      ('| Need | Target path | Current active path during migration |','| Need | Deferred target path | Retained path after platform cutover |'),
      ('| Learn by doing | `docs/user/tutorials/` | `docs/tutorials/` |','| Learn by doing | `docs/user/tutorials/` (not created) | `docs/tutorials/` (tracked `.gitkeep` only; no tutorial content) |'),
      ('During migration, existing user-doc roots remain active. New or moved user docs\nshould follow the target `docs/user/**` structure once the migration plan is\napproved.','The platform-authority cutover does not retire or rename the retained user-doc\nroots above, nor does it create `docs/user/tutorials/`. Mapped end-user content\nis also under `docs/knowledge/**`. The target `docs/user/**` remains a separate\nfuture migration; do not infer approval or new directories from this table.')]
    for path in ['docs/platform/migration-authoring-rules.md','docs/platform/host-invocation-routing/verification/source-preservation-audit.md','docs/platform/proposals/documentation-system-unification.md']:
        parked=next(s for s in ORDER['patches'] if s['path']==path)
        rows=[ROWS[rid] for rid in parked['rowIds']]
        pairs=[]
        for reason in dict.fromkeys(item(r).get('reason','') for r in rows):
            if ' Source: ' not in reason or ' Replacement: ' not in reason:continue
            old,new=reason.split(' Source: ',1)[1].split(' Replacement: ',1)
            # The final bookkeeping sentence is not authored product prose.
            new=new.removesuffix(' Retained path spellings remain literal; no early authority promotion.')
            if path.endswith('source-preservation-audit.md'):
                new='| `keep legacy` (completed source disposition) | Maintained old sources are retired after accepted conservation; declared provenance/history holders preserve the inputs without a live old-tree compatibility route. |'
            if path.endswith('migration-authoring-rules.md'):
                title=old.split('\n',1)[0]
                new=title+'\n   After accepted cutover, use the single current owner from `docs/reading-map.md`.\n   Never dual-author maintained prose in the retired `docs/specs/**` or\n   `docs/architect/**` trees. Preserve source evidence separately.'
            pairs.append((old,new))
        if pairs:jobs[path]=pairs
    for path,pairs in jobs.items():
        specrow=next(s for s in ORDER['patches'] if s['path']==path)
        try:
            s=replace(path,pairs,'status-units:'+path,rowIds=specrow['rowIds'],applicationCondition='Only in the approved atomic cutover after exact carriage/truth/conservation gates; this record does not certify those gates.')
            ACTIONS.append({'id':specrow['patchSpecId'],'kind':'composed-status-units','path':path,'rowIds':specrow['rowIds'],'composedSpecId':s['id'],'beforeSha256':s['beforeSha256'],'expectedAfterSha256':s['expectedAfterSha256'],'applicationCondition':s['applicationCondition']})
        except (AssertionError,ValueError) as e:
            PROBLEMS.append({'path':path,'rowIds':specrow['rowIds'],'reason':'Exact status unit drift: '+str(e),'gate':'G7'})


def remaining_park_actions():
    done={x['id'] for x in ACTIONS}
    for s in ORDER['patches']:
        if s['patchSpecId'] not in ORDER['parkedSpecIds'] or s['patchSpecId'] in done:continue
        path=s['path']
        if any(s['patchSpecId']==p.get('id') for p in PROBLEMS):continue
        if path=='docs/enduser-docs-index.json':
            ACTIONS.append({'id':s['patchSpecId'],'kind':'generator','path':path,'rowIds':s['rowIds'],'beforeSha256':sha(source(path)),'command':'generateEnduserDocsIndex(repoRoot, fgosDir) at cutover; bounded exported-input replay via replay-scans.mjs now','requires':'Lead final-pin export and post-move document tree; never hand-edit generated manifest','status':'bounded replay pending','owningProof':'test/report/enduser-index.test.mjs'})
        elif path=='docs/ui-spec/generated/wireframe-v2.html':
            ACTIONS.append({'id':s['patchSpecId'],'kind':'generator','path':path,'rowIds':s['rowIds'],'beforeSha256':sha(source(path)),'command':'node .claude/skills/ui-spec/tools/interpret.mjs --root docs/ui-spec --out docs/ui-spec/generated/wireframe-v2.html','requires':'Apply accepted ui-spec source specs first; retain compiler diagnostics and output-mode checks','status':'not-replayed; exact compiler argv needs confirmation','owningProof':'node .claude/skills/ui-spec/tools/validate.mjs --root docs/ui-spec'})
        else:
            units=[]
            for rid in s['rowIds']:
                r=ROWS[rid];x=item(r)
                units.append({'rowId':rid,'memberId':r[3],'record':CAT[r[1]],'recordLine':r[2],'sourceSpans':x.get('sourceSpans'),'sourceUnit':x.get('reason'),'sourceUnitSha256':sha(x.get('reason') or ''),'disposition':x.get('disposition'),'dependency':x.get('dependency')})
            status='pending-whole-row-composition'
            action={'id':s['patchSpecId'],'kind':'whole-row-authority-flip','path':path,'rowIds':s['rowIds'],'beforeSha256':sha(source(path)) if source(path) is not None else None,'command':'At separately approved cutover: compose each exact owning record unit below, then node --test test/scripts/check-doc-candidate-status.test.mjs and node --test test/scripts/doc-link-pass.test.mjs','units':units,'status':status,'requires':'Exact post-flip authority rows accepted; no generic prefix substitution and no early authority change'}
            ACTIONS.append(action)
            PROBLEMS.append({'id':s['patchSpecId'],'path':path,'rowIds':s['rowIds'],'gate':'G7','reason':'Whole-row authority flip has no exact forward/rollback diff yet; source-unit custody is indexed, not execution proof.'})


def member_joins():
    gates=readj(P8/'step-08-preflip-gates.json');joined=[]
    targets={8:48,13:16,17:8}
    by_file=collections.defaultdict(list)
    for r in ROWS.values():by_file[record(r)['file']].append(r)
    policy={p:row for row in readj(HERE/'scan-policy.json')['policies'] for p in row.get('files',[row.get('file')])}
    for family in gates['l12_96Composition']:
        number=family['familyNumber']
        if number not in targets:continue
        for member in family['integrationParkMembers']:
            r=ROWS[member['rowId']];x=item(r);rec=record(r);path=member['file'];current=source(path)
            passage=x.get('passage') or x.get('currentPassage',{}).get('text') or x.get('matchedExpression') or x.get('pathOperand') or x.get('targetSetOrConstruction') or ''
            if not isinstance(passage,str):passage=json.dumps(passage,ensure_ascii=False,sort_keys=True)
            locator={'file':path,'sha256':sha(current) if current is not None else None,'verbatimPassage':passage,'verbatimPassageSha256':sha(passage),'passageStillExact':bool(current is not None and passage in current),'originalSourceSha256':rec.get('sourceSha256') or rec.get('digest'),'record':CAT[r[1]],'recordLine':r[2],'recordSha256':sha((P8/CAT[r[1]]).read_bytes())}
            if number==13:
                holder='core/skills/_shared/citation-format.md#decision-homes-after-the-authority-cutover' if 'citation-format.md' in path else 'scripts/check-decision-citation-drift.mjs#loadSourceFiles'
                proof='test/scripts/check-decision-citation-drift.test.mjs'
                disposition='composed scan/convention; render followers generated from core'
            elif number==17:
                holder='docs/platform/governance.md#decision-scope-to-holder-table';proof='area-holder-table.json'
                disposition='composed table/consumer packet; missing holder rows remain explicit carriage blockers'
            else:
                holder={
                    'src/setup/registrations.mjs':'src/setup/registrations.mjs#checkDocNearDuplicate',
                    'scripts/generate-shipped-path-inventory.mjs':'scripts/generate-shipped-path-inventory.mjs#classifyContractScope',
                    'scripts/check-decision-citation-drift.baseline.json':'scripts/check-decision-citation-drift.mjs#findNewFindings',
                    'test/runner/dead-vocabulary-guard.test.mjs':'test/runner/dead-vocabulary-guard.test.mjs#collectPlatformSpecs',
                    'test/report/helpers/docs-index-state-fixture.mjs':'docs/knowledge/how-to-check-forgent-work-progress-rollup-check-dashboard/check-rollup-progress.md',
                }.get(path,path)
                proof=policy.get(path,{}).get('owningProof') or (path if path.startswith('test/') and path.endswith('.test.mjs') else 'test/scripts/check-decision-citation-drift.test.mjs' if 'citation-drift' in path else 'test/report/enduser-index.test.mjs' if path.startswith('test/report/') else None)
                disposition=policy.get(path,{}).get('resolution') or 'successor scan co-cut composed; coverage replay remains independent evidence'
            composed=[b['id'] for b in BODIES if b['path']==path or b['path']==holder.split('#')[0]]
            if number==17:composed+=['convention:area-holder-table']
            if number==13:composed+=['convention:citation-homes','scan:recursive-platform-citations']
            joined.append({'familyNumber':number,'rowId':r[0],'memberId':member['memberId'],'source':locator,'liveHolder':holder,'composedSpecIds':sorted(set(composed)),'policyRef':'scan-policy.json' if number==8 else None,'owningProof':proof,'disposition':disposition,'independentVerdict':'pending'})
        assert sum(r['familyNumber']==number for r in joined)==targets[number]
    dump('member-joins.json',{'sourceCommit':PIN,'counts':{str(k):v for k,v in targets.items()},'rows':joined,'independentAcceptance':False})


def post_move(tree):
    candidate=SCRATCH/'post-move'
    if candidate.exists():shutil.rmtree(candidate)
    shutil.copytree(SCRATCH/'skills',candidate)
    predecessor_log=[]
    for path,s in sorted(APPROVED.items()):
        if path in AFTERS or path.startswith(('.agents/','.claude/','plugins/fgOS/skills/')):continue
        p=candidate/path
        if not p.is_file():continue
        try:
            before=p.read_text()
        except (UnicodeDecodeError,ValueError):continue
        if sha(before)!=s['beforeSha256']:
            predecessor_log.append({'path':path,'status':'deferred-source-drift-to-G9','currentSha256':sha(before),'approvedBeforeSha256':s['beforeSha256']});continue
        try:p.write_text(apply_diff(path,before,s['diff']))
        except ValueError as e:predecessor_log.append({'path':path,'status':'patch-failure','error':str(e)})
    for path,text in AFTERS.items():
        p=candidate/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text)
    moves=readj(P8/'step-05-cutover-move-set.json')['paths'];retained={'docs/decisions/index.md','docs/enduser-docs-index.json','docs/architecture-manifest.json'};physical=[]
    for row in moves:
        old=row['oldPath']
        if old in retained:continue
        p=candidate/old
        if not p.is_file():continue
        before=p.read_bytes();targets=sorted({x['to'] for x in row['moves'] if x.get('to')});existing=[]
        for target in targets:
            out=candidate/target
            if out.exists():existing.append(target);continue
            out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(before)
        p.unlink()
        physical.append({'from':old,'sha256':sha(before),'targets':targets,'existingDestinationsNotOverwritten':existing})
    # Bounded export only; no store reader or live state is called.
    shutil.copyfile(P8/'step-07-state-path-export-v2.json',SCRATCH/'bounded-export.json')
    shutil.copyfile(HERE/'replay-scans.mjs',SCRATCH/'replay-scans.mjs')
    env={**os.environ};env.pop('CLAUDE_CODE_SESSION_ID',None)
    env['FGOS_HOST_BIN']='/home/vantt/.local/state/fgos/releases/sha256:447cb9a40339333a4ef51c33b9bc39c33a7b2dff31618e2f4296ef427c734d06/bin/fgos'
    env['TMPDIR']=str(SCRATCH)
    result=run(['node',str(SCRATCH/'replay-scans.mjs'),str(tree),str(candidate),str(SCRATCH/'bounded-export.json')],candidate,env=env)
    (HERE/'scan-replay.log').write_text(result.stdout+result.stderr)
    testresults=[]
    for file in ['test/scripts/check-decision-citation-drift.test.mjs','test/runner/dead-vocabulary-guard.test.mjs']:
        r=run(['node','--test',file],candidate,env=env)
        label=Path(file).stem
        (HERE/(label+'.log')).write_text(r.stdout+r.stderr)
        testresults.append({'file':file,'exit':r.returncode,'environment':{'CLAUDE_CODE_SESSION_ID':'unset','FGOS_HOST_BIN':env['FGOS_HOST_BIN'],'TMPDIR':str(SCRATCH)},'log':label+'.log'})
    dump('post-move-replay.json',{'sourceCommit':PIN,'scratchRoot':str(candidate),'physicalMoves':physical,'predecessors':predecessor_log,'scanReplayExit':result.returncode,'tests':testresults,'limitations':['No live state/config was copied. Single complete tests, no full suite.','G9-deferred predecessors and unresolved carriage/row actions mean this is not final-pin parity.','No baseline is changed or new finding suppressed.']})


def output():
    dump('patch-specs.json',{'sourceCommit':PIN,'recordsOnly':True,'appliedToWorkspace':False,'independentAcceptance':False,'patches':BODIES})
    dump('actions.json',{'sourceCommit':PIN,'actions':ACTIONS,'unresolved':PROBLEMS})
    dump('commands.json',COMMANDS)

if __name__=='__main__':
    tree=initial()
    try:
        simple_repairs()
        conventions()
        scope_table()
        hunk_parks()
        description_parks()
        successor_scans()
        gap_proposal()
        render_skills(tree)
        compose_status_units()
        remaining_park_actions()
        member_joins()
        post_move(tree)
    finally: output()
