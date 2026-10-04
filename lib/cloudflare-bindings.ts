import { env } from "cloudflare:workers";

type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
};

export type CmsDatabase = {
  prepare(query: string): D1Statement;
};

export type MediaObject = {
  body: ReadableStream;
  etag: string;
  httpMetadata?: { contentType?: string };
};

export type MediaBucket = {
  get(key: string): Promise<MediaObject | null>;
  put(key: string, value: ReadableStream | ArrayBuffer | string, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
};

type B28CloudflareEnv = {
  CMS_DB?: CmsDatabase;
  CMS_MEDIA?: MediaBucket;
};

const bindings = env as unknown as B28CloudflareEnv;

export const cloudflareCmsDatabase = () => bindings.CMS_DB;
export const cloudflareMediaBucket = () => bindings.CMS_MEDIA;
