/* Shared navigation footer, date validation and reservation draft behavior. */
"use strict";

const byId = (id) => document.getElementById(id);
const year = byId("year");
if (year) year.textContent = new Date().getFullYear();

function localDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
const today = localDate(new Date());
function nextDay(value) {
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + 1);
  return localDate(date);
}
function configureDates(checkin, checkout) {
  if (!checkin || !checkout) return;
  checkin.min = today;
  function update() {
    checkout.min = checkin.value && checkin.value >= today ? nextDay(checkin.value) : nextDay(today);
    checkout.setCustomValidity(checkout.value && checkout.value < checkout.min ? "Check-out must be after check-in." : "");
  }
  checkin.addEventListener("input", update);
  checkout.addEventListener("input", update);
  update();
}
configureDates(byId("checkin"), byId("checkout"));

const reservationForm = byId("reservationForm");
if (reservationForm) {
  const params = new URLSearchParams(window.location.search);
  const room = byId("roomSelect");
  if (Array.from(room.options).some((option) => option.value === params.get("room"))) room.value = params.get("room");
  for (const [param, id] of [["checkin", "modalCheckin"], ["checkout", "modalCheckout"]]) {
    const value = params.get(param);
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= today) byId(id).value = value;
  }
  if (["1", "2"].includes(params.get("guests"))) byId("reservationGuests").value = params.get("guests");
  configureDates(byId("modalCheckin"), byId("modalCheckout"));
  byId("draftSubmit").disabled = false;
  let draftText = "";
  reservationForm.addEventListener("input", () => { byId("bookingMessage").hidden = true; });
  reservationForm.addEventListener("change", () => { byId("bookingMessage").hidden = true; });
  reservationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const checkin = byId("modalCheckin");
    const checkout = byId("modalCheckout");
    checkout.setCustomValidity(checkout.value <= checkin.value ? "Check-out must be after check-in." : "");
    if (!reservationForm.reportValidity()) return;
    const [iy, im, id] = checkin.value.split("-").map(Number);
    const [oy, om, od] = checkout.value.split("-").map(Number);
    const nights = Math.round((Date.UTC(oy, om - 1, od) - Date.UTC(iy, im - 1, id)) / 86400000);
    draftText = [
      "WILDFLOWER BLISS LODGE — RESERVATION DRAFT",
      "Colorado Springs, Colorado",
      "",
      `Name: ${byId("guestName").value.trim()}`,
      `Email: ${byId("guestEmail").value.trim()}`,
      `Room: ${room.value}`,
      `Check-in: ${checkin.value} (3:00 PM)`,
      `Check-out: ${checkout.value} (11:00 AM)`,
      `Nights: ${nights}`,
      `Guests: ${byId("reservationGuests").value}`,
      `Questions or special requests: ${byId("guestMessage").value.trim() || "None"}`,
      "",
      "This draft has not been sent. Availability and reservations are not confirmed."
    ].join("\n");
    byId("draftSummary").textContent = draftText;
    byId("bookingMessage").hidden = false;
    byId("bookingMessage").focus();
  });
  byId("downloadDraft").addEventListener("click", () => {
    if (!draftText) return;
    const url = URL.createObjectURL(new Blob([draftText], {type: "text/plain;charset=utf-8"}));
    const link = document.createElement("a");
    link.href = url;
    link.download = "wildflower-bliss-lodge-reservation-draft.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  byId("printDraft").addEventListener("click", () => { if (draftText) window.print(); });
}


const quickBooking = document.getElementById("quickBooking");

if (quickBooking) {

  quickBooking.addEventListener("submit", function(event) {

    event.preventDefault();

    const checkin = document.getElementById("checkin");
    const checkout = document.getElementById("checkout");
    const guests = document.getElementById("guests");

    if (!quickBooking.reportValidity()) {
      return;
    }

    if (checkout.value <= checkin.value) {
      checkout.setCustomValidity(
        "Check-out must be after check-in."
      );
      checkout.reportValidity();
      return;
    }

    const params = new URLSearchParams({
      checkin: checkin.value,
      checkout: checkout.value,
      guests: guests.value
    });

    window.location.href = "contact.html?" + params.toString();

  });

}

document.addEventListener("DOMContentLoaded", () => {
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

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function updateImage() {
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
    document.body.style.overflow = "";
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
});