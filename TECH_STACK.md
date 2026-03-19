# Living Labs — Technology Stack & Services Reference

This document is intended for the enterprise development team onboarding onto this project. It explains every major tool, service, and library in use, why it is here, and how the pieces connect.

---

## Table of Contents

1. [Core Framework](#1-core-framework)
2. [Database — Firebase & Firestore](#2-database--firebase--firestore)
3. [Authentication — Microsoft SSO via Firebase](#3-authentication--microsoft-sso-via-firebase)
4. [Vector Search — Pinecone](#4-vector-search--pinecone)
5. [3D Visualization — Three.js Stack](#5-3d-visualization--threejs-stack)
6. [Styling](#6-styling)
7. [Build & Developer Tooling](#7-build--developer-tooling)
8. [Environment Variables](#8-environment-variables)
9. [API Routes Reference](#9-api-routes-reference)
10. [Data Models](#10-data-models)

---

## 1. Core Framework

| Tool | Version | Role |
|------|---------|------|
| **Next.js** | 15.5.4 | Full-stack React framework. Handles routing, server-side rendering, and our backend API routes under `app/api/`. |
| **React** | 19.1.0 | UI component library. All UI is written as React components with hooks. |
| **TypeScript** | 5 | Statically typed superset of JavaScript. All source files are `.ts` / `.tsx`. Types are defined in `types/index.ts`. |
| **Node.js** | (runtime) | Server runtime for Next.js API routes and Firebase Admin SDK calls. |

Next.js is configured in `next.config.ts`. TypeScript paths (`@/*`) are configured in `tsconfig.json` so imports can be written as `@/components/...` instead of relative paths.

---

## 2. Database — Firebase & Firestore

### What Firebase is

Firebase is Google's cloud application platform. This project uses two Firebase products:

- **Firestore** — a NoSQL document database that stores all structured application data (labs, media, members).
- **Cloud Storage** — Google-managed file hosting for media assets (images, videos). File URLs are stored in Firestore documents and served directly to the browser.

### How Firebase is used here

| SDK | Package | Where used |
|-----|---------|------------|
| Firebase Admin SDK (server) | `firebase-admin` v13 | All API routes (`app/api/`) run on the server and use the Admin SDK to query Firestore without exposing credentials to the client. |
| Firebase JS SDK (client) | `firebase` v12 | Available for client-side access if needed (e.g., real-time listeners in the future). |

**Initialization:** `firebase-config.js` at the project root initializes the Admin SDK using a service account. Credentials are loaded from an environment variable — either a file path (`LIVINGLABS_ADMINSDK_PATH`) or a base64-encoded JSON string (`LIVINGLABS_ADMINSDK_BASE64`).

### Firestore Collections

```
labs/
  {labId}
    name          string
    location      string   ← building name
    biography     string
    start_date    timestamp
    end_date      timestamp | null
    SDGs          array<string>
    members       array<string>

media/
  {mediaId}
    title         string
    author        string
    lab_id        string   ← references labs/{labId}
    content_url   string   ← Cloud Storage URL
    published     boolean
```

---

## 3. Authentication — Microsoft SSO via Firebase

### Overview

Firebase Authentication supports **federated identity providers**, including Microsoft (Azure AD / Entra ID). This means you can use your university's existing Microsoft SSO infrastructure without building a custom auth system.

### How to implement Microsoft SSO with Firebase

**Step 1 — Register an app in Azure Active Directory**

1. Go to [Azure Portal](https://portal.azure.com) → Azure Active Directory → App Registrations → New Registration.
2. Set the redirect URI to: `https://<your-domain>/__/auth/handler` (Firebase's built-in OAuth handler).
3. Under "Certificates & Secrets", create a client secret.
4. Note your **Application (client) ID** and **Directory (tenant) ID**.

**Step 2 — Enable Microsoft provider in Firebase Console**

1. Open [Firebase Console](https://console.firebase.google.com) → your project → Authentication → Sign-in method.
2. Enable **Microsoft** provider.
3. Enter the Azure **Client ID** and **Client Secret** from Step 1.
4. Add `microsoftonline.com` as an authorized domain if needed.

**Step 3 — Add sign-in code to the frontend**

```ts
// Example: app/auth/microsoft.ts
import { getAuth, signInWithPopup, OAuthProvider } from "firebase/auth";
import { initializeApp } from "firebase/app";

const firebaseClientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseClientConfig);
const auth = getAuth(app);

export async function signInWithMicrosoft() {
  const provider = new OAuthProvider("microsoft.com");
  // Optionally scope to a specific university tenant:
  // provider.setCustomParameters({ tenant: "<your-tenant-id>" });
  const result = await signInWithPopup(auth, provider);
  return result.user; // includes name, email, Microsoft user ID
}
```

**Step 4 — Protect API routes with the Firebase Admin SDK**

The Admin SDK (already initialized in `firebase-config.js`) can verify the ID token that Firebase issues after login:

```ts
// In any app/api/ route
import { getAuth } from "firebase-admin/auth";
import { adminApp } from "@/firebase-config";

export async function GET(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return new Response("Unauthorized", { status: 401 });

  const decoded = await getAuth(adminApp).verifyIdToken(token);
  // decoded.email will be the user's university email
  // decoded.uid is the Firebase user ID
}
```

### Benefits for the university context

- Users log in with their **existing university Microsoft credentials** — no new passwords.
- You can restrict sign-in to your university tenant by setting `tenant: "<tenant-id>"` in the provider config.
- Firebase handles token refresh, session management, and security automatically.
- The Admin SDK lets you enforce access control server-side, ensuring Firestore data is only accessible to authenticated users.

---

## 4. Vector Search — Pinecone

### What Pinecone is

Pinecone is a **vector database** — a database optimized for storing and querying high-dimensional numerical vectors (embeddings). It powers the semantic search feature in this application.

### How it works

Instead of keyword matching, semantic search converts text into an embedding (a vector of numbers that captures meaning) and finds database entries with similar embeddings. This allows queries like "sustainability projects" to match labs and media that talk about environmental work, even without those exact words.

### How it is used here

| Namespace | Contents | Used by |
|-----------|----------|---------|
| `labs` | One vector per lab, with metadata (name, building, SDGs) | `/api/fetch-lab-info` |
| `media` | One vector per media item, with metadata (title, author, lab_id) | `/api/search`, `/api/search-enhanced` |

**Index name:** `livinglabsdemo`

**Authentication:** A single `PINECONE_API_KEY` environment variable. This key must be kept server-side only (never exposed to the browser). All Pinecone queries happen inside Next.js API routes.

### Search flow

```
User types query
      ↓
/api/search  (or /api/search-enhanced)
      ↓
Pinecone: embed query → find top-K similar vectors
      ↓
Return matching media/lab IDs + scores
      ↓
/api/search-enhanced: enrich IDs with full data from Firestore
      ↓
Results displayed in UI
```

### Pinecone vs. Firestore — when to use which

| Question | Tool |
|----------|------|
| "Find labs about renewable energy" | Pinecone (semantic similarity) |
| "Get all members of lab X" | Firestore (exact document lookup) |
| "Get all media for building Y" | Firestore (filtered query) |

---

## 5. 3D Visualization — Three.js Stack

| Package | Role |
|---------|------|
| `three` | Core WebGL 3D engine |
| `@react-three/fiber` | React renderer for Three.js — lets you write 3D scenes as JSX components |
| `@react-three/drei` | Pre-built helpers: `OrbitControls`, `Bounds`, `Center`, `Html`, `OrthographicCamera`, `useGLTF` |
| `@react-three/postprocessing` | Visual post-processing effects (bloom, vignette, etc.) |

The 3D campus map is loaded from `public/MyURImodel3.glb`, a compressed GLTF 3D model. The `DRACOLoader` (from Google's Draco library via CDN) decompresses it at runtime.



---

## 6. Styling

| Tool | Role |
|------|------|
| **Tailwind CSS** v4 | Utility-first CSS framework. Used for layout and component styling via class names. |
| **PostCSS** | CSS processing pipeline that runs Tailwind compilation. Config in `postcss.config.mjs`. |
| **globals.css** | Project design tokens: color variables (`--primary`, `--secondary`, `--tertiary`), font imports. |

**Brand colors:**
```css
--primary:   #75B2DD  /* blue */
--secondary: #EFCB68  /* yellow */
--tertiary:  #002147  /* dark navy */
```

**Fonts:** Quantico, Onest (Google Fonts), Geist Sans, Geist Mono.

---

## 7. Build & Developer Tooling

| Tool | Role |
|------|------|
| **Turbopack** | Next.js's fast bundler, used in both `dev` and `build` scripts. Replaces Webpack. |
| **ESLint** v9 | Code linting with `eslint-config-next` rules. Config in `eslint.config.mjs`. |
| **npm** | Package manager. Lock file is `package-lock.json`. |

**Scripts:**
```bash
npm run dev    # dev server with hot reload (turbopack)
npm run build  # production build (turbopack)
npm start      # serve production build
npm run lint   # run ESLint
```

---

## 8. Environment Variables

All secrets are stored in `.env.local` (gitignored). See `.env.local.example` for the template.

| Variable | Required | Description |
|----------|----------|-------------|
| `PINECONE_API_KEY` | Yes | API key for the Pinecone vector database |
| `LIVINGLABS_ADMINSDK_PATH` | One of these two | Absolute path to Firebase service account JSON file |
| `LIVINGLABS_ADMINSDK_BASE64` | One of these two | Base64-encoded Firebase service account JSON (useful for CI/CD environments without file access) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | For client-side auth | Firebase web app API key (safe to expose — scoped to your project) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | For client-side auth | Firebase auth domain (e.g., `your-project.firebaseapp.com`) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | For client-side auth | Firebase project ID |

> **Security note:** Variables prefixed with `NEXT_PUBLIC_` are bundled into the client-side JavaScript and visible in the browser. Only Firebase web config values (not service account credentials) should use this prefix. Pinecone keys and service account credentials must never be `NEXT_PUBLIC_`.

---

## 9. API Routes Reference

All routes are in `app/api/` and run server-side only.

| Route | Method | Inputs | What it does |
|-------|--------|--------|--------------|
| `/api/search` | GET | `?query=` | Runs Pinecone semantic search, returns matching media IDs |
| `/api/search-enhanced` | GET | `?query=` | Pinecone search + Firestore enrichment, returns full media objects |
| `/api/fetch-lab-info` | GET | `?id=` or no param | Fetch one lab (by ID) or all labs from Pinecone |
| `/api/labs-by-building` | GET | `?building=` | Firestore query for all labs in a building |
| `/api/lab-location` | GET | `?lab_id=` | Returns the building name for a given lab |
| `/api/media-by-lab` | GET | `?lab_id=` | Returns all media documents for a lab from Firestore |
| `/api/lab-members` | GET | `?lab_id=` | Returns the members array for a lab from Firestore |
| `/api/process-model` | POST | 3D model file | Parses GLTF/GLB and returns mesh/animation metadata |
| `/api/test-firestore` | GET | — | Connectivity test for Firestore (development only) |

---

## 10. Data Models

Defined in `types/index.ts`.

```ts
interface Lab {
  id: string;
  name: string;
  location: string;      // building name
  biography: string;
  start_date: string;
  end_date: string | null;
  SDGs: string[];
  members: string[];
}

interface Media {
  id: string;
  title: string;
  author: string;
  lab_id: string;
  content_url: string;
  published: boolean;
}

interface SDG {
  id: number;
  name: string;
}
```

---

*Last updated: March 2026. Maintained by the Living Labs development team.*
