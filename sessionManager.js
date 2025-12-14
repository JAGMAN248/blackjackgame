/**
 * Session-Based Operating System for Advantage Play
 * Manages "Casino Night" workflow: Check-In → Active Session → Cash-Out
 */

// The Data Structure
const initialState = {
    totalBankroll: 0,
    cleanMoney: 0,
    dirtyMoney: 0,
    sessionActive: false,
    sessionStartTime: null,
    startingBankroll: 0,
    washingTarget: 0, // Total wagering needed to clean dirty money
    totalWagered: 0, // Total amount wagered this session
    sessionLog: [] // Stores every game played tonight
};

// Get current session data
function getSessionData() {
    const stored = localStorage.getItem('casinoData');
    return stored ? JSON.parse(stored) : { ...initialState };
}

// Save session data
function saveSessionData(data) {
    localStorage.setItem('casinoData', JSON.stringify(data));
    updateHUD(); // Refresh the sticky bar
}

// 1. START SESSION (The Check-In)
function startCasinoNight(deposit, bonus, washingTarget) {
    let data = getSessionData();
    
    // Reset session-specific data
    data.sessionActive = true;
    data.sessionStartTime = new Date().toISOString();
    data.startingBankroll = data.totalBankroll + deposit + bonus;
    
    // Update bankroll
    data.totalBankroll += (deposit + bonus);
    data.cleanMoney += deposit;
    data.dirtyMoney += bonus;
    
    // Set washing target (if not provided, calculate default: 2x dirty money)
    data.washingTarget = washingTarget || (bonus * 2);
    data.totalWagered = 0;
    data.sessionLog = [];
    
    saveSessionData(data);
    return data;
}

// 2. LOG GAME RESULT (The "Mirror" Logic)
function logGameResult(gameType, wagerAmount, profitLoss) {
    let data = getSessionData();
    
    if (!data.sessionActive) {
        console.warn('No active session. Start a Casino Night first.');
        return;
    }
    
    // Update Bankroll
    data.totalBankroll += profitLoss;
    
    // Update Washing (Health)
    // Logic: If you wagered dirty money, it becomes clean
    if (data.dirtyMoney > 0 && wagerAmount > 0) {
        // Calculate how much dirty money was wagered
        // Assume proportional: if 50% of bankroll is dirty, 50% of wager is dirty
        const dirtyRatio = data.dirtyMoney / (data.totalBankroll - profitLoss); // Ratio before this bet
        const dirtyWagered = Math.min(data.dirtyMoney, wagerAmount * dirtyRatio);
        
        // Move wagered dirty money to clean
        data.dirtyMoney -= dirtyWagered;
        data.cleanMoney += dirtyWagered;
    }
    
    // Update session wagering
    data.totalWagered += wagerAmount;
    
    // Log history
    data.sessionLog.push({
        time: new Date().toISOString(),
        game: gameType,
        wager: wagerAmount,
        result: profitLoss,
        bankrollAfter: data.totalBankroll
    });
    
    saveSessionData(data);
    return data;
}

// 3. END SESSION (The Cash-Out)
function endCasinoNight() {
    let data = getSessionData();
    
    if (!data.sessionActive) {
        return null;
    }
    
    const sessionSummary = {
        startTime: data.sessionStartTime,
        endTime: new Date().toISOString(),
        startingBankroll: data.startingBankroll,
        endingBankroll: data.totalBankroll,
        profit: data.totalBankroll - data.startingBankroll,
        totalWagered: data.totalWagered,
        washingComplete: data.totalWagered >= data.washingTarget,
        washingProgress: Math.min(100, (data.totalWagered / data.washingTarget) * 100),
        dirtyMoneyRemaining: data.dirtyMoney,
        cleanMoney: data.cleanMoney,
        gamesPlayed: data.sessionLog.length,
        sessionLog: [...data.sessionLog]
    };
    
    // Deactivate session
    data.sessionActive = false;
    data.sessionStartTime = null;
    data.totalWagered = 0;
    
    saveSessionData(data);
    return sessionSummary;
}

// 4. THE WIPE BUTTON
function wipeData() {
    if (confirm("Delete all history? This cannot be undone.")) {
        localStorage.removeItem('casinoData');
        location.reload();
    }
}

// 5. UPDATE HUD (Heads Up Display)
function updateHUD() {
    const data = getSessionData();
    const hudEl = document.getElementById('session-hud');
    
    if (!hudEl) return;
    
    if (!data.sessionActive) {
        hudEl.style.display = 'none';
        return;
    }
    
    hudEl.style.display = 'flex';
    
    // Update bankroll
    const bankrollEl = document.getElementById('hud-bankroll');
    if (bankrollEl) {
        bankrollEl.textContent = `$${data.totalBankroll.toFixed(2)}`;
    }
    
    // Update wash progress
    const washProgressEl = document.getElementById('hud-wash-progress');
    const washPercentEl = document.getElementById('hud-wash-percent');
    const washBarEl = document.getElementById('hud-wash-bar');
    
    if (data.washingTarget > 0) {
        const washPercent = Math.min(100, (data.totalWagered / data.washingTarget) * 100);
        
        if (washPercentEl) {
            washPercentEl.textContent = `${washPercent.toFixed(0)}%`;
        }
        
        if (washProgressEl) {
            washProgressEl.textContent = `$${data.totalWagered.toFixed(0)} / $${data.washingTarget.toFixed(0)}`;
        }
        
        if (washBarEl) {
            washBarEl.style.width = `${washPercent}%`;
        }
    } else {
        if (washPercentEl) washPercentEl.textContent = 'N/A';
        if (washProgressEl) washProgressEl.textContent = 'No target';
        if (washBarEl) washBarEl.style.width = '0%';
    }
    
    // Update risk indicator
    const riskEl = document.getElementById('hud-risk');
    if (riskEl) {
        const dirtyPercent = data.totalBankroll > 0 ? (data.dirtyMoney / data.totalBankroll) * 100 : 0;
        if (dirtyPercent > 50) {
            riskEl.textContent = '🔴 High Risk';
            riskEl.style.color = '#f87171';
        } else if (dirtyPercent > 25) {
            riskEl.textContent = '🟡 Medium Risk';
            riskEl.style.color = '#fbbf24';
        } else {
            riskEl.textContent = '🟢 Low Risk';
            riskEl.style.color = '#22c55e';
        }
    }
    
    // Ensure Coach button is visible
    const askCoachBtn = document.getElementById('ask-coach-btn');
    if (askCoachBtn) {
        askCoachBtn.style.display = 'inline-block';
    }
}

// 6. GET CURRENT SESSION STATUS
function getSessionStatus() {
    const data = getSessionData();
    return {
        active: data.sessionActive,
        bankroll: data.totalBankroll,
        cleanMoney: data.cleanMoney,
        dirtyMoney: data.dirtyMoney,
        washingProgress: data.washingTarget > 0 ? (data.totalWagered / data.washingTarget) * 100 : 0,
        totalWagered: data.totalWagered,
        washingTarget: data.washingTarget
    };
}

// Export functions for use in script.js
if (typeof window !== 'undefined') {
    window.sessionManager = {
        startCasinoNight,
        logGameResult,
        endCasinoNight,
        wipeData,
        updateHUD,
        getSessionStatus,
        getSessionData
    };
}

