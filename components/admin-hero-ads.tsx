"use client"

import type React from "react"
import { useState, useCallback, useMemo } from "react"
import useSWR from "swr"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { Trash2, Plus, Loader2, Eye, EyeOff, Upload, ImageIcon, Video } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface HeroAd {
  id: number
  title_ar: string
  title_en: string | null
  description_ar: string | null
  description_en: string | null
  media_type: "image" | "video"
  media_url: string
  is_active: boolean
  auto_play: boolean
  loop_video: boolean
  sort_order: number
  created_at: string
}

const fetcher = async () => {
  const { data, error } = await supabase.from("hero_ads").select("*").order("sort_order", { ascending: true })
  if (error) throw error
  return data as HeroAd[]
}

export function AdminHeroAds() {
  const { language } = useLanguage()

  const {
    data: ads = [],
    error,
    isLoading,
    mutate,
  } = useSWR<HeroAd[]>("hero_ads", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
  })

  const [isAdding, setIsAdding] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [adToDelete, setAdToDelete] = useState<number | null>(null)

  const [newAd, setNewAd] = useState({
    media_type: "image" as "image" | "video",
    media_url: "",
    is_active: true,
    auto_play: false,
    loop_video: false,
  })

  const [previewMedia, setPreviewMedia] = useState("")

  const activeAdsCount = useMemo(() => ads.filter((ad) => ad.is_active).length, [ads])

  const convertFileToBase64 = useCallback(
    async (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        if (file.size > 5 * 1024 * 1024) {
          reject(
            new Error(language === "ar" ? "حجم الملف كبير جداً (الحد الأقصى 5 ميجابايت)" : "File too large (max 5MB)"),
          )
          return
        }

        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error(language === "ar" ? "فشل قراءة الملف" : "Failed to read file"))
        reader.readAsDataURL(file)
      })
    },
    [language],
  )

  const handleMediaUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      setUploadingMedia(true)

      try {
        const base64 = await convertFileToBase64(file)
        setPreviewMedia(base64)
        setNewAd({ ...newAd, media_url: base64 })

        toast({
          title: language === "ar" ? "✓ تم رفع الملف" : "✓ Media uploaded",
          description: language === "ar" ? "تم رفع الملف بنجاح" : "Media uploaded successfully",
        })
      } catch (error) {
        console.error("[v0] Error uploading media:", error)
        toast({
          title: language === "ar" ? "خطأ في رفع الملف" : "Upload Error",
          description:
            error instanceof Error
              ? error.message
              : language === "ar"
                ? "حدث خطأ أثناء رفع الملف"
                : "An error occurred while uploading",
          variant: "destructive",
        })
      } finally {
        setUploadingMedia(false)
      }
    },
    [convertFileToBase64, newAd, language],
  )

  const handleAddAd = useCallback(async () => {
    if (!newAd.media_url) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "يرجى رفع صورة أو فيديو" : "Please upload an image or video",
        variant: "destructive",
      })
      return
    }

    setIsAdding(true)

    try {
      if (newAd.is_active) {
        await supabase.from("hero_ads").update({ is_active: false }).neq("id", 0)
      }

      const adToAdd = {
        title_ar: "",
        title_en: "",
        description_ar: "",
        description_en: "",
        media_type: newAd.media_type,
        media_url: newAd.media_url,
        is_active: newAd.is_active,
        auto_play: newAd.auto_play,
        loop_video: newAd.loop_video,
        sort_order: ads.length,
      }

      const { data, error } = await supabase.from("hero_ads").insert([adToAdd]).select().single()

      if (error) throw error

      await mutate()

      setNewAd({
        media_type: "image",
        media_url: "",
        is_active: true,
        auto_play: false,
        loop_video: false,
      })
      setPreviewMedia("")

      toast({
        title: language === "ar" ? "✓ تم إضافة الإعلان" : "✓ Ad Added",
        description: language === "ar" ? "تم إضافة الإعلان بنجاح" : "Ad has been added successfully",
      })
    } catch (error) {
      console.error("[v0] Error adding ad:", error)
      toast({
        title: language === "ar" ? "خطأ في إضافة الإعلان" : "Error Adding Ad",
        description:
          error instanceof Error
            ? error.message
            : language === "ar"
              ? "حدث خطأ غير متوقع"
              : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsAdding(false)
    }
  }, [newAd, ads.length, language, mutate])

  const handleDeleteAd = useCallback(
    async (id: number) => {
      try {
        const { error } = await supabase.from("hero_ads").delete().eq("id", id)

        if (error) throw error

        await mutate()

        toast({
          title: language === "ar" ? "✓ تم حذف الإعلان" : "✓ Ad Deleted",
          description: language === "ar" ? "تم حذف الإعلان بنجاح" : "Ad has been deleted successfully",
        })
      } catch (error) {
        console.error("[v0] Error deleting ad:", error)
        toast({
          title: language === "ar" ? "خطأ في حذف الإعلان" : "Error Deleting Ad",
          description:
            error instanceof Error
              ? error.message
              : language === "ar"
                ? "حدث خطأ غير متوقع"
                : "An unexpected error occurred",
          variant: "destructive",
        })
      } finally {
        setDeleteDialogOpen(false)
        setAdToDelete(null)
      }
    },
    [language, mutate],
  )

  const handleToggleActive = useCallback(
    async (id: number, isActive: boolean) => {
      // Optimistic update - update UI immediately
      const optimisticAds = ads.map((ad) => ({
        ...ad,
        is_active: isActive && ad.id === id ? true : ad.id === id ? false : isActive ? false : ad.is_active,
      }))
      mutate(optimisticAds, false)

      try {
        // Deactivate all other ads if activating this one
        if (isActive) {
          await supabase.from("hero_ads").update({ is_active: false }).neq("id", id)
        }

        // Update the target ad
        const { error } = await supabase.from("hero_ads").update({ is_active: isActive }).eq("id", id)

        if (error) throw error

        // Revalidate to ensure consistency
        await mutate()

        toast({
          title: language === "ar" ? "✓ تم التحديث" : "✓ Updated",
          description: language === "ar" ? "تم تحديث حالة الإعلان" : "Ad status updated",
        })
      } catch (error) {
        // Revert on error
        await mutate()
        console.error("[v0] Error toggling ad status:", error)
        toast({
          title: language === "ar" ? "خطأ" : "Error",
          description:
            error instanceof Error
              ? error.message
              : language === "ar"
                ? "حدث خطأ غير متوقع"
                : "An unexpected error occurred",
          variant: "destructive",
        })
      }
    },
    [ads, language, mutate],
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        </div>
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-10 bg-muted animate-pulse rounded" />
            <div className="h-10 bg-muted animate-pulse rounded" />
            <div className="h-32 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold">
              {language === "ar" ? "خطأ في تحميل الإعلانات" : "Error Loading Ads"}
            </h3>
            <p className="text-muted-foreground">{error.message}</p>
            <Button onClick={() => mutate()} variant="outline">
              {language === "ar" ? "إعادة المحاولة" : "Retry"}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{language === "ar" ? "إعلانات الصفحة الرئيسية" : "Hero Ads"}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {language === "ar"
              ? `${ads.length} إعلان • ${activeAdsCount} نشط`
              : `${ads.length} ads • ${activeAdsCount} active`}
          </p>
        </div>
      </div>

      {/* Add New Ad Form */}
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            {language === "ar" ? "إضافة إعلان جديد" : "Add New Ad"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-base font-semibold">{language === "ar" ? "نوع الوسائط" : "Media Type"}</Label>
              <Select
                value={newAd.media_type}
                onValueChange={(value: "image" | "video") => setNewAd({ ...newAd, media_type: value })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      {language === "ar" ? "صورة" : "Image"}
                    </div>
                  </SelectItem>
                  <SelectItem value="video">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      {language === "ar" ? "فيديو" : "Video"}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-base font-semibold">{language === "ar" ? "رفع الوسائط" : "Upload Media"}</Label>
              <div className="relative">
                <Input
                  type="file"
                  accept={newAd.media_type === "image" ? "image/*" : "video/*"}
                  onChange={handleMediaUpload}
                  disabled={uploadingMedia}
                  className="h-11"
                />
                {uploadingMedia && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-md">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {language === "ar" ? "الحد الأقصى: 5 ميجابايت" : "Max size: 5MB"}
              </p>
            </div>
          </div>

          {newAd.media_type === "video" && (
            <div className="flex gap-6 p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center gap-3">
                <Switch
                  checked={newAd.auto_play}
                  onCheckedChange={(checked) => setNewAd({ ...newAd, auto_play: checked })}
                  id="autoplay-new"
                />
                <Label htmlFor="autoplay-new" className="cursor-pointer">
                  {language === "ar" ? "تشغيل تلقائي" : "Auto Play"}
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={newAd.loop_video}
                  onCheckedChange={(checked) => setNewAd({ ...newAd, loop_video: checked })}
                  id="loop-new"
                />
                <Label htmlFor="loop-new" className="cursor-pointer">
                  {language === "ar" ? "إعادة الفيديو" : "Loop Video"}
                </Label>
              </div>
            </div>
          )}

          {previewMedia && (
            <div className="space-y-2">
              <Label className="text-base font-semibold">{language === "ar" ? "معاينة" : "Preview"}</Label>
              <div className="relative rounded-xl overflow-hidden border-2 border-primary/20 bg-muted/30">
                {newAd.media_type === "image" ? (
                  <img
                    src={previewMedia || "/placeholder.svg"}
                    alt="Preview"
                    className="w-full max-h-96 object-contain"
                  />
                ) : (
                  <video src={previewMedia} controls className="w-full max-h-96" />
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <Switch
              checked={newAd.is_active}
              onCheckedChange={(checked) => setNewAd({ ...newAd, is_active: checked })}
              id="active-new"
            />
            <Label htmlFor="active-new" className="cursor-pointer flex-1">
              <span className="font-semibold">{language === "ar" ? "نشط" : "Active"}</span>
              <span className="text-sm text-muted-foreground block mt-1">
                {language === "ar"
                  ? "سيتم إلغاء تنشيط الإعلانات الأخرى تلقائياً"
                  : "Other ads will be deactivated automatically"}
              </span>
            </Label>
          </div>

          <Button onClick={handleAddAd} disabled={isAdding || !newAd.media_url} className="w-full h-12" size="lg">
            {isAdding ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {language === "ar" ? "جاري الإضافة..." : "Adding..."}
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                {language === "ar" ? "إضافة إعلان" : "Add Ad"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Ads List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            {language === "ar" ? "الإعلانات الحالية" : "Current Ads"}
            <Badge variant="secondary" className="text-sm">
              {ads.length}
            </Badge>
          </h3>
        </div>

        {ads.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-4 text-muted-foreground">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 opacity-20" />
                </div>
                <div>
                  <p className="text-lg font-medium">{language === "ar" ? "لا توجد إعلانات حالياً" : "No ads yet"}</p>
                  <p className="text-sm mt-1">
                    {language === "ar" ? "ابدأ بإضافة إعلان جديد" : "Start by adding a new ad"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ads.map((ad) => (
              <Card
                key={ad.id}
                className={`overflow-hidden transition-all hover:shadow-xl ${
                  ad.is_active ? "ring-2 ring-primary shadow-lg" : ""
                }`}
              >
                <CardContent className="p-0">
                  <div className="relative h-56 bg-muted group">
                    {ad.media_type === "image" ? (
                      <img
                        src={ad.media_url || "/placeholder.svg"}
                        alt="Ad media"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <video src={ad.media_url} className="w-full h-full object-cover" />
                    )}

                    {/* Status Badge Overlay */}
                    <div className="absolute top-3 right-3 flex gap-2">
                      <Badge variant={ad.is_active ? "default" : "secondary"} className="shadow-lg backdrop-blur-sm">
                        {ad.is_active ? (
                          <>
                            <Eye className="w-3 h-3 mr-1" />
                            {language === "ar" ? "نشط" : "Active"}
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 mr-1" />
                            {language === "ar" ? "غير نشط" : "Inactive"}
                          </>
                        )}
                      </Badge>
                      <Badge variant="outline" className="bg-background/90 backdrop-blur-sm shadow-lg">
                        {ad.media_type === "image" ? (
                          <ImageIcon className="w-3 h-3 mr-1" />
                        ) : (
                          <Video className="w-3 h-3 mr-1" />
                        )}
                        {ad.media_type === "image"
                          ? language === "ar"
                            ? "صورة"
                            : "Image"
                          : language === "ar"
                            ? "فيديو"
                            : "Video"}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {ad.media_type === "video" && (
                      <div className="flex gap-4 text-xs text-muted-foreground pb-3 border-b">
                        <span className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${ad.auto_play ? "bg-green-500" : "bg-gray-300"}`} />
                          {language === "ar" ? "تشغيل تلقائي" : "Auto Play"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${ad.loop_video ? "bg-green-500" : "bg-gray-300"}`} />
                          {language === "ar" ? "إعادة" : "Loop"}
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant={ad.is_active ? "default" : "outline"}
                        onClick={() => handleToggleActive(ad.id, !ad.is_active)}
                        className="w-full"
                      >
                        {ad.is_active ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-2" />
                            {language === "ar" ? "إلغاء" : "Deactivate"}
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            {language === "ar" ? "تنشيط" : "Activate"}
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setAdToDelete(ad.id)
                          setDeleteDialogOpen(true)
                        }}
                        className="w-full"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {language === "ar" ? "حذف" : "Delete"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "ar" ? "هل أنت متأكد من حذف هذا الإعلان؟" : "Are you sure you want to delete this ad?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "ar"
                ? "لا يمكن التراجع عن هذا الإجراء. سيتم حذف الإعلان نهائياً."
                : "This action cannot be undone. The ad will be permanently deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === "ar" ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => adToDelete && handleDeleteAd(adToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === "ar" ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
