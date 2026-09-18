<script setup lang="ts">
import { useWebSocket } from "@vueuse/core";

const route = useRoute("source");
const user = route.query.user?.toString();
const localMode = import.meta.dev;

if (!user) {
  throw createError({
    status: 400,
    message: "User query parameter is required",
    fatal: true
  });
}

const queued = ref<DonoBitsQueueItem[]>([]);
const addToQueue = (queue: DonobitsQueue) => queued.value.push({ ...queue, queueId: nextQueueId++ });
let nextQueueId = 0;

const testLoading = ref(false);
const testError = ref("");
const current = computed(() => queued.value[0] ?? null);

/* test user */
const testUser = "yizack";

const queueTestClip = async () => {
  addToQueue({
    transaction: {
      displayName: "Yizack",
      product: {
        cost: {
          amount: "100",
          type: "bits"
        }
      }
    },
    avatar: "https://static-cdn.jtvnw.net/jtv_user_pictures/4f6e670e-fcbb-44f4-92a6-7340a86227d1-profile_image-300x300.png",
    clip: {
      ID: 1443902,
      UUID: "b9bf27e6-308a-4c68-97f6-dad62843b975",
      Type: "audio",
      ViewerName: "TifannyMusso",
      UploadedAt: 1789436673296,
      ModDecision: 2,
      AssetUrl: "https://donoclip-assets-994b4a9.s3.eu-central-1.amazonaws.com/jimrsng/b9bf27e6-308a-4c68-97f6-dad62843b975.webm"
    }
  });
};
/* end test user */

onMounted(() => {
  if (localMode) return;

  useWebSocket(`/ws/source?user=${encodeURIComponent(user)}`, {
    autoReconnect: true,
    onMessage: async (ws, event: MessageEvent<string>) => {
      const message: DonobitsQueuedEvent = JSON.parse(event.data);
      if (!message.data) return;

      switch (message.type) {
        case "queued":
          addToQueue(message.data);
          break;
      }
    }
  });
});
</script>

<template>
  <main>
    <AudioVisualizer
      v-if="current?.clip.Type === 'audio'"
      :key="`audio-${current.queueId}`"
      :item="current"
      @ended="queued.shift()"
    />
    <video
      v-else-if="current?.clip.Type === 'video'"
      :key="`video-${current.queueId}`"
      :src="current.clip.AssetUrl"
      autoplay
      @ended="queued.shift()"
    />
    <div v-if="localMode && user === testUser" class="fixed bottom-4 left-4">
      <UButton
        label="Play local test"
        icon="pixelarticons:play"
        :loading="testLoading"
        @click="queueTestClip"
      />
      <p v-if="testError" class="mt-2 text-sm text-error">
        {{ testError }}
      </p>
    </div>
  </main>
</template>
