import { apiService } from './api'

export interface DomainVerificationResult {
  success: boolean
  domain: string
  isValid: boolean
  error?: string
  details?: {
    domain: string
    dns: {
      isValid: boolean
      error?: string
      records?: any
    }
    http: {
      isValid: boolean
      error?: string
      statusCode?: number
      protocol?: string
    }
    verifiedAt: string
  }
}

export class DomainVerificationService {
  private cache = new Map<string, { result: DomainVerificationResult; timestamp: number }>()
  private readonly cacheTimeout = 5 * 60 * 1000 // 5 minutes

  /**
   * Verify if a domain exists and is reachable
   * @param domain - The domain to verify
   * @returns Promise<DomainVerificationResult>
   */
  async verifyDomain(domain: string): Promise<DomainVerificationResult> {
    if (!domain || typeof domain !== 'string') {
      return {
        success: false,
        domain: '',
        isValid: false,
        error: 'Domain is required'
      }
    }

    // Check cache first
    const cacheKey = domain.toLowerCase()
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result
    }

    try {
      const response = await apiService.verifyDomain(domain)
      const result = response.data

      // Cache the result
      this.cache.set(cacheKey, {
        result,
        timestamp: Date.now()
      })

      return result
    } catch (error: any) {
      const result: DomainVerificationResult = {
        success: false,
        domain,
        isValid: false,
        error: error?.response?.data?.error || error?.message || 'Domain verification failed'
      }

      // Cache negative results for shorter time
      this.cache.set(cacheKey, {
        result,
        timestamp: Date.now()
      })

      return result
    }
  }

  /**
   * Clean and normalize domain
   * @param domain - Raw domain input
   * @returns Cleaned domain or null if invalid
   */
  cleanDomain(domain: string): string | null {
    if (!domain || typeof domain !== 'string') {
      return null
    }

    try {
      // Remove protocol if present
      let cleanDomain = domain.replace(/^https?:\/\//, '')
      
      // Remove www prefix
      cleanDomain = cleanDomain.replace(/^www\./, '')
      
      // Remove trailing slash and path
      cleanDomain = cleanDomain.split('/')[0]
      
      // Remove port if present
      cleanDomain = cleanDomain.split(':')[0]
      
      // Basic domain format validation
      const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
      
      if (!domainRegex.test(cleanDomain)) {
        return null
      }

      // Check for minimum length and valid TLD
      const parts = cleanDomain.split('.')
      if (parts.length < 2 || parts[parts.length - 1].length < 2) {
        return null
      }

      return cleanDomain.toLowerCase()
    } catch (error) {
      return null
    }
  }

  /**
   * Validate domain format (client-side only)
   * @param domain - Domain to validate
   * @returns Validation result
   */
  validateDomainFormat(domain: string): { isValid: boolean; error?: string } {
    if (!domain || typeof domain !== 'string') {
      return { isValid: false, error: 'Domain is required' }
    }

    const cleanDomain = this.cleanDomain(domain)
    if (!cleanDomain) {
      return { isValid: false, error: 'Invalid domain format' }
    }

    return { isValid: true }
  }

  /**
   * Clear cache for a specific domain or all cache
   * @param domain - Optional domain to clear, if not provided clears all
   */
  clearCache(domain?: string) {
    if (domain) {
      this.cache.delete(domain.toLowerCase())
    } else {
      this.cache.clear()
    }
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  getCacheStats() {
    const now = Date.now()
    let validEntries = 0
    let expiredEntries = 0

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp < this.cacheTimeout) {
        validEntries++
      } else {
        expiredEntries++
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      cacheTimeout: this.cacheTimeout
    }
  }
}

export const domainVerificationService = new DomainVerificationService()
