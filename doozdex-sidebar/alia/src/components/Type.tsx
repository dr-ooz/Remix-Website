export const Type = (props: { type: string }) => {
  return (
    <div
      class="relative h-full min-h-0 w-full bg-contain bg-center bg-no-repeat"
      style={{
        "background-color": TYPE_COLOURS[props.type] ?? "#999",
        "background-image": `url(/icons/${props.type}.svg?v=2)`,
      }}
    />
  );
};
