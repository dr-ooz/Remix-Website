import clsx from "clsx";

type How = number | "tm" | "tutor";
type Learner = [PokemonData, How];
// Remix: one row per family (the dex order board's families), members side by side in dex order.
// The row shows the first member's (the pre-evo's) way of learning it - when a family differs it's just a typo.
type FamilyRow = { members: Learner[]; how: How; label: string[] };

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
// how a family's sprites split into lines: up to 3 on one line, 4 = 2+2, 5 = one line of 5, 6 = 3+3,
// 7 = 4+3, 8 = four lines of 2; bigger ones in pairs
const LINES: Record<number, number[]> = { 4: [2, 2], 5: [5], 6: [3, 3], 7: [4, 3], 8: [2, 2, 2, 2] };
const bundles = (m: Learner[]) => {
  const sizes = m.length <= 3 ? [m.length] : LINES[m.length] ?? Array(Math.ceil(m.length / 2)).fill(2);
  const out: Learner[][] = [];
  let i = 0;
  for (const n of sizes) { out.push(m.slice(i, i + n)); i += n; }
  return out;
};

export function LearnsMove(props: { move: string; close: () => void; datasetId: string }) {
  const pokedex = usePokedex();
  const mid = nameToId(props.move);
  const SORTS: [string, string][] = [["lvl", "Level ↑"], ["lvlDesc", "Level ↓"], ["name", "Name A–Z"], ["dex", "Dex order"]];
  const [sortBy, setSortBy] = createSignal<string>((() => { try { return localStorage.getItem("dzLearnSort") === "lvlDesc" ? "lvlDesc" : "lvl"; } catch { return "lvl"; } })());
  const chooseSort = (v: string) => { setSortBy(v); try { localStorage.setItem("dzLearnSort", v); } catch { /* private mode */ } };

  // how widely the move is spread: the number of separate evolution lines that learn it (Megas count as their base)
  const lineCount = createMemo(() => {
    const pd = pokedex();
    if (!pd) return 0;
    const byName: Record<string, PokemonData> = {};
    for (const p of Object.values(pd)) byName[p.name] = p;
    const strip = (n: string) => n.replace(/-(Mega|Primal)(-[XY])?$/, "");
    const roots = new Set<string>();
    for (const p of Object.values(pd)) {
      if (p.unusable || !p.learntMoves.find((i) => nameToId(i[0]) === mid)) continue;
      let n = byName[strip(p.name)] ? strip(p.name) : p.name, guard = 0;
      while ((byName[n] as any)?.prevo && byName[(byName[n] as any).prevo] && guard++ < 6) n = (byName[n] as any).prevo;
      roots.add(n);
    }
    return roots.size;
  });
  // fewer than 5 lines: Signature Move; fewer than 10: Exclusive Distribution; fewer than 20: Limited Distribution;
  // over 50 Pokemon learn it: Widely Distributed
  // the second word ("Move" / "Distribution") drops off on its own when the header is too narrow for it
  // (measured against a hidden copy of the full text, so it never gets cut off with "...")
  // and only when even the short label can't fit (e.g. "Widespread"), the move name's text shrinks to make room
  const [short, setShort] = createSignal(false);
  const [nameSize, setNameSize] = createSignal(0); // 0 = normal size, else px
  let boxEl: HTMLDivElement | undefined, nameEl: HTMLSpanElement | undefined, fullEl: HTMLSpanElement | undefined;
  let shortEl: HTMLSpanElement | undefined, nameMeasure: HTMLSpanElement | undefined;
  // the move name in its type's color
  const moves = useMoves();
  const typeColour = () => { const t = (moves() as any)?.[mid]?.type; return (t && TYPE_COLOURS[t]) || undefined; };
  // how many Pokemon learn it (and how many there are in all)
  const monCount = () => learnsIt().reduce((t, r) => t + r.members.length, 0);
  const allMons = createMemo(() => Object.values(pokedex() ?? {}).filter((p) => !p.unusable).length);
  // [full label, short label]: by share of all Pokemon, then by count, then by evolution lines
  const words = (): [string, string] | null => {
    const n = lineCount(), m = monCount(), all = allMons();
    if (!n) return null;
    if (all && m >= all * 0.9) return ["Universal", "Universal"];
    if (all && m >= all * 0.75) return ["Near Universal", "Near Universal"];
    if (m > 100) return ["Very Widespread", "Very Wide"];
    if (m > 50) return ["Widespread", "Widespread"];
    if (n < 5) return ["Signature Move", "Signature"];
    if (n < 10) return ["Exclusive Distribution", "Exclusive"];
    if (n <= 20) return ["Limited Distribution", "Limited"];
    return ["Semi-Limited Distribution", "Semi-Limited"];
  };
  const fullText = () => words()?.[0] ?? "";
  const rarity = () => { const w = words(); return !w ? "" : short() ? w[1] : w[0]; };
  const refit = () => {
    if (!boxEl || !nameMeasure || !fullEl || !shortEl) return;
    const GAP = 6, PAD = 16, AIR = 6; // gap-1.5, px-2, a little air before the Sort button
    const nameW = nameMeasure.offsetWidth; // the name at its normal size
    const room = boxEl.clientWidth - PAD - GAP - AIR;
    if (!fullText() || fullEl.offsetWidth + nameW <= room) { setShort(false); setNameSize(0); return; }
    setShort(true);
    if (shortEl.offsetWidth + nameW <= room) { setNameSize(0); return; }
    const base = parseFloat(getComputedStyle(nameMeasure).fontSize) || 16;
    setNameSize(Math.max(10, Math.floor(base * ((room - shortEl.offsetWidth) / nameW) * 10) / 10));
  };
  onMount(() => {
    const ro = new ResizeObserver(refit);
    if (boxEl) ro.observe(boxEl);
    requestAnimationFrame(refit);
    document.fonts?.ready.then(refit);
    onCleanup(() => ro.disconnect());
  });
  createEffect(() => { fullText(); requestAnimationFrame(refit); });

  // hide a " · " when the part after it wrapped to the next line (no dot hanging at a line end)
  let listEl: HTMLDivElement | undefined;
  const fixDots = () => {
    if (!listEl) return;
    const dots = [...listEl.querySelectorAll<HTMLElement>(".dz-dot")];
    for (const d of dots) d.style.visibility = "";
    for (const d of dots) {
      const next = d.nextElementSibling as HTMLElement | null;
      const nr = next?.getClientRects()[0];
      if (nr && nr.top > d.getBoundingClientRect().top + 3) d.style.visibility = "hidden";
    }
  };
  onMount(() => {
    const ro = new ResizeObserver(() => requestAnimationFrame(fixDots));
    if (listEl) ro.observe(listEl);
    onCleanup(() => ro.disconnect());
  });

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
    // the label, as parts (one per evolution line): "Turtwig line" when the whole line learns it, else the names;
    // a species whose every form learns it is just its name ("Oricorio", "Georupt"), else the forms that do
    const spKey = (n: string) => ((byName[n] as any)?.baseSpecies as string) || n;
    const formsOf = (k: string) =>
      Object.values(pd).filter((q) => !q.unusable && spKey(q.name) === k && baseOf(q.name) === q.name).map((q) => q.name);
    const rowLabel = (ms: PokemonData[]) => {
      const names = [...new Set(ms.map((m) => baseOf(m.name)))];
      const token = (n: string) => {
        const k = spKey(n), f = formsOf(k);
        return f.length > 1 && f.every((x) => names.includes(x)) ? k : n;
      };
      const lines = new Map<string, string[]>();
      for (const n of names) {
        const r = rootOf(n);
        if (!lines.has(r)) lines.set(r, []);
        lines.get(r)!.push(n);
      }
      const used = new Set<string>(), parts: string[] = [];
      for (const [root, have] of lines) {
        const full = lineOf(root);
        if (full.length > 1 && full.every((n) => have.includes(n))) {
          parts.push(root + " line");
          continue;
        }
        const toks: string[] = [];
        for (const n of have) {
          const t = token(n);
          if (!used.has(t)) { used.add(t); toks.push(t); }
        }
        if (toks.length) parts.push(joinNames(toks));
      }
      return parts;
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
    if (by === "name") return rows.toSorted((a, b) => a.label.join(" ").localeCompare(b.label.join(" ")));
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
  createEffect(() => { learnsIt(); requestAnimationFrame(fixDots); });

  // a plain list (a move has a few hundred learners at most): every row is as tall as its content, so rows never overlap
  return (
    <div
      class="absolute inset-0 z-10 bg-black/80 backdrop-blur-md"
      onClick={props.close}
    >
      <div
        class="absolute inset-4 flex flex-col rounded border-x border-t bg-black shadow"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="flex h-8 shrink-0 border-b">
          <div ref={boxEl} class="relative flex min-w-0 flex-auto items-center gap-1.5 overflow-hidden px-2">
            <span ref={nameEl} class="shrink-0 font-bold" style={{ color: typeColour(), "font-size": nameSize() ? `${nameSize()}px` : undefined }}>
              {props.move}
            </span>
            {rarity() && (
              <span class="whitespace-nowrap text-[11px] font-normal italic opacity-80" title={`Learned by ${monCount()} Pokémon (${lineCount()} evolution line${lineCount() === 1 ? "" : "s"})`}>
                ({rarity()})
              </span>
            )}
            <span ref={fullEl} aria-hidden="true" class="pointer-events-none invisible absolute left-0 top-0 whitespace-nowrap text-[11px] font-normal italic">
              ({fullText()})
            </span>
            <span ref={shortEl} aria-hidden="true" class="pointer-events-none invisible absolute left-0 top-0 whitespace-nowrap text-[11px] font-normal italic">
              ({words()?.[1] ?? ""})
            </span>
            <span ref={nameMeasure} aria-hidden="true" class="pointer-events-none invisible absolute left-0 top-0 whitespace-nowrap font-bold">
              {props.move}
            </span>
          </div>
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

        <div ref={listEl} class="relative flex-auto overflow-auto">
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
                  <div class="min-w-0 pl-2.5 text-[13px] leading-tight opacity-90">
                    <For each={row.label}>
                      {(t, i) => (
                        <>
                          <span>{t}</span>
                          {i() < row.label.length - 1 && <span class="dz-dot"> · </span>}
                        </>
                      )}
                    </For>
                  </div>
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
