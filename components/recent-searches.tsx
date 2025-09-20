"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, X } from "lucide-react"

interface RecentSearchesProps {
  onSearchSelect: (query: string) => void
  currentQuery: string
}

export function RecentSearches({ onSearchSelect, currentQuery }: RecentSearchesProps) {
  const { language } = useLanguage()
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem("recentSearches")
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (error) {
        console.error("Error loading recent searches:", error)
      }
    }
  }, [])

  const addRecentSearch = (query: string) => {
    if (!query.trim() || query.length < 2) return

    const trimmedQuery = query.trim()
    const updated = [trimmedQuery, ...recentSearches.filter((s) => s !== trimmedQuery)].slice(0, 8)
    setRecentSearches(updated)
    localStorage.setItem("recentSearches", JSON.stringify(updated))
  }

  const removeRecentSearch = (query: string) => {
    const updated = recentSearches.filter((s) => s !== query)
    setRecentSearches(updated)
    localStorage.setItem("recentSearches", JSON.stringify(updated))
  }

  const clearAllSearches = () => {
    setRecentSearches([])
    localStorage.removeItem("recentSearches")
  }

  // Expose addRecentSearch function globally for use in other components
  useEffect(() => {
    window.addRecentSearch = addRecentSearch
  }, [recentSearches])

  if (recentSearches.length === 0) return null

  return (
    <div className="bg-background border border-border rounded-md shadow-lg p-4 mt-1">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">
            {language === "ar" ? "البحوثات الأخيرة" : "Recent Searches"}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllSearches}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {language === "ar" ? "مسح الكل" : "Clear All"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {recentSearches.map((search, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors group flex items-center gap-1 max-w-[200px]"
            onClick={() => onSearchSelect(search)}
          >
            <span className="truncate">{search}</span>
            <X
              className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                removeRecentSearch(search)
              }}
            />
          </Badge>
        ))}
      </div>
    </div>
  )
}
