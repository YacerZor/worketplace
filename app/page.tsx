import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { Contact } from "@/components/contact"
import { Footer } from "@/components/footer"
import { Products } from "@/components/products"

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Products />
        <Features />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
