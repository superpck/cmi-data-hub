# Changelog

All notable changes to the CMI Data Hub project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.2] - 2026-06-01

### Added
- Active Bed report feature
- New reporting capabilities

### Changed
- UI/UX improvements with CSS adjustments
- Layout refinements for better user experience
- Updated ngx-pk-ui to v2.18.1
- Updated Angular to v21.2.15
- Updated @bluehalo/ngx-leaflet to v21.2.1

### Fixed
- CSS styling issues

## [1.4.1] - 2026-05-31

### Changed
- Package dependency updates
- Angular CLI updates

## [1.4.0] - 2026-05-30

### Added
- CSV upload functionality with batch processing
- Real-time progress tracking for file uploads
- DRG token retrieval after login
- DRG token handling in OAuth callback

### Changed
- Upgraded to Angular 21.2.15
- Updated Angular CLI tools

### Fixed
- `showSaveFilePicker` API bug fix for file downloads

## [1.3.0] - 2026-05-25

### Added
- Beta testing features
- Feature flags for beta environment
- Additional menu items for beta users

## [1.2.0] - 2026-05-20

### Changed
- Major upgrade to Angular 21
- Migrated to standalone components architecture
- Implemented signals for state management
- Updated to native control flow (`@if`, `@for`, `@switch`)
- Migrated to Tailwind CSS v4

### Added
- Enhanced TypeScript support (v5.9.2)
- Modern Angular best practices implementation

## [1.0.0] - 2026-05-15

### Added
- Initial release of CMI Data Hub
- OAuth 2.0 authentication system
- JWT token-based authorization
- DRG Seeker functionality
- IPD Data List with search and pagination
- CMI API data download with consent form
- AI-powered IPD summary
- AI Prompt interface
- Excel export functionality
- Theme management (dark mode support)
- Responsive design with ngx-pk-ui
- Thai language support with dayjs

### Security
- Route guards with consent validation
- Auto token refresh mechanism
- HTTP interceptors for auth token injection
