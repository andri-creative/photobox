# Photobox - Backend

## Teknologi

| Komponen | Teknologi |
|----------|-----------|
| Bahasa | Golang 1.21+ |
| Framework | Gin (REST API) |
| Database | PostgreSQL |
| ORM | GORM |
| Real-time | Socket.IO (Node.js/Express terpisah untuk WS) |
| Auth | JWT + BCrypt |
| Kamera | GoCV (CV bridge) / OpenCV Go binding |
| Background Removal | MediaPipe / YOLO (auto remove bg) |
| CORS | gin-contrib/cors |

> **Catatan**: Socket.IO tidak tersedia di Go. Untuk real-time feed kamera,
> gunakan **Node.js + Express + Socket.IO** sebagai service terpisah,
> atau gunakan **WebSocket (gorilla/websocket)** murni di Golang.
>
> Rancangan ini menggunakan: **Golang (Gin)** untuk REST API + **Node.js Express** untuk Socket.IO gateway.

## Struktur Folder

```
photobox/
├── backend/
│   ├── cmd/
│   │   └── api/
│   │       └── main.go              # Entry point Golang
│   ├── internal/
│   │   ├── config/
│   │   │   └── config.go           # Load env & konfigurasi
│   │   ├── database/
│   │   │   └── postgres.go         # Koneksi PostgreSQL + GORM
│   │   ├── middleware/
│   │   │   ├── auth.go             # Middleware JWT
│   │   │   └── cors.go            # Konfigurasi CORS
│   │   ├── models/
│   │   │   ├── user.go            # Model User
│   │   │   ├── session.go         # Model Sesi Photobox
│   │   │   ├── token.go           # Model Token Join
│   │   │   └── photo.go           # Model Foto Terkapan
│   │   ├── handlers/
│   │   │   ├── auth_handler.go    # Login, Register
│   │   │   ├── session_handler.go # Create session, generate token
│   │   │   ├── camera_handler.go  # Aktifkan feed kamera
│   │   │   └── photo_handler.go   # Ambil & simpan foto
│   │   ├── service/
│   │   │   ├── auth_service.go    # Logika auth
│   │   │   ├── session_service.go # Logika sesi & token
│   │   │   ├── camera_service.go  # Logika streaming kamera
│   │   │   ├── background_service.go # Logika remove bg & composite
│   │   │   └── photo_service.go   # Logika simpan foto
│   │   ├── repository/
│   │   │   ├── user_repository.go
│   │   │   ├── session_repository.go
│   │   │   ├── token_repository.go
│   │   │   └── photo_repository.go
│   │   └── utils/
│   │       ├── jwt.go              # Generate & verify JWT
│   │       ├── password.go        # Hash & verify password
│   │       └── token.go           # Generate token join
│   ├── migrations/
│   │   ├── 001_create_users.sql
│   │   ├── 002_create_sessions.sql
│   │   ├── 003_create_tokens.sql
│   │   └── 004_create_photos.sql
│   ├── docker-compose.yml           # PostgreSQL + Golang
│   ├── Dockerfile
│   ├── .env.example
│   ├── go.mod
│   ├── go.sum
│   └── Makefile
│
├── socket-gateway/                  # Node.js + Express + Socket.IO
│   ├── src/
│   │   ├── index.js                # Entry point
│   │   ├── config/
│   │   │   └── env.js             # Load env
│   │   ├── server/
│   │   │   └── socket.js          # Setup Socket.IO
│   │   ├── middleware/
│   │   │   └── auth.js            # Validasi user (JWT) & rate limit
│   │   ├── routes/
│   │   │   └── socket.js          # Event handlers
│   │   ├── services/
│   │   │   ├── camera-stream.js   # Forward feed kamera ke clients
│   │   │   ├── presence.js        # Track user di frame
│   │   │   ├── photo-capture.js  # Trigger capture
│   │   │   └── token-validator.js # Validasi token join (time-based)
│   │   └── utils/
│   │       ├── logger.js
│   │       └── id-generator.js    # Generate unique socket ID
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
│
├── frontend/                        # (lihat frontend.md)
├── docker-compose.yml               # Orkestrasi semua service
└── README.md
```

## Model Database (PostgreSQL)

### User

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID (PK) | Unique identifier |
| username | VARCHAR(50), UNIQUE | Username login |
| password_hash | VARCHAR(255) | Password ter-hash (bcrypt) |
| role | VARCHAR(10) | `host` / `guest` |
| created_at | TIMESTAMP | Waktu registrasi |
| updated_at | TIMESTAMP | Waktu update |

### Session

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID (PK) | Unique identifier |
| host_id | UUID (FK → users.id) | User yang jadi host |
| session_code | VARCHAR(8) | Kode unik sesi |
| background_image | TEXT | URL/pilihan background |
| active | BOOLEAN | Sesi masih aktif? |
| created_at | TIMESTAMP | Waktu sesi dibuat |

### Token

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID (PK) | Unique identifier |
| session_id | UUID (FK → sessions.id) | Session terkait |
| token | VARCHAR(16), UNIQUE | Token join (6 per sesi) |
| guest_id | UUID (FK → users.id, NULL) | User yang pakai token |
| used | BOOLEAN | Apakah token sudah dipakai |
| created_at | TIMESTAMP | Waktu token dibuat |

### Photo

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID (PK) | Unique identifier |
| session_id | UUID (FK → sessions.id) | Session terkait |
| image_path | TEXT | Path file foto tersimpan |
| thumbnail_path | TEXT | Path thumbnail |
| created_at | TIMESTAMP | Waktu foto diambil |

## Endpoints REST API

### Auth

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/api/v1/auth/register` | Register user baru | No |
| POST | `/api/v1/auth/login` | Login → JWT | No |
| GET | `/api/v1/auth/me` | Profil user | Bearer |

### Session

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/api/v1/sessions` | Buat sesi baru (host) | Bearer |
| GET | `/api/v1/sessions/:id` | Detail sesi | Bearer |
| GET | `/api/v1/sessions/:id/tokens` | Ambil 6 token | Bearer |
| POST | `/api/v1/sessions/:id/join` | Join via token (guest) — validasi TTL 30 menit & single-use | Bearer |
| DELETE | `/api/v1/sessions/:id` | Hapus sesi | Bearer |

### Kamera

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/api/v1/camera/stream` | Mulai streaming kamera host | Bearer |
| GET | `/api/v1/camera/stream/:id` | Terima stream (mjpeg/websocket) | Bearer |
| POST | `/api/v1/camera/stop` | Stop streaming | Bearer |

### Foto

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/api/v1/photos/capture` | Ambil frame & simpan | Bearer |
| GET | `/api/v1/photos/session/:id` | Riwayat foto sesi | Bearer |
| GET | `/api/v1/photos/:id/download` | Download foto | Bearer |

## Socket.IO Events (Gateway)

### Room per Session

Setiap sesi Photobox = 1 room Socket.IO dengan nama `session_{id}`.

### Validasi User & Time-Based Token

Agar user dan time tidak bentrok, mekanisme validasi sebagai berikut:

```
┌──────────────────────────────────────────────────────────────┐
│  Socket.IO Connection Handshake                               │
├──────────────────────────────────────────────────────────────┤
│  Client mengirim:                                           │
│    - token (JWT dari login)                                  │
│    - userId (UUID)                                           │
│    - socketId (generated unique per connection)              │
│                                                               │
│  Server memvalidasi:                                         │
│    1. Verify JWT → pastikan user valid & tidak expired       │
│    2. Cek userId → pastikan user sudah register di DB        │
│    3. Rate limit → max 3 connection per userId per minute    │
│    4. Cek duplicate → apakah userId sudah punya active socket │
│       Jika ya → tolak atau kick socket lama (takeover)       │
│    5. Generate unique socketId → simpan mapping              │
│       { socketId → { userId, connectedAt, lastPing } }       │
│                                                               │
│  Jika valid → allow join room                                 │
│  Jika tidak → disconnect + error message                     │
└──────────────────────────────────────────────────────────────┘
```

#### 1. JWT Verification (Middleware Auth)

```js
// middleware/auth.js
const { verifyToken } = require('../utils/jwt');

function authMiddleware(socket, next) {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('AUTH_TOKEN_MISSING'));
  }
  try {
    const decoded = verifyToken(token); // { userId, exp }
    if (decoded.exp * 1000 < Date.now()) {
      return next(new Error('TOKEN_EXPIRED'));
    }
    socket.user = { id: decoded.userId };
    next();
  } catch (err) {
    next(new Error('INVALID_TOKEN'));
  }
}
```

#### 2. Duplicate Connection Prevention

```js
// utils/id-generator.js
const { randomUUID } = require('crypto');

// Store aktif per userId (in-memory)
const activeSockets = new Map(); // userId → socketId

function generateSocketId() {
  return randomUUID();
}

function registerSocket(userId, socketId) {
  // Jika user sudah punya socket aktif → kick yang lama (takeover)
  const existingSocketId = activeSockets.get(userId);
  if (existingSocketId && existingSocketId !== socketId) {
    const io = require('../server/socket').io;
    const oldSocket = io.sockets.sockets.get(existingSocketId);
    if (oldSocket) {
      oldSocket.disconnect(true); // Force disconnect
      log.info(`Kicked old socket ${existingSocketId} for user ${userId}`);
    }
  }
  activeSockets.set(userId, socketId);
}

function removeSocket(userId, socketId) {
  if (activeSockets.get(userId) === socketId) {
    activeSockets.delete(userId);
  }
}
```

#### 3. Rate Limiting (Mencegah Banjir Connection)

```js
// Middleware rate limit per userId
const rateLimit = new Map(); // userId → { count, resetTime }

function rateLimitCheck(socket, next) {
  const userId = socket.user.id;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 menit
  const maxAttempts = 3;      // max 3 connection per menit

  let entry = rateLimit.get(userId);
  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + windowMs };
    rateLimit.set(userId, entry);
  }

  entry.count++;
  if (entry.count > maxAttempts) {
    return next(new Error('RATE_LIMITED'));
  }
  next();
}
```

#### 4. Token Join Validasi (Time-Based)

```js
// services/token-validator.js
const { getActiveToken, markTokenUsed } = require('../db');

async function validateJoinToken(sessionId, token, userId) {
  // 1. Cek apakah token masih valid & belum dipakai
  const tokenRecord = await getActiveToken(sessionId, token);
  if (!tokenRecord) {
    return { valid: false, error: 'INVALID_OR_USED_TOKEN' };
  }

  // 2. Cek apakah token sudah expired (time-based)
  //    Token hanya valid 30 menit setelah di-generate
  const now = Date.now();
  const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 menit
  if (now - tokenRecord.createdAt.getTime() > TOKEN_TTL_MS) {
    return { valid: false, error: 'TOKEN_EXPIRED' };
  }

  // 3. Cek apakah user sudah punya token lain di sesi ini
  const existing = await getUserTokenInSession(sessionId, userId);
  if (existing && existing.token !== token) {
    // User sudah join dengan token lain → allow switch? atau reject?
    // Kebijakan: reject, user harus keluar dulu
    return { valid: false, error: 'ALREADY_JOINED' };
  }

  // 4. Mark token as used + bind ke userId
  await markTokenUsed(token.id, userId);
  return { valid: true, tokenRecord };
}
```

#### 5. Heartbeat & Last-Seen (Mendeteksi Socket Mati)

```js
// Di server/socket.js — heartbeat check
setInterval(() => {
  const now = Date.now();
  const HEARTBEAT_TIMEOUT = 30 * 1000; // 30 detik

  io.sockets.forEach((socket) => {
    const data = activeSockets.get(socket.user?.id);
    if (data && now - data.lastPing > HEARTBEAT_TIMEOUT) {
      socket.disconnect(true); // Socket dianggap mati
      log.warn(`Removed stale socket ${socket.id} for user ${socket.user.id}`);
    }
  });
}, 10000); // Cek tiap 10 detik
```

### Event

| Direction | Event | Payload | Deskripsi |
|-----------|-------|---------|-----------|
| Client → Server | `session:join` | `{ sessionId, token, userId, socketId }` | Join room sesi (validasi JWT + token + rate limit) |
| Client → Server | `session:leave` | `{ sessionId }` | Keluar room |
| Client → Server | `position:update` | `{ x, y, scale, timestamp }` | Update posisi user (debounced) |
| Server → Client | `position:changed` | `{ userId, x, y, scale, serverTime }` | Notifikasi perubahan posisi |
| Server → Client | `camera:feed` | `{ frame: ArrayBuffer, seq: number }` | Frame kamera real-time (with seq untuk ordering) |
| Server → Client | `background:changed` | `{ bgUrl, timestamp }` | Notifikasi background baru |
| Server → Client | `photo:captured` | `{ photoId, url }` | Foto berhasil diambil |
| Server → Client | `user:joined` | `{ userId, username, socketId }` | User baru join |
| Server → Client | `user:left` | `{ userId, socketId }` | User keluar |
| Client → Server | `ping` | `{ clientTime }` | Heartbeat dari client |
| Server → Client | `pong` | `{ serverTime }` | Response heartbeat |

### Catatan Validasi

| Mekanisme | Detail |
|-----------|--------|
| **JWT** | Setiap connection harus membawa valid JWT dari login. Token expired → disconnect. |
| **Unique socketId** | Setiap koneksi dapat unique socketId (UUID). Jika user reconnect, socket lama di-kick. |
| **Rate Limit** | Max 3 connection per userId per menit. Mencegah banjir connection. |
| **Token TTL** | Token join hanya valid **30 menit** setelah di-generate. Setelah itu expired. |
| **Token Used** | Token hanya bisa dipakai **1x**. Setelah dipakai, langsung ditandai `used = true`. |
| **Heartbeat** | Client kirim `ping` tiap 25 detik. Server check stale socket tiap 10 detik. |
| **Frame Ordering** | Setiap frame kamera diberi `seq` number. Client discard frame yang lebih lama. |

## Alur Sistem

```
┌─────────────┐         ┌─────────────┐         ┌──────────────────┐
│  Host UI    │         │  REST API   │         │  PostgreSQL     │
│  (Gin)      │────────>│  (Golang)   │────────>│                  │
│             │<────────│             │<────────│                  │
└─────────────┘         └─────────────┘         └──────────────────┘
       │                        │
       │  register/login        │  create session
       │  generate token        │  create 6 tokens
       │                        │
       │  POST /camera/stream  │
       ▼                       ▼
┌─────────────┐         ┌─────────────┐
│  GoCV /     │         │  Socket.IO  │
│  OpenCV     │────────>│  Gateway    │
│  (kamera +  │         │  (Node.js)  │
│  remove bg) │         │             │
└─────────────┘         └─────────────┘
                              │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
             ┌─────────────┐  ┌─────────────┐
             │ Guest UI 1  │  │ Guest UI 2  │
             │ (React)     │  │ (React)      │
             └─────────────┘  └─────────────┘
```

> **Catatan Arsitektur Kamera**:
> - **Kamera Host**: Diakses via **HTML5 Media Devices API** di frontend (webcam perangkat host)
> - **Kamera Guest**: Diakses via **HTML5 Media Devices API** di frontend (webcam perangkat masing-masing guest)
> - **Remove Background**: Proses remove bg dilakukan di **frontend** (browser) menggunakan WebRTC + AI model (misal TensorFlow.js), hasil siluet dikirim ke Socket.IO gateway
> - **Komposit Frame**: Gateway menggabungkan semua siluet (host + guest) ke dalam 1 frame bersama background yang dipilih
> - **GoCV/OpenCV** di Golang tetap tersedia untuk **fallback** atau **server-side processing** jika perlu

## Konfigurasi Env (`.env.example`)

```env
# Server
PORT=18080
NODE_ENV=development

# PostgreSQL (External DB)
DB_HOST=192.168.110.220
DB_PORT=25432
DB_USER=postgres
DB_PASSWORD=admin123
DB_NAME=photobox
DB_SSLMODE=disable

# JWT
JWT_SECRET=your-secret-key-change-in-production

# CORS
CORS_ORIGINS=http://localhost:5173
```

### Socket Gateway (`.env.example`)

```env
SOCKET_GATEWAY_PORT=13001
JWT_SECRET=your-secret-key-change-in-production

# PostgreSQL (External DB)
DB_HOST=192.168.110.220
DB_PORT=25432
DB_USER=postgres
DB_PASSWORD=admin123
DB_NAME=photobox

CORS_ORIGINS=http://localhost:5173
```

## Dependencies (go.mod)

```go
module github.com/photobox/backend

go 1.21

require (
    github.com/gin-gonic/gin v0.19.0
    github.com/gin-contrib/cors v1.5.0
    github.com/golang-jwt/jwt/v5 v5.2.0
    gorm.io/gorm v1.25.8
    gorm.io/driver/postgres v1.5.4
    github.com/lib/pq v1.10.9
    github.com/boombuler/barcode v1.0.1
    golang.org/x/image v0.20.0
    github.com/gorilla/websocket v1.5.1
    github.com/spf13/viper v1.19.0
    github.com/stretchr/testify v1.9.0
)
```

## Docker Compose

```yaml
# docker-compose.yml
version: "3.8"
services:
  backend:
    build: ./backend
    ports:
      - "18080:18080"
    environment:
      - PORT=18080
      - DB_HOST=192.168.110.220
      - DB_PORT=25432
      - DB_USER=postgres
      - DB_PASSWORD=admin123
      - DB_NAME=photobox
      - DB_SSLMODE=disable
      - JWT_SECRET=your-secret-key-change-in-production
      - CORS_ORIGINS=http://localhost:5173
      - NODE_ENV=development

  socket-gateway:
    build: ./socket-gateway
    ports:
      - "13001:13001"
    environment:
      - SOCKET_GATEWAY_PORT=13001
      - JWT_SECRET=your-secret-key-change-in-production
      - DB_HOST=192.168.110.220
      - DB_PORT=25432
      - DB_USER=postgres
      - DB_PASSWORD=admin123
      - DB_NAME=photobox

  frontend:
    build: ./frontend
    ports:
      - "5173:80"
```

> **Catatan**: PostgreSQL berjalan external di `192.168.110.220:25432`.
> Tidak perlu service postgres di docker-compose.

## Catatan

- **Kamera**: Frontend (host & guest) mengakses kamera via **HTML5 Media Devices API**. Golang GoCV/OpenCV tersedia sebagai fallback server-side.
- **Remove Background**: Proses remove bg dilakukan di **frontend** (browser) menggunakan WebRTC + AI model (TensorFlow.js). Hasil siluet dikirim ke Socket.IO gateway untuk komposit.
- **Socket.IO Gateway**: Node.js + Express. Gateway meneruskan frame kamera & siluet semua user ke dalam room sesi, menggabungkan menjadi 1 frame bersama background.
- **CORS**: Diatur via `gin-contrib/cors` untuk REST API, dan `cors` package di Express untuk Socket.IO.
- **Security**: Semua endpoint dilindungi JWT. Token join di-validate (TTL 30 menit, single-use) sebelum user bisa masuk sesi.

## Sinkronisasi Frontend ↔ Backend

| Mekanisme | Frontend | Backend | Sinkron? |
|-----------|----------|---------|----------|
| Semua user login (username + password) | ✅ | ✅ | ✅ |
| Host generate 6 token | ✅ | ✅ | ✅ |
| Guest input token di Settings | ✅ | ✅ | ✅ |
| Token valid → langsung masuk frame utama | ✅ | ✅ | ✅ |
| Host bisa sendiri dulu | ✅ | ✅ | ✅ |
| Auto remove background | ✅ | ✅ | ✅ |
| Feed kamera real-time via Socket.IO | ✅ | ✅ | ✅ |
| Semua user dalam 1 frame | ✅ | ✅ | ✅ |
| Socket.IO events (join, leave, position, camera:feed, photo, user:joined/left) | ✅ | ✅ | ✅ |
| JWT auth | ✅ | ✅ | ✅ |
| **Token TTL 30 menit** | ✅ | ✅ | ✅ |
| **Token Single-Use** | ✅ | ✅ | ✅ |
| **Heartbeat 25 detik** | ✅ | ✅ | ✅ |
| **Frame Ordering (seq)** | ✅ | ✅ | ✅ |

## Cara Install & Jalankan

### Prerequisites

| Prerequisite | Versi | Download |
|---|---|---|
| Golang | 1.21+ | https://go.dev/dl/ |
| PostgreSQL | 14+ | https://www.postgresql.org/download/ atau via Docker |
| Node.js | 18+ | https://nodejs.org/ |
| Docker & Docker Compose | — | https://docs.docker.com/get-docker/ |

### Opsi 1: Jalankan via Docker Compose

#### 1a. Deploy Semua Service Sekaligus

```bash
# Dari root folder
docker compose up --build -d

# Cek service berjalan
curl http://localhost:18080/health      # REST API
curl http://localhost:13001/health      # Socket Gateway
```

#### 1b. Deploy per Service (Sendiri-sendirian)

Setiap folder punya `docker-compose.yml` sendiri, bisa di-deploy terpisah:

```bash
# Backend saja
cd photobox/backend
docker compose up --build -d

# Socket Gateway saja
cd photobox/socket-gateway
docker compose up --build -d

# Frontend saja
cd photobox/frontend
docker compose up --build -d
```

> **Catatan**: Saat deploy per-service, `nginx` di frontend akan proxy ke IP server (`192.168.110.220`) untuk backend & socket. Pastikan service backend & socket sudah jalan di port `18080` & `13001`.

> Pastikan database PostgreSQL di `192.168.110.220:25432` sudah jalan & database `photobox` sudah dibuat.

### Opsi 2: Jalankan Lokal (Tanpa Docker)

#### 2.1. Setup PostgreSQL (External DB)

Database sudah tersedia di `192.168.110.220:25432`, cukup buat database:

```bash
# Buat database di server DB
psql -h 192.168.110.220 -p 25432 -U postgres
CREATE DATABASE photobox;
\q

# Jalankan migration
psql -h 192.168.110.220 -p 25432 -U postgres -d photobox -f backend/migrations/001_init.sql
```

#### 2.2. Setup Backend (Golang)

```bash
cd photobox/backend

# Buat .env
cp .env.example .env
# Edit .env jika perlu (default sudah sesuai)

# Install dependencies
go mod tidy

# Build & jalankan
go build -o photobox-server ./cmd/api
./photobox-server
```

#### 2.3. Setup Socket Gateway (Node.js)

```bash
cd photobox/socket-gateway

# Buat .env
cp .env.example .env
# Edit .env jika perlu

# Install dependencies
npm install

# Jalankan
npm start
```

#### 2.4. Frontend

```bash
cd photobox/frontend
npm install
npm run dev
```

### Verifikasi

```bash
# 1. Health check
curl http://localhost:18080/health       # {"status":"ok"}
curl http://localhost:13001/health       # {"status":"ok"}

# 2. Register user
curl -X POST http://localhost:18080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"host","password":"host123","role":"host"}'

# 3. Login → ambil JWT
curl -X POST http://localhost:18080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"host","password":"host123"}'

# 4. Buat sesi (pakai JWT dari step 3)
TOKEN=<paste_jwt>
curl -X POST http://localhost:18080/api/v1/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"backgroundImage":"beach"}'

# 5. Ambil 6 token join
curl -X GET http://localhost:18080/api/v1/sessions/<session_id>/tokens \
  -H "Authorization: Bearer $TOKEN"
```

### Struktur File Backend (Sesuai Kode)

```
backend/
├── cmd/api/main.go          # Entry point
├── internal/
│   ├── config/config.go     # Load env
│   ├── database/postgres.go # Koneksi GORM + auto-migrate
│   ├── middleware/
│   │   ├── auth.go          # JWT middleware
│   │   └── cors.go         # CORS config
│   ├── models/models.go     # User, Session, Token, Photo (1 file)
│   ├── repository/
│   │   ├── user_repository.go
│   │   ├── session_repository.go
│   │   ├── token_repository.go
│   │   └── photo_repository.go
│   ├── service/
│   │   ├── auth_service.go
│   │   ├── session_service.go
│   │   ├── photo_service.go
│   │   └── camera_service.go
│   ├── handlers/
│   │   ├── auth_handler.go
│   │   ├── session_handler.go
│   │   ├── camera_handler.go
│   │   └── photo_handler.go
│   └── utils/
│       ├── jwt.go
│       ├── password.go
│       └── token.go
├── migrations/001_init.sql
├── go.mod
├── go.sum
├── .env.example
└── Dockerfile
```

### Struktur File Socket Gateway (Sesuai Kode)

```
socket-gateway/
├── src/
│   ├── index.js             # Entry point
│   ├── config/env.js        # Load env
│   ├── server/socket.js     # Socket.IO setup & event handlers
│   ├── middleware/auth.js   # JWT + rate limit
│   ├── services/
│   │   ├── camera-stream.js
│   │   ├── presence.js
│   │   ├── photo-capture.js
│   │   └── token-validator.js
│   └── utils/id-generator.js
├── package.json
├── .env.example
└── Dockerfile
```
