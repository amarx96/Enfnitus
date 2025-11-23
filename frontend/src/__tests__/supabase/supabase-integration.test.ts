import { submitCustomerData, testDatabaseConnection, storePricingData, getCustomerById } from '../../services/customerApi';import { submitCustomerData, testDatabaseConnection, storePricingData, getCustomerById } from '../../services/customerApi';/**



// Mock Supabase properly * Frontend Supabase Integration Tests

jest.mock('../../services/supabase', () => ({

  supabase: {// Mock Supabase properly * Tests the frontend API service functions

    from: jest.fn()

  }jest.mock('../../services/supabase', () => ({ */

}));

  supabase: {

// Mock fetch for API fallback tests

const mockFetch = jest.fn();    from: jest.fn()import { 

global.fetch = mockFetch as jest.MockedFunction<typeof fetch>;

  }  submitCustomerData, 

describe('Fixed Frontend Supabase Integration', () => {

  const mockCustomerData = {}));  storePricingData, 

    vorname: 'Max',

    nachname: 'Mustermann',   createContract, 

    strasse: 'Hauptstraße',

    hausnummer: '123',// Mock fetch for API fallback tests  getCustomerById, 

    plz: '10115',

    ort: 'Berlin',const mockFetch = jest.fn();  testDatabaseConnection 

    email: 'max.mustermann@example.com',

    telefon: '+49 30 12345678'global.fetch = mockFetch as jest.MockedFunction<typeof fetch>;} from '../../services/customerApi';

  };



  beforeEach(() => {

    jest.clearAllMocks();describe('Fixed Frontend Supabase Integration', () => {// Mock Supabase for testing

    mockFetch.mockReset();

  });  const mockCustomerData = {// Mock supabase for frontend testing



  describe('Customer Data Submission', () => {    vorname: 'Max',jest.mock('../../services/supabase', () => ({

    it('should submit customer data successfully', async () => {

      const { supabase } = require('../../services/supabase');    nachname: 'Mustermann',   supabase: {

      

      // Mock successful response    strasse: 'Hauptstraße',    from: jest.fn(() => ({

      const mockResponse = {

        data: { id: 'test-id-123', ...mockCustomerData },    hausnummer: '123',      insert: jest.fn(() => ({

        error: null

      };    plz: '10115',        select: jest.fn(() => ({

      

      // Create proper mock chain for Supabase    ort: 'Berlin',          single: jest.fn()

      const mockSingle = jest.fn().mockResolvedValue(mockResponse);

      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });    email: 'max.mustermann@example.com',        }))

      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });

          telefon: '+49 30 12345678'      })),

      supabase.from.mockReturnValue({ insert: mockInsert });

  };      select: jest.fn(() => ({

      const result = await submitCustomerData(mockCustomerData);

        eq: jest.fn(() => ({

      expect(result.success).toBe(true);

      expect(result.data).toEqual(mockResponse.data);  beforeEach(() => {          single: jest.fn()

      expect(supabase.from).toHaveBeenCalledWith('customers');

    });    jest.clearAllMocks();        })),



    it('should handle submission errors and fallback to API', async () => {    mockFetch.mockReset();        head: jest.fn()

      const { supabase } = require('../../services/supabase');

        });      }))

      // Mock Supabase to fail

      const mockError = new Error('Table not found');    }))

      const mockSingle = jest.fn().mockRejectedValue(mockError);

      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });  describe('Customer Data Submission', () => {  }

      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });

          it('should submit customer data successfully', async () => {}));

      supabase.from.mockReturnValue({ insert: mockInsert });

      const { supabase } = require('../../services/supabase');

      // Mock successful API fallback

      mockFetch.mockResolvedValue({      describe('Frontend Supabase Integration', () => {

        ok: true,

        json: () => Promise.resolve({       // Mock successful response  const mockCustomerData = {

          success: true, 

          data: { id: 'api-id-123', ...mockCustomerData }       const mockResponse = {    vorname: 'John',

        })

      });        data: { id: 'test-id-123', ...mockCustomerData },    nachname: 'Doe',



      const result = await submitCustomerData(mockCustomerData);        error: null    strasse: 'Teststraße',



      expect(result.success).toBe(true);      };    hausnummer: '123',

      expect(supabase.from).toHaveBeenCalledWith('customers');

      expect(mockFetch).toHaveBeenCalledWith(          plz: '10115',

        'http://localhost:3000/api/customer',

        expect.objectContaining({      // Create proper mock chain for Supabase    ort: 'Berlin',

          method: 'POST',

          headers: {      const mockSingle = jest.fn().mockResolvedValue(mockResponse);    email: 'test@example.com',

            'Content-Type': 'application/json'

          },      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });    telefon: '+49 30 12345678'

          body: JSON.stringify(mockCustomerData)

        })      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });  };

      );

    });      



    it('should validate required fields', async () => {      supabase.from.mockReturnValue({ insert: mockInsert });  const mockPricingData = {

      const incompleteData = {

        vorname: 'Max'    plz: '10115',

        // Missing required fields

      };      const result = await submitCustomerData(mockCustomerData);    verbrauch: 3500,



      const result = await submitCustomerData(incompleteData);    haushaltsgroesse: 3,



      expect(result.success).toBe(false);      expect(result.success).toBe(true);    smartMeter: true,

      expect(result.error).toContain('Missing required fields');

    });      expect(result.data).toEqual(mockResponse.data);    selectedTariff: {

  });

      expect(supabase.from).toHaveBeenCalledWith('customers');      tariffName: 'Fix12 Grün',

  describe('Database Connection Test', () => {

    it('should test database connection successfully', async () => {    });      contractDuration: 12

      const { supabase } = require('../../services/supabase');

          },

      // Mock successful connection test

      const mockHead = jest.fn().mockResolvedValue({ error: null });    it('should handle submission errors and fallback to API', async () => {    estimatedCosts: {

      const mockSelect = jest.fn().mockReturnValue({ head: mockHead });

            const { supabase } = require('../../services/supabase');      monthlyCosts: 93.03

      supabase.from.mockReturnValue({ select: mockSelect });

          }

      const result = await testDatabaseConnection();

      // Mock Supabase to fail  };

      expect(result).toBe(true);

      expect(supabase.from).toHaveBeenCalledWith('customers');      const mockError = new Error('Table not found');

    });

      const mockSingle = jest.fn().mockRejectedValue(mockError);  beforeEach(() => {

    it('should handle connection test failure', async () => {

      const { supabase } = require('../../services/supabase');      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });    jest.clearAllMocks();

      

      // Mock connection failure      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });  });

      const mockError = new Error('Connection failed');

      const mockHead = jest.fn().mockRejectedValue(mockError);      

      const mockSelect = jest.fn().mockReturnValue({ head: mockHead });

            supabase.from.mockReturnValue({ insert: mockInsert });  describe('Customer Data Submission', () => {

      supabase.from.mockReturnValue({ select: mockSelect });

    it('should submit customer data successfully', async () => {

      const result = await testDatabaseConnection();

      // Mock successful API fallback      const { supabase } = require('../../src/services/supabase');

      expect(result).toBe(false);

    });      mockFetch.mockResolvedValue({      

  });

        ok: true,      // Mock successful response

  describe('Pricing Data Storage', () => {

    it('should store pricing data successfully', async () => {        json: () => Promise.resolve({       const mockResponse = {

      const { supabase } = require('../../services/supabase');

                success: true,         data: { id: 'test-id-123', ...mockCustomerData },

      const mockPricingData = {

        plz: '10115',          data: { id: 'api-id-123', ...mockCustomerData }         error: null

        verbrauch: 3500,

        haushaltsgroesse: 3,        })      };

        smart_meter: true,

        selected_tariff: { name: 'Test Tariff' },      });      

        estimated_costs: { monthly: 85 }

      };      supabase.from().insert().select().single.mockResolvedValue(mockResponse);



      const mockResponse = {      const result = await submitCustomerData(mockCustomerData);

        data: { id: 'pricing-id-123', customer_id: 'customer-id-123', ...mockPricingData },

        error: null      const result = await submitCustomerData(mockCustomerData);

      };

            expect(result.success).toBe(true);

      const mockSingle = jest.fn().mockResolvedValue(mockResponse);

      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });      expect(supabase.from).toHaveBeenCalledWith('customers');      expect(result.success).toBe(true);

      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });

            expect(mockFetch).toHaveBeenCalledWith(      expect(result.data).toEqual(mockResponse.data);

      supabase.from.mockReturnValue({ insert: mockInsert });

        'http://localhost:3000/api/customer',      expect(supabase.from).toHaveBeenCalledWith('customers');

      const result = await storePricingData('customer-id-123', mockPricingData);

        expect.objectContaining({    });

      expect(result.success).toBe(true);

      expect(result.data).toEqual(mockResponse.data);          method: 'POST',

      expect(supabase.from).toHaveBeenCalledWith('pricing_data');

    });          headers: {    it('should handle submission errors gracefully', async () => {

  });

            'Content-Type': 'application/json'      const { supabase } = require('../../src/services/supabase');

  describe('Customer Retrieval', () => {

    it('should retrieve customer by ID successfully', async () => {          },      

      const { supabase } = require('../../services/supabase');

                body: JSON.stringify(mockCustomerData)      // Mock error response

      const mockResponse = {

        data: { id: 'customer-id-123', ...mockCustomerData },        })      const mockError = new Error('Database connection failed');

        error: null

      };      );      supabase.from().insert().select().single.mockRejectedValue(mockError);

      

      const mockSingle = jest.fn().mockResolvedValue(mockResponse);    });

      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });

      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });      const result = await submitCustomerData(mockCustomerData);

      

      supabase.from.mockReturnValue({ select: mockSelect });    it('should validate required fields', async () => {



      const result = await getCustomerById('customer-id-123');      const incompleteData = {      expect(result.success).toBe(false);



      expect(result.success).toBe(true);        vorname: 'Max'      expect(result.error).toBeDefined();

      expect(result.data).toEqual(mockResponse.data);

      expect(supabase.from).toHaveBeenCalledWith('customers');        // Missing required fields    });

    });

      };

    it('should handle customer not found', async () => {

      const { supabase } = require('../../services/supabase');    it('should validate required fields', async () => {

      

      const mockError = new Error('No rows found');      const result = await submitCustomerData(incompleteData);      const incompleteData = {

      const mockSingle = jest.fn().mockRejectedValue(mockError);

      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });        vorname: 'John',

      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

            expect(result.success).toBe(false);        nachname: '',

      supabase.from.mockReturnValue({ select: mockSelect });

      expect(result.error).toContain('Missing required fields');        strasse: '',

      const result = await getCustomerById('non-existent-id');

    });        hausnummer: '',

      expect(result.success).toBe(false);

      expect(result.error).toBeDefined();  });        plz: '',

    });

  });        ort: '',



  describe('Error Handling', () => {  describe('Database Connection Test', () => {        email: ''

    it('should handle network errors gracefully', async () => {

      const { supabase } = require('../../services/supabase');    it('should test database connection successfully', async () => {        // Missing telefon

      

      // Mock network error      const { supabase } = require('../../services/supabase');      };

      const networkError = new Error('Network request failed');

      const mockSingle = jest.fn().mockRejectedValue(networkError);      

      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });

      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });      // Mock successful connection test      const result = await submitCustomerData(incompleteData as any);

      

      supabase.from.mockReturnValue({ insert: mockInsert });      const mockHead = jest.fn().mockResolvedValue({ error: null });



      // Mock API fallback to also fail      const mockSelect = jest.fn().mockReturnValue({ head: mockHead });      // The function should still attempt to submit, validation happens at DB level

      mockFetch.mockRejectedValue(new Error('Network error'));

            expect(result).toBeDefined();

      const result = await submitCustomerData(mockCustomerData);

      supabase.from.mockReturnValue({ select: mockSelect });    });

      expect(result.success).toBe(false);

      expect(result.error).toBeDefined();  });

    });

  });      const result = await testDatabaseConnection();

});
  describe('Pricing Data Storage', () => {

      expect(result).toBe(true);    it('should store pricing data successfully', async () => {

      expect(supabase.from).toHaveBeenCalledWith('customers');      const { supabase } = require('../../src/services/supabase');

    });      

      const mockResponse = {

    it('should handle connection test failure', async () => {        data: { id: 'pricing-id-123', customer_id: 'customer-id-123' },

      const { supabase } = require('../../services/supabase');        error: null

            };

      // Mock connection failure      

      const mockError = new Error('Connection failed');      supabase.from().insert().select().single.mockResolvedValue(mockResponse);

      const mockHead = jest.fn().mockRejectedValue(mockError);

      const mockSelect = jest.fn().mockReturnValue({ head: mockHead });      const result = await storePricingData('customer-id-123', mockPricingData);

      

      supabase.from.mockReturnValue({ select: mockSelect });      expect(result.success).toBe(true);

      expect(result.data).toEqual(mockResponse.data);

      const result = await testDatabaseConnection();      expect(supabase.from).toHaveBeenCalledWith('pricing_data');

    });

      expect(result).toBe(false);

    });    it('should handle pricing data storage errors', async () => {

  });      const { supabase } = require('../../src/services/supabase');

      

  describe('Pricing Data Storage', () => {      const mockError = new Error('Foreign key constraint failed');

    it('should store pricing data successfully', async () => {      supabase.from().insert().select().single.mockRejectedValue(mockError);

      const { supabase } = require('../../services/supabase');

            const result = await storePricingData('invalid-customer-id', mockPricingData);

      const mockPricingData = {

        plz: '10115',      expect(result.success).toBe(false);

        verbrauch: 3500,      expect(result.error).toBeDefined();

        haushaltsgroesse: 3,    });

        smart_meter: true,  });

        selected_tariff: { name: 'Test Tariff' },

        estimated_costs: { monthly: 85 }  describe('Contract Creation', () => {

      };    it('should create contract successfully', async () => {

      const { supabase } = require('../../src/services/supabase');

      const mockResponse = {      

        data: { id: 'pricing-id-123', customer_id: 'customer-id-123', ...mockPricingData },      const mockResponse = {

        error: null        data: { 

      };          id: 'contract-id-123', 

                customer_id: 'customer-id-123',

      const mockSingle = jest.fn().mockResolvedValue(mockResponse);          pricing_id: 'pricing-id-123',

      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });          status: 'draft'

      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });        },

              error: null

      supabase.from.mockReturnValue({ insert: mockInsert });      };

      

      const result = await storePricingData('customer-id-123', mockPricingData);      supabase.from().insert().select().single.mockResolvedValue(mockResponse);



      expect(result.success).toBe(true);      const contractData = {

      expect(result.data).toEqual(mockResponse.data);        contractNumber: 'CONTRACT-123',

      expect(supabase.from).toHaveBeenCalledWith('pricing_data');        termsAccepted: true

    });      };

  });

      const result = await createContract('customer-id-123', 'pricing-id-123', contractData);

  describe('Customer Retrieval', () => {

    it('should retrieve customer by ID successfully', async () => {      expect(result.success).toBe(true);

      const { supabase } = require('../../services/supabase');      expect(result.data).toEqual(mockResponse.data);

            expect(supabase.from).toHaveBeenCalledWith('contracts');

      const mockResponse = {    });

        data: { id: 'customer-id-123', ...mockCustomerData },  });

        error: null

      };  describe('Customer Retrieval', () => {

          it('should retrieve customer by ID successfully', async () => {

      const mockSingle = jest.fn().mockResolvedValue(mockResponse);      const { supabase } = require('../../src/services/supabase');

      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });      

      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });      const mockResponse = {

              data: { id: 'customer-id-123', ...mockCustomerData },

      supabase.from.mockReturnValue({ select: mockSelect });        error: null

      };

      const result = await getCustomerById('customer-id-123');      

      supabase.from().select().eq().single.mockResolvedValue(mockResponse);

      expect(result.success).toBe(true);

      expect(result.data).toEqual(mockResponse.data);      const result = await getCustomerById('customer-id-123');

      expect(supabase.from).toHaveBeenCalledWith('customers');

    });      expect(result.success).toBe(true);

      expect(result.data).toEqual(mockResponse.data);

    it('should handle customer not found', async () => {    });

      const { supabase } = require('../../services/supabase');

          it('should handle customer not found', async () => {

      const mockError = new Error('No rows found');      const { supabase } = require('../../src/services/supabase');

      const mockSingle = jest.fn().mockRejectedValue(mockError);      

      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });      const mockError = new Error('No rows found');

      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });      supabase.from().select().eq().single.mockRejectedValue(mockError);

      

      supabase.from.mockReturnValue({ select: mockSelect });      const result = await getCustomerById('non-existent-id');



      const result = await getCustomerById('non-existent-id');      expect(result.success).toBe(false);

      expect(result.error).toBeDefined();

      expect(result.success).toBe(false);    });

      expect(result.error).toBeDefined();  });

    });

  });  describe('Database Connection Test', () => {

    it('should test database connection successfully', async () => {

  describe('Error Handling', () => {      const { supabase } = require('../../src/services/supabase');

    it('should handle network errors gracefully', async () => {      

      const { supabase } = require('../../services/supabase');      // Mock successful connection test

            supabase.from().select.mockReturnValue({

      // Mock network error        head: jest.fn().mockResolvedValue({ error: null })

      const networkError = new Error('Network request failed');      });

      const mockSingle = jest.fn().mockRejectedValue(networkError);

      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });      const result = await testDatabaseConnection();

      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });

            expect(result).toBe(true);

      supabase.from.mockReturnValue({ insert: mockInsert });    });



      // Mock API fallback to also fail    it('should handle connection test failure', async () => {

      mockFetch.mockRejectedValue(new Error('Network error'));      const { supabase } = require('../../src/services/supabase');

      

      const result = await submitCustomerData(mockCustomerData);      // Mock connection failure

      const mockError = new Error('Connection failed');

      expect(result.success).toBe(false);      supabase.from().select.mockReturnValue({

      expect(result.error).toBeDefined();        head: jest.fn().mockRejectedValue(mockError)

    });      });

  });

});      const result = await testDatabaseConnection();

      expect(result).toBe(false);
    });

    it('should handle table not found gracefully', async () => {
      const { supabase } = require('../../src/services/supabase');
      
      // Mock table not found error (PGRST116)
      const mockError = { code: 'PGRST116', message: 'relation does not exist' };
      supabase.from().select.mockReturnValue({
        head: jest.fn().mockResolvedValue({ error: mockError })
      });

      const result = await testDatabaseConnection();

      expect(result).toBe(true); // Should return true even if tables don't exist yet
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await submitCustomerData(mockCustomerData);

      // Should fall back to direct Supabase call, which we'll mock to fail too
      expect(result.success).toBe(false);
    });

    it('should handle API fallback', async () => {
      const { supabase } = require('../../src/services/supabase');
      
      // Mock Supabase to fail
      supabase.from().insert().select().single.mockRejectedValue(new Error('Supabase error'));
      
      // Mock fetch to succeed
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { id: 'api-id-123' } })
      });

      const result = await submitCustomerData(mockCustomerData);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('api-id-123');
    });
  });
});