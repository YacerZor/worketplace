"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, ArrowRight } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

interface Product {
  id: number
  title_ar: string
  title_en: string
  description_ar: string
  description_en: string
  price: number
  old_price: number | null
  image: string
  status_ar: string
  status_en: string
  in_stock: boolean
  category_id: number
  rating: number
  slug: string
}

export function Products() {
  const { language } = useLanguage()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    fetchLatestProducts()
  }, [])

  async function fetchLatestProducts() {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("in_stock", true)
        .order("created_at", { ascending: false })
        .limit(5)

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section id="products" className="py-24 relative overflow-hidden">
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
            <span className="inline-block px-4 py-1 mb-4 border border-primary/30 text-primary rounded-full text-sm uppercase tracking-wider font-medium">
              {language === "ar" ? "أحدث المنتجات" : "New Arrivals"}
            </span>
            <h2 className="text-4xl font-bold mb-6">
              {language === "ar" ? "اكتشف" : "Discover"}
              <span className="gold-text"> {language === "ar" ? "أحدث إضافاتنا" : "Our Latest Additions"}</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {language === "ar"
                ? "استكشف أحدث المنتجات التي أضفناها إلى مجموعتنا"
                : "Explore the latest products we've added to our collection"}
            </p>
          </motion.div>

          {isLoading ? (
            // Loading Skeleton
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="group">
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse shadow-lg">
                    <div className="aspect-[3/4] bg-muted" />
                  </div>
                  <div className="mt-6 space-y-3">
                    <div className="h-4 bg-muted rounded-full animate-pulse w-3/4" />
                    <div className="h-4 bg-muted rounded-full animate-pulse w-1/2" />
                    <div className="h-8 bg-muted rounded-full animate-pulse w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group cursor-pointer"
                >
                  <Card className="overflow-hidden border-0 bg-white dark:bg-gray-900 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 rounded-3xl h-full">
                    <CardContent className="p-0 h-full flex flex-col">
                      {/* Product Image Container */}
                      <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                        <div className="aspect-[3/4] relative">
                          <img
                            src={product.image || "/placeholder.svg"}
                            alt={product[`title_${language}`]}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />

                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          {/* Sale Badge */}
                          {product.old_price && (
                            <div className="absolute top-4 left-4 z-10">
                              <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 px-4 py-2 text-sm font-bold shadow-xl rounded-full">
                                {language === "ar" ? "خصم" : "SALE"}
                              </Badge>
                            </div>
                          )}

                          {/* Out of Stock Overlay */}
                          {!product.in_stock && (
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
                              <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-8 py-4 shadow-xl">
                                <span className="text-lg font-bold text-gray-900">
                                  {language === "ar" ? "نفذت الكمية" : "Out of Stock"}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* View Button */}
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="bg-white/90 backdrop-blur-sm hover:bg-white rounded-full h-12 w-12 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-110"
                              asChild
                            >
                              <Link href={`/product/${product.slug}`}>
                                <Eye className="h-5 w-5 text-gray-700" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-6 flex flex-col flex-grow bg-white dark:bg-gray-900">
                        {/* Status Badge */}
                        <div className="mb-4">
                          <Badge
                            variant="outline"
                            className={`text-xs px-3 py-1 rounded-full font-medium ${
                              product.in_stock
                                ? "border-green-300 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400"
                                : "border-red-300 text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400"
                            }`}
                          >
                            {product.in_stock
                              ? language === "ar"
                                ? "متاح"
                                : "Available"
                              : language === "ar"
                                ? "غير متاح"
                                : "Out of Stock"}
                          </Badge>
                        </div>

                        {/* Product Title */}
                        <h3 className="text-xl font-bold mb-3 line-clamp-2 text-foreground group-hover:text-primary transition-colors duration-200 leading-tight">
                          {product[`title_${language}`]}
                        </h3>

                        {/* Product Description */}
                        <p className="text-muted-foreground text-sm mb-6 line-clamp-2 flex-grow leading-relaxed">
                          {product[`description_${language}`]}
                        </p>

                        {/* Price and Button Section */}
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl font-bold text-primary">
                                DA {product.price.toLocaleString()}
                              </span>
                              {product.old_price && (
                                <span className="text-lg line-through text-muted-foreground">
                                  DA {product.old_price.toLocaleString()}
                                </span>
                              )}
                            </div>
                            {product.old_price && (
                              <span className="text-xs text-green-600 font-medium">
                                {language === "ar"
                                  ? `وفر ${(product.old_price - product.price).toLocaleString()} دج`
                                  : `Save DA ${(product.old_price - product.price).toLocaleString()}`}
                              </span>
                            )}
                          </div>

                          <Button
                            variant="default"
                            size="sm"
                            className={`rounded-full px-6 py-3 font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 ${
                              product.in_stock
                                ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground"
                                : "bg-gray-400 hover:bg-gray-500 text-white cursor-not-allowed"
                            }`}
                            disabled={!product.in_stock}
                            asChild={product.in_stock}
                          >
                            {product.in_stock ? (
                              <Link href={`/product/${product.slug}`}>
                                {language === "ar" ? "شراء الآن" : "Buy Now"}
                              </Link>
                            ) : (
                              <span>{language === "ar" ? "نفذت الكمية" : "Out of Stock"}</span>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-xl font-semibold mb-2">
                {language === "ar" ? "لا توجد منتجات" : "No Products Found"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {language === "ar" ? "لم يتم إضافة أي منتجات بعد" : "No products have been added yet"}
              </p>
            </div>
          )}

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
              className="border-2 border-primary text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 transform hover:scale-105 uppercase tracking-wider font-medium px-8 py-4 rounded-full shadow-lg hover:shadow-xl bg-transparent"
              asChild
            >
              <Link href="/shop" className="flex items-center gap-2">
                {language === "ar" ? "تصفح جميع المنتجات" : "Browse All Products"}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
