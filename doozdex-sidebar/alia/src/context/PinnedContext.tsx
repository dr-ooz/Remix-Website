export const PinnedMovesContext =
  createContext<[Solid.Accessor<Set<string>>, Solid.Setter<Set<string>>]>();

export const usePinnedMoves = () => {
  const ctx = useContext(PinnedMovesContext);
  if (ctx === undefined) throw new Error("usePinnedMoves must be used within a PinnedProvider");
  return ctx;
};

export const PinnedProvider: Solid.ParentComponent = (props) => {
  const [pinnedMoves, setPinnedMoves] = createSignal(new Set<string>());

  onMount(async () => {
    const initialPinnedMoves = await storage.getItem<string[]>(STORAGE_KEYS.pinnedMoves);
    if (initialPinnedMoves) setPinnedMoves(new Set(initialPinnedMoves));
  });

  createEffect(() => storage.setItem(STORAGE_KEYS.pinnedMoves, [...pinnedMoves()]));

  return (
    <PinnedMovesContext.Provider value={[pinnedMoves, setPinnedMoves]}>
      {props.children}
    </PinnedMovesContext.Provider>
  );
};
