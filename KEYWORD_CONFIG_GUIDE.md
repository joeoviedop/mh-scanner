# 🔧 Keyword Configuration System - Quick Start Guide

## Overview
The keyword configuration system allows you to manage the therapy keywords that the LLM uses for transcript analysis. You can add, edit, delete, and organize keywords by category and priority.

## 🚀 Getting Started

### 1. Access Configuration Page
- Navigate to `/dashboard/config` in your application
- You'll see either an empty state (if no keywords exist) or the keyword management interface

### 2. Initialize Default Keywords
If this is your first time using the system:

1. **Click "Initialize Default Keywords"** on the empty state page
2. This will add 130+ pre-configured therapy keywords organized in 9 categories
3. The system will confirm initialization with a success message

### 3. Browse and Filter Keywords
Once keywords are loaded, you can:

- **Search**: Type in the search box to find specific keywords
- **Filter by Category**: Select from dropdown (Core Therapy, Mental Health, Treatment, etc.)
- **Filter by Priority**: Choose High/Medium/Low priority keywords
- **Show/Hide Inactive**: Toggle to see disabled keywords

## 🏷️ **Keyword Categories**

| Category | Description | Examples |
|----------|-------------|----------|
| 🎯 Core Therapy | Essential therapy terms | terapia, psicólogo, terapeuta |
| 🧠 Mental Health | General mental health | salud mental, bienestar mental |
| 💊 Treatment | Treatment types | terapia familiar, consulta psicológica |
| 📋 Conditions | Mental health conditions | ansiedad, depresión, trauma |
| 🚨 Crisis | Crisis situations | autolesión, crisis de pánico |
| 👤 Personal | Personal experiences | mi terapeuta, fui a terapia |
| 🤝 Support | Support systems | apoyo psicológico |
| 💭 Emotional | Emotional management | manejo de emociones |
| 🔬 Therapeutic | Therapeutic concepts | mindfulness, duelo |

## ✏️ **Managing Keywords**

### Add New Keyword
1. Click **"Add Keyword"** button
2. Fill in the form:
   - **Keyword**: The word/phrase to detect (e.g., "terapia online")
   - **Category**: Choose from existing categories or "Custom"
   - **Priority**: High (most important), Medium, or Low
   - **Description**: Optional context for when to use this keyword
   - **Active**: Whether to use this keyword in detection
3. Click **"Add Keyword"**

### Edit Existing Keyword
1. Find the keyword in the list
2. Click the **"Edit"** button
3. Modify any field in the form
4. Click **"Update Keyword"**

### Quick Actions
- **Toggle Active/Inactive**: Click the green/yellow toggle button
- **Delete**: Click the red "Delete" button (with confirmation)

## 🔄 **How Keywords Affect Detection**

### Priority Weighting
- **High Priority**: Keywords carry more weight in LLM analysis
- **Medium Priority**: Standard weighting
- **Low Priority**: Lower influence on detection

### Active/Inactive Status
- **Active**: Used in transcript analysis
- **Inactive**: Ignored during processing
- Only active keywords are sent to the LLM

### Text Matching
- Keywords use fuzzy matching (ignores accents, case)
- Partial matches are detected (e.g., "terapia" matches "terapia familiar")
- Normalized text matching for Spanish characters

## 🧪 **Testing Your Configuration**

### Test Detection Flow
1. Add or modify keywords in `/dashboard/config`
2. Go to `/dashboard/episodes`
3. Process a transcript with "Detect Mentions"
4. Verify new keywords are detected in the results

### API Testing
You can also test via direct API calls:

```bash
# Get all keywords
curl http://localhost:3000/api/config/keywords

# Add a new keyword
curl -X POST http://localhost:3000/api/config/keywords \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "psicoterapia",
    "category": "therapy_core", 
    "priority": "high",
    "description": "Alternative term for therapy"
  }'

# Initialize default keywords
curl -X POST http://localhost:3000/api/config/keywords/initialize
```

## 📊 **Best Practices**

### Keyword Selection
- **Be Specific**: Use phrases that clearly indicate therapy discussions
- **Consider Context**: Think about how people actually talk about therapy
- **Include Variations**: Add both formal and informal terms
- **Regional Terms**: Include local variations of therapy terms

### Category Organization
- Use existing categories when possible
- Create custom categories sparingly
- Keep related terms in the same category

### Priority Assignment
- **High**: Core therapy terms, direct personal experiences
- **Medium**: Supporting terms, conditions, treatment types
- **Low**: General emotional terms, broad concepts

## 🚨 **Troubleshooting**

### Common Issues

**"No active keywords configured for detection"**
- Check that you have active keywords in the configuration
- Ensure at least some keywords are marked as "Active"

**Keywords not being detected**
- Verify the keyword is marked as "Active"
- Check spelling and exact phrasing
- Test with simpler, more direct terms first

**Performance issues**
- Too many keywords can slow detection
- Focus on the most important 50-100 keywords
- Deactivate rarely-used terms instead of deleting

### Database Reset
If you need to start over:
1. Clear all keywords through the UI
2. Or contact your developer to reset the `keywordConfig` table
3. Re-initialize with default keywords

## 🔮 **Future Enhancements**

Coming soon:
- Import/export keyword configurations
- Keyword effectiveness analytics
- Synonym management
- Regex pattern support
- A/B testing for keyword sets

---

**Need Help?** The configuration system provides real-time feedback and error messages. If you encounter issues, check the browser console for detailed error information.
