# EU AI Act Compliance Roadmap — RecruitOS

*Research date: 2026-02-09*
*Enforcement deadline: August 2, 2026 (176 days from today)*

---

## Executive Summary

RecruitOS is classified as a **high-risk AI system** under the EU AI Act (Annex III, Category 4: Employment, workers management and access to self-employment). All AI features that score, rank, filter, or profile candidates fall under this classification. Non-compliance penalties: up to **€35M or 7% of global annual revenue**.

The good news: RecruitOS has a **significant head start** with immutable audit logs, hash-chained integrity verification, and model provenance tracking already built. The bad news: several critical gaps remain — particularly around human oversight workflows, bias detection, candidate transparency rights, and formal documentation.

**Key insight**: Most competitors are NOT compliant. Early compliance = competitive moat + sales differentiator for the Nordic/EU market.

---

## 1. Timeline to August 2, 2026

### Key Regulatory Milestones

| Date | Milestone | Impact |
|------|-----------|--------|
| Feb 2, 2025 | Prohibited AI practices provisions in force | ✅ Not applicable to RecruitOS |
| Feb 2, 2026 | Commission guidelines on practical implementation published | Clarifies requirements — watch for updates |
| Aug 2, 2026 | **HIGH-RISK OBLIGATIONS ENFORCEABLE** | **Full compliance required** |
| Aug 2, 2027 | Obligations for AI systems in Annex I | Additional standards may apply |

### RecruitOS Compliance Phases

```
Feb 2026          Mar 2026          Apr 2026          May 2026          Jun 2026          Jul 2026          Aug 2, 2026
    |                 |                 |                 |                 |                 |                 |
    |  PHASE 1: MVP   |  PHASE 2: CORE  |  PHASE 3: FULL  |  PHASE 4: TEST  |  PHASE 5: CERT  |  BUFFER         |
    |  Gap Analysis    |  Human Oversight |  Bias Detection  |  Testing &       |  Conformity      |  Contingency    |
    |  Quick Fixes     |  Explainability  |  Transparency    |  Validation      |  Assessment      |                 |
    |  Documentation   |  Risk Management |  Data Governance |  Pen Testing     |  Declaration     |                 |
    |                 |                 |                 |                 |                 |                 |
    └─── 4 weeks ────┘─── 6 weeks ────┘─── 6 weeks ────┘─── 4 weeks ────┘─── 4 weeks ────┘─── 2 weeks ────┘
```

---

## Phase 1: MVP Compliance (Feb-Mar 2026) — 4 weeks

**Goal**: Close easy gaps, start documentation, leverage what's already built.

### 1.1 Gap Analysis & Audit (Week 1)

| Task | Effort | Notes |
|------|--------|-------|
| Inventory all AI features that score/rank/filter candidates | 2 days | Map every geminiService function + AI route |
| Classify each feature's risk level | 1 day | All scoring/profiling = high-risk |
| Document current compliance state | 2 days | What we already have vs what's missing |

### 1.2 Quick Documentation Wins (Weeks 2-3)

| Task | Effort | Notes |
|------|--------|-------|
| Create system-level technical documentation (Annex IV) | 3 days | System description, purpose, architecture |
| Document AI model chain (Gemini → OpenRouter failover) | 1 day | Already have model_provider/model_version in audit logs |
| Document data sources and governance | 2 days | GitHub API, LinkedIn, Firecrawl — what data, how used |
| Create intended purpose statement | 1 day | "Decision-support for recruitment, not automated decision-making" |

### 1.3 Quick Code Fixes (Weeks 3-4)

| Task | Effort | What's Already Built | Gap |
|------|--------|---------------------|-----|
| Add `decision_type` field to audit logs | 1 day | Audit log schema exists | Missing: distinguish "informational" vs "decision-support" vs "automated" |
| Log all AI inputs/outputs (not just hashes) | 2 days | `input_hash` and `output_hash` exist | Need: store actual prompts & responses for auditability |
| Add candidate notification flag | 1 day | — | NEW: Track whether candidate was informed AI was used |
| Add consent tracking field | 1 day | — | NEW: Record how/when candidate consented to AI processing |

**Phase 1 Deliverables:**
- ✅ Risk classification inventory
- ✅ Technical documentation v1 (Annex IV)
- ✅ Enhanced audit log schema
- ✅ Candidate consent tracking

---

## Phase 2: Core Compliance (Mar-Apr 2026) — 6 weeks

**Goal**: Build the three hardest requirements — human oversight, explainability, and risk management.

### 2.1 Human Oversight Workflows (Article 14) — 3 weeks

**What the law requires**: Humans must be able to monitor, interpret, override, and intervene in AI decisions. They must understand the system's capabilities and limitations and be aware of "automation bias" risks.

| Feature | Effort | Priority | Notes |
|---------|--------|----------|-------|
| **Human Review Queue** | 5 days | CRITICAL | Dashboard where recruiter reviews AI scores before acting. Must log review decision. |
| **Score Override with Reason** | 3 days | CRITICAL | Allow recruiter to adjust AI score + require written justification. Log original + override. |
| **"AI Assisted" Badge on All Outputs** | 1 day | CRITICAL | Every AI-generated insight must be visibly labeled as AI-generated. |
| **Automation Bias Warning** | 1 day | HIGH | Show warning when recruiter accepts all AI recommendations without review. |
| **Override Analytics** | 2 days | MEDIUM | Track how often humans override AI → feeds back into bias detection. |

**What RecruitOS already has:**
- ✅ Calibration chat (interactive human-AI collaboration)
- ✅ Pipeline stages (natural human checkpoints)
- ⚠️ No formal override mechanism with audit trail
- ⚠️ No "human reviewed" flag on decisions
- ❌ No automation bias warnings

### 2.2 Explainability (Article 13) — 2 weeks

**What the law requires**: System outputs must be interpretable. Deployers must understand why the AI produced a specific result.

| Feature | Effort | Priority | Notes |
|---------|--------|----------|-------|
| **Score Narrative Generator** | 3 days | CRITICAL | Natural-language explanation for each score. "Candidate scored 82 because..." |
| **Evidence Chain Display** | 2 days | CRITICAL | Link each score component to specific GitHub data (repos, commits, PRs) |
| **Confidence Indicators** | 2 days | HIGH | Show confidence level for each assessment. Already have ConfidenceLevel enum. |
| **Data Completeness Warning** | 1 day | HIGH | Warn when profile has limited data (few repos, no recent activity) |
| **Model Version Display** | 0.5 day | MEDIUM | Show which AI model generated each assessment. Already logged in audit. |

**What RecruitOS already has:**
- ✅ ScoreExplainer component (basic score breakdown)
- ✅ Score breakdown into 5 components (skills, experience, industry, seniority, location)
- ✅ Evidence interface with source + confidence
- ✅ Model provider/version in audit logs
- ⚠️ No natural-language narrative explaining "why"
- ⚠️ No data completeness warnings

### 2.3 Risk Management System (Article 9) — 1 week

**What the law requires**: Continuous, iterative risk identification, evaluation, and mitigation throughout the system lifecycle.

| Feature | Effort | Priority | Notes |
|---------|--------|----------|-------|
| **Risk Register Document** | 2 days | CRITICAL | Formal document: known risks, likelihood, mitigation. Living document. |
| **Post-Market Monitoring Plan** | 2 days | CRITICAL | How we track system performance after deployment. Include accuracy monitoring. |
| **Incident Reporting Workflow** | 1 day | HIGH | Process for when AI produces harmful/biased outputs. Who reports, how, to whom. |

**Phase 2 Deliverables:**
- ✅ Human Review Queue with override logging
- ✅ Score Override mechanism with audit trail
- ✅ AI-generated content labels
- ✅ Score Narrative Generator
- ✅ Risk Register v1
- ✅ Post-Market Monitoring Plan

---

## Phase 3: Full Compliance (Apr-May 2026) — 6 weeks

**Goal**: Bias detection, candidate transparency rights, and data governance.

### 3.1 Bias Detection & Monitoring (Article 10) — 3 weeks

**What the law requires**: Detect, prevent, and mitigate biases in training data and system outputs. Article 10(5) explicitly allows processing sensitive personal data for bias detection purposes.

| Feature | Effort | Priority | Notes |
|---------|--------|----------|-------|
| **Score Distribution Dashboard** | 5 days | CRITICAL | Visualize score distributions. Detect skew patterns. |
| **Demographic Proxy Detection** | 3 days | CRITICAL | Monitor if scores correlate with location, name origin, education institution (proxies for protected characteristics) |
| **Fairness Metrics Engine** | 5 days | HIGH | Implement statistical parity, equal opportunity, calibration metrics across candidate groups |
| **Bias Alert System** | 2 days | HIGH | Automated alerts when distributions shift beyond thresholds |

**Important nuance for Danish market**: Denmark restricts collection of ethnicity/religion data. Bias detection must use proxy analysis (geographic patterns, name origin patterns) rather than direct demographic collection. This is legally permissible under Article 10(5) but requires careful implementation.

### 3.2 Candidate Transparency Rights — 2 weeks

**What the law requires**: Candidates have the right to know AI was used, request explanation of AI's role in the decision, and understand the main elements of the decision.

| Feature | Effort | Priority | Notes |
|---------|--------|----------|-------|
| **Candidate Transparency Portal** | 5 days | CRITICAL | Page where candidates can see their profile, scores, and AI-generated assessments |
| **"AI Was Used" Notification** | 2 days | CRITICAL | Automated email/notification to candidates informing them of AI processing |
| **Explanation Request Workflow** | 2 days | HIGH | Mechanism for candidates to request detailed explanation. Triggers human review. |
| **Data Export (GDPR + AI Act)** | 1 day | HIGH | Already have `data_exported` audit event. Need endpoint to generate export. |

### 3.3 Data Governance Formalization (Article 10) — 1 week

| Feature | Effort | Priority | Notes |
|---------|--------|----------|-------|
| **Data Source Documentation** | 2 days | CRITICAL | Formal documentation of each data source (GitHub, LinkedIn, etc.), what data is collected, how it's processed |
| **Data Quality Checks** | 2 days | HIGH | Automated checks for incomplete/inconsistent candidate data before AI processing |
| **Data Retention Policy** | 1 day | HIGH | Define and enforce how long candidate data is stored. Auto-deletion after period. |

**Phase 3 Deliverables:**
- ✅ Bias detection dashboard with fairness metrics
- ✅ Candidate Transparency Portal
- ✅ AI notification system for candidates
- ✅ Formal data governance documentation
- ✅ Data retention policy and enforcement

---

## Phase 4: Testing & Validation (May-Jun 2026) — 4 weeks

**Goal**: Validate that all compliance features work correctly under realistic conditions.

### 4.1 Compliance Testing

| Task | Effort | Notes |
|------|--------|-------|
| End-to-end audit trail testing | 3 days | Verify complete decision chain is logged from search → score → review → action |
| Human oversight bypass testing | 2 days | Verify AI cannot make decisions without human review step |
| Bias detection accuracy testing | 3 days | Run synthetic datasets with known biases, verify detection |
| Candidate transparency flow testing | 2 days | Test full candidate journey: notification → view profile → request explanation → receive export |
| Override logging completeness testing | 1 day | Verify all overrides are captured with timestamps and reasons |

### 4.2 Security Testing

| Task | Effort | Notes |
|------|--------|-------|
| Audit log tamper resistance testing | 2 days | Verify hash chain integrity after various attack scenarios |
| Access control review | 2 days | Verify only authorized users can access candidate AI assessments |
| Data export security | 1 day | Verify exports don't leak more data than intended |

### 4.3 Documentation Review

| Task | Effort | Notes |
|------|--------|-------|
| Technical documentation completeness review | 3 days | Annex IV checklist verification |
| Risk register update | 1 day | Incorporate findings from testing phase |
| User manual / instructions for deployers | 3 days | Article 13 requires clear instructions for users (recruiters) |

**Phase 4 Deliverables:**
- ✅ Compliance test report
- ✅ Security audit report
- ✅ Updated technical documentation
- ✅ Deployer instruction manual

---

## Phase 5: Conformity Assessment (Jun-Jul 2026) — 4 weeks

**Goal**: Formal self-assessment and declaration of conformity.

### Important: Self-Assessment Applies to Recruitment AI

Under Article 43, high-risk AI systems in Annex III categories 2-8 (including employment/recruitment) use **internal conformity assessment** (Annex VI). This means RecruitOS does NOT need a third-party notified body — we perform a self-assessment. This is significantly cheaper and faster.

### 5.1 Conformity Assessment Steps

| Task | Effort | Notes |
|------|--------|-------|
| Verify quality management system (Article 17) | 3 days | Document QA processes, testing procedures, version control |
| Complete Annex IV technical documentation | 2 days | Final review and completion |
| Register in EU AI Database | 1 day | Required before placing system on market |
| Issue EU Declaration of Conformity | 1 day | Formal legal document signed by authorized representative |
| Apply CE marking (if applicable) | 1 day | Required for AI systems with physical interface |

### 5.2 Ongoing Obligations (Post-Compliance)

| Obligation | Frequency | Notes |
|------------|-----------|-------|
| Post-market monitoring | Continuous | Monitor system performance, bias drift, accuracy |
| Risk register updates | Quarterly | Review and update known risks |
| Technical documentation updates | Per substantial modification | Any major feature change triggers re-assessment |
| Incident reporting | As needed | Report serious incidents to national authorities |
| Bias metrics review | Monthly | Review fairness metrics, address any drift |

---

## 2. Required Features — Detailed Breakdown

### Compliance Feature Matrix

| EU AI Act Requirement | Article | RecruitOS Status | Gap | Effort to Close |
|----------------------|---------|-----------------|-----|-----------------|
| **Risk Management System** | Art. 9 | ❌ Not built | Create risk register, monitoring plan, incident workflow | 5 days |
| **Data Governance** | Art. 10 | ⚠️ Partial | Data sources documented in CLAUDE.md but not formalized. No bias testing on training data. | 5 days |
| **Technical Documentation** | Art. 11 + Annex IV | ⚠️ Partial | Architecture docs exist but not in Annex IV format. Missing: development process, testing methods, performance metrics. | 5 days |
| **Record-Keeping / Logging** | Art. 12 | ✅ Strong | Immutable audit logs with hash chaining, model provenance, input/output hashing. Minor gaps: store actual prompts, add decision_type. | 2 days |
| **Transparency** | Art. 13 | ⚠️ Partial | ScoreExplainer exists. Missing: natural-language narratives, data completeness warnings, deployer instructions. | 5 days |
| **Human Oversight** | Art. 14 | ⚠️ Weak | Calibration chat exists but no formal override mechanism, no review queue, no automation bias warnings. | 10 days |
| **Accuracy & Robustness** | Art. 15 | ⚠️ Partial | Retry logic and failover chain exist. Missing: accuracy benchmarks, performance monitoring dashboard. | 5 days |
| **Quality Management System** | Art. 17 | ⚠️ Partial | CI/CD pipeline exists. Missing: formal QMS documentation, change management process. | 3 days |
| **Conformity Assessment** | Art. 43 | ❌ Not started | Self-assessment (Annex VI). Need declaration of conformity. | 3 days |
| **EU Database Registration** | Art. 49 | ❌ Not started | Register system before market placement. | 1 day |
| **Candidate Rights (GDPR+)** | Art. 86 | ⚠️ Partial | Data export audit event exists. Missing: candidate transparency portal, notification workflow. | 7 days |
| **Bias Detection** | Art. 10(5) | ❌ Not built | No fairness metrics, no demographic proxy detection, no bias alerting. | 10 days |

### Total Estimated Gap-Closing Effort: **~61 development days** (~12 weeks at 1 developer)

---

## 3. Competitive Advantage

### How Many Competitors Are Compliant?

Based on research, **very few recruiting AI tools are currently EU AI Act compliant**:

| Competitor | Compliance Status | Notes |
|------------|------------------|-------|
| HireVue | ⚠️ Partial | Has some bias auditing, but faced lawsuits over facial analysis. Retrofitting compliance. |
| Pymetrics (Harver) | ⚠️ Partial | Algorithmic auditing exists but built pre-EU AI Act. Adapting. |
| HireEZ | ❌ Unknown | US-focused, limited EU compliance messaging |
| Juicebox/PeopleGPT | ❌ Unknown | No public compliance documentation |
| Greenhouse | ⚠️ Partial | Some audit features, but AI scoring is limited |
| HackerRank | ❌ Unknown | Assessment-focused, limited AI decision-making |
| TeamTailor | ⚠️ Partial | Swedish company, likely working on compliance but no public roadmap |
| Eightfold.ai | ⚠️ In progress | Announced compliance efforts, no certification yet |

**Key insight**: The market is in a compliance gap. Most tools are either US-focused (don't care about EU AI Act) or are scrambling to retrofit. **First-mover advantage is massive.**

### The Sales Pitch

#### For Danish/Nordic Customers
> "RecruitOS er den første AI-rekrutteringsplatform der er fuldt EU AI Act-kompatibel fra dag ét. Jeres kandidater kan se og forstå AI-beslutningerne, jeres compliance team har fuld revisionssporing, og jeres virksomhed er beskyttet mod bøder op til €35M."

#### For International EU Customers
> "RecruitOS is the first recruitment intelligence platform built EU AI Act-compliant from the ground up. Every AI score is explainable, every decision is auditable, every candidate has transparency rights. While competitors are retrofitting, we architected for compliance."

#### Key Differentiators to Emphasize
1. **Immutable audit trails** — hash-chained, tamper-evident logs (already built)
2. **Explainable scores** — natural-language explanations, not black boxes
3. **Human-in-the-loop by design** — recruiters review and override, not rubber-stamp
4. **Candidate transparency** — candidates can see and challenge their assessments
5. **Bias monitoring** — continuous fairness metrics, not one-time audits
6. **Nordic-first** — built for Danish data protection culture + EU AI Act

### Certification & Trust Badges

| Badge/Certification | What It Is | Effort to Obtain | Value |
|---------------------|-----------|------------------|-------|
| **EU Declaration of Conformity** | Self-assessed compliance declaration (Annex VI) | Included in Phase 5 | **Required by law** — also strong marketing signal |
| **CE Marking** | Indicates conformity with EU standards | Post-conformity assessment | Required for market placement |
| **ISO 42001:2023** | AI Management System Standard | 3-6 months, external audit | Gold standard for AI governance. Aligns closely with EU AI Act. |
| **SOC 2 Type II** | Security controls audit | 6-12 months, expensive | Enterprise trust signal, but not EU-specific |
| **Protectron.ai Compliance Badge** | Third-party compliance verification + embeddable badge | ~30 days after SDK integration | 23% higher deal close rates reported. Quick win. |

**Recommendation**: Prioritize EU Declaration of Conformity (required), then pursue Protectron.ai badge (quick, high-value), then ISO 42001 (long-term credibility).

### Pricing Leverage

EU AI Act compliance has direct pricing power:

- **Compliance-included tier**: Higher price point, justified by "we handle your EU AI Act obligations"
- **Compliance dashboard add-on**: Sell audit trail access, bias reports, and transparency features as premium
- **Risk reduction framing**: "€35M fine risk vs €X/month for compliant tooling"

---

## 4. Technical Implementation — What's Built vs What's Needed

### Already Built (Leverageable Assets)

| Asset | File/Service | EU AI Act Relevance |
|-------|-------------|-------------------|
| **Immutable audit logs** | `services/auditService.ts` | Art. 12 Record-Keeping — hash-chained, tamper-evident |
| **Supabase audit table** | `supabase/migrations/002_immutable_audit_logs.sql` | REVOKE DELETE/UPDATE enforces immutability |
| **Model provenance tracking** | `model_provider`, `model_version` fields | Art. 13 Transparency — which AI model made the decision |
| **Input/output hashing** | `input_hash`, `output_hash` fields | Art. 12 — cryptographic proof of what went in and came out |
| **Chain verification** | `AuditChainVerification` interface | Tamper detection — verify no entries were altered |
| **Score breakdown** | 5-component scoring in `types.ts` | Art. 13 — decomposable, interpretable scores |
| **ScoreExplainer** | `components/ScoreExplainer.tsx` | Art. 13 — visual explanation of scoring |
| **Evidence with sources** | `Evidence` interface with `source` + `confidence` | Art. 13 — traceability to data sources |
| **Confidence levels** | `ConfidenceLevel` enum (HIGH/MEDIUM/LOW) | Art. 13 — communicate uncertainty |
| **Calibration chat** | `services/calibrationService.ts` | Art. 14 — human can interact with and calibrate AI |
| **BigFive personality** | `services/personalityService.ts` | Documented psychometric methodology |
| **Data export event** | `data_exported` audit event type | Art. 86 + GDPR — track data subject access requests |
| **Candidate rejection logging** | `candidate_rejected` event type | Art. 12 — adverse decisions are logged |
| **CI/CD pipeline** | `.github/workflows/ci.yml` | Art. 17 — quality management foundation |

### Needs to Be Built

| Feature | Estimated Effort | Dependencies | EU AI Act Article |
|---------|-----------------|-------------|-------------------|
| **Human Review Queue** | 5 days | Audit service, pipeline UI | Art. 14 |
| **Score Override + Reason Logging** | 3 days | Audit service, pipeline UI | Art. 14 |
| **AI Label on All Outputs** | 1 day | All AI-rendering components | Art. 13 |
| **Automation Bias Warning** | 1 day | Pipeline analytics | Art. 14 |
| **Score Narrative Generator** | 3 days | geminiService | Art. 13 |
| **Data Completeness Warning** | 1 day | Profile analysis | Art. 13, 15 |
| **Risk Register Document** | 2 days | Documentation only | Art. 9 |
| **Post-Market Monitoring Plan** | 2 days | Documentation + monitoring code | Art. 9 |
| **Incident Reporting Workflow** | 1 day | Audit service | Art. 9 |
| **Score Distribution Dashboard** | 5 days | Analytics, charting | Art. 10 |
| **Demographic Proxy Detection** | 3 days | Statistical analysis | Art. 10 |
| **Fairness Metrics Engine** | 5 days | Statistical analysis | Art. 10(5) |
| **Bias Alert System** | 2 days | Monitoring, notifications | Art. 10 |
| **Candidate Transparency Portal** | 5 days | New page, auth, data access | Art. 86 |
| **AI Usage Notification** | 2 days | Email/notification service | Art. 13 |
| **Explanation Request Workflow** | 2 days | Candidate portal, queue system | Art. 86 |
| **Data Retention Policy + Auto-Delete** | 2 days | Prisma, cron job | Art. 10, GDPR |
| **Data Quality Checks** | 2 days | Pre-processing pipeline | Art. 10 |
| **Annex IV Technical Documentation** | 5 days | Documentation | Art. 11 |
| **QMS Documentation** | 3 days | Documentation | Art. 17 |
| **Deployer Instructions Manual** | 3 days | Documentation | Art. 13 |
| **EU Database Registration** | 1 day | Admin task | Art. 49 |
| **Declaration of Conformity** | 1 day | After all above | Art. 47 |

### Architecture Recommendation

```
┌─────────────────────────────────────────────────┐
│                 RecruitOS UI                      │
│  ┌───────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Pipeline   │  │ Compliance   │  │ Candidate │ │
│  │ + Review   │  │ Dashboard    │  │ Portal    │ │
│  │ Queue      │  │ (Bias, Audit)│  │ (Art. 86) │ │
│  └─────┬─────┘  └──────┬───────┘  └─────┬─────┘ │
│        │               │                │        │
│  ┌─────┴───────────────┴────────────────┴──────┐ │
│  │         Compliance Middleware Layer           │ │
│  │  • Human review enforcement                  │ │
│  │  • AI output labeling                        │ │
│  │  • Audit event creation                      │ │
│  │  • Bias metric collection                    │ │
│  │  • Data quality validation                   │ │
│  └─────────────────────┬───────────────────────┘ │
│                        │                          │
│  ┌─────────────────────┴───────────────────────┐ │
│  │            Existing AI Services              │ │
│  │  geminiService → scoring, profiling,         │ │
│  │  personalityService → BigFive                │ │
│  │  calibrationService → human-AI interaction   │ │
│  └─────────────────────┬───────────────────────┘ │
│                        │                          │
│  ┌─────────────────────┴───────────────────────┐ │
│  │         Immutable Audit Layer                │ │
│  │  auditService (hash-chained, Supabase)       │ │
│  │  + Override tracking                         │ │
│  │  + Bias metrics storage                      │ │
│  │  + Candidate notification log                │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

The key architectural addition is a **Compliance Middleware Layer** that sits between the UI and existing AI services. This layer:
1. Enforces human review before any score is acted upon
2. Labels all AI-generated content
3. Automatically creates audit events
4. Collects bias metrics passively
5. Validates data quality before AI processing

This approach minimizes changes to existing services while adding compliance as a cross-cutting concern.

---

## 5. Risk Assessment

### Highest Compliance Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Missing Aug 2, 2026 deadline | Medium | Critical (€35M) | Start Phase 1 immediately, buffer weeks built in |
| Bias in GitHub-based scoring | High | High | Gender proxy bias (fewer women on GitHub). Mitigate with fairness metrics + proxy detection |
| Candidate unaware of AI use | High | High | Implement notification system in Phase 3 |
| Audit logs not truly immutable (SQLite dev mode) | Medium | High | Production must use Supabase with REVOKE DELETE/UPDATE |
| Over-reliance on AI scores by recruiters | Medium | Medium | Automation bias warnings, mandatory review steps |
| Sensitive data in AI prompts | Medium | High | Review all geminiService prompts for PII leakage |
| Model drift (Gemini updates change scoring) | Medium | Medium | Pin model versions, monitor score distributions over time |

### Danish Market-Specific Risks

| Risk | Notes |
|------|-------|
| **Danish Data Protection Agency (Datatilsynet)** | Proactive enforcement. Expect early scrutiny of AI hiring tools. |
| **Works council requirements** | Danish companies may have co-determination obligations re: AI tool adoption |
| **Language bias** | Danish names/locations may affect AI scoring. Test with Danish candidate dataset. |
| **Small market visibility** | Early enforcement action against a Danish AI hiring tool would be high-profile |

---

## Summary: Compliance as Competitive Advantage

RecruitOS has **~60% of the infrastructure** needed for EU AI Act compliance already built. The remaining ~40% requires approximately 61 development days (~12 weeks at 1 developer, ~6 weeks at 2 developers).

**The compliance work IS the product roadmap for H1 2026.** Every compliance feature is also a product feature:
- Human oversight = better hiring decisions
- Explainability = recruiter trust in AI scores
- Bias detection = fairer hiring outcomes
- Candidate transparency = employer brand enhancement
- Audit trails = enterprise sales enablement

**Bottom line**: Compliance isn't a tax — it's the next product milestone. Ship it before August 2, 2026, and RecruitOS becomes the only EU AI Act-compliant recruitment intelligence platform on the market.

---

## Sources

- [EU AI Act Article 6: Classification Rules](https://artificialintelligenceact.eu/article/6/)
- [EU AI Act Annex III: High-Risk AI Systems](https://artificialintelligenceact.eu/annex/3/)
- [EU AI Act Article 9: Risk Management System](https://artificialintelligenceact.eu/article/9/)
- [EU AI Act Article 10: Data and Data Governance](https://artificialintelligenceact.eu/article/10/)
- [EU AI Act Article 11: Technical Documentation](https://artificialintelligenceact.eu/article/11/)
- [EU AI Act Article 12: Record-Keeping](https://artificialintelligenceact.eu/article/12/)
- [EU AI Act Article 13: Transparency](https://artificialintelligenceact.eu/article/13/)
- [EU AI Act Article 14: Human Oversight](https://artificialintelligenceact.eu/article/14/)
- [EU AI Act Article 43: Conformity Assessment](https://artificialintelligenceact.eu/article/43/)
- [EU AI Act Annex IV: Technical Documentation](https://artificialintelligenceact.eu/annex/4/)
- [HerōHunt: Recruiting Under the EU AI Act](https://www.herohunt.ai/blog/recruiting-under-the-eu-ai-act-impact-on-hiring)
- [HeyMilo: EU AI Act and Recruitment](https://www.heymilo.ai/blog/how-the-eu-ai-act-changes-recruitment-and-what-employers-need-to-know)
- [Greenberg Traurig: AI in EU/US Recruitment](https://www.gtlaw.com/en/insights/2025/5/use-of-ai-in-recruitment-and-hiring-considerations-for-eu-and-us-companies)
- [DISA: AI Compliance Risks 2026](https://disa.com/news/ai-in-hr-background-screening-compliance-risks-for-2026/)
- [Dataiku: EU AI Act High-Risk Requirements](https://www.dataiku.com/stories/blog/eu-ai-act-high-risk-requirements)
- [Secureframe: EU AI Act Compliance Guide](https://secureframe.com/blog/eu-ai-act-compliance)
- [DPO Consulting: High-Risk AI Systems Guide](https://www.dpo-consulting.com/blog/high-risk-ai-systems)
- [Protectron.ai: EU AI Act Compliance Platform](https://protectron.ai/)
- [Hunton: Impact of EU AI Act on HR](https://www.hunton.com/insights/legal/the-impact-of-the-eu-ai-act-on-human-resources-activities)
