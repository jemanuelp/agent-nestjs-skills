#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_MIN_LINES = 200;
const DEFAULT_ROOT = process.cwd();

const ignoredDirectories = new Set([
  '.git',
  '.next',
  'coverage',
  'dist',
  'node_modules',
  'tmp',
]);

const codeExtensions = new Set([
  '.cjs',
  '.css',
  '.go',
  '.html',
  '.java',
  '.js',
  '.jsx',
  '.kt',
  '.mjs',
  '.php',
  '.py',
  '.rb',
  '.scss',
  '.sh',
  '.sql',
  '.ts',
  '.tsx',
  '.vue',
]);

function parseArgs() {
  const [, , rootArg, minLinesArg] = process.argv;
  const minLines = minLinesArg ? Number(minLinesArg) : DEFAULT_MIN_LINES;

  if (!Number.isInteger(minLines) || minLines < 1) {
    throw new Error('Minimum line count must be a positive integer.');
  }

  return {
    root: path.resolve(rootArg ?? DEFAULT_ROOT),
    minLines,
  };
}

async function collectLargeFiles(directory, root, minLines) {
  const entries = await readdir(directory, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        results.push(...(await collectLargeFiles(fullPath, root, minLines)));
      }

      continue;
    }

    if (!entry.isFile() || !codeExtensions.has(path.extname(entry.name))) {
      continue;
    }

    const content = await readFile(fullPath, 'utf8');
    const lines = content.trimEnd() === '' ? 0 : content.trimEnd().split('\n').length;

    if (lines > minLines) {
      results.push({
        filePath: path.relative(root, fullPath),
        lines,
      });
    }
  }

  return results;
}

function printResults(files, minLines) {
  if (files.length === 0) {
    console.log(`No code files exceed ${minLines} lines.`);
    return;
  }

  const sortedFiles = files.sort((a, b) => b.lines - a.lines);

  console.log(`Code files over ${minLines} lines:`);
  for (const file of sortedFiles) {
    console.log(`${file.lines.toString().padStart(5, ' ')}  ${file.filePath}`);
  }
}

async function main() {
  const { root, minLines } = parseArgs();
  const files = await collectLargeFiles(root, root, minLines);
  printResults(files, minLines);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exit(1);
});
