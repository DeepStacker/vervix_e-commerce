# VERVIX - Luxury E-commerce Platform

![Vervix Logo](https://via.placeholder.com/400x100/1a1a1a/c9a96e?text=VERVIX)

## 🌟 Overview

**Vervix** is a premium, luxury e-commerce platform designed specifically for high-end fashion and clothing. Built with modern technologies and a focus on user experience, Vervix provides both customers and administrators with a sophisticated, professional interface.

### ✨ Key Features

#### **Customer Features**
- 🛍️ **Luxurious Shopping Experience** - Premium UI/UX with elegant design
- 👥 **User Authentication** - Secure login/register with email notifications
- 🛒 **Advanced Shopping Cart** - Persistent cart with real-time updates
- ❤️ **Wishlist Management** - Save favorite items for later
- 🔍 **Advanced Search & Filtering** - Find products by category, gender, price, etc.
- 📱 **Responsive Design** - Works perfectly on all devices
- 💳 **Secure Checkout** - Integrated payment processing with Stripe
- 📧 **Email Notifications** - Welcome emails, order confirmations, login alerts
- 👤 **Profile Management** - Update personal information and addresses
- 📋 **Order Tracking** - View order history and status updates

#### **Admin Panel Features**
- 📊 **Comprehensive Dashboard** - Sales analytics and key metrics
- 📦 **Product Management** - Full CRUD operations for products
- 👥 **Customer Management** - View and manage customer accounts
- 📋 **Order Management** - Process orders, update status, manage returns
- 🖼️ **Image Management** - Upload and organize product images
- 📈 **Sales Analytics** - Revenue tracking and performance metrics
- 🔧 **Inventory Management** - Stock tracking and low-stock alerts
- 📊 **Reports & Analytics** - Detailed business insights

### 🎨 Design Philosophy

Vervix embodies luxury through:
- **Elegant Color Palette**: Black, gold, and cream tones
- **Premium Typography**: Playfair Display and Inter fonts
- **Smooth Animations**: Framer Motion and AOS integration
- **Professional Layout**: Clean, minimalist design
- **Interactive Elements**: Hover effects and micro-interactions

---

## 🚀 Technology Stack

### **Frontend**
- **React 18** - Modern React with hooks
- **React Router v6** - Client-side routing
- **TailwindCSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations
- **React Query** - Data fetching and caching
- **React Hook Form** - Form handling
- **React Hot Toast** - Elegant notifications
- **Axios** - HTTP client
- **React Icons** - Icon library

### **Backend**
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Nodemailer** - Email service
- **Multer** - File upload handling
- **Helmet** - Security middleware
- **Morgan** - Request logging

### **Additional Services**
- **Cloudinary** - Image storage and optimization
- **Stripe** - Payment processing
- **MongoDB Atlas** - Cloud database (optional)
- **Gmail SMTP** - Email delivery

---

## 📁 Project Structure

```
vervix-ecommerce/
├── backend/                 # Node.js API server
│   ├── models/             # MongoDB schemas
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Category.js
│   │   └── Order.js
│   ├── routes/             # API endpoints
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── users.js
│   │   ├── categories.js
│   │   ├── admin.js
│   │   └── upload.js
│   ├── middleware/         # Custom middleware
│   │   └── auth.js
│   ├── utils/              # Utility functions
│   │   └── email.js
│   ├── uploads/            # File uploads
│   ├── .env                # Environment variables
│   ├── package.json
│   └── server.js           # Entry point
│
├── frontend/               # React application
│   ├── public/             # Static files
│   │   └── index.html
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── layout/     # Layout components
│   │   │   ├── common/     # Common components
│   │   │   ├── auth/       # Authentication components
│   │   │   └── admin/      # Admin components
│   │   ├── pages/          # Page components
│   │   ├── admin/          # Admin panel pages
│   │   ├── context/        # React context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   ├── styles/         # Global styles
│   │   ├── assets/         # Images and static assets
│   │   ├── App.js          # Main App component
│   │   └── index.js        # Entry point
│   ├── package.json
│   └── tailwind.config.js
│
├── setup.bat               # Windows setup script
└── README.md              # This file
```

---

## ⚡ Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v5 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Git** - [Download](https://git-scm.com/)

### 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/vervix-ecommerce.git
   cd vervix-ecommerce
   ```

2. **Run the setup script (Windows)**
   ```bash
   setup.bat
   ```

   **Or manual setup:**

3. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Copy environment file
   cp .env .env.local
   ```

4. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   
   # Initialize TailwindCSS
   npx tailwindcss init -p
   ```

### 🔑 Environment Configuration

#### Backend (.env.local)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/vervix-ecommerce
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=30d

# Admin credentials
ADMIN_EMAIL=admin@vervix.com
ADMIN_PASSWORD=admin123

# Email configuration
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Stripe (for payments)
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLIC_KEY=your-stripe-public-key

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env.local)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLIC_KEY=your-stripe-public-key
```

### 🚀 Running the Application

1. **Start MongoDB**
   ```bash
   # Windows
   net start MongoDB
   
   # Or manually
   mongod --dbpath "C:\data\db"
   ```

2. **Start the Backend** (Terminal 1)
   ```bash
   cd backend
   npm run dev
   ```

3. **Start the Frontend** (Terminal 2)
   ```bash
   cd frontend
   npm start
   ```

4. **Access the Application**
   - **Website**: http://localhost:3000
   - **Admin Panel**: http://localhost:3000/admin
   - **API Documentation**: http://localhost:5000/api/health

---

## 👨‍💼 Admin Panel

### Default Admin Credentials
- **Email**: admin@vervix.com
- **Password**: admin123

⚠️ **Important**: Change these credentials in production!

### Admin Features
- **Dashboard**: Overview of sales, orders, and customers
- **Product Management**: Add, edit, delete products and categories
- **Order Management**: Process orders, update status, handle returns
- **Customer Management**: View customer profiles and order history
- **Image Management**: Upload and organize product images
- **Analytics**: Sales reports and performance metrics

---

## 🎨 Customization

### Color Palette
The luxury color scheme can be customized in:
- `frontend/src/styles/globals.css` - CSS variables
- `frontend/tailwind.config.js` - TailwindCSS theme

```css
:root {
  --primary-black: #1a1a1a;
  --secondary-black: #2d2d2d;
  --luxury-gold: #c9a96e;
  --warm-gold: #b8956a;
  --soft-cream: #f8f6f3;
  --pure-white: #ffffff;
}
```

### Typography
- **Headings**: Playfair Display (elegant serif)
- **Body**: Inter (modern sans-serif)
- **Accent**: Crimson Text (classic serif)

---

## 📧 Email Templates

Vervix includes beautiful email templates for:
- **Welcome Email** - New user registration
- **Login Notification** - Security alerts
- **Order Confirmation** - Purchase confirmations
- **Password Reset** - Account recovery

Templates are located in `backend/utils/email.js` and can be customized.

---

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcryptjs encryption
- **Rate Limiting** - Prevent brute force attacks
- **Input Validation** - Mongoose validation
- **Helmet.js** - Security headers
- **CORS Protection** - Cross-origin request security
- **Account Lockout** - Failed login attempt protection

---

## 📱 Mobile Responsiveness

Vervix is fully responsive and optimized for:
- **Desktop** (1200px+)
- **Tablet** (768px - 1199px)
- **Mobile** (320px - 767px)

---

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

---

## 🚢 Deployment

### Backend Deployment (Production)

1. **Environment Setup**
   ```bash
   NODE_ENV=production
   PORT=80
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vervix
   ```

2. **Build and Start**
   ```bash
   npm install --production
   npm start
   ```

### Frontend Deployment

1. **Build for Production**
   ```bash
   npm run build
   ```

2. **Deploy to hosting service** (Netlify, Vercel, etc.)

### Recommended Hosting
- **Backend**: Heroku, DigitalOcean, AWS
- **Frontend**: Netlify, Vercel, AWS S3 + CloudFront
- **Database**: MongoDB Atlas
- **Images**: Cloudinary

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Add comments for complex logic
- Update documentation for new features
- Test your changes thoroughly

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

If you encounter any issues or need help:

1. Check the [Issues](https://github.com/yourusername/vervix-ecommerce/issues) page
2. Create a new issue with detailed information
3. Contact support at support@vervix.com

---

## 🙏 Acknowledgments

- **Design Inspiration**: Luxury fashion brands
- **Icons**: React Icons library
- **Fonts**: Google Fonts
- **Images**: Unsplash, Pexels

---

## 📈 Roadmap

### Upcoming Features
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Product reviews and ratings
- [ ] Social media integration
- [ ] Mobile app (React Native)
- [ ] AI-powered recommendations
- [ ] Inventory forecasting
- [ ] Advanced SEO optimization

---

**Built with ❤️ for luxury fashion enthusiasts**

---

*For technical questions or business inquiries, please contact the development team.*
