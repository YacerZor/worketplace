"use client"

import { useLanguage } from "@/components/language-provider"
import { FaFacebook, FaTelegram, FaInstagram } from "react-icons/fa"
import { FaTiktok } from "react-icons/fa6"

const socialLinks = [
  {
    name: "Facebook",
    icon: FaFacebook,
    url: "https://m.facebook.com/share/LMBFkZD6KqBibauH/?mibextid=qi2Omg&wtsid=rdr_0goQUjfsoCUT7vK6x#",
  },
  {
    name: "Telegram",
    icon: FaTelegram,
    url: "https://t.me/profiter_location",
  },
  {
    name: "Instagram",
    icon: FaInstagram,
    url: "https://www.instagram.com/styleislem?igsh=NW9rNjdna2xoNDRk",
  },
  {
    name: "TikTok",
    icon: FaTiktok,
    url: "https://www.tiktok.com/@style.islem?_t=ZM-8xQ9NF3lmoH&_r=1",
  },
]

export function Footer() {
  const { language } = useLanguage()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4">
        {/* Main Footer */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/design-mode-images/ufgqHwx%281%29-7gpQV3Sal0AXKMVDDWbNA0McmTao5I.jpeg"
                alt="WORKET PLACE Logo"
                className="w-10 h-10"
              />
              <span className="font-bold text-2xl gold-text">WORKET PLACE</span>
            </div>
            <p className="text-muted-foreground mb-6">
              {language === "ar"
                ? "متجرك المفضل للملابس الفاخرة والأنيقة بأسعار تنافسية."
                : "Your favorite store for luxury and elegant clothing at competitive prices."}
            </p>
            <div className="flex space-x-3 rtl:space-x-reverse">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-colors"
                  aria-label={link.name}
                >
                  <link.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4 uppercase tracking-wider">
              {language === "ar" ? "تسوق" : "Shop"}
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="/shop" className="text-muted-foreground hover:text-primary transition-colors">
                  {language === "ar" ? "المتجر" : "Shop"}
                </a>
              </li>
              <li>
                <a href="/#featured-products" className="text-muted-foreground hover:text-primary transition-colors">
                  {language === "ar" ? "وصل حديثاً" : "New Arrivals"}
                </a>
              </li>
              <li>
                <a href="/track-order" className="text-muted-foreground hover:text-primary transition-colors">
                  {language === "ar" ? "تتبع الطلب" : "Track Order"}
                </a>
              </li>
              <li>
                <a href="/shipping" className="text-muted-foreground hover:text-primary transition-colors">
                  {language === "ar" ? "الشحن" : "Shipping"}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4 uppercase tracking-wider">
              {language === "ar" ? "تواصل معنا" : "Contact"}
            </h3>
            <ul className="space-y-3">
              <li className="text-muted-foreground">
                Email:{" "}
                <a href="mailto:Worketplace1313@gmail.com" className="hover:text-primary transition-colors">
                  Worketplace1313@gmail.com
                </a>
              </li>
              <li className="text-muted-foreground">
                {language === "ar" ? "هاتف" : "Phone"}: +213 675409065
              </li>
              <li className="text-muted-foreground">
                {language === "ar" ? "ساعات العمل" : "Working Hours"}: {language === "ar" ? "24/7" : "24/7"}
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-border py-6 text-center text-sm text-muted-foreground">
          <p>
            &copy; {currentYear} WORKET PLACE. {language === "ar" ? "جميع الحقوق محفوظة" : "All rights reserved."}
          </p>
        </div>
      </div>
    </footer>
  )
}
