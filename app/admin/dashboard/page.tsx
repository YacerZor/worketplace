"use client"

import { useState, useEffect, useCallback } from "react"
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
import { Loader2, Plus, Save, X, Edit, Trash2, Eye, ImageIcon, Upload, Star, ArrowLeft, Menu } from "lucide-react"
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
  const [editPreviewImages, setEditPreviewImages] = useState<string[]>([])
  const [mainImageIndex, setMainImageIndex] = useState(0)
  const [editMainImageIndex, setEditMainImageIndex] = useState(0)

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

  // Search and filter states
  const [orderSearch, setOrderSearch] = useState("")
  const [orderStatusFilter, setOrderStatusFilter] = useState("all")

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

      await Promise.all([fetchProducts(), fetchCategories(), fetchOrders(), fetchMessages()])
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

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

  const fetchProductVariants = async (productId: number) => {
    try {
      const { data, error } = await supabase.from("product_variants").select("*").eq("product_id", productId)

      if (error) throw error
      setProductVariants((prev) => ({ ...prev, [productId]: data || [] }))
    } catch (error) {
      console.error("Error fetching product variants:", error)
    }
  }

  const fetchProductImages = async (productId: number) => {
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
  }

  const fetchCategories = async () => {
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
  }

  const fetchOrders = async () => {
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
  }

  const fetchOrderItems = async (orderId: number) => {
    try {
      const { data, error } = await supabase.from("order_items").select("*").eq("order_id", orderId)

      if (error) throw error
      setOrderItems((prev) => ({ ...prev, [orderId]: data || [] }))
    } catch (error) {
      console.error("Error fetching order items:", error)
    }
  }

  const fetchMessages = async () => {
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
  }

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

  const handleImageUpload = async (files: FileList | null, isEdit = false) => {
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

      if (isEdit) {
        setEditPreviewImages((prev) => [...prev, ...newImages])
      } else {
        setPreviewImages((prev) => [...prev, ...newImages])
      }

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
  }

  const removePreviewImage = (index: number, isEdit = false) => {
    if (isEdit) {
      setEditPreviewImages((prev) => prev.filter((_, i) => i !== index))
      if (editMainImageIndex === index) {
        setEditMainImageIndex(0)
      } else if (editMainImageIndex > index) {
        setEditMainImageIndex(editMainImageIndex - 1)
      }
    } else {
      setPreviewImages((prev) => prev.filter((_, i) => i !== index))
      if (mainImageIndex === index) {
        setMainImageIndex(0)
      } else if (mainImageIndex > index) {
        setMainImageIndex(mainImageIndex - 1)
      }
    }
  }

  const setMainImage = (index: number, isEdit = false) => {
    if (isEdit) {
      setEditMainImageIndex(index)
    } else {
      setMainImageIndex(index)
    }
  }

  // Optimized product functions
  const handleAddProduct = async () => {
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
  }

  const handleEditProduct = (product: Product) => {
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

    // Load existing images
    const existingImages = productImages[product.id] || []
    setEditPreviewImages(existingImages.map((img) => img.image_url))

    const mainImageIdx = existingImages.findIndex((img) => img.is_main)
    setEditMainImageIndex(mainImageIdx >= 0 ? mainImageIdx : 0)
  }

  const handleSaveProductEdit = async () => {
    if (!editingProduct) return

    if (editPreviewImages.length === 0) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description:
          language === "ar" ? "يجب أن يحتوي المنتج على صورة واحدة على الأقل" : "Product must have at least one image",
        variant: "destructive",
      })
      return
    }

    setIsSavingProduct(true)

    try {
      const mainImage = editPreviewImages[editMainImageIndex]

      const formattedProduct = {
        ...editingProduct,
        title_en: editingProduct.title_en || editingProduct.title_ar,
        description_en: editingProduct.description_en || editingProduct.description_ar,
        image: mainImage,
        price: Number(editingProduct.price),
        old_price: editingProduct.old_price ? Number(editingProduct.old_price) : null,
        rating: Number(editingProduct.rating),
      }

      // Prepare all operations
      const imagesToInsert = editPreviewImages.map((url, index) => ({
        product_id: editingProduct.id,
        image_url: url,
        is_main: index === editMainImageIndex,
        sort_order: index,
      }))

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
        supabase.from("product_images").delete().eq("product_id", editingProduct.id),
        supabase.from("product_variants").delete().eq("product_id", editingProduct.id),
      ]

      await Promise.all(operations)

      // Insert new data in parallel
      const insertOperations = []
      if (imagesToInsert.length > 0) {
        insertOperations.push(supabase.from("product_images").insert(imagesToInsert))
      }
      if (variantsToInsert.length > 0) {
        insertOperations.push(supabase.from("product_variants").insert(variantsToInsert))
      }

      await Promise.all(insertOperations)

      // Optimistic update
      setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? formattedProduct : p)))
      setProductImages((prev) => ({
        ...prev,
        [editingProduct.id]: imagesToInsert.map((img, index) => ({
          id: Date.now() + index,
          product_id: editingProduct.id,
          image_url: img.image_url,
          is_main: img.is_main,
          sort_order: img.sort_order,
        })),
      }))

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
      setEditPreviewImages([])
      setEditMainImageIndex(0)
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
  }

  const handleDeleteProduct = async (id: number) => {
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
  }

  // Category functions
  const handleAddCategory = async () => {
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
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
  }

  const handleSaveCategoryEdit = async () => {
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
  }

  const handleDeleteCategory = async (id: number) => {
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
  }

  // Variant functions
  const handleAddColor = () => {
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
  }

  const handleAddSize = () => {
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
  }

  const handleRemoveColor = (index: number) => {
    setNewVariants((prev) => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index),
    }))
  }

  const handleRemoveSize = (index: number) => {
    setNewVariants((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index),
    }))
  }

  const handleAddEditColor = () => {
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
  }

  const handleAddEditSize = () => {
    if (editSize.name_ar && editSize.value) {
      const sizeToAdd = {
        ...editSize,
        name_en: editSize.name_en || editSize.name_ar,
      }
      setEditingVariants((prev) => ({
        ...prev,
        sizes: [...prev.sizes, sizeToAdd],
      }))
      setEditSize({ name_ar: "", name_en: "", value: "" })
      setIsEditingSize(false)
    }
  }

  const handleRemoveEditColor = (index: number) => {
    setEditingVariants((prev) => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index),
    }))
  }

  const handleRemoveEditSize = (index: number) => {
    setEditingVariants((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index),
    }))
  }

  // Order functions
  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
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
  }

  // Message functions
  const handleDeleteMessage = async (id: number) => {
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
  }

  // Image management functions
  const handleManageImages = (product: Product) => {
    setSelectedProduct(product)
    setIsManagingImages(true)
  }

  const handleSetMainImage = async (imageId: number, productId: number) => {
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
  }

  const handleDeleteProductImage = async (imageId: number, productId: number) => {
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
  }

  // Utility functions
  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return language === "ar" ? "بدون قسم" : "No Category"
    const category = categories.find((cat) => cat.id === categoryId)
    return category ? category[`name_${language}`] : language === "ar" ? "بدون قسم" : "No Category"
  }

  const getOrderStatusBadge = (status: string) => {
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
  }

  const getColorName = (colorValue: string | null) => {
    if (!colorValue) return null

    for (const product of products) {
      const variants = productVariants[product.id] || []
      const colorVariant = variants.find((variant) => variant.variant_type === "color" && variant.value === colorValue)
      if (colorVariant) {
        return colorVariant[`name_${language}`]
      }
    }

    return colorValue
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.full_name.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.phone.includes(orderSearch) ||
      order.order_number?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.id.toString().includes(orderSearch)

    const matchesStatus = orderStatusFilter === "all" || order.status === orderStatusFilter

    return matchesSearch && matchesStatus
  })

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/admin")
  }

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
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

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
                        {language === "ar" ? "إضافة لون" : "Add Color"}
                      </Button>
                    )}
                  </div>

                  {/* Sizes Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{language === "ar" ? "المقاسات" : "Sizes"}</h3>
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
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

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
                        {language === "ar" ? "إضافة مقاس" : "Add Size"}
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
                    <Card key={product.id}>
                      <CardContent className="p-6">
                        {editingProduct && editingProduct.id === product.id ? (
                          <div className="space-y-6">
                            {/* Edit Form */}
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

                            {/* Edit Images Upload */}
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                {language === "ar" ? "صور المنتج" : "Product Images"}
                              </label>
                              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 hover:border-muted-foreground/50 transition-colors">
                                <div className="text-center">
                                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                                  <div className="mt-4">
                                    <label htmlFor={`edit-product-images-${product.id}`} className="cursor-pointer">
                                      <span className="mt-2 block text-sm font-medium text-muted-foreground">
                                        {language === "ar"
                                          ? "اسحب الصور هنا أو انقر للاختيار"
                                          : "Drag images here or click to select"}
                                      </span>
                                      <input
                                        id={`edit-product-images-${product.id}`}
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleImageUpload(e.target.files, true)}
                                        disabled={uploadingImage}
                                      />
                                    </label>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="mt-2 bg-transparent"
                                      onClick={() =>
                                        document.getElementById(`edit-product-images-${product.id}`)?.click()
                                      }
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

                              {/* Edit Image Previews */}
                              {editPreviewImages.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                                  {editPreviewImages.map((image, index) => (
                                    <div key={index} className="relative group">
                                      <img
                                        src={image || "/placeholder.svg"}
                                        alt={`Preview ${index + 1}`}
                                        className="w-full aspect-square object-cover rounded-md border"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removePreviewImage(index, true)}
                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setMainImage(index, true)}
                                        className={`absolute top-2 left-2 rounded-full p-1 transition-opacity ${
                                          editMainImageIndex === index
                                            ? "bg-yellow-500 text-white opacity-100"
                                            : "bg-gray-500 text-white opacity-0 group-hover:opacity-100"
                                        }`}
                                        title={language === "ar" ? "تعيين كصورة رئيسية" : "Set as main image"}
                                      >
                                        <Star className="w-4 h-4" />
                                      </button>
                                      {editMainImageIndex === index && (
                                        <div className="absolute bottom-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded">
                                          {language === "ar" ? "رئيسية" : "Main"}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Edit Colors Section */}
                            <div>
                              <h3 className="text-lg font-semibold mb-2">{language === "ar" ? "الألوان" : "Colors"}</h3>
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
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>

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
                                  {language === "ar" ? "إضافة لون" : "Add Color"}
                                </Button>
                              )}
                            </div>

                            {/* Edit Sizes Section */}
                            <div>
                              <h3 className="text-lg font-semibold mb-2">{language === "ar" ? "المقاسات" : "Sizes"}</h3>
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
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>

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
                                  {language === "ar" ? "إضافة مقاس" : "Add Size"}
                                </Button>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <Button
                                onClick={handleSaveProductEdit}
                                disabled={isSavingProduct || editPreviewImages.length === 0}
                                className="flex-1"
                              >
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
                                  setEditPreviewImages([])
                                  setEditMainImageIndex(0)
                                }}
                              >
                                {language === "ar" ? "إلغاء" : "Cancel"}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Product Image */}
                            <div className="md:col-span-1">
                              <img
                                src={product.image || "/placeholder.svg"}
                                alt={product[`title_${language}`]}
                                className="w-full aspect-square object-cover rounded-lg"
                              />
                            </div>

                            {/* Product Info */}
                            <div className="md:col-span-2 space-y-2">
                              <h3 className="text-xl font-semibold">{product[`title_${language}`]}</h3>
                              <p className="text-gray-600">{product[`description_${language}`]}</p>
                              <div className="flex items-center gap-3">
                                <span className="text-lg font-bold">DA {product.price.toLocaleString()}</span>
                                {product.old_price && (
                                  <span className="text-gray-500 line-through">
                                    DA {product.old_price.toLocaleString()}
                                  </span>
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
                                  <h4 className="font-medium mb-2">
                                    {language === "ar" ? "صور المنتج:" : "Product Images:"}
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {productImages[product.id].map((image) => (
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
                                        />
                                        {image.is_main && (
                                          <div className="absolute bottom-0 left-0 right-0 bg-primary/70 text-white text-[8px] text-center">
                                            {language === "ar" ? "رئيسية" : "Main"}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Product Variants */}
                              {productVariants[product.id] && productVariants[product.id].length > 0 && (
                                <div className="mt-4">
                                  <h4 className="font-medium mb-2">
                                    {language === "ar" ? "الخيارات المتاحة:" : "Available Options:"}
                                  </h4>

                                  {/* Colors */}
                                  {productVariants[product.id].filter((v) => v.variant_type === "color").length > 0 && (
                                    <div className="mb-2">
                                      <span className="text-sm font-medium">
                                        {language === "ar" ? "الألوان:" : "Colors:"}
                                      </span>
                                      <div className="flex flex-wrap gap-2 mt-1">
                                        {productVariants[product.id]
                                          .filter((v) => v.variant_type === "color")
                                          .map((color) => (
                                            <div key={color.id} className="flex items-center gap-1">
                                              <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: color.value }}
                                              ></div>
                                              <span className="text-xs">{color[`name_${language}`]}</span>
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Sizes */}
                                  {productVariants[product.id].filter((v) => v.variant_type === "size").length > 0 && (
                                    <div>
                                      <span className="text-sm font-medium">
                                        {language === "ar" ? "المقاسات:" : "Sizes:"}
                                      </span>
                                      <div className="flex flex-wrap gap-2 mt-1">
                                        {productVariants[product.id]
                                          .filter((v) => v.variant_type === "size")
                                          .map((size) => (
                                            <span key={size.id} className="text-xs bg-muted px-2 py-1 rounded">
                                              {size[`name_${language}`]}
                                            </span>
                                          ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Product Actions */}
                            <div className="md:col-span-3 flex justify-end gap-2 mt-4">
                              <Button variant="outline" size="sm" onClick={() => handleManageImages(product)}>
                                <ImageIcon className="w-4 h-4 mr-2" />
                                {language === "ar" ? "إدارة الصور" : "Manage Images"}
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}>
                                <Edit className="w-4 h-4 mr-2" />
                                {language === "ar" ? "تعديل" : "Edit"}
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.id)}>
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

          {/* Orders Tab */}
          <TabsContent value="orders">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">{language === "ar" ? "إدارة الطلبات" : "Manage Orders"}</h2>
                <div className="text-sm text-muted-foreground">
                  {language === "ar" ? "إجمالي الطلبات:" : "Total Orders:"} {filteredOrders.length}
                </div>
              </div>

              {/* Search and Filter */}
              <Card>
                <CardHeader>
                  <CardTitle>{language === "ar" ? "البحث والفلترة" : "Search & Filter"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder={language === "ar" ? "البحث في الطلبات..." : "Search orders..."}
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                    />
                    <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === "ar" ? "فلترة حسب الحالة" : "Filter by Status"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{language === "ar" ? "جميع الحالات" : "All Status"}</SelectItem>
                        <SelectItem value="pending">{language === "ar" ? "قيد الانتظار" : "Pending"}</SelectItem>
                        <SelectItem value="processing">{language === "ar" ? "قيد المعالجة" : "Processing"}</SelectItem>
                        <SelectItem value="shipped">{language === "ar" ? "تم الشحن" : "Shipped"}</SelectItem>
                        <SelectItem value="delivered">{language === "ar" ? "تم التوصيل" : "Delivered"}</SelectItem>
                        <SelectItem value="cancelled">{language === "ar" ? "ملغي" : "Cancelled"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Orders List */}
              <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        🛒
                      </div>
                      <p className="text-gray-500 text-lg">
                        {orderSearch || orderStatusFilter !== "all"
                          ? language === "ar"
                            ? "لا توجد طلبات تطابق معايير البحث"
                            : "No orders match the search criteria"
                          : language === "ar"
                            ? "لا توجد طلبات بعد"
                            : "No orders yet"}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredOrders.map((order) => (
                    <Card key={order.id}>
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
                              {language === "ar" ? "المبلغ الإجمالي:" : "Total Amount:"} DA{" "}
                              {order.total_amount.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">
                              {language === "ar" ? "تاريخ الطلب:" : "Order Date:"}{" "}
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>

                          {/* Order Actions */}
                          <div className="md:col-span-1 space-y-2">
                            <Select
                              value={order.status}
                              onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={language === "ar" ? "تغيير الحالة" : "Change Status"} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">
                                  {language === "ar" ? "قيد الانتظار" : "Pending"}
                                </SelectItem>
                                <SelectItem value="processing">
                                  {language === "ar" ? "قيد المعالجة" : "Processing"}
                                </SelectItem>
                                <SelectItem value="shipped">{language === "ar" ? "تم الشحن" : "Shipped"}</SelectItem>
                                <SelectItem value="delivered">
                                  {language === "ar" ? "تم التوصيل" : "Delivered"}
                                </SelectItem>
                                <SelectItem value="cancelled">{language === "ar" ? "ملغي" : "Cancelled"}</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                              className="w-full"
                            >
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
                                {orderItems[order.id].map((item) => (
                                  <div key={item.id} className="flex justify-between items-center p-2 bg-muted rounded">
                                    <div>
                                      <p className="font-medium">{item.product_title}</p>
                                      <div className="text-sm text-muted-foreground">
                                        {item.color && (
                                          <span>
                                            {language === "ar" ? "اللون:" : "Color:"}{" "}
                                            {getColorName(item.color) || item.color}
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
                          )}
                        </div>
                      </CardContent>
                    </Card>
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
                        ✉️
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
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold mb-2">{message.subject}</h3>
                            <p className="text-gray-600 mb-2">
                              {language === "ar" ? "من:" : "From:"} {message.name} ({message.email})
                            </p>
                            <p className="text-gray-700 mb-4">{message.message}</p>
                            <p className="text-sm text-gray-500">
                              {language === "ar" ? "تاريخ الرسالة:" : "Message Date:"}{" "}
                              {new Date(message.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteMessage(message.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            {language === "ar" ? "حذف" : "Delete"}
                          </Button>
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

      {/* Image Management Dialog */}
      <Dialog open={isManagingImages} onOpenChange={setIsManagingImages}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {language === "ar"
                ? `إدارة صور المنتج: ${selectedProduct?.[`title_${language}`]}`
                : `Manage Images for: ${selectedProduct?.[`title_${language}`]}`}
            </DialogTitle>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4">
              {/* Upload new images */}
              <div>
                <label htmlFor="manage-images-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 hover:border-muted-foreground/50 transition-colors">
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        {language === "ar" ? "انقر لإضافة صور جديدة" : "Click to add new images"}
                      </p>
                    </div>
                  </div>
                  <input
                    id="manage-images-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      // Handle adding new images to existing product
                      if (e.target.files && e.target.files.length > 0) {
                        const files = Array.from(e.target.files)
                        files.forEach(async (file) => {
                          try {
                            const base64 = await convertFileToBase64(file)
                            const currentImages = productImages[selectedProduct.id] || []
                            const maxSortOrder =
                              currentImages.length > 0 ? Math.max(...currentImages.map((img) => img.sort_order)) : -1

                            const { error } = await supabase.from("product_images").insert([
                              {
                                product_id: selectedProduct.id,
                                image_url: base64,
                                is_main: currentImages.length === 0,
                                sort_order: maxSortOrder + 1,
                              },
                            ])

                            if (error) throw error
                            await fetchProductImages(selectedProduct.id)
                          } catch (error) {
                            console.error("Error adding image:", error)
                            toast({
                              title: language === "ar" ? "خطأ في إضافة الصورة" : "Error adding image",
                              description: error.message,
                              variant: "destructive",
                            })
                          }
                        })
                      }
                    }}
                    disabled={uploadingImage}
                  />
                </label>
              </div>

              {/* Existing images */}
              {productImages[selectedProduct.id] && productImages[selectedProduct.id].length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {productImages[selectedProduct.id].map((image) => (
                    <div
                      key={image.id}
                      className={`relative group border-2 rounded-lg overflow-hidden ${
                        image.is_main ? "border-primary" : "border-border"
                      }`}
                    >
                      <img
                        src={image.image_url || "/placeholder.svg"}
                        alt={selectedProduct[`title_${language}`]}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant={image.is_main ? "default" : "secondary"}
                          onClick={() => handleSetMainImage(image.id, selectedProduct.id)}
                          disabled={image.is_main}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteProductImage(image.id, selectedProduct.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {image.is_main && (
                        <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded">
                          {language === "ar" ? "رئيسية" : "Main"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {language === "ar" ? "تفاصيل الطلب" : "Order Details"}:{" "}
              {selectedOrder?.order_number || `#${selectedOrder?.id}`}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{language === "ar" ? "الاسم الكامل" : "Full Name"}</p>
                  <p className="font-medium">{selectedOrder.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === "ar" ? "رقم الهاتف" : "Phone Number"}</p>
                  <p className="font-medium">{selectedOrder.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === "ar" ? "الولاية" : "State"}</p>
                  <p className="font-medium">{selectedOrder.state}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === "ar" ? "المدينة" : "City"}</p>
                  <p className="font-medium">{selectedOrder.city}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === "ar" ? "نوع التوصيل" : "Delivery Type"}</p>
                  <p className="font-medium">
                    {selectedOrder.delivery_type === "home"
                      ? language === "ar"
                        ? "توصيل للمنزل"
                        : "Home Delivery"
                      : language === "ar"
                        ? "استلام من المكتب"
                        : "Office Pickup"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === "ar" ? "رسوم التوصيل" : "Delivery Fee"}</p>
                  <p className="font-medium">DA {selectedOrder.delivery_fee.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === "ar" ? "المبلغ الإجمالي" : "Total Amount"}
                  </p>
                  <p className="font-medium text-lg">DA {selectedOrder.total_amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === "ar" ? "حالة الطلب" : "Order Status"}</p>
                  <div className="mt-1">{getOrderStatusBadge(selectedOrder.status)}</div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">{language === "ar" ? "ملاحظات" : "Notes"}</p>
                  <p className="font-medium">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Order Items */}
              {orderItems[selectedOrder.id] && orderItems[selectedOrder.id].length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">{language === "ar" ? "المنتجات المطلوبة" : "Ordered Items"}</h4>
                  <div className="space-y-2">
                    {orderItems[selectedOrder.id].map((item) => (
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
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "تاريخ الطلب:" : "Order Date:"}{" "}
                  {new Date(selectedOrder.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
