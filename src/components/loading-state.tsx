export function LoadingState() {
  return (
    <div className="w-4/6 bg-slate-800 rounded-lg border border-slate-700 p-6">
      <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Fetching Figma File...</h3>
          <p className="text-slate-400">Please wait while we load your design</p>
        </div>
      </div>
    </div>
  )
}

