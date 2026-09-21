<script setup lang="ts">
import type { HelixUser } from "@twurple/api";

const form = ref({
  donoclip: ""
});

const twitch = useTwitch();

const data = ref<Donobits[]>();
const isLoading = ref(true);
const extAuth = ref<Twitch.ext.Authorized | null>(null);
const broadcaster = ref<ExcludeFn<HelixUser> | null>(null);

const isImporting = ref(false);
const showDonoclipInstructions = ref(false);
const error = ref("");

const importDonoclip = (broadcaster: ExcludeFn<HelixUser>, extAuth: Twitch.ext.Authorized) => {
  if (!form.value.donoclip) {
    error.value = "Content cannot be empty";
    return;
  }

  isImporting.value = true;

  extFetch(`/api/ebs/${broadcaster.name}/import/donoclip`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${extAuth.token}`,
      "Channel-Id": extAuth.channelId
    },
    body: form.value.donoclip
  }).then(async () => {
    data.value = await getDonobits(broadcaster, extAuth);
    form.value.donoclip = "";
    showDonoclipInstructions.value = false;
  }).catch((error) => {
    error.value = "Failed to import donoclip content";
  }).finally(async () => {
    isImporting.value = false;
  });
};

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

const donoclipSnippet = [
  "const inbox = await fetch(\"\");",
  "const html = await inbox.text();",
  "const match = html.match(/const clipData = JSON\\.parse\\((\"(?:\\\\.|[^\"\\\\])*\")\\)/);",
  "const data = JSON.parse(match[1]);",
  "console.log(data);"
].join("\n");
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
        <form v-if="!data || showDonoclipInstructions" class="space-y-2" @submit.prevent="importDonoclip(broadcaster, extAuth)">
          <p>Import content from donoclip.com</p>
          <div>
            <ol class="list-decimal list-inside">
              <li>Go to <ULink :href="`https://www.donoclip.com/${broadcaster.name}/inbox`" target="_blank" class="underline">https://www.donoclip.com/{{ broadcaster.name }}/inbox</ULink></li>
              <li>Open the console in your browser by pressing F12</li>
              <li>Paste the following command:<ProsePre language="js">{{ donoclipSnippet }}</ProsePre></li>
              <li>Copy the output from the console and paste it into the field below.</li>
            </ol>
          </div>
          <UFormField>
            <UTextarea v-model="form.donoclip" placeholder="Enter your donoclip content here" class="w-full" />
          </UFormField>
          <UButton type="submit" label="Import" size="lg" :loading="isImporting" block />
          <UButton v-if="data" color="error" label="Cancel" size="lg" block @click="showDonoclipInstructions = false" />
        </form>
      </div>
    </UCard>
  </div>
</template>
