<script setup lang="ts">
import { useClipboard } from "@vueuse/core";

const props = defineProps<{
  user: string;
}>();

const value = ref(`${SITE.host}/source?user=${props.user}`);

const { copy, copied } = useClipboard();
</script>

<template>
  <UInput
    :value="value"
    class="w-full"
    :ui="{ trailing: 'pr-0.5' }"
    readonly
  >
    <template v-if="value?.length" #trailing>
      <UTooltip text="Copy to clipboard" :content="{ side: 'right' }">
        <UButton
          :color="copied ? 'primary' : 'neutral'"
          variant="link"
          size="sm"
          :icon="copied ? 'pixelarticons:clipboard-note' : 'pixelarticons:clipboard'"
          aria-label="Copy to clipboard"
          @click="copy(value)"
        />
      </UTooltip>
    </template>
  </UInput>
</template>
