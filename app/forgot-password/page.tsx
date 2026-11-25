"use client";
import Link from "next/link";
import {FormEvent,useState} from "react";
import {getSupabaseBrowserClient} from "@/lib/supabase";
export default function ForgotPassword(){
 const [email,setEmail]=useState(""); const [message,setMessage]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setMessage("");setError("");const db=getSupabaseBrowserClient();if(!db){setError("We couldn't process your request right now. Please try again later.");setBusy(false);return;}
 const {error}=await db.auth.resetPasswordForEmail(email.trim().toLowerCase(),{redirectTo:`${window.location.origin}/reset-password`});setBusy(false);if(error){setError("We couldn't send a recovery email. Please check the address and try again.");return;}setMessage("If an account exists for that email address, a password recovery link has been sent.");}
 return <section className="section section-soft"><div className="container"><div className="form-shell"><div className="eyebrow">Account security</div><h2>Recover your password.</h2><p>Enter the email address associated with your account. We'll send a secure recovery link.</p><form className="form-grid" onSubmit={submit}><label>Email address<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><button className="button button-gold" type="submit" disabled={busy}>{busy?"Sending…":"Send recovery link"}</button></form>{message&&<p className="success-message" role="status">{message}</p>}{error&&<p className="form-note" role="alert">{error}</p>}<p className="form-note"><Link href="/login">Return to sign in</Link></p></div></div></section>
}
