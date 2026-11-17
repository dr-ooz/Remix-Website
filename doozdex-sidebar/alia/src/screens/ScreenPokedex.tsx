import { createVirtualizer } from "@tanstack/solid-virtual";
import clsx from "clsx";
import type { JSX } from "solid-js/jsx-runtime";

type Order = "num" | "a-z" | "hp" | "atk" | "def" | "spa" | "spd" | "spe" | "bst";

const ORDERS: Option<Order>[] = [
  { label: "#", value: "num" },
  { label: "A-Z", value: "a-z" },
  { label: "HP", value: "hp" },
  { label: "Atk", value: "atk" },
  { label: "Def", value: "def" },
  { label: "SpA", value: "spa" },
  { label: "SpD", value: "spd" },
  { label: "Spe", value: "spe" },
  { label: "BST", value: "bst" },
];

type PokemonRowItem = { type: "item"; data: PokemonData } | { type: "header"; label: string };

export const ScreenPokedex = (props: { datasetId: string }) => {
  onMount(() => useOPT()![1](null));

  const datasetId = useDatasetId();
  const pokedex = usePokedex();
  const moves = useMoves();
  const sheetId = useSheetId();

  const [searchFilter, setSearchFilter] = createSignal("");
  const [typesFilter, setTypesFilter] = createSignal(["", ""]);

  const [order, setOrder] = createSignal<Order>("num");
  const [reversed, setReversed] = createSignal(false);

  const [abilityFilter, setAbilityFilter] = createSignal(["", "", ""]);

  const [itemFilter, setItemFilter] = createSignal(false);

  const [movesFilter, setMovesFilter] = createSignal<[string, boolean][]>([
    ["", true],
    ["", true],
    ["", true],
    ["", true],
  ]);

  let parentRef: HTMLDivElement;

  const abilityOptions = createMemo(() => {
    const pd = pokedex();
    if (!pd) return [{ value: "", label: "—" }];

    const abilities = new Set<string>();

    for (const d of Object.values(pd)) {
      const list = d.abilities;
      for (let j = 0; j < list.length; j++) {
        abilities.add(list[j]!);
      }
    }

    const sorted = Array.from(abilities).sort((a, b) => a.localeCompare(b));

    const options = Array.from<Option>({ length: sorted.length + 1 });
    options[0] = { value: "", label: "(Ability)" };

    for (let i = 0; i < sorted.length; i++) {
      const value = sorted[i]!;
      options[i + 1] = { value, label: value };
    }

    return options;
  });

  const moveOptions = createMemo(() => {
    const pd = pokedex();
    const ms = moves();
    if (!pd) return [{ value: "", label: "—" }];

    const aMoves = new Set<string>();

    for (const d of Object.values(pd)) {
      const list = Object.values(d.learntMoves);
      for (let i = 0; i < list.length; i++) aMoves.add(list[i]![0]);
    }

    const sorted = Array.from(aMoves).sort((a, b) => a.localeCompare(b));

    const options = Array.from<Option>({ length: sorted.length + 1 });
    options[0] = { value: "", label: "(Move)" };

    for (let i = 0; i < sorted.length; i++) {
      const value = sorted[i]!;
      options[i + 1] = { value, label: (ms && ms[nameToId(value)]?.name) || value };
    }

    return options;
  });

  const groupedAndSorted = createMemo<PokemonRowItem[]>(() => {
    const data = pokedex();
    if (!data) return [];

    const di = datasetId();
    const datasetData = DATASET_IDS.find((i) => i.value === di);

    const sf = nameToId(searchFilter());
    const tf = typesFilter();
    const pureTyped = new Set(tf).size === 1;
    const af = abilityFilter().filter(Boolean);
    const mf = movesFilter();

    const standardMons: any[] = [];
    const signatureItemMons: any[] = [];

    const ifi = itemFilter();

    const or = order();

    for (const p of Object.values(data)) {
      const id = nameToId(p.name);
      // also match the game's original name (Dugtrio -> Drugtrio + Drumtrio, Audino -> Kangakid + Vitabeat)
      if (sf && !id.includes(sf) && !((p as any).oldNames ?? []).some((o: string) => nameToId(o).includes(sf))) continue;

      let typesMatch = true;
      for (let i = 0; i < tf.length; i++) {
        const t = tf[i]!;
        if (t && (!p.types.includes(t) || (pureTyped && p.types.length !== 1))) {
          typesMatch = false;
          break;
        }
      }
      if (!typesMatch) continue;

      let movesMatch = true;
      for (let i = 0; i < mf.length; i++) {
        const [moveName, shouldInclude] = mf[i]!;
        if (!moveName) continue;
        const hasMove = p.learntMoves.find((i) => i[0] === moveName);
        if (shouldInclude ? !hasMove : hasMove) {
          movesMatch = false;
          break;
        }
      }
      if (!movesMatch) continue;

      if (ifi && !datasetData?.signatureItems[id]) continue;

      if (af.length > 0) {
        const sigItem = datasetData?.signatureItems[id];
        const sigAbilities = (sigItem && datasetData?.magicItems[sigItem]?.abilities) || [];

        let allMatch = true;
        let needsSignatureItem = false;

        for (let i = 0; i < af.length; i++) {
          const ability = af[i]!;
          if (p.abilities.includes(ability)) continue;
          if (sigAbilities.includes(ability)) {
            needsSignatureItem = true;
            continue;
          }
          allMatch = false;
          break;
        }
        if (!allMatch) continue;

        if (!needsSignatureItem || (or !== "a-z" && or !== "num")) {
          standardMons.push(p);
        } else {
          signatureItemMons.push(p);
        }
      } else {
        standardMons.push(p);
      }
    }

    const sortFn = (a: any, b: any) => {
      let i = 0;
      switch (or) {
        case "a-z":
          i = a.name.localeCompare(b.name);
          break;
        case "num":
          i = a.num - b.num;
          break;
        case "hp":
          i = b.baseStats[0] - a.baseStats[0];
          break;
        case "atk":
          i = b.baseStats[1] - a.baseStats[1];
          break;
        case "def":
          i = b.baseStats[2] - a.baseStats[2];
          break;
        case "spa":
          i = b.baseStats[3] - a.baseStats[3];
          break;
        case "spd":
          i = b.baseStats[4] - a.baseStats[4];
          break;
        case "spe":
          i = b.baseStats[5] - a.baseStats[5];
          break;
        case "bst":
          i =
            b.baseStats.reduce((acc: number, cum: number) => acc + cum, 0) -
            a.baseStats.reduce((acc: number, cum: number) => acc + cum, 0);
          break;
      }
      return i * (reversed() ? -1 : 1);
    };

    standardMons.sort(sortFn);
    signatureItemMons.sort(sortFn);

    const result: PokemonRowItem[] = standardMons.map((p) => ({ type: "item", data: p }));

    if (signatureItemMons.length > 0) {
      result.push({
        type: "header",
        label: `Gains the effects of ${af.join("/")} via a signature item`,
      });
      for (const p of signatureItemMons) {
        result.push({ type: "item", data: p });
      }
    }

    return result;
  });

  const virtualizer = createVirtualizer({
    get count() {
      return groupedAndSorted()?.length ?? 0;
    },
    getScrollElement: () => parentRef,
    estimateSize: () => 52,
  });

  const autoCompleteList = createMemo(() => Object.keys({ ...pokedex() }).toSorted());

  return (
    <>
      <div class="flex flex-col gap-1 p-1 pt-0">
        <div class="flex gap-1">
          <Input
            value={searchFilter()}
            oninput={(e) => setSearchFilter(nameToId(e.currentTarget.value))}
            autocompleteList={autoCompleteList()}
            placeholder="Search..."
          />

          <label
            for="sig-item"
            class="flex cursor-pointer items-center justify-center text-white/70"
          >
            Item
          </label>

          <Checkbox
            id="sig-item"
            checked={itemFilter()}
            onchange={(e) => setItemFilter(Boolean(e.currentTarget.checked))}
          />
        </div>

        <div class="flex gap-1">
          <Index each={typesFilter()}>
            {(t, index) => (
              <Select
                options={TYPES.toSorted((a, b) => a.label.localeCompare(b.label))}
                value={t()}
                oninput={(e) =>
                  setTypesFilter((prev) => {
                    const next = [...prev];
                    next[index] = e.currentTarget.value;
                    return next;
                  })
                }
              />
            )}
          </Index>
        </div>

        <div class="flex gap-1">
          <Index each={abilityFilter()}>
            {(t, index) => (
              <Select
                options={abilityOptions()}
                value={t()}
                oninput={(e) =>
                  setAbilityFilter((prev) => {
                    const next = [...prev];
                    next[index] = e.currentTarget.value;
                    return next;
                  })
                }
              />
            )}
          </Index>
        </div>

        <div class="grid grid-cols-2 gap-1">
          <Index each={movesFilter()}>
            {(t, index) => (
              <div class="flex gap-1">
                <Checkbox
                  checked={t()[1]}
                  onchange={(e) =>
                    setMovesFilter((prev) => {
                      const next = [...prev];
                      next[index] = [next[index]![0], e.currentTarget.checked];
                      return next;
                    })
                  }
                />
                <Select
                  options={moveOptions()}
                  value={t()[0]}
                  oninput={(e) =>
                    setMovesFilter((prev) => {
                      const next = [...prev];
                      next[index] = [e.currentTarget.value, true];
                      return next;
                    })
                  }
                />
              </div>
            )}
          </Index>
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

        <div class="text-center text-sm font-bold">
          <div>Click the Pokemon to see their changes on the Doozdex!</div>
        </div>
      </div>

      <div
        ref={(el) => (parentRef = el)}
        class={cn("flex-auto overflow-auto", groupedAndSorted().length > 0 && "border-t")}
      >
        <RowVirtualizer class="border-x" virtualizer={virtualizer} items={groupedAndSorted()}>
          {(d) =>
            d.type === "item" ? (
              <Pokemon data={d.data} datasetId={props.datasetId} sheetId={sheetId()!} />
            ) : (
              <div class="flex h-full flex-col items-center justify-center border-b text-center">
                <div class="text-xs font-bold">{d.label}</div>
                <div class="text-xs">
                  To see full effects of the item, click the Pokemon's icon!
                </div>
              </div>
            )
          }
        </RowVirtualizer>
      </div>
    </>
  );
};

function Checkbox(props: JSX.InputHTMLAttributes<HTMLInputElement>) {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <input
      type="checkbox"
      class={clsx(
        "h-4 w-4 flex-none cursor-pointer appearance-none self-center rounded-xs border border-white",
        "flex items-center justify-center",
        "bg-red-500 before:content-['✕']",
        "checked:bg-green-500 checked:text-black checked:before:content-['✓']",
        local.class,
      )}
      {...rest}
    />
  );
}
