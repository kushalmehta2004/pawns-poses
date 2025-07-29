import React, { useState } from 'react';
import { simpleAnalysisService } from '../services/simpleAnalysisService.js';
import { AlertCircle, CheckCircle, Loader2, Play } from 'lucide-react';

const ReportGenerator = ({ onReportGenerated }) => {
  const [formData, setFormData] = useState({
    platform: 'lichess',
    username: '',
    gameCount: 20
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setValidationResult(null);
  };

  const validateUsername = async () => {
    if (!formData.username) return;
    
    setIsValidating(true);
    setValidationResult(null);
    
    try {
      console.log(`🔍 Validating username: ${formData.username} on ${formData.platform}`);
      
      // Import game service to validate username
      const { gameImportService } = await import('../services/gameImport.js');
      
      // Try to fetch just 1 game to validate username using the fetchGames method
      const games = await gameImportService.fetchGames(
        formData.platform,
        formData.username,
        1,
        undefined // Don't filter by rated/unrated for validation
      );
      
      console.log(`✅ Validation result:`, games);
      
      if (games && games.length > 0) {
        setValidationResult({ 
          valid: true, 
          message: `✓ Found ${formData.username} on ${formData.platform} (${games.length} games available)` 
        });
      } else {
        setValidationResult({ 
          valid: false, 
          message: `No games found for ${formData.username} on ${formData.platform}` 
        });
      }
    } catch (error) {
      console.error(`❌ Validation error:`, error);
      
      // Check if it's a specific error type
      if (error.code === 'INVALID_USERNAME') {
        setValidationResult({ 
          valid: false, 
          message: `Username "${formData.username}" not found on ${formData.platform}` 
        });
      } else if (error.code === 'RATE_LIMIT') {
        setValidationResult({ 
          valid: false, 
          message: `Rate limit exceeded. Please try again in a moment.` 
        });
      } else {
        setValidationResult({ 
          valid: false, 
          message: `Error validating username: ${error.message || 'Please check your username and try again'}` 
        });
      }
    } finally {
      setIsValidating(false);
    }
  };

  const generateReport = async () => {
    if (!formData.username) {
      setError('Please enter a username');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress('Initializing analysis...');

    try {
      setProgress('Fetching games from ' + formData.platform + '...');
      
      // Generate the analysis using the simple analysis service
      const result = await simpleAnalysisService.analyzePlayerGames(
        formData.platform, 
        formData.username, 
        formData.gameCount, 
        'all'
      );

      if (!result || !result.analysis) {
        throw new Error('Failed to generate analysis');
      }

      setProgress('Processing analysis results...');

      // Parse the analysis and create a structured report
      const report = {
        username: formData.username,
        platform: formData.platform,
        gameCount: result.games.length,
        generatedAt: new Date().toISOString(),
        games: result.games,
        fenData: result.fenData,
        fenAnalysisData: result.fenAnalysisData,
        rawAnalysis: result.analysis,
        parsedAnalysis: parseAnalysisText(result.analysis, formData.username, result.games, result.fenData)
      };

      setProgress('Report generated successfully!');
      
      // Pass the report to parent component
      onReportGenerated(report);

    } catch (error) {
      console.error('Report generation failed:', error);
      setError('Analysis failed. Please try again later.');
    } finally {
      setIsGenerating(false);
      setProgress(null);
    }
  };

  // Parse the raw analysis text into structured data
  const parseAnalysisText = (analysisText, username, games, fenData) => {
    console.log('🔍 [PARSE ANALYSIS] Starting to parse analysis text...');
    console.log('🔍 [PARSE ANALYSIS] Analysis text length:', analysisText.length);
    console.log('🔍 [PARSE ANALYSIS] Analysis preview:', analysisText.substring(0, 500));
    console.log('🔍 [PARSE ANALYSIS] FEN data available:', !!fenData);
    
    try {
      // Extract sections using regex patterns
      const sections = {
        executiveSummary: extractExecutiveSummary(analysisText),
        keyInsights: extractKeyInsights(analysisText),
        recurringWeaknesses: extractWeaknesses(analysisText),
        middlegameAnalysis: extractSection(analysisText, 'Middlegame Mastery', 'Endgame Technique'),
        endgameAnalysis: extractSection(analysisText, 'Endgame Technique', 'Actionable Improvement'),
        middlegameSummary: extractPhaseSummary(analysisText, 'Middlegame Mastery'),
        endgameSummary: extractPhaseSummary(analysisText, 'Endgame Technique'),
        improvementPlan: extractImprovementPlan(analysisText)
      };

      // Calculate basic stats
      const stats = calculateGameStats(games, username, fenData);

      return {
        ...sections,
        stats
      };
    } catch (error) {
      console.error('Error parsing analysis:', error);
      return {
        executiveSummary: analysisText.substring(0, 500) + '...',
        keyInsights: [],
        recurringWeaknesses: [],
        middlegameAnalysis: 'Analysis parsing failed',
        endgameAnalysis: 'Analysis parsing failed',
        middlegameSummary: '',
        endgameSummary: '',
        improvementPlan: 'Analysis parsing failed',
        stats: calculateGameStats(games, username, fenData)
      };
    }
  };

  const extractExecutiveSummary = (text) => {
    // Look for the executive summary section
    const summaryStart = text.indexOf('**Executive Summary:**');
    const weaknessStart = text.indexOf('**2. Recurring Weaknesses:**');
    
    if (summaryStart === -1) return '';
    
    const endIndex = weaknessStart !== -1 ? weaknessStart : text.length;
    let summary = text.substring(summaryStart, endIndex);
    
    // Remove the header and clean up
    summary = summary.replace('**Executive Summary:**', '').trim();
    
    // Remove any trailing section markers
    summary = summary.replace(/\*\*\d+\.\s*$/, '').trim();
    
    return summary;
  };

  const extractKeyInsights = (text) => {
    console.log('🔍 [EXTRACT INSIGHTS] Starting key insights extraction...');
    console.log('🔍 [EXTRACT INSIGHTS] Full text preview:', text.substring(0, 1000));
    
    const insights = [];
    
    // Look for the executive summary section first
    const summaryStart = text.indexOf('**Executive Summary:**');
    const weaknessStart = text.indexOf('**2. Recurring Weaknesses:**');
    
    if (summaryStart !== -1 && weaknessStart !== -1) {
      // Extract the executive summary content
      const summaryContent = text.substring(summaryStart, weaknessStart);
      console.log('🔍 [EXTRACT INSIGHTS] Executive summary content:', summaryContent);
      
      // Clean up the summary content
      let cleanSummary = summaryContent
        .replace('**Executive Summary:**', '')
        .trim();
      
      // Split into sentences and extract meaningful insights
      const sentences = cleanSummary.split(/[.!?]+/).filter(s => s.trim().length > 20);
      
      sentences.forEach(sentence => {
        const trimmed = sentence.trim();
        if (trimmed && 
            !trimmed.toLowerCase().includes('rachitmehta') && 
            !trimmed.startsWith('**') &&
            trimmed.length > 30) {
          insights.push(trimmed + '.');
        }
      });
    }
    
    // If no insights from executive summary, try to extract from weaknesses
    if (insights.length === 0 && weaknessStart !== -1) {
      const nextSectionStart = text.indexOf('**3. Middlegame Mastery Focus:**');
      const endIndex = nextSectionStart !== -1 ? nextSectionStart : text.length;
      const weaknessSection = text.substring(weaknessStart, endIndex);
      
      // Extract weakness descriptions as insights
      const weaknessPattern = /\*\*([a-z])\.\s+([^:]+):\*\*\s+([^*]+?)(?=\*\*Example:|$)/gs;
      let match;
      
      while ((match = weaknessPattern.exec(weaknessSection)) !== null) {
        const [, letter, title, description] = match;
        const cleanDescription = description.trim().split('.')[0];
        if (cleanDescription.length > 20) {
          insights.push(cleanDescription + '.');
        }
      }
    }
    
    console.log('🔍 [EXTRACT INSIGHTS] Extracted insights:', insights);
    
    // Return up to 3 insights, or empty array if none found
    return insights.slice(0, 3);
  };

  const extractPhaseSummary = (text, phaseMarker) => {
    console.log(`🔍 [EXTRACT PHASE SUMMARY] Extracting summary for ${phaseMarker}...`);
    
    // Find the phase section
    const phaseStart = text.indexOf(`**3. ${phaseMarker} Focus:**`);
    if (phaseStart === -1) {
      const altStart = text.indexOf(`**4. ${phaseMarker} Review:**`);
      if (altStart === -1) {
        console.log(`🔍 [EXTRACT PHASE SUMMARY] ${phaseMarker} section not found`);
        return '';
      }
    }
    
    const nextSectionStart = phaseMarker === 'Middlegame Mastery' 
      ? text.indexOf('**4. Endgame Technique Review:**')
      : text.indexOf('**5. Actionable Improvement Plan:**');
    
    const startIndex = phaseStart !== -1 ? phaseStart : text.indexOf(`**4. ${phaseMarker} Review:**`);
    const endIndex = nextSectionStart !== -1 ? nextSectionStart : text.length;
    
    if (startIndex === -1) return '';
    
    const phaseSection = text.substring(startIndex, endIndex);
    console.log(`🔍 [EXTRACT PHASE SUMMARY] ${phaseMarker} section:`, phaseSection.substring(0, 300));
    
    // Extract the first meaningful sentence or two
    const cleanSection = phaseSection
      .replace(/\*\*[^*]+\*\*/g, '') // Remove bold markers
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();
    
    // Split into sentences and take the first 1-2 meaningful ones
    const sentences = cleanSection.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    if (sentences.length === 0) return '';
    
    // Take first sentence, or first two if the first is very short
    let summary = sentences[0].trim();
    if (summary.length < 50 && sentences.length > 1) {
      summary += '. ' + sentences[1].trim();
    }
    
    // Ensure it ends with a period
    if (!summary.endsWith('.')) {
      summary += '.';
    }
    
    console.log(`🔍 [EXTRACT PHASE SUMMARY] ${phaseMarker} summary:`, summary);
    return summary;
  };

  const extractImprovementPlan = (text) => {
    console.log('🔍 [EXTRACT IMPROVEMENT PLAN] Starting improvement plan extraction...');
    
    const startIndex = text.toLowerCase().indexOf('actionable improvement');
    if (startIndex === -1) {
      console.log('🔍 [EXTRACT IMPROVEMENT PLAN] No improvement plan section found');
      return '';
    }
    
    // Find the end of the improvement plan section by looking for resource indicators
    const resourceMarkers = [
      'recommended resources',
      'resources:',
      'study materials',
      'books:',
      'videos:',
      'master games:',
      'youtube',
      'watch this',
      'capablanca',
      'tartakower',
      'further reading'
    ];
    
    let endIndex = text.length;
    
    // Find the earliest occurrence of any resource marker after the improvement plan start
    for (const marker of resourceMarkers) {
      const markerIndex = text.toLowerCase().indexOf(marker, startIndex);
      if (markerIndex !== -1 && markerIndex < endIndex) {
        endIndex = markerIndex;
      }
    }
    
    const improvementSection = text.substring(startIndex, endIndex).trim();
    console.log('🔍 [EXTRACT IMPROVEMENT PLAN] Extracted section:', improvementSection.substring(0, 300));
    
    return improvementSection;
  };

  const extractSection = (text, startMarker, endMarker) => {
    const startIndex = text.toLowerCase().indexOf(startMarker.toLowerCase());
    if (startIndex === -1) return '';
    
    let endIndex = text.length;
    if (endMarker) {
      const endMarkerIndex = text.toLowerCase().indexOf(endMarker.toLowerCase(), startIndex + startMarker.length);
      if (endMarkerIndex !== -1) {
        endIndex = endMarkerIndex;
      }
    }
    
    return text.substring(startIndex + startMarker.length, endIndex).trim();
  };

  const extractWeaknesses = (text) => {
    console.log('🔍 [EXTRACT WEAKNESSES] Starting weakness extraction...');
    
    const weaknesses = [];
    
    // Find the "Recurring Weaknesses" section - try multiple patterns
    const patterns = [
      /2\.\s*\*\*Recurring Weaknesses.*?\*\*([\s\S]*?)(?=3\.\s*\*\*|$)/i,
      /\*\*Recurring Weaknesses.*?\*\*([\s\S]*?)(?=\*\*.*?Middlegame|$)/i,
      /Recurring Weaknesses.*?:([\s\S]*?)(?=Middlegame|Endgame|Actionable|$)/i
    ];
    
    let weaknessSection = null;
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        weaknessSection = match[1];
        break;
      }
    }
    
    if (!weaknessSection) {
      console.log('🔍 [EXTRACT WEAKNESSES] No weaknesses section found');
      return weaknesses;
    }
    
    console.log('🔍 [EXTRACT WEAKNESSES] Found weakness section:', weaknessSection.substring(0, 500));
    
    // Split by the current format: **2.1 [Title Text]**
    let weaknessBlocks = weaknessSection.split(/(?=\*\*2\.\d+\s+[^*]+\*\*)/i).filter(block => block.trim().length > 20);
    
    // Fallback: Split by **2.1 Title:** format
    if (weaknessBlocks.length <= 1) {
      weaknessBlocks = weaknessSection.split(/(?=\*\*2\.\d+\s+Title:\s*[^*]+)/i).filter(block => block.trim().length > 20);
    }
    
    console.log('🔍 [EXTRACT WEAKNESSES] Found weakness blocks:', weaknessBlocks.length);
    
    weaknessBlocks.forEach((block, index) => {
      const trimmed = block.trim();
      if (!trimmed) return;
      
      console.log(`🔍 [EXTRACT WEAKNESSES] Processing block ${index + 1}:`, trimmed.substring(0, 200));
      
      // Extract title - try current format first: **2.1 [Title Text]**
      let titleMatch = trimmed.match(/\*\*2\.\d+\s+([^*\n\r]+)\*\*/i);
      let title = titleMatch ? titleMatch[1].trim() : `Weakness ${index + 1}`;
      let description = '';
      let exampleText = '';
      let improvement = '';
      
      if (titleMatch) {
        // Remove "Title: " prefix if present
        if (title.startsWith('Title: ')) {
          title = title.substring(7).trim();
        }
        
        // Current format: **2.1 [Title]** with **Explanation:**, **Example:**, **Better Plan:**
        // Try multiple explanation patterns
        let explanationMatch = trimmed.match(/\*\*Explanation:\*\*\s*([^*]*?)(?=\*\*Example:|$)/is);
        if (!explanationMatch) {
          explanationMatch = trimmed.match(/\*\*2\.\d+\s+Explanation:\*\*\s*([^*]*?)(?=\*\*Example:|$)/is);
        }
        description = explanationMatch ? explanationMatch[1].trim() : '';
        
        // Try multiple example patterns
        let exampleMatch = trimmed.match(/\*\*Example:\*\*\s*([^*]*?)(?=\*\*Better Plan:|$)/is);
        if (!exampleMatch) {
          exampleMatch = trimmed.match(/\*\*2\.\d+\s+Example:\*\*\s*([^*]*?)(?=\*\*Better Plan:|$)/is);
        }
        exampleText = exampleMatch ? exampleMatch[1].trim() : '';
        
        // Try multiple better plan patterns
        let improvementMatch = trimmed.match(/\*\*Better Plan:\*\*\s*([^*]*?)(?=\*\*2\.\d+|$)/is);
        if (!improvementMatch) {
          improvementMatch = trimmed.match(/\*\*2\.\d+\s+Better Plan:\*\*\s*([^*]*?)(?=\*\*2\.\d+|$)/is);
        }
        improvement = improvementMatch ? improvementMatch[1].trim() : '';
        
        // If still no content, try extracting everything after the title
        if (!description && !exampleText && !improvement) {
          const afterTitle = trimmed.substring(trimmed.indexOf('**') + titleMatch[0].length);
          const rawContentMatch = afterTitle.match(/^\s*([^*]*?)(?=\*\*|$)/s);
          if (rawContentMatch && rawContentMatch[1].trim().length > 20) {
            description = rawContentMatch[1].trim();
          }
        }
      } else {
        // Fallback: **2.1 Title:** format
        titleMatch = trimmed.match(/\*\*2\.\d+\s+Title:\s*([^*]*?)(?=\*\*2\.\d+\s+Explanation:|$)/i);
        title = titleMatch ? titleMatch[1].trim() : `Weakness ${index + 1}`;
        
        const explanationMatch = trimmed.match(/\*\*2\.\d+\s+Explanation:\s*([^*]*?)(?=\*\*2\.\d+\s+Example:|$)/i);
        description = explanationMatch ? explanationMatch[1].trim() : '';
        const exampleMatch = trimmed.match(/\*\*2\.\d+\s+Example:\s*([^*]*?)(?=\*\*2\.\d+\s+Better Plan:|$)/i);
        exampleText = exampleMatch ? exampleMatch[1].trim() : '';
        const improvementMatch = trimmed.match(/\*\*2\.\d+\s+Better Plan:\s*([^*]*?)(?=\*\*2\.\d+\s+Title:|$)/i);
        improvement = improvementMatch ? improvementMatch[1].trim() : '';
      }
      
      // Parse the example for game details
      const examples = [];
      if (exampleText) {
        // Look for Game X, Move Y: `move` - description pattern
        const gameMatch = exampleText.match(/Game\s+(\d+),\s+Move\s+(\d+):\s*`([^`]+)`\s*-\s*(.*)/i);
        if (gameMatch) {
          examples.push({
            gameNumber: parseInt(gameMatch[1]),
            moveNumber: parseInt(gameMatch[2]),
            move: gameMatch[3].trim(),
            description: gameMatch[4].trim(),
            opponent: `opponent${gameMatch[1]}` // Generate opponent name
          });
        }
      }
      
      const weakness = {
        number: index + 1,
        title: title,
        description: description,
        examples: examples,
        improvement: improvement,
        rawContent: trimmed
      };
      
      console.log(`🔍 [EXTRACT WEAKNESSES] Extracted weakness ${index + 1}:`, weakness);
      weaknesses.push(weakness);
    });
    
    console.log(`🔍 [EXTRACT WEAKNESSES] Total weaknesses found: ${weaknesses.length}`);
    return weaknesses.slice(0, 3); // Ensure max 3 weaknesses
  };

  const extractExamples = (weaknessText, games = []) => {
    console.log('🔍 [EXTRACT EXAMPLES] Extracting examples from:', weaknessText.substring(0, 200));
    
    const examples = [];
    // Updated pattern to match: **Example:** Game 2, Move 2: `2. Qf3?` - Description
    const patterns = [
      /\*\*Example:\*\*\s*Game\s+(\d+),\s+Move\s+(\d+):\s*`([^`]+)`\s*-\s*([^*]+)/gi,
      /Game\s+(\d+),\s+Move\s+(\d+):\s*`([^`]+)`\s*-\s*([^*]+)/gi,
      /Game\s+(\d+),\s+Move\s+(\d+):\s*([^\.]+)/gi  // Fallback pattern
    ];
    
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let match;
      
      while ((match = pattern.exec(weaknessText)) !== null) {
        const gameNumber = parseInt(match[1]);
        const moveNumber = parseInt(match[2]);
        
        // Find opponent from games data
        let opponent = 'Opponent';
        if (games && games[gameNumber - 1]) {
          const game = games[gameNumber - 1];
          // Assume the user is white if not specified, opponent is black
          opponent = game.black || game.opponent || 'Opponent';
        }
        
        const example = {
          gameNumber: gameNumber,
          moveNumber: moveNumber,
          move: match[3] ? match[3].trim() : '',
          description: match[4] ? match[4].trim() : match[3] ? match[3].trim() : '',
          opponent: opponent
        };
        
        console.log('🔍 [EXTRACT EXAMPLES] Found example:', example);
        examples.push(example);
      }
      
      if (examples.length > 0) break; // Stop trying other patterns if we found examples
    }
    
    return examples;
  };

  const extractWeaknessDescription = (weaknessText) => {
    console.log('🔍 [EXTRACT DESCRIPTION] Extracting from:', weaknessText.substring(0, 300));
    
    // The description is the text after the title and before the **Example:**
    const exampleIndex = weaknessText.indexOf('**Example:**');
    let descriptionText = exampleIndex !== -1 ? 
      weaknessText.substring(0, exampleIndex) : weaknessText;
    
    // Remove the title part (everything up to and including the first **)
    const titleEndIndex = descriptionText.indexOf('**', descriptionText.indexOf('**') + 2);
    if (titleEndIndex !== -1) {
      descriptionText = descriptionText.substring(titleEndIndex + 2);
    }
    
    // Clean up the description
    descriptionText = descriptionText
      .replace(/\*\*/g, '') // Remove any remaining **
      .replace(/^\s*:\s*/, '') // Remove leading colon
      .trim();
    
    console.log('🔍 [EXTRACT DESCRIPTION] Extracted:', descriptionText.substring(0, 100));
    
    return descriptionText || 'Description not available';
  };

  const extractImprovement = (weaknessText) => {
    console.log('🔍 [EXTRACT IMPROVEMENT] Extracting from:', weaknessText.substring(0, 200));
    
    // Look for improvement suggestions in the example description
    const patterns = [
      /Better\s+Plan:\s*([^.]+\.)*/gi,
      /better\s+(?:strategy|approach|plan|development)[^.]*\./gi,
      /instead[^.]*\./gi,
      /optimal\s+strategy[^.]*\./gi,
      /should\s+(?:consider|focus)[^.]*\./gi,
      /The\s+optimal\s+strategy[^.]*\./gi
    ];
    
    for (const pattern of patterns) {
      const match = weaknessText.match(pattern);
      if (match && match[0]) {
        let improvement = match[0].trim();
        // Clean up "Better Plan:" prefix if present
        improvement = improvement.replace(/^Better\s+Plan:\s*/i, '');
        console.log('🔍 [EXTRACT IMPROVEMENT] Found:', improvement);
        return improvement;
      }
    }
    
    return 'Focus on developing pieces before bringing out the queen, maintain solid pawn structure, and practice endgame techniques.';
  };

  const calculateGameStats = (games, username, fenData) => {
    if (!games || games.length === 0) {
      return {
        totalGames: 0,
        winRate: 0,
        averageAccuracy: 75,
        mostPlayedOpening: 'Unknown',
        focusArea: 'Strategic Planning'
      };
    }

    let wins = 0;
    let draws = 0;
    const openings = {};

    games.forEach(game => {
      const userIsWhite = game.white && game.white.toLowerCase().includes(username.toLowerCase());
      const userIsBlack = game.black && game.black.toLowerCase().includes(username.toLowerCase());
      
      // Count results
      if (game.result === '1-0' && userIsWhite) wins++;
      else if (game.result === '0-1' && userIsBlack) wins++;
      else if (game.result === '1/2-1/2') draws++;
      
      // Count openings
      const opening = game.opening || 'Unknown';
      openings[opening] = (openings[opening] || 0) + 1;
    });

    const winRate = Math.round((wins / games.length) * 100);
    const mostPlayedOpening = Object.entries(openings)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';

    // Calculate FEN-specific stats if available
    let totalPositions = 0;
    let averageGameLength = 0;
    
    if (fenData && fenData.length > 0) {
      totalPositions = fenData.reduce((sum, game) => sum + (game.positions ? game.positions.length : 0), 0);
      averageGameLength = Math.round(totalPositions / fenData.length);
    }

    return {
      totalGames: games.length,
      winRate: winRate,
      averageAccuracy: Math.floor(Math.random() * 20) + 70, // Simulated for now
      mostPlayedOpening: mostPlayedOpening,
      focusArea: 'Strategic Planning', // Will be determined by analysis
      totalPositions: totalPositions,
      averageGameLength: averageGameLength,
      analysisType: fenData ? 'FEN-based' : 'PGN-based'
    };
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Generate Your Chess Report</h2>
      
      {/* Platform Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chess Platform
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleInputChange('platform', 'lichess')}
            className={`p-4 border-2 rounded-lg text-center transition-colors ${
              formData.platform === 'lichess'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold">Lichess</div>
            <div className="text-sm text-gray-500">lichess.org</div>
          </button>
          <button
            onClick={() => handleInputChange('platform', 'chess.com')}
            className={`p-4 border-2 rounded-lg text-center transition-colors ${
              formData.platform === 'chess.com'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold">Chess.com</div>
            <div className="text-sm text-gray-500">chess.com</div>
          </button>
        </div>
      </div>

      {/* Username Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Username
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            placeholder={`Enter your ${formData.platform} username`}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={validateUsername}
            disabled={!formData.username || isValidating}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Validate'}
          </button>
        </div>
        
        {validationResult && (
          <div className={`mt-2 flex items-center text-sm ${
            validationResult.valid ? 'text-green-600' : 'text-red-600'
          }`}>
            {validationResult.valid ? (
              <CheckCircle className="w-4 h-4 mr-1" />
            ) : (
              <AlertCircle className="w-4 h-4 mr-1" />
            )}
            {validationResult.message}
          </div>
        )}
      </div>

      {/* Game Count Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number of Games to Analyze
        </label>
        <select
          value={formData.gameCount}
          onChange={(e) => handleInputChange('gameCount', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value={20}>20 games (Recommended)</option>
          <option value={30}>30 games</option>
          <option value={40}>40 games</option>
          <option value={50}>50 games</option>
        </select>
        <p className="text-sm text-gray-500 mt-1">
          More games provide better analysis but take longer to process
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Progress Display */}
      {progress && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center">
            <Loader2 className="w-5 h-5 text-blue-600 mr-2 animate-spin" />
            <span className="text-blue-700">{progress}</span>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={generateReport}
        disabled={!formData.username || isGenerating}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Generating Report...
          </>
        ) : (
          <>
            <Play className="w-5 h-5 mr-2" />
            Generate Report
          </>
        )}
      </button>
    </div>
  );
};

export default ReportGenerator;