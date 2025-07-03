"use client"

import { motion } from "framer-motion"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CTA() {
  const { language } = useLanguage()

  return (
    <section className="py-24 bg-primary relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/path/to/pattern.png')] opacity-10 mix-blend-overlay"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center text-primary-foreground">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {language === "ar" ? "احصل على خصم 20% على أول طلب لك" : "Get 20% Off Your First Order"}
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto text-primary-foreground/90">
              {language === "ar"
                ? "اشترك في نشرتنا الإخبارية واحصل على خصم 20% على أول طلب لك. لا تفوت هذا العرض المحدود!"
                : "Subscribe to our newsletter and get 20% off your first order. Don't miss this limited time offer!"}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <input
                type="email"
                placeholder={language === "ar" ? "بريدك الإلكتروني" : "Your email address"}
                className="px-4 py-3 rounded-lg text-foreground bg-background w-full sm:w-64 md:w-80"
              />
              <Button
                size="lg"
                variant="secondary"
                className="bg-background text-foreground hover:bg-background/90 transition-colors duration-300"
              >
                {language === "ar" ? "اشترك الآن" : "Subscribe Now"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
