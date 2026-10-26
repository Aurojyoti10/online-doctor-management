
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  QrCode,
  Wallet,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { getDoctors } from '@/services/doctorService';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Doctor } from '@/types';

const API_URL = 'http://localhost:5001/api';

type AvailabilitySlot = {
  start_time: string;
  end_time: string;
  label: string;
};

type PaymentMethod = 'upi' | 'cash';

type Payment = {
  id: number;
  appointment_id: number;
  doctor_id?: number;
  amount: number | string;
  payment_method: PaymentMethod;
  status: 'pending' | 'completed' | 'failed';
  transaction_ref: string;
};

export function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loadingDoctor, setLoadingDoctor] = useState(true);
  const [booking, setBooking] = useState(false);
  const [appointmentId, setAppointmentId] = useState<number | string | null>(null);
  const [reason, setReason] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    searchParams.get('date') || new Date().toLocaleDateString('en-CA')
  );
  const [selectedSlot, setSelectedSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [payment, setPayment] = useState<Payment | null>(null);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [bookingComplete, setBookingComplete] = useState(false);

  const today = new Date().toLocaleDateString('en-CA');

  useEffect(() => {
    let active = true;

    getDoctors()
      .then((doctors) => {
        if (active) setDoctor(doctors.find((item) => item.id === id) ?? null);
      })
      .catch((error: unknown) => {
        if (active) {
          showToast(
            'error',
            'Could not load doctor',
            error instanceof Error ? error.message : 'Please try again.'
          );
        }
      })
      .finally(() => {
        if (active) setLoadingDoctor(false);
      });

    return () => {
      active = false;
    };
  }, [id, showToast]);

  useEffect(() => {
    let active = true;

    setAvailableSlots([]);
    setSelectedSlot('');
    setSlotsError('');

    if (!id || !selectedDate || !/^\d+$/.test(id)) return;

    setLoadingSlots(true);

    fetch(
      `${API_URL}/appointments/availability?doctor_id=${encodeURIComponent(id)}&date=${encodeURIComponent(selectedDate)}`
    )
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Could not load available times.');
        }
        return result.data as AvailabilitySlot[];
      })
      .then((slots) => {
        if (!active) return;
        setAvailableSlots(slots);
        const requestedTime = searchParams.get('time');
        const matchingSlot = slots.find(
          (slot) =>
            slot.label === requestedTime ||
            slot.start_time.slice(0, 5) === requestedTime
        );
        if (matchingSlot) setSelectedSlot(matchingSlot.label);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setSlotsError(
          error instanceof Error ? error.message : 'Could not load available times.'
        );
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });

    return () => {
      active = false;
    };
  }, [id, selectedDate, searchParams]);

  const handleBooking = async () => {
    if (!isAuthenticated || !token || !user) {
      showToast('error', 'Login required', 'Please log in before booking.');
      navigate('/login');
      return;
    }

    if (user.role !== 'patient') {
      showToast(
        'error',
        'Patient account required',
        'Log in with a patient account to book.'
      );
      return;
    }

    if (!doctor || !id || !selectedDate || !selectedSlot) {
      showToast('error', 'Missing details', 'Select a doctor, date and time.');
      return;
    }

    setBooking(true);

    try {
      const chosenSlot = availableSlots.find((slot) => slot.label === selectedSlot);
      if (!chosenSlot) {
        throw new Error('That time is no longer available. Please select another slot.');
      }

      const response = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctor_id: Number(id),
          appointment_date: selectedDate,
          start_time: chosenSlot.start_time,
          end_time: chosenSlot.end_time,
          reason: reason.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success || !result.data?.id) {
        throw new Error(result.message || 'Booking failed. Please try another slot.');
      }

      setAppointmentId(result.data.id);
      showToast(
        'success',
        'Appointment booked',
        'Now choose how you want to pay.'
      );
    } catch (error) {
      showToast(
        'error',
        'Booking failed',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setBooking(false);
    }
  };

  const handleCreatePayment = async () => {
    if (!token || !appointmentId) {
      showToast('error', 'Unable to start payment', 'Please log in and try again.');
      return;
    }

    setCreatingPayment(true);
    setPaymentError('');

    try {
      const response = await fetch(`${API_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          appointment_id: Number(appointmentId),
          payment_method: paymentMethod,
        }),
      });

      const result = await response.json();
      const data = result.data ?? result.payment ?? result;

      if (!response.ok || !result.success || !data.id) {
        throw new Error(
          result.message || 'Could not create the payment record. Please try again.'
        );
      }

      setPayment(data as Payment);
      showToast(
        'success',
        paymentMethod === 'upi' ? 'Demo payment ready' : 'Cash payment selected',
        paymentMethod === 'upi'
          ? 'Use the QR below to view the demo transaction details.'
          : 'Your payment is pending until handled at the clinic.'
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Please try again.';
      setPaymentError(message);
      showToast('error', 'Payment setup failed', message);
    } finally {
      setCreatingPayment(false);
    }
  };

  const handleConfirmDemoPayment = async () => {
    if (!token || !payment) return;

    setConfirmingPayment(true);
    setPaymentError('');

    try {
      const response = await fetch(
        `${API_URL}/payments/${payment.id}/confirm-demo`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      const data = result.data ?? result.payment ?? result;

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Demo payment confirmation failed.');
      }

      setPayment((previous) => ({
        ...(previous as Payment),
        ...(data as Partial<Payment>),
        status: 'completed',
      }));
      setBookingComplete(true);
      showToast(
        'success',
        'Demo payment successful',
        'The completed payment has been recorded.'
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Please try again.';
      setPaymentError(message);
      showToast('error', 'Payment not confirmed', message);
    } finally {
      setConfirmingPayment(false);
    }
  };

  if (loadingDoctor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading doctor...
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p>Doctor not found.</p>
        <Button onClick={() => navigate('/doctors')}>Back to Doctors</Button>
      </div>
    );
  }

  const qrValue = payment
    ? [
        'CARECONNECT DEMO PAYMENT - NOT REAL MONEY',
        `Reference: ${payment.transaction_ref}`,
        `Appointment: ${appointmentId}`,
        `Doctor: ${doctor.name}`,
        `Amount: ${payment.amount}`,
        'This QR only contains demo details. It cannot process a payment.',
      ].join('\n')
    : '';

  return (
    <div className="min-h-screen bg-navy-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-navy-600 hover:text-navy-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <Card className="p-6 sm:p-8">
          {appointmentId !== null ? (
            <div className="py-4">
              {bookingComplete ? (
                <div className="text-center">
                  <CheckCircle2 className="w-16 h-16 text-success-500 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-navy-900">
                    Appointment and payment complete!
                  </h1>
                  <p className="text-navy-600 mt-2">
                    Your demo payment for {doctor.name} has been recorded.
                  </p>
                  <div className="bg-navy-50 rounded-lg p-4 mt-5 text-left">
                    <p className="text-sm text-navy-500">Appointment ID</p>
                    <p className="text-xl font-bold mt-1">{appointmentId}</p>
                    <p className="text-sm mt-3">
                      Payment: {formatCurrency(Number(payment?.amount ?? doctor.consultationFee))}
                    </p>
                    <p className="text-sm mt-1">
                      Status: {payment?.status ?? 'completed'}
                    </p>
                    {payment?.transaction_ref && (
                      <p className="text-xs text-navy-500 mt-2 break-all">
                        Demo reference: {payment.transaction_ref}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
                    <Button onClick={() => navigate('/patient/appointments')}>
                      View Appointments
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/patient/dashboard')}
                    >
                      Dashboard
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <CheckCircle2 className="w-14 h-14 text-success-500 mx-auto mb-3" />
                    <h1 className="text-2xl font-bold text-navy-900">
                      Appointment booked!
                    </h1>
                    <p className="text-navy-600 mt-2">
                      Your appointment with {doctor.name} has been saved.
                    </p>
                    <div className="bg-navy-50 rounded-lg p-4 mt-5">
                      <p className="text-sm text-navy-500">Appointment ID</p>
                      <p className="text-xl font-bold mt-1">{appointmentId}</p>
                      <p className="mt-3 text-sm">
                        {formatDate(selectedDate)} · {selectedSlot}
                      </p>
                      <p className="mt-2 font-semibold">
                        Consultation fee: {formatCurrency(doctor.consultationFee)}
                      </p>
                    </div>
                  </div>

                  {!payment ? (
                    <>
                      <h2 className="text-lg font-semibold text-navy-900 mt-7">
                        Choose payment method
                      </h2>
                      <p className="text-sm text-navy-500 mt-1">
                        Select demo UPI or pay in cash at the clinic.
                      </p>

                      <div className="grid sm:grid-cols-2 gap-3 mt-4">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('upi')}
                          className={`rounded-xl border p-4 text-left ${
                            paymentMethod === 'upi'
                              ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600'
                              : 'border-navy-200 hover:border-primary-400'
                          }`}
                        >
                          <QrCode className="w-6 h-6 mb-2 text-primary-700" />
                          <span className="block font-semibold text-navy-900">
                            Demo UPI QR
                          </span>
                          <span className="block text-sm text-navy-500 mt-1">
                            Simulated online payment
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('cash')}
                          className={`rounded-xl border p-4 text-left ${
                            paymentMethod === 'cash'
                              ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600'
                              : 'border-navy-200 hover:border-primary-400'
                          }`}
                        >
                          <Wallet className="w-6 h-6 mb-2 text-primary-700" />
                          <span className="block font-semibold text-navy-900">
                            Cash at clinic
                          </span>
                          <span className="block text-sm text-navy-500 mt-1">
                            Pay when you visit
                          </span>
                        </button>
                      </div>

                      {paymentError && (
                        <p className="text-sm text-red-600 mt-4">{paymentError}</p>
                      )}

                      <Button

                        className="mt-5"
                        onClick={handleCreatePayment}
                        loading={creatingPayment}
                        disabled={creatingPayment}
                      >
                        {creatingPayment
                          ? 'Setting up payment...'
                          : paymentMethod === 'upi'
                            ? 'Continue to Demo QR'
                            : 'Confirm Cash at Clinic'}
                      </Button>

                      <p className="text-xs text-amber-700 mt-3 text-center">
                        Demo only: no real money will be transferred.
                      </p>
                    </>
                  ) : payment.payment_method === 'upi' ? (
                    <div className="mt-7 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <CreditCard className="w-5 h-5 text-primary-700" />
                        <h2 className="text-lg font-semibold text-navy-900">
                          Demo QR payment
                        </h2>
                      </div>

                      <div className="inline-block bg-white border border-navy-200 rounded-xl p-4 mt-4">
                        <QRCodeSVG value={qrValue} size={220} level="M" />
                      </div>

                      <p className="text-sm font-semibold text-amber-700 mt-4">
                        This is NOT a real UPI payment QR.
                      </p>
                      <p className="text-sm text-navy-600 mt-1">
                        It contains demo transaction details only. Scan it to view
                        the encoded information, or use the button below to simulate
                        a successful payment.
                      </p>

                      <div className="bg-navy-50 rounded-lg p-4 mt-4 text-left">
                        <p className="text-sm text-navy-500">Amount</p>
                        <p className="text-xl font-bold">
                          {formatCurrency(Number(payment.amount))}
                        </p>
                        <p className="text-sm text-navy-500 mt-3">Demo reference</p>
                        <p className="text-sm font-medium break-all">
                          {payment.transaction_ref}
                        </p>
                        <p className="text-sm text-navy-500 mt-3">
                          Status: {payment.status}
                        </p>
                      </div>

                      {paymentError && (
                        <p className="text-sm text-red-600 mt-4">{paymentError}</p>
                      )}

                      <Button

                        className="mt-5"
                        onClick={handleConfirmDemoPayment}
                        loading={confirmingPayment}
                        disabled={confirmingPayment || payment.status === 'completed'}
                      >
                        {confirmingPayment
                          ? 'Confirming demo payment...'
                          : 'Simulate Successful Demo Payment'}
                      </Button>
                      <button
                        type="button"
                        onClick={() => navigate('/patient/appointments')}
                        className="text-sm text-primary-700 hover:underline mt-4"
                      >
                        Leave payment pending and view appointments
                      </button>
                    </div>
                  ) : (
                    <div className="mt-7 text-center">
                      <Wallet className="w-12 h-12 text-primary-700 mx-auto mb-3" />
                      <h2 className="text-xl font-semibold text-navy-900">
                        Pay at the clinic
                      </h2>
                      <p className="text-navy-600 mt-2">
                        Your cash payment has been recorded as pending. Pay the
                        consultation fee when you visit {doctor.name}.
                      </p>
                      <div className="bg-navy-50 rounded-lg p-4 mt-4 text-left">
                        <p className="text-sm text-navy-500">Amount due</p>
                        <p className="text-xl font-bold">
                          {formatCurrency(Number(payment.amount))}
                        </p>
                        <p className="text-sm mt-2">
                          Payment status: <strong>{payment.status}</strong>
                        </p>
                        <p className="text-xs text-navy-500 mt-2 break-all">
                          Reference: {payment.transaction_ref}
                        </p>
                      </div>
                      <Button

                        className="mt-5"
                        onClick={() => navigate('/patient/appointments')}
                      >
                        View Appointments
                      </Button>
                      <Button

                        variant="outline"
                        className="mt-3"
                        onClick={() => navigate('/patient/dashboard')}
                      >
                        Dashboard
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-navy-900">
                Book an appointment
              </h1>
              <p className="text-sm text-navy-500 mt-1">
                Choose a convenient date and available time.
              </p>

              <div className="rounded-xl bg-navy-50 p-4 mt-6">
                <h2 className="font-semibold text-navy-900">{doctor.name}</h2>
                <p className="text-sm text-navy-600 mt-1">
                  {doctor.specializationName}
                </p>
                {doctor.hospital && (
                  <p className="text-sm text-navy-500 mt-1">{doctor.hospital}</p>
                )}
                <p className="font-semibold text-primary-700 mt-3">
                  Consultation fee: {formatCurrency(doctor.consultationFee)}
                </p>
              </div>

              {!isAuthenticated && (
                <p className="text-sm text-amber-700 mt-4">
                  Please log in with your patient account before booking.
                </p>
              )}

              <div className="mt-6">
                <label className="label flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" /> Appointment date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={today}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="input w-full"
                />
              </div>

              <div className="mt-6">
                <label className="label flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4" /> Appointment time
                </label>
                {loadingSlots ? (
                  <p className="text-sm text-navy-500">
                    Loading available times...
                  </p>
                ) : slotsError ? (
                  <p className="text-sm text-red-600">{slotsError}</p>
                ) : availableSlots.length === 0 ? (
                  <p className="text-sm text-navy-500">
                    No available appointments for this date. Please choose another
                    date.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.start_time}
                        type="button"
                        onClick={() => setSelectedSlot(slot.label)}
                        className={`rounded-lg border p-2 text-sm ${
                          selectedSlot === slot.label
                            ? 'border-primary-600 bg-primary-600 text-white'
                            : 'border-navy-200 text-navy-700 hover:border-primary-400'
                        }`}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-xs text-navy-500 mt-2">
                  Times are loaded from the doctor's schedule. Already-booked
                  slots are excluded.
                </p>
              </div>

              <div className="mt-6">
                <label className="label mb-2 block">
                  Reason for visit (optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="input w-full resize-none"
                  rows={3}
                  maxLength={500}
                  placeholder="Briefly describe the reason for your visit"
                />
              </div>

              <Button

                className="mt-6"
                onClick={handleBooking}
                loading={booking}
                disabled={
                  booking ||
                  loadingSlots ||
                  !selectedDate ||
                  selectedDate < today ||
                  !selectedSlot ||
                  !availableSlots.some((slot) => slot.label === selectedSlot)
                }
              >
                {booking ? 'Booking...' : 'Confirm Appointment'}
              </Button>

              <p className="text-xs text-navy-500 mt-3 text-center">
                Choose your payment method after the appointment is saved.
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
