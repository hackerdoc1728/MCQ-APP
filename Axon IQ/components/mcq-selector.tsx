"use client"

import { X, ChevronLeft, ChevronRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useMCQState } from "@/hooks/use-mcq-state"

interface MCQSelectorProps {
  onClose: () => void
}

export function MCQSelector({ onClose }: MCQSelectorProps) {
  const { currentMCQ, answers, goToMCQ, mcqList, currentPage, setCurrentPage } = useMCQState()

  const startIdx = (currentPage - 1) * 30
  const endIdx = startIdx + 30
  const visibleMCQs = mcqList.slice(startIdx, endIdx)
  const totalPages = Math.ceil(mcqList.length / 30)

  const handleMCQSelect = (id: number) => {
    goToMCQ(id)
    onClose()
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Select Question</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-500 hover:text-slate-900">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* MCQ Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-3">
            {visibleMCQs.map((mcq) => {
              const isAnswered = answers[mcq.id] !== undefined
              const isCurrent = mcq.id === currentMCQ.id

              return (
                <button
                  key={mcq.id}
                  onClick={() => handleMCQSelect(mcq.id)}
                  className={cn(
                    "aspect-square rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    "border-2",
                    isAnswered && !isCurrent && "bg-indigo-100 border-indigo-600 text-indigo-900",
                    !isAnswered && !isCurrent && "border-slate-300 text-slate-700 hover:border-indigo-400",
                    isCurrent && "border-indigo-600 ring-4 ring-indigo-200 bg-indigo-600 text-white",
                  )}
                >
                  {isAnswered && !isCurrent ? <Check className="h-4 w-4" /> : mcq.id}
                </button>
              )
            })}
          </div>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="gap-2 bg-transparent"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-slate-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="gap-2 bg-transparent"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
