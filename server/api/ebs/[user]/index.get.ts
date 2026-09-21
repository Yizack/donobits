export default defineEventHandler(async (event) => {
  const params = await getValidatedRouterParams(event, z.object({
    user: z.string()
  }).parse);

  await ensureTwitchExtension(event);

  return blob.serve(event, `donobits/${params.user}.json`) as unknown as Donobits[];
});
