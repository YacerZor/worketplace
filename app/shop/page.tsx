"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useLanguage } from "@/components/language-provider"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Filter, Search } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

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
  category_id: number | null
  rating: number
  slug: string
}

interface Category {
  id: number
  name_ar: string
  name_en: string
  slug: string
  description_ar: string
  description_en: string
  image: string
}

export default function ShopPage() {
  const { language } = useLanguage()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState<number | null>(null)
  const [minPrice, setMinPrice] = useState<number>(0)
  const [maxPrice, setMaxPrice] = useState<number>(10000000)
  const [sortBy, setSortBy] = useState<string>("newest")
  const [inStockOnly, setInStockOnly] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchCategories()

    const categoryParam = searchParams.get("category")
    if (categoryParam) {
      setActiveCategory(Number.parseInt(categoryParam))
    }

    const searchParam = searchParams.get("search")
    if (searchParam) {
      setSearchQuery(searchParam)
    }
  }, [searchParams])

  useEffect(() => {
    fetchProducts()
  }, [activeCategory, minPrice, maxPrice, sortBy, inStockOnly, searchQuery])

  async function fetchCategories() {
    try {
      const { data, error } = await supabase.from("categories").select("*")
      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  async function fetchProducts() {
    setIsLoading(true)
    try {
      let query = supabase.from("products").select("*")

      if (activeCategory) {
        query = query.eq("category_id", activeCategory)
      }

      query = query.gte("price", minPrice).lte("price", maxPrice)

      if (inStockOnly) {
        query = query.eq("in_stock", true)
      }

      if (searchQuery) {
        query = query.or(`title_ar.ilike.%${searchQuery}%,title_en.ilike.%${searchQuery}%`)
      }

      switch (sortBy) {
        case "newest":
          query = query.order("created_at", { ascending: false })
          break
        case "price-asc":
          query = query.order("price", { ascending: true })
          break
        case "price-desc":
          query = query.order("price", { ascending: false })
          break
        case "name-asc":
          query = query.order(language === "ar" ? "title_ar" : "title_en", { ascending: true })
          break
        case "name-desc":
          query = query.order(language === "ar" ? "title_ar" : "title_en", { ascending: false })
          break
      }

      const { data, error } = await query
      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetFilters = () => {
    setActiveCategory(null)
    setMinPrice(0)
    setMaxPrice(10000000)
    setInStockOnly(false)
    setSortBy("newest")
    setSearchQuery("")
  }

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return language === "ar" ? "جميع المنتجات" : "All Products"
    const category = categories.find((cat) => cat.id === categoryId)
    return category ? category[`name_${language}`] : ""
  }

  return (
    <>
      <Navbar />
      <main className="pt-20">
        <section className="bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{language === "ar" ? "متجرنا" : "Our Shop"}</h1>
              <p className="text-muted-foreground text-lg mb-8">
                {language === "ar"
                  ? "استكشف مجموعتنا الواسعة من المنتجات عالية الجودة"
                  : "Explore our wide collection of high-quality products"}
              </p>
              <div className="max-w-md mx-auto relative">
                <Input
                  type="search"
                  placeholder={language === "ar" ? "ابحث عن منتجات..." : "Search for products..."}
                  className="pr-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </div>
        </section>

        <section className="py-6 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                variant={activeCategory === null ? "default" : "outline"}
                className={`rounded-full px-8 py-6 transition-all duration-300 ${
                  activeCategory === null
                    ? "bg-[#d4af37] hover:bg-[#d4af37]/90 text-white shadow-lg"
                    : "hover:bg-[#d4af37]/10 hover:border-[#d4af37] hover:text-[#d4af37]"
                }`}
                onClick={() => setActiveCategory(null)}
              >
                {language === "ar" ? "الكل" : "All"}
              </Button>

              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={activeCategory === category.id ? "default" : "outline"}
                  className={`rounded-full px-6 py-6 transition-all duration-300 ${
                    activeCategory === category.id
                      ? "bg-[#d4af37] hover:bg-[#d4af37]/90 text-white shadow-lg"
                      : "hover:bg-[#d4af37]/10 hover:border-[#d4af37] hover:text-[#d4af37]"
                  }`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category[`name_${language}`]}
                </Button>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">
                      {searchQuery
                        ? language === "ar"
                          ? `نتائج البحث: "${searchQuery}"`
                          : `Search Results: "${searchQuery}"`
                        : getCategoryName(activeCategory)}
                      <span className="text-muted-foreground ml-2">({products.length})</span>
                    </h2>
                  </div>

                  <div className="flex items-center gap-4">
                    <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Filter className="h-4 w-4 mr-2" />
                          {language === "ar" ? "فلتر" : "Filter"}
                        </Button>
                      </SheetTrigger>
                      <SheetContent side={language === "ar" ? "right" : "left"} className="w-[300px] sm:w-[400px]">
                        <SheetHeader>
                          <SheetTitle>{language === "ar" ? "فلتر المنتجات" : "Filter Products"}</SheetTitle>
                        </SheetHeader>
                        <div className="py-4 space-y-6">
                          <Accordion type="single" collapsible defaultValue="categories">
                            <AccordionItem value="categories">
                              <AccordionTrigger>{language === "ar" ? "الأقسام" : "Categories"}</AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-2 pt-2">
                                  <Button
                                    variant={activeCategory === null ? "default" : "ghost"}
                                    className={`w-full justify-start ${
                                      activeCategory === null
                                        ? "bg-[#d4af37] hover:bg-[#d4af37]/90 text-white"
                                        : "hover:bg-[#d4af37]/10 hover:text-[#d4af37]"
                                    }`}
                                    onClick={() => setActiveCategory(null)}
                                  >
                                    {language === "ar" ? "جميع المنتجات" : "All Products"}
                                  </Button>
                                  {categories.map((category) => (
                                    <Button
                                      key={category.id}
                                      variant={activeCategory === category.id ? "default" : "ghost"}
                                      className={`w-full justify-start ${
                                        activeCategory === category.id
                                          ? "bg-[#d4af37] hover:bg-[#d4af37]/90 text-white"
                                          : "hover:bg-[#d4af37]/10 hover:text-[#d4af37]"
                                      }`}
                                      onClick={() => setActiveCategory(category.id)}
                                    >
                                      {category[`name_${language}`]}
                                    </Button>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="price">
                              <AccordionTrigger>{language === "ar" ? "نطاق السعر" : "Price Range"}</AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-4 pt-2">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-sm text-muted-foreground mb-1 block">
                                        {language === "ar" ? "من" : "Min"}
                                      </label>
                                      <Input
                                        type="number"
                                        min="0"
                                        value={minPrice}
                                        onChange={(e) => setMinPrice(Number(e.target.value))}
                                        className="h-9"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm text-muted-foreground mb-1 block">
                                        {language === "ar" ? "إلى" : "Max"}
                                      </label>
                                      <Input
                                        type="number"
                                        min="0"
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                                        className="h-9"
                                      />
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full bg-transparent"
                                    onClick={() => {
                                      fetchProducts()
                                    }}
                                  >
                                    {language === "ar" ? "تطبيق" : "Apply"}
                                  </Button>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="availability">
                              <AccordionTrigger>{language === "ar" ? "التوفر" : "Availability"}</AccordionTrigger>
                              <AccordionContent>
                                <div className="flex items-center space-x-2 rtl:space-x-reverse pt-2">
                                  <Checkbox
                                    id="mobile-in-stock"
                                    checked={inStockOnly}
                                    onCheckedChange={(checked) => setInStockOnly(checked as boolean)}
                                  />
                                  <label
                                    htmlFor="mobile-in-stock"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {language === "ar" ? "المنتجات المتوفرة فقط" : "In stock only"}
                                  </label>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>
                        <SheetFooter className="flex flex-row gap-3 sm:justify-between">
                          <Button variant="outline" className="flex-1 bg-transparent" onClick={resetFilters}>
                            {language === "ar" ? "إعادة تعيين" : "Reset"}
                          </Button>
                          <SheetClose asChild>
                            <Button className="flex-1">{language === "ar" ? "تطبيق الفلاتر" : "Apply Filters"}</Button>
                          </SheetClose>
                        </SheetFooter>
                      </SheetContent>
                    </Sheet>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={language === "ar" ? "ترتيب حسب" : "Sort by"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">{language === "ar" ? "الأحدث" : "Newest"}</SelectItem>
                        <SelectItem value="price-asc">
                          {language === "ar" ? "السعر: من الأقل إلى الأعلى" : "Price: Low to High"}
                        </SelectItem>
                        <SelectItem value="price-desc">
                          {language === "ar" ? "السعر: من الأعلى إلى الأقل" : "Price: High to Low"}
                        </SelectItem>
                        <SelectItem value="name-asc">{language === "ar" ? "الاسم: أ-ي" : "Name: A-Z"}</SelectItem>
                        <SelectItem value="name-desc">{language === "ar" ? "الاسم: ي-أ" : "Name: Z-A"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {Array.from({ length: 8 }).map((_, index) => (
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
                      {language === "ar"
                        ? "لم يتم العثور على منتجات تطابق معايير البحث الخاصة بك"
                        : "No products match your search criteria"}
                    </p>
                    <Button variant="outline" onClick={resetFilters}>
                      {language === "ar" ? "إعادة تعيين الفلاتر" : "Reset Filters"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
