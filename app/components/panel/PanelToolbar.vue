<script setup lang="ts">
import { refDebounced } from "@vueuse/core";

const search = defineModel<string>("search", { required: true });
const debouncedSearch = refDebounced(search, 200);

const volume = defineModel<number>("volume", { required: true });

const volumeIcon = computed(() => {
  switch (true) {
    case volume.value === 0:
      return "pixelarticons:volume-x";
    case volume.value <= 33:
      return "pixelarticons:volume-1";
    case volume.value <= 66:
      return "pixelarticons:volume-2";
    default:
      return "pixelarticons:volume-3";
  }
});
</script>

<template>
  <UHeader
    class="sticky top-0"
    :toggle="false"
    :ui="{ container: 'gap-2', left: 'block! w-full', right: 'flex-0!', center: 'hidden!' }"
  >
    <template #left>
      <label for="search" class="sr-only">
        Search user...
      </label>
      <UInput
        id="search"
        v-model="search"
        icon="pixelarticons:search"
        type="search"
        size="sm"
        placeholder="Search user..."
        class="w-full"
        :loading="search !== debouncedSearch"
      />
    </template>

    <template #right>
      <UPopover>
        <UButton
          color="neutral"
          variant="outline"
          size="sm"
          :icon="volumeIcon"
        />
        <template #content>
          <div class="w-10 flex flex-col items-center justify-center gap-2 py-2">
            <span class="text-xs">{{ volume }}%</span>
            <USlider v-model="volume" orientation="vertical" class="h-24" />
          </div>
        </template>
      </UPopover>
    </template>
  </UHeader>
</template>
