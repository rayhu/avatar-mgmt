# Sass Migration Guide

## Overview
This document explains the migration from deprecated Sass syntax to modern syntax to eliminate deprecation warnings.

## Changes Made

### 1. Replaced `@import` with `@use`

**Before:**
```scss
@import '@/assets/styles/variables.scss';
```

**After:**
```scss
@use '@/assets/styles/variables.scss' as *;
```

### 2. Updated Color Functions

**Before:**
```scss
background: darken($primary-color, 10%);
```

**After:**
```scss
@use 'sass:color';
background: color.adjust($primary-color, $lightness: -10%);
```

## Files Updated

- `src/views/Admin/ModelList.vue`
- `src/views/User/ModelGallery.vue`

## Important: Required Imports

When using `color.adjust()`, you **must** import the Sass color module:

```scss
@use 'sass:color';
```

This import is required at the top of any file that uses `color.adjust()` or other color functions.

## Benefits

1. **No More Deprecation Warnings**: Clean development experience
2. **Future-Proof**: Compatible with Dart Sass 3.0.0+
3. **Better Performance**: Modern Sass compilation is faster
4. **Improved Namespacing**: `@use` provides better module isolation

## Checking for Issues

Run the Sass check script to verify no deprecation warnings remain:

```bash
yarn sass-check
```

## Common Patterns

### Color Adjustments

| Old Function | New Function |
|-------------|-------------|
| `darken($color, 10%)` | `color.adjust($color, $lightness: -10%)` |
| `lighten($color, 10%)` | `color.adjust($color, $lightness: 10%)` |
| `saturate($color, 10%)` | `color.adjust($color, $saturation: 10%)` |
| `desaturate($color, 10%)` | `color.adjust($color, $saturation: -10%)` |

### Import Statements

| Old | New |
|-----|-----|
| `@import 'variables';` | `@use 'variables' as *;` |
| `@import 'variables' as v;` | `@use 'variables' as v;` |

## Complete Example

```scss
@use '@/assets/styles/variables.scss' as *;
@use 'sass:color';

.my-component {
  background: $primary-color;
  
  &:hover {
    background: color.adjust($primary-color, $lightness: -10%);
  }
}
```

## Best Practices

1. **Use `@use` instead of `@import`** for all Sass files
2. **Always import `sass:color`** when using color functions
3. **Use `color.adjust()`** for color modifications
4. **Run `yarn sass-check`** regularly to catch new issues
5. **Keep variables in dedicated files** for better organization

## Resources

- [Sass @use Documentation](https://sass-lang.com/documentation/at-rules/use/)
- [Sass Color Functions](https://sass-lang.com/documentation/modules/color/)
- [Dart Sass Migration Guide](https://sass-lang.com/d/import) 
