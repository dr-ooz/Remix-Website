function buildSheetUrl(sheetId: string, gid: string | number, range: string) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/edit#gid=${gid}&range=${encodeURIComponent(range)}`;
}

function isSameSpreadsheet(a: URL, b: URL) {
  return a.origin === b.origin && a.pathname === b.pathname;
}

function isEmptyTabUrl(url?: string) {
  return (
    !url ||
    url === "about:blank" ||
    url === "about:newtab" ||
    url === "chrome://newtab/" ||
    url.startsWith("chrome://new-tab-page")
  );
}

export async function openRange({ gid, range }: SheetRange, sheetId: string) {
  const targetUrl = buildSheetUrl(sheetId, gid, range);

  try {
    const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });

    if (activeTab?.url && activeTab.id !== undefined) {
      const activeUrl = new URL(activeTab.url);
      const parsedTarget = new URL(targetUrl);

      if (isSameSpreadsheet(activeUrl, parsedTarget)) {
        const hashParams = new URLSearchParams(activeUrl.hash.substring(1));
        const currentGid = hashParams.get("gid");

        if (currentGid === String(gid)) {
          hashParams.set("range", range);
          activeUrl.hash = hashParams.toString();
          await browser.tabs.update(activeTab.id, { url: activeUrl.toString() });
        } else {
          await browser.tabs.update(activeTab.id, { url: targetUrl });
        }
        return;
      }
    }

    if (isEmptyTabUrl(activeTab?.url) && activeTab?.id !== undefined) {
      await browser.tabs.update(activeTab.id, { url: targetUrl });
    } else {
      await browser.tabs.create({ url: targetUrl });
    }
  } catch (error) {
    console.error("Error opening range:", error);
  }
}
