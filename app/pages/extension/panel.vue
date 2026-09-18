<script setup lang="ts">
import type { HelixUser } from "@twurple/api";
import { refDebounced } from "@vueuse/core";

const twitch = useTwitch();

const broadcaster = ref<ExcludeFn<HelixUser> | null>(null);
const avatars = ref<Record<string, string>>({});

const getViewerAvatar = (name: string) => avatars.value[name.toLowerCase()];

const isAuthorized = ref(false);
const errorText = ref<string | null>(null);
const bitsProduct = shallowRef<Twitch.ext.BitsProduct | null>(null);
const bitsEnabled = ref(false);
const bitsLoading = ref(true);

const purchasingId = ref<number | null>(null);
const playingClipId = ref<number | null>(null);

const purchase = async (clipId: number) => {
  if (!bitsEnabled.value
    || !bitsProduct.value
    || !broadcaster.value
    || purchasingId.value !== null
  ) return;

  purchasingId.value = clipId;

  if (!await twitch.isLive(broadcaster.value.id)) {
    purchasingId.value = null;
    errorText.value = `${broadcaster.value.displayName} is not live`;
    return;
  }

  Twitch.ext.bits.useBits(bitsProduct.value.sku);
};

onMounted(() => {
  Twitch.ext.onAuthorized(async (auth) => {
    isAuthorized.value = true;
    bitsEnabled.value = Twitch.ext.features.isBitsEnabled;
    twitch.init(auth.clientId);

    bitsLoading.value = true;
    errorText.value = null;

    broadcaster.value = await twitch.getUserById(auth.channelId);

    Twitch.ext.bits.getProducts().then((products) => {
      bitsProduct.value = products.find(product => SITE.twitch.extension.products.includes(product.sku)) ?? null;
    }).catch(() => {
      bitsProduct.value = null;
      errorText.value = "Bits purchases are unavailable in this Twitch context";
    }).finally(() => {
      bitsLoading.value = false;
    });
  });

  Twitch.ext.features.onChanged(() => {
    bitsEnabled.value = Twitch.ext.features.isBitsEnabled;
  });

  Twitch.ext.bits.onTransactionComplete((transaction) => {
    if (transaction.initiator !== "current_user"
      || !isAuthorized.value
      || !SITE.twitch.extension.products.includes(transaction.product.sku)
      || purchasingId.value === null
      || !broadcaster.value
    ) return;

    const clip = data.value?.find(item => item.ID === purchasingId.value);
    if (!clip) return;

    $fetch(`/api/donoclip/${encodeURIComponent(broadcaster.value.name)}/queue`, {
      baseURL: SITE.host,
      method: "POST",
      body: {
        transaction: {
          displayName: transaction.displayName,
          transactionReceipt: transaction.transactionReceipt
        },
        avatar: getViewerAvatar(clip.ViewerName),
        clip
      }
    }).catch((error) => {
      console.error("Failed to queue clip:", error);
    });

    purchasingId.value = null;
  });

  Twitch.ext.bits.onTransactionCancelled(() => {
    purchasingId.value = null;
  });
});

const broadcasterLogin = computed(() => broadcaster.value?.name);
const { data, error, status, execute } = await useDonoclip(broadcasterLogin);

watch(broadcaster, async () => {
  if (!broadcaster.value) return;
  await execute();
});

watch([isAuthorized, data], async () => {
  const names = (data.value ?? []).map(clip => clip.ViewerName.toLowerCase());
  if (isAuthorized.value && names.length) {
    avatars.value = await twitch.getAvatars(names);
  }
}, { immediate: true });

const viewerSearch = ref("");
const debouncedViewerSearch = refDebounced(viewerSearch, 200);

const filteredClips = computed(() => {
  const query = debouncedViewerSearch.value.trim().toLowerCase();
  const clips = data.value ?? [];

  if (!query) return clips;

  return clips.filter(clip => clip.ViewerName.toLowerCase().includes(query));
});
</script>

<template>
  <UMain>
    <UHeader
      class="sticky top-0"
      :toggle="false"
      :ui="{ left: 'block! w-full', center: 'hidden!', right: 'hidden!' }"
    >
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
            :loading="viewerSearch !== debouncedViewerSearch"
          />
        </div>
      </template>
    </UHeader>

    <UAlert
      v-if="errorText"
      class="sticky top-16 z-50 shadow py-2"
      color="error"
      :description="errorText"
      icon="pixelarticons:alert"
      :close="{
        class: 'invert',
        onClick: () => {
          errorText = null
        },
      }"
    />

    <UContainer class="py-2">
      <ClientOnly>
        <p class="text-sm text-muted mt-2 mb-3 text-center">
          <span v-if="filteredClips.length === (data?.length ?? 0)">{{ filteredClips.length }} clips</span>
          <span v-else>Showing {{ filteredClips.length }} of {{ data?.length ?? 0 }} clips</span>
        </p>

        <div v-if="status === 'idle' || status === 'pending'" class="grid gap-5 grid-cols-2 md:grid-cols-4">
          <ClipCardSkeleton v-for="placeholder in 4" :key="placeholder" />
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
            :disabled="bitsLoading || !bitsEnabled || purchasingId !== null"
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
