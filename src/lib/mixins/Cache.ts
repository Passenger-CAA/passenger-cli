import { Cache as FileSystemCache } from "file-system-cache";

export const Cache = FileSystemCache.bind(null, {
  basePath: "./node_modules/.cache/passenger",
  ns: "passenger",
  hash: "sha1",
  ttl: 60,
});
