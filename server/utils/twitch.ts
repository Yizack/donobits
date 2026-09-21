import { Buffer } from "node:buffer";
import { jwtVerify } from "jose";
import type { H3Event } from "h3";

const parseTwitchTime = (value: string) => {
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

const TOLERANCE_MINUTES = 1;

export const validateTwitchTransaction = async (
  event: H3Event,
  receipt: Twitch.ext.BitsTransaction["transactionReceipt"]
) => {
  const config = useRuntimeConfig(event);
  const key = Buffer.from(config.twitch.extension.secret, "base64");

  try {
    const { payload } = await jwtVerify<TwitchTransactionPayload>(receipt, key, {
      algorithms: ["HS256"]
    });

    const time = parseTwitchTime(payload.data.time);
    const age = Date.now() - time;

    if (payload.topic === "bits_transaction_receipt"
      && payload.data.product.domainId === `twitch.ext.${config.twitch.extension.clientId}`
      && payload.data.product.cost.type === "bits"
      && age < TOLERANCE_MINUTES * 60 * 1000
    ) {
      return payload;
    }
  }
  catch {
    return;
  }
};

const validateTwitchExtension = async (event: H3Event) => {
  const token = getHeader(event, "Authorization")?.replace("Bearer ", "");
  const channelId = getHeader(event, "Channel-Id");

  if (!token || !channelId) return;

  const config = useRuntimeConfig(event);
  const key = Buffer.from(config.twitch.extension.secret, "base64");

  try {
    const { payload } = await jwtVerify<TwitchExtensionPayload>(token, key, {
      algorithms: ["HS256"]
    });

    if (payload.channel_id === channelId
      && Date.now() < payload.exp * 1000
    ) {
      return payload;
    }
  }
  catch {
    return;
  }
};

export const ensureTwitchExtension = async (event: H3Event) => {
  const payload = await validateTwitchExtension(event);

  if (!payload) {
    throw createError({
      status: StatusCode.BAD_REQUEST,
      message: "Invalid authorization"
    });
  }
};
