let updatingPromise: Promise<UpdateDataResponse> | null = null;

const updateData = async (datasetId: string) => {
  if (!datasetId) throw new Error("No dataset ID provided");

  const data = await fetchData(datasetId);
  if (!data) throw new Error("Failed to fetch data");

  await storage.setItem(STORAGE_KEYS.pokedex, data.pokedex);
  await storage.setItem(STORAGE_KEYS.moves, data.moves);
  await storage.setItem(STORAGE_KEYS.sheetId, data.sheetId);
  await storage.setItem(STORAGE_KEYS.datasetId, datasetId);
};

export default defineBackground({
  main() {
    browser.runtime.onMessage.addListener((m: Message, _, sendResponse) => {
      if (m.action === "updateData") {
        if (!updatingPromise) {
          updatingPromise = (async (): Promise<UpdateDataResponse> => {
            try {
              const datasetId = m.datasetId;
              if (!datasetId) throw new Error("No dataset ID provided");

              const now = performance.now();
              console.info("[Background] Updating data...");

              await updateData(datasetId);

              const duration = performance.now() - now;
              console.info(
                "[Background] Finished updating data in %c%s seconds%c!",
                "color: green; font-weight: bold;",
                (duration / 1000).toFixed(2),
                "",
              );

              return { success: true };
            } catch (error) {
              console.error(error);
              return { success: false };
            } finally {
              updatingPromise = null;
            }
          })();
        }

        void updatingPromise.then((response) => {
          sendResponse(response);
        });

        return true;
      }
    });

    if (import.meta.env.CHROME) {
      browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);
    }

    if (import.meta.env.FIREFOX) {
      browser.browserAction.onClicked.addListener(() => {
        browser.sidebarAction.toggle().catch(console.error);
      });
    }
  },
});
