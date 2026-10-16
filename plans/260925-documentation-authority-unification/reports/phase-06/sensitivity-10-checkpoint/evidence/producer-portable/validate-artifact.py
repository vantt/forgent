import sys,pathlib
assert len(sys.argv) in (2,3) and (len(sys.argv)==2 or sys.argv[2].startswith('/tmp/fgos-work/')) and pathlib.Path(sys.argv[1]).is_absolute() and sys.argv[1].startswith('/tmp/fgos-work/')
import pathlib,json,hashlib,sys
P=pathlib.Path('plans/260925-documentation-authority-unification');R=P/'reports/phase-06';manifestPath=pathlib.Path(sys.argv[2]) if len(sys.argv)>2 else P/'reports/doc-inventory.json';partRoot=manifestPath.parent;m=json.loads(manifestPath.read_text());decoder=json.JSONDecoder()
# Bounded, standard-library verification of the complete canonical JSON transport.
class Reader:
 def __init__(self):self.parts=iter(m['parts']);self.file=None;self.buf='';self.pos=0;self.eof=False;self.total=0;self.hash=hashlib.sha256()
 def fill(self):
  if self.pos:self.buf=self.buf[self.pos:];self.pos=0
  while True:
   if self.file is None:
    try:self.file=(partRoot/next(self.parts)['path']).open('rb')
    except StopIteration:self.eof=True;return False
   b=self.file.read(16*1024*1024)
   if b:
    self.total+=len(b);self.hash.update(b)
    # Artifact shards end on line boundaries and each chunk is completed at a UTF-8 boundary.
    while True:
     try:text=b.decode('utf8');break
     except UnicodeDecodeError as e:
      if e.reason!='unexpected end of data':raise
      more=self.file.read(1)
      if not more:raise
      self.total+=len(more);self.hash.update(more);b+=more
    self.buf+=text
    if len(self.buf)>768*1024*1024:raise ValueError('A single JSON value exceeds the independent 768 MiB verification buffer bound')
    return True
   self.file.close();self.file=None
 def ws(self):
  while True:
   while self.pos<len(self.buf) and self.buf[self.pos].isspace():self.pos+=1
   if self.pos<len(self.buf) or not self.fill():return
 def peek(self):self.ws();return self.buf[self.pos:self.pos+1]
 def token(self,t):assert self.peek()==t,(t,self.buf[self.pos:self.pos+80]);self.pos+=1
 def value(self):
  self.ws()
  while True:
   try:v,end=decoder.raw_decode(self.buf,self.pos);self.pos=end;return v
   except json.JSONDecodeError:
    if not self.fill():raise
part_hashes=[]
for part in m['parts']:
 h=hashlib.sha256();n=0
 with (partRoot/part['path']).open('rb') as f:
  while True:
   b=f.read(16*1024*1024)
   if not b:break
   n+=len(b);h.update(b)
 assert n==part['bytes'] and h.hexdigest()==part['sha256'],part['path']
 part_hashes.append({'path':part['path'],'bytes':n,'sha256':h.hexdigest(),'ok':True})

reader=Reader();reader.token('{');counts={};keys=[];tuples=[];itempaths=[]
while reader.peek()!='}':
 key=reader.value();assert isinstance(key,str) and key not in keys;keys.append(key);reader.token(':')
 if reader.peek()=='[':
  reader.token('[');count=0
  while reader.peek()!=']':
   v=reader.value();count+=1
   if key=='claimLedger':tuples.append((v['claimId'],v['sourcePath'],v['sourceAnchor'],v['sourceUnitDigest']))
   if key=='items':itempaths.append(v['path'])
   if reader.peek()==',':reader.token(',')
   else:assert reader.peek()==']'
  reader.token(']');counts[key]=count
 else:reader.value()
 if reader.peek()==',':reader.token(',')
 else:assert reader.peek()=='}'
reader.token('}');assert reader.peek()=='' and reader.eof
reg=json.loads((R/'working-identity-registry.json').read_text());expected=sorted((u['claimId'],u['sourcePath'],u['sourceAnchor'],u['sourceUnitDigest']) for u in reg['units']);assert sorted(tuples)==expected;assert len(itempaths)==4486 and len(set(itempaths))==4486
assert reader.total==m['totalBytes'] and reader.hash.hexdigest()==m['sha256']
result={'partHashesVerified':part_hashes,'ok':True,'method':'Independent bounded stdlib JSONDecoder parsing of every complete top-level field and array element from every manifest shard, plus full native active tuple equality and aggregate SHA256; no projection or omitted inventory field.','topLevelKeys':keys,'arrayCounts':counts,'sourceFiles':len(itempaths),'claims':len(tuples),'activeTupleEquality':True,'bytes':reader.total,'sha256':reader.hash.hexdigest()};out=pathlib.Path(sys.argv[1]) if len(sys.argv)>1 else R/'step10-global-checkpoint-transport-validation.json';out=out/'transport.json' if out.is_dir() else out;out.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
