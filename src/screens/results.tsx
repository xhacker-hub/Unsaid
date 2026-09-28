import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BumblebeeReveal, Scene } from '../art';
import { TOPICS, question, topic } from '../data';
import type { Answer, Band, QResult, QState } from '../scoring';
import { askItems, compared, other, results, useApp } from '../store';
import type { S } from '../store';
import { color, font, radius, type } from '../theme';
import {
  Body, BandChip, CardLabel, CardText, ChartBar, Checkbox, Chip, Empty, H2, IconButton, Label, PillButton, Row,
  Screen, Small, Switch, TextLink, TornCard, cardTilt, useSecure,
} from '../ui';

export function Reveal() {
  const { a } = useApp();
  return <BumblebeeReveal onDone={a.seeReveal} />;
}

const TAG = 'Important to one of you';

function TraumaSignal({ s }: { s: S }) {
  const p = other(s.me);
  if (!compared(s).includes('trauma') || !s.traumaSignal[p]) return null;
  const how = s.answers[p].t2;
  const way = how?.state === 'answered' ? question('t2').options.find(o => o.id === how.value)?.label : undefined;
  return (
    <TornCard tilt={-1.5} seed={77}>
      <CardLabel>From them</CardLabel>
      <CardText strong>They have something they'd like to share with you, when they're ready.</CardText>
      {way && <CardText>They'd like to share it: {way.toLowerCase()}.</CardText>}
      <CardText>There's nothing to do now except let them choose the moment.</CardText>
    </TornCard>
  );
}

export function Chart() {
  const { s, go } = useApp();
  useSecure();
  const r = results(s);
  const saved = Object.values(s.asks).filter(x => x === 'saved').length;
  return (
    <Screen right={<IconButton icon="gear" label="Settings" onPress={() => go({ name: 'settings' })} />}
      footer={<>
        <PillButton label="See what to ask" onPress={() => go({ name: 'ask' })} />
        <PillButton variant="outlineLight" label={saved ? `Next chai (${saved})` : 'Next chai'} onPress={() => go({ name: 'chai' })} />
      </>}>
      <Label>Your chart</Label>
      <H2>Where you match</H2>
      {s.updated && <View style={{ alignSelf: 'flex-start' }}><Chip label="Updated after you talked" /></View>}
      <View>
        {r.map((t, i) => (
          <ChartBar key={t.topicId} index={i} name={topic(t.topicId).name} band={t.band} value={t.value}
            tag={t.flags.includes('importantToOne') ? TAG : undefined} onPress={() => go({ name: 'topicDetail', topicId: t.topicId })} />
        ))}
        {compared(s).includes('trauma') && (
          <Row title="Trauma & the past" sub="Never compared. Yours to share when you're ready." onPress={() => go({ name: 'topicDetail', topicId: 'trauma' })} />
        )}
      </View>
      <TraumaSignal s={s} />
      <Small style={{ textAlign: 'center' }}>This chart is just for the two of you.</Small>
      <TextLink label="Add or change topics" onPress={() => go({ name: 'topics' })} />
    </Screen>
  );
}

const SUMMARY: Record<Band, string> = {
  talk: 'Different answers. Ask about this first.',
  gaps: 'Close on most things. A few are worth asking about.',
  strong: 'You see this much the same way.',
  inPerson: 'One of you would rather talk about this in person.',
  notAnswered: "Not answered yet. Answer when you're ready.",
};
const QSTATE: Record<QState, string> = { match: 'You match here', differ: 'You differ here', notAnswered: 'Not answered yet', inPerson: 'Talk in person' };

function answerText(a: Answer | undefined) {
  if (!a || a.state === 'skipped') return 'Not answered yet';
  if (a.state === 'inPerson') return 'Prefer to discuss in person';
  if (a.state === 'preferNot') return 'Prefer not to say';
  const q = question(a.questionId);
  const ids = Array.isArray(a.value) ? a.value : [a.value];
  return ids.map(id => q.options.find(o => o.id === id)?.label).join(', ');
}

function AnswerBox({ who, text }: { who: string; text: string }) {
  return (
    <View style={{ flex: 1, borderWidth: 2, borderColor: color.ink, borderRadius: radius.input, padding: 10, gap: 2, minWidth: 130 }}>
      <Label c={color.amberText}>{who}</Label>
      <Text style={[type.small, { color: color.ink, fontFamily: font.g600 }]}>{text}</Text>
    </View>
  );
}

export function TopicDetail({ topicId }: { topicId: string }) {
  const { s, a, back, go } = useApp();
  useSecure();
  const t = topic(topicId);
  const p = other(s.me);
  if (!t.compare) return <TraumaDetail />;
  const r = results(s).find(x => x.topicId === topicId);
  if (!r) return <Screen onBack={back}><Empty title="This topic isn't compared." body="Only topics you both choose are compared." /></Screen>;
  const theirsVisible = t.level === 'light' || s.shares[p].includes(topicId);
  const myShare = s.shares[s.me].includes(topicId);

  return (
    <Screen onBack={back}>
      <Label>Your chart · {t.name}</Label>
      <H2>{t.name}</H2>
      <BandChip band={r.band} />
      <Body>{SUMMARY[r.band]}</Body>
      {r.flags.includes('importantToOne') && <Small>{TAG}.</Small>}
      {t.level !== 'light' && (
        <Row title="Show my answers in this topic" sub={myShare ? 'They can see what you chose here.' : "Off. They only see where you match or differ."}
          right={<Switch on={myShare} onChange={() => a.toggleShare(topicId)} label="Show my answers in this topic" />} />
      )}
      <View style={{ gap: 14, marginTop: 4 }}>
        {r.questions.map((qr, i) => <QuestionCard key={qr.question.id} qr={qr} i={i} theirsVisible={theirsVisible} />)}
      </View>
      <TextLink label="What to ask about this" onPress={() => go({ name: 'ask' })} />
    </Screen>
  );
}

function QuestionCard({ qr, i, theirsVisible }: { qr: QResult; i: number; theirsVisible: boolean }) {
  const { s, a, go } = useApp();
  const mine = s.answers[s.me][qr.question.id];
  const theirs = s.answers[other(s.me)][qr.question.id];
  return (
    <TornCard seed={i + 50} style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <CardLabel>{QSTATE[qr.state]}</CardLabel>
        {qr.dealbreakerConflict && <CardLabel>{TAG}</CardLabel>}
      </View>
      <CardText strong>{qr.question.text}</CardText>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <AnswerBox who="You" text={answerText(mine)} />
        {theirsVisible && <AnswerBox who="Them" text={answerText(theirs)} />}
      </View>
      {theirs?.noteShared && theirs.note ? <CardText>Their note: {theirs.note}</CardText> : null}
      {mine?.note ? <>
        <CardText>Your note: {mine.note}</CardText>
        <Checkbox checked={mine.noteShared} onChange={() => a.toggleNoteShare(qr.question.id)} label="Share this note with them" />
      </> : null}
      <Pressable onPress={() => go({ name: 'edit', qid: qr.question.id })} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text style={{ fontFamily: font.g600, fontSize: 15, color: color.ink, textDecorationLine: 'underline' }}>
          {qr.state === 'notAnswered' && (!mine || mine.state === 'skipped') ? 'Answer this now' : 'Change my answer'}
        </Text>
      </Pressable>
    </TornCard>
  );
}

function TraumaDetail() {
  const { s, a, back, go } = useApp();
  const mine = s.answers[s.me].t1;
  const ready = mine?.state === 'answered' && mine.value === 'o1';
  return (
    <Screen onBack={back}>
      <Label>Your chart · Trauma & the past</Label>
      <H2>Yours to share, when you're ready.</H2>
      <Body c={color.mist}>This is never compared. Your partner never sees what you answered here.</Body>
      <TraumaSignal s={s} />
      <TornCard seed={60}>
        <CardLabel>Your answer</CardLabel>
        <CardText>{answerText(mine)}</CardText>
        <Pressable onPress={() => go({ name: 'edit', qid: 't1' })} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text style={{ fontFamily: font.g600, fontSize: 15, color: color.ink, textDecorationLine: 'underline' }}>Change my answer</Text>
        </Pressable>
      </TornCard>
      {ready && (
        <Row title="Let them know I have something to share"
          sub={"They'll only see: \"They have something they'd like to share with you, when they're ready.\" You can turn this off at any time."}
          right={<Switch on={s.traumaSignal[s.me]} onChange={a.toggleTrauma} label="Let them know I have something to share" />} />
      )}
    </Screen>
  );
}

export function Ask() {
  const { s, a, back, go } = useApp();
  useSecure();
  const [full, setFull] = useState(false);
  const items = askItems(s).filter(c => !['talked', 'notNow'].includes(s.asks[c.question.id] ?? ''));
  const saved = Object.values(s.asks).filter(x => x === 'saved').length;
  const talked = Object.values(s.asks).filter(x => x === 'talked').length;
  const save = (id: string) => {
    if (saved >= 3) return setFull(true);
    a.setAsk(id, 'saved');
  };
  return (
    <Screen onBack={back} footer={<PillButton label={saved ? `Open next chai (${saved})` : 'Open next chai'} onPress={() => go({ name: 'chai' })} />}>
      <Label>Ask what matters</Label>
      <H2>Start at the top.</H2>
      <Body c={color.mist}>These matter most to one or both of you. Each one is worded to be easy to say out loud.</Body>
      {full && <Small c={color.paper}>Next chai holds 3 questions. Take one off first.</Small>}
      {items.length === 0 && <Empty title="Nothing big to ask right now." body="You see things much the same way. Bring up anything you're curious about." />}
      <View style={{ gap: 14 }}>
        {items.map((c, i) => {
          const st = s.asks[c.question.id];
          return (
            <TornCard key={c.question.id} tilt={cardTilt(i) / 2} seed={i + 90} style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <CardLabel>{topic(c.question.topicId).name}</CardLabel>
                {c.dealbreakerConflict && <CardLabel>{TAG}</CardLabel>}
              </View>
              <CardText strong>{c.question.ask}</CardText>
              {st === 'saved'
                ? <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <CardText>Saved for next chai</CardText>
                    <PillButton variant="outline" label="Remove" onPress={() => { setFull(false); a.setAsk(c.question.id, 'suggested'); }} />
                  </View>
                : <PillButton variant="ink" label="Save for next chai" onPress={() => save(c.question.id)} />}
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                <TextLink c={color.ink} label="We talked about this" onPress={() => a.setAsk(c.question.id, 'talked')} />
                <TextLink c={color.ink} label="Not now" onPress={() => a.setAsk(c.question.id, 'notNow')} />
              </View>
            </TornCard>
          );
        })}
      </View>
      <TornCard variant="ink" tilt={1.5} seed={99}>
        <CardLabel variant="ink">How to ask it</CardLabel>
        <CardText variant="ink">Listen first. Let them finish before you answer.</CardText>
        <CardText variant="ink">No judgement. There is no wrong answer here.</CardText>
        <CardText variant="ink">It's fine to pause and come back to it another day.</CardText>
      </TornCard>
      {talked > 0 && <Small style={{ textAlign: 'center' }}>You've talked about {talked}. That's the whole point.</Small>}
    </Screen>
  );
}

export function NextChai() {
  const { s, a, back } = useApp();
  const saved = Object.entries(s.asks).filter(([, st]) => st === 'saved').map(([id]) => question(id));
  const suggestions = askItems(s).filter(c => !s.asks[c.question.id] || s.asks[c.question.id] === 'suggested').slice(0, 3);
  return (
    <Screen onBack={back}>
      <Label>Next chai</Label>
      <H2>For your next meeting.</H2>
      {saved.length === 0 && (suggestions.length
        ? <Empty title="Nothing saved yet." body="Here are the three that matter most. Save them, or pick your own from what to ask.">
            <PillButton variant="ink" label="Save these three" onPress={() => suggestions.forEach(c => a.setAsk(c.question.id, 'saved'))} />
          </Empty>
        : <Empty title="Nothing saved yet." body="Save up to three questions from what to ask. They will wait here for you." />)}
      <View style={{ gap: 14 }}>
        {saved.map((q, i) => (
          <TornCard key={q.id} tilt={cardTilt(i)} seed={i + 120} style={{ gap: 12, paddingVertical: 22 }}>
            <CardLabel>{topic(q.topicId).name}</CardLabel>
            <Text style={{ fontFamily: font.g700, fontSize: 26, lineHeight: 31, letterSpacing: -0.6, color: color.ink }}>{q.ask}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <PillButton variant="ink" label="We talked" onPress={() => a.setAsk(q.id, 'talked')} style={{ flex: 1 }} />
              <PillButton variant="outline" label="Remove" onPress={() => a.setAsk(q.id, 'suggested')} style={{ flex: 1 }} />
            </View>
          </TornCard>
        ))}
      </View>
      {saved.length > 0 && suggestions.length > 0 && saved.length < 3 && (
        <View style={{ gap: 8 }}>
          <Label>Also worth asking</Label>
          {suggestions.slice(0, 3 - saved.length).map(c => (
            <Row key={c.question.id} title={c.question.ask} right={<IconButton icon="plus" label="Save for next chai" onPress={() => a.setAsk(c.question.id, 'saved')} />} />
          ))}
        </View>
      )}
      <Scene he="happy" she="happy" together={1} label="The two of them sit side by side on the bench, smiling, with chai between them." />
      <Small style={{ textAlign: 'center' }}>Works offline. Tap the wordmark to hide the app quickly.</Small>
    </Screen>
  );
}
