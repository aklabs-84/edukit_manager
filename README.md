# Project Documentation

## 1. Product Requirements Document (PRD)

### Project Overview
"EduKit Manager" is a web application designed for coding educators and administrators to manage the inventory of teaching aids (e.g., Arduino kits, sensors, robots). It utilizes Google Sheets as a database via Google Apps Script (GAS).

### User Stories
1. **Dashboard:** As an admin, I want to see a high-level overview of total inventory, low-stock items, and recently added items.
2. **Inventory Management:** As an admin, I want to view a searchable list of all items.
3. **CRUD Operations:** As an admin, I want to add new items, update quantities/details, and delete obsolete items.
4. **Data Persistence:** As an admin, I want data to be synchronized with my Google Sheet.

### Functional Requirements
*   **Connection:** Allow user to input their specific Google Apps Script Web App URL.
*   **Dashboard Page:** Display KPIs (Total Items, Total Quantity, Low Stock Alerts) and a "New Arrivals" list.
*   **Inventory Page:** A data grid with filtering and sorting.
*   **Forms:** Modal-based forms for Adding and Editing items.
*   **Safety:** Confirmation dialogs for deletion.

## 2. Technical Requirements Document (TRD)

### Tech Stack
*   **Frontend:** React 18, TypeScript, Tailwind CSS.
*   **Routing:** React Router (HashRouter) for navigation between Dashboard and Inventory.
*   **State Management:** React Context API for global state (Inventory Data, API URL).
*   **Visualization:** Recharts for data visualization on the dashboard.
*   **Icons:** Lucide-React.

### Data Model (TypeScript Interface)
```typescript
interface InventoryItem {
  id: string;
  name: string;
  category: string; // e.g., 'Sensor', 'Board', 'Robot'
  quantity: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  lastUpdated: string;
}
```

### API Strategy (Google Apps Script)
The web app will communicate with the GAS Web App URL.
*   **GET:** Fetch all data.
*   **POST:** Handle Add, Update, Delete actions (tunneled via POST to avoid simple GET limits and handle complex payloads).
    *   Payload structure: `{ action: 'create' | 'update' | 'delete', data: Item }`

## 3. Task List
1.  [x] Setup project skeleton (index, App, types).
2.  [x] Define TypeScript interfaces and global constants.
3.  [x] Create `ApiService` to handle logic for switching between Mock Data and Real GAS URL.
4.  [x] Implement `AppContext` to manage state across pages.
5.  [x] Build `Layout` component with navigation sidebar.
6.  [x] Develop `Dashboard` component with Charts and Recent Activity.
7.  [x] Develop `Inventory` component with Table, Search, and Modals.
8.  [x] Implement Settings to save the GAS URL.
9.  [x] Style with Tailwind CSS for a professional look.
