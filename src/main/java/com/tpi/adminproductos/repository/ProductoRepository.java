package com.tpi.adminproductos.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tpi.adminproductos.model.Producto;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {
    
    // Método personalizado para buscar por el código único
    Optional<Producto> findBySku(String sku);
}