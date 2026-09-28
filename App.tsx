import { FamiljenGrotesk_400Regular, FamiljenGrotesk_500Medium, FamiljenGrotesk_600SemiBold, FamiljenGrotesk_700Bold } from '@expo-google-fonts/familjen-grotesk';
import { ShantellSans_400Regular, ShantellSans_500Medium } from '@expo-google-fonts/shantell-sans';
import { enableAppSwitcherProtectionAsync } from 'expo-screen-capture';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Store, other, stage, useApp } from './src/store';
import { color, font, space } from './src/theme';
import { Shimmer } from './src/ui';
import { HowItWorks, Privacy, SignUp, Welcome } from './src/screens/onboarding';
import { Confirm, Ended, Intro, Pair, Topics, TopicsWait } from './src/screens/pairing';
import { Question, Waiting } from './src/screens/questionnaire';
import { Ask, Chart, NextChai, Reveal, TopicDetail } from './src/screens/results';
import { Help, Lock, Neutral, Settings } from './src/screens/settings';

export default function App() {
  const [fonts] = useFonts({
    FamiljenGrotesk_400Regular, FamiljenGrotesk_500Medium, FamiljenGrotesk_600SemiBold, FamiljenGrotesk_700Bold,
    ShantellSans_400Regular, ShantellSans_500Medium,
  });
  useEffect(() => {
    // iOS: blur the app in the app switcher. Android uses FLAG_SECURE per sensitive screen (useSecure).
    if (Platform.OS === 'ios') enableAppSwitcherProtectionAsync().catch(() => {});
  }, []);
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: color.ground }}>
        {fonts ? <Store><Shell /></Store> : <View style={{ padding: space.gutter, paddingTop: 80 }}><Shimmer /></View>}
      </View>
    </SafeAreaProvider>
  );
}

function Shell() {
  const { s, a } = useApp();
  const me = s.users[s.me];
  const pin = me?.settings.pin;
  const [unlocked, setUnlocked] = useState<string | null>(null); // which user unlocked this session
  useEffect(() => {
    const sub = AppState.addEventListener('change', st => { if (st === 'background') setUnlocked(null); });
    return () => sub.remove();
  }, []);
  const locked = !!pin && unlocked !== s.me;

  return (
    <View style={{ flex: 1 }} onTouchStart={e => { if (e.nativeEvent.touches.length >= 2 && me?.settings.quickHide && !s.hidden) a.hide(); }}>
      <DemoBar />
      {s.notice[s.me] && me?.settings.notify && !locked && !s.hidden && (
        <Pressable onPress={a.dismissNotice} accessibilityRole="button" accessibilityHint="Dismiss"
          style={{ margin: 8, marginBottom: 0, backgroundColor: color.cloud, borderRadius: 14, borderWidth: 2, borderColor: color.ink, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Text style={{ fontFamily: font.g700, color: color.ink, fontSize: 13 }}>Unsaid</Text>
          <Text style={{ fontFamily: font.g400, color: color.ink, fontSize: 14, flex: 1 }}>You have an update in Unsaid</Text>
        </Pressable>
      )}
      <View style={{ flex: 1 }}>
        {s.hidden
          ? <Neutral onReturn={() => { setUnlocked(null); a.unhide(); }} />
          : locked
            ? <Lock pin={pin!} onUnlock={() => setUnlocked(s.me)} />
            : <Router />}
      </View>
    </View>
  );
}

function Router() {
  const { s, route } = useApp();
  const st = stage(s);
  if (st === 'ended') return <Ended />;
  if (route) {
    switch (route.name) {
      case 'welcome': return <Welcome />;
      case 'how': return <HowItWorks invite={route.invite} />;
      case 'privacy': return <Privacy invite={route.invite} />;
      case 'signup': return <SignUp invite={route.invite} />;
      case 'enterCode': return <Pair />;
      case 'topics': return <Topics editing />;
      case 'topicDetail': return <TopicDetail topicId={route.topicId} />;
      case 'edit': return <Question key={route.qid} qid={route.qid} edit />;
      case 'ask': return <Ask />;
      case 'chai': return <NextChai />;
      case 'settings': return <Settings />;
      case 'help': return <Help />;
    }
  }
  switch (st) {
    case 'onboarding': return <Welcome />;
    case 'pair': return <Pair />;
    case 'confirm': return <Confirm />;
    case 'topics': return <Topics />;
    case 'topicsWait': return <TopicsWait />;
    case 'intro': return <Intro />;
    case 'question': return <Question key={s.cursor[s.me]} qid={s.cursor[s.me]!} />;
    case 'waiting': return <Waiting />;
    case 'reveal': return <Reveal />;
    case 'chart': return <Chart />;
  }
}

// Prototype only: drive both partners from one device.
function DemoBar() {
  const { s, a } = useApp();
  const ins = useSafeAreaInsets();
  const [more, setMore] = useState(false);
  const name = (u: 'a' | 'b') => s.users[u]?.displayName ?? (u === 'a' ? 'Partner A' : 'Partner B');
  const p = other(s.me);
  const btn = (label: string, onPress: () => void, on = false) => (
    <Pressable key={label} onPress={onPress} accessibilityRole="button"
      style={{ minHeight: 34, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1.5, borderColor: color.line, justifyContent: 'center', backgroundColor: on ? color.paper : 'transparent' }}>
      <Text style={{ fontFamily: font.g600, fontSize: 12.5, color: on ? color.ink : color.paper }}>{label}</Text>
    </Pressable>
  );
  const pStage = stage(s, p);
  return (
    <View style={{ backgroundColor: color.ink, paddingTop: ins.top + 6, paddingBottom: 8, paddingHorizontal: 10, gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <Text style={{ fontFamily: font.g600, fontSize: 10.5, letterSpacing: 1.2, color: color.mist }}>DEMO</Text>
        {btn(`You · ${name(s.me)}`, () => {}, true)}
        {btn(`Switch to ${name(p)}`, a.switchUser)}
        {btn(more ? 'Less' : 'More', () => setMore(!more))}
      </View>
      {more && (
        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: font.g400, fontSize: 12, color: color.mist }}>
            {name(p)} is at: {pStage}{s.pair?.status === 'pending' ? `  ·  invite code ${s.pair.code}` : ''}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {btn(`Do ${name(p)}'s next step`, a.fillPartner)}
            {stage(s) === 'question' || stage(s) === 'intro' ? btn('Answer the rest for me', a.fillMe) : null}
            {btn(s.offline ? 'Go online' : 'Go offline', a.toggleOffline, s.offline)}
            {btn('Reset demo', a.reset)}
          </View>
        </View>
      )}
    </View>
  );
}
