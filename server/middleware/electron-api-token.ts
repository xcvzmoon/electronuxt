// The packaged Electron app listens on 127.0.0.1, which any local process can
// reach. The main process generates a per-launch token, passes it down via
// NUXT_ELECTRON_API_TOKEN, and stamps it onto renderer requests; everything
// without it is rejected. Empty token (plain `nuxt dev`/`nuxt preview`) disables
// the check.
export default defineEventHandler((event) => {
  const { electronApiToken } = useRuntimeConfig(event);

  if (electronApiToken === '') return;

  if (getHeader(event, 'x-electron-api-token') !== electronApiToken) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }
});
