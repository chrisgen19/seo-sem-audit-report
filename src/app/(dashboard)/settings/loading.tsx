function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className ?? ""}`} />;
}

function FieldSkeleton() {
  return (
    <div>
      <Bone className="h-4 w-16 mb-1.5" />
      <Bone className="h-10 w-full rounded-lg" />
    </div>
  );
}

export default function SettingsLoading() {
  return (
    <div className="max-w-lg">
      {/* Header */}
      <div className="mb-6">
        <Bone className="h-8 w-28 mb-2" />
        <Bone className="h-4 w-56" />
      </div>

      {/* Profile */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <Bone className="h-5 w-16 mb-4" />
        <div className="space-y-4">
          <FieldSkeleton />
          <FieldSkeleton />
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <Bone className="h-5 w-36 mb-1" />
        <Bone className="h-3 w-64 mb-4" />
        <div className="space-y-4">
          <FieldSkeleton />
          <FieldSkeleton />
        </div>
      </div>

      {/* Password */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <Bone className="h-5 w-36 mb-4" />
        <div className="space-y-4">
          <FieldSkeleton />
          <FieldSkeleton />
        </div>
      </div>

      {/* Save button */}
      <Bone className="h-10 w-full rounded-lg" />
    </div>
  );
}
