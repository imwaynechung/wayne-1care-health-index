'use client';

import { useState } from 'react';

// ─── Data ────────────────────────────────────────────────────────────────────

const WHO5_QUESTIONS = [
  'I have felt cheerful and in good spirits',
  'I have felt calm and relaxed',
  'I have felt active and vigorous',
  'I woke up feeling fresh and rested',
  'My daily life has been filled with things that interest me',
];

const WHO5_OPTIONS = [
  { label: 'All of the time', value: 5 },
  { label: 'Most of the time', value: 4 },
  { label: 'More than half the time', value: 3 },
  { label: 'Less than half the time', value: 2 },
  { label: 'Some of the time', value: 1 },
  { label: 'At no time', value: 0 },
];

const HLI_QUESTIONS = [
  {
    id: 'activity',
    section: 'Physical Activity',
    question:
      'How many days per week do you do at least 30 minutes of moderate physical activity? (e.g. brisk walking, cycling, swimming)',
    options: [
      { label: '5 or more days per week', value: 4 },
      { label: '3–4 days per week', value: 2 },
      { label: '1–2 days per week', value: 1 },
      { label: 'Rarely or never', value: 0 },
    ],
  },
  {
    id: 'diet',
    section: 'Diet',
    question:
      'How many servings of fruit and vegetables do you eat daily? (1 serving = 1 piece of fruit or half a cup of vegetables)',
    options: [
      { label: '5 or more servings', value: 4 },
      { label: '3–4 servings', value: 2 },
      { label: '1–2 servings', value: 1 },
      { label: 'Less than 1 / almost none', value: 0 },
    ],
  },
  {
    id: 'smoking',
    section: 'Smoking',
    question: 'What is your current smoking status?',
    options: [
      { label: 'Never smoked', value: 4 },
      { label: 'Former smoker — quit 5+ years ago', value: 3 },
      { label: 'Former smoker — quit less than 5 years', value: 2 },
      { label: 'Occasional smoker', value: 1 },
      { label: 'Current daily smoker', value: 0 },
    ],
  },
  {
    id: 'sleep',
    section: 'Sleep',
    question: 'How many hours of sleep do you usually get per night?',
    options: [
      { label: '7–8 hours', value: 4 },
      { label: '6 hours', value: 2 },
      { label: '9 or more hours', value: 2 },
      { label: '5 hours', value: 1 },
      { label: 'Less than 5 hours', value: 0 },
    ],
  },
  {
    id: 'sedentary',
    section: 'Sedentary Behaviour',
    question: 'On a typical day, how many hours do you spend sitting or being sedentary?',
    options: [
      { label: 'Less than 4 hours', value: 4 },
      { label: '4–5 hours', value: 3 },
      { label: '6–7 hours', value: 2 },
      { label: '8–9 hours', value: 1 },
      { label: '10 or more hours', value: 0 },
    ],
  },
];

// ─── Scoring helpers ──────────────────────────────────────────────────────────

function calcWho5Points(rawScore: number): number {
  const pct = rawScore * 4;
  if (pct >= 72) return 20;
  if (pct >= 52) return 14;
  if (pct >= 29) return 8;
  return 3;
}

function calcWho5Level(pct: number): { label: string; color: string } {
  if (pct >= 72) return { label: 'Good', color: '#22c55e' };
  if (pct >= 52) return { label: 'Moderate', color: '#f59e0b' };
  if (pct >= 29) return { label: 'Low', color: '#f97316' };
  return { label: 'Very Low', color: '#ef4444' };
}

function baselineLabel(score: number): string {
  if (score >= 35) return 'Excellent';
  if (score >= 25) return 'Generally Healthy';
  if (score >= 15) return 'Mixed Lifestyle';
  if (score >= 5) return 'Needs Attention';
  return 'High Priority';
}

function baselineDesc(score: number): string {
  if (score >= 35)
    return 'Excellent lifestyle and good wellbeing — lowest NCD risk profile.';
  if (score >= 25)
    return 'Generally healthy — some gaps, moderate risk in specific areas.';
  if (score >= 15)
    return 'Mixed lifestyle — meaningful risk present, strong improvement potential.';
  if (score >= 5)
    return 'Poor lifestyle or very low wellbeing — highest NCD risk, most to gain from the programme.';
  return 'Extremely poor across all domains — consider clinical referral alongside programme.';
}

function baselineColor(score: number): string {
  if (score >= 35) return '#22c55e';
  if (score >= 25) return '#84cc16';
  if (score >= 15) return '#f59e0b';
  if (score >= 5) return '#f97316';
  return '#ef4444';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide"
      style={{ background: color + '22', color }}
    >
      {label}
    </span>
  );
}

function ScoreArc({
  score,
  max,
  color,
}: {
  score: number;
  max: number;
  color: string;
}) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const pct = score / max;
  const dash = pct * circ;

  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
      <circle
        cx="70"
        cy="70"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        strokeDashoffset={circ / 4}
        style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(.4,2,.6,1)' }}
      />
      <text x="70" y="65" textAnchor="middle" fill={color} fontSize="28" fontWeight="700">
        {score}
      </text>
      <text x="70" y="83" textAnchor="middle" fill="#9ca3af" fontSize="11">
        / {max}
      </text>
    </svg>
  );
}

function BarRow({
  label,
  score,
  max,
  color,
}: {
  label: string;
  score: number;
  max: number;
  color: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>
          {score} / {max}
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${(score / max) * 100}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Phase = 'intro' | 'who5' | 'hli' | 'results';

export default function OneCareBaselinePage() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [who5Answers, setWho5Answers] = useState<(number | null)[]>(Array(5).fill(null));
  // Store option indices (not values) to handle duplicate score values (e.g. sleep 6h and 9h both = 2)
  const [hliSelectedIdx, setHliSelectedIdx] = useState<(number | null)[]>(Array(5).fill(null));
  const [who5Step, setWho5Step] = useState(0);
  const [hliStep, setHliStep] = useState(0);

  // WHO-5 derived
  const who5Raw = who5Answers.reduce<number>((sum, v) => sum + (v ?? 0), 0);
  const who5Pct = who5Raw * 4;
  const who5Points = calcWho5Points(who5Raw);
  const who5Level = calcWho5Level(who5Pct);

  // HLI derived — resolve actual values from selected indices
  const hliAnswers = hliSelectedIdx.map((idx, qi) =>
    idx !== null ? HLI_QUESTIONS[qi].options[idx].value : null
  );
  const hliRaw = hliAnswers.reduce<number>((sum, v) => sum + (v ?? 0), 0);

  // Total baseline
  const baseline = who5Points + hliRaw;

  // HLI level label
  const hliLabel =
    hliRaw >= 18
      ? 'Excellent'
      : hliRaw >= 14
      ? 'Strong'
      : hliRaw >= 9
      ? 'Moderate'
      : hliRaw >= 5
      ? 'Low'
      : 'Very Poor';

  // ── Intro ──────────────────────────────────────────────────────────────────

  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          {/* Logo pill */}
          <div className="mb-10 flex items-center gap-2">
            <span className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase">
              1Care · GOFA
            </span>
          </div>

          <h1
            className="text-5xl font-bold leading-tight mb-4"
            style={{ fontFamily: 'var(--font-fraunces)', color: '#1a1a2e' }}
          >
            Your Health Index
            <br />
            <span style={{ color: '#2563eb' }}>Baseline</span>
          </h1>

          <p className="text-gray-500 text-lg mb-10 leading-relaxed">
            10 questions. About 3 minutes. Completed once — then retested at Month 6 and Month 12.
          </p>

          {/* Two part cards */}
          <div className="grid grid-cols-2 gap-3 mb-10">
            <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
              <div
                className="text-3xl font-bold mb-1"
                style={{ fontFamily: 'var(--font-fraunces)', color: '#2563eb' }}
              >
                0–20
              </div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Mental Wellbeing
              </div>
              <div className="text-sm text-gray-600">
                WHO-5 Wellbeing Index — 5 questions covering the past two weeks.
              </div>
            </div>
            <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
              <div
                className="text-3xl font-bold mb-1"
                style={{ fontFamily: 'var(--font-fraunces)', color: '#16a34a' }}
              >
                0–20
              </div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Lifestyle Behaviours
              </div>
              <div className="text-sm text-gray-600">
                5 questions on activity, diet, smoking, sleep, and sedentary time.
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-[#1a1a2e] text-white p-5 mb-8 flex items-center gap-4">
            <div
              className="text-4xl font-bold"
              style={{ fontFamily: 'var(--font-fraunces)' }}
            >
              0–40
            </div>
            <div>
              <div className="font-semibold text-sm mb-0.5">Total Baseline Score</div>
              <div className="text-xs text-gray-400">
                Your score will never fall below this — only your engagement can raise it to 100.
              </div>
            </div>
          </div>

          <button
            onClick={() => setPhase('who5')}
            className="w-full py-4 rounded-2xl text-white font-bold text-lg transition-all active:scale-[.98]"
            style={{ background: '#2563eb' }}
          >
            Start Baseline Assessment →
          </button>
        </div>
      </div>
    );
  }

  // ── WHO-5 ──────────────────────────────────────────────────────────────────

  if (phase === 'who5') {
    const q = WHO5_QUESTIONS[who5Step];
    const selected = who5Answers[who5Step];
    const isLast = who5Step === 4;

    const handleNext = () => {
      if (selected === null) return;
      if (isLast) {
        setPhase('hli');
      } else {
        setWho5Step((s) => s + 1);
      }
    };

    return (
      <div className="min-h-screen bg-[#eff6ff] flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          {/* Section header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold tracking-[0.2em] text-blue-400 uppercase mb-1">
                Part 1 of 2 · Mental Wellbeing
              </div>
              <div className="text-sm text-gray-500">WHO-5 Wellbeing Index</div>
            </div>
            <div className="text-sm text-gray-400">
              {who5Step + 1} / 5
            </div>
          </div>

          {/* Progress */}
          <div className="w-full h-1.5 rounded-full bg-blue-100 mb-8 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-400"
              style={{ width: `${((who5Step + 1) / 5) * 100}%` }}
            />
          </div>

          {/* Context note */}
          <p className="text-xs text-blue-500 font-medium mb-4 uppercase tracking-wide">
            Over the past two weeks —
          </p>

          {/* Question */}
          <h2
            className="text-2xl font-bold text-gray-900 mb-8 leading-snug"
            style={{ fontFamily: 'var(--font-fraunces)' }}
          >
            {q}
          </h2>

          {/* Options */}
          <div className="space-y-2 mb-8">
            {WHO5_OPTIONS.map((opt) => {
              const isSelected = selected === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    const updated = [...who5Answers];
                    updated[who5Step] = opt.value;
                    setWho5Answers(updated);
                  }}
                  className={`w-full text-left px-5 py-3.5 rounded-xl border-2 transition-all text-sm font-medium ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-800'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                        isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}
                    />
                    {opt.label}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex gap-3">
            {who5Step > 0 && (
              <button
                onClick={() => setWho5Step((s) => s - 1)}
                className="px-6 py-3.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:border-gray-300 transition-all"
              >
                ← Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={selected === null}
              className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all ${
                selected !== null
                  ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[.98]'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isLast ? 'Continue to Lifestyle →' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── HLI ───────────────────────────────────────────────────────────────────

  if (phase === 'hli') {
    const q = HLI_QUESTIONS[hliStep];
    const selectedIdx = hliSelectedIdx[hliStep];
    const isLast = hliStep === 4;

    const handleNext = () => {
      if (selectedIdx === null) return;
      if (isLast) {
        setPhase('results');
      } else {
        setHliStep((s) => s + 1);
      }
    };

    return (
      <div className="min-h-screen bg-[#f0fdf4] flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          {/* Section header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold tracking-[0.2em] text-green-500 uppercase mb-1">
                Part 2 of 2 · Lifestyle Behaviours
              </div>
              <div className="text-sm text-gray-500">{q.section}</div>
            </div>
            <div className="text-sm text-gray-400">{hliStep + 1} / 5</div>
          </div>

          {/* Progress */}
          <div className="w-full h-1.5 rounded-full bg-green-100 mb-8 overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-400"
              style={{ width: `${((hliStep + 1) / 5) * 100}%` }}
            />
          </div>

          {/* Question */}
          <h2
            className="text-2xl font-bold text-gray-900 mb-8 leading-snug"
            style={{ fontFamily: 'var(--font-fraunces)' }}
          >
            {q.question}
          </h2>

          {/* Options — tracked by index to handle duplicate score values (e.g. sleep) */}
          <div className="space-y-2 mb-8">
            {q.options.map((opt, i) => {
              const isSelected = selectedIdx === i;
              return (
                <button
                  key={`${q.id}-${i}`}
                  onClick={() => {
                    const updated = [...hliSelectedIdx];
                    updated[hliStep] = i;
                    setHliSelectedIdx(updated);
                  }}
                  className={`w-full text-left px-5 py-3.5 rounded-xl border-2 transition-all text-sm font-medium ${
                    isSelected
                      ? 'border-green-500 bg-green-50 text-green-800'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-green-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                        isSelected ? 'border-green-500 bg-green-500' : 'border-gray-300'
                      }`}
                    />
                    {opt.label}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                if (hliStep === 0) {
                  setPhase('who5');
                  setWho5Step(4);
                } else {
                  setHliStep((s) => s - 1);
                }
              }}
              className="px-6 py-3.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:border-gray-300 transition-all"
            >
              ← Back
            </button>
            <button
              onClick={handleNext}
              disabled={selectedIdx === null}
              className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all ${
                selectedIdx !== null
                  ? 'bg-green-600 text-white hover:bg-green-700 active:scale-[.98]'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isLast ? 'See My Baseline →' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────────

  const color = baselineColor(baseline);
  const label = baselineLabel(baseline);
  const desc = baselineDesc(baseline);

  // HLI individual breakdown
  const hliBreakdownItems = HLI_QUESTIONS.map((q, i) => ({
    label: q.section,
    score: hliAnswers[i] ?? 0,
    max: 4,
  }));

  const showWellbeingNote = who5Pct < 52;

  return (
    <div className="min-h-screen bg-[#f8f7f4] p-4">
      <div className="max-w-lg mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase mb-2">
            1Care · GOFA · Baseline Result
          </div>
          <h1
            className="text-4xl font-bold leading-tight text-gray-900"
            style={{ fontFamily: 'var(--font-fraunces)' }}
          >
            Your Health Index
            <br />
            Baseline
          </h1>
        </div>

        {/* Main score card */}
        <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-6 mb-4 flex items-center gap-6">
          <ScoreArc score={baseline} max={40} color={color} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Baseline Score
            </div>
            <div
              className="text-2xl font-bold mb-1"
              style={{ fontFamily: 'var(--font-fraunces)', color }}
            >
              {label}
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
          </div>
        </div>

        {/* Two component cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* WHO-5 */}
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
            <div className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-2">
              WHO-5 Wellbeing
            </div>
            <div
              className="text-3xl font-bold mb-0.5"
              style={{ fontFamily: 'var(--font-fraunces)', color: '#2563eb' }}
            >
              {who5Points}
              <span className="text-base font-normal text-gray-400"> / 20</span>
            </div>
            <Pill label={who5Level.label} color={who5Level.color} />
            <div className="mt-3 text-xs text-gray-400">
              Raw score: {who5Raw}/25 · {who5Pct}%
            </div>
          </div>

          {/* HLI */}
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
            <div className="text-xs font-semibold text-green-500 uppercase tracking-wide mb-2">
              Lifestyle (HLI)
            </div>
            <div
              className="text-3xl font-bold mb-0.5"
              style={{ fontFamily: 'var(--font-fraunces)', color: '#16a34a' }}
            >
              {hliRaw}
              <span className="text-base font-normal text-gray-400"> / 20</span>
            </div>
            <Pill
              label={hliLabel}
              color={
                hliRaw >= 18
                  ? '#22c55e'
                  : hliRaw >= 14
                  ? '#84cc16'
                  : hliRaw >= 9
                  ? '#f59e0b'
                  : hliRaw >= 5
                  ? '#f97316'
                  : '#ef4444'
              }
            />
          </div>
        </div>

        {/* HLI breakdown */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 mb-4">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Lifestyle Breakdown
          </div>
          {hliBreakdownItems.map((item) => (
            <BarRow
              key={item.label}
              label={item.label}
              score={item.score}
              max={item.max}
              color={
                item.score >= 3 ? '#22c55e' : item.score >= 2 ? '#f59e0b' : '#ef4444'
              }
            />
          ))}
        </div>

        {/* WHO-5 wellbeing note */}
        {showWellbeingNote && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 mb-4">
            <div className="text-sm font-semibold text-amber-700 mb-1">
              Wellbeing Support Pathway
            </div>
            <p className="text-xs text-amber-600 leading-relaxed">
              Your WHO-5 score ({who5Pct}%) is below 52, which the WHO associates with some
              emotional burden. An optional wellbeing support pathway is available — not
              punitive, not automatic, and always clinician-governed.
            </p>
          </div>
        )}

        {/* What happens next */}
        <div className="rounded-2xl bg-[#1a1a2e] text-white p-6 mb-6">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            What Happens Next
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                +
              </div>
              <p className="text-gray-300">
                Earn up to <strong className="text-white">60 more points</strong> through weekly
                AI Move sessions, nutrition logging, hydration tracking, and consistency.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                ↑
              </div>
              <p className="text-gray-300">
                Your score <strong className="text-white">will never fall below {baseline}</strong>{' '}
                — your baseline is your permanent floor.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                6
              </div>
              <p className="text-gray-300">
                Retest at <strong className="text-white">Month 6</strong> and{' '}
                <strong className="text-white">Month 12</strong> to see if your baseline itself
                has improved.
              </p>
            </div>
          </div>
        </div>

        {/* Restart */}
        <button
          onClick={() => {
            setPhase('intro');
            setWho5Answers(Array(5).fill(null));
            setHliSelectedIdx(Array(5).fill(null));
            setWho5Step(0);
            setHliStep(0);
          }}
          className="w-full py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:border-gray-300 transition-all"
        >
          Retake Assessment
        </button>

        {/* Governance footnote */}
        <p className="mt-6 text-center text-xs text-gray-400 leading-relaxed px-4">
          This is not a clinical diagnosis, medical risk score, or underwriting instrument.
          The 1Care Health Index measures healthy lifestyle adherence and engagement momentum.
        </p>
      </div>
    </div>
  );
}
