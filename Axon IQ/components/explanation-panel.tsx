"use client"

interface ExplanationPanelProps {
  correctAnswer: string
  explanation: string
  explanationImageUrl?: string
  onImageClick: (imageUrl: string) => void
}

export function ExplanationPanel({
  correctAnswer,
  explanation,
  explanationImageUrl,
  onImageClick,
}: ExplanationPanelProps) {
  return (
    <div className="bg-card border-t-2 border-border sticky bottom-0 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-semibold">
            {correctAnswer}
          </div>
          <span className="text-sm font-semibold text-foreground">Correct Answer</span>
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Explanation</h3>
          <p className="text-muted-foreground leading-relaxed">{explanation}</p>
          {explanationImageUrl && (
            <img
              src={explanationImageUrl || "/placeholder.svg"}
              alt="Explanation"
              className="rounded-lg border border-border max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => onImageClick(explanationImageUrl)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
