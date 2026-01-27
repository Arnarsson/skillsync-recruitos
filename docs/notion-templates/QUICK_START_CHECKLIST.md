# Notion Setup - Quick Start Checklist

**Estimated Time:** 2 hours  
**Owner:** Sven (lead), Team (execution)

---

## ⏱️ Phase 1: Initial Setup (30 minutes)

### Sven's Tasks:
- [ ] Go to [notion.so](https://notion.so)
- [ ] Create new workspace named "RecruitOS"
- [ ] Set workspace icon (use RecruitOS logo or 🎯)
- [ ] Invite team members:
  - [ ] Christopher (admin access)
  - [ ] Hjalti (full access)
- [ ] Create a "Getting Started" page with link to this guide

### Everyone:
- [ ] Accept Notion invitation
- [ ] Download Notion desktop app (optional but recommended)
- [ ] Download Notion mobile app
- [ ] Verify you can access the workspace

---

## 📊 Phase 2: Create Databases (45 minutes)

### Person: Christopher (or whoever is comfortable with Notion)

**Meeting Notes Database:**
- [ ] Create new database (full page)
- [ ] Rename to "📝 Meeting Notes"
- [ ] Add properties:
  - [ ] Date (Date)
  - [ ] Meeting Type (Select: Weekly Sync, Customer Call, Strategy, Sprint Planning)
  - [ ] Attendees (Multi-select: Sven, Christopher, Hjalti)
  - [ ] Status (Select: Draft, Completed)
  - [ ] Recording Link (URL)
- [ ] Import `meeting-notes-template.md` as first entry (example)
- [ ] Create template from example

**Action Items Database:**
- [ ] Create new database (full page)
- [ ] Rename to "✅ Action Items"
- [ ] Import `action-items-template.csv`
- [ ] Verify all properties imported correctly
- [ ] Create filtered views:
  - [ ] "My Tasks" (filtered by current user)
  - [ ] "This Week" (due date within 7 days)
  - [ ] "By Priority" (grouped by priority)

**Customer Feedback Database:**
- [ ] Create new database (full page)
- [ ] Rename to "💬 Customer Feedback"
- [ ] Add properties (see NOTION_SETUP_GUIDE.md for full list)
- [ ] Import `customer-feedback-template.md` as example
- [ ] Create template

---

## 🏠 Phase 3: Build Dashboard (30 minutes)

### Person: Sven

- [ ] Create new page named "🏠 Dashboard"
- [ ] Set as homepage (Settings → Workspace → Home)
- [ ] Add sections:
  - [ ] **Quick Links** (callout with links to key pages)
  - [ ] **Recent Meetings** (linked database view of Meeting Notes, sorted by date)
  - [ ] **My Action Items** (linked database view, filtered to current user)
  - [ ] **Hot Leads** (linked database view of Customer Feedback, filtered to "Hot Lead")
- [ ] Pin Dashboard to sidebar
- [ ] Add emoji/icon for visual hierarchy

---

## 📁 Phase 4: Create Wiki Structure (15 minutes)

### Person: Hjalti

- [ ] Create page "📚 Product Specs"
- [ ] Create subpages:
  - [ ] Core Features
  - [ ] Integrations
  - [ ] Technical Architecture
  - [ ] Roadmap
- [ ] Add toggle lists for organization
- [ ] Pin to sidebar

- [ ] Create page "💰 Pricing & Business Model"
- [ ] Add sections from NOTION_SETUP_GUIDE.md
- [ ] Pin to sidebar

- [ ] Create page "🔗 Resources & Links"
- [ ] Add links to:
  - [ ] GitHub repo
  - [ ] Vercel dashboard
  - [ ] Figma files
  - [ ] Analytics
- [ ] Pin to sidebar

---

## 📦 Phase 5: Migration (1-2 hours, ongoing)

### From HackMD (Christopher):
- [ ] List all meeting notes in HackMD
- [ ] Migrate last 3 meetings to Notion (as examples)
- [ ] Extract action items and add to Action Items DB
- [ ] Archive old HackMD notes (keep as backup, stop updating)

### From Google Docs (Sven):
- [ ] Import pricing doc to "💰 Pricing & Business Model" page
- [ ] Import any product specs to "📚 Product Specs"
- [ ] Copy instead of move (keep Google Docs as backup initially)

### From WhatsApp (Team):
- [ ] Review last 2 weeks of group chat
- [ ] Extract key customer feedback → create entries in Customer Feedback DB
- [ ] Identify open action items → add to Action Items DB
- [ ] **Don't try to migrate everything** — just capture what's still relevant

### From Email (Sven):
- [ ] Forward important customer conversations to Notion email address
- [ ] Or manually create Customer Feedback entries for key contacts

---

## ✅ Phase 6: Team Training (15 minutes)

### Quick Sync Meeting:
- [ ] Schedule 15-min team call
- [ ] Walk through Dashboard together
- [ ] Show how to create meeting notes
- [ ] Show how to add action items
- [ ] Agree on daily/weekly habits (see NOTION_SETUP_GUIDE.md)

---

## 🎯 Success Criteria (Check after 1 week)

- [ ] All team members logged in at least 3 times
- [ ] Last 2 meetings have notes in Notion
- [ ] At least 10 action items tracked with owners
- [ ] At least 3 customer feedback entries created
- [ ] Zero "where did we write that?" questions in WhatsApp

---

## 🆘 Troubleshooting

**Problem:** Can't find a specific database  
**Solution:** Use search (Cmd/Ctrl + P), or pin important DBs to sidebar

**Problem:** Too many notifications  
**Solution:** Settings → Notifications → Customize per database

**Problem:** Templates not working  
**Solution:** Make sure you created them from the database menu (⋮ → Templates)

**Problem:** Person can't access a page  
**Solution:** Check page sharing settings (top right → Share)

---

## 📞 Questions?

Drop in WhatsApp group and we'll update this guide!

**Good luck! 🚀**
