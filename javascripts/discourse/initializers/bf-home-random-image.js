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
  api.onPageChange((url) => {
    const isHome = url === "/";

    // Toggle body class
    document.body.classList.toggle("is-custom-home", isHome);

    // Random image logic
    if (!isHome) return;

    const img = document.getElementById("bf-home-random-img");
    if (!img) return;

    const pick = IMAGES[Math.floor(Math.random() * IMAGES.length)];
    img.src = pick;
  });
});
