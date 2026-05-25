"use client";

import React, { useState, useRef, useMemo } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  Download,
  Copy,
  RefreshCw,
  Layers,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Mail,
  Loader2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as xlsx from "xlsx";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";

// AG Grid imports
import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  AllCommunityModule,
  themeQuartz,
  colorSchemeDark,
} from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);

import { createFormattedExcelWorkbook } from "../../lib/excel";

type SubjectInfo = { code: string; name: string; credits: number };

const KNOWN_SUBJECTS_MAP: Record<string, SubjectInfo[]> = {
  "1st": [
    { code: "BMATS101", name: "Mathematics for CSE Stream-I", credits: 4 },
    { code: "BCHES102", name: "Chemistry for CSE Stream", credits: 4 },
    {
      code: "BCEDK103",
      name: "Computer-Aided Engineering Drawing",
      credits: 3,
    },
    {
      code: "BESCK104B",
      name: "Introduction to Electrical Engineering",
      credits: 3,
    },
    { code: "BETCK105I", name: "Introduction to Cyber Security", credits: 3 },
    { code: "BSFHK158", name: "Scientific Foundations of Health", credits: 1 },
    {
      code: "BPWSK106",
      name: "Professional Writing Skills in English",
      credits: 1,
    },
    { code: "BKSKK107", name: "Samskrutika Kannada", credits: 1 },
  ],
  "2nd": [
    { code: "BMATS201", name: "Mathematics-II for CSE Stream", credits: 4 },
    { code: "BPHYS202", name: "Applied Physics for CSE stream", credits: 4 },
    { code: "BPOPS203", name: "Principles of Programming Using C", credits: 3 },
    {
      code: "BESCK204C",
      name: "Introduction to Electronics Communication",
      credits: 3,
    },
    {
      code: "BPLCK205B",
      name: "Introduction to Python Programming",
      credits: 3,
    },
    { code: "BIDTK258", name: "Innovation and Design Thinking", credits: 1 },
    { code: "BENGK206", name: "Communicative English", credits: 1 },
    { code: "BICOK207", name: "Indian Constitution", credits: 1 },
  ],
  "3rd": [
    { code: "BCS301", name: "Mathematics for Computer Science", credits: 4 },
    {
      code: "BCS302",
      name: "Digital Design & Computer Organization",
      credits: 4,
    },
    { code: "BCS303", name: "Operating Systems", credits: 4 },
    { code: "BCS304", name: "Data Structures and Applications", credits: 3 },
    { code: "BCSL305", name: "Data Structures Lab", credits: 1 },
    { code: "BCS358D", name: "Data Visualization with Python", credits: 1 },
    { code: "BPEK359", name: "Physical Education", credits: 0 },
    {
      code: "BCS306A",
      name: "Object Oriented Programming with Java",
      credits: 3,
    },
    { code: "BSCK307", name: "Social Connect and Responsibility", credits: 1 },
  ],
  "4th": [
    { code: "BCS401", name: "ANALYSIS & DESIGN OF ALGORITHMS", credits: 3 },
    { code: "BIS402", name: "ADVANCED JAVA", credits: 4 },
    { code: "BCS403", name: "DATABASE MANAGEMENT SYSTEMS", credits: 4 },
    {
      code: "BCSL404",
      name: "ANALYSIS & DESIGN OF ALGORITHMS LAB",
      credits: 1,
    },
    { code: "BCS405D", name: "LINEAR ALGEBRA", credits: 3 },
    { code: "BCS456C", name: "UI/UX", credits: 1 },
    { code: "BPEK459", name: "PHYSICAL EDUCATION", credits: 0 },
    { code: "BBOC407", name: "BIOLOGY FOR COMPUTER ENGINEERS", credits: 2 },
    { code: "BUHK408", name: "UNIVERSAL HUMAN VALUES COURSE", credits: 1 },
  ],
  "5th": [
    {
      code: "BCS501",
      name: "SOFTWARE ENGINEERING AND PROJECT MANAGEMENT",
      credits: 3,
    },
    { code: "BCS515C", name: "UNIX SYSTEM PROGRAMMING", credits: 3 },
    { code: "BCS502", name: "COMPUTER NETWORKS", credits: 4 },
    { code: "BCS503", name: "THEORY OF COMPUTATION", credits: 4 },
    { code: "BAIL504", name: "DATA VISUALIZATION LAB", credits: 1 },
    { code: "BRMK557", name: "RESEARCH METHODOLOGY AND IPR", credits: 3 },
    { code: "BPEK559", name: "PHYSICAL EDUCATION", credits: 0 },
    {
      code: "BCS508",
      name: "ENVIRONMENTAL STUDIES AND E-WASTE MANAGEMENT",
      credits: 2,
    },
    { code: "BIS586", name: "MINI PROJECT", credits: 2 },
  ],
  "6th": [
    { code: "BIS601", name: "FULL STACK DEVELOPMENT", credits: 4 },
    { code: "BIS613D", name: "CLOUD COMPUTING AND SECURITY", credits: 3 },
    { code: "BCS602", name: "MACHINE LEARNING", credits: 4 },
    { code: "BME654B", name: "RENEWABLE ENERGY POWER PLANTS", credits: 3 },
    { code: "BCSL657D", name: "DEVOPS", credits: 1 },
    { code: "BPEK658", name: "PHYSICAL EDUCATION", credits: 0 },
    { code: "BCSL606", name: "MACHINE LEARNING LAB", credits: 1 },
    { code: "BIS685", name: "PROJECT PHASE I", credits: 2 },
    { code: "BIKS609", name: "INDIAN KNOWLEDGE SYSTEM", credits: 0 },
  ],
  "7th": [
    { code: "BIS701", name: "BIG DATA ANALYTICS", credits: 3 },
    { code: "BCS702", name: "PARALLEL COMPUTING", credits: 3 },
    { code: "BIS703", name: "INFORMATION & NETWORK SECURITY", credits: 3 },
    { code: "BIS786", name: "MAJOR PROJECT PHASE-II", credits: 4 },
    {
      code: "BME755A",
      name: "INTRODUCTION TO NON-TRADITIONAL MACHINING",
      credits: 3,
    },
    { code: "BIS714B", name: "SOFTWARE QUALITY ASSURANCE", credits: 3 },
    { code: "BAD714D", name: "SOCIAL NETWORK ANALYSIS", credits: 3 },
    { code: "BCS714A", name: "DEEP LEARNING", credits: 3 },
  ],
  "8th": [
    { code: "BIS801", name: "PEC", credits: 3 },
    { code: "BIS802", name: "OEC", credits: 3 },
    { code: "BIS803", name: "Internship", credits: 10 },
  ],
};

export default function ExtractMarks() {
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [semester, setSemester] = useState("");
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [results, setResults] = useState<Record<string, unknown>[] | null>(
    null,
  );
  const [customSubjects, setCustomSubjects] = useState<SubjectInfo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [extractError, setExtractError] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [excelFileUrl, setExcelFileUrl] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(
        (f) => f.type === "application/pdf" || f.name.endsWith(".pdf"),
      );
      setFiles((prev) => [...droppedFiles, ...prev]);
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files).filter(
        (f) => f.type === "application/pdf" || f.name.endsWith(".pdf"),
      );
      setFiles((prev) => [...selectedFiles, ...prev]);
    }
  };
  const removeFile = (index: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== index));

  // Config handlers
  const handleSemesterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sem = e.target.value;
    setSemester(sem);
    setCustomSubjects([...(KNOWN_SUBJECTS_MAP[sem] || [])]);
  };

  // Processing
  const processFiles = async () => {
    if (files.length === 0) return;
    setStep(3); // Move to Processing step
    setResults(null);

    const CHUNK_SIZE = 5;
    const totalChunks = Math.ceil(files.length / CHUNK_SIZE);
    setProgress({ current: 0, total: totalChunks });

    let allExtractedData: Record<string, unknown>[] = [];

    try {
      for (let i = 0; i < totalChunks; i++) {
        setProgress({ current: i + 1, total: totalChunks });

        const chunk = files.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        const formData = new FormData();

        chunk.forEach((file) => formData.append("files", file));

        // Convert array to dictionary format expected by backend
        const subjectsDict = customSubjects.reduce(
          (acc, curr) => {
            if (curr.code)
              acc[curr.code] = { name: curr.name, credits: curr.credits };
            return acc;
          },
          {} as Record<string, { name: string; credits: number }>,
        );
        formData.append("knownSubjects", JSON.stringify(subjectsDict));

        const response = await axios.post("/api/extract", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (response.data && response.data.data) {
          allExtractedData = [...allExtractedData, ...response.data.data];
        }
      }

      setSaveStatus("Saving extracted data...");
      try {
        const saveRes = await axios.post("/api/results/runs", {
          semester,
          results: allExtractedData,
        });
        if (saveRes.data?.run?.excelFileUrl) {
          setExcelFileUrl(saveRes.data.run.excelFileUrl);
        }
        setSaveStatus("Saved successfully. Available in student results.");
      } catch (saveError) {
        console.error("Failed to save extracted data:", saveError);
        setSaveStatus("Extraction completed, but auto-save failed.");
      }

      setResults(allExtractedData);
      setStep(4); // Move to Results step
    } catch (error) {
      console.error("Error processing files:", error);
      let errorMessage = `An error occurred while processing Batch ${progress?.current || 1}.`;
      if (axios.isAxiosError(error)) {
        const serverMsg =
          (error.response?.data?.message as string | undefined) ||
          (error.response?.data?.backendResponse as string | undefined);
        if (serverMsg) {
          errorMessage += `\n${serverMsg}`;
        } else if (error.message) {
          errorMessage += `\n${error.message}`;
        }
      }
      setExtractError(`${errorMessage} Please try again.`);
      setStep(2); // Fallback to Config step
    } finally {
      setProgress(null);
    }
  };

  // AG Grid config - prioritize name, internal, external, total, result columns
  const colDefs = useMemo(() => {
    if (!results || results.length === 0) return [];

    const allKeysSet = new Set<string>();
    results.forEach((row) =>
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
          headerName: "CIE",
          minWidth: 80,
        });
      if (allKeys.includes(`${prefix}_External`))
        children.push({
          field: `${prefix}_External`,
          headerName: "SEE",
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
  }, [results]);

  const defaultColDef = useMemo(() => {
    return {
      autoHeight: true,
    };
  }, []);

  const downloadExcel = () => {
    if (!results || results.length === 0) return;
    try {
      const workbook = createFormattedExcelWorkbook(results);
      xlsx.writeFile(workbook, `EvalX_Results_Sem_${semester}.xlsx`);
    } catch (err) {
      console.error("Failed to generate excel", err);
    }
  };

  const handleCopyLink = async () => {
    if (!results) return;

    setIsUploading(true);
    try {
      let finalUrl = excelFileUrl;
      // Fallback if Vercel blob URL was not saved automatically
      if (!finalUrl) {
        const { data } = await axios.post("/api/blob/upload", {
          results,
          semester,
        });
        finalUrl = data.url;
      }

      await navigator.clipboard.writeText(finalUrl);
      setCopyStatus("Copied to clipboard!");
      setTimeout(() => setCopyStatus(""), 3000);
    } catch (err) {
      setCopyStatus("Failed to copy link. Please try again.");
      setTimeout(() => setCopyStatus(""), 4000);
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEmailResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!results || !emailRecipient) return;
    setIsEmailing(true);
    try {
      await axios.post("/api/email/results", {
        results,
        semester,
        emailRecipient,
      });
      setEmailStatus("Sent successfully!");
      setTimeout(() => {
        setShowEmailModal(false);
        setEmailRecipient("");
        setEmailStatus("");
      }, 1500);
    } catch (err) {
      setEmailStatus("Failed to send email. Please try again.");
      console.error(err);
    } finally {
      setIsEmailing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-200">
      <Header />

      <main className="grow p-4 md:p-8 flex flex-col items-center w-full">
        {/* Step Indicator */}
        <div className="w-full max-w-xl mb-12 mt-4 shrink-0">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-800 -z-10 rounded-full" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-500 -z-10 rounded-full transition-all duration-500"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />

            {[
              { id: 1, label: "Upload" },
              { id: 2, label: "Configure" },
              { id: 3, label: "Process" },
              { id: 4, label: "Results" },
            ].map((s) => (
              <div
                key={s.id}
                className="flex flex-col items-center gap-2 bg-slate-950 px-2"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors duration-300 ${
                    step > s.id
                      ? "bg-blue-500 border-blue-500 text-white"
                      : step === s.id
                        ? "bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                        : "bg-slate-800 border-slate-700 text-slate-400"
                  }`}
                >
                  {step > s.id ? <CheckCircle className="w-6 h-6" /> : s.id}
                </div>
                <span
                  className={`text-xs md:text-sm font-medium ${step >= s.id ? "text-blue-400" : "text-slate-500"}`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-8xl relative z-10 w-full px-2 flex-1 pb-8">
          <AnimatePresence mode="wait">
            {/* STEP 1: UPLOAD */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6 pb-8"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-white/90 mb-2">
                    Upload Result PDFs
                  </h2>
                  <p className="text-xs md:text-sm text-slate-400">
                    Select or drop your PDF files here to begin extraction.
                  </p>
                </div>

                <div
                  className={`glass-card rounded-2xl p-10 transition-all duration-300 border-2 border-dashed ${isDragging ? "border-blue-500 bg-blue-500/10 scale-[1.02]" : "border-slate-700 hover:border-slate-500"}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 flex items-center justify-center mb-6 shadow-inner">
                      <Upload className="w-10 h-10 text-white/90" />
                    </div>
                    <input
                      type="file"
                      multiple
                      accept=".pdf"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 active:scale-95"
                    >
                      Browse Files
                    </button>
                    <p className="text-slate-500 mt-4 text-sm">
                      Or drag and drop PDFs here
                    </p>
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-400" />
                        Selected Files ({files.length})
                      </h3>
                      <button
                        onClick={() => setFiles([])}
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        Clear all
                      </button>
                    </div>

                    <div
                      className={`space-y-2 ${files.length > 5 ? "max-h-70 overflow-y-auto pr-2 custom-scrollbar" : ""}`}
                    >
                      {files.map((file, idx) => (
                        <div
                          key={`${file.name}-${idx}`}
                          className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-700/50"
                        >
                          <div className="flex items-center gap-3 truncate">
                            <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="text-sm truncate opacity-90">
                              {file.name}
                            </span>
                          </div>
                          <button
                            onClick={() => removeFile(idx)}
                            className="text-slate-500 hover:text-red-400 ml-4 shrink-0 transition-colors"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-8 pb-4">
                  <button
                    onClick={() => setStep(2)}
                    disabled={files.length === 0}
                    className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all flex items-center gap-2"
                  >
                    Next Step <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: CONFIGURATION */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6 max-w-8xl mx-auto pb-8"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    Configure Extraction
                  </h2>
                  <p className="text-xs md:text-sm text-slate-400">
                    Select semester and verify subjects to map the data
                    correctly.
                  </p>
                </div>

                <div className="glass-card rounded-2xl p-8">
                  <h3 className="text-xl font-medium mb-6 flex items-center gap-2">
                    <Layers className="w-6 h-6 text-blue-400" /> Semester
                    Details
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        Semester
                      </label>
                      <select
                        value={semester}
                        onChange={handleSemesterChange}
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow appearance-none"
                      >
                        <option value="" disabled>
                          Select a Semester
                        </option>
                        <option value="1st">1st Semester</option>
                        <option value="2nd">2nd Semester</option>
                        <option value="3rd">3rd Semester</option>
                        <option value="4th">4th Semester</option>
                        <option value="5th">5th Semester</option>
                        <option value="6th">6th Semester</option>
                        <option value="7th">7th Semester</option>
                        <option value="8th">8th Semester</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-sm font-medium text-slate-400">
                          Subject Mapping
                        </label>
                        <span className="text-xs font-semibold bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30">
                          {customSubjects.length} subjects
                        </span>
                      </div>

                      <div className="bg-slate-900/80 border border-slate-700 rounded-xl overflow-hidden shadow-inner">
                        <div className="p-4">
                          {semester === "" ? (
                            <p className="text-sm text-slate-500 text-center py-6">
                              Please select a semester above to view and
                              configure its subjects.
                            </p>
                          ) : customSubjects.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-6">
                              No predefined subjects for this semester. The
                              extractor will use regex to guess column headers.
                            </p>
                          ) : (
                            <div className="overflow-x-auto custom-scrollbar">
                              <table className="w-full text-left min-w-150">
                                <thead>
                                  <tr>
                                    <th className="pb-3 text-xs font-mono font-bold text-blue-400 w-1/4">
                                      Code
                                    </th>
                                    <th className="pb-3 text-xs font-mono font-bold text-blue-400">
                                      Subject Name
                                    </th>
                                    <th className="pb-3 text-xs font-mono font-bold text-blue-400 w-24">
                                      Credits
                                    </th>
                                    <th className="pb-3 w-12"></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {customSubjects.map((info, idx) => (
                                    <tr
                                      key={`idx-${idx}`}
                                      className="group hover:bg-slate-800/20 transition-colors"
                                    >
                                      <td className="py-1.5 pr-3">
                                        <input
                                          type="text"
                                          value={info.code}
                                          onChange={(e) => {
                                            const newSubjects = [
                                              ...customSubjects,
                                            ];
                                            newSubjects[idx].code =
                                              e.target.value.toUpperCase();
                                            setCustomSubjects(newSubjects);
                                          }}
                                          className="w-full bg-slate-800/80 border border-slate-700/50 hover:border-blue-500/50 focus:border-blue-500 rounded-md text-sm px-3 py-2 text-white outline-none transition-colors uppercase"
                                        />
                                      </td>
                                      <td className="py-1.5 pr-3">
                                        <input
                                          type="text"
                                          value={info.name}
                                          onChange={(e) => {
                                            const newSubjects = [
                                              ...customSubjects,
                                            ];
                                            newSubjects[idx].name =
                                              e.target.value;
                                            setCustomSubjects(newSubjects);
                                          }}
                                          className="w-full bg-slate-800/80 border border-slate-700/50 hover:border-blue-500/50 focus:border-blue-500 rounded-md text-sm px-3 py-2 text-white outline-none transition-colors"
                                        />
                                      </td>
                                      <td className="py-1.5 pr-3">
                                        <input
                                          type="number"
                                          value={info.credits}
                                          min={0}
                                          max={10}
                                          onChange={(e) => {
                                            const newSubjects = [
                                              ...customSubjects,
                                            ];
                                            newSubjects[idx].credits =
                                              parseInt(e.target.value) || 0;
                                            setCustomSubjects(newSubjects);
                                          }}
                                          className="w-full bg-slate-800/80 border border-slate-700/50 hover:border-blue-500/50 focus:border-blue-500 rounded-md text-sm px-3 py-2 text-white outline-none transition-colors"
                                        />
                                      </td>
                                      <td className="py-1.5">
                                        <button
                                          onClick={() => {
                                            const newSubjects =
                                              customSubjects.filter(
                                                (_, i) => i !== idx,
                                              );
                                            setCustomSubjects(newSubjects);
                                          }}
                                          className="p-2 rounded-md hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {semester !== "" && (
                            <button
                              onClick={() =>
                                setCustomSubjects([
                                  ...customSubjects,
                                  { code: "", name: "", credits: 0 },
                                ])
                              }
                              className="w-full py-3 border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-lg text-slate-400 flex items-center justify-center gap-2 hover:bg-slate-800/50 transition-all text-sm font-medium group mt-4!"
                            >
                              <Plus className="w-4 h-4 group-hover:text-blue-400 transition-colors" />
                              <span className="group-hover:text-white transition-colors">
                                Add Subject
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {extractError && (
                  <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                    {extractError}
                  </p>
                )}
                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" /> Back
                  </button>
                  <button
                    onClick={() => {
                      setExtractError("");
                      processFiles();
                    }}
                    disabled={semester === ""}
                    className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/20 disabled:shadow-none"
                  >
                    <RefreshCw className="w-5 h-5" /> Start Processing
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: PROCESSING */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 pb-8"
              >
                <div className="w-24 h-24 relative mb-12">
                  <div className="absolute inset-0 border-4 border-slate-800 rounded-full" />
                  <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-blue-400" />
                  </div>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  Extracting Data
                </h2>
                <p className="text-xs md:text-sm text-slate-400 mb-8 max-w-sm text-center">
                  Parsing {files.length} PDFs.
                </p>

                {progress && (
                  <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                    <div className="flex justify-between text-sm font-medium mb-2">
                      <span className="text-blue-400">
                        Batch {progress.current} of {progress.total}
                      </span>
                      <span className="text-slate-400">
                        {Math.round((progress.current / progress.total) * 100)}%
                      </span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-linear-to-r from-blue-500 to-blue-500"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(progress.current / progress.total) * 100}%`,
                        }}
                        transition={{ ease: "linear" }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 4: RESULTS */}
            {step === 4 && results && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 w-full pb-8"
              >
                <div className="glass-card rounded-2xl p-6 md:p-8">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-emerald-400 flex items-center gap-2 mb-1">
                        <CheckCircle className="w-5 h-5 md:w-6 md:h-6" />{" "}
                        Extraction Complete
                      </h2>
                      <p className="text-xs md:text-sm text-slate-400">
                        Found data for{" "}
                        <span className="text-white font-bold">
                          {results.length}
                        </span>{" "}
                        students across {files.length} files.
                      </p>
                      {saveStatus ? (
                        <p className="text-xs md:text-sm text-blue-300 mt-1">
                          {saveStatus}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-2 w-full md:w-auto">
                      {copyStatus && (
                        <p
                          className={`text-xs md:text-sm text-center font-medium ${
                            copyStatus.startsWith("Copied")
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {copyStatus}
                        </p>
                      )}
                      <div className="flex flex-col md:flex-row gap-2">
                        <button
                          onClick={handleCopyLink}
                          disabled={isUploading}
                          className="w-full md:w-auto px-4 md:px-6 py-2 md:py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm md:text-base font-medium rounded-xl transition-all border border-slate-700 flex items-center justify-center md:justify-start gap-2"
                        >
                          {isUploading ? (
                            <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                          ) : (
                            <Copy className="w-4 h-4 md:w-5 md:h-5" />
                          )}
                          {isUploading ? "Uploading..." : "Copy link"}
                        </button>
                        <button
                          onClick={() => setShowEmailModal(true)}
                          className="w-full md:w-auto px-4 md:px-6 py-2 md:py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm md:text-base font-medium rounded-xl transition-all shadow-lg flex items-center justify-center md:justify-start gap-2"
                        >
                          <Mail className="w-4 h-4 md:w-5 md:h-5" /> Email
                          Results
                        </button>
                        <button
                          onClick={downloadExcel}
                          className="w-full md:w-auto px-4 md:px-6 py-2 md:py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm md:text-base font-medium rounded-xl transition-all shadow-lg flex items-center justify-center md:justify-start gap-2"
                        >
                          <Download className="w-4 h-4 md:w-5 md:h-5" />{" "}
                          Download Excel
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* AG Grid Container */}
                  <div className="w-full border border-slate-700/50 rounded-xl overflow-hidden shadow-inner ag-theme-quartz-dark flex flex-col">
                    <AgGridReact
                      theme={themeQuartz.withPart(colorSchemeDark)}
                      rowData={results}
                      columnDefs={colDefs}
                      defaultColDef={defaultColDef}
                      pagination={true}
                      paginationPageSize={20}
                      paginationPageSizeSelector={[20, 50, 100]}
                      suppressMovableColumns={false}
                      enableCellTextSelection={true}
                      domLayout="autoHeight"
                      className="w-full text-sm"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Email Modal */}
        <AnimatePresence>
          {showEmailModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl w-full max-w-sm relative"
              >
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="absolute top-4 right-4 text-slate-500 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Send Results via Email
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                  Enter the recipient&apos;s email address. The Excel file will
                  be attached.
                </p>

                <form onSubmit={handleEmailResults} className="space-y-4">
                  <input
                    type="email"
                    required
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                    placeholder="recipient@university.edu"
                    className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-3 text-white outline-none"
                  />
                  {emailStatus && (
                    <p
                      className={`text-sm text-center font-medium ${
                        emailStatus.startsWith("Sent")
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {emailStatus}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={isEmailing || !emailRecipient}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {isEmailing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Mail className="w-5 h-5" />
                    )}
                    {isEmailing ? "Sending..." : "Send Email"}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />

      {/* Scrollbar styling */}
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
          max-width: 100%;
        }
      `,
        }}
      />
    </div>
  );
}
