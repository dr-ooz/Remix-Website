import { createVirtualizer } from "@tanstack/solid-virtual";
import clsx from "clsx";

type How = number | "tm" | "tutor";
type Learner = [PokemonData, How];
// Remix: one row per family (the dex order board's families), its members side by side in dex order.
type FamilyRow = { members: Learner[]; how: How | null }; // how: shared by every member, else null (each shows its own)

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
    <img src={`/icons/${how}.webp`} class="mx-auto h-full py-0.5" />
  );

const LINE_H = 26;

export function LearnsMove(props: { move: string; close: () => void; datasetId: string }) {
  const pokedex = usePokedex();
  const mid = nameToId(props.move);

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
    const rows: FamilyRow[] = [...groups.values()].map((members) => {
      members.sort((a, b) => ((a[0] as any).dexOrder ?? 0) - ((b[0] as any).dexOrder ?? 0));
      const first = members[0]![1];
      return { members, how: members.every((m) => m[1] === first) ? first : null };
    });
    // earliest way any member learns it first (level 1, 2, ... then TM, then tutor), like before
    const best = (r: FamilyRow) => Math.min(...r.members.map((m) => howRank(m[1])));
    return rows.toSorted((a, b) => best(a) - best(b));
  });

  let parentRef: HTMLDivElement;
  // each member takes the width it needs (sprite + full name + its own Lv / TM); work out how many lines a row wraps to
  const chipW = (p: PokemonData, own: boolean) => 36 + 6 + Math.ceil(p.name.length * 8.3) + (own ? 34 : 0) + 10;
  const linesFor = (r: FamilyRow) => {
    const room = Math.max(120, (parentRef?.clientWidth || 380) - 44);
    let lines = 1, used = 0;
    for (const [p] of r.members) {
      const w = Math.min(room, chipW(p, r.how === null));
      if (used && used + w > room) { lines++; used = 0; }
      used += w;
    }
    return lines;
  };

  const virtualizer = createVirtualizer({
    get count() {
      return learnsIt().length;
    },
    getScrollElement: () => parentRef,
    estimateSize: (i) => LINE_H * (learnsIt()[i] ? linesFor(learnsIt()[i]!) : 1),
  });

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
          <div
            onClick={props.close}
            class="flex aspect-square cursor-pointer items-center justify-center border-l"
          >
            X
          </div>
        </div>

        <div ref={(el) => (parentRef = el)} class="relative flex-auto overflow-auto">
          <RowVirtualizer virtualizer={virtualizer} items={learnsIt()}>
            {(row) => (
              <div class="flex h-full border-b">
                <div class="flex w-10 shrink-0 items-center justify-center border-r text-center">
                  {row.how !== null ? howLabel(row.how) : <span class="text-[10px] opacity-60">varies</span>}
                </div>
                <div class="flex min-w-0 flex-auto flex-wrap content-start">
                  {row.members.map(([p, how]) => (
                    <div
                      class={clsx("flex items-center gap-1 pr-2", p.range && "cursor-pointer hover:bg-white/10")}
                      style={{ height: `${LINE_H}px`, "max-width": "100%" }}
                      onClick={() => p.range && openRange(p.range)}
                      title={p.name}
                    >
                      <div
                        class="aspect-4/3 h-full shrink-0"
                        style={{
                          "background-image": `url(/calcsprites/${nameToId(p.name)}.png), url(/sprites/${nameToId(p.name)}.png)`,
                          "background-size": "auto 100%",
                          "background-repeat": "no-repeat",
                          "background-position": "right",
                          "image-rendering": "pixelated",
                          transform: "scaleX(-1)",
                        }}
                      />
                      <div class="min-w-0 truncate text-[13px]">{p.name}</div>
                      {row.how === null && (
                        <div class="shrink-0 pl-1 text-[11px] opacity-75">
                          {typeof how === "number" ? (how === 0 ? "–" : "Lv" + how) : how === "tm" ? "TM" : "Tutor"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </RowVirtualizer>
        </div>
      </div>
    </div>
  );
}
