package com.tpi.adminproductos.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Producto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String sku; // Código único
    private String nombre;
    private Double precio;
    private Integer stock;
    private String urlImagen;
}