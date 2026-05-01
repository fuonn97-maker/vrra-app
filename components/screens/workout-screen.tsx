'use client'

import { useState, useEffect } from 'react'
import { getExercisesByPreferences } from '@/lib/workout-library'

interface WorkoutScreenProps {
  isPremium: boolean
}

export default function WorkoutScreen({ isPremium }: WorkoutScreenProps) {
  const [step, setStep] = useState(1)

  const [gender, setGender] = useState<string | null>(null)
  const [age, setAge] = useState<number | null>(null)
  const [goal, setGoal] = useState<string | null>(null)
  const [level, setLevel] = useState<string | null>(null)
  const [equipment, setEquipment] = useState<string | null>(null)
  const [bodyFocus, setBodyFocus] = useState<string | null>(null)
  const [generatedWorkout, setGeneratedWorkout] = useState<any[]>([])

  useEffect(() => {
    if (!isPremium) {
      window.location.href = '/premium'
    }
  }, [isPremium])

  const handleGenerateWorkout = () => {
  if (!goal || !level || !equipment || !bodyFocus) return

  const goalMap: any = {
    'Lose Weight': 'lose_weight',
    'Gain Strength': 'gain_strength',
    'Gain Muscle': 'gain_muscle',
  }

  const levelMap: any = {
    Novice: 'novice',
    Beginner: 'beginner',
    Intermediate: 'intermediate',
    Advanced: 'advanced',
  }

  const equipmentMap: any = {
    Barbell: 'barbell',
    Dumbbells: 'dumbbells',
    Bodyweight: 'bodyweight',
    Machine: 'machine',
    Kettlebells: 'kettlebells',
    Cables: 'cables',
    Band: 'band',
  }

  const exercises = getExercisesByPreferences({
    goal: goalMap[goal] as any,
    level: levelMap[level] as any,
    equipment: [equipmentMap[equipment]] as any,
  })

  const filteredExercises = exercises.filter(
    (exercise) => exercise.category === bodyFocus.toLowerCase()
  )

  setGeneratedWorkout(filteredExercises)
  setStep(8)
}

  return (
    <div className="pb-24 px-4 pt-6 space-y-6">
      {step === 1 && (
        <SelectionPage
          title="Select Gender"
          options={['Male', 'Female']}
          onSelect={(value) => {
            setGender(value)
            setStep(2)
          }}
        />
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h1 className="text-3xl font-black">Select Age</h1>

          <input
            type="number"
            min="12"
            max="90"
            placeholder="Enter your age"
            className="w-full rounded-2xl border border-white/10 bg-card/50 px-4 py-4"
            onChange={(e) => setAge(Number(e.target.value))}
          />

          <button
            onClick={() => setStep(3)}
            className="w-full rounded-2xl bg-primary py-4 font-black"
          >
            Continue
          </button>
        </div>
      )}

      {step === 3 && (
        <SelectionPage
          title="Fitness Goal"
          options={[
            'Lose Weight',
            'Gain Strength',
            'Gain Muscle',
          ]}
          onSelect={(value) => {
            setGoal(value)
            setStep(4)
          }}
        />
      )}

      {step === 4 && (
        <SelectionPage
          title="Fitness Level"
          options={[
            'Novice',
            'Beginner',
            'Intermediate',
            'Advanced',
          ]}
          onSelect={(value) => {
            setLevel(value)
            setStep(5)
          }}
        />
      )}

      {step === 5 && (
        <SelectionPage
          title="Select Equipment"
          options={[
            'Barbell',
            'Dumbbells',
            'Bodyweight',
            'Machine',
            'Kettlebells',
            'Cables',
            'Band',
          ]}
          onSelect={(value) => {
            setEquipment(value)
            setStep(6)
          }}
        />
      )}

      {step === 6 && (
        <SelectionPage
          title="Select Body Focus"
          options={[
            'glutes',
            'obliques',
            'hamstrings',
            'abdominis',
            'chest',
            'back',
            'legs',
            'shoulders',
            'arms',
            'core',
            'quads',
            'lats',
            'quads/glutes',
          ]}
          onSelect={(value) => {
            setBodyFocus(value)
            setStep(7)
          }}
        />
      )}

      {step === 7 && (
        <div className="space-y-5">
          <h1 className="text-3xl font-black">
            Workout Summary
          </h1>

          <SummaryCard title="Gender" value={gender} />
          <SummaryCard title="Age" value={age?.toString()} />
          <SummaryCard title="Goal" value={goal} />
          <SummaryCard title="Level" value={level} />
          <SummaryCard title="Equipment" value={equipment} />
          <SummaryCard title="Body Focus" value={bodyFocus} />

          <button
            onClick={handleGenerateWorkout}
            className="w-full rounded-2xl bg-gradient-to-r from-primary to-secondary py-4 font-black"
          >
            Generate Workout
          </button>
        </div>
      )}

{step === 8 && (
  <div className="space-y-4">
    <h1 className="text-3xl font-black">Your Workout Plan</h1>

    {generatedWorkout.map((exercise) => (
      <div
        key={exercise.id}
        className="rounded-3xl border border-white/10 bg-card/50 p-4 space-y-3"
      >
        <video
          src={exercise.video}
          controls
          className="w-full rounded-2xl"
        />

        <h2 className="text-xl font-bold">{exercise.name}</h2>

        <p>Muscle: {exercise.muscleGroup}</p>
        <p>Sets: {exercise.sets}</p>
        <p>Reps: {exercise.reps}</p>
        <p>Rest: {exercise.rest}s</p>
      </div>
    ))}
  </div>
)}

    </div>
  )
}

function SelectionPage({
  title,
  options,
  onSelect,
}: {
  title: string
  options: string[]
  onSelect: (value: string) => void
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">{title}</h1>

      <div className="space-y-3">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onSelect(option)}
            className="w-full rounded-2xl border border-white/10 bg-card/50 py-4 px-4 text-left font-bold"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

function SummaryCard({
  title,
  value,
}: {
  title: string
  value?: string | null
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-card/50 p-4">
      <p className="text-sm text-foreground/50">{title}</p>
      <p className="text-lg font-black mt-1">{value || '-'}</p>
    </div>
  )
}