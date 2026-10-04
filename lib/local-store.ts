import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ContentItem } from "./cms-types";

export type LocalUser = { id: string; email: string; name: string; role: string; active: boolean; created_at: string; updated_at: string };
export type StoredPasskey = {
  id: string;
  credential_id: string;
  public_key: string;
  counter: number;
  transports: string[];
  device_type: string;
  backed_up: boolean;
  label: string;
  created_at: string;
  last_used_at: string | null;
};
export type PasskeyChallenge = { id: string; challenge: string; purpose: "registration" | "authentication"; expires_at: string };
export type LocalStore = {
  content: ContentItem[];
  versions: Array<Record<string, unknown>>;
  users: LocalUser[];
  contacts: Array<Record<string, unknown>>;
  media: Array<Record<string, unknown>>;
  settings: Array<Record<string, unknown>>;
  navigation: Array<Record<string, unknown>>;
  activity: Array<Record<string, unknown>>;
  backups: Array<Record<string, unknown>>;
  passkeys: StoredPasskey[];
  passkey_challenges: PasskeyChallenge[];
};

const dataDirectory = path.join(process.cwd(), "data");
const storePath = path.join(dataDirectory, "cms.json");
let writes = Promise.resolve();
const emptyStore = (): LocalStore => ({ content: [], versions: [], users: [], contacts: [], media: [], settings: [], navigation: [], activity: [], backups: [], passkeys: [], passkey_challenges: [] });

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
