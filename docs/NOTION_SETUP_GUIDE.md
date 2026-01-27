# RecruitOS Notion Workspace Setup Guide

**Status:** Ready to implement  
**Owner:** Team lead  
**Last Updated:** January 27, 2026

## 🎯 Objective

Create a single source of truth for RecruitOS team collaboration, replacing scattered information across WhatsApp, HackMD, Google Docs, and Email.

---

## 📋 Current Pain Points

- **Scattered information** across WhatsApp group chat, HackMD, Google Docs, Email
- **Lost context** when discussions happen in chat
- **No searchable history** for decisions and customer feedback
- **Duplicated work** due to unclear action items

---

## 🏗️ Workspace Structure

### 1. **📊 Dashboard (Home)**
The landing page with quick links and status overview

**Widgets to include:**
- Recent meeting notes
- Active action items
- Current sprint status
- Customer feedback inbox
- Quick links to key pages

---

### 2. **📝 Meeting Notes**
Database for all team meetings

**Properties:**
- Date (Date)
- Meeting Type (Select: Weekly Sync, Customer Call, Strategy, Sprint Planning)
- Attendees (Multi-select: Sven, Christopher, Hjalti)
- Status (Select: Draft, In Progress, Completed)
- Action Items (Relation to Action Items DB)
- Recording Link (URL)

**Template for each meeting:**
```markdown
# [Meeting Type] - [Date]

## Attendees
- [ ] Sven
- [ ] Christopher  
- [ ] Hjalti

## Agenda
1. 
2. 
3. 

## Discussion Points

### Topic 1
- 
- 

## Decisions Made
1. 
2. 

## Action Items
- [ ] [Person] - [Task] - [Deadline]

## Next Meeting
Date: 
Agenda: 
```

---

### 3. **✅ Action Items**
Database for tracking all tasks and follow-ups

**Properties:**
- Task Name (Title)
- Owner (Select: Sven, Christopher, Hjalti, Team)
- Status (Select: Todo, In Progress, Blocked, Done)
- Priority (Select: P0 Critical, P1 High, P2 Medium, P3 Low)
- Due Date (Date)
- Related Meeting (Relation to Meeting Notes)
- Related Customer (Relation to Customers)
- Tags (Multi-select: Product, Sales, Tech, Operations)

**Views:**
- **My Tasks** (filtered by owner)
- **By Priority** (grouped by priority)
- **This Week** (filtered by due date)
- **Blocked** (filtered by status)

---

### 4. **🎨 Product Specs**
Wiki pages for product features and requirements

**Structure:**
```
📁 Product Specs/
├── Core Features/
│   ├── Job Intake Flow
│   ├── Candidate Pipeline
│   ├── Deep Profile Analysis
│   └── Outreach Generation
├── Integrations/
│   ├── GitHub Integration
│   ├── LinkedIn Scraping
│   └── BrightData API
├── Technical Architecture/
│   ├── Database Schema
│   ├── API Endpoints
│   └── Tech Stack
└── Roadmap/
    ├── Q1 2026
    ├── Q2 2026
    └── Future Ideas
```

**Template for each spec:**
```markdown
# [Feature Name]

## Status
Current: [Discovery / Design / Development / Testing / Shipped]

## Problem
What problem does this solve?

## Solution
How does this feature work?

## User Flow
1. 
2. 
3. 

## Technical Requirements
- 
- 

## Success Metrics
- 
- 

## Open Questions
- [ ] 
- [ ] 
```

---

### 5. **💬 Customer Feedback**
Database for all customer conversations and feedback

**Properties:**
- Customer Name (Title)
- Company (Text)
- Contact Type (Select: Demo, Pilot, Feedback, Support)
- Date (Date)
- Channel (Select: WhatsApp, Email, Call, In-Person)
- Status (Select: New, In Progress, Closed)
- Priority (Select: Hot Lead, Warm, Cold, Lost)
- Feedback Type (Multi-select: Feature Request, Bug, Pricing, Pain Point)
- Related Feature (Relation to Product Specs)
- Next Action (Text)

**Template:**
```markdown
# [Customer Name] - [Company]

## Context
How did we connect?

## Their Pain Points
1. 
2. 
3. 

## What They Said (Quotes)
> "..."

## Feature Requests
- 
- 

## Objections/Concerns
- 
- 

## Next Steps
- [ ] 
- [ ] 

## Notes
```

---

### 6. **💰 Pricing & Business Model**
Centralized page for pricing discussions

**Sections:**
- Current pricing model
- Competitor analysis
- Pricing experiments log
- Customer willingness-to-pay data
- Decision log (what was discussed, what was decided, why)

---

### 7. **🔗 Resources & Links**
Quick access to important resources

**Categories:**
- GitHub Repo
- Vercel Dashboard
- Analytics Dashboard
- Design Files (Figma)
- Marketing Materials
- Credentials (1Password vault link)
- Customer Demo Links

---

## 🚀 Implementation Steps

### Step 1: Create Workspace (15 min)
1. Go to [notion.so](https://notion.so)
2. Create new workspace: "RecruitOS"
3. Invite team members:
   - Sven (admin)
   - Christopher (admin)
   - Hjalti (member)

### Step 2: Set Up Databases (30 min)
1. Create Meeting Notes database
2. Create Action Items database
3. Create Customer Feedback database
4. Set up relations between databases

### Step 3: Create Dashboard (15 min)
1. Add database views to dashboard
2. Add quick links
3. Pin to sidebar

### Step 4: Migrate Existing Content (1-2 hours)
1. **From HackMD:**
   - Copy meeting notes to Notion
   - Link action items
   
2. **From Google Docs:**
   - Import pricing doc
   - Import product specs
   
3. **From WhatsApp:**
   - Create customer feedback entries for key conversations
   - Extract action items

### Step 5: Set Up Integrations (optional, 30 min)
1. **Slack Integration** (if using Slack)
   - Get Notion updates in Slack channel
   
2. **Calendar Integration**
   - Sync meetings with Google Calendar
   
3. **Linear Integration**
   - Link Linear issues to Notion action items

---

## 📱 Usage Guidelines

### Daily Habits
- **Morning:** Check "My Tasks" view for today's priorities
- **After Meetings:** Create meeting note within 1 hour
- **End of Day:** Update task statuses

### Weekly Habits
- **Monday:** Review weekly action items
- **Friday:** Archive completed items, update customer feedback

### Meeting Habits
1. Create meeting note from template BEFORE meeting
2. Take notes in real-time during meeting
3. Extract action items immediately after
4. Share Notion link in WhatsApp/Email

---

## 🔐 Access Control

**Admin Access:**
- Sven
- Christopher

**Full Access:**
- Hjalti (can edit all pages)

**Guest Access:**
- External advisors (read-only on specific pages)

---

## 📊 Success Metrics

After 2 weeks of use:
- ✅ 100% of meetings have notes in Notion
- ✅ All action items tracked with owners + deadlines
- ✅ Zero "where did we write that?" moments
- ✅ Customer feedback searchable and tagged

---

## 🆘 Common Questions

**Q: Should we keep WhatsApp group?**  
A: Yes! WhatsApp for quick sync, Notion for decisions and action items.

**Q: What about sensitive info (passwords, API keys)?**  
A: Use 1Password. Link to vaults from Notion, don't paste secrets.

**Q: Who owns updating Notion?**  
A: Person who runs the meeting creates the note. Everyone updates their own tasks.

**Q: Can we integrate with Linear?**  
A: Yes! Use Notion's Linear integration or Zapier to sync issues.

---

## 📦 Notion Template Export

A ready-to-duplicate template is available at:
**[To be created after workspace setup]**

---

## Next Steps

1. **Sven:** Create Notion workspace and invite team
2. **Team:** Review this guide and suggest changes
3. **Christopher:** Migrate first 3 HackMD meeting notes as example
4. **Hjalti:** Set up Product Specs structure
5. **All:** Start using for next meeting

---

**Questions?** Drop them in WhatsApp and we'll update this guide.
