# 🚀 Chardho Car Rental - Deployment Guide

This document outlines the steps to deploy the finalized **Chardho Car Rental System** to a live production server.

## 1. Prerequisites
*   **Web Server**: Apache or Nginx.
*   **PHP**: 7.4, 8.0, 8.1, or 8.2+ (The core has been modernized to support the latest versions).
*   **Database**: MySQL or MariaDB.
*   **Extensions**: Ensure `mysqli`, `mbstring`, `iconv`, and `curl` are enabled.

## 2. Server Configuration
### Apache (.htaccess)
The project includes a `.htaccess` file in the root. Ensure **mod_rewrite** is enabled on your server.
```apache
RewriteEngine on
RewriteCond $1 !^(index\.php|resources|robots\.txt)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php/$1 [L,QSA]
```

### Nginx Configuration
If using Nginx, use the following location block:
```nginx
location / {
    try_files $uri $uri/ /index.php/$args;
}
```

## 3. Database Migration
1.  Export your local database `car_rental` to a `.sql` file.
2.  Import the `.sql` file into your production MySQL database.
3.  Update the configuration in `application/config/database.php`:
    *   `hostname`: Your DB host.
    *   `username`: Your DB user.
    *   `password`: Your DB password.
    *   `database`: `car_rental`.

## 4. Application Configuration
1.  **Base URL**: Open `application/config/config.php`. The `base_url` is already set to be dynamic, but for production, you can hardcode it for security:
    ```php
    $config['base_url'] = 'https://yourdomain.com/';
    ```
2.  **Environment**: Open `index.php` and set the environment to `production` to hide errors from end-users:
    ```php
    define('ENVIRONMENT', 'production');
    ```

## 5. File Permissions
Ensure the following directories are writable by the web server:
*   `application/logs/`
*   `application/cache/`
*   `public/assets/img/` (for car image uploads)

## 6. Security Checklist
*   [ ] Change the default administrator password in the **Profile** section.
*   [ ] Ensure `install/` directory is deleted after the first successful setup.
*   [ ] Verify `public/assets/css/chardho_main.css` is loading correctly.

---
**Congratulations!** Your high-fidelity, modernized car rental system is now ready for the world.
