#!/usr/bin/env python3
"""Build/verify bounded full-file review streams from pinned committed bytes and records."""
import sys
sys.dont_write_bytecode=True
import argparse, importlib.util, json, pathlib
P=pathlib.Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('pilot_check',P/'step-03-check.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
def encoded(x):return (json.dumps(x,ensure_ascii=False,separators=(',',':'))+'\n').encode()
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--author-commit',required=True);ap.add_argument('--verify',action='store_true');a=ap.parse_args();rs=m.records()
    if a.verify:
        index=json.loads((P/'step-03-pilot-review-index.json').read_text());contexts={r['file']:[] for r in rs};recs={};last={}
        for part in index['parts']:
            raw=(P/part['payload']).read_bytes();assert len(raw)==part['bytes']<=400000 and m.sha(raw)==part['sha256']
            data=json.loads(raw);assert len(data['entries'])<=60
            for entry in data['entries']:
                f=entry['file']
                if entry['kind']=='record':assert f not in recs;recs[f]=entry['record']
                else:
                    text=entry['text'];assert m.sha(text)==entry['chunkSha256'];contexts[f].append(text);last[f]=part['report']
        assert recs=={r['file']:r for r in rs}
        for r in rs:assert ''.join(contexts[r['file']]).encode()==m.blob(a.author_commit,r['file'])
        assert last==index['fileVerdictReports']
        print(json.dumps({'authorCommit':a.author_commit,'parts':len(index['parts']),'files':len(rs),'contextsComplete':True,'recordsExactlyOnce':True,'payloadBytes':sum(x['bytes'] for x in index['parts']),'maxPartBytes':max(x['bytes'] for x in index['parts'])},indent=2));return
    entries=[]
    for r in rs:
        f=r['file'];entries.append({'kind':'record','file':f,'record':r});lines=m.blob(a.author_commit,f).decode().splitlines(keepends=True);chunk=[];size=0;start=1
        for i,line in enumerate(lines,1):
            if size+len(line.encode())>90000 and chunk:
                text=''.join(chunk);entries.append({'kind':'context','file':f,'startLine':start,'endLine':i-1,'text':text,'chunkSha256':m.sha(text),'sourceDigest':r['digest']});chunk=[];size=0;start=i
            chunk.append(line);size+=len(line.encode())
        if chunk:
            text=''.join(chunk);entries.append({'kind':'context','file':f,'startLine':start,'endLine':len(lines),'text':text,'chunkSha256':m.sha(text),'sourceDigest':r['digest']})
    packets=[];packet={'authorInputCommit':a.author_commit,'entries':[]}
    for entry in entries:
        proposed={**packet,'entries':packet['entries']+[entry]}
        if len(encoded(proposed))>300000 or len(proposed['entries'])>60:
            assert packet['entries'];packets.append(packet);packet={'authorInputCommit':a.author_commit,'entries':[entry]}
        else:packet=proposed
        assert len(encoded(packet))<=400000
    if packet['entries']:packets.append(packet)
    index={'authorInputCommit':a.author_commit,'reviewMode':'full pilot; all files, no sample waiver','parts':[],'fileVerdictReports':{}}
    for i,data in enumerate(packets,1):
        filename=f'step-03-pilot-review-part-{i:02d}.json';report=f'review-a38-step-03-pilot-{i:02d}.md';raw=encoded(data);(P/filename).write_bytes(raw)
        index['parts'].append({'payload':filename,'report':report,'bytes':len(raw),'sha256':m.sha(raw),'entries':len(data['entries']),'files':sorted({e['file'] for e in data['entries']})})
        for e in data['entries']:
            if e['kind']=='context':index['fileVerdictReports'][e['file']]=report
    (P/'step-03-pilot-review-index.json').write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'parts':len(packets),'files':len(rs),'payloadBytes':sum(p['bytes'] for p in index['parts']),'maxPartBytes':max(p['bytes'] for p in index['parts'])}))
if __name__=='__main__':main()
