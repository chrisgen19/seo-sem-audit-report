function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className ?? ""}`} />;
}

export default function PageDetailLoading() {
  return (
    <div>
      {/* Back link */}
      <Bone className="h-4 w-32 mb-4" />

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Bone className="h-8 w-40 mb-2" />
          <Bone className="h-4 w-64" />
        </div>
        <Bone className="h-10 w-28 rounded-lg" />
      </div>

      {/* Score trend */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-5">
        <div className="flex items-center justify-between">
          <Bone className="h-5 w-28" />
          <Bone className="h-3 w-16" />
        </div>
        <div className="flex gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-1 text-center">
              <Bone className="h-3 w-14 mb-2 mx-auto" />
              <Bone className="h-8 w-12 mx-auto rounded" />
            </div>
          ))}
        </div>
        <Bone className="h-48 w-full rounded-lg" />
      </div>

      {/* Audit history */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <Bone className="h-5 w-28" />
          <Bone className="h-4 w-14" />
        </div>
        <div className="divide-y divide-gray-50">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between">
              <div>
                <Bone className="h-4 w-36 mb-1.5" />
                <Bone className="h-3 w-24" />
              </div>
              <div className="flex items-center gap-4">
                <Bone className="h-6 w-10 rounded-full" />
                <Bone className="h-4 w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
