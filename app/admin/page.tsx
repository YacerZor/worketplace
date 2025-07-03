"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/components/language-provider"
import { supabase } from "@/lib/supabase"

export default function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()
  const { language } = useLanguage()

  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return re.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateEmail(email)) {
      setError(language === "ar" ? "البريد الإلكتروني غير صالح" : "Invalid email format")
      return
    }

    if (password.length < 6) {
      setError(
        language === "ar" ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters long",
      )
      return
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message === "Invalid login credentials") {
          setError(language === "ar" ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" : "Invalid email or password")
        } else {
          setError(language === "ar" ? "حدث خطأ أثناء تسجيل الدخول" : "An error occurred during login")
        }
        console.error("Error during login:", error)
        return
      }

      if (data.user) {
        router.push("/admin/dashboard")
      }
    } catch (error) {
      console.error("Unexpected error during login:", error)
      setError(language === "ar" ? "حدث خطأ غير متوقع" : "An unexpected error occurred")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
      <div className="bg-card p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-[#e3a52f] via-[#8d421f] to-[#63292a]">
          {language === "ar" ? "تسجيل الدخول للإدارة" : "Admin Login"}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={language === "ar" ? "البريد الإلكتروني" : "Email"}
            className="w-full"
            required
          />
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={language === "ar" ? "كلمة المرور" : "Password"}
            className="w-full"
            required
            minLength={6}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" className="w-full bg-gradient-to-r from-[#e3a52f] to-[#8d421f] text-white">
            {language === "ar" ? "تسجيل الدخول" : "Login"}
          </Button>
        </form>
      </div>
    </div>
  )
}
