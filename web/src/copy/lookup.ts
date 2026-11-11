// Typed lookups into catalog copy by string id (ids are string aliases in shared/types).
import { catalogCopy } from "./en/catalog";

const souvenirs: Record<string, { name: string; note: string } | undefined> = catalogCopy.souvenirs;
const stories: Record<string, string | undefined> = catalogCopy.stories;

export const souvenirCopy = (id: string) => souvenirs[id] ?? { name: id, note: "" };
export const storyCopy = (id: string, name: string) => (stories[id] ?? "").replace(/\{name\}/g, name);
