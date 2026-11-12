import { mockApi } from "./mock";

export * from "./types";

// The only place that picks the implementation. Phase 2 swaps in the HTTP client; screens import `api` only.
export const api = mockApi;
