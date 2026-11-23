/* Drag-and-zoom room photograph viewer. */
"use strict";
(() => {
  const modal = document.getElementById("panoramaModal");
  if (!modal) return;

  const viewport = document.getElementById("panoramaViewport");
  const image = document.getElementById("panoramaImage");
  const title = document.getElementById("panoramaTitle");
  const closeButton = document.getElementById("panoramaClose");

  let zoom = 1;
  let offsetX = 0;
  let offsetY = 0;
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let previousFocus = null;
  let previousOverflow = "";

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function updateImage() {
    if (!image.naturalWidth || !image.naturalHeight || !viewport.clientHeight) return;
    const baseWidth =
      image.naturalWidth * (viewport.clientHeight / image.naturalHeight);

    const width = baseWidth * zoom;
    const height = viewport.clientHeight * zoom;

    const maxX = Math.max(0, (width - viewport.clientWidth) / 2);
    const maxY = Math.max(0, (height - viewport.clientHeight) / 2);

    offsetX = clamp(offsetX, -maxX, maxX);
    offsetY = clamp(offsetY, -maxY, maxY);

    image.style.left = "50%";
    image.style.top = "50%";
    image.style.transform =
      `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${zoom})`;
  }

  function resetView() {
    zoom = 1;
    offsetX = 0;
    offsetY = 0;
    if (image.complete && image.naturalWidth) updateImage();
  }

  document.querySelectorAll(".panorama-open").forEach(button => {
    button.addEventListener("click", () => {
      previousFocus = document.activeElement;
      previousOverflow = document.body.style.overflow;

      image.src = button.dataset.panorama;
      image.alt = button.dataset.room + " panoramic photograph";
      title.textContent = button.dataset.room;

      modal.hidden = false;
      document.body.style.overflow = "hidden";

      resetView();
      closeButton.focus();
    });
  });

  image.addEventListener("load", resetView);

  function closeViewer() {
    modal.hidden = true;
    document.body.style.overflow = previousOverflow;
    dragging = false;
    if (previousFocus) previousFocus.focus();
  }

  closeButton.addEventListener("click", closeViewer);

  modal.addEventListener("click", event => {
    if (event.target === modal) closeViewer();
  });

  document.addEventListener("keydown", event => {
    if (modal.hidden) return;

    if (event.key === "Escape") {
      closeViewer();
    }

    if (event.key === "Tab") {
      const focusable = Array.from(
        modal.querySelectorAll("button:not([disabled])")
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  viewport.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;

    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    viewport.setPointerCapture(event.pointerId);
  });

  viewport.addEventListener("pointermove", event => {
    if (!dragging) return;

    offsetX += event.clientX - startX;
    offsetY += event.clientY - startY;

    startX = event.clientX;
    startY = event.clientY;

    updateImage();
  });

  viewport.addEventListener("pointerup", () => {
    dragging = false;
  });

  viewport.addEventListener("lostpointercapture", () => { dragging = false; });
  viewport.addEventListener("pointercancel", () => {
    dragging = false;
  });

  document.getElementById("panoramaZoomIn").addEventListener("click", () => {
    zoom = Math.min(zoom + 0.25, 3);
    updateImage();
  });

  document.getElementById("panoramaZoomOut").addEventListener("click", () => {
    zoom = Math.max(zoom - 0.25, 1);
    updateImage();
  });

  document.getElementById("panoramaReset")
    .addEventListener("click", resetView);

  window.addEventListener("resize", () => {
    if (!modal.hidden && image.naturalWidth) updateImage();
  });
})();
