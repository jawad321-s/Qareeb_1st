// Chat messages are stored encrypted. Each conversation (one per request) has
// its own random 256-bit key, kept apart from the messages in
// requests/{id}/private/chatKey, which only the customer and the hired artisan
// can read (see firestore.rules). A message is saved as `cipher` (XSalsa20-
// Poly1305, tweetnacl's secretbox) — its text and photo link never reach the
// database in the clear.
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import * as Crypto from 'expo-crypto';

// React Native has no Web Crypto: random bytes come from the OS via expo-crypto.
nacl.setPRNG((x: Uint8Array, n: number) => {
  const bytes = Crypto.getRandomBytes(n);
  for (let i = 0; i < n; i++) x[i] = bytes[i];
});

/** What a message carries, before encryption. */
export interface ChatPayload {
  text?: string;
  mediaUrl?: string;
  /** Several photos sent together (mediaUrl repeats the first, for older app versions). */
  mediaUrls?: string[];
}

export const newChatKey = (): string => naclUtil.encodeBase64(nacl.randomBytes(nacl.secretbox.keyLength));

export function encryptChat(payload: ChatPayload, keyB64: string): string {
  const key = naclUtil.decodeBase64(keyB64);
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const box = nacl.secretbox(naclUtil.decodeUTF8(JSON.stringify(payload)), nonce, key);
  const out = new Uint8Array(nonce.length + box.length);
  out.set(nonce);
  out.set(box, nonce.length);
  return naclUtil.encodeBase64(out);
}

/** The message, or null when it can't be opened (wrong key or altered). */
export function decryptChat(cipherB64: string, keyB64: string): ChatPayload | null {
  try {
    const key = naclUtil.decodeBase64(keyB64);
    const all = naclUtil.decodeBase64(cipherB64);
    const nonce = all.slice(0, nacl.secretbox.nonceLength);
    const opened = nacl.secretbox.open(all.slice(nacl.secretbox.nonceLength), nonce, key);
    if (!opened) return null;
    const v = JSON.parse(naclUtil.encodeUTF8(opened));
    const urls = Array.isArray(v.mediaUrls) ? v.mediaUrls.filter((u: unknown): u is string => typeof u === 'string') : [];
    return {
      text: typeof v.text === 'string' ? v.text : undefined,
      mediaUrl: typeof v.mediaUrl === 'string' ? v.mediaUrl : undefined,
      ...(urls.length ? { mediaUrls: urls } : {}),
    };
  } catch {
    return null;
  }
}
