import { buildStandaloneHtml, extractForgeCss, deduplicateHeadTags, sanitizeHeadVars } from './exportHtml';

describe('HTML Export Spec Compliance', () => {
  const mockProject = {
    name: 'Test Project',
    id: 'test-123',
    elements: [{ html: '<section class="block"><h1>Hello</h1></section>' }],
    head_html: '',
    canvas_bg: '#ffffff',
    fonts: [],
    seo: { title: 'Test' },
    custom_js: '',
  };

  test('buildStandaloneHtml produces valid HTML5 doctype', () => {
    const html = buildStandaloneHtml(mockProject);
    expect(html).toMatch(/^<!doctype html>/i);
  });

  test('buildStandaloneHtml includes required meta tags', () => {
    const html = buildStandaloneHtml(mockProject);
    expect(html).toContain('<meta charset="utf-8"');
    expect(html).toContain('viewport');
    expect(html).toContain('content="width=device-width');
  });

  test('buildStandaloneHtml has proper html/head/body structure', () => {
    const html = buildStandaloneHtml(mockProject);
    expect(html).toMatch(/<html[^>]*lang="en">/i);
    expect(html).toContain('<head>');
    expect(html).toContain('</head>');
    expect(html).toContain('<body');
    expect(html).toContain('</body>');
    expect(html).toContain('</html>');
  });

  test('CSS consolidation in single style tag', () => {
    const html = buildStandaloneHtml(mockProject);
    const styleMatches = html.match(/<style>/g) || [];
    expect(styleMatches.length).toBe(1);
  });

  test('Canvas background included in CSS', () => {
    const html = buildStandaloneHtml(mockProject);
    expect(html).toContain('--wd-canvas-bg: #ffffff');
  });

  test('Project ID in data attribute', () => {
    const html = buildStandaloneHtml(mockProject);
    expect(html).toContain('data-wd-project="test-123"');
  });
});

describe('CSS Routing (extractForgeCss)', () => {
  test('extracts theme CSS variables', () => {
    const head = '<style data-forge-vars>:root { --color: red; }</style>';
    const { themeVars } = extractForgeCss(head);
    expect(themeVars.length).toBeGreaterThan(0);
  });

  test('extracts imported CSS separately', () => {
    const head = '<style data-forge-imported-css>.custom { margin: 0; }</style>';
    const { importedCss } = extractForgeCss(head);
    expect(importedCss.length).toBeGreaterThan(0);
  });

  test('preserves remaining head content', () => {
    const head = '<style data-forge-vars>:root { --x: 1; }</style><meta name="custom">';
    const { remainingHead } = extractForgeCss(head);
    expect(remainingHead).toContain('<meta name="custom">');
  });

  test('returns empty arrays when no forge CSS found', () => {
    const head = '<meta name="simple">';
    const result = extractForgeCss(head);
    expect(result.themeVars).toHaveLength(0);
    expect(result.importedCss).toHaveLength(0);
    expect(result.animations).toHaveLength(0);
  });
});

describe('Head Tag Cleaning', () => {
  test('deduplicates identical link tags', () => {
    const head = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter">';
    const cleaned = deduplicateHeadTags(head);
    expect((cleaned.match(/<link/g) || []).length).toBe(1);
  });

  test('deduplicates identical meta tags', () => {
    const head = '<meta name="x" content="y"><meta name="x" content="y">';
    const cleaned = deduplicateHeadTags(head);
    expect((cleaned.match(/<meta/g) || []).length).toBe(1);
  });

  test('sanitizeHeadVars removes template placeholders', () => {
    const head = '<meta name="test" content="${title}">';
    const cleaned = sanitizeHeadVars(head);
    expect(cleaned).not.toContain('${title}');
  });

  test('sanitizeHeadVars removes undefined/null tokens', () => {
    const head = '<meta name="x" content="undefined"><meta name="y" content="null">';
    const cleaned = sanitizeHeadVars(head);
    expect(cleaned).not.toMatch(/content="undefined"/);
    expect(cleaned).not.toMatch(/content="null"/);
  });
});
