import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/lib/tableNavigation.ts', import.meta.url), 'utf8');
const javascript = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { tablePage } = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`);
const rows = Array.from({ length: 26 }, (_, id) => ({ id }));
assert.deepEqual(tablePage(rows, 2, 10).visibleRows.map(row => row.id), [10,11,12,13,14,15,16,17,18,19]);
assert.equal(tablePage(rows, 99, 10).page, 3);
assert.equal(tablePage(rows, 3, 10).end, 26);
assert.equal(tablePage(rows.slice(0, 2), 3, 10).page, 1);
assert.deepEqual(tablePage([], 2, 10).visibleRows, []);
assert.equal(tablePage([], 2, 10).start, 0);
assert.equal(tablePage(rows, 1, 25).visibleRows.length, 25);
assert.equal(rows.length, 26);
console.log('Passed table paging, boundary, empty-state, page-size and source preservation checks.');