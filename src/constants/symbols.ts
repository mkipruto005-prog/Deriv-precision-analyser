import { DerivSymbol } from '../types';

export const DERIV_SYMBOLS: DerivSymbol[] = [
  // 1-Second Continuous Volatility Indices (random_index)
  {
    id: '1HZ100V',
    name: 'Volatility 100 (1s) Index',
    category: 'volatility_1s',
    pipSize: 2,
    description: 'Ultra-fast 1-second ticks at 100% constant volatility'
  },
  {
    id: '1HZ90V',
    name: 'Volatility 90 (1s) Index',
    category: 'volatility_1s',
    pipSize: 3,
    description: 'Fast 1-second ticks at 90% constant volatility'
  },
  {
    id: '1HZ75V',
    name: 'Volatility 75 (1s) Index',
    category: 'volatility_1s',
    pipSize: 2,
    description: 'Fast 1-second ticks at 75% constant volatility'
  },
  {
    id: '1HZ50V',
    name: 'Volatility 50 (1s) Index',
    category: 'volatility_1s',
    pipSize: 2,
    description: 'Fast 1-second ticks at 50% constant volatility'
  },
  {
    id: '1HZ30V',
    name: 'Volatility 30 (1s) Index',
    category: 'volatility_1s',
    pipSize: 3,
    description: 'Fast 1-second ticks at 30% constant volatility'
  },
  {
    id: '1HZ25V',
    name: 'Volatility 25 (1s) Index',
    category: 'volatility_1s',
    pipSize: 2,
    description: 'Fast 1-second ticks at 25% constant volatility'
  },
  {
    id: '1HZ15V',
    name: 'Volatility 15 (1s) Index',
    category: 'volatility_1s',
    pipSize: 3,
    description: 'Fast 1-second ticks at 15% constant volatility'
  },
  {
    id: '1HZ10V',
    name: 'Volatility 10 (1s) Index',
    category: 'volatility_1s',
    pipSize: 2,
    description: 'Fast 1-second ticks at 10% constant volatility'
  },

  // Standard Continuous Volatility Indices (random_index)
  {
    id: 'R_10',
    name: 'Volatility 10 Index',
    category: 'volatility',
    pipSize: 3,
    description: 'Smooth 10% volatility, optimal for steady digit distribution'
  },
  {
    id: 'R_25',
    name: 'Volatility 25 Index',
    category: 'volatility',
    pipSize: 3,
    description: 'Low-noise volatility (25%), ideal for Under 8 drought periods'
  },
  {
    id: 'R_50',
    name: 'Volatility 50 Index',
    category: 'volatility',
    pipSize: 4,
    description: 'Moderate volatility (50%), clean technical patterns'
  },
  {
    id: 'R_75',
    name: 'Volatility 75 Index',
    category: 'volatility',
    pipSize: 4,
    description: 'Active volatility (75%), balanced trend & mean-reversion'
  },
  {
    id: 'R_100',
    name: 'Volatility 100 Index',
    category: 'volatility',
    pipSize: 2,
    description: 'Constant volatility (100%), rapid digit confluence'
  }
];

export const CONTRACT_INFO = {
  DIGITDIFF: {
    name: 'Digit Differs',
    description: 'Contract wins if the last digit of the exit tick is different from your prediction. Baseline statistical win rate is 90%, boosted to 96%+ with cold-digit filtering.',
    baseEdge: 90.0,
    payoutRate: 9.8, // typical ~9.8% - 10% payout on Deriv
    idealTicks: 1
  },
  DIGITMATCH: {
    name: 'Digit Matches',
    description: 'Wins if the last digit matches. High payout ~800%, low base probability 10%.',
    baseEdge: 10.0,
    payoutRate: 809.0,
    idealTicks: 1
  },
  DIGITOVER: {
    name: 'Digit Over',
    description: 'Wins if last digit is greater than target. E.g., Over 1 wins on 2,3,4,5,6,7,8,9 (80% base rate, 95%+ with momentum filter).',
    baseEdge: 80.0,
    payoutRate: 23.5,
    idealTicks: 2
  },
  DIGITUNDER: {
    name: 'Digit Under',
    description: 'Wins if last digit is less than target. E.g., Under 8 wins on 0,1,2,3,4,5,6,7 (80% base rate, 95%+ with micro-drift filter).',
    baseEdge: 80.0,
    payoutRate: 23.5,
    idealTicks: 2
  },
  DIGITEVEN: {
    name: 'Digit Even',
    description: 'Wins if exit tick ends in 0, 2, 4, 6, 8. Edge activated when odd streak >= 4.',
    baseEdge: 50.0,
    payoutRate: 95.0,
    idealTicks: 3
  },
  DIGITODD: {
    name: 'Digit Odd',
    description: 'Wins if exit tick ends in 1, 3, 5, 7, 9. Edge activated when even streak >= 4.',
    baseEdge: 50.0,
    payoutRate: 95.0,
    idealTicks: 3
  },
  CALL: {
    name: 'Rise / Call',
    description: 'Wins if exit price is strictly higher than entry. Activated when 8-factor confluence >= 95%.',
    baseEdge: 50.0,
    payoutRate: 95.4,
    idealTicks: 5
  },
  PUT: {
    name: 'Fall / Put',
    description: 'Wins if exit price is strictly lower than entry. Activated when 8-factor confluence >= 95%.',
    baseEdge: 50.0,
    payoutRate: 95.4,
    idealTicks: 5
  },
  TOUCH: {
    name: 'Touch',
    description: 'Wins if market touches barrier before expiration.',
    baseEdge: 50.0,
    payoutRate: 110.0,
    idealTicks: 15
  },
  NOTOUCH: {
    name: 'No Touch',
    description: 'Wins if market stays within barrier boundary throughout duration.',
    baseEdge: 65.0,
    payoutRate: 45.0,
    idealTicks: 15
  }
};
