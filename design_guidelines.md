# Design Guidelines: Discord Message Archive Dashboard

## Design Approach
**System-Based Approach**: Material Design with Discord aesthetic influences
- Clean, data-focused interface prioritizing readability and efficient information scanning
- Card-based message layout with clear visual hierarchy
- Modern dashboard patterns with sidebar navigation
- Inspired by: Discord, Linear, Notion (functional beauty)

## Typography
- **Primary Font**: Inter (Google Fonts) - excellent for UI and data display
- **Monospace Font**: JetBrains Mono - for timestamps and metadata
- **Hierarchy**:
  - Page titles: text-2xl font-bold
  - Section headers: text-lg font-semibold
  - Message content: text-base font-normal
  - Metadata (timestamps, channels): text-sm font-medium
  - Labels/tags: text-xs font-medium uppercase tracking-wide

## Layout System
**Spacing Units**: Use Tailwind units of 2, 4, 6, and 8 for consistent rhythm
- Component padding: p-4 or p-6
- Section spacing: gap-4 or gap-6
- Page margins: p-6 or p-8
- Card spacing: space-y-4

**Grid Structure**:
- Sidebar: Fixed 64 width (w-64) on desktop, collapsible on mobile
- Main content: Flexible width with max-w-6xl container
- Message cards: Full width stacked layout (no multi-column for readability)
- Filter bar: Sticky top position with backdrop blur

## Core Components

### Navigation Sidebar
- Logo/branding at top
- Navigation items: Dashboard, Messages, Settings, Weekly Backups
- Stats widget: Total messages, channels tracked, last sync time
- User profile section at bottom
- Active state: Left border accent with subtle background

### Message Cards
Each message displayed as an individual card:
- Channel badge (pill shape with channel icon)
- Message content with proper text wrapping
- Timestamp in monospace font
- Attachment indicators if present
- Subtle hover elevation effect
- Border-left accent matching channel category

### Filter & Search Bar
Sticky header component:
- Search input with search icon (left-aligned)
- Filter dropdowns: Date range, Channel, Content type
- Sort options: Newest/Oldest first
- Clear filters button
- Results count display

### Weekly Backup Section
Dedicated page showing:
- Calendar view of backup schedule
- List of past backups with download links
- Backup size and message count
- Manual backup trigger button
- Next scheduled backup countdown

### Stats Dashboard
Overview cards in 3-column grid (desktop):
- Total messages captured
- Most active channels
- Messages this week
- Storage used
Each stat card includes icon, number (large), and label

## Visual Treatments
- **Cards**: Subtle border with rounded-lg corners, p-6 padding
- **Elevation**: Use shadow-sm for cards, shadow-md for modals
- **Interactive elements**: Subtle scale on hover (hover:scale-[1.02])
- **Focus states**: Ring-2 with offset for accessibility
- **Loading states**: Skeleton screens matching card structure
- **Empty states**: Centered icon, heading, description with helpful CTA

## Animations
Minimal, purposeful animations only:
- Fade-in for message cards when loading (duration-200)
- Slide transitions for sidebar toggle
- Smooth scroll behavior for navigation jumps
- No scroll-triggered animations

## Data Density & Organization
- **Default view**: 20 messages per page with infinite scroll
- **Compact mode toggle**: Reduces card padding and font sizes for power users
- **Group by date**: Subtle date dividers between days
- **Channel categorization**: Color-coded system matching Discord server structure

## Icons
**Heroicons** (via CDN) for all interface icons:
- Navigation: home, document-text, cog, calendar
- Actions: magnifying-glass, funnel, arrow-down-tray
- Status indicators: check-circle, clock, server

## No Images Needed
This is a data-focused dashboard - no hero images or decorative imagery required. Visual interest comes from card layouts, typography hierarchy, and information design.