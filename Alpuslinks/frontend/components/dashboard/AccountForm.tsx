"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { apiService } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import { X, Camera, Upload, Search, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AccountForm() {
  const { user, refreshUser } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [timezone, setTimezone] = useState('')
  const [language, setLanguage] = useState('')
  const [birthday, setBirthday] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const countryDropdownRef = useRef<HTMLDivElement | null>(null)

  // Comprehensive list of countries
  const countries = [
    { code: 'AF', name: 'Afghanistan' },
    { code: 'AL', name: 'Albania' },
    { code: 'DZ', name: 'Algeria' },
    { code: 'AS', name: 'American Samoa' },
    { code: 'AD', name: 'Andorra' },
    { code: 'AO', name: 'Angola' },
    { code: 'AI', name: 'Anguilla' },
    { code: 'AQ', name: 'Antarctica' },
    { code: 'AG', name: 'Antigua and Barbuda' },
    { code: 'AR', name: 'Argentina' },
    { code: 'AM', name: 'Armenia' },
    { code: 'AW', name: 'Aruba' },
    { code: 'AU', name: 'Australia' },
    { code: 'AT', name: 'Austria' },
    { code: 'AZ', name: 'Azerbaijan' },
    { code: 'BS', name: 'Bahamas' },
    { code: 'BH', name: 'Bahrain' },
    { code: 'BD', name: 'Bangladesh' },
    { code: 'BB', name: 'Barbados' },
    { code: 'BY', name: 'Belarus' },
    { code: 'BE', name: 'Belgium' },
    { code: 'BZ', name: 'Belize' },
    { code: 'BJ', name: 'Benin' },
    { code: 'BM', name: 'Bermuda' },
    { code: 'BT', name: 'Bhutan' },
    { code: 'BO', name: 'Bolivia' },
    { code: 'BA', name: 'Bosnia and Herzegovina' },
    { code: 'BW', name: 'Botswana' },
    { code: 'BV', name: 'Bouvet Island' },
    { code: 'BR', name: 'Brazil' },
    { code: 'IO', name: 'British Indian Ocean Territory' },
    { code: 'BN', name: 'Brunei Darussalam' },
    { code: 'BG', name: 'Bulgaria' },
    { code: 'BF', name: 'Burkina Faso' },
    { code: 'BI', name: 'Burundi' },
    { code: 'KH', name: 'Cambodia' },
    { code: 'CM', name: 'Cameroon' },
    { code: 'CA', name: 'Canada' },
    { code: 'CV', name: 'Cape Verde' },
    { code: 'KY', name: 'Cayman Islands' },
    { code: 'CF', name: 'Central African Republic' },
    { code: 'TD', name: 'Chad' },
    { code: 'CL', name: 'Chile' },
    { code: 'CN', name: 'China' },
    { code: 'CX', name: 'Christmas Island' },
    { code: 'CC', name: 'Cocos (Keeling) Islands' },
    { code: 'CO', name: 'Colombia' },
    { code: 'KM', name: 'Comoros' },
    { code: 'CG', name: 'Congo' },
    { code: 'CD', name: 'Congo, Democratic Republic of the' },
    { code: 'CK', name: 'Cook Islands' },
    { code: 'CR', name: 'Costa Rica' },
    { code: 'CI', name: 'Côte d\'Ivoire' },
    { code: 'HR', name: 'Croatia' },
    { code: 'CU', name: 'Cuba' },
    { code: 'CY', name: 'Cyprus' },
    { code: 'CZ', name: 'Czech Republic' },
    { code: 'DK', name: 'Denmark' },
    { code: 'DJ', name: 'Djibouti' },
    { code: 'DM', name: 'Dominica' },
    { code: 'DO', name: 'Dominican Republic' },
    { code: 'EC', name: 'Ecuador' },
    { code: 'EG', name: 'Egypt' },
    { code: 'SV', name: 'El Salvador' },
    { code: 'GQ', name: 'Equatorial Guinea' },
    { code: 'ER', name: 'Eritrea' },
    { code: 'EE', name: 'Estonia' },
    { code: 'ET', name: 'Ethiopia' },
    { code: 'FK', name: 'Falkland Islands (Malvinas)' },
    { code: 'FO', name: 'Faroe Islands' },
    { code: 'FJ', name: 'Fiji' },
    { code: 'FI', name: 'Finland' },
    { code: 'FR', name: 'France' },
    { code: 'GF', name: 'French Guiana' },
    { code: 'PF', name: 'French Polynesia' },
    { code: 'TF', name: 'French Southern Territories' },
    { code: 'GA', name: 'Gabon' },
    { code: 'GM', name: 'Gambia' },
    { code: 'GE', name: 'Georgia' },
    { code: 'DE', name: 'Germany' },
    { code: 'GH', name: 'Ghana' },
    { code: 'GI', name: 'Gibraltar' },
    { code: 'GR', name: 'Greece' },
    { code: 'GL', name: 'Greenland' },
    { code: 'GD', name: 'Grenada' },
    { code: 'GP', name: 'Guadeloupe' },
    { code: 'GU', name: 'Guam' },
    { code: 'GT', name: 'Guatemala' },
    { code: 'GG', name: 'Guernsey' },
    { code: 'GN', name: 'Guinea' },
    { code: 'GW', name: 'Guinea-Bissau' },
    { code: 'GY', name: 'Guyana' },
    { code: 'HT', name: 'Haiti' },
    { code: 'HM', name: 'Heard Island and McDonald Islands' },
    { code: 'VA', name: 'Holy See (Vatican City State)' },
    { code: 'HN', name: 'Honduras' },
    { code: 'HK', name: 'Hong Kong' },
    { code: 'HU', name: 'Hungary' },
    { code: 'IS', name: 'Iceland' },
    { code: 'IN', name: 'India' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'IR', name: 'Iran, Islamic Republic of' },
    { code: 'IQ', name: 'Iraq' },
    { code: 'IE', name: 'Ireland' },
    { code: 'IM', name: 'Isle of Man' },
    { code: 'IL', name: 'Israel' },
    { code: 'IT', name: 'Italy' },
    { code: 'JM', name: 'Jamaica' },
    { code: 'JP', name: 'Japan' },
    { code: 'JE', name: 'Jersey' },
    { code: 'JO', name: 'Jordan' },
    { code: 'KZ', name: 'Kazakhstan' },
    { code: 'KE', name: 'Kenya' },
    { code: 'KI', name: 'Kiribati' },
    { code: 'KP', name: 'Korea, Democratic People\'s Republic of' },
    { code: 'KR', name: 'Korea, Republic of' },
    { code: 'KW', name: 'Kuwait' },
    { code: 'KG', name: 'Kyrgyzstan' },
    { code: 'LA', name: 'Lao People\'s Democratic Republic' },
    { code: 'LV', name: 'Latvia' },
    { code: 'LB', name: 'Lebanon' },
    { code: 'LS', name: 'Lesotho' },
    { code: 'LR', name: 'Liberia' },
    { code: 'LY', name: 'Libya' },
    { code: 'LI', name: 'Liechtenstein' },
    { code: 'LT', name: 'Lithuania' },
    { code: 'LU', name: 'Luxembourg' },
    { code: 'MO', name: 'Macao' },
    { code: 'MK', name: 'Macedonia, the former Yugoslav Republic of' },
    { code: 'MG', name: 'Madagascar' },
    { code: 'MW', name: 'Malawi' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'MV', name: 'Maldives' },
    { code: 'ML', name: 'Mali' },
    { code: 'MT', name: 'Malta' },
    { code: 'MH', name: 'Marshall Islands' },
    { code: 'MQ', name: 'Martinique' },
    { code: 'MR', name: 'Mauritania' },
    { code: 'MU', name: 'Mauritius' },
    { code: 'YT', name: 'Mayotte' },
    { code: 'MX', name: 'Mexico' },
    { code: 'FM', name: 'Micronesia, Federated States of' },
    { code: 'MD', name: 'Moldova, Republic of' },
    { code: 'MC', name: 'Monaco' },
    { code: 'MN', name: 'Mongolia' },
    { code: 'ME', name: 'Montenegro' },
    { code: 'MS', name: 'Montserrat' },
    { code: 'MA', name: 'Morocco' },
    { code: 'MZ', name: 'Mozambique' },
    { code: 'MM', name: 'Myanmar' },
    { code: 'NA', name: 'Namibia' },
    { code: 'NR', name: 'Nauru' },
    { code: 'NP', name: 'Nepal' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'NC', name: 'New Caledonia' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'NI', name: 'Nicaragua' },
    { code: 'NE', name: 'Niger' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'NU', name: 'Niue' },
    { code: 'NF', name: 'Norfolk Island' },
    { code: 'MP', name: 'Northern Mariana Islands' },
    { code: 'NO', name: 'Norway' },
    { code: 'OM', name: 'Oman' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'PW', name: 'Palau' },
    { code: 'PS', name: 'Palestine, State of' },
    { code: 'PA', name: 'Panama' },
    { code: 'PG', name: 'Papua New Guinea' },
    { code: 'PY', name: 'Paraguay' },
    { code: 'PE', name: 'Peru' },
    { code: 'PH', name: 'Philippines' },
    { code: 'PN', name: 'Pitcairn' },
    { code: 'PL', name: 'Poland' },
    { code: 'PT', name: 'Portugal' },
    { code: 'PR', name: 'Puerto Rico' },
    { code: 'QA', name: 'Qatar' },
    { code: 'RE', name: 'Réunion' },
    { code: 'RO', name: 'Romania' },
    { code: 'RU', name: 'Russian Federation' },
    { code: 'RW', name: 'Rwanda' },
    { code: 'BL', name: 'Saint Barthélemy' },
    { code: 'SH', name: 'Saint Helena, Ascension and Tristan da Cunha' },
    { code: 'KN', name: 'Saint Kitts and Nevis' },
    { code: 'LC', name: 'Saint Lucia' },
    { code: 'MF', name: 'Saint Martin (French part)' },
    { code: 'PM', name: 'Saint Pierre and Miquelon' },
    { code: 'VC', name: 'Saint Vincent and the Grenadines' },
    { code: 'WS', name: 'Samoa' },
    { code: 'SM', name: 'San Marino' },
    { code: 'ST', name: 'Sao Tome and Principe' },
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'SN', name: 'Senegal' },
    { code: 'RS', name: 'Serbia' },
    { code: 'SC', name: 'Seychelles' },
    { code: 'SL', name: 'Sierra Leone' },
    { code: 'SG', name: 'Singapore' },
    { code: 'SX', name: 'Sint Maarten (Dutch part)' },
    { code: 'SK', name: 'Slovakia' },
    { code: 'SI', name: 'Slovenia' },
    { code: 'SB', name: 'Solomon Islands' },
    { code: 'SO', name: 'Somalia' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'GS', name: 'South Georgia and the South Sandwich Islands' },
    { code: 'SS', name: 'South Sudan' },
    { code: 'ES', name: 'Spain' },
    { code: 'LK', name: 'Sri Lanka' },
    { code: 'SD', name: 'Sudan' },
    { code: 'SR', name: 'Suriname' },
    { code: 'SJ', name: 'Svalbard and Jan Mayen' },
    { code: 'SZ', name: 'Swaziland' },
    { code: 'SE', name: 'Sweden' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'SY', name: 'Syrian Arab Republic' },
    { code: 'TW', name: 'Taiwan, Province of China' },
    { code: 'TJ', name: 'Tajikistan' },
    { code: 'TZ', name: 'Tanzania, United Republic of' },
    { code: 'TH', name: 'Thailand' },
    { code: 'TL', name: 'Timor-Leste' },
    { code: 'TG', name: 'Togo' },
    { code: 'TK', name: 'Tokelau' },
    { code: 'TO', name: 'Tonga' },
    { code: 'TT', name: 'Trinidad and Tobago' },
    { code: 'TN', name: 'Tunisia' },
    { code: 'TR', name: 'Turkey' },
    { code: 'TM', name: 'Turkmenistan' },
    { code: 'TC', name: 'Turks and Caicos Islands' },
    { code: 'TV', name: 'Tuvalu' },
    { code: 'UG', name: 'Uganda' },
    { code: 'UA', name: 'Ukraine' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' },
    { code: 'UM', name: 'United States Minor Outlying Islands' },
    { code: 'UY', name: 'Uruguay' },
    { code: 'UZ', name: 'Uzbekistan' },
    { code: 'VU', name: 'Vanuatu' },
    { code: 'VE', name: 'Venezuela, Bolivarian Republic of' },
    { code: 'VN', name: 'Viet Nam' },
    { code: 'VG', name: 'Virgin Islands, British' },
    { code: 'VI', name: 'Virgin Islands, U.S.' },
    { code: 'WF', name: 'Wallis and Futuna' },
    { code: 'EH', name: 'Western Sahara' },
    { code: 'YE', name: 'Yemen' },
    { code: 'ZM', name: 'Zambia' },
    { code: 'ZW', name: 'Zimbabwe' }
  ]

  // Filter countries based on search
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase())
  )

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '')
      setLastName(user.lastName || '')
      setAvatar(user.avatar || null)
      loadUserMeta()
    }
  }, [user])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Update country search when country changes
  useEffect(() => {
    if (country) {
      setCountrySearch(country)
    }
  }, [country])

  const loadUserMeta = async () => {
    try {
      const response = await apiService.getUserMeta()
      const userMeta = (response.data as any)?.userMeta
      if (userMeta) {
        setPhone(userMeta.phone || '')
        setLocation(userMeta.location || '')
        setCity(userMeta.city || '')
        setCountry(userMeta.country || '')
        setTimezone(userMeta.timezone || '')
        setLanguage(userMeta.language || '')
        setBirthday(userMeta.birthday || '')
      }
    } catch (err) {
      console.error('Failed to load user meta:', err)
    }
  }

  const handlePickImage = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setAvatar(result)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    
    // Validate password fields if any password field is filled
    if (currentPassword || newPassword || confirmPassword) {
      if (!currentPassword) {
        toast.error('Current password is required to change password')
        return
      }
      if (!newPassword) {
        toast.error('New password is required')
        return
      }
      if (newPassword !== confirmPassword) {
        toast.error('New passwords do not match')
        return
      }
      if (newPassword.length < 6) {
        toast.error('New password must be at least 6 characters long')
        return
      }
    }
    
    try {
      setSaving(true)
      
      // Update basic user info
      const updateData: any = {
        firstName,
        lastName,
        avatar,
      }
      
      // Only include password fields if they're being changed
      if (currentPassword && newPassword) {
        updateData.currentPassword = currentPassword
        updateData.newPassword = newPassword
        console.log('Password update data:', { hasCurrentPassword: !!currentPassword, hasNewPassword: !!newPassword })
      }
      
      console.log('Sending update data:', updateData)
      const userResponse = await apiService.updateUser(user.id, updateData)
      
      // Update user meta (phone, location, city, country, timezone, language)
      const metaData = {
        phone: phone.trim(),
        location: location.trim(),
        city: city.trim(),
        country: country.trim(),
        timezone: timezone.trim(),
        language: language.trim(),
        birthday: birthday.trim()
      }
      console.log('Sending meta data:', metaData)
      const metaResponse = await apiService.updateUserMeta(metaData)
      await refreshUser()
      
      // Clear password fields after successful update
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
      toast.success('Profile updated successfully')
    } catch (err: any) {
      console.error('AccountForm: Update failed', err)
      const message = err?.message || 'Failed to update'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl w-full mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header with close button */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Account Details</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {/* Photo Section */}
        <div className="mb-8">
          <div className="flex items-center gap-6">
            <div className="w-32 flex-shrink-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Avatar
              </label>
            </div>
            <div className="flex-1">
              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={handlePickImage}
                  className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 border-4 border-green-500 flex items-center justify-center hover:border-green-600 transition-colors cursor-pointer"
                >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
          ) : (
                    <div className="w-full h-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Camera className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                </button>
                {avatar && (
                  <button
                    type="button"
                    onClick={() => setAvatar(null)}
                    className="absolute -top-0 -right-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
          )}
        </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
      </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          {/* Name Row */}
          <div className="flex items-center">
            <div className="w-32 flex-shrink-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Name
              </label>
            </div>
            <div className="flex-1">
              <input 
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                value={`${firstName} ${lastName}`.trim()} 
                placeholder="Enter your full name"
                readOnly
              />
            </div>
          </div>

          {/* Phone Row */}
          <div className="flex items-center">
            <div className="w-32 flex-shrink-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone number
              </label>
            </div>
            <div className="flex-1">
              <input 
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                value={phone} 
                onChange={e => setPhone(e.target.value)}
                placeholder="Phone number"
              />
            </div>
          </div>

          {/* Email Row */}
          <div className="flex items-center">
            <div className="w-32 flex-shrink-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
            </div>
            <div className="flex-1">
              <input 
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                value={user?.email || ''} 
                placeholder="Email address"
                readOnly
              />
            </div>
          </div>

          {/* Address Row */}
          <div className="flex items-center">
            <div className="w-32 flex-shrink-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Address
              </label>
            </div>
            <div className="flex-1">
              <input 
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                value={location} 
                onChange={e => setLocation(e.target.value)}
                placeholder="Enter your address"
              />
            </div>
          </div>

          {/* Country Row */}
          <div className="flex items-center">
            <div className="w-32 flex-shrink-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Country
              </label>
            </div>
            <div className="flex-1 relative" ref={countryDropdownRef}>
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white pr-10"
                  placeholder="Search countries..."
                  value={countrySearch}
                  onChange={(e) => {
                    setCountrySearch(e.target.value)
                    setShowCountryDropdown(true)
                  }}
                  onFocus={() => setShowCountryDropdown(true)}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              
              {showCountryDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map((countryItem) => (
                      <button
                        key={countryItem.code}
                        type="button"
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 focus:bg-gray-100 dark:focus:bg-gray-600 focus:outline-none"
                        onClick={() => {
                          setCountry(countryItem.name)
                          setCountrySearch(countryItem.name)
                          setShowCountryDropdown(false)
                        }}
                      >
                        {countryItem.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-500 dark:text-gray-400">
                      No countries found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* City Row */}
          <div className="flex items-center">
            <div className="w-32 flex-shrink-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                City
              </label>
        </div>
            <div className="flex-1">
              <input 
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="City"
              />
        </div>
        </div>

          {/* Timezone Row */}
          <div className="flex items-center">
            <div className="w-32 flex-shrink-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Timezone
              </label>
        </div>
            <div className="flex-1">
              <select 
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                value={timezone} 
                onChange={e => setTimezone(e.target.value)}
              >
                <option value="">Select timezone...</option>
                <option value="UTC-12:00">UTC-12:00 (Baker Island)</option>
                <option value="UTC-11:00">UTC-11:00 (American Samoa)</option>
                <option value="UTC-10:00">UTC-10:00 (Hawaii)</option>
                <option value="UTC-09:00">UTC-09:00 (Alaska)</option>
                <option value="UTC-08:00">UTC-08:00 (Pacific Time)</option>
                <option value="UTC-07:00">UTC-07:00 (Mountain Time)</option>
                <option value="UTC-06:00">UTC-06:00 (Central Time)</option>
                <option value="UTC-05:00">UTC-05:00 (Eastern Time)</option>
                <option value="UTC-04:00">UTC-04:00 (Atlantic Time)</option>
                <option value="UTC-03:00">UTC-03:00 (Brazil)</option>
                <option value="UTC-02:00">UTC-02:00 (Mid-Atlantic)</option>
                <option value="UTC-01:00">UTC-01:00 (Azores)</option>
                <option value="UTC+00:00">UTC+00:00 (GMT/London)</option>
                <option value="UTC+01:00">UTC+01:00 (Central Europe)</option>
                <option value="UTC+02:00">UTC+02:00 (Eastern Europe)</option>
                <option value="UTC+03:00">UTC+03:00 (Moscow)</option>
                <option value="UTC+04:00">UTC+04:00 (Gulf)</option>
                <option value="UTC+05:00">UTC+05:00 (Pakistan)</option>
                <option value="UTC+05:30">UTC+05:30 (India)</option>
                <option value="UTC+06:00">UTC+06:00 (Bangladesh)</option>
                <option value="UTC+07:00">UTC+07:00 (Thailand)</option>
                <option value="UTC+08:00">UTC+08:00 (China)</option>
                <option value="UTC+09:00">UTC+09:00 (Japan)</option>
                <option value="UTC+10:00">UTC+10:00 (Australia)</option>
                <option value="UTC+11:00">UTC+11:00 (Solomon Islands)</option>
                <option value="UTC+12:00">UTC+12:00 (New Zealand)</option>
          </select>
        </div>
          </div>

                 {/* Language Row */}
                 <div className="flex items-center">
                   <div className="w-32 flex-shrink-0">
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                       Language
                     </label>
                   </div>
                   <div className="flex-1">
                     <select
                       className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                       value={language}
                       onChange={e => setLanguage(e.target.value)}
                     >
                       <option value="">Select language...</option>
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="German">German</option>
            <option value="Italian">Italian</option>
            <option value="Portuguese">Portuguese</option>
            <option value="Russian">Russian</option>
            <option value="Japanese">Japanese</option>
            <option value="Korean">Korean</option>
                       <option value="Chinese">Chinese</option>
            <option value="Arabic">Arabic</option>
            <option value="Hindi">Hindi</option>
            <option value="Dutch">Dutch</option>
            <option value="Swedish">Swedish</option>
            <option value="Norwegian">Norwegian</option>
            <option value="Danish">Danish</option>
            <option value="Finnish">Finnish</option>
            <option value="Polish">Polish</option>
            <option value="Turkish">Turkish</option>
            <option value="Thai">Thai</option>
            <option value="Vietnamese">Vietnamese</option>
            <option value="Indonesian">Indonesian</option>
            <option value="Malay">Malay</option>
                       <option value="Filipino">Filipino</option>
                       <option value="Hebrew">Hebrew</option>
                       <option value="Ukrainian">Ukrainian</option>
                       <option value="Czech">Czech</option>
                       <option value="Hungarian">Hungarian</option>
                       <option value="Romanian">Romanian</option>
                       <option value="Bulgarian">Bulgarian</option>
                       <option value="Croatian">Croatian</option>
                       <option value="Slovak">Slovak</option>
                       <option value="Slovenian">Slovenian</option>
                       <option value="Estonian">Estonian</option>
                       <option value="Latvian">Latvian</option>
                       <option value="Lithuanian">Lithuanian</option>
                       <option value="Greek">Greek</option>
                       <option value="Icelandic">Icelandic</option>
                       <option value="Irish">Irish</option>
                       <option value="Welsh">Welsh</option>
                       <option value="Maltese">Maltese</option>
                       <option value="Catalan">Catalan</option>
                       <option value="Basque">Basque</option>
                       <option value="Galician">Galician</option>
                       <option value="Afrikaans">Afrikaans</option>
                       <option value="Swahili">Swahili</option>
                       <option value="Amharic">Amharic</option>
                       <option value="Bengali">Bengali</option>
                       <option value="Gujarati">Gujarati</option>
                       <option value="Kannada">Kannada</option>
                       <option value="Malayalam">Malayalam</option>
                       <option value="Marathi">Marathi</option>
                       <option value="Nepali">Nepali</option>
                       <option value="Punjabi">Punjabi</option>
                       <option value="Sinhala">Sinhala</option>
                       <option value="Tamil">Tamil</option>
                       <option value="Telugu">Telugu</option>
                       <option value="Urdu">Urdu</option>
          </select>
        </div>
      </div>

                 {/* Birthday Row */}
                 <div className="flex items-center">
                   <div className="w-32 flex-shrink-0">
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                       Birthday
                     </label>
                   </div>
                   <div className="flex-1">
                     <input
                       type="date"
                       className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                       value={birthday}
                       onChange={e => setBirthday(e.target.value)}
                     />
                   </div>
                 </div>
        </div>

        {/* Password Section - Optional */}
        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Change Password (Optional)</h3>
          <div className="space-y-6">
            <div className="flex items-center">
              <div className="w-32 flex-shrink-0">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Current Password
                </label>
              </div>
              <div className="flex-1">
                <input 
                  type="password" 
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                  value={currentPassword} 
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-32 flex-shrink-0">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  New Password
                </label>
              </div>
              <div className="flex-1">
                <input 
                  type="password" 
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-32 flex-shrink-0">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm Password
                </label>
          </div>
              <div className="flex-1">
                <input 
                  type="password" 
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
          </div>
          </div>
        </div>
      </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button 
            disabled={saving} 
            type="submit" 
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
    </div>
  )
}


