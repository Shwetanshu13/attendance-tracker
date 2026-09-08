# Practice Attendance ⚽⏱️

A modern, full-stack QR-based attendance tracking web application built specifically for football/sports practices. It replaces manual Excel sheets with fast, tamper-resistant QR check-in, real-time lateness calculation, member branch management, and habitual lateness analytics.

---

## 🌟 Key Features

- **⚡ Fast QR Code Check-in**:
  - Coach creates a practice session specifying the start time.
  - Generates a full-screen, high-contrast QR code for players to scan at the pitch.
  - Native smartphone camera scan opens `/attend/[qrToken]` for instant auto-check-in.
  - Integrated in-app camera scanner modal also available on the player dashboard.
- **⏱️ Automated Lateness Tracking**:
  - Server-side timestamp verification against session start time.
  - Configurable grace period (default: 5 minutes via `GRACE_PERIOD_MINUTES`).
  - Automatic classification (`On Time` vs `Late (+X min)`).
  - One scan per player per session enforced by database unique constraint `(userId, sessionId)`.
  - Instant session expiration: expired QR codes reject further scans.
- **🔒 Strict College Domain Authentication**:
  - Google OAuth powered by NextAuth v5 (Auth.js).
  - Strict domain enforcement via `ALLOWED_EMAIL_DOMAIN` (e.g. `@nitdelhi.ac.in`). Any attempt to sign in with an unauthorized email domain is blocked.
  - First-login automatic user provisioning.
  - Automatic admin privilege assignment via `ADMIN_EMAILS` env var.
- **🛡️ Comprehensive Admin & Analytics Hub**:
  - **Session Management**: Generate, project, and expire session QR codes.
  - **Player Management**: Filter by branch and role, promote/demote admins, update academic branch assignments.
  - **Attendance Logs**: Filterable by date range, player, branch, and status with one-click **CSV Export**.
  - **Regularly Late Analysis**: Identifies chronic latecomers with attendance rates, delay counts, and average tardiness.
- **🎨 Rich Sports Aesthetic**:
  - Pitch-dark palette with glowing emerald grass accents, amber delay indicators, glassmorphic cards, and fully responsive layouts.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) + TypeScript + React 19
- **Authentication**: [NextAuth.js v5 (Auth.js)](https://authjs.dev/) with Google OAuth Provider
- **Database & ORM**: [Neon PostgreSQL](https://neon.tech/) / [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) with [Drizzle ORM](https://orm.drizzle.team/) & `drizzle-kit`
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **QR Generation & Scanning**: `qrcode` & `@yudiel/react-qr-scanner`
- **Icons & Utilities**: `lucide-react`, `date-fns`, `clsx`

---

## 📋 Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (version 18.18+ or 20+)
- `npm` (comes bundled with Node.js)
- A Google Cloud account for OAuth
- A free [Neon](https://neon.tech) or [Vercel](https://vercel.com) account for PostgreSQL

---

## 🚀 Step-by-Step Setup Guide

### 1. Clone & Install Dependencies

```bash
cd practice-attendance
npm install
```

---

### 2. Set Up PostgreSQL Database (Neon or Vercel Postgres)

#### Option A: Using Neon (Recommended - Free Tier)
1. Go to [https://console.neon.tech](https://console.neon.tech) and sign up / log in.
2. Click **Create Project**, name it `practice-attendance`, and select a region closest to your users.
3. In the project dashboard, copy the **Connection string (pooled)**:
   ```
   postgresql://username:password@ep-xyz-pooler.region.neon.tech/neondb?sslmode=require
   ```

#### Option B: Using Vercel Postgres
1. In your Vercel Dashboard, navigate to **Storage** -> **Create Database** -> **Postgres**.
2. Go to the **.env.local** tab in the Vercel dashboard and copy `POSTGRES_URL` or `DATABASE_URL`.

---

### 3. Set Up Google OAuth 2.0 Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., `NITD Practice Attendance`).
3. Navigate to **APIs & Services** > **OAuth consent screen**:
   - Choose **External** (or **Internal** if using a Google Workspace organization account).
   - Fill in App name (`Practice Attendance`), user support email, and developer contact email.
   - Under **Scopes**, add `userinfo.email` and `userinfo.profile`.
   - If User Type is **External**, add your own email to **Test users** while testing.
4. Navigate to **APIs & Services** > **Credentials**:
   - Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `Practice Attendance Web Client`.
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for local development)
     - `https://your-vercel-domain.vercel.app` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google` (for local development)
     - `https://your-vercel-domain.vercel.app/api/auth/callback/google` (for production)
5. Click **Create** and copy the **Client ID** and **Client Secret**.

---

### 4. Configure Environment Variables

Create your local environment file:

```bash
cp .env.local.example .env.local
```

Open `.env.local` and populate the values:

```env
# 1. Database Connection
DATABASE_URL="postgresql://username:password@ep-xyz-pooler.region.neon.tech/neondb?sslmode=require"

# 2. NextAuth Configuration
# Generate with: npx auth secret  or  openssl rand -base64 32
AUTH_SECRET="your-generated-random-32-char-secret"
NEXTAUTH_URL="http://localhost:3000"

# 3. Google OAuth Credentials
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-client-secret"

# 4. College Domain & Admin Setup
# Only accounts ending with this domain can log in (no fallback allowed)
ALLOWED_EMAIL_DOMAIN="@nitdelhi.ac.in"

# Comma-separated list of emails assigned the ADMIN/coach role upon first login
ADMIN_EMAILS="sports@nitdelhi.ac.in,coach@nitdelhi.ac.in"

# Lateness grace period in minutes (defaults to 5 if omitted)
GRACE_PERIOD_MINUTES="5"

# 5. Public URL (Used for QR URL generation)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

### 5. Apply Database Migrations

Push the schema directly to your PostgreSQL database using `drizzle-kit`:

```bash
npx drizzle-kit push
```

This creates the required tables:
- `users`: User profiles, academic branches, and roles (`ADMIN` / `USER`).
- `practice_sessions`: Sessions, scheduled start times, and active QR tokens.
- `attendances`: Check-in timestamps, lateness duration, and composite unique constraint.
- `accounts`, `sessions`, `verification_tokens`: NextAuth adapter tables.

---

### 6. Run the Application Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser:
- Sign in with your Google account ending in your configured domain (e.g. `@nitdelhi.ac.in`).
- If your email is listed in `ADMIN_EMAILS`, you will automatically have access to `/admin`.
- Non-admin users are directed to the player `/dashboard`.

---

## 🏟️ Core Workflows

### 1. Generating a Practice QR Code (Coach / Admin)
1. Go to **Admin** (`/admin`).
2. Pick the scheduled practice start time (defaults to current time).
3. Click **Generate QR Code**.
4. The QR code displays on screen. Admins can click **Full Screen** to project it on a field tablet or monitor.
5. Once practice check-in is over, click **Expire QR Code** to disable any further check-ins.

### 2. Player Check-in (Two Convenient Methods)
- **Method A (Native Phone Camera)**: The player opens their phone's camera, scans the QR code, and taps the link (`/attend/[qrToken]`). The web app authenticates them and confirms check-in instantly with an animated badge (`On Time` or `Late (+X min)`).
- **Method B (In-App Scanner)**: The player opens their `/dashboard`, clicks **Scan Practice QR**, and uses the built-in camera scanner.

### 3. Reviewing Attendance & Regularly Late Players
1. Navigate to `/admin/attendance`.
2. **All Practice Check-ins Tab**: Real-time log of every player check-in with exact timestamps and delays. Filter by date or branch, and download a CSV report.
3. **Regularly Late Analysis Tab**: Grouped overview showing each player's total attendances, times late, late arrival percentage, and average delay in minutes.

### 4. Player Profile & Department Selection
1. Click **Profile** in the navbar.
2. Players can update their display name and choose their academic department from the supported NIT branches:
   `CSE`, `EE`, `ECE`, `ME`, `CE`, `Aero`, `VLSI`, `AI/DS`.

---

## 🚢 Production Deployment (Vercel)

1. Push your repository to GitHub / GitLab / Bitbucket.
2. Import the project into [Vercel](https://vercel.com).
3. Add all environment variables from `.env.local` into the **Environment Variables** section in Vercel Project Settings.
4. Set `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your production domain (e.g., `https://practice-attendance.vercel.app`).
5. Update **Authorized redirect URIs** in Google Cloud Console to include your Vercel domain:
   ```
   https://practice-attendance.vercel.app/api/auth/callback/google
   ```
6. Deploy! Vercel will build and launch your application globally.

---

## 📜 License

MIT License. Developed for college football and athletic teams.
