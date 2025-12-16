# 🪢 TARIK TAMBANG QUIZ

### Multiplayer Realtime • Akhwat vs Ikhwan

Game quiz interaktif berbasis **realtime session** dengan konsep **tarik tambang digital**.
Setiap jawaban benar akan menarik tali ke arah tim masing-masing.

Cocok untuk:

* Acara kajian
* Games night komunitas
* Event indoor dengan layar TV / proyektor

---

## 🧠 Konsep Game

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
src/config/players.ts
```

Contoh:

```ts
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

```
public/
```

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
```

---

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