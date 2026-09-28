// Compatibility logic (spec section 6). Pure functions, no React, no I/O.
// Users only ever see bands. Numbers here never reach the UI as text.

export type Importance = 1 | 2 | 3; // Low, Medium, High
export type QType = 'single' | 'scale' | 'multi';
export type Level = 'light' | 'medium' | 'sensitive';

export interface Option { id: string; label: string }

export interface Topic {
  id: string;
  name: string;
  level: Level;
  order: number;
  compare: boolean; // false for Trauma & the past: never compared, only signalled
}

export interface Question {
  id: string;
  topicId: string;
  text: string;
  ask: string; // the same question, worded to say out loud
  type: QType;
  options: Option[]; // scale: 5 options in order, first and last are the labelled ends
  partialCredit?: Record<string, number>; // "optA|optB" -> 0..1, looked up both ways
  allowInPerson: true;
  showIf?: { questionId: string; optionIds: string[] };
}

export type AnswerState = 'answered' | 'skipped' | 'inPerson' | 'preferNot';

export interface Answer {
  questionId: string;
  state: AnswerState;
  value?: string | string[]; // option id, or ids for multi
  importance: Importance;
  dealbreaker: boolean;
  note?: string;
  noteShared: boolean;
}

export type Answers = Record<string, Answer | undefined>;
export type Band = 'talk' | 'inPerson' | 'gaps' | 'strong' | 'notAnswered';
export type QState = 'match' | 'differ' | 'notAnswered' | 'inPerson';

export const BAND_ORDER: Band[] = ['talk', 'inPerson', 'gaps', 'strong', 'notAnswered'];
export const MATCH_AT = 0.8;

export function alignment(q: Question, a: Answer, b: Answer): number {
  if (q.type === 'scale') {
    const ia = q.options.findIndex(o => o.id === a.value);
    const ib = q.options.findIndex(o => o.id === b.value);
    return 1 - Math.abs(ia - ib) / (q.options.length - 1);
  }
  if (q.type === 'multi') {
    const sa = new Set(a.value as string[]);
    const sb = new Set(b.value as string[]);
    const union = new Set([...sa, ...sb]).size;
    if (union === 0) return 1;
    return [...sa].filter(x => sb.has(x)).length / union;
  }
  if (a.value === b.value) return 1;
  const pc = q.partialCredit ?? {};
  return pc[`${a.value}|${b.value}`] ?? pc[`${b.value}|${a.value}`] ?? 0;
}

export interface QResult {
  question: Question;
  state: QState;
  alignment?: number;
  weight: number;
  dealbreakerConflict: boolean;
}

export function questionResult(q: Question, a?: Answer, b?: Answer): QResult {
  const weight = Math.max(a?.importance ?? 1, b?.importance ?? 1);
  const base = { question: q, weight, dealbreakerConflict: false };
  if (!a || !b || a.state === 'skipped' || b.state === 'skipped') return { ...base, state: 'notAnswered' };
  if (a.state !== 'answered' || b.state !== 'answered') return { ...base, state: 'inPerson' };
  const al = alignment(q, a, b);
  return {
    ...base,
    state: al >= MATCH_AT ? 'match' : 'differ',
    alignment: al,
    dealbreakerConflict: (a.dealbreaker || b.dealbreaker) && al < MATCH_AT,
  };
}

export interface TopicResult {
  topicId: string;
  band: Band;
  value: number; // weighted mean alignment; drives bar length only
  coverage: number;
  flags: 'importantToOne'[];
  questions: QResult[];
}

export function topicResult(topicId: string, questions: Question[], a: Answers, b: Answers): TopicResult {
  const qs = questions.filter(q => q.topicId === topicId).map(q => questionResult(q, a[q.id], b[q.id]));
  const answered = qs.filter(r => r.state !== 'notAnswered');
  const scored = qs.filter(r => r.alignment !== undefined);
  const coverage = qs.length ? answered.length / qs.length : 0;
  const w = scored.reduce((s, r) => s + r.weight, 0);
  const value = w ? scored.reduce((s, r) => s + r.alignment! * r.weight, 0) / w : 0;
  const out = { topicId, value, coverage, questions: qs, flags: [] as 'importantToOne'[] };

  if (scored.some(r => r.dealbreakerConflict)) return { ...out, band: 'talk', flags: ['importantToOne'] };
  if (coverage < 0.5) return { ...out, band: 'notAnswered' };
  if (!scored.length) return { ...out, band: 'inPerson' };
  return { ...out, band: value >= 0.8 ? 'strong' : value >= 0.55 ? 'gaps' : 'talk' };
}

export function chart(topicIds: string[], questions: Question[], a: Answers, b: Answers): TopicResult[] {
  return topicIds
    .map(t => topicResult(t, questions, a, b))
    .sort((x, y) => BAND_ORDER.indexOf(x.band) - BAND_ORDER.indexOf(y.band));
}

export interface AskCandidate { question: Question; priority: number; dealbreakerConflict: boolean }

// Gap × importance, dealbreaker conflicts first. "Talk in person" answers count as a half gap.
export function askOrder(results: TopicResult[]): AskCandidate[] {
  return results
    .flatMap(t => t.questions)
    .filter(r => r.state === 'differ' || r.state === 'inPerson')
    .map(r => ({
      question: r.question,
      dealbreakerConflict: r.dealbreakerConflict,
      priority: (r.alignment === undefined ? 0.5 : 1 - r.alignment) * r.weight,
    }))
    .sort((x, y) => Number(y.dealbreakerConflict) - Number(x.dealbreakerConflict) || y.priority - x.priority);
}
