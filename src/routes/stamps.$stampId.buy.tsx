import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Building2,
  CheckCircle2,
  CreditCard,
  Landmark,
  MapPin,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Truck,
  WalletCards,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getStamp } from "@/lib/stamps";
import { addOrder, addOrderToSupabase, readPaymentSettings, type OrderItem } from "@/lib/orders";
import SuccessTick from "@/components/SuccessTick";
import { addAddressToSupabase, readAddresses, type AddressItem } from "@/lib/addresses";
import { addNotification } from "@/lib/notifications";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const paymentMethods = [
  { id: "upi-collect", label: "Pay via UPI ID", detail: "GPay, PhonePe, Paytm approval request notification", icon: Smartphone },
  { id: "upi", label: "Scan QR Code", detail: "Scan static QR code manually to transfer", icon: QrCode },
  { id: "razorpay", label: "Razorpay Portal", detail: "Standard portal checkout (Card, Net Banking, Wallets)", icon: WalletCards },
  { id: "cod", label: "Cash on Delivery", detail: "Request COD after seller approval", icon: Banknote },
] as const;

const upiApps = [
  { id: "gpay", label: "GPay", scheme: "upi" },
  { id: "phonepe", label: "PhonePe", scheme: "phonepe" },
  { id: "paytm", label: "Paytm", scheme: "paytmmp" },
  { id: "bhim", label: "BHIM", scheme: "upi" },
] as const;

// Helper to dynamically inject the Razorpay Checkout script
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const Route = createFileRoute("/stamps/$stampId/buy")({
  loader: ({ params }) => {
    const stamp = getStamp(params.stampId);
    if (!stamp) throw notFound();
    return { stamp };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Buy ${loaderData?.stamp.name} — Stamp Safar` },
      { name: "description", content: `Buy ${loaderData?.stamp.name} from verified sellers.` },
    ],
  }),
  component: BuyStampPage,
});

function BuyStampPage() {
  const { stamp } = Route.useLoaderData();
  const [paymentMethod, setPaymentMethod] = useState<(typeof paymentMethods)[number]["id"]>("upi-collect");
  const [selectedUpiApp, setSelectedUpiApp] = useState<(typeof upiApps)[number]["id"]>("gpay");
  const [upiId, setUpiId] = useState("");
  const [address, setAddress] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<AddressItem[]>([]);
  const [notice, setNotice] = useState("");

  // Map & Delivery Charge state variables
  const [latitude, setLatitude] = useState(22.5726); // Default Kolkata Lat
  const [longitude, setLongitude] = useState(88.3639); // Default Kolkata Lng
  const [deliveryFee, setDeliveryFee] = useState(40); // North/South Kolkata Default ₹40
  const [deliveryRegion, setDeliveryRegion] = useState("Kolkata");
  
  // Payment dynamic configuration settings
  const [merchantUpiId, setMerchantUpiId] = useState("8017599702@superyes");
  const [qrCodeUrl, setQrCodeUrl] = useState("/upi_qr.jpg");
  
  // Payment integration processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "upi-awaiting" | "success" | "failed">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [verifiedOrderId, setVerifiedOrderId] = useState("");
  const [pendingUpiOrderId, setPendingUpiOrderId] = useState("");
  const [pendingPaymentId, setPendingPaymentId] = useState("");
  const [countdown, setCountdown] = useState(300); // 5-minute countdown for Metro Approval flow

  const protectionFee = Math.max(25, Math.round(stamp.price * 0.03));
  const total = stamp.price + protectionFee + deliveryFee;
  const selectedPayment = paymentMethods.find((method) => method.id === paymentMethod)!;
  const selectedUpi = upiApps.find((app) => app.id === selectedUpiApp)!;

  const upiLink = `upi://pay?pa=${encodeURIComponent(
    merchantUpiId,
  )}&pn=${encodeURIComponent("Stamp Safar")}&am=${total}&cu=INR&tn=${encodeURIComponent(
    `Stamp Safar order ${stamp.id}`,
  )}`;

  // 1. Fetch saved addresses and dynamic payment config settings on load
  useEffect(() => {
    setSavedAddresses(readAddresses());
    
    const loadSettings = async () => {
      try {
        const settings = await readPaymentSettings();
        if (settings) {
          setMerchantUpiId(settings.upi_id);
          setQrCodeUrl(settings.qr_code_url);
        }
      } catch (err) {
        console.error("Failed to load payment settings:", err);
      }
    };
    loadSettings();
  }, []);

  // 2. Load Leaflet Map and handle coordinates / geocoding / delivery rules
  useEffect(() => {
    let isMounted = true;
    let mapInstance: any = null;

    const initMap = () => {
      const L = (window as any).L;
      if (!L) return;

      const mapContainer = document.getElementById("leaflet-delivery-map");
      if (!mapContainer) return;

      // Center map on Kolkata or selected coordinates
      const initialCoords = [latitude, longitude];
      mapInstance = L.map("leaflet-delivery-map").setView(initialCoords, 11);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(mapInstance);

      // Create a draggable location marker
      let marker = L.marker(initialCoords, { draggable: true }).addTo(mapInstance);

      // Trigger location details reverse-geocoding fetch and charge calculation
      const updateLocationDetails = async (lat: number, lng: number) => {
        if (!isMounted) return;
        setLatitude(lat);
        setLongitude(lng);

        // Reverse geocoding using OpenStreetMap Nominatim API
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
          if (res.ok && isMounted) {
            const data = await res.json();
            const resolvedAddress = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            setAddress(resolvedAddress);

            // Apply Delivery Charge Rules:
            // - Inside Kolkata (roughly lat: 22.45 - 22.68, lng: 88.20 - 88.50) -> ₹40. 
            // - Determine North vs South based on middle line (~lat: 22.5726)
            // - Outside Kolkata -> ₹500 courier charge
            const insideKolkata = lat >= 22.45 && lat <= 22.68 && lng >= 88.20 && lng <= 88.50;

            if (insideKolkata) {
              const isNorth = lat > 22.5726;
              setDeliveryFee(40);
              setDeliveryRegion(isNorth ? "North Kolkata" : "South Kolkata");
              setNotice("");
            } else {
              // Outside Kolkata: ₹500 Courier Charge
              setDeliveryFee(500);
              setDeliveryRegion("Outside Kolkata");
              setNotice("Note: Courier delivery outside Kolkata has a fixed courier fee of ₹500.");
            }
          }
        } catch (err) {
          console.error("Geocoding failed:", err);
        }
      };

      // Handle map clicks
      mapInstance.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        updateLocationDetails(lat, lng);
      });

      // Handle marker drags
      marker.on("dragend", (e: any) => {
        const position = marker.getLatLng();
        updateLocationDetails(position.lat, position.lng);
      });
    };

    const loadLeaflet = () => {
      if ((window as any).L) {
        initMap();
        return;
      }

      // Add Leaflet CSS to header
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      // Add Leaflet Script to body
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => {
        if (isMounted) initMap();
      };
      document.body.appendChild(script);
    };

    loadLeaflet();

    return () => {
      isMounted = false;
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, []);

  // 3. Polling mechanism for Kolkata Metro-style UPI Collect Request approval
  useEffect(() => {
    if (paymentStatus !== "upi-awaiting" || !pendingPaymentId) return;

    let pollInterval: any;
    let countdownTimer: any;
    let isFinished = false;

    const pollPaymentStatus = async () => {
      if (isFinished) return;
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://stamp-safar-backend.onrender.com";
        const response = await fetch(`${backendUrl}/verify-upi-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId: pendingPaymentId, orderId: pendingUpiOrderId }),
        });
        const data = await response.json();
        
        if (response.ok && data.success && data.status === "captured") {
          isFinished = true;
          clearInterval(pollInterval);
          clearInterval(countdownTimer);

          // Save local transaction history
          const localOrder: OrderItem = {
            id: pendingUpiOrderId,
            stampId: stamp.id,
            item: stamp.name,
            date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
            status: "Paid",
            amount: total,
            paymentMethod: "UPI ID Collect",
            trackingStep: "Confirmed",
          };
          
          const ORDERS_KEY = "stampSafar.orders";
          const existing = (() => {
            try {
              const v = localStorage.getItem(ORDERS_KEY);
              return v ? JSON.parse(v) : [];
            } catch {
              return [];
            }
          })();
          localStorage.setItem(ORDERS_KEY, JSON.stringify([localOrder, ...existing]));
          window.dispatchEvent(new CustomEvent("stampSafar:orders-updated"));

          addNotification("UPI Payment Successful", `${stamp.name} order has been verified!`);
          setVerifiedOrderId(pendingUpiOrderId);
          setPaymentStatus("success");
        } else if (response.ok && data.status === "failed") {
          isFinished = true;
          clearInterval(pollInterval);
          clearInterval(countdownTimer);
          setErrorMessage(data.error || "The collect request was declined or failed on your UPI App.");
          setPaymentStatus("failed");
        }
      } catch (err) {
        console.error("Error polling payment status:", err);
      }
    };

    // Immediate poll check
    pollPaymentStatus();

    // Poll every 4 seconds
    pollInterval = setInterval(pollPaymentStatus, 4000);

    // 5-minute countdown clock
    countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          isFinished = true;
          clearInterval(pollInterval);
          clearInterval(countdownTimer);
          setErrorMessage("Payment collect request timed out. Please verify your UPI ID and try again.");
          setPaymentStatus("failed");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      isFinished = true;
      clearInterval(pollInterval);
      clearInterval(countdownTimer);
    };
  }, [paymentStatus, pendingPaymentId]);

  // Format countdown clock into mm:ss
  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // 4. Main checkout button confirmation click handler
  const confirmPayment = async () => {
    if (!address.trim()) {
      setNotice("Please select your delivery address from the map.");
      return;
    }

    setIsProcessing(true);
    setNotice("");

    try {
      // Save delivery address to Supabase book
      await addAddressToSupabase(address);
      setSavedAddresses(readAddresses());

      // Get customer user session metadata
      let userId = "guest-user-id";
      let userEmail = "guest@stampsafar.com";

      if (supabase && isSupabaseConfigured) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          userId = session.user.id;
          userEmail = session.user.email || "";
        }
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://stamp-safar-backend.onrender.com";

      // FLOW A: Pay via UPI ID (Kolkata Metro Style)
      if (paymentMethod === "upi-collect") {
        const vpaRegex = /^[\w.\-_]{2,256}@[\w]{2,64}$/;
        if (!vpaRegex.test(upiId.trim())) {
          setNotice("Please enter a valid UPI ID (e.g. name@okaxis, 8017599702@superyes).");
          setIsProcessing(false);
          return;
        }

        const newOrderId = `SS-${Date.now().toString().slice(-6)}`;
        setPendingUpiOrderId(newOrderId);
        setCountdown(300); // reset clock

        console.log(`Initiating UPI Collect request to: ${upiId.trim()}`);
        const response = await fetch(`${backendUrl}/initiate-upi-collect`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: newOrderId,
            stampId: stamp.id,
            stampName: stamp.name,
            amount: total,
            upiId: upiId.trim(),
            userId,
            userEmail,
            address,
            latitude,
            longitude,
            deliveryFee,
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to initiate Metro UPI Request.");
        }

        setPendingPaymentId(data.paymentId);
        setPaymentStatus("upi-awaiting");
        setIsProcessing(false);
        return;
      }

      // FLOW B: Secure Razorpay Checkout Gateway Modal Popup
      if (paymentMethod === "razorpay") {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error("Unable to load Razorpay Checkout SDK. Check your internet connection.");
        }

        const internalOrderId = `SS-${Date.now().toString().slice(-6)}`;

        // Create gateway Order
        const orderResponse = await fetch(`${backendUrl}/create-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: total,
            stampId: stamp.id,
          }),
        });

        if (!orderResponse.ok) {
          throw new Error("Backend failed to initiate checkout order transaction.");
        }

        const orderData = await orderResponse.json();
        if (!orderData.success) {
          throw new Error(orderData.error || "Failed to create order on payment gateway.");
        }

        const { order } = orderData;

        // Open checkout modal popup
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_SwjXZw1YyTeEtJ",
          amount: order.amount,
          currency: order.currency,
          name: "Stamp Safar",
          description: `Buy ${stamp.name}`,
          order_id: order.id,
          image: stamp.image,
          prefill: {
            name: userEmail.split("@")[0],
            email: userEmail,
          },
          theme: { color: "#D4AF37" },
          handler: async function (response: any) {
            try {
              setIsProcessing(true);

              // Verify payment signature
              const verifyResponse = await fetch(`${backendUrl}/verify-payment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  orderId: internalOrderId,
                  stampId: stamp.id,
                  stampName: stamp.name,
                  amount: total,
                  paymentMethod: "Razorpay",
                  userId,
                  userEmail,
                  address,
                  latitude,
                  longitude,
                  deliveryFee,
                }),
              });

              const verifyData = await verifyResponse.json();
              if (!verifyResponse.ok || !verifyData.success) {
                throw new Error(verifyData.error || "Payment signature validation failed.");
              }

              // Local storage sync
              const localOrder: OrderItem = {
                id: internalOrderId,
                stampId: stamp.id,
                item: stamp.name,
                date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
                status: "Paid",
                amount: total,
                paymentMethod: "Razorpay",
                trackingStep: "Confirmed",
              };

              const ORDERS_KEY = "stampSafar.orders";
              const existingLocalOrders = (() => {
                try {
                  const val = localStorage.getItem(ORDERS_KEY);
                  return val ? JSON.parse(val) : [];
                } catch {
                  return [];
                }
              })();
              localStorage.setItem(ORDERS_KEY, JSON.stringify([localOrder, ...existingLocalOrders]));
              window.dispatchEvent(new CustomEvent("stampSafar:orders-updated"));

              addNotification("Payment Verified", `${stamp.name} order marked as paid.`);
              setVerifiedOrderId(internalOrderId);
              setPaymentStatus("success");
            } catch (err: any) {
              setErrorMessage(err.message || "Failed to verify transaction signature.");
              setPaymentStatus("failed");
            } finally {
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        return;
      }

      // FLOW C: Scan static QR manual or standard COD
      const simulatedOrderId = `SS-${Date.now().toString().slice(-6)}`;
      await addOrderToSupabase(stamp, total, selectedPayment.label, simulatedOrderId);
      addNotification("Order Saved", `${stamp.name} order created successfully!`);
      
      // Save shipping metadata to orders table directly if using standard COD
      if (isSupabaseConfigured) {
        await supabase
          .from("orders")
          .update({
            address,
            email: userEmail,
            latitude: Number(latitude),
            longitude: Number(longitude),
            delivery_fee: Number(deliveryFee)
          })
          .eq("id", simulatedOrderId);
      }

      setVerifiedOrderId(simulatedOrderId);
      setPaymentStatus("success");

    } catch (err: any) {
      console.error("Payment initiation error:", err);
      setErrorMessage(err.message || "Something went wrong while initiating the checkout transaction.");
      setPaymentStatus("failed");
    } finally {
      if (paymentMethod !== "razorpay" && paymentMethod !== "upi-collect") {
        setIsProcessing(false);
      }
    }
  };

  // UPI COUNTDOWN approval screen (Kolkata Metro Style)
  if (paymentStatus === "upi-awaiting") {
    return (
      <SiteLayout>
        <section className="container mx-auto px-4 py-16 max-w-xl animate-scale-in">
          <div className="rounded-3xl border border-primary/30 bg-card p-8 shadow-card text-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            
            {/* Countdown clock */}
            <div className="mx-auto my-4 flex h-28 w-28 flex-col items-center justify-center rounded-full border-4 border-primary bg-primary/5 animate-pulse">
              <span className="text-2xl font-bold tracking-tight text-foreground font-mono">{formatTime(countdown)}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-1">Clock</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-foreground mt-4">
              Awaiting UPI PIN Approval
            </h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              We have sent a Kolkata Metro-style <strong>UPI Collect Request</strong> of <span className="font-bold text-foreground">₹{total.toLocaleString("en-IN")}</span> to your address:
            </p>
            <div className="mt-2 text-base font-bold text-primary bg-secondary/50 rounded-lg py-1 px-4 inline-block">{upiId}</div>

            <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-xl p-4 text-xs text-left leading-relaxed">
              <strong>🔔 Action Required:</strong> Open your UPI app (Google Pay, PhonePe, Paytm, or BHIM) on your mobile device. You will see a payment notification request from **Stamp Safar** / **Razorpay**. Approve it using your secure **UPI PIN**.
            </div>

            {/* Fallback QR section */}
            <div className="mt-6 rounded-2xl border border-border bg-secondary/40 p-4">
              <p className="text-xs text-muted-foreground mb-3 font-medium">Or scan QR code to credit UPI ID: <span className="font-semibold text-foreground font-mono">{merchantUpiId}</span></p>
              <div className="flex justify-center">
                <img
                  src={qrCodeUrl}
                  alt="UPI QR Code"
                  className="h-44 w-44 rounded-xl border border-border bg-white p-2 shadow-sm"
                />
              </div>
            </div>

            {/* Order status summary */}
            <div className="mt-4 rounded-xl border border-border bg-secondary/35 px-4 py-3 text-sm text-left">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Ref</span>
                <span className="font-semibold">{pendingUpiOrderId}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-emerald-600">₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Cancel Button */}
            <div className="mt-6 flex flex-col gap-2">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-1">
                <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
                Listening for mobile approval PIN verification...
              </div>
              <Button
                size="lg"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setPaymentStatus("idle");
                  setPendingUpiOrderId("");
                  setPendingPaymentId("");
                }}
              >
                Cancel and Try Another Method
              </Button>
            </div>
          </div>
        </section>
      </SiteLayout>
    );
  }

  // PAYMENT SUCCESS SCREEN
  if (paymentStatus === "success") {
    return (
      <SiteLayout>
        <section className="container mx-auto px-4 py-16 max-w-xl animate-scale-in">
          <div className="rounded-3xl border border-emerald-500/30 bg-card p-8 shadow-card text-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <SuccessTick />

            <h1 className="text-3xl font-bold tracking-tight text-foreground mt-2">
              Payment Confirmed!
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your stamp order has been verified and recorded successfully.
            </p>

            <div className="mt-6 rounded-2xl border border-border bg-secondary/35 p-5 text-left text-sm space-y-3">
              <div className="flex justify-between border-b border-border/60 pb-2.5">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-semibold text-foreground font-mono">{verifiedOrderId}</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2.5">
                <span className="text-muted-foreground">Stamp Purchased</span>
                <span className="font-semibold text-foreground">{stamp.name}</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2.5">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-bold text-emerald-600 text-base">₹{total.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2.5">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-semibold text-foreground">{selectedPayment.label}</span>
              </div>
              <div className="flex flex-col gap-1 pt-1">
                <span className="text-muted-foreground">Delivery Address:</span>
                <span className="font-medium text-foreground leading-relaxed">{address}</span>
              </div>
            </div>

            {/* Delivery timeline preview */}
            <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
                <Truck className="h-4 w-4" />
                Estimated Delivery: 3–5 Business Days
              </div>
              <div className="flex items-center gap-1 overflow-x-auto">
                {(["Confirmed", "Packed", "Shipped", "Delivered"] as const).map((step, idx, arr) => (
                  <span key={step} className="flex items-center gap-1 min-w-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${idx === 0 ? "bg-emerald-500 text-white font-semibold" : "bg-border text-muted-foreground"}`}>
                      {step}
                    </span>
                    {idx < arr.length - 1 && <span className="text-border text-xs">→</span>}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 bg-blue-500/5 rounded-xl px-4 py-3 border border-blue-500/15 text-xs text-blue-700 dark:text-blue-400">
              📧 A professional invoice confirmation email has been sent to your registered email address.
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" variant="outline" className="w-full" asChild>
                <Link to="/marketplace">Browse Stamps</Link>
              </Button>
              <Button size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
                <Link to="/dashboard">View Order History →</Link>
              </Button>
            </div>
          </div>
        </section>
      </SiteLayout>
    );
  }

  // FAILED SCREEN
  if (paymentStatus === "failed") {
    return (
      <SiteLayout>
        <section className="container mx-auto px-4 py-16 max-w-xl animate-scale-in">
          <div className="rounded-3xl border border-destructive/30 bg-card p-8 shadow-card text-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-destructive/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="mx-auto my-4 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <span className="text-4xl font-bold">❌</span>
            </div>
            
            <h1 className="text-3xl font-bold tracking-tight text-foreground mt-4">
              Payment Failed
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              An error occurred while verifying your order transaction.
            </p>
            
            <div className="mt-6 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive-foreground text-left leading-relaxed">
              <strong className="block text-sm font-semibold mb-1">Reason:</strong>
              {errorMessage || "The payment verification timed out or was declined."}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" variant="outline" className="w-full" onClick={() => setPaymentStatus("idle")}>
                Try Another Method
              </Button>
              <Button size="lg" className="w-full" onClick={confirmPayment}>
                Retry Checkout
              </Button>
            </div>
          </div>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="container mx-auto px-4 sm:px-6 py-8">
        <Link
          to="/stamps/$stampId"
          params={{ stampId: stamp.id }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to details
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="grid gap-6 md:grid-cols-[240px_1fr]">
              <div className="rounded-xl bg-secondary/60 p-5">
                <img src={stamp.image} alt={stamp.name} className="h-72 w-full object-contain animate-float" />
              </div>
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{stamp.rarity}</Badge>
                  <Badge className="gap-1 bg-emerald-100 text-emerald-900 hover:bg-emerald-100">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified
                  </Badge>
                </div>
                <h1 className="mt-3 text-3xl font-semibold">{stamp.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stamp.year} · {stamp.category} · {stamp.condition}
                </p>
                <div className="mt-5 text-4xl font-bold">
                  ₹{stamp.price.toLocaleString("en-IN")}
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Info icon={Truck} title="Delivery" text="3-5 days" />
                  <Info icon={ShieldCheck} title="Protection" text="Buyer covered" />
                  <Info icon={MapPin} title="Seller" text={stamp.seller?.location || "India"} />
                </div>
              </div>
            </div>
          </div>

          <aside
            id="buy-section"
            className="order-first scroll-mt-24 rounded-2xl border border-gold bg-card p-5 shadow-card h-fit lg:order-none animate-scale-in"
          >
            <div className="mb-4 rounded-xl bg-gold/15 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gold-foreground">
                <ShoppingBag className="h-4 w-4" />
                Buy this stamp
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Drag the map marker, enter payment info, and checkout securely.
              </p>
            </div>
            <h2 className="text-xl font-semibold">Order summary</h2>
            <div className="mt-4 space-y-2 text-sm">
              <Line label="Stamp price" value={`₹${stamp.price.toLocaleString("en-IN")}`} />
              <Line label="Protection fee" value={`₹${protectionFee.toLocaleString("en-IN")}`} />
              <Line label="Delivery Charge" value={deliveryFee ? `₹${deliveryFee}` : "Free"} />
              <div className="border-t border-border pt-3">
                <Line label="Total" value={`₹${total.toLocaleString("en-IN")}`} strong />
              </div>
            </div>

            {/* ADDRESS SECTION WITH LEAFLET MAP */}
            <label className="mt-5 block">
              <span className="text-sm font-medium">Delivery location address</span>
              
              {/* Leaflet map container */}
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Select location on map
                  </span>
                  {deliveryRegion && (
                    <Badge variant="outline" className="border-primary/40 bg-primary/5 text-primary text-[10px] py-0 px-2 font-bold font-display">
                      📍 {deliveryRegion}
                    </Badge>
                  )}
                </div>
                <div
                  id="leaflet-delivery-map"
                  className="h-56 w-full rounded-xl border border-border bg-secondary/30 shadow-inner z-10"
                />
                <div className="mt-1 flex justify-between text-[9px] text-muted-foreground font-mono px-1">
                  <span>Latitude: {latitude.toFixed(5)}</span>
                  <span>Longitude: {longitude.toFixed(5)}</span>
                </div>
              </div>

              {savedAddresses.length > 0 && (
                <select
                  value=""
                  onChange={(event) => setAddress(event.target.value)}
                  className="mt-3 h-11 w-full rounded-xl border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-gold"
                >
                  <option value="">Choose saved address</option>
                  {savedAddresses.map((savedAddress) => (
                    <option key={savedAddress.id} value={savedAddress.value}>
                      {savedAddress.label} - {savedAddress.value.slice(0, 42)}
                    </option>
                  ))}
                </select>
              )}
              <textarea
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="House no, area, city, pincode"
                className="mt-2 min-h-20 w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-gold"
              />
            </label>

            <div className="mt-5">
              <div className="text-sm font-semibold">Payment option</div>
              <div className="mt-3 grid gap-2">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const active = paymentMethod === method.id;

                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(method.id);
                        setNotice("");
                      }}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                        active
                          ? "border-primary bg-primary/5 ring-2 ring-primary/10"
                          : "border-border bg-secondary/30 hover:border-gold/60"
                      }`}
                    >
                      <span
                        className={`grid h-10 w-10 place-items-center rounded-lg ${
                          active ? "bg-primary text-primary-foreground" : "bg-card"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{method.label}</span>
                        <span className="block text-xs text-muted-foreground">{method.detail}</span>
                      </span>
                      <span
                        className={`h-4 w-4 rounded-full border ${
                          active
                            ? "border-primary bg-primary shadow-[inset_0_0_0_4px_white]"
                            : "border-border"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* UPI Collect Request Input Details */}
            {paymentMethod === "upi-collect" && (
              <div className="mt-3 rounded-xl border border-border bg-secondary/30 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Smartphone className="h-4 w-4 text-gold" />
                  Kolkata Metro UPI Flow
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Enter your VPA address below. A collect approval notification request will be pushed instantly to your mobile app.
                </p>
                <input
                  value={upiId}
                  onChange={(event) => setUpiId(event.target.value)}
                  placeholder="name@okaxis, 8017599702@superyes"
                  className="mt-2.5 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-gold font-mono"
                />
              </div>
            )}

            {/* Direct Static Scan QR Code details */}
            {paymentMethod === "upi" && (
              <div className="mt-3 rounded-xl border border-border bg-secondary/30 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <QrCode className="h-4 w-4 text-gold" />
                  Scan to Pay UPI ID
                </div>
                <div className="mt-3 flex justify-center">
                  <img
                    src={qrCodeUrl}
                    alt="UPI QR Code"
                    className="h-36 w-36 rounded-lg border border-border bg-white p-1"
                  />
                </div>
                <p className="mt-2 text-[10px] text-center text-muted-foreground font-mono">
                  UPI ID: {merchantUpiId}
                </p>
              </div>
            )}

            {paymentMethod === "razorpay" && (
              <div className="mt-3 rounded-xl border border-border bg-secondary/30 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <WalletCards className="h-4 w-4 text-gold" />
                  Razorpay Portal Checkout
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Standard interactive checkout gateway modal. Supports Credit/Debit Cards, Net Banking, and Wallets.
                </p>
              </div>
            )}

            {notice && (
              <div className="mt-3 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-xs text-primary-foreground/90">
                {notice}
              </div>
            )}

            <Button 
              size="lg" 
              className="mt-4 w-full gap-2 transition-all duration-300" 
              onClick={confirmPayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Processing Order...
                </span>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  {paymentMethod === "upi-collect"
                    ? "Pay Now via UPI Collect"
                    : `Pay ₹${total.toLocaleString("en-IN")}`}
                </>
              )}
            </Button>

            <p className="mt-3 text-xs text-muted-foreground text-center">
              Secure transactions via standard 256-bit encryption.
            </p>
          </aside>
        </div>
      </section>
    </SiteLayout>
  );
}

function Info({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-3 text-center">
      <Icon className="h-4 w-4 mx-auto text-gold" />
      <div className="mt-1.5 text-xs text-muted-foreground">{title}</div>
      <div className="text-sm font-semibold">{text}</div>
    </div>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${strong ? "text-base font-semibold" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
