window.blurrrApi = {
  async request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (options.token) headers.set("Authorization", `Bearer ${options.token}`);
    if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
    const response = await fetch(`${window.BLURRR_CONFIG.API_BASE_URL}${path}`, {
      ...options, headers, body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined
    });
    if (!response.ok) {
      let message = "Something went wrong. Please try again.";
      try { message = (await response.json()).error || message; } catch {}
      throw new Error(message);
    }
    const type = response.headers.get("content-type") || "";
    return type.includes("application/json") ? response.json() : response;
  },
  async sessionToken() {
    const client = window.blurrrSupabase;
    if (!client) throw new Error("Supabase is not configured. Check assets/js/config.js.");
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (!data.session?.access_token) throw new Error("Please sign in first.");
    return data.session.access_token;
  }
};
