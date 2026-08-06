export type RankTier = 'Bronze' | 'Silver' | 'Gold' | 'Diamond' | 'Apex' | string;

export interface User {
  id: string;
  nodeId: string;
  name: string;
  email: string;
  walletAddress: string;
  sponsorId: string | null;
  placementUplineId?: string | null; // 2x2 Matrix Placement Upline (Spillover parent)
  activePackageId: string | null;
  packageActivatedAt: string | null;
  packageExpiryDays: number;
  balance: number; // Available Withdrawable ($)
  depositBalance: number; // Deposit / Fund Wallet ($) for buying packages
  upgradeBalance: number; // Reinvestment / Upgrade Wallet ($)
  totalEarned: number; // Lifetime Earnings ($)
  roiEarned: number; // Node Yield ($)
  levelEarned: number; // Matrix Level Income ($)
  sponsorEarned: number; // Direct Sponsor Income ($)
  rankEarned: number; // Leadership Rank Bonuses ($)
  boostingEarned: number; // Global Gold Pool ($)
  spinEarned: number; // Daily Spin Rewards ($)
  specialBonusEarned?: number; // Special 100% Level Matching Sponsor Bonus ($)
  directReferralsCount: number;
  teamCount: number;
  teamVolume: number;
  rank: RankTier;
  status: 'active' | 'inactive' | 'banned';
  isAdmin?: boolean;
  password?: string;
  registeredAt: string;
  lastRoiClaimAt: string;
  spinCredits: number;
  lastSpinAt: string | null;
  isUpgraded?: boolean;
}

export interface Package {
  id: string;
  name: string;
  price: number;
  dailyRoiPercent: number;
  durationDays: number;
  maxMatrixLevels: number;
  totalRoiReturnPercent: number;
  badgeColor: string;
  tierRank: number;
  popular?: boolean;
  isUpgradePackage?: boolean;
  sponsorBonusPercent?: number;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  priceUsdt: number;
  priceInr?: number;
  category: string;
  image: string;
  stock: number;
  rating: number;
  reviewsCount: number;
  badge?: string;
  featured?: boolean;
  createdAt: string;
  sizes?: string[];
  colors?: string[];
}

export interface ProductOrder {
  id: string;
  userId: string;
  userNodeId: string;
  userName: string;
  productId: string;
  productTitle: string;
  productImage: string;
  priceUsdt: number;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  totalUsdt: number;
  shippingAddress: string;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  userNodeId: string;
  type:
    | 'deposit'
    | 'withdrawal'
    | 'roi'
    | 'level_income'
    | 'sponsor_bonus'
    | 'special_matching_bonus'
    | 'boosting_payout'
    | 'spin_reward'
    | 'rank_bonus'
    | 'product_purchase'
    | 'admin_adjust';
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  txHash?: string;
  network?: string;
  notes?: string;
  createdAt: string;
}

export interface DepositRequest {
  id: string;
  userId: string;
  userNodeId: string;
  userName: string;
  amount: number;
  network: 'TRC20' | 'BEP20' | 'ERC20';
  txHash: string;
  proofImage?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  adminNotes?: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userNodeId: string;
  userName: string;
  requestedAmount: number;
  upgradeDeduction: number; // 20%
  gasFee: number; // $1.50
  netAmount: number; // 80% - gasFee
  targetAddress: string;
  network: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  adminNotes?: string;
}

export interface BoostingEntry {
  id: string;
  userId: string;
  nodeId: string;
  userName: string;
  packageId: string;
  rebirthCount: number;
  position: number;
  maxRebirthLimit: number;
  qualifiedAt: string;
  status: 'queued' | 'completed';
}

export interface LevelIncomeConfig {
  level: number;
  percent: number;
}

export interface SpecialSponsorBonusConfig {
  enabled: boolean;
  targetLevel: number; // e.g. Level 7 in direct referral's downline
  matchingPercent: number; // e.g. 100%
  requiredSelfPackagePrice: number; // e.g. $10 or $20 self package requirement
  requiredDirectsCount: number; // e.g. 2 or 5 total direct referrals required
}

export interface RankConfig {
  id: string;
  name: string;
  rewardTitle?: string;
  bonusUsdt: number;
  minSelfPackagePrice: number;
  requiredDirects: number;
  requiredSamePackageCount: number;
  upToLevel: number;
  requiredVolume?: number;
  icon?: string;
  color?: string;
}

export interface SpinReward {
  id: string;
  label: string;
  amount: number;
  probability: number;
  color: string;
}

export interface SystemSettings {
  packages: Package[];
  levelIncomePercentages: LevelIncomeConfig[];
  boostingPool: {
    rewardAmount: number;
    minDirects: number;
    minPackagePrice: number;
    maxRebirthLimit: number;
  };
  walletAddresses: {
    TRC20: string;
    BEP20: string;
    ERC20: string;
  };
  rates: {
    usdtToInr: number;
    inrToUsdt: number;
  };
  withdrawalFeePercent: number;
  upgradeFundDeductionPercent: number;
  tickerText: string;
  spinWheelRewards: SpinReward[];
  spinWheelIntervalHours?: number;
  spinCreditsPerReset?: number;
  specialSponsorBonus?: SpecialSponsorBonusConfig;
  ranks: RankConfig[];
  smtp?: {
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
    from?: string;
  };
}

export interface MatrixNode {
  user: User;
  level: number;
  children: MatrixNode[];
}

export interface LevelBreakdownRow {
  level: number;
  percentage: number;
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  volume: number;
  incomePerNode: number;
  earned: number;
}
