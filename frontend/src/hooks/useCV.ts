import { useEffect, useRef, useState } from "react";
import { getMyCV, saveMyCV, type CVData } from "../api/client";
import { useAuth } from "../context/AuthContext";

export interface CVExperienceItem {
  id: string;
  title: string;
  company: string;
  dates: string;
  bullets: string[];
}

export interface CVEducationItem {
  id: string;
  school: string;
  degree: string;
  dates: string;
}

export interface CVFormData {
  name: string;
  email: string;
  phone: string;
  location: string;
  links: string;
  summary: string;
  experience: CVExperienceItem[];
  education: CVEducationItem[];
  skills: string[];
}

const STORAGE_KEY = "jobneed:cv";

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export const EMPTY_CV: CVFormData = {
  name: "",
  email: "",
  phone: "",
  location: "",
  links: "",
  summary: "",
  experience: [],
  education: [],
  skills: [],
};

function readCV(): CVFormData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...EMPTY_CV, ...JSON.parse(raw) } : EMPTY_CV;
  } catch {
    return EMPTY_CV;
  }
}

function writeCV(cv: CVFormData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cv));
  } catch {
    // localStorage unavailable (private mode, quota) — edits still work this session
  }
}

function toBackend(cv: CVFormData): CVData {
  return {
    ...cv,
    experience: cv.experience.map(({ id: _id, ...rest }) => rest),
    education: cv.education.map(({ id: _id, ...rest }) => rest),
  };
}

function fromBackend(data: CVData): CVFormData {
  return {
    ...data,
    experience: data.experience.map((e) => ({ ...e, id: newId() })),
    education: data.education.map((e) => ({ ...e, id: newId() })),
  };
}

export function useCV() {
  const { user } = useAuth();
  const [cv, setCV] = useState<CVFormData>(() => (user ? EMPTY_CV : readCV()));
  const skipNextSave = useRef(false);

  // Signed in: load from the account (skip the save-effect this triggers so
  // we don't immediately write the just-fetched data straight back).
  // Signed out: load (or reload, after logout) from this device's copy.
  useEffect(() => {
    if (!user) {
      setCV(readCV());
      return;
    }
    skipNextSave.current = true;
    getMyCV()
      .then((data) => setCV(fromBackend(data)))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) {
      writeCV(cv);
      return;
    }
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      saveMyCV(toBackend(cv)).catch(() => {});
    }, 800);
    return () => clearTimeout(timeout);
  }, [cv, user]);

  function update(patch: Partial<CVFormData>) {
    setCV((prev) => ({ ...prev, ...patch }));
  }

  function addExperience() {
    setCV((prev) => ({
      ...prev,
      experience: [...prev.experience, { id: newId(), title: "", company: "", dates: "", bullets: [""] }],
    }));
  }

  function updateExperience(id: string, patch: Partial<CVExperienceItem>) {
    setCV((prev) => ({
      ...prev,
      experience: prev.experience.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }

  function removeExperience(id: string) {
    setCV((prev) => ({ ...prev, experience: prev.experience.filter((e) => e.id !== id) }));
  }

  function addEducation() {
    setCV((prev) => ({
      ...prev,
      education: [...prev.education, { id: newId(), school: "", degree: "", dates: "" }],
    }));
  }

  function updateEducation(id: string, patch: Partial<CVEducationItem>) {
    setCV((prev) => ({
      ...prev,
      education: prev.education.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }

  function removeEducation(id: string) {
    setCV((prev) => ({ ...prev, education: prev.education.filter((e) => e.id !== id) }));
  }

  return {
    cv,
    update,
    addExperience,
    updateExperience,
    removeExperience,
    addEducation,
    updateEducation,
    removeEducation,
  };
}
