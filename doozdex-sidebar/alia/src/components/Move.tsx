import styles from "./Move.module.css";

export const Move = (props: {
  data: MoveData;
  pinUnpin: () => void;
  pinned: boolean;
  open: () => void;
  menu?: (e: MouseEvent) => void;
  jump?: () => void;
}) => {
  // one click: the options menu (after a short wait, so a double-click can open the MoveDex instead)
  let clickTimer = 0;
  return (
    <div
      class="z-10 flex h-full cursor-pointer flex-col border-b"
      style={{ "--tc": TYPE_COLOURS[props.data.type] ?? "#999" }}
      onContextMenu={(e) => { e.preventDefault(); clearTimeout(clickTimer); props.open(); }}
      onClick={(e) => {
        if (!props.menu) return;
        clearTimeout(clickTimer);
        if (e.detail > 1) return;
        const ev = e;
        clickTimer = window.setTimeout(() => props.menu!(ev), 230);
      }}
      onDblClick={() => { clearTimeout(clickTimer); props.jump?.(); }}
    >
      <div class={cn("relative flex h-6.5 items-center gap-2 pr-2 text-[14px]", styles.info)}>
        <div class="h-full w-6.5">
          <Type type={props.data.type} muted />
        </div>

        <Show
          when={(props.data as any).mixed}
          fallback={
            <div
              class="aspect-square h-full bg-contain bg-center bg-no-repeat"
              style={{ "background-image": `url(/icons/${props.data.category}.webp)` }}
            />
          }
        >
          {/* uses the higher attacking stat: a shuffle icon */}
          <div class="flex aspect-square h-full items-center justify-center" title="Uses the user's higher attacking stat (Physical or Special)">
            <svg viewBox="0 0 24 24" class="h-[82%] w-[82%]" fill="none" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">

              <g stroke="#fff">
                <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22" />
                <path d="m18 2 4 4-4 4" />
                <path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" />
                <path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" />
                <path d="m18 14 4 4-4 4" />
              </g>
            </svg>
          </div>
        </Show>

        <div class="flex-auto text-center font-bold text-nowrap">{props.data.name}</div>

        <div
          class="w-10 text-center font-bold"
          title={props.data.zPower ? `Z-Move power: ${props.data.zPower}` : ""}
        >
          {props.data.power || "—"}
        </div>
        <div class="w-10 text-center">{props.data.acc === 101 ? "—" : props.data.acc}%</div>
        <div class="w-10 text-center">
          {props.data.pp}
          <span class="text-[10px]">PP</span>
        </div>

        <div class="relative h-full w-4 cursor-pointer">
          <div
            class="group absolute h-full w-7 -translate-x-1 text-center"
            onClick={(e) => {
              e.stopPropagation();
              props.pinUnpin();
            }}
          >
            <Show when={props.pinned} fallback={<div class="hidden group-hover:block">📌</div>}>
              <div class="group-hover:hidden">📌</div>
              <div class="hidden group-hover:block">X</div>
            </Show>
          </div>
        </div>
      </div>

      <div
        class={cn(
          "relative flex flex-auto items-center px-1 text-center text-[10px] font-bold",
          styles.desc,
        )}
      >
        {props.data.desc}
      </div>
    </div>
  );
};
