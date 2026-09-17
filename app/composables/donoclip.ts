export const useDonoclip = (broadcasterLogin: MaybeRef<string | undefined>) => {
  return useFetch<DonoClip[]>(() => `/api/donoclip/${unref(broadcasterLogin)}`, {
    baseURL: SITE.host,
    server: false,
    lazy: true,
    immediate: false
  });
};
