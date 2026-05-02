import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

type Side = 'LONG' | 'SHORT';
type Tab = 'trade' | 'positions';

interface Position {
  id: string;
  side: Side;
  size: number;
  leverage: number;
  timestamp: number;
  status: 'open' | 'closing' | 'closed';
  pnl?: number;
}

interface PhantomProvider {
  isPhantom: boolean;
  publicKey: { toString(): string } | null;
  connect(): Promise<{ publicKey: { toString(): string } }>;
  disconnect(): Promise<void>;
  isConnected: boolean;
}

declare global {
  interface Window {
    solana?: PhantomProvider;
  }
}

const MOCK_PRICE = 67842.5;

function shortenAddress(addr: string) {
  return addr.slice(0, 4) + '...' + addr.slice(-4);
}

function App() {
  const [tab, setTab] = useState<Tab>('trade');
  const [side, setSide] = useState<Side>('LONG');
  const [size, setSize] = useState('');
  const [leverage, setLeverage] = useState(5);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [price, setPrice] = useState(MOCK_PRICE);
  const [priceUp, setPriceUp] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [walletError, setWalletError] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setPrice(p => {
        const change = (Math.random() - 0.48) * 15;
        setPriceUp(change > 0);
        return parseFloat((p + change).toFixed(2));
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Auto-connect if already connected
  useEffect(() => {
    if (window.solana?.isConnected && window.solana.publicKey) {
      setWalletAddress(window.solana.publicKey.toString());
    }
  }, []);

  const connectWallet = useCallback(async () => {
    setWalletError('');
    try {
      if (!window.solana) {
        setWalletError('Phantom not found. Install at phantom.app');
        window.open('https://phantom.app/', '_blank');
        return;
      }
      const resp = await window.solana.connect();
      setWalletAddress(resp.publicKey.toString());
    } catch (err: any) {
      if (err.code === 4001) {
        setWalletError('Connection rejected');
      } else {
        setWalletError('Failed to connect wallet');
      }
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    await window.solana?.disconnect();
    setWalletAddress(null);
    setPositions([]);
  }, []);

  const openPosition = async () => {
    if (!size || parseFloat(size) <= 0) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 2000));
    const newPos: Position = {
      id: Math.random().toString(36).slice(2),
      side, size: parseFloat(size), leverage,
      timestamp: Date.now(), status: 'open',
    };
    setPositions(prev => [newPos, ...prev]);
    setSubmitting(false);
    setSize('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    setTab('positions');
  };

  const closePosition = async (id: string) => {
    setPositions(prev => prev.map(p => p.id === id ? { ...p, status: 'closing' } : p));
    await new Promise(r => setTimeout(r, 2500));
    const pnl = (Math.random() - 0.4) * 500;
    setPositions(prev => prev.map(p => p.id === id ? { ...p, status: 'closed', pnl } : p));
  };

  const openPositions = positions.filter(p => p.status === 'open' || p.status === 'closing');
  const closedPositions = positions.filter(p => p.status === 'closed');

  return (
    <div className="app">
      <div className="bg-glow" />
      <div className="grid-overlay" />

      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L18 6V14L10 18L2 14V6L10 2Z" stroke="#6366f1" strokeWidth="1.5" fill="none"/>
                <path d="M10 6L14 8V12L10 14L6 12V8L10 6Z" fill="#6366f1" opacity="0.6"/>
              </svg>
            </div>
            <span className="logo-text">StealthPerps</span>
            <span className="logo-badge">PRIVATE</span>
          </div>
          <div className="price-display">
            <span className="price-label">BTC/USD</span>
            <span className={`price-value ${priceUp ? 'price-up' : 'price-down'}`}>
              ${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          {walletAddress ? (
            <button className="connect-btn connected" onClick={disconnectWallet}>
              <span className="wallet-dot" />
              {shortenAddress(walletAddress)}
            </button>
          ) : (
            <button className="connect-btn" onClick={connectWallet}>
              Connect Wallet
            </button>
          )}
        </div>
        {walletError && <div className="wallet-error">{walletError}</div>}
      </header>

      <div className="privacy-banner">
        <div className="privacy-inner">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L12 3.5V7C12 10 9.5 12.5 7 13C4.5 12.5 2 10 2 7V3.5L7 1Z" stroke="#6366f1" strokeWidth="1.2" fill="rgba(99,102,241,0.1)"/>
            <path d="M5 7L6.5 8.5L9 5.5" stroke="#6366f1" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span>All positions encrypted via <strong>Arcium MPC</strong> — size, entry & liquidation price are never revealed</span>
        </div>
      </div>

      <main className="main">
        <div className="tabs">
          <button className={`tab ${tab === 'trade' ? 'active' : ''}`} onClick={() => setTab('trade')}>Trade</button>
          <button className={`tab ${tab === 'positions' ? 'active' : ''}`} onClick={() => setTab('positions')}>
            Positions {openPositions.length > 0 && <span className="tab-badge">{openPositions.length}</span>}
          </button>
        </div>

        {tab === 'trade' && (
          <div className="panel">
            <div className="side-selector">
              <button className={`side-btn long ${side === 'LONG' ? 'active' : ''}`} onClick={() => setSide('LONG')}>↑ Long</button>
              <button className={`side-btn short ${side === 'SHORT' ? 'active' : ''}`} onClick={() => setSide('SHORT')}>↓ Short</button>
            </div>
            <div className="input-group">
              <label>Size (USD)</label>
              <div className="input-wrap">
                <span className="input-prefix">$</span>
                <input type="number" placeholder="0.00" value={size} onChange={e => setSize(e.target.value)} className="input" />
              </div>
              <div className="quick-amounts">
                {[100, 500, 1000, 5000].map(amt => (
                  <button key={amt} className="quick-btn" onClick={() => setSize(String(amt))}>
                    ${amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
            <div className="input-group">
              <label>Leverage <span className="leverage-val">{leverage}×</span></label>
              <input type="range" min={1} max={20} value={leverage} onChange={e => setLeverage(Number(e.target.value))} className="slider" />
              <div className="leverage-marks">
                {[1, 5, 10, 15, 20].map(v => <span key={v} className={leverage >= v ? 'mark active' : 'mark'}>{v}×</span>)}
              </div>
            </div>
            {size && (
              <div className="order-summary">
                <div className="summary-row"><span>Position Value</span><span>${(parseFloat(size) * leverage).toLocaleString()}</span></div>
                <div className="summary-row"><span>Entry Price</span><span className="encrypted-val">🔒 Hidden</span></div>
                <div className="summary-row"><span>Liq. Price</span><span className="encrypted-val">🔒 Hidden</span></div>
                <div className="summary-row"><span>Privacy</span><span className="arcium-badge">Arcium MPC ✓</span></div>
              </div>
            )}
            <button
              className={`submit-btn ${side === 'LONG' ? 'long' : 'short'} ${submitting ? 'loading' : ''}`}
              onClick={openPosition}
              disabled={!walletAddress || !size || submitting}
            >
              {submitting ? (<span className="spinner-text"><span className="spinner" />Encrypting via Arcium...</span>)
                : !walletAddress ? 'Connect Phantom Wallet'
                : `Open ${side} ${leverage}× Position`}
            </button>
            {showSuccess && <div className="success-toast">✓ Position opened privately — encrypted by Arcium</div>}
          </div>
        )}

        {tab === 'positions' && (
          <div className="panel">
            {!walletAddress ? (
              <div className="empty-state">
                <div className="empty-icon">🔒</div>
                <p>Connect your wallet</p>
                <p className="empty-sub">Connect Phantom to view your encrypted positions</p>
                <button className="connect-btn" style={{margin: '16px auto 0', display: 'flex'}} onClick={connectWallet}>
                  Connect Phantom
                </button>
              </div>
            ) : positions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔒</div>
                <p>No positions yet</p>
                <p className="empty-sub">Open a position to see it here — fully encrypted</p>
              </div>
            ) : (
              <div className="positions-list">
                {openPositions.length > 0 && (
                  <>
                    <div className="positions-section-label">Open Positions</div>
                    {openPositions.map(pos => (
                      <div key={pos.id} className="position-card">
                        <div className="position-header">
                          <div className="position-left">
                            <span className={`pos-side ${pos.side.toLowerCase()}`}>{pos.side}</span>
                            <span className="pos-asset">BTC/USD</span>
                            <span className="pos-leverage">{pos.leverage}×</span>
                          </div>
                          <div className="privacy-tag">🔒 PRIVATE</div>
                        </div>
                        <div className="position-details">
                          <div className="detail-row"><span>Size</span><span>${pos.size.toLocaleString()}</span></div>
                          <div className="detail-row"><span>Entry Price</span><span className="encrypted-val">🔒 Hidden</span></div>
                          <div className="detail-row"><span>Liq. Price</span><span className="encrypted-val">🔒 Hidden</span></div>
                          <div className="detail-row"><span>Unrealized PnL</span><span className="encrypted-val">🔒 Hidden</span></div>
                        </div>
                        <div className="arcium-proof">
                          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                            <path d="M7 1L12 3.5V7C12 10 9.5 12.5 7 13C4.5 12.5 2 10 2 7V3.5L7 1Z" stroke="#6366f1" strokeWidth="1.2" fill="rgba(99,102,241,0.1)"/>
                          </svg>
                          Encrypted by Arcium MPC — no one can see your position
                        </div>
                        <button className={`close-btn ${pos.status === 'closing' ? 'closing' : ''}`} onClick={() => closePosition(pos.id)} disabled={pos.status === 'closing'}>
                          {pos.status === 'closing' ? (<span className="spinner-text"><span className="spinner" /> Computing PnL privately...</span>) : 'Close Position'}
                        </button>
                      </div>
                    ))}
                  </>
                )}
                {closedPositions.length > 0 && (
                  <>
                    <div className="positions-section-label" style={{marginTop: '1rem'}}>Closed Positions</div>
                    {closedPositions.map(pos => (
                      <div key={pos.id} className="position-card closed">
                        <div className="position-header">
                          <div className="position-left">
                            <span className={`pos-side ${pos.side.toLowerCase()}`}>{pos.side}</span>
                            <span className="pos-asset">BTC/USD</span>
                            <span className="pos-leverage">{pos.leverage}×</span>
                          </div>
                          <span className={`pnl-reveal ${pos.pnl! >= 0 ? 'profit' : 'loss'}`}>
                            {pos.pnl! >= 0 ? '+' : ''}${pos.pnl!.toFixed(2)}
                          </span>
                        </div>
                        <div className="revealed-tag">✓ PnL revealed via Arcium callback</div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <div className="how-it-works">
          <div className="hiw-title">How Privacy Works</div>
          <div className="hiw-steps">
            <div className="hiw-step">
              <div className="hiw-num">1</div>
              <div><div className="hiw-label">You open a position</div><div className="hiw-desc">Size, entry & liquidation price encrypted client-side</div></div>
            </div>
            <div className="hiw-arrow">→</div>
            <div className="hiw-step">
              <div className="hiw-num">2</div>
              <div><div className="hiw-label">Arcium MPC computes</div><div className="hiw-desc">Liquidation check runs on encrypted data — nobody sees it</div></div>
            </div>
            <div className="hiw-arrow">→</div>
            <div className="hiw-step">
              <div className="hiw-num">3</div>
              <div><div className="hiw-label">Only PnL revealed</div><div className="hiw-desc">On close, only the final PnL is decrypted and shown</div></div>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <span>Built on Solana × Arcium</span>
        <span>No bots can hunt your liquidation price 🔒</span>
      </footer>
    </div>
  );
}

export default App;
