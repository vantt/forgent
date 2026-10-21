"""Final Task0 transitive reader and concrete replay receipts, report writes only."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,copy,hashlib,subprocess
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def read(f):return json.loads((P/f).read_text())
def save(f,x):(P/f).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def sha(x):return hashlib.sha256(x.encode() if isinstance(x,str) else x).hexdigest()
f=P/'step-05-records/tests-judgment-batch6.jsonl';rs=[json.loads(l) for l in f.open()];r=next(r for r in rs if r['file']=='test/scripts/check-doc-candidate-status.test.mjs');id='author-s67-governance-baseline-163'
if not any(e['referenceId']==id for e in r['authorAddedReferences']):
 e=copy.deepcopy(next(e for e in r['authorAddedReferences'] if e['referenceId']=='author-s67-governance-baseline-94'));ls=subprocess.check_output(['git','show',r['authorInputCommit']+':'+r['file']],cwd=ROOT,text=True).splitlines();operand='checkCandidateMetadata';n=163;k=ls[n-1].index(operand);e.update(referenceId=id,matchedExpression=operand,sourceSpans=[{'line':n,'columnStart':k+1,'columnEndExclusive':k+len(operand)+1,'text':operand}],originalSourceSpans=[],inventoryOrigins=[],passage='\n'.join(ls[n-3:n+2]),passageSpan={'startLine':n-2,'endLine':n+2},reason='L12-85/R28: checkCandidateMetadata reads the real governance file transitively even though the supplied readFile is stubbed.',blockedReason=r['file']+': this checkCandidateMetadata call uses real REPO_ROOT. Its unconditional promotionRequired construction calls governanceBaselineFields at scripts/check-doc-candidate-status.mjs L96; that helper probes and reads real docs/doc-governance.md. Co-cut this transitive read with the direct L94 call and gate reader.',role='transitive-document-reader');e['searchWitness']['assessment']=e['blockedReason'];e['readerChain']=[{'file':'scripts/check-doc-candidate-status.mjs','line':96,'operation':'governanceBaselineFields(repoRoot)'},{'file':'scripts/check-doc-constitution.mjs','line':221,'operation':"path.resolve(repoRoot, 'docs/doc-governance.md')"},{'file':'scripts/check-doc-constitution.mjs','line':223,'operation':"fs.readFileSync(file, 'utf8')"}];r['authorAddedReferences'].append(e)
f.write_text(''.join(json.dumps(x,ensure_ascii=False,separators=(',',':'))+'\n' for x in rs))
# The patch specification itself carries the actual replay, not only a summary.
specs=read('step-05-seam5-batch2-cutover-specs.json');replay=read('step-05-seam67-r22-patch-replay.json')
for s in specs['patches']:
 if s['file']==replay['file']:s['r22Replay']=dict(replay,sourceSha256=s['sourceSha256'],expectedAfterSha256=s['expectedAfterSha256'],coCutPaths=s['coCutPaths'])
save('step-05-seam5-batch2-cutover-specs.json',specs)
rcs=read('step-05-seam5-batch2-judgment-receipts.json');rcs['receipts'][0]['cutoverSpecifications']=specs['patches'];rcs['receipts'][0]['r22Replay']=replay;save('step-05-seam5-batch2-judgment-receipts.json',rcs)
# Current owning-suite proof remains explicitly distinct from missing candidate-root parity.
rcs=read('step-05-seam67-parity-receipts.json');actual=read('step-05-seam67-current-proof.json');packet=read('step-05-seam67-documented-commands.json')
for rc in rcs['receipts']:
 rc['sourceTrace']='step-05-seam67-source-traces.json'
 if rc['seam']=='citation-ratchet-roots':
  rc['proofs'][0].update(status='pass',exit=0,logPath=actual['logPath'],logSha256=actual['logSha256'],owningBehavior='Existing two checker suites at current HEAD: 59/59. Actual input set is in currentOwningSuiteProof; not candidate-root parity.')
  rc['currentOwningSuiteProof']=actual;rc['documentedCommandPacket']={'path':'step-05-seam67-documented-commands.json','sha256':sha((P/'step-05-seam67-documented-commands.json').read_bytes()),'hits':packet['hitCount'],'custody':'Same default/scan/citation-source/render/baseline packet; prior source records retain their own outcomes and final Step7 composition.'}
 else:rc['staticOutputSnapshots']=read('step-05-seam67-source-traces.json')['compiler']['trackedOutputSnapshots']
save('step-05-seam67-parity-receipts.json',rcs)
print('L163 transitive read + explicit R22/current-suite receipts')
