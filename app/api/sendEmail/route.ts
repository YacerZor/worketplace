import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { supabase } from "@/lib/supabase"

const resend = new Resend(process.env.RESEND_API_KEY || "re_XTkcXdCE_BWhQ7HKjCFABXUgMTtBVtwJk")

// دالة للحصول على اسم اللون من hex code
async function getColorName(colorValue: string | null): Promise<string | null> {
  if (!colorValue) return null

  try {
    // البحث في جميع المنتجات عن اللون المطابق
    const { data: variants, error } = await supabase
      .from("product_variants")
      .select("name_ar, name_en, value")
      .eq("variant_type", "color")
      .eq("value", colorValue)
      .limit(1)

    if (error || !variants || variants.length === 0) {
      return colorValue // إرجاع القيمة الأصلية إذا لم يتم العثور على اللون
    }

    return variants[0].name_ar || variants[0].name_en || colorValue
  } catch (error) {
    console.error("Error getting color name:", error)
    return colorValue
  }
}

interface OrderData {
  orderNumber: string
  fullName: string
  phone: string
  state: string
  city: string
  notes?: string
  deliveryType: string
  deliveryFee: number
  totalAmount: number
  product: {
    title: string
    price: number
    image: string
  }
  quantity: number
  selectedColor?: string
  selectedSize?: string
}

export async function POST(request: NextRequest) {
  try {
    const orderData: OrderData = await request.json()

    console.log("Received order data:", orderData)

    const {
      orderNumber,
      fullName,
      phone,
      state,
      city,
      notes,
      deliveryType,
      deliveryFee,
      totalAmount,
      product,
      quantity,
      selectedColor,
      selectedSize,
    } = orderData

    // الحصول على اسم اللون
    const colorName = selectedColor ? await getColorName(selectedColor) : null

    // Create beautiful HTML email template
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>طلب جديد - ${orderNumber}</title>
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
                background: linear-gradient(135deg, #ff4500, #ff6b35);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: bold;
            }
            .order-number {
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
                border-left: 4px solid #ff4500;
            }
            .section h2 {
                color: #ff4500;
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
                width: 80px;
                height: 80px;
                border-radius: 8px;
                object-fit: cover;
                border: 2px solid #f0f0f0;
            }
            .product-details {
                flex: 1;
            }
            .product-title {
                font-weight: bold;
                font-size: 16px;
                color: #333;
                margin-bottom: 8px;
            }
            .product-specs {
                display: flex;
                gap: 15px;
                margin-bottom: 8px;
            }
            .spec-item {
                background: #f8f9fa;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                color: #666;
            }
            .product-price {
                font-weight: bold;
                color: #ff4500;
                font-size: 18px;
            }
            .summary-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
            }
            .summary-table th,
            .summary-table td {
                padding: 12px;
                text-align: right;
                border-bottom: 1px solid #e9ecef;
            }
            .summary-table th {
                background: #f8f9fa;
                font-weight: bold;
                color: #666;
            }
            .total-row {
                background: #ff4500;
                color: white;
                font-weight: bold;
                font-size: 16px;
            }
            .footer {
                background: #343a40;
                color: white;
                padding: 20px;
                text-align: center;
                font-size: 14px;
            }
            .urgent-badge {
                background: #dc3545;
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                display: inline-block;
                margin-bottom: 15px;
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
                <h1>🛍️ طلب جديد وصل!</h1>
                <div class="order-number">رقم الطلب: ${orderNumber}</div>
            </div>
            
            <div class="content">
                <div class="urgent-badge">🔥 عاجل - يتطلب المتابعة</div>
                
                <div class="section">
                    <h2>👤 معلومات العميل</h2>
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">الاسم الكامل</div>
                            <div class="info-value">${fullName}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">رقم الهاتف</div>
                            <div class="info-value">${phone}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">الولاية</div>
                            <div class="info-value">${state}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">البلدية</div>
                            <div class="info-value">${city}</div>
                        </div>
                    </div>
                    ${
                      notes
                        ? `
                    <div class="info-item">
                        <div class="info-label">ملاحظات العميل</div>
                        <div class="info-value">${notes}</div>
                    </div>
                    `
                        : ""
                    }
                </div>

                <div class="section">
                    <h2>📦 تفاصيل المنتج</h2>
                    <div class="product-card">
                        <img src="${product.image}" alt="${product.title}" class="product-image" />
                        <div class="product-details">
                            <div class="product-title">${product.title}</div>
                            <div class="product-specs">
                                <span class="spec-item">الكمية: ${quantity}</span>
                                ${colorName ? `<span class="spec-item">اللون: ${colorName}</span>` : ""}
                                ${selectedSize ? `<span class="spec-item">المقاس: ${selectedSize}</span>` : ""}
                            </div>
                            <div class="product-price">DA ${product.price.toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h2>🚚 معلومات التوصيل</h2>
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">نوع التوصيل</div>
                            <div class="info-value">${deliveryType === "home" ? "توصيل إلى المنزل" : "توصيل إلى المكتب"}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">رسوم التوصيل</div>
                            <div class="info-value">DA ${deliveryFee.toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h2>💰 ملخص الطلب</h2>
                    <table class="summary-table">
                        <tr>
                            <td>DA ${(product.price * quantity).toFixed(2)}</td>
                            <th>المنتج (${quantity} × DA ${product.price.toFixed(2)})</th>
                        </tr>
                        <tr>
                            <td>DA ${deliveryFee.toFixed(2)}</td>
                            <th>رسوم التوصيل</th>
                        </tr>
                        <tr class="total-row">
                            <td>DA ${totalAmount.toFixed(2)}</td>
                            <th>المجموع الإجمالي</th>
                        </tr>
                    </table>
                </div>

                <div class="section">
                    <h2>⏰ معلومات إضافية</h2>
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">تاريخ الطلب</div>
                            <div class="info-value">${new Date().toLocaleDateString("ar-DZ", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">طريقة الدفع</div>
                            <div class="info-value">الدفع عند الاستلام</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="footer">
                <p><strong>تذكير:</strong> يرجى التواصل مع العميل خلال 24 ساعة لتأكيد الطلب</p>
            </div>
        </div>
    </body>
    </html>
    `

    console.log("Attempting to send email...")

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: ["zrqanyyasr650@gmail.com"],
      subject: `🛍️ طلب جديد #${orderNumber} - ${fullName}`,
      html: htmlContent,
    })

    if (error) {
      console.error("Resend API error:", error)
      return NextResponse.json(
        {
          error: "Failed to send email",
          details: error,
          message: "Email service error",
        },
        { status: 500 },
      )
    }

    console.log("Email sent successfully:", data)
    return NextResponse.json(
      {
        success: true,
        message: "Email sent successfully",
        data,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error in sendEmail API:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
