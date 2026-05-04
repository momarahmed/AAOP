'use client';

import { createTheme, alpha } from '@mui/material/styles';

/**
 * AAOP / Fusion-MCP MUI theme
 * --------------------------------------------------------------------
 * Bridges MUI's component library with the existing CSS-variable
 * design tokens defined in `globals.css`. Components that need bespoke
 * chrome (canvas, login card, status pills) continue to use the CSS
 * classes / OKLCH variables directly; everything else gets a sensible
 * MUI default.
 *
 * NB: MUI v6 helpers like `alpha()` and `darken()` only accept
 * `#nnn`, `#nnnnnn`, `rgb()`, `hsl()`, or `color()`. They do NOT yet
 * parse `oklch()` strings. We therefore keep the palette below in
 * hex (precomputed equivalents of the OKLCH variables in
 * globals.css) so MUI internals can manipulate them, while the
 * browser-side CSS still uses the richer OKLCH values directly.
 * If you tweak globals.css, regenerate these hex values via culori
 * (see `docs/RUNBOOK.md`).
 */

const palette = {
  bgDeepest:   '#071f1f',
  bgDeep:      '#112e2e',
  bgMid:       '#193c3c',
  bgSurface:   '#274949',
  bgElevated:  '#2d5555',

  ink:         '#f5f9fa',
  inkMuted:    '#bac7c7',
  inkSoft:     '#8b9c9c',
  inkDark:     '#0f1d1e',

  cyan:        '#00d1da',
  cyanBright:  '#00edee',
  amber:       '#eca851',
  violet:      '#9e8fe9',
  mint:        '#68d7a1',
  rose:        '#f47b74',

  ok:          '#52cd86',
  warn:        '#eba941',
  err:         '#fa6863',
  info:        '#00d1da',

  // Auxiliary surface tones (precomputed from globals.css OKLCH vars)
  paperBg:     '#162e2d',
  borderSoft:  '#486b6a',
  borderMid:   '#567979',
  inputBg:     '#0a1919',
  appBarBg:    '#071a19',
  tooltipBg:   '#071a19',
} as const;

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary:   { main: palette.cyan,   contrastText: palette.inkDark },
    secondary: { main: palette.amber,  contrastText: palette.inkDark },
    info:      { main: palette.info,   contrastText: palette.inkDark },
    success:   { main: palette.ok,     contrastText: palette.inkDark },
    warning:   { main: palette.warn,   contrastText: palette.inkDark },
    error:     { main: palette.err,    contrastText: palette.ink },
    background: {
      default: palette.bgDeepest,
      paper:   alpha(palette.paperBg, 0.7),
    },
    text: {
      primary:   palette.ink,
      secondary: palette.inkMuted,
      disabled:  palette.inkSoft,
    },
    divider: alpha(palette.borderSoft, 0.3),
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: 13,
    h1: { fontFamily: 'Newsreader, "Source Serif Pro", Georgia, serif', fontWeight: 400, letterSpacing: '-0.01em' },
    h2: { fontFamily: 'Newsreader, "Source Serif Pro", Georgia, serif', fontWeight: 400, letterSpacing: '-0.01em' },
    h3: { fontFamily: 'Newsreader, "Source Serif Pro", Georgia, serif', fontWeight: 400, letterSpacing: '-0.01em' },
    h4: { fontFamily: 'Newsreader, "Source Serif Pro", Georgia, serif', fontWeight: 400, letterSpacing: '-0.01em' },
    h5: { fontFamily: 'Newsreader, "Source Serif Pro", Georgia, serif', fontWeight: 400, letterSpacing: '-0.01em' },
    h6: { fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 14, letterSpacing: 0 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
    body1: { fontSize: 13 },
    body2: { fontSize: 12, color: palette.inkMuted },
    caption: { fontSize: 11, color: palette.inkSoft },
  },
  shape: { borderRadius: 6 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: palette.bgDeepest, color: palette.ink },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true, size: 'small' },
      styleOverrides: {
        root: {
          borderRadius: 6,
          paddingInline: 14,
          paddingBlock: 8,
          fontSize: 12,
        },
        containedPrimary: {
          boxShadow: `0 0 0 1px ${alpha(palette.cyan, 0.3)}, 0 8px 24px ${alpha(palette.cyan, 0.25)}`,
          '&:hover': { boxShadow: `0 0 0 1px ${alpha(palette.cyanBright, 0.45)}, 0 8px 24px ${alpha(palette.cyanBright, 0.3)}` },
        },
        outlined: { borderColor: alpha(palette.borderMid, 0.5) },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small', fullWidth: true },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(palette.inputBg, 0.6),
          borderRadius: 8,
          '& fieldset': { borderColor: alpha(palette.borderMid, 0.4) },
          '&:hover fieldset': { borderColor: alpha(palette.cyan, 0.6) },
          '&.Mui-focused fieldset': { borderColor: palette.cyan, borderWidth: 1 },
        },
        notchedOutline: { borderColor: alpha(palette.borderMid, 0.4) },
        input: { color: palette.ink, fontSize: 13 },
      },
    },
    MuiInputLabel: {
      styleOverrides: { root: { color: palette.inkSoft, fontSize: 12, letterSpacing: '0.06em' } },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: alpha(palette.paperBg, 0.7),
          border: `1px solid ${alpha(palette.borderSoft, 0.25)}`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(palette.paperBg, 0.55),
          border: `1px solid ${alpha(palette.borderSoft, 0.25)}`,
          borderRadius: 10,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: 13,
          color: palette.inkSoft,
          '&.Mui-selected': { color: palette.ink },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: palette.cyan, height: 2 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 999, fontWeight: 500 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: 11,
          backgroundColor: palette.tooltipBg,
          border: `1px solid ${alpha(palette.borderSoft, 0.4)}`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(palette.appBarBg, 0.6),
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${alpha(palette.borderSoft, 0.2)}`,
        },
      },
    },
  },
});

export const accentPalette = palette;
