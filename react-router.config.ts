import type { Config } from "@react-router/dev/config";

// React Router configuration - Hybrid SSR
// SSR enabled for SEO and initial HTML structure
// Data loads on client side (clientLoader) for simplicity and reliability
export default {
  // Config options...
  ssr: true,
} satisfies Config;
