# Bug Detector Frontend (Astro)

Single-container Astro frontend running on port 3000. Provides a modern, responsive single-page UI to paste code and view analysis results.

Theme: Ocean Professional
- Primary: #2563EB
- Secondary: #F59E0B
- Background: #f9fafb
- Surface: #ffffff
- Text: #111827
- Gradient: from-blue-500/10 to-gray-50

Project Structure
- src/layouts/Layout.astro: App shell with header (title + theme toggle), main split panels, footer.
- src/pages/index.astro: Single-page layout with Code Input panel and Results panel.
- src/components/ThemeToggle.astro: Light/Dark theme toggle.

Commands
- npm install
- npm run dev  (localhost:3000)
- npm run build
- npm run preview

Note: Backend integration and actual analysis are not yet implemented; current page is scaffolded and styled with minimal interactive stubs.
