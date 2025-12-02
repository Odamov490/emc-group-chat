// EMC Group Chat – REALTIME Firebase Chat
// GitHub Pages + Firebase Realtime Database uchun to'liq front-end yechim
//---------------------------------------------------------------

// Firebase importlari
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onChildAdded,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 🔐 Parol (xohlasangiz o'zgartirasiz)
const ACCESS_PASSWORD = "emc123";

// 🚀 Firebase config – sizning loyihangizniki!
const firebaseConfig = {
  apiKey: "AIzaSyC-26n7wJh2FsSLpKhN0O3sw-xef5x8d7U",
  authDomain: "emc-group-chat.firebaseapp.com",
  databaseURL: "https://emc-group-chat-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "emc-group-chat",
  storageBucket: "emc-group-chat.appspot.com",
  messagingSenderId: "1054574540160",
  appId: "1:1054574540160:web:2b1fbe0f963ab61463d65",
  measurementId: "G-W751GMPTR"
};

// 🔌 Firebase ishga tushiriladi
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const messagesRef = ref(db, "messages");

//---------------------------------------------------------------
// DOM elementlar
//---------------------------------------------------------------
const loginScreen = document.getElementById("loginScreen");
const chatScreen = document.getElementById("chatScreen");
const nameInput = document.getElementById("nameInput");
const passwordInput = document.getElementById("passwordInput");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");
const userSubtitle = document.getElementById("userSubtitle");
const logoutBtn = document.getElementById("logoutBtn");

const messagesContainer = document.getElementById("messagesContainer");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

let currentUser = { id: null, name: null };

//---------------------------------------------------------------
// Vaqt formatlash
//---------------------------------------------------------------
function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
}

//---------------------------------------------------------------
// Xabarni ekranga chiqarish
//---------------------------------------------------------------
function renderMessage(msg) {
  const row = document.createElement("div");
  row.className = "message-row " + (msg.user_id === currentUser.id ? "me" : "other");

  if (msg.user_id !== currentUser.id) {
    const author = document.createElement("div");
    author.className = "message-author";
    author.textContent = msg.user_name;
    row.appendChild(author);
  }

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.textContent = msg.text;
  row.appendChild(bubble);

  const time = document.createElement("div");
  time.className = "message-time";
  time.textContent = formatTime(msg.created_at);
  row.appendChild(time);

  messagesContainer.appendChild(row);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

//---------------------------------------------------------------
// Xabar yuborish
//---------------------------------------------------------------
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  push(messagesRef, {
    user_id: currentUser.id,
    user_name: currentUser.name,
    text,
    created_at: Date.now(),
  });

  messageInput.value = "";
  messageInput.focus();
}

//---------------------------------------------------------------
// Realtime listener – har bir yangi xabar kelganda ishlaydi
//---------------------------------------------------------------
onChildAdded(messagesRef, (snapshot) => {
  renderMessage(snapshot.val());
});

//---------------------------------------------------------------
// Kirish funksiyasi
//---------------------------------------------------------------
function handleLogin() {
  const name = nameInput.value.trim();
  const pass = passwordInput.value.trim();

  if (!name) return (loginError.textContent = "Ismingizni kiriting.");
  if (!pass) return (loginError.textContent = "Parolni kiriting.");
  if (pass !== ACCESS_PASSWORD) {
    loginError.textContent = "Parol noto'g'ri!";
    return;
  }

  currentUser = {
    id: "user_" + name.toLowerCase().replace(/\s+/g, "_"),
    name,
  };

  sessionStorage.setItem("emc_chat_user", JSON.stringify(currentUser));
  loginScreen.classList.remove("screen-active");
  chatScreen.classList.add("screen-active");
  userSubtitle.textContent = currentUser.name + " • online";
  messageInput.focus();
}

//---------------------------------------------------------------
// Logout
//---------------------------------------------------------------
function handleLogout() {
  sessionStorage.removeItem("emc_chat_user");
  location.reload();
}

//---------------------------------------------------------------
// Eventlar
//---------------------------------------------------------------
loginBtn.addEventListener("click", handleLogin);
passwordInput.addEventListener("keydown", (e) => e.key === "Enter" && handleLogin());
sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", (e) => (e.key === "Enter" && !e.shiftKey) && (e.preventDefault(), sendMessage()));
logoutBtn.addEventListener("click", handleLogout);

//---------------------------------------------------------------
// Avto-login
//---------------------------------------------------------------
const savedUser = sessionStorage.getItem("emc_chat_user");
if (savedUser) {
  currentUser = JSON.parse(savedUser);
  loginScreen.classList.remove("screen-active");
  chatScreen.classList.add("screen-active");
  userSubtitle.textContent = currentUser.name + " • online";
} else {
  loginScreen.classList.add("screen-active");
}
