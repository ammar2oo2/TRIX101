// Main application logic for TRIX Score Tracker

// App state
let currentMatch = null;
let currentRoundDraft = null;
let editingRoundId = null;
let currentPlayerIndex = 0;
let currentHandMode = null; // PLUS or MINUS
let isArabic = true;

// Initialize app
function init() {
    setupEventListeners();
    checkActiveMatch();
    updateLanguage();
}

// Setup all event listeners
function setupEventListeners() {
    // New Game screen
    document.getElementById('start-btn').addEventListener('click', handleStart);
    document.getElementById('doubling-toggle').addEventListener('click', toggleDoubling);
    document.getElementById('back-new-game').addEventListener('click', () => showScreen('new-game'));
    
    // Game screen
    document.getElementById('back-game').addEventListener('click', handleBackFromGame);
    document.getElementById('fab-new-hand').addEventListener('click', handleNewHand);
    document.getElementById('duplicate-btn').addEventListener('click', handleDuplicate);
    document.getElementById('trash-btn').addEventListener('click', handleTrash);
    
    // Mode selection modal
    document.getElementById('select-plus-btn').addEventListener('click', () => handleModeSelected('PLUS'));
    document.getElementById('select-minus-btn').addEventListener('click', () => handleModeSelected('MINUS'));
    document.getElementById('cancel-mode-btn').addEventListener('click', () => hideModal('mode-modal'));
    
    // Round entry screen (PLUS or MINUS)
    document.getElementById('back-complex').addEventListener('click', handleBackFromComplex);
    document.getElementById('save-hand-btn').addEventListener('click', handleSaveHand);
    document.getElementById('reset-btn').addEventListener('click', handleResetRound);
    
    // Modals
    document.getElementById('save-round-btn').addEventListener('click', handleSaveRound);
    document.getElementById('discard-btn').addEventListener('click', handleDiscardRound);
    document.getElementById('confirm-delete-btn').addEventListener('click', handleConfirmDelete);
    document.getElementById('cancel-delete-btn').addEventListener('click', () => hideModal('delete-modal'));
    
    // Action sheet
    document.getElementById('edit-round-btn').addEventListener('click', handleEditRound);
    document.getElementById('delete-round-btn').addEventListener('click', handleDeleteRound);
    document.getElementById('cancel-actions-btn').addEventListener('click', () => hideActionSheet());
    
    // Close modals on background click
    document.getElementById('save-modal').addEventListener('click', (e) => {
        if (e.target.id === 'save-modal') hideModal('save-modal');
    });
    document.getElementById('delete-modal').addEventListener('click', (e) => {
        if (e.target.id === 'delete-modal') hideModal('delete-modal');
    });
    document.getElementById('mode-modal').addEventListener('click', (e) => {
        if (e.target.id === 'mode-modal') hideModal('mode-modal');
    });
    document.getElementById('round-actions').addEventListener('click', (e) => {
        if (e.target.id === 'round-actions') hideActionSheet();
    });
}

// Check if there's an active match on load
function checkActiveMatch() {
    const match = getActiveMatch();
    if (match) {
        currentMatch = match;
        showScreen('game');
        renderGameView();
    } else {
        showScreen('new-game');
    }
}

// Show a specific screen
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(`screen-${screenName}`).classList.add('active');
}

// Toggle doubling
function toggleDoubling() {
    const toggle = document.getElementById('doubling-toggle');
    toggle.classList.toggle('active');
}

// Handle start button
function handleStart() {
    const player1 = document.getElementById('player1').value.trim();
    const player2 = document.getElementById('player2').value.trim();
    const player3 = document.getElementById('player3').value.trim();
    const player4 = document.getElementById('player4').value.trim();
    
    const players = [
        player1 || 'Player 1',
        player2 || 'Player 2',
        player3 || 'Player 3',
        player4 || 'Player 4'
    ];
    
    const doublingEnabled = document.getElementById('doubling-toggle').classList.contains('active');
    
    currentMatch = createMatch(players, doublingEnabled);
    showScreen('game');
    renderGameView();
}

// Render game view
function renderGameView() {
    if (!currentMatch) return;
    
    // Render kingdom header with available modes
    const kingdomHeader = document.getElementById('kingdom-header');
    if (isGameFinished(currentMatch.id)) {
        kingdomHeader.innerHTML = '<div style="text-align: center; font-size: 18px; font-weight: 600; color: var(--primary-red); padding: 12px;">Game Finished</div>';
    } else {
        const availableModes = getAvailableHandModes(currentMatch.id);
        const modeStatus = availableModes.length === 2 
            ? 'PLUS and MINUS available' 
            : availableModes.includes('PLUS') 
            ? 'PLUS remaining' 
            : 'MINUS remaining';
        kingdomHeader.innerHTML = `
            <div style="text-align: center; font-size: 18px; font-weight: 600; color: var(--primary-red); padding: 8px;">
                Kingdom ${currentMatch.currentKingdom} of 4
            </div>
            <div style="text-align: center; font-size: 14px; color: var(--gray-dark); padding: 4px;">
                ${modeStatus}
            </div>
        `;
    }
    
    // Render player names
    const namesRow = document.getElementById('player-names-row');
    namesRow.innerHTML = currentMatch.players.map(p => 
        `<div>${p.name}</div>`
    ).join('');
    
    // Calculate and render totals
    const totals = calculateAllPlayerTotals(currentMatch);
    const totalsRow = document.getElementById('totals-row');
    totalsRow.innerHTML = currentMatch.players.map(p => 
        `<div>${totals[p.id] || 0}</div>`
    ).join('');
    
    // Render hand mode status
    renderHandModeButtons();
    
    // Render rounds list
    renderRoundsList();
}

// Handle new hand button (floating +) - shows modal when both modes available
function handleNewHand() {
    if (!currentMatch) {
        alert('No active match. Please start a new game first.');
        return;
    }
    
    if (isGameFinished(currentMatch.id)) {
        alert('Game is finished! All 4 kingdoms have been completed.');
        return;
    }
    
    const availableModes = getAvailableHandModes(currentMatch.id);
    
    if (availableModes.length === 0) {
        alert('No modes available. This should not happen.');
        return;
    }
    
    if (availableModes.length === 1) {
        // Only one mode available, go directly to it (no modal)
        handleStartHand(availableModes[0]);
    } else {
        // Both modes available, show modal to choose PLUS or MINUS
        showModal('mode-modal');
    }
}

// Handle mode selection from modal
function handleModeSelected(handMode) {
    hideModal('mode-modal');
    handleStartHand(handMode);
}

// Render hand mode buttons (visible buttons/cards for each available mode)
function renderHandModeButtons() {
    const handModesContainer = document.getElementById('hand-modes');
    
    if (isGameFinished(currentMatch.id)) {
        handModesContainer.innerHTML = '<div style="text-align: center; padding: 16px; color: var(--gray-dark);">Game Finished</div>';
        return;
    }
    
    const availableModes = getAvailableHandModes(currentMatch.id);
    
    if (availableModes.length === 0) {
        handModesContainer.innerHTML = '';
        return;
    }
    
    // Show visible buttons/cards for available modes
    handModesContainer.innerHTML = availableModes.map(mode => {
        const isPlus = mode === 'PLUS';
        const bgColor = isPlus ? 'var(--green)' : 'var(--red)';
        return `
            <button class="hand-mode-btn" data-hand-mode="${mode}" style="background-color: ${bgColor};">
                ${mode}
            </button>
        `;
    }).join('');
    
    // Add click listeners
    document.querySelectorAll('.hand-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.handMode;
            handleStartHand(mode);
        });
    });
}

// Render rounds list
function renderRoundsList() {
    const roundsList = document.getElementById('rounds-list');
    
    if (!currentMatch.rounds || currentMatch.rounds.length === 0) {
        roundsList.innerHTML = '';
        return;
    }
    
    // Group rounds by kingdom and hand mode for better display
    roundsList.innerHTML = currentMatch.rounds.map((round, index) => {
        const time = new Date(round.createdAt).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        const partialBadge = round.partial 
            ? '<span class="round-partial">Partial</span>' 
            : '';
        const kingdomLabel = round.kingdomNumber ? `Kingdom ${round.kingdomNumber} - ${round.handMode || ''}` : `Round ${index + 1}`;
        
        const deltas = round.computed || {};
        const deltaCells = currentMatch.players.map(p => {
            const delta = deltas[p.id] || 0;
            const className = delta >= 0 ? 'positive' : 'negative';
            const sign = delta >= 0 ? '+' : '';
            return `<div class="round-delta ${className}">${sign}${delta}</div>`;
        }).join('');
        
        return `
            <div class="round-item" data-round-id="${round.id}">
                <div class="round-header">
                    <span class="round-number">${kingdomLabel}</span>
                    <div>
                        ${partialBadge}
                        <span style="margin-left: 8px;">${time}</span>
                    </div>
                </div>
                <div class="round-deltas">
                    ${deltaCells}
                </div>
            </div>
        `;
    }).join('');
    
    // Add click listeners to round items
    document.querySelectorAll('.round-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const roundId = item.dataset.roundId;
            showRoundActions(roundId);
        });
    });
}

// Show round actions sheet
function showRoundActions(roundId) {
    editingRoundId = roundId;
    document.getElementById('round-actions').classList.add('active');
}

// Hide action sheet
function hideActionSheet() {
    document.getElementById('round-actions').classList.remove('active');
    editingRoundId = null;
}

// Handle edit round
function handleEditRound() {
    hideActionSheet();
    if (!editingRoundId || !currentMatch) return;
    
    const round = currentMatch.rounds.find(r => r.id === editingRoundId);
    if (!round) return;
    
    // Deep copy round data, ensuring perPlayer structure exists
    // Also ensure category data structure is correct (no sign field)
    const perPlayer = {};
    Object.keys(round.perPlayer || {}).forEach(playerId => {
        perPlayer[playerId] = {};
        ['king', 'queens', 'diamonds', 'collections'].forEach(category => {
            const catData = round.perPlayer[playerId][category] || {};
            perPlayer[playerId][category] = {
                count: catData.count || 0,
                doubled: catData.doubled || false
            };
        });
    });
    
    currentRoundDraft = {
        id: round.id,
        createdAt: round.createdAt,
        perPlayer: perPlayer
    };
    currentHandMode = round.handMode || 'MINUS';
    editingRoundId = round.id;
    currentPlayerIndex = 0;
    
    showScreen('complex');
    renderComplexRound();
}

// Handle delete round
function handleDeleteRound() {
    hideActionSheet();
    if (!editingRoundId || !currentMatch) return;
    
    if (confirm('Delete this round?')) {
        deleteRoundFromMatch(currentMatch.id, editingRoundId);
        currentMatch = getActiveMatch();
        renderGameView();
    }
    editingRoundId = null;
}

// Handle back from game
function handleBackFromGame() {
    if (currentMatch && currentMatch.rounds.length > 0) {
        if (confirm('Return to new game? Your match will be saved.')) {
            clearActiveMatch();
            currentMatch = null;
            showScreen('new-game');
        }
    } else {
        clearActiveMatch();
        currentMatch = null;
        showScreen('new-game');
    }
}

// Handle duplicate
function handleDuplicate() {
    if (!currentMatch) return;
    
    const newMatch = duplicateMatch(currentMatch.id);
    if (newMatch) {
        currentMatch = newMatch;
        setActiveMatch(newMatch.id);
        renderGameView();
    }
}

// Handle trash
function handleTrash() {
    if (!currentMatch) return;
    showModal('delete-modal');
}

// Handle confirm delete
function handleConfirmDelete() {
    hideModal('delete-modal');
    if (!currentMatch) return;
    
    deleteMatch(currentMatch.id);
    currentMatch = null;
    clearActiveMatch();
    showScreen('new-game');
}

// Handle start hand (opens round entry with selected mode)
function handleStartHand(handMode) {
    if (!currentMatch || isGameFinished(currentMatch.id)) return;
    
    // Validate handMode
    if (handMode !== 'PLUS' && handMode !== 'MINUS') {
        console.error('Invalid handMode:', handMode);
        return;
    }
    
    // Set hand mode FIRST - this determines scoring (PLUS adds, MINUS subtracts)
    currentHandMode = handMode;
    editingRoundId = null;
    const playerIds = currentMatch.players.map(p => p.id);
    currentRoundDraft = getDefaultRoundDraft(playerIds);
    currentPlayerIndex = 0;
    
    // Show screen
    showScreen('complex');
    
    // Set title IMMEDIATELY - MUST be "Kingdom X – PLUS" or "Kingdom X – MINUS", NEVER "Complex"
    const title = document.getElementById('complex-title');
    if (title) {
        title.textContent = `Kingdom ${currentMatch.currentKingdom} – ${currentHandMode}`;
    }
    
    // Then render everything
    renderComplexRound();
}

// Render round entry (PLUS or MINUS)
function renderComplexRound() {
    if (!currentMatch || !currentRoundDraft) return;
    
    // ALWAYS ensure title is set - NEVER show "Complex"
    const title = document.getElementById('complex-title');
    if (editingRoundId) {
        const round = currentMatch.rounds.find(r => r.id === editingRoundId);
        const kingdomNum = round ? round.kingdomNumber : currentMatch.currentKingdom;
        const handMode = round ? round.handMode : (currentHandMode || 'MINUS');
        currentHandMode = handMode; // Set for rendering
        title.textContent = `Kingdom ${kingdomNum} – ${handMode}`;
    } else {
        // For new rounds, currentHandMode should already be set by handleStartHand
        if (!currentHandMode) {
            console.error('ERROR: currentHandMode not set! This should not happen.');
            currentHandMode = 'PLUS'; // Fallback
        }
        title.textContent = `Kingdom ${currentMatch.currentKingdom} – ${currentHandMode}`;
    }
    
    // Verify title was set correctly
    if (title.textContent.includes('Complex')) {
        console.error('ERROR: Title contains "Complex"! Fixing...');
        title.textContent = `Kingdom ${currentMatch.currentKingdom} – ${currentHandMode || 'PLUS'}`;
    }
    
    // Render player tabs
    renderPlayerTabs();
    
    // Render category rows for current player
    renderCategoryRows();
    
    // Update category icons
    updateCategoryIcons();
}

// Render player tabs
function renderPlayerTabs() {
    const tabsContainer = document.getElementById('player-tabs');
    tabsContainer.innerHTML = currentMatch.players.map((player, index) => 
        `<button class="player-tab ${index === currentPlayerIndex ? 'active' : ''}" 
                 data-player-index="${index}">
            ${player.name}
        </button>`
    ).join('');
    
    // Add click listeners
    document.querySelectorAll('.player-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            currentPlayerIndex = parseInt(tab.dataset.playerIndex);
            renderPlayerTabs();
            renderCategoryRows();
        });
    });
}

// Render category rows (different UI for PLUS vs MINUS)
function renderCategoryRows() {
    const card = document.getElementById('round-entry-card');
    const playerId = currentMatch.players[currentPlayerIndex].id;
    const playerData = currentRoundDraft.perPlayer[playerId] || {};
    const isPlusMode = currentHandMode === 'PLUS';
    
    const categories = [
        { key: 'king', label: 'King of hearts' },
        { key: 'queens', label: 'Queens' },
        { key: 'diamonds', label: 'Diamonds' },
        { key: 'collections', label: 'Collections' }
    ];
    
    card.innerHTML = categories.map(cat => {
        const catData = playerData[cat.key] || { count: 0, doubled: false };
        const show2X = currentMatch.doublingEnabled && (cat.key === 'king' || cat.key === 'queens');
        const isAtMax = isCategoryAtMax(currentRoundDraft, cat.key);
        const canIncrement = !wouldExceedMax(currentRoundDraft, cat.key, playerId, catData.count);
        
        // PLUS and MINUS pages use same UI - only increment/decrement buttons
        // The sign (positive/negative) is determined by handMode in scoring
        return `
            <div class="category-row" data-category="${cat.key}">
                <div class="category-label">${cat.label}</div>
                <div class="category-controls">
                    ${catData.count > 0 ? `
                        <button class="btn-circle btn-minus" 
                                data-action="decrement" 
                                data-category="${cat.key}"
                                style="width: 36px; height: 36px; font-size: 18px;">-</button>
                    ` : '<div style="width: 36px;"></div>'}
                    <div class="count-display">
                        <span>${catData.count}</span>
                    </div>
                    <button class="btn-circle btn-plus" 
                            data-action="increment" 
                            data-category="${cat.key}"
                            ${(!canIncrement || isAtMax) ? 'disabled' : ''}>+</button>
                    ${show2X ? `
                        <button class="btn-circle btn-2x ${catData.doubled ? 'active' : ''}" 
                                data-action="2x" 
                                data-category="${cat.key}">2X</button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    // Add event listeners
    card.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = btn.dataset.action;
            const category = btn.dataset.category;
            handleCategoryAction(action, category);
        });
    });
}

// Handle category action (no sign switching - sign determined by hand mode)
function handleCategoryAction(action, categoryKey) {
    const playerId = currentMatch.players[currentPlayerIndex].id;
    const playerData = currentRoundDraft.perPlayer[playerId] || {};
    const categoryData = playerData[categoryKey] || { count: 0, doubled: false };
    
    if (action === 'decrement') {
        categoryData.count = Math.max(0, categoryData.count - 1);
    } else if (action === 'increment') {
        if (!wouldExceedMax(currentRoundDraft, categoryKey, playerId, categoryData.count)) {
            categoryData.count += 1;
        }
    } else if (action === '2x') {
        categoryData.doubled = !categoryData.doubled;
    }
    
    if (!currentRoundDraft.perPlayer[playerId]) {
        currentRoundDraft.perPlayer[playerId] = {
            king: { count: 0, doubled: false },
            queens: { count: 0, doubled: false },
            diamonds: { count: 0, doubled: false },
            collections: { count: 0, doubled: false }
        };
    }
    
    currentRoundDraft.perPlayer[playerId][categoryKey] = categoryData;
    renderCategoryRows();
}

// Update category icons (visual feedback)
function updateCategoryIcons() {
    // This could highlight active categories, but for now just show all
    document.querySelectorAll('.category-icon').forEach(icon => {
        icon.style.opacity = '1';
    });
}

// Handle reset round
function handleResetRound() {
    if (confirm('Reset all values in this hand?')) {
        const playerIds = currentMatch.players.map(p => p.id);
        currentRoundDraft = getDefaultRoundDraft(playerIds);
        renderCategoryRows();
    }
}

// Handle back from complex
function handleBackFromComplex() {
    if (isRoundDraftEmpty(currentRoundDraft)) {
        // No changes, just go back
        showScreen('game');
        currentRoundDraft = null;
        editingRoundId = null;
        currentHandMode = null;
        return;
    }
    
    // Show save/discard modal
    showModal('save-modal');
}

// Show modal
function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

// Hide modal
function hideModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Handle save hand (green checkmark)
function handleSaveHand() {
    if (!currentMatch || !currentRoundDraft) return;
    
    // For new rounds, require hand mode
    if (!editingRoundId && !currentHandMode) return;
    
    // Get hand mode for scoring
    const handMode = editingRoundId 
        ? currentMatch.rounds.find(r => r.id === editingRoundId)?.handMode || currentHandMode
        : currentHandMode;
    
    if (!handMode) {
        alert('Error: Hand mode is required');
        return;
    }
    
    // Validate and prepare round
    const validation = validateRoundData(currentRoundDraft);
    if (!validation.valid) {
        alert('Error: ' + validation.error);
        return;
    }
    
    const roundToSave = prepareRoundForSave(currentRoundDraft, handMode, currentMatch.doublingEnabled);
    
    if (editingRoundId) {
        // Update existing round - preserve kingdom and hand mode
        const existingRound = currentMatch.rounds.find(r => r.id === editingRoundId);
        if (existingRound) {
            roundToSave.kingdomNumber = existingRound.kingdomNumber;
            roundToSave.handMode = existingRound.handMode;
        }
        updateRoundInMatch(currentMatch.id, editingRoundId, roundToSave);
    } else {
        // Add new round and mark hand as played
        roundToSave.kingdomNumber = currentMatch.currentKingdom;
        roundToSave.handMode = currentHandMode;
        addRoundToMatch(currentMatch.id, roundToSave);
        markHandAsPlayed(currentMatch.id, currentHandMode);
    }
    
    // Refresh match and return to game view
    currentMatch = getActiveMatch();
    currentRoundDraft = null;
    editingRoundId = null;
    currentHandMode = null;
    showScreen('game');
    renderGameView();
}

// Handle save round (from modal)
function handleSaveRound() {
    handleSaveHand();
    hideModal('save-modal');
}

// Handle discard round
function handleDiscardRound() {
    hideModal('save-modal');
    currentRoundDraft = null;
    editingRoundId = null;
    currentHandMode = null;
    showScreen('game');
}

// Update language (Arabic/RTL support)
function updateLanguage() {
    const html = document.documentElement;
    if (isArabic) {
        html.setAttribute('dir', 'rtl');
        html.setAttribute('lang', 'ar');
    } else {
        html.setAttribute('dir', 'ltr');
        html.setAttribute('lang', 'en');
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
