# Aurora Scents Tanzania — Inventory & CRM Gateway

A premium, bespoke Inventory Catalog and Customer Relationship Management (CRM) dashboard designed for **Aurora Scents Tanzania**. This application provides a unified layout for managing fragrance stock levels, recording retail sales, logging operational expenditures, and analyzing customer profiles.

---

## 🔑 Presentation Access & Roles

For presentation and review, the app includes a secure gateway simulation. Each role provides access to specific analytical cards and features tailored to that business scope:

| Access Role | Dashboard Metrics | Logged OVERHEAD View | Demo Password |
| :--- | :--- | :--- | :--- |
| **Administrator** | Full Control (Stock & System Settings) | Cash Flow & Ledger | `admin123` |
| **CEO** | Comprehensive Business Performance | Cash Flow & Ledger | `ceo123` |
| **Manager** | Sales Volumes, Stock Operations | Hidden (Overhead Security) | `manager123` |

---

## 🌟 Key Features

* **Secure Role Gateway**: Sleek glassmorphism login interface validating preset access roles.
* **Dynamic Analytics**: Real-time sales velocities, unit margins, and progress indicators checking completion of the annual profit target.
* **Product Catalog**: Fragrance inventory list with Collections classification (Signature, Elite, Deciduous, Standard), wholesale margins, SKU autofill, and low-stock alerts.
* **Stock Movements Log**: Audited ledger logs tracking all restocks (Stock In) and retail sales (Stock Out).
* **Cash Flow Progression**: Slicing operational expenditures (Rent, Customs Duties, shipping, ads) and plotting cumulative balances dynamically.
* **Bespoke CRM**: Customer cards tracking purchase counts, lifetime values (LTV), favorite fragrance preferences, and contacts.
* **Mobile First Design**: Stacking grids, responsive navigation drawer, master-detail CRM panels, and responsive table card-blocks designed to adapt beautifully to viewports under `768px`.

---

## 🛠️ Technology Stack

* **Core Structure**: HTML5 Semantic markup.
* **Styles**: Vanilla CSS3 Custom Properties (Nusantara branding color scheme, glassmorphism, responsive grid layers).
* **Application Logic**: Vanilla JavaScript (ES6 Modules, local storage state persistence).
* **Development Server & Bundle**: [Vite](https://vite.dev/).

---

## 💻 Local Setup & Development

To run this application locally on your computer:

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

### Installation
1. Navigate to the project directory:
   ```bash
   cd "aurora systems"
   ```
2. Install the dev dependencies:
   ```bash
   npm install
   ```

### Running the Development Server
Start the local server:
```bash
npm run dev
```
Open the output local address (usually `http://localhost:5173`) in your web browser.

### Production Build
To generate optimized production assets in the `dist` directory:
```bash
npm run build
```
These assets are ready to be dragged and dropped into Netlify or linked directly to Vercel.
