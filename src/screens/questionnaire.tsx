import { useState } from 'react';
import { View } from 'react-native';
import { Scene } from '../art';
import { question, topic } from '../data';
import type { Answer } from '../scoring';
import { questionList, useApp } from '../store';
import type { S } from '../store';
import { color, type } from '../theme';
import {
  Body, DealbreakerToggle, H2, ImportanceSelector, Label, OptionCard, PillButton, PrivateNoteField, ProgressBar,
  ScaleSlider, Screen, Small, useSecure,
} from '../ui';

const blank = (qid: string): Answer => ({ questionId: qid, state: 'skipped', importance: 2, dealbreaker: false, noteShared: false });

// One question per screen. `edit` = changing an answer later, reached from a topic.
export function Question({ qid, edit }: { qid: string; edit?: boolean }) {
  const { s, a, back } = useApp();
  const q = question(qid);
  const t = topic(q.topicId);
  const [d, setD] = useState<Answer>(s.answers[s.me][qid] ?? blank(qid));
  useSecure(t.level !== 'light');

  const list = questionList(s, s.me);
  const idx = list.findIndex(x => x.id === qid);
  const inTopic = list.filter(x => x.topicId === t.id);
  const pos = inTopic.findIndex(x => x.id === qid);

  if (!edit && t.level === 'sensitive' && pos === 0 && !s.gates[s.me].includes(t.id)) {
    const after = list.find((x, i) => i > idx && x.topicId !== t.id);
    return <Gate topicName={t.name} onContinue={() => a.passGate(t.id)} onSkip={() => a.skipTopic(t.id, after?.id)}
      onBack={idx > 0 ? () => a.setCursor(list[idx - 1].id) : undefined} />;
  }

  const set = (next: Answer) => { setD(next); a.saveAnswer(next); }; // autosave on every change
  const pick = (id: string) => {
    if (q.type !== 'multi') return set({ ...d, state: 'answered', value: id });
    const cur = d.state === 'answered' ? (d.value as string[]) : [];
    const v = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id];
    set({ ...d, state: v.length ? 'answered' : 'skipped', value: v.length ? v : undefined });
  };
  const special = (st: 'inPerson' | 'preferNot') => set({ ...d, state: d.state === st ? 'skipped' : st, value: undefined });
  const selected = (id: string) => d.state === 'answered' && (Array.isArray(d.value) ? d.value.includes(id) : d.value === id);

  const move = (ans: Answer) => {
    const after: S = { ...s, answers: { ...s.answers, [s.me]: { ...s.answers[s.me], [qid]: ans } } };
    const l = questionList(after, s.me);
    a.next(l[l.findIndex(x => x.id === qid) + 1]?.id);
  };
  const skip = () => { const ans = { ...d, state: 'skipped' as const, value: undefined }; set(ans); edit ? back() : move(ans); };
  const answered = d.state !== 'skipped';
  const last = idx === list.length - 1;
  const compared = t.compare;

  return (
    <Screen bg={color.marigold} onBack={edit ? back : idx > 0 ? () => a.setCursor(list[idx - 1].id) : undefined}
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <PillButton variant="outline" label="Skip for now" onPress={skip} style={{ flex: 1 }} />
          <PillButton variant="ink" label={edit ? 'Save' : last ? 'Finish' : 'Next'} disabled={!answered}
            onPress={() => (edit ? back() : move(d))} style={{ flex: 1 }} />
        </View>
      }>
      {!edit && <ProgressBar value={idx / list.length} label={`Question ${idx + 1} of ${list.length}`} />}
      <Label c={color.amberText}>
        {edit ? 'Change your answer' : 'Questionnaire'} · {t.name} · {pos + 1} of {inTopic.length}
      </Label>
      <H2 c={color.ink} style={type.h3}>{q.text}</H2>

      {q.type === 'scale'
        ? <ScaleSlider options={q.options} value={d.state === 'answered' ? (d.value as string) : undefined} onChange={pick} />
        : <View style={{ gap: 10 }}>
            {q.type === 'multi' && <Small c={color.amberText}>Choose any that fit.</Small>}
            {q.options.map(o => <OptionCard key={o.id} label={o.label} multi={q.type === 'multi'} selected={selected(o.id)} onPress={() => pick(o.id)} />)}
          </View>}

      <View style={{ gap: 10 }}>
        <OptionCard label="Prefer to discuss in person" selected={d.state === 'inPerson'} onPress={() => special('inPerson')} />
        {t.level !== 'light' && <OptionCard label="Prefer not to say" selected={d.state === 'preferNot'} onPress={() => special('preferNot')} />}
      </View>

      {compared && <>
        <View style={{ height: 1, backgroundColor: color.ink, opacity: 0.2, marginVertical: 4 }} />
        <ImportanceSelector value={d.importance} onChange={v => set({ ...d, importance: v })} />
        <DealbreakerToggle value={d.dealbreaker} onChange={() => set({ ...d, dealbreaker: !d.dealbreaker })} />
      </>}
      {!compared && <Small c={color.amberText}>This is never compared. Your partner won't see your answer.</Small>}
      <PrivateNoteField value={d.note ?? ''} onChange={note => set({ ...d, note })} />
      <Small c={color.amberText}>Saved as you go.</Small>
    </Screen>
  );
}

function Gate({ topicName, onContinue, onSkip, onBack }: { topicName: string; onContinue: () => void; onSkip: () => void; onBack?: () => void }) {
  return (
    <Screen bg={color.marigold} onBack={onBack} center footer={
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <PillButton variant="outline" label="Skip for now" onPress={onSkip} style={{ flex: 1 }} />
        <PillButton variant="ink" label="Continue" onPress={onContinue} style={{ flex: 1 }} />
      </View>
    }>
      <Label c={color.amberText}>{topicName}</Label>
      <H2 c={color.ink}>This section is heavier.</H2>
      <Body c={color.ink}>Answer only what you're ready to. You can come back to it later.</Body>
      <Small c={color.amberText} style={{ marginTop: 12 }}>Skipped questions show as 'not answered yet', never as a no.</Small>
    </Screen>
  );
}

export function Waiting() {
  const { s, a } = useApp();
  const iAmHe = s.me === 'a';
  const line = 'How do I even answer the one about—';
  return (
    <Screen center footer={s.nudged[s.me]
      ? <PillButton label="Reminder sent" disabled onPress={() => {}} />
      : <><PillButton label="Send a gentle reminder" onPress={a.nudge} /><Small style={{ textAlign: 'center' }}>They'll get a quiet reminder. You can send one.</Small></>}>
      <H2 style={{ textAlign: 'center' }}>You're done.</H2>
      <Body c={color.mist} style={{ textAlign: 'center' }}>Waiting for them to finish. Your chart unlocks for both of you at the same moment.</Body>
      <Scene he={iAmHe ? 'relaxed' : 'thinking'} she={iAmHe ? 'thinking' : 'relaxed'}
        clouds={iAmHe ? [null, line] : [line, null]}
        label="One person sits relaxed on the bench, finished. The other is still thinking." />
    </Screen>
  );
}
