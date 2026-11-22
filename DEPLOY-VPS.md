# Go live on Hostinger or any VPS (Next.js version)

Upload package: `D:\Engisoft\engisoft-nextjs-deploy.zip`. Node.js 20.9 or newer is required (22 or 24 LTS recommended).

---

## A. Hostinger VPS (recommended)

When you set up the VPS in hPanel › VPS › **OS & Panel**, choose one of:
- **Ubuntu 22.04 with aaPanel**: aaPanel is pre-installed; skip steps 1–3 of DEPLOY-AAPANEL.md and continue from step 4.
- **Ubuntu 24.04 with CloudPanel**: CloudPanel › Add Site › **Create a Node.js Site**: domain `engisoftengineering.com`,
  Node.js 22, app port 3000. Upload and unzip the package into the site's root, then in the CloudPanel SSH terminal as the site user:
  `npm install && npm run build`, and start it with PM2 (see section C, step 4). Issue the Let's Encrypt certificate under the site's SSL/TLS tab.
- **Plain Ubuntu 24.04**: follow section C.

## B. Hostinger web hosting (Business, Cloud) — Node.js web app

hPanel › Websites › **Add website** › **Node.js web app** › upload the zip (or connect GitHub):
- Framework / application type: **Next.js** (`next`)
- Node.js version: **22.x** (or 24.x)
- Build command: `npm run build`; output directory: `.next`
- Then attach the domain and SSL in hPanel.

Hostinger builds Next.js in "standalone" mode and starts the server itself. After the first deploy,
check: the design loads (public/assets), /about-us/ redirects to /about/, and the Contact form works.
If anything is missing, use a VPS (A or C) instead: it runs the app exactly as tested locally.

## C. Any VPS (Hostinger, DigitalOcean, Contabo, Hetzner, AWS Lightsail …) — manual setup

Ubuntu 22.04/24.04, SSH as root.

1. **Node.js 22 and tools**
   ```
   curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
   apt install -y nodejs nginx unzip
   npm install -g pm2
   ```
2. **Upload and unzip** (from your PC, PowerShell):
   ```
   scp D:\Engisoft\engisoft-nextjs-deploy.zip root@YOUR_SERVER_IP:/var/www/
   ```
   On the server:
   ```
   mkdir -p /var/www/engisoft && cd /var/www/engisoft && unzip ../engisoft-nextjs-deploy.zip
   ```
3. **Install and build**
   ```
   npm install && npm run build
   ```
   (If the build is "Killed": add 2 GB swap: `fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile`)
4. **Run it permanently with PM2**
   ```
   pm2 start npm --name engisoft -- start
   pm2 save && pm2 startup
   ```
5. **Nginx in front** — create `/etc/nginx/sites-available/engisoft`:
   ```
   server {
     listen 80;
     server_name engisoftengineering.com www.engisoftengineering.com;
     client_max_body_size 20m;
     location / {
       proxy_pass http://127.0.0.1:3000;
       proxy_set_header Host $host;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
     }
   }
   ```
   then:
   ```
   ln -s /etc/nginx/sites-available/engisoft /etc/nginx/sites-enabled/ && rm -f /etc/nginx/sites-enabled/default
   nginx -t && systemctl reload nginx
   ```
6. **DNS**: `A` records `@` and `www` → YOUR_SERVER_IP.
7. **HTTPS (free)**:
   ```
   apt install -y certbot python3-certbot-nginx
   certbot --nginx -d engisoftengineering.com -d www.engisoftengineering.com --redirect
   ```
8. **Firewall**: `ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw enable`
9. **Emails from the forms (optional)**: create `/var/www/engisoft/.env.local` from `.env.example`
   with your SMTP details, then `pm2 restart engisoft`.

**Updating later:** upload changed files, `npm run build`, `pm2 restart engisoft`.

---

After any option: test the site (design, dropdowns, /about-us/ → /about/, /sitemap.xml, a 404 page,
the Contact form), then submit `https://engisoftengineering.com/sitemap.xml` in Google Search Console.
⚠️ Pointing the domain to the new server replaces the current WordPress site: back it up first.
