"use client"

import Link from "next/link"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useLanguage } from "@/components/language-provider"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Truck, Minus, Plus, ChevronLeft, ChevronRight, Search, ZoomIn, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { deliveryPrices, getDeliveryPrice } from "@/lib/delivery-prices"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

interface ProductImage {
  id: number
  product_id: number
  image_url: string
  is_main: boolean
  sort_order: number
}

interface ProductVariant {
  id: number
  product_id: number
  variant_type: string
  name_ar: string
  name_en: string
  value: string
  in_stock: boolean
}

// Function to generate random order number
const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString()
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return `ORD${timestamp.slice(-6)}${random}`
}

export default function ProductPage() {
  const { language } = useLanguage()
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [product, setProduct] = useState<Product | null>(null)
  const [productImages, setProductImages] = useState<ProductImage[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [colors, setColors] = useState<ProductVariant[]>([])
  const [sizes, setSizes] = useState<ProductVariant[]>([])
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)
  const imageRef = useRef<HTMLDivElement>(null)

  // Form fields
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [state, setState] = useState("")
  const [city, setCity] = useState("")
  const [notes, setNotes] = useState("")
  const [deliveryType, setDeliveryType] = useState("home")

  // Get delivery prices based on selected state
  const selectedStatePrice = getDeliveryPrice(state)
  const HOME_DELIVERY_FEE = selectedStatePrice?.home_delivery || 0
  const OFFICE_DELIVERY_FEE = selectedStatePrice?.office_delivery || 0

  useEffect(() => {
    fetchProduct()
  }, [slug])

  async function fetchProduct() {
    setIsLoading(true)
    try {
      // Fetch product
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .single()

      if (productError) throw productError

      if (!productData) {
        router.push("/shop")
        return
      }

      setProduct(productData)

      // Fetch product images
      const { data: imagesData, error: imagesError } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", productData.id)
        .order("sort_order", { ascending: true })

      if (imagesError) throw imagesError

      // If no images found, create a default one from the product.image
      if (imagesData.length === 0) {
        setProductImages([
          {
            id: 0,
            product_id: productData.id,
            image_url: productData.image,
            is_main: true,
            sort_order: 0,
          },
        ])
      } else {
        setProductImages(imagesData)
      }

      // Fetch variants
      const { data: variantsData, error: variantsError } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productData.id)

      if (variantsError) throw variantsError

      // Separate colors and sizes
      const colorVariants = variantsData.filter((v) => v.variant_type === "color")
      const sizeVariants = variantsData.filter((v) => v.variant_type === "size")

      setColors(colorVariants)
      setSizes(sizeVariants)

      // Set default selections if available
      if (colorVariants.length > 0) {
        setSelectedColor(colorVariants[0].value)
      }

      if (sizeVariants.length > 0) {
        setSelectedSize(sizeVariants[0].value)
      }
    } catch (error) {
      console.error("Error fetching product:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!product) return

    // Check if product is in stock
    if (!product.in_stock) {
      toast({
        title: language === "ar" ? "المنتج غير متوفر" : "Product Unavailable",
        description: language === "ar" ? "هذا المنتج غير متوفر حالياً" : "This product is currently out of stock",
        variant: "destructive",
      })
      return
    }

    // Validate form
    if (!fullName || !phone || !state || !city) {
      toast({
        title: language === "ar" ? "خطأ في النموذج" : "Form Error",
        description: language === "ar" ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Generate random order number
      const orderNumber = generateOrderNumber()

      // Calculate total
      const deliveryFee = deliveryType === "home" ? HOME_DELIVERY_FEE : OFFICE_DELIVERY_FEE
      const totalAmount = product.price * quantity + deliveryFee

      // Create order using direct SQL insert to bypass RLS
      const { data: orderData, error: orderError } = await supabase.rpc("create_order", {
        p_order_number: orderNumber,
        p_full_name: fullName,
        p_phone: phone,
        p_state: state,
        p_city: city,
        p_notes: notes || null,
        p_delivery_type: deliveryType,
        p_delivery_fee: deliveryFee,
        p_total_amount: totalAmount,
        p_status: "pending",
      })

      if (orderError) {
        // Fallback to direct insert if RPC doesn't exist
        const { data: fallbackOrderData, error: fallbackOrderError } = await supabase
          .from("orders")
          .insert([
            {
              order_number: orderNumber,
              full_name: fullName,
              phone,
              state,
              city,
              notes: notes || null,
              delivery_type: deliveryType,
              delivery_fee: deliveryFee,
              total_amount: totalAmount,
              status: "pending",
            },
          ])
          .select()

        if (fallbackOrderError) throw fallbackOrderError

        // Create order item
        const { error: itemError } = await supabase.from("order_items").insert([
          {
            order_id: fallbackOrderData[0].id,
            product_id: product.id,
            product_title: product[`title_${language}`],
            product_price: product.price,
            quantity,
            color: selectedColor,
            size: selectedSize,
          },
        ])

        if (itemError) throw itemError
      } else {
        // If RPC worked, create order item
        const { error: itemError } = await supabase.from("order_items").insert([
          {
            order_id: orderData,
            product_id: product.id,
            product_title: product[`title_${language}`],
            product_price: product.price,
            quantity,
            color: selectedColor,
            size: selectedSize,
          },
        ])

        if (itemError) throw itemError
      }

      // Send email notification
      try {
        console.log("Preparing email data...")
        const emailData = {
          orderNumber,
          fullName,
          phone,
          state,
          city,
          notes,
          deliveryType,
          deliveryFee,
          totalAmount,
          product: {
            title: product[`title_${language}`],
            price: product.price,
            image: productImages[0]?.image_url || product.image,
          },
          quantity,
          selectedColor,
          selectedSize,
        }

        console.log("Sending email notification...")
        const emailResponse = await fetch("/api/sendEmail", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailData),
        })

        const emailResult = await emailResponse.json()

        if (!emailResponse.ok) {
          console.error("Email API error:", emailResult)
          // Don't fail the order if email fails, just log it
        } else {
          console.log("Email sent successfully:", emailResult)
        }
      } catch (emailError) {
        console.error("Error sending email notification:", emailError)
        // Don't fail the order if email fails, just log it
      }

      // Send notification to admin
      try {
        await supabase.from("admin_notifications").insert([
          {
            title: "New Order Received",
            message: `New order ${orderNumber} from ${fullName} for ${product[`title_${language}`]}`,
            type: "order",
            read: false,
          },
        ])
      } catch (notificationError) {
        console.log("Notification error (non-critical):", notificationError)
      }

      // Show success message with beautiful thank you and order number
      toast({
        title: language === "ar" ? "🎉 شكراً لك!" : "🎉 Thank You!",
        description:
          language === "ar"
            ? `تم إرسال طلبك بنجاح! رقم الطلب: ${orderNumber}. سنتواصل معك خلال 24 ساعة لتأكيد الطلب وترتيب التوصيل. نقدر ثقتك بنا! 💖`
            : `Your order has been submitted successfully! Order Number: ${orderNumber}. We will contact you within 24 hours to confirm your order and arrange delivery. We appreciate your trust! 💖`,
        className: "bg-green-50 border-green-200 text-green-800",
      })

      // Reset form
      setFullName("")
      setPhone("")
      setState("")
      setCity("")
      setNotes("")
      setQuantity(1)
    } catch (error) {
      console.error("Error submitting order:", error)
      toast({
        title: language === "ar" ? "خطأ في إرسال الطلب" : "Order Submission Error",
        description:
          language === "ar"
            ? "حدث خطأ أثناء إرسال طلبك. يرجى المحاولة مرة أخرى."
            : "An error occurred while submitting your order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const incrementQuantity = () => {
    setQuantity((prev) => prev + 1)
  }

  const decrementQuantity = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1))
  }

  const getColorName = (colorValue: string) => {
    const color = colors.find((c) => c.value === colorValue)
    return color ? color[`name_${language}`] : ""
  }

  const getSizeName = (sizeValue: string) => {
    const size = sizes.find((s) => s.value === sizeValue)
    return size ? size[`name_${language}`] : ""
  }

  const calculateTotal = () => {
    if (!product) return 0
    const deliveryFee = deliveryType === "home" ? HOME_DELIVERY_FEE : OFFICE_DELIVERY_FEE
    return product.price * quantity + deliveryFee
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length)
  }

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length)
  }

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !isZoomed) return

    const { left, top, width, height } = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100

    setZoomPosition({ x, y })
  }

  const toggleZoom = () => {
    setIsZoomed(!isZoomed)
  }

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="pt-20 min-h-screen">
          <div className="container mx-auto px-4 py-16">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/2 aspect-[3/4] bg-muted animate-pulse rounded-lg"></div>
              <div className="w-full md:w-1/2 space-y-4">
                <div className="h-8 bg-muted rounded animate-pulse w-3/4"></div>
                <div className="h-6 bg-muted rounded animate-pulse w-1/2"></div>
                <div className="h-24 bg-muted rounded animate-pulse w-full"></div>
                <div className="h-10 bg-muted rounded animate-pulse w-1/3"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <main className="pt-20 min-h-screen">
          <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-2xl font-bold mb-4">{language === "ar" ? "المنتج غير موجود" : "Product Not Found"}</h1>
            <p className="text-muted-foreground mb-8">
              {language === "ar"
                ? "المنتج الذي تبحث عنه غير موجود أو تم إزالته."
                : "The product you are looking for does not exist or has been removed."}
            </p>
            <Button asChild>
              <a href="/shop">{language === "ar" ? "العودة إلى المتجر" : "Back to Shop"}</a>
            </Button>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <Toaster />
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8 md:py-16">
          {/* Product Navigation */}
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link href="/shop">
                <ChevronLeft className="h-4 w-4 mr-1" />
                {language === "ar" ? "العودة إلى المتجر" : "Back to Shop"}
              </Link>
            </Button>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Product Images */}
            <div className="w-full lg:w-1/2">
              <div className="sticky top-24 space-y-4">
                {/* Image Slider */}
                <div className="relative">
                  <div className="overflow-hidden rounded-xl">
                    {/* Main Image with Zoom */}
                    <div
                      ref={imageRef}
                      className="relative w-full rounded-lg overflow-hidden aspect-[3/4] cursor-zoom-in"
                      onClick={toggleZoom}
                      onMouseMove={handleMouseMove}
                    >
                      <img
                        src={productImages[currentImageIndex]?.image_url || product.image}
                        alt={product[`title_${language}`]}
                        className={`w-full h-full object-cover ${isZoomed ? "scale-150" : ""}`}
                        style={{
                          transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                        }}
                      />
                      <div className="absolute top-2 right-2 bg-white/80 rounded-full p-2">
                        <ZoomIn className="h-5 w-5 text-gray-700" />
                      </div>

                      {/* Image Navigation Controls */}
                      <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePrevImage()
                          }}
                          className="bg-white/80 rounded-full p-2 shadow-md hover:bg-white transition-colors"
                          aria-label={language === "ar" ? "الصورة السابقة" : "Previous image"}
                        >
                          <ChevronRight className="h-5 w-5 text-gray-700" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleNextImage()
                          }}
                          className="bg-white/80 rounded-full p-2 shadow-md hover:bg-white transition-colors"
                          aria-label={language === "ar" ? "الصورة التالية" : "Next image"}
                        >
                          <ChevronLeft className="h-5 w-5 text-gray-700" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Image Counter */}
                  <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {productImages.length}
                  </div>
                </div>

                {/* Thumbnail Gallery */}
                {productImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto py-2 px-1 max-w-full">
                    {productImages.map((img, index) => (
                      <button
                        key={img.id}
                        onClick={() => handleImageClick(index)}
                        className={`relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
                          currentImageIndex === index ? "border-primary" : "border-transparent"
                        }`}
                      >
                        <img
                          src={img.image_url || "/placeholder.svg"}
                          alt={`${product[`title_${language}`]} - ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Fullscreen Image Dialog */}
                <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full bg-transparent">
                      <Search className="h-4 w-4 mr-2" />
                      {language === "ar" ? "عرض بالحجم الكامل" : "View Fullscreen"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-5xl p-0 bg-black/95">
                    <div className="relative h-[80vh] flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleNextImage()
                        }}
                        className="absolute left-4 bg-white/20 rounded-full p-2 hover:bg-white/40 transition-colors"
                        aria-label={language === "ar" ? "الصورة السابقة" : "Previous image"}
                      >
                        <ChevronLeft className="h-6 w-6 text-white" />
                      </button>
                      <img
                        src={productImages[currentImageIndex]?.image_url || product.image}
                        alt={product[`title_${language}`]}
                        className="max-h-full max-w-full object-contain"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePrevImage()
                        }}
                        className="absolute right-4 bg-white/20 rounded-full p-2 hover:bg-white/40 transition-colors"
                        aria-label={language === "ar" ? "الصورة التالية" : "Next image"}
                      >
                        <ChevronRight className="h-6 w-6 text-white" />
                      </button>
                      <button
                        className="absolute top-4 right-4 bg-white/20 rounded-full p-2 hover:bg-white/40 transition-colors"
                        onClick={() => setIsFullscreenOpen(false)}
                      >
                        {/* <X className="h-6 w-6 text-white" />*/}
                      </button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Product Details and Order Form */}
            <div className="w-full lg:w-1/2">
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 text-center">{product[`title_${language}`]}</h1>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className="text-2xl font-bold text-primary">DA {product.price.toLocaleString()}</span>
                  {product.old_price && (
                    <span className="text-lg line-through text-muted-foreground">
                      DA {product.old_price.toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mb-6 text-center">{product[`description_${language}`]}</p>

                {/* Out of Stock Warning */}
                {!product.in_stock && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{language === "ar" ? "غير متوفر" : "Out of Stock"}</AlertTitle>
                    <AlertDescription>
                      {language === "ar"
                        ? "هذا المنتج غير متوفر حالياً. يرجى التحقق لاحقاً."
                        : "This product is currently out of stock. Please check back later."}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Color Selection */}
                {colors.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-medium mb-3 text-center">
                      {language === "ar" ? "اللون" : "Color"}: {selectedColor && getColorName(selectedColor)}
                    </h3>
                    <div className="flex justify-center gap-2">
                      {colors.map((color) => (
                        <button
                          key={color.id}
                          type="button"
                          className={`w-12 h-12 rounded-md border-2 ${
                            selectedColor === color.value ? "border-primary" : "border-border"
                          }`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => setSelectedColor(color.value)}
                          title={color[`name_${language}`]}
                          aria-label={color[`name_${language}`]}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Size Selection */}
                {sizes.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-medium mb-3 text-center">{language === "ar" ? "المقاس" : "Size"}</h3>
                    <div className="flex flex-wrap justify-center gap-2">
                      {sizes.map((size) => (
                        <button
                          key={size.id}
                          type="button"
                          className={`px-6 py-3 rounded-md border transition-all duration-200 transform ${
                            selectedSize === size.value
                              ? "bg-black text-white border-black scale-110 shadow-md font-bold"
                              : "bg-background border-border hover:border-gray-400"
                          }`}
                          onClick={() => setSelectedSize(size.value)}
                        >
                          {size[`name_${language}`]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Order Form */}
              <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-6 text-center">
                  {language === "ar" ? "إملأ المعلومات" : "Fill Information"}
                </h2>
                <p className="text-center text-muted-foreground mb-4">
                  {language === "ar" ? "أدخل تفاصيل الطلبية هنا" : "Enter order details here"}
                </p>

                <div className="space-y-4 mb-6">
                  <div>
                    <Label htmlFor="fullName" className="block mb-2">
                      {language === "ar" ? "الإسم الكامل" : "Full Name"}
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none rtl:right-auto rtl:left-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-muted-foreground"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={language === "ar" ? "الإسم الكامل" : "Full Name"}
                        className="pr-12 rtl:pr-4 rtl:pl-12 text-right"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone" className="block mb-2">
                      {language === "ar" ? "رقم الهاتف" : "Phone Number"}
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none rtl:right-auto rtl:left-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-muted-foreground"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                      </div>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={language === "ar" ? "رقم الهاتف" : "Phone Number"}
                        className="pr-12 rtl:pr-4 rtl:pl-12 text-right"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="state" className="block mb-2">
                      {language === "ar" ? "الولاية" : "State"}
                    </Label>
                    <Select value={state} onValueChange={setState} required>
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder={language === "ar" ? "اختر الولاية" : "Select State"} />
                      </SelectTrigger>
                      <SelectContent>
                        {deliveryPrices.map((stateItem) => (
                          <SelectItem key={stateItem.id} value={stateItem[`name_${language}`]}>
                            <div className="flex justify-between items-center w-full">
                              <span>{stateItem[`name_${language}`]}</span>
                              <div className="text-xs text-muted-foreground ml-2">
                                {language === "ar" ? "منزل:" : "Home:"} DA {stateItem.home_delivery} |{" "}
                                {language === "ar" ? "مكتب:" : "Office:"} DA {stateItem.office_delivery}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="city" className="block mb-2">
                      {language === "ar" ? "البلدية" : "City"}
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none rtl:right-auto rtl:left-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-muted-foreground"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder={language === "ar" ? "البلدية" : "City"}
                        className="pr-12 rtl:pr-4 rtl:pl-12 text-right"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes" className="block mb-2">
                      {language === "ar" ? "ملاحظة" : "Notes"}
                    </Label>
                    <div className="relative">
                      <div className="absolute top-3 right-3 flex items-start pointer-events-none rtl:right-auto rtl:left-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-muted-foreground"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </div>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={language === "ar" ? "ملاحظة" : "Notes"}
                        className="min-h-[100px] pr-12 rtl:pr-4 rtl:pl-12 text-right"
                      />
                    </div>
                  </div>

                  {/* Delivery Options */}
                  <div className="mb-6">
                    <h3 className="font-medium mb-4 flex items-center gap-2 justify-end">
                      <Truck className="h-5 w-5" />
                      {language === "ar" ? "عنوان الشحن" : "Shipping Address"}
                    </h3>

                    <RadioGroup value={deliveryType} onValueChange={setDeliveryType} className="space-y-4">
                      <div className="flex items-center justify-between border rounded-lg p-4">
                        <div className="font-bold">DA {HOME_DELIVERY_FEE.toFixed(2)}</div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="home" className="font-medium">
                            {language === "ar" ? "توصيل إلى المنزل" : "Home Delivery"}
                          </Label>
                          <RadioGroupItem value="home" id="home" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between border rounded-lg p-4">
                        <div className="font-bold">DA {OFFICE_DELIVERY_FEE.toFixed(2)}</div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="office" className="font-medium">
                            {language === "ar" ? "توصيل إلى المكتب" : "Office Delivery"}
                          </Label>
                          <RadioGroupItem value="office" id="office" />
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Quantity Selector */}
                  <div className="flex justify-center items-center gap-4 mb-6">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                      className="h-10 w-10 rounded-full bg-transparent"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-xl font-medium w-8 text-center">{quantity}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={incrementQuantity}
                      className="h-10 w-10 rounded-full bg-transparent"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Order Summary */}
                  <div className="border-t pt-4 mb-6">
                    <div className="flex justify-between mb-2">
                      <span>
                        DA {product.price.toFixed(2)} × {quantity}
                      </span>
                      <span>{language === "ar" ? "المنتج" : "Product"}:</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>
                        DA {deliveryType === "home" ? HOME_DELIVERY_FEE.toFixed(2) : OFFICE_DELIVERY_FEE.toFixed(2)}
                      </span>
                      <span>{language === "ar" ? "التوصيل" : "Delivery"}:</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>DA {calculateTotal().toFixed(2)}</span>
                      <span>{language === "ar" ? "المجموع" : "Total"}:</span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full bg-[#ff4500] hover:bg-[#ff4500]/90 text-white py-4 text-lg"
                    disabled={isSubmitting || !product.in_stock}
                  >
                    {isSubmitting ? (
                      language === "ar" ? (
                        "جاري الإرسال..."
                      ) : (
                        "Processing..."
                      )
                    ) : !product.in_stock ? (
                      language === "ar" ? (
                        "غير متوفر حالياً"
                      ) : (
                        "Currently Unavailable"
                      )
                    ) : (
                      <>{language === "ar" ? "إشتري الآن" : "Buy Now"}</>
                    )}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground mt-4">
                    {language === "ar" ? "الدفع عند الاستلام" : "Cash on Delivery"}
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
