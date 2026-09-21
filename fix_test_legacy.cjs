const fs = require('fs');
let text = fs.readFileSync('test/runner/coordination-legacy-schema-compatibility.test.mjs', 'utf8');
text = text.replace(
  "fs.copyFileSync(path.join(fixtureDir, 'events.jsonl'), path.join(sessionDir, 'events.jsonl'));",
  `fs.copyFileSync(path.join(fixtureDir, 'events.jsonl'), path.join(sessionDir, 'events.jsonl'));
  
  const assignmentsDir = path.join(fakeFgosDir, '.fgos/assignments/asg-123');
  fs.mkdirSync(assignmentsDir, { recursive: true });
  fs.writeFileSync(path.join(assignmentsDir, 'assignment.json'), JSON.stringify({
    assignmentId: "asg-123",
    status: "active"
  }));`
);
fs.writeFileSync('test/runner/coordination-legacy-schema-compatibility.test.mjs', text);
