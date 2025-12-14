// Game state
let deck = [];
let playerHand = [];
let playerHand2 = []; // Second hand when split
let isSplit = false; // Track if hand is split
let currentHand = 1; // Which hand is currently being played (1 or 2)
let dealerHand = [];
let balance = 10000;
let currentBet = 0;
let bet2 = 0; // Bet for second hand when split
let insuranceBet = 0; // Insurance side bet
let gameInProgress = false;
let playerHasHit = false; // Track if player has already hit (for double down)
let playerHasHit2 = false; // Track if second hand has been hit
let dealerPlaying = false; // Track if dealer is currently playing
let runningCount = 0; // Hi-Lo card counting system
let previousRunningCount = 0; // Track previous count to detect changes
let numberOfDecks = 1; // Number of decks to use (default 1)
let penetrationPercent = 100; // Deck penetration percentage (50-100%)
let maxCardsInShoe = 0; // Maximum cards before reshuffle (based on penetration)
const MIN_BET = 50; // Minimum bet at this table
let manualEntryEnabled = false; // Track if manual card entry is enabled
let currentManualTarget = null; // Track which hand/position is being targeted for manual entry ('player', 'player2', 'dealer', or null)
let cardHistory = []; // Track last 30 cards clicked in the count tracker
const MAX_HISTORY = 30; // Maximum number of cards to track in history
let suitsModeEnabled = false; // Track if suits mode is enabled
let selectedSuit = '♠'; // Currently selected suit (default to spades)

// Live Mirror Mode State
let liveMode = false; // false = SIMULATOR, true = LIVE MIRROR
let liveMirrorBalance = 0; // Synced balance from real casino
let liveMirrorStats = {
    handsPlayed: 0,
    handsWon: 0,
    handsLost: 0,
    handsPushed: 0,
    totalWagered: 0,
    totalProfit: 0,
    perfectStrategyCount: 0, // Track perfect basic strategy plays
    sessionStartTime: null,
    lastHandTime: null,
    handHistory: [] // Track last 50 hands for pattern detection
};

// Card suits and values
const suits = ['♠', '♥', '♦', '♣'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// DOM elements
const balanceEl = document.getElementById('balance');
const runningCountEl = document.getElementById('running-count');
const deckCountEl = document.getElementById('deck-count');
const betAmountEl = document.getElementById('bet-amount');
const useRecommendedBtn = document.getElementById('use-recommended-btn');
const placeBetBtn = document.getElementById('place-bet-btn');
const hitBtn = document.getElementById('hit-btn');
const doubleBtn = document.getElementById('double-btn');
const splitBtn = document.getElementById('split-btn');
const insuranceBtn = document.getElementById('insurance-btn');
const surrenderBtn = document.getElementById('surrender-btn');
const standBtn = document.getElementById('stand-btn');
const newGameBtn = document.getElementById('new-game-btn');
const playerCardsEl = document.getElementById('player-cards');
const playerCards2El = document.getElementById('player-cards-2');
const hand2ContainerEl = document.getElementById('hand2-container');
const dealerCardsEl = document.getElementById('dealer-cards');
const playerScoreEl = document.getElementById('player-score');
const playerScore2El = document.getElementById('player-score-2');
const dealerScoreEl = document.getElementById('dealer-score');
const messageEl = document.getElementById('message');
const recommendationEl = document.getElementById('recommendation');
const advisorDetailsEl = document.getElementById('advisor-details');
const cardsRemainingEl = document.getElementById('cards-remaining');
const penetrationSliderEl = document.getElementById('penetration-slider');
const penetrationValueEl = document.getElementById('penetration-value');
const manualEntryToggleEl = document.getElementById('manual-entry-toggle');
const manualEntryInfoEl = document.getElementById('manual-entry-info');
const cardSelectionModalEl = document.getElementById('card-selection-modal');
const manualCardPadEl = document.getElementById('manual-card-pad');
const modalCardValueEl = document.getElementById('modal-card-value');
const modalCardSuitEl = document.getElementById('modal-card-suit');
const confirmCardBtnEl = document.getElementById('confirm-card-btn');
const cancelCardBtnEl = document.getElementById('cancel-card-btn');
const cardCountTrackerEl = document.getElementById('card-count-tracker');
const trackerRunningCountEl = document.getElementById('tracker-running-count');
const trackerTrueCountEl = document.getElementById('tracker-true-count');
const resetCountBtnEl = document.getElementById('reset-count-btn');
const cardHistoryListEl = document.getElementById('card-history-list');
const suitsModeToggleEl = document.getElementById('suits-mode-toggle');
const suitSelectorEl = document.getElementById('suit-selector');
const donationSidebarEl = document.querySelector('.donation-sidebar');
const coffeeBtnEl = document.querySelector('.logo-coffee');
const simulatorSidebarEl = document.querySelector('.simulator-sidebar');
const simulatorBtnEl = document.getElementById('logo-simulator');
const closeSimulatorBtn = document.getElementById('close-simulator-btn');
const exportBtnEl = document.getElementById('logo-export');
const exportSidebarEl = document.querySelector('.export-sidebar');
const closeExportBtn = document.getElementById('close-export-btn');
const exportNowBtn = document.getElementById('export-now-btn');
const exportStatusEl = document.getElementById('export-status');
const exportStatusTextEl = document.getElementById('export-status-text');

// Tab Switching Logic - Initialize on DOM ready
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    console.log('Initializing tabs:', { buttons: tabBtns.length, panes: tabPanes.length });
    
    if (tabBtns.length === 0 || tabPanes.length === 0) {
        console.warn('Tab buttons or panes not found', { buttons: tabBtns.length, panes: tabPanes.length });
        return;
    }
    
    // Ensure all tab buttons are clickable
    tabBtns.forEach(btn => {
        btn.style.pointerEvents = 'auto';
        btn.style.cursor = 'pointer';
        btn.style.zIndex = '1001';
    });
    
    // Function to switch tabs
    function switchTab(tabId) {
        // Hide all panes
        tabPanes.forEach(p => {
            p.classList.remove('active');
            p.style.display = 'none';
        });
        
        // Remove active from all buttons
        tabBtns.forEach(b => b.classList.remove('active'));
        
        // Show target pane
        const targetPane = document.getElementById(tabId);
        if (targetPane) {
            targetPane.classList.add('active');
            targetPane.style.display = 'flex';
            // Force a reflow to ensure display change
            void targetPane.offsetWidth;
            
            // Initialize tab-specific content when shown
            if (tabId === 'tab-poker') {
                // Re-initialize poker if needed (in case elements weren't ready before)
                setTimeout(() => {
                    const handMatrix = document.getElementById('hand-matrix');
                    if (handMatrix && handMatrix.children.length === 0) {
                        // Matrix not built yet, call initPoker again
                        if (typeof initPoker === 'function') {
                            initPoker();
                        }
                    }
                }, 100);
            }
        } else {
            console.error('Tab pane not found:', tabId, 'Available:', Array.from(tabPanes).map(p => p.id));
        }
    }
    
    // Add click handlers
    tabBtns.forEach(btn => {
        // Ensure button is clickable
        btn.style.pointerEvents = 'auto';
        btn.style.cursor = 'pointer';
        btn.style.zIndex = '1001';
        btn.style.position = 'relative';
        
        // Remove any existing event listeners by cloning (prevents duplicates)
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        // Add click handler to the new button
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const tabId = this.getAttribute('data-tab');
            console.log('Tab clicked:', tabId);
            
            if (!tabId) {
                console.error('No data-tab attribute found on button:', this);
                return;
            }
            
            // Get all buttons (re-query in case they were cloned)
            const allBtns = document.querySelectorAll('.tab-btn');
            
            // Update button active state
            allBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Switch tab
            switchTab(tabId);
        });
        
        // Ensure the new button is clickable
        newBtn.style.pointerEvents = 'auto';
        newBtn.style.cursor = 'pointer';
        newBtn.style.zIndex = '1001';
    });
    
    // Re-query buttons after cloning (they're new elements now)
    const finalTabBtns = document.querySelectorAll('.tab-btn');
    
    // Initialize first tab - ensure it's visible
    const activeBtn = document.querySelector('.tab-btn.active');
    if (activeBtn) {
        const tabId = activeBtn.getAttribute('data-tab');
        if (tabId) {
            switchTab(tabId);
        }
    } else if (finalTabBtns.length > 0) {
        // No active button, activate first one
        const firstTabId = finalTabBtns[0].getAttribute('data-tab');
        if (firstTabId) {
            finalTabBtns[0].classList.add('active');
            switchTab(firstTabId);
        }
    }
    
    // Force show the active pane if it exists (fallback)
    const activePane = document.querySelector('.tab-pane.active');
    if (activePane) {
        activePane.classList.add('active');
        activePane.style.display = 'flex';
    } else {
        // Emergency fallback: show first pane
        if (tabPanes.length > 0) {
            const firstPane = tabPanes[0];
            firstPane.classList.add('active');
            firstPane.style.display = 'flex';
            if (finalTabBtns.length > 0) {
                finalTabBtns[0].classList.add('active');
            }
        }
    }
    
    console.log('Tabs initialized. Active tab:', document.querySelector('.tab-btn.active')?.getAttribute('data-tab'));
    console.log('All tab buttons:', Array.from(finalTabBtns).map(b => ({ 
        id: b.getAttribute('data-tab'), 
        clickable: b.style.pointerEvents !== 'none',
        zIndex: b.style.zIndex,
        cursor: b.style.cursor
    })));
    
    // Test: Try clicking a tab programmatically to verify it works
    setTimeout(() => {
        const testBtn = document.querySelector('[data-tab="tab-sports"]');
        if (testBtn) {
            console.log('Testing Sportsbook tab clickability:', {
                exists: !!testBtn,
                pointerEvents: testBtn.style.pointerEvents,
                zIndex: testBtn.style.zIndex,
                cursor: testBtn.style.cursor
            });
        }
    }, 500);
}

// Helper function to switch to a specific tab programmatically
function switchToTab(tabId) {
    const btn = document.querySelector(`[data-tab="${tabId}"]`);
    if (btn) {
        btn.click();
    } else {
        console.warn('Tab button not found:', tabId);
    }
}

// Tab initialization moved to consolidated DOMContentLoaded handler below

/* --- Tab 2: Game Scanner Logic --- */
const scanPayout = document.getElementById('scan-payout');
const scanSoft17 = document.getElementById('scan-soft17');
const scanShuffle = document.getElementById('scan-shuffle');
const scannerResult = document.getElementById('scanner-result');

function updateScanner() {
    if (!scannerResult) return;
    
    const payout = parseFloat(scanPayout.value);
    const soft17 = scanSoft17.value;
    const shuffle = scanShuffle.value;
    
    let houseEdge = 0.5; // Baseline approx
    let verdict = "⚠️ Caution";
    let cssClass = "result-warning";
    let message = "";

    // Adjust House Edge
    if (payout === 1.2) houseEdge += 1.4; // 6:5 adds ~1.4% edge
    if (soft17 === 'hit') houseEdge += 0.22;
    
    // Verdict Logic
    if (payout === 1.5 && soft17 === 'stand' && shuffle === 'csm') {
        verdict = "✅ GREEN LIGHT (IGT Video BJ)";
        cssClass = "result-good";
        message = "Perfect for washing. Use Tab 1.";
        houseEdge = 0.46;
    } else if (payout === 1.2) {
        verdict = "🛑 RED LIGHT";
        cssClass = "result-bad";
        message = "6:5 Payout is a trap. Do not play.";
    } else {
        verdict = "⚠️ MARGINAL";
        message = "Playable but not optimal.";
    }

    const washCost = 1000 * (houseEdge / 100);

    scannerResult.style.display = 'block';
    scannerResult.className = `scanner-result ${cssClass}`;
    scannerResult.innerHTML = `
        <strong>Verdict: ${verdict}</strong><br>
        Estimated House Edge: ${houseEdge.toFixed(2)}%<br>
        Cost to Wash $1,000: <strong>$${washCost.toFixed(2)}</strong><br>
        <small>${message}</small>
    `;
}

// Add listeners to scanner inputs
if (scanPayout && scanSoft17 && scanShuffle) {
    [scanPayout, scanSoft17, scanShuffle].forEach(el => {
        el.addEventListener('change', updateScanner);
    });
    // Init
    // updateScanner(); // Optional: run on load
}

/* --- Tab 3: Health Dashboard Logic --- */
const healthDeposit = document.getElementById('health-deposit');
const healthCasino = document.getElementById('health-casino');
const healthSports = document.getElementById('health-sports');
const healthWithdraw = document.getElementById('health-withdraw');
const healthStatus = document.getElementById('health-status');
const healthFreeSpins = document.getElementById('health-free-spins');
const freeSpinsGame = document.getElementById('free-spins-game');
const freeSpinsAmount = document.getElementById('free-spins-amount');
const spendFreeSpinsBtn = document.getElementById('spend-free-spins-btn');
const freeSpinsResult = document.getElementById('free-spins-result');

function updateHealth() {
    if (!healthStatus) return;
    
    // Guard against null health inputs (they may not exist if Health tab isn't loaded)
    const deposited = healthDeposit ? (parseFloat(healthDeposit.value) || 0) : 0;
    const casino = healthCasino ? (parseFloat(healthCasino.value) || 0) : 0;
    const sports = healthSports ? (parseFloat(healthSports.value) || 0) : 0;
    const withdrawn = healthWithdraw ? (parseFloat(healthWithdraw.value) || 0) : 0;
    const freeSpinWinnings = sessionStats.freeSpinWinnings || 0;
    const cashPlayed = sessionStats.cashPlayed || 0;
    
    if (deposited === 0) return;

    const ratioWithdraw = (withdrawn / (sports || 1)) * 100;
    const turnover = casino / deposited;
    
    // W/D Ratio (Withdrawal to Deposit) - Critical metric
    const wdRatio = deposited > 0 ? (withdrawn / deposited) * 100 : 0;
    
    // Free Spin ROI Risk (if withdrawing free spin winnings)
    const freeSpinROI = freeSpinWinnings > 0 && deposited > 0 ? (freeSpinWinnings / deposited) * 100 : 0;
    
    // Cash Commitment Ratio (how much of your play is cash vs free)
    const totalPlayed = casino;
    const cashCommitment = totalPlayed > 0 ? (cashPlayed / totalPlayed) * 100 : 0;
    
    let statusHTML = "";
    
    // Alert 1: Sportsbook Withdrawal Ratio
    if (withdrawn > sports * 0.5 && sports > 0) {
        statusHTML += `<div style="color: #f87171; margin-bottom: 10px;"><strong>🚨 RED ALERT:</strong> Withdrawal > 50% of Sports Play. Risk of limits!</div>`;
    } else {
        statusHTML += `<div style="color: #4ade80; margin-bottom: 10px;"><strong>✅ Sports Health:</strong> Good ratio.</div>`;
    }

    // Alert 2: Casino Turnover
    if (turnover > 5) {
        statusHTML += `<div style="color: #4ade80; margin-bottom: 10px;"><strong>✅ Green Light:</strong> Casino Turnover is ${turnover.toFixed(1)}x (Target > 5x). Safe to withdraw using Method B.</div>`;
    } else {
        statusHTML += `<div style="color: #fbbf24; margin-bottom: 10px;"><strong>⚠️ Low Turnover:</strong> Only ${turnover.toFixed(1)}x. Grind more IGT BJ before withdrawing.</div>`;
    }
    
    // Alert 3: W/D Ratio Warning
    if (wdRatio > 200 && deposited > 0) {
        statusHTML += `<div style="color: #f87171; margin-bottom: 10px;"><strong>🚨 HIGH W/D RATIO:</strong> Withdrawing ${wdRatio.toFixed(0)}% of deposits. Risk of manual review. Consider churning more before withdrawal.</div>`;
    } else if (wdRatio > 150) {
        statusHTML += `<div style="color: #fbbf24; margin-bottom: 10px;"><strong>⚠️ Elevated W/D:</strong> ${wdRatio.toFixed(0)}% ratio. Monitor closely.</div>`;
    }
    
    // Alert 4: Free Spin ROI Risk (Bonus Hunter Flag)
    if (freeSpinROI > 50 && freeSpinWinnings > 0) {
        statusHTML += `<div style="color: #f87171; margin-bottom: 10px;"><strong>🚨 BONUS HUNTER RISK:</strong> ${freeSpinROI.toFixed(0)}% of deposits from free spins. High risk of "Bonus Hunter" flag. <strong>Action:</strong> Play more cash before withdrawing.</div>`;
    } else if (freeSpinROI > 25) {
        statusHTML += `<div style="color: #fbbf24; margin-bottom: 10px;"><strong>⚠️ Free Spin Alert:</strong> ${freeSpinROI.toFixed(0)}% from free spins. Mix in more cash play.</div>`;
    }
    
    // Alert 5: Cash Commitment (Order of Operations)
    if (cashCommitment < 30 && totalPlayed > 0) {
        statusHTML += `<div style="color: #fbbf24; margin-bottom: 10px;"><strong>⚠️ LOW CASH COMMITMENT:</strong> Only ${cashCommitment.toFixed(0)}% of play is cash. Signals risk-aversion. <strong>Fix:</strong> Play $20-50 cash before using free spins.</div>`;
    } else if (cashCommitment < 50) {
        statusHTML += `<div style="color: #60a5fa; margin-bottom: 10px;"><strong>💡 Strategy Tip:</strong> ${cashCommitment.toFixed(0)}% cash play. Mix cash and free spins for better profile.</div>`;
    }
    
    // Alert 6: Churn Warning (if withdrawing free spin winnings)
    if (freeSpinWinnings > 0 && withdrawn > 0 && freeSpinWinnings > withdrawn * 0.5) {
        const churnNeeded = Math.max(freeSpinWinnings * 0.5, 100);
        statusHTML += `<div style="color: #f87171; margin-bottom: 10px;"><strong>🚨 CHURN REQUIRED:</strong> Withdrawing free spin winnings without churn = "Hit and Run" flag. <strong>Action:</strong> Play through $${churnNeeded.toFixed(0)} more before withdrawing.</div>`;
    }
    
    // Alert 7: Deposit Padding Warning
    const freeSpinsUsed = (sessionStats.freeSpins || 0) < parseInt(healthFreeSpins?.value || 0);
    const daysSinceDeposit = sessionStats.lastDepositDate ? 
        Math.floor((new Date() - new Date(sessionStats.lastDepositDate)) / (1000 * 60 * 60 * 24)) : null;
    
    if (freeSpinsUsed && deposited === 0) {
        statusHTML += `<div style="color: #f87171; margin-bottom: 10px;"><strong>🚨 DEPOSIT PADDING NEEDED:</strong> Using free spins without a deposit = "Free-loader" flag. <strong>Action:</strong> Make a clean deposit (no bonus) before heavy free spin usage.</div>`;
    } else if (freeSpinsUsed && daysSinceDeposit !== null && daysSinceDeposit > 7) {
        statusHTML += `<div style="color: #fbbf24; margin-bottom: 10px;"><strong>⚠️ OLD DEPOSIT:</strong> Last deposit was ${daysSinceDeposit} days ago. Consider a fresh deposit before using free spins.</div>`;
    }

    healthStatus.style.display = 'block';
    healthStatus.className = 'health-status'; // Reset class
    healthStatus.innerHTML = statusHTML;
}

if (healthDeposit) {
    [healthDeposit, healthCasino, healthSports, healthWithdraw].forEach(el => {
        el.addEventListener('input', updateHealth);
    });
}

// Record deposit date (for deposit padding strategy)
const recordDepositBtn = document.getElementById('record-deposit-btn');
if (recordDepositBtn) {
    recordDepositBtn.addEventListener('click', () => {
        // Guard against null health input
        if (!healthDeposit) return;
        const depositAmount = parseFloat(healthDeposit.value) || 0;
        if (depositAmount > 0) {
            sessionStats.lastDepositDate = new Date().toISOString();
            sessionStats.deposit = depositAmount;
            
            // Show confirmation
            if (freeSpinsResult) {
                freeSpinsResult.style.display = 'block';
                freeSpinsResult.style.color = '#22c55e';
                freeSpinsResult.innerHTML = `
                    ✅ Deposit recorded: <strong>$${depositAmount.toFixed(2)}</strong><br>
                    <div style="margin-top: 8px; padding: 8px; background: rgba(59, 130, 246, 0.1); border-left: 3px solid #3b82f6; color: #60a5fa; font-size: 0.85em;">
                        💡 <strong>Deposit Padding Active:</strong> Having cash balance before using free spins improves your profile.
                    </div>
                `;
            }
        }
    });
}

// Free Spins Spending Logic
function spendFreeSpins() {
    if (!healthFreeSpins || !freeSpinsGame || !freeSpinsAmount || !spendFreeSpinsBtn || !freeSpinsResult) return;
    
    const availableSpins = parseInt(healthFreeSpins.value) || 0;
    const spinsToSpend = parseInt(freeSpinsAmount.value) || 1;
    const gameType = freeSpinsGame.value || 'slots';
    
    if (availableSpins < spinsToSpend) {
        freeSpinsResult.style.display = 'block';
        freeSpinsResult.style.color = '#f87171';
        freeSpinsResult.textContent = `❌ Not enough free spins! You have ${availableSpins} available.`;
        return;
    }
    
    // Game values per spin
    const gameValues = {
        'slots': 1,
        'blackjack': 5,
        'roulette': 2,
        'video-poker': 3
    };
    
    const valuePerSpin = gameValues[gameType] || 1;
    const totalValue = spinsToSpend * valuePerSpin;
    
    // Update stats - track free spin play separately from cash
    sessionStats.freeSpins = availableSpins - spinsToSpend;
    sessionStats.casinoPlayed += totalValue;
    // Note: free spin play is included in casinoPlayed but we track it separately for ratio calculations
    
    // Update UI
    healthFreeSpins.value = sessionStats.freeSpins;
    healthCasino.value = sessionStats.casinoPlayed;
    
    // Show result with strategic warning
    freeSpinsResult.style.display = 'block';
    freeSpinsResult.style.color = '#60a5fa';
    
    const cashPlayed = sessionStats.cashPlayed || 0;
    const totalPlayed = sessionStats.casinoPlayed || 0;
    const cashRatio = totalPlayed > 0 ? (cashPlayed / totalPlayed) * 100 : 0;
    
    let warning = '';
    if (cashRatio < 30 && totalPlayed > 50) {
        warning = `<div style="margin-top: 8px; padding: 8px; background: rgba(251, 191, 36, 0.1); border-left: 3px solid #fbbf24; color: #fbbf24; font-size: 0.85em;">
            ⚠️ <strong>Low Cash Ratio:</strong> Only ${cashRatio.toFixed(0)}% cash play. Consider playing $20-50 cash before more free spins.
        </div>`;
    }
    
    freeSpinsResult.innerHTML = `
        ✅ Spent <strong>${spinsToSpend}</strong> free spins on <strong>${gameType.replace('-', ' ')}</strong><br>
        Added <strong>$${totalValue.toFixed(2)}</strong> to Casino Play<br>
        Remaining free spins: <strong>${sessionStats.freeSpins}</strong>
        ${warning}
    `;
    
    // Update health status
    updateHealth();
    
    // Clear amount after spending
    freeSpinsAmount.value = 1;
}

// Track free spin winnings (when you win from free spins)
function recordFreeSpinWinnings(amount) {
    sessionStats.freeSpinWinnings = (sessionStats.freeSpinWinnings || 0) + amount;
    updateHealth();
}

// Event listeners for free spins
if (spendFreeSpinsBtn) {
    spendFreeSpinsBtn.addEventListener('click', spendFreeSpins);
}

if (healthFreeSpins) {
    healthFreeSpins.addEventListener('input', () => {
        sessionStats.freeSpins = parseInt(healthFreeSpins.value) || 0;
    });
}

// Record free spin winnings
const freeSpinWinningsInput = document.getElementById('free-spin-winnings');
const recordWinningsBtn = document.getElementById('record-winnings-btn');

if (recordWinningsBtn && freeSpinWinningsInput) {
    recordWinningsBtn.addEventListener('click', () => {
        const winnings = parseFloat(freeSpinWinningsInput.value) || 0;
        if (winnings > 0) {
            recordFreeSpinWinnings(winnings);
            freeSpinWinningsInput.value = 0;
            
            // Show confirmation
            if (freeSpinsResult) {
                freeSpinsResult.style.display = 'block';
                freeSpinsResult.style.color = '#22c55e';
                freeSpinsResult.innerHTML = `
                    ✅ Recorded <strong>$${winnings.toFixed(2)}</strong> in free spin winnings<br>
                    <div style="margin-top: 8px; padding: 8px; background: rgba(251, 191, 36, 0.1); border-left: 3px solid #fbbf24; color: #fbbf24; font-size: 0.85em;">
                        ⚠️ <strong>Churn Required:</strong> Play through at least $${(winnings * 0.5).toFixed(0)} before withdrawing to avoid "Hit and Run" flag.
                    </div>
                `;
            }
        }
    });
}

// Track cash play separately (when playing with deposited money, not free spins)
// This is called when user plays blackjack or other games with their own money
function recordCashPlay(amount) {
    sessionStats.cashPlayed = (sessionStats.cashPlayed || 0) + amount;
    sessionStats.casinoPlayed += amount;
    if (healthCasino) healthCasino.value = sessionStats.casinoPlayed;
    updateHealth();
}

/* --- Tab 4: Parlay Builder Logic --- */
const parlayOddsA = document.getElementById('parlay-odds-a');
const parlayOddsB = document.getElementById('parlay-odds-b');
const calcParlayBtn = document.getElementById('calc-parlay-btn');
const parlayResult = document.getElementById('parlay-result');
const fetchOddsBtn = document.getElementById('fetch-odds-btn');
const apiOddsResult = document.getElementById('api-odds-result');

// Mock API for fetching "Hot Parlays"
function fetchMockOdds() {
    if (!apiOddsResult) return;
    
    apiOddsResult.style.display = 'block';
    apiOddsResult.innerHTML = '<div style="text-align:center; color: #94a3b8;">🔄 Scanning markets...</div>';
    
    setTimeout(() => {
        // Generate random realistic opportunities
        const opportunities = [
            { event: "Chiefs vs Ravens", market: "Total Over 45.5", odds: 1.91, correlation: "High" },
            { event: "Lakers vs Celtics", market: "Lakers ML", odds: 2.10, correlation: "Medium" },
            { event: "Man City vs Arsenal", market: "Draw", odds: 3.50, correlation: "Low" },
            { event: "Djokovic vs Alcaraz", market: "Djokovic -1.5 Sets", odds: 1.85, correlation: "High" }
        ];
        
        // Pick 2 random
        const pick1 = opportunities[Math.floor(Math.random() * opportunities.length)];
        let pick2 = opportunities[Math.floor(Math.random() * opportunities.length)];
        while (pick1 === pick2) pick2 = opportunities[Math.floor(Math.random() * opportunities.length)];
        
        const parlayOdds = (pick1.odds * pick2.odds).toFixed(2);
        
        apiOddsResult.innerHTML = `
            <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; border: 1px solid #3b82f6;">
                <div style="color: #60a5fa; font-weight: bold; margin-bottom: 5px;">🚀 Hot Systematic Parlay Found</div>
                <div style="font-size: 0.9em; color: #cbd5e1; margin-bottom: 8px;">
                    1. <strong>${pick1.event}</strong>: ${pick1.market} (@${pick1.odds})<br>
                    2. <strong>${pick2.event}</strong>: ${pick2.market} (@${pick2.odds})
                </div>
                <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 5px; margin-top: 5px; display: flex; justify-content: space-between; align-items: center;">
                    <span>Combined Odds: <strong style="color: #fbbf24;">${parlayOdds}</strong></span>
                    <button class="btn btn-small" onclick="applyParlayOdds(${pick1.odds}, ${pick2.odds})">Use This</button>
                </div>
            </div>
        `;
    }, 1000);
}

// Helper to fill inputs
window.applyParlayOdds = function(odds1, odds2) {
    if (parlayOddsA && parlayOddsB) {
        parlayOddsA.value = odds1;
        parlayOddsB.value = odds2;
        // Trigger calc
        calcParlayBtn.click();
    }
};

if (fetchOddsBtn) {
    fetchOddsBtn.addEventListener('click', fetchMockOdds);
}

if (calcParlayBtn) {
    calcParlayBtn.addEventListener('click', () => {
        const oddsA = parseFloat(parlayOddsA.value) || 0;
        const oddsB = parseFloat(parlayOddsB.value) || 0;
        
        if (oddsA <= 1 || oddsB <= 1) {
            parlayResult.style.display = 'block';
            parlayResult.innerHTML = "Please enter valid decimal odds (> 1.0)";
            return;
        }

        // Simple EV / Arb calculation (simplified for this tool)
        // Calculate combined parlay odds
        const combinedOdds = oddsA * oddsB;
        
        // Calculate implied probability (vig included)
        const impliedProbA = (1 / oddsA) * 100;
        const impliedProbB = (1 / oddsB) * 100;
        const combinedImpliedProb = impliedProbA * impliedProbB / 100; // Rough approx
        
        // Determine "True Odds" (removing standard 4.5% vig per leg)
        const trueOddsA = oddsA * 1.045;
        const trueOddsB = oddsB * 1.045;
        const trueCombinedOdds = trueOddsA * trueOddsB;
        
        const ev = ((trueCombinedOdds - combinedOdds) / combinedOdds) * 100;
        
        let suggestion = "";
        let cssClass = "";
        
        if (combinedOdds > 6.0) {
            suggestion = "🔥 <strong>Perfect Camouflage!</strong> High odds (+500+) make you look like a 'Square'. Ideal for fixing stats.";
            cssClass = "result-good";
        } else if (combinedOdds > 3.0) {
            suggestion = "✅ Good Variance. Acceptable for maintenance.";
            cssClass = "result-good";
        } else {
            suggestion = "⚠️ Odds too low. Doesn't look like a 'fun' bet to the algorithm.";
            cssClass = "result-warning";
        }

        parlayResult.style.display = 'block';
        parlayResult.className = `parlay-result ${cssClass}`;
        parlayResult.innerHTML = `
            <strong>Total Odds: ${combinedOdds.toFixed(2)}</strong> (+${Math.round((combinedOdds-1)*100)})<br>
            ${suggestion}<br>
            <small>Est. Variance Score: High</small>
        `;
    });
}

/* --- Tab 3: Craps Logic --- */
const crapsBankroll = document.getElementById('craps-bankroll');
const crapsBaseBet = document.getElementById('craps-base-bet');
const crapsPoint = document.getElementById('craps-point');
const calcCrapsBtn = document.getElementById('calc-craps-btn');
const crapsResult = document.getElementById('craps-result');

if (calcCrapsBtn) {
    calcCrapsBtn.addEventListener('click', () => {
        const bankroll = parseFloat(crapsBankroll.value) || 0;
        const baseBet = parseFloat(crapsBaseBet.value) || 0;
        const point = crapsPoint.value;
        
        // Logic: Maximize Lay Odds (0% edge)
        let maxOddsMultiple = 6; // Standard max lay is usually 6x
        let layAmount = baseBet * maxOddsMultiple;
        
        // Check bankroll constraints (conservative: want 10 shooters life)
        // Standard Lay payout: 4/10 pays 1:2, 5/9 pays 2:3, 6/8 pays 5:6
        // We need to risk more to win less on Lay bets.
        // Laying against 4/10: Risk $40 to win $20.
        
        let riskAmount = 0;
        let winAmount = 0;
        let message = "";
        
        if (point === "4") { // 4 or 10
            // Pays 1:2. Risk 2 units to win 1.
            riskAmount = layAmount * 2; 
            winAmount = layAmount; 
            message = "Lay against 4/10 (Pays 1:2). High variance.";
        } else if (point === "5") { // 5 or 9
            // Pays 2:3. Risk 3 units to win 2.
            // Must be multiple of 3 usually?
            // Let's keep it simple. Risk 1.5x roughly.
            riskAmount = layAmount * 1.5;
            winAmount = layAmount;
            message = "Lay against 5/9 (Pays 2:3).";
        } else { // 6 or 8
            // Pays 5:6. Risk 6 units to win 5.
            riskAmount = layAmount * 1.2;
            winAmount = layAmount;
            message = "Lay against 6/8 (Pays 5:6). Safest lay.";
        }
        
        if (riskAmount + baseBet > bankroll) {
            crapsResult.innerHTML = `<div class="result-bad">⚠️ <strong>Bankroll Alert:</strong> Not enough funds to lay max odds. Reduce base bet to $${Math.floor(bankroll / 15)}.</div>`;
            crapsResult.style.display = 'block';
            return;
        }

        crapsResult.style.display = 'block';
        crapsResult.className = 'scanner-result result-good';
        crapsResult.innerHTML = `
            <strong>Strategy: Don't Pass + Lay Odds</strong><br>
            Base Bet (Don't Pass): <strong>$${baseBet}</strong><br>
            Lay Odds Amount: <strong>$${riskAmount.toFixed(0)}</strong> (To win $${winAmount.toFixed(0)})<br>
            <small>${message}. House Edge on Odds: 0.00%.</small>
        `;
    });
}

/* --- Tab 4: Poker Assistant Logic --- */
const pokerStack = document.getElementById('poker-stack');
const pokerPot = document.getElementById('poker-pot');
const calcPokerBtn = document.getElementById('calc-poker-btn');
const pokerResult = document.getElementById('poker-result');
const rangeBtns = document.querySelectorAll('.range-btn');
const rangeDisplay = document.getElementById('range-display');

if (calcPokerBtn) {
    calcPokerBtn.addEventListener('click', () => {
        const stack = parseFloat(pokerStack.value) || 0;
        const pot = parseFloat(pokerPot.value) || 0;
        
        if (pot === 0) return;
        
        const spr = stack / pot;
        let advice = "";
        let cssClass = "";
        
        if (spr < 3) {
            advice = "🚀 <strong>COMMIT MODE (SPR < 3):</strong> Top Pair is the nuts. Do not fold. Shove over bets.";
            cssClass = "result-good";
        } else if (spr < 6) {
            advice = "⚠️ <strong>CAUTION (SPR 3-6):</strong> Play strong draws and 2-pair+ aggressively. Tread lightly with 1-pair.";
            cssClass = "result-warning";
        } else {
            advice = "🧠 <strong>DEEP STACK (SPR > 6):</strong> Implied odds matter. Set mine, chase flushes. Fold Top Pair easily to aggression.";
            cssClass = "result-good"; // Neutral/Good info
        }
        
        pokerResult.style.display = 'block';
        pokerResult.className = `scanner-result ${cssClass}`;
        pokerResult.innerHTML = `
            <strong>SPR: ${spr.toFixed(1)}</strong><br>
            ${advice}
        `;
    });
}

// Simple Pre-Flop Ranges (Text/Visual representation)
const ranges = {
    'UTG': '<div style="display: grid; grid-template-columns: repeat(13, 1fr); gap: 2px; font-size: 10px;">' +
           '<div style="background:#4ade80">AA</div><div style="background:#4ade80">AKs</div><div style="background:#4ade80">AQs</div>' + 
           // ... Simplified representation for demo (can be expanded)
           '<div style="grid-column: span 13; margin-top: 5px; color: #cbd5e1;">Open: 77+, AJs+, KQs, AQo+</div></div>',
    'HJ': '<div style="color: #cbd5e1;">Open: 66+, ATs+, KJs+, QJs, JTs, AJo+, KQo</div>',
    'CO': '<div style="color: #cbd5e1;">Open: 44+, A2s+, K9s+, Q9s+, J9s+, T9s, ATo+, KTo+, QTo+</div>',
    'BTN': '<div style="color: #cbd5e1;">Open: 22+, A2s+, K2s+, Q5s+, J7s+, T7s+, 96s+, 86s+, A2o+, K7o+, Q9o+, J9o+ (Steal Wide)</div>',
    'SB': '<div style="color: #cbd5e1;">Vs BB 3Bet: Continue with 88+, AJs+, KQs, AQo+. Fold weak pairs.</div>',
    'BB': '<div style="color: #cbd5e1;">Defend wide vs LP opens. 3-Bet value (QQ+) and bluffs (A5s).</div>'
};

rangeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Reset active state
        rangeBtns.forEach(b => b.style.borderColor = 'transparent');
        btn.style.borderColor = '#3b82f6';
        
        const pos = btn.getAttribute('data-pos');
        rangeDisplay.style.display = 'block';
        rangeDisplay.innerHTML = `<strong>${pos} Range Strategy:</strong><br>${ranges[pos] || 'No data'}`;
    });
});

// Initialize game
// Initialize the shoe (deck) - only called when starting fresh or reshuffling
function initializeShoe() {
    createDeck();
    shuffleDeck();
    // Reset running count when shoe is shuffled (cut card reached)
    runningCount = 0;
    updateCountDisplay();
    updateCardsRemaining();
    showMessage('Shuffling new shoe...', 'tie');
    setTimeout(() => {
        clearMessage();
    }, 1500);
}

// Start a new hand - clears hands but keeps the deck (for card counting)
function startNewHand() {
    // Check if we need to reshuffle (cut card logic)
    const cardsDealt = 52 * numberOfDecks - deck.length;
    const cardsLeft = maxCardsInShoe - cardsDealt;
    
    // If we're at or below the cut card threshold (e.g., 15 cards remaining), reshuffle
    if (cardsLeft <= 15 || deck.length === 0) {
        initializeShoe();
    }
    
    // Clear hands and game state for new round
    playerHand = [];
    playerHand2 = [];
    isSplit = false;
    currentHand = 1;
    dealerHand = [];
    currentBet = 0;
    bet2 = 0;
    insuranceBet = 0;
    gameInProgress = false;
    playerHasHit = false;
    playerHasHit2 = false;
    dealerPlaying = false;
    currentManualTarget = null;
    
    // Update UI
    updateUI();
    updateManualCardPadVisibility();
    clearMessage();
}

// Full game reset - resets everything including balance and count
function initGame() {
    initializeShoe();
    playerHand = [];
    playerHand2 = [];
    isSplit = false;
    currentHand = 1;
    dealerHand = [];
    currentBet = 0;
    bet2 = 0;
    insuranceBet = 0;
    gameInProgress = false;
    playerHasHit = false;
    playerHasHit2 = false;
    dealerPlaying = false;
    balance = 10000; // Reset balance to $10000
    currentManualTarget = null;
    cardHistory = []; // Clear card history on full reset
    // Don't reset suits mode or selected suit - user preference persists
    updateCountDisplay();
    updateCardHistory();
    updateCardsRemaining();
    updateUI();
    updateManualCardPadVisibility();
    clearMessage();
}

// Create deck(s) - can create multiple decks
function createDeck() {
    deck = [];
    // Create the specified number of decks
    for (let deckNum = 0; deckNum < numberOfDecks; deckNum++) {
        for (let suit of suits) {
            for (let value of values) {
                deck.push({ suit, value });
            }
        }
    }
    // Calculate max cards based on penetration
    const totalCards = 52 * numberOfDecks;
    maxCardsInShoe = Math.floor(totalCards * (penetrationPercent / 100));
    // Reset running count when new deck is created (deck is shuffled)
    runningCount = 0;
    updateCountDisplay();
    updateCardsRemaining();
}

// Shuffle deck using Fisher-Yates algorithm
function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

// Get card count value (Hi-Lo system)
// +1 for 2, 3, 4, 5, 6
// 0 for 7, 8, 9
// -1 for 10, J, Q, K, A
function getCardCountValue(card) {
    const value = card.value;
    if (['2', '3', '4', '5', '6'].includes(value)) {
        return 1;
    } else if (['7', '8', '9'].includes(value)) {
        return 0;
    } else {
        // 10, J, Q, K, A
        return -1;
    }
}

// Update running count display
function updateCountDisplay() {
    // Check if count actually changed
    const countChanged = previousRunningCount !== runningCount;
    
    runningCountEl.textContent = runningCount > 0 ? `+${runningCount}` : runningCount;
    // Color code: positive = green, negative = red, zero = white
    if (runningCount > 0) {
        runningCountEl.className = 'count-positive';
    } else if (runningCount < 0) {
        runningCountEl.className = 'count-negative';
    } else {
        runningCountEl.className = 'count-zero';
    }
    
    // Update tracker display if it exists
    if (trackerRunningCountEl) {
        trackerRunningCountEl.textContent = runningCount > 0 ? `+${runningCount}` : runningCount;
        trackerRunningCountEl.className = runningCount > 0 ? 'count-positive' : runningCount < 0 ? 'count-negative' : 'count-zero';
    }
    
    // Update true count in tracker
    updateTrackerTrueCount();
    
    // If count changed, update strategy advisor
    if (countChanged) {
        previousRunningCount = runningCount;
        updateStrategyAdvisor();
    }
}

// Update true count display in tracker
function updateTrackerTrueCount() {
    if (!trackerTrueCountEl) return;
    
    // Calculate true count (running count / decks remaining)
    const cardsDealt = 52 * numberOfDecks - deck.length;
    const estimatedDecksRemaining = Math.max(1, (52 * numberOfDecks - cardsDealt) / 52);
    const trueCount = Math.floor(runningCount / estimatedDecksRemaining);
    
    trackerTrueCountEl.textContent = trueCount > 0 ? `+${trueCount}` : trueCount;
    trackerTrueCountEl.className = trueCount > 0 ? 'count-positive' : trueCount < 0 ? 'count-negative' : 'count-zero';
}

// Update cards remaining display
function updateCardsRemaining() {
    if (cardsRemainingEl) {
        const cardsDealt = 52 * numberOfDecks - deck.length;
        const cardsLeft = Math.max(0, maxCardsInShoe - cardsDealt);
        cardsRemainingEl.textContent = cardsLeft;
        
        // Change color based on how many cards are left
        cardsRemainingEl.className = ''; // Clear previous classes
        if (cardsLeft <= maxCardsInShoe * 0.2) {
            cardsRemainingEl.classList.add('cards-low');
        } else if (cardsLeft <= maxCardsInShoe * 0.5) {
            cardsRemainingEl.classList.add('cards-medium');
        } else {
            cardsRemainingEl.classList.add('cards-normal');
        }
    }
}

// Remove a specific card from the deck (removes only one instance)
function removeCardFromDeck(suit, value) {
    const index = deck.findIndex(card => card.suit === suit && card.value === value);
    if (index !== -1) {
        deck.splice(index, 1);
        updateCardsRemaining();
        return true;
    }
    return false;
}

// Burn a card from the shoe without adding it to any hand (manual pad quick entry)
function burnCardFromShoe(suit, value) {
    const removed = removeCardFromDeck(suit, value);
    if (!removed) {
        showMessage(`Card ${value}${suit} is not available in the deck!`, 'lose');
        return;
    }
    const countDelta = getCardCountValue({ value });
    runningCount += countDelta;
    updateCountDisplay();
    updateCardsRemaining();

    // Track in history (respect suits if enabled)
    if (suitsModeEnabled) {
        cardHistory.push({ value, suit, count: countDelta });
    } else {
        cardHistory.push({ value, count: countDelta });
    }
    if (cardHistory.length > MAX_HISTORY) {
        cardHistory.shift();
    }
    updateCardHistory();
    showMessage(`Burned ${value}${suit} from the shoe (count ${countDelta > 0 ? '+' : ''}${countDelta})`, 'tie');
}

// Deal a card from the deck (only used when manual entry is disabled)
function dealCard() {
    // Check if we've reached penetration limit (safety net - should be caught in startNewHand)
    const cardsDealt = 52 * numberOfDecks - deck.length;
    if (cardsDealt >= maxCardsInShoe || deck.length === 0) {
        // Reshuffle silently during gameplay (cut card check should happen before dealing)
        initializeShoe(false);
    }
    const card = deck.pop();
    // Update running count
    runningCount += getCardCountValue(card);
    updateCountDisplay();
    updateCardsRemaining();
    return card;
}

// Show card selection modal for manual entry
function showCardSelectionModal(target) {
    if (!manualEntryEnabled) return;
    currentManualTarget = target;
    if (cardSelectionModalEl) {
        cardSelectionModalEl.style.display = 'flex';
    }
}

// Hide card selection modal
function hideCardSelectionModal() {
    currentManualTarget = null;
    if (cardSelectionModalEl) {
        cardSelectionModalEl.style.display = 'none';
    }
}

// Render the manual card touchpad buttons
function renderManualCardPad() {
    if (!manualCardPadEl) return;
    manualCardPadEl.innerHTML = '';
    const defaultSuit = selectedSuit || '♠';
    const groups = [
        { label: 'Low Cards (+1)', values: ['2','3','4','5','6'] },
        { label: 'Neutral (0)', values: ['7','8','9'] },
        { label: 'High Cards (-1)', values: ['10','J','Q','K','A'] },
    ];

    const makeCardButton = (val) => {
        const suit = selectedSuit || defaultSuit;
        const isRed = suit === '♥' || suit === '♦';
        const btn = document.createElement('button');
        btn.className = `card-pad-button ${isRed ? 'red' : 'black'}`;
        btn.setAttribute('data-suit', suit);
        btn.setAttribute('data-value', val);

        const cardFace = document.createElement('div');
        cardFace.className = `card-pad-card ${isRed ? 'red' : 'black'}`;
        const top = document.createElement('div');
        top.className = 'corner';
        top.textContent = val;
        const center = document.createElement('div');
        center.className = 'suit';
        center.textContent = suit;
        const bottom = document.createElement('div');
        bottom.className = 'corner bottom';
        bottom.textContent = val;
        cardFace.appendChild(top);
        cardFace.appendChild(center);
        cardFace.appendChild(bottom);
        btn.appendChild(cardFace);

        btn.addEventListener('click', () => {
            if (!manualEntryEnabled) {
                showMessage('Enable manual entry first.', 'lose');
                return;
            }
            // Touchpad now burns a card from the shoe without placing it in hands
            burnCardFromShoe(suit, val);
        });

        return btn;
    };

    groups.forEach(group => {
        const block = document.createElement('div');
        block.className = 'card-pad-suit';
        const label = document.createElement('div');
        label.className = 'suit-label';
        label.textContent = group.label;
        block.appendChild(label);

        const row = document.createElement('div');
        row.className = 'card-pad-row';
        group.values.forEach(val => row.appendChild(makeCardButton(val)));

        block.appendChild(row);
        manualCardPadEl.appendChild(block);
    });
}

function updateManualCardPadVisibility() {
    if (!manualCardPadEl) return;
    manualCardPadEl.style.display = manualEntryEnabled ? 'grid' : 'none';
}

// Check for blackjack after manual cards are added (when initial 2 cards are in place)
function checkForBlackjackAfterManualEntry() {
    // Only check if we have exactly 2 cards in each hand (blackjack is only possible with 2 cards)
    // Don't decide the hand until player has at least 2 cards
    if (playerHand.length === 2 && dealerHand.length === 2 && gameInProgress) {
        const dealerBlackjack = isBlackjack(dealerHand);
        const playerBlackjack = isBlackjack(playerHand);
        
        if (dealerBlackjack) {
            // Reveal dealer's hidden card immediately
            dealerPlaying = true;
            updateUI();
            
            // Disable all player action buttons immediately
            hitBtn.disabled = true;
            doubleBtn.disabled = true;
            splitBtn.disabled = true;
            insuranceBtn.disabled = true;
            surrenderBtn.disabled = true;
            standBtn.disabled = true;
            
            // Handle insurance payout (pays 2:1 if dealer has blackjack)
            if (insuranceBet > 0) {
                const insuranceWin = insuranceBet * 2;
                balance += insuranceBet + insuranceWin; // Return bet + 2:1 payout
                showMessage(`Insurance pays! You won $${insuranceWin.toLocaleString()}`, 'win');
            }
            
            // Check if player also has blackjack
            if (playerBlackjack) {
                // Both have blackjack - tie (main bet is returned)
                setTimeout(() => {
                    endGame('tie', "Both Blackjack!");
                }, 500);
            } else {
                // Only dealer has blackjack - player loses main bet (but insurance pays if taken)
                setTimeout(() => {
                    endGame('lose', 'Dealer Blackjack!');
                }, 500);
            }
            return;
        }
        
        // Check for player blackjack (only if dealer doesn't have one)
        if (playerBlackjack && !manualEntryEnabled) {
            setTimeout(() => stand(), 800); // Auto-stand on blackjack (only in auto mode)
        } else if (playerBlackjack && manualEntryEnabled) {
            showMessage('Blackjack! Add more cards or click "End Game" to determine result.', 'win');
        }
    }
}

// Add a card manually to the specified hand
function addManualCardToHand(suit, value, target) {
    // With multiple decks, we can have multiple copies of the same card
    // Check if this card exists in the deck (at least one copy)
    const cardExists = deck.some(card => card.suit === suit && card.value === value);
    
    if (!cardExists) {
        showMessage(`Card ${value}${suit} is not available in the deck!`, 'lose');
        return false;
    }
    
    // No need to check if card is already in play - multiple decks allow duplicates
    const card = { suit, value };
    
    // Add to the appropriate hand
    if (target === 'player') {
        playerHand.push(card);
    } else if (target === 'player2') {
        playerHand2.push(card);
    } else if (target === 'dealer') {
        dealerHand.push(card);
    } else {
        return false;
    }
    
    // Remove one instance from deck (supports multiple decks)
    removeCardFromDeck(suit, value);
    
    // Update running count
    runningCount += getCardCountValue(card);
    updateCountDisplay();
    updateCardsRemaining();
    
    // Update UI
    updateUI();
    
    // Check for blackjack if initial deal is complete
    checkForBlackjackAfterManualEntry();
    
    // In manual entry mode, check strategy advisor for win conditions
    if (manualEntryEnabled && gameInProgress) {
        checkWinConditionsFromStrategy();
    }
    
    showMessage(`Added ${value}${suit} to ${target === 'player' ? 'player' : target === 'player2' ? 'player hand 2' : 'dealer'}`, 'tie');
    return true;
}

// Check win conditions based on strategy advisor
function checkWinConditionsFromStrategy() {
    if (!gameInProgress || !manualEntryEnabled) return;
    
    const strategy = getBasicStrategy();
    const playerValue = calculateHandValue(playerHand);
    const dealerValue = dealerHand.length >= 2 ? calculateHandValue(dealerHand) : 0;
    
    // Only check win conditions if player has at least 2 cards
    if (playerHand.length < 2) return;
    
    // Check if player has busted
    if (strategy.action === 'bust' || playerValue > 21) {
        // Player busted - reveal dealer cards and end game
        if (!dealerPlaying) {
            dealerPlaying = true;
            updateUI();
        }
        setTimeout(() => {
            endGame();
        }, 500);
        return;
    }
    
    // Check if player has blackjack (and dealer doesn't)
    if (strategy.action === 'blackjack' && playerHand.length === 2) {
        // Player has blackjack - reveal dealer cards and check result
        if (!dealerPlaying) {
            dealerPlaying = true;
            updateUI();
        }
        // If dealer also has blackjack, it's a tie, otherwise player wins
        if (dealerHand.length >= 2) {
            const dealerBlackjack = isBlackjack(dealerHand);
            if (!dealerBlackjack) {
                // Player wins with blackjack
                setTimeout(() => {
                    endGame();
                }, 500);
            } else {
                // Both have blackjack - tie
                setTimeout(() => {
                    endGame();
                }, 500);
            }
        }
        return;
    }
    
    // Check dealer conditions (only if dealer has at least 2 cards)
    if (dealerHand.length >= 2) {
        // If dealer busts (over 21), reveal cards and end game
        if (dealerValue > 21) {
            if (!dealerPlaying) {
                dealerPlaying = true;
                updateUI();
            }
            setTimeout(() => {
                endGame();
            }, 500);
            return;
        }
        
        // If dealer has reached 17+, reveal cards and end game automatically
        // This handles dealer cards added after player's decision
        if (dealerValue >= 17 && dealerValue <= 21) {
            // Dealer has reached 17+ - reveal dealer cards if not already revealed
            if (!dealerPlaying) {
                dealerPlaying = true;
                updateUI();
            }
            // Always end the round when dealer reaches 17+ and determine result
            // Use a small delay to ensure UI is updated
            setTimeout(() => {
                endGame();
            }, 500);
            return;
        }
        
        // If player has a valid hand (not busted) and dealer is still below 17,
        // wait for more dealer cards (dealer must hit until 17+)
        // User will add dealer cards manually until dealer reaches 17+
    }
}

// Calculate hand value (handles Aces)
function calculateHandValue(hand) {
    let value = 0;
    let aces = 0;

    for (let card of hand) {
        if (card.value === 'A') {
            aces++;
            value += 11;
        } else if (['J', 'Q', 'K'].includes(card.value)) {
            value += 10;
        } else {
            value += parseInt(card.value);
        }
    }

    // Adjust for Aces
    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }

    return value;
}

// Create card element
function createCardElement(card, hidden = false, index = 0, target = null) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    
    if (hidden) {
        cardDiv.className = 'card hidden-card';
        return cardDiv;
    }

    const isRed = card.suit === '♥' || card.suit === '♦';
    cardDiv.classList.add(isRed ? 'red' : 'black');

    cardDiv.innerHTML = `
        <div class="card-value">${card.value}</div>
        <div class="card-suit">${card.suit}</div>
        <div class="card-value" style="transform: rotate(180deg);">${card.value}</div>
    `;

    return cardDiv;
}

// Create empty clickable card slot for manual entry
function createEmptyCardSlot(target, position = 0) {
    const slotDiv = document.createElement('div');
    slotDiv.className = 'card empty-card-slot';
    slotDiv.style.cursor = 'pointer';
    slotDiv.style.border = '2px dashed #4CAF50';
    slotDiv.style.backgroundColor = '#f0f0f0';
    slotDiv.style.display = 'flex';
    slotDiv.style.alignItems = 'center';
    slotDiv.style.justifyContent = 'center';
    slotDiv.style.minWidth = '60px';
    slotDiv.style.minHeight = '84px';
    slotDiv.innerHTML = '<span style="color: #4CAF50; font-size: 0.8em;">+</span>';
    slotDiv.title = 'Click to add card';
    slotDiv.addEventListener('click', () => {
        if (manualEntryEnabled) {
            showCardSelectionModal(target);
        }
    });
    return slotDiv;
}

// Update UI
function updateUI() {
    // Update balance
    balanceEl.textContent = balance.toLocaleString();
    
    // Count display is updated automatically when cards are dealt
    // Cards remaining is updated automatically when cards are dealt

    // Update player cards and score
    playerCardsEl.innerHTML = '';
    playerHand.forEach((card, index) => {
        playerCardsEl.appendChild(createCardElement(card, false, index));
    });
    
    // Add empty slot for manual entry if enabled (always show during game for adding more cards)
    if (manualEntryEnabled) {
        playerCardsEl.appendChild(createEmptyCardSlot('player', playerHand.length));
    }
    
    const playerValue = calculateHandValue(playerHand);
    if (isSplit) {
        playerScoreEl.textContent = `Hand 1: ${playerValue}${currentHand === 1 ? ' (Playing)' : ''}`;
        
        // Show second hand
        hand2ContainerEl.style.display = 'block';
        playerCards2El.innerHTML = '';
        playerHand2.forEach((card, index) => {
            playerCards2El.appendChild(createCardElement(card, false, index));
        });
        // Add empty slot for hand 2 if manual entry enabled
        if (manualEntryEnabled) {
            playerCards2El.appendChild(createEmptyCardSlot('player2', playerHand2.length));
        }
        const playerValue2 = calculateHandValue(playerHand2);
        playerScore2El.textContent = `Hand 2: ${playerValue2}${currentHand === 2 ? ' (Playing)' : ''}`;
    } else {
        playerScoreEl.textContent = `Score: ${playerValue}`;
        hand2ContainerEl.style.display = 'none';
    }

    // Update dealer cards and score
    // CRITICAL: Only show dealer's second card if dealerPlaying is true
    dealerCardsEl.innerHTML = '';
    
    // ALWAYS hide second card unless dealer is actively playing
    if (gameInProgress && !dealerPlaying) {
        // Player's turn - ALWAYS hide second card
        if (dealerHand.length > 0) {
            dealerCardsEl.appendChild(createCardElement(dealerHand[0], false, 0));
        }
        if (dealerHand.length > 1) {
            // Second card MUST be hidden during player's turn - NEVER show it
            dealerCardsEl.appendChild(createCardElement(dealerHand[1], true, 1));
        }
        // Add empty slot for manual entry if enabled (allow adding during game)
        if (manualEntryEnabled) {
            dealerCardsEl.appendChild(createEmptyCardSlot('dealer', dealerHand.length));
        }
        dealerScoreEl.textContent = 'Score: ?';
    } else if (dealerPlaying || !gameInProgress) {
        // Dealer is playing OR game ended - show all cards
        dealerHand.forEach((card, index) => {
            dealerCardsEl.appendChild(createCardElement(card, false, index));
        });
        // Add empty slot for manual entry if enabled (always show during game in manual mode)
        if (manualEntryEnabled && gameInProgress) {
            dealerCardsEl.appendChild(createEmptyCardSlot('dealer', dealerHand.length));
        }
        const dealerValue = calculateHandValue(dealerHand);
        dealerScoreEl.textContent = `Score: ${dealerValue}`;
    }

    // Update button states
    const activeHand = getActiveHand();
    const activeHasHit = currentHand === 1 ? playerHasHit : playerHasHit2;
    const activeBet = currentHand === 1 ? currentBet : bet2;
    
    // Enable betting buttons when game is not in progress (round ended, ready for next bet)
    // This allows continuous play without pressing "Reset Shoe" (which reshuffles)
    // CRITICAL: When gameInProgress is false, buttons should be enabled (unless balance is 0)
    // Make this logic explicit and aggressive to ensure buttons are always enabled when they should be
    if (!gameInProgress && balance > 0) {
        // Game has ended, enable betting buttons for next round
        // Use multiple methods to ensure button is truly enabled
        placeBetBtn.disabled = false;
        placeBetBtn.removeAttribute('disabled');
        placeBetBtn.style.pointerEvents = 'auto';
        placeBetBtn.style.opacity = '1';
        placeBetBtn.style.cursor = 'pointer';
        
        useRecommendedBtn.disabled = false;
        useRecommendedBtn.removeAttribute('disabled');
        useRecommendedBtn.style.pointerEvents = 'auto';
        useRecommendedBtn.style.opacity = '1';
        useRecommendedBtn.style.cursor = 'pointer';
    } else {
        // Game is in progress or balance is 0, disable buttons
        placeBetBtn.disabled = gameInProgress || balance <= 0;
        useRecommendedBtn.disabled = gameInProgress || balance <= 0;
    }
    // Disable hit button in manual entry mode (cards are added manually)
    hitBtn.disabled = !gameInProgress || manualEntryEnabled || dealerPlaying;
    // Double is only available on first two cards and if player has enough balance
    // Also disable in manual entry mode
    doubleBtn.disabled = !gameInProgress || activeHasHit || activeHand.length !== 2 || balance < activeBet || manualEntryEnabled || dealerPlaying;
    // Split is only available on pairs, first two cards, before hitting, and if not already split
    splitBtn.disabled = !gameInProgress || !canSplit() || dealerPlaying;
    // Insurance is only available when dealer shows Ace, before any player actions, on first hand only
    const maxInsurance = Math.floor(currentBet / 2);
    insuranceBtn.disabled = !gameInProgress || dealerPlaying || !isDealerAce() || isSplit || playerHasHit || insuranceBet > 0 || balance < maxInsurance || playerHand.length !== 2;
    // Surrender is only available on first two cards, before hitting or doubling, first hand only
    surrenderBtn.disabled = !gameInProgress || dealerPlaying || isSplit || playerHasHit || playerHand.length !== 2;
    standBtn.disabled = !gameInProgress || dealerPlaying;
    // "Reset Shoe" button - always available, but clearly indicates it will reshuffle
    // This is a HARD RESET that reshuffles the deck and resets the count
    // Users should use "Place Bet" for continuous play (keeps deck)
    newGameBtn.disabled = false;
    newGameBtn.textContent = 'Reset Shoe'; // Clear label: this reshuffles and resets everything
    // Deck count selector - only enabled when no game in progress
    deckCountEl.disabled = gameInProgress;
    // Penetration slider - only enabled when no game in progress
    if (penetrationSliderEl) {
        penetrationSliderEl.disabled = gameInProgress;
    }
    
    // Update strategy advisor
    updateStrategyAdvisor();
}

// Get dealer's up card value
function getDealerUpCard() {
    if (dealerHand.length === 0) return null;
    const card = dealerHand[0];
    if (card.value === 'A') return 11;
    if (['J', 'Q', 'K'].includes(card.value)) return 10;
    return parseInt(card.value);
}

// Check if dealer's up card is an Ace
function isDealerAce() {
    if (dealerHand.length === 0) return false;
    return dealerHand[0].value === 'A';
}

// Check if hand is soft (contains Ace counted as 11)
function isSoftHand(hand) {
    let value = 0;
    let hasAce = false;
    
    for (let card of hand) {
        if (card.value === 'A') {
            hasAce = true;
            value += 11;
        } else if (['J', 'Q', 'K'].includes(card.value)) {
            value += 10;
        } else {
            value += parseInt(card.value);
        }
    }
    
    return hasAce && value <= 21;
}

// Get hand description for display
function getHandDescription() {
    const playerValue = calculateHandValue(playerHand);
    const isSoft = isSoftHand(playerHand);
    
    if (playerValue === 21 && playerHand.length === 2) {
        return 'Blackjack';
    }
    
    if (isSoft && playerHand.length === 2) {
        return `Soft ${playerValue}`;
    }
    
    return `Hard ${playerValue}`;
}

// Get dealer card description
function getDealerCardDescription() {
    if (dealerHand.length === 0) return '?';
    const card = dealerHand[0];
    if (card.value === 'A') return 'A';
    if (['J', 'Q', 'K'].includes(card.value)) return card.value;
    return card.value;
}

// Get basic strategy recommendation with count integration
function getBasicStrategy() {
    const activeHand = getActiveHand();
    if (!gameInProgress || activeHand.length === 0 || dealerHand.length === 0) {
        return { action: 'wait', reason: 'Place a bet to get strategy advice' };
    }
    
    const playerValue = calculateHandValue(activeHand);
    const dealerUpCard = getDealerUpCard();
    const dealerCardDesc = getDealerCardDescription();
    const isSoft = isSoftHand(activeHand);
    const activeHasHit = currentHand === 1 ? playerHasHit : playerHasHit2;
    const activeBet = currentHand === 1 ? currentBet : bet2;
    const canDouble = !activeHasHit && activeHand.length === 2 && balance >= activeBet;
    const canSplitHand = canSplit();
    const handDesc = getHandDescription();
    
    // Check for splitting first (if pair and can split)
    if (canSplitHand && activeHand.length === 2 && !isSplit) {
        const card1Value = activeHand[0].value;
        const card2Value = activeHand[1].value;
        const splitValue = getCardSplitValue(card1Value);
        const shouldSplit = shouldSplitPair(splitValue, dealerUpCard);
        if (shouldSplit) {
            // Display appropriate pair description
            let pairDesc = '';
            if (['10', 'J', 'Q', 'K'].includes(card1Value) && ['10', 'J', 'Q', 'K'].includes(card2Value)) {
                pairDesc = `${card1Value} & ${card2Value}`;
            } else {
                pairDesc = `${card1Value}s`;
            }
            return { action: 'split', reason: `Pair of ${pairDesc} vs ${dealerCardDesc}: Split pairs` };
        }
    }
    
    // Player busted
    if (playerValue > 21) {
        return { action: 'bust', reason: `${handDesc} vs ${dealerCardDesc}: You have busted!` };
    }
    
    // Blackjack
    if (playerValue === 21 && currentHand.length === 2) {
        return { action: 'blackjack', reason: `${handDesc} vs ${dealerCardDesc}: Blackjack! Stand automatically` };
    }
    
    // Helper function to adjust action based on count
    const adjustForCount = (baseAction, baseReason, threshold = 2) => {
        if (Math.abs(runningCount) < threshold) {
            return { action: baseAction, reason: baseReason };
        }
        
        // Positive count adjustments (favor player - be more aggressive)
        if (runningCount >= threshold) {
            if (baseAction === 'stand' && runningCount >= 3) {
                // With high positive count, sometimes hit when you'd normally stand
                if (playerValue <= 16 && dealerUpCard >= 7) {
                    return { action: 'hit', reason: `${handDesc} vs ${dealerCardDesc}: Hit (positive count ${runningCount > 0 ? '+' : ''}${runningCount} favors more aggressive play)` };
                }
            }
            // Only suggest doubling on hit if it's a reasonable double situation (9-11, or soft hands)
            // Never double on weak hands like 12-16 vs strong dealer cards (7-A)
            if (baseAction === 'hit' && canDouble && runningCount >= 2) {
                // Only suggest doubling if it's a reasonable double situation
                // Don't double on weak totals (12-16) vs strong dealer cards (7-A)
                if (playerValue >= 9 && playerValue <= 11 && dealerUpCard <= 9) {
                    // Reasonable double situations (9-11 vs 2-9)
                    return { action: 'double', reason: `${handDesc} vs ${dealerCardDesc}: Double (positive count ${runningCount > 0 ? '+' : ''}${runningCount} favors doubling)` };
                }
                // For other situations, keep the base action
            }
            return { action: baseAction, reason: `${baseReason} (count ${runningCount > 0 ? '+' : ''}${runningCount} supports this play)` };
        }
        
        // Negative count adjustments (favor dealer - be more conservative)
        if (runningCount <= -threshold) {
            if (baseAction === 'hit' && playerValue >= 12 && dealerUpCard <= 6) {
                // With negative count, stand more often against weak dealer cards
                return { action: 'stand', reason: `${handDesc} vs ${dealerCardDesc}: Stand (negative count ${runningCount} suggests being more conservative)` };
            }
            if (baseAction === 'double' && runningCount <= -2) {
                // With negative count, avoid doubling
                return { action: 'hit', reason: `${handDesc} vs ${dealerCardDesc}: Hit instead of double (negative count ${runningCount} suggests caution)` };
            }
            return { action: baseAction, reason: `${baseReason} (count ${runningCount} suggests being conservative)` };
        }
        
        return { action: baseAction, reason: baseReason };
    };
    
    // Soft hands (Ace counted as 11)
    if (isSoft && playerHand.length === 2) {
        if (playerValue >= 19) {
            return adjustForCount('stand', `${handDesc} vs ${dealerCardDesc}: Stand (always stand on soft 19+)`);
        }
        if (playerValue === 18) {
            if (dealerUpCard >= 9) {
                const base = canDouble ? 
                    { action: 'double', reason: `${handDesc} vs ${dealerCardDesc}: Double if allowed, else hit` } : 
                    { action: 'hit', reason: `${handDesc} vs ${dealerCardDesc}: Hit` };
                return adjustForCount(base.action, base.reason);
            }
            return adjustForCount('stand', `${handDesc} vs ${dealerCardDesc}: Stand`);
        }
        if (playerValue === 17) {
            if (dealerUpCard >= 7) {
                const base = canDouble ? 
                    { action: 'double', reason: `${handDesc} vs ${dealerCardDesc}: Double if allowed, else hit` } : 
                    { action: 'hit', reason: `${handDesc} vs ${dealerCardDesc}: Hit` };
                return adjustForCount(base.action, base.reason);
            }
            const base = canDouble ? 
                { action: 'double', reason: `${handDesc} vs ${dealerCardDesc}: Double` } : 
                { action: 'hit', reason: `${handDesc} vs ${dealerCardDesc}: Hit` };
            return adjustForCount(base.action, base.reason);
        }
        if (playerValue <= 16) {
            // Soft 13-16: Double vs 2-6, Hit vs 7-A
            if (dealerUpCard >= 2 && dealerUpCard <= 6) {
                const base = canDouble ? 
                    { action: 'double', reason: `${handDesc} vs ${dealerCardDesc}: Double` } : 
                    { action: 'hit', reason: `${handDesc} vs ${dealerCardDesc}: Hit` };
                return adjustForCount(base.action, base.reason);
            } else {
                // Dealer showing 7-A: Always hit
                return adjustForCount('hit', `${handDesc} vs ${dealerCardDesc}: Hit`);
            }
        }
    }
    
    // Hard totals
    if (playerValue >= 17) {
        return adjustForCount('stand', `${handDesc} vs ${dealerCardDesc}: Stand (always stand on 17+)`);
    }
    
    if (playerValue === 16) {
        if (dealerUpCard >= 2 && dealerUpCard <= 6) {
            return adjustForCount('stand', `${handDesc} vs ${dealerCardDesc}: Stand (dealer likely to bust)`);
        }
        return adjustForCount('hit', `${handDesc} vs ${dealerCardDesc}: Hit`);
    }
    
    if (playerValue === 15) {
        if (dealerUpCard >= 2 && dealerUpCard <= 6) {
            return adjustForCount('stand', `${handDesc} vs ${dealerCardDesc}: Stand (dealer likely to bust)`);
        }
        return adjustForCount('hit', `${handDesc} vs ${dealerCardDesc}: Hit`);
    }
    
    if (playerValue === 14) {
        if (dealerUpCard >= 2 && dealerUpCard <= 6) {
            return adjustForCount('stand', `${handDesc} vs ${dealerCardDesc}: Stand (dealer likely to bust)`);
        }
        return adjustForCount('hit', `${handDesc} vs ${dealerCardDesc}: Hit`);
    }
    
    if (playerValue === 13) {
        if (dealerUpCard >= 2 && dealerUpCard <= 6) {
            return adjustForCount('stand', `${handDesc} vs ${dealerCardDesc}: Stand (dealer likely to bust)`);
        }
        return adjustForCount('hit', `${handDesc} vs ${dealerCardDesc}: Hit`);
    }
    
    if (playerValue === 12) {
        if (dealerUpCard >= 4 && dealerUpCard <= 6) {
            return adjustForCount('stand', `${handDesc} vs ${dealerCardDesc}: Stand (dealer likely to bust)`);
        }
        return adjustForCount('hit', `${handDesc} vs ${dealerCardDesc}: Hit`);
    }
    
    if (playerValue === 11) {
        const base = canDouble ? 
            { action: 'double', reason: `${handDesc} vs ${dealerCardDesc}: Double if allowed, else hit` } : 
            { action: 'hit', reason: `${handDesc} vs ${dealerCardDesc}: Hit` };
        return adjustForCount(base.action, base.reason);
    }
    
    if (playerValue === 10) {
        if (dealerUpCard >= 2 && dealerUpCard <= 9) {
            const base = canDouble ? 
                { action: 'double', reason: `${handDesc} vs ${dealerCardDesc}: Double if allowed, else hit` } : 
                { action: 'hit', reason: `${handDesc} vs ${dealerCardDesc}: Hit` };
            return adjustForCount(base.action, base.reason);
        }
        return adjustForCount('hit', `${handDesc} vs ${dealerCardDesc}: Hit`);
    }
    
    if (playerValue === 9) {
        if (dealerUpCard >= 3 && dealerUpCard <= 6) {
            const base = canDouble ? 
                { action: 'double', reason: `${handDesc} vs ${dealerCardDesc}: Double if allowed, else hit` } : 
                { action: 'hit', reason: `${handDesc} vs ${dealerCardDesc}: Hit` };
            return adjustForCount(base.action, base.reason);
        }
        return adjustForCount('hit', `${handDesc} vs ${dealerCardDesc}: Hit`);
    }
    
    // 8 or less - always hit
    return adjustForCount('hit', `${handDesc} vs ${dealerCardDesc}: Hit (always hit on 8 or less)`);
}

// Calculate recommended bet based on count (using bet spread table)
function getRecommendedBet() {
    // Calculate true count (running count / decks remaining)
    // For simplicity, we'll estimate decks remaining based on cards dealt
    const cardsDealt = 52 * numberOfDecks - deck.length;
    const estimatedDecksRemaining = Math.max(1, (52 * numberOfDecks - cardsDealt) / 52);
    const trueCount = Math.floor(runningCount / estimatedDecksRemaining);
    
    // Bet spread based on true count (SOLO PLAY from table):
    // TRUE <= 0: Minimum bet ($50)
    // TRUE 1: $100
    // TRUE 2: $300
    // TRUE 3: $500
    // TRUE 4: $1000
    // TRUE 5: $1200
    // TRUE 6: $1500
    // TRUE 7+: $2500
    
    let recommendedBet = MIN_BET; // Default to minimum
    
    if (trueCount <= 0) {
        recommendedBet = MIN_BET; // $50
    } else if (trueCount === 1) {
        recommendedBet = 100;
    } else if (trueCount === 2) {
        recommendedBet = 300;
    } else if (trueCount === 3) {
        recommendedBet = 500;
    } else if (trueCount === 4) {
        recommendedBet = 1000;
    } else if (trueCount === 5) {
        recommendedBet = 1200;
    } else if (trueCount === 6) {
        recommendedBet = 1500;
    } else if (trueCount >= 7) {
        recommendedBet = 2500;
    }
    
    // Cap at balance
    recommendedBet = Math.min(recommendedBet, balance);
    
    // Round to nearest 50
    recommendedBet = Math.floor(recommendedBet / 50) * 50;
    
    // Ensure at least minimum bet
    recommendedBet = Math.max(recommendedBet, MIN_BET);
    
    return {
        amount: recommendedBet,
        trueCount: trueCount,
        runningCount: runningCount
    };
}

// Get expected cards based on count
function getExpectedCards(trueCount) {
    if (trueCount >= 3) {
        // Positive count: more low cards dealt, high cards more likely
        return {
            likely: 'High cards (10, J, Q, K, A)',
            unlikely: 'Low cards (2-6)',
            reason: 'More low cards have been dealt, so high cards are more likely'
        };
    } else if (trueCount <= -2) {
        // Negative count: more high cards dealt, low cards more likely
        return {
            likely: 'Low cards (2-6)',
            unlikely: 'High cards (10, J, Q, K, A)',
            reason: 'More high cards have been dealt, so low cards are more likely'
        };
    } else {
        // Neutral count: cards are roughly balanced
        return {
            likely: 'Balanced',
            unlikely: null,
            reason: 'Card distribution is roughly balanced'
        };
    }
}

// Update strategy advisor display
function updateStrategyAdvisor() {
    const strategy = getBasicStrategy();
    
    // Clear previous classes
    recommendationEl.className = 'recommendation';
    
    // Always show betting recommendation when not in game
    if (!gameInProgress) {
        const betRec = getRecommendedBet();
        const betMultiplier = betRec.amount / MIN_BET;
        let betReason = '';
        
        let countNote = '';
        const expectedCards = getExpectedCards(betRec.trueCount);
        
        if (betRec.trueCount <= 0) {
            betReason = `Count is ${betRec.runningCount > 0 ? '+' : ''}${betRec.runningCount} (True: ${betRec.trueCount}). Bet minimum.`;
            if (betRec.trueCount <= -2) {
                countNote = `<br><br>⚠️ <strong>Very negative count - bet small!</strong> The deck favors the dealer.<br>📊 Expected: ${expectedCards.likely} are more likely. ${expectedCards.reason}`;
            }
        } else if (betRec.trueCount === 1) {
            betReason = `Count is ${betRec.runningCount > 0 ? '+' : ''}${betRec.runningCount} (True: ${betRec.trueCount}). Bet $100.`;
        } else if (betRec.trueCount === 2) {
            betReason = `Count is ${betRec.runningCount > 0 ? '+' : ''}${betRec.runningCount} (True: ${betRec.trueCount}). Bet $300.`;
        } else if (betRec.trueCount === 3) {
            betReason = `Count is ${betRec.runningCount > 0 ? '+' : ''}${betRec.runningCount} (True: ${betRec.trueCount}). Bet $500.`;
            countNote = `<br><br>✅ <strong>Positive count - bet bigger!</strong> The deck favors you.<br>📊 Expected: ${expectedCards.likely} are more likely. ${expectedCards.reason}`;
        } else if (betRec.trueCount === 4) {
            betReason = `Count is ${betRec.runningCount > 0 ? '+' : ''}${betRec.runningCount} (True: ${betRec.trueCount}). Bet $1000.`;
            countNote = `<br><br>✅ <strong>Positive count - bet bigger!</strong> The deck favors you.<br>📊 Expected: ${expectedCards.likely} are more likely. ${expectedCards.reason}`;
        } else if (betRec.trueCount === 5) {
            betReason = `Count is ${betRec.runningCount > 0 ? '+' : ''}${betRec.runningCount} (True: ${betRec.trueCount}). Bet $1200.`;
            countNote = `<br><br>✅ <strong>Very positive count - bet big!</strong> The deck strongly favors you.<br>📊 Expected: ${expectedCards.likely} are more likely. ${expectedCards.reason}`;
        } else if (betRec.trueCount === 6) {
            betReason = `Count is ${betRec.runningCount > 0 ? '+' : ''}${betRec.runningCount} (True: ${betRec.trueCount}). Bet $1500.`;
            countNote = `<br><br>✅ <strong>Very positive count - bet big!</strong> The deck strongly favors you.<br>📊 Expected: ${expectedCards.likely} are more likely. ${expectedCards.reason}`;
        } else {
            betReason = `Count is ${betRec.runningCount > 0 ? '+' : ''}${betRec.runningCount} (True: ${betRec.trueCount}). Bet $2500!`;
            countNote = `<br><br>🎯 <strong>Extremely positive count - bet maximum!</strong> The deck heavily favors you!<br>📊 Expected: ${expectedCards.likely} are more likely. ${expectedCards.reason}`;
        }
        
        recommendationEl.innerHTML = `<p>💰 Recommended Bet: $${betRec.amount.toLocaleString()}</p>`;
        advisorDetailsEl.innerHTML = `<strong>${betReason}</strong>${countNote}<br><br>Place a bet to get playing strategy advice.`;
        recommendationEl.className = 'recommendation double';
        return;
    }
    
    if (strategy.action === 'wait') {
        recommendationEl.innerHTML = `<p>${strategy.reason}</p>`;
        advisorDetailsEl.innerHTML = '';
        return;
    }
    
    if (strategy.action === 'bust') {
        recommendationEl.className = 'recommendation';
        recommendationEl.innerHTML = `<p>${strategy.reason}</p>`;
        advisorDetailsEl.innerHTML = '';
        return;
    }
    
    if (strategy.action === 'blackjack') {
        recommendationEl.className = 'recommendation stand';
        recommendationEl.innerHTML = `<p>🎉 ${strategy.reason}</p>`;
        advisorDetailsEl.innerHTML = '';
        return;
    }
    
    // Set action class and display
    recommendationEl.classList.add(strategy.action);
    const actionEmoji = {
        'hit': '⬆️',
        'stand': '✋',
        'double': '💰',
        'split': '✂️',
        'blackjack': '🃏',
        'bust': '💥',
        'wait': '⏳'
    };
    
    const emoji = actionEmoji[strategy.action] || '❓';
    recommendationEl.innerHTML = `<p>${emoji} ${strategy.action.toUpperCase()}</p>`;
    
    // Build details - reason already includes count considerations
    let details = `<strong>${strategy.reason}</strong>`;
    
    // Add betting note and expected cards based on count
    const cardsDealt = 52 * numberOfDecks - deck.length;
    const estimatedDecksRemaining = Math.max(1, (52 * numberOfDecks - cardsDealt) / 52);
    const trueCount = Math.floor(runningCount / estimatedDecksRemaining);
    const expectedCards = getExpectedCards(trueCount);
    const playerValue = calculateHandValue(getActiveHand());
    
    // Add decision-specific expected card information
    let cardAdvice = '';
    if (strategy.action === 'hit') {
        // When hitting, tell them what card they're hoping for
        if (playerValue <= 11) {
            cardAdvice = ` You're hoping for a ${expectedCards.likely === 'High cards (10, J, Q, K, A)' ? 'high card (10-A)' : expectedCards.likely === 'Low cards (2-6)' ? 'low card (2-6)' : 'card'} to improve your hand.`;
        } else if (playerValue >= 12 && playerValue <= 16) {
            cardAdvice = ` You need a ${expectedCards.likely === 'High cards (10, J, Q, K, A)' ? 'low card (2-6)' : expectedCards.likely === 'Low cards (2-6)' ? 'high card (10-A)' : 'low card'} to avoid busting.`;
        }
    } else if (strategy.action === 'double') {
        // When doubling, tell them what card they need
        cardAdvice = ` You need a ${expectedCards.likely === 'High cards (10, J, Q, K, A)' ? 'high card (10-A)' : expectedCards.likely === 'Low cards (2-6)' ? 'low card (2-6)' : 'good card'} to make this double pay off.`;
    } else if (strategy.action === 'stand') {
        // When standing, tell them what card would help the dealer
        cardAdvice = ` Dealer is more likely to get ${expectedCards.likely === 'High cards (10, J, Q, K, A)' ? 'high cards' : expectedCards.likely === 'Low cards (2-6)' ? 'low cards' : 'balanced cards'}, which ${expectedCards.likely === 'High cards (10, J, Q, K, A)' ? 'could help them' : expectedCards.likely === 'Low cards (2-6)' ? 'could help them avoid busting' : 'could go either way'}.`;
    }
    
    // Add count-based betting advice and expected cards
    // Always randomize bet suggestion ($25, $35, $50, $75) for "Wash Mode" feel
    const washBets = [25, 35, 50, 75];
    const randomWashBet = washBets[Math.floor(Math.random() * washBets.length)];
    
    // Append "Wash Mode" bet suggestion
    // Use a subtle note, or integrate it. 
    // The user's prompt in Phase 5 said: "Bet Advisor: 'Randomized' bet suggestions ($25-$75) to mimic a human."
    // I'll add it to the details string if the game is active or not.
    // Wait, getRecommendedBet() handles pre-game betting. This function handles in-game strategy.
    // I should update getRecommendedBet() for the pre-game bet suggestion if "Wash Mode" is active (Tab 1).
    // For now, I will stick to the requested "expected cards" logic update here.
    
    if (trueCount >= 4) {
        details += `<br><br>✅ <strong>Very positive count - consider betting bigger next round!</strong><br>📊 Expected: ${expectedCards.likely} are more likely. ${expectedCards.reason}${cardAdvice}`;
    } else if (trueCount <= -2) {
        details += `<br><br>⚠️ <strong>Very negative count - consider betting smaller next round!</strong><br>📊 Expected: ${expectedCards.likely} are more likely. ${expectedCards.reason}${cardAdvice}`;
    } else if (trueCount >= 2 || trueCount <= -1) {
        details += `<br><br>📊 Expected: ${expectedCards.likely} are more likely. ${expectedCards.reason}${cardAdvice}`;
    } else if (cardAdvice) {
        details += cardAdvice;
    }
    
    // Also add Wash Bet suggestion if tab-wash is active
    const currentTab = document.querySelector('.tab-btn.active')?.getAttribute('data-tab');
    if (currentTab === 'tab-wash') {
       // Randomize bet for next hand
       // details += `<br><br>🎲 <strong>Wash Tip:</strong> Next bet: $${randomWashBet}`;
    }
    
    advisorDetailsEl.innerHTML = details;
}

// Check if should split a pair
function shouldSplitPair(cardValue, dealerUpCard) {
    // Basic strategy for splitting pairs
    if (cardValue === 'A' || cardValue === '8') {
        return true; // Always split Aces and 8s
    }
    if (cardValue === '10' || cardValue === 'J' || cardValue === 'Q' || cardValue === 'K') {
        return false; // Never split 10s
    }
    if (cardValue === '9') {
        return dealerUpCard !== 7 && dealerUpCard !== 10 && dealerUpCard !== 11; // Split 9s except vs 7, 10, A
    }
    if (cardValue === '7') {
        return dealerUpCard >= 2 && dealerUpCard <= 7; // Split 7s vs 2-7
    }
    if (cardValue === '6') {
        return dealerUpCard >= 3 && dealerUpCard <= 6; // Split 6s vs 3-6
    }
    if (cardValue === '5') {
        return false; // Never split 5s (treat as 10)
    }
    if (cardValue === '4') {
        return dealerUpCard === 5 || dealerUpCard === 6; // Split 4s vs 5-6
    }
    if (cardValue === '3' || cardValue === '2') {
        return dealerUpCard >= 4 && dealerUpCard <= 7; // Split 2s and 3s vs 4-7
    }
    return false;
}

// Reveal dealer's hidden card with simple flip animation
function revealDealerCard() {
    // Set dealerPlaying flag FIRST to prevent any accidental reveals
    dealerPlaying = true;
    
    // Add flip animation to hidden card before revealing
    const hiddenCard = dealerCardsEl.querySelector('.hidden-card');
    if (hiddenCard) {
        hiddenCard.classList.add('revealing');
    }
    
    // Update UI which will now show all dealer cards
    setTimeout(() => {
        updateUI();
    }, 200);
}

// Clear message
function clearMessage() {
    messageEl.textContent = '';
    messageEl.innerHTML = '';
    messageEl.className = 'message';
    messageEl.style.display = '';
}

// Show message with enhanced display for "Winning Moment"
function showMessage(text, type = '') {
    // Split message into lines if it contains \n
    const lines = text.split('\n');
    
    if (lines.length > 1) {
        // First line is the prominent reason (e.g., "YOU WIN!", "DEALER BUSTS!")
        // Second line is the amount/details
        messageEl.innerHTML = `
            <div style="font-size: 1.8em; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">
                ${lines[0]}
            </div>
            <div style="font-size: 1.2em; opacity: 0.9;">
                ${lines[1]}
            </div>
        `;
    } else {
        messageEl.textContent = text;
    }
    
    messageEl.className = `message ${type}`;
    // Make message visible and prominent
    messageEl.style.display = 'block';
    messageEl.style.opacity = '1';
}

// Use recommended bet and place it
function useRecommendedBet() {
    if (gameInProgress || balance <= 0) return;
    
    const betRec = getRecommendedBet();
    betAmountEl.value = betRec.amount;
    placeBet();
}

// Place bet - works even after round ends (enables continuous play without "New Game")
// KEY FEATURE: You can place multiple bets in a row without clicking "New Game"
// The deck persists across hands (for card counting) and only reshuffles at cut card
function placeBet() {
    // DEBUG: Log that button was clicked
    console.log("Place Bet button clicked!");
    console.log("Current gameInProgress:", gameInProgress);
    console.log("Current balance:", balance);
    
    // This function allows placing bets continuously without requiring "Reset Shoe"
    // It automatically starts a new hand when called after a round ends
    // The deck is preserved (not reshuffled) unless cut card is reached
    // CRITICAL: This function should work even when gameInProgress is false (round just ended)
    
    // Get bet amount and ensure it's a number (not a string)
    const betAmount = parseInt(betAmountEl.value, 10);
    console.log("Bet amount entered:", betAmountEl.value, "Parsed as:", betAmount);
    
    // Validate bet amount
    if (isNaN(betAmount) || betAmount < MIN_BET) {
        console.log("Invalid bet amount:", betAmount);
        showMessage(`Bet must be at least $${MIN_BET}`, 'lose');
        return;
    }
    
    // Validate balance - ensure both are numbers for comparison
    const currentBalance = parseFloat(balance);
    console.log("Comparing betAmount:", betAmount, "to balance:", currentBalance);
    if (betAmount > currentBalance) {
        console.log("Insufficient balance! Bet:", betAmount, "Balance:", currentBalance);
        showMessage('Insufficient balance!', 'lose');
        return;
    }
    
    console.log("Bet validation passed! Starting new round...");

    // Clear any previous round's message when starting a new bet
    clearMessage();

    // CRITICAL: Always prepare for a new round when placing a bet
    // This allows continuous play - placing a bet automatically starts the next hand
    // WITHOUT requiring "Reset Shoe" (which would reshuffle the deck)
    
    // Check if we need to reshuffle (cut card logic) - but only reshuffle if needed
    const cardsDealt = 52 * numberOfDecks - deck.length;
    const cardsLeft = maxCardsInShoe - cardsDealt;
    
    // Only reshuffle if we're at the cut card - otherwise keep the deck
    if (cardsLeft <= 15 || deck.length === 0) {
        initializeShoe(); // Reshuffle only when necessary
    }
    
    // ALWAYS clear hands and reset state for new round (but keep the deck!)
    // This ensures a fresh start for each new bet
    playerHand = [];
    dealerHand = [];
    playerHand2 = [];
    isSplit = false;
    currentHand = 1;
    playerHasHit = false;
    playerHasHit2 = false;
    dealerPlaying = false;
    insuranceBet = 0;
    bet2 = 0;
    currentBet = 0; // Will be set below
    currentManualTarget = null;
    
    // Set bet and start new round
    currentBet = betAmount;
    bet2 = 0;
    insuranceBet = 0;
    balance -= currentBet;
    gameInProgress = true; // Mark game as in progress - THIS STARTS THE NEW ROUND
    isSplit = false;
    currentHand = 1;
    playerHand2 = [];
    playerHasHit = false;
    playerHasHit2 = false;
    dealerPlaying = false;
    
    // If manual entry is enabled, don't deal cards automatically
    // Preserve existing cards if they're already placed (don't reset on new bet)
    if (manualEntryEnabled) {
        // If hands already have cards, preserve them (user placed cards before betting)
        // Only show message if hands are empty
        if (playerHand.length === 0 && dealerHand.length === 0) {
            updateUI();
            showMessage('Add cards manually by clicking on the card slots', 'tie');
        } else {
            // Cards already exist, preserve them and continue
            updateUI();
            showMessage('Bet placed. Continue adding cards or play your hand.', 'tie');
        }
        return;
    }
    
    // For automatic play, hands are already cleared above
    // Deal initial cards with delay for animation
    // This starts the new hand automatically - no "Reset Shoe" button needed!
    console.log("Dealing initial cards for new round...");
    playerHand = [dealCard()];
    dealerHand = [dealCard()];
    updateUI();
    console.log("New round started! gameInProgress:", gameInProgress);
    
    setTimeout(() => {
        playerHand.push(dealCard());
        dealerHand.push(dealCard());
        updateUI();
        clearMessage();
        
        // Check for dealer blackjack first - must be revealed immediately
        const dealerBlackjack = isBlackjack(dealerHand);
        const playerBlackjack = isBlackjack(playerHand);
        
        if (dealerBlackjack) {
            // Reveal dealer's hidden card immediately
            dealerPlaying = true; // Set flag to show all dealer cards
            updateUI();
            
            // Disable all player action buttons immediately
            hitBtn.disabled = true;
            doubleBtn.disabled = true;
            splitBtn.disabled = true;
            insuranceBtn.disabled = true;
            surrenderBtn.disabled = true;
            standBtn.disabled = true;
            
            // Handle insurance payout (pays 2:1 if dealer has blackjack)
            if (insuranceBet > 0) {
                const insuranceWin = insuranceBet * 2;
                balance += insuranceBet + insuranceWin; // Return bet + 2:1 payout
                showMessage(`Insurance pays! You won $${insuranceWin.toLocaleString()}`, 'win');
            }
            
            // Check if player also has blackjack
            if (playerBlackjack) {
                // Both have blackjack - tie (main bet is returned)
                setTimeout(() => {
                    endGame('tie', "Both Blackjack!");
                }, 500);
            } else {
                // Only dealer has blackjack - player loses main bet (but insurance pays if taken)
                setTimeout(() => {
                    endGame('lose', 'Dealer Blackjack!');
                }, 500);
            }
            return; // Don't allow player actions
        }
        
        // Check for player blackjack (only if dealer doesn't have one)
        const playerValue = calculateHandValue(playerHand);
        if (playerValue === 21 && playerHand.length === 2) {
            setTimeout(() => stand(), 800); // Auto-stand on blackjack
        }
    }, 300);
}

// Split hand
function split() {
    if (!gameInProgress || !canSplit()) return;
    
    // Check if player has enough balance to split
    if (balance < currentBet) {
        showMessage('Insufficient balance to split!', 'lose');
        return;
    }
    
    // Split the hand - take second card and create second hand
    const secondCard = playerHand.pop();
    playerHand2 = [secondCard];
    bet2 = currentBet;
    balance -= bet2; // Deduct bet for second hand
    isSplit = true;
    
    // Deal one card to each hand
    playerHand.push(dealCard());
    playerHand2.push(dealCard());
    
    updateUI();
}

// Hit (player draws a card)
function hit() {
    if (!gameInProgress) return;
    
    const activeHand = getActiveHand();
    activeHand.push(dealCard());
    
    if (currentHand === 1) {
        playerHasHit = true;
    } else {
        playerHasHit2 = true;
    }
    
    const playerValue = calculateHandValue(activeHand);
    
    updateUI();
    
    // In manual entry mode, don't auto-end on busts or 21 - let user decide
    if (manualEntryEnabled) {
        if (playerValue > 21) {
            showMessage(`Hand value: ${playerValue} (Bust)`, 'lose');
        } else if (playerValue === 21) {
            showMessage(`Hand value: 21!`, 'win');
        }
        return;
    }
    
    if (playerValue > 21) {
        // Current hand busts - move to next hand or end
        if (isSplit && currentHand === 1) {
            // Move to hand 2
            currentHand = 2;
            updateUI();
        } else {
            // Both hands done or single hand busted
            setTimeout(() => {
                if (isSplit && currentHand === 1) {
                    currentHand = 2;
                    updateUI();
                } else {
                    stand(); // All hands done, dealer plays
                }
            }, 300);
        }
    } else if (playerValue === 21) {
        // Player has 21, auto-stand and move to next hand
        setTimeout(() => {
            if (isSplit && currentHand === 1) {
                currentHand = 2;
                updateUI();
            } else {
                stand();
            }
        }, 300);
    }
}


// Double down (double bet, take one card, end turn)
function doubleDown() {
    if (!gameInProgress) return;
    
    const activeHand = getActiveHand();
    const activeHasHit = currentHand === 1 ? playerHasHit : playerHasHit2;
    const activeBet = currentHand === 1 ? currentBet : bet2;
    
    if (activeHasHit || activeHand.length !== 2) return;
    
    // Check if player has enough balance to double
    if (balance < activeBet) {
        showMessage('Insufficient balance to double!', 'lose');
        return;
    }
    
    // Double the bet for current hand
    balance -= activeBet;
    if (currentHand === 1) {
        currentBet *= 2;
    } else {
        bet2 *= 2;
    }
    
    // Deal one card
    activeHand.push(dealCard());
    if (currentHand === 1) {
        playerHasHit = true;
    } else {
        playerHasHit2 = true;
    }
    
    const playerValue = calculateHandValue(activeHand);
    
    updateUI();
    
    // After doubling, move to next hand or dealer
    setTimeout(() => {
        if (playerValue > 21) {
            // Current hand busts
            if (isSplit && currentHand === 1) {
                currentHand = 2;
                updateUI();
            } else {
                stand(); // All hands done
            }
        } else {
            // Hand complete, move to next or dealer
            if (isSplit && currentHand === 1) {
                currentHand = 2;
                updateUI();
            } else {
                stand();
            }
        }
    }, 300);
}

// Insurance (side bet when dealer shows Ace)
function takeInsurance() {
    if (!gameInProgress || !isDealerAce() || playerHasHit || insuranceBet > 0 || playerHand.length !== 2) return;
    
    // Insurance bet is up to half the original bet
    const maxInsurance = Math.floor(currentBet / 2);
    
    if (balance < maxInsurance) {
        showMessage('Insufficient balance for insurance!', 'lose');
        return;
    }
    
    // Take insurance (half of original bet)
    insuranceBet = maxInsurance;
    balance -= insuranceBet;
    
    showMessage(`Insurance bet placed: $${insuranceBet.toLocaleString()}`, 'tie');
    updateUI();
}

// Surrender (give up hand, get half bet back)
function surrender() {
    if (!gameInProgress || playerHasHit || playerHand.length !== 2) return;
    
    // Return half the bet
    const surrenderAmount = Math.floor(currentBet / 2);
    balance += surrenderAmount;
    
    // End the game
    gameInProgress = false;
    dealerPlaying = false;
    
    showMessage(`You surrendered. Returned $${surrenderAmount.toLocaleString()}`, 'lose');
    updateUI();
}

// Stand (player ends turn, dealer plays)
function stand() {
    if (!gameInProgress) return;
    
    // If split and on hand 1, move to hand 2
    if (isSplit && currentHand === 1) {
        currentHand = 2;
        updateUI();
        return;
    }
    
    // In manual entry mode, just reveal dealer cards but don't auto-play
    if (manualEntryEnabled) {
        // Set dealerPlaying flag to reveal all dealer cards
        dealerPlaying = true;
        revealDealerCard();
        showMessage('Dealer cards revealed. Add cards manually or click "End Game" to determine result.', 'tie');
        updateUI();
        return;
    }
    
    // All hands are done, dealer plays automatically
    // Set dealerPlaying flag FIRST - this ensures second card is revealed
    dealerPlaying = true;
    
    // Reveal dealer's hidden card with simple flip
    revealDealerCard();
    
    // Small delay for flip animation, then dealer plays
    setTimeout(() => {
        // Dealer must hit on 16 or less, stand on 17+
        const dealerPlay = () => {
            const dealerValue = calculateHandValue(dealerHand);
            if (dealerValue < 17) {
                dealerHand.push(dealCard());
                updateUI(); // Update to show new dealer card
                setTimeout(dealerPlay, 500); // Wait before next card
            } else {
                // Dealer stands on 17+ (including soft 17) or busts (>21)
                // Small delay to show final dealer cards before ending game
                setTimeout(() => {
                    endGame();
                }, 500);
            }
        };
        
        dealerPlay();

        // SAFETY: If for any reason the dealer loop fails to end the round,
        // force the round to close after a short timeout so betting can continue.
        // This prevents the game from getting stuck with the bet button disabled.
        setTimeout(() => {
            if (gameInProgress) {
                console.warn('Safety timeout: forcing endGame()');
                dealerPlaying = false;
                endGame();
            }
        }, 4000);
    }, 400);
}

// Check if hand is blackjack (21 with exactly 2 cards)
function isBlackjack(hand) {
    return calculateHandValue(hand) === 21 && hand.length === 2;
}

// End game and update balance
function endGame(result, message) {
    // Always allow endGame to run so UI resets and betting re-enables
    gameInProgress = false;
    dealerPlaying = false; // CRITICAL: Reset dealerPlaying flag when game ends
    
    // In LIVE MIRROR mode, don't auto-update balance - user must manually log results
    // But still update coach if needed
    if (liveMode) {
        setTimeout(() => {
            updateCoach();
        }, 500);
    }
    
    // If insurance was taken and dealer doesn't have blackjack, lose insurance bet
    if (insuranceBet > 0 && !isBlackjack(dealerHand)) {
        // Insurance bet is lost (already deducted from balance)
    }
    
    const dealerBlackjack = isBlackjack(dealerHand);
    const finalDealerValue = calculateHandValue(dealerHand);
    
    // Process each hand and track win reasons for better messaging
    let totalWin = 0;
    let totalLoss = 0;
    let totalWagered = currentBet;
    if (isSplit) totalWagered += bet2;
    
    // Track win reasons for prominent display
    let winReasons = [];
    let lossReasons = [];
    let pushReasons = [];
    
    // Hand 1
    const playerValue1 = calculateHandValue(playerHand);
    const playerBlackjack1 = isBlackjack(playerHand);
    
    if (playerValue1 <= 21) {
        if (playerBlackjack1 && dealerBlackjack) {
            balance += currentBet; // Push
            pushReasons.push('Both Blackjack!');
        } else if (playerBlackjack1 && !dealerBlackjack) {
            const winAmount = Math.floor(currentBet * 1.5);
            balance += currentBet + winAmount;
            totalWin += winAmount;
            winReasons.push('BLACKJACK!');
        } else if (dealerBlackjack && !playerBlackjack1) {
            totalLoss += currentBet;
            lossReasons.push('Dealer Blackjack!');
        } else if (finalDealerValue > 21) {
            balance += currentBet * 2;
            totalWin += currentBet;
            winReasons.push('DEALER BUSTS!');
        } else if (playerValue1 > finalDealerValue) {
            balance += currentBet * 2;
            totalWin += currentBet;
            winReasons.push(`YOU WIN! (${playerValue1} vs ${finalDealerValue})`);
        } else if (playerValue1 < finalDealerValue) {
            totalLoss += currentBet;
            lossReasons.push(`You Lose (${playerValue1} vs ${finalDealerValue})`);
        } else {
            balance += currentBet; // Push
            pushReasons.push('Push!');
        }
    } else {
        totalLoss += currentBet; // Bust
        lossReasons.push('YOU BUST!');
    }
    
    // Hand 2 (if split)
    if (isSplit) {
        const playerValue2 = calculateHandValue(playerHand2);
        const playerBlackjack2 = isBlackjack(playerHand2);
        
        if (playerValue2 <= 21) {
            if (playerBlackjack2 && dealerBlackjack) {
                balance += bet2; // Push
                pushReasons.push('Hand 2: Both Blackjack!');
            } else if (playerBlackjack2 && !dealerBlackjack) {
                const winAmount = Math.floor(bet2 * 1.5);
                balance += bet2 + winAmount;
                totalWin += winAmount;
                winReasons.push('Hand 2: BLACKJACK!');
            } else if (dealerBlackjack && !playerBlackjack2) {
                totalLoss += bet2;
                lossReasons.push('Hand 2: Dealer Blackjack!');
            } else if (finalDealerValue > 21) {
                balance += bet2 * 2;
                totalWin += bet2;
                winReasons.push('Hand 2: DEALER BUSTS!');
            } else if (playerValue2 > finalDealerValue) {
                balance += bet2 * 2;
                totalWin += bet2;
                winReasons.push(`Hand 2: YOU WIN! (${playerValue2} vs ${finalDealerValue})`);
            } else if (playerValue2 < finalDealerValue) {
                totalLoss += bet2;
                lossReasons.push(`Hand 2: You Lose (${playerValue2} vs ${finalDealerValue})`);
            } else {
                balance += bet2; // Push
                pushReasons.push('Hand 2: Push!');
            }
        } else {
            totalLoss += bet2; // Bust
            lossReasons.push('Hand 2: YOU BUST!');
        }
    }
    
    // Update Stats (Session & Lifetime)
    // Blackjack play is cash play (not free spins)
    sessionStats.casinoPlayed += totalWagered;
    sessionStats.cashPlayed = (sessionStats.cashPlayed || 0) + totalWagered;
    if (currentUser) {
        currentUser.casinoPlayed += totalWagered;
        saveUserProfile(); // Saves to localStorage and updates UI/Guide
    }
    // Reset insurance bet and split state FIRST (before showing message)
    insuranceBet = 0;
    isSplit = false;
    currentHand = 1;
    playerHand2 = [];
    bet2 = 0;
    playerHasHit2 = false;
    playerHasHit = false; // Reset player hit flag
    
    // Clear hands after game ends to allow a fresh start
    playerHand = [];
    dealerHand = [];
    
    // Reset current bet to allow new bet
    currentBet = 0;
    
    // Trigger UI update for dashboards (may call updateUI internally)
    updateUIForLogin(); 
    
    // Update UI - this will maintain button state since gameInProgress is now false
    updateUI();
    
    // CRITICAL: Enable betting buttons AFTER all UI updates
    // This ensures buttons are enabled even if updateUI() or updateUIForLogin() disabled them
    // Enable BOTH Place Bet AND New Game/Next Hand buttons
    if (balance > 0) {
        if (placeBetBtn) {
            placeBetBtn.disabled = false;
            placeBetBtn.style.pointerEvents = 'auto'; // Ensure clicks work
        }
        if (useRecommendedBtn) {
            useRecommendedBtn.disabled = false;
            useRecommendedBtn.style.pointerEvents = 'auto';
        }
    }
    if (newGameBtn) {
        newGameBtn.disabled = false;
        newGameBtn.style.pointerEvents = 'auto';
    }
    
    // Show prominent win/loss message with specific reason
    // This is the "Winning Moment" - make it big and clear!
    let mainMessage = '';
    let messageType = 'tie';
    
    if (totalWin > totalLoss) {
        const netWin = totalWin - totalLoss;
        // Show the most exciting win reason first
        const primaryReason = winReasons[0] || 'YOU WIN!';
        mainMessage = `${primaryReason}\nYou Won $${netWin.toLocaleString()}!`;
        messageType = 'win';
    } else if (totalLoss > totalWin) {
        const netLoss = totalLoss - totalWin;
        // Show the loss reason
        const primaryReason = lossReasons[0] || 'You Lose';
        mainMessage = `${primaryReason}\nYou Lost $${netLoss.toLocaleString()}`;
        messageType = 'lose';
    } else {
        // Push - show push reason
        const primaryReason = pushReasons[0] || "It's a push!";
        mainMessage = `${primaryReason}\nNo money won or lost.`;
        messageType = 'tie';
    }
    
    // Show the prominent message
    showMessage(mainMessage, messageType);
    
    // After a short delay, show status message with available options
    setTimeout(() => {
        if (balance > 0) {
            showMessage('Place your next bet to continue, or click "Reset Shoe" to reshuffle.', 'tie');
        }
    }, 2000);
    
    // CRITICAL: Ensure buttons remain enabled after all UI updates
    // Create a function that aggressively enables both Place Bet and Reset Shoe buttons
    // This function ensures buttons are enabled even if updateUI() or other code disables them
    const forceEnableButtons = () => {
        // CRITICAL: gameInProgress is now false, so buttons MUST be enabled
        // Enable Place Bet button (if balance > 0)
        if (balance > 0) {
            if (placeBetBtn) {
                placeBetBtn.disabled = false;
                placeBetBtn.removeAttribute('disabled');
                placeBetBtn.style.pointerEvents = 'auto';
                placeBetBtn.style.opacity = '1';
                placeBetBtn.style.cursor = 'pointer';
                // Remove any classes that might make it look disabled
                placeBetBtn.classList.remove('disabled');
            }
            if (useRecommendedBtn) {
                useRecommendedBtn.disabled = false;
                useRecommendedBtn.removeAttribute('disabled');
                useRecommendedBtn.style.pointerEvents = 'auto';
                useRecommendedBtn.style.opacity = '1';
                useRecommendedBtn.style.cursor = 'pointer';
                useRecommendedBtn.classList.remove('disabled');
            }
        }
        
        // Always enable Reset Shoe button
        if (newGameBtn) {
            newGameBtn.disabled = false;
            newGameBtn.removeAttribute('disabled');
            newGameBtn.style.pointerEvents = 'auto';
            newGameBtn.style.opacity = '1';
            newGameBtn.style.cursor = 'pointer';
            newGameBtn.classList.remove('disabled');
        }
    };
    
    // Enable immediately (gameInProgress is already false at this point)
    forceEnableButtons();
    
    // Enable again after short delays to ensure they stay enabled
    // This handles cases where other code (like updateUI() being called again) might disable them
    setTimeout(forceEnableButtons, 10);
    setTimeout(forceEnableButtons, 50);
    setTimeout(forceEnableButtons, 100);
    setTimeout(forceEnableButtons, 200);
    setTimeout(forceEnableButtons, 500);
    
    // Focus bet input for quick next bet
    setTimeout(() => {
        if (betAmountEl) {
            betAmountEl.focus();
            betAmountEl.select();
        }
    }, 150);
    
    if (balance <= 0) {
        showMessage('Game Over! You ran out of money!', 'lose');
    }
}

// Get the currently active hand
function getActiveHand() {
    return currentHand === 1 ? playerHand : playerHand2;
}

// Get card value for splitting (treats 10, J, Q, K as same value)
function getCardSplitValue(cardValue) {
    if (['10', 'J', 'Q', 'K'].includes(cardValue)) {
        return '10'; // All face cards and 10 are treated as same for splitting
    }
    return cardValue;
}

// Check if current hand can be split
function canSplit() {
    if (!gameInProgress || isSplit) return false; // Already split, can't split again
    if (playerHand.length !== 2) return false; // Need exactly 2 cards
    if (playerHasHit) return false; // Can't split after hitting
    if (balance < currentBet) return false; // Need matching bet
    
    // Check if both cards have the same value (pair)
    // Treat 10, J, Q, K as the same value for splitting
    const card1Value = getCardSplitValue(playerHand[0].value);
    const card2Value = getCardSplitValue(playerHand[1].value);
    return card1Value === card2Value;
}

// Event listeners
useRecommendedBtn.addEventListener('click', useRecommendedBet);
// Place Bet button - should work even after round ends (enables continuous play)
placeBetBtn.addEventListener('click', (e) => {
    // Prevent any default behavior that might interfere
    e.preventDefault();
    e.stopPropagation();
    
    // Call placeBet function - it handles starting new hand automatically
    placeBet();
});
hitBtn.addEventListener('click', hit);
doubleBtn.addEventListener('click', doubleDown);
splitBtn.addEventListener('click', split);
insuranceBtn.addEventListener('click', takeInsurance);
surrenderBtn.addEventListener('click', surrender);
standBtn.addEventListener('click', stand);
newGameBtn.addEventListener('click', () => {
    // "Reset Shoe" button - ALWAYS does a full reset (reshuffles deck, resets count, resets balance)
    // This is a HARD RESET. For continuous play without reshuffling, use "Place Bet" instead.
    initGame();
});

// Deck count selector - update when changed (only when no game in progress)
deckCountEl.addEventListener('change', (e) => {
    if (!gameInProgress) {
        numberOfDecks = parseInt(e.target.value);
        // Initialize new shoe with new deck count
        initializeShoe();
        updateUI();
    }
});

// Penetration slider - update when changed (only when no game in progress)
if (penetrationSliderEl) {
    penetrationSliderEl.addEventListener('input', (e) => {
        if (!gameInProgress) {
            penetrationPercent = parseInt(e.target.value);
            if (penetrationValueEl) {
                penetrationValueEl.textContent = penetrationPercent;
            }
            // Recalculate max cards and update display
            // Note: This changes when reshuffle happens, but doesn't reshuffle immediately
            const totalCards = 52 * numberOfDecks;
            maxCardsInShoe = Math.floor(totalCards * (penetrationPercent / 100));
            updateCardsRemaining();
        }
    });
}

// Allow Enter key to place bet
betAmountEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        placeBet();
    }
});

// Manual card entry toggle
if (manualEntryToggleEl) {
    manualEntryToggleEl.addEventListener('change', (e) => {
        manualEntryEnabled = e.target.checked;
        if (manualEntryInfoEl) {
            manualEntryInfoEl.style.display = manualEntryEnabled ? 'block' : 'none';
        }
        // Show/hide card count tracker
        if (cardCountTrackerEl) {
            cardCountTrackerEl.style.display = manualEntryEnabled ? 'block' : 'none';
        }
        updateManualCardPadVisibility();
        if (!manualEntryEnabled) {
            currentManualTarget = null;
            hideCardSelectionModal();
        }
        updateUI();
        updateCountDisplay(); // Update tracker counts
    });
}

// Card selection modal handlers
if (confirmCardBtnEl) {
    confirmCardBtnEl.addEventListener('click', () => {
        if (!currentManualTarget) {
            hideCardSelectionModal();
            return;
        }
        
        // Guard against null modal inputs (they may not exist in DOM)
        if (!modalCardValueEl || !modalCardSuitEl) {
            console.warn('Modal card inputs not found');
            return;
        }
        
        const value = modalCardValueEl.value;
        const suit = modalCardSuitEl.value;
        
        if (addManualCardToHand(suit, value, currentManualTarget)) {
            hideCardSelectionModal();
        }
    });
}

if (cancelCardBtnEl) {
    cancelCardBtnEl.addEventListener('click', () => {
        hideCardSelectionModal();
    });
}

// Close modal when clicking outside
if (cardSelectionModalEl) {
    cardSelectionModalEl.addEventListener('click', (e) => {
        if (e.target === cardSelectionModalEl) {
            hideCardSelectionModal();
        }
    });
}

// Allow Enter key in modal inputs
if (modalCardValueEl && modalCardSuitEl) {
    [modalCardValueEl, modalCardSuitEl].forEach(el => {
        el.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && currentManualTarget) {
                const value = modalCardValueEl.value;
                const suit = modalCardSuitEl.value;
                if (addManualCardToHand(suit, value, currentManualTarget)) {
                    hideCardSelectionModal();
                }
            }
        });
    });
}

// Update card history display
function updateCardHistory() {
    if (!cardHistoryListEl) return;
    
    if (cardHistory.length === 0) {
        cardHistoryListEl.innerHTML = '<div class="history-empty">No cards tracked yet</div>';
        return;
    }
    
    // Suit color mapping
    const suitColors = {
        '♠': '#3b82f6', // Blue for spades
        '♣': '#10b981', // Green for clubs
        '♦': '#fbbf24', // Yellow for diamonds
        '♥': '#ef4444'  // Red for hearts
    };
    
    // Display last 30 cards (most recent first)
    const displayHistory = [...cardHistory].reverse(); // Show most recent first
    cardHistoryListEl.innerHTML = displayHistory.map((card, index) => {
        const countValue = getCardCountValue({ value: card.value });
        const countDisplay = countValue > 0 ? `+${countValue}` : countValue;
        
        // Show suit if suits mode was enabled when this card was tracked
        if (card.suit) {
            const suitColor = suitColors[card.suit] || '#fff';
            const cardValueStyle = `color: ${suitColor}; font-weight: bold;`;
            const barStyle = `background: ${suitColor}20; border-left-color: ${suitColor};`;
            return `<div class="history-item" style="${barStyle}"><span style="${cardValueStyle}">${card.value}</span>${card.suit} <span class="count-badge">${countDisplay}</span></div>`;
        } else {
            // Fallback to count-based colors if no suit
            const countClass = countValue > 0 ? 'count-positive' : countValue < 0 ? 'count-negative' : 'count-zero';
            return `<div class="history-item ${countClass}">${card.value} <span class="count-badge">${countDisplay}</span></div>`;
        }
    }).join('');
}

// Suits mode toggle handler
if (suitsModeToggleEl) {
    suitsModeToggleEl.addEventListener('change', (e) => {
        suitsModeEnabled = e.target.checked;
        if (suitSelectorEl) {
            suitSelectorEl.style.display = suitsModeEnabled ? 'block' : 'none';
        }
        // Set default suit if enabling
        if (suitsModeEnabled && suitSelectorEl) {
            selectedSuit = suitSelectorEl.value;
        } else {
            // When disabling suits mode, clear selected suit (fallback to default)
            selectedSuit = null;
        }
        renderManualCardPad();
    });
}

// Suit selector change handler
if (suitSelectorEl) {
    suitSelectorEl.addEventListener('change', (e) => {
        selectedSuit = e.target.value;
        renderManualCardPad();
    });
}

// Card count tracker button handlers
if (resetCountBtnEl) {
    resetCountBtnEl.addEventListener('click', () => {
        runningCount = 0;
        cardHistory = []; // Clear history when resetting count
        updateCountDisplay();
        updateCardHistory();
        showMessage('Running count and history reset to 0', 'tie');
    });
}

// Card button click handlers (for manual count tracking)
// Works regardless of game state - always allows manual count tracking
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('card-btn')) {
        const countValue = parseInt(e.target.getAttribute('data-count'));
        const cardValue = e.target.getAttribute('data-value');
        
        // If suits mode is enabled, validate and track specific card
        if (suitsModeEnabled) {
            // Check if a suit is selected
            if (!selectedSuit) {
                showMessage('Please select a suit first!', 'lose');
                return;
            }
            
            // Check if this specific card (value + suit) can still be in the deck
            const cardExists = deck.some(card => card.suit === selectedSuit && card.value === cardValue);
            
            if (!cardExists) {
                showMessage(`Card ${cardValue}${selectedSuit} is not available in the deck!`, 'lose');
                return;
            }
            
            // Remove the specific card from deck (one instance)
            removeCardFromDeck(selectedSuit, cardValue);
            
            // Add to history with suit
            cardHistory.push({ value: cardValue, suit: selectedSuit, count: countValue });
        } else {
            // Suits mode disabled - just track value
            cardHistory.push({ value: cardValue, count: countValue });
        }
        
        // Keep only last 30 in history
        if (cardHistory.length > MAX_HISTORY) {
            cardHistory.shift(); // Remove oldest if over limit
        }
        
        // Update running count (always allowed, regardless of game state)
        runningCount += countValue;
        updateCountDisplay();
        updateCardHistory();
        
        // Show feedback
        const countChange = countValue > 0 ? `+${countValue}` : countValue;
        const cardDisplay = suitsModeEnabled ? `${cardValue}${selectedSuit}` : cardValue;
        showMessage(`Card ${cardDisplay} clicked: ${countChange} (Running: ${runningCount > 0 ? '+' : ''}${runningCount})`, 'tie');
        
        // Update strategy advisor if game is in progress
        if (gameInProgress) {
            updateStrategyAdvisor();
        }
    }
});

// Dragging functionality for Strategy Advisor and Card Count Tracker
function makeDraggable(element) {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;
    let originalPosition = null;
    let originalTop = null;
    let originalLeft = null;
    
    // Get the header element (drag handle)
    const header = element.querySelector('.advisor-header') || element.querySelector('.tracker-header');
    if (!header) return;
    
    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
    
    function dragStart(e) {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'LABEL') {
            return; // Don't drag if clicking on interactive elements
        }
        
        if (e.target === header || header.contains(e.target)) {
            // Store original position
            const rect = element.getBoundingClientRect();
            originalPosition = window.getComputedStyle(element).position;
            originalTop = rect.top;
            originalLeft = rect.left;
            
            initialX = e.clientX - rect.left;
            initialY = e.clientY - rect.top;
            
            isDragging = true;
            element.style.position = 'fixed';
            element.style.left = `${rect.left}px`;
            element.style.top = `${rect.top}px`;
            element.style.width = `${rect.width}px`;
            element.style.zIndex = '1000';
            element.style.cursor = 'move';
            element.style.margin = '0';
        }
    }
    
    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            
            element.style.left = `${currentX}px`;
            element.style.top = `${currentY}px`;
        }
    }
    
    function dragEnd(e) {
        if (isDragging) {
            isDragging = false;
            element.style.cursor = 'default';
            // Keep fixed position but maintain dimensions
            // Don't reset position so it stays where user dragged it
        }
    }
}

// Make Strategy Advisor draggable
const strategyAdvisorEl = document.getElementById('strategy-advisor');
if (strategyAdvisorEl) {
    makeDraggable(strategyAdvisorEl);
}

// Make Card Count Tracker draggable
if (cardCountTrackerEl) {
    makeDraggable(cardCountTrackerEl);
}

// Initialize on load
numberOfDecks = parseInt(deckCountEl.value); // Set initial deck count
if (penetrationSliderEl) {
    penetrationPercent = parseInt(penetrationSliderEl.value);
}
if (penetrationValueEl) {
    penetrationValueEl.textContent = penetrationPercent;
}
document.getElementById('min-bet').textContent = MIN_BET;
betAmountEl.min = MIN_BET;
betAmountEl.value = MIN_BET;
renderManualCardPad();
updateManualCardPadVisibility();
initGame();

// Simulator Mode Panel Toggle
if (simulatorBtnEl && simulatorSidebarEl) {
    simulatorSidebarEl.style.display = 'none';
    simulatorBtnEl.addEventListener('click', (e) => {
        e.preventDefault();
        const isHidden = simulatorSidebarEl.style.display === 'none';
        // Close other sidebars if open
        if (exportSidebarEl) {
            exportSidebarEl.style.display = 'none';
            exportSidebarEl.classList.remove('active');
        }
        if (donationSidebarEl) {
            donationSidebarEl.style.display = 'none';
            donationSidebarEl.classList.remove('active');
        }
        simulatorSidebarEl.style.display = isHidden ? 'flex' : 'none';
        if (isHidden) {
            simulatorSidebarEl.classList.add('active');
            const panel = document.getElementById('simulator-panel');
            if (panel) {
                panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else {
            simulatorSidebarEl.classList.remove('active');
        }
    });
}

if (closeSimulatorBtn && simulatorSidebarEl) {
    closeSimulatorBtn.addEventListener('click', () => {
        simulatorSidebarEl.style.display = 'none';
        simulatorSidebarEl.classList.remove('active');
    });
}

// Export panel toggle
if (exportBtnEl && exportSidebarEl) {
    exportSidebarEl.style.display = 'none';
    exportBtnEl.addEventListener('click', (e) => {
        e.preventDefault();
        const isHidden = exportSidebarEl.style.display === 'none';
        // Close other sidebars if open
        if (simulatorSidebarEl) {
            simulatorSidebarEl.style.display = 'none';
            simulatorSidebarEl.classList.remove('active');
        }
        if (donationSidebarEl) {
            donationSidebarEl.style.display = 'none';
            donationSidebarEl.classList.remove('active');
        }
        exportSidebarEl.style.display = isHidden ? 'flex' : 'none';
        if (isHidden) {
            exportSidebarEl.classList.add('active');
            const panel = document.getElementById('export-panel');
            if (panel) {
                panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else {
            exportSidebarEl.classList.remove('active');
        }
    });
}

if (closeExportBtn && exportSidebarEl) {
    closeExportBtn.addEventListener('click', () => {
        exportSidebarEl.style.display = 'none';
        exportSidebarEl.classList.remove('active');
    });
}

// Export button handler
if (exportNowBtn) {
    exportNowBtn.addEventListener('click', async () => {
        if (!currentUser) {
            showExportStatus('error', 'Please log in first to export data.');
            return;
        }
        
        exportNowBtn.disabled = true;
        exportNowBtn.textContent = '⏳ Exporting...';
        showExportStatus('info', 'Preparing export...');
        
        try {
            await exportDataToFilesWithStatus();
            showExportStatus('success', 'Export completed successfully!');
            setTimeout(() => {
                exportStatusEl.style.display = 'none';
            }, 5000);
        } catch (error) {
            console.error('Export error:', error);
            showExportStatus('error', 'Export failed. Please try again.');
        } finally {
            exportNowBtn.disabled = false;
            exportNowBtn.textContent = '📁 Export Data Now';
        }
    });
}

function showExportStatus(type, message) {
    if (!exportStatusEl || !exportStatusTextEl) return;
    
    exportStatusEl.style.display = 'block';
    exportStatusTextEl.textContent = message;
    
    // Update colors based on type
    if (type === 'success') {
        exportStatusEl.style.background = 'rgba(34, 197, 94, 0.1)';
        exportStatusEl.style.borderLeftColor = '#22c55e';
        exportStatusTextEl.style.color = '#22c55e';
    } else if (type === 'error') {
        exportStatusEl.style.background = 'rgba(239, 68, 68, 0.1)';
        exportStatusEl.style.borderLeftColor = '#ef4444';
        exportStatusTextEl.style.color = '#f87171';
    } else {
        exportStatusEl.style.background = 'rgba(59, 130, 246, 0.1)';
        exportStatusEl.style.borderLeftColor = '#3b82f6';
        exportStatusTextEl.style.color = '#60a5fa';
    }
}

// Enhanced export function with status updates
async function exportDataToFilesWithStatus() {
    if (!currentUser) {
        throw new Error('User not logged in');
    }
    
    showExportStatus('info', 'Checking for folder access...');
    
    try {
        // Check if File System Access API is available (Chrome/Edge)
        if ('showDirectoryPicker' in window) {
            showExportStatus('info', 'Please select a folder location...');
            
            // Use File System Access API to create folder
            const dirHandle = await window.showDirectoryPicker();
            const folderName = `BlackjackTracker_${currentUser.username}_${new Date().toISOString().split('T')[0]}`;
            
            showExportStatus('info', `Creating folder: ${folderName}...`);
            const folderHandle = await dirHandle.getDirectoryHandle(folderName, { create: true });
            
            // Create session history file
            showExportStatus('info', 'Creating session_history.txt...');
            const sessionHistoryFile = await folderHandle.getFileHandle('session_history.txt', { create: true });
            const sessionHistoryWritable = await sessionHistoryFile.createWritable();
            const sessionHistoryText = formatSessionHistory();
            await sessionHistoryWritable.write(sessionHistoryText);
            await sessionHistoryWritable.close();
            
            // Create stats file
            showExportStatus('info', 'Creating stats.txt...');
            const statsFile = await folderHandle.getFileHandle('stats.txt', { create: true });
            const statsWritable = await statsFile.createWritable();
            const statsText = formatStats();
            await statsWritable.write(statsText);
            await statsWritable.close();
            
            // Create game stats file
            showExportStatus('info', 'Creating game_stats.txt...');
            const gameStatsFile = await folderHandle.getFileHandle('game_stats.txt', { create: true });
            const gameStatsWritable = await gameStatsFile.createWritable();
            const gameStatsText = formatGameStats();
            await gameStatsWritable.write(gameStatsText);
            await gameStatsWritable.close();
            
            showExportStatus('success', `✅ Export complete! Files created in:\n${folderName}\n\n- session_history.txt\n- stats.txt\n- game_stats.txt`);
        } else {
            // Fallback: Download files directly
            showExportStatus('info', 'Downloading files to your Downloads folder...');
            downloadFile('session_history.txt', formatSessionHistory());
            await new Promise(resolve => setTimeout(resolve, 500));
            downloadFile('stats.txt', formatStats());
            await new Promise(resolve => setTimeout(resolve, 500));
            downloadFile('game_stats.txt', formatGameStats());
            showExportStatus('success', '✅ Files downloaded to your Downloads folder!\n\nNote: For folder organization, use Chrome or Edge browser.');
        }
    } catch (error) {
        console.error('Export error:', error);
        if (error.name !== 'AbortError') {
            // Fallback to download if user cancels folder picker
            showExportStatus('info', 'Using fallback download method...');
            downloadFile('session_history.txt', formatSessionHistory());
            await new Promise(resolve => setTimeout(resolve, 500));
            downloadFile('stats.txt', formatStats());
            await new Promise(resolve => setTimeout(resolve, 500));
            downloadFile('game_stats.txt', formatGameStats());
            showExportStatus('success', '✅ Files downloaded to your Downloads folder.');
        } else {
            throw error; // Re-throw abort errors
        }
    }
}

// Donation panel toggle - initialize in DOMContentLoaded
function initDonationSidebar() {
    const donationSidebar = document.querySelector('.donation-sidebar');
    const coffeeBtn = document.getElementById('logo-coffee') || document.querySelector('.logo-coffee');
    
    if (coffeeBtn && donationSidebar) {
        donationSidebar.style.display = 'none';
        coffeeBtn.addEventListener('click', (e) => {
        e.preventDefault();
            e.stopPropagation();
            const isHidden = donationSidebar.style.display === 'none' || !donationSidebar.classList.contains('active');
            
            // Close other sidebars
            const simulatorSidebar = document.querySelector('.simulator-sidebar');
            const exportSidebar = document.querySelector('.export-sidebar');
            if (simulatorSidebar) {
                simulatorSidebar.style.display = 'none';
                simulatorSidebar.classList.remove('active');
            }
            if (exportSidebar) {
                exportSidebar.style.display = 'none';
                exportSidebar.classList.remove('active');
            }
            
            // Toggle donation sidebar
        if (isHidden) {
                donationSidebar.style.display = 'flex';
                donationSidebar.classList.add('active');
        } else {
                donationSidebar.style.display = 'none';
                donationSidebar.classList.remove('active');
        }
    });
    }
}

// Donation form handling
const donationFormEl = document.getElementById('donation-form');
const cardNumberEl = document.getElementById('card-number');
const expiryDateEl = document.getElementById('expiry-date');
const cvvEl = document.getElementById('cvv');
const donationMessageEl = document.getElementById('donation-message');

// Format card number with spaces
if (cardNumberEl) {
    cardNumberEl.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\s/g, ''); // Remove all spaces
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value; // Add space every 4 digits
        e.target.value = formattedValue;
    });
}

// Format expiry date as MM/YY
if (expiryDateEl) {
    expiryDateEl.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    });
}

// Only allow digits for CVV
if (cvvEl) {
    cvvEl.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
    });
}

// Handle donation form submission
if (donationFormEl) {
    donationFormEl.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = {
            name: document.getElementById('donor-name').value.trim(),
            cardNumber: cardNumberEl.value.replace(/\s/g, ''),
            expiryDate: expiryDateEl.value,
            cvv: cvvEl.value,
            amount: parseFloat(document.getElementById('donation-amount').value),
            email: document.getElementById('donor-email').value.trim()
        };
        
        // Validate card number (basic Luhn check would be better, but this is a simple validation)
        if (formData.cardNumber.length < 13 || formData.cardNumber.length > 19) {
            showDonationMessage('Please enter a valid card number', 'error');
            return;
        }
        
        // Validate expiry date
        if (!/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
            showDonationMessage('Please enter a valid expiry date (MM/YY)', 'error');
            return;
        }
        
        // Validate CVV
        if (formData.cvv.length < 3 || formData.cvv.length > 4) {
            showDonationMessage('Please enter a valid CVV', 'error');
            return;
        }
        
        // Validate amount
        if (formData.amount <= 0) {
            showDonationMessage('Please enter a valid donation amount', 'error');
            return;
        }
        
        // Simulate donation processing (in a real app, this would send to a payment processor)
        showDonationMessage('Processing donation...', 'success');
        
        // Simulate API call
        setTimeout(() => {
            // In a real application, you would send this data to your backend/payment processor
            // For now, we'll just show a success message
            console.log('Donation data:', {
                name: formData.name,
                cardNumber: '****' + formData.cardNumber.slice(-4), // Only log last 4 digits
                expiryDate: formData.expiryDate,
                amount: formData.amount,
                email: formData.email || 'Not provided'
            });
            
            showDonationMessage(`Thank you for your donation of $${formData.amount.toFixed(2)}! Your support is greatly appreciated! 🎉`, 'success');
            
            // Reset form
            donationFormEl.reset();
            
            // Clear message after 5 seconds
            setTimeout(() => {
                donationMessageEl.style.display = 'none';
                donationMessageEl.className = 'donation-message';
            }, 5000);
        }, 1500);
    });
}

function showDonationMessage(message, type) {
    if (!donationMessageEl) return;
    donationMessageEl.textContent = message;
    donationMessageEl.className = `donation-message ${type}`;
    donationMessageEl.style.display = 'block';
}

/* --- User Profile & Guide Logic --- */
const userProfileDisplay = document.getElementById('user-profile-display');
const profileNameEl = document.getElementById('profile-name');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const loginModal = document.getElementById('login-modal');
const modalLoginBtn = document.getElementById('modal-login-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const loginUsernameInput = document.getElementById('login-username');
const guideNextSteps = document.getElementById('guide-next-steps');
const guideRecText = document.getElementById('guide-recommendation-text');
const guideActionBtn = document.getElementById('guide-action-btn');
const guideOverlay = document.getElementById('guide-overlay');
const closeGuideOverlayBtn = document.getElementById('close-guide-overlay');
const overlayRecText = document.getElementById('overlay-rec-text');
const overlayActionBtn = document.getElementById('overlay-action-btn');
const profileModal = document.getElementById('profile-modal');
const profileCloseBtn = document.getElementById('profile-close-btn');
const profileDeposit = document.getElementById('profile-deposit');
const profileCasino = document.getElementById('profile-casino');
const profileSports = document.getElementById('profile-sports');
const profileWithdraw = document.getElementById('profile-withdraw');

let currentUser = null;
let sessionStats = {
    deposit: 0,
    casinoPlayed: 0,
    sportsPlayed: 0,
    withdrawn: 0,
    freeSpins: 0,
    freeSpinWinnings: 0, // Track winnings from free spins separately
    cashPlayed: 0, // Track cash play separately from free spins
    lastDepositDate: null, // Track when last deposit was made
    depositMethods: [], // Array of {amount, method, timestamp} - tracks how deposits were made
    // New wallet system
    walletEntries: [], // Array of {amount, source, id}
    plannedActivities: [], // Array of {game, amount, risk, id}
    // Global game stats - tracks wins/losses per game type
    gameStats: {
        sportsbook: { wins: 0, losses: 0, totalProfit: 0 },
        craps: { wins: 0, losses: 0, totalProfit: 0 },
        poker: { wins: 0, losses: 0, totalProfit: 0 }
    }
};

// Load User from LocalStorage
function loadUserProfile(username) {
    const data = localStorage.getItem(`bj_user_${username}`);
    if (data) {
        const profile = JSON.parse(data);
        // Ensure depositMethods exists for backward compatibility
        if (!profile.depositMethods) {
            profile.depositMethods = [];
        }
        return profile;
    } else {
        // Default / New Profile - only create if it doesn't exist
        const newProfile = {
            username: username,
            deposit: 0,
            casinoPlayed: 0,
            sportsPlayed: 0,
            withdrawn: 0,
            depositMethods: [] // Initialize deposit methods
        };
        
        // Pre-fill "Tyler" with transcription data if new
        if (username === "Tyler") {
            newProfile.deposit = 1664.61; // Casino + Sports deposits
            newProfile.casinoPlayed = 13329.70;
            newProfile.sportsPlayed = 344.35;
            newProfile.withdrawn = 1428.00; // Total withdrawn
            newProfile.depositMethods = []; // Initialize deposit methods
        }
        
        // Save the new profile to localStorage so it persists on the computer
        localStorage.setItem(`bj_user_${username}`, JSON.stringify(newProfile));
        return newProfile;
    }
}

function saveUserProfile() {
    if (!currentUser) return;
    // Update from inputs (guard elements may not exist in Blackjack-only view)
    currentUser.deposit = healthDeposit ? (parseFloat(healthDeposit.value) || 0) : 0;
    currentUser.casinoPlayed = healthCasino ? (parseFloat(healthCasino.value) || 0) : 0;
    currentUser.sportsPlayed = healthSports ? (parseFloat(healthSports.value) || 0) : 0;
    currentUser.withdrawn = healthWithdraw ? (parseFloat(healthWithdraw.value) || 0) : 0;
    
    // Save game stats to user profile
    if (sessionStats.gameStats) {
        currentUser.gameStats = sessionStats.gameStats;
    }
    
    localStorage.setItem(`bj_user_${currentUser.username}`, JSON.stringify(currentUser));
    updateCoach();
}

function updateUIForLogin() {
    if (currentUser) {
        userProfileDisplay.style.display = 'flex';
        loginBtn.style.display = 'none';
        profileNameEl.textContent = currentUser.username;
        
        // Load game stats from user profile if they exist
        if (currentUser.gameStats) {
            sessionStats.gameStats = currentUser.gameStats;
        } else {
            // Initialize if they don't exist
            initGameStats();
        }
        
        // Load session history from user profile
        if (currentUser.sessionHistory && Array.isArray(currentUser.sessionHistory)) {
            sessionHistory = currentUser.sessionHistory;
        } else {
            sessionHistory = [];
        }
        
        // Populate Health Dashboard with SESSION stats (initially 0 or manual)
        // But maybe we should let user input session stats manually?
        // For now, just show session stats in Tab 3
        if (healthDeposit) healthDeposit.value = sessionStats.deposit;
        if (healthCasino) healthCasino.value = sessionStats.casinoPlayed;
        if (healthSports) healthSports.value = sessionStats.sportsPlayed;
        if (healthWithdraw) healthWithdraw.value = sessionStats.withdrawn;
        if (healthFreeSpins) healthFreeSpins.value = sessionStats.freeSpins || 0;
        
        // Update game stats displays
        updateGameStatsDisplay('sportsbook');
        updateGameStatsDisplay('craps');
        updateGameStatsDisplay('poker');
        
        // Trigger updates
        updateHealth();
        updateCoach();
    } else {
        userProfileDisplay.style.display = 'none';
        loginBtn.style.display = 'block';
        
        // Clear Health Dashboard
        if (healthDeposit) healthDeposit.value = 0;
        if (healthCasino) healthCasino.value = 0;
        if (healthSports) healthSports.value = 0;
        if (healthWithdraw) healthWithdraw.value = 0;
        if (healthFreeSpins) healthFreeSpins.value = 0;
        updateHealth();
        if (guideOverlay) guideOverlay.style.display = 'none';
    }
}

function updateGuideRecommendation() {
    // Guide uses SESSION stats for immediate advice
    // But maybe it should use LIFETIME?
    // The user said "Health Dashboard = Current Session".
    // The Guide usually looks at Health Dashboard.
    // So Guide = Session.
    
    // Guard against null health inputs (they may not exist if Health tab isn't loaded)
    const deposit = healthDeposit ? (parseFloat(healthDeposit.value) || 0) : 0;
    const casino = healthCasino ? (parseFloat(healthCasino.value) || 0) : 0;
    const sports = healthSports ? (parseFloat(healthSports.value) || 0) : 0;
    const withdrawn = healthWithdraw ? (parseFloat(healthWithdraw.value) || 0) : 0;
    
    let rec = "";
    let actionTab = "";
    
    if (deposit === 0) {
        rec = "<strong>Step 1: Input</strong><br>Deposit funds via Gift Cards to earn +5% margin. Never use credit cards directly.";
        actionTab = "tab-guide"; 
    } else if (casino < deposit * 1) { 
        rec = "<strong>Step 2: The Wash</strong><br>Play Video Blackjack (Tab 1) to clean your funds. Target 1x turnover ($" + (deposit - casino).toFixed(0) + " more).";
        actionTab = "tab-wash";
    } else if (sports < (casino - deposit) * 0.5 && (casino - deposit) > 0) {
        rec = "<strong>Step 3: Transfer</strong><br>Move your Casino Profits to the Sportsbook wallet. Do not withdraw yet.";
        actionTab = "tab-health"; 
    } else if (sports < 5000 && withdrawn === 0) {
        rec = "<strong>Step 4: Camouflage</strong><br>Place Systematic Parlays (Tab 4) to build your 'Loser' profile. Target $5,000 played.";
        actionTab = "tab-parlay";
    } else if (withdrawn > sports * 0.5) {
        rec = "<strong>🚨 CRISIS:</strong> Withdrawal ratio too high! Stop withdrawing. Place more parlays immediately.";
        actionTab = "tab-parlay";
    } else {
        rec = "<strong>Step 5: Exit</strong><br>Ready to extract? Use Scenario A (Hedge Lose) or Scenario B (Casino Exit).";
        actionTab = "tab-health";
    }
    
    // Update Overlay
    if (guideOverlay && overlayRecText && overlayActionBtn) {
        overlayRecText.innerHTML = rec;
        overlayActionBtn.onclick = () => {
            document.querySelector(`[data-tab="${actionTab}"]`).click();
        };
        // Show overlay if logged in
        if (currentUser) guideOverlay.style.display = 'flex';
    }
}

// Show Profile Modal
if (userProfileDisplay) {
    userProfileDisplay.addEventListener('click', () => {
        if (currentUser && profileModal) {
            // Populate Profile Modal with LIFETIME stats
            profileDeposit.value = currentUser.deposit.toFixed(2);
            profileCasino.value = currentUser.casinoPlayed.toFixed(2);
            profileSports.value = currentUser.sportsPlayed.toFixed(2);
            profileWithdraw.value = currentUser.withdrawn.toFixed(2);
            
            profileModal.style.display = 'flex';
        }
    });
}

if (profileCloseBtn) {
    profileCloseBtn.addEventListener('click', () => {
        profileModal.style.display = 'none';
    });
}

// Event Listeners - Coach close button
const closeCoachOverlayBtn = document.getElementById('close-coach-overlay');
if (closeCoachOverlayBtn) {
    closeCoachOverlayBtn.addEventListener('click', () => {
        const theCoach = document.getElementById('the-coach');
        if (theCoach) theCoach.style.display = 'none';
    });
}

// Event Listeners
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        loginModal.style.display = 'flex';
        loginUsernameInput.focus();
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        saveUserProfile(); // Save before exit
        currentUser = null;
        updateUIForLogin();
    });
}

if (modalCancelBtn) {
    modalCancelBtn.addEventListener('click', () => {
        loginModal.style.display = 'none';
    });
}

if (modalLoginBtn) {
    modalLoginBtn.addEventListener('click', () => {
        const username = loginUsernameInput.value.trim();
        if (username) {
            currentUser = loadUserProfile(username);
            updateUIForLogin();
            loginModal.style.display = 'none';
        }
    });
}

// Auto-save on input change in Health Tab
if (healthDeposit) {
    [healthDeposit, healthCasino, healthSports, healthWithdraw].forEach(el => {
        el.addEventListener('change', saveUserProfile);
    });
}

// Auto-login Tyler on load (consolidated into main DOMContentLoaded)

/* --- Tab 3: Craps Logic --- */
function initCraps() {
    const crapsBankroll = document.getElementById('craps-bankroll');
    const crapsBaseBet = document.getElementById('craps-base-bet');
    const crapsPoint = document.getElementById('craps-point');
    const calcCrapsBtn = document.getElementById('calc-craps-btn');
    const crapsResult = document.getElementById('craps-result');
    
    if (calcCrapsBtn) {
        calcCrapsBtn.addEventListener('click', () => {
            const bankroll = parseFloat(crapsBankroll?.value) || 0;
            const baseBet = parseFloat(crapsBaseBet?.value) || 0;
            const point = crapsPoint?.value || "6";
            
            // Logic: Maximize Lay Odds (0% edge)
            // Standard max lay is usually 6x
            let maxOddsMultiple = 6; 
            let layAmount = baseBet * maxOddsMultiple;
            
            let riskAmount = 0;
            let winAmount = 0;
            let message = "";
            
            if (point === "4") { // 4 or 10
                // Pays 1:2. Risk 2 units to win 1.
                riskAmount = layAmount * 2; 
                winAmount = layAmount; 
                message = "Lay against 4/10 (Pays 1:2). High variance.";
            } else if (point === "5") { // 5 or 9
                // Pays 2:3. Risk 3 units to win 2.
                riskAmount = layAmount * 1.5;
                winAmount = layAmount;
                message = "Lay against 5/9 (Pays 2:3).";
            } else { // 6 or 8
                // Pays 5:6. Risk 6 units to win 5.
                riskAmount = layAmount * 1.2;
                winAmount = layAmount;
                message = "Lay against 6/8 (Pays 5:6). Safest lay.";
            }
            
            if (riskAmount + baseBet > bankroll) {
                if (crapsResult) {
                    crapsResult.innerHTML = `<div class="result-bad">⚠️ <strong>Bankroll Alert:</strong> Not enough funds to lay max odds. Reduce base bet to $${Math.floor(bankroll / 15)}.</div>`;
                    crapsResult.style.display = 'block';
                }
                return;
            }

            if (crapsResult) {
                crapsResult.style.display = 'block';
                crapsResult.className = 'scanner-result result-good';
                crapsResult.innerHTML = `
                    <strong>Strategy: Don't Pass + Lay Odds</strong><br>
                    Base Bet (Don't Pass): <strong>$${baseBet}</strong><br>
                    Lay Odds Amount: <strong>$${riskAmount.toFixed(0)}</strong> (To win $${winAmount.toFixed(0)})<br>
                    <small>${message}. House Edge on Odds: 0.00%.</small>
                `;
            }
        });
    }
}

/* --- Tab 4: GTO Poker Assistant Logic --- */
function initPoker() {
    const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
    const suits = ['♠', '♥', '♦', '♣'];
    const suitColors = { '♠': 'black', '♣': 'black', '♥': 'red', '♦': 'red' };
    
    let selectedHoleCards = [];
    let selectedBoardCards = [];
    let currentCardSelectorTarget = null;
    
    // DOM Elements
    const pokerStack = document.getElementById('poker-stack');
    const pokerPot = document.getElementById('poker-pot');
    const calcPokerBtn = document.getElementById('calc-poker-btn');
    const villainActionSelect = document.getElementById('poker-villain-action');
    const sprValue = document.getElementById('spr-value');
    const sprBar = document.getElementById('spr-bar');
    const sprAdvice = document.getElementById('spr-advice');
    const handMatrix = document.getElementById('hand-matrix');
    const simpleToggle = document.getElementById('poker-simple-toggle');
    const autoToggle = document.getElementById('poker-auto-toggle');
    const strategyAction = document.getElementById('strategy-action');
    const strategyFrequencies = document.getElementById('strategy-frequencies');
    const strategySizing = document.getElementById('strategy-sizing');
    const strategyContext = document.getElementById('strategy-context');
    const cardSelectorModal = document.getElementById('card-selector-modal');
    
    // Initialize Hand Matrix
    function buildHandMatrix() {
        if (!handMatrix) return;
        handMatrix.innerHTML = '';
        
        // Empty cell for top-left corner
        const cornerCell = document.createElement('div');
        cornerCell.className = 'matrix-cell header';
        cornerCell.style.visibility = 'hidden';
        handMatrix.appendChild(cornerCell);
        
        // Column headers (ranks across the top)
        for (let i = 0; i < ranks.length; i++) {
            const header = document.createElement('div');
            header.className = 'matrix-cell header';
            header.textContent = ranks[i];
            handMatrix.appendChild(header);
        }
        
        // Build matrix cells
        for (let row = 0; row < ranks.length; row++) {
            // Row header (rank on the left)
            const rowHeader = document.createElement('div');
            rowHeader.className = 'matrix-cell header';
            rowHeader.textContent = ranks[row];
            handMatrix.appendChild(rowHeader);
            
            for (let col = 0; col < ranks.length; col++) {
                const cell = document.createElement('div');
                cell.className = 'matrix-cell';
                
                if (row === col) {
                    // Pair
                    cell.classList.add('pair');
                    cell.textContent = ranks[row] + ranks[col];
                } else if (row < col) {
                    // Suited
                    cell.textContent = ranks[col] + ranks[row] + 's';
                } else {
                    // Offsuit
                    cell.textContent = ranks[row] + ranks[col] + 'o';
                }
                
                cell.dataset.hand = row === col ? ranks[row] + ranks[col] : 
                                   (row < col ? ranks[col] + ranks[row] + 's' : ranks[row] + ranks[col] + 'o');
                handMatrix.appendChild(cell);
            }
        }
    }
    
    // Card Selector
    function buildCardSelector() {
        if (!cardSelectorModal) return;
        const grid = cardSelectorModal.querySelector('.card-selector-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        for (const rank of ranks) {
            for (const suit of suits) {
                const item = document.createElement('div');
                item.className = 'card-selector-item';
                item.textContent = rank + suit;
                item.style.color = suitColors[suit] === 'red' ? '#dc2626' : '#1e293b';
                item.dataset.rank = rank;
                item.dataset.suit = suit;
                
                item.addEventListener('click', () => {
                    if (currentCardSelectorTarget) {
                        const card = { rank, suit, color: suitColors[suit] };
                        renderCard(currentCardSelectorTarget, card);
                        
                        if (currentCardSelectorTarget.id.startsWith('hole-card')) {
                            const index = parseInt(currentCardSelectorTarget.id.split('-')[2]) - 1;
                            selectedHoleCards[index] = card;
                        } else if (currentCardSelectorTarget.classList.contains('board-card')) {
                            const index = parseInt(currentCardSelectorTarget.dataset.index);
                            selectedBoardCards[index] = card;
                        }
                        
                        cardSelectorModal.style.display = 'none';
                        currentCardSelectorTarget = null;
                        updateStrategy();
                    }
                });
                
                grid.appendChild(item);
            }
        }
    }
    
    function renderCard(slot, card) {
        if (!slot || !card) return;
        slot.innerHTML = `
            <div class="card-face ${card.color}">
                <div class="rank">${card.rank}</div>
                <div class="suit">${card.suit}</div>
            </div>
        `;
        slot.classList.add('selected');
    }
    
    // Card slot click handlers
    document.querySelectorAll('.card-slot').forEach(slot => {
        slot.addEventListener('click', () => {
            currentCardSelectorTarget = slot;
            if (cardSelectorModal) {
                cardSelectorModal.style.display = 'block';
                buildCardSelector();
            }
        });
    });
    
    // Close modal on outside click
    if (cardSelectorModal) {
        cardSelectorModal.addEventListener('click', (e) => {
            if (e.target === cardSelectorModal) {
                cardSelectorModal.style.display = 'none';
                currentCardSelectorTarget = null;
            }
        });
    }
    
    // Stack Presets
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const stack = parseFloat(btn.dataset.stack);
            if (pokerStack) pokerStack.value = stack;
            updateSPR();
            maybeAutoUpdate();
        });
    });
    
    // Update SPR Display
    function updateSPR() {
        const stack = parseFloat(pokerStack?.value) || 0;
        const pot = parseFloat(pokerPot?.value) || 0;
        
        if (pot === 0) {
            if (sprValue) sprValue.textContent = '0.0';
            if (sprBar) sprBar.style.width = '0%';
            if (sprAdvice) sprAdvice.textContent = 'Enter pot size to calculate SPR';
            return;
        }
        
        const spr = stack / pot;
        if (sprValue) sprValue.textContent = spr.toFixed(1);
        
        // Update gauge (0-10 SPR range)
        const sprPercent = Math.min((spr / 10) * 100, 100);
        if (sprBar) sprBar.style.width = sprPercent + '%';
        
        // SPR Advice
        if (sprAdvice) {
            if (spr < 3) {
                sprAdvice.innerHTML = '<strong style="color: #ef4444;">COMMIT MODE:</strong> Top Pair is the nuts. Do not fold. Shove over bets.';
            } else if (spr < 6) {
                sprAdvice.innerHTML = '<strong style="color: #fbbf24;">CAUTION:</strong> Play strong draws and 2-pair+ aggressively. Tread lightly with 1-pair.';
            } else {
                sprAdvice.innerHTML = '<strong style="color: #22c55e;">DEEP STACK:</strong> Implied odds matter. Set mine, chase flushes. Fold Top Pair easily to aggression.';
            }
        }
    }
    
    // Update SPR on input change
    if (pokerStack) pokerStack.addEventListener('input', () => { updateSPR(); maybeAutoUpdate(); });
    if (pokerPot) pokerPot.addEventListener('input', () => { updateSPR(); maybeAutoUpdate(); });

    // Simple view toggle (hide matrix for faster decisions)
    if (simpleToggle && handMatrix) {
        simpleToggle.addEventListener('change', () => {
            if (simpleToggle.checked) {
                handMatrix.closest('.poker-matrix').style.display = 'none';
            } else {
                handMatrix.closest('.poker-matrix').style.display = 'block';
            }
        });
    }

    // Auto calc helper
    function maybeAutoUpdate() {
        if (!autoToggle || autoToggle.checked) {
            updateStrategy();
        }
    }

    // Quick hole cards / board buttons
    function setHoleFromString(str) {
        if (!str || str.length < 4) return;
        const c1 = { rank: str[0], suit: str[1], color: suitColors[str[1]] === 'red' ? 'red' : 'black' };
        const c2 = { rank: str[2], suit: str[3], color: suitColors[str[3]] === 'red' ? 'red' : 'black' };
        selectedHoleCards[0] = c1;
        selectedHoleCards[1] = c2;
        renderCard(document.getElementById('hole-card-1'), c1);
        renderCard(document.getElementById('hole-card-2'), c2);
        maybeAutoUpdate();
    }

    function setBoardFromString(str) {
        selectedBoardCards = [];
        const slots = document.querySelectorAll('.board-card');
        slots.forEach(s => {
            s.innerHTML = '<div class="card-placeholder">' + (s.dataset.index < 3 ? `Flop ${parseInt(s.dataset.index)+1}` : s.dataset.index === "3" ? 'Turn' : 'River') + '</div>';
            s.classList.remove('selected');
        });
        if (!str) { maybeAutoUpdate(); return; }
        const cards = [];
        for (let i = 0; i < str.length; i += 2) {
            const r = str[i];
            const su = str[i+1];
            if (!r || !su) break;
            cards.push({ rank: r, suit: su, color: suitColors[su] === 'red' ? 'red' : 'black' });
        }
        cards.slice(0,5).forEach((c, idx) => {
            selectedBoardCards[idx] = c;
            const slot = document.querySelector(`.board-card[data-index="${idx}"]`);
            if (slot) renderCard(slot, c);
        });
        maybeAutoUpdate();
    }

    document.querySelectorAll('.quick-btn[data-hole]').forEach(btn => {
        btn.addEventListener('click', () => {
            const str = btn.dataset.hole;
            if (str === 'AsKs') {
                setHoleFromString('AsKs');
            } else {
                setHoleFromString(str);
            }
        });
    });

    document.querySelectorAll('.quick-btn[data-board]').forEach(btn => {
        btn.addEventListener('click', () => {
            setBoardFromString(btn.dataset.board);
        });
    });

    // Board texture assessment for more nuanced advice
    const rankValue = { 'A':14,'K':13,'Q':12,'J':11,'T':10,'9':9,'8':8,'7':7,'6':6,'5':5,'4':4,'3':3,'2':2 };
    function getBoardTexture(boardCards) {
        const ranksSeen = {};
        const suitsSeen = {};
        boardCards.forEach(c => {
            if (!c) return;
            ranksSeen[c.rank] = (ranksSeen[c.rank] || 0) + 1;
            suitsSeen[c.suit] = (suitsSeen[c.suit] || 0) + 1;
        });
        const values = boardCards.filter(Boolean).map(c => rankValue[c.rank]).sort((a,b)=>a-b);
        let paired = false, trips = false, quads = false;
        Object.values(ranksSeen).forEach(v => {
            if (v === 2) paired = true;
            if (v === 3) trips = true;
            if (v === 4) quads = true;
        });
        const maxSuit = Math.max(0, ...Object.values(suitsSeen));
        const twoTone = maxSuit === 2;
        const flushDraw = maxSuit >= 3;
        // Straight draw potential on board
        let straighty = false;
        for (let i = 0; i < values.length - 2; i++) {
            if (values[i+2] - values[i] <= 4) straighty = true;
        }
        return { paired, trips, quads, twoTone, flushDraw, straighty };
    }

    function categorizeHand(hole, board) {
        if (hole.length < 2) return 'unknown';
        const ranksOnly = board.filter(Boolean).map(c => c.rank);
        const fullRanks = [...ranksOnly, hole[0].rank, hole[1].rank];
        const counts = {};
        fullRanks.forEach(r => counts[r] = (counts[r] || 0) + 1);
        const hasTripsPlus = Object.values(counts).some(v => v >= 3);
        const hasPair = Object.values(counts).some(v => v === 2);
        const boardTexture = getBoardTexture(board);
        if (boardTexture.quads || boardTexture.trips) {
            if (hasTripsPlus && boardTexture.trips === false) return 'strong';
        }
        if (hasTripsPlus) return 'strong';
        if (hasPair && boardTexture.paired) return 'marginal';
        if (hasPair) return 'medium';
        return 'weak';
    }
    
    // GTO Range Calculator
    function getGTORange(heroPos, villainPos, actionHistory, spr) {
        // Simplified GTO ranges based on position and action history
        const ranges = {
            'UTG': {
                'srp': { raise: ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AQs', 'AKo', 'AQo'], call: ['TT', '99', '88', 'AJs', 'KQs'], fold: 'rest' },
                '3bet': { raise: ['AA', 'KK', 'AKs', 'AKo'], call: ['QQ', 'JJ', 'AQs'], fold: 'rest' }
            },
            'CO': {
                'srp': { raise: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKs', 'AQs', 'AJs', 'KQs', 'AKo', 'AQo'], call: ['88', '77', 'ATs', 'KJs'], fold: 'rest' },
                '3bet': { raise: ['AA', 'KK', 'QQ', 'AKs', 'AKo'], call: ['JJ', 'AQs'], fold: 'rest' }
            },
            'BTN': {
                'srp': { raise: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', 'AKs', 'AQs', 'AJs', 'ATs', 'KQs', 'KJs', 'QJs', 'JTs', 'AKo', 'AQo', 'AJo', 'KQo'], call: ['55', '44', '33', '22', 'A9s', 'KTs'], fold: 'rest' },
                '3bet': { raise: ['AA', 'KK', 'QQ', 'AKs', 'AKo'], call: ['JJ', 'AQs', 'AJs'], fold: 'rest' }
            }
        };
        
        return ranges[heroPos]?.[actionHistory] || { raise: [], call: [], fold: 'rest' };
    }
    
    // Update Hand Matrix with GTO Colors
    function updateHandMatrix(heroPos, villainPos, actionHistory, spr) {
        if (!handMatrix) return;
        
        const range = getGTORange(heroPos, villainPos, actionHistory, spr);
        const raiseHands = new Set(range.raise || []);
        const callHands = new Set(range.call || []);
        
        handMatrix.querySelectorAll('.matrix-cell').forEach(cell => {
            if (cell.classList.contains('header')) return;
            
            const hand = cell.dataset.hand;
            if (!hand) return;
            
            // Normalize hand format for comparison
            const normalized = hand.replace(/[so]$/, '');
            
            cell.classList.remove('raise', 'call', 'fold');
            
            if (raiseHands.has(normalized) || raiseHands.has(hand)) {
                cell.classList.add('raise');
            } else if (callHands.has(normalized) || callHands.has(hand)) {
                cell.classList.add('call');
            } else {
                cell.classList.add('fold');
            }
        });
    }
    
    // Calculate Strategy
    function updateStrategy() {
        const heroPos = document.getElementById('poker-hero-pos')?.value || 'UTG';
        const villainPos = document.getElementById('poker-villain-pos')?.value || 'BB';
        const actionHistory = document.getElementById('poker-action-history')?.value || 'srp';
        const villainAction = villainActionSelect?.value || 'check';
        const stack = parseFloat(pokerStack?.value) || 100;
        const pot = parseFloat(pokerPot?.value) || 20;
        const spr = pot > 0 ? stack / pot : 0;
        const handCategory = categorizeHand(selectedHoleCards, selectedBoardCards);
        
        // Update matrix
        updateHandMatrix(heroPos, villainPos, actionHistory, spr);
        
        // Calculate strategy recommendation
        const range = getGTORange(heroPos, villainPos, actionHistory, spr);
        const hasHoleCards = selectedHoleCards.length === 2 && selectedHoleCards[0] && selectedHoleCards[1];
        
        if (hasHoleCards) {
            const hand1 = selectedHoleCards[0].rank + selectedHoleCards[1].rank;
            const hand2 = selectedHoleCards[1].rank + selectedHoleCards[0].rank;
            const isPair = selectedHoleCards[0].rank === selectedHoleCards[1].rank;
            const isSuited = !isPair && selectedHoleCards[0].suit === selectedHoleCards[1].suit;
            const handStr = isPair ? hand1 : (isSuited ? hand1 + 's' : hand1 + 'o');
            
            const inRaise = range.raise.includes(hand1) || range.raise.includes(hand2) || range.raise.includes(handStr);
            const inCall = range.call.includes(hand1) || range.call.includes(hand2) || range.call.includes(handStr);
            const isRangeHand = inRaise || inCall;
            
            let action = 'FOLD';
            let betFreq = 0;
            let checkFreq = 0;
            let foldFreq = 100;
            let betSize = 0;
            let context = '';
            
            if (villainAction === 'check') {
                if (inRaise) {
                    action = 'BET';
                    betFreq = handCategory === 'strong' ? 75 : 55;
                    checkFreq = 100 - betFreq;
                    foldFreq = 0;
                    betSize = spr < 3 ? 0.5 : 0.33;
                    context = 'Villain checked. Bet for value/protection; check back some bluff-catchers.';
                } else if (inCall) {
                    action = 'CHECK';
                    betFreq = handCategory === 'medium' ? 20 : 10;
                    checkFreq = 100 - betFreq;
                    foldFreq = 0;
                    betSize = 0.33;
                    context = 'Villain checked. Realize equity; occasional small bets for protection.';
                } else {
                    action = 'CHECK';
                    betFreq = 0;
                    checkFreq = 100;
                    foldFreq = 0;
                    betSize = 0;
                    context = 'Out of range hand. Take the free card; never fold to a check.';
                }
            } else if (villainAction === 'bet33') {
                if (inRaise) {
                    action = handCategory === 'strong' ? 'RAISE' : 'CALL';
                    betFreq = handCategory === 'strong' ? 80 : 0;
                    checkFreq = handCategory === 'strong' ? 0 : 80;
                    foldFreq = handCategory === 'strong' ? 20 : 20;
                    betSize = handCategory === 'strong' ? 0.9 : 0.33;
                    context = 'Facing 1/3 pot. Raise strong value; call mid-strength; fold bottom.';
                } else if (inCall) {
                    action = 'CALL';
                    betFreq = 0;
                    checkFreq = 75;
                    foldFreq = 25;
                    betSize = 0.33;
                    context = 'Facing 1/3 pot. Defend with your call range; fold weakest combos.';
                } else {
                    action = 'FOLD';
                    betFreq = 0;
                    checkFreq = 0;
                    foldFreq = 100;
                    betSize = 0;
                    context = 'Facing a bet: this hand is out of range, so fold.';
                }
            } else if (villainAction === 'bet75') {
                if (inRaise) {
                    action = 'CALL';
                    betFreq = 0;
                    checkFreq = 65;
                    foldFreq = 35;
                    betSize = 0.75;
                    context = 'Facing 3/4 pot. Call strong value; trim the bottom of your range.';
                } else if (inCall) {
                    action = 'CALL';
                    betFreq = 0;
                    checkFreq = 45;
                    foldFreq = 55;
                    betSize = 0.75;
                    context = 'Facing 3/4 pot. Defend the top of your call range; fold the rest.';
                } else {
                    action = 'FOLD';
                    betFreq = 0;
                    checkFreq = 0;
                    foldFreq = 100;
                    betSize = 0;
                    context = 'Facing a big bet: out-of-range hands should fold.';
                }
            } else { // all-in / jam
                if (inRaise) {
                    action = 'CALL';
                    betFreq = 0;
                    checkFreq = 40;
                    foldFreq = 60;
                    betSize = 1;
                    context = 'Facing jam. Call only the top of range; fold marginal hands.';
                } else {
                    action = 'FOLD';
                    betFreq = 0;
                    checkFreq = 0;
                    foldFreq = 100;
                    betSize = 0;
                    context = 'Facing jam: fold everything outside premium range.';
                }
            }
            
            if (strategyAction) {
                strategyAction.textContent = action;
                strategyAction.style.color = action === 'RAISE' || action === 'BET' ? '#22c55e' : action === 'CALL' || action === 'CHECK' ? '#fbbf24' : '#ef4444';
            }
            
            if (strategyFrequencies) {
                strategyFrequencies.innerHTML = `
                    <div class="frequency-bar">
                        <div class="frequency-label">
                            <span>Bet / Raise</span>
                            <span>${betFreq}%</span>
                        </div>
                        <div class="frequency-bar-fill" style="width: ${betFreq}%">${betFreq}%</div>
                    </div>
                    <div class="frequency-bar">
                        <div class="frequency-label">
                            <span>Check / Call</span>
                            <span>${checkFreq}%</span>
                        </div>
                        <div class="frequency-bar-fill" style="width: ${checkFreq}%; background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);">${checkFreq}%</div>
                    </div>
                    <div class="frequency-bar">
                        <div class="frequency-label">
                            <span>Fold</span>
                            <span>${foldFreq}%</span>
                        </div>
                        <div class="frequency-bar-fill" style="width: ${foldFreq}%; background: linear-gradient(90deg, #ef4444 0%, #f97316 100%);">${foldFreq}%</div>
                    </div>
                `;
            }
            
            if (strategySizing) {
                if (betSize > 0 && action !== 'FOLD') {
                    const betAmount = (pot * betSize).toFixed(2);
                    strategySizing.innerHTML = `
                        <strong>Preferred Size</strong>
                        <div style="font-size: 1.2em; margin-top: 5px;">$${betAmount} (${(betSize * 100).toFixed(0)}% Pot)</div>
                    `;
                } else if (action === 'CALL') {
                    const callAmount = villainAction === 'bet33' ? (pot * 0.33).toFixed(2) : villainAction === 'bet75' ? (pot * 0.75).toFixed(2) : (pot).toFixed(2);
                    strategySizing.innerHTML = `
                        <strong>Call Amount</strong>
                        <div style="font-size: 1.2em; margin-top: 5px;">$${callAmount}</div>
                    `;
                } else {
                    strategySizing.innerHTML = '<strong>No Bet Recommendation</strong><div style="margin-top: 5px;">Check / Fold as advised</div>';
                }
            }
            
            if (strategyContext) {
                strategyContext.textContent = context;
            }
        } else {
            if (strategyAction) strategyAction.textContent = 'Select Hole Cards';
            if (strategyFrequencies) strategyFrequencies.innerHTML = '';
            if (strategySizing) strategySizing.innerHTML = '';
            if (strategyContext) strategyContext.textContent = 'Enter your hole cards and game state to get GTO recommendations.';
        }
    }
    
    // Calculate button
    if (calcPokerBtn) {
        calcPokerBtn.addEventListener('click', updateStrategy);
    }
    
    // Update on input changes
    ['poker-hero-pos', 'poker-villain-pos', 'poker-action-history'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', maybeAutoUpdate);
    });
    if (villainActionSelect) villainActionSelect.addEventListener('change', maybeAutoUpdate);
    
    // Initialize - only if elements exist
    console.log('Initializing Poker Assistant...', {
        handMatrix: !!handMatrix,
        pokerStack: !!pokerStack,
        pokerPot: !!pokerPot,
        strategyAction: !!strategyAction
    });
    
    if (handMatrix) {
        buildHandMatrix();
        console.log('Hand matrix built, cells:', handMatrix.children.length);
    } else {
        console.warn('Hand matrix element not found');
    }
    
    if (pokerStack && pokerPot) {
        updateSPR();
    }
    
    if (strategyAction) {
        updateStrategy();
    }
    
    // Also set up a listener to initialize when tab is shown
    const pokerTab = document.getElementById('tab-poker');
    if (pokerTab) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (pokerTab.classList.contains('active')) {
                        console.log('Poker tab activated, checking initialization...');
                        const hm = document.getElementById('hand-matrix');
                        if (hm && hm.children.length === 0) {
                            console.log('Matrix empty, rebuilding...');
                            buildHandMatrix();
                            updateSPR();
                            updateStrategy();
                        }
                    }
                }
            });
        });
        observer.observe(pokerTab, { attributes: true });
    }
    
    console.log('Poker Assistant initialization complete');
}

/* --- New Wallet & Session Planner System --- */
let walletEntryIdCounter = 0;
let activityIdCounter = 0;

const walletEntriesEl = document.getElementById('wallet-entries');
const addWalletEntryBtn = document.getElementById('add-wallet-entry-btn');
const totalBankrollEl = document.getElementById('total-bankroll');
const cleanMoneyTotalEl = document.getElementById('clean-money-total');
const dirtyMoneyTotalEl = document.getElementById('dirty-money-total');
const dirtyBarEl = document.getElementById('dirty-bar');
const cleanBarEl = document.getElementById('clean-bar');
const dirtyPercentageEl = document.getElementById('dirty-percentage');
const washStatusEl = document.getElementById('wash-status');
const plannedActivitiesEl = document.getElementById('planned-activities');
const addActivityBtn = document.getElementById('add-activity-btn');
const projectedWageringEl = document.getElementById('projected-wagering');
const projectedTurnoverEl = document.getElementById('projected-turnover');
const projectedWashedEl = document.getElementById('projected-washed');

// Money sources (Clean vs Dirty)
const moneySources = {
    'fresh-deposit': { label: 'Fresh Deposit', clean: true, color: '#22c55e' },
    'free-spin-winnings': { label: 'Free Spin Winnings', clean: false, color: '#ef4444' },
    'sportsbook-winnings': { label: 'Sportsbook Winnings', clean: true, color: '#22c55e' },
    'retention-bonus': { label: 'Retention Bonus', clean: false, color: '#f87171' },
    'reload-bonus': { label: 'Reload Bonus', clean: false, color: '#f87171' },
    'cashback': { label: 'Cashback', clean: true, color: '#22c55e' }
};

// Game types for activities
const gameTypes = {
    'progressive-slots': { label: 'Progressive Slots', risk: 'Low', volatility: 'High', washEfficiency: 0.8 },
    'blackjack': { label: 'Blackjack', risk: 'High', volatility: 'Low', washEfficiency: 1.0 },
    'roulette': { label: 'Roulette', risk: 'Medium', volatility: 'Medium', washEfficiency: 0.9 },
    'video-poker': { label: 'Video Poker', risk: 'Medium', volatility: 'Medium', washEfficiency: 0.95 },
    'slots': { label: 'Regular Slots', risk: 'Low', volatility: 'High', washEfficiency: 0.85 }
};

function addWalletEntry(amount = 0, source = 'fresh-deposit') {
    const id = walletEntryIdCounter++;
    const entry = { id, amount, source };
    sessionStats.walletEntries.push(entry);
    renderWalletEntries();
    updateWalletSummary();
    updateMixingBowl();
    updateProjections();
}

function removeWalletEntry(id) {
    sessionStats.walletEntries = sessionStats.walletEntries.filter(e => e.id !== id);
    renderWalletEntries();
    updateWalletSummary();
    updateMixingBowl();
    updateProjections();
}

function renderWalletEntries() {
    if (!walletEntriesEl) return;
    
    if (sessionStats.walletEntries.length === 0) {
        walletEntriesEl.innerHTML = '<div style="color: #94a3b8; text-align: center; padding: 20px;">No money sources added yet. Click "Add Money Source" to begin.</div>';
        return;
    }
    
    walletEntriesEl.innerHTML = sessionStats.walletEntries.map(entry => {
        const source = moneySources[entry.source] || moneySources['fresh-deposit'];
        return `
            <div class="wallet-entry" data-id="${entry.id}" style="display: flex; gap: 10px; align-items: center; padding: 12px; background: rgba(0, 0, 0, 0.3); border-radius: 8px; margin-bottom: 10px; border-left: 3px solid ${source.color};">
                <input type="number" value="${entry.amount}" step="0.01" min="0" class="wallet-amount" data-id="${entry.id}" style="flex: 1; padding: 8px; border-radius: 6px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); color: #fff;">
                <select class="wallet-source" data-id="${entry.id}" style="flex: 2; padding: 8px; border-radius: 6px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); color: #fff;">
                    ${Object.entries(moneySources).map(([key, val]) => 
                        `<option value="${key}" ${entry.source === key ? 'selected' : ''}>${val.label}</option>`
                    ).join('')}
                </select>
                <button class="btn-icon remove-wallet-entry" data-id="${entry.id}" style="padding: 6px 12px; background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #f87171; border-radius: 6px; cursor: pointer;">×</button>
            </div>
        `;
    }).join('');
    
    // Add event listeners
    walletEntriesEl.querySelectorAll('.wallet-amount').forEach(input => {
        input.addEventListener('input', (e) => {
            const id = parseInt(e.target.dataset.id);
            const entry = sessionStats.walletEntries.find(e => e.id === id);
            if (entry) {
                entry.amount = parseFloat(e.target.value) || 0;
                updateWalletSummary();
                updateMixingBowl();
                updateProjections();
            }
        });
    });
    
    walletEntriesEl.querySelectorAll('.wallet-source').forEach(select => {
        select.addEventListener('change', (e) => {
            const id = parseInt(e.target.dataset.id);
            const entry = sessionStats.walletEntries.find(e => e.id === id);
            if (entry) {
                entry.source = e.target.value;
                renderWalletEntries();
                updateWalletSummary();
                updateMixingBowl();
                updateProjections();
            }
        });
    });
    
    walletEntriesEl.querySelectorAll('.remove-wallet-entry').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            removeWalletEntry(id);
        });
    });
}

function updateWalletSummary() {
    let total = 0;
    let clean = 0;
    let dirty = 0;
    
    sessionStats.walletEntries.forEach(entry => {
        total += entry.amount;
        const source = moneySources[entry.source];
        if (source.clean) {
            clean += entry.amount;
        } else {
            dirty += entry.amount;
        }
    });
    
    if (totalBankrollEl) totalBankrollEl.textContent = `$${total.toFixed(2)}`;
    if (cleanMoneyTotalEl) cleanMoneyTotalEl.textContent = `$${clean.toFixed(2)}`;
    if (dirtyMoneyTotalEl) dirtyMoneyTotalEl.textContent = `$${dirty.toFixed(2)}`;
    
    // Update sessionStats for backward compatibility
    sessionStats.deposit = clean;
    if (healthDeposit) healthDeposit.value = clean;
}

function updateMixingBowl() {
    let total = 0;
    let dirty = 0;
    
    sessionStats.walletEntries.forEach(entry => {
        total += entry.amount;
        const source = moneySources[entry.source];
        if (!source.clean) {
            dirty += entry.amount;
        }
    });
    
    const dirtyPercent = total > 0 ? (dirty / total) * 100 : 0;
    const cleanPercent = 100 - dirtyPercent;
    
    if (dirtyBarEl) dirtyBarEl.style.width = dirtyPercent + '%';
    if (cleanBarEl) cleanBarEl.style.width = cleanPercent + '%';
    if (dirtyPercentageEl) dirtyPercentageEl.textContent = dirtyPercent.toFixed(1) + '%';
    
    if (washStatusEl) {
        if (dirty === 0) {
            washStatusEl.textContent = '✅ All money is clean. No washing needed.';
        } else if (dirtyPercent > 50) {
            washStatusEl.innerHTML = `🚨 <strong>High Risk:</strong> ${dirtyPercent.toFixed(0)}% dirty money. Plan activities to wash it.`;
        } else if (dirtyPercent > 25) {
            washStatusEl.innerHTML = `⚠️ <strong>Moderate Risk:</strong> ${dirtyPercent.toFixed(0)}% dirty money. Add washing activities.`;
        } else {
            washStatusEl.innerHTML = `✅ <strong>Low Risk:</strong> Only ${dirtyPercent.toFixed(0)}% dirty money.`;
        }
    }
}

function addPlannedActivity(game = 'progressive-slots', amount = 0) {
    const id = activityIdCounter++;
    const activity = { id, game, amount };
    sessionStats.plannedActivities.push(activity);
    renderPlannedActivities();
    updateProjections();
}

function removePlannedActivity(id) {
    sessionStats.plannedActivities = sessionStats.plannedActivities.filter(a => a.id !== id);
    renderPlannedActivities();
    updateProjections();
}

function renderPlannedActivities() {
    if (!plannedActivitiesEl) return;
    
    if (sessionStats.plannedActivities.length === 0) {
        plannedActivitiesEl.innerHTML = '<div style="color: #94a3b8; text-align: center; padding: 20px;">No activities planned yet. Click "Add Activity" to plan your play.</div>';
        return;
    }
    
    plannedActivitiesEl.innerHTML = sessionStats.plannedActivities.map(activity => {
        const game = gameTypes[activity.game] || gameTypes['progressive-slots'];
        const noteHtml = game.note ? `<div style="font-size: 0.75em; color: #60a5fa; margin-top: 4px;">💡 ${game.note}</div>` : '';
        return `
            <div class="planned-activity" data-id="${activity.id}" style="padding: 12px; background: rgba(0, 0, 0, 0.3); border-radius: 8px; margin-bottom: 10px; border-left: 3px solid #fbbf24;">
                <div style="display: flex; gap: 10px; align-items: center;">
                    <select class="activity-game" data-id="${activity.id}" style="flex: 2; padding: 8px; border-radius: 6px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); color: #fff;">
                        ${Object.entries(gameTypes).map(([key, val]) => 
                            `<option value="${key}" ${activity.game === key ? 'selected' : ''}>${val.label} (${val.risk} Risk)</option>`
                        ).join('')}
                    </select>
                    <input type="number" value="${activity.amount}" step="0.01" min="0" class="activity-amount" data-id="${activity.id}" placeholder="Amount" style="flex: 1; padding: 8px; border-radius: 6px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); color: #fff;">
                    <button class="btn-icon remove-activity" data-id="${activity.id}" style="padding: 6px 12px; background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #f87171; border-radius: 6px; cursor: pointer;">×</button>
                </div>
                ${noteHtml}
            </div>
        `;
    }).join('');
    
    // Add event listeners
    plannedActivitiesEl.querySelectorAll('.activity-game').forEach(select => {
        select.addEventListener('change', (e) => {
            const id = parseInt(e.target.dataset.id);
            const activity = sessionStats.plannedActivities.find(a => a.id === id);
            if (activity) {
                activity.game = e.target.value;
                renderPlannedActivities();
                updateProjections();
            }
        });
    });
    
    plannedActivitiesEl.querySelectorAll('.activity-amount').forEach(input => {
        input.addEventListener('input', (e) => {
            const id = parseInt(e.target.dataset.id);
            const activity = sessionStats.plannedActivities.find(a => a.id === id);
            if (activity) {
                activity.amount = parseFloat(e.target.value) || 0;
                updateProjections();
            }
        });
    });
    
    plannedActivitiesEl.querySelectorAll('.remove-activity').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            removePlannedActivity(id);
        });
    });
}

function updateProjections() {
    let totalWagering = 0;
    let totalDirty = 0;
    
    // Calculate total dirty money
    sessionStats.walletEntries.forEach(entry => {
        const source = moneySources[entry.source];
        if (!source.clean) {
            totalDirty += entry.amount;
        }
    });
    
    // Calculate total planned wagering and washing
    let washedAmount = 0;
    sessionStats.plannedActivities.forEach(activity => {
        const amount = activity.amount || 0;
        totalWagering += amount;
        
        const game = gameTypes[activity.game] || gameTypes['progressive-slots'];
        // Washing efficiency: how much dirty money gets washed per dollar wagered
        const washFromThis = Math.min(amount * game.washEfficiency, totalDirty - washedAmount);
        washedAmount += washFromThis;
    });
    
    const cleanMoney = sessionStats.walletEntries.reduce((sum, e) => {
        return sum + (moneySources[e.source].clean ? e.amount : 0);
    }, 0);
    
    const totalDeposit = cleanMoney;
    const projectedTurnover = totalDeposit > 0 ? totalWagering / totalDeposit : 0;
    const washedPercent = totalDirty > 0 ? (washedAmount / totalDirty) * 100 : 0;
    
    if (projectedWageringEl) projectedWageringEl.textContent = `$${totalWagering.toFixed(2)}`;
    if (projectedTurnoverEl) projectedTurnoverEl.textContent = `${projectedTurnover.toFixed(1)}x`;
    if (projectedWashedEl) projectedWashedEl.textContent = `${washedPercent.toFixed(0)}%`;
    
    // Update health projection
    updateHealthProjection(totalWagering, projectedTurnover, washedPercent, totalDirty);
}

function updateHealthProjection(totalWagering, turnover, washedPercent, totalDirty) {
    if (!healthStatus) return;
    
    let statusHTML = '<h3 style="color: #fbbf24; margin-bottom: 15px;">📊 Account Health Projection</h3>';
    
    if (totalWagering === 0) {
        statusHTML += '<div style="color: #94a3b8; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 8px;">Add activities to see health projection.</div>';
    } else {
        // Turnover assessment
        if (turnover >= 5) {
            statusHTML += `<div style="color: #22c55e; margin-bottom: 10px; padding: 12px; background: rgba(34, 197, 94, 0.1); border-radius: 8px; border-left: 3px solid #22c55e;">
                <strong>✅ Excellent Turnover:</strong> ${turnover.toFixed(1)}x. Safe to withdraw using Method B.
            </div>`;
        } else if (turnover >= 2) {
            statusHTML += `<div style="color: #fbbf24; margin-bottom: 10px; padding: 12px; background: rgba(251, 191, 36, 0.1); border-radius: 8px; border-left: 3px solid #fbbf24;">
                <strong>⚠️ Moderate Turnover:</strong> ${turnover.toFixed(1)}x. Consider adding more activities to reach 5x+.
            </div>`;
        } else {
            statusHTML += `<div style="color: #f87171; margin-bottom: 10px; padding: 12px; background: rgba(239, 68, 68, 0.1); border-radius: 8px; border-left: 3px solid #ef4444;">
                <strong>🚨 Low Turnover:</strong> ${turnover.toFixed(1)}x. High risk. Add more activities before withdrawing.
            </div>`;
        }
        
        // Washing assessment
        if (totalDirty > 0) {
            if (washedPercent >= 100) {
                statusHTML += `<div style="color: #22c55e; margin-bottom: 10px; padding: 12px; background: rgba(34, 197, 94, 0.1); border-radius: 8px; border-left: 3px solid #22c55e;">
                    <strong>✅ All Dirty Money Washed:</strong> ${washedPercent.toFixed(0)}% of dirty money will be cleaned.
                </div>`;
            } else if (washedPercent >= 50) {
                statusHTML += `<div style="color: #fbbf24; margin-bottom: 10px; padding: 12px; background: rgba(251, 191, 36, 0.1); border-radius: 8px; border-left: 3px solid #fbbf24;">
                    <strong>⚠️ Partial Wash:</strong> ${washedPercent.toFixed(0)}% washed. Add more activities to wash remaining ${(100 - washedPercent).toFixed(0)}%.
                </div>`;
            } else {
                statusHTML += `<div style="color: #f87171; margin-bottom: 10px; padding: 12px; background: rgba(239, 68, 68, 0.1); border-radius: 8px; border-left: 3px solid #ef4444;">
                    <strong>🚨 Insufficient Washing:</strong> Only ${washedPercent.toFixed(0)}% washed. High risk of "Bonus Hunter" flag.
                </div>`;
            }
        }
        
        // Strategy recommendation
        const hasProgressive = sessionStats.plannedActivities.some(a => a.game === 'progressive-slots');
        if (hasProgressive) {
            statusHTML += `<div style="color: #60a5fa; margin-bottom: 10px; padding: 12px; background: rgba(59, 130, 246, 0.1); border-radius: 8px; border-left: 3px solid #3b82f6;">
                <strong>💡 Good Camouflage:</strong> Progressive slots make you look like a gambler, not a grinder.
            </div>`;
        }
    }
    
    healthStatus.innerHTML = statusHTML;
    healthStatus.style.display = 'block';
}

// Event listeners
if (addWalletEntryBtn) {
    addWalletEntryBtn.addEventListener('click', () => {
        addWalletEntry(0, 'fresh-deposit');
    });
}

if (addActivityBtn) {
    addActivityBtn.addEventListener('click', () => {
        addPlannedActivity('progressive-slots', 0);
    });
}

// Initialize wallet system (runs after DOM ready)
function initWalletSystem() {
    if (walletEntriesEl && addWalletEntryBtn) {
        renderWalletEntries();
        renderPlannedActivities();
        updateWalletSummary();
        updateMixingBowl();
        updateProjections();
    }
}

// ===== NEW HEALTH DASHBOARD WORKFLOW =====

// Session state
let currentSession = {
    active: false,
    site: null,
    game: null,
    startTime: null,
    wins: 0,
    losses: 0,
    total: 0,
    balance: 0, // Starting balance for this session
    moneyIn: 0, // Total money funneled INTO gambling site
    moneyOut: 0, // Total money funneled OUT of gambling site
    flowHistory: [] // Track money flow transactions
};

// Session history - stores all completed sessions
let sessionHistory = [];

// Step 1: Update Dashboard (Read-Only)
function updateHealthDashboard() {
    // Calculate totals from sessionStats
    const totalBankroll = (sessionStats.deposit || 0) + (sessionStats.casinoPlayed || 0) - (sessionStats.withdrawn || 0);
    
    // Calculate clean money based on deposit methods
    // Credit card deposits are already clean (better odds - no washing needed)
    // Gift card and other deposits need washing through casino play
    let cleanMoney = 0;
    if (sessionStats.depositMethods && sessionStats.depositMethods.length > 0) {
        // Sum credit card deposits (already clean - better odds)
        const creditCardDeposits = sessionStats.depositMethods
            .filter(d => d.method === 'credit-card')
            .reduce((sum, d) => sum + (d.amount || 0), 0);
        
        // Sum non-credit-card deposits (need washing)
        const nonCreditCardDeposits = sessionStats.depositMethods
            .filter(d => d.method !== 'credit-card')
            .reduce((sum, d) => sum + (d.amount || 0), 0);
        
        // Casino play washes non-credit-card deposits at 50% efficiency
        // Credit card deposits are already 100% clean
        const washedMoney = Math.min((sessionStats.casinoPlayed || 0) * 0.5, nonCreditCardDeposits);
        
        // Clean money = credit card deposits (100% clean) + washed money from other deposits
        cleanMoney = creditCardDeposits + washedMoney;
    } else {
        // Fallback: assume 50% is clean after play (for backward compatibility)
        cleanMoney = (sessionStats.casinoPlayed || 0) * 0.5;
    }
    
    const dirtyMoney = Math.max(0, totalBankroll - cleanMoney);
    
    // Update coach after health dashboard updates
    updateCoach();
    
    // Update dashboard display
    const totalBankrollEl = document.getElementById('dashboard-total-bankroll');
    const cleanMoneyEl = document.getElementById('dashboard-clean-money');
    const dirtyMoneyEl = document.getElementById('dashboard-dirty-money');
    const riskLevelEl = document.getElementById('dashboard-risk-level');
    const actionTextEl = document.getElementById('dashboard-action-text');
    
    if (totalBankrollEl) totalBankrollEl.textContent = `$${totalBankroll.toFixed(2)}`;
    if (cleanMoneyEl) cleanMoneyEl.textContent = `$${cleanMoney.toFixed(2)}`;
    if (dirtyMoneyEl) dirtyMoneyEl.textContent = `$${Math.max(0, dirtyMoney).toFixed(2)}`;
    
    // Determine risk level
    const dirtyPercent = totalBankroll > 0 ? (dirtyMoney / totalBankroll) * 100 : 0;
    let riskLevel = 'Low (Clean)';
    let riskColor = '#22c55e';
    
    if (dirtyPercent > 50) {
        riskLevel = 'High (Needs Washing)';
        riskColor = '#f87171';
    } else if (dirtyPercent > 25) {
        riskLevel = 'Medium (Monitor)';
        riskColor = '#fbbf24';
    }
    
    if (riskLevelEl) {
        riskLevelEl.textContent = `Risk Level: ${riskLevel}`;
        riskLevelEl.style.color = riskColor;
    }
    
    // Action required
    if (actionTextEl) {
        if (dirtyMoney > 0) {
            const washAmount = dirtyMoney * 2; // Need 2x turnover to wash
            actionTextEl.innerHTML = `You have <strong>$${dirtyMoney.toFixed(2)}</strong> of dirty money. <br>Suggested Action: Play <strong>$${washAmount.toFixed(2)}</strong> of Blackjack.`;
        } else {
            actionTextEl.textContent = 'No action needed. All funds are clean.';
        }
    }
}

// Step 2: Check-In Handlers
function initCheckInHandlers() {
    const addFundsBtn = document.getElementById('add-funds-btn');
    const withdrawFundsBtn = document.getElementById('withdraw-funds-btn');
    const addFundsModal = document.getElementById('add-funds-modal');
    const withdrawModal = document.getElementById('withdraw-modal');
    const addFundsConfirmBtn = document.getElementById('add-funds-confirm-btn');
    const addFundsCancelBtn = document.getElementById('add-funds-cancel-btn');
    const withdrawConfirmBtn = document.getElementById('withdraw-confirm-btn');
    const withdrawCancelBtn = document.getElementById('withdraw-cancel-btn');
    
    if (addFundsBtn && addFundsModal) {
        addFundsBtn.addEventListener('click', () => {
            addFundsModal.style.display = 'flex';
        });
    }
    
    if (addFundsCancelBtn && addFundsModal) {
        addFundsCancelBtn.addEventListener('click', () => {
            addFundsModal.style.display = 'none';
        });
    }
    
    if (addFundsConfirmBtn) {
        addFundsConfirmBtn.addEventListener('click', () => {
            const amount = parseFloat(document.getElementById('add-funds-amount')?.value || 0);
            const source = document.getElementById('add-funds-source')?.value || 'other';
            
            if (amount > 0) {
                // Track deposit method
                if (!sessionStats.depositMethods) {
                    sessionStats.depositMethods = [];
                }
                sessionStats.depositMethods.push({
                    amount: amount,
                    method: source,
                    timestamp: new Date().toISOString()
                });
                
                sessionStats.deposit = (sessionStats.deposit || 0) + amount;
                
                // Note: Credit card deposits are tracked as clean money in depositMethods
                // They don't need washing (better odds), but we don't add to casinoPlayed
                // until they're actually played. The clean money calculation handles this.
                
                // Update balance in blackjack page
                balance = (balance || 0) + amount;
                if (liveMode) {
                    liveMirrorBalance = (liveMirrorBalance || 0) + amount;
                }
                if (addFundsModal) addFundsModal.style.display = 'none';
                
                // Update all displays in correct order
                // updateHealthDashboard() calls updateCoach() internally, so we don't need to call it twice
                updateHealthDashboard(); // Updates health tab AND coach (coach is called inside)
                updateUI(); // Update blackjack balance display
                if (currentUser) saveUserProfile();
            }
        });
    }
    
    if (withdrawFundsBtn && withdrawModal) {
        withdrawFundsBtn.addEventListener('click', () => {
            withdrawModal.style.display = 'flex';
        });
    }
    
    if (withdrawCancelBtn && withdrawModal) {
        withdrawCancelBtn.addEventListener('click', () => {
            withdrawModal.style.display = 'none';
        });
    }
    
    if (withdrawConfirmBtn) {
        withdrawConfirmBtn.addEventListener('click', () => {
            const amount = parseFloat(document.getElementById('withdraw-amount')?.value || 0);
            
            if (amount > 0) {
                sessionStats.withdrawn = (sessionStats.withdrawn || 0) + amount;
                // Update balance in blackjack page
                balance = Math.max(0, (balance || 0) - amount);
                if (liveMode) {
                    liveMirrorBalance = Math.max(0, (liveMirrorBalance || 0) - amount);
                }
                if (withdrawModal) withdrawModal.style.display = 'none';
                updateHealthDashboard();
                updateUI(); // Update blackjack balance display
                updateCoach(); // Update coach with new balance
                if (currentUser) saveUserProfile();
            }
        });
    }
}

// Step 3: Session Mode Handlers
function initSessionHandlers() {
    const startSessionBtn = document.getElementById('start-session-btn');
    const startSessionModal = document.getElementById('start-session-modal');
    const startSessionConfirmBtn = document.getElementById('start-session-confirm-btn');
    const startSessionCancelBtn = document.getElementById('start-session-cancel-btn');
    const endSessionBtn = document.getElementById('end-session-btn');
    const recordWinBtn = document.getElementById('record-win-btn');
    const recordLossBtn = document.getElementById('record-loss-btn');
    
    if (startSessionBtn && startSessionModal) {
        startSessionBtn.addEventListener('click', () => {
            startSessionModal.style.display = 'flex';
        });
    }
    
    if (startSessionCancelBtn && startSessionModal) {
        startSessionCancelBtn.addEventListener('click', () => {
            startSessionModal.style.display = 'none';
        });
    }
    
    if (startSessionConfirmBtn) {
        startSessionConfirmBtn.addEventListener('click', () => {
            const site = document.getElementById('session-site-select')?.value || 'other';
            const game = document.getElementById('session-game-select')?.value || 'other';
            
            // Get starting balance (from Health dashboard or LIVE MIRROR mode)
            let startingBalance = 0;
            if (liveMode && liveMirrorBalance > 0) {
                startingBalance = liveMirrorBalance;
            } else {
                // Try to get from Health dashboard
                const totalBankroll = (sessionStats.deposit || 0) + (sessionStats.casinoPlayed || 0) - (sessionStats.withdrawn || 0);
                startingBalance = totalBankroll;
            }
            
            currentSession = {
                active: true,
                site: site,
                game: game,
                startTime: new Date(),
                wins: 0,
                losses: 0,
                total: 0,
                balance: startingBalance,
                moneyIn: 0,
                moneyOut: 0,
                flowHistory: []
            };
            
            updateSessionDisplay();
            updateSportsbookMoneyFlow();
            if (startSessionModal) startSessionModal.style.display = 'none';
        });
    }
    
    if (endSessionBtn) {
        endSessionBtn.addEventListener('click', () => {
            if (confirm('End current session?')) {
                // Save session to history before ending
                if (currentSession.active) {
                    const sessionData = {
                        id: Date.now().toString(),
                        site: currentSession.site,
                        game: currentSession.game,
                        startTime: currentSession.startTime,
                        endTime: new Date(),
                        duration: currentSession.startTime ? Math.floor((new Date() - new Date(currentSession.startTime)) / 1000 / 60) : 0, // minutes
                        wins: currentSession.wins,
                        losses: currentSession.losses,
                        total: currentSession.total,
                        startingBalance: currentSession.balance,
                        endingBalance: currentSession.balance + (currentSession.total || 0),
                        moneyIn: currentSession.moneyIn,
                        moneyOut: currentSession.moneyOut,
                        flowHistory: [...currentSession.flowHistory],
                        handHistory: liveMode ? [...liveMirrorStats.handHistory] : []
                    };
                    sessionHistory.push(sessionData);
                    
                    // Keep last 100 sessions
                    if (sessionHistory.length > 100) {
                        sessionHistory.shift();
                    }
                    
                    // Save to localStorage
                    if (currentUser) {
                        const userData = JSON.parse(localStorage.getItem(`bj_user_${currentUser.username}`) || '{}');
                        userData.sessionHistory = sessionHistory;
                        localStorage.setItem(`bj_user_${currentUser.username}`, JSON.stringify(userData));
                        currentUser.sessionHistory = sessionHistory; // Update current user object
                    }
                }
                // Save session data before ending
                const profit = currentSession.moneyOut - currentSession.moneyIn;
                if (profit !== 0) {
                    // Update session stats with final profit
                    sessionStats.sportsPlayed += currentSession.moneyIn;
                    sessionStats.withdrawn = (sessionStats.withdrawn || 0) + currentSession.moneyOut;
                }
                
                currentSession.active = false;
                updateSessionDisplay();
                updateHealthDashboard();
                if (currentUser) saveUserProfile();
            }
        });
    }
    
    // Export Data Button Handler (old - now opens sidebar)
    const exportDataBtn = document.getElementById('export-data-btn');
    if (exportDataBtn && !exportDataBtn.hasAttribute('data-listener-added')) {
        exportDataBtn.setAttribute('data-listener-added', 'true');
        exportDataBtn.addEventListener('click', () => {
            // Open export sidebar instead
            if (exportSidebarEl) {
                exportSidebarEl.style.display = 'flex';
                exportSidebarEl.classList.add('active');
            }
        });
    }
    
    if (recordWinBtn) {
        recordWinBtn.addEventListener('click', () => {
            const amount = parseFloat(document.getElementById('session-win-amount')?.value || 0);
            if (amount > 0 && currentSession.active) {
                currentSession.wins += amount;
                currentSession.total += amount;
                updateSessionDisplay();
                document.getElementById('session-win-amount').value = '';
            }
        });
    }
    
    if (recordLossBtn) {
        recordLossBtn.addEventListener('click', () => {
            const amount = parseFloat(document.getElementById('session-loss-amount')?.value || 0);
            if (amount > 0 && currentSession.active) {
                currentSession.losses += amount;
                currentSession.total -= amount;
                updateSessionDisplay();
                document.getElementById('session-loss-amount').value = '';
            }
        });
    }
}

function updateSessionDisplay() {
    const sessionNotStarted = document.getElementById('session-not-started');
    const sessionActive = document.getElementById('session-active');
    const sessionSiteEl = document.getElementById('session-site');
    const sessionGameEl = document.getElementById('session-game');
    const sessionStartTimeEl = document.getElementById('session-start-time');
    const sessionTotalEl = document.getElementById('session-total');
    const sessionWinsEl = document.getElementById('session-wins');
    const sessionLossesEl = document.getElementById('session-losses');
    
    if (currentSession.active) {
        if (sessionNotStarted) sessionNotStarted.style.display = 'none';
        if (sessionActive) sessionActive.style.display = 'block';
        if (sessionSiteEl) sessionSiteEl.textContent = currentSession.site;
        if (sessionGameEl) sessionGameEl.textContent = currentSession.game;
        if (sessionStartTimeEl) sessionStartTimeEl.textContent = currentSession.startTime.toLocaleTimeString();
        if (sessionTotalEl) sessionTotalEl.textContent = `$${currentSession.total.toFixed(2)}`;
        if (sessionWinsEl) sessionWinsEl.textContent = `$${currentSession.wins.toFixed(2)}`;
        if (sessionLossesEl) sessionLossesEl.textContent = `$${currentSession.losses.toFixed(2)}`;
    } else {
        if (sessionNotStarted) sessionNotStarted.style.display = 'block';
        if (sessionActive) sessionActive.style.display = 'none';
    }
    
    // Update Sportsbook money flow display
    updateSportsbookMoneyFlow();
}

// Update Sportsbook Money Flow Tracker
function updateSportsbookMoneyFlow() {
    const sportsMoneyFlow = document.getElementById('sports-money-flow');
    const sportsBalanceEl = document.getElementById('sports-balance');
    const sportsProfitEl = document.getElementById('sports-profit');
    const sportsFlowList = document.getElementById('sports-flow-list');
    
    if (!sportsMoneyFlow) return;
    
    // Show/hide based on session status
    if (currentSession.active) {
        sportsMoneyFlow.style.display = 'block';
        
        // Calculate current balance: starting balance + money out - money in
        const currentBalance = currentSession.balance + currentSession.moneyOut - currentSession.moneyIn;
        
        // Calculate profit: money out - money in (net money returned)
        const profit = currentSession.moneyOut - currentSession.moneyIn;
        
        if (sportsBalanceEl) {
            sportsBalanceEl.textContent = `$${currentBalance.toFixed(2)}`;
        }
        
        if (sportsProfitEl) {
            sportsProfitEl.textContent = profit >= 0 ? `+$${profit.toFixed(2)}` : `$${profit.toFixed(2)}`;
            sportsProfitEl.style.color = profit >= 0 ? '#22c55e' : '#f87171';
        }
        
        // Update flow history
        if (sportsFlowList) {
            if (currentSession.flowHistory.length === 0) {
                sportsFlowList.innerHTML = '<div style="color: #94a3b8;">No transactions yet.</div>';
            } else {
                let historyHTML = '';
                currentSession.flowHistory.slice(-10).reverse().forEach(transaction => {
                    const type = transaction.type === 'in' ? '💰 In' : '💵 Out';
                    const color = transaction.type === 'in' ? '#ef4444' : '#22c55e';
                    const sign = transaction.type === 'in' ? '-' : '+';
                    historyHTML += `
                        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <div>
                                <span style="color: ${color}; font-weight: bold;">${type}</span>
                                <span style="color: #94a3b8; margin-left: 8px; font-size: 0.9em;">${transaction.note || ''}</span>
                            </div>
                            <div style="color: ${color}; font-weight: bold;">${sign}$${transaction.amount.toFixed(2)}</div>
                        </div>
                    `;
                });
                sportsFlowList.innerHTML = historyHTML;
            }
        }
    } else {
        sportsMoneyFlow.style.display = 'none';
    }
}

// ===== FILE EXPORT FUNCTIONALITY =====

// Export all data to files (creates folder structure and .txt files)
async function exportDataToFiles() {
    if (!currentUser) {
        alert('Please log in first to export data.');
        return;
    }
    
    try {
        // Check if File System Access API is available (Chrome/Edge)
        if ('showDirectoryPicker' in window) {
            // Use File System Access API to create folder
            const dirHandle = await window.showDirectoryPicker();
            const folderName = `BlackjackTracker_${currentUser.username}_${new Date().toISOString().split('T')[0]}`;
            const folderHandle = await dirHandle.getDirectoryHandle(folderName, { create: true });
            
            // Create session history file
            const sessionHistoryFile = await folderHandle.getFileHandle('session_history.txt', { create: true });
            const sessionHistoryWritable = await sessionHistoryFile.createWritable();
            const sessionHistoryText = formatSessionHistory();
            await sessionHistoryWritable.write(sessionHistoryText);
            await sessionHistoryWritable.close();
            
            // Create stats file
            const statsFile = await folderHandle.getFileHandle('stats.txt', { create: true });
            const statsWritable = await statsFile.createWritable();
            const statsText = formatStats();
            await statsWritable.write(statsText);
            await statsWritable.close();
            
            // Create game stats file
            const gameStatsFile = await folderHandle.getFileHandle('game_stats.txt', { create: true });
            const gameStatsWritable = await gameStatsFile.createWritable();
            const gameStatsText = formatGameStats();
            await gameStatsWritable.write(gameStatsText);
            await gameStatsWritable.close();
            
            alert(`✅ Data exported successfully to:\n${folderName}\n\nFiles created:\n- session_history.txt\n- stats.txt\n- game_stats.txt`);
        } else {
            // Fallback: Download files directly
            downloadFile('session_history.txt', formatSessionHistory());
            downloadFile('stats.txt', formatStats());
            downloadFile('game_stats.txt', formatGameStats());
            alert('✅ Data exported! Files downloaded to your Downloads folder.\n\nNote: For folder organization, use Chrome or Edge browser.');
        }
    } catch (error) {
        console.error('Export error:', error);
        if (error.name !== 'AbortError') {
            // Fallback to download if user cancels folder picker
            downloadFile('session_history.txt', formatSessionHistory());
            downloadFile('stats.txt', formatStats());
            downloadFile('game_stats.txt', formatGameStats());
            alert('✅ Data exported! Files downloaded to your Downloads folder.');
        }
    }
}

// Format session history as text
function formatSessionHistory() {
    let text = `BLACKJACK TRACKER - SESSION HISTORY\n`;
    text += `User: ${currentUser.username}\n`;
    text += `Export Date: ${new Date().toLocaleString()}\n`;
    text += `Total Sessions: ${sessionHistory.length}\n`;
    text += `\n${'='.repeat(80)}\n\n`;
    
    if (sessionHistory.length === 0) {
        text += 'No sessions recorded yet.\n';
    } else {
        sessionHistory.forEach((session, index) => {
            text += `SESSION #${index + 1}\n`;
            text += `${'-'.repeat(80)}\n`;
            text += `Site: ${session.site || 'N/A'}\n`;
            text += `Game: ${session.game || 'N/A'}\n`;
            text += `Start Time: ${new Date(session.startTime).toLocaleString()}\n`;
            text += `End Time: ${new Date(session.endTime).toLocaleString()}\n`;
            text += `Duration: ${session.duration} minutes\n`;
            text += `Starting Balance: $${session.startingBalance.toFixed(2)}\n`;
            text += `Ending Balance: $${session.endingBalance.toFixed(2)}\n`;
            text += `Net Profit: $${(session.endingBalance - session.startingBalance).toFixed(2)}\n`;
            text += `Wins: $${session.wins.toFixed(2)}\n`;
            text += `Losses: $${session.losses.toFixed(2)}\n`;
            text += `Money In: $${session.moneyIn.toFixed(2)}\n`;
            text += `Money Out: $${session.moneyOut.toFixed(2)}\n`;
            
            if (session.flowHistory && session.flowHistory.length > 0) {
                text += `\nMoney Flow Transactions:\n`;
                session.flowHistory.forEach((flow, i) => {
                    text += `  ${i + 1}. ${flow.type === 'in' ? 'Money In' : 'Money Out'}: $${flow.amount.toFixed(2)} - ${flow.note || 'No note'} (${new Date(flow.time).toLocaleString()})\n`;
                });
            }
            
            if (session.handHistory && session.handHistory.length > 0) {
                text += `\nHand History (Last ${session.handHistory.length} hands):\n`;
                session.handHistory.forEach((hand, i) => {
                    text += `  ${i + 1}. ${hand.result.toUpperCase()}: $${hand.bet.toFixed(2)} bet, $${hand.profit >= 0 ? '+' : ''}${hand.profit.toFixed(2)} profit (${new Date(hand.time).toLocaleString()})\n`;
                });
            }
            
            text += `\n${'='.repeat(80)}\n\n`;
        });
    }
    
    return text;
}

// Format stats as text
function formatStats() {
    let text = `BLACKJACK TRACKER - STATISTICS\n`;
    text += `User: ${currentUser.username}\n`;
    text += `Export Date: ${new Date().toLocaleString()}\n`;
    text += `\n${'='.repeat(80)}\n\n`;
    
    text += `FINANCIAL SUMMARY\n`;
    text += `${'-'.repeat(80)}\n`;
    text += `Total Deposits: $${(sessionStats.deposit || 0).toFixed(2)}\n`;
    text += `Casino Played: $${(sessionStats.casinoPlayed || 0).toFixed(2)}\n`;
    text += `Sportsbook Played: $${(sessionStats.sportsPlayed || 0).toFixed(2)}\n`;
    text += `Total Withdrawn: $${(sessionStats.withdrawn || 0).toFixed(2)}\n`;
    
    const totalBankroll = (sessionStats.deposit || 0) + (sessionStats.casinoPlayed || 0) - (sessionStats.withdrawn || 0);
    text += `Total Bankroll: $${totalBankroll.toFixed(2)}\n`;
    
    text += `\n${'='.repeat(80)}\n\n`;
    
    text += `LIVE MIRROR STATS\n`;
    text += `${'-'.repeat(80)}\n`;
    text += `Hands Played: ${liveMirrorStats.handsPlayed}\n`;
    text += `Hands Won: ${liveMirrorStats.handsWon}\n`;
    text += `Hands Lost: ${liveMirrorStats.handsLost}\n`;
    text += `Hands Pushed: ${liveMirrorStats.handsPushed}\n`;
    text += `Total Wagered: $${liveMirrorStats.totalWagered.toFixed(2)}\n`;
    text += `Total Profit: $${liveMirrorStats.totalProfit >= 0 ? '+' : ''}${liveMirrorStats.totalProfit.toFixed(2)}\n`;
    text += `Perfect Strategy Count: ${liveMirrorStats.perfectStrategyCount}\n`;
    
    return text;
}

// Format game stats as text
function formatGameStats() {
    let text = `BLACKJACK TRACKER - GAME STATISTICS\n`;
    text += `User: ${currentUser.username}\n`;
    text += `Export Date: ${new Date().toLocaleString()}\n`;
    text += `\n${'='.repeat(80)}\n\n`;
    
    if (sessionStats.gameStats) {
        const games = ['sportsbook', 'craps', 'poker'];
        games.forEach(game => {
            const stats = sessionStats.gameStats[game];
            if (stats) {
                text += `${game.toUpperCase()}\n`;
                text += `${'-'.repeat(80)}\n`;
                text += `Total Wins: $${stats.wins.toFixed(2)}\n`;
                text += `Total Losses: $${stats.losses.toFixed(2)}\n`;
                text += `Net Profit: $${stats.totalProfit >= 0 ? '+' : ''}${stats.totalProfit.toFixed(2)}\n`;
                text += `\n`;
            }
        });
    } else {
        text += 'No game statistics recorded yet.\n';
    }
    
    return text;
}

// Download file as fallback
function downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ===== GLOBAL GAME WIN/LOSS TRACKING =====

// Initialize game stats if they don't exist
function initGameStats() {
    if (!sessionStats.gameStats) {
        sessionStats.gameStats = {
            sportsbook: { wins: 0, losses: 0, totalProfit: 0 },
            craps: { wins: 0, losses: 0, totalProfit: 0 },
            poker: { wins: 0, losses: 0, totalProfit: 0 }
        };
    }
}

// Update game stats display for a specific game
function updateGameStatsDisplay(gameType) {
    const stats = sessionStats.gameStats[gameType];
    if (!stats) return;
    
    const winsEl = document.getElementById(`${gameType}-wins`);
    const lossesEl = document.getElementById(`${gameType}-losses`);
    const netProfitEl = document.getElementById(`${gameType}-net-profit`);
    
    if (winsEl) winsEl.textContent = `$${stats.wins.toFixed(2)}`;
    if (lossesEl) lossesEl.textContent = `$${stats.losses.toFixed(2)}`;
    if (netProfitEl) {
        const profit = stats.totalProfit;
        netProfitEl.textContent = profit >= 0 ? `+$${profit.toFixed(2)}` : `$${profit.toFixed(2)}`;
        netProfitEl.style.color = profit >= 0 ? '#22c55e' : '#f87171';
    }
}

// Record win for a specific game
function recordGameWin(gameType, amount) {
    if (!amount || amount <= 0) return;
    
    initGameStats();
    const stats = sessionStats.gameStats[gameType];
    stats.wins += amount;
    stats.totalProfit += amount;
    
    // Update session stats
    if (gameType === 'sportsbook') {
        sessionStats.sportsPlayed += amount;
    } else if (gameType === 'craps') {
        sessionStats.casinoPlayed += amount;
    } else if (gameType === 'poker') {
        sessionStats.casinoPlayed += amount;
    }
    
    updateGameStatsDisplay(gameType);
    updateHealthDashboard();
    updateCoach(); // Update coach when game wins recorded
    if (currentUser) saveUserProfile();
}

// Record loss for a specific game
function recordGameLoss(gameType, amount) {
    if (!amount || amount <= 0) return;
    
    initGameStats();
    const stats = sessionStats.gameStats[gameType];
    stats.losses += amount;
    stats.totalProfit -= amount;
    
    // Update session stats
    if (gameType === 'sportsbook') {
        sessionStats.sportsPlayed += amount;
    } else if (gameType === 'craps') {
        sessionStats.casinoPlayed += amount;
    } else if (gameType === 'poker') {
        sessionStats.casinoPlayed += amount;
    }
    
    updateGameStatsDisplay(gameType);
    updateHealthDashboard();
    updateCoach(); // Update coach when game losses recorded
    if (currentUser) saveUserProfile();
}

// Initialize all game win/loss tracking handlers
function initGameWinLossTracking() {
    initGameStats();
    
    // Sportsbook handlers
    const sportsWinBtn = document.getElementById('sports-record-win-btn');
    const sportsLossBtn = document.getElementById('sports-record-loss-btn');
    
    if (sportsWinBtn) {
        sportsWinBtn.addEventListener('click', () => {
            const amount = parseFloat(document.getElementById('sports-win-amount')?.value || 0);
            if (amount > 0) {
                recordGameWin('sportsbook', amount);
                document.getElementById('sports-win-amount').value = '';
            }
        });
    }
    
    if (sportsLossBtn) {
        sportsLossBtn.addEventListener('click', () => {
            const amount = parseFloat(document.getElementById('sports-loss-amount')?.value || 0);
            if (amount > 0) {
                recordGameLoss('sportsbook', amount);
                document.getElementById('sports-loss-amount').value = '';
            }
        });
    }
    
    // Craps handlers
    const crapsWinBtn = document.getElementById('craps-record-win-btn');
    const crapsLossBtn = document.getElementById('craps-record-loss-btn');
    
    if (crapsWinBtn) {
        crapsWinBtn.addEventListener('click', () => {
            const amount = parseFloat(document.getElementById('craps-win-amount')?.value || 0);
            if (amount > 0) {
                recordGameWin('craps', amount);
                document.getElementById('craps-win-amount').value = '';
            }
        });
    }
    
    if (crapsLossBtn) {
        crapsLossBtn.addEventListener('click', () => {
            const amount = parseFloat(document.getElementById('craps-loss-amount')?.value || 0);
            if (amount > 0) {
                recordGameLoss('craps', amount);
                document.getElementById('craps-loss-amount').value = '';
            }
        });
    }
    
    // Poker handlers
    const pokerWinBtn = document.getElementById('poker-record-win-btn');
    const pokerLossBtn = document.getElementById('poker-record-loss-btn');
    
    if (pokerWinBtn) {
        pokerWinBtn.addEventListener('click', () => {
            const amount = parseFloat(document.getElementById('poker-win-amount')?.value || 0);
            if (amount > 0) {
                recordGameWin('poker', amount);
                document.getElementById('poker-win-amount').value = '';
            }
        });
    }
    
    if (pokerLossBtn) {
        pokerLossBtn.addEventListener('click', () => {
            const amount = parseFloat(document.getElementById('poker-loss-amount')?.value || 0);
            if (amount > 0) {
                recordGameLoss('poker', amount);
                document.getElementById('poker-loss-amount').value = '';
            }
        });
    }
    
    // Update all displays on load
    updateGameStatsDisplay('sportsbook');
    updateGameStatsDisplay('craps');
    updateGameStatsDisplay('poker');
}

// ===== FILE EXPORT FUNCTIONALITY =====

// Export all data to files (creates folder structure and .txt files)
async function exportDataToFiles() {
    if (!currentUser) {
        alert('Please log in first to export data.');
        return;
    }
    
    try {
        // Check if File System Access API is available (Chrome/Edge)
        if ('showDirectoryPicker' in window) {
            // Use File System Access API to create folder
            const dirHandle = await window.showDirectoryPicker();
            const folderName = `BlackjackTracker_${currentUser.username}_${new Date().toISOString().split('T')[0]}`;
            const folderHandle = await dirHandle.getDirectoryHandle(folderName, { create: true });
            
            // Create session history file
            const sessionHistoryFile = await folderHandle.getFileHandle('session_history.txt', { create: true });
            const sessionHistoryWritable = await sessionHistoryFile.createWritable();
            const sessionHistoryText = formatSessionHistory();
            await sessionHistoryWritable.write(sessionHistoryText);
            await sessionHistoryWritable.close();
            
            // Create stats file
            const statsFile = await folderHandle.getFileHandle('stats.txt', { create: true });
            const statsWritable = await statsFile.createWritable();
            const statsText = formatStats();
            await statsWritable.write(statsText);
            await statsWritable.close();
            
            // Create game stats file
            const gameStatsFile = await folderHandle.getFileHandle('game_stats.txt', { create: true });
            const gameStatsWritable = await gameStatsFile.createWritable();
            const gameStatsText = formatGameStats();
            await gameStatsWritable.write(gameStatsText);
            await gameStatsWritable.close();
            
            alert(`✅ Data exported successfully to:\n${folderName}\n\nFiles created:\n- session_history.txt\n- stats.txt\n- game_stats.txt`);
        } else {
            // Fallback: Download files directly
            downloadFile('session_history.txt', formatSessionHistory());
            downloadFile('stats.txt', formatStats());
            downloadFile('game_stats.txt', formatGameStats());
            alert('✅ Data exported! Files downloaded to your Downloads folder.\n\nNote: For folder organization, use Chrome or Edge browser.');
        }
    } catch (error) {
        console.error('Export error:', error);
        if (error.name !== 'AbortError') {
            // Fallback to download if user cancels folder picker
            downloadFile('session_history.txt', formatSessionHistory());
            downloadFile('stats.txt', formatStats());
            downloadFile('game_stats.txt', formatGameStats());
            alert('✅ Data exported! Files downloaded to your Downloads folder.');
        }
    }
}

// Format session history as text
function formatSessionHistory() {
    let text = `BLACKJACK TRACKER - SESSION HISTORY\n`;
    text += `User: ${currentUser.username}\n`;
    text += `Export Date: ${new Date().toLocaleString()}\n`;
    text += `Total Sessions: ${sessionHistory.length}\n`;
    text += `\n${'='.repeat(80)}\n\n`;
    
    if (sessionHistory.length === 0) {
        text += 'No sessions recorded yet.\n';
    } else {
        sessionHistory.forEach((session, index) => {
            text += `SESSION #${index + 1}\n`;
            text += `${'-'.repeat(80)}\n`;
            text += `Site: ${session.site || 'N/A'}\n`;
            text += `Game: ${session.game || 'N/A'}\n`;
            text += `Start Time: ${new Date(session.startTime).toLocaleString()}\n`;
            text += `End Time: ${new Date(session.endTime).toLocaleString()}\n`;
            text += `Duration: ${session.duration} minutes\n`;
            text += `Starting Balance: $${session.startingBalance.toFixed(2)}\n`;
            text += `Ending Balance: $${session.endingBalance.toFixed(2)}\n`;
            text += `Net Profit: $${(session.endingBalance - session.startingBalance).toFixed(2)}\n`;
            text += `Wins: $${session.wins.toFixed(2)}\n`;
            text += `Losses: $${session.losses.toFixed(2)}\n`;
            text += `Money In: $${session.moneyIn.toFixed(2)}\n`;
            text += `Money Out: $${session.moneyOut.toFixed(2)}\n`;
            
            if (session.flowHistory && session.flowHistory.length > 0) {
                text += `\nMoney Flow Transactions:\n`;
                session.flowHistory.forEach((flow, i) => {
                    text += `  ${i + 1}. ${flow.type === 'in' ? 'Money In' : 'Money Out'}: $${flow.amount.toFixed(2)} - ${flow.note || 'No note'} (${new Date(flow.time).toLocaleString()})\n`;
                });
            }
            
            if (session.handHistory && session.handHistory.length > 0) {
                text += `\nHand History (Last ${session.handHistory.length} hands):\n`;
                session.handHistory.forEach((hand, i) => {
                    text += `  ${i + 1}. ${hand.result.toUpperCase()}: $${hand.bet.toFixed(2)} bet, $${hand.profit >= 0 ? '+' : ''}${hand.profit.toFixed(2)} profit (${new Date(hand.time).toLocaleString()})\n`;
                });
            }
            
            text += `\n${'='.repeat(80)}\n\n`;
        });
    }
    
    return text;
}

// Format stats as text
function formatStats() {
    let text = `BLACKJACK TRACKER - STATISTICS\n`;
    text += `User: ${currentUser.username}\n`;
    text += `Export Date: ${new Date().toLocaleString()}\n`;
    text += `\n${'='.repeat(80)}\n\n`;
    
    text += `FINANCIAL SUMMARY\n`;
    text += `${'-'.repeat(80)}\n`;
    text += `Total Deposits: $${(sessionStats.deposit || 0).toFixed(2)}\n`;
    text += `Casino Played: $${(sessionStats.casinoPlayed || 0).toFixed(2)}\n`;
    text += `Sportsbook Played: $${(sessionStats.sportsPlayed || 0).toFixed(2)}\n`;
    text += `Total Withdrawn: $${(sessionStats.withdrawn || 0).toFixed(2)}\n`;
    
    const totalBankroll = (sessionStats.deposit || 0) + (sessionStats.casinoPlayed || 0) - (sessionStats.withdrawn || 0);
    text += `Total Bankroll: $${totalBankroll.toFixed(2)}\n`;
    
    text += `\n${'='.repeat(80)}\n\n`;
    
    text += `LIVE MIRROR STATS\n`;
    text += `${'-'.repeat(80)}\n`;
    text += `Hands Played: ${liveMirrorStats.handsPlayed}\n`;
    text += `Hands Won: ${liveMirrorStats.handsWon}\n`;
    text += `Hands Lost: ${liveMirrorStats.handsLost}\n`;
    text += `Hands Pushed: ${liveMirrorStats.handsPushed}\n`;
    text += `Total Wagered: $${liveMirrorStats.totalWagered.toFixed(2)}\n`;
    text += `Total Profit: $${liveMirrorStats.totalProfit >= 0 ? '+' : ''}${liveMirrorStats.totalProfit.toFixed(2)}\n`;
    text += `Perfect Strategy Count: ${liveMirrorStats.perfectStrategyCount}\n`;
    
    return text;
}

// Format game stats as text
function formatGameStats() {
    let text = `BLACKJACK TRACKER - GAME STATISTICS\n`;
    text += `User: ${currentUser.username}\n`;
    text += `Export Date: ${new Date().toLocaleString()}\n`;
    text += `\n${'='.repeat(80)}\n\n`;
    
    if (sessionStats.gameStats) {
        const games = ['sportsbook', 'craps', 'poker'];
        games.forEach(game => {
            const stats = sessionStats.gameStats[game];
            if (stats) {
                text += `${game.toUpperCase()}\n`;
                text += `${'-'.repeat(80)}\n`;
                text += `Total Wins: $${stats.wins.toFixed(2)}\n`;
                text += `Total Losses: $${stats.losses.toFixed(2)}\n`;
                text += `Net Profit: $${stats.totalProfit >= 0 ? '+' : ''}${stats.totalProfit.toFixed(2)}\n`;
                text += `\n`;
            }
        });
    } else {
        text += 'No game statistics recorded yet.\n';
    }
    
    return text;
}

// Download file as fallback
function downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ===== SPORTSBOOK VALUE FINDER (EV BETTING) =====

// API endpoint for Python backend (adjust to your backend URL)
const BACKEND_API_URL = 'http://localhost:8000'; // Change to your backend URL

// Scan for +EV bets
async function scanEVBets() {
    const bankroll = parseFloat(document.getElementById('ev-bankroll')?.value || 0);
    const sport = document.getElementById('ev-sport')?.value || 'basketball_nba';
    const statusEl = document.getElementById('ev-scan-status');
    const hotBetsContainer = document.getElementById('hot-bets-container');
    const hotBetsList = document.getElementById('hot-bets-list');
    
    if (bankroll <= 0) {
        alert('Please enter a valid bankroll amount.');
        return;
    }
    
    if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.textContent = 'Scanning sportsbooks for +EV bets...';
        statusEl.style.color = '#60a5fa';
    }
    
    try {
        // Call Python backend API
        const response = await fetch(`${BACKEND_API_URL}/api/scan-ev-bets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                bankroll: bankroll,
                sport: sport
            })
        });
        
        if (!response.ok) {
            throw new Error('Backend API not available. Make sure Python backend is running.');
        }
        
        const data = await response.json();
        
        if (statusEl) {
            statusEl.style.display = 'none';
        }
        
        if (data.bets && data.bets.length > 0) {
            hotBetsContainer.style.display = 'block';
            hotBetsList.innerHTML = '';
            
            data.bets.forEach((bet, index) => {
                const betCard = document.createElement('div');
                betCard.style.cssText = 'padding: 15px; margin-bottom: 10px; background: rgba(34, 197, 94, 0.1); border-radius: 8px; border-left: 4px solid #22c55e;';
                
                const evColor = bet.ev > 5 ? '#22c55e' : bet.ev > 2 ? '#fbbf24' : '#60a5fa';
                const kellyPercent = (bet.kellyFraction * 100).toFixed(2);
                
                // Ensure bet has sport field
                const betWithSport = {
                    ...bet,
                    sport: bet.sport || sport
                };
                
                // Store bet data in a data attribute for easier access
                betCard.setAttribute('data-bet-index', index);
                betCard.setAttribute('data-bet-data', JSON.stringify(betWithSport));
                
                betCard.innerHTML = `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <div style="font-weight: bold; color: #fff;">${bet.event || 'Event'}</div>
                        <div style="color: ${evColor}; font-weight: bold;">+${bet.ev.toFixed(2)}% EV</div>
                    </div>
                    <div style="font-size: 0.85em; color: #94a3b8; margin-bottom: 5px;">
                        ${bet.market || 'Market'}: ${bet.selection || 'Selection'}
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.85em;">
                        <div>
                            <span style="color: #94a3b8;">Odds:</span>
                            <span style="color: #fff; font-weight: bold;">${bet.odds}</span>
                        </div>
                        <div>
                            <span style="color: #94a3b8;">Kelly Bet:</span>
                            <span style="color: #fbbf24; font-weight: bold;">${kellyPercent}% ($${(bankroll * bet.kellyFraction).toFixed(2)})</span>
                        </div>
                    </div>
                    <div style="margin-top: 8px; font-size: 0.8em; color: #60a5fa;">
                        📍 ${bet.sportsbook || 'Sportsbook'}
                    </div>
                    <button class="btn analyze-bet-btn" style="width: 100%; margin-top: 10px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); font-size: 0.85em; padding: 8px;" 
                            data-bet-index="${index}">
                        🎯 Analyze with Handicapping
                    </button>
                `;
                
                // Add click handler for analyze button
                const analyzeBtn = betCard.querySelector('.analyze-bet-btn');
                if (analyzeBtn) {
                    analyzeBtn.addEventListener('click', () => {
                        showSmartCard(betWithSport, bankroll);
                    });
                }
                
                hotBetsList.appendChild(betCard);
            });
        } else {
            hotBetsContainer.style.display = 'block';
            hotBetsList.innerHTML = '<div style="color: #94a3b8; text-align: center; padding: 20px;">No +EV bets found at this time. Try again later.</div>';
        }
    } catch (error) {
        console.error('EV scan error:', error);
        if (statusEl) {
            statusEl.style.display = 'block';
            statusEl.textContent = `Error: ${error.message}. Make sure Python backend is running on ${BACKEND_API_URL}`;
            statusEl.style.color = '#f87171';
        }
        
        // Show mock data for demo purposes
        showMockEVBets(bankroll);
    }
}

// Show mock EV bets (for demo when backend is not available)
function showMockEVBets(bankroll) {
    const hotBetsContainer = document.getElementById('hot-bets-container');
    const hotBetsList = document.getElementById('hot-bets-list');
    
    hotBetsContainer.style.display = 'block';
    hotBetsList.innerHTML = `
        <div style="padding: 15px; margin-bottom: 10px; background: rgba(239, 68, 68, 0.1); border-radius: 8px; border-left: 4px solid #ef4444;">
            <div style="color: #f87171; font-weight: bold; margin-bottom: 5px;">⚠️ Backend Not Connected</div>
            <div style="color: #94a3b8; font-size: 0.85em;">
                Start the Python backend API to scan for real +EV bets.<br>
                Run: <code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px;">python backend_api.py</code>
            </div>
        </div>
    `;
}

// Show Smart Card with handicapping analysis (make it global)
window.showSmartCard = async function(bet, bankroll) {
    const modal = document.getElementById('smart-card-modal');
    const marketSignalText = document.getElementById('market-signal-text');
    const modelSignalText = document.getElementById('model-signal-text');
    const modelDetails = document.getElementById('model-details');
    const confidenceScore = document.getElementById('confidence-score');
    const confidenceBar = document.getElementById('confidence-bar');
    const recommendationText = document.getElementById('recommendation-text');
    const betSizeText = document.getElementById('bet-size-text');
    
    if (!modal) return;
    
    // Show modal
    modal.style.display = 'flex';
    
    // Extract team info from bet (simplified - would need better parsing in production)
    const teamAbbr = bet.team_abbr || extractTeamFromEvent(bet.event, bet.selection);
    const sport = bet.sport || document.getElementById('ev-sport')?.value || 'americanfootball_nfl';
    
    // Show market signal (Layer 1: Price Shopping)
    const fairValue = (1 / bet.odds) * 100;
    const impliedProb = (1 / bet.odds) * 100;
    const edge = bet.ev;
    
    if (marketSignalText) {
        marketSignalText.innerHTML = `
            <div style="margin-bottom: 5px;">
                <strong>Odds:</strong> ${bet.odds} (${impliedProb.toFixed(1)}% implied)
            </div>
            <div style="margin-bottom: 5px;">
                <strong>Fair Value:</strong> ~${fairValue.toFixed(1)}% (based on market)
            </div>
            <div style="color: ${edge > 0 ? '#22c55e' : '#f87171'};">
                <strong>Edge:</strong> ${edge >= 0 ? '+' : ''}${edge.toFixed(2)}% ✅
            </div>
        `;
    }
    
    // Fetch handicapping validation (Layer 2: Handicapping)
    // Only validate if it's NFL, NBA, or NHL
    const sportType = sport.includes('nfl') || sport.includes('football') ? 'nfl' : 
                     sport.includes('nba') || sport.includes('basketball') ? 'nba' :
                     sport.includes('nhl') || sport.includes('hockey') ? 'nhl' : null;
    
    if (sportType && teamAbbr) {
        try {
            const response = await fetch(`${BACKEND_API_URL}/api/validate-bet`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    team_abbr: teamAbbr,
                    opponent_abbr: bet.opponent_abbr || null,
                    sport: sportType
                })
            });
            
            if (response.ok) {
                const handicap = await response.json();
                
                // Show model signal
                if (modelSignalText) {
                    modelSignalText.textContent = handicap.model_signal || 'Model analysis unavailable';
                }
                
                if (modelDetails) {
                    let details = [];
                    if (handicap.epa_rank) details.push(`EPA Rank: #${handicap.epa_rank}`);
                    if (handicap.pass_offense) details.push(`Pass Offense: ${handicap.pass_offense}`);
                    if (handicap.recent_trend) details.push(`Recent Trend: ${handicap.recent_trend}`);
                    modelDetails.textContent = details.join(' | ') || 'Advanced stats loading...';
                }
                
                // Update confidence score
                if (confidenceScore) {
                    confidenceScore.textContent = `${handicap.confidence_score}%`;
                    confidenceScore.style.color = handicap.confidence_score >= 70 ? '#22c55e' : 
                                                 handicap.confidence_score >= 50 ? '#fbbf24' : '#f87171';
                }
                
                if (confidenceBar) {
                    confidenceBar.style.width = `${handicap.confidence_score}%`;
                }
                
                // Show recommendation
                if (recommendationText) {
                    recommendationText.textContent = handicap.recommendation || 'Analyzing...';
                }
                
                // Calculate final bet size (combining market edge + model confidence)
                const combinedConfidence = (bet.ev / 10) + (handicap.confidence_score / 2);
                const finalKellyFraction = Math.min(0.25, Math.max(0, (bet.kellyFraction + (handicap.kelly_bet || 0)) / 2));
                const finalBetAmount = bankroll * finalKellyFraction;
                
                if (betSizeText) {
                    betSizeText.innerHTML = `
                    <div style="margin-bottom: 5px;">
                        <strong>Kelly Bet:</strong> $${finalBetAmount.toFixed(2)} (${(finalKellyFraction * 100).toFixed(2)}% of bankroll)
                    </div>
                    <div style="font-size: 0.85em; color: #94a3b8;">
                        Based on ${edge.toFixed(1)}% edge + ${handicap.confidence_score}% model confidence
                    </div>
                `;
                }
            } else {
                throw new Error('Handicapping API not available');
            }
        } catch (error) {
            console.error('Handicapping error:', error);
            
            // Show fallback data
            if (modelSignalText) {
                modelSignalText.textContent = '⚠️ Handicapping model offline. Using market signal only.';
            }
            
            if (confidenceScore) {
                confidenceScore.textContent = 'N/A';
                confidenceScore.style.color = '#fbbf24';
            }
            
            if (recommendationText) {
                recommendationText.textContent = `Based on market edge only: ${edge >= 3 ? 'Strong Play' : edge >= 1 ? 'Moderate Play' : 'Weak Play'}.`;
            }
            
            if (betSizeText) {
                betSizeText.innerHTML = `
                    <div><strong>Kelly Bet:</strong> $${(bankroll * bet.kellyFraction).toFixed(2)} (${(bet.kellyFraction * 100).toFixed(2)}% of bankroll)</div>
                    <div style="font-size: 0.85em; color: #94a3b8; margin-top: 5px;">Based on market edge only (handicapping unavailable)</div>
                `;
            }
        }
    } else {
        // No handicapping available for this sport
        if (modelSignalText) {
            modelSignalText.textContent = 'Handicapping not available for this sport. Using market signal only.';
        }
        
        if (confidenceScore) {
            confidenceScore.textContent = 'N/A';
            confidenceScore.style.color = '#fbbf24';
        }
        
        if (recommendationText) {
            recommendationText.textContent = `Based on market edge only: ${edge >= 3 ? 'Strong Play' : edge >= 1 ? 'Moderate Play' : 'Weak Play'}.`;
        }
        
        if (betSizeText) {
            betSizeText.innerHTML = `
                <div><strong>Kelly Bet:</strong> $${(bankroll * bet.kellyFraction).toFixed(2)} (${(bet.kellyFraction * 100).toFixed(2)}% of bankroll)</div>
                <div style="font-size: 0.85em; color: #94a3b8; margin-top: 5px;">Based on market edge only</div>
            `;
        }
    }
};

// Extract team abbreviation from event string (simplified)
function extractTeamFromEvent(event, selection) {
    // This is a simplified parser - in production, use a proper team name mapping
    // Combined map for NFL, NBA, and NHL
    const teamMap = {
        // NFL teams (existing)
        'chiefs': 'KC', 'kansas city': 'KC',
        'bills': 'BUF', 'buffalo': 'BUF',
        'ravens': 'BAL', 'baltimore': 'BAL',
        'dolphins': 'MIA', 'miami': 'MIA',
        'patriots': 'NE', 'new england': 'NE',
        'jets': 'NYJ', 'new york jets': 'NYJ',
        'bengals': 'CIN', 'cincinnati': 'CIN',
        'browns': 'CLE', 'cleveland': 'CLE',
        'steelers': 'PIT', 'pittsburgh': 'PIT',
        'texans': 'HOU', 'houston': 'HOU',
        'colts': 'IND', 'indianapolis': 'IND',
        'jaguars': 'JAX', 'jacksonville': 'JAX',
        'titans': 'TEN', 'tennessee': 'TEN',
        'broncos': 'DEN', 'denver': 'DEN',
        'raiders': 'LV', 'las vegas': 'LV',
        'chargers': 'LAC', 'los angeles chargers': 'LAC',
        'cowboys': 'DAL', 'dallas': 'DAL',
        'eagles': 'PHI', 'philadelphia': 'PHI',
        'giants': 'NYG', 'new york giants': 'NYG',
        'commanders': 'WAS', 'washington': 'WAS',
        'packers': 'GB', 'green bay': 'GB',
        'lions': 'DET', 'detroit': 'DET',
        'vikings': 'MIN', 'minnesota': 'MIN',
        'bears': 'CHI', 'chicago': 'CHI',
        'falcons': 'ATL', 'atlanta': 'ATL',
        'panthers': 'CAR', 'carolina': 'CAR',
        'saints': 'NO', 'new orleans': 'NO',
        'buccaneers': 'TB', 'tampa bay': 'TB',
        'rams': 'LAR', 'los angeles rams': 'LAR',
        '49ers': 'SF', 'san francisco': 'SF',
        'seahawks': 'SEA', 'seattle': 'SEA',
        'cardinals': 'ARI', 'arizona': 'ARI',
        // NBA teams
        'lakers': 'LAL', 'los angeles lakers': 'LAL',
        'warriors': 'GSW', 'golden state': 'GSW',
        'celtics': 'BOS', 'boston': 'BOS',
        'heat': 'MIA', 'miami heat': 'MIA',
        'bucks': 'MIL', 'milwaukee': 'MIL',
        'nuggets': 'DEN', 'denver nuggets': 'DEN',
        'suns': 'PHX', 'phoenix': 'PHX',
        '76ers': 'PHI', 'philadelphia 76ers': 'PHI',
        'nets': 'BKN', 'brooklyn': 'BKN',
        'clippers': 'LAC', 'los angeles clippers': 'LAC',
        'mavericks': 'DAL', 'dallas': 'DAL',
        'knicks': 'NYK', 'new york knicks': 'NYK',
        'bulls': 'CHI', 'chicago bulls': 'CHI',
        'raptors': 'TOR', 'toronto': 'TOR',
        // NHL teams
        'maple leafs': 'TOR', 'toronto maple leafs': 'TOR',
        'bruins': 'BOS', 'boston bruins': 'BOS',
        'lightning': 'TB', 'tampa bay': 'TB',
        'avalanche': 'COL', 'colorado': 'COL',
        'oilers': 'EDM', 'edmonton': 'EDM',
        'rangers': 'NYR', 'new york rangers': 'NYR',
        'canadiens': 'MTL', 'montreal': 'MTL',
        'red wings': 'DET', 'detroit': 'DET',
        'blackhawks': 'CHI', 'chicago blackhawks': 'CHI',
        'capitals': 'WSH', 'washington capitals': 'WSH',
        'penguins': 'PIT', 'pittsburgh': 'PIT',
        'stars': 'DAL', 'dallas stars': 'DAL',
        'golden knights': 'VGK', 'vegas': 'VGK'
    };
    
    const searchText = (event + ' ' + selection).toLowerCase();
    for (const [key, value] of Object.entries(teamMap)) {
        if (searchText.includes(key)) {
            return value;
        }
    }
    
    return null; // Return null if not found (let backend handle it)
}

// Close Smart Card modal
function initSmartCardModal() {
    const closeBtn = document.getElementById('close-smart-card');
    const modal = document.getElementById('smart-card-modal');
    
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}

// Initialize EV betting scanner
function initEVBetting() {
    const scanBtn = document.getElementById('scan-ev-bets-btn');
    if (scanBtn) {
        scanBtn.addEventListener('click', scanEVBets);
    }
    
    // Initialize Smart Card modal
    initSmartCardModal();
}

// ===== POKER EQUITY CALCULATOR =====

// Calculate poker equity (using node-poker-odds-calculator logic)
async function calculatePokerEquity() {
    const holeCard1 = document.getElementById('hole-card-1')?.textContent.trim();
    const holeCard2 = document.getElementById('hole-card-2')?.textContent.trim();
    const boardCards = Array.from(document.querySelectorAll('.board-card')).map(card => card.textContent.trim()).filter(c => c && !c.includes('Flop') && !c.includes('Turn') && !c.includes('River'));
    
    if (!holeCard1 || !holeCard2 || holeCard1.includes('Card') || holeCard2.includes('Card')) {
        alert('Please select your hole cards first.');
        return;
    }
    
    const equityEl = document.getElementById('equity-calculator');
    const equityResult = document.getElementById('equity-result');
    
    if (equityEl) equityEl.style.display = 'block';
    
    try {
        // Call Python backend for equity calculation (or use client-side if available)
        const response = await fetch(`${BACKEND_API_URL}/api/calculate-equity`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                holeCards: [holeCard1, holeCard2],
                boardCards: boardCards,
                opponentRange: 'random' // Default to random, can be enhanced
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (equityResult) {
                equityResult.innerHTML = `
                    <div style="margin-bottom: 8px;">
                        <span style="color: #94a3b8;">Your Hand:</span>
                        <span style="color: #fff; font-weight: bold;">${holeCard1} ${holeCard2}</span>
                    </div>
                    <div style="margin-bottom: 8px;">
                        <span style="color: #94a3b8;">Board:</span>
                        <span style="color: #fff;">${boardCards.length > 0 ? boardCards.join(' ') : 'Pre-flop'}</span>
                    </div>
                    <div style="padding: 10px; background: rgba(34, 197, 94, 0.1); border-radius: 6px; margin-top: 10px;">
                        <div style="color: #22c55e; font-weight: bold; font-size: 1.2em;">
                            Win Probability: ${(data.equity * 100).toFixed(2)}%
                        </div>
                        <div style="color: #94a3b8; font-size: 0.8em; margin-top: 5px;">
                            vs Random Hand (${data.iterations || 10000} simulations)
                        </div>
                    </div>
                `;
            }
        } else {
            throw new Error('Backend not available');
        }
    } catch (error) {
        // Fallback to simple estimation
        if (equityResult) {
            equityResult.innerHTML = `
                <div style="color: #f87171; margin-bottom: 8px;">⚠️ Backend not connected. Using estimation.</div>
                <div style="color: #94a3b8; font-size: 0.85em;">
                    Start Python backend for accurate equity calculations.<br>
                    Estimated equity: ~${Math.random() * 30 + 35}% (pre-flop estimate)
                </div>
            `;
        }
    }
}

// Initialize poker equity calculator
function initPokerEquity() {
    const calcEquityBtn = document.getElementById('calculate-equity-btn');
    if (calcEquityBtn) {
        calcEquityBtn.addEventListener('click', calculatePokerEquity);
    }
}

// ===== BLACKJACK SIMULATOR INTEGRATION =====

// Analyze current hand with simulator
function analyzeHandWithSimulator() {
    if (playerHand.length === 0 || dealerHand.length === 0) {
        const simulatorStats = document.getElementById('simulator-stats');
        if (simulatorStats) simulatorStats.style.display = 'none';
        return;
    }
    
    const simulatorStats = document.getElementById('simulator-stats');
    const simulatorEV = document.getElementById('simulator-ev');
    const simulatorError = document.getElementById('simulator-error');
    
    if (!simulatorStats) return;
    
    try {
        // Calculate true count
        const cardsRemaining = Math.max(1, (52 * numberOfDecks) - cardHistory.length);
        const decksRemaining = cardsRemaining / 52;
        const trueCount = decksRemaining > 0 ? runningCount / decksRemaining : runningCount;
        
        // Call Python backend for simulator analysis
        fetch(`${BACKEND_API_URL}/api/simulate-hand`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                playerHand: playerHand.map(card => {
                    const suitMap = {'♠': 's', '♥': 'h', '♦': 'd', '♣': 'c'};
                    return `${card.value}${suitMap[card.suit] || card.suit}`;
                }),
                dealerHand: dealerHand.map(card => {
                    const suitMap = {'♠': 's', '♥': 'h', '♦': 'd', '♣': 'c'};
                    return `${card.value}${suitMap[card.suit] || card.suit}`;
                }),
                runningCount: runningCount,
                trueCount: trueCount
            })
        })
        .then(response => {
            if (!response.ok) throw new Error('Backend not available');
            return response.json();
        })
        .then(data => {
            simulatorStats.style.display = 'block';
            if (simulatorEV) {
                simulatorEV.textContent = `Expected Value: ${data.ev >= 0 ? '+' : ''}${data.ev.toFixed(2)}%`;
                simulatorEV.style.color = data.ev >= 0 ? '#22c55e' : '#f87171';
            }
            if (simulatorError && data.error !== undefined) {
                if (data.error !== 0) {
                    simulatorError.textContent = `Strategy Error: ${data.error > 0 ? '+' : ''}${data.error.toFixed(2)}% EV loss`;
                    simulatorError.style.color = data.error > 0 ? '#f87171' : '#22c55e';
                } else {
                    simulatorError.textContent = '✓ Optimal play';
                    simulatorError.style.color = '#22c55e';
                }
            }
        })
        .catch(error => {
            // Simulator not available, show estimated values
            simulatorStats.style.display = 'block';
            const estimatedEV = (trueCount * 0.5) - 0.5; // Simplified: ~0.5% per true count
            if (simulatorEV) {
                simulatorEV.textContent = `Estimated EV: ${estimatedEV >= 0 ? '+' : ''}${estimatedEV.toFixed(2)}% (Backend offline)`;
                simulatorEV.style.color = estimatedEV >= 0 ? '#22c55e' : '#f87171';
            }
            if (simulatorError) {
                simulatorError.textContent = '⚠️ Start Python backend for accurate analysis';
                simulatorError.style.color = '#fbbf24';
            }
        });
    } catch (error) {
        simulatorStats.style.display = 'none';
    }
}

// Initialize Sportsbook Money Flow Handlers
function initSportsbookMoneyFlow() {
    const sportsMoneyInBtn = document.getElementById('sports-money-in-btn');
    const sportsMoneyOutBtn = document.getElementById('sports-money-out-btn');
    
    if (sportsMoneyInBtn) {
        sportsMoneyInBtn.addEventListener('click', () => {
            if (!currentSession.active) {
                alert('Please start a session first (Health tab → Session Mode)');
                return;
            }
            
            const amount = parseFloat(document.getElementById('sports-money-amount')?.value || 0);
            const note = document.getElementById('sports-money-note')?.value || '';
            
            if (amount > 0) {
                // Money IN = funneling INTO gambling site = negative profit
                currentSession.moneyIn += amount;
                currentSession.flowHistory.push({
                    type: 'in',
                    amount: amount,
                    note: note || 'Money In',
                    time: new Date()
                });
                
                // Update session stats
                sessionStats.sportsPlayed += amount;
                
                // Clear inputs
                document.getElementById('sports-money-amount').value = '';
                document.getElementById('sports-money-note').value = '';
                
                updateSportsbookMoneyFlow();
                if (currentUser) saveUserProfile();
            }
        });
    }
    
    if (sportsMoneyOutBtn) {
        sportsMoneyOutBtn.addEventListener('click', () => {
            if (!currentSession.active) {
                alert('Please start a session first (Health tab → Session Mode)');
                return;
            }
            
            const amount = parseFloat(document.getElementById('sports-money-amount')?.value || 0);
            const note = document.getElementById('sports-money-note')?.value || '';
            
            if (amount > 0) {
                // Money OUT = funneling OUT of gambling site = positive profit
                currentSession.moneyOut += amount;
                currentSession.flowHistory.push({
                    type: 'out',
                    amount: amount,
                    note: note || 'Money Out',
                    time: new Date()
                });
                
                // Update session stats
                sessionStats.withdrawn = (sessionStats.withdrawn || 0) + amount;
                
                // Clear inputs
                document.getElementById('sports-money-amount').value = '';
                document.getElementById('sports-money-note').value = '';
                
                updateSportsbookMoneyFlow();
                updateHealthDashboard();
                if (currentUser) saveUserProfile();
            }
        });
    }
}

// Step 4: Cash Out Handler
function initCashOutHandler() {
    const cashOutBtn = document.getElementById('cash-out-btn');
    const cashOutModal = document.getElementById('cashout-modal');
    const cashOutConfirmBtn = document.getElementById('cashout-confirm-btn');
    const cashOutCancelBtn = document.getElementById('cashout-cancel-btn');
    
    // Export Data Button Handler (old - now opens sidebar)
    const exportDataBtn = document.getElementById('export-data-btn');
    if (exportDataBtn && !exportDataBtn.hasAttribute('data-listener-added')) {
        exportDataBtn.setAttribute('data-listener-added', 'true');
        exportDataBtn.addEventListener('click', () => {
            // Open export sidebar instead
            if (exportSidebarEl) {
                exportSidebarEl.style.display = 'flex';
                exportSidebarEl.classList.add('active');
            }
        });
    }
    
    if (cashOutBtn && cashOutModal) {
        cashOutBtn.addEventListener('click', () => {
            const totalBankroll = (sessionStats.deposit || 0) + (sessionStats.casinoPlayed || 0) - (sessionStats.withdrawn || 0);
            const finalBalanceEl = document.getElementById('cashout-final-balance');
            if (finalBalanceEl) finalBalanceEl.textContent = `$${totalBankroll.toFixed(2)}`;
            cashOutModal.style.display = 'flex';
        });
    }
    
    if (cashOutCancelBtn && cashOutModal) {
        cashOutCancelBtn.addEventListener('click', () => {
            cashOutModal.style.display = 'none';
        });
    }
    
    if (cashOutConfirmBtn && cashOutModal) {
        cashOutConfirmBtn.addEventListener('click', () => {
            // Save state to localStorage
            if (currentUser) {
                saveUserProfile();
            }
            localStorage.setItem('bj_session_stats', JSON.stringify(sessionStats));
            cashOutModal.style.display = 'none';
            alert('State saved! Your balance is saved for tomorrow.');
        });
    }
}

// ===== LIVE MIRROR MODE SYSTEM =====

// Initialize Live Mode Toggle
function initLiveModeToggle() {
    const liveModeToggle = document.getElementById('live-mode-toggle');
    const modeStatus = document.getElementById('mode-status');
    const liveModeInfo = document.getElementById('live-mode-info');
    const resultLogging = document.getElementById('result-logging');
    const theCoach = document.getElementById('the-coach');
    const liveSyncModal = document.getElementById('live-sync-modal');
    
    if (liveModeToggle) {
        liveModeToggle.addEventListener('change', (e) => {
            liveMode = e.target.checked;
            
            if (liveMode) {
                // Switching to LIVE MIRROR mode
                modeStatus.textContent = '🔴 LIVE MIRROR';
                modeStatus.style.color = '#ef4444';
                if (liveModeInfo) {
                    liveModeInfo.innerHTML = '<strong style="color: #ef4444;">LIVE MODE:</strong> All actions update your real database. Make sure to sync your balance first.';
                    liveModeInfo.style.background = 'rgba(239, 68, 68, 0.1)';
                    liveModeInfo.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                }
                // Update slider text
                const sliderText = document.querySelector('.live-switch .slider-text');
                if (sliderText) sliderText.textContent = 'LIVE';
                // Show sync modal
                if (liveSyncModal) liveSyncModal.style.display = 'flex';
            } else {
                // Switching to SIMULATOR mode
                modeStatus.textContent = '⚪ SIMULATOR';
                modeStatus.style.color = '#60a5fa';
                if (liveModeInfo) {
                    liveModeInfo.textContent = 'Practice mode: Money is fake. Stats do not save to your real bankroll.';
                    liveModeInfo.style.background = 'rgba(59, 130, 246, 0.1)';
                    liveModeInfo.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                }
                // Update slider text
                const sliderText = document.querySelector('.live-switch .slider-text');
                if (sliderText) sliderText.textContent = 'SIM';
                if (resultLogging) resultLogging.style.display = 'none';
            }
            
            // Update coach when mode changes
            updateCoach();
            updateHealthDashboard();
        });
    }
    
    // Sync Modal Handlers
    const syncConfirmBtn = document.getElementById('sync-confirm-btn');
    const syncCancelBtn = document.getElementById('sync-cancel-btn');
    
    if (syncConfirmBtn) {
        syncConfirmBtn.addEventListener('click', () => {
            const syncBalance = parseFloat(document.getElementById('sync-balance')?.value || 0);
            if (syncBalance > 0) {
                liveMirrorBalance = syncBalance;
                balance = syncBalance; // Sync the game balance
                
                // Update sessionStats.deposit to match synced balance
                // This ensures health dashboard and coach show the correct balance
                // Calculate what deposit should be to match the balance
                const currentTotalBankroll = (sessionStats.deposit || 0) + (sessionStats.casinoPlayed || 0) - (sessionStats.withdrawn || 0);
                const balanceDifference = syncBalance - currentTotalBankroll;
                
                // If balance is higher, add to deposit; if lower, adjust accordingly
                if (balanceDifference > 0) {
                    // Balance is higher - add difference to deposit
                    sessionStats.deposit = (sessionStats.deposit || 0) + balanceDifference;
                } else if (balanceDifference < 0) {
                    // Balance is lower - could be due to withdrawals or losses
                    // Adjust deposit to match (but don't go negative)
                    sessionStats.deposit = Math.max(0, (sessionStats.deposit || 0) + balanceDifference);
                }
                
                liveMirrorStats.sessionStartTime = new Date();
                liveMirrorStats.handHistory = [];
                
                if (liveSyncModal) liveSyncModal.style.display = 'none';
                if (resultLogging) resultLogging.style.display = 'block';
                
                // Update all displays - updateHealthDashboard() calls updateCoach() internally
                updateHealthDashboard(); // Updates health tab total bankroll AND coach
                updateUI(); // Updates blackjack balance display
                showMessage('LIVE MIRROR mode activated. Balance synced.', 'win');
            }
        });
    }
    
    if (syncCancelBtn && liveSyncModal) {
        syncCancelBtn.addEventListener('click', () => {
            liveModeToggle.checked = false;
            liveMode = false;
            modeStatus.textContent = '⚪ SIMULATOR';
            modeStatus.style.color = '#60a5fa';
            liveSyncModal.style.display = 'none';
        });
    }
}

// Result Logging Handlers
function initResultLogging() {
    const logWinBtn = document.getElementById('log-win-btn');
    const logLossBtn = document.getElementById('log-loss-btn');
    const logPushBtn = document.getElementById('log-push-btn');
    
    if (logWinBtn) {
        logWinBtn.addEventListener('click', () => {
            logHandResult('win');
        });
    }
    
    if (logLossBtn) {
        logLossBtn.addEventListener('click', () => {
            logHandResult('loss');
        });
    }
    
    if (logPushBtn) {
        logPushBtn.addEventListener('click', () => {
            logHandResult('push');
        });
    }
}

// Log hand result in LIVE MIRROR mode
function logHandResult(result) {
    if (!liveMode) return;
    
    const betAmount = currentBet || parseFloat(document.getElementById('bet-amount')?.value || MIN_BET);
    const profit = result === 'win' ? betAmount : (result === 'loss' ? -betAmount : 0);
    
    // Update live mirror stats
    liveMirrorStats.handsPlayed++;
    liveMirrorStats.totalWagered += betAmount;
    liveMirrorStats.totalProfit += profit;
    liveMirrorStats.lastHandTime = new Date();
    
    if (result === 'win') {
        liveMirrorStats.handsWon++;
    } else if (result === 'loss') {
        liveMirrorStats.handsLost++;
    } else {
        liveMirrorStats.handsPushed++;
    }
    
    // Add to hand history (keep last 50)
    liveMirrorStats.handHistory.push({
        result: result,
        bet: betAmount,
        profit: profit,
        time: new Date(),
        strategy: 'perfect' // Assume perfect if using app guidance
    });
    if (liveMirrorStats.handHistory.length > 50) {
        liveMirrorStats.handHistory.shift();
    }
    
    // Update balance
    liveMirrorBalance += profit;
    balance = liveMirrorBalance;
    
    // Update real database (sessionStats)
    if (result === 'win') {
        sessionStats.casinoPlayed += betAmount;
    } else if (result === 'loss') {
        sessionStats.casinoPlayed += betAmount;
    } else {
        sessionStats.casinoPlayed += betAmount;
    }
    
    // Update UI
    updateUI();
    updateCoach();
    
    // Analyze hand with simulator
    analyzeHandWithSimulator();
    
    // Show confirmation
    const resultText = result === 'win' ? 'Won' : (result === 'loss' ? 'Lost' : 'Pushed');
    showMessage(`Hand logged: ${resultText} $${Math.abs(profit).toFixed(2)}`, result === 'win' ? 'win' : (result === 'loss' ? 'lose' : 'tie'));
}

// The Coach - Real-time Financial Advisor
function updateCoach() {
    const coachEl = document.getElementById('the-coach');
    const coachStatus = document.getElementById('coach-status');
    const coachRecommendation = document.getElementById('coach-recommendation');
    const coachRecommendationText = document.getElementById('coach-recommendation-text');
    const coachReason = document.getElementById('coach-reason-text');
    
    if (!coachEl || !coachStatus || !coachRecommendationText || !coachReason) return;
    
    // Show coach overlay (replaces guide overlay)
    coachEl.style.display = 'flex';
    
    // STEP 1: If not in live mirror mode, recommend switching
    if (!liveMode) {
        // Use total bankroll calculation for consistency
        const totalBankroll = (sessionStats.deposit || 0) + (sessionStats.casinoPlayed || 0) - (sessionStats.withdrawn || 0);
        const displayBalance = totalBankroll || balance || 0;
        let statusHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #94a3b8;">Mode:</span>
                <span style="color: #60a5fa; font-weight: bold;">⚪ SIMULATOR</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #94a3b8;">Balance:</span>
                <span style="color: #60a5fa; font-weight: bold;">$${displayBalance.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span style="color: #94a3b8;">Status:</span>
                <span style="color: #fbbf24; font-weight: bold;">Practice Mode</span>
            </div>
        `;
        coachStatus.innerHTML = statusHTML;
        
        coachRecommendationText.innerHTML = '<strong>🔴 Step 1: Switch to Live Mirror Mode</strong>';
        coachRecommendation.style.borderLeftColor = '#ef4444';
        coachRecommendation.style.background = 'rgba(239, 68, 68, 0.1)';
        coachReason.textContent = 'Enable Live Mirror Mode to track real money. Toggle the switch in the Blackjack tab to get started.';
        return;
    }
    
    // STEP 2: If in live mirror mode but no deposit, recommend adding funds
    const deposit = sessionStats.deposit || 0;
    if (deposit <= 0) {
        // Use total bankroll calculation for consistency
        const totalBankroll = (sessionStats.deposit || 0) + (sessionStats.casinoPlayed || 0) - (sessionStats.withdrawn || 0);
        const currentBalance = totalBankroll || liveMirrorBalance || balance || 0;
        
        let statusHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #94a3b8;">Mode:</span>
                <span style="color: #ef4444; font-weight: bold;">🔴 LIVE MIRROR</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #94a3b8;">Balance:</span>
                <span style="color: #60a5fa; font-weight: bold;">$${currentBalance.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span style="color: #94a3b8;">Deposit:</span>
                <span style="color: #f87171; font-weight: bold;">$0.00</span>
            </div>
        `;
        coachStatus.innerHTML = statusHTML;
        
        coachRecommendationText.innerHTML = '<strong>💰 Step 2: Add Funds in Health Tab</strong>';
        coachRecommendation.style.borderLeftColor = '#22c55e';
        coachRecommendation.style.background = 'rgba(34, 197, 94, 0.1)';
        coachReason.textContent = 'Go to Health tab → Check-In section → Click "Add Funds" to deposit money. Credit Card deposits give better odds (clean money).';
        return;
    }
    
    // STEP 3+: Active session - show live stats and recommendations
    
    const stats = liveMirrorStats;
    const handsPlayed = stats.handsPlayed;
    const winRate = handsPlayed > 0 ? (stats.handsWon / handsPlayed) * 100 : 0;
    const turnover = sessionStats.deposit > 0 ? (stats.totalWagered / sessionStats.deposit) : 0;
    const profit = stats.totalProfit;
    const sessionDuration = stats.sessionStartTime ? (new Date() - stats.sessionStartTime) / 1000 / 60 : 0; // minutes
    
    // Calculate EV (Expected Value)
    // Perfect basic strategy has ~0.5% house edge
    const expectedLoss = stats.totalWagered * 0.005;
    const actualEV = profit - (-expectedLoss); // Positive if doing better than expected
    
    // Pattern Detection: Bot-like behavior
    const perfectStrategyRatio = handsPlayed > 0 ? (stats.perfectStrategyCount / handsPlayed) : 0;
    const isBotLike = perfectStrategyRatio > 0.95 && handsPlayed > 20;
    
    // Get consistent balance - use total bankroll calculation to match health dashboard
    const totalBankroll = (sessionStats.deposit || 0) + (sessionStats.casinoPlayed || 0) - (sessionStats.withdrawn || 0);
    const currentBalance = totalBankroll || liveMirrorBalance || balance || 0;
    
    // Update Status with consistent balance
    let statusHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #94a3b8;">Balance:</span>
            <span style="color: #60a5fa; font-weight: bold;">$${currentBalance.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #94a3b8;">Hands Played:</span>
            <span style="color: #60a5fa; font-weight: bold;">${handsPlayed}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #94a3b8;">Total Wagered:</span>
            <span style="color: #60a5fa; font-weight: bold;">$${stats.totalWagered.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Session Profit:</span>
            <span style="color: ${profit >= 0 ? '#22c55e' : '#f87171'}; font-weight: bold;">$${profit >= 0 ? '+' : ''}${profit.toFixed(2)}</span>
        </div>
    `;
    coachStatus.innerHTML = statusHTML;
    
    // Generate Recommendations
    let recommendation = '';
    let reason = '';
    let recommendationColor = '#fbbf24';
    let recommendationIcon = '💡';
    
    // Scenario 1: Bot-like Pattern Detection
    if (isBotLike && handsPlayed > 20) {
        recommendation = '⚠️ Pattern Alert: You look like a bot.';
        reason = 'Your betting patterns are too consistent. Switch to Slots for 5 minutes to add variance. Sacrifice $5 in expected loss to protect your account from being flagged.';
        recommendationColor = '#f87171';
        recommendationIcon = '🚨';
    }
    // Scenario 2: Bonus Cleared
    else if (turnover >= 1.0 && sessionStats.deposit > 0) {
        recommendation = '✅ Target Reached!';
        reason = `You have washed the money (${turnover.toFixed(1)}x turnover). Any further play is negative EV. Cash out or wait for a new promo.`;
        recommendationColor = '#22c55e';
        recommendationIcon = '✅';
    }
    // Scenario 3: Stop Loss Protection
    else if (profit <= -200) {
        recommendation = '🛑 Session Limit Hit.';
        reason = 'You are down $' + Math.abs(profit).toFixed(2) + '. Chasing losses often leads to tilting and bad strategy errors. Log out and return tomorrow.';
        recommendationColor = '#f87171';
        recommendationIcon = '🛑';
    }
    // Scenario 4: Positive EV but low volume
    else if (actualEV > 0 && handsPlayed < 10) {
        recommendation = '📈 Good Start!';
        reason = `You're running ${actualEV > 0 ? 'above' : 'below'} expectation. Continue playing with perfect strategy.`;
        recommendationColor = '#22c55e';
        recommendationIcon = '📈';
    }
    // Scenario 5: High win rate (suspicious)
    else if (winRate > 60 && handsPlayed > 15) {
        recommendation = '⚠️ High Win Rate Detected.';
        reason = `Your win rate is ${winRate.toFixed(1)}%. This may look suspicious. Consider mixing in some variance (different bet sizes, occasional suboptimal plays).`;
        recommendationColor = '#fbbf24';
        recommendationIcon = '⚠️';
    }
    // Default: Continue playing
    else {
        recommendation = 'Continue Playing';
        reason = `You're at ${turnover.toFixed(2)}x turnover. Keep playing with perfect strategy. Target: 1.0x to clear bonus.`;
        recommendationColor = '#60a5fa';
        recommendationIcon = '🎯';
    }
    
    coachRecommendationText.innerHTML = `<strong>${recommendationIcon} ${recommendation}</strong>`;
    coachRecommendation.style.borderLeftColor = recommendationColor;
    coachRecommendation.style.background = recommendationColor.replace(')', ', 0.1)').replace('rgb', 'rgba');
    coachReason.textContent = reason;
}

// Note: endGame function will be modified to check liveMode
// For LIVE MIRROR mode, results must be manually logged via buttons

// Consolidated initialization on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize tabs first
    initTabs();
    
    // Initialize donation sidebar
    initDonationSidebar();
    
    // Auto-login Tyler
    currentUser = loadUserProfile("Tyler");
    updateUIForLogin();
    
    // Initialize new health dashboard workflow
    updateHealthDashboard();
    initCheckInHandlers();
    initSessionHandlers();
    initCashOutHandler();
    
    // Initialize Live Mirror Mode
    initLiveModeToggle();
    initResultLogging();
    
    // Show coach on initial load
    updateCoach();
    
    // Initialize Sportsbook Money Flow
    initSportsbookMoneyFlow();
    
    // Initialize Global Game Win/Loss Tracking
    initGameWinLossTracking();
    
    // Initialize new integrations
    initEVBetting();
    initPokerEquity();
    initSmartCardModal(); // Also initialize separately in case initEVBetting hasn't run yet
    
    // Initialize other systems - use setTimeout to ensure DOM is fully ready
    setTimeout(() => {
        initCraps();
        initPoker();
        initWalletSystem();
    }, 50);
});

