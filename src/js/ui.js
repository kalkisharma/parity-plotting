/* ══════════════════════════════════════════════════
   SECTION 3 — COLUMN SEARCH UI
══════════════════════════════════════════════════ */
const _ddControllers=new Map();
function makeDD(inputId,ddId,items,onSel){
  // Abort the previous controller for this input before adding new listeners —
  // makeDD is called again whenever dropdown items change (e.g. file reload),
  // and without this, old listeners stack causing duplicate onSel firings.
  if(_ddControllers.has(inputId)){_ddControllers.get(inputId).abort();}
  const ac=new AbortController(),sig=ac.signal;
  _ddControllers.set(inputId,ac);
  const inp=g(inputId),dd=g(ddId);
  let _filt=[];
  function render(f){
    f=f.toLowerCase();
    _filt=items.filter(x=>x.label.toLowerCase().includes(f));
    dd.innerHTML=_filt.length
      ?_filt.map((x,i)=>`<div class="opt${x.value===(inp._selVal??'')?' selected':''}" data-fi="${i}" data-src="${x.src||''}" role="option">${x.src?`<span class="tag ${x.src.toLowerCase()}">[${x.src}]</span>`:''}${escHtml(x.col)}</div>`).join('')
      :'<div class="no-results">No matches</div>';
    dd.querySelectorAll('.opt').forEach(el=>el.addEventListener('mousedown',e=>{
      e.preventDefault();
      const item=_filt[parseInt(el.dataset.fi)];
      inp.value=el.textContent.trim();inp._selVal=item.value;inp.dataset.selected=item.value;
      onSel(item.value,el.dataset.src);dd.classList.remove('open');
    }));
  }
  inp.addEventListener('focus',()=>{render(inp.value);dd.classList.add('open');},{signal:sig});
  inp.addEventListener('input',()=>render(inp.value),{signal:sig});
  // 150 ms delay: clicking an option fires blur on the input before mousedown on the option.
  // Without the delay, the dropdown closes and the mousedown is lost before onSel runs.
  inp.addEventListener('blur',()=>setTimeout(()=>dd.classList.remove('open'),150),{signal:sig});
  inp._openDD=()=>{render('');dd.classList.add('open');};
}
function lbl(col,src){return`[${src==='A'?state.nameA:state.nameB}] ${col}`;}
function buildKeyDropdown(){
  // value encodes col+'\x00'+src so columns with identical names in A and B remain distinguishable.
  // The null byte is chosen because it cannot appear in a CSV column name after header trimming.
  const items=[
    ...state.headersA.map(c=>({value:c+'\x00A',col:c,label:lbl(c,'A'),src:'A'})),
    ...state.headersB.map(c=>({value:c+'\x00B',col:c,label:lbl(c,'B'),src:'B'})),
  ];
  makeDD('keySearch','keyDropdown',items,(val)=>{
    const col=val.split('\x00')[0];
    if(state.headersA.includes(col)&&state.headersB.includes(col)){state.joinKey=col;doJoin();g('keySearch')._syncClear?.();}
    else g('joinAlerts').innerHTML=`<div class="alert warn">Column "${escHtml(col)}" not found in both files.</div>`;
  });
}
function buildColDropdowns(){
  const cA=state.headersA.map(c=>({value:c+'\x00A',col:c,label:lbl(c,'A'),src:'A'}));
  const cB=state.headersB.map(c=>({value:c+'\x00B',col:c,label:lbl(c,'B'),src:'B'}));
  makeDD('colASearch','colADropdown',cA,(val)=>{state.colA=val.split('\x00')[0];setAxisDefaults();g('colASearch')._syncClear?.();if(state.colA&&state.colB){g('ctrlSection').style.display='';renderPlot();}});
  makeDD('colBSearch','colBDropdown',cB,(val)=>{state.colB=val.split('\x00')[0];setAxisDefaults();g('colBSearch')._syncClear?.();if(state.colA&&state.colB){g('ctrlSection').style.display='';renderPlot();}});
  makeDD('colorSearch','colorDropdown',[...cA,...cB],(val,src)=>{state.colorCol=val.split('\x00')[0];state.colorSource=src;setCbarDefault();g('colorSearch')._syncClear?.();if(state.plotRendered)renderPlot();});
}
function autoTitle(){return state.colA&&state.colB?`${state.colA} vs ${state.colB}`:'Parity Comparison';}
function syncTitle(){if(!state.titleLocked){g('inputTitle').value=autoTitle();updateTitleLockUi();}}
function updateTitleLockUi(){
  const btn=g('titleLock');if(!btn)return;
  btn.textContent=state.titleLocked?'lock':'auto';
  btn.classList.toggle('locked',state.titleLocked);
  btn.title=state.titleLocked?'Locked — click to auto-update':'Auto-updating — click to lock';
  btn.setAttribute('aria-pressed',String(state.titleLocked));
}
function syncXLabel(){if(!state.xLabelLocked&&state.colA)g('inputXLabel').value=`[${state.nameA}] ${state.colA}`;}
function updateXLabelLockUi(){
  const btn=g('xLabelLock');if(!btn)return;
  btn.textContent=state.xLabelLocked?'lock':'auto';
  btn.classList.toggle('locked',state.xLabelLocked);
  btn.title=state.xLabelLocked?'Locked — click to auto-update':'Auto-updating — click to lock';
  btn.setAttribute('aria-pressed',String(state.xLabelLocked));
}
function syncYLabel(){if(!state.yLabelLocked&&state.colB)g('inputYLabel').value=`[${state.nameB}] ${state.colB}`;}
function updateYLabelLockUi(){
  const btn=g('yLabelLock');if(!btn)return;
  btn.textContent=state.yLabelLocked?'lock':'auto';
  btn.classList.toggle('locked',state.yLabelLocked);
  btn.title=state.yLabelLocked?'Locked — click to auto-update':'Auto-updating — click to lock';
  btn.setAttribute('aria-pressed',String(state.yLabelLocked));
}
function setAxisDefaults(){
  syncXLabel();
  syncYLabel();
  syncTitle();
}
function syncCbar(){if(!state.cbarLocked)g('inputCbarLabel').value=state.colorCol||'';}
function updateCbarLockUi(){
  const btn=g('cbarLock');if(!btn)return;
  btn.textContent=state.cbarLocked?'lock':'auto';
  btn.classList.toggle('locked',state.cbarLocked);
  btn.title=state.cbarLocked?'Locked — click to auto-update':'Auto-updating — click to lock';
  btn.setAttribute('aria-pressed',String(state.cbarLocked));
}
function setCbarDefault(){syncCbar();}
