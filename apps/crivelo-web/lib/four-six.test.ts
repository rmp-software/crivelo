import { describe, it, expect } from 'vitest';
import {
  computeRecipe,
  tasteLabel,
  strengthLabel,
  fmtTime,
  fmtG,
  clamp,
  finiteOr,
  POUR_GAP,
  DRAWDOWN,
  TEMP,
  type Recipe,
} from './four-six';

describe('constants', () => {
  it('uses the canonical 4:6 timing constants', () => {
    expect(POUR_GAP).toBe(45);
    expect(DRAWDOWN).toBe(30);
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

// Compile-time guard: the exported Recipe type stays consumable by name.
const _typecheck: Recipe = computeRecipe({ dose: 20, ratio: 15 });
void _typecheck;
