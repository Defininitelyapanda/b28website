import { mkdir, open, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
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

const isBuildPhase = process.env.B28_BUILD_PHASE === "1";
const configuredDataDirectory = isBuildPhase ? undefined : process.env.CMS_DATA_DIR?.trim();
export const hasPersistentDataDirectory = Boolean(configuredDataDirectory);
const dataDirectory = configuredDataDirectory ? path.resolve(configuredDataDirectory) : path.join(process.cwd(), "data");
const storePath = path.join(dataDirectory, "cms.json");
const lockPath = path.join(dataDirectory, "cms.lock");
let writes = Promise.resolve();
const emptyStore = (): LocalStore => ({ content: [], versions: [], contacts: [], media: [], settings: [], navigation: [], activity: [], backups: [] });

const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function acquireWriteLock() {
  await mkdir(dataDirectory, { recursive: true });
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const handle = await open(lockPath, "wx");
      await handle.writeFile(`${process.pid}:${new Date().toISOString()}`, "utf8");
      return async () => { await handle.close(); await rm(lockPath, { force: true }); };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      try {
        const lock = await stat(lockPath);
        if (Date.now() - lock.mtimeMs > 30_000) await rm(lockPath, { force: true });
      } catch (lockError) {
        if ((lockError as NodeJS.ErrnoException).code !== "ENOENT") throw lockError;
      }
      await delay(25 + attempt * 2);
    }
  }
  throw new Error("CMS_WRITE_LOCK_TIMEOUT");
}

async function writeStore(store: LocalStore) {
  const temporaryPath = path.join(dataDirectory, `.cms.${process.pid}.${crypto.randomUUID()}.tmp`);
  try {
    await writeFile(temporaryPath, JSON.stringify(store, null, 2), "utf8");
    await rename(temporaryPath, storePath);
  } catch (error) {
    await rm(temporaryPath, { force: true });
    throw error;
  }
}

export async function readStore(): Promise<LocalStore> {
  try {
    return { ...emptyStore(), ...JSON.parse(await readFile(storePath, "utf8")) } as LocalStore;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    await mkdir(dataDirectory, { recursive: true });
    const initial = emptyStore();
    await writeStore(initial);
    return initial;
  }
}

export function updateStore<T>(change: (store: LocalStore) => T | Promise<T>): Promise<T> {
  let resolveResult!: (value: T | PromiseLike<T>) => void;
  let rejectResult!: (reason?: unknown) => void;
  const result = new Promise<T>((resolve, reject) => { resolveResult = resolve; rejectResult = reject; });
  writes = writes.catch(() => undefined).then(async () => {
    let release: (() => Promise<void>) | undefined;
    try {
      release = await acquireWriteLock();
      const store = await readStore();
      const value = await change(store);
      await writeStore(store);
      resolveResult(value);
    } catch (error) {
      rejectResult(error);
    } finally {
      await release?.();
    }
  });
  return result;
}

export function localDataPaths() { return { dataDirectory, storePath }; }
