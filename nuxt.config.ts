import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2026-08-03',
  css: ['~/assets/css/tailwind.css'],
  modules: ['shadcn-nuxt', '@nuxtjs/color-mode'],
  vite: {
    plugins: [tailwindcss()],
  },
  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },
  colorMode: {
    classSuffix: '',
  },
  runtimeConfig: {
    electronApiToken: '',
  },
  devtools: {
    enabled: true,
  },
});
