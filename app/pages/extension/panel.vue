<script setup lang="ts">
import type { HelixUser } from "@twurple/api";
import { useInfiniteScroll } from "@vueuse/core";

const twitch = useTwitch();

const data = ref<Donobits[]>();
const isLoading = ref(true);
const volume = ref(100);
const search = ref("");
const perScroll = 6;
const scrollCount = ref(0);
const hasScrolled = ref(false);
const broadcaster = ref<ExcludeFn<HelixUser> | null>(null);
const avatars = ref<Record<string, string>>({});
const error = ref<string>("");
const bitsProduct = ref<Twitch.ext.BitsProduct | null>(null);
const bitsEnabled = ref(false);
const purchasingId = ref<string | null>(null);
const playingClipId = ref<string | null>(null);

const audioClips = computed(() => data.value?.filter(clip => clip.type === "audio") ?? []);
const filteredData = computed(() => {
  const query = search.value.trim().toLowerCase();
  const clips = audioClips.value;

  if (!query) return clips;

  return clips.filter(clip => clip.name.toLowerCase().includes(query));
});

const visibleAudioClips = computed(() => filteredData.value.slice(0, perScroll + (scrollCount.value * perScroll)));

const getAvatar = (name: string) => avatars.value[name.toLowerCase()];

const purchase = async (clipId: string) => {
  if (!bitsEnabled.value
    || !bitsProduct.value
    || !broadcaster.value
    || purchasingId.value !== null
  ) return;

  purchasingId.value = clipId;

  if (!import.meta.dev && !await twitch.isLive(broadcaster.value.id)) {
    purchasingId.value = null;
    error.value = `${broadcaster.value.displayName} is not live`;
    return;
  }

  Twitch.ext.bits.useBits(bitsProduct.value.sku);
};

onMounted(() => {
  volume.value = parseInt(localStorage.getItem("volume") ?? "100");
  let extAuth: Twitch.ext.Authorized | null = null;

  Twitch.ext.onAuthorized(async (auth) => {
    extAuth = auth;
    bitsEnabled.value = Twitch.ext.features.isBitsEnabled;
    twitch.init(auth.clientId);

    error.value = "";

    if (!broadcaster.value) {
      broadcaster.value = await twitch.getUserById(auth.channelId);

      data.value = await getDonobits(broadcaster.value!, auth);
      const viewerNames = audioClips.value.map(clip => clip.name);
      if (viewerNames.length) {
        avatars.value = await twitch.getAvatars(viewerNames);
      }
      isLoading.value = false;
    }

    Twitch.ext.bits.getProducts()
      .then((products) => {
        bitsProduct.value = products.find(product => SITE.twitch.extension.products.includes(product.sku)) ?? null;
      }).catch(() => {
        bitsProduct.value = null;
        error.value = "Bits purchases are unavailable in this Twitch context";
      });
  });

  Twitch.ext.features.onChanged(() => {
    bitsEnabled.value = Twitch.ext.features.isBitsEnabled;
  });

  Twitch.ext.bits.onTransactionComplete((transaction) => {
    if (transaction.initiator !== "current_user"
      || !extAuth
      || !SITE.twitch.extension.products.includes(transaction.product.sku)
      || purchasingId.value === null
      || !broadcaster.value
    ) return;

    const data = audioClips.value?.find(item => item.uuid === purchasingId.value);
    if (!data) return;

    extFetch(`/api/ebs/${broadcaster.value.name}/queue`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${extAuth.token}`,
        "Channel-Id": extAuth.channelId
      },
      body: {
        transaction: {
          displayName: transaction.displayName,
          transactionReceipt: transaction.transactionReceipt
        },
        image: getAvatar(data.name),
        data: {
          uuid: data.uuid,
          name: data.name,
          type: data.type,
          url: data.url
        }
      } satisfies DonobitsQueue
    }).catch(() => {
      error.value = "Failed to queue clip. Ask the broadcaster for assistance.";
    });

    purchasingId.value = null;
  });

  Twitch.ext.bits.onTransactionCancelled(() => {
    purchasingId.value = null;
  });
});

watch(search, () => {
  playingClipId.value = null;
  scrollCount.value = 0;
  scrollTo(0, 0);
});

watch(volume, (newVolume) => {
  localStorage.setItem("volume", newVolume.toString());
});

useInfiniteScroll(document, () => {
  scrollCount.value++;
}, {
  distance: 100,
  onScroll: () => {
    hasScrolled.value = window.scrollY > 0;
  },
  canLoadMore: () => hasScrolled.value
});
</script>

<template>
  <UMain>
    <PanelToolbar
      v-model:search="search"
      v-model:volume="volume"
    />

    <UAlert
      v-if="error"
      class="sticky top-16 z-50 shadow py-2"
      color="error"
      :description="error"
      icon="pixelarticons:alert"
      :close="{
        class: 'invert',
        onClick: () => {
          error = '';
        },
      }"
    />

    <UContainer class="py-2">
      <ClientOnly>
        <p class="text-sm text-muted mt-2 mb-3 text-center">
          <span v-if="filteredData.length === (audioClips?.length ?? 0)">{{ filteredData.length }} clips</span>
          <span v-else>Showing {{ filteredData.length }} of {{ audioClips?.length ?? 0 }} clips</span>
        </p>

        <div v-if="isLoading" class="grid gap-5 grid-cols-2 md:grid-cols-4">
          <PanelClipSkeleton v-for="placeholder in 4" :key="placeholder" />
        </div>

        <UCard v-else-if="!data" variant="subtle" class="border-error/30">
          <div class="flex items-start gap-3">
            <UIcon
              name="pixelarticons:alert"
              class="mt-0.5 size-5 shrink-0 text-error"
            />
            <div>
              <h2 class="font-semibold text-highlighted">Unable to load clips</h2>
              <p class="mt-1 text-sm text-muted">The clip library could not be loaded right now. Please try again later.</p>
            </div>
          </div>
        </UCard>

        <div v-else-if="visibleAudioClips.length" class="grid gap-5 grid-cols-2 md:grid-cols-4">
          <PanelClip
            v-for="clip of visibleAudioClips"
            :key="clip.uuid"
            v-model="playingClipId"
            :data="clip"
            :price="bitsProduct?.cost.amount"
            :image="getAvatar(clip.name)"
            :disabled="!bitsEnabled || purchasingId !== null"
            :loading="purchasingId === clip.uuid"
            :volume="volume"
            @click="purchase(clip.uuid)"
          />
        </div>

        <UCard v-else variant="subtle">
          <div class="flex flex-col items-center justify-center px-4 py-12 text-center">
            <h2 class="font-semibold text-highlighted">No clips found</h2>
            <p class="mt-1 max-w-sm text-sm text-muted">Try a different user or clear the search to see all clips.</p>
          </div>
        </UCard>
      </ClientOnly>
    </UContainer>
  </UMain>
</template>
