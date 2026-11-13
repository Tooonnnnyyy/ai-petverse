import { createStore, del, get, set } from "idb-keyval";
import { PHOTO_DB_NAME } from "./save";

const PHOTO_KEY = "petverse.primary-photos.v1";
const PHOTO_STORE = createStore(PHOTO_DB_NAME, "photos");
const MAX_PHOTOS = 3;
const MAX_BYTES = 8 * 1024 * 1024;

export async function savePetPhotos(files: readonly File[]): Promise<{ count: number; firstUrl: string | null }> {
  const images = files.filter((f) => f.type.startsWith("image/") && f.size <= MAX_BYTES).slice(0, MAX_PHOTOS);
  if (!images.length) return { count: 0, firstUrl: null };
  await set(PHOTO_KEY, images, PHOTO_STORE);
  return { count: images.length, firstUrl: URL.createObjectURL(images[0]) };
}

export async function loadPetPhotoUrl(): Promise<string | null> {
  const files = await get<Blob[]>(PHOTO_KEY, PHOTO_STORE);
  const first = files?.[0];
  return first instanceof Blob ? URL.createObjectURL(first) : null;
}

export async function deletePetPhotos(): Promise<void> {
  await del(PHOTO_KEY, PHOTO_STORE);
}

export const photoLimits = { maxPhotos: MAX_PHOTOS, maxBytes: MAX_BYTES } as const;
