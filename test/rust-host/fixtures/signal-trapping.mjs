#!/usr/bin/env node
// Fixture that terminates on SIGTERM
process.on("SIGTERM", () => {
  process.exit(143);
});
// Sleep until signaled
setTimeout(() => {
  process.exit(0);
}, 30000);
