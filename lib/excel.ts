import * as xlsx from "xlsx";
import {
  RawResultRow,
  getStudentUsn,
  getStudentName,
  parseSubjects,
  ParsedSubject,
} from "./results";

export function createFormattedExcelWorkbook(
  results: RawResultRow[],
): xlsx.WorkBook {
  const subjectMap = new Map<string, ParsedSubject>();

  // 1. Find all unique subjects
  for (const row of results) {
    const subjects = parseSubjects(row);
    for (const sub of subjects) {
      if (!subjectMap.has(sub.code)) {
        subjectMap.set(sub.code, sub);
      }
    }
  }

  // Sort subjects by code to maintain consistent order
  const uniqueSubjects = Array.from(subjectMap.values()).sort((a, b) =>
    a.code.localeCompare(b.code),
  );

  const aoa: any[][] = [];

  // Row 1: Merged Title Row
  const titleRow: any[] = ["SL NO", "USN", "STUDENT NAMES"];
  for (const sub of uniqueSubjects) {
    titleRow.push(`${sub.name}\n${sub.code}`);
    titleRow.push("", "", ""); // empty cells for the merge
  }
  aoa.push(titleRow);

  // Row 2: Sub-headers
  const subHeaderRow: any[] = ["", "", ""]; // SL NO, USN, STUDENT NAMES will be merged from row 1
  for (const _ of uniqueSubjects) {
    subHeaderRow.push("CIE", "SEE", "Total", "Result");
  }
  aoa.push(subHeaderRow);

  // Row 3 onwards: Data
  let slNo = 1;
  const sortedResults = [...results].sort((a, b) => {
    return getStudentUsn(a).localeCompare(getStudentUsn(b));
  });

  for (const row of sortedResults) {
    const usn = getStudentUsn(row);
    const name = getStudentName(row);

    const dataRow: any[] = [slNo++, usn, name];

    const studentSubjects = parseSubjects(row).reduce(
      (acc, sub) => {
        acc[sub.code] = sub;
        return acc;
      },
      {} as Record<string, ParsedSubject>,
    );

    for (const sub of uniqueSubjects) {
      const stuSub = studentSubjects[sub.code];
      if (stuSub) {
        dataRow.push(
          stuSub.internal ?? "-",
          stuSub.external ?? "-",
          stuSub.total ?? "-",
          stuSub.result ?? "-",
        );
      } else {
        dataRow.push("-", "-", "-", "-");
      }
    }
    aoa.push(dataRow);
  }

  // Create sheet
  const ws = xlsx.utils.aoa_to_sheet(aoa);

  // Define merges
  const merges: xlsx.Range[] = [];

  // Merge A1:A2 (SL NO)
  merges.push({ s: { r: 0, c: 0 }, e: { r: 1, c: 0 } });
  // Merge B1:B2 (USN)
  merges.push({ s: { r: 0, c: 1 }, e: { r: 1, c: 1 } });
  // Merge C1:C2 (STUDENT NAMES)
  merges.push({ s: { r: 0, c: 2 }, e: { r: 1, c: 2 } });

  // Merge each subject block D1:G1, H1:K1, etc.
  let colIdx = 3;
  for (let i = 0; i < uniqueSubjects.length; i++) {
    merges.push({ s: { r: 0, c: colIdx }, e: { r: 0, c: colIdx + 3 } });
    colIdx += 4;
  }

  ws["!merges"] = merges;

  // Set column widths for better readability
  const cols = [
    { wch: 6 }, // SL NO
    { wch: 14 }, // USN
    { wch: 30 }, // STUDENT NAMES
  ];
  for (let i = 0; i < uniqueSubjects.length; i++) {
    cols.push({ wch: 5 }, { wch: 5 }, { wch: 5 }, { wch: 6 }); // CIE, SEE, Total, Result
  }
  ws["!cols"] = cols;

  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "Student Marks");

  return wb;
}
