# GBase Skill Proposals for Salesforce Integration

> **Based on**: User pain points research, API capabilities, MCP status
> **Date**: 2026-01-10

---

## Skill 1: Salesforce Data Doctor (数据医生)

### Problem Statement
77% of Agentforce deployments fail due to data quality issues. Users report being "drowning in bad/dirty data" which breaks AI, reports, and integrations.

### Target Users
- Salesforce Admins
- Data Stewards
- Sales Operations

### GBase Capabilities Used
- [x] RAG Search (semantic duplicate detection)
- [x] Multilingual (10 languages for field normalization)
- [ ] Digital Human
- [ ] Voice Agent
- [x] MCP Tools (Salesforce CRUD)
- [x] Long Workflow (batch processing)

### Technical Approach
1. Connect via Salesforce REST/Bulk API
2. Scan objects for duplicates using semantic similarity
3. Detect format anomalies (phone, email, address)
4. Generate merge recommendations
5. Execute cleanup with user approval
6. Generate quality report

### API Dependencies
- REST API (query, describe)
- Bulk API 2.0 (mass updates)
- Metadata API (field definitions)

### Differentiation
| Feature | Agentforce | GBase Skill |
|---------|------------|-------------|
| Semantic dedup | Limited | RAG-based |
| Multi-language normalization | Weak | 10 languages |
| Batch processing | 60s timeout | No limit |
| Quality scoring | None | AI-powered |

### Implementation Effort
- **Complexity**: 6/10
- **Timeline**: 4-6 weeks
- **Dependencies**: Salesforce MCP Server, RAG engine

### Priority Score
- User Value: 9/10 (solves #1 deployment blocker)
- Differentiation: 8/10 (unique semantic approach)
- Complexity: 6/10
- GBase Match: 9/10 (RAG + batch processing)
- **Final Score**: (9 × 8 × 9) / 6 = **108**

---

## Skill 2: Natural Language Query Assistant (自然语言查询助手)

### Problem Statement
40% of users frustrated with navigation complexity. Non-technical users can't build reports or find data. SOQL learning curve is steep.

### Target Users
- Sales Reps
- Managers
- Business Analysts (non-technical)

### GBase Capabilities Used
- [x] RAG Search
- [x] Multilingual (10 languages)
- [x] Digital Human (optional face)
- [x] Voice Agent (voice input)
- [x] MCP Tools (query execution)
- [ ] Long Workflow

### Technical Approach
1. Accept natural language query in any of 10 languages
2. Detect language and intent
3. Map terminology (客户→Account, 商机→Opportunity)
4. Generate SOQL via Claude
5. Execute via REST API
6. Format and translate results back
7. Display in chat or table

### API Dependencies
- REST API (query, describe)
- Metadata API (object/field discovery)

### Differentiation
| Feature | Agentforce | GBase Skill |
|---------|------------|-------------|
| Languages | English-centric | 10 native |
| Voice input | Limited | Full support |
| Terminology map | None | Custom per org |
| Result translation | No | Automatic |

### Implementation Effort
- **Complexity**: 5/10
- **Timeline**: 3-4 weeks
- **Dependencies**: Claude API, Salesforce MCP

### Priority Score
- User Value: 9/10 (addresses top complaint)
- Differentiation: 9/10 (multilingual advantage)
- Complexity: 5/10
- GBase Match: 10/10 (core capability)
- **Final Score**: (9 × 9 × 10) / 5 = **162**

---

## Skill 3: Digital Human Service Agent (数字人客服)

### Problem Statement
Agentforce has no digital human capability. Chat-only UX has <20% adoption. Customers want more human-like interactions.

### Target Users
- Customer Service Teams
- Sales Teams (demos)
- Training Departments

### GBase Capabilities Used
- [x] RAG Search
- [x] Multilingual
- [x] Digital Human (core feature)
- [x] Voice Agent
- [x] MCP Tools
- [ ] Long Workflow

### Technical Approach
1. Embed GBase Digital Human in Salesforce Lightning page
2. Connect to Salesforce via MCP for context
3. Retrieve customer info (Account, Contact, Cases)
4. Answer questions using RAG + Salesforce data
5. Create/update records via voice commands
6. Provide visual feedback (expressions, gestures)

### API Dependencies
- REST API (CRUD)
- Streaming API (real-time updates)
- Connect API (Files for knowledge)

### Differentiation
| Feature | Agentforce | GBase Skill |
|---------|------------|-------------|
| Digital Human | Not supported | Full support |
| Visual persona | None | Customizable |
| Expressions/gestures | N/A | Bow, smile, etc. |
| Voice interaction | Limited | Real-time |

### Implementation Effort
- **Complexity**: 7/10
- **Timeline**: 6-8 weeks
- **Dependencies**: GBase Digital Human API, LWC embedding

### Priority Score
- User Value: 8/10 (unique experience)
- Differentiation: 10/10 (zero competition)
- Complexity: 7/10
- GBase Match: 10/10 (existing capability)
- **Final Score**: (8 × 10 × 10) / 7 = **114**

---

## Skill 4: Voice-Powered Salesforce (语音驱动)

### Problem Statement
Mobile Salesforce UX is poor. Field reps can't update records easily while driving or on-site. Manual data entry kills productivity.

### Target Users
- Field Sales
- Service Technicians
- Delivery Drivers

### GBase Capabilities Used
- [ ] RAG Search
- [x] Multilingual
- [ ] Digital Human
- [x] Voice Agent (core feature)
- [x] MCP Tools
- [ ] Long Workflow

### Technical Approach
1. Mobile app or embedded web component
2. Wake word or button activation
3. Voice command recognition (10 languages)
4. Intent detection (create, update, query)
5. Confirmation via voice
6. Execute via Salesforce API
7. Spoken confirmation

### API Dependencies
- REST API (CRUD)
- Streaming API (real-time sync)

### Differentiation
| Feature | Agentforce | GBase Skill |
|---------|------------|-------------|
| Voice commands | Limited | Full suite |
| Languages | English-centric | 10 native |
| Hands-free mode | No | Yes |
| Echo cancellation | N/A | Enhanced |

### Implementation Effort
- **Complexity**: 6/10
- **Timeline**: 4-5 weeks
- **Dependencies**: GBase Voice Agent, Mobile SDK

### Priority Score
- User Value: 8/10 (field productivity)
- Differentiation: 8/10 (mature voice capability)
- Complexity: 6/10
- GBase Match: 9/10 (Voice Agent ready)
- **Final Score**: (8 × 8 × 9) / 6 = **96**

---

## Skill 5: Long Workflow Executor (长流程执行器)

### Problem Statement
Agentforce has 60-second timeout. Complex workflows fail. Batch operations are limited.

### Target Users
- Sales Operations
- Data Migration Teams
- Integration Developers

### GBase Capabilities Used
- [x] RAG Search
- [x] Multilingual
- [ ] Digital Human
- [ ] Voice Agent
- [x] MCP Tools
- [x] Long Workflow (core feature)

### Technical Approach
1. Define multi-step workflow
2. Break into checkpointed stages
3. Execute asynchronously via GBase
4. Real-time progress via Platform Events
5. Handle failures with retry logic
6. Resume from checkpoint on interruption

### API Dependencies
- Bulk API 2.0 (batch operations)
- Platform Events (progress updates)
- REST API (CRUD)

### Differentiation
| Feature | Agentforce | GBase Skill |
|---------|------------|-------------|
| Timeout | 60 seconds | No limit |
| Checkpoints | None | Full support |
| Progress tracking | Limited | Real-time |
| Retry logic | Basic | Intelligent |

### Implementation Effort
- **Complexity**: 7/10
- **Timeline**: 5-6 weeks
- **Dependencies**: Queue system, Salesforce APIs

### Priority Score
- User Value: 7/10 (power users)
- Differentiation: 9/10 (unique capability)
- Complexity: 7/10
- GBase Match: 8/10 (workflow engine)
- **Final Score**: (7 × 9 × 8) / 7 = **72**

---

## Skill 6: AI Onboarding Coach (AI 培训教练)

### Problem Statement
Lack of training/support is #1 cited challenge. Users struggle with basic navigation. Admins don't know how to write good prompts.

### Target Users
- New Salesforce Users
- Salesforce Admins
- Sales Managers

### GBase Capabilities Used
- [x] RAG Search (Salesforce docs)
- [x] Multilingual
- [x] Digital Human (friendly coach)
- [x] Voice Agent
- [x] MCP Tools (demo actions)
- [ ] Long Workflow

### Technical Approach
1. Embed AI coach in Salesforce
2. Detect user actions and context
3. Proactively offer guidance
4. Answer "how do I..." questions
5. Demonstrate actions via MCP
6. Track learning progress

### API Dependencies
- REST API
- UI API (page context)
- Connect API (user info)

### Differentiation
| Feature | Agentforce | GBase Skill |
|---------|------------|-------------|
| Personalized coaching | No | AI-driven |
| Visual demonstrations | None | Digital Human |
| Multi-language support | Weak | 10 languages |
| Progress tracking | No | Built-in |

### Implementation Effort
- **Complexity**: 6/10
- **Timeline**: 5-6 weeks
- **Dependencies**: Salesforce Help RAG, Digital Human

### Priority Score
- User Value: 8/10 (adoption driver)
- Differentiation: 7/10 (unique approach)
- Complexity: 6/10
- GBase Match: 9/10 (RAG + Digital Human)
- **Final Score**: (8 × 7 × 9) / 6 = **84**

---

## Skill 7: Smart Form Builder (智能表单构建)

### Problem Statement
Webform integration has 10 common pain points. Data capture issues. Form-to-Salesforce mapping is complex.

### Target Users
- Marketing Teams
- Sales Ops
- Web Developers

### GBase Capabilities Used
- [x] RAG Search
- [x] Multilingual
- [ ] Digital Human
- [ ] Voice Agent
- [x] MCP Tools
- [ ] Long Workflow

### Technical Approach
1. NL description of desired form
2. Auto-generate form fields from description
3. Auto-map to Salesforce objects/fields
4. Validation rules via AI
5. Deploy embeddable form
6. Real-time sync to Salesforce

### API Dependencies
- REST API (create records)
- Metadata API (field definitions)
- UI API (picklist values)

### Differentiation
| Feature | Agentforce | GBase Skill |
|---------|------------|-------------|
| NL form creation | No | Yes |
| Auto field mapping | Manual | AI-driven |
| Multi-language forms | Limited | 10 native |
| Smart validation | Basic | AI-powered |

### Implementation Effort
- **Complexity**: 5/10
- **Timeline**: 3-4 weeks
- **Dependencies**: Form generator, Salesforce API

### Priority Score
- User Value: 6/10 (specific use case)
- Differentiation: 7/10 (NL approach)
- Complexity: 5/10
- GBase Match: 7/10 (can leverage RAG)
- **Final Score**: (6 × 7 × 7) / 5 = **59**

---

## Skill 8: Field Intelligence Assistant (字段智能助手)

### Problem Statement
Over-customization creates chaos. No one knows what fields mean. Custom objects proliferate without documentation.

### Target Users
- Salesforce Admins
- Developers
- Consultants

### GBase Capabilities Used
- [x] RAG Search
- [x] Multilingual
- [ ] Digital Human
- [ ] Voice Agent
- [x] MCP Tools
- [ ] Long Workflow

### Technical Approach
1. Crawl org metadata via Metadata API
2. Build RAG index of objects/fields/relationships
3. Answer "what does X field do?" queries
4. Detect unused fields
5. Suggest field consolidation
6. Generate documentation

### API Dependencies
- Metadata API (full org scan)
- Tooling API (usage stats)
- REST API (sample data)

### Differentiation
| Feature | Agentforce | GBase Skill |
|---------|------------|-------------|
| Field documentation | Manual | AI-generated |
| Usage analysis | None | Built-in |
| NL field queries | No | Yes |
| Consolidation recommendations | None | AI-driven |

### Implementation Effort
- **Complexity**: 5/10
- **Timeline**: 3-4 weeks
- **Dependencies**: Metadata RAG index

### Priority Score
- User Value: 7/10 (admin productivity)
- Differentiation: 7/10 (unique approach)
- Complexity: 5/10
- GBase Match: 8/10 (RAG perfect fit)
- **Final Score**: (7 × 7 × 8) / 5 = **78**

---

## Summary: All Skills Ranked by Priority Score

| Rank | Skill | Score | User Value | Differentiation | Complexity | GBase Match |
|------|-------|-------|------------|-----------------|------------|-------------|
| 1 | Natural Language Query Assistant | **162** | 9 | 9 | 5 | 10 |
| 2 | Digital Human Service Agent | **114** | 8 | 10 | 7 | 10 |
| 3 | Salesforce Data Doctor | **108** | 9 | 8 | 6 | 9 |
| 4 | Voice-Powered Salesforce | **96** | 8 | 8 | 6 | 9 |
| 5 | AI Onboarding Coach | **84** | 8 | 7 | 6 | 9 |
| 6 | Field Intelligence Assistant | **78** | 7 | 7 | 5 | 8 |
| 7 | Long Workflow Executor | **72** | 7 | 9 | 7 | 8 |
| 8 | Smart Form Builder | **59** | 6 | 7 | 5 | 7 |
