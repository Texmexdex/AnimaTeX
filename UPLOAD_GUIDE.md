# 📤 GitHub Upload Guide - Batch Upload Instructions

GitHub has a limit of 100 files per upload. Since we have 143 files, we need to upload in batches.

## 🎯 Upload Strategy

### Batch 1: Core Application (without images)
Upload everything EXCEPT the image folders first.

### Batch 2: Favicon Images
Upload the favicon folder.

### Batch 3: Logo Images
Upload the logo-frames folder.

## 📋 Step-by-Step Instructions

### Step 1: Create GitHub Repository
1. Go to GitHub.com
2. Click "New Repository"
3. Name it (e.g., "animatex-studio")
4. Make it **Public** (required for free GitHub Pages)
5. **DO NOT** initialize with README
6. Click "Create Repository"

### Step 2: Upload Batch 1 - Core Files

**Upload these files/folders:**
- `.github/` folder (1 file inside)
- `components/` folder (4 files)
- `public/logo.svg` (just this one file from public)
- All root files:
  - `.gitignore`
  - `App.tsx`
  - `build.bat`
  - `constants.ts`
  - `index.css`
  - `index.html`
  - `index.tsx`
  - `package.json`
  - `README.md`
  - `start.bat`
  - `tsconfig.json`
  - `types.ts`
  - `vite.config.ts`

**How to upload:**
1. Click "uploading an existing file"
2. Drag and drop the files/folders listed above
3. **DO NOT include `public/favicon/` or `public/logo-frames/` yet**
4. Commit message: "Initial commit - Core application"
5. Click "Commit changes"

### Step 3: Upload Batch 2 - Favicon Images

1. In your repository, navigate to `public/`
2. Click "Add file" → "Upload files"
3. Create a folder by typing `favicon/` in the file path
4. Upload all 62 PNG files from `public/favicon/`
5. Commit message: "Add favicon animation frames"
6. Click "Commit changes"

### Step 4: Upload Batch 3 - Logo Images

1. In your repository, navigate to `public/`
2. Click "Add file" → "Upload files"
3. Create a folder by typing `logo-frames/` in the file path
4. Upload all 62 PNG files from `public/logo-frames/`
5. Commit message: "Add logo animation frames"
6. Click "Commit changes"

### Step 5: Enable GitHub Pages

1. Go to Settings → Pages
2. Source: Select "GitHub Actions"
3. Wait 2-3 minutes for deployment
4. Your site will be live!

## 🚀 Alternative: Use Git Command Line

If you're comfortable with command line:

```bash
cd github-deploy

# Initialize git
git init
git add .
git commit -m "Initial commit - AnimaTeX Studio"

# Add remote (replace with your URL)
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git

# Push
git branch -M main
git push -u origin main
```

This uploads everything at once via Git (no file limit).

## 📊 File Count by Batch

- **Batch 1:** ~20 files (core app)
- **Batch 2:** 62 files (favicon)
- **Batch 3:** 62 files (logo-frames)
- **Total:** 144 files

## ✅ Verification

After all uploads, your repository should have:
```
your-repo/
├── .github/workflows/deploy.yml
├── components/ (4 files)
├── public/
│   ├── favicon/ (62 files)
│   ├── logo-frames/ (62 files)
│   └── logo.svg
├── .gitignore
├── App.tsx
├── build.bat
├── constants.ts
├── index.css
├── index.html
├── index.tsx
├── package.json
├── README.md
├── start.bat
├── tsconfig.json
├── types.ts
└── vite.config.ts
```

## 💡 Tips

- **Use Git CLI** if possible (no file limits)
- **Upload in order** (core first, then images)
- **Check Actions tab** after upload to see deployment status
- **Wait 2-3 minutes** for first deployment

---

**Recommended:** Use Git command line for easiest upload!
