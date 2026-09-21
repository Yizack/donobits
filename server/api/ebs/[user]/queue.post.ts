export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, z.object({
    transaction: z.object({
      displayName: z.string(),
      transactionReceipt: z.string()
    }),
    image: z.string().optional(),
    data: z.object({
      uuid: z.uuid(),
      type: z.enum(["audio", "video"]),
      name: z.string(),
      url: z.string()
    })
  }).parse);

  const payload = await validateTwitchTransaction(event, body.transaction.transactionReceipt);

  if (!payload) {
    throw createError({
      status: StatusCode.BAD_REQUEST,
      message: "Invalid Twitch transaction"
    });
  }

  const params = await getValidatedRouterParams(event, z.object({
    user: z.string().min(1)
  }).parse);

  const durable = event.context.cloudflare?.durable;
  if (durable) {
    const user = params.user.trim().toLowerCase();
    const topic = `source:${user}`;

    for (const socket of durable.ctx.getWebSockets()) {
      const attachment = socket.deserializeAttachment() as { t?: Set<string> } | null;
      if (!attachment?.t?.has(topic)) continue;

      socket.send(JSON.stringify({
        type: "queued",
        data: {
          transaction: {
            displayName: body.transaction.displayName,
            product: {
              cost: {
                amount: String(payload.data.product.cost.amount),
                type: payload.data.product.cost.type
              }
            }
          },
          image: body.image,
          data: body.data
        } satisfies DonobitsQueued
      }));
    }

    return sendNoContent(event);
  }

  await ensureTwitchExtension(event);

  const durableFetch = event.context.cloudflare?.durableFetch;
  if (!durableFetch) {
    throw createError({
      status: StatusCode.SERVICE_UNAVAILABLE,
      message: "Durable Object service unavailable"
    });
  }

  const publishResponse = await durableFetch(
    new Request(SITE.host + event.path, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(body)
    })
  );

  if (!publishResponse.ok) {
    throw createError({
      status: StatusCode.BAD_GATEWAY,
      message: "Failed to publish queued clip"
    });
  }

  setResponseStatus(event, StatusCode.ACCEPTED);

  return { success: true };
});
