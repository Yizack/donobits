<script setup lang="ts">
import type { HelixUser } from "@twurple/api";

const form = ref({
  donoclip: ""
});

const twitch = useTwitch();

const authorization = ref<Twitch.ext.Authorized | null>(null);
const broadcaster = ref<ExcludeFn<HelixUser> | null>(null);
const loading = ref(false);
const showDonoclipInstructions = ref(false);
const importError = ref("");

const broadcasterLogin = computed(() => broadcaster.value?.name);
const { data, status, execute } = await useDonoclip(broadcasterLogin);

const importDonoclip = () => {
  loading.value = true;
  extFetch(`/api/donoclip/${broadcasterLogin.value}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authorization.value?.token}`
    },
    body: form.value.donoclip
  }).then(async () => {
    await execute();
    form.value.donoclip = "";
    showDonoclipInstructions.value = false;
  }).catch((error) => {
    console.error("Failed to import donoclip content:", error);
    importError.value = "Failed to import donoclip content";
  }).finally(async () => {
    loading.value = false;
  });
};

onMounted(async () => {
  Twitch.ext.onAuthorized(async (auth) => {
    authorization.value = auth;
    twitch.init(auth.clientId);
    broadcaster.value = await twitch.getUserById(auth.channelId);
    await execute();
  });
});

const donoclipSnippet = [
  "const inbox = await fetch(\"\");",
  "const html = await inbox.text();",
  "const match = html.match(/const clipData = JSON\\.parse\\((\"(?:\\\\.|[^\"\\\\])*\")\\)/);",
  "const clipData = JSON.parse(match[1]);",
  "console.log(clipData);"
].join("\n");
</script>

<template>
  <div class="p-1">
    <UCard v-if="authorization && broadcasterLogin">
      <template #header>
        <img src="~/assets/images/donoclip-logo.svg" alt="Donoclip Logo">
      </template>
      <div class="space-y-2">
        <div v-if="data && status === 'success'" class="space-y-2">
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
          <ConfigCopySource :user="broadcasterLogin" />
        </div>
        <UAlert
          v-if="importError"
          color="error"
          variant="subtle"
          :description="importError"
          close
          @update:open="(open) => { if (!open) importError = '' }"
        />
        <form v-if="status === 'error' || !data || showDonoclipInstructions" class="space-y-2" @submit.prevent="importDonoclip">
          <p>Import content from donoclip.com</p>
          <div>
            <ol class="list-decimal list-inside">
              <li>Go to <ULink :href="`https://www.donoclip.com/${broadcasterLogin}/inbox`" target="_blank" class="underline">https://www.donoclip.com/{{ broadcasterLogin }}/inbox</ULink></li>
              <li>Open the console in your browser by pressing F12</li>
              <li>Paste the following command:<ProsePre language="js">{{ donoclipSnippet }}</ProsePre></li>
              <li>Copy the output from the console and paste it into the field below.</li>
            </ol>
          </div>
          <UFormField>
            <UTextarea v-model="form.donoclip" placeholder="Enter your donoclip content here" class="w-full" />
          </UFormField>
          <UButton type="submit" label="Import" size="lg" :loading="loading" block />
        </form>
      </div>
    </UCard>
  </div>
</template>
