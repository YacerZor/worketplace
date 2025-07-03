import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY || "re_XTkcXdCE_BWhQ7HKjCFABXUgMTtBVtwJk")

// Function to get color name in Arabic
function getColorDisplay(colorValue: string): string {
  const colorMap: { [key: string]: string } = {
    "#000000": "أسود",
    "#FFFFFF": "أبيض",
    "#FF0000": "أحمر",
    "#00FF00": "أخضر",
    "#0000FF": "أزرق",
    "#FFFF00": "أصفر",
    "#FF00FF": "بنفسجي",
    "#00FFFF": "سماوي",
    "#FFA500": "برتقالي",
    "#FFC0CB": "وردي",
    "#A52A2A": "بني",
    "#808080": "رمادي",
    "#C0C0C0": "فضي",
    "#FFD700": "ذهبي",
    "#800080": "بنفسجي غامق",
    "#008000": "أخضر غامق",
    "#000080": "أزرق غامق",
    "#800000": "أحمر غامق",
    "#808000": "زيتوني",
    "#008080": "تركوازي",
    "#F0F8FF": "أزرق فاتح",
    "#FAEBD7": "أبيض عتيق",
    "#7FFFD4": "أكوامارين",
    "#F0FFFF": "أزرق سماوي فاتح",
    "#F5F5DC": "بيج",
    "#FFE4C4": "بسكويت",
    "#DEB887": "خشبي",
    "#5F9EA0": "أزرق كاديت",
    "#7FFF00": "أخضر مصفر",
    "#D2691E": "شوكولاتة",
    "#FF7F50": "مرجاني",
    "#6495ED": "أزرق ذرة",
    "#DC143C": "قرمزي",
    "#00BFFF": "أزرق سماء عميق",
    "#696969": "رمادي غامق",
    "#1E90FF": "أزرق دودجر",
    "#B22222": "أحمر طوب",
    "#228B22": "أخضر غابة",
    "#DCDCDC": "رمادي فاتح",
    "#32CD32": "أخضر ليموني",
    "#87CEEB": "أزرق سماء فاتح",
    "#98FB98": "أخضر فاتح",
    "#F0E68C": "كاكي فاتح",
    "#E6E6FA": "لافندر",
    "#90EE90": "أخضر فاتح",
    "#20B2AA": "أخضر بحري فاتح",
    "#87CEFA": "أزرق سماء فاتح",
    "#778899": "رمادي أردوازي فاتح",
    "#B0C4DE": "أزرق فولاذي فاتح",
    "#FFFFE0": "أصفر فاتح",
    "#00FF00": "أخضر ليموني",
    "#32CD32": "أخضر ليموني",
    "#FAF0E6": "كتاني",
    "#FF00FF": "ماجنتا",
    "#800000": "كستنائي",
    "#66CDAA": "أكوامارين متوسط",
    "#0000CD": "أزرق متوسط",
    "#BA55D3": "أوركيد متوسط",
    "#9370DB": "بنفسجي متوسط",
    "#3CB371": "أخضر بحري متوسط",
    "#7B68EE": "أردوازي أزرق متوسط",
    "#00FA9A": "أخضر ربيعي متوسط",
    "#48D1CC": "تركوازي متوسط",
    "#C71585": "بنفسجي أحمر متوسط",
    "#191970": "أزرق منتصف الليل",
    "#F5FFFA": "كريم نعناع",
    "#FFE4E1": "وردي ضبابي",
    "#FFE4B5": "موكاسين",
    "#FFDEAD": "أبيض نافاجو",
    "#FDF5E6": "دانتيل قديم",
    "#6B8E23": "زيتوني غامق",
    "#FFA500": "برتقالي",
    "#FF4500": "أحمر برتقالي",
    "#DA70D6": "أوركيد",
    "#EEE8AA": "قضيب ذهبي شاحب",
    "#98FB98": "أخضر شاحب",
    "#AFEEEE": "تركوازي شاحب",
    "#DB7093": "بنفسجي أحمر شاحب",
    "#FFEFD5": "خوخي",
    "#DDA0DD": "برقوق",
    "#B0E0E6": "أزرق بودرة",
    "#663399": "بنفسجي ريبيكا",
    "#BC8F8F": "بني وردي",
    "#4169E1": "أزرق ملكي",
    "#8B4513": "بني سرج",
    "#FA8072": "سلمون",
    "#F4A460": "بني رملي",
    "#2E8B57": "أخضر بحري",
    "#FFF5EE": "صدفي",
    "#A0522D": "بني سيينا",
    "#87CEEB": "أزرق سماء",
    "#6A5ACD": "أردوازي أزرق",
    "#708090": "رمادي أردوازي",
    "#FFFAFA": "أبيض ثلجي",
    "#00FF7F": "أخضر ربيعي",
    "#4682B4": "أزرق فولاذي",
    "#D2B48C": "تان",
    "#008080": "تيل",
    "#D8BFD8": "شوك",
    "#FF6347": "طماطم",
    "#40E0D0": "تركوازي",
    "#EE82EE": "بنفسجي",
    "#F5DEB3": "قمح",
    "#FFFFFF": "أبيض",
    "#F5F5F5": "دخان أبيض",
    "#FFFF00": "أصفر",
    "#9ACD32": "أخضر أصفر",
  }

  const upperColor = colorValue.toUpperCase()
  return colorMap[upperColor] || colorValue
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderData, orderItems } = body

    if (!orderData || !orderItems) {
      return NextResponse.json({ error: "Missing order data or items" }, { status: 400 })
    }

    // Create HTML email template
    const emailHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>طلب جديد - Tirko</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
            direction: rtl;
          }
          
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          }
          
          .header {
            background: linear-gradient(135deg, #e3a52f 0%, #8d421f 50%, #63292a 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          
          .header h1 {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 8px;
          }
          
          .header p {
            font-size: 16px;
            opacity: 0.9;
          }
          
          .content {
            padding: 30px 20px;
          }
          
          .order-info {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
            border-right: 4px solid #e3a52f;
          }
          
          .order-info h2 {
            color: #8d421f;
            font-size: 20px;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
          }
          
          .info-item {
            display: flex;
            flex-direction: column;
          }
          
          .info-label {
            font-weight: 600;
            color: #666;
            font-size: 14px;
            margin-bottom: 4px;
          }
          
          .info-value {
            font-size: 16px;
            color: #333;
            font-weight: 500;
          }
          
          .products-section {
            margin-bottom: 25px;
          }
          
          .products-section h2 {
            color: #8d421f;
            font-size: 20px;
            margin-bottom: 20px;
            border-bottom: 2px solid #e3a52f;
            padding-bottom: 8px;
          }
          
          .product-item {
            display: flex;
            align-items: center;
            padding: 15px;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            margin-bottom: 15px;
            background-color: #ffffff;
            transition: box-shadow 0.2s ease;
          }
          
          .product-item:hover {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          
          .product-image {
            width: 80px;
            height: 80px;
            border-radius: 8px;
            object-fit: cover;
            margin-left: 15px;
            border: 2px solid #f1f3f4;
          }
          
          .product-details {
            flex: 1;
          }
          
          .product-title {
            font-size: 16px;
            font-weight: 600;
            color: #333;
            margin-bottom: 8px;
          }
          
          .product-specs {
            display: flex;
            gap: 15px;
            margin-bottom: 8px;
          }
          
          .spec-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
            color: #666;
          }
          
          .color-circle {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 2px solid #ddd;
            display: inline-block;
          }
          
          .product-price {
            text-align: left;
            font-weight: 600;
          }
          
          .price-main {
            font-size: 18px;
            color: #e3a52f;
          }
          
          .price-details {
            font-size: 14px;
            color: #666;
            margin-top: 4px;
          }
          
          .summary-section {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
          }
          
          .summary-section h2 {
            color: #8d421f;
            font-size: 20px;
            margin-bottom: 15px;
          }
          
          .summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #dee2e6;
          }
          
          .summary-row:last-child {
            border-bottom: none;
            font-weight: 600;
            font-size: 18px;
            color: #8d421f;
            margin-top: 10px;
            padding-top: 15px;
            border-top: 2px solid #e3a52f;
          }
          
          .footer {
            background-color: #8d421f;
            color: white;
            padding: 20px;
            text-align: center;
          }
          
          .footer p {
            margin-bottom: 8px;
          }
          
          .footer a {
            color: #e3a52f;
            text-decoration: none;
          }
          
          @media (max-width: 600px) {
            .info-grid {
              grid-template-columns: 1fr;
            }
            
            .product-item {
              flex-direction: column;
              text-align: center;
            }
            
            .product-image {
              margin: 0 0 15px 0;
            }
            
            .product-specs {
              justify-content: center;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 طلب جديد من Tirko</h1>
            <p>تم استلام طلب جديد من العميل</p>
          </div>
          
          <div class="content">
            <div class="order-info">
              <h2>📋 معلومات الطلب</h2>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">رقم الطلب</span>
                  <span class="info-value">${orderData.order_number || `#${orderData.id}`}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">تاريخ الطلب</span>
                  <span class="info-value">${new Date(orderData.created_at).toLocaleDateString("ar-DZ")}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">الاسم الكامل</span>
                  <span class="info-value">${orderData.full_name}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">رقم الهاتف</span>
                  <span class="info-value">${orderData.phone}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">الولاية</span>
                  <span class="info-value">${orderData.state}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">البلدية</span>
                  <span class="info-value">${orderData.city}</span>
                </div>
              </div>
              
              <div class="info-item">
                <span class="info-label">نوع التوصيل</span>
                <span class="info-value">${orderData.delivery_type === "home" ? "🏠 توصيل منزلي" : "🏢 استلام من المكتب"}</span>
              </div>
              
              ${
                orderData.notes
                  ? `
                <div class="info-item" style="margin-top: 15px;">
                  <span class="info-label">ملاحظات إضافية</span>
                  <span class="info-value">${orderData.notes}</span>
                </div>
              `
                  : ""
              }
            </div>
            
            <div class="products-section">
              <h2>🛍️ المنتجات المطلوبة</h2>
              ${orderItems
                .map(
                  (item: any) => `
                <div class="product-item">
                  <img src="${item.product_image || "/placeholder.svg?height=80&width=80"}" alt="${item.product_title}" class="product-image">
                  <div class="product-details">
                    <div class="product-title">${item.product_title}</div>
                    <div class="product-specs">
                      ${
                        item.color
                          ? `
                        <div class="spec-item">
                          <span style="background-color: ${item.color};" class="color-circle"></span>
                          <span>اللون: ${getColorDisplay(item.color)}</span>
                        </div>
                      `
                          : ""
                      }
                      ${
                        item.size
                          ? `
                        <div class="spec-item">
                          <span>📏</span>
                          <span>المقاس: ${item.size}</span>
                        </div>
                      `
                          : ""
                      }
                      <div class="spec-item">
                        <span>📦</span>
                        <span>الكمية: ${item.quantity}</span>
                      </div>
                    </div>
                  </div>
                  <div class="product-price">
                    <div class="price-main">DA ${(item.product_price * item.quantity).toLocaleString()}</div>
                    <div class="price-details">${item.quantity} × DA ${item.product_price.toLocaleString()}</div>
                  </div>
                </div>
              `,
                )
                .join("")}
            </div>
            
            <div class="summary-section">
              <h2>💰 ملخص الطلب</h2>
              <div class="summary-row">
                <span>المجموع الفرعي</span>
                <span>DA ${(orderData.total_amount - orderData.delivery_fee).toLocaleString()}</span>
              </div>
              <div class="summary-row">
                <span>رسوم التوصيل</span>
                <span>DA ${orderData.delivery_fee.toLocaleString()}</span>
              </div>
              <div class="summary-row">
                <span>المجموع الإجمالي</span>
                <span>DA ${orderData.total_amount.toLocaleString()}</span>
              </div>
            </div>
            
            <div style="background-color: #e8f5e8; border: 1px solid #4caf50; border-radius: 8px; padding: 15px; text-align: center;">
              <p style="color: #2e7d32; font-weight: 600; margin-bottom: 8px;">💳 طريقة الدفع</p>
              <p style="color: #2e7d32;">الدفع عند الاستلام (Cash on Delivery)</p>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>Tirko Store</strong></p>
            <p>متجر إلكتروني متخصص في الملابس والإكسسوارات</p>
            <p>📧 البريد الإلكتروني: <a href="mailto:info@tirko.com">info@tirko.com</a></p>
            <p>🌐 الموقع: <a href="https://tirko.com">www.tirko.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: ["zrqanyyasr650@gmail.com"],
      subject: `طلب جديد #${orderData.order_number || orderData.id} - ${orderData.full_name}`,
      html: emailHtml,
    })

    if (error) {
      console.error("Error sending email:", error)
      return NextResponse.json({ error: "Failed to send email", details: error }, { status: 500 })
    }

    return NextResponse.json(
      {
        success: true,
        message: "Email sent successfully",
        emailId: data?.id,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error in sendEmail API:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
