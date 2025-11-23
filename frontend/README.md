# EVU Frontend - Enfinitus Energie Pricing Portal

React-based frontend application for the Enfinitus Energie EVU (Electricity Utility) pricing calculator and customer portal.

## Features

### 🎯 Pricing Calculator
- **Postal Code (PLZ) Input**: Enter German postal codes to get location-specific pricing
- **Household Size**: Interactive slider for 1-8+ people
- **Consumption Estimation**: Automatic estimation based on household size with manual override
- **Smart Meter Options**: Choose if you have or want a smart meter
- **Solar PV Integration**: Options for existing or desired solar installations
- **Electric Vehicle Support**: Additional consumption calculations for EV owners

### 👤 Customer Registration
- **Personal Information**: Name, contact details
- **Address Management**: Complete German address support
- **Data Validation**: Real-time form validation with German localization
- **GDPR Compliance**: Data protection information and consent

### 📄 Contract Management
- **Real-time Pricing**: Integration with backend pricing API
- **Contract Drafts**: Automatic creation of contract proposals
- **PDF Generation**: Download contract summaries
- **Email Integration**: Automated email confirmations

## Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI) v5
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Styling**: Emotion (CSS-in-JS)
- **Build Tool**: Create React App

## Design System

### Theme
- **Dark Mode**: Primary interface with Tibber-inspired design
- **Colors**: 
  - Primary: `#00d4aa` (Tibber Green)
  - Secondary: `#ff6b35` (Orange accent)
  - Background: Dark theme with `#1a1a1a` and `#2a2a2a`
- **Typography**: Roboto font family with responsive sizing

### Components
- **Cards**: Rounded corners (16px) with Material shadows
- **Buttons**: Custom styling with no text transform, 8px border radius
- **Form Fields**: Consistent 8px border radius, proper spacing
- **Icons**: Material Design icons for intuitive navigation

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- EVU Backend running on port 3000

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

The application will be available at `http://localhost:3001` and will proxy API requests to the backend at `http://localhost:3000`.

### Available Scripts

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Eject from Create React App (not recommended)
npm run eject
```

## API Integration

The frontend integrates with the EVU Backend APIs:

### Pricing API
- `POST /api/v1/pricing/berechnen` - Calculate pricing for location and consumption
- `GET /api/v1/pricing/tariffe` - List available tariffs

### Authentication API  
- `POST /api/v1/auth/register` - Register new customers
- `POST /api/v1/auth/login` - Customer login

### Contract API
- `POST /api/v1/vertraege/entwuerfe` - Create contract drafts
- `GET /api/v1/vertraege/entwuerfe` - List customer's contract drafts

## User Flow

1. **Pricing Form** (`/`)
   - Enter PLZ (postal code)
   - Set household size via slider
   - Optional: Set annual consumption
   - Configure smart meter preferences
   - Configure solar PV options  
   - Set electric vehicle ownership

2. **Results Page** (`/results`)
   - Display available tariffs for location
   - Show estimated monthly/annual costs
   - Compare different tariff options
   - Select preferred tariff

3. **Customer Form** (`/customer`)
   - Enter personal information
   - Provide complete address
   - Add contact details
   - Data validation and GDPR compliance

4. **Contract Summary** (`/contract`)
   - Review selected tariff and pricing
   - Confirm customer information
   - Create contract draft via API
   - Download contract summary
   - Email confirmation

## Development

### Code Structure

```
src/
├── components/           # React components
│   ├── PricingForm.tsx   # Main pricing calculator form
│   ├── PricingResults.tsx # Tariff comparison and selection
│   ├── CustomerForm.tsx   # Customer data collection
│   └── ContractSummary.tsx # Final contract creation
├── services/            # API service layer
│   └── api.ts          # Axios configuration and API methods
├── App.tsx             # Main application router
└── index.tsx           # Application entry point
```

### Component Design Principles

- **TypeScript**: Full type safety with interfaces for all data structures
- **Responsive Design**: Mobile-first approach with Material-UI breakpoints
- **Error Handling**: Comprehensive error states and user feedback
- **Loading States**: Progress indicators for all async operations
- **Accessibility**: ARIA labels and keyboard navigation support

### State Management

The application uses React hooks for local state management:

- `useState` for component state
- `useEffect` for side effects and API calls
- Props drilling for shared data between route components
- Local storage for authentication tokens

### Form Validation

All forms include real-time validation:

- **PLZ Validation**: German postal code format (5 digits)
- **Email Validation**: RFC-compliant email format checking
- **Required Fields**: Clear marking and error messages
- **Phone Validation**: German phone number format support

## Customization

### Theming

The Material-UI theme can be customized in `src/index.tsx`:

```typescript
const theme = createTheme({
  palette: {
    primary: { main: '#00d4aa' },
    secondary: { main: '#ff6b35' },
    // ... other theme options
  },
});
```

### API Configuration

API endpoints and configuration are in `src/services/api.ts`:

```typescript
const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  // ... other axios options
});
```

## Production Deployment

### Build Process

```bash
# Create production build
npm run build

# Serve static files (example with serve)
npx serve -s build -l 3001
```

### Environment Variables

Create `.env.production`:

```
REACT_APP_API_URL=https://your-backend-domain.com/api/v1
REACT_APP_ENV=production
```

### Deployment Checklist

- [ ] Update API endpoints for production
- [ ] Configure proper CORS in backend
- [ ] Set up SSL certificates
- [ ] Configure content security policy
- [ ] Enable compression and caching
- [ ] Set up error monitoring

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow TypeScript best practices
2. Use Material-UI components consistently
3. Add proper error handling
4. Include loading states for async operations
5. Maintain responsive design
6. Add unit tests for complex logic

## License

Copyright © 2024 Enfinitus Energie. All rights reserved.