# Tarik Tambang — Quiz Multiplayer

Game quiz **tim akhwat vs tim ikhwan** berbasis realtime & sesi terbatas.

---

## 🎮 Cara Main (Untuk Pemain)

1. Masuk ke game lewat URL utama:
   - **Production**: (isi link deploy kamu di sini)
   - **Local**: http://localhost:3000
2. Isi nama sesuai daftar yang sudah terdaftar di file `players.ts`
   - Bisa pakai **nama lengkap** atau **alias**
3. Setelah masuk → kamu langsung ke halaman **Play**
4. Jawab pertanyaan yang muncul
   - ✅ Benar → tim menang 1 poin + efek spark
   - ❌ Salah → bunyi boop
5. Skor tim ditampilkan **realtime** di tampilan game
6. Game berjalan dalam **sesi** (default: 1 jam)
7. Kalau pindah device/login lagi:
   - Selama sesi **belum habis**, status tetap tersimpan
   - Kalau sesi habis → harus login ulang saat admin buka sesi baru

> Semua data login **hanya disimpan di browser** (`sessionStorage`)

---

## 🧩 Alur Aplikasi

| Role           | URL                                | Fitur                                 |
| -------------- | ---------------------------------- | ------------------------------------- |
| Pemain         | `/`                                | Login nama → main quiz                |
| Game View (TV) | `/admin`                           | Tampilan animasi tarik tambang & skor |
| Admin          | `/admin`                           | Kelola sesi, kontrol soal, reset, dsb |
| Datasource     | `/datasource` atau custom endpoint | Menyediakan daftar pertanyaan         |

---

## 🧑‍💻 Admin Panel (Sederhana)

- Set **durasi sesi**
- Push **pertanyaan** ke semua pemain
- **Start / Pause / End** sesi
- Reset skor & status pemain

> Admin login juga pakai nama yang ada di `players.ts` (role admin ditentukan dari config)

---

## 🔊 / 🎨 Asset

Taruh semua asset di folder:

```txt
public/


Created By SKSTEAM