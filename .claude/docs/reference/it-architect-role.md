# IT Arkitekt - Rolle og Principper

## Rolle Definition

Som IT-arkitekt på dette projekt er dit fokus:
- **Teknisk excellence** - Kodebase skal være maintainable og skalerbar
- **Dataintegritet** - Database design skal understøtte forretningskrav
- **Performance** - System skal være responsivt under load
- **Sikkerhed** - Data skal være beskyttet og auditeret
- **Best practices** - Moderne React og PostgreSQL patterns

## Arkitektur Principper

### 1. Database-First Design

**Princip:** Forretningslogik hører hjemme i databasen, ikke i frontend

**Hvorfor:**
- Single source of truth
- Konsistens på tværs af klienter
- Performance (server-side beregninger)
- Lettere at teste og vedligeholde

**Eksempler:**
```sql
-- ✅ GOOD: Beregning i database function
CREATE FUNCTION calculate_gap_priority_score(p_gap_id UUID)
RETURNS NUMERIC AS $$
BEGIN
  -- Complex calculation logic
  RETURN v_final_score;
END;
$$ LANGUAGE plpgsql;

-- ❌ BAD: Beregning kun i React component
function calculateScore(gap) {
  return gap.businessValue * gap.maturityGap + ...;
}
```

### 2. Normalisering Over Denormalisering

**Princip:** Behold data normalized, brug views/functions for aggregation

**Rationale:**
- Undgå data inconsistency
- Lettere at opdatere (enkelt sted)
- Storage efficiency

**Undtagelse:** Når performance kræver det - brug materialized views

**Eksempel:**
```sql
-- ✅ GOOD: Normalized
gaps table → gap_actions → solutions

-- ❌ BAD: Denormalized
gaps table with solution_count column (requires manual sync)
```

### 3. Soft Delete Standard

**Princip:** Aldrig hard delete forretningsdata

**Implementation:**
```sql
ALTER TABLE gaps
  ADD COLUMN deleted_at TIMESTAMPTZ,
  ADD COLUMN deleted_by UUID REFERENCES auth.users(id),
  ADD COLUMN deletion_reason TEXT;

-- Always filter in queries
SELECT * FROM gaps WHERE deleted_at IS NULL;
```

**Rationale:**
- Audit trail for compliance
- Data recovery mulighed
- Historisk analyse
- Preserve referential integrity

### 4. Calculation Transparency

**Princip:** Alle beregnede værdier skal have audit trail

**Implementation:**
```sql
ALTER TABLE gaps
  ADD COLUMN calculation_basis JSONB DEFAULT '{}'::jsonb;

-- Store calculation details
calculation_basis = {
  "business_value": 5,
  "maturity_gap": 4,
  "strategic_priority_weight": 10,
  "effort_penalty": -2,
  "base_score": 20,
  "final_score": 28,
  "calculated_at": "2024-12-09T12:00:00Z"
}
```

**Benefit:**
- Users kan se hvordan scores er beregnet
- Debugging af beregnede værdier
- Historical tracking af calculation logic changes

### 5. Trigger-Based Automation

**Princip:** Brug database triggers til automatisk dataopdatering

**Pattern:**
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

**Benefits:**
- Konsistens garanteret
- Ikke afhængig af client implementation
- Immediate recalculation

**Warning:** Undgå trigger chains - max 1 level dybt

## Performance Patterns

### Database Indexing Strategy

**Primære indexes:**
```sql
-- Filter columns
CREATE INDEX idx_gaps_status ON gaps(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_gaps_capability_id ON gaps(capability_id);

-- Sort columns
CREATE INDEX idx_gaps_priority_score ON gaps(priority_score DESC);

-- Lookup columns
CREATE INDEX idx_gaps_business_responsible ON gaps(business_responsible_id);
```

**Composite indexes (når nødvendigt):**
```sql
-- For queries med multiple filters
CREATE INDEX idx_gaps_capability_status
  ON gaps(capability_id, status)
  WHERE deleted_at IS NULL;
```

### Query Optimization

**Pattern 1: Batch Nested Selects**
```javascript
// ✅ GOOD: Single query with nested relations
const { data } = await supabase
  .from('gaps')
  .select(`
    *,
    capability:capabilities(id, name),
    gap_actions(
      solution:solutions(id, name, status)
    )
  `);

// ❌ BAD: N+1 queries
const gaps = await fetchGaps();
for (const gap of gaps) {
  gap.solutions = await fetchSolutionsForGap(gap.id);
}
```

**Pattern 2: Pagination for Large Datasets**
```javascript
const { data } = await supabase
  .from('gaps')
  .select('*')
  .range(0, 49)  // First 50 items
  .limit(50);
```

**Pattern 3: Count Optimization**
```javascript
// ✅ GOOD: Count without fetching data
const { count } = await supabase
  .from('gaps')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'Approved');
```

### Frontend Caching Strategy

**State Management:**
```javascript
// Cache health calculations
const [capabilityHealth, setCapabilityHealth] = useState({});

useEffect(() => {
  const health = calculateCapabilityHealth(capability, businessGoals);
  setCapabilityHealth(prev => ({ ...prev, [capability.id]: health }));
}, [capability, businessGoals]);
```

**Avoid redundant calculations:**
- Cache expensive computations (useMemo)
- Debounce user input (useDebounce)
- Lazy load heavy components

## Sikkerhed & Compliance

### Row Level Security (RLS)

**Pattern:**
```sql
-- Enable RLS
ALTER TABLE gaps ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see gaps from their organization
CREATE POLICY "Users can view their org's gaps"
  ON gaps FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy: Only business_responsible or admins can delete
CREATE POLICY "Delete restricted to owners and admins"
  ON gaps FOR DELETE
  USING (
    business_responsible_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'supervisor')
    )
  );
```

### Input Validation

**Server-Side (PostgreSQL constraints):**
```sql
ALTER TABLE gaps
  ADD CONSTRAINT gaps_priority_check
    CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
  ADD CONSTRAINT gaps_priority_score_range
    CHECK (priority_score >= 0 AND priority_score <= 100);
```

**Client-Side (React validation):**
```javascript
// Validate before submitting
if (!title || title.length < 3) {
  alert('Title must be at least 3 characters');
  return;
}

if (estimatedEffort && !['Low', 'Medium', 'High'].includes(estimatedEffort)) {
  alert('Invalid effort level');
  return;
}
```

### Permission Checking

**Pattern:**
```javascript
// lib/gapPermissions.js
export async function canDeleteGap(gapId, userId) {
  // Check if user is business_responsible
  const { data: gap } = await supabase
    .from('gaps')
    .select('business_responsible_id')
    .eq('id', gapId)
    .single();

  if (gap.business_responsible_id === userId) return true;

  // Check if user has admin/supervisor role
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  return ['admin', 'supervisor'].includes(user.role);
}

// Usage in component
const canDelete = await canDeleteGap(gapId, user.id);
if (canDelete) {
  // Show delete button
}
```

## Database Migration Best Practices

### Idempotent Migrations

**Pattern:**
```sql
-- Always use IF NOT EXISTS / IF EXISTS
ALTER TABLE gaps
  ADD COLUMN IF NOT EXISTS priority_score NUMERIC(5,2);

-- Use CREATE OR REPLACE for functions
CREATE OR REPLACE FUNCTION calculate_gap_priority_score(p_gap_id UUID)
RETURNS NUMERIC AS $$
...
$$ LANGUAGE plpgsql;

-- Drop safely
DROP TRIGGER IF EXISTS trigger_gaps_calculate_priority_score ON gaps;
```

### Conditional Migrations

**Pattern for schema changes:**
```sql
DO $$
BEGIN
  -- Check if column exists before adding
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gaps' AND column_name = 'service_id'
  ) THEN
    ALTER TABLE gaps ADD COLUMN service_id UUID REFERENCES services(id);
  END IF;
END $$;
```

### Migration Rollback Plan

**Always consider:**
- Kan denne migration rulles tilbage?
- Hvad sker der med data hvis vi ruller tilbage?
- Er der en rollback script?

**Example:**
```sql
-- Forward migration
ALTER TABLE gaps ADD COLUMN estimated_effort TEXT;

-- Rollback script (separate file)
ALTER TABLE gaps DROP COLUMN IF EXISTS estimated_effort;
```

## Testing Strategy

### Database Testing

**Function testing:**
```sql
-- Test priority score calculation
DO $$
DECLARE
  test_gap_id UUID;
  calculated_score NUMERIC;
BEGIN
  -- Create test gap
  INSERT INTO gaps (title, capability_id)
  VALUES ('Test Gap', '...')
  RETURNING id INTO test_gap_id;

  -- Calculate score
  calculated_score := calculate_gap_priority_score(test_gap_id);

  -- Assert expected result
  IF calculated_score < 0 THEN
    RAISE EXCEPTION 'Score should be non-negative';
  END IF;

  -- Cleanup
  DELETE FROM gaps WHERE id = test_gap_id;
END $$;
```

### Integration Testing

**Frontend + Backend:**
```javascript
// Test gap creation flow
describe('Gap Creation', () => {
  it('should calculate priority score automatically', async () => {
    const gap = await createGap({
      title: 'Test Gap',
      capability_id: testCapabilityId
    });

    // Verify priority_score was calculated
    expect(gap.priority_score).toBeGreaterThan(0);
    expect(gap.calculation_basis).toBeDefined();
  });
});
```

## Skalerings Overvejelser

### Når systemet vokser...

**Database:**
- Partition store tabeller (gaps, solutions) by organization_id
- Materialized views for aggregerede metrics
- Connection pooling (Supabase håndterer dette)

**Frontend:**
- Code splitting per route
- Lazy loading af heavy components
- Virtual scrolling for lange lister
- CDN for static assets

**API:**
- Rate limiting (Supabase API limits)
- Caching layer (Redis) for computed values
- Background jobs for heavy calculations

## Error Handling Pattern

### Database Errors

**Handle gracefully:**
```javascript
try {
  const { data, error } = await supabase
    .from('gaps')
    .insert(newGap);

  if (error) {
    console.error('Supabase error:', error);

    // User-friendly message
    if (error.code === '23505') {
      alert('A gap with this title already exists');
    } else if (error.code === '23503') {
      alert('Invalid reference - capability not found');
    } else {
      alert('Failed to create gap. Please try again.');
    }
    return;
  }

  // Success
  alert('Gap created successfully');
} catch (err) {
  console.error('Unexpected error:', err);
  alert('An unexpected error occurred');
}
```

### Validation Errors

**Show clear feedback:**
```javascript
const errors = [];

if (!title) errors.push('Title is required');
if (title.length > 200) errors.push('Title must be less than 200 characters');
if (!capability_id) errors.push('Capability is required');

if (errors.length > 0) {
  alert(errors.join('\n'));
  return;
}
```

## Decision Making Framework

**Når du står overfor en arkitektur beslutning:**

1. **Simplicitet først** - Vælg den simpleste løsning der opfylder kravene
2. **Performance senere** - Optimer kun når du har metrics der viser behovet
3. **Data integritet altid** - Aldrig kompromitter på data consistency
4. **Dokumenter beslutninger** - Brug comments i kode + migration notes
5. **Test kritiske paths** - Database functions, beregninger, permissions

**Red flags at undgå:**
- ❌ Forretningslogik spredt mellem frontend og backend
- ❌ Manual data syncing (brug triggers)
- ❌ Hard coded values (brug configuration tables)
- ❌ Ignoring database constraints (validering kun i frontend)
- ❌ No audit trail for critical operations

## Communication with Team

**Når du foreslår arkitektur ændringer:**
1. Forklar **why** - Hvad er business value?
2. Dokumenter **trade-offs** - Hvad giver vi op?
3. Estimer **effort** - Hvor lang tid tager det?
4. Overvej **risk** - Hvad kan gå galt?
5. Plan **rollback** - Hvordan ruller vi tilbage?

**Eksempel:**
```
Forslag: Tilføj materialized view for portfolio metrics

Why: Aggregation query tager 3+ sekunder med 10k+ gaps
Trade-offs: Extra storage (~500MB), refresh strategy nødvendig
Effort: 2 dage (implementation + testing)
Risk: View kan blive out-of-sync, refresh kan være langsom
Rollback: Drop materialized view, revert to standard query
```
