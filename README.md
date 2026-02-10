# LyxeNime V1 - Source Code

Thanks udah order source code-nya, bang.
Ini panduan setup biar webnya jalan lancar di server/hosting lu.

## 1. Install Dependensi
Pastikan di laptop/server udah ada **Node.js**.
Buka terminal di folder project ini, terus ketik:

```bash
npm install
```
Tunggu sampe proses download modules selesai.

## 2. Setting Config (WAJIB DIISI)
Karena ini file bersih (clean), ada beberapa file yang wajib diisi manual biar connect ke database & API lu sendiri. Jangan sampai kelewat ya.

### A. Database (Firebase)
Buka file: `src/lib/firebase.js`
1. Bikin project baru di [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** (Email/Google) dan **Firestore Database**.
3. Copy config project lu, terus paste di file `firebase.js` tadi (timpa bagian yang ada tulisan `PASTE_API_KEY_DISINI`).

### B. Email Gateway (Buat OTP Register)
Buka file: `api/send-email.js`
1. Masukin email gmail & **App Password** lu.
2. *Note:* Jangan pake password login gmail biasa, harus pake App Password dari settingan Google Account Security.

### C. Ganti Domain API
Source code ini butuh API buat data Anime/Manga/Hentai.
Saya udah kasih placeholder di codingannya.
1. Buka teks editor (VS Code).
2. Tekan `Ctrl + Shift + F` (Search All).
3. Cari: `MASUKAN-API`
4. Replace semua link placeholder itu dengan domain backend/API milik lu.

### D. Google Analytics (Opsional)
Buka file: `index.html` dan `api/analytics.js`
1. Kalau mau pake tracking visitor, ganti ID `G-MASUKAN_ID_GA_KAMU` dengan ID GA4 lu sendiri.

### E. Akses Admin
Buka file: `firestore.rules` dan `src/pages/Admin.jsx`
1. Cari teks `EMAIL_ADMIN_KAMU@gmail.com`.
2. Ganti jadi email lu yang bakal dipake buat login admin.

## 3. Cara Jalanin
**Mode Dev (Localhost):**
```bash
npm run dev
```

**Build Production:**
Kalau mau upload ke Vercel/Netlify/VPS:
```bash
npm run build
```

## Catatan
- Jangan lupa set **Firestore Rules** di Firebase Console pake isi file `firestore.rules` yang ada di sini biar aman.
- Folder `bot2` gak disertakan di sini karena beda project.

Sukses terus bang project-nya! 🚀
