# RecruitOS Screen Recording Script

**Target Length:** 5-7 minutes  
**Format:** MP4 (1920x1080, 30fps)  
**Audio:** Narration required  
**Date:** February 4, 2026

---

## 🎥 Pre-Recording Setup (5 minutes)

### 1. Technical Setup
```bash
# Close unnecessary applications
# Set browser to full screen (F11)
# Clear browser notifications
# Enable "Do Not Disturb" mode
# Test microphone levels
# Set screen resolution to 1920x1080
```

### 2. Browser Preparation
- **Browser:** Chrome or Firefox (latest version)
- **Zoom:** 100% (Cmd/Ctrl + 0 to reset)
- **Extensions:** Disable ad blockers, screenshot tools
- **Tabs:** Close all except demo URL

### 3. Open Demo Environment
**URL:** `https://recruit20-rllekxso6-arnarssons-projects.vercel.app?demo=true`

**Verify:**
- [ ] Demo mode activated (no login prompt)
- [ ] Sample data populated
- [ ] No payment/credit gates
- [ ] All pages load successfully

### 4. Prepare Example Query
**Search Query:** `"React TypeScript developers in Copenhagen"`

**Alternative Queries (if needed):**
- `"Python machine learning engineers Denmark"`
- `"Senior frontend developer with React experience"`
- `"Full stack developer Aarhus"`

---

## 🎬 Recording Script (Detailed)

### SCENE 1: Introduction (0:00 - 0:30)

**Visual:** Homepage (`/`)

**Script:**
> "Hi! This is RecruitOS, an AI-powered recruiting platform that changes how you find and hire developers. I'm going to show you the key features in about 5 minutes."

**Actions:**
1. Show homepage hero section
2. Scroll slowly to show key value props
3. Pause on "AI Personality Profiling" section

**Script (continued):**
> "The core problem we solve is simple: recruiters waste hours screening the wrong candidates. RecruitOS uses AI to analyze real GitHub activity and creates psychological personality profiles—before you ever send an email. Let's see how it works."

**Transition:** Click "Try Demo" button or navigate to `/search`

**Timing:** 30 seconds total

---

### SCENE 2: Search & Discovery (0:30 - 2:00)

**Visual:** Search page (`/search`)

**Script:**
> "Let's say you're hiring React developers in Copenhagen. Here's the search interface."

**Actions:**
1. **Point to search bar** (mouse hover, don't click yet)
   
   **Script:**
   > "I'll enter a natural language query. The AI understands Danish, English, and technical terms."

2. **Type query slowly:** `"React TypeScript developers in Copenhagen"`
   
   **Script (while typing):**
   > "React TypeScript developers in Copenhagen—just like talking to a recruiter."

3. **Show Hard Requirements section** (if visible)
   
   **Script:**
   > "Before searching, I can set hard requirements: location, minimum years of experience, specific skills. This filters out anyone who doesn't meet the basics."

   **Actions:** Click to expand Hard Requirements
   - Location: Copenhagen ✓
   - Skills: React, TypeScript ✓
   - Experience: 3+ years ✓

4. **Click "Search" button**
   
   **Script:**
   > "Now let's search."

   **Pause:** 2-3 seconds for results to load

5. **Show Results**
   
   **Script:**
   > "Here we go. Each candidate gets an AI matching score from 0 to 100. This isn't just skill matching—it's cultural fit, work style, team compatibility."

   **Actions:**
   - Hover over first candidate card
   - Point to score badge
   - Scroll through 3-4 candidate cards

   **Script:**
   > "Green scores mean strong alignment with your requirements. Notice these aren't just resumes—we show GitHub activity, contribution patterns, and collaboration style."

6. **Compare Candidates** (if feature available)
   
   **Script:**
   > "Let's compare a few candidates side by side."

   **Actions:**
   - Select 2-3 candidates (checkboxes)
   - Click "Compare" button
   - Show comparison view

   **Script:**
   > "Now I can see skills, experience, and personality traits side by side. This would take hours manually—here it's instant."

**Transition:** Click on a candidate to view full profile

**Timing:** 1 minute 30 seconds (total: 2:00)

---

### SCENE 3: Personality Profile Deep Dive (2:00 - 4:30)

**Visual:** Candidate profile page (`/profile/[username]`)

**Script:**
> "This is where RecruitOS really shines. This isn't a resume—it's a psychological profile built from real work patterns."

**Actions:**
1. **Top Section - Overview**
   
   **Script:**
   > "At the top, we have the GitHub overview: repositories, contributions, languages they actually use."

   **Actions:** Point to GitHub stats

2. **Scroll to Psychometric Profile**
   
   **Script:**
   > "Here's the AI-generated personality assessment. This analyzes months or years of commit patterns, code reviews, issue discussions—real behavioral data."

   **Actions:**
   - Hover over personality traits
   - Point to specific insights

   **Script:**
   > "For example, this candidate shows strong attention to detail based on code review thoroughness, collaborative work style from pair programming patterns, and independent problem-solving from solo project work."

3. **Scroll to Team Fit Analysis**
   
   **Script:**
   > "Next, team fit analysis. This predicts how they'll work with your existing team."

   **Actions:**
   - Point to collaboration score
   - Highlight communication style
   - Show work preferences

   **Script:**
   > "Communication style, meeting preferences, async vs. synchronous work—all inferred from how they actually work, not how they say they work."

4. **Scroll to Skills Breakdown**
   
   **Script:**
   > "The skills section isn't self-reported. These are extracted from actual code they've written."

   **Actions:**
   - Show skills with proficiency levels
   - Point to "Years of experience" per skill

   **Script:**
   > "We can see not just what they've listed on their resume, but what they've actually built and for how long."

5. **Scroll to Risk Assessment**
   
   **Script:**
   > "One unique feature: attrition risk scoring. Based on career trajectory, job-hopping patterns, and engagement levels."

   **Actions:**
   - Point to risk indicators
   - Show stability score

6. **Highlight Shareability**
   
   **Script:**
   > "Now here's the best part: this entire profile is shareable. You can send this link to a hiring manager, sell it to a client for 2,000 DKK, or use it internally. It's a standalone product."

   **Actions:**
   - Click "Share" button (if available)
   - Show shareable link or download PDF option

   **Script:**
   > "This single profile saves 5+ hours of screening and interviewing. You know who they are before the first email."

**Transition:** Navigate to Pipeline (`/pipeline`)

**Timing:** 2 minutes 30 seconds (total: 4:30)

---

### SCENE 4: Pipeline Management (4:30 - 5:30)

**Visual:** Pipeline/Kanban board (`/pipeline`)

**Script:**
> "Once you've found promising candidates, you need to track them through your hiring funnel. Here's the pipeline view."

**Actions:**
1. **Show Kanban Board**
   
   **Script:**
   > "This is a drag-and-drop Kanban board with customizable stages."

   **Actions:**
   - Pan across pipeline stages
   - Point to candidate cards in different columns

   **Script:**
   > "New applicants, screening, interview, offer—you define the stages."

2. **Demonstrate Drag & Drop**
   
   **Script:**
   > "Moving candidates is as simple as drag and drop."

   **Actions:**
   - Drag one candidate from "Screening" to "Interview"
   - Pause to show the movement

   **Script:**
   > "All your candidates in one place. No more spreadsheets, no more lost context."

3. **Show Candidate Details**
   
   **Actions:**
   - Click on a candidate card in pipeline
   - Show quick-view modal or sidebar

   **Script:**
   > "Click any card for quick details, or open the full profile for the complete AI assessment."

4. **Highlight Collaboration Features** (if visible)
   
   **Script:**
   > "For team recruiting, you can add notes, tag team members, and see who's working on which candidates."

   **Actions:**
   - Point to comments/notes section
   - Show activity timeline

**Transition:** Navigate to outreach (if available) or move to pricing

**Timing:** 1 minute (total: 5:30)

---

### SCENE 5: Outreach Automation (5:30 - 6:00) [OPTIONAL]

**Visual:** Outreach page or candidate profile outreach section

**Script:**
> "The final piece: personalized outreach at scale."

**Actions:**
1. **Show AI-Generated Message**
   
   **Script:**
   > "RecruitOS writes personalized emails that reference the candidate's actual work."

   **Actions:**
   - Show example outreach message
   - Point to personalized sections

   **Script:**
   > "Notice it mentions their specific projects, technologies they use, and recent contributions. This gets 3x better response rates than generic LinkedIn InMails."

2. **Show Templates** (if available)
   
   **Script:**
   > "You can customize templates, A/B test different approaches, and track responses—all in one place."

**Transition:** Prepare for pricing discussion

**Timing:** 30 seconds (total: 6:00)

---

### SCENE 6: Pricing & Value Proposition (6:00 - 6:45)

**Visual:** Stay on current page or navigate to `/pricing` if exists

**Script:**
> "Now let's talk pricing. There are two ways to use RecruitOS, depending on your needs."

**Actions:**
1. **Show pricing options** (can be screen or verbal explanation)

**Script:**
> "Option 1: Standalone Personality Profiles. 2,000 DKK per profile. Perfect if you're a consultant, doing one-off hires, or want to resell profiles to clients. No subscription, pay per use."

**Pause:** 2 seconds

**Script:**
> "Option 2: Full Recruiting Suite. 5,000 DKK per successful hire. But here's the exciting part: we're offering an early bird discount through Q2. 3,500 DKK per hire instead of 5,000. This includes unlimited searches, unlimited profiles, outreach automation—everything you've seen today."

**Pause:** 2 seconds

**Script:**
> "To put that in perspective: traditional recruiter fees are 15 to 20 percent of annual salary. For a developer making 600,000 DKK, that's 90,000 to 120,000 DKK. RecruitOS charges 3,500 DKK for the same hire. That's 95 percent savings."

**Actions:**
- Show visual comparison if available
- Or write numbers on screen (optional)

**Script:**
> "No subscription. No lock-in. Pay only when you successfully hire someone."

**Timing:** 45 seconds (total: 6:45)

---

### SCENE 7: Closing & Call to Action (6:45 - 7:00)

**Visual:** Return to homepage or stay on pricing page

**Script:**
> "That's RecruitOS: AI personality profiling from real GitHub activity, intelligent candidate search, pipeline management, and automated outreach—all for a fraction of traditional recruiting costs."

**Actions:**
- Show demo URL on screen (use text overlay or show URL bar)

**Script:**
> "The demo is fully functional—you can explore everything we just covered. I'm happy to answer questions, set up a trial search for your open roles, or lock in your early bird pricing at 3,500 DKK through Q2."

**Actions:**
- Smile at camera (if face cam is on)
- Show contact information or next steps slide

**Script:**
> "Thanks for watching! Let's revolutionize how you hire."

**Timing:** 15 seconds (total: 7:00)

---

## 🎬 Recording Flow Summary

| Timestamp | Section | Key Visuals | Duration |
|-----------|---------|-------------|----------|
| 0:00-0:30 | Introduction | Homepage, value props | 30s |
| 0:30-2:00 | Search & Discovery | Search interface, results, comparison | 1m 30s |
| 2:00-4:30 | Personality Profile | Profile deep dive, all sections | 2m 30s |
| 4:30-5:30 | Pipeline Management | Kanban board, drag-and-drop | 1m |
| 5:30-6:00 | Outreach (optional) | AI-generated messages | 30s |
| 6:00-6:45 | Pricing | Cost comparison | 45s |
| 6:45-7:00 | Closing | CTA, contact info | 15s |

**Total:** 7 minutes

---

## 🎙️ Voice & Delivery Tips

### Tone
- **Confident but conversational:** You're showing a friend, not pitching to investors
- **Energetic without rushing:** Pause for effect, don't race through
- **Problem-focused:** Always connect features back to pain points

### Pacing
- **Speak 120-150 words per minute** (moderate pace)
- **Pause 1-2 seconds** between major points
- **Emphasize numbers:** "FIVE hours saved", "95 PERCENT cost reduction"

### Energy
- **Start strong:** First 30 seconds hook attention
- **Build momentum:** Get excited about personality profiles (peak energy)
- **Confident close:** End with clear call to action

### Avoid
- ❌ "Um", "uh", filler words
- ❌ Apologizing ("Sorry if this is confusing")
- ❌ Technical jargon without explanation
- ❌ Rushing through important points

---

## 🎨 Visual Enhancements (Optional)

### Screen Overlays
- **Intro/Outro:** Add title card with your name, date
- **Key Points:** Text overlays for pricing numbers
- **Annotations:** Arrows or highlights for important features
- **Transitions:** Smooth fades between sections

### Tools for Overlays
- **Loom:** Built-in cursor emphasis and CTAs
- **Descript:** AI-powered editing and overlays
- **Camtasia:** Professional screen recording + editing
- **DaVinci Resolve:** Free, professional-grade editing

---

## 📋 Post-Recording Checklist

### Before Sharing
- [ ] Watch entire recording
- [ ] Check audio quality (no background noise)
- [ ] Verify demo mode worked throughout
- [ ] Confirm all key features were shown
- [ ] Check for awkward pauses or mistakes

### Editing (Optional)
- [ ] Trim dead space at beginning/end
- [ ] Add intro/outro cards
- [ ] Insert text overlays for key numbers
- [ ] Color correct if needed
- [ ] Add background music (low volume, optional)

### Export Settings
- **Format:** MP4 (H.264 codec)
- **Resolution:** 1920x1080 (1080p)
- **Frame Rate:** 30fps
- **Bitrate:** 5-8 Mbps
- **Audio:** AAC, 192kbps

### File Naming
```
RecruitOS_Demo_Christopher_2026-02-04.mp4
```

---

## 🚀 Publishing & Sharing

### Where to Upload
1. **Loom** (easiest): Instant shareable link
2. **Google Drive / Dropbox**: Direct download link
3. **YouTube** (unlisted): Professional hosting, good quality
4. **Vimeo**: Professional option, no ads

### Share With
- Christopher (primary recipient)
- Stakeholders Christopher mentions
- Future prospects (keep link handy)

### Include in Follow-Up Email
```
Hi Christopher,

As discussed, here's the RecruitOS demo recording:
🎥 [Video Link]

📺 Demo Link (try it yourself):
https://recruit20-rllekxso6-arnarssons-projects.vercel.app?demo=true

📄 Full documentation:
- Quick Reference: CHRISTOPHER_DEMO_QUICKREF.md
- Complete Guide: CHRISTOPHER_DEMO_GUIDE.md

💰 Pricing Recap:
- Standalone Profiles: 2,000 DKK each
- Full Recruiting: 3,500 DKK per hire (early bird, Q1-Q2 only)
- Traditional recruiter equivalent: 90-120K DKK (95% savings)

Would love to schedule a follow-up to discuss your specific hiring needs
and set up a trial search for your open roles.

Best regards,
[Your name]
```

---

## 🐛 Common Recording Issues & Fixes

### Issue: Audio sounds echoey
**Fix:** Record in smaller room, add soft furnishings, use directional mic

### Issue: Mouse cursor invisible
**Fix:** Enable "Show mouse cursor" in recording settings

### Issue: Screen tearing or lag
**Fix:** Close background apps, record at lower resolution (1280x720), upgrade hardware

### Issue: Demo mode deactivated mid-recording
**Fix:** Verify `?demo=true` in URL bar before starting, don't navigate away from demo domain

### Issue: Too many "ums" or filler words
**Fix:** Script key phrases, practice once before recording, or edit them out in post

### Issue: Recording too long (>10 minutes)
**Fix:** Cut optional sections (outreach, analytics), speed up transitions, rehearse tighter script

---

## ✅ Final Pre-Flight Checklist

**Before you hit record:**
- [ ] Demo URL open and working: `...?demo=true`
- [ ] Microphone tested and working
- [ ] Do Not Disturb enabled
- [ ] All extra tabs/windows closed
- [ ] Browser at 100% zoom, full screen
- [ ] Screen resolution 1920x1080
- [ ] Example query ready: "React TypeScript developers Copenhagen"
- [ ] Script reviewed and major points memorized
- [ ] Recording software open and tested
- [ ] Timer ready (aim for 5-7 minutes)

---

**You're ready to record! 🎬**

**Pro tip:** Do a 1-minute practice recording first to test audio/video quality before doing the full 7-minute take.

---

*Linear Issue: c6d96542-049d-4cda-9674-3eac4ef55012*  
*Project: ~/Documents/2026/Active/skillsync-recruitos*  
*Created: February 4, 2026*
