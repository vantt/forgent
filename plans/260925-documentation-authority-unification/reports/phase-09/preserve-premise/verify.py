#!/usr/bin/env python3
"""One scoped replay: two isolated runs, byte equality, identity/count conservation.
No test runner, CLI, Git writes or live state. Final-pin acceptance stays with Lead.
"""
import sys
sys.dont_write_bytecode = True
import argparse, collections, hashlib, json, pathlib, re, subprocess, tempfile
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[4]
CENSUS = HERE.parent/'census-join'


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--pin',default='HEAD')
    args = ap.parse_args()
    pin = subprocess.check_output(['git','rev-parse','--verify',args.pin+'^{commit}'],cwd=ROOT,text=True).strip()
    assert not subprocess.check_output(['git','diff','--name-only',pin,'--','docs','src','scripts','test','packages','apps'],cwd=ROOT).strip(), 'source drift outside records / source modules differ from pin'
    # Fail closed before replay: this combined verifier also owns G2, whose
    # delivered artifacts must be refreshed by their owner, not silently skipped
    # when a records-only G6 turn has a newer source pin.
    assert json.loads((CENSUS/'join.json').read_text())['sourceCommit']==pin, 'G2 delivered census pin differs; refresh census-join artifacts in their owning scope before combined G2/G6 verification'
    scratch = pathlib.Path('/tmp/fgos-work/w6-misc-sentence');scratch.mkdir(parents=True,exist_ok=True)
    commands, comparisons = [], []
    with tempfile.TemporaryDirectory(prefix='double-replay-',dir=scratch) as name:
        base = pathlib.Path(name)
        for label, script, extra, owning, outputs in [
            ('census','join.py',['--rescan'],CENSUS,['join.json','residue.json','post-pin-literals.json','post-pin-dynamics.json']),
            ('preserve','proof.py',[],HERE,['proof.json','retire-with-tree.json','judgments.json','history-wrapper-proposals.json']),
        ]:
            stdouts = []
            for round in (1,2):
                out = base/(label+'-'+str(round))
                argv = ['python3','-B',str((owning/script).relative_to(ROOT)),*extra,'--pin',pin,'--out',str(out)]
                run = subprocess.run(argv,cwd=ROOT,capture_output=True)
                commands.append(dict(label=label,round=round,argv=argv,exit=run.returncode,stdout=run.stdout.decode(),stderr=run.stderr.decode()))
                assert run.returncode == 0, run.stderr.decode()
                stdouts.append(run.stdout)
            assert stdouts[0] == stdouts[1], label+' stdout drift'
            for output in outputs:
                a,b = [(base/(label+'-'+str(round))/output).read_bytes() for round in (1,2)]
                actual = (owning/output).read_bytes()
                assert a == b == actual, label+'/'+output+' byte drift'
                comparisons.append(dict(path=str((owning/output).relative_to(ROOT)),sha256=sha(a),bytes=len(a),runsByteIdentical=True,checkedInWorkingArtifactEqual=True))
        join = json.loads((CENSUS/'join.json').read_text())
        proof = json.loads((HERE/'proof.json').read_text())
        assert join['sourceCommit'] == proof['sourceCommit'] == pin
        assert len(join['rows']) == len({r['id'] for r in join['rows']}) == 1126
        register = json.loads((HERE.parent.parent/'phase-08/step-08-preflip-gates.json').read_text())
        assert {r['id'] for r in join['rows']}=={r['id'] for r in register['nonBehavioralCensusSites']}
        residue = json.loads((CENSUS/'residue.json').read_text())
        assert {r['id'] for r in residue['rows']}=={r['id'] for r in join['rows'] if r['status']=='judgment-required'}
        assert all(r['owningProofs'] for r in join['rows'] if r['status']=='joined-owning-test')
        assert not any('joins explicit call sites' in r.get('custody','') for r in residue['rows'] if not r['owningProofs'])
        deleted = [r for r in residue['rows'] if not r['sourcePresent']]
        assert len(deleted)==28 and all(r['deletingCommit']=='5a33989fa39e0eb3d3253ddb4189cb502f93bd21' for r in deleted)
        for id in ('pc-d-0185','pc-d-0186'):
            row, = [r for r in join['rows'] if r['id']==id]
            assert row['owningProofs'][0]['testTitle']=='recovery_matrix_all_payload_kinds'
        blobs = {}
        def source(file):
            if file not in blobs: blobs[file] = subprocess.check_output(['git','show',pin+':'+file],cwd=ROOT,text=True)
            return blobs[file]
        for row in join['rows']:
            for proof_ref in row['owningProofs']:
                if proof_ref['file'].endswith('.rs'):
                    lines = source(proof_ref['file']).splitlines()
                    assert '#[test]' in lines[proof_ref['line']-1] or '#[tokio::test' in lines[proof_ref['line']-1]
                    assert re.search(r'fn\s+'+re.escape(proof_ref['testTitle'])+r'\s*\(',lines[proof_ref['functionLine']-1])
        literals = json.loads((CENSUS/'post-pin-literals.json').read_text())
        assert literals['sourceCommit']==pin and all(r.get('reason') or r.get('custody') for r in literals['rows'])
        for row in literals['rows']:
            for proof_ref in row.get('owningProofs',[]):
                assert source(proof_ref['file']).splitlines()[proof_ref['line']-1].strip()=='#[test]'
        dynamics = json.loads((CENSUS/'post-pin-dynamics.json').read_text())
        reviewed = json.loads((HERE.parent/'reviews/w2-g2-dyn-delta.json').read_text())
        assert dynamics['sourceCommit']==pin
        assert dynamics['reviewedSites']==dynamics['reviewedSitesBound']==132 and dynamics['reviewedSitesUnbound']==0
        assert sorted(r['reviewSite'] for r in dynamics['rows'] if 'reviewSite' in r)==sorted(reviewed)
        reader_rows = [r for r in dynamics['rows'] if r.get('reviewSite',[None]*6)[5]=='reader']
        assert len(reader_rows)==13 and len({r['reason'] for r in reader_rows})==13
        assert all(r['status']=='judged-non-document-REJECT' and r['gradeRecord']['nonDocumentUse'] for r in reader_rows)
        assert all(r.get('reason') and r.get('owner') for r in dynamics['rows'])
        assert all(r['owningProofs'] for r in dynamics['rows'] if r['status']=='joined-owning-test')
        assert collections.Counter(r['stage'] for r in proof['rows']) == {'step-03':4804,'step-04':609}
        assert len({r['rowId'] for r in proof['rows']}) == 5413
        assert len(proof['negativeDecisionProbes']) == 10 and all(r['actual'].startswith('park-') and r['evidence'] is None for r in proof['negativeDecisionProbes'])
        assert all('source' in r and 'spans' in r for r in proof['negativeDecisionProbes'])
        assert len(proof['positiveEvidenceControls'])==5 and all(r['evidence'] for r in proof['positiveEvidenceControls'])
        rows = {r['rowId']:r for r in proof['rows']}
        review = json.loads((HERE.parent/'reviews/w2-g6-preserve-review.json').read_text())
        live_pointers = [v['id'] for v in review['verdicts'] if v['verdict']=='REWORK' and v['reason'].startswith('live pointer to')]
        assert len(live_pointers)==29
        # Two current-source passages no longer bind at the W4 pin; they stay
        # parked, never inherit history. Three physical destinations are the
        # consumer itself and cannot serve as successor proposals (L12-35(7)).
        self_successors={'f07697','f08033','f08047'}
        for id in live_pointers:
            expected='park-current-passage-unbound' if id in {'f08077','f08079'} else 'park-unconfirmed-preserve-premise'
            assert rows[id]['result']==expected and rows[id]['evidence'] is None
            assert rows[id]['candidateSuccessors'] or (id in self_successors and rows[id]['excludedSelfSuccessor']==rows[id]['file'])
        removed_ids = ['f00515','f00521','f00525','f01225','f08411']
        assert all(rows[id]['result']=='park-source-removed-by-cutover' and rows[id]['sourceSuccessors'] for id in removed_ids)
        wrapper_ids = ['f05646','f05655','f05661','f05671','f05677','f05693','f05720','f05730','f05742','f06391','f06167']
        assert all(rows[id]['result']=='judgment-preserve-with-dated-note' and rows[id]['successor']['presentAfterCutover'] for id in wrapper_ids)
        assert rows['f06167']['evidence'] is None
        assert rows['f07526']['result']=='park-unconfirmed-preserve-premise' and rows['f07526']['proposedDisposition']=='repoint-proposal'
        assert rows['f07526']['successor']['path']=='docs/platform/agent-coordination/architecture/dispatch-control-plane.md'
        assert not any(r['result'].startswith('preserve-') for r in rows.values() if not r['sourcePresentAfterCutover'])
        same_unit, = [p for p in proof['negativeDecisionProbes'] if p['case']=='marker elsewhere in the same bound unit']
        assert 'e.g.' in same_unit['currentUnit'] and same_unit['bound']==[1]
        assert 'e.g.' not in same_unit['source'].splitlines()[0]
        assert same_unit['actual']=='park-unconfirmed-preserve-premise' and same_unit['evidence'] is None
        same_line, = [p for p in proof['negativeDecisionProbes'] if p['case']=='same line marker in a different sentence']
        assert len(same_line['source'].splitlines())==1 and 'For example' in same_line['currentUnit']
        assert same_line['actual']=='park-unconfirmed-preserve-premise' and same_line['evidence'] is None
        # Reuse the owning predicate, including its column binding, rather than
        # maintain a second sentence splitter in this boundary verifier.
        import sys
        sys.path.insert(0,str(HERE))
        from proof import historical_evidence
        for row in rows.values():
            if (row['evidence'] or {}).get('kind') in {'explicit-external-or-example-framing','explicit-path-placeholder'}:
                raw = source(row['file'])
                bound_text='\n'.join(raw.splitlines()[n-1] for n in row['currentLines'])
                assert row['evidence']['text'] in bound_text
                assert row['evidence']==historical_evidence(raw,row['currentLines'],row['statedReason'],row['currentUnit'],row['sourceSpans'][0])
                if row['evidence']['kind']=='explicit-path-placeholder':
                    assert re.search(r'<[\w-]+>',row['sourceSpans'][0]['text'])
        assert rows['f07821']['file']=='docs/platform/runner/subcomponents/h-6979005beaf7/spec.md'
        assert rows['f07821']['currentLines']==[67] and rows['f07821']['sourceSpans'][0]['columnStart']==939
        assert rows['f07821']['result']=='preserve-operand-reachability-unchanged' and rows['f07821']['evidence'] is None
        assert proof['positiveEvidenceControls'][0]['span']['text']=='docs/specs/x.md'
        for id in ['f00167','f08807','f07822','f08072','f08073']:
            assert rows[id]['result']=='preserve-source-confirmed-history'
            assert rows[id]['evidence']['kind'] in {'explicit-external-or-example-framing','explicit-path-placeholder'}
        assert rows['f07822']['evidence']==dict(kind='explicit-path-placeholder',text='docs/history/<id>/iron-law-evidence.md',placeholder='<id>')
        for id in ['f00166','f03953','f07667','f08643','f08645','f08668','f08681','f08748','f08817']:
            assert rows[id]['result']=='park-unconfirmed-preserve-premise' and rows[id]['evidence'] is None
        for id in ['f00445','f08621','f08646','f08700']:
            assert rows[id]['result']=='preserve-operand-reachability-unchanged' and rows[id]['evidence'] is None
            assert all(r['beforePresent'] and r['afterPresent'] and not r['wildcard'] for r in rows[id]['normalizedOperands'])
        for id in ['f07697','f08033','f08047']:
            assert rows[id]['candidateSuccessors']==[]
            assert rows[id]['excludedSelfSuccessor']==rows[id]['file']
            assert rows[id]['result']=='park-unconfirmed-preserve-premise'
        assert all(r['file'] not in r.get('candidateSuccessors',[]) and r.get('successor',{}).get('path')!=r['file'] for r in rows.values())
        wrapper_lines = []
        # Independently enumerate wrapper positions, rather than inheriting the
        # record's often incorrect "inside carriage" label or reason vocabulary.
        for file in sorted({r['file'] for r in proof['rows'] if r['file'].startswith('docs/platform/') and r['sourceSha256'] is not None}):
            raw = source(file)
            snapshot = re.search(r'(?im)^#{1,6} Literal Snapshot\b',raw)
            wrapper = raw[:snapshot.start()] if snapshot else raw
            for n,line in enumerate(wrapper.splitlines(),1):
                if 'docs/specs/runner.md' in line and ('Superseded by:' in line or 'CoordinationSession' in line and re.search(r'(?i)retir|history|historical',line)):
                    matches = [r for r in proof['rows'] if r['file']==file and r['currentLines'] and n in r['currentLines']]
                    assert matches and all(r['proposedDisposition']=='preserve-with-dated-note' for r in matches),(file,n)
                    wrapper_lines.append((file,n))
        assert len(wrapper_lines)==163

        assert len(proof['physical']['negativePremiseProbes']) == 3 and all(r['rejected'] for r in proof['physical']['negativePremiseProbes'])
        assert all(r.get('blocker') and r.get('owner') for r in proof['rows'] if r['proposedDisposition'] != 'preserve')
        assert len(proof['zeroEdgeBatches']) == 27
        batch = json.loads((HERE.parent/'review-batches.json').read_text())
        # Discover batch shape without relying on display labels in a prose count.
        paths = set()
        def walk(value):
            if isinstance(value,dict):
                if isinstance(value.get('path'),str) and '/history/retired-engine/' in value['path']: paths.add(value['path'])
                for v in value.values(): walk(v)
            elif isinstance(value,list):
                for v in value: walk(v)
        walk(batch['g7Batches'])
        wrapper_files = {r['file'] for r in proof['rows'] if r['result']=='judgment-preserve-with-dated-note'}
        wrapper_coverage = dict(reviewBatchPaths=len(paths),coveredByProposals=len(paths & wrapper_files),missing=sorted(paths-wrapper_files))
        assert not wrapper_coverage['missing'], wrapper_coverage
    command = ['git','diff','--check']
    check = subprocess.run(command,cwd=ROOT,capture_output=True,text=True)
    assert check.returncode == 0, check.stderr
    commands.append(dict(label='diff-check',argv=command,exit=check.returncode,stdout=check.stdout,stderr=check.stderr))
    scripts = [CENSUS/'join.py',CENSUS/'test-locators.mjs',HERE/'proof.py',HERE/'physical-move.mjs',HERE/'verify.py']
    result = dict(sourceCommit=pin,status='records-replay-passed-not-gate-acceptance',commands=commands,comparisons=comparisons,
                  scriptDigests={str(p.relative_to(ROOT)):sha(p.read_bytes()) for p in scripts},
                  counts={'G2':join['counts'],'G6':proof['counts']},wrapperReviewBatchCoverage=wrapper_coverage,
                  negativeProbes=dict(sourceBindingAndHistoricalEvidence=10,copiedL12_121HistoricalPredicate=3,positiveEvidenceControls=5),
                  followupChecks=dict(reviewedDynamicSites=132,individuallyJudgedReaderHints=13,additionalDynamicSites=len(dynamics['rows'])-132,
                                      deletedCensusSources=len(deleted),livePointersParked=29,deletedSourcePreservesParked=5,missedWrappersNowNoted=11,allEnumeratedWrapperLines=len(wrapper_lines)),
                  manualDynamicJudgmentsSourceCommit=dynamics['judgmentSourceCommit'],
                  noReadinessClaim=True,independentApproval=False,
                  notRun=['npm test','scripts/run-tests.mjs','cargo test --workspace','owning product tests (records-only custody task; no product behavior changed, temporary fixture Git writes are allowed)','fgos CLI / impact capability query (forbidden by brief)','pair accounting (Lead A1 custody)','final-pin F census and independent G2/G6 review','markdown preview (Lead custody)'])
    (HERE/'verification.json').write_text(json.dumps(result,ensure_ascii=False,sort_keys=True,indent=2)+'\n')
    print(json.dumps({'byteIdenticalArtifacts':len(comparisons),'G2':join['counts'],'G6':proof['counts'],'wrapperCoverage':wrapper_coverage},sort_keys=True))


if __name__ == '__main__': main()
