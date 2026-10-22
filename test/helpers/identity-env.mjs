// The env variables the writer identity rule reads, in its order: the contract owns the list.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const contract = fileURLToPath(new URL('../../packages/identity/contracts/identity.writer.v1.json', import.meta.url));
export const IDENTITY_ENV_KEYS = Object.freeze(JSON.parse(fs.readFileSync(contract, 'utf8'))['x-envOrder']);
