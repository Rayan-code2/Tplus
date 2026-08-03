import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import initSqlJs, { Database } from 'sql.js';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';
import {
  User,
  Package,
  Transaction,
  DepositRequest,
  WithdrawalRequest,
  BoostingEntry,
  SystemSettings,
  MatrixNode,
  LevelBreakdownRow,
  Product,
  ProductOrder,
  RankConfig,
} from './src/types';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// SQLite File Persistence Path
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE_SQLITE = path.join(DATA_DIR, 'database.sqlite');
const DB_FILE_JSON = path.join(DATA_DIR, 'store.json');

let db: Database | null = null;

// Initial System Settings
const defaultSettings: SystemSettings = {
  packages: [
    {
      id: 'pkg-10',
      name: 'Starter Node ($10)',
      price: 10,
      dailyRoiPercent: 1.5,
      durationDays: 100,
      maxMatrixLevels: 15,
      totalRoiReturnPercent: 150,
      sponsorBonusPercent: 10,
      badgeColor: '#10b981',
      tierRank: 1,
    },
    {
      id: 'pkg-20',
      name: 'Booster Pass ($20)',
      price: 20,
      dailyRoiPercent: 0,
      durationDays: 365,
      maxMatrixLevels: 15,
      totalRoiReturnPercent: 0,
      sponsorBonusPercent: 0,
      badgeColor: '#f59e0b',
      tierRank: 2,
      isUpgradePackage: true,
    },
  ],
  levelIncomePercentages: [
    { level: 1, percent: 5 },
    { level: 2, percent: 3 },
    { level: 3, percent: 2 },
    { level: 4, percent: 1 },
    { level: 5, percent: 1 },
    { level: 6, percent: 1 },
    { level: 7, percent: 1 },
    { level: 8, percent: 1 },
    { level: 9, percent: 1 },
    { level: 10, percent: 1 },
    { level: 11, percent: 1 },
    { level: 12, percent: 1 },
    { level: 13, percent: 1 },
    { level: 14, percent: 1 },
    { level: 15, percent: 1 },
  ],
  boostingPool: {
    rewardAmount: 50,
    minDirects: 2,
    minPackagePrice: 10,
    maxRebirthLimit: 6,
  },
  walletAddresses: {
    TRC20: 'TY82kXp9qmL209ZbNf77Xv341K89aJ9mKq',
    BEP20: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    ERC20: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  },
  rates: {
    usdtToInr: 88.5,
    inrToUsdt: 0.0113,
  },
  withdrawalFeePercent: 2,
  upgradeFundDeductionPercent: 30,
  tickerText:
    '⚡ LIVE TETHERPLUS NETWORK: BTC/USDT $96,420 (+4.2%) | ETH/USDT $3,450 (+2.8%) | BNB/USDT $680 (+1.9%) | 🚀 GLOBAL BOOSTING POOL CYCLE #142 ACTIVE | TOTAL DISTRIBUTED: $1,485,200 USDT ⚡',
  spinWheelRewards: [
    { id: 'sp-1', label: '$1 USDT', amount: 1, probability: 30, color: '#10b981' },
    { id: 'sp-2', label: '$2 USDT', amount: 2, probability: 25, color: '#06b6d4' },
    { id: 'sp-3', label: '$5 USDT', amount: 5, probability: 15, color: '#a855f7' },
    { id: 'sp-4', label: '$10 USDT', amount: 10, probability: 10, color: '#f59e0b' },
    { id: 'sp-5', label: '$25 USDT', amount: 25, probability: 5, color: '#ef4444' },
    { id: 'sp-6', label: '$50 MEGA', amount: 50, probability: 2, color: '#ec4899' },
    { id: 'sp-7', label: 'Try Again', amount: 0, probability: 8, color: '#374151' },
    { id: 'sp-8', label: 'Extra Spin', amount: 0, probability: 5, color: '#6366f1' },
  ],
  spinWheelIntervalHours: 24,
  spinCreditsPerReset: 1,
  specialSponsorBonus: {
    enabled: true,
    targetLevel: 7,
    matchingPercent: 100,
    requiredSelfPackagePrice: 10,
    requiredDirectsCount: 2,
  },
  ranks: [
    {
      id: 'rnk-1',
      name: 'Bronze',
      rewardTitle: '$25 Cash Reward',
      bonusUsdt: 25,
      minSelfPackagePrice: 20,
      requiredDirects: 2,
      requiredSamePackageCount: 2,
      upToLevel: 2,
      requiredVolume: 500,
      icon: 'Shield',
      color: '#cd7f32',
    },
    {
      id: 'rnk-2',
      name: 'Silver',
      rewardTitle: '$125 Cash Reward',
      bonusUsdt: 125,
      minSelfPackagePrice: 50,
      requiredDirects: 4,
      requiredSamePackageCount: 5,
      upToLevel: 3,
      requiredVolume: 2500,
      icon: 'Award',
      color: '#c0c0c0',
    },
    {
      id: 'rnk-3',
      name: 'Gold',
      rewardTitle: 'Smart Watch + $500 Bonus',
      bonusUsdt: 500,
      minSelfPackagePrice: 100,
      requiredDirects: 6,
      requiredSamePackageCount: 10,
      upToLevel: 5,
      requiredVolume: 10000,
      icon: 'Crown',
      color: '#ffd700',
    },
    {
      id: 'rnk-4',
      name: 'Diamond',
      rewardTitle: 'iPhone 15 Pro ($2,500 Bonus)',
      bonusUsdt: 2500,
      minSelfPackagePrice: 250,
      requiredDirects: 10,
      requiredSamePackageCount: 20,
      upToLevel: 10,
      requiredVolume: 50000,
      icon: 'Gem',
      color: '#00ffff',
    },
    {
      id: 'rnk-5',
      name: 'Apex',
      rewardTitle: 'Dubai VIP Trip ($10,000 Bonus)',
      bonusUsdt: 10000,
      minSelfPackagePrice: 500,
      requiredDirects: 15,
      requiredSamePackageCount: 50,
      upToLevel: 0,
      requiredVolume: 200000,
      icon: 'Zap',
      color: '#ff007f',
    },
  ],
};

// Seed Users
const initialUsers: User[] = [
  {
    id: 'usr-root',
    nodeId: 'NX-ROOT01',
    name: 'Sovereign Nexus (Root Master)',
    email: 'admin@tetherplus.io',
    walletAddress: '0x88921a91e1293348f98a213985',
    sponsorId: null,
    activePackageId: 'pkg-20',
    packageActivatedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    packageExpiryDays: 100,
    balance: 14250.0,
    depositBalance: 5000.0,
    upgradeBalance: 1200.0,
    totalEarned: 48900.0,
    roiEarned: 3000.0,
    levelEarned: 18500.0,
    sponsorEarned: 8400.0,
    rankEarned: 10000.0,
    boostingEarned: 9000.0,
    spinEarned: 0,
    directReferralsCount: 12,
    teamCount: 148,
    teamVolume: 245000,
    rank: 'Apex',
    status: 'active',
    isAdmin: true,
    registeredAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    lastRoiClaimAt: new Date(Date.now() - 3600000).toISOString(),
    spinCredits: 5,
    lastSpinAt: null,
  },
  {
    id: 'usr-cyber1',
    nodeId: 'NX-CYBER1',
    name: 'Cyber Titan',
    email: 'titan@cyber.io',
    walletAddress: '0x321a91e1293348f98a21398501',
    sponsorId: 'usr-root',
    activePackageId: 'pkg-20',
    packageActivatedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    packageExpiryDays: 100,
    balance: 1850.5,
    depositBalance: 1000.0,
    upgradeBalance: 320.0,
    totalEarned: 6400.0,
    roiEarned: 1250.0,
    levelEarned: 2400.0,
    sponsorEarned: 1850.0,
    rankEarned: 500.0,
    boostingEarned: 400.0,
    spinEarned: 10,
    directReferralsCount: 5,
    teamCount: 42,
    teamVolume: 38000,
    rank: 'Gold',
    status: 'active',
    registeredAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    lastRoiClaimAt: new Date(Date.now() - 7200000).toISOString(),
    spinCredits: 3,
    lastSpinAt: null,
  },
  {
    id: 'usr-demo',
    nodeId: 'NX-GML9L6',
    name: 'Alex Cyberpunk (Demo Account)',
    email: 'alex@web3crypto.io',
    walletAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    sponsorId: 'usr-cyber1',
    activePackageId: 'pkg-10',
    packageActivatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    packageExpiryDays: 100,
    balance: 485.5,
    depositBalance: 500.0,
    upgradeBalance: 110.0,
    totalEarned: 1240.0,
    roiEarned: 220.0,
    levelEarned: 420.0,
    sponsorEarned: 350.0,
    rankEarned: 125.0,
    boostingEarned: 100.0,
    spinEarned: 25,
    directReferralsCount: 4,
    teamCount: 18,
    teamVolume: 4200,
    rank: 'Silver',
    status: 'active',
    registeredAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    lastRoiClaimAt: new Date(Date.now() - 14400000).toISOString(),
    spinCredits: 2,
    lastSpinAt: null,
  },
  {
    id: 'usr-alpha2',
    nodeId: 'NX-ALPHA2',
    name: 'Neo Matrix',
    email: 'neo@matrix.org',
    walletAddress: '0x992381283918239128391283',
    sponsorId: 'usr-cyber1',
    activePackageId: 'pkg-10',
    packageActivatedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    packageExpiryDays: 100,
    balance: 120.0,
    depositBalance: 100.0,
    upgradeBalance: 40.0,
    totalEarned: 310.0,
    roiEarned: 90.0,
    levelEarned: 120.0,
    sponsorEarned: 100.0,
    rankEarned: 0,
    boostingEarned: 0,
    spinEarned: 0,
    directReferralsCount: 2,
    teamCount: 6,
    teamVolume: 850,
    rank: 'None',
    status: 'active',
    registeredAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    lastRoiClaimAt: new Date(Date.now() - 18000000).toISOString(),
    spinCredits: 1,
    lastSpinAt: null,
  },
  {
    id: 'usr-beta3',
    nodeId: 'NX-BETA3',
    name: 'Valkyrie Crypto',
    email: 'valk@nodes.io',
    walletAddress: '0x129381923812938129381293',
    sponsorId: 'usr-demo',
    activePackageId: 'pkg-10',
    packageActivatedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    packageExpiryDays: 100,
    balance: 240.0,
    depositBalance: 150.0,
    upgradeBalance: 50.0,
    totalEarned: 510.0,
    roiEarned: 176.0,
    levelEarned: 180.0,
    sponsorEarned: 150.0,
    rankEarned: 0,
    boostingEarned: 0,
    spinEarned: 4,
    directReferralsCount: 2,
    teamCount: 5,
    teamVolume: 1200,
    rank: 'Bronze',
    status: 'active',
    registeredAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    lastRoiClaimAt: new Date(Date.now() - 20000000).toISOString(),
    spinCredits: 1,
    lastSpinAt: null,
  },
  {
    id: 'usr-gamma4',
    nodeId: 'NX-GAMMA4',
    name: 'Solana Spectre',
    email: 'spectre@sol.io',
    walletAddress: '0x881239128391823918239182',
    sponsorId: 'usr-demo',
    activePackageId: 'pkg-20',
    packageActivatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    packageExpiryDays: 100,
    balance: 890.0,
    depositBalance: 300.0,
    upgradeBalance: 180.0,
    totalEarned: 1450.0,
    roiEarned: 625.0,
    levelEarned: 450.0,
    sponsorEarned: 375.0,
    rankEarned: 0,
    boostingEarned: 0,
    spinEarned: 0,
    directReferralsCount: 3,
    teamCount: 8,
    teamVolume: 2200,
    rank: 'Bronze',
    status: 'active',
    registeredAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    lastRoiClaimAt: new Date(Date.now() - 12000000).toISOString(),
    spinCredits: 2,
    lastSpinAt: null,
  },
  {
    id: 'usr-omega6',
    nodeId: 'NX-OMEGA6',
    name: 'Aether Sovereign',
    email: 'aether@sovereign.net',
    walletAddress: '0x551293819238192381923812',
    sponsorId: 'usr-beta3',
    activePackageId: 'pkg-20',
    packageActivatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    packageExpiryDays: 100,
    balance: 3200.0,
    depositBalance: 1500.0,
    upgradeBalance: 600.0,
    totalEarned: 4800.0,
    roiEarned: 900.0,
    levelEarned: 1900.0,
    sponsorEarned: 2000.0,
    rankEarned: 0,
    boostingEarned: 0,
    spinEarned: 0,
    directReferralsCount: 4,
    teamCount: 12,
    teamVolume: 8500,
    rank: 'Silver',
    status: 'active',
    registeredAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    lastRoiClaimAt: new Date(Date.now() - 3600000).toISOString(),
    spinCredits: 4,
    lastSpinAt: null,
  },
];

// Seed Transactions
const initialTransactions: Transaction[] = [
  {
    id: 'tx-101',
    userId: 'usr-demo',
    userNodeId: 'NX-GML9L6',
    type: 'deposit',
    amount: 500,
    status: 'completed',
    txHash: '0x8a92f8a1e2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9',
    network: 'BEP20',
    notes: 'Initial USDT Deposit Approved',
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'tx-102',
    userId: 'usr-demo',
    userNodeId: 'NX-GML9L6',
    type: 'sponsor_bonus',
    amount: 50,
    status: 'completed',
    notes: 'Direct Sponsor Bonus from #NX-GAMMA4 ($500 Pkg)',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'tx-103',
    userId: 'usr-demo',
    userNodeId: 'NX-GML9L6',
    type: 'boosting_payout',
    amount: 50,
    status: 'completed',
    notes: 'Global Gold Pool Cycle #88 Completed Reward',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

// Seed Deposit Requests
const initialDepositRequests: DepositRequest[] = [
  {
    id: 'dep-501',
    userId: 'usr-beta3',
    userNodeId: 'NX-BETA3',
    userName: 'Valkyrie Crypto',
    amount: 200,
    network: 'TRC20',
    txHash: '0x99283f12e82391283129381293812931238',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    adminNotes: 'Awaiting Blockchain confirmation verification',
  },
];

// Seed Withdrawal Requests
const initialWithdrawalRequests: WithdrawalRequest[] = [
  {
    id: 'wd-601',
    userId: 'usr-alpha2',
    userNodeId: 'NX-ALPHA2',
    userName: 'Neo Matrix',
    requestedAmount: 100,
    upgradeDeduction: 20,
    gasFee: 1.5,
    netAmount: 78.5,
    targetAddress: '0x992381283918239128391283',
    network: 'BEP20',
    status: 'pending',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    adminNotes: 'Pending admin approval',
  },
];

// Seed Boosting Pool Queue
const initialBoostingQueue: BoostingEntry[] = [
  {
    id: 'bst-1',
    userId: 'usr-root',
    nodeId: 'NX-ROOT01',
    userName: 'Sovereign Nexus (Root Master)',
    packageId: 'pkg-1000',
    rebirthCount: 2,
    position: 1,
    maxRebirthLimit: 6,
    qualifiedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    status: 'queued',
  },
  {
    id: 'bst-2',
    userId: 'usr-cyber1',
    nodeId: 'NX-CYBER1',
    userName: 'Cyber Titan',
    packageId: 'pkg-500',
    rebirthCount: 1,
    position: 2,
    maxRebirthLimit: 6,
    qualifiedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    status: 'queued',
  },
  {
    id: 'bst-3',
    userId: 'usr-demo',
    nodeId: 'NX-GML9L6',
    userName: 'Alex Cyberpunk (Demo Account)',
    packageId: 'pkg-100',
    rebirthCount: 1,
    position: 3,
    maxRebirthLimit: 6,
    qualifiedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    status: 'queued',
  },
  {
    id: 'bst-4',
    userId: 'usr-omega6',
    nodeId: 'NX-OMEGA6',
    userName: 'Aether Sovereign',
    packageId: 'pkg-1000',
    rebirthCount: 0,
    position: 4,
    maxRebirthLimit: 6,
    qualifiedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    status: 'queued',
  },
];

// Seed E-Commerce Products (Amazon-style store)
const initialProducts: Product[] = [
  {
    id: 'prod-1',
    title: 'Ledger Stax Crypto Hardware Wallet',
    description: 'Next-gen Web3 curved E-Ink touchscreen hardware wallet with Bluetooth and wireless charging.',
    priceUsdt: 279,
    priceInr: 25110,
    category: 'Hardware Wallets',
    image: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=800&q=80',
    stock: 25,
    rating: 4.9,
    reviewsCount: 142,
    badge: 'Best Seller',
    featured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    title: 'NVIDIA RTX 4090 Cyber Mining Rig',
    description: 'High-performance liquid cooled mining GPU optimized for AI compute & multi-coin node validation.',
    priceUsdt: 1599,
    priceInr: 143910,
    category: 'Mining Hardware',
    image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80',
    stock: 10,
    rating: 4.8,
    reviewsCount: 89,
    badge: 'Hot Deal',
    featured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    title: 'Titanium Cold Storage Seed Phrase Plate',
    description: 'Indestructible fireproof & waterproof 6000°F aerospace titanium plate for seed phrase recovery.',
    priceUsdt: 45,
    priceInr: 4050,
    category: 'Crypto Security',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80',
    stock: 50,
    rating: 4.9,
    reviewsCount: 230,
    badge: 'Must Have',
    featured: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-4',
    title: 'Cyberpunk Web3 Smart Watch Pro',
    description: 'Real-time crypto price tracker watch with OLED display, node alert alarms, and biometric auth.',
    priceUsdt: 149,
    priceInr: 13410,
    category: 'Gadgets',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    stock: 30,
    rating: 4.7,
    reviewsCount: 64,
    badge: 'Popular',
    featured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-5',
    title: 'Decentralized WiFi 7 Mesh Node Router',
    description: 'Earn passive crypto tokens by sharing encrypted decentralized bandwidth on DePIN network.',
    priceUsdt: 199,
    priceInr: 17910,
    category: 'DePIN Electronics',
    image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
    stock: 18,
    rating: 4.6,
    reviewsCount: 45,
    badge: 'DePIN Tech',
    featured: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-6',
    title: 'TetherPlus Sovereign Cyber Hoodie',
    description: 'Premium heavyweight cotton blend cyberpunk hoodie with embroidered Web3 node matrix logo.',
    priceUsdt: 65,
    priceInr: 5850,
    category: 'Apparel & Merch',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
    stock: 100,
    rating: 4.9,
    reviewsCount: 312,
    badge: 'Official Merch',
    featured: false,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Black', 'Cyber Gold', 'Navy Blue'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-7',
    title: 'TetherPlus Official Web3 Oversized T-Shirt',
    description: 'High quality 240 GSM combed cotton oversized streetwear t-shirt with metallic gold T+ logo.',
    priceUsdt: 35,
    priceInr: 3150,
    category: 'Apparel & Merch',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    stock: 120,
    rating: 5.0,
    reviewsCount: 184,
    badge: 'Hot Seller',
    featured: true,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Black', 'Pure White', 'Cyber Gold'],
    createdAt: new Date().toISOString(),
  },
];

const initialOrders: ProductOrder[] = [];

// Global State Store
let state = {
  settings: defaultSettings,
  users: initialUsers,
  transactions: initialTransactions,
  depositRequests: initialDepositRequests,
  withdrawalRequests: initialWithdrawalRequests,
  boostingQueue: initialBoostingQueue,
  products: initialProducts,
  productOrders: initialOrders,
  activeUserId: 'usr-demo',
};

// SQLite Database Setup & Persistence Handlers
async function initSqlite() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const SQL = await initSqlJs();

    if (fs.existsSync(DB_FILE_SQLITE)) {
      const fileBuffer = fs.readFileSync(DB_FILE_SQLITE);
      db = new SQL.Database(fileBuffer);
      console.log(`📦 Opened existing SQLite database at: ${DB_FILE_SQLITE}`);
    } else {
      db = new SQL.Database();
      console.log(`✨ Created new SQLite database at: ${DB_FILE_SQLITE}`);
    }

    // Create SQLite Tables
    db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        data TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        nodeId TEXT,
        name TEXT,
        email TEXT,
        walletAddress TEXT,
        sponsorId TEXT,
        activePackageId TEXT,
        packageActivatedAt TEXT,
        packageExpiryDays INTEGER,
        balance REAL,
        depositBalance REAL,
        upgradeBalance REAL,
        totalEarned REAL,
        roiEarned REAL,
        levelEarned REAL,
        sponsorEarned REAL,
        rankEarned REAL,
        boostingEarned REAL,
        spinEarned REAL,
        directReferralsCount INTEGER,
        teamCount INTEGER,
        teamVolume REAL,
        rank TEXT,
        status TEXT,
        registeredAt TEXT,
        lastRoiClaimAt TEXT,
        spinCredits INTEGER,
        lastSpinAt TEXT
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        userId TEXT,
        userNodeId TEXT,
        type TEXT,
        amount REAL,
        status TEXT,
        txHash TEXT,
        network TEXT,
        notes TEXT,
        createdAt TEXT
      );

      CREATE TABLE IF NOT EXISTS deposit_requests (
        id TEXT PRIMARY KEY,
        userId TEXT,
        userNodeId TEXT,
        userName TEXT,
        amount REAL,
        network TEXT,
        txHash TEXT,
        status TEXT,
        createdAt TEXT,
        adminNotes TEXT
      );

      CREATE TABLE IF NOT EXISTS withdrawal_requests (
        id TEXT PRIMARY KEY,
        userId TEXT,
        userNodeId TEXT,
        userName TEXT,
        requestedAmount REAL,
        upgradeDeduction REAL,
        gasFee REAL,
        netAmount REAL,
        targetAddress TEXT,
        network TEXT,
        status TEXT,
        createdAt TEXT,
        adminNotes TEXT
      );

      CREATE TABLE IF NOT EXISTS boosting_queue (
        id TEXT PRIMARY KEY,
        userId TEXT,
        nodeId TEXT,
        userName TEXT,
        packageId TEXT,
        rebirthCount INTEGER,
        position INTEGER,
        maxRebirthLimit INTEGER,
        qualifiedAt TEXT,
        status TEXT
      );

      CREATE TABLE IF NOT EXISTS app_meta (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    // Load from SQLite if settings record exists, otherwise fallback to JSON or seed
    const settingsCheck = db.exec('SELECT COUNT(*) as count FROM settings');
    const settingsCount = (settingsCheck[0]?.values[0][0] as number) || 0;

    if (settingsCount > 0) {
      loadFromSqlite();
    } else if (fs.existsSync(DB_FILE_JSON)) {
      loadStoreJson();
      saveStore();
    } else {
      // Seed SQLite database with initial data
      saveStore();
    }

  } catch (err) {
    console.error('Failed to initialize SQLite database:', err);
    // Fallback to JSON if SQLite init fails
    loadStoreJson();
  }
}

function saveStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Always backup to JSON
    fs.writeFileSync(DB_FILE_JSON, JSON.stringify(state, null, 2), 'utf-8');

    // Sync to SQLite database tables
    if (db) {
      // Begin transaction
      db.run('BEGIN TRANSACTION;');

      // 1. Settings
      db.run('INSERT OR REPLACE INTO settings (id, data) VALUES (1, ?)', [
        JSON.stringify(state.settings),
      ]);

      // 2. Users
      db.run('DELETE FROM users;');
      for (const u of state.users) {
        db.run(
          `INSERT INTO users VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            u.id,
            u.nodeId,
            u.name,
            u.email,
            u.walletAddress || '',
            u.sponsorId || '',
            u.activePackageId || '',
            u.packageActivatedAt || '',
            u.packageExpiryDays || 100,
            u.balance || 0,
            u.depositBalance || 0,
            u.upgradeBalance || 0,
            u.totalEarned || 0,
            u.roiEarned || 0,
            u.levelEarned || 0,
            u.sponsorEarned || 0,
            u.rankEarned || 0,
            u.boostingEarned || 0,
            u.spinEarned || 0,
            u.directReferralsCount || 0,
            u.teamCount || 0,
            u.teamVolume || 0,
            u.rank || 'Member',
            u.status || 'active',
            u.registeredAt || new Date().toISOString(),
            u.lastRoiClaimAt || new Date().toISOString(),
            u.spinCredits || 0,
            u.lastSpinAt || '',
          ]
        );
      }

      // 3. Transactions
      db.run('DELETE FROM transactions;');
      for (const tx of state.transactions) {
        db.run(`INSERT INTO transactions VALUES (?,?,?,?,?,?,?,?,?,?)`, [
          tx.id,
          tx.userId,
          tx.userNodeId,
          tx.type,
          tx.amount,
          tx.status,
          tx.txHash || '',
          tx.network || '',
          tx.notes || '',
          tx.createdAt,
        ]);
      }

      // 4. Deposit Requests
      db.run('DELETE FROM deposit_requests;');
      for (const dep of state.depositRequests) {
        db.run(`INSERT INTO deposit_requests VALUES (?,?,?,?,?,?,?,?,?,?)`, [
          dep.id,
          dep.userId,
          dep.userNodeId,
          dep.userName,
          dep.amount,
          dep.network,
          dep.txHash,
          dep.status,
          dep.createdAt,
          dep.adminNotes || '',
        ]);
      }

      // 5. Withdrawal Requests
      db.run('DELETE FROM withdrawal_requests;');
      for (const wd of state.withdrawalRequests) {
        db.run(`INSERT INTO withdrawal_requests VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
          wd.id,
          wd.userId,
          wd.userNodeId,
          wd.userName,
          wd.requestedAmount,
          wd.upgradeDeduction,
          wd.gasFee,
          wd.netAmount,
          wd.targetAddress,
          wd.network,
          wd.status,
          wd.createdAt,
          wd.adminNotes || '',
        ]);
      }

      // 6. Boosting Queue
      db.run('DELETE FROM boosting_queue;');
      for (const b of state.boostingQueue) {
        db.run(`INSERT INTO boosting_queue VALUES (?,?,?,?,?,?,?,?,?,?)`, [
          b.id,
          b.userId,
          b.nodeId,
          b.userName,
          b.packageId,
          b.rebirthCount,
          b.position,
          b.maxRebirthLimit,
          b.qualifiedAt,
          b.status,
        ]);
      }

      // Meta
      db.run('INSERT OR REPLACE INTO app_meta VALUES (?, ?)', [
        'activeUserId',
        state.activeUserId,
      ]);
      db.run('INSERT OR REPLACE INTO app_meta VALUES (?, ?)', [
        'lastSavedAt',
        new Date().toISOString(),
      ]);

      db.run('COMMIT;');

      // Save binary SQLite database file to disk
      const binaryArray = db.export();
      const buffer = Buffer.from(binaryArray);
      fs.writeFileSync(DB_FILE_SQLITE, buffer);
    }
  } catch (err) {
    console.error('Failed to save SQLite store:', err);
  }
}

function loadFromSqlite() {
  try {
    if (!db) return;

    // 1. Settings
    const settingsRes = db.exec('SELECT data FROM settings WHERE id = 1');
    if (settingsRes[0]?.values[0]?.[0]) {
      state.settings = JSON.parse(settingsRes[0].values[0][0] as string);
    }

    // 2. Users
    const usersRes = db.exec('SELECT * FROM users');
    if (usersRes[0]) {
      const cols = usersRes[0].columns;
      state.users = usersRes[0].values.map((row) => {
        const u: any = {};
        cols.forEach((col, idx) => {
          u[col] = row[idx];
        });
        return u as User;
      });
    }

    // 3. Transactions
    const txRes = db.exec('SELECT * FROM transactions');
    if (txRes[0]) {
      const cols = txRes[0].columns;
      state.transactions = txRes[0].values.map((row) => {
        const tx: any = {};
        cols.forEach((col, idx) => {
          tx[col] = row[idx];
        });
        return tx as Transaction;
      });
    }

    // 4. Deposit Requests
    const depRes = db.exec('SELECT * FROM deposit_requests');
    if (depRes[0]) {
      const cols = depRes[0].columns;
      state.depositRequests = depRes[0].values.map((row) => {
        const dep: any = {};
        cols.forEach((col, idx) => {
          dep[col] = row[idx];
        });
        return dep as DepositRequest;
      });
    }

    // 5. Withdrawal Requests
    const wdRes = db.exec('SELECT * FROM withdrawal_requests');
    if (wdRes[0]) {
      const cols = wdRes[0].columns;
      state.withdrawalRequests = wdRes[0].values.map((row) => {
        const wd: any = {};
        cols.forEach((col, idx) => {
          wd[col] = row[idx];
        });
        return wd as WithdrawalRequest;
      });
    }

    // 6. Boosting Queue
    const bstRes = db.exec('SELECT * FROM boosting_queue');
    if (bstRes[0]) {
      const cols = bstRes[0].columns;
      state.boostingQueue = bstRes[0].values.map((row) => {
        const b: any = {};
        cols.forEach((col, idx) => {
          b[col] = row[idx];
        });
        return b as BoostingEntry;
      });
    }

    // Meta activeUserId
    const metaRes = db.exec("SELECT value FROM app_meta WHERE key = 'activeUserId'");
    if (metaRes[0]?.values[0]?.[0]) {
      state.activeUserId = metaRes[0].values[0][0] as string;
    }

    console.log(`✅ Loaded ${state.users.length} users, ${state.transactions.length} transactions from SQLite!`);
  } catch (err) {
    console.error('Failed to load from SQLite:', err);
  }
}

function loadStoreJson() {
  try {
    if (fs.existsSync(DB_FILE_JSON)) {
      const data = fs.readFileSync(DB_FILE_JSON, 'utf-8');
      const loaded = JSON.parse(data);
      if (loaded) {
        state = { ...state, ...loaded };
        console.log('Successfully loaded persisted store from JSON!');
      }
    }
  } catch (err) {
    console.error('Failed to load JSON store:', err);
  }
}

// Helper Functions
function generateNodeId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'NX-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function findUserByIdOrNodeId(idOrNode: string): User | undefined {
  return state.users.find(
    (u) => u.id === idOrNode || u.nodeId.toLowerCase() === idOrNode.toLowerCase()
  );
}

// Find placement parent in 2x2 forced matrix (spillover BFS)
function find2x2PlacementUplineId(sponsorId: string, users: User[]): string {
  const getPlacementChildren = (parentId: string) =>
    users.filter((u) => (u.placementUplineId ? u.placementUplineId === parentId : u.sponsorId === parentId));

  const queue = [sponsorId];
  const visited = new Set<string>([sponsorId]);

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = getPlacementChildren(currentId);

    if (children.length < 2) {
      return currentId;
    }

    for (const child of children) {
      if (!visited.has(child.id)) {
        visited.add(child.id);
        queue.push(child.id);
      }
    }
  }

  return sponsorId;
}

// Re-calculate user team volume & count recursively
function updateTeamVolumeAndCounts() {
  state.users.forEach((u) => {
    const directReferrals = state.users.filter((child) => child.sponsorId === u.id);
    u.directReferralsCount = directReferrals.length;

    const activePkg = state.settings.packages.find((p) => p.id === u.activePackageId);
    const hasBoosterTx = state.transactions.some(
      (t) => t.userId === u.id && t.notes && (t.notes.includes('Booster Pass') || t.notes.includes('$20') || t.notes.includes('pkg-20'))
    );
    if (!u.isUpgraded && ((activePkg && (activePkg.price >= 20 || activePkg.isUpgradePackage)) || u.activePackageId === 'pkg-20' || hasBoosterTx)) {
      u.isUpgraded = true;
    }
  });
}

// API ROUTES

// 1. Get Full Application State or Current User Context
app.get('/api/state', (req: Request, res: Response) => {
  updateTeamVolumeAndCounts();
  const currentUser = state.users.find((u) => u.id === state.activeUserId) || state.users[2];
  res.json({
    currentUser,
    users: state.users,
    settings: state.settings,
    transactions: state.transactions.filter((t) => t.userId === currentUser.id || req.query.admin === 'true'),
    depositRequests: state.depositRequests,
    withdrawalRequests: state.withdrawalRequests,
    boostingQueue: state.boostingQueue,
    products: state.products || [],
    productOrders: state.productOrders || [],
  });
});

// 2. Switch Active User Context or Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { nodeId, email, password } = req.body;
  const user = state.users.find(
    (u) =>
      u.nodeId.toLowerCase() === (nodeId || '').toLowerCase() ||
      u.email.toLowerCase() === (email || '').toLowerCase()
  );

  if (!user) {
    return res.status(404).json({ error: 'User Node ID or Email not found' });
  }

  // If password provided or set on user, validate it
  if (password) {
    const userPass = user.password || '123456';
    if (password !== userPass) {
      return res.status(400).json({ error: 'Incorrect password. Please enter the password you set during registration.' });
    }
  }

  state.activeUserId = user.id;
  saveStore();
  res.json({ success: true, user });
});

// Logout endpoint
app.post('/api/auth/logout', (req: Request, res: Response) => {
  state.activeUserId = '';
  saveStore();
  res.json({ success: true });
});

// Forgot Password - Generate OTP & Send Email / Return Verification State
app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
  const { input } = req.body; // Email or Node ID
  if (!input || !input.trim()) {
    return res.status(400).json({ error: 'Please enter your registered Email or Node ID' });
  }

  const cleanInput = input.trim().toLowerCase();
  const user = state.users.find(
    (u) => u.email.toLowerCase() === cleanInput || u.nodeId.toLowerCase() === cleanInput
  );

  if (!user) {
    return res.status(404).json({ error: 'No account found with this Email or Node ID' });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  (user as any).resetOtp = otp;
  (user as any).resetOtpExpires = Date.now() + 15 * 60 * 1000; // 15 mins expiry
  saveStore();

  console.log(`[PASSWORD RESET] OTP generated for user ${user.nodeId} (${user.email}): ${otp}`);

  // Send real email via SMTP if SMTP_PASS is configured
  let emailSent = false;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER || 'support@tetherplus.live';
  const smtpUser = process.env.SMTP_USER || process.env.SMTP_FROM || smtpFrom;
  const smtpHost = process.env.SMTP_HOST || (smtpUser.endsWith('@gmail.com') ? 'smtp.gmail.com' : 'smtpout.secureserver.net');
  const smtpPort = Number(process.env.SMTP_PORT) || 587;

  if (smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465 SSL, false for 587 STARTTLS
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"TetherPlus Security" <${smtpFrom}>`,
        to: user.email,
        subject: `TetherPlus - Password Reset OTP (${otp})`,
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #0b1424; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 500px;">
            <h2 style="color: #00eeff; margin-top: 0;">TetherPlus Password Reset</h2>
            <p>Hello <strong>${user.name || user.nodeId}</strong>,</p>
            <p>You requested a password reset for your TetherPlus account. Here is your 6-digit verification OTP code:</p>
            <div style="background-color: #050911; border: 1px solid #334155; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #00eeff;">${otp}</span>
            </div>
            <p style="font-size: 13px; color: #94a3b8;">This code is valid for 15 minutes. If you did not request this, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;" />
            <p style="font-size: 11px; color: #64748b; text-align: center;">TetherPlus Ecosystem • ${smtpFrom}</p>
          </div>
        `,
      });
      emailSent = true;
      console.log(`[SMTP SUCCESS] Password reset email successfully sent to ${user.email} from ${smtpFrom}`);
    } catch (mailErr) {
      console.error('[SMTP ERROR] Failed to send email via SMTP:', mailErr);
    }
  }

  res.json({
    success: true,
    message: emailSent
      ? `Password reset OTP has been sent to ${user.email}.`
      : `Password reset OTP code generated for ${user.email}.`,
    email: user.email,
    nodeId: user.nodeId,
    // Provide demo OTP code if SMTP is not configured or in sandbox mode so testing is instant
    otpDemo: (!emailSent || process.env.NODE_ENV !== 'production') ? otp : undefined,
  });
});


// Reset Password with OTP
app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { input, otp, newPassword } = req.body;
  if (!input || !otp || !newPassword) {
    return res.status(400).json({ error: 'Please provide Email/Node ID, OTP code, and new password' });
  }

  if (newPassword.length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters long' });
  }

  const cleanInput = input.trim().toLowerCase();
  const user = state.users.find(
    (u) => u.email.toLowerCase() === cleanInput || u.nodeId.toLowerCase() === cleanInput
  );

  if (!user) {
    return res.status(404).json({ error: 'Account not found' });
  }

  const storedOtp = (user as any).resetOtp;
  const expiresAt = (user as any).resetOtpExpires || 0;

  if (!storedOtp || storedOtp !== otp.trim()) {
    return res.status(400).json({ error: 'Invalid OTP code. Please check your email or request a new code.' });
  }

  if (Date.now() > expiresAt) {
    return res.status(400).json({ error: 'OTP code has expired. Please request a new code.' });
  }

  // Update Password
  user.password = newPassword.trim();
  delete (user as any).resetOtp;
  delete (user as any).resetOtpExpires;
  saveStore();

  res.json({
    success: true,
    message: `Password reset successfully! You can now login with your new password.`,
  });
});

// Change Password for Logged-In User
app.post('/api/user/change-password', (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = state.users.find((u) => u.id === state.activeUserId);
  if (!user) return res.status(401).json({ error: 'User not logged in' });

  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters long' });
  }

  const existingPass = user.password || '123456';
  if (currentPassword && currentPassword !== existingPass) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }

  user.password = newPassword;
  saveStore();
  return res.json({ success: true, message: 'Your password has been changed successfully!' });
});

// Admin Change / Reset User Password
app.post('/api/admin/users/change-password', (req: Request, res: Response) => {
  const { userId, newPassword } = req.body;
  if (!userId || !newPassword) {
    return res.status(400).json({ error: 'User ID and New Password are required' });
  }

  const user = state.users.find((u) => u.id === userId || u.nodeId === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (newPassword.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters long' });
  }

  user.password = newPassword;
  saveStore();
  return res.json({
    success: true,
    message: `Password for user #${user.nodeId} (${user.name}) successfully updated to "${newPassword}"!`,
  });
});

// 3. Register New User Node under Sponsor
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, walletAddress, sponsorNodeId, password } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and Email are required' });
  }

  if (!password || typeof password !== 'string' || password.trim().length < 4) {
    return res.status(400).json({ error: 'Password is required and must be at least 4 characters long.' });
  }

  const sponsor = findUserByIdOrNodeId(sponsorNodeId || 'NX-ROOT01') || state.users[0];
  const newNodeId = generateNodeId();

  // 2x2 Matrix Placement Spillover Parent
  const placementUplineId = find2x2PlacementUplineId(sponsor.id, state.users);

  const newUser: User = {
    id: `usr-${Date.now()}`,
    nodeId: newNodeId,
    name,
    email,
    password: password.trim(),
    walletAddress: walletAddress || `0x${Math.random().toString(16).substring(2, 14)}`,
    sponsorId: sponsor.id,
    placementUplineId: placementUplineId,
    activePackageId: null,
    packageActivatedAt: null,
    packageExpiryDays: 0,
    balance: 0.0,
    depositBalance: 0.0,
    upgradeBalance: 0.0,
    totalEarned: 0.0,
    roiEarned: 0.0,
    levelEarned: 0.0,
    sponsorEarned: 0.0,
    rankEarned: 0.0,
    boostingEarned: 0.0,
    spinEarned: 0.0,
    directReferralsCount: 0,
    teamCount: 0,
    teamVolume: 0,
    rank: 'None',
    status: 'active',
    registeredAt: new Date().toISOString(),
    lastRoiClaimAt: new Date().toISOString(),
    spinCredits: 1,
    lastSpinAt: null,
  };

  state.users.push(newUser);
  state.activeUserId = newUser.id;

  // Increment sponsor count
  sponsor.directReferralsCount += 1;

  saveStore();
  res.json({ success: true, user: newUser });
});

// 4. Buy / Upgrade Package & Distribute Sponsor Bonus + Matrix Level Income
app.post('/api/packages/buy', (req: Request, res: Response) => {
  const { packageId } = req.body;
  const user = state.users.find((u) => u.id === state.activeUserId);
  const pkg = state.settings.packages.find((p) => p.id === packageId);

  if (!user || !pkg) {
    return res.status(400).json({ error: 'Invalid user or package' });
  }

  const depositBal = user.depositBalance || 0;
  if (depositBal < pkg.price) {
    return res.status(400).json({
      error: `Insufficient Deposit Wallet balance ($${depositBal.toFixed(2)} USDT available). Please deposit at least $${(pkg.price - depositBal).toFixed(2)} USDT to your Deposit Wallet first.`,
    });
  }

  // Deduct package price from Deposit Wallet
  user.depositBalance = depositBal - pkg.price;

  // Check if this package is an Upgrade / Booster Package (0% ROI)
  const isUpgradePkg = pkg.isUpgradePackage || pkg.dailyRoiPercent === 0;

  if (isUpgradePkg) {
    user.isUpgraded = true;
    // Keep active ROI package if user already had one with dailyRoiPercent > 0
    if (!user.activePackageId) {
      user.activePackageId = pkg.id;
    }
  } else {
    user.activePackageId = pkg.id;
  }

  user.packageActivatedAt = new Date().toISOString();
  user.packageExpiryDays = pkg.durationDays || 100;

  // Create Package Purchase Transaction
  const pkgTx: Transaction = {
    id: `tx-${Date.now()}-pkg`,
    userId: user.id,
    userNodeId: user.nodeId,
    type: 'admin_adjust',
    amount: pkg.price,
    status: 'completed',
    notes: `Activated Package: ${pkg.name} ($${pkg.price}) [Paid via Deposit Wallet]`,
    createdAt: new Date().toISOString(),
  };
  state.transactions.unshift(pkgTx);

  // 1. Direct Sponsor Bonus (Configured per package)
  if (user.sponsorId) {
    const sponsor = state.users.find((u) => u.id === user.sponsorId);
    if (sponsor) {
      // Upgrade / Qualifier packages ($20 or 0% ROI) do NOT yield direct sponsor bonus
      const isUpgrade = pkg.isUpgradePackage || pkg.dailyRoiPercent === 0 || pkg.price === 20;
      const spPercent = isUpgrade ? 0 : (pkg.sponsorBonusPercent !== undefined ? pkg.sponsorBonusPercent : 10);
      const sponsorBonus = pkg.price * (spPercent / 100);
      if (sponsorBonus > 0) {
        sponsor.balance += sponsorBonus;
        sponsor.sponsorEarned += sponsorBonus;
        sponsor.totalEarned += sponsorBonus;
        sponsor.teamVolume += pkg.price;

        state.transactions.unshift({
          id: `tx-${Date.now()}-sp`,
          userId: sponsor.id,
          userNodeId: sponsor.nodeId,
          type: 'sponsor_bonus',
          amount: sponsorBonus,
          status: 'completed',
          notes: `${spPercent}% Direct Sponsor Bonus from #${user.nodeId} (${pkg.name})`,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  // 2. Matrix Level Income (Distributed via 2x2 Matrix Placement Upline Chain)
  const isUpgrade = pkg.isUpgradePackage || pkg.dailyRoiPercent === 0 || pkg.price === 20;
  if (!isUpgrade) {
    let currentPlacementUplineId = user.placementUplineId || user.sponsorId;
    const maxLevels = state.settings.levelIncomePercentages.length;
    for (let level = 1; level <= maxLevels && currentPlacementUplineId; level++) {
      const upline = state.users.find((u) => u.id === currentPlacementUplineId);
      if (!upline) break;

      const levelConfig = state.settings.levelIncomePercentages.find((l) => l.level === level);
      if (levelConfig && upline.activePackageId) {
        const uplinePkg = state.settings.packages.find((p) => p.id === upline.activePackageId);
        if (uplinePkg && level <= uplinePkg.maxMatrixLevels) {
          const levelBonus = pkg.price * (levelConfig.percent / 100);
          upline.balance += levelBonus;
          upline.levelEarned += levelBonus;
          upline.totalEarned += levelBonus;

          state.transactions.unshift({
            id: `tx-${Date.now()}-lvl-${level}`,
            userId: upline.id,
            userNodeId: upline.nodeId,
            type: 'level_income',
            amount: levelBonus,
            status: 'completed',
            notes: `Level ${level} Matrix Income (${levelConfig.percent}%) from #${user.nodeId}`,
            createdAt: new Date().toISOString(),
          });

          // Special 100% Sponsor Level Matching Bonus Logic
          // Sponsor of "upline" gets matching bonus when "upline" earns from target level (e.g. Level 7)
          const bonusConfig = state.settings.specialSponsorBonus;
          if (
            bonusConfig &&
            bonusConfig.enabled &&
            level === (bonusConfig.targetLevel || 7) &&
            upline.sponsorId
          ) {
            const sponsorOfUpline = state.users.find((u) => u.id === upline.sponsorId);
            if (sponsorOfUpline && sponsorOfUpline.activePackageId) {
              const sponsorPkg = state.settings.packages.find((p) => p.id === sponsorOfUpline.activePackageId);
              const sponsorPkgPrice = sponsorPkg ? sponsorPkg.price : 0;
              const sponsorDirects = sponsorOfUpline.directReferralsCount || 0;

              const reqPkgPrice = bonusConfig.requiredSelfPackagePrice !== undefined ? bonusConfig.requiredSelfPackagePrice : 10;
              const reqDirects = bonusConfig.requiredDirectsCount !== undefined ? bonusConfig.requiredDirectsCount : 2;

              if (sponsorPkgPrice >= reqPkgPrice && sponsorDirects >= reqDirects) {
                const matchPct = bonusConfig.matchingPercent !== undefined ? bonusConfig.matchingPercent : 100;
                const specialMatchAmount = levelBonus * (matchPct / 100);

                if (specialMatchAmount > 0) {
                  sponsorOfUpline.balance += specialMatchAmount;
                  sponsorOfUpline.specialBonusEarned = (sponsorOfUpline.specialBonusEarned || 0) + specialMatchAmount;
                  sponsorOfUpline.totalEarned += specialMatchAmount;

                  state.transactions.unshift({
                    id: `tx-${Date.now()}-spmatch-lvl${level}`,
                    userId: sponsorOfUpline.id,
                    userNodeId: sponsorOfUpline.nodeId,
                    type: 'special_matching_bonus',
                    amount: specialMatchAmount,
                    status: 'completed',
                    notes: `${matchPct}% Special Sponsor Level Matching Bonus from Direct Referral #${upline.nodeId} (Level ${level} Income)`,
                    createdAt: new Date().toISOString(),
                  });
                }
              }
            }
          }
        }
      }

      currentPlacementUplineId = upline.placementUplineId || upline.sponsorId;
    }
  }

  // 3. Check Qualification for Global Boosting Pool
  const minDirects = state.settings.boostingPool.minDirects;
  const minPkgPrice = state.settings.boostingPool.minPackagePrice;

  if (user.directReferralsCount >= minDirects && pkg.price >= minPkgPrice) {
    const exists = state.boostingQueue.find((b) => b.userId === user.id);
    if (!exists) {
      const maxPos = state.boostingQueue.reduce((max, b) => Math.max(max, b.position), 0);
      state.boostingQueue.push({
        id: `bst-${Date.now()}`,
        userId: user.id,
        nodeId: user.nodeId,
        userName: user.name,
        packageId: pkg.id,
        rebirthCount: 0,
        position: maxPos + 1,
        maxRebirthLimit: state.settings.boostingPool.maxRebirthLimit,
        qualifiedAt: new Date().toISOString(),
        status: 'queued',
      });
    }
  }

  saveStore();
  res.json({ success: true, user, package: pkg });
});

// 5. Claim Node Yield ROI
app.post('/api/roi/claim', (req: Request, res: Response) => {
  const user = state.users.find((u) => u.id === state.activeUserId);
  if (!user || !user.activePackageId) {
    return res.status(400).json({ error: 'No active package to claim ROI' });
  }

  let pkg = state.settings.packages.find((p) => p.id === user.activePackageId);
  
  // If activePackageId points to a 0% ROI upgrade package, find the primary ROI-generating package ($10 package or similar)
  if (!pkg || !pkg.dailyRoiPercent || pkg.dailyRoiPercent <= 0) {
    const primaryRoiPkg = state.settings.packages.find((p) => p.dailyRoiPercent && p.dailyRoiPercent > 0);
    if (primaryRoiPkg) {
      pkg = primaryRoiPkg;
    }
  }

  if (!pkg) return res.status(400).json({ error: 'Package config not found' });

  if (!pkg.dailyRoiPercent || pkg.dailyRoiPercent <= 0) {
    return res.status(400).json({ error: 'This package does not generate daily ROI yield.' });
  }

  // Max Capping Check (totalRoiReturnPercent e.g. 200% or 300%)
  const maxRoiCap = pkg.price * (pkg.totalRoiReturnPercent / 100);
  if (user.roiEarned >= maxRoiCap) {
    return res.status(400).json({
      error: `Maximum ROI Capping Limit of ${pkg.totalRoiReturnPercent}% ($${maxRoiCap.toFixed(2)}) reached for package ${pkg.name}. Please re-topup or upgrade your package to continue.`,
    });
  }

  // Calculate elapsed time
  const lastClaim = new Date(user.lastRoiClaimAt).getTime();
  const now = Date.now();
  const elapsedMs = now - lastClaim;
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);

  const dailyAmount = pkg.price * (pkg.dailyRoiPercent / 100);
  let claimable = Math.max(0.01, parseFloat((dailyAmount * elapsedDays).toFixed(4)));

  if (user.roiEarned + claimable > maxRoiCap) {
    claimable = Math.max(0, parseFloat((maxRoiCap - user.roiEarned).toFixed(4)));
  }

  if (claimable < 0.01) {
    return res.status(400).json({ error: 'Mining ROI yield building up. Minimum claim is $0.01 USDT.' });
  }

  user.balance += claimable;
  user.roiEarned += claimable;
  user.totalEarned += claimable;
  user.lastRoiClaimAt = new Date().toISOString();

  state.transactions.unshift({
    id: `tx-${Date.now()}-roi`,
    userId: user.id,
    userNodeId: user.nodeId,
    type: 'roi',
    amount: claimable,
    status: 'completed',
    notes: `Claimed Real-time Node Mining Yield (${pkg.name})`,
    createdAt: new Date().toISOString(),
  });

  saveStore();
  res.json({ success: true, claimedAmount: claimable, user });
});

// 6. Submit Deposit Request
app.post('/api/deposit', (req: Request, res: Response) => {
  const { amount, network, txHash } = req.body;
  const user = state.users.find((u) => u.id === state.activeUserId);

  if (!user) return res.status(400).json({ error: 'User not logged in' });
  if (!amount || amount < 10) return res.status(400).json({ error: 'Minimum deposit is $10 USDT' });
  if (!txHash || txHash.trim().length < 8)
    return res.status(400).json({ error: 'Please enter a valid Transaction Hash / TXID' });

  const dep: DepositRequest = {
    id: `dep-${Date.now()}`,
    userId: user.id,
    userNodeId: user.nodeId,
    userName: user.name,
    amount: parseFloat(amount),
    network: network || 'BEP20',
    txHash: txHash.trim(),
    status: 'pending',
    createdAt: new Date().toISOString(),
    adminNotes: 'Awaiting admin verification of blockchain transaction',
  };

  state.depositRequests.unshift(dep);
  saveStore();
  res.json({ success: true, depositRequest: dep });
});

// 7. Request Withdrawal with 20% Upgrade Deduction Rule
app.post('/api/withdraw', (req: Request, res: Response) => {
  const { amount, targetAddress, network } = req.body;
  const user = state.users.find((u) => u.id === state.activeUserId);

  if (!user) return res.status(400).json({ error: 'User not logged in' });

  // 0. Active Package Requirement Check
  if (!user.activePackageId) {
    return res.status(400).json({
      error: 'Active Package Required! You must have an active package ($10 Starter or $20 Booster) to request withdrawals.',
    });
  }

  const reqAmt = parseFloat(amount);
  if (!reqAmt || reqAmt < 10) return res.status(400).json({ error: 'Minimum withdrawal is $10 USDT' });
  if (user.balance < reqAmt)
    return res.status(400).json({ error: `Insufficient withdrawable balance ($${user.balance.toFixed(2)})` });
  if (!targetAddress) return res.status(400).json({ error: 'Please provide target USDT wallet address' });

  // User's past non-rejected withdrawal history
  const userWithdrawals = state.withdrawalRequests.filter((w) => w.userId === user.id && w.status !== 'rejected');
  const totalWithdrawnSoFar = userWithdrawals.reduce((sum, w) => sum + w.requestedAmount, 0);

  // Daily withdrawals today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayWithdrawnSoFar = userWithdrawals
    .filter((w) => w.createdAt.startsWith(todayStr))
    .reduce((sum, w) => sum + w.requestedAmount, 0);

  // 1. Check Daily Capping Rule ($100 / day Max)
  const MAX_DAILY_CAP = 100;
  if (todayWithdrawnSoFar + reqAmt > MAX_DAILY_CAP) {
    const remainingDaily = Math.max(0, MAX_DAILY_CAP - todayWithdrawnSoFar);
    return res.status(400).json({
      error: `Daily Withdrawal Limit Exceeded! Maximum allowed per day is $${MAX_DAILY_CAP} USDT. You have already withdrawn $${todayWithdrawnSoFar.toFixed(2)} USDT today. Maximum remaining allowed today: $${remainingDaily.toFixed(2)} USDT.`,
    });
  }

  // 2. Check Total Lifetime Capacity Capping Rule:
  // - $10 Package: $10 Max Cap (Must upgrade to $20 Booster Package to unlock higher limits)
  // - $20 Package: $100 Cap
  // - $20 Package + 2 Directs: $200 Cap
  // - Bronze Rank (with $20 Pkg): $400 Cap
  // - Silver Rank (with $20 Pkg): $700 Cap
  // - Gold Rank+ (with $20 Pkg): Unlimited Cap
  const activePkg = state.settings.packages.find((p) => p.id === user.activePackageId);
  const hasBoosterTx = state.transactions.some(
    (t) => t.userId === user.id && t.notes && (t.notes.includes('Booster Pass') || t.notes.includes('$20') || t.notes.includes('pkg-20'))
  );
  const isUpgraded20 = !!(
    user.isUpgraded ||
    (activePkg && (activePkg.price >= 20 || activePkg.isUpgradePackage)) ||
    user.activePackageId === 'pkg-20' ||
    hasBoosterTx
  );

  let capacityLimit = 10;
  let tierName = '$10 Starter Package ($10 Max Cap)';
  let isUnlimited = false;

  if (!isUpgraded20) {
    // $10 Starter Package: Maximum $10 withdrawal capacity strictly enforced!
    capacityLimit = 10;
    tierName = '$10 Starter Package ($10 Max Cap)';
  } else {
    // $20 Booster Package / Upgraded Package unlocks higher caps and rank benefits
    const rankLower = (user.rank || '').toLowerCase();
    const directsCount = user.directReferralsCount || 0;

    if (
      rankLower.includes('gold') ||
      rankLower.includes('diamond') ||
      rankLower.includes('apex') ||
      rankLower.includes('sovereign') ||
      rankLower.includes('crown')
    ) {
      capacityLimit = Infinity;
      tierName = 'Gold Rank (Unlimited)';
      isUnlimited = true;
    } else if (rankLower.includes('silver')) {
      capacityLimit = 700;
      tierName = 'Silver Rank ($700 Cap)';
    } else if (rankLower.includes('bronze')) {
      capacityLimit = 400;
      tierName = 'Bronze Rank ($400 Cap)';
    } else if (directsCount >= 2) {
      capacityLimit = 200;
      tierName = '$20 Package + 2 Directs ($200 Cap)';
    } else {
      capacityLimit = 100;
      tierName = '$20 Booster Package ($100 Cap)';
    }
  }

  if (!isUnlimited && (reqAmt > capacityLimit || totalWithdrawnSoFar + reqAmt > capacityLimit)) {
    const remainingCap = Math.max(0, capacityLimit - totalWithdrawnSoFar);
    return res.status(400).json({
      error: `Withdrawal Limit Exceeded! Your status (${tierName}) allows maximum total withdrawal of $${capacityLimit} USDT. You requested $${reqAmt.toFixed(2)} USDT (already withdrawn: $${totalWithdrawnSoFar.toFixed(2)} USDT). Remaining allowed: $${remainingCap.toFixed(2)} USDT. Please upgrade to $20 Booster package to unlock higher withdrawal limits!`,
    });
  }

  // Shopping Wallet Deduction Rule: 0% for $10 Starter Package, 30% for $20 Booster / Upgraded Package
  const deductionPercent = isUpgraded20
    ? (state.settings.upgradeFundDeductionPercent !== undefined ? state.settings.upgradeFundDeductionPercent : 30)
    : 0; // 0% for $10 package
  const upgradeDeduction = reqAmt * (deductionPercent / 100);
  const gasFee = 1.5;
  const netAmount = Math.max(0, reqAmt - upgradeDeduction - gasFee);

  // Deduct requested amount from available balance
  user.balance -= reqAmt;
  if (upgradeDeduction > 0) {
    user.upgradeBalance += upgradeDeduction;
  }

  const wd: WithdrawalRequest = {
    id: `wd-${Date.now()}`,
    userId: user.id,
    userNodeId: user.nodeId,
    userName: user.name,
    requestedAmount: reqAmt,
    upgradeDeduction,
    gasFee,
    netAmount,
    targetAddress: targetAddress.trim(),
    network: network || 'BEP20',
    status: 'pending',
    createdAt: new Date().toISOString(),
    adminNotes: 'Submitted - Pending Admin Approval & Blockchain Dispatched',
  };

  state.withdrawalRequests.unshift(wd);

  state.transactions.unshift({
    id: `tx-${Date.now()}-wd`,
    userId: user.id,
    userNodeId: user.nodeId,
    type: 'withdrawal',
    amount: reqAmt,
    status: 'pending',
    txHash: 'Pending Approval',
    network,
    notes: `Withdrawal Request: $${reqAmt} USDT ($${upgradeDeduction.toFixed(2)} to Upgrade Wallet, Net $${netAmount.toFixed(2)})`,
    createdAt: new Date().toISOString(),
  });

  saveStore();
  res.json({ success: true, withdrawalRequest: wd, user });
});

// 8. Spin Wheel Game
app.post('/api/spin', (req: Request, res: Response) => {
  const user = state.users.find((u) => u.id === state.activeUserId);
  if (!user) return res.status(400).json({ error: 'User not logged in' });

  // Auto-recharge free spins if interval time has passed
  const intervalHours = state.settings.spinWheelIntervalHours || 24;
  const creditsToGrant = state.settings.spinCreditsPerReset || 1;

  if (user.spinCredits <= 0) {
    const lastTime = user.lastSpinAt ? new Date(user.lastSpinAt).getTime() : new Date(user.registeredAt).getTime();
    const elapsedHours = (Date.now() - lastTime) / (1000 * 60 * 60);

    if (elapsedHours >= intervalHours) {
      user.spinCredits += creditsToGrant;
    } else {
      const remainingHours = Math.ceil(intervalHours - elapsedHours);
      return res.status(400).json({
        error: `No Spin Credits remaining! Free spin recharges every ${intervalHours} hours. Please wait ~${remainingHours} hour(s) or refer active nodes to earn instant spin credits.`,
      });
    }
  }

  user.spinCredits -= 1;
  user.lastSpinAt = new Date().toISOString();

  // Weighted random pick
  const rewards = state.settings.spinWheelRewards;
  const totalWeight = rewards.reduce((sum, r) => sum + r.probability, 0);
  let randomVal = Math.random() * totalWeight;

  let winningReward = rewards[0];
  for (const r of rewards) {
    if (randomVal < r.probability) {
      winningReward = r;
      break;
    }
    randomVal -= r.probability;
  }

  if (winningReward.amount > 0) {
    user.balance += winningReward.amount;
    user.spinEarned += winningReward.amount;
    user.totalEarned += winningReward.amount;

    state.transactions.unshift({
      id: `tx-${Date.now()}-spin`,
      userId: user.id,
      userNodeId: user.nodeId,
      type: 'spin_reward',
      amount: winningReward.amount,
      status: 'completed',
      notes: `Daily Spin Wheel Reward: ${winningReward.label}`,
      createdAt: new Date().toISOString(),
    });
  } else if (winningReward.label === 'Extra Spin') {
    user.spinCredits += 1;
  }

  saveStore();
  res.json({ success: true, winningReward, user });
});

// Helper function to get team members up to depth level
function getTeamMembersUpToLevel(rootUserId: string, maxLevelDepth: number = 0): { user: User; level: number }[] {
  const result: { user: User; level: number }[] = [];
  let currentLevelUserIds = [rootUserId];
  let currentLevel = 1;

  while (currentLevelUserIds.length > 0) {
    if (maxLevelDepth > 0 && currentLevel > maxLevelDepth) break;

    const children = state.users.filter((u) => u.sponsorId && currentLevelUserIds.includes(u.sponsorId));
    if (children.length === 0) break;

    children.forEach((child) => {
      result.push({ user: child, level: currentLevel });
    });

    currentLevelUserIds = children.map((c) => c.id);
    currentLevel++;
  }

  return result;
}

// Function to check if a user satisfies a rank qualification
function checkRankQualification(user: User, rank: RankConfig) {
  const userPkg = state.settings.packages.find((p) => p.id === user.activePackageId);
  const userSelfPkgPrice = userPkg ? userPkg.price : 0;
  const minSelfPkgPrice = rank.minSelfPackagePrice || 0;
  const isSelfPkgOk = userSelfPkgPrice >= minSelfPkgPrice;

  const directsCount = user.directReferralsCount || state.users.filter((u) => u.sponsorId === user.id).length;
  const reqDirects = rank.requiredDirects || 0;
  const isDirectsOk = directsCount >= reqDirects;

  const maxDepth = rank.upToLevel || 0; // 0 means unlimited
  const teamInScope = getTeamMembersUpToLevel(user.id, maxDepth);

  // Count team members whose active package price >= required self package price (or minSelfPackagePrice)
  const reqPkgPriceThreshold = minSelfPkgPrice > 0 ? minSelfPkgPrice : 1;
  const samePkgCount = teamInScope.filter((item) => {
    const pkg = state.settings.packages.find((p) => p.id === item.user.activePackageId);
    return pkg ? pkg.price >= reqPkgPriceThreshold : false;
  }).length;

  const reqSamePkgCount = rank.requiredSamePackageCount || 0;
  const isSamePkgCountOk = samePkgCount >= reqSamePkgCount;

  const reqVol = rank.requiredVolume || 0;
  const isTeamVolOk = reqVol > 0 ? user.teamVolume >= reqVol : true;

  const isQualified = isSelfPkgOk && isDirectsOk && isSamePkgCountOk && isTeamVolOk;

  const reasons: string[] = [];
  if (!isSelfPkgOk) reasons.push(`Requires active package of $${minSelfPkgPrice}+ (Current: $${userSelfPkgPrice})`);
  if (!isDirectsOk) reasons.push(`Requires ${reqDirects} direct sponsors (Current: ${directsCount})`);
  if (!isSamePkgCountOk) reasons.push(`Requires ${reqSamePkgCount} team members with $${reqPkgPriceThreshold}+ package up to Level ${maxDepth || 'All'} (Current: ${samePkgCount})`);
  if (!isTeamVolOk) reasons.push(`Requires $${reqVol.toLocaleString()} team volume (Current: $${user.teamVolume.toLocaleString()})`);

  return {
    isQualified,
    userSelfPkgPrice,
    minSelfPkgPrice,
    isSelfPkgOk,
    directsCount,
    reqDirects,
    isDirectsOk,
    samePkgCount,
    reqSamePkgCount,
    isSamePkgCountOk,
    upToLevel: maxDepth,
    isTeamVolOk,
    reasons,
  };
}

// 9. Claim Rank Bonus
app.post('/api/rank/claim', (req: Request, res: Response) => {
  const { rankId } = req.body;
  const user = state.users.find((u) => u.id === state.activeUserId);
  const rank = state.settings.ranks.find((r) => r.id === rankId);

  if (!user || !rank) return res.status(400).json({ error: 'Invalid user or rank' });

  const evalResult = checkRankQualification(user, rank);
  if (!evalResult.isQualified) {
    return res.status(400).json({
      error: `Qualifications not met for ${rank.name} rank: ${evalResult.reasons.join('; ')}`,
      details: evalResult,
    });
  }

  user.balance += rank.bonusUsdt;
  user.rankEarned += rank.bonusUsdt;
  user.totalEarned += rank.bonusUsdt;
  user.rank = rank.name;

  state.transactions.unshift({
    id: `tx-${Date.now()}-rnk`,
    userId: user.id,
    userNodeId: user.nodeId,
    type: 'rank_bonus',
    amount: rank.bonusUsdt,
    status: 'completed',
    notes: `Leadership Rank Reward Claimed: ${rank.name} (${rank.rewardTitle || `$${rank.bonusUsdt} USDT`})`,
    createdAt: new Date().toISOString(),
  });

  saveStore();
  res.json({ success: true, user, rank });
});

// 10. Simulate Boosting Queue FIFO Payout & Rebirth
app.post('/api/boosting/simulate', (req: Request, res: Response) => {
  if (state.boostingQueue.length === 0) {
    return res.status(400).json({ error: 'Global Boosting Queue is currently empty.' });
  }

  // Sort queue by position
  state.boostingQueue.sort((a, b) => a.position - b.position);

  const winnerEntry = state.boostingQueue[0];
  const winnerUser = state.users.find((u) => u.id === winnerEntry.userId);
  const rewardAmt = state.settings.boostingPool.rewardAmount;

  if (winnerUser) {
    winnerUser.balance += rewardAmt;
    winnerUser.boostingEarned += rewardAmt;
    winnerUser.totalEarned += rewardAmt;

    state.transactions.unshift({
      id: `tx-${Date.now()}-bst-payout`,
      userId: winnerUser.id,
      userNodeId: winnerUser.nodeId,
      type: 'boosting_payout',
      amount: rewardAmt,
      status: 'completed',
      notes: `Global Gold Pool FIFO Cycle Reward ($${rewardAmt} USDT)`,
      createdAt: new Date().toISOString(),
    });
  }

  // Remove top entry
  state.boostingQueue.shift();

  // Handle Rebirth if rebirthCount < maxRebirthLimit
  if (winnerEntry.rebirthCount < state.settings.boostingPool.maxRebirthLimit && winnerUser) {
    const maxPos = state.boostingQueue.reduce((max, b) => Math.max(max, b.position), 0);
    state.boostingQueue.push({
      id: `bst-${Date.now()}-rb`,
      userId: winnerUser.id,
      nodeId: winnerUser.nodeId,
      userName: winnerUser.name,
      packageId: winnerEntry.packageId,
      rebirthCount: winnerEntry.rebirthCount + 1,
      position: maxPos + 1,
      maxRebirthLimit: state.settings.boostingPool.maxRebirthLimit,
      qualifiedAt: new Date().toISOString(),
      status: 'queued',
    });
  }

  // Re-index remaining positions
  state.boostingQueue.forEach((entry, idx) => {
    entry.position = idx + 1;
  });

  saveStore();
  res.json({
    success: true,
    winner: winnerEntry,
    updatedQueue: state.boostingQueue,
  });
});

// ADMIN ROUTES

// A1. Update System Settings
app.put('/api/admin/settings', (req: Request, res: Response) => {
  const newSettings: SystemSettings = req.body;
  if (!newSettings) return res.status(400).json({ error: 'Invalid settings body' });

  state.settings = newSettings;
  saveStore();
  res.json({ success: true, settings: state.settings });
});

// A2. Admin Update User Balances
app.post('/api/admin/users/update-balance', (req: Request, res: Response) => {
  const { userId, balance, depositBalance, upgradeBalance } = req.body;
  const user = state.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (typeof balance === 'number') user.balance = balance;
  if (typeof depositBalance === 'number') user.depositBalance = depositBalance;
  if (typeof upgradeBalance === 'number') user.upgradeBalance = upgradeBalance;

  state.transactions.unshift({
    id: `tx-${Date.now()}-adm`,
    userId: user.id,
    userNodeId: user.nodeId,
    type: 'admin_adjust',
    amount: balance,
    status: 'completed',
    notes: `Admin Manual Balance Adjustment: Withdrawable=$${user.balance.toFixed(2)}, Deposit Wallet=$${(user.depositBalance || 0).toFixed(2)}, Upgrade=$${user.upgradeBalance.toFixed(2)}`,
    createdAt: new Date().toISOString(),
  });

  saveStore();
  res.json({ success: true, user });
});

// A2.6. Delete User Endpoint
const handleDeleteUserHandler = (req: Request, res: Response) => {
  const userId = req.body?.userId || req.body?.id || req.params?.id;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  const userIndex = state.users.findIndex((u) => u.id === userId || u.nodeId === userId);
  if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

  const targetUser = state.users[userIndex];
  if (targetUser.nodeId === 'NX-ROOT01' || targetUser.id === 'usr-root') {
    return res.status(400).json({ error: 'Cannot delete ROOT system node (NX-ROOT01)' });
  }

  // Remove user from state.users
  state.users.splice(userIndex, 1);

  // Clean up references where sponsorId or placementUplineId was deleted user
  state.users.forEach((u) => {
    if (u.sponsorId === targetUser.id) {
      u.sponsorId = targetUser.sponsorId || 'usr-root';
    }
    if (u.placementUplineId === targetUser.id) {
      u.placementUplineId = targetUser.placementUplineId || 'usr-root';
    }
  });

  // Remove from boosting queue if present
  state.boostingQueue = state.boostingQueue.filter((b) => b.userId !== targetUser.id);

  // If active user was deleted, reset active user to root
  if (state.activeUserId === targetUser.id) {
    state.activeUserId = 'usr-root';
  }

  // Recalculate direct referrals count for all remaining users
  updateTeamVolumeAndCounts();

  saveStore();
  res.json({ success: true, message: `User ${targetUser.name} (${targetUser.nodeId}) deleted successfully` });
};

app.post('/api/admin/users/delete', handleDeleteUserHandler);
app.delete('/api/admin/users/:id', handleDeleteUserHandler);

// A2.5. Admin Full User Profile Update (Name, Email, Password, Node ID, Wallet, Sponsor, Balances, Package, Rank, Status, Admin Role)
app.post('/api/admin/users/update-user', (req: Request, res: Response) => {
  const {
    userId,
    name,
    email,
    password,
    nodeId,
    walletAddress,
    sponsorId,
    balance,
    depositBalance,
    upgradeBalance,
    rank,
    status,
    isAdmin,
    activePackageId,
  } = req.body;

  const user = state.users.find((u) => u.id === userId || u.nodeId === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (typeof name === 'string' && name.trim()) user.name = name.trim();
  if (typeof email === 'string' && email.trim()) user.email = email.trim();
  if (typeof password === 'string' && password.trim()) user.password = password.trim();
  if (typeof nodeId === 'string' && nodeId.trim()) user.nodeId = nodeId.trim();
  if (typeof walletAddress === 'string') user.walletAddress = walletAddress.trim();
  if (typeof sponsorId === 'string') user.sponsorId = sponsorId.trim() || null;

  if (typeof balance === 'number' && !isNaN(balance)) user.balance = balance;
  if (typeof depositBalance === 'number' && !isNaN(depositBalance)) user.depositBalance = depositBalance;
  if (typeof upgradeBalance === 'number' && !isNaN(upgradeBalance)) user.upgradeBalance = upgradeBalance;

  if (rank && ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Crown'].includes(rank)) {
    user.rank = rank as any;
  }
  if (status && ['active', 'inactive', 'banned'].includes(status)) {
    user.status = status as any;
  }
  if (typeof isAdmin === 'boolean') {
    user.isAdmin = isAdmin;
  }

  if (activePackageId !== undefined) {
    if (activePackageId === null || activePackageId === '' || activePackageId === 'none') {
      user.activePackageId = null;
    } else {
      user.activePackageId = activePackageId;
      if (!user.packageActivatedAt) {
        user.packageActivatedAt = new Date().toISOString();
      }
    }
  }

  saveStore();
  return res.json({
    success: true,
    user,
    message: `User #${user.nodeId} (${user.name}) profile updated successfully!`,
  });
});

// A3. Admin Toggle User Package
app.post('/api/admin/users/toggle-package', (req: Request, res: Response) => {
  const { userId, packageId } = req.body;
  const user = state.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.activePackageId = packageId;
  user.packageActivatedAt = packageId ? new Date().toISOString() : null;

  saveStore();
  res.json({ success: true, user });
});

// A3.5. Admin Toggle User Admin Status
app.post('/api/admin/users/toggle-admin', (req: Request, res: Response) => {
  const { userId, isAdmin } = req.body;
  const user = state.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.isAdmin = typeof isAdmin === 'boolean' ? isAdmin : !user.isAdmin;

  saveStore();
  res.json({ success: true, user });
});

// A4. Admin Approve / Reject Deposit
app.post('/api/admin/deposit/action', (req: Request, res: Response) => {
  const { requestId, action, adminNotes } = req.body;
  const dep = state.depositRequests.find((d) => d.id === requestId);
  if (!dep) return res.status(404).json({ error: 'Deposit request not found' });

  dep.status = action === 'approve' ? 'approved' : 'rejected';
  dep.adminNotes = adminNotes || (action === 'approve' ? 'Approved by Admin' : 'Rejected by Admin');

  if (action === 'approve') {
    const user = state.users.find((u) => u.id === dep.userId);
    if (user) {
      user.depositBalance = (user.depositBalance || 0) + dep.amount;
      state.transactions.unshift({
        id: `tx-${Date.now()}-dep-app`,
        userId: user.id,
        userNodeId: user.nodeId,
        type: 'deposit',
        amount: dep.amount,
        status: 'completed',
        txHash: dep.txHash,
        network: dep.network,
        notes: `Deposit Approved: +$${dep.amount} USDT credited to Deposit Wallet`,
        createdAt: new Date().toISOString(),
      });
    }
  }

  saveStore();
  res.json({ success: true, depositRequest: dep });
});

// A5. Admin Approve / Reject Withdrawal
app.post('/api/admin/withdraw/action', (req: Request, res: Response) => {
  const { requestId, action, adminNotes, txHash } = req.body;
  const wd = state.withdrawalRequests.find((w) => w.id === requestId);
  if (!wd) return res.status(404).json({ error: 'Withdrawal request not found' });

  wd.status = action === 'approve' ? 'approved' : 'rejected';
  wd.adminNotes = adminNotes || (action === 'approve' ? 'Dispatched via Blockchain' : 'Rejected by Admin');

  const user = state.users.find((u) => u.id === wd.userId);

  if (action === 'reject' && user) {
    // Refund user balance if rejected
    user.balance += wd.requestedAmount;
    if (wd.upgradeDeduction > 0) {
      user.upgradeBalance = Math.max(0, user.upgradeBalance - wd.upgradeDeduction);
    }
  } else if (action === 'approve' && user) {
    state.transactions.unshift({
      id: `tx-${Date.now()}-wd-app`,
      userId: user.id,
      userNodeId: user.nodeId,
      type: 'withdrawal',
      amount: wd.requestedAmount,
      status: 'completed',
      txHash: txHash || `0x${Math.random().toString(16).substring(2, 20)}`,
      network: wd.network,
      notes: `Withdrawal Dispatched: Net $${wd.netAmount.toFixed(2)} USDT`,
      createdAt: new Date().toISOString(),
    });
  }

  saveStore();
  res.json({ success: true, withdrawalRequest: wd });
});

// A6. Admin Delete Boosting Queue Entry
app.delete('/api/admin/boosting/entry/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  state.boostingQueue = state.boostingQueue.filter((b) => b.id !== id);
  state.boostingQueue.forEach((entry, idx) => {
    entry.position = idx + 1;
  });

  saveStore();
  res.json({ success: true, boostingQueue: state.boostingQueue });
});

// A7. Sync & Rebuild Boosting Queue
app.post('/api/admin/boosting/sync', (req: Request, res: Response) => {
  const minDirects = state.settings.boostingPool.minDirects;
  const minPkgPrice = state.settings.boostingPool.minPackagePrice;

  state.users.forEach((u) => {
    if (u.activePackageId) {
      const pkg = state.settings.packages.find((p) => p.id === u.activePackageId);
      if (pkg && pkg.price >= minPkgPrice && u.directReferralsCount >= minDirects) {
        const inQueue = state.boostingQueue.some((b) => b.userId === u.id);
        if (!inQueue) {
          const maxPos = state.boostingQueue.reduce((max, b) => Math.max(max, b.position), 0);
          state.boostingQueue.push({
            id: `bst-${Date.now()}-${u.nodeId}`,
            userId: u.id,
            nodeId: u.nodeId,
            userName: u.name,
            packageId: pkg.id,
            rebirthCount: 0,
            position: maxPos + 1,
            maxRebirthLimit: state.settings.boostingPool.maxRebirthLimit,
            qualifiedAt: new Date().toISOString(),
            status: 'queued',
          });
        }
      }
    }
  });

  saveStore();
  res.json({ success: true, boostingQueue: state.boostingQueue });
});

// A8. SQLite Admin Info & Database File Download
app.get('/api/admin/sqlite-status', (req: Request, res: Response) => {
  let fileSizeKb = 0;
  let fileExists = false;
  if (fs.existsSync(DB_FILE_SQLITE)) {
    const stats = fs.statSync(DB_FILE_SQLITE);
    fileSizeKb = parseFloat((stats.size / 1024).toFixed(2));
    fileExists = true;
  }

  let counts = {
    users: state.users.length,
    transactions: state.transactions.length,
    depositRequests: state.depositRequests.length,
    withdrawalRequests: state.withdrawalRequests.length,
    boostingQueue: state.boostingQueue.length,
    settings: 1,
  };

  if (db) {
    try {
      const uRes = db.exec('SELECT COUNT(*) FROM users');
      const txRes = db.exec('SELECT COUNT(*) FROM transactions');
      const depRes = db.exec('SELECT COUNT(*) FROM deposit_requests');
      const wdRes = db.exec('SELECT COUNT(*) FROM withdrawal_requests');
      const bstRes = db.exec('SELECT COUNT(*) FROM boosting_queue');

      counts = {
        users: (uRes[0]?.values[0][0] as number) || 0,
        transactions: (txRes[0]?.values[0][0] as number) || 0,
        depositRequests: (depRes[0]?.values[0][0] as number) || 0,
        withdrawalRequests: (wdRes[0]?.values[0][0] as number) || 0,
        boostingQueue: (bstRes[0]?.values[0][0] as number) || 0,
        settings: 1,
      };
    } catch (e) {
      // Fallback
    }
  }

  res.json({
    success: true,
    engine: 'SQLite (sql.js / WASM + Disk File Persistence)',
    filePath: DB_FILE_SQLITE,
    jsonPath: DB_FILE_JSON,
    fileExists,
    fileSizeKb,
    fileSizeMb: parseFloat((fileSizeKb / 1024).toFixed(3)),
    tableCounts: counts,
  });
});

app.get('/api/admin/sqlite-download', (req: Request, res: Response) => {
  if (fs.existsSync(DB_FILE_SQLITE)) {
    res.setHeader('Content-Type', 'application/x-sqlite3');
    res.setHeader('Content-Disposition', 'attachment; filename="database.sqlite"');
    return res.sendFile(DB_FILE_SQLITE);
  } else {
    return res.status(404).json({ error: 'SQLite database file not found yet.' });
  }
});

app.get('/api/admin/json-download', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="store.json"');
  return res.json(state);
});

app.get('/api/admin/users/export-csv', (req: Request, res: Response) => {
  const headers = [
    'Node ID',
    'Name',
    'Email',
    'Role',
    'Active Package ID',
    'Active Package Name',
    'Withdrawable Balance ($)',
    'Upgrade Balance ($)',
    'Total Earned ($)',
    'ROI Earned ($)',
    'Level Earned ($)',
    'Sponsor Earned ($)',
    'Rank Earned ($)',
    'Boosting Earned ($)',
    'Spin Earned ($)',
    'Direct Referrals Count',
    'Team Count',
    'Team Volume ($)',
    'Sponsor ID',
    'Rank Tier',
    'Status',
    'Password',
    'Spin Credits',
    'Wallet Address',
    'Registered Date',
    'Internal ID',
  ];

  const rows = state.users.map((u) => {
    const pkg = state.settings.packages.find((p) => p.id === u.activePackageId)?.name || 'None';
    const role = (u.isAdmin || u.nodeId === 'NX-ROOT01') ? 'ADMIN' : 'MEMBER';
    return [
      `"${u.nodeId || ''}"`,
      `"${(u.name || '').replace(/"/g, '""')}"`,
      `"${(u.email || '').replace(/"/g, '""')}"`,
      `"${role}"`,
      `"${u.activePackageId || ''}"`,
      `"${pkg}"`,
      (u.balance || 0).toFixed(2),
      (u.upgradeBalance || 0).toFixed(2),
      (u.totalEarned || 0).toFixed(2),
      (u.roiEarned || 0).toFixed(2),
      (u.levelEarned || 0).toFixed(2),
      (u.sponsorEarned || 0).toFixed(2),
      (u.rankEarned || 0).toFixed(2),
      (u.boostingEarned || 0).toFixed(2),
      (u.spinEarned || 0).toFixed(2),
      u.directReferralsCount || 0,
      u.teamCount || 0,
      (u.teamVolume || 0).toFixed(2),
      `"${u.sponsorId || ''}"`,
      `"${u.rank || 'Bronze'}"`,
      `"${u.status || 'active'}"`,
      `"${u.password || '123456'}"`,
      u.spinCredits || 0,
      `"${u.walletAddress || ''}"`,
      `"${u.registeredAt || ''}"`,
      `"${u.id || ''}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="users_full_export.csv"');
  return res.send(csvContent);
});

// Import & Update Users from CSV File
app.post('/api/admin/users/import-csv', (req: Request, res: Response) => {
  try {
    const { csvText } = req.body;
    if (!csvText || typeof csvText !== 'string') {
      return res.status(400).json({ error: 'No CSV content provided' });
    }

    // Split lines and parse CSV fields
    const parseCsvLines = (text: string) => {
      const lines = text.split(/\r?\n/);
      const rows: string[][] = [];
      for (const line of lines) {
        if (!line.trim()) continue;
        const row: string[] = [];
        let insideQuote = false;
        let entry = '';
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (insideQuote && line[i + 1] === '"') {
              entry += '"';
              i++;
            } else {
              insideQuote = !insideQuote;
            }
          } else if (char === ',' && !insideQuote) {
            row.push(entry.trim());
            entry = '';
          } else {
            entry += char;
          }
        }
        row.push(entry.trim());
        rows.push(row);
      }
      return rows;
    };

    const parsedRows = parseCsvLines(csvText);
    if (parsedRows.length < 2) {
      return res.status(400).json({ error: 'CSV file is empty or missing data rows' });
    }

    const headerLine = parsedRows[0].map((h) => h.replace(/^"|"$/g, '').toLowerCase().trim());
    const getIndex = (name: string) => headerLine.findIndex((h) => h.includes(name.toLowerCase()));

    const idxNodeId = getIndex('node id');
    const idxInternalId = getIndex('internal id');
    const idxName = getIndex('name');
    const idxEmail = getIndex('email');
    const idxRole = getIndex('role');
    const idxActivePkgId = getIndex('active package id');
    const idxActivePkgName = getIndex('active package');
    const idxBalance = getIndex('withdrawable balance');
    const idxUpgradeBal = getIndex('upgrade balance');
    const idxTotalEarned = getIndex('total earned');
    const idxRoiEarned = getIndex('roi earned');
    const idxLevelEarned = getIndex('level earned');
    const idxSponsorEarned = getIndex('sponsor earned');
    const idxRankEarned = getIndex('rank earned');
    const idxBoostingEarned = getIndex('boosting earned');
    const idxSpinEarned = getIndex('spin earned');
    const idxDirects = getIndex('direct referrals');
    const idxTeamCount = getIndex('team count');
    const idxTeamVol = getIndex('team volume');
    const idxSponsorId = getIndex('sponsor id');
    const idxRank = getIndex('rank tier');
    const idxStatus = getIndex('status');
    const idxPassword = getIndex('password');
    const idxSpinCredits = getIndex('spin credits');
    const idxWallet = getIndex('wallet address');

    let updatedCount = 0;
    let createdCount = 0;

    for (let i = 1; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      const getValue = (idx: number) => (idx !== -1 && row[idx] !== undefined ? row[idx].replace(/^"|"$/g, '').trim() : '');

      const nodeId = getValue(idxNodeId);
      const internalId = getValue(idxInternalId);
      const email = getValue(idxEmail);

      if (!nodeId && !internalId && !email) continue;

      // Find user by Node ID, Internal ID, or Email
      let user = state.users.find(
        (u) =>
          (nodeId && u.nodeId === nodeId) ||
          (internalId && u.id === internalId) ||
          (email && u.email.toLowerCase() === email.toLowerCase())
      );

      const isNew = !user;
      if (!user) {
        user = {
          id: internalId || `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          nodeId: nodeId || `NX-${Math.floor(100000 + Math.random() * 900000)}`,
          name: getValue(idxName) || 'New User',
          email: email || `user_${Date.now()}@nx.com`,
          walletAddress: getValue(idxWallet) || '',
          sponsorId: getValue(idxSponsorId) || null,
          activePackageId: null,
          packageActivatedAt: null,
          packageExpiryDays: 0,
          balance: 0,
          depositBalance: 0,
          upgradeBalance: 0,
          totalEarned: 0,
          roiEarned: 0,
          levelEarned: 0,
          sponsorEarned: 0,
          rankEarned: 0,
          boostingEarned: 0,
          spinEarned: 0,
          directReferralsCount: 0,
          teamCount: 0,
          teamVolume: 0,
          rank: 'None',
          status: 'active',
          registeredAt: new Date().toISOString(),
          lastRoiClaimAt: new Date().toISOString(),
          spinCredits: 3,
          lastSpinAt: null,
        };
        state.users.push(user);
        createdCount++;
      } else {
        updatedCount++;
      }

      // Update values from CSV if index exists
      if (idxName !== -1 && getValue(idxName)) user.name = getValue(idxName);
      if (idxEmail !== -1 && getValue(idxEmail)) user.email = getValue(idxEmail);
      if (idxPassword !== -1 && getValue(idxPassword)) user.password = getValue(idxPassword);
      if (idxWallet !== -1) user.walletAddress = getValue(idxWallet);
      if (idxSponsorId !== -1) user.sponsorId = getValue(idxSponsorId) || null;

      if (idxBalance !== -1 && !isNaN(parseFloat(getValue(idxBalance)))) {
        user.balance = parseFloat(getValue(idxBalance));
      }
      if (idxUpgradeBal !== -1 && !isNaN(parseFloat(getValue(idxUpgradeBal)))) {
        user.upgradeBalance = parseFloat(getValue(idxUpgradeBal));
      }
      if (idxTotalEarned !== -1 && !isNaN(parseFloat(getValue(idxTotalEarned)))) {
        user.totalEarned = parseFloat(getValue(idxTotalEarned));
      }
      if (idxRoiEarned !== -1 && !isNaN(parseFloat(getValue(idxRoiEarned)))) {
        user.roiEarned = parseFloat(getValue(idxRoiEarned));
      }
      if (idxLevelEarned !== -1 && !isNaN(parseFloat(getValue(idxLevelEarned)))) {
        user.levelEarned = parseFloat(getValue(idxLevelEarned));
      }
      if (idxSponsorEarned !== -1 && !isNaN(parseFloat(getValue(idxSponsorEarned)))) {
        user.sponsorEarned = parseFloat(getValue(idxSponsorEarned));
      }
      if (idxRankEarned !== -1 && !isNaN(parseFloat(getValue(idxRankEarned)))) {
        user.rankEarned = parseFloat(getValue(idxRankEarned));
      }
      if (idxBoostingEarned !== -1 && !isNaN(parseFloat(getValue(idxBoostingEarned)))) {
        user.boostingEarned = parseFloat(getValue(idxBoostingEarned));
      }
      if (idxSpinEarned !== -1 && !isNaN(parseFloat(getValue(idxSpinEarned)))) {
        user.spinEarned = parseFloat(getValue(idxSpinEarned));
      }

      if (idxDirects !== -1 && !isNaN(parseInt(getValue(idxDirects)))) {
        user.directReferralsCount = parseInt(getValue(idxDirects));
      }
      if (idxTeamCount !== -1 && !isNaN(parseInt(getValue(idxTeamCount)))) {
        user.teamCount = parseInt(getValue(idxTeamCount));
      }
      if (idxTeamVol !== -1 && !isNaN(parseFloat(getValue(idxTeamVol)))) {
        user.teamVolume = parseFloat(getValue(idxTeamVol));
      }
      if (idxSpinCredits !== -1 && !isNaN(parseInt(getValue(idxSpinCredits)))) {
        user.spinCredits = parseInt(getValue(idxSpinCredits));
      }

      if (idxRank !== -1 && getValue(idxRank)) {
        user.rank = getValue(idxRank) as any;
      }

      if (idxStatus !== -1 && getValue(idxStatus)) {
        const st = getValue(idxStatus).toLowerCase();
        if (st === 'active' || st === 'inactive' || st === 'banned') {
          user.status = st as any;
        }
      }

      if (idxRole !== -1) {
        const roleStr = getValue(idxRole).toUpperCase();
        user.isAdmin = roleStr === 'ADMIN';
      }

      // Package update
      const pkgId = getValue(idxActivePkgId);
      const pkgName = getValue(idxActivePkgName);
      if (pkgId) {
        user.activePackageId = pkgId;
      } else if (pkgName && pkgName !== 'None') {
        const matchedPkg = state.settings.packages.find((p) => p.name.toLowerCase() === pkgName.toLowerCase());
        if (matchedPkg) user.activePackageId = matchedPkg.id;
      }
    }

    saveStore();
    return res.json({
      success: true,
      updatedCount,
      createdCount,
      message: `Successfully processed CSV! Updated ${updatedCount} users, created ${createdCount} new users. Saved to SQLite database.`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to import CSV users' });
  }
});

app.post('/api/admin/json-restore', (req: Request, res: Response) => {
  try {
    const newStore = req.body;
    if (!newStore || !Array.isArray(newStore.users) || !newStore.settings) {
      return res.status(400).json({ error: 'Invalid database JSON format. Must contain "users" and "settings".' });
    }

    // Replace in-memory state
    state = {
      ...state,
      ...newStore,
    };

    saveStore();
    return res.json({ success: true, message: 'Database state successfully updated & saved to SQLite and JSON files!' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to restore database from JSON' });
  }
});

app.post('/api/admin/sqlite-query', (req: Request, res: Response) => {
  const { sql } = req.body;
  if (!sql || typeof sql !== 'string') {
    return res.status(400).json({ error: 'SQL query required' });
  }

  if (!db) {
    return res.status(500).json({ error: 'SQLite database not initialized' });
  }

  try {
    const result = db.exec(sql);
    // If mutation, sync state & save file
    if (!sql.trim().toUpperCase().startsWith('SELECT')) {
      loadFromSqlite();
      saveStore();
    }
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'SQL execution failed' });
  }
});

// =====================================
// STORE / PRODUCT API ENDPOINTS (Amazon Mall)
// =====================================

// 1. User Buy Product Endpoint
app.post('/api/products/buy', (req: Request, res: Response) => {
  const { productId, quantity = 1, shippingAddress = 'User Default Address', selectedSize, selectedColor } = req.body;
  const user = state.users.find((u) => u.id === state.activeUserId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const product = (state.products || []).find((p) => p.id === productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  if (product.stock < quantity) {
    return res.status(400).json({ error: 'Selected product is out of stock' });
  }

  const totalCost = product.priceUsdt * quantity;
  if (user.upgradeBalance < totalCost) {
    return res.status(400).json({
      error: `Insufficient Upgrade Fund Wallet balance ($${user.upgradeBalance.toFixed(2)} USDT available). Required: $${totalCost.toFixed(2)} USDT. Main Wallet is reserved for withdrawals.`,
    });
  }

  // Deduct user upgrade balance & decrement stock
  user.upgradeBalance -= totalCost;
  product.stock -= quantity;

  // Create Product Order
  const order: ProductOrder = {
    id: `ord-${Date.now()}`,
    userId: user.id,
    userNodeId: user.nodeId,
    userName: user.name,
    productId: product.id,
    productTitle: product.title,
    productImage: product.image,
    priceUsdt: product.priceUsdt,
    quantity,
    selectedSize: selectedSize || undefined,
    selectedColor: selectedColor || undefined,
    totalUsdt: totalCost,
    shippingAddress,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  if (!state.productOrders) state.productOrders = [];
  state.productOrders.unshift(order);

  // Record Transaction
  const variantInfo = [selectedSize && `Size: ${selectedSize}`, selectedColor && `Color: ${selectedColor}`].filter(Boolean).join(', ');
  const itemDesc = variantInfo ? `${product.title} (${variantInfo})` : product.title;

  state.transactions.unshift({
    id: `tx-${Date.now()}-ord`,
    userId: user.id,
    userNodeId: user.nodeId,
    type: 'product_purchase',
    amount: totalCost,
    status: 'completed',
    notes: `Purchased ${quantity}x ${itemDesc} from Amazon Store (Deducted from Upgrade Fund Wallet)`,
    createdAt: new Date().toISOString(),
  });

  saveStore();
  res.json({ success: true, order, newBalance: user.balance, newUpgradeBalance: user.upgradeBalance });
});

// Helper function to parse sizes/colors string or array
const parseVariants = (input: any): string[] | undefined => {
  if (Array.isArray(input)) return input.map((s) => String(s).trim()).filter(Boolean);
  if (typeof input === 'string') {
    const parsed = input.split(',').map((s) => s.trim()).filter(Boolean);
    return parsed.length > 0 ? parsed : undefined;
  }
  return undefined;
};

// 2. Admin Create New Product
app.post('/api/admin/products', (req: Request, res: Response) => {
  const { title, description, priceUsdt, category, image, stock, badge, featured, sizes, colors } = req.body;
  if (!title || !priceUsdt) {
    return res.status(400).json({ error: 'Title and Price are required' });
  }

  const usdtToInr = state.settings.rates.usdtToInr || 90;
  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    title,
    description: description || 'High quality Web3 marketplace product.',
    priceUsdt: Number(priceUsdt),
    priceInr: Number(priceUsdt) * usdtToInr,
    category: category || 'Electronics',
    image: image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
    stock: stock !== undefined ? Number(stock) : 50,
    rating: 5.0,
    reviewsCount: 1,
    badge: badge || 'New Arrival',
    featured: Boolean(featured),
    sizes: parseVariants(sizes),
    colors: parseVariants(colors),
    createdAt: new Date().toISOString(),
  };

  if (!state.products) state.products = [];
  state.products.unshift(newProduct);

  saveStore();
  res.json({ success: true, product: newProduct });
});

// 3. Admin Update Product
app.put('/api/admin/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, priceUsdt, category, image, stock, badge, featured, sizes, colors } = req.body;

  const product = (state.products || []).find((p) => p.id === id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const usdtToInr = state.settings.rates.usdtToInr || 90;

  if (title !== undefined) product.title = title;
  if (description !== undefined) product.description = description;
  if (priceUsdt !== undefined) {
    product.priceUsdt = Number(priceUsdt);
    product.priceInr = Number(priceUsdt) * usdtToInr;
  }
  if (category !== undefined) product.category = category;
  if (image !== undefined) product.image = image;
  if (stock !== undefined) product.stock = Number(stock);
  if (badge !== undefined) product.badge = badge;
  if (featured !== undefined) product.featured = Boolean(featured);
  if (sizes !== undefined) product.sizes = parseVariants(sizes);
  if (colors !== undefined) product.colors = parseVariants(colors);

  saveStore();
  res.json({ success: true, product });
});

// 4. Admin Delete Product
app.delete('/api/admin/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  state.products = (state.products || []).filter((p) => p.id !== id);

  saveStore();
  res.json({ success: true, products: state.products });
});

// 5. Admin Update Order Status (shipped / delivered / cancelled)
app.put('/api/admin/orders/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const order = (state.productOrders || []).find((o) => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  order.status = status;

  saveStore();
  res.json({ success: true, order });
});

// VITE MIDDLEWARE OR STATIC PRODUCTION SERVING
async function startServer() {
  // Initialize SQLite Database before handling traffic
  await initSqlite();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 TetherPlus Cyberpunk Web3 Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
