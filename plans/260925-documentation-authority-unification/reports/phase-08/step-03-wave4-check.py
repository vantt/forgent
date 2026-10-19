#!/usr/bin/env python3
"""Current all-record binding and bounded wave-4 two-stratum freeze."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,argparse
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('w3',P/'step-03-wave3-check.py');w3=importlib.util.module_from_spec(sp);sp.loader.exec_module(w3)
m=w3.m;PIN=w3.PIN;PRIOR=tuple(f'{i:03}' for i in range(1,70));WAVE4=('070',)
def binding(rs):
 return {'pin':PIN,'scope':'All current L12-38 records; prior review/sample freezes remain historical and unchanged. No reseeding of prior strata.','recordFiles':[{'path':str(m.REL/'step-03-records'/f'batch-{b}.jsonl'),'sha256':m.sha((P/'step-03-records'/f'batch-{b}.jsonl').read_bytes())} for b in PRIOR+WAVE4],'files':[{'file':r['file'],'set':r['reviewSet'],'sourceDigest':r['digest'],'diffSha256':m.sha(r['diff']),'recordSha256':m.sha(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n')} for r in rs],'historicalFreezes':[{'path':str(m.REL/name),'sha256':m.sha((P/name).read_bytes())} for name in ('step-03-pilot-closeout-manifest.json','step-03-wave1-closeout-manifest.json','step-03-wave2-manifest.json','step-03-wave3-manifest.json')]}
def freeze(rs):
 m.SETS=WAVE4;o=m.manifest_view(rs,PIN);o['unpatchedStrata']={b:w3.w.unpatched_stratum(rs,b,next(s['selected'] for s in o['sets'] if s['set']=='batch-'+b)) for b in WAVE4};o['recordFiles']=[{'path':str(m.REL/'step-03-records'/f'batch-{b}.jsonl'),'sha256':m.sha((P/'step-03-records'/f'batch-{b}.jsonl').read_bytes())} for b in WAVE4];return o

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--select',action='store_true');args=ap.parse_args();m.SETS=WAVE4;wave=m.records()
 if args.select:print(json.dumps(freeze(wave),ensure_ascii=False,indent=2));return 0
 m.SETS=PRIOR+WAVE4;rs=m.records();result=m.Checker(PIN).all(rs)
 if binding(rs)!=json.loads((P/'step-03-wave4-binding-manifest.json').read_text()):result['failures'].append({'check':'all-current-record-binding'})
 if freeze(wave)!=json.loads((P/'step-03-wave4-manifest.json').read_text()):result['failures'].append({'check':'wave4-both-strata-freeze'})
 result.update(failureCount=len(result['failures']),checker='L12-38 all-record schema, complete source coverage, computed decision notes/live classes/history exclusions; old predicates retained',completedBatches=list(WAVE4),pendingBatches=[f'{i:03}' for i in range(71,83)],retiredFiles=sum(bool(r.get('retiresWithTree')) for r in rs),retiredEdges=sum(m.edge_count(r) for r in rs if r.get('retiresWithTree')))
 print(json.dumps(result,ensure_ascii=False,indent=2));return bool(result['failureCount'])
if __name__=='__main__':raise SystemExit(main())
