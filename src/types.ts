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
  balance: number; // Available Agency / Commission Withdrawable (₹ INR)
  depositBalance: number; // Deposit / Fund Wallet (₹ INR) for games & shopping
  upgradeBalance: number; // Reinvestment / Upgrade Wallet (₹ INR)
  winningBalance?: number; // Game & Lottery Winnings Wallet (₹ INR)
  winningEarned?: number; // Total Game & Lottery Winnings (₹ INR)
  totalEarned: number; // Lifetime Earnings (₹ INR)
  roiEarned: number; // Node Yield (₹ INR)
  levelEarned: number; // Matrix Level Income (₹ INR)
  sponsorEarned: number; // Direct Sponsor Income (₹ INR)
  rankEarned: number; // Leadership Rank Bonuses (₹ INR)
  boostingEarned: number; // Global Gold Pool (₹ INR)
  spinEarned: number; // Daily Spin Rewards (₹ INR)
  specialBonusEarned?: number; // Special 100% Level Matching Sponsor Bonus (₹ INR)
  directReferralsCount: number;
  teamCount: number;
  teamVolume: number;
  rank: RankTier;
  status: 'active' | 'inactive' | 'banned';
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  isSubAdmin?: boolean;
  adminRoleName?: string;
  adminPermissions?: AdminPermissions;
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
  lastDailyCheckinAt?: string | null;
  dailyCheckinStreak?: number;
  totalDeposited?: number;
}

export interface AdminPermissions {
  canManageDeposits?: boolean;
  canManageWithdrawals?: boolean;
  canManageUsers?: boolean;
  canManageColorPrediction?: boolean;
  canManageDragonTiger?: boolean;
  canManageAviator?: boolean;
  canManageTournament?: boolean;
  canManageLottery?: boolean;
  canManageUpiGateway?: boolean;
  canManageSettings?: boolean;
  canViewReports?: boolean;
  canViewAudit?: boolean;
  canManageProducts?: boolean;
  canManageBoosting?: boolean;
  canManageSqlite?: boolean;
  canManageRanks?: boolean;
  canManageSubAdmins?: boolean;
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
    | 'signup_bonus'
    | 'vip_agent_bonus'
    | 'aviator_bet'
    | 'aviator_win'
    | 'fantasy_entry'
    | 'fantasy_win'
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
  inrAmount?: number;
  bonusAwarded?: number;
  bonusInr?: number;
  network: string;
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

export interface TournamentPrizeTier {
  rank: number;
  percent: number;
}

export interface DailyTournamentConfig {
  enabled: boolean;
  basePot: number; // e.g. 250 USDT
  turnoverContributionPercent: number; // e.g. 5%
  minWagerToQualify: number; // e.g. 10 USDT
  title?: string;
  prizeDistribution: TournamentPrizeTier[];
}

export interface LuckyDrawConfig {
  ticketPrice: number;
  prizeAmount: number;
  secondPrizeAmount: number;
  thirdPrizeAmount: number;
  fourthPrizeAmount: number;
  fifthPrizeAmount: number;
  guaranteedPrizeAmount: number;
  forcedPrizes?: { [key: string]: { userId?: string; ticketNumber?: string } };
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
  currencyMigratedToInr?: boolean;
  minDepositAmount?: number; // Minimum ₹ INR deposit amount allowed (e.g. ₹100)
  minWithdrawalAmount?: number; // Minimum ₹ INR withdrawal amount allowed (e.g. ₹200)
  sponsorGameWinPercent?: number; // Sponsor royalty % on downline game wins (e.g. 5%)
  winningWithdrawalFeePercent?: number; // Admin charge % on winning wallet withdrawals (e.g. 10%)
  winningWithdrawalMinAmount?: number; // Min withdrawal from winning wallet (e.g. ₹100)
  autoPayoutThresholdUSDT?: number; // Maximum ₹ INR amount for auto-dispatch vs manual review
  tickerText: string;
  spinWheelRewards: SpinReward[];
  spinWheelIntervalHours?: number;
  spinCreditsPerReset?: number;
  spinTicketPrice?: number; // Cost per spin ticket in ₹ INR
  spinHouseProfitPercent?: number; // House Profit margin % on Spin Wheel (e.g., 55% House Profit, 45% Player RTP)
  specialSponsorBonus?: SpecialSponsorBonusConfig;
  heroBanners?: HeroBannerSlide[];
  ranks: RankConfig[];
  dailyTournament?: DailyTournamentConfig;
  luckyDraw?: LuckyDrawConfig;
  paymentGateway?: PaymentGatewayConfig;
  gameSubdomains?: GameSubdomainsConfig;
  enabledGames?: EnabledGamesConfig;
  signupBonus?: SignupBonusConfig;
  depositBonus?: DepositBonusConfig;
  smtp?: {
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
    from?: string;
  };
}

export interface SignupBonusConfig {
  enabled: boolean;
  amountInr: number;
  creditWallet: 'depositBalance' | 'winningBalance' | 'balance';
  freeSpins?: number;
}

export interface DepositBonusTier {
  id: string;
  label?: string;
  minAmount: number;
  bonusType: 'percent' | 'fixed';
  bonusValue: number;
  enabled?: boolean;
}

export interface DepositBonusConfig {
  enabled: boolean;
  applyTo: 'all_deposits' | 'first_deposit_only';
  creditWallet: 'depositBalance' | 'winningBalance' | 'balance';
  tiers: DepositBonusTier[];
}

export interface EnabledGamesConfig {
  aviator?: boolean;
  colorprediction?: boolean;
  cricket?: boolean;
  dragontiger?: boolean;
  luckydraw?: boolean;
  chickenroad?: boolean;
  rummy?: boolean;
  slot777?: boolean;
  spinwheel?: boolean;
}

export interface GameSubdomainUrls {
  aviator?: string;
  colorprediction?: string;
  cricket?: string;
  dragontiger?: string;
  luckydraw?: string;
  chickenroad?: string;
  rummy?: string;
  slot777?: string;
  spinwheel?: string;
}

export interface GameSubdomainsConfig {
  enabled: boolean;
  rootDomain: string;
  mainAppUrl?: string;
  apiBaseUrl?: string;
  autoSubdomainOnCustomDomain?: boolean;
  urls?: GameSubdomainUrls;
}

export interface UpiPoolItem {
  id: string;
  upiId: string;
  name: string;
  provider?: string;
  dailyLimit?: number;
  usedCount: number;
  totalCollected: number;
  isActive: boolean;
  createdAt: string;
  notes?: string;
}

export interface PaymentGatewayConfig {
  enabled: boolean;
  rotationStrategy: 'roundRobin' | 'random' | 'leastUsed';
  defaultUpiId: string;
  defaultPayeeName: string;
  subdomainUrl?: string;
  qrTimerSeconds: number;
  autoRotateOnRefresh: boolean;
  upiPool: UpiPoolItem[];
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
  prizeTier?: '1st Prize (6 Digits Match)' | '2nd Prize (6 Digits Match)' | '3rd Prize (6 Digits Match)' | '4th Prize (6 Digits Match)' | '5th Prize (6 Digits Match)' | 'Guaranteed Prize (Last 5 Digits Match)' | string;
  matchedDigits?: number;
  matchedPrizeNumber?: string;
  winningNumber?: string;
  wonAt: string;
}

export interface DrawnPrizeTicket {
  prizeRank: 1 | 2 | 3 | 4 | 5;
  prizeName: string;
  ticketNumber: string;
  drawnAt: string;
  userId?: string;
  userNodeId?: string;
  userName?: string;
  prizeAmount: number;
}

export interface LuckyDrawState {
  id: string;
  title: string;
  description?: string;
  ticketPrice: number;
  prizeAmount: number; // 1st Prize
  secondPrizeAmount?: number; // 2nd Prize
  thirdPrizeAmount?: number; // 3rd Prize
  fourthPrizeAmount?: number; // 4th Prize
  fifthPrizeAmount?: number; // 5th Prize
  guaranteedPrizeAmount?: number; // Guaranteed Prize (Last 5 Digits of any 1st-5th winner, total 45 winners)
  targetEndTime: string;
  status: 'active' | 'rolling' | 'completed';
  currentDrawStep?: number; // 0 = ready, 1 = drawn 1st, 2 = drawn 2nd, 3 = drawn 3rd, 4 = drawn 4th, 5 = drawn 5th (completed)
  drawnPrizes?: DrawnPrizeTicket[]; // Array of 1st through 5th prize tickets drawn so far in current round
  forcedPrizes?: {
    [key in '1' | '2' | '3' | '4' | '5']?: {
      userId?: string | null;
      ticketNumber?: string | null;
    };
  };
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
  rollingPrizeRank?: number;
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
  amountInr?: number;
  payout: number;
  status: 'pending' | 'won' | 'lost';
  cashbackAwarded?: number;
  createdAt: string;
}

export interface ColorPredictionResult {
  id?: string;
  periodId: string;
  number: number; // 0 to 9
  color: 'green' | 'red' | 'violet-green' | 'violet-red' | 'violet';
  size: 'big' | 'small';
  completedAt?: string;
  createdAt?: string;
  blockHeight?: number;
  hash?: string;
}

export interface ColorPredictionState {
  currentPeriodId: string;
  periodDurationSeconds: number; // 60s (1 min Win Go)
  startTime: number; // Date.now() when period started
  forcedNextNumber: number | null; // Admin forced result (0-9)
  adminMode?: 'lowest_payout' | 'smart_retention_60_40' | 'random' | 'manual'; // Risk management mode
  bets: ColorPredictionBet[];
  history: ColorPredictionResult[];
}

export interface DragonTigerCard {
  suit: '♠' | '♥' | '♦' | '♣';
  value: string; // 'A', '2'...'10', 'J', 'Q', 'K'
  rank: number; // 1 to 13
  color: 'red' | 'black';
}

export interface DragonTigerBet {
  id: string;
  userId?: string;
  userNodeId?: string;
  userName?: string;
  roundId: string;
  choice: 'dragon' | 'tiger' | 'tie';
  amount: number;
  dragonCard?: DragonTigerCard;
  tigerCard?: DragonTigerCard;
  winner?: 'dragon' | 'tiger' | 'tie';
  payout: number;
  cashbackAwarded?: number;
  status: 'pending' | 'won' | 'lost';
  createdAt: string;
}

export interface DragonTigerHistory {
  id: string;
  roundId: string;
  dragonCard: DragonTigerCard;
  tigerCard: DragonTigerCard;
  winner: 'dragon' | 'tiger' | 'tie';
  completedAt: string;
}

export interface DragonTigerAdminStats {
  adminMode: 'lowest_payout' | 'smart_retention_60_40' | 'random' | 'manual';
  forcedWinner: 'dragon' | 'tiger' | 'tie' | null;
  totalStakes: number;
  dragonStakes: number;
  tigerStakes: number;
  tieStakes: number;
  dragonPayout: number;
  tigerPayout: number;
  tiePayout: number;
  projectedLowestWinner: 'dragon' | 'tiger' | 'tie';
  projectedLowestPayout: number;
  projected6040Winner: 'dragon' | 'tiger' | 'tie';
  projected6040Payout: number;
  recentBetsCount: number;
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
  slot?: number;
  autoCashout?: number;
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

export interface TournamentLeaderboardItem {
  rank: number;
  userId: string;
  userNodeId: string;
  userName: string;
  totalWagered: number;
  betsCount: number;
  totalWon: number;
  projectedPrize: number;
  badge?: string;
}

export interface DailyTournamentState {
  tournamentId: string;
  date: string;
  title: string;
  totalPot: number; // dynamically grows with wager turnover
  basePot: number;
  participantCount: number;
  totalBetsPlaced: number;
  totalWagerVolume: number;
  endsAt: string; // ISO string for end of day countdown
  leaderboard: TournamentLeaderboardItem[];
  prizeBreakdown: { rank: number; percent: number; minPrize: number }[];
  userStats?: {
    rank: number | null;
    totalWagered: number;
    betsCount: number;
    projectedPrize: number;
  };
}

export interface CricketPlayer {
  id: string;
  name: string;
  team: string; // 'IND' | 'AUS' | 'CSK' | 'MI' etc.
  teamShort: string;
  role: 'WK' | 'BAT' | 'AR' | 'BOWL';
  credits: number; // e.g. 9.5, 9.0, 8.5
  avatar: string;
  selectedByPercent: number; // e.g. 78.4%
  points: number; // match fantasy points
  runs?: number;
  balls?: number;
  fours?: number;
  sixes?: number;
  strikeRate?: number;
  wickets?: number;
  overs?: number;
  maidens?: number;
  economy?: number;
  catches?: number;
  stumpings?: number;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
}

export interface FantasyContest {
  id: string;
  title: string;
  tagline: string;
  entryFee: number; // in USDT
  prizePool: number; // in USDT
  totalSpots: number;
  filledSpots: number;
  firstPrize: number;
  winnerPercentage: number; // e.g. 60%
  maxTeamsPerUser: number;
  guaranteed: boolean;
  status: 'open' | 'live' | 'completed';
}

export interface CricketMatch {
  id: string;
  title: string; // e.g. "India vs Australia - 3rd T20I"
  series: string; // e.g. "T20 World Championship 2026"
  matchType: 'T20' | 'ODI' | 'TEST';
  team1: {
    name: string;
    shortName: string;
    flag: string;
    score?: string; // e.g. "186/4 (18.2 ov)"
    color: string;
  };
  team2: {
    name: string;
    shortName: string;
    flag: string;
    score?: string; // e.g. "182/6 (20.0 ov)"
    color: string;
  };
  venue: string;
  startTime: string; // ISO or human format
  status: 'upcoming' | 'live' | 'completed';
  statusText: string; // e.g. "Live in 12m", "Match In Progress", "Completed"
  megaPrizePool: number;
  players: CricketPlayer[];
  contests: FantasyContest[];
}

export interface UserFantasyTeam {
  id: string;
  userId: string;
  userNodeId: string;
  userName: string;
  matchId: string;
  contestId: string;
  teamName: string; // e.g. "Team 1"
  selectedPlayerIds: string[];
  captainId: string; // 2x points
  viceCaptainId: string; // 1.5x points
  totalPoints: number;
  rank?: number;
  wonPrize?: number;
  createdAt: string;
}

export interface FantasyLeaderboardEntry {
  rank: number;
  teamName: string;
  userName: string;
  userNodeId: string;
  points: number;
  prizeWon: number;
  captainName: string;
  viceCaptainName: string;
  isCurrentUser?: boolean;
}



