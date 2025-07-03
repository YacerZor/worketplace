"use client"

import { motion } from "framer-motion"
import { useLanguage } from "@/components/language-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Truck, CreditCard, Zap, Shield } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: {
      ar: "شحن سريع",
      en: "Fast Shipping",
    },
    description: {
      ar: "شحن فوري، آمن، وموثوق.",
      en: "Instant, safe, and reliable shipping.",
    },
  },
  {
    icon: Shield,
    title: {
      ar: "ضمان الجودة",
      en: "Quality Guarantee",
    },
    description: {
      ar: "نضمن جودة جميع منتجاتنا.",
      en: "We guarantee the quality of all our products.",
    },
  },
  {
    icon: CreditCard,
    title: {
      ar: "دفع آمن",
      en: "Secure Payment",
    },
    description: {
      ar: "دفع عند الاستلام آمن ومضمون",
      en: "Safe and guaranteed cash on delivery",
    },
  },
  {
    icon: Truck,
    title: {
      ar: "تغطية شاملة",
      en: "Complete Coverage",
    },
    description: {
      ar: "نوصل إلى جميع الولايات في الجزائر",
      en: "We deliver to all states in Algeria",
    },
  },
]

export function Features() {
  const { language } = useLanguage()

  return (
    <section className="py-24 bg-secondary/50 dark:bg-secondary/10">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1 mb-4 border border-primary/30 text-primary rounded-full text-sm uppercase tracking-wider font-medium">
              {language === "ar" ? "لماذا تختارنا" : "Why Choose Us"}
            </span>
            <h2 className="text-4xl font-bold mb-6">
              {language === "ar" ? "مميزاتنا" : "Our"}
              <span className="gold-text"> {language === "ar" ? "الحصرية" : "Features"}</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {language === "ar"
                ? "نقدم لك تجربة تسوق استثنائية مع مجموعة من المميزات الحصرية"
                : "We offer you an exceptional shopping experience with a set of exclusive features"}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="border-primary/10 bg-card hover:border-primary/30 transition-colors duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="mx-auto w-16 h-16 flex items-center justify-center bg-primary/10 rounded-full mb-4">
                      <feature.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title[language]}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description[language]}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
