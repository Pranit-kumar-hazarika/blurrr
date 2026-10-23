(() => {
  const cfg = window.BLURRR_CONFIG;
  if (!cfg || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) {
    console.warn("Set BLURRR_CONFIG in assets/js/config.js.");
    return;
  }
  if (!window.supabase?.createClient) {
    console.warn("Supabase JS CDN did not load.");
    return;
  }
  window.blurrrSupabase = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
})();
