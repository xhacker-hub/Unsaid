// Local, mocked state for both partners on one device (spec section 10).
// A backend replaces this file: every field maps to a table in the data model.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Answer, Answers } from './scoring';
import { chart, askOrder } from './scoring';
import { QUESTIONS, SAMPLE_USERS, TOPICS, sampleAnswers } from './data';

export type Uid = 'a' | 'b';
export const other = (u: Uid): Uid => (u === 'a' ? 'b' : 'a');

export interface User {
  id: Uid; displayName: string; phone: string; ageConfirmed: boolean;
  settings: { pin?: string; quickHide: boolean; notify: boolean; language: 'en' | 'hi' | 'hinglish' };
}
export interface Pair {
  id: string; code: string; userA: Uid; userB?: Uid;
  status: 'pending' | 'active' | 'ended'; confirmed: Uid[]; createdAt: number;
}
export type AskStatus = 'suggested' | 'saved' | 'talked' | 'notNow';

export type Route =
  | { name: 'welcome' } | { name: 'how'; invite?: boolean } | { name: 'privacy'; invite?: boolean } | { name: 'signup'; invite?: boolean }
  | { name: 'enterCode' }
  | { name: 'topics' } | { name: 'topicDetail'; topicId: string } | { name: 'edit'; qid: string }
  | { name: 'ask' } | { name: 'chai' } | { name: 'settings' } | { name: 'help' };

export type Stage =
  | 'onboarding' | 'ended' | 'pair' | 'confirm' | 'topics' | 'topicsWait' | 'intro'
  | 'question' | 'waiting' | 'reveal' | 'chart';

type PerUser<T> = Record<Uid, T>;
const both = <T,>(v: () => T): PerUser<T> => ({ a: v(), b: v() });

export interface S {
  me: Uid;
  users: Partial<PerUser<User>>;
  stack: PerUser<Route[]>;
  pair?: Pair;
  consent: Partial<PerUser<string[]>>; // TopicConsent: opted-in topic ids, undefined = not submitted
  answers: PerUser<Answers>;
  cursor: PerUser<string | undefined>; // question id to resume at
  gates: PerUser<string[]>; // heavy topics already past the gate
  finished: PerUser<boolean>;
  shares: PerUser<string[]>; // TopicShare: topics where "Show my answers" is on
  traumaSignal: PerUser<boolean>;
  asks: Record<string, AskStatus>; // AskItem.status, per pair, by question id
  revealSeen: PerUser<boolean>;
  updated: boolean; // "Updated after you talked"
  nudged: PerUser<boolean>;
  notice: PerUser<boolean>; // discreet notification: "You have an update in Unsaid"
  endedNotice: PerUser<boolean>; // "Your pair has ended."
  offline: boolean;
  hidden: boolean; // quick hide: persists, so a relaunch still opens on the neutral screen
}

export const fresh = (): S => ({
  me: 'a', users: {}, stack: { a: [{ name: 'welcome' }], b: [{ name: 'welcome' }] },
  consent: {}, answers: both(() => ({})), cursor: both(() => undefined), gates: both(() => []),
  finished: both(() => false), shares: both(() => []), traumaSignal: both(() => false), asks: {},
  revealSeen: both(() => false), updated: false, nudged: both(() => false), notice: both(() => false),
  endedNotice: both(() => false), offline: false, hidden: false,
});

// ---------- derived ----------

export const compared = (s: S) =>
  TOPICS.filter(t => s.consent.a?.includes(t.id) && s.consent.b?.includes(t.id)).map(t => t.id);

// The questions this user walks through, in order, respecting "show if" follow-ups.
export function questionList(s: S, u: Uid) {
  const topics = compared(s);
  return QUESTIONS.filter(q => topics.includes(q.topicId)).filter(q => {
    if (!q.showIf) return true;
    const dep = s.answers[u][q.showIf.questionId];
    return dep?.state === 'answered' && q.showIf.optionIds.includes(dep.value as string);
  });
}

export const results = (s: S) => chart(compared(s).filter(id => TOPICS.find(t => t.id === id)!.compare), QUESTIONS, s.answers.a, s.answers.b);
export const askItems = (s: S) => askOrder(results(s));

export function stage(s: S, u: Uid = s.me): Stage {
  const p = other(u);
  if (!s.users[u]) return 'onboarding';
  if (s.endedNotice[u]) return 'ended';
  if (!s.pair || s.pair.status === 'ended' || (s.pair.userA !== u && s.pair.userB !== u) || !s.pair.userB) return 'pair';
  if (s.pair.status === 'pending') return 'confirm';
  if (!s.consent[u]) return 'topics';
  if (!s.consent[p]) return 'topicsWait';
  if (!s.finished[u]) return s.cursor[u] ? 'question' : 'intro';
  if (!s.finished[p]) return 'waiting';
  if (!s.revealSeen[u]) return 'reveal';
  return 'chart';
}

// ---------- context ----------

const KEY = 'unsaid:v1';
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)); // ponytail: whole-state copy; fine at this size

interface Ctx {
  s: S;
  update: (fn: (d: S) => void) => void;
  go: (r: Route) => void;
  back: () => void;
  route?: Route;
  a: ReturnType<typeof actions>;
}
const C = createContext<Ctx>(null!);
export const useApp = () => useContext(C);

export function Store({ children, onReady }: { children: React.ReactNode; onReady?: () => void }) {
  const [s, setS] = useState<S | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(raw => setS(raw ? { ...fresh(), ...JSON.parse(raw) } : fresh()))
      .catch(() => setS(fresh()))
      .finally(onReady);
  }, []);
  useEffect(() => { if (s) AsyncStorage.setItem(KEY, JSON.stringify(s)).catch(() => {}); }, [s]);

  const ctx = useMemo<Ctx | null>(() => {
    if (!s) return null;
    const update = (fn: (d: S) => void) => setS(prev => { const d = clone(prev!); fn(d); return d; });
    const stack = s.stack[s.me];
    return {
      s, update,
      route: stack[stack.length - 1],
      go: r => update(d => { d.stack[d.me].push(r); }),
      back: () => update(d => { d.stack[d.me].pop(); }),
      a: actions(update),
    };
  }, [s]);

  return ctx ? <C.Provider value={ctx}>{children}</C.Provider> : null;
}

// ---------- actions ----------

const code6 = () => Array.from({ length: 6 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 31)]).join('');
const blankAnswer = (qid: string): Answer => ({ questionId: qid, state: 'skipped', importance: 2, dealbreaker: false, noteShared: false });

function clearPairData(d: S) {
  d.consent = {}; d.answers = both(() => ({})); d.cursor = both(() => undefined); d.gates = both(() => []);
  d.finished = both(() => false); d.shares = both(() => []); d.traumaSignal = both(() => false); d.asks = {};
  d.revealSeen = both(() => false); d.updated = false; d.nudged = both(() => false);
  d.stack.a = d.users.a ? [] : [{ name: 'welcome' }];
  d.stack.b = d.users.b ? [] : [{ name: 'welcome' }];
}

function actions(update: Ctx['update']) {
  return {
    switchUser: () => update(d => { d.me = other(d.me); }),
    signUp: (u: Omit<User, 'id' | 'settings'>, invite?: boolean) => update(d => {
      d.users[d.me] = { ...u, id: d.me, settings: { quickHide: true, notify: true, language: 'en' } };
      d.stack[d.me] = invite ? [{ name: 'enterCode' }] : [];
    }),
    createPair: () => update(d => {
      d.pair = { id: `p${Date.now()}`, code: code6(), userA: d.me, status: 'pending', confirmed: [], createdAt: Date.now() };
      d.endedNotice[d.me] = false;
    }),
    // Returns false when the code doesn't match an open invite.
    joinPair: (code: string, s: S) => {
      const p = s.pair;
      if (!p || p.status !== 'pending' || p.userA === s.me || p.userB || p.code !== code.toUpperCase()) return false;
      update(d => { d.pair!.userB = d.me; d.endedNotice[d.me] = false; d.notice[p.userA] = true; d.stack[d.me] = []; });
      return true;
    },
    confirmPair: (yes: boolean) => update(d => {
      const p = d.pair!;
      if (!yes) { p.userB = undefined; p.confirmed = []; return; }
      if (!p.confirmed.includes(d.me)) p.confirmed.push(d.me);
      if (p.confirmed.length === 2) p.status = 'active';
      else d.notice[other(d.me)] = true;
    }),
    setConsent: (ids: string[]) => update(d => {
      d.consent[d.me] = ids;
      d.notice[other(d.me)] = true;
      if (d.stack[d.me].at(-1)?.name === 'topics') d.stack[d.me].pop();
    }),
    start: (firstQid: string) => update(d => { d.cursor[d.me] = firstQid; }),
    setCursor: (qid: string) => update(d => { d.cursor[d.me] = qid; }),
    passGate: (topicId: string) => update(d => { d.gates[d.me].push(topicId); }),
    skipTopic: (topicId: string, nextQid: string | undefined) => update(d => {
      for (const q of QUESTIONS.filter(x => x.topicId === topicId)) d.answers[d.me][q.id] ??= blankAnswer(q.id);
      d.gates[d.me].push(topicId);
      finishOrMove(d, nextQid);
    }),
    saveAnswer: (a: Answer) => update(d => {
      d.answers[d.me][a.questionId] = a;
      if (d.revealSeen[d.me]) { d.updated = true; d.notice[other(d.me)] = true; }
    }),
    next: (nextQid: string | undefined) => update(d => finishOrMove(d, nextQid)),
    nudge: () => update(d => { d.nudged[d.me] = true; d.notice[other(d.me)] = true; }),
    seeReveal: () => update(d => { d.revealSeen[d.me] = true; }),
    setAsk: (qid: string, st: AskStatus) => update(d => { d.asks[qid] = st; }),
    toggleShare: (topicId: string) => update(d => {
      const l = d.shares[d.me];
      d.shares[d.me] = l.includes(topicId) ? l.filter(x => x !== topicId) : [...l, topicId];
    }),
    toggleNoteShare: (qid: string) => update(d => { const a = d.answers[d.me][qid]; if (a) a.noteShared = !a.noteShared; }),
    toggleTrauma: () => update(d => { d.traumaSignal[d.me] = !d.traumaSignal[d.me]; }),
    setSettings: (patch: Partial<User['settings']>) => update(d => { const u = d.users[d.me]!; u.settings = { ...u.settings, ...patch }; }),
    dismissNotice: () => update(d => { d.notice[d.me] = false; }),
    clearEnded: () => update(d => { d.endedNotice[d.me] = false; }),
    unpair: () => update(d => {
      if (d.pair) d.pair.status = 'ended';
      d.endedNotice[other(d.me)] = !!d.users[other(d.me)];
      clearPairData(d);
    }),
    deleteEverything: () => update(d => {
      if (d.pair) d.pair.status = 'ended';
      d.endedNotice[other(d.me)] = !!d.users[other(d.me)];
      delete d.users[d.me];
      d.endedNotice[d.me] = false;
      clearPairData(d);
    }),
    hide: () => update(d => { d.hidden = true; }),
    unhide: () => update(d => { d.hidden = false; }),
    toggleOffline: () => update(d => { d.offline = !d.offline; }),
    reset: () => update(d => Object.assign(d, fresh())),
    // Demo only: do whatever the partner's next step needs, so one person can click the whole journey.
    fillPartner: () => update(d => {
      const p = other(d.me);
      if (!d.users[p]) d.users[p] = { id: p, ...SAMPLE_USERS[p], ageConfirmed: true, settings: { quickHide: true, notify: true, language: 'en' } };
      d.stack[p] = [];
      if (!d.pair || d.pair.status === 'ended') {
        d.pair = { id: `p${Date.now()}`, code: code6(), userA: p, status: 'pending', confirmed: [], createdAt: Date.now() };
      }
      if (!d.pair.userB) { d.pair.userB = d.pair.userA === p ? d.me : p; return; }
      if (d.pair.status === 'pending') {
        if (!d.pair.confirmed.includes(p)) d.pair.confirmed.push(p);
        if (d.pair.confirmed.length === 2) d.pair.status = 'active';
        return;
      }
      if (!d.consent[p]) { d.consent[p] = TOPICS.map(t => t.id); return; }
      if (!d.finished[p] && d.consent[d.me]) {
        d.answers[p] = { ...sampleAnswers(p, compared(d)), ...d.answers[p] };
        d.finished[p] = true;
        d.cursor[p] = undefined;
        d.shares[p] = ['past'];
        d.traumaSignal[p] = true;
      }
    }),
    fillMe: () => update(d => {
      d.answers[d.me] = { ...sampleAnswers(d.me, compared(d)), ...d.answers[d.me] };
      finishOrMove(d, undefined);
    }),
  };
}

function finishOrMove(d: S, nextQid: string | undefined) {
  if (nextQid) { d.cursor[d.me] = nextQid; return; }
  d.finished[d.me] = true;
  d.cursor[d.me] = undefined;
  if (d.finished[other(d.me)]) d.notice[other(d.me)] = true;
}

