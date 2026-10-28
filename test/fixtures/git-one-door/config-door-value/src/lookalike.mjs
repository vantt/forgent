// A local function that only shares the door's name: its literal binary is a site, not configured data.
import { execFileSync } from 'node:child_process';

function readConfig() { return { bin: 'git' }; }

export function publish() { execFileSync(readConfig().bin, ['push', 'origin', 'main']); }
