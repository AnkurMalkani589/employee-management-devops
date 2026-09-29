/**
 * Verify the department card title colour in both themes.
 *
 * Reads the *computed* colour of each department title and compares it against
 * the theme's --text token, so the assertion is theme-aware rather than
 * hardcoded. Also checks contrast against the card background.
 */
export default async function run(page) {
  const results = {};

  function luminance(rgb) {
    const [r, g, b] = rgb.map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function contrast(a, b) {
    const l1 = luminance(a);
    const l2 = luminance(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  const parse = (css) => css.match(/\d+/g).slice(0, 3).map(Number);

  for (const theme of ['dark', 'light']) {
    // eslint-disable-next-line no-await-in-loop
    await page.emulateMedia({ colorScheme: theme });
    // eslint-disable-next-line no-await-in-loop
    await page.goto('http://127.0.0.1:8080/#/departments', { waitUntil: 'domcontentloaded' });
    // The theme hook prefers a stored choice over the emulated OS scheme, so
    // clear it and reload to genuinely exercise each theme.
    // eslint-disable-next-line no-await-in-loop
    await page.evaluate(() => window.localStorage.removeItem('em-theme'));
    // eslint-disable-next-line no-await-in-loop
    await page.reload({ waitUntil: 'networkidle' });
    // eslint-disable-next-line no-await-in-loop
    await page.waitForTimeout(1000);

    // eslint-disable-next-line no-await-in-loop
    const data = await page.evaluate(() => {
      const titles = [...document.querySelectorAll('.stat-grid .card__title')];
      const tokenText = getComputedStyle(document.documentElement).getPropertyValue('--text').trim();
      return {
        activeTheme: document.documentElement.getAttribute('data-theme'),
        tokenText,
        titles: titles.map((t) => {
          const card = t.closest('.card');
          return {
            text: t.textContent.trim(),
            color: getComputedStyle(t).color,
            cardBg: getComputedStyle(card).backgroundColor,
          };
        }),
      };
    });

    results[theme] = {
      activeTheme: data.activeTheme,
      tokenText: data.tokenText,
      titles: data.titles.map((t) => ({
        text: t.text,
        color: t.color,
        contrast: Number(contrast(parse(t.color), parse(t.cardBg)).toFixed(2)),
      })),
    };
  }

  return results;
}