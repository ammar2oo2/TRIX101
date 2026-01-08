// Pure scoring functions for TRIX Score Tracker
// All functions are pure (no side effects)

// Point values
const POINT_VALUES = {
    king: 75,
    queens: 25,  // per queen
    diamonds: 10,  // per diamond
    collections: 15  // per collection/trick
};

// Maximum counts per round (across all players)
const MAX_COUNTS = {
    king: 1,
    queens: 4,
    diamonds: 13,
    collections: 13
};

// Calculate delta for a single category for a single player
// handMode: 'PLUS' or 'MINUS' - determines if points are added or subtracted
function calculateCategoryDelta(categoryData, categoryType, handMode, doublingEnabled = false) {
    const { count, doubled = false } = categoryData;
    if (count === 0) {
        return 0;
    }
    
    const pointValue = POINT_VALUES[categoryType];
    const signMultiplier = handMode === 'PLUS' ? 1 : -1; // PLUS adds, MINUS subtracts
    const doubleMultiplier = (doublingEnabled && doubled) ? 2 : 1;
    
    // Only King and Queens can be doubled
    const finalMultiplier = (categoryType === 'king' || categoryType === 'queens') 
        ? signMultiplier * doubleMultiplier 
        : signMultiplier;
    
    return count * pointValue * finalMultiplier;
}

// Calculate total delta for a player in a round
function calculatePlayerRoundDelta(roundData, playerId, handMode, doublingEnabled = false) {
    const playerData = roundData.perPlayer[playerId];
    if (!playerData) {
        return 0;
    }
    
    const kingDelta = calculateCategoryDelta(playerData.king || {}, 'king', handMode, doublingEnabled);
    const queensDelta = calculateCategoryDelta(playerData.queens || {}, 'queens', handMode, doublingEnabled);
    const diamondsDelta = calculateCategoryDelta(playerData.diamonds || {}, 'diamonds', handMode, doublingEnabled);
    const collectionsDelta = calculateCategoryDelta(playerData.collections || {}, 'collections', handMode, doublingEnabled);
    
    return kingDelta + queensDelta + diamondsDelta + collectionsDelta;
}

// Calculate all player deltas for a round
function calculateRoundDeltas(roundData, handMode, doublingEnabled = false) {
    const deltas = {};
    const playerIds = Object.keys(roundData.perPlayer || {});
    
    playerIds.forEach(playerId => {
        deltas[playerId] = calculatePlayerRoundDelta(roundData, playerId, handMode, doublingEnabled);
    });
    
    return deltas;
}

// Calculate total score for a player across all rounds
function calculatePlayerTotal(match, playerId) {
    if (!match || !match.rounds) {
        return 0;
    }
    
    const doublingEnabled = match.doublingEnabled || false;
    
    return match.rounds.reduce((total, round) => {
        // Use precomputed delta if available (more efficient)
        if (round.computed && round.computed[playerId] !== undefined) {
            return total + round.computed[playerId];
        }
        // Otherwise recalculate (for old data or validation)
        const handMode = round.handMode || 'MINUS'; // Default to MINUS for backwards compatibility
        const delta = calculatePlayerRoundDelta(round, playerId, handMode, doublingEnabled);
        return total + delta;
    }, 0);
}

// Calculate all player totals for a match
function calculateAllPlayerTotals(match) {
    if (!match || !match.players) {
        return {};
    }
    
    const totals = {};
    match.players.forEach(player => {
        totals[player.id] = calculatePlayerTotal(match, player.id);
    });
    
    return totals;
}

// Get total count for a category across all players in a round draft
function getCategoryTotalCount(roundDraft, categoryType) {
    if (!roundDraft || !roundDraft.perPlayer) {
        return 0;
    }
    
    let total = 0;
    Object.values(roundDraft.perPlayer).forEach(playerData => {
        const categoryData = playerData[categoryType] || {};
        total += categoryData.count || 0;
    });
    
    return total;
}

// Check if a category has reached its maximum count
function isCategoryAtMax(roundDraft, categoryType) {
    const currentTotal = getCategoryTotalCount(roundDraft, categoryType);
    const maxCount = MAX_COUNTS[categoryType];
    return currentTotal >= maxCount;
}

// Check if incrementing a category would exceed the maximum
function wouldExceedMax(roundDraft, categoryType, playerId, currentCount) {
    const currentTotal = getCategoryTotalCount(roundDraft, categoryType);
    const maxCount = MAX_COUNTS[categoryType];
    
    // Subtract current player's count and add the new count
    const playerData = roundDraft.perPlayer[playerId] || {};
    const categoryData = playerData[categoryType] || {};
    const playerCurrentCount = categoryData.count || 0;
    
    const newTotal = currentTotal - playerCurrentCount + (currentCount + 1);
    return newTotal > maxCount;
}

// Check if a round is partial (any category total is less than max)
function isRoundPartial(roundData) {
    const categories = ['king', 'queens', 'diamonds', 'collections'];
    
    for (const category of categories) {
        const total = getCategoryTotalCount(roundData, category);
        const max = MAX_COUNTS[category];
        if (total < max) {
            return true;
        }
    }
    
    return false;
}

// Validate round data structure
function validateRoundData(roundData) {
    if (!roundData || !roundData.perPlayer) {
        return { valid: false, error: 'Round data missing perPlayer' };
    }
    
    // Check category totals don't exceed max
    const categories = ['king', 'queens', 'diamonds', 'collections'];
    for (const category of categories) {
        const total = getCategoryTotalCount(roundData, category);
        const max = MAX_COUNTS[category];
        if (total > max) {
            return { 
                valid: false, 
                error: `${category} total (${total}) exceeds maximum (${max})` 
            };
        }
    }
    
    return { valid: true };
}

// Prepare round data for saving (add computed deltas and partial flag)
function prepareRoundForSave(roundData, handMode, doublingEnabled = false) {
    const deltas = calculateRoundDeltas(roundData, handMode, doublingEnabled);
    const partial = isRoundPartial(roundData);
    
    return {
        ...roundData,
        computed: deltas,
        partial,
        handMode: handMode // Store hand mode in round data
    };
}

// Get default category data (no sign - sign determined by hand mode)
function getDefaultCategoryData() {
    return {
        count: 0,
        doubled: false
    };
}

// Get default round draft structure for all players
function getDefaultRoundDraft(playerIds) {
    const perPlayer = {};
    
    playerIds.forEach(playerId => {
        perPlayer[playerId] = {
            king: { ...getDefaultCategoryData() },
            queens: { ...getDefaultCategoryData() },
            diamonds: { ...getDefaultCategoryData() },
            collections: { ...getDefaultCategoryData() }
        };
    });
    
    return { perPlayer };
}

// Reset round draft to default values
function resetRoundDraft(roundDraft) {
    const playerIds = Object.keys(roundDraft.perPlayer || {});
    return getDefaultRoundDraft(playerIds);
}

// Check if round draft is empty (all zeros) - updated for new structure without sign
function isRoundDraftEmpty(roundDraft) {
    if (!roundDraft || !roundDraft.perPlayer) {
        return true;
    }
    
    for (const playerData of Object.values(roundDraft.perPlayer)) {
        const categories = ['king', 'queens', 'diamonds', 'collections'];
        for (const category of categories) {
            const categoryData = playerData[category] || {};
            const count = categoryData.count || 0;
            if (count > 0) {
                return false;
            }
        }
    }
    
    return true;
}
