import type { HelixUser } from "@twurple/api";

export const useDonoclip = (resource: {
  broadcaster: Ref<ExcludeFn<HelixUser> | null>;
  extAuth: Ref<Twitch.ext.Authorized | null>;
}, callback: (content: string) => void) => {
  const donoclipTab = ref<Window | null>(null);
  const extensionOrigin = ref("");
  const DONOCLIP_ORIGIN = "https://www.donoclip.com";
  const DONOCLIP_MESSAGE_TYPE = "donobits-donoclip-import";

  const open = () => {
    if (!resource.broadcaster.value) return;
    donoclipTab.value = window.open(`https://www.donoclip.com/${encodeURIComponent(resource.broadcaster.value.name)}/inbox`, "_blank");

    if (!donoclipTab.value) {
      alert("Allow pop-ups to open the Donoclip inbox");
    }
  };

  const bookmarklet = () => {
    if (!extensionOrigin.value) return "";

    const code = [
      "(async()=>{",
      "try {",
      "const html = await (await fetch(location.href, {credentials:\"include\"})).text();",
      "const match = html.match(/const clipData = JSON\\.parse\\((\"(?:\\\\.|[^\"\\\\])*\")\\)/);",
      "if (!match) throw new Error(\"Donoclip clip data was not found on this page.\");",
      "if (!window.opener) throw new Error(\"Open this inbox from the Donobits extension first.\");",
      `window.opener.postMessage({ type: \"${DONOCLIP_MESSAGE_TYPE}\", data: JSON.parse(match[1]) }, \"${extensionOrigin.value}\");`,
      "window.close();",
      "} catch (error) { alert(error ? error.message : \"Donoclip import failed\"); }",
      "})()"
    ].join("");

    return `javascript:${code}`;
  };

  const handleMessage = async (event: MessageEvent) => {
    const message = event.data;

    if (!message
    || event.origin !== DONOCLIP_ORIGIN
    || event.source !== donoclipTab.value
    || message.type !== DONOCLIP_MESSAGE_TYPE
    || !resource.broadcaster
    || !resource.extAuth
    ) return;

    donoclipTab.value?.close();
    donoclipTab.value = null;

    callback(message.data);
  };

  onMounted(async () => {
    extensionOrigin.value = window.location.origin;
    addEventListener("message", handleMessage);
  });

  onBeforeUnmount(() => {
    removeEventListener("message", handleMessage);
  });

  return {
    bookmarklet,
    open
  };
};
