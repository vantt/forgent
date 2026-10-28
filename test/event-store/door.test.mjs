import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { scan } from '../../scripts/git-one-door-scan.mjs';

// Git spawns, launcher shapes and the zero-site census belong to scripts/git-one-door-scan.mjs, owned
// by test/git/one-door.test.mjs. These two tests only pin what is event-specific: the scan's verdict on
// event-publication argv and on the event-store-owned code.
const EVENT_OWNED = ['src/event-store/', 'packages/event-store/'];

// Each tree is one event-publication argv hidden behind a launcher or computed value.
const PUBLICATION_SHAPES = {
  'src/shell-option.mjs': "import {spawnSync} from 'node:child_process';\nspawnSync('git push origin refs/fgos/events/x',{shell:true});",
  'src/sh-c.mjs': "import {execFileSync} from 'node:child_process';\nexecFileSync('sh',['-c','git push origin refs/fgos/events/x']);",
  'src/absolute-git.mjs': "import {execFileSync} from 'node:child_process';\nexecFileSync('/usr/bin/git',['push','origin','refs/fgos/events/x']);",
  'src/env-launcher.mjs': "import {execFileSync} from 'node:child_process';\nexecFileSync('/usr/bin/env',['git','push','origin','refs/fgos/events/x']);",
  'src/xargs-launcher.mjs': "import {spawnSync} from 'node:child_process';\nspawnSync('xargs',['git','fetch','origin','refs/fgos/events/x']);",
  'src/rest-args.mjs': "import {execFileSync} from 'node:child_process';\nfunction rest(...args){execFileSync('git',args);}\nrest('push','origin','refs/fgos/events/x');",
  'src/computed-argv.mjs': "import {execFileSync} from 'node:child_process';\nfunction forward(args){return execFileSync('git',args);}\nforward(computed());",
  'src/concatenated-ref.mjs': "import {execFileSync} from 'node:child_process';\nconst ref='refs/'+'fgos/events/x';execFileSync('git',['update-ref',ref,'new','old']);",
  'src/event-file-commit.mjs': "import {execFileSync} from 'node:child_process';\nexecFileSync('git',['commit','--','.fgos/events.jsonl']);",
  'src/shell-alias.mjs': "import {execSync as shell} from 'node:child_process';\nshell('git fetch origin refs/fgos/events/x');",
  'src/borrowed-commit.mjs': "import {runBorrowed} from './holder-lock/index.mjs';\nrunBorrowed(handle,{command:'git',args:['commit','--','.fgos/events.jsonl']});",
  'src/deep-chain.mjs': "import {execFileSync} from 'node:child_process';\n"+Array.from({length:40},(_,i)=>`function f${i}(args){return ${i===39?"execFileSync('git',args)":`f${i+1}(args)`};}`).join('')+"f0(computed());",
  'packages/absolute/rust/src/lib.rs': 'use std::process::Command;\nfn publish() { Command::new("/usr/bin/git").args(["push","origin","refs/fgos/events/x"]).status(); }\n',
  'packages/env/rust/src/lib.rs': 'use std::process::Command;\nfn publish() { Command::new("env").args(["git","fetch","origin","refs/fgos/events/x"]).status(); }\n',
  'packages/after-test/rust/src/lib.rs': 'use std::process::Command;\n#[cfg(test)] mod tests { fn sample() {} }\nfn live() { Command::new("git").args(["push"]).status(); }\n',
};

test('the shared scan reports event-publication argv behind launchers, computed values and cfg(test) neighbours',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'fgos-event-door-'));
  try {
    for(const [file,source] of Object.entries(PUBLICATION_SHAPES)){
      fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});
      fs.writeFileSync(path.join(root,file),source);
    }
    const {sites}=scan({root});
    for(const file of Object.keys(PUBLICATION_SHAPES))assert.ok(sites.some(s=>s.path===file),`${file} not reported (got ${JSON.stringify(sites.map(s=>s.path))})`);
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
});

test('event-store product code has no Git spawn site and no classified spawn: its Git work goes through the typed ports',()=>{
  const {sites,classes}=scan({root:process.cwd()});
  const owned=entry=>EVENT_OWNED.some(prefix=>entry.path.startsWith(prefix));
  assert.deepEqual(sites.filter(owned),[],'event-store code spawns git');
  // Rust integration tests build fixture repositories with git; only product code is judged. A wrapper
  // no product code calls is reported by the scan so a later caller is noticed, but no spawn reaches it:
  // that caller would turn it into a site or a configured binary, which the two assertions here do judge.
  assert.deepEqual(classes.filter(c=>owned(c)&&!['rust-test','uncalled-wrapper'].includes(c.class)),[],'event-store code carries a classified git spawn');
});
