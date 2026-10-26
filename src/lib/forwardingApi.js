import {adminRequest} from './adminApi.js';
const prefix='/admin/forwarding';
export const forwardingApi={
  list:(query={})=>adminRequest(`${prefix}?${new URLSearchParams(Object.entries(query).filter(([,value])=>value!==''&&value!=null))}`),
  detail:(id)=>adminRequest(`${prefix}/${encodeURIComponent(id)}`),
  create:(body)=>adminRequest(prefix,{method:'POST',body:JSON.stringify(body)}),
  gateOut:(id,destination)=>adminRequest(`${prefix}/${encodeURIComponent(id)}/gate-out`,{method:'POST',body:JSON.stringify({destination})}),
};
