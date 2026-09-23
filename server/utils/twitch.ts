import type { H3Event } from "h3";

export const parseTwitchTime = (value: string) => {
  const match = value.match(
    /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}(?:\.\d+)?) ([+-]\d{4})/
  );

  if (!match) {
    throw new Error("Invalid Twitch transaction timestamp");
  }

  const [, date, time, offset] = match;

  const result = new Date(`${date}T${time}${offset?.slice(0, 3)}:${offset?.slice(3)}`);

  if (Number.isNaN(result.getTime())) {
    throw new Error("Invalid Twitch transaction timestamp");
  }

  return result.getTime();
};

export const ensureTwitchExtension = async (event: H3Event) => {
  const payload = await verifyTwitchExtension(event);
  const channelId = getHeader(event, "Channel-Id");

  if (!payload
    || !channelId
    || payload.channel_id !== channelId
    || Date.now() >= payload.exp * 1000
  ) {
    throw createError({
      status: StatusCode.UNAUTHORIZED,
      message: "Invalid authorization"
    });
  }
};
