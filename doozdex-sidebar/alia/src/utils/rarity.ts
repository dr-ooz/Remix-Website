// How widely a move is spread, worked out live from the learnsets (so it follows every learnset update).
// Most common first: the "Rarity" sort uses this order, the who-learns-it popup shows the label.
export const RARITY_TIERS = [
  { full: "Universal", short: "Universal" },
  { full: "Near Universal", short: "Near Universal" },
  { full: "Very Widespread", short: "Very Wide" },
  { full: "Widespread", short: "Widespread" },
  { full: "Semi-Limited Distribution", short: "Semi-Limited" },
  { full: "Limited Distribution", short: "Limited" },
  { full: "Exclusive Distribution", short: "Exclusive" },
  { full: "Signature Move", short: "Signature" },
] as const;

// lines = separate evolution lines that learn it, mons = Pokemon that learn it, all = every usable Pokemon.
// By share of all Pokemon, then by count, then by evolution lines. -1 = nobody learns it.
export const rarityTier = (lines: number, mons: number, all: number) => {
  if (!lines) return -1;
  if (all && mons >= all * 0.9) return 0;
  if (all && mons >= all * 0.75) return 1;
  if (mons > 100) return 2;
  if (mons > 50) return 3;
  if (lines < 5) return 7;
  if (lines < 10) return 6;
  if (lines <= 20) return 5;
  return 4;
};

// every move's learners: how many Pokemon, how many evolution lines (Megas / Primals count as their base), and the
// earliest Remix dex position among them (to order moves inside a tier)
export const moveSpread = (pd: Record<string, PokemonData>) => {
  const byName: Record<string, any> = {};
  for (const p of Object.values(pd)) byName[p.name] = p;
  const root = (name: string) => {
    let n = name.replace(/-(Mega|Primal)(-[XY])?$/, "");
    if (!byName[n]) n = name;
    let guard = 0;
    while (byName[n]?.prevo && byName[byName[n].prevo] && guard++ < 6) n = byName[n].prevo;
    return n;
  };
  const out: Record<string, { mons: number; roots: Set<string>; dex: number }> = {};
  let all = 0;
  for (const p of Object.values(pd)) {
    if (p.unusable) continue;
    all++;
    const r = root(p.name);
    const dex = (p as any).dexOrder ?? 1e6;
    for (const id of new Set(p.learntMoves.map((m) => nameToId(m[0])))) {
      const o = (out[id] ??= { mons: 0, roots: new Set(), dex: 1e6 });
      o.mons++;
      o.roots.add(r);
      if (dex < o.dex) o.dex = dex;
    }
  }
  return { all, byMove: out };
};
