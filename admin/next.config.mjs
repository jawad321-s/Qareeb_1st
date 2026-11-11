/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `next build` writes a static site to out/, published on Firebase Hosting
  // (firebase.json here). Every page runs in the browser and talks to Firebase
  // directly, so no server is needed.
  output: 'export',
  images: { unoptimized: true },
};
export default nextConfig;
