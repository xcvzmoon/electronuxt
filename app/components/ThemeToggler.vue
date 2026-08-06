<script setup lang="ts">
  import { Icon } from '@iconify/vue';

  const colorMode = useColorMode();

  const isDark = computed({
    get: () => colorMode.value === 'dark',
    set: (_isDark) => (colorMode.preference = _isDark ? 'dark' : 'light'),
  });
</script>

<template>
  <Button
    size="icon"
    variant="ghost"
    @click="isDark = !isDark"
  >
    <span class="sr-only">Toggle theme</span>

    <Icon
      icon="lucide:moon"
      class="size-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
    />

    <Icon
      icon="lucide:sun"
      class="absolute size-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
    />
  </Button>
</template>
