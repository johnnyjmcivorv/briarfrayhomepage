
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
    document.querySelector(".d-header a[href='/']") ||
    document.querySelector(".d-header a[href='/latest']")
  );
}

function setRandomHomepageImage() {
  const img = document.getElementById("bf-home-random-img");
  if (!img) return;

  // Clear any previous onload handlers (avoid stacking)
  img.onload = null;

  img.src = pickRandom(IMAGES);
}

export default apiInitializer((api) => {
  function applyRouteBehavior() {
    const path = window.location.pathname;
    const isHome = path === "/";
    const isLatest = path === "/latest";

    // Used by CSS to hide the header only on the homepage
    document.documentElement.classList.toggle("is-custom-home", isHome);
    document.body.classList.toggle("is-custom-home", isHome);

    // Header link behavior:
    // - on /latest -> /
    // - everywhere else -> /latest
    const headerLink = findHeaderHomeLink();
    if (headerLink) {
      const dest = isLatest ? "/" : "/latest";
      headerLink.setAttribute("href", dest);

      // Bind click once so SPA navigation behaves nicely (no full reload)
      if (!headerLink.dataset.bfHomeBound) {
        headerLink.dataset.bfHomeBound = "1";
        headerLink.addEventListener("click", (e) => {
          // allow ctrl/cmd click to open in new tab
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

          const nowPath = window.location.pathname;
          const nowIsLatest = nowPath === "/latest";
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
