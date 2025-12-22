/**
 * Calculates present / absent count for one employee
 */
export function computeEmployeeSummary(emp) {
  let present = 0;
  let absent = 0;

  Object.values(emp.attendance || {}).forEach((v) => {
    if (v === "P") present++;
    if (v === "A") absent++;
  });

  return { present, absent };
}

/**
 * Calculates global totals from filtered employees
 */
export function computeGlobalTotals(filteredEmployees) {
  return filteredEmployees.reduce(
    (acc, emp) => {
      const s = computeEmployeeSummary(emp);
      acc.present += s.present;
      acc.absent += s.absent;
      acc.employees += 1;
      return acc;
    },
    { present: 0, absent: 0, employees: 0 }
  );
}

