# Icon inventory and Tabler replacement

The homepage, five linked case studies, and the legacy `eme.html` page share the same interface-icon system. The audit was completed before the replacement.

| Existing icon use | Tabler outline icon | Where |
| --- | --- | --- |
| Down, up, right, and diagonal arrow glyphs | `arrow-down`, `arrow-up`, `arrow-right`, `arrow-up-right` | Hero links, contact actions, case-to-case links, and all footers |
| CSS-drawn plus and mobile menu | `plus`, `menu-2` (with `x` when open) | FAQ, case accordions, and the responsive header |
| Hand-drawn contact pictograms | `message-circle`, `mail`, `phone`, `brand-telegram` | FAQ contact prompt and contact details |
| Five custom skill pictograms | `components`, `pointer`, `layout-dashboard`, `browser`, `zoom-in` | Skills playground on every page |
| Five custom tool marks | `brand-javascript`, `brand-framer`, `brand-vscode`, `brand-figma`, `brand-slack` | Skills playground on every page |

The SVG files are from [Tabler Icons](https://github.com/tabler/tabler-icons/tree/main/icons/outline) and are used locally through CSS masks so they inherit each element's existing colour. The 21 original icons share Tabler's 24×24 grid and 2px outline stroke. The 11 interface variants in `tabler-ui/` retain those Tabler paths with a 2px SVG stroke and 20px intrinsic size.

Outside the interactive skills playground beneath the footer, every interface icon renders at 20×20 CSS pixels. Icon-and-label controls use a 6px gap. Pill-style call-to-action labels use weight 800. The playground keeps its original assets and responsive icon sizes and spacing.

For future interface icons, choose the appropriate icon from the [Tabler collection on 21st.dev](https://21st.dev/community/icons/tabler), then add it to the local Tabler icon system. Keep the established 20×20 px rendered size, 2px SVG stroke, inherited colour, and 6px icon-to-label gap. Do not apply these interface rules to the interactive skills playground below the footer. Pill-style call-to-action labels are 16px and weight 800.

Not replaced: the portfolio wordmark and company logos (brand identities); the morphing cartoon shapes in About, the hand-drawn drag hints, the interactive globe, the cursor illustration, the case imagery, and the mock-interface graphics (illustration or content rather than interface pictograms). Their existing animation and appearance are preserved.
