"use client"

import { useState, useEffect, useCallback, useMemo, memo } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/components/language-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  Loader2,
  Plus,
  Save,
  X,
  Edit,
  Trash2,
  Eye,
  ImageIcon,
  Upload,
  Star,
  ArrowLeft,
  Menu,
  Palette,
  Ruler,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import type { JSX } from "react"

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
  created_at: string
}

interface Category {
  id: number
  name_ar: string
  name_en: string
  slug: string
  image: string
  created_at: string
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

interface ProductImage {
  id: number
  product_id: number
  image_url: string
  is_main: boolean
  sort_order: number
}

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

interface Message {
  id: number
  name: string
  email: string
  subject: string
  message: string
  created_at: string
}

interface DefaultColor {
  id: number
  name_ar: string
  name_en: string
  value: string
  created_at: string
}

interface DefaultSize {
  id: number
  name_ar: string
  name_en: string
  value: string
  created_at: string
}

// Memoized components for better performance
const ProductCard = memo(
  ({
    product,
    language,
    categories,
    productImages,
    productVariants,
    onEdit,
    onDelete,
    onManageImages,
    getCategoryName,
  }: {
    product: Product
    language: string
    categories: Category[]
    productImages: Record<number, ProductImage[]>
    productVariants: Record<number, ProductVariant[]>
    onEdit: (product: Product) => void
    onDelete: (id: number) => void
    onManageImages: (product: Product) => void
    getCategoryName: (categoryId: number | null) => string
  }) => {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Product Image */}
            <div className="md:col-span-1">
              <img
                src={product.image || "/placeholder.svg"}
                alt={product[`title_${language}`]}
                className="w-full aspect-square object-cover rounded-lg"
                loading="lazy"
              />
            </div>

            {/* Product Info */}
            <div className="md:col-span-2 space-y-2">
              <h3 className="text-xl font-semibold">{product[`title_${language}`]}</h3>
              <p className="text-gray-600 line-clamp-2">{product[`description_${language}`]}</p>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold">DA {product.price.toLocaleString()}</span>
                {product.old_price && (
                  <span className="text-gray-500 line-through">DA {product.old_price.toLocaleString()}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {product.in_stock ? (
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                    {language === "ar" ? "متوفر" : "In Stock"}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                    {language === "ar" ? "غير متوفر" : "Out of Stock"}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {language === "ar" ? "القسم:" : "Category:"} {getCategoryName(product.category_id)}
              </p>

              {/* Product Images */}
              {productImages[product.id] && productImages[product.id].length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">{language === "ar" ? "صور المنتج:" : "Product Images:"}</h4>
                  <div className="flex flex-wrap gap-2">
                    {productImages[product.id].slice(0, 4).map((image) => (
                      <div
                        key={image.id}
                        className={`relative w-16 h-16 rounded-md overflow-hidden border-2 ${
                          image.is_main ? "border-primary" : "border-border"
                        }`}
                      >
                        <img
                          src={image.image_url || "/placeholder.svg"}
                          alt={product[`title_${language}`]}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {image.is_main && (
                          <div className="absolute bottom-0 left-0 right-0 bg-primary/70 text-white text-[8px] text-center">
                            {language === "ar" ? "رئيسية" : "Main"}
                          </div>
                        )}
                      </div>
                    ))}
                    {productImages[product.id].length > 4 && (
                      <div className="w-16 h-16 rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-500">
                        +{productImages[product.id].length - 4}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Product Variants */}
              {productVariants[product.id] && productVariants[product.id].length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">{language === "ar" ? "الخيارات المتاحة:" : "Available Options:"}</h4>

                  {/* Colors */}
                  {productVariants[product.id].filter((v) => v.variant_type === "color").length > 0 && (
                    <div className="mb-2">
                      <span className="text-sm font-medium">{language === "ar" ? "الألوان:" : "Colors:"}</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {productVariants[product.id]
                          .filter((v) => v.variant_type === "color")
                          .slice(0, 5)
                          .map((color) => (
                            <div key={color.id} className="flex items-center gap-1">
                              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color.value }}></div>
                              <span className="text-xs">{color[`name_${language}`]}</span>
                            </div>
                          ))}
                        {productVariants[product.id].filter((v) => v.variant_type === "color").length > 5 && (
                          <span className="text-xs text-gray-500">
                            +{productVariants[product.id].filter((v) => v.variant_type === "color").length - 5}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sizes */}
                  {productVariants[product.id].filter((v) => v.variant_type === "size").length > 0 && (
                    <div>
                      <span className="text-sm font-medium">{language === "ar" ? "المقاسات:" : "Sizes:"}</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {productVariants[product.id]
                          .filter((v) => v.variant_type === "size")
                          .slice(0, 5)
                          .map((size) => (
                            <span key={size.id} className="text-xs bg-muted px-2 py-1 rounded">
                              {size[`name_${language}`]}
                            </span>
                          ))}
                        {productVariants[product.id].filter((v) => v.variant_type === "size").length > 5 && (
                          <span className="text-xs text-gray-500">
                            +{productVariants[product.id].filter((v) => v.variant_type === "size").length - 5}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Product Actions */}
            <div className="md:col-span-3 flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => onManageImages(product)}>
                <ImageIcon className="w-4 h-4 mr-2" />
                {language === "ar" ? "إدارة الصور" : "Manage Images"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => onEdit(product)}>
                <Edit className="w-4 h-4 mr-2" />
                {language === "ar" ? "تعديل" : "Edit"}
              </Button>
              <Button variant="destructive" size="sm" onClick={() => onDelete(product.id)}>
                <Trash2 className="w-4 h-4 mr-2" />
                {language === "ar" ? "حذف" : "Delete"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  },
)

ProductCard.displayName = "ProductCard"

const OrderCard = memo(
  ({
    order,
    language,
    orderItems,
    onUpdateStatus,
    onViewDetails,
    getOrderStatusBadge,
    getColorName,
  }: {
    order: Order
    language: string
    orderItems: Record<number, OrderItem[]>
    onUpdateStatus: (orderId: number, status: string) => void
    onViewDetails: (order: Order) => void
    getOrderStatusBadge: (status: string) => JSX.Element
    getColorName: (colorValue: string | null) => string | null
  }) => {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Order Info */}
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">
                  {language === "ar" ? "الطلب رقم:" : "Order #:"} {order.order_number || `#${order.id}`}
                </h3>
                {getOrderStatusBadge(order.status)}
              </div>
              <p className="text-gray-600">
                {language === "ar" ? "الاسم:" : "Name:"} {order.full_name}
              </p>
              <p className="text-gray-600">
                {language === "ar" ? "الهاتف:" : "Phone:"} {order.phone}
              </p>
              <p className="text-gray-600">
                {language === "ar" ? "العنوان:" : "Address:"} {order.state}, {order.city}
              </p>
              <p className="text-gray-600">
                {language === "ar" ? "المبلغ الإجمالي:" : "Total Amount:"} DA {order.total_amount.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                {language === "ar" ? "تاريخ الطلب:" : "Order Date:"} {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* Order Actions */}
            <div className="md:col-span-1 space-y-2">
              <Select value={order.status} onValueChange={(value) => onUpdateStatus(order.id, value)}>
                <SelectTrigger>
                  <SelectValue placeholder={language === "ar" ? "تغيير الحالة" : "Change Status"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{language === "ar" ? "قيد الانتظار" : "Pending"}</SelectItem>
                  <SelectItem value="processing">{language === "ar" ? "قيد المعالجة" : "Processing"}</SelectItem>
                  <SelectItem value="shipped">{language === "ar" ? "تم الشحن" : "Shipped"}</SelectItem>
                  <SelectItem value="delivered">{language === "ar" ? "تم التوصيل" : "Delivered"}</SelectItem>
                  <SelectItem value="cancelled">{language === "ar" ? "ملغي" : "Cancelled"}</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => onViewDetails(order)} className="w-full">
                <Eye className="w-4 h-4 mr-2" />
                {language === "ar" ? "عرض التفاصيل" : "View Details"}
              </Button>
            </div>

            {/* Order Items */}
            {orderItems[order.id] && orderItems[order.id].length > 0 && (
              <div className="md:col-span-3 mt-4 pt-4 border-t">
                <h4 className="text-lg font-semibold mb-2">
                  {language === "ar" ? "المنتجات المطلوبة" : "Order Items"}
                </h4>
                <div className="space-y-2">
                  {orderItems[order.id].slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-muted rounded">
                      <div>
                        <p className="font-medium">{item.product_title}</p>
                        <div className="text-sm text-muted-foreground">
                          {item.color && (
                            <span>
                              {language === "ar" ? "اللون:" : "Color:"} {getColorName(item.color) || item.color}
                            </span>
                          )}
                          {item.color && item.size && " • "}
                          {item.size && (
                            <span>
                              {language === "ar" ? "المقاس:" : "Size:"} {item.size}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {item.quantity} × DA {item.product_price.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          DA {(item.quantity * item.product_price).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {orderItems[order.id].length > 3 && (
                    <p className="text-sm text-gray-500 text-center">
                      +{orderItems[order.id].length - 3} {language === "ar" ? "منتجات أخرى" : "more items"}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  },
)

OrderCard.displayName = "OrderCard"

export default function AdminDashboard() {
  const { language } = useLanguage()
  const router = useRouter()

  // State
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [orderItems, setOrderItems] = useState<Record<number, OrderItem[]>>({})
  const [productVariants, setProductVariants] = useState<Record<number, ProductVariant[]>>({})
  const [productImages, setProductImages] = useState<Record<number, ProductImage[]>>({})
  const [defaultColors, setDefaultColors] = useState<DefaultColor[]>([])
  const [defaultSizes, setDefaultSizes] = useState<DefaultSize[]>([])

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [isSavingProduct, setIsSavingProduct] = useState(false)
  const [isSavingCategory, setIsSavingCategory] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  // UI states
  const [activeTab, setActiveTab] = useState("products")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isManagingImages, setIsManagingImages] = useState(false)

  // Form states
  const [newProduct, setNewProduct] = useState({
    title_ar: "",
    title_en: "",
    description_ar: "",
    description_en: "",
    price: 0,
    old_price: null as number | null,
    status_ar: "متاح",
    status_en: "Available",
    in_stock: true,
    category_id: null as number | null,
    rating: 4.5,
  })

  const [newCategory, setNewCategory] = useState({
    name_ar: "",
    name_en: "",
  })

  // Image states
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [mainImageIndex, setMainImageIndex] = useState(0)

  // Variant states
  const [newVariants, setNewVariants] = useState<{
    colors: { name_ar: string; name_en: string; value: string }[]
    sizes: { name_ar: string; name_en: string; value: string }[]
  }>({
    colors: [],
    sizes: [],
  })

  const [editingVariants, setEditingVariants] = useState<{
    colors: { name_ar: string; name_en: string; value: string }[]
    sizes: { name_ar: string; name_en: string; value: string }[]
  }>({
    colors: [],
    sizes: [],
  })

  // Color/Size form states
  const [isAddingColor, setIsAddingColor] = useState(false)
  const [isAddingSize, setIsAddingSize] = useState(false)
  const [isEditingColor, setIsEditingColor] = useState(false)
  const [isEditingSize, setIsEditingSize] = useState(false)
  const [newColor, setNewColor] = useState({ name_ar: "", name_en: "", value: "#000000" })
  const [newSize, setNewSize] = useState({ name_ar: "", name_en: "", value: "" })
  const [editColor, setEditColor] = useState({ name_ar: "", name_en: "", value: "#000000" })
  const [editSize, setEditSize] = useState({ name_ar: "", name_en: "", value: "" })

  // Default variants states
  const [newDefaultColor, setNewDefaultColor] = useState({ name_ar: "", name_en: "", value: "#000000" })
  const [newDefaultSize, setNewDefaultSize] = useState({ name_ar: "", name_en: "", value: "" })

  // Search and filter states
  const [orderSearch, setOrderSearch] = useState("")
  const [orderStatusFilter, setOrderStatusFilter] = useState("all")

  // Memoized filtered orders for better performance
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.full_name.toLowerCase().includes(orderSearch.toLowerCase()) ||
        order.phone.includes(orderSearch) ||
        order.order_number?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        order.id.toString().includes(orderSearch)

      const matchesStatus = orderStatusFilter === "all" || order.status === orderStatusFilter

      return matchesSearch && matchesStatus
    })
  }, [orders, orderSearch, orderStatusFilter])

  // Initialize data
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/admin")
        return
      }

      await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchOrders(),
        fetchMessages(),
        fetchDefaultColors(),
        fetchDefaultSizes(),
      ])
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  // Fetch default colors and sizes
  const fetchDefaultColors = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("default_colors").select("*").order("name_ar", { ascending: true })

      if (error) throw error
      setDefaultColors(data || [])
    } catch (error) {
      console.error("Error fetching default colors:", error)
    }
  }, [])

  const fetchDefaultSizes = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("default_sizes").select("*").order("value", { ascending: true })

      if (error) throw error
      setDefaultSizes(data || [])
    } catch (error) {
      console.error("Error fetching default sizes:", error)
    }
  }, [])

  // Optimized fetch functions
  const fetchProducts = useCallback(async () => {
    try {
      // Fetch products with related data in fewer queries
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })

      if (productsError) throw productsError

      if (productsData && productsData.length > 0) {
        const productIds = productsData.map((p) => p.id)

        // Fetch all variants and images in parallel
        const [variantsResult, imagesResult] = await Promise.all([
          supabase.from("product_variants").select("*").in("product_id", productIds),
          supabase
            .from("product_images")
            .select("*")
            .in("product_id", productIds)
            .order("sort_order", { ascending: true }),
        ])

        // Group variants by product_id
        const variantsByProduct: Record<number, ProductVariant[]> = {}
        if (variantsResult.data) {
          variantsResult.data.forEach((variant) => {
            if (!variantsByProduct[variant.product_id]) {
              variantsByProduct[variant.product_id] = []
            }
            variantsByProduct[variant.product_id].push(variant)
          })
        }

        // Group images by product_id
        const imagesByProduct: Record<number, ProductImage[]> = {}
        if (imagesResult.data) {
          imagesResult.data.forEach((image) => {
            if (!imagesByProduct[image.product_id]) {
              imagesByProduct[image.product_id] = []
            }
            imagesByProduct[image.product_id].push(image)
          })
        }

        setProducts(productsData)
        setProductVariants(variantsByProduct)
        setProductImages(imagesByProduct)
      } else {
        setProducts([])
        setProductVariants({})
        setProductImages({})
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        title: language === "ar" ? "خطأ في جلب المنتجات" : "Error fetching products",
        description: error.message,
        variant: "destructive",
      })
    }
  }, [language])

  const fetchProductImages = useCallback(async (productId: number) => {
    try {
      const { data, error } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", productId)
        .order("sort_order", { ascending: true })

      if (error) throw error
      setProductImages((prev) => ({ ...prev, [productId]: data || [] }))
    } catch (error) {
      console.error("Error fetching product images:", error)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("categories").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
      toast({
        title: language === "ar" ? "خطأ في جلب الأقسام" : "Error fetching categories",
        description: error.message,
        variant: "destructive",
      })
    }
  }, [language])

  const fetchOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setOrders(data || [])

      // Fetch order items for each order
      if (data && data.length > 0) {
        const orderIds = data.map((order) => order.id)
        const { data: itemsData } = await supabase.from("order_items").select("*").in("order_id", orderIds)

        // Group items by order_id
        const itemsByOrder: Record<number, OrderItem[]> = {}
        if (itemsData) {
          itemsData.forEach((item) => {
            if (!itemsByOrder[item.order_id]) {
              itemsByOrder[item.order_id] = []
            }
            itemsByOrder[item.order_id].push(item)
          })
        }
        setOrderItems(itemsByOrder)
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast({
        title: language === "ar" ? "خطأ في جلب الطلبات" : "Error fetching orders",
        description: error.message,
        variant: "destructive",
      })
    }
  }, [language])

  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("messages").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error("Error fetching messages:", error)
      toast({
        title: language === "ar" ? "خطأ في جلب الرسائل" : "Error fetching messages",
        description: error.message,
        variant: "destructive",
      })
    }
  }, [language])

  // Optimized image handling functions
  const convertFileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      img.onload = () => {
        // More aggressive compression for faster processing
        const maxWidth = 600
        const maxHeight = 600
        let { width, height } = img

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height
        ctx?.drawImage(img, 0, 0, width, height)
        // Lower quality for faster processing
        const base64 = canvas.toDataURL("image/jpeg", 0.6)
        resolve(base64)
      }

      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }, [])

  const handleImageUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return

      setUploadingImage(true)
      const newImages: string[] = []

      try {
        // Process images in parallel for faster upload
        const imagePromises = Array.from(files)
          .slice(0, 5)
          .map(async (file) => {
            if (file.type.startsWith("image/")) {
              return await convertFileToBase64(file)
            }
            return null
          })

        const results = await Promise.all(imagePromises)
        const validImages = results.filter((img) => img !== null) as string[]
        newImages.push(...validImages)

        setPreviewImages((prev) => [...prev, ...newImages])

        toast({
          title: language === "ar" ? "تم رفع الصور" : "Images uploaded",
          description: language === "ar" ? "تم رفع الصور بنجاح" : "Images uploaded successfully",
        })
      } catch (error) {
        console.error("Error uploading images:", error)
        toast({
          title: language === "ar" ? "خطأ في رفع الصور" : "Error uploading images",
          description: language === "ar" ? "حدث خطأ أثناء رفع الصور" : "An error occurred while uploading images",
          variant: "destructive",
        })
      } finally {
        setUploadingImage(false)
      }
    },
    [convertFileToBase64, language],
  )

  const removePreviewImage = useCallback((index: number) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index))
    setMainImageIndex((prev) => {
      if (prev === index) {
        return 0
      } else if (prev > index) {
        return prev - 1
      }
      return prev
    })
  }, [])

  const setMainImage = useCallback((index: number) => {
    setMainImageIndex(index)
  }, [])

  // Default colors functions
  const handleAddDefaultColor = useCallback(async () => {
    if (!newDefaultColor.name_ar || !newDefaultColor.value) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const colorToAdd = {
        ...newDefaultColor,
        name_en: newDefaultColor.name_en || newDefaultColor.name_ar,
      }

      const { data, error } = await supabase.from("default_colors").insert([colorToAdd]).select().single()

      if (error) throw error

      setDefaultColors((prev) => [...prev, data])
      setNewDefaultColor({ name_ar: "", name_en: "", value: "#000000" })

      toast({
        title: language === "ar" ? "تم إضافة اللون" : "Color added",
        description: language === "ar" ? "تم إضافة اللون بنجاح" : "Color has been added successfully",
      })
    } catch (error) {
      console.error("Error adding default color:", error)
      toast({
        title: language === "ar" ? "خطأ في إضافة اللون" : "Error adding color",
        description: error.message,
        variant: "destructive",
      })
    }
  }, [newDefaultColor, language])

  const handleAddDefaultSize = useCallback(async () => {
    if (!newDefaultSize.name_ar || !newDefaultSize.value) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const sizeToAdd = {
        ...newDefaultSize,
        name_en: newDefaultSize.name_en || newDefaultSize.name_ar,
      }

      const { data, error } = await supabase.from("default_sizes").insert([sizeToAdd]).select().single()

      if (error) throw error

      setDefaultSizes((prev) => [...prev, data])
      setNewDefaultSize({ name_ar: "", name_en: "", value: "" })

      toast({
        title: language === "ar" ? "تم إضافة المقاس" : "Size added",
        description: language === "ar" ? "تم إضافة المقاس بنجاح" : "Size has been added successfully",
      })
    } catch (error) {
      console.error("Error adding default size:", error)
      toast({
        title: language === "ar" ? "خطأ في إضافة المقاس" : "Error adding size",
        description: error.message,
        variant: "destructive",
      })
    }
  }, [newDefaultSize, language])

  const handleDeleteDefaultColor = useCallback(
    async (id: number) => {
      if (
        window.confirm(
          language === "ar" ? "هل أنت متأكد من حذف هذا اللون؟" : "Are you sure you want to delete this color?",
        )
      ) {
        try {
          const { error } = await supabase.from("default_colors").delete().eq("id", id)
          if (error) throw error

          setDefaultColors((prev) => prev.filter((c) => c.id !== id))

          toast({
            title: language === "ar" ? "تم حذف اللون" : "Color deleted",
            description: language === "ar" ? "تم حذف اللون بنجاح" : "Color has been deleted successfully",
          })
        } catch (error) {
          console.error("Error deleting default color:", error)
          toast({
            title: language === "ar" ? "خطأ في حذف اللون" : "Error deleting color",
            description: error.message,
            variant: "destructive",
          })
        }
      }
    },
    [language],
  )

  const handleDeleteDefaultSize = useCallback(
    async (id: number) => {
      if (
        window.confirm(
          language === "ar" ? "هل أنت متأكد من حذف هذا المقاس؟" : "Are you sure you want to delete this size?",
        )
      ) {
        try {
          const { error } = await supabase.from("default_sizes").delete().eq("id", id)
          if (error) throw error

          setDefaultSizes((prev) => prev.filter((s) => s.id !== id))

          toast({
            title: language === "ar" ? "تم حذف المقاس" : "Size deleted",
            description: language === "ar" ? "تم حذف المقاس بنجاح" : "Size has been deleted successfully",
          })
        } catch (error) {
          console.error("Error deleting default size:", error)
          toast({
            title: language === "ar" ? "خطأ في حذف المقاس" : "Error deleting size",
            description: error.message,
            variant: "destructive",
          })
        }
      }
    },
    [language],
  )

  // Add color/size from defaults
  const addColorFromDefaults = useCallback((color: DefaultColor) => {
    const colorToAdd = {
      name_ar: color.name_ar,
      name_en: color.name_en,
      value: color.value,
    }

    // Check if color already exists
    setNewVariants((prev) => {
      const exists = prev.colors.some((c) => c.value === color.value)
      if (!exists) {
        return {
          ...prev,
          colors: [...prev.colors, colorToAdd],
        }
      }
      return prev
    })
  }, [])

  const addSizeFromDefaults = useCallback((size: DefaultSize) => {
    const sizeToAdd = {
      name_ar: size.name_ar,
      name_en: size.name_en,
      value: size.value,
    }

    // Check if size already exists
    setNewVariants((prev) => {
      const exists = prev.sizes.some((s) => s.value === size.value)
      if (!exists) {
        return {
          ...prev,
          sizes: [...prev.sizes, sizeToAdd],
        }
      }
      return prev
    })
  }, [])

  const addEditColorFromDefaults = useCallback((color: DefaultColor) => {
    const colorToAdd = {
      name_ar: color.name_ar,
      name_en: color.name_en,
      value: color.value,
    }

    // Check if color already exists
    setEditingVariants((prev) => {
      const exists = prev.colors.some((c) => c.value === color.value)
      if (!exists) {
        return {
          ...prev,
          colors: [...prev.colors, colorToAdd],
        }
      }
      return prev
    })
  }, [])

  const addEditSizeFromDefaults = useCallback((size: DefaultSize) => {
    const sizeToAdd = {
      name_ar: size.name_ar,
      name_en: size.name_en,
      value: size.value,
    }

    // Check if size already exists
    setEditingVariants((prev) => {
      const exists = prev.sizes.some((s) => s.value === size.value)
      if (!exists) {
        return {
          ...prev,
          sizes: [...prev.sizes, sizeToAdd],
        }
      }
      return prev
    })
  }, [])

  // Optimized product functions
  const handleAddProduct = useCallback(async () => {
    if (previewImages.length === 0) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description:
          language === "ar" ? "يجب رفع صورة واحدة على الأقل للمنتج" : "At least one product image is required",
        variant: "destructive",
      })
      return
    }

    setIsAddingProduct(true)

    try {
      const slug =
        (newProduct.title_en || newProduct.title_ar)
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
          .replace(/^-+|-+$/g, "") +
        "-" +
        Date.now().toString().slice(-4)

      const mainImage = previewImages[mainImageIndex]

      const formattedProduct = {
        ...newProduct,
        title_en: newProduct.title_en || newProduct.title_ar,
        description_en: newProduct.description_en || newProduct.description_ar,
        slug,
        image: mainImage,
        price: Number(newProduct.price),
        old_price: newProduct.old_price ? Number(newProduct.old_price) : null,
        rating: Number(newProduct.rating),
      }

      // Use transaction for better performance and consistency
      const { data: productData, error: productError } = await supabase
        .from("products")
        .insert([formattedProduct])
        .select()
        .single()

      if (productError) throw productError

      const productId = productData.id

      // Prepare all inserts
      const imagesToInsert = previewImages.map((url, index) => ({
        product_id: productId,
        image_url: url,
        is_main: index === mainImageIndex,
        sort_order: index,
      }))

      const variantsToInsert = [
        ...newVariants.colors.map((color) => ({
          product_id: productId,
          variant_type: "color",
          name_ar: color.name_ar,
          name_en: color.name_en || color.name_ar,
          value: color.value,
          in_stock: true,
        })),
        ...newVariants.sizes.map((size) => ({
          product_id: productId,
          variant_type: "size",
          name_ar: size.name_ar,
          name_en: size.name_en || size.name_ar,
          value: size.value,
          in_stock: true,
        })),
      ]

      // Execute inserts in parallel
      const insertPromises = []

      if (imagesToInsert.length > 0) {
        insertPromises.push(supabase.from("product_images").insert(imagesToInsert))
      }

      if (variantsToInsert.length > 0) {
        insertPromises.push(supabase.from("product_variants").insert(variantsToInsert))
      }

      await Promise.all(insertPromises)

      // Optimistic update - add to local state immediately
      setProducts((prev) => [productData, ...prev])
      setProductImages((prev) => ({
        ...prev,
        [productId]: imagesToInsert.map((img, index) => ({
          id: Date.now() + index,
          product_id: productId,
          image_url: img.image_url,
          is_main: img.is_main,
          sort_order: img.sort_order,
        })),
      }))

      if (variantsToInsert.length > 0) {
        setProductVariants((prev) => ({
          ...prev,
          [productId]: variantsToInsert.map((variant, index) => ({
            id: Date.now() + index,
            product_id: productId,
            variant_type: variant.variant_type,
            name_ar: variant.name_ar,
            name_en: variant.name_en,
            value: variant.value,
            in_stock: variant.in_stock,
          })),
        }))
      }

      toast({
        title: language === "ar" ? "تم إضافة المنتج بنجاح" : "Product added successfully",
        description: language === "ar" ? "تم إضافة المنتج الجديد بنجاح" : "New product has been added successfully",
      })

      // Reset form
      setNewProduct({
        title_ar: "",
        title_en: "",
        description_ar: "",
        description_en: "",
        price: 0,
        old_price: null,
        status_ar: "متاح",
        status_en: "Available",
        in_stock: true,
        category_id: null,
        rating: 4.5,
      })
      setNewVariants({ colors: [], sizes: [] })
      setPreviewImages([])
      setMainImageIndex(0)
    } catch (error) {
      console.error("Error adding product:", error)
      toast({
        title: language === "ar" ? "خطأ في إضافة المنتج" : "Error adding product",
        description: language === "ar" ? "حدث خطأ أثناء إضافة المنتج" : "An error occurred while adding the product",
        variant: "destructive",
      })
    } finally {
      setIsAddingProduct(false)
    }
  }, [previewImages, mainImageIndex, newProduct, newVariants, language])

  const handleEditProduct = useCallback(
    (product: Product) => {
      setEditingProduct(product)

      // Load existing variants
      const currentVariants = productVariants[product.id] || []
      const colors = currentVariants
        .filter((v) => v.variant_type === "color")
        .map((v) => ({ name_ar: v.name_ar, name_en: v.name_en, value: v.value }))
      const sizes = currentVariants
        .filter((v) => v.variant_type === "size")
        .map((v) => ({ name_ar: v.name_ar, name_en: v.name_en, value: v.value }))

      setEditingVariants({ colors, sizes })
    },
    [productVariants],
  )

  const handleSaveProductEdit = useCallback(async () => {
    if (!editingProduct) return

    setIsSavingProduct(true)

    try {
      const formattedProduct = {
        ...editingProduct,
        title_en: editingProduct.title_en || editingProduct.title_ar,
        description_en: editingProduct.description_en || editingProduct.description_ar,
        price: Number(editingProduct.price),
        old_price: editingProduct.old_price ? Number(editingProduct.old_price) : null,
        rating: Number(editingProduct.rating),
      }

      const variantsToInsert = [
        ...editingVariants.colors.map((color) => ({
          product_id: editingProduct.id,
          variant_type: "color",
          name_ar: color.name_ar,
          name_en: color.name_en || color.name_ar,
          value: color.value,
          in_stock: true,
        })),
        ...editingVariants.sizes.map((size) => ({
          product_id: editingProduct.id,
          variant_type: "size",
          name_ar: size.name_ar,
          name_en: size.name_en || size.name_ar,
          value: size.value,
          in_stock: true,
        })),
      ]

      // Execute all operations in parallel
      const operations = [
        supabase.from("products").update(formattedProduct).eq("id", editingProduct.id),
        supabase.from("product_variants").delete().eq("product_id", editingProduct.id),
      ]

      await Promise.all(operations)

      // Insert new variants
      if (variantsToInsert.length > 0) {
        await supabase.from("product_variants").insert(variantsToInsert)
      }

      // Optimistic update
      setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? formattedProduct : p)))

      if (variantsToInsert.length > 0) {
        setProductVariants((prev) => ({
          ...prev,
          [editingProduct.id]: variantsToInsert.map((variant, index) => ({
            id: Date.now() + index,
            product_id: editingProduct.id,
            variant_type: variant.variant_type,
            name_ar: variant.name_ar,
            name_en: variant.name_en,
            value: variant.value,
            in_stock: variant.in_stock,
          })),
        }))
      }

      toast({
        title: language === "ar" ? "تم تحديث المنتج" : "Product updated",
        description: language === "ar" ? "تم تحديث المنتج بنجاح" : "Product has been updated successfully",
      })

      setEditingProduct(null)
      setEditingVariants({ colors: [], sizes: [] })
    } catch (error) {
      console.error("Error updating product:", error)
      toast({
        title: language === "ar" ? "خطأ في تحديث المنتج" : "Error updating product",
        description: language === "ar" ? "حدث خطأ أثناء تحديث المنتج" : "An error occurred while updating the product",
        variant: "destructive",
      })
    } finally {
      setIsSavingProduct(false)
    }
  }, [editingProduct, editingVariants, language])

  const handleDeleteProduct = useCallback(
    async (id: number) => {
      if (
        window.confirm(
          language === "ar" ? "هل أنت متأكد من حذف هذا المنتج؟" : "Are you sure you want to delete this product?",
        )
      ) {
        try {
          toast({
            title: language === "ar" ? "جاري حذف المنتج..." : "Deleting product...",
            description: language === "ar" ? "يرجى الانتظار" : "Please wait",
          })

          const { error } = await supabase.from("products").delete().eq("id", id)
          if (error) throw error

          // Optimistic update
          setProducts((prev) => prev.filter((p) => p.id !== id))
          setProductImages((prev) => {
            const newImages = { ...prev }
            delete newImages[id]
            return newImages
          })
          setProductVariants((prev) => {
            const newVariants = { ...prev }
            delete newVariants[id]
            return newVariants
          })

          toast({
            title: language === "ar" ? "تم حذف المنتج" : "Product deleted",
            description: language === "ar" ? "تم حذف المنتج بنجاح" : "Product has been deleted successfully",
          })
        } catch (error) {
          console.error("Error deleting product:", error)
          toast({
            title: language === "ar" ? "خطأ في حذف المنتج" : "Error deleting product",
            description: error.message,
            variant: "destructive",
          })
        }
      }
    },
    [language],
  )

  // Category functions
  const handleAddCategory = useCallback(async () => {
    setIsAddingCategory(true)

    try {
      const formattedCategory = {
        ...newCategory,
        name_en: newCategory.name_en || newCategory.name_ar,
        slug:
          (newCategory.name_en || newCategory.name_ar).toLowerCase().replace(/\s+/g, "-") || `category-${Date.now()}`,
        image: "/placeholder.svg?height=200&width=200",
      }

      const { data, error } = await supabase.from("categories").insert([formattedCategory]).select().single()
      if (error) throw error

      // Optimistic update
      setCategories((prev) => [data, ...prev])

      toast({
        title: language === "ar" ? "تم إضافة القسم" : "Category added",
        description: language === "ar" ? "تم إضافة القسم بنجاح" : "Category has been added successfully",
      })

      setNewCategory({ name_ar: "", name_en: "" })
    } catch (error) {
      console.error("Error adding category:", error)
      toast({
        title: language === "ar" ? "خطأ في إضافة القسم" : "Error adding category",
        description: language === "ar" ? "حدث خطأ أثناء إضافة القسم" : "An error occurred while adding the category",
        variant: "destructive",
      })
    } finally {
      setIsAddingCategory(false)
    }
  }, [newCategory, language])

  const handleEditCategory = useCallback((category: Category) => {
    setEditingCategory(category)
  }, [])

  const handleSaveCategoryEdit = useCallback(async () => {
    if (!editingCategory) return

    setIsSavingCategory(true)

    try {
      const formattedCategory = {
        ...editingCategory,
        name_en: editingCategory.name_en || editingCategory.name_ar,
        slug: (editingCategory.name_en || editingCategory.name_ar).toLowerCase().replace(/\s+/g, "-"),
      }

      const { error } = await supabase.from("categories").update(formattedCategory).eq("id", editingCategory.id)

      if (error) throw error

      // Optimistic update
      setCategories((prev) => prev.map((c) => (c.id === editingCategory.id ? formattedCategory : c)))

      toast({
        title: language === "ar" ? "تم تحديث القسم" : "Category updated",
        description: language === "ar" ? "تم تحديث القسم بنجاح" : "Category has been updated successfully",
      })

      setEditingCategory(null)
    } catch (error) {
      console.error("Error updating category:", error)
      toast({
        title: language === "ar" ? "خطأ في تحديث القسم" : "Error updating category",
        description: language === "ar" ? "حدث خطأ أثناء تحديث القسم" : "An error occurred while updating the category",
        variant: "destructive",
      })
    } finally {
      setIsSavingCategory(false)
    }
  }, [editingCategory, language])

  const handleDeleteCategory = useCallback(
    async (id: number) => {
      if (
        window.confirm(
          language === "ar" ? "هل أنت متأكد من حذف هذا القسم؟" : "Are you sure you want to delete this category?",
        )
      ) {
        try {
          toast({
            title: language === "ar" ? "جاري حذف القسم..." : "Deleting category...",
            description: language === "ar" ? "يرجى الانتظار" : "Please wait",
          })

          const { error } = await supabase.from("categories").delete().eq("id", id)
          if (error) throw error

          // Optimistic update
          setCategories((prev) => prev.filter((c) => c.id !== id))

          toast({
            title: language === "ar" ? "تم حذف القسم" : "Category deleted",
            description: language === "ar" ? "تم حذف القسم بنجاح" : "Category has been deleted successfully",
          })
        } catch (error) {
          console.error("Error deleting category:", error)
          toast({
            title: language === "ar" ? "خطأ في حذف القسم" : "Error deleting category",
            description: error.message,
            variant: "destructive",
          })
        }
      }
    },
    [language],
  )

  // Variant functions
  const handleAddColor = useCallback(() => {
    if (newColor.name_ar && newColor.value) {
      const colorToAdd = {
        ...newColor,
        name_en: newColor.name_en || newColor.name_ar,
      }
      setNewVariants((prev) => ({
        ...prev,
        colors: [...prev.colors, colorToAdd],
      }))
      setNewColor({ name_ar: "", name_en: "", value: "#000000" })
      setIsAddingColor(false)
    }
  }, [newColor])

  const handleAddSize = useCallback(() => {
    if (newSize.name_ar && newSize.value) {
      const sizeToAdd = {
        ...newSize,
        name_en: newSize.name_en || newSize.name_ar,
      }
      setNewVariants((prev) => ({
        ...prev,
        sizes: [...prev.sizes, sizeToAdd],
      }))
      setNewSize({ name_ar: "", name_en: "", value: "" })
      setIsAddingSize(false)
    }
  }, [newSize])

  const handleRemoveColor = useCallback((index: number) => {
    setNewVariants((prev) => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index),
    }))
  }, [])

  const handleRemoveSize = useCallback((index: number) => {
    setNewVariants((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index),
    }))
  }, [])

  const handleAddEditColor = useCallback(() => {
    if (editColor.name_ar && editColor.value) {
      const colorToAdd = {
        ...editColor,
        name_en: editColor.name_en || editColor.name_ar,
      }
      setEditingVariants((prev) => ({
        ...prev,
        colors: [...prev.colors, colorToAdd],
      }))
      setEditColor({ name_ar: "", name_en: "", value: "#000000" })
      setIsEditingColor(false)
    }
  }, [editColor])

  const handleAddEditSize = useCallback(() => {
    if (editSize.name_ar && editSize.value) {
      const colorToAdd = {
        ...editSize,
        name_en: editSize.name_en || editSize.name_ar,
      }
      setEditingVariants((prev) => ({
        ...prev,
        sizes: [...prev.sizes, colorToAdd],
      }))
      setEditSize({ name_ar: "", name_en: "", value: "" })
      setIsEditingSize(false)
    }
  }, [editSize])

  const handleRemoveEditColor = useCallback((index: number) => {
    setEditingVariants((prev) => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index),
    }))
  }, [])

  const handleRemoveEditSize = useCallback((index: number) => {
    setEditingVariants((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index),
    }))
  }, [])

  // Order functions
  const handleUpdateOrderStatus = useCallback(
    async (orderId: number, status: string) => {
      try {
        toast({
          title: language === "ar" ? "جاري تحديث حالة الطلب..." : "Updating order status...",
          description: language === "ar" ? "يرجى الانتظار" : "Please wait",
        })

        const { error } = await supabase.from("orders").update({ status }).eq("id", orderId)
        if (error) throw error

        // Optimistic update
        setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status } : order)))

        toast({
          title: language === "ar" ? "تم تحديث حالة الطلب" : "Order status updated",
          description: language === "ar" ? "تم تحديث حالة الطلب بنجاح" : "Order status has been updated successfully",
        })
      } catch (error) {
        console.error("Error updating order status:", error)
        toast({
          title: language === "ar" ? "خطأ في تحديث حالة الطلب" : "Error updating order status",
          description: error.message,
          variant: "destructive",
        })
      }
    },
    [language],
  )

  // Message functions
  const handleDeleteMessage = useCallback(
    async (id: number) => {
      if (
        window.confirm(
          language === "ar" ? "هل أنت متأكد من حذف هذه الرسالة؟" : "Are you sure you want to delete this message?",
        )
      ) {
        try {
          toast({
            title: language === "ar" ? "جاري حذف الرسالة..." : "Deleting message...",
            description: language === "ar" ? "يرجى الانتظار" : "Please wait",
          })

          const { error } = await supabase.from("messages").delete().eq("id", id)
          if (error) throw error

          // Optimistic update
          setMessages((prev) => prev.filter((m) => m.id !== id))

          toast({
            title: language === "ar" ? "تم حذف الرسالة" : "Message deleted",
            description: language === "ar" ? "تم حذف الرسالة بنجاح" : "Message has been deleted successfully",
          })
        } catch (error) {
          console.error("Error deleting message:", error)
          toast({
            title: language === "ar" ? "خطأ في حذف الرسالة" : "Error deleting message",
            description: error.message,
            variant: "destructive",
          })
        }
      }
    },
    [language],
  )

  // Image management functions
  const handleManageImages = useCallback((product: Product) => {
    setSelectedProduct(product)
    setIsManagingImages(true)
  }, [])

  const handleSetMainImage = useCallback(
    async (imageId: number, productId: number) => {
      try {
        toast({
          title: language === "ar" ? "جاري تعيين الصورة الرئيسية..." : "Setting main image...",
          description: language === "ar" ? "يرجى الانتظار" : "Please wait",
        })

        // Execute operations in parallel
        await Promise.all([
          supabase.from("product_images").update({ is_main: false }).eq("product_id", productId),
          supabase.from("product_images").update({ is_main: true }).eq("id", imageId),
        ])

        // Update the product's main image
        const { data: imageData } = await supabase.from("product_images").select("image_url").eq("id", imageId).single()

        if (imageData) {
          await supabase.from("products").update({ image: imageData.image_url }).eq("id", productId)

          // Optimistic update
          setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, image: imageData.image_url } : p)))
        }

        // Update local images state
        setProductImages((prev) => ({
          ...prev,
          [productId]:
            prev[productId]?.map((img) => ({
              ...img,
              is_main: img.id === imageId,
            })) || [],
        }))

        toast({
          title: language === "ar" ? "تم تعيين الصورة الرئيسية" : "Main image set",
          description: language === "ar" ? "تم تعيين الصورة الرئيسية بنجاح" : "Main image has been set successfully",
        })
      } catch (error) {
        console.error("Error setting main image:", error)
        toast({
          title: language === "ar" ? "خطأ في تعيين الصورة الرئيسية" : "Error setting main image",
          description: error.message,
          variant: "destructive",
        })
      }
    },
    [language],
  )

  const handleDeleteProductImage = useCallback(
    async (imageId: number, productId: number) => {
      if (
        window.confirm(
          language === "ar" ? "هل أنت متأكد من حذف هذه الصورة؟" : "Are you sure you want to delete this image?",
        )
      ) {
        try {
          toast({
            title: language === "ar" ? "جاري حذف الصورة..." : "Deleting image...",
            description: language === "ar" ? "يرجى الانتظار" : "Please wait",
          })

          const { error } = await supabase.from("product_images").delete().eq("id", imageId)
          if (error) throw error

          // Optimistic update
          setProductImages((prev) => ({
            ...prev,
            [productId]: prev[productId]?.filter((img) => img.id !== imageId) || [],
          }))

          toast({
            title: language === "ar" ? "تم حذف الصورة" : "Image deleted",
            description: language === "ar" ? "تم حذف الصورة بنجاح" : "Image has been deleted successfully",
          })
        } catch (error) {
          console.error("Error deleting image:", error)
          toast({
            title: language === "ar" ? "خطأ في حذف الصورة" : "Error deleting image",
            description: error.message,
            variant: "destructive",
          })
        }
      }
    },
    [language],
  )

  const handleAddProductImages = useCallback(
    async (files: FileList | null, productId: number | undefined) => {
      if (!files || files.length === 0 || !productId) return

      setUploadingImage(true)

      try {
        const newImages: string[] = []

        // Process images in parallel for faster upload
        const imagePromises = Array.from(files)
          .slice(0, 5)
          .map(async (file) => {
            if (file.type.startsWith("image/")) {
              return await convertFileToBase64(file)
            }
            return null
          })

        const results = await Promise.all(imagePromises)
        const validImages = results.filter((img) => img !== null) as string[]
        newImages.push(...validImages)

        if (newImages.length === 0) return

        // Prepare images for database insert
        const imagesToInsert = newImages.map((url, index) => ({
          product_id: productId,
          image_url: url,
          is_main: false,
          sort_order: (productImages[productId]?.length || 0) + index,
        }))

        // Insert images to database
        const { data: insertedImages, error } = await supabase.from("product_images").insert(imagesToInsert).select()

        if (error) throw error

        // Update local state
        setProductImages((prev) => ({
          ...prev,
          [productId]: [...(prev[productId] || []), ...insertedImages],
        }))

        toast({
          title: language === "ar" ? "تم رفع الصور" : "Images uploaded",
          description: language === "ar" ? "تم رفع الصور بنجاح" : "Images uploaded successfully",
        })
      } catch (error) {
        console.error("Error uploading images:", error)
        toast({
          title: language === "ar" ? "خطأ في رفع الصور" : "Error uploading images",
          description: language === "ar" ? "حدث خطأ أثناء رفع الصور" : "An error occurred while uploading images",
          variant: "destructive",
        })
      } finally {
        setUploadingImage(false)
      }
    },
    [convertFileToBase64, language, productImages],
  )

  // Utility functions
  const getCategoryName = useCallback(
    (categoryId: number | null) => {
      if (!categoryId) return language === "ar" ? "بدون قسم" : "No Category"
      const category = categories.find((cat) => cat.id === categoryId)
      return category ? category[`name_${language}`] : language === "ar" ? "بدون قسم" : "No Category"
    },
    [categories, language],
  )

  const getOrderStatusBadge = useCallback(
    (status: string) => {
      const statusConfig = {
        pending: {
          color: "bg-yellow-100 text-yellow-800 border-yellow-300",
          text: language === "ar" ? "قيد الانتظار" : "Pending",
        },
        processing: {
          color: "bg-blue-100 text-blue-800 border-blue-300",
          text: language === "ar" ? "قيد المعالجة" : "Processing",
        },
        shipped: {
          color: "bg-purple-100 text-purple-800 border-purple-300",
          text: language === "ar" ? "تم الشحن" : "Shipped",
        },
        delivered: {
          color: "bg-green-100 text-green-800 border-green-300",
          text: language === "ar" ? "تم التوصيل" : "Delivered",
        },
        cancelled: { color: "bg-red-100 text-red-800 border-red-300", text: language === "ar" ? "ملغي" : "Cancelled" },
      }

      const config = statusConfig[status] || { color: "bg-gray-100 text-gray-800 border-gray-300", text: status }
      return (
        <Badge variant="outline" className={config.color}>
          {config.text}
        </Badge>
      )
    },
    [language],
  )

  const getColorName = useCallback(
    (colorValue: string | null) => {
      if (!colorValue) return null

      for (const product of products) {
        const variants = productVariants[product.id] || []
        const colorVariant = variants.find(
          (variant) => variant.variant_type === "color" && variant.value === colorValue,
        )
        if (colorVariant) {
          return colorVariant[`name_${language}`]
        }
      }

      return colorValue
    },
    [products, productVariants, language],
  )

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    router.push("/admin")
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster />

      {/* Navbar */}
      <nav className="bg-card shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#e3a52f] via-[#8d421f] to-[#63292a]">
              {language === "ar" ? "لوحة التحكم" : "Admin Dashboard"}
            </h1>

            {/* Desktop menu */}
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <ArrowLeft size={16} />
                  {language === "ar" ? "العودة إلى الموقع" : "Back to Site"}
                </Button>
              </Link>
              <Button variant="outline" onClick={handleLogout}>
                {language === "ar" ? "تسجيل الخروج" : "Logout"}
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button variant="ghost" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </Button>
            </div>
          </div>

          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 space-y-4">
              <Link href="/" className="block">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <ArrowLeft size={16} className="mr-2" />
                  {language === "ar" ? "العودة إلى الموقع" : "Back to Site"}
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleLogout}>
                {language === "ar" ? "تسجيل الخروج" : "Logout"}
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="products">{language === "ar" ? "المنتجات" : "Products"}</TabsTrigger>
            <TabsTrigger value="categories">{language === "ar" ? "الأقسام" : "Categories"}</TabsTrigger>
            <TabsTrigger value="variants">{language === "ar" ? "الألوان والمقاسات" : "Colors & Sizes"}</TabsTrigger>
            <TabsTrigger value="orders">{language === "ar" ? "الطلبات" : "Orders"}</TabsTrigger>
            <TabsTrigger value="messages">{language === "ar" ? "الرسائل" : "Messages"}</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">{language === "ar" ? "إدارة المنتجات" : "Manage Products"}</h2>
                <div className="text-sm text-muted-foreground">
                  {language === "ar" ? "إجمالي المنتجات:" : "Total Products:"} {products.length}
                </div>
              </div>

              {/* Add Product Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    {language === "ar" ? "إضافة منتج جديد" : "Add New Product"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {language === "ar" ? "الاسم (عربي) *" : "Name (Arabic) *"}
                      </label>
                      <Input
                        placeholder={language === "ar" ? "مثال: قميص رجالي" : "Example: Men's Shirt"}
                        value={newProduct.title_ar}
                        onChange={(e) => setNewProduct({ ...newProduct, title_ar: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {language === "ar" ? "الاسم (إنجليزي) - اختياري" : "Name (English) - Optional"}
                      </label>
                      <Input
                        placeholder={language === "ar" ? "مثال: Men's Shirt" : "Example: Men's Shirt"}
                        value={newProduct.title_en}
                        onChange={(e) => setNewProduct({ ...newProduct, title_en: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {language === "ar" ? "الوصف (عربي)" : "Description (Arabic)"}
                      </label>
                      <Textarea
                        placeholder={language === "ar" ? "وصف مفصل للمنتج..." : "Detailed product description..."}
                        value={newProduct.description_ar}
                        onChange={(e) => setNewProduct({ ...newProduct, description_ar: e.target.value })}
                        className="min-h-[100px]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {language === "ar" ? "الوصف (إنجليزي) - اختياري" : "Description (English) - Optional"}
                      </label>
                      <Textarea
                        placeholder={language === "ar" ? "وصف مفصل للمنتج..." : "Detailed product description..."}
                        value={newProduct.description_en}
                        onChange={(e) => setNewProduct({ ...newProduct, description_en: e.target.value })}
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {language === "ar" ? "السعر *" : "Price *"}
                      </label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={newProduct.price}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, price: Number.parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {language === "ar" ? "السعر القديم" : "Old Price"}
                      </label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={newProduct.old_price || ""}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            old_price: e.target.value ? Number.parseFloat(e.target.value) : null,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Category and Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {language === "ar" ? "القسم" : "Category"}
                      </label>
                      <Select
                        value={newProduct.category_id?.toString() || "none"}
                        onValueChange={(value) =>
                          setNewProduct({
                            ...newProduct,
                            category_id: value === "none" ? null : Number.parseInt(value),
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={language === "ar" ? "اختر القسم" : "Select Category"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{language === "ar" ? "بدون قسم" : "No Category"}</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category[`name_${language}`]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="in-stock"
                        checked={newProduct.in_stock}
                        onCheckedChange={(checked) => setNewProduct({ ...newProduct, in_stock: !!checked })}
                      />
                      <label htmlFor="in-stock" className="text-sm font-medium">
                        {language === "ar" ? "متوفر في المخزون" : "In Stock"}
                      </label>
                    </div>
                  </div>

                  {/* Product Images Upload */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === "ar" ? "صور المنتج *" : "Product Images *"}
                    </label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 hover:border-muted-foreground/50 transition-colors">
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                        <div className="mt-4">
                          <label htmlFor="product-images" className="cursor-pointer">
                            <span className="mt-2 block text-sm font-medium text-muted-foreground">
                              {language === "ar"
                                ? "اسحب الصور هنا أو انقر للاختيار"
                                : "Drag images here or click to select"}
                            </span>
                            <input
                              id="product-images"
                              type="file"
                              multiple
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(e.target.files)}
                              disabled={uploadingImage}
                            />
                          </label>
                          <Button
                            type="button"
                            variant="outline"
                            className="mt-2 bg-transparent"
                            onClick={() => document.getElementById("product-images")?.click()}
                            disabled={uploadingImage}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {uploadingImage
                              ? language === "ar"
                                ? "جاري الرفع..."
                                : "Uploading..."
                              : language === "ar"
                                ? "اختر الصور"
                                : "Choose Images"}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Image Previews */}
                    {previewImages.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                        {previewImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image || "/placeholder.svg"}
                              alt={`Preview ${index + 1}`}
                              className="w-full aspect-square object-cover rounded-md border"
                              loading="lazy"
                            />
                            <button
                              type="button"
                              onClick={() => removePreviewImage(index)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setMainImage(index)}
                              className={`absolute top-2 left-2 rounded-full p-1 transition-opacity ${
                                mainImageIndex === index
                                  ? "bg-yellow-500 text-white opacity-100"
                                  : "bg-gray-500 text-white opacity-0 group-hover:opacity-100"
                              }`}
                              title={language === "ar" ? "تعيين كصورة رئيسية" : "Set as main image"}
                            >
                              <Star className="w-4 h-4" />
                            </button>
                            {mainImageIndex === index && (
                              <div className="absolute bottom-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded">
                                {language === "ar" ? "رئيسية" : "Main"}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Colors Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{language === "ar" ? "الألوان" : "Colors"}</h3>

                    {/* Selected Colors */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {newVariants.colors.map((color, index) => (
                        <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded-md">
                          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: color.value }}></div>
                          <span>
                            {color.name_en} / {color.name_ar}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleRemoveColor(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Default Colors */}
                    {defaultColors.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">
                          {language === "ar" ? "الألوان المحفوظة:" : "Saved Colors:"}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {defaultColors.map((color) => (
                            <button
                              key={color.id}
                              type="button"
                              onClick={() => addColorFromDefaults(color)}
                              className="flex items-center gap-2 bg-background border rounded-md p-2 hover:bg-muted transition-colors"
                              title={language === "ar" ? "انقر للإضافة" : "Click to add"}
                            >
                              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color.value }}></div>
                              <span className="text-xs">{color[`name_${language}`]}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add New Color */}
                    {isAddingColor ? (
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Input
                          placeholder={language === "ar" ? "اسم اللون (عربي)" : "Color Name (Arabic)"}
                          value={newColor.name_ar}
                          onChange={(e) => setNewColor({ ...newColor, name_ar: e.target.value })}
                          className="flex-1 min-w-[150px]"
                        />
                        <Input
                          placeholder={
                            language === "ar" ? "اسم اللون (إنجليزي) - اختياري" : "Color Name (English) - Optional"
                          }
                          value={newColor.name_en}
                          onChange={(e) => setNewColor({ ...newColor, name_en: e.target.value })}
                          className="flex-1 min-w-[150px]"
                        />
                        <Input
                          type="color"
                          value={newColor.value}
                          onChange={(e) => setNewColor({ ...newColor, value: e.target.value })}
                          className="w-20"
                        />
                        <Button type="button" onClick={handleAddColor}>
                          {language === "ar" ? "إضافة" : "Add"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsAddingColor(false)}>
                          {language === "ar" ? "إلغاء" : "Cancel"}
                        </Button>
                      </div>
                    ) : (
                      <Button type="button" variant="outline" onClick={() => setIsAddingColor(true)}>
                        {language === "ar" ? "إضافة لون جديد" : "Add New Color"}
                      </Button>
                    )}
                  </div>

                  {/* Sizes Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{language === "ar" ? "المقاسات" : "Sizes"}</h3>

                    {/* Selected Sizes */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {newVariants.sizes.map((size, index) => (
                        <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded-md">
                          <span>
                            {size.value} ({size.name_en} / {size.name_ar})
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleRemoveSize(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Default Sizes */}
                    {defaultSizes.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">
                          {language === "ar" ? "المقاسات المحفوظة:" : "Saved Sizes:"}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {defaultSizes.map((size) => (
                            <button
                              key={size.id}
                              type="button"
                              onClick={() => addSizeFromDefaults(size)}
                              className="bg-background border rounded-md px-3 py-1 hover:bg-muted transition-colors text-xs"
                              title={language === "ar" ? "انقر للإضافة" : "Click to add"}
                            >
                              {size[`name_${language}`]}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add New Size */}
                    {isAddingSize ? (
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Input
                          placeholder={language === "ar" ? "اسم المقاس (عربي)" : "Size Name (Arabic)"}
                          value={newSize.name_ar}
                          onChange={(e) => setNewSize({ ...newSize, name_ar: e.target.value })}
                          className="flex-1 min-w-[150px]"
                        />
                        <Input
                          placeholder={
                            language === "ar" ? "اسم المقاس (إنجليزي) - اختياري" : "Size Name (English) - Optional"
                          }
                          value={newSize.name_en}
                          onChange={(e) => setNewSize({ ...newSize, name_en: e.target.value })}
                          className="flex-1 min-w-[150px]"
                        />
                        <Input
                          placeholder={language === "ar" ? "قيمة المقاس (مثل XL)" : "Size Value (e.g. XL)"}
                          value={newSize.value}
                          onChange={(e) => setNewSize({ ...newSize, value: e.target.value })}
                          className="flex-1 min-w-[100px]"
                        />
                        <Button type="button" onClick={handleAddSize}>
                          {language === "ar" ? "إضافة" : "Add"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsAddingSize(false)}>
                          {language === "ar" ? "إلغاء" : "Cancel"}
                        </Button>
                      </div>
                    ) : (
                      <Button type="button" variant="outline" onClick={() => setIsAddingSize(true)}>
                        {language === "ar" ? "إضافة مقاس جديد" : "Add New Size"}
                      </Button>
                    )}
                  </div>

                  <Button
                    onClick={handleAddProduct}
                    disabled={
                      isAddingProduct || !newProduct.title_ar || !newProduct.price || previewImages.length === 0
                    }
                    className="w-full"
                  >
                    {isAddingProduct ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {language === "ar" ? "جاري الإضافة..." : "Adding..."}
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        {language === "ar" ? "إضافة منتج" : "Add Product"}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Products List */}
              <div className="space-y-4">
                {products.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        📦
                      </div>
                      <p className="text-gray-500 text-lg">
                        {language === "ar" ? "لا توجد منتجات بعد" : "No products yet"}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  products.map((product) => (
                    <div key={product.id}>
                      {editingProduct && editingProduct.id === product.id ? (
                        <Card>
                          <CardContent className="p-6">
                            <div className="space-y-6">
                              {/* Edit Form - Removed image upload section */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium mb-2">
                                    {language === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}
                                  </label>
                                  <Input
                                    value={editingProduct.title_ar}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, title_ar: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-2">
                                    {language === "ar" ? "الاسم (إنجليزي)" : "Name (English)"}
                                  </label>
                                  <Input
                                    value={editingProduct.title_en}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, title_en: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-2">
                                    {language === "ar" ? "الوصف (عربي)" : "Description (Arabic)"}
                                  </label>
                                  <Textarea
                                    value={editingProduct.description_ar}
                                    onChange={(e) =>
                                      setEditingProduct({ ...editingProduct, description_ar: e.target.value })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-2">
                                    {language === "ar" ? "الوصف (إنجليزي)" : "Description (English)"}
                                  </label>
                                  <Textarea
                                    value={editingProduct.description_en}
                                    onChange={(e) =>
                                      setEditingProduct({ ...editingProduct, description_en: e.target.value })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-2">
                                    {language === "ar" ? "السعر" : "Price"}
                                  </label>
                                  <Input
                                    type="number"
                                    value={editingProduct.price}
                                    onChange={(e) =>
                                      setEditingProduct({
                                        ...editingProduct,
                                        price: Number.parseFloat(e.target.value) || 0,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-2">
                                    {language === "ar" ? "السعر القديم" : "Old Price"}
                                  </label>
                                  <Input
                                    type="number"
                                    value={editingProduct.old_price || ""}
                                    onChange={(e) =>
                                      setEditingProduct({
                                        ...editingProduct,
                                        old_price: e.target.value ? Number.parseFloat(e.target.value) : null,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-2">
                                    {language === "ar" ? "القسم" : "Category"}
                                  </label>
                                  <Select
                                    value={editingProduct.category_id?.toString() || "none"}
                                    onValueChange={(value) =>
                                      setEditingProduct({
                                        ...editingProduct,
                                        category_id: value === "none" ? null : Number.parseInt(value),
                                      })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder={language === "ar" ? "اختر القسم" : "Select Category"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">
                                        {language === "ar" ? "بدون قسم" : "No Category"}
                                      </SelectItem>
                                      {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id.toString()}>
                                          {category[`name_${language}`]}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`edit-in-stock-${product.id}`}
                                    checked={editingProduct.in_stock}
                                    onCheckedChange={(checked) =>
                                      setEditingProduct({ ...editingProduct, in_stock: !!checked })
                                    }
                                  />
                                  <label htmlFor={`edit-in-stock-${product.id}`} className="text-sm font-medium">
                                    {language === "ar" ? "متوفر في المخزون" : "In Stock"}
                                  </label>
                                </div>
                              </div>

                              {/* Edit Colors Section */}
                              <div>
                                <h3 className="text-lg font-semibold mb-2">
                                  {language === "ar" ? "الألوان" : "Colors"}
                                </h3>

                                {/* Selected Colors */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {editingVariants.colors.map((color, index) => (
                                    <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded-md">
                                      <div
                                        className="w-6 h-6 rounded-full"
                                        style={{ backgroundColor: color.value }}
                                      ></div>
                                      <span>
                                        {color.name_en} / {color.name_ar}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() => handleRemoveEditColor(index)}
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>

                                {/* Default Colors */}
                                {defaultColors.length > 0 && (
                                  <div className="mb-4">
                                    <h4 className="text-sm font-medium mb-2">
                                      {language === "ar" ? "الألوان المحفوظة:" : "Saved Colors:"}
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                      {defaultColors.map((color) => (
                                        <button
                                          key={color.id}
                                          type="button"
                                          onClick={() => addEditColorFromDefaults(color)}
                                          className="flex items-center gap-2 bg-background border rounded-md p-2 hover:bg-muted transition-colors"
                                          title={language === "ar" ? "انقر للإضافة" : "Click to add"}
                                        >
                                          <div
                                            className="w-4 h-4 rounded-full"
                                            style={{ backgroundColor: color.value }}
                                          ></div>
                                          <span className="text-xs">{color[`name_${language}`]}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Add New Color */}
                                {isEditingColor ? (
                                  <div className="flex flex-wrap gap-2 mb-4">
                                    <Input
                                      placeholder={language === "ar" ? "اسم اللون (عربي)" : "Color Name (Arabic)"}
                                      value={editColor.name_ar}
                                      onChange={(e) => setEditColor({ ...editColor, name_ar: e.target.value })}
                                      className="flex-1 min-w-[150px]"
                                    />
                                    <Input
                                      placeholder={
                                        language === "ar"
                                          ? "اسم اللون (إنجليزي) - اختياري"
                                          : "Color Name (English) - Optional"
                                      }
                                      value={editColor.name_en}
                                      onChange={(e) => setEditColor({ ...editColor, name_en: e.target.value })}
                                      className="flex-1 min-w-[150px]"
                                    />
                                    <Input
                                      type="color"
                                      value={editColor.value}
                                      onChange={(e) => setEditColor({ ...editColor, value: e.target.value })}
                                      className="w-20"
                                    />
                                    <Button type="button" onClick={handleAddEditColor}>
                                      {language === "ar" ? "إضافة" : "Add"}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => setIsEditingColor(false)}>
                                      {language === "ar" ? "إلغاء" : "Cancel"}
                                    </Button>
                                  </div>
                                ) : (
                                  <Button type="button" variant="outline" onClick={() => setIsEditingColor(true)}>
                                    {language === "ar" ? "إضافة لون جديد" : "Add New Color"}
                                  </Button>
                                )}
                              </div>

                              {/* Edit Sizes Section */}
                              <div>
                                <h3 className="text-lg font-semibold mb-2">
                                  {language === "ar" ? "المقاسات" : "Sizes"}
                                </h3>

                                {/* Selected Sizes */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {editingVariants.sizes.map((size, index) => (
                                    <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded-md">
                                      <span>
                                        {size.value} ({size.name_en} / {size.name_ar})
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() => handleRemoveEditSize(index)}
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>

                                {/* Default Sizes */}
                                {defaultSizes.length > 0 && (
                                  <div className="mb-4">
                                    <h4 className="text-sm font-medium mb-2">
                                      {language === "ar" ? "المقاسات المحفوظة:" : "Saved Sizes:"}
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                      {defaultSizes.map((size) => (
                                        <button
                                          key={size.id}
                                          type="button"
                                          onClick={() => addEditSizeFromDefaults(size)}
                                          className="bg-background border rounded-md px-3 py-1 hover:bg-muted transition-colors text-xs"
                                          title={language === "ar" ? "انقر للإضافة" : "Click to add"}
                                        >
                                          {size[`name_${language}`]}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Add New Size */}
                                {isEditingSize ? (
                                  <div className="flex flex-wrap gap-2 mb-4">
                                    <Input
                                      placeholder={language === "ar" ? "اسم المقاس (عربي)" : "Size Name (Arabic)"}
                                      value={editSize.name_ar}
                                      onChange={(e) => setEditSize({ ...editSize, name_ar: e.target.value })}
                                      className="flex-1 min-w-[150px]"
                                    />
                                    <Input
                                      placeholder={
                                        language === "ar"
                                          ? "اسم المقاس (إنجليزي) - اختياري"
                                          : "Size Name (English) - Optional"
                                      }
                                      value={editSize.name_en}
                                      onChange={(e) => setEditSize({ ...editSize, name_en: e.target.value })}
                                      className="flex-1 min-w-[150px]"
                                    />
                                    <Input
                                      placeholder={language === "ar" ? "قيمة المقاس (مثل XL)" : "Size Value (e.g. XL)"}
                                      value={editSize.value}
                                      onChange={(e) => setEditSize({ ...editSize, value: e.target.value })}
                                      className="flex-1 min-w-[100px]"
                                    />
                                    <Button type="button" onClick={handleAddEditSize}>
                                      {language === "ar" ? "إضافة" : "Add"}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => setIsEditingSize(false)}>
                                      {language === "ar" ? "إلغاء" : "Cancel"}
                                    </Button>
                                  </div>
                                ) : (
                                  <Button type="button" variant="outline" onClick={() => setIsEditingSize(true)}>
                                    {language === "ar" ? "إضافة مقاس جديد" : "Add New Size"}
                                  </Button>
                                )}
                              </div>

                              <div className="flex gap-2">
                                <Button onClick={handleSaveProductEdit} disabled={isSavingProduct} className="flex-1">
                                  {isSavingProduct ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      {language === "ar" ? "جاري الحفظ..." : "Saving..."}
                                    </>
                                  ) : (
                                    <>
                                      <Save className="w-4 h-4 mr-2" />
                                      {language === "ar" ? "حفظ التعديلات" : "Save Changes"}
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setEditingProduct(null)
                                    setEditingVariants({ colors: [], sizes: [] })
                                  }}
                                >
                                  {language === "ar" ? "إلغاء" : "Cancel"}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <ProductCard
                          product={product}
                          language={language}
                          categories={categories}
                          productImages={productImages}
                          productVariants={productVariants}
                          onEdit={handleEditProduct}
                          onDelete={handleDeleteProduct}
                          onManageImages={handleManageImages}
                          getCategoryName={getCategoryName}
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">{language === "ar" ? "إدارة الأقسام" : "Manage Categories"}</h2>
                <div className="text-sm text-muted-foreground">
                  {language === "ar" ? "إجمالي الأقسام:" : "Total Categories:"} {categories.length}
                </div>
              </div>

              {/* Add Category Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    {language === "ar" ? "إضافة قسم جديد" : "Add New Category"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {language === "ar" ? "الاسم (عربي) *" : "Name (Arabic) *"}
                      </label>
                      <Input
                        placeholder={language === "ar" ? "مثال: ملابس رجالية" : "Example: Men's Clothing"}
                        value={newCategory.name_ar}
                        onChange={(e) => setNewCategory({ ...newCategory, name_ar: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {language === "ar" ? "الاسم (إنجليزي) - اختياري" : "Name (English) - Optional"}
                      </label>
                      <Input
                        placeholder={language === "ar" ? "مثال: ملابس رجالية" : "Example: Men's Clothing"}
                        value={newCategory.name_en}
                        onChange={(e) => setNewCategory({ ...newCategory, name_en: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleAddCategory}
                    disabled={isAddingCategory || !newCategory.name_ar}
                    className="w-full"
                  >
                    {isAddingCategory ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {language === "ar" ? "جاري الإضافة..." : "Adding..."}
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        {language === "ar" ? "إضافة قسم" : "Add Category"}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Categories List */}
              <div className="space-y-4">
                {categories.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        📂
                      </div>
                      <p className="text-gray-500 text-lg">
                        {language === "ar" ? "لا توجد أقسام بعد" : "No categories yet"}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  categories.map((category) => (
                    <Card key={category.id}>
                      <CardContent className="p-6">
                        {editingCategory && editingCategory.id === category.id ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  {language === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}
                                </label>
                                <Input
                                  value={editingCategory.name_ar}
                                  onChange={(e) => setEditingCategory({ ...editingCategory, name_ar: e.target.value })}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  {language === "ar" ? "الاسم (إنجليزي)" : "Name (English)"}
                                </label>
                                <Input
                                  value={editingCategory.name_en}
                                  onChange={(e) => setEditingCategory({ ...editingCategory, name_en: e.target.value })}
                                />
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button onClick={handleSaveCategoryEdit} disabled={isSavingCategory} className="flex-1">
                                {isSavingCategory ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {language === "ar" ? "جاري الحفظ..." : "Saving..."}
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-4 h-4 mr-2" />
                                    {language === "ar" ? "حفظ التعديلات" : "Save Changes"}
                                  </>
                                )}
                              </Button>
                              <Button variant="outline" onClick={() => setEditingCategory(null)}>
                                {language === "ar" ? "إلغاء" : "Cancel"}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="text-xl font-semibold">{category[`name_${language}`]}</h3>
                              <p className="text-sm text-gray-500">
                                {language === "ar" ? "المنتجات:" : "Products:"}{" "}
                                {products.filter((p) => p.category_id === category.id).length}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditCategory(category)}>
                                <Edit className="w-4 h-4 mr-2" />
                                {language === "ar" ? "تعديل" : "Edit"}
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                {language === "ar" ? "حذف" : "Delete"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* Variants Tab - New Tab for managing default colors and sizes */}
          <TabsContent value="variants">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">
                  {language === "ar" ? "إدارة الألوان والمقاسات الافتراضية" : "Manage Default Colors & Sizes"}
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Default Colors Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      {language === "ar" ? "الألوان الافتراضية" : "Default Colors"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Add New Default Color */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-3">
                        <Input
                          placeholder={language === "ar" ? "اسم اللون (عربي)" : "Color Name (Arabic)"}
                          value={newDefaultColor.name_ar}
                          onChange={(e) => setNewDefaultColor({ ...newDefaultColor, name_ar: e.target.value })}
                        />
                        <Input
                          placeholder={
                            language === "ar" ? "اسم اللون (إنجليزي) - اختياري" : "Color Name (English) - Optional"
                          }
                          value={newDefaultColor.name_en}
                          onChange={(e) => setNewDefaultColor({ ...newDefaultColor, name_en: e.target.value })}
                        />
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={newDefaultColor.value}
                            onChange={(e) => setNewDefaultColor({ ...newDefaultColor, value: e.target.value })}
                            className="w-20"
                          />
                          <Button onClick={handleAddDefaultColor} className="flex-1">
                            <Plus className="w-4 h-4 mr-2" />
                            {language === "ar" ? "إضافة لون" : "Add Color"}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Default Colors List */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {defaultColors.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          {language === "ar" ? "لا توجد ألوان افتراضية" : "No default colors"}
                        </p>
                      ) : (
                        defaultColors.map((color) => (
                          <div key={color.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: color.value }}></div>
                              <span>{color[`name_${language}`]}</span>
                            </div>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteDefaultColor(color.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              {language === "ar" ? "حذف" : "Delete"}
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Default Sizes Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Ruler className="w-5 h-5" />
                      {language === "ar" ? "المقاسات الافتراضية" : "Default Sizes"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Add New Default Size */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-3">
                        <Input
                          placeholder={language === "ar" ? "اسم المقاس (عربي)" : "Size Name (Arabic)"}
                          value={newDefaultSize.name_ar}
                          onChange={(e) => setNewDefaultSize({ ...newDefaultSize, name_ar: e.target.value })}
                        />
                        <Input
                          placeholder={
                            language === "ar" ? "اسم المقاس (إنجليزي) - اختياري" : "Size Name (English) - Optional"
                          }
                          value={newDefaultSize.name_en}
                          onChange={(e) => setNewDefaultSize({ ...newDefaultSize, name_en: e.target.value })}
                        />
                        <div className="flex gap-2">
                          <Input
                            placeholder={language === "ar" ? "قيمة المقاس (مثل XL)" : "Size Value (e.g. XL)"}
                            value={newDefaultSize.value}
                            onChange={(e) => setNewDefaultSize({ ...newDefaultSize, value: e.target.value })}
                            className="flex-1"
                          />
                          <Button onClick={handleAddDefaultSize}>
                            <Plus className="w-4 h-4 mr-2" />
                            {language === "ar" ? "إضافة مقاس" : "Add Size"}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Default Sizes List */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {defaultSizes.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          {language === "ar" ? "لا توجد مقاسات افتراضية" : "No default sizes"}
                        </p>
                      ) : (
                        defaultSizes.map((size) => (
                          <div key={size.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="bg-background border rounded px-2 py-1 text-sm">{size.value}</span>
                              <span>{size[`name_${language}`]}</span>
                            </div>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteDefaultSize(size.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              {language === "ar" ? "حذف" : "Delete"}
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">{language === "ar" ? "إدارة الطلبات" : "Manage Orders"}</h2>
                <div className="text-sm text-muted-foreground">
                  {language === "ar" ? "إجمالي الطلبات:" : "Total Orders:"} {orders.length}
                </div>
              </div>

              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">{language === "ar" ? "البحث" : "Search"}</label>
                      <Input
                        placeholder={
                          language === "ar"
                            ? "البحث بالاسم، الهاتف، أو رقم الطلب..."
                            : "Search by name, phone, or order number..."
                        }
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {language === "ar" ? "تصفية حسب الحالة" : "Filter by Status"}
                      </label>
                      <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder={language === "ar" ? "جميع الحالات" : "All Statuses"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{language === "ar" ? "جميع الحالات" : "All Statuses"}</SelectItem>
                          <SelectItem value="pending">{language === "ar" ? "قيد الانتظار" : "Pending"}</SelectItem>
                          <SelectItem value="processing">
                            {language === "ar" ? "قيد المعالجة" : "Processing"}
                          </SelectItem>
                          <SelectItem value="shipped">{language === "ar" ? "تم الشحن" : "Shipped"}</SelectItem>
                          <SelectItem value="delivered">{language === "ar" ? "تم التوصيل" : "Delivered"}</SelectItem>
                          <SelectItem value="cancelled">{language === "ar" ? "ملغي" : "Cancelled"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Orders List */}
              <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        📋
                      </div>
                      <p className="text-gray-500 text-lg">
                        {orderSearch || orderStatusFilter !== "all"
                          ? language === "ar"
                            ? "لا توجد طلبات تطابق البحث"
                            : "No orders match your search"
                          : language === "ar"
                            ? "لا توجد طلبات بعد"
                            : "No orders yet"}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      language={language}
                      orderItems={orderItems}
                      onUpdateStatus={handleUpdateOrderStatus}
                      onViewDetails={(order) => setSelectedOrder(order)}
                      getOrderStatusBadge={getOrderStatusBadge}
                      getColorName={getColorName}
                    />
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">{language === "ar" ? "إدارة الرسائل" : "Manage Messages"}</h2>
                <div className="text-sm text-muted-foreground">
                  {language === "ar" ? "إجمالي الرسائل:" : "Total Messages:"} {messages.length}
                </div>
              </div>

              {/* Messages List */}
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        💬
                      </div>
                      <p className="text-gray-500 text-lg">
                        {language === "ar" ? "لا توجد رسائل بعد" : "No messages yet"}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  messages.map((message) => (
                    <Card key={message.id}>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-xl font-semibold">{message.subject}</h3>
                              <p className="text-sm text-gray-500">
                                {language === "ar" ? "من:" : "From:"} {message.name} ({message.email})
                              </p>
                              <p className="text-sm text-gray-500">
                                {language === "ar" ? "التاريخ:" : "Date:"}{" "}
                                {new Date(message.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteMessage(message.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              {language === "ar" ? "حذف" : "Delete"}
                            </Button>
                          </div>
                          <div className="bg-muted p-4 rounded-lg">
                            <p className="whitespace-pre-wrap">{message.message}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === "ar" ? "تفاصيل الطلب" : "Order Details"} #{selectedOrder?.order_number || selectedOrder?.id}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">
                    {language === "ar" ? "معلومات العميل" : "Customer Information"}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>{language === "ar" ? "الاسم:" : "Name:"}</strong> {selectedOrder.full_name}
                    </p>
                    <p>
                      <strong>{language === "ar" ? "الهاتف:" : "Phone:"}</strong> {selectedOrder.phone}
                    </p>
                    <p>
                      <strong>{language === "ar" ? "العنوان:" : "Address:"}</strong> {selectedOrder.state},{" "}
                      {selectedOrder.city}
                    </p>
                    {selectedOrder.notes && (
                      <p>
                        <strong>{language === "ar" ? "ملاحظات:" : "Notes:"}</strong> {selectedOrder.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{language === "ar" ? "معلومات الطلب" : "Order Information"}</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>{language === "ar" ? "رقم الطلب:" : "Order Number:"}</strong>{" "}
                      {selectedOrder.order_number || `#${selectedOrder.id}`}
                    </p>
                    <p>
                      <strong>{language === "ar" ? "تاريخ الطلب:" : "Order Date:"}</strong>{" "}
                      {new Date(selectedOrder.created_at).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>{language === "ar" ? "نوع التوصيل:" : "Delivery Type:"}</strong>{" "}
                      {selectedOrder.delivery_type === "home"
                        ? language === "ar"
                          ? "توصيل منزلي"
                          : "Home Delivery"
                        : language === "ar"
                          ? "استلام من المكتب"
                          : "Office Pickup"}
                    </p>
                    <p>
                      <strong>{language === "ar" ? "رسوم التوصيل:" : "Delivery Fee:"}</strong> DA{" "}
                      {selectedOrder.delivery_fee.toLocaleString()}
                    </p>
                    <p>
                      <strong>{language === "ar" ? "الحالة:" : "Status:"}</strong>{" "}
                      {getOrderStatusBadge(selectedOrder.status)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-4">{language === "ar" ? "المنتجات المطلوبة" : "Order Items"}</h3>
                <div className="space-y-3">
                  {orderItems[selectedOrder.id]?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-4 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{item.product_title}</p>
                        <div className="text-sm text-muted-foreground">
                          {item.color && (
                            <span>
                              {language === "ar" ? "اللون:" : "Color:"} {getColorName(item.color) || item.color}
                            </span>
                          )}
                          {item.color && item.size && " • "}
                          {item.size && (
                            <span>
                              {language === "ar" ? "المقاس:" : "Size:"} {item.size}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {item.quantity} × DA {item.product_price.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          DA {(item.quantity * item.product_price).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>{language === "ar" ? "المبلغ الإجمالي:" : "Total Amount:"}</span>
                  <span>DA {selectedOrder.total_amount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Management Dialog */}
      <Dialog open={isManagingImages} onOpenChange={setIsManagingImages}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === "ar" ? "إدارة صور المنتج" : "Manage Product Images"} -{" "}
              {selectedProduct?.[`title_${language}`]}
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6">
              {/* Current Images */}
              <div>
                <h3 className="font-semibold mb-4">{language === "ar" ? "الصور الحالية" : "Current Images"}</h3>
                {productImages[selectedProduct.id] && productImages[selectedProduct.id].length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {productImages[selectedProduct.id].map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.image_url || "/placeholder.svg"}
                          alt={selectedProduct[`title_${language}`]}
                          className="w-full aspect-square object-cover rounded-md border"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center gap-2">
                          {!image.is_main && (
                            <Button
                              size="sm"
                              onClick={() => handleSetMainImage(image.id, selectedProduct.id)}
                              className="bg-yellow-500 hover:bg-yellow-600"
                            >
                              <Star className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteProductImage(image.id, selectedProduct.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        {image.is_main && (
                          <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                            {language === "ar" ? "رئيسية" : "Main"}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {language === "ar" ? "لا توجد صور لهذا المنتج" : "No images for this product"}
                  </p>
                )}
              </div>

              {/* Add New Images Section */}
              <div>
                <h3 className="font-semibold mb-4">{language === "ar" ? "إضافة صور جديدة" : "Add New Images"}</h3>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 hover:border-muted-foreground/50 transition-colors">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div className="mt-4">
                      <label htmlFor="add-product-images" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-muted-foreground">
                          {language === "ar"
                            ? "اسحب الصور هنا أو انقر للاختيار"
                            : "Drag images here or click to select"}
                        </span>
                        <input
                          id="add-product-images"
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleAddProductImages(e.target.files, selectedProduct?.id)}
                          disabled={uploadingImage}
                        />
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-2 bg-transparent"
                        onClick={() => document.getElementById("add-product-images")?.click()}
                        disabled={uploadingImage}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadingImage
                          ? language === "ar"
                            ? "جاري الرفع..."
                            : "Uploading..."
                          : language === "ar"
                            ? "اختر الصور"
                            : "Choose Images"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
