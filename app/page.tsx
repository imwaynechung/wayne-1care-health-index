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

// ─── Domain explanations (for results page) ─────────────────────────────────

const HLI_EXPLANATIONS: Record<string, { what: string; tip: string }> = {
  activity: {
    what: 'Regular moderate exercise reduces your risk of heart disease, diabetes, and certain cancers.',
    tip: 'Aim for at least 30 minutes on 5 or more days per week — brisk walking counts.',
  },
  diet: {
    what: 'Fruit and vegetables provide fibre, vitamins, and antioxidants your body needs to fight disease.',
    tip: 'Try to reach 5 servings a day — 1 piece of fruit or half a cup of vegetables each.',
  },
  smoking: {
    what: 'Smoking is the single biggest preventable cause of heart disease, stroke, and lung cancer.',
    tip: 'Every year after quitting, your risk continues to fall significantly.',
  },
  sleep: {
    what: 'Both too little and too much sleep disrupt your hormones, immunity, and heart health.',
    tip: 'Most adults do best with 7–8 hours per night — quality matters as much as quantity.',
  },
  sedentary: {
    what: 'Sitting for long stretches raises metabolic risk even if you exercise regularly.',
    tip: 'Try to stand up or take a short walk every hour to break up sitting time.',
  },
};

const WHO5_LEVEL_DESC: Record<string, string> = {
  Good: 'Your mood, energy, and rest levels are all tracking well over the past two weeks.',
  Moderate: 'You are coping most of the time, with some dips in mood or energy.',
  Low: 'You may be experiencing persistent low mood, fatigue, or poor sleep. Worth keeping an eye on.',
  'Very Low':
    'This score suggests meaningful emotional strain. Talking to someone — a friend, GP, or counsellor — can help.',
};

// ─── HLI Triage map ──────────────────────────────────────────────────────────

type TriageLevel = 'High' | 'Moderate' | 'Low';

interface DomainTriage {
  threshold: string;
  levels: { level: TriageLevel; desc: string }[];
  tip: string;
}

const HLI_TRIAGE: Record<string, DomainTriage> = {
  activity: {
    threshold: '≥150 min/week moderate intensity or ≥75 min/week vigorous',
    levels: [
      { level: 'High', desc: '≥150 min/week — 35% reduced all-cause mortality vs. inactive individuals.' },
      { level: 'Moderate', desc: '75–149 min/week — partial benefit; some risk reduction but not optimal.' },
      { level: 'Low', desc: '<75 min/week — significantly elevated CVD, T2D, and all-cause mortality risk.' },
    ],
    tip: 'Aim for at least 30 minutes on 5 or more days per week — brisk walking counts.',
  },
  diet: {
    threshold: '≥5 servings/day fruit + vegetables',
    levels: [
      { level: 'High', desc: '≥5 servings/day — associated with significant mortality reduction when combined with other healthy behaviours.' },
      { level: 'Moderate', desc: '2–4 servings/day — partial protection; synergistic benefit not yet fully unlocked.' },
      { level: 'Low', desc: '<2 servings/day — elevated inflammation, poor micronutrient status, higher CVD and cancer risk.' },
    ],
    tip: 'Try to reach 5 servings a day — 1 piece of fruit or half a cup of vegetables each.',
  },
  smoking: {
    threshold: 'Never-smoker or former smoker (<100 cigarettes lifetime)',
    levels: [
      { level: 'High', desc: 'Never-smoker — lowest risk; qualifies for full HLI High band contribution.' },
      { level: 'Moderate', desc: 'Former smoker — risk declines progressively every year after quitting; 10-year ex-smokers approach never-smoker risk levels.' },
      { level: 'Low', desc: 'Current smoker — strongest single predictor of all-cause, CVD, and cancer mortality; non-smoking alone associated with 37% reduced mortality risk.' },
    ],
    tip: 'Every year after quitting, your risk continues to fall significantly.',
  },
  sleep: {
    threshold: 'Wakes rested; feels tired ≤1–2 times/month',
    levels: [
      { level: 'High', desc: '7–8 hours quality sleep — associated with 38% reduced all-cause mortality independently.' },
      { level: 'Moderate', desc: 'Occasionally poor sleep quality; some nights unrestful — partial risk elevation.' },
      { level: 'Low', desc: 'Feels tired after waking ≥3–4×/week — reaches independent statistical significance for all-cause mortality (HR: 0.62).' },
    ],
    tip: 'Most adults do best with 7–8 hours per night — quality matters as much as quantity.',
  },
  sedentary: {
    threshold: 'Regularly breaks up sitting time; not sedentary for prolonged periods',
    levels: [
      { level: 'High', desc: 'Regularly stands or walks every hour — consistent with WHO sedentary behaviour guidelines.' },
      { level: 'Moderate', desc: 'Mostly seated with occasional breaks — partial risk; physical activity partially compensates.' },
      { level: 'Low', desc: '>8 hours/day unbroken sitting — elevated metabolic risk independent of physical activity level.' },
    ],
    tip: 'Try to stand up or take a short walk every hour to break up sitting time.',
  },
};

// Map HLI score to triage level per domain
function getDomainTriage(domainId: string, score: number): TriageLevel {
  if (domainId === 'activity') return score >= 4 ? 'High' : score >= 2 ? 'Moderate' : 'Low';
  if (domainId === 'diet')     return score >= 4 ? 'High' : score >= 2 ? 'Moderate' : 'Low';
  if (domainId === 'smoking')  return score >= 4 ? 'High' : score >= 2 ? 'Moderate' : 'Low';
  if (domainId === 'sleep')    return score >= 4 ? 'High' : score >= 2 ? 'Moderate' : 'Low';
  if (domainId === 'sedentary') return score >= 3 ? 'High' : score >= 2 ? 'Moderate' : 'Low';
  return 'Moderate';
}

const TRIAGE_CONFIG: Record<TriageLevel, { color: string; bg: string; border: string; dot: string; priority: string }> = {
  High:     { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', dot: '🟢', priority: 'Maintain' },
  Moderate: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', dot: '🟡', priority: 'Improve' },
  Low:      { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', dot: '🔴', priority: 'Act Now' },
};

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
  size = 180,
}: {
  score: number;
  max: number;
  color: string;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  // Draw arc from 220deg to 320deg (leaving a gap at bottom), total 260deg
  const startAngle = 130; // degrees (measured from 3-o'clock)
  const totalAngle = 280;
  const pct = score / max;
  const filledAngle = pct * totalAngle;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const arcPath = (startDeg: number, sweepDeg: number) => {
    const start = toRad(startDeg);
    const end = toRad(startDeg + sweepDeg);
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const large = sweepDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const sw = size * 0.055;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Track */}
      <path d={arcPath(startAngle, totalAngle)} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={sw} strokeLinecap="round" />
      {/* Fill */}
      {pct > 0 && (
        <path
          d={arcPath(startAngle, filledAngle)}
          fill="none"
          stroke="#fff"
          strokeWidth={sw}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s cubic-bezier(.4,2,.6,1)' }}
        />
      )}
      {/* Score */}
      <text x={cx} y={cy - 8} textAnchor="middle" fill="white" fontSize={size * 0.22} fontWeight="800">
        {score}
      </text>
      <text x={cx} y={cy + size * 0.1} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize={size * 0.075}>
        out of {max}
      </text>
    </svg>
  );
}

function MiniArc({ score, max, color }: { score: number; max: number; color: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const pct = score / max;
  const dash = pct * circ;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke={color + '30'} strokeWidth="6" />
      <circle
        cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round" strokeDashoffset={circ / 4}
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
      <text x="36" y="40" textAnchor="middle" fill={color} fontSize="14" fontWeight="700">{score}</text>
    </svg>
  );
}

function TriageCard({
  label,
  domainId,
  score,
}: {
  label: string;
  domainId: string;
  score: number;
}) {
  const triage = getDomainTriage(domainId, score);
  const cfg = TRIAGE_CONFIG[triage];
  const data = HLI_TRIAGE[domainId];

  return (
    <div
      className="rounded-2xl border p-4 mb-3 last:mb-0"
      style={{ background: cfg.bg, borderColor: cfg.border }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">{cfg.dot}</span>
          <span className="text-sm font-bold text-slate-800">{label}</span>
        </div>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: cfg.color + '18', color: cfg.color }}
        >
          {cfg.priority}
        </span>
      </div>

      {/* Your status */}
      <div className="flex items-center gap-2 mb-3 p-2.5 rounded-xl bg-white/70">
        <div className="w-1.5 h-10 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: cfg.color }}>
            Your Status — {triage}
          </div>
          <div className="text-xs text-slate-600 leading-relaxed">
            {data.levels.find((l) => l.level === triage)?.desc}
          </div>
        </div>
      </div>

      {/* Level bands */}
      <div className="space-y-1.5 mb-3">
        {data.levels.map((l) => {
          const lCfg = TRIAGE_CONFIG[l.level];
          const isActive = l.level === triage;
          return (
            <div
              key={l.level}
              className="flex gap-2 items-start rounded-lg px-2.5 py-2 transition-all"
              style={{ background: isActive ? lCfg.color + '12' : 'transparent' }}
            >
              <span className="text-xs mt-0.5 flex-shrink-0">{lCfg.dot}</span>
              <div>
                <span className="text-xs font-bold" style={{ color: isActive ? lCfg.color : '#94a3b8' }}>
                  {l.level}:{' '}
                </span>
                <span className="text-xs" style={{ color: isActive ? '#374151' : '#94a3b8' }}>
                  {l.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tip */}
      <div className="flex gap-2 items-start bg-white/60 rounded-xl px-3 py-2.5">
        <svg className="flex-shrink-0 mt-0.5" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p className="text-xs leading-relaxed" style={{ color: cfg.color }}>
          <span className="font-semibold">Action: </span>{data.tip}
        </p>
      </div>
    </div>
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
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: color + '18', color }}>
          {score}/{max}
        </span>
      </div>
      <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: color + '18' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${(score / max) * 100}%`, background: `linear-gradient(90deg, ${color}cc, ${color})` }}
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
      <div className="min-h-screen flex flex-col" style={{ background: '#f0f4ff' }}>
        {/* Hero gradient header */}
        <div
          className="relative overflow-hidden px-6 pt-14 pb-10"
          style={{ background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)' }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-10" style={{ background: '#fff' }} />
          <div className="absolute -bottom-20 -left-8 w-56 h-56 rounded-full opacity-10" style={{ background: '#fff' }} />

          <div className="relative max-w-md mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 mb-6">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/90 text-xs font-semibold tracking-wide">1CARE · GOFA</span>
            </div>

            <h1
              className="text-4xl font-bold text-white leading-tight mb-3"
              style={{ fontFamily: 'var(--font-fraunces)' }}
            >
              Your Health
              <br />Index Baseline
            </h1>
            <p className="text-blue-100 text-sm leading-relaxed mb-8">
              10 questions · ~3 minutes · Retested at Month 6 & 12
            </p>

            {/* Big score preview */}
            <div className="flex justify-center">
              <div className="bg-white/15 backdrop-blur rounded-3xl px-8 py-5 border border-white/20">
                <div className="text-center">
                  <div className="text-white/60 text-xs font-medium mb-1 uppercase tracking-widest">Score Range</div>
                  <div
                    className="text-6xl font-black text-white mb-1"
                    style={{ fontFamily: 'var(--font-fraunces)' }}
                  >0–40</div>
                  <div className="text-white/60 text-xs">Your permanent baseline floor</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards section */}
        <div className="flex-1 px-5 -mt-4 max-w-md mx-auto w-full">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* WHO-5 card */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-blue-50 animate-fade-up">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </div>
              <div className="text-blue-600 text-xs font-bold uppercase tracking-wide mb-1">Mental</div>
              <div className="text-2xl font-black text-slate-800 mb-0.5" style={{ fontFamily: 'var(--font-fraunces)' }}>0–20</div>
              <div className="text-slate-500 text-xs leading-relaxed">WHO-5 Wellbeing · 5 questions</div>
            </div>

            {/* HLI card */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-green-50 animate-fade-up delay-100">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <div className="text-green-600 text-xs font-bold uppercase tracking-wide mb-1">Lifestyle</div>
              <div className="text-2xl font-black text-slate-800 mb-0.5" style={{ fontFamily: 'var(--font-fraunces)' }}>0–20</div>
              <div className="text-slate-500 text-xs leading-relaxed">Activity, diet, sleep & more</div>
            </div>
          </div>

          {/* Info strip */}
          <div
            className="rounded-2xl p-4 mb-6 flex items-center gap-3 animate-fade-up delay-200"
            style={{ background: 'linear-gradient(135deg, #1e3a8a, #1e40af)' }}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div>
              <div className="text-white text-sm font-semibold">Score never drops</div>
              <div className="text-blue-200 text-xs">Engagement earns you up to 60 more points</div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => setPhase('who5')}
            className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-[.97] shadow-lg animate-fade-up delay-300"
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 8px 24px #2563eb44' }}
          >
            Start Assessment →
          </button>

          <p className="mt-4 text-center text-xs text-slate-400 pb-8">
            Not a clinical diagnosis · For programme engagement only
          </p>
        </div>
      </div>
    );
  }

  // ── WHO-5 ──────────────────────────────────────────────────────────────────

  if (phase === 'who5') {
    const q = WHO5_QUESTIONS[who5Step];
    const selected = who5Answers[who5Step];
    const isLast = who5Step === 4;

    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#f0f4ff' }}>
        {/* Header */}
        <div
          className="px-5 pt-12 pb-8"
          style={{ background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)' }}
        >
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-6">
              {who5Step > 0 ? (
                <button
                  onClick={() => setWho5Step((s) => s - 1)}
                  className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center transition-all active:scale-90"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
              ) : <div className="w-9" />}
              <div className="flex gap-1.5">
                {WHO5_QUESTIONS.map((_, i) => (
                  <div
                    key={i}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === who5Step ? 20 : 6,
                      height: 6,
                      background: i <= who5Step ? '#fff' : 'rgba(255,255,255,0.3)'
                    }}
                  />
                ))}
              </div>
              <div className="text-white/70 text-sm font-medium">{who5Step + 1}/5</div>
            </div>

            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 mb-4">
              <span className="text-white/80 text-xs font-semibold">MENTAL WELLBEING</span>
            </div>
            <p className="text-blue-200 text-xs mb-2 uppercase tracking-wide font-medium">Over the past two weeks —</p>
            <h2
              className="text-2xl font-bold text-white leading-snug"
              style={{ fontFamily: 'var(--font-fraunces)' }}
            >
              {q}
            </h2>
          </div>
        </div>

        {/* Options */}
        <div className="flex-1 px-5 pt-5 max-w-md mx-auto w-full">
          <div className="space-y-2.5">
            {WHO5_OPTIONS.map((opt) => {
              const isSelected = selected === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    const updated = [...who5Answers];
                    updated[who5Step] = opt.value;
                    setWho5Answers(updated);
                    setTimeout(() => {
                      if (isLast) setPhase('hli');
                      else setWho5Step((s) => s + 1);
                    }, 280);
                  }}
                  className="w-full text-left px-5 py-4 rounded-2xl transition-all active:scale-[.98] flex items-center gap-3"
                  style={{
                    background: isSelected
                      ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                      : '#fff',
                    boxShadow: isSelected
                      ? '0 4px 16px #2563eb33'
                      : '0 1px 4px rgba(0,0,0,0.06)',
                    border: isSelected ? 'none' : '1.5px solid #e8edf8',
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
                    style={{
                      borderColor: isSelected ? '#fff' : '#d1d5db',
                      background: isSelected ? '#fff' : 'transparent'
                    }}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: isSelected ? '#fff' : '#374151' }}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
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

    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#f0fdf6' }}>
        {/* Header */}
        <div
          className="px-5 pt-12 pb-8"
          style={{ background: 'linear-gradient(135deg, #14532d 0%, #16a34a 100%)' }}
        >
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => {
                  if (hliStep === 0) { setPhase('who5'); setWho5Step(4); }
                  else setHliStep((s) => s - 1);
                }}
                className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center transition-all active:scale-90"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <div className="flex gap-1.5">
                {HLI_QUESTIONS.map((_, i) => (
                  <div
                    key={i}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === hliStep ? 20 : 6,
                      height: 6,
                      background: i <= hliStep ? '#fff' : 'rgba(255,255,255,0.3)'
                    }}
                  />
                ))}
              </div>
              <div className="text-white/70 text-sm font-medium">{hliStep + 1}/5</div>
            </div>

            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 mb-4">
              <span className="text-white/80 text-xs font-semibold uppercase tracking-wide">{q.section}</span>
            </div>
            <h2
              className="text-2xl font-bold text-white leading-snug"
              style={{ fontFamily: 'var(--font-fraunces)' }}
            >
              {q.question}
            </h2>
          </div>
        </div>

        {/* Options */}
        <div className="flex-1 px-5 pt-5 max-w-md mx-auto w-full">
          <div className="space-y-2.5">
            {q.options.map((opt, i) => {
              const isSelected = selectedIdx === i;
              return (
                <button
                  key={`${q.id}-${i}`}
                  onClick={() => {
                    const updated = [...hliSelectedIdx];
                    updated[hliStep] = i;
                    setHliSelectedIdx(updated);
                    setTimeout(() => {
                      if (isLast) setPhase('results');
                      else setHliStep((s) => s + 1);
                    }, 280);
                  }}
                  className="w-full text-left px-5 py-4 rounded-2xl transition-all active:scale-[.98] flex items-center gap-3"
                  style={{
                    background: isSelected
                      ? 'linear-gradient(135deg, #16a34a, #15803d)'
                      : '#fff',
                    boxShadow: isSelected
                      ? '0 4px 16px #16a34a33'
                      : '0 1px 4px rgba(0,0,0,0.06)',
                    border: isSelected ? 'none' : '1.5px solid #dcfce7',
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
                    style={{
                      borderColor: isSelected ? '#fff' : '#d1d5db',
                      background: isSelected ? '#fff' : 'transparent'
                    }}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-green-600" />}
                  </div>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: isSelected ? '#fff' : '#374151' }}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
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
    <div className="min-h-screen" style={{ background: '#f0f4ff' }}>
      {/* Hero score section */}
      <div
        className="relative overflow-hidden px-5 pt-14 pb-6"
        style={{ background: `linear-gradient(135deg, ${color}dd, ${color})` }}
      >
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-10" style={{ background: '#fff' }} />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full opacity-10" style={{ background: '#fff' }} />

        <div className="relative max-w-md mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 mb-4">
            <span className="text-white/90 text-xs font-semibold tracking-wide">1CARE · GOFA · RESULT</span>
          </div>

          <ScoreArc score={baseline} max={40} color={color} size={200} />

          <div
            className="text-2xl font-black text-white mt-1 mb-1"
            style={{ fontFamily: 'var(--font-fraunces)' }}
          >
            {label}
          </div>
          <p className="text-white/80 text-sm leading-relaxed px-4 pb-2">{desc}</p>
        </div>
      </div>

      <div className="px-5 pt-4 pb-10 max-w-md mx-auto">
        {/* Two score cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* WHO-5 */}
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-blue-50 animate-fade-up">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-blue-500 text-xs font-bold uppercase tracking-wide mb-0.5">Mental</div>
                <div className="text-slate-400 text-xs">WHO-5</div>
              </div>
              <MiniArc score={who5Points} max={20} color="#2563eb" />
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-2xl font-black text-slate-800" style={{ fontFamily: 'var(--font-fraunces)' }}>{who5Points}</span>
              <span className="text-slate-400 text-sm">/20</span>
            </div>
            <Pill label={who5Level.label} color={who5Level.color} />
          </div>

          {/* HLI */}
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-green-50 animate-fade-up delay-100">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-green-600 text-xs font-bold uppercase tracking-wide mb-0.5">Lifestyle</div>
                <div className="text-slate-400 text-xs">HLI</div>
              </div>
              <MiniArc score={hliRaw} max={20} color="#16a34a" />
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-2xl font-black text-slate-800" style={{ fontFamily: 'var(--font-fraunces)' }}>{hliRaw}</span>
              <span className="text-slate-400 text-sm">/20</span>
            </div>
            <Pill
              label={hliLabel}
              color={hliRaw >= 18 ? '#22c55e' : hliRaw >= 14 ? '#84cc16' : hliRaw >= 9 ? '#f59e0b' : hliRaw >= 5 ? '#f97316' : '#ef4444'}
            />
          </div>
        </div>

        {/* Triage summary strip */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 mb-4 animate-fade-up delay-200">
          <div className="text-slate-800 text-sm font-bold mb-3">Lifestyle Domain Triage</div>
          <div className="space-y-2">
            {HLI_QUESTIONS.map((q, i) => {
              const score = hliAnswers[i] ?? 0;
              const triage = getDomainTriage(q.id, score);
              const cfg = TRIAGE_CONFIG[triage];
              return (
                <div key={q.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{cfg.dot}</span>
                    <span className="text-sm text-slate-700 font-medium">{q.section}</span>
                  </div>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: cfg.color + '15', color: cfg.color }}
                  >
                    {cfg.priority}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed triage cards */}
        <div className="mb-4 animate-fade-up delay-200">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-3 px-1">Domain Detail</div>
          {HLI_QUESTIONS.map((q, i) => (
            <TriageCard
              key={q.id}
              label={q.section}
              domainId={q.id}
              score={hliAnswers[i] ?? 0}
            />
          ))}
        </div>

        {/* Mental wellbeing note */}
        {showWellbeingNote && (
          <div
            className="rounded-3xl p-5 mb-4 border border-amber-100 animate-fade-up"
            style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-xl bg-amber-400/20 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <span className="text-amber-800 text-sm font-bold">Wellbeing Support Available</span>
            </div>
            <p className="text-amber-700 text-xs leading-relaxed">
              Your WHO-5 score ({who5Pct}%) is below 52. An optional wellbeing support pathway is available — always clinician-governed.
            </p>
          </div>
        )}

        {/* What's next card */}
        <div
          className="rounded-3xl p-5 mb-5 animate-fade-up delay-300"
          style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a8a)' }}
        >
          <div className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-4">What Happens Next</div>
          <div className="space-y-4">
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-2xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-black">+60</span>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">Earn up to <span className="text-white font-bold">60 more points</span> through AI Move, nutrition, hydration & consistency.</p>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-2xl bg-green-500 flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">Your score <span className="text-white font-bold">never falls below {baseline}</span> — this is your permanent floor.</p>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-2xl bg-purple-500 flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">Retest at <span className="text-white font-bold">Month 6</span> and <span className="text-white font-bold">Month 12</span> to see if your baseline improves.</p>
            </div>
          </div>
        </div>

        {/* Retake */}
        <button
          onClick={() => {
            setPhase('intro');
            setWho5Answers(Array(5).fill(null));
            setHliSelectedIdx(Array(5).fill(null));
            setWho5Step(0);
            setHliStep(0);
          }}
          className="w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-[.97] border-2 border-slate-200 text-slate-500 bg-white"
        >
          Retake Assessment
        </button>

        <p className="mt-5 text-center text-xs text-slate-400 leading-relaxed px-4 pb-4">
          Not a clinical diagnosis, medical risk score, or underwriting instrument.
        </p>
      </div>
    </div>
  );
}
