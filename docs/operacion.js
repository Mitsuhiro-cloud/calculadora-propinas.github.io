const DEFAULT_PARTNERS = [
    { name: 'IVETH', horasPorDia: 8 },
    { name: 'EDMUNDO', horasPorDia: 6 },
    { name: 'MARGOT', horasPorDia: 8 },
    { name: 'RODRIGO', horasPorDia: 4 },
    { name: 'LUIS', horasPorDia: 8 },
    { name: 'FERNANDO', horasPorDia: 6 },
    { name: 'JAVIER', horasPorDia: 8 },
    { name: 'RICARDO', horasPorDia: 4 },
    { name: 'NAYELI', horasPorDia: 8 },
    { name: 'ENRIQUE', horasPorDia: 6 },
    { name: 'OBETH', horasPorDia: 6 },
    { name: 'FRANCISCO', horasPorDia: 6 },
];

const DIAS_POR_SEMANA = 6;
const partnersContainer = document.getElementById('partnersContainer');
const addPartnerBtn = document.getElementById('addPartnerBtn');
const calcularBtn = document.getElementById('calcularBtn');
const resultado = document.getElementById('resultado');

let idCounter = 0;

function crearRowPartner(data, fijo) {
    const id = idCounter++;
    const row = document.createElement('div');
    row.className = 'partner-row';
    row.dataset.id = id;

    row.innerHTML = `
        <div class="form-field">
            <label>Nombre</label>
            <input type="text" class="p-name" value="${data.name}" ${fijo ? '' : 'placeholder="Nombre del partner"'}>
        </div>
        <div class="form-field">
            <label>Horas/día</label>
            <select class="p-horas">
                ${[4, 6, 8].map(h =>
                    `<option value="${h}" ${data.horasPorDia === h ? 'selected' : ''}>${h}h</option>`
                ).join('')}
            </select>
        </div>
        <div class="form-field">
            <label>Dto. horas</label>
            <input type="number" class="p-descuento" min="0" step="1" value="0" placeholder="0">
        </div>
        <button type="button" class="btn-remove" ${fijo ? 'style="display:none"' : ''}>Eliminar</button>
    `;

    row.querySelector('.btn-remove')?.addEventListener('click', () => row.remove());
    partnersContainer.appendChild(row);
}

function initPartners() {
    partnersContainer.innerHTML = '';
    DEFAULT_PARTNERS.forEach(p => crearRowPartner(p, true));
}

addPartnerBtn.addEventListener('click', () => {
    crearRowPartner({ name: '', horasPorDia: 6 }, false);
});

calcularBtn.addEventListener('click', calcular);

function calcular() {
    const total = Number(document.getElementById('propinasTotales').value);

    if (!Number.isFinite(total) || total <= 0) {
        mostrarResultado('<p style="color:#b91c1c;text-align:center;">Ingresa un monto total de propinas válido.</p>');
        return;
    }

    const rows = partnersContainer.querySelectorAll('.partner-row');
    if (rows.length === 0) {
        mostrarResultado('<p style="color:#b91c1c;text-align:center;">Agrega al menos un partner.</p>');
        return;
    }

    const partners = [];
    for (const row of rows) {
        const name = row.querySelector('.p-name').value.trim();
        if (!name) {
            mostrarResultado('<p style="color:#b91c1c;text-align:center;">Completa los nombres de todos los partners.</p>');
            return;
        }
        const hpd = Number(row.querySelector('.p-horas').value);
        const dto = Number(row.querySelector('.p-descuento').value) || 0;
        const semanales = hpd * DIAS_POR_SEMANA;
        const netas = Math.max(0, semanales - dto);
        partners.push({ name, hpd, semanales, dto, netas });
    }

    const totalNetas = partners.reduce((s, p) => s + p.netas, 0);
    if (totalNetas <= 0) {
        mostrarResultado('<p style="color:#b91c1c;text-align:center;">El total de horas netas debe ser mayor a 0.</p>');
        return;
    }

    const factor = total / totalNetas;
    partners.forEach(p => {
        p.propina = p.netas * factor;
        p.pct = (p.netas / totalNetas) * 100;
    });

    const suma = partners.reduce((s, p) => s + p.propina, 0);
    const diff = total - suma;
    if (Math.abs(diff) > 0.001 && partners.length > 0) {
        partners[partners.length - 1].propina += diff;
    }

    renderResultados(partners, total, totalNetas, factor);
}

function renderResultados(partners, total, totalNetas, factor) {
    const fStr = Number.isInteger(factor) ? factor.toFixed(0) : factor.toFixed(4);

    let html = `
        <div class="result-title">Distribución de propinas</div>
        <div class="result-summary">
            Total: <strong>$${total.toFixed(2)}</strong> &middot;
            Horas netas: <strong>${totalNetas}h</strong> &middot;
            Factor: <strong>$${fStr}/h</strong>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Partner</th>
                    <th>H/d</th>
                    <th>H sem</th>
                    <th>Dto</th>
                    <th>H netas</th>
                    <th>%</th>
                    <th>Propina</th>
                </tr>
            </thead>
            <tbody>
    `;

    for (const p of partners) {
        html += `<tr>
            <td><strong>${p.name}</strong></td>
            <td>${p.hpd}h</td>
            <td>${p.semanales}h</td>
            <td>${p.dto > 0 ? p.dto + 'h' : '—'}</td>
            <td>${p.netas}h</td>
            <td>${p.pct.toFixed(1)}</td>
            <td><strong>$${p.propina.toFixed(2)}</strong></td>
        </tr>`;
    }

    const suma = partners.reduce((s, p) => s + p.propina, 0);
    html += `<tr class="total-row">
        <td colspan="6"><strong>Total</strong></td>
        <td><strong>$${suma.toFixed(2)}</strong></td>
    </tr></tbody></table>`;

    mostrarResultado(html);
}

function mostrarResultado(html) {
    resultado.innerHTML = html;
    resultado.style.display = 'block';
    resultado.style.color = '#0f172a';
    resultado.classList.remove('result-glow');
    void resultado.offsetWidth;
    resultado.classList.add('result-glow');
}

initPartners();
