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

// Wait for the homepage image element to exist (SPA timing)
function waitForHomeImage(maxFrames = 60) {
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

// Cancels in-flight homepage loads when navigating away
let homeLoadToken = 0;

export default apiInitializer((api) => {
  async function enterHomepage() {
    const token = ++homeLoadToken;

    // Force a fresh transition cycle EVERY time we enter /
    const html = document.documentElement;
    html.classList.add("bf-entering");
    html.classList.remove("bf-img-ready");

    // Force the browser to commit "opacity: 0" before we flip to ready
    const homeEl = document.querySelector(".custom-home");
    if (homeEl) void homeEl.offsetHeight;

    const img = await waitForHomeImage();
    if (!img) return;
    if (token !== homeLoadToken) return;

    // Clear old handlers
    img.onload = null;
    img.onerror = null;

    const nextSrc = pickRandom(IMAGES);

    const finish = () => {
      if (token !== homeLoadToken) return;

      // Make sure the hidden state is committed, then trigger fade
      requestAnimationFrame(() => {
        if (homeEl) void homeEl.offsetHeight;

        requestAnimationFrame(() => {
          html.classList.add("bf-img-ready");
          html.classList.remove("bf-entering");
        });
      });
    };

    img.onload = finish;
    img.onerror = finish;

    // Start loading AFTER we have entering state
    img.src = nextSrc;

    // Cached image case
    if (img.complete && img.naturalWidth > 0) {
      finish();
    }
  }

  function leaveHomepage() {
    const html = document.documentElement;
    html.classList.remove("bf-entering");
    html.classList.remove("bf-img-ready");
    homeLoadToken += 1; // cancel any in-flight enterHomepage()
  }

  function applyRouteBehavior() {
    const path = window.location.pathname;
    const isHome = path === "/";
    const isLatest = path === "/latest";

    document.documentElement.classList.toggle("is-custom-home", isHome);
    document.body.classList.toggle("is-custom-home", isHome);

    if (isHome) {
      enterHomepage();
    } else {
      leaveHomepage();
    }

    // Header home-link behavior:
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
  }

  api.onPageChange(() => applyRouteBehavior());
  applyRouteBehavior();
});
