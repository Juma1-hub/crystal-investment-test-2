"use client";
import Link from "next/link";
import {FormEvent,useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {getSupabaseBrowserClient} from "@/lib/supabase";
export default function ResetPassword(){
 const router=useRouter();const [ready,setReady]=useState(false);const [password,setPassword]=useState("");const [confirm,setConfirm]=useState("");const [message,setMessage]=useState("");const [error,setError]=useState("");const [busy,setBusy]=useState(false);
 useEffect(()=>{const db=getSupabaseBrowserClient();if(!db){setError("The recovery link could not be verified. Please request a new link.");return;}let live=true;let resolved=false;
  const markReady=()=>{if(live&&!resolved){resolved=true;setReady(true);setError("");}};
  const {data:{subscription}}=db.auth.onAuthStateChange((event,session)=>{if(event==="PASSWORD_RECOVERY"||(event==="SIGNED_IN"&&session))markReady();});
  const verify=async()=>{try{const url=new URL(window.location.href);const code=url.searchParams.get("code");if(code){const {error:exchangeError}=await db.auth.exchangeCodeForSession(code);if(!exchangeError){markReady();return;}}
    const {data:{session}}=await db.auth.getSession();if(session){markReady();return;}
    const hash=new URLSearchParams(url.hash.replace(/^#/ ,""));const access_token=hash.get("access_token");const refresh_token=hash.get("refresh_token");if(hash.get("type")==="recovery"&&access_token&&refresh_token){const {error:setError}=await db.auth.setSession({access_token,refresh_token});if(!setError){markReady();return;}}
    window.setTimeout(()=>{if(live&&!resolved)setError("This recovery link is invalid or has expired. Please request a new one.");},1200);
   }catch{if(live&&!resolved)setError("This recovery link is invalid or has expired. Please request a new one.");}};
  void verify();return()=>{live=false;subscription.unsubscribe();};},[]);
 async function submit(e:FormEvent){e.preventDefault();setError("");setMessage("");if(password.length<10){setError("Use a password with at least 10 characters.");return;}if(password!==confirm){setError("The passwords do not match.");return;}const db=getSupabaseBrowserClient();if(!db){setError("The password could not be updated. Please try again.");return;}setBusy(true);const {error}=await db.auth.updateUser({password});setBusy(false);if(error){setError("The password could not be updated. The recovery link may have expired; request a new one.");return;}setMessage("Your password has been updated. You can now sign in.");window.dispatchEvent(new Event("crystal-session-change"));window.setTimeout(()=>router.replace("/login"),1200);}
 return <section className="section section-soft"><div className="container"><div className="form-shell"><div className="eyebrow">Account security</div><h2>Create a new password.</h2><p>Choose a new password for your CRYSTAL INVESTMENTS account.</p>{ready?<form className="form-grid" onSubmit={submit}><label>New password<input type="password" autoComplete="new-password" minLength={10} value={password} onChange={e=>setPassword(e.target.value)} required/></label><label>Confirm new password<input type="password" autoComplete="new-password" minLength={10} value={confirm} onChange={e=>setConfirm(e.target.value)} required/></label><button className="button button-gold" type="submit" disabled={busy}>{busy?"Updating…":"Update password"}</button></form>:<p className="form-note">{error||"Verifying your recovery link…"}</p>}{message&&<p className="success-message" role="status">{message}</p>}{error&&ready&&<p className="form-note" role="alert">{error}</p>}<p className="form-note"><Link href="/forgot-password">Request another recovery link</Link></p></div></div></section>
}
