import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY || "re_XTkcXdCE_BWhQ7HKjCFABXUgMTtBVtwJk")

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

    try {
      // Create beautiful HTML email template for used product submission
      const htmlContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>منتج مستعمل جديد - ${data.title_ar}</title>
          <style>
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  background-color: #f8f9fa;
              }
              .container {
                  background: white;
                  border-radius: 12px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                  overflow: hidden;
              }
              .header {
                  background: linear-gradient(135deg, #ff8c00, #ff6b35);
                  color: white;
                  padding: 30px;
                  text-align: center;
              }
              .header h1 {
                  margin: 0;
                  font-size: 28px;
                  font-weight: bold;
              }
              .product-id {
                  background: rgba(255, 255, 255, 0.2);
                  padding: 8px 16px;
                  border-radius: 20px;
                  display: inline-block;
                  margin-top: 10px;
                  font-weight: bold;
                  font-size: 16px;
              }
              .content {
                  padding: 30px;
              }
              .section {
                  margin-bottom: 25px;
                  padding: 20px;
                  background: #f8f9fa;
                  border-radius: 8px;
                  border-left: 4px solid #ff8c00;
              }
              .section h2 {
                  color: #ff8c00;
                  margin-top: 0;
                  margin-bottom: 15px;
                  font-size: 18px;
                  font-weight: bold;
              }
              .info-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 15px;
                  margin-bottom: 15px;
              }
              .info-item {
                  background: white;
                  padding: 12px;
                  border-radius: 6px;
                  border: 1px solid #e9ecef;
              }
              .info-label {
                  font-weight: bold;
                  color: #666;
                  font-size: 12px;
                  text-transform: uppercase;
                  margin-bottom: 4px;
              }
              .info-value {
                  color: #333;
                  font-size: 14px;
              }
              .product-card {
                  background: white;
                  border: 1px solid #e9ecef;
                  border-radius: 8px;
                  padding: 20px;
                  display: flex;
                  align-items: center;
                  gap: 15px;
              }
              .product-image {
                  width: 120px;
                  height: 120px;
                  border-radius: 8px;
                  object-fit: cover;
                  border: 2px solid #f0f0f0;
              }
              .product-details {
                  flex: 1;
              }
              .product-title {
                  font-weight: bold;
                  font-size: 18px;
                  color: #333;
                  margin-bottom: 8px;
              }
              .product-price {
                  font-weight: bold;
                  color: #ff8c00;
                  font-size: 20px;
                  margin-bottom: 8px;
              }
              .product-description {
                  color: #666;
                  font-size: 14px;
                  line-height: 1.5;
              }
              .footer {
                  background: #343a40;
                  color: white;
                  padding: 20px;
                  text-align: center;
                  font-size: 14px;
              }
              .urgent-badge {
                  background: #28a745;
                  color: white;
                  padding: 4px 12px;
                  border-radius: 20px;
                  font-size: 12px;
                  font-weight: bold;
                  display: inline-block;
                  margin-bottom: 15px;
              }
              .used-badge {
                  background: #ff8c00;
                  color: white;
                  padding: 6px 12px;
                  border-radius: 15px;
                  font-size: 12px;
                  font-weight: bold;
                  display: inline-block;
                  margin-bottom: 10px;
              }
              @media (max-width: 600px) {
                  .info-grid {
                      grid-template-columns: 1fr;
                  }
                  .product-card {
                      flex-direction: column;
                      text-align: center;
                  }
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>📱 منتج مستعمل جديد!</h1>
                  <div class="product-id">ID: ${data.id}</div>
              </div>
              
              <div class="content">
                  <div class="urgent-badge">🆕 جديد - يحتاج للمراجعة</div>
                  
                  <div class="section">
                      <h2>📦 تفاصيل المنتج المستعمل</h2>
                      <div class="product-card">
                          <img src="${data.image}" alt="${data.title_ar}" class="product-image" />
                          <div class="product-details">
                              <div class="used-badge">مستعمل</div>
                              <div class="product-title">${data.title_ar}</div>
                              <div class="product-price">DA ${data.price.toLocaleString()}</div>
                              <div class="product-description">${data.description_ar}</div>
                          </div>
                      </div>
                  </div>

                  <div class="section">
                      <h2>👤 معلومات البائع</h2>
                      <div class="info-grid">
                          <div class="info-item">
                              <div class="info-label">رقم الهاتف</div>
                              <div class="info-value">${data.phone}</div>
                          </div>
                          <div class="info-item">
                              <div class="info-label">حالة المنتج</div>
                              <div class="info-value">في انتظار المراجعة</div>
                          </div>
                      </div>
                  </div>

                  <div class="section">
                      <h2>⏰ معلومات إضافية</h2>
                      <div class="info-grid">
                          <div class="info-item">
                              <div class="info-label">تاريخ الإرسال</div>
                              <div class="info-value">${new Date().toLocaleDateString("ar-DZ", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}</div>
                          </div>
                          <div class="info-item">
                              <div class="info-label">رابط المنتج</div>
                              <div class="info-value">${data.slug}</div>
                          </div>
                      </div>
                  </div>

                  <div class="section">
                      <h2>🔧 الإجراءات المطلوبة</h2>
                      <div class="info-item">
                          <div class="info-label">الخطوات التالية</div>
                          <div class="info-value">
                              1. مراجعة تفاصيل المنتج والصور<br>
                              2. التواصل مع البائع على الرقم: ${data.phone}<br>
                              3. الموافقة على المنتج أو رفضه من لوحة التحكم<br>
                              4. إشعار البائع بالقرار
                          </div>
                      </div>
                  </div>
              </div>

              <div class="footer">
                  <p><strong>تذكير:</strong> يرجى مراجعة المنتج والتواصل مع البائع في أقرب وقت ممكن</p>
              </div>
          </div>
      </body>
      </html>
      `

      console.log("Attempting to send used product notification email...")

      // Send email using Resend
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: "onboarding@resend.dev",
        to: ["zrqanyyasr650@gmail.com"],
        subject: `📱 منتج مستعمل جديد - ${data.title_ar} - ${data.phone}`,
        html: htmlContent,
      })

      if (emailError) {
        console.error("Resend API error for used product:", emailError)
        // Don't fail the entire request if email fails, just log it
      } else {
        console.log("Used product notification email sent successfully:", emailData)
      }
    } catch (emailError) {
      console.error("Error sending used product notification email:", emailError)
      // Don't fail the entire request if email fails
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error("Error in submit-used-product API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
