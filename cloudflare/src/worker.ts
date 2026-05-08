export interface Env {
  ASSETS: Fetcher;
  API_ORIGIN?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Optional API proxy: set API_ORIGIN in Wrangler env vars when needed.
    if (env.API_ORIGIN && url.pathname.startsWith("/api/")) {
      const target = new URL(`${url.pathname}${url.search}`, env.API_ORIGIN);
      return fetch(new Request(target.toString(), request));
    }

    return env.ASSETS.fetch(request);
  },
};
