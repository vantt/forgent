// test/helpers/herdr-pane-model.mjs -- the pane bookkeeping a scripted fake herdr shares.
//
// A bespoke fake herdr script (one per test file, each playing its own worker)
// pastes `paneModelSource(...)` after it has defined `args`, `group`, `action`,
// `ok`, `fail` and imported `fs`. The pasted code answers the commands the
// terminal-control herdr driver issues for pane placement and liveness, the
// way a real herdr does:
//   tab create  -> a new tab whose root pane is the group's first pane
//   pane split  -> a new pane in the target pane's tab (pane_not_found when it is not live)
//   pane layout -> the tab's live panes stacked in one column
//   pane get    -> live, or pane_not_found once closed / never existed
//   pane close  -> closes the pane (pane_not_found when it is already gone)
//   tab/pane rename, workspace create, --version, pane layout --help
//   agent start -> a real process in the pane with the agent kind as argv0 (`exec -a <kind> sleep`)
//   pane process-info -> that process's live argv next to the pane's shell; only the shell once the
//                   agent ended (`endAgent(paneId)`) or the pane is closed
// `processInfo: false` leaves `pane process-info` to the script (a fake foreground process).
// A started agent's pid is appended to `agentPidLog` so a test can kill what a kept pane left running.
// The pasted code needs `spawn` from node:child_process as well as `fs`.
// `knownPanes` are panes that exist before the round starts (a caller's own
// tab); they share one tab. Pane ids are `mock-pane-N` in creation order.
// The pasted code also defines `paneIsLive(id)` for the script's own answers.
// A script that wants a pane to look gone for its own reasons answers
// `pane get` itself before this code runs.

export function paneModelSource({ statePath, agentPidLog, knownPanes = [], processInfo = true }) {
  return `
if (args[0] === '--version') { console.log('herdr 0.9.1-fake'); process.exit(0); }
if (args[0] === 'pane' && args[1] === 'layout' && args[2] === '--help') { console.log('usage: herdr pane layout'); process.exit(0); }
{
  const modelPath = ${JSON.stringify(statePath)};
  const model = (() => {
    try { return JSON.parse(fs.readFileSync(modelPath, 'utf8')); } catch {
      return { tabs: 0, panes: Object.fromEntries(${JSON.stringify(knownPanes)}.map((id) => [id, { tab: 'known-tab', closed: false }])) };
    }
  })();
  const alive = (pid) => {
    try { process.kill(pid, 0); } catch { return false; }
    try { return !/^\\d+ \\(.*\\) Z/.test(fs.readFileSync('/proc/' + pid + '/stat', 'utf8')); } catch { return false; }
  };
  const save = () => fs.writeFileSync(modelPath, JSON.stringify(model));
  const flagValue = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
  const live = (id) => (model.panes[id] && !model.panes[id].closed ? model.panes[id] : null);
  globalThis.paneIsLive = (id) => live(id) !== null;
  globalThis.endAgent = (id) => {
    const pane = model.panes[id];
    if (!pane) return;
    if (pane.pid) { try { process.kill(pane.pid, 'SIGKILL'); } catch {} }
    pane.exited = true;
    save();
  };
  const newPane = (tab) => {
    const id = 'mock-pane-' + (Object.keys(model.panes).filter((p) => p.startsWith('mock-pane-')).length + 1);
    model.panes[id] = { tab, closed: false };
    return id;
  };
  if ((group === 'tab' || group === 'workspace') && action === 'create') {
    model.tabs += 1;
    const tab = 'mock-tab-' + model.tabs;
    const pane = newPane(tab);
    save();
    ok({ tab: { tab_id: tab }, root_pane: { pane_id: pane } });
  }
  if ((group === 'tab' || group === 'pane') && action === 'rename') ok({});
  if (group === 'pane' && action === 'split') {
    const target = live(flagValue('--pane'));
    if (!target) fail('pane_not_found', 'no such pane');
    const id = newPane(target.tab);
    save();
    ok({ pane: { pane_id: id, tab_id: target.tab } });
  }
  if (group === 'pane' && action === 'layout') {
    const pane = live(flagValue('--pane'));
    if (!pane) fail('pane_not_found', 'no such pane');
    const ids = Object.keys(model.panes).filter((id) => live(id) && model.panes[id].tab === pane.tab);
    const height = Math.floor(69 / ids.length);
    ok({ layout: { tab_id: pane.tab, area: { x: 0, y: 0, width: 352, height: 69 }, panes: ids.map((id, i) => ({ pane_id: id, rect: { x: 0, y: i * height, width: 352, height } })) } });
  }
  if (group === 'pane' && action === 'get') {
    const pane = live(args[2]);
    if (!pane) fail('pane_not_found', 'pane not found');
    ok({ pane: { pane_id: args[2], tab_id: pane.tab } });
  }
  if (group === 'pane' && action === 'close') {
    const pane = live(args[2]);
    if (!pane) fail('pane_not_found', 'pane not found');
    pane.closed = true;
    if (pane.pid) { try { process.kill(pane.pid, 'SIGKILL'); } catch {} }
    save();
    ok({ closed: true });
  }
  if (group === 'agent' && action === 'start') {
    const id = flagValue('--pane');
    const pane = live(id);
    if (!pane) fail('pane_not_found', 'no such pane');
    const child = spawn('bash', ['-c', 'exec -a ' + flagValue('--kind') + ' sleep 60'], { detached: true, stdio: 'ignore' });
    child.unref();
    fs.appendFileSync(${JSON.stringify(agentPidLog)}, child.pid + '\\n');
    pane.pid = child.pid;
    pane.exited = false;
    save();
    ok({ agent: { agent_status: 'idle' } });
  }
  if (${processInfo} && group === 'pane' && action === 'process-info') {
    // A real pane always lists its own shell. "The agent is there" means a foreground process that is
    // NOT the shell, so an agent that ended leaves the shell alone.
    const id = flagValue('--pane');
    const pane = live(id);
    if (!pane) fail('pane_not_found', 'pane not found');
    const gone = pane.exited || !pane.pid || !alive(pane.pid);
    const shell = { pid: 100, name: 'zsh', argv: ['zsh'] };
    let foreground = [shell];
    if (!gone) {
      const argv = fs.readFileSync('/proc/' + pane.pid + '/cmdline', 'utf8').split('\\0').filter((a, k, all) => a !== '' || k < all.length - 1);
      foreground = [{ pid: pane.pid, name: argv[0], argv }, shell];
    }
    ok({ process_info: { pane_id: id, shell_pid: 100, foreground_process_group_id: gone ? 100 : pane.pid, foreground_processes: foreground } });
  }
}
`;
}
