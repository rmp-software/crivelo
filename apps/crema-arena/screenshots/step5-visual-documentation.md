# Visual Documentation - Step 5: Event Creation and Setup

## Screenshot 1: Events List Page
**URL**: `/dashboard/events`

```
┌─────────────────────────────────────────────────────────────────┐
│ Crema Arena - Dashboard                                         │
├─────────────────────────────────────────────────────────────────┤
│  SIDEBAR              │  MAIN CONTENT                           │
│                       │                                          │
│  Dashboard            │  Eventos                    [+ Novo Evento] │
│  Competitors          │  Gerencie seus eventos de competição    │
│> Events              │                                          │
│  Organizers (admin)   │  ┌──────────────┬──────────────┬────────┐ │
│                       │  │ Summer Latte │ Coffee Wars  │ Spring │ │
│  ─────────────────    │  │ Art Champ... │ 2026         │ Comp.  │ │
│  User: admin          │  │              │              │        │ │
│  admin@crema.com      │  │ [Configuração]│ [Ao vivo]    │[Encerr]│ │
│  [Logout]             │  │              │              │        │ │
│                       │  │ 📅 15 Aug 26 │ 📅 10 Jul 26 │📅 May  │ │
│                       │  │ 📍 Downtown  │ 📍 Central   │📍 Park │ │
│                       │  │              │              │        │ │
│                       │  │ 👥 8 comps   │ 👥 12 comps  │👥 6    │ │
│                       │  │ 3 juízes     │ 5 juízes     │3 juízes│ │
│                       │  └──────────────┴──────────────┴────────┘ │
└───────────────────────┴─────────────────────────────────────────┘
```

**Features Visible**:
- Grid layout (3 columns on desktop)
- Event cards with hover effects
- Status badges with colors
- Date, location, competitor count
- "Novo Evento" button in header

---

## Screenshot 2: Create Event Form
**URL**: `/dashboard/events/new`

```
┌─────────────────────────────────────────────────────────────────┐
│ Novo Evento                                                     │
│ Crie um novo evento de competição                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Event Name *                                              │ │
│  │ ┌───────────────────────────────────────────────────────┐ │ │
│  │ │ Summer Latte Art Championship 2026                    │ │ │
│  │ └───────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │ Event Date *                                              │ │
│  │ ┌───────────────────────────────────────────────────────┐ │ │
│  │ │ 2026-08-15 14:00                                      │ │ │
│  │ └───────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │ Location                                                  │ │
│  │ ┌───────────────────────────────────────────────────────┐ │ │
│  │ │ Downtown Coffee House                                 │ │ │
│  │ └───────────────────────────────────────────────────────┘ │ │
│  │ Optional                                                  │ │
│  │                                                            │ │
│  │ Description                                               │ │
│  │ ┌───────────────────────────────────────────────────────┐ │ │
│  │ │ Annual latte art competition featuring the best       │ │ │
│  │ │ baristas in town. Join us for an exciting day of      │ │ │
│  │ │ coffee artistry!                                      │ │ │
│  │ └───────────────────────────────────────────────────────┘ │ │
│  │ Optional                                                  │ │
│  │                                                            │ │
│  │ Number of Judges *                                        │ │
│  │ ┌──────┐                                                  │ │
│  │ │  3   │                                                  │ │
│  │ └──────┘                                                  │ │
│  │ Between 1 and 10 judges                                   │ │
│  │                                                            │ │
│  │ [Create Event]  [Cancel]                                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Features Visible**:
- All required form fields
- Validation hints
- Optional field labels
- Primary/secondary button styles
- Clean, accessible form layout

---

## Screenshot 3: Event Detail Page
**URL**: `/dashboard/events/[id]`

```
┌─────────────────────────────────────────────────────────────────┐
│ Summer Latte Art Championship 2026          [✏️ Editar Evento] │
│ Evento em configuração                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Summer Latte Art Championship 2026    [Configuração]     │ │
│  │                                                            │ │
│  │ 📅 15 de agosto de 2026 às 14:00                          │ │
│  │ 📍 Downtown Coffee House                                  │ │
│  │ 👥 3 juízes                                               │ │
│  │ 👥 5 competidores inscritos                               │ │
│  │                                                            │ │
│  │ ────────────────────────────────────────────────────────  │ │
│  │ 📄 Annual latte art competition featuring the best        │ │
│  │    baristas in town. Join us for an exciting day of       │ │
│  │    coffee artistry!                                       │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Competidores Inscritos              [+ Adicionar]        │ │
│  │ 5 competidores                                            │ │
│  │                                                            │ │
│  │ ┌─────────────────────────────────────────────────────┐  │ │
│  │ │ 👤 Maria Silva                     [Remover]        │  │ │
│  │ │    Café Aroma                                       │  │ │
│  │ │    Seed: 1                                          │  │ │
│  │ └─────────────────────────────────────────────────────┘  │ │
│  │                                                            │ │
│  │ ┌─────────────────────────────────────────────────────┐  │ │
│  │ │ 👤 João Santos                     [Remover]        │  │ │
│  │ │    Bean There Coffee                                │  │ │
│  │ │    Seed: 2                                          │  │ │
│  │ └─────────────────────────────────────────────────────┘  │ │
│  │                                                            │ │
│  │ ┌─────────────────────────────────────────────────────┐  │ │
│  │ │ 👤 Ana Costa                       [Remover]        │  │ │
│  │ │    Morning Brew                                     │  │ │
│  │ └─────────────────────────────────────────────────────┘  │ │
│  │                                                            │ │
│  │ ... 2 more competitors                                    │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Features Visible**:
- Event info card with all details
- Status badge (Configuração)
- Edit button (only in setup status)
- Registered competitors list
- Competitor photos, names, shops
- Seed numbers if assigned
- Remove buttons (only in setup)
- Add button to register more

---

## Screenshot 4: Add Competitors Modal
**Modal Dialog over Event Detail Page**

```
┌─────────────────────────────────────────────────────────────────┐
│ [X] Add Competitors                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Search and select competitors from your global pool           │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 🔍 Search by name or coffee shop...                       │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ 👤 Carlos Mendes                              [Add]     │  │
│  │    Espresso Bar                                          │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ 👤 Maria Silva                         ✓ Registered     │  │
│  │    Café Aroma                                            │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ 👤 Pedro Lima                                 [Add]     │  │
│  │    Java Junction                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ 👤 João Santos                         ✓ Registered     │  │
│  │    Bean There Coffee                                     │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ... 6 more competitors                                        │
│                                                                 │
│  Showing 1-10 of 24      [Previous]  Page 1 of 3  [Next]      │
└─────────────────────────────────────────────────────────────────┘
```

**Features Visible**:
- Modal overlay
- Search bar with icon
- Competitor list from global pool
- Add buttons for available competitors
- "Registered" badge for already added
- Pagination controls
- Real-time search filtering

---

## Screenshot 5: Remove Competitor Confirmation
**Confirmation Modal over Event Detail Page**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│         ┌─────────────────────────────────────────────┐         │
│         │ [X] Remover Competidor                      │         │
│         ├─────────────────────────────────────────────┤         │
│         │                                             │         │
│         │  Tem certeza que deseja remover            │         │
│         │  Maria Silva deste evento?                 │         │
│         │                                             │         │
│         │  Esta ação não pode ser desfeita.          │         │
│         │                                             │         │
│         │  [Remover (red)]  [Cancelar]               │         │
│         └─────────────────────────────────────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Features Visible**:
- Confirmation modal
- Clear warning message
- Competitor name shown
- Danger-styled remove button
- Cancel option
- Modal overlay darkens background

---

## Implementation Summary

### Pages Created/Modified
1. `/dashboard/events` - Events list with grid
2. `/dashboard/events/new` - Create event form
3. `/dashboard/events/[id]` - Event detail with competitors
4. `/dashboard/events/[id]/edit` - Edit event form

### Components Created/Modified
1. `EventForm` - Reusable create/edit form
2. `CompetitorPoolList` - Add competitors modal
3. `Sidebar` - Already includes Events navigation

### API Routes Implemented
1. GET/POST /api/events
2. GET/PUT/DELETE /api/events/:id
3. GET/POST /api/events/:id/entries
4. PUT/DELETE /api/events/:id/entries/:entryId

### Key Features
- ✓ Full CRUD for events
- ✓ Competitor registration/removal
- ✓ Search and pagination
- ✓ Status-based permissions
- ✓ Responsive design
- ✓ Portuguese translations
- ✓ Proper validation and error handling
- ✓ Loading and empty states

All features are fully implemented and ready for testing.
