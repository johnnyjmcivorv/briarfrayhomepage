import { apiInitializer } from "discourse/lib/api";

const IMAGES = [
  "https://i.imgur.com/QopcbDo.jpg",
  "https://i.imgur.com/RQEMEV6.jpg",
  "https://i.imgur.com/Yza7azn.png",
  "https://i.imgur.com/xN1oJK2.gif",
  "https://i.imgur.com/iIVkzqo.png",
  "https://i.imgur.com/9eGxskv.jpg",
];

export default apiInitializer((api) => {
  api.onPageChange(() => {
    // Reliable homepage detection (doesn't depend on Discourse's url arg)
    const isHome = window.location.pathname === "/";

    // CRITICAL: toggle on BOTH html and body so it never "sticks"
    document.documentElement.classList.toggle("is-custom-home", isHome);
    document.body.classList.toggle("is-custom-home", isHome);

    // Random image only on homepage
    if (!isHome) return;

    const img = document.getElementById("bf-home-random-img");
    if (!img) return;

    const pick = IMAGES[Math.floor(Math.random() * IMAGES.length)];
    img.src = pick;
  });
});
