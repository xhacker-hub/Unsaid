// Run with: npm test  (Node's built-in runner, types stripped natively)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { alignment, askOrder, chart, topicResult } from './scoring.ts';
import type { Answer, Answers, Question } from './scoring.ts';

const opts = (...ids: string[]) => ids.map(id => ({ id, label: id }));
const Q: Question[] = [
  { id: 'live', topicId: 't', text: '', ask: '', type: 'single', allowInPerson: true,
    options: opts('with', 'near', 'own', 'open'), partialCredit: { 'near|with': 0.6 } },
  { id: 'kids', topicId: 't', text: '', ask: '', type: 'scale', allowInPerson: true, options: opts('0', '1', '2', '3', '4') },
  { id: 'help', topicId: 't', text: '', ask: '', type: 'multi', allowInPerson: true, options: opts('a', 'b', 'c') },
  { id: 'money', topicId: 't', text: '', ask: '', type: 'single', allowInPerson: true, options: opts('none', 'some', 'lots') },
];
const ans = (questionId: string, value: Answer['value'], extra: Partial<Answer> = {}): Answer =>
  ({ questionId, state: 'answered', value, importance: 2, dealbreaker: false, noteShared: false, ...extra });
const set = (...as: Answer[]): Answers => Object.fromEntries(as.map(a => [a.questionId, a]));

const same = set(ans('live', 'own'), ans('kids', '2'), ans('help', ['a', 'b']), ans('money', 'none'));
const opposite = set(ans('live', 'with'), ans('kids', '4'), ans('help', ['c']), ans('money', 'lots'));
const other = set(ans('live', 'own'), ans('kids', '0'), ans('help', ['a']), ans('money', 'none'));

test('alignment: scale, single with partial credit, multi (Jaccard)', () => {
  assert.equal(alignment(Q[1], ans('kids', '0'), ans('kids', '4')), 0);
  assert.equal(alignment(Q[1], ans('kids', '1'), ans('kids', '2')), 0.75);
  assert.equal(alignment(Q[0], ans('live', 'with'), ans('live', 'near')), 0.6);
  assert.equal(alignment(Q[0], ans('live', 'near'), ans('live', 'with')), 0.6);
  assert.equal(alignment(Q[2], ans('help', ['a', 'b']), ans('help', ['b', 'c'])), 1 / 3);
});

test('identical answers give Strong match', () => {
  assert.equal(topicResult('t', Q, same, same).band, 'strong');
});

test('opposite answers give Talk about this', () => {
  assert.equal(topicResult('t', Q, same, opposite).band, 'talk');
});

test('all skipped gives Not answered yet', () => {
  const skipped = set(...Q.map(q => ({ ...ans(q.id, undefined), state: 'skipped' as const })));
  assert.equal(topicResult('t', Q, skipped, same).band, 'notAnswered');
  assert.equal(topicResult('t', Q, {}, {}).band, 'notAnswered');
});

test('a dealbreaker with alignment < 0.8 overrides the band', () => {
  const b = { ...same, money: ans('money', 'some', { dealbreaker: true }) };
  const plain = topicResult('t', Q, same, { ...same, money: ans('money', 'some') });
  const flagged = topicResult('t', Q, same, b);
  assert.notEqual(plain.band, 'talk');
  assert.equal(flagged.band, 'talk');
  assert.deepEqual(flagged.flags, ['importantToOne']);
  // A dealbreaker on a matching answer changes nothing.
  assert.equal(topicResult('t', Q, same, { ...same, money: ans('money', 'none', { dealbreaker: true }) }).band, 'strong');
});

test('order independence: (A,B) equals (B,A)', () => {
  for (const [a, b] of [[same, opposite], [same, other], [other, opposite]]) {
    const ab = topicResult('t', Q, a, b), ba = topicResult('t', Q, b, a);
    assert.equal(ab.band, ba.band);
    assert.equal(ab.value, ba.value);
  }
});

test('a skip never lowers a band', () => {
  const b = { ...same, kids: ans('kids', '0') }; // one disagreement
  const withSkip = { ...b, kids: { ...b.kids!, state: 'skipped' as const } };
  assert.equal(topicResult('t', Q, same, withSkip).band, 'strong');
  assert.ok(topicResult('t', Q, same, withSkip).value >= topicResult('t', Q, same, b).value);
});

test('"prefer to discuss in person" is excluded and shown as Talk in person', () => {
  const inPerson = set(...Q.map(q => ({ ...ans(q.id, undefined), state: 'inPerson' as const })));
  const r = topicResult('t', Q, inPerson, same);
  assert.equal(r.band, 'inPerson');
  assert.ok(r.questions.every(q => q.state === 'inPerson'));
});

test('ask order: dealbreaker conflicts first, then gap × importance', () => {
  const b = { ...opposite, help: ans('help', ['a'], { dealbreaker: true }) };
  const order = askOrder(chart(['t'], Q, same, b)).map(c => c.question.id);
  assert.deepEqual(order, ['help', 'live', 'money', 'kids']);
});
