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
