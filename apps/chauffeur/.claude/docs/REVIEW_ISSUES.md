# Review Issues

Status: ✅ = fixed | 🔖 TODO = i kode | ⏭ = skipped

---

## TaskDetailScreen — `src/screens/TaskDetailScreen.tsx`

| # | Prioritet | Issue | Status |
|---|---|---|---|
| 1 | CRITICAL | `taskState` synkroniserer ikke — fix: `useEffect` synkroniserer `task.state` efter load | ✅ |
| 2 | CRITICAL | `task.locations[0/1]` uden bounds-check — fix: destrukturering + early return | ✅ |
| 3 | RECOMMENDED | `height: 80` hardcoded i `contactDivider` — fix: `theme.cardHeight.contactDivider` | ✅ |
| 4 | RECOMMENDED | Tom `contacts`-array gav tom hvid boks — fix: guard med `contacts.length > 0` | ✅ |
| 5 | NICE-TO-HAVE | JSDoc på `id`-prop tilføjet | ✅ |

---

## TaskSheet — `src/components/layout/TaskSheet.tsx`

| # | Prioritet | Issue | Status |
|---|---|---|---|
| 1 | RECOMMENDED | `marginHorizontal: 20` hardcoded — fix: `theme.sheet.horizontalMargin` | ✅ |
| 2 | RECOMMENDED | `insets.top + 8` hardcoded — fix: `theme.spacing.xs` | ✅ |
| 3 | RECOMMENDED | `SCREEN_HEIGHT` / `SHEET_HEIGHT` dead code — slettet | ✅ |
| 4 | NICE-TO-HAVE | `Dimensions` import fjernet (dead code) | ✅ |
| 5 | NICE-TO-HAVE | `closeButton` manglede `accessibilityHint` — tilføjet | ✅ |

---

## BottomTabBar — `src/components/layout/BottomTabBar.tsx`

| # | Prioritet | Issue | Status |
|---|---|---|---|
| 1 | RECOMMENDED | Tab labels manglede `maxFontSizeMultiplier={1}` — tilføjet | ✅ |
| 2 | NICE-TO-HAVE | `TabIcon` exhaustiveness-check (`never`-assertion) tilføjet | ✅ |

---

## TaskSwiper — `src/components/screens/task/TaskSwiper.tsx`

| # | Prioritet | Issue | Status |
|---|---|---|---|
| 1 | RECOMMENDED | Ingen accessibility på swiper — acceptabel for layout-container | ⏭ |
| 2 | RECOMMENDED | `initialIndex` ikke valideret — fix: `safeIndex = Math.min(...)` | ✅ |

---

## TaskActions — `src/components/screens/task/TaskActions.tsx`

| # | Prioritet | Issue | Status |
|---|---|---|---|
| 1 | NICE-TO-HAVE | Ingen fallback ved uventet state — TODO kommentar tilføjet | 🔖 TODO |

---

## TaskSkeleton — `src/components/ui/TaskSkeleton.tsx`

| # | Prioritet | Issue | Status |
|---|---|---|---|
| 1 | RECOMMENDED | `height: 64` hardcoded — fix: `theme.skeleton.metricsCellHeight` | ✅ |
| 2 | RECOMMENDED | `height: 80` hardcoded — fix: `theme.skeleton.locationCardHeight` | ✅ |
| 3 | RECOMMENDED | Manglede accessibility — fix: `accessible={true}` + `accessibilityLabel` | ✅ |
| 4 | NICE-TO-HAVE | `width: '48%'` i metricsCell — acceptabel layout-værdi | ⏭ |

---

## ErrorBanner — `src/components/ui/ErrorBanner.tsx`

| # | Prioritet | Issue | Status |
|---|---|---|---|
| 1 | CRITICAL | `retryButton` touch target for lille — fix: `minHeight: 44, minWidth: 44` | ✅ |
| 2 | RECOMMENDED | `retryButton` manglede `accessibilityRole` + `accessibilityLabel` — tilføjet | ✅ |
| 3 | RECOMMENDED | Tekster manglede `maxFontSizeMultiplier={1}` — tilføjet | ✅ |

---

## StatCard — `src/components/ui/StatCard.tsx`

| # | Prioritet | Issue | Status |
|---|---|---|---|
| 1 | RECOMMENDED | `value` Text manglede `numberOfLines={2}` — tilføjet | ✅ |
| 2 | RECOMMENDED | Tekster manglede `maxFontSizeMultiplier={1}` — tilføjet | ✅ |
| 3 | NICE-TO-HAVE | `accessibilityLabel` kombinerer label + value — tilføjet | ✅ |

---

## LocationCard — `src/components/ui/LocationCard.tsx`

| # | Prioritet | Issue | Status |
|---|---|---|---|
| 1 | RECOMMENDED | `Linking.openURL` manglede `.catch()` — tilføjet | ✅ |
| 2 | RECOMMENDED | Adressefont 12px under outdoor-minimum 14px | 🔖 TODO |
| 3 | RECOMMENDED | Tekster manglede `maxFontSizeMultiplier={1}` — tilføjet | ✅ |

---

## ContactCard — `src/components/ui/ContactCard.tsx`

| # | Prioritet | Issue | Status |
|---|---|---|---|
| 1 | RECOMMENDED | `Linking.openURL` manglede `.catch()` — tilføjet | ✅ |
| 2 | RECOMMENDED | Tomt `phone`-felt gav fejlet `tel:` link — fix: `if (phone)` guard | ✅ |
| 3 | RECOMMENDED | `nameFontSize: 12` under outdoor-minimum 14px | 🔖 TODO |
| 4 | RECOMMENDED | Tekster manglede `maxFontSizeMultiplier={1}` — tilføjet | ✅ |

---

## InfoCard — `src/components/ui/InfoCard.tsx`

| # | Prioritet | Issue | Status |
|---|---|---|---|
| 1 | RECOMMENDED | `danger`-variant manglede `accessibilityRole="alert"` — tilføjet | ✅ |
| 2 | RECOMMENDED | Tekster manglede `maxFontSizeMultiplier={1}` — tilføjet | ✅ |
| 3 | RECOMMENDED | `minHeight` ændret til `height` — forhindrer overflow i swiper | ✅ |
| 4 | NICE-TO-HAVE | `numberOfLines={5}` kan afskære vigtig info | 🔖 TODO |

---

## TransportIcon — `src/components/ui/TransportIcon.tsx`

| # | Prioritet | Issue | Status |
|---|---|---|---|
| 1 | RECOMMENDED | Pilestørrelser `23` hardcoded — fix: `theme.transportIcon.arrowSize` | ✅ |
| 2 | RECOMMENDED | `gap: 14` hardcoded — fix: `theme.transportIcon.gap` | ✅ |
| 3 | NICE-TO-HAVE | Dekorativt element — `accessibilityElementsHidden` + `importantForAccessibility` tilføjet | ✅ |

---

## ActionButton — `src/components/ui/ActionButton.tsx`

| # | Prioritet | Issue | Status |
|---|---|---|---|
| 1 | RECOMMENDED | Label manglede `maxFontSizeMultiplier={1}` — tilføjet | ✅ |
| 2 | NICE-TO-HAVE | `android_ripple` tilføjet | ✅ |

---

## Åbne TODO-punkter (til næste sprint)

- LocationCard + ContactCard + InfoCard: fontsize under 14px outdoor-minimum (design beslutning)
- TaskSwiper: swiper-container accessibility (lav prioritet)
- TaskActions: fallback ved uventet state
