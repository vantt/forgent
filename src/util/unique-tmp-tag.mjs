// unique-tmp-tag.mjs -- the suffix every write-then-rename / write-then-link
// temp file uses. `pid` + a timestamp is not unique on its own: worker
// threads share one pid and each thread gets its own module-level counter,
// so two threads in the same millisecond produced the SAME temp path and one
// thread's rename/link then found its file already consumed (ENOENT) or
// carrying the other thread's bytes. The thread id plus random bytes make
// every call distinct, across processes and threads alike.
import crypto from 'node:crypto';
import { threadId } from 'node:worker_threads';

export function uniqueTmpTag() {
  return `${process.pid}-${threadId}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}
