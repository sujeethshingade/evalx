from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import json
import fitz
import re

app = FastAPI()

# Allow CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

usn_pattern = re.compile(r"University Seat Number\s*:\s*(\w+)", re.IGNORECASE)
name_pattern = re.compile(r"Student Name\s*:\s*(.*)", re.IGNORECASE)

# Enhanced subject patterns with more flexible matching
subject_patterns = [
    re.compile(r"([A-Z]{2,5}\d{3,6}[A-Z]?)\s+([A-Z][A-Z\s&/\-]+?)\s+(\d{1,3}|AB)\s+(\d{1,3}|AB)\s+(\d{1,3}|AB)\s+([PFAWXNE])", re.IGNORECASE),
    re.compile(r"([A-Z]{2,5}\d{3,6}[A-Z]?)\s+((?:[A-Z][A-Z\s&/\-]+)+?)\s+(\d{1,3}|AB)\s+(\d{1,3}|AB)\s+(\d{1,3}|AB)\s+([PFAWXNE])", re.IGNORECASE),
    re.compile(r"([A-Z]{2,5}\d{3,6}[A-Z]?)\s+(.+?)\s+(\d{1,3}|AB)\s+(\d{1,3}|AB)\s+(\d{1,3}|AB)\s+([PFAWXNE])\s+\d{4}", re.IGNORECASE),
    re.compile(r"([A-Z]{2,5}\d{3,6}[A-Z]?)\s+(.+?)\s+(\d{1,3}|AB)\s+(\d{1,3}|AB)\s+(\d{1,3}|AB)\s+([PFAWXNE])\s+\d{4}-\d{2}-\d{2}", re.IGNORECASE),
    re.compile(r"([A-Z]{2,5}\d{3,6}[A-Z]?)\s+(.*?)\s+(\d{1,3}|AB)\s+(\d{1,3}|AB)\s+(\d{1,3}|AB)\s+([PFAWXNE])", re.IGNORECASE)
]

def clean_subject_name(subject_name, subject_code, known_subjects):
    """Clean and validate subject name with enhanced cleaning"""
    if subject_code in known_subjects:
        if isinstance(known_subjects[subject_code], dict) and 'name' in known_subjects[subject_code]:
            return known_subjects[subject_code]['name']
        return known_subjects[subject_code]

    subject_name = subject_name.strip()
    unwanted_patterns = [
        r'Student Name.*?(?=\s[A-Z]{2,4}\d|$)',
        r'Semester.*?(?=\s[A-Z]{2,4}\d|$)',
        r'Subject Code.*?(?=\s[A-Z]{2,4}\d|$)',
        r'Subject Name.*?(?=\s[A-Z]{2,4}\d|$)',
        r'Internal Marks.*?(?=\s[A-Z]{2,4}\d|$)',
        r'External Marks.*?(?=\s[A-Z]{2,4}\d|$)',
        r'Total.*?(?=\s[A-Z]{2,4}\d|$)',
        r'Result.*?(?=\s[A-Z]{2,4}\d|$)',
        r'Announced.*?(?=\s[A-Z]{2,4}\d|$)',
        r'Updated.*?(?=\s[A-Z]{2,4}\d|$)',
        r'^\d+\s*',
        r'\s*\d+$'
    ]

    for pattern in unwanted_patterns:
        subject_name = re.sub(pattern, '', subject_name, flags=re.IGNORECASE)

    subject_name = re.sub(r'\s+', ' ', subject_name).strip()

    if (len(subject_name) < 3 or
            any(word in subject_name.lower() for word in ['student', 'semester', 'marks', 'total', 'result', 'code', 'name'])):
        if subject_code in known_subjects:
            if isinstance(known_subjects[subject_code], dict) and 'name' in known_subjects[subject_code]:
                return known_subjects[subject_code]['name']
            return known_subjects[subject_code]

    return subject_name

def extract_subjects_from_text(text: str, pdf_filename: str, known_subjects: dict):
    subjects_found = []
    
    # Method 1
    for i, pattern in enumerate(subject_patterns):
        matches = pattern.findall(text)
        for match in matches:
            if len(match) == 6:
                code, subject, internal, external, total, result = match
            else: continue
            
            subject = clean_subject_name(subject, code, known_subjects)
            try:
                internal_marks = 0 if internal == 'AB' else int(internal)
                external_marks = 0 if external == 'AB' else int(external)
                total_marks = 0 if total == 'AB' else int(total)
                
                if not any(s['code'] == code for s in subjects_found):
                    credits = 0
                    if code in known_subjects and isinstance(known_subjects[code], dict) and 'credits' in known_subjects[code]:
                        credits = known_subjects[code]['credits']
                        
                    subjects_found.append({
                        'code': code, 'name': subject, 'internal': internal_marks,
                        'external': external_marks, 'total': total_marks, 'result': result, 'credits': credits
                    })
            except ValueError:
                pass

    # Method 2
    for code, expected_name in known_subjects.items():
        if code not in [s['code'] for s in subjects_found]:
            lines = text.split('\n')
            for line_idx, line in enumerate(lines):
                if code in line:
                    enhanced_patterns = [
                        rf"{re.escape(code)}\s+.*?\s+(\d{{1,3}}|AB)\s+(\d{{1,3}}|AB)\s+(\d{{1,3}}|AB)\s+([PFAWXNE])",
                        rf"{re.escape(code)}\s+[A-Z/&\s]+\s+(\d{{1,3}}|AB)\s+(\d{{1,3}}|AB)\s+(\d{{1,3}}|AB)\s+([PFAWXNE])",
                        rf"{re.escape(code)}\s+[A-Z\s&]+(?:ALGORITHMS?|JAVA|DATABASE|LAB|UI/UX|ALGEBRA).*?\s+(\d{{1,3}}|AB)\s+(\d{{1,3}}|AB)\s+(\d{{1,3}}|AB)\s+([PFAWXNE])",
                        rf"{re.escape(code)}.*?(\d{{1,3}}|AB)\s+(\d{{1,3}}|AB)\s+(\d{{1,3}}|AB)\s+([PFAWXNE])",
                        rf"{re.escape(code)}\s*(?:[A-Z\s&/]+)?\s*(\d{{1,3}}|AB)\s+(\d{{1,3}}|AB)\s+(\d{{1,3}}|AB)\s+([PFAWXNE])"
                    ]
                    search_text = line
                    if line_idx + 1 < len(lines):
                        search_text += " " + lines[line_idx + 1]

                    for pattern in enhanced_patterns:
                        marks_match = re.search(pattern, search_text, re.IGNORECASE)
                        if marks_match and len(marks_match.groups()) == 4:
                            internal, external, total, result = marks_match.groups()
                            try:
                                internal_marks = 0 if internal == 'AB' else int(internal)
                                external_marks = 0 if external == 'AB' else int(external)
                                total_marks = 0 if total == 'AB' else int(total)
                                
                                expected_name_str = expected_name['name'] if isinstance(expected_name, dict) else expected_name
                                credits_val = expected_name['credits'] if isinstance(expected_name, dict) and 'credits' in expected_name else 0
                                
                                subjects_found.append({
                                    'code': code, 'name': expected_name_str, 'internal': internal_marks,
                                    'external': external_marks, 'total': total_marks, 'result': result, 'credits': credits_val
                                })
                                break
                            except ValueError: pass
                    if code in [s['code'] for s in subjects_found]: break

    # Method 3
    for code, expected_name in known_subjects.items():
        if code not in [s['code'] for s in subjects_found]:
            for match in re.finditer(re.escape(code), text, re.IGNORECASE):
                pos = match.start()
                window = text[max(0, pos-100):min(len(text), pos+200)]
                marks_pattern = rf"(\d{{1,3}}|AB)\s+(\d{{1,3}}|AB)\s+(\d{{1,3}}|AB)\s+([PFAWXNE])"
                marks_match = re.search(marks_pattern, window)
                if marks_match:
                    internal, external, total, result = marks_match.groups()
                    try:
                        internal_marks = 0 if internal == 'AB' else int(internal)
                        external_marks = 0 if external == 'AB' else int(external)
                        total_marks = 0 if total == 'AB' else int(total)
                        
                        expected_name_str = expected_name['name'] if isinstance(expected_name, dict) else expected_name
                        credits_val = expected_name['credits'] if isinstance(expected_name, dict) and 'credits' in expected_name else 0

                        subjects_found.append({
                            'code': code, 'name': expected_name_str, 'internal': internal_marks,
                            'external': external_marks, 'total': total_marks, 'result': result, 'credits': credits_val
                        })
                        break
                    except ValueError: pass

    return subjects_found

@app.post("/api/extract")
async def extract_marks(
    files: List[UploadFile] = File(...),
    knownSubjects: str = Form("{}")
):
    try:
        custom_subjects = json.loads(knownSubjects)
    except json.JSONDecodeError:
        custom_subjects = {}

    all_students_data = []
    
    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            continue
            
        content = await file.read()
        try:
            doc = fitz.open(stream=content, filetype="pdf")
            text = "\n".join(page.get_text() for page in doc)
            doc.close()
        except Exception as e:
            print(f"Error reading PDF {file.filename}: {e}")
            continue

        usn_match = usn_pattern.search(text)
        name_match = name_pattern.search(text)
        usn = usn_match.group(1).strip().upper() if usn_match else "NOT_FOUND"
        name = name_match.group(1).strip().upper() if name_match else "NOT_FOUND"

        subjects_data = extract_subjects_from_text(text, file.filename, custom_subjects)

        student_record = {
            'USN': usn,
            'Name': name,
            'PDF_File': file.filename
        }
        
        for subject_info in subjects_data:
            code = subject_info['code']
            subject_name = subject_info['name']
            subject_prefix = f"{code}_{subject_name}"
            
            if 'credits' in subject_info and subject_info['credits'] > 0:
                student_record[f"{subject_prefix}_Credits"] = subject_info['credits']
                
            student_record[f"{subject_prefix}_Internal"] = subject_info['internal']
            student_record[f"{subject_prefix}_External"] = subject_info['external']
            student_record[f"{subject_prefix}_Total"] = subject_info['total']
            student_record[f"{subject_prefix}_Result"] = subject_info['result']
            
        all_students_data.append(student_record)

    return JSONResponse(content={"data": all_students_data})

# For vercel, the app variable needs to be explicitly exposed
