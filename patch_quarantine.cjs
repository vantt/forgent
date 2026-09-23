const fs = require('fs');
const file = 'scripts/test-select-compare.mjs';
let content = fs.readFileSync(file, 'utf8');

const anchor = `  const rulesToQuarantine = new Set();`;
const replacement = `  const rulesToQuarantine = new Set();
  let quarantineGlobal = false;`;

content = content.replace(anchor, replacement);

const anchor2 = `    if (classification === 'confirmed-miss') {
      
      if (plan.matchedRules) {
        // filter out already quarantined rules
        plan.matchedRules.forEach(mr => {
          if (mr.status !== 'quarantined') rulesToQuarantine.add(mr.ruleId);
        });
        
      }
    }`;
const replacement2 = `    if (classification === 'confirmed-miss') {
      if (plan.matchedRules && plan.matchedRules.length > 0) {
        plan.matchedRules.forEach(mr => {
          if (mr.status !== 'quarantined') rulesToQuarantine.add(mr.ruleId);
        });
      } else {
        quarantineGlobal = true;
      }
    }`;

content = content.replace(anchor2, replacement2);

const anchor3 = `  if (rulesToQuarantine.size > 0) {
    updateBreakerState(Array.from(rulesToQuarantine));
  }`;
const replacement3 = `  if (rulesToQuarantine.size > 0 || quarantineGlobal) {
    updateBreakerState(Array.from(rulesToQuarantine), quarantineGlobal);
  }`;

content = content.replace(anchor3, replacement3);

const anchor4 = `export function updateBreakerState(rulesToQuarantine) {
  for (const rule of rulesToQuarantine) {
    log(\`Rule \${rule} missed a failure. Escalating to quarantined.\`);
    
    if (GITHUB_TOKEN) {
      try {
        let current = '';
        try { current = execFileSync('gh', ['variable', 'get', 'SELECTOR_BREAKER']).toString().trim(); } catch (e) {}
        let state = current ? JSON.parse(current) : null;
        if (!state) state = { version: 1, global: false, quarantined: [] };
        if (!state.quarantined.includes(rule)) {
          state.quarantined.push(rule);
          state.version += 1;
          if (state.quarantined.length >= 2) state.global = true;
        }
        execFileSync('gh', ['variable', 'set', 'SELECTOR_BREAKER', '-b', JSON.stringify(state)]);
      } catch (err) {
        errFn(\`Failed to write SELECTOR_BREAKER via gh variable: \${err.message}. Falling back to issue.\`);
        try {
          execFileSync('gh', ['issue', 'create', '--title', 'Breaker Trip', '--body', \`Rule \${rule} tripped breaker.\`]);
        } catch(e) {}
      }
    }
  }
}`;
const replacement4 = `export function updateBreakerState(rulesToQuarantine, global = false) {
  if (GITHUB_TOKEN) {
    try {
      let current = '';
      try { current = execFileSync('gh', ['variable', 'get', 'SELECTOR_BREAKER']).toString().trim(); } catch (e) {}
      let state = current ? JSON.parse(current) : null;
      if (!state) state = { version: 1, global: false, quarantined: [] };
      let changed = false;
      if (global && !state.global) {
        state.global = true;
        changed = true;
        log('Unattributed miss detected. Escalating to global quarantine.');
      }
      for (const rule of rulesToQuarantine) {
        log(\`Rule \${rule} missed a failure. Escalating to quarantined.\`);
        if (!state.quarantined.includes(rule)) {
          state.quarantined.push(rule);
          changed = true;
          if (state.quarantined.length >= 2) state.global = true;
        }
      }
      if (changed) {
        state.version += 1;
        execFileSync('gh', ['variable', 'set', 'SELECTOR_BREAKER', '-b', JSON.stringify(state)]);
      }
    } catch (err) {
      errFn(\`Failed to write SELECTOR_BREAKER via gh variable: \${err.message}. Falling back to issue.\`);
      try {
        execFileSync('gh', ['issue', 'create', '--title', 'Breaker Trip', '--body', \`Miss tripped breaker. Global: \${global}. Rules: \${rulesToQuarantine.join(', ')}\`]);
      } catch(e) {}
    }
  }
}`;
content = content.replace(anchor4, replacement4);

fs.writeFileSync(file, content);
