<script setup lang="ts">
import type { HelixUser } from "@twurple/api";
import { useInfiniteScroll } from "@vueuse/core";

const twitch = useTwitch();

const broadcaster = ref<ExcludeFn<HelixUser> | null>(null);
const avatars = ref<Record<string, string>>({});

const getViewerAvatar = (name: string) => avatars.value[name.toLowerCase()];

const authorization = ref<Twitch.ext.Authorized | null>(null);
const isAuthorized = ref(false);
const errorText = ref<string | null>(null);
const bitsProduct = shallowRef<Twitch.ext.BitsProduct | null>(null);
const bitsEnabled = ref(false);
const purchasingId = ref<number | null>(null);
const volume = ref(100);

const purchase = async (clipId: number) => {
  if (!bitsEnabled.value
    || !bitsProduct.value
    || !broadcaster.value
    || purchasingId.value !== null
  ) return;

  purchasingId.value = clipId;

  if (!import.meta.dev && !await twitch.isLive(broadcaster.value.id)) {
    purchasingId.value = null;
    errorText.value = `${broadcaster.value.displayName} is not live`;
    return;
  }

  Twitch.ext.bits.useBits(bitsProduct.value.sku);
};

onMounted(() => {
  volume.value = parseInt(localStorage.getItem("volume") ?? "100");

  Twitch.ext.onAuthorized(async (auth) => {
    authorization.value = auth;
    isAuthorized.value = true;
    bitsEnabled.value = Twitch.ext.features.isBitsEnabled;
    twitch.init(auth.clientId);

    errorText.value = null;

    if (!broadcaster.value) {
      broadcaster.value = await twitch.getUserById(auth.channelId);
    }

    Twitch.ext.bits.getProducts()
      .then((products) => {
        bitsProduct.value = products.find(product => SITE.twitch.extension.products.includes(product.sku)) ?? null;
      }).catch(() => {
        bitsProduct.value = null;
        errorText.value = "Bits purchases are unavailable in this Twitch context";
      });
  });

  Twitch.ext.features.onChanged(() => {
    bitsEnabled.value = Twitch.ext.features.isBitsEnabled;
  });

  Twitch.ext.bits.onTransactionComplete((transaction) => {
    if (transaction.initiator !== "current_user"
      || !authorization.value
      || !SITE.twitch.extension.products.includes(transaction.product.sku)
      || purchasingId.value === null
      || !broadcaster.value
    ) return;

    const clip = audioClips.value?.find(item => item.ID === purchasingId.value);
    if (!clip) return;

    extFetch(`/api/donoclip/${encodeURIComponent(broadcaster.value.name)}/queue`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authorization.value?.token}`
      },
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

const audioClips = computed(() => data.value?.filter(clip => clip.Type === "audio") ?? []);

watch(broadcasterLogin, async (login, previousLogin) => {
  if (!login || login === previousLogin) return;
  await execute();
});

watch([isAuthorized, data], async () => {
  const names = (audioClips.value ?? []).map(clip => clip.ViewerName.toLowerCase());
  if (isAuthorized.value && names.length) {
    avatars.value = await twitch.getAvatars(names);
  }
});

const search = ref("");

const filteredData = computed(() => {
  const query = search.value.trim().toLowerCase();
  const clips = audioClips.value;

  if (!query) return clips;

  return clips.filter(clip => clip.ViewerName.toLowerCase().includes(query));
});

const perScroll = 6;
const scrollCount = ref(0);

watch(search, () => {
  scrollCount.value = 0;
  scrollTo(0, 0);
});

watch(audioClips, () => {
  useInfiniteScroll(document, () => {
    scrollCount.value++;
  }, { distance: 100 });
});

const visibleAudioClips = computed(() => filteredData.value.slice(0, perScroll + (scrollCount.value * perScroll)));

watch(volume, (newVolume) => {
  localStorage.setItem("volume", newVolume.toString());
});
</script>

<template>
  <UMain>
    <PanelToolbar
      v-model:search="search"
      v-model:volume="volume"
    />

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
          <span v-if="filteredData.length === (audioClips?.length ?? 0)">{{ filteredData.length }} clips</span>
          <span v-else>Showing {{ filteredData.length }} of {{ audioClips?.length ?? 0 }} clips</span>
        </p>

        <div v-if="status === 'idle' || status === 'pending'" class="grid gap-5 grid-cols-2 md:grid-cols-4">
          <PanelClipSkeleton v-for="placeholder in 4" :key="placeholder" />
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
          v-else-if="visibleAudioClips.length"
          class="grid gap-5 grid-cols-2 md:grid-cols-4"
        >
          <PanelClip
            v-for="clip in visibleAudioClips"
            :key="clip.ID"
            :clip="clip"
            :price="bitsProduct?.cost.amount"
            :image="getViewerAvatar(clip.ViewerName)"
            :disabled="!bitsEnabled || purchasingId !== null"
            :loading="purchasingId === clip.ID"
            :volume="volume"
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
