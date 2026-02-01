import { useState } from "react";
import { X, Smartphone, CreditCard, Building, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  studentName: string;
}

type PaymentMethod = "ecocash" | "onemoney" | "telecash" | "card" | null;
type PaymentStatus = "idle" | "processing" | "success" | "error";

const PaymentModal = ({ isOpen, onClose, balance, studentName }: PaymentModalProps) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [amount, setAmount] = useState<string>(balance.toString());
  const [phoneNumber, setPhoneNumber] = useState("");
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handlePayment = async () => {
    if (!paymentMethod) return;
    
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      setErrorMessage("Please enter a valid amount");
      return;
    }

    if ((paymentMethod === "ecocash" || paymentMethod === "onemoney" || paymentMethod === "telecash") && !phoneNumber) {
      setErrorMessage("Please enter your phone number");
      return;
    }

    setStatus("processing");
    setErrorMessage("");

    // Mock payment processing - In production, this would call Paynow API via backend
    setTimeout(() => {
      // Simulate successful payment
      setStatus("success");
    }, 2000);
  };

  const resetModal = () => {
    setPaymentMethod(null);
    setAmount(balance.toString());
    setPhoneNumber("");
    setStatus("idle");
    setErrorMessage("");
    onClose();
  };

  const paymentMethods = [
    { id: "ecocash" as PaymentMethod, name: "EcoCash", icon: "📱", color: "bg-green-100 border-green-300 text-green-700" },
    { id: "onemoney" as PaymentMethod, name: "OneMoney", icon: "📱", color: "bg-purple-100 border-purple-300 text-purple-700" },
    { id: "telecash" as PaymentMethod, name: "Telecash", icon: "📱", color: "bg-blue-100 border-blue-300 text-blue-700" },
    { id: "card" as PaymentMethod, name: "Visa/Mastercard", icon: "💳", color: "bg-amber-100 border-amber-300 text-amber-700" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-heading text-lg font-bold text-foreground">Pay School Fees</h2>
          <button onClick={resetModal} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {status === "success" ? (
          <div className="p-6 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Payment Initiated!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {paymentMethod === "card" 
                ? "Your card payment is being processed. You will receive a confirmation shortly."
                : `Please check your ${paymentMethod?.toUpperCase()} phone for a payment prompt and enter your PIN to complete the transaction.`
              }
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              Reference: PAY-{Date.now().toString().slice(-8)}
            </p>
            <Button onClick={resetModal} className="w-full">
              Done
            </Button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Payment Info */}
            <div className="bg-secondary/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Student</p>
              <p className="font-medium text-foreground">{studentName}</p>
              <p className="text-sm text-muted-foreground mt-2">Outstanding Balance</p>
              <p className="text-2xl font-bold text-primary">${balance.toFixed(2)}</p>
            </div>

            {/* Amount Input */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Amount to Pay (USD)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                placeholder="Enter amount"
                min="1"
                max={balance}
              />
            </div>

            {/* Payment Methods */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Select Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      paymentMethod === method.id 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="text-2xl">{method.icon}</span>
                    <p className="text-sm font-medium text-foreground mt-1">{method.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Phone Number for Mobile Money */}
            {(paymentMethod === "ecocash" || paymentMethod === "onemoney" || paymentMethod === "telecash") && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  {paymentMethod === "ecocash" ? "EcoCash" : paymentMethod === "onemoney" ? "OneMoney" : "Telecash"} Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                  placeholder="e.g. 0771234567"
                />
              </div>
            )}

            {/* Card Details Placeholder */}
            {paymentMethod === "card" && (
              <div className="bg-secondary/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground text-center">
                  You will be redirected to a secure payment page to enter your card details.
                </p>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <p className="text-sm text-red-600 text-center">{errorMessage}</p>
            )}

            {/* Pay Button */}
            <Button 
              onClick={handlePayment} 
              className="w-full" 
              disabled={!paymentMethod || status === "processing"}
            >
              {status === "processing" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Pay ${parseFloat(amount || "0").toFixed(2)}
                </>
              )}
            </Button>

            {/* Security Note */}
            <p className="text-xs text-muted-foreground text-center">
              🔒 Payments are processed securely via Paynow Zimbabwe
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
