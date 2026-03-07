function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className ?? ""}`} />;
}

function SectionSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <Bone className="h-6 w-40" />
        <div className="flex items-center gap-2">
          <Bone className="h-5 w-14 rounded" />
          <Bone className="h-5 w-14 rounded" />
          <Bone className="h-5 w-14 rounded" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Bone className="h-5 w-5 rounded-full shrink-0" />
            <Bone className="h-4 w-full max-w-md" />
            <Bone className="h-5 w-12 rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AuditResultLoading() {
  return (
    <div>
      {/* Back link */}
      <Bone className="h-4 w-48 mb-4" />

      {/* Sticky header area */}
      <div className="mb-6">
        <Bone className="h-7 w-56 mb-2" />
        <Bone className="h-4 w-96" />
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 mt-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <Bone className="h-3 w-20 mx-auto mb-3" />
            <Bone className="h-10 w-16 mx-auto mb-2 rounded" />
            <Bone className="h-5 w-8 mx-auto rounded-full" />
          </div>
        ))}
      </div>

      {/* Executive summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <Bone className="h-5 w-40 mb-3" />
        <div className="space-y-2">
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-3/4" />
        </div>
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <div>
            <Bone className="h-3 w-20 mb-2" />
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-2/3 mt-1" />
          </div>
          <div>
            <Bone className="h-3 w-24 mb-2" />
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-2/3 mt-1" />
          </div>
        </div>
      </div>

      {/* Section skeletons */}
      <SectionSkeleton />
      <SectionSkeleton />
      <SectionSkeleton />

      {/* Quick wins */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <Bone className="h-6 w-28 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Bone className="h-6 w-6 rounded shrink-0" />
              <div className="flex-1">
                <Bone className="h-4 w-full max-w-sm mb-1" />
                <Bone className="h-3 w-full max-w-lg" />
              </div>
              <Bone className="h-5 w-16 rounded ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
