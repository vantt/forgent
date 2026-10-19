#!/usr/bin/env python3
"""All pilot/waves 1–2 records, source scans, freezes and both A51 strata."""
import sys
sys.dont_write_bytecode=True
import argparse,pathlib,importlib.util,json
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('w',P/'step-03-wave1-check.py');w=importlib.util.module_from_spec(sp);sp.loader.exec_module(w);m=w.check
PIN=w.PIN;WAVE2=tuple(f'{i:03}' for i in range(34,40))
def freeze(rs):
 m.SETS=WAVE2;o=m.manifest_view(rs,PIN)
 o['unpatchedStrata']={b:w.unpatched_stratum(rs,b,next(s['selected'] for s in o['sets'] if s['set']=='batch-'+b)) for b in WAVE2}
 o['recordFiles']=[{'path':str(m.REL/'step-03-records'/('batch-'+b+'.jsonl')),'sha256':m.sha((P/'step-03-records'/('batch-'+b+'.jsonl')).read_bytes())} for b in WAVE2]
 return o

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--select',action='store_true');args=ap.parse_args();m.SETS=WAVE2;wave=m.records();frozen=freeze(wave)
 if args.select:print(json.dumps(frozen,ensure_ascii=False,indent=2));return 0
 m.SETS=tuple(f'{i:03}' for i in range(1,42));rs=m.records();result=m.Checker(PIN).all(rs)
 for label,sets,fn,name in [('pilot',w.PILOT,w.pilot_manifest,'step-03-pilot-closeout-manifest.json'),('wave1',w.WAVE,w.wave_manifest,'step-03-wave1-closeout-manifest.json'),('wave2',WAVE2,freeze,'step-03-wave2-manifest.json')]:
  m.SETS=sets;group=m.records()
  if json.loads((P/name).read_text())!=fn(group):result['failures'].append({'check':label+'-manifest-and-both-strata-freeze'})
 c=m.Checker(PIN);scans=[]
 for r in rs:
  found=m.scan_candidates(PIN,r['file'],[s for key in r['inventoryEdgeIds'] for s in c.entries[key]['physicalSpans']])
  scans.append({'file':r['file'],'candidateCount':len(found),'scanSha256':m.sha(json.dumps(found,ensure_ascii=False,sort_keys=True)),'coverage':'file retires with tree; no per-edge authoring' if r.get('retiresWithTree') else 'checker-validated one-to-one edge/exclusion receipt'})
 result.update(failureCount=len(result['failures']),checker='step-03-check.py; pilot + waves 1–2; L12-36 source-context/table/fence coverage',sourceScans=scans,retiredFiles=sum(bool(r.get('retiresWithTree')) for r in rs),retiredEdges=sum(m.edge_count(r) for r in rs if r.get('retiresWithTree')),activeFiles=sum(not r.get('retiresWithTree') for r in rs),activeEdges=sum(len(r['edges']) for r in rs),wave2Files=len(wave),wave2Edges=sum(m.edge_count(r) for r in wave))
 print(json.dumps(result,ensure_ascii=False,indent=2));return bool(result['failureCount'])
if __name__=='__main__':raise SystemExit(main())
