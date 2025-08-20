import { useState } from 'react'
import MapPicker from '@/components/MapPicker'

export default function CreateListingPage(){
  const [geo, setGeo] = useState({ address:'', latitude:null, longitude:null })

  const submit = async (e)=>{
    e.preventDefault()
    const payload = {
      // ... other fields from the form ...
      address: geo.address || '',
      latitude: geo.latitude,
      longitude: geo.longitude,
    }
    // POST payload to /api/listings/
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* ... other fields ... */}
      <MapPicker value={geo} onChange={setGeo} />
      <button className="btn">Save</button>
    </form>
  )
}