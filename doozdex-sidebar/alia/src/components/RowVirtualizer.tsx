import type { Virtualizer } from "@tanstack/solid-virtual";

interface RowVirtualizerProps<T> {
  class?: string;
  virtualizer: Virtualizer<HTMLDivElement, Element>;
  items: T[];
  children: (item: T, index: number) => any;
}

export const RowVirtualizer = <T,>(props: RowVirtualizerProps<T>) => {
  return (
    <div
      style={{ height: `${props.virtualizer.getTotalSize()}px` }}
      class={cn("relative w-full", props.class)}
    >
      <For each={props.virtualizer.getVirtualItems()}>
        {(virtualRow) => (
          <div
            style={{
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
            class="absolute top-0 left-0 w-full"
          >
            {props.children(props.items[virtualRow.index]!, virtualRow.index)}
          </div>
        )}
      </For>
    </div>
  );
};
