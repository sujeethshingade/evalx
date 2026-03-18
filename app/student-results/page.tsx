"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, FileSpreadsheet, Loader2, Trash2, X } from "lucide-react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
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
        setLoadingDetail(true);
        const response = await axios.get<{ student: StudentDetail }>(
          `/api/results/students/${encodeURIComponent(selectedUsn)}`,
        );
        setStudentDetail(response.data.student);
      } catch (err) {
        console.error(err);
        setStudentDetail(null);
      } finally {
        setLoadingDetail(false);
      }
    };

    void fetchDetail();
  }, [selectedUsn]);

  const colDefs = useMemo(() => {
    if (!gridData || gridData.length === 0) return [];
    return Object.keys(gridData[0]).map((key) => ({
      field: key,
      flex: 1,
      minWidth: 120,
      filter: false,
      sortable: true,
      resizable: true,
    }));
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

  const downloadRunExcel = async (runId: string, fileName: string) => {
    try {
      setStatus("Downloading excel...");
      const response = await axios.get(`/api/results/runs/${runId}/excel`, {
        responseType: "blob",
      });

      const blobUrl = window.URL.createObjectURL(response.data as Blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(blobUrl);
      setStatus("Excel downloaded successfully.");
    } catch (err) {
      console.error(err);
      setStatus("Failed to download excel.");
    }
  };

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

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("EvalX Student Report Card", 14, 16);

    doc.setFontSize(11);
    doc.text(`Name: ${studentDetail.name}`, 14, 26);
    doc.text(`USN: ${studentDetail.usn}`, 14, 32);

    let startY = 42;

    for (const sem of studentDetail.semesters) {
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
          <h2 className="text-lg font-semibold text-white mb-3">
            Saved Excel
          </h2>
          <div className="space-y-2">
            {runs.map((run) => (
              <div
                key={run._id}
                className="rounded-xl border border-slate-800 bg-slate-950 p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
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
                    onClick={() => openRunInGrid(run._id)}
                    className="inline-flex items-center gap-2 rounded-lg border border-purple-500/40 bg-purple-500/10 px-3 py-2 text-xs font-medium text-purple-300 hover:bg-purple-500/20"
                  >
                    <FileSpreadsheet className="h-4 w-4" /> View
                  </button>
                  <button
                    onClick={() => downloadRunExcel(run._id, run.excelFileName)}
                    className="inline-flex items-center gap-2 rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-300 hover:bg-blue-500/20"
                  >
                    <Download className="h-4 w-4" /> Download
                  </button>
                  <button
                    onClick={() => deleteRun(run._id)}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-500/20"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              </div>
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
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            <section className="xl:col-span-1 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by USN or name"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />

              <div className="max-h-140 overflow-y-auto space-y-2 pr-1">
                {filteredStudents.map((student) => (
                  <button
                    key={student.usn}
                    onClick={() => setSelectedUsn(student.usn)}
                    className={`w-full text-left rounded-xl border px-3 py-3 transition-colors ${
                      selectedUsn === student.usn
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-800 bg-slate-950 hover:border-slate-700"
                    }`}
                  >
                    <p className="text-sm font-semibold text-white">
                      {student.usn}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {student.name}
                    </p>
                  </button>
                ))}
                {filteredStudents.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No matching students found.
                  </p>
                ) : null}
              </div>
            </section>

            <section className="xl:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-4">
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
                      <h2 className="text-xl font-semibold text-white">
                        {studentDetail.name}
                      </h2>
                      <p className="text-sm text-slate-400">
                        {studentDetail.usn}
                      </p>
                    </div>
                    <button
                      onClick={downloadStudentPdf}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-medium text-white"
                    >
                      <Download className="h-4 w-4" /> Download Report Card
                    </button>
                  </div>

                  <div className="space-y-4 max-h-130 overflow-y-auto pr-1">
                    {studentDetail.semesters.map((sem) => (
                      <div
                        key={`${sem.runId}-${sem.semester}`}
                        className="rounded-xl border border-slate-800 bg-slate-950 p-3"
                      >
                        <h3 className="text-sm font-semibold text-white mb-3">
                          Semester {sem.semester}
                        </h3>
                        <p className="text-xs text-slate-500 mb-3">
                          Processed on {formatDate(sem.runCreatedAt)}
                        </p>

                        <div className="mt-3 overflow-x-auto">
                          <table className="min-w-full text-xs">
                            <thead className="text-slate-400">
                              <tr>
                                <th className="text-left py-2 pr-3">Code</th>
                                <th className="text-left py-2 pr-3">Subject</th>
                                <th className="text-left py-2 pr-3">Int</th>
                                <th className="text-left py-2 pr-3">Ext</th>
                                <th className="text-left py-2 pr-3">Total</th>
                                <th className="text-left py-2 pr-3">Result</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sem.subjects.map((subject, index) => (
                                <tr
                                  key={`${subject.code}-${index}`}
                                  className="border-t border-slate-800/70"
                                >
                                  <td className="py-2 pr-3 text-slate-300">
                                    {subject.code}
                                  </td>
                                  <td className="py-2 pr-3 text-slate-300">
                                    {subject.name}
                                  </td>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-6xl h-[80vh] bg-slate-950 rounded-2xl border border-slate-800 flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-semibold text-white">
                Excel Data Viewer
              </h2>
              <button
                onClick={() => setGridData(null)}
                className="text-slate-400 hover:text-white"
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
              <div className="grow relative overflow-hidden">
                <AgGridReact
                  columnDefs={colDefs}
                  rowData={gridData}
                  defaultColDef={defaultColDef}
                  containerStyle={{ height: "100%", width: "100%" }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
