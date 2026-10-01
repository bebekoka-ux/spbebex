(function () {
  "use strict";

  function randomInt(max) {
    if (!Number.isInteger(max) || max <= 0) {
      throw new Error("randomInt requires a positive integer");
    }
    const range = 0x100000000;
    const limit = range - (range % max);
    const data = new Uint32Array(1);
    do {
      crypto.getRandomValues(data);
    } while (data[0] >= limit);
    return data[0] % max;
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (_error) {
      // Some school-managed browsers disable fullscreen; the app remains usable.
    }
  }

  function enterKioskFullscreen() {
    if (!document.body.classList.contains("kiosk") || document.fullscreenElement || !document.fullscreenEnabled) return;
    document.documentElement.requestFullscreen().catch(() => {
      // School-managed browsers may block fullscreen; gameplay still works.
    });
  }

  function setupShell() {
    const fullscreen = document.querySelector("[data-fullscreen]");
    const reset = document.querySelector("[data-reset]");
    const primary = document.querySelector("[data-primary]");

    fullscreen?.addEventListener("click", toggleFullscreen);
    document.addEventListener("keydown", (event) => {
      if (event.repeat) return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      if (event.key.toLowerCase() === "f") toggleFullscreen();
      if (event.key.toLowerCase() === "r" && reset) reset.click();
      if (event.code === "Space" && primary && !primary.disabled) {
        event.preventDefault();
        primary.click();
      }
    });
  }

  window.FestivalGames = { randomInt, setupShell, toggleFullscreen, enterKioskFullscreen };
})();

