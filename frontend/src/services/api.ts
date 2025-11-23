import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor for adding auth tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      // Optionally redirect to login
    }
    return Promise.reject(error);
  }
);

export interface PricingRequest {
  plz: string;
  jahresverbrauch?: number;
  haushaltgroesse?: number;
  tariftyp?: string;
}

export interface CustomerRegistration {
  vorname: string;
  nachname: string;
  email: string;
  telefon?: string;
  adresse: {
    strasse: string;
    hausnummer: string;
    plz: string;
    ort: string;
  };
  passwort: string;
}

export interface ContractDraftRequest {
  kampagnen_id: string;
  tarif_id: string;
  geschaetzter_jahresverbrauch: number;
  vertragsbeginn: string;
  zusaetzliche_bedingungen?: any;
  notizen?: string;
}

export const apiService = {
  // Pricing endpoints
  calculatePricing: async (data: PricingRequest) => {
    const response = await api.post('/pricing/berechnen', data);
    return response.data;
  },

  getTariffs: async () => {
    const response = await api.get('/pricing/tariffe');
    return response.data;
  },

  getLocationInfo: async (plz: string) => {
    const response = await api.get(`/pricing/standorte/${plz}`);
    return response.data;
  },

  // Authentication endpoints
  registerCustomer: async (data: CustomerRegistration) => {
    const response = await api.post('/auth/register', data);
    if (response.data.daten?.token) {
      localStorage.setItem('auth_token', response.data.daten.token);
    }
    return response.data;
  },

  loginCustomer: async (email: string, passwort: string) => {
    const response = await api.post('/auth/login', { email, passwort });
    if (response.data.daten?.token) {
      localStorage.setItem('auth_token', response.data.daten.token);
    }
    return response.data;
  },

  // Contract endpoints
  createContractDraft: async (data: ContractDraftRequest) => {
    const response = await api.post('/vertraege/entwuerfe', data);
    return response.data;
  },

  getContractDrafts: async () => {
    const response = await api.get('/vertraege/entwuerfe');
    return response.data;
  },

  getContractDraft: async (draftId: string) => {
    const response = await api.get(`/vertraege/entwuerfe/${draftId}`);
    return response.data;
  },

  // Customer endpoints
  getCustomerProfile: async () => {
    const response = await api.get('/kunde/profil');
    return response.data;
  },

  updateCustomerProfile: async (data: any) => {
    const response = await api.put('/kunde/profil', data);
    return response.data;
  },
};

export default apiService;