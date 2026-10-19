#!/usr/bin/env python3
"""All Step 3 authored sets through 069; current bindings and two-stratum freeze."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,argparse
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('w2',P/'step-03-wave2-check.py');w2=importlib.util.module_from_spec(sp);sp.loader.exec_module(w2)
m=w2.m;w=w2.w;PIN=w2.PIN;EARLIER=tuple(f'{i:03}' for i in range(1,42));WAVE3=tuple(f'{i:03}' for i in range(42,70))
def binding(rs):
 return {'pin':PIN,'scope':'pilot + waves 1–2 after L12-37; earlier sample membership remains historical, expansion covers all 037/038 and every outcome-changed file','recordFiles':[{'path':str(m.REL/'step-03-records'/f'batch-{b}.jsonl'),'sha256':m.sha((P/'step-03-records'/f'batch-{b}.jsonl').read_bytes())} for b in EARLIER],'files':[{'file':r['file'],'set':r['reviewSet'],'sourceDigest':r['digest'],'diffSha256':m.sha(r['diff']),'recordSha256':m.sha(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n')} for r in rs],'earlierFreezes':[{'path':str(m.REL/name),'sha256':m.sha((P/name).read_bytes()),'status':'historical; membership not silently replaced by changed populations'} for name in ['step-03-pilot-closeout-manifest.json','step-03-wave1-closeout-manifest.json','step-03-wave2-manifest.json']]}
def freeze(rs):
 m.SETS=WAVE3;o=m.manifest_view(rs,PIN)
 o['unpatchedStrata']={b:w.unpatched_stratum(rs,b,next(s['selected'] for s in o['sets'] if s['set']=='batch-'+b)) for b in WAVE3}
 o['recordFiles']=[{'path':str(m.REL/'step-03-records'/f'batch-{b}.jsonl'),'sha256':m.sha((P/'step-03-records'/f'batch-{b}.jsonl').read_bytes())} for b in WAVE3]
 return o

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--select',action='store_true');args=ap.parse_args();m.SETS=WAVE3;wave=m.records()
 if args.select:print(json.dumps(freeze(wave),ensure_ascii=False,indent=2));return 0
 m.SETS=EARLIER;prior=m.records();wanted=binding(prior);m.SETS=EARLIER+WAVE3;rs=prior+wave;c=m.Checker(PIN);result=c.all(rs)
 if wanted!=json.loads((P/'step-03-wave2-r2-binding-manifest.json').read_text()):result['failures'].append({'check':'earlier-record-binding'})
 if freeze(wave)!=json.loads((P/'step-03-wave3-manifest.json').read_text()):result['failures'].append({'check':'wave3-manifest-and-both-strata'})
 result.update(failureCount=len(result['failures']),checker='step-03-check.py with L12-37 renamed-alias preserve, body Related and physical wrapped-unit handling; all pilot/waves 1–3',retiredFiles=sum(bool(r.get('retiresWithTree')) for r in rs),retiredEdges=sum(m.edge_count(r) for r in rs if r.get('retiresWithTree')),activeFiles=sum(not r.get('retiresWithTree') for r in rs),activeEdges=sum(len(r['edges']) for r in rs),wave3Files=len(wave),wave3Edges=sum(m.edge_count(r) for r in wave),renamedAliasPreserveHits=[{'file':r['file'],'edge':e['edgeId'],'holders':c.renamed_alias_holders(r,e)} for r in rs for e in r['edges'] if c.renamed_alias_holders(r,e)])
 print(json.dumps(result,ensure_ascii=False,indent=2));return bool(result['failureCount'])
if __name__=='__main__':raise SystemExit(main())
