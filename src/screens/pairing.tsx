import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Linking, Share, Text, View } from 'react-native';
import { Scene } from '../art';
import { TOPICS } from '../data';
import { compared, other, questionList, useApp } from '../store';
import { color, font } from '../theme';
import { Body, CardLabel, CardText, Chip, CounterPill, Field, H2, IconButton, Label, PillButton, Screen, Small, TextLink, TopicToggle, TornCard } from '../ui';

const apart = (label: string) => <Scene he="nervous" she="nervous" label={label} />;

export function Pair() {
  const { s, a, route, back, go } = useApp();
  const [mode, setMode] = useState<'choose' | 'enter'>(route?.name === 'enterCode' ? 'enter' : 'choose');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);
  const mine = s.pair?.status === 'pending' && s.pair.userA === s.me && !s.pair.userB ? s.pair : undefined;

  if (mine) {
    const msg = `I'd like us to try Unsaid before we next meet. Download it and enter my code: ${mine.code}`;
    const share = () => Linking.openURL(`whatsapp://send?text=${encodeURIComponent(msg)}`).catch(() => Share.share({ message: msg }).catch(() => {}));
    return (
      <Screen right={<IconButton icon="gear" label="Settings" onPress={() => go({ name: 'settings' })} />}>
        <Label>Pair with them</Label>
        <H2>Send them your code.</H2>
        <TornCard tilt={-1.5} seed={7} style={{ alignItems: 'center', paddingVertical: 26 }}>
          <CardLabel>Your invite code</CardLabel>
          <Text accessibilityLabel={`Invite code ${mine.code.split('').join(' ')}`}
            style={{ fontFamily: font.g700, fontSize: 46, letterSpacing: 8, color: color.ink, fontVariant: ['tabular-nums'] }}>{mine.code}</Text>
        </TornCard>
        <PillButton label="Share on WhatsApp" onPress={share} />
        <PillButton variant="outlineLight" label={copied ? 'Copied' : 'Copy code'} onPress={() => Clipboard.setStringAsync(mine.code).then(() => setCopied(true))} />
        <View style={{ marginTop: 10, gap: 6 }}>
          <Body style={{ textAlign: 'center' }}>Waiting for them to join</Body>
          {apart('Two people sit apart on a bench at a chai stall, waiting.')}
        </View>
      </Screen>
    );
  }

  if (mode === 'enter') {
    const join = () => {
      if (!a.joinPair(code.trim(), s)) setErr("We couldn't find that code. Check it with them and try again.");
    };
    return (
      <Screen onBack={() => { setErr(''); route ? back() : setMode('choose'); }} footer={<PillButton label="Join" onPress={join} disabled={code.length < 6} />}>
        <Label>Pair with them</Label>
        <H2>Enter their code.</H2>
        <Body c={color.mist}>It's the 6-character code they shared with you.</Body>
        <Field label="Invite code" value={code} onChange={t => { setErr(''); setCode(t.toUpperCase().replace(/[^A-Z0-9]/g, '')); }}
          autoCapitalize="characters" maxLength={6} error={err} placeholder="ABC123" />
      </Screen>
    );
  }

  const theirs = s.pair?.status === 'pending' && s.pair.userA !== s.me;
  return (
    <Screen right={<IconButton icon="gear" label="Settings" onPress={() => go({ name: 'settings' })} />} footer={<>
      <PillButton label="Create an invite" onPress={() => theirs ? setErr('They already made an invite. Enter their code instead.') : a.createPair()} />
      <PillButton variant="outlineLight" label="Enter their code" onPress={() => { setErr(''); setMode('enter'); }} />
      {err ? <Small c={color.paper} style={{ textAlign: 'center' }}>{err}</Small> : null}
    </>}>
      <Label>Pair with them</Label>
      <H2>Unsaid works in pairs.</H2>
      <Body c={color.mist}>One of you makes an invite. The other enters the code. It's just the two of you, and either of you can unpair at any time.</Body>
      {apart('Two people sit apart on a bench at a chai stall.')}
    </Screen>
  );
}

export function Confirm() {
  const { s, a } = useApp();
  const them = s.users[other(s.me)];
  const done = s.pair!.confirmed.includes(s.me);
  return (
    <Screen footer={done ? undefined : <>
      <PillButton label="Yes, this is them" onPress={() => a.confirmPair(true)} />
      <PillButton variant="outlineLight" label="No, that's not them" onPress={() => a.confirmPair(false)} />
    </>}>
      <Label>Check before you start</Label>
      <H2>{done ? 'Waiting for them to confirm.' : 'Is this the person you are getting to know?'}</H2>
      <TornCard tilt={1.5} seed={9} style={{ alignItems: 'center', paddingVertical: 24 }}>
        <CardLabel>Paired with</CardLabel>
        <Text style={{ fontFamily: font.g700, fontSize: 38, letterSpacing: -1.4, color: color.ink }}>{them?.displayName}</Text>
      </TornCard>
      <Small>Only confirm if you know them. Pairing is one to one.</Small>
      {apart('Two people sit apart on a bench, about to begin.')}
    </Screen>
  );
}

export function Topics({ editing }: { editing?: boolean }) {
  const { s, a, back } = useApp();
  const [on, setOn] = useState<string[]>(s.consent[s.me] ?? TOPICS.filter(t => t.level !== 'sensitive').map(t => t.id));
  const flip = (id: string) => setOn(on.includes(id) ? on.filter(x => x !== id) : [...on, id]);
  return (
    <Screen onBack={editing ? back : undefined} footer={<PillButton label="Save my topics" onPress={() => a.setConsent(on)} disabled={!on.length} />}>
      <Label>Choose topics</Label>
      <H2>What are you ready to talk about?</H2>
      <Body c={color.mist}>Only topics you both choose are compared. You can add more later.</Body>
      <View>{TOPICS.map(t => <TopicToggle key={t.id} topic={t} on={on.includes(t.id)} onToggle={() => flip(t.id)} />)}</View>
      <Small>Sensitive topics start off. Nothing on them is asked or compared unless you both turn them on.</Small>
    </Screen>
  );
}

export function TopicsWait() {
  const { go } = useApp();
  return (
    <Screen center>
      <H2 style={{ textAlign: 'center' }}>Waiting for them to choose topics.</H2>
      <Body c={color.mist} style={{ textAlign: 'center' }}>You'll only see the topics you both picked.</Body>
      {apart('Two people sit apart on a bench, each deciding.')}
      <TextLink label="Change my topics" onPress={() => go({ name: 'topics' })} />
    </Screen>
  );
}

export function Intro() {
  const { s, a, go } = useApp();
  const ids = compared(s);
  const cmp = ids.filter(id => TOPICS.find(t => t.id === id)!.compare);
  const first = questionList(s, s.me)[0];
  if (!first) {
    return (
      <Screen center>
        <H2>You haven't picked any of the same topics yet.</H2>
        <Body c={color.mist}>Try adding one or two light ones, like Family or Money.</Body>
        <PillButton label="Change my topics" onPress={() => go({ name: 'topics' })} />
      </Screen>
    );
  }
  return (
    <Screen footer={<PillButton label="Start the questions" onPress={() => a.start(first.id)} />}>
      <Label>Ready when you are</Label>
      <H2>You're comparing {cmp.length} {cmp.length === 1 ? 'topic' : 'topics'}.</H2>
      <CounterPill n={questionList(s, s.me).length} label="questions for you" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {cmp.map(id => <Chip key={id} label={TOPICS.find(t => t.id === id)!.name} />)}
      </View>
      {ids.includes('trauma') && <Small>Trauma & the past is never compared. It's only there to help you share, when you're ready.</Small>}
      <TornCard tilt={-1.5} seed={31} variant="ink">
        <CardLabel variant="ink">Before you start</CardLabel>
        <CardText variant="ink">About 15 minutes. Answer alone, somewhere private. It saves as you go, so you can stop and come back.</CardText>
      </TornCard>
      <TextLink label="Change my topics" onPress={() => go({ name: 'topics' })} />
    </Screen>
  );
}

export function Ended() {
  const { a } = useApp();
  return (
    <Screen center footer={<PillButton label="Start a new pair" onPress={a.clearEnded} />}>
      <H2>Your pair has ended.</H2>
      <Body c={color.mist}>The shared chart has been removed. Your account is still here if you want it.</Body>
    </Screen>
  );
}
