# Maakon Frontend Upgrade Plan

**Objective:** Upgrade to a more advanced, simple, and mobile-tailored version  
**Timeline:** Medium upgrade (2-4 weeks)  
**Approach:** Mixed (incremental refactoring + strategic rewrites)

---

## Current State Assessment

### ✅ What's Working Well
- React 19 + Vite (fast development)
- Tailwind CSS v4 (modern styling)
- Code-splitting with lazy routes (performance)
- shadcn/ui + Radix UI (accessible components)
- React Query (data caching)
- Bilingual support (Arabic/English, RTL)
- Leaflet maps integration

### ⚠️ Areas for Improvement
- Navigation could be more mobile-optimized (bottom nav, FAB)
- Modal/sheet handling inconsistent across pages
- State management scattered (Context + Query)
- Form validation/error handling could be streamlined
- Image optimization (no lazy loading detected)
- No PWA features (offline, installable)
- Mobile viewport optimization incomplete
- Touch gestures not fully utilized

---

## Phase 1: Mobile-First Navigation & Layout (Week 1)

### 1.1 Bottom Navigation + Floating Action Button
**Goal:** Simplify navigation on mobile, keep header minimal

**Changes:**
- Create `BottomNav.tsx` component with tabs: Home | Map | My Posts | More
- Create `MobileFAB.tsx` for quick actions (Post Need/Offer)
- Replace/supplement top nav on mobile (breakpoint: md)
- Hide desktop nav on mobile, show on md+

**Files to Create/Modify:**
```
artifacts/maakon-web/src/components/layout/
  ├── BottomNav.tsx          (NEW)
  ├── MobileFAB.tsx          (NEW)
  ├── TopNav.tsx             (MODIFY - responsive)
  └── Layout.tsx             (NEW - wrapper)
```

**Benefits:**
- Thumb-friendly navigation
- Reduced UI clutter on mobile
- Faster access to key actions

---

### 1.2 Responsive Layout Wrapper
**Goal:** Consistent spacing and safe areas on mobile

**Changes:**
- Create `Layout.tsx` that wraps all pages
- Handle notch/safe areas on mobile
- Consistent padding/margins
- Portrait/landscape orientation handling

**Code:**
```tsx
// components/layout/Layout.tsx
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <TopNav />
      <main className="flex-1 pb-20 md:pb-0 px-4 md:px-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
```

**Files to Modify:**
```
artifacts/maakon-web/src/App.tsx          (MODIFY - wrap routes with Layout)
artifacts/maakon-web/src/pages/*.tsx      (MODIFY - remove nav imports, use Layout)
```

---

## Phase 2: Advanced State Management (Week 1-2)

### 2.1 Simplified State Pattern
**Goal:** Reduce complexity by combining Context + Query patterns

**Current Issue:** 
- Auth state in Context
- Data in Query
- UI state scattered across components

**Solution:** Unified state management

**Files to Create:**
```
artifacts/maakon-web/src/hooks/
  ├── useAppState.ts         (NEW - unified state hook)
  ├── usePostForm.ts         (NEW - form state)
  └── useMapFilters.ts       (NEW - map-specific state)
```

**Example:**
```tsx
// hooks/useAppState.ts - Single source of truth
export function useAppState() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: posts } = useListPosts();
  const { data: ngos } = useListNgos();
  
  return {
    user,
    posts,
    ngos,
    isLoading: authLoading || isLoadingPosts,
    // ... other aggregated state
  };
}
```

**Files to Modify:**
```
artifacts/maakon-web/src/contexts/AuthContext.tsx        (REFACTOR)
artifacts/maakon-web/src/pages/MapPage.tsx               (REFACTOR - use useAppState)
artifacts/maakon-web/src/pages/PostNeed.tsx              (REFACTOR - use usePostForm)
artifacts/maakon-web/src/pages/PostOffer.tsx             (REFACTOR - use usePostForm)
```

---

## Phase 3: Component Refactoring (Week 2)

### 3.1 Sheet Dialogs Instead of Full-Page Modals
**Goal:** Mobile-friendly forms and content

**Changes:**
- Replace full-page modals with sheets (Radix UI)
- Sheets slide from bottom on mobile
- Sheets become dialogs on desktop
- Smoother animations

**Files to Create:**
```
artifacts/maakon-web/src/components/
  ├── SheetForm.tsx          (NEW - reusable sheet wrapper)
  └── FormSheet.tsx          (NEW - combines form + sheet)
```

**Files to Modify:**
```
artifacts/maakon-web/src/components/auth/AuthModal.tsx    (REFACTOR - use Sheet)
artifacts/maakon-web/src/pages/PostNeed.tsx               (REFACTOR - Sheet form)
artifacts/maakon-web/src/pages/PostOffer.tsx              (REFACTOR - Sheet form)
```

### 3.2 Image Optimization
**Goal:** Faster loading, smaller bundle

**Changes:**
- Add image lazy loading with `<img loading="lazy">`
- Implement responsive images with srcset
- Add WebP support with fallback
- Optimize uploaded images in backend

**Files to Create:**
```
artifacts/maakon-web/src/components/
  └── OptimizedImage.tsx     (NEW - reusable image component)
```

**Example:**
```tsx
export function OptimizedImage({ 
  src, alt, className 
}: { src: string; alt: string; className?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      sizes="(max-width: 640px) 100vw, 50vw"
    />
  );
}
```

**Files to Modify:**
```
artifacts/maakon-web/src/pages/MapPage.tsx                (MODIFY - image loading)
artifacts/maakon-web/src/components/map/PostDetailsModal.tsx (MODIFY - images)
```

---

## Phase 4: Performance & PWA (Week 2-3)

### 4.1 Core Web Vitals Optimization
**Goal:** Faster, smoother experience

**Changes:**
- Code splitting already good (lazy routes)
- Add performance monitoring (web-vitals)
- Optimize Tailwind CSS output
- Minify bundle

**Files to Modify:**
```
artifacts/maakon-web/vite.config.ts        (MODIFY - optimize build)
artifacts/maakon-web/src/main.tsx          (MODIFY - add vitals tracking)
```

**Vite Config Enhancement:**
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: (id) => {
        if (id.includes('leaflet')) return 'leaflet';
        if (id.includes('react-query')) return 'query';
      }
    }
  },
  minify: 'terser',
  terserOptions: {
    compress: { drop_console: true }
  }
}
```

### 4.2 Progressive Web App (PWA)
**Goal:** Installable, offline-capable app

**Changes:**
- Add manifest.json with app metadata
- Create service worker for offline caching
- Add install prompt
- Cache key API responses

**Files to Create:**
```
artifacts/maakon-web/public/
  └── manifest.json           (NEW)

artifacts/maakon-web/src/
  ├── sw.ts                   (NEW - service worker)
  └── hooks/usePWA.ts         (NEW - PWA utilities)
```

**manifest.json:**
```json
{
  "name": "Maakon - Crisis Response",
  "short_name": "Maakon",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "orientation": "portrait",
  "icons": [
    { "src": "/logo-192.png", "sizes": "192x192" },
    { "src": "/logo-512.png", "sizes": "512x512" }
  ]
}
```

**Files to Modify:**
```
artifacts/maakon-web/index.html             (MODIFY - add manifest link)
artifacts/maakon-web/src/main.tsx           (MODIFY - register service worker)
```

---

## Phase 5: Mobile Gestures & Touch (Week 3)

### 5.1 Touch Interactions
**Goal:** Native-like mobile experience

**Changes:**
- Swipe gestures for map navigation
- Pull-to-refresh for data
- Tap feedback (haptic-like visual)
- Long-press for context menus

**Library:** Add `react-use-gesture` or `framer-motion` gestures

**Files to Create:**
```
artifacts/maakon-web/src/hooks/
  ├── useSwipe.ts             (NEW)
  └── usePullRefresh.ts       (NEW)
```

**Files to Modify:**
```
artifacts/maakon-web/src/pages/MapPage.tsx         (MODIFY - add swipe)
artifacts/maakon-web/src/pages/MyPosts.tsx         (MODIFY - pull-to-refresh)
package.json                                        (MODIFY - add gesture library)
```

---

## Phase 6: Simplification & Polish (Week 3-4)

### 6.1 Form Handling Standardization
**Goal:** Consistent, reusable form components

**Files to Create:**
```
artifacts/maakon-web/src/components/forms/
  ├── FormField.tsx           (NEW - wrapper)
  ├── FormError.tsx           (NEW - error display)
  └── FormSubmitButton.tsx    (NEW - consistent button)
```

### 6.2 Error Handling Patterns
**Goal:** Better error messages and recovery

**Files to Modify:**
```
artifacts/maakon-web/src/components/
  ├── ErrorBoundary.tsx       (MODIFY - improved)
  └── ErrorFallback.tsx       (NEW)
```

### 6.3 Loading & Skeleton States
**Goal:** Better perceived performance

**Files to Create:**
```
artifacts/maakon-web/src/components/
  └── Skeleton.tsx            (NEW - skeletal loading)
```

**Files to Modify:**
```
artifacts/maakon-web/src/pages/MapPage.tsx         (MODIFY - add skeletons)
artifacts/maakon-web/src/pages/MyPosts.tsx         (MODIFY - add skeletons)
```

---

## Recommended Implementation Order

### Week 1
- [ ] Phase 1.1: BottomNav + MobileFAB
- [ ] Phase 1.2: Layout wrapper
- [ ] Phase 2.1: Unified state hooks
- [ ] Test on mobile device

### Week 2  
- [ ] Phase 3.1: Sheet dialogs for forms
- [ ] Phase 3.2: Image optimization
- [ ] Phase 4.1: Core Web Vitals
- [ ] Performance testing and optimization

### Week 3
- [ ] Phase 4.2: PWA setup
- [ ] Phase 5.1: Touch gestures
- [ ] Phase 6.1-6.3: Simplification & polish
- [ ] Cross-device testing

### Week 4
- [ ] Bug fixes and refinements
- [ ] Performance tuning
- [ ] Documentation updates
- [ ] Deploy to staging

---

## Testing Checklist

### Mobile Testing
- [ ] Test on iPhone (Safari)
- [ ] Test on Android (Chrome)
- [ ] Test portrait and landscape
- [ ] Test on small screens (375px)
- [ ] Test on tablets (iPad)
- [ ] Test with notch/safe areas
- [ ] Test dark mode

### Performance
- [ ] Run Lighthouse audit
- [ ] Check Core Web Vitals
- [ ] Monitor bundle size
- [ ] Test offline capability
- [ ] Test on slow 3G

### Functionality
- [ ] Navigation works smoothly
- [ ] Forms submit correctly
- [ ] Maps load and interact
- [ ] Auth flows work
- [ ] Admin dashboard functions
- [ ] No console errors

### Browser Compatibility
- [ ] Chrome/Edge latest 2 versions
- [ ] Firefox latest 2 versions
- [ ] Safari 15+
- [ ] Mobile browsers

---

## File Structure After Upgrade

```
artifacts/maakon-web/src/
├── components/
│   ├── layout/
│   │   ├── Layout.tsx              (NEW)
│   │   ├── TopNav.tsx              (REFACTORED)
│   │   ├── BottomNav.tsx           (NEW)
│   │   └── MobileFAB.tsx           (NEW)
│   ├── forms/
│   │   ├── FormField.tsx           (NEW)
│   │   ├── FormError.tsx           (NEW)
│   │   └── FormSubmitButton.tsx    (NEW)
│   ├── common/
│   │   ├── OptimizedImage.tsx      (NEW)
│   │   ├── Skeleton.tsx            (NEW)
│   │   ├── ErrorBoundary.tsx       (REFACTORED)
│   │   └── ErrorFallback.tsx       (NEW)
│   ├── auth/
│   │   └── AuthModal.tsx           (REFACTORED)
│   ├── map/
│   │   └── ... (existing)
│   ├── admin/
│   │   └── ... (existing)
│   └── ui/
│       └── ... (existing shadcn components)
├── hooks/
│   ├── useAppState.ts              (NEW)
│   ├── usePostForm.ts              (NEW)
│   ├── useMapFilters.ts            (NEW)
│   ├── useSwipe.ts                 (NEW)
│   ├── usePullRefresh.ts           (NEW)
│   └── ... (existing)
├── pages/
│   ├── Home.tsx                    (minor adjustments)
│   ├── MapPage.tsx                 (REFACTORED)
│   ├── PostNeed.tsx                (REFACTORED)
│   ├── PostOffer.tsx               (REFACTORED)
│   ├── MyPosts.tsx                 (REFACTORED)
│   └── ... (existing)
├── sw.ts                           (NEW - service worker)
├── App.tsx                         (REFACTORED)
└── main.tsx                        (REFACTORED)
```

---

## Dependencies to Add

```json
{
  "devDependencies": {
    "web-vitals": "^4.0.0",
    "@vitejs/plugin-pwa": "^0.20.0"
  },
  "dependencies": {
    "react-use-gesture": "^10.3.0",
    "workbox-window": "^7.0.0"
  }
}
```

---

## Key Principles

1. **Mobile-First:** Design for mobile, enhance for desktop
2. **Performance:** Lazy load, code-split, optimize images
3. **Simplicity:** Reduce state complexity, reusable components
4. **Accessibility:** Keep ARIA labels, keyboard navigation
5. **Offline-First:** Cache key data, work without internet
6. **User-Centric:** Every feature should improve experience

---

## Success Metrics

- **Lighthouse Score:** 90+ (Performance, Best Practices)
- **Core Web Vitals:** All green (LCP, FID, CLS)
- **Bundle Size:** <150KB gzipped (JS)
- **Mobile UX:** Smooth scrolling, no jank
- **Offline:** App works offline for cached pages
- **Installable:** "Add to Home Screen" works

---

## Rollback Strategy

- Create feature branch: `feature/mobile-upgrade`
- Incremental commits (one phase per commit)
- Test each phase before merging
- Can cherry-pick features if needed

---

## Questions to Clarify

- [ ] Priority: Which phase matters most?
- [ ] Analytics: Want to track mobile metrics?
- [ ] Push Notifications: Desired feature?
- [ ] Real-time: Need live data updates?
- [ ] Dark Mode: Should we maintain/improve it?

---

**Next Step:** Review this plan, provide feedback, and we'll start Phase 1!
