const fs = require('fs');
let code = fs.readFileSync('src/runner/coordination/store.mjs', 'utf8');

const regex = /export function openSession\([\s\S]*?validateManifest\(manifest\);\n\s*fs\.writeFileSync\(path\.join\(stagingDir, 'session\.json'\), JSON\.stringify\(manifest, null, 2\)\);\n\n\s*const eventsPath = path\.join\(stagingDir, 'events\.jsonl'\);\n\s*const fd = fs\.openSync\(eventsPath, 'a'\);\n\s*fs\.fsyncSync\(fd\);\n\s*fs\.closeSync\(fd\);\n\n\s*fs\.renameSync\(stagingDir, sessionDir\);\n\n\s*const manifestPath = path\.join\(sessionDir, 'session\.json'\);\n\s*const \{ events, quorum \} = resumeSession\(id, opts\);\n\s*return \{ manifest, manifestPath, events, quorum \};\n\s*\} catch \(err\) \{[\s\S]*?\n\s*\}/;

const match = code.match(regex);
if (!match) {
  console.log("NOT FOUND!");
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
    fs.writeFileSync(path.join(stagingDir, 'session.json'), JSON.stringify(manifest, null, 2));

    const eventsPath = path.join(stagingDir, 'events.jsonl');
    const fd = fs.openSync(eventsPath, 'a');
    fs.fsyncSync(fd);
    fs.closeSync(fd);

    fs.renameSync(stagingDir, sessionDir);

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
  }`;

code = code.replace(match[0], replacement);
fs.writeFileSync('src/runner/coordination/store.mjs', code);
