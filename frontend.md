# Photobox - Frontend

## Konsep

Photobox adalah aplikasi kamera shared real-time dengan dua peran:

- **Host (User pertama)**: login dengan username & password, aktifkan kamera, generate token, kontrol background & foto
- **Guest (User kedua dst)**: login dengan username & password masing-masing, join sesi via token, lihat feed real-time, tampil di frame bersama

> **Semua user tetap login** (username + password). Tidak ada yang skip login.
> Guest setelah login, input token di panel setting untuk join sesi photobooth.

## Arsitektur UI

### 1. Halaman Login (`/login`)

- UI sederhana: field **Username** dan **Password**
- **Semua user login** (host & guest) dengan username & password masing-masing
- Setelah login sukses, masuk ke halaman utama
- Host: langsung ke mode host (generate token, kamera)
- Guest: masuk ke panel setting → input token → jika valid langsung masuk frame utama

### 2. Halaman Utama (`/home`)

#### Mode Host

- **Aktifkan Kamera**: tombol untuk mengaktifkan kamera perangkat (backend)
- **Generate Token**: host generate **6 token** (6 slot user yang bisa join)
- **View Feed**: host melihat feed kamera sendiri untuk komposisi
- **Kendali**: host mengontrol background, mengambil foto

#### Mode Guest

- **Input Token**: user memasukkan token yang diberikan host
- **Validasi**: jika token valid → **langsung masuk ke layout utama/frame** yang sama dengan host
- **Tampil di Frame**: guest sekarang "terlihat" di frame photobooth bersama host
- **Lihat Feed Real-time**: feed kamera host dikirim via Socket.IO
- **Foto Bersama**: semua user "terlihat" dalam satu frame, seperti photobooth

### 3. Alur Kerja

```
Host Device                  Backend                  Guest Device(s)
    |                          |                          |
    |-- Aktifkan Kamera ------>|                          |
    |-- Generate 6 Token ----->|                          |
    |<--- 6 Token dihasilkan --|                          |
    |                          |<--- Join via Token ------|
    |                          |--- Validasi Token ------->|
    |                          |<--- Terima posisi -------|
    |<--- Feed kamera -------- |                          |
    |--- Push feed via WS ----|--- Forward feed --------->|
    |                          |                          |
    |-- Background/Foto ------>|                          |
    |                          |--- Broadcast ke semua -->|
```

## Teknologi

| Komponen | Teknologi |
|----------|-----------|
| UI | Vite + React + shadcn/ui |
| Real-time | Socket.IO client |
| Kamera | HTML5 Media Devices API (webcam perangkat host & guest) |
| Auth | Username & Password sederhana |
| State | React Context / Zustand |
| Background Removal | WebRTC + AI model (TensorFlow.js) di browser, hasil siluet dikirim ke Socket.IO gateway |

## Struktur Halaman

```
src/
  pages/
    LoginPage.tsx          # Username + Password
    HomePage.tsx          # Host: camera control, token, guest list
    HomePage.tsx          # Guest: join token, view feed, position
  components/
    camera/
      CameraFeed.tsx       # Tampilkan feed kamera (webcam/real-time)
      BackgroundSelector.tsx # Pilih latar (remove bg otomatis)
      PhotoFrame.tsx       # Frame foto bersama
    token/
      TokenGenerator.tsx   # Generate & tampilkan 6 token
      TokenInput.tsx       # Input token untuk guest (di setting)
    auth/
      LoginForm.tsx        # Form login
    layout/
      AppLayout.tsx        # Layout utama
      SettingsPanel.tsx    # Panel setting (input token di sini)
  services/
    auth.ts               # Login, get token
    socket.ts             # Socket.IO connection
    camera.ts             # Ambil feed kamera dari backend
    background.ts         # Pilihan & apply background
  store/
    authStore.ts          # State user (host/guest)
    sessionStore.ts       # State sesi (token, positions, bg)
  hooks/
    useCamera.ts          # Logika kamera
    useSocket.ts          # Logika socket
    useAuth.ts            # Logika auth
    useBackground.ts      # Logika background
```

## Alur Login & Sesi

1. User membuka aplikasi → **LoginPage**
2. Input username + password → klik Login
3. Backend memvalidasi → generate session
4. Jika user = host:
   - Host bisa aktivasi kamera
   - Host generate **6 token**
   - Token ditampilkan (bisa di-copy / di-share)
   - Host bisa mulai photobooth **sendiri dulu**
5. Jika user = guest:
   - Guest **login dengan username & password** (sama seperti host)
   - Guest masuk ke **Settings**
   - Input token di panel setting
   - Jika token valid → **langsung masuk ke layout utama/frame** yang sama dengan host
   - Guest sekarang "terlihat" di frame photobooth bersama host
   - Bisa lihat feed real-time, tampil di frame bersama

## Detail UI

### LoginPage

- Logo Photobox di tengah
- Card login dengan:
  - Input Username
  - Input Password (dengan toggle show/hide)
  - Button "Masuk"
- Desain minimal, satu kolom, mobile-friendly

### HomePage (Host)

- **Header**: token sesi (6 token, copyable), jumlah guest yang join
- **Kamera Panel**:
  - View feed kamera (webcam backend)
  - Overlay posisi semua user
  - Tombol "Foto" untuk menangkap frame
- **Token Panel**:
  - 6 slot token (bisa di-copy satu per satu atau semua)
  - Status: used / unused
- **Kontrol Panel**:
  - Pilih background
  - Jarak/komposisi
- **Guest List**: daftar user yang sedang join

### HomePage (Guest)

- **Feed Panel**:
  - Live feed dari kamera host
  - Overlay posisi user sendiri & user lain
- **Settings Panel** (input token di sini):
  - Input field token
  - Jika valid → **langsung masuk ke layout utama/frame** yang sama dengan host
  - Jika tidak valid → error message

### Settings Panel

- Input token (untuk guest yang baru join)
- Pilihan background (untuk host)
- Auto remove bg toggle
- Ukuran/jarak di frame

## Mekanisme Kamera & Background

### 1. Auto Remove Background

- Feed kamera host & guest di-ambil via **HTML5 Media Devices API** di browser
- Proses remove background menggunakan **WebRTC + AI model (TensorFlow.js)** secara otomatis di frontend
- Hasil: siluet/user sudah tanpa latar, siap di-composite

### 2. Pilihan Background

- Host memilih background (gambar/video) dari library
- Background di-composite dengan siluet dari semua user
- Setiap user bisa "berdiri" di depan background yang sama

### 3. Frame Photobooth

- Semua user (host + guest) digabung dalam 1 frame
- Beda posisi & jarak
- Background ter-apply ke semua
- Tombol "Foto" untuk menangkap & download

### 4. Mekanisme Real-time & Token (Sinkron dengan Backend)

- **Token TTL 30 menit**: Token join hanya valid 30 menit setelah di-generate host. Setelah expired, guest tidak bisa join dengan token itu.
- **Token Single-Use**: 1 token hanya untuk 1 user. Setelah dipakai, token langsung ditandai `used` dan tidak bisa digunakan lagi.
- **Heartbeat**: Frontend (client) harus kirim `ping` ke server setiap **25 detik** untuk menjaga koneksi tetap hidup. Server check stale socket setiap 10 detik.
- **Frame Ordering (`seq`)**: Setiap frame kamera dari backend diberi `seq` number (urutan). Client wajib discard frame yang `seq`-nya lebih lama dari frame terakhir yang diterima, agar tampilan tetap smooth dan tidak ada frame lama yang "melompat".
- **Auth Socket**: Setiap koneksi Socket.IO harus membawa valid **JWT** dari hasil login. Token expired → langsung disconnect.

## Catatan

- UI sederhana, fokus pada fungsi inti: login, aktivasi kamera, token, feed real-time
- **Semua user (host & guest) tetap login** dengan username & password
- Host bisa photobooth **sendiri dulu** tanpa perlu guest
- Guest tidak perlu punya kamera sendiri — mereka melihat feed host
- Semua user "terlihat" dalam satu frame (posisi di frame)
- Host yang mengontrol background dan mengambil foto
- Auto remove background ter-apply otomatis ke feed kamera
- 6 token per sesi untuk 6 slot guest
- Token join punya masa berlaku **30 menit** dan **single-use** (1 token = 1 user)
- Client wajib kirim **heartbeat** setiap 25 detik
- Frame kamera memiliki `seq` untuk mencegah frame lama tampil

## Implementation Plan (UI Dummy — Belum Ada Database)

> **Status**: UI dummy dengan login sementara. Data masih hardcoded di `mockData.ts`.
> Saat backend & database tersedia, tinggal ganti `services/auth.ts` dari mock ke REST API.

### File Baru yang Dibuat (urutan)

| # | File | Fungsi |
|---|------|--------|
| 1 | `src/mockData.ts` | Dummy users, sessions, tokens, photos, backgrounds |
| 2 | `src/store/authStore.ts` | Zustand: user login state, token JWT (dummy), role (host/guest) |
| 3 | `src/store/sessionStore.ts` | Zustand: session, tokens, positions, background, guests |
| 4 | `src/services/auth.ts` | `login()` → cek `mockData.users`, generate dummy JWT, set store |
| 5 | `src/services/session.ts` | `createSession()`, `generateTokens()`, `joinByToken()` → mock data |
| 6 | `src/components/auth/LoginForm.tsx` | Form username + password + show/hide toggle |
| 7 | `src/components/layout/AppLayout.tsx` | Header (username, role badge, logout) + main content area |
| 8 | `src/components/token/TokenGenerator.tsx` | 6 token list, copy per token / copy all, status used/unused |
| 9 | `src/components/token/TokenInput.tsx` | Input field token, tombol join, validasi (valid → masuk frame, invalid → error) |
| 10 | `src/components/camera/CameraFeed.tsx` | WebRTC `getUserMedia` preview (dummy untuk sekarang) |
| 11 | `src/components/camera/BackgroundSelector.tsx` | Grid pilihan background (dummy images) |
| 12 | `src/components/camera/PhotoFrame.tsx` | Frame komposit: background + siluet semua user |
| 13 | `src/components/layout/SettingsPanel.tsx` | Panel setting: input token (guest), pilih bg (host), toggle remove bg |
| 14 | `src/pages/LoginPage.tsx` | Page: `LoginForm` centered |
| 15 | `src/pages/HomePage.tsx` | Page: if host → `AppLayout` + `TokenGenerator` + `CameraFeed` + `BackgroundSelector` + `PhotoFrame` + `SettingsPanel` |
|  |  |  |

### Dummy Login (Untuk Sekarang)

```
mockData.ts:
- users: [{ id: 1, username: "host", password: "host123", role: "host" },
          { id: 2, username: "guest1", password: "guest123", role: "guest" },
          { id: 3, username: "guest2", password: "guest123", role: "guest" }]
- sessions: [{ id: "s1", hostId: 1, code: "PHOBOX", active: true, bg: "beach" }]
- tokens: [{ id: 1, sessionId: "s1", token: "A1B2C3", used: false },
           { id: 2, sessionId: "s1", token: "D4E5F6", used: false },
           ... 6 total]
- backgrounds: [{ id: 1, name: "Beach", url: "beach.jpg" },
                { id: 2, name: "Forest", url: "forest.jpg" },
                ... 6 total]
```

```
auth.ts (dummy):
login(username, password)
  → cari user di mockData.users
  → jika ketemu: generate dummy JWT (btoa(JSON.stringify({userId, role, exp})))
  → set authStore: { user, token, role }
  → return success
  → jika tidak ketemu: throw "INVALID_CREDENTIALS"
```

### Flow Halaman

```
App.tsx (route default → /login)
  ↓
LoginPage.tsx
  ↓ (login sukses → authStore.user terisi)
HomePage.tsx
  ├─ if role === "host":
  │    ├─ TokenGenerator (generate & display 6 tokens)
  │    ├─ CameraFeed (getUserMedia preview)
  │    ├─ BackgroundSelector (6 pilihan bg)
  │    ├─ PhotoFrame (komposit dummy)
  │    └─ SettingsPanel (toggle remove bg)
  └─ if role === "guest":
       ├─ SettingsPanel → TokenInput
       │    ├─ valid → sessionStore.joinedSession = true
       │    └─ invalid → error message
       ├─ CameraFeed (show host feed placeholder)
       └─ PhotoFrame (komposit dummy)
```

### Component Hierarchy

```
App.tsx
└── AppLayout (header: username, role badge, logout btn)
    ├── LoginPage (if !user)
    │   └── LoginForm
    └── HomePage (if user)
        ├── SettingsPanel
        │   ├── TokenInput (guest only)
        │   ├── BackgroundSelector (host only)
        │   └── RemoveBgToggle
        ├── TokenGenerator (host only)
        ├── CameraFeed
        └── PhotoFrame
```

### Dependencies Tambahan

| Package | Untuk |
|---------|-------|
| `zustand` | State management |
| `react-router-dom` | Routing `/login` → `/home` |
| `socket.io-client` | Socket.IO (placeholder, belum diaktifkan) |
| `clsx` + `tailwind-merge` | Utility CSS class |

### Catatan Migrasi ke Backend

Saat backend siap:
1. Ganti `services/auth.ts` dari mock ke `fetch('/api/v1/auth/login')`
2. Ganti `services/session.ts` dari mock ke REST API
3. Aktifkan `socket.io-client` dengan JWT dari login
4. `mockData.ts` tidak lagi dibutuhkan
