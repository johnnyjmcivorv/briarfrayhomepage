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

export default apiInitializer((api) => {
  function applyRouteBehavior() {
    const path = window.location.pathname;
    const isHome = path === "/";
    const isLatest = path === "/latest"; // keep it strict since you asked specifically "latest page"

    // Keep your "hide header only on homepage" behavior consistent
    document.documentElement.classList.toggle("is-custom-home", isHome);
    document.body.classList.toggle("is-custom-home", isHome);

    // Set the header home-link destination:
    // - on /latest -> /
    // - everywhere else -> /latest
    const headerLink = findHeaderHomeLink();
    if (headerLink) {
      const target = isLatest ? "/" : "/latest";
      headerLink.setAttribute("href", target);

      // Bind click once so SPA navigation behaves nicely (no full reload)
      if (!headerLink.dataset.bfBound) {
        headerLink.dataset.bfBound = "1";
        headerLink.addEventListener("click", (e) => {
          const nowPath = window.location.pathname;
          const nowIsLatest = nowPath === "/latest";
          const dest = nowIsLatest ? "/" : "/latest";

          // allow ctrl/cmd click to open in new tab
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

          e.preventDefault();
          api.navigateTo(dest);
        });
      }
    }

    // Random image only on homepage
    if (!isHome) return;

    const img = document.getElementById("bf-home-random-img");
    if (!img) return;

    img.src = pickRandom(IMAGES);
  }

  api.onPageChange(() => {
    applyRouteBehavior();
  });

  // Run once on boot
  applyRouteBehavior();
});
