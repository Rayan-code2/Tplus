import { ethers } from 'ethers';

// Binance Smart Chain USDT BEP20 Contract Address
export const USDT_BEP20_CONTRACT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955';

// BSC RPC Endpoints with automatic fallback
export const BSC_RPC_URLS = [
  'https://bsc-dataseed.binance.org/',
  'https://bsc-dataseed1.defibit.io/',
  'https://bsc-dataseed1.ninicoin.io/',
  'https://rpc.ankr.com/bsc',
];

// Minimal ERC20 / BEP20 ABI for USDT
export const BEP20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

// Admin SafePal Hot Wallet Configuration
export const DEFAULT_HOT_WALLET_ADDRESS =
  process.env.BEP20_HOT_WALLET_ADDRESS || '0x6b8Ff2388d4aA6D208249AfcFDb14405Fb3f4679';
export const DEFAULT_HOT_WALLET_PRIVATE_KEY =
  process.env.BEP20_HOT_WALLET_PRIVATE_KEY || 'cce867c18d397119294c5d164abf25b24b42862286213ca8ebb934566aa09deb';

/**
 * Get an active BSC Provider
 */
export function getBscProvider(): ethers.JsonRpcProvider {
  const rpcUrl = process.env.BSC_RPC_URL || BSC_RPC_URLS[0];
  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Check Hot Wallet BNB (Gas) and USDT (BEP20) Balances
 */
export async function getHotWalletStatus(customPrivateKey?: string) {
  try {
    const privKey = customPrivateKey || DEFAULT_HOT_WALLET_PRIVATE_KEY;
    const provider = getBscProvider();

    let walletAddress = DEFAULT_HOT_WALLET_ADDRESS;
    let hasValidPrivateKey = false;

    if (privKey && privKey.trim().length >= 64) {
      try {
        const formattedKey = privKey.trim().startsWith('0x') ? privKey.trim() : `0x${privKey.trim()}`;
        const wallet = new ethers.Wallet(formattedKey, provider);
        walletAddress = wallet.address;
        hasValidPrivateKey = true;
      } catch (err) {
        console.warn('Invalid private key format:', err);
      }
    }

    // Fetch native BNB balance for gas
    const bnbBalanceRaw = await provider.getBalance(walletAddress);
    const bnbBalance = parseFloat(ethers.formatEther(bnbBalanceRaw));

    // Fetch USDT BEP20 balance (decimals = 18 for BSC USDT)
    const usdtContract = new ethers.Contract(USDT_BEP20_CONTRACT_ADDRESS, BEP20_ABI, provider);
    let usdtBalance = 0;
    try {
      const usdtBalanceRaw = await usdtContract.balanceOf(walletAddress);
      usdtBalance = parseFloat(ethers.formatUnits(usdtBalanceRaw, 18));
    } catch (e) {
      console.warn('Error fetching USDT BEP20 balance:', e);
    }

    return {
      success: true,
      address: walletAddress,
      hasPrivateKey: hasValidPrivateKey,
      bnbBalance: parseFloat(bnbBalance.toFixed(6)),
      usdtBalance: parseFloat(usdtBalance.toFixed(2)),
      network: 'Binance Smart Chain (BEP20)',
      contractAddress: USDT_BEP20_CONTRACT_ADDRESS,
      isGasReady: bnbBalance >= 0.001, // Minimum ~0.001 BNB ($0.60) needed for gas
      status: bnbBalance >= 0.001 ? 'Ready for Instant Auto-Payout' : 'Hot Wallet Connected (Gas BNB Top-Up Needed)',
    };
  } catch (error: any) {
    return {
      success: false,
      address: DEFAULT_HOT_WALLET_ADDRESS,
      hasPrivateKey: !!DEFAULT_HOT_WALLET_PRIVATE_KEY,
      bnbBalance: 0,
      usdtBalance: 0,
      error: error.message || 'Failed to connect to BSC Blockchain',
      network: 'Binance Smart Chain (BEP20)',
      isGasReady: false,
      status: 'Blockchain Connection Error',
    };
  }
}

/**
 * Execute Automated Payout via BEP20 USDT Smart Contract
 */
export async function executeBep20Payout(
  toAddress: string,
  amountUsdt: number,
  customPrivateKey?: string
): Promise<{
  success: boolean;
  txHash?: string;
  bscscanUrl?: string;
  error?: string;
  gasUsed?: string;
  isSimulated?: boolean;
}> {
  try {
    const cleanTo = (toAddress || '').trim();
    if (!ethers.isAddress(cleanTo)) {
      return { success: false, error: `Invalid recipient BEP20/BSC address: ${toAddress}` };
    }

    if (amountUsdt <= 0) {
      return { success: false, error: `Invalid payout amount: ${amountUsdt} USDT` };
    }

    const privKey = customPrivateKey || DEFAULT_HOT_WALLET_PRIVATE_KEY;
    if (!privKey || privKey.trim().length < 64) {
      return { success: false, error: 'Hot Wallet private key is not configured in server.' };
    }

    const formattedKey = privKey.trim().startsWith('0x') ? privKey.trim() : `0x${privKey.trim()}`;
    const provider = getBscProvider();
    const wallet = new ethers.Wallet(formattedKey, provider);

    // Check BNB gas balance
    const bnbBalanceRaw = await provider.getBalance(wallet.address);
    const bnbBalance = parseFloat(ethers.formatEther(bnbBalanceRaw));

    if (bnbBalance < 0.0008) {
      return {
        success: false,
        error: `Insufficient BNB for Gas Fee in Hot Wallet (${bnbBalance.toFixed(5)} BNB available). Minimum ~0.001 BNB required. Please deposit BNB to ${wallet.address} to resume instant auto-payouts.`,
      };
    }

    // Connect to USDT Contract
    const usdtContract = new ethers.Contract(USDT_BEP20_CONTRACT_ADDRESS, BEP20_ABI, wallet);

    // Check USDT Balance
    const usdtDecimals = 18; // BSC USDT uses 18 decimals
    const usdtBalanceRaw = await usdtContract.balanceOf(wallet.address);
    const usdtBalance = parseFloat(ethers.formatUnits(usdtBalanceRaw, usdtDecimals));

    if (usdtBalance < amountUsdt) {
      return {
        success: false,
        error: `Insufficient USDT in Hot Wallet ($${usdtBalance.toFixed(2)} available, requested: $${amountUsdt.toFixed(2)}). Please top up USDT in ${wallet.address}.`,
      };
    }

    // Parse amount to Wei (18 decimals)
    const amountWei = ethers.parseUnits(amountUsdt.toFixed(6), usdtDecimals);

    // Execute transfer
    console.log(`[Web3 Payout] Sending ${amountUsdt} USDT to ${cleanTo} from Hot Wallet ${wallet.address}...`);
    const tx = await usdtContract.transfer(cleanTo, amountWei);
    console.log(`[Web3 Payout] Tx submitted: ${tx.hash}`);

    // Wait for 1 confirmation
    const receipt = await tx.wait(1);
    console.log(`[Web3 Payout] Tx confirmed in block ${receipt?.blockNumber}: ${tx.hash}`);

    return {
      success: true,
      txHash: tx.hash,
      bscscanUrl: `https://bscscan.com/tx/${tx.hash}`,
      gasUsed: receipt?.gasUsed?.toString(),
    };
  } catch (error: any) {
    console.error('[Web3 Payout Error]:', error);
    return {
      success: false,
      error: error?.reason || error?.message || 'Failed to dispatch blockchain transaction',
    };
  }
}

/**
 * Verify On-Chain USDT BEP20 Deposit via TxHash
 */
export async function verifyOnChainDeposit(
  txHash: string,
  expectedCompanyAddress: string = DEFAULT_HOT_WALLET_ADDRESS
): Promise<{
  valid: boolean;
  amount?: number;
  from?: string;
  to?: string;
  blockNumber?: number;
  error?: string;
}> {
  try {
    const cleanHash = (txHash || '').trim();
    if (!cleanHash.startsWith('0x') || cleanHash.length !== 66) {
      return { valid: false, error: 'Invalid TxHash format. Must be a 66-character hex string starting with 0x' };
    }

    const provider = getBscProvider();
    const txReceipt = await provider.getTransactionReceipt(cleanHash);

    if (!txReceipt) {
      return { valid: false, error: 'Transaction not found on BSC blockchain yet. Please wait a few seconds and retry.' };
    }

    if (txReceipt.status !== 1) {
      return { valid: false, error: 'Transaction failed on blockchain (reverted).' };
    }

    const iface = new ethers.Interface(BEP20_ABI);
    const targetCompAddress = expectedCompanyAddress.toLowerCase();

    let foundTransfer = false;
    let transferredAmount = 0;
    let senderAddress = '';
    let receiverAddress = '';

    for (const log of txReceipt.logs) {
      // Check if log is from USDT contract
      if (log.address.toLowerCase() === USDT_BEP20_CONTRACT_ADDRESS.toLowerCase()) {
        try {
          const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
          if (parsed && parsed.name === 'Transfer') {
            const [from, to, value] = parsed.args;
            if (to.toLowerCase() === targetCompAddress) {
              foundTransfer = true;
              transferredAmount = parseFloat(ethers.formatUnits(value, 18));
              senderAddress = from;
              receiverAddress = to;
              break;
            }
          }
        } catch (e) {
          // Log not a standard Transfer event
        }
      }
    }

    if (!foundTransfer) {
      return {
        valid: false,
        error: `Transaction confirmed on BSC, but no USDT transfer to company wallet (${expectedCompanyAddress}) was found in this TxID.`,
      };
    }

    return {
      valid: true,
      amount: transferredAmount,
      from: senderAddress,
      to: receiverAddress,
      blockNumber: txReceipt.blockNumber,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error?.message || 'Error querying blockchain node for TxHash verification',
    };
  }
}
