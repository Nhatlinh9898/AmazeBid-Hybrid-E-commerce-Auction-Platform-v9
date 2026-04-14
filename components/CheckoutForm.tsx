import React, { useState, useEffect } from "react";
import {
  PaymentElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import { Loader2, AlertCircle } from "lucide-react";

interface CheckoutFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
  amount: number;
}

export default function CheckoutForm({ onSuccess, onCancel, amount }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case "succeeded":
          setMessage("Payment succeeded!");
          break;
        case "processing":
          setMessage("Your payment is processing.");
          break;
        case "requires_payment_method":
          setMessage("Your payment was not successful, please try again.");
          break;
        default:
          setMessage("Something went wrong.");
          break;
      }
    });
  }, [stripe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: window.location.href,
      },
      redirect: 'if_required',
    });

    if (error) {
        if (error.type === "card_error" || error.type === "validation_error") {
            setMessage(error.message || "An error occurred.");
        } else {
            setMessage("An unexpected error occurred.");
        }
    } else {
        // Payment succeeded
        onSuccess();
    }

    setIsLoading(false);
  };

  const paymentElementOptions = {
    layout: "tabs" as const,
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="w-full">
      <PaymentElement id="payment-element" options={paymentElementOptions} />
      
      <button 
        disabled={isLoading || !stripe || !elements} 
        id="submit"
        className="w-full bg-[#febd69] hover:bg-[#f3a847] text-black font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span id="button-text">
          {isLoading ? (
             <div className="flex items-center gap-2">
                 <Loader2 className="animate-spin" size={20} /> Đang xử lý...
             </div>
          ) : (
            `Thanh toán ngay $${amount.toFixed(2)}`
          )}
        </span>
      </button>

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="w-full mt-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors py-2"
        >
          Quay lại giỏ hàng
        </button>
      )}
      
      {/* Show any error or success messages */}
      {message && (
          <div id="payment-message" className="mt-4 text-red-500 text-sm flex items-center gap-2 bg-red-50 p-3 rounded-lg border border-red-100">
              <AlertCircle size={16} /> {message}
          </div>
      )}
    </form>
  );
}
