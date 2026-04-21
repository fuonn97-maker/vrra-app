'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera, Upload, Check } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import LimitReachedModal from '@/components/limit-reached-modal'

type Step = 'options' | 'camera' | 'loading' | 'result'

interface NutritionData {
  foodName: string
  calories: number
  protein: number
  carbs: number
  fat: number
  insight: string
  mealScore?: number
}

export default function ScanMealPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('options')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null)
  const [showLimitModal, setShowLimitModal] = useState(false)

  useEffect(() => {
    ensureProfileExists()
  }, [])

  const ensureProfileExists = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      console.error('ensureProfileExists error:', error)
      return
    }

    if (!data) {
      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        is_premium: false,
        free_scans_used: 0,
      })

      if (insertError) {
        console.error('Profile insert error:', insertError)
      }
    }
  }

  const checkLimit = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return false

    const { data, error } = await supabase
      .from('profiles')
      .select('is_premium, free_scans_used')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      console.error('checkLimit error:', error)
      return false
    }

    if (!data) return false

    if (!data.is_premium && data.free_scans_used >= 3) {
      setShowLimitModal(true)
      return false
    }

    return true
  }

  const compressImageDataUrl = (
    imageDataUrl: string,
    maxWidth = 900,
    quality = 0.7
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement('canvas')
        const scale = Math.min(1, maxWidth / img.width)

        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context not available'))
          return
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedDataUrl)
      }

      img.onerror = () => reject(new Error('Failed to load image for compression'))
      img.src = imageDataUrl
    })
  }

  const handleOpenCamera = async () => {
    const canProceed = await checkLimit()
    if (!canProceed) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
        },
        audio: false,
      })

      setStep('camera')

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch((err) => {
            console.error('Video play error:', err)
            toast.error('Camera preview failed')
          })
        }
      }, 200)
    } catch (error) {
      console.error('Camera error:', error)
      toast.error('Camera access is unavailable. Please upload an image instead.')
    }
  }

  const handleCapturePhoto = () => {
    if (!canvasRef.current || !videoRef.current) return

    const context = canvasRef.current.getContext('2d')
    if (!context) return

    canvasRef.current.width = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight
    context.drawImage(videoRef.current, 0, 0)

    const imageData = canvasRef.current.toDataURL('image/jpeg')
    setCapturedImage(imageData)

    const stream = videoRef.current.srcObject as MediaStream | null
    stream?.getTracks().forEach((track) => track.stop())

    setStep('loading')
    analyzeImage(imageData)
  }

  const handleUploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const canProceed = await checkLimit()
    if (!canProceed) {
      event.target.value = ''
      return
    }

    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file')
      event.target.value = ''
      return
    }

    const reader = new FileReader()

    reader.onload = (e) => {
      const imageData = e.target?.result as string
      setCapturedImage(imageData)
      setStep('loading')
      analyzeImage(imageData)
    }

    reader.onerror = () => {
      toast.error('Failed to read image')
      setStep('options')
    }

    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const analyzeImage = async (imageDataUrl: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Please log in to scan meals')
        setStep('options')
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_premium, free_scans_used')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError || !profileData) {
        toast.error('Unable to verify scan limit')
        setStep('options')
        return
      }

      const isPremium = profileData.is_premium || false
      const freeScansUsed = profileData.free_scans_used || 0

      if (!isPremium && freeScansUsed >= 3) {
        setShowLimitModal(true)
        setStep('options')
        return
      }

      const compressedImageDataUrl = await compressImageDataUrl(imageDataUrl, 600, 0.6)
      const base64 = compressedImageDataUrl.split(',')[1]

      if (!base64 || base64.length > 2_000_000) {
        throw new Error('Image too large, please use a smaller photo')
      }

      const response = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      })

      const rawText = await response.text()

      let data: any
      try {
        data = JSON.parse(rawText)
      } catch {
        throw new Error(rawText || `Server returned invalid response (${response.status})`)
      }

      if (!response.ok) {
        const errorMsg = data.error || `API error (${response.status}): ${response.statusText}`
        toast.error(errorMsg)
        setStep('options')
        return
      }

      setNutritionData({
        foodName: data.foodName,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        insight: data.insight,
        mealScore: data.mealScore,
      })

      if (data.mealScore !== undefined) {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.access_token) {
          toast.error('Failed to save meal')
          return
        }

        const scoreResponse = await fetch('/api/scores', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            foodName: data.foodName,
            mealData: {
              calories: data.calories,
              protein: data.protein,
              carbs: data.carbs,
              fat: data.fat,
            },
          }),
        })

        const scoreRawText = await scoreResponse.text()

        let scoreResult: any
        try {
          scoreResult = JSON.parse(scoreRawText)
        } catch {
          scoreResult = { error: scoreRawText || 'Invalid save response' }
        }

        if (!scoreResponse.ok) {
          toast.error(`Failed to save: ${scoreResult.error}`)
          setStep('options')
        } else {
          toast.success('Meal added successfully')

          if (!isPremium) {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ free_scans_used: freeScansUsed + 1 })
              .eq('id', user.id)

            if (updateError) {
              console.error('Failed to update free scan count:', updateError)
            }
          }
          setStep('result')
        }
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Analyze image error:', error)
      toast.error(errorMsg)
      setStep('options')
    }
  }

  const handleScanAnother = async () => {
    const canProceed = await checkLimit()
    if (!canProceed) return

    setCapturedImage(null)
    setNutritionData(null)
    setStep('options')
  }

  const handleBackToHome = () => {
    const stream = videoRef.current?.srcObject as MediaStream | null
    stream?.getTracks().forEach((track) => track.stop())
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0f1a] to-background flex flex-col">
      <div className="border-b border-border/10 px-6 py-4 flex items-center justify-between">
        <button
          onClick={handleBackToHome}
          className="p-2 rounded-lg hover:bg-card/40 transition-all text-muted-foreground hover:text-foreground"
          aria-label="Go back"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-black text-foreground">Scan Your Meal</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-6 py-8 space-y-8">
          {step === 'options' && (
            <>
              <p className="text-center text-muted-foreground">
                Choose how you want to scan your meal
              </p>

              <div className="space-y-4">
                <button
                  onClick={handleOpenCamera}
                  className="w-full bg-gradient-to-br from-primary/15 to-secondary/15 border border-primary/40 rounded-2xl p-6 hover:border-primary/60 hover:bg-gradient-to-br hover:from-primary/25 hover:to-secondary/25 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <Camera size={24} className="text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Open Camera</h3>
                      <p className="text-sm text-muted-foreground">Take a live photo of your meal</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-gradient-to-br from-secondary/15 to-primary/15 border border-secondary/40 rounded-2xl p-6 hover:border-secondary/60 hover:bg-gradient-to-br hover:from-secondary/25 hover:to-primary/25 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
                      <Upload size={24} className="text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Upload Image</h3>
                      <p className="text-sm text-muted-foreground">
                        Choose a meal photo from your device
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadImage}
                className="hidden"
              />
            </>
          )}

          {step === 'camera' && (
            <>
              <div className="space-y-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-2xl bg-black border border-primary/40"
                />
                <button
                  onClick={handleCapturePhoto}
                  className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold py-4 rounded-xl hover:shadow-[0_0_32px_rgba(156,204,102,0.4)] transition-all flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  Capture Meal
                </button>
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </>
          )}

          {step === 'loading' && capturedImage && (
            <div className="space-y-8">
              <img
                src={capturedImage}
                alt="Captured meal"
                className="w-full rounded-2xl border border-border/30"
              />

              <div className="flex flex-col items-center justify-center py-12 space-y-6">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-border/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-primary animate-spin" />
                </div>
                <p className="text-lg font-semibold text-foreground">Analyzing your meal...</p>
                <p className="text-sm text-muted-foreground">
                  AI is scanning nutritional content
                </p>
              </div>
            </div>
          )}

          {step === 'result' && capturedImage && nutritionData && (
            <div className="space-y-6">
              <img
                src={capturedImage}
                alt="Captured meal"
                className="w-full rounded-2xl border border-border/30 shadow-lg"
              />

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-foreground">{nutritionData.foodName}</h2>
                <p className="text-sm text-muted-foreground">Serving Size: 1 plate (~350g)</p>
                <p className="text-xs text-muted-foreground/70 uppercase tracking-widest">
                  Estimated Nutrition
                </p>
              </div>

              <div className="bg-gradient-to-br from-primary/20 via-secondary/10 to-background border border-primary/40 rounded-2xl p-8 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Total Energy
                </p>
                <p className="text-6xl font-black bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                  {nutritionData.calories}
                </p>
                <p className="text-lg text-muted-foreground mt-2">kcal</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: 'Protein',
                    value: nutritionData.protein,
                    unit: 'g',
                    color: 'from-primary to-primary/60',
                  },
                  {
                    label: 'Carbs',
                    value: nutritionData.carbs,
                    unit: 'g',
                    color: 'from-secondary to-secondary/60',
                  },
                  {
                    label: 'Fat',
                    value: nutritionData.fat,
                    unit: 'g',
                    color: 'from-accent to-accent/60',
                  },
                ].map((macro) => (
                  <div
                    key={macro.label}
                    className={`bg-gradient-to-br ${macro.color} bg-opacity-10 border border-border/40 rounded-xl p-4 text-center`}
                  >
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      {macro.label}
                    </p>
                    <p className="text-2xl font-black text-foreground mt-2">{macro.value}</p>
                    <p className="text-xs text-muted-foreground">{macro.unit}</p>
                  </div>
                ))}
              </div>

              <div className="bg-card/40 border border-border/30 rounded-xl p-4 space-y-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Other Nutrients
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Fiber</span>
                    <span className="font-bold text-foreground">3g</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Sugar</span>
                    <span className="font-bold text-foreground">5g</span>
                  </div>

                  <div className="flex justify-between items-center col-span-2">
                    <span className="text-sm text-muted-foreground">Sodium</span>
                    <span className="font-bold text-foreground">800mg</span>
                  </div>
                </div>
              </div>

              {nutritionData.mealScore !== undefined && (
                <div className="bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/40 rounded-xl p-5 space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Meal Score
                    </p>
                    <p className="text-4xl font-black text-foreground mt-1">
                      {nutritionData.mealScore}
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-card/40 border border-border/30 rounded-xl p-4">
                <p className="text-sm text-foreground leading-relaxed">{nutritionData.insight}</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleScanAnother}
                  className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold py-4 rounded-xl hover:shadow-[0_0_32px_rgba(156,204,102,0.4)] transition-all"
                >
                  Scan Another Meal
                </button>

                <button
                  onClick={handleBackToHome}
                  className="w-full bg-card/40 border border-border/30 text-foreground font-semibold py-4 rounded-xl hover:bg-card/60 transition-all"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <LimitReachedModal open={showLimitModal} onOpenChange={setShowLimitModal} />
    </div>
  )
}
