---
name: Professional Ledger System
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#434655'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#4d556b'
  on-tertiary: '#ffffff'
  tertiary-container: '#656d84'
  on-tertiary-container: '#eef0ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-padding: 24px
  gutter: 16px
  section-gap: 48px
  table-cell-py: 12px
  table-cell-px: 16px
---

## Brand & Style

The design system is engineered for financial clarity, efficiency, and unwavering reliability. Target users are small-to-medium business owners and freelance professionals who require a high-velocity tool for managing quotes and invoices. The emotional response is one of "organized calm"—a sense that complex financial data is structured, secure, and under control.

The aesthetic follows a **Corporate Modern** approach with **Minimalist** sensibilities. It prioritizes utility and legibility over decorative flair. Key characteristics include:
- **High Information Density with Clarity:** Optimizing screen real estate for data tables without sacrificing whitespace.
- **Utilitarian Precision:** Every border, shadow, and alignment serves to group related information or guide the user's focus toward actions (like "Send" or "Approve").
- **Trust-Oriented Cues:** Using a stable, blue-centric palette and crisp, geometric layouts to reinforce the professional nature of the application.

## Colors

The palette is anchored by a high-contrast combination of **Royal Blue** and **Slate Grays**.

- **Primary (#2563EB):** A vivid, professional blue used for primary actions, progress indicators, and active states. It suggests confidence and digital-first efficiency.
- **Secondary (#64748B):** A neutral slate used for secondary text, icons, and non-interactive UI elements to prevent visual fatigue.
- **Tertiary/Ink (#0F172A):** A near-black slate used for maximum contrast in typography and headings, ensuring critical financial figures are unmistakable.
- **Surface & Backgrounds:** The system utilizes a tiered gray scale (ranging from #F8FAFC to #E2E8F0) to create clear separation between the navigation sidebar, the workspace, and the actual document canvas.
- **Functional Colors:** High-contrast Green (#16A34A) for "Paid/Approved" and Red (#DC2626) for "Overdue/Declined" status indicators.

## Typography

The design system utilizes **Inter** for its exceptional legibility in digital interfaces and technical neutrality. 

- **Numerical Data:** For invoice amounts, tax rates, and line items, use **JetBrains Mono** selectively to ensure tabular figures align perfectly, aiding in quick scanning of vertical columns.
- **Headlines:** Use tight letter-spacing on larger sizes to maintain a modern SaaS aesthetic.
- **Label Caps:** Use for table headers and small metadata sections (e.g., "INVOICE DATE") in all-caps with increased letter-spacing to distinguish from content.
- **Hierarchy:** Maintain a clear distinction between the "Document Title" (Invoice #) and the "Entity Information" (Client/Sender) through weight and color (Tertiary vs Secondary).

## Layout & Spacing

This design system uses a **12-column fluid grid** for the main workspace, but the invoice document itself is treated as a **Fixed Width (800px)** "paper" component centered within the workspace.

- **The Sidebar:** A fixed 260px navigation rail on the left.
- **The Workspace:** A light gray background (#F1F5F9) that provides high contrast against the white "Invoice Canvas."
- **Whitespace:** Generous padding (24px - 32px) is used within the invoice document to ensure it feels professional and "breathes," even when heavily populated with line items.
- **Rhythm:** An 8px base unit drives all spacing. For data tables, use a compact 12px vertical padding to maintain high information density while ensuring click targets for editing are accessible.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and extremely subtle **Ambient Shadows**.

- **Level 0 (Background):** The application shell is flat, using subtle color shifts to define areas.
- **Level 1 (Cards/Work Area):** The main invoice document uses a very soft shadow (0px 1px 3px rgba(0,0,0,0.1)) to appear slightly lifted from the background, suggesting it is a physical object being worked on.
- **Level 2 (Popovers/Dropdowns):** Used for date pickers and item selection menus. These use a more defined shadow (0px 10px 15px -3px rgba(0,0,0,0.1)) to clearly separate the utility from the document.
- **Overlays:** Modals for "Finalize Invoice" use a semi-transparent backdrop blur (8px) to focus the user on the high-stakes final action.

## Shapes

The shape language is defined by a consistent **8px (0.5rem)** radius. This specific rounding provides a modern, approachable feel without appearing too "playful" or consumer-oriented.

- **Primary Buttons & Inputs:** Use the standard 8px radius.
- **Status Badges (Chips):** Use a 100px radius (pill-shaped) to distinguish them as static informational elements rather than interactive buttons.
- **The Invoice Document:** The corners of the "paper" canvas should remain sharp or have a very minimal 4px radius to maintain a formal, professional appearance.

## Components

### Buttons
- **Primary:** Solid Blue background, White text. High-contrast, 8px radius.
- **Secondary:** White background, Slate 200 border, Slate 700 text.
- **Ghost:** No background or border, Blue text. Used for "Add Line Item" to minimize visual noise.

### Input Fields
- Labels are always positioned above the input in `body-sm` bold.
- Active state uses a 2px Blue border with a soft blue glow (outline).
- Default state uses a Slate 200 border.

### Data Tables
- Row hover states use a very light blue tint (#EFF6FF).
- "Amount" columns are always right-aligned and use the monospaced font role.
- Border-bottom (Slate 100) only between rows; no vertical borders.

### Cards & Invoices
- The invoice "header" uses a split layout: Logo/Company info on the left, Invoice Metadata (Number, Date, Due Date) on the right.
- Total amounts are highlighted in a prominent blue "Summary Box" at the bottom right of the table.

### Status Chips
- Use low-saturation background tints with high-saturation text (e.g., Light Green bg with Dark Green text) for "Paid" or "Pending."