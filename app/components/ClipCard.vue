<script setup lang="ts">
const props = defineProps<{
  clip: DonoClip;
  image?: string;
  price?: string;
  disabled: boolean;
  loading: boolean;
}>();

const model = defineModel<number | null>();

const isPlaying = computed(() => model.value === props.clip.ID);

const emit = defineEmits<{
  click: [];
}>();

const audio = ref<HTMLAudioElement | null>(null);

const togglePlayback = async () => {
  const player = audio.value;
  if (!player) return;

  if (isPlaying.value) {
    const wasPlaying = !player.paused;
    player.pause();
    player.currentTime = 0;

    if (!wasPlaying) {
      model.value = null;
    }

    return;
  }

  try {
    await player.play();
  }
  catch {
    model.value = null;
  }
};

const handlePlay = () => {
  model.value = props.clip.ID;
};

const handlePause = () => {
  if (!audio.value?.ended) {
    model.value = null;
  }
};

const handleEnded = () => {
  if (audio.value) {
    audio.value.currentTime = 0;
  }

  model.value = null;
};

watch(isPlaying, (isPlaying) => {
  const player = audio.value;
  if (isPlaying || !player) return;

  player.pause();
  player.currentTime = 0;
});
</script>

<template>
  <UCard
    class="overflow-visible"
    :ui="{ body: 'p-0!', footer: 'p-0!' }"
  >
    <div
      class="relative flex items-start justify-between gap-4 group bg-primary/25"
      :style="{
        backgroundImage: image ? `url(${image})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }"
    >
      <div class="absolute inset-0 bg-black/50 transition-colors group-hover:bg-black/75" />
      <div class="flex h-30 w-full items-center gap-3">
        <UBadge
          :label="clip.ViewerName"
          :title="clip.ViewerName"
          class="absolute -top-2 left-1/2 -translate-x-1/2 border-2 shadow-lg"
          :ui="{ label: 'max-w-25 truncate' }"
        />
      </div>

      <button
        type="button"
        class="absolute inset-0 z-10 flex items-center justify-center text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        :aria-label="isPlaying ? `Stop clip from ${clip.ViewerName}` : `Play clip from ${clip.ViewerName}`"
        @click="togglePlayback"
      >
        <Icon
          :name="isPlaying ? 'pixelarticons:pause' : 'pixelarticons:play'"
          class="size-20 transition-transform group-hover:scale-110"
        />
      </button>
    </div>

    <div class="space-y-4">
      <audio
        ref="audio"
        preload="none"
        class="h-10 w-full"
        :src="clip.AssetUrl"
        :aria-label="`Play clip from ${clip.ViewerName}`"
        @ended="handleEnded"
        @pause="handlePause"
        @play="handlePlay"
      >
        Your browser does not support audio playback.
      </audio>
    </div>

    <template #footer>
      <div class="flex flex-col gap-3 text-xs text-dimmed sm:flex-row sm:items-center sm:justify-between">
        <UButton
          color="bits100"
          variant="soft"
          size="lg"
          icon="twitch:cheer"
          :loading="loading"
          :disabled="disabled || loading"
          block
          @click="emit('click')"
        >
          <span v-if="price">{{ price }}</span>
          <span v-else>Free</span>
        </UButton>
      </div>
    </template>
  </UCard>
</template>
