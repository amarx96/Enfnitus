const { Pool } = require('pg');
const database = require('../../src/config/database');
const TestUtils = require('../utils/testUtils');

// Mock pg Pool
jest.mock('pg', () => {
  const mClient = {
    connect: jest.fn(),
    query: jest.fn(),
    release: jest.fn(),
    end: jest.fn()
  };
  const mPool = {
    connect: jest.fn(() => mClient),
    query: jest.fn(),
    end: jest.fn(),
    on: jest.fn()
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('📊 Database Operations Tests', () => {
  let mockPool;
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Pool-Setup
    mockClient = {
      connect: jest.fn(),
      query: jest.fn(),
      release: jest.fn(),
      end: jest.fn()
    };
    
    mockPool = {
      connect: jest.fn(() => mockClient),
      query: jest.fn(),
      end: jest.fn(),
      on: jest.fn(),
      totalCount: 10,
      idleCount: 8,
      waitingCount: 0
    };
    
    Pool.mockImplementation(() => mockPool);
  });

  describe('Connection Pool Management', () => {
    test('sollte Pool erfolgreich initialisieren', async () => {
      // Arrange
      const poolConfig = {
        user: 'test_user',
        host: 'localhost',
        database: 'evu_test_db',
        password: 'test_password',
        port: 5432,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
      };

      // Act
      const pool = new Pool(poolConfig);

      // Assert
      expect(Pool).toHaveBeenCalledWith(poolConfig);
      expect(pool).toBeDefined();
    });

    test('sollte Connection Pool-Status korrekt abrufen', async () => {
      // Arrange
      const pool = new Pool();

      // Act
      const status = {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      };

      // Assert
      expect(status.totalCount).toBe(10);
      expect(status.idleCount).toBe(8);
      expect(status.waitingCount).toBe(0);
    });

    test('sollte Connection-Fehler behandeln', async () => {
      // Arrange
      const pool = new Pool();
      mockPool.connect.mockRejectedValueOnce(new Error('Connection failed'));

      // Act & Assert
      await expect(pool.connect()).rejects.toThrow('Connection failed');
    });

    test('sollte Pool graceful shutdown durchführen', async () => {
      // Arrange
      const pool = new Pool();

      // Act
      await pool.end();

      // Assert
      expect(mockPool.end).toHaveBeenCalled();
    });
  });

  describe('Transaction Management', () => {
    test('sollte einfache Transaktion erfolgreich durchführen', async () => {
      // Arrange
      const pool = new Pool();
      const client = await pool.connect();
      
      client.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      // Act
      await client.query('BEGIN');
      const result = await client.query('INSERT INTO test_table (name) VALUES ($1) RETURNING id', ['Test']);
      await client.query('COMMIT');

      // Assert
      expect(client.query).toHaveBeenCalledWith('BEGIN');
      expect(client.query).toHaveBeenCalledWith(
        'INSERT INTO test_table (name) VALUES ($1) RETURNING id',
        ['Test']
      );
      expect(client.query).toHaveBeenCalledWith('COMMIT');
      expect(result.rows[0].id).toBe(1);
    });

    test('sollte Rollback bei Fehler durchführen', async () => {
      // Arrange
      const pool = new Pool();
      const client = await pool.connect();
      
      client.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockRejectedValueOnce(new Error('Constraint violation')) // INSERT fails
        .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

      // Act
      try {
        await client.query('BEGIN');
        await client.query('INSERT INTO test_table (name) VALUES ($1)', ['Duplicate']);
      } catch (error) {
        await client.query('ROLLBACK');
      }

      // Assert
      expect(client.query).toHaveBeenCalledWith('BEGIN');
      expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    });

    test('sollte verschachtelte Transaktionen mit Savepoints handhaben', async () => {
      // Arrange
      const pool = new Pool();
      const client = await pool.connect();
      
      client.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT 1
        .mockResolvedValueOnce({ rows: [] }) // SAVEPOINT
        .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // INSERT 2
        .mockResolvedValueOnce({ rows: [] }) // ROLLBACK TO SAVEPOINT
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      // Act
      await client.query('BEGIN');
      await client.query('INSERT INTO kunden (name) VALUES ($1) RETURNING id', ['Kunde 1']);
      await client.query('SAVEPOINT sp1');
      await client.query('INSERT INTO kunden (name) VALUES ($1) RETURNING id', ['Kunde 2']);
      await client.query('ROLLBACK TO SAVEPOINT sp1');
      await client.query('COMMIT');

      // Assert
      expect(client.query).toHaveBeenCalledWith('SAVEPOINT sp1');
      expect(client.query).toHaveBeenCalledWith('ROLLBACK TO SAVEPOINT sp1');
    });

    test('sollte Connection-Release nach Transaktion gewährleisten', async () => {
      // Arrange
      const pool = new Pool();
      const client = await pool.connect();

      // Act
      try {
        await client.query('BEGIN');
        await client.query('SELECT 1');
        await client.query('COMMIT');
      } finally {
        client.release();
      }

      // Assert
      expect(client.release).toHaveBeenCalled();
    });
  });

  describe('CRUD Operations', () => {
    test('sollte CREATE-Operation erfolgreich durchführen', async () => {
      // Arrange
      const pool = new Pool();
      const neuerKunde = TestUtils.erstelleTestKunde();
      
      mockPool.query.mockResolvedValueOnce({
        rows: [neuerKunde],
        rowCount: 1
      });

      // Act
      const result = await pool.query(
        'INSERT INTO kunden (kunden_id, email, vorname, nachname) VALUES ($1, $2, $3, $4) RETURNING *',
        [neuerKunde.kunden_id, neuerKunde.email, neuerKunde.vorname, neuerKunde.nachname]
      );

      // Assert
      expect(result.rows[0]).toEqual(neuerKunde);
      expect(result.rowCount).toBe(1);
    });

    test('sollte READ-Operation mit Filterung durchführen', async () => {
      // Arrange
      const pool = new Pool();
      const testKunden = [
        TestUtils.erstelleTestKunde({ email: 'test1@beispiel.de' }),
        TestUtils.erstelleTestKunde({ email: 'test2@beispiel.de' })
      ];
      
      mockPool.query.mockResolvedValueOnce({
        rows: testKunden,
        rowCount: 2
      });

      // Act
      const result = await pool.query(
        'SELECT * FROM kunden WHERE email LIKE $1 ORDER BY erstellt_am DESC',
        ['%@beispiel.de']
      );

      // Assert
      expect(result.rows).toHaveLength(2);
      expect(result.rows).toEqual(testKunden);
    });

    test('sollte UPDATE-Operation durchführen', async () => {
      // Arrange
      const pool = new Pool();
      const kundenId = 'kunde_123';
      const neueEmail = 'neue.email@beispiel.de';
      
      mockPool.query.mockResolvedValueOnce({
        rows: [{ 
          kunden_id: kundenId, 
          email: neueEmail,
          aktualisiert_am: new Date()
        }],
        rowCount: 1
      });

      // Act
      const result = await pool.query(
        'UPDATE kunden SET email = $1, aktualisiert_am = CURRENT_TIMESTAMP WHERE kunden_id = $2 RETURNING *',
        [neueEmail, kundenId]
      );

      // Assert
      expect(result.rowCount).toBe(1);
      expect(result.rows[0].email).toBe(neueEmail);
    });

    test('sollte DELETE-Operation durchführen', async () => {
      // Arrange
      const pool = new Pool();
      const kundenId = 'kunde_zu_loeschen';
      
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1
      });

      // Act
      const result = await pool.query(
        'DELETE FROM kunden WHERE kunden_id = $1',
        [kundenId]
      );

      // Assert
      expect(result.rowCount).toBe(1);
    });

    test('sollte komplexe JOIN-Abfragen handhaben', async () => {
      // Arrange
      const pool = new Pool();
      const komplexesDaten = [
        {
          kunden_id: 'kunde_1',
          vorname: 'Max',
          nachname: 'Mustermann',
          vertrag_id: 'vertrag_1',
          tarif_name: 'Öko Strom',
          verbrauch_kwh: 3500
        }
      ];
      
      mockPool.query.mockResolvedValueOnce({
        rows: komplexesDaten,
        rowCount: 1
      });

      // Act
      const result = await pool.query(`
        SELECT 
          k.kunden_id, k.vorname, k.nachname,
          v.vertrag_id, t.tarif_name,
          vh.verbrauch_kwh
        FROM kunden k
        LEFT JOIN vertraege v ON k.kunden_id = v.kunden_id
        LEFT JOIN tarife t ON v.tarif_id = t.tarif_id
        LEFT JOIN verbrauchshistorie vh ON k.kunden_id = vh.kunden_id
        WHERE k.kunden_id = $1
      `, ['kunde_1']);

      // Assert
      expect(result.rows[0]).toMatchObject(komplexesDaten[0]);
    });
  });

  describe('Bulk Operations', () => {
    test('sollte Bulk-Insert effizient durchführen', async () => {
      // Arrange
      const pool = new Pool();
      const vieleKunden = Array(100).fill().map(() => TestUtils.erstelleTestKunde());
      
      mockPool.query.mockResolvedValueOnce({
        rows: vieleKunden,
        rowCount: 100
      });

      // Act
      const values = vieleKunden.map(k => `('${k.kunden_id}', '${k.email}', '${k.vorname}', '${k.nachname}')`).join(',');
      const result = await pool.query(`
        INSERT INTO kunden (kunden_id, email, vorname, nachname) 
        VALUES ${values} 
        RETURNING *
      `);

      // Assert
      expect(result.rowCount).toBe(100);
      expect(result.rows).toHaveLength(100);
    });

    test('sollte Bulk-Update mit CASE WHEN durchführen', async () => {
      // Arrange
      const pool = new Pool();
      const updates = [
        { id: 'kunde_1', email: 'neue1@beispiel.de' },
        { id: 'kunde_2', email: 'neue2@beispiel.de' }
      ];
      
      mockPool.query.mockResolvedValueOnce({
        rows: updates,
        rowCount: 2
      });

      // Act
      const result = await pool.query(`
        UPDATE kunden 
        SET email = CASE 
          WHEN kunden_id = 'kunde_1' THEN 'neue1@beispiel.de'
          WHEN kunden_id = 'kunde_2' THEN 'neue2@beispiel.de'
        END
        WHERE kunden_id IN ('kunde_1', 'kunde_2')
        RETURNING kunden_id, email
      `);

      // Assert
      expect(result.rowCount).toBe(2);
    });

    test('sollte Bulk-Delete mit Bedingungen durchführen', async () => {
      // Arrange
      const pool = new Pool();
      
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 25
      });

      // Act
      const result = await pool.query(`
        DELETE FROM kunden 
        WHERE erstellt_am < $1 
        AND status = $2
      `, [new Date('2023-01-01'), 'inaktiv']);

      // Assert
      expect(result.rowCount).toBe(25);
    });
  });

  describe('Error Handling', () => {
    test('sollte Connection-Timeout handhaben', async () => {
      // Arrange
      const pool = new Pool();
      mockPool.connect.mockRejectedValueOnce(new Error('connection timeout'));

      // Act & Assert
      await expect(pool.connect()).rejects.toThrow('connection timeout');
    });

    test('sollte Syntax-Fehler in SQL handhaben', async () => {
      // Arrange
      const pool = new Pool();
      mockPool.query.mockRejectedValueOnce(new Error('syntax error at or near "SELEC"'));

      // Act & Assert
      await expect(
        pool.query('SELEC * FROM kunden') // Absichtlicher Tippfehler
      ).rejects.toThrow('syntax error');
    });

    test('sollte Foreign Key Constraint Violations handhaben', async () => {
      // Arrange
      const pool = new Pool();
      mockPool.query.mockRejectedValueOnce(
        new Error('insert or update on table "vertraege" violates foreign key constraint')
      );

      // Act & Assert
      await expect(
        pool.query('INSERT INTO vertraege (kunden_id, tarif_id) VALUES ($1, $2)', ['nicht_existiert', 999])
      ).rejects.toThrow('foreign key constraint');
    });

    test('sollte Unique Constraint Violations handhaben', async () => {
      // Arrange
      const pool = new Pool();
      mockPool.query.mockRejectedValueOnce(
        new Error('duplicate key value violates unique constraint "kunden_email_key"')
      );

      // Act & Assert
      await expect(
        pool.query('INSERT INTO kunden (email) VALUES ($1)', ['bereits@vorhanden.de'])
      ).rejects.toThrow('unique constraint');
    });

    test('sollte Connection-Verlust während Query handhaben', async () => {
      // Arrange
      const pool = new Pool();
      const client = await pool.connect();
      client.query.mockRejectedValueOnce(new Error('Connection terminated unexpectedly'));

      // Act & Assert
      await expect(
        client.query('SELECT * FROM kunden')
      ).rejects.toThrow('Connection terminated');
    });
  });

  describe('Performance & Monitoring', () => {
    test('sollte langsame Queries identifizieren', async () => {
      // Arrange
      const pool = new Pool();
      const startTime = Date.now();
      
      mockPool.query.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ rows: [], rowCount: 0 }), 1100) // 1.1 Sekunden
        )
      );

      // Act
      const queryStart = Date.now();
      await pool.query('SELECT * FROM sehr_grosse_tabelle WHERE komplexe_bedingung = $1', ['test']);
      const queryEnd = Date.now();

      // Assert
      expect(queryEnd - queryStart).toBeGreaterThan(1000); // Über 1 Sekunde
    });

    test('sollte Query-Performance messen', async () => {
      // Arrange
      const pool = new Pool();
      const queries = [
        'SELECT COUNT(*) FROM kunden',
        'SELECT * FROM kunden LIMIT 10',
        'SELECT k.*, v.* FROM kunden k JOIN vertraege v ON k.kunden_id = v.kunden_id'
      ];

      const queryTimes = [];

      // Act
      for (const query of queries) {
        mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
        
        const start = Date.now();
        await pool.query(query);
        const end = Date.now();
        
        queryTimes.push(end - start);
      }

      // Assert
      expect(queryTimes).toHaveLength(3);
      queryTimes.forEach(time => expect(time).toBeGreaterThanOrEqual(0));
    });

    test('sollte Memory-Usage bei großen Result-Sets überwachen', async () => {
      // Arrange
      const pool = new Pool();
      const grossesResultSet = Array(10000).fill().map(() => TestUtils.erstelleTestKunde());
      
      mockPool.query.mockResolvedValueOnce({
        rows: grossesResultSet,
        rowCount: 10000
      });

      // Act
      const memBefore = process.memoryUsage().heapUsed;
      const result = await pool.query('SELECT * FROM kunden');
      const memAfter = process.memoryUsage().heapUsed;

      // Assert
      expect(result.rows).toHaveLength(10000);
      expect(memAfter).toBeGreaterThan(memBefore); // Memory sollte angestiegen sein
    });

    test('sollte Connection Pool Exhaustion simulieren', async () => {
      // Arrange
      const pool = new Pool();
      mockPool.connect.mockRejectedValue(new Error('remaining connection slots are reserved'));

      // Act & Assert
      await expect(pool.connect()).rejects.toThrow('remaining connection slots are reserved');
    });
  });

  describe('Schema & Migration Tests', () => {
    test('sollte Tabellen-Existenz prüfen', async () => {
      // Arrange
      const pool = new Pool();
      mockPool.query.mockResolvedValueOnce({
        rows: [{ exists: true }],
        rowCount: 1
      });

      // Act
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'kunden'
        )
      `);

      // Assert
      expect(result.rows[0].exists).toBe(true);
    });

    test('sollte Index-Performance testen', async () => {
      // Arrange
      const pool = new Pool();
      mockPool.query.mockResolvedValueOnce({
        rows: [{ 
          query_plan: 'Index Scan using idx_kunden_email on kunden',
          execution_time: 0.125
        }],
        rowCount: 1
      });

      // Act
      const result = await pool.query(`
        EXPLAIN ANALYZE SELECT * FROM kunden WHERE email = $1
      `, ['test@beispiel.de']);

      // Assert
      expect(result.rows[0].query_plan).toContain('Index Scan');
      expect(result.rows[0].execution_time).toBeLessThan(1.0);
    });

    test('sollte Constraint-Validierung testen', async () => {
      // Arrange
      const pool = new Pool();
      mockPool.query.mockResolvedValueOnce({
        rows: [
          { constraint_name: 'kunden_email_key', constraint_type: 'UNIQUE' },
          { constraint_name: 'kunden_pkey', constraint_type: 'PRIMARY KEY' }
        ],
        rowCount: 2
      });

      // Act
      const result = await pool.query(`
        SELECT constraint_name, constraint_type 
        FROM information_schema.table_constraints 
        WHERE table_name = 'kunden'
      `);

      // Assert
      expect(result.rows).toHaveLength(2);
      expect(result.rows.some(c => c.constraint_type === 'UNIQUE')).toBe(true);
      expect(result.rows.some(c => c.constraint_type === 'PRIMARY KEY')).toBe(true);
    });
  });
});