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
      "Authorization": `Bearer ${extAuth.value!.token}`,
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
    <UCard v-else>
      <template #header>
        <img src="~/assets/images/donoclip-logo.svg" alt="Donoclip Logo">
      </template>
      <div v-if="broadcaster && extAuth" class="space-y-2">
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
          <p>Copy and paste the URL below into an OBS Browser Source:</p>
          <ConfigCopySource :user="broadcaster.name" />
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
                  size="sm"
                  variant="outline"
                  :to="donoclip.bookmarklet()"
                  draggable="true"
                  color="neutral"
                  :ui="{
                    base: 'ring-0 outline-2 outline-dashed',
                  }"
                />
                link to your bookmarks bar.
              </li>
              <li>
                Open your
                <UButton size="sm" variant="subtle" label="Donoclip Inbox" @click="donoclip.open()" />
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
  </div>
</template>
