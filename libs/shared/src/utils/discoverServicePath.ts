import * as path from 'path';

export function discoverServicePath(compiledDirname: string): string {
  const [rootDir, servicePathFromRoot] = path
    .resolve(compiledDirname)
    .split('dist');

  return `${rootDir.slice(0, rootDir.length - 1)}${servicePathFromRoot}`;
}
