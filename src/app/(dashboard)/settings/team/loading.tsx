function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className ?? ""}`} />;
}

export default function TeamLoading() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Bone className="h-8 w-44 mb-2" />
          <Bone className="h-4 w-64" />
        </div>
        <Bone className="h-10 w-32 rounded-lg" />
      </div>

      {/* Active members */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <Bone className="h-5 w-40" />
        </div>
        <div className="divide-y divide-gray-50">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bone className="h-8 w-8 rounded-full shrink-0" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Bone className="h-4 w-28" />
                    <Bone className="h-4 w-14 rounded" />
                  </div>
                  <Bone className="h-3.5 w-40" />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Bone className="h-8 w-8 rounded-lg" />
                <Bone className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
