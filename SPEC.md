# AI Running Coach - Specification Document

## 1. Project Overview

**Project Name:** AI Running Coach  
**Project Type:** Mobile-first Web Application  
**Core Functionality:** AI-powered running coach providing personalized audio guidance during runs  
**Target Users:** Runners of all levels seeking personalized coaching and training assistance

---

## 2. UI/UX Specification

### Layout Structure

**Pages:**
1. **Landing/Login** - Google login, app introduction
2. **Dashboard** - Quick stats, next run, achievements summary
3. **Generate Session** - Create audio coaching session
4. **Active Run** - Real-time tracking display
5. **Profile** - User settings, preferences
6. **History** - Training log, analytics charts
7. **Achievements** - Badge collection

**Navigation:** Bottom navigation bar (Dashboard, Run, Generate, History, Profile)

**Responsive:** Mobile-first, works on desktop

### Visual Design

**Color Palette:**
- Primary: `#1E40AF` (Deep Blue)
- Secondary: `#F97316` (Orange)
- Background: `#F8FAFC` (Light gray)
- Surface: `#FFFFFF` (White)
- Text Primary: `#1E293B`
- Text Secondary: `#64748B`
- Success: `#10B981`
- Warning: `#F59E0B`
- Error: `#EF4444`

**Typography:**
- Headings: System font, bold, 24-32px
- Body: System font, regular, 14-16px
- Font Awesome for icons

**Spacing:** Tailwind CSS default spacing scale

### Components

- **Buttons:** Primary (blue), Secondary (orange), Outline
- **Cards:** Rounded corners (8px), subtle shadow
- **Input fields:** Rounded, border on focus
- **Progress bars:** For achievements, training progress
- **Charts:** Chart.js for analytics
- **Badges:** Achievement icons with unlock animations
- **Bottom nav:** 5 icons with active state

---

## 3. Functionality Specification

### Core Features

#### 3.1 User Authentication
- Simple username/password login
- Hardcoded credentials: username='user', password='password'
- Store user preferences and training history in LocalStorage

#### 3.2 Audio Session Generator
- **Inputs:**
  - Duration: 15-120 minutes (slider)
  - Workout type: Easy Run, Tempo Run, Interval, Long Run, Recovery Run
  - Race goal: 5K, 10K, Half Marathon, Marathon, Ultra, None
  - Race date (optional)
  - Music genre: Electronic, Rock, Classical, Hip Hop, Pop, None
  - Coach style: Motivational, Technical, Supportive
- **Output:** Configured session ready for playback

#### 3.3 Real-time Run Tracking
- Display: Distance, Pace, Duration, Heart Rate
- Heart rate zone visualization (Zone 1-5 with colors)
- Simulated GPS route display (for MVP, use static map placeholder)
- Pause/Resume/Stop controls

#### 3.4 Achievement System
- **Milestone badges:** First run, 5K, 10K, 42K total distance
- **Streak badges:** 3-day, 7-day, 30-day consistency
- **Challenge badges:** Early bird (before 6am), Hill master
- Progress bar toward next badge

#### 3.5 User Profile
- Name, Gender, DOB, Weight, Height
- Running level: Beginner, Intermediate, Advanced
- Units: Metric / Imperial
- Coach voice preference

#### 3.6 Training History
- List of past runs with stats
- Weekly/Monthly summary charts
- Heart rate zone distribution chart
- Pace improvement over time

#### 3.7 Race Preparation
- Countdown to next race
- Suggested workouts for race type

### Data Storage
- LocalStorage for user preferences and training history
- No backend required (MVP)

---

## 4. Technical Stack

- **Framework:** React Native (Expo) - cross-platform for web & mobile
- **Styling:** Tailwind CSS (nativewind) or StyleSheet
- **Icons:** Expo Vector Icons
- **Charts:** react-native-chart-kit
- **Storage:** AsyncStorage
- **Navigation:** React Navigation

---

## 5.1 Acceptance Criteria (React Native)

### Must Have (MVP)
- [ ] Login works with hardcoded credentials (user/password)
- [ ] Can generate audio session config
- [ ] Run tracking displays metrics (simulated)
- [ ] Achievements display and track progress
- [ ] Profile settings saveable
- [ ] Training history shows past runs
- [ ] Builds successfully for web (`expo build:web`)

### Nice to Have (Phase 2)
- [ ] Actual audio playback with voice
- [ ] Real GPS tracking
- [ ] Real heart rate integration
- [ ] Push notifications
- [ ] Native mobile build (.apk/.ipa)

---

## 6. Project Structure (React Native / Expo)

```
~/projects/ai-running-coach/
├── App.js                 # Main app entry
├── app.json               # Expo config
├── SPEC.md
├── UI-UX.md
├── src/
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── GenerateSessionScreen.js
│   │   ├── ActiveRunScreen.js
│   │   ├── ProfileScreen.js
│   │   ├── HistoryScreen.js
│   │   └── AchievementsScreen.js
│   ├── components/
│   │   ├── BottomNav.js
│   │   ├── SessionCard.js
│   │   ├── RunStats.js
│   │   ├── AchievementBadge.js
│   │   └── Chart.js
│   ├── navigation/
│   │   └── AppNavigator.js
│   ├── context/
│   │   └── AuthContext.js
│   ├── hooks/
│   │   └── useStorage.js
│   └── utils/
│       ├── storage.js
│       └── constants.js
└── package.json
```

---

## 7. Notes

- Use **Expo** for easy web + mobile builds
- For MVP, audio can be simulated (no actual TTS)
- GPS can use placeholder/static data
- Focus on UI/UX and data flow
- Use react-native-chart-kit for analytics
