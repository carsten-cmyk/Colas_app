# App Migration Strategy - Prototype til Production

## Overview

Dette dokument beskriver hvordan Colas App prototypen kan migreres til production-ready native apps (iOS/Android) uden at starte forfra.

**Status:** Prototype fase - Web app med hardcoded data
**Mål:** Native apps med real-time database integration
**Strategi:** Incremental migration med maksimal kode-genbrugning

---

## 1. Data Layer Separation (KRITISK - Gør først!)

### Nuværende Situation
Data er hardcoded direkte i komponenter (TaskOverviewPage.jsx).

### Migration Path

**Step 1: Opret Data Service Layer**

```javascript
// src/services/taskService.js
export const taskService = {
  // Mock data (prototype fase)
  getTasks: async () => {
    return [
      {
        id: 1,
        date: '12. Februar 2026',
        location: 'Uddannelsescenter Syd, Lolland',
        tons: '75 Tons',
        time: '05.30',
        destination: 'Fabrik Køge → Lolland',
        orderNumber: 'Ordrenummer 1212343',
        factory: {
          name: 'Køge Asfaltfabrik',
          address: 'Nordhavnsvej 9\n4600 Køge'
        },
        deliveryLocation: {
          name: 'Uddannelsescenter Syd, Lolland',
          address: 'Søvej 6 D, 4900 Nakskov'
        },
        estimate: {
          rounds: 3,
          hours: 6
        },
        info: 'Beskrivelse af opgaven...'
      }
    ];
  },

  getTaskById: async (id) => {
    const tasks = await taskService.getTasks();
    return tasks.find(t => t.id === parseInt(id));
  },

  createTask: async (taskData) => {
    // Mock implementation
    return { ...taskData, id: Date.now() };
  },

  updateTask: async (id, updates) => {
    // Mock implementation
    return { id, ...updates };
  }
};
```

**Step 2: Opret Contact Service**

```javascript
// src/services/contactService.js
export const contactService = {
  getContacts: async () => {
    return [
      {
        id: 1,
        name: 'Henrik Thor, Projektleder Colas',
        phone: '23 99 14 48',
        image: '/images/Henrik.png',
        role: 'Projektleder'
      },
      // ... andre kontakter
    ];
  },

  getContactById: async (id) => {
    const contacts = await contactService.getContacts();
    return contacts.find(c => c.id === parseInt(id));
  }
};
```

**Step 3: Brug Services i Komponenter**

```javascript
// src/pages/TaskOverviewPage.jsx
import { useEffect, useState } from 'react';
import { taskService } from '../services/taskService';
import { contactService } from '../services/contactService';

function TaskOverviewPage() {
  const [tasks, setTasks] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [tasksData, contactsData] = await Promise.all([
        taskService.getTasks(),
        contactService.getContacts()
      ]);
      setTasks(tasksData);
      setContacts(contactsData);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    // ... resten af komponenten
  );
}
```

**Step 4: Migration til Real API** (Senere)

```javascript
// src/services/taskService.js
import { supabase } from '../lib/supabase';

export const taskService = {
  getTasks: async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, factory:factories(*), delivery:locations(*)')
      .is('deleted_at', null)
      .order('date', { ascending: true });

    if (error) throw error;
    return data;
  },

  getTaskById: async (id) => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, factory:factories(*), delivery:locations(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // ... resten af metoderne
};
```

---

## 2. Database Schema Design

**Design schema NU - implementer senere**

```sql
-- Organizations (Multi-tenant support)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT CHECK (role IN ('admin', 'driver', 'manager')),
  organization_id UUID REFERENCES organizations(id),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Factories
CREATE TABLE factories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery Locations
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  order_number TEXT UNIQUE,
  date DATE NOT NULL,
  time TIME NOT NULL,

  -- Factory info
  factory_id UUID REFERENCES factories(id),

  -- Delivery info
  delivery_location_id UUID REFERENCES locations(id),
  tons INTEGER,
  asphalt_type TEXT,

  -- Assignment
  assigned_driver_id UUID REFERENCES users(id),

  -- Estimates
  estimated_rounds INTEGER,
  estimated_hours INTEGER,

  -- Status
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),

  -- Additional info
  notes TEXT,

  -- Soft delete
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT,
  avatar_url TEXT,
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_tasks_date ON tasks(date) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_assigned_driver ON tasks(assigned_driver_id);
CREATE INDEX idx_tasks_organization ON tasks(organization_id);
CREATE INDEX idx_tasks_status ON tasks(status) WHERE deleted_at IS NULL;
```

---

## 3. Type Definitions

**Definer data contracts NU**

```javascript
// src/types/task.js
/**
 * @typedef {Object} Factory
 * @property {string} id
 * @property {string} name
 * @property {string} address
 * @property {string} city
 * @property {string} postalCode
 */

/**
 * @typedef {Object} Location
 * @property {string} id
 * @property {string} name
 * @property {string} address
 * @property {string} city
 * @property {string} postalCode
 */

/**
 * @typedef {Object} Estimate
 * @property {number} rounds
 * @property {number} hours
 */

/**
 * @typedef {Object} Task
 * @property {number|string} id
 * @property {string} date - Format: "DD. Month YYYY"
 * @property {string} time - Format: "HH.MM"
 * @property {string} orderNumber
 * @property {string} location - Display name
 * @property {string} tons - Display string (e.g., "75 Tons")
 * @property {string} destination - Display string (route)
 * @property {Factory} factory
 * @property {Location} deliveryLocation
 * @property {Estimate} estimate
 * @property {string} info - Additional information
 * @property {string} status - 'pending' | 'in_progress' | 'completed' | 'cancelled'
 * @property {string} asphaltType
 */

/**
 * @typedef {Object} Contact
 * @property {number|string} id
 * @property {string} name
 * @property {string} phone
 * @property {string} image - Image URL/path
 * @property {string} role
 */
```

---

## 4. React Native Migration Path

### Option A: React Native (Anbefalet)

**Fordele:**
- 80-90% kode genbrugning
- Full native performance
- Adgang til alle native features

**Migration Steps:**

1. **Opret React Native projekt**
```bash
npx react-native init ColasApp
```

2. **Konverter komponenter**
```javascript
// Før (Web)
<div className="task-card">
  <h1>{title}</h1>
</div>

// Efter (React Native)
import { View, Text, StyleSheet } from 'react-native';

<View style={styles.taskCard}>
  <Text style={styles.title}>{title}</Text>
</View>

const styles = StyleSheet.create({
  taskCard: {
    backgroundColor: '#ece378',
    borderRadius: 20,
    padding: 16
  },
  title: {
    fontSize: 18,
    fontWeight: '700'
  }
});
```

3. **Navigation**
```javascript
// Før (React Router)
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate('/task/1');

// Efter (React Navigation)
import { useNavigation } from '@react-navigation/native';
const navigation = useNavigation();
navigation.navigate('TaskDetail', { taskId: 1 });
```

4. **Genbrugelige dele (100%)**
- State management (useState, useEffect, useContext)
- Business logic
- API service layer
- Custom hooks
- Data flow patterns

### Option B: Capacitor (Nemmere)

**Fordele:**
- 95-98% kode genbrugning
- Minimal refactoring
- Wrapper web app i native container

**Setup:**
```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add ios
npx cap add android
```

Ingen komponent ændringer nødvendige! ✅

---

## 5. State Management Architecture

### Phase 1: Prototype (Nuværende)
- Local state i komponenter (useState)

### Phase 2: Production
- React Context for global state
- Service layer for data fetching

**Implementation:**

```javascript
// src/contexts/AppContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { taskService } from '../services/taskService';
import { contactService } from '../services/contactService';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [tasksData, contactsData] = await Promise.all([
        taskService.getTasks(),
        contactService.getContacts()
      ]);
      setTasks(tasksData);
      setContacts(contactsData);
      setLoading(false);
    }
    loadData();
  }, []);

  const refreshTasks = async () => {
    const tasksData = await taskService.getTasks();
    setTasks(tasksData);
  };

  return (
    <AppContext.Provider value={{
      tasks,
      contacts,
      user,
      loading,
      refreshTasks,
      setUser
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
```

**Usage:**
```javascript
// src/pages/TaskOverviewPage.jsx
import { useApp } from '../contexts/AppContext';

function TaskOverviewPage() {
  const { tasks, contacts, loading } = useApp();

  if (loading) return <LoadingSpinner />;

  return (
    // ... render tasks and contacts
  );
}
```

---

## 6. Environment Configuration

**Setup NU:**

```javascript
// .env.development
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ENV=development

// .env.production
VITE_API_URL=https://api.colas-app.dk
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ENV=production

// src/config/env.js
export const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  isDev: import.meta.env.VITE_ENV === 'development',
  isProd: import.meta.env.VITE_ENV === 'production'
};
```

---

## 7. Authentication Strategy

### Phase 1: Prototype
- Ingen auth (alle kan se alt)

### Phase 2: Production
- Supabase Auth
- Role-based access control

```javascript
// src/services/authService.js
import { supabase } from '../lib/supabase';

export const authService = {
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }
};
```

---

## 8. Testing Strategy

Fra TEST_STRATEGY.md - implementer løbende:

```javascript
// tests/services/taskService.test.js
import { taskService } from '../../src/services/taskService';

describe('TaskService', () => {
  it('should fetch all tasks', async () => {
    const tasks = await taskService.getTasks();
    expect(tasks).toBeInstanceOf(Array);
    expect(tasks.length).toBeGreaterThan(0);
  });

  it('should fetch task by id', async () => {
    const task = await taskService.getTaskById(1);
    expect(task).toBeDefined();
    expect(task.id).toBe(1);
  });
});
```

---

## 9. Migration Checklist

### Før Migration til Production

**Data Layer:**
- [ ] Opret service layer (taskService, contactService)
- [ ] Flyt hardcoded data til services
- [ ] Implementer mock API responses
- [ ] Test at alle komponenter virker med service layer

**Database:**
- [ ] Design database schema (SQL)
- [ ] Setup Supabase projekt
- [ ] Implementer tabeller og relationer
- [ ] Setup Row Level Security policies
- [ ] Seed database med test data

**Type Safety:**
- [ ] Definer alle data types (JSDoc eller TypeScript)
- [ ] Dokumenter API contracts

**State Management:**
- [ ] Implementer React Context
- [ ] Flyt global state ud af komponenter
- [ ] Test data flow

**Environment:**
- [ ] Setup .env filer
- [ ] Konfigurer environment variables
- [ ] Test development og production builds

### Under Migration til Native App

**React Native:**
- [ ] Setup React Native projekt
- [ ] Konverter styling (CSS → StyleSheet)
- [ ] Konverter HTML tags (div → View, etc.)
- [ ] Setup React Navigation
- [ ] Test på iOS simulator
- [ ] Test på Android emulator

**Alternative: Capacitor:**
- [ ] Install Capacitor
- [ ] Add iOS platform
- [ ] Add Android platform
- [ ] Build og test

**Backend Integration:**
- [ ] Skift service layer til real API calls
- [ ] Implementer authentication
- [ ] Test API integration
- [ ] Error handling
- [ ] Loading states

**Production:**
- [ ] Setup CI/CD pipeline
- [ ] Configure app signing
- [ ] Submit til App Store
- [ ] Submit til Google Play

---

## 10. Kode der KAN Genbruges (100%)

✅ **Komponenter** (med små styling ændringer)
- TaskCard.jsx
- ContactCard.jsx
- TaskDetailPage.jsx (logik)

✅ **Business Logic**
- State management patterns
- Data transformation
- Validation logic

✅ **Services** (helt uændret!)
- taskService.js
- contactService.js
- authService.js

✅ **Hooks**
- Custom hooks virker identisk i React Native

✅ **Navigation Flow**
- Samme routes, bare anden implementering

✅ **Types/Interfaces**
- Data structures uændrede

---

## 11. Best Practices Fra Dokumentation

**Fra FRONTEND_BEST_PRACTICES.md:**
- Functional components med hooks ✅
- Props destructuring ✅
- Custom hooks for reusable logic ✅
- Error handling patterns ✅

**Fra DESIGN_SYSTEM.md:**
- Konsistent color palette ✅
- Typography scale ✅
- Component patterns (genbrugelige)

**Fra LESSONS_LEARNED.md:**
- Soft delete pattern (implementer i DB)
- Calculation transparency (JSONB audit trail)
- Database triggers for automation
- Query patterns (undgå N+1)

---

## 12. Next Steps - Prioriteret Rækkefølge

1. **Uge 1: Data Layer**
   - Opret service layer
   - Flyt hardcoded data
   - Test at app virker uændret

2. **Uge 2: Database Design**
   - Finaliser schema
   - Setup Supabase
   - Seed med test data

3. **Uge 3: State Management**
   - Implementer Context
   - Test data flow
   - Performance check

4. **Uge 4: API Integration**
   - Skift til real API calls
   - Test funktionalitet
   - Error handling

5. **Uge 5+: Native App Decision**
   - Vælg React Native eller Capacitor
   - Start migration
   - Test på devices

---

## Resources

**Dokumentation:**
- FRONTEND_BEST_PRACTICES.md - React patterns
- DESIGN_SYSTEM.md - UI components
- TEST_STRATEGY.md - Testing approach
- LESSONS_LEARNED.md - Undgå kendte pitfalls

**External:**
- [React Native Docs](https://reactnative.dev/)
- [Capacitor Docs](https://capacitorjs.com/)
- [Supabase Docs](https://supabase.com/docs)
- [React Navigation](https://reactnavigation.org/)

---

**Sidst opdateret:** 2026-01-25
**Status:** Prototype fase - Klar til service layer implementation
