"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface MCQOption {
  id: string
  text: string
  imageUrl?: string
}

interface MCQ {
  id: number
  question: string
  imageUrl?: string
  youtubeId?: string
  options: MCQOption[]
  correctAnswer: string
  explanation: string
  explanationImageUrl?: string
}

interface MCQState {
  currentMCQId: number
  answers: Record<number, string>
  currentPage: number
  mcqList: MCQ[]
  currentMCQ: MCQ
  stats: {
    totalAnswered: number
    totalCorrect: number
    accuracy: number
  }
  latestMCQ: {
    id: number
    preview: string
  }
  submitAnswer: (mcqId: number, answer: string) => void
  goToMCQ: (mcqId: number) => MCQ
  isAnswered: (mcqId: number) => boolean
  setCurrentPage: (page: number) => void
}

// Mock MCQ data
const generateMCQs = (): MCQ[] => {
  const questions = [
    {
      question:
        "A 65-year-old patient presents with resting tremor, bradykinesia, and rigidity. Which neurotransmitter deficiency is most likely responsible for these symptoms?",
      correctAnswer: "B",
      explanation:
        "Parkinson's disease is characterized by degeneration of dopaminergic neurons in the substantia nigra, leading to dopamine deficiency in the basal ganglia. This causes the classic motor symptoms of resting tremor, bradykinesia, and rigidity.",
      youtubeId: "WkzITA7YlXk",
    },
    {
      question:
        "A 32-year-old woman presents with episodes of severe, unilateral, periorbital pain lasting 45-90 minutes, accompanied by lacrimation and nasal congestion. What is the most likely diagnosis?",
      correctAnswer: "C",
      explanation:
        "Cluster headaches are characterized by severe, unilateral periorbital or temporal pain lasting 15-180 minutes, with associated autonomic symptoms such as lacrimation, nasal congestion, and ptosis. They occur in clusters over weeks to months.",
      imageUrl: "/cluster-headache-pain-pattern.jpg",
    },
    {
      question:
        "Which cranial nerve is responsible for lateral eye movement and is most commonly affected in diabetic neuropathy?",
      correctAnswer: "A",
      explanation:
        "The abducens nerve (CN VI) controls the lateral rectus muscle, which abducts the eye. It is the most commonly affected cranial nerve in diabetic neuropathy, leading to isolated lateral gaze palsy.",
    },
  ]

  const options = [
    [
      { id: "A", text: "Serotonin" },
      { id: "B", text: "Dopamine" },
      { id: "C", text: "Acetylcholine" },
      { id: "D", text: "Norepinephrine" },
    ],
    [
      { id: "A", text: "Migraine with aura" },
      { id: "B", text: "Tension-type headache" },
      { id: "C", text: "Cluster headache" },
      { id: "D", text: "Trigeminal neuralgia" },
    ],
    [
      { id: "A", text: "Abducens nerve (CN VI)" },
      { id: "B", text: "Oculomotor nerve (CN III)" },
      { id: "C", text: "Trochlear nerve (CN IV)" },
      { id: "D", text: "Optic nerve (CN II)" },
    ],
  ]

  const mcqs: MCQ[] = []

  for (let i = 1; i <= 90; i++) {
    const template = questions[(i - 1) % 3]
    const optionSet = options[(i - 1) % 3]

    mcqs.push({
      id: i,
      question: template.question,
      imageUrl: template.imageUrl,
      youtubeId: template.youtubeId,
      options: optionSet,
      correctAnswer: template.correctAnswer,
      explanation: template.explanation,
      explanationImageUrl: template.explanationImageUrl,
    })
  }

  return mcqs
}

const mcqData = generateMCQs()

export const useMCQState = create<MCQState>()(
  persist(
    (set, get) => ({
      currentMCQId: 1,
      answers: {},
      currentPage: 1,
      mcqList: mcqData,
      currentMCQ: mcqData[0],
      stats: {
        totalAnswered: 0,
        totalCorrect: 0,
        accuracy: 0,
      },
      latestMCQ: {
        id: 1,
        preview: mcqData[0].question,
      },
      submitAnswer: (mcqId, answer) => {
        set((state) => {
          const newAnswers = { ...state.answers, [mcqId]: answer }
          const mcq = state.mcqList.find((m) => m.id === mcqId)
          const isCorrect = mcq?.correctAnswer === answer

          const totalAnswered = Object.keys(newAnswers).length
          const totalCorrect = Object.entries(newAnswers).filter(([id, ans]) => {
            const question = state.mcqList.find((m) => m.id === Number.parseInt(id))
            return question?.correctAnswer === ans
          }).length
          const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0

          return {
            answers: newAnswers,
            stats: {
              totalAnswered,
              totalCorrect,
              accuracy,
            },
          }
        })
      },
      goToMCQ: (mcqId) => {
        const mcq = get().mcqList.find((m) => m.id === mcqId) || get().mcqList[0]
        set({
          currentMCQId: mcqId,
          currentMCQ: mcq,
          latestMCQ: {
            id: mcqId,
            preview: mcq.question,
          },
        })
        return mcq
      },
      isAnswered: (mcqId) => {
        return get().answers[mcqId] !== undefined
      },
      setCurrentPage: (page) => {
        set({ currentPage: page })
      },
    }),
    {
      name: "axon-iq-storage",
    },
  ),
)
