export const useDonoclip = (broadcasterLogin: MaybeRef<string | undefined>) => {
  return useFetch<Donoclip[]>(() => `/api/donoclip/${unref(broadcasterLogin)}`, {
    baseURL: SITE.host,
    server: false,
    lazy: true,
    immediate: false
  });
};
