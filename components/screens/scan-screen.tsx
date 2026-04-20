import { Camera, X } from 'lucide-react'
import { useState } from 'react'

interface ScanScreenProps {
  onScanComplete?: () => void
}

export default function ScanScreen({ onScanComplete }: ScanScreenProps) {
  const [scanState, setScanState] = useState('idle') // idle, scanning, result

  return (
    <div className="w-full max-w-md mx-auto px-6 py-12 space-y-8 h-screen flex flex-col justify-between">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-black text-foreground">Scan Meal</h1>
        <p className="text-sm text-muted-foreground mt-2">Point your camera at your meal</p>
      </div>

      {/* Camera Frame */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative w-72 h-96">
          {/* Scanning animation */}
          {scanState === 'scanning' && (
            <style>{`
              @keyframes scanLine {
                0% { transform: translateY(-192px); }
                100% { transform: translateY(192px); }
              }
              .scan-line {
                animation: scanLine 2s ease-in-out infinite;
              }
            `}</style>
          )}

          <div className="w-full h-full bg-gradient-to-br from-card/20 to-background border border-primary/20 rounded-3xl flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-primary/5" />
            <div className="absolute top-8 left-8 right-8 h-1 bg-gradient-to-r from-primary/25 via-primary/50 to-primary/25 rounded-full" />
            <div className="absolute bottom-8 left-8 right-8 h-1 bg-gradient-to-r from-primary/25 via-primary/50 to-primary/25 rounded-full" />
            
            {/* Scanning line */}
            {scanState === 'scanning' && (
              <div className="scan-line absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
            )}
            
            {/* Content */}
            {scanState === 'idle' && <Camera size={48} className="text-primary/25" />}
            {scanState === 'scanning' && (
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-primary border-r-primary animate-spin mx-auto" />
                <p className="text-primary font-semibold text-sm">Analyzing your meal...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Result Card */}
      <div className="space-y-6 bg-gradient-to-br from-card to-[#1a1f2e] border border-border/30 rounded-3xl p-8 backdrop-blur-sm">
        <div className="space-y-2">
          <p className="text-foreground/60 text-xs uppercase tracking-wider mb-2">Last Scan</p>
          <h3 className="text-2xl font-bold text-foreground">Grilled Chicken + Rice</h3>
        </div>

        <div className="grid grid-cols-3 gap-6 border-t border-border/20 pt-6">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider">Calories</p>
            <p className="text-2xl font-black text-primary mt-2">520</p>
            <p className="text-xs text-muted-foreground mt-1">kcal</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider">Protein</p>
            <p className="text-2xl font-black text-accent mt-2">38</p>
            <p className="text-xs text-muted-foreground mt-1">g</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider">Carbs</p>
            <p className="text-2xl font-black text-secondary mt-2">52</p>
            <p className="text-xs text-muted-foreground mt-1">g</p>
          </div>
        </div>

        <button className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold py-5 rounded-2xl hover:shadow-[0_0_32px_rgba(156,204,102,0.4)] transition-all duration-300 border border-primary/30 text-base uppercase tracking-wide">
          Add to Today
        </button>
      </div>

      {/* Capture Button */}
      <div className="flex items-center justify-center gap-4 pb-8">
        <button className="w-16 h-16 rounded-full border-2 border-muted bg-card/50 hover:bg-card transition-colors" />
        <button 
          onClick={() => setScanState(scanState === 'idle' ? 'scanning' : 'idle')}
          className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center shadow-lg hover:shadow-[0_0_32px_rgba(153,204,102,0.4)] transition-all duration-300"
        >
          <Camera size={28} className="text-primary-foreground" />
        </button>
        <button className="w-16 h-16 rounded-full border-2 border-muted bg-card/50 hover:bg-card transition-colors flex items-center justify-center">
          <X size={20} className="text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}
