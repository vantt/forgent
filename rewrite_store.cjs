const fs = require('fs');
let code = fs.readFileSync('src/runner/coordination/store.mjs', 'utf8');

// Replace rmdirSync with rmSync
code = code.replace(/fs\.rmdirSync\(([^,]+),\s*\{\s*recursive:\s*true\s*\}\)/g, 'fs.rmSync($1, { recursive: true, force: true })');

// Export assertDriverIdentity
code = code.replace('function assertDriverIdentity(', 'export function assertDriverIdentity(');

// Replace openSession
const startStr = `export function openSession(`;
const endStr = `  return Object.freeze(manifest);\n}`;
const startIdx = code.indexOf(startStr);
const endIdx = code.indexOf(endStr);
if (startIdx === -1 || endIdx === -1) {
  console.log("NOT FOUND openSession limits!");
  process.exit(1);
}

const replacement = `export function openSession(
  { coordinationId, objective, provenanceRoot, definitionRef = null, workRef = null, actors, aggregateBounds, partialPolicy = null, schemaVersion = SCHEMA_VERSION },
  opts = {},
) {
  if (!SUPPORTED_SCHEMA_VERSIONS.has(schemaVersion)) {
    throw new CoordinationError(
      'validation',
      \`openSession: schemaVersion "\${schemaVersion}" is not one of the supported versions (\${[...SUPPORTED_SCHEMA_VERSIONS].join(' | ')})\`,
    );
  }
  const { sessionsDir } = resolveCoordinationPaths(opts);
  fs.mkdirSync(sessionsDir, { recursive: true });

  const stagingDir = path.join(sessionsDir, \`.staging-\${Date.now().toString(36)}-\${Math.random().toString(36).slice(2, 8)}\`);
  fs.mkdirSync(stagingDir, { recursive: true });

  let claimDir;
  let sessionDir;
  let id = coordinationId;
  const token = Math.random().toString(36).slice(2);

  try {
    const resolvedActors = Array.isArray(actors)
      ? actors.map((actor) => ({
          id: actor.id,
          role: actor.role,
          ...(actor.persona !== undefined ? { persona: actor.persona } : {}),
          ...(actor.policy !== undefined ? { policy: actor.policy } : {}),
        }))
      : undefined;

    let snapshotRef = undefined; 
    if (schemaVersion === "3" && definitionRef && opts.resolvedDefinition) {
      const definition = JSON.parse(JSON.stringify(opts.resolvedDefinition));
      
      const orgDischargeOn = opts.runnerConfig?.coordination?.orgPolicy?.dischargeOn;
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
      
      const snapshotPath = path.join(stagingDir, 'snapshot.json');
      fs.writeFileSync(snapshotPath, snapshotStr);
      
      snapshotRef = { digest };
    } else if (schemaVersion === "3" && definitionRef && typeof definitionRef.id === 'string') {
      const rawDefinition = loadCoordinationProtocol(definitionRef.id, opts);
      const definition = JSON.parse(JSON.stringify(rawDefinition));
      
      const orgDischargeOn = opts.runnerConfig?.coordination?.orgPolicy?.dischargeOn;
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
      
      const snapshotPath = path.join(stagingDir, 'snapshot.json');
      fs.writeFileSync(snapshotPath, snapshotStr);
      
      snapshotRef = { digest };
    }

    if (id) {
      assertSafeCoordinationId(id);
      sessionDir = path.join(sessionsDir, id);
      claimDir = sessionDir + '.claim';
      try { 
        fs.mkdirSync(claimDir); 
        try {
          fs.writeFileSync(path.join(claimDir, 'claim.json'), JSON.stringify({
            pid: process.pid,
            createdAt: Date.now(),
            token
          }));
        } catch(e) {}
      } catch(err) {
        if (err.code === 'EEXIST') throw new CoordinationError('validation', \`coordination session "\${id}" already exists (claim held)\`);
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
          try {
            fs.writeFileSync(path.join(claimDir, 'claim.json'), JSON.stringify({
              pid: process.pid,
              createdAt: Date.now(),
              token
            }));
          } catch(e) {}
          if (!fs.existsSync(sessionDir)) {
            claimed = true; 
          }
        } catch (e) {
          if (e.code !== 'EEXIST') throw e;
        }
      }
      if (!claimed) throw new CoordinationError('validation', \`openSession could not claim a unique coordinationId after \${MAX_SESSION_ID_CLAIM_ATTEMPTS} attempts\`);
    }

    const manifest = {
      schemaVersion,
      coordinationId: id,
      objective,
      status: 'active',
      createdAt: new Date().toISOString(),
      provenanceRoot,
      definitionRef,
      ...(snapshotRef ? { snapshotRef } : {}),
      workRef,
      ...(resolvedActors ? { actors: resolvedActors } : {}),
      aggregateBounds: applyAggregateBoundDefaults(aggregateBounds),
      partialPolicy,
      assignmentRefs: [],
      completedAt: null,
    };

    validateManifest(manifest);
    fs.writeFileSync(path.join(stagingDir, 'session.json'), JSON.stringify(manifest, null, 2) + '\\n');

    const eventsPath = path.join(stagingDir, 'events.jsonl');
    fs.writeFileSync(eventsPath, '');
    
    const openedPayload = { coordinationId: id, provenanceRoot };
    validateEventPayload('session-opened', openedPayload);
    appendSessionEventLocked(eventsPath, { type: 'session-opened', payload: openedPayload }, stagingDir, manifest);
    
    if (resolvedActors) {
      for (const actor of resolvedActors) {
        const payload = {
          actorId: actor.id,
          role: actor.role,
          ...(actor.persona !== undefined ? { persona: actor.persona } : {}),
          ...(actor.policy !== undefined ? { policy: actor.policy } : {}),
        };
        validateEventPayload('actor-bound', payload);
        appendSessionEventLocked(eventsPath, { type: 'actor-bound', payload }, stagingDir, manifest);
      }
    }

    // Fsync files and staging directory for crash durability
    if (snapshotRef) {
      const fdSnap = fs.openSync(path.join(stagingDir, 'snapshot.json'), 'r');
      fs.fsyncSync(fdSnap);
      fs.closeSync(fdSnap);
    }
    const fdSess = fs.openSync(path.join(stagingDir, 'session.json'), 'r');
    fs.fsyncSync(fdSess);
    fs.closeSync(fdSess);
    const fdEv = fs.openSync(eventsPath, 'r');
    fs.fsyncSync(fdEv);
    fs.closeSync(fdEv);
    const fdStaging = fs.openSync(stagingDir, 'r');
    fs.fsyncSync(fdStaging);
    fs.closeSync(fdStaging);

    try {
      fs.renameSync(stagingDir, sessionDir);
      const fdParent = fs.openSync(sessionsDir, 'r');
      fs.fsyncSync(fdParent);
      fs.closeSync(fdParent);
    } catch (err) {
      if (err.code === 'EEXIST' || err.code === 'ENOTEMPTY' || err.code === 'EPERM') {
        throw new CoordinationError('validation', \`coordination session "\${id}" already exists\`);
      }
      throw err;
    }

    const manifestPath = path.join(sessionDir, 'session.json');
    const { events, quorum } = resumeSession(id, opts);
    return { manifest, manifestPath, events, quorum };
  } finally {
    if (claimDir) {
      try {
        const claimJsonPath = path.join(claimDir, 'claim.json');
        if (fs.existsSync(claimJsonPath)) {
          const claimData = JSON.parse(fs.readFileSync(claimJsonPath, 'utf8'));
          if (claimData.token === token) {
            fs.rmSync(claimDir, { recursive: true, force: true });
          }
        } else {
           fs.rmSync(claimDir, { recursive: true, force: true });
        }
      } catch (e) {}
    }
    try {
      fs.rmSync(stagingDir, { recursive: true, force: true });
    } catch (e) {}
  }
}`;

code = code.slice(0, startIdx) + replacement + code.slice(endIdx + endStr.length);
fs.writeFileSync('src/runner/coordination/store.mjs', code);
