// Mock data for the workout app

const TODAY_WORKOUT = {
  name: 'Lower Body Power',
  duration: '45–55 min',
  exercises: 4,
  targetMuscles: ['quads', 'glutes', 'hamstrings', 'calves', 'abs'],
  rationale: 'You haven\u2019t trained legs in 4 days. Recovery is high.',
};

const WEEK_PLAN = [
  { day: 'Mon', label: 'M', type: 'strength', name: 'Push', done: true },
  { day: 'Tue', label: 'T', type: 'cardio',   name: 'Easy Run 30m', done: true },
  { day: 'Wed', label: 'W', type: 'strength', name: 'Pull', done: true },
  { day: 'Thu', label: 'T', type: 'rest',     name: 'Rest', done: true },
  { day: 'Fri', label: 'F', type: 'strength', name: 'Lower Body Power', done: false, today: true },
  { day: 'Sat', label: 'S', type: 'cardio',   name: 'Long Run 6.5mi', done: false },
  { day: 'Sun', label: 'S', type: 'rest',     name: 'Rest', done: false },
];

const EXERCISES = [
  {
    id: 'squat', name: 'Back Squat',
    target: { sets: 4, reps: 6, weight: 185 },
    suggested: { weight: 185, hint: 'Bump 5 lb — last week\u2019s sets all RPE \u2264 8' },
    last: [
      { reps: 6, weight: 175, rpe: 7 },
      { reps: 6, weight: 180, rpe: 8 },
      { reps: 6, weight: 180, rpe: 8 },
      { reps: 5, weight: 180, rpe: 9 },
    ],
    rest: 180,
    cues: ['Brace before unrack', 'Knees track over toes', 'Drive through heels'],
    primary: ['quads', 'glutes'],
    secondary: ['hamstrings', 'abs'],
  },
  {
    id: 'rdl', name: 'Romanian Deadlift',
    target: { sets: 4, reps: 8, weight: 165 },
    suggested: { weight: 165, hint: 'Hold — top set was RPE 9' },
    last: [
      { reps: 8, weight: 155, rpe: 7 },
      { reps: 8, weight: 160, rpe: 8 },
      { reps: 8, weight: 160, rpe: 8 },
      { reps: 7, weight: 165, rpe: 9 },
    ],
    rest: 150,
    cues: ['Hinge at hips', 'Bar close to legs', 'Feel hamstring stretch'],
    primary: ['hamstrings', 'glutes'],
    secondary: ['back'],
  },
  {
    id: 'lunge', name: 'Walking Lunges',
    target: { sets: 3, reps: 10, weight: 35 },
    suggested: { weight: 35, hint: '+5 lb — last set hit clean' },
    last: [
      { reps: 10, weight: 30, rpe: 7 },
      { reps: 10, weight: 30, rpe: 7 },
      { reps: 10, weight: 35, rpe: 8 },
    ],
    rest: 120,
    cues: ['Step long, knee 90\u00b0', 'Torso upright', 'Drive off front heel'],
    primary: ['quads', 'glutes'],
    secondary: [],
  },
  {
    id: 'calf', name: 'Standing Calf Raise',
    target: { sets: 3, reps: 15, weight: 90 },
    suggested: { weight: 90, hint: 'Match last week — full ROM focus' },
    last: [
      { reps: 15, weight: 85, rpe: 7 },
      { reps: 15, weight: 85, rpe: 8 },
      { reps: 15, weight: 90, rpe: 8 },
    ],
    rest: 90,
    cues: ['Pause at top', 'Slow eccentric', 'Full ROM'],
    primary: ['calves'],
    secondary: [],
  },
];

// 12 weeks of weight history
const BODY_HISTORY = (() => {
  const out = [];
  const start = new Date(2026, 1, 16); // Feb 16
  let w = 192.0, m = 140.4, f = 19.4;
  for (let i = 0; i < 84; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    // weight slowly drops
    w -= 0.10 + (Math.random() - 0.5) * 0.6;
    m += 0.025 + (Math.random() - 0.5) * 0.15;
    f -= 0.035 + (Math.random() - 0.5) * 0.1;
    out.push({
      date: d,
      weight: +w.toFixed(1),
      muscle: +m.toFixed(1),
      fat: +f.toFixed(1),
    });
  }
  return out;
})();

const RECENT_SESSIONS = [
  { date: 'Wed, May 6', name: 'Pull Day', volume: 18420, sets: 16, duration: 52, rpe: 7.8 },
  { date: 'Tue, May 5', name: 'Easy Run · 3.2 mi', distance: 3.2, pace: '9:42', duration: 31, hr: 142 },
  { date: 'Mon, May 4', name: 'Push Day', volume: 16180, sets: 15, duration: 48, rpe: 7.6 },
  { date: 'Sat, May 2', name: 'Long Run · 6.1 mi', distance: 6.1, pace: '9:08', duration: 56, hr: 156 },
  { date: 'Fri, May 1', name: 'Lower Body Power', volume: 21340, sets: 14, duration: 54, rpe: 8.1 },
];

const MEDICATIONS = [
  // Note: GLP-1 is intentionally low-key, listed alongside daily meds
  { id: 'vit-d',    name: 'Vitamin D3',     dose: '5000 IU',  schedule: 'Daily · AM',     last: 'Today, 7:14 AM',  next: 'Tomorrow, AM',    streak: 28 },
  { id: 'mag',      name: 'Magnesium',      dose: '400 mg',   schedule: 'Daily · PM',     last: 'Yesterday, 9:30 PM', next: 'Tonight, PM',  streak: 22 },
  { id: 'omega',    name: 'Omega-3',        dose: '2 g',      schedule: 'Daily · AM',     last: 'Today, 7:14 AM',  next: 'Tomorrow, AM',    streak: 28 },
  { id: 'bp',       name: 'Lisinopril',     dose: '10 mg',    schedule: 'Daily · AM',     last: 'Today, 7:14 AM',  next: 'Tomorrow, AM',    streak: 412 },
  { id: 'glp',      name: 'GLP-1',          dose: '5 mg',     schedule: 'Weekly · Tue',   last: 'Tue, May 5',      next: 'Tue, May 12',     streak: 8, weekly: true },
];

const INTEGRATIONS = [
  { name: 'Apple Health',   status: 'connected', synced: '2 min ago',   icon: 'heart' },
  { name: 'Garmin',         status: 'connected', synced: '14 min ago',  icon: 'watch' },
  { name: 'Whoop',          status: 'connected', synced: '8 min ago',   icon: 'circle' },
  { name: 'Withings Scale', status: 'connected', synced: 'this morning',icon: 'scale' },
  { name: 'MyFitnessPal',   status: 'available', synced: null,          icon: 'plate' },
];

const RECOVERY = { score: 84, sleep: 7.3, hrv: 62, rhr: 54, strain: 12.4 };

window.MOCK = { TODAY_WORKOUT, WEEK_PLAN, EXERCISES, BODY_HISTORY, RECENT_SESSIONS, MEDICATIONS, INTEGRATIONS, RECOVERY };
