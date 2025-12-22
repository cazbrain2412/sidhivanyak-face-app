import { computeEmployeeSummary } from "./attendanceUtils";

/**
 * Exports filtered employees to CSV
 */
export function exportAttendanceCSV(filteredEmployees) {
  let csv = "Employee,Present,Absent\n";

  filteredEmployees.forEach((emp) => {
    const s = computeEmployeeSummary(emp);
    csv += `${emp.name},${s.present},${s.absent}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "attendance_report.csv";
  a.click();

  URL.revokeObjectURL(url);
}

