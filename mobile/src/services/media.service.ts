// Photos on Cloud Storage: the artisan's work gallery, photos attached to a
// request, and images sent in chat. Each photo is shrunk on the device first,
// then uploaded; Firestore keeps only its download URL (artisanProfiles.gallery,
// a request's images, or a chat message's mediaUrl).
import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { getBucket, getDb } from '@/lib/firebase';
import { config } from '@/lib/config';

// Longest side of an uploaded photo: sharp on a phone, a few hundred KB.
const MAX_SIDE = 1600;

/** A picked photo → a JPEG on the device, at most MAX_SIDE on its longest side. */
async function shrink(uri: string): Promise<string> {
  const { width, height } = await ImageManipulator.manipulate(uri).renderAsync();
  let ctx = ImageManipulator.manipulate(uri);
  if (Math.max(width, height) > MAX_SIDE) ctx = ctx.resize(width >= height ? { width: MAX_SIDE } : { height: MAX_SIDE });
  const image = await ctx.renderAsync();
  const { uri: jpeg } = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.7 });
  return jpeg;
}

/** A local file as a Blob. React Native's fetch can't reliably read local files as one. */
function blobOf(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = () => reject(new Error('read-failed'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

const fileName = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

/** Uploads a photo to `path` and returns its download URL. */
async function upload(path: string, uri: string): Promise<string> {
  const bucket = getBucket();
  if (!bucket) throw new Error('storage-unavailable');
  const blob = await blobOf(await shrink(uri));
  const fileRef = ref(bucket, path);
  try {
    await uploadBytes(fileRef, blob, { contentType: 'image/jpeg' });
  } finally {
    // React Native blobs hold native memory until closed.
    (blob as Blob & { close?: () => void }).close?.();
  }
  return getDownloadURL(fileRef);
}

/** Adds a photo to the artisan's public work gallery and returns its URL. */
export async function addGalleryPhoto(uid: string, uri: string): Promise<string> {
  const url = await upload(`users/${uid}/gallery/${fileName()}`, uri);
  await updateDoc(doc(getDb()!, 'artisanProfiles', uid), { gallery: arrayUnion(url), updatedAt: Date.now() });
  return url;
}

/** Takes a photo out of the gallery and deletes its file. */
export async function removeGalleryPhoto(uid: string, url: string): Promise<void> {
  await updateDoc(doc(getDb()!, 'artisanProfiles', uid), { gallery: arrayRemove(url), updatedAt: Date.now() });
  const bucket = getBucket();
  // A photo stored elsewhere (not in this bucket) only leaves the list.
  if (bucket) await deleteObject(ref(bucket, url)).catch(() => {});
}

/** Uploads a photo attached to a new request and returns its URL. */
export function uploadRequestPhoto(requestId: string, uri: string): Promise<string> {
  return upload(`requests/${requestId}/${fileName()}`, uri);
}

/**
 * The photos of a request that can be shown. Requests made before photos were
 * uploaded hold paths on the customer's phone, which no other device can open;
 * live, only web links are kept. The demo shows everything.
 */
export const shownPhotos = (uris: string[] = []) => (config.useMock ? uris : uris.filter((u) => /^https?:\/\//.test(u)));

/** Uploads a photo for the chat on a request and returns its URL. */
export function uploadChatPhoto(requestId: string, uri: string): Promise<string> {
  return upload(`chat/${requestId}/${fileName()}`, uri);
}
