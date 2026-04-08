<script setup lang="ts">
  const title = 'Kickstart Nuxt';
  const description = 'My nuxt starter template.';

  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogImage: 'https://ui.nuxt.com/assets/templates/nuxt/starter-light.png',
    twitterImage: 'https://ui.nuxt.com/assets/templates/nuxt/starter-light.png',
    twitterCard: 'summary_large_image',
  });
</script>

<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtLayout />
  </UApp>
</template>
