function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className ?? ""}`} />;
}

export default function ProjectDetailLoading() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Bone className="h-8 w-48 mb-2" />
          <Bone className="h-4 w-56" />
        </div>
        <Bone className="h-10 w-28 rounded-lg" />
      </div>

      {/* Pages list */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <Bone className="h-5 w-16" />
          <Bone className="h-4 w-16" />
        </div>
        <div className="divide-y divide-gray-50">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between">
              <div>
                <Bone className="h-5 w-36 mb-1.5" />
                <Bone className="h-3.5 w-56" />
              </div>
              <div className="flex items-center gap-6">
                <Bone className="h-4 w-20 hidden sm:block" />
                <Bone className="h-6 w-10 rounded-full" />
                <div className="hidden md:grid grid-cols-5 gap-2">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="text-center">
                      <Bone className="h-3 w-8 mb-1 mx-auto" />
                      <Bone className="h-5 w-8 mx-auto rounded-full" />
                    </div>
                  ))}
                </div>
                <Bone className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Project meta */}
      <div className="mt-4">
        <Bone className="h-4 w-48" />
      </div>
    </div>
  );
}
