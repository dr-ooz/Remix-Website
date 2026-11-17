// Stand-ins for the browser-extension APIs Alia's code uses, so it runs as a
// normal web page. "local:" keys go to localStorage, "session:" keys to
// sessionStorage, except the game data, which only lives in memory and is
// loaded from data.json (built from the calc's files by build_data.py).

// Always the Remix dataset (no picker on the site).
const DATASET = "remix";
const MEMORY_ONLY = new Set(["local:pokedex", "local:moves", "local:sheetId", "local:datasetId"]);

export type Unwatch = () => void;
type Watcher = (value: any) => void;

const memory = new Map<string, unknown>();
const watchers = new Map<string, Set<Watcher>>();

const area = (key: string) => {
  try {
    return key.startsWith("session:") ? sessionStorage : localStorage;
  } catch {
    return null;
  }
};
const storeKey = (key: string) => "doozdex:" + key;

export const storage = {
  async getItem<T>(key: string): Promise<T | null> {
    if (key === "local:datasetId") return DATASET as T;
    if (memory.has(key)) return memory.get(key) as T;
    if (MEMORY_ONLY.has(key)) return null;
    try {
      const raw = area(key)?.getItem(storeKey(key));
      if (raw != null) {
        const value = JSON.parse(raw) as T;
        memory.set(key, value);
        return value;
      }
    } catch {}
    return null;
  },
  async setItem<T>(key: string, value: T): Promise<void> {
    memory.set(key, value);
    if (!MEMORY_ONLY.has(key))
      try {
        area(key)?.setItem(storeKey(key), JSON.stringify(value));
      } catch {}
    watchers.get(key)?.forEach((cb) => cb(value));
  },
  watch<T>(key: string, cb: (value: T) => void): Unwatch {
    if (!watchers.has(key)) watchers.set(key, new Set());
    watchers.get(key)!.add(cb as Watcher);
    return () => watchers.get(key)?.delete(cb as Watcher);
  },
};

// The extension's background script downloaded the data; here it's a file on the site.
let updating: Promise<{ success: boolean }> | null = null;
async function updateData(_datasetId: string) {
  const res = await fetch((globalThis as any).__DZ_BASE + "data.json", { cache: "no-cache" });
  if (!res.ok) throw new Error("Failed to load data.json: " + res.status);
  const data = (await res.json()) as Data;
  const datasetId = DATASET;
  await storage.setItem("local:pokedex", data.pokedex);
  await storage.setItem("local:moves", data.moves);
  await storage.setItem("local:sheetId", data.sheetId);
  await storage.setItem("local:datasetId", datasetId);
}

export const browser = {
  runtime: {
    sendMessage(m: { action: string; datasetId?: string }) {
      if (m.action !== "updateData") return Promise.resolve(undefined);
      updating ??= updateData(m.datasetId ?? "")
        .then(() => ({ success: true }))
        .catch((e) => (console.error(e), { success: false }))
        .finally(() => (updating = null));
      return updating;
    },
  },
  // Clicking a mon opened its row in the Google Sheet; open it in a new tab.
  tabs: {
    async query() {
      return [] as { id?: number; url?: string }[];
    },
    async update(_id: number, { url }: { url: string }) {
      window.open(url, "_blank", "noopener");
    },
    async create({ url }: { url: string }) {
      window.open(url, "_blank", "noopener");
    },
  },
};
