<template>
  <UCard
    class="overflow-visible animate-pulse"
    :ui="{ body: 'p-0!', footer: 'p-0!' }"
  >
    <div class="relative flex items-start justify-between gap-4 group cursor-wait">
      <div class="flex h-30 w-full items-center gap-3">
        <div class="absolute -top-2 left-1/2 h-6 w-24 -translate-x-1/2 bg-accented" />
      </div>
    </div>

    <template #footer>
      <div class="flex flex-col gap-3 text-xs text-dimmed sm:flex-row sm:items-center sm:justify-between">
        <UButton
          color="bits100"
          variant="soft"
          size="lg"
          icon="twitch:cheer"
          class="group"
          disabled
          block
        >
          <div class="h-3 w-10 rounded-full bg-bits100" />
        </UButton>
      </div>
    </template>
  </UCard>
</template>
