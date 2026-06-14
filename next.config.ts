import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.0.104', '192.168.0.100'],

  async headers() {
    return [
      {
        // Apply to all routes
        source: "/:path*",
        headers: [
          {
            // Prevents the site from being embedded in an iframe on another
            // domain — blocks clickjacking attacks.
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            // Prevents browsers from trying to guess ("sniff") the content
            // type of a file, which can be abused to execute malicious files.
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            // Controls how much referrer information is sent when
            // navigating away from your site.
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            // Restricts access to browser features like camera, microphone,
            // geolocation — none of which this store needs.
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            // Content Security Policy — restricts where scripts, styles,
            // images, and connections can come from. Allows:
            // - self (your own domain)
            // - Google (for OAuth + fonts)
            // - Cloudinary (for product images)
            // - SSLCommerz/payment if re-added later
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https://res.cloudinary.com https://lh3.googleusercontent.com",
              "connect-src 'self' https://accounts.google.com",
              "frame-src 'self' https://accounts.google.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
