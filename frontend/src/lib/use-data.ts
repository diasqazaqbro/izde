"use client";

import { useCallback, useEffect, useState } from "react";

// Loads data on the client (the mock keeps plan, roles and chats in localStorage).
// `load` must be stable, e.g. an `api` method.
export function useData<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T>();
  const reload = useCallback(() => load().then(setData), [load]);
  useEffect(() => {
    reload();
  }, [reload]);
  return [data, reload] as const;
}
