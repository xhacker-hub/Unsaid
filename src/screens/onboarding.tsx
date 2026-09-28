import { useState } from 'react';
import { View } from 'react-native';
import { Scene, StripTitle, Wordmark } from '../art';
import { SAMPLE_USERS } from '../data';
import { useApp } from '../store';
import { color } from '../theme';
import { Body, CardLabel, CardText, Checkbox, Field, H2, Label, PillButton, Screen, Small, TextLink, TornCard, cardTilt } from '../ui';

export function Welcome() {
  const { go } = useApp();
  return (
    <Screen noHeader center footer={<>
      <PillButton label="Get started" onPress={() => go({ name: 'how' })} />
      <TextLink label="I have an invite code" onPress={() => go({ name: 'how', invite: true })} />
    </>}>
      <View style={{ alignItems: 'center', gap: 6, marginTop: 12 }}>
        <Wordmark size={72} />
        <Body c={color.mist} style={{ textAlign: 'center' }}>Makes the hard questions easier to ask.</Body>
      </View>
      <Scene he="nervous" she="nervous"
        clouds={['Before we go further, I need you to know that—', 'I keep waiting for him to ask me something real, but—']}
        label="Two people sit apart on a bench at a roadside chai stall. Both look nervous, each thinking something they haven't said." />
    </Screen>
  );
}

const STEPS = [
  { n: '01', t: 'Answer privately', b: 'Each of you answers alone, in one sitting. About 15 minutes. Nobody sees anything until you both finish.' },
  { n: '02', t: 'See your chart', b: 'Topic by topic, see where you already agree and where you see things differently. No single number, and nothing to pass.' },
  { n: '03', t: 'Ask what matters', b: 'Get the exact questions to bring to your next meeting, worded so they are easy to say out loud.' },
];

export function HowItWorks({ invite }: { invite?: boolean }) {
  const { go, back } = useApp();
  return (
    <Screen bg={color.marigold} onBack={back} footer={<PillButton variant="ink" label="Next" onPress={() => go({ name: 'privacy', invite })} />}>
      <StripTitle lines={['How Unsaid', 'helps you ask.']} size={34} />
      <View style={{ gap: 14, marginTop: 10 }}>
        {STEPS.map((s, i) => {
          const v = i === 1 ? 'ink' : 'cream';
          return (
            <TornCard key={s.n} variant={v} tilt={cardTilt(i)} seed={i + 3} style={{ minHeight: 150 }}>
              <CardLabel variant={v}>{s.n}</CardLabel>
              <CardText variant={v} strong>{s.t}</CardText>
              <CardText variant={v}>{s.b}</CardText>
            </TornCard>
          );
        })}
      </View>
    </Screen>
  );
}

const PROMISES = [
  ['No profiles. No matching.', 'Unsaid is only for the two of you who are already getting to know each other.'],
  ['Nothing your families can see.', 'No family accounts, no reports, no way to share your chart outside the app.'],
  ["You decide what you're ready for.", 'Sensitive topics stay off unless you both turn them on. You choose what your partner sees.'],
  ['Skipping never reads as a no.', "Anything you skip shows as 'not answered yet'. It never counts against you."],
];

export function Privacy({ invite }: { invite?: boolean }) {
  const { go, back } = useApp();
  return (
    <Screen onBack={back} footer={<PillButton label="I understand" onPress={() => go({ name: 'signup', invite })} />}>
      <Label>Our promises</Label>
      <H2>Private by default.</H2>
      <View style={{ gap: 14, marginTop: 6 }}>
        {PROMISES.map(([t, b], i) => (
          <TornCard key={t} variant={i % 2 ? 'ink' : 'cream'} tilt={cardTilt(i) / 2} seed={i + 20}>
            <CardText variant={i % 2 ? 'ink' : 'cream'} strong>{t}</CardText>
            <CardText variant={i % 2 ? 'ink' : 'cream'}>{b}</CardText>
          </TornCard>
        ))}
      </View>
    </Screen>
  );
}

export function SignUp({ invite }: { invite?: boolean }) {
  const { s, a, back } = useApp();
  const [step, setStep] = useState<'phone' | 'otp' | 'name'>('phone');
  const [email, setEmail] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [adult, setAdult] = useState(false);
  const [err, setErr] = useState('');
  const sample = SAMPLE_USERS[s.me];

  const contactOk = email ? /^\S+@\S+\.\S+$/.test(phone) : phone.replace(/\D/g, '').length === 10;
  const submit = () => {
    setErr('');
    if (step === 'phone') {
      if (!contactOk) return setErr(email ? 'That email looks incomplete. Check it and try again.' : 'Enter your 10-digit mobile number.');
      return setStep('otp');
    }
    if (step === 'otp') {
      if (!/^\d{6}$/.test(otp)) return setErr('The code has 6 digits. Check your messages and try again.');
      return setStep('name');
    }
    if (!name.trim()) return setErr('Add a first name or nickname.');
    if (!adult) return setErr('Unsaid is only for people 18 and over.');
    a.signUp({ displayName: name.trim(), phone: email ? phone : `+91 ${phone}`, ageConfirmed: true }, invite);
  };
  const onBack = () => { setErr(''); step === 'phone' ? back() : setStep(step === 'otp' ? 'phone' : 'otp'); };

  return (
    <Screen onBack={onBack} footer={<PillButton label={step === 'name' ? 'Create my account' : 'Continue'} onPress={submit} />}>
      <Label>Sign up · {step === 'phone' ? '1' : step === 'otp' ? '2' : '3'} of 3</Label>
      {step === 'phone' && <>
        <H2>{email ? "What's your email?" : "What's your number?"}</H2>
        <Body c={color.mist}>We only use it to sign you in. No surname, no photo.</Body>
        <Field label={email ? 'Email' : 'Mobile number (+91)'} value={phone} onChange={setPhone} error={err}
          keyboardType={email ? 'email-address' : 'phone-pad'} autoCapitalize="none" maxLength={email ? 80 : 11}
          placeholder={email ? 'you@example.com' : sample.phone.replace('+91 ', '')} />
        <TextLink label={email ? 'Use my phone number instead' : 'Use email instead'} onPress={() => { setEmail(!email); setPhone(''); setErr(''); }} />
      </>}
      {step === 'otp' && <>
        <H2>Enter the code</H2>
        <Body c={color.mist}>We sent a 6-digit code to {email ? phone : `+91 ${phone}`}.</Body>
        <Field label="6-digit code" value={otp} onChange={t => setOtp(t.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={6} error={err} placeholder="000000" />
        <Small>Prototype: any 6 digits work.</Small>
      </>}
      {step === 'name' && <>
        <H2>What should your partner call you?</H2>
        <Field label="First name or nickname" value={name} onChange={setName} autoCapitalize="words" placeholder={sample.displayName} maxLength={30} />
        <Checkbox checked={adult} onChange={() => setAdult(!adult)} label="I'm 18 or older" c={color.paper} />
        {err ? <Body>{err}</Body> : null}
      </>}
    </Screen>
  );
}
