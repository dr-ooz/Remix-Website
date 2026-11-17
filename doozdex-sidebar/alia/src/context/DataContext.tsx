import type { Unwatch } from "wxt/utils/storage";

export const DatasetIdContext = createContext<Solid.Accessor<string | null>>();
export const PokedexContext = createContext<Solid.Accessor<Record<string, PokemonData> | null>>();
export const MovesContext = createContext<Solid.Accessor<Record<string, MoveData> | null>>();
export const SheetIdContext = createContext<Solid.Accessor<string | null>>();
export const InitialisedContext = createContext<Solid.Accessor<boolean>>();
export const OpenPokemonTypeCtx =
  createContext<[Solid.Accessor<string | null>, Solid.Setter<string | null>]>();

export const DataProvider: Solid.ParentComponent = (props) => {
  const [datasetId, setDatasetId] = createSignal<string | null>(null);
  const [pokedex, setPokedex] = createSignal<Record<string, PokemonData> | null>(null);
  const [moves, setMoves] = createSignal<Record<string, MoveData> | null>(null);
  const [sheetId, setSheetId] = createSignal<string | null>(null);
  const [initialised, setInitialised] = createSignal(false);
  const [opt, sopt] = createSignal<string | null>(null);

  let unwatchDatasetId: Unwatch | null = null;
  let unwatchPokedex: Unwatch | null = null;
  let unwatchMoves: Unwatch | null = null;
  let unwatchSheetId: Unwatch | null = null;

  onMount(async () => {
    const initialDatasetId = await storage.getItem<string>(STORAGE_KEYS.datasetId);
    if (initialDatasetId) setDatasetId(initialDatasetId);

    const initialPokedex = await storage.getItem<Record<string, PokemonData>>(STORAGE_KEYS.pokedex);
    if (initialPokedex) setPokedex(initialPokedex);

    const initialMoves = await storage.getItem<Record<string, MoveData>>(STORAGE_KEYS.moves);
    if (initialMoves) setMoves(initialMoves);

    const initialSheetId = await storage.getItem<string>(STORAGE_KEYS.sheetId);
    if (initialSheetId) setSheetId(initialSheetId);

    setInitialised(true);

    unwatchDatasetId = storage.watch<string>(STORAGE_KEYS.datasetId, (value) =>
      setDatasetId(value),
    );

    unwatchPokedex = storage.watch<Record<string, PokemonData>>(STORAGE_KEYS.pokedex, (value) =>
      setPokedex(value),
    );

    unwatchMoves = storage.watch<Record<string, MoveData>>(STORAGE_KEYS.moves, (value) =>
      setMoves(value),
    );

    unwatchSheetId = storage.watch<string>(STORAGE_KEYS.sheetId, (value) => setSheetId(value));
  });

  onCleanup(() => {
    unwatchDatasetId?.();
    unwatchPokedex?.();
    unwatchMoves?.();
    unwatchSheetId?.();
  });

  return (
    <DatasetIdContext.Provider value={datasetId}>
      <PokedexContext.Provider value={pokedex}>
        <MovesContext.Provider value={moves}>
          <SheetIdContext.Provider value={sheetId}>
            <InitialisedContext.Provider value={initialised}>
              <OpenPokemonTypeCtx.Provider value={[opt, sopt]}>
                {props.children}
              </OpenPokemonTypeCtx.Provider>
            </InitialisedContext.Provider>
          </SheetIdContext.Provider>
        </MovesContext.Provider>
      </PokedexContext.Provider>
    </DatasetIdContext.Provider>
  );
};
