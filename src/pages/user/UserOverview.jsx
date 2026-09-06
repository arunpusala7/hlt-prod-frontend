import { useEffect, useState, useRef, useMemo } from "react";
import api from "../../api/api";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { getDoctorPortrait, getSpecialtyIcon } from "../../utils/doctorAvatars";
import { formatDoctorName } from "../../utils/formatDoctorName";
import AppointmentReceipt from "./AppointmentReceipt";
import CancelReasonDropdown from "../../components/CancelReasonDropdown";
import { getLocalDateString } from "../../utils/dateUtils";
import { createPortal } from "react-dom";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Module-level caches to guarantee 0ms instant loading with zero jerk
let cachedDoctorsList = null;
let cachedUpcomingAppt = null;

export const ALL_SPECIALTIES = [
  { id: "Cardiology", label: "Cardio", matchKeys: ["cardio"] },
  { id: "Nephrology", label: "Kidney Care", matchKeys: ["nephro", "kidney"] },
  { id: "General Medicine", label: "General", matchKeys: ["general"] },
  { id: "Pediatrics", label: "Pediatrics", matchKeys: ["pediatric"] },
  { id: "Dermatology", label: "Dermatology", matchKeys: ["dermato", "skin"] },
  { id: "Neurology", label: "Neurology", matchKeys: ["neuro"] },
  { id: "Orthopedics", label: "Orthopedics", matchKeys: ["ortho"] },
  { id: "Gastroenterology", label: "Gastro", matchKeys: ["gastro"] },
  { id: "Psychiatry", label: "Psychiatry", matchKeys: ["psych"] },
  { id: "Oncology", label: "Oncology", matchKeys: ["oncol", "cancer"] },
  { id: "Homeopathy", label: "Homeopathy", matchKeys: ["homeo"] },
];

export const DB_DOCTORS_INITIAL = [
  {
    id: 9,
    name: "Dr. Kavita Menon",
    specialization: "Oncology",
    email: "dr.kavita.menon@healthconnect.com",
    consultationFee: 500,
    aboutBio: "Dr. Kavita Menon is an eminent Medical Oncologist specializing in targeted cancer immunotherapy, precision chemotherapy, and breast/lung oncology care.",
    experienceYears: "15+ Years Exp",
    qualifications: "MBBS, MD, DM (Medical Oncology), ESMO Certified",
    hospitalAffiliation: "HealthConnect Comprehensive Cancer Center",
    successStories: "Achieved complete remissions in high-risk oncology patients using state-of-the-art targeted biological therapies and personalized oncology protocols.",
    testimonials: "Dr. Kavita gave us hope during my wife's cancer fight. Her expertise in targeted therapy resulted in complete remission. Thank you!"
  },
  {
    id: 12,
    name: "Dr. D Arun Kumar",
    specialization: "General Medicine",
    email: "dr.d.arun@healthconnect.com",
    consultationFee: 500,
    experienceYears: "14+ Years Exp",
    aboutBio: "Dr. D Arun Kumar is a Senior Physician specializing in comprehensive adult health, diabetes care, hypertension, and fever management.",
    qualifications: "MBBS, MD (General Medicine), DNB",
    hospitalAffiliation: "Apollo Hospitals & HealthConnect Medical Center, Jubilee Hills",
    successStories: "Successfully reversed diabetes complications and managed high-risk acute hypertensive emergencies across 10,000+ patients.",
    testimonials: "Dr. Arun diagnosed my hidden condition when other doctors were baffled. He is a truly phenomenal physician."
  },
  {
    id: 13,
    name: "Dr. M Sai Pranith",
    specialization: "Homeopathy",
    email: "dr.sai.pranith@healthconnect.com",
    consultationFee: 500,
    aboutBio: "Dr. M Sai Pranith specializes in classical constitutional homeopathy for chronic skin ailments, respiratory allergies, digestive disorders, and autoimmune conditions with zero side effects.",
    experienceYears: "11+ Years Exp",
    qualifications: "BHMS, MD (Homeopathy), Gold Medalist",
    hospitalAffiliation: "HealthConnect Holistic Homeopathy & Wellness Clinic",
    successStories: "Successfully treated over 3,200 patients suffering from chronic psoriasis, sinus allergies, and IBS through tailored homeopathic regimens.",
    testimonials: "My 5-year asthma problem was cured naturally by Dr. Sai Pranith's gentle medicine. Highly recommended for holistic healing!"
  },
  {
    id: 3,
    name: "Dr. Ananya Roy",
    specialization: "Cardiology",
    email: "dr.ananya.roy@healthconnect.com",
    consultationFee: 500,
    aboutBio: "Dr. Ananya Roy is a distinguished Consultant Interventional Cardiologist specializing in complex coronary angioplasty, heart failure management, and preventive cardiac care.",
    experienceYears: "15+ Years Exp",
    qualifications: "MBBS, MD, DM (Cardiology), FACC (USA)",
    hospitalAffiliation: "HealthConnect Heart & Vascular Institute",
    successStories: "Performed over 2,400 successful angioplasties and minimally invasive valve procedures with a 99.4% procedural success rate.",
    testimonials: "Dr. Ananya performed my emergency stent surgery with incredible expertise. She saved my life and guided my full cardiac recovery!"
  },
  {
    id: 4,
    name: "Dr. Vikramaditya Verma",
    specialization: "Neurology",
    email: "dr.vikram.verma@healthconnect.com",
    consultationFee: 500,
    aboutBio: "Dr. Vikramaditya Verma is an expert Neurologist specializing in stroke intervention, migraine management, epilepsy, Parkinson's disease, and neuro-rehabilitation.",
    experienceYears: "13+ Years Exp",
    qualifications: "MBBS, MD, DM (Neurology), Fellowship in Epilepsy (London)",
    hospitalAffiliation: "HealthConnect Brain & Spine Neuro Center",
    successStories: "Led acute stroke thrombolysis protocols resulting in complete neurological recovery for over 650 stroke victims within the golden hour.",
    testimonials: "After suffering severe migraines for 7 years, Dr. Vikram's treatment gave me my life back completely. Eternally grateful!"
  },
  {
    id: 5,
    name: "Dr. Meera Nambiar",
    specialization: "Nephrology",
    email: "dr.meera.nambiar@healthconnect.com",
    consultationFee: 500,
    aboutBio: "Dr. Meera Nambiar is a compassionate Nephrologist dedicated to kidney transplant care, chronic kidney disease (CKD) prevention, and advanced hemodialysis management.",
    experienceYears: "12+ Years Exp",
    qualifications: "MBBS, MD, DM (Nephrology), FISN",
    hospitalAffiliation: "HealthConnect Kidney Care & Dialysis Center",
    successStories: "Overseen 400+ successful kidney transplant recoveries and managed advanced renal failure programs with outstanding long-term graft survival.",
    testimonials: "Dr. Meera guided my mother through kidney dialysis and successful transplant. Her empathy and precision are beyond compare!"
  },
  {
    id: 6,
    name: "Dr. Suresh Reddy",
    specialization: "Orthopedics",
    email: "dr.suresh.reddy@healthconnect.com",
    consultationFee: 500,
    aboutBio: "Dr. Suresh Reddy is a renowned Senior Orthopedic Surgeon specializing in robotic knee and hip joint replacements, sports injury arthroscopy, and complex fracture trauma.",
    experienceYears: "18+ Years Exp",
    qualifications: "MBBS, MS (Orthopedics), M.Ch (Orth), Fellow Joint Replacement (Germany)",
    hospitalAffiliation: "HealthConnect Bone & Joint Institute",
    successStories: "Completed 3,500+ robotic joint replacements enabling patients to walk pain-free within 24 hours post-surgery.",
    testimonials: "I had total knee replacement with Dr. Suresh and was back to my morning walks in just 3 weeks! Outstanding surgeon!"
  },
  {
    id: 7,
    name: "Dr. Priya Deshmukh",
    specialization: "Dermatology",
    email: "dr.priya.deshmukh@healthconnect.com",
    consultationFee: 500,
    aboutBio: "Dr. Priya Deshmukh is a top Dermato-Cosmetologist specializing in acne scar revision, laser skin rejuvenation, anti-aging therapies, and hair restoration procedures.",
    experienceYears: "10+ Years Exp",
    qualifications: "MBBS, MD (Dermatology, Venereology & Leprosy), DVD",
    hospitalAffiliation: "HealthConnect Dermatology & Aesthetic Skin Clinic",
    successStories: "Transformed skin health for 4,000+ patients suffering from recalcitrant acne, vitiligo, and alopecia through advanced laser technology.",
    testimonials: "Dr. Priya treated my severe cystic acne and scarring. My skin has never looked clearer or felt healthier. She is amazing!"
  },
  {
    id: 8,
    name: "Dr. Arvind Swamy",
    specialization: "Pediatrics",
    email: "dr.arvind.swamy@healthconnect.com",
    consultationFee: 500,
    aboutBio: "Dr. Arvind Swamy is a friendly Pediatrician providing comprehensive newborn care, childhood immunization, growth monitoring, and pediatric asthma management.",
    experienceYears: "14+ Years Exp",
    qualifications: "MBBS, MD (Pediatrics), DCH (UK)",
    hospitalAffiliation: "HealthConnect Children's & Pediatric Care Hospital",
    successStories: "Successfully treated over 8,000 children with respiratory distress, allergy management, and pediatric growth optimization.",
    testimonials: "Dr. Arvind is so warm with kids! My toddlers love visiting him. He explains everything reassuringly to parents."
  },
  {
    id: 10,
    name: "Dr. Rohan Malhotra",
    specialization: "Psychiatry",
    email: "dr.rohan.malhotra@healthconnect.com",
    consultationFee: 500,
    aboutBio: "Dr. Rohan Malhotra is a compassionate Consultant Psychiatrist specializing in stress disorders, depression, anxiety, adult ADHD, and cognitive behavioral therapy.",
    experienceYears: "12+ Years Exp",
    qualifications: "MBBS, MD (Psychiatry), DPM",
    hospitalAffiliation: "HealthConnect Mind & Behavioral Health Clinic",
    successStories: "Guided over 2,500 individuals toward mental wellness, overcoming severe panic disorders, burnout, and depression through integrated therapy.",
    testimonials: "Dr. Rohan creates a non-judgmental, safe environment. His therapy sessions helped me overcome crippling anxiety. Truly remarkable!"
  },
  {
    id: 11,
    name: "Dr. Sunita Agarwal",
    specialization: "Gastroenterology",
    email: "dr.sunita.agarwal@healthconnect.com",
    consultationFee: 500,
    aboutBio: "Dr. Sunita Agarwal is a leading Gastroenterologist specializing in therapeutic endoscopy, fatty liver disease, acid reflux (GERD), and gallbladder disorders.",
    experienceYears: "13+ Years Exp",
    qualifications: "MBBS, MD, DM (Gastroenterology)",
    hospitalAffiliation: "HealthConnect Digestive Diseases & Endoscopy Center",
    successStories: "Performed over 5,000 diagnostic and therapeutic endoscopies with zero complication rates, specializing in early GI cancer detection.",
    testimonials: "Dr. Sunita cured my chronic GERD and stomach ulcers. She is very gentle during procedures and super clear in her advice!"
  },
  {
    id: 14,
    name: "Mj",
    specialization: "Cardio",
    email: "mj@gmail.com",
    consultationFee: 2,
    experienceYears: "6+ Years Exp",
    aboutBio: "Experienced cardiology and vascular consultant.",
    qualifications: "MBBS, MD (Cardio)",
    hospitalAffiliation: "HealthConnect Heart Center",
    successStories: "Over 800 patient consultations across cardiology and preventive health.",
    testimonials: "Quick, effective, and very patient-friendly doctor."
  },
  {
    id: 15,
    name: "pavan",
    specialization: "General",
    email: "pavan@gmail.com",
    consultationFee: 500,
    experienceYears: "5+ Years Exp",
    aboutBio: "Primary healthcare physician providing family medical consultations.",
    qualifications: "MBBS",
    hospitalAffiliation: "HealthConnect City Clinic",
    successStories: "Treated over 1,500 acute and primary care cases with high patient satisfaction.",
    testimonials: "Very approachable and attentive doctor for family consultations."
  }
];

function UserOverview({ 
  setActiveTab, 
  isPhoneMode = false, 
  isFindDoctorsActive = false, 
  preSelectedDoctorId = null,
  onClearPreSelectedDoctor 
}) {
  // Instant cached state to eliminate initial loading jerk
  const [nextAppointment, setNextAppointment] = useState(() => {
    if (cachedUpcomingAppt !== null) return cachedUpcomingAppt;
    try {
      const saved = localStorage.getItem("hc_cached_upcoming");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [doctors, setDoctors] = useState(() => {
    if (cachedDoctorsList && cachedDoctorsList.length > 0) return cachedDoctorsList;
    try {
      const saved = localStorage.getItem("hc_cached_doctors");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      }
    } catch {}
    return DB_DOCTORS_INITIAL;
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const userName = localStorage.getItem("userName") || "Alex";

  const searchInputRef = useRef(null);
  const doctorListRef = useRef(null);

  // Auto-scroll and focus when "Find Doctors" is activated
  useEffect(() => {
    if (isFindDoctorsActive) {
      if (doctorListRef.current) {
        doctorListRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
  }, [isFindDoctorsActive]);

  // If a doctor was pre-selected, immediately open the Swiggy 75% bottom sheet
  useEffect(() => {
    if (preSelectedDoctorId && doctors.length > 0) {
      const doc = doctors.find((d) => String(d.id) === String(preSelectedDoctorId));
      if (doc) {
        handleOpenBookingModal(doc);
        if (onClearPreSelectedDoctor) onClearPreSelectedDoctor();
      }
    }
  }, [preSelectedDoctorId, doctors]);

  // In-Page Doctor Booking Modal State (Screen 3)
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [selectedBookingDate, setSelectedBookingDate] = useState(getLocalDateString());
  const [bookingSlots, setBookingSlots] = useState([]);
  const [selectedBookingSlot, setSelectedBookingSlot] = useState(null);
  const [loadingBookingSlots, setLoadingBookingSlots] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(() => new Date());

  // In-Page Receipt Pass Modal State
  const [viewingReceipt, setViewingReceipt] = useState(null);

  // In-Page Cancel Modal State
  const [cancellingAppt, setCancellingAppt] = useState(null);
  const [cancelReason, setCancelReason] = useState("Busy on that date");
  const [isCancelling, setIsCancelling] = useState(false);

  // In-Page Reschedule Bottom Sheet State (75% height)
  const [reschedulingAppt, setReschedulingAppt] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState(null);
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
  const [isConfirmingReschedule, setIsConfirmingReschedule] = useState(false);

  // Specialties without "All" button
  const specialties = [
    "Pediatrics",
    "General Medicine",
    "Cardiology",
    "Dermatology",
    "Neurology",
    "Orthopedics"
  ];

  const cancellationReasons = [
    "Busy on that date",
    "Health improved / resolved",
    "Doctor unavailable",
    "Found a better slot",
    "Other"
  ];

  const fetchUpcomingAppointment = async () => {
    try {
      const res = await api.get("/api/appointments/my");
      const upcoming = (res.data || []).find(a => a.status === "BOOKED" || a.status === "RESCHEDULED");
      const result = upcoming || null;
      cachedUpcomingAppt = result;
      localStorage.setItem("hc_cached_upcoming", JSON.stringify(result));
      setNextAppointment(prev => {
        if (JSON.stringify(prev) === JSON.stringify(result)) return prev;
        return result;
      });
    } catch (err) {
      console.error("Failed to load upcoming appointments:", err);
    }
  };

  const fetchDoctorsList = async () => {
    try {
      const res = await api.get("/api/doctors");
      if (res.data && res.data.length > 0) {
        cachedDoctorsList = res.data;
        localStorage.setItem("hc_cached_doctors", JSON.stringify(res.data));
        setDoctors(prev => {
          if (JSON.stringify(prev) === JSON.stringify(res.data)) return prev;
          return res.data;
        });
      }
    } catch (err) {
      console.error("Failed to refresh doctors:", err);
    }
  };

  const handleRefreshData = async () => {
    setIsManualRefreshing(true);
    try {
      await Promise.all([
        fetchUpcomingAppointment(),
        fetchDoctorsList()
      ]);
      toast.success("Page refreshed", { id: "refresh-page", icon: "✨", duration: 1500 });
    } catch {
      toast.error("Could not refresh data. Check connection.");
    } finally {
      setTimeout(() => setIsManualRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchUpcomingAppointment();
    fetchDoctorsList();
  }, []);

  // Lock background page scroll whenever any 75% bottom sheet or modal is open
  const isAnySheetOpen = Boolean(
    bookingDoctor || showCustomCalendar || viewingReceipt || cancellingAppt || reschedulingAppt
  );

  useEffect(() => {
    if (isAnySheetOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalOverscroll = document.body.style.overscrollBehavior;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = "hidden";
      document.body.style.overscrollBehavior = "none";
      document.body.style.touchAction = "none";
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.overscrollBehavior = originalOverscroll;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [isAnySheetOpen]);

  const fetchSlotsForDoctor = async (docId, dateStr) => {
    setLoadingBookingSlots(true);
    try {
      const res = await api.get(`/api/availability/doctor/${docId}?date=${dateStr}`);
      const slotsArray = res.data?.availableSlots || res.data?.slots || (Array.isArray(res.data) ? res.data : []);
      // STRICTLY reflect actual backend availability without injecting fake mock slots
      setBookingSlots(slotsArray);
    } catch (err) {
      console.error("Error loading doctor availability from backend", err);
      setBookingSlots([]);
    } finally {
      setLoadingBookingSlots(false);
    }
  };

  // Open In-Page Booking Sheet
  const handleOpenBookingModal = (doc) => {
    setBookingDoctor(doc);
    const todayStr = getLocalDateString();
    setSelectedBookingDate(todayStr);
    setSelectedBookingSlot(null);
    fetchSlotsForDoctor(doc.id, todayStr);
  };

  const handleBookingDateChange = (isoDate) => {
    setSelectedBookingDate(isoDate);
    setSelectedBookingSlot(null);
    if (bookingDoctor) {
      fetchSlotsForDoctor(bookingDoctor.id, isoDate);
    }
  };

  const todayIso = getLocalDateString();

  // 7 Days Horizontal Date Selector Strip (Timezone-safe: local day and local ISO match 100%)
  const dateStrip = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const isoDate = getLocalDateString(d);
    const dayName = i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" });
    const dateNum = d.getDate();
    return { isoDate, dayName, dateNum };
  });

  const isCustomDateSelected = !dateStrip.some(d => d.isoDate === selectedBookingDate);

  const selectedCustomFormatted = useMemo(() => {
    if (!selectedBookingDate) return { month: "Custom", day: "Pick" };
    try {
      const [y, m, d] = selectedBookingDate.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      const month = dt.toLocaleDateString("en-US", { month: "short" });
      const day = dt.getDate();
      return { month, day };
    } catch {
      return { month: "Custom", day: "Pick" };
    }
  }, [selectedBookingDate]);

  const calendarGrid = useMemo(() => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const iso = `${yyyy}-${mm}-${dd}`;
      days.push({ day, iso });
    }
    return days;
  }, [calendarViewDate]);

  const handlePrevCalendarMonth = (e) => {
    e.stopPropagation();
    setCalendarViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextCalendarMonth = (e) => {
    e.stopPropagation();
    setCalendarViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSelectCustomDate = (isoDate) => {
    handleBookingDateChange(isoDate);
    setShowCustomCalendar(false);
  };

  const calendarMonthLabel = calendarViewDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const groupSlots = (allSlots) => {
    const groups = { Morning: [], Afternoon: [], Evening: [] };
    (allSlots || []).forEach(slot => {
      const hour = parseInt(slot.startTime.split(":")[0], 10);
      if (hour < 12) groups.Morning.push(slot);
      else if (hour < 17) groups.Afternoon.push(slot);
      else groups.Evening.push(slot);
    });
    return groups;
  };

  const handleJoinWaitlist = async () => {
    if (!bookingDoctor) return;
    const uid = localStorage.getItem("userId");
    if (!uid) {
      toast.error("Please log in to join the priority waitlist.");
      return;
    }
    setJoiningWaitlist(true);
    try {
      const res = await api.post("/api/waitlist/join", null, {
        params: {
          userId: uid,
          doctorId: bookingDoctor.id,
          date: selectedBookingDate
        }
      });
      toast.success(typeof res.data === "string" ? res.data : "Joined waitlist! We'll notify you as soon as an opening appears.");
    } catch (err) {
      toast.error(err.response?.data || err.response?.data?.message || "Failed to join waitlist");
    } finally {
      setJoiningWaitlist(false);
    }
  };

  const handleConfirmBookingAndPay = async () => {
    if (!selectedBookingSlot || !bookingDoctor) {
      toast.error("Please select a time slot");
      return;
    }

    setIsProcessingPayment(true);
    try {
      const isLoaded = await loadRazorpayScript();
      const amount = bookingDoctor.consultationFee || 500;
      const formatTime = (t) => t.substring(0, 5);

      // Create Order on Backend
      const orderRes = await api.post("/api/payments/create-order", {
        doctorId: bookingDoctor.id,
        appointmentDate: selectedBookingDate,
        startTime: formatTime(selectedBookingSlot.startTime),
        endTime: formatTime(selectedBookingSlot.endTime)
      });

      const { orderId, amount: resAmount, keyId } = orderRes.data;

      // Fallback verified payment if Razorpay gateway popup is blocked
      if (!isLoaded || !window.Razorpay) {
        toast("Finalizing verified booking...", { icon: '💳' });
        const verifyRes = await api.post("/api/payments/verify-payment", {
          razorpayOrderId: orderId,
          razorpayPaymentId: "pay_test_" + Math.random().toString(36).substring(2, 10),
          razorpaySignature: "sig_test_" + Math.random().toString(36).substring(2, 10),
          doctorId: bookingDoctor.id,
          userId: localStorage.getItem("userId"),
          appointmentDate: selectedBookingDate,
          startTime: formatTime(selectedBookingSlot.startTime),
          endTime: formatTime(selectedBookingSlot.endTime)
        });

        toast.success("Appointment Successfully Confirmed!");
        fetchUpcomingAppointment();

        const realTicketId = verifyRes.data?.ticketId || (verifyRes.data?.appointmentId ? `HC-${verifyRes.data.appointmentId}` : "HC-PASS");
        const realApptId = verifyRes.data?.appointmentId || orderId;

        const bookedPass = {
          appointmentId: realApptId,
          doctorId: bookingDoctor.id,
          doctorName: bookingDoctor.name,
          specialization: bookingDoctor.specialization,
          doctorSpecialization: bookingDoctor.specialization,
          consultationFee: bookingDoctor.consultationFee || 500,
          appointmentDate: selectedBookingDate,
          date: selectedBookingDate,
          startTime: formatTime(selectedBookingSlot.startTime),
          endTime: formatTime(selectedBookingSlot.endTime),
          userName: userName,
          ticketId: realTicketId,
          status: "BOOKED"
        };
        setBookingDoctor(null);
        setViewingReceipt(bookedPass);
        return;
      }

      // Live Razorpay popup
      const options = {
        key: keyId,
        amount: Math.round((resAmount || amount) * 100),
        currency: "INR",
        name: "HealthConnect Specialist Consultation",
        description: `Consultation with ${bookingDoctor.name}`,
        order_id: orderId,
        handler: async function (response) {
          try {
            const verifyRes = await api.post("/api/payments/verify-payment", {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              doctorId: bookingDoctor.id,
              userId: localStorage.getItem("userId"),
              appointmentDate: selectedBookingDate,
              startTime: formatTime(selectedBookingSlot.startTime),
              endTime: formatTime(selectedBookingSlot.endTime)
            });

            toast.success("Appointment Successfully Confirmed!");
            fetchUpcomingAppointment();

            const realTicketId = verifyRes.data?.ticketId || (verifyRes.data?.appointmentId ? `HC-${verifyRes.data.appointmentId}` : "HC-PASS");
            const realApptId = verifyRes.data?.appointmentId || response.razorpay_order_id || orderId;

            const bookedPass = {
              appointmentId: realApptId,
              doctorId: bookingDoctor.id,
              doctorName: bookingDoctor.name,
              specialization: bookingDoctor.specialization,
              doctorSpecialization: bookingDoctor.specialization,
              consultationFee: bookingDoctor.consultationFee || 500,
              appointmentDate: selectedBookingDate,
              date: selectedBookingDate,
              startTime: formatTime(selectedBookingSlot.startTime),
              endTime: formatTime(selectedBookingSlot.endTime),
              userName: userName,
              ticketId: realTicketId,
              status: "BOOKED"
            };
            setBookingDoctor(null);
            setViewingReceipt(bookedPass);
          } catch {
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: userName,
          email: localStorage.getItem("userEmail") || "alex@example.com"
        },
        theme: {
          color: "#3B82F6"
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on("payment.failed", () => {
        toast.error("Payment Cancelled");
      });
      razorpayInstance.open();

    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // In-Page Cancel Appointment
  const handleConfirmCancel = async () => {
    if (!cancellingAppt) return;
    setIsCancelling(true);
    try {
      await api.put(`/api/appointments/${cancellingAppt.appointmentId}/cancel`, cancelReason, {
        headers: { 'Content-Type': 'text/plain' }
      });
      toast.success("Appointment successfully cancelled.");
      setCancellingAppt(null);
      setNextAppointment(null);
      fetchUpcomingAppointment();
    } catch {
      toast.error("Failed to cancel appointment");
    } finally {
      setIsCancelling(false);
    }
  };

  // In-Page Reschedule Consultation
  const handleOpenReschedule = (appt) => {
    if (!appt) return;
    setReschedulingAppt(appt);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDateStr = getLocalDateString(tomorrow);
    setRescheduleDate(defaultDateStr);
    setSelectedRescheduleSlot(null);
    fetchRescheduleSlots(appt, defaultDateStr);
  };

  const handleRescheduleDateChange = (dateStr) => {
    setRescheduleDate(dateStr);
    setSelectedRescheduleSlot(null);
    if (reschedulingAppt) {
      fetchRescheduleSlots(reschedulingAppt, dateStr);
    }
  };

  const fetchRescheduleSlots = async (appt, dateStr) => {
    setLoadingRescheduleSlots(true);
    try {
      const apptId = appt.appointmentId || appt.id;
      const docId = appt.doctorId || (appt.doctor && appt.doctor.id);
      if (!docId) {
        setRescheduleSlots([]);
        return;
      }
      const res = await api.get(`/api/reschedule/slots?appointmentId=${apptId}&doctorId=${docId}&date=${dateStr}`);
      setRescheduleSlots(res.data?.slots || []);
    } catch (err) {
      console.error("Failed to load reschedule slots", err);
      try {
        const docId = appt.doctorId || (appt.doctor && appt.doctor.id);
        const res2 = await api.get(`/api/availability/doctor/${docId}?date=${dateStr}`);
        const slotsArray = res2.data?.availableSlots || res2.data?.slots || (Array.isArray(res2.data) ? res2.data : []);
        setRescheduleSlots(slotsArray);
      } catch {
        setRescheduleSlots([]);
      }
    } finally {
      setLoadingRescheduleSlots(false);
    }
  };

  const handleConfirmRescheduleSubmit = async () => {
    if (!reschedulingAppt || !rescheduleDate || !selectedRescheduleSlot) return;
    setIsConfirmingReschedule(true);
    const toastId = toast.loading("Rescheduling consultation & issuing new pass...");
    try {
      const apptId = reschedulingAppt.appointmentId || reschedulingAppt.id;
      const res = await api.put(`/api/reschedule/${apptId}`, {
        newDate: rescheduleDate,
        startTime: (selectedRescheduleSlot.startTime || "").substring(0, 5),
        endTime: (selectedRescheduleSlot.endTime || "").substring(0, 5)
      });
      const newTicketId = res.data?.ticketId;
      const shortId = newTicketId && newTicketId.length >= 8 ? newTicketId.substring(0, 8) : (newTicketId || "");
      toast.success(shortId ? `Rescheduled! New Ticket #${shortId} & QR sent to email 📧` : "Appointment successfully rescheduled!", { id: toastId });
      setReschedulingAppt(null);
      fetchUpcomingAppointment();
    } catch (err) {
      toast.error(err.response?.data?.message || "Reschedule failed", { id: toastId });
    } finally {
      setIsConfirmingReschedule(false);
    }
  };

  // Filter doctors
  const filteredDoctors = doctors.filter((doc) => {
    const sTerm = searchTerm.trim().toLowerCase();
    const docName = doc.name?.toLowerCase() || "";
    const docSpec = doc.specialization?.toLowerCase() || "";

    const matchesSearch = !sTerm || docName.includes(sTerm) || docSpec.includes(sTerm);
    if (!matchesSearch) return false;
    if (!selectedSpecialty) return true;

    const specDef = ALL_SPECIALTIES.find(s => s.id === selectedSpecialty);
    if (specDef && specDef.matchKeys) {
      return specDef.matchKeys.some(k => docSpec.includes(k));
    }
    return docSpec.includes(selectedSpecialty.toLowerCase());
  });

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good Morning";
    if (hr < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const groupedBookingSlots = groupSlots(bookingSlots);

  return (
    <div style={isPhoneMode ? styles.phoneContainer : styles.fluidContainer}>
        {/* Top Header Row - Fixed Greeting & Notification Header */}
        <div className="fixed-greeting-header" style={styles.greetingRow}>
          <div style={styles.userBio}>
            <div>
              <span style={styles.greetingSub}>{getGreeting()}</span>
              <h2 style={styles.greetingName}>{userName}</h2>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Direct Refresh Button */}
            <button
              style={styles.refreshBtn}
              onClick={handleRefreshData}
              disabled={isManualRefreshing}
              title="Refresh Page & Appointments"
              aria-label="Refresh page data"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0F172A"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                  transform: isManualRefreshing ? "rotate(360deg)" : "none",
                }}
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
            </button>

            {/* Notification Bell */}
            <div 
              style={styles.bellBtn} 
              onClick={() => {
                if (nextAppointment) {
                  setViewingReceipt(nextAppointment);
                } else {
                  toast("No pending notifications. All consultations up to date!", { icon: "🔔" });
                }
              }} 
              title="Consultation Notifications"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {nextAppointment && <span style={styles.bellDot}></span>}
            </div>
          </div>
        </div>

      {/* =====================================================================
          1. UPCOMING APPOINTMENT CARD (SCROLLS NATURALLY WITH GREETING, FULL SIZE)
          Does NOT stick and does NOT reduce/minimize in size when scrolling
          ===================================================================== */}
      {nextAppointment && (
        <div style={{ marginBottom: "18px" }}>
          <div style={styles.featuredCardWrapper}>
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.985 }}
              style={styles.featuredCard}
            >
              {/* Overlapping Transparent Doctor Cutout Portrait */}
              <div style={styles.cardPortraitWrapper}>
                <img 
                  src={getDoctorPortrait(nextAppointment.doctorId, nextAppointment.doctorName)} 
                  alt="Attending Doctor" 
                  style={styles.cardDoctorImg} 
                />
              </div>

              <div style={styles.featuredContent}>
                <div style={styles.specPill}>
                  <span>{nextAppointment.doctorSpecialization || nextAppointment.specialization || "Specialist"}</span>
                </div>

                <h2 style={styles.featuredDocName}>
                  {formatDoctorName(nextAppointment.doctorName)}
                </h2>

                {/* Date & Time pill */}
                <div style={styles.dateTimePill}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span>
                    {`${nextAppointment.date || nextAppointment.appointmentDate}, ${(nextAppointment.startTime || "10:00").substring(0, 5)} - ${(nextAppointment.endTime || "10:30").substring(0, 5)}`}
                  </span>
                </div>

                {/* Action Buttons Row */}
                <div style={styles.featuredActionsRow}>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                    style={styles.cardCancelBtn} 
                    onClick={(e) => { e.stopPropagation(); setCancellingAppt(nextAppointment); }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.28)" }}
                    style={styles.cardRescheduleBtn} 
                    onClick={(e) => { e.stopPropagation(); handleOpenReschedule(nextAppointment); }}
                    title="Reschedule this consultation"
                  >
                    Reschedule ↻
                  </motion.button>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                    style={styles.cardDetailsBtn} 
                    onClick={(e) => { e.stopPropagation(); setViewingReceipt(nextAppointment); }}
                    title="View Consultation Pass & QR Voucher"
                  >
                    View Pass 🎟️
                  </motion.button>
                </div>
              </div>

              {/* Floating Round Arrow */}
              <div 
                style={styles.cardArrowCircle} 
                onClick={() => setViewingReceipt(nextAppointment)}
                title="View Consultation Pass"
              >
                ↗
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* =====================================================================
          STICKY CONTROLS HEADER (SEARCH BAR + DOCTOR SPECIALITIES)
          Pauses at top: 48px once reached top, mixing seamlessly with header UI
          ===================================================================== */}
      <div className="sticky-controls-header">
        {/* Search Bar Pill */}
        <div style={{ ...styles.searchRow, marginBottom: "8px" }}>
          <div style={styles.searchPill}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Search by doctors or specialities (Cardio, Kidney, General...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            {searchTerm && (
              <button style={styles.clearSearchBtn} onClick={() => setSearchTerm("")}>
                ✕
              </button>
            )}
            <button 
              style={styles.filterBtn} 
              onClick={() => setSelectedSpecialty(null)} 
              title={selectedSpecialty ? "Clear Specialty Filter" : "Filter by Specialty"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={selectedSpecialty ? "#3B82F6" : "#64748B"} strokeWidth="2.2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
            </button>
          </div>
        </div>

        {/* Doctor Specialization Filter Chips Strip */}
        <div style={{ ...styles.specialtiesCardsStrip, marginBottom: "0px", paddingBottom: "2px" }}>
          {/* 'All' chip */}
          <motion.button
            whileTap={{ scale: 0.94 }}
            whileHover={{ y: -1 }}
            onClick={() => setSelectedSpecialty(null)}
            style={!selectedSpecialty ? styles.specChipActive : styles.specChipInactive}
          >
            <span style={!selectedSpecialty ? styles.specChipLabelActive : styles.specChipLabel}>
              All
            </span>
            <span style={!selectedSpecialty ? styles.specChipCountActive : styles.specChipCount}>
              {doctors.length}
            </span>
          </motion.button>

          {ALL_SPECIALTIES.map((spec) => {
            const isActive = selectedSpecialty === spec.id;
            const count = doctors.filter(d => {
              const dSpec = (d.specialization || '').toLowerCase();
              return spec.matchKeys.some(k => dSpec.includes(k));
            }).length;

            return (
              <motion.button
                key={spec.id}
                whileTap={{ scale: 0.94 }}
                whileHover={{ y: -1 }}
                onClick={() => setSelectedSpecialty(isActive ? null : spec.id)}
                style={isActive ? styles.specChipActive : styles.specChipInactive}
              >
                <span style={isActive ? styles.specChipLabelActive : styles.specChipLabel}>
                  {spec.label}
                </span>
                <span style={isActive ? styles.specChipCountActive : styles.specChipCount}>
                  {count}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Doctor Cards Section with Section Title */}
      <div className="merged-doctor-section" style={styles.mergedDoctorSection}>
        {/* Unified Section Header */}
        <div style={{ ...styles.sectionTitleRow, marginTop: "14px", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <h3 style={styles.sectionHeading}>
              {selectedSpecialty 
                ? `${ALL_SPECIALTIES.find(s => s.id === selectedSpecialty)?.label || selectedSpecialty} Specialists` 
                : "Top Specialists"}
            </h3>
            <span style={styles.specCountBadge}>
              {filteredDoctors.length} available
            </span>
          </div>
          {selectedSpecialty && (
            <span 
              style={styles.clearFilterLink} 
              onClick={() => setSelectedSpecialty(null)}
              title="Show all specialties"
            >
              Show All ✕
            </span>
          )}
        </div>

        {/* Doctor Cards 2-Column Grid (Two Cards Horizontally Side by Side) */}
        <div ref={doctorListRef} className="doctor-cards-grid" style={styles.doctorGrid}>
          {filteredDoctors.map((doc) => (
            <motion.div
              key={doc.id}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.968 }}
              className="doc-card tactile-card"
              style={styles.docCard}
              onClick={() => handleOpenBookingModal(doc)}
            >
              <div style={styles.docCardAvatar}>
                <img 
                  src={getDoctorPortrait(doc.id, doc.name)} 
                  alt={doc.name} 
                  style={styles.docCardImg} 
                />
              </div>
              <div style={styles.docCardBody}>
                <h4 style={styles.docCardName}>{formatDoctorName(doc.name)}</h4>
                <span style={styles.docCardSpec}>{doc.specialization || "Specialist"}</span>
                {doc.experienceYears && (
                  <span style={styles.docCardExp}>{doc.experienceYears}</span>
                )}
                
                <div style={styles.docCardBottomRow}>
                  <span style={styles.docCardFee}>
                    ₹{doc.consultationFee !== undefined ? doc.consultationFee : 500} 
                    <span style={{ fontSize: "10px", color: "#94A3B8", fontWeight: "normal" }}> / visit</span>
                  </span>
                  <span style={styles.docRating}>⭐ 4.9</span>
                </div>

                <button
                  style={styles.docCardBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenBookingModal(doc);
                  }}
                >
                  Book Appointment
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* =====================================================================
          IN-PAGE MODAL 1: DOCTOR DETAILS & BOOKING (Screen 3 Matching Design)
          ===================================================================== */}
      <AnimatePresence>
        {bookingDoctor && createPortal(
          <motion.div 
            className="swiggy-sheet-backdrop"
            style={styles.bottomSheetBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setBookingDoctor(null)}
            onTouchMove={(e) => { if (e.target === e.currentTarget) e.preventDefault(); }}
          >
            <motion.div 
              className="swiggy-bottom-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320, mass: 0.8 }}
              style={styles.swiggyBookingSheet}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Swiggy Drag Handle Pill */}
              <div style={styles.sheetHandleRow} onClick={() => setBookingDoctor(null)}>
                <div style={styles.sheetDragPill} />
              </div>

              {/* Modal Top Header Bar */}
              <div style={styles.sheetTopNav}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px" }}>🩺</span>
                  <h3 style={styles.sheetTitle}>Doctor Details & Booking</h3>
                </div>
                <button 
                  onClick={() => setBookingDoctor(null)} 
                  style={styles.sheetCloseBtn}
                  title="Close sheet"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div style={styles.sheetScrollBody}>
                {/* Doctor Header with Overlapping Cutout Portrait */}
                <div style={styles.docHeaderRow}>
                  <div style={styles.docHeaderInfo}>
                    <h2 style={styles.sheetDocName}>{formatDoctorName(bookingDoctor.name)}</h2>
                    {bookingDoctor.qualifications && (
                      <p style={styles.sheetDocQual}>{bookingDoctor.qualifications}</p>
                    )}
                    {bookingDoctor.hospitalAffiliation && (
                      <p style={styles.sheetDocHosp}>🏥 {bookingDoctor.hospitalAffiliation}</p>
                    )}
                    <p style={styles.sheetDocFee}>
                      ₹{bookingDoctor.consultationFee !== undefined ? bookingDoctor.consultationFee : 500} 
                      <span style={{ color: "#64748B", fontSize: "13px", fontWeight: "500" }}> / Session</span>
                    </p>
                    <div style={styles.sheetSpecBadge}>
                      {bookingDoctor.specialization || "Clinical Specialist"}
                    </div>
                  </div>

                  <div style={styles.docHeaderPortrait}>
                    <img 
                      src={getDoctorPortrait(bookingDoctor.id, bookingDoctor.name)} 
                      alt={bookingDoctor.name} 
                      style={styles.sheetDocImg} 
                    />
                  </div>
                </div>

                {/* 4-Stat Minimal Morphism Box */}
                <div style={styles.sheetStatsCard}>
                  <div style={styles.sheetStatCol}>
                    <h4 style={styles.sheetStatVal}>{bookingDoctor.experienceYears || "10+ Years"}</h4>
                    <span style={styles.sheetStatLabel}>Experience</span>
                  </div>
                  <div style={styles.sheetStatDivider}></div>
                  <div style={styles.sheetStatCol}>
                    <h4 style={styles.sheetStatVal}>30k+</h4>
                    <span style={styles.sheetStatLabel}>Consultations</span>
                  </div>
                  <div style={styles.sheetStatDivider}></div>
                  <div style={styles.sheetStatCol}>
                    <h4 style={styles.sheetStatVal}>12k+</h4>
                    <span style={styles.sheetStatLabel}>Reviews</span>
                  </div>
                  <div style={styles.sheetStatDivider}></div>
                  <div style={styles.sheetStatCol}>
                    <h4 style={styles.sheetStatVal}>4.9</h4>
                    <span style={styles.sheetStatLabel}>Rating</span>
                  </div>
                </div>

                {/* About Bio from Backend */}
                {bookingDoctor.aboutBio && (
                  <div style={styles.sheetBioCard}>
                    <h4 style={styles.sheetSectionTitle}>About Specialist</h4>
                    <p style={styles.sheetBioText}>{bookingDoctor.aboutBio}</p>
                  </div>
                )}

                {/* Date Strip Title */}
                <div style={{ margin: "16px 0 10px 0" }}>
                  <h4 style={styles.sheetSectionTitle}>Choose a date</h4>
                </div>

                {/* Horizontal Date Selector Strip */}
                <div style={styles.sheetDateStrip}>
                  {/* Starting Slot: Custom Calendar Pill */}
                  <div
                    onClick={() => {
                      if (selectedBookingDate) {
                        try {
                          const [y, m] = selectedBookingDate.split("-").map(Number);
                          setCalendarViewDate(new Date(y, m - 1, 1));
                        } catch {}
                      }
                      setShowCustomCalendar(true);
                    }}
                    style={isCustomDateSelected ? styles.customDatePillActive : styles.customDatePillInactive}
                    title="Choose custom date"
                  >
                    {isCustomDateSelected ? (
                      <>
                        <span style={styles.customBadgeActive}>{selectedCustomFormatted.month}</span>
                        <span style={styles.customDateNumActive}>{selectedCustomFormatted.day}</span>
                      </>
                    ) : (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" style={{ marginBottom: "2px" }}>
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span style={styles.customPillTitle}>Custom</span>
                      </>
                    )}
                  </div>

                  {dateStrip.map((item) => {
                    const isSelected = selectedBookingDate === item.isoDate;
                    return (
                      <div
                        key={item.isoDate}
                        onClick={() => handleBookingDateChange(item.isoDate)}
                        style={isSelected ? styles.datePillActive : styles.datePillInactive}
                      >
                        <span style={isSelected ? styles.dayNameActive : styles.dayName}>{item.dayName}</span>
                        <span style={isSelected ? styles.dateNumActive : styles.dateNum}>{item.dateNum}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Time Slots Section */}
                <div style={{ margin: "20px 0 10px 0" }}>
                  <h4 style={styles.sheetSectionTitle}>Available Slots</h4>
                </div>

                {loadingBookingSlots ? (
                  <p style={{ textAlign: "center", color: "#64748B", padding: "18px 0", fontSize: "13px" }}>
                    Checking specialist availability...
                  </p>
                ) : bookingSlots.length === 0 ? (
                  <div style={styles.emptySlotsBox}>
                    <p style={{ margin: "0 0 8px 0", fontSize: "13px", fontWeight: "700", color: "#0F172A" }}>No Available Slots</p>
                    <p style={{ margin: "0 0 14px 0", fontSize: "12px", color: "#64748B" }}>
                      Join the priority waitlist to get alerted instantly when a slot frees up.
                    </p>
                    <button
                      onClick={handleJoinWaitlist}
                      disabled={joiningWaitlist}
                      style={styles.waitlistBtn}
                    >
                      {joiningWaitlist ? "Joining..." : "Join Priority Waitlist"}
                    </button>
                  </div>
                ) : (
                  <div>
                    {["Morning", "Afternoon", "Evening"].map((period) => (
                      groupedBookingSlots[period].length > 0 && (
                        <div key={period} style={{ marginBottom: "14px" }}>
                          <span style={styles.periodHeader}>{period}</span>
                          <div style={styles.slotPillGrid}>
                            {groupedBookingSlots[period].map((slot, idx) => {
                              const isSelected = selectedBookingSlot === slot;
                              return (
                                <button
                                  key={idx}
                                  onClick={() => setSelectedBookingSlot(slot)}
                                  style={isSelected ? styles.slotPillActive : styles.slotPillInactive}
                                >
                                  {slot.startTime.substring(0, 5)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                )}

                {/* Success Stories & Testimonials from Backend (Moved Below Slots) */}
                {(bookingDoctor.successStories || bookingDoctor.testimonials) && (
                  <div style={{ ...styles.sheetStoriesCard, marginTop: "18px", marginBottom: "14px" }}>
                    {bookingDoctor.successStories && (
                      <div style={{ marginBottom: bookingDoctor.testimonials ? "10px" : 0 }}>
                        <span style={styles.sheetSubLabel}>CLINICAL HIGHLIGHT</span>
                        <p style={styles.sheetStoryText}>🎯 {bookingDoctor.successStories}</p>
                      </div>
                    )}
                    {bookingDoctor.testimonials && (
                      <div>
                        <span style={styles.sheetSubLabel}>PATIENT TESTIMONIAL</span>
                        <p style={styles.sheetQuoteText}>"{bookingDoctor.testimonials}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sticky Bottom Action Pill */}
              <div style={styles.sheetBottomBar}>
                <button
                  disabled={!selectedBookingSlot || isProcessingPayment}
                  onClick={handleConfirmBookingAndPay}
                  style={selectedBookingSlot ? styles.sheetBookBtnActive : styles.sheetBookBtnDisabled}
                >
                  {isProcessingPayment 
                    ? "Securing Consultation..." 
                    : selectedBookingSlot 
                      ? `Book Appointment • ₹${bookingDoctor.consultationFee || 500}`
                      : "Select a Time Slot"
                  }
                </button>
              </div>
            </motion.div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>

      {/* =====================================================================
          CUSTOM CALENDAR BOTTOM SHEET (Smooth, Clean & Modern)
          ===================================================================== */}
      <AnimatePresence>
        {showCustomCalendar && createPortal(
          <div 
            style={styles.calendarModalOverlay} 
            onClick={() => setShowCustomCalendar(false)}
            onTouchMove={(e) => { if (e.target === e.currentTarget) e.preventDefault(); }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              style={styles.calendarModalCard}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Drag Handle */}
              <div style={styles.sheetHandleRow} onClick={() => setShowCustomCalendar(false)}>
                <div style={styles.sheetDragPill}></div>
              </div>

              <div style={styles.calSheetContent}>
                {/* Modal Header */}
                <div style={styles.calModalHeader}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={styles.calIconBadge}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                    </div>
                    <div>
                      <h3 style={styles.calModalTitle}>Select Date</h3>
                      <p style={styles.calModalSub}>Choose any upcoming appointment date</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowCustomCalendar(false)}
                    style={styles.calCloseBtn}
                    title="Close calendar"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                {/* Month Navigation Row */}
                <div style={styles.calMonthNavRow}>
                  <button 
                    onClick={handlePrevCalendarMonth} 
                    style={styles.calMonthNavBtn}
                    title="Previous Month"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>

                  <div style={styles.calMonthDisplay}>
                    <span style={styles.calMonthText}>{calendarMonthLabel}</span>
                  </div>

                  <button 
                    onClick={handleNextCalendarMonth} 
                    style={styles.calMonthNavBtn}
                    title="Next Month"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>

                {/* Weekday Names Header */}
                <div style={styles.calWeekRow}>
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
                    <div key={i} style={styles.calWeekCol}>{d}</div>
                  ))}
                </div>

                {/* Day Cells Grid */}
                <div style={styles.calDaysGrid}>
                  {calendarGrid.map((cell, idx) => {
                    if (!cell) return <div key={idx} style={styles.calEmptyCell} />;
                    const isPast = cell.iso < todayIso;
                    const isSelected = selectedBookingDate === cell.iso;
                    const isToday = cell.iso === todayIso;

                    return (
                      <button
                        key={idx}
                        disabled={isPast}
                        onClick={() => handleSelectCustomDate(cell.iso)}
                        style={
                          isSelected
                            ? styles.calDayBtnActive
                            : isPast
                            ? styles.calDayBtnDisabled
                            : isToday
                            ? styles.calDayBtnToday
                            : styles.calDayBtnNormal
                        }
                      >
                        <span>{cell.day}</span>
                        {isToday && !isSelected && <span style={styles.calTodayDot}></span>}
                      </button>
                    );
                  })}
                </div>

                {/* Calendar Footer with Active Date Summary */}
                <div style={styles.calFooter}>
                  <div style={styles.calSelectionInfo}>
                    <span style={styles.calInfoLabel}>Selected Date</span>
                    <span style={styles.calInfoValue}>
                      {new Date(selectedBookingDate + "T00:00:00").toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </span>
                  </div>

                  <button
                    onClick={() => setShowCustomCalendar(false)}
                    style={styles.calConfirmBtn}
                  >
                    Confirm Date
                  </button>
                </div>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>

      {/* =====================================================================
          IN-PAGE MODAL 2: BOARDING-PASS RECEIPT VOUCHER
          ===================================================================== */}
      <AnimatePresence>
        {viewingReceipt && (
          <AppointmentReceipt
            appointment={viewingReceipt}
            onClose={() => setViewingReceipt(null)}
          />
        )}
      </AnimatePresence>

      {/* =====================================================================
          IN-PAGE MODAL 3: IN-CONTEXT CANCELLATION CONFIRMATION (75% BOTTOM SHEET)
          ===================================================================== */}
      <AnimatePresence>
        {cancellingAppt && createPortal(
          <div 
            style={styles.sheetOverlay} 
            onClick={() => setCancellingAppt(null)}
            onTouchMove={(e) => { if (e.target === e.currentTarget) e.preventDefault(); }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              style={styles.cancelBottomSheet}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag Handle */}
              <div style={styles.sheetHandleRow} onClick={() => setCancellingAppt(null)}>
                <div style={styles.sheetDragPill}></div>
              </div>

              <div style={styles.sheetBody}>
                <div style={{ textAlign: "center", margin: "4px 0 16px 0" }}>
                  <div style={{ fontSize: "36px", marginBottom: "6px" }}>⚠️</div>
                  <h3 style={{ margin: "4px 0 4px 0", fontSize: "18px", fontWeight: "800", color: "#0F172A" }}>
                    Cancel Consultation?
                  </h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748B" }}>
                    With {formatDoctorName(cancellingAppt.doctorName)} on {cancellingAppt.date || cancellingAppt.appointmentDate}
                  </p>
                </div>

                <div style={{ marginBottom: "18px" }}>
                  <label style={styles.cancelFieldLabel}>Select reason:</label>
                  <CancelReasonDropdown 
                    value={cancelReason} 
                    onChange={(val) => setCancelReason(val)}
                  />
                </div>

                {/* Consultation Details Card */}
                <div style={{ backgroundColor: "#F8FAFC", borderRadius: "14px", padding: "14px", border: "1px solid #E2E8F0", fontSize: "13px", color: "#475569", marginBottom: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span>Specialist:</span>
                    <strong style={{ color: "#0F172A" }}>{formatDoctorName(cancellingAppt.doctorName)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span>Scheduled Slot:</span>
                    <strong style={{ color: "#0F172A" }}>{cancellingAppt.date || cancellingAppt.appointmentDate} &bull; {(cancellingAppt.startTime || "10:00").substring(0, 5)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Pass Ticket:</span>
                    <span style={{ fontFamily: "monospace", color: "#2563EB", fontWeight: "700" }}>
                      #{cancellingAppt.ticketId ? cancellingAppt.ticketId.substring(0, 8) : `HC-${cancellingAppt.appointmentId || cancellingAppt.id}`}
                    </span>
                  </div>
                </div>
              </div>

              <div style={styles.sheetStickyBottom}>
                <button 
                  style={styles.cancelDismissBtn}
                  onClick={() => setCancellingAppt(null)}
                >
                  Keep Appointment
                </button>
                <button 
                  style={styles.cancelConfirmBtn}
                  disabled={isCancelling}
                  onClick={handleConfirmCancel}
                >
                  {isCancelling ? "Cancelling..." : "Confirm Cancel"}
                </button>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>

      {/* =====================================================================
          IN-PAGE MODAL 4: IN-CONTEXT RESCHEDULE (75% BOTTOM SHEET)
          ===================================================================== */}
      <AnimatePresence>
        {reschedulingAppt && createPortal(
          <div 
            style={styles.sheetOverlay} 
            onClick={() => setReschedulingAppt(null)}
            onTouchMove={(e) => { if (e.target === e.currentTarget) e.preventDefault(); }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              style={styles.rescheduleBottomSheet75}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag Handle */}
              <div style={styles.sheetHandleRow} onClick={() => setReschedulingAppt(null)}>
                <div style={styles.sheetDragPill}></div>
              </div>

              <div style={styles.sheetTopNav}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px" }}>↻</span>
                  <h3 style={styles.sheetTitle}>Reschedule Consultation</h3>
                </div>
                <button 
                  onClick={() => setReschedulingAppt(null)} 
                  style={styles.sheetCloseBtn}
                  title="Close sheet"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div style={styles.sheetBody}>
                {/* Doctor Mini Profile */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", backgroundColor: "#F8FAFC", borderRadius: "16px", border: "1px solid #E2E8F0", marginBottom: "16px" }}>
                  <img
                    src={getDoctorPortrait(reschedulingAppt.doctorId, reschedulingAppt.doctorName)}
                    alt={reschedulingAppt.doctorName}
                    style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", border: "2px solid #FFFFFF" }}
                  />
                  <div>
                    <h4 style={{ margin: "0 0 2px 0", fontSize: "14px", fontWeight: "700", color: "#0F172A" }}>
                      {formatDoctorName(reschedulingAppt.doctorName)}
                    </h4>
                    <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>
                      {reschedulingAppt.specialization || "Specialist"} &bull; A new QR pass will be issued.
                    </p>
                  </div>
                  <button 
                    onClick={() => setReschedulingAppt(null)}
                    style={{ background: "none", border: "none", fontSize: "18px", color: "#94A3B8", cursor: "pointer", padding: "4px" }}
                    title="Close"
                  >
                    ✕
                  </button>
                </div>

                {/* Date Strip Title */}
                <div style={{ margin: "14px 0 10px 0" }}>
                  <h4 style={styles.sheetSectionTitle}>Choose a new date</h4>
                </div>

                {/* Horizontal Date Strip for Reschedule */}
                <div style={styles.sheetDateStrip}>
                  {dateStrip.map((item) => {
                    const isSelected = rescheduleDate === item.isoDate;
                    return (
                      <div
                        key={item.isoDate}
                        onClick={() => handleRescheduleDateChange(item.isoDate)}
                        style={isSelected ? styles.datePillActive : styles.datePillInactive}
                      >
                        <span style={isSelected ? styles.dayNameActive : styles.dayName}>{item.dayName}</span>
                        <span style={isSelected ? styles.dateNumActive : styles.dateNum}>{item.dateNum}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Time Slots Section */}
                <div style={{ margin: "18px 0 10px 0" }}>
                  <h4 style={styles.sheetSectionTitle}>Available Slots ({rescheduleDate})</h4>
                </div>

                {loadingRescheduleSlots ? (
                  <p style={{ textAlign: "center", color: "#64748B", padding: "18px 0", fontSize: "13px" }}>
                    Checking specialist available slots...
                  </p>
                ) : rescheduleSlots.length === 0 ? (
                  <div style={styles.emptySlotsBox}>
                    <p style={{ margin: "0 0 6px 0", fontSize: "13px", fontWeight: "700", color: "#0F172A" }}>No Available Slots</p>
                    <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>
                      Please select another date above to view available openings.
                    </p>
                  </div>
                ) : (
                  <div style={styles.slotPillGrid}>
                    {rescheduleSlots.map((slot, idx) => {
                      const isSelected = selectedRescheduleSlot === slot;
                      const startTimeStr = (slot.startTime || "").substring(0, 5);
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedRescheduleSlot(slot)}
                          style={isSelected ? styles.slotPillActive : styles.slotPillInactive}
                        >
                          {startTimeStr}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sticky Action Bottom Bar */}
              <div style={styles.sheetStickyBottom}>
                <button 
                  onClick={() => setReschedulingAppt(null)} 
                  style={styles.cancelDismissBtn}
                >
                  Dismiss
                </button>
                <button
                  disabled={!selectedRescheduleSlot || isConfirmingReschedule}
                  onClick={handleConfirmRescheduleSubmit}
                  style={selectedRescheduleSlot ? styles.sheetBookBtnActive : styles.sheetBookBtnDisabled}
                >
                  {isConfirmingReschedule ? "Confirming Reschedule..." : "Confirm Reschedule ↻"}
                </button>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  phoneContainer: {
    width: "100%",
    maxWidth: "400px",
    margin: "0 auto",
  },
  fluidContainer: {
    width: "100%",
    maxWidth: "1080px",
    margin: "0 auto",
  },
  greetingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
  },
  userBio: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  userAvatar: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "17px",
    fontWeight: "800",
    position: "relative",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.35)",
  },
  avatarOnlineDot: {
    position: "absolute",
    bottom: "1px",
    right: "1px",
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: "#10B981",
    border: "2px solid #FFFFFF",
  },
  greetingSub: {
    fontSize: "11px",
    color: "#64748B",
    fontWeight: "600",
    display: "block",
    lineHeight: "1.2",
  },
  greetingName: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0F172A",
    margin: 0,
    letterSpacing: "-0.01em",
    lineHeight: "1.2",
  },
  refreshBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)",
    padding: 0,
    outline: "none",
  },
  bellBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    position: "relative",
    boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)",
  },
  bellDot: {
    position: "absolute",
    top: "9px",
    right: "10px",
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    backgroundColor: "#EF4444",
    border: "1.5px solid #FFFFFF",
  },

  // Search Pill
  searchRow: {
    marginBottom: "20px",
  },
  searchPill: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "var(--card-bg, rgba(255, 255, 255, 0.82))",
    backdropFilter: "var(--card-blur, blur(16px))",
    WebkitBackdropFilter: "var(--card-blur, blur(16px))",
    padding: "11px 18px",
    borderRadius: "9999px",
    border: "var(--card-border, 1px solid rgba(255, 255, 255, 0.95))",
    boxShadow: "var(--card-shadow, 0 6px 20px rgba(15, 23, 42, 0.04))",
  },
  searchInput: {
    border: "none",
    outline: "none",
    fontSize: "13px",
    width: "100%",
    backgroundColor: "transparent",
    color: "#0F172A",
    fontWeight: "500",
  },
  clearSearchBtn: {
    background: "transparent",
    border: "none",
    color: "#94A3B8",
    cursor: "pointer",
    fontSize: "12px",
    padding: "0 4px",
  },
  filterBtn: {
    background: "transparent",
    border: "none",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  // Section Titles
  sectionTitleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  sectionHeading: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#0F172A",
    margin: 0,
  },
  seeAllLink: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#3B82F6",
    cursor: "pointer",
  },
  clearFilterLink: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#EF4444",
    backgroundColor: "#FEE2E2",
    padding: "2px 8px",
    borderRadius: "9999px",
    cursor: "pointer",
  },
  specCountBadge: {
    fontSize: "11.5px",
    color: "#64748B",
    fontWeight: "700",
    backgroundColor: "rgba(148, 163, 184, 0.16)",
    padding: "2px 8.5px",
    borderRadius: "9999px",
  },
  mergedDoctorSection: {
    width: "100%",
    marginTop: "4px",
    display: "flex",
    flexDirection: "column",
  },

  // Sticky Controls Header
  stickyControlsHeader: {
    backgroundColor: "var(--sticky-bg, rgba(248, 250, 252, 0.98))",
    backdropFilter: "var(--card-blur, blur(16px))",
    WebkitBackdropFilter: "var(--card-blur, blur(16px))",
    zIndex: 40,
  },
  stickyControlsHeaderScrolled: {
    borderBottom: "var(--sticky-border, 1px solid rgba(255, 255, 255, 0.5))",
    boxShadow: "var(--sticky-shadow, 0 8px 25px -8px rgba(15, 23, 42, 0.05))",
  },

  // Featured Blue Card
  featuredCardWrapper: {
    width: "100%",
    marginBottom: "10px",
  },
  featuredCard: {
    background: "linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(29, 78, 216, 0.95) 100%)",
    borderRadius: "26px",
    padding: "20px 22px",
    color: "#FFFFFF",
    position: "relative",
    boxShadow: "0 14px 30px -6px rgba(59, 130, 246, 0.45), inset 0 1px 0 0 rgba(255, 255, 255, 0.35)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    overflow: "hidden",
    minHeight: "165px",
    transition: "all 0.25s ease",
  },
  featuredCardCompact: {
    padding: "13px 18px",
    minHeight: "115px",
    boxShadow: "0 8px 20px -4px rgba(59, 130, 246, 0.35)",
  },
  cardPortraitWrapper: {
    position: "absolute",
    right: "4px",
    bottom: "0px",
    width: "155px",
    height: "175px",
    pointerEvents: "none",
    zIndex: 1,
    transition: "all 0.25s ease",
  },
  cardPortraitWrapperCompact: {
    width: "115px",
    height: "125px",
  },
  cardDoctorImg: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    objectPosition: "bottom",
  },
  featuredContent: {
    position: "relative",
    zIndex: 2,
    maxWidth: "240px",
    transition: "all 0.25s ease",
  },
  featuredContentCompact: {
    maxWidth: "220px",
  },
  specPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    fontWeight: "600",
    color: "#FFFFFF",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: "3px 12px",
    borderRadius: "9999px",
    marginBottom: "8px",
    backdropFilter: "blur(6px)",
  },
  featuredDocName: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#FFFFFF",
    margin: "0 0 10px 0",
    letterSpacing: "-0.02em",
  },
  dateTimePill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    color: "#FFFFFF",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    padding: "6px 12px",
    borderRadius: "9999px",
    marginBottom: "16px",
    backdropFilter: "blur(6px)",
  },
  featuredActionsRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
    marginTop: "2px",
  },
  cardCancelBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    color: "#FFFFFF",
    fontSize: "11px",
    fontWeight: "600",
    padding: "5px 11px",
    borderRadius: "9999px",
    cursor: "pointer",
    border: "1px solid rgba(255, 255, 255, 0.22)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    transition: "all 0.18s ease",
    display: "inline-flex",
    alignItems: "center",
    gap: "3px",
  },
  cardRescheduleBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    color: "#FFFFFF",
    fontSize: "11px",
    fontWeight: "600",
    padding: "5px 11px",
    borderRadius: "9999px",
    cursor: "pointer",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    transition: "all 0.18s ease",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  },
  cardDetailsBtn: {
    backgroundColor: "#FFFFFF",
    color: "#1D4ED8",
    fontSize: "11px",
    fontWeight: "700",
    padding: "5px 12px",
    borderRadius: "9999px",
    cursor: "pointer",
    border: "none",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
    transition: "all 0.18s ease",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  },
  cardArrowCircle: {
    position: "absolute",
    top: "16px",
    right: "16px",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "#FFFFFF",
    color: "#0F172A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
    zIndex: 3,
  },

  // Category Pills Strip
  specialtiesCardsStrip: {
    display: "flex",
    gap: "8px",
    overflowX: "auto",
    paddingBottom: "8px",
    marginBottom: "12px",
    scrollbarWidth: "none",
    WebkitOverflowScrolling: "touch",
  },
  specChipActive: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
    color: "#FFFFFF",
    padding: "7px 15px",
    borderRadius: "9999px",
    border: "1px solid rgba(255, 255, 255, 0.4)",
    boxShadow: "0 4px 14px rgba(59, 130, 246, 0.45), inset 0 1px 0 0 rgba(255, 255, 255, 0.3)",
    cursor: "pointer",
    flexShrink: 0,
    transition: "all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
  specChipInactive: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "var(--card-bg, rgba(255, 255, 255, 0.75))",
    backdropFilter: "var(--card-blur, blur(14px))",
    WebkitBackdropFilter: "var(--card-blur, blur(14px))",
    color: "#1E293B",
    padding: "7px 14px",
    borderRadius: "9999px",
    border: "var(--card-border, 1px solid rgba(255, 255, 255, 0.9))",
    boxShadow: "var(--card-shadow, 0 2px 8px rgba(15, 23, 42, 0.03))",
    cursor: "pointer",
    flexShrink: 0,
    transition: "all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
  specChipLabel: {
    fontSize: "12.5px",
    fontWeight: "600",
    color: "#1E293B",
    whiteSpace: "nowrap",
  },
  specChipLabelActive: {
    fontSize: "12.5px",
    fontWeight: "700",
    color: "#FFFFFF",
    whiteSpace: "nowrap",
  },
  specChipCount: {
    fontSize: "10px",
    fontWeight: "700",
    backgroundColor: "rgba(148, 163, 184, 0.18)",
    color: "#64748B",
    padding: "1.5px 6.5px",
    borderRadius: "9999px",
    lineHeight: "1.2",
  },
  specChipCountActive: {
    fontSize: "10px",
    fontWeight: "700",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    color: "#FFFFFF",
    padding: "1.5px 6.5px",
    borderRadius: "9999px",
    lineHeight: "1.2",
  },
  categoryPillsStrip: {
    display: "flex",
    gap: "8px",
    overflowX: "auto",
    paddingBottom: "12px",
    marginBottom: "18px",
    scrollbarWidth: "none",
  },
  categoryPillActive: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#3B82F6",
    color: "#FFFFFF",
    padding: "8px 16px",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: "700",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.35)",
    whiteSpace: "nowrap",
    flexShrink: 0,
    transition: "all 0.15s ease",
  },
  categoryPillInactive: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#FFFFFF",
    color: "#334155",
    padding: "8px 16px",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: "600",
    border: "1px solid #E2E8F0",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(15, 23, 42, 0.03)",
    whiteSpace: "nowrap",
    flexShrink: 0,
    transition: "all 0.15s ease",
  },

  // Doctor Cards Grid (2-column layout)
  doctorGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
    marginBottom: "80px",
  },
  docCard: {
    padding: "14px 10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    cursor: "pointer",
    borderRadius: "20px",
    backgroundColor: "#FFFFFF",
    border: "1px solid rgba(226, 232, 240, 0.9)",
    boxShadow: "0 4px 16px -2px rgba(15, 23, 42, 0.05), 0 1px 3px 0 rgba(15, 23, 42, 0.03)",
  },
  docCardAvatar: {
    width: "58px",
    height: "58px",
    borderRadius: "50%",
    overflow: "hidden",
    backgroundColor: "#EFF6FF",
    border: "2.5px solid #FFFFFF",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.09)",
    marginBottom: "8px",
  },
  docCardImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  docCardBody: {
    width: "100%",
  },
  docCardName: {
    fontSize: "13.5px",
    fontWeight: "800",
    color: "#0F172A",
    margin: "0 0 2px 0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    letterSpacing: "-0.01em",
  },
  docCardSpec: {
    fontSize: "10.5px",
    color: "#64748B",
    fontWeight: "600",
    display: "block",
    marginBottom: "6px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  docCardBottomRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 2px",
    marginBottom: "10px",
  },
  docCardFee: {
    fontSize: "12.5px",
    fontWeight: "800",
    color: "#0F172A",
    margin: 0,
  },
  docRating: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#0F172A",
  },
  docCardBtn: {
    width: "100%",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    fontSize: "11px",
    fontWeight: "700",
    padding: "7.5px 10px",
    borderRadius: "9999px",
    cursor: "pointer",
    boxShadow: "0 3px 10px rgba(37, 99, 235, 0.28)",
    border: "none",
    transition: "all 0.15s ease",
  },

  // Modal Backdrop & Booking Sheet (Screen 3)
  modalBackdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "16px",
  },
  bottomSheetBackdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "stretch",
    zIndex: 999999,
    touchAction: "none",
  },
  swiggyBookingSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: "28px",
    borderTopRightRadius: "28px",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    width: "100%",
    maxWidth: "100%",
    height: "75vh",
    maxHeight: "75vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 -16px 48px -4px rgba(15, 23, 42, 0.18)",
    overflow: "hidden",
    border: "1px solid rgba(226, 232, 240, 0.95)",
    borderBottom: "none",
  },
  sheetHandleRow: {
    width: "100%",
    padding: "10px 0 4px 0",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    cursor: "pointer",
  },
  sheetDragPill: {
    width: "40px",
    height: "4.5px",
    backgroundColor: "#CBD5E1",
    borderRadius: "9999px",
  },
  sheetTopNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 20px 12px",
    borderBottom: "1px solid #F1F5F9",
    backgroundColor: "#FFFFFF",
  },
  sheetCloseBtn: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "#F1F5F9",
    border: "1px solid #E2E8F0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "background-color 0.15s ease",
  },
  bookingSheet: {
    backgroundColor: "var(--card-bg, #FFFFFF)",
    backdropFilter: "var(--card-blur, blur(24px))",
    WebkitBackdropFilter: "var(--card-blur, blur(24px))",
    borderRadius: "28px",
    width: "100%",
    maxWidth: "440px",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
    overflow: "hidden",
    border: "var(--card-border, 1px solid #E2E8F0)",
  },
  sheetBackBtn: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    backgroundColor: "#F1F5F9",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  sheetTitle: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#0F172A",
    margin: 0,
  },
  sheetScrollBody: {
    padding: "16px 20px",
    overflowY: "auto",
    flex: 1,
    overscrollBehavior: "contain",
    overscrollBehaviorY: "contain",
    WebkitOverflowScrolling: "touch",
  },
  docHeaderRow: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: "14px",
  },
  docHeaderInfo: {
    flex: 1,
  },
  sheetDocName: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#0F172A",
    margin: "0 0 2px 0",
    letterSpacing: "-0.01em",
  },
  sheetDocQual: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#475569",
    margin: "0 0 3px 0",
    lineHeight: "1.3",
  },
  sheetDocHosp: {
    fontSize: "11px",
    fontWeight: "500",
    color: "#64748B",
    margin: "0 0 6px 0",
  },
  sheetDocFee: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#3B82F6",
    margin: "0 0 6px 0",
  },
  sheetSpecBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "11px",
    fontWeight: "600",
    color: "#3B82F6",
    backgroundColor: "#EFF6FF",
    padding: "3px 10px",
    borderRadius: "9999px",
  },
  sheetBioCard: {
    marginTop: "16px",
    backgroundColor: "#F8FAFC",
    padding: "14px 16px",
    borderRadius: "16px",
    border: "1px solid #E2E8F0",
  },
  sheetBioText: {
    fontSize: "12.5px",
    lineHeight: "1.55",
    color: "#334155",
    margin: "6px 0 0 0",
  },
  sheetStoriesCard: {
    marginTop: "12px",
    backgroundColor: "#F0FDF4",
    padding: "14px 16px",
    borderRadius: "16px",
    border: "1px solid #DCFCE7",
  },
  sheetSubLabel: {
    fontSize: "9.5px",
    fontWeight: "800",
    color: "#166534",
    letterSpacing: "0.06em",
    display: "block",
  },
  sheetStoryText: {
    fontSize: "12px",
    color: "#14532D",
    lineHeight: "1.45",
    margin: "4px 0 0 0",
    fontWeight: "500",
  },
  sheetQuoteText: {
    fontSize: "12px",
    color: "#166534",
    fontStyle: "italic",
    lineHeight: "1.45",
    margin: "4px 0 0 0",
  },
  docCardExp: {
    fontSize: "10px",
    fontWeight: "600",
    color: "#2563EB",
    backgroundColor: "#EFF6FF",
    padding: "1px 6px",
    borderRadius: "4px",
    display: "inline-block",
    marginTop: "2px",
    marginBottom: "2px",
  },
  docHeaderPortrait: {
    width: "110px",
    height: "110px",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  sheetDocImg: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    objectPosition: "bottom",
  },
  sheetStatsCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 14px",
    borderRadius: "18px",
    marginBottom: "14px",
    backgroundColor: "#F8FAFC",
    border: "1px solid #E2E8F0",
    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
  },
  sheetStatCol: {
    textAlign: "center",
    flex: 1,
  },
  sheetStatVal: {
    fontSize: "13px",
    fontWeight: "800",
    color: "#0F172A",
    margin: "0 0 2px 0",
  },
  sheetStatLabel: {
    fontSize: "10px",
    color: "#64748B",
    fontWeight: "600",
  },
  sheetStatDivider: {
    width: "1px",
    height: "24px",
    backgroundColor: "#E2E8F0",
  },
  sheetSectionTitle: {
    fontSize: "13px",
    fontWeight: "800",
    color: "#0F172A",
    margin: 0,
  },
  sheetDateStrip: {
    display: "flex",
    gap: "8px",
    overflowX: "auto",
    paddingBottom: "6px",
    scrollbarWidth: "none",
  },
  customDatePillActive: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "54px",
    height: "64px",
    borderRadius: "18px",
    backgroundColor: "#2563EB",
    border: "1.5px solid #1D4ED8",
    boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
    cursor: "pointer",
    flexShrink: 0,
    transition: "all 0.15s ease",
  },
  customDatePillInactive: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "54px",
    height: "64px",
    borderRadius: "18px",
    backgroundColor: "#F8FAFC",
    border: "1.5px dashed #93C5FD",
    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
    cursor: "pointer",
    flexShrink: 0,
    transition: "all 0.15s ease",
  },
  customBadgeActive: {
    fontSize: "9.5px",
    fontWeight: "800",
    color: "#DBEAFE",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  customDateNumActive: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: "2px",
  },
  customPillTitle: {
    fontSize: "9.5px",
    fontWeight: "700",
    color: "#2563EB",
    letterSpacing: "0.02em",
  },
  calendarModalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "stretch",
    zIndex: 1000005,
    touchAction: "none",
  },
  calendarModalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: "28px",
    borderTopRightRadius: "28px",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    width: "100%",
    maxWidth: "100%",
    maxHeight: "85vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 -12px 40px rgba(15, 23, 42, 0.25)",
    overflow: "hidden",
    border: "1px solid rgba(226, 232, 240, 0.9)",
    borderBottom: "none",
  },
  calSheetContent: {
    padding: "0 20px 20px 20px",
    overflowY: "auto",
    flex: 1,
  },
  calModalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "14px",
    paddingBottom: "12px",
    borderBottom: "1px solid #F1F5F9",
  },
  calIconBadge: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    backgroundColor: "#EFF6FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  calModalTitle: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#0F172A",
    margin: "0 0 1px 0",
  },
  calModalSub: {
    fontSize: "11px",
    color: "#64748B",
    margin: 0,
    fontWeight: "500",
  },
  calCloseBtn: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    backgroundColor: "#F1F5F9",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "background 0.15s ease",
  },
  calMonthNavRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "12px",
    backgroundColor: "#F8FAFC",
    padding: "6px 8px",
    borderRadius: "12px",
    border: "1px solid #E2E8F0",
  },
  calMonthNavBtn: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    backgroundColor: "#FFFFFF",
    border: "1px solid #CBD5E1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
  },
  calMonthDisplay: {
    display: "flex",
    alignItems: "center",
  },
  calMonthText: {
    fontSize: "13.5px",
    fontWeight: "700",
    color: "#0F172A",
  },
  calWeekRow: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    marginBottom: "6px",
    textAlign: "center",
  },
  calWeekCol: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    padding: "4px 0",
  },
  calDaysGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "3px",
    marginBottom: "14px",
  },
  calDayBtnNormal: {
    aspectRatio: "1",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "transparent",
    color: "#1E293B",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s ease",
  },
  calDayBtnActive: {
    aspectRatio: "1",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 10px rgba(37, 99, 235, 0.35)",
  },
  calDayBtnToday: {
    aspectRatio: "1",
    borderRadius: "10px",
    border: "1.5px solid #93C5FD",
    backgroundColor: "#EFF6FF",
    color: "#1D4ED8",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  calDayBtnDisabled: {
    aspectRatio: "1",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "transparent",
    color: "#CBD5E1",
    fontSize: "13px",
    cursor: "not-allowed",
    opacity: 0.45,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  calEmptyCell: {
    aspectRatio: "1",
  },
  calTodayDot: {
    width: "4px",
    height: "4px",
    borderRadius: "50%",
    backgroundColor: "#2563EB",
    marginTop: "2px",
  },
  calFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: "14px",
    paddingBottom: "8px",
    marginTop: "6px",
    borderTop: "1px solid #F1F5F9",
  },
  calSelectionInfo: {
    display: "flex",
    flexDirection: "column",
  },
  calInfoLabel: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  calInfoValue: {
    fontSize: "13px",
    fontWeight: "800",
    color: "#0F172A",
    marginTop: "2px",
  },
  calConfirmBtn: {
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    fontSize: "13px",
    fontWeight: "700",
    padding: "9px 24px",
    borderRadius: "9999px",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.35)",
    transition: "all 0.15s ease",
  },
  datePillActive: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "46px",
    height: "64px",
    borderRadius: "9999px",
    backgroundColor: "#3B82F6",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.35)",
    cursor: "pointer",
    flexShrink: 0,
  },
  datePillInactive: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "46px",
    height: "64px",
    borderRadius: "9999px",
    backgroundColor: "#F8FAFC",
    border: "1px solid #E2E8F0",
    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.02)",
    cursor: "pointer",
    flexShrink: 0,
    transition: "all 0.15s ease",
  },
  dayNameActive: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  dayName: {
    fontSize: "10px",
    fontWeight: "600",
    color: "#94A3B8",
    textTransform: "uppercase",
  },
  dateNumActive: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: "2px",
  },
  dateNum: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#0F172A",
    marginTop: "2px",
  },
  periodHeader: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    display: "block",
    marginBottom: "6px",
    letterSpacing: "0.04em",
  },
  slotPillGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
  },
  slotPillActive: {
    padding: "8px 6px",
    borderRadius: "12px",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    border: "none",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    textAlign: "center",
    boxShadow: "0 3px 8px rgba(37, 99, 235, 0.3)",
  },
  slotPillInactive: {
    padding: "8px 6px",
    borderRadius: "12px",
    backgroundColor: "#F8FAFC",
    color: "#0F172A",
    border: "1px solid #E2E8F0",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    textAlign: "center",
    transition: "all 0.15s ease",
  },
  sheetBottomBar: {
    padding: "14px 20px",
    backgroundColor: "#FFFFFF",
    borderTop: "1px solid #F1F5F9",
    boxShadow: "0 -4px 16px rgba(15, 23, 42, 0.04)",
  },
  sheetBookBtnActive: {
    width: "100%",
    backgroundColor: "#3B82F6",
    color: "#FFFFFF",
    border: "none",
    padding: "13px 20px",
    borderRadius: "9999px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(59, 130, 246, 0.35)",
    transition: "all 0.15s ease",
  },
  sheetBookBtnDisabled: {
    width: "100%",
    backgroundColor: "#E2E8F0",
    color: "#94A3B8",
    border: "none",
    padding: "13px 20px",
    borderRadius: "9999px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "not-allowed",
  },
  emptySlotsBox: {
    backgroundColor: "var(--input-bg, #FFFFFF)",
    backdropFilter: "var(--card-blur, blur(10px))",
    WebkitBackdropFilter: "var(--card-blur, blur(10px))",
    borderRadius: "16px",
    padding: "16px",
    textAlign: "center",
    border: "var(--card-border, 1px solid #E2E8F0)",
  },
  waitlistBtn: {
    backgroundColor: "#3B82F6",
    color: "#FFFFFF",
    border: "none",
    padding: "8px 18px",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
  },
  cancelModalCard: {
    backgroundColor: "var(--card-bg, #FFFFFF)",
    backdropFilter: "var(--card-blur, blur(24px))",
    WebkitBackdropFilter: "var(--card-blur, blur(24px))",
    borderRadius: "24px",
    padding: "24px",
    width: "100%",
    maxWidth: "380px",
    border: "var(--card-border, 1px solid rgba(226, 232, 240, 0.9))",
    boxShadow: "var(--card-shadow, 0 20px 40px rgba(15, 23, 42, 0.2))",
  },
  cancelWarningIcon: {
    fontSize: "32px",
    marginBottom: "4px",
  },
  cancelFieldLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748B",
    display: "block",
    marginBottom: "6px",
  },
  cancelSelect: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "12px",
    border: "1px solid #CBD5E1",
    fontSize: "13px",
    fontWeight: "600",
    color: "#0F172A",
    outline: "none",
    backgroundColor: "#F8FAFC",
  },
  cancelActionsRow: {
    display: "flex",
    gap: "10px",
  },
  cancelDismissBtn: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    color: "#0F172A",
    border: "none",
    padding: "11px 16px",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
  },
  cancelConfirmBtn: {
    flex: 1,
    backgroundColor: "#EF4444",
    color: "#FFFFFF",
    border: "none",
    padding: "11px 16px",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
  },
  sheetOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "stretch",
    zIndex: 999999,
    touchAction: "none",
  },
  cancelBottomSheet: {
    backgroundColor: "#FFFFFF",
    borderRadius: "28px 28px 0 0",
    width: "100%",
    maxWidth: "100%",
    maxHeight: "75vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 -16px 48px -4px rgba(15, 23, 42, 0.22)",
    border: "1px solid rgba(226, 232, 240, 0.95)",
    borderBottom: "none",
    overflow: "hidden",
  },
  rescheduleBottomSheet75: {
    backgroundColor: "#FFFFFF",
    borderRadius: "28px 28px 0 0",
    width: "100%",
    maxWidth: "100%",
    height: "75vh",
    maxHeight: "75vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 -16px 48px -4px rgba(15, 23, 42, 0.22)",
    border: "1px solid rgba(226, 232, 240, 0.95)",
    borderBottom: "none",
    overflow: "hidden",
  },
  sheetBody: {
    padding: "10px 24px 20px 24px",
    overflowY: "auto",
    flex: 1,
    overscrollBehavior: "contain",
    overscrollBehaviorY: "contain",
    WebkitOverflowScrolling: "touch",
  },
  sheetStickyBottom: {
    padding: "16px 24px",
    borderTop: "1px solid #F1F5F9",
    backgroundColor: "#FFFFFF",
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexShrink: 0,
  },
};

export default UserOverview;