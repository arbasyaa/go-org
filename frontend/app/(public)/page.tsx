import { AboutSection } from "@/components/landing/about-section"
import { CtaSection } from "@/components/landing/cta-section"
import { HeroSection } from "@/components/landing/hero-section"
import { InvitationSection } from "@/components/landing/invitation-section"
import { MembersSection } from "@/components/landing/members-section"
import { MerchSection } from "@/components/landing/merch-section"
import { OfficialsSection } from "@/components/landing/officials-section"
import { PressSection } from "@/components/landing/press-section"
import { ProgramsSection } from "@/components/landing/programs-section"
import {
  getHimpunan,
  getLandingSections,
  getMerch,
  getOfficials,
  getPressReleases,
  getWorkPrograms,
} from "@/lib/landing/fetch"
import { buildMemberIndex, buildStats, groupByCity, org } from "@/lib/landing/content"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: org.name,
  alternateName: `${org.fullName} ${org.region}`,
  url: siteUrl,
  logo: `${siteUrl}/assets/logo-permikomnas.png`,
  email: org.email,
  description: org.description,
  address: {
    "@type": "PostalAddress",
    addressRegion: "Jawa Tengah",
    addressCountry: "ID",
  },
}

// Konten dikelola lewat admin: halaman ini dirender per request supaya
// perubahan (pengurus, program, berita, merch) langsung terlihat, tanpa
// menunggu revalidate dan tanpa perlu redeploy.
export const dynamic = "force-dynamic"

/** Maksimum kartu program di landing; selebihnya lewat /program. */
const PROGRAM_LIMIT = 5

export default async function LandingPage() {
  const [press, merch, himpunan, programs, sections, officials] = await Promise.all([
    getPressReleases(5),
    getMerch(),
    getHimpunan(),
    getWorkPrograms({ limit: PROGRAM_LIMIT }),
    getLandingSections(),
    getOfficials(),
  ])
  const directory = groupByCity(himpunan)

  return (
    <>
      <HeroSection memberIndex={buildMemberIndex(himpunan)} stats={buildStats(directory, officials)} />
      {sections.about ? <AboutSection /> : null}
      {sections.programs ? <ProgramsSection programs={programs.items} total={programs.total} limit={PROGRAM_LIMIT} /> : null}
      {sections.press ? <PressSection items={press} /> : null}
      {sections.members ? <MembersSection directory={directory} /> : null}
      {sections.officials ? <OfficialsSection groups={officials} /> : null}
      {sections.merch ? <MerchSection items={merch} /> : null}
      {sections.invitation ? <InvitationSection /> : null}
      {sections.cta ? <CtaSection /> : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
    </>
  )
}
