import { createVirtualizer } from "@tanstack/solid-virtual";
import clsx from "clsx";

export function LearnsMove(props: { move: string; close: () => void; datasetId: string }) {
  const pokedex = usePokedex();
  const mid = nameToId(props.move);

  const learnsIt = createMemo(() => {
    const pd = pokedex();
    if (!pd) return [];
    return Object.values(pd)
      .filter((p) => p.learntMoves.find((i) => !p.unusable && nameToId(i[0]) === mid))
      .map(
        (p) =>
          [p, p.learntMoves.find((i) => nameToId(i[0]) === mid)![1]] as [
            PokemonData,
            number | "tm" | "tutor",
          ],
      )
      .toSorted(([, a], [, b]) => {
        const aIsNum = typeof a === "number";
        const bIsNum = typeof b === "number";
        if (aIsNum && bIsNum) return a - b;
        if (aIsNum) return -1;
        if (bIsNum) return 1;
        return 0;
      });
  });

  let parentRef: HTMLDivElement;

  const virtualizer = createVirtualizer({
    get count() {
      return learnsIt().length;
    },
    getScrollElement: () => parentRef,
    estimateSize: () => 26,
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
            {([p, how]) => (
              <div
                class={clsx("flex h-full border-b", p.range && "cursor-pointer")}
                onClick={() => p.range && openRange(p.range)}
              >
                <div class="w-10 border-r text-center">
                  {how === 0 ? (
                    "–"
                  ) : typeof how === "number" ? (
                    <span>
                      <span class="text-xs">Lv</span>
                      {how}
                    </span>
                  ) : (
                    <img src={`/icons/${how}.webp`} class="mx-auto h-full py-0.5" />
                  )}
                </div>
                <div
                  class="aspect-4/3 h-full"
                  style={{
                    "background-image": `url(/calcsprites/${nameToId(p.name)}.png), url(/sprites/${nameToId(p.name)}.png)`,
                    "background-size": "auto 100%",
                    "background-repeat": "no-repeat",
                    "background-position": "right",
                    "image-rendering": "pixelated",
                    transform: "scaleX(-1)",
                  }}
                />
                <div>{p.name}</div>
              </div>
            )}
          </RowVirtualizer>
        </div>
      </div>
    </div>
  );
}
