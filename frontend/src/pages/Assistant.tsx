import { motion } from "framer-motion";
import { ChatPanel } from "../components/ChatPanel";
import { PageHeader } from "../components/PageHeader";
import { usePageMeta } from "../hooks/usePageMeta";

export function Assistant() {
  usePageMeta(
    "AI Job Search Assistant",
    "Describe the job you want in plain language and get AI-ranked matches with an explanation of why each one fits."
  );

  return (
    <div className="relative isolate space-y-6">
      <div className="pointer-events-none absolute -left-24 -top-24 -z-10 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 opacity-[0.14] blur-3xl dark:opacity-[0.22]" />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          kicker="Assistant"
          title="Ask JobNeed"
          subtitle="Describe what you're looking for in plain language and get ranked matches with an explanation of why each one fits."
        />
        <motion.img
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80"
          alt="Colleagues reviewing code together"
          className="hidden h-44 w-full rounded-2xl object-cover shadow-lg shadow-gray-900/10 sm:block lg:h-40 lg:w-80 lg:shrink-0"
        />
      </div>
      <ChatPanel />
    </div>
  );
}
