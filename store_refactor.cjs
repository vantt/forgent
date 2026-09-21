const fs = require('fs');
let code = fs.readFileSync('src/runner/coordination/store.mjs', 'utf8');

// Replace createHash import with randomUUID addition
code = code.replace(/import \{ createHash \} from 'node:crypto';/, "import { createHash, randomUUID } from 'node:crypto';");
if (!code.includes('randomUUID')) {
    code = code.replace(/import \{ createHash, randomUUID \} from 'node:crypto';/, "import { createHash, randomUUID } from 'node:crypto';");
}

// Add buildEffectiveDefinitionSnapshot function
const helperCode = `
function buildEffectiveDefinitionSnapshot(rawDefinition, orgDischargeOn) {
  const definition = JSON.parse(JSON.stringify(rawDefinition));
  if (Array.isArray(orgDischargeOn)) {
    for (const node of definition.spec.graph.nodes) {
      for (const op of node.operations) {
        if (op.rechecks) {
          const protocolDischargeOn = op.rechecks.dischargeOn || ['accepted'];
          const intersection = protocolDischargeOn.filter((d) => orgDischargeOn.includes(d));
          if (intersection.length === 0) {
            throw new CoordinationError('validation', \`openSession: orgPolicy.dischargeOn (\${JSON.stringify(orgDischargeOn)}) has no intersection with protocol's dischargeOn (\${JSON.stringify(protocolDischargeOn)}) for operation "\${op.ref}" -- refusing to open session with empty effectiveDischargeOn\`);
          }
          op.rechecks.dischargeOn = intersection;
        }
      }
    }
  }
  const snapshotStr = JSON.stringify(definition, null, 2);
  const digest = createHash('sha256').update(snapshotStr).digest('hex');
  return { snapshotStr, digest };
}
`;

code = code.replace("export function openSession(", helperCode + "\nexport function openSession(");

// Rewrite the definition block in openSession
const defBlockRegex = /let snapshotRef = undefined;[\s\S]*?snapshotRef = \{ digest \};\n\s*\}/;
const newDefBlock = `let snapshotRef = undefined; 
    if (schemaVersion === "3" && definitionRef) {
      let rawDefinition;
      if (opts.resolvedDefinition) {
        rawDefinition = opts.resolvedDefinition;
      } else if (typeof definitionRef.id === 'string') {
        rawDefinition = loadCoordinationProtocol(definitionRef.id, opts);
      }
      
      if (rawDefinition) {
        const orgDischargeOn = opts.runnerConfig?.coordination?.orgPolicy?.dischargeOn;
        const { snapshotStr, digest } = buildEffectiveDefinitionSnapshot(rawDefinition, orgDischargeOn);
        
        const snapshotPath = path.join(stagingDir, 'snapshot.json');
        fs.writeFileSync(snapshotPath, snapshotStr);
        snapshotRef = { digest };
      }
    }`;
code = code.replace(defBlockRegex, newDefBlock);

// Rewrite claim logic
const claimBlockRegex = /if \(id\) \{[\s\S]*?after \$\{MAX_SESSION_ID_CLAIM_ATTEMPTS\} attempts\`\);\n\s*\}/;

const getProcStartTimeCode = `
  let processStartTime = Date.now();
  try { processStartTime = fs.statSync('/proc/' + process.pid).mtimeMs; } catch(e) {}
`;

const newClaimBlock = `const token = randomUUID();${getProcStartTimeCode}
    if (id) {
      assertSafeCoordinationId(id);
      sessionDir = path.join(sessionsDir, id);
      claimDir = sessionDir + '.claim';
      try { 
        fs.mkdirSync(claimDir); 
      } catch(err) {
        if (err.code === 'EEXIST') throw new CoordinationError('validation', \`coordination session "\${id}" already exists (claim held)\`);
        throw err;
      }
      try {
        const claimPath = path.join(claimDir, 'claim.json');
        fs.writeFileSync(claimPath, JSON.stringify({ pid: process.pid, processStartTime, createdAt: Date.now(), token }));
        const fd = fs.openSync(claimPath, 'r');
        fs.fsyncSync(fd);
        fs.closeSync(fd);
        const fdDir = fs.openSync(claimDir, 'r');
        fs.fsyncSync(fdDir);
        fs.closeSync(fdDir);
      } catch (err) {
        fs.rmSync(claimDir, { recursive: true, force: true });
        throw err;
      }
      if (fs.existsSync(sessionDir)) {
        throw new CoordinationError('validation', \`coordination session "\${id}" already exists\`);
      }
    } else {
      let claimed = false;
      for (let attempt = 0; attempt < MAX_SESSION_ID_CLAIM_ATTEMPTS && !claimed; attempt += 1) {
        id = \`coord_\${Date.now().toString(36)}_\${Math.random().toString(36).slice(2, 8)}\`;
        sessionDir = path.join(sessionsDir, id);
        claimDir = sessionDir + '.claim';
        try { 
          fs.mkdirSync(claimDir); 
        } catch (e) {
          if (e.code !== 'EEXIST') throw e;
          continue;
        }
        try {
          const claimPath = path.join(claimDir, 'claim.json');
          fs.writeFileSync(claimPath, JSON.stringify({ pid: process.pid, processStartTime, createdAt: Date.now(), token }));
          const fd = fs.openSync(claimPath, 'r');
          fs.fsyncSync(fd);
          fs.closeSync(fd);
          const fdDir = fs.openSync(claimDir, 'r');
          fs.fsyncSync(fdDir);
          fs.closeSync(fdDir);
          
          if (!fs.existsSync(sessionDir)) {
            claimed = true; 
          } else {
            fs.rmSync(claimDir, { recursive: true, force: true });
          }
        } catch(e) {
          fs.rmSync(claimDir, { recursive: true, force: true });
          throw e;
        }
      }
      if (!claimed) throw new CoordinationError('validation', \`openSession could not claim a unique coordinationId after \${MAX_SESSION_ID_CLAIM_ATTEMPTS} attempts\`);
    }`;

code = code.replace(claimBlockRegex, newClaimBlock);

// Remove the Math.random() token generation previously added
code = code.replace("const token = Math.random().toString(36).slice(2);\n", "");

fs.writeFileSync('src/runner/coordination/store.mjs', code);
