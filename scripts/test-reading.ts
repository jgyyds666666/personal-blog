import assert from 'node:assert/strict';
import { parseReadingPosition, readingPositionKey } from '../src/lib/reading-position';

const now = 1_800_000_000_000;
const position = { version: 1, contentVersion: 'revision-1', progress: 45.5, headingId: 'heading-20', sectionProgress: 0.25, updatedAt: now };
assert.deepEqual(parseReadingPosition(JSON.stringify(position), 'revision-1', now), position);
assert.equal(parseReadingPosition(JSON.stringify(position), 'revision-2', now), null);
assert.equal(parseReadingPosition('{broken', 'revision-1', now), null);
assert.equal(parseReadingPosition(null, 'revision-1', now), null);
assert.equal(parseReadingPosition('x'.repeat(2049), 'revision-1', now), null);
for (const invalid of [
  { version: 2 }, { progress: -1 }, { progress: 101 }, { progress: '50' },
  { sectionProgress: -0.1 }, { sectionProgress: 1.1 }, { headingId: '#invalid' },
  { updatedAt: now - 31 * 24 * 60 * 60 * 1000 }, { updatedAt: now + 120_000 },
]) assert.equal(parseReadingPosition(JSON.stringify({ ...position, ...invalid }), 'revision-1', now), null);
assert.equal(parseReadingPosition(JSON.stringify({ ...position, headingId: null }), 'revision-1', now)?.headingId, null);
assert.notEqual(readingPositionKey('post:123'), readingPositionKey('document:123'));
const extraContent = { ...position, content: '不应保存正文', title: '不应保存标题' };
assert.deepEqual(parseReadingPosition(JSON.stringify(extraContent), 'revision-1', now), position);
console.log('Reading position checks passed: validation, expiry, revisions, namespace isolation and content exclusion.');
