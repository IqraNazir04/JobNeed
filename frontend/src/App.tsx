import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AdminPage } from "./pages/AdminPage";
import { OnePage } from "./pages/OnePage";

export default function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminPage />} />
      <Route
        path="*"
        element={
          <Layout>
            <OnePage />
          </Layout>
        }
      />
    </Routes>
  );
}
