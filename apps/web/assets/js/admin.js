
document.addEventListener("DOMContentLoaded", async () => {
  const client = window.blurrrSupabase;
  const status = document.querySelector("#status");
  const eventsList = document.querySelector("#events-list");
  const createForm = document.querySelector("#create-event-form");
  const signOut = document.querySelector("#sign-out");
  const createdLink = document.querySelector("#created-link");
  const qrPanel = document.querySelector("#guest-qr-panel");
  const qrCode = document.querySelector("#guest-qr-code");
  const showQr = document.querySelector("#show-qr");
  const setStatus = (text, error = false) => { status.textContent = text; status.classList.toggle("error", error); };

  if (!client) return setStatus("Configure Supabase in assets/js/config.js.", true);
  const { data: sessionData } = await client.auth.getSession();
  if (!sessionData.session) { location.href = "login.html"; return; }

  async function token() { return window.blurrrApi.sessionToken(); }
  async function loadEvents() {
    try {
      const result = await window.blurrrApi.request("/admin/events", { token: await token() });
      eventsList.replaceChildren();
      if (!result.events.length) {
        const empty = document.createElement("p"); empty.textContent = "No events yet. Create your first one."; eventsList.append(empty);
      }
      result.events.forEach((event) => {
        const card = document.createElement("article"); card.className = "event-card";
        const heading = document.createElement("h3"); heading.textContent = event.name;
        const meta = document.createElement("p"); meta.textContent = `${event.photo_count ?? "—"} photos · ${new Date(event.created_at).toLocaleDateString()} · ${event.status}`;
        const link = document.createElement("input"); link.readOnly = true;
        link.value = `${location.origin}${location.pathname.replace(/admin\.html$/, "")}event.html?token=${encodeURIComponent(event.guest_token || "")}`;
        // Guest tokens are deliberately not stored/retrievable. The event-creation response shows its link once.
        link.value = "Guest link is shown only immediately after event creation. Save it securely.";
        const row = document.createElement("div"); row.className = "button-row";
        const photos = document.createElement("button"); photos.className = "button button-secondary"; photos.textContent = "View photos";
        photos.addEventListener("click", () => showAdminPhotos(event.id, event.name));
        const download = document.createElement("button"); download.className = "button button-secondary"; download.textContent = "Download ZIP";
        download.addEventListener("click", () => downloadZip(event.id));
        const remove = document.createElement("button"); remove.className = "button button-danger"; remove.textContent = "Delete event";
        remove.addEventListener("click", () => deleteEvent(event.id, event.name));
        row.append(photos, download, remove);
        card.append(heading, meta, row); eventsList.append(card);
      });
    } catch (error) { setStatus(error.message, true); }
  }

  async function downloadZip(id) {
    try {
      setStatus("Preparing ZIP archive…");
      const response = await window.blurrrApi.request(`/admin/events/${id}/download`, { token: await token() });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "blurrr-event-photos.zip"; a.click();
      URL.revokeObjectURL(url); setStatus("Download started.");
    } catch (error) { setStatus(error.message, true); }
  }

  async function deleteEvent(id, name) {
    if (!confirm(`Permanently delete "${name}" and its photos? This cannot be undone. Download the ZIP first if you need a copy.`)) return;
    try {
      await window.blurrrApi.request(`/admin/events/${id}`, { method: "DELETE", token: await token() });
      setStatus("Event and stored photos deleted.");
      await loadEvents();
    } catch (error) { setStatus(`${error.message} If cleanup failed, retry deletion.`, true); }
  }

  async function showAdminPhotos(id, name) {
    try {
      const result = await window.blurrrApi.request(`/admin/events/${id}/photos`, { token: await token() });
      const dialog = document.querySelector("#admin-photos-dialog");
      const title = dialog.querySelector("h2"); title.textContent = `${name} — photos`;
      const body = dialog.querySelector(".dialog-body"); body.replaceChildren();
      result.photos.forEach((photo) => {
        const item = document.createElement("div"); item.className = "admin-photo";
        const img = document.createElement("img"); img.src = photo.url; img.alt = photo.original_filename;
        const del = document.createElement("button"); del.className = "button button-danger"; del.textContent = "Delete";
        del.addEventListener("click", async () => {
          if (!confirm("Delete this photo permanently?")) return;
          try {
            await window.blurrrApi.request(`/admin/photos/${photo.id}`, { method: "DELETE", token: await token() });
            item.remove(); setStatus("Photo deleted.");
          } catch (error) { setStatus(error.message, true); }
        });
        item.append(img, del); body.append(item);
      });
      dialog.showModal();
    } catch (error) { setStatus(error.message, true); }
  }

  createForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = createForm.querySelector("button[type=submit]"); button.disabled = true;
    try {
      const result = await window.blurrrApi.request("/events", {
        method: "POST", token: await token(), body: { name: createForm.name.value.trim() }
      });
      const guestUrl = `${location.origin}${location.pathname.replace(/admin\.html$/, "")}event.html?token=${encodeURIComponent(result.guestToken)}`;
      createdLink.value = guestUrl;
      qrCode.replaceChildren();
      qrPanel.hidden = true;
      showQr.textContent = "Show QR code";
      showQr.setAttribute("aria-expanded", "false");
      document.querySelector("#created-link-panel").hidden = false;
      createForm.reset();
      setStatus("Event created. Copy and save the guest link now; it cannot be retrieved later.");
      await loadEvents();
    } catch (error) { setStatus(error.message, true); }
    finally { button.disabled = false; }
  });

  document.querySelector("#copy-link").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(createdLink.value); setStatus("Guest link copied."); }
    catch { createdLink.select(); document.execCommand("copy"); setStatus("Guest link copied."); }
  });
  showQr.addEventListener("click", () => {
    if (!qrPanel.hidden) {
      qrPanel.hidden = true;
      showQr.textContent = "Show QR code";
      showQr.setAttribute("aria-expanded", "false");
      return;
    }
    if (!window.QRCode) {
      setStatus("QR code generator did not load. You can still copy the guest link.", true);
      return;
    }
    if (!qrCode.childElementCount) {
      new window.QRCode(qrCode, {
        text: createdLink.value,
        width: 240,
        height: 240,
        colorDark: "#3d3027",
        colorLight: "#fffaf3",
        correctLevel: window.QRCode.CorrectLevel.M
      });
    }
    qrPanel.hidden = false;
    showQr.textContent = "Hide QR code";
    showQr.setAttribute("aria-expanded", "true");
  });
  document.querySelector("#close-admin-photos").addEventListener("click", () => document.querySelector("#admin-photos-dialog").close());
  signOut.addEventListener("click", async () => { await client.auth.signOut(); location.href = "index.html"; });
  await loadEvents();
});
