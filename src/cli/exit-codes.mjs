// exit-codes.mjs -- the error category -> exit status map the CLI contract names, read from one versioned table
// (exit-codes.v1.json) that the Rust host embeds too. No imports from the product: a kernel leaf.
//
// 0 is ok and 1 is an error with no recognized category (`table.unexpected`); 6 is the runner's busy status and is
// not a category. 'not-found' shares the code of 'validation' on purpose: it marks a genuine integrity failure
// (a session manifest or protocol definition really missing) so `err.category` tells it apart from an ordinary
// refusal without changing any exit status.
import fs from 'node:fs';

const table = JSON.parse(fs.readFileSync(new URL('./exit-codes.v1.json', import.meta.url), 'utf8'));

export const EXIT_CODES = Object.freeze({ ...table.categories });
