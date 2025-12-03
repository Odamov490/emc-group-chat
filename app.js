// EMC Group Chat – REALTIME Firebase Chat
// Login + parol + rasm + reply + edit + delete + pin

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
  remove,
  update,
  onValue,
  set,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

//---------------------------------------------------------------
// Xodimlar ro'yxati (LOGIN + PAROL + ko'rsatiladigan ism)
//---------------------------------------------------------------
const USERS = {
  davron: {
    password: "1234",
    displayName: "Davron Abdurashidov",
  },
  xushnudbek: {
    password: "1234",
    displayName: "Xushnudbek Reimbayev",
  },
  odamov: {
    password: "1234",
    displayName: "G'ulomjon Odamov",
  },
  // xohlaganingizcha qo'shing:
  // login: { password: "parol", displayName: "To'liq ism" }
};

//---------------------------------------------------------------
// Firebase config – sizning project'ingiz
//---------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyC-26n7wJh2FsSLpKhN0O3sw-xef5x8d7U",
  authDomain: "emc-group-chat.firebaseapp.com",
  databaseURL:
    "https://emc-group-chat-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "emc-group-chat",
  storageBucket: "emc-group-chat.appspot.com",
  messagingSenderId: "1054574540160",
  appId: "1:1054574540160:web:2b1fbe0f963ab61463d65",
  measurementId: "G-W751GMPTR",
};

// Firebase ishga tushirish
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const messagesRef = ref(db, "messages");
const pinnedRef = ref(db, "pinnedMessage");

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
const clearChatBtn = document.getElementById("clearChatBtn");

const messagesContainer = document.getElementById("messagesContainer");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const imageBtn = document.getElementById("imageBtn");
const imageInput = document.getElementById("imageInput");

const replyPreview = document.getElementById("replyPreview");
const pinnedBar = document.getElementById("pinnedBar");

let currentUser = { id: null, name: null };
let currentEditId = null;
let currentReply = null; // {id, author, text}
let pinnedMessageId = null;

//---------------------------------------------------------------
// Yordamchi funksiyalar
//---------------------------------------------------------------
function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function showLoginScreen() {
  loginScreen.classList.add("screen-active");
  chatScreen.classList.remove("screen-active");
}

function showChatScreen() {
  chatScreen.classList.add("screen-active");
  loginScreen.classList.remove("screen-active");
}

function shortText(str) {
  if (!str) return "";
  if (str.length <= 40) return str;
  return str.slice(0, 40) + "…";
}

function resetReplyAndEdit() {
  currentEditId = null;
  currentReply = null;
  replyPreview.style.display = "none";
  replyPreview.textContent = "";
}

replyPreview.addEventListener("click", () => {
  // reply/tahrirlashni bekor qilish
  resetReplyAndEdit();
});

// DOMda ma'lum id bo'yicha element topish
function getRowById(id) {
  return document.querySelector(`.message-row[data-id="${id}"]`);
}

// Pinned highlightni yangilash
function updatePinnedHighlight() {
  document
    .querySelectorAll(".message-row")
    .forEach((row) => row.classList.remove("pinned-highlight"));

  if (!pinnedMessageId) return;

  const row = getRowById(pinnedMessageId);
  if (row) row.classList.add("pinned-highlight");
}

// Action tugma yaratish
function createAction(label, handler) {
  const btn = document.createElement("button");
  btn.className = "msg-action";
  btn.textContent = label;
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    handler();
  });
  return btn;
}

//---------------------------------------------------------------
// Xabarni ekranga chizish (create/update)
//---------------------------------------------------------------
function renderMessage(msg, id) {
  let row = getRowById(id);
  if (!row) {
    row = document.createElement("div");
    row.dataset.id = id;
    messagesContainer.appendChild(row);
  }

  row.className =
    "message-row " + (msg.user_id === currentUser.id ? "me" : "other");
  row.innerHTML = "";

  if (msg.user_id !== currentUser.id) {
    const author = document.createElement("div");
    author.className = "message-author";
    author.textContent = msg.user_name || "Foydalanuvchi";
    row.appendChild(author);
  }

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  // Reply block (agar bor bo'lsa)
  if (msg.replyToId && msg.replyToText) {
    const replyBlock = document.createElement("div");
    replyBlock.className = "message-reply";
    replyBlock.textContent =
      (msg.replyToAuthor || "Foydalanuvchi") +
      ": " +
      shortText(msg.replyToText);
    bubble.appendChild(replyBlock);
  }

  // Matn
  if (msg.text) {
    const textNode = document.createElement("div");
    textNode.textContent = msg.text;
    bubble.appendChild(textNode);
  }

  // Rasm
  if (msg.imageData) {
    const img = document.createElement("img");
    img.src = msg.imageData;
    img.alt = "Rasm";
    img.className = "message-image";
    bubble.appendChild(img);
  }

  row.appendChild(bubble);

  const time = document.createElement("div");
  time.className = "message-time";
  time.textContent = formatTime(msg.created_at);
  row.appendChild(time);

  // Action tugmalar
  const actions = document.createElement("div");
  actions.className = "message-actions";

  // Javob
  actions.appendChild(
    createAction("Javob", () => {
      currentReply = {
        id,
        author: msg.user_name || "Foydalanuvchi",
        text: msg.text || (msg.imageData ? "[Rasm]" : ""),
      };
      currentEditId = null;
      replyPreview.style.display = "block";
      replyPreview.textContent =
        "Javob: " +
        currentReply.author +
        " – " +
        shortText(currentReply.text);
      messageInput.focus();
    })
  );

  // Faqat o'z xabarini tahrirlash / o'chirish
  if (msg.user_id === currentUser.id && !msg.imageData) {
    actions.appendChild(
      createAction("Tahrirlash", () => {
        currentEditId = id;
        currentReply = null;
        messageInput.value = msg.text || "";
        replyPreview.style.display = "block";
        replyPreview.textContent =
          "Tahrirlash rejimi. Bekor qilish uchun shu joyni bosing.";
        messageInput.focus();
      })
    );

    actions.appendChild(
      createAction("O'chirish", () => {
        const ok = confirm("Ushbu xabarni o'chirasizmi?");
        if (!ok) return;
        remove(ref(db, `messages/${id}`));
      })
    );
  }

  // Pin / Unpin (hamma uchun)
  actions.appendChild(
    createAction(pinnedMessageId === id ? "Unpin" : "Pin", () => {
      if (pinnedMessageId === id) {
        // unpin
        remove(pinnedRef);
      } else {
        set(pinnedRef, {
          id,
          text: msg.text || (msg.imageData ? "[Rasm]" : ""),
          author: msg.user_name || "Foydalanuvchi",
        });
      }
    })
  );

  row.appendChild(actions);

  updatePinnedHighlight();
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

//---------------------------------------------------------------
// Xabar yuborish (matn) – edit / reply hisobga olingan
//---------------------------------------------------------------
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text && !currentEditId) return;
  if (!currentUser.id) return;

  // Agar tahrirlash rejimi bo'lsa
  if (currentEditId) {
    update(ref(db, `messages/${currentEditId}`), {
      text,
    });
    messageInput.value = "";
    resetReplyAndEdit();
    return;
  }

  // Oddiy yangi xabar
  const payload = {
    user_id: currentUser.id,
    user_name: currentUser.name,
    text,
    imageData: null,
    created_at: Date.now(),
  };

  if (currentReply) {
    payload.replyToId = currentReply.id;
    payload.replyToAuthor = currentReply.author;
    payload.replyToText = currentReply.text;
  }

  push(messagesRef, payload);

  messageInput.value = "";
  resetReplyAndEdit();
  messageInput.focus();
}

//---------------------------------------------------------------
// Rasm tanlash va yuborish
//---------------------------------------------------------------
function handleImageSelect(event) {
  const file = event.target.files[0];
  if (!file || !currentUser.id) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const dataUrl = e.target.result;

    const payload = {
      user_id: currentUser.id,
      user_name: currentUser.name,
      text: "",
      imageData: dataUrl,
      created_at: Date.now(),
    };

    if (currentReply) {
      payload.replyToId = currentReply.id;
      payload.replyToAuthor = currentReply.author;
      payload.replyToText = currentReply.text;
    }

    push(messagesRef, payload);
    resetReplyAndEdit();
  };
  reader.readAsDataURL(file);

  imageInput.value = "";
}

//---------------------------------------------------------------
// Firebase – real-time listeners
//---------------------------------------------------------------
onChildAdded(messagesRef, (snapshot) => {
  const value = snapshot.val();
  if (!value) return;
  renderMessage(value, snapshot.key);
});

onChildChanged(messagesRef, (snapshot) => {
  const value = snapshot.val();
  if (!value) return;
  renderMessage(value, snapshot.key);
});

onChildRemoved(messagesRef, (snapshot) => {
  const row = getRowById(snapshot.key);
  if (row) row.remove();
});

// Pinned message listener
onValue(pinnedRef, (snapshot) => {
  const data = snapshot.val();
  if (!data) {
    pinnedMessageId = null;
    pinnedBar.style.display = "none";
    pinnedBar.textContent = "";
    updatePinnedHighlight();
    return;
  }

  pinnedMessageId = data.id;
  pinnedBar.style.display = "block";
  pinnedBar.textContent =
    "Pinned: " +
    (data.author || "Foydalanuvchi") +
    " – " +
    shortText(data.text || "");
  updatePinnedHighlight();
});

// Pinned barga bosilganda – xabarga scroll
pinnedBar.addEventListener("click", () => {
  if (!pinnedMessageId) return;
  const row = getRowById(pinnedMessageId);
  if (row) {
    row.scrollIntoView({ behavior: "smooth", block: "center" });
  }
});

//---------------------------------------------------------------
// LOGIN – har xodim uchun login + parol
//---------------------------------------------------------------
function handleLogin() {
  const login = nameInput.value.trim().toLowerCase();
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
  messagesContainer.innerHTML = "";
  resetReplyAndEdit();
  showLoginScreen();
}

//---------------------------------------------------------------
// Butun chat tarixini tozalash
//---------------------------------------------------------------
function handleClearChat() {
  if (!currentUser.id) return;
  const ok = confirm(
    "Butun chat tarixini tozalaysizmi? Barcha xabarlar o'chiriladi."
  );
  if (!ok) return;

  Promise.all([remove(messagesRef), remove(pinnedRef)])
    .then(() => {
      messagesContainer.innerHTML = "";
      pinnedMessageId = null;
      pinnedBar.style.display = "none";
      pinnedBar.textContent = "";
      resetReplyAndEdit();
    })
    .catch((err) => {
      console.error("Chatni tozalashda xato:", err);
      alert("Chatni tozalashda xatolik yuz berdi.");
    });
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

clearChatBtn.addEventListener("click", handleClearChat);

// Rasm yuborish tugmasi
imageBtn.addEventListener("click", () => {
  imageInput.click();
});

imageInput.addEventListener("change", handleImageSelect);

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
