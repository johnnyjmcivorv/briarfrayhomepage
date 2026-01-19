import { apiInitializer } from "discourse/lib/api";

const IMAGES = [
  "https://i.imgur.com/QopcbDo.jpg",
  "https://i.imgur.com/RQEMEV6.jpg",
  "https://i.imgur.com/Yza7azn.png",
  "https://i.imgur.com/iIVkzqo.png",
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function findHeaderHomeLink() {
  return (
    document.querySelector(".d-header .title a") ||
    document.querySelector(".d-header a.header-title") ||
    document.querySelector(".d-header .home-logo a") ||
    document.querySelector(".d-header a[href='/']") ||
    document.querySelector(".d-header a[href='/latest']")
  );
}

// Ensures the fade reliably triggers by adding bf-img-ready on a later frame
function setReadyNextPaint() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.classList.add("bf-img-ready");
    });
  });
}

// SPA can render the homepage DOM a tick later; wait a few frames for the img to exist
function waitForHomeImage(maxFrames = 30) {
  return new Promise((resolve) => {
    let frames = 0;

    function tick() {
      const img = document.getElementById("bf-home-random-img");
      if (img) return resolve(img);

      frames += 1;
      if (frames >= maxFrames) return resolve(null);

      requestAnimationFrame(tick);
    }

    tick();
  });
}

async function setRandomHomepageImageWithFade() {
  const img = await waitForHomeImage();
  if (!img) return;

  // Force "not ready" state first (this is what makes the transition consistent)
  document.documentElement.classList.remove("bf-img-ready");

  // Clear old handlers
  img.onload = null;
  img.onerror = null;

  const nextSrc = pickRandom(IMAGES);

  img.onload = () => setReadyNextPaint();
  img.onerror = () => setReadyNextPaint();

  // Set src *after* removing ready
  img.src = nextSrc;

  // Cached image case: onload can be skipped; still trigger fade
  if (img.complete && img.naturalWidth > 0) {
    setReadyNextPaint();
  }
}

export default apiInitializer((api) => {
  function applyRouteBehavior() {
    const path = window.location.pathname;
    const isHome = path === "/";
    const isLatest = path === "/latest";

    document.documentElement.classList.toggle("is-custom-home", isHome);
    document.body.classList.toggle("is-custom-home", isHome);

    // Always clear ready when leaving home so it can't "stick"
    if (!isHome) {
      document.documentElement.classList.remove("bf-img-ready");
    }

    // Header link behavior:
    // - on /latest -> /
    // - everywhere else -> /latest
    const headerLink = findHeaderHomeLink();
    if (headerLink) {
      headerLink.setAttribute("href", isLatest ? "/" : "/latest");

      if (!headerLink.dataset.bfHomeBound) {
        headerLink.dataset.bfHomeBound = "1";
        headerLink.addEventListener("click", (e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

          const target = window.location.pathname === "/latest" ? "/" : "/latest";
          e.preventDefault();
          api.navigateTo(target);
        });
      }
    }

    if (isHome) {
      setRandomHomepageImageWithFade();
    }
  }

  api.onPageChange(() => applyRouteBehavior());
  applyRouteBehavior();
});
