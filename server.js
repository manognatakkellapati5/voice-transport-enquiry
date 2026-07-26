const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Database connection on boot
db.initDB();

// ---------------------------------------------------------
// 1. Status & Info
// ---------------------------------------------------------
app.get('/api/status', async (req, res) => {
    try {
        const uRes = await db.query('SELECT COUNT(*) as count FROM Users');
        const tRes = await db.query('SELECT COUNT(*) as count FROM Transport');
        const qRes = await db.query('SELECT COUNT(*) as count FROM Queries');
        
        res.json({
            status: 'online',
            dbMode: db.getDbMode(),
            usersCount: uRes[0].count,
            transportCount: tRes[0].count,
            queriesCount: qRes[0].count
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ---------------------------------------------------------
// 2. Transport Routes Search & List
// ---------------------------------------------------------
app.get('/api/transport', async (req, res) => {
    try {
        const { type, route, from, to, maxFare } = req.query;
        let sql = 'SELECT * FROM Transport WHERE 1=1';
        const params = [];

        if (type && type !== 'All') {
            sql += ' AND type = ?';
            params.push(type);
        }

        if (route) {
            sql += ' AND route LIKE ?';
            params.push(`%${route}%`);
        }

        if (from) {
            sql += ' AND route LIKE ?';
            params.push(`${from}%`);
        }

        if (to) {
            sql += ' AND route LIKE ?';
            params.push(`%${to}`);
        }

        if (maxFare) {
            sql += ' AND fare <= ?';
            params.push(parseFloat(maxFare));
        }

        sql += ' ORDER BY type, departure_time ASC';

        const routes = await db.query(sql, params);
        res.json({ success: true, count: routes.length, data: routes });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ---------------------------------------------------------
// 3. Voice Query Processing (NLP & Speech Response Generator)
// ---------------------------------------------------------
app.post('/api/voice-query', async (req, res) => {
    try {
        const { speechText, userId } = req.body;
        if (!speechText) {
            return res.status(400).json({ success: false, error: 'Voice speech text is required' });
        }

        const textLower = speechText.toLowerCase();
        let targetType = null;
        if (textLower.includes('bus')) targetType = 'Bus';
        if (textLower.includes('train')) targetType = 'Train';

        // Extract cities
        const cityList = ['guntur', 'vijayawada', 'hyderabad', 'visakhapatnam', 'chennai', 'bengaluru', 'tirupati', 'nellore', 'kurnool', 'rajahmundry', 'ongole', 'eluru'];
        let foundCities = [];
        cityList.forEach(city => {
            if (textLower.includes(city)) foundCities.push(city);
        });

        let sourceCity = null;
        let destCity = null;

        // Pattern matching: "from X to Y"
        const fromToMatch = textLower.match(/from\s+([a-z]+)\s+to\s+([a-z]+)/);
        if (fromToMatch) {
            sourceCity = fromToMatch[1];
            destCity = fromToMatch[2];
        } else if (foundCities.length >= 2) {
            sourceCity = foundCities[0];
            destCity = foundCities[1];
        } else if (foundCities.length === 1) {
            sourceCity = foundCities[0];
        }

        // Query Database
        let sql = 'SELECT * FROM Transport WHERE 1=1';
        const params = [];

        if (targetType) {
            sql += ' AND type = ?';
            params.push(targetType);
        }

        if (sourceCity && destCity) {
            sql += ' AND route LIKE ? AND route LIKE ?';
            params.push(`%${sourceCity}%`, `%${destCity}%`);
        } else if (sourceCity) {
            sql += ' AND route LIKE ?';
            params.push(`%${sourceCity}%`);
        }

        sql += ' ORDER BY departure_time ASC LIMIT 5';

        const routes = await db.query(sql, params);
        
        let spokenResponse = '';
        let matchedTransport = null;
        let notificationMsg = null;

        if (routes.length === 0) {
            spokenResponse = `Sorry, I couldn't find any ${targetType || 'transport'} options for your query "${speechText}". Please try asking for cities like Guntur, Vijayawada, or Hyderabad.`;
        } else {
            matchedTransport = routes[0];
            const first = routes[0];
            spokenResponse = `Found ${routes.length} options. The best match is ${first.type} for ${first.route}, departing at ${first.departure_time} and arriving at ${first.arrival_time}. Ticket fare is ${first.fare} rupees.`;
            
            // Log query into database
            const targetUserId = userId || 1; // Default to user 1 (Sita) if not selected
            
            // Trigger 4 check: prevent overcapacity
            await db.triggers.validateOvercapacity(first.transport_id);

            // Insert into Queries table
            await db.query('INSERT INTO Queries (user_id, transport_id) VALUES (?, ?)', [targetUserId, first.transport_id]);
            
            // Trigger 5 emulation: update_user_last_query
            await db.triggers.triggerUpdateUserLastQuery(targetUserId);

            // Trigger 3 emulation: notify_popular_route
            notificationMsg = await db.triggers.triggerNotifyPopularRoute(first.transport_id);
        }

        res.json({
            success: true,
            spokenResponse,
            transcript: speechText,
            resultsCount: routes.length,
            routes,
            notification: notificationMsg
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message, spokenResponse: `Error: ${err.message}` });
    }
});

// ---------------------------------------------------------
// 4. Users API
// ---------------------------------------------------------
app.get('/api/users', async (req, res) => {
    try {
        const users = await db.query('SELECT * FROM Users ORDER BY user_id ASC');
        res.json({ success: true, count: users.length, data: users });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const { name, contact } = req.body;
        if (!name || !contact) {
            return res.status(400).json({ success: false, error: 'Name and contact are required.' });
        }

        // Trigger 1 Validation
        db.triggers.validateUserContact(contact);

        const result = await db.query('INSERT INTO Users (name, contact) VALUES (?, ?)', [name, contact]);
        res.json({ success: true, message: 'User added successfully!', userId: result.insertId });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// ---------------------------------------------------------
// 5. Create Transport Route (Trigger test)
// ---------------------------------------------------------
app.post('/api/transport', async (req, res) => {
    try {
        const { type, route, departure_time, arrival_time, capacity, fare } = req.body;
        
        // Trigger 6: Validate transport type
        db.triggers.validateTransportType(type);

        // Trigger 2: Validate transport timing
        db.triggers.validateTransportTiming(departure_time, arrival_time);

        const result = await db.query(
            'INSERT INTO Transport (type, route, departure_time, arrival_time, capacity, fare) VALUES (?, ?, ?, ?, ?, ?)',
            [type, route, departure_time, arrival_time, capacity || 50, fare || 100.00]
        );

        res.json({ success: true, message: 'Transport route created!', transportId: result.insertId });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// ---------------------------------------------------------
// 6. Query Logs
// ---------------------------------------------------------
app.get('/api/queries', async (req, res) => {
    try {
        const sql = `
            SELECT q.query_id, u.name AS user_name, u.contact, t.type, t.route,  
                   t.departure_time, t.arrival_time, t.fare, q.query_time 
            FROM Queries q 
            JOIN Users u ON q.user_id = u.user_id 
            JOIN Transport t ON q.transport_id = t.transport_id 
            ORDER BY q.query_time DESC
        `;
        const queries = await db.query(sql);
        res.json({ success: true, count: queries.length, data: queries });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Procedure log_user_query
app.post('/api/log-query', async (req, res) => {
    try {
        const { user_id, transport_id } = req.body;
        await db.triggers.validateOvercapacity(transport_id);
        await db.query('INSERT INTO Queries (user_id, transport_id) VALUES (?, ?)', [user_id, transport_id]);
        await db.triggers.triggerUpdateUserLastQuery(user_id);
        const notification = await db.triggers.triggerNotifyPopularRoute(transport_id);
        
        res.json({ success: true, message: 'Stored Procedure log_user_query executed successfully!', notification });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// ---------------------------------------------------------
// 7. SQL Views & Analytics Dashboard API
// ---------------------------------------------------------
app.get('/api/analytics/views', async (req, res) => {
    try {
        const dailyUserQueries = await db.query('SELECT * FROM daily_user_queries');
        const transportUsage = await db.query('SELECT * FROM transport_usage LIMIT 10');
        const frequentRoutes = await db.query('SELECT * FROM frequent_routes');

        res.json({
            success: true,
            views: {
                dailyUserQueries,
                transportUsage,
                frequentRoutes
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/analytics/queries', async (req, res) => {
    try {
        // Join Query 1: Find all bus routes from Guntur
        const gunturBuses = await db.query(
            "SELECT transport_id, route, departure_time, arrival_time, fare FROM Transport WHERE type = 'Bus' AND route LIKE 'Guntur%'"
        );

        // Nested Query 1: Find users who enquired about Hyderabad routes
        const hyderabadEnquirers = await db.query(
            "SELECT u.user_id, u.name, u.contact FROM Users u WHERE u.user_id IN (SELECT q.user_id FROM Queries q JOIN Transport t ON q.transport_id = t.transport_id WHERE t.route LIKE '%Hyderabad%')"
        );

        // Nested Query 2: Transport routes with above-average fares
        const aboveAvgFares = await db.query(
            "SELECT transport_id, type, route, fare FROM Transport WHERE fare > (SELECT AVG(fare) FROM Transport) ORDER BY fare DESC"
        );

        // Aggregate Query 1: Count queries per user
        const userQueryCounts = await db.query(
            "SELECT u.user_id, u.name, COUNT(q.query_id) AS query_count FROM Users u LEFT JOIN Queries q ON u.user_id = q.user_id GROUP BY u.user_id, u.name ORDER BY query_count DESC LIMIT 10"
        );

        // Aggregate Query 2: Average fare by transport type
        const fareByType = await db.query(
            "SELECT type, ROUND(AVG(fare), 2) AS avg_fare, MIN(fare) AS min_fare, MAX(fare) AS max_fare FROM Transport GROUP BY type"
        );

        res.json({
            success: true,
            queries: {
                gunturBuses,
                hyderabadEnquirers,
                aboveAvgFares,
                userQueryCounts,
                fareByType
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ---------------------------------------------------------
// 8. Stored Functions Execution API
// ---------------------------------------------------------

// Function: get_next_available_transport(route, time)
app.post('/api/procedures/next-transport', async (req, res) => {
    try {
        const { route, time } = req.body;
        if (!route || !time) {
            return res.status(400).json({ success: false, error: 'Route and time are required' });
        }

        const rows = await db.query(
            'SELECT * FROM Transport WHERE route = ? AND departure_time > ? ORDER BY departure_time LIMIT 1',
            [route, time]
        );

        if (rows.length === 0) {
            return res.json({ success: true, found: false, message: `No transport available on route "${route}" after ${time}` });
        }

        res.json({ success: true, found: true, transport: rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Function: calculate_journey_time(transport_id)
app.post('/api/procedures/journey-time', async (req, res) => {
    try {
        const { transport_id } = req.body;
        const rows = await db.query('SELECT * FROM Transport WHERE transport_id = ?', [transport_id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Transport ID not found' });
        }

        const t = rows[0];
        const [depH, depM] = t.departure_time.split(':').map(Number);
        const [arrH, arrM] = t.arrival_time.split(':').map(Number);
        
        let depMins = depH * 60 + depM;
        let arrMins = arrH * 60 + arrM;
        if (arrMins < depMins) arrMins += 24 * 60; // Next day arrival calculation

        const diffMins = arrMins - depMins;
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        const durationFormatted = `${hours}h ${mins}m`;

        res.json({
            success: true,
            transport: t,
            departure: t.departure_time,
            arrival: t.arrival_time,
            duration: durationFormatted
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Fallback HTML route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

function startServer(port) {
    const server = app.listen(port, () => {
        console.log(`=======================================================`);
        console.log(`🎙️ Voice Transport Enquiry System Server Running!`);
        console.log(`🌐 URL: http://localhost:${port}`);
        console.log(`=======================================================`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.warn(`[PORT WARNING] Port ${port} is currently in use. Retrying on port ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('[SERVER ERROR]', err);
        }
    });
}

startServer(PORT);
