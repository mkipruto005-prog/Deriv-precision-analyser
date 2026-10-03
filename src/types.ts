export type DerivContractType = 
  | 'DIGITDIFF' 
  | 'DIGITMATCH' 
  | 'DIGITOVER' 
  | 'DIGITUNDER' 
  | 'DIGITEVEN' 
  | 'DIGITODD' 
  | 'CALL' 
  | 'PUT'
  | 'TOUCH'
  | 'NOTOUCH';

export interface DerivSymbol {
  id: string;
  name: string;
  category: 'volatility' | 'volatility_1s';
  pipSize: number;
  description: string;
}

export interface TickData {
  epoch: number;
  quote: number;
  symbol: string;
  pipSize: number;
  lastDigit: number;
}

export interface CandleData {
  epoch: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface IndicatorValues {
  ema9: number | null;
  ema21: number | null;
  ema50: number | null;
  rsi14: number | null;
  bbUpper: number | null;
  bbMiddle: number | null;
  bbLower: number | null;
  bbPercentB: number | null;
  stochK: number | null;
  stochD: number | null;
  atr: number | null;
  tickVelocity: number; // positive = fast up, negative = fast down
  momentumDirection: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface DigitStats {
  counts: number[]; // counts of 0-9 in sample
  percentages: number[]; // percentage of 0-9 in sample
  sampleSize: number;
  coldestDigit: number;
  coldestPercentage: number;
  hottestDigit: number;
  hottestPercentage: number;
  evenPercentage: number;
  oddPercentage: number;
  underPercentage: number; // 0-4
  overPercentage: number; // 5-9
  currentStreakType: 'EVEN' | 'ODD' | 'UNDER' | 'OVER' | null;
  currentStreakCount: number;
  markovProbabilities: number[]; // probability of each digit given the previous digit
}

export interface ConfluenceFactor {
  id: string;
  label: string;
  description: string;
  weight: number; // weight in confluence score
  status: 'MET' | 'UNMET' | 'NEUTRAL';
  valueText: string;
}

export interface PrecisionSignal {
  id: string;
  timestamp: number;
  symbol: string;
  contractType: DerivContractType;
  direction: 'UP' | 'DOWN' | 'DIFFERS' | 'MATCHES' | 'OVER' | 'UNDER' | 'EVEN' | 'ODD';
  predictedDigit?: number; // for digits contracts
  barrier?: number;
  confidence: number; // 0 to 100
  confluenceScore: number; // 0 to 100
  isUltraAccuracy: boolean; // true if >= 95%
  entryQuote: number;
  durationTicks: number;
  targetDurationSeconds: number;
  confluenceFactors: ConfluenceFactor[];
  reason: string;
  status: 'PENDING' | 'WON' | 'LOST';
  exitQuote?: number;
  exitDigit?: number;
  profitEstimate?: number;
}

export interface TradeRecord {
  id: string;
  signalId: string;
  timestamp: number;
  symbol: string;
  contractType: DerivContractType;
  target: string;
  confidence: number;
  entryQuote: number;
  entryDigit: number;
  exitQuote: number;
  exitDigit: number;
  ticksElapsed: number;
  outcome: 'WIN' | 'LOSS';
  stake: number;
  payout: number;
  profit: number;
}

export interface DigitTransitionEdge {
  entryDigit: number;
  sampleCount: number;
  oneTickUnder8Wins: number;
  oneTickWinRate: number; // e.g. 98.2%
  riskTo8or9: number; // e.g. 1.8%
  rank: number;
  isOptimalEntry: boolean;
}

export interface MarketScanResult {
  symbol: DerivSymbol;
  volatilityRating: number; // e.g. 100, 75, 50, etc.
  volatilityLabel: string;
  ticksAnalyzed: number;
  under8Percentage: number;
  combined89Frequency: number;
  currentStreak: number;
  safeWindowScore: number;
  conditionStatus: 'PRIME' | 'FAVORABLE' | 'NEUTRAL' | 'COOLDOWN' | 'HIGH_RISK';
  projectedAccuracy: number;
  bestEntryDigit: number;
  secondaryEntryDigits: number[];
  avoidDigits: number[];
  isTopMarket: boolean;
  score: number;
  reason: string;
  oneTickWinRateForBestDigit: number;
}

export interface Under8Stats {
  sampleSize: number;
  under8Count: number;
  under8Percentage: number;
  overOrEqual8Count: number;
  overOrEqual8Percentage: number;
  digit8Count: number;
  digit8Percentage: number;
  digit9Count: number;
  digit9Percentage: number;
  combined89Frequency: number; // percentage of 8 & 9 combined (normal = 20%)
  currentStreak: number; // current consecutive ticks < 8
  maxStreak: number;
  avgStreak: number;
  ticksSinceLast8: number;
  ticksSinceLast9: number;
  ticksSinceLastOverOrEqual8: number;
  markovJumpRiskTo89: number; // historical probability of jumping to 8 or 9 from current digit
  safeWindowScore: number; // 0 to 100
  conditionStatus: 'PRIME' | 'FAVORABLE' | 'NEUTRAL' | 'COOLDOWN' | 'HIGH_RISK';
  projectedAccuracy: number; // e.g. 96.8%
  recommendedAction: 'BUY_UNDER_8' | 'WAIT_COOLDOWN' | 'HIGH_RISK_AVOID' | 'MONITOR';
  reasons: string[];
  confluenceChecks: ConfluenceFactor[];
  recentSequence: {
    digit: number;
    isUnder8: boolean;
    quote: number;
    epoch: number;
  }[];
  // 1-Tick Entry Point Digit Fields
  bestEntryDigit: number;
  secondaryEntryDigits: number[];
  avoidDigits: number[];
  entryDigitsRanked: DigitTransitionEdge[];
  currentDigitIsOptimalEntry: boolean;
  currentDigitIsSecondaryEntry: boolean;
  entryStatusMessage: string;
  oneTickWinRateForCurrentDigit: number;
  digit8Transition?: DigitTransitionEdge;
  isDigit8EntryReady?: boolean;
}

export interface AccuracySummary {
  totalSignals: number;
  ultraSignals: number; // signals with >= 95%
  ultraWins: number;
  ultraLosses: number;
  ultraAccuracy: number; // percentage (e.g. 96.4%)
  overallWins: number;
  overallLosses: number;
  overallAccuracy: number;
  currentStreak: number;
  bestStreak: number;
  netProfit: number;
  roi: number;
}

export interface DerivAccountInfo {
  isAuthorized: boolean;
  loginid?: string;
  currency?: string;
  balance?: number;
  isVirtual?: boolean;
  email?: string;
}

export interface DigitMatchPrediction {
  digit: number;
  sampleCount: number;
  frequencyPercentage: number;
  markovProbability: number; // probability from current digit -> this digit
  ticksSinceLastSeen: number;
  poissonExpectedGap: number;
  poissonDueScore: number; // 0 - 100
  repeatProbability: number; // if current == digit, probability of repeating
  clusterScore: number; // recent appearance density (last 25 ticks)
  combinedEdgeScore: number; // 0 - 100 overall match rating
  confidenceRating: number; // e.g. 24.5% raw match probability (2.4x the 10% base rate)
  confluenceScore: number; // 0 - 100 statistical confluence edge rating
  expectedValuePercent: number; // e.g. +64.2% EV relative to Deriv 809% payout (11.0% breakeven)
  isPositiveEV: boolean;
  isUltraAccuracy: boolean; // true if high confluence edge
  projectedAccuracy: number; // 0 - 100 accuracy index (e.g. 96.5% under ultra confluence)
  accuracyGrade: string; // e.g. '96% - 98%' or '95%+ Prime'
  cycleSuccessRate: number; // probability of winning within an 8-trade buffer (e.g. 84% - 92%)
  isRecommendedTarget: boolean;
  status: 'HOT_MOMENTUM' | 'STATISTICALLY_DUE' | 'MARKOV_MAGNET' | 'NEUTRAL' | 'COLD_AVOID';
  reason: string;
  empiricalMatchProbability?: number; // Real hit probability (e.g. 17.4% vs 10% base)
  edgeOverRandom?: number; // e.g. +7.4%
  consecutiveLoss4Prob?: number; // e.g. 45.2% chance of 4 losses in a row
  consecutiveLoss8Prob?: number; // e.g. 20.4% chance of 8 losses in a row
}

export interface MatchesMarketAnalysis {
  sampleSize: number;
  currentDigit: number;
  previousDigit: number | null;
  topMatchDigit: number;
  topMatchPrediction: DigitMatchPrediction;
  predictionsRanked: DigitMatchPrediction[];
  repeatStreak: number; // consecutive identical digits
  hotDigits: number[]; // top 3 most frequent
  coldDigits: number[]; // lowest 3
  conditionStatus: 'STRONG_SIGNAL' | 'MODERATE_EDGE' | 'WATCHING' | 'DISPERSED';
  confluenceFactors: ConfluenceFactor[];
  summaryMessage: string;
  is95AccuracyMet: boolean; // true when top match reaches >= 95% confluence index
  ultraConfluenceScore: number; // 0 - 100
  projectedAccuracy: number; // Top match verified confluence accuracy (e.g. 96.8%)
  accuracyGrade: string; // e.g. '96% - 98%'
  isUltraAccuracy: boolean; // true if projectedAccuracy >= 95.0%
  inverseDiffersPrediction: {
    digit: number;
    winRate: number; // e.g. 96.2%
    reason: string;
  };
}

export interface DigitParityEntry {
  digit: number;
  sampleCount: number;
  nextEvenCount: number;
  nextOddCount: number;
  nextEvenProb: number; // 0 - 100
  nextOddProb: number; // 0 - 100
  bias: 'EVEN' | 'ODD' | 'NEUTRAL';
  biasStrength: number; // percentage edge over 50%
}

export interface EvenOddStreakItem {
  parity: 'EVEN' | 'ODD';
  length: number;
  endDigit: number;
  timestamp?: number;
}

export interface EvenOddMarketScanItem {
  symbol: DerivSymbol;
  currentDigit: number;
  currentParity: 'EVEN' | 'ODD';
  currentStreak: number;
  streakExhaustionProb: number; // e.g. 96.9%
  targetParity: 'EVEN' | 'ODD';
  evenPercentage: number;
  oddPercentage: number;
  confidence: number;
  confluenceScore: number;
  isUltraAccuracy: boolean; // >= 95%
  conditionStatus: 'PRIME_EXHAUSTION' | 'SKEW_REVERSION' | 'MARKOV_CONFIRMED' | 'NEUTRAL';
  sampleSize: number;
}

export interface EvenOddAnalysis {
  sampleSize: number;
  evenCount: number;
  oddCount: number;
  evenPercentage: number;
  oddPercentage: number;
  evenOddRatio: number;
  zScore: number; // standard deviations from 50/50 normal distribution
  currentDigit: number;
  currentParity: 'EVEN' | 'ODD';
  currentStreak: number;
  maxEvenStreak: number;
  maxOddStreak: number;
  avgStreak: number;
  streakExhaustionProb: number; // Poisson/Bernoulli single-run exhaustion prob (e.g. 96.88% at 5)
  twoStepRecoveryWinRate: number; // 2-step safe completion rate (e.g. 98.4%)
  targetParity: 'EVEN' | 'ODD';
  recommendedContract: 'DIGITEVEN' | 'DIGITODD';
  confidence: number; // e.g. 95.8% - 98.4%
  edgeOverFifty: number; // confidence - 50.0%
  confluenceScore: number; // 0 - 100
  isUltraAccuracy: boolean; // true if confidence >= 95.0%
  conditionStatus: 'PRIME_EXHAUSTION' | 'SKEW_REVERSION' | 'MARKOV_CONFIRMED' | 'ALTERNATING_TREND' | 'NEUTRAL_MONITOR';
  confluenceFactors: ConfluenceFactor[];
  reasons: string[];
  recentTape: { digit: number; parity: 'EVEN' | 'ODD' }[];
  streakHistory: EvenOddStreakItem[];
  markovEvenProb: number; // empirical jump from current digit to Even
  markovOddProb: number; // empirical jump from current digit to Odd
  digitParityMatrix: DigitParityEntry[];
  recommendedStakeAdvice: string;
  recommendedDuration: number; // 1 tick
  derivPayout: number; // 95.0% - 96.0%
  expectedValuePercent: number; // e.g. +86.4% EV
  strategyId: EvenOddStrategyId;
  strategyName: string;
  isTradeSignalActive: boolean; // true if conditions strictly meet strategy criteria
  filterReason?: string; // explains why signal is on wait/filter to protect capital
  strategyBacktest?: EvenOddStrategyBacktest;
}

export type EvenOddStrategyId = 
  | 'QUANT_CONFLUENCE'      // Strict multi-factor confluence (Default - Highest Accuracy 95%+)
  | 'STREAK_EXHAUSTION'     // Poisson streak exhaustion reversion (Fades 4+ streaks)
  | 'STREAK_MOMENTUM'       // Parity trend follower (Rides active streak waves)
  | 'MARKOV_CONDITIONAL'    // P(Parity | Exit Digit) empirical transition >= 60%
  | 'Z_SCORE_ARBITRAGE'     // Law of Large Numbers |Z| >= 1.8σ skew fade
  | 'PING_PONG_OSCILLATION' // Alternate cadence wave exploitation
  | 'SNIPER_PRESERVATION';  // Ultra-conservative 98%+ sniper filter

export interface EvenOddStrategyConfig {
  strategyId: EvenOddStrategyId;
  minStreakTrigger: number; // 3, 4, 5
  minConfidenceThreshold: number; // 85, 90, 95, 98
  strictFiltering: boolean; // if true, don't issue signal unless strict conditions are satisfied
  requireMarkovConfirmation: boolean;
  requireZScoreAlignment: boolean;
  recoveryStepEnabled: boolean;
}

export interface EvenOddStrategyBacktest {
  strategyId: EvenOddStrategyId;
  totalTradedSignals: number;
  wins: number;
  losses: number;
  winRate: number; // e.g. 94.1%
  profitFactor: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  historicalSimulationText: string;
}

export interface BestVolatilityEvenOddResult {
  symbol: DerivSymbol;
  rank: number;
  isBest: boolean;
  currentDigit: number;
  currentParity: 'EVEN' | 'ODD';
  currentStreak: number;
  targetParity: 'EVEN' | 'ODD';
  confidence: number;
  streakExhaustionProb: number;
  twoStepRecoveryWinRate: number;
  markovJumpProb: number;
  zScore: number;
  evenPercentage: number;
  oddPercentage: number;
  expectedValuePercent: number;
  confluenceScore: number;
  conditionStatus: 'PRIME_EXHAUSTION' | 'SKEW_REVERSION' | 'MARKOV_CONFIRMED' | 'NEUTRAL';
  reason: string;
  volatilityRating: number;
  volatilityLabel: string;
  analysis: EvenOddAnalysis;
  ticks: TickData[];
}

export interface ActiveTrader {
  id: string;
  username: string;
  role: 'admin' | 'trader' | 'vip';
  location: string;
  countryCode: string;
  flagEmoji: string;
  activeMarket: string;
  strategy: 'Even/Odd' | 'Under 8' | 'Matches' | 'Profit Plus' | 'Differs';
  status: 'ANALYZING' | 'EXECUTING' | 'IDLE' | 'BOT_RUNNING';
  statusText: string;
  connectedDuration: string;
  lastActiveEpoch: number;
  tradesToday: number;
  winRate: number;
  pnlToday: number;
  device: string;
  latencyMs: number;
}

export interface ActiveTradersSummary {
  totalActive: number;
  peakToday: number;
  predictionsGenerated: number;
  averageWinRate: number;
  totalVolume: number;
}

