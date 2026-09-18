
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, z.object({
    transaction: z.object({
      displayName: z.string(),
      transactionReceipt: z.string()
    }),
    avatar: z.string().optional(),
    clip: z.object({
      ID: z.number(),
      UUID: z.uuid(),
      Type: z.enum(["audio", "video"]),
      ViewerName: z.string(),
      UploadedAt: z.number(),
      ModDecision: z.number(),
      AssetUrl: z.string()
    })
  }).parse);

  if (!await isValidTwitchTransaction(event, body.transaction)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid Twitch transaction"
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
            displayName: body.transaction?.displayName
          },
          avatar: body.avatar,
          clip: body.clip
        } satisfies DonobitsQueue
      }));
    }

    setResponseStatus(event, 204);
    return;
  }

  const durableFetch = event.context.cloudflare?.durableFetch;
  if (!durableFetch) {
    throw createError({
      statusCode: 503,
      statusMessage: "Durable Object service unavailable"
    });
  }

  // TODO: validate transaction

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
      statusCode: 502,
      statusMessage: "Failed to publish queued clip"
    });
  }

  setResponseStatus(event, 202);

  return { queued: true };
});
