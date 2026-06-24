# MAEVIS Coming Soon Page

A highly polished, responsive, and cybernetic-themed static "Coming Soon" page for `maevis.in`. Designed to match the OKLCH-based theme surfaces, modern typography (Space Grotesk, Barlow Condensed, JetBrains Mono), CRT scanlines, and animated widgets of the main website.

Features a live countdown, dual system clocks (UTC + Local), automated terminal console logger, and an interactive email subscriber system with access code generation (persisted via `localStorage`).

---

## Deployment to Vercel with Custom Domain

Follow these steps to push these files to a new GitHub repository and publish them via Vercel.

### 1. Initialize Git and Commit Locally

Open your terminal, navigate to this folder, and run:

```bash
# Initialize a local Git repository
git init

# Add all files (index.html, style.css, script.js, logo.png, favicon.svg, README.md)
git add .

# Create the initial commit
git commit -m "Initial commit: MAEVIS Coming Soon Portal"
```

### 2. Push to GitHub

1. Go to [GitHub](https://github.com) and create a **new public or private repository** (do NOT check "Add a README", "Add .gitignore", or choose a license since we already have local files).
2. Copy the repository URL (e.g., `https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git`).
3. Run the following commands in your terminal to link and push your code:

```bash
# Rename default branch to main
git branch -M main

# Link your local repo to GitHub (replace with your actual GitHub URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push the code to GitHub
git push -u origin main
```

### 3. Deploy to Vercel

1. Log in to [Vercel](https://vercel.com). If you don't have an account, sign up and link it with your GitHub account.
2. From the Vercel Dashboard, click **Add New...** and select **Project**.
3. In the list of repositories, locate your newly created GitHub repository and click **Import**.
4. Vercel will automatically detect that this is a static project (zero config required). Leave the settings at their defaults.
5. Click **Deploy**. Your site will be live on a `*.vercel.app` subdomain in a few seconds!

### 4. Configure Your Custom Domain

To link your custom domain (e.g., `maevis.in` or `soon.maevis.in`) to the Vercel project:

1. In the Vercel dashboard, go to your new project's **Settings** tab.
2. Select **Domains** from the left-hand menu.
3. In the input box, type your custom domain and click **Add**.
4. Vercel will display the required DNS configuration. Go to your domain registrar (e.g., GoDaddy, Namecheap, Google Domains) and update your DNS records:
   - For an **Apex Domain** (like `maevis.in`): Add an **A Record** pointing `@` to `76.76.21.21`.
   - For a **Subdomain** (like `soon.maevis.in`): Add a **CNAME Record** pointing your subdomain prefix (e.g., `soon`) to `cname.vercel-dns.com`.
5. Once DNS propagates (typically within a few minutes), Vercel will generate an SSL certificate automatically, and your Coming Soon page will be live on your custom domain!
