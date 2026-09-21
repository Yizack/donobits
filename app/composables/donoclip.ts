import type { HelixUser } from "@twurple/api";

export const useDonoclip = (resource: {
  broadcaster: Ref<ExcludeFn<HelixUser> | null>;
  extAuth: Ref<Twitch.ext.Authorized | null>;
}, callback: (content: string) => void) => {
  const DONOCLIP_MESSAGE_TYPE = "donobits-donoclip-import";
  const tab = ref<Window | null>(null);
  const bookmarklet = ref("");

  const open = () => {
    if (!resource.broadcaster.value) return;
    tab.value = window.open(`https://www.donoclip.com/${encodeURIComponent(resource.broadcaster.value.name)}/inbox`, "_blank");
  };

  const handleMessage = async (event: MessageEvent) => {
    const message = event.data;

    if (!message
      || message.type !== DONOCLIP_MESSAGE_TYPE
      || event.origin !== "https://www.donoclip.com"
      || event.source !== tab.value
      || !resource.broadcaster
      || !resource.extAuth
    ) return;

    tab.value?.close();
    tab.value = null;

    callback(message.data);
  };

  onMounted(() => {
    const code = [
      "(async()=>{",
      "try {",
      "const html = await (await fetch(location.href, {credentials:\"include\"})).text();",
      "const match = html.match(/const clipData = JSON\\.parse\\((\"(?:\\\\.|[^\"\\\\])*\")\\)/);",
      "if (!match) throw new Error(\"Donoclip clip data was not found on this page.\");",
      "if (!window.opener) throw new Error(\"Open this inbox from the Donobits extension first.\");",
      `window.opener.postMessage({ type: \"${DONOCLIP_MESSAGE_TYPE}\", data: JSON.parse(match[1]) }, \"${window.location.origin}\");`,
      "window.close();",
      "} catch (error) { alert(error ? error.message : \"Donoclip import failed\"); }",
      "})()"
    ].join("");

    bookmarklet.value = `javascript:${code}`;
    addEventListener("message", handleMessage);
  });

  onBeforeUnmount(() => {
    removeEventListener("message", handleMessage);
  });

  return reactive({
    bookmarklet,
    open
  });
};
