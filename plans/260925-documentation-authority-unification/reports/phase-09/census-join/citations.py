#!/usr/bin/env python3
"""Bind the four navigation citations through existing ledger successors; never edit code.

The native-unit adapter, ledger supersession traversal and composition packet recipe
are reused. --check reproduces packets byte-for-byte and replays actual patch(1)
forward/rollback on scratch copies, not on the checkout.
"""
import argparse, difflib, hashlib, json, pathlib, runpy, subprocess, sys, tempfile
sys.dont_write_bytecode = True
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[4]
P = pathlib.Path('plans/260925-documentation-authority-unification')
sys.path.insert(0, str(ROOT/P/'reports/phase-09/ledgerfix'))
from bindings import documents, supersessions, effective, digest
extract = runpy.run_path(str(HERE.parent/'rebind/rebind.py'))['extract']
sha = lambda raw: hashlib.sha256(raw if isinstance(raw, bytes) else raw.encode()).hexdigest()
encode = lambda value: json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2)+'\n'


def build(pin):
    git = lambda *args: subprocess.check_output(['git', *args], cwd=ROOT).decode()
    decisions = json.loads((HERE/'settlement-decisions.json').read_text())
    docs = documents(); links = supersessions(docs)
    late = str(P/'ledger/decisions/s12-late-areas.json')
    packaging = str(P/'ledger/decisions/s4-packaging-distribution-distribution.json')
    # These are the explicit source-to-holder mappings, not guessed ordinal successors.
    origins = {'pc-l-0042': [(late, '/unitCarries/29'), (late, '/unitCarries/42')],
               'pc-l-0056': [(packaging, '/claims/3')],
               'pc-l-0077': [(late, '/unitCarries/170')],
               'pc-l-0078': [(late, '/unitCarries/170')]}
    from bindings import at
    resolved = {key: [effective(f,p,at(docs[f],p),docs,links) for f,p in refs]
                for key,refs in origins.items()}
    paths = sorted({r['targetOwner'] for refs in resolved.values() for f,p,r in refs})
    cat = extract({'virtual': [dict(path=p,content=git('show',pin+':'+p)) for p in paths]})['catalog']
    rows=[]; patches=[]
    for key,refs in resolved.items():
        decision, = [r for r in decisions['rows'] if r['id']==key]
        before=git('show',pin+':'+decision['file'])
        assert sha(before)==decision['sourceSha256'], key
        span=decision['evidence'][0]
        assert before.splitlines()[span['line']-1]==span['text']
        bindings=[]
        for (origin_file,origin_pointer),(f,p,r) in zip(origins[key],refs):
            u, = [u for u in cat[r['targetOwner']]['units'] if u['anchor']==r['targetAnchor'] and u['textDigest']==r['targetUnitDigest']]
            ancestry=u['ancestry']+([u['title']] if u['unitKind']=='heading' else [])
            assert ancestry==r['targetAncestry'] and digest(r)==r['bindingSha256']
            b={k:r[k] for k in ['targetOwner','targetAnchor','targetUnitDigest','targetAncestry','bindingSha256']}
            section = u if u['unitKind']=='heading' else next(v for v in reversed(cat[r['targetOwner']]['units'])
                if v['unitKind']=='heading' and v['startLine']<u['startLine'] and v['title']==u['ancestry'][-1])
            content='\n'.join(git('show',pin+':'+r['targetOwner']).splitlines()[u['startLine']-1:u['endLine']])
            b.update(ledger=dict(shard=f,pointer=p),originLedger=dict(shard=origin_file,pointer=origin_pointer),
                     sourceAnchor=at(docs[origin_file],origin_pointer).get('sourceAnchor'),sectionAnchor=section['anchor'],
                     locator=dict(startLine=u['startLine'],endLine=u['endLine']),content=content,
                     holderSha256=cat[r['targetOwner']]['fileSha256'])
            if key=='pc-l-0056':
                headings=json.loads((HERE.parent/'carries/source-heading-parity.json').read_text())
                heading, = [h for h in headings if h['sourcePath']=='docs/specs/distribution.md' and h['sourceAnchor']=='entry-points-triggers']
                assert any(t['path']==b['targetOwner'] and t['anchor']==b['targetAnchor'] and t['targetUnitDigest']==b['targetUnitDigest'] for t in heading['targets'])
                b['carryMapping']='carries/source-heading-parity.json#docs/specs/distribution.md#entry-points-triggers'
            bindings.append(b)
        if key=='pc-l-0042':
            old='docs/specs/seat-binding.md'; new=bindings[0]['targetOwner']
            reason='Both the tier-composition procedure (5.4) and per-property precedence table (6.3) retain their explicit late-area ledger mappings.'
        elif key=='pc-l-0056':
            old='docs/specs/distribution.md'; new=bindings[0]['targetOwner']+'#'+bindings[0]['sectionAnchor']
            reason='The original Entry Points & Triggers heading maps through the packaging ledger and carries/source-heading-parity.json, not the separate top-level 2. Entry Points table.'
        else:
            old='docs/specs/workflow.md'; new=bindings[0]['targetOwner']+'#'+bindings[0]['sectionAnchor']
            reason='The complete RUL-WF-27 block remains under 6. Business Rules, including the binding-as-rebuildable-view clause cited by this comment.'
        line=span['text']; assert line.count(old)==1
        new_line=line.replace(old,new)
        lines=before.splitlines(keepends=True); index=span['line']-1
        assert lines[index]==line+'\n'; lines[index]=new_line+'\n'; after=''.join(lines)
        diff=lambda a,b: ''.join(difflib.unified_diff(a.splitlines(keepends=True),b.splitlines(keepends=True),fromfile='a/'+decision['file'],tofile='b/'+decision['file']))
        forward=diff(before,after); rollback=diff(after,before)
        patch=dict(path=decision['file'],beforeSha256=sha(before),expectedAfterSha256=sha(after),
                   forwardDiff=forward,rollbackDiff=rollback,forwardSha256=sha(forward),rollbackSha256=sha(rollback),
                   composition='Current-pin citation delta only, not a replacement for shared whole-file composition. Lead must compose the full approved chain at F and recompute hashes; no fuzzy application or cutover acceptance.',
                   rationale=reason,generated=False,reviewStatus='pending',applied=False,citationId=key)
        with tempfile.TemporaryDirectory(prefix='citation-patch-',dir='/tmp/fgos-work') as name:
            scratch=pathlib.Path(name); target=scratch/decision['file']; target.parent.mkdir(parents=True)
            target.write_text(before)
            replay=[]
            for direction,text,wanted in [('forward',forward,sha(after)),('rollback',rollback,sha(before))]:
                command=['patch','--fuzz=0','--batch','-p1']
                proc=subprocess.run(command,cwd=scratch,input=text,text=True,capture_output=True)
                assert proc.returncode==0 and sha(target.read_bytes())==wanted,(key,direction,proc.stderr)
                assert 'offset' not in proc.stdout and 'fuzz' not in proc.stdout
                replay.append(dict(direction=direction,argv=command,exit=proc.returncode,stdout=proc.stdout,stderr=proc.stderr,resultSha256=wanted))
        patch['replay']=replay; patches.append(patch)
        rows.append(dict(id=key,disposition='joined-by-citation',sourceCommit=pin,file=decision['file'],
                         line=span['line'],sourceSha256=sha(before),citation=line,bindings=bindings,reason=reason,
                         patchPath='census-join/pointer-patches.json',reviewStatus='pending',independentApproval=False))
    return {'citation-bindings.json':dict(sourceCommit=pin,rows=rows,independentApproval=False),
            'pointer-patches.json':dict(version=1,sourcePin=pin,status='composed-not-applied-pending-shared-file-integration',patches=patches)}


def main():
    parser=argparse.ArgumentParser(); parser.add_argument('--pin',required=True); parser.add_argument('--check',action='store_true'); args=parser.parse_args()
    pin=subprocess.check_output(['git','rev-parse','--verify',args.pin+'^{commit}'],cwd=ROOT).decode().strip()
    pathlib.Path('/tmp/fgos-work').mkdir(parents=True,exist_ok=True)
    outputs=build(pin)
    for name,value in outputs.items():
        raw=encode(value)
        if args.check: assert (HERE/name).read_text()==raw,name+' drift'
        else: (HERE/name).write_text(raw)
    print(json.dumps(dict(status='passed',sourceCommit=pin,citations=4,bindings=5,unappliedPatches=4,zeroFuzzReplays=8,checkOnly=args.check),sort_keys=True))

if __name__=='__main__': main()
