// // ─── src/pages/LoginPage.jsx ──────────────────────────────────────────────────
// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../hooks/useAuth.js";
// import { sendOTP, verifyOTP } from "../services/authService.js";
// import toast from "react-hot-toast";

// const PINK = "#e91e8c";

// export default function LoginPage() {
//   const nav = useNavigate();
//   const { login } = useAuth();
//   const [step, setStep] = useState("phone"); // "phone" | "otp"
//   const [phone, setPhone] = useState("");
//   const [otp, setOtp] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleSend = async () => {
//     if (phone.length < 10) return toast.error("Enter valid 10-digit phone");
//     try {
//       setLoading(true);
//       await sendOTP(phone);
//       setStep("otp");
//       toast.success("OTP sent!");
//     } catch (e) {
//       toast.error(e.response?.data?.message || "Failed to send OTP");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleVerify = async () => {
//     if (otp.length < 6) return toast.error("Enter 6-digit OTP");
//     try {
//       setLoading(true);
//       const { data } = await verifyOTP(phone, otp, "Admin");
//       login(data);
//       nav("/");
//       toast.success("Welcome, Admin!");
//     } catch (e) {
//       toast.error(e.response?.data?.message || "Invalid OTP");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div
//       style={{
//         minHeight: "100vh",
//         background: "#1a1a2e",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         fontFamily: "'Segoe UI',sans-serif",
//       }}
//     >
//       <div
//         style={{
//           background: "#fff",
//           borderRadius: 20,
//           padding: 36,
//           width: 340,
//           textAlign: "center",
//         }}
//       >
//         {/* Logo */}
//         <div
//           style={{
//             color: PINK,
//             fontWeight: 900,
//             fontSize: 26,
//             letterSpacing: 2,
//             marginBottom: 4,
//           }}
//         >
//           আড্ডা
//         </div>
//         <div
//           style={{
//             color: "#aaa",
//             fontSize: 11,
//             letterSpacing: 4,
//             marginBottom: 28,
//           }}
//         >
//           ADMIN PANEL
//         </div>

//         {step === "phone" ? (
//           <>
//             <div style={{ textAlign: "left", marginBottom: 16 }}>
//               <label
//                 style={{
//                   fontSize: 12,
//                   color: "#666",
//                   display: "block",
//                   marginBottom: 6,
//                   fontWeight: 600,
//                 }}
//               >
//                 Phone Number
//               </label>
//               <div style={{ display: "flex", gap: 8 }}>
//                 <div
//                   style={{
//                     padding: "11px 12px",
//                     border: "1px solid #ddd",
//                     borderRadius: 10,
//                     background: "#f9f9f9",
//                     fontSize: 14,
//                     display: "flex",
//                     alignItems: "center",
//                     gap: 4,
//                   }}
//                 >
//                   🇮🇳 <span style={{ color: "#555" }}>+91</span>
//                 </div>
//                 <input
//                   value={phone}
//                   onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
//                   maxLength={10}
//                   placeholder="123 456 7890"
//                   type="tel"
//                   style={{
//                     flex: 1,
//                     padding: "11px 12px",
//                     border: "1px solid #ddd",
//                     borderRadius: 10,
//                     fontSize: 14,
//                     outline: "none",
//                     boxSizing: "border-box",
//                   }}
//                 />
//               </div>
//             </div>
//             <Btn onClick={handleSend} loading={loading}>
//               Send OTP
//             </Btn>
//           </>
//         ) : (
//           <>
//             <div style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>
//               OTP sent to{" "}
//               <span style={{ color: PINK, fontWeight: 700 }}>+91 {phone}</span>
//             </div>
//             <input
//               value={otp}
//               onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
//               maxLength={6}
//               placeholder="Enter 6-digit OTP"
//               type="tel"
//               style={{
//                 width: "100%",
//                 padding: "13px",
//                 border: "2px solid #ddd",
//                 borderRadius: 12,
//                 fontSize: 20,
//                 textAlign: "center",
//                 fontWeight: 700,
//                 outline: "none",
//                 boxSizing: "border-box",
//                 marginBottom: 16,
//                 borderColor: otp.length === 6 ? PINK : "#ddd",
//               }}
//             />
//             <Btn onClick={handleVerify} loading={loading}>
//               Verify & Login
//             </Btn>
//             <div
//               onClick={() => setStep("phone")}
//               style={{
//                 marginTop: 12,
//                 color: PINK,
//                 fontSize: 13,
//                 cursor: "pointer",
//                 fontWeight: 600,
//               }}
//             >
//               ← Change number
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

// const Btn = ({ children, onClick, loading }) => (
//   <button
//     onClick={onClick}
//     disabled={loading}
//     style={{
//       width: "100%",
//       padding: "13px",
//       background: loading ? "#ccc" : PINK,
//       color: "#fff",
//       border: "none",
//       borderRadius: 25,
//       fontWeight: 700,
//       fontSize: 14,
//       cursor: loading ? "not-allowed" : "pointer",
//     }}
//   >
//     {loading ? "Please wait…" : children}
//   </button>
// );

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { firebaseVerify } from "../services/authService.js";
import { auth } from "../services/firebase.js";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import toast from "react-hot-toast";

const PINK = "#e91e8c";
let currentVerifier = null;

export default function LoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (phone.length < 10) return toast.error("Enter valid 10-digit phone");
    try {
      setLoading(true);

      // clear old verifier
      if (currentVerifier) {
        try { currentVerifier.clear(); } catch (_) {}
        currentVerifier = null;
      }
      const box = document.getElementById("recaptcha-box");
      if (box) box.innerHTML = "";

      // fresh verifier
      currentVerifier = new RecaptchaVerifier(auth, "recaptcha-box", {
        size: "invisible",
      });
      await currentVerifier.render();

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        `+91${phone}`,
        currentVerifier
      );

      currentVerifier.clear();
      if (box) box.innerHTML = "";

      window.confirmationResult = confirmationResult;
      setStep("otp");
      toast.success("OTP sent!");

    } catch (e) {
      console.error("Send OTP error:", e.code, e.message);
      if (currentVerifier) {
        try { currentVerifier.clear(); } catch (_) {}
        currentVerifier = null;
      }
      const box = document.getElementById("recaptcha-box");
      if (box) box.innerHTML = "";

      if (e.code === "auth/too-many-requests") {
        toast.error("Too many attempts. Please wait.");
      } else {
        toast.error("Failed to send OTP. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length < 6) return toast.error("Enter 6-digit OTP");
    if (!window.confirmationResult) {
      toast.error("Session expired. Please resend OTP.");
      setStep("phone");
      return;
    }
    try {
      setLoading(true);

      // verify with firebase
      const result = await window.confirmationResult.confirm(otp);
      const firebaseToken = await result.user.getIdToken();

      // send to your backend — same route as user app
      const { data } = await firebaseVerify(firebaseToken, "Admin");

      login(data);
      window.confirmationResult = null;
      nav("/");
      toast.success("Welcome, Admin!");

    } catch (e) {
      console.error("Verify error:", e.code, e.message);
      if (e.code === "auth/invalid-verification-code") {
        toast.error("Wrong OTP. Try again.");
      } else if (e.code === "auth/code-expired") {
        toast.error("OTP expired. Please resend.");
      } else {
        toast.error("Verification failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI',sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 36, width: 340, textAlign: "center" }}>

        <div style={{ color: PINK, fontWeight: 900, fontSize: 26, letterSpacing: 2, marginBottom: 4 }}>
          আড্ডা
        </div>
        <div style={{ color: "#aaa", fontSize: 11, letterSpacing: 4, marginBottom: 28 }}>
          ADMIN PANEL
        </div>

        {step === "phone" ? (
          <>
            <div style={{ textAlign: "left", marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 6, fontWeight: 600 }}>
                Phone Number
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ padding: "11px 12px", border: "1px solid #ddd", borderRadius: 10, background: "#f9f9f9", fontSize: 14, display: "flex", alignItems: "center", gap: 4 }}>
                  🇮🇳 <span style={{ color: "#555" }}>+91</span>
                </div>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  maxLength={10}
                  placeholder="123 456 7890"
                  type="tel"
                  style={{ flex: 1, padding: "11px 12px", border: "1px solid #ddd", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>
            <Btn onClick={handleSend} loading={loading}>Send OTP</Btn>
          </>
        ) : (
          <>
            <div style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>
              OTP sent to <span style={{ color: PINK, fontWeight: 700 }}>+91 {phone}</span>
            </div>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              type="tel"
              style={{
                width: "100%",
                padding: "13px",
                border: `2px solid ${otp.length === 6 ? PINK : "#ddd"}`,
                borderRadius: 12,
                fontSize: 20,
                textAlign: "center",
                fontWeight: 700,
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 16,
              }}
            />
            <Btn onClick={handleVerify} loading={loading}>Verify & Login</Btn>
            <div
              onClick={() => { setStep("phone"); setOtp(""); window.confirmationResult = null; }}
              style={{ marginTop: 12, color: PINK, fontSize: 13, cursor: "pointer", fontWeight: 600 }}
            >
              ← Change number
            </div>
          </>
        )}
      </div>

      {/* required for recaptcha */}
      <div id="recaptcha-box" style={{ position: "fixed", bottom: 0, left: 0, opacity: 0, pointerEvents: "none" }} />
    </div>
  );
}

const Btn = ({ children, onClick, loading }) => (
  <button
    onClick={onClick}
    disabled={loading}
    style={{
      width: "100%",
      padding: "13px",
      background: loading ? "#ccc" : PINK,
      color: "#fff",
      border: "none",
      borderRadius: 25,
      fontWeight: 700,
      fontSize: 14,
      cursor: loading ? "not-allowed" : "pointer",
    }}
  >
    {loading ? "Please wait…" : children}
  </button>
);