export default defineEventHandler(async (event) => {
  const params = await getValidatedRouterParams(event, z.object({
    user: z.string()
  }).parse);

  return blob.serve(event, `donoclip/${params.user}`);
});
