import { apiInitializer } from "discourse/lib/api";

const IMAGES = [
  "https://i.imgur.com/QopcbDo.jpg",
  "https://i.imgur.com/RQEMEV6.jpg",
  "https://i.imgur.com/Yza7azn.png",
  "https://i.imgur.com/xN1oJK2.gif",
  "https://i.imgur.com/iIVkzqo.png",
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Try a few common header title/logo selectors (themes vary)
function findHeaderHomeLink() {
  return (
    document.querySelector(".d-header .title a") ||
    document.querySelector(".d-header a.header-title") ||
    document.querySelector(".d-header .home-logo a") ||
    document.querySelector(".d-header a[href='/']") ||
    document.querySelector(".d-header a[href='/latest']")
  );
}

function setRandomHomepageImage() {
  const img = document.getElementById("bf-home-random-img");
  if (!img) return;

  // Mark "not ready" BEFORE changing src (prevents broken icon/alt flashes if CSS hides until ready)
  document.documentElement.classList.remove("bf-img-ready");

  // Clear old handlers
  img.onload = null;
  img.onerror = null;

  // Pick next image
  const nextSrc = pickRandom(IMAGES);

  // When it loads, mark ready (instant show; no fade)
  img.onload = () => {
    document.documentElement.classList.add("bf-img-ready");
  };

  // If it fails, still mark ready so the page isn't blank forever
  img.onerror = () => {
    document.documentElement.classList.add("bf-img-ready");
  };

  // Trigger the load
  img.src = nextSrc;

  // Handle the "cached image" case where onload may not fire reliably
  if (img.complete && img.naturalWidth > 0) {
    document.documentElement.classList.add("bf-img-ready");
  }
}

export default apiInitializer((api) => {
  function applyRouteBehavior() {
    const path = window.location.pathname;
    const isHome = path === "/";
    const isLatest = path === "/latest";

    // Homepage-only class (used by CSS to hide header etc.)
    document.documentElement.classList.toggle("is-custom-home", isHome);
    document.body.classList.toggle("is-custom-home", isHome);

    // If we leave the homepage, clear the "ready" state so it can't stick
    if (!isHome) {
      document.documentElement.classList.remove("bf-img-ready");
    }

    // Header link behavior:
    // - on /latest -> /
    // - everywhere else -> /latest
    const headerLink = findHeaderHomeLink();
    if (headerLink) {
      const dest = isLatest ? "/" : "/latest";
      headerLink.setAttribute("href", dest);

      // Bind click once (SPA-friendly)
      if (!headerLink.dataset.bfHomeBound) {
        headerLink.dataset.bfHomeBound = "1";
        headerLink.addEventListener("click", (e) => {
          // allow ctrl/cmd click to open in new tab
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

          const nowIsLatest = window.location.pathname === "/latest";
          const target = nowIsLatest ? "/" : "/latest";

          e.preventDefault();
          api.navigateTo(target);
        });
      }
    }

    // Random image only on homepage
    if (isHome) setRandomHomepageImage();
  }

  api.onPageChange(() => applyRouteBehavior());
  applyRouteBehavior(); // run once on boot
});
