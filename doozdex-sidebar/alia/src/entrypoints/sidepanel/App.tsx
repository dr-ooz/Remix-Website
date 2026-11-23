import { createSignal, onMount, For, Switch, Match, Show } from "solid-js";

const Layout = () => {
  const [inputValue, setInputValue] = createSignal(DATASET_IDS[0]!.value);
  const [updatingData, setUpdatingData] = createSignal(false);
  const [screen, setScreen] = createSignal("pokedex");
  const [helpOpen, setHelpOpen] = createSignal(false);
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
      {/* Remix: credit to Alia + the Help panel */}
      <div class="flex shrink-0 items-center gap-1 px-1 pt-1">
        {/* one row: the text shrinks to the row's width (container query units) */}
        <div class="min-w-0 flex-1 px-1 py-[3px] text-center leading-none [container-type:inline-size]">
          <span class="whitespace-nowrap" style={{ "font-size": "min(12px, 3.55cqi)" }}>
            Thanks to{" "}
            <a href="https://alicedcodes.github.io" target="_blank" rel="noopener" class="font-bold text-[#c9a6ef] underline">
              Alia
            </a>{" "}
            for her help on the sidebar functionality!
          </span>
        </div>
        <Button
          class="h-[20px] shrink-0 border-2 border-[#8a5ab8] bg-[#221d2a] px-1.5 text-[11px] leading-none font-bold text-[#c9a6ef]"
          onClick={() => setHelpOpen(!helpOpen())}
        >
          Help?
        </Button>
      </div>
      <Show when={helpOpen()}>
        <div class="mx-1 mt-1 shrink-0 rounded border-2 border-[#8a5ab8] bg-[#221d2a] p-2 text-xs">
          <div class="mb-1 flex items-center justify-between">
            <b class="text-sm text-[#c9a6ef]">DoozDex sidebar help</b>
            <button class="cursor-pointer px-1 text-[#a59cb3]" onClick={() => setHelpOpen(false)}>
              ✕
            </button>
          </div>
          <p class="text-[#a59cb3] italic">Guides and instructions coming soon.</p>
        </div>
      </Show>

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
