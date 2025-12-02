// EMC Group Chat – front-end only (GitHub Pages friendly)
// Eslatma: Xabarlar faqat brauzer localStorage ichida saqlanadi.
// Real guruh chat uchun keyinchalik backend (server) qo'shish kerak bo'ladi.

(function () {
  const ACCESS_PASSWORD = "emc123"; // 👉 Parolni shu yerdan o'zgartirasiz
  const STORAGE_KEY_MESSAGES = "emc_group_messages_v1";

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

  function loadMessages() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_MESSAGES);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      console.error("Xabarlarni o'qishda xato:", e);
      return [];
    }
  }

  function saveMessages(list) {
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(list));
  }

  function formatTime(dateStr) {
    const d = new Date(dateStr);
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    return hh + ":" + mm;
  }

  function renderMessages() {
    const messages = loadMessages();
    messagesContainer.innerHTML = "";

    messages.forEach((m) => {
      const row = document.createElement("div");
      row.className =
        "message-row " + (m.user_id === currentUser.id ? "me" : "other");

      if (m.user_id !== currentUser.id) {
        const author = document.createElement("div");
        author.className = "message-author";
        author.textContent = m.user_name || "Foydalanuvchi";
        row.appendChild(author);
      }

      const bubble = document.createElement("div");
      bubble.className = "message-bubble";
      bubble.textContent = m.text;
      row.appendChild(bubble);

      const time = document.createElement("div");
      time.className = "message-time";
      time.textContent = formatTime(m.created_at);
      row.appendChild(time);

      messagesContainer.appendChild(row);
    });

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function addMessage(text) {
    const messages = loadMessages();
    const msg = {
      id: Date.now().toString(),
      user_id: currentUser.id,
      user_name: currentUser.name,
      text,
      created_at: new Date().toISOString(),
    };
    messages.push(msg);
    saveMessages(messages);
    renderMessages();
  }

  function showScreen(which) {
    if (which === "login") {
      loginScreen.classList.add("screen-active");
      chatScreen.classList.remove("screen-active");
    } else {
      chatScreen.classList.add("screen-active");
      loginScreen.classList.remove("screen-active");
    }
  }

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
    renderMessages();
    messageInput.focus();
  }

  function handleLogout() {
    sessionStorage.removeItem("emc_chat_user");
    currentUser = { id: null, name: null };
    showScreen("login");
  }

  loginBtn.addEventListener("click", handleLogin);
  passwordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLogin();
    }
  });

  sendBtn.addEventListener("click", () => {
    const text = messageInput.value.trim();
    if (!text) return;
    addMessage(text);
    messageInput.value = "";
    messageInput.focus();
  });

  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendBtn.click();
    }
  });

  logoutBtn.addEventListener("click", handleLogout);

  const savedUser = sessionStorage.getItem("emc_chat_user");
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      if (currentUser && currentUser.id && currentUser.name) {
        userSubtitle.textContent = currentUser.name + " • online";
        showScreen("chat");
        renderMessages();
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
})();
