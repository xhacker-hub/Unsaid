import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Wordmark } from '../art';
import { useApp } from '../store';
import { color, font, space, type } from '../theme';
import {
  Body, CardLabel, CardText, Field, H2, Icon, Label, PillButton, Row, Screen, Segmented, Small, Switch, TornCard,
} from '../ui';

export function Settings() {
  const { s, a, back, go } = useApp();
  const u = s.users[s.me]!;
  const [pin, setPin] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'unpair' | 'delete' | null>(null);
  const paired = s.pair && s.pair.status !== 'ended' && (s.pair.userA === s.me || s.pair.userB === s.me);

  return (
    <Screen onBack={back}>
      <Label>Settings</Label>
      <H2>Your privacy</H2>
      <View>
        <Row title="App lock" sub={u.settings.pin ? 'A 4-digit PIN is asked when you open Unsaid.' : 'Ask for a PIN when you open Unsaid.'}
          right={<Switch on={!!u.settings.pin || pin !== null} label="App lock"
            onChange={() => { if (u.settings.pin) a.setSettings({ pin: undefined }); else setPin(pin === null ? '' : null); }} />} />
        {pin !== null && !u.settings.pin && (
          <View style={{ gap: 10, paddingVertical: 12 }}>
            <Field label="Choose a 4-digit PIN" value={pin} onChange={t => setPin(t.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={4} />
            <PillButton label="Turn on app lock" disabled={pin.length !== 4} onPress={() => { a.setSettings({ pin }); setPin(null); }} />
          </View>
        )}
        <Row title="Notifications" sub={'They only ever say "You have an update in Unsaid". Never a question or a topic.'}
          right={<Switch on={u.settings.notify} onChange={() => a.setSettings({ notify: !u.settings.notify })} label="Notifications" />} />
        <Row title="Quick hide" sub="Tap the wordmark, or tap anywhere with two fingers, to switch to a plain notes screen. Hold its title to come back."
          right={<Switch on={u.settings.quickHide} onChange={() => a.setSettings({ quickHide: !u.settings.quickHide })} label="Quick hide with two fingers" />} />
      </View>

      <Label style={{ marginTop: 10 }}>Language</Label>
      <Segmented label="Language" value={u.settings.language} onChange={v => a.setSettings({ language: v })}
        items={[{ v: 'en', label: 'English' }, { v: 'hi', label: 'हिन्दी' }, { v: 'hinglish', label: 'Hinglish' }]} />
      {u.settings.language !== 'en' && <Small>Hindi and Hinglish are coming soon. For now, Unsaid is in English.</Small>}

      <View style={{ marginTop: 10 }}>
        {paired && <Row title="Choose topics" sub="Add more topics, or turn some off." onPress={() => go({ name: 'topics' })} />}
        <Row title="Help & support" sub="People you can talk to, any time." onPress={() => go({ name: 'help' })} />
        {paired && <Row title="Unpair" sub="Ends the pair and removes the shared chart for both of you." onPress={() => setConfirm('unpair')} />}
        <Row title="Delete everything" sub="Wipes your account and answers, including from their phone." onPress={() => setConfirm('delete')} />
      </View>

      {confirm && (
        <TornCard variant="ink" seed={5} tilt={-1}>
          <CardLabel variant="ink">{confirm === 'unpair' ? 'Unpair' : 'Delete everything'}</CardLabel>
          <CardText variant="ink" strong>{confirm === 'unpair' ? 'End this pair?' : 'Delete everything?'}</CardText>
          <CardText variant="ink">
            {confirm === 'unpair'
              ? 'Your shared chart is removed for both of you. They will only see "Your pair has ended."'
              : 'Your account and every answer are wiped, from this phone and theirs. This cannot be undone.'}
          </CardText>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
            <PillButton label="Keep it" variant="outlineLight" onPress={() => setConfirm(null)} style={{ flex: 1 }} />
            <PillButton label={confirm === 'unpair' ? 'Unpair' : 'Delete'} onPress={confirm === 'unpair' ? a.unpair : a.deleteEverything} style={{ flex: 1 }} />
          </View>
        </TornCard>
      )}
      <Small style={{ marginTop: 8 }}>No ads. Your answers are never sold. Signed in as {u.displayName}.</Small>
    </Screen>
  );
}

// [Confirm] every number with the founder before shipping.
const LINES = [
  { name: 'Tele-MANAS', number: '14416', note: 'Free national mental-health helpline from the Government of India. Any time, in many languages.' },
  { name: 'iCall', number: '9152987821', note: 'Free counselling by phone from TISS, Monday to Saturday.' },
];

export function Help() {
  const { back } = useApp();
  return (
    <Screen onBack={back}>
      <Label>Help & support</Label>
      <H2>You don't have to wait for the right moment.</H2>
      <Body c={color.mist}>If something here brought up a lot, these people can help. Calls are private.</Body>
      {LINES.map((l, i) => (
        <TornCard key={l.name} seed={i + 140} tilt={i ? 1.5 : -1.5}>
          <CardLabel>{l.name}</CardLabel>
          <Pressable onPress={() => Linking.openURL(`tel:${l.number}`).catch(() => {})} accessibilityRole="button" accessibilityLabel={`Call ${l.name}, ${l.number}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}>
            <Icon name="phone" c={color.ink} />
            <Text style={{ fontFamily: font.g700, fontSize: 28, color: color.ink, fontVariant: ['tabular-nums'] }}>{l.number}</Text>
          </Pressable>
          <CardText>{l.note}</CardText>
        </TornCard>
      ))}
      <TornCard variant="ink" seed={150}>
        <CardLabel variant="ink">Talk to a counsellor</CardLabel>
        <CardText variant="ink">Coming soon. We're working with counsellors to offer sessions for couples.</CardText>
      </TornCard>
    </Screen>
  );
}

export function Lock({ pin, onUnlock }: { pin: string; onUnlock: () => void }) {
  const [v, setV] = useState('');
  const [err, setErr] = useState(false);
  const press = (k: string) => {
    const next = k === 'del' ? v.slice(0, -1) : (v + k).slice(0, 4);
    setErr(false);
    setV(next);
    if (next.length === 4) { if (next === pin) onUnlock(); else { setErr(true); setV(''); } }
  };
  return (
    <View style={{ flex: 1, backgroundColor: color.ground, alignItems: 'center', justifyContent: 'center', gap: 20, padding: space.gutter }}>
      <Wordmark size={56} />
      <Body>{err ? "That PIN didn't work. Try again." : 'Enter your PIN'}</Body>
      <View accessibilityLabel={`${v.length} of 4 digits entered`} style={{ flexDirection: 'row', gap: 14 }}>
        {[0, 1, 2, 3].map(i => <View key={i} style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: color.paper, backgroundColor: i < v.length ? color.paper : 'transparent' }} />)}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 3 * 76, gap: 0 }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((k, i) => (
          <Pressable key={i} disabled={!k} onPress={() => press(k)} accessibilityRole="button" accessibilityLabel={k === 'del' ? 'Delete' : k}
            style={({ pressed }) => ({ width: 76, height: 64, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
            <Text style={{ fontFamily: font.g600, fontSize: k === 'del' ? 15 : 26, color: color.paper }}>{k === 'del' ? 'Delete' : k}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// The quick-hide screen: deliberately plain. Hold the title to come back.
export function Neutral({ onReturn }: { onReturn: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: color.cloud, padding: space.gutter, paddingTop: 30, gap: 16 }}>
      <Pressable onLongPress={onReturn} delayLongPress={900} accessibilityRole="header" accessibilityHint="Hold to go back">
        <Text style={[type.h2, { color: color.ink }]}>Notes</Text>
      </Pressable>
      <View style={{ borderTopWidth: 1, borderColor: color.ink, opacity: 0.15 }} />
      <Text style={[type.body, { color: color.ink, opacity: 0.6 }]}>No notes yet.</Text>
    </View>
  );
}
