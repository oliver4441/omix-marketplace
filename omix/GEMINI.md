# Omix Workspace

This workspace contains two distinct projects sharing a common brand, but with different tech stacks and design systems:

1.  **Omix Store (P2P Marketplace):** A modern, clean marketplace for the Kericho community. Uses React 18, Babel Standalone, and Tailwind CSS. (Primary files: `index.html`, `listing.html`, `sell.html`).
2.  **Omix Systems (Digital Agency):** A consultancy focused on web design, SEO, and business solutions. Uses traditional HTML/CSS (primary file: `styles.css`). (Primary files: `blog.html`, `services.html`, `pricing.html`, `about.html`, `portfolio.html`, `contact.html`).

---

# Omix Store - P2P Marketplace

Omix Store is a clean, modern P2P marketplace application specifically designed for the Kericho community. It allows users to browse, search, and list items for sale across various categories such as Electronics, Furniture, Vehicles, and Services.

## Project Overview

-   **Target Audience:** Residents of Kericho and surrounding areas.
-   **Core Features:**
    -   Product browsing by category.
    -   Real-time search functionality.
    -   Detailed listing pages with seller info and M-Pesa payment details.
    -   Ability to list new items for sale.
    -   Responsive design for mobile and desktop.

## Technologies

This project is built as a **static web application** leveraging CDN-based libraries to avoid a complex build pipeline:

-   **Frontend Library:** [React 18](https://react.dev/) (loaded via CDN).
-   **JSX Compilation:** [Babel Standalone](https://babeljs.io/docs/en/babel-standalone) (to compile JSX directly in the browser).
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/) (loaded via CDN).
-   **Icons:** [Lucide Icons](https://lucide.dev/).
-   **Typography:** [DM Sans](https://fonts.google.com/specimen/DM+Sans) via Google Fonts.
-   **Deployment:** Configured for [Vercel](https://vercel.com/).

## Architecture

The project follows a multi-page application (MPA) structure:

-   **Pages:** Each `.html` file (e.g., `index.html`, `listing.html`, `sell.html`) represents a distinct page.
-   **Entry Points:** Each HTML file has a corresponding `-app.js` file (e.g., `app.js`, `listing-app.js`, `sell-app.js`) which contains the page-specific React logic.
-   **Components:** Shared UI components are located in the `components/` directory (e.g., `Navbar.js`, `Footer.js`, `ProductCard.js`). These are included in HTML files using `<script type="text/babel" src="...">` tags.
-   **Data:** Mock data and utility functions (like currency formatting) are centralized in `utils/data.js`.
-   **Images:** Static assets and placeholders are stored in the `images/` and `public/` directories.

## Building and Running

Since this project uses Babel Standalone and CDN-based libraries, there is **no build step** or `npm install` required for development.

### Running Locally

To view the project locally, serve the root directory using any static web server:

```bash
# Using Node.js (npx)
npx serve .

# Using Python
python3 -m http.server
```

Then open `http://localhost:3000` (or the port provided by your server) in your browser.

### Deployment

The project is configured for Vercel via `vercel.json`. Deployment is handled automatically when pushing to a connected repository.

## Development Conventions

-   **Component Structure:** Use functional React components.
-   **Shared Components:** When creating a new page, ensure you include `utils/data.js` and common components in the `<head>` or before your main app script:
    ```html
    <script type="text/babel" src="utils/data.js"></script>
    <script type="text/babel" src="components/Navbar.js"></script>
    <script type="text/babel" src="components/Footer.js"></script>
    <script type="text/babel" src="app.js"></script>
    ```
-   **Styling:** Exclusively use Tailwind CSS utility classes. Avoid writing custom CSS unless absolutely necessary (defined in `<style type="text/tailwindcss">` in HTML files).
-   **Icons:** Use Lucide icon classes (e.g., `<div className="icon-search"></div>`).
- **Data Management:** All listing data should be added to `MOCK_LISTINGS` in `utils/data.js` for consistency across pages.

## Backend Roadmap (Salvaged from v1)

The following database schema is planned for a future migration to a dynamic backend using Supabase:

- **Profiles:** `id, email, full_name, phone, avatar_url, role (seller|buyer|admin), created_at`
- **Products:** `id, seller_id, title, description, price, category, condition (new|second_hand), images[], location, status (pending|approved|sold), created_at`
- **Inquiries:** `id, product_id, buyer_name, buyer_phone, buyer_email, message, created_at`
- **Orders:** `id, product_id, seller_id, buyer_id, status, commission, created_at`

Additional assets salvaged from the previous version:
- `icons.svg`: Contains social icons (GitHub, Discord, X, Bluesky).
- `images/hero.png`: Legacy hero image asset.

