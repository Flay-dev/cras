const assistants = ["Rayane Silva", "Lucimagna Santos", "Jussara Oliveira", "Isleide Ferreira", "Gustavo Lima"];
const neighborhoods = ["Jabaeté", "Vinte e Três de Maio", "Balneário Ponta da Fruta", "Ponta da Fruta", "Ulisses Guimarães", "Praia dos Recifes", "São Conrado"];
let records = [];
let filteredMeetingType = "all";

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    populateSelects();
    setupEventListeners();
    renderAll();
    if (window.lucide) lucide.createIcons();
});

function populateSelects() {
    const selects = ["apt-assistant", "mtg-assistant", "check-assistant", "pub-assistant"];
    selects.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = assistants.map(a => `<option value="${a}">${a}</option>`).join("");
        }
    });
}

function setupEventListeners() {
    document.getElementById("switchToPublic")?.addEventListener("click", () => switchView("public"));
    document.getElementById("switchToDashboard")?.addEventListener("click", () => switchView("dashboard"));

    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });

    document.querySelectorAll(".filter-chip").forEach(chip => {
        chip.addEventListener("click", () => filterMeetings(chip.dataset.filter));
    });

    document.getElementById("appointmentForm")?.addEventListener("submit", handleAppointment);
    document.getElementById("meetingForm")?.addEventListener("submit", handleMeeting);
    document.getElementById("attendanceForm")?.addEventListener("submit", handleAttendance);
    document.getElementById("publicAppointmentForm")?.addEventListener("submit", handlePublicAppointment);
    document.getElementById("checkAvailabilityForm")?.addEventListener("submit", handleCheckAvailability);
}

function switchView(view) {
    document.querySelectorAll('[data-view]').forEach(el => el.classList.remove("active"));
    document.querySelector(`[data-view="${view}"]`).classList.add("active");
    if (window.lucide) lucide.createIcons();
}

function switchTab(tab) {
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelector(`[data-tab="${tab}"]`).classList.add("active");
    document.querySelectorAll(".tab-content").forEach(content => content.classList.add("hidden"));
    document.getElementById(`tab-${tab}`).classList.remove("hidden");
}

function filterMeetings(type) {
    filteredMeetingType = type;
    document.querySelectorAll(".filter-chip").forEach(chip => chip.classList.remove("active"));
    document.querySelector(`[data-filter="${type}"]`).classList.add("active");
    renderMeetings();
}

// Funções auxiliares
function formatPhone(phone) {
    const cleaned = String(phone || "").replace(/\D/g, "");
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    if (cleaned.length === 10) {
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return phone;
}

function normalizePhone(phone) {
    return String(phone || "").replace(/\D/g, "");
}

function formatCPF(cpf) {
    const cleaned = String(cpf || "").replace(/\D/g, "");
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return cpf;
}

function makeId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
    return new Date().toISOString();
}

function parseDateLabel(dateIso) {
    if (!dateIso) return "";
    const d = new Date(`${dateIso}T00:00:00`);
    if (isNaN(d.getTime())) return dateIso;
    return d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function openWhatsApp(phone, message) {
    const cleaned = normalizePhone(phone);
    if (cleaned) {
        window.open(`https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`, "_blank");
    }
}

function setMessage(el, text, type) {
    if (!el) return;
    el.textContent = text;
    el.className = `message-area ${type}`;
    setTimeout(() => {
        if (el) el.className = "message-area";
    }, 5000);
}

function hasConflict(assistant, date, time) {
    return records.some(r => 
        (r.record_type === "appointment" || r.record_type === "meeting") &&
        r.assistant_name === assistant && 
        r.date_iso === date && 
        r.time_label === time
    );
}

// Handlers
async function handleAppointment(e) {
    e.preventDefault();
    
    const data = {
        record_type: "appointment",
        item_id: makeId("apt"),
        assistant_name: document.getElementById("apt-assistant").value,
        citizen_name: document.getElementById("apt-citizen").value.trim(),
        phone: normalizePhone(document.getElementById("apt-phone").value),
        cpf: document.getElementById("apt-cpf").value.trim(),
        neighborhood: document.getElementById("apt-neighborhood").value,
        address: document.getElementById("apt-address").value.trim(),
        date_iso: document.getElementById("apt-date").value,
        time_label: document.getElementById("apt-time").value,
        notes: document.getElementById("apt-notes").value.trim(),
        created_at: nowIso()
    };
    
    if (!data.citizen_name || !data.phone || !data.neighborhood || !data.address) {
        setMessage(document.getElementById("apt-message"), "Preencha todos os campos obrigatórios", "error");
        return;
    }
    
    if (hasConflict(data.assistant_name, data.date_iso, data.time_label)) {
        setMessage(document.getElementById("apt-message"), "Horário já ocupado. Escolha outro horário.", "error");
        return;
    }
    
    records.push(data);
    renderAll();
    e.target.reset();
    setMessage(document.getElementById("apt-message"), "✓ Atendimento agendado com sucesso!", "success");
}

async function handleMeeting(e) {
    e.preventDefault();
    
    const data = {
        record_type: "meeting",
        item_id: makeId("mtg"),
        meeting_type: document.getElementById("mtg-type").value,
        meeting_title: document.getElementById("mtg-title").value.trim(),
        assistant_name: document.getElementById("mtg-assistant").value,
        date_iso: document.getElementById("mtg-date").value,
        time_label: document.getElementById("mtg-time").value,
        location_name: document.getElementById("mtg-location").value.trim(),
        notes: document.getElementById("mtg-notes").value.trim(),
        created_at: nowIso()
    };
    
    if (!data.meeting_type || !data.meeting_title || !data.assistant_name || !data.date_iso || !data.time_label || !data.location_name) {
        setMessage(document.getElementById("mtg-message"), "Preencha todos os campos obrigatórios", "error");
        return;
    }
    
    if (hasConflict(data.assistant_name, data.date_iso, data.time_label)) {
        setMessage(document.getElementById("mtg-message"), "Horário já ocupado pelo assistente", "error");
        return;
    }
    
    records.push(data);
    renderAll();
    e.target.reset();
    setMessage(document.getElementById("mtg-message"), "✓ Reunião criada com sucesso!", "success");
}

async function handleAttendance(e) {
    e.preventDefault();
    
    const meetingId = document.getElementById("att-meeting").value;
    const meeting = getMeetings().find(m => m.item_id === meetingId);
    
    if (!meeting) {
        setMessage(document.getElementById("att-message"), "Selecione uma reunião válida", "error");
        return;
    }
    
    const data = {
        record_type: "attendance",
        item_id: makeId("att"),
        meeting_id: meetingId,
        meeting_title: meeting.meeting_title,
        assistant_name: meeting.assistant_name,
        citizen_name: document.getElementById("att-name").value.trim(),
        phone: normalizePhone(document.getElementById("att-phone").value),
        neighborhood: document.getElementById("att-neighborhood").value,
        rating: document.getElementById("att-rating").value,
        date_iso: meeting.date_iso,
        created_at: nowIso()
    };
    
    if (!data.citizen_name || !data.phone || !data.neighborhood) {
        setMessage(document.getElementById("att-message"), "Preencha todos os campos obrigatórios", "error");
        return;
    }
    
    records.push(data);
    renderAll();
    e.target.reset();
    setMessage(document.getElementById("att-message"), "✓ Presença registrada com sucesso!", "success");
}

async function handlePublicAppointment(e) {
    e.preventDefault();
    
    const data = {
        record_type: "appointment",
        item_id: makeId("apt"),
        assistant_name: document.getElementById("pub-assistant").value,
        citizen_name: document.getElementById("pub-name").value.trim(),
        phone: normalizePhone(document.getElementById("pub-phone").value),
        cpf: document.getElementById("pub-cpf").value.trim(),
        neighborhood: document.getElementById("pub-neighborhood").value,
        address: document.getElementById("pub-address").value.trim(),
        date_iso: document.getElementById("pub-date").value,
        time_label: document.getElementById("pub-time").value,
        notes: document.getElementById("pub-notes").value.trim(),
        created_at: nowIso()
    };
    
    if (!data.citizen_name || !data.phone || !data.neighborhood || !data.address || !data.assistant_name || !data.date_iso || !data.time_label) {
        setMessage(document.getElementById("pub-message"), "Preencha todos os campos obrigatórios", "error");
        return;
    }
    
    if (hasConflict(data.assistant_name, data.date_iso, data.time_label)) {
        setMessage(document.getElementById("pub-message"), "Horário ocupado. Por favor, escolha outro horário.", "error");
        return;
    }
    
    records.push(data);
    renderAll();
    e.target.reset();
    setMessage(document.getElementById("pub-message"), "✓ Agendamento confirmado! Você receberá uma mensagem no WhatsApp.", "success");
    openWhatsApp(data.phone, `Olá ${data.citizen_name}! Seu atendimento no CRAS Jabaeté foi agendado para ${parseDateLabel(data.date_iso)} às ${data.time_label} com ${data.assistant_name}. Local: CRAS Jabaeté, ${data.neighborhood}.`);
}

function handleCheckAvailability(e) {
    e.preventDefault();
    const assistant = document.getElementById("check-assistant").value;
    const date = document.getElementById("check-date").value;
    
    const conflicts = records.filter(r => 
        (r.record_type === "appointment" || r.record_type === "meeting") &&
        r.assistant_name === assistant && 
        r.date_iso === date
    );
    
    const resultDiv = document.getElementById("availability-result");
    
    if (!conflicts.length) {
        resultDiv.innerHTML = `
            <div class="availability-result available">
                <strong>✓ Agenda livre!</strong><br>
                Este assistente tem horários disponíveis nesta data.
            </div>
        `;
    } else {
        const occupiedTimes = conflicts.map(c => c.time_label).sort();
        resultDiv.innerHTML = `
            <div class="availability-result unavailable">
                <strong>⚠️ Horários ocupados:</strong>
                <ul style="margin-top: 0.5rem; list-style: none;">
                    ${occupiedTimes.map(t => `<li>• ${t}</li>`).join("")}
                </ul>
                <p style="margin-top: 0.5rem;">Por favor, escolha outro horário.</p>
            </div>
        `;
    }
}

// Getters
function getAppointments() {
    return records.filter(r => r.record_type === "appointment").sort((a,b) => `${a.date_iso} ${a.time_label}`.localeCompare(`${b.date_iso} ${b.time_label}`));
}

function getMeetings() {
    return records.filter(r => r.record_type === "meeting").sort((a,b) => `${a.date_iso} ${a.time_label}`.localeCompare(`${b.date_iso} ${b.time_label}`));
}

function getAttendance() {
    return records.filter(r => r.record_type === "attendance").sort((a,b) => b.created_at.localeCompare(a.created_at));
}

// Renderização
function renderAll() {
    updateStats();
    refreshMeetingSelect();
    renderAppointments();
    renderMeetings();
    renderAttendance();
    renderPublicMeetings();
    renderReports();
    if (window.lucide) lucide.createIcons();
}

function updateStats() {
    document.getElementById("stat-appointments").textContent = getAppointments().length;
    document.getElementById("stat-meetings").textContent = getMeetings().length;
    document.getElementById("stat-attendance").textContent = getAttendance().length;
    document.getElementById("apt-count").textContent = getAppointments().length;
    document.getElementById("mtg-count").textContent = getMeetings().length;
    document.getElementById("att-count").textContent = getAttendance().length;
    
    // Summary stats
    document.getElementById("total-appointments").textContent = getAppointments().length;
    document.getElementById("total-meetings").textContent = getMeetings().length;
    document.getElementById("total-attendances").textContent = getAttendance().length;
}

function refreshMeetingSelect() {
    const select = document.getElementById("att-meeting");
    if (!select) return;
    const meetings = getMeetings();
    select.innerHTML = '<option value="">Selecione uma reunião</option>' + meetings.map(m => `
        <option value="${m.item_id}">${escapeHtml(m.meeting_title)} • ${m.assistant_name} • ${parseDateLabel(m.date_iso)} ${m.time_label}</option>
    `).join("");
}

function renderAppointments() {
    const container = document.getElementById("appointmentsList");
    const empty = document.getElementById("appointmentsEmpty");
    const items = getAppointments();
    
    if (!container) return;
    
    if (items.length === 0) {
        empty.classList.remove("hidden");
        container.innerHTML = "";
        return;
    }
    
    empty.classList.add("hidden");
    container.innerHTML = items.map(item => `
        <div class="appointment-item">
            <div class="item-header">
                <div>
                    <div class="item-title">${escapeHtml(item.citizen_name)}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">Assistente: ${escapeHtml(item.assistant_name)}</div>
                </div>
                <span class="item-badge badge-cyan">Agendado</span>
            </div>
            <div class="item-details">
                <span><i data-lucide="phone"></i> ${formatPhone(item.phone)}</span>
                <span><i data-lucide="map-pin"></i> ${escapeHtml(item.neighborhood)}</span>
                ${item.cpf ? `<span><i data-lucide="credit-card"></i> ${formatCPF(item.cpf)}</span>` : ''}
            </div>
            <div class="item-details">
                <span><i data-lucide="home"></i> ${escapeHtml(item.address)}</span>
            </div>
            <div class="item-details">
                <span><i data-lucide="calendar"></i> ${parseDateLabel(item.date_iso)}</span>
                <span><i data-lucide="clock"></i> ${item.time_label}</span>
            </div>
            ${item.notes ? `<div class="item-details"><span><i data-lucide="file-text"></i> ${escapeHtml(item.notes)}</span></div>` : ''}
            <div class="item-actions">
                <button class="whatsapp-btn" onclick="openWhatsAppMessage('${item.phone}', 'Olá ${item.citizen_name}! Lembrando do seu atendimento no CRAS Jabaeté agendado para ${parseDateLabel(item.date_iso)} às ${item.time_label}.')">
                    <i data-lucide="message-circle"></i>
                    WhatsApp
                </button>
            </div>
        </div>
    `).join("");
}

function renderMeetings() {
    const container = document.getElementById("meetingsList");
    const empty = document.getElementById("meetingsEmpty");
    let items = getMeetings();
    
    if (filteredMeetingType !== "all") {
        items = items.filter(m => m.meeting_type === filteredMeetingType);
    }
    
    if (!container) return;
    
    if (items.length === 0) {
        empty.classList.remove("hidden");
        container.innerHTML = "";
        return;
    }
    
    empty.classList.add("hidden");
    
    const typeLabels = {
        acolhimento: "🤝 Acolhimento",
        bpc: "💰 BPC",
        coletivo: "👥 Coletiva",
        cadunico: "📋 CadÚnico"
    };
    
    container.innerHTML = items.map(item => `
        <div class="meeting-item">
            <div class="item-header">
                <div>
                    <div class="item-title">${escapeHtml(item.meeting_title)}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">Responsável: ${escapeHtml(item.assistant_name)}</div>
                </div>
                <span class="item-badge badge-pink">${typeLabels[item.meeting_type] || item.meeting_type}</span>
            </div>
            <div class="item-details">
                <span><i data-lucide="calendar"></i> ${parseDateLabel(item.date_iso)}</span>
                <span><i data-lucide="clock"></i> ${item.time_label}</span>
                <span><i data-lucide="map-pin"></i> ${escapeHtml(item.location_name)}</span>
            </div>
            ${item.notes ? `<div class="item-details"><span><i data-lucide="file-text"></i> ${escapeHtml(item.notes)}</span></div>` : ''}
        </div>
    `).join("");
}

function renderAttendance() {
    const container = document.getElementById("attendanceList");
    const empty = document.getElementById("attendanceEmpty");
    const items = getAttendance();
    
    if (!container) return;
    
    if (items.length === 0) {
        empty.classList.remove("hidden");
        container.innerHTML = "";
        return;
    }
    
    empty.classList.add("hidden");
    
    container.innerHTML = items.map(item => `
        <div class="attendance-item">
            <div class="item-header">
                <div>
                    <div class="item-title">${escapeHtml(item.citizen_name)}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(item.meeting_title)}</div>
                </div>
                <span class="item-badge badge-green">✓ Presente</span>
            </div>
            <div class="item-details">
                <span><i data-lucide="phone"></i> ${formatPhone(item.phone)}</span>
                <span><i data-lucide="map-pin"></i> ${escapeHtml(item.neighborhood)}</span>
            </div>
            <div class="item-details">
                <span><i data-lucide="star"></i> ${"⭐".repeat(parseInt(item.rating))}</span>
            </div>
        </div>
    `).join("");
}

function renderPublicMeetings() {
    const container = document.getElementById("publicMeetingsList");
    const empty = document.getElementById("publicMeetingsEmpty");
    const items = getMeetings();
    
    if (!container) return;
    
    if (items.length === 0) {
        empty.classList.remove("hidden");
        container.innerHTML = "";
        return;
    }
    
    empty.classList.add("hidden");
    
    const typeLabels = {
        acolhimento: "🤝 Acolhimento",
        bpc: "💰 BPC",
        coletivo: "👥 Coletiva",
        cadunico: "📋 CadÚnico"
    };
    
    container.innerHTML = items.map(item => `
        <div class="public-meeting-item">
            <div class="item-header">
                <div class="item-title">${escapeHtml(item.meeting_title)}</div>
                <span class="item-badge badge-purple">${typeLabels[item.meeting_type] || item.meeting_type}</span>
            </div>
            <div class="item-details">
                <span><i data-lucide="calendar"></i> ${parseDateLabel(item.date_iso)}</span>
                <span><i data-lucide="clock"></i> ${item.time_label}</span>
                <span><i data-lucide="map-pin"></i> ${escapeHtml(item.location_name)}</span>
            </div>
            <div class="item-details">
                <span><i data-lucide="user-round"></i> Responsável: ${escapeHtml(item.assistant_name)}</span>
            </div>
            ${item.notes ? `<div class="item-details"><span><i data-lucide="file-text"></i> ${escapeHtml(item.notes)}</span></div>` : ''}
        </div>
    `).join("");
}

function renderReports() {
    // Atendimentos por assistente
    const appointments = getAppointments();
    const assistantStats = {};
    assistants.forEach(a => assistantStats[a] = 0);
    appointments.forEach(a => {
        if (assistantStats[a.assistant_name] !== undefined) {
            assistantStats[a.assistant_name]++;
        }
    });
    
    const assistantReports = document.getElementById("assistantReports");
    if (assistantReports) {
        assistantReports.innerHTML = Object.entries(assistantStats).map(([name, count]) => `
            <div class="stat-item">
                <span>${escapeHtml(name)}</span>
                <span class="stat-value">${count} atendimentos</span>
            </div>
        `).join("");
    }
    
    // Atendimentos por bairro
    const neighborhoodStats = {};
    neighborhoods.forEach(n => neighborhoodStats[n] = 0);
    appointments.forEach(a => {
        if (neighborhoodStats[a.neighborhood] !== undefined) {
            neighborhoodStats[a.neighborhood]++;
        }
    });
    
    const neighborhoodReports = document.getElementById("neighborhoodReports");
    if (neighborhoodReports) {
        neighborhoodReports.innerHTML = Object.entries(neighborhoodStats).map(([name, count]) => `
            <div class="stat-item">
                <span>${escapeHtml(name)}</span>
                <span class="stat-value">${count} atendimentos</span>
            </div>
        `).join("");
    }
    
    // Satisfação
    const attendance = getAttendance();
    const ratings = attendance.filter(a => a.rating).map(a => parseInt(a.rating));
    const avgRating = ratings.length > 0 ? (ratings.reduce((a,b) => a + b, 0) / ratings.length).toFixed(1) : "0";
    
    document.getElementById("avg-rating").textContent = avgRating;
    document.getElementById("rating-count").textContent = ratings.length;
    
    const starsDisplay = document.getElementById("stars-display");
    if (starsDisplay) {
        const fullStars = Math.floor(parseFloat(avgRating));
        const hasHalf = parseFloat(avgRating) - fullStars >= 0.5;
        starsDisplay.innerHTML = "";
        for (let i = 0; i < fullStars; i++) {
            starsDisplay.innerHTML += '<i data-lucide="star" class="filled-star"></i>';
        }
        if (hasHalf) {
            starsDisplay.innerHTML += '<i data-lucide="star-half"></i>';
        }
        const remaining = 5 - fullStars - (hasHalf ? 1 : 0);
        for (let i = 0; i < remaining; i++) {
            starsDisplay.innerHTML += '<i data-lucide="star"></i>';
        }
        if (window.lucide) lucide.createIcons();
    }
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, function(m) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m];
    });
}

window.openWhatsAppMessage = function(phone, message) {
    openWhatsApp(phone, message);
};

// Data SDK Simulado
window.dataSdk = {
    init: (handler) => {
        if (handler && handler.onDataChanged) {
            handler.onDataChanged(records);
        }
        return Promise.resolve({ isOk: true });
    },
    create: async (data) => {
        records.push(data);
        return { isOk: true };
    }
};