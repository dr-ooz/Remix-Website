import styles from "./Move.module.css";

export const Move = (props: {
  data: MoveData;
  pinUnpin: () => void;
  pinned: boolean;
  open: () => void;
}) => {
  return (
    <div
      class="z-10 flex h-full flex-col border-b"
      style={{ "--tc": TYPE_COLOURS[props.data.type] ?? "#999" }}
      onContextMenu={props.open}
    >
      <div class={cn("relative flex h-6.5 items-center gap-2 pr-2 text-[14px]", styles.info)}>
        <div class="h-full w-6.5">
          <Type type={props.data.type} muted />
        </div>

        <div
          class="aspect-square h-full bg-contain bg-center bg-no-repeat"
          style={{ "background-image": `url(/icons/${props.data.category}.webp)` }}
        />

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
