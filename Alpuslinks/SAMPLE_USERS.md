# Sample Users Reference

This document contains all the sample users created by the seed script for testing different roles and permissions.

## 🔑 Default Admin User
- **Email**: admin@example.com
- **Password**: admin123
- **Role**: Super Admin
- **Status**: Active

## 👥 Sample Users Created

### 📊 ADMIN USERS
| Email | Password | Role | Status |
|-------|----------|------|--------|
| sarah.wilson@example.com | password123 | Admin | Active |
| david.brown@example.com | password123 | Super Admin | Active |

### 📝 PUBLISHER USERS
| Email | Password | Role | Status |
|-------|----------|------|--------|
| jane.smith@example.com | password123 | Publisher | Active |
| alex.martinez@example.com | password123 | Publisher | Active |
| emma.davis@example.com | password123 | Publisher | Inactive |

### 📢 ADVERTISER USERS
| Email | Password | Role | Status |
|-------|----------|------|--------|
| mike.johnson@example.com | password123 | Advertiser | Active |
| lisa.anderson@example.com | password123 | Advertiser | Active |
| robert.taylor@example.com | password123 | Advertiser | Inactive |

### 🎧 SUPPORTOR USERS
| Email | Password | Role | Status |
|-------|----------|------|--------|
| john.doe@example.com | password123 | Supportor | Active |
| maria.garcia@example.com | password123 | Supportor | Active |
| kevin.lee@example.com | password123 | Supportor | Active |

## 📋 User Details

### Admin Users
- **Sarah Wilson** (sarah.wilson@example.com) - Admin role with full system access
- **David Brown** (david.brown@example.com) - Super Admin role with highest privileges

### Publisher Users
- **Jane Smith** (jane.smith@example.com) - Active publisher from Los Angeles, CA
- **Alex Martinez** (alex.martinez@example.com) - Active publisher from Austin, TX
- **Emma Davis** (emma.davis@example.com) - Inactive publisher from Miami, FL (email not verified)

### Advertiser Users
- **Mike Johnson** (mike.johnson@example.com) - Active advertiser from Chicago, IL
- **Lisa Anderson** (lisa.anderson@example.com) - Active advertiser from Denver, CO
- **Robert Taylor** (robert.taylor@example.com) - Inactive advertiser from Boston, MA

### Supportor Users
- **John Doe** (john.doe@example.com) - Active support staff from New York, NY
- **Maria Garcia** (maria.garcia@example.com) - Active support staff from Phoenix, AZ
- **Kevin Lee** (kevin.lee@example.com) - Active support staff from Portland, OR

## 🔄 Role Switching

**Note**: Admin users (Admin and Super Admin) do not have access to the "Switch Role" button as they are system administrators.

**Publisher and Advertiser users** can switch between their roles using the "Switch Role" button in their profile dropdown.

## 🎯 Testing Scenarios

### Admin Testing
- Use `admin@example.com` or `sarah.wilson@example.com` to test admin functionality
- Access admin panels, user management, role management
- Test website management and bulk operations

### Publisher Testing
- Use `jane.smith@example.com` or `alex.martinez@example.com` to test publisher functionality
- Create and manage websites
- Test role switching to advertiser

### Advertiser Testing
- Use `mike.johnson@example.com` or `lisa.anderson@example.com` to test advertiser functionality
- Test role switching to publisher

### Support Testing
- Use `john.doe@example.com` to test support functionality
- Access support features and user assistance

## 🔧 Re-seeding Database

To recreate all sample users, run:
```bash
cd backend
node scripts/seed.js
```

This will clear all existing data and recreate the sample users with the same credentials.
