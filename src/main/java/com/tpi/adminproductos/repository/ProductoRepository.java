package com.tpi.adminproductos.repository;

import com.tpi.adminproductos.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {
    // Aquí puedes agregar métodos personalizados como:
    // Producto findBySku(String sku);
}