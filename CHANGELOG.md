# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-07-05
### Added
- **Global Loading State**: Modern UI spinner and backdrop blocking interaction during critical operations (Dashboard load, AI interaction, Registration).
- **Empty States**: Friendly empty state placeholders when data is unavailable for Chat and Challenge.
- **Admin Navigation**: Dynamic Role-based UI rendering that exposes the Admin Dashboard exclusively for `admin` accounts.
- **Custom Error Pages**: Designed `404.html` (Not Found) and `500.html` (Internal Server Error) to match the global brand theme.
- **Extensive Documentation**: Added Mermaids diagrams (Architecture, ERD), REST API flows, and Tech Stack badges to README.md.

### Changed
- Improved error handling across all API routes.
- Enhanced environment variable validation.
- Standardized UI interactions for the AI Assistant.

## [1.0.0] - 2026-07-01
### Added
- Initial Release of NovaMind platform.
- Integration with Supabase for data persistence.
- Integration with OpenAI for AI features.
- Multi-step registration form.
- Dashboard, Daily Challenges, and Achievements.
- Global Theme toggling (Dark/Light Mode).
