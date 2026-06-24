// import { useState, useEffect, useRef } from "react";
// import toast from "react-hot-toast";
// import {
//   getRestaurantProfile,
//   updateRestaurantProfile,
//   uploadRestaurantLogo,
// } from "../../services/adminService.js";

// // ── Design tokens ─────────────────────────────────────────────────────────────
// const PINK = "#e91e8c";
// const PINK_DARK = "#c2185b";
// const PINK_BG = "#fce4f3";
// const GREEN = "#1D9E75";
// const GREEN_BG = "#e1f5ee";
// const WHITE = "#fff";
// const BORDER = "rgba(0,0,0,.07)";
// const SURFACE = "#fafafa";

// // ── Inject styles once ────────────────────────────────────────────────────────
// if (!document.getElementById("profile-page-styles")) {
//   const s = document.createElement("style");
//   s.id = "profile-page-styles";
//   s.textContent = `
//     @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
//     .pp * { box-sizing: border-box; font-family: 'DM Sans', sans-serif; }
//     @keyframes pp-slide { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
//     .pp-card  { background:${WHITE}; border:1.5px solid ${BORDER}; border-radius:16px; padding:24px; margin-bottom:12px; }
//     .pp-label { font-size:11px; color:#bbb; text-transform:uppercase; letter-spacing:.8px; font-weight:500; margin-bottom:4px; }
//     .pp-val   { font-size:14px; color:#222; }
//     .pp-val.empty { color:#ccc; font-style:italic; }
//     .pp-input { width:100%; padding:10px 13px; border:1.5px solid #e8e8e8; border-radius:10px;
//                 font-size:14px; font-family:'DM Sans',sans-serif; outline:none;
//                 background:${WHITE}; color:#222; transition:border .15s; }
//     .pp-input:focus { border-color:${PINK}; box-shadow:0 0 0 3px rgba(233,30,140,.08); }
//     .pp-textarea { width:100%; padding:10px 13px; border:1.5px solid #e8e8e8; border-radius:10px;
//                    font-size:14px; font-family:'DM Sans',sans-serif; outline:none; resize:vertical;
//                    min-height:80px; background:${WHITE}; color:#222; transition:border .15s; }
//     .pp-textarea:focus { border-color:${PINK}; box-shadow:0 0 0 3px rgba(233,30,140,.08); }
//     .pp-edit-grid  { display:grid; grid-template-columns:1fr 1fr; gap:14px 18px; animation:pp-slide .18s ease; }
//     .pp-view-grid  { display:grid; grid-template-columns:1fr 1fr; gap:2px 24px; }
//     .pp-view-grid.cols3 { grid-template-columns:1fr 1fr 1fr; }
//     .pp-view-item  { padding:10px 0; border-bottom:1px solid #f5f5f5; }
//     .pp-view-item:last-child { border-bottom:none; }
//     .pp-field-full { grid-column:1/-1; }
//     .pp-edit-btn  { font-size:12px; font-family:'DM Sans',sans-serif; color:#888; background:#f5f5f5;
//                     border:1.5px solid #eee; border-radius:20px; padding:5px 14px; cursor:pointer;
//                     transition:all .12s; }
//     .pp-edit-btn:hover { color:#333; border-color:#ddd; background:#efefef; }
//     .pp-save-btn  { font-size:12px; font-family:'DM Sans',sans-serif; color:${WHITE}; background:${PINK};
//                     border:none; border-radius:20px; padding:5px 14px; cursor:pointer; margin-left:6px; transition:opacity .12s; }
//     .pp-save-btn:hover { opacity:.88; }
//     .pp-cancel-btn{ font-size:12px; font-family:'DM Sans',sans-serif; color:#888; background:none;
//                     border:1.5px solid #eee; border-radius:20px; padding:5px 14px; cursor:pointer; }
//     .pp-chip { display:inline-flex; align-items:center; gap:6px; padding:6px 16px; border-radius:20px;
//                border:1.5px solid #eee; font-size:13px; cursor:pointer; color:#999;
//                background:${WHITE}; transition:all .12s; user-select:none; }
//     .pp-chip.on  { background:${PINK_BG}; border-color:${PINK}; color:${PINK_DARK}; font-weight:500; }
//     .pp-badge { display:inline-flex; align-items:center; padding:3px 11px; border-radius:20px;
//                 font-size:12px; background:#f5f5f5; color:#999; border:1px solid #eee; }
//     .pp-badge.on { background:${PINK_BG}; color:${PINK_DARK}; border-color:#f4c0d1; }
//     .pp-loc-btn  { margin-top:10px; padding:8px 16px; background:#f5f5f5; border:1.5px solid #eee;
//                    border-radius:20px; font-size:13px; font-family:'DM Sans',sans-serif;
//                    cursor:pointer; color:#555; transition:all .12s; }
//     .pp-loc-btn:hover { background:#efefef; }
//     .pp-upload-lbl { display:inline-block; padding:8px 18px; background:#f5f5f5;
//                      border:1.5px solid #eee; border-radius:20px; font-size:13px; cursor:pointer;
//                      color:#555; transition:all .12s; }
//     .pp-upload-lbl:hover { background:#efefef; }
//     .pp-save-all { background:${PINK}; color:${WHITE}; padding:13px 40px; border:none;
//                    border-radius:30px; font-size:15px; font-weight:500;
//                    font-family:'DM Sans',sans-serif; cursor:pointer;
//                    box-shadow:0 4px 18px rgba(233,30,140,.28); transition:all .15s; }
//     .pp-save-all:hover { opacity:.9; transform:translateY(-1px); }
//     .pp-save-all:disabled { opacity:.55; cursor:not-allowed; transform:none; }
//   `;
//   document.head.appendChild(s);
// }

// // ── Helpers ───────────────────────────────────────────────────────────────────
// const fmt12 = (t) => {
//   if (!t) return "—";
//   const [h, m] = t.split(":").map(Number);
//   const ampm = h >= 12 ? "PM" : "AM";
//   const h12 = h % 12 || 12;
//   return `${h12}:${m < 10 ? "0" : ""}${m} ${ampm}`;
// };

// const orDash = (v) => (v && String(v).trim() ? v : "—");

// // ── SectionCard ───────────────────────────────────────────────────────────────
// const SectionCard = ({
//   icon,
//   iconBg,
//   title,
//   editing,
//   onEdit,
//   onSave,
//   onCancel,
//   viewContent,
//   editContent,
// }) => (
//   <div className="pp-card">
//     <div
//       style={{
//         display: "flex",
//         justifyContent: "space-between",
//         alignItems: "center",
//         marginBottom: 16,
//       }}
//     >
//       <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//         <div
//           style={{
//             width: 30,
//             height: 30,
//             borderRadius: 8,
//             background: iconBg,
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             fontSize: 15,
//           }}
//         >
//           {icon}
//         </div>
//         <span style={{ fontSize: 15, fontWeight: 500, color: "#111" }}>
//           {title}
//         </span>
//       </div>
//       <div style={{ display: "flex", alignItems: "center" }}>
//         {editing ? (
//           <>
//             <button className="pp-cancel-btn" onClick={onCancel}>
//               Cancel
//             </button>
//             <button className="pp-save-btn" onClick={onSave}>
//               Save
//             </button>
//           </>
//         ) : (
//           <button className="pp-edit-btn" onClick={onEdit}>
//             Edit
//           </button>
//         )}
//       </div>
//     </div>
//     {editing ? editContent : viewContent}
//   </div>
// );

// // ── ViewItem ──────────────────────────────────────────────────────────────────
// const ViewItem = ({ label, value, full }) => (
//   <div className={`pp-view-item${full ? " pp-field-full" : ""}`}>
//     <div className="pp-label">{label}</div>
//     <div className={`pp-val${!value || value === "—" ? " empty" : ""}`}>
//       {value || "—"}
//     </div>
//   </div>
// );

// // ── Field ─────────────────────────────────────────────────────────────────────
// const Field = ({ label, children, full }) => (
//   <div className={full ? "pp-field-full" : ""}>
//     <div
//       style={{ fontSize: 12, color: "#aaa", marginBottom: 5, fontWeight: 500 }}
//     >
//       {label}
//     </div>
//     {children}
//   </div>
// );

// // ── Main Page ─────────────────────────────────────────────────────────────────
// export default function ProfilePage() {
//   const DEFAULTS = {
//     restaurantName: "",
//     phone: "",
//     email: "",
//     contactPerson: "",
//     logo: "",
//     address: "",
//     city: "",
//     latitude: "",
//     longitude: "",
//     dineInRange: 50,
//     deliveryRange: 5000,
//     fssaiNumber: "",
//     gstNumber: "",
//     aboutRestaurant: "",
//     openingTime: "09:00",
//     closingTime: "22:00",
//     avgDeliveryTime: 30,
//     minOrderAmount: 0,
//     freeDeliveryAbove: 300,
//     deliveryBaseFee: 40,
//     deliveryFeePerKm: 8,
//     serviceCharge: 0,
//     packingCharge: 0,
//     socialInstagram: "",
//     socialFacebook: "",
//     website: "",
//     services: { dineIn: true, takeAway: true, delivery: true },
//     notificationSound: true,
//   };

//   const [profile, setProfile] = useState(DEFAULTS);
//   const [draft, setDraft] = useState(DEFAULTS); // working copy while editing
//   const [editing, setEditing] = useState({}); // { basic: true/false, ... }
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [uploading, setUploading] = useState(false);
//   const [logoPreview, setLogoPreview] = useState("");
//   const logoFileRef = useRef();

//   // ── Fetch ──────────────────────────────────────────────────────────────────
//   useEffect(() => {
//     (async () => {
//       try {
//         const res = await getRestaurantProfile();
//         if (res?.data?.data) {
//           const d = res.data.data;
//           const merged = {
//             ...DEFAULTS,
//             ...d,
//             services: { ...DEFAULTS.services, ...(d.services || {}) },
//           };
//           setProfile(merged);
//           setDraft(merged);
//         }
//       } catch {
//         toast.error("Failed to load profile");
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, []);

//   // ── Edit helpers ───────────────────────────────────────────────────────────
//   const startEdit = (sec) => {
//     setDraft({ ...profile });
//     setEditing((p) => ({ ...p, [sec]: true }));
//   };
//   const cancelEdit = (sec) => {
//     setEditing((p) => ({ ...p, [sec]: false }));
//   };

//   const saveSection = async (sec) => {
//     try {
//       const updated = { ...profile, ...sectionFields(sec) };
//       setProfile(updated);
//       setEditing((p) => ({ ...p, [sec]: false }));
//       await updateRestaurantProfile(updated);
//       toast.success("Section saved");
//     } catch {
//       toast.error("Failed to save");
//     }
//   };

//   // Extract only the fields belonging to each section from draft
//   const sectionFields = (sec) => {
//     const pick = (...keys) =>
//       Object.fromEntries(keys.map((k) => [k, draft[k]]));
//     switch (sec) {
//       case "basic":
//         return pick("restaurantName", "phone", "email", "contactPerson");
//       case "address":
//         return pick(
//           "address",
//           "city",
//           "latitude",
//           "longitude",
//           "dineInRange",
//           "deliveryRange",
//         );
//       case "biz":
//         return pick("fssaiNumber", "gstNumber", "aboutRestaurant");
//       case "hours":
//         return pick("openingTime", "closingTime", "avgDeliveryTime");
//       case "pricing":
//         return pick(
//           "minOrderAmount",
//           "freeDeliveryAbove",
//           "deliveryBaseFee",
//           "deliveryFeePerKm",
//           "serviceCharge",
//           "packingCharge",
//         );
//       case "social":
//         return pick("socialInstagram", "socialFacebook", "website");
//       case "services":
//         return pick("services", "notificationSound");
//       default:
//         return {};
//     }
//   };

//   // Generic field change inside draft
//   const set = (key, val) => setDraft((p) => ({ ...p, [key]: val }));
//   const setNum = (key, val) => setDraft((p) => ({ ...p, [key]: Number(val) }));
//   const setService = (svc) =>
//     setDraft((p) => ({
//       ...p,
//       services: { ...p.services, [svc]: !p.services[svc] },
//     }));

//   // ── Logo upload ────────────────────────────────────────────────────────────
//   const handleLogoUpload = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;
//     setLogoPreview(URL.createObjectURL(file));
//     setUploading(true);
//     const formData = new FormData();
//     formData.append("logo", file);
//     try {
//       const res = await uploadRestaurantLogo(formData);
//       const url = res?.data?.logoUrl;
//       setProfile((p) => ({ ...p, logo: url }));
//       setDraft((p) => ({ ...p, logo: url }));
//       toast.success("Logo uploaded");
//     } catch {
//       toast.error("Failed to upload logo");
//       setLogoPreview("");
//     } finally {
//       setUploading(false);
//     }
//   };

//   // ── Geolocation ────────────────────────────────────────────────────────────
//   const getCurrentLocation = () => {
//     if (!navigator.geolocation) return toast.error("Geolocation not supported");
//     navigator.geolocation.getCurrentPosition(
//       ({ coords }) => {
//         setDraft((p) => ({
//           ...p,
//           latitude: coords.latitude.toFixed(6),
//           longitude: coords.longitude.toFixed(6),
//         }));
//         toast.success("Location fetched");
//       },
//       () => toast.error("Could not get location"),
//     );
//   };

//   // ── Save all ───────────────────────────────────────────────────────────────
//   const handleSaveAll = async () => {
//     setSaving(true);
//     try {
//       await updateRestaurantProfile(profile);
//       toast.success("All settings saved!");
//     } catch {
//       toast.error("Failed to save");
//     } finally {
//       setSaving(false);
//     }
//   };

//   // ── Loading ────────────────────────────────────────────────────────────────
//   if (loading)
//     return (
//       <div
//         style={{
//           textAlign: "center",
//           padding: "100px 0",
//           color: "#ccc",
//           fontFamily: "'DM Sans',sans-serif",
//         }}
//       >
//         <div style={{ fontSize: 14 }}>Loading profile…</div>
//       </div>
//     );

//   const logoSrc = logoPreview || profile.logo;

//   return (
//     <div
//       className="pp"
//       style={{ maxWidth: 860, margin: "0 auto", paddingBottom: 60 }}
//     >
//       {/* Page Header */}
//       <div
//         style={{
//           marginBottom: 24,
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "flex-end",
//         }}
//       >
//         <div>
//           <h1
//             style={{
//               fontSize: 22,
//               fontWeight: 500,
//               color: "#111",
//               marginBottom: 4,
//             }}
//           >
//             Restaurant profile
//           </h1>
//           <p style={{ fontSize: 13, color: "#aaa" }}>
//             View and manage your restaurant information
//           </p>
//         </div>
//       </div>

//       {/* ── 1. Basic Information ─────────────────────────────────────────── */}
//       <SectionCard
//         icon="🏪"
//         iconBg={PINK_BG}
//         title="Basic information"
//         editing={editing.basic}
//         onEdit={() => startEdit("basic")}
//         onCancel={() => cancelEdit("basic")}
//         onSave={() => saveSection("basic")}
//         viewContent={
//           <div className="pp-view-grid">
//             <ViewItem
//               label="Restaurant name"
//               value={orDash(profile.restaurantName)}
//             />
//             <ViewItem label="Phone" value={orDash(profile.phone)} />
//             <ViewItem label="Email" value={orDash(profile.email)} />
//             <ViewItem
//               label="Contact person"
//               value={orDash(profile.contactPerson)}
//             />
//           </div>
//         }
//         editContent={
//           <div className="pp-edit-grid">
//             <Field label="Restaurant name">
//               <input
//                 className="pp-input"
//                 value={draft.restaurantName}
//                 onChange={(e) => set("restaurantName", e.target.value)}
//               />
//             </Field>
//             <Field label="Phone">
//               <input
//                 className="pp-input"
//                 value={draft.phone}
//                 onChange={(e) => set("phone", e.target.value)}
//               />
//             </Field>
//             <Field label="Email">
//               <input
//                 className="pp-input"
//                 type="email"
//                 value={draft.email}
//                 onChange={(e) => set("email", e.target.value)}
//               />
//             </Field>
//             <Field label="Contact person">
//               <input
//                 className="pp-input"
//                 value={draft.contactPerson}
//                 onChange={(e) => set("contactPerson", e.target.value)}
//               />
//             </Field>
//           </div>
//         }
//       />

//       {/* ── 2. Logo ──────────────────────────────────────────────────────── */}
//       <SectionCard
//         icon="🖼"
//         iconBg="#e6f1fb"
//         title="Restaurant logo"
//         editing={editing.logo}
//         onEdit={() => startEdit("logo")}
//         onCancel={() => cancelEdit("logo")}
//         onSave={() => cancelEdit("logo")}
//         viewContent={
//           <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
//             <div
//               style={{
//                 width: 88,
//                 height: 88,
//                 borderRadius: 14,
//                 border: `1.5px solid ${BORDER}`,
//                 overflow: "hidden",
//                 background: SURFACE,
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 fontSize: 12,
//                 color: "#ccc",
//                 flexShrink: 0,
//               }}
//             >
//               {logoSrc ? (
//                 <img
//                   src={logoSrc}
//                   alt="logo"
//                   style={{ width: "100%", height: "100%", objectFit: "cover" }}
//                 />
//               ) : (
//                 "No logo"
//               )}
//             </div>
//             <div>
//               <div style={{ fontSize: 14, color: "#555", fontWeight: 500 }}>
//                 {logoSrc ? "Logo uploaded" : "No logo set"}
//               </div>
//               <div style={{ fontSize: 12, color: "#bbb", marginTop: 3 }}>
//                 PNG, JPG or WebP · max 5MB
//               </div>
//             </div>
//           </div>
//         }
//         editContent={
//           <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
//             <div
//               style={{
//                 width: 88,
//                 height: 88,
//                 borderRadius: 14,
//                 border: `1.5px solid ${BORDER}`,
//                 overflow: "hidden",
//                 background: SURFACE,
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 fontSize: 12,
//                 color: "#ccc",
//                 flexShrink: 0,
//               }}
//             >
//               {logoSrc ? (
//                 <img
//                   src={logoSrc}
//                   alt="logo"
//                   style={{ width: "100%", height: "100%", objectFit: "cover" }}
//                 />
//               ) : (
//                 "No logo"
//               )}
//             </div>
//             <div>
//               <input
//                 type="file"
//                 accept="image/*"
//                 ref={logoFileRef}
//                 style={{ display: "none" }}
//                 onChange={handleLogoUpload}
//               />
//               <label
//                 className="pp-upload-lbl"
//                 onClick={() => logoFileRef.current?.click()}
//                 style={{ cursor: "pointer" }}
//               >
//                 {uploading ? "Uploading…" : "Upload new logo"}
//               </label>
//               <div style={{ fontSize: 12, color: "#bbb", marginTop: 8 }}>
//                 Recommended: 400×400px
//               </div>
//             </div>
//           </div>
//         }
//       />

//       {/* ── 3. Address & Location ─────────────────────────────────────────── */}
//       <SectionCard
//         icon="📍"
//         iconBg={GREEN_BG}
//         title="Address & location"
//         editing={editing.address}
//         onEdit={() => startEdit("address")}
//         onCancel={() => cancelEdit("address")}
//         onSave={() => saveSection("address")}
//         viewContent={
//           <div className="pp-view-grid">
//             <ViewItem
//               full
//               label="Full address"
//               value={orDash(profile.address)}
//             />
//             <ViewItem label="City" value={orDash(profile.city)} />
//             <ViewItem
//               label="Coordinates"
//               value={
//                 profile.latitude && profile.longitude
//                   ? `${profile.latitude}, ${profile.longitude}`
//                   : "—"
//               }
//             />
//             <ViewItem
//               label="Dine-in range"
//               value={profile.dineInRange ? `${profile.dineInRange} m` : "—"}
//             />
//             <ViewItem
//               label="Delivery range"
//               value={profile.deliveryRange ? `${profile.deliveryRange} m` : "—"}
//             />
//           </div>
//         }
//         editContent={
//           <div>
//             <div className="pp-edit-grid">
//               <Field label="Full address" full>
//                 <input
//                   className="pp-input"
//                   value={draft.address}
//                   onChange={(e) => set("address", e.target.value)}
//                 />
//               </Field>
//               <Field label="City">
//                 <input
//                   className="pp-input"
//                   value={draft.city}
//                   onChange={(e) => set("city", e.target.value)}
//                 />
//               </Field>
//               <Field label="Dine-in range (m)">
//                 <input
//                   className="pp-input"
//                   type="number"
//                   value={draft.dineInRange}
//                   onChange={(e) => setNum("dineInRange", e.target.value)}
//                 />
//               </Field>
//               <Field label="Latitude">
//                 <input
//                   className="pp-input"
//                   value={draft.latitude}
//                   onChange={(e) => set("latitude", e.target.value)}
//                 />
//               </Field>
//               <Field label="Longitude">
//                 <input
//                   className="pp-input"
//                   value={draft.longitude}
//                   onChange={(e) => set("longitude", e.target.value)}
//                 />
//               </Field>
//               <Field label="Delivery range (m)">
//                 <input
//                   className="pp-input"
//                   type="number"
//                   value={draft.deliveryRange}
//                   onChange={(e) => setNum("deliveryRange", e.target.value)}
//                 />
//               </Field>
//             </div>
//             <button className="pp-loc-btn" onClick={getCurrentLocation}>
//               📍 Use my current location
//             </button>
//           </div>
//         }
//       />

//       {/* ── 4. Business Details ───────────────────────────────────────────── */}
//       <SectionCard
//         icon="📋"
//         iconBg="#faeeda"
//         title="Business details"
//         editing={editing.biz}
//         onEdit={() => startEdit("biz")}
//         onCancel={() => cancelEdit("biz")}
//         onSave={() => saveSection("biz")}
//         viewContent={
//           <div className="pp-view-grid">
//             <ViewItem
//               label="FSSAI number"
//               value={orDash(profile.fssaiNumber)}
//             />
//             <ViewItem label="GST number" value={orDash(profile.gstNumber)} />
//             <ViewItem
//               full
//               label="About restaurant"
//               value={orDash(profile.aboutRestaurant)}
//             />
//           </div>
//         }
//         editContent={
//           <div className="pp-edit-grid">
//             <Field label="FSSAI number">
//               <input
//                 className="pp-input"
//                 value={draft.fssaiNumber}
//                 onChange={(e) => set("fssaiNumber", e.target.value)}
//               />
//             </Field>
//             <Field label="GST number">
//               <input
//                 className="pp-input"
//                 value={draft.gstNumber}
//                 onChange={(e) => set("gstNumber", e.target.value)}
//               />
//             </Field>
//             <Field label="About restaurant" full>
//               <textarea
//                 className="pp-textarea"
//                 value={draft.aboutRestaurant}
//                 onChange={(e) => set("aboutRestaurant", e.target.value)}
//               />
//             </Field>
//           </div>
//         }
//       />

//       {/* ── 5. Operating Hours ────────────────────────────────────────────── */}
//       <SectionCard
//         icon="🕐"
//         iconBg="#e6f1fb"
//         title="Operating hours"
//         editing={editing.hours}
//         onEdit={() => startEdit("hours")}
//         onCancel={() => cancelEdit("hours")}
//         onSave={() => saveSection("hours")}
//         viewContent={
//           <div className="pp-view-grid cols3">
//             <ViewItem label="Opens" value={fmt12(profile.openingTime)} />
//             <ViewItem label="Closes" value={fmt12(profile.closingTime)} />
//             <ViewItem
//               label="Avg delivery time"
//               value={
//                 profile.avgDeliveryTime ? `${profile.avgDeliveryTime} min` : "—"
//               }
//             />
//           </div>
//         }
//         editContent={
//           <div
//             className="pp-edit-grid"
//             style={{ gridTemplateColumns: "1fr 1fr 1fr" }}
//           >
//             <Field label="Opening time">
//               <input
//                 className="pp-input"
//                 type="time"
//                 value={draft.openingTime}
//                 onChange={(e) => set("openingTime", e.target.value)}
//               />
//             </Field>
//             <Field label="Closing time">
//               <input
//                 className="pp-input"
//                 type="time"
//                 value={draft.closingTime}
//                 onChange={(e) => set("closingTime", e.target.value)}
//               />
//             </Field>
//             <Field label="Avg delivery (mins)">
//               <input
//                 className="pp-input"
//                 type="number"
//                 value={draft.avgDeliveryTime}
//                 onChange={(e) => setNum("avgDeliveryTime", e.target.value)}
//               />
//             </Field>
//           </div>
//         }
//       />

//       {/* ── 6. Pricing & Delivery ─────────────────────────────────────────── */}
//       <SectionCard
//         icon="₹"
//         iconBg={GREEN_BG}
//         title="Pricing & delivery"
//         editing={editing.pricing}
//         onEdit={() => startEdit("pricing")}
//         onCancel={() => cancelEdit("pricing")}
//         onSave={() => saveSection("pricing")}
//         viewContent={
//           <div className="pp-view-grid">
//             <ViewItem
//               label="Min order amount"
//               value={`₹${profile.minOrderAmount}`}
//             />
//             <ViewItem
//               label="Free delivery above"
//               value={`₹${profile.freeDeliveryAbove}`}
//             />
//             <ViewItem
//               label="Delivery base fee"
//               value={`₹${profile.deliveryBaseFee}`}
//             />
//             <ViewItem
//               label="Delivery fee / km"
//               value={`₹${profile.deliveryFeePerKm}`}
//             />
//             <ViewItem
//               label="Service charge"
//               value={`${profile.serviceCharge}%`}
//             />
//             <ViewItem
//               label="Packing charge"
//               value={`₹${profile.packingCharge}`}
//             />
//           </div>
//         }
//         editContent={
//           <div className="pp-edit-grid">
//             {[
//               { label: "Min order amount (₹)", key: "minOrderAmount" },
//               { label: "Free delivery above (₹)", key: "freeDeliveryAbove" },
//               { label: "Delivery base fee (₹)", key: "deliveryBaseFee" },
//               { label: "Delivery fee per km (₹)", key: "deliveryFeePerKm" },
//               { label: "Service charge (%)", key: "serviceCharge" },
//               { label: "Packing charge (₹)", key: "packingCharge" },
//             ].map(({ label, key }) => (
//               <Field key={key} label={label}>
//                 <input
//                   className="pp-input"
//                   type="number"
//                   value={draft[key]}
//                   onChange={(e) => setNum(key, e.target.value)}
//                 />
//               </Field>
//             ))}
//           </div>
//         }
//       />

//       {/* ── 7. Additional Charges ─────────────────────────────────────────── */}
//       {/* Already covered in pricing section above — separate card if needed */}

//       {/* ── 8. Social Media ───────────────────────────────────────────────── */}
//       <SectionCard
//         icon="🔗"
//         iconBg={PINK_BG}
//         title="Social media & website"
//         editing={editing.social}
//         onEdit={() => startEdit("social")}
//         onCancel={() => cancelEdit("social")}
//         onSave={() => saveSection("social")}
//         viewContent={
//           <div className="pp-view-grid">
//             <ViewItem
//               label="Instagram"
//               value={profile.socialInstagram || null}
//             />
//             <ViewItem label="Facebook" value={profile.socialFacebook || null} />
//             <ViewItem full label="Website" value={profile.website || null} />
//           </div>
//         }
//         editContent={
//           <div className="pp-edit-grid">
//             <Field label="Instagram URL">
//               <input
//                 className="pp-input"
//                 value={draft.socialInstagram}
//                 placeholder="https://instagram.com/…"
//                 onChange={(e) => set("socialInstagram", e.target.value)}
//               />
//             </Field>
//             <Field label="Facebook URL">
//               <input
//                 className="pp-input"
//                 value={draft.socialFacebook}
//                 placeholder="https://facebook.com/…"
//                 onChange={(e) => set("socialFacebook", e.target.value)}
//               />
//             </Field>
//             <Field label="Website" full>
//               <input
//                 className="pp-input"
//                 value={draft.website}
//                 placeholder="https://yourwebsite.com"
//                 onChange={(e) => set("website", e.target.value)}
//               />
//             </Field>
//           </div>
//         }
//       />

//       {/* ── 9. Services & Preferences ─────────────────────────────────────── */}
//       <SectionCard
//         icon="✅"
//         iconBg="#eaf3de"
//         title="Services & preferences"
//         editing={editing.services}
//         onEdit={() => startEdit("services")}
//         onCancel={() => cancelEdit("services")}
//         onSave={() => saveSection("services")}
//         viewContent={
//           <div>
//             <div className="pp-label" style={{ marginBottom: 10 }}>
//               Services offered
//             </div>
//             <div
//               style={{
//                 display: "flex",
//                 gap: 8,
//                 flexWrap: "wrap",
//                 marginBottom: 16,
//               }}
//             >
//               {[
//                 { key: "dineIn", label: "Dine-in" },
//                 { key: "takeAway", label: "Take away" },
//                 { key: "delivery", label: "Delivery" },
//               ].map(({ key, label }) => (
//                 <span
//                   key={key}
//                   className={`pp-badge${profile.services[key] ? " on" : ""}`}
//                 >
//                   {label}
//                 </span>
//               ))}
//             </div>
//             <div
//               style={{
//                 borderTop: `1px solid #f5f5f5`,
//                 paddingTop: 14,
//                 fontSize: 14,
//                 color: "#555",
//                 display: "flex",
//                 alignItems: "center",
//                 gap: 8,
//               }}
//             >
//               <span>{profile.notificationSound ? "🔔" : "🔕"}</span>
//               <span>
//                 {profile.notificationSound
//                   ? "Notification sound enabled"
//                   : "Notification sound disabled"}
//               </span>
//             </div>
//           </div>
//         }
//         editContent={
//           <div>
//             <div className="pp-label" style={{ marginBottom: 10 }}>
//               Services offered
//             </div>
//             <div
//               style={{
//                 display: "flex",
//                 gap: 10,
//                 flexWrap: "wrap",
//                 marginBottom: 20,
//               }}
//             >
//               {[
//                 { key: "dineIn", label: "Dine-in" },
//                 { key: "takeAway", label: "Take away" },
//                 { key: "delivery", label: "Delivery" },
//               ].map(({ key, label }) => (
//                 <div
//                   key={key}
//                   className={`pp-chip${draft.services[key] ? " on" : ""}`}
//                   onClick={() => setService(key)}
//                 >
//                   {draft.services[key] ? "✓ " : ""}
//                   {label}
//                 </div>
//               ))}
//             </div>
//             <div
//               style={{
//                 borderTop: `1px solid #f5f5f5`,
//                 paddingTop: 14,
//                 display: "flex",
//                 alignItems: "center",
//                 gap: 10,
//               }}
//             >
//               <input
//                 type="checkbox"
//                 id="notif-chk"
//                 checked={draft.notificationSound}
//                 onChange={(e) => set("notificationSound", e.target.checked)}
//                 style={{
//                   accentColor: PINK,
//                   width: 16,
//                   height: 16,
//                   cursor: "pointer",
//                 }}
//               />
//               <label
//                 htmlFor="notif-chk"
//                 style={{ fontSize: 14, color: "#444", cursor: "pointer" }}
//               >
//                 Enable notification sound
//               </label>
//             </div>
//           </div>
//         }
//       />

//       {/* ── Save All ──────────────────────────────────────────────────────── */}
//       <div style={{ textAlign: "center", paddingTop: 24 }}>
//         <button
//           className="pp-save-all"
//           onClick={handleSaveAll}
//           disabled={saving}
//         >
//           {saving ? "Saving…" : "Save all settings"}
//         </button>
//       </div>
//     </div>
//   );
// }
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import {
  getRestaurantProfile,
  updateRestaurantProfile,
  uploadRestaurantLogo,
  uploadRestaurantBanner,
  updateRestaurantBanner,
  deleteRestaurantBanner,
  addRestaurantPrinter,
  updateRestaurantPrinter,
  deleteRestaurantPrinter,
} from "../../services/adminService.js";

// ── Design tokens ─────────────────────────────────────────────────────────────
const PINK      = "#e91e8c";
const PINK_DARK = "#c2185b";
const PINK_BG   = "#fce4f3";
const GREEN_BG  = "#e1f5ee";
const WHITE     = "#fff";
const BORDER    = "rgba(0,0,0,.07)";
const SURFACE   = "#fafafa";

// ── Inject styles once ────────────────────────────────────────────────────────
if (!document.getElementById("profile-page-styles")) {
  const s = document.createElement("style");
  s.id = "profile-page-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
    .pp * { box-sizing: border-box; font-family: 'DM Sans', sans-serif; }
    @keyframes pp-slide { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    .pp-card     { background:${WHITE}; border:1.5px solid ${BORDER}; border-radius:16px; padding:24px; margin-bottom:12px; }
    .pp-label    { font-size:11px; color:#bbb; text-transform:uppercase; letter-spacing:.8px; font-weight:500; margin-bottom:4px; }
    .pp-val      { font-size:14px; color:#222; }
    .pp-val.empty{ color:#ccc; font-style:italic; }
    .pp-input    { width:100%; padding:10px 13px; border:1.5px solid #e8e8e8; border-radius:10px;
                   font-size:14px; font-family:'DM Sans',sans-serif; outline:none;
                   background:${WHITE}; color:#222; transition:border .15s; }
    .pp-input:focus { border-color:${PINK}; box-shadow:0 0 0 3px rgba(233,30,140,.08); }
    .pp-textarea { width:100%; padding:10px 13px; border:1.5px solid #e8e8e8; border-radius:10px;
                   font-size:14px; font-family:'DM Sans',sans-serif; outline:none; resize:vertical;
                   min-height:80px; background:${WHITE}; color:#222; transition:border .15s; }
    .pp-textarea:focus { border-color:${PINK}; box-shadow:0 0 0 3px rgba(233,30,140,.08); }
    .pp-edit-grid  { display:grid; grid-template-columns:1fr 1fr; gap:14px 18px; animation:pp-slide .18s ease; }
    .pp-view-grid  { display:grid; grid-template-columns:1fr 1fr; gap:2px 24px; }
    .pp-view-grid.cols3 { grid-template-columns:1fr 1fr 1fr; }
    .pp-view-item  { padding:10px 0; border-bottom:1px solid #f5f5f5; }
    .pp-view-item:last-child { border-bottom:none; }
    .pp-field-full { grid-column:1/-1; }
    .pp-edit-btn   { font-size:12px; font-family:'DM Sans',sans-serif; color:#888; background:#f5f5f5;
                     border:1.5px solid #eee; border-radius:20px; padding:5px 14px; cursor:pointer; transition:all .12s; }
    .pp-edit-btn:hover { color:#333; border-color:#ddd; background:#efefef; }
    .pp-save-btn   { font-size:12px; font-family:'DM Sans',sans-serif; color:${WHITE}; background:${PINK};
                     border:none; border-radius:20px; padding:5px 14px; cursor:pointer; margin-left:6px; transition:opacity .12s; }
    .pp-save-btn:hover { opacity:.88; }
    .pp-cancel-btn { font-size:12px; font-family:'DM Sans',sans-serif; color:#888; background:none;
                     border:1.5px solid #eee; border-radius:20px; padding:5px 14px; cursor:pointer; }
    .pp-chip  { display:inline-flex; align-items:center; gap:6px; padding:6px 16px; border-radius:20px;
                border:1.5px solid #eee; font-size:13px; cursor:pointer; color:#999;
                background:${WHITE}; transition:all .12s; user-select:none; }
    .pp-chip.on { background:${PINK_BG}; border-color:${PINK}; color:${PINK_DARK}; font-weight:500; }
    .pp-badge { display:inline-flex; align-items:center; padding:3px 11px; border-radius:20px;
                font-size:12px; background:#f5f5f5; color:#999; border:1px solid #eee; }
    .pp-badge.on { background:${PINK_BG}; color:${PINK_DARK}; border-color:#f4c0d1; }
    .pp-loc-btn   { margin-top:10px; padding:8px 16px; background:#f5f5f5; border:1.5px solid #eee;
                    border-radius:20px; font-size:13px; font-family:'DM Sans',sans-serif;
                    cursor:pointer; color:#555; transition:all .12s; }
    .pp-loc-btn:hover { background:#efefef; }
    .pp-upload-lbl { display:inline-block; padding:8px 18px; background:#f5f5f5;
                     border:1.5px solid #eee; border-radius:20px; font-size:13px; cursor:pointer;
                     color:#555; transition:all .12s; }
    .pp-upload-lbl:hover { background:#efefef; }
    .pp-save-all  { background:${PINK}; color:${WHITE}; padding:13px 40px; border:none;
                    border-radius:30px; font-size:15px; font-weight:500;
                    font-family:'DM Sans',sans-serif; cursor:pointer;
                    box-shadow:0 4px 18px rgba(233,30,140,.28); transition:all .15s; }
    .pp-save-all:hover    { opacity:.9; transform:translateY(-1px); }
    .pp-save-all:disabled { opacity:.55; cursor:not-allowed; transform:none; }

    /* ── Banner & Printer rows ── */
    .pp-list-row { display:flex; align-items:center; gap:12px; padding:10px 0;
                   border-bottom:1px solid #f5f5f5; animation:pp-slide .15s ease; }
    .pp-list-row:last-child { border-bottom:none; }
    .pp-icon-btn  { width:30px; height:30px; border-radius:8px; border:1.5px solid #eee;
                    background:#fafafa; cursor:pointer; display:inline-flex; align-items:center;
                    justify-content:center; font-size:13px; transition:all .12s; flex-shrink:0; }
    .pp-icon-btn:hover { background:#f0f0f0; border-color:#ddd; }
    .pp-icon-btn.danger:hover { background:#fff0f0; border-color:#fca5a5; }
    .pp-add-row  { display:flex; align-items:center; gap:10px; padding-top:14px;
                   border-top:1px solid #f5f5f5; margin-top:6px; flex-wrap:wrap; }
    .pp-add-btn  { padding:7px 18px; background:${PINK}; color:${WHITE}; border:none;
                   border-radius:20px; font-size:13px; font-family:'DM Sans',sans-serif;
                   cursor:pointer; transition:opacity .12s; white-space:nowrap; }
    .pp-add-btn:disabled { opacity:.55; cursor:not-allowed; }
    .pp-add-btn:hover:not(:disabled) { opacity:.88; }
    .pp-toggle   { position:relative; width:36px; height:20px; flex-shrink:0; }
    .pp-toggle input { opacity:0; width:0; height:0; }
    .pp-toggle-slider { position:absolute; inset:0; background:#ddd; border-radius:20px;
                        cursor:pointer; transition:.2s; }
    .pp-toggle-slider:before { content:''; position:absolute; width:14px; height:14px;
                                left:3px; top:3px; background:#fff; border-radius:50%; transition:.2s; }
    .pp-toggle input:checked + .pp-toggle-slider { background:${PINK}; }
    .pp-toggle input:checked + .pp-toggle-slider:before { transform:translateX(16px); }
    .pp-thumb { width:52px; height:36px; object-fit:cover; border-radius:7px;
                border:1.5px solid ${BORDER}; flex-shrink:0; background:${SURFACE}; }
    .pp-status-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
  `;
  document.head.appendChild(s);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt12 = (t) => {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12  = h % 12 || 12;
  return `${h12}:${m < 10 ? "0" : ""}${m} ${ampm}`;
};
const orDash = (v) => (v && String(v).trim() ? v : "—");

// ── Sub-components ────────────────────────────────────────────────────────────
const SectionCard = ({ icon, iconBg, title, editing, onEdit, onSave, onCancel, viewContent, editContent }) => (
  <div className="pp-card">
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:30, height:30, borderRadius:8, background:iconBg, display:"flex",
                      alignItems:"center", justifyContent:"center", fontSize:15 }}>{icon}</div>
        <span style={{ fontSize:15, fontWeight:500, color:"#111" }}>{title}</span>
      </div>
      <div style={{ display:"flex", alignItems:"center" }}>
        {editing ? (
          <>
            <button className="pp-cancel-btn" onClick={onCancel}>Cancel</button>
            <button className="pp-save-btn"   onClick={onSave}>Save</button>
          </>
        ) : (
          <button className="pp-edit-btn" onClick={onEdit}>Edit</button>
        )}
      </div>
    </div>
    {editing ? editContent : viewContent}
  </div>
);

const ViewItem = ({ label, value, full }) => (
  <div className={`pp-view-item${full ? " pp-field-full" : ""}`}>
    <div className="pp-label">{label}</div>
    <div className={`pp-val${!value || value === "—" ? " empty" : ""}`}>{value || "—"}</div>
  </div>
);

const Field = ({ label, children, full }) => (
  <div className={full ? "pp-field-full" : ""}>
    <div style={{ fontSize:12, color:"#aaa", marginBottom:5, fontWeight:500 }}>{label}</div>
    {children}
  </div>
);

const Toggle = ({ checked, onChange }) => (
  <label className="pp-toggle">
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span className="pp-toggle-slider" />
  </label>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const DEFAULTS = {
    restaurantName:"", phone:"", email:"", contactPerson:"", logo:"",
    address:"", city:"", latitude:"", longitude:"",
    dineInRange:50, deliveryRange:5000,
    fssaiNumber:"", gstNumber:"", aboutRestaurant:"", gstRate: 18,
    openingTime:"09:00", closingTime:"22:00", avgDeliveryTime:30,
    minOrderAmount:0, freeDeliveryAbove:300, deliveryBaseFee:40, deliveryFeePerKm:8,
    serviceCharge:0, packingCharge:0,

    socialInstagram:"", socialFacebook:"", website:"",
    services:{ dineIn:true, takeAway:true, delivery:true },
    notificationSound:true,
    banners:[], printerIps:[],
  };

  const [profile,    setProfile]    = useState(DEFAULTS);
  const [draft,      setDraft]      = useState(DEFAULTS);
  const [editing,    setEditing]    = useState({});
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [logoPreview,setLogoPreview]= useState("");

  // Banner add-row state
  const [bannerFile,    setBannerFile]    = useState(null);
  const [bannerLink,    setBannerLink]    = useState("");
  const [bannerUploading,setBannerUploading]= useState(false);
  const bannerFileRef = useRef();

  // Printer add-row state
  const [newPrinterIp,  setNewPrinterIp]  = useState("");
  const [newPrinterName,setNewPrinterName]= useState("");
  const [printerSaving, setPrinterSaving] = useState(false);

  const logoFileRef = useRef();

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await getRestaurantProfile();
        if (res?.data?.data) {
          const d = res.data.data;
          const merged = {
            ...DEFAULTS, ...d,
            services:   { ...DEFAULTS.services,   ...(d.services   || {}) },
            banners:    d.banners    || [],
            printerIps: d.printerIps || [],
          };
          setProfile(merged);
          setDraft(merged);
        }
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Section edit helpers ───────────────────────────────────────────────────
  const startEdit  = (sec) => { setDraft({ ...profile }); setEditing(p => ({ ...p, [sec]:true  })); };
  const cancelEdit = (sec) => {                            setEditing(p => ({ ...p, [sec]:false })); };

  const sectionFields = (sec) => {
    const pick = (...keys) => Object.fromEntries(keys.map(k => [k, draft[k]]));
    switch (sec) {
      case "basic":   return pick("restaurantName","phone","email","contactPerson");
      case "address": return pick("address","city","latitude","longitude","dineInRange","deliveryRange");
      case "biz":     return pick("fssaiNumber","gstNumber","aboutRestaurant");
      case "hours":   return pick("openingTime","closingTime","avgDeliveryTime");
      case "pricing": return pick("minOrderAmount","freeDeliveryAbove","deliveryBaseFee","deliveryFeePerKm","serviceCharge","packingCharge","gstRate");
      case "social":  return pick("socialInstagram","socialFacebook","website");
      case "services":return pick("services","notificationSound");
      default:        return {};
    }
  };

  const saveSection = async (sec) => {
    try {
      const updated = { ...profile, ...sectionFields(sec) };
      setProfile(updated);
      setEditing(p => ({ ...p, [sec]:false }));
      await updateRestaurantProfile(updated);
      toast.success("Section saved");
    } catch {
      toast.error("Failed to save");
    }
  };

  const set    = (key, val) => setDraft(p => ({ ...p, [key]:val }));
  const setNum = (key, val) => setDraft(p => ({ ...p, [key]:Number(val) }));
  const setService = (svc)  => setDraft(p => ({ ...p, services:{ ...p.services, [svc]:!p.services[svc] } }));

  // ── Logo ───────────────────────────────────────────────────────────────────
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
    setUploading(true);
    const fd = new FormData();
    fd.append("logo", file);
    try {
      const res = await uploadRestaurantLogo(fd);
      const url = res?.data?.logoUrl;
      setProfile(p => ({ ...p, logo:url }));
      setDraft(p   => ({ ...p, logo:url }));
      toast.success("Logo uploaded");
    } catch {
      toast.error("Failed to upload logo");
      setLogoPreview("");
    } finally {
      setUploading(false);
    }
  };

  // ── Geolocation ────────────────────────────────────────────────────────────
  const getCurrentLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setDraft(p => ({ ...p, latitude:coords.latitude.toFixed(6), longitude:coords.longitude.toFixed(6) }));
        toast.success("Location fetched");
      },
      () => toast.error("Could not get location"),
    );
  };

  // ── Banner: upload new ─────────────────────────────────────────────────────
  const handleBannerFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setBannerFile(file);
  };

  const handleAddBanner = async () => {
    if (!bannerFile) return toast.error("Please select an image");
    setBannerUploading(true);
    try {
      const fd = new FormData();
      fd.append("banner", bannerFile);
      if (bannerLink) fd.append("link", bannerLink);
      fd.append("active", "true");
      const res = await uploadRestaurantBanner(fd);
      const updated = res?.data?.data;
      if (updated) {
        setProfile(p => ({ ...p, banners: updated.banners }));
        setDraft(p   => ({ ...p, banners: updated.banners }));
      }
      setBannerFile(null);
      setBannerLink("");
      if (bannerFileRef.current) bannerFileRef.current.value = "";
      toast.success("Banner added");
    } catch {
      toast.error("Failed to upload banner");
    } finally {
      setBannerUploading(false);
    }
  };

  // ── Banner: toggle active ──────────────────────────────────────────────────
  const handleToggleBanner = async (banner) => {
    const optimistic = profile.banners.map(b =>
      b._id === banner._id ? { ...b, active: !b.active } : b
    );
    setProfile(p => ({ ...p, banners: optimistic }));
    try {
      await updateRestaurantBanner(banner._id, { active: !banner.active });
    } catch {
      toast.error("Failed to update banner");
      setProfile(p => ({ ...p, banners: profile.banners })); // rollback
    }
  };

  // ── Banner: delete ─────────────────────────────────────────────────────────
  const handleDeleteBanner = async (bannerId) => {
    if (!window.confirm("Delete this banner?")) return;
    try {
      const res = await deleteRestaurantBanner(bannerId);
      const updated = res?.data?.data;
      if (updated) {
        setProfile(p => ({ ...p, banners: updated.banners }));
        setDraft(p   => ({ ...p, banners: updated.banners }));
      }
      toast.success("Banner deleted");
    } catch {
      toast.error("Failed to delete banner");
    }
  };

  // ── Printer: add ──────────────────────────────────────────────────────────
  const handleAddPrinter = async () => {
    if (!newPrinterIp.trim()) return toast.error("Enter an IP address");
    setPrinterSaving(true);
    try {
      const res = await addRestaurantPrinter({
        ip:   newPrinterIp.trim(),
        name: newPrinterName.trim() || "Printer",
        active: true,
      });
      const updated = res?.data?.data;
      if (updated) {
        setProfile(p => ({ ...p, printerIps: updated.printerIps }));
        setDraft(p   => ({ ...p, printerIps: updated.printerIps }));
      }
      setNewPrinterIp(""); setNewPrinterName("");
      toast.success("Printer added");
    } catch {
      toast.error("Failed to add printer");
    } finally {
      setPrinterSaving(false);
    }
  };

  // ── Printer: toggle active ────────────────────────────────────────────────
  const handleTogglePrinter = async (printer) => {
    const optimistic = profile.printerIps.map(p =>
      p._id === printer._id ? { ...p, active: !p.active } : p
    );
    setProfile(p => ({ ...p, printerIps: optimistic }));
    try {
      await updateRestaurantPrinter(printer._id, { active: !printer.active });
    } catch {
      toast.error("Failed to update printer");
      setProfile(p => ({ ...p, printerIps: profile.printerIps })); // rollback
    }
  };

  // ── Printer: delete ───────────────────────────────────────────────────────
  const handleDeletePrinter = async (printerId) => {
    if (!window.confirm("Remove this printer?")) return;
    try {
      const res = await deleteRestaurantPrinter(printerId);
      const updated = res?.data?.data;
      if (updated) {
        setProfile(p => ({ ...p, printerIps: updated.printerIps }));
        setDraft(p   => ({ ...p, printerIps: updated.printerIps }));
      }
      toast.success("Printer removed");
    } catch {
      toast.error("Failed to remove printer");
    }
  };

  // ── Save all ───────────────────────────────────────────────────────────────
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await updateRestaurantProfile(profile);
      toast.success("All settings saved!");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div style={{ textAlign:"center", padding:"100px 0", color:"#ccc", fontFamily:"'DM Sans',sans-serif" }}>
        <div style={{ fontSize:14 }}>Loading profile…</div>
      </div>
    );

  const logoSrc = logoPreview || profile.logo;

  return (
    <div className="pp" style={{ maxWidth:860, margin:"0 auto", paddingBottom:60 }}>

      {/* Page Header */}
      <div style={{ marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:500, color:"#111", marginBottom:4 }}>Restaurant profile</h1>
          <p  style={{ fontSize:13, color:"#aaa" }}>View and manage your restaurant information</p>
        </div>
      </div>

      {/* ── 1. Basic Information ─────────────────────────────────────────── */}
      <SectionCard
        icon="🏪" iconBg={PINK_BG} title="Basic information"
        editing={editing.basic}
        onEdit={() => startEdit("basic")} onCancel={() => cancelEdit("basic")} onSave={() => saveSection("basic")}
        viewContent={
          <div className="pp-view-grid">
            <ViewItem label="Restaurant name" value={orDash(profile.restaurantName)} />
            <ViewItem label="Phone"           value={orDash(profile.phone)} />
            <ViewItem label="Email"           value={orDash(profile.email)} />
            <ViewItem label="Contact person"  value={orDash(profile.contactPerson)} />
            {/* <ViewItem label="GST Rate" value={`${profile.gstRate}%`} />  */}
          </div>
        }
        editContent={
          <div className="pp-edit-grid">
            <Field label="Restaurant name">
              <input className="pp-input" value={draft.restaurantName} onChange={e => set("restaurantName", e.target.value)} />
            </Field>
            <Field label="Phone">
              <input className="pp-input" value={draft.phone} onChange={e => set("phone", e.target.value)} />
            </Field>
            <Field label="Email">
              <input className="pp-input" type="email" value={draft.email} onChange={e => set("email", e.target.value)} />
            </Field>
            <Field label="Contact person">
              <input className="pp-input" value={draft.contactPerson} onChange={e => set("contactPerson", e.target.value)} />
            </Field>
          </div>
        }
      />

      {/* ── 2. Logo ──────────────────────────────────────────────────────── */}
      <SectionCard
        icon="🖼" iconBg="#e6f1fb" title="Restaurant logo"
        editing={editing.logo}
        onEdit={() => startEdit("logo")} onCancel={() => cancelEdit("logo")} onSave={() => cancelEdit("logo")}
        viewContent={
          <div style={{ display:"flex", alignItems:"center", gap:20 }}>
            <div style={{ width:88, height:88, borderRadius:14, border:`1.5px solid ${BORDER}`, overflow:"hidden",
                          background:SURFACE, display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:12, color:"#ccc", flexShrink:0 }}>
              {logoSrc ? <img src={logoSrc} alt="logo" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : "No logo"}
            </div>
            <div>
              <div style={{ fontSize:14, color:"#555", fontWeight:500 }}>{logoSrc ? "Logo uploaded" : "No logo set"}</div>
              <div style={{ fontSize:12, color:"#bbb", marginTop:3 }}>PNG, JPG or WebP · max 5MB</div>
            </div>
          </div>
        }
        editContent={
          <div style={{ display:"flex", alignItems:"center", gap:20 }}>
            <div style={{ width:88, height:88, borderRadius:14, border:`1.5px solid ${BORDER}`, overflow:"hidden",
                          background:SURFACE, display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:12, color:"#ccc", flexShrink:0 }}>
              {logoSrc ? <img src={logoSrc} alt="logo" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : "No logo"}
            </div>
            <div>
              <input type="file" accept="image/*" ref={logoFileRef} style={{ display:"none" }} onChange={handleLogoUpload} />
              <label className="pp-upload-lbl" onClick={() => logoFileRef.current?.click()} style={{ cursor:"pointer" }}>
                {uploading ? "Uploading…" : "Upload new logo"}
              </label>
              <div style={{ fontSize:12, color:"#bbb", marginTop:8 }}>Recommended: 400×400px</div>
            </div>
          </div>
        }
      />

      {/* ── 3. Banners (NEW) ─────────────────────────────────────────────── */}
      <div className="pp-card">
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:"#e6f1fb", display:"flex",
                        alignItems:"center", justifyContent:"center", fontSize:15 }}>🖼️</div>
          <span style={{ fontSize:15, fontWeight:500, color:"#111" }}>Banners</span>
          <span style={{ fontSize:12, color:"#bbb", marginLeft:"auto" }}>{profile.banners.length} banner{profile.banners.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Banner list */}
        {profile.banners.length === 0 ? (
          <div style={{ fontSize:13, color:"#ccc", fontStyle:"italic", paddingBottom:12 }}>No banners yet</div>
        ) : (
          profile.banners.map(banner => (
            <div key={banner._id} className="pp-list-row">
              {/* Thumbnail */}
              <img src={banner.imageUrl} alt="banner" className="pp-thumb"
                   style={{ width:80, height:40 }} />
              {/* Link */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, color:"#444", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {banner.link || <span style={{ color:"#ccc", fontStyle:"italic" }}>No link</span>}
                </div>
              </div>
              {/* Active toggle */}
              <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                <span style={{ fontSize:11, color:"#aaa" }}>{banner.active ? "Active" : "Off"}</span>
                <Toggle checked={banner.active} onChange={() => handleToggleBanner(banner)} />
              </div>
              {/* Delete */}
              <button className="pp-icon-btn danger" title="Delete banner"
                      onClick={() => handleDeleteBanner(banner._id)}>🗑</button>
            </div>
          ))
        )}

        {/* Add banner row */}
        <div className="pp-add-row">
          <input type="file" accept="image/*" ref={bannerFileRef}
                 style={{ display:"none" }} onChange={handleBannerFileChange} />
          <label className="pp-upload-lbl" onClick={() => bannerFileRef.current?.click()} style={{ cursor:"pointer" }}>
            {bannerFile ? `📎 ${bannerFile.name.slice(0,20)}…` : "Choose image"}
          </label>
          <input className="pp-input" style={{ flex:1, minWidth:140 }}
                 value={bannerLink} onChange={e => setBannerLink(e.target.value)}
                 placeholder="Link URL (optional)" />
          <button className="pp-add-btn" onClick={handleAddBanner} disabled={bannerUploading || !bannerFile}>
            {bannerUploading ? "Uploading…" : "Add banner"}
          </button>
        </div>
      </div>

      {/* ── 4. Printer IPs (NEW) ─────────────────────────────────────────── */}
      <div className="pp-card">
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:"#faeeda", display:"flex",
                        alignItems:"center", justifyContent:"center", fontSize:15 }}>🖨️</div>
          <span style={{ fontSize:15, fontWeight:500, color:"#111" }}>Printer IPs</span>
          <span style={{ fontSize:12, color:"#bbb", marginLeft:"auto" }}>{profile.printerIps.length} printer{profile.printerIps.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Printer list */}
        {profile.printerIps.length === 0 ? (
          <div style={{ fontSize:13, color:"#ccc", fontStyle:"italic", paddingBottom:12 }}>No printers configured</div>
        ) : (
          profile.printerIps.map(printer => (
            <div key={printer._id} className="pp-list-row">
              {/* Status dot */}
              <div className="pp-status-dot"
                   style={{ background: printer.active ? "#22c55e" : "#d1d5db" }} />
              {/* Name */}
              <div style={{ minWidth:90, fontSize:13, fontWeight:500, color:"#333" }}>{printer.name}</div>
              {/* IP */}
              <div style={{ flex:1, fontFamily:"'DM Mono',monospace", fontSize:13, color:"#666" }}>{printer.ip}</div>
              {/* Active toggle */}
              <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                <span style={{ fontSize:11, color:"#aaa" }}>{printer.active ? "Active" : "Off"}</span>
                <Toggle checked={printer.active} onChange={() => handleTogglePrinter(printer)} />
              </div>
              {/* Delete */}
              <button className="pp-icon-btn danger" title="Remove printer"
                      onClick={() => handleDeletePrinter(printer._id)}>🗑</button>
            </div>
          ))
        )}

        {/* Add printer row */}
        <div className="pp-add-row">
          <input className="pp-input" style={{ width:160, fontFamily:"'DM Mono',monospace" }}
                 value={newPrinterIp} onChange={e => setNewPrinterIp(e.target.value)}
                 placeholder="192.168.1.100" />
          <input className="pp-input" style={{ flex:1, minWidth:120 }}
                 value={newPrinterName} onChange={e => setNewPrinterName(e.target.value)}
                 placeholder="Name (e.g. Kitchen)" />
          <button className="pp-add-btn" onClick={handleAddPrinter} disabled={printerSaving || !newPrinterIp.trim()}>
            {printerSaving ? "Adding…" : "Add printer"}
          </button>
        </div>
      </div>

      {/* ── 5. Address & Location ─────────────────────────────────────────── */}
      <SectionCard
        icon="📍" iconBg={GREEN_BG} title="Address & location"
        editing={editing.address}
        onEdit={() => startEdit("address")} onCancel={() => cancelEdit("address")} onSave={() => saveSection("address")}
        viewContent={
          <div className="pp-view-grid">
            <ViewItem full label="Full address"  value={orDash(profile.address)} />
            <ViewItem      label="City"          value={orDash(profile.city)} />
            <ViewItem      label="Coordinates"   value={profile.latitude && profile.longitude ? `${profile.latitude}, ${profile.longitude}` : "—"} />
            <ViewItem      label="Dine-in range"  value={profile.dineInRange  ? `${profile.dineInRange} m`  : "—"} />
            <ViewItem      label="Delivery range" value={profile.deliveryRange ? `${profile.deliveryRange} m` : "—"} />
          </div>
        }
        editContent={
          <div>
            <div className="pp-edit-grid">
              <Field label="Full address" full>
                <input className="pp-input" value={draft.address} onChange={e => set("address", e.target.value)} />
              </Field>
              <Field label="City">
                <input className="pp-input" value={draft.city} onChange={e => set("city", e.target.value)} />
              </Field>
              <Field label="Dine-in range (m)">
                <input className="pp-input" type="number" value={draft.dineInRange} onChange={e => setNum("dineInRange", e.target.value)} />
              </Field>
              <Field label="Latitude">
                <input className="pp-input" value={draft.latitude} onChange={e => set("latitude", e.target.value)} />
              </Field>
              <Field label="Longitude">
                <input className="pp-input" value={draft.longitude} onChange={e => set("longitude", e.target.value)} />
              </Field>
              <Field label="Delivery range (m)">
                <input className="pp-input" type="number" value={draft.deliveryRange} onChange={e => setNum("deliveryRange", e.target.value)} />
              </Field>
            </div>
            <button className="pp-loc-btn" onClick={getCurrentLocation}>📍 Use my current location</button>
          </div>
        }
      />

      {/* ── 6. Business Details ───────────────────────────────────────────── */}
      <SectionCard
        icon="📋" iconBg="#faeeda" title="Business details"
        editing={editing.biz}
        onEdit={() => startEdit("biz")} onCancel={() => cancelEdit("biz")} onSave={() => saveSection("biz")}
        viewContent={
          <div className="pp-view-grid">
            <ViewItem label="FSSAI number"     value={orDash(profile.fssaiNumber)} />
            <ViewItem label="GST number"       value={orDash(profile.gstNumber)} />
            <ViewItem full label="About restaurant" value={orDash(profile.aboutRestaurant)} />
          </div>
        }
        editContent={
          <div className="pp-edit-grid">
            <Field label="FSSAI number">
              <input className="pp-input" value={draft.fssaiNumber} onChange={e => set("fssaiNumber", e.target.value)} />
            </Field>
            <Field label="GST number">
              <input className="pp-input" value={draft.gstNumber}   onChange={e => set("gstNumber", e.target.value)} />
            </Field>
            <Field label="About restaurant" full>
              <textarea className="pp-textarea" value={draft.aboutRestaurant} onChange={e => set("aboutRestaurant", e.target.value)} />
            </Field>
          </div>
        }
      />

      {/* ── 7. Operating Hours ────────────────────────────────────────────── */}
      <SectionCard
        icon="🕐" iconBg="#e6f1fb" title="Operating hours"
        editing={editing.hours}
        onEdit={() => startEdit("hours")} onCancel={() => cancelEdit("hours")} onSave={() => saveSection("hours")}
        viewContent={
          <div className="pp-view-grid cols3">
            <ViewItem label="Opens"             value={fmt12(profile.openingTime)} />
            <ViewItem label="Closes"            value={fmt12(profile.closingTime)} />
            <ViewItem label="Avg delivery time" value={profile.avgDeliveryTime ? `${profile.avgDeliveryTime} min` : "—"} />
          </div>
        }
        editContent={
          <div className="pp-edit-grid" style={{ gridTemplateColumns:"1fr 1fr 1fr" }}>
            <Field label="Opening time">
              <input className="pp-input" type="time" value={draft.openingTime} onChange={e => set("openingTime", e.target.value)} />
            </Field>
            <Field label="Closing time">
              <input className="pp-input" type="time" value={draft.closingTime} onChange={e => set("closingTime", e.target.value)} />
            </Field>
            <Field label="Avg delivery (mins)">
              <input className="pp-input" type="number" value={draft.avgDeliveryTime} onChange={e => setNum("avgDeliveryTime", e.target.value)} />
            </Field>
          </div>
        }
      />

      {/* ── 8. Pricing & Delivery ─────────────────────────────────────────── */}
      <SectionCard
        icon="₹" iconBg={GREEN_BG} title="Pricing & delivery"
        editing={editing.pricing}
        onEdit={() => startEdit("pricing")} onCancel={() => cancelEdit("pricing")} onSave={() => saveSection("pricing")}
        viewContent={
          <div className="pp-view-grid">
            {/* <ViewItem label="Min order amount"   value={`₹${profile.minOrderAmount}`} />
            <ViewItem label="Free delivery above" value={`₹${profile.freeDeliveryAbove}`} />
            <ViewItem label="Delivery base fee"  value={`₹${profile.deliveryBaseFee}`} />
            <ViewItem label="Delivery fee / km"  value={`₹${profile.deliveryFeePerKm}`} />
            <ViewItem label="Service charge"     value={`${profile.serviceCharge}%`} />
            <ViewItem label="Packing charge"     value={`₹${profile.packingCharge}`} /> */}
            <ViewItem label="GST Rate" value={`${profile.gstRate}%`} />  
          </div>
        }
        editContent={
          <div className="pp-edit-grid">
            {[
              { label:"Min order amount (₹)",   key:"minOrderAmount" },
              { label:"Free delivery above (₹)", key:"freeDeliveryAbove" },
              { label:"Delivery base fee (₹)",  key:"deliveryBaseFee" },
              { label:"Delivery fee per km (₹)", key:"deliveryFeePerKm" },
              { label:"Service charge (%)",      key:"serviceCharge" },
              { label:"Packing charge (₹)",      key:"packingCharge" },
              { label:"GST Rate (%)",            key:"gstRate" },
            ].map(({ label, key }) => (
              <Field key={key} label={label}>
                <input className="pp-input" type="number" value={draft[key]}
                       onChange={e => setNum(key, e.target.value)} />
              </Field>
            ))}
          </div>
        }
      />

      {/* ── 9. Social Media ───────────────────────────────────────────────── */}
      <SectionCard
        icon="🔗" iconBg={PINK_BG} title="Social media & website"
        editing={editing.social}
        onEdit={() => startEdit("social")} onCancel={() => cancelEdit("social")} onSave={() => saveSection("social")}
        viewContent={
          <div className="pp-view-grid">
            <ViewItem label="Instagram" value={profile.socialInstagram || null} />
            <ViewItem label="Facebook"  value={profile.socialFacebook  || null} />
            <ViewItem full label="Website" value={profile.website      || null} />
          </div>
        }
        editContent={
          <div className="pp-edit-grid">
            <Field label="Instagram URL">
              <input className="pp-input" value={draft.socialInstagram} placeholder="https://instagram.com/…"
                     onChange={e => set("socialInstagram", e.target.value)} />
            </Field>
            <Field label="Facebook URL">
              <input className="pp-input" value={draft.socialFacebook} placeholder="https://facebook.com/…"
                     onChange={e => set("socialFacebook", e.target.value)} />
            </Field>
            <Field label="Website" full>
              <input className="pp-input" value={draft.website} placeholder="https://yourwebsite.com"
                     onChange={e => set("website", e.target.value)} />
            </Field>
          </div>
        }
      />

      {/* ── 10. Services & Preferences ────────────────────────────────────── */}
      <SectionCard
        icon="✅" iconBg="#eaf3de" title="Services & preferences"
        editing={editing.services}
        onEdit={() => startEdit("services")} onCancel={() => cancelEdit("services")} onSave={() => saveSection("services")}
        viewContent={
          <div>
            <div className="pp-label" style={{ marginBottom:10 }}>Services offered</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
              {[{ key:"dineIn", label:"Dine-in" }, { key:"takeAway", label:"Take away" }, 
              {/* { 
                key:"delivery", label:"Delivery" 
              } */}
              ]
                .map(({ key, label }) => (
                  <span key={key} className={`pp-badge${profile.services[key] ? " on" : ""}`}>{label}</span>
                ))}
            </div>
            <div style={{ borderTop:`1px solid #f5f5f5`, paddingTop:14, fontSize:14, color:"#555",
                          display:"flex", alignItems:"center", gap:8 }}>
              <span>{profile.notificationSound ? "🔔" : "🔕"}</span>
              <span>{profile.notificationSound ? "Notification sound enabled" : "Notification sound disabled"}</span>
            </div>
          </div>
        }
        editContent={
          <div>
            <div className="pp-label" style={{ marginBottom:10 }}>Services offered</div>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:20 }}>
              {[{ key:"dineIn", label:"Dine-in" }, { key:"takeAway", label:"Take away" },
               {/* { key:"delivery", label:"Delivery" } */}
               ]
                .map(({ key, label }) => (
                  <div key={key} className={`pp-chip${draft.services[key] ? " on" : ""}`} onClick={() => setService(key)}>
                    {draft.services[key] ? "✓ " : ""}{label}
                  </div>
                ))}
            </div>
            <div style={{ borderTop:`1px solid #f5f5f5`, paddingTop:14, display:"flex", alignItems:"center", gap:10 }}>
              <input type="checkbox" id="notif-chk" checked={draft.notificationSound}
                     onChange={e => set("notificationSound", e.target.checked)}
                     style={{ accentColor:PINK, width:16, height:16, cursor:"pointer" }} />
              <label htmlFor="notif-chk" style={{ fontSize:14, color:"#444", cursor:"pointer" }}>
                Enable notification sound
              </label>
            </div>
          </div>
        }
      />

      {/* ── Save All ──────────────────────────────────────────────────────── */}
      <div style={{ textAlign:"center", paddingTop:24 }}>
        <button className="pp-save-all" onClick={handleSaveAll} disabled={saving}>
          {saving ? "Saving…" : "Save all settings"}
        </button>
      </div>
    </div>
  );
}