import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AdminPage } from "./pages/AdminPage";
import { Blog } from "./pages/Blog";
import { BlogPostPage } from "./pages/BlogPostPage";
import { OnePage } from "./pages/OnePage";

export default function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:id" element={<BlogPostPage />} />
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
