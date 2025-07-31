# 🥗 Healthy Me - AI-Powered Nutrition Assistant

<div align="center">
  <img src="https://img.shields.io/badge/React-18.0+-blue?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5.0+-blue?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/Firebase-9.0+-orange?style=for-the-badge&logo=firebase" />
  <img src="https://img.shields.io/badge/Gemini_AI-Latest-green?style=for-the-badge&logo=google" />
  <img src="https://img.shields.io/badge/TensorFlow.js-4.0+-yellow?style=for-the-badge&logo=tensorflow" />
</div>

## 🚀 Overview

Healthy Me is an intelligent nutrition companion that leverages cutting-edge AI technology to help users track their meals, analyze nutritional content, and improve their dietary habits with personalized insights. Built as a modern web application using React + TypeScript with a focus on user experience and real-time data processing.

## ✨ Key Features

### 🤖 AI-Powered Analysis
- **Gemini AI Integration**: Advanced image recognition and nutritional analysis
- **TensorFlow.js**: Client-side machine learning for enhanced food detection
- **Real-time Processing**: Instant meal analysis with detailed nutritional breakdown

### 📊 Health Scoring System
- **Smart Scoring Algorithm**: 1-20 scale health ratings for every meal
- **Color-coded Results**: Visual indicators (Excellent/Good/Fair/Poor)
- **Personalized Recommendations**: AI-driven suggestions for healthier choices

### 🔐 User Authentication & Data Management
- **Firebase Authentication**: Secure Google OAuth and email/password login
- **Cloud Firestore**: Real-time database for user profiles and meal history
- **Cross-device Sync**: Access your data anywhere with automatic cloud synchronization

### 📱 Modern User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Interactive Analytics**: Clickable meal history with detailed modal views
- **Professional UI**: Clean, modern interface with smooth animations

## 🛠 Technology Stack

### Frontend Framework
- **React 18+** with TypeScript for type-safe development
- **Vite** for lightning-fast development and optimized builds
- **Tailwind CSS** for utility-first styling and responsive design

### AI & Machine Learning
- **Google Gemini AI** for advanced natural language processing and image analysis
- **TensorFlow.js** for client-side machine learning capabilities
- **Custom ML Models** for food recognition and nutritional estimation

### Backend & Database
- **Firebase Authentication** for secure user management
- **Cloud Firestore** for real-time NoSQL database
- **Firebase Storage** for image storage and management
- **Firebase Hosting** for scalable web hosting

### Development Tools
- **ESLint & Prettier** for code quality and formatting
- **Husky** for Git hooks and automated testing
- **TypeScript** for enhanced developer experience and type safety

## 📋 Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js** (v18.0 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Git** for version control
- **Google Account** for Firebase and Gemini AI setup

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Anubhavick/Healthy-Me.git
cd Healthy-Me
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Setup

Create a `.env` file in the root directory (copy from `.env.example`):

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Gemini AI Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**⚠️ Important:** Never commit your `.env` file to version control. Use `.env.example` as a template.

### 4. Run Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173`

## 🔧 Detailed Setup Instructions

### Firebase Configuration

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project" and follow the setup wizard
   - Enable Google Analytics (recommended)

2. **Setup Authentication**
   ```bash
   # In Firebase Console:
   # 1. Go to Authentication > Sign-in method
   # 2. Enable Google and Email/Password providers
   # 3. Add your domain to authorized domains
   ```

3. **Configure Firestore Database**
   ```bash
   # In Firebase Console:
   # 1. Go to Firestore Database
   # 2. Create database in production mode
   # 3. Set up security rules (see firebase.rules)
   ```

4. **Setup Storage**
   ```bash
   # In Firebase Console:
   # 1. Go to Storage
   # 2. Get started and set up security rules
   # 3. Configure CORS for web access
   ```

### Gemini AI Setup

1. **Get API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key to your `.env.local` file

2. **Configure API Usage**
   ```javascript
   // The app automatically configures Gemini AI with:
   // - Image analysis capabilities
   // - Nutritional data extraction
   // - Personalized recommendations
   ```

### TensorFlow.js Integration

The application uses TensorFlow.js for:
- **Client-side Food Recognition**: Real-time image preprocessing
- **Nutritional Estimation**: ML models for calorie and nutrient prediction
- **Performance Optimization**: Efficient model loading and caching

```javascript
// TensorFlow.js is automatically loaded via CDN
// Models are cached for improved performance
// No additional setup required
```

## 📁 Project Structure

```
Healthy-Me/
├── public/                 # Static assets
├── src/
│   ├── components/        # React components
│   │   ├── AnalysisResult.tsx
│   │   ├── AuthModal.tsx
│   │   ├── MealHistory.tsx
│   │   └── ...
│   ├── services/          # API services
│   │   ├── geminiService.ts
│   │   ├── firebaseConfig.ts
│   │   └── ...
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   └── App.tsx            # Main application component
├── .env.local             # Environment variables
├── firebase.json          # Firebase configuration
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## 🎯 Core Functionality

### Meal Analysis Workflow

1. **Image Upload**: User uploads or captures meal photo
2. **AI Processing**: Gemini AI analyzes image for food identification
3. **Nutritional Analysis**: TensorFlow.js models estimate calories and nutrients
4. **Health Scoring**: Custom algorithm generates 1-20 health score
5. **Data Storage**: Results saved to Firestore with user authentication
6. **Analytics**: Interactive dashboard shows trends and insights

### Authentication Flow

1. **Landing Page**: Modern login interface with Google OAuth option
2. **User Registration**: Email/password or Google sign-in
3. **Profile Creation**: Automatic user profile setup in Firestore
4. **Session Management**: Persistent login with automatic token refresh
5. **Data Sync**: Real-time synchronization across all user devices

## 🧪 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

## 🚀 Deployment

### Firebase Hosting

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Initialize Firebase**
   ```bash
   firebase init hosting
   # Select your Firebase project
   # Set build directory to 'dist'
   ```

3. **Deploy**
   ```bash
   npm run build
   firebase deploy
   ```

### Alternative Deployment Options

- **Vercel**: Connect GitHub repository for automatic deployments
- **Netlify**: Drag and drop `dist` folder after build
- **GitHub Pages**: Use GitHub Actions for automated deployment

## 🔐 Security Features

- **Environment Variables**: All sensitive credentials stored in `.env` files (not committed to repo)
- **Firebase Security Rules**: Restrict data access to authenticated users
- **API Key Protection**: Environment variables for sensitive credentials with TypeScript validation
- **Input Validation**: Sanitization of user inputs and file uploads
- **HTTPS Enforcement**: Secure data transmission
- **Authentication Tokens**: JWT-based session management
- **Gitignore Protection**: Automatic exclusion of environment files from version control

## 📊 Performance Optimizations

- **Code Splitting**: Lazy loading of components for faster initial load
- **Image Optimization**: Automatic compression and format conversion
- **Caching Strategy**: Service worker for offline functionality
- **Bundle Analysis**: Optimized build size with tree shaking
- **CDN Integration**: Fast asset delivery via Firebase CDN

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/Anubhavick/Healthy-Me/issues) page
2. Create a new issue with detailed description
3. Join our [Discord Community](https://discord.gg/healthy-me) for support

## 🙏 Acknowledgments

- **Google AI Team** for Gemini API access
- **Firebase Team** for robust backend infrastructure
- **TensorFlow.js** for powerful ML capabilities
- **React Community** for excellent documentation and support

---

<div align="center">
  <p>Built with ❤️ by <a href="https://github.com/Anubhavick">Anubhavick</a></p>
  <p>⭐ Star this repo if you found it helpful!</p>
</div>
