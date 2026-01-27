# Lessons Learned - Enterprise Strategy Platform

## Overview

This document captures lessons learned during development of the Enterprise Strategy Platform. Use this as a reference to avoid past mistakes and build on successful patterns.

**Format:** Each lesson includes context, what we learned, and the recommended approach going forward.

---

## Database Design

### Lesson 1: Always Use Soft Delete

**Context:** Initially considered hard deletes for gaps and solutions.

**What we learned:**
- Hard deletes break audit trails
- Recovering accidentally deleted data is impossible
- Historical reporting needs deleted records
- Foreign key cascades can cause unintended data loss

**Recommendation:**
```sql
-- Always include soft delete columns
ALTER TABLE [table_name]
  ADD COLUMN deleted_at TIMESTAMPTZ,
  ADD COLUMN deleted_by UUID REFERENCES auth.users(id),
  ADD COLUMN deletion_reason TEXT;

-- Always filter in queries
SELECT * FROM [table_name] WHERE deleted_at IS NULL;
```

**Status:** ✅ Implemented across all core tables

---

### Lesson 2: Store Calculation Basis for Transparency

**Context:** Priority scores were initially calculated without audit trail.

**What we learned:**
- Users need to understand why a gap has a certain priority
- Debugging score calculations was difficult
- Changing calculation logic broke historical understanding
- JSONB columns are perfect for storing calculation metadata

**Recommendation:**
```sql
-- Store calculation inputs and outputs
ALTER TABLE gaps
  ADD COLUMN calculation_basis JSONB DEFAULT '{}'::jsonb;

-- Store in calculation function
calculation_basis = jsonb_build_object(
  'business_value', v_business_value,
  'maturity_gap', v_maturity_gap,
  'base_score', v_base_score,
  'final_score', v_final_score,
  'calculated_at', NOW()
)
```

**Status:** ✅ Implemented for priority scoring

---

### Lesson 3: Use Database Triggers for Automatic Calculations

**Context:** Initially calculated priority scores in React components.

**What we learned:**
- Client-side calculations are inconsistent across different pages
- Manual recalculation required when parent data changes
- Database triggers ensure consistency automatically
- Single source of truth for business logic

**Pitfall to avoid:**
- Don't create trigger chains (trigger → trigger → trigger)
- Keep triggers simple and focused
- Document which fields trigger recalculation

**Recommendation:**
```sql
CREATE TRIGGER trigger_gaps_calculate_priority_score
  AFTER INSERT OR UPDATE OF
    source_maturity_current,
    source_maturity_target,
    estimated_effort
  ON gaps
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_gap_priority_score();
```

**Status:** ✅ Implemented for gap priority scoring

---

### Lesson 4: Use GENERATED Columns for Simple Calculations

**Context:** Maturity gap was initially calculated in application code.

**What we learned:**
- Simple calculations (A - B) belong in database as GENERATED columns
- No triggers needed for trivial math
- Always consistent, never stale
- Queryable and indexable

**Recommendation:**
```sql
-- For simple calculations, use GENERATED ALWAYS AS
maturity_gap INTEGER GENERATED ALWAYS AS (target_maturity - current_maturity) STORED
```

**Status:** ✅ Implemented for maturity_gap in sub_capabilities and gaps

---

## Frontend Development

### Lesson 5: Always Filter Soft-Deleted Records

**Context:** Forgot to filter `deleted_at IS NULL` in several queries, showing deleted records.

**What we learned:**
- Soft-deleted records will appear in queries unless filtered
- Missing filter caused confusion ("I deleted that gap, why is it still showing?")
- Need consistent query patterns across codebase

**Pitfall:** Easy to forget when writing new queries

**Recommendation:**
```javascript
// ALWAYS include soft-delete filter
const { data, error } = await supabase
  .from('gaps')
  .select('*')
  .eq('capability_id', capId)
  .is('deleted_at', null); // CRITICAL - never forget this
```

**Prevention:** Code review checklist item

**Status:** ⚠️ Needs vigilance - review all queries

---

### Lesson 6: Use Query Field Constants

**Context:** Different pages queried gaps with different field selections, causing inconsistent data.

**What we learned:**
- Inconsistent field selection leads to missing data in UI
- Repeated query definitions are error-prone
- Centralized query definitions improve maintainability

**Recommendation:**
```javascript
// lib/queries.js
export const GAP_QUERY_FIELDS = `
  *,
  capability:capabilities(id, name),
  service:services(id, name),
  business_responsible:users!business_responsible_id(id, email, full_name)
`;

// Usage
const { data } = await supabase
  .from('gaps')
  .select(GAP_QUERY_FIELDS)
  .is('deleted_at', null);
```

**Status:** ✅ Implemented for gaps, solutions, capabilities

---

### Lesson 7: Handle Loading and Error States

**Context:** Initial pages showed blank screens during data loading.

**What we learned:**
- Users need feedback during async operations
- Blank screens look broken
- Error messages need to be user-friendly, not technical

**Recommendation:**
```jsx
function MyPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Always show loading state
  if (loading) return <LoadingSpinner />;

  // Always show error state
  if (error) return <ErrorMessage error={error} />;

  // Show empty state when no data
  if (!data || data.length === 0) return <EmptyState />;

  return <div>{/* Render data */}</div>;
}
```

**Status:** ✅ Implemented across all pages

---

## Architecture Decisions

### Lesson 8: Multi-Tenant Isolation via RLS

**Context:** Considered application-level organization filtering vs database RLS.

**What we learned:**
- Application-level filtering is error-prone (easy to forget)
- RLS provides defense-in-depth security
- Database enforces isolation automatically
- Less code to maintain in frontend

**Trade-off:**
- RLS policies can be complex to debug
- Need to ensure auth context (auth.uid()) is always set

**Recommendation:**
```sql
-- Enable RLS on all multi-tenant tables
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

-- Create organization-based policy
CREATE POLICY "users_view_own_org"
  ON [table_name] FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );
```

**Status:** ✅ Implemented across all core tables

---

### Lesson 9: Service-Level Gaps for Granularity

**Context:** Initially only had capability-level gaps, lacked service-specific tracking.

**What we learned:**
- Gaps exist at multiple levels (capability, sub-capability, service)
- Service-level gaps inherit parent business_value and strategic_priority
- More granular gap tracking improves actionability

**Pitfall:**
- Risk of gap duplication at multiple levels
- Inheritance logic can be confusing

**Recommendation:**
- Allow gaps at capability, sub-capability, and service levels
- Inherit business_value and strategic_priority from parent
- Clearly document inheritance in UI

**Status:** ✅ Implemented with service_id foreign key in gaps

---

### Lesson 10: Strategy Type Naming Evolution

**Context:** Originally used "Leverage", "Enhance" for solution strategies. Changed to "Maintain", "Uplift".

**What we learned:**
- Naming matters - use business language
- "Leverage" was confusing to business users
- "Maintain" and "Uplift" are clearer and more actionable

**Migration:**
```sql
-- Update enum values
UPDATE solutions
SET strategy_type = 'Maintain'
WHERE strategy_type = 'Leverage';

UPDATE solutions
SET strategy_type = 'Uplift'
WHERE strategy_type = 'Enhance';
```

**Recommendation:**
- Use business-friendly terminology
- Validate naming with actual users before finalizing
- Plan for terminology evolution

**Status:** ✅ Migrated to new terminology

---

## UI/UX Decisions

### Lesson 11: Consistent Color Semantics

**Context:** Different pages used different colors for the same concepts.

**What we learned:**
- Color consistency builds user mental models
- Health indicators should always use same color scheme
- Strategy types should have consistent color coding

**Recommendation:**
```javascript
// Define color semantics in design system
const healthColors = {
  grey: 'Not started',
  blue: 'Work in progress',
  green: 'All good',
  yellow: 'Needs attention',
  red: 'Critical issues',
};

const strategyColors = {
  maintain: 'bg-emerald-600',
  uplift: 'bg-amber-500',
  transform: 'bg-rose-600',
  newBuild: 'bg-blue-600',
};
```

**Status:** ✅ Documented in design system

---

### Lesson 12: Tab Limit in Dialogs

**Context:** AddGapDialog had 10+ tabs, became unusable on mobile.

**What we learned:**
- Max 7 tabs for usability
- Mobile screens can't fit many tabs
- Too many tabs indicate UI needs restructuring

**Recommendation:**
- Limit dialogs to max 7 tabs
- Use progressive disclosure (show/hide sections)
- Consider multi-step wizards for complex forms

**Status:** ✅ Refactored to 6 tabs max

---

## Performance

### Lesson 13: Index Frequently Filtered Columns

**Context:** Gap queries became slow with 1000+ records.

**What we learned:**
- Filter columns need indexes (status, deleted_at, organization_id)
- Sort columns need indexes (priority_score DESC)
- Foreign keys need indexes (capability_id, service_id)
- Composite indexes for multi-column filters

**Recommendation:**
```sql
-- Filter columns
CREATE INDEX idx_gaps_status ON gaps(status) WHERE deleted_at IS NULL;

-- Sort columns
CREATE INDEX idx_gaps_priority_score ON gaps(priority_score DESC);

-- Foreign keys
CREATE INDEX idx_gaps_capability_id ON gaps(capability_id);
```

**Status:** ✅ Implemented for gaps, solutions, capabilities

---

### Lesson 14: Avoid N+1 Queries

**Context:** Gap list page loaded slowly due to separate queries for each gap's capability.

**What we learned:**
- Supabase supports nested selects - use them!
- N+1 queries kill performance at scale
- Single query with nested data is much faster

**Anti-pattern:**
```javascript
// ❌ BAD: N+1 queries
const gaps = await fetchGaps();
for (const gap of gaps) {
  gap.capability = await fetchCapability(gap.capability_id);
}
```

**Recommendation:**
```javascript
// ✅ GOOD: Single query with nested select
const { data } = await supabase
  .from('gaps')
  .select(`
    *,
    capability:capabilities(id, name),
    gap_actions(solution:solutions(id, name))
  `);
```

**Status:** ✅ Implemented across all queries

---

## Migration & Deployment

### Lesson 15: Idempotent Migrations

**Context:** Migration failed on re-run because table already existed.

**What we learned:**
- Migrations must be idempotent (can run multiple times safely)
- Use IF NOT EXISTS, CREATE OR REPLACE
- Check for existence before ALTER TABLE ADD COLUMN

**Recommendation:**
```sql
-- Use IF NOT EXISTS
CREATE TABLE IF NOT EXISTS gaps (...);

-- Check before adding column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gaps' AND column_name = 'service_id'
  ) THEN
    ALTER TABLE gaps ADD COLUMN service_id UUID;
  END IF;
END $$;

-- Use CREATE OR REPLACE for functions
CREATE OR REPLACE FUNCTION calculate_gap_priority_score(...)
RETURNS NUMERIC AS $$ ... $$ LANGUAGE plpgsql;
```

**Status:** ✅ Convention established

---

### Lesson 16: Migration Rollback Planning

**Context:** Needed to rollback a migration, no rollback script existed.

**What we learned:**
- Always plan rollback strategy
- Not all migrations are reversible
- Data migrations are highest risk
- Document rollback steps

**Recommendation:**
- Create forward and rollback SQL files
- Test rollback in staging
- Document data preservation strategy
- Consider feature flags for major changes

**Status:** ⚠️ Needs improvement - document rollback plans

---

## Security

### Lesson 17: Never Trust Client Input

**Context:** Initially trusted client-side validation only.

**What we learned:**
- Client validation is for UX, not security
- Server-side constraints are mandatory
- Use PostgreSQL CHECK constraints for data integrity

**Recommendation:**
```sql
-- Server-side constraints
ALTER TABLE gaps
  ADD CONSTRAINT gaps_priority_check
    CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
  ADD CONSTRAINT gaps_maturity_range
    CHECK (source_maturity_current BETWEEN 1 AND 5);
```

**Status:** ✅ Implemented for critical fields

---

## Documentation

### Lesson 18: Document Calculation Logic

**Context:** Priority score formula was only in code, no documentation.

**What we learned:**
- Complex business logic needs documentation
- Future developers need to understand "why"
- Users need to trust calculations

**Recommendation:**
- Document formulas in architecture.md
- Store calculation basis in database (JSONB)
- Add code comments explaining business rules

**Status:** ✅ Documented in architecture.md and code

---

## Future Considerations

### Items to Address

1. **Real-time Collaboration**
   - Consider Supabase real-time subscriptions
   - Handle concurrent edits gracefully
   - Show who's viewing/editing what

2. **Audit Log**
   - Track all critical changes (gap status, solution assignments)
   - Who changed what, when, and why
   - Queryable audit trail

3. **Bulk Operations**
   - Bulk gap creation from Excel import
   - Bulk status updates
   - Transaction handling for consistency

4. **Notifications**
   - Email notifications for overdue reviews
   - Slack integration for gap approvals
   - Digest emails for portfolio updates

5. **Export Functionality**
   - PDF reports for executive review
   - Excel exports for offline analysis
   - Customizable report templates

6. **Performance Monitoring**
   - Track slow queries
   - Frontend performance metrics (Core Web Vitals)
   - Set up alerts for degradation

---

## Template for New Lessons

When adding new lessons, use this template:

### Lesson X: [Title]

**Context:** [What was the situation?]

**What we learned:**
- [Key insight 1]
- [Key insight 2]

**Pitfall:** [What to avoid]

**Recommendation:**
```[language]
[Code example or pattern to follow]
```

**Status:** [✅ Implemented / ⚠️ In Progress / ❌ Not Started]

---

## Contributing

When you encounter a significant learning moment:
1. Document it here
2. Include context and solution
3. Add code examples where helpful
4. Mark status of implementation
5. Update related documentation (architecture.md, etc.)

**Remember:** The goal is to help future developers (including yourself) avoid repeating mistakes and build on successes.
