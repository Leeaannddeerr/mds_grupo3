Documentacion preliminar del Grupo 3

1. Definición del Modelo de Producto:
Todos los módulos deben trabajar sobre esta estructura estricta en la entidad Producto:
- sku (String): Código único.
- nombre (String).
- precio (Double).
- stock (Integer).
- urlImagen (String).

2. Formato de Importación (CSV y XML):
El sistema permite importar productos masivamente utilizando dos formatos:
- CSV: Archivo plano sin encabezados, separados por coma (sku,nombre,precio,stock).
- XML: Formato jerárquico estructurado siguiendo este esquema:
  <productos>
    <producto>
      <sku>CODIGO</sku>
      <nombre>NOMBRE</nombre>
      <precio>0.00</precio>
      <stock>0</stock>
    </producto>
  </productos>

3. Stack Tecnológico:
- Backend: Spring Boot + H2 (En primeras versiones del sistema,luego se persistira en SQL).
- Frontend: HTML5, JS y React.
- API: REST.
  
4. Workflow de Integración y Calidad:
 - De caracter obligatorio:Ningún Pull Request se aprueba a main sin haber sido revisado por al menos otro integrante.
 - Prueba cruzada: Antes de fusionar, el desarrollador debe verificar que su endpoint funcione con la base de datos común       (H2).
   
5. Responsabilidades:

| Integrante | Rol | User Story |
| :--- | :--- | :--- |
| Santiago Meynet | Backend | (Importar CSV/XML) |
| Franco Romero | Backend |  (Actualizar Productos) |
| Leandro Delgado | Backend |  (Cargar Imágenes) |
| Victoria Peretti | Frontend |  (Front-Panel Administrador) |
