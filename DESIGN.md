# DotaPulse Header — Design Blueprint

## Identity

**Product UI Designer** — "What state does the user hit 90% of the time?" The header is the one element every page loads, every user sees, and every interaction starts from. It must be invisible when content is the focus, unmistakable when navigation is the intent, and flawless on every viewport.

## Grounding

Existing production site. The current header works but has clear gaps: no scroll-awareness, a clunky mobile experience with two disconnected dropdowns, and generic UI patterns (native `<select>`, no hamburger animation). The accent palette (`#ff4c4c` red, orange gradient) and dark glass aesthetic are established and should be preserved — the work is refinement, not reinvention.

---

## DESIGN.md — Visual Spec

### 1. Objective

Improve the DotaPulse header to feel premium, responsive, and intentional across all viewports. Changes must be backward-compatible with the existing page layout (header is `sticky; top: 0`) and not require restructuring pages that consume it.

### 2. Product Context

- **Stack**: Next.js App Router, React, CSS Modules, Boxicons
- **Fonts**: Montserrat (body), Russo One (logo)
- **Accent**: `#ff4c4c` (red), orange gradient on logo "PULSE" text
- **Existing patterns**: `backdrop-filter: blur`, dark glassmorphism, sticky positioning
- **Locale**: RU/EN toggle, uses `useLocale()` context

### 3. Visual Foundations

| Token | Current | Proposed |
|---|---|---|
| Header height | auto (~60px) | 64px desktop, 56px mobile |
| Background | `rgba(26,26,26,0.85)` | `rgba(18,18,18,0.72)` (lighter glass) |
| Backdrop blur | `10px` | `16px` + subtle `saturate(1.2)` |
| Border bottom | `1px solid rgba(255,255,255,0.1)` | `1px solid rgba(255,255,255,0.06)` |
| Scroll state background | none | `rgba(12,12,12,0.95)` (denser on scroll) |
| Link color | `#b3b3b3` | `rgba(255,255,255,0.6)` |
| Link hover | `#fff` + underline | `#fff` + pill background |
| Active indicator | underline `::after` | Filled pill: `rgba(255,76,76,0.12)` bg + `#ff4c4c` text |
| Logo shield size | 30px | 32px (closer to text baseline) |
| Logo text | 28px Russo One | 26px Russo One (tighter to shield) |
| Mobile menu | Two absolute dropdowns | Single slide-in panel from right |
| Hamburger | Boxicons `bx-menu`/`bx-x` | CSS 3-line bar → X animation |

### 4. Accessibility

- `aria-label` on all interactive elements (already present on hamburger, logout)
- `aria-expanded` on hamburger tied to mobile menu state
- `aria-current="page"` on active nav link (already present)
- Focus-visible ring on all interactive elements: `2px solid #ff4c4c, offset 2px`
- `prefers-reduced-motion`: disable all slide/transform animations (globals.css already handles this)
- Mobile menu: trap focus when open, close on Escape key

### 5. Voice & Tone

The header should feel "game-ready" — sharp, fast, no friction. Text is minimal. No welcome messages, no decorative copy. Every pixel serves navigation or identity.

### 6. Implementation Practices

- CSS Modules only (no inline styles, no Tailwind)
- All animations via CSS transitions/transitions, not JS-driven
- Scroll listener via `useEffect` with `passive: true`
- Mobile menu body scroll lock via `document.body.style.overflow`
- No new dependencies required

### 7. Anti-Patterns

- No gradient hero background in header (U1) — solid dark with glass effect
- No emoji decorations (U3) — clean iconography only
- No uniform button weights (U6) — login button is primary, everything else is ghost/text

### 8. Decision-Making

See Decision Trace below.

### 9. Workflow

Phased implementation: CSS-only changes first (zero risk), then TSX structural changes, then scroll behavior, then mobile overhaul.

---

## Structure — Phased Implementation Plan

### Phase 1: CSS Refinements (Desktop)
**Goal**: Polish the existing desktop header without touching TSX.

**File: `Navbar.module.css`**

1. **Scroll-aware background** — Add `.dotaHeader.scrolled` class with denser background
   - `background-color: rgba(12, 12, 12, 0.95)` when scrolled
   - Reduce padding from `15px 60px` to `10px 60px` when scrolled
   - Transition already exists on `.dotaHeader`

2. **Glass effect upgrade** — Replace current backdrop values
   - `backdrop-filter: blur(16px) saturate(1.2)`
   - Lighter base: `rgba(18, 18, 18, 0.72)`
   - Softer border: `rgba(255, 255, 255, 0.06)`

3. **Active page indicator** — Replace underline with filled pill
   - `.menuLinkActive`: `background: rgba(255, 76, 76, 0.12); color: #ff4c4c; border-radius: 6px; padding: 6px 14px`
   - Remove the `::after` underline for active state

4. **Logo refinement** — Tighten shield + text relationship
   - Shield: 32px, add subtle `filter: drop-shadow(0 0 4px rgba(255,76,76,0.4))` (softer)
   - Logo text: 26px, reduce `margin-right` from 10px to 8px

5. **Language switcher** — Replace native `<select>` with custom dropdown
   - Two-button toggle (RU | EN) with active state highlight
   - Remove `appearance: none` hack, use proper button pair

6. **Profile button hierarchy** — Make login button the clear primary CTA
   - `.profileBtn`: add `box-shadow: 0 2px 12px rgba(255,76,76,0.3)` at rest
   - `.userProfile`: slightly more prominent background `rgba(255,255,255,0.08)`

7. **Focus-visible styles** — Add `:focus-visible` ring to all interactive elements
   - `outline: 2px solid #ff4c4c; outline-offset: 2px`

### Phase 2: TSX Structural Changes (Scroll Behavior)
**Goal**: Add scroll-awareness without breaking anything.

**File: `Navbar.tsx`**

8. **Scroll listener** — Add `useState<boolean>` for `scrolled` state
   ```tsx
   const [scrolled, setScrolled] = useState(false);
   useEffect(() => {
     const onScroll = () => setScrolled(window.scrollY > 20);
     window.addEventListener('scroll', onScroll, { passive: true });
     return () => window.removeEventListener('scroll', onScroll);
   }, []);
   ```

9. **Apply scrolled class** — Add conditional class to `<header>`
   ```tsx
   <header className={`${styles.dotaHeader} ${scrolled ? styles.scrolled : ''}`}>
   ```

10. **Language switcher component** — Replace `<select>` with button pair
    ```tsx
    <div className={styles.langSwitcher}>
      <button
        className={`${styles.langBtn} ${locale === 'ru' ? styles.langBtnActive : ''}`}
        onClick={() => setLocale('ru')}
      >RU</button>
      <button
        className={`${styles.langBtn} ${locale === 'en' ? styles.langBtnActive : ''}`}
        onClick={() => setLocale('en')}
      >EN</button>
    </div>
    ```

### Phase 3: Mobile Menu Overhaul
**Goal**: Replace two dropdowns with a single slide-in panel.

**File: `Navbar.tsx`**

11. **Unified mobile menu structure** — Merge nav + actions into one panel
    ```tsx
    {/* Mobile overlay */}
    <div className={`${styles.mobileOverlay} ${mobileOpen ? styles.open : ''}`} onClick={toggleMobile} />
    
    {/* Mobile slide-in panel */}
    <div className={`${styles.mobilePanel} ${mobileOpen ? styles.open : ''}`}>
      <nav className={styles.mobileNav}>
        {/* All links here */}
      </nav>
      <div className={styles.mobileActions}>
        {/* AI, Lang, Auth here */}
      </div>
    </div>
    ```

12. **Hamburger animation** — Replace Boxicons icon with CSS-animated bars
    ```tsx
    <button className={`${styles.hamburger} ${mobileOpen ? styles.hamburgerOpen : ''}`} onClick={toggleMobile} aria-label="Menu" aria-expanded={mobileOpen}>
      <span className={styles.hamburgerLine} />
      <span className={styles.hamburgerLine} />
      <span className={styles.hamburgerLine} />
    </button>
    ```

13. **Body scroll lock** — Prevent background scroll when mobile menu is open
    ```tsx
    useEffect(() => {
      document.body.style.overflow = mobileOpen ? 'hidden' : '';
      return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);
    ```

14. **Escape key handler** — Close mobile menu on Escape
    ```tsx
    useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && mobileOpen) setMobileOpen(false);
      };
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }, [mobileOpen]);
    ```

**File: `Navbar.module.css`**

15. **Mobile overlay** — Full-screen semi-transparent backdrop
    ```css
    .mobileOverlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 998;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .mobileOverlay.open {
      display: block;
      opacity: 1;
    }
    ```

16. **Mobile slide-in panel** — Right-side drawer
    ```css
    .mobilePanel {
      display: none;
      position: fixed;
      top: 0;
      right: 0;
      width: 280px;
      height: 100vh;
      background: rgba(18, 18, 18, 0.98);
      backdrop-filter: blur(20px);
      z-index: 999;
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      flex-direction: column;
      padding: 80px 24px 24px;
      overflow-y: auto;
    }
    .mobilePanel.open {
      display: flex;
      transform: translateX(0);
    }
    ```

17. **Hamburger CSS animation** — Three lines → X
    ```css
    .hamburgerLine {
      display: block;
      width: 24px;
      height: 2px;
      background: #fff;
      transition: all 0.3s ease;
    }
    .hamburgerOpen .hamburgerLine:nth-child(1) {
      transform: translateY(8px) rotate(45deg);
    }
    .hamburgerOpen .hamburgerLine:nth-child(2) {
      opacity: 0;
    }
    .hamburgerOpen .hamburgerLine:nth-child(3) {
      transform: translateY(-8px) rotate(-45deg);
    }
    ```

18. **Mobile nav links** — Larger touch targets, vertical layout
    ```css
    .mobileNav .menuLink {
      padding: 14px 0;
      font-size: 18px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    ```

### Phase 4: Polish & Edge Cases
**Goal**: Final refinements.

19. **Skeleton loading state** — Prevent layout shift during auth fetch
    - Show a 32x32 circle placeholder + 80px wide text placeholder while `loading === true`
    - Use CSS `@keyframes` shimmer animation on the skeleton

20. **Reduced motion** — Ensure all new animations respect `prefers-reduced-motion`
    - Already handled by `globals.css` rule, but verify slide-in and hamburger transitions

21. **Z-index audit** — Ensure mobile panel (999) sits below header (1000) but above content
    - Header: `z-index: 1000`
    - Mobile panel: `z-index: 999`
    - Overlay: `z-index: 998`

---

## Decision Trace

| # | Decision | Reason | Alternatives | Tradeoff |
|---|---|---|---|---|
| 1 | Right-side slide-in panel for mobile | Preserves the desktop left-to-right reading order; common pattern users expect (Material Design, iOS) | Full-screen overlay dropdown (current approach), bottom sheet, left-side drawer | Right-side drawer covers content but doesn't shift layout; left-side would conflict with back button conventions |
| 2 | CSS hamburger animation instead of Boxicons icon | Consistent with the custom animation; no icon dependency for this element; smoother 3-line → X transition | Keep Boxicons `bx-menu`/`bx-x` toggle | Loses the Boxicons visual consistency for one icon; gains a more polished animation |
| 3 | Filled pill for active page indicator | More distinctive than underline; provides clear "you are here" signal; works on both desktop and mobile | Keep underline (current), dot indicator, bold-only | Pill takes more horizontal space; acceptable given the link count is small (4-5 items) |
| 4 | Two-button language toggle instead of `<select>` | Eliminates generic native styling; gives clear visual feedback on active language; consistent with the glass aesthetic | Custom styled dropdown, keep native select | Two buttons take slightly more width; acceptable given only two languages |
| 5 | Scroll-aware background densification | Standard pattern for sticky headers; signals "scrolled past hero" without being distracting | Keep constant opacity, shrink height only | Minimal cost; high UX value for long pages |
| 6 | Mobile panel from right, not full-width | Keeps the header visible while menu is open; users can see where they are; dismisses naturally with overlay tap | Full-width dropdown (current) | Right panel is narrower; some content is hidden behind it — acceptable tradeoff for the spatial clarity |

---

## Anti-Slop Self-Check

- **U1 gradient hero**: Clean — header uses solid dark, no gradient background
- **U2 rounded card grid**: Clean — no cards in header
- **U3 emoji decoration**: Clean — no emoji used
- **U4 isometric people**: Clean
- **U5 stat trios**: Clean
- **U6 uniform buttons**: Clean — login is primary, lang toggle is ghost, logout is icon-only
- **U7 empty copy**: Clean — no copy in header, only nav labels
- **U8 em-dash**: Clean — no prose in header

**Result**: Clean. No anti-slop patterns detected.
