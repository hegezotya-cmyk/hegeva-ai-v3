import { inferVisualDirection } from "@/lib/x30/domain-visual-intelligence"
import type { X30AppSpec } from "@/lib/x30/schema"

export const pawflowX30Fixture: X30AppSpec = {
  version:"0.1", id:"pawflow-alpha", name:"PawFlow", direction:inferVisualDirection("premium pet grooming booking studio"),
  nodes:[
    {id:"welcome",type:"hero",props:{eyebrow:"Tuesday · Studio open",title:"A calmer day for every coat.",description:"Appointments, pets and services in one warm booking-led workspace."}},
    {id:"today",type:"metric",props:{label:"Today's appointments",value:"3",detail:"Next: Milo at 10:30"}},
    {id:"revenue",type:"metric",props:{label:"Grooming revenue",value:"£142",detail:"Booked today"}},
    {id:"schedule",type:"schedule",props:{title:"Today in the studio",items:[{time:"10:30",pet:"Milo",breed:"Cockapoo",service:"Full groom",price:"£58"},{time:"13:00",pet:"Luna",breed:"Golden retriever",service:"Wash & brush",price:"£46"},{time:"15:30",pet:"Bean",breed:"Mini schnauzer",service:"Tidy-up",price:"£38"}]}},
    {id:"pets",type:"pet-list",props:{title:"Returning friends",items:[{name:"Milo",detail:"Cockapoo · 4 years",owner:"Hannah · 07700 900123"},{name:"Luna",detail:"Golden retriever · 6 years",owner:"Amir · 07700 900456"}]}},
    {id:"services",type:"service-list",props:{title:"Popular care",items:[{name:"Full groom",price:"from £52"},{name:"Wash & brush",price:"from £34"},{name:"Nail care",price:"£16"}]}},
    {id:"book",type:"action",props:{label:"Book an appointment",hint:"Choose a pet, service and time"}},
  ]
}
