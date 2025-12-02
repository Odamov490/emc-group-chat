# EMC Group Chat – GitHub Pages uchun oddiy yopiq guruh sahifa

Bu kichik loyiha faqat **front-end (HTML + CSS + JS)** dan iborat bo'lib,
GitHub Pages yoki oddiy static hostingga yuklash uchun tayyorlangan.

- Sahifa ochilganda avval **parol va ism** so'raydi.
- To'g'ri parol kiritsangiz, yopiq "guruh chat" interfeysi ochiladi.
- Xabarlar **brauzer localStorage** ga saqlanadi (faqat shu qurilmada ko'rinadi).
- Real ko'p foydalanuvchili chat qilish uchun keyinchalik server (backend) qo'shish kerak bo'ladi.

## Parolni o'zgartirish

`app.js` faylida:

```js
const ACCESS_PASSWORD = "emc123"; // 👉 Parolni shu yerdan o'zgartirasiz
```

shu qiymatni o'zingiz xohlagan parolga almashtiring.

## GitHub Pages ga yuklash

1. GitHub'da yangi repo yarating, masalan: `emc-group-chat`
2. Shu fayllarni (`index.html`, `styles.css`, `app.js`) repoga yuklang.
3. GitHub'da **Settings → Pages** bo'limidan `Deploy from branch` ni yoqing
   va `main` branch + `root` katalogini tanlang.
4. GitHub Pages sizga shunday link beradi:

   ```
   https://username.github.io/emc-group-chat/
   ```

5. Endi shu URL'ni Telegram botdagi `WEBAPP_URL` sifatida ishlatishingiz mumkin.

## Telegram Mini App sifatida ishlatish

Keyinchalik Telegram bot kodingizda:

```python
WEBAPP_URL = "https://username.github.io/emc-group-chat/"
```

deb ko'rsatib qo'ysangiz, bot tugmasi bosilganda shu sahifa Telegram ichida ochiladi.
