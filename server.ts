import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import initSqlJs, { Database } from 'sql.js';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';
import {
  getHotWalletStatus,
  executeBep20Payout,
  verifyOnChainDeposit,
  DEFAULT_HOT_WALLET_ADDRESS,
  DEFAULT_HOT_WALLET_PRIVATE_KEY,
} from './server/web3Payout';
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
  DrawnPrizeTicket,
  ColorPredictionState,
  ColorPredictionBet,
  ColorPredictionResult,
  AviatorState,
  AviatorBet,
  SpinReward,
  UpiPoolItem,
  PaymentGatewayConfig,
  GameSubdomainsConfig,
  AdminPermissions,
} from './src/types';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Cross-Subdomain CORS Middleware (shares Main Wallet & Auth Session across subdomains)
app.use((req: Request, res: Response, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-id, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

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
      name: 'Starter Node (₹1,000)',
      price: 1000,
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
      name: 'Booster Pass (₹2,000)',
      price: 2000,
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
    rewardAmount: 5000,
    minDirects: 2,
    minPackagePrice: 1000,
    maxRebirthLimit: 6,
  },
  walletAddresses: {
    TRC20: 'TY82kXp9qmL209ZbNf77Xv341K89aJ9mKq',
    BEP20: '0x6b8Ff2388d4aA6D208249AfcFDb14405Fb3f4679',
    ERC20: '0x6b8Ff2388d4aA6D208249AfcFDb14405Fb3f4679',
  },
  rates: {
    usdtToInr: 1,
    inrToUsdt: 1,
  },
  withdrawalFeePercent: 10,
  minDepositAmount: 100,
  minWithdrawalAmount: 200,
  upgradeFundDeductionPercent: 30,
  sponsorGameWinPercent: 5,
  winningWithdrawalFeePercent: 10,
  winningWithdrawalMinAmount: 100,
  autoPayoutThresholdUSDT: 2000,
  tickerText:
    '⚡ LIVE SPORTX INDIA: INSTANT UPI DEPOSITS & WITHDRAWALS | 🔥 WIN GO, AVIATOR, CRICKET FANTASY & MEGA LOTTERY LIVE | 🚀 VIP CLUB & 5-LEVEL AGENCY COMMISSIONS | 🏆 TOTAL DISTRIBUTED: ₹1,48,52,000+ INR ⚡',
  spinWheelRewards: [
    { id: 'sp-1', label: 'Try Again', amount: 0, probability: 45, color: '#374151', minLevel: 0 },
    { id: 'sp-2', label: '₹10 INR', amount: 10, probability: 25, color: '#06b6d4', minLevel: 0 },
    { id: 'sp-3', label: '₹25 INR', amount: 25, probability: 15, color: '#10b981', minLevel: 0 },
    { id: 'sp-4', label: '₹50 INR', amount: 50, probability: 10, color: '#8b5cf6', minLevel: 0 },
    { id: 'sp-5', label: '₹100 INR', amount: 100, probability: 3, color: '#f59e0b', minLevel: 0 },
    { id: 'sp-6', label: '₹250 INR', amount: 250, probability: 1.5, color: '#ec4899', minLevel: 0 },
    { id: 'sp-7', label: '₹500 BIG', amount: 500, probability: 0.4, color: '#ef4444', minLevel: 0 },
    { id: 'sp-8', label: '₹2,500 MEGA 🎉', amount: 2500, probability: 0.1, color: '#eab308', minLevel: 0 },
  ],
  spinTicketPrice: 50,
  spinHouseProfitPercent: 55.0,
  spinWheelIntervalHours: 24,
  spinCreditsPerReset: 1,
  specialSponsorBonus: {
    enabled: true,
    targetLevel: 7,
    matchingPercent: 100,
    requiredSelfPackagePrice: 1000,
    requiredDirectsCount: 2,
  },
  ranks: [
    {
      id: 'rnk-1',
      name: 'Bronze',
      rewardTitle: '₹2,500 Cash Reward',
      bonusUsdt: 2500,
      minSelfPackagePrice: 1000,
      requiredDirects: 2,
      requiredSamePackageCount: 2,
      upToLevel: 2,
      requiredVolume: 50000,
      icon: 'Shield',
      color: '#cd7f32',
    },
    {
      id: 'rnk-2',
      name: 'Silver',
      rewardTitle: '₹10,000 Cash Reward',
      bonusUsdt: 10000,
      minSelfPackagePrice: 2500,
      requiredDirects: 4,
      requiredSamePackageCount: 5,
      upToLevel: 3,
      requiredVolume: 250000,
      icon: 'Award',
      color: '#c0c0c0',
    },
    {
      id: 'rnk-3',
      name: 'Gold',
      rewardTitle: 'Smart Watch + ₹50,000 Bonus',
      bonusUsdt: 50000,
      minSelfPackagePrice: 5000,
      requiredDirects: 6,
      requiredSamePackageCount: 10,
      upToLevel: 5,
      requiredVolume: 1000000,
      icon: 'Crown',
      color: '#ffd700',
    },
    {
      id: 'rnk-4',
      name: 'Diamond',
      rewardTitle: 'iPhone 16 Pro (₹2,50,000 Bonus)',
      bonusUsdt: 250000,
      minSelfPackagePrice: 10000,
      requiredDirects: 10,
      requiredSamePackageCount: 20,
      upToLevel: 10,
      requiredVolume: 5000000,
      icon: 'Gem',
      color: '#00ffff',
    },
    {
      id: 'rnk-5',
      name: 'Apex',
      rewardTitle: 'Dubai VIP Trip (₹10,00,000 Bonus)',
      bonusUsdt: 1000000,
      minSelfPackagePrice: 25000,
      requiredDirects: 15,
      requiredSamePackageCount: 50,
      upToLevel: 0,
      requiredVolume: 20000000,
      icon: 'Zap',
      color: '#ff007f',
    },
  ],
  heroBanners: [
    {
      id: 'hb-1',
      badge: 'OFFICIAL CYBER MALL • SPORTX MART',
      title: 'Next-Gen Gaming & Tech Hardware',
      subtitle: 'Equip your gaming setup with pro accessories, smart gadgets, and instant INR cashback rewards.',
      discount: 'UP TO 35% OFF',
      cta: 'Explore SportX Mart',
      category: 'Mining Hardware',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      enabled: true,
    },
    {
      id: 'hb-2',
      badge: 'NEW ARRIVALS • OFFICIAL APPAREL',
      title: 'SportX Mart Official Merch',
      subtitle: 'Exclusive hoodies, embroidered polo tees & custom cap collections crafted with premium cotton blends.',
      discount: 'BUY 1 GET 1 20% OFF',
      cta: 'Shop Official Apparel',
      category: 'Apparel & Merch',
      image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=80',
      enabled: true,
    },
    {
      id: 'hb-3',
      badge: 'MILITARY-GRADE SECURITY',
      title: 'Hardware Security Vaults & Accessories',
      subtitle: 'Protect your digital assets and SportX rewards with certified security devices & backup kits.',
      discount: 'FREE EXPRESS SHIPPING',
      cta: 'Explore Security Gear',
      category: 'Hardware Wallets',
      image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80',
      enabled: true,
    },
    {
      id: 'hb-4',
      badge: 'HIGH-TECH SMART GADGETS',
      title: 'Smart Electronics & Gaming Devices',
      subtitle: 'Pro gaming audio gear, smartwatches, and high-performance electronics delivered pan-India.',
      discount: 'EARN UP TO 50% REBATE',
      cta: 'Browse Gadgets',
      category: 'Gadgets',
      image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
      enabled: true,
    },
  ],
  dailyTournament: {
    enabled: true,
    basePot: 25000.0,
    turnoverContributionPercent: 5.0,
    minWagerToQualify: 500.0,
    title: 'Daily Top Bettor Championship 🏆',
    prizeDistribution: [
      { rank: 1, percent: 40 },
      { rank: 2, percent: 25 },
      { rank: 3, percent: 15 },
      { rank: 4, percent: 6 },
      { rank: 5, percent: 6 },
      { rank: 6, percent: 2 },
      { rank: 7, percent: 2 },
      { rank: 8, percent: 2 },
      { rank: 9, percent: 1 },
      { rank: 10, percent: 1 },
    ],
  },
  paymentGateway: {
    enabled: true,
    rotationStrategy: 'roundRobin',
    defaultUpiId: 'sportxpay@okaxis',
    defaultPayeeName: 'SportX Gaming Official',
    subdomainUrl: 'https://pay.sportx.tech',
    qrTimerSeconds: 600,
    autoRotateOnRefresh: true,
    upiPool: [
      { id: 'upi-1', upiId: 'sportxpay1@okaxis', name: 'SportX Entertainment', provider: 'Axis Bank', dailyLimit: 100000, usedCount: 14, totalCollected: 28000, isActive: true, createdAt: '2026-11-01T00:00:00.000Z' },
      { id: 'upi-2', upiId: 'playhub.merchant@paytm', name: 'PlayHub Merchant', provider: 'Paytm Payments Bank', dailyLimit: 100000, usedCount: 9, totalCollected: 16500, isActive: true, createdAt: '2026-11-01T00:00:00.000Z' },
      { id: 'upi-3', upiId: 'speedpay99@ybl', name: 'SpeedPay Services', provider: 'PhonePe', dailyLimit: 100000, usedCount: 11, totalCollected: 21000, isActive: true, createdAt: '2026-11-01T00:00:00.000Z' },
      { id: 'upi-4', upiId: 'nexusgaming@icici', name: 'Nexus Gaming Pvt Ltd', provider: 'ICICI Bank', dailyLimit: 100000, usedCount: 6, totalCollected: 12000, isActive: true, createdAt: '2026-11-01T00:00:00.000Z' },
      { id: 'upi-5', upiId: 'sportxpremium@ibl', name: 'SportX Premium Pay', provider: 'PhonePe', dailyLimit: 100000, usedCount: 8, totalCollected: 14500, isActive: true, createdAt: '2026-11-01T00:00:00.000Z' },
      { id: 'upi-6', upiId: 'quickcollect.tech@okhdfcbank', name: 'QuickCollect Solutions', provider: 'HDFC Bank', dailyLimit: 100000, usedCount: 12, totalCollected: 24000, isActive: true, createdAt: '2026-11-01T00:00:00.000Z' },
      { id: 'upi-7', upiId: 'bharatpay.user88@sbi', name: 'Bharat Payments Direct', provider: 'State Bank of India', dailyLimit: 100000, usedCount: 5, totalCollected: 9500, isActive: true, createdAt: '2026-11-01T00:00:00.000Z' },
      { id: 'upi-8', upiId: 'royalwin24@barodampay', name: 'Royal Win Enterprise', provider: 'Bank of Baroda', dailyLimit: 100000, usedCount: 7, totalCollected: 13200, isActive: true, createdAt: '2026-11-01T00:00:00.000Z' },
    ],
    bankAccount: {
      enabled: false,
      accountHolderName: 'SportX Gaming Pvt Ltd',
      bankName: 'HDFC Bank',
      accountNumber: '',
      ifscCode: '',
      branchName: 'Mumbai Main Branch',
    },
  },
  gameSubdomains: {
    enabled: true,
    rootDomain: 'sportx.tech',
    mainAppUrl: 'https://sportx.tech',
    apiBaseUrl: 'https://sportx.tech',
    autoSubdomainOnCustomDomain: true,
    urls: {
      aviator: 'https://aviator.sportx.tech',
      colorprediction: 'https://wingo.sportx.tech',
      cricket: 'https://cricket.sportx.tech',
      dragontiger: 'https://dragontiger.sportx.tech',
      luckydraw: 'https://luckydraw.sportx.tech',
      chickenroad: 'https://chickenroad.sportx.tech',
      rummy: 'https://rummy.sportx.tech',
      slot777: 'https://slots.sportx.tech',
      spinwheel: 'https://spin.sportx.tech',
    },
  },
  enabledGames: {
    aviator: true,
    colorprediction: true,
    cricket: true,
    dragontiger: true,
    luckydraw: true,
    chickenroad: true,
    rummy: true,
    slot777: true,
    spinwheel: true,
  },
  signupBonus: {
    enabled: true,
    amountInr: 50,
    creditWallet: 'depositBalance',
    freeSpins: 1,
  },
  depositBonus: {
    enabled: true,
    applyTo: 'all_deposits',
    creditWallet: 'depositBalance',
    tiers: [
      { id: 'db-1000', label: 'Greater than ₹1,000', minAmount: 1000, bonusType: 'percent', bonusValue: 5, enabled: true },
      { id: 'db-2000', label: 'Greater than ₹2,000', minAmount: 2000, bonusType: 'percent', bonusValue: 10, enabled: true },
      { id: 'db-5000', label: 'Greater than ₹5,000', minAmount: 5000, bonusType: 'percent', bonusValue: 15, enabled: true },
      { id: 'db-10000', label: 'Greater than ₹10,000', minAmount: 10000, bonusType: 'percent', bonusValue: 20, enabled: true },
    ],
  },
};

// Seed Users
const initialUsers: User[] = [
  {
    id: 'usr-root',
    nodeId: 'NX-ROOT01',
    name: 'SportX Master Admin',
    email: 'admin@sportx.game',
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
    isSuperAdmin: true,
    isSubAdmin: false,
    adminRoleName: 'Super Admin (Master Sovereign)',
    adminPermissions: {
      canManageDeposits: true,
      canManageWithdrawals: true,
      canManageUsers: true,
      canManageColorPrediction: true,
      canManageDragonTiger: true,
      canManageAviator: true,
      canManageTournament: true,
      canManageLottery: true,
      canManageUpiGateway: true,
      canManageSettings: true,
      canViewReports: true,
      canViewAudit: true,
      canManageProducts: true,
      canManageBoosting: true,
      canManageSqlite: true,
      canManageRanks: true,
      canManageSubAdmins: true,
    },
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
    txHash: '431829104501',
    network: 'UPI-QR',
    notes: 'Initial INR UPI Deposit Approved',
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'tx-102',
    userId: 'usr-demo',
    userNodeId: 'NX-GML9L6',
    type: 'sponsor_bonus',
    amount: 50,
    status: 'completed',
    notes: 'Direct Sponsor Bonus from #NX-GAMMA4 (₹1,000 Pkg)',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'tx-103',
    userId: 'usr-demo',
    userNodeId: 'NX-GML9L6',
    type: 'boosting_payout',
    amount: 500,
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
    amount: 1000,
    inrAmount: 1000,
    network: 'UPI-QR',
    txHash: '431829104512',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    adminNotes: 'Awaiting UPI UTR confirmation verification',
  },
];

// Seed Withdrawal Requests
const initialWithdrawalRequests: WithdrawalRequest[] = [
  {
    id: 'wd-601',
    userId: 'usr-alpha2',
    userNodeId: 'NX-ALPHA2',
    userName: 'Neo Matrix',
    requestedAmount: 500,
    upgradeDeduction: 0,
    gasFee: 50,
    netAmount: 450,
    targetAddress: 'neomatrix@okaxis',
    network: 'UPI',
    status: 'pending',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    adminNotes: 'Pending admin UPI payout approval',
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

// Seed E-Commerce Products (Amazon-style store, pure INR pricing)
const initialProducts: Product[] = [
  {
    id: 'prod-1',
    title: 'Ledger Stax Crypto Hardware Wallet',
    description: 'Next-gen curved E-Ink touchscreen hardware wallet with Bluetooth and wireless charging.',
    priceUsdt: 25110,
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
    title: 'NVIDIA RTX 4090 Gaming Rig',
    description: 'High-performance liquid cooled GPU optimized for pro gaming and high-speed compute.',
    priceUsdt: 143910,
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
    title: 'Titanium Security Backup Plate',
    description: 'Indestructible fireproof & waterproof 6000°F aerospace titanium plate for secure recovery.',
    priceUsdt: 4050,
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
    title: 'SportX Smart Watch Pro',
    description: 'Real-time gaming & fitness tracker watch with OLED display, alerts, and biometric auth.',
    priceUsdt: 13410,
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
    title: 'Ultra-Fast WiFi 7 Gaming Mesh Router',
    description: 'Low-latency tri-band gaming router built for cloud gaming and instant match response.',
    priceUsdt: 17910,
    priceInr: 17910,
    category: 'DePIN Electronics',
    image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
    stock: 18,
    rating: 4.6,
    reviewsCount: 45,
    badge: 'Pro Gaming',
    featured: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-6',
    title: 'SportX Sovereign Cyber Hoodie',
    description: 'Premium heavyweight cotton blend hoodie with embroidered SportX logo.',
    priceUsdt: 5850,
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
    title: 'SportX Official Oversized T-Shirt',
    description: 'High quality 240 GSM combed cotton oversized streetwear t-shirt with metallic SportX logo.',
    priceUsdt: 3150,
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

// Helper: Calculate the next Sunday 9:00 PM ISO timestamp (Weekly Mega Grand Draw)
export function getNextSunday9PM(): string {
  const now = new Date();
  const target = new Date(now);
  const day = now.getDay(); // 0 is Sunday, 1 is Monday... 6 is Saturday
  
  // Calculate days until next Sunday
  let daysUntilSunday = (7 - day) % 7;
  
  // If today is Sunday, check if 9:00 PM (21:00) has already passed
  if (daysUntilSunday === 0) {
    if (now.getHours() >= 21) {
      daysUntilSunday = 7; // Target next week's Sunday
    }
  }

  target.setDate(now.getDate() + daysUntilSunday);
  target.setHours(21, 0, 0, 0); // 9:00 PM Sharp (21:00:00)
  return target.toISOString();
}

const initialLuckyDraw: LuckyDrawState = {
  id: 'draw-001',
  title: '⚡ WEEKLY MEGA GRAND 5-TIER DRAW & GUARANTEED 45 JACKPOT',
  description: 'Pick your custom 6-digit lucky coupons! 5 Grand Single Winners (1st to 5th Prize) + 45 Guaranteed Winners across all matching 5-digit series!',
  ticketPrice: 100,
  prizeAmount: 25000, // 1st Prize (INR)
  secondPrizeAmount: 10000, // 2nd Prize (INR)
  thirdPrizeAmount: 5000, // 3rd Prize (INR)
  fourthPrizeAmount: 2500, // 4th Prize (INR)
  fifthPrizeAmount: 1500, // 5th Prize (INR)
  guaranteedPrizeAmount: 500, // Guaranteed Prize (45 Winners, ₹500 INR each)
  targetEndTime: getNextSunday9PM(),
  status: 'active',
  currentDrawStep: 0,
  drawnPrizes: [],
  forcedPrizes: {},
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
  const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER || state.settings?.smtp?.from || state.settings?.smtp?.user || 'support@sportx.game';
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
let sqlJsInstance: any = null;

async function initSqlite() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    sqlJsInstance = await initSqlJs();

    if (fs.existsSync(DB_FILE_SQLITE)) {
      try {
        const fileBuffer = fs.readFileSync(DB_FILE_SQLITE);
        db = new sqlJsInstance.Database(fileBuffer);
        // Integrity probe to detect malformed disk image immediately
        db.exec('PRAGMA schema_version;');
        console.log(`📦 Opened existing SQLite database at: ${DB_FILE_SQLITE}`);
      } catch (corruptErr) {
        console.warn('⚠️ Malformed SQLite file detected. Auto-recreating clean database from backup/store.json...', corruptErr);
        try {
          if (fs.existsSync(DB_FILE_SQLITE)) fs.unlinkSync(DB_FILE_SQLITE);
        } catch (_) {}
        db = new sqlJsInstance.Database();
      }
    } else {
      db = new sqlJsInstance.Database();
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

      CREATE TABLE IF NOT EXISTS lucky_draw (
        id INTEGER PRIMARY KEY DEFAULT 1,
        data TEXT NOT NULL
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
        if (existingColNames.includes('sponsorAddress')) {
          console.log('🔧 SQLite users table column migration...');
          db.run('DROP TABLE IF EXISTS users;');
        }
      }
    } catch (migErr) {
      console.error('Migration check error:', migErr);
    }

    // 1. Prioritize loading full state from JSON store if exists (highest fidelity)
    if (fs.existsSync(DB_FILE_JSON)) {
      loadStoreJson();
      // Sync loaded state into SQLite tables
      saveStore();
      console.log('💾 Successfully initialized & restored persistent state from store.json and SQLite!');
    } else {
      // 2. Check if existing SQLite has settings
      const settingsCheck = db.exec('SELECT COUNT(*) as count FROM settings');
      const settingsCount = (settingsCheck[0]?.values[0][0] as number) || 0;

      if (settingsCount > 0) {
        loadFromSqlite();
        saveStore();
      } else {
        // 3. Seed fresh store
        saveStore();
        console.log('🌱 Seeded new database store with default initial configuration.');
      }
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

        // 1.1 Lucky Draw State
        if (state.luckyDraw) {
          db.run('INSERT OR REPLACE INTO lucky_draw (id, data) VALUES (1, ?)', [
            JSON.stringify(state.luckyDraw),
          ]);
        }

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
          console.error('Users table insert failed, resetting users table structure safely...');
          try { db.run('ROLLBACK;'); } catch (_) {}
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
          db.run('BEGIN TRANSACTION;');
          db.run('INSERT OR REPLACE INTO settings (id, data) VALUES (1, ?)', [
            JSON.stringify(state.settings),
          ]);
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
      } catch (dbErr: any) {
        console.error('Error during SQLite transaction in saveStore:', dbErr);
        try {
          db.run('ROLLBACK;');
        } catch (_) {}
        if (dbErr?.message?.includes('malformed') || String(dbErr).includes('malformed')) {
          console.warn('⚠️ Auto-repairing malformed SQLite database image from store.json...');
          try {
            if (fs.existsSync(DB_FILE_SQLITE)) fs.unlinkSync(DB_FILE_SQLITE);
          } catch (_) {}
          if (sqlJsInstance) {
            try {
              db = new sqlJsInstance.Database();
            } catch (_) {}
          }
        }
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

    // 1.1 Lucky Draw
    try {
      const luckyDrawRes = db.exec('SELECT data FROM lucky_draw WHERE id = 1');
      if (luckyDrawRes[0]?.values[0]?.[0]) {
        const parsedLuckyDraw = JSON.parse(luckyDrawRes[0].values[0][0] as string);
        state.luckyDraw = { ...initialLuckyDraw, ...parsedLuckyDraw };
      }
    } catch (_) {}

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
    ensureSpinWheelSettings();
    ensureLuckyDrawPrizes();
    ensurePaymentGatewaySettings();
    ensureGameSubdomainSettings();
    migrateStoreToPureInr();

    console.log(`✅ Loaded ${state.users.length} users, ${state.transactions.length} transactions from SQLite!`);
  } catch (err) {
    console.error('Failed to load from SQLite:', err);
  }
}

function migrateStoreToPureInr() {
  if (!state.settings) state.settings = { ...defaultSettings };
  if ((state.settings as any).currencyMigratedToInr) return;

  // 1:1 native INR currency rates
  state.settings.rates = { usdtToInr: 1, inrToUsdt: 1 };

  // Normalize min limits & thresholds from old small USDT numbers to clean INR values
  if ((state.settings.minDepositAmount ?? 0) < 50) state.settings.minDepositAmount = 100;
  if ((state.settings.minWithdrawalAmount ?? 0) < 50) state.settings.minWithdrawalAmount = 200;
  if ((state.settings.winningWithdrawalMinAmount ?? 0) < 50) state.settings.winningWithdrawalMinAmount = 100;
  if ((state.settings.autoPayoutThresholdUSDT ?? 0) < 100) state.settings.autoPayoutThresholdUSDT = 2000;

  // Normalize spin wheel slices & ticket price to INR if previously in USDT/$
  const hasUsdSpinLabels = Array.isArray(state.settings.spinWheelRewards) &&
    state.settings.spinWheelRewards.some((r) => (r.label || '').includes('$') || (r.label || '').includes('USDT'));
  if (hasUsdSpinLabels || !state.settings.spinWheelRewards?.length) {
    state.settings.spinWheelRewards = [...defaultSettings.spinWheelRewards];
  }
  if (!state.settings.spinTicketPrice || state.settings.spinTicketPrice < 5) {
    state.settings.spinTicketPrice = 50;
  }

  // Normalize daily tournament pot to INR
  if (state.settings.dailyTournament) {
    if ((state.settings.dailyTournament.basePot ?? 0) <= 500) {
      state.settings.dailyTournament.basePot = 25000;
    }
    if ((state.settings.dailyTournament.minWagerToQualify ?? 0) <= 50) {
      state.settings.dailyTournament.minWagerToQualify = 500;
    }
  }

  // Normalize Lucky Draw prices & prizes to INR
  if (state.luckyDraw) {
    if ((state.luckyDraw.ticketPrice ?? 0) < 20 || (state.luckyDraw.prizeAmount ?? 0) <= 1000) {
      state.luckyDraw.ticketPrice = 100;
      state.luckyDraw.prizeAmount = 25000;
      state.luckyDraw.secondPrizeAmount = 10000;
      state.luckyDraw.thirdPrizeAmount = 5000;
      state.luckyDraw.fourthPrizeAmount = 2500;
      state.luckyDraw.fifthPrizeAmount = 1500;
      state.luckyDraw.guaranteedPrizeAmount = 500;
    }
    state.settings.luckyDraw = {
      ticketPrice: state.luckyDraw.ticketPrice,
      prizeAmount: state.luckyDraw.prizeAmount,
      secondPrizeAmount: state.luckyDraw.secondPrizeAmount,
      thirdPrizeAmount: state.luckyDraw.thirdPrizeAmount,
      fourthPrizeAmount: state.luckyDraw.fourthPrizeAmount,
      fifthPrizeAmount: state.luckyDraw.fifthPrizeAmount,
      guaranteedPrizeAmount: state.luckyDraw.guaranteedPrizeAmount,
      forcedPrizes: state.luckyDraw.forcedPrizes,
    };
  }

  // Normalize Store product priceUsdt to match priceInr 1:1
  if (Array.isArray(state.products)) {
    state.products.forEach((p) => {
      if (p.priceUsdt < 500 && p.priceInr > p.priceUsdt) {
        p.priceUsdt = p.priceInr || Math.round(p.priceUsdt * 100);
      }
      if (!p.priceInr || p.priceInr < p.priceUsdt) {
        p.priceInr = p.priceUsdt;
      }
    });
  }

  // Normalize Ranks to INR
  if (Array.isArray(state.settings.ranks) && state.settings.ranks.length > 0) {
    const firstRnk = state.settings.ranks[0];
    if (firstRnk && firstRnk.bonusUsdt <= 50) {
      state.settings.ranks = [...defaultSettings.ranks];
    }
  }

  // Normalize Boosting pool & packages to INR
  if (state.settings.boostingPool && state.settings.boostingPool.rewardAmount < 500) {
    state.settings.boostingPool.rewardAmount = 5000;
    state.settings.boostingPool.minPackagePrice = 1000;
  }
  if (Array.isArray(state.settings.packages)) {
    state.settings.packages = state.settings.packages.map((pkg) => {
      if (pkg.id === 'pkg-10' && pkg.price <= 20) {
        return { ...pkg, name: 'Starter Node (₹1,000)', price: 1000 };
      }
      if (pkg.id === 'pkg-20' && pkg.price <= 50) {
        return { ...pkg, name: 'Booster Pass (₹2,000)', price: 2000 };
      }
      return pkg;
    });
  }

  // Normalize Cricket Matches to INR if old USDT seed titles are present
  if (Array.isArray((state as any).cricketMatches)) {
    const hasOldCricketUsdt = (state as any).cricketMatches.some((m: any) =>
      Array.isArray(m.contests) && m.contests.some((c: any) => String(c.title || '').includes('USDT') || String(c.title || '').includes('$'))
    );
    if (hasOldCricketUsdt) {
      (state as any).cricketMatches = defaultCricketMatches;
    }
  }

  // Update ticker text if still mentioning USDT
  if (typeof state.settings.tickerText === 'string' && (state.settings.tickerText.includes('USDT') || state.settings.tickerText.includes('BTC/USDT'))) {
    state.settings.tickerText = defaultSettings.tickerText;
  }

  // Note: Existing user balances (balance, depositBalance, winningBalance, upgradeBalance) are preserved 1:1 as native INR.
  (state.settings as any).currencyMigratedToInr = true;
  saveStore();
  console.log('🇮🇳 One-time Pure INR migration applied to store settings (balances preserved 1:1 as INR).');
}

function ensureSpinWheelSettings() {
  const defaultProfitSlices: SpinReward[] = [
    { id: 'sp-1', label: 'Try Again', amount: 0, probability: 45, color: '#374151', minLevel: 0 },
    { id: 'sp-2', label: '₹10 INR', amount: 10, probability: 25, color: '#06b6d4', minLevel: 0 },
    { id: 'sp-3', label: '₹25 INR', amount: 25, probability: 15, color: '#10b981', minLevel: 0 },
    { id: 'sp-4', label: '₹50 INR', amount: 50, probability: 10, color: '#8b5cf6', minLevel: 0 },
    { id: 'sp-5', label: '₹100 INR', amount: 100, probability: 3, color: '#f59e0b', minLevel: 0 },
    { id: 'sp-6', label: '₹250 INR', amount: 250, probability: 1.5, color: '#ec4899', minLevel: 0 },
    { id: 'sp-7', label: '₹500 BIG', amount: 500, probability: 0.4, color: '#ef4444', minLevel: 0 },
    { id: 'sp-8', label: '₹2,500 MEGA 🎉', amount: 2500, probability: 0.1, color: '#eab308', minLevel: 0 },
  ];

  if (!state.settings) {
    state.settings = { ...defaultSettings };
  }

  if (state.settings.spinHouseProfitPercent === undefined) {
    state.settings.spinHouseProfitPercent = 55.0;
  }

  const rewards = state.settings.spinWheelRewards;
  if (!Array.isArray(rewards) || rewards.length === 0) {
    state.settings.spinWheelRewards = defaultProfitSlices;
    state.settings.spinTicketPrice = 50;
    state.settings.spinHouseProfitPercent = 55.0;
    saveStore();
  }
}

export function detectUpiProvider(upi: string): string {
  const lower = (upi || '').toLowerCase();
  if (lower.includes('@okhdfcbank') || lower.includes('@hdfc')) return 'HDFC Bank';
  if (lower.includes('@okaxis') || lower.includes('@axis')) return 'Axis Bank';
  if (lower.includes('@okicici') || lower.includes('@icici')) return 'ICICI Bank';
  if (lower.includes('@oksbi') || lower.includes('@sbi')) return 'State Bank of India';
  if (lower.includes('@paytm')) return 'Paytm Payments Bank';
  if (lower.includes('@ybl') || lower.includes('@ibl') || lower.includes('@axl')) return 'PhonePe';
  if (lower.includes('@barodampay')) return 'Bank of Baroda';
  if (lower.includes('@postbank')) return 'India Post Payments Bank';
  if (lower.includes('@airtel')) return 'Airtel Payments Bank';
  if (lower.includes('@kotak') || lower.includes('@kmbl')) return 'Kotak Mahindra';
  if (lower.includes('@pnb')) return 'Punjab National Bank';
  if (lower.includes('@yesbank')) return 'Yes Bank';
  if (lower.includes('@idfc')) return 'IDFC First Bank';
  if (lower.includes('@upi')) return 'BHIM UPI';
  return 'UPI Payment';
}

let upiRotationPointer = 0;

function ensurePaymentGatewaySettings() {
  if (!state.settings) {
    state.settings = { ...defaultSettings };
  }
  if (!state.settings.paymentGateway || !Array.isArray(state.settings.paymentGateway.upiPool) || state.settings.paymentGateway.upiPool.length === 0) {
    state.settings.paymentGateway = {
      ...defaultSettings.paymentGateway!,
      ...(state.settings.paymentGateway || {}),
      upiPool: state.settings.paymentGateway?.upiPool?.length ? state.settings.paymentGateway.upiPool : defaultSettings.paymentGateway!.upiPool,
      bankAccount: state.settings.paymentGateway?.bankAccount || defaultSettings.paymentGateway!.bankAccount,
    };
    saveStore();
  }
  if (!state.settings.paymentGateway.bankAccount) {
    state.settings.paymentGateway.bankAccount = { ...defaultSettings.paymentGateway!.bankAccount! };
  }
}

function ensureGameSubdomainSettings() {
  if (!state.settings) {
    state.settings = { ...defaultSettings };
  }
  const defSub = defaultSettings.gameSubdomains!;
  let changed = false;
  if (!state.settings.gameSubdomains || !state.settings.gameSubdomains.urls) {
    state.settings.gameSubdomains = {
      ...defSub,
      ...(state.settings.gameSubdomains || {}),
      urls: {
        ...defSub.urls,
        ...(state.settings.gameSubdomains?.urls || {}),
      },
    };
    changed = true;
  }
  if (!state.settings.gameSubdomains.rootDomain || !state.settings.gameSubdomains.rootDomain.trim()) {
    state.settings.gameSubdomains.rootDomain = defSub.rootDomain;
    state.settings.gameSubdomains.mainAppUrl = state.settings.gameSubdomains.mainAppUrl?.trim() || defSub.mainAppUrl;
    state.settings.gameSubdomains.apiBaseUrl = state.settings.gameSubdomains.apiBaseUrl?.trim() || defSub.apiBaseUrl;
    const defUrls = defSub.urls!;
    (Object.keys(defUrls) as Array<keyof typeof defUrls>).forEach((k) => {
      if (!state.settings.gameSubdomains!.urls[k]?.trim()) {
        state.settings.gameSubdomains!.urls[k] = defUrls[k];
      }
    });
    if (state.settings.paymentGateway && !state.settings.paymentGateway.subdomainUrl?.trim()) {
      state.settings.paymentGateway.subdomainUrl = 'https://pay.sportx.tech';
    }
    changed = true;
  }
  const defEnabled = defaultSettings.enabledGames!;
  if (!state.settings.enabledGames) {
    state.settings.enabledGames = { ...defEnabled };
    changed = true;
  } else {
    (Object.keys(defEnabled) as Array<keyof typeof defEnabled>).forEach((k) => {
      if (typeof state.settings.enabledGames![k] !== 'boolean') {
        state.settings.enabledGames![k] = defEnabled[k];
        changed = true;
      }
    });
  }
  if (!state.settings.signupBonus) {
    state.settings.signupBonus = { ...defaultSettings.signupBonus! };
    changed = true;
  }
  if (!state.settings.depositBonus || !Array.isArray(state.settings.depositBonus.tiers)) {
    state.settings.depositBonus = {
      ...defaultSettings.depositBonus!,
      ...(state.settings.depositBonus || {}),
      tiers: Array.isArray(state.settings.depositBonus?.tiers)
        ? state.settings.depositBonus.tiers
        : defaultSettings.depositBonus!.tiers,
    };
    changed = true;
  }
  if (typeof state.settings.tickerText === 'string' && state.settings.tickerText.includes('TETHERPLUS NETWORK')) {
    state.settings.tickerText = state.settings.tickerText.replace(/LIVE TETHERPLUS NETWORK/g, 'LIVE SPORTX NETWORK');
    changed = true;
  }
  if (state.settings.paymentGateway) {
    if (state.settings.paymentGateway.defaultPayeeName === 'Jalwa Gaming Official') {
      state.settings.paymentGateway.defaultPayeeName = 'SportX Gaming Official';
      changed = true;
    }
    if (state.settings.paymentGateway.defaultUpiId === 'jalwagames2@okaxis') {
      state.settings.paymentGateway.defaultUpiId = 'sportxpay@okaxis';
      changed = true;
    }
  }
  if (changed) {
    saveStore();
  }
}

function applyDepositBonus(
  user: User,
  depositAmountInr: number,
  dep: DepositRequest
): { bonusUsdt: number; bonusInr: number; matchedTierLabel: string | null } {
  const cfg = state.settings?.depositBonus;
  if (!cfg || cfg.enabled === false) {
    return { bonusUsdt: 0, bonusInr: 0, matchedTierLabel: null };
  }
  if (cfg.applyTo === 'first_deposit_only' && user.hasFirstDepositApproved) {
    return { bonusUsdt: 0, bonusInr: 0, matchedTierLabel: null };
  }

  const depositInr =
    dep.inrAmount && Number(dep.inrAmount) > 0
      ? Number(dep.inrAmount)
      : Number(depositAmountInr.toFixed(2));

  const activeTiers = (cfg.tiers || [])
    .filter((t) => t.enabled !== false && Number(t.minAmount) >= 0 && Number(t.bonusValue) > 0)
    .sort((a, b) => Number(b.minAmount) - Number(a.minAmount));

  const matchedTier = activeTiers.find((t) => depositInr >= Number(t.minAmount));
  if (!matchedTier) {
    return { bonusUsdt: 0, bonusInr: 0, matchedTierLabel: null };
  }

  let bonusInr = 0;
  if (matchedTier.bonusType === 'fixed') {
    bonusInr = Number((Number(matchedTier.bonusValue) || 0).toFixed(2));
  } else {
    const pct = Number(matchedTier.bonusValue) || 0;
    bonusInr = Number((depositInr * (pct / 100)).toFixed(2));
  }

  if (bonusInr <= 0) {
    return { bonusUsdt: 0, bonusInr: 0, matchedTierLabel: null };
  }

  const targetWallet = cfg.creditWallet || 'depositBalance';
  if (targetWallet === 'winningBalance') {
    user.winningBalance = Number(((user.winningBalance || 0) + bonusInr).toFixed(2));
  } else if (targetWallet === 'balance') {
    user.balance = Number(((user.balance || 0) + bonusInr).toFixed(2));
  } else {
    user.depositBalance = Number(((user.depositBalance || 0) + bonusInr).toFixed(2));
  }

  user.firstDepositBonusEarned = Number(((user.firstDepositBonusEarned || 0) + bonusInr).toFixed(2));
  dep.bonusAwarded = bonusInr;
  dep.bonusInr = bonusInr;

  const tierText = matchedTier.label?.trim() || `≥ ₹${Number(matchedTier.minAmount).toLocaleString('en-IN')}`;
  const bonusDetail =
    matchedTier.bonusType === 'fixed'
      ? `Flat ₹${bonusInr.toFixed(0)}`
      : `${matchedTier.bonusValue}% (₹${bonusInr.toFixed(2)})`;

  state.transactions.unshift({
    id: `tx-${Date.now()}-depbonus`,
    userId: user.id,
    userNodeId: user.nodeId,
    type: 'first_deposit_bonus',
    amount: bonusInr,
    status: 'completed',
    txHash: dep.txHash,
    network: dep.network,
    notes: `🎁 Deposit Bonus [${tierText} • ${bonusDetail}]: +₹${bonusInr.toFixed(2)} INR credited to ${
      targetWallet === 'winningBalance' ? 'Winning Wallet' : targetWallet === 'balance' ? 'Main Wallet' : 'Deposit Wallet'
    }`,
    createdAt: new Date().toISOString(),
  });

  return { bonusUsdt: bonusInr, bonusInr, matchedTierLabel: tierText };
}

function isServerGameEnabled(gameKey: keyof NonNullable<SystemSettings['enabledGames']>): boolean {
  const map = state.settings?.enabledGames;
  if (!map) return true;
  return map[gameKey] !== false;
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
            if (u.id === 'usr-root' || u.nodeId === 'NX-ROOT01') {
              u.isAdmin = true;
              u.isSuperAdmin = true;
              u.isSubAdmin = false;
              u.adminRoleName = 'Super Admin (Master Sovereign)';
              u.adminPermissions = {
                canManageDeposits: true,
                canManageWithdrawals: true,
                canManageUsers: true,
                canManageColorPrediction: true,
                canManageDragonTiger: true,
                canManageAviator: true,
                canManageTournament: true,
                canManageLottery: true,
                canManageUpiGateway: true,
                canManageSettings: true,
                canViewReports: true,
                canViewAudit: true,
                canManageProducts: true,
                canManageBoosting: true,
                canManageSqlite: true,
                canManageRanks: true,
                canManageSubAdmins: true,
              };
            }
          });
        }
        console.log('Successfully loaded persisted store from JSON!');
      }
    }
    ensureLuckyDrawPrizes();
    ensureColorPredictionState();
    ensureSpinWheelSettings();
    ensurePaymentGatewaySettings();
    ensureGameSubdomainSettings();
    migrateStoreToPureInr();
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

  // Populate at least 60 realistic history records if fewer than 50 exist
  if (state.colorPrediction.history.length < 50) {
    const basePeriodNum = 20250809100051088;
    const baseBlock = 78242651;
    const now = Date.now();
    const sampleNumbers = [
      7, 4, 2, 0, 9, 4, 1, 6, 5, 8, 3, 1, 8, 2, 6, 9, 0, 4, 7, 5,
      3, 6, 8, 1, 2, 5, 9, 4, 0, 7, 2, 8, 3, 6, 1, 9, 5, 4, 0, 8,
      7, 1, 3, 2, 6, 5, 9, 4, 8, 0, 3, 7, 2, 1, 6, 5, 8, 9, 4, 2
    ];
    const generated: any[] = [];
    for (let i = 0; i < 60; i++) {
      const periodSeq = basePeriodNum - i;
      const num = sampleNumbers[i % sampleNumbers.length];
      const isZero = num === 0;
      const isFive = num === 5;
      const isGreen = [1, 3, 7, 9].includes(num);
      const color = isZero ? 'violet-red' : isFive ? 'violet-green' : isGreen ? 'green' : 'red';
      const size = num >= 5 ? 'big' : 'small';
      generated.push({
        periodId: String(periodSeq),
        number: num,
        color,
        size,
        blockHeight: baseBlock - i * 20,
        hash: ((num * 1337 + i * 7919) % 65536).toString(16).padStart(4, '0'),
        completedAt: new Date(now - (i + 1) * 30000).toISOString(),
        createdAt: new Date(now - (i + 1) * 30000).toISOString(),
      });
    }
    state.colorPrediction.history = generated;
  }
}

// Helper to deduct bet amount prioritizing Deposit Wallet first, then Winning Wallet, then Main/MLM Wallet
function deductBetBalance(user: User, amount: number): boolean {
  if (!user || amount <= 0) return false;

  const depBal = Math.max(0, user.depositBalance || 0);
  const winBal = Math.max(0, user.winningBalance || 0);
  const mainBal = Math.max(0, user.balance || 0);
  const totalAvail = depBal + winBal + mainBal;

  if (totalAvail < amount) {
    return false;
  }

  let rem = amount;

  // 1. Deduct from Deposit Wallet FIRST
  if (depBal >= rem) {
    user.depositBalance = depBal - rem;
    rem = 0;
  } else if (depBal > 0) {
    rem -= depBal;
    user.depositBalance = 0;
  }

  // 2. Deduct remaining from Winning Wallet
  if (rem > 0) {
    const currentWin = Math.max(0, user.winningBalance || 0);
    if (currentWin >= rem) {
      user.winningBalance = currentWin - rem;
      rem = 0;
    } else if (currentWin > 0) {
      rem -= currentWin;
      user.winningBalance = 0;
    }
  }

  // 3. Deduct remaining from Main / Withdrawal Balance (user.balance)
  if (rem > 0) {
    user.balance = Math.max(0, (user.balance || 0) - rem);
    rem = 0;
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
          notes: `${sponsorPercent}% Sponsor ${isLottery ? 'Lottery' : 'Game'} Win Royalty from ${user.name}'s ${gameName} Win (₹${payout.toFixed(2)} INR)`,
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
    const commissionEarned = parseFloat((betAmount * commissionRate).toFixed(2));

    if (commissionEarned > 0) {
      if (!sponsor.levelTurnover) {
        sponsor.levelTurnover = { l1: 0, l2: 0, l3: 0, l4: 0, l5: 0 };
      }
      if (!sponsor.levelCommission) {
        sponsor.levelCommission = { l1: 0, l2: 0, l3: 0, l4: 0, l5: 0 };
      }

      const lKey = `l${level}` as 'l1' | 'l2' | 'l3' | 'l4' | 'l5';
      sponsor.levelTurnover[lKey] = (sponsor.levelTurnover[lKey] || 0) + betAmount;
      sponsor.levelCommission[lKey] = Number(((sponsor.levelCommission[lKey] || 0) + commissionEarned).toFixed(2));

      sponsor.referralCommissionEarned = Number(((sponsor.referralCommissionEarned || 0) + commissionEarned).toFixed(2));
      sponsor.balance = Number(((sponsor.balance || 0) + commissionEarned).toFixed(2));
      sponsor.totalEarned = Number(((sponsor.totalEarned || 0) + commissionEarned).toFixed(2));

      state.transactions.unshift({
        id: `tx-turnover-l${level}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: sponsor.id,
        userNodeId: sponsor.nodeId,
        type: 'bet_turnover_commission' as any,
        amount: commissionEarned,
        status: 'completed',
        notes: `🏆 Level ${level} Bet Turnover Commission (₹${commissionEarned.toFixed(2)}) from ${user.name}'s ₹${betAmount.toFixed(2)} Bet on ${gameName}`,
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
  } else if (cp.adminMode === 'smart_retention_60_40') {
    // 60:40 Retention Algorithm (60% Platform House Margin / 40% User Win Payout Distribution)
    const totalStakes = activeBets.reduce((acc, b) => acc + b.totalBet, 0);

    if (totalStakes <= 0) {
      winningNum = Math.floor(Math.random() * 10);
    } else {
      const projections = Array.from({ length: 10 }, (_, num) => ({
        number: num,
        payout: calculatePayoutForNumber(num, activeBets),
      }));

      const targetPayout = totalStakes * 0.40;
      const winningBalancedCandidates = projections.filter((p) => p.payout > 0 && p.payout <= totalStakes * 0.50);

      // Roll 60:40 probability: 40% player win cycle, 60% house advantage cycle
      const roll = Math.random();

      if (roll < 0.40) {
        // 40% Player Win Cycle: Give users the thrill of winning sustainably
        if (winningBalancedCandidates.length > 0) {
          winningBalancedCandidates.sort((a, b) => Math.abs(a.payout - targetPayout) - Math.abs(b.payout - targetPayout));
          winningNum = winningBalancedCandidates[0].number;
        } else {
          // If only single or high multiplier bets exist, pick candidate with lowest positive payout
          const positiveCandidates = projections.filter((p) => p.payout > 0).sort((a, b) => a.payout - b.payout);
          if (positiveCandidates.length > 0) {
            winningNum = positiveCandidates[0].number;
          } else {
            winningNum = Math.floor(Math.random() * 10);
          }
        }
      } else {
        // 60% House Advantage Cycle: Choose lowest payout
        const lowestPayout = Math.min(...projections.map((p) => p.payout));
        const lowestCandidates = projections.filter((p) => p.payout === lowestPayout).map((p) => p.number);
        winningNum = lowestCandidates[Math.floor(Math.random() * lowestCandidates.length)];
      }
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
          notes: `Win Go 1m Win - Period #${currentPeriod} Result: ${winningNum} (${payout.toFixed(2)} to Winning Wallet)`,
          createdAt: new Date().toISOString(),
        });
      }
    } else {
      bet.status = 'lost';
      bet.payout = 0;

      // 50% Loss Shield / Bonus Cashback on User's First 3 Losing Bets
      const user = state.users.find((u) => u.id === bet.userId);
      if (user) {
        const previousLostBets = cp.bets.filter(
          (b) => b.userId === user.id && b.id !== bet.id && b.periodId !== currentPeriod && b.status === 'lost'
        );

        if (previousLostBets.length < 3) {
          const refundAmt = Number((bet.totalBet * 0.50).toFixed(2));
          if (refundAmt > 0) {
            user.depositBalance = Number(((user.depositBalance || 0) + refundAmt).toFixed(2));
            bet.cashbackAwarded = refundAmt;

            state.transactions.unshift({
              id: `tx-cpcashback-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              userId: user.id,
              userNodeId: user.nodeId,
              type: 'bonus' as any,
              amount: refundAmt,
              status: 'completed',
              notes: `🛡️ Win Go 50% Loss Shield: 50% of ${bet.totalBet.toFixed(2)} (${refundAmt.toFixed(2)}) returned to Fund Wallet (First Loss ${previousLostBets.length + 1} of 3)`,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
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
    if (elapsedSec >= 4) {
      av.status = 'flying';
      av.startTime = now;
      av.currentMultiplier = 1.00;

      if (av.forcedNextCrash !== null && av.forcedNextCrash >= 1.0) {
        av.targetCrashMultiplier = av.forcedNextCrash;
        av.forcedNextCrash = null;
      } else if (av.adminMode === 'lowest_payout') {
        const totalStakes = av.bets.filter((b) => b.status === 'pending').reduce((sum, b) => sum + b.amount, 0);
        if (totalStakes > 1000) {
          av.targetCrashMultiplier = Number((1.25 + Math.random() * 0.95).toFixed(2));
        } else if (totalStakes > 0) {
          av.targetCrashMultiplier = Number((1.35 + Math.random() * 2.10).toFixed(2));
        } else {
          av.targetCrashMultiplier = Number((1.50 + Math.random() * 9.50).toFixed(2));
        }
      } else {
        const rand = Math.random();
        if (rand < 0.12) av.targetCrashMultiplier = Number((1.20 + Math.random() * 0.35).toFixed(2));
        else if (rand < 0.65) av.targetCrashMultiplier = Number((1.40 + Math.random() * 2.50).toFixed(2));
        else if (rand < 0.88) av.targetCrashMultiplier = Number((3.50 + Math.random() * 6.00).toFixed(2));
        else av.targetCrashMultiplier = Number((9.50 + Math.random() * 30.00).toFixed(2));
      }
    }
  } else if (av.status === 'flying') {
    // Smooth flight progression curve
    const mult = Number((1.00 + Math.pow(elapsedSec / 2.8, 1.7) * 1.3).toFixed(2));
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
      if (av.history.length > 25) av.history.pop();

      av.bets.forEach((bet) => {
        if (bet.status === 'pending') {
          bet.status = 'crashed';
        }
      });
      saveStore();
    }
  } else if (av.status === 'crashed') {
    if (elapsedSec >= 2.8) {
      av.status = 'waiting';
      av.currentRoundId = `AV-${now}`;
      av.currentMultiplier = 1.00;
      av.startTime = now;
      av.bets = [];
      saveStore();
    }
  }
}

setInterval(tickAviatorGame, 150);

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
      (activePkg && (activePkg.price >= 2000 || activePkg.isUpgradePackage)) ||
      u.activePackageId === 'pkg-20' ||
      hasBoosterTx
    );
    u.isUpgraded = isUpgraded;
  });
}

function parseCookieHeader(cookieHeader?: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  cookieHeader.split(';').forEach((part) => {
    const eqIdx = part.indexOf('=');
    if (eqIdx > 0) {
      const k = part.slice(0, eqIdx).trim();
      const v = part.slice(eqIdx + 1).trim();
      try {
        result[k] = decodeURIComponent(v);
      } catch {
        result[k] = v;
      }
    }
  });
  return result;
}

function getCookieRootDomain(req: Request): string | null {
  const configuredRoot = (state.settings?.gameSubdomains?.rootDomain || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .split(':')[0]
    .toLowerCase();
  const host = (req.hostname || req.headers.host || '').split(':')[0].toLowerCase();
  const isLocalOrPreview =
    !host ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    /^\d+\.\d+\.\d+\.\d+$/.test(host) ||
    host.endsWith('.run.app') ||
    host.endsWith('.web.app') ||
    host.endsWith('.firebaseapp.com');

  if (configuredRoot && host.endsWith(configuredRoot)) {
    return `.${configuredRoot}`;
  }
  if (!isLocalOrPreview && host.includes('.')) {
    const parts = host.split('.');
    if (parts.length >= 2) {
      return `.${parts.slice(-2).join('.')}`;
    }
  }
  return null;
}

function setSessionCookie(res: Response, req: Request, userId: string) {
  const domain = getCookieRootDomain(req);
  const parts = [
    `tp_user_id=${encodeURIComponent(userId)}`,
    'Path=/',
    'Max-Age=2592000',
    'SameSite=Lax',
  ];
  if (domain) parts.push(`Domain=${domain}`);
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(res: Response, req: Request) {
  const domain = getCookieRootDomain(req);
  const parts = ['tp_user_id=', 'Path=/', 'Max-Age=0', 'SameSite=Lax'];
  if (domain) parts.push(`Domain=${domain}`);
  res.setHeader('Set-Cookie', parts.join('; '));
}

// Helper to get active user for request (supports header 'x-user-id', query/body userId, and cross-subdomain cookie 'tp_user_id')
function getUserFromReq(req: Request): User | undefined {
  const cookies = parseCookieHeader(req.headers.cookie);
  const reqUserId =
    (req.headers['x-user-id'] as string) ||
    (req.query.userId as string) ||
    (req.body && req.body.userId) ||
    cookies['tp_user_id'];
  if (reqUserId && reqUserId.trim() !== '' && reqUserId !== 'undefined' && reqUserId !== 'null') {
    const found = state.users.find((u) => u.id === reqUserId || u.nodeId.toLowerCase() === reqUserId.toLowerCase());
    if (found) return found;
  }
  return undefined;
}

// Helper to verify granular admin & sub-admin permissions
function checkAdminPermission(
  req: Request,
  permKey?: keyof AdminPermissions
): { allowed: boolean; user?: User; error?: string; status: number } {
  const user = getUserFromReq(req);
  if (!user) {
    // If not supplied in header, fallback to active super admin if configured
    const rootUser = state.users.find((u) => u.id === 'usr-root' || u.nodeId === 'NX-ROOT01');
    if (!req.headers['x-user-id'] && rootUser) {
      return { allowed: true, user: rootUser, status: 200 };
    }
    return { allowed: false, error: 'Unauthorized: Admin authentication session required', status: 401 };
  }

  // Sovereign Super Admin has 100% unrestricted access to all operations
  if (user.isSuperAdmin || user.id === 'usr-root' || user.nodeId === 'NX-ROOT01') {
    return { allowed: true, user, status: 200 };
  }

  // Must be recognized as an Admin or Sub-Admin
  if (!user.isAdmin && !user.isSubAdmin) {
    return { allowed: false, user, error: 'Forbidden: Admin authorization required', status: 403 };
  }

  // Check if sub-admin status is inactive or banned
  if (user.status !== 'active') {
    return { allowed: false, user, error: 'Forbidden: Your Sub-Admin account is suspended or inactive', status: 403 };
  }

  // Check specific granular permission if requested
  if (permKey) {
    const hasPerm = Boolean(user.adminPermissions && user.adminPermissions[permKey]);
    if (!hasPerm) {
      return {
        allowed: false,
        user,
        error: `Permission Denied: Your Sub-Admin role does not have '${String(permKey)}' authority.`,
        status: 403,
      };
    }
  }

  return { allowed: true, user, status: 200 };
}

function checkAnyAdminPermission(
  req: Request,
  permKeys: Array<keyof AdminPermissions>
): { allowed: boolean; user?: User; error?: string; status: number } {
  const baseAuth = checkAdminPermission(req);
  if (!baseAuth.allowed || !baseAuth.user) return baseAuth;
  const u = baseAuth.user;
  if (u.isSuperAdmin || u.id === 'usr-root' || u.nodeId === 'NX-ROOT01') {
    return { allowed: true, user: u, status: 200 };
  }
  const hasAny = permKeys.some((k) => Boolean(u.adminPermissions && u.adminPermissions[k]));
  if (!hasAny) {
    return {
      allowed: false,
      user: u,
      error: `Permission Denied: Requires one of [${permKeys.join(', ')}] permissions.`,
      status: 403,
    };
  }
  return { allowed: true, user: u, status: 200 };
}

// API ROUTES

// 1. Get Full Application State or Current User Context
app.get('/api/state', (req: Request, res: Response) => {
  ensureGameSubdomainSettings();
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
  const cleanInput = (nodeId || email || '').trim().toLowerCase();
  
  if (!cleanInput) {
    return res.status(400).json({ error: 'Please provide Email, Node ID or username.' });
  }

  // Ensure root admin exists in state
  if (!state.users || state.users.length === 0 || !state.users.some((u) => u.id === 'usr-root' || u.nodeId === 'NX-ROOT01' || u.isAdmin)) {
    const existing = Array.isArray(state.users) ? state.users : [];
    state.users = [...initialUsers, ...existing.filter((u) => u.id !== 'usr-root' && u.nodeId !== 'NX-ROOT01')];
    saveStore();
  }

  const user = state.users.find(
    (u) =>
      (u.nodeId && u.nodeId.toLowerCase() === cleanInput) ||
      (u.email && u.email.toLowerCase() === cleanInput) ||
      (u.name && u.name.toLowerCase() === cleanInput) ||
      ((cleanInput === 'admin' || cleanInput === 'root' || cleanInput === 'administrator' || cleanInput === 'admin@sportx.tech' || cleanInput === 'admin@sportx.game' || cleanInput === 'admin@tetherplus.io') && (u.id === 'usr-root' || u.nodeId === 'NX-ROOT01' || u.isAdmin))
  );

  if (!user) {
    return res.status(404).json({ error: `User "${cleanInput}" not found. Please check Node ID or Email.` });
  }

  const inputPass = String(password || '').trim();
  if (!inputPass) {
    return res.status(400).json({ error: 'Password is required to log in.' });
  }

  const userPass = String(user.password || '123456').trim();
  const isMatch = inputPass === userPass;

  if (!isMatch) {
    return res.status(400).json({ error: 'Incorrect password. Please check your password or click "Forgot your password?".' });
  }

  // Set user as active session
  state.activeUserId = user.id;
  setSessionCookie(res, req, user.id);

  res.json({ success: true, user });
});

// Logout endpoint
app.post('/api/auth/logout', (req: Request, res: Response) => {
  clearSessionCookie(res, req);
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
        from: `"SportX Security" <${smtpConfig.smtpFrom}>`,
        to: user.email,
        subject: `SportX - Password Reset OTP (${otp})`,
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #0b1424; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid #1e293b;">
            <h2 style="color: #00eeff; margin-top: 0; text-align: center;">SportX Password Reset</h2>
            <p>Hello <strong>${user.name || user.nodeId}</strong>,</p>
            <p>You requested a password reset for your SportX account (#${user.nodeId}). Here is your 6-digit verification OTP code:</p>
            <div style="background-color: #050911; border: 1px solid #00eeff; border-radius: 8px; padding: 18px; text-align: center; margin: 20px 0;">
              <span style="font-size: 34px; font-weight: bold; letter-spacing: 8px; color: #00eeff;">${otp}</span>
            </div>
            <p style="font-size: 13px; color: #94a3b8;">This code is valid for 15 minutes. If you did not request this, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;" />
            <p style="font-size: 11px; color: #64748b; text-align: center;">SportX Gaming Platform • ${smtpConfig.smtpFrom}</p>
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

  // Update Password permanently
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
  const { userId, currentPassword, newPassword } = req.body;
  const user = (userId && state.users.find((u) => u.id === userId || u.nodeId === userId)) || getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'User not logged in or account not found' });

  if (!newPassword || newPassword.trim().length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters long' });
  }

  const existingPass = user.password || '123456';
  if (currentPassword && currentPassword.trim() !== existingPass) {
    return res.status(400).json({ error: 'Current password is incorrect. Please check and try again.' });
  }

  user.password = newPassword.trim();
  saveStore();
  return res.json({
    success: true,
    user,
    message: 'Your password has been changed successfully! Please use this new password for all future logins.',
  });
});

// Admin Change / Reset User Password
app.post('/api/admin/users/change-password', (req: Request, res: Response) => {
  const { userId, newPassword } = req.body;
  if (!userId || !newPassword) {
    return res.status(400).json({ error: 'User ID and New Password are required' });
  }

  const cleanPass = String(newPassword).trim();
  if (cleanPass.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters long' });
  }

  const cleanId = String(userId).trim().toLowerCase();

  // Find user by ID, Node ID, Email, or Admin keyword
  let matchedUsers = state.users.filter(
    (u) =>
      (u.id && u.id.toLowerCase() === cleanId) ||
      (u.nodeId && u.nodeId.toLowerCase() === cleanId) ||
      (u.email && u.email.toLowerCase() === cleanId) ||
      ((cleanId === 'usr-root' || cleanId === 'nx-root01' || cleanId === 'admin' || cleanId === 'root') &&
        (u.id === 'usr-root' || u.nodeId === 'NX-ROOT01' || u.isAdmin))
  );

  if (matchedUsers.length === 0) {
    // If not found and it's root/admin, look for any root/admin user
    const root = state.users.find((u) => u.id === 'usr-root' || u.nodeId === 'NX-ROOT01' || u.isAdmin);
    if (root) matchedUsers = [root];
  }

  if (matchedUsers.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  matchedUsers.forEach((u) => {
    u.password = cleanPass;
  });

  saveStore();

  const primaryUser = matchedUsers[0];
  return res.json({
    success: true,
    user: primaryUser,
    message: `Password for user #${primaryUser.nodeId} (${primaryUser.name}) successfully updated and permanently saved!`,
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

  const signupCfg = state.settings?.signupBonus;
  const signupBonusInr = signupCfg?.enabled ? Math.max(0, Number(signupCfg.amountInr) || 0) : 0;
  const signupFreeSpins = signupCfg ? Math.max(0, Number(signupCfg.freeSpins ?? 1)) : 1;
  const signupWallet = signupCfg?.creditWallet || 'depositBalance';

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
    balance: signupWallet === 'balance' ? signupBonusInr : 0.0,
    depositBalance: signupWallet === 'depositBalance' ? signupBonusInr : 0.0,
    upgradeBalance: 0.0,
    winningBalance: signupWallet === 'winningBalance' ? signupBonusInr : 0.0,
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
    spinCredits: signupFreeSpins,
    lastSpinAt: null,
  };

  state.users.push(newUser);

  if (signupBonusInr > 0) {
    state.transactions.unshift({
      id: `tx-${Date.now()}-signupbonus`,
      userId: newUser.id,
      userNodeId: newUser.nodeId,
      type: 'signup_bonus',
      amount: signupBonusInr,
      status: 'completed',
      notes: `🎁 Welcome Signup Bonus: +₹${signupBonusInr.toFixed(2)} INR credited to ${
        signupWallet === 'winningBalance' ? 'Winning Wallet' : signupWallet === 'balance' ? 'Main Wallet' : 'Deposit Wallet'
      }`,
      createdAt: new Date().toISOString(),
    });
  }

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
        from: `"SportX Team" <${smtpConfig.smtpFrom}>`,
        to: newUser.email,
        subject: `Welcome to SportX Gaming Platform, ${newUser.name}! 🚀`,
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f8fafc; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
            <h2 style="color: #06b6d4; margin-top: 0; font-size: 22px; text-align: center;">Welcome to SportX! 🎉</h2>
            <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">Hi <strong>${newUser.name}</strong>,</p>
            <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">Thank you for registering on <strong>SportX Gaming Platform</strong>. Your account has been successfully created!</p>
            
            <div style="background-color: #111827; border: 1px solid #374151; border-radius: 8px; padding: 18px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #9ca3af;"><strong>Your Node ID:</strong> <span style="color: #38bdf8; font-family: monospace; font-size: 15px; font-weight: bold;">${newUser.nodeId}</span></p>
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #9ca3af;"><strong>Registered Email:</strong> <span style="color: #f3f4f6;">${newUser.email}</span></p>
              <p style="margin: 0; font-size: 13px; color: #9ca3af;"><strong>Sponsor:</strong> <span style="color: #a78bfa;">${sponsor.name} (${sponsor.nodeId})</span></p>
            </div>

            <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">You can now deposit funds, play all live games, unlock VIP rewards, and earn referral commissions.</p>
            
            <div style="text-align: center; margin: 28px 0;">
              <a href="https://sportx.game" style="background: linear-gradient(135deg, #06b6d4, #3b82f6); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Go to Dashboard</a>
            </div>

            <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;" />
            <p style="font-size: 11px; color: #64748b; text-align: center;">SportX Gaming Platform • ${smtpConfig.smtpFrom}</p>
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

  setSessionCookie(res, req, newUser.id);
  res.json({ success: true, user: newUser });
});

// 4. Packages/MLM Buy endpoint - Retired for Pure Gaming Platform
app.post('/api/packages/buy', (req: Request, res: Response) => {
  return res.status(400).json({
    error: 'SportX is a 100% pure gaming platform. No MLM package purchase is required! Deposit funds to play Color Prediction, Aviator, Dragon vs Tiger, and earn via the 5-Level Agent Referral Turnover.',
  });
});

// 5. ROI Yield Claim endpoint - Retired for Pure Gaming Platform
app.post('/api/roi/claim', (req: Request, res: Response) => {
  return res.status(400).json({
    error: 'ROI yield has been deprecated. All earnings are generated through live game winnings and the 5-level team betting turnover commission.',
  });
});

// 6. Submit Deposit Request (Pure INR 1:1 UPI / Bank Deposit & Rotating UPI Tracking)
app.post('/api/deposit', async (req: Request, res: Response) => {
  const { amount, network, txHash, upiId, inrAmount } = req.body;
  const user = getUserFromReq(req);

  if (!user) return res.status(400).json({ error: 'User not logged in' });
  const rawInr = inrAmount !== undefined && Number(inrAmount) > 0 ? Number(inrAmount) : parseFloat(amount);
  const numAmount = Number((rawInr || 0).toFixed(2));
  const selectedNetwork = network || 'UPI-QR';

  const minDeposit = state.settings.minDepositAmount !== undefined ? Number(state.settings.minDepositAmount) : 100;
  if (!numAmount || numAmount < minDeposit) return res.status(400).json({ error: `Minimum deposit is ₹${minDeposit} INR` });
  if (!txHash || txHash.trim().length < 6)
    return res.status(400).json({ error: 'Please enter a valid 12-digit UTR or Transaction Ref ID' });

  const cleanTxHash = txHash.trim();

  // Anti-Replay Check: Ensure this TXID / UTR has not already been used/approved
  const alreadyUsed = state.depositRequests.some(
    (d) => d.txHash && d.txHash.toLowerCase() === cleanTxHash.toLowerCase() && d.status === 'approved'
  );
  if (alreadyUsed) {
    return res.status(400).json({ error: 'This Transaction Ref / UTR has already been claimed and credited.' });
  }

  let isAutoApproved = false;
  let verifiedAmount = numAmount;
  let verificationNotes = `Awaiting verification for UPI/Bank UTR: ${cleanTxHash}${upiId ? ` (Paid to ${upiId})` : ''}`;

  const dep: DepositRequest = {
    id: `dep-${Date.now()}`,
    userId: user.id,
    userNodeId: user.nodeId,
    userName: user.name,
    amount: verifiedAmount,
    inrAmount: verifiedAmount,
    network: selectedNetwork,
    txHash: cleanTxHash,
    status: 'pending',
    createdAt: new Date().toISOString(),
    adminNotes: verificationNotes,
  };

  // Optional legacy on-chain fallback if explicitly submitted with BEP20 0x hash
  if (selectedNetwork === 'BEP20' && cleanTxHash.startsWith('0x') && cleanTxHash.length === 66) {
    try {
      const companyAddress = state.settings.walletAddresses?.BEP20 || DEFAULT_HOT_WALLET_ADDRESS;
      const verifyRes = await verifyOnChainDeposit(cleanTxHash, companyAddress);

      if (verifyRes.valid && verifyRes.amount && verifyRes.amount > 0) {
        isAutoApproved = true;
        verifiedAmount = Number(verifyRes.amount.toFixed(2));
        dep.amount = verifiedAmount;
        dep.inrAmount = verifiedAmount;
        dep.status = 'approved';
        verificationNotes = `⚡ Instant Auto-Verified Deposit (Ref #${verifyRes.blockNumber})`;
        dep.adminNotes = verificationNotes;

        user.depositBalance = (user.depositBalance || 0) + verifiedAmount;
        user.totalDeposited = (user.totalDeposited || 0) + verifiedAmount;

        state.transactions.unshift({
          id: `tx-${Date.now()}-autodep`,
          userId: user.id,
          userNodeId: user.nodeId,
          type: 'deposit',
          amount: verifiedAmount,
          status: 'completed',
          txHash: cleanTxHash,
          network: selectedNetwork,
          notes: `⚡ Instant Auto-Verified Deposit: +₹${verifiedAmount.toFixed(2)} INR credited to Deposit Wallet`,
          createdAt: new Date().toISOString(),
        });

        applyDepositBonus(user, verifiedAmount, dep);
        user.hasFirstDepositApproved = true;
      } else if (verifyRes.error) {
        verificationNotes = `Auto-check note: ${verifyRes.error} (Queued for manual admin verification)`;
        dep.adminNotes = verificationNotes;
      }
    } catch (err: any) {
      console.warn('Auto deposit verification error:', err);
    }
  }

  // Track INR collection directly on rotating UPI pool
  if (upiId && state.settings.paymentGateway?.upiPool) {
    const poolItem = state.settings.paymentGateway.upiPool.find(
      (u) => u.upiId.toLowerCase() === upiId.toLowerCase()
    );
    if (poolItem) {
      poolItem.totalCollected = (poolItem.totalCollected || 0) + verifiedAmount;
    }
  }

  state.depositRequests.unshift(dep);
  saveStore();

  res.json({
    success: true,
    autoApproved: isAutoApproved,
    message: isAutoApproved
      ? `🎉 Deposit verified! ₹${verifiedAmount.toFixed(2)} INR${dep.bonusInr ? ` + ₹${dep.bonusInr.toFixed(2)} Bonus` : ''} has been automatically credited to your Deposit Wallet!`
      : `Deposit request for ₹${verifiedAmount.toLocaleString('en-IN')} submitted! Your balance will be credited as soon as the 12-digit UTR is verified.`,
    depositRequest: dep,
    user,
  });
});

// 6a. DYNAMIC ROTATING UPI ENDPOINT FOR DEPOSITS & PAYMENT GATEWAY
app.get('/api/payment/active-upi', (req: Request, res: Response) => {
  ensurePaymentGatewaySettings();
  const gateway = state.settings.paymentGateway || defaultSettings.paymentGateway!;
  const upiPool = gateway.upiPool || [];
  const activePool = upiPool.filter((item) => item.isActive !== false);

  if (activePool.length === 0) {
    return res.json({
      success: true,
      upiId: gateway.defaultUpiId || 'sportxpay@okaxis',
      payeeName: gateway.defaultPayeeName || 'SportX Gaming Official',
      provider: detectUpiProvider(gateway.defaultUpiId || 'sportxpay@okaxis'),
      id: 'default',
      qrTimerSeconds: gateway.qrTimerSeconds || 600,
      rotationStrategy: gateway.rotationStrategy || 'roundRobin',
      activePoolCount: 0,
      totalPoolCount: upiPool.length,
      subdomainUrl: gateway.subdomainUrl || '',
      bankAccount: gateway.bankAccount || null,
      sessionTxnId: `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
    });
  }

  let selected: UpiPoolItem;
  const strategy = gateway.rotationStrategy || 'roundRobin';

  if (strategy === 'leastUsed') {
    // Pick the active UPI that has been shown the least
    const sorted = [...activePool].sort((a, b) => (a.usedCount || 0) - (b.usedCount || 0));
    selected = sorted[0];
  } else if (strategy === 'random') {
    // Pick a completely random active UPI
    const randIdx = Math.floor(Math.random() * activePool.length);
    selected = activePool[randIdx];
  } else {
    // Round-Robin sequential rotation
    selected = activePool[upiRotationPointer % activePool.length];
    upiRotationPointer = (upiRotationPointer + 1) % activePool.length;
  }

  // Increment usage count for this rotating UPI
  selected.usedCount = (selected.usedCount || 0) + 1;
  saveStore();

  res.json({
    success: true,
    upiId: selected.upiId,
    payeeName: selected.name,
    provider: selected.provider || detectUpiProvider(selected.upiId),
    id: selected.id,
    usedCount: selected.usedCount,
    qrTimerSeconds: gateway.qrTimerSeconds || 600,
    rotationStrategy: strategy,
    activePoolCount: activePool.length,
    totalPoolCount: upiPool.length,
    subdomainUrl: gateway.subdomainUrl || '',
    bankAccount: gateway.bankAccount || null,
    sessionTxnId: `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
  });
});

// 6a-2. ADMIN / SUB-ADMIN: Save Primary Deposit UPI & Bank Account Details
app.post('/api/admin/gateway/payment-methods', (req: Request, res: Response) => {
  const auth = checkAnyAdminPermission(req, ['canManageUpiGateway', 'canManageDeposits', 'canManageSettings']);
  if (!auth.allowed) return res.status(auth.status).json({ error: auth.error });

  ensurePaymentGatewaySettings();
  const gw = state.settings.paymentGateway!;
  const {
    defaultUpiId,
    defaultPayeeName,
    subdomainUrl,
    rotationStrategy,
    qrTimerSeconds,
    bankAccount,
  } = req.body || {};

  if (typeof defaultUpiId === 'string' && defaultUpiId.trim()) {
    gw.defaultUpiId = defaultUpiId.trim();
  }
  if (typeof defaultPayeeName === 'string' && defaultPayeeName.trim()) {
    gw.defaultPayeeName = defaultPayeeName.trim();
  }
  if (typeof subdomainUrl === 'string') {
    gw.subdomainUrl = subdomainUrl.trim();
  }
  if (rotationStrategy && ['roundRobin', 'random', 'leastUsed'].includes(rotationStrategy)) {
    gw.rotationStrategy = rotationStrategy;
  }
  if (qrTimerSeconds !== undefined && !isNaN(Number(qrTimerSeconds))) {
    gw.qrTimerSeconds = Math.max(60, Math.min(3600, Number(qrTimerSeconds)));
  }
  if (bankAccount && typeof bankAccount === 'object') {
    gw.bankAccount = {
      enabled: Boolean(bankAccount.enabled),
      accountHolderName: String(bankAccount.accountHolderName || '').trim(),
      bankName: String(bankAccount.bankName || '').trim(),
      accountNumber: String(bankAccount.accountNumber || '').trim(),
      ifscCode: String(bankAccount.ifscCode || '').trim().toUpperCase(),
      branchName: String(bankAccount.branchName || '').trim(),
    };
  }

  saveStore();
  res.json({
    success: true,
    message: 'Deposit UPI & Bank Account details saved successfully!',
    paymentGateway: gw,
    settings: state.settings,
  });
});

// 6b. ADMIN: Bulk Upload up to 100+ UPI IDs at once
app.post('/api/admin/upi-pool/bulk', (req: Request, res: Response) => {
  const auth = checkAnyAdminPermission(req, ['canManageUpiGateway', 'canManageDeposits', 'canManageSettings']);
  if (!auth.allowed) return res.status(auth.status).json({ error: auth.error });

  ensurePaymentGatewaySettings();
  const { bulkText, defaultName, replaceAll, dailyLimit } = req.body;

  if (!bulkText || typeof bulkText !== 'string' || !bulkText.trim()) {
    return res.status(400).json({ error: 'Please enter at least one valid UPI ID' });
  }

  const lines = bulkText.split(/[\r\n,;]+/);
  const parsedItems: UpiPoolItem[] = [];
  const existingPool = state.settings.paymentGateway?.upiPool || [];
  const existingMap = new Set(replaceAll ? [] : existingPool.map((u) => u.upiId.toLowerCase().trim()));

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Support formats:
    // 1. "merchant@bank"
    // 2. "merchant@bank, Payee Name"
    // 3. "merchant@bank | Payee Name"
    // 4. "merchant@bank : Payee Name"
    let upiId = '';
    let name = defaultName?.trim() || 'Merchant Pay';

    if (line.includes('|')) {
      const parts = line.split('|');
      upiId = parts[0].trim();
      name = parts[1].trim() || name;
    } else if (line.includes(':')) {
      const parts = line.split(':');
      upiId = parts[0].trim();
      name = parts[1].trim() || name;
    } else if (line.includes(',')) {
      const parts = line.split(',');
      upiId = parts[0].trim();
      name = parts[1].trim() || name;
    } else if (line.includes('\t')) {
      const parts = line.split('\t');
      upiId = parts[0].trim();
      name = parts[1].trim() || name;
    } else {
      upiId = line;
    }

    // Clean up UPI ID (remove spaces, enforce @ if present)
    upiId = upiId.replace(/\s+/g, '');
    if (!upiId || upiId.length < 5 || !upiId.includes('@')) {
      continue;
    }

    if (existingMap.has(upiId.toLowerCase())) {
      continue; // Skip duplicate within this session
    }
    existingMap.add(upiId.toLowerCase());

    parsedItems.push({
      id: `upi-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      upiId,
      name: name || 'Merchant Pay',
      provider: detectUpiProvider(upiId),
      dailyLimit: Number(dailyLimit) || 100000,
      usedCount: 0,
      totalCollected: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    });
  }

  if (parsedItems.length === 0) {
    return res.status(400).json({
      error: 'No valid or new UPI IDs found. Format: name@bank or name@bank, Payee Name',
    });
  }

  if (!state.settings.paymentGateway) {
    state.settings.paymentGateway = { ...defaultSettings.paymentGateway! };
  }

  if (replaceAll) {
    state.settings.paymentGateway.upiPool = parsedItems;
  } else {
    state.settings.paymentGateway.upiPool = [...existingPool, ...parsedItems];
  }

  saveStore();

  res.json({
    success: true,
    addedCount: parsedItems.length,
    totalCount: state.settings.paymentGateway.upiPool.length,
    message: `Successfully imported ${parsedItems.length} rotating UPI IDs into the gateway pool!`,
    pool: state.settings.paymentGateway.upiPool,
  });
});

// 6c. ADMIN: Toggle Active/Paused state of a UPI ID
app.post('/api/admin/upi-pool/toggle', (req: Request, res: Response) => {
  const auth = checkAnyAdminPermission(req, ['canManageUpiGateway', 'canManageDeposits', 'canManageSettings']);
  if (!auth.allowed) return res.status(auth.status).json({ error: auth.error });

  ensurePaymentGatewaySettings();
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing UPI ID' });

  const pool = state.settings.paymentGateway?.upiPool || [];
  const item = pool.find((u) => u.id === id);
  if (!item) return res.status(404).json({ error: 'UPI record not found' });

  item.isActive = !item.isActive;
  saveStore();

  res.json({
    success: true,
    item,
    message: `UPI ${item.upiId} is now ${item.isActive ? 'Active (in rotation)' : 'Paused (disabled)'}`,
    pool,
  });
});

// 6d. ADMIN: Delete a single UPI ID from pool
app.delete('/api/admin/upi-pool/:id', (req: Request, res: Response) => {
  const auth = checkAnyAdminPermission(req, ['canManageUpiGateway', 'canManageDeposits', 'canManageSettings']);
  if (!auth.allowed) return res.status(auth.status).json({ error: auth.error });

  ensurePaymentGatewaySettings();
  const { id } = req.params;
  const pool = state.settings.paymentGateway?.upiPool || [];
  const idx = pool.findIndex((u) => u.id === id);
  if (idx === -1) return res.status(404).json({ error: 'UPI record not found' });

  const removed = pool.splice(idx, 1)[0];
  saveStore();

  res.json({
    success: true,
    removed,
    message: `Removed ${removed.upiId} from rotation pool`,
    pool,
  });
});

// 6e. ADMIN: Reset all usage and collection counts
app.post('/api/admin/upi-pool/reset-counts', (req: Request, res: Response) => {
  const auth = checkAnyAdminPermission(req, ['canManageUpiGateway', 'canManageDeposits', 'canManageSettings']);
  if (!auth.allowed) return res.status(auth.status).json({ error: auth.error });

  ensurePaymentGatewaySettings();
  const pool = state.settings.paymentGateway?.upiPool || [];
  pool.forEach((u) => {
    u.usedCount = 0;
    u.totalCollected = 0;
  });
  saveStore();

  res.json({
    success: true,
    message: 'Reset all UPI usage counters and collection amounts to 0',
    pool,
  });
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
      error: `Insufficient Winnings Wallet balance (₹${currentWinnings.toFixed(2)} INR available).`
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
    notes: `🔄 Converted ₹${numAmount.toFixed(2)} INR from Winnings Wallet to Deposit Balance for Game Play`,
    createdAt: new Date().toISOString(),
  });

  saveStore();
  return res.json({
    success: true,
    message: `Successfully transferred ₹${numAmount.toFixed(2)} INR from Winnings to Deposit Wallet!`,
    user,
  });
});

// 7. Request Withdrawal (100% Pure INR UPI / Bank Transfer)
app.post('/api/withdraw', async (req: Request, res: Response) => {
  const { amount, targetAddress, network, walletType } = req.body;
  const user = getUserFromReq(req);

  if (!user) return res.status(400).json({ error: 'User not logged in' });

  const isWinningWallet = walletType === 'winning';
  const reqAmt = parseFloat(amount);
  const selectedNetwork = network || 'UPI';

  if (isWinningWallet) {
    const minWinWd = state.settings.winningWithdrawalMinAmount || 100;
    if (!reqAmt || reqAmt < minWinWd) {
      return res.status(400).json({ error: `Minimum Game Winning withdrawal is ₹${minWinWd} INR` });
    }
    const winBal = user.winningBalance || 0;
    if (winBal < reqAmt) {
      return res.status(400).json({ error: `Insufficient winning balance (₹${winBal.toFixed(2)} INR available).` });
    }
    if (!targetAddress || String(targetAddress).trim().length < 5) {
      return res.status(400).json({ error: 'Please provide a valid UPI ID or Bank Account details' });
    }

    const feePercent = state.settings.winningWithdrawalFeePercent !== undefined
      ? Number(state.settings.winningWithdrawalFeePercent)
      : 10;
    const adminFee = Number((reqAmt * (feePercent / 100)).toFixed(2));
    const netAmount = Math.max(0, Number((reqAmt - adminFee).toFixed(2)));

    user.winningBalance = (user.winningBalance || 0) - reqAmt;

    let autoDispatched = false;
    let liveTxHash = 'Pending Approval';
    let adminNotes = `Submitted - Game Winning ${selectedNetwork} Withdrawal (${feePercent}% Fee)`;

    const autoThreshold = state.settings.autoPayoutThresholdUSDT !== undefined
      ? Number(state.settings.autoPayoutThresholdUSDT)
      : 2000;

    const isEligibleForAutoPayout = reqAmt <= autoThreshold;

    if (isEligibleForAutoPayout && selectedNetwork === 'BEP20' && targetAddress.startsWith('0x')) {
      try {
        const payoutRes = await executeBep20Payout(targetAddress, netAmount);
        if (payoutRes.success && payoutRes.txHash) {
          autoDispatched = true;
          liveTxHash = payoutRes.txHash;
          adminNotes = `⚡ Auto-Dispatched (Tx: ${payoutRes.txHash})`;
        } else if (payoutRes.error) {
          adminNotes = `Queued for manual dispatch (${payoutRes.error})`;
        }
      } catch (err: any) {
        console.warn('Auto payout execution note:', err);
      }
    } else if (!isEligibleForAutoPayout) {
      adminNotes = `High-Value Withdrawal (₹${reqAmt.toFixed(2)} > ₹${autoThreshold} Limit) - Pending Admin Approval`;
    } else {
      adminNotes = `${selectedNetwork} Transfer (Net ₹${netAmount.toFixed(2)} INR) - Pending Admin Approval`;
    }

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
      network: selectedNetwork,
      walletType: 'winning',
      status: autoDispatched ? 'approved' : 'pending',
      createdAt: new Date().toISOString(),
      adminNotes,
    };

    state.withdrawalRequests.unshift(wd);

    state.transactions.unshift({
      id: `tx-${Date.now()}-wdwin`,
      userId: user.id,
      userNodeId: user.nodeId,
      type: 'withdrawal',
      amount: reqAmt,
      status: autoDispatched ? 'completed' : 'pending',
      txHash: liveTxHash,
      network: selectedNetwork,
      notes: autoDispatched
        ? `⚡ Instant Payout: ₹${netAmount.toFixed(2)} INR sent to ${targetAddress.substring(0, 12)}... (Ref: ${liveTxHash})`
        : `Withdrawal Request: ₹${reqAmt.toFixed(2)} INR via ${selectedNetwork} (${feePercent}% Fee: ₹${adminFee.toFixed(2)}, Net Payout: ₹${netAmount.toFixed(2)})`,
      createdAt: new Date().toISOString(),
    });

    saveStore();
    return res.json({
      success: true,
      autoDispatched,
      message: autoDispatched
        ? `🚀 Instant Payout Successful! ₹${netAmount.toFixed(2)} INR sent (Ref: ${liveTxHash})`
        : `Game Winning withdrawal of ₹${reqAmt.toFixed(2)} INR submitted via ${selectedNetwork}!`,
      request: wd,
    });
  }

  // 5-LEVEL REFERRAL AGENCY COMMISSION WALLET WITHDRAWAL
  const minAgencyWithdrawal = state.settings.minWithdrawalAmount !== undefined
    ? Number(state.settings.minWithdrawalAmount)
    : 200;
  if (!reqAmt || reqAmt < minAgencyWithdrawal) {
    return res.status(400).json({ error: `Minimum 5-Level Agency Commission withdrawal is ₹${minAgencyWithdrawal} INR` });
  }
  if (user.balance < reqAmt) {
    return res.status(400).json({ error: `Insufficient commission balance (₹${user.balance.toFixed(2)} INR available)` });
  }
  if (!targetAddress || String(targetAddress).trim().length < 5) {
    return res.status(400).json({ error: 'Please provide a valid UPI ID or Bank Account details' });
  }

  const feePercent = state.settings.withdrawalFeePercent !== undefined
    ? Number(state.settings.withdrawalFeePercent)
    : 10;
  const gasFee = Number((reqAmt * (feePercent / 100)).toFixed(2));
  const netAmount = Math.max(0, Number((reqAmt - gasFee).toFixed(2)));

  user.balance -= reqAmt;

  let autoDispatched = false;
  let liveTxHash = 'Pending Approval';
  let adminNotes = `Submitted - Agency Commission ${selectedNetwork} Withdrawal (${feePercent}% Fee)`;

  const autoThreshold = state.settings.autoPayoutThresholdUSDT !== undefined
    ? Number(state.settings.autoPayoutThresholdUSDT)
    : 2000;

  const isEligibleForAutoPayout = reqAmt <= autoThreshold;

  if (isEligibleForAutoPayout && selectedNetwork === 'BEP20' && targetAddress.startsWith('0x')) {
    try {
      const payoutRes = await executeBep20Payout(targetAddress, netAmount);
      if (payoutRes.success && payoutRes.txHash) {
        autoDispatched = true;
        liveTxHash = payoutRes.txHash;
        adminNotes = `⚡ Auto-Dispatched (Tx: ${payoutRes.txHash})`;
      } else if (payoutRes.error) {
        adminNotes = `Queued for manual dispatch (${payoutRes.error})`;
      }
    } catch (err: any) {
      console.warn('Auto payout execution note:', err);
    }
  } else if (!isEligibleForAutoPayout) {
    adminNotes = `High-Value Withdrawal (₹${reqAmt.toFixed(2)} > ₹${autoThreshold} Limit) - Pending Admin Approval`;
  } else {
    adminNotes = `${selectedNetwork} Transfer (Net ₹${netAmount.toFixed(2)} INR) - Pending Admin Approval`;
  }

  const wd: WithdrawalRequest = {
    id: `wd-${Date.now()}`,
    userId: user.id,
    userNodeId: user.nodeId,
    userName: user.name,
    requestedAmount: reqAmt,
    upgradeDeduction: 0,
    gasFee,
    netAmount,
    targetAddress: targetAddress.trim(),
    network: selectedNetwork,
    walletType: 'mlm',
    status: autoDispatched ? 'approved' : 'pending',
    createdAt: new Date().toISOString(),
    adminNotes,
  };

  state.withdrawalRequests.unshift(wd);

  state.transactions.unshift({
    id: `tx-${Date.now()}-wd`,
    userId: user.id,
    userNodeId: user.nodeId,
    type: 'withdrawal',
    amount: reqAmt,
    status: autoDispatched ? 'completed' : 'pending',
    txHash: liveTxHash,
    network: selectedNetwork,
    notes: autoDispatched
      ? `⚡ Instant Payout: Net ₹${netAmount.toFixed(2)} INR sent to ${targetAddress.substring(0, 12)}...`
      : `5-Level Agency Commission Withdrawal: ₹${reqAmt.toFixed(2)} INR via ${selectedNetwork} (${feePercent}% Fee: ₹${gasFee.toFixed(2)}, Net: ₹${netAmount.toFixed(2)})`,
    createdAt: new Date().toISOString(),
  });

  saveStore();
  return res.json({
    success: true,
    autoDispatched,
    message: autoDispatched
      ? `🚀 Instant Payout Successful! ₹${netAmount.toFixed(2)} INR sent (Ref: ${liveTxHash})`
      : `Withdrawal request for ₹${reqAmt.toFixed(2)} INR submitted via ${selectedNetwork}!`,
    withdrawalRequest: wd,
    user,
  });
});

// 8. Spin Wheel Game
app.post('/api/spin', (req: Request, res: Response) => {
  if (!isServerGameEnabled('spinwheel')) {
    return res.status(403).json({ error: 'Spin & Win Wheel is currently turned off by Admin.' });
  }
  const user = getUserFromReq(req);
  if (!user) return res.status(400).json({ error: 'User not logged in' });

  const ticketPrice = state.settings.spinTicketPrice !== undefined ? Number(state.settings.spinTicketPrice) : 50;

  if (user.spinCredits <= 0) {
    return res.status(400).json({
      error: `No Spin Credits remaining! Additional spin tickets cost ₹${ticketPrice.toFixed(2)} INR each. Please buy spin tickets from your balance.`,
    });
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
      notes: `Daily Spin Wheel Reward: ${winningReward.label} (₹${winningReward.amount} INR to Winning Wallet)`,
      createdAt: new Date().toISOString(),
    });
  } else if (winningReward.label === 'Extra Spin') {
    user.spinCredits += 1;
  }

  saveStore();
  res.json({ success: true, winningReward, user });
});

// 8b. Buy Spin Tickets Endpoint
app.post('/api/spin/buy-ticket', (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  if (!user) return res.status(400).json({ error: 'User not logged in' });

  const qty = parseInt(req.body.qty) || 1;
  if (qty < 1 || qty > 100) {
    return res.status(400).json({ error: 'Invalid quantity! Please select between 1 and 100 spin tickets.' });
  }

  const ticketPrice = state.settings.spinTicketPrice !== undefined ? Number(state.settings.spinTicketPrice) : 50;
  const totalCost = qty * ticketPrice;

  if (!deductBetBalance(user, totalCost)) {
    const availableForGaming = (user.depositBalance || 0) + (user.winningBalance || 0) + (user.balance || 0);
    return res.status(400).json({
      error: `Insufficient Main Wallet balance! Total cost for ${qty} spin ticket(s) is ₹${totalCost.toFixed(2)} INR, but your Main Wallet Balance is ₹${availableForGaming.toFixed(2)} INR. Please deposit funds.`,
    });
  }

  user.spinCredits = (user.spinCredits || 0) + qty;

  state.transactions.unshift({
    id: `tx-spin-buy-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: user.id,
    userNodeId: user.nodeId,
    type: 'admin_adjust' as any,
    amount: -totalCost,
    status: 'completed',
    notes: `Purchased ${qty} Spin Ticket(s) (₹${totalCost.toFixed(2)} INR) from Main Wallet @ ₹${ticketPrice.toFixed(2)}/spin`,
    createdAt: new Date().toISOString(),
  });

  saveStore();
  res.json({
    success: true,
    message: `Successfully purchased ${qty} Spin Credit(s)!`,
    depositBalance: user.depositBalance,
    winningBalance: user.winningBalance,
    balance: user.balance,
    spinCredits: user.spinCredits,
    user,
  });
});

// 8bb. Play Wheel of Fortune (Evoplay style game)
app.post('/api/spin/play', (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'User not logged in' });

  const { betAmount = 100, isHighRisk = false, useSpinCredit = false } = req.body;
  const numBet = Math.max(1, Number(betAmount) || 100);

  if (useSpinCredit) {
    if ((user.spinCredits || 0) <= 0) {
      return res.status(400).json({ error: 'No free spin credits available!' });
    }
    user.spinCredits -= 1;
    user.lastSpinAt = new Date().toISOString();
  } else {
    // Deduct bet from user gaming balance
    if (!deductBetBalance(user, numBet)) {
      const totalAvail = (user.depositBalance || 0) + (user.winningBalance || 0) + (user.balance || 0);
      return res.status(400).json({
        error: `Insufficient balance! Bet amount: ₹${numBet.toFixed(2)}. Available: ₹${totalAvail.toFixed(2)}`,
      });
    }
    state.transactions.unshift({
      id: `tx-wheel-bet-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: user.id,
      userNodeId: user.nodeId,
      type: 'wheel_bet',
      amount: numBet,
      status: 'completed',
      notes: `🎡 Wheel of Fortune Bet (${isHighRisk ? 'High Risk' : 'Standard'}) - ₹${numBet.toFixed(2)}`,
      createdAt: new Date().toISOString(),
    });
  }

  const rand = Math.random();
  let selectedType: 'chest' | 'pink_diamond' | 'blue_diamond' | 'respin' = 'pink_diamond';
  let sliceIndex = 1;
  let baseMultiplier = 2;

  if (isHighRisk) {
    if (rand < 0.04) {
      selectedType = 'chest';
      sliceIndex = 0;
      baseMultiplier = 40;
    } else if (rand < 0.08) {
      selectedType = 'respin';
      sliceIndex = 8;
      baseMultiplier = 1;
    } else if (rand < 0.54) {
      selectedType = 'pink_diamond';
      const pinkSlices = [1, 3, 5, 7, 10, 12, 14];
      sliceIndex = pinkSlices[Math.floor(Math.random() * pinkSlices.length)];
      baseMultiplier = 3;
    } else {
      selectedType = 'blue_diamond';
      const blueSlices = [2, 4, 6, 9, 11, 13, 15];
      sliceIndex = blueSlices[Math.floor(Math.random() * blueSlices.length)];
      baseMultiplier = 3;
    }
  } else {
    if (rand < 0.07) {
      selectedType = 'chest';
      sliceIndex = 0;
      baseMultiplier = 14;
    } else if (rand < 0.12) {
      selectedType = 'respin';
      sliceIndex = 8;
      baseMultiplier = 1;
    } else if (rand < 0.56) {
      selectedType = 'pink_diamond';
      const pinkSlices = [1, 3, 5, 7, 10, 12, 14];
      sliceIndex = pinkSlices[Math.floor(Math.random() * pinkSlices.length)];
      baseMultiplier = 2;
    } else {
      selectedType = 'blue_diamond';
      const blueSlices = [2, 4, 6, 9, 11, 13, 15];
      sliceIndex = blueSlices[Math.floor(Math.random() * blueSlices.length)];
      baseMultiplier = 2;
    }
  }

  const innerMultiplier = Math.random() < 0.35 ? 2 : 1;
  const isRespin = selectedType === 'respin';

  let totalPayout = 0;
  if (isRespin) {
    user.spinCredits = (user.spinCredits || 0) + 1;
  } else {
    totalPayout = numBet * baseMultiplier * (innerMultiplier === 2 ? 1 : 1);
  }

  if (totalPayout > 0) {
    user.winningBalance = (user.winningBalance || 0) + totalPayout;
    user.winningEarned = (user.winningEarned || 0) + totalPayout;
    user.spinEarned = (user.spinEarned || 0) + totalPayout;
    user.totalBetTurnover = (user.totalBetTurnover || 0) + numBet;

    state.transactions.unshift({
      id: `tx-wheel-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: user.id,
      userNodeId: user.nodeId,
      type: 'spin_reward',
      amount: totalPayout,
      status: 'completed',
      notes: `🎡 Wheel Win: ${selectedType === 'chest' ? 'Treasure Chest 👑' : selectedType === 'pink_diamond' ? 'Pink Diamond 💎' : 'Blue Diamond 🔷'} (${baseMultiplier}X) - Payout: ₹${totalPayout.toFixed(2)}`,
      createdAt: new Date().toISOString(),
    });
  }

  saveStore();
  return res.json({
    success: true,
    sliceIndex,
    type: selectedType,
    multiplier: baseMultiplier,
    innerMultiplier,
    isRespin,
    betAmount: numBet,
    payout: totalPayout,
    netWin: totalPayout - (useSpinCredit ? 0 : numBet),
    spinCredits: user.spinCredits,
    depositBalance: user.depositBalance,
    winningBalance: user.winningBalance,
    user,
  });
});

// 8cc. 777 Vegas Slot Machine Endpoint
app.post('/api/slot777/spin', (req: Request, res: Response) => {
  if (!isServerGameEnabled('slot777')) {
    return res.status(403).json({ error: '777 Vegas Slots is currently turned off by Admin.' });
  }
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'User not logged in' });

  const { betAmount = 100 } = req.body;
  const numBet = Math.max(10, Number(betAmount) || 100);

  if (!deductBetBalance(user, numBet)) {
    const totalAvail = (user.depositBalance || 0) + (user.winningBalance || 0) + (user.balance || 0);
    return res.status(400).json({
      error: `Insufficient balance! Bet amount: ₹${numBet.toFixed(2)}. Available: ₹${totalAvail.toFixed(2)}`,
    });
  }

  // Symbol pool with realistic weights:
  // seven (7️⃣): 7%
  // diamond (💎): 11%
  // bell (🔔): 14%
  // bar (🍫): 16%
  // cherry (🍒): 20%
  // lemon (🍋): 16%
  // clover (🍀): 16%
  const symbols = ['seven', 'diamond', 'bell', 'bar', 'cherry', 'lemon', 'clover'];
  const weights = [7, 11, 14, 16, 20, 16, 16];
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  const pickSymbol = () => {
    let r = Math.random() * totalWeight;
    for (let i = 0; i < symbols.length; i++) {
      if (r < weights[i]) return symbols[i];
      r -= weights[i];
    }
    return symbols[symbols.length - 1];
  };

  const reel1 = pickSymbol();
  const reel2 = pickSymbol();
  const reel3 = pickSymbol();
  const reels = [reel1, reel2, reel3];

  let multiplier = 0;
  let winTitle = '';

  // Check 3-of-a-kind jackpot
  if (reel1 === reel2 && reel2 === reel3) {
    if (reel1 === 'seven') {
      multiplier = 50;
      winTitle = '🔥 MEGA 777 JACKPOT! 50X';
    } else if (reel1 === 'diamond') {
      multiplier = 25;
      winTitle = '💎 TRIPLE DIAMOND WIN! 25X';
    } else if (reel1 === 'bell') {
      multiplier = 15;
      winTitle = '🔔 GOLDEN BELLS! 15X';
    } else if (reel1 === 'bar') {
      multiplier = 10;
      winTitle = '🍫 TRIPLE BAR WIN! 10X';
    } else if (reel1 === 'cherry') {
      multiplier = 8;
      winTitle = '🍒 CHERRY BONANZA! 8X';
    } else if (reel1 === 'lemon') {
      multiplier = 5;
      winTitle = '🍋 LEMON SPLASH! 5X';
    } else {
      multiplier = 3;
      winTitle = '🍀 LUCKY CLOVER! 3X';
    }
  } else if (
    (reel1 === reel2 && (reel1 === 'seven' || reel1 === 'diamond' || reel1 === 'bell')) ||
    (reel2 === reel3 && (reel2 === 'seven' || reel2 === 'diamond' || reel2 === 'bell')) ||
    (reel1 === reel3 && (reel1 === 'seven' || reel1 === 'diamond' || reel1 === 'bell'))
  ) {
    // 2 high value matches
    const matched = reel1 === reel2 ? reel1 : reel2 === reel3 ? reel2 : reel1;
    if (matched === 'seven') {
      multiplier = 4;
      winTitle = '77 DOUBLE SEVEN! 4X';
    } else if (matched === 'diamond') {
      multiplier = 3;
      winTitle = 'DOUBLE DIAMOND! 3X';
    } else {
      multiplier = 2;
      winTitle = 'DOUBLE BELLS! 2X';
    }
  } else if (reels.filter((s) => s === 'cherry').length === 2) {
    multiplier = 2;
    winTitle = 'DOUBLE CHERRY! 2X';
  } else if (reels.filter((s) => s === 'cherry').length === 1) {
    multiplier = 0.5;
    winTitle = 'SINGLE CHERRY! 0.5X';
  }

  state.transactions.unshift({
    id: `tx-slot777-bet-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: user.id,
    userNodeId: user.nodeId,
    type: 'slot777_bet',
    amount: numBet,
    status: 'completed',
    notes: `🎰 777 Vegas Slot Spin Bet [${reels.join('-')}] - ₹${numBet.toFixed(2)}`,
    createdAt: new Date().toISOString(),
  });

  const payout = numBet * multiplier;
  if (payout > 0) {
    user.winningBalance = (user.winningBalance || 0) + payout;
    user.winningEarned = (user.winningEarned || 0) + payout;
    user.totalBetTurnover = (user.totalBetTurnover || 0) + numBet;

    state.transactions.unshift({
      id: `tx-slot777-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: user.id,
      userNodeId: user.nodeId,
      type: 'slot777_win',
      amount: payout,
      status: 'completed',
      notes: `🎰 777 Slot Win: [${reels.join('-')}] ${winTitle} - Won ₹${payout.toFixed(2)}`,
      createdAt: new Date().toISOString(),
    });
  } else {
    user.totalBetTurnover = (user.totalBetTurnover || 0) + numBet;
  }

  saveStore();
  return res.json({
    success: true,
    reels,
    multiplier,
    winTitle,
    betAmount: numBet,
    payout,
    netWin: payout - numBet,
    depositBalance: user.depositBalance,
    winningBalance: user.winningBalance,
    user,
  });
});

// 8cd. 13-Card Indian Rummy Game Endpoint
app.post('/api/rummy/play', (req: Request, res: Response) => {
  if (!isServerGameEnabled('rummy')) {
    return res.status(403).json({ error: 'Indian Rummy is currently turned off by Admin.' });
  }
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'User not logged in' });

  const { stakeAmount = 100, action = 'declare', isPureWin = true } = req.body;
  const numStake = Math.max(10, Number(stakeAmount) || 100);

  if (!deductBetBalance(user, numStake)) {
    const totalAvail = (user.depositBalance || 0) + (user.winningBalance || 0) + (user.balance || 0);
    return res.status(400).json({
      error: `Insufficient balance! Table Stake: ₹${numStake.toFixed(2)}. Available: ₹${totalAvail.toFixed(2)}`,
    });
  }

  // 13-Card Rummy Table rules:
  // If player makes valid declaration (Pure sequence + Second sequence + Sets):
  // Table Pot = 2 Players * Stake = 2 * numStake
  // Platform fee (House margin): 5%
  // Net player win = 1.95 * numStake
  const houseMarginPercent = 5;
  const isWinner = isPureWin !== false;
  let payout = 0;

  state.transactions.unshift({
    id: `tx-rummy-bet-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: user.id,
    userNodeId: user.nodeId,
    type: 'rummy_bet',
    amount: numStake,
    status: 'completed',
    notes: `🃏 Indian Rummy Table Entry Stake - ₹${numStake.toFixed(2)}`,
    createdAt: new Date().toISOString(),
  });

  if (isWinner) {
    const grossPot = numStake * 2;
    payout = grossPot * (1 - houseMarginPercent / 100);
    user.winningBalance = (user.winningBalance || 0) + payout;
    user.winningEarned = (user.winningEarned || 0) + payout;
    user.totalBetTurnover = (user.totalBetTurnover || 0) + numStake;

    state.transactions.unshift({
      id: `tx-rummy-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: user.id,
      userNodeId: user.nodeId,
      type: 'rummy_win',
      amount: payout,
      status: 'completed',
      notes: `🃏 Rummy Table Winner! 13-Card Pure Show (Pot ₹${payout.toFixed(2)} credited)`,
      createdAt: new Date().toISOString(),
    });
  } else {
    user.totalBetTurnover = (user.totalBetTurnover || 0) + numStake;
  }

  saveStore();
  return res.json({
    success: true,
    isWinner,
    stakeAmount: numStake,
    payout,
    netWin: isWinner ? payout - numStake : -numStake,
    depositBalance: user.depositBalance,
    winningBalance: user.winningBalance,
    user,
  });
});

// 8ce. Chicken Road 3D Crash/Cross Game Endpoints
interface ChickenLaneSpot {
  lane: number; // 0: Left, 1: Center, 2: Right
  isTrap: boolean;
  multiplier: number;
}

interface ChickenRoadState {
  userId: string;
  betAmount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  currentStep: number;
  totalSteps: number;
  lanes: ChickenLaneSpot[][]; // 6 rows, each has 3 lanes [Left, Center, Right]
  currentMultiplier: number;
  status: 'active' | 'roasted' | 'cashed_out';
}

const activeChickenRounds = new Map<string, ChickenRoadState>();

const MULTIPLIER_TABLE = {
  easy: [
    [1.3, 1.5, 0.2], // row 1
    [1.8, 0.2, 2.2], // row 2
    [0.1, 2.5, 2.8], // row 3
    [3.2, 3.5, 0.1], // row 4
    [4.2, 0.1, 4.8], // row 5
    [6.0, 7.5, 0.1], // row 6 (before golden egg)
  ],
  medium: [
    [1.5, 2.0, 0.1],
    [0.2, 2.5, 3.0],
    [3.5, 0.1, 4.0],
    [0.1, 5.0, 5.5],
    [7.0, 0.1, 8.0],
    [10.0, 12.0, 0.1],
  ],
  hard: [
    [2.0, 0.1, 0.1],
    [0.1, 3.5, 0.1],
    [0.1, 0.1, 6.0],
    [9.0, 0.1, 0.1],
    [0.1, 15.0, 0.1],
    [25.0, 0.1, 0.1],
  ],
};

app.post('/api/chickenroad/start', (req: Request, res: Response) => {
  if (!isServerGameEnabled('chickenroad')) {
    return res.status(403).json({ error: 'Chicken Road is currently turned off by Admin.' });
  }
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'User not logged in' });

  const { betAmount = 100, difficulty = 'medium' } = req.body;
  const numBet = Math.max(10, Number(betAmount) || 100);
  const diff = (['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium') as 'easy' | 'medium' | 'hard';

  if (!deductBetBalance(user, numBet)) {
    const totalAvail = (user.depositBalance || 0) + (user.winningBalance || 0) + (user.balance || 0);
    return res.status(400).json({
      error: `Insufficient balance! Bet amount: ₹${numBet.toFixed(2)}. Available: ₹${totalAvail.toFixed(2)}`,
    });
  }

  const totalSteps = 6;
  const rawTable = MULTIPLIER_TABLE[diff];
  const lanes: ChickenLaneSpot[][] = [];

  for (let r = 0; r < totalSteps; r++) {
    const rowValues = [...rawTable[r]];
    // Randomly shuffle lanes [0, 1, 2] so red trap is unpredictably placed
    const shuffled: ChickenLaneSpot[] = [];
    const availableLanes = [0, 1, 2].sort(() => Math.random() - 0.5);

    availableLanes.forEach((laneIdx, i) => {
      const mult = rowValues[i];
      const isTrap = mult <= 0.3;
      shuffled.push({
        lane: laneIdx,
        isTrap,
        multiplier: mult,
      });
    });

    shuffled.sort((a, b) => a.lane - b.lane);
    lanes.push(shuffled);
  }

  const round: ChickenRoadState = {
    userId: user.id,
    betAmount: numBet,
    difficulty: diff,
    currentStep: 0,
    totalSteps,
    lanes,
    currentMultiplier: 1.0,
    status: 'active',
  };

  activeChickenRounds.set(user.id, round);
  user.totalBetTurnover = (user.totalBetTurnover || 0) + numBet;

  state.transactions.unshift({
    id: `tx-chicken-bet-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: user.id,
    userNodeId: user.nodeId,
    type: 'chickenroad_bet',
    amount: numBet,
    status: 'completed',
    notes: `🐔 Chicken Road Bet (${diff.toUpperCase()}) - ₹${numBet.toFixed(2)}`,
    createdAt: new Date().toISOString(),
  });

  saveStore();
  return res.json({
    success: true,
    roundId: `cr-${Date.now()}`,
    currentStep: 0,
    totalSteps,
    difficulty: diff,
    betAmount: numBet,
    lanes: lanes.map((row) => row.map((spot) => ({ lane: spot.lane, multiplier: spot.multiplier, isTrap: spot.isTrap }))),
    depositBalance: user.depositBalance,
    winningBalance: user.winningBalance,
    user,
  });
});

app.post('/api/chickenroad/step', (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'User not logged in' });

  const round = activeChickenRounds.get(user.id);
  if (!round || round.status !== 'active') {
    return res.status(400).json({ error: 'No active Chicken Road round. Start a new game!' });
  }

  const { laneIndex } = req.body;
  const chosenLane = laneIndex !== undefined ? Number(laneIndex) : 1; // default center

  const currentRowSpots = round.lanes[round.currentStep];
  if (!currentRowSpots) {
    return res.status(400).json({ error: 'Invalid step' });
  }

  const chosenSpot = currentRowSpots.find((s) => s.lane === chosenLane) || currentRowSpots[0];

  if (chosenSpot.isTrap) {
    round.status = 'roasted';
    activeChickenRounds.delete(user.id);

    return res.json({
      success: true,
      isTrap: true,
      roasted: true,
      step: round.currentStep + 1,
      multiplier: chosenSpot.multiplier,
      chosenLane,
      message: '🍗 Oh no! Chicken hit a trap car/red egg!',
    });
  }

  // Safe green egg!
  round.currentStep += 1;
  round.currentMultiplier = chosenSpot.multiplier;
  const cashoutAmount = parseFloat((round.betAmount * chosenSpot.multiplier).toFixed(2));
  const reachedFinish = round.currentStep >= round.totalSteps;

  if (reachedFinish) {
    // Reached the Finish line with the Giant Golden 10X Egg!
    const finishMultiplier = parseFloat((chosenSpot.multiplier * 2.0).toFixed(2)); // Extra Finish boost
    const finalPrize = parseFloat((round.betAmount * finishMultiplier).toFixed(2));

    round.status = 'cashed_out';
    user.winningBalance = (user.winningBalance || 0) + finalPrize;
    user.winningEarned = (user.winningEarned || 0) + finalPrize;

    state.transactions.unshift({
      id: `tx-chicken-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: user.id,
      userNodeId: user.nodeId,
      type: 'chickenroad_win',
      amount: finalPrize,
      status: 'completed',
      notes: `🐔 Chicken Road 10X GOLDEN EGG Finish! Won ₹${finalPrize.toFixed(2)} (${finishMultiplier}X)`,
      createdAt: new Date().toISOString(),
    });

    activeChickenRounds.delete(user.id);
    saveStore();

    return res.json({
      success: true,
      isTrap: false,
      roasted: false,
      currentStep: round.currentStep,
      multiplier: finishMultiplier,
      cashoutAmount: finalPrize,
      reachedFinish: true,
      chosenLane,
      user,
    });
  }

  return res.json({
    success: true,
    isTrap: false,
    roasted: false,
    currentStep: round.currentStep,
    multiplier: chosenSpot.multiplier,
    cashoutAmount,
    reachedFinish: false,
    chosenLane,
  });
});

app.post('/api/chickenroad/cashout', (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'User not logged in' });

  const round = activeChickenRounds.get(user.id);
  const clientStep = Math.max(0, Math.min(8, Number(req.body?.step || 0)));
  const clientMult = Math.max(1.0, Math.min(60, Number(req.body?.multiplier || 0)));

  if (!round || round.status !== 'active') {
    return res.status(400).json({ error: 'Cannot cash out. No active progress!' });
  }

  const effectiveStep = round.currentStep > 0 ? round.currentStep : clientStep;
  if (effectiveStep === 0) {
    return res.status(400).json({ error: 'Cannot cash out. Cross at least 1 lane first!' });
  }

  const multiplier = round.currentStep > 0 ? (round.currentMultiplier || 1.0) : (clientMult || 1.0);
  round.currentStep = effectiveStep;
  round.currentMultiplier = multiplier;
  const payout = parseFloat((round.betAmount * multiplier).toFixed(2));

  round.status = 'cashed_out';
  user.winningBalance = (user.winningBalance || 0) + payout;
  user.winningEarned = (user.winningEarned || 0) + payout;

  state.transactions.unshift({
    id: `tx-chicken-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: user.id,
    userNodeId: user.nodeId,
    type: 'chickenroad_win',
    amount: payout,
    status: 'completed',
    notes: `🐔 Chicken Road Cash Out: Lane ${round.currentStep}/${round.totalSteps} (${multiplier}X) - Won ₹${payout.toFixed(2)}`,
    createdAt: new Date().toISOString(),
  });

  activeChickenRounds.delete(user.id);
  saveStore();

  return res.json({
    success: true,
    payout,
    multiplier,
    currentStep: round.currentStep,
    depositBalance: user.depositBalance,
    winningBalance: user.winningBalance,
    user,
  });
});

// 8cf. Fantasy League Contest Entry / Investment Endpoint
app.post('/api/fantasy/join', (req: Request, res: Response) => {
  if (!isServerGameEnabled('cricket')) {
    return res.status(403).json({ error: 'Cricket Fantasy is currently turned off by Admin.' });
  }
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'User not logged in' });

  const { matchId, matchTitle, contestId, contestName, entryFee = 49, teamName } = req.body;
  const numFee = Math.max(0, Number(entryFee) || 0);

  if (numFee > 0 && !deductBetBalance(user, numFee)) {
    const totalAvail = (user.depositBalance || 0) + (user.winningBalance || 0) + (user.balance || 0);
    return res.status(400).json({
      error: `Insufficient balance! Contest Entry Fee: ₹${numFee.toFixed(2)}. Available Wallet Balance: ₹${totalAvail.toFixed(2)}. Please deposit funds to join!`,
      availableBalance: totalAvail,
      requiredFee: numFee,
    });
  }

  if (numFee > 0) {
    user.totalBetTurnover = (user.totalBetTurnover || 0) + numFee;
    state.transactions.unshift({
      id: `tx-fantasy-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: user.id,
      userNodeId: user.nodeId,
      type: 'fantasy_entry',
      amount: numFee,
      status: 'completed',
      notes: `🏏 Fantasy Contest Entry: ${matchTitle || 'Match'} (${contestName || 'Contest'}) - Entry Fee ₹${numFee} debited`,
      createdAt: new Date().toISOString(),
    });
  }

  saveStore();
  return res.json({
    success: true,
    message: `Successfully joined ${contestName}! ₹${numFee} invested.`,
    matchId,
    contestId,
    entryFee: numFee,
    user,
    depositBalance: user.depositBalance,
    winningBalance: user.winningBalance,
    balance: user.balance,
  });
});

// 8c. Daily Check-In with 1 Free Spin Claim
app.post('/api/daily-checkin', (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'User not logged in' });

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const lastCheckinDate = user.lastDailyCheckinAt ? new Date(user.lastDailyCheckinAt).toISOString().split('T')[0] : null;

  if (lastCheckinDate === todayStr) {
    // Calculate hours remaining until midnight UTC for next claim
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
    const hoursLeft = Math.max(1, Math.ceil((endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60)));
    return res.status(400).json({
      error: `You have already claimed today's Free Spin! Next daily check-in unlocks in ~${hoursLeft} hour(s).`,
      alreadyClaimed: true,
      lastDailyCheckinAt: user.lastDailyCheckinAt,
      streak: user.dailyCheckinStreak || 1,
    });
  }

  // Calculate Streak: If last checkin was yesterday, streak += 1, else reset to 1
  let currentStreak = 1;
  if (user.lastDailyCheckinAt) {
    const lastTime = new Date(user.lastDailyCheckinAt).getTime();
    const diffDays = Math.floor((now.getTime() - lastTime) / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) {
      currentStreak = (user.dailyCheckinStreak || 0) + 1;
    }
  }

  // Update checkin metadata (Registration is the only free spin source)
  user.lastDailyCheckinAt = now.toISOString();
  user.dailyCheckinStreak = currentStreak;

  state.transactions.unshift({
    id: `tx-checkin-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: user.id,
    userNodeId: user.nodeId,
    type: 'admin_adjust' as any,
    amount: 0,
    status: 'completed',
    notes: `📅 Daily Check-in Completed (Day ${currentStreak} Streak)`,
    createdAt: now.toISOString(),
  });

  saveStore();

  res.json({
    success: true,
    message: `🎉 Daily Check-In Recorded! Current ${currentStreak}-Day Streak active.`,
    spinCredits: user.spinCredits,
    streak: currentStreak,
    user,
  });
});

// 8d. Daily Top Bettor Tournament & Live Total Pot / Participant Counter API
app.get('/api/tournament/daily', (req: Request, res: Response) => {
  const currentUser = getUserFromReq(req);
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0)).toISOString();

  // Aggregate bets placed across Color Prediction, Dragon Tiger, and Aviator
  ensureColorPredictionState();
  ensureAviatorState();

  const cpBets = (state.colorPrediction?.bets || []);
  const dtBets = (dragonTigerBets || []);
  const avBets = (state.aviator?.bets || []);

  // Filter bets created today
  const isToday = (dateStr: string) => {
    try {
      return new Date(dateStr).toISOString().split('T')[0] === todayStr;
    } catch {
      return false;
    }
  };

  const todayCpBets = cpBets.filter((b) => isToday(b.createdAt));
  const todayDtBets = dtBets.filter((b) => isToday(b.createdAt));
  const todayAvBets = avBets.filter((b) => isToday(b.createdAt));

  // Map aggregates by user
  const userWagers: Record<string, {
    userId: string;
    userNodeId: string;
    userName: string;
    totalWagered: number;
    betsCount: number;
    totalWon: number;
  }> = {};

  const addBet = (userId: string, userNodeId: string, userName: string, amount: number, wonAmount: number) => {
    if (!userWagers[userId]) {
      userWagers[userId] = {
        userId,
        userNodeId: userNodeId || 'NODE',
        userName: userName || 'Trader',
        totalWagered: 0,
        betsCount: 0,
        totalWon: 0,
      };
    }
    userWagers[userId].totalWagered += amount;
    userWagers[userId].betsCount += 1;
    userWagers[userId].totalWon += wonAmount;
  };

  todayCpBets.forEach((b) => addBet(b.userId, b.userNodeId, b.userName, b.totalBet || b.amount, b.payout || 0));
  todayDtBets.forEach((b) => addBet(b.userId, b.userNodeId, b.userName, b.amount, b.payout || 0));
  todayAvBets.forEach((b) => addBet(b.userId, b.userNodeId, b.userName, b.amount, b.payout || 0));

  // Also include users who have total turnover recorded today or overall active top players
  state.users.forEach((u) => {
    if ((u.totalBetTurnover || 0) > 0 && !userWagers[u.id]) {
      userWagers[u.id] = {
        userId: u.id,
        userNodeId: u.nodeId,
        userName: u.name,
        totalWagered: Math.min(u.totalBetTurnover || 0, 5000),
        betsCount: Math.max(1, Math.floor((u.totalBetTurnover || 0) / 100)),
        totalWon: u.winningEarned || 0,
      };
    }
  });

  const participantList = Object.values(userWagers);
  const totalWagerVolume = participantList.reduce((sum, p) => sum + p.totalWagered, 0);
  const totalBetsPlaced = participantList.reduce((sum, p) => sum + p.betsCount, 0);
  const participantCount = participantList.length;

  // Dynamic Pot Calculation from system settings (INR)
  const tConfig = state.settings.dailyTournament || {
    enabled: true,
    basePot: 25000.0,
    turnoverContributionPercent: 5.0,
    minWagerToQualify: 500.0,
    title: 'Daily Top Bettor Championship 🏆',
    prizeDistribution: [
      { rank: 1, percent: 40 },
      { rank: 2, percent: 25 },
      { rank: 3, percent: 15 },
      { rank: 4, percent: 6 },
      { rank: 5, percent: 6 },
      { rank: 6, percent: 2 },
      { rank: 7, percent: 2 },
      { rank: 8, percent: 2 },
      { rank: 9, percent: 1 },
      { rank: 10, percent: 1 },
    ],
  };

  const basePot = typeof tConfig.basePot === 'number' ? tConfig.basePot : parseFloat(tConfig.basePot as any) || 25000.0;
  const turnoverPercent = typeof tConfig.turnoverContributionPercent === 'number' ? tConfig.turnoverContributionPercent : parseFloat(tConfig.turnoverContributionPercent as any) || 5.0;
  const turnoverContribution = totalWagerVolume * (turnoverPercent / 100);
  const totalPot = parseFloat((basePot + turnoverContribution).toFixed(2));
  const minWager = typeof tConfig.minWagerToQualify === 'number' ? tConfig.minWagerToQualify : parseFloat(tConfig.minWagerToQualify as any) || 0;

  // Prize distribution percentages dynamically loaded from settings
  const defaultBreakdown = [
    { rank: 1, percent: 40 },
    { rank: 2, percent: 25 },
    { rank: 3, percent: 15 },
    { rank: 4, percent: 6 },
    { rank: 5, percent: 6 },
    { rank: 6, percent: 2 },
    { rank: 7, percent: 2 },
    { rank: 8, percent: 2 },
    { rank: 9, percent: 1 },
    { rank: 10, percent: 1 },
  ];
  const configuredTiers = (tConfig.prizeDistribution && tConfig.prizeDistribution.length > 0) ? tConfig.prizeDistribution : defaultBreakdown;
  const prizeBreakdown = configuredTiers.map((pb) => ({
    rank: pb.rank,
    percent: pb.percent,
    minPrize: parseFloat((totalPot * (pb.percent / 100)).toFixed(2)),
  }));

  // Sort descending by total wagered
  participantList.sort((a, b) => b.totalWagered - a.totalWagered);

  const leaderboard: any[] = participantList.slice(0, 20).map((p, idx) => {
    const rank = idx + 1;
    const prizeConfig = prizeBreakdown.find((pb) => pb.rank === rank);
    const meetsMin = p.totalWagered >= minWager;
    const projectedPrize = (prizeConfig && meetsMin) ? parseFloat((totalPot * (prizeConfig.percent / 100)).toFixed(2)) : 0;
    let badge = 'Participant';
    if (rank === 1) badge = '👑 Champion (#1)';
    else if (rank === 2) badge = '🥈 Runner Up (#2)';
    else if (rank === 3) badge = '🥉 3rd Place (#3)';
    else if (rank <= 10) badge = '🎖️ Top 10 Winner';

    return {
      rank,
      userId: p.userId,
      userNodeId: p.userNodeId,
      userName: p.userName,
      totalWagered: parseFloat(p.totalWagered.toFixed(2)),
      betsCount: p.betsCount,
      totalWon: parseFloat(p.totalWon.toFixed(2)),
      projectedPrize,
      badge,
      qualified: meetsMin,
    };
  });

  // Current user's individual stats
  let userStats = {
    rank: null as number | null,
    totalWagered: 0,
    betsCount: 0,
    projectedPrize: 0,
    qualified: false,
  };

  if (currentUser) {
    const userIndex = participantList.findIndex((p) => p.userId === currentUser.id);
    if (userIndex !== -1) {
      const uRank = userIndex + 1;
      const prizeConfig = prizeBreakdown.find((pb) => pb.rank === uRank);
      const userWagered = parseFloat(participantList[userIndex].totalWagered.toFixed(2));
      const meetsMin = userWagered >= minWager;
      userStats = {
        rank: uRank,
        totalWagered: userWagered,
        betsCount: participantList[userIndex].betsCount,
        projectedPrize: (prizeConfig && meetsMin) ? parseFloat((totalPot * (prizeConfig.percent / 100)).toFixed(2)) : 0,
        qualified: meetsMin,
      };
    }
  }

  res.json({
    success: true,
    tournament: {
      tournamentId: `TOURNAMENT-${todayStr}`,
      date: todayStr,
      title: tConfig.title || 'Daily Top Bettor Championship 🏆',
      enabled: tConfig.enabled !== false,
      basePot,
      turnoverContributionPercent: turnoverPercent,
      minWagerToQualify: minWager,
      totalPot,
      participantCount,
      totalBetsPlaced,
      totalWagerVolume: parseFloat(totalWagerVolume.toFixed(2)),
      endsAt: endOfDay,
      prizeBreakdown,
      leaderboard,
      userStats,
    },
  });
});

// Admin Route: Distribute Tournament Prize Pool
app.post('/api/admin/tournament/distribute', (req: Request, res: Response) => {
  try {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    ensureColorPredictionState();
    ensureAviatorState();

    const isToday = (dateStr: string) => {
      try {
        return new Date(dateStr).toISOString().split('T')[0] === todayStr;
      } catch {
        return false;
      }
    };

    const cpBets = (state.colorPrediction?.bets || []).filter((b) => isToday(b.createdAt));
    const dtBets = (dragonTigerBets || []).filter((b) => isToday(b.createdAt));
    const avBets = (state.aviator?.bets || []).filter((b) => isToday(b.createdAt));

    const userWagers: Record<string, { userId: string; userNodeId: string; userName: string; totalWagered: number }> = {};
    const addBet = (userId: string, userNodeId: string, userName: string, amount: number) => {
      if (!userWagers[userId]) {
        userWagers[userId] = { userId, userNodeId: userNodeId || 'NODE', userName: userName || 'Trader', totalWagered: 0 };
      }
      userWagers[userId].totalWagered += amount;
    };

    cpBets.forEach((b) => addBet(b.userId, b.userNodeId, b.userName, b.totalBet || b.amount));
    dtBets.forEach((b) => addBet(b.userId, b.userNodeId, b.userName, b.amount));
    avBets.forEach((b) => addBet(b.userId, b.userNodeId, b.userName, b.amount));

    state.users.forEach((u) => {
      if ((u.totalBetTurnover || 0) > 0 && !userWagers[u.id]) {
        userWagers[u.id] = { userId: u.id, userNodeId: u.nodeId, userName: u.name, totalWagered: Math.min(u.totalBetTurnover || 0, 5000) };
      }
    });

    const participantList = Object.values(userWagers);
    const totalWagerVolume = participantList.reduce((sum, p) => sum + p.totalWagered, 0);

    const tConfig = state.settings.dailyTournament || defaultSettings.dailyTournament!;
    const basePot = typeof tConfig.basePot === 'number' ? tConfig.basePot : parseFloat(tConfig.basePot as any) || 25000.0;
    const turnoverPercent = typeof tConfig.turnoverContributionPercent === 'number' ? tConfig.turnoverContributionPercent : parseFloat(tConfig.turnoverContributionPercent as any) || 5.0;
    const minWager = typeof tConfig.minWagerToQualify === 'number' ? tConfig.minWagerToQualify : parseFloat(tConfig.minWagerToQualify as any) || 0;
    const totalPot = parseFloat((basePot + (totalWagerVolume * (turnoverPercent / 100))).toFixed(2));

    participantList.sort((a, b) => b.totalWagered - a.totalWagered);

    const configuredTiers = (tConfig.prizeDistribution && tConfig.prizeDistribution.length > 0) ? tConfig.prizeDistribution : [
      { rank: 1, percent: 40 },
      { rank: 2, percent: 25 },
      { rank: 3, percent: 15 },
      { rank: 4, percent: 6 },
      { rank: 5, percent: 6 },
      { rank: 6, percent: 2 },
      { rank: 7, percent: 2 },
      { rank: 8, percent: 2 },
      { rank: 9, percent: 1 },
      { rank: 10, percent: 1 },
    ];

    const payoutResults: any[] = [];
    let totalDistributed = 0;

    configuredTiers.forEach((tier) => {
      const idx = tier.rank - 1;
      if (idx < participantList.length) {
        const participant = participantList[idx];
        if (participant.totalWagered >= minWager) {
          const prizeAmt = parseFloat((totalPot * (tier.percent / 100)).toFixed(2));
          if (prizeAmt > 0) {
            const user = state.users.find((u) => u.id === participant.userId);
            if (user) {
              user.winningBalance = (user.winningBalance || 0) + prizeAmt;
              user.winningEarned = (user.winningEarned || 0) + prizeAmt;
              user.totalEarned = (user.totalEarned || 0) + prizeAmt;

              state.transactions.unshift({
                id: `tx-tourn-${Date.now()}-${tier.rank}`,
                userId: user.id,
                userNodeId: user.nodeId,
                type: 'winning_reward' as any,
                amount: prizeAmt,
                status: 'completed',
              notes: `🏆 Daily Top Bettor Tournament #${tier.rank} Place Reward (${tier.percent}% of ₹${totalPot} Pot: ₹${prizeAmt.toFixed(2)} INR credited to Game Winning Wallet)`,
              createdAt: new Date().toISOString(),
            });

            payoutResults.push({
              rank: tier.rank,
              userId: user.id,
              nodeId: user.nodeId,
              name: user.name,
              wagered: participant.totalWagered,
              prizeAmount: prizeAmt,
            });

              totalDistributed += prizeAmt;
            }
          }
        }
      }
    });

  saveStore();

  res.json({
    success: true,
    message: `Successfully distributed ₹${totalDistributed.toFixed(2)} INR to ${payoutResults.length} tournament champions!`,
    totalDistributed,
    winners: payoutResults,
  });
  } catch (err: any) {
    console.error('Error distributing tournament rewards:', err);
    res.status(500).json({ error: err.message || 'Failed to distribute tournament rewards' });
  }
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
  if (!isSelfPkgOk) reasons.push(`Requires active package of ₹${minSelfPkgPrice.toLocaleString('en-IN')}+ (Current: ₹${userSelfPkgPrice.toLocaleString('en-IN')})`);
  if (!isDirectsOk) reasons.push(`Requires ${reqDirects} direct sponsors (Current: ${directsCount})`);
  if (!isSamePkgCountOk) reasons.push(`Requires ${reqSamePkgCount} team members with ₹${reqPkgPriceThreshold.toLocaleString('en-IN')}+ package up to Level ${maxDepth || 'All'} (Current: ${samePkgCount})`);
  if (!isTeamVolOk) reasons.push(`Requires ₹${reqVol.toLocaleString('en-IN')} team volume (Current: ₹${user.teamVolume.toLocaleString('en-IN')})`);

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
    notes: `Leadership Rank Reward Claimed: ${rank.name} (${rank.rewardTitle || `₹${rank.bonusUsdt.toLocaleString('en-IN')} INR`})`,
    createdAt: new Date().toISOString(),
  });

  saveStore();
  res.json({ success: true, user, rank });
});

function ensureLuckyDrawPrizes() {
  if (!state.luckyDraw) {
    state.luckyDraw = { ...initialLuckyDraw };
  }

  if (state.luckyDraw.ticketPrice === undefined || state.luckyDraw.ticketPrice === null || isNaN(Number(state.luckyDraw.ticketPrice))) {
    state.luckyDraw.ticketPrice = state.settings?.luckyDraw?.ticketPrice !== undefined ? Number(state.settings.luckyDraw.ticketPrice) : 100;
  }
  if (state.luckyDraw.prizeAmount === undefined || state.luckyDraw.prizeAmount === null || isNaN(Number(state.luckyDraw.prizeAmount))) {
    state.luckyDraw.prizeAmount = state.settings?.luckyDraw?.prizeAmount !== undefined ? Number(state.settings.luckyDraw.prizeAmount) : 25000;
  }
  if (state.luckyDraw.secondPrizeAmount === undefined || state.luckyDraw.secondPrizeAmount === null || isNaN(Number(state.luckyDraw.secondPrizeAmount))) {
    state.luckyDraw.secondPrizeAmount = state.settings?.luckyDraw?.secondPrizeAmount !== undefined ? Number(state.settings.luckyDraw.secondPrizeAmount) : 10000;
  }
  if (state.luckyDraw.thirdPrizeAmount === undefined || state.luckyDraw.thirdPrizeAmount === null || isNaN(Number(state.luckyDraw.thirdPrizeAmount))) {
    state.luckyDraw.thirdPrizeAmount = state.settings?.luckyDraw?.thirdPrizeAmount !== undefined ? Number(state.settings.luckyDraw.thirdPrizeAmount) : 5000;
  }
  if (state.luckyDraw.fourthPrizeAmount === undefined || state.luckyDraw.fourthPrizeAmount === null || isNaN(Number(state.luckyDraw.fourthPrizeAmount))) {
    state.luckyDraw.fourthPrizeAmount = state.settings?.luckyDraw?.fourthPrizeAmount !== undefined ? Number(state.settings.luckyDraw.fourthPrizeAmount) : 2500;
  }
  if (state.luckyDraw.fifthPrizeAmount === undefined || state.luckyDraw.fifthPrizeAmount === null || isNaN(Number(state.luckyDraw.fifthPrizeAmount))) {
    state.luckyDraw.fifthPrizeAmount = state.settings?.luckyDraw?.fifthPrizeAmount !== undefined ? Number(state.settings.luckyDraw.fifthPrizeAmount) : 1500;
  }
  if (state.luckyDraw.guaranteedPrizeAmount === undefined || state.luckyDraw.guaranteedPrizeAmount === null || isNaN(Number(state.luckyDraw.guaranteedPrizeAmount))) {
    state.luckyDraw.guaranteedPrizeAmount = state.settings?.luckyDraw?.guaranteedPrizeAmount !== undefined ? Number(state.settings.luckyDraw.guaranteedPrizeAmount) : 500;
  }
  if (state.luckyDraw.currentDrawStep === undefined) state.luckyDraw.currentDrawStep = 0;
  if (!state.luckyDraw.drawnPrizes) state.luckyDraw.drawnPrizes = [];
  if (!state.luckyDraw.forcedPrizes) state.luckyDraw.forcedPrizes = {};

  if (state.settings) {
    state.settings.luckyDraw = {
      ticketPrice: state.luckyDraw.ticketPrice,
      prizeAmount: state.luckyDraw.prizeAmount,
      secondPrizeAmount: state.luckyDraw.secondPrizeAmount,
      thirdPrizeAmount: state.luckyDraw.thirdPrizeAmount,
      fourthPrizeAmount: state.luckyDraw.fourthPrizeAmount,
      fifthPrizeAmount: state.luckyDraw.fifthPrizeAmount,
      guaranteedPrizeAmount: state.luckyDraw.guaranteedPrizeAmount,
      forcedPrizes: state.luckyDraw.forcedPrizes,
    };
  }
}

// 10. Lucky Draw API Endpoints
app.get('/api/luckydraw', (req: Request, res: Response) => {
  if (!state.luckyDraw) {
    state.luckyDraw = initialLuckyDraw;
  }
  ensureLuckyDrawPrizes();

  if (state.luckyDraw.isRolling && state.luckyDraw.rollingStartedAt && Date.now() - state.luckyDraw.rollingStartedAt >= 12000) {
    state.luckyDraw.isRolling = false;
    if (state.luckyDraw.currentDrawStep === 5) {
      state.luckyDraw.status = 'completed';
    }
  }

  res.json({ success: true, luckyDraw: state.luckyDraw });
});

function getReservedLast5Digits(): string[] {
  if (!state.luckyDraw) return [];
  const set = new Set<string>();
  if (state.luckyDraw.reservedSeriesLast5 && /^\d{5}$/.test(state.luckyDraw.reservedSeriesLast5.trim())) {
    set.add(state.luckyDraw.reservedSeriesLast5.trim());
  }
  if (state.luckyDraw.forcedWinnerTicketNumber && /^\d{6}$/.test(state.luckyDraw.forcedWinnerTicketNumber.trim())) {
    set.add(state.luckyDraw.forcedWinnerTicketNumber.trim().slice(-5));
  }
  if (state.luckyDraw.forcedPrizes) {
    Object.values(state.luckyDraw.forcedPrizes).forEach((fp) => {
      if (fp?.ticketNumber && /^\d{6}$/.test(fp.ticketNumber.trim())) {
        set.add(fp.ticketNumber.trim().slice(-5));
      }
    });
  }
  return Array.from(set);
}

app.post('/api/luckydraw/buy', (req: Request, res: Response) => {
  if (!isServerGameEnabled('luckydraw')) {
    return res.status(403).json({ error: 'Lucky Draw is currently turned off by Admin.' });
  }
  const { userId, quantity, customNumbers } = req.body;
  const qty = parseInt(quantity) || 1;
  const reqUserId = userId || (req.headers['x-user-id'] as string);
  const user = (reqUserId && state.users.find((u) => u.id === reqUserId || u.nodeId.toLowerCase() === reqUserId.toLowerCase()))
               || getUserFromReq(req)
               || state.users.find((u) => u.id === state.activeUserId)
               || state.users[0];

  if (!user) return res.status(400).json({ error: 'User not found' });
  if (!state.luckyDraw) state.luckyDraw = initialLuckyDraw;

  const ticketPrice = state.luckyDraw.ticketPrice ?? 100;
  const totalCost = ticketPrice * qty;

  const reservedLast5 = getReservedLast5Digits();

  const existingTicketNumbers = new Set((state.luckyDraw.tickets || []).map((t) => t.ticketNumber));

  // Validate custom numbers if supplied
  const chosenNumbers: string[] = Array.isArray(customNumbers) ? customNumbers : [];
  for (const num of chosenNumbers) {
    if (num && !/^\d{6}$/.test(num)) {
      return res.status(400).json({ error: `Invalid coupon number '${num}'. Must be exactly 6 digits (000000 to 999999).` });
    }
    if (num && existingTicketNumbers.has(num)) {
      return res.status(400).json({ error: `Coupon #${num} is already purchased! Please select a different 6-digit number.` });
    }
    if (num && reservedLast5.some((last5) => num.endsWith(last5))) {
      return res.status(400).json({
        error: `Coupon #${num} belongs to an Admin Reserved Series. This series is under strict Admin Control and cannot be picked manually by users!`
      });
    }
  }

  // Deduct from depositBalance prioritizing Deposit Wallet, Winning Wallet, then Main Wallet
  if (!deductBetBalance(user, totalCost)) {
    const totalAvail = (user.depositBalance || 0) + (user.winningBalance || 0) + (user.balance || 0);
    return res.status(400).json({
      error: `Insufficient balance! Total cost: ₹${totalCost} INR. (Available: ₹${totalAvail.toFixed(2)} INR)`,
    });
  }

  const newTickets: LuckyDrawTicket[] = [];

  for (let i = 0; i < qty; i++) {
    let ticketNum = chosenNumbers[i];
    if (!ticketNum) {
      // Auto-generate unique 6-digit number avoiding reserved series
      let attempts = 0;
      do {
        ticketNum = Math.floor(100000 + Math.random() * 900000).toString();
        attempts++;
      } while (
        (existingTicketNumbers.has(ticketNum) || reservedLast5.some((last5) => ticketNum.endsWith(last5))) &&
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
    notes: `Purchased ${qty} Lucky Draw Coupon(s) (₹${ticketPrice} INR each): ${newTickets.map((t) => '#' + t.ticketNumber).join(', ')}`,
    createdAt: new Date().toISOString(),
  });

  // 1. Distribute 10% Direct Seller Bonus (ONLY FOR LUCKY DRAW LOTTERY)
  if (user.sponsorId) {
    const sponsor = state.users.find((u) => u.id === user.sponsorId || u.nodeId === user.sponsorId);
    if (sponsor) {
      const directSellerBonus = Number((totalCost * 0.10).toFixed(2)); // 10% Direct Sales Commission for Lottery
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
          notes: `🎯 10% Direct Seller Bonus (₹${directSellerBonus.toFixed(2)} INR) for sponsoring ${user.name}'s Lucky Draw Lottery Ticket purchase (₹${totalCost.toFixed(2)})`,
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
    fourthPrizeAmount,
    fifthPrizeAmount,
    guaranteedPrizeAmount,
    targetEndTime,
    status,
    forcedWinnerUserId,
    forcedWinnerTicketNumber,
    forcedSecondWinnerUserId,
    forcedSecondWinnerTicketNumber,
    forcedPrizes,
    title,
    description,
  } = req.body;

  if (!state.luckyDraw) state.luckyDraw = initialLuckyDraw;
  ensureLuckyDrawPrizes();

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
  if (fourthPrizeAmount !== undefined && fourthPrizeAmount !== null && fourthPrizeAmount !== '' && !isNaN(Number(fourthPrizeAmount))) {
    state.luckyDraw.fourthPrizeAmount = Math.max(0, Number(fourthPrizeAmount));
  }
  if (fifthPrizeAmount !== undefined && fifthPrizeAmount !== null && fifthPrizeAmount !== '' && !isNaN(Number(fifthPrizeAmount))) {
    state.luckyDraw.fifthPrizeAmount = Math.max(0, Number(fifthPrizeAmount));
  }
  if (guaranteedPrizeAmount !== undefined && guaranteedPrizeAmount !== null && guaranteedPrizeAmount !== '' && !isNaN(Number(guaranteedPrizeAmount))) {
    state.luckyDraw.guaranteedPrizeAmount = Math.max(0, Number(guaranteedPrizeAmount));
  }
  if (targetEndTime) state.luckyDraw.targetEndTime = targetEndTime;
  if (status) state.luckyDraw.status = status;
  if (title) state.luckyDraw.title = title;
  if (description !== undefined) state.luckyDraw.description = description;

  if (forcedPrizes && typeof forcedPrizes === 'object') {
    state.luckyDraw.forcedPrizes = { ...state.luckyDraw.forcedPrizes, ...forcedPrizes };
  }

  state.luckyDraw.forcedWinnerUserId = forcedWinnerUserId || null;
  state.luckyDraw.forcedWinnerTicketNumber = forcedWinnerTicketNumber || null;
  state.luckyDraw.forcedSecondWinnerUserId = forcedSecondWinnerUserId || null;
  state.luckyDraw.forcedSecondWinnerTicketNumber = forcedSecondWinnerTicketNumber || null;

  if (req.body.reservedSeriesLast5 !== undefined) {
    state.luckyDraw.reservedSeriesLast5 = req.body.reservedSeriesLast5 || null;
  } else if (forcedWinnerTicketNumber && /^\d{6}$/.test(forcedWinnerTicketNumber)) {
    state.luckyDraw.reservedSeriesLast5 = forcedWinnerTicketNumber.slice(-5);
  }

  if (state.settings) {
    state.settings.luckyDraw = {
      ticketPrice: state.luckyDraw.ticketPrice,
      prizeAmount: state.luckyDraw.prizeAmount,
      secondPrizeAmount: state.luckyDraw.secondPrizeAmount,
      thirdPrizeAmount: state.luckyDraw.thirdPrizeAmount,
      fourthPrizeAmount: state.luckyDraw.fourthPrizeAmount,
      fifthPrizeAmount: state.luckyDraw.fifthPrizeAmount,
      guaranteedPrizeAmount: state.luckyDraw.guaranteedPrizeAmount,
      forcedPrizes: state.luckyDraw.forcedPrizes,
    };
  }

  saveStore();
  res.json({ success: true, luckyDraw: state.luckyDraw, settings: state.settings });
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

  // VIP Tiers Matrix (Pure INR)
  const vipTiers = [
    { level: 'VIP 1 Agent', minPlayers: 5, dailyBonusUsdt: 150, dailyBonusInr: 150 },
    { level: 'VIP 2 Agent', minPlayers: 15, dailyBonusUsdt: 500, dailyBonusInr: 500 },
    { level: 'VIP 3 Agent', minPlayers: 50, dailyBonusUsdt: 2000, dailyBonusInr: 2000 },
    { level: 'VIP 4 Agent', minPlayers: 200, dailyBonusUsdt: 10000, dailyBonusInr: 10000 },
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
    .slice(0, 50);

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
  ensureLuckyDrawPrizes();

  const {
    step, // optional step (1, 2, 3, 4, 5) or auto next step
    forcedWinnerUserId,
    forcedWinnerTicketNumber,
    forcedPrizes,
    prizeAmount,
    secondPrizeAmount,
    thirdPrizeAmount,
    fourthPrizeAmount,
    fifthPrizeAmount,
    guaranteedPrizeAmount,
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
  if (fourthPrizeAmount !== undefined && fourthPrizeAmount !== null && fourthPrizeAmount !== '' && !isNaN(Number(fourthPrizeAmount))) {
    state.luckyDraw.fourthPrizeAmount = Math.max(0, Number(fourthPrizeAmount));
  }
  if (fifthPrizeAmount !== undefined && fifthPrizeAmount !== null && fifthPrizeAmount !== '' && !isNaN(Number(fifthPrizeAmount))) {
    state.luckyDraw.fifthPrizeAmount = Math.max(0, Number(fifthPrizeAmount));
  }
  if (guaranteedPrizeAmount !== undefined && guaranteedPrizeAmount !== null && guaranteedPrizeAmount !== '' && !isNaN(Number(guaranteedPrizeAmount))) {
    state.luckyDraw.guaranteedPrizeAmount = Math.max(0, Number(guaranteedPrizeAmount));
  }

  if (forcedPrizes && typeof forcedPrizes === 'object') {
    state.luckyDraw.forcedPrizes = { ...state.luckyDraw.forcedPrizes, ...forcedPrizes };
  }

  // Determine which prize step to draw (1 to 5)
  let currentStep = Number(step);
  if (!currentStep || isNaN(currentStep) || currentStep < 1 || currentStep > 5) {
    const prevStep = state.luckyDraw.currentDrawStep || 0;
    currentStep = prevStep >= 5 ? 1 : prevStep + 1;
  }

  // If starting round from step 1, clear previous round's drawn prizes
  if (currentStep === 1) {
    state.luckyDraw.drawnPrizes = [];
    state.luckyDraw.currentDrawStep = 0;
  }

  if (!state.luckyDraw.drawnPrizes) state.luckyDraw.drawnPrizes = [];

  // Prize rank configuration
  const prizeRankNames: { [key: number]: { name: string; amount: number; tierText: string } } = {
    1: { name: '1st Prize', amount: state.luckyDraw.prizeAmount ?? 25000, tierText: '1st Prize (6 Digits Match)' },
    2: { name: '2nd Prize', amount: state.luckyDraw.secondPrizeAmount ?? 10000, tierText: '2nd Prize (6 Digits Match)' },
    3: { name: '3rd Prize', amount: state.luckyDraw.thirdPrizeAmount ?? 5000, tierText: '3rd Prize (6 Digits Match)' },
    4: { name: '4th Prize', amount: state.luckyDraw.fourthPrizeAmount ?? 2500, tierText: '4th Prize (6 Digits Match)' },
    5: { name: '5th Prize', amount: state.luckyDraw.fifthPrizeAmount ?? 1500, tierText: '5th Prize (6 Digits Match)' },
  };

  const prizeConfig = prizeRankNames[currentStep];
  const alreadyDrawnTicketNumbers = new Set(state.luckyDraw.drawnPrizes.map((p) => p.ticketNumber));

  // Determine forced candidate for this step if any
  const forcedForStep = state.luckyDraw.forcedPrizes?.[String(currentStep) as '1' | '2' | '3' | '4' | '5'];
  const targetForcedTicket = forcedWinnerTicketNumber || forcedForStep?.ticketNumber || (currentStep === 1 ? state.luckyDraw.forcedWinnerTicketNumber : null);
  const targetForcedUser = forcedWinnerUserId || forcedForStep?.userId || (currentStep === 1 ? state.luckyDraw.forcedWinnerUserId : null);

  let drawnWinningNumber = '';
  let winningTicket: LuckyDrawTicket | null = null;

  // 1. If exact forced ticket number supplied
  if (targetForcedTicket && /^\d{6}$/.test(targetForcedTicket) && !alreadyDrawnTicketNumbers.has(targetForcedTicket)) {
    drawnWinningNumber = targetForcedTicket;
    winningTicket = state.luckyDraw.tickets.find((t) => t.ticketNumber === drawnWinningNumber) || null;
    if (!winningTicket && targetForcedUser) {
      const u = state.users.find((usr) => usr.id === targetForcedUser);
      if (u) {
        winningTicket = {
          id: `tkt-forced-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          ticketNumber: drawnWinningNumber,
          userId: u.id,
          userNodeId: u.nodeId,
          userName: u.name,
          purchasedAt: new Date().toISOString(),
          price: 0,
        };
        state.luckyDraw.tickets.push(winningTicket);
      }
    }
  }
  // 2. If forced user ID supplied
  else if (targetForcedUser) {
    const userTkts = state.luckyDraw.tickets.filter((t) => t.userId === targetForcedUser && !alreadyDrawnTicketNumbers.has(t.ticketNumber));
    if (userTkts.length > 0) {
      winningTicket = userTkts[Math.floor(Math.random() * userTkts.length)];
      drawnWinningNumber = winningTicket.ticketNumber;
    } else {
      // If selected user doesn't have an active ticket in the pool, generate one for them so they guaranteed win
      const u = state.users.find((usr) => usr.id === targetForcedUser);
      if (u) {
        let randNum = '';
        do {
          randNum = Math.floor(100000 + Math.random() * 900000).toString();
        } while (alreadyDrawnTicketNumbers.has(randNum) || state.luckyDraw.tickets.some((t) => t.ticketNumber === randNum));
        
        winningTicket = {
          id: `tkt-forced-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          ticketNumber: randNum,
          userId: u.id,
          userNodeId: u.nodeId,
          userName: u.name,
          purchasedAt: new Date().toISOString(),
          price: 0,
        };
        state.luckyDraw.tickets.push(winningTicket);
        drawnWinningNumber = randNum;
      }
    }
  }

  // 3. If no forced choice or forced choice not available, pick from remaining tickets in pool
  if (!drawnWinningNumber) {
    const availablePoolTickets = state.luckyDraw.tickets.filter((t) => !alreadyDrawnTicketNumbers.has(t.ticketNumber));
    if (availablePoolTickets.length > 0) {
      winningTicket = availablePoolTickets[Math.floor(Math.random() * availablePoolTickets.length)];
      drawnWinningNumber = winningTicket.ticketNumber;
    } else {
      // Generate unique random 6 digit number
      let randNum = '';
      do {
        randNum = Math.floor(100000 + Math.random() * 900000).toString();
      } while (alreadyDrawnTicketNumbers.has(randNum));
      drawnWinningNumber = randNum;
    }
  }

  // Create DrawnPrize record
  const drawnPrizeItem: DrawnPrizeTicket = {
    prizeRank: currentStep as 1 | 2 | 3 | 4 | 5,
    prizeName: prizeConfig.name,
    ticketNumber: drawnWinningNumber,
    drawnAt: new Date().toISOString(),
    userId: winningTicket?.userId || undefined,
    userNodeId: winningTicket?.userNodeId || undefined,
    userName: winningTicket?.userName || (winningTicket ? 'User' : undefined),
    prizeAmount: prizeConfig.amount,
  };

  // Add / replace in drawnPrizes list
  state.luckyDraw.drawnPrizes = state.luckyDraw.drawnPrizes.filter((p) => p.prizeRank !== currentStep);
  state.luckyDraw.drawnPrizes.push(drawnPrizeItem);
  state.luckyDraw.drawnPrizes.sort((a, b) => a.prizeRank - b.prizeRank);
  state.luckyDraw.currentDrawStep = currentStep;
  state.luckyDraw.lastWinningNumber = drawnWinningNumber;

  // Track new single winner for this step
  const stepWinnersList: LuckyDrawWinner[] = [];

  if (winningTicket) {
    const u = state.users.find((usr) => usr.id === winningTicket!.userId);
    if (u) {
      awardGameWin(u, prizeConfig.amount, `Lucky Draw Lottery (${prizeConfig.name})`);
      state.transactions.unshift({
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-step${currentStep}`,
        userId: u.id,
        userNodeId: u.nodeId,
        type: 'admin_adjust',
        amount: prizeConfig.amount,
        status: 'completed',
        notes: `🏆 ${prizeConfig.name} Winner of Lucky Draw Coupon #${winningTicket.ticketNumber} (₹${prizeConfig.amount.toLocaleString('en-IN')} INR to Winning Wallet)`,
        createdAt: new Date().toISOString(),
      });
    }

    const wRecord: LuckyDrawWinner = {
      id: `pwin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      drawTitle: state.luckyDraw.title,
      ticketNumber: winningTicket.ticketNumber,
      userId: winningTicket.userId,
      userNodeId: winningTicket.userNodeId,
      userName: winningTicket.userName,
      prizeAmount: prizeConfig.amount,
      prizeTier: prizeConfig.tierText,
      matchedDigits: 6,
      winningNumber: drawnWinningNumber,
      wonAt: new Date().toISOString(),
    };
    stepWinnersList.push(wRecord);
  }

  // If step === 5 (Final 5th prize drawn), calculate Guaranteed Prize Pool (45 winners: 5 main × 9 series)
  let guaranteedWinnersList: LuckyDrawWinner[] = [];
  if (currentStep === 5) {
    const guaranteedPrizeAmount = state.luckyDraw.guaranteedPrizeAmount ?? 500;
    const all5Drawn = state.luckyDraw.drawnPrizes;
    const mainDrawnTicketNumbers = new Set(all5Drawn.map((d) => d.ticketNumber));

    all5Drawn.forEach((mainPrize) => {
      const last5 = mainPrize.ticketNumber.slice(-5);
      const leadDigit = mainPrize.ticketNumber[0];

      // 9 other series: '0' to '9' except leadDigit
      for (let d = 0; d <= 9; d++) {
        const seriesChar = String(d);
        if (seriesChar === leadDigit) continue; // Skip main prize itself

        const candidateNum = `${seriesChar}${last5}`;
        // Find if any user holds this candidate coupon
        const matchingTkts = state.luckyDraw.tickets.filter((t) => t.ticketNumber === candidateNum);
        for (const tkt of matchingTkts) {
          const u = state.users.find((usr) => usr.id === tkt.userId);
          if (u) {
            awardGameWin(u, guaranteedPrizeAmount, `Lucky Draw Lottery (Guaranteed Prize Series ${seriesChar})`);
            state.transactions.unshift({
              id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-guaranteed`,
              userId: u.id,
              userNodeId: u.nodeId,
              type: 'admin_adjust',
              amount: guaranteedPrizeAmount,
              status: 'completed',
              notes: `🎁 Guaranteed Prize Winner: Coupon #${tkt.ticketNumber} matches 5 digits of ${mainPrize.prizeName} (#${mainPrize.ticketNumber}) (₹${guaranteedPrizeAmount} INR to Winning Wallet)`,
              createdAt: new Date().toISOString(),
            });
          }

          guaranteedWinnersList.push({
            id: `pwin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            drawTitle: state.luckyDraw.title,
            ticketNumber: tkt.ticketNumber,
            userId: tkt.userId,
            userNodeId: tkt.userNodeId,
            userName: tkt.userName,
            prizeAmount: guaranteedPrizeAmount,
            prizeTier: 'Guaranteed Prize (Last 5 Digits Match)',
            matchedDigits: 5,
            matchedPrizeNumber: mainPrize.ticketNumber,
            winningNumber: mainPrize.ticketNumber,
            wonAt: new Date().toISOString(),
          });
        }
      }
    });

    // Record past winners history
    if (!state.luckyDraw.pastWinners) state.luckyDraw.pastWinners = [];
    const allRoundWinners = [...state.luckyDraw.drawnPrizes.map((p) => {
      const matchedW = stepWinnersList.find((w) => w.ticketNumber === p.ticketNumber);
      return matchedW || {
        id: `pwin-${Date.now()}-${p.prizeRank}`,
        drawTitle: state.luckyDraw.title,
        ticketNumber: p.ticketNumber,
        userId: p.userId || '',
        userNodeId: p.userNodeId || '',
        userName: p.userName || 'Winner',
        prizeAmount: p.prizeAmount,
        prizeTier: `${p.prizeName} (6 Digits Match)`,
        matchedDigits: 6,
        winningNumber: p.ticketNumber,
        wonAt: p.drawnAt,
      };
    }), ...guaranteedWinnersList];

    state.luckyDraw.pastWinners.unshift(...allRoundWinners);

    // Reset tickets & schedule next week's draw
    state.luckyDraw.tickets = [];
    state.luckyDraw.targetEndTime = getNextSunday9PM();
    state.luckyDraw.lastDrawAt = new Date().toISOString();
    state.luckyDraw.status = 'completed';
  } else {
    state.luckyDraw.status = 'active';
  }

  state.luckyDraw.isRolling = true;
  state.luckyDraw.rollingStartedAt = Date.now();
  state.luckyDraw.rollingWinningNumber = drawnWinningNumber;
  state.luckyDraw.rollingPrizeRank = currentStep;
  state.luckyDraw.rollingWinners = [...stepWinnersList, ...guaranteedWinnersList];

  saveStore();
  res.json({
    success: true,
    step: currentStep,
    prizeName: prizeConfig.name,
    winningNumber: drawnWinningNumber,
    drawnPrizes: state.luckyDraw.drawnPrizes,
    winners: stepWinnersList,
    guaranteedWinners: guaranteedWinnersList,
    luckyDraw: state.luckyDraw,
  });
});

// Endpoint to reset round / reset draw steps (Admin feature)
app.post('/api/luckydraw/admin/reset-round', (req: Request, res: Response) => {
  if (!state.luckyDraw) state.luckyDraw = initialLuckyDraw;
  ensureLuckyDrawPrizes();
  state.luckyDraw.currentDrawStep = 0;
  state.luckyDraw.drawnPrizes = [];
  state.luckyDraw.isRolling = false;
  state.luckyDraw.status = 'active';
  saveStore();
  res.json({ success: true, message: 'Lucky Draw round reset. Ready for step 1!', luckyDraw: state.luckyDraw });
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
    history: cp.history.slice(0, 100),
    myBets: userBets,
  });
});

app.post('/api/color-prediction/bet', (req: Request, res: Response) => {
  if (!isServerGameEnabled('colorprediction')) {
    return res.status(403).json({ error: 'Color Win Go is currently turned off by Admin.' });
  }
  ensureColorPredictionState();
  const cp = state.colorPrediction;
  const user =
    getUserFromReq(req) ||
    (req.body?.userId && state.users.find((u) => u.id === req.body.userId || u.nodeId === req.body.userId)) ||
    state.users.find((u) => u.id === state.activeUserId) ||
    state.users[0];
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized. Please login to place a bet.' });
  }

  const elapsed = Math.floor((Date.now() - cp.startTime) / 1000);
  const remainingSeconds = Math.max(0, cp.periodDurationSeconds - elapsed);

  if (remainingSeconds <= 5) {
    return res.status(400).json({ error: 'Betting is frozen for the last 5 seconds of the round.' });
  }

  const { selection, amount, contractCount, amountInr, periodId } = req.body;
  const betInrUnit = Math.max(1, Number(amountInr || amount) || 1);
  const count = Math.max(1, Math.floor(Number(contractCount) || 1));
  const totalBetInr = betInrUnit * count;

  if (isNaN(totalBetInr) || totalBetInr <= 0) {
    return res.status(400).json({ error: 'Invalid bet amount.' });
  }

  // 1:1 Native INR Betting
  const totalBetLedger = Number(totalBetInr.toFixed(2));

  if (!deductBetBalance(user, totalBetLedger)) {
    const totalAvailInr = (user.depositBalance || 0) + (user.winningBalance || 0) + (user.balance || 0);
    return res.status(400).json({
      error: `Insufficient balance (₹${totalAvailInr.toFixed(2)} INR available). Please Recharge.`,
      availableInr: totalAvailInr,
      availableUsdt: totalAvailInr,
    });
  }

  const assignedPeriodId = periodId || cp.currentPeriodId;
  const newBet: ColorPredictionBet = {
    id: `bet-cp-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    userId: user.id,
    userName: user.name,
    userNodeId: user.nodeId,
    periodId: assignedPeriodId,
    selection,
    amount: betInrUnit,
    contractCount: count,
    totalBet: totalBetLedger,
    amountInr: totalBetInr,
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
    amount: totalBetLedger,
    status: 'completed',
    notes: `Win Go 1m Bet - Period #${assignedPeriodId} on [${String(selection).toUpperCase()}] (₹${totalBetInr.toFixed(2)} INR)`,
    createdAt: new Date().toISOString(),
  });

  // Distribute 5-Level Bet Turnover Commission to Uplines
  process5LevelBetTurnoverCommission(user, totalBetLedger, 'Win Go 1m Color Prediction');

  saveStore();

  res.json({
    success: true,
    message: `Bet placed successfully on ${String(selection).toUpperCase()} for ₹${totalBetInr.toFixed(2)} INR`,
    bet: newBet,
    totalBetInr,
    user,
  });
});

// Settle Win & Credit Winning Balance
app.post('/api/color-prediction/claim-win', (req: Request, res: Response) => {
  ensureColorPredictionState();
  const cp = state.colorPrediction;
  const user =
    getUserFromReq(req) ||
    (req.body?.userId && state.users.find((u) => u.id === req.body.userId || u.nodeId === req.body.userId)) ||
    state.users.find((u) => u.id === state.activeUserId);

  const { winAmountInr, periodId, betId } = req.body;
  const winInrNum = Number((Number(winAmountInr) || 0).toFixed(2));

  if (user && winInrNum > 0) {
    user.winningBalance = Number(((user.winningBalance || 0) + winInrNum).toFixed(2));
    user.totalEarned = Number(((user.totalEarned || 0) + winInrNum).toFixed(2));

    if (betId) {
      const foundBet = cp.bets.find((b) => b.id === betId);
      if (foundBet) {
        foundBet.status = 'won';
        foundBet.payout = winInrNum;
      }
    }

    state.transactions.unshift({
      id: `tx-cpwin-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: user.id,
      userNodeId: user.nodeId,
      type: 'bonus' as any,
      amount: winInrNum,
      status: 'completed',
      notes: `Win Go Profit Payout - Period #${periodId || 'Round'} (+₹${winInrNum.toFixed(2)} INR)`,
      createdAt: new Date().toISOString(),
    });

    saveStore();
  }

  res.json({ success: true, user });
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
  const totalStakes = currentBets.reduce((acc, b) => acc + b.totalBet, 0);
  const target40Payout = totalStakes * 0.40;

  const balancedCandidates = [...numberPayoutProjections].filter((p) => p.projectedPayout > 0 && p.projectedPayout <= totalStakes * 0.50);
  let projected6040Obj = lowestPayoutObj;
  if (balancedCandidates.length > 0) {
    balancedCandidates.sort((a, b) => Math.abs(a.projectedPayout - target40Payout) - Math.abs(b.projectedPayout - target40Payout));
    projected6040Obj = balancedCandidates[0];
  } else {
    const positiveCandidates = [...numberPayoutProjections].filter((p) => p.projectedPayout > 0).sort((a, b) => a.projectedPayout - b.projectedPayout);
    if (positiveCandidates.length > 0) {
      projected6040Obj = positiveCandidates[0];
    }
  }

  const stats = {
    totalStakes,
    greenStakes: currentBets.filter((b) => b.selection === 'green').reduce((acc, b) => acc + b.totalBet, 0),
    redStakes: currentBets.filter((b) => b.selection === 'red').reduce((acc, b) => acc + b.totalBet, 0),
    violetStakes: currentBets.filter((b) => b.selection === 'violet').reduce((acc, b) => acc + b.totalBet, 0),
    bigStakes: currentBets.filter((b) => b.selection === 'big').reduce((acc, b) => acc + b.totalBet, 0),
    smallStakes: currentBets.filter((b) => b.selection === 'small').reduce((acc, b) => acc + b.totalBet, 0),
    forcedNextNumber: cp.forcedNextNumber,
    adminMode: cp.adminMode || 'lowest_payout',
    projectedLowestNumber: lowestPayoutObj ? lowestPayoutObj.number : 0,
    projectedLowestPayout: lowestPayoutObj ? lowestPayoutObj.projectedPayout : 0,
    projected6040Number: projected6040Obj ? projected6040Obj.number : 0,
    projected6040Payout: projected6040Obj ? projected6040Obj.projectedPayout : 0,
    numberPayoutProjections,
    betsCount: currentBets.length,
    activeBets: currentBets,
  };

  res.json({ success: true, stats });
});

app.post('/api/admin/color-prediction/mode', (req: Request, res: Response) => {
  const auth = checkAdminPermission(req, 'canManageColorPrediction');
  if (!auth.allowed) return res.status(auth.status).json({ error: auth.error });

  ensureColorPredictionState();
  const cp = state.colorPrediction;
  const { mode } = req.body;

  if (!['lowest_payout', 'smart_retention_60_40', 'random', 'manual'].includes(mode)) {
    return res.status(400).json({ error: 'Invalid mode. Must be lowest_payout, smart_retention_60_40, random, or manual' });
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
  const auth = checkAdminPermission(req, 'canManageColorPrediction');
  if (!auth.allowed) return res.status(auth.status).json({ error: auth.error });

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
  const myBets = user ? av.bets.filter((b) => b.userId === user.id) : [];
  const myBet = myBets[0] || null;

  res.json({
    success: true,
    serverTime: Date.now(),
    state: av,
    myBet,
    myBets,
  });
});

app.post('/api/aviator/bet', (req: Request, res: Response) => {
  if (!isServerGameEnabled('aviator')) {
    return res.status(403).json({ error: 'Aviator Crash is currently turned off by Admin.' });
  }
  ensureAviatorState();
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'User not authenticated' });

  const av = state.aviator;
  if (av.status !== 'waiting' && (av.status !== 'flying' || av.currentMultiplier > 1.15)) {
    return res.status(400).json({ error: 'Betting is closed for this round. Please wait for next round.' });
  }

  const { amount, autoCashout, slot = 1 } = req.body;
  const numSlot = Number(slot) === 2 ? 2 : 1;

  const existingBet = av.bets.find((b) => b.userId === user.id && ((b as any).slot === numSlot || (!('slot' in b) && numSlot === 1)));
  if (existingBet) {
    return res.status(400).json({ error: `You already placed a bet on Panel ${numSlot} for this round!` });
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Invalid bet amount' });
  }

  if (!deductBetBalance(user, numAmount)) {
    const totalAvail = (user.depositBalance || 0) + (user.winningBalance || 0) + (user.balance || 0);
    return res.status(400).json({ error: `Insufficient wallet balance (₹${totalAvail.toFixed(2)} INR available).` });
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
  (newBet as any).slot = numSlot;

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
    notes: `Aviator Bet [Panel ${numSlot}] (${av.currentRoundId}) - ₹${numAmount.toFixed(2)} INR`,
    status: 'completed',
    createdAt: new Date().toISOString(),
  });

  // Distribute 5-Level Bet Turnover Commission
  process5LevelBetTurnoverCommission(user, numAmount, 'Aviator Game');

  saveStore();

  res.json({
    success: true,
    message: `Bet ₹${numAmount.toFixed(2)} placed on Panel ${numSlot}!`,
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

  const { slot, betId } = req.body || {};
  let bet: AviatorBet | undefined;

  if (betId) {
    bet = av.bets.find((b) => b.id === betId && b.userId === user.id && b.status === 'pending');
  } else if (slot) {
    const numSlot = Number(slot) === 2 ? 2 : 1;
    bet = av.bets.find((b) => b.userId === user.id && b.status === 'pending' && ((b as any).slot === numSlot || (!('slot' in b) && numSlot === 1)));
  }

  if (!bet) {
    bet = av.bets.find((b) => b.userId === user.id && b.status === 'pending');
  }

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
    message: `Cashed out at ${multiplier}x! Won ₹${payout.toFixed(2)} INR`,
    payout,
    multiplier,
    bet,
    user,
  });
});

// DRAGON VS TIGER API ENDPOINTS
const dragonTigerHistory: any[] = [];
const dragonTigerBets: any[] = [];
let dragonTigerAdminMode: 'lowest_payout' | 'smart_retention_60_40' | 'random' | 'manual' = 'smart_retention_60_40';
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

  const dragonPayout = dragonStakes * 2.0;
  const tigerPayout = tigerStakes * 2.0;
  const tiePayout = tieStakes * 8.0;

  const projections = [
    { winner: 'dragon' as const, payout: dragonPayout, stakes: dragonStakes },
    { winner: 'tiger' as const, payout: tigerPayout, stakes: tigerStakes },
    { winner: 'tie' as const, payout: tiePayout, stakes: tieStakes },
  ];

  const lowestPayoutObj = [...projections].sort((a, b) => a.payout - b.payout)[0];
  const target40Payout = totalStakes * 0.40;

  let projected6040Obj = lowestPayoutObj;
  const balancedCandidates = [...projections].filter((p) => p.payout > 0 && p.payout <= totalStakes * 0.60);
  if (balancedCandidates.length > 0) {
    balancedCandidates.sort((a, b) => Math.abs(a.payout - target40Payout) - Math.abs(b.payout - target40Payout));
    projected6040Obj = balancedCandidates[0];
  }

  res.json({
    success: true,
    stats: {
      adminMode: dragonTigerAdminMode,
      forcedWinner: dragonTigerForcedWinner,
      totalStakes,
      dragonStakes,
      tigerStakes,
      tieStakes,
      dragonPayout,
      tigerPayout,
      tiePayout,
      projectedLowestWinner: lowestPayoutObj ? lowestPayoutObj.winner : 'dragon',
      projectedLowestPayout: lowestPayoutObj ? lowestPayoutObj.payout : 0,
      projected6040Winner: projected6040Obj ? projected6040Obj.winner : 'dragon',
      projected6040Payout: projected6040Obj ? projected6040Obj.payout : 0,
      recentBetsCount: pendingBets.length,
    },
  });
});

app.post('/api/admin/dragon-tiger/mode', (req: Request, res: Response) => {
  const auth = checkAdminPermission(req, 'canManageDragonTiger');
  if (!auth.allowed) return res.status(auth.status).json({ error: auth.error });

  const { mode } = req.body;
  if (!['lowest_payout', 'smart_retention_60_40', 'random', 'manual'].includes(mode)) {
    return res.status(400).json({ error: 'Invalid mode. Must be lowest_payout, smart_retention_60_40, random, or manual' });
  }
  dragonTigerAdminMode = mode;
  if (mode !== 'manual') dragonTigerForcedWinner = null;
  saveStore();
  res.json({ success: true, message: `Dragon Tiger risk mode set to ${mode.toUpperCase()}`, adminMode: dragonTigerAdminMode });
});

app.post('/api/admin/dragon-tiger/force-result', (req: Request, res: Response) => {
  const auth = checkAdminPermission(req, 'canManageDragonTiger');
  if (!auth.allowed) return res.status(auth.status).json({ error: auth.error });

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
  if (!isServerGameEnabled('dragontiger')) {
    return res.status(403).json({ error: 'Dragon vs Tiger is currently turned off by Admin.' });
  }
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
    return res.status(400).json({ error: `Insufficient wallet balance (₹${totalAvail.toFixed(2)} INR available).` });
  }

  // Count user's previous Dragon Tiger bets for First 3 Losses 50% Shield
  const userPreviousDtBetsCount = dragonTigerBets.filter((b) => b.userId === user.id).length;

  // Determine winner based on Admin Control Settings
  let winner: 'dragon' | 'tiger' | 'tie' = 'dragon';

  if (dragonTigerAdminMode === 'manual' && dragonTigerForcedWinner) {
    winner = dragonTigerForcedWinner;
    // Reset after one manual forced round
    dragonTigerForcedWinner = null;
    dragonTigerAdminMode = 'smart_retention_60_40';
  } else if (dragonTigerAdminMode === 'smart_retention_60_40') {
    // 60:40 Retention Engine: 60% Platform House Margin / 40% Player Win Distribution Cycle
    const roll = Math.random();
    if (roll < 0.40) {
      // 40% Player Win Cycle: Give users the winning thrill
      if (choice === 'dragon' || choice === 'tiger') {
        winner = choice;
      } else {
        // If bet on Tie (8X), give Tie 25% of the time in win cycle, otherwise grant 50/50 Dragon/Tiger
        winner = Math.random() < 0.25 ? 'tie' : (Math.random() < 0.5 ? 'dragon' : 'tiger');
      }
    } else {
      // 60% Platform Retention Cycle: Pick the opposite side to retain margin
      if (choice === 'dragon') {
        winner = 'tiger';
      } else if (choice === 'tiger') {
        winner = 'dragon';
      } else {
        winner = Math.random() > 0.5 ? 'dragon' : 'tiger';
      }
    }
  } else if (dragonTigerAdminMode === 'lowest_payout') {
    // 100% House Profit Mode: Minimize platform liability
    if (choice === 'dragon') winner = 'tiger';
    else if (choice === 'tiger') winner = 'dragon';
    else winner = Math.random() > 0.5 ? 'dragon' : 'tiger';
  } else {
    // Fair Random Mode (45% Dragon, 45% Tiger, 10% Tie)
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

  // First 3 Bets 50% Loss Protection Shield
  let cashbackAwarded = 0;
  if (!isWin && userPreviousDtBetsCount < 3) {
    cashbackAwarded = Number((numAmount * 0.50).toFixed(2));
    user.balance = (user.balance || 0) + cashbackAwarded;
    state.transactions.unshift({
      id: `tx-dt-shield-${Date.now()}`,
      userId: user.id,
      userNodeId: user.nodeId,
      type: 'admin_adjust',
      amount: cashbackAwarded,
      notes: `🛡️ Dragon vs Tiger 50% First 3 Bets Loss Protection Shield Refund (Bet #${userPreviousDtBetsCount + 1})`,
      status: 'completed',
      createdAt: new Date().toISOString(),
    });
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
    dragonCard,
    tigerCard,
    winner,
    payout,
    cashbackAwarded: cashbackAwarded > 0 ? cashbackAwarded : undefined,
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
    notes: `Dragon vs Tiger Bet on [${choice.toUpperCase()}] Round #${roundId} (${isWin ? 'WON ₹' + payout.toFixed(2) : cashbackAwarded > 0 ? 'LOST (50% Shield Refunded ₹' + cashbackAwarded.toFixed(2) + ')' : 'LOST'})`,
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
    cashbackAwarded,
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
  const auth = checkAdminPermission(req, 'canManageAviator');
  if (!auth.allowed) return res.status(auth.status).json({ error: auth.error });

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
  const auth = checkAdminPermission(req, 'canManageAviator');
  if (!auth.allowed) return res.status(auth.status).json({ error: auth.error });

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
      notes: `Global Gold Pool FIFO Cycle Reward (₹${rewardAmt} INR)`,
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
  const auth = checkAnyAdminPermission(req, ['canManageSettings', 'canManageUpiGateway', 'canManageDeposits']);
  if (!auth.allowed) return res.status(auth.status).json({ error: auth.error });

  const newSettings: SystemSettings = req.body;
  if (!newSettings) return res.status(400).json({ error: 'Invalid settings body' });

  const caller = auth.user;
  const isFullSettingsAllowed = Boolean(
    caller?.isSuperAdmin ||
      caller?.id === 'usr-root' ||
      caller?.nodeId === 'NX-ROOT01' ||
      caller?.adminPermissions?.canManageSettings
  );

  const mergedSettings: SystemSettings = isFullSettingsAllowed
    ? { ...state.settings, ...newSettings }
    : { ...state.settings };

  if (newSettings.walletAddresses) {
    mergedSettings.walletAddresses = {
      ...state.settings.walletAddresses,
      ...newSettings.walletAddresses,
    };
  }
  if (newSettings.rates) {
    mergedSettings.rates = {
      ...state.settings.rates,
      ...newSettings.rates,
    };
  }
  if (newSettings.specialSponsorBonus) {
    mergedSettings.specialSponsorBonus = {
      ...state.settings.specialSponsorBonus,
      ...newSettings.specialSponsorBonus,
      enabled: Boolean(newSettings.specialSponsorBonus.enabled),
      targetLevel: parseInt(newSettings.specialSponsorBonus.targetLevel as any) || 7,
      matchingPercent: parseFloat(newSettings.specialSponsorBonus.matchingPercent as any) || 100,
      requiredSelfPackagePrice: parseFloat(newSettings.specialSponsorBonus.requiredSelfPackagePrice as any) || 0,
      requiredDirectsCount: parseInt(newSettings.specialSponsorBonus.requiredDirectsCount as any) || 0,
    };
  }

  // Sanitize spin wheel rewards
  if (Array.isArray(mergedSettings.spinWheelRewards)) {
    mergedSettings.spinWheelRewards = mergedSettings.spinWheelRewards.map((r, i) => ({
      ...r,
      id: r.id || `sp-${i + 1}`,
      label: r.label || `₹${r.amount} INR`,
      amount: typeof r.amount === 'number' ? r.amount : parseFloat(r.amount as any) || 0,
      probability: typeof r.probability === 'number' ? r.probability : parseFloat(r.probability as any) || 0,
      minLevel: typeof r.minLevel === 'number' ? r.minLevel : parseInt(r.minLevel as any) || 0,
      color: r.color || '#10b981',
    }));
  }

  // Sanitize hero banners
  if (Array.isArray(mergedSettings.heroBanners)) {
    mergedSettings.heroBanners = mergedSettings.heroBanners.map((b, i) => ({
      id: b.id || `hb-${Date.now()}-${i}`,
      badge: b.badge || 'PROMO BANNER',
      title: b.title || 'Special Offer',
      subtitle: b.subtitle || '',
      discount: b.discount || '',
      cta: b.cta || 'Explore',
      category: b.category || 'All',
      image: b.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      enabled: b.enabled !== false,
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
  if (mergedSettings.spinTicketPrice !== undefined) {
    mergedSettings.spinTicketPrice = parseFloat(mergedSettings.spinTicketPrice as any) || 50;
  }
  if (mergedSettings.spinHouseProfitPercent !== undefined) {
    mergedSettings.spinHouseProfitPercent = parseFloat(mergedSettings.spinHouseProfitPercent as any) || 55.0;
  }

  if (mergedSettings.withdrawalFeePercent !== undefined) {
    mergedSettings.withdrawalFeePercent = typeof mergedSettings.withdrawalFeePercent === 'number'
      ? mergedSettings.withdrawalFeePercent
      : (parseFloat(mergedSettings.withdrawalFeePercent as any) || 0);
  }
  if (mergedSettings.upgradeFundDeductionPercent !== undefined) {
    mergedSettings.upgradeFundDeductionPercent = typeof mergedSettings.upgradeFundDeductionPercent === 'number'
      ? mergedSettings.upgradeFundDeductionPercent
      : (parseFloat(mergedSettings.upgradeFundDeductionPercent as any) || 0);
  }
  if (mergedSettings.minDepositAmount !== undefined) {
    mergedSettings.minDepositAmount = typeof mergedSettings.minDepositAmount === 'number'
      ? mergedSettings.minDepositAmount
      : (parseFloat(mergedSettings.minDepositAmount as any) || 100);
  }
  if (mergedSettings.minWithdrawalAmount !== undefined) {
    mergedSettings.minWithdrawalAmount = typeof mergedSettings.minWithdrawalAmount === 'number'
      ? mergedSettings.minWithdrawalAmount
      : (parseFloat(mergedSettings.minWithdrawalAmount as any) || 200);
  }
  if (mergedSettings.winningWithdrawalFeePercent !== undefined) {
    mergedSettings.winningWithdrawalFeePercent = typeof mergedSettings.winningWithdrawalFeePercent === 'number'
      ? mergedSettings.winningWithdrawalFeePercent
      : (parseFloat(mergedSettings.winningWithdrawalFeePercent as any) || 10);
  }
  if (mergedSettings.winningWithdrawalMinAmount !== undefined) {
    mergedSettings.winningWithdrawalMinAmount = typeof mergedSettings.winningWithdrawalMinAmount === 'number'
      ? mergedSettings.winningWithdrawalMinAmount
      : (parseFloat(mergedSettings.winningWithdrawalMinAmount as any) || 100);
  }
  if (mergedSettings.autoPayoutThresholdUSDT !== undefined) {
    mergedSettings.autoPayoutThresholdUSDT = typeof mergedSettings.autoPayoutThresholdUSDT === 'number'
      ? mergedSettings.autoPayoutThresholdUSDT
      : (parseFloat(mergedSettings.autoPayoutThresholdUSDT as any) || 2000);
  }

  // Sanitize daily tournament configuration
  if (newSettings.dailyTournament) {
    mergedSettings.dailyTournament = {
      ...state.settings.dailyTournament,
      ...newSettings.dailyTournament,
      enabled: newSettings.dailyTournament.enabled === false ? false : true,
      basePot: typeof newSettings.dailyTournament.basePot === 'number' ? newSettings.dailyTournament.basePot : parseFloat(newSettings.dailyTournament.basePot as any) || 0,
      turnoverContributionPercent: typeof newSettings.dailyTournament.turnoverContributionPercent === 'number' ? newSettings.dailyTournament.turnoverContributionPercent : parseFloat(newSettings.dailyTournament.turnoverContributionPercent as any) || 0,
      minWagerToQualify: typeof newSettings.dailyTournament.minWagerToQualify === 'number' ? newSettings.dailyTournament.minWagerToQualify : parseFloat(newSettings.dailyTournament.minWagerToQualify as any) || 0,
      title: newSettings.dailyTournament.title || 'Daily Top Bettor Championship 🏆',
      prizeDistribution: Array.isArray(newSettings.dailyTournament.prizeDistribution)
        ? newSettings.dailyTournament.prizeDistribution.map((p, idx) => ({
            rank: p.rank || idx + 1,
            percent: typeof p.percent === 'number' ? p.percent : parseFloat(p.percent as any) || 0,
          }))
        : state.settings.dailyTournament?.prizeDistribution || [],
    };
  }

  // Sanitize payment gateway & UPI pool + Bank Account
  if (newSettings.paymentGateway) {
    const incomingBank = newSettings.paymentGateway.bankAccount;
    const prevBank = state.settings.paymentGateway?.bankAccount || defaultSettings.paymentGateway!.bankAccount!;
    mergedSettings.paymentGateway = {
      ...(state.settings.paymentGateway || defaultSettings.paymentGateway!),
      ...newSettings.paymentGateway,
      enabled: newSettings.paymentGateway.enabled !== false,
      rotationStrategy: newSettings.paymentGateway.rotationStrategy || 'roundRobin',
      defaultUpiId: (newSettings.paymentGateway.defaultUpiId || 'sportxpay@okaxis').trim(),
      defaultPayeeName: (newSettings.paymentGateway.defaultPayeeName || 'SportX Gaming Official').trim(),
      subdomainUrl: (newSettings.paymentGateway.subdomainUrl || '').trim(),
      qrTimerSeconds: Number(newSettings.paymentGateway.qrTimerSeconds) || 600,
      autoRotateOnRefresh: newSettings.paymentGateway.autoRotateOnRefresh !== false,
      upiPool: Array.isArray(newSettings.paymentGateway.upiPool)
        ? newSettings.paymentGateway.upiPool.map((item, idx) => ({
            id: item.id || `upi-${Date.now()}-${idx}`,
            upiId: (item.upiId || '').trim(),
            name: (item.name || 'Merchant Pay').trim(),
            provider: item.provider || detectUpiProvider(item.upiId),
            dailyLimit: Number(item.dailyLimit) || 100000,
            usedCount: Number(item.usedCount) || 0,
            totalCollected: Number(item.totalCollected) || 0,
            isActive: item.isActive !== false,
            createdAt: item.createdAt || new Date().toISOString(),
            notes: item.notes || '',
          })).filter((x) => x.upiId.length >= 4)
        : (state.settings.paymentGateway?.upiPool || defaultSettings.paymentGateway!.upiPool),
      bankAccount: incomingBank
        ? {
            enabled: Boolean(incomingBank.enabled),
            accountHolderName: String(incomingBank.accountHolderName || '').trim(),
            bankName: String(incomingBank.bankName || '').trim(),
            accountNumber: String(incomingBank.accountNumber || '').trim(),
            ifscCode: String(incomingBank.ifscCode || '').trim().toUpperCase(),
            branchName: String(incomingBank.branchName || '').trim(),
          }
        : prevBank,
    };
  }

  // Sanitize per-game subdomain routing configuration
  if (newSettings.gameSubdomains) {
    const incomingSub = newSettings.gameSubdomains;
    const prevSub = state.settings.gameSubdomains || defaultSettings.gameSubdomains!;
    mergedSettings.gameSubdomains = {
      enabled: incomingSub.enabled !== false,
      rootDomain: (incomingSub.rootDomain || '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/, ''),
      mainAppUrl: (incomingSub.mainAppUrl || '').trim().replace(/\/+$/, ''),
      apiBaseUrl: (incomingSub.apiBaseUrl || '').trim().replace(/\/+$/, ''),
      autoSubdomainOnCustomDomain: incomingSub.autoSubdomainOnCustomDomain !== false,
      urls: {
        ...(prevSub.urls || {}),
        ...(incomingSub.urls || {}),
        aviator: (incomingSub.urls?.aviator || '').trim().replace(/\/+$/, ''),
        colorprediction: (incomingSub.urls?.colorprediction || '').trim().replace(/\/+$/, ''),
        cricket: (incomingSub.urls?.cricket || '').trim().replace(/\/+$/, ''),
        dragontiger: (incomingSub.urls?.dragontiger || '').trim().replace(/\/+$/, ''),
        luckydraw: (incomingSub.urls?.luckydraw || '').trim().replace(/\/+$/, ''),
        chickenroad: (incomingSub.urls?.chickenroad || '').trim().replace(/\/+$/, ''),
        rummy: (incomingSub.urls?.rummy || '').trim().replace(/\/+$/, ''),
        slot777: (incomingSub.urls?.slot777 || '').trim().replace(/\/+$/, ''),
        spinwheel: (incomingSub.urls?.spinwheel || '').trim().replace(/\/+$/, ''),
      },
    };
  }

  // Sanitize per-game ON/OFF visibility flags
  const defEnabled = defaultSettings.enabledGames!;
  const incomingEnabled = (newSettings as any).enabledGames || state.settings.enabledGames || defEnabled;
  mergedSettings.enabledGames = {
    aviator: incomingEnabled.aviator !== false,
    colorprediction: incomingEnabled.colorprediction !== false,
    cricket: incomingEnabled.cricket !== false,
    dragontiger: incomingEnabled.dragontiger !== false,
    luckydraw: incomingEnabled.luckydraw !== false,
    chickenroad: incomingEnabled.chickenroad !== false,
    rummy: incomingEnabled.rummy !== false,
    slot777: incomingEnabled.slot777 !== false,
    spinwheel: incomingEnabled.spinwheel !== false,
  };

  // Sanitize Signup Bonus config
  if ((newSettings as any).signupBonus) {
    const sb = (newSettings as any).signupBonus;
    mergedSettings.signupBonus = {
      enabled: sb.enabled === true,
      amountInr: Math.max(0, Number(sb.amountInr) || 0),
      creditWallet: ['depositBalance', 'winningBalance', 'balance'].includes(sb.creditWallet)
        ? sb.creditWallet
        : 'depositBalance',
      freeSpins: Math.max(0, parseInt(sb.freeSpins as any) || 0),
    };
  } else if (!mergedSettings.signupBonus) {
    mergedSettings.signupBonus = { ...defaultSettings.signupBonus! };
  }

  // Sanitize Tiered Deposit Bonus config
  if ((newSettings as any).depositBonus) {
    const db = (newSettings as any).depositBonus;
    mergedSettings.depositBonus = {
      enabled: db.enabled !== false,
      applyTo: db.applyTo === 'first_deposit_only' ? 'first_deposit_only' : 'all_deposits',
      creditWallet: ['depositBalance', 'winningBalance', 'balance'].includes(db.creditWallet)
        ? db.creditWallet
        : 'depositBalance',
      tiers: Array.isArray(db.tiers)
        ? db.tiers
            .map((t: any, idx: number) => ({
              id: t.id || `db-${Date.now()}-${idx}`,
              label: (t.label || '').trim() || `Greater than ₹${Math.max(0, Number(t.minAmount) || 0)}`,
              minAmount: Math.max(0, Number(t.minAmount) || 0),
              bonusType: (t.bonusType === 'fixed' ? 'fixed' : 'percent') as 'percent' | 'fixed',
              bonusValue: Math.max(0, Number(t.bonusValue) || 0),
              enabled: t.enabled !== false,
            }))
            .sort((a: any, b: any) => a.minAmount - b.minAmount)
        : defaultSettings.depositBonus!.tiers,
    };
  } else if (!mergedSettings.depositBonus) {
    mergedSettings.depositBonus = { ...defaultSettings.depositBonus! };
  }

  state.settings = mergedSettings;

  if (newSettings && (newSettings as any).luckyDraw) {
    const ld = (newSettings as any).luckyDraw;
    if (!state.luckyDraw) state.luckyDraw = initialLuckyDraw;
    ensureLuckyDrawPrizes();
    if (ld.ticketPrice !== undefined && ld.ticketPrice !== null && !isNaN(Number(ld.ticketPrice))) state.luckyDraw.ticketPrice = Math.max(0, Number(ld.ticketPrice));
    if (ld.prizeAmount !== undefined && ld.prizeAmount !== null && !isNaN(Number(ld.prizeAmount))) state.luckyDraw.prizeAmount = Math.max(0, Number(ld.prizeAmount));
    if (ld.secondPrizeAmount !== undefined && ld.secondPrizeAmount !== null && !isNaN(Number(ld.secondPrizeAmount))) state.luckyDraw.secondPrizeAmount = Math.max(0, Number(ld.secondPrizeAmount));
    if (ld.thirdPrizeAmount !== undefined && ld.thirdPrizeAmount !== null && !isNaN(Number(ld.thirdPrizeAmount))) state.luckyDraw.thirdPrizeAmount = Math.max(0, Number(ld.thirdPrizeAmount));
    if (ld.fourthPrizeAmount !== undefined && ld.fourthPrizeAmount !== null && !isNaN(Number(ld.fourthPrizeAmount))) state.luckyDraw.fourthPrizeAmount = Math.max(0, Number(ld.fourthPrizeAmount));
    if (ld.fifthPrizeAmount !== undefined && ld.fifthPrizeAmount !== null && !isNaN(Number(ld.fifthPrizeAmount))) state.luckyDraw.fifthPrizeAmount = Math.max(0, Number(ld.fifthPrizeAmount));
    if (ld.guaranteedPrizeAmount !== undefined && ld.guaranteedPrizeAmount !== null && !isNaN(Number(ld.guaranteedPrizeAmount))) state.luckyDraw.guaranteedPrizeAmount = Math.max(0, Number(ld.guaranteedPrizeAmount));
    if (ld.forcedPrizes && typeof ld.forcedPrizes === 'object') {
      state.luckyDraw.forcedPrizes = { ...state.luckyDraw.forcedPrizes, ...ld.forcedPrizes };
    }
  }

  if (state.luckyDraw && state.settings) {
    state.settings.luckyDraw = {
      ticketPrice: state.luckyDraw.ticketPrice,
      prizeAmount: state.luckyDraw.prizeAmount,
      secondPrizeAmount: state.luckyDraw.secondPrizeAmount,
      thirdPrizeAmount: state.luckyDraw.thirdPrizeAmount,
      fourthPrizeAmount: state.luckyDraw.fourthPrizeAmount,
      fifthPrizeAmount: state.luckyDraw.fifthPrizeAmount,
      guaranteedPrizeAmount: state.luckyDraw.guaranteedPrizeAmount,
      forcedPrizes: state.luckyDraw.forcedPrizes,
    };
  }

  saveStore();
  res.json({ success: true, settings: state.settings, luckyDraw: state.luckyDraw });
});

// A1b. Instant Per-Game ON/OFF Visibility Toggle
app.post('/api/admin/games/toggle', (req: Request, res: Response) => {
  const auth = checkAdminPermission(req, 'canManageSettings');
  if (!auth.allowed) return res.status(auth.status).json({ error: auth.error });

  ensureGameSubdomainSettings();
  const { gameKey, enabled, allEnabled } = req.body || {};
  const validKeys = Object.keys(defaultSettings.enabledGames!) as Array<keyof NonNullable<SystemSettings['enabledGames']>>;

  if (typeof allEnabled === 'boolean') {
    validKeys.forEach((k) => {
      state.settings.enabledGames![k] = allEnabled;
    });
    saveStore();
    return res.json({
      success: true,
      message: allEnabled ? 'All 9 games turned ON!' : 'All 9 games turned OFF!',
      enabledGames: state.settings.enabledGames,
      settings: state.settings,
    });
  }

  if (!gameKey || !validKeys.includes(gameKey)) {
    return res.status(400).json({ error: `Invalid gameKey: ${String(gameKey)}` });
  }

  const nextVal = typeof enabled === 'boolean' ? enabled : !isServerGameEnabled(gameKey);
  state.settings.enabledGames![gameKey as keyof NonNullable<SystemSettings['enabledGames']>] = nextVal;
  saveStore();

  return res.json({
    success: true,
    gameKey,
    enabled: nextVal,
    enabledGames: state.settings.enabledGames,
    settings: state.settings,
  });
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
    notes: `Admin Manual Balance Adjustment: Withdrawable=₹${user.balance.toFixed(2)}, Deposit Wallet=₹${(user.depositBalance || 0).toFixed(2)}, Upgrade=₹${user.upgradeBalance.toFixed(2)}`,
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

// SUB-ADMIN MANAGEMENT (Super Admin sovereign controls)
app.get('/api/admin/subadmins', (req: Request, res: Response) => {
  const auth = checkAdminPermission(req);
  if (!auth.allowed) return res.status(auth.status).json({ error: auth.error });

  const superAdmin = state.users.find((u) => u.id === 'usr-root' || u.nodeId === 'NX-ROOT01' || u.isSuperAdmin);
  const subadmins = state.users.filter(
    (u) => (u.isSubAdmin || (u.isAdmin && u.id !== 'usr-root' && u.nodeId !== 'NX-ROOT01'))
  );

  res.json({
    success: true,
    superAdmin: superAdmin
      ? {
          id: superAdmin.id,
          nodeId: superAdmin.nodeId,
          name: superAdmin.name,
          email: superAdmin.email,
          isSuperAdmin: true,
          adminRoleName: superAdmin.adminRoleName || 'Super Admin (Root Master)',
        }
      : null,
    subadmins,
  });
});

app.post('/api/admin/subadmins/create', (req: Request, res: Response) => {
  const auth = checkAdminPermission(req, 'canManageSubAdmins');
  if (!auth.allowed) return res.status(auth.status).json({ error: auth.error });

  const { name, nodeId, email, password, adminRoleName, adminPermissions } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Sub-Admin Full Name is required' });
  if (!nodeId || !nodeId.trim()) return res.status(400).json({ error: 'Sub-Admin User ID / Node ID is required' });
  if (!password || !password.trim()) return res.status(400).json({ error: 'Sub-Admin Password is required' });

  const cleanNodeId = nodeId.trim().toUpperCase();
  const cleanEmail = (email || `${cleanNodeId.toLowerCase()}@sportx.game`).trim().toLowerCase();
  const cleanName = name.trim();
  const cleanRole = (adminRoleName || 'Sub-Admin Operator').trim();

  // Check unique constraints
  const duplicate = state.users.find(
    (u) => u.nodeId.toUpperCase() === cleanNodeId || (u.email && u.email.toLowerCase() === cleanEmail)
  );
  if (duplicate) {
    return res.status(400).json({ error: `A user or sub-admin with ID ${cleanNodeId} or Email ${cleanEmail} already exists!` });
  }

  const permissions: AdminPermissions = {
    canManageDeposits: Boolean(adminPermissions?.canManageDeposits),
    canManageWithdrawals: Boolean(adminPermissions?.canManageWithdrawals),
    canManageUsers: Boolean(adminPermissions?.canManageUsers),
    canManageColorPrediction: Boolean(adminPermissions?.canManageColorPrediction),
    canManageDragonTiger: Boolean(adminPermissions?.canManageDragonTiger),
    canManageAviator: Boolean(adminPermissions?.canManageAviator),
    canManageTournament: Boolean(adminPermissions?.canManageTournament),
    canManageLottery: Boolean(adminPermissions?.canManageLottery),
    canManageUpiGateway: Boolean(adminPermissions?.canManageUpiGateway),
    canManageSettings: Boolean(adminPermissions?.canManageSettings),
    canViewReports: Boolean(adminPermissions?.canViewReports),
    canViewAudit: Boolean(adminPermissions?.canViewAudit),
    canManageProducts: Boolean(adminPermissions?.canManageProducts),
    canManageBoosting: Boolean(adminPermissions?.canManageBoosting),
    canManageSqlite: Boolean(adminPermissions?.canManageSqlite),
    canManageRanks: Boolean(adminPermissions?.canManageRanks),
    canManageSubAdmins: false, // only root Super Admin
  };

  const newSubAdmin: User = {
    id: `usr-sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    nodeId: cleanNodeId,
    name: cleanName,
    email: cleanEmail,
    password: password.trim(),
    walletAddress: `0xsub${Math.random().toString(16).substring(2, 18)}`,
    sponsorId: 'usr-root',
    activePackageId: 'pkg-20',
    packageActivatedAt: new Date().toISOString(),
    packageExpiryDays: 365,
    balance: 0,
    depositBalance: 0,
    upgradeBalance: 0,
    winningBalance: 0,
    winningEarned: 0,
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
    rank: 'Apex',
    status: 'active',
    isAdmin: true,
    isSubAdmin: true,
    isSuperAdmin: false,
    adminRoleName: cleanRole,
    adminPermissions: permissions,
    registeredAt: new Date().toISOString(),
    lastRoiClaimAt: new Date().toISOString(),
    spinCredits: 0,
    lastSpinAt: null,
  };

  state.users.push(newSubAdmin);
  saveStore();

  res.json({
    success: true,
    message: `Sub-Admin '${cleanName}' (${cleanNodeId}) created successfully with role '${cleanRole}'!`,
    subadmin: newSubAdmin,
  });
});

app.put('/api/admin/subadmins/:id', (req: Request, res: Response) => {
  const auth = checkAdminPermission(req, 'canManageSubAdmins');
  if (!auth.allowed) return res.status(auth.status).json({ error: auth.error });

  const targetId = req.params.id;
  const user = state.users.find((u) => u.id === targetId || u.nodeId.toUpperCase() === targetId.toUpperCase());
  if (!user) return res.status(404).json({ error: 'Sub-Admin not found' });
  if (user.id === 'usr-root' || user.nodeId === 'NX-ROOT01' || user.isSuperAdmin) {
    return res.status(400).json({ error: 'Cannot modify Super Admin master permissions from subadmin route' });
  }

  const { name, adminRoleName, adminPermissions, status } = req.body;
  if (typeof name === 'string' && name.trim()) user.name = name.trim();
  if (typeof adminRoleName === 'string' && adminRoleName.trim()) user.adminRoleName = adminRoleName.trim();
  if (status && ['active', 'inactive', 'banned'].includes(status)) user.status = status;

  if (adminPermissions && typeof adminPermissions === 'object') {
    user.adminPermissions = {
      ...(user.adminPermissions || {}),
      canManageDeposits: Boolean(adminPermissions.canManageDeposits),
      canManageWithdrawals: Boolean(adminPermissions.canManageWithdrawals),
      canManageUsers: Boolean(adminPermissions.canManageUsers),
      canManageColorPrediction: Boolean(adminPermissions.canManageColorPrediction),
      canManageDragonTiger: Boolean(adminPermissions.canManageDragonTiger),
      canManageAviator: Boolean(adminPermissions.canManageAviator),
      canManageTournament: Boolean(adminPermissions.canManageTournament),
      canManageLottery: Boolean(adminPermissions.canManageLottery),
      canManageUpiGateway: Boolean(adminPermissions.canManageUpiGateway),
      canManageSettings: Boolean(adminPermissions.canManageSettings),
      canViewReports: Boolean(adminPermissions.canViewReports),
      canViewAudit: Boolean(adminPermissions.canViewAudit),
      canManageProducts: Boolean(adminPermissions.canManageProducts),
      canManageBoosting: Boolean(adminPermissions.canManageBoosting),
      canManageSqlite: Boolean(adminPermissions.canManageSqlite),
      canManageRanks: Boolean(adminPermissions.canManageRanks),
      canManageSubAdmins: false,
    };
  }

  saveStore();
  res.json({ success: true, message: `Sub-Admin ${user.name} updated successfully!`, subadmin: user });
});

app.post('/api/admin/subadmins/:id/toggle', (req: Request, res: Response) => {
  const auth = checkAdminPermission(req, 'canManageSubAdmins');
  if (!auth.allowed) return res.status(auth.status).json({ error: auth.error });

  const targetId = req.params.id;
  const user = state.users.find((u) => u.id === targetId || u.nodeId.toUpperCase() === targetId.toUpperCase());
  if (!user) return res.status(404).json({ error: 'Sub-Admin not found' });
  if (user.id === 'usr-root' || user.nodeId === 'NX-ROOT01' || user.isSuperAdmin) {
    return res.status(400).json({ error: 'Cannot toggle Super Admin status' });
  }

  user.status = user.status === 'active' ? 'inactive' : 'active';
  saveStore();

  res.json({
    success: true,
    message: `Sub-Admin status updated to ${user.status.toUpperCase()}`,
    status: user.status,
  });
});

app.post('/api/admin/subadmins/:id/reset-password', (req: Request, res: Response) => {
  const auth = checkAdminPermission(req, 'canManageSubAdmins');
  if (!auth.allowed) return res.status(auth.status).json({ error: auth.error });

  const targetId = req.params.id;
  const { password } = req.body;
  if (!password || !password.trim()) return res.status(400).json({ error: 'New password cannot be empty' });

  const user = state.users.find((u) => u.id === targetId || u.nodeId.toUpperCase() === targetId.toUpperCase());
  if (!user) return res.status(404).json({ error: 'Sub-Admin not found' });

  user.password = password.trim();
  saveStore();

  res.json({ success: true, message: `Password for Sub-Admin ${user.name} (${user.nodeId}) reset successfully!` });
});

app.delete('/api/admin/subadmins/:id', (req: Request, res: Response) => {
  const auth = checkAdminPermission(req, 'canManageSubAdmins');
  if (!auth.allowed) return res.status(auth.status).json({ error: auth.error });

  const targetId = req.params.id;
  const userIndex = state.users.findIndex((u) => u.id === targetId || u.nodeId.toUpperCase() === targetId.toUpperCase());
  if (userIndex === -1) return res.status(404).json({ error: 'Sub-Admin not found' });

  const user = state.users[userIndex];
  if (user.id === 'usr-root' || user.nodeId === 'NX-ROOT01' || user.isSuperAdmin) {
    return res.status(400).json({ error: 'Cannot delete Super Admin (NX-ROOT01)' });
  }

  state.users.splice(userIndex, 1);
  saveStore();

  res.json({ success: true, message: `Sub-Admin ${user.name} (${user.nodeId}) deleted successfully!` });
});

// A4. Admin Approve / Reject Deposit
app.post('/api/admin/deposit/action', (req: Request, res: Response) => {
  const auth = checkAdminPermission(req, 'canManageDeposits');
  if (!auth.allowed) return res.status(auth.status).json({ error: auth.error });

  const { requestId, action, adminNotes } = req.body;
  const dep = state.depositRequests.find((d) => d.id === requestId);
  if (!dep) return res.status(404).json({ error: 'Deposit request not found' });

  if (dep.status === 'approved' && action === 'approve') {
    return res.status(400).json({ error: 'Deposit request is already approved.' });
  }

  dep.status = action === 'approve' ? 'approved' : 'rejected';
  dep.adminNotes = adminNotes || (action === 'approve' ? 'Approved by Admin' : 'Rejected by Admin');

  let bonusResult = { bonusUsdt: 0, bonusInr: 0, matchedTierLabel: null as string | null };

  if (action === 'approve') {
    const user = state.users.find((u) => u.id === dep.userId);
    if (user) {
      user.depositBalance = (user.depositBalance || 0) + dep.amount;
      user.totalDeposited = (user.totalDeposited || 0) + dep.amount;

      state.transactions.unshift({
        id: `tx-${Date.now()}-dep-app`,
        userId: user.id,
        userNodeId: user.nodeId,
        type: 'deposit',
        amount: dep.amount,
        status: 'completed',
        txHash: dep.txHash,
        network: dep.network,
        notes: `Deposit Approved: +₹${dep.amount.toFixed(2)} INR credited to Deposit Wallet`,
        createdAt: new Date().toISOString(),
      });

      bonusResult = applyDepositBonus(user, dep.amount, dep);
      user.hasFirstDepositApproved = true;
      if (bonusResult.bonusInr > 0) {
        dep.adminNotes = `${dep.adminNotes} | Bonus: +₹${bonusResult.bonusInr.toFixed(2)} (${bonusResult.matchedTierLabel})`;
      }
    }
  }

  saveStore();
  res.json({ success: true, depositRequest: dep, bonusAwarded: bonusResult });
});

// A5. Admin Approve / Reject Withdrawal
app.post('/api/admin/withdraw/action', (req: Request, res: Response) => {
  const auth = checkAdminPermission(req, 'canManageWithdrawals');
  if (!auth.allowed) return res.status(auth.status).json({ error: auth.error });

  const { requestId, action, adminNotes, txHash } = req.body;
  const wd = state.withdrawalRequests.find((w) => w.id === requestId);
  if (!wd) return res.status(404).json({ error: 'Withdrawal request not found' });

  wd.status = action === 'approve' ? 'approved' : 'rejected';
  wd.adminNotes = adminNotes || (action === 'approve' ? 'Paid via UPI / Bank Transfer' : 'Rejected by Admin');

  const user = state.users.find((u) => u.id === wd.userId);

  if (action === 'reject' && user) {
    // Refund user balance if rejected
    if ((wd as any).walletType === 'winning') {
      user.winningBalance = (user.winningBalance || 0) + wd.requestedAmount;
    } else {
      user.balance += wd.requestedAmount;
    }
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
      txHash: txHash || `UTR-${Date.now().toString().slice(-8)}`,
      network: wd.network,
      notes: `Withdrawal Paid: Net ₹${wd.netAmount.toFixed(2)} INR (${wd.network || 'UPI'})`,
      createdAt: new Date().toISOString(),
    });
  }

  saveStore();
  res.json({ success: true, withdrawalRequest: wd });
});

// A5.1. Admin 1-Click Automated Payout Dispatch
app.post('/api/admin/withdraw/auto-dispatch', async (req: Request, res: Response) => {
  const auth = checkAdminPermission(req, 'canManageWithdrawals');
  if (!auth.allowed) return res.status(auth.status).json({ error: auth.error });

  const { requestId } = req.body;
  const wd = state.withdrawalRequests.find((w) => w.id === requestId);
  if (!wd) return res.status(404).json({ error: 'Withdrawal request not found' });
  if (wd.status === 'approved') {
    return res.status(400).json({ error: 'Withdrawal request is already approved/dispatched.' });
  }

  const user = state.users.find((u) => u.id === wd.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const payoutRes = await executeBep20Payout(wd.targetAddress, wd.netAmount);
  if (!payoutRes.success || !payoutRes.txHash) {
    return res.status(400).json({
      error: payoutRes.error || 'Auto-dispatch failed. Please use Manual Approve with UTR for UPI/Bank payouts.',
    });
  }

  wd.status = 'approved';
  wd.adminNotes = `⚡ Auto-Dispatched (Ref: ${payoutRes.txHash})`;

  state.transactions.unshift({
    id: `tx-${Date.now()}-autowd`,
    userId: user.id,
    userNodeId: user.nodeId,
    type: 'withdrawal',
    amount: wd.requestedAmount,
    status: 'completed',
    txHash: payoutRes.txHash,
    network: wd.network || 'UPI',
    notes: `⚡ Auto-Dispatched Payout: Net ₹${wd.netAmount.toFixed(2)} INR (Ref: ${payoutRes.txHash})`,
    createdAt: new Date().toISOString(),
  });

  saveStore();
  res.json({
    success: true,
    txHash: payoutRes.txHash,
    bscscanUrl: payoutRes.bscscanUrl,
    message: `🚀 Payout dispatched! Ref: ${payoutRes.txHash}`,
    withdrawalRequest: wd,
  });
});

// Web3 Hot Wallet Status Endpoint
app.get('/api/web3/status', async (req: Request, res: Response) => {
  try {
    const status = await getHotWalletStatus();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Web3 On-Chain Deposit Verification Endpoint (Manual trigger by User or Admin)
app.post('/api/web3/verify-deposit', async (req: Request, res: Response) => {
  const { txHash, requestId } = req.body;
  if (!txHash) return res.status(400).json({ error: 'TxHash is required' });

  let dep = requestId ? state.depositRequests.find((d) => d.id === requestId) : null;
  if (!dep) {
    dep = state.depositRequests.find((d) => d.txHash && d.txHash.toLowerCase() === txHash.trim().toLowerCase());
  }

  const companyAddress = state.settings.walletAddresses?.BEP20 || DEFAULT_HOT_WALLET_ADDRESS;
  const verifyRes = await verifyOnChainDeposit(txHash.trim(), companyAddress);

  if (!verifyRes.valid) {
    return res.status(400).json({
      valid: false,
      error: verifyRes.error || 'Transaction could not be verified',
    });
  }

  if (dep && dep.status !== 'approved') {
    const user = state.users.find((u) => u.id === dep.userId);
    if (user) {
      const verifiedAmt = verifyRes.amount || dep.amount;
      dep.status = 'approved';
      dep.amount = verifiedAmt;
      dep.adminNotes = `⚡ Auto-Verified On-Chain (Block #${verifyRes.blockNumber}, Sender: ${verifyRes.from?.substring(0, 8)}...)`;

      user.depositBalance = (user.depositBalance || 0) + verifiedAmt;
      user.totalDeposited = (user.totalDeposited || 0) + verifiedAmt;

      state.transactions.unshift({
        id: `tx-${Date.now()}-autodep`,
        userId: user.id,
        userNodeId: user.nodeId,
        type: 'deposit',
        amount: verifiedAmt,
        status: 'completed',
        txHash: txHash.trim(),
        network: 'BEP20',
        notes: `⚡ Auto-Verified Deposit: +₹${verifiedAmt.toFixed(2)} INR credited to Deposit Wallet`,
        createdAt: new Date().toISOString(),
      });

      applyDepositBonus(user, verifiedAmt, dep);
      user.hasFirstDepositApproved = true;

      saveStore();
    }
  }

  res.json({
    success: true,
    valid: true,
    depositRequest: dep,
    blockchainData: verifyRes,
  });
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
      from: `"SportX System" <${config.smtpFrom}>`,
      to: target,
      subject: 'SportX SMTP Test Email 🚀',
      text: `Hello! If you are reading this email, your SportX SMTP configuration for ${config.smtpUser} (${config.smtpHost}:${config.smtpPort}) is working perfectly!`,
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
    'Withdrawable Balance (INR ₹)',
    'Upgrade Balance (INR ₹)',
    'Total Earned (INR ₹)',
    'ROI Earned (INR ₹)',
    'Level Earned (INR ₹)',
    'Sponsor Earned (INR ₹)',
    'Rank Earned (INR ₹)',
    'Boosting Earned (INR ₹)',
    'Spin Earned (INR ₹)',
    'Direct Referrals Count',
    'Team Count',
    'Team Volume (INR ₹)',
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
      error: `Insufficient Shopping Fund Wallet balance (₹${user.upgradeBalance.toFixed(2)} INR available). Required: ₹${totalCost.toFixed(2)} INR. Main Wallet is reserved for withdrawals.`,
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
    notes: `Purchased ${quantity}x ${itemDesc} from SportX Mart (₹${totalCost.toFixed(2)} INR from Shopping Fund Wallet)`,
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

  const priceInrVal = Number(priceUsdt);
  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    title,
    description: description || 'High quality SportX Mart product.',
    priceUsdt: priceInrVal,
    priceInr: priceInrVal,
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

  if (title !== undefined) product.title = title;
  if (description !== undefined) product.description = description;
  if (priceUsdt !== undefined) {
    product.priceUsdt = Number(priceUsdt);
    product.priceInr = Number(priceUsdt);
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

// ==========================================
// 🏏 FANTASY CRICKET (DREAM11 STYLE) ENGINE
// ==========================================

const defaultCricketMatches = [
  {
    id: 'match-ind-aus',
    title: 'India vs Australia • 3rd T20I Final',
    series: 'T20 World Championship 2026',
    matchType: 'T20',
    team1: {
      name: 'India',
      shortName: 'IND',
      flag: '🇮🇳',
      score: '194/4 (20.0 ov)',
      color: '#0284c7',
    },
    team2: {
      name: 'Australia',
      shortName: 'AUS',
      flag: '🇦🇺',
      score: '142/3 (15.2 ov)',
      color: '#eab308',
    },
    venue: 'Narendra Modi Stadium, Ahmedabad',
    startTime: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    status: 'live',
    statusText: '🔴 LIVE IN PLAY • INNINGS 2',
    megaPrizePool: 500000,
    contests: [
      {
        id: 'contest-mega-1',
        title: '🔥 MEGA CONTEST • 1st Prize ₹1,50,000 INR',
        tagline: 'Guaranteed 60% Winners • Up to 20 Teams',
        entryFee: 49,
        prizePool: 500000,
        totalSpots: 12000,
        filledSpots: 8892,
        firstPrize: 150000,
        winnerPercentage: 60,
        maxTeamsPerUser: 20,
        guaranteed: true,
        status: 'open',
      },
      {
        id: 'contest-h2h-1',
        title: '⚔️ Head-to-Head Winner Takes All',
        tagline: '2 Players • 1 Winner',
        entryFee: 100,
        prizePool: 180,
        totalSpots: 2,
        filledSpots: 1,
        firstPrize: 180,
        winnerPercentage: 50,
        maxTeamsPerUser: 1,
        guaranteed: true,
        status: 'open',
      },
      {
        id: 'contest-hot-mini',
        title: '💎 Hot Multiplier 3X Booster',
        tagline: 'Top 33% Win 3X Entry Fee',
        entryFee: 25,
        prizePool: 25000,
        totalSpots: 1200,
        filledSpots: 884,
        firstPrize: 5000,
        winnerPercentage: 33,
        maxTeamsPerUser: 5,
        guaranteed: true,
        status: 'open',
      },
    ],
    players: [
      // Wicket Keepers
      { id: 'p1', name: 'Rishabh Pant', team: 'India', teamShort: 'IND', role: 'WK', credits: 9.5, avatar: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=200&q=80', selectedByPercent: 88.4, points: 74, runs: 46, balls: 26, fours: 4, sixes: 3, catches: 1 },
      { id: 'p2', name: 'Josh Inglis', team: 'Australia', teamShort: 'AUS', role: 'WK', credits: 8.5, avatar: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&w=200&q=80', selectedByPercent: 42.1, points: 38, runs: 28, balls: 19, fours: 3, sixes: 1 },
      
      // Batsmen
      { id: 'p3', name: 'Suryakumar Yadav', team: 'India', teamShort: 'IND', role: 'BAT', credits: 10.0, avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=200&q=80', selectedByPercent: 92.5, points: 112, runs: 68, balls: 34, fours: 6, sixes: 5, strikeRate: 200.0 },
      { id: 'p4', name: 'Travis Head', team: 'Australia', teamShort: 'AUS', role: 'BAT', credits: 9.5, avatar: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=200&q=80', selectedByPercent: 86.2, points: 86, runs: 54, balls: 28, fours: 7, sixes: 2, strikeRate: 192.8 },
      { id: 'p5', name: 'Shubman Gill', team: 'India', teamShort: 'IND', role: 'BAT', credits: 9.0, avatar: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=200&q=80', selectedByPercent: 74.0, points: 48, runs: 35, balls: 24, fours: 4, sixes: 1 },
      { id: 'p6', name: 'David Warner', team: 'Australia', teamShort: 'AUS', role: 'BAT', credits: 8.5, avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=200&q=80', selectedByPercent: 65.3, points: 32, runs: 22, balls: 16, fours: 3, sixes: 0 },
      { id: 'p7', name: 'Yashasvi Jaiswal', team: 'India', teamShort: 'IND', role: 'BAT', credits: 9.0, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80', selectedByPercent: 71.8, points: 42, runs: 31, balls: 18, fours: 4, sixes: 1 },
      { id: 'p8', name: 'Tim David', team: 'Australia', teamShort: 'AUS', role: 'BAT', credits: 8.0, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', selectedByPercent: 45.0, points: 26, runs: 18, balls: 9, fours: 1, sixes: 2 },

      // All Rounders
      { id: 'p9', name: 'Hardik Pandya', team: 'India', teamShort: 'IND', role: 'AR', credits: 9.5, avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80', selectedByPercent: 89.1, points: 95, runs: 28, balls: 14, wickets: 2, overs: 4, maidens: 0, economy: 7.2 },
      { id: 'p10', name: 'Glenn Maxwell', team: 'Australia', teamShort: 'AUS', role: 'AR', credits: 9.0, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', selectedByPercent: 79.5, points: 68, runs: 32, balls: 18, wickets: 1, overs: 3, economy: 8.0 },
      { id: 'p11', name: 'Axar Patel', team: 'India', teamShort: 'IND', role: 'AR', credits: 8.5, avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80', selectedByPercent: 63.2, points: 54, runs: 14, wickets: 1, overs: 4, economy: 6.5 },
      { id: 'p12', name: 'Marcus Stoinis', team: 'Australia', teamShort: 'AUS', role: 'AR', credits: 8.5, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80', selectedByPercent: 58.7, points: 44, runs: 24, balls: 15, wickets: 1, overs: 2, economy: 9.0 },

      // Bowlers
      { id: 'p13', name: 'Jasprit Bumrah', team: 'India', teamShort: 'IND', role: 'BOWL', credits: 10.0, avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80', selectedByPercent: 94.6, points: 105, wickets: 3, overs: 4, maidens: 1, economy: 4.8 },
      { id: 'p14', name: 'Mitchell Starc', team: 'Australia', teamShort: 'AUS', role: 'BOWL', credits: 9.0, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80', selectedByPercent: 81.3, points: 62, wickets: 2, overs: 4, economy: 8.2 },
      { id: 'p15', name: 'Arshdeep Singh', team: 'India', teamShort: 'IND', role: 'BOWL', credits: 8.5, avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=200&q=80', selectedByPercent: 72.8, points: 58, wickets: 2, overs: 4, economy: 7.5 },
      { id: 'p16', name: 'Pat Cummins', team: 'Australia', teamShort: 'AUS', role: 'BOWL', credits: 9.0, avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80', selectedByPercent: 76.4, points: 52, wickets: 1, overs: 4, economy: 7.0 },
      { id: 'p17', name: 'Kuldeep Yadav', team: 'India', teamShort: 'IND', role: 'BOWL', credits: 8.5, avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=200&q=80', selectedByPercent: 68.9, points: 64, wickets: 2, overs: 4, economy: 6.0 },
      { id: 'p18', name: 'Adam Zampa', team: 'Australia', teamShort: 'AUS', role: 'BOWL', credits: 8.5, avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80', selectedByPercent: 64.1, points: 46, wickets: 1, overs: 4, economy: 7.8 },
      { id: 'p19', name: 'Mohammed Siraj', team: 'India', teamShort: 'IND', role: 'BOWL', credits: 8.0, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', selectedByPercent: 49.0, points: 36, wickets: 1, overs: 3, economy: 8.5 },
      { id: 'p20', name: 'Josh Hazlewood', team: 'Australia', teamShort: 'AUS', role: 'BOWL', credits: 8.5, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', selectedByPercent: 57.2, points: 42, wickets: 1, overs: 4, economy: 7.1 },
      { id: 'p21', name: 'Rinku Singh', team: 'India', teamShort: 'IND', role: 'BAT', credits: 8.0, avatar: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=200&q=80', selectedByPercent: 41.0, points: 28, runs: 24, balls: 11, fours: 2, sixes: 2 },
      { id: 'p22', name: 'Nathan Ellis', team: 'Australia', teamShort: 'AUS', role: 'BOWL', credits: 7.5, avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80', selectedByPercent: 32.5, points: 30, wickets: 1, overs: 3, economy: 8.0 },
    ],
  },
  {
    id: 'match-csk-mi',
    title: 'Chennai Super Kings vs Mumbai Indians • IPL 2026',
    series: 'Indian T20 League 2026',
    matchType: 'T20',
    team1: {
      name: 'Chennai Super Kings',
      shortName: 'CSK',
      flag: '🦁',
      color: '#eab308',
    },
    team2: {
      name: 'Mumbai Indians',
      shortName: 'MI',
      flag: '💙',
      color: '#2563eb',
    },
    venue: 'MA Chidambaram Stadium, Chepauk',
    startTime: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    status: 'upcoming',
    statusText: '⏳ Starts in 4h 15m',
    megaPrizePool: 350000,
    contests: [
      {
        id: 'contest-ipl-mega',
        title: '🏆 IPL El Clasico Mega Pool • ₹3,50,000 INR',
        tagline: 'Guaranteed 55% Winners • Top Rank gets ₹1,00,000',
        entryFee: 99,
        prizePool: 350000,
        totalSpots: 4000,
        filledSpots: 2840,
        firstPrize: 100000,
        winnerPercentage: 55,
        maxTeamsPerUser: 10,
        guaranteed: true,
        status: 'open',
      },
      {
        id: 'contest-ipl-low',
        title: '⚡ Beginner Safe 2X Pool',
        tagline: '50% Winners take Double Entry',
        entryFee: 25,
        prizePool: 10000,
        totalSpots: 500,
        filledSpots: 412,
        firstPrize: 1000,
        winnerPercentage: 50,
        maxTeamsPerUser: 3,
        guaranteed: true,
        status: 'open',
      },
    ],
    players: [
      { id: 'c1', name: 'MS Dhoni', team: 'Chennai Super Kings', teamShort: 'CSK', role: 'WK', credits: 9.5, avatar: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=200&q=80', selectedByPercent: 91.2, points: 52 },
      { id: 'c2', name: 'Ishan Kishan', team: 'Mumbai Indians', teamShort: 'MI', role: 'WK', credits: 8.5, avatar: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&w=200&q=80', selectedByPercent: 68.4, points: 44 },
      { id: 'c3', name: 'Ruturaj Gaikwad', team: 'Chennai Super Kings', teamShort: 'CSK', role: 'BAT', credits: 9.5, avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=200&q=80', selectedByPercent: 87.0, points: 76 },
      { id: 'c4', name: 'Rohit Sharma', team: 'Mumbai Indians', teamShort: 'MI', role: 'BAT', credits: 10.0, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', selectedByPercent: 94.1, points: 88 },
      { id: 'c5', name: 'Shivam Dube', team: 'Chennai Super Kings', teamShort: 'CSK', role: 'AR', credits: 9.0, avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80', selectedByPercent: 78.5, points: 64 },
      { id: 'c6', name: 'Hardik Pandya', team: 'Mumbai Indians', teamShort: 'MI', role: 'AR', credits: 9.5, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', selectedByPercent: 88.0, points: 72 },
      { id: 'c7', name: 'Ravindra Jadeja', team: 'Chennai Super Kings', teamShort: 'CSK', role: 'AR', credits: 9.0, avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80', selectedByPercent: 82.3, points: 70 },
      { id: 'c8', name: 'Jasprit Bumrah', team: 'Mumbai Indians', teamShort: 'MI', role: 'BOWL', credits: 10.0, avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80', selectedByPercent: 95.8, points: 92 },
      { id: 'c9', name: 'Matheesha Pathirana', team: 'Chennai Super Kings', teamShort: 'CSK', role: 'BOWL', credits: 9.0, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80', selectedByPercent: 79.4, points: 66 },
      { id: 'c10', name: 'Tilak Varma', team: 'Mumbai Indians', teamShort: 'MI', role: 'BAT', credits: 8.5, avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80', selectedByPercent: 62.0, points: 48 },
      { id: 'c11', name: 'Deepak Chahar', team: 'Chennai Super Kings', teamShort: 'CSK', role: 'BOWL', credits: 8.0, avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=200&q=80', selectedByPercent: 54.3, points: 40 },
      { id: 'c12', name: 'Gerald Coetzee', team: 'Mumbai Indians', teamShort: 'MI', role: 'BOWL', credits: 8.5, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80', selectedByPercent: 58.0, points: 46 },
    ],
  },
];

function ensureFantasyCricketState() {
  if (!(state as any).cricketMatches || (state as any).cricketMatches.length === 0) {
    (state as any).cricketMatches = defaultCricketMatches;
  }
  if (!(state as any).userFantasyTeams) {
    (state as any).userFantasyTeams = [];
  }
}

// 1. Get all matches & user entered teams
app.get('/api/cricket/matches', (req: Request, res: Response) => {
  ensureFantasyCricketState();
  const user = getUserFromReq(req);
  const myTeams = user
    ? (state as any).userFantasyTeams.filter((t: any) => t.userId === user.id)
    : [];

  res.json({
    success: true,
    matches: (state as any).cricketMatches,
    myTeams,
  });
});

// 2. Get Single Match detail by ID
app.get('/api/cricket/match/:id', (req: Request, res: Response) => {
  ensureFantasyCricketState();
  const { id } = req.params;
  const user = getUserFromReq(req);

  const match = (state as any).cricketMatches.find((m: any) => m.id === id);
  if (!match) return res.status(404).json({ error: 'Cricket match not found' });

  const myTeams = user
    ? (state as any).userFantasyTeams.filter((t: any) => t.userId === user.id && t.matchId === id)
    : [];

  res.json({
    success: true,
    match,
    myTeams,
  });
});

// 3. Create Dream11 Team & Join Contest
app.post('/api/cricket/join-contest', (req: Request, res: Response) => {
  if (!isServerGameEnabled('cricket')) {
    return res.status(403).json({ error: 'Cricket Fantasy is currently turned off by Admin.' });
  }
  ensureFantasyCricketState();
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'Please login to join Fantasy Cricket' });

  const { matchId, contestId, selectedPlayerIds, captainId, viceCaptainId, teamName } = req.body;

  const match = (state as any).cricketMatches.find((m: any) => m.id === matchId);
  if (!match) return res.status(404).json({ error: 'Match not found' });

  const contest = match.contests.find((c: any) => c.id === contestId);
  if (!contest) return res.status(404).json({ error: 'Contest not found' });

  if (contest.filledSpots >= contest.totalSpots) {
    return res.status(400).json({ error: 'Contest is already full! Please join another contest.' });
  }

  // Validate 11 Players
  if (!Array.isArray(selectedPlayerIds) || selectedPlayerIds.length !== 11) {
    return res.status(400).json({ error: 'Dream11 rules require exactly 11 players in your fantasy squad.' });
  }

  if (!captainId || !viceCaptainId) {
    return res.status(400).json({ error: 'Please select Captain (2X) and Vice-Captain (1.5X)' });
  }

  if (captainId === viceCaptainId) {
    return res.status(400).json({ error: 'Captain and Vice-Captain must be two different players' });
  }

  // Check user Main Wallet balance (unified depositBalance + winningBalance + balance)
  const entryFee = Number(contest.entryFee || 0);
  if (entryFee > 0) {
    if (!deductBetBalance(user, entryFee)) {
      const totalMain = (user.depositBalance || 0) + (user.winningBalance || 0) + (user.balance || 0);
      return res.status(400).json({
        error: `Insufficient Main Wallet balance! Entry fee is ₹${entryFee} INR (Available: ₹${totalMain.toFixed(2)} INR). Please deposit funds.`,
      });
    }
  }

  // Calculate live fantasy points for this team
  let totalPoints = 0;
  const matchPlayers = match.players || [];
  for (const pid of selectedPlayerIds) {
    const p = matchPlayers.find((pl: any) => pl.id === pid);
    let pts = p?.points || 0;
    if (pid === captainId) pts = Math.round(pts * 2);
    else if (pid === viceCaptainId) pts = Math.round(pts * 1.5);
    totalPoints += pts;
  }

  // User Team Count for this contest
  const existingContestTeams = (state as any).userFantasyTeams.filter(
    (t: any) => t.userId === user.id && t.contestId === contestId
  );
  const nextTeamNum = existingContestTeams.length + 1;
  const finalTeamName = teamName || `Team T${nextTeamNum}`;

  const newFantasyTeam = {
    id: `ft-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: user.id,
    userNodeId: user.nodeId,
    userName: user.name || 'Player',
    matchId,
    contestId,
    teamName: finalTeamName,
    selectedPlayerIds,
    captainId,
    viceCaptainId,
    totalPoints,
    rank: Math.floor(Math.random() * 12) + 1,
    wonPrize: 0,
    createdAt: new Date().toISOString(),
  };

  (state as any).userFantasyTeams.push(newFantasyTeam);
  contest.filledSpots = (contest.filledSpots || 0) + 1;

  // Add Bet Turnover & Affiliate Turnover
  user.totalBetTurnover = (user.totalBetTurnover || 0) + entryFee;
  process5LevelBetTurnoverCommission(user, entryFee, 'Cricket Fantasy 11');

  // Log transaction
  if (entryFee > 0) {
    state.transactions.unshift({
      id: `tx-cricket-${Date.now()}`,
      userId: user.id,
      userNodeId: user.nodeId,
      type: 'bet_placed' as any,
      amount: entryFee,
      status: 'completed',
      notes: `🏏 Dream11 Fantasy Contest: ${contest.title} (${finalTeamName})`,
      createdAt: new Date().toISOString(),
    });
  }

  saveStore();

  res.json({
    success: true,
    message: `🎉 Successfully joined contest with ${finalTeamName}!`,
    team: newFantasyTeam,
    contest,
    user: {
      depositBalance: user.depositBalance,
      winningBalance: user.winningBalance,
    },
  });
});

// 4. Get Match Leaderboard for a Contest
app.get('/api/cricket/leaderboard/:contestId', (req: Request, res: Response) => {
  ensureFantasyCricketState();
  const { contestId } = req.params;
  const user = getUserFromReq(req);

  const realTeams = (state as any).userFantasyTeams.filter((t: any) => t.contestId === contestId);

  // Generate dynamic simulated leaderboard with real user teams included
  const botTeams = [
    { rank: 1, teamName: 'DhoniStrikers T1', userName: 'Rohit K.', userNodeId: 'NX-9982', points: 348.5, prizeWon: 15000, captainName: 'Suryakumar Yadav', viceCaptainName: 'Jasprit Bumrah' },
    { rank: 2, teamName: 'MumbaiKings XI', userName: 'Aakash V.', userNodeId: 'NX-4102', points: 332.0, prizeWon: 6000, captainName: 'Jasprit Bumrah', viceCaptainName: 'Travis Head' },
    { rank: 3, teamName: 'BharatGlory 11', userName: 'Sunil G.', userNodeId: 'NX-7719', points: 318.5, prizeWon: 3000, captainName: 'Hardik Pandya', viceCaptainName: 'Rishabh Pant' },
    { rank: 4, teamName: 'CyberCricket PRO', userName: 'Kunal R.', userNodeId: 'NX-3190', points: 302.0, prizeWon: 1500, captainName: 'Suryakumar Yadav', viceCaptainName: 'Glenn Maxwell' },
    { rank: 5, teamName: 'MasterBlaster 7', userName: 'Vikram S.', userNodeId: 'NX-1144', points: 295.5, prizeWon: 800, captainName: 'Travis Head', viceCaptainName: 'Jasprit Bumrah' },
    { rank: 6, teamName: 'ChepaukWarriors', userName: 'Arun P.', userNodeId: 'NX-8201', points: 288.0, prizeWon: 500, captainName: 'Rishabh Pant', viceCaptainName: 'Pat Cummins' },
  ];

  // Merge real user teams
  const userEntries = realTeams.map((t: any, index: number) => {
    return {
      rank: index + 1,
      teamName: t.teamName,
      userName: t.userName,
      userNodeId: t.userNodeId,
      points: t.totalPoints,
      prizeWon: index === 0 ? 15000 : 250,
      captainName: 'Captain (2x)',
      viceCaptainName: 'Vice-Captain (1.5x)',
      isCurrentUser: user ? t.userId === user.id : false,
    };
  });

  const merged = [...userEntries, ...botTeams].sort((a, b) => b.points - a.points);
  merged.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  res.json({
    success: true,
    leaderboard: merged,
  });
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
    console.log(`🚀 SportX Gaming Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
