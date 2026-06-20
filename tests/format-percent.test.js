import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatPercent } from '../dist/render/format-percent.js';

test('formatPercent pads the number to 3 chars with a space before the percent sign', () => {
  assert.equal(formatPercent(1), '  1 %');
  assert.equal(formatPercent(11), ' 11 %');
  assert.equal(formatPercent(100), '100 %');
});

test('formatPercent handles zero and boundary values', () => {
  assert.equal(formatPercent(0), '  0 %');
  assert.equal(formatPercent(7), '  7 %');
  assert.equal(formatPercent(85), ' 85 %');
});
