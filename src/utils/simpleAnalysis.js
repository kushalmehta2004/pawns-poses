import { simpleAnalysisService } from '../services/simpleAnalysisService.js';

// Make simple analysis functions available globally
window.analyzePlayer = async function(platform, username, gameCount = 10, gameType = 'all') {
  console.clear();
  console.log(`🎯 CHESS PLAYER ANALYSIS`);
  console.log(`Platform: ${platform}`);
  console.log(`Username: ${username}`);
  console.log(`Games: ${gameCount}`);
  console.log(`Type: ${gameType}`);
  console.log(`Started: ${new Date().toISOString()}`);
  console.log(`${'='.repeat(80)}`);
  
  try {
    const result = await simpleAnalysisService.analyzePlayerGames(platform, username, gameCount, gameType);
    
    console.log(`\n🎉 ANALYSIS COMPLETE!`);
    console.log(`📊 Analyzed ${result.games.length} games`);
    console.log(`🧠 AI Analysis completed successfully`);
    console.log(`⏰ Finished at: ${new Date().toISOString()}`);
    
    return result;
    
  } catch (error) {
    console.error(`❌ Analysis failed:`, error);
    throw error;
  }
};

// Quick functions for each platform
window.analyzeLichessPlayer = async function(username, gameCount = 10) {
  return await window.analyzePlayer('lichess', username, gameCount, 'all');
};

window.analyzeChessComPlayer = async function(username, gameCount = 10) {
  return await window.analyzePlayer('chess.com', username, gameCount, 'all');
};

// Quick test with known user
window.quickPlayerAnalysis = async function() {
  console.log(`🧪 Running quick analysis test with Magnus Carlsen's Lichess account...`);
  try {
    return await window.analyzeLichessPlayer('DrNykterstein', 5);
  } catch (error) {
    console.error(`❌ Quick test failed:`, error);
    console.log(`💡 Try with your own username: analyzeLichessPlayer('your_username', 5)`);
  }
};

// Function to test analysis structure
window.testAnalysisStructure = async function(platform, username, gameCount = 3) {
  console.clear();
  console.log(`🧪 TESTING ANALYSIS STRUCTURE`);
  console.log(`${'='.repeat(80)}`);
  
  try {
    console.log(`📋 Platform: ${platform}`);
    console.log(`👤 Username: ${username}`);
    console.log(`🎮 Game Count: ${gameCount}`);
    
    const result = await simpleAnalysisService.analyzePlayerGames(platform, username, gameCount, 'all');
    
    // Check if we got the required structure
    const analysis = result.analysis;
    
    console.log(`\n🔍 STRUCTURE VALIDATION:`);
    console.log(`${'='.repeat(50)}`);
    
    // Check for weaknesses
    const weaknessMatches = analysis.match(/Weakness #\d+:/g) || [];
    console.log(`📊 Found ${weaknessMatches.length} weaknesses (expected: 3)`);
    
    // Check for examples
    const exampleMatches = analysis.match(/Game \d+, Move \d+/g) || [];
    console.log(`📊 Found ${exampleMatches.length} game examples (expected: 9)`);
    
    // Check for required sections
    const sections = [
      'Executive Summary',
      'Recurring Weaknesses', 
      'Middlegame Mastery',
      'Endgame Technique',
      'Actionable Improvement'
    ];
    
    sections.forEach(section => {
      const found = analysis.toLowerCase().includes(section.toLowerCase());
      console.log(`${found ? '✅' : '❌'} ${section}: ${found ? 'FOUND' : 'MISSING'}`);
    });
    
    if (weaknessMatches.length === 3 && exampleMatches.length >= 9) {
      console.log(`\n🎉 SUCCESS! Analysis has proper structure with 3 weaknesses and examples`);
    } else {
      console.log(`\n⚠️ STRUCTURE ISSUE: Missing required weaknesses or examples`);
    }
    
    return result;
    
  } catch (error) {
    console.error(`❌ Test failed:`, error);
    throw error;
  }
};

// Function to analyze with detailed timing
window.analyzePlayerDetailed = async function(platform, username, gameCount = 5) {
  console.clear();
  console.log(`🔍 DETAILED CHESS PLAYER ANALYSIS`);
  console.log(`${'='.repeat(80)}`);
  
  const startTime = Date.now();
  
  try {
    console.log(`⏰ Start Time: ${new Date().toISOString()}`);
    console.log(`📋 Platform: ${platform}`);
    console.log(`👤 Username: ${username}`);
    console.log(`🎮 Game Count: ${gameCount}`);
    
    const result = await simpleAnalysisService.analyzePlayerGames(platform, username, gameCount, 'all');
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`\n📊 FINAL SUMMARY:`);
    console.log(`${'='.repeat(50)}`);
    console.log(`⏱️ Total Duration: ${duration.toFixed(2)} seconds`);
    console.log(`🎮 Games Analyzed: ${result.games.length}`);
    console.log(`🧠 Analysis Complete: YES`);
    console.log(`✅ Success!`);
    
    return result;
    
  } catch (error) {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.error(`❌ Analysis failed after ${duration.toFixed(2)} seconds:`, error);
    throw error;
  }
};

// Function to just show game info without analysis
window.showPlayerGames = async function(platform, username, gameCount = 5) {
  console.clear();
  console.log(`📋 SHOWING PLAYER GAMES`);
  console.log(`${'='.repeat(80)}`);
  
  try {
    // Import game service directly
    const { gameImportService } = await import('../services/gameImport.js');
    
    console.log(`📡 Fetching games from ${platform}...`);
    const games = await gameImportService.fetchGames(platform, username, gameCount, 'all');
    
    if (!games || games.length === 0) {
      console.error(`❌ No games found for ${username} on ${platform}`);
      return;
    }
    
    console.log(`✅ Found ${games.length} games`);
    console.log(`${'='.repeat(80)}`);
    
    games.forEach((game, index) => {
      console.log(`\n🎮 GAME ${index + 1}/${games.length}`);
      console.log(`ID: ${game.id}`);
      console.log(`⚪ White: ${game.white} (${game.whiteElo || 'Unrated'})`);
      console.log(`⚫ Black: ${game.black} (${game.blackElo || 'Unrated'})`);
      console.log(`🏆 Result: ${game.result}`);
      console.log(`📅 Date: ${game.date}`);
      console.log(`⏱️ Time Control: ${game.timeControl}`);
      console.log(`🎭 Opening: ${game.opening || 'Unknown'}`);
      
      if (game.pgn) {
        console.log(`📝 PGN Available: YES (${game.pgn.length} characters)`);
      } else {
        console.log(`📝 PGN Available: NO`);
      }
    });
    
    console.log(`\n🎉 COMPLETE! Showed ${games.length} games`);
    return games;
    
  } catch (error) {
    console.error(`❌ Failed to show games:`, error);
    throw error;
  }
};

console.log(`🎯 SIMPLE ANALYSIS FUNCTIONS LOADED!`);
console.log(`📝 Available functions:`);
console.log(`   analyzePlayer('platform', 'username', gameCount, 'gameType')`);
console.log(`   analyzeLichessPlayer('username', gameCount)`);
console.log(`   analyzeChessComPlayer('username', gameCount)`);
console.log(`   showPlayerGames('platform', 'username', gameCount) - Just show games`);
console.log(`   quickPlayerAnalysis() - Test with Magnus Carlsen`);
console.log(`   analyzePlayerDetailed('platform', 'username', gameCount) - With timing`);
console.log(`   testAnalysisStructure('platform', 'username', gameCount) - Test structure`);
console.log(`\n💡 Examples:`);
console.log(`   analyzeLichessPlayer('your_username', 5) - Analyze 5 Lichess games`);
console.log(`   testAnalysisStructure('lichess', 'your_username', 3) - Test structure`);
console.log(`   quickPlayerAnalysis() - Quick test`);
console.log(`\n🎯 This system:`);
console.log(`   ✅ Fetches games from Lichess/Chess.com`);
console.log(`   ✅ Uses the exact prompt from prompt.txt`);
console.log(`   ✅ Runs Gemini AI analysis`);
console.log(`   ✅ Shows complete analysis report`);
console.log(`   ✅ Validates 3 recurring weaknesses with examples`);
console.log(`   ✅ Provides fallback analysis if AI fails`);
console.log(`   ❌ No FEN position extraction`);
console.log(`   ❌ No complex report generation`);