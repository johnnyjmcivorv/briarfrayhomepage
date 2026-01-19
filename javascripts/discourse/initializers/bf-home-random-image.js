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

// Wait for the homepage img element to exist (SPA timing)
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

// Add bf-img-ready in a way that reliably triggers CSS transitions
function addReadyWithPaint(homeEl) {
  requestAnimationFrame(() => {
    // force a style flush so the browser "commits" the hidden state first
    if (homeEl) void homeEl.offsetHeight;

    requestAnimationFrame(() => {
      document.documentElement.classList.add("bf-img-ready");
    });
  });
}

let homeLoadToken = 0;

async function startHomepageLoad() {
  const token = ++homeLoadToken;

  // IMPORTANT: clear ready immediately on entering home (not later)
  document.documentElement.classList.remove("bf-img-ready");

  // force a flush right away so the hidden state is real
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
    addReadyWithPaint(homeEl);
  };

  img.onload = finish;
  img.onerror = finish;

  img.src = nextSrc;

  // Cached image case: sometimes load won't fire; treat it as loaded
  if (img.complete && img.naturalWidth > 0) {
    finish();
  }
}

export default apiInitializer((api) => {
  function applyRouteBehavior() {
    const path = window.location.pathname;
    const isHome = path === "/";
    const isLatest = path === "/latest";

    document.documentElement.classList.toggle("is-custom-home", isHome);
    document.body.classList.toggle("is-custom-home", isHome);

    // leaving home: clear ready so it never "sticks"
    if (!isHome) {
      document.documentElement.classList.remove("bf-img-ready");
      homeLoadToken += 1; // cancel any in-flight home load
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
      startHomepageLoad();
    }
  }

  api.onPageChange(() => applyRouteBehavior());
  applyRouteBehavior();
});
