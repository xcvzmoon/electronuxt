import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2026-04-08',
  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
      },
      meta: [
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1',
        },
        {
          'http-equiv': 'Content-Security-Policy',
          content:
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: http: https:;",
        },
      ],
      link: [
        {
          rel: 'icon',
          href: './favicon.ico',
        },
      ],
    },
  },
  devtools: {
    enabled: true,
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['@vue/devtools-core', '@vue/devtools-kit', 'vue', 'vue-router', 'zod'],
    },
  },
  css: ['~/assets/css/main.css'],
  modules: ['@nuxt/ui', '@vueuse/nuxt', '@nuxt/hints', '@nuxt/test-utils', 'nuxt-electron'],
  colorMode: {
    preference: 'dark',
    fallback: 'dark',
  },
  routeRules: {
    '/': {
      prerender: true,
    },
  },
  router: {
    options: {
      hashMode: true,
    },
  },
  electron: {
    build: [
      {
        entry: 'electron/main.ts',
      },
      {
        entry: 'electron/preload.ts',
        vite: {
          build: {
            lib: {
              entry: 'electron/preload.ts',
              formats: ['es'],
              fileName: () => 'preload.mjs',
            },
          },
        },
        onstart: (args) => {
          args.reload();
        },
      },
    ],
    disableDefaultOptions: true,
    renderer: {},
  },
  ssr: false,
});
