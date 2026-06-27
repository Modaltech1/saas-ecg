export default function CobrancasLoading() {
  return (
    <div className="min-h-screen bg-muted/30 px-4 pb-6 space-y-4">
      <div className="h-14 bg-card border-b border-border animate-pulse" />
      <div className="pt-4 grid grid-cols-2 gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="bg-card rounded-lg border border-border p-4 space-y-2 animate-pulse">
            <div className="h-3 w-24 bg-gray-200 rounded" />
            <div className="h-6 w-28 bg-gray-200 rounded" />
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-card rounded-lg border border-border p-4 space-y-3 animate-pulse">
        <div className="h-4 w-20 bg-gray-200 rounded" />
        <div className="h-9 bg-gray-200 rounded-lg" />
        <div className="h-9 bg-gray-200 rounded-lg" />
        <div className="h-9 bg-gray-200 rounded-lg" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-lg border border-border p-4 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded border-2 border-border bg-gray-100 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <div className="space-y-1">
                    <div className="h-4 w-36 bg-gray-200 rounded" />
                    <div className="h-3 w-28 bg-gray-200 rounded" />
                  </div>
                  <div className="space-y-1 text-right">
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                    <div className="h-3 w-14 bg-gray-200 rounded" />
                  </div>
                </div>
                <div className="flex gap-1">
                  <div className="h-5 w-12 bg-amber-100 rounded" />
                  <div className="h-5 w-12 bg-amber-100 rounded" />
                </div>
                <div className="flex gap-2 mt-1">
                  <div className="flex-1 h-8 bg-gray-100 rounded-lg" />
                  <div className="flex-1 h-8 bg-green-100 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
