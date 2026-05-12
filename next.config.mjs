/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Erlaubt dem Vercel-Server ryzzla.org zu erreichen
  // (kein CORS-Problem, weil server-zu-server)
  async headers() {
    return [
      {
        source: "/api/ha",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ]
  },
}

export default nextConfig
