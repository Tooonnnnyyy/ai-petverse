// Seeded randomness (spec §10.1). Same seed, same sequence, so pet behaviour and tests are reproducible.

export type Rng = {
  next(): number; // [0,1)
  int(min: number, maxIncl: number): number;
  range(min: number, max: number): number; // uniform float
  pick<T>(xs: readonly T[]): T;
  weighted<T>(items: ReadonlyArray<readonly [T, number]>): T;
  state(): number; // persist into PetState.rngState
};

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int(min, maxIncl) {
      return min + Math.floor(next() * (maxIncl - min + 1));
    },
    range(min, max) {
      return min + next() * (max - min);
    },
    pick(xs) {
      if (xs.length === 0) throw new Error("pick from empty list");
      return xs[Math.floor(next() * xs.length)];
    },
    weighted(items) {
      const total = items.reduce((sum, [, w]) => sum + Math.max(0, w), 0);
      if (total <= 0) throw new Error("weighted pick needs a positive weight");
      let roll = next() * total;
      for (const [value, w] of items) {
        roll -= Math.max(0, w);
        if (roll < 0) return value;
      }
      return items[items.length - 1][0];
    },
    state() {
      return a;
    },
  };
}

/** FNV-1a hash of the label, xor the install seed. */
export function deriveSeed(installSeed: number, label: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < label.length; i += 1) {
    h ^= label.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return (h ^ installSeed) >>> 0;
}

export function seededShuffle<T>(xs: readonly T[], seed: number): T[] {
  const rng = mulberry32(seed);
  const out = xs.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = rng.int(0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** A fresh install seed; the only non-deterministic call, used once per install. */
export function newInstallSeed(): number {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    return crypto.getRandomValues(new Uint32Array(1))[0];
  }
  return Math.floor(Math.random() * 4294967296) >>> 0;
}
