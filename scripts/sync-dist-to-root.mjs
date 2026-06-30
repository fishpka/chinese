import { access, cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');

const pathsToReplace = [
  '404.html',
  'assets',
  'emotion',
  'favicon.svg',
  'icons.svg',
  'index.html',
  'logo.png',
  'ogimage.jpg',
  'robots.txt',
  'sitemap.xml',
  'word',
];

async function pathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function copyDeployPath(relativePath) {
  const from = path.join(distDir, relativePath);
  const to = path.join(rootDir, relativePath);

  try {
    await rm(to, { recursive: true, force: true });
    await mkdir(path.dirname(to), { recursive: true });
    await cp(from, to, { recursive: true });
    return true;
  } catch (error) {
    if (error.code === 'ENOENT' && !(await pathExists(from))) {
      return false;
    }

    throw error;
  }
}

const copied = [];

for (const relativePath of pathsToReplace) {
  if (await copyDeployPath(relativePath)) {
    copied.push(relativePath);
  }
}

console.log(`Synced ${copied.length} deploy paths from dist to project root`);
