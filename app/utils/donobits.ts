import type { HelixUser } from "@twurple/api";

export const getDonobits = async (broadcaster: ExcludeFn<HelixUser>, extAuth: Twitch.ext.Authorized) => {
  return extFetch(`/api/ebs/${broadcaster.name}`, {
    headers: {
      "Authorization": `Bearer ${extAuth.token}`,
      "Channel-Id": extAuth.channelId
    }
  }).catch(() => undefined);
};
