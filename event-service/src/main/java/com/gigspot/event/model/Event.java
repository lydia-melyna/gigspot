package com.gigspot.event.model;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity @Table(name = "events") @Data @NoArgsConstructor
public class Event {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String artist;
    private String title;
    private String venue;
    private String city;
    private String date;       // "2025-07-12"
    private String time;       // "21:00"
    private String genre;      // ROCK, POP, HIPHOP, ELECTRO, JAZZ
    private String imageUrl;   // emoji ou URL
    private double price;
    private int totalSeats;
    private int availableSeats;
}
