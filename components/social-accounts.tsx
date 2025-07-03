"use client"

import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { FaDiscord, FaGithub } from "react-icons/fa"

const socialLinks = [
  {
    name: "Discord",
    icon: FaDiscord,
    url: "https://discord.gg/SvcxhG9BBY",
  },
  {
    name: "GitHub",
    icon: FaGithub,
    url: "https://github.com/nottirko",
  },
]

export function SocialAccounts() {
  const { language } = useLanguage()

  return (
    <section id="social" className="py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#e3a52f] via-[#8d421f] to-[#63292a]">
            {language === "ar" ? "حساباتي على مواقع التواصل" : "My Social Accounts"}
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {socialLinks.map((link) => (
              <Button
                key={link.name}
                variant="outline"
                size="icon"
                className="rounded-full w-12 h-12 dark:border-border/50 dark:hover:border-primary/50 dark:hover:bg-primary/10"
                asChild
              >
                <a href={link.url} target="_blank" rel="noopener noreferrer" aria-label={link.name}>
                  <link.icon className="w-5 h-5" />
                </a>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
