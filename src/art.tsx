// Illustration + the motion budget (spec 7.4, 7.6). Nothing outside this file animates, except chart bars.
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, Text, View, useWindowDimensions } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { color, font, motion, stripTilt, type } from './theme';

export const native = Platform.OS !== 'web';

export function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setR).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setR);
    return () => sub.remove();
  }, []);
  return r;
}

const run = (v: Animated.Value, toValue: number, duration: number, easing = Easing.inOut(Easing.quad)) =>
  new Promise<void>(res => Animated.timing(v, { toValue, duration, easing, useNativeDriver: native }).start(() => res()));
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

// ---------- torn paper ----------

function rand(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// A ragged outline around a w×h box, offset by `pad`. Stands in for the web's dilate + displacement filter.
export function ragged(w: number, h: number, pad: number, seed = 1) {
  const r = rand(seed), step = 7, o = pad + 3, j = () => pad * (0.35 + r() * 0.9);
  const pts: [number, number][] = [];
  for (let x = 0; x < w; x += step) pts.push([o + x, o - j()]);
  for (let y = 0; y < h; y += step) pts.push([o + w + j(), o + y]);
  for (let x = w; x > 0; x -= step) pts.push([o + x, o + h + j()]);
  for (let y = h; y > 0; y -= step) pts.push([o - j(), o + y]);
  return 'M' + pts.map(p => p.map(n => n.toFixed(1)).join(' ')).join('L') + 'Z';
}

export function Torn({ children, style, outer, tilt = 0, seed = 1, rim = 4 }: {
  children: React.ReactNode; style?: StyleProp<ViewStyle>; outer?: StyleProp<ViewStyle>; tilt?: number; seed?: number; rim?: number;
}) {
  const [sz, setSz] = useState<{ w: number; h: number } | null>(null);
  return (
    <View style={[outer, tilt ? { transform: [{ rotate: `${tilt}deg` }] } : null]}
      onLayout={e => setSz({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {sz && (
        <Svg pointerEvents="none" style={{ position: 'absolute', left: -rim - 3, top: -rim - 3 }} width={sz.w + 2 * rim + 6} height={sz.h + 2 * rim + 6}>
          <Path d={ragged(sz.w, sz.h, rim, seed)} fill={color.rim} />
        </Svg>
      )}
      <View style={style}>{children}</View>
    </View>
  );
}

// ---------- wordmark ----------

export function Wordmark({ size = 20 }: { size?: number }) {
  const ls = -0.065 * size;
  if (size < 40) {
    return <Text accessibilityRole="header" style={{ fontFamily: font.g700, fontSize: size, letterSpacing: ls, color: color.paper }}>Unsaid</Text>;
  }
  const w = size * 3.3, h = size * 1.25, rimW = size * 0.12;
  const t = (dx: number, dy: number, rim: boolean) => (
    <SvgText key={`${dx}${dy}${rim}`} x={w / 2 + dx} y={size * 0.95 + dy} textAnchor="middle" fontFamily={font.g700} fontSize={size}
      letterSpacing={ls} fill={rim ? color.rim : color.paper} stroke={rim ? color.rim : 'none'} strokeWidth={rim ? rimW : 0} strokeLinejoin="round">
      Unsaid
    </SvgText>
  );
  return (
    <View accessible accessibilityRole="header" accessibilityLabel="Unsaid">
      <Svg width={w} height={h}>
        {t(-1.5, 1, true)}{t(1.5, -1.2, true)}{t(0.5, 1.8, true)}{t(-0.8, -1.6, true)}
        {t(0, 0, false)}
      </Svg>
    </View>
  );
}

// ---------- strip title ----------

export function StripTitle({ lines, size = 30, align = 'flex-start' }: { lines: string[]; size?: number; align?: 'flex-start' | 'center' }) {
  return (
    <View accessible accessibilityRole="header" accessibilityLabel={lines.join(' ')} style={{ alignItems: align, gap: 6 }}>
      {lines.map((l, i) => (
        <Torn key={i} seed={i + 11} rim={3} tilt={stripTilt[i % 2]} style={{ backgroundColor: color.ink, paddingHorizontal: 12, paddingVertical: 4 }}>
          <Text style={{ fontFamily: font.g700, fontSize: size, letterSpacing: -0.035 * size, color: color.marigold, lineHeight: size * 1.1 }}>{l}</Text>
        </Torn>
      ))}
    </View>
  );
}

// ---------- figures ----------

export type Mood = 'nervous' | 'happy' | 'relaxed' | 'thinking';
const SW = 2.4;

function Face({ mood, lookX, sweat }: { mood: Mood; lookX: number; sweat?: boolean }) {
  const eye = (x: number) =>
    mood === 'happy' || mood === 'relaxed'
      ? <Path d={`M${x - 3.5} 1 L${x} -3 L${x + 3.5} 1`} stroke={color.ink} strokeWidth={SW} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      : <Circle cx={x + lookX} cy={mood === 'thinking' ? -3 : -1} r={2.3} fill={color.ink} />;
  return (
    <G>
      {eye(-8)}{eye(8)}
      {mood === 'nervous' && <>
        <Path d="M-13 -8 L-5 -11" stroke={color.ink} strokeWidth={2} strokeLinecap="round" />
        <Path d="M5 -11 L13 -8" stroke={color.ink} strokeWidth={2} strokeLinecap="round" />
        <Path d="M-6 10 Q-3 7.5 0 10 Q3 12.5 6 10" stroke={color.ink} strokeWidth={2} fill="none" strokeLinecap="round" />
      </>}
      {mood === 'happy' && <Path d="M-7 6 Q0 16 7 6 Z" fill={color.ink} stroke={color.ink} strokeWidth={1.5} strokeLinejoin="round" />}
      {mood === 'relaxed' && <Path d="M-5 8 Q0 12 5 8" stroke={color.ink} strokeWidth={2} fill="none" strokeLinecap="round" />}
      {mood === 'thinking' && <Path d="M-4 10 L4 9" stroke={color.ink} strokeWidth={2} strokeLinecap="round" />}
      {sweat && <Path d="M19 -10 Q15 -3 19 -1 Q23 -3 19 -10 Z" fill={color.cloud} stroke={color.ink} strokeWidth={1.5} />}
    </G>
  );
}

const KURTA = 'M-27 210 L-23 152 Q0 138 23 152 L27 210 Z';

function Body({ fill }: { fill: string }) {
  return (
    <G>
      <Rect x={-17} y={200} width={13} height={44} rx={5} fill={color.ink} />
      <Rect x={4} y={200} width={13} height={44} rx={5} fill={color.ink} />
      <Ellipse cx={-12} cy={246} rx={9} ry={4.5} fill={color.ink} />
      <Ellipse cx={12} cy={246} rx={9} ry={4.5} fill={color.ink} />
      <Rect x={-5} y={126} width={10} height={16} fill={color.paper} stroke={color.ink} strokeWidth={SW} />
      <Path d={KURTA} fill={fill} stroke={color.ink} strokeWidth={SW} strokeLinejoin="round" />
    </G>
  );
}

// He: rose kurta, head torn open at the top with thought fragments spilling out.
function He({ mood }: { mood: Mood }) {
  const tilt = mood === 'nervous' ? -8 : mood === 'happy' ? 5 : 0;
  const head = 'M-22 112 A22 22 0 0 0 22 112 L21 102 L15 97 L11 101 L5 92 L-1 99 L-7 91 L-12 98 L-18 95 L-21 104 Z';
  return (
    <G>
      <Path d={KURTA} fill={color.rim} stroke={color.rim} strokeWidth={9} strokeLinejoin="round" />
      <Body fill={color.rose} />
      <Path d="M-8 150 L-6 176" stroke={color.ink} strokeWidth={1.5} />
      {mood === 'nervous'
        ? <G>
            <Path d="M-19 154 Q-36 142 -17 124" stroke={color.ink} strokeWidth={12} fill="none" strokeLinecap="round" />
            <Path d="M-19 154 Q-36 142 -17 124" stroke={color.rose} strokeWidth={7} fill="none" strokeLinecap="round" />
          </G>
        : <G>
            <Path d="M-21 156 Q-30 180 -14 198" stroke={color.ink} strokeWidth={12} fill="none" strokeLinecap="round" />
            <Path d="M-21 156 Q-30 180 -14 198" stroke={color.rose} strokeWidth={7} fill="none" strokeLinecap="round" />
          </G>}
      <G transform={`rotate(${tilt} 0 126)`}>
        <Path d={head} fill={color.rim} stroke={color.rim} strokeWidth={9} strokeLinejoin="round" />
        <Path d={head} fill={color.paper} stroke={color.ink} strokeWidth={SW} strokeLinejoin="round" />
        {/* fragments spilling out of the tear */}
        <Path d="M-6 84 L0 80 L2 86 Z" fill={color.paper} stroke={color.ink} strokeWidth={1.4} />
        <Path d="M8 78 L14 76 L13 82 L8 82 Z" fill={color.cloud} stroke={color.ink} strokeWidth={1.4} />
        <Path d="M-14 74 L-9 72 L-10 77 Z" fill={color.paper} stroke={color.ink} strokeWidth={1.4} />
        <G transform="translate(0 114)"><Face mood={mood} lookX={mood === 'nervous' ? 3 : 0} sweat={mood === 'nervous'} /></G>
      </G>
      {mood === 'nervous' && <Circle cx={-17} cy={124} r={5} fill={color.paper} stroke={color.ink} strokeWidth={SW} />}
    </G>
  );
}

// She: wine kurta and dupatta, smooth rounded hair, centre parting, long hair behind the shoulders.
function She({ mood }: { mood: Mood }) {
  const tilt = mood === 'nervous' ? 8 : mood === 'happy' ? -5 : 0;
  return (
    <G>
      <Path d={KURTA} fill={color.rim} stroke={color.rim} strokeWidth={9} strokeLinejoin="round" />
      <G transform={`rotate(${tilt} 0 126)`}>
        <Path d="M-25 112 Q-27 84 0 85 Q27 84 25 112 L30 172 Q0 180 -30 172 Z" fill={color.rim} stroke={color.rim} strokeWidth={8} />
        <Path d="M-25 112 Q-27 84 0 85 Q27 84 25 112 L30 172 Q0 180 -30 172 Z" fill={color.ink} />
      </G>
      <Body fill={color.wine} />
      <Path d="M-23 152 Q0 166 26 204 L27 210 L19 210 Q-2 176 -25 164 Z" fill={color.wine} stroke={color.ink} strokeWidth={SW} strokeLinejoin="round" />
      <Path d="M-22 157 Q0 170 22 205" stroke={color.paper} strokeWidth={1.2} strokeDasharray="2 3" fill="none" />
      <G transform={`rotate(${tilt} 0 126)`}>
        <Circle cx={0} cy={114} r={21} fill={color.paper} stroke={color.ink} strokeWidth={SW} />
        <Path d="M-22.5 113 Q-24 88 0 88 Q24 88 22.5 113 Q19 99 2 99 L0 93 L-2 99 Q-19 99 -22.5 113 Z" fill={color.ink} />
        <G transform="translate(0 116)"><Face mood={mood} lookX={mood === 'nervous' ? -3 : 0} /></G>
      </G>
    </G>
  );
}

// ---------- scene ----------

const VB = { x: 0, y: -70, w: 360, h: 330 };
export const SCENE_ASPECT = VB.w / VB.h;

function Stall() {
  const stripes = Array.from({ length: 12 }, (_, i) => i);
  return (
    <G>
      <Rect x={22} y={40} width={316} height={130} fill={color.ground2} stroke={color.ink} strokeWidth={SW} />
      {stripes.map(i => (
        <Path key={i} d={`M${22 + i * 26.3} 18 h26.3 v26 a13.15 13.15 0 0 1 -26.3 0 Z`}
          fill={i % 2 ? color.paper : color.rose} stroke={color.ink} strokeWidth={1.6} />
      ))}
      <Rect x={16} y={12} width={328} height={8} fill={color.ink} />
      {/* shelf: jars and glasses */}
      <Rect x={70} y={96} width={220} height={5} fill={color.wood[1]} />
      {[86, 112, 138].map((x, i) => (
        <G key={x}>
          <Rect x={x} y={70} width={20} height={26} rx={3} fill={color.cloud} opacity={0.55} stroke={color.ink} strokeWidth={1.6} />
          <Rect x={x - 1} y={66} width={22} height={6} rx={2} fill={i === 1 ? color.wine : color.rose} stroke={color.ink} strokeWidth={1.4} />
        </G>
      ))}
      {[196, 212, 228, 244].map(x => <Path key={x} d={`M${x} 80 h12 l-2 16 h-8 Z`} fill={color.cloud} opacity={0.6} stroke={color.ink} strokeWidth={1.4} />)}
      {/* counter + kettle */}
      <Rect x={22} y={150} width={316} height={22} fill={color.wood[1]} stroke={color.ink} strokeWidth={SW} />
      <Rect x={22} y={146} width={316} height={6} fill={color.wood[0]} stroke={color.ink} strokeWidth={1.6} />
      <G>
        <Path d="M282 146 Q282 118 300 118 Q318 118 318 146 Z" fill={color.mist} stroke={color.ink} strokeWidth={SW} />
        <Path d="M283 130 L268 120" stroke={color.ink} strokeWidth={5} strokeLinecap="round" />
        <Path d="M316 126 Q330 130 316 142" stroke={color.ink} strokeWidth={3} fill="none" />
        <Circle cx={300} cy={115} r={4} fill={color.ink} />
      </G>
      {/* CHAI ₹10 board, far left */}
      <G transform="rotate(-4 30 100)">
        <Rect x={2} y={78} width={54} height={42} fill={color.ink} stroke={color.rim} strokeWidth={2} />
        <SvgText x={29} y={96} textAnchor="middle" fontFamily={font.g700} fontSize={13} fill={color.paper}>CHAI</SvgText>
        <SvgText x={29} y={113} textAnchor="middle" fontFamily={font.g700} fontSize={13} fill={color.marigold}>₹10</SvgText>
      </G>
    </G>
  );
}

function Bench({ steam }: { steam: boolean }) {
  return (
    <G>
      <Rect x={60} y={214} width={8} height={40} fill={color.wood[2]} stroke={color.ink} strokeWidth={1.8} />
      <Rect x={292} y={214} width={8} height={40} fill={color.wood[2]} stroke={color.ink} strokeWidth={1.8} />
      <Rect x={40} y={204} width={280} height={12} rx={2} fill={color.wood[0]} stroke={color.ink} strokeWidth={SW} />
      <Rect x={48} y={216} width={264} height={6} fill={color.wood[3]} stroke={color.ink} strokeWidth={1.6} />
      {[172, 190].map(x => (
        <G key={x}>
          <Path d={`M${x - 6} 190 h12 l-2 14 h-8 Z`} fill={color.kulhad} stroke={color.ink} strokeWidth={1.8} strokeLinejoin="round" />
          <Ellipse cx={x} cy={190} rx={6} ry={2} fill={color.chai} stroke={color.ink} strokeWidth={1.2} />
          {steam && <Path d={`M${x} 184 q-3 -5 0 -10 q3 -5 0 -10`} stroke={color.paper} strokeWidth={1.6} fill="none" opacity={0.7} strokeLinecap="round" />}
        </G>
      ))}
    </G>
  );
}

const APART = { he: 96, she: 264 }, TOGETHER = { he: 140, she: 220 };

export interface SceneProps {
  he: Mood; she: Mood;
  together?: Animated.Value | number; // 0 apart, 1 together
  clouds?: [string | null, string | null]; // trail-off lines for he / she
  label: string;
  style?: StyleProp<ViewStyle>;
}

export function Scene({ he, she, together = 0, clouds, label, style }: SceneProps) {
  const [w, setW] = useState(0);
  const k = w / VB.w;
  const t = typeof together === 'number' ? new Animated.Value(together) : together;
  const dips = useRef([new Animated.Value(0), new Animated.Value(0)]).current;
  const shift = (from: number, to: number) => t.interpolate({ inputRange: [0, 1], outputRange: [0, (to - from) * k] });
  const fig = (who: 'he' | 'she', i: number) => (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', inset: 0, transform: [
      { translateX: shift(APART[who], TOGETHER[who]) },
      { translateY: dips[i].interpolate({ inputRange: [0, 1], outputRange: [0, 4] }) },
    ] }}>
      <Svg width="100%" height="100%" viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}>
        <G transform={`translate(${APART[who]} 0)`}>{who === 'he' ? <He mood={he} /> : <She mood={she} />}</G>
      </Svg>
    </Animated.View>
  );
  const headY = (96 - VB.y) * k; // top of head, in px
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label}
      style={[{ width: '100%', aspectRatio: SCENE_ASPECT }, style]} onLayout={e => setW(e.nativeEvent.layout.width)}>
      <Svg width="100%" height="100%" viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} style={{ position: 'absolute' }}>
        <Stall /><Bench steam />
      </Svg>
      {w > 0 && <>
        {fig('he', 0)}{fig('she', 1)}
        {clouds?.[0] && <ThoughtCloud text={clouds[0]} delay={0} dip={dips[0]} side="left"
          style={{ position: 'absolute', left: 8, bottom: w / SCENE_ASPECT - headY + 12, width: w * 0.46 }} />}
        {clouds?.[1] && <ThoughtCloud text={clouds[1]} delay={motion.trail.stagger} dip={dips[1]} side="right"
          style={{ position: 'absolute', right: 8, bottom: w / SCENE_ASPECT - headY + 12, width: w * 0.46 }} />}
      </>}
    </View>
  );
}

// ---------- thought cloud (trail-off) ----------

export function ThoughtCloud({ text, delay, dip, side, style }: {
  text: string; delay: number; dip: Animated.Value; side: 'left' | 'right'; style: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(0);
  const dots = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const m = motion.trail;

  useEffect(() => {
    if (reduced) return;
    let alive = true;
    (async () => {
      await wait(delay);
      while (alive) {
        await run(dots, 1, m.dots);
        await run(scale, 1, m.cloudIn, Easing.out(Easing.back(1.4)));
        for (let i = 1; i <= text.length && alive; i++) {
          setN(i);
          const ch = text[i - 1];
          await wait(m.perChar + (ch === ' ' ? m.space : ch === ',' ? m.comma : 0));
        }
        await wait(m.hold); // hard stop on the em dash, no cursor
        await Promise.all([run(scale, 0, m.cloudOut), run(dots, 0, m.cloudOut)]);
        setN(0);
        await run(dip, 1, m.dip);
        await run(dip, 0, m.rise);
        await wait(m.pause);
      }
    })();
    return () => { alive = false; };
  }, [reduced, text]);

  useEffect(() => {
    if (reduced) return;
    const half = motion.bob[side === 'left' ? 0 : 1] / 2;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(bob, { toValue: 1, duration: half, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
      Animated.timing(bob, { toValue: 0, duration: half, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduced]);

  const shown = reduced ? text : text.slice(0, n);
  const dotStyle = (s: number, i: number) => ({
    width: s, height: s, borderRadius: s, backgroundColor: color.cloud, borderWidth: 1.5, borderColor: color.ink,
    opacity: reduced ? 1 : dots.interpolate({ inputRange: [i / 3, (i + 1) / 3], outputRange: [0, 1], extrapolate: 'clamp' }),
  });
  return (
    <Animated.View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={[style, {
      alignItems: side === 'left' ? 'flex-start' : 'flex-end',
      transform: [{ translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [-motion.bobPx / 2, motion.bobPx / 2] }) }],
    }]}>
      <Animated.View style={{
        backgroundColor: color.cloud, borderWidth: 2, borderColor: color.ink, borderRadius: 22,
        paddingHorizontal: 14, paddingVertical: 10, minHeight: 44, alignSelf: 'stretch',
        transformOrigin: side === 'left' ? 'bottom left' : 'bottom right',
        transform: [{ scale: reduced ? 1 : scale }],
      }}>
        {/* invisible full text reserves the size so the cloud never reflows while typing */}
        <Text style={[type.hand, { fontSize: 14, lineHeight: 19, color: 'transparent' }]}>{text}</Text>
        <Text style={[type.hand, { fontSize: 14, lineHeight: 19, color: color.ink, position: 'absolute', left: 14, right: 14, top: 10 }]}>{shown}</Text>
      </Animated.View>
      <View style={{ flexDirection: side === 'left' ? 'row' : 'row-reverse', alignItems: 'flex-end', gap: 4, marginTop: 4,
        marginHorizontal: side === 'left' ? '30%' : '30%' }}>
        <Animated.View style={dotStyle(10, 2)} />
        <Animated.View style={dotStyle(7, 1)} />
        <Animated.View style={dotStyle(5, 0)} />
      </View>
    </Animated.View>
  );
}

// ---------- bumblebee reveal ----------

export function BumblebeeReveal({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const together = useRef(new Animated.Value(0)).current;
  const t = useRef(new Animated.Value(0)).current;
  const line = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const [happy, setHappy] = useState(false);
  const [origin, setOrigin] = useState({ x: width / 2, y: height * 0.4 });

  useEffect(() => {
    let alive = true;
    (async () => {
      if (reduced) {
        await run(fade, 1, motion.reducedFade);
        line.setValue(1);
      } else {
        await wait(500);
        await run(together, 1, 900, Easing.inOut(Easing.cubic));
        setHappy(true);
        await wait(500);
        await run(t, 1, 2400, Easing.linear);
        await run(line, 1, 500, Easing.out(Easing.cubic));
      }
      await wait(1600);
      if (alive) onDone();
    })();
    return () => { alive = false; };
  }, [reduced]);

  const R = Math.hypot(Math.max(origin.x, width - origin.x), Math.max(origin.y, height - origin.y)) + 4;
  const rings = [color.ink, color.marigold, color.ink, color.marigold, color.ink, color.marigold];
  return (
    <View style={{ flex: 1, backgroundColor: color.ground, justifyContent: 'center', overflow: 'hidden' }}>
      <View onLayout={e => {
        const { y, width: w } = e.nativeEvent.layout;
        setOrigin({ x: width / 2, y: y + (w / SCENE_ASPECT) * ((112 - VB.y) / VB.h) });
      }}>
        <Scene he={happy ? 'happy' : 'nervous'} she={happy ? 'happy' : 'nervous'} together={together}
          label={happy ? 'The two of them sit together on the bench, smiling.' : 'The two of them sit apart on the bench, nervous.'} />
      </View>
      {!reduced && rings.map((c, i) => {
        const s = i * 0.06;
        return (
          <Animated.View key={i} pointerEvents="none" style={{
            position: 'absolute', left: origin.x - R, top: origin.y - R, width: 2 * R, height: 2 * R, borderRadius: R, backgroundColor: c,
            transform: [{ scale: t.interpolate({ inputRange: [s, s + 0.7], outputRange: [0, 1], extrapolate: 'clamp', easing: Easing.in(Easing.quad) }) }],
          }} />
        );
      })}
      {reduced && <Animated.View pointerEvents="none" style={{ position: 'absolute', inset: 0, backgroundColor: color.marigold, opacity: fade }} />}
      <Animated.View accessibilityLiveRegion="polite" style={{
        position: 'absolute', left: 0, right: 0, top: height * 0.42, alignItems: 'center',
        opacity: line, transform: [{ translateY: line.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
      }}>
        <StripTitle lines={['Your chart', 'is ready.']} size={40} align="center" />
      </Animated.View>
    </View>
  );
}
