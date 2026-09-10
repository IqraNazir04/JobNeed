import { ChatPanel } from "../components/ChatPanel";

export function Assistant() {
  return (
    <div className="relative space-y-6">
      <div className="pointer-events-none absolute -left-24 -top-24 -z-10 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 opacity-[0.14] blur-3xl dark:opacity-[0.22]" />

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <header className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
            Ask JobNeed
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Describe what you're looking for in plain language and get ranked matches
            with an explanation of why each one fits.
          </p>
        </header>
        <img
          src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=640&q=80"
          alt="Colleagues reviewing code together"
          className="hidden h-32 w-full rounded-2xl object-cover shadow-md shadow-gray-900/10 sm:block lg:h-28 lg:w-56 lg:shrink-0"
        />
      </div>
      <ChatPanel />
    </div>
  );
}
