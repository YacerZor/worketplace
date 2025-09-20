"use client"

import Link from "next/link"
import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useLanguage } from "@/components/language-provider"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Truck, Minus, Plus, ChevronLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { deliveryPrices, getDeliveryPrice } from "@/lib/delivery-prices"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface UsedProduct {
  id: number
  title_ar: string
  title_en: string
  description_ar: string
  description_en: string
  price: number
  image: string
  phone: string
  status: string
  slug: string
  created_at: string
}

// Function to generate random order number
const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString()
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return `ORD${timestamp.slice(-6)}${random}`
}

export default function UsedProductPage() {
  const { language } = useLanguage()
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [product, setProduct] = useState<UsedProduct | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      const { data: productData, error: productError } = await supabase
        .from("used_products")
        .select("*")
        .eq("slug", slug)
        .eq("status", "approved")
        .single()

      if (productError) throw productError

      if (!productData) {
        router.push("/shop")
        return
      }

      setProduct(productData)
    } catch (error) {
      console.error("Error fetching used product:", error)
      router.push("/shop")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!product) return

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

      // Create order
      const { data: orderData, error: orderError } = await supabase
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
        .single()

      if (orderError) throw orderError

      // Create order item (using negative ID to distinguish from regular products)
      const { error: itemError } = await supabase.from("order_items").insert([
        {
          order_id: orderData.id,
          product_id: -product.id, // Negative ID for used products
          product_title: `${product[`title_${language}`] || product.title_ar || product.title_en} (${language === "ar" ? "مستعمل" : "Used"})`,
          product_price: product.price,
          quantity,
          color: null,
          size: null,
        },
      ])

      if (itemError) throw itemError

      // Send email notification
      try {
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
            title: `${product[`title_${language}`] || product.title_ar || product.title_en} (${language === "ar" ? "مستعمل" : "Used"})`,
            price: product.price,
            image: product.image,
          },
          quantity,
          selectedColor: null,
          selectedSize: null,
        }

        const emailResponse = await fetch("/api/sendEmail", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailData),
        })

        if (!emailResponse.ok) {
          console.error("Email API error")
        }
      } catch (emailError) {
        console.error("Error sending email notification:", emailError)
      }

      // Send notification to admin
      try {
        await supabase.from("admin_notifications").insert([
          {
            title: "New Used Product Order",
            message: `New order ${orderNumber} from ${fullName} for used product: ${product[`title_${language}`] || product.title_ar || product.title_en}`,
            type: "order",
            read: false,
          },
        ])
      } catch (notificationError) {
        console.log("Notification error (non-critical):", notificationError)
      }

      // Show success message
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

  const calculateTotal = () => {
    if (!product) return 0
    const deliveryFee = deliveryType === "home" ? HOME_DELIVERY_FEE : OFFICE_DELIVERY_FEE
    return product.price * quantity + deliveryFee
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
              <Link href="/shop">{language === "ar" ? "العودة إلى المتجر" : "Back to Shop"}</Link>
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
            {/* Product Image */}
            <div className="w-full lg:w-1/2">
              <div className="sticky top-24 space-y-4">
                <div className="relative">
                  <div className="overflow-hidden rounded-xl">
                    <div className="relative w-full rounded-lg overflow-hidden aspect-[3/4]">
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product[`title_${language}`] || product.title_ar || product.title_en}
                        className="w-full h-full object-cover"
                      />
                      {/* Used Badge */}
                      <div className="absolute top-4 left-4 z-10">
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 text-sm font-bold shadow-xl rounded-full">
                          {language === "ar" ? "مستعمل" : "USED"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Details and Order Form */}
            <div className="w-full lg:w-1/2">
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 text-center">
                  {product[`title_${language}`] || product.title_ar || product.title_en}
                </h1>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className="text-2xl font-bold text-primary">DA {product.price.toLocaleString()}</span>
                </div>
                <p className="text-muted-foreground mb-6 text-center">
                  {product[`description_${language}`] || product.description_ar || product.description_en}
                </p>
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
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={language === "ar" ? "الإسم الكامل" : "Full Name"}
                      className="text-right"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="block mb-2">
                      {language === "ar" ? "رقم الهاتف" : "Phone Number"}
                    </Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={language === "ar" ? "رقم الهاتف" : "Phone Number"}
                      className="text-right"
                      required
                    />
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
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder={language === "ar" ? "البلدية" : "City"}
                      className="text-right"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes" className="block mb-2">
                      {language === "ar" ? "ملاحظة" : "Notes"}
                    </Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={language === "ar" ? "ملاحظة" : "Notes"}
                      className="min-h-[100px] text-right"
                    />
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
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 text-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      language === "ar" ? (
                        "جاري الإرسال..."
                      ) : (
                        "Processing..."
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
