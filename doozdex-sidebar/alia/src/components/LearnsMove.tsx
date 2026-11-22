import clsx from "clsx";

type How = number | "tm" | "tutor";
type Learner = [PokemonData, How];
// Remix: one row per family (the dex order board's families), members side by side in dex order.
// The row shows the first member's (the pre-evo's) way of learning it - when a family differs it's just a typo.
type FamilyRow = { members: Learner[]; how: How; label: string };

const howRank = (h: How) => (typeof h === "number" ? h : h === "tm" ? 1000 : 1001);
const howLabel = (how: How) =>
  how === 0 ? (
    "–"
  ) : typeof how === "number" ? (
    <span>
      <span class="text-xs">Lv</span>
      {how}
    </span>
  ) : (
    <img src={`/icons/${how}.webp`} class="mx-auto h-full max-h-7 py-0.5" />
  );

const LINE_H = 50;
// a family's sprites go together (up to 3); bigger families in pairs
const bundles = (m: Learner[]) => {
  const size = m.length <= 3 ? m.length : 2;
  const out: Learner[][] = [];
  for (let i = 0; i < m.length; i += size) out.push(m.slice(i, i + size));
  return out;
};

export function LearnsMove(props: { move: string; close: () => void; datasetId: string }) {
  const pokedex = usePokedex();
  const mid = nameToId(props.move);
  const SORTS: [string, string][] = [["lvl", "Level ↑"], ["lvlDesc", "Level ↓"], ["name", "Name A–Z"], ["dex", "Dex order"]];
  const [sortBy, setSortBy] = createSignal<string>((() => { try { return localStorage.getItem("dzLearnSort") === "lvlDesc" ? "lvlDesc" : "lvl"; } catch { return "lvl"; } })());
  const chooseSort = (v: string) => { setSortBy(v); try { localStorage.setItem("dzLearnSort", v); } catch { /* private mode */ } };

  const learnsIt = createMemo(() => {
    const pd = pokedex();
    if (!pd) return [] as FamilyRow[];
    const learners: Learner[] = Object.values(pd)
      .filter((p) => p.learntMoves.find((i) => !p.unusable && nameToId(i[0]) === mid))
      .map((p) => [p, p.learntMoves.find((i) => nameToId(i[0]) === mid)![1]] as Learner);
    // group by family (Pokemon without one stand alone)
    const groups = new Map<string, Learner[]>();
    for (const l of learners) {
      const fam = (l[0] as any).family;
      const key = fam != null ? "f" + fam : "p" + l[0].name;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(l);
    }
    // which member's level the row shows: the one you'd have AT that level (level 13 Beldum, level 30 Metang,
    // level 47 Metagross), using the game's evolution levels; otherwise the first (pre-evo) one
    const byName: Record<string, PokemonData> = {};
    for (const p of Object.values(pd)) byName[p.name] = p;
    const fromLevel = (p: PokemonData) => ((p as any).prevo && (byName[(p as any).prevo] as any)?.evoAt) || 0;
    // evolution lines from the evo data (prevo / evos); Megas / Primals count as their base Pokemon
    const baseOf = (name: string) => (/-(Mega|Primal)(-[XY])?$/.test(name) && byName[name.replace(/-(Mega|Primal)(-[XY])?$/, "")] ? name.replace(/-(Mega|Primal)(-[XY])?$/, "") : name);
    const rootOf = (name: string) => {
      let n = baseOf(name), guard = 0;
      while ((byName[n] as any)?.prevo && byName[(byName[n] as any).prevo] && guard++ < 6) n = (byName[n] as any).prevo;
      return n;
    };
    const lineOf = (root: string) => {
      const out: string[] = [], todo = [root];
      while (todo.length) {
        const n = todo.shift()!;
        const q = byName[n];
        if (!q || out.includes(n)) continue;
        if (!(q as any).unusable) out.push(n);
        for (const e of ((q as any).evos || []) as string[]) todo.push(e);
      }
      return out;
    };
    const joinNames = (names: string[]) =>
      names.length <= 1 ? names.join("") : names.length === 2 ? names.join(" & ") : names.slice(0, -1).join(", ") + " & " + names[names.length - 1];
    const rowLabel = (ms: PokemonData[]) => {
      const lines = new Map<string, string[]>();
      for (const m of ms) {
        const r = rootOf(m.name);
        if (!lines.has(r)) lines.set(r, []);
        const b = baseOf(m.name);
        if (!lines.get(r)!.includes(b)) lines.get(r)!.push(b);
      }
      return [...lines.entries()]
        .map(([root, have]) => {
          const full = lineOf(root);
          return full.length > 1 && full.every((n) => have.includes(n)) ? root + " line" : joinNames(have);
        })
        .join(" · ");
    };
    const rows: FamilyRow[] = [...groups.values()].map((members) => {
      members.sort((a, b) => ((a[0] as any).dexOrder ?? 0) - ((b[0] as any).dexOrder ?? 0));
      const current = members.find(
        ([p, how]) => typeof how === "number" && how >= fromLevel(p) && ((p as any).evoAt == null || how < (p as any).evoAt),
      );
      return { members, how: (current ?? members[0]!)[1], label: rowLabel(members.map((m) => m[0])) };
    });
    // level 1, 2, ... then TM, then tutor (default); or high -> low (TM / tutor still last); or by name; or by dex order
    const lvlKey = (r: FamilyRow) => (typeof r.how === "number" ? r.how : null);
    const dexKey = (r: FamilyRow) => (r.members[0]![0] as any).dexOrder ?? 0;
    const by = sortBy();
    if (by === "name") return rows.toSorted((a, b) => a.label.localeCompare(b.label));
    if (by === "dex") return rows.toSorted((a, b) => dexKey(a) - dexKey(b));
    if (by === "lvlDesc")
      return rows.toSorted((a, b) => {
        const x = lvlKey(a), y = lvlKey(b);
        if (x != null && y != null) return y - x || dexKey(a) - dexKey(b);
        if (x != null) return -1;
        if (y != null) return 1;
        return howRank(a.how) - howRank(b.how);
      });
    return rows.toSorted((a, b) => howRank(a.how) - howRank(b.how) || dexKey(a) - dexKey(b));
  });

  // a plain list (a move has a few hundred learners at most): every row is as tall as its content, so rows never overlap
  return (
    <div
      class="absolute inset-0 z-10 backdrop-blur-md backdrop-brightness-80"
      onClick={props.close}
    >
      <div
        class="absolute inset-4 flex flex-col rounded border-x border-t bg-black shadow"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="flex h-8 shrink-0 border-b">
          <div class="flex flex-auto items-center px-2 font-bold">{props.move}</div>
          <button
            type="button"
            class="my-1 mr-1 cursor-pointer rounded border px-2 text-[13px] font-bold hover:bg-white/10"
            title={sortBy() === "lvlDesc" ? "Highest level first (click for lowest first)" : "Lowest level first (click for highest first)"}
            onClick={() => chooseSort(sortBy() === "lvlDesc" ? "lvl" : "lvlDesc")}
          >
            Sort: Lv {sortBy() === "lvlDesc" ? "▼" : "▲"}
          </button>
          <div
            onClick={props.close}
            class="flex aspect-square cursor-pointer items-center justify-center border-l"
          >
            X
          </div>
        </div>

        <div class="relative flex-auto overflow-auto">
          <For each={learnsIt()}>
            {(row) => (
              <div class="flex border-b" style={{ "min-height": `${LINE_H}px` }}>
                <div class="flex w-11 shrink-0 items-center justify-center border-r text-center">{howLabel(row.how)}</div>
                <div class="flex min-w-0 flex-auto flex-wrap items-center">
                  {/* the sprites sit together, then their names; families of 4+ go in pairs (2 sprites + their 2 names) */}
                  <div class="flex min-w-0 flex-auto items-center">
                  <div class="flex shrink-0 flex-col">
                  <For each={bundles(row.members)}>
                    {(bundle) => (
                      <div class="flex min-w-0 max-w-full items-center pr-3" style={{ "min-height": `${LINE_H}px` }}>
                        <div class="flex shrink-0">
                          <For each={bundle}>
                            {([p]) => (
                              <div
                                class={clsx("aspect-square shrink-0", p.range && "cursor-pointer hover:brightness-125")}
                                style={{
                                  height: `${LINE_H}px`,
                                  "margin-right": "-6px",
                                  "background-image": `url(/calcsprites/${nameToId(p.name)}.png), url(/sprites/${nameToId(p.name)}.png)`,
                                  "background-size": "contain",
                                  "background-repeat": "no-repeat",
                                  "background-position": "center",
                                  "image-rendering": "pixelated",
                                  transform: "scaleX(-1)",
                                }}
                                onClick={() => p.range && openRange(p.range)}
                                title={p.name}
                              />
                            )}
                          </For>
                        </div>

                      </div>
                    )}
                  </For>
                  </div>
                  <div class="min-w-0 pl-2.5 text-[13px] leading-tight opacity-90">{row.label}</div>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}
