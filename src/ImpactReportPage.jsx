import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Compass,
  Download,
  ExternalLink,
  FileText,
  Globe,
  Heart,
  MapPin,
  Search,
  Share2,
  Users,
  X,
  ZoomIn,
} from 'lucide-react'

const IMPACT_REPORT_PDF_URL =
  'https://drive.google.com/file/d/1rpAYwCEYSp1MhtAkTWP4sVauSZb5BtKY/view?usp=sharing'

const CURRENT_YEAR = new Date().getFullYear()

export default function ImpactReportPage({ onBackToHome, onOpenPartnerModal }) {
  const [activeRegion, setActiveRegion] = useState('all')
  const [lightboxImage, setLightboxImage] = useState(null)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && lightboxImage) {
        setLightboxImage(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxImage])

  const highlights = [
    {
      value: '4 Nations',
      label: 'Featured Field Reports',
      sub: 'Brazil, Egypt, Cuba, and Kenya',
      icon: Globe,
      color: '#5BA4E5',
    },
    {
      value: '20,000+',
      label: 'Young Leaders at Dunamis Con ’26',
      sub: 'Gathered in São Paulo with new & long-time partners',
      icon: Users,
      color: '#239CEC',
    },
    {
      value: '4 Years',
      label: 'Serving Overseas in Egypt',
      sub: 'Cade & team discipling through sports, schools & d-groups',
      icon: Compass,
      color: '#0D6EFD',
    },
    {
      value: 'Oct 2026',
      label: 'Cuba Visit & HOME Needs',
      sub: 'Encouraging local churches and meeting vital community needs',
      icon: Heart,
      color: '#3B82F6',
    },
  ]

  const regions = [
    {
      id: 'brazil',
      country: 'Brazil',
      title: "Brazil — Dunamis Con' 2026 & Connections",
      tag: 'São Paulo • 20,000+ Young Leaders',
      accent: '#5BA4E5',
      globeImg: '/impact-report/brazil-globe.png',
      paragraphs: [
        "Keith, Ana, Mariana, and Vitor gathered in São Paulo to attend Dunamis Con '26, an event that brought together over 20,000 young leaders. It was a great moment for the Youth Force team!",
        'Following the conference, the team also met with local leaders who are making a massive impact across the country.',
      ],
      highlightQuote: 'God is on the move in Brazil.',
      photos: [
        {
          src: '/impact-report/brazil-dunamis-team.jpg',
          caption: "Youth Force team at Dunamis Con '26 in São Paulo",
        },
        {
          src: '/impact-report/brazil-dunamis-stage.jpg',
          caption: "Main stage worship and teaching for 20,000+ young leaders",
        },
        {
          src: '/impact-report/brazil-dunamis-con26.jpg',
          caption: "Dunamis Con '26 conference arena",
        },
        {
          src: '/impact-report/brazil-dinner.jpg',
          caption: 'Fellowship and meals with local Brazilian leaders',
        },
        {
          src: '/impact-report/brazil-connections.jpg',
          caption: 'Building new Kingdom connections across São Paulo',
        },
      ],
    },
    {
      id: 'egypt',
      country: 'Egypt',
      title: 'Egypt – Cade and team awakening the Next Generation!',
      tag: '4 Years Overseas • Leadership School & Sports Ministry',
      accent: '#239CEC',
      globeImg: '/impact-report/egypt-globe.png',
      subtitle: 'Report from Cade:',
      greeting: 'Hello Family and Friends,',
      paragraphs: [
        "I can't believe I have been serving 4 years overseas. God's faithfulness is so real to me when I think about your steadfast support. Especially as I am preparing for a new season – wedding is coming soon – I am filled with so much gratitude for each one of you.",
        "So much is happening here and I wish I could share with you all the ways God is working. In Mariam's family, my assistant coaches, academy teams, the league team I coach, our leadership school, our d-group. I know sometimes my updates are too spread out but please be assured that God is at work here and is drawing people to Himself!",
        'Please reach out to me because I would love to share more and I know sometimes I just need a question or two to get me going.',
      ],
      donateCadeUrl: 'https://www.paypal.com/donate/?hosted_button_id=Y2PMKT4AH8AJY',
      photos: [
        {
          src: '/impact-report/egypt-team-field.jpg',
          caption: 'Academy and league football team mentored in Egypt',
        },
        {
          src: '/impact-report/egypt-bus.jpg',
          caption: 'Traveling together with youth players and coaches',
        },
        {
          src: '/impact-report/egypt-cade-mariam.png',
          caption: 'Cade and Mariam preparing for a new season together',
        },
      ],
    },
    {
      id: 'cuba',
      country: 'Cuba',
      title: 'Cuba — Impact and community is growing!',
      tag: 'October Visit • Local Church & Vital HOME Needs',
      accent: '#0D6EFD',
      globeImg: '/impact-report/cuba-globe.png',
      paragraphs: [
        'In Cuba, we have been supporting our local team in various ways.',
        'In October, some of us had the opportunity to visit, and it was incredible to see the local church impacting the community, even amid the challenging conditions the country is currently facing.',
        'Despite these ongoing crises, our friends never stop investing their time and energy to faithfully serve God.',
      ],
      photos: [
        {
          src: '/impact-report/cuba-visit.jpg',
          caption: 'Supporting and encouraging our local ministry partners in Cuba',
        },
        {
          src: '/impact-report/cuba-worship.png',
          caption: 'Local youth leading worship in the church',
        },
        {
          src: '/impact-report/cuba-youth.png',
          caption: 'Young believers gathering in worship and prayer',
        },
        {
          src: '/impact-report/cuba-community.jpg',
          caption: 'October trip fellowship with the local church team',
        },
      ],
    },
    {
      id: 'kenya',
      country: 'Kenya',
      title: 'Kenya — Lamgambo Music Pulse',
      tag: 'Led by Peter Chege • Disciple-Making & Public Worship',
      accent: '#174EA6',
      globeImg: '/impact-report/kenya-globe.png',
      paragraphs: [
        "In Kenya, Peter Chege continues to lead a transformative ministry. By focusing on disciple-making and empowering young leaders, Peter's team has been able to reach deep into local communities through worship in public locations.",
        'His dedication is raising up a new generation of believers equipped to serve their neighborhoods and lead with faith and resilience.',
      ],
      photos: [
        {
          src: '/impact-report/kenya-family.png',
          caption: 'Peter Chege and family representing One Voice / Lamgambo Music Pulse',
        },
        {
          src: '/impact-report/kenya-church.png',
          caption: 'Worship gathering and community leadership empowerment',
        },
        {
          src: '/impact-report/kenya-street-worship.png',
          caption: 'Reaching local communities through worship in public locations',
        },
        {
          src: '/impact-report/kenya-outreach.png',
          caption: 'Personal discipleship and neighborhood outreach in Kenya',
        },
      ],
    },
  ]

  const pillarsData = [
    {
      num: '01',
      pillar: 'Identify',
      title: 'Identify Young Leaders Creating Local Impact',
      desc: 'Connecting with faithful young leaders on the ground in Brazil, Egypt, Cuba, and Kenya who are already transforming their local communities.',
      icon: Search,
      accent: '#5BA4E5',
    },
    {
      num: '02',
      pillar: 'Awaken',
      title: 'Awaken to an Authentic Relationship with Jesus',
      desc: 'From public worship in Kenya to d-groups and leadership schools in Egypt, drawing the next generation into a genuine walk with Christ.',
      icon: BookOpen,
      accent: '#239CEC',
    },
    {
      num: '03',
      pillar: 'Activate',
      title: 'Activate Dreamers & Ministry Builders',
      desc: 'Investing in local churches, distributing support for vital HOME needs in Cuba, and empowering coaches and student leaders to act boldly.',
      icon: Globe,
      accent: '#0D6EFD',
    },
    {
      num: '04',
      pillar: 'Connect',
      title: 'Connect Across Global Kingdom Alliances',
      desc: 'Uniting with 20,000+ leaders at Dunamis Con ’26 and expanding our network of kingdom-minded ministries around the world.',
      icon: Share2,
      accent: '#1D5AC4',
    },
  ]

  const visibleRegions =
    activeRegion === 'all' ? regions : regions.filter((r) => r.id === activeRegion)

  return (
    <div className="min-h-screen bg-[#071526] text-white">
      {/* Top Sticky Square Header */}
      <header className="sticky top-0 left-0 right-0 w-full z-50 bg-[#071526]/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-12 py-4 md:py-5">
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToHome}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono tracking-widest text-[#74A5D4] hover:text-white transition-all"
            >
              <ArrowLeft size={14} />
              <span>Back to Home</span>
            </button>
            <div className="hidden sm:block h-5 w-px bg-white/15" />
            <button
              type="button"
              onClick={onBackToHome}
              className="hidden sm:inline-flex items-center"
              aria-label="Global Youth Force Home"
            >
              <img
                src="/logos/gyf-orange-dark.png"
                alt="Global Youth Force"
                className="h-10 md:h-11 w-auto object-contain"
              />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={IMPACT_REPORT_PDF_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-mono tracking-wider text-white bg-white/10 hover:bg-[#239CEC]/20 border border-[#239CEC]/30 transition-colors"
            >
              <Download size={14} />
              <span>Download PDF</span>
              <ExternalLink size={12} className="opacity-70" />
            </a>
            <button
              onClick={onOpenPartnerModal}
              className="btn-signal text-xs md:text-sm"
              style={{ padding: '10px 22px' }}
            >
              <span>Connect With Us</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center"
          style={{ backgroundImage: "url('/impact-report/hero-team.png')" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(7,21,38,0.96) 0%, rgba(10,28,46,0.88) 55%, rgba(7,21,38,0.98) 100%)',
          }}
        />
        <div className="absolute -top-20 right-10 w-96 h-96 bg-[#239CEC]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-24">
          <div className="mb-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#239CEC]/15 border border-[#239CEC]/35">
            <span className="w-2 h-2 rounded-full bg-[#239CEC] animate-pulse" />
            <span className="font-mono text-xs tracking-widest text-[#74A5D4] uppercase">
              Global Youth Force • Official Impact Report 2026
            </span>
          </div>

          <h1
            className="font-heading font-extrabold tracking-tight leading-tight text-white mb-6 max-w-4xl"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.75rem)' }}
          >
            Youth Force <span className="text-[#239CEC]">Impact Report</span> 2026.
          </h1>

          <p className="font-sans text-base md:text-xl text-[#E8E4DD]/85 leading-relaxed max-w-3xl">
            This year has been incredibly busy and deeply fruitful across Cuba, Brazil, Egypt, and Kenya. Explore field stories, leadership updates from Keith Cote and Bruce McEvoy, and how God is mobilizing young leaders worldwide.
          </p>

          <div className="flex flex-wrap gap-4 mt-9">
            <a
              href={IMPACT_REPORT_PDF_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-blue flex items-center gap-2.5 text-xs font-mono tracking-widest"
            >
              <FileText size={16} />
              <span>Download Full 2026 Report (PDF)</span>
              <ExternalLink size={13} className="opacity-75" />
            </a>

            <button
              onClick={onOpenPartnerModal}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-xs font-mono tracking-widest text-[#74A5D4] bg-white/5 hover:bg-white/10 border border-[#239CEC]/30 transition-all"
            >
              <span>Connect With Us</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
        {/* Highlights Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
          {highlights.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className="p-6 rounded-3xl bg-[#0A1C2E] border border-white/10 shadow-xl flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${item.color}20`, color: item.color }}
                  >
                    <Icon size={20} />
                  </span>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: item.color }}
                  />
                </div>
                <div>
                  <p
                    className="font-heading font-extrabold text-3xl mb-1 tracking-tight"
                    style={{ color: item.color }}
                  >
                    {item.value}
                  </p>
                  <p className="font-heading font-semibold text-sm text-white mb-1.5">
                    {item.label}
                  </p>
                  <p className="font-sans text-xs text-[#74A5D4] leading-relaxed">
                    {item.sub}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Overview from Keith Cote and Bruce McEvoy */}
        <section className="mb-24 rounded-[2rem] bg-gradient-to-br from-[#0A1C2E] via-[#081829] to-[#05101C] border border-[#239CEC]/25 p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#239CEC]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start relative z-10">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-[#239CEC]" />
                <span className="font-mono text-xs tracking-widest uppercase text-[#74A5D4] font-bold">
                  2026 Ministry Overview
                </span>
              </div>

              <h2 className="font-heading font-bold text-2xl sm:text-3xl md:text-4xl text-white mb-6 leading-tight">
                Overview from <span className="text-[#239CEC]">Keith Cote</span> and{' '}
                <span className="text-[#239CEC]">Bruce McEvoy</span>
              </h2>

              <div className="space-y-4 font-sans text-sm md:text-base text-[#E8E4DD]/90 leading-relaxed">
                <p>
                  This year has been incredibly busy and deeply fruitful. We have done much work supporting our friends in Cuba — including a trip in October that deeply encouraged our local team — and distributing financial support throughout the church to meet vital HOME needs.
                </p>
                <p>
                  We are super proud of the Youth Force Team and how they have stepped up to help our friends from Cuba in need.
                </p>
                <p>
                  Beyond Cuba, we have seen many incredible youth events taking place in Kenya, and so much is happening on the ground in Egypt. We also had the opportunity to head to Brazil to join the Dunamis Con&apos; 26, which helped us to create new connections and meet our old partners.
                </p>
                <p>
                  This ministry season has been full, and we are continually seeking to build new partnerships with more and more kingdom-minded organizations.
                </p>
                <p>
                  Looking ahead to next year, we are excited to visit the team in Cuba, Cade in Egypt and collaborate with even more youth ministries.
                </p>
                <p className="font-serif italic text-lg text-[#74A5D4] pt-1">
                  We cannot wait to share more stories and upcoming new adventures for the ministry as we move forward!
                </p>
              </div>
            </div>

            {/* Leadership Portraits & Looking Ahead Card */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/5 border border-white/10 p-3 text-center">
                  <div className="aspect-[4/5] rounded-xl overflow-hidden bg-[#071526] mb-3">
                    <img
                      src="/impact-report/keith-cote.png"
                      alt="Keith Cote"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <p className="font-heading font-bold text-base text-white">Keith Cote</p>
                  <p className="font-mono text-[11px] text-[#74A5D4] uppercase tracking-wider mt-0.5">
                    Youth Force Leadership
                  </p>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/10 p-3 text-center">
                  <div className="aspect-[4/5] rounded-xl overflow-hidden bg-[#071526] mb-3">
                    <img
                      src="/impact-report/bruce-mcevoy.png"
                      alt="Bruce McEvoy"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <p className="font-heading font-bold text-base text-white">Bruce McEvoy</p>
                  <p className="font-mono text-[11px] text-[#74A5D4] uppercase tracking-wider mt-0.5">
                    Youth Force Leadership
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-[#071526]/80 border border-[#239CEC]/25 p-5">
                <div className="flex items-center gap-2 text-[#239CEC] font-mono text-xs uppercase tracking-widest font-bold mb-2">
                  <Calendar size={14} />
                  <span>Looking Ahead to Next Year</span>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-white/80 font-sans">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#239CEC] mt-2 shrink-0" />
                    <span>Visit and strengthen the local ministry team in Cuba</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#239CEC] mt-2 shrink-0" />
                    <span>Visit Cade and the leadership teams serving in Egypt</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#239CEC] mt-2 shrink-0" />
                    <span>Collaborate with more kingdom-minded youth ministries</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Global Field Reports Section */}
        <section className="mb-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <span className="font-mono text-xs tracking-widest uppercase text-[#239CEC] font-bold">
                2026 Field Stories
              </span>
              <h2 className="font-heading font-bold text-3xl md:text-4xl text-white mt-1">
                Impact Around the World
              </h2>
            </div>

            {/* Region Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All Regions (4)' },
                { id: 'brazil', label: 'Brazil' },
                { id: 'egypt', label: 'Egypt' },
                { id: 'cuba', label: 'Cuba' },
                { id: 'kenya', label: 'Kenya' },
              ].map((tab) => {
                const isActive = activeRegion === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveRegion(tab.id)}
                    className={`px-4 py-2 rounded-full font-mono text-xs uppercase tracking-wider transition-all ${isActive
                        ? 'bg-[#239CEC] text-white shadow-lg shadow-[#239CEC]/25'
                        : 'bg-white/5 text-[#74A5D4] hover:bg-white/10 hover:text-white border border-white/10'
                      }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Region Cards */}
          <div className="space-y-12">
            {visibleRegions.map((region) => (
              <article
                key={region.id}
                className="rounded-[2rem] bg-[#0A1C2E] border border-white/10 overflow-hidden shadow-2xl"
              >
                {/* Top Globe Banner */}
                <div className="relative h-44 sm:h-56 overflow-hidden border-b border-white/10">
                  <img
                    src={region.globeImg}
                    alt={`${region.country} global highlight`}
                    className="w-full h-full object-cover object-center opacity-75"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(to top, #0A1C2E 5%, rgba(10, 28, 46, 0.55) 60%, rgba(7, 21, 38, 0.35) 100%)',
                    }}
                  />
                  <div className="absolute bottom-5 left-6 right-6 md:left-10 md:right-10 flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#071526]/80 border border-white/15 mb-2.5 backdrop-blur-md">
                        <MapPin size={12} style={{ color: region.accent }} />
                        <span className="font-mono text-[11px] uppercase tracking-widest text-[#E8E4DD]">
                          {region.tag}
                        </span>
                      </div>
                      <h3 className="font-heading font-bold text-2xl sm:text-3xl text-white">
                        {region.title}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Story + Gallery Body */}
                <div className="p-6 sm:p-8 md:p-10">
                  <div className="max-w-4xl space-y-4 mb-8">
                    {region.subtitle && (
                      <p className="font-mono text-xs uppercase tracking-widest text-[#239CEC] font-bold">
                        {region.subtitle}
                      </p>
                    )}
                    {region.greeting && (
                      <p className="font-heading font-semibold text-lg text-white">
                        {region.greeting}
                      </p>
                    )}
                    {region.paragraphs.map((p, idx) => (
                      <p
                        key={idx}
                        className="font-sans text-sm sm:text-base text-[#E8E4DD]/85 leading-relaxed"
                      >
                        {p}
                      </p>
                    ))}
                    {region.highlightQuote && (
                      <p className="font-serif italic text-xl text-[#239CEC] pt-1">
                        {region.highlightQuote}
                      </p>
                    )}
                    {region.donateCadeUrl && (
                      <div className="pt-2">
                        <a
                          href={region.donateCadeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#239CEC]/15 hover:bg-[#239CEC]/25 border border-[#239CEC]/40 text-xs font-mono uppercase tracking-wider text-white transition-all"
                        >
                          <Heart size={14} className="text-[#239CEC]" />
                          <span>Support Cade&apos;s Ministry in Egypt</span>
                          <ExternalLink size={12} className="opacity-70" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Photo Grid */}
                  <div
                    className={`grid gap-4 ${region.photos.length === 3
                        ? 'grid-cols-1 sm:grid-cols-3'
                        : region.photos.length === 4
                          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5'
                      }`}
                  >
                    {region.photos.map((photo) => (
                      <button
                        key={photo.src}
                        type="button"
                        onClick={() => setLightboxImage(photo)}
                        className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#071526] border border-white/10 hover:border-[#239CEC]/60 transition-all text-left"
                      >
                        <img
                          src={photo.src}
                          alt={photo.caption}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#071526]/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                          <div className="self-end w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white">
                            <ZoomIn size={14} />
                          </div>
                          <p className="font-sans text-[11px] text-white/95 leading-snug">
                            {photo.caption}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Our 4 Pillars in Action */}
        <section className="mb-20">
          <div className="mb-10">
            <span className="font-mono text-xs tracking-widest uppercase text-[#239CEC] font-bold">
              Our 4 Pillars in Action
            </span>
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-white mt-1">
              Identify • Awaken • Activate • Connect
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {pillarsData.map((p) => {
              const Icon = p.icon
              return (
                <div
                  key={p.num}
                  className="p-7 rounded-3xl bg-gradient-to-br from-[#0A1C2E] to-[#061220] border border-white/10 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <span
                        className="font-mono text-xs font-bold px-3 py-1 rounded-full uppercase"
                        style={{ background: `${p.accent}22`, color: p.accent }}
                      >
                        {p.num} — {p.pillar}
                      </span>
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: `${p.accent}20`, color: p.accent }}
                      >
                        <Icon size={17} />
                      </div>
                    </div>

                    <h3 className="font-heading font-bold text-lg text-white mb-3 leading-snug">
                      {p.title}
                    </h3>
                    <p className="font-sans text-sm text-white/75 leading-relaxed">
                      {p.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Closing Thank You & CTA */}
        <div className="text-center py-16 px-6 sm:px-10 rounded-[2.5rem] bg-gradient-to-r from-[#0D6EFD]/20 via-[#239CEC]/20 to-[#0A3B8C]/30 border border-[#239CEC]/35">
          <p className="font-mono text-xs tracking-widest uppercase text-[#74A5D4] font-bold mb-3">
            Thank You!
          </p>
          <h3 className="font-heading font-bold text-3xl md:text-4xl text-white mb-4">
            Connect With Us to Multiply This Impact
          </h3>
          <p className="font-sans text-sm md:text-base text-[#E8E4DD]/85 max-w-2xl mx-auto mb-8 leading-relaxed">
            Your prayers, generosity, and partnership make it possible to support local teams in Cuba, empower ministries in Kenya and Egypt, and connect thousands of young leaders across Brazil and beyond.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={onOpenPartnerModal}
              className="btn-signal text-xs font-mono tracking-widest"
            >
              <span>Connect With Us</span>
            </button>
            <a
              href={IMPACT_REPORT_PDF_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-blue text-xs font-mono tracking-widest flex items-center gap-2"
            >
              <Download size={14} />
              <span>Download 2026 PDF</span>
            </a>
            <a
              href="https://www.paypal.com/donate/?hosted_button_id=QGQSHE4NCW6CE"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-full text-xs font-mono tracking-widest uppercase text-white bg-white/10 hover:bg-white/15 border border-white/15 transition-all"
            >
              <Heart size={14} className="text-[#E63B2E]" />
              <span>Donate via PayPal</span>
            </a>
            <a
              href="https://www.paypal.com/donate/?hosted_button_id=Y2PMKT4AH8AJY"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-full text-xs font-mono tracking-widest uppercase text-white bg-white/10 hover:bg-[#239CEC]/20 border border-[#239CEC]/35 transition-all"
            >
              <Heart size={14} className="text-[#239CEC]" />
              <span>Donate to Cade</span>
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 md:px-12 py-12 mt-8 text-center text-xs text-white/40 font-mono">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/logos/gyf-blue-dark.png"
            alt="Global Youth Force"
            className="h-11 w-auto object-contain opacity-90"
          />
          <p>© {CURRENT_YEAR} Global Youth Foundation (Youth Force). All rights reserved.</p>
          <button
            onClick={onBackToHome}
            className="text-[#74A5D4] hover:text-white transition-colors"
          >
            ← Return to Landing Page
          </button>
        </div>
      </footer>

      {/* Photo Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
          onClick={() => setLightboxImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-w-4xl w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="self-end mb-3 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close photo"
            >
              <X size={20} />
            </button>
            <img
              src={lightboxImage.src}
              alt={lightboxImage.caption}
              className="max-h-[78vh] w-auto rounded-2xl border border-white/15 shadow-2xl object-contain"
            />
            {lightboxImage.caption && (
              <p className="mt-4 font-sans text-sm text-[#E8E4DD] text-center max-w-2xl">
                {lightboxImage.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
