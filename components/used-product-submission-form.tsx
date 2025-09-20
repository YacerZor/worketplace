"use client"

import type React from "react"
import { useState } from "react"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Upload, X, Loader2, Plus, GripVertical, Check } from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"

interface UsedProductSubmissionFormProps {
  open: boolean
  onClose: () => void
}

export function UsedProductSubmissionForm({ open, onClose }: UsedProductSubmissionFormProps) {
  const { language } = useLanguage()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    phone: "",
  })
  const [images, setImages] = useState<string[]>([])

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      img.onload = () => {
        const maxWidth = 800
        const maxHeight = 800
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
        const base64 = canvas.toDataURL("image/jpeg", 0.8)
        resolve(base64)
      }

      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploadingImage(true)
    try {
      const newImages: string[] = []

      for (let i = 0; i < Math.min(files.length, 5 - images.length); i++) {
        const file = files[i]
        if (file.type.startsWith("image/")) {
          const base64Image = await convertFileToBase64(file)
          newImages.push(base64Image)
        }
      }

      setImages((prev) => [...prev, ...newImages])

      if (newImages.length > 0) {
        toast({
          title: language === "ar" ? "تم رفع الصور" : "Images uploaded",
          description: language === "ar" ? "تم رفع الصور بنجاح" : "Images uploaded successfully",
        })
      }
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

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(images)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setImages(items)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.description || !formData.price || !formData.phone || images.length === 0) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description:
          language === "ar"
            ? "يرجى ملء جميع الحقول المطلوبة ورفع صورة واحدة على الأقل"
            : "Please fill all required fields and upload at least one image",
        variant: "destructive",
      })
      return
    }

    const price = Number.parseFloat(formData.price)
    if (isNaN(price) || price <= 0) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "يرجى إدخال سعر صالح" : "Please enter a valid price",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/submit-used-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title_ar: formData.title,
          title_en: formData.title,
          description_ar: formData.description,
          description_en: formData.description,
          price: price,
          phone: formData.phone,
          image: images[0], // Main image is the first one
          images: images, // All images for future use
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit product")
      }

      // Show beautiful success message
      toast({
        title: language === "ar" ? "🎉 تم إرسال منتجك بنجاح!" : "🎉 Product Submitted Successfully!",
        description:
          language === "ar"
            ? "شكراً لك! تم إرسال منتجك المستعمل بنجاح. سيتم مراجعته من قبل فريقنا خلال 24 ساعة وسنقوم بإشعارك فور الموافقة عليه. نقدر ثقتك بنا! 💖"
            : "Thank you! Your used product has been submitted successfully. Our team will review it within 24 hours and notify you once it's approved. We appreciate your trust! 💖",
        className: "bg-green-50 border-green-200 text-green-800",
      })

      // Reset form
      setFormData({
        title: "",
        description: "",
        price: "",
        phone: "",
      })
      setImages([])
      onClose()
    } catch (error) {
      console.error("Error submitting product:", error)
      toast({
        title: language === "ar" ? "خطأ في إرسال المنتج" : "Error submitting product",
        description:
          language === "ar" ? "حدث خطأ أثناء إرسال المنتج" : "An error occurred while submitting the product",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {language === "ar" ? "إضافة منتج مستعمل" : "List a Used Product"}
          </DialogTitle>
          <p className="text-center text-muted-foreground">
            {language === "ar"
              ? "أضف منتجك المستعمل وسنساعدك في بيعه"
              : "Add your used product and we'll help you sell it"}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Images */}
          <div className="space-y-4">
            <label className="block text-lg font-semibold">
              {language === "ar" ? "صور المنتج *" : "Product Images *"}
              <span className="text-sm font-normal text-muted-foreground ml-2">({images.length}/5)</span>
            </label>

            {/* Image Upload Area */}
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 hover:border-muted-foreground/50 transition-colors">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {language === "ar" ? "اسحب الصور هنا أو انقر للاختيار" : "Drag images here or click to select"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === "ar" ? "يمكنك رفع حتى 5 صور" : "You can upload up to 5 images"}
                  </p>
                  <label htmlFor="product-images" className="cursor-pointer">
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-2 bg-transparent"
                      disabled={uploadingImage || images.length >= 5}
                      onClick={() => document.getElementById("product-images")?.click()}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {uploadingImage
                        ? language === "ar"
                          ? "جاري الرفع..."
                          : "Uploading..."
                        : language === "ar"
                          ? "اختر صور"
                          : "Choose Images"}
                    </Button>
                    <input
                      id="product-images"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleImageUpload(e.target.files)}
                      disabled={uploadingImage || images.length >= 5}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Image Preview with Drag & Drop */}
            {images.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {language === "ar" ? "اسحب لإعادة ترتيب الصور" : "Drag to reorder images"}
                </p>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="images" direction="horizontal">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4"
                      >
                        {images.map((image, index) => (
                          <Draggable key={index} draggableId={index.toString()} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`relative group aspect-square rounded-lg overflow-hidden border-2 ${
                                  index === 0 ? "border-primary" : "border-border"
                                } ${snapshot.isDragging ? "shadow-lg" : ""}`}
                              >
                                <img
                                  src={image || "/placeholder.svg"}
                                  alt={`Product ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />

                                {/* Main Image Badge */}
                                {index === 0 && (
                                  <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    {language === "ar" ? "رئيسية" : "Main"}
                                  </div>
                                )}

                                {/* Drag Handle */}
                                <div
                                  {...provided.dragHandleProps}
                                  className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
                                >
                                  <GripVertical className="w-3 h-3" />
                                </div>

                                {/* Remove Button */}
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute bottom-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => removeImage(index)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === "ar" ? "اسم المنتج *" : "Product Name *"}
                </label>
                <Input
                  placeholder={language === "ar" ? "مثال: هاتف آيفون مستعمل" : "Example: Used iPhone"}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === "ar" ? "السعر المطلوب (دج) *" : "Asking Price (DA) *"}
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === "ar" ? "رقم الهاتف *" : "Phone Number *"}
                </label>
                <Input
                  type="tel"
                  placeholder={language === "ar" ? "مثال: 0555123456" : "Example: 0555123456"}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {language === "ar" ? "وصف المنتج *" : "Product Description *"}
              </label>
              <Textarea
                placeholder={
                  language === "ar"
                    ? "اكتب وصفاً مفصلاً عن المنتج وحالته..."
                    : "Write a detailed description of the product and its condition..."
                }
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[150px] resize-none"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              {language === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {language === "ar" ? "جاري الإرسال..." : "Submitting..."}
                </>
              ) : language === "ar" ? (
                "إرسال المنتج"
              ) : (
                "Submit Product"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
