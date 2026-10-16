// Seeded 1,000-control subset of the full 8,771-control composite (148 MB, too large to commit).
// usage: node pack-subset.mjs <full-pack.json> <seed> <out-pack.json>
import fs from 'node:fs';import crypto from 'node:crypto';
const [full, seed, out] = process.argv.slice(2);
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const text = fs.readFileSync(full, 'utf8');const pack = JSON.parse(text);
const ranked = [...pack.sensitivityControls].sort((a, b) => sha(seed + ':' + a.claimId).localeCompare(sha(seed + ':' + b.claimId)));
const keep = new Set(ranked.slice(0, 1000).map((r) => r.claimId));
const sub = { ...pack, sensitivityControls: pack.sensitivityControls.filter((r) => keep.has(r.claimId)) };
const subText = JSON.stringify(sub, null, 2) + '\n';fs.writeFileSync(out, subText);
const eligible = sub.sensitivityControls.filter((r) => r.target && r.source.textDigest === r.target.textDigest && (r.source.sectionText || r.source.text) === (r.target.sectionText || r.target.text)).length;
console.log(JSON.stringify({ fullSha256: sha(text), fullControls: pack.sensitivityControls.length, seed, subsetControls: sub.sensitivityControls.length, subsetSeedEligible: eligible, subsetSha256: sha(subText), subsetBytes: Buffer.byteLength(subText) }));
