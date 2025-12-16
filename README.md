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
```

Datasource bisa berupa:

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
=======
Struktur contoh:

```
public/
├─ audio/
│  ├─ correct.mp3
│  └─ wrong.mp3
├─ visual/
│  ├─ rope.png
│  └─ background.jpg
└─ fx/
>>>>>>> a3dcecb (Update README)
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
## ⚙️ Development

```bash
npm install
npm run dev
```

Akses:

* Pemain → [http://localhost:3000](http://localhost:3000)
* Admin / TV → [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 🚀 Deployment

Build production:

```bash
npm run build
npm start
```

Direkomendasikan:

* Vercel
* Netlify
* Railway

---

## 🧩 Catatan Teknis

* Tidak menggunakan database
* Semua state berbasis memory & session
* Realtime menggunakan event broadcast
* Fokus untuk **short-lived event**

---

## 🧑‍🤝‍🧑 Tim Pengembang

**SKS TEAM**

"Tarikannya digital, serunya real." 🔥

---

### Next Improvement (Opsional)

* Mode 3+ tim
* Ranking individu
* QR Code login
* Mode knock-out
* Tema visual custom

> Pull request & ide sangat diterima ✨
>>>>>>> a3dcecb (Update README)
