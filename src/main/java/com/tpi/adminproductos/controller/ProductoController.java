package com.tpi.adminproductos.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.tpi.adminproductos.model.Producto;
import com.tpi.adminproductos.repository.ProductoRepository;

@RestController
@RequestMapping("/productos")
public class ProductoController {

    private final ProductoRepository repo;

    // Carpeta física donde se guardarán las imágenes localmente
    private static final String UPLOAD_DIR = "uploads/images/";

    public ProductoController(ProductoRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Producto> getAll() {
        return repo.findAll();
    }

    @PostMapping
    public Producto create(@RequestBody Producto p) {
        return repo.save(p);
    }

    // ==========================================
    // MÓDULO DE IMÁGENES (TUS TAREAS DE JIRA)
    // ==========================================
    
    @PostMapping("/{sku}/imagen")
    public ResponseEntity<?> subirImagen(@PathVariable String sku, @RequestParam("file") MultipartFile file) {
        
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png"))) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error: Solo se permiten archivos en formato JPG o PNG.");
        }

        Optional<Producto> productoOpt = repo.findBySku(sku);
        if (productoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Error: No se encontró ningún producto con el SKU: " + sku);
        }

        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath); 
            }

            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);
            
            Files.copy(file.getInputStream(), filePath);

            Producto producto = productoOpt.get();
            String urlAcceso = "/uploads/images/" + fileName;
            producto.setUrlImagen(urlAcceso);
            
            repo.save(producto);

            return ResponseEntity.ok("Imagen subida y vinculada correctamente al producto " + sku);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error interno al procesar la imagen: " + e.getMessage());
        }
    }
}