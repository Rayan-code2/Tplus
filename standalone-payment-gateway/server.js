/**
 * ============================================================================
 * 🛡️ TETHERPLUS SECURE STANDALONE WEB3 PAYMENT GATEWAY & HOT WALLET ENGINE
 * ============================================================================
 * Subdomain: pay.tetherplus.live | Port: 5000
 * 
 * 🔒 SECURITY ARCHITECTURE:
 * - This service runs independently from the main web dashboard.
 * - Only this microservice holds the Hot Wallet Private Key (via local .env).
 * - The main GitHub repo and main website never contain private keys.
 * - API routes are protected by INTERNAL_PAYOUT_SECRET bearer token.
 * ============================================================================
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// BSC Constants
const USDT_BEP20_CONTRACT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955';
const BSC_RPC_URLS = [
  process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org/',
  'https://bsc-dataseed1.defibit.io/',
  'https://bsc-dataseed1.ninicoin.io/',
  'https://rpc.ankr.com/bsc'
];

const BEP20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

// Configuration
const HOT_WALLET_ADDRESS = process.env.HOT_WALLET_ADDRESS || '0x6b8Ff2388d4aA6D208249AfcFDb14405Fb3f4679';
const HOT_WALLET_PRIVATE_KEY = process.env.HOT_WALLET_PRIVATE_KEY || '';
const INTERNAL_SECRET = process.env.INTERNAL_PAYOUT_SECRET || 'tetherplus_secure_internal_key_2026';

function getBscProvider() {
  return new ethers.JsonRpcProvider(BSC_RPC_URLS[0]);
}

// Authentication Middleware for Payout API
function requireInternalAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  // If internal secret is configured, require match
  if (INTERNAL_SECRET && token !== INTERNAL_SECRET) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or missing internal payout secret token'
    });
  }
  next();
}

// ----------------------------------------------------------------------------
// 1. Health Check
// ----------------------------------------------------------------------------
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'TetherPlus Web3 Hot Wallet Gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ----------------------------------------------------------------------------
// 2. Get Live Hot Wallet Status (BNB Gas & USDT Balance)
// ----------------------------------------------------------------------------
app.get('/api/status', async (req, res) => {
  try {
    const provider = getBscProvider();
    let walletAddress = HOT_WALLET_ADDRESS;
    let hasPrivateKey = false;

    if (HOT_WALLET_PRIVATE_KEY && HOT_WALLET_PRIVATE_KEY.trim().length >= 64) {
      try {
        const formattedKey = HOT_WALLET_PRIVATE_KEY.trim().startsWith('0x')
          ? HOT_WALLET_PRIVATE_KEY.trim()
          : `0x${HOT_WALLET_PRIVATE_KEY.trim()}`;
        const wallet = new ethers.Wallet(formattedKey, provider);
        walletAddress = wallet.address;
        hasPrivateKey = true;
      } catch (err) {
        console.warn('[Payment Gateway] Private key parse warning:', err.message);
      }
    }

    // BNB Balance
    const bnbBalanceRaw = await provider.getBalance(walletAddress);
    const bnbBalance = parseFloat(ethers.formatEther(bnbBalanceRaw));

    // USDT BEP-20 Balance
    const usdtContract = new ethers.Contract(USDT_BEP20_CONTRACT_ADDRESS, BEP20_ABI, provider);
    let usdtBalance = 0;
    try {
      const usdtRaw = await usdtContract.balanceOf(walletAddress);
      usdtBalance = parseFloat(ethers.formatUnits(usdtRaw, 18));
    } catch (e) {
      console.warn('[Payment Gateway] USDT balance read error:', e.message);
    }

    return res.json({
      success: true,
      address: walletAddress,
      hasPrivateKey,
      bnbBalance: parseFloat(bnbBalance.toFixed(6)),
      usdtBalance: parseFloat(usdtBalance.toFixed(2)),
      network: 'Binance Smart Chain (BEP20)',
      contractAddress: USDT_BEP20_CONTRACT_ADDRESS,
      isGasReady: bnbBalance >= 0.001,
      status: bnbBalance >= 0.001 ? 'Ready for Instant Auto-Payout' : 'Gas Top-Up Required'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch Hot Wallet status from BSC blockchain'
    });
  }
});

// ----------------------------------------------------------------------------
// 3. Execute On-Chain USDT Payout to User (Protected)
// ----------------------------------------------------------------------------
app.post('/api/payout', requireInternalAuth, async (req, res) => {
  try {
    const { toAddress, amountUsdt } = req.body;

    const cleanTo = (toAddress || '').trim();
    if (!ethers.isAddress(cleanTo)) {
      return res.status(400).json({ success: false, error: `Invalid recipient address: ${toAddress}` });
    }

    const numAmount = parseFloat(amountUsdt);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, error: `Invalid USDT payout amount: ${amountUsdt}` });
    }

    if (!HOT_WALLET_PRIVATE_KEY || HOT_WALLET_PRIVATE_KEY.trim().length < 64) {
      return res.status(500).json({
        success: false,
        error: 'Hot Wallet private key is not configured in payment gateway .env file.'
      });
    }

    const formattedKey = HOT_WALLET_PRIVATE_KEY.trim().startsWith('0x')
      ? HOT_WALLET_PRIVATE_KEY.trim()
      : `0x${HOT_WALLET_PRIVATE_KEY.trim()}`;
    const provider = getBscProvider();
    const wallet = new ethers.Wallet(formattedKey, provider);

    // 1. Gas check
    const bnbBalanceRaw = await provider.getBalance(wallet.address);
    const bnbBalance = parseFloat(ethers.formatEther(bnbBalanceRaw));
    if (bnbBalance < 0.0008) {
      return res.status(400).json({
        success: false,
        error: `Insufficient BNB for Gas in Hot Wallet (${bnbBalance.toFixed(5)} BNB). Need at least 0.001 BNB.`
      });
    }

    // 2. USDT Balance check
    const usdtContract = new ethers.Contract(USDT_BEP20_CONTRACT_ADDRESS, BEP20_ABI, wallet);
    const usdtBalanceRaw = await usdtContract.balanceOf(wallet.address);
    const usdtBalance = parseFloat(ethers.formatUnits(usdtBalanceRaw, 18));

    if (usdtBalance < numAmount) {
      return res.status(400).json({
        success: false,
        error: `Insufficient USDT in Hot Wallet ($${usdtBalance.toFixed(2)} USDT available, requested $${numAmount.toFixed(2)} USDT).`
      });
    }

    // 3. Send On-Chain Transfer
    const amountWei = ethers.parseUnits(numAmount.toFixed(6), 18);
    console.log(`[Payment Gateway Payout] Sending ${numAmount} USDT to ${cleanTo} from ${wallet.address}...`);

    const tx = await usdtContract.transfer(cleanTo, amountWei);
    console.log(`[Payment Gateway Payout] Submitted Tx: ${tx.hash}`);

    const receipt = await tx.wait(1);
    console.log(`[Payment Gateway Payout] Confirmed Block ${receipt.blockNumber}: ${tx.hash}`);

    return res.json({
      success: true,
      txHash: tx.hash,
      bscscanUrl: `https://bscscan.com/tx/${tx.hash}`,
      gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Payment Gateway Error]:', error);
    return res.status(500).json({
      success: false,
      error: error?.reason || error?.message || 'Failed to dispatch blockchain transfer'
    });
  }
});

// ----------------------------------------------------------------------------
// 4. Verify Deposit On-Chain via TxHash
// ----------------------------------------------------------------------------
app.post('/api/verify-deposit', async (req, res) => {
  try {
    const { txHash, companyAddress } = req.body;
    const cleanHash = (txHash || '').trim();

    if (!cleanHash.startsWith('0x') || cleanHash.length !== 66) {
      return res.status(400).json({ valid: false, error: 'Invalid TxHash format (must be 66 chars starting with 0x)' });
    }

    const provider = getBscProvider();
    const txReceipt = await provider.getTransactionReceipt(cleanHash);

    if (!txReceipt) {
      return res.status(404).json({
        valid: false,
        error: 'Transaction not found on BSC yet. Please wait a few seconds.'
      });
    }

    if (txReceipt.status !== 1) {
      return res.status(400).json({ valid: false, error: 'Transaction failed on blockchain (reverted).' });
    }

    const iface = new ethers.Interface(BEP20_ABI);
    const targetComp = (companyAddress || HOT_WALLET_ADDRESS).toLowerCase();

    let foundTransfer = false;
    let transferredAmount = 0;
    let senderAddress = '';

    for (const log of txReceipt.logs) {
      if (log.address.toLowerCase() === USDT_BEP20_CONTRACT_ADDRESS.toLowerCase()) {
        try {
          const parsed = iface.parseLog({ topics: log.topics, data: log.data });
          if (parsed && parsed.name === 'Transfer') {
            const [from, to, value] = parsed.args;
            if (to.toLowerCase() === targetComp) {
              foundTransfer = true;
              transferredAmount = parseFloat(ethers.formatUnits(value, 18));
              senderAddress = from;
              break;
            }
          }
        } catch (e) {}
      }
    }

    if (!foundTransfer) {
      return res.status(400).json({
        valid: false,
        error: `Transaction confirmed on BSC, but no USDT transfer to company wallet (${companyAddress || HOT_WALLET_ADDRESS}) was found.`
      });
    }

    return res.json({
      valid: true,
      amount: transferredAmount,
      from: senderAddress,
      to: targetComp,
      blockNumber: txReceipt.blockNumber,
      txHash: cleanHash
    });
  } catch (error) {
    return res.status(500).json({
      valid: false,
      error: error.message || 'Error querying BSC blockchain node'
    });
  }
});

// ----------------------------------------------------------------------------
// 5. Standalone Web3 Checkout Page (Interactive UI)
// ----------------------------------------------------------------------------
app.get('/checkout', (req, res) => {
  const amount = req.query.amount || '50';
  const userId = req.query.userId || 'NX-USER';
  const returnUrl = req.query.returnUrl || 'https://tetherplus.live/#/dashboard';
  const depositAddress = HOT_WALLET_ADDRESS;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TetherPlus Secure Web3 Payment Gateway</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Space Grotesk', sans-serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4">
  <div class="max-w-md w-full bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl shadow-cyan-950/50 relative overflow-hidden">
    <!-- Glow Accent -->
    <div class="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl"></div>
    <div class="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl"></div>

    <!-- Header -->
    <div class="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-amber-500 flex items-center justify-center font-bold text-black text-lg shadow-lg">
          T+
        </div>
        <div>
          <h1 class="font-bold text-lg text-white leading-tight">TetherPlus Gateway</h1>
          <p class="text-xs text-cyan-400 font-mono">pay.tetherplus.live</p>
        </div>
      </div>
      <span class="px-2.5 py-1 text-xs font-mono rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
        ● BEP-20 Live
      </span>
    </div>

    <!-- Amount Badge -->
    <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-center mb-6">
      <p class="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Total Payable Amount</p>
      <div class="text-3xl font-extrabold text-cyan-300 font-mono tracking-tight">$${amount} <span class="text-lg text-slate-400">USDT</span></div>
      <p class="text-[11px] text-slate-500 mt-1">Binance Smart Chain (BEP-20 Network Only)</p>
    </div>

    <!-- QR Code & Address -->
    <div class="flex flex-col items-center justify-center bg-white rounded-xl p-4 mb-4 shadow-inner">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${depositAddress}" alt="Deposit QR Code" class="w-44 h-44 rounded-lg" />
    </div>

    <div class="bg-slate-950 border border-slate-800 rounded-xl p-3 mb-6">
      <div class="flex justify-between items-center mb-1">
        <span class="text-xs text-slate-400">Deposit Address (BEP-20)</span>
        <button id="copyBtn" onclick="copyAddress()" class="text-xs text-cyan-400 hover:text-cyan-300 font-medium">Copy</button>
      </div>
      <p id="addressText" class="font-mono text-xs text-slate-200 break-all bg-slate-900/90 p-2 rounded border border-slate-800/80">
        ${depositAddress}
      </p>
    </div>

    <!-- Manual TxID Submission -->
    <div class="space-y-3 mb-6">
      <div>
        <label class="block text-xs font-medium text-slate-400 mb-1">Transaction Hash (TXID)</label>
        <input id="txHashInput" type="text" placeholder="0x..." class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400" />
      </div>
      <button id="verifyBtn" onclick="verifyTx()" class="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm rounded-xl transition duration-200 shadow-lg shadow-cyan-500/20">
        Verify & Complete Deposit
      </button>
      <div id="statusMsg" class="text-xs text-center font-medium hidden"></div>
    </div>

    <!-- Footer Redirect -->
    <div class="text-center border-t border-slate-800/80 pt-4">
      <a href="${returnUrl}" class="text-xs text-slate-400 hover:text-slate-200 transition">
        ← Cancel & Return to Dashboard
      </a>
    </div>
  </div>

  <script>
    function copyAddress() {
      const addr = document.getElementById('addressText').innerText.trim();
      navigator.clipboard.writeText(addr);
      const btn = document.getElementById('copyBtn');
      btn.innerText = 'Copied! ✓';
      setTimeout(() => { btn.innerText = 'Copy'; }, 2000);
    }

    async function verifyTx() {
      const txHash = document.getElementById('txHashInput').value.trim();
      const statusMsg = document.getElementById('statusMsg');
      const verifyBtn = document.getElementById('verifyBtn');

      if (!txHash.startsWith('0x') || txHash.length !== 66) {
        statusMsg.className = 'text-xs text-center font-medium text-amber-400';
        statusMsg.innerText = '⚠️ Please enter a valid 66-character BSC Transaction Hash (0x...)';
        statusMsg.classList.remove('hidden');
        return;
      }

      verifyBtn.disabled = true;
      verifyBtn.innerText = 'Verifying on Binance Smart Chain...';
      statusMsg.className = 'text-xs text-center font-medium text-cyan-400';
      statusMsg.innerText = 'Querying blockchain node...';
      statusMsg.classList.remove('hidden');

      try {
        const res = await fetch('/api/verify-deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ txHash, companyAddress: '${depositAddress}' })
        });
        const data = await res.json();

        if (data.valid) {
          statusMsg.className = 'text-xs text-center font-medium text-emerald-400';
          statusMsg.innerText = '✅ Payment Verified! Transferred ' + data.amount + ' USDT. Redirecting...';
          setTimeout(() => {
            window.location.href = '${returnUrl}?depositSuccess=true&txHash=' + txHash + '&amount=' + data.amount;
          }, 1500);
        } else {
          statusMsg.className = 'text-xs text-center font-medium text-rose-400';
          statusMsg.innerText = '❌ ' + (data.error || 'Verification failed');
          verifyBtn.disabled = false;
          verifyBtn.innerText = 'Verify & Complete Deposit';
        }
      } catch (err) {
        statusMsg.className = 'text-xs text-center font-medium text-rose-400';
        statusMsg.innerText = 'Network error verifying transaction. Please try again.';
        verifyBtn.disabled = false;
        verifyBtn.innerText = 'Verify & Complete Deposit';
      }
    }
  </script>
</body>
</html>`;

  res.send(html);
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🛡️ TetherPlus Web3 Payment Gateway listening on port ${PORT}`);
  console.log(`📡 BSC Hot Wallet Address: ${HOT_WALLET_ADDRESS}`);
  console.log(`⚡ Standalone Checkout available at: http://localhost:${PORT}/checkout`);
});
