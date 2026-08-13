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
  LuckyDrawState,
  LuckyDrawTicket,
  LuckyDrawWinner,
  ColorPredictionState,
  ColorPredictionBet,
  ColorPredictionResult,
  AviatorState,
  AviatorBet,
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
      maxMatrixLevels: 10,
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
    usdtToInr: 100,
    inrToUsdt: 0.01,
  },
  withdrawalFeePercent: 2,
  upgradeFundDeductionPercent: 30,
  sponsorGameWinPercent: 5,
  winningWithdrawalFeePercent: 10,
  winningWithdrawalMinAmount: 5,
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
    password: '123456',
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
    password: '123456',
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
    password: '123456',
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
    password: '123456',
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
    password: '123456',
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
    password: '123456',
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
    password: '123456',
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

const initialLuckyDraw: LuckyDrawState = {
  id: 'draw-001',
  title: '⚡ MEGA USDT ELECTRIC LUCKY DRAW',
  description: 'Pick your custom 6-digit lucky coupons! Match 6, 5, or 4 digits to win 1st, 2nd, and 3rd USDT prizes!',
  ticketPrice: 5,
  prizeAmount: 250, // 1st Prize
  secondPrizeAmount: 50, // 2nd Prize (Last 5 Digits)
  thirdPrizeAmount: 10, // 3rd Prize (Last 4 Digits)
  targetEndTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
  status: 'active',
  forcedWinnerUserId: null,
  forcedWinnerTicketNumber: null,
  forcedSecondWinnerUserId: null,
  forcedSecondWinnerTicketNumber: null,
  tickets: [
    {
      id: 'tkt-101',
      ticketNumber: '839210',
      userId: 'usr-demo',
      userNodeId: 'NX-GML9L6',
      userName: 'Alex Cyberpunk (Demo Account)',
      purchasedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'tkt-102',
      ticketNumber: '492015',
      userId: 'usr-alpha2',
      userNodeId: 'NX-ALPHA2',
      userName: 'Neo Matrix',
      purchasedAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ],
  pastWinners: [],
};

const initialColorPrediction: ColorPredictionState = {
  currentPeriodId: `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}1001`,
  periodDurationSeconds: 60,
  startTime: Date.now(),
  forcedNextNumber: null,
  adminMode: 'lowest_payout',
  bets: [],
  history: [
    { periodId: `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}1000`, number: 7, color: 'green', size: 'big', completedAt: new Date(Date.now() - 60000).toISOString() },
    { periodId: `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}0999`, number: 2, color: 'red', size: 'small', completedAt: new Date(Date.now() - 120000).toISOString() },
    { periodId: `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}0998`, number: 0, color: 'violet-red', size: 'small', completedAt: new Date(Date.now() - 180000).toISOString() },
    { periodId: `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}0997`, number: 5, color: 'violet-green', size: 'big', completedAt: new Date(Date.now() - 240000).toISOString() },
    { periodId: `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}0996`, number: 9, color: 'green', size: 'big', completedAt: new Date(Date.now() - 300000).toISOString() }
  ],
};

const initialAviator: AviatorState = {
  currentRoundId: `AV-${Date.now()}`,
  status: 'waiting',
  currentMultiplier: 1.00,
  targetCrashMultiplier: 2.15,
  startTime: Date.now(),
  bets: [],
  history: [1.45, 2.10, 5.80, 1.12, 18.50, 2.05, 1.08, 4.30, 3.12, 1.95],
  forcedNextCrash: null,
  adminMode: 'lowest_payout',
};

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
  luckyDraw: initialLuckyDraw,
  colorPrediction: initialColorPrediction,
  aviator: initialAviator,
  activeUserId: 'usr-demo',
};

// SMTP Configuration Helper
function getSmtpConfig() {
  const smtpPass = process.env.SMTP_PASS || state.settings?.smtp?.pass;
  const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER || state.settings?.smtp?.from || state.settings?.smtp?.user || 'support@tetherplus.live';
  const smtpUser = process.env.SMTP_USER || process.env.SMTP_FROM || state.settings?.smtp?.user || smtpFrom;
  const smtpHost = process.env.SMTP_HOST || state.settings?.smtp?.host || (smtpUser.endsWith('@gmail.com') ? 'smtp.gmail.com' : 'smtpout.secureserver.net');
  const smtpPort = Number(process.env.SMTP_PORT || state.settings?.smtp?.port) || (smtpHost.includes('gmail') ? 587 : 465);

  return {
    smtpPass,
    smtpFrom,
    smtpUser,
    smtpHost,
    smtpPort,
    isConfigured: Boolean(smtpPass && smtpPass.trim().length > 0),
  };
}

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
        password TEXT,
        walletAddress TEXT,
        sponsorId TEXT,
        activePackageId TEXT,
        packageActivatedAt TEXT,
        packageExpiryDays INTEGER,
        balance REAL,
        depositBalance REAL,
        upgradeBalance REAL,
        sponsorAddress TEXT,
        winningBalance REAL,
        winningEarned REAL,
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

    // Ensure users table schema matches expected columns
    try {
      const userCols = db.exec("PRAGMA table_info(users)");
      if (userCols.length > 0) {
        const existingColNames = userCols[0].values.map((v: any) => v[1]);
        const requiredCols: [string, string][] = [
          ['password', 'TEXT DEFAULT "123456"'],
          ['walletAddress', 'TEXT DEFAULT ""'],
          ['sponsorId', 'TEXT DEFAULT ""'],
          ['activePackageId', 'TEXT DEFAULT ""'],
          ['packageActivatedAt', 'TEXT DEFAULT ""'],
          ['packageExpiryDays', 'INTEGER DEFAULT 100'],
          ['balance', 'REAL DEFAULT 0'],
          ['depositBalance', 'REAL DEFAULT 0'],
          ['upgradeBalance', 'REAL DEFAULT 0'],
          ['winningBalance', 'REAL DEFAULT 0'],
          ['winningEarned', 'REAL DEFAULT 0'],
          ['totalEarned', 'REAL DEFAULT 0'],
          ['roiEarned', 'REAL DEFAULT 0'],
          ['levelEarned', 'REAL DEFAULT 0'],
          ['sponsorEarned', 'REAL DEFAULT 0'],
          ['rankEarned', 'REAL DEFAULT 0'],
          ['boostingEarned', 'REAL DEFAULT 0'],
          ['spinEarned', 'REAL DEFAULT 0'],
          ['directReferralsCount', 'INTEGER DEFAULT 0'],
          ['teamCount', 'INTEGER DEFAULT 0'],
          ['teamVolume', 'REAL DEFAULT 0'],
          ['rank', 'TEXT DEFAULT "Member"'],
          ['status', 'TEXT DEFAULT "active"'],
          ['registeredAt', 'TEXT DEFAULT ""'],
          ['lastRoiClaimAt', 'TEXT DEFAULT ""'],
          ['spinCredits', 'INTEGER DEFAULT 0'],
          ['lastSpinAt', 'TEXT DEFAULT ""'],
        ];

        for (const [colName, colType] of requiredCols) {
          if (!existingColNames.includes(colName)) {
            try {
              db.run(`ALTER TABLE users ADD COLUMN ${colName} ${colType};`);
              console.log(`🔧 Auto-migrated: Added missing column ${colName} to users table in SQLite.`);
            } catch (colErr) {
              // Ignore if already exists
            }
          }
        }
      }
    } catch (migErr) {
      console.error('Migration check error:', migErr);
    }

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

    // Ensure every user object has an explicit password fallback if missing
    if (Array.isArray(state.users)) {
      state.users.forEach((u) => {
        if (!u.password) {
          u.password = '123456';
        }
      });
    }

    // Always backup full state to JSON synchronously first
    fs.writeFileSync(DB_FILE_JSON, JSON.stringify(state, null, 2), 'utf-8');

    // Sync to SQLite database tables safely
    if (db) {
      try {
        try {
          db.run('BEGIN TRANSACTION;');
        } catch (_) {
          // Transaction already active or reset
        }

        // 1. Settings
        db.run('INSERT OR REPLACE INTO settings (id, data) VALUES (1, ?)', [
          JSON.stringify(state.settings),
        ]);

        // 2. Users
        try {
          db.run('DELETE FROM users;');
          for (const u of state.users) {
            db.run(
              `INSERT INTO users (
                id, nodeId, name, email, password, walletAddress, sponsorId, activePackageId,
                packageActivatedAt, packageExpiryDays, balance, depositBalance, upgradeBalance, winningBalance, winningEarned,
                totalEarned, roiEarned, levelEarned, sponsorEarned, rankEarned, boostingEarned,
                spinEarned, directReferralsCount, teamCount, teamVolume, rank, status,
                registeredAt, lastRoiClaimAt, spinCredits, lastSpinAt
              ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
              [
                u.id,
                u.nodeId,
                u.name,
                u.email,
                u.password || '123456',
                u.walletAddress || '',
                u.sponsorId || '',
                u.activePackageId || '',
                u.packageActivatedAt || '',
                u.packageExpiryDays || 100,
                u.balance || 0,
                u.depositBalance || 0,
                u.upgradeBalance || 0,
                u.winningBalance || 0,
                u.winningEarned || 0,
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
        } catch (userInsertErr) {
          console.error('Users table insert failed, recreating structure:', userInsertErr);
          db.run('DROP TABLE IF EXISTS users;');
          db.run(`
            CREATE TABLE users (
              id TEXT PRIMARY KEY,
              nodeId TEXT,
              name TEXT,
              email TEXT,
              password TEXT,
              walletAddress TEXT,
              sponsorId TEXT,
              activePackageId TEXT,
              packageActivatedAt TEXT,
              packageExpiryDays INTEGER,
              balance REAL,
              depositBalance REAL,
              upgradeBalance REAL,
              winningBalance REAL,
              winningEarned REAL,
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
          `);
          for (const u of state.users) {
            db.run(
              `INSERT INTO users (
                id, nodeId, name, email, password, walletAddress, sponsorId, activePackageId,
                packageActivatedAt, packageExpiryDays, balance, depositBalance, upgradeBalance, winningBalance, winningEarned,
                totalEarned, roiEarned, levelEarned, sponsorEarned, rankEarned, boostingEarned,
                spinEarned, directReferralsCount, teamCount, teamVolume, rank, status,
                registeredAt, lastRoiClaimAt, spinCredits, lastSpinAt
              ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
              [
                u.id,
                u.nodeId,
                u.name,
                u.email,
                u.password || '123456',
                u.walletAddress || '',
                u.sponsorId || '',
                u.activePackageId || '',
                u.packageActivatedAt || '',
                u.packageExpiryDays || 100,
                u.balance || 0,
                u.depositBalance || 0,
                u.upgradeBalance || 0,
                u.winningBalance || 0,
                u.winningEarned || 0,
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
      } catch (dbErr) {
        console.error('Error during SQLite transaction in saveStore:', dbErr);
        try {
          db.run('ROLLBACK;');
        } catch (_) {}
      }
    }
  } catch (err) {
    console.error('Failed to save store:', err);
  }
}

function loadFromSqlite() {
  try {
    if (!db) return;

    // 1. Settings
    const settingsRes = db.exec('SELECT data FROM settings WHERE id = 1');
    if (settingsRes[0]?.values[0]?.[0]) {
      const parsedSettings = JSON.parse(settingsRes[0].values[0][0] as string);
      state.settings = { ...defaultSettings, ...parsedSettings };
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
        if (!u.password) u.password = '123456';
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

    // Load products, productOrders, and luckyDraw state from JSON backup if available
    if (fs.existsSync(DB_FILE_JSON)) {
      try {
        const jsonData = JSON.parse(fs.readFileSync(DB_FILE_JSON, 'utf-8'));
        if (jsonData.products && Array.isArray(jsonData.products)) {
          state.products = jsonData.products;
        }
        if (jsonData.productOrders && Array.isArray(jsonData.productOrders)) {
          state.productOrders = jsonData.productOrders;
        }
        if (jsonData.luckyDraw) {
          state.luckyDraw = jsonData.luckyDraw;
        }
        if (jsonData.colorPrediction) {
          state.colorPrediction = jsonData.colorPrediction;
        }
      } catch (jsonErr) {
        console.error('JSON backup load warning in loadFromSqlite:', jsonErr);
      }
    }
    ensureColorPredictionState();

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
        if (Array.isArray(state.users)) {
          state.users.forEach((u) => {
            if (!u.password) u.password = '123456';
          });
        }
        console.log('Successfully loaded persisted store from JSON!');
      }
    }
    ensureLuckyDrawPrizes();
    ensureColorPredictionState();
  } catch (err) {
    console.error('Failed to load JSON store:', err);
  }
}

function ensureColorPredictionState() {
  if (!state.colorPrediction) {
    state.colorPrediction = initialColorPrediction;
  }
  if (!state.colorPrediction.bets) state.colorPrediction.bets = [];
  if (!state.colorPrediction.history) state.colorPrediction.history = [];
  if (!state.colorPrediction.startTime) state.colorPrediction.startTime = Date.now();
  if (!state.colorPrediction.periodDurationSeconds) state.colorPrediction.periodDurationSeconds = 60;
  if (!state.colorPrediction.adminMode) state.colorPrediction.adminMode = 'lowest_payout';
  if (!state.colorPrediction.currentPeriodId) {
    state.colorPrediction.currentPeriodId = `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}1001`;
  }
}

// Helper to deduct bet amount prioritizing Deposit Wallet first, then Winning Wallet, then Main Wallet
function deductBetBalance(user: User, amount: number): boolean {
  const depBal = user.depositBalance || 0;
  const winBal = user.winningBalance || 0;
  const mainBal = user.balance || 0;
  const totalAvail = depBal + winBal + mainBal;

  if (totalAvail < amount) {
    return false;
  }

  let rem = amount;
  // 1. Deduct from Deposit Wallet first
  if ((user.depositBalance || 0) >= rem) {
    user.depositBalance -= rem;
    rem = 0;
  } else {
    rem -= (user.depositBalance || 0);
    user.depositBalance = 0;

    // 2. Deduct remaining from Winning Wallet
    if ((user.winningBalance || 0) >= rem) {
      user.winningBalance -= rem;
      rem = 0;
    } else {
      rem -= (user.winningBalance || 0);
      user.winningBalance = 0;

      // 3. Deduct remaining from Main Balance
      user.balance = Math.max(0, (user.balance || 0) - rem);
      rem = 0;
    }
  }

  return true;
}

// Helper to award game/lottery winnings to Winning Wallet & credit Sponsor Game Win Royalty Commission
function awardGameWin(user: User, payout: number, gameName: string) {
  if (payout <= 0) return;

  // 1. Credit User's Winning Wallet
  user.winningBalance = (user.winningBalance || 0) + payout;
  user.winningEarned = (user.winningEarned || 0) + payout;

  // 2. Sponsor Game Win Royalty Commission (10% for Lottery, 5% default for other games)
  const isLottery = gameName.toLowerCase().includes('lottery') || gameName.toLowerCase().includes('lucky draw');
  const sponsorPercent = isLottery
    ? 10 // 10% Winner Sponsor Royalty for Lottery
    : (state.settings.sponsorGameWinPercent !== undefined ? Number(state.settings.sponsorGameWinPercent) : 5);

  if (sponsorPercent > 0 && user.sponsorId) {
    const sponsor = state.users.find((u) => u.id === user.sponsorId || u.nodeId === user.sponsorId);
    if (sponsor) {
      const sponsorBonus = payout * (sponsorPercent / 100);
      if (sponsorBonus > 0) {
        sponsor.balance = (sponsor.balance || 0) + sponsorBonus;
        sponsor.sponsorEarned = (sponsor.sponsorEarned || 0) + sponsorBonus;
        sponsor.totalEarned = (sponsor.totalEarned || 0) + sponsorBonus;

        state.transactions.unshift({
          id: `tx-spwin-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          userId: sponsor.id,
          userNodeId: sponsor.nodeId,
          type: 'sponsor_game_win_bonus',
          amount: sponsorBonus,
          status: 'completed',
          notes: `${sponsorPercent}% Sponsor ${isLottery ? 'Lottery' : 'Game'} Win Royalty from ${user.name}'s ${gameName} Win ($${payout.toFixed(2)})`,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }
}

// 5-Level Bet Turnover Commission percentages
const BET_TURNOVER_LEVEL_PERCENTAGES = [0.60, 0.30, 0.15, 0.08, 0.05]; // L1 = 0.60%, L2 = 0.30%, L3 = 0.15%, L4 = 0.08%, L5 = 0.05%

function process5LevelBetTurnoverCommission(user: User, betAmount: number, gameName: string) {
  if (!betAmount || betAmount <= 0) return;

  // 1. Update user's personal total turnover
  user.totalBetTurnover = (user.totalBetTurnover || 0) + betAmount;

  // 2. Loop up 5 levels of sponsors
  let currentSponsorId: string | null = user.sponsorId;
  let level = 1;

  while (currentSponsorId && level <= 5) {
    const sponsor = state.users.find(
      (u) => u.id === currentSponsorId || u.nodeId === currentSponsorId
    );

    if (!sponsor) break;

    const commissionRate = BET_TURNOVER_LEVEL_PERCENTAGES[level - 1] / 100;
    const commissionEarned = parseFloat((betAmount * commissionRate).toFixed(4));

    if (commissionEarned > 0) {
      if (!sponsor.levelTurnover) {
        sponsor.levelTurnover = { l1: 0, l2: 0, l3: 0, l4: 0, l5: 0 };
      }
      if (!sponsor.levelCommission) {
        sponsor.levelCommission = { l1: 0, l2: 0, l3: 0, l4: 0, l5: 0 };
      }

      const lKey = `l${level}` as 'l1' | 'l2' | 'l3' | 'l4' | 'l5';
      sponsor.levelTurnover[lKey] = (sponsor.levelTurnover[lKey] || 0) + betAmount;
      sponsor.levelCommission[lKey] = (sponsor.levelCommission[lKey] || 0) + commissionEarned;

      sponsor.referralCommissionEarned = (sponsor.referralCommissionEarned || 0) + commissionEarned;
      sponsor.balance = (sponsor.balance || 0) + commissionEarned;
      sponsor.totalEarned = (sponsor.totalEarned || 0) + commissionEarned;

      state.transactions.unshift({
        id: `tx-turnover-l${level}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: sponsor.id,
        userNodeId: sponsor.nodeId,
        type: 'bet_turnover_commission' as any,
        amount: commissionEarned,
        status: 'completed',
        notes: `🏆 Level ${level} Bet Turnover Commission ($${commissionEarned.toFixed(4)}) from ${user.name}'s $${betAmount.toFixed(2)} Bet on ${gameName}`,
        createdAt: new Date().toISOString(),
      });
    }

    currentSponsorId = sponsor.sponsorId;
    level++;
  }
}

function calculatePayoutForNumber(candidateNum: number, activeBets: ColorPredictionBet[]): number {
  let totalPayout = 0;
  activeBets.forEach((bet) => {
    let multiplier = 0;
    const sel = bet.selection;
    if (sel === 'green') {
      if ([1, 3, 7, 9].includes(candidateNum)) multiplier = 2;
      else if (candidateNum === 5) multiplier = 1.5;
    } else if (sel === 'red') {
      if ([2, 4, 6, 8].includes(candidateNum)) multiplier = 2;
      else if (candidateNum === 0) multiplier = 1.5;
    } else if (sel === 'violet') {
      if (candidateNum === 0 || candidateNum === 5) multiplier = 4.5;
    } else if (sel === 'big') {
      if (candidateNum >= 5) multiplier = 2;
    } else if (sel === 'small') {
      if (candidateNum < 5) multiplier = 2;
    } else if (sel === bet.selection && !isNaN(Number(sel))) {
      if (Number(sel) === candidateNum) multiplier = 9;
    }
    if (multiplier > 0) {
      totalPayout += bet.totalBet * multiplier;
    }
  });
  return totalPayout;
}

function resolveColorPredictionPeriod() {
  ensureColorPredictionState();
  const cp = state.colorPrediction;
  const currentPeriod = cp.currentPeriodId;
  const activeBets = cp.bets.filter((b) => b.periodId === currentPeriod && b.status === 'pending');

  // 1. Pick result number based on active mode
  let winningNum: number;

  if (cp.forcedNextNumber !== null && cp.forcedNextNumber >= 0 && cp.forcedNextNumber <= 9) {
    // Manual forced override took precedence
    winningNum = cp.forcedNextNumber;
    cp.forcedNextNumber = null;
  } else if (cp.adminMode === 'lowest_payout') {
    // Automatic Risk Management mode: Pick number 0-9 with lowest total payout liability
    let lowestPayout = Infinity;
    let candidates: number[] = [];

    for (let num = 0; num <= 9; num++) {
      const payout = calculatePayoutForNumber(num, activeBets);
      if (payout < lowestPayout) {
        lowestPayout = payout;
        candidates = [num];
      } else if (payout === lowestPayout) {
        candidates.push(num);
      }
    }

    if (candidates.length > 0) {
      winningNum = candidates[Math.floor(Math.random() * candidates.length)];
    } else {
      winningNum = Math.floor(Math.random() * 10);
    }
  } else {
    // Standard random mode
    winningNum = Math.floor(Math.random() * 10);
  }

  // 2. Determine color and size
  let colorVal: 'green' | 'red' | 'violet-green' | 'violet-red';
  if (winningNum === 0) colorVal = 'violet-red';
  else if (winningNum === 5) colorVal = 'violet-green';
  else if ([1, 3, 7, 9].includes(winningNum)) colorVal = 'green';
  else colorVal = 'red';

  const sizeVal: 'big' | 'small' = winningNum >= 5 ? 'big' : 'small';

  // 3. Settle all pending bets for currentPeriod
  activeBets.forEach((bet) => {
    let multiplier = 0;
    const sel = bet.selection;

    if (sel === 'green') {
      if ([1, 3, 7, 9].includes(winningNum)) multiplier = 2;
      else if (winningNum === 5) multiplier = 1.5;
    } else if (sel === 'red') {
      if ([2, 4, 6, 8].includes(winningNum)) multiplier = 2;
      else if (winningNum === 0) multiplier = 1.5;
    } else if (sel === 'violet') {
      if (winningNum === 0 || winningNum === 5) multiplier = 4.5;
    } else if (sel === 'big') {
      if (sizeVal === 'big') multiplier = 2;
    } else if (sel === 'small') {
      if (sizeVal === 'small') multiplier = 2;
    } else if (sel === bet.selection && !isNaN(Number(sel))) {
      if (Number(sel) === winningNum) multiplier = 9;
    }

    if (multiplier > 0) {
      const payout = bet.totalBet * multiplier;
      bet.status = 'won';
      bet.payout = payout;

      // Credit user winning wallet & sponsor royalty
      const user = state.users.find((u) => u.id === bet.userId);
      if (user) {
        awardGameWin(user, payout, 'Color Prediction (Win Go)');

        // Record Transaction
        state.transactions.unshift({
          id: `tx-cpwin-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          userId: user.id,
          userNodeId: user.nodeId,
          type: 'color_prediction_win',
          amount: payout,
          status: 'completed',
          notes: `Win Go 1m Win - Period #${currentPeriod} Result: ${winningNum} ($${payout.toFixed(2)} to Winning Wallet)`,
          createdAt: new Date().toISOString(),
        });
      }
    } else {
      bet.status = 'lost';
      bet.payout = 0;
    }
  });

  // 4. Add to history
  cp.history.unshift({
    periodId: currentPeriod,
    number: winningNum,
    color: colorVal,
    size: sizeVal,
    completedAt: new Date().toISOString(),
  });
  if (cp.history.length > 100) cp.history = cp.history.slice(0, 100);

  // 5. Generate next period ID and reset timer
  const prevSeq = parseInt(currentPeriod.slice(-4)) || 1000;
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  cp.currentPeriodId = `${dateStr}${prevSeq + 1}`;
  cp.startTime = Date.now();

  saveStore();
}

// Timer Loop for Color Prediction Rounds
setInterval(() => {
  ensureColorPredictionState();
  const cp = state.colorPrediction;
  const elapsedSeconds = Math.floor((Date.now() - cp.startTime) / 1000);
  if (elapsedSeconds >= cp.periodDurationSeconds) {
    resolveColorPredictionPeriod();
  }
}, 1000);

function ensureAviatorState() {
  if (!state.aviator) state.aviator = initialAviator;
  if (!state.aviator.bets) state.aviator.bets = [];
  if (!state.aviator.history) state.aviator.history = [1.45, 2.10, 5.80, 1.12, 18.50, 2.05];
  if (!state.aviator.adminMode) state.aviator.adminMode = 'lowest_payout';
  if (!state.aviator.currentRoundId) state.aviator.currentRoundId = `AV-${Date.now()}`;
  if (!state.aviator.status) state.aviator.status = 'waiting';
  if (!state.aviator.currentMultiplier) state.aviator.currentMultiplier = 1.00;
  if (!state.aviator.targetCrashMultiplier) state.aviator.targetCrashMultiplier = 2.15;
}

function tickAviatorGame() {
  ensureAviatorState();
  const av = state.aviator;
  const now = Date.now();
  const elapsedSec = (now - av.startTime) / 1000;

  if (av.status === 'waiting') {
    if (elapsedSec >= 5) {
      av.status = 'flying';
      av.startTime = now;
      av.currentMultiplier = 1.00;

      if (av.forcedNextCrash !== null && av.forcedNextCrash >= 1.0) {
        av.targetCrashMultiplier = av.forcedNextCrash;
        av.forcedNextCrash = null;
      } else if (av.adminMode === 'lowest_payout') {
        const totalStakes = av.bets.filter((b) => b.status === 'pending').reduce((sum, b) => sum + b.amount, 0);
        if (totalStakes > 50) {
          av.targetCrashMultiplier = Number((1.05 + Math.random() * 0.45).toFixed(2));
        } else if (totalStakes > 0) {
          av.targetCrashMultiplier = Number((1.12 + Math.random() * 1.20).toFixed(2));
        } else {
          av.targetCrashMultiplier = Number((1.20 + Math.random() * 8.00).toFixed(2));
        }
      } else {
        const rand = Math.random();
        if (rand < 0.15) av.targetCrashMultiplier = Number((1.01 + Math.random() * 0.15).toFixed(2));
        else if (rand < 0.70) av.targetCrashMultiplier = Number((1.16 + Math.random() * 2.00).toFixed(2));
        else if (rand < 0.90) av.targetCrashMultiplier = Number((3.16 + Math.random() * 5.00).toFixed(2));
        else av.targetCrashMultiplier = Number((8.16 + Math.random() * 25.00).toFixed(2));
      }
    }
  } else if (av.status === 'flying') {
    const mult = Number((1.00 + Math.pow(elapsedSec / 2.5, 1.8)).toFixed(2));
    av.currentMultiplier = mult;

    av.bets.forEach((bet) => {
      const autoM = (bet as any).autoCashout;
      if (bet.status === 'pending' && autoM && mult >= autoM && mult <= av.targetCrashMultiplier) {
        bet.cashedOut = true;
        bet.cashoutMultiplier = autoM;
        bet.payout = Number((bet.amount * autoM).toFixed(2));
        bet.status = 'cashed_out';

        const usr = state.users.find((u) => u.id === bet.userId);
        if (usr) {
          usr.balance += bet.payout;
          usr.totalEarned += (bet.payout - bet.amount);
        }
      }
    });

    if (mult >= av.targetCrashMultiplier) {
      av.status = 'crashed';
      av.currentMultiplier = av.targetCrashMultiplier;
      av.startTime = now;

      av.history.unshift(av.targetCrashMultiplier);
      if (av.history.length > 20) av.history.pop();

      av.bets.forEach((bet) => {
        if (bet.status === 'pending') {
          bet.status = 'crashed';
        }
      });
      saveStore();
    }
  } else if (av.status === 'crashed') {
    if (elapsedSec >= 4) {
      av.status = 'waiting';
      av.currentRoundId = `AV-${now}`;
      av.currentMultiplier = 1.00;
      av.startTime = now;
      av.bets = [];
      saveStore();
    }
  }
}

setInterval(tickAviatorGame, 300);

function ensureLuckyDrawPrizes() {
  if (!state.luckyDraw) state.luckyDraw = initialLuckyDraw;
  if (!state.luckyDraw.pastWinners) state.luckyDraw.pastWinners = [];
  if (state.luckyDraw.ticketPrice === undefined) state.luckyDraw.ticketPrice = 5;
  if (state.luckyDraw.prizeAmount === undefined) state.luckyDraw.prizeAmount = 250;
  if (state.luckyDraw.secondPrizeAmount === undefined) state.luckyDraw.secondPrizeAmount = 50;
  if (state.luckyDraw.thirdPrizeAmount === undefined) state.luckyDraw.thirdPrizeAmount = 10;
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
      (t) =>
        t.userId === u.id &&
        t.notes &&
        !t.notes.toLowerCase().includes('deposit') &&
        (t.notes.includes('Activated Package') || t.notes.includes('Booster Pass') || t.notes.includes('pkg-20'))
    );
    const isUpgraded = !!(
      (activePkg && (activePkg.price >= 20 || activePkg.isUpgradePackage)) ||
      u.activePackageId === 'pkg-20' ||
      hasBoosterTx
    );
    u.isUpgraded = isUpgraded;
  });
}

// Helper to get active user for request (supports header 'x-user-id' for browser session isolation)
function getUserFromReq(req: Request): User | undefined {
  const reqUserId = (req.headers['x-user-id'] as string) || (req.query.userId as string) || (req.body && req.body.userId);
  if (reqUserId && reqUserId.trim() !== '' && reqUserId !== 'undefined' && reqUserId !== 'null') {
    const found = state.users.find((u) => u.id === reqUserId || u.nodeId.toLowerCase() === reqUserId.toLowerCase());
    if (found) return found;
  }
  // Fallback to activeUserId or demo user if user not found or header was empty
  if (state.activeUserId) {
    const active = state.users.find((u) => u.id === state.activeUserId);
    if (active) return active;
  }
  return state.users[0];
}

// API ROUTES

// 1. Get Full Application State or Current User Context
app.get('/api/state', (req: Request, res: Response) => {
  updateTeamVolumeAndCounts();
  const currentUser = getUserFromReq(req);
  res.json({
    currentUser: currentUser || null,
    users: state.users,
    settings: state.settings,
    transactions: state.transactions.filter((t) => currentUser && (t.userId === currentUser.id || req.query.admin === 'true')),
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

  res.json({ success: true, user });
});

// Logout endpoint
app.post('/api/auth/logout', (req: Request, res: Response) => {
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

  // Send real email via SMTP if configured
  let emailSent = false;
  let emailErrorMsg: string | undefined = undefined;
  const smtpConfig = getSmtpConfig();

  if (smtpConfig.isConfigured) {
    console.log(`[FORGOT PASSWORD] Attempting to send OTP email to ${user.email} via ${smtpConfig.smtpHost}:${smtpConfig.smtpPort} (from ${smtpConfig.smtpFrom})`);
    try {
      const transporter = nodemailer.createTransport({
        host: smtpConfig.smtpHost,
        port: smtpConfig.smtpPort,
        secure: smtpConfig.smtpPort === 465,
        auth: {
          user: smtpConfig.smtpUser,
          pass: smtpConfig.smtpPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      await transporter.sendMail({
        from: `"TetherPlus Security" <${smtpConfig.smtpFrom}>`,
        to: user.email,
        subject: `TetherPlus - Password Reset OTP (${otp})`,
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #0b1424; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid #1e293b;">
            <h2 style="color: #00eeff; margin-top: 0; text-align: center;">TetherPlus Password Reset</h2>
            <p>Hello <strong>${user.name || user.nodeId}</strong>,</p>
            <p>You requested a password reset for your TetherPlus account (#${user.nodeId}). Here is your 6-digit verification OTP code:</p>
            <div style="background-color: #050911; border: 1px solid #00eeff; border-radius: 8px; padding: 18px; text-align: center; margin: 20px 0;">
              <span style="font-size: 34px; font-weight: bold; letter-spacing: 8px; color: #00eeff;">${otp}</span>
            </div>
            <p style="font-size: 13px; color: #94a3b8;">This code is valid for 15 minutes. If you did not request this, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;" />
            <p style="font-size: 11px; color: #64748b; text-align: center;">TetherPlus Cyberpunk Ecosystem • ${smtpConfig.smtpFrom}</p>
          </div>
        `,
      });
      emailSent = true;
      console.log(`[SMTP SUCCESS] Password reset OTP email successfully sent to ${user.email} from ${smtpConfig.smtpFrom}`);
    } catch (mailErr: any) {
      emailErrorMsg = mailErr.message || String(mailErr);
      console.error(`[SMTP ERROR] Failed to send OTP email to ${user.email}:`, mailErr);
    }
  } else {
    console.log(`[FORGOT PASSWORD] SMTP is not configured (SMTP_PASS missing). Skipping email dispatch.`);
  }

  res.json({
    success: true,
    emailSent,
    emailError: emailErrorMsg,
    message: emailSent
      ? `Password reset OTP sent to ${user.email}. Please check your inbox (and spam folder).`
      : `OTP code generated for ${user.email}.${emailErrorMsg ? ` (SMTP warning: ${emailErrorMsg})` : ''}`,
    email: user.email,
    nodeId: user.nodeId,
    // Provide demo OTP code if SMTP is not configured or if email delivery failed
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
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'User not logged in' });

  if (!newPassword || newPassword.trim().length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters long' });
  }

  const existingPass = user.password || '123456';
  if (currentPassword && currentPassword.trim() !== existingPass) {
    return res.status(400).json({ error: 'Current password is incorrect. Please check and try again.' });
  }

  user.password = newPassword.trim();
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

  // Increment sponsor count
  sponsor.directReferralsCount += 1;

  saveStore();

  // Send Welcome Email asynchronously via SMTP if configured
  const smtpConfig = getSmtpConfig();

  if (smtpConfig.isConfigured) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpConfig.smtpHost,
        port: smtpConfig.smtpPort,
        secure: smtpConfig.smtpPort === 465,
        auth: {
          user: smtpConfig.smtpUser,
          pass: smtpConfig.smtpPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      transporter.sendMail({
        from: `"TetherPlus Team" <${smtpConfig.smtpFrom}>`,
        to: newUser.email,
        subject: `Welcome to TetherPlus Cyberpunk Ecosystem, ${newUser.name}! 🚀`,
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f8fafc; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
            <h2 style="color: #06b6d4; margin-top: 0; font-size: 22px; text-align: center;">Welcome to TetherPlus! 🎉</h2>
            <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">Hi <strong>${newUser.name}</strong>,</p>
            <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">Thank you for registering on <strong>TetherPlus Web3 Cyberpunk Ecosystem</strong>. Your account has been successfully created!</p>
            
            <div style="background-color: #111827; border: 1px solid #374151; border-radius: 8px; padding: 18px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #9ca3af;"><strong>Your Node ID:</strong> <span style="color: #38bdf8; font-family: monospace; font-size: 15px; font-weight: bold;">${newUser.nodeId}</span></p>
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #9ca3af;"><strong>Registered Email:</strong> <span style="color: #f3f4f6;">${newUser.email}</span></p>
              <p style="margin: 0; font-size: 13px; color: #9ca3af;"><strong>Sponsor:</strong> <span style="color: #a78bfa;">${sponsor.name} (${sponsor.nodeId})</span></p>
            </div>

            <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">You can now activate packages, explore direct level rewards, participate in boosting pools, and build your decentralized team network.</p>
            
            <div style="text-align: center; margin: 28px 0;">
              <a href="https://tetherplus.live" style="background: linear-gradient(135deg, #06b6d4, #3b82f6); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Go to Dashboard</a>
            </div>

            <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;" />
            <p style="font-size: 11px; color: #64748b; text-align: center;">TetherPlus Ecosystem • ${smtpConfig.smtpFrom}</p>
          </div>
        `,
      }).then(() => {
        console.log(`[WELCOME MAIL SUCCESS] Welcome email sent to ${newUser.email}`);
      }).catch((mailErr) => {
        console.error('[WELCOME MAIL ERROR] Failed to send welcome email:', mailErr);
      });
    } catch (e) {
      console.error('[WELCOME MAIL EXCEPTION]', e);
    }
  }

  res.json({ success: true, user: newUser });
});

// 4. Buy / Upgrade Package & Distribute Sponsor Bonus + Matrix Level Income
app.post('/api/packages/buy', (req: Request, res: Response) => {
  const { packageId } = req.body;
  const user = getUserFromReq(req);
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
  const user = getUserFromReq(req);
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
  const user = getUserFromReq(req);

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

// Convert Winnings Wallet to Deposit Balance (for betting)
app.post('/api/wallet/convert-winnings', (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized. Please login.' });

  const { amount } = req.body;
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Invalid conversion amount' });
  }

  const currentWinnings = user.winningBalance || 0;
  if (currentWinnings < numAmount) {
    return res.status(400).json({
      error: `Insufficient Winnings Wallet balance ($${currentWinnings.toFixed(2)} USDT available).`
    });
  }

  user.winningBalance = currentWinnings - numAmount;
  user.depositBalance = (user.depositBalance || 0) + numAmount;

  state.transactions.unshift({
    id: `tx-convert-${Date.now()}`,
    userId: user.id,
    userNodeId: user.nodeId,
    type: 'admin_adjust',
    amount: numAmount,
    status: 'completed',
    notes: `🔄 Converted $${numAmount.toFixed(2)} USDT from Winnings Wallet to Deposit Balance for Game Play`,
    createdAt: new Date().toISOString(),
  });

  saveStore();
  return res.json({
    success: true,
    message: `Successfully transferred $${numAmount.toFixed(2)} USDT from Winnings to Deposit Wallet!`,
    user,
  });
});

// 7. Request Withdrawal with 20% Upgrade Deduction Rule
app.post('/api/withdraw', (req: Request, res: Response) => {
  const { amount, targetAddress, network, walletType } = req.body;
  const user = getUserFromReq(req);

  if (!user) return res.status(400).json({ error: 'User not logged in' });

  const isWinningWallet = walletType === 'winning';
  const reqAmt = parseFloat(amount);

  if (isWinningWallet) {
    // WINNING WALLET WITHDRAWAL: Flat 10% Fee, No MLM Conditions
    const minWinWd = state.settings.winningWithdrawalMinAmount || 5;
    if (!reqAmt || reqAmt < minWinWd) {
      return res.status(400).json({ error: `Minimum Game Winning withdrawal is $${minWinWd} USDT` });
    }
    const winBal = user.winningBalance || 0;
    if (winBal < reqAmt) {
      return res.status(400).json({ error: `Insufficient winning balance ($${winBal.toFixed(2)} USDT available).` });
    }
    if (!targetAddress) return res.status(400).json({ error: 'Please provide target USDT wallet address' });

    const feePercent = state.settings.winningWithdrawalFeePercent !== undefined
      ? Number(state.settings.winningWithdrawalFeePercent)
      : 10;
    const adminFee = reqAmt * (feePercent / 100);
    const netAmount = Math.max(0, reqAmt - adminFee);

    user.winningBalance = (user.winningBalance || 0) - reqAmt;

    const wd: WithdrawalRequest = {
      id: `wd-win-${Date.now()}`,
      userId: user.id,
      userNodeId: user.nodeId,
      userName: user.name,
      requestedAmount: reqAmt,
      upgradeDeduction: 0,
      gasFee: adminFee,
      netAmount,
      targetAddress: targetAddress.trim(),
      network: network || 'BEP20',
      walletType: 'winning',
      status: 'pending',
      createdAt: new Date().toISOString(),
      adminNotes: `Submitted - Game Winning Wallet Withdrawal (${feePercent}% Admin Fee)`,
    };

    state.withdrawalRequests.unshift(wd);

    state.transactions.unshift({
      id: `tx-${Date.now()}-wdwin`,
      userId: user.id,
      userNodeId: user.nodeId,
      type: 'withdrawal',
      amount: reqAmt,
      status: 'pending',
      network: network || 'BEP20',
      notes: `Withdrawal Request: $${reqAmt.toFixed(2)} USDT from Game Winning Wallet (10% Admin Fee: $${adminFee.toFixed(2)}, Net: $${netAmount.toFixed(2)})`,
      createdAt: new Date().toISOString(),
    });

    saveStore();
    return res.json({ success: true, message: 'Game Winning withdrawal request submitted successfully', request: wd });
  }

  // MLM NETWORK WALLET WITHDRAWAL (WITH NETWORK CONDITIONS)
  // 0. Active Package Requirement Check
  if (!user.activePackageId) {
    return res.status(400).json({
      error: 'Active Package Required! You must have an active package ($10 Starter or $20 Booster) to request MLM network withdrawals.',
    });
  }

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
  // - $10 Package + 2 Directs: $100 Lifetime Cap (Without 2 directs: $10 limit)
  // - $20 Package + 2 Directs: $200 Lifetime Cap
  // - $20 Package + 4 Directs (2 previous + 2 new = 4): $400 Lifetime Cap
  // - $20 Package + 6 Directs: $600 Lifetime Cap
  // - Bronze Rank: $1,000 Lifetime Cap
  // - Silver Rank: $2,000 Lifetime Cap
  // - Gold Rank: $4,000 Lifetime Cap
  // - Diamond Rank (or higher): No Limit (Unlimited)
  const activePkg = state.settings.packages.find((p) => p.id === user.activePackageId);
  const hasBoosterTx = state.transactions.some(
    (t) =>
      t.userId === user.id &&
      t.notes &&
      !t.notes.toLowerCase().includes('deposit') &&
      (t.notes.includes('Activated Package') || t.notes.includes('Booster Pass') || t.notes.includes('pkg-20'))
  );
  const isUpgraded20 = !!(
    user.isUpgraded ||
    (activePkg && (activePkg.price >= 20 || activePkg.isUpgradePackage)) ||
    user.activePackageId === 'pkg-20' ||
    hasBoosterTx
  );

  const rankLower = (user.rank || '').toLowerCase();
  const directsCount = user.directReferralsCount || 0;

  let capacityLimit = 10;
  let tierName = '$10 Starter Package ($10 Max Cap)';
  let isUnlimited = false;

  if (
    rankLower.includes('diamond') ||
    rankLower.includes('apex') ||
    rankLower.includes('sovereign') ||
    rankLower.includes('crown')
  ) {
    capacityLimit = Infinity;
    tierName = 'Diamond Rank (No Limit)';
    isUnlimited = true;
  } else if (rankLower.includes('gold')) {
    capacityLimit = 4000;
    tierName = 'Gold Rank ($4,000 Lifetime Cap)';
  } else if (rankLower.includes('silver')) {
    capacityLimit = 2000;
    tierName = 'Silver Rank ($2,000 Lifetime Cap)';
  } else if (rankLower.includes('bronze')) {
    capacityLimit = 1000;
    tierName = 'Bronze Rank ($1,000 Lifetime Cap)';
  } else if (isUpgraded20 && directsCount >= 6) {
    capacityLimit = 600;
    tierName = '$20 Package + 6 Directs ($600 Lifetime Cap)';
  } else if (isUpgraded20 && directsCount >= 4) {
    capacityLimit = 400;
    tierName = '$20 Package + 4 Directs ($400 Lifetime Cap)';
  } else if (isUpgraded20 && directsCount >= 2) {
    capacityLimit = 200;
    tierName = '$20 Package + 2 Directs ($200 Lifetime Cap)';
  } else if (directsCount >= 2) {
    capacityLimit = 100;
    tierName = '$10 Package + 2 Directs ($100 Lifetime Cap)';
  } else {
    capacityLimit = 10;
    tierName = isUpgraded20
      ? '$20 Package (<2 Directs) ($10 Lifetime Cap)'
      : '$10 Package (<2 Directs) ($10 Lifetime Cap)';
  }

  if (!isUnlimited && (reqAmt > capacityLimit || totalWithdrawnSoFar + reqAmt > capacityLimit)) {
    const remainingCap = Math.max(0, capacityLimit - totalWithdrawnSoFar);
    return res.status(400).json({
      error: `Withdrawal Capping Limit Exceeded! Your current tier (${tierName}) permits a maximum total lifetime withdrawal of $${capacityLimit} USDT. You requested $${reqAmt.toFixed(2)} USDT (already withdrawn: $${totalWithdrawnSoFar.toFixed(2)} USDT). Remaining allowed capacity: $${remainingCap.toFixed(2)} USDT. Please refer direct members or upgrade rank/package to unlock higher limits.`,
    });
  }

  // Shopping Wallet Deduction Rule: Dynamic from settings.upgradeFundDeductionPercent
  const deductionPercent = state.settings.upgradeFundDeductionPercent !== undefined
    ? Number(state.settings.upgradeFundDeductionPercent)
    : 30;
  const upgradeDeduction = reqAmt * (deductionPercent / 100);

  // Dynamic Withdrawal Fee % from settings.withdrawalFeePercent
  const feePercent = state.settings.withdrawalFeePercent !== undefined
    ? Number(state.settings.withdrawalFeePercent)
    : 2;
  const gasFee = reqAmt * (feePercent / 100);
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
    walletType: 'mlm',
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
  const user = getUserFromReq(req);
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

  // Weighted random pick from dynamic spinWheelRewards
  const userRankTier = typeof user.rank === 'object' && user.rank ? Number((user.rank as any).tierRank || 0) : 0;
  const userDirects = Number(user.directReferralsCount || 0);
  
  const allRewards = (state.settings.spinWheelRewards || []).map((r) => ({
    ...r,
    amount: Number(r.amount) || 0,
    probability: Number(r.probability) || 0,
    minLevel: Number(r.minLevel) || 0,
  }));

  // Filter rewards where user qualifies for minLevel (minLevel 0 = everyone eligible)
  let rewards = allRewards.filter((r) => !r.minLevel || userRankTier >= r.minLevel || userDirects >= r.minLevel);
  if (rewards.length === 0) rewards = allRewards;

  const totalWeight = rewards.reduce((sum, r) => sum + r.probability, 0);
  let randomVal = Math.random() * (totalWeight > 0 ? totalWeight : 1);

  let winningReward = rewards[0] || { id: 'sp-fallback', label: 'Try Again', amount: 0, probability: 100, color: '#374151' };
  for (const r of rewards) {
    if (randomVal < r.probability) {
      winningReward = r;
      break;
    }
    randomVal -= r.probability;
  }

  if (winningReward.amount > 0) {
    user.spinEarned = (user.spinEarned || 0) + winningReward.amount;
    awardGameWin(user, winningReward.amount, 'Spin Wheel');

    state.transactions.unshift({
      id: `tx-${Date.now()}-spin`,
      userId: user.id,
      userNodeId: user.nodeId,
      type: 'spin_reward',
      amount: winningReward.amount,
      status: 'completed',
      notes: `Daily Spin Wheel Reward: ${winningReward.label} ($${winningReward.amount} to Winning Wallet)`,
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
  const user = getUserFromReq(req);
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

// 10. Lucky Draw API Endpoints
app.get('/api/luckydraw', (req: Request, res: Response) => {
  if (!state.luckyDraw) {
    state.luckyDraw = initialLuckyDraw;
  }
  ensureLuckyDrawPrizes();

  if (state.luckyDraw.isRolling && state.luckyDraw.rollingStartedAt && Date.now() - state.luckyDraw.rollingStartedAt >= 4500) {
    state.luckyDraw.isRolling = false;
    state.luckyDraw.status = 'completed';
  }

  res.json({ success: true, luckyDraw: state.luckyDraw });
});

function getReservedLast5Digits(): string | null {
  if (!state.luckyDraw) return null;
  if (state.luckyDraw.reservedSeriesLast5 && /^\d{5}$/.test(state.luckyDraw.reservedSeriesLast5.trim())) {
    return state.luckyDraw.reservedSeriesLast5.trim();
  }
  if (state.luckyDraw.forcedWinnerTicketNumber && /^\d{6}$/.test(state.luckyDraw.forcedWinnerTicketNumber.trim())) {
    return state.luckyDraw.forcedWinnerTicketNumber.trim().slice(-5);
  }
  if (state.luckyDraw.forcedWinnerUserId) {
    const tkt = state.luckyDraw.tickets.find((t) => t.userId === state.luckyDraw.forcedWinnerUserId);
    if (tkt && /^\d{6}$/.test(tkt.ticketNumber)) {
      return tkt.ticketNumber.slice(-5);
    }
  }
  return null;
}

app.post('/api/luckydraw/buy', (req: Request, res: Response) => {
  const { userId, quantity, customNumbers } = req.body;
  const qty = parseInt(quantity) || 1;
  const user = state.users.find((u) => u.id === userId || u.id === state.activeUserId);

  if (!user) return res.status(400).json({ error: 'User not found' });
  if (!state.luckyDraw) state.luckyDraw = initialLuckyDraw;

  const ticketPrice = state.luckyDraw.ticketPrice ?? 5;
  const totalCost = ticketPrice * qty;

  const reservedLast5 = getReservedLast5Digits();

  // Validate custom numbers if supplied
  const chosenNumbers: string[] = Array.isArray(customNumbers) ? customNumbers : [];
  for (const num of chosenNumbers) {
    if (num && !/^\d{6}$/.test(num)) {
      return res.status(400).json({ error: `Invalid coupon number '${num}'. Must be exactly 6 digits (000000 to 999999).` });
    }
    if (num && reservedLast5 && num.endsWith(reservedLast5)) {
      return res.status(400).json({
        error: `Coupon #${num} belongs to the Admin Reserved 10-Ticket Series (ends with '${reservedLast5}'). This series is under strict Admin Control and cannot be picked manually by users!`
      });
    }
  }

  // Deduct from depositBalance prioritizing Deposit Wallet, Winning Wallet, then Main Wallet
  if (!deductBetBalance(user, totalCost)) {
    const totalAvail = (user.depositBalance || 0) + (user.winningBalance || 0) + (user.balance || 0);
    return res.status(400).json({
      error: `Insufficient balance! Total cost: $${totalCost} USDT. (Available: $${totalAvail.toFixed(2)} USDT)`,
    });
  }

  const existingTicketNumbers = new Set(state.luckyDraw.tickets.map((t) => t.ticketNumber));
  const newTickets: LuckyDrawTicket[] = [];

  for (let i = 0; i < qty; i++) {
    let ticketNum = chosenNumbers[i];
    if (!ticketNum) {
      // Auto-generate unique 6-digit number avoiding reserved 10-series
      let attempts = 0;
      do {
        ticketNum = Math.floor(100000 + Math.random() * 900000).toString();
        attempts++;
      } while (
        (existingTicketNumbers.has(ticketNum) || (reservedLast5 && ticketNum.endsWith(reservedLast5))) &&
        attempts < 10000
      );
    }

    existingTicketNumbers.add(ticketNum);

    const tkt: LuckyDrawTicket = {
      id: `tkt-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      ticketNumber: ticketNum,
      userId: user.id,
      userNodeId: user.nodeId,
      userName: user.name,
      purchasedAt: new Date().toISOString(),
    };
    newTickets.push(tkt);
    state.luckyDraw.tickets.push(tkt);
  }

  state.transactions.unshift({
    id: `tx-${Date.now()}-lkd`,
    userId: user.id,
    userNodeId: user.nodeId,
    type: 'product_purchase',
    amount: totalCost,
    status: 'completed',
    notes: `Purchased ${qty} Lucky Draw Coupon(s) ($${ticketPrice} USDT each): ${newTickets.map((t) => '#' + t.ticketNumber).join(', ')}`,
    createdAt: new Date().toISOString(),
  });

  // 1. Distribute 10% Direct Seller Bonus (ONLY FOR LUCKY DRAW LOTTERY)
  if (user.sponsorId) {
    const sponsor = state.users.find((u) => u.id === user.sponsorId || u.nodeId === user.sponsorId);
    if (sponsor) {
      const directSellerBonus = totalCost * 0.10; // 10% Direct Sales Commission for Lottery
      if (directSellerBonus > 0) {
        sponsor.balance = (sponsor.balance || 0) + directSellerBonus;
        sponsor.totalEarned = (sponsor.totalEarned || 0) + directSellerBonus;

        state.transactions.unshift({
          id: `tx-lott-dir-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          userId: sponsor.id,
          userNodeId: sponsor.nodeId,
          type: 'lottery_direct_seller_bonus' as any,
          amount: directSellerBonus,
          status: 'completed',
          notes: `🎯 10% Direct Seller Bonus ($${directSellerBonus.toFixed(2)}) for sponsoring ${user.name}'s Lucky Draw Lottery Ticket purchase ($${totalCost.toFixed(2)})`,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  // 2. Distribute 5-Level Bet Turnover Commission
  process5LevelBetTurnoverCommission(user, totalCost, 'Lucky Draw Lottery');

  saveStore();
  res.json({ success: true, tickets: newTickets, user, luckyDraw: state.luckyDraw });
});

app.post('/api/luckydraw/admin/config', (req: Request, res: Response) => {
  const {
    ticketPrice,
    prizeAmount,
    secondPrizeAmount,
    thirdPrizeAmount,
    targetEndTime,
    status,
    forcedWinnerUserId,
    forcedWinnerTicketNumber,
    forcedSecondWinnerUserId,
    forcedSecondWinnerTicketNumber,
    title,
    description,
  } = req.body;

  if (!state.luckyDraw) state.luckyDraw = initialLuckyDraw;

  if (ticketPrice !== undefined && ticketPrice !== null && ticketPrice !== '' && !isNaN(Number(ticketPrice))) {
    state.luckyDraw.ticketPrice = Math.max(0, Number(ticketPrice));
  }
  if (prizeAmount !== undefined && prizeAmount !== null && prizeAmount !== '' && !isNaN(Number(prizeAmount))) {
    state.luckyDraw.prizeAmount = Math.max(0, Number(prizeAmount));
  }
  if (secondPrizeAmount !== undefined && secondPrizeAmount !== null && secondPrizeAmount !== '' && !isNaN(Number(secondPrizeAmount))) {
    state.luckyDraw.secondPrizeAmount = Math.max(0, Number(secondPrizeAmount));
  }
  if (thirdPrizeAmount !== undefined && thirdPrizeAmount !== null && thirdPrizeAmount !== '' && !isNaN(Number(thirdPrizeAmount))) {
    state.luckyDraw.thirdPrizeAmount = Math.max(0, Number(thirdPrizeAmount));
  }
  if (targetEndTime) state.luckyDraw.targetEndTime = targetEndTime;
  if (status) state.luckyDraw.status = status;
  if (title) state.luckyDraw.title = title;
  if (description !== undefined) state.luckyDraw.description = description;

  state.luckyDraw.forcedWinnerUserId = forcedWinnerUserId || null;
  state.luckyDraw.forcedWinnerTicketNumber = forcedWinnerTicketNumber || null;
  state.luckyDraw.forcedSecondWinnerUserId = forcedSecondWinnerUserId || null;
  state.luckyDraw.forcedSecondWinnerTicketNumber = forcedSecondWinnerTicketNumber || null;

  if (req.body.reservedSeriesLast5 !== undefined) {
    state.luckyDraw.reservedSeriesLast5 = req.body.reservedSeriesLast5 || null;
  } else if (forcedWinnerTicketNumber && /^\d{6}$/.test(forcedWinnerTicketNumber)) {
    state.luckyDraw.reservedSeriesLast5 = forcedWinnerTicketNumber.slice(-5);
  }

  saveStore();
  res.json({ success: true, luckyDraw: state.luckyDraw });
});

// 5-Level Referral & Agency Stats Endpoint
app.get('/api/referral/agency-stats', (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }

  // Calculate 5-level team hierarchy
  const levelsData = [1, 2, 3, 4, 5].map((lvl) => {
    const teamMembers = getTeamMembersUpToLevel(user.id, lvl).filter((item) => item.level === lvl);
    const count = teamMembers.length;
    const lKey = `l${lvl}` as 'l1' | 'l2' | 'l3' | 'l4' | 'l5';
    const turnover = user.levelTurnover?.[lKey] || teamMembers.reduce((sum, item) => sum + (item.user.totalBetTurnover || 0), 0);
    const commissionRate = BET_TURNOVER_LEVEL_PERCENTAGES[lvl - 1];
    const commission = user.levelCommission?.[lKey] || turnover * (commissionRate / 100);

    return {
      level: lvl,
      count,
      turnover,
      commissionRate,
      commission,
      members: teamMembers.map((item) => ({
        id: item.user.id,
        nodeId: item.user.nodeId,
        name: item.user.name,
        registeredAt: item.user.registeredAt,
        totalBetTurnover: item.user.totalBetTurnover || 0,
        rank: item.user.rank,
      })),
    };
  });

  // Calculate Daily VIP Active Players count (Level 1-5 players who placed bets today)
  const allTeamMembers = getTeamMembersUpToLevel(user.id, 5);
  const teamUserIds = new Set(allTeamMembers.map((item) => item.user.id));

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayActivePlayers = state.transactions
    .filter(
      (t) =>
        t.createdAt.startsWith(todayStr) &&
        teamUserIds.has(t.userId) &&
        (t.type === 'color_prediction_bet' || t.type === 'dragon_tiger_bet' || t.type === 'aviator_bet')
    )
    .map((t) => t.userId);

  const uniqueActivePlayersTodayCount = new Set(todayActivePlayers).size;

  // VIP Tiers Matrix
  const vipTiers = [
    { level: 'VIP 1 Agent', minPlayers: 5, dailyBonusUsdt: 2.0, dailyBonusInr: 150 },
    { level: 'VIP 2 Agent', minPlayers: 15, dailyBonusUsdt: 6.0, dailyBonusInr: 500 },
    { level: 'VIP 3 Agent', minPlayers: 50, dailyBonusUsdt: 25.0, dailyBonusInr: 2000 },
    { level: 'VIP 4 Agent', minPlayers: 200, dailyBonusUsdt: 120.0, dailyBonusInr: 10000 },
  ];

  let currentVipTier = null;
  for (const tier of [...vipTiers].reverse()) {
    if (uniqueActivePlayersTodayCount >= tier.minPlayers) {
      currentVipTier = tier;
      break;
    }
  }

  // Get recent turnover commission logs
  const turnoverLogs = state.transactions
    .filter((t) => t.userId === user.id && t.type === ('bet_turnover_commission' as any))
    .slice(0, 30);

  res.json({
    success: true,
    user: {
      id: user.id,
      nodeId: user.nodeId,
      name: user.name,
      totalBetTurnover: user.totalBetTurnover || 0,
      referralCommissionEarned: user.referralCommissionEarned || 0,
      firstDepositBonusEarned: user.firstDepositBonusEarned || 0,
      vipAgentBonusEarned: user.vipAgentBonusEarned || 0,
    },
    levelsData,
    totalTeamSize: allTeamMembers.length,
    totalTeamTurnover: levelsData.reduce((acc, l) => acc + l.turnover, 0),
    totalCommissionEarned: user.referralCommissionEarned || levelsData.reduce((acc, l) => acc + l.commission, 0),
    vipAgentStatus: {
      activePlayersToday: uniqueActivePlayersTodayCount,
      currentTier: currentVipTier,
      tiers: vipTiers,
    },
    turnoverLogs,
  });
});

// Admin Assign / Gift Ticket Endpoint
app.post('/api/luckydraw/admin/assign-ticket', (req: Request, res: Response) => {
  const { userId, ticketNumber } = req.body;
  if (!userId || !ticketNumber || !/^\d{6}$/.test(ticketNumber)) {
    return res.status(400).json({ error: 'Valid userId and 6-digit ticketNumber are required.' });
  }

  const targetUser = state.users.find((u) => u.id === userId);
  if (!targetUser) return res.status(400).json({ error: 'Target user not found.' });

  if (!state.luckyDraw) state.luckyDraw = initialLuckyDraw;

  // Check if ticket already exists
  const existingIdx = state.luckyDraw.tickets.findIndex((t) => t.ticketNumber === ticketNumber);
  if (existingIdx >= 0) {
    // Re-assign existing ticket to new user
    state.luckyDraw.tickets[existingIdx].userId = targetUser.id;
    state.luckyDraw.tickets[existingIdx].userNodeId = targetUser.nodeId;
    state.luckyDraw.tickets[existingIdx].userName = targetUser.name;
    state.luckyDraw.tickets[existingIdx].purchasedAt = new Date().toISOString();
  } else {
    // Create new assigned ticket for target user ($0 cost)
    const newTkt: LuckyDrawTicket = {
      id: `tkt-admin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ticketNumber,
      userId: targetUser.id,
      userNodeId: targetUser.nodeId,
      userName: targetUser.name,
      purchasedAt: new Date().toISOString(),
      price: 0,
    };
    state.luckyDraw.tickets.push(newTkt);
  }

  saveStore();
  res.json({ success: true, luckyDraw: state.luckyDraw });
});

app.post('/api/luckydraw/admin/trigger', (req: Request, res: Response) => {
  if (!state.luckyDraw) state.luckyDraw = initialLuckyDraw;

  const {
    forcedWinnerUserId,
    forcedWinnerTicketNumber,
    forcedSecondWinnerUserId,
    forcedSecondWinnerTicketNumber,
    prizeAmount,
    secondPrizeAmount,
    thirdPrizeAmount,
    ticketPrice,
  } = req.body;

  if (ticketPrice !== undefined && ticketPrice !== null && ticketPrice !== '' && !isNaN(Number(ticketPrice))) {
    state.luckyDraw.ticketPrice = Math.max(0, Number(ticketPrice));
  }
  if (prizeAmount !== undefined && prizeAmount !== null && prizeAmount !== '' && !isNaN(Number(prizeAmount))) {
    state.luckyDraw.prizeAmount = Math.max(0, Number(prizeAmount));
  }
  if (secondPrizeAmount !== undefined && secondPrizeAmount !== null && secondPrizeAmount !== '' && !isNaN(Number(secondPrizeAmount))) {
    state.luckyDraw.secondPrizeAmount = Math.max(0, Number(secondPrizeAmount));
  }
  if (thirdPrizeAmount !== undefined && thirdPrizeAmount !== null && thirdPrizeAmount !== '' && !isNaN(Number(thirdPrizeAmount))) {
    state.luckyDraw.thirdPrizeAmount = Math.max(0, Number(thirdPrizeAmount));
  }

  const targetForcedUser = forcedWinnerUserId || state.luckyDraw.forcedWinnerUserId;
  const targetForcedTicket = forcedWinnerTicketNumber || state.luckyDraw.forcedWinnerTicketNumber;
  const targetForcedSecondUser = forcedSecondWinnerUserId || state.luckyDraw.forcedSecondWinnerUserId;
  const targetForcedSecondTicket = forcedSecondWinnerTicketNumber || state.luckyDraw.forcedSecondWinnerTicketNumber;

  let winningNumber = '';

  // 1. Determine Winning 6-digit Number (1st Prize)
  if (targetForcedTicket && /^\d{6}$/.test(targetForcedTicket)) {
    winningNumber = targetForcedTicket;
  } else if (targetForcedUser) {
    const userTickets = state.luckyDraw.tickets.filter((t) => t.userId === targetForcedUser);
    if (userTickets.length > 0) {
      winningNumber = userTickets[Math.floor(Math.random() * userTickets.length)].ticketNumber;
    }
  }

  if (!winningNumber) {
    if (state.luckyDraw.tickets.length > 0) {
      const randomTkt = state.luckyDraw.tickets[Math.floor(Math.random() * state.luckyDraw.tickets.length)];
      winningNumber = randomTkt.ticketNumber;
    } else {
      winningNumber = Math.floor(100000 + Math.random() * 900000).toString();
    }
  }

  // 2. Scan ALL sold tickets in current round for 1st, 2nd, and 3rd prize matches
  const firstPrizeVal = state.luckyDraw.prizeAmount ?? 250;
  const secondPrizeVal = state.luckyDraw.secondPrizeAmount ?? 50;
  const thirdPrizeVal = state.luckyDraw.thirdPrizeAmount ?? 10;

  const last5 = winningNumber.slice(-5);
  const last4 = winningNumber.slice(-4);

  const winnersList: LuckyDrawWinner[] = [];
  const processedTicketIds = new Set<string>();

  // 1st Prize (Exact 6 digits match or winning coupon in pool)
  let firstPrizeTickets = state.luckyDraw.tickets.filter((t) => t.ticketNumber === winningNumber);
  if (firstPrizeTickets.length === 0 && state.luckyDraw.tickets.length > 0) {
    firstPrizeTickets = [state.luckyDraw.tickets[0]];
  }
  for (const tkt of firstPrizeTickets) {
    processedTicketIds.add(tkt.id);
    const u = state.users.find((usr) => usr.id === tkt.userId);
    if (u) {
      awardGameWin(u, firstPrizeVal, 'Lucky Draw Lottery (1st Prize)');
      state.transactions.unshift({
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-1st`,
        userId: u.id,
        userNodeId: u.nodeId,
        type: 'admin_adjust',
        amount: firstPrizeVal,
        status: 'completed',
        notes: `🏆 1st Prize Winner of Lucky Draw Coupon #${tkt.ticketNumber} ($${firstPrizeVal} USDT to Winning Wallet)`,
        createdAt: new Date().toISOString(),
      });
    }
    winnersList.push({
      id: `pwin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      drawTitle: state.luckyDraw.title,
      ticketNumber: tkt.ticketNumber,
      userId: tkt.userId,
      userNodeId: tkt.userNodeId,
      userName: tkt.userName,
      prizeAmount: firstPrizeVal,
      prizeTier: '1st Prize (6 Digits Match)',
      matchedDigits: 6,
      winningNumber,
      wonAt: new Date().toISOString(),
    });
  }

  // 2nd Prize (Check forced 2nd winner, or last 5 digits match, or runner-up from remaining sold tickets)
  let secondPrizeTickets: LuckyDrawTicket[] = [];
  if (targetForcedSecondTicket) {
    const forced2nd = state.luckyDraw.tickets.find((t) => t.ticketNumber === targetForcedSecondTicket && !processedTicketIds.has(t.id));
    if (forced2nd) secondPrizeTickets = [forced2nd];
  } else if (targetForcedSecondUser) {
    const forced2nd = state.luckyDraw.tickets.find((t) => t.userId === targetForcedSecondUser && !processedTicketIds.has(t.id));
    if (forced2nd) secondPrizeTickets = [forced2nd];
  }

  if (secondPrizeTickets.length === 0) {
    secondPrizeTickets = state.luckyDraw.tickets.filter(
      (t) => !processedTicketIds.has(t.id) && t.ticketNumber.endsWith(last5)
    );
  }

  if (secondPrizeTickets.length === 0) {
    const unproc = state.luckyDraw.tickets.filter((t) => !processedTicketIds.has(t.id));
    if (unproc.length > 0) {
      secondPrizeTickets = [unproc[0]];
    }
  }

  for (const tkt of secondPrizeTickets) {
    processedTicketIds.add(tkt.id);
    const u = state.users.find((usr) => usr.id === tkt.userId);
    if (u) {
      awardGameWin(u, secondPrizeVal, 'Lucky Draw Lottery (2nd Prize)');
      state.transactions.unshift({
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-2nd`,
        userId: u.id,
        userNodeId: u.nodeId,
        type: 'admin_adjust',
        amount: secondPrizeVal,
        status: 'completed',
        notes: `🥈 2nd Prize Winner Coupon #${tkt.ticketNumber} ($${secondPrizeVal} USDT to Winning Wallet)`,
        createdAt: new Date().toISOString(),
      });
    }
    winnersList.push({
      id: `pwin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      drawTitle: state.luckyDraw.title,
      ticketNumber: tkt.ticketNumber,
      userId: tkt.userId,
      userNodeId: tkt.userNodeId,
      userName: tkt.userName,
      prizeAmount: secondPrizeVal,
      prizeTier: '2nd Prize (Last 5 Digits)',
      matchedDigits: 5,
      winningNumber,
      wonAt: new Date().toISOString(),
    });
  }

  // 3rd Prize (Last 4 digits match or runner-up from remaining sold tickets)
  let thirdPrizeTickets = state.luckyDraw.tickets.filter(
    (t) => !processedTicketIds.has(t.id) && t.ticketNumber.endsWith(last4)
  );
  if (thirdPrizeTickets.length === 0) {
    const unproc = state.luckyDraw.tickets.filter((t) => !processedTicketIds.has(t.id));
    if (unproc.length > 0) {
      thirdPrizeTickets = [unproc[0]];
    }
  }
  for (const tkt of thirdPrizeTickets) {
    processedTicketIds.add(tkt.id);
    const u = state.users.find((usr) => usr.id === tkt.userId);
    if (u) {
      awardGameWin(u, thirdPrizeVal, 'Lucky Draw Lottery (3rd Prize)');
      state.transactions.unshift({
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-3rd`,
        userId: u.id,
        userNodeId: u.nodeId,
        type: 'admin_adjust',
        amount: thirdPrizeVal,
        status: 'completed',
        notes: `🥉 3rd Prize Winner Coupon #${tkt.ticketNumber} ($${thirdPrizeVal} USDT to Winning Wallet)`,
        createdAt: new Date().toISOString(),
      });
    }
    winnersList.push({
      id: `pwin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      drawTitle: state.luckyDraw.title,
      ticketNumber: tkt.ticketNumber,
      userId: tkt.userId,
      userNodeId: tkt.userNodeId,
      userName: tkt.userName,
      prizeAmount: thirdPrizeVal,
      prizeTier: '3rd Prize (Last 4 Digits)',
      matchedDigits: 4,
      winningNumber,
      wonAt: new Date().toISOString(),
    });
  }

  // If 0 tickets were sold in current pool and no winners were generated, do not insert fake dummy winners
  // Record Past Winners (only if any tickets/winners exist)
  if (!state.luckyDraw.pastWinners) state.luckyDraw.pastWinners = [];
  if (winnersList.length > 0) {
    state.luckyDraw.pastWinners.unshift(...winnersList);
  }

  // Reset for next draw round
  state.luckyDraw.lastWinningNumber = winningNumber;
  state.luckyDraw.tickets = [];
  state.luckyDraw.status = 'rolling';
  state.luckyDraw.isRolling = true;
  state.luckyDraw.rollingStartedAt = Date.now();
  state.luckyDraw.rollingWinningNumber = winningNumber;
  state.luckyDraw.rollingWinners = winnersList;
  state.luckyDraw.lastDrawAt = new Date().toISOString();
  state.luckyDraw.targetEndTime = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  state.luckyDraw.forcedWinnerUserId = null;
  state.luckyDraw.forcedWinnerTicketNumber = null;

  saveStore();
  res.json({
    success: true,
    winningNumber,
    winners: winnersList,
    luckyDraw: state.luckyDraw,
  });
});

// Endpoint to clear past winners history (Admin feature)
app.post('/api/luckydraw/admin/clear-history', (req: Request, res: Response) => {
  if (!state.luckyDraw) state.luckyDraw = initialLuckyDraw;
  state.luckyDraw.pastWinners = [];
  (state.luckyDraw as any).historyCleared = true;
  saveStore();
  res.json({ success: true, message: 'Past winners history cleared successfully.', luckyDraw: state.luckyDraw });
});

// 11. Color Prediction API Endpoints
app.get('/api/color-prediction', (req: Request, res: Response) => {
  ensureColorPredictionState();
  const cp = state.colorPrediction;
  const elapsed = Math.floor((Date.now() - cp.startTime) / 1000);
  const remainingSeconds = Math.max(0, cp.periodDurationSeconds - elapsed);
  const currentUser = getUserFromReq(req);
  const userBets = currentUser ? cp.bets.filter((b) => b.userId === currentUser.id).slice(0, 30) : [];

  res.json({
    success: true,
    currentPeriodId: cp.currentPeriodId,
    periodDurationSeconds: cp.periodDurationSeconds,
    remainingSeconds,
    isFreeze: remainingSeconds <= 5,
    history: cp.history.slice(0, 50),
    myBets: userBets,
  });
});

app.post('/api/color-prediction/bet', (req: Request, res: Response) => {
  ensureColorPredictionState();
  const cp = state.colorPrediction;
  const user = getUserFromReq(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized. Please login to place a bet.' });
  }

  const elapsed = Math.floor((Date.now() - cp.startTime) / 1000);
  const remainingSeconds = Math.max(0, cp.periodDurationSeconds - elapsed);

  if (remainingSeconds <= 5) {
    return res.status(400).json({ error: 'Betting is frozen for the last 5 seconds of the round.' });
  }

  const { selection, amount, contractCount } = req.body;
  const betAmt = Number(amount) || 1;
  const count = Math.max(1, Math.floor(Number(contractCount) || 1));
  const totalBet = betAmt * count;

  if (isNaN(totalBet) || totalBet <= 0) {
    return res.status(400).json({ error: 'Invalid bet amount.' });
  }

  if (!deductBetBalance(user, totalBet)) {
    const totalAvail = (user.depositBalance || 0) + (user.winningBalance || 0) + (user.balance || 0);
    return res.status(400).json({ error: `Insufficient balance ($${totalAvail.toFixed(2)} total available). Deposit wallet is required for bets.` });
  }

  const newBet: ColorPredictionBet = {
    id: `bet-cp-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    userId: user.id,
    userName: user.name,
    userNodeId: user.nodeId,
    periodId: cp.currentPeriodId,
    selection,
    amount: betAmt,
    contractCount: count,
    totalBet,
    payout: 0,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  cp.bets.unshift(newBet);

  // Record Transaction
  state.transactions.unshift({
    id: `tx-cpbet-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: user.id,
    userNodeId: user.nodeId,
    type: 'color_prediction_bet',
    amount: totalBet,
    status: 'completed',
    notes: `Win Go 1m Bet - Period #${cp.currentPeriodId} on [${String(selection).toUpperCase()}]`,
    createdAt: new Date().toISOString(),
  });

  // Distribute 5-Level Bet Turnover Commission to Uplines
  process5LevelBetTurnoverCommission(user, totalBet, 'Win Go 1m Color Prediction');

  saveStore();

  res.json({
    success: true,
    message: `Bet placed successfully on ${String(selection).toUpperCase()} for $${totalBet.toFixed(2)}`,
    bet: newBet,
    user,
  });
});

app.get('/api/admin/color-prediction/stats', (req: Request, res: Response) => {
  ensureColorPredictionState();
  const cp = state.colorPrediction;
  const currentBets = cp.bets.filter((b) => b.periodId === cp.currentPeriodId && b.status === 'pending');

  const numberPayoutProjections = Array.from({ length: 10 }, (_, num) => ({
    number: num,
    projectedPayout: calculatePayoutForNumber(num, currentBets),
  }));

  const lowestPayoutObj = [...numberPayoutProjections].sort((a, b) => a.projectedPayout - b.projectedPayout)[0];

  const stats = {
    totalStakes: currentBets.reduce((acc, b) => acc + b.totalBet, 0),
    greenStakes: currentBets.filter((b) => b.selection === 'green').reduce((acc, b) => acc + b.totalBet, 0),
    redStakes: currentBets.filter((b) => b.selection === 'red').reduce((acc, b) => acc + b.totalBet, 0),
    violetStakes: currentBets.filter((b) => b.selection === 'violet').reduce((acc, b) => acc + b.totalBet, 0),
    bigStakes: currentBets.filter((b) => b.selection === 'big').reduce((acc, b) => acc + b.totalBet, 0),
    smallStakes: currentBets.filter((b) => b.selection === 'small').reduce((acc, b) => acc + b.totalBet, 0),
    forcedNextNumber: cp.forcedNextNumber,
    adminMode: cp.adminMode || 'lowest_payout',
    projectedLowestNumber: lowestPayoutObj ? lowestPayoutObj.number : 0,
    projectedLowestPayout: lowestPayoutObj ? lowestPayoutObj.projectedPayout : 0,
    numberPayoutProjections,
    betsCount: currentBets.length,
    activeBets: currentBets,
  };

  res.json({ success: true, stats });
});

app.post('/api/admin/color-prediction/mode', (req: Request, res: Response) => {
  ensureColorPredictionState();
  const cp = state.colorPrediction;
  const { mode } = req.body;

  if (!['lowest_payout', 'random', 'manual'].includes(mode)) {
    return res.status(400).json({ error: 'Invalid mode. Must be lowest_payout, random, or manual' });
  }

  cp.adminMode = mode;
  if (mode !== 'manual') {
    cp.forcedNextNumber = null;
  }
  saveStore();

  res.json({
    success: true,
    message: `Risk mode set to ${mode.toUpperCase()}`,
    adminMode: cp.adminMode,
  });
});

app.post('/api/admin/color-prediction/force-result', (req: Request, res: Response) => {
  ensureColorPredictionState();
  const cp = state.colorPrediction;
  const { number } = req.body;

  if (number === null || number === undefined || number === '') {
    cp.forcedNextNumber = null;
    return res.json({ success: true, message: 'Cleared forced result.', adminMode: cp.adminMode });
  }

  const num = Number(number);
  if (isNaN(num) || num < 0 || num > 9) {
    return res.status(400).json({ error: 'Number must be between 0 and 9.' });
  }

  cp.forcedNextNumber = num;
  cp.adminMode = 'manual';
  saveStore();

  res.json({ success: true, message: `Next round outcome forced to number ${num}.`, adminMode: cp.adminMode });
});

// AVIATOR CRASH GAME ROUTES
app.get('/api/aviator', (req: Request, res: Response) => {
  ensureAviatorState();
  const user = getUserFromReq(req);
  const av = state.aviator;
  const myBet = user ? av.bets.find((b) => b.userId === user.id) || null : null;

  res.json({
    success: true,
    state: av,
    myBet,
  });
});

app.post('/api/aviator/bet', (req: Request, res: Response) => {
  ensureAviatorState();
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'User not authenticated' });

  const av = state.aviator;
  if (av.status !== 'waiting' && (av.status !== 'flying' || av.currentMultiplier > 1.15)) {
    return res.status(400).json({ error: 'Betting is closed for this round. Please wait for next round.' });
  }

  const existingBet = av.bets.find((b) => b.userId === user.id);
  if (existingBet) {
    return res.status(400).json({ error: 'You have already placed a bet in this round!' });
  }

  const { amount, autoCashout } = req.body;
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Invalid bet amount' });
  }

  if (!deductBetBalance(user, numAmount)) {
    const totalAvail = (user.depositBalance || 0) + (user.winningBalance || 0) + (user.balance || 0);
    return res.status(400).json({ error: `Insufficient wallet balance ($${totalAvail.toFixed(2)} USDT available). Deposit or Winning wallet is required for bets.` });
  }

  const newBet: AviatorBet = {
    id: `bet-av-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: user.id,
    userName: user.name,
    userNodeId: user.nodeId,
    roundId: av.currentRoundId,
    amount: numAmount,
    cashedOut: false,
    cashoutMultiplier: null,
    payout: 0,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  if (autoCashout && Number(autoCashout) >= 1.1) {
    (newBet as any).autoCashout = Number(autoCashout);
  }

  av.bets.push(newBet);

  state.transactions.unshift({
    id: `tx-av-${Date.now()}`,
    userId: user.id,
    userNodeId: user.nodeId,
    type: 'aviator_bet',
    amount: numAmount,
    notes: `Aviator Bet (${av.currentRoundId})`,
    status: 'completed',
    createdAt: new Date().toISOString(),
  });

  // Distribute 5-Level Bet Turnover Commission
  process5LevelBetTurnoverCommission(user, numAmount, 'Aviator Game');

  saveStore();

  res.json({
    success: true,
    message: `Bet $${numAmount.toFixed(2)} USDT placed on Aviator!`,
    bet: newBet,
    user,
  });
});

app.post('/api/aviator/cashout', (req: Request, res: Response) => {
  ensureAviatorState();
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'User not authenticated' });

  const av = state.aviator;
  if (av.status !== 'flying') {
    return res.status(400).json({ error: 'Cannot cash out right now' });
  }

  const bet = av.bets.find((b) => b.userId === user.id && b.status === 'pending');
  if (!bet) {
    return res.status(400).json({ error: 'No active bet found to cash out' });
  }

  const multiplier = av.currentMultiplier;
  const payout = Number((bet.amount * multiplier).toFixed(2));

  bet.cashedOut = true;
  bet.cashoutMultiplier = multiplier;
  bet.payout = payout;
  bet.status = 'cashed_out';

  awardGameWin(user, payout, 'Aviator Crash Game');
  user.totalEarned += Math.max(0, payout - bet.amount);

  state.transactions.unshift({
    id: `tx-av-win-${Date.now()}`,
    userId: user.id,
    userNodeId: user.nodeId,
    type: 'aviator_win',
    amount: payout,
    notes: `Aviator Cashout @ ${multiplier}x (${av.currentRoundId})`,
    status: 'completed',
    createdAt: new Date().toISOString(),
  });

  saveStore();

  res.json({
    success: true,
    message: `Cashed out at ${multiplier}x! Won $${payout.toFixed(2)} USDT`,
    payout,
    multiplier,
    user,
  });
});

// DRAGON VS TIGER API ENDPOINTS
const dragonTigerHistory: any[] = [];
const dragonTigerBets: any[] = [];
let dragonTigerAdminMode: 'lowest_payout' | 'random' | 'manual' = 'lowest_payout';
let dragonTigerForcedWinner: 'dragon' | 'tiger' | 'tie' | null = null;

app.get('/api/dragon-tiger', (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  const myBets = user ? dragonTigerBets.filter((b) => b.userId === user.id).slice(0, 30) : [];
  res.json({
    success: true,
    history: dragonTigerHistory.slice(0, 50),
    myBets,
    adminMode: dragonTigerAdminMode,
  });
});

// Admin endpoints for Dragon Tiger
app.get('/api/admin/dragon-tiger/stats', (req: Request, res: Response) => {
  const pendingBets = dragonTigerBets.slice(0, 50);
  const totalStakes = pendingBets.reduce((acc, b) => acc + (b.amount || 0), 0);
  const dragonStakes = pendingBets.filter((b) => b.choice === 'dragon').reduce((acc, b) => acc + (b.amount || 0), 0);
  const tigerStakes = pendingBets.filter((b) => b.choice === 'tiger').reduce((acc, b) => acc + (b.amount || 0), 0);
  const tieStakes = pendingBets.filter((b) => b.choice === 'tie').reduce((acc, b) => acc + (b.amount || 0), 0);

  res.json({
    success: true,
    stats: {
      adminMode: dragonTigerAdminMode,
      forcedWinner: dragonTigerForcedWinner,
      totalStakes,
      dragonStakes,
      tigerStakes,
      tieStakes,
      recentBetsCount: pendingBets.length,
    },
  });
});

app.post('/api/admin/dragon-tiger/mode', (req: Request, res: Response) => {
  const { mode } = req.body;
  if (!['lowest_payout', 'random', 'manual'].includes(mode)) {
    return res.status(400).json({ error: 'Invalid mode' });
  }
  dragonTigerAdminMode = mode;
  if (mode !== 'manual') dragonTigerForcedWinner = null;
  saveStore();
  res.json({ success: true, message: `Dragon Tiger risk mode set to ${mode.toUpperCase()}`, adminMode: dragonTigerAdminMode });
});

app.post('/api/admin/dragon-tiger/force-result', (req: Request, res: Response) => {
  const { winner } = req.body;
  if (!winner) {
    dragonTigerForcedWinner = null;
    return res.json({ success: true, message: 'Cleared forced Dragon Tiger result.' });
  }
  if (!['dragon', 'tiger', 'tie'].includes(winner)) {
    return res.status(400).json({ error: 'Invalid winner choice' });
  }
  dragonTigerForcedWinner = winner;
  dragonTigerAdminMode = 'manual';
  saveStore();
  res.json({ success: true, message: `Next Dragon Tiger outcome forced to [${winner.toUpperCase()}].` });
});

app.post('/api/dragon-tiger/bet', (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'User not authenticated' });

  const { choice, amount } = req.body;
  const numAmount = Number(amount);
  if (!['dragon', 'tiger', 'tie'].includes(choice)) {
    return res.status(400).json({ error: 'Invalid bet choice' });
  }
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Invalid bet amount' });
  }
  if (!deductBetBalance(user, numAmount)) {
    const totalAvail = (user.depositBalance || 0) + (user.winningBalance || 0) + (user.balance || 0);
    return res.status(400).json({ error: `Insufficient wallet balance ($${totalAvail.toFixed(2)} USDT available). Deposit wallet is required for bets.` });
  }

  // Determine winner based on Admin Control Settings
  let winner: 'dragon' | 'tiger' | 'tie' = 'dragon';

  if (dragonTigerAdminMode === 'manual' && dragonTigerForcedWinner) {
    winner = dragonTigerForcedWinner;
    // Reset after one manual forced round
    dragonTigerForcedWinner = null;
    dragonTigerAdminMode = 'lowest_payout';
  } else if (dragonTigerAdminMode === 'lowest_payout') {
    // House Profit Mode: Make user lose if they bet high, or pick house-winning side
    if (choice === 'dragon') winner = 'tiger';
    else if (choice === 'tiger') winner = 'dragon';
    else winner = Math.random() > 0.5 ? 'dragon' : 'tiger';
  } else {
    // Fair Random Mode
    const rand = Math.random();
    if (rand < 0.45) winner = 'dragon';
    else if (rand < 0.90) winner = 'tiger';
    else winner = 'tie';
  }

  // Generate cards corresponding to winner outcome
  const suits: ('♠' | '♥' | '♦' | '♣')[] = ['♠', '♥', '♦', '♣'];
  const values = [
    { val: 'A', rank: 1 },
    { val: '2', rank: 2 },
    { val: '3', rank: 3 },
    { val: '4', rank: 4 },
    { val: '5', rank: 5 },
    { val: '6', rank: 6 },
    { val: '7', rank: 7 },
    { val: '8', rank: 8 },
    { val: '9', rank: 9 },
    { val: '10', rank: 10 },
    { val: 'J', rank: 11 },
    { val: 'Q', rank: 12 },
    { val: 'K', rank: 13 },
  ];

  const getRandomCardOfRank = (r: number) => {
    const s = suits[Math.floor(Math.random() * suits.length)];
    const item = values.find((v) => v.rank === r) || values[0];
    return { suit: s, value: item.val, rank: item.rank, color: s === '♥' || s === '♦' ? 'red' : 'black' };
  };

  let dRank = 10;
  let tRank = 5;

  if (winner === 'dragon') {
    dRank = Math.floor(6 + Math.random() * 8); // 6 to 13
    tRank = Math.floor(1 + Math.random() * (dRank - 1));
  } else if (winner === 'tiger') {
    tRank = Math.floor(6 + Math.random() * 8);
    dRank = Math.floor(1 + Math.random() * (tRank - 1));
  } else {
    dRank = Math.floor(1 + Math.random() * 13);
    tRank = dRank;
  }

  const dragonCard = getRandomCardOfRank(dRank);
  const tigerCard = getRandomCardOfRank(tRank);

  const isWin = choice === winner;
  let multiplier = choice === 'tie' ? 8.0 : 2.0;
  const payout = isWin ? numAmount * multiplier : 0;

  if (isWin) {
    awardGameWin(user, payout, 'Dragon vs Tiger');
  }

  const roundId = `DT-${Math.floor(100000 + Math.random() * 900000)}`;

  const newHist = {
    id: `dt-h-${Date.now()}`,
    roundId,
    dragonCard,
    tigerCard,
    winner,
    completedAt: new Date().toISOString(),
  };
  dragonTigerHistory.unshift(newHist);

  const newBet = {
    id: `dt-b-${Date.now()}`,
    userId: user.id,
    userNodeId: user.nodeId,
    userName: user.name,
    roundId,
    choice,
    amount: numAmount,
    winner,
    payout,
    status: isWin ? 'won' : 'lost',
    createdAt: new Date().toISOString(),
  };
  dragonTigerBets.unshift(newBet);

  state.transactions.unshift({
    id: `tx-dt-${Date.now()}`,
    userId: user.id,
    userNodeId: user.nodeId,
    type: 'dragon_tiger_bet',
    amount: numAmount,
    notes: `Dragon vs Tiger Bet on [${choice.toUpperCase()}] Round #${roundId} (${isWin ? 'WON $' + payout.toFixed(2) : 'LOST'})`,
    status: 'completed',
    createdAt: new Date().toISOString(),
  });

  // Distribute 5-Level Bet Turnover Commission
  process5LevelBetTurnoverCommission(user, numAmount, 'Dragon vs Tiger');

  saveStore();

  res.json({
    success: true,
    roundId,
    dragonCard,
    tigerCard,
    winner,
    isWin,
    payout,
    newBalance: user.balance,
  });
});

app.get('/api/admin/aviator/stats', (req: Request, res: Response) => {
  ensureAviatorState();
  const av = state.aviator;
  const activeBets = av.bets.filter((b) => b.status === 'pending');
  const totalStakes = av.bets.reduce((sum, b) => sum + b.amount, 0);

  res.json({
    success: true,
    stats: {
      totalStakes,
      activeBetsCount: activeBets.length,
      currentMultiplier: av.currentMultiplier,
      targetCrashMultiplier: av.targetCrashMultiplier,
      status: av.status,
      adminMode: av.adminMode,
      forcedNextCrash: av.forcedNextCrash,
      bets: av.bets,
    },
  });
});

app.post('/api/admin/aviator/mode', (req: Request, res: Response) => {
  ensureAviatorState();
  const av = state.aviator;
  const { mode } = req.body;
  if (!['lowest_payout', 'random', 'manual'].includes(mode)) {
    return res.status(400).json({ error: 'Invalid mode' });
  }
  av.adminMode = mode;
  saveStore();
  res.json({ success: true, message: `Aviator Risk Mode set to ${mode.toUpperCase()}`, mode: av.adminMode });
});

app.post('/api/admin/aviator/force-crash', (req: Request, res: Response) => {
  ensureAviatorState();
  const av = state.aviator;
  const { multiplier } = req.body;
  if (multiplier === null || multiplier === undefined || multiplier === '') {
    av.forcedNextCrash = null;
    return res.json({ success: true, message: 'Cleared Aviator forced crash multiplier' });
  }
  const mult = Number(multiplier);
  if (isNaN(mult) || mult < 1.0) {
    return res.status(400).json({ error: 'Multiplier must be >= 1.00' });
  }
  av.forcedNextCrash = mult;
  av.adminMode = 'manual';
  saveStore();
  res.json({ success: true, message: `Next round crash forced to ${mult}x` });
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

  const mergedSettings: SystemSettings = {
    ...state.settings,
    ...newSettings,
  };

  // Sanitize spin wheel rewards
  if (Array.isArray(mergedSettings.spinWheelRewards)) {
    mergedSettings.spinWheelRewards = mergedSettings.spinWheelRewards.map((r, i) => ({
      ...r,
      id: r.id || `sp-${i + 1}`,
      label: r.label || `$${r.amount} USDT`,
      amount: typeof r.amount === 'number' ? r.amount : parseFloat(r.amount as any) || 0,
      probability: typeof r.probability === 'number' ? r.probability : parseFloat(r.probability as any) || 0,
      minLevel: typeof r.minLevel === 'number' ? r.minLevel : parseInt(r.minLevel as any) || 0,
      color: r.color || '#10b981',
    }));
  }

  // Sanitize level income percentages
  if (Array.isArray(mergedSettings.levelIncomePercentages)) {
    mergedSettings.levelIncomePercentages = mergedSettings.levelIncomePercentages.map((l, i) => ({
      level: l.level || i + 1,
      percent: typeof l.percent === 'number' ? l.percent : parseFloat(l.percent as any) || 0,
    }));
  }

  // Sanitize packages
  if (Array.isArray(mergedSettings.packages)) {
    mergedSettings.packages = mergedSettings.packages.map((p) => ({
      ...p,
      price: typeof p.price === 'number' ? p.price : parseFloat(p.price as any) || 0,
      dailyRoiPercent: typeof p.dailyRoiPercent === 'number' ? p.dailyRoiPercent : parseFloat(p.dailyRoiPercent as any) || 0,
      sponsorBonusPercent: typeof p.sponsorBonusPercent === 'number' ? p.sponsorBonusPercent : parseFloat(p.sponsorBonusPercent as any) || 0,
      totalRoiReturnPercent: typeof p.totalRoiReturnPercent === 'number' ? p.totalRoiReturnPercent : parseFloat(p.totalRoiReturnPercent as any) || 0,
      durationDays: typeof p.durationDays === 'number' ? p.durationDays : parseInt(p.durationDays as any) || 100,
      maxMatrixLevels: typeof p.maxMatrixLevels === 'number' ? p.maxMatrixLevels : parseInt(p.maxMatrixLevels as any) || 10,
    }));
  }

  // Sanitize ranks
  if (Array.isArray(mergedSettings.ranks)) {
    mergedSettings.ranks = mergedSettings.ranks.map((rnk, i) => ({
      ...rnk,
      id: rnk.id || `rnk-${i + 1}`,
      bonusUsdt: typeof rnk.bonusUsdt === 'number' ? rnk.bonusUsdt : parseFloat(rnk.bonusUsdt as any) || 0,
      minSelfPackagePrice: typeof rnk.minSelfPackagePrice === 'number' ? rnk.minSelfPackagePrice : parseFloat(rnk.minSelfPackagePrice as any) || 0,
      requiredDirects: typeof rnk.requiredDirects === 'number' ? rnk.requiredDirects : parseInt(rnk.requiredDirects as any) || 0,
      requiredSamePackageCount: typeof rnk.requiredSamePackageCount === 'number' ? rnk.requiredSamePackageCount : parseInt(rnk.requiredSamePackageCount as any) || 0,
      upToLevel: typeof rnk.upToLevel === 'number' ? rnk.upToLevel : parseInt(rnk.upToLevel as any) || 0,
      requiredVolume: typeof rnk.requiredVolume === 'number' ? rnk.requiredVolume : parseFloat(rnk.requiredVolume as any) || 0,
    }));
  }

  if (mergedSettings.spinWheelIntervalHours !== undefined) {
    mergedSettings.spinWheelIntervalHours = parseInt(mergedSettings.spinWheelIntervalHours as any) || 24;
  }
  if (mergedSettings.spinCreditsPerReset !== undefined) {
    mergedSettings.spinCreditsPerReset = parseInt(mergedSettings.spinCreditsPerReset as any) || 1;
  }

  if (mergedSettings.withdrawalFeePercent !== undefined) {
    mergedSettings.withdrawalFeePercent = parseFloat(mergedSettings.withdrawalFeePercent as any) || 0;
  }
  if (mergedSettings.upgradeFundDeductionPercent !== undefined) {
    mergedSettings.upgradeFundDeductionPercent = parseFloat(mergedSettings.upgradeFundDeductionPercent as any) || 0;
  }

  state.settings = mergedSettings;
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
      user.hasFirstDepositApproved = true;

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

// Admin SMTP Test & Configuration Check
app.post('/api/admin/smtp-test', async (req: Request, res: Response) => {
  const { testEmail } = req.body;
  const config = getSmtpConfig();

  if (!config.isConfigured) {
    return res.status(400).json({
      error: 'SMTP Password (SMTP_PASS) is missing. Please set SMTP_PASS in environment variables or Admin Settings.',
      config: {
        host: config.smtpHost,
        port: config.smtpPort,
        user: config.smtpUser,
        from: config.smtpFrom,
        configured: false,
      },
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const target = testEmail || config.smtpFrom;
    await transporter.sendMail({
      from: `"TetherPlus System" <${config.smtpFrom}>`,
      to: target,
      subject: 'TetherPlus SMTP Test Email 🚀',
      text: `Hello! If you are reading this email, your TetherPlus SMTP configuration for ${config.smtpUser} (${config.smtpHost}:${config.smtpPort}) is working perfectly!`,
    });

    return res.json({
      success: true,
      message: `Test email sent successfully to ${target}!`,
      config: {
        host: config.smtpHost,
        port: config.smtpPort,
        user: config.smtpUser,
        from: config.smtpFrom,
        configured: true,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      error: `Failed to send SMTP email: ${err.message}`,
      config: {
        host: config.smtpHost,
        port: config.smtpPort,
        user: config.smtpUser,
        from: config.smtpFrom,
        configured: true,
      },
    });
  }
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
      `"${u.password || ''}"`,
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
  const user = getUserFromReq(req);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const product = (state.products || []).find((p) => p.id === productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  if (product.stock < quantity) {
    return res.status(400).json({ error: 'Selected product is out of stock' });
  }

  const totalCost = product.priceUsdt * quantity;
  if (user.upgradeBalance < totalCost) {
    return res.status(400).json({
      error: `Insufficient Shopping Fund Wallet balance ($${user.upgradeBalance.toFixed(2)} USDT available). Required: $${totalCost.toFixed(2)} USDT. Main Wallet is reserved for withdrawals.`,
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
    notes: `Purchased ${quantity}x ${itemDesc} from TetherMart (Deducted from Shopping Fund Wallet)`,
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

  const usdtToInr = state.settings.rates.usdtToInr || 100;
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

  const usdtToInr = state.settings.rates.usdtToInr || 100;

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
