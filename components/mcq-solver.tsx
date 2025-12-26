"use client"

import { useState } from "react"
import { ChevronLeft, Grid3x3, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useMCQState } from "@/hooks/use-mcq-state"
import { MCQSelector } from "@/components/mcq-selector"
import { VideoModal } from "@/components/video-modal"
import { ExplanationPanel } from "@/components/explanation-panel"
import { ImageLightbox } from "@/components/image-lightbox"

interface MCQSolverProps {
  onBack: () => void
}

export function MCQSolver({ onBack }: MCQSolverProps) {
  const { currentMCQ, answers, submitAnswer, goToMCQ, isAnswered } = useMCQState()
  const [selectedOption, setSelectedOption] = useState<string | null>(answers[currentMCQ.id] || null)
  const [showSelector, setShowSelector] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const submitted = isAnswered(currentMCQ.id)

  const handleSubmit = () => {
    if (selectedOption) {
      submitAnswer(currentMCQ.id, selectedOption)
    }
  }

  const handleOptionSelect = (option: string) => {
    if (!submitted) {
      setSelectedOption(option)
    }
  }

  const handlePrevious = () => {
    if (currentMCQ.id > 1) {
      const prevMCQ = goToMCQ(currentMCQ.id - 1)
      setSelectedOption(answers[prevMCQ.id] || null)
    }
  }

  const handleNext = () => {
    const nextMCQ = goToMCQ(currentMCQ.id + 1)
    setSelectedOption(answers[nextMCQ.id] || null)
  }

  return (
    <>
      <div className="min-h-screen bg-background flex flex-col transition-colors duration-300">
        {/* Header */}
        <header className="bg-card border-b border-border sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={onBack} className="text-foreground">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">Axon IQ</h1>
            <Button variant="ghost" size="icon" onClick={() => setShowSelector(true)} className="text-foreground">
              <Grid3x3 className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Question Content */}
        <main className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full">
          <div className="space-y-6">
            {/* Question Header */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Question {currentMCQ.id}</p>
              <h2 className="text-xl font-semibold text-foreground leading-relaxed">{currentMCQ.question}</h2>
            </div>

            {/* Question Image */}
            {currentMCQ.imageUrl && (
              <div
                className="rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setLightboxImage(currentMCQ.imageUrl!)}
              >
                <img
                  src={currentMCQ.imageUrl || "/placeholder.svg"}
                  alt="Question illustration"
                  className="w-full h-auto"
                />
              </div>
            )}

            {/* YouTube Video */}
            {currentMCQ.youtubeId && (
              <Card
                className="p-4 cursor-pointer hover:border-indigo-500 transition-colors"
                onClick={() => setShowVideo(true)}
              >
                <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 dark:bg-slate-800">
                  <img
                    src={`https://img.youtube.com/vi/${currentMCQ.youtubeId}/maxresdefault.jpg`}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-indigo-600 rounded-full p-4 hover:bg-indigo-700 transition-colors">
                      <Play className="h-8 w-8 text-white fill-white" />
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Options */}
            <div className="space-y-3">
              {currentMCQ.options.map((option) => {
                const isCorrect = option.id === currentMCQ.correctAnswer
                const isSelected = selectedOption === option.id
                const showCorrect = submitted && isCorrect
                const showIncorrect = submitted && isSelected && !isCorrect

                return (
                  <Card
                    key={option.id}
                    className={cn(
                      "p-4 cursor-pointer transition-all",
                      !submitted && "hover:border-indigo-400",
                      isSelected && !submitted && "border-indigo-600 dark:border-indigo-500 border-2",
                      showCorrect && "border-green-600 dark:border-green-500 bg-green-50 dark:bg-green-950/30 border-2",
                      showIncorrect && "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 opacity-60",
                      submitted && "cursor-default",
                    )}
                    onClick={() => handleOptionSelect(option.id)}
                  >
                    <div className="flex gap-3">
                      <span className="font-semibold text-muted-foreground flex-shrink-0">{option.id}.</span>
                      <div className="flex-1 space-y-3">
                        <p className="text-foreground leading-relaxed">{option.text}</p>
                        {option.imageUrl && (
                          <img
                            src={option.imageUrl || "/placeholder.svg"}
                            alt={`Option ${option.id}`}
                            className="rounded-md border border-border max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              setLightboxImage(option.imageUrl!)
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Submit Button */}
            {!submitted && (
              <Button
                onClick={handleSubmit}
                disabled={!selectedOption}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Answer
              </Button>
            )}

            {/* Navigation Controls */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentMCQ.id === 1}
                className="flex-1 bg-transparent"
              >
                Previous
              </Button>
              <Button variant="outline" onClick={handleNext} className="flex-1 bg-transparent">
                Next
              </Button>
            </div>
          </div>
        </main>

        {/* Explanation Panel */}
        {submitted && (
          <ExplanationPanel
            correctAnswer={currentMCQ.correctAnswer}
            explanation={currentMCQ.explanation}
            explanationImageUrl={currentMCQ.explanationImageUrl}
            onImageClick={setLightboxImage}
          />
        )}
      </div>

      {/* Modals */}
      {showSelector && <MCQSelector onClose={() => setShowSelector(false)} />}
      {showVideo && currentMCQ.youtubeId && (
        <VideoModal youtubeId={currentMCQ.youtubeId} onClose={() => setShowVideo(false)} />
      )}
      {lightboxImage && <ImageLightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />}
    </>
  )
}
