// EMC Group Chat – REALTIME Firebase Chat (per-user login + advanced actions)

//---------------------------------------------------------------
// Firebase importlari
//---------------------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  set,
  onValue,
  update,
  remove,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

//---------------------------------------------------------------
// Xodimlar ro'yxati (LOGIN + PAROL + ko'rsatiladigan ism)
// login – foydalanuvchi kiritadigan "login" (hammasi kichik harf)
// password – parol
// displayName – chatda ko'rinadigan ism
//---------------------------------------------------------------
const USERS = {
  "davron": {
    password: "1234",
    displayName: "Davron Abdurashidov",
  },
  "xushnudbek": {
    password: "1234",
    displayName: "Xushnudbek Reimbayev",
  },
  "odamov": {
    password: "1234",
    displayName: "G'ulomjon Odamov",
  },
  // "tillayev": { password: "9999", displayName: "Anvar Tillayev" },
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
const pinnedRef = ref(db, "pinned"); // bitta umumiy pinlangan xabar

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
const inputBar = document.querySelector(".input-bar");

// Reply / edit preview (JS orqali yaratamiz)
const replyPreview = document.createElement("div");
replyPreview.id = "replyPreview";
replyPreview.className = "reply-preview";
replyPreview.style.display = "none";
replyPreview.textContent = "";
inputBar.insertBefore(replyPreview, messageInput);

// Pin panel (JS orqali yaratamiz)
const pinnedBar = document.createElement("div");
pinnedBar.id = "pinnedBar";
pinnedBar.className = "pinned-bar";
pinnedBar.style.display = "none";
pinnedBar.textContent = "";
chatScreen.insertBefore(pinnedBar, messagesContainer);

//---------------------------------------------------------------
// Holat (state)
//---------------------------------------------------------------
let currentUser = { id: null, name: null };
let editingKey = null;              // qaysi xabar tahrirlanmoqda
let replyingTo = null;              // qaysi xabarga reply yozilmoqda
const messagesCache = {};           // key -> xabar obyekti

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

function clearReplyEditState() {
  editingKey = null;
  replyingTo = null;
  replyPreview.style.display = "none";
  replyPreview.textContent = "";
}

// Reply/ edit preview matnini ko'rsatish
function showPreview(type, msg) {
  let label = "";
  if (type === "reply") {
    label = `Javob: ${msg.user_name} — `;
  } else if (type === "edit") {
    label = "Tahrirlash: ";
  }
  const shortText = (msg.text || "").slice(0, 80);
  replyPreview.textContent = label + shortText;
  replyPreview.style.display = "block";
}

// Reply/ editni bekor qilish (previewga bosganda)
replyPreview.addEventListener("click", () => {
  clearReplyEditState();
});

//---------------------------------------------------------------
// Xabar elementini chizish / yangilash
//---------------------------------------------------------------
function renderMessage(key, msg) {
  messagesCache[key] = msg;

  let row = document.querySelector(`.message-row[data-key="${key}"]`);
  if (!row) {
    row = document.createElement("div");
    row.dataset.key = key;
    messagesContainer.appendChild(row);
  }

  row.className = "message-row " + (msg.user_id === currentUser.id ? "me" : "other");
  row.innerHTML = "";

  // Reply preview (agar mavjud bo'lsa)
  if (msg.reply_to) {
    const replyBlock = document.createElement("div");
    replyBlock.className = "message-reply";
    replyBlock.textContent =
      (msg.reply_to.user_name || "Foydalanuvchi") +
      ": " +
      (msg.reply_to.text || "").slice(0, 80);
    row.appendChild(replyBlock);
  }

  // Avtor (agar o'zim bo'lmasam)
  if (msg.user_id !== currentUser.id) {
    const author = document.createElement("div");
    author.className = "message-author";
    author.textContent = msg.user_name || "Foydalanuvchi";
    row.appendChild(author);
  }

  // Asosiy xabar pufagi
  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.textContent = msg.text;
  row.appendChild(bubble);

  // Vaqt va "tahrirlangan" label
  const time = document.createElement("div");
  time.className = "message-time";
  let timeText = formatTime(msg.created_at);
  if (msg.edited_at) {
    timeText += " • tahrirlangan";
  }
  time.textContent = timeText;
  row.appendChild(time);

  // Action tugmalar
  const actions = document.createElement("div");
  actions.className = "message-actions";

  function makeAction(label, action) {
    const btn = document.createElement("button");
    btn.className = "msg-action";
    btn.dataset.action = action;
    btn.type = "button";
    btn.textContent = label;
    return btn;
  }

  // Faqat o'zimning xabarlarim uchun: tahrirlash / o'chirish
  if (msg.user_id === currentUser.id) {
    actions.appendChild(makeAction("Tahrirlash", "edit"));
    actions.appendChild(makeAction("O'chirish", "delete"));
  }

  // Hamma uchun: reply / pin
  actions.appendChild(makeAction("Javob", "reply"));
  actions.appendChild(makeAction("Pin", "pin"));

  row.appendChild(actions);

  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// DOMdan xabarni o'chirish
function removeMessageElement(key) {
  delete messagesCache[key];
  const row = document.querySelector(`.message-row[data-key="${key}"]`);
  if (row) row.remove();
}

//---------------------------------------------------------------
// Xabar yuborish
//---------------------------------------------------------------
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || !currentUser.id) return;

  // Agar tahrirlash rejimi bo'lsa – mavjud xabarni yangilaymiz
  if (editingKey) {
    const msgRef = ref(db, `messages/${editingKey}`);
    update(msgRef, {
      text,
      edited_at: Date.now(),
    });
    messageInput.value = "";
    clearReplyEditState();
    return;
  }

  // Yangi xabar
  const msgData = {
    user_id: currentUser.id,
    user_name: currentUser.name,
    text,
    created_at: Date.now(),
  };

  // Agar reply bo'lsa
  if (replyingTo) {
    msgData.reply_to = {
      key: replyingTo.key,
      user_id: replyingTo.user_id,
      user_name: replyingTo.user_name,
      text: replyingTo.text,
    };
  }

  push(messagesRef, msgData);

  messageInput.value = "";
  clearReplyEditState();
  messageInput.focus();
}

//---------------------------------------------------------------
// Firebase – real-time listenerlar
//---------------------------------------------------------------
onChildAdded(messagesRef, (snapshot) => {
  const val = snapshot.val();
  if (!val) return;
  renderMessage(snapshot.key, val);
});

onChildChanged(messagesRef, (snapshot) => {
  const val = snapshot.val();
  if (!val) return;
  renderMessage(snapshot.key, val);
});

onChildRemoved(messagesRef, (snapshot) => {
  removeMessageElement(snapshot.key);
});

// Pinlangan xabarni kuzatish
onValue(pinnedRef, (snapshot) => {
  const data = snapshot.val();
  if (!data) {
    pinnedBar.style.display = "none";
    pinnedBar.textContent = "";
    pinnedBar.dataset.key = "";
    return;
  }

  pinnedBar.style.display = "block";
  pinnedBar.dataset.key = data.key || "";
  const shortText = (data.text || "").slice(0, 100);
  pinnedBar.textContent = `📌 ${data.user_name || ""}: ${shortText}`;
});

// Pin bannerni bosganda — o‘sha xabarga scroll
pinnedBar.addEventListener("click", () => {
  const key = pinnedBar.dataset.key;
  if (!key) return;
  const row = document.querySelector(`.message-row[data-key="${key}"]`);
  if (row) {
    row.scrollIntoView({ behavior: "smooth", block: "center" });
    row.classList.add("pinned-highlight");
    setTimeout(() => row.classList.remove("pinned-highlight"), 1500);
  }
});

//---------------------------------------------------------------
// Xabar ichidagi action tugmalar: edit / delete / reply / pin
//---------------------------------------------------------------
messagesContainer.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const action = btn.dataset.action;
  const row = btn.closest(".message-row");
  if (!row) return;

  const key = row.dataset.key;
  const msg = messagesCache[key];
  if (!msg) return;

  if (action === "edit") {
    if (msg.user_id !== currentUser.id) return;
    editingKey = key;
    replyingTo = null;
    messageInput.value = msg.text;
    showPreview("edit", msg);
    messageInput.focus();
  }

  if (action === "delete") {
    if (msg.user_id !== currentUser.id) return;
    const ok = confirm("Xabarni o'chirishni xohlaysizmi?");
    if (!ok) return;
    const msgRef = ref(db, `messages/${key}`);
    remove(msgRef);
    if (editingKey === key || (replyingTo && replyingTo.key === key)) {
      clearReplyEditState();
    }
  }

  if (action === "reply") {
    replyingTo = {
      key,
      user_id: msg.user_id,
      user_name: msg.user_name,
      text: msg.text,
    };
    editingKey = null;
    showPreview("reply", msg);
    messageInput.focus();
  }

  if (action === "pin") {
    // Hozircha har kim pin qila oladi (xohlasak faqat adminlar uchun qilamiz)
    set(pinnedRef, {
      key,
      user_id: msg.user_id,
      user_name: msg.user_name,
      text: msg.text,
    });
  }
});

//---------------------------------------------------------------
// LOGIN – har xodim uchun login + parol
//---------------------------------------------------------------
function handleLogin() {
  const loginRaw = nameInput.value.trim();
  const login = loginRaw.toLowerCase();
  const pass = passwordInput.value.trim();

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

  currentUser = {
    id: login,
    name: user.displayName,
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
  clearReplyEditState();
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
