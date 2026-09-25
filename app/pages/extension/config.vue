<script setup lang="ts">
import type { HelixUser } from "@twurple/api";

const twitch = useTwitch();

const data = ref<Donobits[]>();
const isLoading = ref(true);
const extAuth = ref<Twitch.ext.Authorized | null>(null);
const broadcaster = ref<ExcludeFn<HelixUser> | null>(null);
const isImporting = ref(false);
const showDonoclipInstructions = ref(false);
const error = ref("");

const importDonoclip = async (content: string) => {
  isImporting.value = true;

  extFetch(`/api/ebs/${broadcaster.value!.name}/import/donoclip`, {
    method: "POST",
    headers: {
      "Channel-Id": extAuth.value!.channelId
    },
    body: content
  }).then(async () => {
    data.value = await getDonobits(broadcaster.value!, extAuth.value!);
    showDonoclipInstructions.value = false;
  }).catch(() => {
    error.value = "Failed to import donoclip content";
  }).finally(() => {
    isImporting.value = false;
  });
};

const donoclip = useDonoclip({
  broadcaster: broadcaster,
  extAuth: extAuth
}, importDonoclip);

onMounted(async () => {
  Twitch.ext.onAuthorized(async (auth) => {
    extAuth.value = auth;
    twitch.init(auth.clientId);

    error.value = "";

    if (!broadcaster.value) {
      broadcaster.value = await twitch.getUserById(auth.channelId);
      data.value = await getDonobits(broadcaster.value!, auth);
      isLoading.value = false;
    }
  });
});
</script>

<template>
  <div class="p-1">
    <span v-if="isLoading">Loading...</span>
    <div v-else-if="broadcaster && extAuth" class="space-y-2">
      <UCard>
        <template #header>
          <img src="~/assets/images/donoclip-logo.svg" alt="Donoclip Logo">
        </template>
        <div class="space-y-2">
          <div v-if="data && !showDonoclipInstructions" class="space-y-2">
            <UAlert
              color="neutral"
              variant="subtle"
              :description="`Imported ${data.length} items`"
              :actions="[
                {
                  label: 'Import Again',
                  onClick: () => {
                    showDonoclipInstructions = true;
                  },
                },
              ]"
            />
          </div>
          <UAlert
            v-if="error"
            color="error"
            variant="subtle"
            :description="error"
            close
            @update:open="(open) => { if (!open) error = '' }"
          />
          <form v-if="!data || showDonoclipInstructions" class="space-y-2">
            <p>Import content from donoclip.com</p>
            <div>
              <ol class="list-decimal list-inside space-y-2">
                <li>
                  Drag this
                  <UButton
                    label="Import Donoclip"
                    class="cursor-grab"
                    size="sm"
                    variant="outline"
                    :to="donoclip.bookmarklet"
                    draggable="true"
                    color="neutral"
                    :ui="{
                      base: 'ring-0 outline-2 outline-dashed',
                    }"
                  />
                  link to your bookmarks bar.
                  <div class="text-xs text-muted mt-2 flex items-center gap-2">
                    <UBadge label="TIP" variant="subtle" size="sm" />
                    <span>Show bookmarks bar with</span>
                    <span>
                      <UKbd value="meta" size="sm" />+<UKbd value="shift" size="sm" />+<UKbd value="b" size="sm" />
                    </span>
                  </div>
                </li>
                <li>
                  Click
                  <UButton size="sm" label="Donoclip Inbox" @click="donoclip.open()" />
                  to access your Donoclip inbox.
                </li>
                <li>Click the "Import Donoclip" bookmark in the Donoclip tab to import your content.</li>
                <li>Done! Delete the bookmark if you no longer need it.</li>
              </ol>
            </div>
            <UButton v-if="data" color="error" label="Cancel" size="lg" block @click="showDonoclipInstructions = false" />
          </form>
        </div>
      </UCard>
      <UCard :ui="{ body: 'space-y-2' }">
        <p>Copy and paste the URL below into an OBS Browser Source:</p>
        <ConfigCopySource :user="broadcaster.name" />
      </UCard>
    </div>
  </div>
</template>
