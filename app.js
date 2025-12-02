// EMC Group Chat – REALTIME Firebase Chat (per-user login + password)

//---------------------------------------------------------------
// Firebase importlari
//---------------------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onChildAdded,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

//---------------------------------------------------------------
// Xodimlar ro'yxati (LOGIN + PAROL + ko'rsatiladigan ism)
// login – foydalanuvchi kiritadigan "login"
// password – parol
// displayName – chatda ko'rinadigan ism
//---------------------------------------------------------------
const USERS = {
  // login: { password: "...", displayName: "..." }
  "Davron": {
    password: "1234",
    displayName: "Davron Abdurashidov",
  },
  "Xushnudbek": {
    password: "5678",
    displayName: "Xushnudbek Reimbayev",
  },
  "Odamov": {
    password: "9012",
    displayName: "G'ulomjon Odamov",
  },
  // ⬆️ Xohlagancha qo'shasiz:
  // "login": { password: "parol", displayName: "To'liq ism" }
};

//---------------------------------------------------------------
// Firebase config – sizning project'ingiz
//---------------------------------------------------------------
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

// Firebase ishga tushirish
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const messagesRef = ref(db, "messages");

//---------------------------------------------------------------
// DOM elementlar
//---------------------------------------------------------------
const loginScreen = document.getElementById("loginScreen");
const chatScreen = document.getElementById("chatScreen");

const nameInput = document.getElementById("nameInput");        // LOGIN kiriladigan joy
const passwordInput = document.getElementById("passwordInput"); // PAROL kiriladigan joy
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");
const userSubtitle = document.getElementById("userSubtitle");
const logoutBtn = document.getElementById("logoutBtn");

const messagesContainer = document.getElementById("messagesContainer");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

let currentUser = { id: null, name: null };

//---------------------------------------------------------------
// Yordamchi funksiyalar
//---------------------------------------------------------------
function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
}

function showLoginScreen() {
  loginScreen.classList.add("screen-active");
  chatScreen.classList.remove("screen-active");
}

function showChatScreen() {
  chatScreen.classList.add("screen-active");
  loginScreen.classList.remove("screen-active");
}

//---------------------------------------------------------------
// Xabarni ekranga chizish
//---------------------------------------------------------------
function renderMessage(msg) {
  const row = document.createElement("div");
  row.className = "message-row " + (msg.user_id === currentUser.id ? "me" : "other");

  if (msg.user_id !== currentUser.id) {
    const author = document.createElement("div");
    author.className = "message-author";
    author.textContent = msg.user_name || "Foydalanuvchi";
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
  if (!text || !currentUser.id) return;

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
// Firebase – real-time listener
//---------------------------------------------------------------
onChildAdded(messagesRef, (snapshot) => {
  const value = snapshot.val();
  if (!value) return;
  renderMessage(value);
});

//---------------------------------------------------------------
// LOGIN – har xodim uchun login + parol
//---------------------------------------------------------------
function handleLogin() {
  const login = nameInput.value.trim().toLowerCase(); // login
  const pass = passwordInput.value.trim();            // parol

  if (!login) {
    loginError.textContent = "Login kiriting.";
    return;
  }
  if (!pass) {
    loginError.textContent = "Parol kiriting.";
    return;
  }

  const user = USERS[login];
  if (!user) {
    loginError.textContent = "Bunday login topilmadi.";
    return;
  }
  if (user.password !== pass) {
    loginError.textContent = "Parol noto'g'ri.";
    return;
  }

  // Muvaffaqiyatli login
  currentUser = {
    id: login,                  // unique ID sifatida login
    name: user.displayName,     // chatda ko'rinadigan ism
  };

  sessionStorage.setItem("emc_chat_user", JSON.stringify(currentUser));
  loginError.textContent = "";
  nameInput.value = "";
  passwordInput.value = "";

  userSubtitle.textContent = currentUser.name + " • online";
  showChatScreen();
  messageInput.focus();
}

//---------------------------------------------------------------
// Logout
//---------------------------------------------------------------
function handleLogout() {
  sessionStorage.removeItem("emc_chat_user");
  currentUser = { id: null, name: null };
  showLoginScreen();
}

//---------------------------------------------------------------
// Eventlar
//---------------------------------------------------------------
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

//---------------------------------------------------------------
// Sahifa ochilganda session'dan foydalanuvchini tiklash
//---------------------------------------------------------------
const savedUser = sessionStorage.getItem("emc_chat_user");
if (savedUser) {
  try {
    currentUser = JSON.parse(savedUser);
    if (currentUser && currentUser.id && currentUser.name) {
      userSubtitle.textContent = currentUser.name + " • online";
      showChatScreen();
    } else {
      showLoginScreen();
    }
  } catch (e) {
    console.error("User parse xato:", e);
    showLoginScreen();
  }
} else {
  showLoginScreen();
}
