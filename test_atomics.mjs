    import { execFileSync } from 'node:child_process';
    import fs from 'node:fs';

    const start = Date.now();
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1200);
    const end = Date.now();
    console.log("Done", end - start);
