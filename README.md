# StealthPerps 🔒
### The first private perpetuals DEX on Solana

> Trade BTC/USD perps without revealing your position size, entry price, or liquidation level — ever.

**Live Demo:** https://stealth-perps.vercel.app  
**Program:** `D7KxfBv9wS3Wv317NRBH3WTHk6imwRWkhoyican9ngKz` (Solana Devnet)  
**GitHub:** https://github.com/Johnbliss60/stealthperps

---

## The Problem

On every existing perps DEX — dYdX, GMX, Jupiter Perps — your position is fully public onchain:

- 🤖 **Bots see your liquidation price** and hunt it
- 👀 **Anyone can see your position size** and entry price
- ⚡ **MEV hunters front-run** your trades

This costs traders millions in unnecessary liquidations every year.

---

## The Solution

StealthPerps uses **Arcium's Multi-Party Computation (MPC)** network to keep your position completely private:

You open a position
→ Size, entry price & liquidation price encrypted client-side
Arcium MPC nodes compute liquidation checks
→ Runs on encrypted data — nobody sees it, not even the protocol
Only PnL is revealed
→ On close, only the final result is decrypted onchain
**Nobody — not bots, not the protocol, not other traders — can see your position until you choose to close it.**

---

## What Stays Private

| Data | Visibility |
|------|-----------|
| Position size | 🔒 Always encrypted |
| Entry price | 🔒 Always encrypted |
| Liquidation price | 🔒 Always encrypted |
| Unrealized PnL | 🔒 Always encrypted |
| Final PnL | ✅ Revealed only on close |

---

## Architecture

### Privacy Layer — Arcium MPC

Two confidential circuits built with Arcium's `arcis` framework:

**`check_liquidation`**
```rust
// Takes encrypted inputs — nobody sees these values
pub struct LiquidationInputs {
    position_size: i64,  // encrypted
    entry_price: u64,    // encrypted
    mark_price: u64,     // encrypted
    collateral: u64,     // encrypted
}
// Returns encrypted PnL only if position is liquidatable
```

**`close_position`**
```rust
pub struct CloseInputs {
    position_size: i64,  // encrypted
    entry_price: u64,    // encrypted
    exit_price: u64,     // encrypted
}
// Returns encrypted PnL — only revealed to position owner
```

### Solana Program (Anchor)

| Instruction | Description |
|-------------|-------------|
| `check_liquidation` | Queues encrypted liquidation computation via Arcium |
| `check_liquidation_callback` | Receives result, emits `LiquidationEvent` |
| `close_position` | Queues encrypted close computation via Arcium |
| `close_position_callback` | Emits `ClosePositionEvent` with revealed PnL |

### Flow Diagram
User                    Solana Program           Arcium MPC Network
|                            |                         |
|-- encrypt(position) -----> |                         |
|                            |-- queue_computation --> |
|                            |                         |-- compute on
|                            |                         |   encrypted data
|                            | <-- callback(result) -- |
|                            |-- emit(PnLEvent) -----> |
| <-- revealed PnL --------- |                         |

---

## Deployed Contracts

| | |
|-|-|
| **Program ID** | `D7KxfBv9wS3Wv317NRBH3WTHk6imwRWkhoyican9ngKz` |
| **Network** | Solana Devnet |
| **MXE Account** | `DkUmUtcW3odwtNRp6AcMQxmHJDu7m1Tgm4EBrWMianAW` |
| **Arcium Cluster Offset** | `456` |
| **check_liquidation CompDef** | `8deLTW1qo1CPtfN1Ba2j9EYGSnVVHowCE4FpyWtq4eLy` |
| **close_position CompDef** | `14GXw7H3FGvJPLamvZbmbbrJjqfJ3Mx2kM2q1uEuv96p` |

**Verify on Solana Explorer:**  
https://explorer.solana.com/address/D7KxfBv9wS3Wv317NRBH3WTHk6imwRWkhoyican9ngKz?cluster=devnet

**Sample encrypted computation transaction:**  
https://explorer.solana.com/tx/4hUvRsHBUj9BkCiqBh9zWqTWMrVTWBeiheshpZqn7z6mNEHzFQx9JuDT3fBpY11rAgFqRGvVVJ4eUQZjJFS5rQUc?cluster=devnet

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Anchor 0.32.1 (Solana) |
| Privacy/MPC | Arcium SDK 0.9.7 |
| Encrypted Circuits | Arcis framework |
| Frontend | React + TypeScript |
| Styling | Custom CSS |
| Wallet | Phantom |
| Deployment | Vercel |

---

## Local Development

### Prerequisites
- Rust 1.85+
- Solana CLI 3.1+
- Anchor 0.32.1
- Arcium CLI
- Node.js 20+

### Setup

```bash
# Clone the repo
git clone https://github.com/Johnbliss60/stealthperps.git
cd stealthperps

# Build the Solana program
arcium build

# Run tests against devnet
export ARCIUM_CLUSTER_OFFSET=456
export ANCHOR_WALLET=~/.config/solana/id.json
export ANCHOR_PROVIDER_URL="https://api.devnet.solana.com"
anchor test --skip-local-validator --skip-deploy --provider.cluster devnet

# Run the frontend
cd frontend
npm install
npm start
# Open http://localhost:3000
```

---

## Why This Matters

Current perps DEXs lose traders money through information leakage. A $10B market cap protocol losing even 0.1% to liquidation hunting is $10M/year in preventable losses.

StealthPerps makes liquidation hunting **impossible** — not just difficult — by ensuring the liquidation price never exists onchain in readable form.

This is only possible with Arcium's MPC network, which allows computation on encrypted data without any party ever seeing the underlying values.

---

## Hackathon

Built for the **Arcium Hackathon 2025** — Privacy track.

*No bots can hunt your liquidation price 🔒*
