import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { JobModalProvider } from "./context/JobModalContext";
import { SavedJobsProvider } from "./context/SavedJobsContext";
import { ToastProvider } from "./context/ToastContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        <SavedJobsProvider>
          <JobModalProvider>
            <App />
          </JobModalProvider>
        </SavedJobsProvider>
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>
);
