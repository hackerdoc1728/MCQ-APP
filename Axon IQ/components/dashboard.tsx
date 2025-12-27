"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CircularProgress } from "@/components/circular-progress"
import { MCQSolver } from "@/components/mcq-solver"
import { useMCQState } from "@/hooks/use-mcq-state"
import { useTheme } from "@/hooks/use-theme"
import { Sun, Moon, LogOut } from "lucide-react"

export function Dashboard() {
  const [showMCQ, setShowMCQ] = useState(false)
  const { stats, latestMCQ, goToMCQ } = useMCQState()
  const { theme, toggleTheme } = useTheme()

  const handleLogout = () => {
    console.log("User logged out")
    // Add actual logout logic here
  }

  if (showMCQ) {
    return <MCQSolver onBack={() => setShowMCQ(false)} />
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Axon IQ</h1>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="relative h-10 w-10 rounded-full hover:bg-accent"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-indigo-400" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  <Avatar className="h-10 w-10 cursor-pointer">
                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-sm text-muted-foreground">Total Questions</CardDescription>
              <CardTitle className="text-3xl font-bold text-foreground">{stats.totalAnswered}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-sm text-muted-foreground">Correct Answers</CardDescription>
              <CardTitle className="text-3xl font-bold text-foreground">{stats.totalCorrect}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3 flex flex-col items-center">
              <CardDescription className="text-sm text-muted-foreground self-start">Accuracy</CardDescription>
              <div className="mt-2">
                <CircularProgress value={stats.accuracy} size={80} strokeWidth={6} />
              </div>
            </CardHeader>
          </Card>
        </div>

        <Card
          className="cursor-pointer transition-all hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700"
          onClick={() => {
            goToMCQ(latestMCQ.id)
            setShowMCQ(true)
          }}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-foreground">MCQ #{latestMCQ.id}</CardTitle>
              <span className="text-xs font-medium text-muted-foreground bg-accent px-2 py-1 rounded">Latest</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground leading-relaxed">{latestMCQ.preview}</p>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-sm text-muted-foreground">Click to answer</span>
              <svg
                className="h-5 w-5 text-indigo-600 dark:text-indigo-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
