import { execSync } from 'node:child_process';

export function tagRelease(dir, version) {
  execSync(`cd ${dir} && npm version ${version} --no-git-tag-version && git tag v${version}`);
}
