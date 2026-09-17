<script setup lang="ts">
const twitch = useTwitch();

const validSku = [
  "AUDIO"
];

const broadcasterLogin = ref<string>();
const avatars = ref<Record<string, string>>({});

const isAuthorized = ref(false);
const bitsProduct = shallowRef<Twitch.ext.BitsProduct | null>(null);
const bitsEnabled = ref(false);
const bitsLoading = ref(true);
const bitsError = ref<string | null>(null);

const purchasingId = ref<number | null>(null);
const playingClipId = ref<number | null>(null);

const purchase = (clipId: number) => {
  if (!bitsEnabled.value || !bitsProduct.value || purchasingId.value !== null) return;

  purchasingId.value = clipId;
  Twitch.ext.bits.useBits(bitsProduct.value.sku);
};

onMounted(() => {
  Twitch.ext.onAuthorized(async ({ clientId, channelId }) => {
    isAuthorized.value = true;
    bitsEnabled.value = Twitch.ext.features.isBitsEnabled;
    twitch.init(clientId);

    bitsLoading.value = true;
    bitsError.value = null;

    broadcasterLogin.value = await twitch.getUserLoginById(channelId);

    Twitch.ext.bits.getProducts().then((products) => {
      bitsProduct.value = products.find(product => validSku.includes(product.sku)) ?? null;
    }).catch(() => {
      bitsProduct.value = null;
      bitsError.value = "Bits purchases are unavailable in this Twitch context.";
    }).finally(() => {
      bitsLoading.value = false;
    });
  });

  Twitch.ext.features.onChanged(() => {
    bitsEnabled.value = Twitch.ext.features.isBitsEnabled;
  });

  Twitch.ext.bits.onTransactionComplete((transaction) => {
    if (transaction.initiator === "current_user" && validSku.includes(transaction.product.sku)) {
      purchasingId.value = null;
    // TODO: send clip ID to the server for processing
    }
  });

  Twitch.ext.bits.onTransactionCancelled(() => {
    purchasingId.value = null;
  });
});

const { data, error, status, execute } = await useDonoclip(broadcasterLogin);

watch(broadcasterLogin, async () => {
  if (!broadcasterLogin.value) return;
  await execute();
});

watch([isAuthorized, data], async () => {
  const names = (data.value ?? []).map(clip => clip.ViewerName.toLowerCase());
  if (isAuthorized.value && names.length) {
    avatars.value = await twitch.getAvatars(names);
  }
}, { immediate: true });

const getViewerAvatar = (name: string) => avatars.value[name.toLowerCase()];

const viewerSearch = ref("");

const filteredClips = computed(() => {
  const query = viewerSearch.value.trim().toLowerCase();
  const clips = data.value ?? [];

  if (!query) return clips;

  return clips.filter(clip => clip.ViewerName.toLowerCase().includes(query));
});
</script>

<template>
  <UMain>
    <UHeader class="sticky top-0" :toggle="false" :ui="{ left: 'block! w-full', center: 'hidden!', right: 'hidden!' }">
      <template #left>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label for="search" class="sr-only">
            Search user...
          </label>
          <UInput
            id="search"
            v-model="viewerSearch"
            icon="pixelarticons:search"
            type="search"
            size="sm"
            placeholder="Search user..."
            class="w-full"
          />
        </div>
      </template>
    </UHeader>
    <UContainer class="py-2">
      <ClientOnly>
        <p class="text-sm text-muted mb-5 text-center">
          Showing {{ filteredClips.length }} of {{ data?.length ?? 0 }} clips
        </p>
        <div v-if="status === 'pending'" class="grid gap-5 grid-cols-2">
          <UCard v-for="placeholder in 4" :key="placeholder" variant="subtle">
            <div class="space-y-5 animate-pulse">
              <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                  <div class="size-10 rounded-full bg-elevated" />
                  <div class="space-y-2">
                    <div class="h-3 w-16 rounded bg-elevated" />
                    <div class="h-4 w-28 rounded bg-elevated" />
                  </div>
                </div>
                <div class="h-6 w-20 rounded-full bg-elevated" />
              </div>
              <div class="h-10 rounded-lg bg-elevated" />
            </div>
          </UCard>
        </div>

        <UCard v-else-if="error" variant="subtle" class="border-error/30">
          <div class="flex items-start gap-3">
            <UIcon
              name="pixelarticons:alert"
              class="mt-0.5 size-5 shrink-0 text-error"
            />
            <div>
              <h2 class="font-semibold text-highlighted">Unable to load clips</h2>
              <p class="mt-1 text-sm text-muted">
                The clip library could not be loaded right now. Please try again
                later.
              </p>
            </div>
          </div>
        </UCard>

        <div
          v-else-if="filteredClips.length"
          class="grid gap-5 grid-cols-2 md:grid-cols-4"
        >
          <ClipCard
            v-for="clip in filteredClips"
            :key="clip.UUID"
            v-model="playingClipId"
            :clip="clip"
            :price="bitsProduct?.cost.amount"
            :image="getViewerAvatar(clip.ViewerName)"
            :disabled="bitsLoading || !bitsEnabled"
            :loading="purchasingId === clip.ID"
            @click="purchase(clip.ID)"
          />
        </div>

        <UCard v-else variant="subtle">
          <div class="flex flex-col items-center justify-center px-4 py-12 text-center">
            <h2 class="font-semibold text-highlighted">No clips found</h2>
            <p class="mt-1 max-w-sm text-sm text-muted">
              Try a different user or clear the search to see all clips.
            </p>
          </div>
        </UCard>
      </ClientOnly>
    </UContainer>
  </UMain>
</template>
