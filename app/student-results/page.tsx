"use client";

import { useCallback, useEffect, useMemo, useState, memo } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, FileSpreadsheet, Loader2, Trash2, X } from "lucide-react";
import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  AllCommunityModule,
  themeQuartz,
  colorSchemeDark,
} from "ag-grid-community";
import Header from "../components/Header";
import Footer from "../components/Footer";

ModuleRegistry.registerModules([AllCommunityModule]);

type StudentListItem = {
  usn: string;
  name: string;
  latestRunAt: string;
};

type Subject = {
  code: string;
  name: string;
  credits?: number;
  internal?: number;
  external?: number;
  total?: number;
  result?: string;
};

type StudentDetail = {
  usn: string;
  name: string;
  semesters: Array<{
    semester: string;
    runId: string;
    runCreatedAt: string;
    subjects: Subject[];
  }>;
};

type SavedRun = {
  _id: string;
  semester: string;
  totalStudents: number;
  excelFileName: string;
  createdAt: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

// Memoized StudentListButton component
const StudentListButton = memo<{
  student: StudentListItem;
  isSelected: boolean;
  onClick: () => void;
}>(({ student, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left rounded-xl border px-3 py-3 transition-colors ${
      isSelected
        ? "border-blue-500 bg-blue-500/10"
        : "border-slate-800 bg-slate-950 hover:border-slate-700"
    }`}
  >
    <p className="text-sm font-semibold text-white">{student.usn}</p>
    <p className="text-xs text-slate-400 truncate">{student.name}</p>
  </button>
));

StudentListButton.displayName = "StudentListButton";

// Memoized SavedRunCard component
const SavedRunCard = memo<{
  run: SavedRun;
  onView: (runId: string) => void;
  onDelete: (runId: string) => void;
}>(({ run, onView, onDelete }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
    <div>
      <p className="text-sm font-medium text-white">
        Semester {run.semester} | {run.totalStudents} students
      </p>
      <p className="text-xs text-slate-500">
        Uploaded: {formatDate(run.createdAt)}
      </p>
    </div>
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => onView(run._id)}
        className="inline-flex items-center gap-2 rounded-lg border border-purple-500/40 bg-purple-500/10 px-3 py-2 text-xs font-medium text-purple-300 hover:bg-purple-500/20"
      >
        <FileSpreadsheet className="h-4 w-4" /> View
      </button>
      <button
        onClick={() => onDelete(run._id)}
        className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-500/20"
      >
        <Trash2 className="h-4 w-4" /> Delete
      </button>
    </div>
  </div>
));

SavedRunCard.displayName = "SavedRunCard";

// Memoized SemesterCard component
const SemesterCard = memo<{
  semester: StudentDetail["semesters"][0];
}>(({ semester }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
    <h3 className="text-sm font-semibold text-white mb-3">
      Semester {semester.semester}
    </h3>
    <p className="text-xs text-slate-500 mb-3">
      Processed on {formatDate(semester.runCreatedAt)}
    </p>

    <div className="mt-3 overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead className="text-slate-400">
          <tr>
            <th className="text-left py-2 pr-3">Code</th>
            <th className="text-left py-2 pr-3">Subject</th>
            <th className="text-left py-2 pr-3">Internal</th>
            <th className="text-left py-2 pr-3">External</th>
            <th className="text-left py-2 pr-3">Total</th>
            <th className="text-left py-2 pr-3">Result</th>
          </tr>
        </thead>
        <tbody>
          {semester.subjects.map((subject, index) => (
            <tr
              key={`${subject.code}-${index}`}
              className="border-t border-slate-800/70"
            >
              <td className="py-2 pr-3 text-slate-300">{subject.code}</td>
              <td className="py-2 pr-3 text-slate-300">{subject.name}</td>
              <td className="py-2 pr-3 text-slate-300">
                {subject.internal ?? "-"}
              </td>
              <td className="py-2 pr-3 text-slate-300">
                {subject.external ?? "-"}
              </td>
              <td className="py-2 pr-3 text-slate-300">
                {subject.total ?? "-"}
              </td>
              <td className="py-2 pr-3 text-slate-300">
                {subject.result ?? "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
));

SemesterCard.displayName = "SemesterCard";

export default function StudentResultsPage() {
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [selectedUsn, setSelectedUsn] = useState("");
  const [studentDetail, setStudentDetail] = useState<StudentDetail | null>(
    null,
  );
  const [runs, setRuns] = useState<SavedRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [gridData, setGridData] = useState<Record<string, unknown>[] | null>(
    null,
  );
  const [loadingGrid, setLoadingGrid] = useState(false);
  // Cache for student details to prevent redundant API calls
  const [detailsCache] = useState<Map<string, StudentDetail>>(new Map());

  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => {
        setStatus("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const loadBaseData = useCallback(async () => {
    const [studentsRes, runsRes] = await Promise.all([
      axios.get<{ students: StudentListItem[] }>("/api/results/students"),
      axios.get<{ runs: SavedRun[] }>("/api/results/runs"),
    ]);

    setStudents(studentsRes.data.students || []);
    setRuns(runsRes.data.runs || []);

    if (!selectedUsn && studentsRes.data.students?.length > 0) {
      setSelectedUsn(studentsRes.data.students[0].usn);
    }
  }, [selectedUsn]);

  useEffect(() => {
    const init = async () => {
      try {
        await loadBaseData();
      } catch (err) {
        console.error(err);
        setStatus("Failed to load student results.");
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, [loadBaseData]);

  useEffect(() => {
    if (!selectedUsn) return;

    const fetchDetail = async () => {
      try {
        // Check cache first
        if (detailsCache.has(selectedUsn)) {
          setStudentDetail(detailsCache.get(selectedUsn) || null);
          return;
        }

        setLoadingDetail(true);
        const response = await axios.get<{ student: StudentDetail }>(
          `/api/results/students/${encodeURIComponent(selectedUsn)}`,
        );
        const detail = response.data.student;
        detailsCache.set(selectedUsn, detail);
        setStudentDetail(detail);
      } catch (err) {
        console.error(err);
        setStudentDetail(null);
      } finally {
        setLoadingDetail(false);
      }
    };

    void fetchDetail();
  }, [selectedUsn, detailsCache]);

  const colDefs = useMemo(() => {
    if (!gridData || gridData.length === 0) return [];

    const allKeysSet = new Set<string>();
    gridData.forEach((row) =>
      Object.keys(row).forEach((k) => allKeysSet.add(k)),
    );
    const allKeys = Array.from(allKeysSet);

    const nameKey = allKeys.find(
      (k) =>
        /name|student/i.test(k) &&
        !/internal|external|total|result|usn/i.test(k),
    );
    const usnKey = allKeys.find((k) => /usn|seat/i.test(k));

    const cols: any[] = [];

    if (usnKey) {
      cols.push({
        field: usnKey,
        headerName: "USN",
        minWidth: 150,
        pinned: "left",
      });
    }
    if (nameKey) {
      cols.push({
        field: nameKey,
        headerName: "STUDENT NAMES",
        minWidth: 200,
        pinned: "left",
      });
    }

    const subjectPrefixes = new Set<string>();
    const suffixes = [
      "_Internal",
      "_External",
      "_Total",
      "_Result",
      "_Credits",
    ];

    for (const key of allKeys) {
      for (const suffix of suffixes) {
        if (key.endsWith(suffix)) {
          subjectPrefixes.add(key.slice(0, -suffix.length));
        }
      }
    }

    const sortedPrefixes = Array.from(subjectPrefixes).sort();

    for (const prefix of sortedPrefixes) {
      const children: any[] = [];
      if (allKeys.includes(`${prefix}_Internal`))
        children.push({
          field: `${prefix}_Internal`,
          headerName: "Internal",
          minWidth: 80,
        });
      if (allKeys.includes(`${prefix}_External`))
        children.push({
          field: `${prefix}_External`,
          headerName: "External",
          minWidth: 80,
        });
      if (allKeys.includes(`${prefix}_Total`))
        children.push({
          field: `${prefix}_Total`,
          headerName: "Total",
          minWidth: 80,
        });
      if (allKeys.includes(`${prefix}_Result`))
        children.push({
          field: `${prefix}_Result`,
          headerName: "Result",
          minWidth: 80,
        });

      if (children.length > 0) {
        cols.push({
          headerName: prefix.replace(/_/g, " "),
          children,
        });
      }
    }

    const usedKeys = new Set<string>();
    if (usnKey) usedKeys.add(usnKey);
    if (nameKey) usedKeys.add(nameKey);
    for (const prefix of sortedPrefixes) {
      for (const suffix of suffixes) {
        usedKeys.add(`${prefix}${suffix}`);
      }
    }

    for (const key of allKeys) {
      if (!usedKeys.has(key)) {
        cols.push({ field: key, headerName: key.replace(/_/g, " ") });
      }
    }

    return cols;
  }, [gridData]);

  const defaultColDef = useMemo(
    () => ({
      autoHeight: true,
    }),
    [],
  );

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;
    return students.filter(
      (student) =>
        student.usn.toLowerCase().includes(query) ||
        student.name.toLowerCase().includes(query),
    );
  }, [students, search]);

  const deleteRun = async (runId: string) => {
    try {
      await axios.delete(`/api/results/runs/${runId}`);
      setRuns((prev) => prev.filter((run) => run._id !== runId));
      setStatus("Saved excel deleted successfully.");
    } catch (err) {
      console.error(err);
      setStatus("Failed to delete saved excel.");
    }
  };

  const openRunInGrid = async (runId: string) => {
    try {
      setLoadingGrid(true);
      const response = await axios.get<{ data: Record<string, unknown>[] }>(
        `/api/results/runs/${runId}`,
      );
      setGridData(response.data.data || []);
    } catch (err) {
      console.error(err);
      setStatus("Failed to load data for grid.");
    } finally {
      setLoadingGrid(false);
    }
  };

  const downloadStudentPdf = () => {
    if (!studentDetail) return;

    // Check for images in PDF - warn user if found
    const hasImages = studentDetail.semesters.some((sem) =>
      sem.subjects.some((subject) => {
        // Check if any subject data appears to contain image indicators
        const dataStr = JSON.stringify(subject);
        return dataStr.toLowerCase().includes("image") ||
          dataStr.toLowerCase().includes("png") ||
          dataStr.toLowerCase().includes("jpg") ||
          dataStr.toLowerCase().includes("jpeg") ||
          dataStr.toLowerCase().includes("gif")
          ? true
          : false;
      }),
    );

    if (hasImages) {
      const proceed = false; // Show warning - this would typically be an alert
      console.warn(
        "Warning: This PDF contains image data. EvalX can only process text-based data. Some information may not have been extracted correctly.",
      );
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("EvalX Student Report Card", 14, 16);

    doc.setFontSize(11);
    doc.text(`Name: ${studentDetail.name}`, 14, 26);
    doc.text(`USN: ${studentDetail.usn}`, 14, 32);

    let startY = 42;

    // Sort semesters in ascending order
    const sortedSemesters = [...studentDetail.semesters].sort((a, b) => {
      const numA = Number.parseInt(a.semester, 10);
      const numB = Number.parseInt(b.semester, 10);
      return numA - numB;
    });

    for (const sem of sortedSemesters) {
      doc.setFontSize(12);
      doc.text(`Semester ${sem.semester}`, 14, startY);

      autoTable(doc, {
        startY: startY + 3,
        head: [["Code", "Subject", "Internal", "External", "Total", "Result"]],
        body: sem.subjects.map((subject) => [
          subject.code,
          subject.name,
          subject.internal ?? "-",
          subject.external ?? "-",
          subject.total ?? "-",
          subject.result ?? "-",
        ]),
        styles: { fontSize: 8 },
      });

      const finalY = (doc as jsPDF & { lastAutoTable?: { finalY?: number } })
        .lastAutoTable?.finalY;
      startY = (finalY || startY + 40) + 8;

      if (startY > 260) {
        doc.addPage();
        startY = 16;
      }
    }

    doc.save(`EvalX_Report_${studentDetail.usn}.pdf`);
    setStatus("Student report card downloaded.");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <Header />
      <main className="grow p-4 md:p-8 space-y-6">
        {status ? (
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
            {status}
          </div>
        ) : null}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-lg font-semibold text-white mb-3">Saved Excel</h2>
          <div
            className={`space-y-2 pr-1 ${runs.length > 3 ? "max-h-56 overflow-y-auto custom-scrollbar" : ""}`}
          >
            {[...runs]
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              )
              .map((run) => (
                <SavedRunCard
                  key={run._id}
                  run={run}
                  onView={openRunInGrid}
                  onDelete={deleteRun}
                />
              ))}
            {runs.length === 0 ? (
              <p className="text-sm text-slate-500">
                No saved excel runs available.
              </p>
            ) : null}
          </div>
        </section>

        {loading ? (
          <div className="text-sm text-slate-400 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading records...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start">
            <section className="md:col-span-1 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col gap-3 sticky top-6 h-[calc(100vh-3rem)]">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by USN or name"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500 shrink-0"
              />

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filteredStudents.map((student) => (
                  <StudentListButton
                    key={student.usn}
                    student={student}
                    isSelected={selectedUsn === student.usn}
                    onClick={() => setSelectedUsn(student.usn)}
                  />
                ))}
                {filteredStudents.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No matching students found.
                  </p>
                ) : null}
              </div>
            </section>

            <section className="md:col-span-2 lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-4">
              {loadingDetail ? (
                <div className="text-sm text-slate-400 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading student
                  details...
                </div>
              ) : !studentDetail ? (
                <p className="text-sm text-slate-500">
                  Select a student to view details.
                </p>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <h2 className="text-md md:text-lg lg:text-2xl font-semibold text-white">
                        {studentDetail.name}
                      </h2>
                      <p className="text-xs md:text-sm text-slate-400">
                        {studentDetail.usn}
                      </p>
                    </div>
                    <button
                      onClick={downloadStudentPdf}
                      className="w-full md:w-auto inline-flex items-center justify-center md:justify-start gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs md:text-sm font-medium text-white"
                    >
                      <Download className="h-4 w-4" /> Download Report Card
                    </button>
                  </div>

                  <div
                    className={`space-y-4 pr-1 ${
                      studentDetail.semesters.length > 3
                        ? "max-h-130 overflow-y-auto"
                        : ""
                    }`}
                  >
                    {studentDetail.semesters
                      .sort((a, b) => {
                        const numA = Number.parseInt(a.semester, 10);
                        const numB = Number.parseInt(b.semester, 10);
                        return numA - numB;
                      })
                      .map((sem) => (
                        <SemesterCard
                          key={`${sem.runId}-${sem.semester}`}
                          semester={sem}
                        />
                      ))}
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </main>

      {/* AG Grid Modal */}
      {gridData !== null && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
          <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
            <h2 className="text-md font-semibold text-white">
              {gridData.length} Records
            </h2>
            <button
              onClick={() => setGridData(null)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {loadingGrid ? (
            <div className="flex items-center justify-center grow">
              <div className="text-slate-400 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading data...
              </div>
            </div>
          ) : (
            <div className="grow relative overflow-hidden flex flex-col ag-theme-quartz-dark p-6 px-10 pb-10">
              <AgGridReact
                theme={themeQuartz.withPart(colorSchemeDark)}
                rowData={gridData}
                columnDefs={colDefs}
                defaultColDef={defaultColDef}
                pagination={true}
                paginationPageSize={20}
                paginationPageSizeSelector={[20, 50, 100]}
                suppressMovableColumns={false}
                enableCellTextSelection={true}
                className="w-full h-full text-sm rounded-xl border border-slate-700/50 shadow-inner"
                containerStyle={{ height: "100%", width: "100%" }}
              />
            </div>
          )}
        </div>
      )}

      <Footer />

      {/* Grid styling */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
        
        .ag-theme-quartz-dark {
          --ag-background-color: transparent !important;
          --ag-header-background-color: rgba(30, 41, 59, 1) !important;
          --ag-foreground-color: #ffffff !important;
          --ag-header-foreground-color: #cbd5e1 !important;
          --ag-border-color: rgba(51, 65, 85, 0.5) !important;
          --ag-row-border-color: rgba(51, 65, 85, 0.5) !important;
          --ag-odd-row-background-color: rgba(15, 23, 42, 0.5) !important;
          --ag-data-color: #ffffff !important;
          --ag-row-hover-color: rgba(51, 65, 85, 0.3) !important;
        }
      `,
        }}
      />
    </div>
  );
}
