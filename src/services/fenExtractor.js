/**
 * FEN Position Extractor Service
 * Extracts FEN positions for every move of every game using chess.js
 */

import { Chess } from 'chess.js';

class FenExtractorService {
  constructor() {
    this.startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    
    // Test chess.js import
    try {
      const testChess = new Chess();
      console.log(`✅ [FEN EXTRACTOR] Chess.js imported successfully`);
      console.log(`🔧 [DEBUG] Starting FEN:`, testChess.fen());
    } catch (error) {
      console.error(`❌ [FEN EXTRACTOR] Chess.js import failed:`, error);
    }
  }

  /**
   * Extract FEN positions from all games
   */
  async extractAllFenPositions(games) {
    console.log(`🎯 [FEN EXTRACTOR] Starting FEN extraction for ${games.length} games`);
    console.log(`🔧 [DEBUG] Chess.js import status:`, typeof Chess);
    console.log(`${'='.repeat(80)}`);

    const allFenData = [];

    for (let gameIndex = 0; gameIndex < games.length; gameIndex++) {
      const game = games[gameIndex];
      console.log(`\n📋 [GAME ${gameIndex + 1}/${games.length}] Processing game...`);
      console.log(`🔧 [DEBUG] Game object:`, {
        hasWhite: !!game.white,
        hasBlack: !!game.black,
        hasResult: !!game.result,
        hasPgn: !!game.pgn,
        pgnLength: game.pgn ? game.pgn.length : 0,
        pgnPreview: game.pgn ? game.pgn.substring(0, 200) + '...' : 'No PGN'
      });
      
      try {
        const gameFenData = await this.extractGameFenPositions(game, gameIndex + 1);
        allFenData.push(gameFenData);
        
        console.log(`✅ [GAME ${gameIndex + 1}] Extracted ${gameFenData.positions.length} FEN positions`);
      } catch (error) {
        console.error(`❌ [GAME ${gameIndex + 1}] Failed to extract FEN positions:`, error);
        console.error(`❌ [GAME ${gameIndex + 1}] Error stack:`, error.stack);
        // Continue with other games even if one fails
      }
    }

    console.log(`\n🎯 [FEN EXTRACTOR] Completed! Total games processed: ${allFenData.length}`);
    console.log(`${'='.repeat(80)}`);

    return allFenData;
  }

  /**
   * Extract FEN positions from a single game using chess.js
   */
  async extractGameFenPositions(game, gameNumber) {
    console.log(`\n🔍 [GAME ${gameNumber}] Analyzing PGN...`);
    
    if (!game.pgn) {
      throw new Error('No PGN data available');
    }

    try {
      console.log(`🔧 [DEBUG] Creating Chess instance...`);
      // Create a new chess instance
      const chess = new Chess();
      console.log(`🔧 [DEBUG] Chess instance created successfully`);
      
      console.log(`🔧 [DEBUG] Loading PGN...`);
      console.log(`🔧 [DEBUG] PGN content (first 500 chars):`, game.pgn.substring(0, 500));
      
      // Try to clean and load the PGN
      let loaded = false;
      let cleanedPgn = game.pgn;
      
      // First attempt: Load PGN as-is
      try {
        loaded = chess.loadPgn(game.pgn);
        console.log(`🔧 [DEBUG] PGN loaded directly:`, loaded);
      } catch (error) {
        console.log(`🔧 [DEBUG] Direct PGN load failed:`, error.message);
      }
      
      // Second attempt: Clean the PGN and try again
      if (!loaded) {
        try {
          cleanedPgn = this.cleanPgn(game.pgn);
          console.log(`🔧 [DEBUG] Cleaned PGN (first 300 chars):`, cleanedPgn.substring(0, 300));
          loaded = chess.loadPgn(cleanedPgn);
          console.log(`🔧 [DEBUG] Cleaned PGN loaded:`, loaded);
        } catch (error) {
          console.log(`🔧 [DEBUG] Cleaned PGN load failed:`, error.message);
        }
      }
      
      // Third attempt: Extract moves manually and replay them
      if (!loaded) {
        console.log(`🔧 [DEBUG] Attempting manual move extraction...`);
        return await this.extractFenFromMovesManually(game, gameNumber);
      }

      // Get the game history
      const history = chess.history({ verbose: true });
      console.log(`📝 [GAME ${gameNumber}] Found ${history.length} moves`);

      // Reset to starting position to replay moves
      chess.reset();
      
      // Generate FEN positions for each move
      const positions = [];
      
      // Add starting position
      positions.push({
        moveNumber: 0,
        move: 'Starting position',
        fen: chess.fen(),
        side: 'w',
        san: 'Starting position'
      });

      console.log(`\n🏁 [GAME ${gameNumber}] Starting position:`);
      console.log(`   FEN: ${chess.fen()}`);

      // Process each move
      for (let i = 0; i < history.length; i++) {
        try {
          const moveObj = history[i];
          const moveNumber = Math.floor(i / 2) + 1;
          const side = i % 2 === 0 ? 'w' : 'b';
          
          // Make the move
          chess.move(moveObj.san);
          
          // Get the resulting FEN
          const fen = chess.fen();
          
          positions.push({
            moveNumber: moveNumber,
            move: moveObj.san,
            fen: fen,
            side: side,
            san: moveObj.san,
            from: moveObj.from,
            to: moveObj.to,
            piece: moveObj.piece,
            captured: moveObj.captured || null,
            promotion: moveObj.promotion || null,
            flags: moveObj.flags
          });

          console.log(`\n♟️  [GAME ${gameNumber}] Move ${moveNumber}${side === 'w' ? '.' : '...'} ${moveObj.san}`);
          console.log(`   From: ${moveObj.from} → To: ${moveObj.to}`);
          console.log(`   Piece: ${moveObj.piece}${moveObj.captured ? ` captures ${moveObj.captured}` : ''}`);
          console.log(`   FEN: ${fen}`);

        } catch (error) {
          console.error(`❌ [GAME ${gameNumber}] Error processing move ${i + 1} (${history[i].san}):`, error.message);
          // Continue with next move
        }
      }

      return {
        gameNumber: gameNumber,
        gameInfo: {
          white: game.white || 'Unknown',
          black: game.black || 'Unknown',
          result: game.result || '*',
          date: game.date || 'Unknown'
        },
        totalMoves: history.length,
        positions: positions
      };

    } catch (error) {
      console.error(`❌ [GAME ${gameNumber}] Failed to process PGN:`, error.message);
      throw error;
    }
  }

  /**
   * Clean PGN by removing problematic elements
   */
  cleanPgn(pgn) {
    console.log(`🧹 [DEBUG] Cleaning PGN...`);
    
    // Remove headers but keep essential ones
    let cleaned = pgn;
    
    // Remove comments in braces
    cleaned = cleaned.replace(/\{[^}]*\}/g, '');
    
    // Remove comments in parentheses
    cleaned = cleaned.replace(/\([^)]*\)/g, '');
    
    // Remove annotations like !?, ?!, !!, ??, etc.
    cleaned = cleaned.replace(/[!?]+/g, '');
    
    // Remove time stamps like [%clk 0:09:52]
    cleaned = cleaned.replace(/\[%clk[^\]]*\]/g, '');
    
    // Remove evaluation annotations like [%eval 0.12]
    cleaned = cleaned.replace(/\[%eval[^\]]*\]/g, '');
    
    // Clean up extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    console.log(`🧹 [DEBUG] PGN cleaned`);
    return cleaned;
  }

  /**
   * Extract FEN positions by manually parsing moves
   */
  async extractFenFromMovesManually(game, gameNumber) {
    console.log(`🔧 [DEBUG] Manual move extraction for game ${gameNumber}`);
    
    try {
      // Extract moves from PGN manually
      const moves = this.extractMovesFromPgn(game.pgn);
      console.log(`🔧 [DEBUG] Extracted ${moves.length} moves manually:`, moves.slice(0, 10));
      
      if (moves.length === 0) {
        throw new Error('No moves found in PGN');
      }
      
      // Create new chess instance and replay moves
      const chess = new Chess();
      const positions = [];
      
      // Add starting position
      positions.push({
        moveNumber: 0,
        move: 'Starting position',
        fen: chess.fen(),
        side: 'w',
        san: 'Starting position'
      });

      console.log(`\n🏁 [GAME ${gameNumber}] Starting position:`);
      console.log(`   FEN: ${chess.fen()}`);
      
      // Process each move
      for (let i = 0; i < moves.length; i++) {
        try {
          const moveStr = moves[i];
          const moveNumber = Math.floor(i / 2) + 1;
          const side = i % 2 === 0 ? 'w' : 'b';
          
          // Try to make the move
          const moveObj = chess.move(moveStr);
          
          if (!moveObj) {
            console.error(`❌ [GAME ${gameNumber}] Invalid move: ${moveStr} at position ${i + 1}`);
            continue;
          }
          
          // Get the resulting FEN
          const fen = chess.fen();
          
          positions.push({
            moveNumber: moveNumber,
            move: moveObj.san,
            fen: fen,
            side: side,
            san: moveObj.san,
            from: moveObj.from,
            to: moveObj.to,
            piece: moveObj.piece,
            captured: moveObj.captured || null,
            promotion: moveObj.promotion || null,
            flags: moveObj.flags
          });

          console.log(`\n♟️  [GAME ${gameNumber}] Move ${moveNumber}${side === 'w' ? '.' : '...'} ${moveObj.san}`);
          console.log(`   From: ${moveObj.from} → To: ${moveObj.to}`);
          console.log(`   Piece: ${moveObj.piece}${moveObj.captured ? ` captures ${moveObj.captured}` : ''}`);
          console.log(`   FEN: ${fen}`);

        } catch (error) {
          console.error(`❌ [GAME ${gameNumber}] Error processing move ${i + 1} (${moves[i]}):`, error.message);
          // Continue with next move
        }
      }

      return {
        gameNumber: gameNumber,
        gameInfo: {
          white: game.white || 'Unknown',
          black: game.black || 'Unknown',
          result: game.result || '*',
          date: game.date || 'Unknown'
        },
        totalMoves: moves.length,
        positions: positions
      };

    } catch (error) {
      console.error(`❌ [GAME ${gameNumber}] Manual extraction failed:`, error);
      throw error;
    }
  }

  /**
   * Extract moves from PGN string manually
   */
  extractMovesFromPgn(pgn) {
    console.log(`📖 [DEBUG] Extracting moves from PGN manually...`);
    
    // Find the moves section (after all headers)
    const lines = pgn.split('\n');
    let movesSection = '';
    let inMoves = false;
    
    for (const line of lines) {
      if (line.trim().startsWith('[')) {
        inMoves = false; // We're in headers
      } else if (line.trim().length > 0 && !inMoves) {
        inMoves = true; // First non-header line starts moves
        movesSection += line + ' ';
      } else if (inMoves) {
        movesSection += line + ' ';
      }
    }
    
    console.log(`📖 [DEBUG] Moves section:`, movesSection.substring(0, 200) + '...');
    
    // Clean the moves section
    let cleanMoves = movesSection;
    
    // Remove comments in braces and parentheses
    cleanMoves = cleanMoves.replace(/\{[^}]*\}/g, '');
    cleanMoves = cleanMoves.replace(/\([^)]*\)/g, '');
    
    // Remove annotations
    cleanMoves = cleanMoves.replace(/[!?]+/g, '');
    
    // Remove result
    cleanMoves = cleanMoves.replace(/\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/, '');
    
    // Split into tokens
    const tokens = cleanMoves.trim().split(/\s+/).filter(token => token.length > 0);
    
    // Extract only the moves (remove move numbers)
    const moves = [];
    for (const token of tokens) {
      // Skip move numbers (like "1.", "2.", etc.)
      if (!/^\d+\.+$/.test(token) && token !== '') {
        moves.push(token);
      }
    }
    
    console.log(`📖 [DEBUG] Extracted ${moves.length} moves:`, moves.slice(0, 20));
    return moves;
  }

  /**
   * Display summary of extracted FEN data
   */
  displayFenSummary(allFenData) {
    console.log(`\n📊 [FEN SUMMARY] Extraction Complete!`);
    console.log(`${'='.repeat(60)}`);
    
    let totalPositions = 0;
    
    for (const gameData of allFenData) {
      console.log(`\n🎮 Game ${gameData.gameNumber}: ${gameData.gameInfo.white} vs ${gameData.gameInfo.black}`);
      console.log(`   📅 Date: ${gameData.gameInfo.date}`);
      console.log(`   🏆 Result: ${gameData.gameInfo.result}`);
      console.log(`   📍 Positions: ${gameData.positions.length}`);
      console.log(`   🎯 Total Moves: ${gameData.totalMoves}`);
      
      totalPositions += gameData.positions.length;
    }
    
    console.log(`\n🎯 TOTAL STATISTICS:`);
    console.log(`   📋 Games Processed: ${allFenData.length}`);
    console.log(`   📍 Total Positions: ${totalPositions}`);
    console.log(`   📊 Average Positions per Game: ${(totalPositions / allFenData.length).toFixed(1)}`);
    console.log(`${'='.repeat(60)}`);
  }
}

export const fenExtractorService = new FenExtractorService();