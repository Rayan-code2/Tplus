# 🛡️ TetherPlus Standalone Web3 Payment Gateway & Hot Wallet Engine

Yeh standalone microservice aapke **Hostinger VPS** par `pay.tetherplus.live` (Port: 5000) par chalega.
Iska mukhya maksad hai:
1. **100% Security Isolation**: Hot Wallet ki Private Key sirf is folder ke `.env` me rahegi, GitHub repo me kabhi nahi jayegi.
2. **Automated On-Chain USDT Payout**: Main website se request aate hi BSC Smart Contract ke zariye instant USDT transfer execute karega.
3. **Hosted Web3 Checkout Page**: User ke liye QR Code + Direct Metamask payment screen provide karega (`https://pay.tetherplus.live/checkout`).

---

## 🚀 VPS Setup Guide (Step-by-Step)

### Step 1: VPS Par Folder Create Karein & Files Dalein
```bash
# 1. Folder banayein
mkdir -p /var/www/payment-gateway
cd /var/www/payment-gateway

# 2. Ye 3 files upload ya copy karein:
# - server.js
# - package.json
# - ecosystem.config.js

# 3. Dependencies install karein
npm install
```

---

### Step 2: `.env` File Banayein (Private Key Set Karein)
```bash
nano /var/www/payment-gateway/.env
```

Is file me apni naye SafePal/TrustWallet Hot Wallet ki details dalein:
```env
PORT=5000
HOT_WALLET_ADDRESS="0xApnaNayaWalletAddress"
HOT_WALLET_PRIVATE_KEY="ApnaNayaWalletKi64CharPrivateKey"
INTERNAL_PAYOUT_SECRET="tetherplus_secure_internal_key_2026"
BSC_RPC_URL="https://bsc-dataseed.binance.org/"
```
*(Save karne ke liye: `Ctrl + O`, Enter, phir `Ctrl + X`)*

---

### Step 3: PM2 se Service Start Karein
```bash
cd /var/www/payment-gateway
pm2 start ecosystem.config.js
pm2 save
```

Check karne ke liye:
```bash
pm2 status
curl http://localhost:5000/health
```

---

### Step 4: Nginx Configuration (`pay.tetherplus.live`)
Apne VPS par Nginx config file banayein:
```bash
sudo nano /etc/nginx/sites-available/pay.tetherplus.live
```

Yeh config paste karein:
```nginx
server {
    listen 80;
    server_name pay.tetherplus.live;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable karein aur SSL lagayein:
```bash
sudo ln -s /etc/nginx/sites-available/pay.tetherplus.live /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Free SSL Certificate
sudo certbot --nginx -d pay.tetherplus.live
```

---

### Step 5: Main Website (`/var/www/tetherplus/.env`) se Link Karein
Apne main website ke folder me jayein:
```bash
nano /var/www/tetherplus/.env
```
Wahan ye 2 lines add karein:
```env
PAYMENT_GATEWAY_URL="http://127.0.0.1:5000"
PAYMENT_GATEWAY_SECRET="tetherplus_secure_internal_key_2026"
```
Aur main website ko restart karein:
```bash
pm2 restart tetherplus-main
```

---

## 🎯 Ab Kya Hoga:
- Main website user ko instantly payout kar payegi `http://127.0.0.1:5000` ke zariye.
- GitHub par aap bina kisi dar ke code push kar sakte hain kyunki **GitHub repo me 0% secrets/private keys hain!**
