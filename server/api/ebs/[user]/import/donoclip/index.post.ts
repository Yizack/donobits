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
    user: z.string().min(1)
  }).parse);

  await ensureTwitchExtension(event);

  const donoclipImport = (body satisfies DonoclipImport[])
    .sort((a, b) => b.UploadedAt - a.UploadedAt);

  const donobits: Donobits[] = donoclipImport.map(item => ({
    uuid: item.UUID,
    type: item.Type,
    name: item.ViewerName,
    url: item.AssetUrl
  }));

  await blob.put(`${params.user}.json`, JSON.stringify(donobits), {
    prefix: "donobits",
    contentType: "application/json"
  });

  return { success: true };
});
