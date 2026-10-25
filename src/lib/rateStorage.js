const STORAGE_KEY='trans-roadway-rate-setup-v1'

const normalize=(rate)=>({
  id:rate.id||crypto.randomUUID(),
  name:String(rate.name||'').trim(),
  classification:rate.classification,
  loadStatus:rate.loadStatus,
  containerSize:rate.containerSize||'ALL',
  amount:Number(rate.amount||0),
  collectionPoint:rate.collectionPoint,
  status:rate.status||'ACTIVE',
  description:String(rate.description||'').trim(),
  createdAt:rate.createdAt||new Date().toISOString(),
  updatedAt:new Date().toISOString(),
})

export function getRates(){
  try{
    const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]')
    return Array.isArray(parsed)?parsed:[]
  }catch{return []}
}

function saveAll(rates){localStorage.setItem(STORAGE_KEY,JSON.stringify(rates))}

export function createRate(input){
  const rates=getRates()
  const rate=normalize(input)
  saveAll([rate,...rates])
  return rate
}

export function updateRate(id,input){
  const rates=getRates()
  let updated=null
  const next=rates.map(rate=>rate.id===id?(updated=normalize({...rate,...input,id,createdAt:rate.createdAt})):rate)
  if(!updated)throw new Error('Rate record not found.')
  saveAll(next)
  return updated
}

export function deleteRate(id){saveAll(getRates().filter(rate=>rate.id!==id))}
