# Deployment Guide untuk Ploi

## 🚨 Perbaikan Error: Vite Manifest Not Found

Error ini terjadi karena asset frontend belum di-build di server production. Berikut cara mengatasinya:

## ✅ Solusi Lengkap

### Opsi 1: Setup Deployment Script di Ploi Dashboard (RECOMMENDED)

1. **Login ke Ploi Dashboard**
2. **Pilih site Anda** (staging.xboard.xplay.my.id)
3. **Pergi ke tab "Deployments"**
4. **Edit Deployment Script** dan ganti dengan:

```bash
cd /home/ploi/staging.xboard.xplay.my.id

# Pull latest code
git pull origin main

# Install Composer dependencies
composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

# Install NPM dependencies
npm ci --omit=dev

# Build frontend assets (PENTING!)
npm run build

# Run migrations
php artisan migrate --force

# Clear and cache
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set permissions
chmod -R 775 storage bootstrap/cache

echo "✅ Deployment completed!"
```

5. **Save Script**
6. **Click "Deploy Now"**

### Opsi 2: Manual Deployment via SSH

1. **SSH ke server:**
   ```bash
   ssh ploi@staging.xboard.xplay.my.id
   ```

2. **Navigasi ke direktori:**
   ```bash
   cd /home/ploi/staging.xboard.xplay.my.id
   ```

3. **Jalankan deployment script:**
   ```bash
   bash deploy.sh
   ```

   Atau manual:
   ```bash
   git pull origin main
   composer install --no-dev --optimize-autoloader
   npm ci --omit=dev
   npm run build
   php artisan migrate --force
   php artisan optimize
   ```

### Opsi 3: Deploy dari Local (Tidak Disarankan)

Jika Anda ingin build di local dan commit build folder (NOT RECOMMENDED):

1. **Edit .gitignore**, hapus baris:**
   ```
   /public/build
   ```

2. **Build di local:**
   ```bash
   npm run build
   ```

3. **Commit dan push:**
   ```bash
   git add .
   git commit -m "Add production build"
   git push
   ```

⚠️ **WARNING:** Opsi 3 tidak disarankan karena:
- Build folder akan sangat besar
- Akan ada conflict setiap kali build
- Best practice adalah build di server

## 📋 Environment Variables yang Diperlukan

Pastikan file `.env` di server production memiliki:

```env
APP_NAME="XBoard"
APP_ENV=production
APP_KEY=base64:your-generated-key-here
APP_DEBUG=false
APP_URL=https://staging.xboard.xplay.my.id

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Vite (PENTING!)
VITE_APP_NAME="${APP_NAME}"
```

## 🔑 Generate APP_KEY di Server

Jika belum ada APP_KEY:

```bash
cd /home/ploi/staging.xboard.xplay.my.id
php artisan key:generate
```

## 🧪 Verifikasi Deployment

Setelah deploy, cek:

1. **File manifest ada:**
   ```bash
   ls -la /home/ploi/staging.xboard.xplay.my.id/public/build/manifest.json
   ```

2. **Permissions:**
   ```bash
   ls -la storage/
   ```

3. **Akses website:**
   ```
   https://staging.xboard.xplay.my.id
   ```

## 🐛 Troubleshooting

### Error: "Vite manifest not found"
**Penyebab:** Asset belum di-build
**Solusi:** Jalankan `npm run build` di server

### Error: "npm: command not found"
**Penyebab:** Node.js belum terinstall di server
**Solusi:** Install Node.js melalui Ploi dashboard (Server > Node.js)

### Error: "Permission denied"
**Penyebab:** Permission storage/cache salah
**Solusi:**
```bash
chmod -R 775 storage bootstrap/cache
chown -R ploi:ploi storage bootstrap/cache
```

### Build terlalu lama/timeout
**Penyebab:** Server RAM kurang
**Solusi:**
1. Upgrade server RAM di Ploi
2. Atau build di local dan commit (Opsi 3)

## 📝 Catatan Penting

1. **Selalu backup database** sebelum deploy:
   ```bash
   php artisan backup:run
   ```

2. **Test di staging** sebelum production

3. **Monitor logs** setelah deploy:
   ```bash
   tail -f storage/logs/laravel.log
   ```

4. **Clear browser cache** setelah deploy untuk melihat perubahan

## 🔄 Auto Deployment (Optional)

Untuk auto-deploy saat push ke GitHub:

1. **Di Ploi Dashboard:**
   - Site Settings > Deployments
   - Enable "Deploy when code is pushed"
   - Pilih branch (main/master)

2. **Pastikan deployment script sudah benar** (lihat Opsi 1)

3. **Setiap kali push ke GitHub**, Ploi akan otomatis deploy

## 📞 Need Help?

Jika masih ada masalah:
1. Check Ploi deployment logs
2. Check Laravel logs: `storage/logs/laravel.log`
3. Check server error logs melalui Ploi dashboard
