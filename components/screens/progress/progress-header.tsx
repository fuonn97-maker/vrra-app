interface ProgressHeaderProps {
  title?: string
  subtitle?: string
}

export default function ProgressHeader({
  title = 'Progress',
  subtitle = "You're improving compared to last week",
}: ProgressHeaderProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-5xl font-black text-foreground leading-tight">{title}</h1>
      <p className="text-base text-foreground/70">{subtitle}</p>
    </div>
  )
}
