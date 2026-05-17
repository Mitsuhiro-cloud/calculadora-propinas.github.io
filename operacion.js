// ==================== REFERENCIAS DEL DOM ====================
// Elemento del formulario de detalles del parner
const detalleForm = document.getElementById('detalleForm');

// Elemento donde se muestra el resultado del cálculo de propinas
const resultado = document.getElementById('resultado');

// Select para elegir si el usuario es parner o supervisor
const rolParnerSelect = document.getElementById('rolParner');

// Contenedor del campo de jornada (se muestra/oculta según el rol)
const jornadaField = document.getElementById('jornadaField');

// Select para elegir la jornada (5x2, 4x3, 3x4) - solo visible para parners
const jornadaSelect = document.getElementById('jornada');

// ==================== VARIABLES GLOBALES ====================
// Almacena el monto de propinas que corresponde a cada parner
let propinasPorParner = null;

// ==================== FUNCIONES UTILITARIAS ====================
/**
 * Actualiza la visibilidad del campo de jornada
 * - Si el rol es "supervisor": oculta el campo de jornada (los supervisores trabajan 12 días fijos)
 * - Si el rol es "parner": muestra el campo de jornada (para seleccionar 5x2, 4x3 o 3x4)
 */
function actualizarJornadaVisible() {
    if (rolParnerSelect.value === 'supervisor') {
        jornadaField.style.display = 'none';
        jornadaSelect.value = '';
    } else {
        jornadaField.style.display = 'block';
    }
}

// Ejecutar al cargar la página para establecer el estado inicial
actualizarJornadaVisible();

// Actualizar la visibilidad cuando cambia el rol seleccionado
rolParnerSelect.addEventListener('change', actualizarJornadaVisible);

/**
 * Muestra el resultado del cálculo en el área de resultado
 * @param {string} text - El contenido HTML a mostrar
 * @param {string} color - Color del texto (por defecto '#0f172a' - negro oscuro; '#b91c1c' - rojo para errores)
 * 
 * La función:
 * 1. Actualiza el contenido HTML del resultado
 * 2. Establece el color del texto
 * 3. Remueve la clase de animación anterior
 * 4. Fuerza un reflow del DOM (void resultado.offsetWidth)
 * 5. Agrega la clase de animación 'result-glow' para activar la animación CSS
 */
function mostrarResultado(text, color = '#0f172a') {
    resultado.innerHTML = text;
    resultado.style.color = color;
    resultado.classList.remove('result-glow');
    void resultado.offsetWidth;
    resultado.classList.add('result-glow');
}

// ==================== MANEJADOR PRINCIPAL DEL FORMULARIO ====================
/**
 * Maneja el envío del formulario de detalles del parner
 * Calcula y muestra las propinas ajustadas según faltas
 */
detalleForm.addEventListener('submit', function (event) {
    event.preventDefault();

    // ========== VALIDACIÓN 1: PROPINAS TOTALES ==========
    // Obtiene el monto total de propinas ingresadas
    const totalPropinas = Number(document.getElementById('propinasTotales').value);
    // Obtiene la cantidad de parners a repartir
    const parners = Number(document.getElementById('parners').value);

    // Valida que el monto de propinas sea un número válido y no negativo
    if (!Number.isFinite(totalPropinas) || totalPropinas < 0) {
        mostrarResultado('Ingresa una cantidad válida de propinas totales.', '#b91c1c');
        return;
    }

    // Valida que haya al menos un parner
    if (!Number.isFinite(parners) || parners < 1) {
        mostrarResultado('Ingresa un número válido de parners (al menos 1).', '#b91c1c');
        return;
    }

    // Calcula el monto base de propinas que corresponde a cada parner (sin ajustes por faltas)
    propinasPorParner = totalPropinas / parners;

    // ========== VALIDACIÓN 2: DATOS DEL PARNER ==========
    // Obtiene el nombre del parner/supervisor (trimmed para remover espacios)
    const nombreParner = document.getElementById('nombreParner').value.trim();
    // Obtiene el rol seleccionado ('parner' o 'supervisor')
    const rolParner = rolParnerSelect.value;
    // Obtiene la jornada seleccionada (solo para parners: '5x2', '4x3', '3x4')
    const jornada = jornadaSelect.value;
    // Obtiene la cantidad de faltas registradas
    const faltas = Number(document.getElementById('faltas').value);

    // Valida que el nombre no esté vacío
    if (!nombreParner) {
        mostrarResultado('Ingresa el nombre del parner.', '#b91c1c');
        return;
    }

    // Valida que se haya seleccionado un rol
    if (!rolParner) {
        mostrarResultado('Selecciona si eres parner o supervisor.', '#b91c1c');
        return;
    }

    // ========== LÓGICA: CÁLCULO DE DÍAS TRABAJADOS ==========
    // Variable que almacena los días que realmente trabajó el parner/supervisor
    let diasTrabajados;
    
    if (rolParner === 'supervisor') {
        // Los supervisores trabajan 12 días por defecto (mes completo)
        diasTrabajados = 12;
        
        // Si hay faltas, se restan de los 12 días (sin bajar de 0)
        if (faltas > 0) {
            diasTrabajados = Math.max(0, 12 - faltas);
        }
    } else {
        // Mapeo de jornadas a días de trabajo por mes
        const jornadaMap = {
            '5x2': 10,  // 5 días de trabajo, 2 de descanso = 10 días trabajados
            '4x3': 8,   // 4 días de trabajo, 3 de descanso = 8 días trabajados
            '3x4': 6,   // 3 días de trabajo, 4 de descanso = 6 días trabajados
        };

        // Valida que la jornada seleccionada sea válida
        if (!jornadaMap[jornada]) {
            mostrarResultado('Selecciona un tipo de jornada válido.', '#b91c1c');
            return;
        }

        // Obtiene los días trabajados según la jornada
        diasTrabajados = jornadaMap[jornada];
    }

    // ========== VALIDACIÓN 3: FALTAS ==========
    // Valida que las faltas sean un número válido entre 0 y 12
    if (!Number.isFinite(faltas) || faltas < 0 || faltas > 12) {
        mostrarResultado('Ingresa una cantidad válida de faltas (0-12).', '#b91c1c');
        return;
    }

    // Valida que la suma de días trabajados + faltas no supere 12 (mes completo)
    if (diasTrabajados + faltas > 12) {
        mostrarResultado('La suma de días trabajados y faltas no puede superar 12.', '#b91c1c');
        return;
    }

    // ========== CÁLCULO FINAL: AJUSTE POR FALTAS ==========
    // Factor que reduce las propinas según la cantidad de faltas
    // Si hay 0 faltas: factor = 1 (sin descuento)
    // Si hay 6 faltas: factor = 0.5 (50% de descuento)
    // Si hay 12 faltas: factor = 0 (sin propinas)
    const factorFaltas = Math.max(0, 1 - faltas / 12);
    
    // Propinas ajustadas = propinas base × factor de faltas
    const propinasAjustadas = propinasPorParner * factorFaltas;
    
    // Monto que se descuenta por faltas
    const descuento = propinasPorParner - propinasAjustadas;

    // ========== MOSTRAR RESULTADO ==========
    mostrarResultado(
        `<p><strong>${nombreParner}</strong> recibe <strong class="resultado-numero">${propinasAjustadas.toFixed(2)}</strong> propinas después de <strong class="resultado-numero">${faltas}</strong> falta(s).</p>` +
        `<p>Propina base por parner: <strong class="resultado-numero">${propinasPorParner.toFixed(2)}</strong></p>` +
        (faltas > 0 ? `<p>Descuento por faltas: <strong class="resultado-numero">${descuento.toFixed(2)}</strong></p>` : '') +
        `<p>Días trabajados: <strong class="resultado-numero">${diasTrabajados}</strong> / <strong class="resultado-numero">12</strong></p>`
    );
});

