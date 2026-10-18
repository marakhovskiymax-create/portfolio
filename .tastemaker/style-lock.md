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
- Hero display: Inter Tight 900, uppercase and upright, with near-neutral tracking (-0.01em desktop, 0 on mobile); PRODUCT / DESIGNER runs at 125% of the former fluid type scale (144px at a 1280px viewport)
- Editorial headings and wordmark: Playfair Display, retained outside the hero to preserve the supplied Figma direction
- Body and UI: Nunito Sans, matching the rounded sans-serif used in the supplied Figma frame
- Base: 16px. Hero display uses fluid clamps with a 1.0 line-height floor; editorial display keeps a 1.02 floor.
- Main section headings on the homepage and case pages use Inter Tight 700 at 52px on desktop, with a fluid reduction only on narrow screens; the editorial Playfair treatment remains for the wordmark and other display roles.
- Testimonial quotes keep one italic Playfair size across all cards: 24px on desktop and 20px on narrow screens. Author names are Nunito Sans 16px/500; company names are 14px/400 and muted.

## Shape language
- Corner radius: 20px for showcase panels, 999px for small actions and interest tags; the interactive footer keeps only its upper corners rounded and meets the page bottom squarely
- Shadow depth: flat, no drop shadows
- Border usage: 1px hairlines for rhythm and grouping

## Density & spacing
- Base unit: 4px
- Section rhythm: 180px between the visible content of adjacent top-level blocks except for the 100px gap from the ordinary footer to the interactive footer's arrow and heading; the FAQ heading and intro are 18px apart
- Beyond Design: its map grows to the final documentary note instead of reserving a fixed empty floor, keeping the visible gap to the contact heading at 180px on desktop and mobile
- Content card internal padding: 32px
- Showcase internal padding: 24px
- Overall density: generous editorial whitespace
- Section separation: consistent decorative hairline divider

## Structure
- Macrostructure: Editorial Index
- Narrative arc: hook H2, work/proof F6, capability index, proof P2, FAQ, personal context, close C2
- Shared chrome: N4 editorial masthead and Ft2 inline footer
- Body archetypes: H2 oversized split-title typographic hero, F6 project ledger with focused visual, P2 pull quotes, C2 statement close
- Homepage hero copy: English introduction, split PRODUCT / DESIGNER headline, concise web-and-mobile positioning, View Projects and Get in Touch actions, and a three-position metadata strip with PORTFOLIO '26 left, UX · UI · RESEARCH · DESIGN SYSTEMS centered, and a non-interactive SCROLL cue right
- Personal context: three asymmetrically placed text islands with seven white pill badges floating between them on wide screens; stacked reading order with a two-column badge cloud on mobile
- Testimonials: eight approved English quotes in the existing two-row marquee, four distinct cards per row plus hidden duplicate groups for seamless looping. Cards are 320–620px wide and stretch to one height within each row; quote text and author names are 20px, while company labels remain 14px. The author/company stack stays bottom-left and its company logo stays bottom-right. Company logos other than Geleos use a 40px-high box with original proportions preserved and a responsive width cap; the existing Geleos sphere mark remains 46px on desktop and 38px on mobile. Hovering any card pauses only its own row and brightens the card border while the organic cursor traces that card. If a verified logo is missing, use a restrained text placeholder rather than a fabricated mark.
- Build stamp and `.tastemaker/log.json` record this implementation.
- Case studies: an eight-section editorial narrative with a full-shell hero before the persistent contents rail, a manual interface carousel, a split context accordion styled like the site's FAQ with separated dark answer cards, an interactive work-area canvas, concise image-led product stories, and a verified impact close. The contents rail begins with the first narrative section rather than competing with the hero. Hero metadata uses four left-aligned columns: Name, Role, Product with Scope in parentheses, and Period; values use the stronger 17px/600 treatment. The homepage card and its matching project stop are equal entry points into the case.

## Taste memory
- Profile priors used: none
- Decision log: `.tastemaker/decisions.log`
- Last resolved decisions: career panel switches crossfade through opacity only, without directional content movement (2026-10-18); How I Work precedes Beyond Design with an 18px title-to-intro gap and 180px between adjacent sections (2026-10-18); Beyond Design has no artificial bottom height before contact (2026-10-18); homepage hero copy and metadata are in English, PRODUCT / DESIGNER is 25% larger, the discipline line is centered, and SCROLL is static at bottom-right (2026-10-18); the interactive footer restores its blue gradient across the full viewport width through the page bottom while keeping square corners, a 100px title gap after the ordinary footer, and a 30% taller play area (2026-10-18); testimonial cards and their company logos are wider/larger while keeping the two-row carousel (2026-10-18); the Geleos text placeholder is replaced by the mark already used in the career timeline, three wordmarks are optically balanced, and first-name copy reads Maxim (2026-10-18)
- Pending review: none for the approved eight testimonials; the user confirmed author approval on 2026-10-18
- Profile promotion: none

## Mood descriptors
Quiet, cosmic, editorial, assured.

## Assets
- Anchor asset: supplied Figma node 13:18
- Asset style: code-native interface geometry, one green product panel, star-field texture, and SVG career marks matching the individual vector groups in the supplied frame
- Motion runtime: vendored GSAP 3.12.5 and ScrollTrigger 3.12.5, so the scroll story does not depend on CDN availability
- Illustration versus photography: no photography in this first homepage pass
- Logo: typographic wordmark from the supplied design; favicon uses a simple M motif
- amoCRM case assets: use only the three product images extracted from the supplied blueprint; unsupported product areas are represented with clearly diagrammatic, code-native flows rather than invented screenshots
- Testimonial logos: EME, Match TV, Don Ballon, amoCRM, and the Geleos sphere mark use existing project vectors; Make Difference, AYO, and L'Occitane use the user's supplied logo files. The user confirmed that `logo.svg` is AYO.

## Motion
- Feel: quick, fluid, and restrained; inspired by Fluid Functionalism without copying its visual identity
- Curves: ease-out cubic-bezier(0.23, 1, 0.32, 1), cinematic cubic-bezier(0.77, 0, 0.175, 1)
- Durations: fast 80ms / 60ms exit, moderate 160ms / 120ms exit, slow 240ms / 160ms exit; cursor-to-target morph uses 240ms in and 280ms out with an interruptible ease-in-out crossfade
- Entrance: small interface reveals use an 18px rise over 240ms; major marketing blocks use explicit 480ms scroll scenes with 60 to 80ms staging
- Screen track: hero intro, title characters, lede, actions and metadata strip enter in five restrained beats; all main section headings on the homepage and case pages use the same 3D character reveal; portfolio rows and visual enter in sequence after their title; the capability tape wipes open; quote cards rise; personal notes approach from three directions, then each interest tab independently runs the Amicro shape-to-final spring sequence with a 130ms stagger as soon as the section touches the viewport; FAQ rows enter sequentially, contact cards/globe/form details reveal in stages, and the career rail, milestones, and active panel enter in sequence; one white Spider Cursor entity follows the pointer directly across the entire page
- Career behavior: one full-bleed horizontal rail connects five logo tabs with centered milestone dots; the two-line career statement aligns to the left edge of the shared shell, and year ranges keep a 4px gap on each side of the separator; the filled rail segment ends at the active logo and controls one shared photo, year-only date, and project-description panel; the chosen logo keeps a contour-following light state after hover ends; on click or keyboard navigation the media, year, and copy crossfade together through opacity over 240ms with no directional slide or child stagger, and reflow into a compact two-column detail row on narrow screens
- Portfolio behavior: six project previews share one full-width Amicro-inspired Time Machine depth stack with 80px left, 90px right, and 50px top and bottom internal inset on desktop; amoCRM is the first and initially selected project; the large stack is optically shifted left and slightly lowered to preserve room for the visible rear layers; previous cards travel forward and down, while upcoming cards rise in 42px steps, shrink progressively, recede by 60px in perspective and fade in 15% steps so two to three upper edges remain visibly separated as a volumetric stack; six adjacent primary stops use 20px/500 project names with a state-invariant 10px name-to-mark gap; marks scale from their left edge and their compact target reserves the complete 1.4× growth width, keeping the full line inside the organic cursor perimeter without expanding to the grid row; switching works by hover, click, focus, or arrow keys
- Footer playground: the blue gradient rises from the bottom of the full-width section and reaches the page edge with no rounded corners; the play area remains 30% taller than its earlier 560–760px desktop / 820px mobile sizing, and the title and arrow begin 100px after the ordinary footer. All five text skill pills share an exact 86px desktop or 62px mobile height, the same icon box, gap and horizontal inset, while tool tiles form one separate equal-size square group. Matter.js bodies provide rotation-aware collision shapes, gravity, friction, restitution, sleeping, direct pointer or touch control, and keyboard nudging; moving items use a solid blue surface rather than per-item backdrop blur, write only direct transforms without layout reads in the frame loop, and stop their physics frame loop once every body sleeps. The global organic cursor does not replace direct-manipulation feedback.
- Contact behavior: the close uses a 3:2 desktop split with the wider direct-contact panel carrying a source-faithful orthographic wireframe globe; 177 country outlines and a restrained graticule rotate only while visible, accept direct pointer or touch rotation, and become static under reduced motion; the compact message form omits company, while the heading omits the former contact badge and the globe omits location or time labels
- Link feedback: footer social links and contact methods roll only their text while their icons stay spatially fixed; interest badges use that same text-only hover roll without moving or straightening the white pill, and remain static under reduced motion; the email form's primary button stays ivory during hover rather than adopting the green accent
- Frequency: one shared highlight glides between adjacent project rows while the single preview updates; the star field changes composition with page scroll and adds low-amplitude drift plus restrained twinkle to free stars; the free cursor entity uses half its former capture radius and ray reach, without shrinking the target-sized hover perimeter; particles connected to the cursor remain stable; the cursor entity has no autonomous drift and smoothly dissolves into a bright white organic perimeter around links, buttons, project rows, quote cards, or interest badges; career tabs retain a generous hit area while their cursor perimeter hugs only the visible logo; every perimeter inherits its target's actual corner geometry
- Reduced motion: the global Spider Cursor is removed and the hero keeps its static star field; no parallax or sliding highlight; marquee paused; opacity and color feedback remain short
- Case-study behavior: the interface carousel advances smoothly every four seconds while visible, pauses for hover, focus, dragging or a hidden browser tab, restarts its four-second interval after manual use, and stays static under reduced motion; the visible counter and arrow rail are omitted, while keyboard, swipe and side-slide selection remain available. Its active interface is centered at full brightness while the previous and next interfaces remain partially visible at 80% scale and 35% brightness, then dissolve into the page through soft symmetric edge gradients instead of meeting a hard crop; the context accordion keeps one item open; the left contents rail begins at Context and follows the current section; the work-area canvas contains ten icon-free translucent-blue pills matching the footer playground's height, inset, blur and fully rounded shape, reuses its Matter.js gravity, rotation-aware collisions, pointer throwing, sleeping and keyboard nudging, omits the fixed explanation rail, and is excluded from the global organic cursor morph while retaining direct grab feedback; the Impact intro and metrics align to the same content-column edges as the surrounding case sections, with no additional horizontal inset; the shared editorial footer follows the next-project block and the exact homepage skills playground is reused beneath it with the same objects, styling and Matter.js behavior; metrics are restricted to the three delivery counts documented in the supplied blueprint
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
