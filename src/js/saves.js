/* ══════════════════════════════════════════════════
   SECTION 5 — SAVED PLOTS PANEL
══════════════════════════════════════════════════ */
async function savePlot(){
  if(!state.plotRendered)return;
  const idx=state.savedPlots.length;
  const snap={
    data:JSON.parse(JSON.stringify(plotState.data)),
    layout:JSON.parse(JSON.stringify(plotState.layout)),
    meta:{...plotState.meta},
    title:plotState.layout.title?.text||`Plot ${idx+1}`,
    thumb:null,
  };
  state.savedPlots.push(snap);
  mkCard(idx,snap,true);
  try{
    const url=await Plotly.toImage('plotDiv',{format:'png',width:200,height:120});
    snap.thumb=url;
    const img=document.querySelector(`#saved-card-${idx} .saved-thumb`);
    if(img){img.src=url;img.style.display='';const ph=img.previousElementSibling;if(ph)ph.style.display='none';}
  }catch(e){}
}
function mkCard(idx,snap,scroll){
  if(state.savedPlots.filter(Boolean).length===1)g('savedStrip').style.display='block';
  const strip=g('savedScroll');
  const card=document.createElement('div');
  card.className='saved-card';card.id=`saved-card-${idx}`;
  card.innerHTML=`
    <div class="saved-thumb-placeholder" style="display:${snap.thumb?'none':'flex'}">generating…</div>
    <img class="saved-thumb" src="${snap.thumb||''}" style="display:${snap.thumb?'block':'none'}" alt="Plot thumbnail">
    <div class="saved-card-footer">
      <input class="saved-card-title" type="text" value="${snap.title}" placeholder="Title…" aria-label="Saved plot title" onclick="event.stopPropagation()">
      <button class="saved-del" onclick="delSaved(${idx},event)" aria-label="Delete" title="Delete">×</button>
    </div>`;
  card.setAttribute('tabindex','0');
  card.setAttribute('role','button');
  card.addEventListener('click',()=>restorePlot(idx));
  card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();restorePlot(idx);}});
  card.querySelector('.saved-card-title').addEventListener('input',function(){
    if(state.savedPlots[idx])state.savedPlots[idx].title=this.value;
  });
  strip.appendChild(card);
  if(scroll)card.scrollIntoView({behavior:'smooth',block:'nearest',inline:'end'});
}
function restorePlot(idx){
  const snap=state.savedPlots[idx];if(!snap)return;
  g('emptyState').classList.add('hidden');g('plotArea').classList.remove('hidden');
  const pd=g('plotDiv');
  if(snap.layout.width){const w=snap.layout.width;pd.style.width=w+'px';g('figW').value=w;g('figWVal').value=w;}
  if(snap.layout.height){const h=snap.layout.height;pd.style.height=h+'px';g('figH').value=h;g('figHVal').value=h;}
  Plotly.react('plotDiv',snap.data,snap.layout,{responsive:false,displayModeBar:true,displaylogo:false,edits:{legendPosition:true,annotationPosition:true}});
  plotState.data=snap.data;plotState.layout=snap.layout;plotState.meta=snap.meta;
  state.plotRendered=true;
  if(snap.meta){
    if(snap.meta.colA!=null){state.colA=snap.meta.colA;const el=g('colASearch');if(el){el.value=lbl(snap.meta.colA,'A');const v=snap.meta.colA+'\x00A';el.dataset.selected=v;el._selVal=v;}}
    if(snap.meta.colB!=null){state.colB=snap.meta.colB;const el=g('colBSearch');if(el){el.value=lbl(snap.meta.colB,'B');const v=snap.meta.colB+'\x00B';el.dataset.selected=v;el._selVal=v;}}
    if(snap.meta.colorCol!=null){state.colorCol=snap.meta.colorCol;state.colorSource=snap.meta.colorSource;const el=g('colorSearch');if(el){el.value=snap.meta.colorCol;const v=snap.meta.colorCol+'\x00'+(snap.meta.colorSource||'');el.dataset.selected=v;el._selVal=v;}}
    else{state.colorCol=null;state.colorSource=null;}
    g('colorSearch')._syncClear?.();g('colASearch')._syncClear?.();g('colBSearch')._syncClear?.();
    renderStats(snap.meta.xV,snap.meta.yV,snap.meta.nan,snap.meta.stats);
  }
  g('statsPanel').style.display='';
  document.querySelectorAll('.saved-card').forEach(c=>c.classList.remove('active-card'));
  g(`saved-card-${idx}`)?.classList.add('active-card');
  g('downloadBtn').style.display='';
}
function delSaved(idx,e){
  // Set to null rather than splice so numeric IDs in card IDs and onclick handlers stay stable
  e.stopPropagation();state.savedPlots[idx]=null;
  const card=g(`saved-card-${idx}`);if(card)card.remove();
}
