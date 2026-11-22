import { createVirtualizer } from "@tanstack/solid-virtual";
import clsx from "clsx";

export type Order = "num" | "a-z" | "pow" | "acc";

export const ORDERS: Option<Order>[] = [
  { label: "#", value: "num" },
  { label: "A-Z", value: "a-z" },
  { label: "Power", value: "pow" },
  { label: "Acc", value: "acc" },
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

  const [order, setOrder] = createSignal<Order>("num");
  const [reversed, setReversed] = createSignal(false);

  const sorted = createMemo(() => {
    const or = order();
    const p = new Set(pinnedMoves());

    const pk = searchedPokemon()?.learntMoves;

    return filtered().toSorted((a, b) => {
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
          i = b.power - a.power;
          break;
        case "acc":
          i = b.acc - a.acc;
          break;
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
                class={cn("flex-1 text-sm", order() === o.value && "font-bold")}
                onclick={() =>
                  order() === o.value ? setReversed((prev) => !prev) : setOrder(o.value)
                }
              >
                {o.label}
              </Button>
            )}
          </For>
        </div>
      </div>

      <div class="flex flex-col pb-1 text-center text-xs text-white/70 italic">
        <div>Click: options · Double-click: open in MoveDex</div>
        <div>Corner: pin · Right-click: who learns it</div>
      </div>

      <div ref={listBox} class="relative flex flex-auto overflow-hidden border-t">
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
                  Show Pokémon that learn this move
                </button>
                <button type="button" class="cursor-pointer px-2.5 py-1.5 text-left hover:bg-white/10" onClick={() => { const n = m().name; setMenu(null); togglePin(n); }}>
                  {pinnedMoves().has(m().name) ? "Unpin this move" : "Pin this move"}
                </button>
                <button type="button" class="cursor-pointer px-2.5 py-1.5 text-left hover:bg-white/10" onClick={() => jumpToMoveDex(m().name)}>
                  Jump to MoveDex
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
