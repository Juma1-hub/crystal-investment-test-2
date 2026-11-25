"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {getSupabaseBrowserClient} from "@/lib/supabase";
type Division={id:string;title:string;division:string;summary:string};
export default function HomeDivisionGrid(){
 const [rows,setRows]=useState<Division[]>([]);
 useEffect(()=>{let live=true;const db=getSupabaseBrowserClient();if(!db)return;void db.rpc("public_get_investment_divisions").then(({data,error})=>{if(live&&!error)setRows((data||[]) as Division[])});return()=>{live=false}},[]);
 return <div className="cards">{rows.map((d,i)=><Link className={`card sector-card sector-card-${i+1}`} href="/divisions" key={d.id}><h3>{d.title}</h3><p>{d.summary}</p></Link>)}</div>;
}
