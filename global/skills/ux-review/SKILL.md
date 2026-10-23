---
name: ux-review
description: >-
  Evaluate the user experience (UX) and accessibility of a web page, view, or
  component and produce a prioritized list of recommendations. Use this skill
  whenever someone asks how the UX, usability, or accessibility of a view,
  screen, page, form, or component "is doing" or "looks", asks for a UX review
  or audit, or wants feedback on button consistency, readable text, color
  contrast, message wording, required-field indicators, error messages, or
  accessibility — even if they never say the word "UX". Works for any web
  framework (React, Angular, Vue, plain HTML, etc.) and evaluates from source
  code, screenshots, or both. Always reach for this skill when the request is
  about how something feels or reads for the end user, not just whether it
  works.
---

# UX Review

Audit the user experience and accessibility of a web view and return a
prioritized, actionable report in **Spanish** (Markdown), where every finding is
justified by a recognized principle (a WCAG 2.1 success criterion or a Nielsen
usability heuristic). The goal is feedback that is concrete and educational,
never generic.

This skill is framework-agnostic: the same checklist applies whether the view is
built in React, Angular, Vue, or plain HTML. What changes is *where you look* in
the code, so always confirm the stack first.

## Core rule: ask before assuming

**Never make a decision or an interpretation on the user's behalf without
asking first.** Whenever something needed for the review is missing, ambiguous,
or not verifiable from the inputs at hand, stop and ask the user before
proceeding — do not guess, do not fill the gap with a default, and do not
silently pick the reading that seems most likely. This applies to, among others:

- The framework, UI library, or component conventions in use.
- Whether an internal design system exists and what it mandates.
- The scope: which view(s), and whether it's one or several.
- Whether a pattern is intentional (a design-system convention) or a defect.
- The intended behavior of a control, or how an ambiguous element should be read.
- Anything that can't be confirmed from code/screenshot (e.g. real contrast
  without a render, keyboard order without the running app).

When a check can't be answered with the inputs you have, either ask for the
missing input or mark the item **"no verificado"** in the report — never assert
a pass or fail you can't support. When a finding's severity is genuinely
borderline (e.g. Alta vs. Media), flag the ambiguity to the user rather than
deciding it silently. This rule does not block applying the documented priority
rubric to facts you *do* have — it forbids inventing the facts.

## Workflow

Follow these steps in order. Don't skip the context-gathering — the quality of
the report depends on it.

### 1. Gather the inputs

The most complete review combines **source code + a screenshot** of the rendered
view. Code reveals structure (labels, required markers, error message text,
button markup, ARIA, semantics); the screenshot reveals what the user actually
perceives (real contrast, spacing, visual hierarchy, alignment).

- If you have only one of the two, proceed but say so in the report — note which
  checks are limited (e.g. "contrast could not be verified precisely without a
  rendered screenshot").
- If neither is present, ask the user to paste the component/template code or
  attach a screenshot before continuing.

### 2. Establish context (ask only what the request needs)

- **Framework / UI library.** Ask which framework and component library are in
  use (e.g. Angular Material, PrimeNG, React + MUI, Bootstrap, custom). This
  tells you how required fields, errors, and disabled states are normally
  expressed, so you don't flag a library convention as a defect.
- **Internal design system.** Ask whether the team has its own design system or
  style guide (official colors, typography scale, message tone, component rules).
  If yes, treat it as the source of truth for consistency checks. If there is
  none, fall back to industry standards (WCAG 2.1 AA + Nielsen) and say so.
- Ask the questions the request actually requires — don't pad with unnecessary
  ones — but per the core rule above, when any of these is unknown, ask rather
  than assume. Never substitute a default for an answer you could get by asking.

### 3. Run the evaluation

Walk every category in the checklist below against the view(s). For each issue,
identify the backing principle (the specific WCAG criterion or named Nielsen
heuristic). See `references/wcag-nielsen.md` for the full criteria, the contrast
math, and how to check each item from code vs. from a screenshot — read it
whenever you need the exact threshold or wording.

If the request covers **several views**, evaluate each one and produce a section
per view, plus a single consolidated priority list at the top so the reader sees
the most important issues across the whole flow first.

### 4. Note what already works well

Before listing problems, identify 2-4 things the view does right — clear labels,
good contrast, consistent components, helpful empty states, etc. This is not
filler: it tells the team what to preserve, balances the report, and is honest
when the view is in good shape. Tie each positive to the same principles used
for the findings.

### 5. Assign a priority to each finding

Use this rubric exactly. The labels (Alto / Medio / Bajo) appear verbatim in the
Spanish report:

- **Alto** — Breaks the experience or excludes users: the user can't complete
  the task, can't read essential text, can't perceive an error, or the view is
  inaccessible to assistive technology. (e.g. contrast below the WCAG minimum on
  body text, a generic/technical error that hides what went wrong, a form field
  with no label, required info conveyed by color alone.)
- **Medio** — Works, but is hard to read, understand, or trust: it costs the
  user effort even though the task is technically possible. (e.g. inconsistent
  button styles, cramped line length, a vague but recoverable message, weak
  visual hierarchy.)
- **Bajo** — Suggestion / polish: the experience is fine but could be smoother
  or more pleasant. (e.g. micro-copy refinements, spacing tweaks, optional
  helper text.)

**Do not force or invent findings.** Report only issues that genuinely exist and
that you can support against a WCAG criterion or Nielsen heuristic. Never lower
the bar, stretch a non-issue into a problem, or manufacture a finding just to
fill a priority level. If a level has no real findings, that level is **zero** —
state it explicitly with "Sin hallazgos." instead of padding it. It is entirely
valid for some — or all three — priority levels to be empty: a view in good shape
is an honest, acceptable result. The review's value is measured by accuracy, not
by how many findings it produces. The same applies in reverse to "Lo que
funciona bien": list real strengths, and don't invent them either.

### 6. Produce the report

Write the report in **Spanish, in Markdown**, using the exact template below.

## Evaluation checklist

Cover all of these. The parenthetical is the primary backing principle; details
and thresholds live in `references/wcag-nielsen.md`.

1. **Consistency and visual hierarchy** — buttons share style, size, label
   conventions, and placement; primary vs. secondary actions are
   distinguishable; visual hierarchy guides the eye. (Nielsen #4 consistency &
   standards, #8 aesthetic & minimalist design; WCAG 3.2.4.)
2. **Readability and typography** — font size, weight, and line length make text
   readable; text resizes and tolerates spacing overrides without breaking.
   (WCAG 1.4.4 resize text, 1.4.12 text spacing.)
3. **Color contrast** — text meets the contrast minimums (4.5:1 normal, 3:1
   large), and meaningful non-text UI (icons, borders, control states) meets
   3:1. (WCAG 1.4.3 contrast, 1.4.11 non-text contrast.)
4. **Use of color** — information is never conveyed by color alone (errors,
   required fields, status, links). (WCAG 1.4.1 use of color.)
5. **Forms and required indicators** — every field has a visible, programmatic
   label; required fields are marked with more than color; inputs have clear
   instructions and an autocomplete/input-purpose hint where relevant. (WCAG
   3.3.2 labels or instructions, 1.3.1 info & relationships, 1.3.5 identify
   input purpose.)
6. **Error messages** — errors are identified clearly, in plain user-centered
   language, and suggest how to fix the problem. Treat the two failure modes as
   **separate findings** when both are present: (a) *generic* messages that state
   no cause or recovery ("Error", "Algo salió mal"), and (b) *technical* messages
   that leak internals (stack traces, exception names, HTTP codes). Don't fold
   the generic one into the technical one — each fails for its own reason and
   needs its own fix. (WCAG 3.3.1 error identification, 3.3.3 error suggestion;
   Nielsen #9 help users recover from errors, #2 match with the real world.)
7. **Microcopy and language** — labels, buttons, and messages speak the user's
   language and match real-world expectations; no internal jargon; a control's
   visible label matches its accessible name. (Nielsen #2 match with the real
   world; WCAG 2.5.3 label in name.)
8. **Feedback and system status** — loading, success, empty, and disabled states
   are visible, and important status changes are announced to assistive tech.
   (Nielsen #1 visibility of system status; WCAG 4.1.3 status messages.)
9. **Accessibility and keyboard navigation** — semantic structure and headings,
   alt text on meaningful images, focusable interactive elements with a visible
   focus indicator, sensible focus order. (WCAG 1.1.1 non-text content, 1.3.1,
   2.1.1 keyboard, 2.4.7 focus visible, 4.1.2 name/role/value.)
10. **Responsive and pointer interaction** — content reflows at small widths
    without horizontal scrolling or clipping, works in both orientations, and
    touch targets are comfortably sized and not gesture-only. (WCAG 1.4.10
    reflow, 1.3.4 orientation, 2.5.1 pointer gestures; target size — note it's
    AAA in 2.1 — as a usability recommendation.)
11. **Error prevention and cognitive load** — the design prevents avoidable
    mistakes (confirmations on destructive actions, sensible defaults) and favors
    recognition over recall. (Nielsen #5 error prevention, #6 recognition rather
    than recall.)

## Report template

ALWAYS use this exact structure. It is the literal output and stays in Spanish
(the rest of this skill is English; only this template is in the report's
language). Always keep the three priority sections; if a level has no findings,
write "Sin hallazgos." under its heading so the zero is explicit (never silently
drop a level or pad it to look non-empty).

```markdown
# Revisión de experiencia de usuario — [nombre de la vista]

**Contexto:** [framework / librería UI · con o sin sistema de diseño interno · entradas usadas: código y/o captura]
**Estándares aplicados:** WCAG 2.1 (AA) y heurísticas de Nielsen

## Resumen
[2-3 frases: estado general de la vista y los temas más importantes a atender.]

## Lo que funciona bien
- [Acierto concreto y, entre paréntesis, el principio que respeta.]
- ...

## Prioridad Alta
1. **[Título corto del hallazgo]**
   - **Qué:** [descripción concreta de lo que ocurre y dónde.]
   - **Por qué:** [el motivo teórico — criterio WCAG o heurística de Nielsen — y por qué afecta al usuario.]
   - **Recomendación:** [acción concreta para corregirlo.]
   - **Código sugerido:** [cuando aplique un cambio de código puntual, un snippet corto con la corrección. Omitir esta línea si el arreglo no es de código.]

## Prioridad Media
1. **[Título corto del hallazgo]**
   - **Qué:** ...
   - **Por qué:** ...
   - **Recomendación:** ...

## Prioridad Baja
Sin hallazgos.    <!-- usar esta línea cuando una prioridad no tenga hallazgos reales; si los hay, listarlos con el mismo formato de arriba -->
```

When several views are reviewed, repeat the per-view sections under a top-level
`## [Vista]` heading and add a `## Prioridades consolidadas` list at the very
top.

The `**Código sugerido:**` line is shown above only on the Alta example to keep
the template short, but it applies to **any** finding (Alta, Media, or Baja)
whenever there's a concrete code fix. Omit the line when the fix isn't code.

## Principles for good findings

- **Be specific.** Point to the actual element (e.g. the "Guardar" button in the
  bottom-right corner) and the actual problem, not a vague category.
- **Always justify.** Every finding states *why* it matters, tied to a named
  WCAG criterion or Nielsen heuristic. This is what makes the report educational
  rather than opinion.
- **Cite precisely.** Map each issue to the criterion it *actually* satisfies or
  violates, and double-check the number and name. Common trap: the input `type`
  attribute (`type="email"`) is not WCAG 1.3.5 — that criterion is about
  `autocomplete` tokens. Credit `autocomplete="email"` to 1.3.5, not `type`.
  Don't attach a plausible-sounding criterion to a feature it doesn't cover.
- **Include a fix snippet.** When the fix is a concrete code change, add a short
  corrected snippet under "Código sugerido" (the attribute, CSS rule, or markup
  to apply). Keep it minimal and copy-pasteable. Skip it when the fix is process
  or design rather than code.
- **Don't invent.** If something can't be verified with the inputs at hand (e.g.
  exact contrast ratio without a screenshot, keyboard behavior without running
  the app), ask for the missing input or say it's unverified — never guess (see
  the core rule).
- **Respect conventions.** A documented design-system or library pattern is not a
  defect just because it differs from a default. Ask to confirm before flagging
  it rather than interpreting intent yourself.
- **Stay constructive.** The tone is a helpful peer review: clear about problems,
  always paired with a fix.
