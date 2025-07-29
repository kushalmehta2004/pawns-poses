import { Chess } from 'chess.js';

// Simple error class for game import errors
class GameImportError extends Error {
  constructor(message, code = 'GAME_IMPORT_ERROR', originalError = null) {
    super(message);
    this.name = 'GameImportError';
    this.code = code;
    this.originalError = originalError;
  }
}

const LICHESS_API_BASE = 'https://lichess.org/api';
const CHESS_COM_API_BASE = 'https://api.chess.com/pub';

class GameImportService {
  parseTime(timeControl) {
    // Convert time control to readable format
    const match = timeControl.match(/(\d+)\+(\d+)/);
    if (match) {
      return `${match[1]}+${match[2]}`;
    }
    return timeControl;
  }

  parsePGNToFENPositions(pgn) {
    const positions = [];
    
    try {
      const chess = new Chess();
      
      // Add starting position
      positions.push({
        moveNumber: 0,
        halfMove: 0,
        fen: chess.fen(),
        move: null,
        san: null,
        from: null,
        to: null,
        piece: null,
        captured: null,
        playerToMove: 'white'
      });

      // Remove PGN headers and comments
      let cleanPgn = pgn.replace(/\[.*?\]/g, '').replace(/\{[^}]*\}/g, '').replace(/\([^)]*\)/g, '');
      
      // Remove result indicators
      cleanPgn = cleanPgn.replace(/\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/, '');
      
      // Remove extra whitespace and line breaks
      cleanPgn = cleanPgn.replace(/\s+/g, ' ').trim();
      
      // Extract moves using regex
      const movePattern = /\d+\.+\s*([^0-9]+?)(?=\d+\.|$)/g;
      let match;
      let halfMoveCount = 0;
      
      while ((match = movePattern.exec(cleanPgn)) !== null) {
        const moveText = match[1].trim();
        
        // Split white and black moves
        const movePair = moveText.split(/\s+/).filter(move => move.length > 0);
        
        movePair.forEach(move => {
          // Clean individual moves
          let cleanMove = move.trim();
          
          // Skip if it's a result or empty
          if (!cleanMove || cleanMove.match(/^(1-0|0-1|1\/2-1\/2|\*)$/)) {
            return;
          }
          
          // Remove move annotations but keep the basic move
          cleanMove = cleanMove.replace(/[?!]+$/g, '');
          cleanMove = cleanMove.replace(/\$\d+/g, '');
          
          try {
            // Try to play the move and get the resulting position
            const currentPlayer = chess.turn() === 'w' ? 'white' : 'black';
            let moveResult = null;
            
            // Try different move formats
            const moveAttempts = [
              cleanMove,
              cleanMove.replace(/[+#]/g, ''), // Remove check/checkmate indicators
            ];
            
            for (const attemptMove of moveAttempts) {
              try {
                moveResult = chess.move(attemptMove);
                if (moveResult) {
                  cleanMove = attemptMove;
                  break;
                }
              } catch (e) {
                continue;
              }
            }
            
            // Try with sloppy mode if normal attempts failed
            if (!moveResult) {
              try {
                moveResult = chess.move(cleanMove, { sloppy: true });
              } catch (e) {
                console.warn(`Could not process move: ${cleanMove}`);
                return;
              }
            }
            
            if (moveResult) {
              halfMoveCount++;
              positions.push({
                moveNumber: Math.floor(halfMoveCount / 2) + 1,
                halfMove: halfMoveCount,
                fen: chess.fen(),
                move: cleanMove,
                san: moveResult.san,
                from: moveResult.from,
                to: moveResult.to,
                piece: moveResult.piece,
                captured: moveResult.captured || null,
                playerToMove: currentPlayer
              });
            }
          } catch (moveError) {
            console.warn(`Error processing move ${cleanMove}:`, moveError);
          }
        });
      }
      
    } catch (error) {
      console.error('Error parsing PGN to FEN positions:', error);
    }
    
    return positions;
  }

  parseLichessGames(pgnGames) {
    return pgnGames.map((pgn, index) => {
      try {
        const headerRegex = /\[(\w+)\s+"([^"]+)"\]/g;
        const headers = {};
        let match;
        
        while ((match = headerRegex.exec(pgn)) !== null) {
          headers[match[1]] = match[2];
        }

        // Store the raw PGN for analysis
        
        return {
          id: headers.Site ? headers.Site.split('/').pop() : `lichess_${Date.now()}_${index}`,
          platform: 'lichess',
          white: headers.White || 'Unknown',
          black: headers.Black || 'Unknown',
          result: headers.Result || '*',
          date: headers.UTCDate || new Date().toISOString().split('T')[0],
          timeControl: headers.TimeControl || 'unknown',
          pgn: pgn, // Store raw PGN for analysis
          whiteElo: parseInt(headers.WhiteElo) || null,
          blackElo: parseInt(headers.BlackElo) || null,
          opening: headers.Opening || 'Unknown',
          termination: headers.Termination || 'Unknown'
        };
      } catch (error) {
        console.error('Error parsing Lichess game:', error);
        return null;
      }
    }).filter(game => game !== null);
  }

  async fetchLichessGames(username, count = 20, rated) {
    const allGames = [];
    const maxPerRequest = 100;
    let since;
    
    console.log(`🔍 Fetching ${count} games from Lichess for ${username} (rated: ${rated})`);
    
    while (allGames.length < count) {
      const remainingCount = count - allGames.length;
      const requestCount = Math.min(remainingCount, maxPerRequest);
      
      let url = `${LICHESS_API_BASE}/games/user/${username}?max=${requestCount}&format=pgn&moves=true&tags=true&clocks=false&evals=false&opening=true&sort=dateDesc`;
      
      if (rated !== undefined && rated !== 'all') {
        if (rated === 'rated' || rated === true) {
          url += `&rated=true`;
        } else if (rated === 'casual' || rated === false) {
          url += `&rated=false`;
        } else if (rated === true || rated === false) {
          url += `&rated=${rated}`;
        }
        // If rated === 'all', don't add the parameter to get all games
      }
      
      if (since) {
        url += `&until=${since}`;
      }
      
      console.log(`📡 Fetching from Lichess: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/x-chess-pgn'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new GameImportError('User not found', 'INVALID_USERNAME');
        }
        if (response.status === 429) {
          throw new GameImportError('Rate limit exceeded', 'RATE_LIMIT');
        }
        throw new GameImportError('Failed to fetch games', 'NETWORK_ERROR');
      }

      const text = await response.text();
      const pgnGames = text.split(/\n\n(?=\[)/g).filter(pgn => pgn.trim());
      
      console.log(`📊 Found ${pgnGames.length} PGN games in response`);
      
      if (pgnGames.length === 0) {
        console.log(`⚠️ No more games available for ${username}`);
        break;
      }
      
      const parsedGames = this.parseLichessGames(pgnGames);
      console.log(`✅ Parsed ${parsedGames.length} valid games`);
      allGames.push(...parsedGames);
      
      if (parsedGames.length > 0) {
        const lastGame = parsedGames[parsedGames.length - 1];
        const lastGameDate = new Date(lastGame.date);
        since = lastGameDate.getTime();
      }
      
      if (allGames.length < count) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`🎯 Total Lichess games collected: ${allGames.length}`);
    return allGames.slice(0, count);
  }

  async fetchChessComGames(username, count = 20, rated) {
    console.log(`🔍 Fetching ${count} games from Chess.com for ${username}`);
    
    // First, validate the user exists by checking their profile
    try {
      const profileResponse = await fetch(`${CHESS_COM_API_BASE}/player/${username}`);
      if (!profileResponse.ok) {
        if (profileResponse.status === 404) {
          throw new GameImportError('User not found', 'INVALID_USERNAME');
        }
        throw new GameImportError('Failed to fetch user profile', 'NETWORK_ERROR');
      }
      console.log(`✅ User ${username} found on Chess.com`);
    } catch (error) {
      console.error(`❌ Error validating user ${username}:`, error);
      throw error;
    }
    
    // Get available archives for the user
    let availableArchives = [];
    try {
      const archivesResponse = await fetch(`${CHESS_COM_API_BASE}/player/${username}/games/archives`);
      if (archivesResponse.ok) {
        const archivesData = await archivesResponse.json();
        availableArchives = archivesData.archives || [];
        console.log(`📅 Found ${availableArchives.length} available archives for ${username}`);
      }
    } catch (error) {
      console.error('Error fetching archives list:', error);
    }
    
    // If we have available archives, use them; otherwise fall back to recent months
    let archivesToCheck = [];
    if (availableArchives.length > 0) {
      // Use the most recent archives (last 6 months or all if less)
      archivesToCheck = availableArchives.slice(-6);
    } else {
      // Fall back to generating recent month URLs
      const now = new Date();
      for (let i = 0; i < 6; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const archiveUrl = `${CHESS_COM_API_BASE}/player/${username}/games/${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
        archivesToCheck.push(archiveUrl);
      }
    }
    
    console.log(`🔍 Checking ${archivesToCheck.length} archives for games...`);
    
    const allGames = [];
    
    for (const archiveUrl of archivesToCheck) {
      if (allGames.length >= count) break;
      
      try {
        console.log(`📡 Fetching from archive: ${archiveUrl}`);
        const response = await fetch(archiveUrl);
        
        if (!response.ok) {
          if (response.status === 404) {
            console.log(`⚠️ No games found in archive: ${archiveUrl}`);
            continue; // No games in this month
          }
          console.error(`❌ Error fetching archive ${archiveUrl}: ${response.status}`);
          continue; // Skip this archive and try the next one
        }
        
        const data = await response.json();
        const games = data.games || [];
        console.log(`📊 Found ${games.length} games in archive`);
        
        // Filter by rated status first
        const filteredByRated = games.filter(game => {
          if (rated === undefined || rated === 'all') {
            return true; // Include all games
          }
          if (rated === 'rated' || rated === true) {
            return game.rated === true;
          }
          if (rated === 'casual' || rated === false) {
            return game.rated === false;
          }
          return game.rated === rated;
        });
        console.log(`🔍 After rated filter: ${filteredByRated.length}/${games.length} games (rated filter: ${rated})`);
        
        // Parse the games
        const parsedGames = filteredByRated
          .map(game => this.parseChessComGame(game))
          .filter(game => game !== null);
        
        console.log(`✅ Parsed ${parsedGames.length}/${filteredByRated.length} valid games from archive`);
        allGames.push(...parsedGames);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ Error fetching games from archive ${archiveUrl}:`, error);
      }
    }
    
    console.log(`🎯 Total games collected: ${allGames.length}`);
    return allGames.slice(0, count);
  }

  parseChessComGame(game) {
    try {
      // Debug: Log the first few games to see their structure
      if (Math.random() < 0.01) { // Log ~1% of games to avoid spam
        console.log('🔍 Sample Chess.com game structure:', {
          url: game.url,
          white: game.white,
          black: game.black,
          end_time: game.end_time,
          time_class: game.time_class,
          pgn: game.pgn ? 'Present' : 'Missing',
          keys: Object.keys(game)
        });
      }
      
      // Check if essential fields are present
      if (!game.white || !game.black || !game.end_time) {
        console.warn('⚠️ Chess.com game missing essential fields:', {
          hasWhite: !!game.white,
          hasBlack: !!game.black,
          hasEndTime: !!game.end_time,
          gameKeys: Object.keys(game)
        });
        return null;
      }
      
      const parsedGame = {
        id: game.url ? game.url.split('/').pop() : `chesscom_${Date.now()}`,
        platform: 'chess.com',
        white: game.white?.username || 'Unknown',
        black: game.black?.username || 'Unknown',
        result: this.parseChessComResult(game),
        date: new Date(game.end_time * 1000).toISOString().split('T')[0],
        timeControl: game.time_class || 'unknown',
        pgn: game.pgn || '', // Store raw PGN for analysis
        whiteElo: game.white?.rating || null,
        blackElo: game.black?.rating || null,
        opening: 'Unknown',
        termination: 'Unknown'
      };
      
      // Validate the parsed game has required fields
      if (!parsedGame.white || !parsedGame.black || !parsedGame.date) {
        console.warn('⚠️ Parsed Chess.com game missing required fields:', parsedGame);
        return null;
      }
      
      return parsedGame;
    } catch (error) {
      console.error('❌ Error parsing Chess.com game:', error, game);
      return null;
    }
  }

  parseChessComResult(game) {
    if (game.white?.result === 'win') return '1-0';
    if (game.black?.result === 'win') return '0-1';
    return '1/2-1/2';
  }

  async validateUserExists(platform, username) {
    try {
      if (platform === 'lichess') {
        const response = await fetch(`${LICHESS_API_BASE}/user/${username}`);
        return response.ok;
      } else if (platform === 'chess.com') {
        const response = await fetch(`${CHESS_COM_API_BASE}/player/${username}`);
        return response.ok;
      }
      return false;
    } catch (error) {
      console.error('Error validating user:', error);
      return false;
    }
  }

  // Convenience method for fetching games (used by simpleAnalysisService)
  async fetchGames(platform, username, count, rated) {
    const result = await this.importGames({
      platform,
      username,
      count,
      rated
    });
    return result.games;
  }

  async importGames(request) {
    try {
      const { platform, username, count, rated } = request;
      
      let games = [];
      
      if (platform === 'lichess') {
        games = await this.fetchLichessGames(username, count, rated);
      } else if (platform === 'chess.com') {
        games = await this.fetchChessComGames(username, count, rated);
      } else {
        throw new GameImportError('Invalid platform', 'INVALID_INPUT');
      }
      
      console.log(`Successfully imported ${games.length} games for ${username} from ${platform}`);
      
      return {
        games: games,
        count: games.length,
        platform: platform,
        username: username
      };
    } catch (error) {
      console.error('Game import error:', error);
      throw error;
    }
  }
}

export const gameImportService = new GameImportService();