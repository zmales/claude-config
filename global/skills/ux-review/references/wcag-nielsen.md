# WCAG 2.1 (AA) and Nielsen Heuristics — Reference

Read this when you need the exact threshold, the precise criterion wording, or
guidance on how to check an item from code versus from a screenshot.

## Table of contents
- [How to check: code vs. screenshot](#how-to-check-code-vs-screenshot)
- [Color contrast math](#color-contrast-math)
- [WCAG 2.1 AA criteria most relevant to a view review](#wcag-21-aa-criteria-most-relevant-to-a-view-review)
- [Nielsen's 10 usability heuristics](#nielsens-10-usability-heuristics)
- [Common anti-patterns mapped to principles](#common-anti-patterns-mapped-to-principles)

## How to check: code vs. screenshot

Some checks are reliable from code, some only from the rendered screenshot, and
some need both. Use this to decide and to be honest in the report about what
could and couldn't be verified.

| Check | From code | From screenshot |
|---|---|---|
| Labels present / associated with inputs | Yes (`<label for>`, `aria-label`, `aria-labelledby`) | Partially (a visible label may not be programmatically linked) |
| Required-field indication | Yes (`required`, `aria-required`, asterisk markup) | Yes (visually), but can't confirm it's not color-only without code |
| Error message text & specificity | Yes (read the literal strings) | Yes if the error is shown in the capture |
| Color conveys info alone | Needs both — code shows the markup, screenshot confirms the visual |
| Text contrast ratio | Approximate (from CSS hex/rgb values, if static) | Yes — sample the actual rendered pixels |
| Non-text / UI-component contrast | Approximate (from CSS) | Yes — sample borders, icons, states |
| Visual hierarchy, spacing, alignment | Weak | Yes — this is what the eye sees |
| Reflow at small widths / orientation | Partially (CSS media queries, fixed widths) | Yes if a narrow/mobile capture is provided |
| Button style consistency | Partially (shared classes/components) | Yes |
| Semantic structure / heading order | Yes (`<h1>`–`<h6>`, landmarks, roles) | No |
| Alt text on images | Yes (`alt`, `aria-*`) | No (you can't see the alt attribute in a picture) |
| Keyboard focusability & focus order | Partially (markup, `tabindex`) | No — needs the running app |
| Visible focus indicator | Needs the running app or a focus-state screenshot |
| Status messages announced | Yes (`role="status"`, `aria-live`) | No |

When a check is in the "needs the running app" or "needs a screenshot" bucket and
you don't have it, report the item as **no verificado** rather than asserting a
pass or fail.

## Color contrast math

Contrast ratio between two colors is `(L1 + 0.05) / (L2 + 0.05)`, where L1 is the
relative luminance of the lighter color and L2 of the darker, and luminance is
computed from linearized sRGB channels. You don't need to compute it by hand —
state the foreground and background colors you observed and the resulting ratio,
and compare against the thresholds.

WCAG 2.1 Level AA thresholds:
- **Normal text:** ratio ≥ **4.5:1** (1.4.3)
- **Large text** (≥ 18pt, or ≥ 14pt bold ≈ 24px / 18.66px bold): ratio ≥ **3:1** (1.4.3)
- **Non-text contrast** — UI component boundaries, icons, focus indicators, and
  states that convey meaning: ratio ≥ **3:1** (1.4.11)
- Pure decoration and inactive/disabled controls are exempt.

## WCAG 2.1 AA criteria most relevant to a view review

Plain-language summaries. Cite the number + name in findings. (Criteria new in
2.1 are marked ★.)

- **1.1.1 Non-text Content (A):** Meaningful images need text alternatives;
  decorative images should be marked so assistive tech ignores them.
- **1.3.1 Info and Relationships (A):** Structure conveyed visually (labels,
  headings, groups, table headers) must also be available programmatically.
- **1.3.4 Orientation (AA) ★:** Don't lock content to a single orientation
  (portrait/landscape) unless essential.
- **1.3.5 Identify Input Purpose (AA) ★:** Common inputs (name, email, etc.)
  expose their purpose via `autocomplete`, so browsers/AT can assist.
- **1.4.1 Use of Color (A):** Color must not be the *only* way to convey
  information — pair it with text, icons, or patterns (errors, required fields,
  status, links in body text).
- **1.4.3 Contrast (Minimum) (AA):** Text meets the contrast ratios above.
- **1.4.4 Resize Text (AA):** Text can scale to 200% without loss of content or
  function; avoid fixed pixel heights that clip text, and avoid text in images.
- **1.4.10 Reflow (AA) ★:** Content reflows to a 320px-wide viewport without
  two-dimensional scrolling (no horizontal scroll for reading).
- **1.4.11 Non-text Contrast (AA) ★:** UI components and meaningful graphics meet
  3:1 against adjacent colors.
- **1.4.12 Text Spacing (AA) ★:** No loss of content when users override line
  height, letter/word spacing, and paragraph spacing.
- **1.4.13 Content on Hover or Focus (AA) ★:** Tooltips/popovers are dismissible,
  hoverable, and persistent.
- **2.1.1 Keyboard (A):** All functionality is operable by keyboard alone.
- **2.4.6 Headings and Labels (AA):** Headings and labels are descriptive.
- **2.4.7 Focus Visible (AA):** The keyboard focus indicator is visible — don't
  remove outlines without a replacement.
- **2.5.1 Pointer Gestures (A) ★:** Multipoint/path-based gestures have a simple
  single-pointer alternative.
- **2.5.3 Label in Name (A) ★:** A control's accessible name contains its visible
  label text.
- **3.2.4 Consistent Identification (AA):** Components with the same function are
  identified consistently across views.
- **3.3.1 Error Identification (A):** Errors are identified in text and the field
  in error is indicated.
- **3.3.2 Labels or Instructions (A):** Inputs have labels or instructions;
  required fields and formats are stated.
- **3.3.3 Error Suggestion (AA):** When an error is detected and a fix is known,
  suggest it (e.g. expected format), in plain language.
- **4.1.2 Name, Role, Value (A):** Custom controls expose a correct name, role,
  and state to assistive technology.
- **4.1.3 Status Messages (AA) ★:** Status changes (saved, error count, results
  updated) are programmatically announced without moving focus.

Note on touch targets: minimum target size is **2.5.5 (AAA)** in 2.1 (it only
became an AA requirement, 2.5.8, in WCAG 2.2). Flag small/cramped targets as a
usability recommendation, not a hard AA failure, unless the team's design system
requires a minimum.

## Nielsen's 10 usability heuristics

1. **Visibility of system status** — keep users informed with timely feedback
   (loading, saving, success, progress).
2. **Match between system and the real world** — use the users' language and
   familiar concepts, not internal/technical jargon.
3. **User control and freedom** — provide undo/cancel and clear exits.
4. **Consistency and standards** — same words, components, and actions behave
   the same way; follow platform conventions.
5. **Error prevention** — design to prevent problems (confirmations on
   destructive actions, constraints, good defaults).
6. **Recognition rather than recall** — make options visible; don't force users
   to remember information across steps.
7. **Flexibility and efficiency of use** — accelerators and shortcuts for
   experienced users without hindering novices.
8. **Aesthetic and minimalist design** — no irrelevant or competing content;
   every element earns its place.
9. **Help users recognize, diagnose, and recover from errors** — plain-language
   messages that say what went wrong and how to fix it.
10. **Help and documentation** — when needed, it's easy to find and task-focused.

## Common anti-patterns mapped to principles

Use these as quick triggers when scanning a view.

- Generic error like "Error" or "Algo salió mal" with no cause → **3.3.1 / Nielsen #9** (usually **Alto**).
- Raw technical error (stack trace, SQL error, HTTP code) shown to the user → **Nielsen #2 / #9** (**Alto**).
- Required field marked only by a red asterisk with no text, or required-ness shown only by color → **1.4.1 / 3.3.2** (**Alto/Medio**).
- Input with placeholder used *as* the label (label disappears on typing) → **3.3.2 / 1.3.1** (**Medio/Alto**).
- Low-contrast gray body text on white → **1.4.3** (**Alto** if below 4.5:1).
- Icon, border, or input outline too faint to perceive → **1.4.11** (**Medio/Alto**).
- Link or status distinguished only by color → **1.4.1** (**Medio/Alto**).
- Mixed button styles for the same action across views → **3.2.4 / Nielsen #4** (**Medio**).
- `outline: none` on focus with no replacement → **2.4.7** (**Alto** for keyboard users).
- Icon-only button with no accessible name, or visible label not in the accessible name → **1.1.1 / 4.1.2 / 2.5.3** (**Alto**).
- Layout forces horizontal scrolling on a phone-width screen → **1.4.10** (**Medio/Alto**).
- "Saved"/result-count updates that screen readers never hear → **4.1.3** (**Medio**).
- Destructive action (delete) with no confirmation → **Nielsen #5** (**Medio**).
- Wall of fields with no grouping or hierarchy → **Nielsen #8 / 1.3.1** (**Medio**).
