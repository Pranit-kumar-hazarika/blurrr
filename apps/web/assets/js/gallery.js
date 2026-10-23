document.addEventListener("DOMContentLoaded", async () => {
  const token = new URLSearchParams(location.search).get("token");
  const grid = document.querySelector("#photo-grid");
  const title = document.querySelector("#event-title");
  const count = document.querySelector("#photo-count");
  const status = document.querySelector("#status");
  const refresh = document.querySelector("#refresh-gallery");
  const lightbox = document.querySelector("#lightbox");
  const lightboxImage = document.querySelector("#lightbox-image");
  const closeLightbox = document.querySelector("#close-lightbox");

  if (!token) { status.textContent = "Missing guest link token."; return; }

  async function load() {
    status.textContent = "Loading memories…";
    grid.replaceChildren();
    try {
      const eventResult = await window.blurrrApi.request(`/events/guest/${encodeURIComponent(token)}`);
      title.textContent = eventResult.event.name;
      const result = await window.blurrrApi.request(`/events/guest/${encodeURIComponent(token)}/photos`);
      count.textContent = `${result.photos.length} ${result.photos.length === 1 ? "memory" : "memories"}`;
      if (!result.photos.length) status.textContent = "No photos yet. Be the first to add a memory.";
      else status.textContent = "";
      result.photos.forEach((photo) => {
        const card = document.createElement("article");
        card.className = "polaroid";
        const image = document.createElement("img");
        image.src = photo.url; image.alt = photo.original_filename || "Event memory"; image.loading = "lazy";
        image.addEventListener("click", () => { lightboxImage.src = photo.url; lightbox.showModal(); });
        const caption = document.createElement("p");
        caption.textContent = new Date(photo.created_at).toLocaleString();
        const download = document.createElement("a");
        download.href = photo.url; download.download = photo.original_filename || "blurrr-memory.jpg";
        download.textContent = "Download"; download.className = "text-link";
        card.append(image, caption, download); grid.append(card);
      });
    } catch (error) { status.textContent = error.message; status.classList.add("error"); }
  }
  refresh.addEventListener("click", load);
  closeLightbox.addEventListener("click", () => lightbox.close());
  lightbox.addEventListener("click", (event) => { if (event.target === lightbox) lightbox.close(); });
  await load();
});
