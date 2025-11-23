# Check24 Web Client - Setup & Development Guide

This is the React-based web client for the Check24 Server-Driven UI (SDUI) Widget Platform.

## 📋 Project Structure

```
web-client/
├── src/
│   ├── assets/              # Static resources
│   ├── styles/              # CSS files
│   │   ├── index.css       # Global styles
│   │   ├── themes.css      # Color palette (CSS variables)
│   │   ├── layout.css      # Grid & flexbox system
│   │   ├── components.css  # Component styles
│   │   └── animations.css  # Animations & transitions
│   ├── constants/           # Shared constants
│   │   └── colors.js       # Color palette (JS constants)
│   ├── contexts/            # React Context
│   │   └── NotificationContext.jsx  # Badge counts & alerts
│   ├── components/          # Reusable components
│   │   ├── layout/         # Layout components (Header, Nav, Footer)
│   │   ├── buttons/        # Button variants
│   │   ├── widgets/        # SDUI widgets (Card, etc.)
│   │   └── common/         # Common components (Loader, etc.)
│   ├── pages/               # Page components
│   │   └── HomePage.jsx    # Main home page
│   ├── services/            # API services
│   ├── utils/               # Utility functions
│   ├── App.jsx             # Root component
│   └── main.jsx            # Entry point
├── package.json
├── vite.config.js
├── index.html
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- The Check24 Core Service running on `http://localhost:8000`

### Installation

```bash
cd web-client
npm install
```

### Development

```bash
npm run dev
```

This starts a dev server at `http://localhost:5173`.

### Building for Production

```bash
npm run build
```

Output files will be in the `dist/` directory.

## 🎨 Design System

### Colors

All colors are defined in CSS variables in `styles/themes.css`:

```css
--c24-primary-deep: #022D94      /* Deep blue */
--c24-primary-medium: #0563C1    /* Medium blue */
--c24-alert-red: #e30613         /* Red badges */
--c24-highlight-yellow: #FFBB1C  /* Yellow accents */
```

### Component Naming Convention

All CSS classes and components use the `c24-` prefix:

```css
.c24-button          /* Button component */
.c24-card            /* Card widget */
.c24-nav-btn         /* Navigation button */
.c24-header          /* Header section */
```

### Layout System

12-column CSS Grid system with responsive breakpoints:

```jsx
<div className="c24-grid">
  <div className="c24-grid-col-4">Content</div>
  <div className="c24-grid-col-4">Content</div>
  <div className="c24-grid-col-4">Content</div>
</div>
```

## 🔗 Key Components

### Card Widget

The primary widget type for displaying products/deals.

**Props:**
```javascript
{
  title: string,
  subtitle: string,
  content: string,
  image_url: string,
  cta_link: string
}
```

**Usage:**
```jsx
<Card data={widgetData} />
```

### WidgetRenderer

Maps SDUI widget definitions to React components.

**Props:**
```javascript
{
  widget: {
    widget_id: string,
    component_type: string,
    data: object,
    priority: number
  },
  index: number
}
```

### Navigation

Navigation bar with badge counts managed by `NotificationContext`.

**Update badges:**
```javascript
const { updateNotification } = useNotifications();
updateNotification('cart', 1);  // Increment cart
updateNotification('favorites', -1);  // Decrement favorites
```

## 📡 API Integration

The web client fetches data from the Check24 Core Service BFF at `/home`:

```javascript
GET http://localhost:8000/home
```

**Expected Response:**
```json
{
  "title": "Check24 - Compare & Save",
  "widgets": [
    {
      "widget_id": "card-1",
      "component_type": "Card",
      "priority": 1,
      "data": {
        "title": "Car Insurance",
        "subtitle": "Best Rates",
        "content": "Description...",
        "image_url": "...",
        "cta_link": "..."
      }
    }
  ]
}
```

## 🎯 Development Tips

### Adding a New Widget Type

1. Create component in `src/components/widgets/`:

```jsx
// src/components/widgets/Banner.jsx
export default function Banner({ data }) {
  return <div className="c24-banner">{data.title}</div>;
}
```

2. Register in `WidgetRenderer.jsx`:

```javascript
const COMPONENT_MAP = {
  Card,
  Banner,  // Add here
};
```

3. Add styles to `styles/components.css`:

```css
.c24-banner {
  /* Banner styles */
}
```

### Creating Global State

Use React Context for app-wide state:

```javascript
import { useNotifications } from '../contexts/NotificationContext';

export default function MyComponent() {
  const { notifications, updateNotification } = useNotifications();
  
  return <span>{notifications.cart}</span>;
}
```

### Debugging

Enable Redux DevTools and check browser console for:
- `📡 Fetching widget data from /home endpoint...`
- `✅ Widget data received:`
- `❌ Fetch failed:`

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:8000
VITE_API_POLLING_INTERVAL=10000
```

Access in code:

```javascript
const apiUrl = import.meta.env.VITE_API_URL;
```

## 📦 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Static Host

The built files in `dist/` can be deployed to any static host:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

### Docker Deployment

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🐛 Troubleshooting

### Widget data not loading

- Check if Core Service is running on `http://localhost:8000`
- Check browser console for CORS errors
- Verify `/home` endpoint is responding

### Styling issues

- Ensure all CSS imports are in the right order in `styles/index.css`
- Check CSS variable names in `styles/themes.css`
- Use browser DevTools to inspect class names

### Badge counts not updating

- Verify `NotificationContext` is wrapping your component tree
- Use `useNotifications()` hook to access context
- Check that `updateNotification()` is being called

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [lucide-react Icons](https://lucide.dev)
- [Check24 Style Guide](../docs/CONCEPT.md)

---

**Built with ❤️ for Check24 Widget Platform**