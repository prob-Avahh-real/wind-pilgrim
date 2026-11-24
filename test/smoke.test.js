import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const proj = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

test('capacitor android present', () => {
  const cap = ['capacitor.config.json', 'capacitor.config.ts'].find((n) =>
    fs.existsSync(path.join(proj, n))
  );
  assert.ok(cap, 'missing capacitor.config');
  assert.ok(fs.existsSync(path.join(proj, 'android')), 'missing android/');
  assert.ok(fs.existsSync(path.join(proj, 'package.json')), 'missing package.json');
});

test('package.json has build + test scripts', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(proj, 'package.json'), 'utf8'));
  assert.ok(pkg.name);
  assert.ok(pkg.scripts?.build, 'missing build script');
  assert.ok(pkg.scripts?.test, 'missing test script');
});
