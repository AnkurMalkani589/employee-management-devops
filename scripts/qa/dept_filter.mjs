/** Verify department-card filtering: click each card, assert the employee list. */
export default async function run(page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:8080/#/departments', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  const results = {};

  // The department cards are the clickable buttons in the stat grid.
  const cards = await page.evaluate(() =>
    [...document.querySelectorAll('.stat-grid button')].map((b) =>
      b.innerText.replace(/\s+/g, ' ').trim(),
    ),
  );
  results.departmentCards = cards;

  // Read the real employee data so assertions are derived, not hardcoded.
  const employees = await page.evaluate(async () => {
    const r = await fetch('/api/employees');
    return (await r.json()).map((e) => ({ name: e.name, department: e.department }));
  });

  const deptNames = [...new Set(employees.map((e) => e.department))];
  results.perDepartment = {};

  for (const dept of deptNames) {
    // Navigate back to Departments for each case (also proves repeat navigation).
    // eslint-disable-next-line no-await-in-loop
    await page.goto('http://127.0.0.1:8080/#/departments', { waitUntil: 'networkidle' });
    // eslint-disable-next-line no-await-in-loop
    await page.waitForTimeout(700);

    // eslint-disable-next-line no-await-in-loop
    await page.getByRole('button', { name: new RegExp(`^${dept}`, 'i') }).first().click();
    // eslint-disable-next-line no-await-in-loop
    await page.waitForTimeout(900);

    // eslint-disable-next-line no-await-in-loop
    const state = await page.evaluate(() => {
      const sel = document.querySelector('#filter-department');
      const table = document.querySelector('table');
      const rows = table
        ? [...table.querySelectorAll('tbody tr')].map((r) =>
          r.innerText.replace(/\s+/g, ' ').trim(),
        )
        : [];
      return { filterValue: sel?.value ?? null, rows };
    });

    const expected = employees.filter((e) => e.department === dept).map((e) => e.name);
    const allNames = employees.map((e) => e.name);
    const unexpected = allNames.filter((n) => !expected.includes(n));
    const leaked = unexpected.filter((n) => state.rows.some((r) => r.includes(n)));

    results.perDepartment[dept] = {
      filterValue: state.filterValue,
      filterMatchesCard: state.filterValue === dept,
      expected,
      rowCount: state.rows.length,
      leakedEmployees: leaked,
      pass: state.filterValue === dept && leaked.length === 0 && state.rows.length === expected.length,
    };
  }

  // Confirm search + clear-filters still work while a department filter is set.
  await page.goto('http://127.0.0.1:8080/#/departments', { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: /^devops/i }).first().click();
  await page.waitForTimeout(800);

  await page.getByLabel('Search employees').fill('zzz-no-match-zzz');
  await page.waitForTimeout(500);
  const emptyAfterSearch = await page.evaluate(
    () => document.body.innerText.includes('No matching employees'),
  );

  await page.getByLabel('Search employees').fill('');
  await page.waitForTimeout(400);
  const rowsRestored = await page.evaluate(
    () => document.querySelectorAll('table tbody tr').length,
  );

  // Clear filters should reset the department selection too.
  const clearBtn = page.getByRole('button', { name: /clear filters/i });
  const hadClear = (await clearBtn.count()) > 0;
  if (hadClear) {
    await clearBtn.first().click();
    await page.waitForTimeout(500);
  }
  const afterClear = await page.evaluate(() => ({
    filterValue: document.querySelector('#filter-department')?.value ?? null,
    rowCount: document.querySelectorAll('table tbody tr').length,
  }));

  results.searchAndClear = {
    emptyAfterSearch,
    rowsRestored,
    hadClearButton: hadClear,
    afterClear,
    totalEmployees: employees.length,
  };

  return results;
}