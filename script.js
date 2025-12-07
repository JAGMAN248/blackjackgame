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

// Tab Switching Logic - Initialize on DOM ready
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    if (tabBtns.length === 0 || tabPanes.length === 0) {
        console.warn('Tab buttons or panes not found');
        return;
    }
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons and panes
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Show corresponding pane
            const tabId = btn.getAttribute('data-tab');
            if (tabId) {
                const targetPane = document.getElementById(tabId);
                if (targetPane) {
                    targetPane.classList.add('active');
                } else {
                    console.warn('Tab pane not found:', tabId);
                }
            }
            
            // Specific logic for tabs
            if (tabId === 'tab-wash') {
                // Resizing might be needed
            }
        });
    });
}

// Initialize tabs on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
});

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

function updateHealth() {
    if (!healthStatus) return;
    
    const deposited = parseFloat(healthDeposit.value) || 0;
    const casino = parseFloat(healthCasino.value) || 0;
    const sports = parseFloat(healthSports.value) || 0;
    const withdrawn = parseFloat(healthWithdraw.value) || 0;
    
    if (deposited === 0) return;

    const ratioWithdraw = (withdrawn / (sports || 1)) * 100;
    const turnover = casino / deposited;
    
    let statusHTML = "";
    
    // Alert 1: Sportsbook Withdrawal Ratio
    if (withdrawn > sports * 0.5 && sports > 0) {
        statusHTML += `<div style="color: #f87171; margin-bottom: 10px;"><strong>🚨 RED ALERT:</strong> Withdrawal > 50% of Sports Play. Risk of limits!</div>`;
    } else {
        statusHTML += `<div style="color: #4ade80; margin-bottom: 10px;"><strong>✅ Sports Health:</strong> Good ratio.</div>`;
    }

    // Alert 2: Casino Turnover
    if (turnover > 5) {
        statusHTML += `<div style="color: #4ade80;"><strong>✅ Green Light:</strong> Casino Turnover is ${turnover.toFixed(1)}x (Target > 5x). Safe to withdraw using Method B.</div>`;
    } else {
        statusHTML += `<div style="color: #fbbf24;"><strong>⚠️ Low Turnover:</strong> Only ${turnover.toFixed(1)}x. Grind more IGT BJ before withdrawing.</div>`;
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
function initGame() {
    createDeck();
    shuffleDeck();
    playerHand = [];
    playerHand2 = [];
    isSplit = false;
    currentHand = 1;
    dealerHand = [];
    currentBet = 0;
    bet2 = 0;
    insuranceBet = 0; // Reset insurance bet
    gameInProgress = false;
    playerHasHit = false;
    playerHasHit2 = false;
    dealerPlaying = false; // CRITICAL: Reset dealerPlaying flag
    balance = 10000; // Reset balance to $10000
    currentManualTarget = null; // Reset manual entry target
    // Reset running count on new game (user can manually track in manual entry mode)
    runningCount = 0;
    cardHistory = []; // Clear card history on new game
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
    // Check if we've reached penetration limit
    const cardsDealt = 52 * numberOfDecks - deck.length;
    if (cardsDealt >= maxCardsInShoe || deck.length === 0) {
        createDeck();
        shuffleDeck();
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
    
    placeBetBtn.disabled = gameInProgress || balance <= 0;
    useRecommendedBtn.disabled = gameInProgress || balance <= 0;
    // Disable hit button in manual entry mode (cards are added manually)
    hitBtn.disabled = !gameInProgress || manualEntryEnabled;
    // Double is only available on first two cards and if player has enough balance
    // Also disable in manual entry mode
    doubleBtn.disabled = !gameInProgress || activeHasHit || activeHand.length !== 2 || balance < activeBet || manualEntryEnabled;
    // Split is only available on pairs, first two cards, before hitting, and if not already split
    splitBtn.disabled = !gameInProgress || !canSplit();
    // Insurance is only available when dealer shows Ace, before any player actions, on first hand only
    const maxInsurance = Math.floor(currentBet / 2);
    insuranceBtn.disabled = !gameInProgress || !isDealerAce() || isSplit || playerHasHit || insuranceBet > 0 || balance < maxInsurance || playerHand.length !== 2;
    // Surrender is only available on first two cards, before hitting or doubling, first hand only
    surrenderBtn.disabled = !gameInProgress || isSplit || playerHasHit || playerHand.length !== 2;
    standBtn.disabled = !gameInProgress;
    // New Game button always resets the entire game session
    newGameBtn.disabled = false; // Always enabled since it resets everything
    newGameBtn.textContent = 'New Game';
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
    messageEl.className = 'message';
}

// Show message
function showMessage(text, type = '') {
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
}

// Use recommended bet and place it
function useRecommendedBet() {
    if (gameInProgress || balance <= 0) return;
    
    const betRec = getRecommendedBet();
    betAmountEl.value = betRec.amount;
    placeBet();
}

// Place bet
function placeBet() {
    const betAmount = parseInt(betAmountEl.value);
    
    if (betAmount < MIN_BET) {
        showMessage(`Bet must be at least $${MIN_BET}`, 'lose');
        return;
    }
    
    if (betAmount > balance) {
        showMessage('Insufficient balance!', 'lose');
        return;
    }

    currentBet = betAmount;
    bet2 = 0;
    insuranceBet = 0; // Reset insurance bet for new hand
    balance -= currentBet;
    gameInProgress = true;
    isSplit = false;
    currentHand = 1;
    playerHand2 = [];
    playerHasHit = false;
    playerHasHit2 = false;
    dealerPlaying = false; // CRITICAL: Reset dealerPlaying flag for new game
    
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
    
    // Deal initial cards with delay for animation
    playerHand = [dealCard()];
    dealerHand = [dealCard()];
    updateUI();
    
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
                // Determine results for all hands
                setTimeout(() => {
                    endGame();
                }, 300);
            }
        };
        
        dealerPlay();
    }, 400);
}

// Check if hand is blackjack (21 with exactly 2 cards)
function isBlackjack(hand) {
    return calculateHandValue(hand) === 21 && hand.length === 2;
}

// End game and update balance
function endGame(result, message) {
    gameInProgress = false;
    dealerPlaying = false; // CRITICAL: Reset dealerPlaying flag when game ends
    
    // If insurance was taken and dealer doesn't have blackjack, lose insurance bet
    if (insuranceBet > 0 && !isBlackjack(dealerHand)) {
        // Insurance bet is lost (already deducted from balance)
    }
    
    const dealerBlackjack = isBlackjack(dealerHand);
    const finalDealerValue = calculateHandValue(dealerHand);
    
    // Process each hand
    let totalWin = 0;
    let totalLoss = 0;
    let totalWagered = currentBet;
    if (isSplit) totalWagered += bet2;
    
    // Hand 1
    const playerValue1 = calculateHandValue(playerHand);
    const playerBlackjack1 = isBlackjack(playerHand);
    
    if (playerValue1 <= 21) {
        if (playerBlackjack1 && dealerBlackjack) {
            balance += currentBet; // Push
        } else if (playerBlackjack1 && !dealerBlackjack) {
            const winAmount = Math.floor(currentBet * 1.5);
            balance += currentBet + winAmount;
            totalWin += winAmount;
        } else if (dealerBlackjack && !playerBlackjack1) {
            totalLoss += currentBet;
        } else if (finalDealerValue > 21) {
            balance += currentBet * 2;
            totalWin += currentBet;
        } else if (playerValue1 > finalDealerValue) {
            balance += currentBet * 2;
            totalWin += currentBet;
        } else if (playerValue1 < finalDealerValue) {
            totalLoss += currentBet;
        } else {
            balance += currentBet; // Push
        }
    } else {
        totalLoss += currentBet; // Bust
    }
    
    // Hand 2 (if split)
    if (isSplit) {
        const playerValue2 = calculateHandValue(playerHand2);
        const playerBlackjack2 = isBlackjack(playerHand2);
        
        if (playerValue2 <= 21) {
            if (playerBlackjack2 && dealerBlackjack) {
                balance += bet2; // Push
            } else if (playerBlackjack2 && !dealerBlackjack) {
                const winAmount = Math.floor(bet2 * 1.5);
                balance += bet2 + winAmount;
                totalWin += winAmount;
            } else if (dealerBlackjack && !playerBlackjack2) {
                totalLoss += bet2;
            } else if (finalDealerValue > 21) {
                balance += bet2 * 2;
                totalWin += bet2;
            } else if (playerValue2 > finalDealerValue) {
                balance += bet2 * 2;
                totalWin += bet2;
            } else if (playerValue2 < finalDealerValue) {
                totalLoss += bet2;
            } else {
                balance += bet2; // Push
            }
        } else {
            totalLoss += bet2; // Bust
        }
    }
    
    // Update Stats (Session & Lifetime)
    sessionStats.casinoPlayed += totalWagered;
    if (currentUser) {
        currentUser.casinoPlayed += totalWagered;
        saveUserProfile(); // Saves to localStorage and updates UI/Guide
    }
    // Trigger UI update for dashboards
    updateUIForLogin(); 
    
    // Show summary message
    if (totalWin > totalLoss) {
        const netWin = totalWin - totalLoss;
        showMessage(`You Won $${netWin.toLocaleString()} total!`, 'win');
    } else if (totalLoss > totalWin) {
        const netLoss = totalLoss - totalWin;
        showMessage(`You Lost $${netLoss.toLocaleString()} total`, 'lose');
    } else {
        showMessage("It's a push!", 'tie');
    }
    
    // Reset insurance bet and split state
    insuranceBet = 0;
    isSplit = false;
    currentHand = 1;
    playerHand2 = [];
    bet2 = 0;
    playerHasHit2 = false;
    
    updateUI();
    
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
placeBetBtn.addEventListener('click', placeBet);
hitBtn.addEventListener('click', hit);
doubleBtn.addEventListener('click', doubleDown);
splitBtn.addEventListener('click', split);
insuranceBtn.addEventListener('click', takeInsurance);
surrenderBtn.addEventListener('click', surrender);
standBtn.addEventListener('click', stand);
newGameBtn.addEventListener('click', () => {
    // End Game button always resets the entire game session
    initGame();
});

// Deck count selector - update when changed (only when no game in progress)
deckCountEl.addEventListener('change', (e) => {
    if (!gameInProgress) {
        numberOfDecks = parseInt(e.target.value);
        // Create new deck with new count
        createDeck();
        shuffleDeck();
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

// Donation panel toggle
if (coffeeBtnEl && donationSidebarEl) {
    donationSidebarEl.style.display = 'none';
    coffeeBtnEl.addEventListener('click', (e) => {
        e.preventDefault();
        const isHidden = donationSidebarEl.style.display === 'none';
        donationSidebarEl.style.display = isHidden ? 'flex' : 'none';
        if (isHidden) {
            const panel = document.getElementById('donation-panel');
            if (panel) {
                panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });
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
    withdrawn: 0
};

// Load User from LocalStorage
function loadUserProfile(username) {
    const data = localStorage.getItem(`bj_user_${username}`);
    if (data) {
        return JSON.parse(data);
    } else {
        // Default / New Profile - only create if it doesn't exist
        const newProfile = {
            username: username,
            deposit: 0,
            casinoPlayed: 0,
            sportsPlayed: 0,
            withdrawn: 0
        };
        
        // Pre-fill "Tyler" with transcription data if new
        if (username === "Tyler") {
            newProfile.deposit = 1664.61; // Casino + Sports deposits
            newProfile.casinoPlayed = 13329.70;
            newProfile.sportsPlayed = 344.35;
            newProfile.withdrawn = 1428.00; // Total withdrawn
        }
        
        // Save the new profile to localStorage so it persists on the computer
        localStorage.setItem(`bj_user_${username}`, JSON.stringify(newProfile));
        return newProfile;
    }
}

function saveUserProfile() {
    if (!currentUser) return;
    // Update from inputs
    currentUser.deposit = parseFloat(healthDeposit.value) || 0;
    currentUser.casinoPlayed = parseFloat(healthCasino.value) || 0;
    currentUser.sportsPlayed = parseFloat(healthSports.value) || 0;
    currentUser.withdrawn = parseFloat(healthWithdraw.value) || 0;
    
    localStorage.setItem(`bj_user_${currentUser.username}`, JSON.stringify(currentUser));
    updateGuideRecommendation();
}

function updateUIForLogin() {
    if (currentUser) {
        userProfileDisplay.style.display = 'flex';
        loginBtn.style.display = 'none';
        profileNameEl.textContent = currentUser.username;
        
        // Populate Health Dashboard with SESSION stats (initially 0 or manual)
        // But maybe we should let user input session stats manually?
        // For now, just show session stats in Tab 3
        healthDeposit.value = sessionStats.deposit;
        healthCasino.value = sessionStats.casinoPlayed;
        healthSports.value = sessionStats.sportsPlayed;
        healthWithdraw.value = sessionStats.withdrawn;
        
        // Trigger updates
        updateHealth();
        updateGuideRecommendation();
    } else {
        userProfileDisplay.style.display = 'none';
        loginBtn.style.display = 'block';
        
        // Clear Health Dashboard
        healthDeposit.value = 0;
        healthCasino.value = 0;
        healthSports.value = 0;
        healthWithdraw.value = 0;
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
    
    const deposit = parseFloat(healthDeposit.value) || 0;
    const casino = parseFloat(healthCasino.value) || 0;
    const sports = parseFloat(healthSports.value) || 0;
    const withdrawn = parseFloat(healthWithdraw.value) || 0;
    
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

// Event Listeners
if (closeGuideOverlayBtn) {
    closeGuideOverlayBtn.addEventListener('click', () => {
        guideOverlay.style.display = 'none';
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

// Auto-login Tyler on load
document.addEventListener('DOMContentLoaded', () => {
    // Optional: Check if last user exists? For now, hardcode default or wait
    // Let's auto-login "Tyler" if it's the first time or just leave it manual.
    // The prompt said "Make the first profile mine (Tyler)".
    currentUser = loadUserProfile("Tyler");
    updateUIForLogin();
});

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

/* --- Tab 4: Poker Assistant Logic --- */
function initPoker() {
    const pokerStack = document.getElementById('poker-stack');
    const pokerPot = document.getElementById('poker-pot');
    const calcPokerBtn = document.getElementById('calc-poker-btn');
    const pokerResult = document.getElementById('poker-result');
    const rangeBtns = document.querySelectorAll('.range-btn');
    const rangeDisplay = document.getElementById('range-display');
    
    if (calcPokerBtn) {
        calcPokerBtn.addEventListener('click', () => {
            const stack = parseFloat(pokerStack?.value) || 0;
            const pot = parseFloat(pokerPot?.value) || 0;
            
            if (pot === 0) {
                if (pokerResult) {
                    pokerResult.innerHTML = "Please enter a pot size > 0";
                    pokerResult.style.display = 'block';
                }
                return;
            }
            
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
                cssClass = "result-good";
            }
            
            if (pokerResult) {
                pokerResult.style.display = 'block';
                pokerResult.className = `scanner-result ${cssClass}`;
                pokerResult.innerHTML = `
                    <strong>SPR: ${spr.toFixed(1)}</strong><br>
                    ${advice}
                `;
            }
        });
    }

    // Simple Pre-Flop Ranges (Visual representation)
    const ranges = {
        'UTG': '<div style="color: #cbd5e1;">Open: 77+, AJs+, KQs, AQo+</div>',
        'HJ': '<div style="color: #cbd5e1;">Open: 66+, ATs+, KJs+, QJs, JTs, AJo+, KQo</div>',
        'CO': '<div style="color: #cbd5e1;">Open: 44+, A2s+, K9s+, Q9s+, J9s+, T9s, ATo+, KTo+, QTo+</div>',
        'BTN': '<div style="color: #cbd5e1;">Open: 22+, A2s+, K2s+, Q5s+, J7s+, T7s+, 96s+, 86s+, A2o+, K7o+, Q9o+, J9o+ (Steal Wide)</div>',
        'SB': '<div style="color: #cbd5e1;">Vs BB 3Bet: Continue with 88+, AJs+, KQs, AQo+. Fold weak pairs.</div>',
        'BB': '<div style="color: #cbd5e1;">Defend wide vs LP opens. 3-Bet value (QQ+) and bluffs (A5s).</div>'
    };

    rangeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            rangeBtns.forEach(b => b.style.borderColor = 'transparent');
            btn.style.borderColor = '#3b82f6';
            
            const pos = btn.getAttribute('data-pos');
            if (rangeDisplay) {
                rangeDisplay.style.display = 'block';
                rangeDisplay.innerHTML = `<strong>${pos} Range Strategy:</strong><br>${ranges[pos] || 'No data'}`;
            }
        });
    });
}

// Initialize Craps and Poker on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initCraps();
    initPoker();
});

