#!/usr/bin/env python3
"""All current canonical records, explicit open rulings, no historical manifest mutation."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,argparse
P=pathlib.Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('q',P/'step-03-wave5f-common.py');q=importlib.util.module_from_spec(s);s.loader.exec_module(q)
m=q.m;PIN=q.PIN

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--new-only',action='store_true');args=ap.parse_args()
 sets=tuple(f'{i:03}' for i in range(105,114)) if args.new_only else tuple(p.stem.removeprefix('batch-') for p in sorted((P/'step-03-records').glob('batch-[0-9][0-9][0-9].jsonl')))
 sets=tuple(b for b in sets if (P/'step-03-records'/f'batch-{b}.jsonl').exists());m.SETS=sets;rs=[r for b in sets for r in q.load(b)];out=m.Checker(PIN).all(rs)
 out.update(checkedBatches=list(sets),openLeadRulingEdgesPerSet={'batch-'+b:[e['edgeId'] for r in rs if r['reviewSet']=='batch-'+b for e in r['edges'] if e.get('blockedCategory')=='lead-ruling'] for b in sets},checkerSourceSha256=m.sha((P/'step-03-check.py').read_bytes()),resolverSourceSha256=m.sha((P/'step-03-resolve.py').read_bytes()),scratch='/tmp/fgos-work/wave5f/',scope='Every canonical record present; historical review manifests remain immutable. Only L12-51 form extension changes a checker predicate.')
 q.save('step-03-wave5f-'+('new-' if args.new_only else '')+'check-result.json',out)
 print(json.dumps({k:out[k] for k in ['files','edges','failureCount','failures','notClosableSets']},ensure_ascii=False));return bool(out['failureCount'])
if __name__=='__main__':raise SystemExit(main())
