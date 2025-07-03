"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Menu, X, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

interface SearchResult {
  id: number
  title_ar: string
  title_en: string
  slug: string
  image: string
  price: number
}

export function Navbar() {
  const { language, setLanguage } = useLanguage()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const navigation = [
    { name: { ar: "الرئيسية", en: "Home" }, href: "/" },
    { name: { ar: "المتجر", en: "Shop" }, href: "/shop" },
    { name: { ar: "الشحن", en: "Shipping" }, href: "/shipping" },
    { name: { ar: "تتبع الطلب", en: "Track Order" }, href: "/track-order" },
    { name: { ar: "تواصل معنا", en: "Contact" }, href: "/#contact" },
  ]

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length > 1) {
        performSearch()
      } else {
        setSearchResults([])
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(delaySearch)
  }, [searchQuery])

  const performSearch = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, title_ar, title_en, slug, image, price")
        .or(`title_ar.ilike.%${searchQuery}%, title_en.ilike.%${searchQuery}%`)
        .limit(8)

      if (error) throw error
      setSearchResults(data || [])
      setShowResults(true)
    } catch (error) {
      console.error("Error searching products:", error)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery)}`)
      setIsSearchOpen(false)
      setShowResults(false)
    }
  }

  const handleSearchItemClick = (slug: string) => {
    router.push(`/product/${slug}`)
    setSearchQuery("")
    setShowResults(false)
    setIsSearchOpen(false)
  }

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "bg-background/95 backdrop-blur-sm shadow-md" : "bg-transparent",
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <img
                src="https://i.imgur.com/ufgqHwx.jpeg"
                alt="Worket Place Logo"
                className="w-12 h-12 object-contain"
              />
              <span className="font-bold text-2xl gold-text">WORKET PLACE</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-foreground/80 hover:text-primary transition-colors text-sm uppercase tracking-wider font-medium"
                >
                  {item.name[language]}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isSearchOpen ? (
              <div ref={searchRef} className="hidden md:block relative">
                <form onSubmit={handleSearchSubmit}>
                  <div className="relative">
                    <Input
                      type="search"
                      placeholder={language === "ar" ? "بحث..." : "Search..."}
                      className="w-64 pr-8 border-primary/20 focus:border-primary"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                    <X
                      className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer"
                      onClick={() => {
                        setIsSearchOpen(false)
                        setSearchQuery("")
                        setShowResults(false)
                      }}
                    />
                  </div>
                </form>

                {/* Search Results Dropdown */}
                {showResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-[400px] overflow-auto">
                    <div className="p-2">
                      <h3 className="text-sm font-medium px-2 py-1 text-muted-foreground">
                        {language === "ar" ? "نتائج البحث" : "Search Results"}
                      </h3>
                      <div className="divide-y divide-border">
                        {searchResults.map((result) => (
                          <div
                            key={result.id}
                            className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer rounded-md transition-colors"
                            onClick={() => handleSearchItemClick(result.slug)}
                          >
                            <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                              <img
                                src={result.image || "/placeholder.svg"}
                                alt={result[`title_${language}`]}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = "/placeholder.svg?height=48&width=48"
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{result[`title_${language}`]}</p>
                              <p className="text-sm text-primary font-semibold">DA {result.price.toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* No Results */}
                {showResults && searchResults.length === 0 && searchQuery.trim().length > 1 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50">
                    <div className="p-4 text-center text-muted-foreground">
                      {language === "ar" ? "لا توجد نتائج" : "No results found"}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex hover:text-primary"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
              className={cn("hidden md:flex", language === "ar" ? "text-primary" : "text-foreground/80")}
            >
              {language === "ar" ? "عربي" : "EN"}
            </Button>

            <ThemeToggle />

            <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="md:hidden">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-border bg-background/95 mt-2">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <form onSubmit={handleSearchSubmit} className="relative mb-4">
              <Input
                type="search"
                placeholder={language === "ar" ? "بحث..." : "Search..."}
                className="w-full pr-8 border-primary/20 focus:border-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="absolute right-2 top-2.5">
                <Search className="h-4 w-4 text-muted-foreground" />
              </button>
            </form>

            {/* Mobile Search Results */}
            {showResults && searchResults.length > 0 && (
              <div className="bg-muted rounded-md p-2 mb-4">
                <h3 className="text-sm font-medium px-2 py-1 text-muted-foreground">
                  {language === "ar" ? "نتائج البحث" : "Search Results"}
                </h3>
                <div className="space-y-2">
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center gap-3 p-2 hover:bg-background cursor-pointer rounded-md transition-colors"
                      onClick={() => {
                        handleSearchItemClick(result.slug)
                        setIsOpen(false)
                      }}
                    >
                      <div className="relative w-10 h-10 rounded-md overflow-hidden bg-background flex-shrink-0">
                        <img
                          src={result.image || "/placeholder.svg"}
                          alt={result[`title_${language}`]}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/placeholder.svg?height=40&width=40"
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{result[`title_${language}`]}</p>
                        <p className="text-sm text-primary font-semibold">DA {result.price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-foreground/80 hover:text-primary transition-colors uppercase tracking-wider text-sm font-medium"
                onClick={() => setIsOpen(false)}
              >
                {item.name[language]}
              </Link>
            ))}
            <div className="flex items-center gap-4 pt-4 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLanguage(language === "ar" ? "en" : "ar")
                  setIsOpen(false)
                }}
              >
                {language === "ar" ? "عربي" : "EN"}
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
