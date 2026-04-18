package com.gigspot.event.controller;
import com.gigspot.event.model.Booking;
import com.gigspot.event.model.Event;
import com.gigspot.event.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/events") @RequiredArgsConstructor @CrossOrigin(origins = "*")
public class EventController {
    private final EventService eventService;

    @GetMapping("/health")
    public ResponseEntity<Map<String,String>> health() {
        return ResponseEntity.ok(Map.of("status","UP","service","gigspot-event-service"));
    }

    @GetMapping
    public ResponseEntity<List<Event>> getAll() {
        return ResponseEntity.ok(eventService.getAllEvents());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOne(@PathVariable Long id) {
        return eventService.getEvent(id).map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/book")
    public ResponseEntity<Map<String,Object>> book(@PathVariable Long id,
                                                    @RequestBody Map<String, Integer> body,
                                                    Authentication auth) {
        int qty = body.getOrDefault("quantity", 1);
        return ResponseEntity.ok(eventService.book(id, auth.getName(), qty));
    }

    @GetMapping("/bookings/me")
    public ResponseEntity<List<Booking>> myBookings(Authentication auth) {
        return ResponseEntity.ok(eventService.getUserBookings(auth.getName()));
    }

    @DeleteMapping("/bookings/{bookingId}")
    public ResponseEntity<Map<String,Object>> cancel(@PathVariable Long bookingId, Authentication auth) {
        return ResponseEntity.ok(eventService.cancel(bookingId, auth.getName()));
    }
}
