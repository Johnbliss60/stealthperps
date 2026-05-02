# StealthPerps 🔒
### The first private perpetuals DEX on Solana

> Trade BTC/USD perps without revealing your position size, entry price, or liquidation level — ever.

**Live Demo:** https://stealth-perps.vercel.app
**Program:** D7KxfBv9wS3Wv317NRBH3WTHk6imwRWkhoyican9ngKz (Solana Devnet)
**GitHub:** https://github.com/Johnbliss60/stealthperps

## The Problem

On every existing perps DEX — dYdX, GMX, Jupiter Perps — your position is fully public onchain:
- Bots see your liquidation price and hunt it
- Anyone can see your position size and entry price
- MEV hunters front-run your trades

## The Solution

StealthPerps uses Arcium MPC to keep your position completely private:

1. You open a position — size, entry price and liquidation price encrypted client-side
2. Arcium MPC nodes compute liquidation checks on encrypted data — nobody sees it
3. Only PnL is revealed — on close, only the final result is decrypted onchain

## What Stays Private

| Data | Visibility |
|------|-----------|
| Position size | Always encrypted |
| Entry price | Always encrypted |
| Liquidation price | Always encrypted |
| Unrealized PnL | Always encrypted |
| Final PnL | Revealed only on close |

## Deployed Contracts

| | |
|-|-|
| Program ID | D7KxfBv9wS3Wv317NRBH3WTHk6imwRWkhoyican9ngKz |
| Network | Solana Devnet |
| MXE Account | DkUmUtcW3odwtNRp6AcMQxmHJDu7m1Tgm4EBrWMianAW |
| Arcium Cluster Offset | 456 |
| check_liquidation CompDef | 8deLTW1qo1CPtfN1Ba2j9EYGSnVVHowCE4FpyWtq4eLy |
| close_position CompDef | 14GXw7H3FGvJPLamvZbmbbrJjqfJ3Mx2kM2q1uEuv96p |

Verify on Solana Explorer:
https://explorer.solana.com/address/D7KxfBv9wS3Wv317NRBH3WTHk6imwRWkhoyican9ngKz?cluster=devnet

Sample encrypted computation transaction:
https://explorer.solana.com/tx/4hUvRsHBUj9BkCiqBh9zWqTWMrVTWBeiheshpZqn7z6mNEHzFQx9JuDT3fBpY11rAgFqRGvVVJ4eUQZjJFS5rQUc?cluster=devnet

## Tech Stack

- Smart Contract: Anchor 0.32.1 on Solana
- Privacy: Arcium MPC SDK 0.9.7
- Frontend: React + TypeScript
- Wallet: Phantom
- Deployment: Vercel

## Local Setup

git clone https://github.com/Johnbliss60/stealthperps.git
cd stealthperps
arcium build

export ARCIUM_CLUSTER_OFFSET=456
export ANCHOR_WALLET=~/.config/solana/id.json
export ANCHOR_PROVIDER_URL="https://api.devnet.solana.com"
anchor test --skip-local-validator --skip-deploy --provider.cluster devnet

cd frontend && npm install && npm start

## Built For

Arcium Hackathon 2025 — Privacy track

No bots can hunt your liquidation price
