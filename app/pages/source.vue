<script setup lang="ts">
import { useWebSocket } from "@vueuse/core";

const route = useRoute("source");
const user = route.query.user?.toString();
if (!user) {
  throw createError({
    status: 400,
    message: "User query parameter is required",
    fatal: true
  });
}

const queued = ref<(DonobitsQueue & { queueId: number })[]>([]);
let nextQueueId = 0;

const testLoading = ref(false);
const testError = ref("");
const current = computed(() => queued.value[0] ?? null);

const player = ref<HTMLMediaElement>();

watch(current, () => {
  nextTick(async () => {
    await player.value?.play().catch(() => {});
  });
});

/* test user */
const testUser = "yizack";
const testClipId = 1443902;
const { data: testClips, execute: loadTestClips } = await useDonoclip(testUser);

const queueTestClip = async () => {
  testLoading.value = true;
  testError.value = "";

  if (!testClips.value) await loadTestClips();
  const clip = testClips.value?.find(item => item.ID === testClipId);

  $fetch(`/api/donoclip/${testUser}/queue`, {
    method: "POST",
    body: {
      clip
    }
  }).catch((error) => {
    console.error("Failed to queue test clip:", error);
    testError.value = "Failed to queue test clip";
  }).finally(() => {
    testLoading.value = false;
  });
};
/* end test user */

onMounted(() => {
  useWebSocket(`/ws/source?user=${encodeURIComponent(user)}`, {
    autoReconnect: true,
    onMessage: async (ws, event) => {
      const data = typeof event.data === "string" ? event.data : await event.data.text();
      console.info("Received WebSocket message:", data);

      const message: DonobitsQueuedEvent = JSON.parse(data);
      if (!message.data) return;

      switch (message.type) {
        case "queued":
          queued.value.push({ ...message.data, queueId: nextQueueId++ });
          break;
      }
    }
  });
});
</script>

<template>
  <div>
    <audio
      v-if="current?.clip.Type === 'audio'"
      ref="player"
      :key="`audio-${current.queueId}`"
      :src="current.clip.AssetUrl"
      autoplay
      @ended="queued.shift()"
    />
    <video
      v-else-if="current?.clip.Type === 'video'"
      ref="player"
      :key="`video-${current.queueId}`"
      :src="current.clip.AssetUrl"
      autoplay
      @ended="queued.shift()"
    />
    <div v-if="user === testUser" class="fixed bottom-4 left-4">
      <UButton
        label="Test clip"
        icon="pixelarticons:play"
        :loading="testLoading"
        @click="queueTestClip"
      />
      <p v-if="testError" class="mt-2 text-sm text-error">
        {{ testError }}
      </p>
    </div>
  </div>
</template>
