import { createSignal, onMount, For, Switch, Match } from "solid-js";

const Layout = () => {
  const [inputValue, setInputValue] = createSignal(DATASET_IDS[0]!.value);
  const [updatingData, setUpdatingData] = createSignal(false);
  const [screen, setScreen] = createSignal("pokedex");
  const [datasetId, setDatasetId] = createSignal(DATASET_IDS[0]!.value);
  const [, setPinnedMoves] = usePinnedMoves();
  const pokedex = usePokedex();
  const initialised = useInitialised();
  const opt = useOPT()![0];

  onMount(async () => {
    try {
      const storedId = await storage.getItem(STORAGE_KEYS.datasetId);
      if (storedId && typeof storedId === "string") {
        setInputValue(storedId);
        setDatasetId(storedId);
      }

      const storedScreen = await storage.getItem("session:screen");
      if (storedScreen && typeof storedScreen === "string") {
        setScreen(storedScreen);
      }
    } catch (error) {
      console.error("Failed to load data from storage:", error);
    }
  });

  const updateData = () => {
    const value = inputValue();

    setUpdatingData(true);

    browser.runtime
      .sendMessage({ action: "updateData", datasetId: value } as Message)
      .then(async () => {
        await storage.setItem(STORAGE_KEYS.datasetId, value);
        setDatasetId(value);
        setUpdatingData(false);
        setPinnedMoves(new Set<string>());
      })
      .catch(console.error);
  };

  createEffect(() => initialised() && pokedex() === null && updateData());

  createEffect(() => {
    if (opt()) {
      setScreen("moves");
      void storage.setItem("session:screen", "moves");
    }
  });

  return (
    <div
      class="mx-auto flex h-dvh w-full flex-col bg-black text-white select-none"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <div class="flex h-8 shrink-0 gap-1 p-1">
        <For each={SCREENS}>
          {(page) => (
            <Button
              class="flex-1"
              onClick={() => {
                setScreen(page.value);
                void storage.setItem("session:screen", page.value);
              }}
              disabled={screen() === page.value}
            >
              {page.label}
            </Button>
          )}
        </For>
      </div>

      <div class="flex flex-auto flex-col overflow-hidden">
        <Switch>
          <Match when={screen() === "pokedex"}>
            <ScreenPokedex datasetId={datasetId()} />
          </Match>
          <Match when={screen() === "moves"}>
            <ScreenMoves />
            <ScreenTypeChart />
          </Match>
        </Switch>
      </div>
    </div>
  );
};

export const App = () => {
  return (
    <DataProvider>
      <PinnedProvider>
        <Layout />
      </PinnedProvider>
    </DataProvider>
  );
};
