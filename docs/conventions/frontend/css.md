# CSS

These conventions apply to `apps/web/src/app/globals.css` and shared styles.

## Stylesheet order

Use this order in `globals.css`:

1. Imports and custom variants.
2. `@theme inline`, followed by `:root` and `.dark`.
3. Base styles in `@layer base`.
4. Shared utilities, followed by component and browser overrides.
5. Keyframes.

Keep overrides that depend on being unlayered outside `@layer`, such as the autofill override that must beat `ring-0`. Moving a rule must preserve its cascade behavior.

## Token grouping

Keep light and dark token lists in the same order with matching groups. Order the corresponding `@theme inline` color mappings the same way.

Keep each color beside its foreground token. Group all sidebar tokens together. Group fonts, radii, spacing, and animations separately; keep feature-specific spacing together, such as the A4 dimensions.

Separate groups and rules with one blank line. Do not add category comments or section banners.

```css
:root {
  --background: #eef1f2;
  --foreground: #090b0c;

  --card: #ffffff;
  --card-foreground: var(--foreground);
}

.dark {
  --background: #0d1112;
  --foreground: #f9fbfb;

  --card: #131718;
  --card-foreground: var(--foreground);
}
```

## Comments

Remove comments that repeat the CSS. Keep only short, single-line comments explaining non-obvious constraints or workarounds.

```css
/* Cover Chrome autofill; keep unlayered to override ring-0. */
```

## Textures

Store long SVG textures in `apps/web/public/textures/` and reference them by URL instead of embedding data URLs in CSS.

```css
background-image: url("/textures/grain-light.svg");
```
