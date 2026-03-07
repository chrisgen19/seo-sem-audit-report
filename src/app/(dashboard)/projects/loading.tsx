function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className ?? ""}`} />;
}

export default function ProjectsLoading() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Bone className="h-8 w-32 mb-2" />
          <Bone className="h-4 w-24" />
        </div>
        <Bone className="h-10 w-32 rounded-lg" />
      </div>

      {/* Project cards */}
      <div className="grid gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <Bone className="h-10 w-10 rounded-lg shrink-0" />
              <div>
                <Bone className="h-5 w-40 mb-1.5" />
                <Bone className="h-3.5 w-48" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Bone className="h-4 w-16" />
              <Bone className="h-4 w-20 hidden sm:block" />
              <Bone className="h-6 w-10 rounded-full" />
              <Bone className="h-5 w-5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
