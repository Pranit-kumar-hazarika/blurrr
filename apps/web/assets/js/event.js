document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(location.search);
  const token = params.get("token");
  const title = document.querySelector("#event-title");
  const status = document.querySelector("#status");
  const camera = document.querySelector("#open-camera");
  const folder = document.querySelector("#open-folder");

  if (!token) {
    status.textContent = "This guest link is missing its token. Ask the organizer for a new link.";
    camera.disabled = folder.disabled = true;
    return;
  }
  try {
    const result = await window.blurrrApi.request(`/events/guest/${encodeURIComponent(token)}`);
    title.textContent = result.event.name;
    camera.href = `camera.html?token=${encodeURIComponent(token)}`;
    folder.href = `gallery.html?token=${encodeURIComponent(token)}`;
  } catch (error) {
    status.textContent = error.message;
    camera.disabled = folder.disabled = true;
    camera.removeAttribute("href");
    folder.removeAttribute("href");
  }
});
