const partnersContainer = document.getElementById('partnersContainer');
const addPartnerBtn = document.getElementById('addPartnerBtn');
const calcularBtn = document.getElementById('calcularBtn');
const resultado = document.getElementById('resultado');

let idCounter = 0;

const SCHEDULES = {
    supervisor: [
        { value: 36, label: '6h/d — 36h/sem' },
        { value: 48, label: '8h/d — 48h/sem' },
    ],
    partner: [
        { value: 40, label: '5×2 — 40h/sem' },
        { value: 32, label: '4×3 — 32h/sem' },
        { value: 24, label: '3×4 — 24h/sem' },
    ],
};

function crearDtoItem(dtoSection, tipo, cant) {
    const item = document.createElement('div');
    item.className = 'dto-item';

    const tipos = [
        { value: 8, label: 'falta/incapacidad' },
        { value: 16, label: 'Reporte hechos' },
        { value: 24, label: 'Junta' },
    ];

    item.innerHTML = `
        <select class="dto-tipo">
            ${tipos.map(t => `<option value="${t.value}" ${t.value === tipo ? 'selected' : ''}>${t.label}</option>`).join('')}
        </select>
        <input type="number" class="dto-cant" min="1" step="1" value="${cant}">
        <span class="dto-item-total">${tipo * cant}h</span>
        <button type="button" class="dto-remove">×</button>
    `;

    function recalcularItem() {
        const t = Number(item.querySelector('.dto-tipo').value);
        const c = Number(item.querySelector('.dto-cant').value) || 0;
        item.querySelector('.dto-item-total').textContent = (t * c) + 'h';
        recalcularDtoTotal(dtoSection);
    }

    item.querySelector('.dto-tipo').addEventListener('change', recalcularItem);
    item.querySelector('.dto-cant').addEventListener('input', recalcularItem);
    item.querySelector('.dto-remove').addEventListener('click', () => {
        item.remove();
        recalcularDtoTotal(dtoSection);
    });

    return item;
}

function recalcularDtoTotal(dtoSection) {
    const items = dtoSection.querySelectorAll('.dto-item');
    const total = Array.from(items).reduce((s, item) => {
        const t = Number(item.querySelector('.dto-tipo').value);
        const c = Number(item.querySelector('.dto-cant').value) || 0;
        return s + t * c;
    }, 0);
    dtoSection.querySelector('.dto-total').textContent = total + 'h';
}

function crearRowPartner() {
    const id = idCounter++;
    const row = document.createElement('div');
    row.className = 'partner-row';
    row.dataset.id = id;

    row.innerHTML = `
        <div class="form-field">
            <label>Nombre</label>
            <input type="text" class="p-name" placeholder="Nombre">
        </div>
        <div class="form-field">
            <label>Rol</label>
            <select class="p-rol">
                <option value="partner" selected>Partner</option>
                <option value="supervisor">Supervisor</option>
            </select>
        </div>
        <div class="form-field">
            <label>Horario</label>
            <select class="p-horario"></select>
        </div>
        <button type="button" class="btn-remove">Eliminar</button>
        <div class="dto-section">
            <div class="dto-header">
                <label>Dto. horas</label>
                <span class="dto-total">0h</span>
            </div>
            <div class="dto-items"></div>
            <button type="button" class="btn-dto-add">+ Agregar descuento</button>
        </div>
    `;

    const rolSelect = row.querySelector('.p-rol');
    const horarioSelect = row.querySelector('.p-horario');

    function actualizarHorario() {
        const schedules = SCHEDULES[rolSelect.value];
        horarioSelect.innerHTML = schedules.map(s =>
            `<option value="${s.value}">${s.label}</option>`
        ).join('');
    }

    actualizarHorario();
    rolSelect.addEventListener('change', actualizarHorario);

    const dtoSection = row.querySelector('.dto-section');
    dtoSection.querySelector('.btn-dto-add').addEventListener('click', () => {
        const item = crearDtoItem(dtoSection, 8, 1);
        dtoSection.querySelector('.dto-items').appendChild(item);
    });
    const firstItem = crearDtoItem(dtoSection, 8, 1);
    dtoSection.querySelector('.dto-items').appendChild(firstItem);

    row.querySelector('.btn-remove').addEventListener('click', () => row.remove());
    partnersContainer.appendChild(row);
}

function initPartners() {
    partnersContainer.innerHTML = '';
    crearRowPartner();
}

addPartnerBtn.addEventListener('click', crearRowPartner);

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
        const rol = row.querySelector('.p-rol').value;
        const semanales = Number(row.querySelector('.p-horario').value);
        const dtoItems = row.querySelectorAll('.dto-item');
        const dto = Array.from(dtoItems).reduce((s, item) => {
            const tipo = Number(item.querySelector('.dto-tipo').value);
            const cant = Number(item.querySelector('.dto-cant').value) || 0;
            return s + tipo * cant;
        }, 0);
        const netas = Math.max(0, semanales - dto);

        let horarioLabel;
        if (rol === 'supervisor') {
            horarioLabel = semanales === 36 ? '6h/d' : '8h/d';
        } else {
            horarioLabel = semanales === 40 ? '5×2' : semanales === 32 ? '4×3' : '3×4';
        }

        partners.push({ name, rol, horarioLabel, semanales, dto, netas });
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
                    <th>Rol</th>
                    <th>Horario</th>
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
            <td>${p.rol === 'supervisor' ? 'Sup.' : 'Part.'}</td>
            <td>${p.horarioLabel}</td>
            <td>${p.semanales}h</td>
            <td>${p.dto > 0 ? p.dto + 'h' : '—'}</td>
            <td>${p.netas}h</td>
            <td>${p.pct.toFixed(1)}</td>
            <td><strong>$${p.propina.toFixed(2)}</strong></td>
        </tr>`;
    }

    const suma = partners.reduce((s, p) => s + p.propina, 0);
    html += `<tr class="total-row">
        <td colspan="7"><strong>Total</strong></td>
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
