"use client"

import { motion } from "framer-motion"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Star, Eye } from "lucide-react"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface Game {
  id: number
  title_ar: string
  title_en: string
  description_ar: string
  description_en: string
  image: string
  status_ar: string
  status_en: string
  link: string
}

export function Games() {
  const { language } = useLanguage()
  const [games, setGames] = useState<Game[]>([])

  useEffect(() => {
    async function fetchGames() {
      const { data, error } = await supabase.from("games").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching games:", error)
      } else {
        setGames(data || [])
      }
    }

    fetchGames()
  }, [])

  // Add price data for shop functionality
  const gamesWithPrices = games.map((game) => ({
    ...game,
    price: Math.floor(Math.random() * 50) + 10, // Random price between 10-60
    oldPrice: Math.random() > 0.5 ? Math.floor(Math.random() * 70) + 30 : null, // 50% chance of having a sale
    rating: (Math.random() * 2 + 3).toFixed(1), // Rating between 3-5
    inStock: Math.random() > 0.2, // 80% chance of being in stock
  }))

  return (
    <section id="games" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-background/80"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1 mb-4 bg-primary/10 text-primary rounded-full text-sm font-medium">
              {language === "ar" ? "منتجاتنا" : "Our Products"}
            </span>
            <h2 className="text-4xl font-bold mb-6">
              {language === "ar" ? "أفضل الألعاب" : "Best Games"}
              <span className="text-primary"> {language === "ar" ? "المتاحة" : "Available"}</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {language === "ar"
                ? "استكشف مجموعتنا من الألعاب عالية الجودة بأسعار تنافسية"
                : "Explore our collection of high-quality games at competitive prices"}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {gamesWithPrices.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="product-card overflow-hidden border border-border bg-card">
                  <CardContent className="p-0">
                    <div className="relative">
                      <img
                        src={game.image || "/placeholder.svg"}
                        alt={game[`title_${language}`]}
                        className="w-full aspect-video object-cover"
                      />
                      {game.oldPrice && (
                        <span className="absolute top-2 right-2 badge-sale">{language === "ar" ? "خصم" : "SALE"}</span>
                      )}
                      {!game.inStock && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                          <span className="text-lg font-bold text-destructive">
                            {language === "ar" ? "نفذت الكمية" : "Out of Stock"}
                          </span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="bg-background/80 backdrop-blur-sm rounded-full h-8 w-8"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center mb-2">
                        <div className="flex items-center text-yellow-500">
                          <Star className="fill-yellow-500 stroke-yellow-500 h-4 w-4" />
                          <span className="ml-1 text-sm font-medium">{game.rating}</span>
                        </div>
                        <Badge variant="outline" className="ml-auto">
                          {game[`status_${language}`]}
                        </Badge>
                      </div>
                      <h3 className="text-xl font-bold mb-2 line-clamp-1">{game[`title_${language}`]}</h3>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {game[`description_${language}`]}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="price">DA {game.price}</span>
                          {game.oldPrice && <span className="price-old">DA {game.oldPrice}</span>}
                        </div>
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-primary hover:bg-primary/90"
                          disabled={!game.inStock}
                        >
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          {game.inStock
                            ? language === "ar"
                              ? "أضف للسلة"
                              : "Add to Cart"
                            : language === "ar"
                              ? "نفذت الكمية"
                              : "Out of Stock"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <Button
              variant="outline"
              size="lg"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 transform hover:scale-105"
            >
              {language === "ar" ? "عرض المزيد من المنتجات" : "View More Products"}
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
