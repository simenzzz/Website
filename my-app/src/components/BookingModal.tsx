import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import './BookingModal.css'

interface Child {
  id: string
  name: string
  age: string
}

interface Pet {
  id: string
  name: string
  type: string
}

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  sitterName: string
  sitterType: 'pet' | 'baby'
  isLoggedIn: boolean
  userChildren?: Child[]
  userPets?: Pet[]
}

const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  sitterName,
  sitterType,
  isLoggedIn,
  userChildren = [],
  userPets = []
}) => {
  const [selectedChild, setSelectedChild] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Booking submitted:', {
      sitterName,
      sitterType,
      selectedChild,
      startTime,
      endTime,
      notes
    })
    onClose()
  }

  if (!isOpen) return null

  const availableItems = sitterType === 'baby' ? userChildren : userPets
  const itemLabel = sitterType === 'baby' ? 'children' : 'pets'

  return (
    <div className="booking-modal-overlay" onClick={onClose}>
      <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
        <div className="booking-modal-header">
          <h2>Book a Session with {sitterName}</h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="booking-modal-content">
          {!isLoggedIn ? (
            // Login Section
            <div className="login-section">
              <div className="login-icon">
                <i className="fas fa-user-lock"></i>
              </div>
              <h3>Sign in to Book a Session</h3>
              <p>You need to be logged in to book a session with our sitters.</p>
              <div className="login-buttons">
                <Link to="/portal" className="btn-login">
                  <i className="fas fa-sign-in-alt"></i>
                  Sign In
                </Link>
                <Link to="/portal" className="btn-signup">
                  <i className="fas fa-user-plus"></i>
                  Sign Up
                </Link>
              </div>
            </div>
          ) : (
            // Booking Form Section
            <form onSubmit={handleSubmit} className="booking-form">
              <div className="form-group">
                <label htmlFor="child-select">
                  <i className={`fas fa-${sitterType === 'baby' ? 'baby' : 'paw'}`}></i>
                  Select Your {sitterType === 'baby' ? 'Child' : 'Pet'}
                </label>
                <select
                  id="child-select"
                  value={selectedChild}
                  onChange={(e) => setSelectedChild(e.target.value)}
                  required
                >
                  <option value="">Choose {sitterType === 'baby' ? 'child' : 'pet'}</option>
                  {availableItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} {sitterType === 'baby' ? `(Age: ${(item as Child).age})` : `(${(item as Pet).type})`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="time-selection">
                <div className="form-group">
                  <label htmlFor="start-time">
                    <i className="fas fa-clock"></i>
                    Start Time
                  </label>
                  <select
                    id="start-time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  >
                    <option value="">Select start time</option>
                    <option value="08:00">8:00 AM</option>
                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">1:00 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                    <option value="17:00">5:00 PM</option>
                    <option value="18:00">6:00 PM</option>
                    <option value="19:00">7:00 PM</option>
                    <option value="20:00">8:00 PM</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="end-time">
                    <i className="fas fa-clock"></i>
                    End Time
                  </label>
                  <select
                    id="end-time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  >
                    <option value="">Select end time</option>
                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">1:00 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                    <option value="17:00">5:00 PM</option>
                    <option value="18:00">6:00 PM</option>
                    <option value="19:00">7:00 PM</option>
                    <option value="20:00">8:00 PM</option>
                    <option value="21:00">9:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">
                  <i className="fas fa-sticky-note"></i>
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={`Any special instructions for ${sitterName}?`}
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  <i className="fas fa-calendar-check"></i>
                  Book Session
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default BookingModal