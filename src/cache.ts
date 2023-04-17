function useCache() {
  const cache = {
    defaultTableName: "",
  };
  return {
    value: cache,
    reset() {
      cache.defaultTableName = "";
    },
  };
}

export type UseCache = ReturnType<typeof useCache>
export default useCache;
