export type RawResultRow = Record<string, unknown>;

export type ParsedSubject = {
  code: string;
  name: string;
  credits?: number;
  internal?: number;
  external?: number;
  total?: number;
  result?: string;
};

export type SemesterStudentRecord = {
  semester: string;
  runId: string;
  runCreatedAt: string;
  usn: string;
  name: string;
  subjects: ParsedSubject[];
};

const SUBJECT_SUFFIXES = [
  "Credits",
  "Internal",
  "External",
  "Total",
  "Result",
] as const;

const CANDIDATE_USN_KEYS = ["USN", "University Seat Number", "Seat Number"];
const CANDIDATE_NAME_KEYS = ["Name", "Student Name", "Student"];
const CANDIDATE_SCORE_KEYS = ["SGPA", "CGPA", "GPA", "Percentage"];

function getString(row: RawResultRow, keys: string[]): string {
  const readValue = (value: unknown): string => {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
    if (Array.isArray(value) && typeof value[0] === "string") {
      const first = value[0].trim();
      if (first.length > 0) {
        return first;
      }
    }
    return "";
  };

  for (const key of keys) {
    const direct = readValue(row[key]);
    if (direct) {
      return direct;
    }
  }

  const normalizedEntries = Object.entries(row).map(
    ([key, value]) => [key.trim().toLowerCase(), value] as const,
  );

  for (const candidate of keys.map((key) => key.trim().toLowerCase())) {
    const matched = normalizedEntries.find(
      ([normalizedKey]) => normalizedKey === candidate,
    );
    if (!matched) {
      continue;
    }

    const fromNormalized = readValue(matched[1]);
    if (fromNormalized) {
      return fromNormalized;
    }
  }

  return "";
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseSubjectPrefix(prefix: string): { code: string; name: string } {
  const [code, ...nameParts] = prefix.split("_");
  return {
    code: (code || "UNKNOWN").trim(),
    name: nameParts.join("_").trim() || "Unknown Subject",
  };
}

export function parseSubjects(row: RawResultRow): ParsedSubject[] {
  const map = new Map<string, ParsedSubject>();

  for (const [key, value] of Object.entries(row)) {
    const suffix = SUBJECT_SUFFIXES.find((s) => key.endsWith(`_${s}`));
    if (!suffix) {
      continue;
    }

    const prefix = key.slice(0, -(suffix.length + 1));
    if (!map.has(prefix)) {
      const { code, name } = parseSubjectPrefix(prefix);
      map.set(prefix, { code, name });
    }

    const subject = map.get(prefix);
    if (!subject) {
      continue;
    }

    if (suffix === "Result") {
      subject.result = String(value ?? "")
        .trim()
        .toUpperCase();
      continue;
    }

    const numericValue = toNumber(value);
    if (numericValue === null) {
      continue;
    }

    if (suffix === "Credits") subject.credits = numericValue;
    if (suffix === "Internal") subject.internal = numericValue;
    if (suffix === "External") subject.external = numericValue;
    if (suffix === "Total") subject.total = numericValue;
  }

  return [...map.values()].sort((a, b) => a.code.localeCompare(b.code));
}

export function getStudentUsn(row: RawResultRow): string {
  return getString(row, CANDIDATE_USN_KEYS).toUpperCase();
}

export function getStudentName(row: RawResultRow): string {
  return getString(row, CANDIDATE_NAME_KEYS) || "Unknown";
}

export function getScore(row: RawResultRow): number {
  for (const key of CANDIDATE_SCORE_KEYS) {
    const score = toNumber(row[key]);
    if (score !== null) {
      return score;
    }
  }

  const subjects = parseSubjects(row);
  const totals = subjects
    .map((subject) => subject.total)
    .filter((v): v is number => typeof v === "number");

  if (totals.length === 0) {
    return 0;
  }

  const averageOutOf100 = totals.reduce((sum, v) => sum + v, 0) / totals.length;
  return Number((averageOutOf100 / 10).toFixed(2));
}

export function isPassing(row: RawResultRow): boolean {
  const subjects = parseSubjects(row);
  if (subjects.length === 0) {
    return true;
  }

  return subjects.every((subject) => {
    const result = (subject.result || "").toUpperCase();
    return result !== "F" && result !== "A" && result !== "X";
  });
}

export function scoreBand(score: number): string {
  if (score >= 9) return "9-10";
  if (score >= 8) return "8-9";
  if (score >= 7) return "7-8";
  if (score >= 6) return "6-7";
  if (score >= 5) return "5-6";
  return "<5";
}
