document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#auth-form");
  if (!form) return;
  const status = document.querySelector("#status");
  const submit = form.querySelector("button[type=submit]");
  const setStatus = (message, error = false) => {
    status.textContent = message;
    status.classList.toggle("error", error);
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submit.disabled = true;
    setStatus("Please wait…");
    try {
      const email = form.email.value.trim();
      const password = form.password.value;
      const mode = form.dataset.mode;
      let result;
      if (mode === "signup") result = await window.blurrrSupabase.auth.signUp({ email, password });
      else result = await window.blurrrSupabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (mode === "signup" && !result.data.session) {
        setStatus("Account created. Check your email to confirm it, then sign in.");
        return;
      }
      location.href = "admin.html";
    } catch (error) {
      setStatus(error.message || "Authentication failed.", true);
    } finally {
      submit.disabled = false;
    }
  });

  document.querySelector("#toggle-mode")?.addEventListener("click", (event) => {
    event.preventDefault();
    const signup = form.dataset.mode !== "signup";
    form.dataset.mode = signup ? "signup" : "signin";
    submit.textContent = signup ? "Create account" : "Sign in";
    document.querySelector("#toggle-mode").textContent = signup ? "Already have an account? Sign in" : "New here? Create an account";
  });
});
