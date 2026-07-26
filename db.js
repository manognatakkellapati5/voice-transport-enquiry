const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

let mysqlPool = null;
let sqliteDb = null;
let dbMode = 'none'; // 'mysql' or 'sqlite'

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'transport_enquiry_db',
    port: process.env.DB_PORT || 3306
};

// Initial Seed Data (50 Users, 50 Transport, 50 Queries)
const usersData = [
    ['Sita', '9876543210'], ['Rama', '9876543211'], ['Krishna', '9876543212'], ['Arjun', '9876543213'], ['Bheem', '9876543214'],
    ['Nakul', '9876543215'], ['Sahadev', '9876543216'], ['Draupadi', '9876543217'], ['Kunti', '9876543218'], ['Duryodhan', '9876543219'],
    ['Dushasan', '9876543220'], ['Karna', '9876543221'], ['Ashwatthama', '9876543222'], ['Abhimanyu', '9876543223'], ['Parikshit', '9876543224'],
    ['Subhadra', '9876543225'], ['Balram', '9876543226'], ['Uddhav', '9876543227'], ['Vidur', '9876543228'], ['Shakuni', '9876543229'],
    ['Gandhari', '9876543230'], ['Dhritarashtra', '9876543231'], ['Yudhishthir', '9876543232'], ['Bhishma', '9876543233'], ['Dron', '9876543234'],
    ['Shikhandi', '9876543235'], ['Jayadrath', '9876543236'], ['Virat', '9876543237'], ['Ugrasen', '9876543238'], ['Devaki', '9876543239'],
    ['Vasudev', '9876543240'], ['Nanda', '9876543241'], ['Yashoda', '9876543242'], ['Radha', '9876543243'], ['Rukmini', '9876543244'],
    ['Satyabhama', '9876543245'], ['Jambavati', '9876543246'], ['Kalindi', '9876543247'], ['Mitravinda', '9876543248'], ['Nagnajiti', '9876543249'],
    ['Bhadra', '9876543250'], ['Lakshman', '9876543251'], ['Bharat', '9876543252'], ['Shatrughna', '9876543253'], ['Hanuman', '9876543254'],
    ['Sugriva', '9876543255'], ['Angad', '9876543256'], ['Jambavan', '9876543257'], ['Vibhishan', '9876543258'], ['Guha', '9876543259']
];

const transportData = [
    ['Bus', 'Guntur to Vijayawada', '08:00:00', '10:30:00', 50, 120.00],
    ['Bus', 'Vijayawada to Guntur', '11:00:00', '13:30:00', 50, 120.00],
    ['Bus', 'Hyderabad to Vijayawada', '06:00:00', '12:00:00', 50, 350.00],
    ['Bus', 'Vijayawada to Hyderabad', '13:00:00', '19:00:00', 50, 350.00],
    ['Bus', 'Guntur to Hyderabad', '07:00:00', '13:30:00', 50, 400.00],
    ['Bus', 'Hyderabad to Guntur', '14:00:00', '20:30:00', 50, 400.00],
    ['Train', 'Guntur to Vijayawada', '09:00:00', '10:00:00', 500, 80.00],
    ['Train', 'Vijayawada to Guntur', '11:00:00', '12:00:00', 500, 80.00],
    ['Train', 'Hyderabad to Vijayawada', '08:00:00', '12:30:00', 500, 250.00],
    ['Train', 'Vijayawada to Hyderabad', '13:30:00', '18:00:00', 500, 250.00],
    ['Train', 'Guntur to Hyderabad', '10:00:00', '15:30:00', 500, 300.00],
    ['Train', 'Hyderabad to Guntur', '16:00:00', '21:30:00', 500, 300.00],
    ['Bus', 'Vijayawada to Visakhapatnam', '05:00:00', '14:00:00', 50, 600.00],
    ['Bus', 'Visakhapatnam to Vijayawada', '15:00:00', '23:59:00', 50, 600.00],
    ['Train', 'Vijayawada to Visakhapatnam', '06:00:00', '12:00:00', 500, 400.00],
    ['Train', 'Visakhapatnam to Vijayawada', '13:00:00', '19:00:00', 500, 400.00],
    ['Bus', 'Guntur to Chennai', '20:00:00', '23:59:00', 50, 900.00],
    ['Bus', 'Chennai to Guntur', '21:00:00', '23:59:00', 50, 900.00],
    ['Train', 'Guntur to Chennai', '19:00:00', '23:59:00', 500, 600.00],
    ['Train', 'Chennai to Guntur', '20:00:00', '23:59:00', 500, 600.00],
    ['Bus', 'Vijayawada to Bengaluru', '18:00:00', '23:59:00', 50, 1000.00],
    ['Bus', 'Bengaluru to Vijayawada', '19:00:00', '23:59:00', 50, 1000.00],
    ['Train', 'Vijayawada to Bengaluru', '17:00:00', '23:59:00', 500, 700.00],
    ['Train', 'Bengaluru to Vijayawada', '18:00:00', '23:59:00', 500, 700.00],
    ['Bus', 'Guntur to Tirupati', '06:00:00', '14:00:00', 50, 500.00],
    ['Bus', 'Tirupati to Guntur', '15:00:00', '23:00:00', 50, 500.00],
    ['Train', 'Guntur to Tirupati', '07:00:00', '13:00:00', 500, 350.00],
    ['Train', 'Tirupati to Guntur', '14:00:00', '20:00:00', 500, 350.00],
    ['Bus', 'Vijayawada to Nellore', '08:00:00', '14:00:00', 50, 400.00],
    ['Bus', 'Nellore to Vijayawada', '15:00:00', '21:00:00', 50, 400.00],
    ['Train', 'Vijayawada to Nellore', '09:00:00', '13:00:00', 500, 250.00],
    ['Train', 'Nellore to Vijayawada', '14:00:00', '18:00:00', 500, 250.00],
    ['Bus', 'Guntur to Kurnool', '07:00:00', '14:00:00', 50, 450.00],
    ['Bus', 'Kurnool to Guntur', '15:00:00', '22:00:00', 50, 450.00],
    ['Train', 'Guntur to Kurnool', '08:00:00', '13:00:00', 500, 300.00],
    ['Train', 'Kurnool to Guntur', '14:00:00', '19:00:00', 500, 300.00],
    ['Bus', 'Vijayawada to Rajahmundry', '06:00:00', '11:00:00', 50, 300.00],
    ['Bus', 'Rajahmundry to Vijayawada', '12:00:00', '17:00:00', 50, 300.00],
    ['Train', 'Vijayawada to Rajahmundry', '07:00:00', '10:00:00', 500, 200.00],
    ['Train', 'Rajahmundry to Vijayawada', '11:00:00', '14:00:00', 500, 200.00],
    ['Bus', 'Guntur to Ongole', '08:00:00', '11:00:00', 50, 200.00],
    ['Bus', 'Ongole to Guntur', '12:00:00', '15:00:00', 50, 200.00],
    ['Train', 'Guntur to Ongole', '09:00:00', '11:00:00', 500, 150.00],
    ['Train', 'Ongole to Guntur', '12:00:00', '14:00:00', 500, 150.00],
    ['Bus', 'Vijayawada to Eluru', '07:00:00', '09:00:00', 50, 100.00],
    ['Bus', 'Eluru to Vijayawada', '10:00:00', '12:00:00', 50, 100.00],
    ['Train', 'Vijayawada to Eluru', '08:00:00', '09:00:00', 500, 80.00],
    ['Train', 'Eluru to Vijayawada', '10:00:00', '11:00:00', 500, 80.00],
    ['Bus', 'Guntur to Visakhapatnam', '06:00:00', '15:00:00', 50, 650.00],
    ['Train', 'Bengaluru to Guntur', '16:00:00', '23:30:00', 500, 680.00]
];

const queriesData = [
    [1, 1, '2025-04-07 07:45:00'], [2, 3, '2025-04-07 05:30:00'], [3, 5, '2025-04-07 06:15:00'], [4, 7, '2025-04-07 08:30:00'], [5, 9, '2025-04-07 07:00:00'],
    [6, 11, '2025-04-07 09:15:00'], [7, 13, '2025-04-07 04:30:00'], [8, 15, '2025-04-07 05:45:00'], [9, 17, '2025-04-07 19:30:00'], [10, 19, '2025-04-07 18:15:00'],
    [11, 21, '2025-04-07 17:30:00'], [12, 23, '2025-04-07 16:45:00'], [13, 25, '2025-04-07 05:30:00'], [14, 27, '2025-04-07 06:45:00'], [15, 29, '2025-04-07 07:30:00'],
    [16, 31, '2025-04-07 08:15:00'], [17, 33, '2025-04-07 06:30:00'], [18, 35, '2025-04-07 07:45:00'], [19, 37, '2025-04-07 05:30:00'], [20, 39, '2025-04-07 06:15:00'],
    [21, 41, '2025-04-07 07:30:00'], [22, 43, '2025-04-07 06:45:00'], [23, 45, '2025-04-07 07:00:00'], [24, 47, '2025-04-07 06:30:00'], [25, 49, '2025-04-07 07:15:00'],
    [1, 2, '2025-04-07 10:30:00'], [2, 4, '2025-04-07 12:15:00'], [3, 6, '2025-04-07 13:30:00'], [4, 8, '2025-04-07 10:45:00'], [5, 10, '2025-04-07 12:00:00'],
    [6, 12, '2025-04-07 15:15:00'], [7, 14, '2025-04-07 14:30:00'], [8, 16, '2025-04-07 12:45:00'], [9, 18, '2025-04-07 20:30:00'], [10, 20, '2025-04-07 19:45:00'],
    [11, 22, '2025-04-07 18:00:00'], [12, 24, '2025-04-07 17:15:00'], [13, 26, '2025-04-07 13:30:00'], [14, 28, '2025-04-07 12:45:00'], [15, 30, '2025-04-07 14:00:00'],
    [16, 32, '2025-04-07 13:15:00'], [17, 34, '2025-04-07 14:30:00'], [18, 36, '2025-04-07 13:45:00'], [19, 38, '2025-04-07 11:30:00'], [20, 40, '2025-04-07 12:15:00'],
    [21, 42, '2025-04-07 13:30:00'], [22, 44, '2025-04-07 12:45:00'], [23, 46, '2025-04-07 14:00:00'], [24, 48, '2025-04-07 13:15:00'], [25, 50, '2025-04-07 14:30:00']
];

async function initDB() {
    try {
        console.log(`[DB] Attempting MySQL connection to ${dbConfig.host}:${dbConfig.port}...`);
        const connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password,
            port: dbConfig.port
        });
        
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
        await connection.end();

        mysqlPool = mysql.createPool({
            ...dbConfig,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        // Test connection
        const [rows] = await mysqlPool.query('SELECT 1 + 1 AS result');
        console.log('[DB] MySQL Connected successfully!');
        dbMode = 'mysql';

        // Check if data is populated
        const [usersCount] = await mysqlPool.query('SELECT COUNT(*) as count FROM Users').catch(() => [{ count: 0 }]);
        if (usersCount[0].count === 0) {
            console.log('[DB] MySQL database empty. Running seed setup script...');
            await seedMySQL();
        }

        return;
    } catch (err) {
        console.warn('[DB] MySQL connection failed or not available:', err.message);
        console.log('[DB] Falling back to embedded SQLite database for out-of-the-box instant execution.');
        initSQLite();
    }
}

async function seedMySQL() {
    try {
        const sqlFilePath = path.join(__dirname, 'db_setup.sql');
        if (fs.existsSync(sqlFilePath)) {
            const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
            // Split multi-statement SQL
            const statements = sqlContent
                .split(/;\s*$/m)
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));

            for (const statement of statements) {
                try {
                    await mysqlPool.query(statement);
                } catch (e) {
                    // Ignore trigger/procedure re-creation warnings
                }
            }
            console.log('[DB] MySQL seeding completed.');
        }
    } catch (err) {
        console.error('[DB] MySQL seed error:', err);
    }
}

function initSQLite() {
    const dbPath = path.join(__dirname, 'transport_enquiry.db');
    sqliteDb = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('[DB] SQLite connection error:', err.message);
            return;
        }
        console.log('[DB] Connected to SQLite database at:', dbPath);
        dbMode = 'sqlite';
        setupSQLiteSchema();
    });
}

function setupSQLiteSchema() {
    sqliteDb.serialize(() => {
        // Create Tables
        sqliteDb.run(`CREATE TABLE IF NOT EXISTS Users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            contact TEXT NOT NULL,
            last_query_time TEXT
        );`);

        sqliteDb.run(`CREATE TABLE IF NOT EXISTS Transport (
            transport_id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            route TEXT NOT NULL,
            departure_time TEXT NOT NULL,
            arrival_time TEXT NOT NULL,
            capacity INTEGER,
            fare REAL
        );`);

        sqliteDb.run(`CREATE TABLE IF NOT EXISTS Queries (
            query_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            transport_id INTEGER NOT NULL,
            query_time TEXT DEFAULT (datetime('now', 'localtime')),
            FOREIGN KEY (user_id) REFERENCES Users(user_id),
            FOREIGN KEY (transport_id) REFERENCES Transport(transport_id)
        );`);

        // Check if Users need seed data
        sqliteDb.get(`SELECT COUNT(*) as count FROM Users`, (err, row) => {
            if (row && row.count === 0) {
                console.log('[DB] Seeding SQLite database with 50 users, 50 transport routes, and 50 query logs...');
                
                const userStmt = sqliteDb.prepare(`INSERT INTO Users (name, contact) VALUES (?, ?)`);
                usersData.forEach(u => userStmt.run(u[0], u[1]));
                userStmt.finalize();

                const transportStmt = sqliteDb.prepare(`INSERT INTO Transport (type, route, departure_time, arrival_time, capacity, fare) VALUES (?, ?, ?, ?, ?, ?)`);
                transportData.forEach(t => transportStmt.run(t[0], t[1], t[2], t[3], t[4], t[5]));
                transportStmt.finalize();

                const queryStmt = sqliteDb.prepare(`INSERT INTO Queries (user_id, transport_id, query_time) VALUES (?, ?, ?)`);
                queriesData.forEach(q => queryStmt.run(q[0], q[1], q[2]));
                queryStmt.finalize();
            }
        });

        // Views in SQLite
        sqliteDb.run(`CREATE VIEW IF NOT EXISTS daily_user_queries AS 
            SELECT DATE(query_time) AS query_date, COUNT(*) AS total_queries 
            FROM Queries 
            GROUP BY DATE(query_time);`);

        sqliteDb.run(`CREATE VIEW IF NOT EXISTS transport_usage AS 
            SELECT t.type, t.route, COUNT(q.query_id) AS query_count 
            FROM Transport t 
            LEFT JOIN Queries q ON t.transport_id = q.transport_id 
            GROUP BY t.type, t.route 
            ORDER BY query_count DESC;`);

        sqliteDb.run(`CREATE VIEW IF NOT EXISTS frequent_routes AS 
            SELECT t.route, COUNT(q.query_id) AS query_count 
            FROM Transport t 
            JOIN Queries q ON t.transport_id = q.transport_id 
            GROUP BY t.route 
            ORDER BY query_count DESC 
            LIMIT 10;`);
    });
}

// Unified Query Execution Interface
async function query(sql, params = []) {
    if (dbMode === 'mysql') {
        const [rows] = await mysqlPool.query(sql, params);
        return rows;
    } else if (dbMode === 'sqlite') {
        return new Promise((resolve, reject) => {
            const trimmed = sql.trim().toUpperCase();
            if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH') || trimmed.startsWith('PRAGMA')) {
                sqliteDb.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            } else {
                sqliteDb.run(sql, params, function (err) {
                    if (err) reject(err);
                    else resolve({ insertId: this.lastID, affectedRows: this.changes });
                });
            }
        });
    } else {
        throw new Error('Database connection not initialized.');
    }
}

// Trigger Emulation Helpers (validating rules in Node layer before/after DB ops)
function validateUserContact(contact) {
    const reg = /^[0-9]{10}$/;
    if (!reg.test(contact)) {
        throw new Error('Trigger Error (validate_user_contact): Contact number must be exactly 10 digits');
    }
}

function validateTransportTiming(depTime, arrTime) {
    if (depTime >= arrTime) {
        throw new Error('Trigger Error (validate_transport_timing): Arrival time must be after departure time');
    }
}

function validateTransportType(type) {
    if (!['Bus', 'Train'].includes(type)) {
        throw new Error('Trigger Error (validate_transport_type): Transport type must be either Bus or Train');
    }
}

async function validateOvercapacity(transportId) {
    const rows = await query('SELECT capacity FROM Transport WHERE transport_id = ?', [transportId]);
    if (rows.length === 0) throw new Error('Transport not found');
    if (rows[0].capacity <= 0) {
        throw new Error('Trigger Error (prevent_overcapacity): This transport is already at full capacity');
    }
}

async function triggerUpdateUserLastQuery(userId) {
    const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await query('UPDATE Users SET last_query_time = ? WHERE user_id = ?', [nowStr, userId]);
}

async function triggerNotifyPopularRoute(transportId) {
    const qRows = await query('SELECT COUNT(*) as count FROM Queries WHERE transport_id = ?', [transportId]);
    const count = qRows[0].count;
    if (count > 5) {
        const tRows = await query('SELECT type, route FROM Transport WHERE transport_id = ?', [transportId]);
        if (tRows.length > 0) {
            return `Popular route notification: ${tRows[0].type} ${tRows[0].route} has ${count} enquiries`;
        }
    }
    return null;
}

module.exports = {
    initDB,
    query,
    getDbMode: () => dbMode,
    triggers: {
        validateUserContact,
        validateTransportTiming,
        validateTransportType,
        validateOvercapacity,
        triggerUpdateUserLastQuery,
        triggerNotifyPopularRoute
    }
};
