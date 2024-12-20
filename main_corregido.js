let calendar;
// Agregar al inicio del archivo, justo antes del DOMContentLoaded
if (window.location.href.includes('login.html')) {
    window.location.href = 'index.html';
}
function verificarAlmacenamiento() {
    if (!localStorage.getItem('tareas')) {
        localStorage.setItem('tareas', JSON.stringify([]));
    }
}
document.addEventListener('DOMContentLoaded', function() {
    verificarAlmacenamiento();
    console.log('DOM fully loaded');
    inicializarCalendario();
    window.addEventListener('beforeunload', function(e) {
        // Prevenir cualquier redirección no deseada
        if (window.location.href.includes('login.html')) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
    console.log('DOM fully loaded');
    inicializarCalendario();
    actualizarListaTareas();
    
    document.getElementById('agregarBtn').addEventListener('click', agregarTarea);
    document.getElementById('limpiarTareasBtn').addEventListener('click', limpiarTareas);
    document.getElementById('ordenarFechaBtn').addEventListener('click', ordenarTareasPorFecha);
    document.getElementById('ordenarPrioridadBtn').addEventListener('click', ordenarTareasPorPrioridad);
    document.getElementById('filtrarPrioridadSelect').addEventListener('change', function() {
        filtrarTareasPorPrioridad(this.value);
    });
    document.getElementById('verHistorialBtn').addEventListener('click', mostrarHistorial);
    document.getElementById('toggleFilters').addEventListener('click', toggleFiltros);
    document.getElementById('toggleModoOscuro').addEventListener('click', toggleModoOscuro);
    
    aplicarModoGuardado();
});

function inicializarCalendario() {
    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: cargarTareas(),
        eventClick: mostrarDetallesTarea,
        locale: 'es',
        eventDidMount: function(info) {
            // Verificar si la tarea está vencida
            const fechaTarea = new Date(info.event.start);
            const fechaActual = new Date();
            fechaActual.setHours(0, 0, 0, 0);
            fechaTarea.setHours(0, 0, 0, 0);
            
            // Si la tarea está vencida y no está completada, cambiar color a gris
            if (fechaTarea < fechaActual && !info.event.extendedProps.completed) {
                info.el.style.backgroundColor = '#f0f0f0';
                info.el.style.borderColor = '#d0d0d0';
                info.el.style.color = '#666666';
            }
        }
    });
    calendar.render();
}
function actualizarCalendario() {
    if (calendar) {
        calendar.removeAllEvents();
        const tareas = cargarTareas();
        tareas.forEach(tarea => {
            const fechaTarea = new Date(tarea.start);
            const fechaActual = new Date();
            fechaActual.setHours(0, 0, 0, 0);
            fechaTarea.setHours(0, 0, 0, 0);

            if (!tarea.extendedProps.completed) {
                tarea.backgroundColor = fechaTarea < fechaActual ? '#f0f0f0' : getColorForPrioridad(tarea.extendedProps.prioridad);
                tarea.borderColor = fechaTarea < fechaActual ? '#d0d0d0' : getColorForPrioridad(tarea.extendedProps.prioridad);
                tarea.textColor = fechaTarea < fechaActual ? '#666666' : '#ffffff';
                calendar.addEvent(tarea);
            }
        });
    }
}
function cargarTareas() {
    try {
        const tareasStr = localStorage.getItem('tareas');
        return JSON.parse(tareasStr || '[]');
    } catch (error) {
        console.error('Error al cargar tareas:', error);
        return [];
    }
}

function agregarTarea() {
    const tareaInput = document.getElementById('tareaInput');
    const prioridadInput = document.getElementById('prioridadInput');
    const fechaInput = document.getElementById('fechaInput');
    const categoriaInput = document.getElementById('categoriaInput');

    const tarea = tareaInput.value.trim();
    const prioridad = prioridadInput.value;
    const fecha = fechaInput.value;
    const categoria = categoriaInput.value.trim();

    if (!tarea || !fecha || !prioridad || !categoria) {
        Swal.fire({
            title: 'Error',
            text: 'No se pudo agregar la tarea.',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#6f42c1'
        });
        return; // Salimos de la función sin agregar la tarea
    }

    try {
        const fechaTarea = new Date(fecha);
        const fechaActual = new Date();
        fechaActual.setHours(0, 0, 0, 0);
        fechaTarea.setHours(0, 0, 0, 0);
        
        const nuevaTarea = {
            id: Date.now().toString(),
            title: tarea,
            start: fecha,
            allDay: true,
            backgroundColor: fechaTarea < fechaActual ? '#f0f0f0' : getColorForPrioridad(prioridad),
            borderColor: fechaTarea < fechaActual ? '#d0d0d0' : getColorForPrioridad(prioridad),
            textColor: fechaTarea < fechaActual ? '#666666' : '#ffffff',
            extendedProps: {
                prioridad: prioridad,
                categoria: categoria,
                completed: false
            }
        };
        const tareas = cargarTareas();
        tareas.push(nuevaTarea);
        localStorage.setItem('tareas', JSON.stringify(tareas));

        if (calendar) {
            calendar.addEvent(nuevaTarea);
        }

        actualizarListaTareas();
        limpiarFormulario();
        
        Swal.fire({
            title: 'Éxito',
            text: 'Tarea agregada correctamente.',
            icon: 'success',
            confirmButtonColor: '#198754'
        });
    } catch (error) {
        console.error('Error al agregar tarea:', error);
        Swal.fire({
            title: 'Error',
            text: 'No se pudo agregar la tarea.',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#6f42c1'
        });
    }
}

function limpiarFormulario() {
    document.getElementById('tareaInput').value = '';
    document.getElementById('fechaInput').value = '';
    document.getElementById('prioridadInput').value = '';
    document.getElementById('categoriaInput').value = '';
}
function getColorForPrioridad(prioridad) {
    const colores = {
        'Alta': '#ff4d4d',
        'Media': '#ffa64d',
        'Baja': '#4da6ff'
    };
    return colores[prioridad] || '#4da6ff';
}

function actualizarListaTareas(tareasFiltradas) {
    const listaTareas = document.getElementById('listaTareas');
    if (!listaTareas) return;

    listaTareas.innerHTML = '';
    const tareas = tareasFiltradas || cargarTareas();
    
    tareas.filter(tarea => !tarea.extendedProps.completed).forEach(tarea => {
        const li = crearElementoTarea(tarea);
        listaTareas.appendChild(li);
    });
}

function crearElementoTarea(tarea) {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    
    // Verificar si la tarea está vencida (fecha anterior a hoy y no completada)
    const fechaTarea = new Date(tarea.start);
    const fechaActual = new Date();
    // Establecer las horas a 0 para comparar solo fechas
    fechaActual.setHours(0, 0, 0, 0);
    fechaTarea.setHours(0, 0, 0, 0);
    
    // Marcar como vencida si la fecha es anterior a hoy y no está completada
    if (fechaTarea < fechaActual && !tarea.extendedProps.completed) {
        li.classList.add('task-expired');
    }
    
    li.innerHTML = `
        <div class="d-flex flex-column">
            <div class="d-flex align-items-center">
                <span class="badge bg-${getBadgeClass(tarea.extendedProps.prioridad)} me-2">${tarea.extendedProps.prioridad}</span>
                <span class="task-title">${tarea.title}</span>
            </div>
            <small class="text-muted">Fecha: ${new Date(tarea.start).toLocaleDateString()}</small>
            <small class="text-muted">Categoría: ${tarea.extendedProps.categoria}</small>
        </div>
        <div class="btn-group">
            <button class="btn btn-sm btn-success" onclick="marcarComoCompletada('${tarea.id}')">Completar</button>
            <button class="btn btn-sm btn-primary" onclick="editarTarea('${tarea.id}')">Editar</button>
        </div>
    `;
    
    return li;
}

function getBadgeClass(prioridad) {
    const clases = {
        'Alta': 'danger',
        'Media': 'warning',
        'Baja': 'primary'
    };
    return clases[prioridad] || 'secondary';
}

function marcarComoCompletada(tareaId) {
    Swal.fire({
        title: '¿Completar tarea?',
        text: "¿Estás seguro de que quieres marcar esta tarea como completada?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, completar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            const tareas = cargarTareas();
            const tareaIndex = tareas.findIndex(t => t.id === tareaId);
            
            if (tareaIndex !== -1) {
                tareas[tareaIndex].extendedProps.completed = true;
                tareas[tareaIndex].completedDate = new Date().toISOString();
                
                localStorage.setItem('tareas', JSON.stringify(tareas));
                
                if (calendar) {
                    const evento = calendar.getEventById(tareaId);
                    if (evento) {
                        evento.remove();
                    }
                }
                
                actualizarListaTareas();
                actualizarHistorialTareasCompletadas();
                
                Swal.fire('¡Completada!', 'La tarea ha sido marcada como completada.', 'success');
            }
        }
    });
}
function actualizarListaTareas(tareasFiltradas) {
    const listaTareas = document.getElementById('listaTareas');
    if (!listaTareas) return;

    listaTareas.innerHTML = '';
    const tareas = tareasFiltradas || cargarTareas();
    
    // Filtrar solo las tareas no completadas
    const tareasNoCompletadas = tareas.filter(tarea => !tarea.extendedProps.completed);
    
    // Ordenar las tareas: primero las no vencidas, luego las vencidas
    tareasNoCompletadas.sort((a, b) => {
        const fechaA = new Date(a.start);
        const fechaB = new Date(b.start);
        const fechaActual = new Date();
        fechaActual.setHours(0, 0, 0, 0);
        
        const aVencida = fechaA < fechaActual;
        const bVencida = fechaB < fechaActual;
        
        if (aVencida === bVencida) {
            return fechaA - fechaB;
        }
        return aVencida ? 1 : -1;
    });

    tareasNoCompletadas.forEach(tarea => {
        const li = crearElementoTarea(tarea);
        listaTareas.appendChild(li);
    });
}

function ordenarTareasPorFecha() {
    const tareas = cargarTareas();
    tareas.sort((a, b) => new Date(a.start) - new Date(b.start));
    localStorage.setItem('tareas', JSON.stringify(tareas));
    actualizarListaTareas(tareas);
    inicializarCalendario();
}

function ordenarTareasPorPrioridad() {
    const prioridadOrden = { 'Alta': 1, 'Media': 2, 'Baja': 3 };
    const tareas = cargarTareas();
    
    tareas.sort((a, b) => {
        return prioridadOrden[a.extendedProps.prioridad] - prioridadOrden[b.extendedProps.prioridad];
    });
    
    localStorage.setItem('tareas', JSON.stringify(tareas));
    actualizarListaTareas(tareas);
}

function filtrarTareasPorPrioridad(prioridad) {
    const tareas = cargarTareas();
    const tareasFiltradas = prioridad ? 
        tareas.filter(tarea => tarea.extendedProps.prioridad === prioridad) : 
        tareas;
    
    actualizarListaTareas(tareasFiltradas);
}

function filtrarTareasPorCategoria() {
    const categoria = document.getElementById('filtrarCategoriaInput').value.toLowerCase().trim();
    const tareas = cargarTareas();
    
    const tareasFiltradas = categoria ? 
        tareas.filter(tarea => tarea.extendedProps.categoria.toLowerCase().includes(categoria)) : 
        tareas;
    
    actualizarListaTareas(tareasFiltradas);
}

function buscarTareas() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const tareas = cargarTareas();
    
    const tareasFiltradas = searchTerm ? 
        tareas.filter(tarea => 
            tarea.title.toLowerCase().includes(searchTerm) || 
            tarea.extendedProps.categoria.toLowerCase().includes(searchTerm)
        ) : 
        tareas;
    
    actualizarListaTareas(tareasFiltradas);
}

function limpiarTareas() {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción eliminará todas las tareas",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar todo',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('tareas');
            calendar.removeAllEvents();
            actualizarListaTareas();
            actualizarHistorialTareasCompletadas();
            Swal.fire('Eliminado', 'Todas las tareas han sido eliminadas.', 'success');
        }
    });
}
function mostrarHistorial() {
    const historialModal = new bootstrap.Modal(document.getElementById('historialModal'));
    historialModal.show();
    filtrarHistorial('todas');
}

function filtrarHistorial(filtro) {
    const historialElement = document.getElementById('historialTareasCompletadas');
    const tareas = cargarTareas();
    let tareasCompletadas = tareas.filter(tarea => tarea.extendedProps.completed);
    switch(filtro) {
        case 'ultima-semana':
            const ultimaSemana = new Date();
            ultimaSemana.setDate(ultimaSemana.getDate() - 7);
            tareasCompletadas = tareasCompletadas.filter(tarea => 
                new Date(tarea.completedDate) > ultimaSemana
            );
            break;
        case 'ultimo-mes':
            const ultimoMes = new Date();
            ultimoMes.setMonth(ultimoMes.getMonth() - 1);
            tareasCompletadas = tareasCompletadas.filter(tarea => 
                new Date(tarea.completedDate) > ultimoMes
            );
            break;
    }
    tareasCompletadas.sort((a, b) => new Date(b.completedDate) - new Date(a.completedDate));
    
    historialElement.innerHTML = '';
    tareasCompletadas.forEach(tarea => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <span>${tarea.title}</span>
                <div>
                    <span class="badge bg-${getBadgeClass(tarea.extendedProps.prioridad)} me-2">${tarea.extendedProps.prioridad}</span>
                    <span class="badge bg-success">Completada: ${new Date(tarea.completedDate).toLocaleDateString()}</span>
                </div>
            </div>
            <small class="text-muted">Categoría: ${tarea.extendedProps.categoria}</small>
        `;
        historialElement.appendChild(li);
    });
}

function mostrarEstadisticas() {
    const tareas = cargarTareas();
    const totalTareas = tareas.length;
    const tareasCompletadas = tareas.filter(t => t.extendedProps.completed).length;
    const tareasPendientes = totalTareas - tareasCompletadas;
    
    const prioridadCount = tareas.reduce((acc, tarea) => {
        const prioridad = tarea.extendedProps.prioridad;
        acc[prioridad] = (acc[prioridad] || 0) + 1;
        return acc;
    }, {});

    Swal.fire({
        title: 'Estadísticas',
        html: `
            <div class="text-start">
                <p>Total de tareas: ${totalTareas}</p>
                <p>Tareas completadas: ${tareasCompletadas}</p>
                <p>Tareas pendientes: ${tareasPendientes}</p>
                <hr>
                <p>Por prioridad:</p>
                <p>Alta: ${prioridadCount['Alta'] || 0}</p>
                <p>Media: ${prioridadCount['Media'] || 0}</p>
                <p>Baja: ${prioridadCount['Baja'] || 0}</p>
            </div>
        `,
        icon: 'info'
    });
}

function toggleFiltros() {
    const filtersDiv = document.getElementById('filters');
    filtersDiv.style.display = filtersDiv.style.display === 'none' ? 'block' : 'none';
}

function toggleModoOscuro() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
}

function aplicarModoGuardado() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
}

function mostrarDetallesTarea(info) {
    const tarea = info.event;
    Swal.fire({
        title: tarea.title,
        html: `
            <p>Fecha: ${new Date(tarea.start).toLocaleDateString()}</p>
            <p>Prioridad: ${tarea.extendedProps.prioridad}</p>
            <p>Categoría: ${tarea.extendedProps.categoria}</p>
            <p>Estado: ${tarea.extendedProps.completed ? 'Completada' : 'Pendiente'}</p>
        `,
        icon: 'info'
    });
}

function editarTarea(tareaId) {
    const tareas = cargarTareas();
    const tarea = tareas.find(t => t.id === tareaId);

    if (tarea) {
        document.getElementById('editarTareaId').value = tarea.id;
        document.getElementById('editarTareaInput').value = tarea.title;
        document.getElementById('editarFechaInput').value = tarea.start;
        document.getElementById('editarPrioridadInput').value = tarea.extendedProps.prioridad;
        document.getElementById('editarCategoriaInput').value = tarea.extendedProps.categoria;

        const editarTareaModal = new bootstrap.Modal(document.getElementById('editarTareaModal'));
        editarTareaModal.show();
    }
}
function guardarTareaEditada() {
    const tareaId = document.getElementById('editarTareaId').value;
    const tareas = cargarTareas();
    const tareaIndex = tareas.findIndex(t => t.id === tareaId);

    if (tareaIndex !== -1) {
        tareas[tareaIndex].title = document.getElementById('editarTareaInput').value;
        tareas[tareaIndex].start = document.getElementById('editarFechaInput').value;
        tareas[tareaIndex].extendedProps.prioridad = document.getElementById('editarPrioridadInput').value;
        tareas[tareaIndex].extendedProps.categoria = document.getElementById('editarCategoriaInput').value;

        localStorage.setItem('tareas', JSON.stringify(tareas));

        if (calendar) {
            const evento = calendar.getEventById(tareaId);
            if (evento) {
                evento.remove();
            }
            calendar.addEvent(tareas[tareaIndex]);
        }

        actualizarListaTareas();

        const editarTareaModal = bootstrap.Modal.getInstance(document.getElementById('editarTareaModal'));
        editarTareaModal.hide();
    }
}
