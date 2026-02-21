# AI Running Coach - UI/UX Document

## 1. Screen Overview

The app consists of **7 main screens**:

| # | Screen | Purpose |
|---|--------|---------|
| 1 | Login | User authentication |
| 2 | Dashboard | Overview, quick stats, start run |
| 3 | Generate Session | Create audio coaching config |
| 4 | Active Run | Real-time tracking display |
| 5 | Profile | User settings |
| 6 | History | Training logs & analytics |
| 7 | Achievements | Badge collection |

---

## 2. Screen Layouts

### 2.1 Login Screen
```
┌─────────────────────┐
│    AI Running      │ ← Logo/Title
│      Coach          │
├─────────────────────┤
│                     │
│   [Username]        │ ← Input field
│                     │
│   [Password]        │ ← Input field
│                     │
│   [    LOGIN     ]  │ ← Primary button
│                     │
└─────────────────────┘
```

### 2.2 Dashboard Screen
```
┌─────────────────────┐
│  Hi, [Name]!    👤 │ ← Header with profile
├─────────────────────┤
│  ┌───────────────┐  │
│  │   Next Run    │  │
│  │   "Ready?"    │  │ ← Quick start card
│  │  [START RUN]  │  │
│  └───────────────┘  │
├─────────────────────┤
│  This Week          │
│  ┌─────┬─────┬─────┐│
│  │ 3km │45min│ 3x  ││ ← Stats: distance, time, runs
│  └─────┴─────┴─────┘│
├─────────────────────┤
│  Recent Achievements│
│  🏃 5K Runner      │ ← Badge preview
├─────────────────────┤
│ [Home] [Run] [+] [📊] [👤] │ ← Bottom nav
└─────────────────────┘
```

### 2.3 Generate Session Screen
```
┌─────────────────────┐
│  Generate Session   │ ← Header
├─────────────────────┤
│  Duration           │
│  [----●------] 30min│ ← Slider 15-120
├─────────────────────┤
│  Workout Type       │
│  [Easy] [Tempo]     │ ← Button group
│  [Interval] [Long]  │
│  [Recovery]         │
├─────────────────────┤
│  Race Goal          │
│  [None] [5K] [10K]  │ ← Select
│  [Half] [Full] [Ultra]│
├─────────────────────┤
│  Music Genre        │
│  [None] [🎵] [🎸]   │ ← Select
│  [🎻] [🏠] [🎤]    │
├─────────────────────┤
│  Coach Style        │
│  [Motivational]     │ ← Select
│  [Technical]        │
│  [Supportive]       │
├─────────────────────┤
│  [GENERATE SESSION] │ ← Primary button
└─────────────────────┘
```

### 2.4 Active Run Screen
```
┌─────────────────────┐
│  🏃 Running    ⏸️  │ ← Header with status
├─────────────────────┤
│      ⏱️ 00:15:32    │ ← Duration (large)
├─────────────────────┤
│  ┌─────────┬───────┐│
│  │  3.24   │  5:12 ││ ← Distance | Pace
│  │  km     │ /km   ││
│  └─────────┴───────┘│
├─────────────────────┤
│  ❤️ 145 bpm         │ ← Heart rate
│  ████████░░ Zone 3  │ ← Zone bar
├─────────────────────┤
│  [PAUSE]  [STOP]    │ ← Controls
├─────────────────────┤
│  [End & Save Run]   │ ← End button
└─────────────────────┘
```

### 2.5 Profile Screen
```
┌─────────────────────┐
│  Profile        ✏️  │ ← Header with edit
├─────────────────────┤
│  ┌───────────────┐  │
│  │    Avatar     │  │ ← Placeholder
│  └───────────────┘  │
├─────────────────────┤
│  Name     [______]  │
│  Gender   [Select] │
│  DOB      [____]   │
│  Weight   [____] kg│
│  Height   [____] cm│
├─────────────────────┤
│  Running Level      │
│  ○ Beginner         │
│  ○ Intermediate     │
│  ○ Advanced         │
├─────────────────────┤
│  Units              │
│  ○ Metric (km, kg)  │
│  ○ Imperial (mi, lb)│
├─────────────────────┤
│  Coach Voice        │
│  [Select style]     │
├─────────────────────┤
│     [SAVE]          │
└─────────────────────┘
```

### 2.6 History Screen
```
┌─────────────────────┐
│  Training History   │
├─────────────────────┤
│  [Week] [Month] [Year]│ ← Toggle
├─────────────────────┤
│       📊             │ ← Chart (Chart.js)
│      ████           │
│     ██████          │ ← Pace/distance chart
│    ████████         │
├─────────────────────┤
│  Recent Runs         │
│  ┌───────────────┐  │
│  │ Today 5km 28min│  │
│  │ Yesterday 3km  │  │
│  │ 2 days ago ... │  │
│  └───────────────┘  │
└─────────────────────┘
```

### 2.7 Achievements Screen
```
┌─────────────────────┐
│  Achievements       │
├─────────────────────┤
│  🔵 3 / 12 Earned   │ ← Progress
├─────────────────────┤
│  🏃 Milestones      │
│  ┌─────┐ ┌─────┐    │
│  │ 🥇  │ │ 🥈  │    │ ← Badge icons
│  │First│ │ 5K  │    │
│  │ Run │ │ Run │    │
│  └─────┘ └─────┘    │
├─────────────────────┤
│  🔥 Streaks         │
│  ┌─────┐ ┌─────┐    │
│  │ 3   │ │ 7   │    │
│  │ day │ │ day │    │
│  └─────┘ └─────┘    │
├─────────────────────┤
│  ⛰️ Challenges      │
│  [Early Bird 👤]    │
│  [Hill Master 🔒]   │
└─────────────────────┘
```

---

## 3. User Flows

### 3.1 Login Flow
```
[App Start]
     ↓
[Login Screen]
     ↓
Enter username/password
     ↓
[Validate: user/password]
     ↓
  ┌─→ [Invalid] → Show error → Back to Login
  │
  └─→ [Valid] → [Dashboard]
```

### 3.2 Generate & Start Run Flow
```
[Dashboard]
     ↓
Tap [START RUN] or [+] tab
     ↓
[Generate Session Screen]
     ↓
Configure:
  - Duration slider
  - Workout type
  - Race goal (optional)
  - Music genre
  - Coach style
     ↓
Tap [GENERATE SESSION]
     ↓
[Active Run Screen]
     ↓
Run in progress...
     ↓
Tap [STOP] → [End & Save Run]
     ↓
[Dashboard] (with updated stats)
```

### 3.3 View History Flow
```
[Dashboard]
     ↓
Tap [📊 History] tab
     ↓
[History Screen]
     ↓
View default (Week) chart
     ↓
Toggle: Week/Month/Year
     ↓
View runs list below
     ↓
Tap run for details (future)
```

### 3.4 Check Achievements Flow
```
[Dashboard]
     ↓
Tap badge icon OR [Profile] → Achievements
     ↓
[Achievements Screen]
     ↓
View earned badges
     ↓
See progress to next badges
     ↓
Tap badge for details (future)
```

---

## 4. Navigation

**Bottom Navigation Bar** (persistent on all screens except Login):

| Icon | Label | Screen |
|------|-------|--------|
| 🏠 | Home | Dashboard |
| 🏃 | Run | Generate Session |
| ➕ | + | Generate Session |
| 📊 | History | History |
| 👤 | Profile | Profile |

**Flow Diagram:**
```
┌─────────────────────────────────────────────┐
│                  Login                       │
                      ↓
┌─────────────────────────────────────────────┐
│           Bottom Navigation                 │
│  [Home] [Run] [+] [History] [Profile]      │
└─────────────────────────────────────────────┘
    ↓    ↓    ↓      ↓        ↓
 Dashboard  ↓  ↓   History   Profile
            ↓  ↓              
            Active Run (replaces content)
              ↓
            Results → Dashboard
```

---

## 5. Color & Style Summary

- **Primary:** #1E40AF (Deep Blue) - headers, buttons
- **Secondary:** #F97316 (Orange) - accents, CTAs
- **Background:** #F8FAFC - page background
- **Surface:** #FFFFFF - cards
- **Text:** #1E293B (primary), #64748B (secondary)

All screens follow mobile-first design (max-width: 480px optimal).
