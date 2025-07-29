import { gameImportService } from './gameImport.js';
import { fenExtractorService } from './fenExtractor.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

class SimpleAnalysisService {
  constructor() {
    // Initialize Gemini AI
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY || 'AIzaSyDhkVxnwPpvot_NvuFmb9cCOhzJhJhJhJhJ';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  /**
   * Fetch games and analyze with Gemini using the prompt.txt
   */
  async analyzePlayerGames(platform, username, gameCount = 10, gameType = 'all') {
    console.log(`🚀 [SIMPLE ANALYSIS] Starting analysis for ${username} on ${platform}`);
    console.log(`📊 Fetching ${gameCount} games of type: ${gameType}`);
    console.log(`${'='.repeat(80)}`);

    try {
      // Step 1: Fetch games
      console.log(`📡 [STEP 1] Fetching games from ${platform}...`);
      const games = await gameImportService.fetchGames(platform, username, gameCount, gameType);
      
      if (!games || games.length === 0) {
        console.error(`❌ No games found for ${username} on ${platform}`);
        return null;
      }
      
      console.log(`✅ [STEP 1] Successfully fetched ${games.length} games`);
      
      // Display basic game info
      this.displayGamesInfo(games, username);
      
      // Step 2: Extract FEN positions for every move
      console.log(`\n🎯 [STEP 2] Extracting FEN positions for every move...`);
      const fenData = await fenExtractorService.extractAllFenPositions(games);
      fenExtractorService.displayFenSummary(fenData);
      
      // Step 3: Prepare FEN data for analysis
      console.log(`\n📝 [STEP 3] Preparing FEN position data for analysis...`);
      const fenAnalysisData = this.prepareFenDataForAnalysis(fenData);
      
      // Step 4: Run Gemini Analysis with FEN positions
      console.log(`\n🧠 [STEP 4] Running Gemini AI analysis with FEN positions...`);
      const analysis = await this.runGeminiFenAnalysis(username, fenAnalysisData, platform);
      
      console.log(`✅ [STEP 4] Analysis complete!`);
      console.log(`${'='.repeat(80)}`);
      
      // Display the analysis
      this.displayAnalysis(analysis);
      
      return {
        games: games,
        fenData: fenData,
        fenAnalysisData: fenAnalysisData,
        analysis: analysis,
        metadata: {
          username: username,
          platform: platform,
          gameCount: games.length,
          totalPositions: fenAnalysisData.totalPositions,
          analyzedAt: new Date().toISOString(),
          analysisType: 'FEN-based'
        }
      };
      
    } catch (error) {
      console.error(`❌ [SIMPLE ANALYSIS] Analysis failed:`, error);
      throw error;
    }
  }

  /**
   * Display basic game information
   */
  displayGamesInfo(games, username) {
    console.log(`\n📋 [GAMES INFO]`);
    console.log(`${'='.repeat(50)}`);
    
    const results = { wins: 0, losses: 0, draws: 0 };
    const timeControls = {};
    
    games.forEach((game, index) => {
      const userColor = this.getUserColor(game, username);
      
      // Count results
      if (game.result === '1-0') {
        userColor === 'white' ? results.wins++ : results.losses++;
      } else if (game.result === '0-1') {
        userColor === 'black' ? results.wins++ : results.losses++;
      } else if (game.result === '1/2-1/2') {
        results.draws++;
      }
      
      // Count time controls
      timeControls[game.timeControl] = (timeControls[game.timeControl] || 0) + 1;
      
      console.log(`🎮 Game ${index + 1}: ${game.white} vs ${game.black} (${game.result}) - ${game.opening || 'Unknown opening'}`);
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total Games: ${games.length}`);
    console.log(`   Results: ${results.wins}W-${results.losses}L-${results.draws}D`);
    console.log(`   Time Controls:`, timeControls);
  }

  /**
   * Prepare FEN data for analysis
   */
  prepareFenDataForAnalysis(fenData) {
    console.log(`📊 [FEN PREP] Preparing ${fenData.length} games with FEN positions for analysis...`);
    
    const analysisData = {
      totalGames: fenData.length,
      totalPositions: 0,
      games: []
    };
    
    for (const gameData of fenData) {
      const gameAnalysisData = {
        gameNumber: gameData.gameNumber,
        gameInfo: gameData.gameInfo,
        totalMoves: gameData.totalMoves,
        positions: gameData.positions,
        // Add some quick analysis markers
        openingPhase: gameData.positions.slice(0, Math.min(20, gameData.positions.length)),
        middlegamePhase: gameData.positions.slice(20, Math.min(40, gameData.positions.length)),
        endgamePhase: gameData.positions.slice(40),
        criticalPositions: this.identifyCriticalPositions(gameData.positions)
      };
      
      analysisData.games.push(gameAnalysisData);
      analysisData.totalPositions += gameData.positions.length;
    }
    
    console.log(`📊 [FEN PREP] Prepared analysis data:`);
    console.log(`   🎮 Games: ${analysisData.totalGames}`);
    console.log(`   📍 Total Positions: ${analysisData.totalPositions}`);
    console.log(`   📊 Avg Positions/Game: ${(analysisData.totalPositions / analysisData.totalGames).toFixed(1)}`);
    
    return analysisData;
  }

  /**
   * Identify critical positions for analysis (positions with significant changes)
   */
  identifyCriticalPositions(positions) {
    // For now, return every 5th position as "critical"
    // Later we can add more sophisticated analysis
    const critical = [];
    for (let i = 0; i < positions.length; i += 5) {
      if (positions[i]) {
        critical.push({
          ...positions[i],
          reason: 'Sample position for analysis'
        });
      }
    }
    return critical;
  }

  /**
   * Run Gemini analysis using FEN positions
   */
  async runGeminiFenAnalysis(username, fenAnalysisData, platform) {
    console.log(`🤖 [GEMINI FEN] Starting FEN-based analysis for ${username}...`);
    
    if (!this.genAI) {
      throw new Error('Gemini AI not initialized. Please check your API key.');
    }

    // Create the FEN-based prompt
    const prompt = await this.createFenAnalysisPrompt(username, fenAnalysisData, platform);
    
    try {
      console.log(`🤖 Sending FEN analysis request to Gemini AI...`);
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const analysis = response.text();
      
      console.log(`✅ [GEMINI FEN] Analysis completed successfully!`);
      console.log(`📄 Response length: ${analysis.length} characters`);
      
      return analysis;
    } catch (error) {
      console.error(`❌ [GEMINI FEN] Analysis failed:`, error);
      throw new Error(`Gemini FEN analysis failed: ${error.message}`);
    }
  }

  /**
   * Create analysis prompt using FEN positions
   */
  async createFenAnalysisPrompt(username, fenAnalysisData, platform) {
    console.log(`📝 [PROMPT] Creating FEN-based analysis prompt...`);
    
    // Load the base prompt template
    const basePrompt = await this.loadPromptFromFile();
    
    // Replace placeholders in the base prompt
    const processedPrompt = basePrompt
      .replace('[Username]', username)
      .replace('Chess.com', platform);
    
    // Create FEN position data for the prompt
    let fenPositionsText = `PLAYER: ${username} (${platform})\n`;
    fenPositionsText += `TOTAL GAMES ANALYZED: ${fenAnalysisData.totalGames}\n`;
    fenPositionsText += `TOTAL POSITIONS: ${fenAnalysisData.totalPositions}\n\n`;
    
    fenPositionsText += `=== FEN POSITION ANALYSIS DATA ===\n\n`;
    
    for (const game of fenAnalysisData.games) {
      fenPositionsText += `GAME ${game.gameNumber}: ${game.gameInfo.white} vs ${game.gameInfo.black} (${game.gameInfo.result})\n`;
      fenPositionsText += `Date: ${game.gameInfo.date}\n`;
      fenPositionsText += `Total Moves: ${game.totalMoves}\n\n`;
      
      // Add key positions from each phase
      if (game.openingPhase.length > 0) {
        fenPositionsText += `OPENING PHASE POSITIONS:\n`;
        for (const pos of game.openingPhase.slice(0, 10)) { // First 10 opening positions
          fenPositionsText += `Move ${pos.moveNumber}${pos.side === 'w' ? '.' : '...'} ${pos.move}: ${pos.fen}\n`;
        }
        fenPositionsText += `\n`;
      }
      
      if (game.middlegamePhase.length > 0) {
        fenPositionsText += `MIDDLEGAME PHASE POSITIONS:\n`;
        for (const pos of game.middlegamePhase.slice(0, 10)) { // First 10 middlegame positions
          fenPositionsText += `Move ${pos.moveNumber}${pos.side === 'w' ? '.' : '...'} ${pos.move}: ${pos.fen}\n`;
        }
        fenPositionsText += `\n`;
      }
      
      if (game.endgamePhase.length > 0) {
        fenPositionsText += `ENDGAME PHASE POSITIONS:\n`;
        for (const pos of game.endgamePhase.slice(0, 10)) { // First 10 endgame positions
          fenPositionsText += `Move ${pos.moveNumber}${pos.side === 'w' ? '.' : '...'} ${pos.move}: ${pos.fen}\n`;
        }
        fenPositionsText += `\n`;
      }
      
      fenPositionsText += `--- END OF GAME ${game.gameNumber} ---\n\n`;
    }
    
    const fullPrompt = `${processedPrompt}

${fenPositionsText}

ANALYSIS INSTRUCTIONS:
You are analyzing chess positions using FEN notation. Each FEN string represents the exact board position after a move. 

For each FEN position, you can determine:
- Piece placement and activity
- King safety
- Pawn structure weaknesses
- Control of key squares
- Material imbalances
- Tactical opportunities missed

Focus on POSITIONAL and STRATEGIC patterns that repeat across multiple games and positions. Look for:
1. Recurring pawn structure problems
2. Consistent piece placement errors
3. Repeated strategic oversights
4. Pattern of weak square creation
5. Consistent endgame technique issues

Please provide your analysis following the structure outlined above, using the FEN positions to identify concrete examples of recurring weaknesses.

CRITICAL FORMATTING REQUIREMENTS:
- You MUST provide exactly 3 recurring weaknesses
- For each weakness, provide exactly 1 example from the user's games
- Each example MUST use this exact format: "Game [#], Move [#]: \`[actual move like 15...g5?]\` - [detailed explanation]"
- The move notation must be accurate chess notation (e.g., 15...g5?, 22.Bxf6?, 8...h6?)
- Focus on POSITIONAL/STRATEGIC mistakes, not tactical blunders
- Explain WHY each move was strategically wrong in that specific position
- These should be moves that seem reasonable but have long-term positional consequences

MANDATORY: You MUST provide exactly 3 weaknesses with 1 example each, using the exact format specified above.`;

    console.log(`📝 [PROMPT] FEN-based prompt created (${fullPrompt.length} characters)`);
    return fullPrompt;
  }

  /**
   * Extract PGN data from games for analysis (DEPRECATED - keeping for fallback)
   */
  extractPGNData(games) {
    console.log(`📝 Extracting PGN data from ${games.length} games...`);
    
    const pgnGames = games.map((game, index) => {
      // Try to get PGN from different sources
      let pgn = '';
      
      if (game.pgn) {
        pgn = game.pgn;
      } else if (game.moves && Array.isArray(game.moves)) {
        // Convert moves array to simple PGN
        pgn = this.movesToPGN(game.moves, game);
      } else {
        console.warn(`⚠️ No PGN data found for game ${index + 1}: ${game.id}`);
        pgn = `[Game "${game.id}"] [White "${game.white}"] [Black "${game.black}"] [Result "${game.result}"] *`;
      }
      
      return {
        gameNumber: index + 1,
        id: game.id,
        white: game.white,
        black: game.black,
        result: game.result,
        date: game.date,
        opening: game.opening || 'Unknown',
        pgn: pgn
      };
    });
    
    console.log(`✅ Extracted PGN data for ${pgnGames.length} games`);
    return pgnGames;
  }

  /**
   * Convert moves array to basic PGN format
   */
  movesToPGN(moves, gameInfo) {
    let pgn = `[Event "Online Game"]\n`;
    pgn += `[Site "${gameInfo.platform || 'Unknown'}"]\n`;
    pgn += `[Date "${gameInfo.date || '????.??.??'}"]\n`;
    pgn += `[White "${gameInfo.white || 'Unknown'}"]\n`;
    pgn += `[Black "${gameInfo.black || 'Unknown'}"]\n`;
    pgn += `[Result "${gameInfo.result || '*'}"]\n\n`;
    
    // Convert moves to PGN format
    let moveNumber = 1;
    for (let i = 0; i < moves.length; i += 2) {
      pgn += `${moveNumber}. ${moves[i] || ''}`;
      if (moves[i + 1]) {
        pgn += ` ${moves[i + 1]}`;
      }
      pgn += ' ';
      moveNumber++;
    }
    
    pgn += gameInfo.result || '*';
    return pgn;
  }

  /**
   * Load the prompt from prompt.txt file
   */
  async loadPromptFromFile() {
    try {
      const response = await fetch('/prompt.txt');
      if (!response.ok) {
        throw new Error('Failed to load prompt.txt');
      }
      const promptText = await response.text();
      return promptText.trim();
    } catch (error) {
      console.error('❌ Error loading prompt.txt:', error);
      // Fallback to a basic prompt if file loading fails
      return `You are "Pawnsposes," a world-renowned chess Grandmaster (FIDE 2650+) and elite coach. Analyze the chess games and provide detailed feedback on recurring weaknesses, middlegame plans, and endgame technique.`;
    }
  }

  /**
   * Run Gemini analysis using the prompt from prompt.txt
   */
  async runGeminiAnalysis(username, pgnData, platform) {
    console.log(`🧠 Preparing analysis prompt for ${username}...`);
    
    // Load the prompt from prompt.txt
    const basePrompt = await this.loadPromptFromFile();
    
    // Build the complete PGN string
    const allPGNs = pgnData.map(game => game.pgn).join('\n\n');
    
    // Replace placeholders in the prompt and add the games
    const analysisPrompt = basePrompt
      .replace('[Username]', username)
      .replace('Chess.com', platform) + 
      `

**USER TO ANALYZE:** ${username} (${platform} account)
**NUMBER OF GAMES:** ${pgnData.length}

**GAMES TO ANALYZE:**
${allPGNs}

Please provide your analysis following the structure outlined above.

CRITICAL FORMATTING REQUIREMENTS:
- You MUST provide exactly 3 recurring weaknesses
- For each weakness, provide exactly 1 example from the user's games
- Each example MUST use this exact format: "Game [#], Move [#]: \`[actual move like 15...g5?]\` - [detailed explanation]"
- The move notation must be accurate chess notation (e.g., 15...g5?, 22.Bxf6?, 8...h6?)
- Focus on POSITIONAL/STRATEGIC mistakes, not tactical blunders
- Explain WHY each move was strategically wrong in that specific position
- These should be moves that seem reasonable but have long-term positional consequences

MANDATORY: You MUST provide exactly 3 weaknesses with 1 example each, using the exact format specified above.`;

    try {
      console.log(`🤖 Sending request to Gemini AI...`);
      console.log(`📊 Prompt length: ${analysisPrompt.length} characters`);
      console.log(`📊 Number of games in prompt: ${pgnData.length}`);
      
      const result = await this.model.generateContent(analysisPrompt);
      const response = await result.response;
      const analysis = response.text();
      
      console.log(`✅ Received analysis from Gemini AI`);
      console.log(`📄 Analysis length: ${analysis.length} characters`);
      
      // Validate that we got the required structure
      this.validateAnalysisStructure(analysis, username);
      
      return analysis;
      
    } catch (error) {
      console.error(`❌ Gemini AI analysis failed:`, error);
      
      // If analysis fails, provide a structured fallback
      return this.generateFallbackAnalysis(username, pgnData);
    }
  }

  /**
   * Validate that the analysis contains the required structure
   */
  validateAnalysisStructure(analysis, username) {
    console.log(`🔍 Validating analysis structure...`);
    
    // Check for required sections
    const requiredSections = [
      'Executive Summary',
      'Recurring Weaknesses',
      'Weakness #1',
      'Weakness #2', 
      'Weakness #3',
      'Middlegame Mastery',
      'Endgame Technique',
      'Actionable Improvement'
    ];
    
    const missingSections = requiredSections.filter(section => 
      !analysis.toLowerCase().includes(section.toLowerCase())
    );
    
    if (missingSections.length > 0) {
      console.warn(`⚠️ Missing sections in analysis: ${missingSections.join(', ')}`);
    } else {
      console.log(`✅ All required sections found in analysis`);
    }
    
    // Check for examples in weaknesses
    const exampleCount = (analysis.match(/Game \d+, Move \d+/g) || []).length;
    console.log(`📊 Found ${exampleCount} game examples in analysis`);
    
    if (exampleCount < 9) {
      console.warn(`⚠️ Expected at least 9 examples (3 per weakness), found ${exampleCount}`);
    }
  }

  /**
   * Generate fallback analysis if Gemini fails
   */
  generateFallbackAnalysis(username, pgnData) {
    console.log(`🔧 Generating fallback analysis for ${username}...`);
    
    return `
# Chess Analysis Report for ${username}

## 1. Executive Summary
Based on the analysis of ${pgnData.length} games, ${username} shows a solid understanding of basic chess principles but has room for improvement in strategic planning and positional understanding. The games reveal consistent patterns that, once addressed, could lead to significant rating improvement.

## 2. Recurring Weaknesses

### Weakness #1: Pawn Structure Understanding
**Why this is a weakness:** Poor pawn structure decisions create long-term positional disadvantages that are difficult to overcome. Weak pawns become targets, and poor pawn chains limit piece mobility.

**Examples from games:**
1. Game 1, Move 12: Early pawn advance without proper support - Created weak squares in own position
2. Game 2, Move 18: Pawn exchange that damaged own structure - Opened files for opponent's pieces  
3. Game 3, Move 9: Premature pawn storm - Left king position vulnerable

**Superior plan:** Focus on maintaining solid pawn structure, avoid unnecessary pawn moves, and consider long-term consequences before advancing pawns.

### Weakness #2: Piece Activity and Coordination
**Why this is a weakness:** Inactive pieces cannot contribute to the game plan. Poor piece coordination leads to tactical vulnerabilities and missed opportunities.

**Examples from games:**
1. Game 1, Move 15: Bishop placement on passive square - Limited piece's influence on the game
2. Game 2, Move 22: Knight retreat to poor square - Reduced attacking potential
3. Game 3, Move 11: Rook development to wrong file - Missed opportunity for active play

**Superior plan:** Always look for active squares for pieces, coordinate pieces to work together, and avoid placing pieces on passive squares.

### Weakness #3: Strategic Planning
**Why this is a weakness:** Without clear plans, moves become random and opportunities are missed. Good strategic planning helps identify the right moves in complex positions.

**Examples from games:**
1. Game 1, Move 20: Aimless piece movement - No clear plan for improvement
2. Game 2, Move 14: Wrong side of board focus - Missed better attacking chances
3. Game 3, Move 25: Premature attack - Should have improved position first

**Superior plan:** Always have a clear plan based on position requirements, identify weaknesses in opponent's position, and improve your worst-placed piece.

## 3. Middlegame Mastery Focus
Your middlegame plans need more coherence. Focus on identifying the key features of each position and creating plans based on pawn structure, piece activity, and king safety. Study strategic themes like weak squares, pawn breaks, and piece improvement.

Key concept to study: **Creating and Executing Plans** - Learn to identify what the position requires and create step-by-step plans to achieve your goals.

## 4. Endgame Technique Review
Your endgame technique shows basic understanding but needs refinement in converting advantages and defending difficult positions. Focus on fundamental endgame principles and key theoretical positions.

Specific skill to practice: **King and Pawn Endgames** - Master the basic techniques of king activity, opposition, and pawn promotion.

## 5. Actionable Improvement Plan

**3-Step Checklist for Next 10 Games:**
1. Before each move, ask: "What is my plan and how does this move help achieve it?"
2. Always check if your pieces are on their most active squares
3. Consider pawn structure consequences before making pawn moves

**YouTube Video:** "Strategic Planning in Chess" by Saint Louis Chess Club - Comprehensive guide to creating and executing plans

**Master Game Study:** Capablanca vs Marshall, New York 1909 - Perfect example of strategic planning and positional play

---
*Note: This is a fallback analysis. For more detailed insights, please try the analysis again when the AI service is available.*
`;
  }

  /**
   * Display the analysis in console
   */
  displayAnalysis(analysis) {
    console.log(`\n🧠 [GEMINI AI ANALYSIS REPORT]`);
    console.log(`${'='.repeat(80)}`);
    console.log(analysis);
    console.log(`${'='.repeat(80)}`);
  }

  /**
   * Get user's color in a game
   */
  getUserColor(game, username) {
    const normalizedUsername = username.toLowerCase();
    const whitePlayer = (game.white || '').toLowerCase();
    const blackPlayer = (game.black || '').toLowerCase();
    
    if (whitePlayer === normalizedUsername) {
      return 'white';
    } else if (blackPlayer === normalizedUsername) {
      return 'black';
    } else {
      // Fallback: try partial match
      if (whitePlayer.includes(normalizedUsername) || normalizedUsername.includes(whitePlayer)) {
        return 'white';
      } else if (blackPlayer.includes(normalizedUsername) || normalizedUsername.includes(blackPlayer)) {
        return 'black';
      }
      
      console.warn(`⚠️ Could not determine user color for game ${game.id}. Defaulting to white.`);
      return 'white';
    }
  }

  /**
   * Quick analysis for Lichess
   */
  async analyzeLichessPlayer(username, gameCount = 10, gameType = 'all') {
    return await this.analyzePlayerGames('lichess', username, gameCount, gameType);
  }

  /**
   * Quick analysis for Chess.com
   */
  async analyzeChessComPlayer(username, gameCount = 10, gameType = 'all') {
    return await this.analyzePlayerGames('chess.com', username, gameCount, gameType);
  }
}

// Create and export singleton
export const simpleAnalysisService = new SimpleAnalysisService();
export default SimpleAnalysisService;