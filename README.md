# Tarik Tambang — Quiz Multiplayer

Game quiz **tim merah vs tim biru** berbasis realtime & sesi terbatas.

---

## 🎮 Cara Main (Untuk Pemain)

1. Masuk ke game lewat URL utama:

   > [https://domainkamu.com](https://domainkamu.com)
2. Isi nama sesuai daftar yang sudah terdaftar di file `players.ts`

   * Bisa pakai **nama lengkap** atau **alias**
3. Setelah masuk → kamu langsung ke halaman **Play**
4. Jawab pertanyaan yang muncul

   * ✅ Benar → tim menang 1 poin + efek spark
   * ❌ Salah → bunyi boop
5. Skor tim ditampilkan **realtime** di tampilan game
6. Game berjalan dalam **sesi** (default: 1 jam)
7. Kalau pindah device/login lagi:

   * Selama sesi **belum habis**, status tetap tersimpan
   * Kalau sesi habis → harus login ulang saat admin buka sesi baru

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

* Set **durasi sesi**
* Push **pertanyaan** ke semua pemain
* **Start / Pause / End** sesi
* Reset skor & status pemain

> Admin login juga pakai nama yang ada di `players.ts` (role admin ditentukan dari config)

---

## 🔊 / 🎨 Asset

Taruh semua asset di folder:

```
public/
```

### ✅ Sudah dipakai

* `boy.png`
* `girl.png`

### 📌 Tambahan Sound Effect

```
/public/sfx/point.wav   → efek poin + spark
/public/sfx/wrong.wav   → efek jawaban salah (boop)
/public/sfx/win.mp3     → efek kemenangan / fanfare
```

> Boleh pakai **placeholder** terlebih dahulu (durasi 1 detik)

---

## 🧱 Struktur Utama Project

```
src/
 ├── app/
 │    ├── page.tsx          → halaman login pemain
 │    ├── play/page.tsx     → gameplay & animasi tarik tambang
 │    └── admin/page.tsx    → admin panel
 │
 ├── utils/players.ts       → daftar pemain (nama & tim)
 └── utils/data.ts          → sumber pertanyaan (opsional API)
```

---

## 🌐 State & Persistensi

Login pemain disimpan melalui:

```
sessionStorage.tt_session
```

Berisi:

```json
{
  "name": "Nama Pemain",
  "team": "red|blue",
  "lastActivity": 1731056183929
}
```

---

## 🧪 Testing Cepat

| Uji                  | Harus Berhasil                 |
| -------------------- | ------------------------------ |
| Nama tidak terdaftar | Tidak bisa masuk               |
| Alias sesuai         | Bisa masuk sebagai nama utama  |
| Berpindah device     | Tetap bisa selama sesi aktif   |
| Jawab salah/benar    | Ada suara + animasi efek       |
| Admin end session    | Semua pemain harus login ulang |

---

## 🏆 Kemenangan

* Tim pertama yang mencapai **target poin**, atau
* Poin tertinggi ketika **sesi selesai**

> Kemenangan → mainkan **win.mp3** + animasi celebration

---

## ⚠️ Catatan Teknis

| Hal                       | Status                     |
| ------------------------- | -------------------------- |
| Multiplayer Full Realtime | ✅ Poin & progress serentak |
| Tanpa akun/password       | ✅ Anti ribet               |
| Session-based             | ✅ Anti spam join           |
| Anti cheat dasar          | ✅ Validasi nama whitelist  |

---

## 💡 Wishlist Next Update

* Leaderboard historis
* Animasi reaksi avatar
* Efek getar HP saat poin masuk
* Integrasi API pertanyaan
* Custom nickname + avatar pilihan

---

## Catatan asset (taruh di public/)
   * /boy.png (existing)
   * /girl.png (existing)
   * /sfx/point.wav — suara poin + spark
   * /sfx/wrong.wav — suara salah (boop)
   * /sfx/win.mp3 — suara kemenangan / fanfare
Kalau belum punya sound, bisa pakai placeholder short mp3/wav (1s).
Nama file harus sama seperti di atas.