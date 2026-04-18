package com.gigspot.event.model;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity @Table(name = "bookings") @Data @NoArgsConstructor
public class Booking {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long eventId;
    private String username;
    private int quantity;
    private double totalPrice;
    private String status = "CONFIRMED"; // CONFIRMED, CANCELLED
    private LocalDateTime bookedAt = LocalDateTime.now();
    private String bookingRef; // ex: GIG-2025-00042
}
