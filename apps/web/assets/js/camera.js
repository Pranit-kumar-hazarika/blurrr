document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(location.search);
  const token = params.get("token");
  const video = document.querySelector("#camera-preview");
  const canvas = document.querySelector("#capture-canvas");
  const preview = document.querySelector("#photo-preview");
  const status = document.querySelector("#status");
  const startButton = document.querySelector("#start-camera");
  const shutter = document.querySelector("#shutter");
  const retake = document.querySelector("#retake");
  const uploadButton = document.querySelector("#upload-photo");
  const fileInput = document.querySelector("#file-input");
  const switchCamera = document.querySelector("#switch-camera");
  const filterToggle = document.querySelector("#filter-toggle");
  let stream = null;
  let facingMode = "environment";
  let capturedBlob = null;
  let vintageEnabled = true;

  const setStatus = (text, error = false) => {
    status.textContent = text;
    status.classList.toggle("error", error);
  };
  const stopCamera = () => {
    if (stream) stream.getTracks().forEach((track) => track.stop());
    stream = null;
    video.srcObject = null;
  };
  const startCamera = async () => {
    if (!token) return setStatus("Open this page from a valid event link.", true);
    stopCamera();
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: facingMode }, width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      video.srcObject = stream;
      await video.play();
      setStatus("Camera ready. Make a memory.");
      shutter.disabled = false;
    } catch (error) {
      setStatus("Camera access failed. Allow camera permission or choose a photo from your device.", true);
      shutter.disabled = true;
    }
  };

  function applyVintage(ctx, width, height) {
    const image = ctx.getImageData(0, 0, width, height);
    const d = image.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const x = (i / 4 % width) / width - 0.5;
      const y = Math.floor(i / 4 / width) / height - 0.5;
      const vignette = Math.max(0.68, 1 - (x * x + y * y) * 0.8);
      const grain = (Math.random() - 0.5) * 10;
      d[i] = Math.min(255, Math.max(0, (r * 0.78 + gray * 0.12 + 22 + grain) * vignette));
      d[i + 1] = Math.min(255, Math.max(0, (g * 0.82 + gray * 0.10 + 12 + grain) * vignette));
      d[i + 2] = Math.min(255, Math.max(0, (b * 0.72 + gray * 0.10 - 4 + grain) * vignette));
    }
    ctx.putImageData(image, 0, 0);
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not process the photo.")), "image/jpeg", 0.9));
  }

  async function capture() {
    if (!stream || !video.videoWidth) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    if (vintageEnabled) applyVintage(ctx, canvas.width, canvas.height);
    capturedBlob = await canvasToBlob(canvas);
    preview.src = URL.createObjectURL(capturedBlob);
    preview.hidden = false;
    video.hidden = true;
    retake.hidden = uploadButton.hidden = false;
    shutter.hidden = true;
    setStatus("Looking good? Upload it or retake.");
  }

  startButton.addEventListener("click", startCamera);
  shutter.addEventListener("click", () => capture().catch((e) => setStatus(e.message, true)));
  switchCamera.addEventListener("click", async () => {
    facingMode = facingMode === "environment" ? "user" : "environment";
    await startCamera();
  });
  filterToggle.addEventListener("change", () => { vintageEnabled = filterToggle.checked; });
  retake.addEventListener("click", () => {
    capturedBlob = null; preview.hidden = true; video.hidden = false;
    retake.hidden = uploadButton.hidden = true; shutter.hidden = false;
    setStatus("Take another shot.");
  });
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setStatus("Choose a JPEG, PNG, or WebP image.", true);
    capturedBlob = file;
    preview.src = URL.createObjectURL(file);
    preview.hidden = false; video.hidden = true; shutter.hidden = true;
    retake.hidden = uploadButton.hidden = false;
    setStatus("Photo selected. Ready to upload.");
  });
  uploadButton.addEventListener("click", async () => {
    if (!capturedBlob) return;
    uploadButton.disabled = true;
    setStatus("Uploading your memory…");
    try {
      const form = new FormData();
      form.append("photo", capturedBlob, `blurrr-${Date.now()}.jpg`);
      await window.blurrrApi.request(`/events/guest/${encodeURIComponent(token)}/photos`, { method: "POST", body: form });
      setStatus("Uploaded! Your memory is now in the event folder.");
      uploadButton.hidden = true;
    } catch (error) {
      setStatus(error.message, true);
    } finally { uploadButton.disabled = false; }
  });

  window.addEventListener("pagehide", stopCamera);
  if (!navigator.mediaDevices?.getUserMedia) {
    startButton.disabled = true;
    setStatus("This browser does not support camera access. You can still choose a photo.", true);
  }
});
