// src/workflow/integrate.mjs — Pure git worktree and merge integration helpers for Workflow runner
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { RunnerConfigError } from '../runner/dispatch/config.mjs';

function git(cwd, args) {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (err) {
    const stderr = err.stderr ? err.stderr.trim() : err.message;
    throw new RunnerConfigError(`git ${args[0]} failed in ${cwd}: ${stderr}`);
  }
}

/**
 * Create a dedicated git worktree for a workflow unit or step.
 *
 * @param {object} params
 * @param {string} params.repoRoot
 * @param {string} params.branch
 * @param {string} [params.baseRef]
 * @param {string} [params.worktreeDir]
 * @returns {{ worktreePath: string, branch: string }}
 */
export function createWorkflowWorktree({ repoRoot, branch, baseRef = 'HEAD', worktreeDir }) {
  if (!repoRoot || !branch) {
    throw new RunnerConfigError('createWorkflowWorktree requires repoRoot and branch');
  }

  const base = worktreeDir ?? fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-wf-wt-'));
  const worktreePath = path.resolve(base);

  // Check if branch already exists
  let branchExists = false;
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`], {
      cwd: repoRoot,
      stdio: 'ignore',
    });
    branchExists = true;
  } catch {
    branchExists = false;
  }

  if (branchExists) {
    git(repoRoot, ['worktree', 'add', worktreePath, branch]);
  } else {
    git(repoRoot, ['worktree', 'add', '-b', branch, worktreePath, baseRef]);
  }

  return {
    worktreePath: fs.realpathSync(worktreePath),
    branch,
  };
}

/**
 * Merge a source branch into a target branch cleanly using pure git.
 *
 * @param {object} params
 * @param {string} params.repoRoot
 * @param {string} params.sourceBranch
 * @param {string} [params.targetBranch] Target branch (e.g. 'main' or integration branch)
 * @param {string} [params.commitMessage]
 * @param {boolean} [params.squash]
 * @returns {{ merged: boolean, sourceBranch: string, targetBranch: string }}
 */
export function mergeWorkflowBranch({ repoRoot, sourceBranch, targetBranch = 'main', commitMessage, squash = false }) {
  if (!repoRoot || !sourceBranch) {
    throw new RunnerConfigError('mergeWorkflowBranch requires repoRoot and sourceBranch');
  }

  const msg = commitMessage || `merge: integrate workflow branch ${sourceBranch} into ${targetBranch}`;
  const mergeArgs = ['merge', '--no-ff', sourceBranch, '-m', msg];
  if (squash) {
    mergeArgs.splice(1, 1, '--squash');
  }

  // Perform merge in a temporary merge worktree or repoRoot if checked out
  const currentBranch = git(repoRoot, ['symbolic-ref', '--short', 'HEAD']);
  if (currentBranch === targetBranch) {
    git(repoRoot, mergeArgs);
  } else {
    // Perform in temporary worktree on targetBranch
    const tempWt = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-wf-merge-'));
    try {
      git(repoRoot, ['worktree', 'add', tempWt, targetBranch]);
      git(tempWt, mergeArgs);
    } finally {
      try {
        git(repoRoot, ['worktree', 'remove', '--force', tempWt]);
      } catch {
        // ignore
      }
    }
  }

  return {
    merged: true,
    sourceBranch,
    targetBranch,
  };
}

/**
 * Remove a workflow worktree and optionally delete its branch.
 *
 * @param {object} params
 * @param {string} params.repoRoot
 * @param {string} params.worktreePath
 * @param {string} [params.branch]
 * @param {boolean} [params.deleteBranch]
 */
export function cleanupWorkflowWorktree({ repoRoot, worktreePath, branch, deleteBranch = true }) {
  if (!repoRoot || !worktreePath) {
    throw new RunnerConfigError('cleanupWorkflowWorktree requires repoRoot and worktreePath');
  }

  try {
    git(repoRoot, ['worktree', 'remove', '--force', worktreePath]);
  } catch {
    // If worktree removal failed, try fs removal
    if (fs.existsSync(worktreePath)) {
      try {
        fs.rmSync(worktreePath, { recursive: true, force: true });
        git(repoRoot, ['worktree', 'prune']);
      } catch {
        // ignore
      }
    }
  }

  if (deleteBranch && branch) {
    try {
      git(repoRoot, ['branch', '-D', branch]);
    } catch {
      // ignore
    }
  }
}
