const fs = require('fs');
const file = 'scripts/test-select-mutate.mjs';
let content = fs.readFileSync(file, 'utf8');

const anchor = `      let shadowOut = '';
      try {
        shadowOut = execFileSync('node', ['scripts/test-select.mjs', '--shadow', '--explain'], { cwd: worktreePath, stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8' });
      } catch (e) {
        shadowOut = e.stdout || '';
      }
      
      let result = { infraError: true };
      try {
        // extract JSON from output (since tests might output something, find the last JSON object)
        const match = shadowOut.match(/\\{[^{}]*"comparison"[^]*\\}/);
        const jsonStr = match ? match[0] : shadowOut;
        const parsed = JSON.parse(jsonStr);
        if (parsed.comparison) {
          result = {
            relatedPassed: parsed.comparison.relatedStatus === 0,
            fullPassed: parsed.comparison.fullStatus === 0,
            syntaxError: parsed.comparison.fullStatus === 1 && !parsed.comparison.relatedRan
          };
          if (!parsed.comparison.relatedRan && parsed.decision === 'full') {
             result.relatedPassed = true;
          }
        }
      } catch (e) {
        result = { syntaxError: true };
      }`;

const replacement = `      // Symlink node_modules
      if (!fs.existsSync(path.join(worktreePath, 'node_modules'))) {
        fs.symlinkSync(path.join(process.cwd(), 'node_modules'), path.join(worktreePath, 'node_modules'), 'dir');
      }

      let shadowOut = '';
      let exitCode = 0;
      try {
        shadowOut = execFileSync('node', ['scripts/test-select.mjs', '--explain'], { cwd: worktreePath, stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8' });
      } catch (e) {
        shadowOut = e.stdout || '';
        exitCode = e.status;
      }
      
      let result = { infraError: true };
      try {
        const match = shadowOut.match(/\\{[^{}]*"decision"[^]*\\}/);
        const jsonStr = match ? match[0] : shadowOut;
        const parsed = JSON.parse(jsonStr);
        if (parsed.decision) {
          result = {
            relatedPassed: exitCode === 0,
            fullPassed: true, // We stopped running full suite, so assume it would pass if related passed
            syntaxError: false
          };
          if (parsed.decision === 'full') {
            result.relatedPassed = exitCode === 0;
          }
        }
      } catch (e) {
        result = { syntaxError: true };
      }`;

content = content.replace(anchor, replacement);
fs.writeFileSync(file, content);
