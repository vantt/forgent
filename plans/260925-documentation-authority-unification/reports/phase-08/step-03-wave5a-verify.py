#!/usr/bin/env python3
"""Independent stdlib replay of sampling, packet bindings and protected scope."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,hashlib,math,subprocess,collections
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3];REL=P.relative_to(ROOT)
PIN='ae141550c2e022310de7a0efea757580c0b2479f'
INPUT_HEAD='0d712158929b0028f1a549fc16595302763859f8'
def sha(x):return hashlib.sha256(x if isinstance(x,bytes) else x.encode()).hexdigest()
def git(*args):return subprocess.check_output(['git','-C',str(ROOT),*args])
def records(b):return [json.loads(x) for x in (P/'step-03-records'/f'batch-{b}.jsonl').read_text().splitlines()]
def main():
 manifest=json.loads((P/'step-03-wave5a-manifest.json').read_text());index=json.loads((P/'step-03-wave5a-review-index.json').read_text());allrs=[];proof=[];selected=set()
 for b in ['079','080','081','082']:
  rs=records(b);allrs+=rs;g=next(x for x in manifest['sets'] if x['set']=='batch-'+b);u=manifest['unpatchedStrata'][b]
  patched=[r['file'] for r in rs if r['diff']];seed='A51-step03-file-v1\0'+PIN+'\0'+b
  ranked=sorted(patched,key=lambda f:(sha(seed+'\0'+f),f));sample=ranked[:math.ceil(.15*len(patched))]
  mandatory=[r['file'] for r in rs if len(git('show',PIN+':'+r['file']))>=65536 or len(r['inventoryEdgeIds'])>=40]
  assert sample==g['sample'] and set(g['selected'])==set(sample+mandatory)
  population=[r['file'] for r in rs if not r['diff'] and r['edges'] and r['file'] not in g['selected']]
  useed='A51-step03-file-v1-unpatched\0'+PIN+'\0batch-'+b
  uranked=sorted(population,key=lambda f:(sha(useed+'\0'+f),f));usample=uranked[:math.ceil(.15*len(population))]
  assert sorted(usample)==u['selected']
  assert u['seed']==useed and u['ranks']==[{'file':f,'rankHash':sha(useed+'\0'+f)} for f in uranked]
  assert g['seed']==seed and g['ranks']==[{'file':f,'rankHash':sha(seed+'\0'+f)} for f in ranked]
  selected.update(sample+mandatory+usample)
  proof.append({'set':'batch-'+b,'files':len(rs),'edges':sum(len(r['edges']) for r in rs),'patchedPopulation':len(patched),'patchedSample':len(sample),'mandatory':len(mandatory),'unpatchedPopulation':len(population),'unpatchedSample':len(usample),'dispositions':dict(collections.Counter(e['disposition'] for r in rs for e in r['edges']))})
 by={r['file']:r for r in allrs};packet=[]
 for part in index['parts']:
  assert part['fileCount']<=6 and part['edges']<=150 and part['sourcePlusRecordBytes']<=400000
  for row in part['files']:
   r=by[row['file']];raw=(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n').encode()
   assert row['recordSha256']==sha(raw) and row['diffSha256']==sha(r['diff']) and row['sourceDigest']==sha(git('show',PIN+':'+r['file']))
   packet.append(r['file'])
 assert len(packet)==len(set(packet)) and set(packet)==selected
 targeted=json.loads((P/'step-03-batch073-r2-review-index.json').read_text());assert len(targeted['parts'])==1 and targeted['parts'][0]['report'].endswith('review-a38-step-03-batch073-r2-p01.md')
 wanted={r['file']:r for r in records('073') if any(e['edgeId'] in ['maps-j-04472','maps-j-04485'] for e in r['edges'])}
 assert {x['file'] for x in targeted['parts'][0]['files']}==set(wanted)
 for row in targeted['parts'][0]['files']:
  r=wanted[row['file']];assert row['recordSha256']==sha(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n') and row['diffSha256']==sha(r['diff'])
 expected={str(REL/x) for x in ['progress.md','step-03-check.py','step-03-records/batch-073.jsonl','step-03-records/batch-077.jsonl']}
 baseline=git('ls-tree','-r','--name-only',INPUT_HEAD,'--',str(REL),'plans/260925-documentation-authority-unification/reports/phase-06').decode().splitlines()
 changed=set(git('diff','--name-only',INPUT_HEAD).decode().splitlines())
 assert changed & set(baseline)==expected,changed
 assert all(x.startswith(str(REL)+'/') for x in changed),changed
 fresh=git('ls-files','--others','--exclude-standard').decode().splitlines();assert all(x.startswith(str(REL)+'/') for x in fresh),fresh
 allowed={'maps-j-04472','maps-j-04485','maps-j-04741','maps-j-04742','maps-j-04743','maps-j-04744'};hunks={'maps-j-04467','maps-j-04469','maps-j-04470','maps-j-04473'};prior=[]
 for b in ['073','077']:
  old=[json.loads(x) for x in git('show',INPUT_HEAD+':'+str(REL/'step-03-records'/f'batch-{b}.jsonl')).decode().splitlines()]
  for r,o in zip(records(b),old):
   assert r['file']==o['file'] and r['inventoryEdgeIds']==o['inventoryEdgeIds']
   for e,oe in zip(r['edges'],o['edges']):
    if e==oe:continue
    assert e['edgeId'] in allowed|hunks
    if e['edgeId'] in hunks:assert {k:v for k,v in e.items() if k!='diffHunk'}=={k:v for k,v in oe.items() if k!='diffHunk'}
    prior.append(e['edgeId'])
 protected=baseline;assert all(x not in changed for x in protected if x not in expected)
 checked=[]
 for x in protected:
  if x in expected:continue
  assert (ROOT/x).read_bytes()==git('show',INPUT_HEAD+':'+x);checked.append(x)
 result={'pin':PIN,'assignmentInputHead':INPUT_HEAD,'samplingReplay':proof,'selectedFiles':len(selected),'packetParts':len(index['parts']),'targetedReReviewFiles':len(wanted),'targetedReReviewEdges':targeted['selectedEdges'],'protectedPriorPaths':len(checked),'protectedPathsSha256':sha('\n'.join(sorted(checked))+'\n'),'trackedChangedPaths':sorted(changed),'earlierChangedEdges':sorted(prior),'hunkMetadataOnlyEdges':sorted(hunks),'limits':'Record-only mechanical proof. Independent semantics, committed-byte accounting, runtime/Step 5 parity and Phase 9 remain unaccepted. No full npm suite or preview/service.'}
 print(json.dumps(result,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
