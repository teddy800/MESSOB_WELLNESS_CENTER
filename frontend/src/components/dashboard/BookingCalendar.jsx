import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const normalizeAppointments = (items) => {
  if (!Array.isArray(items)) return [];

  return items.map((appointment) => ({
    ...appointment,
    status:
      typeof appointment.status === "string"
        ? appointment.status.toUpperCase()
        : appointment.status,
  }));
};

function BookingCalendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingReason, setBookingReason] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  const DAILY_SLOTS = 100;

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/v1/appointments");
      const data = response.data.data;

      // Handle both array and object responses
      let appointmentsList = [];
      if (Array.isArray(data)) {
        appointmentsList = data;
      } else if (
        data &&
        data.appointments &&
        Array.isArray(data.appointments)
      ) {
        appointmentsList = data.appointments;
      }

      setAppointments(normalizeAppointments(appointmentsList));
      setError("");
    } catch (err) {
      setAppointments([]);
      setError("Failed to load appointments");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getAppointmentsForDate = (date) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.scheduledAt).toDateString();
      return aptDate === date.toDateString();
    });
  };

  const getAvailableSlots = (date) => {
    const booked = getAppointmentsForDate(date).length;
    return DAILY_SLOTS - booked;
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !bookingReason.trim()) {
      setError("Please select a date and reason");
      return;
    }

    try {
      setBookingLoading(true);
      const response = await api.post("/api/v1/appointments", {
        scheduledAt: selectedDate.toISOString(),
        reason: bookingReason,
      });

      const createdAppointment = normalizeAppointments([response.data.data])[0];
      setAppointments((prev) => [...prev, createdAppointment]);
      window.dispatchEvent(
        new CustomEvent("appointments-updated", {
          detail: { appointment: createdAppointment },
        }),
      );
      setShowBookingForm(false);
      setBookingReason("");
      setSelectedDate(null);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to book appointment");
    } finally {
      setBookingLoading(false);
    }
  };

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1),
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
    );
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day,
      );
      const available = getAvailableSlots(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const isPast = date < new Date() && !isToday;
      const isSelected = selectedDate?.toDateString() === date.toDateString();

      days.push(
        <div
          key={day}
          className={`calendar-day ${isToday ? "today" : ""} ${isPast ? "past" : ""} ${isSelected ? "selected" : ""} ${available === 0 ? "full" : ""}`}
          onClick={() => !isPast && setSelectedDate(date)}
        >
          <div className="day-number">{day}</div>
          <div
            className={`slots-badge ${available === 0 ? "full" : available < 20 ? "low" : "available"}`}
          >
            {available}/{DAILY_SLOTS}
          </div>
        </div>,
      );
    }

    return days;
  };

  return (
    <div className="card booking-calendar">
      <h2>📅 Booking Calendar</h2>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="calendar-header">
        <button onClick={prevMonth} className="nav-btn">
          ←
        </button>
        <h3>
          {currentDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </h3>
        <button onClick={nextMonth} className="nav-btn">
          →
        </button>
      </div>

      <div className="calendar-weekdays">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      <div className="calendar-grid">{renderCalendar()}</div>

      {selectedDate && (
        <div className="booking-form">
          <h4>Book Appointment for {selectedDate.toDateString()}</h4>
          <textarea
            placeholder="Reason for visit"
            value={bookingReason}
            onChange={(e) => setBookingReason(e.target.value)}
            disabled={bookingLoading}
            rows="3"
          />
          <div className="form-actions">
            <button
              className="btn btn-primary"
              onClick={handleBookAppointment}
              disabled={bookingLoading}
            >
              {bookingLoading ? "Booking..." : "Confirm Booking"}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSelectedDate(null);
                setBookingReason("");
              }}
              disabled={bookingLoading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-color available"></span> Available
        </div>
        <div className="legend-item">
          <span className="legend-color low"></span> Low Availability
        </div>
        <div className="legend-item">
          <span className="legend-color full"></span> Full
        </div>
      </div>
    </div>
  );
}

export default BookingCalendar;
