# System Arkitektur - Enterprise Strategy Platform

## Tech Stack

### Frontend
- **React 19.2** med Hooks (useState, useEffect, custom hooks)
- **Vite** for build og hot module replacement
- **React Router** for navigation
- **Tailwind CSS v4** med custom design tokens
- **Lucide React** for ikoner

### Backend
- **Supabase** (PostgreSQL + PostgREST + Real-time)
- **Row Level Security (RLS)** for adgangskontrol
- **PostgreSQL Functions** for beregningslogik
- **Database Triggers** for automatisk dataopdatering

### State Management
- React hooks (lokal state)
- Supabase real-time subscriptions for live updates
- URL state for filtre og params

## Database Hierarki

### Core Struktur
```
organizations
  └── value_streams (klassificering: Supporting, Core, Strategic)
        └── capabilities (L0 capabilities)
              └── sub_capabilities (L1 capabilities)
                    ├── services (atomic services under sub-capabilities)
                    └── business_goals
                          └── processes
                                └── process_analysis_elements
                                      └── gaps
```

### Nøgle Tabeller

**value_streams**
- id, name, description, classification, organization_id

**capabilities**
- id, name, description, value_stream_id

**sub_capabilities**
- id, name, parent_capability_id
- current_maturity (1-5), target_maturity (1-5)
- business_value (1-5), strategic_priority (Must Have/Should Have/Nice to Have)
- next_review (date)

**services**
- id, name, parent_subcapability_id
- Linking table mellem sub_capabilities og tekniske services

**business_goals**
- id, name, capability_id
- current_state, desired_state
- current_maturity (1-5), target_maturity (1-5)
- next_review (date)

**gaps**
- id, title, description, status
- capability_id, service_id (hvis service-level gap)
- business_responsible_id, project_lead_id
- priority_score (beregnet), auto_generated
- estimated_effort (Low/Medium/High)
- source_maturity_current, source_maturity_target
- calculation_basis (JSONB - audit trail)
- deleted_at (soft delete), deletion_reason

**solutions**
- id, name, status (Planning/In Progress/Live)
- strategy_type (Maintain/Uplift/Transform/New build/TBD)
- business_owner_id, technical_owner_id
- expected_start, estimated_duration_value, estimated_duration_unit
- upgrade_newbuild_budget, annual_maintenance_cost

**gap_actions**
- Linkage table: gap_id ↔ solution_id
- Mange-til-mange forhold

**processes**
- id, name, business_goal_id

**process_analysis_elements**
- id, name, process_id
- as_is, to_be (workflow beskrivelser)

## Beregningslogik

### Priority Score (gaps table)
**Formel:**
```
base_score = business_value × maturity_gap
priority_weight = Strategic Priority weight (Must Have: 10, Should Have: 7, Nice to Have: 3)
effort_penalty = Estimated Effort penalty (High: -3, Medium: -2, Low: -1)
final_score = base_score + priority_weight + effort_penalty
```

**Thresholds:**
- >= 16: Critical (red)
- >= 12: High (yellow)
- >= 10: Medium (blue)
- < 10: Low (grey)

**Database Function:**
- `calculate_gap_priority_score(p_gap_id UUID)` - Beregner og gemmer priority_score
- Trigger: Auto-execute ved insert/update af relevante felter

### Health Indicators (capabilities)
**States:**
1. **Grey** - Not started (ingen business goals eller mangler definition)
2. **Red** - Critical issues (critical gaps unsolved)
3. **Yellow** - Needs attention (high gaps unsolved eller 5+ total unsolved)
4. **Blue** - Work in progress (incomplete process elements eller business goals)
5. **Green** - All good (alle mål opfyldt, løsninger på plads)

**Beregning:**
- Aggregerer data fra business_goals, processes, gaps, solutions
- Weighted completion percentage (goals: 20%, as-is: 15%, to-be: 25%, gaps solved: 25%, reviews: 15%)
- Implementeret i `src/lib/capabilityHealth.js`

## Arkitektur Patterns

### 1. Soft Delete Pattern
- Alle slettede rækker beholder data med `deleted_at` timestamp
- Queries filtrerer automatisk: `.is('deleted_at', null)`
- Tillader audit trail og data recovery

### 2. Automatic Calculation Triggers
- Priority scores beregnes automatisk ved insert/update
- Maturity gap beregnes som GENERATED column: `target_maturity - current_maturity`
- Calculation basis gemmes i JSONB for transparens

### 3. Row Level Security (RLS)
- Organization-baseret adgangskontrol
- User roles: Admin, Supervisor, Business Owner, User
- Delete permissions: Kun business_responsible + admin/supervisor

### 4. Status Lifecycle Management
- Gaps: Identified → Validated → Approved → In Progress → Resolved
- Solutions: Planning → In Progress → Live
- Status transitions logges i history tables (gap_status_history)

### 5. Real-time Subscriptions (fremtid)
- Supabase real-time for live opdateringer
- Multi-user collaboration support

## Filstruktur

```
src/
├── pages/               # Route components
│   ├── ValueStreamsPage.jsx
│   ├── CapabilityDetailPageNew.jsx
│   ├── SubCapabilityDetailPage.jsx
│   ├── BusinessGoalDetailPage.jsx
│   ├── GapManagementPage.jsx
│   ├── GapDetailPage.jsx
│   ├── SolutionsProjectsPage.jsx
│   ├── SolutionDetailPage.jsx
│   ├── StrategyPlanningPage.jsx
│   ├── ProcessOverviewPage.jsx
│   └── MyWorkPage.jsx
├── components/
│   ├── ui/              # Generic UI components
│   │   ├── Card.jsx
│   │   └── Dialog.jsx
│   ├── layout/          # Layout components
│   │   ├── Layout.jsx
│   │   ├── Navigation.jsx
│   │   └── Sidebar.jsx
│   ├── AddGapDialog.jsx
│   ├── AddSolutionDialog.jsx
│   ├── SubCapabilityAssessmentDialog.jsx
│   └── ...
├── lib/
│   ├── supabase.js              # Supabase client
│   ├── queries.js               # Query field definitions
│   ├── capabilityHealth.js      # Health calculation logic
│   └── strategicOverview.js     # Portfolio metrics
├── styles/
│   ├── designSystem.js          # Design tokens
│   └── index.css                # Global Tailwind
└── contexts/
    └── AuthContext.jsx          # Authentication context
```

## Database Migrations

**Konvention:**
- Filnavn: `{nummer}_{beskrivelse}.sql`
- Eksempel: `065_add_dynamic_gap_analysis_fields.sql`
- Idempotent: Brug `IF NOT EXISTS`, `CREATE OR REPLACE`
- Conditional execution: Check for column/table existence før ALTER

**Nøgle Migrations:**
- `014_disable_value_streams_capabilities_rls.sql` - RLS setup
- `065_add_dynamic_gap_analysis_fields.sql` - Priority scoring infrastructure
- `20251209145952_update_priority_thresholds.sql` - Threshold adjustments

## Performance Optimizations

### Database Indexes
```sql
CREATE INDEX idx_gaps_priority_score ON gaps(priority_score DESC);
CREATE INDEX idx_gaps_capability_id ON gaps(capability_id);
CREATE INDEX idx_gaps_service_id ON gaps(service_id);
CREATE INDEX idx_gaps_deleted_at ON gaps(deleted_at) WHERE deleted_at IS NULL;
```

### Query Patterns
- Brug `select('${QUERY_FIELDS}')` konstanter for konsistente joins
- Undgå N+1 queries - brug nested selects i Supabase
- Prefetch related data i enkelt query

### Frontend
- Lazy loading for lange lister
- Debounce søgefelter
- Cache capability health beregninger

## Security Principles

1. **Never trust client input** - Validate på server-side
2. **RLS enforcement** - Alle queries går gennem RLS policies
3. **Audit trails** - Log kritiske handlinger (deletion_reason, calculation_basis)
4. **Soft delete** - Aldrig hard delete af forretningsdata
5. **Permission checks** - Client-side checks + server-side enforcement

## Integration Points

### Supabase Client
```javascript
import { supabase } from '../lib/supabase';

// Query pattern
const { data, error } = await supabase
  .from('gaps')
  .select(GAP_QUERY_FIELDS)
  .eq('capability_id', capId)
  .is('deleted_at', null);
```

### Authentication
```javascript
import { useAuth } from '../contexts/AuthContext';
const { user, signOut } = useAuth();
```

## Deployment

**Environment Variables:**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Public anonymous key

**Build:**
```bash
npm run build  # Vite build → dist/
```

**Hosting:**
- Frontend: Vercel / Netlify / Static hosting
- Backend: Supabase managed PostgreSQL
- Database migrations: Run via Supabase CLI eller SQL Editor

## Critical Design Decisions

### Why Soft Delete?
- Maintain audit trail for compliance
- Allow data recovery
- Preserve historical linkages for reporting

### Why PostgreSQL Functions for Calculations?
- Single source of truth
- Consistent calculation logic
- Trigger-based automation
- Performance (server-side execution)

### Why Service-Level Gaps?
- Granular gap tracking under sub-capabilities
- Inherit business_value + strategic_priority from parent
- Enable service-specific maturity assessments

### Why Priority Score vs Manual Priority?
- Objective, data-driven prioritization
- Transparent calculation basis (stored in JSONB)
- Automatic recalculation when inputs change
- Reduce subjective bias

## Future Considerations

- **Real-time collaboration** - Supabase subscriptions for multi-user editing
- **Materialized views** - For heavy portfolio aggregations
- **Export functionality** - PDF/Excel reports
- **Workflow automation** - Notifications for overdue reviews
- **AI-powered gap detection** - Automatic gap generation from process analysis
