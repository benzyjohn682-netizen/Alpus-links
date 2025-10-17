# User Management System

A comprehensive user and role management system built with Next.js frontend and Node.js backend, featuring dark/light mode and MongoDB database.

## Features

- **User Management**: Create, read, update, and delete users
- **Role Management**: Define roles with specific permissions
- **Authentication**: JWT-based authentication with secure password handling
- **Dark/Light Mode**: Toggle between themes
- **Responsive Design**: Modern UI matching the provided screenshot
- **Dashboard**: Central hub with statistics and activity feed
- **Security**: Rate limiting, input validation, and secure password handling

## Project Structure

```
blog-management-system/
├── frontend/                 # Next.js frontend
│   ├── app/                 # App router pages
│   ├── components/          # React components
│   ├── lib/                # Utility functions
│   └── ...
├── backend/                 # Node.js backend
│   ├── models/              # MongoDB models
│   ├── routes/              # API routes
│   ├── middleware/          # Custom middleware
│   ├── scripts/             # Database scripts
│   └── server.js           # Main server file
└── package.json            # Root package.json
```

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd blog-management-system
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   
   Create `backend/.env` file:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/blog-management
   JWT_SECRET=your-super-secret-jwt-key-here
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

5. **Seed the database**
   ```bash
   cd backend
   node scripts/seed.js
   ```

6. **Start the development servers**
   ```bash
   npm run dev
   ```

This will start both frontend (http://localhost:3000) and backend (http://localhost:5000) servers.

## Default Login Credentials

After seeding the database, you can use these credentials:

- **Admin User**: admin@example.com / admin123
- **Moderator User**: john.doe@example.com / password123
- **Regular User**: jane.smith@example.com / password123

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/change-password` - Change password

### Users
- `GET /api/users` - Get all users (with pagination and filtering)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PUT /api/users/:id/status` - Update user status

### Roles
- `GET /api/roles` - Get all roles
- `GET /api/roles/:id` - Get role by ID
- `POST /api/roles` - Create new role
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role
- `GET /api/roles/:id/users` - Get users with specific role

## Technologies Used

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Next Themes** - Dark/light mode support
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **Bcryptjs** - Password hashing
- **Express Validator** - Input validation
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

## Features in Detail

### User Management
- Create, read, update, and delete users
- User status management (active, inactive, suspended)
- User search and filtering
- Pagination support
- Profile management

### Role Management
- Create custom roles with specific permissions
- Permission-based access control
- Role assignment to users
- System roles (cannot be deleted)
- Role-based UI restrictions

### Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Account lockout after failed attempts
- Input validation and sanitization
- Rate limiting
- CORS protection

### UI/UX Features
- Responsive design
- Dark/light mode toggle
- Modern dashboard interface
- Real-time statistics
- Activity feed
- Search and filtering
- Pagination

## Development

### Frontend Development
```bash
cd frontend
npm run dev
```

### Backend Development
```bash
cd backend
npm run dev
```

### Database Seeding
```bash
cd backend
node scripts/seed.js
```

## Production Deployment

1. Set `NODE_ENV=production` in backend/.env
2. Use a production MongoDB instance
3. Set secure JWT_SECRET
4. Configure CORS for your domain
5. Build frontend: `cd frontend && npm run build`
6. Start backend: `cd backend && npm start`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
