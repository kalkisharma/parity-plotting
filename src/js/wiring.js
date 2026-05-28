/* ══════════════════════════════════════════════════
   FILE WIRING + UTILITIES
══════════════════════════════════════════════════ */
function wireDropzone(dzId,fileId,which){
  const dz=g(dzId),fi=g(fileId);
  fi.addEventListener('change',e=>{if(e.target.files[0])handleFile(e.target.files[0],which);});
  dz.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fi.click();}});
  dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('drag-over');});
  dz.addEventListener('dragleave',()=>dz.classList.remove('drag-over'));
  dz.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('drag-over');const f=e.dataTransfer.files[0];if(f)handleFile(f,which);});
}
function handleFile(file,which){
  if(which==='A')state._fileA={name:file.name,size:file.size};
  else state._fileB={name:file.name,size:file.size};
  setSt(which,'Parsing…','');
  parseCSV(file,result=>{
    if(result.errors.length&&!result.data.length){setSt(which,'Parse error — check file format','error');return;}
    onFileParsed(which,result.data,result.meta.fields||Object.keys(result.data[0]||{}));
  });
}
wireDropzone('dzA','fileA','A');
wireDropzone('dzB','fileB','B');

const _rebuildCols=debounce(()=>{if(state.rawA&&state.rawB)buildColDropdowns();},300);
const _rerender=debounce(()=>{if(state.plotRendered)renderPlot();},350);
g('nameA').addEventListener('input',function(){
  const prev=state.nameA;state.nameA=this.value||'Dataset A';
  const xl=g('inputXLabel');
  if(state.colA&&!state.xLabelLocked&&xl.value===`[${prev}] ${state.colA}`)xl.value=`[${state.nameA}] ${state.colA}`;
  _rebuildCols();_rerender();
});
g('nameB').addEventListener('input',function(){
  const prev=state.nameB;state.nameB=this.value||'Dataset B';
  const yl=g('inputYLabel');
  if(state.colB&&!state.yLabelLocked&&yl.value===`[${prev}] ${state.colB}`)yl.value=`[${state.nameB}] ${state.colB}`;
  _rebuildCols();_rerender();
});

// Title lock button
g('titleLock').addEventListener('click',()=>{
  state.titleLocked=!state.titleLocked;
  updateTitleLockUi();
  if(!state.titleLocked)syncTitle();
  if(state.plotRendered)renderPlot();
});
g('inputTitle').addEventListener('input',()=>{
  if(!state.titleLocked){state.titleLocked=true;updateTitleLockUi();}
});
updateTitleLockUi();

// X label lock button
g('xLabelLock').addEventListener('click',()=>{
  state.xLabelLocked=!state.xLabelLocked;
  updateXLabelLockUi();
  if(!state.xLabelLocked){syncXLabel();if(state.plotRendered)renderPlot();}
});
g('inputXLabel').addEventListener('input',()=>{
  if(!state.xLabelLocked){state.xLabelLocked=true;updateXLabelLockUi();}
});
updateXLabelLockUi();

// Y label lock button
g('yLabelLock').addEventListener('click',()=>{
  state.yLabelLocked=!state.yLabelLocked;
  updateYLabelLockUi();
  if(!state.yLabelLocked){syncYLabel();if(state.plotRendered)renderPlot();}
});
g('inputYLabel').addEventListener('input',()=>{
  if(!state.yLabelLocked){state.yLabelLocked=true;updateYLabelLockUi();}
});
updateYLabelLockUi();

// Colorbar label lock button
g('cbarLock').addEventListener('click',()=>{
  state.cbarLocked=!state.cbarLocked;
  updateCbarLockUi();
  if(!state.cbarLocked)syncCbar();
  if(state.plotRendered)renderPlot();
});
g('inputCbarLabel').addEventListener('input',()=>{
  if(!state.cbarLocked){state.cbarLocked=true;updateCbarLockUi();}
});
updateCbarLockUi();

// Style preset file input
g('presetFileInput').addEventListener('change',function(){loadPreset(this.files[0]);this.value='';});

// Color-by clear button
(function(){
  const inp=g('colorSearch'),btn=g('colorClear');
  function syncClear(){inp.classList.toggle('has-clear',!!inp.dataset.selected);btn.classList.toggle('hidden',!inp.dataset.selected);}
  btn.addEventListener('mousedown',e=>{
    e.preventDefault();
    inp.value='';inp.dataset.selected='';inp._selVal=undefined;
    state.colorCol=null;state.colorSource=null;
    syncCbar();
    syncClear();
    inp._openDD?.();
    if(state.plotRendered)renderPlot();
  });
  // expose so makeDD onSel can trigger it after selection
  inp.addEventListener('input',syncClear);
  inp.addEventListener('focus',syncClear);
  g('colorSearch')._syncClear=syncClear;
})();

// Join-key clear button
(function(){
  const inp=g('keySearch'),btn=g('keyClear');
  function syncClear(){inp.classList.toggle('has-clear',!!inp.dataset.selected);btn.classList.toggle('hidden',!inp.dataset.selected);}
  btn.addEventListener('mousedown',e=>{
    e.preventDefault();
    inp.value='';inp.dataset.selected='';inp._selVal=undefined;
    state.joinKey=null;state.joinedA=[];state.joinedB=[];
    clearEl('joinAlerts');
    ['colASearch','colBSearch','colorSearch'].forEach(id=>{const el=g(id);if(el){el.value='';el.dataset.selected='';el._selVal=undefined;}});
    g('colorSearch')._syncClear?.();g('colASearch')._syncClear?.();g('colBSearch')._syncClear?.();
    state.colA=null;state.colB=null;state.colorCol=null;state.colorSource=null;
    ['colSection','ctrlSection','typographySection','presetSection','saveSection'].forEach(id=>g(id).style.display='none');
    if(state.plotRendered){state.plotRendered=false;g('plotArea').classList.add('hidden');g('emptyState').classList.remove('hidden');g('statsPanel').style.display='none';g('downloadBtn').style.display='none';g('showCbarRow').style.display='none';g('cbarExportBtn').style.display='none';g('renderBtn').textContent='Render plot';}
    syncClear();
    inp._openDD?.();
  });
  inp.addEventListener('input',syncClear);
  inp.addEventListener('focus',syncClear);
  g('keySearch')._syncClear=syncClear;
})();

// X-axis column clear button
(function(){
  const inp=g('colASearch'),btn=g('colAClear');
  function syncClear(){inp.classList.toggle('has-clear',!!inp.dataset.selected);btn.classList.toggle('hidden',!inp.dataset.selected);}
  btn.addEventListener('mousedown',e=>{
    e.preventDefault();
    inp.value='';inp.dataset.selected='';inp._selVal=undefined;
    state.colA=null;
    state.xLabelLocked=false;updateXLabelLockUi();
    g('inputXLabel').value='';
    syncTitle();
    ['ctrlSection','typographySection','presetSection','saveSection'].forEach(id=>g(id).style.display='none');
    if(state.plotRendered){state.plotRendered=false;g('plotArea').classList.add('hidden');g('emptyState').classList.remove('hidden');g('statsPanel').style.display='none';g('downloadBtn').style.display='none';g('showCbarRow').style.display='none';g('cbarExportBtn').style.display='none';g('renderBtn').textContent='Render plot';}
    syncClear();
    inp._openDD?.();
  });
  inp.addEventListener('input',syncClear);
  inp.addEventListener('focus',syncClear);
  g('colASearch')._syncClear=syncClear;
})();

// Y-axis column clear button
(function(){
  const inp=g('colBSearch'),btn=g('colBClear');
  function syncClear(){inp.classList.toggle('has-clear',!!inp.dataset.selected);btn.classList.toggle('hidden',!inp.dataset.selected);}
  btn.addEventListener('mousedown',e=>{
    e.preventDefault();
    inp.value='';inp.dataset.selected='';inp._selVal=undefined;
    state.colB=null;
    state.yLabelLocked=false;updateYLabelLockUi();
    g('inputYLabel').value='';
    syncTitle();
    ['ctrlSection','typographySection','presetSection','saveSection'].forEach(id=>g(id).style.display='none');
    if(state.plotRendered){state.plotRendered=false;g('plotArea').classList.add('hidden');g('emptyState').classList.remove('hidden');g('statsPanel').style.display='none';g('downloadBtn').style.display='none';g('showCbarRow').style.display='none';g('cbarExportBtn').style.display='none';g('renderBtn').textContent='Render plot';}
    syncClear();
    inp._openDD?.();
  });
  inp.addEventListener('input',syncClear);
  inp.addEventListener('focus',syncClear);
  g('colBSearch')._syncClear=syncClear;
})();

function toggleSavedScroll(){
  const scroll=g('savedScroll'),btn=g('savedStripToggle');
  const collapsed=scroll.style.display==='none';
  scroll.style.display=collapsed?'flex':'none';
  btn.textContent=collapsed?'▼':'▶';
  btn.setAttribute('aria-expanded',String(collapsed));
}
function clearEl(id){g(id).innerHTML='';}
function debounce(fn,d){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),d);};}

renderTabBar();

window.addEventListener('beforeunload',e=>{
  if(state.savedPlots.filter(Boolean).length>0){e.preventDefault();e.returnValue='';}
});