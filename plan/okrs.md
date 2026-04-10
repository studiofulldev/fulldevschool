# fulldev school — OKRs & Execution Plan
> Cycle: Q2 2026 (90 days) · Last updated: 2026-04-09

## Context

fulldev school is a developer education platform — courses, learning paths, practical projects, community.

**Primary user:** developer in formation:
- Beginner wanting to enter the market (wants a job, not a degree)
- Junior dev wanting to level up (already working, wants to advance)
- Career switcher (coming from another field, wants to become a dev)

**Behavior:** watches lessons on the phone on the bus, on desktop at home. Zero patience for slow or poorly produced content. Compares everything to YouTube — if content is less engaging, opens YouTube.

**Biggest enemy:** silent abandonment — student who stops accessing without cancelling. They don't say anything. They just disappear.

**Competition:** Alura, Rocketseat, DIO.

---

## Product State (as of 2026-04-10)

### What exists
- Angular 19 standalone + signals with clean architecture (shells / pages / services / data / guards)
- Complete Supabase auth: email registration, email login, Google OAuth, LinkedIn OAuth
- `LoginPageComponent` with full UI — `/login` route declared in `app.routes.ts` (merged to main)
- `CourseProgressService` — persists lesson/module/course progress in `localStorage` (does NOT sync with Supabase yet)
- `SchoolContentService` reading content from mock-db (Markdown + JSON tree)
- `AudioNarrationService` via Web Speech API — deliberately removed from UI (code comment confirms)
- `SeoService` + `ThemeService` (dark/light)
- `AuthGuard` with correct session verification
- `RoleGuard` for role-based access control
- Docker + nginx setup for containerized deploy
- Vercel deploy configured

### Existing pages (routes)
- `/login` — LoginPageComponent with Google + LinkedIn OAuth (now exists — merged)
- `/courses/home` — PlatformDashboard (static placeholder, no real data)
- `/courses/catalog` — course listing with cards
- `/courses/account` — user profile + course progress %
- `/courses/:courseSlug` — CourseOverview with modules
- `/courses/:courseSlug/modules/:moduleSlug` — ModulePage
- `/courses/:courseSlug/lessons/:lessonSlug` — LessonPage (Markdown with expandable panels, prev/next nav, scroll reading bar)
- `/legal/privacy` and `/legal/terms`

### Content
- 1 course: "Start: Começando na tecnologia"
- 58 lessons in `tree.json` across 16 thematic sections
- All content in Markdown — 0/58 `audioManifestPath` filled
- Rich editorial content: area maps, specialty paths, job market, portfolio, mindset, glossary, FAQ

### Critical gaps

1. **~~`/login` route does not exist~~** — **RESOLVED (merged to main).** `LoginPageComponent` was implemented with full OAuth wizard UI (Google + LinkedIn). Route `/login` is declared in `app.routes.ts`. Auth guard redirect is now functional.
2. **Progress does not persist on server** — `CourseProgressService` uses only `localStorage`. Device change or cache clear = all progress lost.
3. **Dashboard is a static placeholder** — `/courses/home` is static HTML with "Estrutura inicial da plataforma" text. No real data, no dynamic content.
4. **No recurring engagement mechanism** — zero streak, zero notification, zero reminder. Nothing that brings the user back tomorrow.
5. **No onboarding path** — registration collects `technicalLevel` but this information doesn't route to any learning path.
6. **No certificate** — no structure for certificate issuance on course completion.
7. **Zero analytics** — no tracking events. Completion rate, day 7 retention — none of these are measurable today.
8. **Obsidian internal links broken** — `[[...]]` links from Obsidian don't become real navigation.
9. **`PlatformDataService` hardcoded to 1 course** — `computed(() => [this.buildStartCourse()])`. Publishing a second course requires service refactoring.
10. **Corrupted encoding** — README notes markdown files with corrupted characters still needing review.

---

## OKRs — Q2 2026

### Objective 1: Student finishes the first week with a sense of real progress

**Rationale:** The dashboard is a static placeholder and progress disappears on device change. The `/login` route was missing at analysis time but has since been merged — auth routing now works. The remaining critical path blockers are progress sync and a real dashboard. Without these, all other OKRs are fiction.

| Key Result | Target | Baseline |
|---|---|---|
| KR1: % of users who register and complete at least 1 lesson in their first session | ≥ 70% | Not measurable (no tracking) |
| KR2: Day 7 retention (users who return to platform on day 7) | ≥ 40% | Not measurable |
| KR3: Lesson progress synced with Supabase for 100% of authenticated users | 100% | 0% (localStorage only) |

---

### Objective 2: The product has a face — doesn't feel like perpetual beta

**Rationale:** Dashboard is static, auth guard points to a non-existent route, and onboarding doesn't use collected `technicalLevel`. The product collects user data but does nothing with it. This breaks trust in the first session — exactly when the YouTube comparison is most violent.

| Key Result | Target | Baseline |
|---|---|---|
| KR1: 100% of auth flow functional end-to-end: `/login` route, `/register`, correct post-auth redirect, loading state visible during session verification | Functional | `/login` merged — verify `/register` and post-auth redirect e2e |
| KR2: Dashboard shows at least 3 real dynamic elements: last lesson accessed, % progress in current course, next recommended lesson | Functional | Static placeholder |
| KR3: Post-registration onboarding routes user to first lesson of path matching their `technicalLevel`, reducing time "register → first lesson" to < 60 seconds | < 60s | Not implemented |

---

### Objective 3: Student has a reason to come back tomorrow

**Rationale:** The biggest enemy is silent abandonment. Today there's zero active retention mechanism — no streak, no certificate, nothing. Content exists (58 lessons) but the platform doesn't create the habit. Duolingo solved this in 2005. Can't compete with Rocketseat and Alura without at least one return mechanism.

| Key Result | Target | Baseline |
|---|---|---|
| KR1: Streak implemented and visible in UI — at least 30% of active users form a 3-day sequence in first month | 30% | Not implemented |
| KR2: Course completion screen with certificate (PDF or shareable image) published — 100% of users who complete "Start" receive certificate | 100% | Not implemented |
| KR3: Average streak of active users (3+ accesses) reaches 5 days in the period | 5 days | Not measurable |

---

## Execution Plan

### Phase 1 — Weeks 1–3: Fix critical breaks

Everything broken or missing that prevents the basic journey from working.

**Week 1–2:**
- [x] ~~Create `/login` route and `LoginPageComponent`~~ — **DONE (merged to main).** OAuth wizard with Google + LinkedIn is live.
- [ ] Verify `/register` route and post-auth redirect work end-to-end (smoke test the full auth flow since `/login` is now real)
- [ ] Fix corrupted encoding in Markdown files (editorial task, low technical cost)
- [ ] Transform `[[Obsidian]]` links into real `RouterLink` in `SchoolContentService`

**Week 3:**
- [ ] Migrate `CourseProgressService` to persist in Supabase when user is authenticated, keeping localStorage as offline fallback
- [ ] Add `last_lesson_accessed` to progress table (needed for dashboard)
- [ ] Add basic tracking events (Posthog or direct to Supabase): `lesson_started`, `lesson_completed`, `session_started` — **without this, no KR is measurable**

**What NOT to do yet:** streak, certificate, audio — without the critical path working, these features are waste.

---

### Phase 2 — Weeks 4–6: Real dashboard + functional onboarding

The product needs a face.

**Week 4–5:**
- [ ] Redesign `PlatformDashboardComponent` with real data: last lesson accessed, % progress in "Start", next lesson (consuming progress now persisted in Supabase)
- [ ] Post-registration onboarding: on account create, redirect to path selection page; if `technicalLevel === 'beginner'`, go directly to first "Start" lesson
- [ ] Full-course progress bar visible in `CourseShellComponent` sidebar

**Week 6:**
- [ ] Refactor `PlatformDataService` to support multiple courses without hardcode — `courses = computed(() => [this.buildStartCourse()])` must come from Supabase or a JSON array. This unblocks publishing a second course without urgent refactoring.

**What NOT to do yet:** certificate (depends on consolidated completion on server), streak (needs server-side progress stabilized first).

---

### Phase 3 — Weeks 7–10: Active retention

Now the habit mechanisms, because the base is solid.

**Week 7–8:**
- [ ] Streak: `streak_count` + `last_active_date` columns in Supabase profile; simple visual component in dashboard and course shell; update logic on each `lesson_completed` — **the number "your streak: 4 days" changes behavior; doesn't need to be elaborate**

**Week 9–10:**
- [ ] Course completion screen: trigger when `setCourseCompleted` called for the first time; emit `course_completed` tracking event
- [ ] Certificate: client-side generation with Canvas or html2canvas with student name, course, date — sufficient for LinkedIn sharing; no server needed now
- [ ] Re-engagement email after 3 days without access (via Supabase Edge Functions) — only for users who completed at least 1 lesson

---

### Feature dependency chain

```
/login + /register routes (fix)
  → progress synced to Supabase
      → real dashboard
          → streak
              → certificate

tracking events
  → all KRs above become measurable
  (without tracking, day 90 the team is flying blind)
```

**Tracking must enter in Phase 1.** It's the second most urgent thing after the broken routes.

---

## What NOT to build in the next 90 days

| Feature | Reason |
|---|---|
| Audio narration | `AudioNarrationService` is implemented correctly but recording/syncing audio for 58 lessons is massive editorial work. UI was removed for a good reason. Don't return until traction with written content. |
| Second new course | Before scaling catalog, fix retention in the existing course. 20% completion rate on one good course beats 5 courses with 3%. |
| Native mobile app | Angular with good responsive solves the real mobile need for entry-level devices now. |
| Community / forum | High moderation cost, low return before user base exists. Backlog. |
| Complex gamification (badges, points, leaderboard) | Without substance, increases churn later. Simple streak is enough for 90 days. |
| CMS for instructors | mock-db + Markdown structure is sufficient for team to publish content. Visual CMS costs weeks of dev. |

---

## Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| ~~`/login` route missing breaks auth guard in production~~ | ~~**Critical**~~ | ~~**Critical**~~ | **RESOLVED** — `LoginPageComponent` merged to main. Auth guard redirect functional. |
| localStorage progress = silent abandonment from technical frustration | High | High | Migrate to Supabase in Phase 1, week 3 |
| No tracking = impossible to know if KRs were achieved | High | Critical | Add tracking events in Phase 1 — non-negotiable |
| Corrupted encoding damages quality perception | High | Medium | Dev is the user; they notice encoding errors before anything else |
| Hardcoded `PlatformDataService` blocks catalog growth | Medium | Medium | Address in Phase 2, week 6 before it becomes technical debt blocking Phase 3 |
| Generic onboarding wastes collected segmentation | High | Medium | `technicalLevel` must route the journey — Phase 2 |
