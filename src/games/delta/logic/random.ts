export interface RandomDraw {
  value: number;
  rng: number;
}

// mulberry32, split into a pure function: the generator state lives in DeltaState.rng.
export function nextRandom(rng: number): RandomDraw {
  const next = (rng + 0x6d2b79f5) | 0;
  let t = Math.imul(next ^ (next >>> 15), next | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, rng: next };
}
