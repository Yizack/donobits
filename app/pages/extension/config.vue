<script setup lang="ts">
const form = ref({
  donoclip: ""
});

const twitch = useTwitch();

const isAuthorized = ref(false);

const broadcasterLogin = ref();
const loading = ref(false);
const showDonoclipInstructions = ref(false);
const importError = ref("");

const { data, execute } = await useDonoclip(broadcasterLogin);

const importDonoclip = () => {
  loading.value = true;
  $fetch(`/api/donoclip/${broadcasterLogin.value}`, {
    baseURL: SITE.host,
    method: "POST",
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
  Twitch.ext.onAuthorized(async ({ clientId, channelId }) => {
    isAuthorized.value = true;
    twitch.init(clientId);
    broadcasterLogin.value = await twitch.getUserLoginById(channelId);
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
    <UCard v-if="isAuthorized">
      <template #header>
        <img src="~/assets/images/donoclip-logo.svg" alt="DonoClip Logo">
      </template>
      <div class="space-y-2">
        <UAlert
          v-if="data"
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
        <UAlert
          v-if="importError"
          color="error"
          variant="subtle"
          :description="importError"
          close
          @update:open="(open) => { if (!open) importError = '' }"
        />
        <form v-if="broadcasterLogin && (!data || showDonoclipInstructions)" class="space-y-2" @submit.prevent="importDonoclip">
          <p>Import content from donoclip.com</p>
          <div>
            <ol class="list-decimal list-inside">
              <li>Go to <ULink :href="`https://www.donoclip.com/${broadcasterLogin}/inbox`" target="_blank" class="hover:underline">https://www.donoclip.com/{{ broadcasterLogin }}/inbox</ULink></li>
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
