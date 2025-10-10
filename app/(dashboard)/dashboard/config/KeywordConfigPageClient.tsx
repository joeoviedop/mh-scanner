"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Keyword {
  _id: string;
  keyword: string;
  category: string;
  priority: "high" | "medium" | "low";
  description: string;
  isActive: boolean;
  lastModified: number;
}

interface KeywordConfigData {
  keywords: Keyword[];
  categories: string[];
  lastUpdated: number | null;
}

const CATEGORY_NAMES: Record<string, string> = {
  therapy_core: "🎯 Core Therapy",
  mental_health: "🧠 Mental Health",
  treatment: "💊 Treatment",
  conditions: "📋 Conditions",
  crisis: "🚨 Crisis",
  personal: "👤 Personal Experiences",
  support: "🤝 Support",
  emotional: "💭 Emotional",
  therapeutic: "🔬 Therapeutic Concepts",
};

const PRIORITY_COLORS = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-gray-100 text-gray-800",
};

export default function KeywordConfigPageClient() {
  const [data, setData] = useState<KeywordConfigData>({ keywords: [], categories: [], lastUpdated: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [showInactive, setShowInactive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Edit state
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    keyword: "",
    category: "",
    priority: "medium" as "high" | "medium" | "low",
    description: "",
    isActive: true,
  });

  useEffect(() => {
    fetchKeywords();
  }, []);

  const fetchKeywords = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/config/keywords");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch keywords");
      }

      setData(result.data);

      // If no keywords exist, show initialization option
      if (result.data.keywords.length === 0) {
        setStatusMessage("No keywords configured. Initialize with default therapy keywords?");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load keywords");
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultKeywords = async () => {
    try {
      setLoading(true);
      setError(null);
      setStatusMessage(null);

      const response = await fetch("/api/config/keywords/initialize", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to initialize keywords");
      }

      setStatusMessage(`Initialized ${result.data.count} default keywords successfully`);
      await fetchKeywords();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize keywords");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKeyword = async () => {
    if (!formData.keyword.trim() || !formData.category.trim()) {
      setError("Keyword and category are required");
      return;
    }

    try {
      setError(null);
      setStatusMessage(null);

      const payload = editingKeyword 
        ? { ...formData, id: editingKeyword._id }
        : formData;

      const response = await fetch("/api/config/keywords", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to save keyword");
      }

      const action = editingKeyword ? "updated" : "added";
      setStatusMessage(`Keyword ${action} successfully`);
      
      // Reset form
      setFormData({
        keyword: "",
        category: "",
        priority: "medium",
        description: "",
        isActive: true,
      });
      setEditingKeyword(null);
      setShowAddForm(false);

      await fetchKeywords();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save keyword");
    }
  };

  const handleDeleteKeyword = async (keyword: Keyword) => {
    if (!confirm(`Are you sure you want to delete "${keyword.keyword}"?`)) {
      return;
    }

    try {
      setError(null);
      setStatusMessage(null);

      const response = await fetch(`/api/config/keywords?id=${keyword._id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete keyword");
      }

      setStatusMessage("Keyword deleted successfully");
      await fetchKeywords();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete keyword");
    }
  };

  const handleToggleActive = async (keyword: Keyword) => {
    try {
      setError(null);

      const response = await fetch("/api/config/keywords", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: keyword._id,
          isActive: !keyword.isActive,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to toggle keyword");
      }

      await fetchKeywords();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle keyword");
    }
  };

  const startEdit = (keyword: Keyword) => {
    setEditingKeyword(keyword);
    setFormData({
      keyword: keyword.keyword,
      category: keyword.category,
      priority: keyword.priority,
      description: keyword.description,
      isActive: keyword.isActive,
    });
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingKeyword(null);
    setShowAddForm(false);
    setFormData({
      keyword: "",
      category: "",
      priority: "medium",
      description: "",
      isActive: true,
    });
  };

  // Filter keywords
  const filteredKeywords = data.keywords.filter(keyword => {
    if (selectedCategory !== "all" && keyword.category !== selectedCategory) return false;
    if (selectedPriority !== "all" && keyword.priority !== selectedPriority) return false;
    if (!showInactive && !keyword.isActive) return false;
    if (searchTerm && !keyword.keyword.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const activeCount = data.keywords.filter(k => k.isActive).length;
  const totalCount = data.keywords.length;

  if (loading && data.keywords.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading keyword configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-gray-400 hover:text-gray-600 text-sm font-medium"
              >
                ← Dashboard
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-lg font-semibold text-gray-900">Keyword Configuration</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                {activeCount} active / {totalCount} total keywords
              </div>
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Keyword
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Messages */}
        {statusMessage && (
          <div className="mb-6 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {statusMessage}
            <button
              onClick={() => setStatusMessage(null)}
              className="ml-2 text-green-600 hover:text-green-800"
            >
              ✕
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        )}

        {/* Initialize Default Keywords */}
        {data.keywords.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center mb-8">
            <div className="text-6xl mb-4">🔧</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Keywords Configured</h2>
            <p className="text-gray-600 mb-6">
              Start by initializing the default therapy keywords, or add your own manually.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={initializeDefaultKeywords}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? "Initializing..." : "Initialize Default Keywords"}
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Add Custom Keyword
              </button>
            </div>
          </div>
        )}

        {/* Add/Edit Keyword Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingKeyword ? "Edit Keyword" : "Add New Keyword"}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keyword or Phrase *
                </label>
                <input
                  type="text"
                  value={formData.keyword}
                  onChange={(e) => setFormData(prev => ({ ...prev, keyword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., terapia, mi psicólogo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select category...</option>
                  {Object.entries(CATEGORY_NAMES).map(([key, name]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as "high" | "medium" | "low" }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="When should this keyword trigger detection?"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveKeyword}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingKeyword ? "Update Keyword" : "Add Keyword"}
              </button>
              <button
                onClick={cancelEdit}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        {data.keywords.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search keywords..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Categories</option>
                  {data.categories.map((category) => (
                    <option key={category} value={category}>
                      {CATEGORY_NAMES[category] || category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Show Inactive</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Keywords List */}
        {filteredKeywords.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Keywords ({filteredKeywords.length})
              </h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {filteredKeywords.map((keyword) => (
                <div key={keyword._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          &ldquo;{keyword.keyword}&rdquo;
                        </h3>
                        
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[keyword.priority]}`}>
                          {keyword.priority}
                        </span>

                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {CATEGORY_NAMES[keyword.category] || keyword.category}
                        </span>

                        {keyword.isActive ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Inactive
                          </span>
                        )}
                      </div>

                      {keyword.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {keyword.description}
                        </p>
                      )}

                      <p className="text-xs text-gray-500">
                        Last modified: {new Date(keyword.lastModified).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleToggleActive(keyword)}
                        className={`px-3 py-1 text-xs rounded-lg ${
                          keyword.isActive
                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                            : "bg-green-100 text-green-800 hover:bg-green-200"
                        }`}
                      >
                        {keyword.isActive ? "Deactivate" : "Activate"}
                      </button>

                      <button
                        onClick={() => startEdit(keyword)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDeleteKeyword(keyword)}
                        className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-lg hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : data.keywords.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Keywords Match Filters</h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : null}

        {/* Info Box */}
        {data.keywords.length > 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              💡 How Keywords Work
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Only <strong>active</strong> keywords are used for transcript analysis</li>
              <li>• <strong>High priority</strong> keywords are weighted more heavily in detection</li>
              <li>• Keywords are matched using fuzzy text matching (ignores accents, case)</li>
              <li>• Changes take effect immediately for new transcript processing</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
