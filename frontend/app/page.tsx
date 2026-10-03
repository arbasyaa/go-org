import { AboutSection } from "@/components/landing/about-section"
import { CtaSection } from "@/components/landing/cta-section"
import { HeroSection } from "@/components/landing/hero-section"
import { MembersSection } from "@/components/landing/members-section"
import { OfficialsSection } from "@/components/landing/officials-section"
import { ProgramsSection } from "@/components/landing/programs-section"
import { SiteFooter } from "@/components/landing/site-footer"
import { SiteHeader } from "@/components/landing/site-header"
import { org } from "@/lib/landing/content"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: org.name,
  alternateName: `${org.fullName} ${org.region}`,
  url: siteUrl,
  email: org.email,
  description: org.description,
  address: {
    "@type": "PostalAddress",
    addressRegion: "Jawa Tengah",
    addressCountry: "ID",
  },
}

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <AboutSection />
        <ProgramsSection />
        <MembersSection />
        <OfficialsSection />
        <CtaSection />
      </main>
      <SiteFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
    </>
  )
}
