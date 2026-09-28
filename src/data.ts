// Mock content. The bank is an example and must be finalised with a counsellor. [Confirm]
// Copy rules: no ellipses, no em dashes (those belong to the trail-off illustrations only).
import type { Answer, Answers, Importance, Option, Question, QType, Topic } from './scoring';

export const TOPICS: Topic[] = [
  { id: 'family', name: 'Family & living', level: 'light', order: 1, compare: true },
  { id: 'money', name: 'Money, loans & debt', level: 'light', order: 2, compare: true },
  { id: 'children', name: 'Children', level: 'light', order: 3, compare: true },
  { id: 'everyday', name: 'Everyday life', level: 'light', order: 4, compare: true },
  { id: 'past', name: 'Past relationships', level: 'medium', order: 5, compare: true },
  { id: 'intimacy', name: 'Intimacy & desire', level: 'sensitive', order: 6, compare: true },
  { id: 'mental', name: 'Mental health', level: 'sensitive', order: 7, compare: true },
  { id: 'trauma', name: 'Trauma & the past', level: 'sensitive', order: 8, compare: false },
];
export const topic = (id: string) => TOPICS.find(t => t.id === id)!;

const o = (...labels: string[]): Option[] => labels.map((label, i) => ({ id: `o${i}`, label }));
const q = (id: string, topicId: string, type: QType, text: string, ask: string, options: Option[],
  partialCredit?: Record<string, number>, showIf?: Question['showIf']): Question =>
  ({ id, topicId, type, text, ask, options, partialCredit, showIf, allowInPerson: true });

export const QUESTIONS: Question[] = [
  q('f1', 'family', 'single', 'After marriage, where would you want to live?',
    'Where do you picture us living after the wedding?',
    o('With my parents', 'Near my parents', 'On our own', 'Open to discussing'),
    { 'o0|o1': 0.6, 'o1|o2': 0.6, 'o0|o3': 0.7, 'o1|o3': 0.7, 'o2|o3': 0.7 }),
  q('f2', 'family', 'scale', 'How much say should parents have in our big decisions?',
    'How involved do you want our parents to be in the big decisions?',
    o('None at all', 'A little', 'Some', 'Quite a lot', 'A lot')),
  q('f3', 'family', 'single', 'If a parent needed full-time care one day, what would you expect?',
    'If one of our parents needed looking after, what would you want us to do?',
    o('They move in with us', 'We move closer to them', 'We arrange care together', 'Not sure yet'),
    { 'o0|o1': 0.6, 'o1|o2': 0.6, 'o0|o2': 0.4, 'o0|o3': 0.5, 'o1|o3': 0.5, 'o2|o3': 0.5 }),
  q('f4', 'family', 'scale', 'How often would you want to see your family after marriage?',
    'How often do you picture us seeing your family?',
    o('A few times a year', 'Every month', 'Every two weeks', 'Every week', 'Every day')),

  q('m1', 'money', 'single', 'Do you have any loans or debt?',
    'Is there any loan or debt I should know about? I will tell you mine too.',
    o('None', 'Some', 'Significant'), { 'o0|o1': 0.6, 'o1|o2': 0.6 }),
  q('m2', 'money', 'scale', 'Are you more of a spender or a saver?',
    'What does a normal month of spending look like for you?',
    o('Big spender', 'Mostly spend', 'Balanced', 'Mostly save', 'Big saver')),
  q('m3', 'money', 'single', 'Who in your family decides how money gets spent?',
    'Who decides on money in your family, and how would you want it to work for us?',
    o('My father', 'My mother', 'Both parents together', 'Everyone manages their own'),
    { 'o0|o2': 0.5, 'o1|o2': 0.5, 'o0|o1': 0.3, 'o2|o3': 0.4 }),
  q('m4', 'money', 'scale', 'After marriage, how would you like to handle money?',
    'Would you want our money to be joint, separate, or a mix?',
    o('All joint', 'Mostly joint', 'Half and half', 'Mostly separate', 'All separate')),
  q('m5', 'money', 'single', 'Do you send, or expect to send, money to your family each month?',
    'Do you help your family with money? How do you see that after we marry?',
    o('No', 'Sometimes', 'Yes, regularly'), { 'o0|o1': 0.6, 'o1|o2': 0.6 }),

  q('c1', 'children', 'single', 'Do you want children?', 'Do you see children in our future?',
    o('Yes', 'No', 'Not sure yet'), { 'o0|o2': 0.5, 'o1|o2': 0.5 }),
  q('c2', 'children', 'single', 'How many children do you want?', 'How many children do you imagine having?',
    o('None', 'One', 'Two', 'More than two', 'Not sure yet'),
    { 'o1|o2': 0.6, 'o2|o3': 0.6, 'o1|o4': 0.5, 'o2|o4': 0.5, 'o3|o4': 0.5, 'o0|o4': 0.3 }),
  q('c3', 'children', 'single', 'When would you want your first child?', 'When would you feel ready for a child?',
    o('Within a year', 'In one to two years', 'In three years or more', 'Not sure yet'),
    { 'o0|o1': 0.6, 'o1|o2': 0.6, 'o0|o3': 0.5, 'o1|o3': 0.5, 'o2|o3': 0.5 }),
  q('c4', 'children', 'scale', 'How equally should parenting be shared?',
    'How do you picture us sharing the work of raising a child?',
    o('One of us does most', 'Mostly one of us', 'Somewhat shared', 'Mostly shared', 'Fully equal')),

  q('e1', 'everyday', 'scale', 'How important is your career to you in the next five years?',
    'Where do you want your work to be in five years?',
    o('Not very', 'A little', 'Quite', 'Very', 'It comes first')),
  q('e2', 'everyday', 'single', 'How should chores be split?', 'How do you picture us running the house day to day?',
    o('Equally', 'Whoever has more time', 'We hire help', 'The way our families did it'),
    { 'o0|o1': 0.7, 'o0|o2': 0.5, 'o1|o2': 0.6, 'o1|o3': 0.3 }),
  q('e3', 'everyday', 'scale', 'How much time alone do you need in a week?',
    'How much time to yourself do you need in a normal week?',
    o('Very little', 'A little', 'Some', 'Quite a bit', 'A lot')),
  q('e4', 'everyday', 'scale', 'How important are religion and rituals in your daily life?',
    'Which rituals matter most to you, and which could you let go of?',
    o('Not at all', 'A little', 'Somewhat', 'Quite', 'Very')),
  q('e5', 'everyday', 'multi', 'What does a good weekend look like?', 'What would your perfect weekend with me look like?',
    o('Family visits', 'Friends', 'Staying in', 'Going out', 'Travel', 'Temple or prayer', 'Catching up on work')),

  q('p1', 'past', 'scale', "How much do you want to know about each other's past relationships?",
    'How much would you like us to share about the past?',
    o('Nothing at all', 'Very little', 'The basics', 'Most things', 'Everything')),
  q('p2', 'past', 'single', 'Is it okay for either of us to stay in touch with an ex?',
    'How would you feel if one of us was still in touch with an ex?',
    o('No', 'Only as a casual friend', 'Yes, that is fine'), { 'o0|o1': 0.5, 'o1|o2': 0.6 }),
  q('p3', 'past', 'single', 'Have you been in a serious relationship before?',
    'Is there anything about your past relationships you would like me to know?',
    o('No', 'Yes'), { 'o0|o1': 0.6 }),

  q('i1', 'intimacy', 'scale', 'How often would you ideally want to be intimate in the first year?',
    'What feels like a comfortable rhythm for us, early on?',
    o('Rarely', 'Now and then', 'About weekly', 'Often', 'Very often')),
  q('i2', 'intimacy', 'single', "Are there things you'd like to explore together one day?",
    'Is there anything you would like us to explore together, when we are ready?',
    o('Yes, happy to talk about it', 'Maybe later'), { 'o0|o1': 0.7 }),
  q('i3', 'intimacy', 'scale', 'How comfortable are you talking about intimacy with your partner?',
    'How can we make it easier to talk about this with each other?',
    o('Not yet', 'A little', 'Getting there', 'Mostly', 'Very comfortable')),
  q('i4', 'intimacy', 'single', 'In the first months, what pace feels right to you?',
    'What pace would feel right to you after the wedding?',
    o('Take it slow', 'Let it happen naturally', 'Soon after the wedding'), { 'o0|o1': 0.6, 'o1|o2': 0.6 }),
  q('i5', 'intimacy', 'single', 'Do you have boundaries you would want your partner to know about?',
    'Are there any boundaries you would like me to know about?',
    o('Yes, I would like to share them', 'Not really', 'Not sure yet'),
    { 'o0|o1': 0.6, 'o0|o2': 0.7, 'o1|o2': 0.7 }),

  q('h1', 'mental', 'single', 'Have you ever struggled with your mental health?',
    'Is there anything about how you have been feeling, now or before, that you would like me to know?',
    o('No', 'Yes, in the past', 'Yes, currently'), { 'o0|o1': 0.6, 'o0|o2': 0.6, 'o1|o2': 0.8 }),
  q('h2', 'mental', 'scale', 'How open are you to therapy or counselling, for either of us?',
    'How would you feel about one of us seeing a counsellor?',
    o('Not open', 'A little open', 'Unsure', 'Open', 'Very open')),
  q('h3', 'mental', 'multi', 'On a bad day, what helps you most?', 'On a bad day, what can I do that actually helps?',
    o('Time alone', 'Talking it through', 'A hug', 'Getting out of the house', 'Sleep', 'Prayer', 'A show or a game')),
  q('h4', 'mental', 'single', 'When your partner is low, what would you want to do?',
    'When I am having a hard time, what will you want to do?',
    o('Give them space', 'Stay close', 'Ask what they need'), { 'o0|o2': 0.7, 'o1|o2': 0.7, 'o0|o1': 0.3 }),

  // Never compared. The partner only ever sees a signal the sharer turns on.
  q('t1', 'trauma', 'single', "Is there something from your past you'd want your partner to know before marriage?", '',
    o('No', "Yes, when I'm ready", 'Not sure')),
  q('t2', 'trauma', 'single', 'How would you like to share it?', '',
    o('In person', 'In the app, later', 'With a counsellor present'), undefined, { questionId: 't1', optionIds: ['o1'] }),
];
export const question = (id: string) => QUESTIONS.find(x => x.id === id)!;

export const SAMPLE_USERS = {
  a: { displayName: 'Aarav', phone: '+91 98200 11111' },
  b: { displayName: 'Meera', phone: '+91 98200 22222' },
};

// Compact sample answers: value, 'in' (discuss in person), 'skip'. Suffix '!' = dealbreaker, '^' = high importance.
type Raw = Record<string, string>;
const RAW: Record<'a' | 'b', Raw> = {
  a: { f1: 'o1', f2: 'o2^', f3: 'o0', f4: 'o3', m1: 'o1', m2: 'o3', m3: 'o0', m4: 'o1', m5: 'o2^',
    c1: 'o0', c2: 'o2', c3: 'o1', c4: 'o3', e1: 'o3', e2: 'o0', e3: 'o1', e4: 'o2', e5: 'o0,o2,o4',
    p1: 'o2', p2: 'o1', p3: 'in', i1: 'o2', i2: 'o1', i3: 'o1', i4: 'o1', i5: 'o2',
    h1: 'o1', h2: 'o3', h3: 'o1,o3', h4: 'o2', t1: 'o0' },
  b: { f1: 'o2^', f2: 'o0^', f3: 'o2', f4: 'o1', m1: 'o0!', m2: 'o4', m3: 'o2', m4: 'o2', m5: 'o0',
    c1: 'o0', c2: 'o2', c3: 'o2', c4: 'o4', e1: 'o4^', e2: 'o0', e3: 'o2', e4: 'o2', e5: 'o2,o4,o1',
    p1: 'o2', p2: 'o1', p3: 'o0', i1: 'o3', i2: 'o0', i3: 'o2', i4: 'o0', i5: 'o0',
    h1: 'o1', h2: 'o4', h3: 'o0,o1,o4', h4: 'o2', t1: 'o1', t2: 'o0' },
};

export function sampleAnswers(who: 'a' | 'b', topicIds: string[]): Answers {
  const out: Answers = {};
  for (const [qid, raw] of Object.entries(RAW[who])) {
    const qq = question(qid);
    if (!topicIds.includes(qq.topicId)) continue;
    const v = raw.replace(/[!^]/g, '');
    const importance: Importance = raw.includes('^') || raw.includes('!') ? 3 : 2;
    const a: Answer = { questionId: qid, state: 'answered', importance, dealbreaker: raw.includes('!'), noteShared: false };
    if (v === 'in') a.state = 'inPerson';
    else if (v === 'skip') a.state = 'skipped';
    else a.value = qq.type === 'multi' ? v.split(',') : v;
    out[qid] = a;
  }
  return out;
}
