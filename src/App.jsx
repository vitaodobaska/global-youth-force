import { useEffect, useRef, useState, useMemo } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  ArrowRight,
  Globe,
  Users,
  BookOpen,
  ChevronDown,
  Menu,
  X,
  MapPin,
  Mail,
  Heart,
  ExternalLink,
  Sparkles,
  Send,
  CheckCircle2,
  Share2,
  FileText,
  Search,
  Check,
  Phone,
  AlertCircle
} from 'lucide-react'
import { defaultCountries, parseCountry, getActiveFormattingMask } from 'react-international-phone'
import { isValidPhoneNumber, isPossiblePhoneNumber } from 'libphonenumber-js/min'
import { sendPartnershipEmails } from './services/emailService'
import './index.css'
import ImpactReportPage from './ImpactReportPage'

gsap.registerPlugin(ScrollTrigger)

// ─────────────────────────────────────────────────────────────────────────────
// PRE-PROCESSED ALL WORLD COUNTRY CODES (Fast, Memoized, Zero Network Lag)
// ─────────────────────────────────────────────────────────────────────────────
const ALL_COUNTRIES = defaultCountries.map((c) => {
  const parsed = parseCountry(c)
  const codePoints = parsed.iso2
    ? parsed.iso2
        .toUpperCase()
        .split('')
        .map((char) => 127397 + char.charCodeAt(0))
    : []
  return {
    name: parsed.name,
    iso2: parsed.iso2,
    dialCode: parsed.dialCode,
    rawFormat: parsed.format,
    flag: String.fromCodePoint(...codePoints),
  }
})

// Helper to calculate maximum digits allowed according to selected country mask
function getCountryMaxDigits(country) {
  if (!country) return 15
  const mask = getActiveFormattingMask({ phone: '999999999999999', country }) || ''
  const dots = (mask.match(/\./g) || []).length
  return dots > 0 ? dots : 15
}

// Helper to format digits according to selected country mask, strictly capping length
function formatPhoneNumber(rawDigits, country) {
  if (!rawDigits) return ''
  let digits = rawDigits.replace(/\D/g, '')
  if (!digits) return ''

  // Strictly cap length to country mask maximum (prevents typing infinite digits/zeros)
  const maxDigits = getCountryMaxDigits(country)
  if (digits.length > maxDigits) {
    digits = digits.slice(0, maxDigits)
  }

  const mask = getActiveFormattingMask({ phone: digits, country }) || '............'
  let result = ''
  let digitIdx = 0

  for (let i = 0; i < mask.length; i++) {
    if (digitIdx >= digits.length) break
    if (mask[i] === '.') {
      result += digits[digitIdx++]
    } else {
      result += mask[i]
    }
  }

  return result
}

// Validation helper using official ITU-T rules via libphonenumber-js and dummy detection
function validatePhoneNumber(rawPhone, country) {
  if (!rawPhone || !rawPhone.trim()) {
    return { isValid: false, message: 'Phone number is required.' }
  }

  const digits = rawPhone.replace(/\D/g, '')
  if (!digits) {
    return { isValid: false, message: 'Please enter numbers only.' }
  }

  // 1. Detect dummy repeated numbers (e.g. all zeros: 0000000000, 1111111111)
  if (/^(\d)\1+$/.test(digits)) {
    return {
      isValid: false,
      message: 'Invalid phone number (all repeating digits like 000-0000 are not permitted).',
    }
  }

  // 2. Minimum length check
  if (digits.length < 5) {
    return {
      isValid: false,
      message: 'Phone number is too short for this country.',
    }
  }

  // 3. Libphonenumber validation against country standard
  const iso2 = (country?.iso2 || 'us').toUpperCase()
  const dialCode = country?.dialCode || '1'
  const fullE164 = `+${dialCode}${digits}`

  try {
    const isPossible = isPossiblePhoneNumber(fullE164, iso2)
    if (!isPossible) {
      return {
        isValid: false,
        message: `Phone number length does not match standard for ${country?.name || 'this country'}.`,
      }
    }

    const isValid = isValidPhoneNumber(fullE164, iso2)
    if (!isValid) {
      return {
        isValid: false,
        message: `Invalid phone number for ${country?.name || 'this country'}.`,
      }
    }
  } catch (err) {
    if (digits.length < 7 || digits.length > 15) {
      return {
        isValid: false,
        message: 'Invalid phone number length.',
      }
    }
  }

  return { isValid: true, message: '' }
}

// Helper to get contextual placeholder matching country standard
function getCountryPlaceholder(country) {
  if (!country) return '(000) 123-1212'
  if (country.iso2 === 'us' || country.iso2 === 'ca') return '(000) 123-1212'
  if (country.iso2 === 'br') return '(00) 12345-6789'
  const mask = getActiveFormattingMask({ phone: '9999999999', country })
  if (mask && typeof mask === 'string') {
    return mask.replace(/\./g, '0')
  }
  return '(000) 000-0000'
}

// ─────────────────────────────────────────────────────────────────────────────
// BECOME A PARTNER MODAL (REFORMULATED WITH SEPARATE COUNTRY CODE & AUTO-REPLY)
// ─────────────────────────────────────────────────────────────────────────────
function PartnerModal({ isOpen, onClose }) {
  // Default country: US (or fallback to first)
  const defaultCountry = useMemo(
    () => ALL_COUNTRIES.find((c) => c.iso2 === 'us') || ALL_COUNTRIES[0],
    []
  )
  const [selectedCountry, setSelectedCountry] = useState(defaultCountry)
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    organization: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [phoneTouched, setPhoneTouched] = useState(false)

  // Handle escape key and body lock
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (countryDropdownOpen) {
          setCountryDropdownOpen(false)
        } else {
          onClose()
        }
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, countryDropdownOpen])

  // Click outside to close country dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setCountryDropdownOpen(false)
      }
    }
    if (countryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      if (searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 50)
      }
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [countryDropdownOpen])

  if (!isOpen) return null

  // Strictly block any non-digit keystrokes (only allowing numbers and navigation/edit keys)
  const handlePhoneKeyDown = (e) => {
    // Allow control & navigation keys
    const allowedKeys = [
      'Backspace',
      'Delete',
      'Tab',
      'Escape',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
    ]
    if (allowedKeys.includes(e.key)) return

    // Allow clipboard/editing shortcuts: Ctrl/Cmd + A, C, V, X, Z
    if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x', 'z'].includes(e.key.toLowerCase())) {
      return
    }

    // Strictly reject any character that is NOT a digit (0-9)
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault()
    }
  }

  // Sanitize pasted content to numbers only
  const handlePhonePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData?.getData('text') || ''
    const numericOnly = pasted.replace(/\D/g, '')
    if (!numericOnly) return

    const formatted = formatPhoneNumber(numericOnly, selectedCountry)
    setFormData((prev) => ({ ...prev, phone: formatted }))
    setPhoneTouched(true)

    const validation = validatePhoneNumber(formatted, selectedCountry)
    setPhoneError(validation.isValid ? '' : validation.message)
  }

  // Handle phone changes with automatic country masking and length capping
  const handlePhoneChange = (e) => {
    const val = e.target.value
    const formatted = formatPhoneNumber(val, selectedCountry)
    setFormData((prev) => ({ ...prev, phone: formatted }))
    setPhoneTouched(true)

    if (!formatted) {
      setPhoneError('Phone number is required.')
      return
    }

    const validation = validatePhoneNumber(formatted, selectedCountry)
    setPhoneError(validation.isValid ? '' : validation.message)
  }

  // Validate on blur when user leaves the phone input
  const handlePhoneBlur = () => {
    setPhoneTouched(true)
    const validation = validatePhoneNumber(formData.phone, selectedCountry)
    setPhoneError(validation.isValid ? '' : validation.message)
  }

  // Handle selecting a country from the dropdown
  const handleSelectCountry = (country) => {
    setSelectedCountry(country)
    setCountryDropdownOpen(false)
    setCountrySearch('')

    // Re-format current digits according to new country mask and re-validate
    if (formData.phone) {
      const remapped = formatPhoneNumber(formData.phone, country)
      setFormData((prev) => ({ ...prev, phone: remapped }))
      if (phoneTouched) {
        const validation = validatePhoneNumber(remapped, country)
        setPhoneError(validation.isValid ? '' : validation.message)
      }
    }
  }

  // Filter countries in real-time
  const filteredCountries = ALL_COUNTRIES.filter((c) => {
    const q = countrySearch.toLowerCase().trim()
    if (!q) return true
    return (
      c.name.toLowerCase().includes(q) ||
      c.dialCode.includes(q.replace(/\+/g, '')) ||
      c.iso2.toLowerCase().includes(q)
    )
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setPhoneTouched(true)

    // Enforce strict phone number validation against selected country
    const phoneValidation = validatePhoneNumber(formData.phone, selectedCountry)
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.message)
      return
    }

    setLoading(true)
    setErrorMsg('')

    try {
      // Dispatches email notification to team and auto-reply to applicant
      await sendPartnershipEmails({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        countryCode: selectedCountry.dialCode,
        countryName: selectedCountry.name,
        phone: formData.phone,
        organization: formData.organization,
        message: formData.message,
      })

      setLoading(false)
      setSubmitted(true)
    } catch (err) {
      console.error('Error submitting partnership request:', err)
      setLoading(false)
      setErrorMsg('An error occurred while submitting. Please try again.')
    }
  }

  const handleReset = () => {
    setSubmitted(false)
    setErrorMsg('')
    setPhoneError('')
    setPhoneTouched(false)
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      organization: '',
      message: '',
    })
    setSelectedCountry(defaultCountry)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#071526]/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-[#0A1C2E] border border-[#239CEC]/40 text-white shadow-[0_25px_60px_-15px_rgba(7,21,38,0.7)] z-10 transition-all max-h-[92vh] flex flex-col">
        {/* Top Accent Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#239CEC] via-[#0D6EFD] to-[#E63B2E]" />

        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#239CEC]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 pt-6 pb-4 border-b border-white/10 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#239CEC] animate-pulse" />
              <span className="font-mono text-xs tracking-widest text-[#74A5D4] uppercase">
                Global Kingdom Network
              </span>
            </div>
            <h3 className="font-heading text-2xl font-bold text-white tracking-tight">
              Become a Partner
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 sm:px-8 py-6 overflow-y-auto flex-1 relative z-10">
          {submitted ? (
            <div className="py-6 text-center flex flex-col items-center">
              {/* Animated Success Badge */}
              <div className="w-16 h-16 rounded-full bg-[#239CEC]/20 border-2 border-[#239CEC] flex items-center justify-center text-[#239CEC] mb-5 shadow-[0_0_25px_rgba(35,156,236,0.4)]">
                <CheckCircle2 size={36} className="text-[#239CEC]" />
              </div>

              <h4 className="font-heading text-2xl font-bold text-white mb-2">
                Thank You, {formData.firstName || 'Partner'}!
              </h4>

              {/* Confirmation Highlight Message */}
              <div className="my-4 px-6 py-4 rounded-2xl bg-gradient-to-r from-[#239CEC]/15 via-[#0D6EFD]/20 to-[#239CEC]/15 border border-[#239CEC]/40 shadow-inner max-w-md">
                <p className="font-drama italic text-lg sm:text-xl text-white leading-snug">
                  “Thanks for reaching out! We'll be in touch with you soon!”
                </p>
              </div>

              <p className="font-sans text-sm text-[#74A5D4] max-w-md leading-relaxed mb-6">
                A confirmation email has been dispatched to{' '}
                <strong className="text-white font-medium">{formData.email}</strong>. Our
                leadership team at Global Youth Force will review your details and reach out
                promptly.
              </p>

              {/* Summary Card */}
              <div className="w-full max-w-md p-4 rounded-xl bg-white/5 border border-white/10 text-left mb-6 text-xs font-mono space-y-1.5 text-gray-300">
                <div className="flex justify-between">
                  <span className="text-gray-400">ORGANIZATION:</span>
                  <span className="text-white font-semibold truncate max-w-[200px]">
                    {formData.organization || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">DIRECT PHONE:</span>
                  <span className="text-white font-semibold">
                    +{selectedCountry.dialCode} {formData.phone}
                  </span>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="btn-blue text-xs font-mono tracking-widest px-8 py-3 rounded-full"
              >
                <span>Close Window</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="font-sans text-sm text-[#74A5D4] leading-relaxed mb-4">
                Join our mission to empower, activate, and connect young leaders worldwide. Fill
                out the details below and we will connect with you.
              </p>

              {/* Row 1: Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs text-[#74A5D4] uppercase tracking-wider mb-1.5">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="John"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#239CEC] focus:ring-1 focus:ring-[#239CEC] transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs text-[#74A5D4] uppercase tracking-wider mb-1.5">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Doe"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#239CEC] focus:ring-1 focus:ring-[#239CEC] transition-colors"
                  />
                </div>
              </div>

              {/* Row 2: Email & Phone with Separate Country Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs text-[#74A5D4] uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@organization.org"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#239CEC] focus:ring-1 focus:ring-[#239CEC] transition-colors"
                  />
                </div>

                {/* Separate Country Code & Formatted Phone Number */}
                <div className="relative">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block font-mono text-xs text-[#74A5D4] uppercase tracking-wider">
                      Phone Number *
                    </label>
                    <span className="font-mono text-[10px] text-white/50 uppercase truncate max-w-[120px]">
                      {selectedCountry.name}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {/* Country Code Trigger Button */}
                    <div className="relative shrink-0" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                        className={`h-full px-3 py-3 rounded-xl bg-white/5 border text-white text-sm flex items-center gap-1.5 transition-all focus:outline-none ${
                          countryDropdownOpen
                            ? 'border-[#239CEC] ring-2 ring-[#239CEC]/20 bg-white/10'
                            : 'border-white/10 hover:border-[#239CEC]/50 hover:bg-white/10'
                        }`}
                        title={`Selected: ${selectedCountry.name} (+${selectedCountry.dialCode})`}
                      >
                        <span className="text-xl leading-none">{selectedCountry.flag}</span>
                        <span className="font-mono text-xs font-semibold text-[#74A5D4]">
                          +{selectedCountry.dialCode}
                        </span>
                        <ChevronDown
                          size={14}
                          className={`text-white/60 transition-transform duration-200 ${
                            countryDropdownOpen ? 'rotate-180 text-[#239CEC]' : ''
                          }`}
                        />
                      </button>

                      {/* Searchable Country Code Dropdown */}
                      {countryDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 z-50 w-72 sm:w-80 rounded-2xl bg-[#0A1C2E] border border-[#239CEC]/40 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden max-h-72">
                          {/* Search Header */}
                          <div className="p-2.5 border-b border-white/10 bg-white/5 sticky top-0 z-10">
                            <div className="relative">
                              <Search
                                size={14}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#74A5D4]"
                              />
                              <input
                                ref={searchInputRef}
                                type="text"
                                value={countrySearch}
                                onChange={(e) => setCountrySearch(e.target.value)}
                                placeholder="Search country or +code..."
                                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#239CEC]"
                              />
                            </div>
                          </div>

                          {/* Country List */}
                          <div className="overflow-y-auto divide-y divide-white/5 flex-1">
                            {filteredCountries.length > 0 ? (
                              filteredCountries.map((c) => {
                                const isSelected = c.iso2 === selectedCountry.iso2
                                return (
                                  <button
                                    key={c.iso2}
                                    type="button"
                                    onClick={() => handleSelectCountry(c)}
                                    className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition-colors ${
                                      isSelected
                                        ? 'bg-[#239CEC]/20 text-white font-semibold'
                                        : 'hover:bg-white/10 text-gray-200'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 truncate pr-2">
                                      <span className="text-base leading-none">{c.flag}</span>
                                      <span className="truncate">{c.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className="font-mono text-[#74A5D4]">+{c.dialCode}</span>
                                      {isSelected && <Check size={13} className="text-[#239CEC]" />}
                                    </div>
                                  </button>
                                )
                              })
                            ) : (
                              <div className="p-4 text-center text-xs text-gray-400">
                                No countries found
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Phone Input with Dynamic Formatting Mask & Strict Verification */}
                    <div className="flex-1 min-w-0">
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="tel-national"
                        required
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        onKeyDown={handlePhoneKeyDown}
                        onPaste={handlePhonePaste}
                        onBlur={handlePhoneBlur}
                        placeholder={getCountryPlaceholder(selectedCountry)}
                        className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-white/30 text-sm focus:outline-none transition-colors font-mono tracking-wide ${
                          phoneTouched && phoneError
                            ? 'border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500/50'
                            : phoneTouched && formData.phone && !phoneError
                            ? 'border-emerald-500/60 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400'
                            : 'border-white/10 focus:border-[#239CEC] focus:ring-1 focus:ring-[#239CEC]'
                        }`}
                      />
                      {phoneTouched && phoneError && (
                        <p className="text-[11px] font-mono text-red-400 mt-1.5 flex items-center gap-1.5 animate-fadeIn">
                          <AlertCircle size={13} className="shrink-0 text-red-400" />
                          <span>{phoneError}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Organization */}
              <div>
                <label className="block font-mono text-xs text-[#74A5D4] uppercase tracking-wider mb-1.5">
                  Organization / Church *
                </label>
                <input
                  type="text"
                  required
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  placeholder="e.g. Grace Community Church / Youth Ministry"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#239CEC] focus:ring-1 focus:ring-[#239CEC] transition-colors"
                />
              </div>

              {/* Row 4: Message */}
              <div>
                <label className="block font-mono text-xs text-[#74A5D4] uppercase tracking-wider mb-1.5">
                  How would you like to connect with us? *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your heart for youth leadership, potential collaboration, or questions..."
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#239CEC] focus:ring-1 focus:ring-[#239CEC] transition-colors resize-none"
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs">
                  {errorMsg}
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-blue justify-center text-xs font-mono tracking-widest py-3.5 rounded-xl shadow-lg hover:shadow-cyan-500/20 transition-all"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting & Dispatching Confirmation...</span>
                    </div>
                  ) : (
                    <>
                      <span>Submit Partnership Request</span>
                      <Send size={15} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// NAVBAR
// ─────────────────────────────────────────────────────────────────────────────
function Navbar({ onOpenPartnerModal, onNavigate }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [donateOpen, setDonateOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDonateOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // The 3 future tabs configured in navbar
  const navTabs = [
    { name: 'About', href: '#about' },
    { name: 'Impact', href: '#mission' },
    { name: 'Partners', href: '#partners' },
  ]

  const handleLinkClick = (href) => {
    if (onNavigate) onNavigate('home')
    setMenuOpen(false)
  }

  return (
    <nav
      id="navbar"
      className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-500 border-b ${scrolled
        ? 'bg-[#0A1C2E]/95 backdrop-blur-xl border-[#239CEC]/30 shadow-2xl'
        : 'bg-[#071526]/85 backdrop-blur-md border-white/10'
        }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-12 py-4 md:py-5">
        {/* Logo */}
        <a
          href="#"
          onClick={() => handleLinkClick('#')}
          className="flex items-center shrink-0"
          aria-label="Global Youth Force Home"
        >
          <img
            src="./logos/gyf-orange-dark.png"
            alt="Global Youth Force"
            className="h-10 sm:h-12 md:h-14 w-auto object-contain"
          />
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {navTabs.map((tab) => (
            <a
              key={tab.name}
              href={tab.href}
              onClick={() => handleLinkClick(tab.href)}
              className="font-mono text-xs md:text-sm tracking-widest uppercase text-white/85 hover:text-[#74A5D4] transition-colors duration-200"
            >
              {tab.name}
            </a>
          ))}

          {/* Donate Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDonateOpen(!donateOpen)}
              onMouseEnter={() => setDonateOpen(true)}
              className="flex items-center gap-1.5 font-mono text-xs md:text-sm tracking-widest uppercase text-[#74A5D4] hover:text-[#239CEC] transition-colors py-1"
              aria-expanded={donateOpen}
            >
              <Heart size={14} className="text-[#E63B2E]" />
              <span>Donate</span>
              <ChevronDown
                size={15}
                className={`transition-transform duration-200 ${donateOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {donateOpen && (
              <div
                onMouseLeave={() => setDonateOpen(false)}
                className="absolute top-full left-0 mt-3 w-56 rounded-2xl bg-[#0A1C2E] border border-[#239CEC]/30 shadow-2xl py-2 z-50 animate-dropdown"
              >
                <a
                  href="https://www.paypal.com/donate/?hosted_button_id=QGQSHE4NCW6CE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-2.5 text-xs font-mono tracking-wider text-white/90 hover:bg-[#239CEC]/15 hover:text-[#239CEC] transition-colors"
                >
                  <span>Donate to GYF</span>
                  <ExternalLink size={12} className="opacity-60" />
                </a>
                <div className="h-px bg-white/10 mx-3 my-1" />
                <a
                  href="https://www.paypal.com/donate/?hosted_button_id=Y2PMKT4AH8AJY"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-2.5 text-xs font-mono tracking-wider text-white/90 hover:bg-[#239CEC]/15 hover:text-[#239CEC] transition-colors"
                >
                  <span>Donate to Cade</span>
                  <ExternalLink size={12} className="opacity-60" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onOpenPartnerModal}
          className="hidden md:inline-flex btn-signal text-xs md:text-sm"
          style={{ padding: '11px 24px' }}
        >
          <span>Connect With Us</span>
        </button>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 text-white/90 hover:text-white"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden px-6 pb-6 pt-3 flex flex-col gap-4 border-t border-white/10 bg-[#0A1C2E]"
        >
          {navTabs.map((tab) => (
            <a
              key={tab.name}
              href={tab.href}
              className="font-mono text-xs tracking-widest uppercase text-white/90 hover:text-[#74A5D4]"
              onClick={() => setMenuOpen(false)}
            >
              {tab.name}
            </a>
          ))}

          {/* Mobile Donate Section */}
          <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
            <span className="font-mono text-[10px] tracking-widest uppercase text-[#74A5D4] flex items-center gap-1">
              <Heart size={11} className="text-[#E63B2E]" /> Donate Options
            </span>
            <a
              href="https://www.paypal.com/donate/?hosted_button_id=QGQSHE4NCW6CE"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-white/80 hover:text-[#239CEC] flex items-center justify-between pl-2"
              onClick={() => setMenuOpen(false)}
            >
              <span>Donate to GYF</span>
              <ExternalLink size={12} />
            </a>
            <a
              href="https://www.paypal.com/donate/?hosted_button_id=Y2PMKT4AH8AJY"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-white/80 hover:text-[#239CEC] flex items-center justify-between pl-2"
              onClick={() => setMenuOpen(false)}
            >
              <span>Donate to Cade</span>
              <ExternalLink size={12} />
            </a>
          </div>

          <button
            onClick={() => {
              setMenuOpen(false)
              onOpenPartnerModal()
            }}
            className="btn-signal text-xs text-center justify-center mt-2"
          >
            <span>Connect With Us</span>
          </button>
        </div>
      )}
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO SECTION (Video Background)
// ─────────────────────────────────────────────────────────────────────────────
function Hero({ onOpenPartnerModal }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-label', { opacity: 0, y: 30, duration: 1, ease: 'power3.out', delay: 0.2 })
      gsap.from('.hero-line-1', { opacity: 0, y: 40, duration: 1.1, ease: 'power3.out', delay: 0.35 })
      gsap.from('.hero-line-2', { opacity: 0, y: 40, duration: 1.1, ease: 'power3.out', delay: 0.5 })
      gsap.from('.hero-body', { opacity: 0, y: 30, duration: 1, ease: 'power3.out', delay: 0.7 })
      gsap.from('.hero-cta', { opacity: 0, y: 30, duration: 1, ease: 'power3.out', delay: 0.9 })
    }, containerRef)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={containerRef}
      id="hero"
      className="relative w-full overflow-hidden"
      style={{ height: '100dvh', minHeight: '640px' }}
    >
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover scale-105"
      >
        <source src="./gyf-background-video.mp4" type="video/mp4" />
      </video>

      {/* Cinematic Ambient Overlay — Infused with GYF Deep Blue */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, #071526 0%, rgba(10, 28, 46, 0.8) 50%, rgba(7, 21, 38, 0.45) 100%)',
        }}
      />

      {/* Subtle Glow Accents */}
      <div className="absolute top-1/4 left-10 w-96 h-96 rounded-full bg-[#239CEC]/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-[#E63B2E]/10 blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end px-8 md:px-16 pb-20 md:pb-28 max-w-5xl">
        {/* <div className="hero-label inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#239CEC]/20 border border-[#239CEC]/40 mb-6 w-fit">
          <span className="w-2 h-2 rounded-full bg-[#239CEC] animate-ping" />
          <p className="font-mono text-xs tracking-widest text-[#74A5D4] uppercase">
            Global Youth Foundation
          </p>
        </div>  */}

        <h1 className="leading-none mb-6">
          <span
            className="hero-line-1 block font-heading font-bold text-white tracking-tight"
            style={{ fontSize: 'clamp(2.8rem, 6.5vw, 6.5rem)', lineHeight: 1 }}
          >
            Global Youth
          </span>
          <span
            className="hero-line-2 block font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-[#E63B2E] via-[#FF6B4A] to-[#239CEC]"
            style={{
              fontSize: 'clamp(4rem, 11vw, 11rem)',
              lineHeight: 0.95,
              letterSpacing: '-0.02em',
            }}
          >
            Force.
          </span>
        </h1>

        <p
          className="hero-body font-sans text-base md:text-lg max-w-xl mb-8 leading-relaxed"
          style={{ color: 'rgba(232, 240, 254, 0.85)' }}
        >
          Empowering young leaders to be a force for good in their world for Jesus. We awaken, activate, equip, and connect the next generation.
        </p>

        {/* Removed "explore our programs" button as requested */}
        <div className="hero-cta flex flex-wrap gap-4 items-center">
          <button
            onClick={onOpenPartnerModal}
            className="btn-signal flex items-center gap-2 group"
          >
            <span>Connect With Us</span>
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </button>

          <a
            href="#about"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-mono tracking-widest text-[#74A5D4] hover:text-white bg-white/5 hover:bg-white/10 border border-[#239CEC]/30 transition-all"
          >
            <span>Learn More</span>
            <ChevronDown size={14} />
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 right-8 hidden sm:flex flex-col items-center gap-2 pointer-events-none">
        <span
          className="font-mono text-[11px] tracking-widest text-[#74A5D4]/60"
          style={{ writingMode: 'vertical-rl' }}
        >
          DISCOVER
        </span>
        <ChevronDown size={14} className="text-[#239CEC]/70 animate-bounce" />
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// OUR MISSION (Formerly What We Do)
// ─────────────────────────────────────────────────────────────────────────────
function OurMission({ onNavigate }) {
  // 4 consistent, lean pillar cards ordered Identify -> Awaken -> Activate -> Connect
  // Styled with a progressive blue palette from light sky blue to deep navy blue
  const missionCards = [
    {
      num: '01',
      category: 'Identify',
      title: 'Identify young leaders creating impact in their local communities',
      desc: 'Identifying emerging, Christ-centered young leaders who are already faithfully serving and making a tangible impact right where they are planted.',
      tag: 'Discovery • Impact • Local Reach',
      icon: Search,
      accentColor: '#5BA4E5',
      badgeBg: 'rgba(116, 165, 212, 0.18)',
      badgeTextColor: '#3B82C4',
    },
    {
      num: '02',
      category: 'Awaken',
      title: 'Awaken them to an authentic relationship with Jesus',
      desc: 'Awakening young leaders beyond religious routine into a genuine walk with Jesus Christ, discovering their true identity in Him.',
      tag: 'Identity • Encounter • Faith',
      icon: BookOpen,
      accentColor: '#239CEC',
      badgeBg: 'rgba(35, 156, 236, 0.16)',
      badgeTextColor: '#1B82C8',
    },
    {
      num: '03',
      category: 'Activate',
      title: 'Activate them to dream and pursue what God is calling them to',
      desc: 'Igniting vision and courage, empowering emerging leaders to discover their spiritual gifts and boldly pursue Kingdom impact.',
      tag: 'Purpose • Calling • Vision',
      icon: Globe,
      accentColor: '#0D6EFD',
      badgeBg: 'rgba(13, 110, 253, 0.15)',
      badgeTextColor: '#0B5ED7',
    },
    {
      num: '04',
      category: 'Connect',
      title: 'Connect them to a community of growth',
      desc: 'Connecting leaders to international peer cohorts, local churches, and global alliances—because we are truly better together.',
      tag: 'Global Reach • Unity • Cohorts',
      icon: Share2,
      accentColor: '#0A3B8C',
      badgeBg: 'rgba(10, 59, 140, 0.15)',
      badgeTextColor: '#0A3B8C',
    },
  ]

  return (
    <section
      id="mission"
      className="relative px-6 md:px-16 py-24 md:py-36 overflow-hidden"
      style={{ background: '#071526' }}
    >
      {/* Background Image — transferred from What We Are About */}
      <div
        className="absolute inset-0 opacity-35 mix-blend-luminosity"
        style={{
          backgroundImage: `url('./about-bg.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      />

      {/* Deep Blue & Atmospheric Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 60% 20%, rgba(35, 156, 236, 0.15) 0%, rgba(7, 21, 38, 0.9) 70%, #071526 100%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14 border-b border-white/10 pb-10">
          <div>
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#239CEC]" />
              <p className="font-mono text-xs tracking-widest text-[#74A5D4] uppercase font-bold">
                Our Mission
              </p>
            </div>
            {/* Title requested by user */}
            <h2
              className="font-heading font-bold leading-tight text-white"
              style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.8rem)', letterSpacing: '-0.03em' }}
            >
              Four Ways we invest in<br />
              <span className="font-serif italic text-[#239CEC]">young leaders globally.</span>
            </h2>
          </div>

          <div className="flex flex-col items-start md:items-end gap-4 max-w-md">
            <p className="font-sans text-sm md:text-base leading-relaxed text-[#E8E4DD]/80">
              Every program, mentorship tool, and alliance is built around four foundational pillars to raise up the next generation of Christ-centered leaders.
            </p>
            {/* Check our impact report button */}
            <button
              onClick={() => onNavigate && onNavigate('impact-report')}
              className="btn-blue text-xs font-mono tracking-widest inline-flex items-center gap-2 py-3 px-6 rounded-full"
            >
              <FileText size={15} />
              <span>Check our impact report</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* 4 Cards in uniform design & progressive blue palette */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {missionCards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.num}
                className="mission-card p-7"
              >
                <div>
                  {/* Top Bar with Number & Icon */}
                  <div className="flex items-center justify-between mb-5">
                    <span
                      className="font-mono text-xs font-bold tracking-widest px-3 py-1 rounded-full uppercase"
                      style={{ background: card.badgeBg, color: card.badgeTextColor }}
                    >
                      {card.num} — {card.category}
                    </span>
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: card.badgeBg, color: card.badgeTextColor }}
                    >
                      <Icon size={19} />
                    </div>
                  </div>

                  {/* Card Title */}
                  <h3 className="font-heading font-bold text-lg leading-snug mb-3 text-[#111111]">
                    {card.title}
                  </h3>

                  {/* Concise Card Description */}
                  <p className="font-sans text-sm leading-relaxed text-[#555]">
                    {card.desc}
                  </p>
                </div>

                {/* Footer Tag */}
                <div className="pt-6 border-t border-gray-100 flex items-center justify-between mt-6">
                  <span
                    className="font-mono text-[11px] font-medium tracking-wider"
                    style={{ color: card.badgeTextColor }}
                  >
                    {card.tag}
                  </span>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: card.accentColor }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WHAT WE ARE ABOUT (Formerly Philosophy)
// ─────────────────────────────────────────────────────────────────────────────
function WhatWeAreAbout() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.about-content', {
        opacity: 0,
        y: 40,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.about-content', start: 'top 75%' },
      })
      gsap.from('.speech-bubble-container', {
        opacity: 0,
        scale: 0.95,
        y: 30,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.speech-bubble-container', start: 'top 85%' },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative w-full py-32 md:py-48 px-6 md:px-16 overflow-hidden"
      style={{ background: '#071526' }}
    >
      {/* Deep Blue & Atmospheric Overlay (Background image transferred to Our Mission) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 70% 30%, rgba(35, 156, 236, 0.18) 0%, rgba(7, 21, 38, 0.95) 70%, #071526 100%)',
        }}
      />

      <div className="relative max-w-5xl mx-auto z-10 about-content">
        {/* Added Title: "What We Are About" with prominent standout font */}
        <div className="mb-10">
          <h2
            className="font-heading font-extrabold tracking-tight text-white"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', lineHeight: 1.05 }}
          >
            What We Are <span className="text-[#239CEC]">About</span>
          </h2>
        </div>

        {/* Removed comparison to other ministries */}
        {/* Altered text to "We focus on CREATING KINGDOM IMPACT" */}
        <div className="mb-14">
          <p
            className="font-sans font-bold text-lg md:text-xl text-[#74A5D4] tracking-wider uppercase mb-3"
          >
            We focus on:
          </p>
          <h3
            className="font-heading font-black tracking-tight leading-none text-white mb-6 uppercase"
            style={{
              fontSize: 'clamp(2.5rem, 7.5vw, 6.5rem)',
              textShadow: '0 4px 30px rgba(35, 156, 236, 0.35)',
            }}
          >
            CREATING{' '}
            <span
              className="text-transparent bg-clip-text bg-gradient-to-r from-[#E63B2E] via-[#FF6B4A] to-[#239CEC]"
            >
              KINGDOM IMPACT.
            </span>
          </h3>
          <p
            className="font-serif italic text-xl md:text-3xl text-white/90 max-w-2xl leading-relaxed"
          >
            Forming the character and calling of every{' '}
            <span className="text-[#239CEC] underline decoration-[#E63B2E] underline-offset-8">
              young leader
            </span>{' '}
            who will shape the world.
          </p>
        </div>

        {/* John C. Maxwell Quote inside a Speech Bubble */}
        <div className="speech-bubble-container max-w-2xl mt-16">
          <div className="speech-bubble">
            <blockquote className="font-sans text-base md:text-lg text-white/95 leading-relaxed italic">
              "A leader is great not because of their power but because of their ability to empower others."
            </blockquote>
          </div>
          <div className="flex items-center gap-3 mt-5 ml-6">
            {/* <div className="w-8 h-8 rounded-full bg-[#239CEC] flex items-center justify-center text-white font-heading font-bold text-xs">
              JM
            </div> */}
            <div>
              <p className="font-mono text-s font-semibold text-white tracking-wide">
                John C. Maxwell
              </p>
              <p className="font-mono text-sm text-[#74A5D4]">
                Leadership Author & Mentor
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTNER WITH US (Replaces Join the Movement & Protocol)
// ─────────────────────────────────────────────────────────────────────────────
function PartnerWithUs({ onOpenPartnerModal }) {
  const sectionRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.partner-box', {
        opacity: 0,
        y: 40,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.partner-box', start: 'top 80%' },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="connect-with-us"
      className="px-6 md:px-16 py-28 md:py-36 relative overflow-hidden"
      style={{ background: '#F5F3EE' }}
    >
      <div className="max-w-5xl mx-auto partner-box">
        {/* Card Box Container with Royal Blue + Deep Navy Aesthetic */}
        <div className="relative rounded-[2.5rem] bg-gradient-to-br from-[#0A1C2E] via-[#071526] to-[#040D17] border border-[#239CEC]/30 p-8 sm:p-14 md:p-20 text-white shadow-2xl overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#239CEC]/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#E63B2E]/15 blur-3xl pointer-events-none" />

          {/* Section Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#239CEC]/20 border border-[#239CEC]/40 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#239CEC] animate-pulse" />
            <p className="font-mono text-xs tracking-widest text-[#74A5D4] uppercase font-bold">
              Join the Movement
            </p>
          </div>

          {/* Title */}
          <h2
            className="font-heading font-bold text-white tracking-tight mb-6 leading-tight"
            style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)' }}
          >
            Connect <span className="text-[#239CEC]">With Us.</span>
          </h2>

          {/* Persuasive Professional Copy */}
          <p className="font-sans text-base md:text-lg text-[#E8E4DD]/90 max-w-3xl leading-relaxed mb-6">
            Empowering the next generation is not a solo endeavor — it is a worldwide movement of pastors, mentors, churches, and kingdom supporters. When you partner with Youth Force, you are not simply giving; you are activating disciples, transforming local communities, and raising up courageous young leaders for Jesus Christ.
          </p>

          <p className="font-sans text-sm md:text-base text-[#74A5D4] max-w-2xl leading-relaxed mb-10">
            Whether you want to sponsor our global leadership initiatives, integrate our training into your church, or walk alongside us in ministry, your support fuels direct generational impact.
          </p>

          {/* Action Buttons: Become a Partner (Modal) & Donate (PayPal Link) */}
          <div className="flex flex-wrap gap-4 items-center">
            <button
              onClick={onOpenPartnerModal}
              className="btn-signal flex items-center gap-2"
            >
              <span>Become a Partner</span>
              <ArrowRight size={16} />
            </button>

            <a
              href="https://www.paypal.com/donate/?hosted_button_id=QGQSHE4NCW6CE"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-blue flex items-center gap-2"
            >
              <Heart size={16} className="text-white" />
              <span>Donate via PayPal</span>
              <ExternalLink size={14} className="opacity-70" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTNERS LOGOS
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// PARTNERS LOGOS & INTERACTIVE HOVER BALLOONS
// ─────────────────────────────────────────────────────────────────────────────
function Partners() {
  const [hoveredIndex, setHoveredIndex] = useState(null)

  // Partners accurately extracted via Firecrawl from globalyouthforce.org/about
  // Descriptions are 100% faithful to the original site (sem tirar e nem adicionar nada)
  const partnersList = [
    {
      id: 'gls-nextgen',
      name: 'Global Leadership Summit - Next Gen',
      logo: './partners/gls-nextgen-logo-new.png',
      fallbackLogo: './partners/gln-next-gen-logo.png',
      description:
        'A transformational leadership experience designed to awaken students’ leadership, faith, and life journey. These leadership resources will activate young leaders to be a Force for Good in their world!',
      url: 'https://nextgen.glni.org/',
    },
    {
      id: 'wea',
      name: 'World Evangelical Alliance',
      logo: './partners/partner-wea-sm.png',
      fallbackLogo: 'https://globalyouthforce.org/images/2018/11/08/partner-wea-sm.png',
      description:
        'World Evangelical Alliance is a global ministry working with local churches around the world to join in common concern to live and proclaim the Good News of Jesus in their communities. Seeking holiness, justice and renewal at every level of society - individual, family, community and culture, God is glorified and the nations of the earth are forever transformed.',
      url: 'https://worldea.org/',
    },
    {
      id: 'fca',
      name: 'Fellowship of Christian Athletes',
      logo: './partners/fca-logo.webp',
      fallbackLogo: 'https://globalyouthforce.org/images/2026/04/06/fca-logo-horizontal-color.webp',
      description:
        'Since 1954, the Fellowship of Christian Athletes has been challenging coaches and athletes on the professional, college, high school, junior high and youth levels to use the powerful medium of athletics to impact the world for Jesus Christ. FCA focuses on serving local communities by equipping, empowering and encouraging people to make a difference for Christ through the local FCA huddles.',
      url: 'https://metrochicagofca.org/',
    },
    {
      id: 'aea',
      name: 'Asian Evangelicals Alliance',
      logo: './partners/aea-logo.webp',
      fallbackLogo: 'https://globalyouthforce.org/images/2026/04/06/aea-logo.webp',
      description:
        'AEA promotes and nurtures unity, collaborations and cooperation among ministry organizations, church networks and primarily the National Evangelical Alliances within Asia and with those outside Asia for the purpose of building, strengthening and expanding the Kingdom of God in Asia and beyond.',
      url: 'https://asiaevangelicals.org/',
    },
    {
      id: 'icete',
      name: 'ICETE',
      logo: './partners/icete-logo.webp',
      fallbackLogo: 'https://globalyouthforce.org/images/2026/04/06/icete-logo.webp',
      description:
        'ICETE advances quality and collaboration in global theological education to strengthen and accompany the church in its mission. ICETE is a global community, sponsored by seven regional associations of theological schools, to enable international interaction and collaboration among all those concerned for the enhancement of evangelical theological education worldwide.',
      url: 'https://icete.info/',
    },
  ]

  return (
    <section
      id="partners"
      className="px-6 md:px-16 py-24 md:py-32 border-t border-[rgba(17,17,17,0.08)] relative overflow-visible"
      style={{ background: '#F5F3EE' }}
    >
      <div className="max-w-6xl mx-auto relative">
        <div className="text-center mb-16">
          <p className="font-mono text-xs tracking-widest uppercase text-[#239CEC] font-bold mb-3 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#239CEC] inline-block animate-pulse"></span>
            Strategic Alliances
          </p>
          <h3 className="font-heading font-bold text-3xl md:text-4xl text-[#111111]">
            Global Ministry Partners
          </h3>
          <p className="text-sm md:text-base text-[#6B6B6B] mt-3 max-w-2xl mx-auto leading-relaxed">
            We partner with these global organizations in different ways: from support to collaboration to shared initiatives.
          </p>
        </div>

        {/* Partners Logos Grid */}
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 relative">
          {partnersList.map((partner, index) => {
            const isHovered = hoveredIndex === index

            return (
              <div
                key={partner.id}
                className="relative group"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* ─── EXPANDABLE BALLOON POPOVER ────────────────────────── */}
                <div
                  className={`absolute bottom-[calc(100%+14px)] z-50 w-[310px] sm:w-[360px] md:w-[400px] max-w-[calc(100vw-32px)] transition-all duration-300 origin-bottom pointer-events-none ${isHovered
                    ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto shadow-[0_25px_50px_-12px_rgba(7,21,38,0.5),0_0_25px_rgba(35,156,236,0.25)]'
                    : 'opacity-0 scale-50 translate-y-6'
                    } ${index === 0
                      ? 'left-0 sm:left-1/2 sm:-translate-x-1/4'
                      : index === partnersList.length - 1
                        ? 'right-0 sm:left-1/2 sm:-translate-x-3/4'
                        : 'left-1/2 -translate-x-1/2'
                    }`}
                  style={{
                    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {/* Invisible hover bridge to prevent hover loss when moving mouse */}
                  <div className="absolute -bottom-4 left-0 right-0 h-5 bg-transparent" />

                  {/* Speech Balloon Body */}
                  <div className="relative rounded-2xl bg-[#0A1C2E] border border-[#239CEC]/40 p-6 text-left shadow-2xl backdrop-blur-xl">
                    {/* Glowing highlight corner */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#239CEC]/10 rounded-full blur-2xl pointer-events-none" />

                    {/* Close button for mobile tap */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setHoveredIndex(null)
                      }}
                      className="sm:hidden absolute top-4 right-4 text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 z-10"
                      title="Close"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    {/* Organization Name */}
                    <h4 className="font-heading font-bold text-lg text-white leading-snug mb-2 pr-6 sm:pr-0">
                      {partner.name}
                    </h4>

                    {/* Verbatim Description from official website */}
                    <p className="font-sans text-xs sm:text-sm text-[#E2E8F0] leading-relaxed mb-5 font-normal">
                      {partner.description}
                    </p>

                    {/* Visit the Website Button */}
                    <div className="pt-4 border-t border-white/10 flex items-center justify-start">
                      <a
                        href={partner.url || '#'}
                        onClick={(e) => {
                          if (!partner.url) {
                            e.preventDefault()
                          }
                        }}
                        target={partner.url ? '_blank' : '_self'}
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider font-semibold text-white bg-[#239CEC] hover:bg-[#0D6EFD] transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 group/btn"
                      >
                        <span>Visit the website</span>
                        <svg
                          className="w-3.5 h-3.5 transform group-hover/btn:translate-x-1 transition-transform duration-200"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </a>
                    </div>

                    {/* Balloon Arrow / Pointer pointing to the logo */}
                    <div
                      className={`absolute top-full w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-[#0A1C2E] ${index === 0
                        ? 'left-10 sm:left-1/4'
                        : index === partnersList.length - 1
                          ? 'right-10 sm:right-1/4'
                          : 'left-1/2 -translate-x-1/2'
                        }`}
                    />
                  </div>
                </div>

                {/* ─── LOGO BADGE (DEFAULT VISIBLE ELEMENT - UNIFORM LARGER SIZE) ─── */}
                <div
                  className={`w-60 sm:w-64 md:w-72 h-32 md:h-36 rounded-2xl md:rounded-3xl bg-white border p-6 sm:p-7 flex items-center justify-center cursor-pointer transition-all duration-300 select-none ${isHovered
                    ? 'border-[#239CEC] shadow-2xl scale-[1.03] ring-4 ring-[#239CEC]/20 bg-white'
                    : 'border-gray-200/80 shadow-sm hover:border-[#239CEC]/50 hover:shadow-lg'
                    }`}
                  onClick={() => setHoveredIndex(isHovered ? null : index)}
                  title={`${partner.name} — Click or hover to read more`}
                >
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className={`max-h-16 md:max-h-20 max-w-[190px] md:max-w-[220px] w-auto h-auto object-contain transition-all duration-300 ${isHovered
                      ? 'grayscale-0 opacity-100 scale-105'
                      : 'grayscale opacity-75 group-hover:grayscale-0 group-hover:opacity-100'
                      }`}
                    onError={(e) => {
                      // Fallback to official web URL if local load fails
                      if (e.currentTarget.src !== partner.fallbackLogo) {
                        e.currentTarget.src = partner.fallbackLogo
                      }
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────────────────────
function Footer({ onOpenPartnerModal }) {
  return (
    <footer
      id="footer"
      className="px-8 md:px-16 pt-20 pb-12"
      style={{ background: '#071526', borderRadius: '3.5rem 3.5rem 0 0' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 border-b pb-16 border-white/10">
          {/* Brand */}
          <div className="md:col-span-2">
            <img
              src="./logos/gyf-blue-dark.png"
              alt="Global Youth Force"
              className="h-12 sm:h-14 w-auto object-contain mb-4"
            />
            <p className="font-sans text-sm max-w-sm leading-relaxed mb-6 text-[#74A5D4]">
              Empowering young leaders to be a force for good in their world for Jesus. Awakening, activating, equipping, and connecting globally.
            </p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#239CEC] animate-ping" />
              <span className="font-mono text-xs text-[#74A5D4]/80">
                GLOBAL KINGDOM MOVEMENT
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className="font-mono text-xs tracking-widest uppercase mb-5 text-[#239CEC] font-bold">
              Navigation
            </p>
            <div className="flex flex-col gap-3">
              <a
                href="#about"
                className="font-sans text-sm text-white/70 hover:text-white transition-colors"
              >
                About
              </a>
              <a
                href="#mission"
                className="font-sans text-sm text-white/70 hover:text-white transition-colors"
              >
                Impact
              </a>
              <a
                href="#partners"
                className="font-sans text-sm text-white/70 hover:text-white transition-colors"
              >
                Partners
              </a>
              <button
                onClick={onOpenPartnerModal}
                className="font-sans text-sm text-left text-[#E63B2E] hover:underline"
              >
                Become a Partner
              </button>
            </div>
          </div>

          {/* Donate & Contact */}
          <div>
            <p className="font-mono text-xs tracking-widest uppercase mb-5 text-[#239CEC] font-bold">
              Support & Contact
            </p>
            <div className="flex flex-col gap-3">
              <a
                href="https://www.paypal.com/donate/?hosted_button_id=QGQSHE4NCW6CE"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-white/90 hover:text-[#239CEC] transition-colors"
              >
                <Heart size={14} className="text-[#E63B2E]" />
                Donate to GYF
              </a>
              <a
                href="https://www.paypal.com/donate/?hosted_button_id=Y2PMKT4AH8AJY"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-white/90 hover:text-[#239CEC] transition-colors"
              >
                <Heart size={14} className="text-[#239CEC]" />
                Donate to Cade
              </a>
              <div className="pt-2 flex items-start gap-2 text-white/50">
                <MapPin size={14} className="mt-1 flex-shrink-0 text-[#74A5D4]" />
                <span className="font-mono text-xs leading-relaxed">
                  Global Youth Foundation<br />
                  2206 N Main St #276<br />
                  Wheaton, IL 60187, USA
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-mono text-xs text-white/40">
            © {new Date().getFullYear()} Global Youth Foundation (Youth Force). All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="https://globalyouthforce.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-[#74A5D4]/70 hover:text-white transition-colors flex items-center gap-1"
            >
              <span>globalyouthforce.org</span>
              <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [partnerModalOpen, setPartnerModalOpen] = useState(false)
  const [currentRoute, setCurrentRoute] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#/impact-report')) {
      return 'impact-report'
    }
    return 'home'
  })

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash.startsWith('#/impact-report')) {
        setCurrentRoute('impact-report')
        window.scrollTo(0, 0)
      } else {
        setCurrentRoute('home')
      }
    }
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  const navigateTo = (route) => {
    if (route === 'impact-report') {
      window.location.hash = '#/impact-report'
      setCurrentRoute('impact-report')
      window.scrollTo(0, 0)
    } else {
      window.location.hash = '#/'
      setCurrentRoute('home')
      window.scrollTo(0, 0)
    }
  }

  // If on the Impact Report page view
  if (currentRoute === 'impact-report') {
    return (
      <div className="min-h-screen bg-[#071526]">
        <ImpactReportPage
          onBackToHome={() => navigateTo('home')}
          onOpenPartnerModal={() => setPartnerModalOpen(true)}
        />
        <PartnerModal
          isOpen={partnerModalOpen}
          onClose={() => setPartnerModalOpen(false)}
        />
      </div>
    )
  }

  // Landing Page view with inverted sections
  return (
    <div className="min-h-screen bg-[#F5F3EE]">
      <Navbar
        onOpenPartnerModal={() => setPartnerModalOpen(true)}
        onNavigate={navigateTo}
      />
      <main>
        {/* 1. Hero */}
        <Hero onOpenPartnerModal={() => setPartnerModalOpen(true)} />

        {/* 2. What We Are About (Inverted: now precedes Our Mission) */}
        <WhatWeAreAbout />

        {/* 3. Our Mission (Inverted: now follows What We Are About, contains background image and impact report button) */}
        <OurMission
          onOpenPartnerModal={() => setPartnerModalOpen(true)}
          onNavigate={navigateTo}
        />

        {/* 4. Partner With Us */}
        <PartnerWithUs onOpenPartnerModal={() => setPartnerModalOpen(true)} />

        {/* 5. Partners */}
        <Partners />
      </main>
      <Footer onOpenPartnerModal={() => setPartnerModalOpen(true)} />

      {/* Interactive Become a Partner Modal */}
      <PartnerModal
        isOpen={partnerModalOpen}
        onClose={() => setPartnerModalOpen(false)}
      />
    </div>
  )
}
