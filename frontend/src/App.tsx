import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { About } from "./pages/About";
import { Assistant } from "./pages/Assistant";
import { CVBuilder } from "./pages/CVBuilder";
import { Home } from "./pages/Home";
import { InterviewPrep } from "./pages/InterviewPrep";
import { JobDetail } from "./pages/JobDetail";
import { Login } from "./pages/Login";
import { NotFound } from "./pages/NotFound";
import { SavedJobs } from "./pages/SavedJobs";
import { SpeakingPractice } from "./pages/SpeakingPractice";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="assistant" element={<Assistant />} />
        <Route path="saved" element={<SavedJobs />} />
        <Route path="cv" element={<CVBuilder />} />
        <Route path="interview" element={<InterviewPrep />} />
        <Route path="speaking" element={<SpeakingPractice />} />
        <Route path="about" element={<About />} />
        <Route path="login" element={<Login />} />
        <Route path="jobs/:id" element={<JobDetail />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
