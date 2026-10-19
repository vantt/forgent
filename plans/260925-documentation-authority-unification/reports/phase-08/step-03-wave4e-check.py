#!/usr/bin/env python3
"""All current records plus new-only A51 freezes; old review surfaces remain historical."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,argparse
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('prior',P/'step-03-wave4c-check.py');prior=importlib.util.module_from_spec(sp);sp.loader.exec_module(prior)
m=prior.m;PIN=prior.PIN;ALL=tuple(f'{i:03}' for i in range(1,76));NEW=('075',)
def binding(rs):
 return {'pin':PIN,'rule':'A51, L12-41; all current records, earlier review manifests are historical','recordFiles':[{'path':str(m.REL/'step-03-records'/f'batch-{b}.jsonl'),'sha256':m.sha((P/'step-03-records'/f'batch-{b}.jsonl').read_bytes())} for b in ALL],'files':[{'file':r['file'],'set':r['reviewSet'],'sourceDigest':r['digest'],'diffSha256':m.sha(r['diff']),'recordSha256':m.sha(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n')} for r in rs]}
def freeze(rs):
 m.SETS=NEW;o=m.manifest_view(rs,PIN)
 o['unpatchedStrata']={b:prior.w4.w3.w.unpatched_stratum(rs,b,next(s['selected'] for s in o['sets'] if s['set']=='batch-'+b)) for b in NEW}
 o['recordFiles']=[{'path':str(m.REL/'step-03-records'/f'batch-{b}.jsonl'),'sha256':m.sha((P/'step-03-records'/f'batch-{b}.jsonl').read_bytes())} for b in NEW]
 return o

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--select',action='store_true');a=ap.parse_args();m.SETS=NEW;wave=m.records()
 if a.select:print(json.dumps(freeze(wave),ensure_ascii=False,indent=2));return 0
 m.SETS=ALL;rs=m.records();result=m.Checker(PIN).all(rs)
 if binding(rs)!=json.loads((P/'step-03-wave4e-binding-manifest.json').read_text()):result['failures'].append({'check':'all-current-record-binding'})
 if freeze(wave)!=json.loads((P/'step-03-wave4e-manifest.json').read_text()):result['failures'].append({'check':'wave4d-both-strata-freeze'})
 result.update(failureCount=len(result['failures']),completedNewBatches=list(NEW),pendingBatches=[f'{i:03}' for i in range(76,83)],openLeadRulingEdgesPerSet={f'batch-{b}':[e['edgeId'] for r in rs if r['reviewSet']=='batch-'+b for e in r['edges'] if e.get('blockedCategory')=='lead-ruling'] for b in ALL})
 print(json.dumps(result,ensure_ascii=False,indent=2));return bool(result['failureCount'])
if __name__=='__main__':raise SystemExit(main())
