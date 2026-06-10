const STORAGE_KEY = 'productos_body_painting';
const botonActualizar = document.querySelector(".btn-claro");

botonActualizar.addEventListener("click", () => {
    alert("Datos cargados en servidor");
});

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

    document.getElementById('btnBuscar').addEventListener('click', buscarProducto);
    document.getElementById('btnActualizar').addEventListener('click', actualizarProducto);
    document.getElementById('btnDescargarGeneral').addEventListener('click', descargarArchivo);
});

function obtenerProductos() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function guardarProductos(productos) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(productos));
    renderizarTabla();
}

// LÓGICA DE DRAG & DROP
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        dropZone.querySelector('p').innerHTML = `✅ Archivo cargado: <br><strong>${e.dataTransfer.files[0].name}</strong>`;
    }
});

fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
        dropZone.querySelector('p').innerHTML = `✅ Archivo seleccionado: <br><strong>${fileInput.files[0].name}</strong>`;
    }
});

// PROCESAR ARCHIVOS
function procesarArchivo() {
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
            mensaje.innerHTML = "<span style='color:red;'>Formato no soportado.</span>";
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
                productosExistentes[index].precio = nuevoProducto.precio;
                productosExistentes[index].stock = nuevoProducto.stock;
            } else {
                productosExistentes.push(nuevoProducto);
            }
            importados++;
        }
    });

    guardarProductos(productosExistentes);
    document.getElementById('mensajeEstado').innerHTML = `<strong style='color:green;'>${importados} productos procesados.</strong>`;
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
            productosExistentes[index].precio = nuevoProducto.precio;
            productosExistentes[index].stock = nuevoProducto.stock;
        } else {
            productosExistentes.push(nuevoProducto);
        }
        importados++;
    }

    guardarProductos(productosExistentes);
    document.getElementById('mensajeEstado').innerHTML = `<strong style='color:green;'>${importados} productos procesados.</strong>`;
}

// BUSCAR Y ACTUALIZAR
function buscarProducto() {
    const valor = document.getElementById('busquedaProducto').value.trim().toLowerCase();
    const resultado = document.getElementById('resultadoBusqueda');
    const mensaje = document.getElementById('mensajeBusqueda');

    if (valor === "") {
        resultado.style.display = 'none';
        mensaje.innerHTML = "<span style='color:red;'>Ingresá un código o nombre.</span>";
        return;
    }

    const productos = obtenerProductos();
    const producto = productos.find(p => {
        let sku = String(p.sku).trim().toLowerCase().replace("sku", "").replace(/^0+/, "");
        let valorBuscado = valor.replace("sku", "").replace(/^0+/, "");
        const nombre = String(p.nombre).trim().toLowerCase();
        return sku === valorBuscado || nombre.includes(valorBuscado);
    });

    if (!producto) {
        resultado.style.display = 'none';
        mensaje.innerHTML = "<span style='color:red;'>Producto no encontrado.</span>";
        return;
    }

    resultado.style.display = 'block';
    document.getElementById('editSku').textContent = producto.sku;
    document.getElementById('editNombre').textContent = producto.nombre;
    document.getElementById('nuevoPrecio').value = producto.precio;
    document.getElementById('nuevoStock').value = producto.stock;
    mensaje.innerHTML = "<span style='color:green;'>Producto encontrado.</span>";
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
    document.getElementById('mensajeBusqueda').innerHTML = "<span style='color:green;'>Producto actualizado.</span>";
}

// DESCARGAR Y LIMPIAR
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

function limpiarStorage() {
    if (confirm("¿Seguro querés borrar todos los productos?")) {
        localStorage.removeItem(STORAGE_KEY);
        renderizarTabla();
        document.getElementById('mensajeEstado').innerText = "";
    }
}

// RENDERIZAR TABLA Y SUBIDA DE IMÁGENES
function renderizarTabla() {
    const productos = obtenerProductos();
    const tbody = document.getElementById('tablaProductos');

    tbody.innerHTML = "";

    if (productos.length === 0) {
        tbody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>No hay productos cargados.</td></tr>";
        return;
    }

    productos.forEach(p => {
        const faltaImagen = !p.urlImagen || p.urlImagen === "";
        const stockBajo = p.stock <= 3;

        let contenidoImagen = '<span class="badge badge-warning">Pendiente</span>';
        if (!faltaImagen) {
            contenidoImagen = `<img src="${p.urlImagen}" alt="${p.nombre}" class="img-thumbnail">`;
        }

        let stockBadge = `<span class="badge badge-success">${p.stock} unid.</span>`;
        if (stockBajo) {
            stockBadge = `<span class="badge badge-danger">🔺 ${p.stock} unid.</span>`;
        }

        const fila = document.createElement('tr');

        fila.innerHTML = `
            <td><strong>${p.sku}</strong></td>
            <td>${p.nombre}</td>
            <td>$${p.precio.toFixed(2)}</td>
            <td>${stockBadge}</td>
            <td>${contenidoImagen}</td>
            <td>
                <button class="btn btn-subir-img" data-sku="${p.sku}" data-nombre="${p.nombre}" style="font-size: 0.75rem; padding: 4px 8px; margin-bottom: 4px; display: block; width: 100%;">📸 Cargar</button>
                ${p.urlImagen ? `<button class="btn btn-danger btn-eliminar-img" data-sku="${p.sku}" style="font-size: 0.75rem; padding: 4px 8px; display: block; width: 100%;">🗑️ Eliminar</button>` : ''}
            </td>
        `;

        tbody.appendChild(fila);
    });

    document.querySelectorAll('.btn-subir-img').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const sku = e.currentTarget.getAttribute('data-sku');
            const nombre = e.currentTarget.getAttribute('data-nombre');
            abrirMenuImagen(sku, nombre);
        });
    });

    document.querySelectorAll('.btn-eliminar-img').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const sku = e.currentTarget.getAttribute('data-sku');
            if(confirm("¿Seguro que querés eliminar la imagen de este producto?")) {
               eliminarImagenPorSku(sku);
            }
        });
    });
}

// LÓGICA DE IMAGEN OCULTA
let skuActualParaImagen = null;

function abrirMenuImagen(sku, nombre) {
    if (confirm(`¿Querés cargar una nueva imagen para el producto: ${nombre}?`)) {
        skuActualParaImagen = sku;
        document.getElementById('fileImagenOculto').click();
    }
}

document.getElementById('fileImagenOculto').addEventListener('change', function(event) {
    const fileInput = event.target;
    if (fileInput.files.length === 0 || !skuActualParaImagen) return;

    const archivo = fileInput.files[0];
    const tiposPermitidos = ['image/jpeg', 'image/png'];

    if (!tiposPermitidos.includes(archivo.type)) {
        alert("Solo se permiten archivos JPG o PNG.");
        fileInput.value = '';
        return;
    }

    const productos = obtenerProductos();
    const index = productos.findIndex(p => compararSku(p.sku, skuActualParaImagen));

    if (index !== -1) {
        const lector = new FileReader();
        lector.onload = function(e) {
            productos[index].urlImagen = e.target.result;
            guardarProductos(productos);
        };
        lector.readAsDataURL(archivo);
    }

    fileInput.value = '';
    skuActualParaImagen = null;
});

function eliminarImagenPorSku(sku) {
    const productos = obtenerProductos();
    const index = productos.findIndex(p => compararSku(p.sku, sku));

    if (index !== -1) {
        productos[index].urlImagen = "";
        guardarProductos(productos);
    }


}