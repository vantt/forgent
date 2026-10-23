#!/usr/bin/env python3
"""Owning, read-only verification of this archive manifest and reader-spec custody.
Use python3 -B. Only the scoped verification JSON is written; no Git mutations.
"""
import hashlib, json, pathlib, subprocess

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[4]
P = 'plans/260925-documentation-authority-unification/'
A = P + 'reports/phase-09/archive/'


def main():
    def load(name): return json.loads((HERE/name).read_text())
    def git(*args): return subprocess.check_output(['git',*args],cwd=ROOT)
    m = load('manifest.json'); pin = m['inputCommit']
    assert git('rev-parse','HEAD').decode().strip() == pin
    entries = {}
    for line in git('ls-tree','-rlz',pin,'--',P).split(b'\0'):
        if not line: continue
        meta,p = line.split(b'\t',1); mode,typ,oid,size = meta.split()
        p = p.decode()
        if typ == b'blob' and mode != b'120000' and not p.startswith(A):
            entries[p] = (oid.decode(),int(size))
    moving = {r['path']:r for r in m['records']}
    kept = {r['path']:r for r in m['retained']}
    assert len(moving) == len(m['records']) and len(kept) == len(m['retained'])
    assert not set(moving)&set(kept) and set(moving)|set(kept) == set(entries)
    def check_row(r):
        p = pathlib.PurePosixPath(r['path'])
        assert not p.is_absolute() and '..' not in p.parts and r['path'].startswith(P)
        assert entries[r['path']] == (r['blobId'],r['size'])
        data = (ROOT/r['path']).read_bytes()
        assert len(data)==r['size'] and hashlib.sha256(data).hexdigest()==r['sha256']
    for r in m['records']+m['retained']: check_row(r)
    specs = load('reader-patches/standalone-retirement-specs.json')['specs']
    assert len(specs)==len(set(r['path'] for r in specs))
    for r in specs:
        assert moving[r['path']]['sha256']==r['beforeSha256']
        assert r['expectedAfter']=='absent' and r['archiveCommit']==pin
        assert r['path'].endswith(('.py','.mjs','.sh','.js','.cjs'))
    hist = load('reader-patches/historical-replay-specs.json')
    assert hist['readerTargetJoins']==135==len(hist['joins'])
    assert hist['historicalReaderFiles']==47==len(set(r['readerPath'] for r in hist['joins']))
    prior = load('reader-patches/prior-script-refs.json')['joins']
    old = json.loads((ROOT/P/'reports/phase-08/step-08-tree-prune-manifest.json').read_text())
    assert len(prior)==sum(len(r['scriptRefs']) for r in old['inventory'])
    for r in prior:
        if r['readerPath'].startswith(('test/','scripts/','src/')):
            assert r['targetDisposition']=='retain',r
    restored = {r['path'] for r in old['directoryReaderCorrection']['restoredFiles']}
    assert len(restored)==6 and restored <= set(kept)
    # An existing object alone is not proof it survives an ordinary clone.
    reachable = {l.split(b' ',1)[0].decode() for l in git('rev-list','--objects',pin).splitlines()}
    recovery = load('prior-prune-recovery.json')['records']
    batch = subprocess.Popen(['git','cat-file','--batch'],cwd=ROOT,stdin=subprocess.PIPE,stdout=subprocess.PIPE)
    for r in recovery:
        assert r['blobId'] in reachable
        batch.stdin.write((r['blobId']+'\n').encode());batch.stdin.flush()
        head = batch.stdout.readline().split(); assert head[1]==b'blob' and int(head[2])==r['size']
        data = batch.stdout.read(r['size']);assert batch.stdout.read(1)==b'\n'
        assert hashlib.sha256(data).hexdigest()==r['sha256']
    batch.stdin.close();assert batch.wait()==0
    assert len(recovery)==279
    negative=[]
    for name, delta in [('wrong digest',{'sha256':'0'*64}),('wrong object',{'blobId':'0'*40}),('unsafe path',{'path':'../outside.json'})]:
        try:check_row({**m['records'][0],**delta})
        except (AssertionError,KeyError):negative.append({'probe':name,'rejected':True})
        else:raise AssertionError('negative probe accepted '+name)
    output={'inputCommit':pin,'exit':0,'partitionFiles':len(entries),'movingFiles':len(moving),'retainedFiles':len(kept),
        'retirementSpecs':len(specs),'historicalReaderFiles':47,'historicalJoins':135,'priorScriptRefOccurrences':len(prior),
        'sixRestoredInputsRetained':True,'alreadyPrunedRecoveryBlobsVerified':len(recovery),
        'allRecoveryBlobsReachableFromArchiveCommit':True,'negativeProbes':negative,
        'limits':'Structural/digest/object custody only; no independent semantic retirement, enumeration or final-pin acceptance.'}
    (HERE/'verification.json').write_text(json.dumps(output,indent=2)+'\n')
    print(json.dumps(output))

if __name__=='__main__': main()
