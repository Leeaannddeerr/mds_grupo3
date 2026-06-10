const STORAGE_KEY = 'productos_body_painting';

function normalizarSku(valor) {
    return String(valor)
        .trim()
        .toLowerCase()
        .replace("sku", "")
        .replace(/^0+/, "");
}

function compararSku(a, b) {
    return normalizarSku(a) === normalizarSku(b);
}

document.addEventListener("DOMContentLoaded", () => {

    renderizarTabla();

    document.getElementById('btnProcesar').addEventListener('click', procesarArchivo);
    document.getElementById('btnRefrescar').addEventListener('click', renderizarTabla);
    document.getElementById('btnLimpiar').addEventListener('click', limpiarStorage);

    document.getElementById('btnSubirImagen').addEventListener('click', procesarSubidaImagen);

    document.getElementById('btnBuscar').addEventListener('click', buscarProducto);
    document.getElementById('btnActualizar').addEventListener('click', actualizarProducto);
    document.getElementById('btnDescargar').addEventListener('click', descargarArchivo);
    document.getElementById('btnEliminarImagen')
    .addEventListener('click', eliminarImagenProducto);
});

function obtenerProductos() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function guardarProductos(productos) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(productos));
    renderizarTabla();
}

function procesarArchivo() {
    const fileInput = document.getElementById('fileInput');
    const mensaje = document.getElementById('mensajeEstado');

    if (fileInput.files.length === 0) {
        mensaje.innerHTML = "<span style='color:red;'>Seleccioná un archivo.</span>";
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
            mensaje.innerHTML = "<span style='color:red;'>Formato no soportado.Formatos aceptados: CSV y/ XML.</span>";
        }
    };

    lector.readAsText(archivo);
}

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
                precio: parseFloat(columnas[2].trim()) || 0,
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

    document.getElementById('mensajeEstado').innerHTML =
        `<strong style='color:green;'>${importados} productos procesados.</strong>`;
}

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
            precio: precios[i] ? parseFloat(precios[i].textContent.trim()) : 0,
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

    document.getElementById('mensajeEstado').innerHTML =
        `<strong style='color:green;'>${importados} productos procesados.</strong>`;
}

function buscarProducto() {

    const valor = document.getElementById('busquedaProducto')
        .value
        .trim()
        .toLowerCase();

    const resultado = document.getElementById('resultadoBusqueda');
    const mensaje = document.getElementById('mensajeBusqueda');

    if (valor === "") {

        resultado.style.display = 'none';

        mensaje.innerHTML =
            "<span style='color:red;'>Ingresá un código o nombre.</span>";

        return;
    }

    const productos = obtenerProductos();

    const producto = productos.find(p => {

        let sku = String(p.sku)
            .trim()
            .toLowerCase();

        // elimina "sku"
        sku = sku.replace("sku", "");

        // elimina ceros adelante
        sku = sku.replace(/^0+/, "");

        let valorBuscado = valor
            .replace("sku", "")
            .replace(/^0+/, "");

        const nombre = String(p.nombre)
            .trim()
            .toLowerCase();

        return sku === valorBuscado || nombre.includes(valorBuscado);
    });

    if (!producto) {

        resultado.style.display = 'none';

        mensaje.innerHTML =
            "<span style='color:red;'>Producto no encontrado.</span>";

        return;
    }

    resultado.style.display = 'block';

    document.getElementById('editSku').textContent = producto.sku;
    document.getElementById('editNombre').textContent = producto.nombre;
    document.getElementById('nuevoPrecio').value = producto.precio;
    document.getElementById('nuevoStock').value = producto.stock;

    mensaje.innerHTML =
        "<span style='color:green;'>Producto encontrado.</span>";
}

function actualizarProducto() {

    const skuEdit = document.getElementById('editSku').textContent;

    if (!skuEdit) return;

    const nuevoPrecio = parseFloat(document.getElementById('nuevoPrecio').value);
    const nuevoStock = parseInt(document.getElementById('nuevoStock').value);

    const productos = obtenerProductos();

    const index = productos.findIndex(p => compararSku(p.sku, skuEdit));

    if (index === -1) return;

    productos[index].precio = nuevoPrecio;
    productos[index].stock = nuevoStock;

    guardarProductos(productos);

    document.getElementById('mensajeBusqueda').innerHTML =
        "<span style='color:green;'>Producto actualizado en vivo.</span>";
}

function descargarArchivo() {

    const productos = obtenerProductos();

    const contenido = JSON.stringify(productos, null, 2);

    const blob = new Blob([contenido], { type: 'application/json' });

    const url = URL.createObjectURL(blob);

    const enlace = document.createElement('a');

    enlace.href = url;
    enlace.download = 'productos_actualizados.json';

    enlace.click();

    URL.revokeObjectURL(url);
}

function procesarSubidaImagen() {

    const skuInput = document.getElementById('skuImagen').value.trim();
    const fileInput = document.getElementById('fileImagen');
    const mensaje = document.getElementById('mensajeImagen');

    if (!skuInput) {
        mensaje.innerHTML = "<span style='color:red;'>Ingresá un SKU.</span>";
        return;
    }

    if (fileInput.files.length === 0) {
        mensaje.innerHTML = "<span style='color:red;'>Seleccioná una imagen.</span>";
        return;
    }

    const archivo = fileInput.files[0];

    const tiposPermitidos = ['image/jpeg', 'image/png'];

    if (!tiposPermitidos.includes(archivo.type)) {
        mensaje.innerHTML = "<span style='color:red;'>Solo JPG o PNG.</span>";
        return;
    }

    const productos = obtenerProductos();

    const index = productos.findIndex(p => compararSku(p.sku, skuInput));

    if (index === -1) {
        mensaje.innerHTML = "<span style='color:red;'>Producto no encontrado.</span>";
        return;
    }

    const lector = new FileReader();

    lector.onload = function(e) {

        productos[index].urlImagen = e.target.result;

        guardarProductos(productos);

        mensaje.innerHTML =
            "<span style='color:green;'>Imagen asociada correctamente.</span>";

        document.getElementById('skuImagen').value = '';
        fileInput.value = '';
    };

    lector.readAsDataURL(archivo);
}

function eliminarImagenProducto() {

    const skuInput = document.getElementById('skuImagen').value.trim();
    const mensaje = document.getElementById('mensajeImagen');

    if (!skuInput) {
        mensaje.innerHTML = "<span style='color:red;'>Ingresá un SKU.</span>";
        return;
    }

    const productos = obtenerProductos();

    const index = productos.findIndex(p => compararSku(p.sku, skuInput));

    if (index === -1) {
        mensaje.innerHTML = "<span style='color:red;'>Producto no encontrado.</span>";
        return;
    }

    productos[index].urlImagen = "";

    guardarProductos(productos);

    mensaje.innerHTML =
        "<span style='color:green;'>Imagen eliminada correctamente.</span>";
}

function renderizarTabla() {

    const productos = obtenerProductos();
    const tbody = document.getElementById('tablaProductos');

    tbody.innerHTML = "";

    if (productos.length === 0) {

        tbody.innerHTML =
            "<tr><td colspan='5' style='text-align:center;'>No hay productos cargados.</td></tr>";

        return;
    }

    productos.forEach(p => {

        let contenidoImagen = "<em>Pendiente</em>";

        if (p.urlImagen && p.urlImagen !== "") {
            contenidoImagen =
                `<img src="${p.urlImagen}" alt="${p.nombre}" class="img-thumbnail">`;
        }

        const fila = document.createElement('tr');

        fila.innerHTML = `
            <td style="padding:10px; border-bottom:1px solid #eee;"><strong>${p.sku}</strong></td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${p.nombre}</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">$${p.precio.toFixed(2)}</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${p.stock}</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${contenidoImagen}</td>
        `;

        tbody.appendChild(fila);
    });
}

function limpiarStorage() {

    if (confirm("¿Seguro querés borrar todos los productos?")) {

        localStorage.removeItem(STORAGE_KEY);

        renderizarTabla();

        document.getElementById('mensajeEstado').innerText = "";
        document.getElementById('mensajeImagen').innerText =
            "LocalStorage vaciado.";
    }
}