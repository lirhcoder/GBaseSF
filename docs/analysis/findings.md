# Research Findings

> **Project**: Salesforce x GBase Skill Development
> **Last Updated**: 2026-01-10

---

## 1. Salesforce Products Overview

### Cloud Products
| Product | Description | Key APIs | GBase Opportunity |
|---------|-------------|----------|-------------------|
| Sales Cloud | CRM, Lead/Opportunity management | REST, Bulk | Multilingual sales assistant |
| Service Cloud | Case management, Support | REST, Streaming | Digital Human customer service |
| Marketing Cloud | Campaign automation | REST, SOAP | AI content generation |
| Commerce Cloud | B2B/B2C commerce | REST | Voice ordering |
| Data Cloud | CDP, Segmentation | REST, Connect | Data cleaning skill |
| Einstein/Agentforce | AI capabilities | Agent API | All GBase skills |
| MuleSoft | API management | Various | MCP integration |
| Tableau | Analytics | REST | NL query to dashboard |

### Key Updates (2025-2026)
- **REST API v66.0 (Spring '26)**: OpenAPI specs, optional fields support
- **Summer '25 (v64.0)**: Auto-generate SDKs, wildcard URIs
- **Winter '26**: Improved field-level security handling
- **Outbound message timeout**: Reduced from 60s to 20s
- **Streaming API**: Self-healing on disconnects

---

## 2. API Capabilities

### REST API
- **Endpoint**: `/services/data/vXX.0/`
- **Auth**: OAuth 2.0
- **Limits**: TBD
- **Notes**:

### Bulk API
- **Version**: 2.0
- **Use Case**: Large data operations
- **Limits**: TBD

### Streaming API
- **Protocol**: CometD (Bayeux)
- **Use Case**: Real-time notifications
- **Limits**: TBD

### Agent API (Agentforce)
- **Status**: GA
- **Docs**: https://developer.salesforce.com/docs/einstein/genai/guide/agent-api.html
- **Notes**:

---

## 3. MCP Support

### Official Status
- **Announcement**: June 2025
- **Pilot Start**: July 2025 (Agentforce 3.0)
- **Hosted MCP Servers Beta**: October 2025
- **GA Timeline**: February 2026

### Available MCP Servers
| Server | Source | Tools | Notes |
|--------|--------|-------|-------|
| Salesforce DX MCP | Official (NPM) | sf commands, deployment | Developer Preview May 2025 |
| Salesforce Hosted MCP | Official (Beta) | Data access, CRUD | Beta Oct 2025, GA Feb 2026 |
| mcp-server-salesforce | Community (GitHub) | SOQL, CRUD | Open source |
| Heroku MCP | Official | Custom servers | Managed infrastructure |
| MuleSoft MCP | Official | API integration | Enterprise tier |
| Slack MCP | Official (Pilot) | Slack integration | Limited access |

### MCP Key Features
- **Native MCP Client**: Built into Agentforce 3.0
- **Enterprise MCP Registry**: Central tool management with security policies
- **AgentExchange**: Curated catalog of vetted MCP servers
- **Heroku AppLink**: On-demand scaling for custom MCP servers
- **No-code deployment**: Via AgentBuilder

### MCP Limitations
- **Premium Tier Only**: MCP largely limited to early access/enterprise customers
- **No General-Purpose Server**: Platform-wide MCP server not yet released
- **Controlled Access**: MCP restricted to Agentforce framework
- **Spring '26 Connected App Restriction**: New connected apps require Salesforce Support approval

### GBase MCP Advantage
- **Already GA**: GBase MCP support since v3.4.4 (ahead of Salesforce)
- **Open Integration**: Not locked to single platform
- **Custom Tools**: Flexible MCP tool configuration per Bot

---

## 4. User Pain Points

### From Community Forums (2025)

#### High Priority
| Pain Point | Source | Frequency | Impact | GBase Solution |
|------------|--------|-----------|--------|----------------|
| Navigation complexity | 40% users frustrated | Very High | Productivity loss | NL interface (no navigation needed) |
| Data quality issues | Community forums | Very High | AI failure, reports unusable | Data cleaning skill |
| Lack of training/support | Surveys | High | Low adoption | AI-guided onboarding |
| Performance/lag | Reddit, Quora | High | 5+ sec field loads | Local processing, caching |
| Mobile UX poor | Community | High | Field work blocked | Voice Agent, Digital Human |
| Integration failures | Forums | High | Manual re-entry | Stable MCP connectors |
| Setup complexity | Quora | High | Expert needed | No-code GBase setup |

#### Medium Priority
| Pain Point | Source | Frequency | Impact | GBase Solution |
|------------|--------|-----------|--------|----------------|
| Over-customization chaos | StarrData | Medium | No one knows fields | AI field mapping |
| Webform limitations | SalesforceBen | Medium | Data capture issues | Smart forms |
| License cost confusion | UpperEdge | Medium | Budget overruns | Transparent pricing |
| Report/dashboard limits | Community | Medium | Export restrictions | Custom analytics |

### Agentforce-Specific Pain Points (2025)

#### Critical Issues
| Pain Point | Data | Impact | GBase Advantage |
|------------|------|--------|-----------------|
| Only 8,000 deals signed | vs 1B target | Adoption failure | Proven deployment |
| $2/conversation pricing | Prohibitive for SMB/nonprofit | Cost barrier | Flat rate pricing |
| Chat-centric UX | <20% adoption rate | Workflow disruption | Embedded actions |
| LLM accuracy variance | "Confidently wrong" | Legal/reputation risk | RAG grounding |
| 20 agent limit per org | Enterprise scaling blocked | Growth ceiling | No limit |
| Data quality dependency | 77% deployment failure | Project delays | Data cleaning skill |
| Complex setup | Skilled devs required | Time/cost overrun | Low-code setup |
| Agent Script burden | CIOs absorb AI cost | Budget pressure | Managed service |

#### Adoption Reality (mid-2025)
- **Target**: 1 billion AI agents
- **Actual**: ~8,000 deals (3,000 paid, 2,000 trials)
- **CFO statement**: "Modest" adoption
- **Revenue forecast**: Below Wall Street expectations ($40.5-40.9B vs $41.35B expected)
- **Pattern from World Tours**: "Most not ready for Agentforce. Still drowning in bad data."

### From Previous Research (GBase_Agentforce_Opportunity_Analysis.html)
| Pain Point | Agentforce Issue | GBase Solution |
|------------|------------------|----------------|
| 77% deployment failure | Data quality issues | Stable RAG + Agent |
| 60s timeout | Complex task failure | Long workflow support |
| 20 agent limit | Enterprise scaling | No limit |
| Weak multilingual | Poor non-English | 10 language support |
| No digital human | Missing persona | Digital Human v2 |
| High cost ($13,600/user/year) | Budget pressure | 80%+ cost reduction |

---

## 5. GBase Capability Mapping

### Current GBase Capabilities (v3.4.5)
| Capability | Version | Relevance to Salesforce |
|------------|---------|------------------------|
| 10-language support | v3.2+ | High - Multilingual queries |
| MCP Tools | v3.4.4 | High - API integration |
| Voice Agent | v3.4.3 | Medium - Voice interaction |
| Digital Human | v3.4.0 | High - Customer facing |
| RAG + LLM | Core | High - Knowledge retrieval |
| Box/SharePoint Connector | v3.4.5 | Medium - Document sync |
| Long Workflow | v3.4.5 | High - Complex processes |

---

## 6. Competitive Analysis

### Agentforce vs GBase
| Feature | Agentforce | GBase | Advantage |
|---------|------------|-------|-----------|
| Languages | Limited | 10 | GBase |
| Digital Human | No | Yes | GBase |
| Timeout | 60s | No limit | GBase |
| MCP | Pilot (Jul 2025) | GA (v3.4.4) | GBase |
| Cost | $13,600/user/yr | ~$1,000/mo | GBase |

---

## 7. Technical Notes

### API Integration Patterns
- TBD

### Authentication Flow
- TBD

### Data Flow Architecture
- TBD

---

## 8. Reference Links

### Official Docs
- [Salesforce Developer Docs](https://developer.salesforce.com/docs)
- [Agentforce Developer Center](https://developer.salesforce.com/developer-centers/agentforce)
- [Agent API Guide](https://developer.salesforce.com/docs/einstein/genai/guide/agent-api.html)
- [MCP Support](https://developer.salesforce.com/docs/einstein/genai/guide/mcp.html)

### Community Resources
- [Salesforce Ideas](https://ideas.salesforce.com)
- [Trailblazer Community](https://trailhead.salesforce.com/trailblazer-community)
- [Reddit r/salesforce](https://reddit.com/r/salesforce)

### Open Source
- [mcp-server-salesforce](https://github.com/SurajAdsul/mcp-server-salesforce)
- [simple-salesforce](https://github.com/simple-salesforce/simple-salesforce)
