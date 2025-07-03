"use client"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import { ArrowRight } from "lucide-react"

export function Hero() {
  const { language } = useLanguage()

  return (
    <section className="relative pt-32 pb-24 min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover bg-center opacity-20 dark:opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/20"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex-1 text-center lg:text-right"
            >
              <span className="inline-block px-4 py-1 mb-4 border border-primary/30 text-primary rounded-full text-sm uppercase tracking-wider font-medium">
                {language === "ar" ? "مجموعة جديدة" : "New Collection"}
              </span>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
                {language === "ar" ? "أناقة" : "Elegance"}
                <span className="gold-text"> {language === "ar" ? "لا مثيل لها" : "Redefined"}</span>
              </h1>

              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mr-0">
                {language === "ar"
                  ? "اكتشف مجموعتنا الجديدة من الملابس الفاخرة المصممة لتعكس أناقتك وتميزك. تصاميم عصرية بلمسات كلاسيكية تناسب جميع المناسبات."
                  : "Discover our new collection of luxury clothing designed to reflect your elegance and distinction. Modern designs with classic touches suitable for all occasions."}
              </p>

              <div className="flex flex-wrap justify-center lg:justify-end gap-4">
                <Button
                  size="lg"
                  className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 transform hover:scale-105"
                  asChild
                >
                  <a href="/shop">
                    {language === "ar" ? "تسوق الآن" : "Shop Now"}
                    <ArrowRight className="w-5 h-5" />
                  </a>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 border-primary text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 transform hover:scale-105"
                  asChild
                >
                  <a href="#featured-products">{language === "ar" ? "استكشف المجموعات" : "Explore Collections"}</a>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex-1"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-primary/10 rounded-3xl blur-3xl"></div>
                <img
                  src="https://i.imgur.com/RO1JnpQ.png"
                  alt={language === "ar" ? "صورة الموديل" : "Model Image"}
                  className="relative w-full max-w-md mx-auto transform hover:scale-105 transition-transform duration-300 hover:drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
