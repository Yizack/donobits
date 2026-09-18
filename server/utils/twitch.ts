import { Buffer } from "node:buffer";
import { jwtVerify } from "jose";
import type { H3Event } from "h3";

const parseTwitchTime = (value: string): Date => {
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

  return result;
};

const TOLERANCE_MINUTES = 1;

export const validateTwitchTransaction = async (
  event: H3Event,
  transaction: Pick<Twitch.ext.BitsTransaction, "displayName" | "transactionReceipt">
) => {
  const twitch = useRuntimeConfig(event);
  const secretBytes = Buffer.from(twitch.twitch.extension.secret, "base64");

  try {
    const { payload } = await jwtVerify<TwitchTransactionPayload>(transaction.transactionReceipt, secretBytes, {
      algorithms: ["HS256"]
    });

    const transactionTime = parseTwitchTime(payload.data.time);
    const age = Date.now() - transactionTime.getTime();

    if (payload.topic === "bits_transaction_receipt"
      && payload.data.product.domainId === `twitch.ext.${twitch.twitch.extension.clientId}`
      && payload.data.product.cost.type === "bits"
      && age < TOLERANCE_MINUTES * 60 * 1000
    ) {
      return payload;
    }
  }
  catch {
    return null;
  }
};
