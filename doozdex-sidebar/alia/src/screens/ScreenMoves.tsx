import { createVirtualizer } from "@tanstack/solid-virtual";
import clsx from "clsx";
import { RARITY_TIERS, rarityTier, moveSpread } from "@/utils/rarity";
import { useCalcData, useEffectCats } from "@/utils/calcData";

export type Order = "eff" | "a-z" | "num" | "pow" | "rare";

// Effect = the order moves first appear in the Move Guide's categories (Priority ... Misc. Status)
export const ORDERS: Option<Order>[] = [
  { label: "Effect", value: "eff" },
  { label: "A-Z", value: "a-z" },
  { label: "Index #", value: "num" },
  { label: "Power", value: "pow" },
  { label: "Rarity", value: "rare" },
];

export function ScreenMoves() {
  const datasetId = useDatasetId();
  const moves = useMoves();
  const pokedex = usePokedex();
  const [pinnedMoves, setPinnedMoves] = usePinnedMoves();
  const allowedMoves = createMemo(() => {
    const u = new Set<string>();
    const px = pokedex();
    if (!px) return u;

    for (const p of Object.values(px)) {
      for (const m of p.learntMoves) u.add(nameToId(m[0]));
    }

    return u;
  });

  const [searchFilter, setSearchFilter] = createSignal("");
  // the click menu on a move: {name, x, y} (in the list box's own coordinates)
  const [menu, setMenu] = createSignal<{ name: string; x: number; y: number } | null>(null);
  let listBox: HTMLDivElement | undefined;
  const togglePin = (name: string) =>
    setPinnedMoves((p) => {
      const next = new Set(p);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  // the MoveDex (move guide page): on that page, jump straight to the move; elsewhere, open the page at it
  const jumpToMoveDex = (name: string) => {
    setMenu(null);
    let top: any = window;
    try { top = window.top ?? window; void top.location.href; } catch { top = window; }
    if (typeof top.remixMoveGuideJump === "function") { top.remixMoveGuideJump(name); return; }
    top.location.href = new URL("moveguide.html#move=" + encodeURIComponent(name), top.location.href).href;
  };
  // Rarity: every move's tier (from the learnsets, live), most common first; tiers can be hidden (remembered)
  const spread = createMemo(() => { const pd = pokedex(); return pd ? moveSpread(pd) : null; });
  const tierOf = (name: string) => {
    const sp = spread();
    const o = sp?.byMove[nameToId(name)];
    return o && sp ? rarityTier(o.roots.size, o.mons, sp.all) : -1;
  };
  const [hiddenTiers, setHiddenTiersRaw] = createSignal<number[]>((() => { try { return JSON.parse(localStorage.getItem("dzHiddenTiers") || "[]"); } catch { return []; } })());
  const toggleTier = (i: number) => {
    const next = hiddenTiers().includes(i) ? hiddenTiers().filter((x) => x !== i) : [...hiddenTiers(), i];
    setHiddenTiersRaw(next);
    try { localStorage.setItem("dzHiddenTiers", JSON.stringify(next)); } catch { /* private mode */ }
  };
  // Power sorts by effective power, the way the AI sees it (fixed multi-hits x hits, 2-5 hits x3, always-crit x1.5)
  const calcData = useCalcData();
  const effPower = (m: MoveData) => calcData()?.movePower[nameToId(m.name)] ?? m.power;
  // Effect = a mini MoveDex: clicking Effect opens the directory of the guide's categories (click it again to come
  // back to it); picking one lists just that category's moves in guide order, "All moves" lists every move that way
  const effectCats = useEffectCats();
  const [catsOpen, setCatsOpen] = createSignal(false);
  const [effectPick, setEffectPick] = createSignal("");
  const pickedCat = () => (effectCats() ?? []).find((c) => c.name === effectPick());
  const moveCatPos = createMemo(() => {
    const pos: Record<string, number> = {};
    let n = 0;
    const pc = pickedCat();
    for (const c of pc ? [pc] : effectCats() ?? []) for (const mid of c.moves) if (pos[mid] === undefined) pos[mid] = n++;
    return pos;
  });
  // Power, low to high: status moves can be hidden
  const [hideStatus, setHideStatus] = createSignal(true);
  const [typeFilter, setTypeFilter] = createSignal("");
  const [categoryFilter, setCategoryFilter] = createSignal("");

  // Pokemon names offered under the search box (picking one shows its learnset)
  const pokemonNames = createMemo(() => Object.values(pokedex() ?? {}).map((p) => p.name).toSorted());

  // The Pokemon whose learnset the search shows: exact name, else its old (game) name, else the
  // shortest name starting with what's typed ("bulba" -> Bulbasaur, "mime" -> Mime Jr.).
  const searchedPokemon = createMemo(() => {
    const sf = nameToId(searchFilter());
    const pd = pokedex();
    if (!sf || !pd) return undefined;
    if (pd[sf]) return pd[sf];
    const all = Object.entries(pd);
    const old = all.find(([, p]) => ((p as any).oldNames ?? []).some((o: string) => nameToId(o) === sf));
    if (old) return old[1];
    if (sf.length < 3) return undefined;
    const starts = all.filter(([id]) => id.startsWith(sf)).sort((a, b) => a[0].length - b[0].length || a[0].localeCompare(b[0]));
    return starts[0]?.[1];
  });

  const filtered = createMemo(() => {
    const mv = moves();
    if (!mv) return [];

    const pm = pinnedMoves();

    const sf = nameToId(searchFilter());
    const tf = typeFilter();
    const cf = categoryFilter();

    const p = searchedPokemon()?.learntMoves;

    const u = allowedMoves();

    return Object.values(mv).filter((m) => {
      const id = nameToId(m.name);
      if (!u.has(id)) return false;
      if (sf && !p?.find((i) => nameToId(i[0]) === id) && !id.includes(sf)) return false;
      if (tf && m.type !== tf) return false;
      if (cf && m.category !== cf) return false;
      return true;
    });
  });

  // A-Z by default; the viewer's choice (and its direction) is remembered
  const saved = (() => { try { return JSON.parse(localStorage.getItem("dzMoveSort") || "null"); } catch { return null; } })();
  const [order, setOrderRaw] = createSignal<Order>(ORDERS.some((o) => o.value === saved?.o) ? saved.o : "a-z");
  const [reversed, setReversedRaw] = createSignal<boolean>(!!saved?.r);
  const remember = () => { try { localStorage.setItem("dzMoveSort", JSON.stringify({ o: order(), r: reversed() })); } catch { /* private mode */ } };
  const setOrder = (o: Order) => { setOrderRaw(o); setReversedRaw(false); remember(); };
  const setReversed = (f: (p: boolean) => boolean) => { setReversedRaw(f); remember(); };

  const sorted = createMemo(() => {
    const or = order();
    const p = new Set(pinnedMoves());

    const pk = searchedPokemon()?.learntMoves;

    // Rarity: hidden tiers drop out
    const cp = moveCatPos();
    return filtered()
      .filter((m) => or !== "rare" || !hiddenTiers().includes(tierOf(m.name)))
      .filter((m) => or !== "eff" || !pickedCat() || cp[nameToId(m.name)] !== undefined)
      .filter((m) => !(or === "pow" && reversed() && hideStatus()) || effPower(m) > 0)
      .toSorted((a, b) => {
      const aPinned = p.has(a.name);
      if (aPinned !== p.has(b.name)) return aPinned ? -1 : 1;

      let i = 0;
      const ma = pk?.find((i) => nameToId(i[0]) === nameToId(a.name));
      const mb = pk?.find((i) => nameToId(i[0]) === nameToId(b.name));

      // the searched Pokemon's learnset first, in the order it learns them (level-up, then TMs...)
      if (ma && mb) return pk!.indexOf(ma) - pk!.indexOf(mb);
      if (ma) return -1;
      if (mb) return 1;

      switch (or) {
        case "a-z":
          i = a.name.localeCompare(b.name);
          break;
        case "num":
          i = a.num - b.num;
          break;
        case "pow":
          i = effPower(b) - effPower(a) || a.name.localeCompare(b.name);
          break;
        case "rare": {
          // tier (most common first), then inside a tier by the Remix dex order of its first learner
          const sp = spread();
          i = tierOf(a.name) - tierOf(b.name) ||
            (sp?.byMove[nameToId(a.name)]?.dex ?? 1e6) - (sp?.byMove[nameToId(b.name)]?.dex ?? 1e6) ||
            a.name.localeCompare(b.name);
          break;
        }
        case "eff": {
          // moves not in the guide go last, A-Z
          const ea = cp[nameToId(a.name)] ?? 1e6, eb = cp[nameToId(b.name)] ?? 1e6;
          i = ea - eb || a.name.localeCompare(b.name);
          break;
        }
      }
      return i * (reversed() ? -1 : 1);
    });
  });

  const [openMove, setOpenMove] = createSignal("");

  let parentRef: HTMLDivElement;

  const virtualizer = createVirtualizer({
    get count() {
      return sorted().length;
    },
    getScrollElement: () => parentRef,
    estimateSize: () => 71,
  });

  return (
    <>
      <div class="flex flex-col gap-1 p-1 pt-0">
        <Input
          class="flex-3"
          value={searchFilter()}
          oninput={(e) => setSearchFilter(e.currentTarget.value)}
          suggest={pokemonNames()}
          onPick={(n) => setSearchFilter(n)}
          placeholder="Search..."
        />

        <div class="flex gap-1">
          <Select
            options={TYPES.toSorted((a, b) => a.label.localeCompare(b.label))}
            value={typeFilter()}
            oninput={(e) => setTypeFilter(e.currentTarget.value)}
          />
          <Select
            options={CATEGORIES}
            value={categoryFilter()}
            oninput={(e) => setCategoryFilter(e.currentTarget.value)}
          />
        </div>

        <div class="flex gap-1">
          <For each={ORDERS}>
            {(o) => (
              <Button
                class={cn("flex-1 text-sm", order() === o.value && "dz-filter-on font-bold")}
                title={o.value === "eff" ? "Browse the MoveDex categories" : "Click again to reverse"}
                onclick={() => {
                  if (o.value === "eff") { if (order() !== "eff") setOrder("eff"); setCatsOpen(true); return; }
                  order() === o.value ? setReversed((prev) => !prev) : setOrder(o.value);
                }}
                oncontextmenu={(e) => {
                  if (o.value !== "eff") return;
                  e.preventDefault();
                  if (order() !== "eff") setOrder("eff");
                  setCatsOpen(true);
                }}
              >
                {o.label}
                {order() === o.value && o.value !== "eff" && <span class="text-[10px]"> {reversed() ? "▼" : "▲"}</span>}
              </Button>
            )}
          </For>
        </div>

        <Show when={order() === "eff"}>
          <button
            type="button"
            class="dz-filter-on flex cursor-pointer items-center justify-center gap-1 rounded border px-2 py-1 text-[13px]"
            onClick={() => setCatsOpen(true)}
          >
            <span class="text-white/70">Showing:</span>
            <b class="truncate">{pickedCat()?.name ?? "All moves, in MoveDex order"}</b>
            <span class="text-[11px] text-white/70">(change ▾)</span>
          </button>
        </Show>
        <Show when={order() === "pow" && reversed()}>
          <button
            type="button"
            class={cn("cursor-pointer rounded border px-2 py-0.5 text-[12px]", hideStatus() && "dz-filter-on font-bold")}
            onClick={() => setHideStatus(!hideStatus())}
          >
            {hideStatus() ? "Non-damaging moves hidden (click to show)" : "Non-damaging moves shown (click to hide)"}
          </button>
        </Show>

        <Show when={order() === "rare"}>
          <div class="flex flex-wrap gap-1" title="Click a tier to hide or show its moves">
            <For each={[...RARITY_TIERS.keys()]}>
              {(i) => (
                <button
                  type="button"
                  class={cn(
                    "flex-auto cursor-pointer rounded border px-1 text-[11px]",
                    hiddenTiers().includes(i) ? "line-through opacity-40" : "dz-filter-on",
                  )}
                  onClick={() => toggleTier(i)}
                >
                  {RARITY_TIERS[i]!.short}
                </button>
              )}
            </For>
          </div>
        </Show>
      </div>

      <div class="flex flex-col pb-1 text-center text-xs text-white/70 italic">
        <div>Click: options · Double-click: open in MoveDex</div>
        <div>Corner: pin · Right-click: who learns it</div>
      </div>

      <div ref={listBox} class="relative flex flex-auto overflow-hidden border-t">
        <Show when={catsOpen()}>
          <div class="absolute inset-0 z-40 bg-black/80" onClick={() => setCatsOpen(false)}>
            <div class="absolute inset-3 flex flex-col rounded border bg-black shadow" onClick={(e) => e.stopPropagation()}>
              <div class="flex h-8 shrink-0 items-center border-b">
                <div class="flex-auto px-2 font-bold">MoveDex categories</div>
                <div onClick={() => setCatsOpen(false)} class="flex aspect-square h-full cursor-pointer items-center justify-center border-l">X</div>
              </div>
              <div class="px-2 py-1 text-[11px] text-white/60 italic">Pick a category to list its moves. Click Effect to come back here.</div>
              <div class="flex-auto overflow-auto">
                <For each={[{ name: "", moves: [] as string[] }, ...(effectCats() ?? [])]}>
                  {(c) => (
                    <button
                      type="button"
                      class={cn(
                        "flex w-full cursor-pointer items-center gap-1.5 border-b px-2 py-1 text-left text-[13px] hover:bg-white/10",
                        effectPick() === c.name && "dz-filter-on font-bold",
                      )}
                      onClick={() => { setEffectPick(c.name); setCatsOpen(false); parentRef?.scrollTo({ top: 0 }); }}
                    >
                      <span class="min-w-0 flex-auto truncate" title={c.name || "All moves"}>{c.name || "All moves (MoveDex order)"}</span>
                      <Show when={c.name}><span class="text-[11px] text-white/50">{c.moves.length}</span></Show>
                    </button>
                  )}
                </For>
              </div>
            </div>
          </div>
        </Show>
        <Show when={menu()}>
          {(m) => (
            <>
              <div class="absolute inset-0 z-20" onClick={() => setMenu(null)} onContextMenu={(e) => { e.preventDefault(); setMenu(null); }} />
              <div
                class="absolute z-30 flex min-w-48 flex-col overflow-hidden rounded border bg-black text-[13px] shadow-lg"
                style={{ left: `${m().x}px`, top: `${m().y}px` }}
              >
                <div class="border-b px-2.5 py-1 font-bold opacity-80">{m().name}</div>
                <button type="button" class="cursor-pointer px-2.5 py-1.5 text-left hover:bg-white/10" onClick={() => { const n = m().name; setMenu(null); setOpenMove(n); }}>
                  Show Pokémon that learn this move <span class="text-[11px] italic opacity-60">(or Right-Click)</span>
                </button>
                <button type="button" class="cursor-pointer px-2.5 py-1.5 text-left hover:bg-white/10" onClick={() => { const n = m().name; setMenu(null); togglePin(n); }}>
                  {pinnedMoves().has(m().name) ? "Unpin this move" : "Pin this move"}{" "}
                  <span class="text-[11px] italic opacity-60">(or the corner pin button)</span>
                </button>
                <button type="button" class="cursor-pointer px-2.5 py-1.5 text-left hover:bg-white/10" onClick={() => jumpToMoveDex(m().name)}>
                  Jump to MoveDex <span class="text-[11px] italic opacity-60">(or Double-Click)</span>
                </button>
              </div>
            </>
          )}
        </Show>
        <Show when={openMove()}>
          <LearnsMove move={openMove()} close={() => setOpenMove("")} datasetId={datasetId()!} />
        </Show>

        <div
          ref={(el) => (parentRef = el)}
          class={clsx("w-full flex-auto", openMove() ? "overflow-hidden" : "overflow-auto")}
        >
          <RowVirtualizer class="border-x" virtualizer={virtualizer} items={sorted()}>
            {(d) => (
              <Move
                data={d}
                pinUnpin={() => togglePin(d.name)}
                pinned={pinnedMoves().has(d.name)}
                open={() => { setMenu(null); setOpenMove(d.name); }}
                menu={(e) => {
                  if (!listBox) return;
                  const b = listBox.getBoundingClientRect();
                  const x = Math.max(4, Math.min(e.clientX - b.left, b.width - 200));
                  const y = Math.max(4, Math.min(e.clientY - b.top + 6, b.height - 120));
                  setMenu({ name: d.name, x, y });
                }}
                jump={() => jumpToMoveDex(d.name)}
              />
            )}
          </RowVirtualizer>
        </div>
      </div>
    </>
  );
}
