"use client";

import React, { useState } from "react";

interface Fragment {
  _id: string;
  startTime: number;
  endTime: number;
  matchedText: string;
  contextText: string;
  matchedKeywords: string[];
  videoId: string;
  classification: {
    tema: string;
    tono: "positiva" | "neutral" | "negativa";
    sensibilidad: string[];
    confianza: number;
    razon?: string;
  };
  confidenceScore: number;
  detectedAt: number;
}

interface MentionResultsProps {
  fragments: Fragment[];
  episodeTitle?: string;
  channelName?: string;
  onRefresh?: () => void;
}

const THEME_COLORS = {
  "terapia_individual": "bg-blue-100 text-blue-800",
  "terapia_familiar": "bg-purple-100 text-purple-800",
  "salud_mental": "bg-green-100 text-green-800",
  "ansiedad": "bg-yellow-100 text-yellow-800",
  "depresion": "bg-orange-100 text-orange-800",
  "trauma": "bg-red-100 text-red-800",
  "autoestima": "bg-pink-100 text-pink-800",
  "duelo": "bg-gray-100 text-gray-800",
  "otros": "bg-indigo-100 text-indigo-800",
};

const TONE_ICONS = {
  positiva: "😊",
  neutral: "😐",
  negativa: "😟",
};

const SENSITIVITY_COLORS = {
  autolesion: "bg-red-100 text-red-800",
  suicidio: "bg-red-200 text-red-900",
  abuso: "bg-red-100 text-red-800",
  trauma: "bg-orange-100 text-orange-800",
  crisis: "bg-yellow-100 text-yellow-800",
  ninguna: "bg-green-100 text-green-800",
};

export default function MentionResults({ 
  fragments, 
  episodeTitle, 
  channelName,
  onRefresh 
}: MentionResultsProps) {
  const [sortBy, setSortBy] = useState<"time" | "confidence" | "theme">("time");
  const [filterTheme, setFilterTheme] = useState<string>("all");
  const [filterSensitivity, setFilterSensitivity] = useState<string>("all");

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getYouTubeUrl = (videoId: string, startTime: number) => {
    return `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(startTime)}s`;
  };

  const copyTimestamp = (startTime: number) => {
    const timestamp = formatTime(startTime);
    navigator.clipboard.writeText(timestamp);
    // Could add a toast notification here
  };

  const sortedFragments = [...fragments].sort((a, b) => {
    switch (sortBy) {
      case "time":
        return a.startTime - b.startTime;
      case "confidence":
        return b.confidenceScore - a.confidenceScore;
      case "theme":
        return a.classification.tema.localeCompare(b.classification.tema);
      default:
        return 0;
    }
  });

  const filteredFragments = sortedFragments.filter(fragment => {
    if (filterTheme !== "all" && fragment.classification.tema !== filterTheme) {
      return false;
    }
    if (filterSensitivity !== "all") {
      if (filterSensitivity === "none") {
        return fragment.classification.sensibilidad.includes("ninguna");
      } else {
        return fragment.classification.sensibilidad.includes(filterSensitivity);
      }
    }
    return true;
  });

  const themes = Array.from(new Set(fragments.map(f => f.classification.tema)));
  const sensitivities = Array.from(
    new Set(fragments.flatMap(f => f.classification.sensibilidad))
  ).filter(s => s !== "ninguna");

  const getFragmentDuration = (fragment: Fragment) => {
    return fragment.endTime - fragment.startTime;
  };

  const getTotalDuration = () => {
    return filteredFragments.reduce((total, fragment) => {
      return total + getFragmentDuration(fragment);
    }, 0);
  };

  if (fragments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Mental Health Mentions Found</h3>
        <p className="text-gray-600 mb-4">
          The AI analysis didn&apos;t detect any therapy or mental health discussions in this episode.
        </p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            🔄 Reanalyze Episode
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              🎯 Mental Health Mentions Analysis
            </h2>
            <div className="text-sm text-gray-600 space-y-1">
              {episodeTitle && <div><strong>Episode:</strong> {episodeTitle}</div>}
              {channelName && <div><strong>Channel:</strong> {channelName}</div>}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{filteredFragments.length}</div>
            <div className="text-sm text-gray-600">mentions found</div>
            <div className="text-xs text-gray-500 mt-1">
              ~{Math.round(getTotalDuration())}s total content
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="time">⏰ Time</option>
              <option value="confidence">🎯 Confidence</option>
              <option value="theme">🏷️ Theme</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Theme:</label>
            <select
              value={filterTheme}
              onChange={(e) => setFilterTheme(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Themes</option>
              {themes.map(theme => (
                <option key={theme} value={theme}>{theme}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sensitivity:</label>
            <select
              value={filterSensitivity}
              onChange={(e) => setFilterSensitivity(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="none">No Sensitivity</option>
              {sensitivities.map(sensitivity => (
                <option key={sensitivity} value={sensitivity}>{sensitivity}</option>
              ))}
            </select>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              🔄 Refresh
            </button>
          )}
        </div>
      </div>

      {/* Fragment List */}
      <div className="space-y-4">
        {filteredFragments.map((fragment, index) => (
          <div key={fragment._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Fragment Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-blue-600">#{index + 1}</span>
                    <button
                      onClick={() => copyTimestamp(fragment.startTime)}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-mono hover:bg-blue-200 cursor-pointer"
                      title="Click to copy timestamp"
                    >
                      ⏰ {formatTime(fragment.startTime)}
                    </button>
                    <span className="text-xs text-gray-500">
                      ({Math.round(getFragmentDuration(fragment))}s duration)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      THEME_COLORS[fragment.classification.tema as keyof typeof THEME_COLORS] || THEME_COLORS.otros
                    }`}>
                      {fragment.classification.tema}
                    </span>

                    <span className="text-lg">
                      {TONE_ICONS[fragment.classification.tono]}
                    </span>

                    <div className="text-xs text-gray-600">
                      {fragment.confidenceScore}% confidence
                    </div>
                  </div>
                </div>

                <a
                  href={getYouTubeUrl(fragment.videoId, fragment.startTime)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium flex items-center gap-2"
                >
                  ▶️ Watch on YouTube
                </a>
              </div>
            </div>

            {/* Fragment Content */}
            <div className="px-6 py-4 space-y-4">
              {/* Matched Text */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">🎯 Detected Content:</h4>
                <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r">
                  <p className="text-gray-800 font-medium">{fragment.matchedText}</p>
                </div>
              </div>

              {/* Context */}
              {fragment.contextText && fragment.contextText !== fragment.matchedText && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">📝 Context:</h4>
                  <div className="p-3 bg-gray-50 border rounded">
                    <p className="text-gray-700 text-sm leading-relaxed">{fragment.contextText}</p>
                  </div>
                </div>
              )}

              {/* Keywords & Classification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">🔑 Matched Keywords:</h4>
                  <div className="flex flex-wrap gap-1">
                    {fragment.matchedKeywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">⚠️ Sensitivity Flags:</h4>
                  <div className="flex flex-wrap gap-1">
                    {fragment.classification.sensibilidad.map((sensitivity, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          SENSITIVITY_COLORS[sensitivity as keyof typeof SENSITIVITY_COLORS] || 
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {sensitivity}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Reasoning */}
              {fragment.classification.razon && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">🤖 AI Analysis:</h4>
                  <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r">
                    <p className="text-gray-700 text-sm italic">{fragment.classification.razon}</p>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="pt-2 border-t border-gray-100 text-xs text-gray-500 flex justify-between">
                <span>Detected: {new Date(fragment.detectedAt).toLocaleString()}</span>
                <span>Fragment ID: {fragment._id.slice(-8)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Collaboration Ideas */}
      {filteredFragments.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-3">💡 Collaboration Opportunities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-green-700 mb-2">🎬 Content Ideas:</h4>
              <ul className="space-y-1 text-green-600">
                <li>• Create clips from high-confidence segments</li>
                <li>• Compile &ldquo;Mental Health Moments&rdquo; playlist</li>
                <li>• Invite guests for follow-up discussions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-700 mb-2">🤝 Partnership Options:</h4>
              <ul className="space-y-1 text-green-600">
                <li>• Sponsor therapy-related segments</li>
                <li>• Offer free consultations to viewers</li>
                <li>• Create educational follow-up content</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
