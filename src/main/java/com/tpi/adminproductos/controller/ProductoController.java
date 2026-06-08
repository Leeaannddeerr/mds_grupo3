package com.tpi.adminproductos.controller;

import com.tpi.adminproductos.model.Producto;
import com.tpi.adminproductos.repository.ProductoRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/productos")
public class ProductoController {

    private final ProductoRepository repo;

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
}