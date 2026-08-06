<script setup lang="ts">
  const { data, pending, execute } = useFetch('/api', { immediate: false });
</script>

<template>
  <div class="relative h-svh p-4">
    <ThemeToggler class="absolute top-4 right-4" />

    <Button
      :disabled="pending"
      @click="execute"
    >
      Fetch
    </Button>

    <p v-if="data">{{ data }}</p>
  </div>
</template>
