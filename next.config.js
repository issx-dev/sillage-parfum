/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/chanel-5", destination: "/productos/chanel-5-edp", permanent: true },
      { source: "/sauvage-dior", destination: "/productos/sauvage-dior-edt", permanent: true },
      { source: "/black-orchid", destination: "/productos/black-orchid-edp", permanent: true },
      { source: "/acqua-di-gio", destination: "/productos/acqua-di-gio-edt", permanent: true },
      { source: "/libre-ysl", destination: "/productos/libre-edp", permanent: true },
      { source: "/flowerbomb", destination: "/productos/flowerbomb-edp", permanent: true },
      { source: "/bleu-de-chanel", destination: "/productos/bleu-de-chanel-edp", permanent: true },
      { source: "/alien", destination: "/productos/alien-edp", permanent: true },
      { source: "/la-vie-est-belle", destination: "/productos/la-vie-est-belle-edp", permanent: true },
      { source: "/baccarat-rouge", destination: "/productos/baccarat-rouge-540", permanent: true },
      { source: "/aventus-creed", destination: "/productos/aventus-creed-edt", permanent: true },
      { source: "/light-blue-dg", destination: "/productos/light-blue-edt", permanent: true },
    ];
  },
};

module.exports = nextConfig;
