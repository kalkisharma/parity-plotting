/* ══════════════════════════════════════════════════
   SECTION 2 — CSV PARSING + INNER JOIN
══════════════════════════════════════════════════ */
function parseCSV(file,cb){
  // skipEmptyLines silently discards blank rows — reported row count may differ from file line count
  Papa.parse(file,{
    header:true,dynamicTyping:true,skipEmptyLines:true,
    transformHeader:h=>h.replace(/^\uFEFF/,'').replace(/\u00A0/g,' ').trim(),
    complete:cb,error:e=>console.error(e),
  });
}
// Normalize join key: case-insensitive, whitespace-tolerant — prevents "S001" ≠ "s001" mismatches
function nk(v){return String(v??'').trim().toLowerCase();}
function innerJoin(A,B,key){
  const map=new Map();
  for(const r of B){const k=nk(r[key]);if(!map.has(k))map.set(k,r);}
  const mA=[],mB=[],used=new Set(),dropA=[],dropB=[];
  for(const r of A){const k=nk(r[key]);if(map.has(k)&&!used.has(k)){mA.push(r);mB.push(map.get(k));used.add(k);}else dropA.push(r[key]);}
  for(const r of B){const k=nk(r[key]);if(!used.has(k))dropB.push(r[key]);}
  return{mA,mB,nA:A.length,nB:B.length,dropA,dropB};
}
function dupKeys(rows,key){
  const seen=new Set(),d=[];
  for(const r of rows){const k=nk(r[key]);if(seen.has(k))d.push(r[key]);seen.add(k);}
  return d;
}
function onFileParsed(w,rows,headers){
  if(w==='A'){state.rawA=rows;state.headersA=headers;setSt('A',`✓ ${rows.length} rows · ${headers.length} cols`,'loaded');}
  else{state.rawB=rows;state.headersB=headers;setSt('B',`✓ ${rows.length} rows · ${headers.length} cols`,'loaded');}
  if(state.rawA&&state.rawB)onBothLoaded();
}
function setSt(w,msg,cls){const el=g('status'+w);el.textContent=msg;el.className='dz-status '+cls;}
function resetForNewFiles(){
  state.colA=null;state.colB=null;state.colorCol=null;state.colorSource=null;
  state.joinKey=null;state.joinedA=[];state.joinedB=[];
  state.annotPos=null;state.figInited=false;state.plotRendered=false;
  ['keySearch','colASearch','colBSearch','colorSearch'].forEach(id=>{const el=g(id);if(el){el.value='';el.dataset.selected='';el._selVal=undefined;}});
  ['keySearch','colASearch','colBSearch','colorSearch'].forEach(id=>g(id)?._syncClear?.());
  ['inputXLabel','inputYLabel','inputTitle','inputCbarLabel'].forEach(id=>{const el=g(id);if(el)el.value='';});
  ['colSection','ctrlSection','typographySection','presetSection','saveSection'].forEach(id=>g(id).style.display='none');
  clearEl('joinAlerts');clearEl('rangeAlerts');
  g('plotArea').classList.add('hidden');g('emptyState').classList.remove('hidden');
  g('statsPanel').style.display='none';g('downloadBtn').style.display='none';
  g('showCbarRow').style.display='none';g('cbarExportBtn').style.display='none';
  if(!state.savedPlots.filter(Boolean).length)g('savedStrip').style.display='none';
  g('renderBtn').textContent='Render plot';
  state.titleLocked=false;updateTitleLockUi();
  state.cbarLocked=false;updateCbarLockUi();
  state.xLabelLocked=false;updateXLabelLockUi();
  state.yLabelLocked=false;updateYLabelLockUi();
}
function onBothLoaded(){
  resetForNewFiles();
  g('joinSection').style.display='';
  buildKeyDropdown();
  clearEl('fileAlerts');
  if(state._fileA&&state._fileB&&state._fileA.name===state._fileB.name&&state._fileA.size===state._fileB.size)
    g('fileAlerts').innerHTML='<div class="alert warn">Both files have the same name and size — are you sure you\'re not comparing a file with itself?</div>';
}
function doJoin(){
  if(!state.joinKey)return;
  const dA=dupKeys(state.rawA,state.joinKey),dB=dupKeys(state.rawB,state.joinKey);
  const{mA,mB,nA,nB,dropA,dropB}=innerJoin(state.rawA,state.rawB,state.joinKey);
  state.joinedA=mA;state.joinedB=mB;
  const n=mA.length;
  let html='';
  if(dA.length)html+=`<div class="alert warn">Duplicate keys in [A] — ${dA.length} row${dA.length===1?'':'s'} dropped: ${dA.slice(0,5).map(v=>`<code>${escHtml(String(v))}</code>`).join(' ')}${dA.length>5?` … +${dA.length-5} more`:''}</div>`;
  if(dB.length)html+=`<div class="alert warn">Duplicate keys in [B] — ${dB.length} row${dB.length===1?'':'s'} dropped: ${dB.slice(0,5).map(v=>`<code>${escHtml(String(v))}</code>`).join(' ')}${dB.length>5?` … +${dB.length-5} more`:''}</div>`;
  html+=`<div class="alert ${n===0?'danger':'success'}">${n===0?'No rows matched. Check identifier column values.':`Matched ${n} of ${nA} rows from [A], ${n} of ${nB} rows from [B]`}</div>`;
  if(dropA.length){const preview=dropA.slice(0,8).map(v=>`<code>${escHtml(String(v))}</code>`).join(' ');html+=`<details class="drop-details"><summary>${dropA.length} unmatched key${dropA.length===1?'':'s'} in [A]</summary><div class="drop-list">${preview}${dropA.length>8?` <span>… +${dropA.length-8} more</span>`:''}</div></details>`;}
  if(dropB.length){const preview=dropB.slice(0,8).map(v=>`<code>${escHtml(String(v))}</code>`).join(' ');html+=`<details class="drop-details"><summary>${dropB.length} unmatched key${dropB.length===1?'':'s'} in [B]</summary><div class="drop-list">${preview}${dropB.length>8?` <span>… +${dropB.length-8} more</span>`:''}</div></details>`;}
  g('joinAlerts').innerHTML=html;
  if(n>0){
    g('colSection').style.display='';
    buildColDropdowns();
  }
}
