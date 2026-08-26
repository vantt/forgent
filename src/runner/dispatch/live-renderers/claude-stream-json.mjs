import readline from 'node:readline';

const rl = readline.createInterface({
  input: process.stdin,
  terminal: false,
});

rl.on('line', (line) => {
  if (!line || !line.trim()) return;
  try {
    const obj = JSON.parse(line);

    if (obj.type === 'content_block_delta' && obj.delta?.type === 'text_delta' && typeof obj.delta.text === 'string') {
      process.stdout.write(obj.delta.text);
    } else if (obj.event?.delta?.type === 'text_delta' && typeof obj.event.delta.text === 'string') {
      process.stdout.write(obj.event.delta.text);
    } else if (obj.type === 'text_delta' && typeof obj.text === 'string') {
      process.stdout.write(obj.text);
    } else if (obj.type === 'text' && typeof obj.text === 'string') {
      process.stdout.write(obj.text);
    } else if (obj.type === 'content_block_start' && obj.content_block?.type === 'tool_use') {
      const toolName = obj.content_block.name || 'tool';
      process.stdout.write(`\n→ ${toolName}\n`);
    } else if (obj.type === 'tool_use') {
      const toolName = obj.name || 'tool';
      process.stdout.write(`\n→ ${toolName}\n`);
    }
  } catch {
    // Ignore invalid JSON lines
  }
});
