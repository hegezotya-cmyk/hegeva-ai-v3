"use client"
import { useEffect } from "react"
type SafeEvent="landing_page_view"|"registration_start"|"pricing_view"
function record(event:SafeEvent,path:string){try{if(localStorage.getItem("hegeva:analytics-consent:v1")!=="granted")return;window.dispatchEvent(new CustomEvent("hegeva:analytics-event",{detail:{event,path}}))}catch{}}
export function AcquisitionAttribution({path}:{path:string}){useEffect(()=>{record("landing_page_view",path);const click=(event:MouseEvent)=>{const target=(event.target as Element|null)?.closest<HTMLElement>("[data-acquisition-event]"),name=target?.dataset.acquisitionEvent;if(name==="registration_start"||name==="pricing_view")record(name,path)};document.addEventListener("click",click);return()=>document.removeEventListener("click",click)},[path]);return null}
