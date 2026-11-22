# Go live with aaPanel (Next.js version)

aaPanel is a free control panel that you install on your own Linux server (VPS). It runs Node.js,
so the Next.js site runs exactly as on localhost: all 171 pages, the 301 redirects, the sitemap and
the working enquiry forms.

Upload package: `D:\Engisoft\engisoft-nextjs-deploy.zip` (201 MB; no node_modules, no build files).

## 0. What you need
- A VPS with **Ubuntu 22.04 or 24.04**, a public IP and root (or sudo) SSH access.
  2 GB RAM recommended; with 1 GB add swap (step 7 troubleshooting).
- Access to the DNS of engisoftengineering.com.
- ⚠️ The domain currently shows the WordPress site. Pointing it to the VPS (step 9) replaces that
  site for visitors. Back it up first.

## 1. Connect to the server
Windows PowerShell: `ssh root@YOUR_SERVER_IP` (accept the fingerprint, enter the password).

## 2. Install aaPanel
Copy the current install command from https://www.aapanel.com (Install button) and paste it into
the SSH window. At the time of writing it is:
```
URL=https://www.aapanel.com/script/install_7.0_en.sh && if [ -f /usr/bin/curl ];then curl -ksSO "$URL" ;else wget --no-check-certificate -O install_7.0_en.sh "$URL";fi;bash install_7.0_en.sh aapanel
```
Answer `y` when asked to install into /www. At the end it prints the **panel URL, username and
password**: save them.

## 3. Open the firewall
In your VPS provider's firewall/security group allow: **22** (SSH), **80** and **443** (website)
and the **aaPanel port** shown at the end of the install.

## 4. First login
Open the panel URL, log in. When it offers a software bundle, choose **LNMP** and install only
**Nginx** (MySQL and PHP are not needed for this site).

## 5. Install Node.js
App Store › search **Node.js version manager** › Install › open it › install **v22** (or v24 LTS).
If **PM2 Manager** is listed, install it as well.

## 6. Upload the site
Files › `/www/wwwroot/` › create folder `engisoftengineering.com` › open it › Upload
`engisoft-nextjs-deploy.zip` › right-click › **Unzip** › delete the zip.
`package.json` must be directly inside `/www/wwwroot/engisoftengineering.com/`.

## 7. Install and build
Terminal (panel menu) or SSH:
```
cd /www/wwwroot/engisoftengineering.com
npm install
npm run build
chown -R www:www /www/wwwroot/engisoftengineering.com
```
The build must end with `Generating static pages ... (176/176)`.
If it stops with "out of memory" / "Killed", add swap and build again:
```
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
```

## 8. Add the Node project
Website › **Node project** › **Add Node project**:
- Project path: `/www/wwwroot/engisoftengineering.com`
- Project name: `engisoft`
- Run command / startup: `npm start` (script "start")
- Port: `3000`
- Run user: `www`
- Node version: the one installed in step 5
- Domain: `engisoftengineering.com` and `www.engisoftengineering.com`
Submit. Status should be **Running**.

## 9. Point the domain
At your DNS provider:
- `A` record `@` → YOUR_SERVER_IP
- `A` record `www` → YOUR_SERVER_IP
Wait until `ping engisoftengineering.com` shows the new IP (minutes to a few hours).

## 10. HTTPS
Node project › engisoft › **SSL** › **Let's Encrypt** › tick both domains › Apply › turn on
**Force HTTPS**.
Then redirect `www` to the main domain (the canonical URLs have no www): project settings ›
**Redirect** › from `www.engisoftengineering.com` to `https://engisoftengineering.com` (301).

## 11. Test
- https://engisoftengineering.com/ (design, scroll animation, dropdowns)
- /bim-staffing/onsite/, /case-studies/, /insights/
- /about-us/ → redirects to /about/ (old URLs)
- /sitemap.xml and /robots.txt
- a made-up URL → ENGISOFT 404 page
- send the Contact form once

## 12. Enquiry emails (optional but recommended)
Enquiries are always saved in `/www/wwwroot/engisoftengineering.com/data/enquiries.jsonl`.
To have them emailed: create `.env.local` in the project folder (copy `.env.example`), fill in
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ENQUIRY_TO, ENQUIRY_FROM, then restart the project.

## 13. After launch
- Google Search Console: verify the domain, submit `https://engisoftengineering.com/sitemap.xml`.
- Bing Webmaster Tools: same.
- aaPanel › Cron: add a weekly **Backup site** task for the project folder.
- Keep the panel login private; aaPanel › Settings: change the panel port/entry and enable 2FA.

## Updating the site later
Upload the new files (or the new `content/` folder), then:
```
cd /www/wwwroot/engisoftengineering.com && npm run build
```
and click **Restart** on the Node project.

## Troubleshooting
- **502 Bad Gateway**: the Node project is not running. Open its log; usually the build was not run
  or another app uses port 3000 (change the port in step 8 and in package.json "start").
- **Site without styling**: `public/assets` is missing; check the unzip kept the folders.
- **Forms say they could not be sent**: the `data/` folder is not writable; run the `chown` line again.
