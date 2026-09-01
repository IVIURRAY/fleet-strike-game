# Fleet Strike - UI Design System

## Overview

Fleet Strike features a **neon-cyberpunk aesthetic** inspired by Geometry Wars, combining glowing UI elements with dark space backgrounds. The UI is built with **vanilla CSS** (no framework needed) and overlays the PixiJS game canvas.

**Design Philosophy:**
- **Neon Glow:** Vibrant glowing elements (cyan, magenta, green) against dark backgrounds
- **Geometric Shapes:** Sharp angles, hexagons, skewed elements
- **Space Theme:** Deep blues, purples, blacks with gradient overlays
- **Performance:** Lightweight CSS-only UI, no heavy frameworks
- **Accessibility:** High contrast, readable fonts, clear visual hierarchy

---

## Architecture: CSS Overlays + PixiJS Canvas

```
┌─────────────────────────────────────────┐
│   HTML/CSS UI Layer (Overlay)          │
│   - Menus, HUD, modals                 │
│   - Positioned absolutely              │
│   - pointer-events: none (passthrough)│
├─────────────────────────────────────────┤
│   PixiJS Canvas (WebGPU/WebGL)         │
│   - Ships, planets, effects            │
│   - Full viewport rendering            │
│   - Interactive game elements          │
└─────────────────────────────────────────┘
```

**How They Work Together:**
1. **PixiJS canvas** fills the viewport (game rendering)
2. **HTML/CSS UI** overlays on top with `position: absolute`
3. **Pointer events** selectively enabled/disabled for interaction
4. **No CSS framework** needed - vanilla CSS is sufficient and performant

---

## Color Palette

### Primary Colors

```css
/* Neon Cyan (Brand/Primary) */
--color-cyan: #4fcbe9;
--color-cyan-bright: #67ddf7;
--color-cyan-glow: #32bcdc;

/* Neon Magenta (Accents/Enemy) */
--color-magenta: #c65cff;
--color-magenta-bright: #cc5cff;
--color-magenta-glow: #9b4dff;

/* Neon Green (Success/Income) */
--color-green: #8eff63;
--color-green-bright: #62ff42;
--color-green-glow: #52ff44;

/* Gold (Resources) */
--color-gold: #fff06a;
--color-gold-bright: #ffad32;

/* Warning/Timer */
--color-pink: #ff4fff;
--color-purple: #684cff;
```

### Background Colors

```css
/* Deep Space Backgrounds */
--bg-space: #010108;
--bg-dark: #03020c;
--bg-dark-blue: #020b11;
--bg-panel: #100629;
--bg-card: #0b071d;

/* Gradient Overlays */
--gradient-top: linear-gradient(180deg, rgba(3,3,16,.98), rgba(8,3,24,.94));
--gradient-card: linear-gradient(145deg, #0b071d, #05030e);
--gradient-panel: linear-gradient(145deg, #100629, #03020c);
```

### Border Colors

```css
/* Borders */
--border-cyan: #1e5263;
--border-magenta: #3c2860;
--border-bright: #463078;
```

---

## Typography

### Font Stack

```css
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');

/* Headings, Stats, Numbers */
font-family: 'Barlow Condensed', system-ui;
font-weight: 700-800;
letter-spacing: 2px;
text-transform: uppercase;

/* Body Text, UI Labels */
font-family: 'Inter', system-ui;
font-weight: 400-600;
```

### Text Styles

```css
/* Brand Title */
.brand {
  font-family: 'Barlow Condensed';
  font-size: 25px;
  font-weight: 800;
  letter-spacing: 2px;
  color: #eaffff;
  text-shadow: 0 0 12px #6cecff;
}

/* Large Stat (Timer, Gold) */
.stat-large {
  font: 800 31px 'Barlow Condensed';
  letter-spacing: 2px;
  text-shadow: 0 0 8px currentColor;
}

/* Small Label */
.label-small {
  font: 600 11px 'Inter';
  text-transform: uppercase;
  letter-spacing: 2px;
}

/* Income/Positive */
.income {
  color: #9dff68;
  text-shadow: 0 0 7px #52ff44;
}

/* Gold */
.gold {
  color: #fff06a;
  text-shadow: 0 0 10px #ffad32;
}
```

---

## UI Components

### 1. Top Bar (HUD)

**Layout:**
```
[Player 1 HP] [Base Info]     [Timer/Wave]     [Base Info] [Player 2 HP]
```

**Implementation:**
```css
.topbar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 28px;
  height: 68px;
  background: linear-gradient(180deg, rgba(4,18,27,.98), rgba(4,18,27,.82));
  border-bottom: 1px solid #1e5263;
  box-shadow: 0 8px 30px #0008;
  z-index: 10;
}
```

**Visual Features:**
- Translucent dark background (doesn't fully block game view)
- Glowing cyan/magenta accents
- HP bars with skewed geometry (`transform: skewX(-18deg)`)
- Centered timer with neon glow

---

### 2. Bottom Panel (Build Menu)

**Layout:**
```
[Resource Cards] [Lane Selector] [Unit Cards]
```

**Implementation:**
```css
.bottom {
  display: grid;
  grid-template-columns: 240px 1fr 240px;
  gap: 18px;
  padding: 22px;
  background: linear-gradient(180deg, rgba(3,3,16,.98), rgba(8,3,24,.94));
  border-top: 1px solid #463078;
  box-shadow: 0 0 28px #661dff44;
  z-index: 10;
}
```

**Visual Features:**
- Semi-transparent background (game visible beneath)
- Card-based layout for units/buildings
- Hover effects with neon glow
- Selected state with inner glow

---

### 3. Cards (Units/Buildings)

**Card Component:**
```css
.card {
  background: linear-gradient(145deg, #0b071d, #05030e);
  border: 1px solid #3c2860;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.card:hover:not(:disabled) {
  box-shadow: 
    0 0 12px var(--color),
    inset 0 0 24px color-mix(in srgb, var(--color) 14%, transparent);
  border-color: var(--color);
  transform: translateY(-2px);
}

.card.selected {
  border-color: var(--color);
  box-shadow: 
    0 0 20px var(--color),
    inset 0 0 30px color-mix(in srgb, var(--color) 20%, transparent);
}

.card:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(0.6);
}
```

**Card Variants:**
```css
/* Scout (Cyan) */
.card.scout { --color: #4fcbe9; }

/* Soldier (Green) */
.card.soldier { --color: #8eff63; }

/* Heavy (Orange) */
.card.heavy { --color: #ffad32; }

/* Medic (Pink) */
.card.medic { --color: #ff4fff; }
```

**Visual Features:**
- Gradient backgrounds (dark purple/blue)
- Team color accents (cyan for player, magenta for enemy)
- Glow on hover/select using `box-shadow` + `text-shadow`
- Skewed borders for geometric look

---

### 4. Buttons

**Primary Button:**
```css
.btn-primary {
  background: #8eff63;
  border: 1px solid #8eff63;
  box-shadow: 0 0 15px #5cff41;
  color: #010108;
  padding: 12px 24px;
  font: 700 14px 'Barlow Condensed';
  text-transform: uppercase;
  letter-spacing: 2px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  box-shadow: 0 0 25px #5cff41;
  transform: translateY(-2px);
}

.btn-primary:active {
  transform: translateY(0);
}
```

**Secondary Button:**
```css
.btn-secondary {
  background: transparent;
  border: 1px solid #4fcbe9;
  color: #4fcbe9;
  box-shadow: inset 0 0 10px #4fcbe944;
  /* ... rest same as primary */
}

.btn-secondary:hover {
  background: #4fcbe922;
  box-shadow: 0 0 20px #4fcbe9;
}
```

---

### 5. HP Bars

**Skewed Geometric HP Bar:**
```css
.hpbar {
  width: 310px;
  height: 11px;
  background: #102632;
  transform: skewX(-18deg);
  overflow: hidden;
  border: 1px solid #315363;
}

.hpfill {
  height: 100%;
  background: linear-gradient(90deg, #32bcdc, #70e6f7);
  transition: width 0.25s ease-out;
}

/* Enemy HP (Red) */
.enemy .hpfill {
  margin-left: auto;
  background: linear-gradient(90deg, #fb6c54, #ff9b67);
}
```

**Features:**
- Skewed geometry (`skewX`) for dynamic look
- Gradient fill (cyan for player, red for enemy)
- Smooth transition on HP change
- Dark border with slight glow

---

### 6. Panels/Modals

**Panel Component:**
```css
.panel {
  background: linear-gradient(145deg, #100629, #03020c);
  border: 1px solid #994dff;
  box-shadow: 
    0 0 60px #6b24ff55,
    0 30px 80px #000;
  border-radius: 12px;
  padding: 32px;
  max-width: 600px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
}

.panel-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  z-index: 99;
}
```

**Use Cases:**
- Main menu
- Settings
- Victory/defeat screen
- Planet building menu

---

### 7. Room Code Display

**Small Info Chip:**
```css
.room-chip {
  position: absolute;
  top: 15px;
  left: 50%;
  translate: -50%;
  background: #080317e8;
  border: 1px solid #9b4dff;
  color: #d5b8ff;
  box-shadow: 0 0 15px #9b4dff55;
  padding: 7px 14px;
  border-radius: 3px;
  font: 600 11px 'Inter';
  letter-spacing: 2px;
  backdrop-filter: blur(4px);
}
```

---

### 8. Lane/Row Selector

**Row Button:**
```css
.rowbtn {
  background: linear-gradient(90deg, #09051d, #03020c);
  border: 1px solid #3c2860;
  padding: 16px;
  cursor: pointer;
  transition: all 0.15s;
}

.rowbtn:hover {
  border-color: #c65cff;
  background: linear-gradient(90deg, #21103b, #08051c);
  box-shadow: inset 3px 0 #cc5cff, 0 0 10px #8d34ff55;
}

.rowbtn.active {
  border-color: #c65cff;
  box-shadow: inset 3px 0 #cc5cff, 0 0 15px #8d34ff;
}
```

**Visual Features:**
- Vertical accent bar on active/hover (left side glow)
- Gradient background shift
- Clear active state

---

## Glow Effects

### Text Glow

```css
/* Cyan Glow */
.glow-cyan {
  color: #67ddf7;
  text-shadow: 0 0 12px #6cecff;
}

/* Magenta Glow */
.glow-magenta {
  color: #d5b8ff;
  text-shadow: 0 0 12px #9b4dff;
}

/* Green Glow */
.glow-green {
  color: #8eff63;
  text-shadow: 0 0 12px #5cff41;
}

/* Multi-layer Glow (Intense) */
.glow-intense {
  text-shadow: 
    0 0 8px currentColor,
    0 0 20px currentColor,
    0 0 40px currentColor;
}
```

### Box Glow

```css
/* Soft Outer Glow */
.box-glow-soft {
  box-shadow: 0 0 20px color-mix(in srgb, var(--color) 40%, transparent);
}

/* Intense Outer Glow */
.box-glow-intense {
  box-shadow: 
    0 0 20px var(--color),
    0 0 40px color-mix(in srgb, var(--color) 60%, transparent);
}

/* Inner Glow (Selected) */
.box-glow-inner {
  box-shadow: inset 0 0 30px color-mix(in srgb, var(--color) 20%, transparent);
}

/* Combined (Selected + Outer) */
.box-glow-combined {
  box-shadow: 
    0 0 20px var(--color),
    inset 0 0 30px color-mix(in srgb, var(--color) 15%, transparent);
}
```

---

## Geometric Shapes

### Hexagon Clip Path

```css
.hex {
  clip-path: polygon(
    50% 0,
    95% 25%,
    82% 78%,
    50% 100%,
    18% 78%,
    5% 25%
  );
}

/* Brand mark example */
.brand-mark {
  width: 33px;
  height: 33px;
  border: 1px solid #4fcbe9;
  clip-path: polygon(50% 0, 95% 25%, 82% 78%, 50% 100%, 18% 78%, 5% 25%);
  color: #67ddf7;
  filter: drop-shadow(0 0 8px #62ff42);
}
```

### Skewed Elements

```css
/* Skewed container */
.skew-container {
  transform: skewX(-18deg);
}

/* Unskew content inside */
.skew-container > * {
  transform: skewX(18deg);
}
```

---

## Animations

### Pulse Glow (Attention)

```css
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 15px var(--color);
  }
  50% {
    box-shadow: 0 0 35px var(--color);
  }
}

.pulse {
  animation: pulse-glow 2s ease-in-out infinite;
}
```

### Fade In (Menus)

```css
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fade-in 0.3s ease-out;
}
```

### Shimmer (New Units)

```css
@keyframes shimmer {
  0% {
    background-position: -100% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.shimmer {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s linear infinite;
}
```

---

## Responsive Design

### Breakpoints

```css
/* Large Desktop */
@media (min-width: 1920px) {
  .topbar { padding: 0 60px; }
  .bottom { padding: 32px; }
}

/* Standard Desktop (1366px - 1920px) */
/* Default styles target this */

/* Small Desktop / Large Tablet (1024px - 1366px) */
@media (max-width: 1366px) {
  .hpbar { width: min(20vw, 260px); }
  .bottom { grid-template-columns: 200px 1fr 200px; }
}

/* Tablet (768px - 1024px) */
@media (max-width: 1024px) {
  .topbar { grid-template-columns: 1fr; justify-items: center; }
  .bottom { grid-template-columns: 1fr; }
  .brand { font-size: 20px; }
}

/* Mobile (< 768px) */
/* Note: Game is primarily desktop-focused */
@media (max-width: 768px) {
  .shell { grid-template-rows: auto 1fr auto; }
  .topbar { padding: 12px; height: auto; }
  .bottom { padding: 12px; gap: 12px; }
}
```

---

## UI States

### Disabled State

```css
.disabled, [disabled] {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(0.6);
  pointer-events: none;
}
```

### Loading State

```css
.loading {
  position: relative;
  pointer-events: none;
  opacity: 0.7;
}

.loading::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(79, 203, 233, 0.2),
    transparent
  );
  animation: shimmer 1.5s linear infinite;
}
```

### Error State

```css
.error {
  border-color: #ff4444;
  box-shadow: 0 0 15px #ff444455;
}

.error-text {
  color: #ff6666;
  text-shadow: 0 0 8px #ff4444;
}
```

---

## Performance Optimization

### CSS Best Practices

1. **Use CSS Custom Properties for theme colors:**
   ```css
   :root {
     --color-primary: #4fcbe9;
     --color-accent: #c65cff;
   }
   ```

2. **Hardware-accelerated properties:**
   ```css
   /* Good (GPU-accelerated) */
   transform: translateX(10px);
   opacity: 0.5;
   
   /* Avoid (CPU layout) */
   left: 10px;
   display: none;
   ```

3. **Use `will-change` for animations:**
   ```css
   .animated {
     will-change: transform, opacity;
   }
   ```

4. **Minimize repaints:**
   ```css
   /* Batch transform changes */
   transform: translateX(10px) scale(1.1) rotate(5deg);
   ```

5. **Use `contain` for isolated elements:**
   ```css
   .card {
     contain: layout style paint;
   }
   ```

---

## Integration with PixiJS

### Canvas Container

```html
<div class="shell">
  <!-- Top HUD -->
  <div class="topbar"><!-- ... --></div>
  
  <!-- Game Canvas (PixiJS) -->
  <div class="arena">
    <canvas id="pixi-canvas"></canvas>
    
    <!-- Overlays (clickable UI on top of canvas) -->
    <div class="arena-overlay">
      <div class="room-chip">ROOM: AB12CD</div>
    </div>
  </div>
  
  <!-- Bottom Build Menu -->
  <div class="bottom"><!-- ... --></div>
</div>
```

### CSS for Canvas Container

```css
.arena {
  position: relative;
  min-height: 0; /* Allow grid to shrink */
  overflow: hidden;
}

.arena canvas {
  display: block;
  width: 100%;
  height: 100%;
  /* PixiJS automatically resizes canvas */
}

.arena-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none; /* Pass clicks through to canvas */
}

/* Make specific overlay elements clickable */
.arena-overlay .clickable {
  pointer-events: auto;
}
```

### JavaScript Integration

```typescript
// Initialize PixiJS
const app = new PIXI.Application({
  view: document.getElementById('pixi-canvas') as HTMLCanvasElement,
  resizeTo: document.querySelector('.arena') as HTMLElement,
  backgroundColor: 0x010108,
  antialias: true
});

// Update UI from game state
function updateUI(gameState) {
  // Update gold display
  document.querySelector('.gold-value').textContent = gameState.gold;
  
  // Update HP bar
  const hpBar = document.querySelector('.hpfill');
  hpBar.style.width = `${(gameState.hp / gameState.maxHp) * 100}%`;
  
  // Update timer
  document.querySelector('.timer').textContent = formatTime(gameState.time);
}

// Handle UI clicks
document.querySelector('.card.scout').addEventListener('click', () => {
  // Send command to game
  gameState.queueUnit('scout');
});
```

---

## Accessibility

### High Contrast

```css
/* Already high contrast by default (neon on dark) */
/* Additional contrast for accessibility mode: */
body.high-contrast {
  --color-cyan: #5ff0ff;
  --color-green: #a0ff80;
  --color-gold: #ffff80;
}
```

### Focus States

```css
button:focus-visible,
.card:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  box-shadow: 0 0 20px var(--color-primary);
}
```

### Screen Reader Support

```html
<!-- Example accessible card -->
<button class="card scout" aria-label="Build Scout Fighter - Cost: 10 Gold, 1 Manpower">
  <div class="card-icon" aria-hidden="true">🚀</div>
  <div class="card-name">Scout</div>
  <div class="card-cost">
    <span class="gold">10</span>
    <span class="manpower">1</span>
  </div>
</button>
```

---

## File Structure

```
frontend/src/
├── styles/
│   ├── base.css           # Reset, root variables, body
│   ├── colors.css         # Color palette, themes
│   ├── typography.css     # Font imports, text styles
│   ├── components/
│   │   ├── buttons.css    # Button styles
│   │   ├── cards.css      # Unit/building cards
│   │   ├── panels.css     # Modals, panels
│   │   ├── hud.css        # Top bar, bottom bar
│   │   └── bars.css       # HP bars, progress bars
│   ├── animations.css     # Keyframes, transitions
│   ├── utilities.css      # Helper classes (glow, skew, etc.)
│   └── main.css           # Import all (single entry point)
```

**Import Order (main.css):**
```css
@import './base.css';
@import './colors.css';
@import './typography.css';
@import './components/buttons.css';
@import './components/cards.css';
@import './components/panels.css';
@import './components/hud.css';
@import './components/bars.css';
@import './animations.css';
@import './utilities.css';
```

---

## CSS Framework: None (Vanilla CSS Only)

**Why No Framework?**
- ✅ **Performance:** No overhead, minimal bundle size (~10-15KB minified)
- ✅ **Custom Design:** Unique neon/Geometry Wars aesthetic
- ✅ **Simplicity:** No build step, no learning curve
- ✅ **Control:** Full control over every pixel
- ✅ **Modern CSS:** Grid, Flexbox, Custom Properties are sufficient

**What We're NOT Using:**
- ❌ Tailwind CSS (too generic, large bundle)
- ❌ Bootstrap (not suited for game UI)
- ❌ Material UI (wrong aesthetic)
- ❌ Styled Components (unnecessary complexity)

---

## Future Enhancements (Phase 2+)

### CSS Variables for Themes

```css
/* Player 1 Theme (Cyan) */
body[data-player="1"] {
  --color-player: #4fcbe9;
  --color-enemy: #c65cff;
}

/* Player 2 Theme (Magenta) */
body[data-player="2"] {
  --color-player: #c65cff;
  --color-enemy: #4fcbe9;
}
```

### CSS Houdini (Paint API)

```css
/* Custom neon border effect */
.card {
  border-image: paint(neon-border);
}
```

### Container Queries (Future)

```css
/* Responsive cards based on container size */
@container (min-width: 200px) {
  .card { grid-template-columns: auto 1fr; }
}
```

---

## Summary

**UI Tech Stack:**
- **CSS:** Vanilla CSS (no framework)
- **Aesthetic:** Neon cyberpunk, Geometry Wars-inspired
- **Integration:** HTML/CSS overlays on PixiJS canvas
- **Performance:** Hardware-accelerated, minimal repaints
- **Accessibility:** High contrast, keyboard navigation, ARIA labels

**Key Features:**
- Glowing neon elements (cyan, magenta, green)
- Geometric shapes (hexagons, skewed elements)
- Dark space backgrounds with gradient overlays
- Smooth animations and transitions
- Responsive design (desktop-first)
- Clear visual hierarchy

This UI system provides a distinctive, performant interface that complements the 2D PixiJS game rendering without sacrificing performance or flexibility.

---

**End of Document**

*This design system maintains the neon aesthetic while ensuring performance and accessibility. All styles are optimized for overlay rendering on top of the PixiJS canvas.*
