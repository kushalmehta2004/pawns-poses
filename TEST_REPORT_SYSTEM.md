# Testing the Chess Report System

## 🚀 Quick Test Guide

### Prerequisites
1. Make sure you have added the Gemini API key to your `.env` file:
   ```
   REACT_APP_GEMINI_API_KEY=your_actual_api_key_here
   ```

2. Start the development server:
   ```bash
   npm start
   ```

### Test Steps

1. **Navigate to Reports**
   - Open your browser to `http://localhost:3000`
   - Click on the "Reports" tab in the header
   - You should see the report generation page

2. **Test Username Validation**
   - Try entering a valid Lichess username (e.g., "magnus", "hikaru")
   - Or a valid Chess.com username
   - The system should validate the username exists

3. **Generate a Test Report**
   - Platform: Choose "Lichess" (generally more reliable)
   - Username: Enter a valid username with recent games
   - Game Count: Start with 5-10 games for faster testing
   - Game Type: "All Games"
   - Click "Generate Report"

4. **Monitor Progress**
   - Watch the progress bar during generation
   - Check browser console for detailed logs
   - Report generation should take 1-3 minutes

### Expected Behavior

✅ **Success Indicators:**
- Username validation shows green checkmark
- Progress bar advances through stages
- Report displays with all sections populated
- No console errors (warnings are okay)

⚠️ **Common Issues & Solutions:**

1. **"Invalid move" errors in console:**
   - This is now handled gracefully
   - Games with parsing errors are filtered out
   - Report generation continues with valid games

2. **API errors:**
   - Check your Gemini API key is correct
   - Ensure you have API quota available
   - System will fall back to basic analysis if AI fails

3. **No games found:**
   - Try a different username
   - Check the username exists on the selected platform
   - Ensure the user has recent games

### Test Users (Public Profiles)

**Lichess:**
- "magnus" (Magnus Carlsen)
- "hikaru" (Hikaru Nakamura)
- "gothamchess" (Levy Rozman)

**Chess.com:**
- "magnuscarlsen"
- "hikaru"
- "gmhikaru"

### Debugging

If you encounter issues, check the browser console for:
- FEN extraction logs (🔍 [FEN EXTRACTOR])
- Report generation logs (📊 [REPORT GENERATION])
- API errors or rate limiting messages

### Next Steps

Once basic functionality works:
1. Test with different platforms
2. Try various game counts
3. Test the PDF export feature
4. Customize the styling to match your brand

### Contact

If you need help with:
- API key setup
- Custom styling
- Additional features
- Bug fixes

Please refer to the setup documentation or reach out for support.