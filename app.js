// EMC Group Chat – REAL-TIME (Firebase Realtime Database)
// GitHub Pages uchun front-end-only yechim

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onChildAdded,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// 🔹 Firebase config – sizning project'ingizniki
const firebaseConfig = {
  apiKey: "AIzaSyC-26n7wJh2FsSLpKhN0O3sw-xef5x8d7U",
  authDomain: "emc-group-chat.firebaseapp.com",
  databaseURL: "https://emc-group-chat-default-rtdb.firebaseio.com",
  projectId: "emc-group-chat",
  storageBucket: "emc-group-chat.appspot.com",
  messagingSenderId: "1054574540160",
  appId: "1:1054574540160:web:2b1fbe0f963ab61463d65",
  measurementId: "G-W751GMPTR"
};

// 🔹 Parol (xohlagancha o'zgartirasiz)
const ACCESS_PASSWORD = "emc123";

// Firebase init
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const messagesRef = ref(db, "messages"); // bitta umumiy guruh

// DOM elementlar
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

let currentUser = {
  id: null,
  name: null,
};

// Ekranlarni almashtirish
function showScreen(which) {
  if (which === "login") {
    loginScreen.classList.add("screen-active");
    chatScreen.classList.remove("screen-active");
  } else {
    chatScreen.classList.add("screen-active");
    loginScreen.classList.remove("screen-active");
  }
}

// Xabar cardini chizish
function appendMessage(m) {
  const row = document.createElement("div");
  row.className =
    "message-row " + (m.userId === currentUser.id ? "me" : "other");

  if (m.userId !== currentUser.id) {
    const author = document.createElement("div");
    author.className = "message-author";
    author.textContent = m.userName || "Foydalanuvchi";
    row.appendChild(author);
  }

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.textContent = m.text;
  row.appendChild(bubble);

  const time = document.createElement("div");
  time.className = "message-time";

  if (m.createdAt) {
    const d = new Date(m.createdAt);
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    time.textContent = hh + ":" + mm;
  } else {
    time.textContent = "";
  }

  row.appendChild(time);

  messagesContainer.appendChild(row);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Login
function handleLogin() {
  const name = nameInput.value.trim();
  const pass = passwordInput.value.trim();

  if (!name) {
    loginError.textContent = "Ismingizni kiriting.";
    return;
  }
  if (!pass) {
    loginError.textContent = "Parolni kiriting.";
    return;
  }
  if (pass !== ACCESS_PASSWORD) {
    loginError.textContent = "Parol noto'g'ri.";
    passwordInput.value = "";
    passwordInput.focus();
    return;
  }

  currentUser = {
    id: "user_" + name.toLowerCase().replace(/\s+/g, "_"),
    name,
  };

  sessionStorage.setItem("emc_chat_user", JSON.stringify(currentUser));
  loginError.textContent = "";
  nameInput.value = "";
  passwordInput.value = "";

  userSubtitle.textContent = currentUser.name + " • online";
  showScreen("chat");
  messageInput.focus();
}

// Logout
function handleLogout() {
  sessionStorage.removeItem("emc_chat_user");
  currentUser = { id: null, name: null };
  showScreen("login");
}

// Xabar yuborish
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || !currentUser.id) return;

  // Firebase Realtime Database'ga push qilamiz
  push(messagesRef, {
    userId: currentUser.id,
    userName: currentUser.name,
    text,
    createdAt: new Date().toISOString(),
  });

  messageInput.value = "";
  messageInput.focus();
}

// EVENTLAR
loginBtn.addEventListener("click", handleLogin);
passwordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleLogin();
  }
});

sendBtn.addEventListener("click", sendMessage);

messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

logoutBtn.addEventListener("click", handleLogout);

// 🔴 Realtime listener – har bir yangi xabar kelganda ishlaydi
onChildAdded(messagesRef, (snapshot) => {
  const value = snapshot.val();
  if (!value) return;

  appendMessage({
    userId: value.userId,
    userName: value.userName,
    text: value.text,
    createdAt: value.createdAt,
  });
});

// Session'dagi userni tiklash
const savedUser = sessionStorage.getItem("emc_chat_user");
if (savedUser) {
  try {
    currentUser = JSON.parse(savedUser);
    if (currentUser && currentUser.id && currentUser.name) {
      userSubtitle.textContent = currentUser.name + " • online";
      showScreen("chat");
    } else {
      showScreen("login");
    }
  } catch (e) {
    console.error("User parse xato:", e);
    showScreen("login");
  }
} else {
  showScreen("login");
}
