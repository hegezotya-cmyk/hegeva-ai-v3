"use client"
import { useEffect } from "react"
type SafeEvent="landing_page_view"|"registration_start"|"pricing_view"
const key="hegeva:acquisition:v1"
function record(event:SafeEvent,path:string){try{const existing=JSON.parse(localStorage.getItem(key)||"[]"),events=Array.isArray(existing)?existing:[];events.push({event,path,at:new Date().toISOString()});localStorage.setItem(key,JSON.stringify(events.slice(-20)))}catch{}}
export function AcquisitionAttribution({path}:{path:string}){useEffect(()=>{record("landing_page_view",path);const click=(event:MouseEvent)=>{const target=(event.target as Element|null)?.closest<HTMLElement>("[data-acquisition-event]"),name=target?.dataset.acquisitionEvent;if(name==="registration_start"||name==="pricing_view")record(name,path)};document.addEventListener("click",click);return()=>document.removeEventListener("click",click)},[path]);return null}
