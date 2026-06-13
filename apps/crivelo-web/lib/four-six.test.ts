import { describe, it, expect } from 'vitest';
import {
  computeRecipe,
  tasteLabel,
  strengthLabel,
  fmtTime,
  fmtG,
  clamp,
  finiteOr,
  buildPhases,
  POUR_GAP,
  DRAWDOWN,
  POUR_SECS,
  TEMP,
  type Recipe,
  type TimerPhase,
} from './four-six';

describe('constants', () => {
  it('uses the canonical 4:6 timing constants', () => {
    expect(POUR_GAP).toBe(45);
    expect(DRAWDOWN).toBe(30);
  });

  it('exposes the presentation-only pour window', () => {
    expect(POUR_SECS).toBe(9);
  });

  it('exposes the roast temperature table', () => {
    expect(TEMP).toEqual({ light: 93, medium: 88, dark: 83, standard: 92 });
  });
});

describe('computeRecipe — balanced baseline (canonical schedule)', () => {
  // 20 g / 1:15 / acidity 0 / 3 pours -> the reference schedule the spec pins.
  const r = computeRecipe({ dose: 20, ratio: 15, acidity: 0, strengthPours: 3 });

  it('totals 300 g of water (dose × ratio)', () => {
    expect(r.water).toBe(300);
    expect(r.waterG).toBe(300);
  });

  it('produces 5 pours (2 flavor + 3 strength)', () => {
    expect(r.nPours).toBe(5);
    expect(r.steps).toHaveLength(5);
  });

  it('matches the canonical cumulative grams 60/120/180/240/300', () => {
    expect(r.steps.map((s) => s.cumulativeG)).toEqual([60, 120, 180, 240, 300]);
    expect(r.steps.map((s) => s.cumulative)).toEqual([60, 120, 180, 240, 300]);
  });

  it('matches the canonical per-pour grams 60/60/60/60/60', () => {
    expect(r.steps.map((s) => s.pourG)).toEqual([60, 60, 60, 60, 60]);
    expect(r.steps.map((s) => s.pour)).toEqual([60, 60, 60, 60, 60]);
  });

  it('matches the canonical pour times 0:00/0:45/1:30/2:15/3:00', () => {
    expect(r.steps.map((s) => s.t)).toEqual([0, 45, 90, 135, 180]);
    expect(r.steps.map((s) => s.time)).toEqual([
      '0:00',
      '0:45',
      '1:30',
      '2:15',
      '3:00',
    ]);
  });

  it('removes the dripper at 210 s (3:30)', () => {
    expect(r.removeAt).toBe(210);
    expect(r.removeTime).toBe('3:30');
    expect(r.totalTime).toBe('3:30');
  });

  it('labels and phases the pours correctly', () => {
    expect(r.steps.map((s) => s.label)).toEqual([
      'First pour',
      'Second pour',
      'Strength 1',
      'Strength 2',
      'Strength 3',
    ]);
    expect(r.steps.map((s) => s.phase)).toEqual([
      'flavor',
      'flavor',
      'strength',
      'strength',
      'strength',
    ]);
  });

  it('splits 40% flavor / 60% strength', () => {
    expect(r.flavor).toBe(120);
    expect(r.strength).toBe(180);
  });
});

describe('computeRecipe — acidity controls the flavor split (f1)', () => {
  // f1 = flavor × (0.5 + 0.25·acidity). Across acidity -1..+1 the first pour
  // therefore ranges 0.25..0.75 of the flavor water (the reference engine's
  // exact coefficients; the spec prose's "30–70%" is a loose approximation —
  // the source of truth is coa-engine.js, which uses 0.5 ± 0.25).
  const flavor = (water: number) => water * 0.4;

  it('acidity 0 -> 50/50 split of the flavor water', () => {
    const r = computeRecipe({ dose: 20, ratio: 15, acidity: 0, strengthPours: 3 });
    const f = flavor(r.water); // 120
    expect(r.steps[0].pour).toBeCloseTo(f * 0.5, 10); // 60
    expect(r.steps[1].pour).toBeCloseTo(f * 0.5, 10); // 60
    expect(r.steps[0].pour).toBeCloseTo(60, 10);
  });

  it('acidity -1 -> first pour is 25% of the flavor water (sweeter)', () => {
    const r = computeRecipe({ dose: 20, ratio: 15, acidity: -1, strengthPours: 3 });
    const f = flavor(r.water); // 120
    expect(r.steps[0].pour).toBeCloseTo(f * (0.5 + 0.25 * -1), 10); // 30
    expect(r.steps[1].pour).toBeCloseTo(f * (0.5 - 0.25 * -1), 10); // 90
    expect(r.steps[0].pour).toBeCloseTo(30, 10);
  });

  it('acidity +1 -> first pour is 75% of the flavor water (brighter)', () => {
    const r = computeRecipe({ dose: 20, ratio: 15, acidity: 1, strengthPours: 3 });
    const f = flavor(r.water); // 120
    expect(r.steps[0].pour).toBeCloseTo(f * (0.5 + 0.25 * 1), 10); // 90
    expect(r.steps[1].pour).toBeCloseTo(f * (0.5 - 0.25 * 1), 10); // 30
    expect(r.steps[0].pour).toBeCloseTo(90, 10);
  });

  it('f1 + f2 always equals the flavor water (the first 40%)', () => {
    for (const acidity of [-1, -0.5, 0, 0.33, 1]) {
      const r = computeRecipe({ dose: 18, ratio: 16, acidity, strengthPours: 3 });
      expect(r.steps[0].pour + r.steps[1].pour).toBeCloseTo(r.flavor, 10);
    }
  });
});

describe('computeRecipe — strengthPours controls count, grams and removeAt', () => {
  for (const n of [1, 2, 3, 4]) {
    it(`strengthPours ${n} -> ${2 + n} total pours`, () => {
      const r = computeRecipe({ dose: 20, ratio: 15, acidity: 0, strengthPours: n });
      expect(r.strengthPours).toBe(n);
      expect(r.nPours).toBe(2 + n);
      expect(r.steps).toHaveLength(2 + n);
    });

    it(`strengthPours ${n} -> ${n} equal strength pours`, () => {
      const r = computeRecipe({ dose: 20, ratio: 15, acidity: 0, strengthPours: n });
      const strengthSteps = r.steps.filter((s) => s.phase === 'strength');
      expect(strengthSteps).toHaveLength(n);
      const expected = r.strength / n;
      for (const s of strengthSteps) expect(s.pour).toBeCloseTo(expected, 10);
    });

    it(`strengthPours ${n} -> removeAt = (nPours-1)*45 + 30`, () => {
      const r = computeRecipe({ dose: 20, ratio: 15, acidity: 0, strengthPours: n });
      const expected = (r.nPours - 1) * POUR_GAP + DRAWDOWN;
      expect(r.removeAt).toBe(expected);
    });
  }

  it('single strength pour is labelled "Strength pour"', () => {
    const r = computeRecipe({ dose: 20, ratio: 15, acidity: 0, strengthPours: 1 });
    expect(r.steps[2].label).toBe('Strength pour');
  });
});

describe('computeRecipe — water scales with dose × ratio', () => {
  const cases: Array<[number, number, number]> = [
    [20, 15, 300],
    [15, 15, 225],
    [18, 16, 288],
    [30, 12, 360],
    [8, 18, 144],
  ];
  for (const [dose, ratio, water] of cases) {
    it(`${dose} g × 1:${ratio} = ${water} g`, () => {
      const r = computeRecipe({ dose, ratio, acidity: 0, strengthPours: 3 });
      expect(r.water).toBe(water);
      expect(r.dose).toBe(dose);
      expect(r.ratio).toBe(ratio);
    });
  }
});

describe('computeRecipe — clamps and rounding', () => {
  it('clamps acidity below -1 up to -1', () => {
    const r = computeRecipe({ dose: 20, ratio: 15, acidity: -5, strengthPours: 3 });
    expect(r.acidity).toBe(-1);
    expect(r.steps[0].pour).toBeCloseTo(r.flavor * 0.25, 10);
  });

  it('clamps acidity above +1 down to +1', () => {
    const r = computeRecipe({ dose: 20, ratio: 15, acidity: 5, strengthPours: 3 });
    expect(r.acidity).toBe(1);
    expect(r.steps[0].pour).toBeCloseTo(r.flavor * 0.75, 10);
  });

  it('clamps strengthPours below 1 up to 1', () => {
    const r = computeRecipe({ dose: 20, ratio: 15, acidity: 0, strengthPours: 0 });
    expect(r.strengthPours).toBe(1);
  });

  it('clamps strengthPours above 4 down to 4', () => {
    const r = computeRecipe({ dose: 20, ratio: 15, acidity: 0, strengthPours: 9 });
    expect(r.strengthPours).toBe(4);
  });

  it('rounds fractional strengthPours to the nearest integer', () => {
    expect(
      computeRecipe({ dose: 20, ratio: 15, acidity: 0, strengthPours: 2.4 }).strengthPours,
    ).toBe(2);
    expect(
      computeRecipe({ dose: 20, ratio: 15, acidity: 0, strengthPours: 2.6 }).strengthPours,
    ).toBe(3);
  });

  it('defaults acidity to 0 and strengthPours to 3 when omitted', () => {
    const r = computeRecipe({ dose: 20, ratio: 15 });
    expect(r.acidity).toBe(0);
    expect(r.strengthPours).toBe(3);
  });
});

describe('computeRecipe — schedule invariants', () => {
  it('cumulative grams are strictly monotonic and end at total water', () => {
    for (const opts of [
      { dose: 20, ratio: 15, acidity: 0, strengthPours: 3 },
      { dose: 18, ratio: 16, acidity: -1, strengthPours: 1 },
      { dose: 30, ratio: 12, acidity: 1, strengthPours: 4 },
    ]) {
      const r = computeRecipe(opts);
      for (let i = 1; i < r.steps.length; i++) {
        expect(r.steps[i].cumulative).toBeGreaterThan(r.steps[i - 1].cumulative);
      }
      const last = r.steps[r.steps.length - 1];
      expect(last.cumulative).toBeCloseTo(r.water, 10);
      expect(last.fraction).toBeCloseTo(1, 10);
    }
  });

  it('pour times advance by POUR_GAP each step starting at 0', () => {
    const r = computeRecipe({ dose: 20, ratio: 15, acidity: 0, strengthPours: 4 });
    r.steps.forEach((s, i) => expect(s.t).toBe(i * POUR_GAP));
  });
});

describe('computeRecipe — guards non-finite inputs (no NaN leaks)', () => {
  // Helper: every numeric field across the recipe is a finite number.
  const allFinite = (r: Recipe) => {
    expect(Number.isFinite(r.water)).toBe(true);
    expect(Number.isFinite(r.removeAt)).toBe(true);
    for (const s of r.steps) {
      expect(Number.isFinite(s.pour)).toBe(true);
      expect(Number.isFinite(s.cumulative)).toBe(true);
      expect(Number.isFinite(s.fraction)).toBe(true);
    }
  };

  it('acidity NaN behaves as acidity 0 (balanced 60/60 split at baseline)', () => {
    const r = computeRecipe({ dose: 20, ratio: 15, acidity: NaN, strengthPours: 3 });
    expect(r.acidity).toBe(0);
    expect(r.steps[0].pour).toBeCloseTo(60, 10);
    expect(r.steps[1].pour).toBeCloseTo(60, 10);
    allFinite(r);
  });

  it('strengthPours NaN behaves as 3 pours', () => {
    const r = computeRecipe({ dose: 20, ratio: 15, acidity: 0, strengthPours: NaN });
    expect(r.strengthPours).toBe(3);
    expect(r.nPours).toBe(5);
    allFinite(r);
  });

  it('strengthPours Infinity clamps to 4', () => {
    const r = computeRecipe({ dose: 20, ratio: 15, acidity: 0, strengthPours: Infinity });
    expect(r.strengthPours).toBe(4);
    expect(r.nPours).toBe(6);
    allFinite(r);
  });

  it('dose NaN behaves as 20 (water 300 at 1:15)', () => {
    const r = computeRecipe({ dose: NaN, ratio: 15, acidity: 0, strengthPours: 3 });
    expect(r.dose).toBe(20);
    expect(r.water).toBe(300);
    allFinite(r);
  });

  it('ratio NaN behaves as 15 (water 300 at 20 g)', () => {
    const r = computeRecipe({ dose: 20, ratio: NaN, acidity: 0, strengthPours: 3 });
    expect(r.ratio).toBe(15);
    expect(r.water).toBe(300);
    allFinite(r);
  });

  it('±Infinity dose/ratio fall back to finite defaults', () => {
    const r = computeRecipe({ dose: Infinity, ratio: -Infinity, acidity: 0, strengthPours: 3 });
    expect(r.dose).toBe(20);
    expect(r.ratio).toBe(15);
    expect(r.water).toBe(300);
    allFinite(r);
  });
});

describe('finiteOr', () => {
  it('passes finite values through and falls back on non-finite ones', () => {
    expect(finiteOr(5, 99)).toBe(5);
    expect(finiteOr(0, 99)).toBe(0);
    expect(finiteOr(-3.5, 99)).toBe(-3.5);
    expect(finiteOr(NaN, 99)).toBe(99);
    expect(finiteOr(Infinity, 99)).toBe(99);
    expect(finiteOr(-Infinity, 99)).toBe(99);
  });
});

describe('clamp', () => {
  it('clamps to the inclusive bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe('fmtTime', () => {
  it('formats seconds as m:ss with zero-padded seconds', () => {
    expect(fmtTime(0)).toBe('0:00');
    expect(fmtTime(45)).toBe('0:45');
    expect(fmtTime(90)).toBe('1:30');
    expect(fmtTime(210)).toBe('3:30');
    expect(fmtTime(605)).toBe('10:05');
  });

  it('rounds the seconds component (no minute carry — reference behavior)', () => {
    // coa-engine.js rounds s % 60 independently of the minutes floor, so a
    // value like 59.6 rounds the seconds to 60 without carrying into minutes.
    // Schedule times are always whole multiples of POUR_GAP, so this edge
    // never arises in practice; the test pins the ported behavior.
    expect(fmtTime(59.4)).toBe('0:59');
    expect(fmtTime(59.6)).toBe('0:60');
  });
});

describe('fmtG', () => {
  it('rounds grams to a whole number', () => {
    expect(fmtG(59.6)).toBe(60);
    expect(fmtG(36)).toBe(36);
    expect(fmtG(83.4)).toBe(83);
  });
});

describe('tasteLabel', () => {
  it('returns the expected descriptor at representative acidity values', () => {
    expect(tasteLabel(-1)).toBe('Sweet, round');
    expect(tasteLabel(-0.66)).toBe('Sweet, round');
    expect(tasteLabel(-0.5)).toBe('Sweet-leaning');
    expect(tasteLabel(0)).toBe('Balanced');
    expect(tasteLabel(0.15)).toBe('Balanced');
    expect(tasteLabel(0.5)).toBe('Bright-leaning');
    expect(tasteLabel(0.66)).toBe('Bright, juicy');
    expect(tasteLabel(1)).toBe('Bright, juicy');
  });
});

describe('strengthLabel', () => {
  it('maps pour counts to the expected descriptors', () => {
    expect(strengthLabel(1)).toBe('Light');
    expect(strengthLabel(2)).toBe('Medium-light');
    expect(strengthLabel(3)).toBe('Medium (standard)');
    expect(strengthLabel(4)).toBe('Strong');
  });

  it('falls back to "Medium" for out-of-range counts', () => {
    expect(strengthLabel(5)).toBe('Medium');
    expect(strengthLabel(0)).toBe('Medium');
  });
});

describe('buildPhases — expands the schedule into pour/draw phases', () => {
  // Canonical recipe: 5 pours -> 10 phases (pour+draw each).
  const r = computeRecipe({ dose: 20, ratio: 15, acidity: 0, strengthPours: 3 });
  const phases = buildPhases(r);

  it('emits 2 phases per step (pour then draw)', () => {
    expect(phases).toHaveLength(2 * r.steps.length);
    phases.forEach((p, i) => {
      expect(p.kind).toBe(i % 2 === 0 ? 'pour' : 'draw');
    });
  });

  it('is contiguous: first starts at 0 and each start meets the prior end', () => {
    expect(phases[0].start).toBe(0);
    for (let i = 1; i < phases.length; i++) {
      expect(phases[i].start).toBe(phases[i - 1].end);
    }
  });

  it('the final draw phase ends exactly at recipe.removeAt', () => {
    const last = phases[phases.length - 1];
    expect(last.kind).toBe('draw');
    expect(last.end).toBe(r.removeAt);
  });

  it('each pour window is min(start + POUR_SECS, drawEnd) and never overruns', () => {
    for (let i = 0; i < r.steps.length; i++) {
      const s = r.steps[i];
      const isLast = i === r.steps.length - 1;
      const drawEnd = isLast ? r.removeAt : r.steps[i + 1].t;
      const pour = phases[2 * i];
      const draw = phases[2 * i + 1];

      expect(pour.start).toBe(s.t);
      expect(pour.end).toBe(Math.min(s.t + POUR_SECS, drawEnd));
      expect(pour.end).toBeLessThanOrEqual(drawEnd);
      expect(draw.start).toBe(pour.end);
      expect(draw.end).toBe(drawEnd);
    }
  });

  it('clamps the pour window to drawEnd when pours are closer than POUR_SECS apart', () => {
    // The real schedule spaces pours POUR_GAP (45 s) apart and ends the last
    // draw DRAWDOWN (30 s) after it — both wider than POUR_SECS (9 s), so the
    // min() clamp never bites on a computed recipe. Hand-build a Recipe-shaped
    // object (NOT via computeRecipe) whose first two pours sit only 5 s apart so
    // drawEnd - start (5) < POUR_SECS (9), forcing the guard to fire.
    const synthetic = {
      steps: [
        { t: 0, cumulativeG: 30, pourG: 30, phase: 'flavor' },
        { t: 5, cumulativeG: 60, pourG: 30, phase: 'strength' },
      ],
      removeAt: 8,
    } as unknown as Recipe;

    const phases = buildPhases(synthetic);
    const firstPour = phases[0];
    const firstDraw = phases[1];

    // start + POUR_SECS would be 9, but drawEnd is only 5 → clamp to drawEnd.
    expect(firstPour.start).toBe(0);
    expect(firstPour.end).toBe(5); // == drawEnd, NOT start + POUR_SECS (9)
    expect(firstPour.end).toBeLessThan(0 + POUR_SECS);
    // The draw phase collapses to zero length: it starts and ends at drawEnd.
    expect(firstDraw.start).toBe(5);
    expect(firstDraw.end).toBe(5);
  });

  it('carries pourNo (1-based), total, target, phase and nextPourStart', () => {
    for (let i = 0; i < r.steps.length; i++) {
      const s = r.steps[i];
      const isLast = i === r.steps.length - 1;
      const expectedNext = isLast ? null : r.steps[i + 1].t;
      for (const p of [phases[2 * i], phases[2 * i + 1]]) {
        expect(p.pourNo).toBe(i + 1);
        expect(p.total).toBe(r.steps.length);
        expect(p.target).toBe(s.cumulativeG);
        expect(p.phase).toBe(s.phase);
        expect(p.nextPourStart).toBe(expectedNext);
        expect(p.isLastPour).toBe(isLast);
      }
    }
  });

  it('sets `add` (grams) on pour phases and leaves it undefined on draw phases', () => {
    for (let i = 0; i < r.steps.length; i++) {
      expect(phases[2 * i].add).toBe(r.steps[i].pourG);
      expect(phases[2 * i + 1].add).toBeUndefined();
    }
  });

  it('edge: a single strength pour (3 pours total) yields 6 contiguous phases', () => {
    const r1 = computeRecipe({ dose: 20, ratio: 15, acidity: 0, strengthPours: 1 });
    const p1 = buildPhases(r1);
    expect(r1.steps).toHaveLength(3);
    expect(p1).toHaveLength(6);

    expect(p1[0].start).toBe(0);
    for (let i = 1; i < p1.length; i++) {
      expect(p1[i].start).toBe(p1[i - 1].end);
    }
    expect(p1[p1.length - 1].end).toBe(r1.removeAt);

    // Last pour: nextPourStart is null and it is flagged as the last.
    const lastPour = p1[p1.length - 2];
    const lastDraw = p1[p1.length - 1];
    expect(lastPour.kind).toBe('pour');
    expect(lastPour.isLastPour).toBe(true);
    expect(lastPour.nextPourStart).toBeNull();
    expect(lastDraw.isLastPour).toBe(true);
    expect(lastDraw.nextPourStart).toBeNull();
  });
});

// Compile-time guard: the exported Recipe type stays consumable by name.
const _typecheck: Recipe = computeRecipe({ dose: 20, ratio: 15 });
void _typecheck;

// Compile-time guard: the exported TimerPhase type stays consumable by name.
const _phase: TimerPhase = buildPhases(computeRecipe({ dose: 20, ratio: 15 }))[0];
void _phase;
