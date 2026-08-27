import path from 'node:path';
import crypto from 'node:crypto';
import { rebuild, renameTopicStore } from '../../../src/state/store.mjs';

function truncateUtf8(str, maxBytes) {
  let res = '';
  let bytes = 0;
  for (const char of str) {
    const charBytes = Buffer.byteLength(char, 'utf8');
    if (bytes + charBytes > maxBytes) break;
    res += char;
    bytes += charBytes;
  }
  return res.replace(/-+$/, '');
}

const fgosDir = path.resolve('.fgos');
const view = rebuild(fgosDir);
const activeTopics = Object.values(view.topics).filter((t) => t.status === 'active');

const topicRoles = new Map();
for (const d of Object.values(view.docs || {})) {
  if (d.docLifecycle !== 'retired' && d.docLifecycle !== 'superseded') {
    topicRoles.set(d.topicId, d.role);
  }
}

const topicNewSlugs = new Map();
for (const t of activeTopics) {
  if (Buffer.byteLength(t.purposeSlug, 'utf8') <= 60) {
    topicNewSlugs.set(t.topicId, t.purposeSlug);
  }
}

const over60Topics = activeTopics.filter((t) => Buffer.byteLength(t.purposeSlug, 'utf8') > 60);

for (const t of over60Topics) {
  const orig = t.purposeSlug;
  const role = topicRoles.get(t.topicId);
  let truncated = truncateUtf8(orig, 60);

  let hasCollision = false;
  for (const other of activeTopics) {
    if (other.topicId === t.topicId) continue;
    const otherRole = topicRoles.get(other.topicId);
    if (otherRole !== role) continue;

    const otherSlug = topicNewSlugs.has(other.topicId)
      ? topicNewSlugs.get(other.topicId)
      : Buffer.byteLength(other.purposeSlug, 'utf8') <= 60
      ? other.purposeSlug
      : truncateUtf8(other.purposeSlug, 60);

    if (otherSlug === truncated) {
      hasCollision = true;
      break;
    }
  }

  if (hasCollision) {
    const hash = crypto.createHash('sha1').update(orig).digest('hex').slice(0, 6);
    const base = truncateUtf8(orig, 53);
    truncated = `${base}-${hash}`;
  }

  topicNewSlugs.set(t.topicId, truncated);
}

console.log(`Applying renames for ${over60Topics.length} topics...`);
let renamedCount = 0;
for (const t of over60Topics) {
  const newSlug = topicNewSlugs.get(t.topicId);
  renameTopicStore(fgosDir, {
    topicId: t.topicId,
    newPurposeSlug: newSlug,
  });
  renamedCount++;
}
console.log(`Successfully renamed ${renamedCount} topics.`);
