"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Send, Phone, Mail } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

export function Contact() {
  const { language } = useLanguage()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Direct insert to bypass RLS issues
      const { error } = await supabase.from("messages").insert([
        {
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
        },
      ])

      if (error) {
        console.error("Error sending message:", error)
        throw error
      }

      // Reset form
      setName("")
      setEmail("")
      setSubject("")
      setMessage("")

      // Show success message
      toast({
        title: language === "ar" ? "✅ تم إرسال الرسالة بنجاح!" : "✅ Message sent successfully!",
        description:
          language === "ar"
            ? "شكراً لتواصلك معنا. سنرد عليك في أقرب وقت ممكن. 💖"
            : "Thank you for contacting us. We will reply to you as soon as possible. 💖",
        className: "bg-green-50 border-green-200 text-green-800",
      })

      // Try to send admin notification (non-critical)
      try {
        await supabase.from("admin_notifications").insert([
          {
            title: "New Contact Message",
            message: `New message from ${name.trim()} - ${subject.trim()}`,
            type: "message",
            read: false,
          },
        ])
      } catch (notificationError) {
        console.log("Notification error (non-critical):", notificationError)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: language === "ar" ? "❌ فشل في إرسال الرسالة" : "❌ Failed to send message",
        description:
          language === "ar"
            ? "حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى."
            : "An error occurred while sending the message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Toaster />
      <section id="contact" className="py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-background/80"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="inline-block px-4 py-1 mb-4 bg-primary/10 text-primary rounded-full text-sm font-medium">
                {language === "ar" ? "تواصل معنا" : "Get In Touch"}
              </span>
              <h2 className="text-4xl font-bold mb-6">
                {language === "ar" ? "نحن هنا" : "We're Here"}
                <span className="text-primary"> {language === "ar" ? "لمساعدتك" : "To Help"}</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {language === "ar"
                  ? "هل لديك سؤال أو استفسار؟ نحن هنا للاستماع والمساعدة!"
                  : "Have a question or inquiry? We're here to listen and help!"}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <Card>
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{language === "ar" ? "الهاتف" : "Phone"}</h3>
                      <p className="text-muted-foreground">+213 675409065</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">
                        {language === "ar" ? "البريد الإلكتروني" : "Email"}
                      </h3>
                      <p className="text-muted-foreground">Worketplace1313@gmail.com</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-xl mb-4">
                      {language === "ar" ? "أرسل لنا رسالة" : "Send Us A Message"}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          type="text"
                          placeholder={language === "ar" ? "الاسم" : "Name"}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                        <Input
                          type="email"
                          placeholder={language === "ar" ? "البريد الإلكتروني" : "Email"}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <Input
                        type="text"
                        placeholder={language === "ar" ? "الموضوع" : "Subject"}
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                      />
                      <Textarea
                        placeholder={language === "ar" ? "الرسالة" : "Message"}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        rows={5}
                      />
                      <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                        {isSubmitting ? (
                          language === "ar" ? (
                            "جاري الإرسال..."
                          ) : (
                            "Sending..."
                          )
                        ) : (
                          <>
                            {language === "ar" ? "إرسال الرسالة" : "Send Message"}
                            <Send className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
