const dns = require('dns').promises;
const { promisify } = require('util');

class DomainVerificationService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Verify if a domain exists and is reachable
   * @param {string} domain - The domain to verify
   * @returns {Promise<{isValid: boolean, error?: string, details?: object}>}
   */
  async verifyDomain(domain) {
    try {
      // Check cache first
      const cacheKey = domain.toLowerCase();
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.result;
      }

      // Clean domain
      const cleanDomain = this.cleanDomain(domain);
      if (!cleanDomain) {
        return { isValid: false, error: 'Invalid domain format' };
      }

      // Perform DNS lookup
      const dnsResult = await this.performDnsLookup(cleanDomain);
      
      // Perform HTTP check if DNS is successful
      let httpResult = null;
      if (dnsResult.isValid) {
        httpResult = await this.performHttpCheck(cleanDomain);
      }

      const result = {
        isValid: dnsResult.isValid && (httpResult ? httpResult.isValid : true),
        error: dnsResult.error || (httpResult ? httpResult.error : null),
        details: {
          domain: cleanDomain,
          dns: dnsResult,
          http: httpResult,
          verifiedAt: new Date().toISOString()
        }
      };

      // Cache the result
      this.cache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error('Domain verification error:', error);
      return {
        isValid: false,
        error: 'Domain verification failed',
        details: { error: error.message }
      };
    }
  }

  /**
   * Clean and normalize domain
   * @param {string} domain - Raw domain input
   * @returns {string|null} - Cleaned domain or null if invalid
   */
  cleanDomain(domain) {
    if (!domain || typeof domain !== 'string') {
      return null;
    }

    try {
      // Remove protocol if present
      let cleanDomain = domain.replace(/^https?:\/\//, '');
      
      // Remove www prefix
      cleanDomain = cleanDomain.replace(/^www\./, '');
      
      // Remove trailing slash and path
      cleanDomain = cleanDomain.split('/')[0];
      
      // Remove port if present
      cleanDomain = cleanDomain.split(':')[0];
      
      // Basic domain format validation
      const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      
      if (!domainRegex.test(cleanDomain)) {
        return null;
      }

      // Check for minimum length and valid TLD
      const parts = cleanDomain.split('.');
      if (parts.length < 2 || parts[parts.length - 1].length < 2) {
        return null;
      }

      return cleanDomain.toLowerCase();
    } catch (error) {
      return null;
    }
  }

  /**
   * Perform DNS lookup for domain
   * @param {string} domain - Clean domain
   * @returns {Promise<{isValid: boolean, error?: string, records?: object}>}
   */
  async performDnsLookup(domain) {
    try {
      // Check A records (IPv4)
      const aRecords = await dns.resolve4(domain);
      
      if (aRecords && aRecords.length > 0) {
        return {
          isValid: true,
          records: { A: aRecords }
        };
      }
    } catch (aError) {
      try {
        // If A records fail, try AAAA records (IPv6)
        const aaaaRecords = await dns.resolve6(domain);
        
        if (aaaaRecords && aaaaRecords.length > 0) {
          return {
            isValid: true,
            records: { AAAA: aaaaRecords }
          };
        }
      } catch (aaaaError) {
        // If both A and AAAA fail, try CNAME
        try {
          const cnameRecords = await dns.resolveCname(domain);
          
          if (cnameRecords && cnameRecords.length > 0) {
            return {
              isValid: true,
              records: { CNAME: cnameRecords }
            };
          }
        } catch (cnameError) {
          return {
            isValid: false,
            error: `Domain ${domain} does not exist (no DNS records found)`
          };
        }
      }
    }

    return {
      isValid: false,
      error: `Domain ${domain} does not exist (no DNS records found)`
    };
  }

  /**
   * Perform HTTP check to verify domain is reachable
   * @param {string} domain - Clean domain
   * @returns {Promise<{isValid: boolean, error?: string, statusCode?: number}>}
   */
  async performHttpCheck(domain) {
    try {
      const https = require('https');
      const http = require('http');
      
      return new Promise((resolve) => {
        const options = {
          hostname: domain,
          port: 443,
          path: '/',
          method: 'HEAD',
          timeout: 10000, // 10 seconds
          headers: {
            'User-Agent': 'AlpusLinks-Domain-Verifier/1.0'
          }
        };

        const req = https.request(options, (res) => {
          resolve({
            isValid: true,
            statusCode: res.statusCode,
            headers: {
              server: res.headers.server,
              contentType: res.headers['content-type']
            }
          });
        });

        req.on('error', (error) => {
          // Try HTTP if HTTPS fails
          const httpOptions = {
            hostname: domain,
            port: 80,
            path: '/',
            method: 'HEAD',
            timeout: 10000
          };

          const httpReq = http.request(httpOptions, (httpRes) => {
            resolve({
              isValid: true,
              statusCode: httpRes.statusCode,
              protocol: 'http'
            });
          });

          httpReq.on('error', () => {
            resolve({
              isValid: false,
              error: `Domain ${domain} is not reachable via HTTP/HTTPS`
            });
          });

          httpReq.setTimeout(10000, () => {
            httpReq.destroy();
            resolve({
              isValid: false,
              error: `Domain ${domain} connection timeout`
            });
          });

          httpReq.end();
        });

        req.setTimeout(10000, () => {
          req.destroy();
          resolve({
            isValid: false,
            error: `Domain ${domain} connection timeout`
          });
        });

        req.end();
      });
    } catch (error) {
      return {
        isValid: false,
        error: `HTTP check failed: ${error.message}`
      };
    }
  }

  /**
   * Clear cache for a specific domain or all cache
   * @param {string} domain - Optional domain to clear, if not provided clears all
   */
  clearCache(domain = null) {
    if (domain) {
      this.cache.delete(domain.toLowerCase());
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   * @returns {object} - Cache statistics
   */
  getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp < this.cacheTimeout) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      cacheTimeout: this.cacheTimeout
    };
  }
}

module.exports = new DomainVerificationService();
