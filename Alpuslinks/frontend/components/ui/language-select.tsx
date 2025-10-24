"use client"

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search } from 'lucide-react'

interface Language {
  value: string
  label: string
  flag: string
  code: string
}

const languages: Language[] = [
  // Major Global Languages
  { value: 'en', label: 'English', flag: '🇺🇸', code: 'US' },
  { value: 'es', label: 'Spanish', flag: '🇪🇸', code: 'ES' },
  { value: 'fr', label: 'French', flag: '🇫🇷', code: 'FR' },
  { value: 'de', label: 'German', flag: '🇩🇪', code: 'DE' },
  { value: 'it', label: 'Italian', flag: '🇮🇹', code: 'IT' },
  { value: 'pt', label: 'Portuguese', flag: '🇵🇹', code: 'PT' },
  { value: 'ru', label: 'Russian', flag: '🇷🇺', code: 'RU' },
  { value: 'ja', label: 'Japanese', flag: '🇯🇵', code: 'JP' },
  { value: 'ko', label: 'Korean', flag: '🇰🇷', code: 'KR' },
  { value: 'zh', label: 'Chinese', flag: '🇨🇳', code: 'CN' },
  { value: 'ar', label: 'Arabic', flag: '🇸🇦', code: 'SA' },
  { value: 'hi', label: 'Hindi', flag: '🇮🇳', code: 'IN' },
  
  // European Languages
  { value: 'nl', label: 'Dutch', flag: '🇳🇱', code: 'NL' },
  { value: 'sv', label: 'Swedish', flag: '🇸🇪', code: 'SE' },
  { value: 'no', label: 'Norwegian', flag: '🇳🇴', code: 'NO' },
  { value: 'da', label: 'Danish', flag: '🇩🇰', code: 'DK' },
  { value: 'fi', label: 'Finnish', flag: '🇫🇮', code: 'FI' },
  { value: 'pl', label: 'Polish', flag: '🇵🇱', code: 'PL' },
  { value: 'cs', label: 'Czech', flag: '🇨🇿', code: 'CZ' },
  { value: 'sk', label: 'Slovak', flag: '🇸🇰', code: 'SK' },
  { value: 'hu', label: 'Hungarian', flag: '🇭🇺', code: 'HU' },
  { value: 'ro', label: 'Romanian', flag: '🇷🇴', code: 'RO' },
  { value: 'bg', label: 'Bulgarian', flag: '🇧🇬', code: 'BG' },
  { value: 'hr', label: 'Croatian', flag: '🇭🇷', code: 'HR' },
  { value: 'sr', label: 'Serbian', flag: '🇷🇸', code: 'RS' },
  { value: 'sl', label: 'Slovenian', flag: '🇸🇮', code: 'SI' },
  { value: 'et', label: 'Estonian', flag: '🇪🇪', code: 'EE' },
  { value: 'lv', label: 'Latvian', flag: '🇱🇻', code: 'LV' },
  { value: 'lt', label: 'Lithuanian', flag: '🇱🇹', code: 'LT' },
  { value: 'el', label: 'Greek', flag: '🇬🇷', code: 'GR' },
  { value: 'is', label: 'Icelandic', flag: '🇮🇸', code: 'IS' },
  { value: 'ga', label: 'Irish', flag: '🇮🇪', code: 'IE' },
  { value: 'cy', label: 'Welsh', flag: '🇬🇧', code: 'GB' },
  { value: 'mt', label: 'Maltese', flag: '🇲🇹', code: 'MT' },
  { value: 'mk', label: 'Macedonian', flag: '🇲🇰', code: 'MK' },
  { value: 'sq', label: 'Albanian', flag: '🇦🇱', code: 'AL' },
  { value: 'bs', label: 'Bosnian', flag: '🇧🇦', code: 'BA' },
  { value: 'me', label: 'Montenegrin', flag: '🇲🇪', code: 'ME' },
  { value: 'tr', label: 'Turkish', flag: '🇹🇷', code: 'TR' },
  
  // Asian Languages
  { value: 'zh-cn', label: 'Chinese (Simplified)', flag: '🇨🇳', code: 'CN' },
  { value: 'zh-tw', label: 'Chinese (Traditional)', flag: '🇹🇼', code: 'TW' },
  { value: 'vi', label: 'Vietnamese', flag: '🇻🇳', code: 'VN' },
  { value: 'th', label: 'Thai', flag: '🇹🇭', code: 'TH' },
  { value: 'id', label: 'Indonesian', flag: '🇮🇩', code: 'ID' },
  { value: 'ms', label: 'Malay', flag: '🇲🇾', code: 'MY' },
  { value: 'tl', label: 'Filipino', flag: '🇵🇭', code: 'PH' },
  { value: 'km', label: 'Khmer', flag: '🇰🇭', code: 'KH' },
  { value: 'lo', label: 'Lao', flag: '🇱🇦', code: 'LA' },
  { value: 'my', label: 'Burmese', flag: '🇲🇲', code: 'MM' },
  { value: 'si', label: 'Sinhala', flag: '🇱🇰', code: 'LK' },
  { value: 'ta', label: 'Tamil', flag: '🇱🇰', code: 'LK' },
  { value: 'te', label: 'Telugu', flag: '🇮🇳', code: 'IN' },
  { value: 'bn', label: 'Bengali', flag: '🇧🇩', code: 'BD' },
  { value: 'ur', label: 'Urdu', flag: '🇵🇰', code: 'PK' },
  { value: 'fa', label: 'Persian', flag: '🇮🇷', code: 'IR' },
  { value: 'ps', label: 'Pashto', flag: '🇦🇫', code: 'AF' },
  { value: 'uz', label: 'Uzbek', flag: '🇺🇿', code: 'UZ' },
  { value: 'kk', label: 'Kazakh', flag: '🇰🇿', code: 'KZ' },
  { value: 'ky', label: 'Kyrgyz', flag: '🇰🇬', code: 'KG' },
  { value: 'tg', label: 'Tajik', flag: '🇹🇯', code: 'TJ' },
  { value: 'tk', label: 'Turkmen', flag: '🇹🇲', code: 'TM' },
  { value: 'mn', label: 'Mongolian', flag: '🇲🇳', code: 'MN' },
  { value: 'bo', label: 'Tibetan', flag: '🇨🇳', code: 'CN' },
  { value: 'dz', label: 'Dzongkha', flag: '🇧🇹', code: 'BT' },
  { value: 'ne', label: 'Nepali', flag: '🇳🇵', code: 'NP' },
  
  // African Languages
  { value: 'sw', label: 'Swahili', flag: '🇹🇿', code: 'TZ' },
  { value: 'am', label: 'Amharic', flag: '🇪🇹', code: 'ET' },
  { value: 'ha', label: 'Hausa', flag: '🇳🇬', code: 'NG' },
  { value: 'yo', label: 'Yoruba', flag: '🇳🇬', code: 'NG' },
  { value: 'ig', label: 'Igbo', flag: '🇳🇬', code: 'NG' },
  { value: 'zu', label: 'Zulu', flag: '🇿🇦', code: 'ZA' },
  { value: 'xh', label: 'Xhosa', flag: '🇿🇦', code: 'ZA' },
  { value: 'af', label: 'Afrikaans', flag: '🇿🇦', code: 'ZA' },
  { value: 'so', label: 'Somali', flag: '🇸🇴', code: 'SO' },
  { value: 'om', label: 'Oromo', flag: '🇪🇹', code: 'ET' },
  { value: 'ti', label: 'Tigrinya', flag: '🇪🇷', code: 'ER' },
  { value: 'wo', label: 'Wolof', flag: '🇸🇳', code: 'SN' },
  { value: 'ff', label: 'Fulani', flag: '🇳🇬', code: 'NG' },
  { value: 'rw', label: 'Kinyarwanda', flag: '🇷🇼', code: 'RW' },
  { value: 'rn', label: 'Kirundi', flag: '🇧🇮', code: 'BI' },
  { value: 'lg', label: 'Luganda', flag: '🇺🇬', code: 'UG' },
  { value: 'ny', label: 'Chichewa', flag: '🇲🇼', code: 'MW' },
  { value: 'sn', label: 'Shona', flag: '🇿🇼', code: 'ZW' },
  { value: 'nd', label: 'Ndebele', flag: '🇿🇼', code: 'ZW' },
  { value: 'st', label: 'Sesotho', flag: '🇱🇸', code: 'LS' },
  { value: 'tn', label: 'Setswana', flag: '🇧🇼', code: 'BW' },
  { value: 'ss', label: 'Swati', flag: '🇸🇿', code: 'SZ' },
  { value: 've', label: 'Venda', flag: '🇿🇦', code: 'ZA' },
  { value: 'ts', label: 'Tsonga', flag: '🇿🇦', code: 'ZA' },
  { value: 'nr', label: 'Ndebele', flag: '🇿🇦', code: 'ZA' },
  
  // Middle Eastern Languages
  { value: 'he', label: 'Hebrew', flag: '🇮🇱', code: 'IL' },
  { value: 'ku', label: 'Kurdish', flag: '🇮🇶', code: 'IQ' },
  { value: 'az', label: 'Azerbaijani', flag: '🇦🇿', code: 'AZ' },
  { value: 'hy', label: 'Armenian', flag: '🇦🇲', code: 'AM' },
  { value: 'ka', label: 'Georgian', flag: '🇬🇪', code: 'GE' },
  
  // Regional Variants
  { value: 'pt-br', label: 'Portuguese (Brazil)', flag: '🇧🇷', code: 'BR' },
  { value: 'es-mx', label: 'Spanish (Mexico)', flag: '🇲🇽', code: 'MX' },
  { value: 'es-ar', label: 'Spanish (Argentina)', flag: '🇦🇷', code: 'AR' },
  { value: 'es-co', label: 'Spanish (Colombia)', flag: '🇨🇴', code: 'CO' },
  { value: 'es-pe', label: 'Spanish (Peru)', flag: '🇵🇪', code: 'PE' },
  { value: 'es-ve', label: 'Spanish (Venezuela)', flag: '🇻🇪', code: 'VE' },
  { value: 'es-cl', label: 'Spanish (Chile)', flag: '🇨🇱', code: 'CL' },
  { value: 'es-uy', label: 'Spanish (Uruguay)', flag: '🇺🇾', code: 'UY' },
  { value: 'es-py', label: 'Spanish (Paraguay)', flag: '🇵🇾', code: 'PY' },
  { value: 'es-bo', label: 'Spanish (Bolivia)', flag: '🇧🇴', code: 'BO' },
  { value: 'es-ec', label: 'Spanish (Ecuador)', flag: '🇪🇨', code: 'EC' },
  { value: 'es-gt', label: 'Spanish (Guatemala)', flag: '🇬🇹', code: 'GT' },
  { value: 'es-cu', label: 'Spanish (Cuba)', flag: '🇨🇺', code: 'CU' },
  { value: 'es-do', label: 'Spanish (Dominican Republic)', flag: '🇩🇴', code: 'DO' },
  { value: 'es-hn', label: 'Spanish (Honduras)', flag: '🇭🇳', code: 'HN' },
  { value: 'es-sv', label: 'Spanish (El Salvador)', flag: '🇸🇻', code: 'SV' },
  { value: 'es-ni', label: 'Spanish (Nicaragua)', flag: '🇳🇮', code: 'NI' },
  { value: 'es-cr', label: 'Spanish (Costa Rica)', flag: '🇨🇷', code: 'CR' },
  { value: 'es-pa', label: 'Spanish (Panama)', flag: '🇵🇦', code: 'PA' },
  { value: 'es-pr', label: 'Spanish (Puerto Rico)', flag: '🇵🇷', code: 'PR' },
  { value: 'fr-ca', label: 'French (Canada)', flag: '🇨🇦', code: 'CA' },
  { value: 'en-ca', label: 'English (Canada)', flag: '🇨🇦', code: 'CA' },
  { value: 'en-au', label: 'English (Australia)', flag: '🇦🇺', code: 'AU' },
  { value: 'en-nz', label: 'English (New Zealand)', flag: '🇳🇿', code: 'NZ' },
  { value: 'en-za', label: 'English (South Africa)', flag: '🇿🇦', code: 'ZA' },
  { value: 'en-ie', label: 'English (Ireland)', flag: '🇮🇪', code: 'IE' },
  { value: 'en-gb', label: 'English (UK)', flag: '🇬🇧', code: 'GB' },
  { value: 'en-in', label: 'English (India)', flag: '🇮🇳', code: 'IN' },
  { value: 'en-sg', label: 'English (Singapore)', flag: '🇸🇬', code: 'SG' },
  { value: 'en-hk', label: 'English (Hong Kong)', flag: '🇭🇰', code: 'HK' },
  { value: 'en-my', label: 'English (Malaysia)', flag: '🇲🇾', code: 'MY' },
  { value: 'en-ph', label: 'English (Philippines)', flag: '🇵🇭', code: 'PH' },
  { value: 'en-ng', label: 'English (Nigeria)', flag: '🇳🇬', code: 'NG' },
  { value: 'en-ke', label: 'English (Kenya)', flag: '🇰🇪', code: 'KE' },
  { value: 'en-gh', label: 'English (Ghana)', flag: '🇬🇭', code: 'GH' },
  { value: 'en-ug', label: 'English (Uganda)', flag: '🇺🇬', code: 'UG' },
  { value: 'en-tz', label: 'English (Tanzania)', flag: '🇹🇿', code: 'TZ' },
  { value: 'en-zw', label: 'English (Zimbabwe)', flag: '🇿🇼', code: 'ZW' },
  { value: 'en-bw', label: 'English (Botswana)', flag: '🇧🇼', code: 'BW' },
  { value: 'en-ls', label: 'English (Lesotho)', flag: '🇱🇸', code: 'LS' },
  { value: 'en-sz', label: 'English (Eswatini)', flag: '🇸🇿', code: 'SZ' },
  { value: 'en-mw', label: 'English (Malawi)', flag: '🇲🇼', code: 'MW' },
  { value: 'en-zm', label: 'English (Zambia)', flag: '🇿🇲', code: 'ZM' },
  { value: 'en-mu', label: 'English (Mauritius)', flag: '🇲🇺', code: 'MU' },
  { value: 'en-sc', label: 'English (Seychelles)', flag: '🇸🇨', code: 'SC' },
  { value: 'en-mt', label: 'English (Malta)', flag: '🇲🇹', code: 'MT' },
  { value: 'en-cy', label: 'English (Cyprus)', flag: '🇨🇾', code: 'CY' },
  { value: 'en-gi', label: 'English (Gibraltar)', flag: '🇬🇮', code: 'GI' },
  { value: 'en-bm', label: 'English (Bermuda)', flag: '🇧🇲', code: 'BM' },
  { value: 'en-bb', label: 'English (Barbados)', flag: '🇧🇧', code: 'BB' },
  { value: 'en-jm', label: 'English (Jamaica)', flag: '🇯🇲', code: 'JM' },
  { value: 'en-tt', label: 'English (Trinidad and Tobago)', flag: '🇹🇹', code: 'TT' },
  { value: 'en-bs', label: 'English (Bahamas)', flag: '🇧🇸', code: 'BS' },
  { value: 'en-bz', label: 'English (Belize)', flag: '🇧🇿', code: 'BZ' },
  { value: 'en-gy', label: 'English (Guyana)', flag: '🇬🇾', code: 'GY' },
  { value: 'en-sr', label: 'English (Suriname)', flag: '🇸🇷', code: 'SR' },
  { value: 'en-fj', label: 'English (Fiji)', flag: '🇫🇯', code: 'FJ' },
  { value: 'en-pg', label: 'English (Papua New Guinea)', flag: '🇵🇬', code: 'PG' },
  { value: 'en-sb', label: 'English (Solomon Islands)', flag: '🇸🇧', code: 'SB' },
  { value: 'en-vu', label: 'English (Vanuatu)', flag: '🇻🇺', code: 'VU' },
  { value: 'en-ws', label: 'English (Samoa)', flag: '🇼🇸', code: 'WS' },
  { value: 'en-to', label: 'English (Tonga)', flag: '🇹🇴', code: 'TO' },
  { value: 'en-ki', label: 'English (Kiribati)', flag: '🇰🇮', code: 'KI' },
  { value: 'en-tv', label: 'English (Tuvalu)', flag: '🇹🇻', code: 'TV' },
  { value: 'en-nr', label: 'English (Nauru)', flag: '🇳🇷', code: 'NR' },
  { value: 'en-pw', label: 'English (Palau)', flag: '🇵🇼', code: 'PW' },
  { value: 'en-mh', label: 'English (Marshall Islands)', flag: '🇲🇭', code: 'MH' },
  { value: 'en-fm', label: 'English (Micronesia)', flag: '🇫🇲', code: 'FM' },
  { value: 'en-kn', label: 'English (Saint Kitts and Nevis)', flag: '🇰🇳', code: 'KN' },
  { value: 'en-lc', label: 'English (Saint Lucia)', flag: '🇱🇨', code: 'LC' },
  { value: 'en-vc', label: 'English (Saint Vincent and the Grenadines)', flag: '🇻🇨', code: 'VC' },
  { value: 'en-gd', label: 'English (Grenada)', flag: '🇬🇩', code: 'GD' },
  { value: 'en-dm', label: 'English (Dominica)', flag: '🇩🇲', code: 'DM' },
  { value: 'en-ag', label: 'English (Antigua and Barbuda)', flag: '🇦🇬', code: 'AG' },
  { value: 'en-bn', label: 'English (Brunei)', flag: '🇧🇳', code: 'BN' },
  { value: 'en-lr', label: 'English (Liberia)', flag: '🇱🇷', code: 'LR' },
  { value: 'en-sl', label: 'English (Sierra Leone)', flag: '🇸🇱', code: 'SL' },
  { value: 'en-gm', label: 'English (Gambia)', flag: '🇬🇲', code: 'GM' },
  { value: 'en-cm', label: 'English (Cameroon)', flag: '🇨🇲', code: 'CM' },
  { value: 'en-rw', label: 'English (Rwanda)', flag: '🇷🇼', code: 'RW' },
  { value: 'en-bi', label: 'English (Burundi)', flag: '🇧🇮', code: 'BI' },
  { value: 'en-et', label: 'English (Ethiopia)', flag: '🇪🇹', code: 'ET' },
  { value: 'en-er', label: 'English (Eritrea)', flag: '🇪🇷', code: 'ER' },
  { value: 'en-dj', label: 'English (Djibouti)', flag: '🇩🇯', code: 'DJ' },
  { value: 'en-so', label: 'English (Somalia)', flag: '🇸🇴', code: 'SO' },
  { value: 'en-ss', label: 'English (South Sudan)', flag: '🇸🇸', code: 'SS' },
  { value: 'en-sd', label: 'English (Sudan)', flag: '🇸🇩', code: 'SD' },
  { value: 'en-ly', label: 'English (Libya)', flag: '🇱🇾', code: 'LY' },
  { value: 'en-tn', label: 'English (Tunisia)', flag: '🇹🇳', code: 'TN' },
  { value: 'en-dz', label: 'English (Algeria)', flag: '🇩🇿', code: 'DZ' },
  { value: 'en-ma', label: 'English (Morocco)', flag: '🇲🇦', code: 'MA' },
  { value: 'en-eg', label: 'English (Egypt)', flag: '🇪🇬', code: 'EG' },
  { value: 'en-jo', label: 'English (Jordan)', flag: '🇯🇴', code: 'JO' },
  { value: 'en-lb', label: 'English (Lebanon)', flag: '🇱🇧', code: 'LB' },
  { value: 'en-sy', label: 'English (Syria)', flag: '🇸🇾', code: 'SY' },
  { value: 'en-iq', label: 'English (Iraq)', flag: '🇮🇶', code: 'IQ' },
  { value: 'en-ir', label: 'English (Iran)', flag: '🇮🇷', code: 'IR' },
  { value: 'en-af', label: 'English (Afghanistan)', flag: '🇦🇫', code: 'AF' },
  { value: 'en-pk', label: 'English (Pakistan)', flag: '🇵🇰', code: 'PK' },
  { value: 'en-bd', label: 'English (Bangladesh)', flag: '🇧🇩', code: 'BD' },
  { value: 'en-lk', label: 'English (Sri Lanka)', flag: '🇱🇰', code: 'LK' },
  { value: 'en-mv', label: 'English (Maldives)', flag: '🇲🇻', code: 'MV' },
  { value: 'en-bt', label: 'English (Bhutan)', flag: '🇧🇹', code: 'BT' },
  { value: 'en-np', label: 'English (Nepal)', flag: '🇳🇵', code: 'NP' },
  { value: 'en-mm', label: 'English (Myanmar)', flag: '🇲🇲', code: 'MM' },
  { value: 'en-th', label: 'English (Thailand)', flag: '🇹🇭', code: 'TH' },
  { value: 'en-la', label: 'English (Laos)', flag: '🇱🇦', code: 'LA' },
  { value: 'en-kh', label: 'English (Cambodia)', flag: '🇰🇭', code: 'KH' },
  { value: 'en-vn', label: 'English (Vietnam)', flag: '🇻🇳', code: 'VN' },
  { value: 'en-tw', label: 'English (Taiwan)', flag: '🇹🇼', code: 'TW' },
  { value: 'en-mo', label: 'English (Macau)', flag: '🇲🇴', code: 'MO' },
  { value: 'en-kr', label: 'English (South Korea)', flag: '🇰🇷', code: 'KR' },
  { value: 'en-jp', label: 'English (Japan)', flag: '🇯🇵', code: 'JP' },
  { value: 'en-mn', label: 'English (Mongolia)', flag: '🇲🇳', code: 'MN' },
  { value: 'en-kz', label: 'English (Kazakhstan)', flag: '🇰🇿', code: 'KZ' },
  { value: 'en-uz', label: 'English (Uzbekistan)', flag: '🇺🇿', code: 'UZ' },
  { value: 'en-tm', label: 'English (Turkmenistan)', flag: '🇹🇲', code: 'TM' },
  { value: 'en-tj', label: 'English (Tajikistan)', flag: '🇹🇯', code: 'TJ' },
  { value: 'en-kg', label: 'English (Kyrgyzstan)', flag: '🇰🇬', code: 'KG' }
]

interface LanguageSelectProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function LanguageSelect({ 
  value, 
  onChange, 
  placeholder = "Select language",
  className = ""
}: LanguageSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredLanguages, setFilteredLanguages] = useState<Language[]>(languages)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Get selected language
  const selectedLanguage = languages.find(language => language.value === value)

  // Filter languages based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredLanguages(languages.filter(language => 
        language.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        language.value.toLowerCase().includes(searchQuery.toLowerCase())
      ))
    } else {
      setFilteredLanguages(languages)
    }
  }, [searchQuery])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  const handleSelect = (language: Language) => {
    onChange(language.value)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setSearchQuery('')
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full px-4 py-3 text-left bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {selectedLanguage ? (
              <>
                <img 
                  src={`https://flagcdn.com/24x18/${selectedLanguage.code.toLowerCase()}.png`}
                  alt={`${selectedLanguage.label} flag`}
                  className="w-6 h-4 mr-2 flex-shrink-0 object-cover rounded-sm"
                />
                <span className="text-gray-900 dark:text-white font-medium">{selectedLanguage.label}</span>
              </>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search languages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Languages List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map((language) => (
                <button
                  key={language.value}
                  type="button"
                  onClick={() => handleSelect(language)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center ${
                    value === language.value ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                  }`}
                >
                  <img 
                    src={`https://flagcdn.com/24x18/${language.code.toLowerCase()}.png`}
                    alt={`${language.label} flag`}
                    className="w-6 h-4 mr-3 flex-shrink-0 object-cover rounded-sm"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{language.label}</div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">
                No languages found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}