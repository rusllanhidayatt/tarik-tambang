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
src/config/players.ts
```

Contoh:

```ts
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
=======
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

>>>>>>> ba08fa8 (Update README)
## 🧪 Testing Cepat

| Uji                  | Harus Berhasil                 |
| -------------------- | ------------------------------ |
| Nama tidak terdaftar | Tidak bisa masuk               |
| Alias sesuai         | Bisa masuk sebagai nama utama  |
| Berpindah device     | Tetap bisa selama sesi aktif   |
| Jawab salah/benar    | Ada suara + animasi efek       |
| Admin end session    | Semua pemain harus login ulang |

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

## Catatan asset (taruh di public/)
   * /boy.png (existing)
   * /girl.png (existing)
   * /sfx/point.wav — suara poin + spark
   * /sfx/wrong.wav — suara salah (boop)
   * /sfx/win.mp3 — suara kemenangan / fanfare
Kalau belum punya sound, bisa pakai placeholder short mp3/wav (1s).
