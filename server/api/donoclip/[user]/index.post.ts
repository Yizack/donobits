export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, z.array(
    z.object({
      ID: z.number(),
      UUID: z.uuid(),
      Type: z.enum(["audio", "video"]),
      ViewerName: z.string(),
      UploadedAt: z.number(),
      ModDecision: z.number(),
      AssetUrl: z.string()
    })
  ).parse);

  const params = await getValidatedRouterParams(event, z.object({
    user: z.string()
  }).parse);

  const headers = getHeaders(event);
  const token = headers.authorization?.replace("Bearer ", "");

  const payload = await validateTwitchExtension(event, token);

  if (!payload) {
    throw createError({
      status: 400,
      message: "Invalid authorization"
    });
  }

  const content = body as Donoclip[];
  const sortedContent = content.sort((a, b) => b.UploadedAt - a.UploadedAt);

  await blob.put(params.user, JSON.stringify(sortedContent), {
    prefix: "donoclip",
    contentType: "application/json"
  });
});
