"use client"

import type React from "react"

import { useState } from "react"
import { useLanguage } from "@/components/language-provider"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase"
import { Search, Package, Truck, CheckCircle, XCircle, Clock, MapPin, Phone, User, Calendar } from "lucide-react"

interface Order {
  id: number
  order_number: string
  full_name: string
  phone: string
  state: string
  city: string
  notes: string | null
  delivery_type: string
  delivery_fee: number
  total_amount: number
  status: string
  created_at: string
}

interface OrderItem {
  id: number
  order_id: number
  product_id: number | null
  product_title: string
  product_price: number
  quantity: number
  color: string | null
  size: string | null
}

// دالة للحصول على اسم اللون من hex code
const getColorName = async (colorValue: string | null, language: "ar" | "en"): Promise<string | null> => {
  if (!colorValue) return null

  try {
    // البحث في جميع المنتجات عن اللون المطابق
    const { data: variants, error } = await supabase
      .from("product_variants")
      .select("name_ar, name_en, value")
      .eq("variant_type", "color")
      .eq("value", colorValue)
      .limit(1)

    if (error || !variants || variants.length === 0) {
      return colorValue // إرجاع القيمة الأصلية إذا لم يتم العثور على اللون
    }

    // إرجاع الاسم حسب اللغة المحددة
    return language === "ar" ? variants[0].name_ar : variants[0].name_en || colorValue
  } catch (error) {
    console.error("Error getting color name:", error)
    return colorValue
  }
}

export default function TrackOrderPage() {
  const { language } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")
  const [order, setOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [colorNames, setColorNames] = useState<Record<string, string>>({})

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setError("")
    setOrder(null)
    setOrderItems([])
    setColorNames({})

    try {
      // Search by order number or phone number
      let query = supabase.from("orders").select("*")

      if (searchQuery.startsWith("ORD")) {
        // If it starts with ORD, search by order number
        query = query.eq("order_number", searchQuery.trim())
      } else {
        // Otherwise, search by phone number
        query = query.eq("phone", searchQuery.trim())
      }

      const { data: orderData, error: orderError } = await query

      if (orderError) throw orderError

      if (!orderData || orderData.length === 0) {
        setError(language === "ar" ? "لم يتم العثور على الطلب" : "Order not found")
        return
      }

      // If multiple orders found (phone search), take the most recent one
      const selectedOrder = orderData.length > 1 ? orderData[0] : orderData[0]
      setOrder(selectedOrder)

      // Fetch order items
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", selectedOrder.id)

      if (itemsError) throw itemsError
      setOrderItems(itemsData || [])

      // جلب أسماء الألوان
      const colorNamesMap: Record<string, string> = {}
      for (const item of itemsData || []) {
        if (item.color && !colorNamesMap[item.color]) {
          const colorName = await getColorName(item.color, language)
          if (colorName) {
            colorNamesMap[item.color] = colorName
          }
        }
      }
      setColorNames(colorNamesMap)
    } catch (error) {
      console.error("Error searching order:", error)
      setError(language === "ar" ? "حدث خطأ أثناء البحث" : "An error occurred while searching")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "processing":
        return <Package className="h-5 w-5 text-blue-500" />
      case "shipped":
        return <Truck className="h-5 w-5 text-purple-500" />
      case "delivered":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return language === "ar" ? "قيد الانتظار" : "Pending"
      case "processing":
        return language === "ar" ? "قيد المعالجة" : "Processing"
      case "shipped":
        return language === "ar" ? "تم الشحن" : "Shipped"
      case "delivered":
        return language === "ar" ? "تم التوصيل" : "Delivered"
      case "cancelled":
        return language === "ar" ? "ملغي" : "Cancelled"
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "shipped":
        return "bg-purple-100 text-purple-800 border-purple-300"
      case "delivered":
        return "bg-green-100 text-green-800 border-green-300"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case "pending":
        return 25
      case "processing":
        return 50
      case "shipped":
        return 75
      case "delivered":
        return 100
      case "cancelled":
        return 0
      default:
        return 0
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">{language === "ar" ? "تتبع طلبك" : "Track Your Order"}</h1>
              <p className="text-xl text-muted-foreground">
                {language === "ar"
                  ? "أدخل رقم الطلب أو رقم الهاتف لتتبع حالة طلبك"
                  : "Enter your order number or phone number to track your order status"}
              </p>
            </div>

            {/* Search Form */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <form onSubmit={handleSearch} className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder={
                        language === "ar" ? "رقم الطلب (ORD...) أو رقم الهاتف" : "Order Number (ORD...) or Phone Number"
                      }
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="text-lg h-12"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isLoading} className="h-12 px-8">
                    {isLoading ? (
                      language === "ar" ? (
                        "جاري البحث..."
                      ) : (
                        "Searching..."
                      )
                    ) : (
                      <>
                        <Search className="h-5 w-5 mr-2" />
                        {language === "ar" ? "بحث" : "Search"}
                      </>
                    )}
                  </Button>
                </form>
                {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
              </CardContent>
            </Card>

            {/* Order Details */}
            {order && (
              <div className="space-y-6">
                {/* Order Status Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      {getStatusIcon(order.status)}
                      <span>{language === "ar" ? "حالة الطلب" : "Order Status"}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Status Badge */}
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={`text-lg px-4 py-2 ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {language === "ar" ? "رقم الطلب" : "Order Number"}: {order.order_number}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      {order.status !== "cancelled" && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{language === "ar" ? "التقدم" : "Progress"}</span>
                            <span>{getProgressPercentage(order.status)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-500"
                              style={{ width: `${getProgressPercentage(order.status)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Status Timeline */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        {[
                          { key: "pending", icon: Clock, label: language === "ar" ? "قيد الانتظار" : "Pending" },
                          {
                            key: "processing",
                            icon: Package,
                            label: language === "ar" ? "قيد المعالجة" : "Processing",
                          },
                          { key: "shipped", icon: Truck, label: language === "ar" ? "تم الشحن" : "Shipped" },
                          {
                            key: "delivered",
                            icon: CheckCircle,
                            label: language === "ar" ? "تم التوصيل" : "Delivered",
                          },
                        ].map((step, index) => {
                          const isActive = getProgressPercentage(order.status) >= (index + 1) * 25
                          const isCurrent = order.status === step.key
                          return (
                            <div key={step.key} className="text-center">
                              <div
                                className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                                  isActive ? "bg-primary text-white" : "bg-gray-200 text-gray-400"
                                } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                              >
                                <step.icon className="h-6 w-6" />
                              </div>
                              <p
                                className={`text-sm ${isActive ? "text-primary font-medium" : "text-muted-foreground"}`}
                              >
                                {step.label}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {language === "ar" ? "معلومات العميل" : "Customer Information"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">{language === "ar" ? "الاسم" : "Name"}</p>
                          <p className="font-medium">{order.full_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">{language === "ar" ? "الهاتف" : "Phone"}</p>
                          <p className="font-medium">{order.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">{language === "ar" ? "العنوان" : "Address"}</p>
                          <p className="font-medium">
                            {order.city}, {order.state}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Order Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        {language === "ar" ? "معلومات الطلب" : "Order Information"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {language === "ar" ? "تاريخ الطلب" : "Order Date"}
                          </p>
                          <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {language === "ar" ? "نوع التوصيل" : "Delivery Type"}
                          </p>
                          <p className="font-medium">
                            {order.delivery_type === "home"
                              ? language === "ar"
                                ? "توصيل منزلي"
                                : "Home Delivery"
                              : language === "ar"
                                ? "توصيل للمكتب"
                                : "Office Delivery"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {language === "ar" ? "المبلغ الإجمالي" : "Total Amount"}
                          </p>
                          <p className="font-medium text-lg">DA {order.total_amount.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Order Items */}
                <Card>
                  <CardHeader>
                    <CardTitle>{language === "ar" ? "عناصر الطلب" : "Order Items"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {orderItems.map((item, index) => (
                        <div key={item.id}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium">{item.product_title}</h4>
                              {(item.color || item.size) && (
                                <div className="text-sm text-muted-foreground mt-1">
                                  {item.color && (
                                    <span>
                                      {language === "ar" ? "اللون: " : "Color: "}
                                      {colorNames[item.color] || item.color}
                                    </span>
                                  )}
                                  {item.color && item.size && " | "}
                                  {item.size && (
                                    <span>
                                      {language === "ar" ? "المقاس: " : "Size: "}
                                      {item.size}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-medium">DA {item.product_price.toLocaleString()}</p>
                              <p className="text-sm text-muted-foreground">
                                {language === "ar" ? "الكمية: " : "Qty: "}
                                {item.quantity}
                              </p>
                            </div>
                          </div>
                          {index < orderItems.length - 1 && <Separator className="mt-4" />}
                        </div>
                      ))}
                    </div>

                    <Separator className="my-4" />

                    {/* Order Summary */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>{language === "ar" ? "المنتجات:" : "Items:"}</span>
                        <span>DA {(order.total_amount - order.delivery_fee).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{language === "ar" ? "رسوم التوصيل:" : "Delivery Fee:"}</span>
                        <span>DA {order.delivery_fee.toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>{language === "ar" ? "المجموع:" : "Total:"}</span>
                        <span>DA {order.total_amount.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
                {order.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{language === "ar" ? "ملاحظات" : "Notes"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{order.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
