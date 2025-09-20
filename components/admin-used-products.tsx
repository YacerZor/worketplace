"use client"

import { useState, useEffect, useCallback } from "react"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { Eye, Loader2, Phone, Calendar, User, Trash2, Edit, RotateCcw } from "lucide-react"

interface UsedProduct {
  id: number
  title_ar: string
  title_en: string
  description_ar: string
  description_en: string
  image: string
  price: number
  phone: string
  user_id: string | null
  status: string
  slug: string
  created_at: string
  approved_at: string | null
}

export function AdminUsedProducts() {
  const { language } = useLanguage()
  const [usedProducts, setUsedProducts] = useState<UsedProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<UsedProduct | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editPrice, setEditPrice] = useState<string>("")
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    fetchUsedProducts()
  }, [])

  const fetchUsedProducts = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("used_products").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setUsedProducts(data || [])
    } catch (error) {
      console.error("Error fetching used products:", error)
      toast({
        title: language === "ar" ? "خطأ في جلب المنتجات المستعملة" : "Error fetching used products",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [language])

  const handleOpenDialog = (product: UsedProduct) => {
    setSelectedProduct(product)
    setEditPrice(product.price.toString())
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedProduct(null)
    setEditPrice("")
  }

  const handleApproveProduct = async (productId: number) => {
    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from("used_products")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
          price: Number.parseFloat(editPrice) || selectedProduct?.price || 0,
        })
        .eq("id", productId)

      if (error) throw error

      setUsedProducts((prev) =>
        prev.map((product) =>
          product.id === productId
            ? {
                ...product,
                status: "approved",
                approved_at: new Date().toISOString(),
                price: Number.parseFloat(editPrice) || product.price,
              }
            : product,
        ),
      )

      toast({
        title: language === "ar" ? "تمت الموافقة على المنتج" : "Product Approved",
        description:
          language === "ar" ? "تمت الموافقة على المنتج المستعمل بنجاح" : "Used product approved successfully",
      })
      handleCloseDialog()
    } catch (error) {
      console.error("Error approving product:", error)
      toast({
        title: language === "ar" ? "خطأ في الموافقة على المنتج" : "Error Approving Product",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRejectProduct = async (productId: number) => {
    setIsUpdating(true)
    try {
      const { error } = await supabase.from("used_products").update({ status: "rejected" }).eq("id", productId)

      if (error) throw error

      setUsedProducts((prev) =>
        prev.map((product) => (product.id === productId ? { ...product, status: "rejected" } : product)),
      )

      toast({
        title: language === "ar" ? "تم رفض المنتج" : "Product Rejected",
        description: language === "ar" ? "تم رفض المنتج المستعمل بنجاح" : "Used product rejected successfully",
      })
      handleCloseDialog()
    } catch (error) {
      console.error("Error rejecting product:", error)
      toast({
        title: language === "ar" ? "خطأ في رفض المنتج" : "Error Rejecting Product",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleReactivateProduct = async (productId: number) => {
    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from("used_products")
        .update({
          status: "pending",
          approved_at: null,
        })
        .eq("id", productId)

      if (error) throw error

      setUsedProducts((prev) =>
        prev.map((product) =>
          product.id === productId ? { ...product, status: "pending", approved_at: null } : product,
        ),
      )

      toast({
        title: language === "ar" ? "تم إعادة تفعيل المنتج" : "Product Reactivated",
        description: language === "ar" ? "تم إعادة تفعيل المنتج للمراجعة" : "Product has been reactivated for review",
      })
      handleCloseDialog()
    } catch (error) {
      console.error("Error reactivating product:", error)
      toast({
        title: language === "ar" ? "خطأ في إعادة تفعيل المنتج" : "Error Reactivating Product",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdatePrice = async (productId: number) => {
    setIsUpdating(true)
    try {
      const newPrice = Number.parseFloat(editPrice)
      if (isNaN(newPrice) || newPrice <= 0) {
        toast({
          title: language === "ar" ? "خطأ" : "Error",
          description: language === "ar" ? "السعر غير صالح" : "Invalid price",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase.from("used_products").update({ price: newPrice }).eq("id", productId)

      if (error) throw error

      setUsedProducts((prev) =>
        prev.map((product) => (product.id === productId ? { ...product, price: newPrice } : product)),
      )

      toast({
        title: language === "ar" ? "تم تحديث السعر" : "Price Updated",
        description: language === "ar" ? "تم تحديث السعر بنجاح" : "Price updated successfully",
      })
      handleCloseDialog()
    } catch (error) {
      console.error("Error updating price:", error)
      toast({
        title: language === "ar" ? "خطأ في تحديث السعر" : "Error Updating Price",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteProduct = async (productId: number) => {
    if (
      window.confirm(
        language === "ar" ? "هل أنت متأكد من حذف هذا المنتج؟" : "Are you sure you want to delete this product?",
      )
    ) {
      setIsUpdating(true)
      try {
        const { error } = await supabase.from("used_products").delete().eq("id", productId)

        if (error) throw error

        setUsedProducts((prev) => prev.filter((product) => product.id !== productId))

        toast({
          title: language === "ar" ? "تم حذف المنتج" : "Product Deleted",
          description: language === "ar" ? "تم حذف المنتج المستعمل بنجاح" : "Used product deleted successfully",
        })
        handleCloseDialog()
      } catch (error) {
        console.error("Error deleting product:", error)
        toast({
          title: language === "ar" ? "خطأ في حذف المنتج" : "Error Deleting Product",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setIsUpdating(false)
      }
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        text: language === "ar" ? "قيد الانتظار" : "Pending",
      },
      approved: {
        color: "bg-green-100 text-green-800 border-green-300",
        text: language === "ar" ? "موافق عليه" : "Approved",
      },
      rejected: {
        color: "bg-red-100 text-red-800 border-red-300",
        text: language === "ar" ? "مرفوض" : "Rejected",
      },
    }

    const config = statusConfig[status] || { color: "bg-gray-100 text-gray-800 border-gray-300", text: status }
    return <Badge className={config.color}>{config.text}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === "ar" ? "ar-DZ" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">{language === "ar" ? "جاري التحميل..." : "Loading..."}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">
          {language === "ar" ? "إدارة المنتجات المستعملة" : "Manage Used Products"}
        </h2>
        <div className="text-sm text-muted-foreground">
          {language === "ar" ? "إجمالي المنتجات:" : "Total Products:"} {usedProducts.length}
        </div>
      </div>

      {usedProducts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">📦</div>
            <p className="text-gray-500 text-lg">
              {language === "ar" ? "لا توجد منتجات مستعملة معروضة" : "No used products listed"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {usedProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Product Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product[`title_${language}`] || product.title_ar || product.title_en}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">{getStatusBadge(product.status)}</div>
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 px-3 py-1 text-xs font-bold shadow-xl rounded-full">
                      {language === "ar" ? "مستعمل" : "USED"}
                    </Badge>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4 space-y-3">
                  <h3 className="text-lg font-semibold line-clamp-2">
                    {product[`title_${language}`] || product.title_ar || product.title_en || "No Title"}
                  </h3>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product[`description_${language}`] ||
                      product.description_ar ||
                      product.description_en ||
                      "No Description"}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary">DA {product.price.toLocaleString()}</span>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{product.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(product.created_at)}</span>
                    </div>
                    {product.approved_at && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>
                          {language === "ar" ? "تمت الموافقة:" : "Approved:"} {formatDate(product.approved_at)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(product)} className="flex-1">
                      <Eye className="w-4 h-4 mr-2" />
                      {language === "ar" ? "عرض" : "View"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteProduct(product.id)}
                      disabled={isUpdating}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Product Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "تفاصيل المنتج المستعمل" : "Used Product Details"}</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6">
              {/* Product Image */}
              <div className="aspect-video rounded-lg overflow-hidden">
                <img
                  src={selectedProduct.image || "/placeholder.svg"}
                  alt={selectedProduct[`title_${language}`] || selectedProduct.title_ar || selectedProduct.title_en}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Product Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    {selectedProduct[`title_${language}`] ||
                      selectedProduct.title_ar ||
                      selectedProduct.title_en ||
                      "No Title"}
                  </h3>
                  <p className="text-muted-foreground">
                    {selectedProduct[`description_${language}`] ||
                      selectedProduct.description_ar ||
                      selectedProduct.description_en ||
                      "No Description"}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === "ar" ? "السعر الحالي:" : "Current Price:"}
                    </label>
                    <div className="text-2xl font-bold text-primary">DA {selectedProduct.price.toLocaleString()}</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === "ar" ? "تعديل السعر:" : "Edit Price:"}
                    </label>
                    <Input
                      type="number"
                      placeholder={language === "ar" ? "السعر الجديد" : "New Price"}
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      min="1"
                      step="0.01"
                      disabled={isUpdating}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {language === "ar" ? "رقم الهاتف:" : "Phone Number:"}
                    </label>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{selectedProduct.phone}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {language === "ar" ? "الحالة:" : "Status:"}
                    </label>
                    {getStatusBadge(selectedProduct.status)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {language === "ar" ? "تاريخ الإرسال:" : "Submitted Date:"}
                    </label>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(selectedProduct.created_at)}</span>
                    </div>
                  </div>

                  {selectedProduct.approved_at && (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {language === "ar" ? "تاريخ الموافقة:" : "Approved Date:"}
                      </label>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{formatDate(selectedProduct.approved_at)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-3">
                {selectedProduct.status === "pending" ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleUpdatePrice(selectedProduct.id)}
                      disabled={isUpdating}
                      className="flex-1"
                    >
                      {isUpdating ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Edit className="w-4 h-4 mr-2" />
                      )}
                      {language === "ar" ? "تحديث السعر" : "Update Price"}
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => handleApproveProduct(selectedProduct.id)}
                      disabled={isUpdating}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      {language === "ar" ? "موافقة" : "Approve"}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleRejectProduct(selectedProduct.id)}
                      disabled={isUpdating}
                      className="flex-1"
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      {language === "ar" ? "رفض" : "Reject"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleUpdatePrice(selectedProduct.id)}
                      disabled={isUpdating}
                      className="flex-1"
                    >
                      {isUpdating ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Edit className="w-4 h-4 mr-2" />
                      )}
                      {language === "ar" ? "تحديث السعر" : "Update Price"}
                    </Button>

                    {selectedProduct.status === "rejected" && (
                      <Button
                        variant="default"
                        onClick={() => handleReactivateProduct(selectedProduct.id)}
                        disabled={isUpdating}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        {isUpdating ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <RotateCcw className="w-4 h-4 mr-2" />
                        )}
                        {language === "ar" ? "إعادة تفعيل" : "Reactivate"}
                      </Button>
                    )}

                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteProduct(selectedProduct.id)}
                      disabled={isUpdating}
                      className="flex-1"
                    >
                      {isUpdating ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      {language === "ar" ? "حذف المنتج" : "Delete Product"}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
