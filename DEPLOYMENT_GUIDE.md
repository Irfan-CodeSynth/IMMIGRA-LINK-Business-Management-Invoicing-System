# IMMIGRA LINK BUSINESS SERVICES — Complete Production Deployment Guide

This guide takes you step-by-step through:
1. **Setting up a Cloud Database on MongoDB Atlas** (Free M0 Cluster)
2. **Creating & Pushing to a Private GitHub Repository**
3. **Deploying the Frontend to Vercel** (Free Global Edge CDN)
4. **Deploying the Backend API** (Render.com or Railway)
5. **Final Production Verification & DNS Setup**

---

## Part 1: Setting up MongoDB Atlas (Cloud Database)

MongoDB Atlas gives you a free forever 512 MB cloud database cluster hosted in the cloud (AWS/Google Cloud/Azure).

### Step 1.1: Create Account & Cluster
1. Visit [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register) and sign up (or log in).
2. Click **Create** to create a new cluster.
3. Choose the **M0 Free** tier.
4. Select a region close to your users (e.g. `me-central-1` UAE/Bahrain, or `eu-central-1` Frankfurt).
5. Name your cluster (e.g., `immigra-cluster`) and click **Create Deployment**.

### Step 1.2: Set Up Database User Credentials
1. In the **Security Quickstart** screen:
   - **Username:** `admin` (or your preferred username)
   - **Password:** Generate or enter a strong password (e.g., `Immigra2026SecurePass!`).
   - Click **Create Database User**. *(Save this password in a safe place).*

### Step 1.3: Configure Network Access (IP Whitelist)
1. In the **Where would you like to connect from?** section:
   - Choose **Cloud Environment** or click **Add IP Address**.
   - Enter `0.0.0.0/0` (Allow Access from Anywhere) so your cloud deployment servers (Vercel/Render) can connect.
   - Description: `Allow Cloud Platforms`.
   - Click **Add Entry**.

### Step 1.4: Obtain Your Connection String
1. Go to **Database Deployments** and click **Connect**.
2. Select **Drivers** (Node.js).
3. Copy your connection string. It will look like this:
   ```text
   mongodb+srv://admin:<password>@immigra-cluster.xxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<password>` with your actual password, and append the database name `/immigra_link`:
   ```text
   mongodb+srv://admin:Immigra2026SecurePass!@immigra-cluster.xxxx.mongodb.net/immigra_link?retryWrites=true&w=majority
   ```
   *(Keep this URI ready for Part 4).*

---

## Part 2: Creating a Private GitHub Repository & Pushing Code

Your project already has `.gitignore` configured to ensure no sensitive credentials or build files are committed.

### Step 2.1: Create a New Private Repository on GitHub
1. Open your browser and go to [https://github.com/new](https://github.com/new).
2. Enter **Repository name**: `immigra-link-system` (or any name you like).
3. Select **Private** 🔒.
4. **DO NOT** check "Add a README file", ".gitignore", or "license" (we already have them).
5. Click **Create repository**.
6. Copy the repository URL (e.g., `https://github.com/YOUR_USERNAME/immigra-link-system.git`).

### Step 2.2: Commit and Push from Your Terminal
Open PowerShell in the project directory (`c:\Users\HP\Desktop\IMMIGRA LINK — Business Management & Invoicing System`) and run:

```powershell
# 1. Stage all files
git add .

# 2. Create the initial commit
git commit -m "feat: complete IMMIGRA LINK business management & invoicing system"

# 3. Rename branch to main
git branch -M main

# 4. Add your private GitHub repository as remote (replace with your actual URL)
git remote add origin https://github.com/YOUR_USERNAME/immigra-link-system.git

# 5. Push to GitHub
git push -u origin main
```

*(If prompted, log in with your GitHub account or Personal Access Token).*

---

## Part 3: Deploying the Backend API (Render.com)

Render provides continuous Node.js hosting with persistent connections, which is required for Express and MongoDB connections.

### Step 3.1: Create Web Service on Render
1. Go to [https://render.com](https://render.com) and sign in with GitHub.
2. Click **New +** → **Web Service**.
3. Select your private GitHub repository: `immigra-link-system`.
4. Configure the settings:
   - **Name:** `immigra-link-api`
   - **Region:** Frankfurt (EU Central) or closest to UAE
   - **Branch:** `main`
   - **Root Directory:** *(leave blank)*
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build:shared && npm run build:server`
   - **Start Command:** `node server/dist/server.js`
   - **Instance Type:** `Free`

### Step 3.2: Set Environment Variables on Render
Under the **Environment Variables** tab, add:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MONGODB_URI` | `mongodb+srv://admin:...@.../immigra_link?retryWrites=true&w=majority` *(From Part 1)* |
| `JWT_SECRET` | `your_super_secret_jwt_key_random_string_2026` |

5. Click **Create Web Service**.
6. Render will build and deploy your API. Once finished, you will receive a public URL, for example:
   ```text
   https://immigra-link-api.onrender.com
   ```
   Test it by opening `https://immigra-link-api.onrender.com/health` in your browser. You should see `{"status":"ok", ...}`.

---

## Part 4: Deploying the Frontend to Vercel

Vercel provides instant edge deployment, global SSL, and fast static loading for React/Vite.

### Step 4.1: Import Project on Vercel
1. Go to [https://vercel.com](https://vercel.com) and log in with GitHub.
2. Click **Add New...** → **Project**.
3. Locate your private repository `immigra-link-system` and click **Import**.

### Step 4.2: Configure Project Settings
In the configuration modal:
- **Framework Preset:** `Vite`
- **Root Directory:** Click "Edit" and choose `client` (or leave as root with the included `vercel.json`).
  *(Recommended: Set Root Directory to `client`)*

If Root Directory is set to `client`:
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### Step 4.3: Add Frontend Environment Variables
Expand the **Environment Variables** section and add:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://immigra-link-api.onrender.com/api` *(Your Render backend URL from Part 3)* |

4. Click **Deploy**.
5. Vercel will build the frontend and provide your live URL:
   ```text
   https://immigra-link-system.vercel.app
   ```

---

## Part 5: Final Production Verification

1. Open your live Vercel URL in your browser: `https://immigra-link-system.vercel.app`
2. Log in using the seeded administrative credentials:
   - **Email:** `admin@immigralink.ae`
   - **Password:** `admin123`
3. Verify all key features:
   - **Dashboard:** Confirm KPIs load from MongoDB Atlas.
   - **Invoices:** Open reference invoice `INV/MAIN/1165` and test A4 PDF generation.
   - **QR Verification:** Scan the QR code or click verify to view the public verification page.
   - **Mobile View:** Test on your phone or toggle Chrome DevTools device mode.
4. **Security Reminder:** After logging in for the first time, go to **Staff & Roles** and update the default password for the Super Admin account.
