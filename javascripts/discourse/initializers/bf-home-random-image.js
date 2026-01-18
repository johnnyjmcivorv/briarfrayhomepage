import { apiInitializer } from "discourse/lib/api";

const IMAGES = [
  "https://i.imgur.com/QopcbDo.jpg",
  "https://i.imgur.com/RQEMEV6.jpg",
  "https://i.imgur.com/Yza7azn.png",
  "https://i.imgur.com/xN1oJK2.gif",
  "https://i.imgur.com/iIVkzqo.png",
  "https://i.imgur.com/9eGxskv.jpg",
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
    document.querySelector(".d-header a[href='/']")
  );
}

function setHomepageImage() {
  const img = document.getElementById("bf-home-random-img");
  if (!img) return;

  const frame = document.querySelector(".home-image-frame");

  // Clear any prior handler + class before loading the next image
  img.onload = null;
  if (frame) frame.classList.remove("is-landscape");

  img.onload = () => {
    if (!frame) return;
    const isLandscape = img.naturalWidth > img.naturalHeight;
    frame.classList.toggle("is-landscape", isLandscape);
  };

  img.src = pickRandom(IMAGES);
}

export default apiInitializer((api) => {
  function applyRouteBehavior() {
    const path = window.location.pathname;

    const isHome = path === "/";
    const isLatest = path === "/latest";

    // Homepage-only class (used by CSS to hide header only on /)
    document.documentElement.classList.toggle("is-custom-home", isHome);
    document.body.classList.toggle("is-custom-home", isHome);

    // Header link behavior:
    // - from /latest clicking "home" goes to /
    // - from anywhere else clicking "home" goes to /latest
    const headerLink = findHeaderHomeLink();
    if (headerLink) {
      const targetHref = isLatest ? "/" : "/latest";
      headerLink.setAttribute("href", targetHref);

      // Bind once so SPA navigation behaves nicely
      if (!headerLink.dataset.bfHomeBound) {
        headerLink.dataset.bfHomeBound = "1";

        headerLink.addEventListener("click", (e) => {
          // allow ctrl/cmd click to open in new tab, etc.
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

          const nowPath = window.location.pathname;
          const dest = nowPath === "/latest" ? "/" : "/latest";

          e.preventDefault();
          api.navigateTo(dest);
        });
      }
    }

    // Random image (and landscape detection) only on homepage
    if (isHome) setHomepageImage();
  }

  api.onPageChange(() => applyRouteBehavior());
  applyRouteBehavior(); // run once on boot
});
