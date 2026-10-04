import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ContentItem } from "./cms-types";

export type LocalStore = {
  content: ContentItem[];
  versions: Array<Record<string, unknown>>;
  contacts: Array<Record<string, unknown>>;
  media: Array<Record<string, unknown>>;
  settings: Array<Record<string, unknown>>;
  navigation: Array<Record<string, unknown>>;
  activity: Array<Record<string, unknown>>;
  backups: Array<Record<string, unknown>>;
};

const dataDirectory = path.join(process.cwd(), "data");
const storePath = path.join(dataDirectory, "cms.json");
let writes = Promise.resolve();
const emptyStore = (): LocalStore => ({ content: [], versions: [], contacts: [], media: [], settings: [], navigation: [], activity: [], backups: [] });

export async function readStore(): Promise<LocalStore> {
  try {
    return { ...emptyStore(), ...JSON.parse(await readFile(storePath, "utf8")) } as LocalStore;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    await mkdir(dataDirectory, { recursive: true });
    const initial = emptyStore();
    await writeFile(storePath, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }
}

export function updateStore<T>(change: (store: LocalStore) => T | Promise<T>): Promise<T> {
  let resolveResult!: (value: T | PromiseLike<T>) => void;
  let rejectResult!: (reason?: unknown) => void;
  const result = new Promise<T>((resolve, reject) => { resolveResult = resolve; rejectResult = reject; });
  writes = writes.catch(() => undefined).then(async () => {
    try {
      const store = await readStore();
      const value = await change(store);
      await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
      resolveResult(value);
    } catch (error) { rejectResult(error); }
  });
  return result;
}

export function localDataPaths() { return { dataDirectory, storePath }; }
