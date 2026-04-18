package com.gigspot.event.service;
import com.gigspot.event.model.Booking;
import com.gigspot.event.model.Event;
import com.gigspot.event.repository.BookingRepository;
import com.gigspot.event.repository.EventRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.*;

@Service @RequiredArgsConstructor
public class EventService {
    private final EventRepository eventRepo;
    private final BookingRepository bookingRepo;

    @PostConstruct
    public void initData() {
        if (eventRepo.count() > 0) return;
        List<Event> events = List.of(
            event("Daft Punk Revival", "Daft Punk Tribute", "Accor Arena", "Paris", "2025-06-14", "21:00", "ELECTRO", "🤖", 45.0, 5000),
            event("Rosalía World Tour", "Rosalía", "Zénith Paris", "Paris", "2025-07-02", "20:30", "POP", "🌹", 65.0, 3000),
            event("Kendrick Lamar", "Kendrick Lamar", "Stade de France", "Paris", "2025-07-19", "19:00", "HIPHOP", "🎤", 89.0, 20000),
            event("Arctic Monkeys", "Arctic Monkeys", "Olympia", "Paris", "2025-08-05", "21:00", "ROCK", "🎸", 55.0, 2000),
            event("Miles Davis Tribute", "Jazz Ensemble", "Jazz Club Duc des Lombards", "Paris", "2025-06-28", "22:00", "JAZZ", "🎷", 30.0, 200),
            event("Disclosure Live", "Disclosure", "Bataclan", "Paris", "2025-09-12", "22:00", "ELECTRO", "🎧", 40.0, 1500),
            event("Billie Eilish", "Billie Eilish", "Halle Tony Garnier", "Lyon", "2025-07-08", "20:00", "POP", "🖤", 70.0, 8000),
            event("Stromae Racine Carrée", "Stromae", "Vélodrome", "Marseille", "2025-08-22", "20:30", "POP", "🇧🇪", 60.0, 10000)
        );
        eventRepo.saveAll(events);
    }

    private Event event(String title, String artist, String venue, String city,
                        String date, String time, String genre, String img, double price, int seats) {
        Event e = new Event();
        e.setTitle(title); e.setArtist(artist); e.setVenue(venue); e.setCity(city);
        e.setDate(date); e.setTime(time); e.setGenre(genre); e.setImageUrl(img);
        e.setPrice(price); e.setTotalSeats(seats); e.setAvailableSeats(seats);
        return e;
    }

    public List<Event> getAllEvents() { return eventRepo.findAll(); }
    public Optional<Event> getEvent(Long id) { return eventRepo.findById(id); }

    public Map<String, Object> book(Long eventId, String username, int quantity) {
        Map<String, Object> r = new HashMap<>();
        Event ev = eventRepo.findById(eventId).orElse(null);
        if (ev == null) { r.put("success", false); r.put("message", "Événement introuvable"); return r; }
        if (ev.getAvailableSeats() < quantity) { r.put("success", false); r.put("message", "Places insuffisantes"); return r; }

        ev.setAvailableSeats(ev.getAvailableSeats() - quantity);
        eventRepo.save(ev);

        Booking b = new Booking();
        b.setEventId(eventId); b.setUsername(username); b.setQuantity(quantity);
        b.setTotalPrice(quantity * ev.getPrice());
        b.setBookingRef("GIG-" + System.currentTimeMillis() % 100000);
        bookingRepo.save(b);

        r.put("success", true); r.put("booking", b); r.put("event", ev);
        r.put("message", "Réservation confirmée !");
        return r;
    }

    public Map<String, Object> cancel(Long bookingId, String username) {
        Map<String, Object> r = new HashMap<>();
        Booking b = bookingRepo.findById(bookingId).orElse(null);
        if (b == null || !b.getUsername().equals(username)) {
            r.put("success", false); r.put("message", "Réservation introuvable"); return r;
        }
        b.setStatus("CANCELLED");
        bookingRepo.save(b);
        // Restore seats
        eventRepo.findById(b.getEventId()).ifPresent(ev -> {
            ev.setAvailableSeats(ev.getAvailableSeats() + b.getQuantity());
            eventRepo.save(ev);
        });
        r.put("success", true); r.put("message", "Réservation annulée");
        return r;
    }

    public List<Booking> getUserBookings(String username) { return bookingRepo.findByUsername(username); }
}
