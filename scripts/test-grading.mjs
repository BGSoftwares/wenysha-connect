import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/lib/grading.ts', import.meta.url), 'utf8');
const javascript = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText;
const { calculateGradeFromScore, calculatePercentageFromScore } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`
);

const cases = [
  [0, 100, 'U'],
  [39, 100, 'U'],
  [40, 100, 'E'],
  [45, 100, 'D'],
  [50, 100, 'C'],
  [60, 100, 'B'],
  [70, 100, 'A'],
  [100, 100, 'A'],
  [1, 0, 'U'],
  [-1, 100, 'U'],
  [101, 100, 'U'],
  [Number.NaN, 100, 'U'],
];

for (const [score, total, expected] of cases) {
  assert.equal(calculateGradeFromScore(score, total).grade, expected, `${score}/${total}`);
}

console.log(`Passed ${cases.length} grade calculation cases.`);
assert.equal(calculatePercentageFromScore(15, 20), 75);
assert.equal(calculatePercentageFromScore(41, 50), 82);
assert.equal(calculatePercentageFromScore(0, 100), 0);
assert.equal(calculatePercentageFromScore(15, 0), 0);
assert.equal(calculatePercentageFromScore(101, 100), 0);
console.log('Passed 4 score-to-percentage cases.');

const csvSource = await readFile(new URL('../src/lib/csv.ts', import.meta.url), 'utf8');
const csvJavascript = ts.transpileModule(csvSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText;
const { toCsv } = await import(`data:text/javascript;base64,${Buffer.from(csvJavascript).toString('base64')}`);
assert.equal(toCsv(['Subject', 'Remarks'], [['Maths, English', 'Excellent "work"']]), '"Subject","Remarks"\r\n"Maths, English","Excellent ""work"""');
assert.equal(toCsv(['Input'], [['=HYPERLINK("https://bad.test")']]), '"Input"\r\n"\'=HYPERLINK(""https://bad.test"")"');
console.log('Passed CSV quoting and spreadsheet-formula safety cases.');
