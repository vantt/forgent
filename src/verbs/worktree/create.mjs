import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createGitWorktree } from '../../git/worktree.mjs';
import { provisionDependencies, runWorktreeSetupCommands } from '../../runner/worktree.mjs';

export function createWorktreeUseCase(ctx, options, loaderOptions) {
  if (options.branch && options.detach) throw new Error('worktree create: --branch and --detach are mutually exclusive');
  if (!options.path || typeof options.path !== 'string') throw new Error('worktree create requires a path');
  const port = createGitWorktree({ stateRoot: ctx.stateRoot, repoPath: ctx.cwd, trustedMain: ctx.repoRoot, writer: ctx.writer }, loaderOptions);
  const created = port[options.branch ? 'create' : 'createDetached']({ path: path.resolve(ctx.cwd, options.path), branch: options.branch, base: options.base, operationId: `worktree-${randomUUID()}` });
  // The Git port has returned and released its locks: dependency install and
  // the project's `worktreeSetup.commands` are Execution's job, never Git's.
  provisionDependencies(created.path);
  runWorktreeSetupCommands(created.path, ctx.repoRoot);
  return created;
}
