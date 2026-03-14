"use client";

import React, { useState, useRef } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Download, Loader2, RefreshCw, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as xlsx from "xlsx";
import axios from "axios";

// Known subjects from the Python backend defaults
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

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [semester, setSemester] = useState("4th");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [customSubjects, setCustomSubjects] = useState<Record<string, string>>(KNOWN_SUBJECTS_MAP["4th"]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSemesterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sem = e.target.value;
    setSemester(sem);
    setCustomSubjects({ ...KNOWN_SUBJECTS_MAP[sem] });
  };

  const processFiles = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
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
        
        chunk.forEach(file => {
          formData.append("files", file);
        });
        formData.append("knownSubjects", JSON.stringify(customSubjects));
        
        const response = await axios.post('/api/extract', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.data && response.data.data) {
          allExtractedData = [...allExtractedData, ...response.data.data];
        }
      }
      
      setResults(allExtractedData);
    } catch (error) {
      console.error("Error processing files:", error);
      alert(`An error occurred while processing Batch ${progress?.current || 1}. Please try again.`);
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  const downloadExcel = () => {
    if (!results || results.length === 0) return;
    
    // Create Excel worksheet
    const worksheet = xlsx.utils.json_to_sheet(results);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Student Marks");
    
    // Generate and download
    xlsx.writeFile(workbook, `EvalX_Results_Sem_${semester}.xlsx`);
  };

  return (
    <main className="min-h-screen p-8 lg:p-12 relative overflow-hidden">
      {/* Background gradients managed in globals.css */}
      
      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Header Section */}
        <header className="mb-12 text-center pt-8">
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 mb-4"
          >
            <div className="p-3 bg-blue-600/20 rounded-xl border border-blue-500/30">
              <RefreshCw className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              EvalX
            </h1>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-400 max-w-2xl mx-auto"
          >
            Automated student marks extraction. Upload PDF result sheets, process dynamically, and download consolidated Excel reports.
          </motion.p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Work Area Workspace */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Upload Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className={`glass-card rounded-2xl p-8 transition-all duration-300 ${isDragging ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-inner border border-slate-700">
                  <Upload className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Upload Result PDFs</h3>
                <p className="text-slate-400 mb-6 text-sm max-w-sm">Drag and drop your PDF files here, or click to browse your computer files.</p>
                
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
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-blue-500/25 active:scale-95"
                >
                  Browse Files
                </button>
              </div>
            </motion.div>

            {/* File List */}
            <AnimatePresence>
              {files.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="glass-card rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-400" /> 
                      Selected Files ({files.length})
                    </h3>
                    {files.length > 0 && (
                      <button onClick={() => setFiles([])} className="text-sm text-red-400 hover:text-red-300 transition-colors">
                        Clear all
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                    {files.map((file, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        key={`${file.name}-${idx}`} 
                        className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors"
                      >
                        <div className="flex items-center gap-3 truncate">
                          <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-sm truncate opacity-90">{file.name}</span>
                        </div>
                        <button onClick={() => removeFile(idx)} className="text-slate-500 hover:text-red-400 ml-4 shrink-0 transition-colors">
                          &times;
                        </button>
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-slate-700/50 flex flex-col items-end gap-3">
                    {progress && (
                      <div className="w-full flex items-center gap-3 text-sm text-emerald-400 font-medium bg-emerald-500/10 px-4 py-2 rounded-lg border border-emerald-500/20">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing Batch {progress.current} of {progress.total}...</span>
                        <div className="flex-1 ml-4 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-emerald-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                            transition={{ ease: "linear" }}
                          />
                        </div>
                      </div>
                    )}
                    <button 
                      onClick={processFiles}
                      disabled={isProcessing}
                      className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-emerald-500/25 flex items-center gap-2"
                    >
                      {isProcessing ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Extracting Data...</>
                      ) : (
                        <><RefreshCw className="w-5 h-5" /> Extract Data</>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Results Section */}
            <AnimatePresence>
              {results && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="glass-card rounded-2xl p-6 overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-emerald-400 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" /> Extraction Complete
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">Found data for {results.length} students.</p>
                    </div>
                    
                    <button 
                      onClick={downloadExcel}
                      className="px-6 py-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 font-medium rounded-lg transition-all flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Download Excel
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto rounded-xl border border-slate-700/50 custom-scrollbar">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                      <thead className="bg-slate-800/80 text-slate-300">
                        <tr>
                          {results.length > 0 && Object.keys(results[0]).slice(0, 5).map(key => (
                            <th key={key} className="px-4 py-3 font-medium border-b border-slate-700">{key}</th>
                          ))}
                          {results.length > 0 && Object.keys(results[0]).length > 5 && (
                            <th className="px-4 py-3 font-medium border-b border-slate-700 text-slate-500 italic">...and more columns</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {results.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                            {Object.keys(row).slice(0, 5).map(key => (
                              <td key={key} className="px-4 py-3">{row[key]}</td>
                            ))}
                            {Object.keys(row).length > 5 && (
                              <td className="px-4 py-3 text-slate-500 italic">...</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {results.length > 5 && (
                    <p className="text-center text-xs text-slate-500 mt-3">Showing 5 of {results.length} rows. Download Excel to see all data.</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            
          </div>

          {/* Sidebar / Configuration */}
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              className="glass-card rounded-2xl p-6"
            >
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" /> Configuration
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Semester</label>
                  <select 
                    value={semester}
                    onChange={handleSemesterChange}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow appearance-none"
                  >
                    <option value="2nd">2nd Semester</option>
                    <option value="4th">4th Semester</option>
                    <option value="5th">5th Semester</option>
                    <option value="6th">6th Semester</option>
                    <option value="7th">7th Semester</option>
                  </select>
                </div>
                
                <div className="pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-400">Subject Mapping</label>
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
                      {Object.keys(customSubjects).length} subjects
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => setShowSubjectModal(!showSubjectModal)}
                    className="w-full text-left px-4 py-2.5 bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700/50 rounded-lg transition-colors text-sm flex items-center justify-between"
                  >
                    <span>View & Edit Subjects</span> 
                    <AlertCircle className="w-4 h-4 text-slate-500" />
                  </button>
                  
                  {/* Subject Mapping Configurer (Inline instead of modal for UI smoothness) */}
                  <AnimatePresence>
                    {showSubjectModal && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 bg-slate-900/50 border border-slate-700 rounded-xl overflow-hidden"
                      >
                        <div className="max-h-[300px] overflow-y-auto p-3 space-y-3 custom-scrollbar">
                          {Object.entries(customSubjects).map(([code, name]) => (
                            <div key={code} className="space-y-1">
                              <label className="text-xs font-mono text-indigo-400">{code}</label>
                              <input 
                                type="text"
                                value={name}
                                onChange={(e) => setCustomSubjects(prev => ({...prev, [code]: e.target.value}))}
                                className="w-full bg-slate-800 border-none rounded md:text-sm px-3 py-1.5 focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          ))}
                          {Object.keys(customSubjects).length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-4">No predefined subjects for this semester. The extractor will rely solely on regex parsing.</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Scrollbar styling */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}} />
    </main>
  );
}
