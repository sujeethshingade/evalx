"use client";

import React, { useState, useRef, useMemo } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Download, Loader2, RefreshCw, Layers, ArrowRight, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as xlsx from "xlsx";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";

// AG Grid imports
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);

const KNOWN_SUBJECTS_MAP: Record<string, Record<string, string>> = {
  "2nd": {},
  "4th": {
    "BCS401": "ANALYSIS & DESIGN OF ALGORITHMS",
    "BIS402": "ADVANCED JAVA",
    "BCS403": "DATABASE MANAGEMENT SYSTEMS",
    "BCSL404": "ANALYSIS & DESIGN OF ALGORITHMS LAB",
    "BBOC407": "BIOLOGY FOR COMPUTER ENGINEERS",
    "BUHK408": "UNIVERSAL HUMAN VALUES COURSE",
    "BNSK459": "NATIONAL SERVICE SCHEME",
    "BCS456C": "UI/UX",
    "BCS405D": "LINEAR ALGEBRA"
  },
  "5th": {
    "BCS501": "SOFTWARE ENGINEERING AND PROJECT MANAGEMENT",
    "BCS502": "COMPUTER NETWORKS",
    "BCS503": "THEORY OF COMPUTATION",
    "BAIL504": "DATA VISUALIZATION LAB",
    "BIS586": "MINI PROJECT",
    "BRMK557": "RESEARCH METHODOLOGY AND IPR",
    "BCS508": "ENVIRONMENTAL STUDIES AND E-WASTE MANAGEMENT",
    "BNSK559": "NATIONAL SERVICE SCHEME",
    "BCS515B": "ARTIFICIAL INTELLIGENCE"
  },
  "6th": {},
  "7th": {
    "BIS701": "BIG DATA ANALYTICS",
    "BCS702": "PARALLEL COMPUTING",
    "BIS703": "INFORMATION & NETWORK SECURITY",
    "BIS786": "MAJOR PROJECT PHASE-II",
    "BME755A": "INTRODUCTION TO NON-TRADITIONAL MACHINING",
    "BIS714B": "SOFTWARE QUALITY ASSURANCE",
    "BAD714D": "SOCIAL NETWORK ANALYSIS",
    "BCS714A": "DEEP LEARNING"
  }
};

export default function ExtractMarks() {
  const [step, setStep] = useState(1); // 1: Upload, 2: Config, 3: Processing, 4: Results
  
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [semester, setSemester] = useState("4th");
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [customSubjects, setCustomSubjects] = useState<Record<string, string>>(KNOWN_SUBJECTS_MAP["4th"]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === "application/pdf" || f.name.endsWith(".pdf"));
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files).filter(f => f.type === "application/pdf" || f.name.endsWith(".pdf"));
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };
  const removeFile = (index: number) => setFiles(prev => prev.filter((_, i) => i !== index));

  // Config handlers
  const handleSemesterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sem = e.target.value;
    setSemester(sem);
    setCustomSubjects({ ...KNOWN_SUBJECTS_MAP[sem] });
  };

  // Processing
  const processFiles = async () => {
    if (files.length === 0) return;
    setStep(3); // Move to Processing step
    setResults(null);
    
    const CHUNK_SIZE = 15; 
    const totalChunks = Math.ceil(files.length / CHUNK_SIZE);
    setProgress({ current: 0, total: totalChunks });
    
    let allExtractedData: any[] = [];
    
    try {
      for (let i = 0; i < totalChunks; i++) {
        setProgress({ current: i + 1, total: totalChunks });
        
        const chunk = files.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        const formData = new FormData();
        
        chunk.forEach(file => formData.append("files", file));
        formData.append("knownSubjects", JSON.stringify(customSubjects));
        
        const response = await axios.post('/api/extract', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (response.data && response.data.data) {
          allExtractedData = [...allExtractedData, ...response.data.data];
        }
      }
      setResults(allExtractedData);
      setStep(4); // Move to Results step
    } catch (error) {
      console.error("Error processing files:", error);
      alert(`An error occurred while processing Batch ${progress?.current || 1}. Please try again.`);
      setStep(2); // Fallback to Config step
    } finally {
      setProgress(null);
    }
  };

  // AG Grid config
  const colDefs = useMemo(() => {
    if (!results || results.length === 0) return [];
    return Object.keys(results[0]).map(key => ({
      field: key,
      flex: 1,
      minWidth: 150,
      filter: true,
      sortable: true,
      resizable: true,
    }));
  }, [results]);

  const defaultColDef = useMemo(() => {
    return {
      autoHeight: true,
    };
  }, []);

  const downloadExcel = () => {
    if (!results || results.length === 0) return;
    const worksheet = xlsx.utils.json_to_sheet(results);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Student Marks");
    xlsx.writeFile(workbook, `EvalX_Results_Sem_${semester}.xlsx`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-200">
      <Header />

      <main className="flex-grow p-4 md:p-8 relative overflow-hidden flex flex-col items-center">
        {/* Step Indicator */}
        <div className="w-full max-w-4xl mb-8 mt-4">
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
              { id: 4, label: "Results" }
            ].map((s) => (
              <div key={s.id} className="flex flex-col items-center gap-2 bg-slate-950 px-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors duration-300 ${
                  step > s.id ? "bg-blue-500 border-blue-500 text-white" :
                  step === s.id ? "bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]" :
                  "bg-slate-800 border-slate-700 text-slate-400"
                }`}>
                  {step > s.id ? <CheckCircle className="w-6 h-6" /> : s.id}
                </div>
                <span className={`text-xs md:text-sm font-medium ${step >= s.id ? "text-blue-400" : "text-slate-500"}`}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-5xl relative z-10 w-full">
          <AnimatePresence mode="wait">
            {/* STEP 1: UPLOAD */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">Upload Result PDFs</h2>
                  <p className="text-slate-400">Select or drop your PDF files here to begin extraction.</p>
                </div>

                <div 
                  className={`glass-card rounded-2xl p-10 transition-all duration-300 border-2 border-dashed ${isDragging ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' : 'border-slate-700 hover:border-slate-500'}`}
                  onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner border border-slate-700">
                      <Upload className="w-10 h-10 text-blue-400" />
                    </div>
                    <input type="file" multiple accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 active:scale-95"
                    >
                      Browse Files
                    </button>
                    <p className="text-slate-500 mt-4 text-sm">Or drag and drop PDFs here</p>
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-400" /> 
                        Selected Files ({files.length})
                      </h3>
                      <button onClick={() => setFiles([])} className="text-sm text-red-400 hover:text-red-300">Clear all</button>
                    </div>
                    
                    <div className="max-h-[250px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                      {files.map((file, idx) => (
                        <div key={`${file.name}-${idx}`} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                          <div className="flex items-center gap-3 truncate">
                            <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="text-sm truncate opacity-90">{file.name}</span>
                          </div>
                          <button onClick={() => removeFile(idx)} className="text-slate-500 hover:text-red-400 ml-4 shrink-0 transition-colors">&times;</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4">
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
                initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
                className="space-y-6 max-w-3xl mx-auto"
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">Configure Extraction</h2>
                  <p className="text-slate-400">Select semester and verify subjects to map the data correctly.</p>
                </div>

                <div className="glass-card rounded-2xl p-8">
                  <h3 className="text-xl font-medium mb-6 flex items-center gap-2">
                    <Layers className="w-6 h-6 text-indigo-400" /> Semester Details
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Semester</label>
                      <select 
                        value={semester}
                        onChange={handleSemesterChange}
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow appearance-none"
                      >
                        <option value="2nd">2nd Semester</option>
                        <option value="4th">4th Semester</option>
                        <option value="5th">5th Semester</option>
                        <option value="6th">6th Semester</option>
                        <option value="7th">7th Semester</option>
                      </select>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-800">
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-sm font-medium text-slate-400">Subject Mapping</label>
                        <span className="text-xs font-semibold bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30">
                          {Object.keys(customSubjects).length} subjects predefined
                        </span>
                      </div>
                      
                      <button 
                        onClick={() => setShowSubjectModal(!showSubjectModal)}
                        className="w-full text-left px-5 py-3.5 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700 rounded-xl transition-colors text-sm flex items-center justify-between"
                      >
                        <span className="font-medium">Verify Subjects & Codes</span> 
                        <AlertCircle className="w-5 h-5 text-indigo-400" />
                      </button>
                      
                      <AnimatePresence>
                        {showSubjectModal && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="mt-3 bg-slate-900/80 border border-slate-700 rounded-xl overflow-hidden shadow-inner"
                          >
                            <div className="max-h-[350px] overflow-y-auto p-4 space-y-4 custom-scrollbar">
                              {Object.entries(customSubjects).length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-6">No predefined subjects for this semester. The extractor will use regex to guess column headers.</p>
                              ) : (
                                Object.entries(customSubjects).map(([code, name]) => (
                                  <div key={code} className="space-y-1.5 bg-slate-950 p-3 rounded-lg border border-slate-800">
                                    <label className="text-xs font-mono font-bold text-indigo-400">{code}</label>
                                    <input 
                                      type="text"
                                      value={name}
                                      onChange={(e) => setCustomSubjects(prev => ({...prev, [code]: e.target.value}))}
                                      className="w-full bg-slate-800 border border-slate-700 rounded-md md:text-sm px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                  </div>
                                ))
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button 
                    onClick={() => setStep(1)}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" /> Back
                  </button>
                  <button 
                    onClick={processFiles}
                    className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/20"
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
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <div className="w-24 h-24 relative mb-8">
                  <div className="absolute inset-0 border-4 border-slate-800 rounded-full" />
                  <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-blue-400" />
                  </div>
                </div>
                
                <h2 className="text-3xl font-bold text-white mb-3">Extracting Data</h2>
                <p className="text-slate-400 mb-8 max-w-sm text-center">
                  Parsing {files.length} PDFs. This uses chunks to avoid payload limits...
                </p>

                {progress && (
                  <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                    <div className="flex justify-between text-sm font-medium mb-2">
                      <span className="text-indigo-400">Batch {progress.current} of {progress.total}</span>
                      <span className="text-slate-400">{Math.round((progress.current / progress.total) * 100)}%</span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${(progress.current / progress.total) * 100}%` }}
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
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="space-y-6 w-full"
              >
                <div className="glass-card rounded-2xl p-6 md:p-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-emerald-400 flex items-center gap-2 mb-1">
                        <CheckCircle className="w-6 h-6" /> Extraction Complete
                      </h2>
                      <p className="text-slate-400">Found data for <span className="text-white font-bold">{results.length}</span> students across {files.length} files.</p>
                    </div>
                    
                    <div className="flex gap-3">
                      <button 
                        onClick={() => { setFiles([]); setStep(1); }}
                        className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all border border-slate-700"
                      >
                        Extract More
                      </button>
                      <button 
                        onClick={downloadExcel}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-all shadow-lg flex items-center gap-2"
                      >
                        <Download className="w-5 h-5" /> Download Excel
                      </button>
                    </div>
                  </div>

                  {/* AG Grid Container */}
                  <div 
                    className="w-full h-[600px] border border-slate-700/50 rounded-xl overflow-hidden shadow-inner"
                    style={{ '--ag-background-color': '#0f172a', '--ag-header-background-color': '#1e293b', '--ag-odd-row-background-color': '#0f172a', '--ag-header-foreground-color': '#cbd5e1', '--ag-data-color': '#f8fafc', '--ag-row-hover-color': '#1e293b', '--ag-border-color': '#334155' } as any}
                  >
                    <AgGridReact
                      theme={themeQuartz}
                      rowData={results}
                      columnDefs={colDefs}
                      defaultColDef={defaultColDef}
                      pagination={true}
                      paginationPageSize={20}
                      paginationPageSizeSelector={[20, 50, 100]}
                      className="w-full h-full text-sm"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      
      {/* Scrollbar styling */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
        
        .ag-theme-quartz {
          --ag-background-color: transparent !important;
          --ag-header-background-color: rgba(30, 41, 59, 1) !important;
          --ag-foreground-color: #f1f5f9 !important;
          --ag-header-foreground-color: #94a3b8 !important;
          --ag-border-color: rgba(51, 65, 85, 0.5) !important;
          --ag-row-border-color: rgba(51, 65, 85, 0.5) !important;
          --ag-odd-row-background-color: rgba(15, 23, 42, 0.5) !important;
          --ag-row-hover-color: rgba(51, 65, 85, 0.3) !important;
          max-width: 100%;
        }
      `}} />
    </div>
  );
}
