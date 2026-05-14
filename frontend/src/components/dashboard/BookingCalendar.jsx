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
  const [selectedTime, setSelectedTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingReason, setBookingReason] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [slotsCache, setSlotsCache] = useState({}); // Cache for slot counts by date
  const bookingFormRef = React.useRef(null);
  const errorRef = React.useRef(null);

  const DAILY_SLOTS = 36; // 9 hours * 4 slots per hour

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Fetch slot counts for all dates in the current month
  useEffect(() => {
    fetchMonthSlotCounts();
  }, [currentDate]);

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

  const fetchMonthSlotCounts = async () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const newCache = {};

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day,
      );
      const isPast = date < new Date() && date.toDateString() !== new Date().toDateString();
      
      if (!isPast) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const dayStr = String(date.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${dayStr}`;

        try {
          const response = await api.get(`/api/v1/appointments/available-slots?date=${dateString}`);
          const slots = response.data.data.availableSlots || [];
          newCache[dateString] = slots.length;
        } catch (err) {
          newCache[dateString] = DAILY_SLOTS; // Default to full if error
        }
      }
    }

    setSlotsCache(newCache);
  };

  const getAvailableSlots = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    // Return cached slot count or default to full
    return slotsCache[dateString] !== undefined ? slotsCache[dateString] : DAILY_SLOTS;
  };

  const fetchAvailableTimeSlots = async (date) => {
    try {
      setLoadingSlots(true);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      const response = await api.get(`/api/v1/appointments/available-slots?date=${dateString}`);
      let slots = response.data.data.availableSlots || [];
      
      // Filter out past time slots if booking for today
      const isToday = date.toDateString() === new Date().toDateString();
      if (isToday) {
        const now = new Date();
        slots = slots.filter(slotISO => {
          const slotTime = new Date(slotISO);
          return slotTime > now; // Only show future slots
        });
      }
      
      setAvailableSlots(slots);
      setError('');
      
      // Scroll to booking form after slots are loaded
      setTimeout(() => {
        if (bookingFormRef.current) {
          bookingFormRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
          });
        }
      }, 100);
    } catch (err) {
      setError('Failed to load available time slots');
      console.error(err);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const formatTimeSlot = (isoString) => {
    const date = new Date(isoString);
    // Convert to Ethiopia time (UTC+3)
    const ethiopiaTime = new Date(date.getTime() + (3 * 60 * 60 * 1000));
    const hours = ethiopiaTime.getUTCHours();
    const minutes = ethiopiaTime.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime || !bookingReason.trim()) {
      setError("Please select a date, time, and provide a reason");
      // Auto-scroll to error message
      setTimeout(() => {
        if (errorRef.current) {
          errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
      return;
    }

    try {
      setBookingLoading(true);
      
      console.log(`Booking appointment for: ${selectedTime}`);
      
      const response = await api.post("/api/v1/appointments", {
        scheduledAt: selectedTime, // Send the ISO string with time
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
      setSelectedTime("");
      setAvailableSlots([]);
      setError("");
      
      // Refresh slot counts after booking
      fetchMonthSlotCounts();
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to book appointment";
      setError(errorMessage);
      // Auto-scroll to error message
      setTimeout(() => {
        if (errorRef.current) {
          errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
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
          onClick={() => {
            if (!isPast) {
              setSelectedDate(date);
              fetchAvailableTimeSlots(date);
            }
          }}
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

      {error && <div className="alert alert-error" ref={errorRef}>{error}</div>}

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
        <div className="booking-form" ref={bookingFormRef}>
          <h4>Book Appointment for {selectedDate.toDateString()}</h4>
          
          {loadingSlots ? (
            <p>Loading available time slots...</p>
          ) : availableSlots.length === 0 ? (
            <p className="alert alert-error">No available time slots for this date</p>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Select Time</label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  disabled={bookingLoading}
                  className="form-input"
                  required
                >
                  <option value="">Choose a time slot...</option>
                  {availableSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {formatTimeSlot(slot)}
                    </option>
                  ))}
                </select>
                <small style={{ color: '#666', fontSize: '0.85rem' }}>
                  {availableSlots.length} slot{availableSlots.length !== 1 ? 's' : ''} available (15 min each)
                </small>
              </div>

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
                  disabled={bookingLoading || !selectedTime}
                >
                  {bookingLoading ? "Booking..." : "Confirm Booking"}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setSelectedDate(null);
                    setSelectedTime("");
                    setBookingReason("");
                    setAvailableSlots([]);
                  }}
                  disabled={bookingLoading}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
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
