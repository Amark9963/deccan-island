'use client';
import { useEffect, useMemo, useState } from 'react';

type DateOption={id:string;service_date:string};
type Product={id:string;name:string;active:boolean};
type Assignment={service_date_id:string;product_id:string;capacity:number;enabled:boolean};

export default function AdminDateMenuControls({dates}:{dates:DateOption[]}){
  const [dateId,setDateId]=useState(dates[0]?.id??'');
  const [products,setProducts]=useState<Product[]>([]);
  const [assignments,setAssignments]=useState<Assignment[]>([]);
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);

  useEffect(()=>{fetch('/api/admin/date-products').then(async response=>{const data=await response.json();if(response.ok){setProducts(data.products??[]);setAssignments(data.assignments??[])}else setMessage(data.error)}).catch(()=>setMessage('Unable to load the date menu.'))},[]);
  const rows=useMemo(()=>products.map(product=>{const saved=assignments.find(item=>item.service_date_id===dateId&&item.product_id===product.id);return{product,enabled:saved?.enabled??false,capacity:saved?.capacity??1}}),[products,assignments,dateId]);
  function update(productId:string,changes:Partial<Pick<Assignment,'enabled'|'capacity'>>){setAssignments(current=>{const existing=current.find(item=>item.service_date_id===dateId&&item.product_id===productId);if(existing)return current.map(item=>item===existing?{...item,...changes}:item);return[...current,{service_date_id:dateId,product_id:productId,capacity:1,enabled:false,...changes}]})}
  async function save(){setBusy(true);setMessage('');const response=await fetch('/api/admin/date-products',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({serviceDateId:dateId,items:rows.map(row=>({productId:row.product.id,capacity:row.capacity,enabled:row.enabled}))})});const data=await response.json();setMessage(response.ok?'Date menu saved.':data.error);setBusy(false)}

  return <section className="admin-section"><div className="admin-section-heading"><div><p className="eyebrow">Menu schedule</p><h2>Products by date</h2></div></div>{dates.length?<><label className="admin-menu-date">Service date<select value={dateId} onChange={event=>{setDateId(event.target.value);setMessage('')}}>{dates.map(date=><option value={date.id} key={date.id}>{date.service_date}</option>)}</select></label><div className="admin-date-menu-list">{rows.map(row=><div className="admin-date-menu-row" key={row.product.id}><label><input type="checkbox" checked={row.enabled} onChange={event=>update(row.product.id,{enabled:event.target.checked})}/><span><strong>{row.product.name}</strong><small>{row.product.active?'Active product':'Product is globally inactive'}</small></span></label><label>Portions<input type="number" min="1" max="100" value={row.capacity} disabled={!row.enabled} onChange={event=>update(row.product.id,{capacity:Math.max(1,Number(event.target.value))})}/></label></div>)}</div><button className="admin-secondary" disabled={busy} onClick={save}>{busy?'Saving…':'Save date menu'}</button></>:<p className="admin-empty-row">Create a service date first.</p>}{message&&<p className="admin-form-message">{message}</p>}</section>;
}
