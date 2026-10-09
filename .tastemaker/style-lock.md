# Style lock — Marakhovskiy portfolio

Established: 2026-09-27. Source: Figma reference node 13:18 supplied by the user.

## Palette
- Background: #050505 (page background)
- Surface: #0b0d0b (raised dark panels)
- Primary: #f4f3ee (primary button fill and bright text)
- Accent: #72c98b (project highlight and focus state)
- Text primary: #f4f3ee, contrast vs background 18.34:1 (WCAG AA pass)
- Text muted: #b9b8b2
- Button label: #050505, contrast vs Primary 18.34:1 (WCAG AA pass)
- Border: #3b3d39, decorative against background
- Dark mode: single dark mode only

## Color contract
- Text-safe: text/bg, text/on-primary, bg/primary, primary/on-primary, text/surface, surface/primary, bg/accent, accent/on-primary, text/border, primary/border, surface/accent, accent/border
- UI-safe: none
- Decorative only: bg/border, border/on-primary, text/accent, primary/accent, surface/border, bg/surface, surface/on-primary, text/primary, bg/on-primary

## Typography
- Hero display: Inter Tight 900, uppercase and upright, with near-neutral tracking (-0.01em desktop, 0 on mobile) so Cyrillic characters remain clearly separated
- Editorial headings and wordmark: Playfair Display, retained outside the hero to preserve the supplied Figma direction
- Body and UI: Nunito Sans, matching the rounded sans-serif used in the supplied Figma frame
- Base: 16px. Hero display uses fluid clamps with a 1.0 line-height floor; editorial display keeps a 1.02 floor.

## Shape language
- Corner radius: 20px for showcase panels, 999px for small actions and interest tags
- Shadow depth: flat, no drop shadows
- Border usage: 1px hairlines for rhythm and grouping

## Density & spacing
- Base unit: 4px
- Section padding: connective 96px, standard 128px, pivotal 160 to 192px
- Content card internal padding: 32px
- Showcase internal padding: 24px
- Overall density: generous editorial whitespace
- Section separation: consistent decorative hairline divider

## Structure
- Macrostructure: Editorial Index
- Narrative arc: hook H2, work/proof F6, capability index, proof P2, personal context, FAQ, close C2
- Shared chrome: N4 editorial masthead and Ft2 inline footer
- Body archetypes: H2 oversized split-title typographic hero, F6 project ledger with focused visual, P2 pull quotes, C2 statement close
- Personal context: three asymmetrically placed text islands with seven white pill badges floating between them on wide screens; stacked reading order with a two-column badge cloud on mobile
- Build stamp and `.tastemaker/log.json` record this implementation.

## Taste memory
- Profile priors used: none
- Decision log: `.tastemaker/decisions.log`
- Last resolved decisions: the portfolio Time Machine uses 20px medium project labels, a left-shifted card stack, and cursor texture scoped tightly to each label-and-mark control (2026-10-09)
- Pending review: none
- Profile promotion: none

## Mood descriptors
Quiet, cosmic, editorial, assured.

## Assets
- Anchor asset: supplied Figma node 13:18
- Asset style: code-native interface geometry, one green product panel, star-field texture, and SVG career marks matching the individual vector groups in the supplied frame
- Motion runtime: vendored GSAP 3.12.5 and ScrollTrigger 3.12.5, so the scroll story does not depend on CDN availability
- Illustration versus photography: no photography in this first homepage pass
- Logo: typographic wordmark from the supplied design; favicon uses a simple M motif

## Motion
- Feel: quick, fluid, and restrained; inspired by Fluid Functionalism without copying its visual identity
- Curves: ease-out cubic-bezier(0.23, 1, 0.32, 1), cinematic cubic-bezier(0.77, 0, 0.175, 1)
- Durations: fast 80ms / 60ms exit, moderate 160ms / 120ms exit, slow 240ms / 160ms exit; cursor-to-target morph uses 240ms in and 280ms out with an interruptible ease-in-out crossfade
- Entrance: small interface reveals use an 18px rise over 240ms; major marketing blocks use explicit 480ms scroll scenes with 60 to 80ms staging
- Screen track: hero intro, title characters, lede, actions and metadata strip enter in five restrained beats; portfolio heading, rows and visual enter in sequence; the capability tape wipes open; quote cards rise; personal notes approach from three directions before badges pop in; the contact statement unfolds in three beats; one white Spider Cursor entity follows the pointer directly across the entire page; the career rail draws once as it enters the viewport
- Career behavior: one full-bleed horizontal rail connects five logo tabs with centered milestone dots; its filled segment ends at the active logo and controls one shared photo, year-only date, and project-description panel; the chosen logo keeps a contour-following light state after hover ends; content moves directionally for 240ms on click or keyboard navigation and reflows into a compact two-column detail row on narrow screens
- Portfolio behavior: five project previews share one full-width Amicro-inspired Time Machine depth stack; the large stack is optically shifted left, previous cards travel forward and down, and upcoming cards recede in perspective; five adjacent primary stops use 20px/500 project names and switch by hover, click, focus, or arrow keys; cursor texture hugs only each name-and-mark capsule, not the full grid row
- Frequency: one shared highlight glides between adjacent project rows while the single preview updates; the star field changes composition with page scroll and adds low-amplitude drift plus restrained twinkle to free stars; particles connected to the cursor remain stable; the cursor entity has no autonomous drift and smoothly dissolves into a bright white organic perimeter around links, buttons, project rows, quote cards, or interest badges; career tabs retain a generous hit area while their cursor perimeter hugs only the visible logo; every perimeter inherits its target's actual corner geometry
- Reduced motion: the global Spider Cursor is removed and the hero keeps its static star field; no parallax or sliding highlight; marquee paused; opacity and color feedback remain short
- Verified by: scripted motion, coherence, and anti-slop audits plus desktop and 390px browser QA on 2026-09-28

## Do not
- No generic purple or cyan gradients
- No card grid of generic feature blurbs
- No emoji icons
- No heavy shadows or dashboard chrome
- No invented metrics; career logo treatments must stay grounded in the supplied Figma frame
- Do not collapse the personal-context composition into three generic cards; preserve the Figma-like text islands and scattered badges
- Do not return the hero title to italic type; its current role is direct, oversized and typographic
- Do not add decorative eyes to the hero or tighten the Cyrillic title until letterforms touch
