"use client"

import { motion } from "framer-motion"
import { useLanguage } from "@/components/language-provider"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Youtube, Play, Clock } from "lucide-react"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface Video {
  id: number
  youtube_id: string
  title_ar: string
  title_en: string
  description_ar: string
  description_en: string
  thumbnail: string
  duration: string
  views: string
}

export function YouTubeVideos() {
  const { language } = useLanguage()
  const [videos, setVideos] = useState<Video[]>([])

  useEffect(() => {
    async function fetchVideos() {
      const { data, error } = await supabase.from("videos").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching videos:", error)
      } else {
        setVideos(data || [])
      }
    }

    fetchVideos()
  }, [])

  return (
    <section id="youtube-videos" className="py-24 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-blue-50/50 to-white/50 dark:from-blue-950/50 dark:to-gray-950/50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.1)_0%,transparent_100%)]" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge
            variant="outline"
            className="px-4 py-1 mb-4 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400"
          >
            {language === "ar" ? "تعلم صناعة الألعاب" : "Learn Game Development"}
          </Badge>
          <h2 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
            {language === "ar" ? "أحدث الدروس التعليمية" : "Latest Tutorials"}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {language === "ar"
              ? "شاهد أحدث الدروس والنصائح حول تطوير الألعاب"
              : "Watch our latest tutorials and tips on game development"}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {videos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="group relative overflow-hidden bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm border-2 border-blue-200/50 dark:border-blue-800/50 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-blue-400/5" />
                <div className="relative p-6">
                  <div className="relative aspect-video rounded-lg overflow-hidden mb-6 group-hover:transform group-hover:scale-105 transition-transform duration-300">
                    <img
                      src={video.thumbnail || `https://img.youtube.com/vi/${video.youtube_id}/maxresdefault.jpg`}
                      alt={video[`title_${language}`]}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Play className="w-6 h-6 fill-current" />
                      </Button>
                    </div>
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded-md text-white text-sm flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {video.duration}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors">
                    {video[`title_${language}`]}
                  </h3>

                  <p className="text-muted-foreground text-sm mb-4">{video[`description_${language}`]}</p>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {video.views} {language === "ar" ? "مشاهدة" : "views"}
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <Button size="lg" className="group relative overflow-hidden" asChild>
            <a
              href="https://youtube.com/@CAIL_DEV"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400" />
              <span className="relative flex items-center gap-2 text-white group-hover:scale-105 transition-transform">
                <Youtube className="w-5 h-5" />
                {language === "ar" ? "اشترك في القناة" : "Subscribe to Channel"}
              </span>
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
