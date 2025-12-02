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
let numberOfDecks = 1; // Number of decks to use (default 1)
let penetrationPercent = 100; // Deck penetration percentage (50-100%)
let maxCardsInShoe = 0; // Maximum cards before reshuffle (based on penetration)
const MIN_BET = 50; // Minimum bet at this table

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
    // Don't reset running count - it persists across games
    updateCardsRemaining();
    updateUI();
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
    runningCountEl.textContent = runningCount > 0 ? `+${runningCount}` : runningCount;
    // Color code: positive = green, negative = red, zero = white
    if (runningCount > 0) {
        runningCountEl.className = 'count-positive';
    } else if (runningCount < 0) {
        runningCountEl.className = 'count-negative';
    } else {
        runningCountEl.className = 'count-zero';
    }
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

// Deal a card from the deck
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
function createCardElement(card, hidden = false, index = 0) {
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
    
    const playerValue = calculateHandValue(playerHand);
    if (isSplit) {
        playerScoreEl.textContent = `Hand 1: ${playerValue}${currentHand === 1 ? ' (Playing)' : ''}`;
        
        // Show second hand
        hand2ContainerEl.style.display = 'block';
        playerCards2El.innerHTML = '';
        playerHand2.forEach((card, index) => {
            playerCards2El.appendChild(createCardElement(card, false, index));
        });
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
        dealerScoreEl.textContent = 'Score: ?';
    } else if (dealerPlaying || !gameInProgress) {
        // Dealer is playing OR game ended - show all cards
        dealerHand.forEach((card, index) => {
            dealerCardsEl.appendChild(createCardElement(card, false, index));
        });
        const dealerValue = calculateHandValue(dealerHand);
        dealerScoreEl.textContent = `Score: ${dealerValue}`;
    }

    // Update button states
    const activeHand = getActiveHand();
    const activeHasHit = currentHand === 1 ? playerHasHit : playerHasHit2;
    const activeBet = currentHand === 1 ? currentBet : bet2;
    
    placeBetBtn.disabled = gameInProgress || balance <= 0;
    useRecommendedBtn.disabled = gameInProgress || balance <= 0;
    hitBtn.disabled = !gameInProgress;
    // Double is only available on first two cards and if player has enough balance
    doubleBtn.disabled = !gameInProgress || activeHasHit || activeHand.length !== 2 || balance < activeBet;
    // Split is only available on pairs, first two cards, before hitting, and if not already split
    splitBtn.disabled = !gameInProgress || !canSplit();
    // Insurance is only available when dealer shows Ace, before any player actions, on first hand only
    const maxInsurance = Math.floor(currentBet / 2);
    insuranceBtn.disabled = !gameInProgress || !isDealerAce() || isSplit || playerHasHit || insuranceBet > 0 || balance < maxInsurance || playerHand.length !== 2;
    // Surrender is only available on first two cards, before hitting or doubling, first hand only
    surrenderBtn.disabled = !gameInProgress || isSplit || playerHasHit || playerHand.length !== 2;
    standBtn.disabled = !gameInProgress;
    newGameBtn.disabled = gameInProgress;
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
        
        if (betRec.trueCount <= 0) {
            betReason = `Count is ${betRec.runningCount > 0 ? '+' : ''}${betRec.runningCount} (True: ${betRec.trueCount}). Bet minimum.`;
        } else if (betRec.trueCount === 1) {
            betReason = `Count is ${betRec.runningCount > 0 ? '+' : ''}${betRec.runningCount} (True: ${betRec.trueCount}). Bet $100.`;
        } else if (betRec.trueCount === 2) {
            betReason = `Count is ${betRec.runningCount > 0 ? '+' : ''}${betRec.runningCount} (True: ${betRec.trueCount}). Bet $300.`;
        } else if (betRec.trueCount === 3) {
            betReason = `Count is ${betRec.runningCount > 0 ? '+' : ''}${betRec.runningCount} (True: ${betRec.trueCount}). Bet $500.`;
        } else if (betRec.trueCount === 4) {
            betReason = `Count is ${betRec.runningCount > 0 ? '+' : ''}${betRec.runningCount} (True: ${betRec.trueCount}). Bet $1000.`;
        } else if (betRec.trueCount === 5) {
            betReason = `Count is ${betRec.runningCount > 0 ? '+' : ''}${betRec.runningCount} (True: ${betRec.trueCount}). Bet $1200.`;
        } else if (betRec.trueCount === 6) {
            betReason = `Count is ${betRec.runningCount > 0 ? '+' : ''}${betRec.runningCount} (True: ${betRec.trueCount}). Bet $1500.`;
        } else {
            betReason = `Count is ${betRec.runningCount > 0 ? '+' : ''}${betRec.runningCount} (True: ${betRec.trueCount}). Bet $2500!`;
        }
        
        recommendationEl.innerHTML = `<p>💰 Recommended Bet: $${betRec.amount.toLocaleString()}</p>`;
        advisorDetailsEl.innerHTML = `<strong>${betReason}</strong><br><br>Place a bet to get playing strategy advice.`;
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
    
    // All hands are done, dealer plays
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
        // No need to do anything, it's already gone
    }
    
    const dealerBlackjack = isBlackjack(dealerHand);
    const finalDealerValue = calculateHandValue(dealerHand);
    
    // Process each hand
    let totalWin = 0;
    let totalLoss = 0;
    
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
newGameBtn.addEventListener('click', initGame);

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
    if (e.key === 'Enter' && !placeBetBtn.disabled) {
        placeBet();
    }
});

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
initGame();

