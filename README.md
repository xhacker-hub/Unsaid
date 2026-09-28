# Unsaid: prototype

A clickable prototype of Unsaid (Expo + React Native + TypeScript, Expo SDK 57). Two partners each answer a private questionnaire, then they both get a topic-by-topic chart and the questions to bring to their next meeting.

## Run it

```bash
npm install
npx expo start          # scan the QR code with Expo Go on iOS or Android
npx expo start --web    # quickest preview in a browser
npm test                # scoring unit tests (Node's built-in test runner)
npx tsc --noEmit        # typecheck
```

`expo-screen-capture` works in Expo Go. Nothing here needs a custom dev build.

## Clicking through the whole journey on one device

A **DEMO** bar at the top lets you drive both partners:

- **Switch to …** flips between the two users. Each one keeps their own place in the app.
- **More → Do [partner]'s next step** does whatever the other person needs to do next: sign up, join, confirm, pick topics (all of them), then answer. Use it to skip clicking through twice.
- **More → Answer the rest for me** fills in sample answers for your remaining questions.
- **More** also shows the partner's invite code, lets you simulate going offline, and resets the demo.

Quick path: sign up as Partner A → Create an invite → *Do their next step* ×3 → pick topics → *Do their next step* → Start → *Answer the rest for me* → *Do their next step* → the reveal plays.

The OTP step takes any 6 digits.

## Where things live

| | |
|---|---|
| `src/theme.ts` | **Every design token**: palette, fonts, type scale, tilts, radii, motion timings, `en-IN` number format. No colour is hard-coded anywhere else. |
| `src/scoring.ts` | Compatibility logic (spec §6) as pure functions: alignment, weight, topic bands, dealbreaker override, "ask what matters" order. |
| `src/scoring.test.ts` | Unit tests: identical → Strong match, opposite → Talk about this, all skipped → Not answered yet, dealbreaker override, order independence, skips never lower a band, in-person exclusion, ask ordering. |
| `src/data.ts` | Topics, the 32-question bank, partial-credit matrices, sample answers for both users. |
| `src/store.tsx` | Mock local state (the §10 data model), per-user derived journey stage, actions, persistence (AsyncStorage). |
| `src/art.tsx` | Torn-paper rim, wordmark, strip titles, the two figures, chai-stall scene, trail-off thought clouds, bumblebee reveal. The whole motion budget lives here except the chart bars. |
| `src/ui.tsx` | Component library: TornCard, PillButton, Chip, TopicToggle, OptionCard, ScaleSlider, ImportanceSelector, DealbreakerToggle, PrivateNoteField, ProgressBar, ChartBar, BandChip, CounterPill, Shimmer, Banner, Screen. |
| `src/screens/` | Onboarding, pairing and topics, questionnaire (gate, waiting), results (reveal, chart, topic detail, ask, next chai), settings (help, app lock, quick-hide screen). |
| `App.tsx` | Fonts, router, app lock, quick hide, discreet notification banner, demo bar. |

## What's mocked

- **No backend.** Both users live in one local store that persists on the device. `store.tsx` maps one-to-one onto the §10 model (User, Pair, TopicConsent, Answer, TopicShare, AskItem). `ChartResult` is always derived and never stored.
- **Phone OTP** accepts any 6 digits. The email fallback checks the format only.
- **Share on WhatsApp** opens `whatsapp://`. If WhatsApp isn't there it falls back to the system share sheet.
- **Notifications** are a banner inside the app that shows the exact discreet wording. No push is sent.
- **Nudge, unpair, delete everything** update the other user's state directly. "Delete everything" is where a real server would wipe the answers from the partner's device.
- **Offline** is a toggle in the demo bar. Everything is local anyway, so the app works offline.
- **Language**: only English. Hindi and Hinglish show a "coming soon" note.
- **App lock** uses a 4-digit PIN. Biometric unlock (`expo-local-authentication`) isn't added yet.

## Privacy behaviour implemented

- Sensitive topics start off. Only topics both partners chose are asked about or compared.
- Nothing is visible until both partners finish. The reveal then unlocks for both, and plays once for each person.
- Light topics show the partner's chosen option. Personal and sensitive topics show only "You differ here" or "You match here" until that person turns on "Show my answers in this topic".
- Private notes are shared one at a time, deliberately.
- Trauma & the past is never compared. The partner sees at most "They have something they'd like to share with you, when they're ready", and only if the sharer turns it on (they can turn it off again).
- Android blocks screenshots on sensitive screens (`FLAG_SECURE` via `expo-screen-capture`). iOS blurs the app in the app switcher.
- Quick hide: tap the wordmark, or tap with two fingers, to get a plain "Notes" screen. Hold its title to come back.

## Decisions I made that you should check

- **Navigation**: I used a small state router instead of Expo Router. The screen each person sees depends on shared pair state, plus the demo switches between two users, so a URL-based router would have added more code than it saved. Swap it in when a real backend lands.
- **Past relationships** is marked "Personal": on by default, but it follows the sensitive-topic rule for answer visibility.
- **Scale "Not sure"** isn't a separate option. "Prefer to discuss in person" covers it.
- **"Talk in person"** gets its own band when every answered question in a topic was "discuss in person". In "Ask what matters" those questions count as half a gap.
- **Dealbreaker vs coverage**: a dealbreaker conflict shows "Talk about this" even when coverage is under 50%.
- **Next chai** is shared by the pair (per the AskItem model) and holds at most 3 questions.

## Open items [Confirm]

The question bank and its final length (it's 32 questions now, around 15 minutes), both helpline numbers (Tele-MANAS 14416 and iCall 9152987821), the languages at launch, whether sensitive answers can ever be shown raw, and whether answers need end-to-end encryption before moving to Supabase.
