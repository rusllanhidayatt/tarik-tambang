<<<<<<< HEAD
# 🪢 Tarik Tambang — Quiz Multiplayer Realtime

Game quiz **multiplayer realtime** berbasis tim **Akhwat vs Ikhwan** dengan konsep **tarik tambang skor**.
Dirancang untuk dimainkan bersama (HP masing-masing) dengan **tampilan TV / proyektor** untuk skor & animasi.

> Dibuat untuk event, kajian, atau fun games berbasis sesi terbatas.

---

## ✨ Fitur Utama

* ⚡ **Realtime Multiplayer** (update skor & soal langsung)
* 🪢 **Konsep Tarik Tambang** (visual & animasi)
* 👥 **2 Tim**: Akhwat vs Ikhwan
* ⏱️ **Game Berbasis Sesi** (default 1 jam)
* 📺 **Game View untuk TV / Proyektor**
* 🔐 Login ringan (tanpa backend auth)
* 💾 Status pemain tersimpan selama sesi aktif
=======
# 🪢 TARIK TAMBANG QUIZ

### Multiplayer Realtime • Akhwat vs Ikhwan

Game quiz interaktif berbasis **realtime session** dengan konsep **tarik tambang digital**.
Setiap jawaban benar akan menarik tali ke arah tim masing-masing.

Cocok untuk:

* Acara kajian
* Games night komunitas
* Event indoor dengan layar TV / proyektor
>>>>>>> a3dcecb (Update README)

---

## 🧠 Konsep Game

<<<<<<< HEAD
1. Buka game lewat URL:

   * **Production**: `ISI_LINK_DEPLOY_KAMU`
   * **Local**: [http://localhost:3000](http://localhost:3000)

2. Masukkan **nama** (sesuai daftar di `players.ts`)

   * Bisa pakai **nama lengkap** atau **alias**

3. Setelah login → langsung masuk halaman **Play**

4. Jawab pertanyaan yang muncul:

   * ✅ **Benar** → Tim +1 poin + efek **spark**
   * ❌ **Salah** → Bunyi **boop**

5. Skor tim ditampilkan **realtime** di layar game view

6. Game berjalan dalam **satu sesi**

7. Jika pindah device / refresh:

   * Selama sesi **belum berakhir**, status masih tersimpan
   * Jika sesi berakhir → harus login ulang saat admin buka sesi baru

> Semua data login hanya disimpan di browser (`sessionStorage`)

---

## 🧭 Alur Aplikasi

| Role           | URL           | Deskripsi                     |
| -------------- | ------------- | ----------------------------- |
| Pemain         | `/`           | Login & jawab quiz            |
| Game View (TV) | `/admin`      | Tampilan tarik tambang & skor |
| Admin          | `/admin`      | Kontrol sesi & soal           |
| Datasource     | `/datasource` | Endpoint penyedia soal        |

---

## 🧑‍💻 Admin Panel

Admin mengakses halaman yang sama dengan **Game View** (`/admin`).

Fitur Admin:

* ⏱️ Set **durasi sesi**
* ▶️ **Start / Pause / End** sesi
* 📤 Push **pertanyaan** ke semua pemain
* 🔄 Reset skor & status pemain

> Role admin ditentukan dari konfigurasi di `players.ts`

---

## 🧠 Manajemen Pemain

File utama:

```ts
=======
* Pemain dibagi menjadi **2 tim**:

  * 👩 Akhwat
  * 👨 Ikhwan
* Setiap soal dijawab **secara individu**
* Jawaban benar menambah **kekuatan tim**
* Tim dengan skor terbanyak akan **menarik tali sampai garis kemenangan**

---

## 🕹️ Alur Pemain

1. Buka halaman utama (`/`)
2. Masukkan nama (harus terdaftar)
3. Tunggu admin memulai sesi
4. Jawab soal yang dikirim
5. Lihat skor & animasi di layar utama

### Efek Jawaban

| Jawaban | Efek                                    |
| ------- | --------------------------------------- |
| Benar   | +1 skor tim, animasi tarik, sound benar |
| Salah   | Sound salah                             |

---

## 🧑‍💼 Mode Admin & TV View

Admin dan TV menggunakan **endpoint yang sama**:

```
/admin
```

### Hak Admin

* Membuka & menutup sesi
* Menentukan durasi sesi
* Mengirim soal ke pemain
* Pause game
* Reset skor & status

> Admin ditentukan dari konfigurasi, bukan login khusus

---

## ⏱️ Sistem Sesi

* Game berjalan dalam **1 sesi aktif**
* Default durasi: **60 menit**
* Selama sesi aktif:

  * Pemain bisa refresh
  * Pindah device tetap aman
* Setelah sesi berakhir:

  * Semua pemain harus login ulang

Penyimpanan status menggunakan:

```
sessionStorage
```

---

## 👥 Konfigurasi Pemain

Lokasi file:

```
>>>>>>> a3dcecb (Update README)
src/config/players.ts
```

Contoh:

```ts
<<<<<<< HEAD
export const players = [
  { name: "Ahmad", alias: "ahmad", team: "ikhwan", role: "player" },
  { name: "Aisyah", alias: "aisyah", team: "akhwat", role: "player" },
  { name: "Admin", alias: "admin", role: "admin" }
]
```

Aturan:

* Nama **harus terdaftar**
* Alias opsional
* Admin ditentukan dari `role: 'admin'`

---

## 📚 Datasource Soal

Soal diambil dari endpoint:
=======
export type Player = {
  name: string
  alias?: string
  team?: 'akhwat' | 'ikhwan'
  role?: 'player' | 'admin'
}

export const players: Player[] = [
  { name: 'Fulan', team: 'ikhwan' },
  { name: 'Fulana', team: 'akhwat' },
  { name: 'Admin', role: 'admin' }
]
```

---

## 📦 Datasource Soal

Soal dikirim admin dari endpoint:

```
/datasource
```

Format soal:

```json
{
  "id": "uuid",
  "question": "Contoh pertanyaan",
  "options": ["A", "B", "C", "D"],
  "correct": "C"
}
```

Datasource bisa berupa:

* JSON statis
* API lokal
* API eksternal

---

## 🎨 Asset & Media

Semua asset diletakkan di:
>>>>>>> a3dcecb (Update README)

```
/datasource
```

Format contoh:

```json
[
  {
    "id": 1,
    "question": "Apa rukun Islam yang pertama?",
    "choices": ["Sholat", "Puasa", "Syahadat", "Zakat"],
    "answer": "Syahadat"
  }
]
=======
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

> Admin ditentukan dari konfigurasi, bukan login khusus

---

## 🔊 / 🎨 Asset

Taruh semua asset di folder:

```
<<<<<<< HEAD
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
>>>>>>> 4edbdca (feat: Revise README for clarity and detail on multiplayer quiz game features)
```

---

<<<<<<< HEAD
* API internal
* File JSON lokal
* Endpoint eksternal

---

## 🔊🎨 Asset

Semua asset disimpan di:

```txt
public/
```

<<<<<<< HEAD
Contoh:

```txt
public/
├─ sounds/
│  ├─ correct.mp3
│  └─ wrong.mp3
├─ images/
│  └─ rope.png
└─ animations/
```

---

<<<<<<< HEAD
## 🛠️ Setup Development

### 1. Install Dependency

```bash
npm install
```

### 2. Jalankan Local

```bash
npm run dev
```

Akses:

* Pemain: [http://localhost:3000](http://localhost:3000)
* Admin / TV: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 📦 Build Production

```bash
npm run build
npm run start
```

Atau deploy ke:

* Vercel
* Netlify
* Railway
* VPS

---

## 🧩 Teknologi (Contoh)

* Next.js / React
* WebSocket / Realtime state
* sessionStorage
* CSS Animation / Canvas

*(Sesuaikan dengan stack yang kamu pakai)*

---

## ⚠️ Catatan Penting

* Game **tidak pakai database**
* Semua status berbasis **sesi aktif**
* Refresh aman selama sesi berjalan
* Cocok untuk event singkat

---

## 👨‍👩‍👧‍👦 Created By

**SKS TEAM**

> Tarik tambang versi digital, biar adil & rame 🚀

---

Kalau mau:

* Mode lebih dari 2 tim
* Leaderboard
* Login QR Code
* Sound per tim
* Animasi lebih brutal 😈

👉 tinggal bilang, gas lanjut!
=======
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
>>>>>>> 4edbdca (feat: Revise README for clarity and detail on multiplayer quiz game features)
