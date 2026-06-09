// Clave para el localStorage compartida con el grupo
const STORAGE_KEY = 'productos_body_painting';

// ASIGNACIÓN DE EVENTOS CUANDO EL DOM ESTÉ LISTO
document.addEventListener("DOMContentLoaded", () => {
    // Renderizar la tabla inicialmente con lo que haya guardado
    renderizarTabla();

    // Escuchadores de eventos para los botones
    document.getElementById('btnProcesar').addEventListener('click', procesarArchivo);
    document.getElementById('btnRefrescar').addEventListener('click', renderizarTabla);
    document.getElementById('btnLimpiar').addEventListener('click', limpiarStorage);
});

// OBTENER PRODUCTOS DESDE LOCALSTORAGE
function obtenerProductos() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// GUARDAR PRODUCTOS EN LOCALSTORAGE Y REFRESCAR VISTA
function guardarProductos(productos) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(productos));
    renderizarTabla();
}

// CONTROLADOR PRINCIPAL DE ARCHIVOS
function procesarArchivo() {
    const fileInput = document.getElementById('fileInput');
    const mensaje = document.getElementById('mensajeEstado');
    
    if (fileInput.files.length === 0) {
        mensaje.innerHTML = "<span class='error'>Por favor, seleccioná un archivo primero.</span>";
        return;
    }

    const archivo = fileInput.files[0];
    const lector = new FileReader();

    lector.onload = function(e) {
        const contenido = e.target.result;
        
        if (archivo.name.endsWith('.csv')) {
            leerCSV(contenido);
        } else if (archivo.name.endsWith('.xml')) {
            leerXML(contenido);
        } else {
            mensaje.innerHTML = "<span class='error'>Formato no soportado.</span>";
        }
    };

    lector.readAsText(archivo);
}

// PROCESAR FORMATO CSV (Sin encabezado: sku,nombre,precio,stock)
function leerCSV(texto) {
    const lineas = texto.split(/\r?\n/);
    const productosExistentes = obtenerProductos();
    let importados = 0;

    lineas.forEach(linea => {
        if (linea.trim() === "") return; // Ignorar líneas vacías
        
        const columnas = linea.split(',');
        
        if (columnas.length >= 4) {
            const nuevoProducto = {
                sku: columnas[0].trim(),
                nombre: columnas[1].trim(),
                precio: parseFloat(columnas[2].trim()) || 0.0,
                stock: parseInt(columnas[3].trim()) || 0,
                urlImagen: "" // Espacio para que Leandro cargue imágenes después
            };

            // Evitar duplicados por SKU (si ya existe, lo actualiza)
            const index = productosExistentes.findIndex(p => p.sku === nuevoProducto.sku);
            if (index !== -1) {
                productosExistentes[index] = nuevoProducto; 
            } else {
                productosExistentes.push(nuevoProducto); 
            }
            importados++;
        }
    });

    guardarProductos(productosExistentes);
    document.getElementById('mensajeEstado').innerHTML = `<strong>Éxito:</strong> Se procesaron ${importados} productos desde el CSV.`;
}

// PROCESAR FORMATO XML (Estructura estricta)
function leerXML(texto) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(texto, "text/xml");
    
    // Nodos según la documentación preliminar
    const codigos = xmlDoc.getElementsByTagName("CODIGO");
    const nombres = xmlDoc.getElementsByTagName("NOMBRE");
    const precios = xmlDoc.getElementsByTagName("PRECIO");
    const stocks = xmlDoc.getElementsByTagName("STOCK");

    const productosExistentes = obtenerProductos();
    let importados = 0;

    for (let i = 0; i < codigos.length; i++) {
        const nuevoProducto = {
            sku: codigos[i].textContent.trim(),
            nombre: nombres[i] ? nombres[i].textContent.trim() : "Sin Nombre",
            precio: precios[i] ? parseFloat(precios[i].textContent.trim()) : 0.0,
            stock: stocks[i] ? parseInt(stocks[i].textContent.trim()) : 0,
            urlImagen: "" 
        };

        const index = productosExistentes.findIndex(p => p.sku === nuevoProducto.sku);
        if (index !== -1) {
            productosExistentes[index] = nuevoProducto;
        } else {
            productosExistentes.push(nuevoProducto);
        }
        importados++;
    }

    guardarProductos(productosExistentes);
    document.getElementById('mensajeEstado').innerHTML = `<strong>Éxito:</strong> Se procesaron ${importados} productos desde el XML.`;
}

// MOSTRAR EN TABLA HTML
function renderizarTabla() {
    const productos = obtenerProductos();
    const tbody = document.getElementById('tablaProductos');
    tbody.innerHTML = "";

    if (productos.length === 0) {
        tbody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>No hay productos cargados.</td></tr>";
        return;
    }

    productos.forEach(p => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><strong>${p.sku}</strong></td>
            <td>${p.nombre}</td>
            <td>$${p.precio.toFixed(2)}</td>
            <td>${p.stock}</td>
            <td><em>${p.urlImagen || 'Pendiente por Leandro'}</em></td>
        `;
        tbody.appendChild(fila);
    });
}

// LIMPIAR LOCALSTORAGE (Para fase de pruebas)
function limpiarStorage() {
    if (confirm("¿Seguro querés borrar todos los productos del localStorage?")) {
        localStorage.removeItem(STORAGE_KEY);
        renderizarTabla();
        document.getElementById('mensajeEstado').innerText = "LocalStorage vaciado con éxito.";
    }
}