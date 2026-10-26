const base=import.meta.env.VITE_API_BASE_URL||'/api';
export async function openAdminFile(path,download=false){
 const res=await fetch(`${base}${path}`,{credentials:'include'});
 if(!res.ok){let msg='Unable to open document';try{msg=(await res.json()).message||msg}catch{}throw new Error(msg)}
 const blob=await res.blob();const url=URL.createObjectURL(blob);
 if(download){const a=document.createElement('a');a.href=url;a.download=(res.headers.get('content-disposition')||'').match(/filename="([^"]+)"/)?.[1]||'document.pdf';a.click();}
 else window.open(url,'_blank','noopener,noreferrer');
 window.setTimeout(()=>URL.revokeObjectURL(url),60000);
}
