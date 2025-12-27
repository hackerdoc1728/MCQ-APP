# System Architecture

This document describes the **high-level architecture** of the Bench to Bedside Neuro / Axon IQ backend.

---

## 1. High-Level System Overview

```mermaid
flowchart LR
    User[User Browser]
    Admin[Admin Browser]

    CF[Cloudflare Edge<br/>DNS + TLS + Access]
    API[Node.js Backend<br/>Express + Cluster]

    Redis[(Redis)]
    Neon[(Neon PostgreSQL)]
    MySQL[(MySQL)]
    Sheets[(Google Sheets<br/>MCQ CMS)]
    R2[(Cloudflare R2)]
    YT[(YouTube API)]

    User --> CF
    Admin --> CF
    CF --> API

    API --> Redis
    API --> Neon
    API --> MySQL
    API --> Sheets
    API --> R2
    API --> YT

```

---

## 2. Backend Internal Layering

```mermaid
flowchart TB
    Server[server.js<br/>Process + Cluster]
    App[src/app.js<br/>HTTP Composition]

    MW[Middleware Layer]
    Routes[Routes Layer]
    Services[Services Layer]
    Infra[Infra Layer]

    Server --> App
    App --> MW
    MW --> Routes
    Routes --> Services
    Services --> Infra
```

---

## 3. Public MCQ Read Flow

```mermaid
sequenceDiagram
    participant U as User
    participant API
    participant R as Redis
    participant N as Neon

    U->>API: GET /api/mcq
    API->>R: Cache lookup

    alt Cache hit
        R-->>API: MCQs
        API-->>U: Response
    else Cache miss
        API->>N: Query published MCQs
        N-->>API: Rows
        API->>R: Cache result
        API-->>U: Response
    end
```

---

## 4. MCQ Publish Pipeline

```mermaid
sequenceDiagram
    participant Admin
    participant API
    participant Sheets
    participant Neon
    participant Redis

    Admin->>API: Publish MCQ
    API->>Sheets: Read draft
    API->>API: Validate
    API->>Neon: Upsert published MCQ
    API->>Sheets: Update metadata
    API->>Redis: Invalidate caches
    API-->>Admin: OK
```

---

## 5. Media Upload Pipeline

```mermaid
flowchart LR
    Admin --> API
    API --> Sharp[Sharp<br/>Validate + WebP]
    Sharp --> R2
    R2 --> CDN
    CDN --> User
```

---

## 6. Authentication & Progress Flow

```mermaid
sequenceDiagram
    participant User
    participant API
    participant Google
    participant Redis
    participant Neon

    User->>API: Login (Google)
    API->>Google: Verify token
    API->>Neon: Upsert user
    API->>Redis: Cache user
    API-->>User: Session cookie

    User->>API: Submit MCQ answer
    API->>Neon: Save answer + state
    API->>Redis: Update caches
```
