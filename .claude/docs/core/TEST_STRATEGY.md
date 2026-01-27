# Test Strategy - Enterprise Strategy Platform

## Overview

Comprehensive testing strategy covering database functions, integration testing, and frontend testing for the Enterprise Strategy Platform.

---

## Testing Pyramid

```
        /\
       /  \
      / UI \          Unit Tests (70%)
     /______\
    /        \        Integration Tests (20%)
   / Database \
  /____________\      E2E Tests (10%)
```

**Philosophy:**
- **Unit tests** - Fast, isolated, many
- **Integration tests** - Medium speed, test interactions
- **E2E tests** - Slow, expensive, few critical paths

---

## Database Testing

### 1. Function Testing

**Pattern:** Test PostgreSQL functions in isolation

```sql
-- Test: calculate_gap_priority_score function
DO $$
DECLARE
  test_org_id UUID := '00000000-0000-0000-0000-000000000001';
  test_vs_id UUID;
  test_cap_id UUID;
  test_subcap_id UUID;
  test_gap_id UUID;
  calculated_score NUMERIC;
BEGIN
  -- Setup: Create test hierarchy
  INSERT INTO value_streams (id, name, organization_id, classification)
  VALUES (uuid_generate_v4(), 'Test Value Stream', test_org_id, 'Core')
  RETURNING id INTO test_vs_id;

  INSERT INTO capabilities (id, name, value_stream_id, organization_id)
  VALUES (uuid_generate_v4(), 'Test Capability', test_vs_id, test_org_id)
  RETURNING id INTO test_cap_id;

  INSERT INTO sub_capabilities (
    id, name, parent_capability_id, organization_id,
    business_value, strategic_priority,
    current_maturity, target_maturity
  )
  VALUES (
    uuid_generate_v4(), 'Test Sub-Capability', test_cap_id, test_org_id,
    5, 'Must Have', 1, 5
  )
  RETURNING id INTO test_subcap_id;

  -- Create test gap
  INSERT INTO gaps (
    id, title, capability_id, organization_id,
    source_maturity_current, source_maturity_target,
    estimated_effort
  )
  VALUES (
    uuid_generate_v4(), 'Test Gap', test_cap_id, test_org_id,
    1, 5, 'Low'
  )
  RETURNING id INTO test_gap_id;

  -- Execute function
  calculated_score := calculate_gap_priority_score(test_gap_id);

  -- Assertions
  IF calculated_score IS NULL THEN
    RAISE EXCEPTION 'Score should not be NULL';
  END IF;

  IF calculated_score < 0 THEN
    RAISE EXCEPTION 'Score should be non-negative, got %', calculated_score;
  END IF;

  -- Expected: business_value(5) * maturity_gap(4) + priority_weight(10) + effort_penalty(-1) = 29
  IF calculated_score <> 29 THEN
    RAISE EXCEPTION 'Expected score 29, got %', calculated_score;
  END IF;

  -- Verify calculation_basis was stored
  DECLARE
    basis_json JSONB;
  BEGIN
    SELECT calculation_basis INTO basis_json
    FROM gaps WHERE id = test_gap_id;

    IF basis_json IS NULL OR basis_json = '{}'::jsonb THEN
      RAISE EXCEPTION 'calculation_basis should be populated';
    END IF;
  END;

  -- Cleanup
  DELETE FROM gaps WHERE id = test_gap_id;
  DELETE FROM sub_capabilities WHERE id = test_subcap_id;
  DELETE FROM capabilities WHERE id = test_cap_id;
  DELETE FROM value_streams WHERE id = test_vs_id;

  RAISE NOTICE 'Test passed: calculate_gap_priority_score';
END $$;
```

---

### 2. Trigger Testing

**Pattern:** Verify triggers execute correctly

```sql
-- Test: Priority score trigger on gap insert/update
DO $$
DECLARE
  test_org_id UUID := '00000000-0000-0000-0000-000000000001';
  test_gap_id UUID;
  initial_score NUMERIC;
  updated_score NUMERIC;
BEGIN
  -- Insert gap (trigger should fire)
  INSERT INTO gaps (
    title, capability_id, organization_id,
    source_maturity_current, source_maturity_target,
    estimated_effort
  )
  VALUES (
    'Trigger Test Gap',
    (SELECT id FROM capabilities LIMIT 1),
    test_org_id,
    2, 4, 'Medium'
  )
  RETURNING id, priority_score INTO test_gap_id, initial_score;

  -- Assert: Score was calculated
  IF initial_score IS NULL OR initial_score = 0 THEN
    RAISE EXCEPTION 'Trigger did not calculate initial score';
  END IF;

  -- Update gap (trigger should recalculate)
  UPDATE gaps
  SET estimated_effort = 'Low'
  WHERE id = test_gap_id
  RETURNING priority_score INTO updated_score;

  -- Assert: Score changed after update
  IF updated_score = initial_score THEN
    RAISE EXCEPTION 'Trigger did not recalculate score on update';
  END IF;

  -- Cleanup
  DELETE FROM gaps WHERE id = test_gap_id;

  RAISE NOTICE 'Test passed: trigger_gaps_calculate_priority_score';
END $$;
```

---

### 3. RLS Policy Testing

**Pattern:** Test Row Level Security policies

```sql
-- Test: Verify organization isolation
DO $$
DECLARE
  user1_id UUID := '11111111-1111-1111-1111-111111111111';
  user2_id UUID := '22222222-2222-2222-2222-222222222222';
  org1_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  org2_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  gap1_id UUID;
  gap2_id UUID;
BEGIN
  -- Create gaps in different organizations
  INSERT INTO gaps (title, organization_id, capability_id)
  VALUES ('Org 1 Gap', org1_id, (SELECT id FROM capabilities WHERE organization_id = org1_id LIMIT 1))
  RETURNING id INTO gap1_id;

  INSERT INTO gaps (title, organization_id, capability_id)
  VALUES ('Org 2 Gap', org2_id, (SELECT id FROM capabilities WHERE organization_id = org2_id LIMIT 1))
  RETURNING id INTO gap2_id;

  -- Simulate user1 (org1) query
  SET LOCAL role TO authenticated;
  SET LOCAL request.jwt.claim.sub TO user1_id;

  -- User1 should see only org1 gaps
  IF EXISTS (SELECT 1 FROM gaps WHERE id = gap2_id) THEN
    RAISE EXCEPTION 'RLS failed: User1 can see Org2 gap';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM gaps WHERE id = gap1_id) THEN
    RAISE EXCEPTION 'RLS failed: User1 cannot see Org1 gap';
  END IF;

  -- Cleanup
  DELETE FROM gaps WHERE id IN (gap1_id, gap2_id);

  RAISE NOTICE 'Test passed: RLS organization isolation';
END $$;
```

---

### 4. Constraint Testing

**Pattern:** Verify database constraints

```sql
-- Test: Verify maturity range constraints
DO $$
BEGIN
  -- Test: current_maturity must be between 1-5
  BEGIN
    INSERT INTO sub_capabilities (
      name, parent_capability_id, organization_id,
      current_maturity, target_maturity
    )
    VALUES (
      'Invalid Maturity Test',
      (SELECT id FROM capabilities LIMIT 1),
      '00000000-0000-0000-0000-000000000001',
      0, 5  -- Invalid: current_maturity = 0
    );

    RAISE EXCEPTION 'Constraint failed to prevent invalid maturity value';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE 'Constraint correctly prevented invalid maturity';
  END;

  -- Test: Priority must be valid enum value
  BEGIN
    INSERT INTO gaps (
      title, capability_id, organization_id,
      priority
    )
    VALUES (
      'Invalid Priority Test',
      (SELECT id FROM capabilities LIMIT 1),
      '00000000-0000-0000-0000-000000000001',
      'InvalidPriority'  -- Invalid value
    );

    RAISE EXCEPTION 'Constraint failed to prevent invalid priority';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE 'Constraint correctly prevented invalid priority';
  END;

  RAISE NOTICE 'Test passed: Database constraints';
END $$;
```

---

## Integration Testing

### 1. Frontend + Backend Integration

**Framework:** React Testing Library + Jest

```javascript
// tests/integration/gapCreation.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AddGapDialog from '../../src/components/AddGapDialog';
import { supabase } from '../../src/lib/supabase';

// Mock Supabase
jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('Gap Creation Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create gap and calculate priority score automatically', async () => {
    const mockInsert = jest.fn().mockResolvedValue({
      data: {
        id: 'test-gap-id',
        title: 'Test Gap',
        priority_score: 18.5,
        priority: 'Critical',
        calculation_basis: {
          business_value: 5,
          maturity_gap: 3,
          base_score: 15,
          final_score: 18.5,
        },
      },
      error: null,
    });

    supabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: mockInsert,
        }),
      }),
    });

    const mockOnClose = jest.fn();
    render(
      <BrowserRouter>
        <AddGapDialog
          capabilityId="test-cap-id"
          onClose={mockOnClose}
        />
      </BrowserRouter>
    );

    // Fill form
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Test Gap' },
    });

    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Test description' },
    });

    // Submit
    fireEvent.click(screen.getByText('Create Gap'));

    // Wait for async operations
    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
    });

    // Verify priority_score was calculated
    const insertedData = mockInsert.mock.results[0].value.data;
    expect(insertedData.priority_score).toBeGreaterThan(0);
    expect(insertedData.calculation_basis).toBeDefined();

    // Dialog should close on success
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should handle Supabase errors gracefully', async () => {
    const mockError = {
      data: null,
      error: { code: '23505', message: 'Duplicate key violation' },
    };

    supabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue(mockError),
        }),
      }),
    });

    const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

    render(
      <BrowserRouter>
        <AddGapDialog
          capabilityId="test-cap-id"
          onClose={jest.fn()}
        />
      </BrowserRouter>
    );

    // Fill and submit form
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Duplicate Gap' },
    });
    fireEvent.click(screen.getByText('Create Gap'));

    // Wait for error handling
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining('already exists')
      );
    });

    alertSpy.mockRestore();
  });
});
```

---

### 2. Permission Testing

**Pattern:** Test user permissions and access control

```javascript
// tests/integration/gapPermissions.test.js
import { canDeleteGap } from '../../src/lib/gapPermissions';
import { supabase } from '../../src/lib/supabase';

jest.mock('../../src/lib/supabase');

describe('Gap Permissions', () => {
  it('allows business_responsible to delete gap', async () => {
    const gapId = 'test-gap-id';
    const userId = 'user-123';

    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { business_responsible_id: userId },
            error: null,
          }),
        }),
      }),
    });

    const canDelete = await canDeleteGap(gapId, userId);
    expect(canDelete).toBe(true);
  });

  it('allows admin to delete any gap', async () => {
    const gapId = 'test-gap-id';
    const adminUserId = 'admin-123';
    const otherUserId = 'other-user';

    // Gap owned by other user
    supabase.from
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { business_responsible_id: otherUserId },
              error: null,
            }),
          }),
        }),
      })
      // Admin user role check
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          }),
        }),
      });

    const canDelete = await canDeleteGap(gapId, adminUserId);
    expect(canDelete).toBe(true);
  });

  it('denies regular user from deleting others gaps', async () => {
    const gapId = 'test-gap-id';
    const userId = 'user-123';
    const ownerUserId = 'owner-456';

    supabase.from
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { business_responsible_id: ownerUserId },
              error: null,
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'user' },
              error: null,
            }),
          }),
        }),
      });

    const canDelete = await canDeleteGap(gapId, userId);
    expect(canDelete).toBe(false);
  });
});
```

---

## Unit Testing

### 1. Utility Function Testing

**Pattern:** Test pure functions in isolation

```javascript
// tests/unit/capabilityHealth.test.js
import { calculateCapabilityHealth } from '../../src/lib/capabilityHealth';

describe('Capability Health Calculation', () => {
  it('returns grey when no business goals exist', () => {
    const capability = { id: 'cap-1', name: 'Test Capability' };
    const businessGoals = [];
    const gaps = [];

    const health = calculateCapabilityHealth(capability, businessGoals, gaps);

    expect(health.color).toBe('grey');
    expect(health.message).toContain('Not started');
  });

  it('returns red when critical gaps exist', () => {
    const capability = { id: 'cap-1', name: 'Test Capability' };
    const businessGoals = [{ id: 'goal-1', name: 'Test Goal' }];
    const gaps = [
      { id: 'gap-1', priority: 'Critical', status: 'Identified' },
    ];

    const health = calculateCapabilityHealth(capability, businessGoals, gaps);

    expect(health.color).toBe('red');
    expect(health.message).toContain('Critical issues');
  });

  it('returns green when all goals met and no unsolved gaps', () => {
    const capability = { id: 'cap-1', name: 'Test Capability' };
    const businessGoals = [
      { id: 'goal-1', name: 'Test Goal', current_maturity: 5, target_maturity: 5 },
    ];
    const gaps = [
      { id: 'gap-1', status: 'Resolved' },
    ];

    const health = calculateCapabilityHealth(capability, businessGoals, gaps);

    expect(health.color).toBe('green');
    expect(health.message).toContain('All good');
  });
});
```

---

### 2. Component Unit Testing

**Pattern:** Test component rendering and interactions

```javascript
// tests/unit/GapCard.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import GapCard from '../../src/components/GapCard';

describe('GapCard Component', () => {
  const mockGap = {
    id: 'gap-1',
    title: 'Test Gap',
    description: 'Test description',
    status: 'Identified',
    priority: 'High',
    priority_score: 15.5,
  };

  it('renders gap information correctly', () => {
    render(<GapCard gap={mockGap} />);

    expect(screen.getByText('Test Gap')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText(/15.5/)).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', () => {
    const mockDelete = jest.fn();
    render(<GapCard gap={mockGap} onDelete={mockDelete} />);

    const deleteButton = screen.getByLabelText('Delete');
    fireEvent.click(deleteButton);

    expect(mockDelete).toHaveBeenCalledWith('gap-1');
  });

  it('applies correct CSS class for priority color', () => {
    render(<GapCard gap={mockGap} />);

    const priorityBadge = screen.getByText('High');
    expect(priorityBadge).toHaveClass('bg-amber-500/20');
  });
});
```

---

## E2E Testing

### Pattern: Cypress for end-to-end user flows

```javascript
// cypress/e2e/gapManagement.cy.js
describe('Gap Management Flow', () => {
  beforeEach(() => {
    cy.login('admin@example.com', 'password'); // Custom command
    cy.visit('/value-streams');
  });

  it('completes full gap lifecycle', () => {
    // Navigate to capability
    cy.contains('Customer Management').click();
    cy.contains('CRM System').click();

    // Create new gap
    cy.contains('Add Gap').click();
    cy.get('[data-testid="gap-title"]').type('Performance Issue');
    cy.get('[data-testid="gap-description"]').type('System is slow during peak hours');
    cy.get('[data-testid="estimated-effort"]').select('High');
    cy.contains('Create Gap').click();

    // Verify gap appears in list
    cy.contains('Performance Issue').should('be.visible');
    cy.contains('Critical').should('be.visible'); // Priority calculated

    // Update gap status
    cy.contains('Performance Issue').click();
    cy.get('[data-testid="status-select"]').select('Approved');
    cy.contains('Save').click();

    // Link to solution
    cy.contains('Add Solution').click();
    cy.get('[data-testid="solution-name"]').type('Upgrade Database');
    cy.get('[data-testid="strategy-type"]').select('Uplift');
    cy.contains('Create Solution').click();

    // Verify solution linked
    cy.contains('Upgrade Database').should('be.visible');

    // Delete gap (soft delete)
    cy.contains('Performance Issue').click();
    cy.contains('Delete').click();
    cy.get('[data-testid="deletion-reason"]').type('Duplicate entry');
    cy.contains('Confirm Delete').click();

    // Verify gap no longer appears
    cy.contains('Performance Issue').should('not.exist');
  });
});
```

---

## Test Data Management

### Pattern: Test fixtures for consistent data

```javascript
// tests/fixtures/testData.js
export const mockOrganization = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Test Organization',
};

export const mockValueStream = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Test Value Stream',
  classification: 'Core',
  organization_id: mockOrganization.id,
};

export const mockCapability = {
  id: '22222222-2222-2222-2222-222222222222',
  name: 'Test Capability',
  value_stream_id: mockValueStream.id,
  organization_id: mockOrganization.id,
};

export const mockSubCapability = {
  id: '33333333-3333-3333-3333-333333333333',
  name: 'Test Sub-Capability',
  parent_capability_id: mockCapability.id,
  business_value: 5,
  strategic_priority: 'Must Have',
  current_maturity: 2,
  target_maturity: 5,
  organization_id: mockOrganization.id,
};

export const mockGap = {
  id: '44444444-4444-4444-4444-444444444444',
  title: 'Test Gap',
  description: 'Test description',
  capability_id: mockCapability.id,
  status: 'Identified',
  priority: 'High',
  priority_score: 18.5,
  estimated_effort: 'Medium',
  source_maturity_current: 2,
  source_maturity_target: 5,
  organization_id: mockOrganization.id,
};
```

---

## Continuous Integration

### Pattern: Automated test execution in CI/CD

```yaml
# .github/workflows/test.yml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
        env:
          VITE_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CYPRESS_BASE_URL: http://localhost:3000

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

---

## Test Coverage Goals

**Targets:**
- **Database functions:** 100% coverage (critical business logic)
- **Integration tests:** 80% coverage (key user flows)
- **Unit tests:** 70% coverage (utilities and helpers)
- **E2E tests:** Critical paths only (login, create, update, delete)

---

## Testing Best Practices

✅ **Do:**
- Test business logic, not implementation details
- Use descriptive test names (`should calculate priority score when gap has maturity data`)
- Clean up test data after each test
- Mock external dependencies (Supabase in unit tests)
- Test edge cases (null values, boundary conditions)
- Run tests in CI/CD pipeline
- Maintain test data fixtures
- Test error scenarios

❌ **Don't:**
- Test framework internals (React rendering logic)
- Leave test data in database after tests
- Use production database for testing
- Skip error handling tests
- Ignore flaky tests
- Test only happy paths
- Hardcode test data inline (use fixtures)
