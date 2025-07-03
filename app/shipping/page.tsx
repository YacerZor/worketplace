"use client"

import { useLanguage } from "@/components/language-provider"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck, Home, Building, MapPin, Clock, Shield } from "lucide-react"
import { deliveryPrices } from "@/lib/delivery-prices"

export default function ShippingPage() {
  const { language } = useLanguage()

  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <h1 className="text-4xl font-bold mb-4">
                {language === "ar" ? "معلومات الشحن" : "Shipping Information"}
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {language === "ar"
                  ? "تعرف على أسعار وطرق التوصيل المتاحة في جميع أنحاء الجزائر"
                  : "Learn about our delivery prices and methods available throughout Algeria"}
              </p>
            </div>

            {/* Delivery Types */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              <Card className="border-primary/20 hover:border-primary/40 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Home className="h-6 w-6 text-primary" />
                    </div>
                    {language === "ar" ? "التوصيل المنزلي" : "Home Delivery"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {language === "ar"
                      ? "نوصل طلبك مباشرة إلى عنوانك المنزلي في الوقت المحدد"
                      : "We deliver your order directly to your home address at the scheduled time"}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {language === "ar" ? "حسب الولاية" : "According to the state"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {language === "ar" ? "تأمين كامل على الطلب" : "Full order insurance"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20 hover:border-primary/40 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Building className="h-6 w-6 text-primary" />
                    </div>
                    {language === "ar" ? "التوصيل للمكتب" : "Office Delivery"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {language === "ar"
                      ? "استلم طلبك من أقرب مكتب توصيل في ولايتك بأسعار مخفضة"
                      : "Pick up your order from the nearest delivery office in your state at reduced prices"}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {language === "ar"
                          ? "جاهز للاستلام في وقت وجيز"
                          : "Ready for pickup in a short time"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {language === "ar" ? "مكاتب في جميع الولايات" : "Offices in all states"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Delivery Prices Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Truck className="h-6 w-6" />
                  {language === "ar" ? "أسعار التوصيل حسب الولاية" : "Delivery Prices by State"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right py-3 px-4 font-semibold">
                          {language === "ar" ? "الولاية" : "State"}
                        </th>
                        <th className="text-center py-3 px-4 font-semibold">
                          <div className="flex items-center justify-center gap-2">
                            <Home className="h-4 w-4" />
                            {language === "ar" ? "التوصيل المنزلي" : "Home Delivery"}
                          </div>
                        </th>
                        <th className="text-center py-3 px-4 font-semibold">
                          <div className="flex items-center justify-center gap-2">
                            <Building className="h-4 w-4" />
                            {language === "ar" ? "التوصيل للمكتب" : "Office Delivery"}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveryPrices.map((state, index) => (
                        <tr key={state.id} className={`border-b ${index % 2 === 0 ? "bg-muted/30" : ""}`}>
                          <td className="py-3 px-4 text-right font-medium">{state[`name_${language}`]}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              DA {state.home_delivery.toLocaleString()}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              DA {state.office_delivery.toLocaleString()}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Truck className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{language === "ar" ? "شحن سريع" : "Fast Shipping"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "ar"
                      ? "نضمن وصول طلبك في أسرع وقت ممكن"
                      : "We guarantee your order arrives as quickly as possible"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {language === "ar" ? "ضمان الجودة" : "Quality Guarantee"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "ar"
                      ? "نضمن جودة جميع منتجاتنا وسلامة التوصيل"
                      : "We guarantee the quality of all our products and safe delivery"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {language === "ar" ? "تغطية شاملة" : "Complete Coverage"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "ar" ? "نوصل إلى جميع الولايات في الجزائر" : "We deliver to all states in Algeria"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
