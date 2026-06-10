/* Coa — the 4:6 method engine (Tetsu Kasuya, 2016 WBrC).
 * Splits total water 40% flavor / 60% strength.
 *  - First 40%: two pours. Their split sets acidity<->sweetness.
 *      smaller first pour  = sweeter
 *      larger  first pour  = brighter / more acidic
 *  - Latter 60%: N equal pours. More pours = stronger; fewer = lighter.
 * Pours are spaced 45s; a short drawdown closes the brew.
 * Plain global — no build step. Exposes window.Coa.
 */
(function () {
  const POUR_GAP = 45;     // seconds between pour starts
  const DRAWDOWN = 30;     // seconds from last pour to removing the dripper

  function fmtTime(s) {
    const m = Math.floor(s / 60);
    const r = Math.round(s % 60);
    return m + ':' + String(r).padStart(2, '0');
  }
  function fmtG(g) { return Math.round(g); }

  // acidity: -1 (sweet) .. 0 (balanced) .. +1 (acidic/bright)
  // strengthPours: integer count of latter-60% pours (1..4); 3 = standard
  function computeRecipe(opts) {
    const dose = opts.dose;
    const ratio = opts.ratio;
    const acidity = clamp(opts.acidity ?? 0, -1, 1);
    const N = Math.max(1, Math.round(opts.strengthPours ?? 3));

    const water = dose * ratio;
    const flavor = water * 0.4;
    const strength = water * 0.6;

    // first pour grows toward acidity, shrinks toward sweetness (30%..70% of flavor)
    const f1 = flavor * (0.5 + 0.25 * acidity);
    const f2 = flavor - f1;
    const sPour = strength / N;

    const amounts = [f1, f2];
    for (let i = 0; i < N; i++) amounts.push(sPour);

    const labels = ['First pour', 'Second pour'];
    for (let i = 0; i < N; i++) labels.push(N === 1 ? 'Strength pour' : 'Strength ' + (i + 1));

    const phase = ['flavor', 'flavor'];
    for (let i = 0; i < N; i++) phase.push('strength');

    let cum = 0;
    const steps = amounts.map((amt, i) => {
      cum += amt;
      return {
        index: i,
        t: i * POUR_GAP,
        time: fmtTime(i * POUR_GAP),
        pour: amt,
        pourG: fmtG(amt),
        cumulative: cum,
        cumulativeG: fmtG(cum),
        label: labels[i],
        phase: phase[i],
        fraction: cum / water,
      };
    });

    const removeAt = (amounts.length - 1) * POUR_GAP + DRAWDOWN;

    return {
      dose, ratio, water, waterG: fmtG(water),
      flavor, strength, nPours: amounts.length, strengthPours: N,
      acidity,
      steps,
      removeAt, removeTime: fmtTime(removeAt),
      totalTime: fmtTime(removeAt),
    };
  }

  // taste descriptor from acidity value
  function tasteLabel(a) {
    if (a <= -0.66) return 'Sweet, round';
    if (a < -0.15) return 'Sweet-leaning';
    if (a <= 0.15) return 'Balanced';
    if (a < 0.66) return 'Bright-leaning';
    return 'Bright, juicy';
  }
  function strengthLabel(n) {
    return ({ 1: 'Light', 2: 'Medium-light', 3: 'Medium (standard)', 4: 'Strong' })[n] || 'Medium';
  }
  // water temp guidance by roast
  const TEMP = { light: 93, medium: 88, dark: 83, standard: 92 };

  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  window.Coa = { computeRecipe, fmtTime, fmtG, tasteLabel, strengthLabel, TEMP, POUR_GAP, DRAWDOWN, clamp };
})();
