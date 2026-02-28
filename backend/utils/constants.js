const SESSION_TYPES = [
  'Strength Training',
  'Mobility & Balance',
  'Low-Impact Cardio',
  'Yoga',
  'Pelvic Floor & Core',
  'Stretch & Release',
  'Walk & Breathe',
];

const ENERGY_SCORES = {
  20: { label: 'Wrecked', emoji: '💀' },
  40: { label: 'Meh',     emoji: '😐' },
  65: { label: 'Solid',   emoji: '✊' },
  85: { label: 'Strong',  emoji: '🔥' },
};

const PAIN_MATRIX = {
  Sharp: {
    rule: 'Avoid loading this joint; substitute with contralateral or unaffected movement.',
    regions: {
      Knees:           'No squats, lunges, step-ups. Upper-body or supine core only.',
      Hips:            'No lateral leg raises, hip hinges under load. Seated or supine work.',
      'Low Back':      'No deadlifts, bent-over rows. Supine or standing with neutral spine.',
      Shoulders:       'No overhead pressing. Push/pull from hips down only.',
      Neck:            'No neck flexion/extension under load. Avoid prone positions.',
      'Wrists/Hands':  'No weight-bearing on wrists. Fist or forearm modifications.',
      'Feet/Ankles':   'Seated or supine only.',
      'Upper Back':    'No heavy rowing or pulling. Gentle mobility instead.',
      'Core/Abdominal':'No loaded flexion. Diaphragmatic breathing cues only.',
    },
  },
  Stiffness: {
    rule: 'Open with 5-min mobility targeting this region before any loading.',
    regions: {
      Knees:           'Add quad/hamstring mobility; limit deep knee flexion initially.',
      Hips:            'Add hip flexor and glute mobility; OK to load once warm.',
      'Low Back':      'Cat-cow and hip circles first; limit spinal flexion under load.',
      Shoulders:       'Shoulder circles, cross-body stretch first; OK to press once warm.',
      Neck:            'Neck rolls and chin tucks; avoid heavy overhead.',
      'Wrists/Hands':  'Wrist circles; use wraps if needed.',
      'Feet/Ankles':   'Ankle circles; prefer cushioned footwear cue.',
      'Upper Back':    'Thoracic extension first; can row with light load.',
      'Core/Abdominal':'Diaphragmatic breath + gentle stretch; avoid high-load flexion.',
    },
  },
  Weakness: {
    rule: 'Reduce load by 30–40%; add unilateral work to address imbalance.',
    regions: {
      Knees:           'Use lighter load, add single-leg focus if pain-free.',
      Hips:            'Banded clamshells, lighter hip hinge.',
      'Low Back':      'Bird-dog, dead bug before any loading.',
      Shoulders:       'Light external rotation work, band pull-aparts.',
      Neck:            'Isometric neck strengthening only.',
      'Wrists/Hands':  'Lighter grip, focus on forearm activation.',
      'Feet/Ankles':   'Single-leg balance, towel toe curls.',
      'Upper Back':    'Band rows, face pulls at lighter resistance.',
      'Core/Abdominal':'Dead bug, transverse abdominis activation.',
    },
  },
};

module.exports = { SESSION_TYPES, ENERGY_SCORES, PAIN_MATRIX };
