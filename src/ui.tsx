// Component library (spec section 8). Illustrations and motion live in art.tsx.
import { useEffect, useRef, useState } from 'react';
import { preventScreenCaptureAsync, allowScreenCaptureAsync } from 'expo-screen-capture';
import { Animated, Easing, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Torn, Wordmark, native, useReducedMotion } from './art';
import type { Band, Option, Topic } from './scoring';
import { useApp } from './store';
import { color, font, inr, motion, radius, space, tilt as tilts, type } from './theme';

// Android FLAG_SECURE on sensitive screens. iOS uses app-switcher protection (see App.tsx).
export function useSecure(on = true) {
  useEffect(() => {
    if (Platform.OS !== 'android' || !on) return;
    preventScreenCaptureAsync('sensitive').catch(() => {});
    return () => { allowScreenCaptureAsync('sensitive').catch(() => {}); };
  }, [on]);
}

// ---------- text ----------

type TP = { children: React.ReactNode; style?: StyleProp<TextStyle>; c?: string };
export const Display = ({ children, style, c = color.paper }: TP) =>
  <Text accessibilityRole="header" maxFontSizeMultiplier={1.4} style={[type.display, { color: c }, style]}>{children}</Text>;
export const H2 = ({ children, style, c = color.paper }: TP) =>
  <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={[type.h2, { color: c }, style]}>{children}</Text>;
export const H3 = ({ children, style, c = color.paper }: TP) => <Text style={[type.h3, { color: c }, style]}>{children}</Text>;
export const Body = ({ children, style, c = color.paper }: TP) => <Text style={[type.body, { color: c }, style]}>{children}</Text>;
export const Small = ({ children, style, c = color.mist }: TP) => <Text style={[type.small, { color: c }, style]}>{children}</Text>;
export const Label = ({ children, style, c = color.mist }: TP) => <Text style={[type.label, { color: c }, style]}>{children}</Text>;

// ---------- icons (2px line) ----------

const ICONS = {
  back: 'M15 5 L8 12 L15 19',
  gear: 'M12 8.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7Z M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1',
  check: 'M5 12.5 L10 17 L19 7',
  close: 'M6 6 L18 18 M18 6 L6 18',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3 M5 11h14v10H5Z',
  phone: 'M6 3h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 4 5a2 2 0 0 1 2-2Z',
};
export function Icon({ name, c = color.paper, size = 22 }: { name: keyof typeof ICONS; c?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={ICONS[name]} stroke={c} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ---------- screen ----------

export function Screen({ children, bg = color.ground, onBack, right, footer, center, noHeader }: {
  children: React.ReactNode; bg?: string; onBack?: () => void; right?: React.ReactNode;
  footer?: React.ReactNode; center?: boolean; noHeader?: boolean;
}) {
  const { a, s } = useApp();
  const ins = useSafeAreaInsets();
  const ink = bg === color.marigold || bg === color.cloud;
  const fg = ink ? color.ink : color.paper;
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {s.offline && <Banner text="You're offline. Everything you do is saved on this phone and syncs when you're back." />}
      {!noHeader && (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, minHeight: 52 }}>
          <View style={{ width: 52 }}>
            {onBack && (
              <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}
                style={{ width: space.touch, height: space.touch, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="back" c={fg} />
              </Pressable>
            )}
          </View>
          <Pressable style={{ flex: 1, alignItems: 'center', minHeight: space.touch, justifyContent: 'center' }}
            onPress={a.hide} accessibilityRole="button" accessibilityLabel="Unsaid. Tap to hide the app quickly.">
            {ink
              ? <Text style={{ fontFamily: font.g700, fontSize: 20, letterSpacing: -1.3, color: color.ink }}>Unsaid</Text>
              : <Wordmark size={20} />}
          </Pressable>
          <View style={{ width: 52, alignItems: 'flex-end' }}>{right}</View>
        </View>
      )}
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{
        paddingHorizontal: space.gutter, paddingTop: 8, paddingBottom: footer ? 16 : 32 + ins.bottom, gap: space.gap,
        flexGrow: 1, justifyContent: center ? 'center' : 'flex-start',
      }}>
        {children}
      </ScrollView>
      {footer && <View style={{ paddingHorizontal: space.gutter, paddingTop: 10, paddingBottom: 14 + ins.bottom, gap: 10 }}>{footer}</View>}
    </View>
  );
}

export function IconButton({ icon, label, onPress, c = color.paper }: { icon: keyof typeof ICONS; label: string; onPress: () => void; c?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}
      style={{ width: space.touch, height: space.touch, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} c={c} />
    </Pressable>
  );
}

// ---------- cards ----------

export function TornCard({ variant = 'cream', tilt = 0, seed = 1, children, style }: {
  variant?: 'cream' | 'ink'; tilt?: number; seed?: number; children: React.ReactNode; style?: StyleProp<ViewStyle>;
}) {
  const cream = variant === 'cream';
  return (
    <Torn seed={seed} tilt={tilt} style={[{
      backgroundColor: cream ? color.cloud : color.ink, borderWidth: cream ? 2 : 0, borderColor: color.ink,
      borderRadius: radius.paper, padding: 18, gap: 8,
    }, style]}>
      {children}
    </Torn>
  );
}
export const cardTilt = (i: number) => tilts[i % tilts.length];

// Card text helpers so colours stay paired with their surface.
export const CardLabel = ({ children, variant = 'cream' }: { children: React.ReactNode; variant?: 'cream' | 'ink' }) =>
  <Label c={variant === 'cream' ? color.amberText : color.marigold}>{children}</Label>;
export const CardText = ({ children, variant = 'cream', strong }: { children: React.ReactNode; variant?: 'cream' | 'ink'; strong?: boolean }) =>
  <Text style={[strong ? type.h3 : type.body, { color: variant === 'cream' ? color.ink : color.cloud }]}>{children}</Text>;

// ---------- buttons ----------

type BV = 'primary' | 'ink' | 'outline' | 'outlineLight';
const BTN: Record<BV, { bg: string; fg: string; border: string }> = {
  primary: { bg: color.paper, fg: color.ink, border: color.paper }, // on maroon
  ink: { bg: color.ink, fg: color.cloud, border: color.ink }, // on light or marigold
  outline: { bg: 'transparent', fg: color.ink, border: color.ink }, // secondary on light
  outlineLight: { bg: 'transparent', fg: color.paper, border: color.paper }, // secondary on maroon
};
export function PillButton({ label, onPress, variant = 'primary', disabled, style, a11yHint }: {
  label: string; onPress: () => void; variant?: BV; disabled?: boolean; style?: StyleProp<ViewStyle>; a11yHint?: string;
}) {
  const v = BTN[variant];
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled }} accessibilityHint={a11yHint}
      style={({ pressed }) => [{
        minHeight: 50, borderRadius: radius.pill, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center',
        backgroundColor: v.bg, borderWidth: 2, borderColor: v.border, opacity: disabled ? 0.45 : 1,
        transform: [{ translateY: pressed ? -2 : 0 }],
      }, style]}>
      <Text style={{ fontFamily: font.g600, fontSize: 16.5, color: v.fg }}>{label}</Text>
    </Pressable>
  );
}

export function TextLink({ label, onPress, c = color.paper }: { label: string; onPress: () => void; c?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" style={{ minHeight: space.touch, justifyContent: 'center', alignSelf: 'center', paddingHorizontal: 8 }}>
      <Text style={{ fontFamily: font.g500, fontSize: 15.5, color: c, textDecorationLine: 'underline' }}>{label}</Text>
    </Pressable>
  );
}

// ---------- chips, toggles ----------

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : 'text'} accessibilityState={{ selected }}
      style={{ borderRadius: radius.pill, borderWidth: 1.5, borderColor: selected ? color.paper : color.line, backgroundColor: selected ? color.paper : 'transparent',
        paddingHorizontal: 14, minHeight: onPress ? space.touch : 32, justifyContent: 'center' }}>
      <Text style={{ fontFamily: font.g500, fontSize: 13, color: selected ? color.ink : color.paper }}>{label}</Text>
    </Pressable>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <Pressable onPress={onChange} accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: on }} hitSlop={8}
      style={{ width: 52, height: 30, borderRadius: radius.pill, borderWidth: 2, borderColor: on ? color.paper : color.line,
        backgroundColor: on ? color.paper : 'transparent', padding: 3, alignItems: on ? 'flex-end' : 'flex-start' }}>
      <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: on ? color.ink : color.mist }} />
    </Pressable>
  );
}

export function Row({ title, sub, right, onPress }: { title: string; sub?: string; right?: React.ReactNode; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 10, borderBottomWidth: 1, borderColor: color.line }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.bodyStrong, { color: color.paper }]}>{title}</Text>
        {sub ? <Small>{sub}</Small> : null}
      </View>
      {right}
    </Pressable>
  );
}

export function TopicToggle({ topic, on, onToggle }: { topic: Topic; on: boolean; onToggle: () => void }) {
  return (
    <Row title={topic.name} onPress={onToggle}
      right={<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {topic.level !== 'light' && (
          <View style={{ borderWidth: 1.5, borderColor: color.line, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Label style={{ fontSize: 10 }}>{topic.level === 'sensitive' ? 'Sensitive' : 'Personal'}</Label>
          </View>
        )}
        <Switch on={on} onChange={onToggle} label={`${topic.name}${topic.level === 'sensitive' ? ', sensitive' : ''}`} />
      </View>} />
  );
}

// ---------- question inputs ----------

export function OptionCard({ label, selected, multi, onPress }: { label: string; selected: boolean; multi?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole={multi ? 'checkbox' : 'radio'} accessibilityState={{ checked: selected }}
      style={({ pressed }) => ({
        minHeight: 52, borderRadius: radius.input, borderWidth: 2, borderColor: color.ink, paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: selected ? color.ink : color.cloud, flexDirection: 'row', alignItems: 'center', gap: 10,
        transform: [{ translateY: pressed ? -2 : 0 }],
      })}>
      {multi && (
        <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: selected ? color.cloud : color.ink, alignItems: 'center', justifyContent: 'center' }}>
          {selected && <Icon name="check" c={color.cloud} size={16} />}
        </View>
      )}
      <Text style={{ flex: 1, fontFamily: font.g500, fontSize: 16, color: selected ? color.cloud : color.ink }}>{label}</Text>
    </Pressable>
  );
}

export function ScaleSlider({ options, value, onChange }: { options: Option[]; value?: string; onChange: (id: string) => void }) {
  return (
    <View style={{ gap: 8 }}>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ position: 'absolute', left: 22, right: 22, height: 2, backgroundColor: color.ink }} />
        {options.map((o, i) => {
          const sel = o.id === value;
          return (
            <Pressable key={o.id} onPress={() => onChange(o.id)} accessibilityRole="radio" accessibilityState={{ checked: sel }}
              accessibilityLabel={`${o.label}, ${i + 1} of ${options.length}`}
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: sel ? 30 : 20, height: sel ? 30 : 20, borderRadius: 15, borderWidth: 2, borderColor: color.ink, backgroundColor: sel ? color.ink : color.cloud }} />
            </Pressable>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Small c={color.amberText}>{options[0].label}</Small>
        <Small c={color.amberText}>{options[options.length - 1].label}</Small>
      </View>
      {value && <Text style={[type.bodyStrong, { color: color.ink, textAlign: 'center' }]}>{options.find(o => o.id === value)?.label}</Text>}
    </View>
  );
}

export function Segmented<T extends string | number>({ items, value, onChange, label }: {
  items: { v: T; label: string }[]; value: T; onChange: (v: T) => void; label: string;
}) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: 'row', borderWidth: 2, borderColor: color.ink, borderRadius: radius.pill, overflow: 'hidden' }}>
      {items.map((it, i) => {
        const sel = it.v === value;
        return (
          <Pressable key={String(it.v)} onPress={() => onChange(it.v)} accessibilityRole="radio" accessibilityState={{ checked: sel }}
            style={{ flex: 1, minHeight: space.touch, alignItems: 'center', justifyContent: 'center', backgroundColor: sel ? color.ink : color.cloud,
              borderLeftWidth: i ? 2 : 0, borderColor: color.ink }}>
            <Text style={{ fontFamily: font.g600, fontSize: 14.5, color: sel ? color.cloud : color.ink }}>{it.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const ImportanceSelector = ({ value, onChange }: { value: 1 | 2 | 3; onChange: (v: 1 | 2 | 3) => void }) => (
  <View style={{ gap: 8 }}>
    <Label c={color.amberText}>How much does this matter to you?</Label>
    <Segmented label="How much does this matter to you?" value={value} onChange={onChange}
      items={[{ v: 1, label: 'Low' }, { v: 2, label: 'Medium' }, { v: 3, label: 'High' }]} />
  </View>
);

export function Checkbox({ checked, onChange, label, c = color.ink }: { checked: boolean; onChange: () => void; label: string; c?: string }) {
  return (
    <Pressable onPress={onChange} accessibilityRole="checkbox" accessibilityState={{ checked }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: space.touch }}>
      <View style={{ width: 24, height: 24, borderRadius: 5, borderWidth: 2, borderColor: c, backgroundColor: checked ? c : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
        {checked && <Icon name="check" size={18} c={c === color.ink ? color.cloud : color.ink} />}
      </View>
      <Text style={[type.body, { color: c, flex: 1 }]}>{label}</Text>
    </Pressable>
  );
}

export const DealbreakerToggle = ({ value, onChange }: { value: boolean; onChange: () => void }) =>
  <Checkbox checked={value} onChange={onChange} label="This is a dealbreaker for me" />;

// Dashed box that turns solid on focus. Its placeholder, in the hand face, types itself once.
export function PrivateNoteField({ value, onChange }: { value: string; onChange: (t: string) => void }) {
  const [open, setOpen] = useState(!!value);
  const [focus, setFocus] = useState(false);
  const reduced = useReducedMotion();
  const ph = "Just for me. What I haven't said yet is";
  const [n, setN] = useState(0);
  const typing = useRef(true);
  const caret = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!open || reduced) { setN(ph.length); return; }
    let i = 0;
    const id = setInterval(() => {
      if (!typing.current || i >= ph.length) { clearInterval(id); typing.current = false; setN(ph.length); return; }
      setN(++i);
    }, motion.trail.perChar + 10);
    const blink = Animated.loop(Animated.sequence([
      Animated.timing(caret, { toValue: 0, duration: 400, useNativeDriver: native, easing: Easing.step0 }),
      Animated.timing(caret, { toValue: 1, duration: 400, useNativeDriver: native, easing: Easing.step0 }),
    ]));
    blink.start();
    return () => { clearInterval(id); blink.stop(); };
  }, [open, reduced]);

  if (!open) {
    return (
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: space.touch }}>
        <Icon name="plus" c={color.ink} size={18} />
        <Text style={[type.bodyStrong, { color: color.ink }]}>Add a private note</Text>
      </Pressable>
    );
  }
  const stillTyping = n < ph.length && !focus && !reduced;
  return (
    <View style={{ gap: 6 }}>
      <Label c={color.amberText}>Private note</Label>
      <View style={{ borderWidth: 2, borderStyle: focus ? 'solid' : 'dashed', borderColor: color.ink, borderRadius: radius.input, backgroundColor: color.cloud, minHeight: 96 }}>
        {!value && (
          <View pointerEvents="none" style={{ position: 'absolute', left: 14, right: 14, top: 12, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
            <Text style={[type.hand, { color: color.ink, opacity: 0.5 }]}>{ph.slice(0, focus ? ph.length : n)}
              {stillTyping && <Animated.Text style={{ opacity: caret }}>{'|'}</Animated.Text>}
            </Text>
          </View>
        )}
        <TextInput value={value} onChangeText={onChange} multiline accessibilityLabel="Private note. Only you can see it unless you share it."
          onFocus={() => { typing.current = false; setFocus(true); }} onBlur={() => setFocus(false)}
          style={{ ...type.body, color: color.ink, padding: 14, paddingTop: 12, minHeight: 96, textAlignVertical: 'top' }} />
      </View>
      <Small c={color.amberText}>Only you see this. You can choose to share it later, one note at a time.</Small>
    </View>
  );
}

export function Field({ label, value, onChange, placeholder, keyboardType, maxLength, autoCapitalize, error, onLight = false }: {
  label: string; value: string; onChange: (t: string) => void; placeholder?: string; error?: string; onLight?: boolean;
  keyboardType?: 'phone-pad' | 'number-pad' | 'email-address' | 'default'; maxLength?: number; autoCapitalize?: 'none' | 'characters' | 'words';
}) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Label c={onLight ? color.amberText : color.mist}>{label}</Label>
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder} keyboardType={keyboardType} maxLength={maxLength}
        autoCapitalize={autoCapitalize} accessibilityLabel={label} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        placeholderTextColor={color.inkHalf}
        style={{ ...type.body, fontSize: 18, color: color.ink, backgroundColor: color.cloud, borderWidth: 2, borderColor: color.ink,
          borderStyle: focus ? 'solid' : 'dashed', borderRadius: radius.input, paddingHorizontal: 14, minHeight: 52 }} />
      {error ? <Text accessibilityLiveRegion="polite" style={[type.small, { color: onLight ? color.ink : color.paper }]}>{error}</Text> : null}
    </View>
  );
}

// ---------- progress, chart ----------

export function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      style={{ height: 12, borderRadius: radius.pill, borderWidth: 2, borderColor: color.ink, backgroundColor: color.cloud, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height: '100%', backgroundColor: color.ink }} />
    </View>
  );
}

export const BAND_LABEL: Record<Band, string> = {
  strong: 'Strong match', gaps: 'Some gaps', talk: 'Talk about this', notAnswered: 'Not answered yet', inPerson: 'Talk in person',
};

export function BandChip({ band, onLight }: { band: Band; onLight?: boolean }) {
  const s: Record<Band, ViewStyle & { fg: string }> = {
    talk: { backgroundColor: color.marigold, borderColor: color.ink, fg: color.ink },
    gaps: { backgroundColor: color.cloud, borderColor: color.ink, fg: color.ink },
    strong: { backgroundColor: color.ink, borderColor: onLight ? color.ink : color.paper, fg: color.marigold },
    inPerson: { backgroundColor: 'transparent', borderColor: onLight ? color.ink : color.paper, fg: onLight ? color.ink : color.paper },
    notAnswered: { backgroundColor: 'transparent', borderColor: onLight ? color.ink : color.mist, borderStyle: 'dashed', fg: onLight ? color.ink : color.mist },
  };
  const { fg, ...box } = s[band];
  return (
    <View style={[{ borderWidth: 1.5, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' }, box]}>
      <Text style={{ fontFamily: font.g600, fontSize: 12.5, color: fg }}>{BAND_LABEL[band]}</Text>
    </View>
  );
}

export function ChartBar({ name, band, value, tag, onPress, index }: {
  name: string; band: Band; value: number; tag?: string; onPress: () => void; index: number;
}) {
  const reduced = useReducedMotion();
  const grow = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(grow, { toValue: 1, duration: reduced ? 0 : motion.bar, delay: reduced ? 0 : index * 60, easing: Easing.out(Easing.cubic), useNativeDriver: native }).start();
  }, []);
  const fill = band === 'notAnswered' || band === 'inPerson' ? 0 : value;
  return (
    <Pressable onPress={onPress} accessibilityRole="button"
      accessibilityLabel={`${name}: ${BAND_LABEL[band].toLowerCase()}${tag ? `. ${tag}` : ''}`} accessibilityHint="Opens this topic"
      style={({ pressed }) => ({ gap: 8, paddingVertical: 12, borderBottomWidth: 1, borderColor: color.line, transform: [{ translateY: pressed ? -2 : 0 }] })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <Text style={[type.bodyStrong, { color: color.paper, flexShrink: 1 }]}>{name}</Text>
        <BandChip band={band} />
      </View>
      <View style={{ height: 16, borderRadius: radius.pill, borderWidth: 2, borderColor: color.ink, backgroundColor: color.cloud, overflow: 'hidden' }}>
        <Animated.View style={{ width: `${fill * 100}%`, height: '100%', backgroundColor: color.ink, transformOrigin: 'left', transform: [{ scaleX: grow }] }} />
      </View>
      {tag ? <Small c={color.mist}>{tag}</Small> : null}
    </Pressable>
  );
}

export function CounterPill({ n, label }: { n: number; label: string }) {
  return (
    <View accessibilityLabel={`${n} ${label}`} style={{ backgroundColor: color.marigold, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start', flexDirection: 'row', gap: 6 }}>
      <Text style={{ fontFamily: font.g700, fontSize: 14, color: color.ink, fontVariant: ['tabular-nums'] }}>{inr(n)}</Text>
      <Text style={{ fontFamily: font.g500, fontSize: 14, color: color.ink }}>{label}</Text>
    </View>
  );
}

// ---------- states ----------

export function Banner({ text, onClose }: { text: string; onClose?: () => void }) {
  return (
    <View accessibilityLiveRegion="polite" style={{ backgroundColor: color.ground2, borderBottomWidth: 1, borderColor: color.line, paddingHorizontal: space.gutter, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Small c={color.paper} style={{ flex: 1 }}>{text}</Small>
      {onClose && <IconButton icon="close" label="Dismiss" onPress={onClose} />}
    </View>
  );
}

// Loading: a simple paper shimmer.
export function Shimmer({ rows = 3 }: { rows?: number }) {
  const v = useRef(new Animated.Value(0.35)).current;
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    const l = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 0.7, duration: 700, useNativeDriver: native }),
      Animated.timing(v, { toValue: 0.35, duration: 700, useNativeDriver: native }),
    ]));
    l.start();
    return () => l.stop();
  }, [reduced]);
  return (
    <View accessibilityLabel="Loading" style={{ gap: 14 }}>
      {Array.from({ length: rows }, (_, i) => (
        <Animated.View key={i} style={{ height: i ? 70 : 34, width: i ? '100%' : '60%', backgroundColor: color.paper, opacity: v, borderRadius: radius.paper }} />
      ))}
    </View>
  );
}

export function Empty({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <TornCard tilt={-1.5} seed={42}>
      <CardText strong>{title}</CardText>
      <CardText>{body}</CardText>
      {children}
    </TornCard>
  );
}
