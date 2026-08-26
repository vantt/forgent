import readline from 'node:readline';

const rl = readline.createInterface({
  input: process.stdin,
  terminal: false,
});

rl.on('line', (line) => {
  if (!line || !line.trim()) return;
  try {
    const obj = JSON.parse(line);

    if (obj.type === 'message_update') {
      const event = obj.assistantMessageEvent;
      if (event?.type === 'text_delta' && typeof event.delta === 'string') {
        process.stdout.write(event.delta);
      }
    } else if (obj.type === 'text_delta' && typeof obj.delta === 'string') {
      process.stdout.write(obj.delta);
    } else if (obj.type === 'tool_execution_start') {
      const toolName = obj.toolName || 'tool';
      const argsStr = obj.args ? JSON.stringify(obj.args) : '';
      process.stdout.write(`\n→ ${toolName}(${argsStr})\n`);
    } else if (obj.type === 'tool_execution_end') {
      const toolName = obj.toolName || 'tool';
      const statusStr = obj.isError ? 'FAILED' : 'OK';
      process.stdout.write(`← ${toolName} [${statusStr}]\n`);
    }
  } catch {
    // Ignore invalid JSON lines
  }
});
