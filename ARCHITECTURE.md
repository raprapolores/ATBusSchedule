# Project Structure & Architecture Guide

This is a production-ready React Native + Expo project organized using **feature-based architecture**. Below is the complete folder structure with explanations for how each folder should grow and what belongs in each place.

## Project Layout

```
ReactATBusNative/
├── App.tsx                          # Root app entry & navigation bootstrap
├── index.ts                         # Entry point for Expo
├── app.json                         # Expo configuration
├── package.json                     # Dependencies & scripts
├── tsconfig.json                    # TypeScript config
├── CLAUDE.md                        # AI assistant instructions
├── AGENTS.md                        # Agent configuration notes
├── README.md                        # Project overview
│
├── assets/                          # Static assets
│   ├── images/                      # PNG, SVG, JPG files
│   ├── icons/                       # Icon assets
│   └── fonts/                       # Custom fonts (if needed)
│
├── src/
│   ├── constants/                   # App-wide constants
│   │   ├── navigation.ts            # Route names & nav config
│   │   ├── colors.ts                # (Future) Color palette
│   │   ├── spacing.ts               # (Future) Spacing scale
│   │   └── api.ts                   # (Future) API endpoints & timeouts
│   │
│   ├── features/                    # Feature-based folders
│   │   ├── timetable/               # Timetable feature
│   │   │   ├── TimetableScreen.tsx  # Main timetable screen
│   │   │   ├── TimetableCard.tsx    # (Future) Reusable timetable card
│   │   │   └── hooks/               # (Future) Feature-specific hooks
│   │   │
│   │   ├── route-details/           # Route details feature
│   │   │   ├── RouteDetailsScreen.tsx
│   │   │   ├── RouteMap.tsx         # (Future) Map display
│   │   │   └── StopList.tsx         # (Future) Stop listings
│   │   │
│   │   ├── auth/                    # Authentication feature
│   │   │   ├── useAuth.ts           # Auth hook
│   │   │   ├── LoginScreen.tsx      # (Future) Login screen
│   │   │   └── types.ts             # (Future) Auth types
│   │   │
│   │   └── settings/                # Settings feature
│   │       ├── SettingsScreen.tsx   # Main settings screen
│   │       ├── AboutScreen.tsx      # About screen
│   │       ├── ProfileScreen.tsx    # (Future) User profile
│   │       └── NotificationsScreen.tsx # (Future) Notification settings
│   │
│   ├── navigation/                  # Navigation configuration
│   │   ├── types.ts                 # Navigation type definitions
│   │   ├── HomeStack.tsx            # Home tab stack navigator
│   │   ├── SettingsStack.tsx        # Settings tab stack navigator
│   │   └── RootNavigator.tsx        # (Future) Root navigator logic
│   │
│   ├── services/                    # Business logic & API
│   │   ├── api.ts                   # Backend API calls
│   │   ├── storage.ts               # (Future) Local storage/AsyncStorage
│   │   ├── auth.ts                  # (Future) Auth service
│   │   └── analytics.ts             # (Future) Analytics service
│   │
│   ├── hooks/                       # Shared custom hooks
│   │   ├── useAsync.ts              # (Future) Generic async hook
│   │   ├── useFetch.ts              # (Future) Data fetching hook
│   │   └── useLocation.ts           # (Future) Location hook
│   │
│   ├── components/                  # Shared UI components
│   │   ├── Button.tsx               # (Future) Reusable button
│   │   ├── Card.tsx                 # (Future) Reusable card
│   │   ├── LoadingSpinner.tsx       # (Future) Loading indicator
│   │   ├── ErrorBoundary.tsx        # (Future) Error handling
│   │   └── layout/                  # (Future) Layout components
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── SafeView.tsx
│   │
│   ├── types/                       # Global TypeScript types
│   │   ├── common.ts                # (Future) Common types
│   │   ├── api.ts                   # (Future) API response types
│   │   └── navigation.ts            # (Future) Could move from navigation/types.ts
│   │
│   ├── utils/                       # Utility functions
│   │   ├── formatting.ts            # (Future) Date, number, string formatting
│   │   ├── validation.ts            # (Future) Form validation
│   │   └── helpers.ts               # (Future) General utilities
│   │
│   ├── api.ts                       # Compatibility re-export
│   └── useAuth.ts                   # Compatibility re-export
│
└── .gitignore
```

---

## Architecture Decisions

### Why Feature-Based?

Feature-based structure (also called "feature-driven" or "domain-driven") is the standard for production React Native apps. Instead of organizing by type (screens, components, hooks), we organize by business feature.

**Benefits:**
- Easy to navigate and find related code
- Features can be deleted or moved together
- Clear ownership (each feature is independent)
- Scales well as the app grows
- Easier to test and refactor

### Navigation Strategy

The app uses a **hybrid navigator setup**:

```
NavigationContainer
└── BottomTabNavigator (RootTab)
    ├── HomeTab
    │   └── NativeStackNavigator (HomeStack)
    │       ├── Home (Timetable)
    │       └── RouteDetails
    └── SettingsTab
        └── NativeStackNavigator (SettingsStack)
            ├── Settings
            └── About
```

This pattern allows:
- Tab-based navigation at the root (Timetable, Settings)
- Stack-based navigation within each tab (drill-down flows)
- Independent navigation state per tab
- Back button handling specific to each tab

---

## How Each Folder Should Grow

### `src/features/`

Each feature folder should follow this structure:

```
timetable/
├── TimetableScreen.tsx           # Screen component
├── components/                   # Feature-specific components
│   ├── TimetableHeader.tsx
│   ├── TimetableRow.tsx
│   └── DayPicker.tsx
├── hooks/                        # Feature-specific hooks
│   └── useTimetableData.ts
├── types.ts                      # Feature-specific types
├── constants.ts                  # Feature-specific constants
└── services.ts                   # Feature-specific API calls
```

### `src/services/`

API calls and business logic:

```
services/
├── api.ts                       # HTTP client setup
├── endpoints/                   # Organized by backend domain
│   ├── timetable.ts
│   ├── routes.ts
│   ├── stops.ts
│   └── auth.ts
├── storage.ts                   # AsyncStorage wrapper
└── analytics.ts                 # Event tracking
```

### `src/components/`

Shared components used across multiple features:

```
components/
├── Button.tsx                   # Reusable button component
├── Card.tsx                     # Reusable card component
├── LoadingSpinner.tsx
├── ErrorBoundary.tsx
├── layout/
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── SafeView.tsx
└── typography/
    ├── Heading.tsx
    └── Text.tsx
```

---

## Navigation Flow Example

### Adding a New Feature

Let's say you want to add a "Favorites" feature:

1. **Create the feature folder:**
   ```
   src/features/favorites/
   ├── FavoritesScreen.tsx
   ├── components/
   ├── hooks/
   └── types.ts
   ```

2. **Add route to navigation types:**
   ```typescript
   // src/navigation/types.ts
   export type FavoritesStackParamList = {
     FavoritesList: undefined;
     FavoriteDetail: { stopId: string };
   };
   ```

3. **Create a stack navigator:**
   ```typescript
   // src/navigation/FavoritesStack.tsx
   export function FavoritesStack() {
     return (
       <Stack.Navigator initialRouteName="FavoritesList">
         <Stack.Screen name="FavoritesList" component={FavoritesScreen} />
       </Stack.Navigator>
     );
   }
   ```

4. **Add tab to App.tsx:**
   ```typescript
   <Tab.Screen
     name="FavoritesTab"
     component={FavoritesStack}
     options={{ title: 'Favorites' }}
   />
   ```

---

## Key Packages & Their Purpose

| Package | Purpose |
|---------|---------|
| `@react-navigation/native` | Core navigation framework |
| `@react-navigation/native-stack` | Stack navigator (drill-down flows) |
| `@react-navigation/bottom-tabs` | Bottom tab bar |
| `react-native-screens` | Native screen performance |
| `react-native-safe-area-context` | Safe area handling (notches) |
| `expo` | React Native tooling & runtime |
| `react-native` | Core mobile framework |
| `react` | UI library |
| `typescript` | Type safety |

---

## Best Practices Applied

**Type Safety**
- Navigation routes are typed with `RootTabParamList`, `HomeStackParamList`, etc.
- Screen components use `NativeStackScreenProps<ParamList, 'RouteName'>`
- All props and params are type-checked

**Feature Isolation**
- Each feature owns its screens, components, and logic
- Features can be developed independently
- Easy to add/remove features without affecting others

**Navigation Configuration**
- Route names centralized in `src/constants/navigation.ts`
- Navigation type definitions in `src/navigation/types.ts`
- Stack navigators separated into individual files

**Code Organization**
- API calls in `src/services/`
- Reusable components in `src/components/`
- Feature-specific logic in `src/features/*/`
- Constants and types co-located with usage

**Scalability**
- Structure supports adding new features easily
- Room for growth: hooks, components, services
- Modular design allows team collaboration

---

## Common Tasks

### How to navigate between screens

```typescript
// From TimetableScreen to RouteDetailsScreen (same stack)
navigation.navigate('RouteDetails', {
  routeId: '123',
  routeName: 'Route 7',
  stopName: 'Downtown',
});

// Going back
navigation.goBack();

// Reset to a specific screen
navigation.popToTop();
```

### How to access route params

```typescript
type Props = NativeStackScreenProps<HomeStackParamList, 'RouteDetails'>;

export default function RouteDetailsScreen({ route, navigation }: Props) {
  const { routeId, routeName } = route.params;
  // ...
}
```

### How to add a new screen to an existing stack

1. Create the screen component in the feature folder
2. Add it to the stack navigator (e.g., `HomeStack.tsx`)
3. Add the route to the param list (`HomeStackParamList`)
4. Call `navigation.navigate('NewRoute')` from other screens

---

## Learning Path

If you're studying this codebase:

1. **Start with navigation:**
   - [App.tsx](../../App.tsx) - Root app entry
   - [src/navigation/types.ts](../navigation/types.ts) - Type definitions
   - [src/navigation/HomeStack.tsx](../navigation/HomeStack.tsx) - Stack pattern

2. **Then explore features:**
   - [src/features/timetable/TimetableScreen.tsx](../features/timetable/TimetableScreen.tsx) - Main screen
   - [src/features/settings/SettingsScreen.tsx](../features/settings/SettingsScreen.tsx) - Settings pattern

3. **Then API calls:**
   - [src/services/api.ts](../services/api.ts) - HTTP requests
   - [src/features/auth/useAuth.ts](../features/auth/useAuth.ts) - Hook pattern

4. **Finally, add your own:**
   - Create a new feature in `src/features/`
   - Add screens and navigation
   - Call API via services
   - Use hooks for state

---

## Next Steps

Recommended additions to make this production-ready:

- [ ] Error handling & retry logic in API service
- [ ] AsyncStorage for caching & user preferences
- [ ] Loading states and skeletons
- [ ] Error boundaries for crash handling
- [ ] Analytics service for tracking
- [ ] Unit tests for services & hooks
- [ ] End-to-end tests for critical flows
- [ ] Logging service for debugging
- [ ] Environment configuration (dev, staging, prod)
- [ ] App state management (Redux, Zustand, or Jotai)

---

## Notes

- This structure follows React Native best practices and is similar to production apps in the App Store/Play Store.
- TypeScript prevents many bugs at compile time — keep using it!
- Navigation types are crucial for type safety — update them whenever adding new screens.
- Features should be loosely coupled and independently testable.

---

For questions or to expand any section, refer to:
- [React Navigation docs](https://reactnavigation.org/)
- [React Native docs](https://reactnative.dev/)
- [Expo documentation](https://docs.expo.dev/versions/latest/)
