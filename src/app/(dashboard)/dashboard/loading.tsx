function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className ?? ""}`} />;
}

export default function DashboardLoading() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Bone className="h-8 w-64 mb-2" />
        <Bone className="h-4 w-40" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <Bone className="h-10 w-10 rounded-lg shrink-0" />
            <div>
              <Bone className="h-3 w-16 mb-2" />
              <Bone className="h-7 w-10" />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Audits */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <Bone className="h-5 w-32" />
          <Bone className="h-4 w-28" />
        </div>
        <div className="divide-y divide-gray-50">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Bone className="h-4 w-24" />
                  <Bone className="h-4 w-32" />
                </div>
                <Bone className="h-3 w-40 mt-1.5" />
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="hidden sm:grid grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="text-center">
                      <Bone className="h-3 w-10 mb-1 mx-auto" />
                      <Bone className="h-6 w-10 mx-auto rounded-full" />
                    </div>
                  ))}
                </div>
                <Bone className="h-4 w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
