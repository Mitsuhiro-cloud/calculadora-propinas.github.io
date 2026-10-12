const partnersContainer = document.getElementById('partnersContainer');
const addPartnerBtn = document.getElementById('addPartnerBtn');
const calcularBtn = document.getElementById('calcularBtn');
const resultado = document.getElementById('resultado');

let idCounter = 0;

const SCHEDULES = {
    supervisor: [
        { value: 36, label: '6h/d — 36h/sem', hoursPerDay: 6, daysPerWeek: 6 },
        { value: 48, label: '8h/d — 48h/sem', hoursPerDay: 8, daysPerWeek: 6 },
    ],
    partner: [
        { value: 40, label: '5×2 — 40h/sem', hoursPerDay: 8, daysPerWeek: 5 },
        { value: 32, label: '4×3 — 32h/sem', hoursPerDay: 8, daysPerWeek: 4 },
        { value: 24, label: '3×4 — 24h/sem', hoursPerDay: 8, daysPerWeek: 3 },
    ],
};

const STORAGE_KEY = 'calculo_guardado';

function guardarEstado(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        return true;
    } catch (e) {
        console.error('No se pudo guardar', e);
        return false;
    }
}

function leerEstado() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.error('Datos corruptos, se ignoran', e);
        return null;
    }
}

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

function crearRowPartner(datos) {
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
        <div class="extra-section">
            <button type="button" class="btn-extra-toggle">Horas extra</button>
            <div class="extra-panel" style="display:none;">
                <div class="extra-header">
                    <label>Horas extra</label>
                    <span class="extra-total">0h</span>
                </div>
                <div class="extra-items">
                    <div class="extra-item">
                        <input type="number" class="extra-hours" min="1" step="1" placeholder="Horas">
                        <button type="button" class="extra-remove">×</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const nameInput = row.querySelector('.p-name');
    const rolSelect = row.querySelector('.p-rol');
    const horarioSelect = row.querySelector('.p-horario');

    function actualizarHorario() {
        const schedules = SCHEDULES[rolSelect.value];
        horarioSelect.innerHTML = schedules.map(s =>
            `<option value="${s.value}">${s.label}</option>`
        ).join('');
    }

    if (datos && datos.rol) {
        rolSelect.value = datos.rol;
    }
    actualizarHorario();
    if (datos && datos.horario) {
        horarioSelect.value = datos.horario;
    }
    if (datos && datos.nombre) {
        nameInput.value = datos.nombre;
    }
    rolSelect.addEventListener('change', actualizarHorario);

    const dtoSection = row.querySelector('.dto-section');
    const dtoItemsContainer = dtoSection.querySelector('.dto-items');
    dtoSection.querySelector('.btn-dto-add').addEventListener('click', () => {
        dtoItemsContainer.appendChild(crearDtoItem(dtoSection, 8, 1));
    });

    if (datos && Array.isArray(datos.dto)) {
        for (const d of datos.dto) {
            dtoItemsContainer.appendChild(crearDtoItem(dtoSection, Number(d.tipo), Number(d.cant)));
        }
    } else {
        dtoItemsContainer.appendChild(crearDtoItem(dtoSection, 8, 1));
    }
    recalcularDtoTotal(dtoSection);

    const extraToggle = row.querySelector('.btn-extra-toggle');
    const extraPanel = row.querySelector('.extra-panel');
    const extraInput = row.querySelector('.extra-hours');
    const extraTotal = row.querySelector('.extra-total');
    const extraRemove = row.querySelector('.extra-remove');

    if (datos && datos.extra) {
        extraInput.value = datos.extra;
        extraTotal.textContent = datos.extra + 'h';
    }

    extraToggle.addEventListener('click', () => {
        const isVisible = extraPanel.style.display !== 'none';
        extraPanel.style.display = isVisible ? 'none' : 'block';
        extraToggle.classList.toggle('active', !isVisible);
    });

    extraInput.addEventListener('input', () => {
        const val = Number(extraInput.value) || 0;
        extraTotal.textContent = val + 'h';
    });

    extraRemove.addEventListener('click', () => {
        extraInput.value = '';
        extraTotal.textContent = '0h';
        extraPanel.style.display = 'none';
        extraToggle.classList.remove('active');
    });

    row.querySelector('.btn-remove').addEventListener('click', () => row.remove());
    partnersContainer.appendChild(row);
}

function leerFormulario() {
    const rows = partnersContainer.querySelectorAll('.partner-row');
    return {
        total: document.getElementById('propinasTotales').value,
        dias: document.getElementById('diasTrabajados').value,
        partners: Array.from(rows).map(row => ({
            nombre: row.querySelector('.p-name').value,
            rol: row.querySelector('.p-rol').value,
            horario: row.querySelector('.p-horario').value,
            dto: Array.from(row.querySelectorAll('.dto-item')).map(item => ({
                tipo: item.querySelector('.dto-tipo').value,
                cant: item.querySelector('.dto-cant').value
            })),
            extra: row.querySelector('.extra-hours').value
        }))
    };
}

function initPartners() {
    partnersContainer.innerHTML = '';
    const guardado = leerEstado();

    if (guardado && guardado.partners && guardado.partners.length) {
        for (const p of guardado.partners) {
            crearRowPartner({
                nombre: p.nombre,
                rol: p.rol,
                horario: p.horario,
                dto: [],
                extra: ''
            });
        }
    } else {
        crearRowPartner();
    }
}

addPartnerBtn.addEventListener('click', () => crearRowPartner());

calcularBtn.addEventListener('click', calcular);

function calcular() {
    guardarEstado(leerFormulario());

    const total = Number(document.getElementById('propinasTotales').value);
    const diasTrabajados = Number(document.getElementById('diasTrabajados').value) || 1;

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
        const schedule = SCHEDULES[rol].find(s => s.value === semanales);
        const horasPorDia = schedule ? schedule.hoursPerDay : 8;
        const diasPorSemana = schedule ? schedule.daysPerWeek : 5;
        const horasTotales = Math.round((diasTrabajados / 7) * diasPorSemana * horasPorDia);
        const dtoItems = row.querySelectorAll('.dto-item');
        const dto = Array.from(dtoItems).reduce((s, item) => {
            const tipo = Number(item.querySelector('.dto-tipo').value);
            const cant = Number(item.querySelector('.dto-cant').value) || 0;
            return s + tipo * cant;
        }, 0);
        const extraInput = row.querySelector('.extra-hours');
        const extra = Number(extraInput.value) || 0;
        const netas = Math.max(0, horasTotales - dto + extra);

        let horarioLabel;
        if (rol === 'supervisor') {
            horarioLabel = semanales === 36 ? '6h/d' : '8h/d';
        } else {
            horarioLabel = semanales === 40 ? '5×2' : semanales === 32 ? '4×3' : '3×4';
        }

        partners.push({ name, rol, horarioLabel, semanales, horasPorDia, diasPorSemana, horasTotales, dto, extra, netas });
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

    renderResultados(partners, total, totalNetas, factor, diasTrabajados);
}

function renderResultados(partners, total, totalNetas, factor, diasTrabajados) {
    const fStr = Number.isInteger(factor) ? factor.toFixed(0) : factor.toFixed(4);

    resultado.innerHTML = '';
    resultado.style.display = 'block';
    resultado.style.color = '#0f172a';

    const title = document.createElement('div');
    title.className = 'result-title';
    title.textContent = 'Distribución de propinas';
    resultado.appendChild(title);

    const summary = document.createElement('div');
    summary.className = 'result-summary';
    summary.append(
        document.createTextNode('Total: '),
        strongTag('$' + total.toFixed(2)),
        document.createTextNode(' · Horas netas: '),
        strongTag(totalNetas + 'h'),
        document.createTextNode(' · Factor: '),
        strongTag('$' + fStr + '/h'),
        document.createTextNode(' · Período: '),
        strongTag(diasTrabajados + ' ' + (diasTrabajados === 1 ? 'día' : 'días'))
    );
    resultado.appendChild(summary);

    const encabezados = ['Partner', 'Rol', 'Horario', 'Días/sem', 'H/día', 'H totales', 'Dto', 'Ext', 'H netas', '%', 'Propina'];
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    for (const h of encabezados) {
        const th = document.createElement('th');
        th.textContent = h;
        headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (const p of partners) {
        const tr = document.createElement('tr');
        const celdas = [
            [p.name, true],
            [p.rol === 'supervisor' ? 'Sup.' : 'Part.', false],
            [p.horarioLabel, false],
            [p.diasPorSemana + 'd', false],
            [p.horasPorDia + 'h', false],
            [p.horasTotales + 'h', false],
            [p.dto > 0 ? p.dto + 'h' : '—', false],
            [p.extra > 0 ? p.extra + 'h' : '—', false],
            [p.netas + 'h', false],
            [p.pct.toFixed(1), false],
            ['$' + p.propina.toFixed(2), true]
        ];
        for (const [txt, esFuerte] of celdas) {
            const td = document.createElement('td');
            td.appendChild(esFuerte ? strongTag(txt) : document.createTextNode(txt));
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }

    const suma = partners.reduce((s, p) => s + p.propina, 0);
    const totalRow = document.createElement('tr');
    totalRow.className = 'total-row';
    const tdTotal = document.createElement('td');
    tdTotal.colSpan = encabezados.length - 1;
    tdTotal.appendChild(strongTag('Total'));
    totalRow.appendChild(tdTotal);
    const tdSuma = document.createElement('td');
    tdSuma.appendChild(strongTag('$' + suma.toFixed(2)));
    totalRow.appendChild(tdSuma);
    tbody.appendChild(totalRow);

    table.appendChild(tbody);
    resultado.appendChild(table);
    darGlow();
}

function strongTag(txt) {
    const strong = document.createElement('strong');
    strong.textContent = txt;
    return strong;
}

function mostrarResultado(html) {
    resultado.innerHTML = html;
    resultado.style.display = 'block';
    resultado.style.color = '#0f172a';
    darGlow();
}

function darGlow() {
    resultado.classList.remove('result-glow');
    void resultado.offsetWidth;
    resultado.classList.add('result-glow');
}

initPartners();
