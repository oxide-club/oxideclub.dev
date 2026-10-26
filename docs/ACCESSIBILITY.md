# Accessibility verification — 19 October 2026

Scope: homepage, catalogue, wc specification, conduct page and 404. Static Astro output, PT-BR, Chromium 152.0.7977.82 on Linux, Playwright and axe-core. This is verification evidence, not a claim of complete WCAG 2.2 AA conformance.

## Automated coverage

The 25 browser tests in `tests/browser/` cover:

- Axe WCAG 2 A/AA, 2.1 AA and 2.2 AA rules across all five routes, including the open mobile navigation. No reported violations in the final run.
- PT-BR document language, one primary heading, heading-level progression, main landmark and accessible home-link name. Browser accessibility-tree inspection confirms that the native mobile disclosure exposes its expanded state.
- Reflow at 320, 375, 768 and 1440 CSS px; no document-level horizontal overflow.
- WCAG text-spacing overrides at 320, 768 and 1440 px: line-height 1.5, letter spacing 0.12em, word spacing 0.16em, paragraph spacing 2em.
- A separate 200% text-size stress test doubles every element's original computed font size at those three widths. This preserves the relative hierarchy and is stronger than changing only the root font size, but does not substitute for browser-native text enlargement/zoom.
- Standalone visible control targets at least 24×24 CSS px at mobile and desktop widths. Inline prose links use the inline-text exception. Closed disclosure contents are excluded using browser visibility checks.
- Tab traversal and visible focus on all routes, skip-to-main activation, mobile menu keyboard activation, Escape/focus return, and cross-page section navigation.
- Axe contrast checks with the primary CTA hovered, open-menu contrast, forced-colors menu visibility/focus, reduced-motion scroll behavior, and screenshots of forced-colors rendering.
- Internal navigation, branding assets and preview indexing configuration.

Commands:

```sh
npm run check
npm test
npm run build
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser
```

The content/build checks report zero Astro diagnostics, 16 passing unit/content tests, and five generated pages. Browser test artifacts are stored in ignored `test-results/`.

## Corrections made

Text-spacing overrides revealed that long headings increased grid minimum widths beyond the mobile viewport. Global text wrapping now allows long words to break when necessary without suppressing overflow. Enlarged text also exposed the header's single-row constraint; the header can wrap and the mobile dropdown is positioned below its actual height, rather than a fixed pixel offset.

The target-size audit initially counted unpainted links inside a closed native disclosure. The test now checks actual visibility before measuring controls.

## Manual release checks pending as of 19 October 2026

No screen reader is available in this environment. Browser accessibility-tree checks cannot establish spoken announcements, reading order quality or assistive-technology usability. `screenReaderReviewed` and `accessibilityReviewed` remain false. `keyboardReviewed` also remains false pending a human review; automated Tab traversal is recorded separately.

Before release, review with a real screen reader/browser combination (for example NVDA/Firefox or VoiceOver/Safari): landmarks, navigation disclosure and its state, challenge headings and code/table reading, the ASCII byte figure, reporting links, and skip-link behavior. Complete a human keyboard pass including Shift+Tab, open-menu navigation and focus visibility. Check browser-native 200% enlargement and 400% zoom/reflow, all actual interactive states, and forced-colors readability. Record results and resolve failures before changing the release flags.

References: [WCAG text spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html), [resize text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html), and [target size minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

## Owner-authorized release exception

On 19 October 2026, the owner explicitly instructed publication without the pending accessibility reviews. `manualAccessibilityReviewDeferred: true` records that exception. The three manual-review flags remain false; no completed review or full WCAG conformance is claimed. Automated checks remain required by CI. The manual checks above remain follow-up work, rather than blockers for this owner-authorized release.

## Laboratórios

A nova coleção usa sumário lateral no desktop e `details` no celular, cabeçalhos
semânticos e conferências expansíveis com `summary`. A suíte `labs.spec.ts`
verifica axe, teclado, downloads, 320/390/1280px e ampliação de texto.
A revisão manual com leitor de tela da nova coleção estava pendente no registro original.

## Owner confirmation — 25 October 2026

The owner confirmed that manual accessibility is OK. Based on that confirmation,
`keyboardReviewed`, `screenReaderReviewed` and `accessibilityReviewed` are now
true, and `manualAccessibilityReviewDeferred` is false. The earlier pending
checks and release exception above are retained as historical records.

This records the owner's review, not a new assistive-technology audit performed
by the coding agent. Browser/assistive-technology combinations and detailed
manual results were not provided; no complete WCAG conformance is claimed.

The owner also confirmed that `report@oxideclub.dev` is functional.

## Verificações automatizadas dos roadmaps em 25 de outubro de 2026

O catálogo e os diagramas foram conferidos com Playwright, Chromium e axe. Os cenários incluem lista sem JavaScript, teclado, foco na alternância de visualização, larguras de 320 a 1280 px, texto dos blocos ampliado a 200%, cores forçadas, redução de movimento e redimensionamento rápido. As dez trilhas iniciais passaram pela verificação de sobreposição de blocos e de setas que atravessassem blocos alheios.

A integração usa notas sintéticas em vários papéis curriculares, sem numeração ou dificuldade. O contraste com as cores normais permanece no axe. No cenário de cores forçadas, a regra de contraste foi desativada devido à mistura de cores autorais e cores impostas descrita no [issue 3978 do axe](https://github.com/dequelabs/axe-core/issues/3978); os demais critérios continuam ativos e há captura de tela.

Esses resultados não constituem revisão manual com leitor de tela ou confirmação de qualidade dos anúncios por tecnologia assistiva. As pendências e exceções de publicação já registradas neste documento permanecem sob responsabilidade dos mantenedores.
