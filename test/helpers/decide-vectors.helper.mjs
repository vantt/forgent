// Runs one vector of packages/execution/contracts/decide.v1.json against the Node code that answers
// `fgos dispatch decide` and the dispatch hook today. The recorder (scripts/decide-vectors.mjs) and the replay test
// share it, so the two can never read a vector differently. A vector is `{ name, fact, runner?, machine?, args,
// expect }`:
//   decide        the decision over a loaded runner section: the semantic config check under the label
//                 "vector runner", then `decideOver` (the default executor layered on, the plan, the answer);
//                 `machine` describes what the tool probe reads (see executor-model-vectors.helper.mjs)
//   configRoot    which directory's config a decide reads, over a main checkout with one linked worktree
//                 (`args.cwd`: main | worktree | worktree-sub | outside | none; `args.worktreeConfig`): main | worktree
//   repoRootGuard `--repo-root` without `--cwd`, from a process started in main | worktree | outside;
//                 paths in the answer read <main>, <worktree>, <outside>
//   hookPayload   the normalized call of a hook payload (`args.raw`, `args.format`, `args.env`, `args.cwd`)
//   hookVerdict   the dispatch hook's verdict for a normalized call, `decide` answering `args.decided` or failing
//                 with `args.failure` ({ kind: door | runner | other, code?, message }); a call whose
//                 project exists is judged in a repository whose project config holds `runner`
//   hookAnswer    what the hook prints and exits with for a verdict in a format
//   attribute     a runner refusal (`args.error`: message, code?, path?, paths?, detail?) as the config load raises it,
//                 named by the file and line of `args.origins` under `args.projectDir`
//   globalRigorToTier  the refusal of `runner.rigorToTier` set in the global file, from `args.origins`

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ensureScriptAddon } from '../../scripts/lib/git-ports.mjs';
import { attributeRunnerConfigError, refuseGlobalRigorToTier, validateRunnerConfigShape } from '../../src/runner/dispatch/config.mjs';
import { configRootFor, decideOver, guardCwdRepoRootDivergence } from '../../src/runner/dispatch/decide.mjs';
import { decideDispatchHook } from '../../src/runner/dispatch/hook.mjs';
import { answer as hookAnswer, normalizeHookPayload } from '../../src/runner/hook.mjs';
import { RunnerConfigError } from '../../src/runner/dispatch/runner-config-error.mjs';
import { withMachine } from './executor-model-vectors.helper.mjs';
import { writeRawProjectConfig } from './config-fixture.mjs';

/** A refusal as the vectors state it: `{ error: { name, code?, message } }`. */
const refusalOf = (err) => ({ error: { name: err.name, ...(err.code === undefined ? {} : { code: err.code }), message: err.message } });

function git(dir, ...args) {
  execFileSync('git', ['-C', dir, '-c', 'user.name=vector', '-c', 'user.email=vector@example.invalid', ...args], { stdio: 'ignore' });
}

/** A repository with one commit under `parent`. */
function repository(parent, name) {
  const dir = path.join(parent, name);
  fs.mkdirSync(dir, { recursive: true });
  git(dir, 'init', '-q');
  git(dir, 'commit', '-q', '--allow-empty', '-m', 'vector');
  return fs.realpathSync(dir);
}

/** A main checkout, one linked worktree of it and a directory outside both, under a fresh temporary root. */
function withLayout({ worktreeConfig = false } = {}, fn) {
  ensureScriptAddon();
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'decide-vector-')));
  const cwd = process.cwd();
  try {
    const main = repository(root, 'main');
    const worktree = path.join(root, 'worktree');
    git(main, 'worktree', 'add', '-q', '--detach', worktree);
    fs.mkdirSync(path.join(worktree, 'sub'));
    if (worktreeConfig) writeRawProjectConfig(worktree, 'runner: {}\n');
    const outside = path.join(root, 'outside');
    fs.mkdirSync(outside);
    const places = { main, worktree: fs.realpathSync(worktree), outside };
    const named = (text) => Object.entries(places).reduce((out, [label, dir]) => out.split(dir).join(`<${label}>`), text);
    return fn(places, named);
  } finally {
    process.chdir(cwd);
    fs.rmSync(root, { recursive: true, force: true });
  }
}

/** A project whose config file holds `runner`, judged with an empty global layer; `fn` may answer a promise. */
async function withProject(runner, fn) {
  ensureScriptAddon();
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'decide-vector-project-')));
  const home = process.env.HOME;
  try {
    const project = repository(root, 'project');
    // Written as it is: the hint reads the project file the vector states, with no key moved to the global layer.
    writeRawProjectConfig(project, `${JSON.stringify({ runner: runner ?? {} })}\n`);
    fs.mkdirSync(path.join(root, 'home'));
    process.env.HOME = path.join(root, 'home');
    return await fn(project);
  } finally {
    process.env.HOME = home;
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function failureOf({ kind, code, message }) {
  // A door refusal or failure reaches the hook as the config load raises it: wrapped in a RunnerConfigError that
  // carries the door's id as its code (loadRunnerConfigForDir), never as the bare ConfigDoorError.
  if (kind === 'door' || kind === 'runner') return new RunnerConfigError(message, code === undefined ? {} : { code });
  return new Error(message);
}

const evaluators = {
  decide: ({ runner, machine, args }) => withMachine(machine, (paths) => {
    ensureScriptAddon(); // the tool probe reads HEAD and Seat Binding binds through the Git and host doors
    const loaded = structuredClone(runner ?? {});
    validateRunnerConfigShape(loaded, 'vector runner');
    return decideOver(structuredClone(runner ?? {}), { ...args, repoRoot: paths.repoRoot });
  }),
  configRoot: ({ args }) => withLayout(args, (places, named) => {
    const cwd = args.cwd === 'none' ? undefined : args.cwd === 'worktree-sub' ? path.join(places.worktree, 'sub') : places[args.cwd];
    return named(configRootFor(cwd, places.main));
  }),
  repoRootGuard: ({ args }) => withLayout({}, (places, named) => {
    process.chdir(places[args.processIn]);
    try {
      guardCwdRepoRootDivergence(args.cwd ? places[args.cwd] : undefined, args.repoRoot ? places[args.repoRoot] : undefined);
      return { ok: true };
    } catch (err) {
      const refusal = refusalOf(err);
      refusal.error.message = named(refusal.error.message);
      return refusal;
    }
  }),
  hookPayload: ({ args }) => normalizeHookPayload(args.raw, { format: args.format ?? null, env: args.env ?? {}, cwd: args.cwd }),
  hookVerdict: ({ runner, args }) => {
    const judge = (call) => decideDispatchHook(call, {
      decide: async () => {
        if (args.failure) throw failureOf(args.failure);
        return args.decided;
      },
    });
    if (!args.projectDirExists) return judge(args.call);
    return withProject(runner, (project) => judge({ ...args.call, projectDir: project }));
  },
  hookAnswer: ({ args }) => hookAnswer(args.verdict, args.format),
  attribute: ({ args }) => {
    const { message, ...fields } = args.error;
    const err = new RunnerConfigError(message, fields);
    return refusalOf(attributeRunnerConfigError(err, args.origins, args.projectDir) ?? err);
  },
  globalRigorToTier: ({ args }) => {
    refuseGlobalRigorToTier(args.origins);
    return { ok: true };
  },
};

/** Every fact a vector may name. */
export const DECIDE_FACTS = Object.freeze(Object.keys(evaluators));

/** The answer the Node code gives for one vector (a refusal is part of the answer). */
export async function evaluateDecideVector(vector) {
  const evaluate = evaluators[vector.fact];
  if (!evaluate) throw new Error(`vector "${vector.name}" names the unknown fact "${vector.fact}"`);
  try {
    return JSON.parse(JSON.stringify((await evaluate({ args: {}, ...vector })) ?? null));
  } catch (err) {
    return refusalOf(err);
  }
}
