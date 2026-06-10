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
    
    // Escuchador para el botón de Leandro
    document.getElementById('btnSubirImagen').addEventListener('click', procesarSubidaImagen);
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

// CONTROLADOR PRINCIPAL DE ARCHIVOS (Santiago)
function procesarArchivo() {
    const fileInput = document.getElementById('fileInput');
    const mensaje = document.getElementById('mensajeEstado');
    
    if (fileInput.files.length === 0) {
        mensaje.innerHTML = "<span class='error' style='color:red;'>Por favor, seleccioná un archivo primero.</span>";
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
            mensaje.innerHTML = "<span class='error' style='color:red;'>Formato no soportado.</span>";
        }
    };

    lector.readAsText(archivo);
}

// PROCESAR FORMATO CSV
function leerCSV(texto) {
    const lineas = texto.split(/\r?\n/);
    const productosExistentes = obtenerProductos();
    let importados = 0;

    lineas.forEach(linea => {
        if (linea.trim() === "") return; 
        
        const columnas = linea.split(',');
        
        if (columnas.length >= 4) {
            const nuevoProducto = {
                sku: columnas[0].trim(),
                nombre: columnas[1].trim(),
                precio: parseFloat(columnas[2].trim()) || 0.0,
                stock: parseInt(columnas[3].trim()) || 0,
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
    });

    guardarProductos(productosExistentes);
    document.getElementById('mensajeEstado').innerHTML = `<strong style='color:green;'>Éxito:</strong> Se procesaron ${importados} productos desde el CSV.`;
}

// PROCESAR FORMATO XML
function leerXML(texto) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(texto, "text/xml");
    
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
    document.getElementById('mensajeEstado').innerHTML = `<strong style='color:green;'>Éxito:</strong> Se procesaron ${importados} productos desde el XML.`;
}

// ==========================================
// MÓDULO DE LEANDRO - CARGA DE IMÁGENES
// ==========================================
function procesarSubidaImagen() {
    const skuInput = document.getElementById('skuImagen').value.trim();
    const fileInput = document.getElementById('fileImagen');
    const mensaje = document.getElementById('mensajeImagen');

    // Validar que ingresó un SKU
    if (!skuInput) {
        mensaje.innerHTML = "<span style='color:red;'>Debes ingresar el SKU del producto.</span>";
        return;
    }

    // Validar que seleccionó un archivo
    if (fileInput.files.length === 0) {
        mensaje.innerHTML = "<span style='color:red;'>Debes seleccionar una imagen.</span>";
        return;
    }

    const archivo = fileInput.files[0];

    // TAREA SCRUM-37: Permitir solo archivos JPG y PNG
    const tiposPermitidos = ['image/jpeg', 'image/png'];
    if (!tiposPermitidos.includes(archivo.type)) {
        mensaje.innerHTML = "<span style='color:red;'>Error: Solo se permiten archivos en formato JPG o PNG.</span>";
        return;
    }

    // Buscar el producto en la base simulada (LocalStorage)
    const productos = obtenerProductos();
    const index = productos.findIndex(p => p.sku === skuInput);

    if (index === -1) {
        mensaje.innerHTML = `<span style='color:red;'>Error: No se encontró ningún producto con el SKU "${skuInput}".</span>`;
        return;
    }

    // TAREA SCRUM-38 & SCRUM-39: Guardar localmente y asociar
    // Leemos la imagen como DataURL (Base64) para simular el almacenamiento local
    const lector = new FileReader();
    lector.onload = function(e) {
        const base64Imagen = e.target.result;
        
        // Asociamos la imagen al producto
        productos[index].urlImagen = base64Imagen;
        
        // Guardamos los cambios
        guardarProductos(productos);

        // TAREA SCRUM-40: Feedback de prueba exitosa
        mensaje.innerHTML = `<strong style='color:green;'>Éxito:</strong> Imagen vinculada correctamente al producto ${skuInput}.`;
        
        // Limpiamos los inputs
        document.getElementById('skuImagen').value = '';
        fileInput.value = '';
    };

    lector.readAsDataURL(archivo);
}
// ==========================================


// MOSTRAR EN TABLA HTML
function renderizarTabla() {
    const productos = obtenerProductos();
    const tbody = document.getElementById('tablaProductos');
    tbody.innerHTML = "";

    if (productos.length === 0) {
        tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; padding-top: 10px;'>No hay productos cargados.</td></tr>";
        return;
    }

    productos.forEach(p => {
        // Verificar si hay imagen para mostrar o texto por defecto
        let contenidoImagen = `<em>Pendiente</em>`;
        if (p.urlImagen && p.urlImagen !== "") {
            contenidoImagen = `<img src="${p.urlImagen}" alt="${p.nombre}" class="img-thumbnail">`;
        }

        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>${p.sku}</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${p.nombre}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">$${p.precio.toFixed(2)}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${p.stock}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${contenidoImagen}</td>
        `;
        tbody.appendChild(fila);
    });
}

// LIMPIAR LOCALSTORAGE (Para fase de pruebas)
function limpiarStorage() {
    if (confirm("¿Seguro querés borrar todos los productos del localStorage?")) {
        localStorage.removeItem(STORAGE_KEY);
        renderizarTabla();
        document.getElementById('mensajeEstado').innerText = "";
        document.getElementById('mensajeImagen').innerText = "LocalStorage vaciado con éxito.";
    }
}