# Backend Setup Instructions

## Initial Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Environment Variables**
   Create a `.env` file in the backend directory with:
   ```
   MONGODB_URI=mongodb://localhost:27017/blog-management
   JWT_SECRET=your-secret-key-here
   PORT=5000
   ```

3. **Initialize Database**
   Run the setup script to create roles and seed sample data:
   ```bash
   npm run setup
   ```
   
   This will:
   - Create necessary roles (Super Admin, Admin, Publisher, Advertiser, Support)
   - Seed sample websites with 'active' status
   - Create a sample publisher user

4. **Start the Server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

## Manual Setup (if needed)

If you prefer to run the scripts individually:

1. **Initialize Roles**
   ```bash
   npm run init-roles
   ```

2. **Seed Sample Websites**
   ```bash
   npm run seed-websites
   ```

## Troubleshooting

### Issue: "No websites found" for advertiser role

**Possible Causes:**
1. No 'Advertiser' role exists in the database
2. No websites with 'active' status exist
3. User doesn't have the 'Advertiser' role assigned

**Solutions:**
1. Run `npm run init-roles` to create the Advertiser role
2. Ensure the user has the 'Advertiser' role assigned

### Issue: "Access denied" error

**Possible Causes:**
1. User role is not 'Advertiser' (case-sensitive)
2. User doesn't have a role assigned
3. Role name doesn't match exactly

**Solutions:**
1. Check the user's role in the database
2. Assign the 'Advertiser' role to the user
3. Ensure role name is exactly 'Advertiser' (case-sensitive)

## Database Structure

### Roles
- **Super Admin**: Full system access
- **Admin**: Administrative access
- **Publisher**: Can register and manage websites
- **Advertiser**: Can browse and contact publishers
- **Support**: Customer support access

### Website Status
- **active**: Available for advertisers to see
- **pending**: Awaiting approval
- **inactive**: Not available
- **rejected**: Rejected by admin

## API Endpoints

### For Advertisers
- `GET /api/websites/advertiser/activated` - Get active websites

### For Publishers
- `GET /api/websites/publisher/:publisherId` - Get publisher's websites
- `POST /api/websites` - Create new website
- `PUT /api/websites/:id` - Update website
- `DELETE /api/websites/:id` - Delete website

### For Admins
- `GET /api/websites/admin/all` - Get all websites
- `PATCH /api/websites/:id/status` - Update website status
- `PATCH /api/websites/bulk/status` - Bulk update status
