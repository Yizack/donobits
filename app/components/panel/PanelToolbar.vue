<script setup lang="ts">
import { refDebounced } from "@vueuse/core";

const search = defineModel<string>("search", { required: true });
const debouncedSearch = refDebounced(search, 200);

const volume = defineModel<number>("volume", { required: true });
</script>

<template>
  <UHeader
    class="sticky top-0"
    :toggle="false"
    :ui="{ left: 'block! w-full', center: 'hidden!' }"
  >
    <template #left>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
      </div>
    </template>

    <template #right>
      <UPopover>
        <UButton
          color="neutral"
          variant="outline"
          :icon="volume > 0 ? 'pixelarticons:volume-3' : 'pixelarticons:volume-x'"
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
