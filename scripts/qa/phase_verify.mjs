/**
 * Verify department-card filtering and the command palette against the live app.
 * Assertions are derived from the real API response, not hardcoded.
 */
export default async function run(page) {
  const results = {};

  // Read the real directory so expectations come from the data itself.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:8080/#/departments', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  const employees = await page.evaluate(async () => {
    const r = await fetch('/api/employees');
    return (await r.json()).map((e) => ({ name: e.name, department: e.department }));
  });
  const departments = [...new Set(employees.map((e) => e.department))];
  results.totalEmployees = employees.length;
  results.departments = departments;

  // ------------------------------------------------ Department card filtering
  results.filtering = {};
  for (const dept of departments) {
    // eslint-disable-next-line no-await-in-loop
    await page.goto('http://127.0.0.1:8080/#/departments', { waitUntil: 'networkidle' });
    // eslint-disable-next-line no-await-in-loop
    await page.waitForTimeout(600);

    // eslint-disable-next-line no-await-in-loop
    await page.getByRole('button', { name: new RegExp(`^${dept}`, 'i') }).first().click();
    // eslint-disable-next-line no-await-in-loop
    await page.waitForTimeout(800);

    // eslint-disable-next-line no-await-in-loop
    const state = await page.evaluate(() => {
      const sel = document.querySelector('#filter-department');
      const table = document.querySelector('table');
      return {
        filterValue: sel?.value ?? null,
        rows: table
          ? [...table.querySelectorAll('tbody tr')].map((r) =>
            r.innerText.replace(/\s+/g, ' ').trim(),
          )
          : [],
      };
    });

    const expected = employees.filter((e) => e.department === dept).map((e) => e.name);
    const others = employees.filter((e) => e.department !== dept).map((e) => e.name);
    const leaked = others.filter((n) => state.rows.some((r) => r.includes(n)));

    results.filtering[dept] = {
      filterValue: state.filterValue,
      expected,
      visibleRows: state.rows.length,
      leakedEmployees: leaked,
      pass:
        state.filterValue === dept && leaked.length === 0 && state.rows.length === expected.length,
    };
  }

  // -------------------------------------------- Search still works under a filter
  await page.goto('http://127.0.0.1:8080/#/departments', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const firstDept = departments[0];
  await page.getByRole('button', { name: new RegExp(`^${firstDept}`, 'i') }).first().click();
  await page.waitForTimeout(700);

  await page.getByLabel('Search employees').fill('zzz-no-match-zzz');
  await page.waitForTimeout(500);
  const emptyAfterSearch = await page.evaluate(() =>
    document.body.innerText.includes('No matching employees'),
  );

  await page.getByLabel('Search employees').fill('');
  await page.waitForTimeout(400);
  const rowsAfterClearingSearch = await page.evaluate(
    () => document.querySelectorAll('table tbody tr').length,
  );

  results.search = { emptyAfterSearch, rowsAfterClearingSearch };

  // ---------------------------------------------------------- Command palette
  await page.goto('http://127.0.0.1:8080/#/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);

  await page.keyboard.press('Control+k');
  await page.getByRole('dialog', { name: /command palette/i }).waitFor({ timeout: 6000 });
  const cmdText = await page.evaluate(() => {
    const d = document.querySelector('[role=dialog][aria-label="Command palette"]');
    return d ? d.innerText.replace(/\s+/g, ' ').trim() : null;
  });
  results.commandPalette = {
    openedWithCtrlK: Boolean(cmdText),
    hasGoToEmployees: /Go to Employees/i.test(cmdText || ''),
    hasAddEmployee: /Add employee/i.test(cmdText || ''),
    hasHealth: /system health/i.test(cmdText || ''),
  };

  // Search for a real employee inside the palette.
  const empName = employees[0]?.name || '';
  await page.getByLabel(/search commands and employees/i).fill(empName.split(' ')[0]);
  await page.waitForTimeout(500);
  results.commandPalette.findsEmployee = await page.evaluate(
    (n) => document.body.innerText.includes(n),
    empName,
  );

  // Escape closes it.
  await page.keyboard.press('Escape');
  await page.waitForTimeout(700);
  results.commandPalette.closedOnEscape = await page.evaluate(
    () => !document.querySelector('[role=dialog][aria-label="Command palette"]'),
  );

  return results;
}