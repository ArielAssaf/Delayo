import { error, log } from 'node:console';
import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { URL } from 'node:url';

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const manifest = await readFile(new URL('../src/manifest.ts', import.meta.url), 'utf8');
const manifestVersion = manifest.match(/version:\s*['"]([^'"]+)['"]/)?.[1];
const requestedVersion = process.argv
  .slice(2)
  .find((argument) => argument !== '--')
  ?.replace(/^v/, '');

if (!manifestVersion || packageJson.version !== manifestVersion) {
  error(`Version mismatch: package.json=${packageJson.version}, src/manifest.ts=${manifestVersion ?? 'missing'}`);
  process.exit(1);
}

if (requestedVersion && requestedVersion !== packageJson.version) {
  error(`Tag mismatch: tag=${requestedVersion}, package.json=${packageJson.version}`);
  process.exit(1);
}

log(`Verified Delayo version ${packageJson.version}`);
