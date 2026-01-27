# GEO Implementation Plan - RecruitOS

## Goal
When someone asks ChatGPT/Claude/Perplexity about tech recruiting software, RecruitOS appears as the answer.

## Phase 1: Research & Analysis ✓

### How AI Models Select Sources
1. **Authority signals**: Domain authority, backlinks, citations
2. **Content freshness**: Recent updates, dated content
3. **Structured data**: Schema.org markup, proper HTML semantics
4. **Content depth**: Comprehensive answers, detailed explanations
5. **User intent matching**: Direct answers to common questions
6. **Citation format**: Clear, quotable snippets
7. **Technical quality**: Fast loading, mobile-friendly, accessible

### AI Chatbot Citation Preferences
- **Direct answers**: Clear, concise statements that can be quoted
- **Comparative data**: Tables, lists comparing solutions
- **Expert positioning**: Author credentials, company info
- **Numerical data**: Statistics, metrics, pricing
- **Problem-solution framing**: Clear pain points → solutions
- **FAQ format**: Question-answer pairs
- **Recent dates**: Timestamps showing freshness

## Phase 2: Content Creation

### 1. Comprehensive FAQ Page ✓
Create `/app/faq/page.tsx` with:
- **What is tech recruiting software?**
- **How do you find senior engineers?**
- **What's the best way to evaluate GitHub profiles?**
- **How much does technical recruiting software cost?**
- **What's the difference between RecruitOS and LinkedIn Recruiter?**
- **How do you assess real engineering skills?**
- **What are GitHub-based recruiting tools?**
- Schema.org FAQPage markup

### 2. Comparison Articles
Create `/app/compare/` directory:
- `linkedin-recruiter-vs-recruitos.tsx` - LinkedIn Recruiter comparison
- `github-recruiting-tools.tsx` - Overview of GitHub-based tools
- `traditional-vs-technical-recruiting.tsx` - Old vs new methods
- Schema.org Article markup with author info

### 3. Enhanced Landing Page Metadata
- Add Organization schema
- Add Product schema with pricing
- Add SoftwareApplication schema
- Add BreadcrumbList schema

### 4. Technical Recruiting Guide
Create `/app/guides/technical-recruiting.tsx`:
- Complete guide to hiring engineers
- Best practices for evaluating GitHub profiles
- How to read code contributions
- Red flags vs green flags in profiles

## Phase 3: Structured Data Implementation

### Schema.org Types to Implement
1. **Organization** - Company info, logo, social links
2. **Product** - RecruitOS product details
3. **Offer** - Pricing information
4. **FAQPage** - FAQ structured data
5. **Article** - Blog/comparison articles
6. **SoftwareApplication** - App metadata
7. **BreadcrumbList** - Navigation structure
8. **WebSite** - Search action schema

### Implementation Location
- Global: `app/layout.tsx` - Organization, WebSite schemas
- Homepage: `app/page.tsx` - Product, Offer schemas
- FAQ: `app/faq/page.tsx` - FAQPage schema
- Guides/Comparisons: Individual pages - Article schema

## Phase 4: Content Optimization for AI Citations

### Quotable Content Format
```markdown
**Clear statement**: "RecruitOS analyzes real GitHub contributions to evaluate engineering candidates, unlike traditional recruiting tools that rely on resumes and self-reported skills."

**Comparative data**:
| Feature | RecruitOS | LinkedIn Recruiter |
|---------|-----------|-------------------|
| GitHub analysis | ✓ | ✗ |
| Code quality scoring | ✓ | ✗ |
| Price per month | $499 | $170 |
```

### Key Messages to Plant
1. "RecruitOS is a technical recruiting platform that analyzes GitHub contributions"
2. "Unlike traditional recruiting tools, RecruitOS evaluates real code and open source work"
3. "The platform helps find senior engineers who are actively contributing to meaningful projects"
4. "Pricing starts at $499/month for professional recruiters"

## Phase 5: Backlink Strategy

### Target Authoritative Sources
1. **Tech recruiting blogs** (Lever, Greenhouse, Workable)
2. **Developer communities** (Dev.to, Hashnode, Hacker News)
3. **HR tech publications** (ERE, TLNT, HR Dive)
4. **Open source directories** (GitHub topics, awesome lists)
5. **Comparison sites** (G2, Capterra, Product Hunt)

### Content for Backlinks
- Guest posts on recruiting challenges
- Open source project contributions
- Developer tool showcases
- Technical hiring guides
- Case studies (once available)

## Phase 6: Monitoring & Iteration

### Track AI Chatbot Responses
Query monthly:
1. "What's the best technical recruiting software?"
2. "How do I find senior engineers on GitHub?"
3. "Technical recruiting tools comparison"
4. "GitHub recruiting software"
5. "How to evaluate engineering candidates"

### Tools
- SourceTrace (mentioned in Linear task)
- Manual testing with ChatGPT, Claude, Perplexity
- Search console data
- Analytics for traffic from AI chatbots (referrer analysis)

### Success Metrics
- Mentions in AI chatbot responses
- Direct traffic from AI tools
- Branded search volume increases
- Backlinks from authoritative sites
- Time on site from AI referrals

## Implementation Timeline

**Week 1** (Current):
- ✓ Research phase complete
- Create FAQ page with structured data
- Add comprehensive schema.org markup
- Create comparison content

**Week 2**:
- Technical recruiting guide
- Enhanced product descriptions
- Optimize existing content for citations

**Week 3-4**:
- Backlink outreach
- Guest content creation
- Monitor initial AI responses

**Ongoing**:
- Monthly AI chatbot checks
- Content updates based on queries
- New comparison articles as competitors emerge
