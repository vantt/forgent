#!/usr/bin/env python3
"""Current all-record proof and separate per-set A51 freezes for batches 071–072."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,argparse
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('w4',P/'step-03-wave4-check.py');w4=importlib.util.module_from_spec(sp);sp.loader.exec_module(w4)
m=w4.m;PIN=w4.PIN;ALL=tuple(f'{i:03}' for i in range(1,73));NEW=('071','072')
def binding(rs):
 return {'pin':PIN,'rule':'L12-39; all current records, earlier sample membership remains historical','recordFiles':[{'path':str(m.REL/'step-03-records'/f'batch-{b}.jsonl'),'sha256':m.sha((P/'step-03-records'/f'batch-{b}.jsonl').read_bytes())} for b in ALL],'files':[{'file':r['file'],'set':r['reviewSet'],'sourceDigest':r['digest'],'diffSha256':m.sha(r['diff']),'recordSha256':m.sha(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n')} for r in rs]}
def freeze(rs):
 m.SETS=NEW;o=m.manifest_view(rs,PIN)
 o['unpatchedStrata']={b:w4.w3.w.unpatched_stratum(rs,b,next(s['selected'] for s in o['sets'] if s['set']=='batch-'+b)) for b in NEW}
 o['recordFiles']=[{'path':str(m.REL/'step-03-records'/f'batch-{b}.jsonl'),'sha256':m.sha((P/'step-03-records'/f'batch-{b}.jsonl').read_bytes())} for b in NEW]
 return o

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--select',action='store_true');a=ap.parse_args();m.SETS=NEW;wave=m.records()
 if a.select:print(json.dumps(freeze(wave),ensure_ascii=False,indent=2));return 0
 m.SETS=ALL;rs=m.records();result=m.Checker(PIN).all(rs)
 if binding(rs)!=json.loads((P/'step-03-wave4c-binding-manifest.json').read_text()):result['failures'].append({'check':'all-current-record-binding'})
 if freeze(wave)!=json.loads((P/'step-03-wave4c-manifest.json').read_text()):result['failures'].append({'check':'wave4c-both-strata-freeze'})
 result.update(failureCount=len(result['failures']),completedNewBatches=['072'],resampledBatches=['071'],pendingBatches=[f'{i:03}' for i in range(73,83)],retiredFiles=sum(bool(r.get('retiresWithTree')) for r in rs),retiredEdges=sum(m.edge_count(r) for r in rs if r.get('retiresWithTree'))+sum(bool(e.get('retiresWithTree')) for r in rs for e in r['edges']))
 print(json.dumps(result,ensure_ascii=False,indent=2));return bool(result['failureCount'])
if __name__=='__main__':raise SystemExit(main())
