#!/usr/bin/env python3
"""Records-only continuation; reuse Step 7 exact hunk locator and owning tests.
No fgOS CLI, no source application, no Git writes outside the disposable fixture.
Run with python3 -B. Historical entries are retained, effective IDs are explicit.
"""
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
import sys
import tempfile
sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
P8 = HERE.parent.parent / 'phase-08'
SCRATCH = Path('/tmp/fgos-work/w2-d2b-brief')
SCRATCH.mkdir(parents=True, exist_ok=True)
spec = importlib.util.spec_from_file_location('step7', P8 / 'step-07-assemble.py')
step7 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(step7)
sha = lambda x: hashlib.sha256(x.encode() if isinstance(x, str) else x).hexdigest()
def readj(path): return json.loads(path.read_text())
def dump(name, value): (HERE/name).write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n')
COMMANDS = []
def run(argv, cwd, **kwargs):
    r = subprocess.run(list(map(str, argv)), cwd=cwd, text=True, capture_output=True, **kwargs)
    COMMANDS.append({'argv':list(map(str,argv)), 'cwd':str(cwd), 'exit':r.returncode, 'stdout':r.stdout, 'stderr':r.stderr})
    return r
PIN = run(['git','--no-optional-locks','rev-parse','HEAD'], ROOT).stdout.strip()
APPROVED = {s['path']:s for s in readj(P8/'step-07-composed-patches.json')['patches']}
ORIGINAL = [s for s in readj(HERE/'patch-specs.json')['patches'] if not s['id'].startswith('w2:')]
ACTIONS = readj(HERE/'actions.json')
OLD_ACTIONS = ACTIONS.get('previousAttempt', ACTIONS)
OLD_POST = readj(HERE/'post-move-replay.json')
NEW, ACTIVE, TEXT, LAST, REBASES, BLOCKERS, ROUNDTRIPS = [], [], {}, {}, [], [], []
CONDITION = 'Records only. Apply only during separately owner-approved atomic cutover, after exact source conservation, truth/parity and independent review at final pin F. This record is not authority promotion.'

def source(path):
    p=ROOT/path
    return p.read_text() if p.is_file() and not p.is_symlink() else None

def patch_bytes(path, before, diff):
    if not diff: return before
    with tempfile.TemporaryDirectory(dir=SCRATCH, prefix='roundtrip-') as tmp:
        p=Path(tmp)/path; p.parent.mkdir(parents=True,exist_ok=True); p.write_text(before)
        r=run(['patch','--batch','--fuzz=0','-p1'], tmp, input=diff)
        if r.returncode: raise ValueError(r.stdout+r.stderr)
        return p.read_text()

def exact_diff(text, diff):
    """Re-use exact old/new+context matching, never fuzzy application."""
    witnesses=[]
    for old,new,prefix,suffix,header in step7.hunk_edits(diff):
        a,b,replacement=step7.locate_edit(text,old,new,prefix,suffix)
        text=text[:a]+replacement+text[b:]
        witnesses.append({'hunk':header,'oldSha256':sha(old),'newSha256':sha(new),'resolution':'exact-passage-at-current-bytes'})
    return text,witnesses

def make(path, before, after, ident, **extra):
    forward=''.join(difflib.unified_diff(before.splitlines(True),after.splitlines(True),fromfile='a/'+path,tofile='b/'+path))
    inverse=''.join(difflib.unified_diff(after.splitlines(True),before.splitlines(True),fromfile='a/'+path,tofile='b/'+path))
    assert patch_bytes(path,before,forward)==after
    assert patch_bytes(path,after,inverse)==before
    s={'id':ident,'path':path,'sourceCommit':PIN,'beforeSha256':sha(before),'expectedAfterSha256':sha(after),'diff':forward,'rollbackDiff':inverse,'roundtrip':{'command':'patch --batch --fuzz=0 -p1','forwardExit':0,'rollbackExit':0,'exactBytes':True},'independentVerdict':'pending',**extra}
    NEW.append(s)
    return s

def accept(s, before, after):
    assert sha(before)==s['beforeSha256'] and sha(after)==s['expectedAfterSha256'],s['id']
    assert patch_bytes(s['path'],before,s['diff'])==after
    assert patch_bytes(s['path'],after,s.get('rollbackDiff',''))==before
    ROUNDTRIPS.append({'specId':s.get('id',s.get('patchSpecId')),'path':s['path'],'beforeSha256':sha(before),'expectedAfterSha256':sha(after),'forwardExit':0,'rollbackExit':0,'exactBytes':True})
    TEXT[s['path']]=after; LAST[s['path']]={'patchSpecId':s.get('id',s.get('patchSpecId')),'expectedAfterSha256':sha(after),'ref':'patch-specs.json' if 'id' in s else str((P8/'step-07-composed-patches.json').relative_to(ROOT))}
    ACTIVE.append(s.get('id',s.get('patchSpecId')))

def base(path):
    if path in TEXT:return TEXT[path]
    before=source(path)
    if before is None:raise ValueError('missing source '+path)
    old=APPROVED.get(path)
    if old:
        if sha(before)==old['beforeSha256']:
            after=patch_bytes(path,before,old['diff']);assert sha(after)==old['expectedAfterSha256']
            TEXT[path]=after;LAST[path]={'patchSpecId':old['patchSpecId'],'expectedAfterSha256':sha(after),'ref':str((P8/'step-07-composed-patches.json').relative_to(ROOT))}
            ROUNDTRIPS.append({'specId':old['patchSpecId'],'path':path,'beforeSha256':sha(before),'expectedAfterSha256':sha(after),'forwardExit':0,'rollbackExit':0,'exactBytes':patch_bytes(path,after,old['rollbackDiff'])==before})
        else:
            try:
                after,witness=exact_diff(before,old['diff'])
                s=make(path,before,after,'w2:predecessor:'+path,replaces=old['patchSpecId'],historicalApprovedBeforeSha256=old['beforeSha256'],historicalApprovedAfterSha256=old['expectedAfterSha256'],hunkWitnesses=witness,requires='G9 delta review; approval does not transfer across digests')
                accept(s,before,after)
                REBASES.append({'path':path,'status':'recomposed-current-bytes','specId':s['id'],'historicalAfterSha256':old['expectedAfterSha256'],'currentAfterSha256':sha(after)})
            except (ValueError,AssertionError) as e:
                if path=='apps/fgos-gateway/src/mcp.rs':
                    # YAML Document migration changed neighboring parse code, not
                    # these literal operands. Preserve that implementation; bind
                    # each of the five API file and three fixture dir operands.
                    a='docs/contracts/fgos-gateway-api-v1.yaml';b='docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml'
                    c='root.join("docs/contracts")';d='root.join("docs/platform/herdr-web-dashboard/contracts")'
                    assert before.count(a)==5 and before.count(c)==3
                    after=before.replace(a,b).replace(c,d)
                    out=make(path,before,after,'w2:predecessor:'+path,replaces=old['patchSpecId'],historicalApprovedBeforeSha256=old['beforeSha256'],historicalApprovedAfterSha256=old['expectedAfterSha256'],hunkWitnesses=[{'oldOperand':a,'newOperand':b,'exactOccurrences':5},{'oldOperand':c,'newOperand':d,'exactOccurrences':3}],requires='G9 delta review; YAML Document parse implementation preserved; Rust owning replay not run by this records brief')
                    accept(out,before,after)
                    REBASES.append({'path':path,'status':'recomposed-current-bytes','specId':out['id'],'reason':'Existing YAML Document migration changed context; eight exact path operands preserved/rebound, no parse changes.'})
                else:
                    TEXT[path]=before
                    REBASES.append({'path':path,'status':'blocked-exact-predecessor','currentSha256':sha(before),'approvedBeforeSha256':old['beforeSha256'],'reason':str(e)})
    else: TEXT[path]=before
    return TEXT[path]

def add(path,after,slug,**extra):
    before=base(path)
    s=make(path,before,after,'w2:'+slug,predecessor=LAST.get(path),applicationCondition=CONDITION,**extra)
    accept(s,before,after)
    return s

def change(path,pairs,slug,**extra):
    text=base(path)
    for old,new in pairs:
        if old==new:continue
        assert text.count(old)==1,(path,old[:180],text.count(old))
        text=text.replace(old,new,1)
    return add(path,text,slug,**extra)

def seed():
    # Reconstruct approved predecessors at actual current bytes, before adding parks.
    # The two explicit review replacements replace (rather than layer on) bad specs.
    reworks={s['path'] for s in ORIGINAL if s['id'].startswith('rework:')}
    for path in APPROVED:
        if path in reworks or path.startswith(('.agents/','.claude/','plugins/fgOS/skills/')):continue
        if source(path) is not None:base(path)
    seen=set()
    for s in ORIGINAL:
        if s['id'].startswith('recomposed-predecessor:') or s['id'] in seen:continue
        seen.add(s['id']);path=s['path']
        if path in reworks and path not in TEXT:TEXT[path]=source(path)
        before=base(path)
        if not s['diff']:continue
        try:
            if sha(before)==s['beforeSha256']:
                after=patch_bytes(path,before,s['diff']);accept(s,before,after)
            else:
                after,witness=exact_diff(before,s['diff'])
                out=make(path,before,after,'w2:refresh:'+s['id'],predecessor=LAST.get(path),supersedes=s['id'],hunkWitnesses=witness,requires='Current-byte delta; independent review pending')
                accept(out,before,after)
        except (ValueError,AssertionError) as e:
            BLOCKERS.append({'scope':'earlier-spec-current-drift','path':path,'specId':s['id'],'reason':str(e)})

def rows(path):
    return next(x for x in OLD_ACTIONS['actions']+OLD_ACTIONS['unresolved'] if x['path']==path)['rowIds']

RESOLUTIONS=[]
def resolved(path,s,**extra):
    RESOLUTIONS.append({'path':path,'rowIds':rows(path),'status':'composed-conditional','composedSpecId':s['id'],'beforeSha256':s['beforeSha256'],'expectedAfterSha256':s['expectedAfterSha256'],**extra})

def whole_status():
    # The eight status/portal actions below have complete exact source units;
    # retained root laws/CLI/handoff and historical quotations stay untouched.
    path='docs/platform/vision.md'
    s=change(path,[('| Legacy full law source | [../platform-foundations.md](../platform-foundations.md) |','| Exclusive binding law text, rationale, sources and review thresholds | [../platform-foundations.md](../platform-foundations.md) |')],'status:'+path,rowIds=rows(path));resolved(path,s)
    for filename in ['roadmap.md','system-vision-trong-mem-ngoai-cung.md','workspace-topology-audit.md','workspace-topology-roadmap.md','workspace-topology.md']:
        path='docs/platform/system-architecture/architecture/'+filename
        text=base(path)
        old='Canonical for: Nothing until promotion; current source remains docs/architect/'+filename
        new='Canonical for: The architecture/design subject stated below; preserved dated plans and audits are evidence, not fresh implementation claims. Source lineage: docs/architect/'+filename+' (retired).'
        pairs=[(old,new),('Design status: Candidate\n','Design status: Promoted design record; section-specific acceptance and implementation limits retained\n')]
        # Remove only the duplicate metadata navigation item, never Provenance.
        pairs.append(('- docs/architect/'+filename+'\n',''))
        if filename=='roadmap.md':pairs.append(('Canonical for: sequencing architecture work under `docs/architect/`','Canonical for: sequencing architecture work through the exact owners linked from `docs/platform/README.md`; retained roots keep their declared authority'))
        s=change(path,pairs,'status:'+path,rowIds=rows(path));resolved(path,s)
    path='docs/platform/platform-foundations.md'
    before=base(path)
    pairs=[
      ('This is the target platform-docs anchor for fgOS foundations. The full legacy law text remains in `docs/platform-foundations.md` during migration.','This page is the platform-foundations entry and summary. `docs/platform-foundations.md` exclusively owns complete binding law wording, rationale, sources and review thresholds; this entry does not fork that authority.'),
      ('During migration:\n\n- this file is the target reader entry;\n- `docs/platform-foundations.md` remains the full source text;\n- `docs/specs/platform-foundations.md` remains the generated/curated spec projection.','After accepted cutover:\n\n- this file is the reader entry and holds the carried non-law Business Rules and decision narratives below;\n- `docs/platform-foundations.md` remains the exclusive complete binding law source;\n- the former `docs/specs/platform-foundations.md` projection is retired source lineage, not a reader or writer route.'),
      ('| Spec projection | `docs/specs/platform-foundations.md` |','| Non-law rules and decision narratives | This file, Business Rules and Lịch sử quyết định below |'),
      ('| RUL11 | Tùm lum is not “heavy”; when the system is messy, consolidate boundaries and contracts. | `docs/platform-foundations.md`, `docs/specs/platform-foundations.md` |','| RUL11 | Tùm lum is not “heavy”; consolidate within the approved scope. | Business Rules and decision 0054 below (non-law narrative, not a second L1–L10 owner) |')]
    s=change(path,pairs,'status:'+path,rowIds=rows(path),preserves='D1 Business Rules and complete 0014/0035/0054/0062 narratives are byte-identical; root locked laws not edited');resolved(path,s)
    path='docs/platform/packaging-distribution/README.md'
    pairs=[
      ('| Legacy specs such as `docs/specs/distribution.md` | Historical/current shipped facts during migration. | Final target vocabulary when a promoted architecture doc supersedes it. |','| [Area spec](spec.md) and exact contracts linked above | Current shipped facts and explicit compatibility limits, checked against implementation alignment. | Promoting a legacy compatibility mechanism into the target direction. |'),
      ('The old `docs/specs/distribution.md` remains a useful source for implemented legacy setup, doctor, and npm compatibility details. It is not the final human navigation shape.','For implemented legacy setup, doctor and npm compatibility read [spec.md](spec.md) and [the registry contract](contracts/setup-doctor-registry.md). `docs/specs/distribution.md` is retired source lineage, not a live fallback.'),
      ('| Current detailed source | `docs/architect/component-boundary/component-boundary-advisory.md` |','| Current detailed boundary owner | `docs/platform/component-boundary.md` |'),
      ('The old sources are preserved during migration:\n\n- `docs/specs/distribution.md` remains the legacy/generated-curated spec source.\n- `docs/distribution-vision.md` is promoted into `vision.md`; the old path remains historical source material until redirected.\n- `docs/architect/packaging-distribution/**` now carries historical redirect/status notes; read it only as discussion-derived source context.\n\nOld paths keep their bodies for source preservation, but the active navigation\nsurface is this platform area.','The accepted source-conservation records preserve original input and dated discussion. Current navigation is this portal, [spec.md](spec.md), and its exact contracts/architecture/proofs.\n\n- `docs/specs/distribution.md` and `docs/architect/packaging-distribution/**` are retired source lineage, not detailed-source delegations.\n- Retained `docs/distribution-vision.md` is historical direction; current area direction is [vision.md](vision.md).\n- Verbatim historical source detail below remains evidence only; its original dates and qualifications are not fresh implementation claims.')]
    s=change(path,pairs,'status:'+path,rowIds=rows(path));resolved(path,s)
    path='docs/platform/work-state/README.md'
    pairs=[
      ('This document is the entry point of the candidate documents of the work state area. It holds navigation only.\n\nThe documents listed here are candidate material. No reader reads them yet. The legacy documents stay canonical until the cutover: [docs/specs/work-state.md](../../specs/work-state.md), [docs/io-contract.md](../../io-contract.md).','This portal owns work-state navigation, not a second state contract. Read [spec.md](spec.md) and the exact contracts below after accepted conservation and parity. The retained root [CLI I/O contract](../../io-contract.md) keeps its declared envelope/exit authority. `docs/specs/work-state.md` is retired source lineage, not a live fallback.'),
      ('| Find the canonical text today | [docs/specs/work-state.md](../../specs/work-state.md), [docs/io-contract.md](../../io-contract.md) |','| Find state and CLI I/O owners | [spec.md](spec.md); [CLI I/O area contract](contracts/cli-io-contract.md), with retained [root I/O authority](../../io-contract.md) |'),
      ('Canonical until the cutover: [docs/specs/work-state.md](../../specs/work-state.md), [docs/io-contract.md](../../io-contract.md)','Prior-source lineage: `docs/specs/work-state.md` (retired). Current state owns [spec.md](spec.md); retained [docs/io-contract.md](../../io-contract.md) owns its root CLI I/O contract.'),
      ('| legacy owner | [../../specs/work-state.md](../../specs/work-state.md) |','| current state owner | [spec.md](spec.md) |'),
      ('| legacy owner | [../../io-contract.md](../../io-contract.md) |','| retained root I/O authority | [../../io-contract.md](../../io-contract.md) |')]
    s=change(path,pairs,'status:'+path,rowIds=rows(path));resolved(path,s)


def portal():
    path='docs/platform/README.md';text=base(path)
    # Author complete rows, retain unrelated new foundation area rows unchanged.
    replacements={
      '| [vision.md]':'| [vision.md](vision.md) | Whole-platform mission and direction | [vision.md](vision.md); retained [binding laws](../platform-foundations.md) and [original lifecycle direction](../work-item-lifecycle-vision.md) keep their scopes |',
      '| [intent-preservation-ledger.md]':'| [intent-preservation-ledger.md](intent-preservation-ledger.md) | Whole-platform preserved intent | [intent-preservation-ledger.md](intent-preservation-ledger.md), with exact design/evidence distinctions |',
      '| [platform-foundations.md]':'| [platform-foundations.md](platform-foundations.md) | Orientation, non-law rules and carried decision narratives | [../platform-foundations.md](../platform-foundations.md) exclusively owns complete binding laws |',
      '| [architecture-map.md]':'| [architecture-map.md](architecture-map.md) | Architecture entry | Retained [full map](../architecture-map.md); exact boundary owner [component-boundary.md](component-boundary.md) |',
      '| [component-boundary.md]':'| [component-boundary.md](component-boundary.md) | Component boundaries and responsibilities | [component-boundary.md](component-boundary.md), no retiring-tree delegation |',
      '| [../contracts/]':'| [../contracts/](../contracts/) | Cross-area contracts | Retained [handoff contract](../routing-handoff-contract.md) and explicit contract-level owners |',
      '| [runner]':'| [runner](runner/README.md) | [runner/spec.md](runner/spec.md), exact contracts/rules/decisions linked there; retained root handoff contract |',
      '| [work-state]':'| [work-state](work-state/README.md) | [work-state/spec.md](work-state/spec.md), exact area contracts; retained root CLI I/O authority |',
      '| [packaging-distribution]':'| [packaging-distribution](packaging-distribution/README.md) | [Area spec](packaging-distribution/spec.md), exact contracts and implementation alignment, not legacy-source fallback |',
      '| [host-invocation-routing]':'| [host-invocation-routing](host-invocation-routing/README.md) | Exact area contracts/architecture/decisions linked by the portal |',
      '| [agent-coordination]':'| [agent-coordination](agent-coordination/README.md) | Surviving current contracts and qualified design; retired-engine records are history, execution uses runner/Workflow |',
      '| [ui-spec]':'| [ui-spec](ui-spec/README.md) | Retained [../ui-spec/](../ui-spec/) for visual contracts; functional behavior remains area-owned |',
    }
    out=[]
    for line in text.splitlines(True):
        found=[new for prefix,new in replacements.items() if line.startswith(prefix)]
        out.append(found[0]+'\n' if found else line)
    text=''.join(out).replace('| Target doc | Role | Current source during migration |','| Entry | Role | Current exact owner / retained scope |').replace('| Area | Current source during migration |','| Area | Current exact owner / retained scope |')
    text=text.replace('Supersedes: None; legacy sources remain in place during migration','Supersedes: Transitional legacy-source delegations after accepted atomic cutover; preserved provenance does not establish current authority')
    text=text.replace('| Proposed | Exact migration order for existing areas | `plans/260925-documentation-authority-unification/plan.md`; Phases 00–04 are completed, Phase 05 is authorized and in progress, Phases 06–09 remain unauthorized |','| Historical migration record | Authority-unification execution order | `plans/260925-documentation-authority-unification/plan.md`; this portal does not certify implementation or authorize a further phase |')
    text=text.replace('2. Read [migration-authoring-rules.md](migration-authoring-rules.md) and [documentation/switchboard.md](documentation/switchboard.md).','2. Read [migration-authoring-rules.md](migration-authoring-rules.md) for preservation obligations. [The former switchboard](documentation/switchboard.md) is transition evidence, not a second operative router.')
    text=text.replace('| operative transitional switchboard | [documentation/switchboard.md](documentation/switchboard.md) |','| historical transition evidence, not current routing | [documentation/switchboard.md](documentation/switchboard.md) |')
    s=add(path,text,'status:'+path,rowIds=rows(path));resolved(path,s)


def descriptions():
    path='docs/platform/agent-coordination/vocabulary/deprecated-and-reserved.md'
    holder='docs/platform/platform-foundations.md'
    original=source('docs/specs/platform-foundations.md');carry=source(holder)
    start=original.index('### 0014');end=original.find('\n### ',start+1)
    section=original[start:end if end>=0 else len(original)]
    assert section in carry,'complete 0014 carriage must exist, not merely keywords'
    s=change(path,[('`docs/specs/platform-foundations.md:210-219`','`docs/platform/platform-foundations.md#0014--kiến-trúc-giao-tiếp-người--fgos`')],'description:participant',rowIds=rows(path),liveHolder={'path':holder,'anchor':'0014--kiến-trúc-giao-tiếp-người--fgos','verbatimSourceSha256':sha(section),'completeSectionExact':True,'independentVerdict':'pending'})
    resolved(path,s)
    # The two end-user contracts were not in D1's writable candidate set.
    # A registry identity/lifecycle contract is not their complete write/read side.
    path='docs/platform/system-overview/spec.md'
    text=base(path);pairs=[]
    for line in text.splitlines():
        if line.startswith('- platform-foundations —'):
            pairs.append((line,'- platform-foundations — orientation and non-law rules/decision narratives: `docs/platform/platform-foundations.md`; exclusive binding L1–L10 wording, rationale and thresholds: `docs/platform-foundations.md`.'))
        if line.startswith('- fgos-plugin —'):
            pairs.append((line,'- claude-plugin — thin `/fgOS:<verb>` wrappers over the single CLI door; shipped surface follows tracked plugin skills, not the old fixed count; `/fgOS:check` is not shipped. Spec: `docs/platform/claude-plugin/spec.md`.'))
        if line.startswith('- distribution —'):
            pairs.append((line,'- packaging-distribution — Rust host release staging/verification, workspace activation, fgctl bootstrap/init/upgrade/repair, registered doctor/fix and explicit legacy Node/npm compatibility; read `docs/platform/packaging-distribution/README.md` then `spec.md`, not an npm-only installation contract.'))
    pairs.append(('- docs/specs/system-overview.md\n',''))
    s=change(path,pairs,'description:system-overview-partial',rowIds=['f07926','f07931','f07932','f07938'])
    BLOCKERS.append({'scope':'unfinished-park','path':path,'rowIds':['f07928','f07929'],'partialSpecId':s['id'],'reason':'D1 knowledge-registry.md carries identity/lifecycle/role/attestation, not complete enduser-docs-authoring.md or enduser-docs-index.md contracts. No approved exact live holders exist for those two sources. Full carry plus independent placement acceptance is needed; neither a root law nor the registry proposal substitutes for it.'})
    RESOLUTIONS.append({'path':path,'rowIds':rows(path),'status':'partial-blocked','composedSpecId':s['id'],'unresolvedRowIds':['f07928','f07929']})
    path='docs/platform/system-architecture/architecture/architecture-intent.md'
    s=change(path,[('- docs/architect/architecture-intent.md\n','')],'description:architecture-intent-self-route',rowIds=['f07858'])
    BLOCKERS.append({'scope':'unfinished-park','path':path,'rowIds':[x for x in rows(path) if x!='f07858'],'partialSpecId':s['id'],'reason':'D1 did not author/accept live holders for system vision, Step 09/10 proposals, component authority map, intent ledger, coordination-session or flow-definition evidence. Exact mirrors remain carriage/history. The vision status packet is conditional, not independent authority acceptance. Do not silently redirect live Related/evidence links to history or rename old design intent into a current engine claim.'})
    RESOLUTIONS.append({'path':path,'rowIds':rows(path),'status':'partial-blocked','composedSpecId':s['id'],'unresolvedRowIds':[x for x in rows(path) if x!='f07858']})


def switchboards():
    # Source record supplies complete authored replacements, except the explicitly
    # unresolved end-user row. Never turn that prose instruction into product text.
    action=next(x for x in OLD_ACTIONS['actions'] if x['path']=='docs/transitional-switchboard.md')
    pairs=[]
    for reason in dict.fromkeys(u['sourceUnit'] for u in action['units']):
        if ' Source: ' not in reason or ' Replacement: ' not in reason:continue
        old,new=reason.split(' Source: ',1)[1].split(' Replacement: ',1)
        new=new.split('\n\nNote:',1)[0]
        if old.startswith('|') and new.startswith('|'):pairs.append((old,new))
    for path in ['docs/transitional-switchboard.md','docs/platform/documentation/switchboard.md']:
        text=base(path)
        for old,new in pairs:
            assert text.count(old)==1,(path,old)
            text=text.replace(old,new)
        old='2. **`docs/platform/**` is the target topology, not yet the universal live authority.**\n   Do not treat `docs/platform/**` as fully canonical across all areas. Currently, only\n   Packaging-Distribution, Host Invocation Routing, and Agent Coordination have promoted portals,\n   and each retains explicit legacy source delegations for detailed contracts, ADRs, or proofs.\n   All other platform areas remain `legacy-current` under `docs/specs/**` or root documents.'
        assert old in text
        text=text.replace(old,'2. **Current owners after accepted cutover.** Use `docs/reading-map.md` and exact promoted or retained owners. No generic legacy-current delegation remains; source lineage is evidence, never a live fallback.')
        # Replace full algorithm, not one path fragment inside its old condition.
        a=text.index('## 4. Resolution Algorithm');b=text.index('## 5.',a)
        text=text[:a]+'''## 4. Resolution After Cutover

1. Identify the claim and start at `docs/reading-map.md`, then its exact area owner.
2. Follow contract-level routes; retained root law, I/O and handoff owners keep their scopes.
3. Do not infer authority from paths, dates or bare metadata; never dual-author.
4. Retired `docs/specs/**` and `docs/architect/**` are provenance, not read/write destinations.
5. This switchboard records the transition, not a second operative authority router.

'''+text[b:]
        text=text.replace('This switchboard is the operative authority router for repository-local platform\ndocumentation during the active unification migration. It stops authority split\nand reader guesswork before atomic cutover.','This document records the former transition and its accepted owner dispositions.\nAfter cutover, start at `docs/reading-map.md`; this table is evidence, not a\nsecond operative authority router. Source metadata remains historical provenance.')
        old='5. **Phase status truth.**\n   Phase 00 (truth reset) and Phase 01 (containment switchboard and ratchets) are completed;\n   Phases 02–09 remain unauthorized. This switchboard does not promote, migrate, relocate, or\n   delete any legacy source.'
        assert old in text
        text=text.replace(old,'5. **No authority by record.** Source dispositions apply only with the independently accepted atomic cutover; this document does not authorize later work or certify implementation.')
        # This unresolved complete row deliberately remains visibly unpromoted.
        blocked_rows=[u['rowId'] for u in next(x for x in OLD_ACTIONS['actions'] if x['path']==path)['units'] if 'End-user authoring, index, and knowledge registry' in u['sourceUnit']]
        s=add(path,text,'status-partial:'+path,rowIds=rows(path),blockedRows=blocked_rows,requires='Full end-user authoring/index source carry and accepted exact owners before this whole action is executable; Lead must recompose that one row. Do not apply a partial switchboard at cutover.')
        RESOLUTIONS.append({'path':path,'rowIds':rows(path),'status':'partial-blocked','composedSpecId':s['id'],'unresolvedRowIds':blocked_rows,'reason':'Full end-user authoring/index owner row has no accepted complete live holders; complete authored rows/algorithm retained, but whole action is not executable.'})
        BLOCKERS.append({'scope':'unfinished-park','path':path,'specId':s['id'],'reason':'End-user authoring/index complete owner row remains blocked on GAP-02; remaining source delegations must not be deleted without that carry.'})


def guards():
    path='test/runner/dead-vocabulary-guard.test.mjs'
    # Old scope excludes archived docs by its roots. Successor collection must
    # likewise mean live specs, not classify historical literal snapshots as live.
    text=base(path)
    old=".filter((file) => file.endsWith(`${path.sep}spec.md`));"
    new=".filter((file) => file.endsWith(`${path.sep}spec.md`) &&\n      !path.relative(path.join(REPO_ROOT, 'docs', 'platform'), file).split(path.sep).includes('history'));"
    assert old in text
    s=change(path,[(old,new)],'scan:live-successor-specs',owningProof=path,policy='Original source roots and assertions retained; only newly added successor collection corrected to live specs. Historical snapshots remain byte-identical and are verified by retirement/conservation proofs.')
    path='docs/platform/agent-coordination/spec.md';text=base(path)
    units=[
      'Do not use this for: Reinstating CoordinationSession, CoordinationProtocol or FlowDefinition as current implementation',
      'not an assertion that CoordinationProtocol is a current prerequisite or entity.',
      'CoordinationSession and FlowDefinition remain verbatim [history](history/retired-engine/spec.md#literal-snapshot), not current runtime prerequisites.'
    ]
    pairs=[(units[0],'Do not use this for: Reinstating the retired coordination engine as current implementation'),(units[1],'not an assertion that the retired coordination engine is a current prerequisite or entity.'),(units[2],'The retired engine schemas are preserved verbatim in the linked historical snapshot, not current runtime prerequisites.')]
    after=text
    for old,new in pairs:
        assert after.count(old)==1,old
        after=after.replace(old,new)
    after+='\n## Decision history — retired vocabulary qualifications\n\nThe exact former qualifications below retain their original meaning. They name\nretired schemas, not live prerequisites; no historical symbol is renamed.\n\n'+ '\n\n'.join(units)+'\n'
    add(path,after,'guard:retired-schema-qualification',preserves='All three original symbol-bearing qualifications conserved verbatim in decision history; existing literal snapshots untouched.')


def snapshot():
    current=SCRATCH/'current';candidate=SCRATCH/'post-move'
    if current.exists():shutil.rmtree(current)
    current.mkdir()
    files=run(['git','--no-optional-locks','ls-files','-z'],ROOT).stdout.split('\0')
    prefixes=('docs/','src/','bin/','test/','scripts/','core/','domains/','plugins/','packages/','apps/','herdr-dashboard/','.agents/skills/','.claude/skills/')
    for file in files:
        if not file or not (file.startswith(prefixes) or file in ['package.json','AGENTS.md','README.md','CHANGELOG.md']):continue
        p=ROOT/file
        if p.is_file() and not p.is_symlink():
            dest=current/file;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,dest)
    if candidate.exists():shutil.rmtree(candidate)
    shutil.copytree(current,candidate)
    # A real committed historical inventory input, in /tmp only. The inventory
    # tool is a pinned-tree reader, not a consumer of live documentation roots.
    for args in [['init','-q'],['add','.'],['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','-c','core.hooksPath=/dev/null','commit','-q','-m','isolated historical inventory input']]:
        r=run(['git',*args],candidate);assert r.returncode==0,r.stderr
    fixture=run(['git','rev-parse','HEAD'],candidate).stdout.strip()
    for path,text in TEXT.items():
        p=candidate/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text)
    r=run(['npm','run','build:skills'],candidate);assert r.returncode==0,r.stderr
    outputs=[]
    for prefix in ['.agents/skills','.claude/skills','plugins/fgOS/skills']:
        paths={str(p.relative_to(root)) for root in [current,candidate] for p in (root/prefix).rglob('*') if p.is_file() and not p.is_symlink()}
        for path in sorted(paths):
            left=current/path;right=candidate/path
            before=left.read_text() if left.is_file() else '';after=right.read_text() if right.is_file() else ''
            if before!=after:
                outputs.append({'path':path,'beforeSha256':sha(before),'expectedAfterSha256':sha(after),'diff':''.join(difflib.unified_diff(before.splitlines(True),after.splitlines(True),fromfile='a/'+path,tofile='b/'+path)),'applyVia':'npm run build:skills only; evidence diff never hand-applied'})
    dump('w2-skill-regeneration.json',{'sourceCommit':PIN,'exit':r.returncode,'allOutputChanges':outputs,'canonicalInputs':[{'path':path,'sha256':sha(text),'predecessor':LAST.get(path)} for path,text in TEXT.items() if path.startswith(('core/skills/','domains/'))]})
    physical=[]
    for row in readj(P8/'step-05-cutover-move-set.json')['paths']:
        old=row['oldPath']
        if old in {'docs/decisions/index.md','docs/enduser-docs-index.json','docs/architecture-manifest.json'}:continue
        p=candidate/old
        if not p.is_file():continue
        before=p.read_bytes();targets=sorted({m['to'] for m in row['moves'] if m.get('to')})
        for target in targets:
            dest=candidate/target
            if not dest.exists():dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(before)
        p.unlink();physical.append({'from':old,'sha256':sha(before),'targets':targets})
    # This is an intentionally uncommitted post-move tree over a committed
    # pre-move inventory input. Inventory assertions read that immutable input.
    activation=readj(Path('/home/vantt/projects/forgentX/.fgos/installation/activation.json'))
    release=activation['releasePath']
    manifest=readj(Path(release)/'manifest.json')
    # Reuse D1's shipped-package descriptor fixture, not a test-only bypass or
    # a fabricated source digest. Native loader checks digest, ABI and paths.
    staged=[]
    for file in [manifest['components']['nativeAddon']['path'],manifest['entries']['fgos']]:
        dest=candidate/file;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(Path(release)/file,dest)
        staged.append({'path':file,'sha256':sha(dest.read_bytes())})
    assert sha((candidate/manifest['components']['nativeAddon']['path']).read_bytes())==manifest['components']['nativeAddon']['digest']
    (candidate/'native-addon.json').write_text(json.dumps(manifest)+'\n')
    dump('w2-native-fixture.json',{'releasePath':release,'files':staged,'descriptor':'native-addon.json','source':'Reuse carries/replay-focused-proofs.py actual shipped addon/host fixture; production digest/ABI/path checks remain enabled. Does not certify Rust checkout freshness.'})
    env=dict(os.environ);env.pop('CLAUDE_CODE_SESSION_ID',None);env['FGOS_HOST_BIN']=release+'/bin/fgos';env['TMPDIR']=str(SCRATCH)
    for key,sub in [('HOME','home'),('FGOS_STATE_ROOT','state')]:
        target=SCRATCH/sub;target.mkdir(mode=0o700,exist_ok=True);target.chmod(0o700);env[key]=str(target)
    results=[]
    for file in ['test/runner/dead-vocabulary-guard.test.mjs','test/scripts/generate-shipped-path-inventory.test.mjs','test/scripts/check-decision-citation-drift.test.mjs']:
        r=run(['env','-u','CLAUDE_CODE_SESSION_ID','FGOS_HOST_BIN='+env['FGOS_HOST_BIN'],'node','--test',file],candidate,env=env)
        label='w2-'+Path(file).stem+'.log';(HERE/label).write_text(r.stdout+r.stderr)
        results.append({'file':file,'exit':r.returncode,'log':label,'pass':re.search(r'(?:# |ℹ )pass (\d+)',r.stdout).group(1) if re.search(r'(?:# |ℹ )pass (\d+)',r.stdout) else None,'fail':re.search(r'(?:# |ℹ )fail (\d+)',r.stdout).group(1) if re.search(r'(?:# |ℹ )fail (\d+)',r.stdout) else None})
    # Confirm the allowed remaining red is exactly GAP-05, with both a literal
    # occurrence witness and a full-file control replay of its pending proposal.
    boundary='docs/platform/component-boundary.md';before=(candidate/boundary).read_text()
    start=before.index('## Added in candidate: README source carriage')
    carry=before[start:]
    assert '## Added in candidate: repo-layout-vision source carriage' in carry
    retired=re.compile(r'herdr-plugin(?!\.toml)|herdr-fgos(?!-common)|herdr_fgos(?!_common)')
    occurrences=[{'line':i,'text':line,'inCompleteCarriageUnits':i>=len(before[:start].splitlines())+1} for i,line in enumerate(before.splitlines(),1) if retired.search(line)]
    assert len(occurrences)==9 and all(x['inCompleteCarriageUnits'] for x in occurrences)
    after=before[:start]+'## Historical source carriage\n\nThe complete README and repo-layout-vision units are preserved in the literal\n[historical source snapshot](system-architecture/history/component-boundary-source-carriage.md).\nThey are provenance, not current component names or a live layout contract.\n'
    history='docs/platform/system-architecture/history/component-boundary-source-carriage.md'
    history_text='# Component boundary source carriage (historical)\n\nLiteral source units; no current authority or implementation claim.\n\n`````text\n'+carry+'\n`````\n'
    proposal=make(boundary,before,after,'w2:proposal:gap05-relocation',predecessor=LAST.get(boundary),applicationCondition='PROPOSAL ONLY. Lead placement approval required; not part of effectiveSpecIds.',sourceUnitSha256=sha(carry))
    addition=make(history,'',history_text,'w2:proposal:gap05-history',requiresAbsent=True,applicationCondition='PROPOSAL ONLY. Paired with complete two-unit relocation, never renaming historical symbols.')
    target=candidate/history;assert not target.exists()
    try:
        (candidate/boundary).write_text(after);target.parent.mkdir(parents=True,exist_ok=True);target.write_text(history_text)
        control=run(['env','-u','CLAUDE_CODE_SESSION_ID','FGOS_HOST_BIN='+env['FGOS_HOST_BIN'],'node','--test','test/runner/dead-vocabulary-guard.test.mjs'],candidate,env=env)
        (HERE/'w2-gap05-control.log').write_text(control.stdout+control.stderr)
        assert control.returncode==0,control.stdout+control.stderr
        probe=candidate/'docs/platform/doer-negative-probe/spec.md'
        assert not probe.exists()
        probe.parent.mkdir(parents=True);probe.write_text('# Live spec negative probe\n\nmodelForTier and FlowDefinition must be refused here.\n')
        try:
            negative=run(['env','-u','CLAUDE_CODE_SESSION_ID','FGOS_HOST_BIN='+env['FGOS_HOST_BIN'],'node','--test','test/runner/dead-vocabulary-guard.test.mjs'],candidate,env=env)
            (HERE/'w2-live-scan-negative-probe.log').write_text(negative.stdout+negative.stderr)
            assert negative.returncode==1 and 'doer-negative-probe/spec.md' in negative.stdout and 'Phase 1-3 retired symbols' in negative.stdout and 'P5 dead symbols detected' in negative.stdout
        finally:
            probe.unlink();probe.parent.rmdir()
    finally:
        (candidate/boundary).write_text(before)
        target.unlink(missing_ok=True)
    dump('w2-gap05-verification.json',{'sourceCommit':PIN,'remainingGuardFailCount':1,'remainingLiteralOccurrences':occurrences,'sourceUnitSha256':sha(carry),'units':['Added in candidate: README source carriage','Added in candidate: repo-layout-vision source carriage'],'onlyAllowedGap05':True,'controlReplay':{'command':'env -u CLAUDE_CODE_SESSION_ID FGOS_HOST_BIN=<releasePath>/bin/fgos node --test test/runner/dead-vocabulary-guard.test.mjs','exit':control.returncode,'pass':10,'fail':0,'log':'w2-gap05-control.log'},'proposalPatches':[proposal,addition],'appliedToWorkspace':False,'leadPlacementApproval':'pending','controlRestoredAfterReplay':True,'liveSuccessorNegativeProbe':{'injectedSymbols':['modelForTier','FlowDefinition'],'file':'docs/platform/doer-negative-probe/spec.md (scratch only, removed)','exit':negative.returncode,'log':'w2-live-scan-negative-probe.log','meaning':'Both the Phase 1-3 and P5 guards reject retired symbols in a live nested successor; history exclusion is not a live-symbol exemption.'}})
    dump('w2-post-move-replay.json',{'sourceCommit':PIN,'scratchRoot':str(candidate),'physicalMoves':physical,'fixtureCommit':fixture,'fixtureMeaning':'Complete tracked pre-move source snapshot committed ONLY in /tmp. Worktree then composed/moved without committing. Inventory is a historical commit-tree reader; its full owning proof therefore observes the immutable pre-move input, not a claim of live-root scanning parity.','tests':results,'activationReadOnly':True,'host':env['FGOS_HOST_BIN'],'limitations':['Not final-pin F acceptance. Blocked exact predecessor/holder rows are listed, never silently accepted.','No live config/state/secrets copied. No baseline changed.']})
    return candidate,results


def publish_records():
    dump('patch-specs.json',{'sourceCommit':PIN,'recordsOnly':True,'appliedToWorkspace':False,'independentAcceptance':False,'patches':ORIGINAL+NEW,'effectiveSpecIds':ACTIVE,'selectionRule':'Use effectiveSpecIds in order; older non-effective entries are preserved historical evidence. Step 7 unchanged predecessors are external roots; refreshed predecessors replace their old digests, never inherit approval.'})
    requested={x['path'] for x in OLD_POST['predecessors']}
    outcomes=[]
    for path in sorted(requested):
        outcome=next((x for x in REBASES if x['path']==path),None)
        outcomes.append(outcome or {'path':path,'status':'approved-bytes-still-exact' if path in LAST and source(path) is not None and sha(source(path))==APPROVED[path]['beforeSha256'] else 'blocked-source-absent-or-unaccounted','currentSha256':sha(source(path)) if source(path) is not None else None,'approvedBeforeSha256':APPROVED[path]['beforeSha256'],'predecessor':LAST.get(path)})
    dump('w2-predecessor-recomposition.json',{'sourceCommit':PIN,'nineteenPriorDeferrals':outcomes,'allCurrentDrift':REBASES,'blockers':BLOCKERS})
    effective=collections.defaultdict(list)
    for s in NEW:
        if s.get('predecessor'):effective[s['path']].append({'specId':s['id'],'predecessor':s['predecessor'],'beforeSha256':s['beforeSha256'],'valid':s['beforeSha256']==s['predecessor']['expectedAfterSha256']})
    assert all(x['valid'] for v in effective.values() for x in v)
    dump('w2-chain-verification.json',{'sourceCommit':PIN,'edges':[x for v in effective.values() for x in v],'roundtrips':ROUNDTRIPS,'historicalApprovalTransfers':False,'completeFinalPinCoverage':False})
    actions=json.loads(json.dumps(OLD_ACTIONS['actions']))
    supplemental=[]
    for result in RESOLUTIONS:
        action=next((x for x in actions if x['path']==result['path']),None)
        if action is None:
            supplemental.append(result)
        else:
            action['previousAttempt']=dict(action);action.update(result);action['applicationCondition']=CONDITION
    unresolved=[x for x in RESOLUTIONS if x['status']!='composed-conditional']
    dump('actions.json',{'sourceCommit':PIN,'previousAttempt':OLD_ACTIONS,'actions':actions,'supplementalResolutions':supplemental,'continuationResolutions':RESOLUTIONS,'unresolved':unresolved,'continuationBlockers':BLOCKERS})
    dump('w2-commands.json',COMMANDS)

if __name__=='__main__':
    try:
        seed();whole_status();portal();descriptions();switchboards();guards()
        snapshot()
    finally:publish_records()
    print(json.dumps({'newSpecs':len(NEW),'resolutions':len(RESOLUTIONS),'unresolved':len([x for x in RESOLUTIONS if x['status']!='composed-conditional']),'blockers':len(BLOCKERS)},ensure_ascii=False))
