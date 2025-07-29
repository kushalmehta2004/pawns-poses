import React, { useState } from 'react';
import ReportGenerator from '../components/ReportGenerator.js';
import ReportDisplay from '../components/ReportDisplay.js';
import { TrendingUp, Target, BookOpen, Lightbulb } from 'lucide-react';

const Reports = () => {
  const [currentReport, setCurrentReport] = useState(null);

  const handleReportGenerated = (report) => {
    setCurrentReport(report);
  };

  const handleBackToGenerator = () => {
    setCurrentReport(null);
  };

  if (currentReport) {
    return <ReportDisplay report={currentReport} onBack={handleBackToGenerator} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 pt-20">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Chess Performance Reports
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get comprehensive insights into your chess performance with AI-powered analysis 
            of your recent games. Discover patterns, identify weaknesses, and receive 
            personalized improvement recommendations.
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Executive Summary</h3>
            <p className="text-gray-600 text-sm">
              Get a high-level overview of your chess performance, including win rates, 
              favorite openings, and overall playing strength.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mb-4">
              <Target className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Weakness Analysis</h3>
            <p className="text-gray-600 text-sm">
              Identify recurring mistakes and patterns in your play with specific 
              examples from your games and targeted improvement suggestions.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Game Phase Analysis</h3>
            <p className="text-gray-600 text-sm">
              Deep dive into your middlegame and endgame performance with detailed 
              analysis of your tactical and positional understanding.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
              <Lightbulb className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Improvement Plan</h3>
            <p className="text-gray-600 text-sm">
              Receive a personalized roadmap for improvement with specific actions, 
              weekly goals, and recommended study materials.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Account</h3>
              <p className="text-gray-600">
                Select your chess platform (Lichess or Chess.com) and enter your username. 
                We'll fetch your recent games for analysis.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Analysis</h3>
              <p className="text-gray-600">
                Our advanced AI analyzes your games, identifying patterns, strengths, 
                weaknesses, and opportunities for improvement.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Your Report</h3>
              <p className="text-gray-600">
                Receive a comprehensive report with actionable insights and a personalized 
                improvement plan to take your chess to the next level.
              </p>
            </div>
          </div>
        </div>

        {/* Report Generator */}
        <ReportGenerator onReportGenerated={handleReportGenerated} />
      </div>
    </div>
  );
};

export default Reports;