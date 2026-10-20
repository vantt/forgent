#!/usr/bin/env python3
"""Full multi-pin replay, including immutable wave 1, without rebinding it."""
import sys
sys.dont_write_bytecode=True
import importlib.util,pathlib,json
P=pathlib.Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('q',P/'step-04-check.py');q=importlib.util.module_from_spec(s);s.loader.exec_module(q)
q.PIN='d4a07d57c4d146b482d4a9e632dc02d8df42af79'
if __name__=='__main__':
 rs=q.load();checker=q.Checker();out=checker.all(rs)
 out['failures'] += [{'file':r['file'],'check':'new-record-current-pin','detail':r['authorInputCommit']} for r in rs if r['reviewSet']>='step04-017' and r['authorInputCommit']!=q.PIN]
 if set(out['checkedBatches'])!={b['batch'] for b in q.BATCHES}:out['failures'].append({'file':None,'check':'all-33-batches-present','detail':'Missing/unknown batch'})
 out['failureCount']=len(out['failures']);out['recordFileHashes']={f.name:q.m.sha(f.read_bytes()) for f in sorted((P/'step-04-records').glob('step04-*.jsonl'))};q.save('step-04-wave2-check-result.json',out)
 print(json.dumps(out,ensure_ascii=False));raise SystemExit(bool(out['failureCount']))
