<script setup lang="ts">
import WaveSurfer from "wavesurfer.js";

definePageMeta({ layout: false });

const props = defineProps<{
  item: DonoBitsQueueItem;
}>();

const emits = defineEmits<{
  ended: [];
}>();

const waveform = useTemplateRef("waveform");

type VisualizerRuntime = {
  generation: number;
  wavesurfer?: WaveSurfer;
  animationFrame?: number;
  audioContext?: AudioContext;
  analyser?: AnalyserNode;
  audioSource?: AudioBufferSourceNode;
  samples?: Float32Array<ArrayBuffer>;
};

const runtime: VisualizerRuntime = {
  generation: 0
};

const stopAudioSource = () => {
  const source = runtime.audioSource;
  runtime.audioSource = undefined;
  if (!source) return;

  source.disconnect();
  try {
    source.stop();
  }
  catch {}
};

const stopVisualizer = () => {
  if (runtime.animationFrame !== undefined) cancelAnimationFrame(runtime.animationFrame);
  runtime.animationFrame = undefined;

  stopAudioSource();
  runtime.analyser?.disconnect();
  runtime.analyser = undefined;
  runtime.samples = undefined;

  const context = runtime.audioContext;
  runtime.audioContext = undefined;
  if (context && context.state !== "closed") void context.close();
};

const destroyWaveform = () => {
  runtime.generation++;
  stopVisualizer();
  runtime.wavesurfer?.destroy();
  runtime.wavesurfer = undefined;
};

const drawWaveform = (generation: number, duration: number) => {
  const { analyser, samples, wavesurfer } = runtime;
  if (generation !== runtime.generation || !analyser || !samples || !wavesurfer) return;

  analyser.getFloatTimeDomainData(samples);
  wavesurfer.load("", [samples], duration).catch(() => {});
  runtime.animationFrame = requestAnimationFrame(() => drawWaveform(generation, duration));
};

const startAudio = async (generation: number) => {
  const AudioContextConstructor = window.AudioContext;
  if (!AudioContextConstructor) return;

  try {
    runtime.audioContext = new AudioContextConstructor();
    await runtime.audioContext.resume();

    if (generation !== runtime.generation) return;

    const audioData = await $fetch<ArrayBuffer>(props.item.data.url, { responseType: "arrayBuffer" })
      .catch(() => {
        throw new Error("Failed to fetch audio data");
      });

    const buffer = await runtime.audioContext.decodeAudioData(audioData);
    if (generation !== runtime.generation) return;

    const nextAnalyser = runtime.audioContext.createAnalyser();
    nextAnalyser.fftSize = 512 * 2;
    nextAnalyser.connect(runtime.audioContext.destination);

    const nextSource = runtime.audioContext.createBufferSource();
    nextSource.buffer = buffer;
    nextSource.connect(nextAnalyser);
    nextSource.onended = () => {
      if (generation === runtime.generation) emits("ended");
    };

    runtime.analyser = nextAnalyser;
    runtime.audioSource = nextSource;
    runtime.samples = new Float32Array(new ArrayBuffer(nextAnalyser.frequencyBinCount * Float32Array.BYTES_PER_ELEMENT));

    nextSource.start();
    runtime.animationFrame = requestAnimationFrame(() => drawWaveform(generation, buffer.duration));
  }
  catch (error) {
    if (generation === runtime.generation) console.warn("Audio visualizer could not start:", error);
    if (runtime.audioContext && runtime.audioContext.state !== "closed") void runtime.audioContext.close();
  }
};

const createWaveform = async () => {
  destroyWaveform();
  const generation = runtime.generation;

  await nextTick();

  if (!waveform.value || generation !== runtime.generation) return;

  const styles = getComputedStyle(document.documentElement);

  const instance = WaveSurfer.create({
    container: waveform.value,
    height: "auto",
    waveColor: styles.getPropertyValue("--ui-primary"),
    cursorWidth: 0,
    barWidth: 16,
    barRadius: 100,
    interact: false,
    autoplay: false
  });

  if (generation !== runtime.generation) {
    instance.destroy();
    return;
  }

  runtime.wavesurfer = instance;
  startAudio(generation);
};

watch(() => props.item.data.url, () => {
  createWaveform();
});

onMounted(() => {
  createWaveform();
});

onBeforeUnmount(destroyWaveform);
</script>

<template>
  <div class="relative h-100 w-full bg-black/95 rounded-4xl">
    <div class="absolute top-0 left-0 flex items-center text-3xl p-2">
      <UIcon name="pixelarticons:play" size="3.5rem" class="text-primary" />
      <div>Donobits</div>
    </div>
    <div ref="waveform" class="absolute inset-0 ps-3" />
    <UButton
      class="absolute top-0 right-0 m-5"
      size="xl"
      color="bits100"
      icon="twitch:cheer"
      :label="`${item.transaction.product.cost.amount} ${item.transaction.product.cost.type}`"
    />
    <div
      v-if="item.image || item.transaction.displayName"
      class="pointer-events-none absolute left-1/2 top-1/2 z-10 flex max-w-[calc(100%-2rem)] -translate-1/2 flex-col items-center gap-1 bg-black/80 px-8 py-6 border border-default"
    >
      <div v-if="item.image" class="relative">
        <img
          :src="item.image"
          :alt="item.transaction.displayName"
          class="size-32 shrink-0 rounded-full border-4 border-white/80 object-cover shadow-xl"
        >
        <div
          class="absolute size-24 shrink-0 rounded-full left-1/2 top-1/2 -translate-1/2 bg-inverted object-cover shadow-xl animate-ping -z-1"
        />
      </div>

      <UBadge
        :label="item.data.name"
        class="text-2xl w-full text-center block"
      />

      <USeparator class="bg-accented my-2" />

      <div class="flex items-center gap-2 text-2xl">
        <UIcon name="pixelarticons:shopping-cart" />
        <span>{{ item.transaction.displayName }}</span>
      </div>
    </div>
  </div>
</template>
