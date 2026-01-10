# Salesforce x GBase Skill Development Plan

> **Goal**: Research Salesforce products, APIs, MCP capabilities, identify user pain points, and design prioritized GBase Skills.

## Project Info
- **Start Date**: 2026-01-10
- **Status**: In Progress
- **Owner**: GBase Team

---

## Phase 1: Salesforce Product Research `complete`

### Objectives
- [x] Map Salesforce Cloud products and their core functions
- [x] Document available APIs for each product
- [x] Identify integration points for GBase

### Tasks
| Task | Status | Notes |
|------|--------|-------|
| Sales Cloud APIs | complete | REST, Bulk API |
| Service Cloud APIs | complete | REST, Streaming |
| Marketing Cloud APIs | complete | REST, SOAP |
| Data Cloud APIs | complete | REST, Connect |
| Einstein/Agentforce APIs | complete | Agent API, SDK |
| MCP Support Status | complete | Beta Oct 2025, GA Feb 2026 |

---

## Phase 2: MCP & Agent API Deep Dive `complete`

### Objectives
- [x] Document official MCP support timeline
- [x] Catalog available MCP servers (official + community)
- [x] Identify MCP tools and their capabilities
- [x] Note limitations and workarounds

### Tasks
| Task | Status | Notes |
|------|--------|-------|
| Official MCP docs | complete | Agentforce 3.0 Pilot Jul 2025 |
| Community MCP servers | complete | mcp-server-salesforce on GitHub |
| Agent API capabilities | complete | REST-based, Connected App required |
| Rate limits & quotas | complete | Spring '26 restricts new connected apps |

---

## Phase 3: User Pain Point Analysis `complete`

### Objectives
- [x] Collect pain points from community forums
- [x] Analyze Agentforce adoption barriers
- [x] Identify enterprise deployment challenges
- [x] Document feature request patterns

### Pain Point Categories
| Category | Priority | Count |
|----------|----------|-------|
| Usability | High | 40% frustrated |
| Performance | High | 5+ sec lag |
| Integration | High | Manual re-entry |
| AI/Automation | Critical | 77% failure |
| Multilingual | High | Non-English weak |
| Cost | Critical | $13,600/user/yr |

---

## Phase 4: GBase Skill Design `complete`

### Objectives
- [x] Map pain points to GBase capabilities
- [x] Design skill specifications
- [x] Define technical architecture
- [x] Estimate implementation effort

### Proposed Skills (8 total)
| Skill Name | Pain Point | GBase Capability | Status |
|------------|------------|------------------|--------|
| NL Query Assistant | Navigation | Multilingual + RAG | Designed |
| Digital Human Agent | Chat UX | Digital Human | Designed |
| Data Doctor | Data quality | RAG + Batch | Designed |
| Voice Salesforce | Mobile UX | Voice Agent | Designed |
| AI Onboarding Coach | Training | Digital Human + RAG | Designed |
| Field Intelligence | Customization | RAG + Metadata | Designed |
| Long Workflow | 60s timeout | Queue system | Designed |
| Smart Form Builder | Webforms | RAG + Forms | Designed |

---

## Phase 5: Prioritization `complete`

### Scoring Formula
```
Priority = (User_Value × Differentiation × GBase_Match) / Complexity
```

### Priority Matrix
| Skill | Value | Diff | Match | Complex | Score | Rank |
|-------|-------|------|-------|---------|-------|------|
| NL Query Assistant | 9 | 9 | 10 | 5 | 162 | #1 |
| Digital Human Agent | 8 | 10 | 10 | 7 | 114 | #2 |
| Data Doctor | 9 | 8 | 9 | 6 | 108 | #3 |
| Voice Salesforce | 8 | 8 | 9 | 6 | 96 | #4 |
| AI Coach | 8 | 7 | 9 | 6 | 84 | #5 |
| Field Intelligence | 7 | 7 | 8 | 5 | 78 | #6 |
| Long Workflow | 7 | 9 | 8 | 7 | 72 | #7 |
| Smart Form | 6 | 7 | 7 | 5 | 59 | #8 |

---

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| None yet | | |

---

## Key Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Use planning-with-files workflow | Persistent context management | 2026-01-10 |

---

## Files Created
| File | Purpose |
|------|---------|
| task_plan.md | This file - phase tracking |
| findings.md | Research discoveries |
| progress.md | Session log |
