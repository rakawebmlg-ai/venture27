# PRD — Venture 27: Programmatic Pages Generation & Marketing Site Proxy

**Dokumen:** Product Requirements Document
**Scope dokumen ini:** Design/Frontend, Requirements, Core Features, User Flow
**Di luar scope dokumen ini:** Detail teknis backend/infrastruktur (tech stack, arsitektur monorepo, deployment) — hanya disinggung sebagai konteks, tidak dibahas mendalam.

---

## 1. Latar Belakang & Tujuan

Venture 27 membutuhkan sistem yang mampu:

1. Meng-generate ribuan halaman marketing (programmatic pages) berbasis kombinasi **service × lokasi** (province/state, city, county, community) secara otomatis dari data master.
2. Menyajikan halaman-halaman tersebut ke publik melalui sebuah **Marketing Site** yang SEO-friendly dan cepat.

Sistem terdiri dari **2 aplikasi**:

| Aplikasi | Fungsi | Akses |
|---|---|---|
| **Dashboard Data Generation** | Tempat internal team upload data master, upload konten service, menjalankan proses generate, dan mengunduh hasil | Tanpa login (internal use, dianggap trusted network) |
| **Marketing Site (Proxy)** | Situs publik yang menampilkan halaman hasil generate ke pengunjung | Publik |

---

## 2. Requirements

### 2.1 Requirements Umum

- Tidak ada sistem autentikasi/login pada Dashboard (fase ini).
- Semua data master di-input melalui **upload file** (CSV untuk lokasi, ZIP berisi Markdown/HTML untuk service).
- Proses generate harus bisa berjalan sebagai **background job**, bisa **resume** jika terhenti di tengah jalan, dan bisa mengirim **notifikasi email** (jika SMTP dikonfigurasi) saat selesai.
- Hasil generate harus tersedia untuk dikonsumsi oleh Marketing Site, lengkap dengan **panduan penggunaan** setelah proses selesai.
- Marketing Site harus SEO-friendly (semantic HTML, meta tags, sitemap, robots.txt).

### 2.2 Requirements Data Master

| Data | Format | Relasi Parent | Keterangan |
|---|---|---|---|
| Services | ZIP berisi file `.md`/`.html`, nama file = `service-name.md` | – | Konten memakai variable placeholder, contoh `{{ province }}`, `{{ city }}` |
| State/Province | CSV | – | Level teratas |
| City | CSV | Province (via `slug`) | – |
| County | CSV | City (via `slug`) | – |
| Community | CSV | County (via `slug`) | – |

Catatan tambahan:
- Kolom `slug` di CSV **opsional** — jika kosong, sistem generate otomatis dan menjamin keunikan.
- Setiap jenis data harus punya **template/sample file** yang bisa diunduh sebagai acuan format.
- Variable pada markdown/HTML service harus mengacu ke **daftar variable yang predefined** (tidak bebas), dan harus tersedia **contoh markdown** sebagai referensi penulisan.

### 2.3 Requirements Hasil Generate

Setiap halaman hasil generate minimal memiliki field:

- `title`
- `slug`
- `keywords`
- `content` (hasil markdown/HTML setelah variable di-replace)
- Metadata tambahan seperlunya (mis. `service_ref`, `location_ref`, `generated_at`, `status`)

### 2.4 Requirements Sitemap & SEO

- 1 file sitemap maksimal berisi **10.000 URL**.
- Penamaan file sitemap harus deskriptif/friendly, contoh: `state-1-1000.yml`, `city-1001-2000.yml`, dst (per rentang index & per tipe entitas).
- Tersedia `robots.txt` yang disarankan otomatis, mereferensikan sitemap index.
- Halaman marketing site memakai HTML tag yang SEO friendly (heading hierarchy, meta description, canonical, structured data bila relevan).

---

## 3. Core Features

### 3.1 Dashboard Data Generation

**A. Master Data Management**
- Upload CSV untuk masing-masing: Province/State, City, County, Community.
- Validasi relasi parent-child via `slug` saat upload (mis. City wajib mereferensikan Province slug yang valid).
- Auto-generate `slug` unik bila kolom dikosongkan.
- Halaman untuk **download sample/template CSV** per jenis data.
- Preview/list data yang sudah ter-upload (jumlah baris, jenis, tanggal upload).

**B. Service Content Management**
- Upload service dalam bentuk **ZIP** berisi file `.md`/`.html` (1 file = 1 service, nama file = nama service).
- Panel referensi **daftar variable predefined** yang bisa dipakai di dalam konten (`{{ province }}`, `{{ city }}`, dll).
- **Sample markdown** yang bisa diunduh sebagai starting point penulisan konten service.
- List service yang sudah ter-upload, dengan preview isi & variable yang terdeteksi.

**C. Generation Engine (UI-facing)**
- Tombol **"Run Generation"** untuk memulai proses kombinasi service × lokasi.
- Status job: `queued → running → paused/failed → completed`.
- Kemampuan **resume** proses yang terhenti (job tidak perlu dimulai dari nol).
- Progress indicator (jumlah halaman ter-generate vs total estimasi).
- Konfigurasi notifikasi email (opsional, aktif jika SMTP di-setup).
- Setelah proses selesai:
  - Ringkasan hasil (jumlah halaman per service/lokasi, error jika ada).
  - **Instruksi/panduan** cara memakai hasil generate tersebut (mis. cara mengaksesnya dari Marketing Site, format data, dsb).

**D. History & Logs**
- Riwayat proses generate sebelumnya (waktu mulai, selesai, status, jumlah halaman).
- Log error per item (mis. row CSV invalid, variable tidak ditemukan, dsb) agar mudah di-debug.

### 3.2 Marketing Site (Proxy)

- Halaman service mengikuti desain **Figma** yang sudah disediakan klien.
- Konten halaman diambil dari hasil Data Generation (title, slug, keywords, content).
- Routing dinamis berdasarkan kombinasi service + level lokasi (province/city/county/community).
- SEO:
  - Semantic HTML, meta title/description dari field `title`/`keywords`.
  - Sitemap otomatis (chunked per 10K URL, penamaan friendly).
  - `robots.txt` yang mereferensikan sitemap.
- Halaman fallback (404 / not-found) untuk kombinasi service-lokasi yang belum ter-generate.

---

## 4. Design / Frontend

### 4.1 Dashboard Data Generation — Struktur Halaman

1. **Home / Overview**
   - Ringkasan status data master (jumlah province, city, county, community, service).
   - Ringkasan proses generate terakhir (status, waktu, jumlah halaman).
2. **Master Data**
   - Tab per entitas: Province, City, County, Community.
   - Tombol Upload CSV + tombol Download Sample.
   - Tabel data ter-upload (searchable/paginated), kolom: name, slug, parent, created_at.
3. **Services**
   - Tombol Upload ZIP.
   - Tombol Download Sample Markdown.
   - Panel "Available Variables" (read-only reference list).
   - List service + preview konten (render markdown/HTML + highlight variable).
4. **Generation**
   - Form/summary sebelum run (pilih service & lokasi scope bila diperlukan, atau all-by-default).
   - Tombol **Run** / **Resume**.
   - Progress bar + status realtime (polling atau websocket).
   - Panel notifikasi (setup SMTP status: configured/not configured).
5. **Generation History**
   - Tabel job history + detail per job (log, error, hasil).
6. **Result Guide (post-generation)**
   - Halaman/instruksi otomatis muncul setelah job selesai: cara akses hasil, endpoint/struktur data, next steps ke Marketing Site.

**Prinsip UI Dashboard:** utilitarian, fungsi di atas estetika, prioritas kejelasan status proses (upload berhasil/gagal, job progress, error visibility). Tidak perlu login screen.

### 4.2 Marketing Site — Struktur Halaman

1. **Landing/Home** (opsional, sesuai Figma) — entry point navigasi service/lokasi.
2. **Service Page (Programmatic)** — 1 template dinamis mengikuti Figma, mengisi konten dari hasil generate berdasarkan kombinasi service + lokasi di URL.
3. **404/Not Found** — untuk kombinasi yang belum tersedia.
4. **Sitemap Index & Chunk Files** — bukan halaman visual, tapi output file yang harus accessible via URL statis.

**Prinsip UI Marketing Site:** mengikuti Figma 1:1 untuk komponen visual, tapi struktur HTML/markup harus SEO-first (heading hierarchy benar, tidak semata copy visual Figma tanpa mempertimbangkan semantic tag).

---

## 5. User Flow

### 5.1 Flow — Setup Data Master (Admin)
1. Admin buka Dashboard → menu Master Data.
2. Admin download sample CSV (Province) → isi data → upload.
3. Sistem validasi format & (jika ada) slug parent → generate slug otomatis bila kosong → simpan.
4. Ulangi untuk City (referensi Province slug) → County (referensi City slug) → Community (referensi County slug).
5. Admin cek tabel data ter-upload untuk verifikasi.

### 5.2 Flow — Upload Service Content (Admin)
1. Admin buka menu Services.
2. Admin lihat/download sample markdown + daftar variable predefined.
3. Admin siapkan file `service-name.md` (bisa lebih dari satu) dengan variable sesuai daftar.
4. Admin compress jadi ZIP → upload.
5. Sistem parse tiap file, deteksi variable yang dipakai, validasi terhadap variable predefined.
6. Admin melihat preview & konfirmasi service ter-upload dengan benar.

### 5.3 Flow — Jalankan Generation (Admin)
1. Admin buka menu Generation.
2. Admin klik **Run** (atau **Resume** bila ada job yang sebelumnya terhenti).
3. Sistem menjalankan proses kombinasi service × lokasi di background (queue/worker).
4. Admin dapat menutup dashboard — proses tetap berjalan.
5. Jika proses terhenti (server restart/crash), admin kembali → sistem menampilkan opsi **Resume** dari titik terakhir.
6. Saat proses selesai:
   - Jika SMTP dikonfigurasi → email notifikasi terkirim.
   - Dashboard menampilkan ringkasan hasil + **instruksi penggunaan** hasil generate.
7. Admin cek History untuk detail log/error bila ada kegagalan sebagian data.

### 5.4 Flow — Pengunjung Marketing Site
1. Pengunjung (atau crawler search engine) mengakses URL service+lokasi, mis. `service.venture27.com/{service}/{province}/{city}`.
2. Sistem/proxy mengambil data hasil generate (title, slug, keywords, content) berdasarkan slug kombinasi tsb.
3. Jika data ditemukan → render halaman sesuai desain Figma dengan konten & SEO tag terisi.
4. Jika data tidak ditemukan → tampilkan halaman 404.
5. Search engine crawler membaca `robots.txt` → mengikuti link ke sitemap index → mem-fetch tiap sitemap chunk (≤10.000 URL per file) untuk indexing.

---

