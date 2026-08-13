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
  depositBalance: number; // Deposit / Fund Wallet ($) for buying packages/bets
  upgradeBalance: number; // Reinvestment / Upgrade Wallet ($)
  winningBalance?: number; // Game & Lottery Winnings Wallet ($) - 10% fee, no MLM conditions
  winningEarned?: number; // Total Game & Lottery Winnings ($)
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
  totalBetTurnover?: number;
  referralCommissionEarned?: number;
  firstDepositBonusEarned?: number;
  vipAgentBonusEarned?: number;
  hasFirstDepositApproved?: boolean;
  levelTurnover?: { l1: number; l2: number; l3: number; l4: number; l5: number };
  levelCommission?: { l1: number; l2: number; l3: number; l4: number; l5: number };
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
    | 'color_prediction_bet'
    | 'color_prediction_win'
    | 'dragon_tiger_bet'
    | 'dragon_tiger_win'
    | 'sponsor_game_win_bonus'
    | 'bet_turnover_commission'
    | 'first_deposit_bonus'
    | 'vip_agent_bonus'
    | 'aviator_bet'
    | 'aviator_win'
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
  upgradeDeduction: number; // 20% / 30%
  gasFee: number; // $1.50 or %
  netAmount: number;
  targetAddress: string;
  network: string;
  walletType?: 'mlm' | 'winning';
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
  minLevel?: number;
}

export interface HeroBannerSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  discount: string;
  cta: string;
  category: string;
  image: string;
  enabled?: boolean;
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
  sponsorGameWinPercent?: number; // Sponsor royalty % on downline game wins (e.g. 5%)
  winningWithdrawalFeePercent?: number; // Admin charge % on winning wallet withdrawals (e.g. 10%)
  winningWithdrawalMinAmount?: number; // Min withdrawal from winning wallet (e.g. $5)
  tickerText: string;
  spinWheelRewards: SpinReward[];
  spinWheelIntervalHours?: number;
  spinCreditsPerReset?: number;
  spinTicketPrice?: number; // Cost per spin ticket in USDT (e.g., $1.00)
  specialSponsorBonus?: SpecialSponsorBonusConfig;
  heroBanners?: HeroBannerSlide[];
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

export interface LuckyDrawTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  userNodeId: string;
  userName: string;
  purchasedAt: string;
  price?: number;
}

export interface LuckyDrawWinner {
  id: string;
  drawTitle: string;
  ticketNumber: string;
  userId: string;
  userNodeId: string;
  userName: string;
  prizeAmount: number;
  prizeTier?: '1st Prize (6 Digits Match)' | '2nd Prize (Last 5 Digits)' | '3rd Prize (Last 4 Digits)' | string;
  matchedDigits?: number;
  winningNumber?: string;
  wonAt: string;
}

export interface LuckyDrawState {
  id: string;
  title: string;
  description?: string;
  ticketPrice: number;
  prizeAmount: number; // 1st Prize
  secondPrizeAmount?: number; // 2nd Prize (Last 5 Digits Match)
  thirdPrizeAmount?: number; // 3rd Prize (Last 4 Digits Match)
  targetEndTime: string;
  status: 'active' | 'rolling' | 'completed';
  forcedWinnerUserId?: string | null;
  forcedWinnerTicketNumber?: string | null;
  forcedSecondWinnerUserId?: string | null;
  forcedSecondWinnerTicketNumber?: string | null;
  reservedSeriesLast5?: string | null;
  tickets: LuckyDrawTicket[];
  pastWinners: LuckyDrawWinner[];
  lastDrawAt?: string;
  lastWinningNumber?: string;
  isRolling?: boolean;
  rollingStartedAt?: number;
  rollingWinningNumber?: string;
  rollingWinners?: LuckyDrawWinner[];
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

export interface ColorPredictionBet {
  id: string;
  userId: string;
  userName: string;
  userNodeId: string;
  periodId: string;
  selection: 'green' | 'red' | 'violet' | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'big' | 'small';
  amount: number;
  contractCount: number;
  totalBet: number;
  payout: number;
  status: 'pending' | 'won' | 'lost';
  createdAt: string;
}

export interface ColorPredictionResult {
  periodId: string;
  number: number; // 0 to 9
  color: 'green' | 'red' | 'violet-green' | 'violet-red';
  size: 'big' | 'small';
  completedAt: string;
}

export interface ColorPredictionState {
  currentPeriodId: string;
  periodDurationSeconds: number; // 60s (1 min Win Go)
  startTime: number; // Date.now() when period started
  forcedNextNumber: number | null; // Admin forced result (0-9)
  adminMode?: 'lowest_payout' | 'random' | 'manual'; // Risk management mode
  bets: ColorPredictionBet[];
  history: ColorPredictionResult[];
}

export interface AviatorBet {
  id: string;
  userId: string;
  userName: string;
  userNodeId: string;
  roundId: string;
  amount: number;
  cashedOut: boolean;
  cashoutMultiplier: number | null;
  payout: number;
  status: 'pending' | 'cashed_out' | 'crashed';
  createdAt: string;
}

export interface AviatorState {
  currentRoundId: string;
  status: 'waiting' | 'flying' | 'crashed';
  currentMultiplier: number;
  targetCrashMultiplier: number;
  startTime: number;
  bets: AviatorBet[];
  history: number[]; // crash multiplier history e.g. [1.25, 3.40, 10.50]
  forcedNextCrash: number | null;
  adminMode: 'lowest_payout' | 'random' | 'manual';
}

