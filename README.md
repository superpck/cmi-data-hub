# CMI Data Hub

ระบบข้อมูล CMI กลาง สำหรับการให้บริการข้อมูล CMI แก่หน่วยงานภายในกระทรวงสาธารณสุข

## 📋 Features

### 🔐 Authentication & Authorization
- OAuth 2.0 authentication flow
- JWT token-based authorization
- Route guards with consent validation
- Auto token refresh

### 📊 CMI Data Management
- **DRG Seeker**: ค้นหาและวิเคราะห์ข้อมูล DRG
- **Data List**: ทะเบียนผู้ป่วยใน (IPD) พร้อมระบบค้นหาและ pagination
- **CSV Upload**: อัปโหลดข้อมูล IPD จากไฟล์ CSV พร้อม progress tracking
- **Data Download**: ดาวน์โหลดข้อมูลจาก CMI API พร้อมระบบ consent form

### 🤖 AI Features
- **IPD AI Summary**: สรุปข้อมูลผู้ป่วยด้วย AI
- **AI Prompt**: เครื่องมือ AI แบบ on-demand

### 🎨 UI/UX
- Responsive design with Tailwind CSS
- Custom progress bars with error handling
- Thai language support with dayjs
- Toast notifications and modal dialogs
- Dark theme support

## 🛠️ Tech Stack

- **Framework**: Angular 21.2.14
- **Language**: TypeScript 5.9.2
- **UI Library**: ngx-pk-ui 2.17.1
- **Styling**: Tailwind CSS 4.1.12
- **Date Library**: dayjs 1.11.20
- **Excel Export**: SheetJS (xlsx)
- **HTTP Client**: Angular HttpClient with interceptors

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server (port 4404)
npm start

# Build for production
npm run build

# Run tests
npm test
```

## 🏗️ Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── about/              # About page
│   │   ├── ai-prompt/          # AI prompt interface
│   │   ├── cmi-api/
│   │   │   ├── api-request/    # Data download component
│   │   │   ├── consent-form/   # Consent form with 3-month validation
│   │   │   └── cmi-api-layout/ # CMI API layout wrapper
│   │   ├── drg-utils/
│   │   │   ├── data-list/      # IPD registry table
│   │   │   ├── drg-seeker/     # DRG search & analysis
│   │   │   ├── upload/         # CSV upload with progress tracking
│   │   │   └── drg-util-layout/# DRG utilities layout wrapper
│   │   ├── ipd-ai-summary/     # AI-powered IPD summary
│   │   ├── layout/             # Main application layout
│   │   ├── login/              # Login & OAuth callback
│   │   └── main-page/          # Landing page
│   ├── services/
│   │   ├── ai.service.ts       # AI integration service
│   │   ├── auth.service.ts     # Authentication service
│   │   ├── drgs.service.ts     # DRG data service
│   │   ├── excel.service.ts    # Excel export service
│   │   ├── login.service.ts    # Login service
│   │   ├── main.service.ts     # Main application service
│   │   ├── theme.service.ts    # Theme management
│   │   └── guards/
│   │       ├── auth.guard.ts   # Authentication guard
│   │       └── consent.guard.ts # Consent validation guard (3-month)
│   ├── configs/
│   │   └── config.ts           # Application configuration
│   └── utils/
│       └── utils.ts            # Utility functions
└── public/
    └── images/                 # Static images
```

## 🔑 Key Features Implementation

### 1. Consent Form System
- 3-month validity period
- Server-side validation
- Return URL support for seamless navigation
- Mandatory acceptance before data download

### 2. CSV Upload with Progress Tracking
- Batch processing (100 rows per batch)
- Real-time progress bar with row counts
- Error display with detailed messages
- Upload state management (prevents duplicate uploads)
- Visual feedback on completion

### 3. Error Handling
- Blob response error parsing
- Custom error messages from API
- Toast notifications for user feedback
- Progress bar error display

### 4. File Download
- Automatic filename extraction from `Content-Disposition` header
- File System Access API with fallback
- Support for ZIP and CSV formats

## 🌐 Environment

- **Development**: `http://localhost:4404`
- **Beta**: Features flagged for testing (additional menu items)
- **Production**: Full CMI integration

## 📝 Configuration

Create `src/app/configs/config.ts` based on `config.example.ts`:

```typescript
export default {
  appCode: 'CMI Data Hub',
  apiUrl: 'https://api.example.com',
  oauth: {
    clientId: 'your-client-id',
    redirectUri: 'http://localhost:4404/login/callback'
  }
}
```

## 🚀 Deployment

```bash
# Build for production
npm run build

# Deploy using upload script
./upload_2.sh
```

## 🧪 Angular Best Practices

- ✅ Standalone components (default in Angular 20+)
- ✅ Signals for state management
- ✅ `OnPush` change detection strategy
- ✅ Native control flow (`@if`, `@for`, `@switch`)
- ✅ `input()` and `output()` functions instead of decorators
- ✅ Lazy loading with `loadComponent`
- ✅ Functional guards (`CanActivateFn`)
- ✅ HTTP interceptors for auth token injection

## 📄 License

Internal use only - Ministry of Public Health, Thailand

## 👨‍💻 Version

**v14.0** (2026.05.31-1)