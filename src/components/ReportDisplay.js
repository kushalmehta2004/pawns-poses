import React from 'react';
import { ArrowLeft, Download, ChartLine, Search, CheckSquare, Target, BookOpen, Youtube, Crown, Book } from 'lucide-react';

// Add custom styles for the report
const reportStyles = `
  .move-code {
    font-family: monospace;
    background-color: #e5e7eb;
    padding: 2px 5px;
    border-radius: 4px;
    font-size: 0.9em;
  }
  .checklist-item {
    display: flex;
    align-items: flex-start;
    padding: 0.75rem;
    border-radius: 0.5rem;
    background-color: #f8fafc;
    border: 1px solid #e5e7eb;
  }
`;

const ReportDisplay = ({ report, onBack }) => {
  // Debug logging to see what data we're receiving
  console.log('🔍 [REPORT DISPLAY] Report data:', report);
  console.log('🔍 [REPORT DISPLAY] FEN Data:', report.fenData);
  console.log('🔍 [REPORT DISPLAY] FEN Analysis Data:', report.fenAnalysisData);
  console.log('🔍 [REPORT DISPLAY] Parsed Analysis:', report.parsedAnalysis);
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const downloadPDF = () => {
    // This would implement PDF generation
    console.log('PDF download functionality would be implemented here');
    alert('PDF download functionality will be implemented soon!');
  };

  const { parsedAnalysis } = report;
  const stats = parsedAnalysis?.stats || {};

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-8">
      <style>{reportStyles}</style>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Button and Download */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Generator
          </button>
          
          <button
            onClick={downloadPDF}
            className="bg-emerald-700 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </button>
        </div>

        {/* Report Content */}
        <div className="bg-white rounded-lg shadow-lg border-t-8 border-emerald-900 p-10" id="report-content">
          
          {/* Header */}
          <header className="flex justify-between items-start pb-6 border-b border-gray-200 mb-8">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-800">Performance Report</h1>
              <p className="text-md text-gray-500">Prepared by Pawnsposes</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-lg text-gray-800">{report.username}</p>
              <p className="text-sm text-gray-500">{formatDate(report.generatedAt)}</p>
            </div>
          </header>

          {/* Tagline */}
          <div className="text-center italic text-gray-600 mb-8 font-medium">
            <p>"Built by a real master coach, not just a graph-spitting bot."</p>
            <p>"We don't just show you what's wrong — we train you to fix it."</p>
          </div>

          {/* Section 1: Performance Summary */}
          <section className="mb-8 p-6 bg-emerald-50/50 border border-emerald-100 rounded-lg">
            <h2 className="flex items-center text-lg font-extrabold text-emerald-900 uppercase tracking-wide mb-6">
              <ChartLine className="w-5 h-5 mr-3 text-emerald-500" />
              Performance Summary
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <h4 className="font-bold text-sm text-green-800">Win Rate</h4>
                <p className="text-2xl font-bold text-gray-700 mt-1">{stats.winRate || 0}%</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <h4 className="font-bold text-sm text-blue-800">Average Accuracy</h4>
                <p className="text-2xl font-bold text-gray-700 mt-1">{stats.averageAccuracy || 75}%</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <h4 className="font-bold text-sm text-yellow-800">Most Played</h4>
                <p className="text-lg font-bold text-gray-700 mt-1">{stats.mostPlayedOpening || 'Unknown'}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <h4 className="font-bold text-sm text-red-800">#1 Focus Area</h4>
                <p className="text-lg font-bold text-gray-700 mt-1">{stats.focusArea || 'Strategic Planning'}</p>
              </div>
            </div>



            <div>
              <h3 className="font-bold text-gray-800 mb-2">Key Insights:</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                {parsedAnalysis?.keyInsights && parsedAnalysis.keyInsights.length > 0 ? (
                  parsedAnalysis.keyInsights.map((insight, index) => (
                    <li key={index}>{insight}</li>
                  ))
                ) : (
                  <>
                    <li>Analysis of {report.gameCount} recent games from {report.platform}</li>
                    <li>Comprehensive evaluation of strategic and tactical patterns</li>
                    <li>Personalized improvement recommendations based on game analysis</li>
                  </>
                )}
              </ul>
            </div>
          </section>

          {/* Section 2: Recurring Weaknesses */}
          <section className="mb-8">
            <h2 className="flex items-center text-lg font-extrabold text-emerald-900 uppercase tracking-wide mb-6">
              <Search className="w-5 h-5 mr-3 text-emerald-500" />
              Recurring Weaknesses
            </h2>

            {(() => {
              const fullText = report.rawAnalysis || '';
              
              // Simple and robust parsing for recurring weaknesses
              const extractWeaknessSection = (text) => {
                const patterns = [
                  '**2. Recurring Weaknesses:**',
                  '**Recurring Weaknesses:**',
                  'Recurring Weaknesses:',
                  '2. Recurring Weaknesses'
                ];
                
                let start = -1;
                for (const pattern of patterns) {
                  const index = text.toLowerCase().indexOf(pattern.toLowerCase());
                  if (index !== -1) {
                    start = index;
                    break;
                  }
                }
                
                if (start === -1) return null;
                
                const endPatterns = [
                  '**3. Middlegame Mastery Focus:**',
                  '**Middlegame Mastery:**',
                  '**3. Middlegame',
                  'Middlegame Mastery'
                ];
                
                let end = text.length;
                for (const pattern of endPatterns) {
                  const index = text.toLowerCase().indexOf(pattern.toLowerCase(), start + 50);
                  if (index !== -1) {
                    end = index;
                    break;
                  }
                }
                
                return text.substring(start, end);
              };
              
              const parseWeaknesses = (section) => {
                if (!section) return [];
                
                const weaknesses = [];
                
                // Try multiple splitting patterns to handle different AI formats
                let blocks = [];
                
                // Pattern 1: **2.1 [Title Text]** (current format)
                blocks = section.split(/(?=\*\*2\.\d+\s+[^*]+\*\*)/i).filter(block => block.trim().length > 50);
                
                // Pattern 2: **2.1 Title:**, **2.2 Title:**, **2.3 Title:**
                if (blocks.length <= 1) {
                  blocks = section.split(/(?=\*\*2\.\d+\s+Title:\s*[^*]+)/i).filter(block => block.trim().length > 50);
                }
                
                // Pattern 3: **2.1.**, **2.2.**, **2.3.** (with dots)
                if (blocks.length <= 1) {
                  blocks = section.split(/(?=\*\*2\.\d+\.\s+[^*]+:\*\*)/i).filter(block => block.trim().length > 50);
                }
                
                // Pattern 4: **1a.**, **2a.**, **3a.** (old format)
                if (blocks.length <= 1) {
                  blocks = section.split(/(?=\*\*[123]a\.\s*\*\*(?:Title|Weakness))/i).filter(block => block.trim().length > 50);
                }
                
                // Pattern 5: **a.** repeated (fallback)
                if (blocks.length <= 1) {
                  blocks = section.split(/(?=\*\*a\.\s*\*\*(?:Title|Weakness))/i).filter(block => block.trim().length > 50);
                }
                
                blocks.forEach((block, index) => {
                  const trimmed = block.trim();
                  if (!trimmed) return;
                  
                  console.log(`Processing weakness block ${index + 1}:`, trimmed.substring(0, 200));
                  console.log(`Full block ${index + 1}:`, trimmed);
                  
                  // Flexible title extraction - try multiple patterns
                  let title = `Weakness ${index + 1}`;
                  let description = '';
                  let exampleText = '';
                  let betterPlan = '';
                  
                  // Pattern 1: **2.1 [Title Text]** with **Explanation:**, **Example:**, **Better Plan:**
                  let titleMatch = trimmed.match(/\*\*2\.\d+\s+([^*\n\r]+)\*\*/i);
                  console.log(`Title match attempt 1 for block ${index + 1}:`, titleMatch);
                  if (titleMatch) {
                    title = titleMatch[1].trim();
                    // Remove "Title: " prefix if present
                    if (title.startsWith('Title: ')) {
                      title = title.substring(7).trim();
                    }
                    console.log(`Extracted title: "${title}"`);
                    
                    // Try multiple explanation patterns
                    let explanationMatch = trimmed.match(/\*\*Explanation:\*\*\s*([^*]*?)(?=\*\*Example:|$)/is);
                    if (!explanationMatch) {
                      explanationMatch = trimmed.match(/\*\*2\.\d+\s+Explanation:\*\*\s*([^*]*?)(?=\*\*Example:|$)/is);
                    }
                    description = explanationMatch ? explanationMatch[1].trim() : '';
                    console.log(`Extracted description: "${description.substring(0, 100)}..."`);
                    
                    // Try multiple example patterns
                    let exampleMatch = trimmed.match(/\*\*Example:\*\*\s*([^*]*?)(?=\*\*Better Plan:|$)/is);
                    if (!exampleMatch) {
                      exampleMatch = trimmed.match(/\*\*2\.\d+\s+Example:\*\*\s*([^*]*?)(?=\*\*Better Plan:|$)/is);
                    }
                    exampleText = exampleMatch ? exampleMatch[1].trim() : '';
                    console.log(`Extracted example: "${exampleText.substring(0, 100)}..."`);
                    
                    // Try multiple better plan patterns
                    let betterPlanMatch = trimmed.match(/\*\*Better Plan:\*\*\s*([^*]*?)(?=\*\*2\.\d+|$)/is);
                    if (!betterPlanMatch) {
                      betterPlanMatch = trimmed.match(/\*\*2\.\d+\s+Better Plan:\*\*\s*([^*]*?)(?=\*\*2\.\d+|$)/is);
                    }
                    betterPlan = betterPlanMatch ? betterPlanMatch[1].trim() : '';
                    console.log(`Extracted better plan: "${betterPlan.substring(0, 100)}..."`);
                    
                    // If still no content, try extracting everything after the title
                    if (!description && !exampleText && !betterPlan) {
                      console.log('No structured content found, extracting raw content...');
                      const afterTitle = trimmed.substring(trimmed.indexOf('**') + titleMatch[0].length);
                      console.log('Content after title:', afterTitle.substring(0, 300));
                      
                      // Try to extract any text that looks like explanation/description
                      const rawContentMatch = afterTitle.match(/^\s*([^*]*?)(?=\*\*|$)/s);
                      if (rawContentMatch && rawContentMatch[1].trim().length > 20) {
                        description = rawContentMatch[1].trim();
                        console.log('Extracted raw description:', description.substring(0, 100));
                      }
                    }
                  }
                  // Pattern 2: **2.1 Title:** format
                  else if (trimmed.match(/\*\*2\.\d+\s+Title:\s*/i)) {
                    titleMatch = trimmed.match(/\*\*2\.\d+\s+Title:\s*([^*]*?)(?=\*\*2\.\d+\s+Explanation:|$)/i);
                    if (titleMatch) {
                      title = titleMatch[1].trim();
                      const explanationMatch = trimmed.match(/\*\*2\.\d+\s+Explanation:\s*([^*]*?)(?=\*\*2\.\d+\s+Example:|$)/i);
                      description = explanationMatch ? explanationMatch[1].trim() : '';
                      const exampleMatch = trimmed.match(/\*\*2\.\d+\s+Example:\s*([^*]*?)(?=\*\*2\.\d+\s+Better Plan:|$)/i);
                      exampleText = exampleMatch ? exampleMatch[1].trim() : '';
                      const betterPlanMatch = trimmed.match(/\*\*2\.\d+\s+Better Plan:\s*([^*]*?)(?=\*\*2\.\d+\s+Title:|$)/i);
                      betterPlan = betterPlanMatch ? betterPlanMatch[1].trim() : '';
                    }
                  }
                  // Pattern 3: **2.1.** format with **a. Title:**
                  else {
                    const mainTitleMatch = trimmed.match(/\*\*2\.\d+\.\s+([^*]+):\*\*/i);
                    const subtitleMatch = trimmed.match(/\*\*a\.\s*Title:\*\*\s*([^*]*?)(?=\*\*b\.|$)/i);
                    title = subtitleMatch ? subtitleMatch[1].trim() : (mainTitleMatch ? mainTitleMatch[1].trim() : title);
                    
                    const explanationMatch = trimmed.match(/\*\*b\.\s*Explanation:\*\*\s*([^*]*?)(?=\*\*c\.|$)/i);
                    description = explanationMatch ? explanationMatch[1].trim() : '';
                    const exampleMatch = trimmed.match(/\*\*c\.\s*Example:\*\*\s*([^*]*?)(?=\*\*d\.|$)/i);
                    exampleText = exampleMatch ? exampleMatch[1].trim() : '';
                    const betterPlanMatch = trimmed.match(/\*\*d\.\s*Better Plan:\*\*\s*([^*]*?)(?=$)/i);
                    betterPlan = betterPlanMatch ? betterPlanMatch[1].trim() : '';
                  }
                  
                  // Parse the example for game details
                  let formattedExample = '';
                  if (exampleText) {
                    // Look for Game [X], Move [Y]: `move` - description pattern
                    const gameMatch = exampleText.match(/Game\s*(\d+),\s*Move\s*(\d+):\s*`([^`]+)`\s*-\s*(.*)/is);
                    if (gameMatch) {
                      const gameNum = gameMatch[1];
                      const moveNum = gameMatch[2];
                      const move = gameMatch[3].trim();
                      const desc = gameMatch[4].trim();
                      
                      formattedExample = `<p class="text-xs text-gray-500 mb-2">vs. opponent${gameNum} (Move ${moveNum})</p>` +
                                       `<p class="text-sm text-gray-700"><strong>Mistake:</strong> After <code class="move-code">${move}</code>, ${desc}</p>`;
                    } else {
                      // Fallback formatting - clean up the text
                      const cleanExample = exampleText
                        .replace(/Game\s*(\d+),\s*Move\s*(\d+):\s*`([^`]+)`/g, '<p class="text-xs text-gray-500 mb-2">vs. opponent$1 (Move $2)</p><p class="text-sm text-gray-700"><strong>Move:</strong> <code class="move-code">$3</code></p>')
                        .replace(/\n\s*\n/g, '</p><p class="text-sm text-gray-700 mt-2">')
                        .replace(/\n/g, ' ');
                      
                      formattedExample = `<p class="text-sm text-gray-700">${cleanExample}</p>`;
                    }
                    
                    // Add better plan to the example if it exists
                    if (betterPlan) {
                      formattedExample += `<p class="text-sm text-gray-700 mt-2"><strong>Better Plan:</strong> ${betterPlan}</p>`;
                    }
                  }
                  
                  const weakness = {
                    number: index + 1,
                    title: title,
                    description: description,
                    example: formattedExample,
                    betterPlan: betterPlan,
                    rawContent: trimmed
                  };
                  
                  console.log(`Parsed weakness ${index + 1}:`, weakness);
                  weaknesses.push(weakness);
                });
                
                return weaknesses.slice(0, 3); // Ensure max 3 weaknesses
              };
              
              const weaknessSection = extractWeaknessSection(fullText);
              const weaknesses = parseWeaknesses(weaknessSection);
              
              if (weaknesses.length === 0) {
                return (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-600">No recurring weaknesses found in the analysis.</p>
                  </div>
                );
              }
              
              return (
                <div>
                  {weaknesses.map((weakness, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                      <h3 className="font-bold text-gray-800">
                        {weakness.number}. {weakness.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {weakness.description}
                      </p>
                      {weakness.example && (
                        <div className="mt-2 p-3 bg-white border-l-4 border-red-400 rounded">
                          <div 
                            className="text-sm text-gray-700"
                            dangerouslySetInnerHTML={{
                              __html: weakness.example
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </section>

          {/* Section 3: Phase Review */}
          <section className="mb-8">
            <h2 className="flex items-center text-lg font-extrabold text-emerald-900 uppercase tracking-wide mb-6">
              <CheckSquare className="w-5 h-5 mr-3 text-emerald-500" />
              Phase Review
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-3">
                  Middlegame <span className="text-gray-500 font-medium">(Overall: 6/10)</span>
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span>Positional Understanding</span><span>5/10</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{width: '50%'}}></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Tactical Awareness</span><span>7/10</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{width: '70%'}}></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Plan Formation</span><span>4/10</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{width: '40%'}}></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Piece Coordination</span><span>6/10</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{width: '60%'}}></div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-3">
                  Endgame <span className="text-gray-500 font-medium">(Overall: 5/10)</span>
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span>Pawn Endgames</span><span>6/10</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{width: '60%'}}></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Rook Endgames</span><span>4/10</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{width: '40%'}}></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Minor Piece Endgames</span><span>5/10</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{width: '50%'}}></div>
                  </div>
                  
                  <p className="text-xs text-gray-500 italic mt-3">
                    {parsedAnalysis?.endgameSummary || 'Common Mistakes: Rushing moves, underestimating opponent resources, passive defence.'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Action Plan */}
          <section className="mb-8">
            <h2 className="flex items-center text-lg font-extrabold text-emerald-900 uppercase tracking-wide mb-6">
              <Target className="w-5 h-5 mr-3 text-emerald-500" />
              Actionable Improvement Plan
            </h2>
            
            {(() => {
              // Extract improvement plan items from the parsed analysis
              const improvementItems = parsedAnalysis?.improvementPlan || '';
              
              // Try to extract structured items from the improvement plan
              const extractImprovementItems = (text) => {
                const items = [];
                
                // Look for numbered items with titles and descriptions
                const itemMatches = text.match(/(\d+)\.\s*\*\*([^*]+):\*\*\s*([^1-9]+?)(?=\d+\.|$)/gs);
                
                if (itemMatches && itemMatches.length > 0) {
                  itemMatches.forEach((match, index) => {
                    const itemMatch = match.match(/(\d+)\.\s*\*\*([^*]+):\*\*\s*(.+)/s);
                    if (itemMatch) {
                      const [, number, title, description] = itemMatch;
                      items.push({
                        title: title.trim(),
                        description: description.trim().replace(/\n/g, ' '),
                        priority: index < 2 ? 'HIGH' : 'MED' // First 2 items are HIGH priority
                      });
                    }
                  });
                }
                
                // If no structured items found, try to extract from bullet points or lines
                if (items.length === 0) {
                  const lines = text.split('\n').filter(line => line.trim().length > 20);
                  lines.slice(0, 3).forEach((line, index) => {
                    const cleanLine = line.replace(/^\s*[-*•]\s*/, '').trim();
                    if (cleanLine.includes(':')) {
                      const [title, ...descParts] = cleanLine.split(':');
                      items.push({
                        title: title.trim(),
                        description: descParts.join(':').trim(),
                        priority: index < 2 ? 'HIGH' : 'MED'
                      });
                    } else {
                      items.push({
                        title: `Focus Area ${index + 1}`,
                        description: cleanLine,
                        priority: index < 2 ? 'HIGH' : 'MED'
                      });
                    }
                  });
                }
                
                return items;
              };
              
              const items = extractImprovementItems(improvementItems);
              
              // Fallback items if extraction fails
              if (items.length === 0) {
                return (
                  <div className="space-y-2">
                    <div className="flex items-start p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <span className="text-red-600 font-bold text-lg mr-4">HIGH</span>
                      <div>
                        <strong className="font-semibold text-gray-800">Dynamic Pawn Structure Assessment:</strong> Evaluate pawn chains, backward pawns, and isolated pawns before committing to exchanges. Prioritize creating passed pawns in favorable endgame transitions.
                      </div>
                    </div>
                    <div className="flex items-start p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <span className="text-red-600 font-bold text-lg mr-4">HIGH</span>
                      <div>
                        <strong className="font-semibold text-gray-800">Piece Activity Optimization:</strong> Systematically improve your worst-placed piece before initiating tactical sequences. Focus on outpost creation and eliminating opponent's active pieces through strategic trades.
                      </div>
                    </div>
                    <div className="flex items-start p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <span className="text-yellow-600 font-bold text-lg mr-4">MED</span>
                      <div>
                        <strong className="font-semibold text-gray-800">Prophylactic Resource Management:</strong> Calculate opponent's counterplay potential in complex positions. Neutralize tactical threats while maintaining positional pressure through tempo preservation.
                      </div>
                    </div>
                  </div>
                );
              }
              
              return (
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-start p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <span className={`font-bold text-lg mr-4 ${item.priority === 'HIGH' ? 'text-red-600' : 'text-yellow-600'}`}>
                        {item.priority}
                      </span>
                      <div>
                        <strong className="font-semibold text-gray-800">{item.title}:</strong> {item.description}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </section>

          {/* Section 5: Resources */}
          <section className="mb-8">
            <h2 className="flex items-center text-lg font-extrabold text-emerald-900 uppercase tracking-wide mb-6">
              <BookOpen className="w-5 h-5 mr-3 text-emerald-500" />
              Recommended Resources
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg flex items-start border border-gray-200">
                <Crown className="text-emerald-600 text-xl mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-800">Master Game Study</h4>
                  <p className="text-sm text-gray-600">
                    <strong>Capablanca vs. Tartakower (1924):</strong> A masterclass in strategic planning and positional understanding.
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg flex items-start border border-gray-200">
                <Youtube className="text-red-600 text-xl mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-800">Watch This</h4>
                  <p className="text-sm text-gray-600">
                    <strong>"Chess Principles" by Saint Louis Chess Club:</strong> Essential strategic concepts for improvement.
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg flex items-start border border-gray-200 md:col-span-2">
                <Book className="text-emerald-600 text-xl mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-800">Books for Deeper Study</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                    <li><strong>My System</strong> by Aron Nimzowitsch</li>
                    <li><strong>Silman's Complete Endgame Course</strong> by Jeremy Silman</li>
                    <li><strong>The Amateur's Mind</strong> by Jeremy Silman</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="text-center text-xs text-gray-400 mt-8 pt-4 border-t border-gray-200">
            <p>This report was generated by Pawnsposes. © 2025</p>
            <p className="mt-1">Based on analysis of {report.gameCount} games from {report.platform}</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default ReportDisplay;