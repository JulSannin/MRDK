import type { Config } from "@react-router/dev/config";

/** Конфигурация React Router с SSR */
export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true,
} satisfies Config;
