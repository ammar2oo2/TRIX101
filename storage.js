// Storage management for TRIX Score Tracker
// Uses localStorage to persist matches and app state

const STORAGE_KEY = 'trix_app_state';

// Default app state structure
const defaultAppState = {
    matches: [],
    activeMatchId: null
};

// Get app state from localStorage
function getAppState() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Error reading app state:', e);
    }
    return { ...defaultAppState };
}

// Save app state to localStorage
function saveAppState(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        return true;
    } catch (e) {
        console.error('Error saving app state:', e);
        return false;
    }
}

// Create a new match
function createMatch(players, doublingEnabled = false) {
    const state = getAppState();
    const match = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        doublingEnabled,
        players: players.map((name, index) => ({
            id: `player_${index}`,
            name: name || `Player ${index + 1}`
        })),
        currentKingdom: 1,
        kingdoms: [
            { playedPlus: false, playedMinus: false },
            { playedPlus: false, playedMinus: false },
            { playedPlus: false, playedMinus: false },
            { playedPlus: false, playedMinus: false }
        ],
        rounds: []
    };
    
    state.matches.push(match);
    state.activeMatchId = match.id;
    saveAppState(state);
    return match;
}

// Get active match
function getActiveMatch() {
    const state = getAppState();
    if (!state.activeMatchId) {
        return null;
    }
    return state.matches.find(m => m.id === state.activeMatchId) || null;
}

// Get match by ID
function getMatch(matchId) {
    const state = getAppState();
    return state.matches.find(m => m.id === matchId) || null;
}

// Update match
function updateMatch(match) {
    const state = getAppState();
    const index = state.matches.findIndex(m => m.id === match.id);
    if (index !== -1) {
        state.matches[index] = match;
        saveAppState(state);
        return true;
    }
    return false;
}

// Delete match
function deleteMatch(matchId) {
    const state = getAppState();
    state.matches = state.matches.filter(m => m.id !== matchId);
    if (state.activeMatchId === matchId) {
        state.activeMatchId = null;
    }
    saveAppState(state);
    return true;
}

// Duplicate match (creates new match with same players and settings, no rounds)
function duplicateMatch(matchId) {
    const match = getMatch(matchId);
    if (!match) {
        return null;
    }
    
    const newMatch = createMatch(
        match.players.map(p => p.name),
        match.doublingEnabled
    );
    return newMatch;
}

// Add round to match
function addRoundToMatch(matchId, round) {
    const match = getMatch(matchId);
    if (!match) {
        return false;
    }
    
    if (!round.id) {
        round.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }
    if (!round.createdAt) {
        round.createdAt = new Date().toISOString();
    }
    
    match.rounds.push(round);
    return updateMatch(match);
}

// Update round in match
function updateRoundInMatch(matchId, roundId, roundData) {
    const match = getMatch(matchId);
    if (!match) {
        return false;
    }
    
    const index = match.rounds.findIndex(r => r.id === roundId);
    if (index !== -1) {
        match.rounds[index] = { ...match.rounds[index], ...roundData };
        return updateMatch(match);
    }
    return false;
}

// Delete round from match
function deleteRoundFromMatch(matchId, roundId) {
    const match = getMatch(matchId);
    if (!match) {
        return false;
    }
    
    match.rounds = match.rounds.filter(r => r.id !== roundId);
    return updateMatch(match);
}

// Get all matches
function getAllMatches() {
    const state = getAppState();
    return state.matches;
}

// Set active match
function setActiveMatch(matchId) {
    const state = getAppState();
    if (matchId && state.matches.find(m => m.id === matchId)) {
        state.activeMatchId = matchId;
        saveAppState(state);
        return true;
    }
    return false;
}

// Clear active match
function clearActiveMatch() {
    const state = getAppState();
    state.activeMatchId = null;
    saveAppState(state);
}

// Mark hand as played for current kingdom
function markHandAsPlayed(matchId, handMode) {
    const match = getMatch(matchId);
    if (!match) return false;
    
    const kingdomIndex = match.currentKingdom - 1;
    if (handMode === 'PLUS') {
        match.kingdoms[kingdomIndex].playedPlus = true;
    } else if (handMode === 'MINUS') {
        match.kingdoms[kingdomIndex].playedMinus = true;
    }
    
    // Check if both hands are played for this kingdom
    if (match.kingdoms[kingdomIndex].playedPlus && match.kingdoms[kingdomIndex].playedMinus) {
        // Advance to next kingdom if not finished
        if (match.currentKingdom < 4) {
            match.currentKingdom++;
        }
    }
    
    return updateMatch(match);
}

// Get available hand modes for current kingdom
function getAvailableHandModes(matchId) {
    const match = getMatch(matchId);
    if (!match) return [];
    
    const kingdomIndex = match.currentKingdom - 1;
    const kingdom = match.kingdoms[kingdomIndex];
    const modes = [];
    
    if (!kingdom.playedPlus) {
        modes.push('PLUS');
    }
    if (!kingdom.playedMinus) {
        modes.push('MINUS');
    }
    
    return modes;
}

// Check if game is finished (all 4 kingdoms completed)
function isGameFinished(matchId) {
    const match = getMatch(matchId);
    if (!match) return false;
    
    return match.currentKingdom > 4 || 
           (match.currentKingdom === 4 && 
            match.kingdoms[3].playedPlus && 
            match.kingdoms[3].playedMinus);
}
