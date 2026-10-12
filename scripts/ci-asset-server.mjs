#!/usr/bin/env node
/**
 * Local stand-in for a GitHub release, for the external-consumer proofs.
 *
 * Serves the files of one directory by base name, answers
 * `/releases/latest` with a redirect to `/releases/tag/<tag>` (the tag read from
 * the fgctl asset's name), and writes its port to a file once it is listening.
 *
 * Usage: node scripts/ci-asset-server.mjs <assets-dir> <port-file>
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { RELEASE_TARGETS } from '../src/util/release-targets.mjs';

const [assetsDir, portFile] = process.argv.slice(2);
if (!assetsDir || !portFile) {
  console.error('Usage: node scripts/ci-asset-server.mjs <assets-dir> <port-file>');
  process.exit(1);
}

const dir = path.resolve(assetsDir);

/** The release tag, read from `fgctl-<tag>-<target>.tar.gz`. */
function tagFromAssets() {
  for (const file of fs.readdirSync(dir)) {
    for (const { triple } of RELEASE_TARGETS) {
      const suffix = `-${triple}.tar.gz`;
      if (file.startsWith('fgctl-') && file.endsWith(suffix)) {
        return file.slice('fgctl-'.length, file.length - suffix.length);
      }
    }
  }
  return 'v0.1.0';
}
const tag = tagFromAssets();

const server = http.createServer((req, res) => {
  const url = (req.url || '').split('?')[0];
  if (url === '/releases/latest' || url === '/releases/latest/') {
    res.writeHead(302, { Location: `/releases/tag/${tag}` });
    res.end();
    return;
  }
  if (url === `/releases/tag/${tag}`) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
    return;
  }
  const file = path.join(dir, path.basename(url));
  let stat;
  try {
    stat = fs.lstatSync(file);
  } catch {
    stat = null;
  }
  if (stat && stat.isFile()) {
    res.writeHead(200, { 'Content-Length': stat.size });
    if (req.method === 'HEAD') res.end();
    else fs.createReadStream(file).pipe(res);
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});

server.listen(0, '127.0.0.1', () => {
  fs.writeFileSync(portFile, String(server.address().port));
});
