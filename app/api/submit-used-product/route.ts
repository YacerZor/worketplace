import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title_ar, title_en, description_ar, description_en, image, price, phone } = body

    // Validate required fields
    if (!title_ar || !description_ar || !image || !price || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate price
    const numericPrice = Number.parseFloat(price)
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 })
    }

    // Generate slug
    const baseSlug = (title_ar || title_en || "used-product")
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")

    const slug = `${baseSlug}-used-${Date.now()}`

    // Insert the used product into the database
    const { data, error } = await supabase
      .from("used_products")
      .insert([
        {
          title_ar: title_ar.trim(),
          title_en: (title_en || title_ar).trim(),
          description_ar: description_ar.trim(),
          description_en: (description_en || description_ar).trim(),
          image,
          price: numericPrice,
          phone: phone.trim(),
          status: "pending",
          slug: slug,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error inserting used product:", error)
      return NextResponse.json({ error: "Failed to submit product" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error("Error in submit-used-product API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
