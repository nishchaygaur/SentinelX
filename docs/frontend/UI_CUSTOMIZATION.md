# SentinelX — UI Customization & Styling Tokens

## 1. Design System & CSS Variables

SentinelX utilizes a dark-mode, high-contrast cybersecurity operations color palette defined in `frontend/src/App.css`:

```css
:root {
  --bg-primary: #0a0d14;
  --bg-secondary: #0f141f;
  --bg-card: #141b29;
  --border-color: #1e293b;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  
  --color-critical: #ef4444;
  --color-high: #f97316;
  --color-medium: #eab308;
  --color-low: #3b82f6;
  --color-success: #10b981;
  --color-accent: #6366f1;
}
```

---

## 2. Responsive Breakpoints

- **Desktop (>= 1200px)**: Full multi-column dashboard grid, persistent sidebars.
- **Tablet (768px – 1199px)**: Compact sidebar, stacked widgets.
- **Mobile (< 768px)**: Collapsible navigation drawer, single-column data flow.
