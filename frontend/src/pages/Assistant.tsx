import { motion } from "framer-motion";
import { ChatPanel } from "../components/ChatPanel";
import { PageHeader } from "../components/PageHeader";
import { AssistantIcon } from "../components/SectionIcons";

export function Assistant() {
  return (
    <div className="relative isolate space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <PageHeader
          kicker="Assistant"
          title="Ask JobNeed"
          subtitle="Describe what you're looking for in plain language and get ranked matches with an explanation of why each one fits."
          accent="violet"
          icon={<AssistantIcon />}
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
