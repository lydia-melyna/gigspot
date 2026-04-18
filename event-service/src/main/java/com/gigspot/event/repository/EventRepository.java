package com.gigspot.event.repository;
import com.gigspot.event.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByGenre(String genre);
    List<Event> findByCityIgnoreCase(String city);
}
