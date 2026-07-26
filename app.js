// JavaScript Application Controller - Voice-Based Transport Enquiry System

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

let isListening = false;
let recognition = null;
let currentSpokenText = '';
let isAccessibilityMode = false;

function initApp() {
    setupTabNavigation();
    setupAccessibilityToggle();
    setupWebSpeechAPI();
    checkDBStatus();
    loadTransportSchedules();
    loadAnalyticsViews();
    loadAnalyticsQueries();
    loadUsers();
    loadQueryLogs();
    setupSandboxListeners();
}

// ---------------------------------------------------------
// 1. Navigation & Accessibility Setup
// ---------------------------------------------------------
function setupTabNavigation() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetTab = btn.getAttribute('data-tab');
            document.getElementById(targetTab).classList.add('active');

            if (isAccessibilityMode) {
                speakAudio(`Switched to ${btn.innerText} tab`);
            }
        });
    });
}

function setupAccessibilityToggle() {
    const toggleBtn = document.getElementById('accessibilityToggle');
    toggleBtn.addEventListener('click', () => {
        isAccessibilityMode = !isAccessibilityMode;
        if (isAccessibilityMode) {
            document.body.classList.add('accessible-mode');
            toggleBtn.innerHTML = '👁️ Standard Mode';
            speakAudio('Accessibility high contrast mode activated.');
        } else {
            document.body.classList.remove('accessible-mode');
            toggleBtn.innerHTML = '👁️ Accessibility Mode';
            speakAudio('Standard mode activated.');
        }
    });
}

// ---------------------------------------------------------
// 2. Database Status Checker
// ---------------------------------------------------------
async function checkDBStatus() {
    const badge = document.getElementById('dbStatusBadge');
    const text = document.getElementById('dbStatusText');
    try {
        const res = await fetch('/api/status');
        const data = await res.json();
        if (data.status === 'online') {
            badge.className = 'status-badge online';
            text.innerText = `DB: ${data.dbMode.toUpperCase()} (${data.transportCount} Routes, ${data.usersCount} Users)`;
        }
    } catch (err) {
        badge.className = 'status-badge connecting';
        text.innerText = 'DB Offline / Disconnected';
    }
}

// ---------------------------------------------------------
// 3. Web Speech Recognition & Speech Synthesis (TTS)
// ---------------------------------------------------------
function setupWebSpeechAPI() {
    const micBtn = document.getElementById('micBtn');
    const micStatus = document.getElementById('micStatusText');
    const transcriptEl = document.getElementById('speechTranscript');
    const stateBadge = document.getElementById('speechStateBadge');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        micStatus.innerText = 'Speech recognition not supported in this browser. Use quick prompts below.';
        micBtn.disabled = true;
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        isListening = true;
        micBtn.classList.add('listening');
        micStatus.innerText = 'Listening... Speak your transport enquiry now';
        stateBadge.innerText = 'Listening...';
        stateBadge.style.background = '#ef4444';
        transcriptEl.innerText = '...';
        if (isAccessibilityMode) speakAudio('Listening for your voice command');
    };

    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        transcriptEl.innerText = `"${transcript}"`;
        currentSpokenText = transcript;
    };

    recognition.onerror = (event) => {
        isListening = false;
        micBtn.classList.remove('listening');
        micStatus.innerText = `Speech error: ${event.error}. Click mic to try again.`;
        stateBadge.innerText = 'Error';
        stateBadge.style.background = '#ef4444';
    };

    recognition.onend = () => {
        isListening = false;
        micBtn.classList.remove('listening');
        micStatus.innerText = 'Click microphone to start speaking';
        stateBadge.innerText = 'Processing';
        stateBadge.style.background = '#38bdf8';

        if (currentSpokenText.trim().length > 0) {
            processVoiceQuery(currentSpokenText);
        }
    };

    micBtn.addEventListener('click', () => {
        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
        }
    });

    document.getElementById('replayTtsBtn').addEventListener('click', () => {
        const text = document.getElementById('ttsText').innerText;
        if (text) speakAudio(text);
    });
}

function executeQuickPrompt(text) {
    document.getElementById('speechTranscript').innerText = `"${text}"`;
    if (isAccessibilityMode) speakAudio(`Executing prompt: ${text}`);
    processVoiceQuery(text);
}

async function processVoiceQuery(speechText) {
    const userId = document.getElementById('activeUserSelect').value;
    try {
        const res = await fetch('/api/voice-query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ speechText, userId })
        });
        const data = await res.json();

        // Render TTS Box
        const ttsBox = document.getElementById('ttsBox');
        const ttsText = document.getElementById('ttsText');
        ttsBox.classList.remove('hidden');
        ttsText.innerText = data.spokenResponse;

        // Speak aloud response using Web Speech Synthesis
        speakAudio(data.spokenResponse);

        // Display results
        renderVoiceResults(data.routes || []);

        // Show Trigger notification banner if popular route triggered
        if (data.notification) {
            showNotification(data.notification);
        }

        // Refresh Query Logs & Users
        loadQueryLogs();
        loadUsers();
    } catch (err) {
        speakAudio('Sorry, there was an error processing your query.');
    }
}

function speakAudio(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Stop prior audio
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = isAccessibilityMode ? 0.9 : 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }
}

function renderVoiceResults(routes) {
    const section = document.getElementById('voiceResultsSection');
    const grid = document.getElementById('voiceResultsGrid');
    const countEl = document.getElementById('voiceResultsCount');

    section.classList.remove('hidden');
    countEl.innerText = routes.length;
    grid.innerHTML = '';

    if (routes.length === 0) {
        grid.innerHTML = `<div class="no-results">No matching routes found in database.</div>`;
        return;
    }

    routes.forEach(r => {
        const card = document.createElement('div');
        card.className = `route-card type-${r.type.toLowerCase()}`;
        card.innerHTML = `
            <div class="route-header">
                <span class="route-type">${r.type} #${r.transport_id}</span>
                <span class="route-capacity">Capacity: ${r.capacity} seats</span>
            </div>
            <div class="route-title">${r.route}</div>
            <div class="route-details">
                <div><strong>Departure:</strong> ${r.departure_time}</div>
                <div><strong>Arrival:</strong> ${r.arrival_time}</div>
            </div>
            <div class="route-fare">₹${parseFloat(r.fare).toFixed(2)}</div>
        `;
        grid.appendChild(card);
    });
}

function showNotification(msg) {
    const banner = document.getElementById('notificationBanner');
    const msgEl = document.getElementById('notificationMessage');
    msgEl.innerText = msg;
    banner.classList.remove('hidden');
    if (isAccessibilityMode) speakAudio(msg);
}

function closeBanner() {
    document.getElementById('notificationBanner').classList.add('hidden');
}

// ---------------------------------------------------------
// 4. Transport Schedules Explorer
// ---------------------------------------------------------
async function loadTransportSchedules() {
    const tbody = document.getElementById('transportTableBody');
    const type = document.getElementById('filterType').value;
    const from = document.getElementById('filterFrom').value;
    const to = document.getElementById('filterTo').value;
    const maxFare = document.getElementById('filterFare').value;

    let url = `/api/transport?type=${encodeURIComponent(type)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&maxFare=${encodeURIComponent(maxFare)}`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        tbody.innerHTML = '';

        if (data.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center">No transport routes matched your criteria.</td></tr>`;
            return;
        }

        data.data.forEach(t => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>#${t.transport_id}</strong></td>
                <td><span class="route-type">${t.type}</span></td>
                <td><strong>${t.route}</strong></td>
                <td>${t.departure_time}</td>
                <td>${t.arrival_time}</td>
                <td>${t.capacity}</td>
                <td>₹${parseFloat(t.fare).toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="quickBookQuery(${t.transport_id})">Enquire</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-danger">Failed to fetch transport data.</td></tr>`;
    }
}

document.getElementById('btnSearchSchedules').addEventListener('click', loadTransportSchedules);
document.getElementById('btnResetFilters').addEventListener('click', () => {
    document.getElementById('filterType').value = 'All';
    document.getElementById('filterFrom').value = '';
    document.getElementById('filterTo').value = '';
    document.getElementById('filterFare').value = '';
    loadTransportSchedules();
});

async function quickBookQuery(transportId) {
    const userId = document.getElementById('activeUserSelect').value;
    try {
        const res = await fetch('/api/log-query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, transport_id: transportId })
        });
        const data = await res.json();
        if (data.success) {
            alert('Query logged successfully!');
            loadQueryLogs();
            loadUsers();
            if (data.notification) showNotification(data.notification);
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (err) {
        alert(`Error: ${err.message}`);
    }
}

// ---------------------------------------------------------
// 5. Analytics & Views Loader
// ---------------------------------------------------------
async function loadAnalyticsViews() {
    try {
        const res = await fetch('/api/analytics/views');
        const data = await res.json();
        
        if (data.success) {
            // View 1: daily_user_queries
            const v1 = document.getElementById('viewDailyQueriesBody');
            v1.innerHTML = data.views.dailyUserQueries.map(r => `<tr><td>${r.query_date}</td><td><strong>${r.total_queries}</strong></td></tr>`).join('');

            // View 2: transport_usage
            const v2 = document.getElementById('viewUsageBody');
            v2.innerHTML = data.views.transportUsage.map(r => `<tr><td>${r.type}</td><td>${r.route}</td><td><strong>${r.query_count}</strong></td></tr>`).join('');

            // View 3: frequent_routes
            const v3 = document.getElementById('viewFrequentBody');
            v3.innerHTML = data.views.frequentRoutes.map(r => `<tr><td>${r.route}</td><td><strong>${r.query_count}</strong></td></tr>`).join('');
        }
    } catch (err) {
        console.error('Failed to load views:', err);
    }
}

async function loadAnalyticsQueries() {
    try {
        const res = await fetch('/api/analytics/queries');
        const data = await res.json();
        
        if (data.success) {
            const q = data.queries;
            
            document.getElementById('gunturBusesResults').innerHTML = 
                `<ul>` + q.gunturBuses.map(b => `<li><strong>${b.route}</strong> - Dep: ${b.departure_time}, Fare: ₹${b.fare}</li>`).join('') + `</ul>`;

            document.getElementById('hyderabadEnquirersResults').innerHTML = 
                `<ul>` + q.hyderabadEnquirers.map(u => `<li><strong>${u.name}</strong> (Contact: ${u.contact})</li>`).join('') + `</ul>`;

            document.getElementById('aboveAvgFaresResults').innerHTML = 
                `<ul>` + q.aboveAvgFares.slice(0, 5).map(f => `<li>[${f.type}] ${f.route} - <strong>₹${f.fare}</strong></li>`).join('') + `</ul>`;

            document.getElementById('fareByTypeResults').innerHTML = 
                `<ul>` + q.fareByType.map(t => `<li><strong>${t.type}:</strong> Avg Fare: ₹${t.avg_fare} (Min: ₹${t.min_fare}, Max: ₹${t.max_fare})</li>`).join('') + `</ul>`;
        }
    } catch (err) {
        console.error('Failed to load queries analytics:', err);
    }
}

// ---------------------------------------------------------
// 6. Triggers & Stored Procedures Sandbox
// ---------------------------------------------------------
function setupSandboxListeners() {
    // Function 1: get_next_available_transport
    document.getElementById('btnTestNextTransport').addEventListener('click', async () => {
        const route = document.getElementById('spNextRoute').value;
        const time = document.getElementById('spNextTime').value;
        const out = document.getElementById('spNextOutput');
        out.classList.remove('hidden', 'error');

        try {
            const res = await fetch('/api/procedures/next-transport', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ route, time })
            });
            const data = await res.json();
            out.innerText = JSON.stringify(data, null, 2);
        } catch (err) {
            out.classList.add('error');
            out.innerText = err.message;
        }
    });

    // Function 2: calculate_journey_time
    document.getElementById('btnTestJourneyTime').addEventListener('click', async () => {
        const transport_id = document.getElementById('spJourneyId').value;
        const out = document.getElementById('spJourneyOutput');
        out.classList.remove('hidden', 'error');

        try {
            const res = await fetch('/api/procedures/journey-time', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transport_id })
            });
            const data = await res.json();
            out.innerText = JSON.stringify(data, null, 2);
        } catch (err) {
            out.classList.add('error');
            out.innerText = err.message;
        }
    });

    // Trigger 1: validate_user_contact
    document.getElementById('btnTestTriggerContact').addEventListener('click', async () => {
        const name = document.getElementById('trigUserName').value;
        const contact = document.getElementById('trigUserContact').value;
        const out = document.getElementById('trigContactOutput');
        out.classList.remove('hidden', 'error');

        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, contact })
            });
            const data = await res.json();
            if (!data.success) {
                out.classList.add('error');
                out.innerText = `SQL SIGNAL SQLSTATE '45000' TRIGGER EXCEPTION:\n${data.error}`;
            } else {
                out.innerText = `SUCCESS: ${data.message} (User ID: ${data.userId})`;
                loadUsers();
            }
        } catch (err) {
            out.classList.add('error');
            out.innerText = err.message;
        }
    });

    // Trigger 2: validate_transport_timing
    document.getElementById('btnTestTriggerTiming').addEventListener('click', async () => {
        const departure_time = document.getElementById('trigDepTime').value;
        const arrival_time = document.getElementById('trigArrTime').value;
        const out = document.getElementById('trigTimingOutput');
        out.classList.remove('hidden', 'error');

        try {
            const res = await fetch('/api/transport', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'Bus',
                    route: 'Test Route',
                    departure_time,
                    arrival_time,
                    capacity: 50,
                    fare: 200
                })
            });
            const data = await res.json();
            if (!data.success) {
                out.classList.add('error');
                out.innerText = `SQL SIGNAL SQLSTATE '45000' TRIGGER EXCEPTION:\n${data.error}`;
            } else {
                out.innerText = `SUCCESS: ${data.message} (Transport ID: ${data.transportId})`;
                loadTransportSchedules();
            }
        } catch (err) {
            out.classList.add('error');
            out.innerText = err.message;
        }
    });
}

// ---------------------------------------------------------
// 7. Users & Query Logs Loader
// ---------------------------------------------------------
async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    const search = document.getElementById('searchUsersInput').value.toLowerCase();
    
    try {
        const res = await fetch('/api/users');
        const data = await res.json();
        tbody.innerHTML = '';

        const filtered = data.data.filter(u => u.name.toLowerCase().includes(search));
        
        filtered.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${u.user_id}</td>
                <td><strong>${u.name}</strong></td>
                <td>${u.contact}</td>
                <td>${u.last_query_time || 'No queries yet'}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4">Failed to load users.</td></tr>`;
    }
}

document.getElementById('searchUsersInput').addEventListener('input', loadUsers);

async function loadQueryLogs() {
    const tbody = document.getElementById('queriesTableBody');
    try {
        const res = await fetch('/api/queries');
        const data = await res.json();
        tbody.innerHTML = '';

        data.data.slice(0, 50).forEach(q => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${q.query_id}</td>
                <td><strong>${q.user_name}</strong></td>
                <td><span class="route-type">${q.type}</span> ${q.route}</td>
                <td>${q.query_time}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4">Failed to load queries log.</td></tr>`;
    }
}

document.getElementById('btnRefreshQueries').addEventListener('click', loadQueryLogs);
