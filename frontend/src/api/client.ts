export interface Job {
  id: string;
  source: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  posted_at: string | null;
  salary_range: string;
  is_active: boolean;
}

export interface JobBoardInput {
  title: string;
  company: string;
  location: string;
  remote: boolean;
  description: string;
  url: string;
  salary_range?: string;
}

export interface SearchResult {
  job: Job;
  score: number;
}

export type ApplicationStatus = "saved" | "applied" | "interviewing" | "offer" | "rejected";

export interface SavedJobEntry {
  job: Job;
  status: ApplicationStatus;
  created_at: string;
}

export interface ChatResponse {
  answer: string;
  matches: Job[];
}

export interface CVExperience {
  title: string;
  company: string;
  dates: string;
  bullets: string[];
}

export interface CVEducation {
  school: string;
  degree: string;
  dates: string;
}

export interface CVData {
  name: string;
  email: string;
  phone: string;
  location: string;
  links: string;
  summary: string;
  experience: CVExperience[];
  education: CVEducation[];
  skills: string[];
}

export interface TailorCVResponse {
  tailored_summary: string;
  emphasized_skills: string[];
  notes: string;
}

export interface CoverLetterResponse {
  cover_letter: string;
}

export interface InterviewQuestion {
  question: string;
  category: string;
  talking_points: string[];
}

export interface InterviewPrepResponse {
  job_title: string;
  company: string;
  role_summary: string;
  questions: InterviewQuestion[];
  research_tips: string[];
}

export interface InterviewPrepRequest {
  job_id?: string;
  query?: string;
  job_description?: string;
  cv?: CVData;
}

export interface GrammarNote {
  original: string;
  suggestion: string;
  explanation: string;
}

export interface SpeakingFeedbackResponse {
  overall_score: number;
  strengths: string[];
  grammar_notes: GrammarNote[];
  filler_word_count: number;
  vocabulary_suggestions: string[];
  improved_answer: string;
}

export interface User {
  id: string;
  email: string;
  linkedin_url: string;
  indeed_url: string;
  upwork_url: string;
  github_username: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface AdminAuthResponse {
  access_token: string;
  token_type: string;
  email: string;
}

export interface ProfileUpdate {
  linkedin_url: string;
  indeed_url: string;
  upwork_url: string;
  github_username: string;
}

export interface GithubStats {
  username: string;
  name: string;
  bio: string;
  public_repos: number;
  followers: number;
  top_languages: string[];
  avatar_url: string;
  profile_url: string;
}

let authToken: string | null = null;
let adminToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

// Kept entirely separate from authToken - the job-board admin panel has its
// own login (POST /auth/admin-login) with no backing user account, so its
// requests must never pick up whatever regular user happens to be logged
// into this browser and must keep working if no one is.
export function setAdminToken(token: string | null) {
  adminToken = token;
}

async function request<T>(path: string, options?: RequestInit, tokenOverride?: string | null): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = tokenOverride !== undefined ? tokenOverride : authToken;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, { headers, ...options });
  if (!res.ok) {
    throw new Error(`Request to ${path} failed: ${res.status}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json();
}

export function search(query: string, topK = 10): Promise<SearchResult[]> {
  return request("/search", {
    method: "POST",
    body: JSON.stringify({ query, top_k: topK }),
  });
}

export function chat(message: string, topK = 5): Promise<ChatResponse> {
  return request("/chat", {
    method: "POST",
    body: JSON.stringify({ message, top_k: topK }),
  });
}

export function ingestSample(query = ""): Promise<Job[]> {
  return request(`/jobs/ingest/sample?query=${encodeURIComponent(query)}`, {
    method: "POST",
  });
}

export function adminLogin(email: string, password: string): Promise<AdminAuthResponse> {
  return request("/auth/admin-login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// Every board call passes adminToken explicitly (third arg) instead of
// relying on the shared authToken, so these work whether or not a regular
// user happens to be logged in too.
export function getMyBoardJobs(): Promise<Job[]> {
  return request("/jobs/board/mine", undefined, adminToken);
}

export function createBoardJob(input: JobBoardInput): Promise<Job> {
  return request("/jobs/board", { method: "POST", body: JSON.stringify(input) }, adminToken);
}

export function updateBoardJob(
  id: string,
  input: Partial<JobBoardInput> & { is_active?: boolean }
): Promise<Job> {
  return request(
    `/jobs/board/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(input) },
    adminToken
  );
}

export function closeBoardJob(id: string): Promise<Job> {
  return request(`/jobs/board/${encodeURIComponent(id)}/close`, { method: "POST" }, adminToken);
}

export function getJob(id: string): Promise<Job> {
  return request(`/jobs/${encodeURIComponent(id)}`);
}

export function tailorCV(cv: CVData, jobDescription: string): Promise<TailorCVResponse> {
  return request("/cv/tailor", {
    method: "POST",
    body: JSON.stringify({ cv, job_description: jobDescription }),
  });
}

export function generateCoverLetter(
  cv: CVData,
  jobDescription: string,
  company = "",
  jobTitle = ""
): Promise<CoverLetterResponse> {
  return request("/cv/cover-letter", {
    method: "POST",
    body: JSON.stringify({ cv, job_description: jobDescription, company, job_title: jobTitle }),
  });
}

export function getMyCV(): Promise<CVData> {
  return request("/cv");
}

export function saveMyCV(cv: CVData): Promise<CVData> {
  return request("/cv", { method: "PUT", body: JSON.stringify(cv) });
}

export function register(email: string, password: string): Promise<AuthResponse> {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getMe(): Promise<User> {
  return request("/auth/me");
}

export function updateProfile(profile: ProfileUpdate): Promise<User> {
  return request("/auth/profile", { method: "PATCH", body: JSON.stringify(profile) });
}

export function getGithubStats(username: string): Promise<GithubStats> {
  return request(`/auth/github-stats/${encodeURIComponent(username)}`);
}

export function getSavedJobsRemote(): Promise<SavedJobEntry[]> {
  return request("/saved-jobs");
}

export function updateSavedJobStatusRemote(
  id: string,
  status: ApplicationStatus
): Promise<SavedJobEntry> {
  return request(`/saved-jobs/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function saveJobRemote(id: string): Promise<void> {
  return request(`/saved-jobs/${encodeURIComponent(id)}`, { method: "PUT" });
}

export function unsaveJobRemote(id: string): Promise<void> {
  return request(`/saved-jobs/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function prepareInterview(payload: InterviewPrepRequest): Promise<InterviewPrepResponse> {
  return request("/interview/prepare", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getSpeakingFeedback(
  question: string,
  transcript: string
): Promise<SpeakingFeedbackResponse> {
  return request("/speaking/feedback", {
    method: "POST",
    body: JSON.stringify({ question, transcript }),
  });
}
