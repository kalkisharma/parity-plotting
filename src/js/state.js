/* ══════════════════════════════════════════════════
   SECTION 1 — STATE
══════════════════════════════════════════════════ */
const state={
  rawA:null,rawB:null,
  headersA:[],headersB:[],
  nameA:'Dataset A',nameB:'Dataset B',
  joinKey:null,
  joinedA:[],joinedB:[],
  colA:null,colB:null,
  colorCol:null,colorSource:null,
  plotRendered:false,
  savedPlots:[],
  annotPos:null,   // {x, y} in paper coords — null = use default
  figInited:false, // true after first render sets slider defaults from DOM
  titleLocked:false,
  cbarLocked:false,
  xLabelLocked:false,
  yLabelLocked:false,
};
const plotState={data:[],layout:{},meta:{}};

/* ══════════════════════════════════════════════════
   SECTION 1b — SESSION MANAGEMENT (TABS)
══════════════════════════════════════════════════ */
function buildDefaultUI(){
  return{
    nameA:'Dataset A',nameB:'Dataset B',
    keySearch:'',colASearch:'',colBSearch:'',colorSearch:'',
    keySearch__selVal:undefined,colASearch__selVal:undefined,
    colBSearch__selVal:undefined,colorSearch__selVal:undefined,
    inputTitle:'',inputXLabel:'',inputYLabel:'',inputCbarLabel:'',
    xMin:'',xMax:'',yMin:'',yMax:'',
    showColorbar:true,band5:false,band10:true,showBestFit:false,majorGrid:true,minorGrid:false,
    markerSize:'7',markerOpacity:'88',cbarThickness:'22',edgeWidth:'1',edgeColor:'#000000',
    parityColor:'#555555',parityWidth:'1.5',parityDash:'dash',
    bfColor:'#dc2626',bfWidth:'1.5',bfDash:'solid',
    figW:'800',figH:'700',
    fsTitle:'14',fsAxisLabel:'12',fsTick:'10',fsLegend:'11',
    fsAnnot:'12',fsCbarTick:'10',fsCbarTitle:'11',
    cmapSelect:'Coolwarm',
    vis_joinSection:'none',vis_colSection:'none',vis_ctrlSection:'none',
    vis_typographySection:'none',vis_presetSection:'none',vis_saveSection:'none',
    vis_showCbarRow:'none',
    vis_plotArea:'hidden',vis_emptyState:'',
    vis_statsPanel:'none',vis_downloadBtn:'none',vis_cbarExportBtn:'none',
    vis_savedStrip:'none',
    statusA_text:'Drop CSV or click to browse',statusA_cls:'dz-status',
    statusB_text:'Drop CSV or click to browse',statusB_cls:'dz-status',
    fileAlerts:'',joinAlerts:'',rangeAlerts:'',statsGrid:'',
    markerSizeVal:'7',markerOpacityVal:'88%',cbarThicknessVal:'22',edgeWidthVal:'1.0',
    parityWidthVal:'1.5',bfWidthVal:'1.5',
    figWVal:'800',figHVal:'700',
    fsTitleVal:'14',fsAxisLabelVal:'12',fsTickVal:'10',fsLegendVal:'11',
    fsAnnotVal:'12',fsCbarTickVal:'10',fsCbarTitleVal:'11',
    renderBtnText:'Render plot',
  };
}
function createFreshSession(name){
  return{
    name:name||'Session 1',
    state:{
      rawA:null,rawB:null,
      headersA:[],headersB:[],
      nameA:'Dataset A',nameB:'Dataset B',
      joinKey:null,joinedA:[],joinedB:[],
      colA:null,colB:null,
      colorCol:null,colorSource:null,
      plotRendered:false,savedPlots:[],
      annotPos:null,figInited:false,
      titleLocked:false,cbarLocked:false,xLabelLocked:false,yLabelLocked:false,
      _fileA:null,_fileB:null,
    },
    plotState:{data:[],layout:{},meta:{}},
    ui:buildDefaultUI(),
  };
}
const sessions=[createFreshSession('Session 1')];
let activeSession=0;

function snapshotUI(){
  const snap={};
  ['nameA','nameB','keySearch','colASearch','colBSearch','colorSearch',
   'inputTitle','inputXLabel','inputYLabel','inputCbarLabel',
   'xMin','xMax','yMin','yMax'].forEach(id=>{
    const el=g(id);if(!el)return;
    snap[id]=el.value;snap[id+'__selVal']=el._selVal;
  });
  ['showColorbar','band5','band10','showBestFit','majorGrid','minorGrid'].forEach(id=>{
    const el=g(id);if(el)snap[id]=el.checked;
  });
  ['markerSize','markerOpacity','cbarThickness','edgeWidth','figW','figH',
   'fsTitle','fsAxisLabel','fsTick','fsLegend','fsAnnot','fsCbarTick','fsCbarTitle',
   'parityWidth','bfWidth'].forEach(id=>{
    const el=g(id);if(el)snap[id]=el.value;
  });
  snap.cmapSelect=g('cmapSelect').value;snap.edgeColor=g('edgeColor').value;
  snap.parityColor=g('parityColor').value;snap.parityDash=g('parityDash').value;
  snap.bfColor=g('bfColor').value;snap.bfDash=g('bfDash').value;
  ['joinSection','colSection','ctrlSection','typographySection','presetSection','saveSection','showCbarRow'].forEach(id=>{
    snap['vis_'+id]=g(id)?g(id).style.display:'none';
  });
  snap.vis_plotArea=g('plotArea').classList.contains('hidden')?'hidden':'';
  snap.vis_emptyState=g('emptyState').classList.contains('hidden')?'hidden':'';
  snap.vis_statsPanel=g('statsPanel').style.display;
  snap.vis_downloadBtn=g('downloadBtn').style.display;
  snap.vis_cbarExportBtn=g('cbarExportBtn').style.display;
  snap.vis_savedStrip=g('savedStrip').style.display;
  snap.statusA_text=g('statusA').textContent;snap.statusA_cls=g('statusA').className;
  snap.statusB_text=g('statusB').textContent;snap.statusB_cls=g('statusB').className;
  snap.fileAlerts=g('fileAlerts').innerHTML;snap.joinAlerts=g('joinAlerts').innerHTML;
  snap.rangeAlerts=g('rangeAlerts').innerHTML;snap.statsGrid=g('statsGrid').innerHTML;
  ['markerSizeVal','markerOpacityVal','cbarThicknessVal','edgeWidthVal','figWVal','figHVal',
   'fsTitleVal','fsAxisLabelVal','fsTickVal','fsLegendVal','fsAnnotVal','fsCbarTickVal','fsCbarTitleVal',
   'parityWidthVal','bfWidthVal'].forEach(id=>{
    const el=g(id);if(el)snap[id]=el.tagName==='INPUT'?el.value:el.textContent;
  });
  snap.renderBtnText=g('renderBtn').textContent;
  return snap;
}
function captureCurrentSession(){
  const s=sessions[activeSession];
  s.state={...state};
  s.state.rawA=state.rawA?state.rawA.slice():null;
  s.state.rawB=state.rawB?state.rawB.slice():null;
  s.state.headersA=[...state.headersA];
  s.state.headersB=[...state.headersB];
  s.state.joinedA=state.joinedA.slice();
  s.state.joinedB=state.joinedB.slice();
  s.state.savedPlots=state.savedPlots.map(p=>p?{...p,data:JSON.parse(JSON.stringify(p.data)),layout:JSON.parse(JSON.stringify(p.layout))}:null);
  s.plotState={
    data:state.plotRendered?JSON.parse(JSON.stringify(plotState.data)):[],
    layout:state.plotRendered?JSON.parse(JSON.stringify(plotState.layout)):{},
    meta:state.plotRendered?{...plotState.meta}:{},
  };
  s.ui=snapshotUI();
}
function restoreSessionUI(session){
  const ss=session.state;
  Object.assign(state,ss);
  state.rawA=ss.rawA?ss.rawA.slice():null;
  state.rawB=ss.rawB?ss.rawB.slice():null;
  state.headersA=[...ss.headersA];
  state.headersB=[...ss.headersB];
  state.joinedA=ss.joinedA.slice();
  state.joinedB=ss.joinedB.slice();
  state.savedPlots=ss.savedPlots.map(p=>p?{...p}:null);
  plotState.data=session.plotState.data.length?JSON.parse(JSON.stringify(session.plotState.data)):[];
  plotState.layout=Object.keys(session.plotState.layout).length?JSON.parse(JSON.stringify(session.plotState.layout)):{};
  plotState.meta={...session.plotState.meta};
  const ui=session.ui;
  ['nameA','nameB','keySearch','colASearch','colBSearch','colorSearch',
   'inputTitle','inputXLabel','inputYLabel','inputCbarLabel',
   'xMin','xMax','yMin','yMax'].forEach(id=>{
    const el=g(id);if(!el)return;
    el.value=ui[id]??'';
    el._selVal=ui[id+'__selVal'];
    el.dataset.selected=(ui[id+'__selVal']!=null)?ui[id+'__selVal']:'';
  });
  ['showColorbar','band5','band10','showBestFit','majorGrid','minorGrid'].forEach(id=>{
    const el=g(id);if(el&&ui[id]!==undefined)el.checked=ui[id];
  });
  ['markerSize','markerOpacity','cbarThickness','edgeWidth','figW','figH',
   'fsTitle','fsAxisLabel','fsTick','fsLegend','fsAnnot','fsCbarTick','fsCbarTitle',
   'parityWidth','bfWidth'].forEach(id=>{
    const el=g(id);if(el&&ui[id]!==undefined)el.value=ui[id];
  });
  if(g('cmapSelect'))g('cmapSelect').value=ui.cmapSelect||'Coolwarm';
  if(g('edgeColor'))g('edgeColor').value=ui.edgeColor||'#000000';
  if(g('parityColor'))g('parityColor').value=ui.parityColor||'#555555';
  if(g('parityDash'))g('parityDash').value=ui.parityDash||'dash';
  if(g('bfColor'))g('bfColor').value=ui.bfColor||'#dc2626';
  if(g('bfDash'))g('bfDash').value=ui.bfDash||'solid';
  ['joinSection','colSection','ctrlSection','typographySection','presetSection','saveSection','showCbarRow'].forEach(id=>{
    const el=g(id);if(el)el.style.display=ui['vis_'+id]??'none';
  });
  ui.vis_plotArea==='hidden'?g('plotArea').classList.add('hidden'):g('plotArea').classList.remove('hidden');
  ui.vis_emptyState==='hidden'?g('emptyState').classList.add('hidden'):g('emptyState').classList.remove('hidden');
  g('statsPanel').style.display=ui.vis_statsPanel||'none';
  g('downloadBtn').style.display=ui.vis_downloadBtn||'none';
  g('cbarExportBtn').style.display=ui.vis_cbarExportBtn||'none';
  g('statusA').textContent=ui.statusA_text||'Drop CSV or click to browse';
  g('statusA').className=ui.statusA_cls||'dz-status';
  g('statusB').textContent=ui.statusB_text||'Drop CSV or click to browse';
  g('statusB').className=ui.statusB_cls||'dz-status';
  g('fileAlerts').innerHTML=ui.fileAlerts||'';
  g('joinAlerts').innerHTML=ui.joinAlerts||'';
  g('rangeAlerts').innerHTML=ui.rangeAlerts||'';
  g('statsGrid').innerHTML=ui.statsGrid||'';
  ['markerSizeVal','markerOpacityVal','cbarThicknessVal','edgeWidthVal','figWVal','figHVal',
   'fsTitleVal','fsAxisLabelVal','fsTickVal','fsLegendVal','fsAnnotVal','fsCbarTickVal','fsCbarTitleVal',
   'parityWidthVal','bfWidthVal'].forEach(id=>{
    const el=g(id);if(el&&ui[id]){if(el.tagName==='INPUT')el.value=ui[id];else el.textContent=ui[id];}
  });
  g('renderBtn').textContent=ui.renderBtnText||'Render plot';
  // Rebuild dropdowns (AbortControllers don't survive serialization)
  if(state.rawA&&state.rawB){buildKeyDropdown();if(state.joinKey)buildColDropdowns();}
  // Sync clear buttons and lock UIs
  ['keySearch','colASearch','colBSearch','colorSearch'].forEach(id=>g(id)?._syncClear?.());
  updateTitleLockUi();updateCbarLockUi();updateXLabelLockUi();updateYLabelLockUi();
  // Rebuild saved plots strip
  g('savedScroll').innerHTML='';
  state.savedPlots.forEach((snap,i)=>{if(snap)mkCard(i,snap,false);});
  const hasSaved=state.savedPlots.filter(Boolean).length>0;
  g('savedStrip').style.display=hasSaved?'block':'none';
  // Restore Plotly
  if(state.plotRendered&&plotState.data.length){
    const pd=g('plotDiv');
    const w=plotState.layout.width||800,h=plotState.layout.height||700;
    pd.style.width=w+'px';pd.style.height=h+'px';
    Plotly.react('plotDiv',plotState.data,plotState.layout,{
      responsive:false,displayModeBar:true,displaylogo:false,
      edits:{legendPosition:true,annotationPosition:true},
    });
  }else{try{Plotly.purge('plotDiv');}catch(e){}}
}
function activateSession(idx){
  if(idx===activeSession)return;
  captureCurrentSession();
  activeSession=idx;
  restoreSessionUI(sessions[idx]);
  renderTabBar();
}
function newSession(){
  captureCurrentSession();
  sessions.push(createFreshSession(`Session ${sessions.length+1}`));
  activeSession=sessions.length-1;
  restoreSessionUI(sessions[activeSession]);
  renderTabBar();
}
function closeSession(idx){
  if(sessions.length<=1)return;
  const isActive=idx===activeSession;
  const sState=isActive?state:sessions[idx].state;
  if(sState.rawA||sState.rawB){
    if(!confirm(`Close "${sessions[idx].name}"? The loaded data will be lost.`))return;
  }
  sessions.splice(idx,1);
  if(isActive){
    activeSession=Math.min(idx,sessions.length-1);
    restoreSessionUI(sessions[activeSession]);
  }else{
    if(activeSession>idx)activeSession--;
  }
  renderTabBar();
}
function moveSession(idx,dir){
  const ni=idx+dir;
  if(ni<0||ni>=sessions.length)return;
  [sessions[idx],sessions[ni]]=[sessions[ni],sessions[idx]];
  if(activeSession===idx)activeSession=ni;
  else if(activeSession===ni)activeSession=idx;
  renderTabBar();
}
function escHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function renderTabBar(){
  const list=g('tabList');
  list.innerHTML=sessions.map((s,i)=>`
    <div class="tab-chip${i===activeSession?' active':''}" data-idx="${i}" role="tab" aria-selected="${i===activeSession}">
      <button class="tab-btn" data-mv="-1"${i===0?' disabled':''} title="Move left" aria-label="Move left">‹</button>
      <span class="tab-name" contenteditable="true" spellcheck="false" title="Click to rename">${escHtml(s.name)}</span>
      <button class="tab-btn" data-mv="1"${i===sessions.length-1?' disabled':''} title="Move right" aria-label="Move right">›</button>
      <button class="tab-btn tab-close" title="Close session" aria-label="Close">×</button>
    </div>`).join('');
  list.querySelectorAll('.tab-chip').forEach((chip,i)=>{
    chip.addEventListener('mousedown',e=>{
      if(e.target.closest('.tab-btn,.tab-name'))return;
      if(i!==activeSession)activateSession(i);
    });
    const nameEl=chip.querySelector('.tab-name');
    nameEl.addEventListener('click',e=>{e.stopPropagation();if(i!==activeSession)activateSession(i);});
    nameEl.addEventListener('focus',()=>{
      const r=document.createRange();r.selectNodeContents(nameEl);
      const sel=window.getSelection();sel.removeAllRanges();sel.addRange(r);
    });
    nameEl.addEventListener('keydown',e=>{
      if(e.key==='Enter'){e.preventDefault();nameEl.blur();}
      if(e.key==='Escape'){nameEl.textContent=sessions[i].name;nameEl.blur();}
    });
    nameEl.addEventListener('blur',()=>{
      const n=(nameEl.textContent||'').trim()||sessions[i].name;
      sessions[i].name=n;nameEl.textContent=n;
    });
    chip.querySelectorAll('.tab-btn[data-mv]').forEach(btn=>{
      btn.addEventListener('click',e=>{e.stopPropagation();if(!btn.disabled)moveSession(i,parseInt(btn.dataset.mv));});
    });
    chip.querySelector('.tab-close').addEventListener('click',e=>{e.stopPropagation();closeSession(i);});
  });
}
