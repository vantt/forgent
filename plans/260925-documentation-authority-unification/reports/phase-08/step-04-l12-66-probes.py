#!/usr/bin/env python3
"""L12-66: an unrelated ref changes all-ref history but never author-pin witness."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,subprocess,tempfile
P=pathlib.Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('q',P/'step-04-check.py');q=importlib.util.module_from_spec(s);s.loader.exec_module(q)
# Real unrelated ref in an isolated read-only-object fixture; never change repo refs.
real=q.v.ROOT;objects=subprocess.check_output(['git','rev-parse','--path-format=absolute','--git-path','objects'],cwd=real,text=True).strip()
pin=q.PIN;other=subprocess.check_output(['git','rev-parse','fd126f0c8'],cwd=real,text=True).strip();path='docs/specs/reading-map.md'
with tempfile.TemporaryDirectory(prefix='l1266-ref-probe-',dir='/tmp/fgos-work') as td:
 t=pathlib.Path(td);(t/'objects/info').mkdir(parents=True);(t/'refs/heads').mkdir(parents=True)
 (t/'objects/info/alternates').write_text(objects+'\n');(t/'HEAD').write_text('ref: refs/heads/pinned\n');(t/'refs/heads/pinned').write_text(pin+'\n');(t/'config').write_text('[core]\n bare = true\n repositoryformatversion = 0\n')
 q.v.ROOT=t;q.v.existence.cache_clear();q.v.tree.cache_clear()
 before=q.v.existence(pin,path)
 all_before=subprocess.check_output(['git','log','--all','--format=%H','--',path],cwd=t,text=True).splitlines()
 (t/'refs/heads/unrelated-new-ref').write_text(other+'\n')
 q.v.existence.cache_clear();q.v.tree.cache_clear();after=q.v.existence(pin,path)
 all_after=subprocess.check_output(['git','log','--all','--format=%H','--',path],cwd=t,text=True).splitlines()
 assert before==after and all_before!=all_after
 q.save('step-04-l12-66-ref-probe.json',{'probe':'new unrelated ref cannot change author-pin history witness','fixture':'isolated bare fixture sharing read-only original objects; no original ref/index/object mutation; no git write command','pin':pin,'newUnrelatedRefTarget':other,'path':path,'before':before,'after':after,'pinnedWitnessUnchanged':before==after,'legacyAllRefsBeforeCount':len(all_before),'legacyAllRefsAfterCount':len(all_after),'legacyAllRefsChanged':all_before!=all_after,'pass':True})
print('L12-66 unrelated-ref probe: PASS')
