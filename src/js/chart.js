/* ══════════════════════════════════════════════════
   SECTION 4 — PLOT RENDERING
══════════════════════════════════════════════════ */
const TABLEAU12=['#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f','#edc948','#b07aa1','#ff9da7','#9c755f','#bab0ac','#d37295','#fabfd2'];

function colVals(rows,col){return rows.map(r=>{const v=r[col];return(v===null||v===undefined||v==='')?NaN:Number(v);});}
// >50% finite: treats columns with sparse NaN/null as numeric without misclassifying text columns that happen to have a few parseable values
function isNum(arr){const ok=arr.filter(v=>Number.isFinite(v));return ok.length>arr.length*0.5;}
function g(id){return document.getElementById(id);}
function iv(id){return parseInt(g(id).value);}
function sv(id){return g(id).value;}
function cb(id){return g(id).checked;}

function getManualRange(){
  const xMn=sv('xMin'),xMx=sv('xMax'),yMn=sv('yMin'),yMx=sv('yMax');
  return{
    xMin:xMn===''?null:parseFloat(xMn),
    xMax:xMx===''?null:parseFloat(xMx),
    yMin:yMn===''?null:parseFloat(yMn),
    yMax:yMx===''?null:parseFloat(yMx),
  };
}
function resetRanges(){
  ['xMin','xMax','yMin','yMax'].forEach(id=>{g(id).value='';});
  clearEl('rangeAlerts');
  if(state.plotRendered)renderPlot();
}

/* compute stats values from arrays */
function computeStats(xV,yV){
  const n=xV.length;
  if(n===0)return null;
  const res=yV.map((y,i)=>y-xV[i]);
  const mY=yV.reduce((a,b)=>a+b,0)/n;
  const ssT=yV.reduce((s,y)=>s+(y-mY)**2,0);
  const ssR=res.reduce((s,r)=>s+r**2,0);
  // r2p is Nash-Sutcliffe Efficiency (NSE), not conventional R².
  // NSE = 1 - SS_res/SS_tot where SS_tot is variance around mean(Y), making it
  // appropriate for parity (y=x) assessment rather than regression fit.
  const r2p=ssT===0?NaN:1-ssR/ssT;
  const rmse=Math.sqrt(ssR/n);
  const mae=res.reduce((s,r)=>s+Math.abs(r),0)/n;
  const maxE=Math.max(...res.map(Math.abs));
  const bias=res.reduce((a,b)=>a+b,0)/n;
  const mX=xV.reduce((a,b)=>a+b,0)/n;
  const ssXX=xV.reduce((s,x)=>s+(x-mX)**2,0);
  const ssXY=xV.reduce((s,x,i)=>s+(x-mX)*(yV[i]-mY),0);
  const slope=ssXX===0?NaN:ssXY/ssXX,intc=mY-slope*mX;
  const yH=xV.map(x=>slope*x+intc);
  const ssRF=yV.reduce((s,y,i)=>s+(y-yH[i])**2,0);
  const r2f=ssT===0?NaN:1-ssRF/ssT;
  return{n,r2p,rmse,mae,maxE,bias,slope,intc,r2f};
}

function renderPlot(){
  if(!state.colA||!state.colB){alert('Please select columns for both X and Y axes.');return;}

  const xRaw=colVals(state.joinedA,state.colA);
  const yRaw=colVals(state.joinedB,state.colB);
  const cRaw=state.colorCol?colVals(state.colorSource==='A'?state.joinedA:state.joinedB,state.colorCol):[];

  // xV, yV, cV are built in lockstep — cV[k] always corresponds to xV[k]/yV[k].
  // finIdxs/nanIdxs computed from cV are safe to index into xV/yV. Do not reorder independently.
  let xV=[],yV=[],cV=[],nan=0;
  for(let i=0;i<xRaw.length;i++){
    if(isNaN(xRaw[i])||isNaN(yRaw[i])){nan++;continue;}
    xV.push(xRaw[i]);yV.push(yRaw[i]);cV.push(cRaw[i]!==undefined?cRaw[i]:null);
  }

  // Manual overrides
  const man=getManualRange();
  clearEl('rangeAlerts');

  if(xV.length===0){
    g('rangeAlerts').innerHTML='<div class="alert danger">No numeric data to plot. All matched rows were excluded — check that the selected columns contain numbers.</div>';
    if(state.plotRendered){
      state.plotRendered=false;
      g('plotArea').classList.add('hidden');g('emptyState').classList.remove('hidden');
      g('statsPanel').style.display='none';g('downloadBtn').style.display='none';
      g('showCbarRow').style.display='none';g('cbarExportBtn').style.display='none';
      g('renderBtn').textContent='Render plot';
    }
    return;
  }

  // Auto range from combined x+y
  const allFin=[...xV,...yV].filter(isFinite);
  const dataMn=Math.min(...allFin),dataMx=Math.max(...allFin);
  const pad=(dataMx-dataMn)*0.05||1;
  const autoMin=dataMn-pad,autoMax=dataMx+pad;
  if(man.xMin!==null&&man.xMax!==null&&man.xMin>=man.xMax){g('rangeAlerts').innerHTML='<div class="alert warn">X min must be less than X max.</div>';return;}
  if(man.yMin!==null&&man.yMax!==null&&man.yMin>=man.yMax){g('rangeAlerts').innerHTML='<div class="alert warn">Y min must be less than Y max.</div>';return;}

  const xRange=[man.xMin!==null?man.xMin:autoMin,man.xMax!==null?man.xMax:autoMax];
  const yRange=[man.yMin!==null?man.yMin:autoMin,man.yMax!==null?man.yMax:autoMax];
  const bandMn=Math.min(xRange[0],yRange[0]);
  const bandMx=Math.max(xRange[1],yRange[1]);
  const anyManual=man.xMin!==null||man.xMax!==null||man.yMin!==null||man.yMax!==null;

  // Figure size — init from container on first render
  if(!state.figInited){
    const pw=g('plotArea').offsetWidth-32||800;
    const ph=g('plotArea').offsetHeight-32||700;
    const initW=Math.min(Math.max(Math.round(pw/10)*10,400),2000);
    const initH=Math.min(Math.max(Math.round(ph/10)*10,300),1400);
    g('figW').value=initW;g('figWVal').value=initW;
    g('figH').value=initH;g('figHVal').value=initH;
    state.figInited=true;
  }
  const figW=iv('figW'),figH=iv('figH');

  // Typography
  const fsT=iv('fsTitle'),fsA=iv('fsAxisLabel'),fsTk=iv('fsTick');
  const fsL=iv('fsLegend'),fsCt=iv('fsCbarTick'),fsCT=iv('fsCbarTitle');
  const cbW=iv('cbarThickness'),fsAnnot=iv('fsAnnot');
  const showMaj=cb('majorGrid'),showMin=cb('minorGrid');

  // Marker edge
  const edgeW=parseFloat(parseFloat(g('edgeWidth').value).toFixed(1));
  const edgeC=sv('edgeColor');

  // Traces
  const traces=[{
    x:[bandMn,bandMx],y:[bandMn,bandMx],
    mode:'lines',line:{color:sv('parityColor'),dash:sv('parityDash'),width:parseFloat(g('parityWidth').value)},
    name:'y = x',hoverinfo:'skip',showlegend:true,
  }];
  if(cb('band5')) traces.push(...band(bandMn,bandMx,0.05,'#22a34a','±5%'));
  if(cb('band10'))traces.push(...band(bandMn,bandMx,0.10,'#d97706','±10%'));

  const isNumC=state.colorCol&&isNum(cV);
  if(state.colorCol&&cV.length>0){
    const numRatio=cV.filter(v=>Number.isFinite(v)).length/cV.length;
    if(numRatio>=0.4&&numRatio<=0.6)
      g('rangeAlerts').innerHTML+=`<div class="alert warn">Color column "${escHtml(state.colorCol)}" is ${Math.round(numRatio*100)}% numeric — classified as ${isNumC?'continuous (colorscale)':'categorical'}. Check column type if unexpected.</div>`;
  }
  const baseMarker={size:iv('markerSize'),opacity:iv('markerOpacity')/100,line:{color:edgeW>0?edgeC:'rgba(0,0,0,0)',width:edgeW}};
  if(!state.colorCol||isNumC){
    const mk={...baseMarker};
    if(isNumC){
      const showCbar=cb('showColorbar');
      const finIdxs=[],nanIdxs=[];
      cV.forEach((v,i)=>(Number.isFinite(v)?finIdxs:nanIdxs).push(i));
      if(nanIdxs.length>0){
        g('rangeAlerts').innerHTML+='<div class="alert warn">'+nanIdxs.length+' point'+(nanIdxs.length===1?'':'s')+' ha'+(nanIdxs.length===1?'s':'ve')+' no color data and are shown in gray.</div>';
        traces.push({x:nanIdxs.map(i=>xV[i]),y:nanIdxs.map(i=>yV[i]),mode:'markers',type:'scatter',
          name:'No color data',marker:{...baseMarker,color:'#888888'},
          hovertemplate:'No color data<br>X: %{x:.4g}<br>Y: %{y:.4g}<extra></extra>'});
      }
      if(finIdxs.length>0){
        mk.color=finIdxs.map(i=>cV[i]);mk.colorscale=sv('cmapSelect');mk.showscale=showCbar;
        if(showCbar)mk.colorbar={
          title:{text:sv('inputCbarLabel')||state.colorCol,font:{size:fsCT,color:'#333333'}},
          tickfont:{size:fsCt,color:'#333333',family:'JetBrains Mono,monospace'},
          bgcolor:'#ffffff',outlinecolor:'#cccccc',outlinewidth:1,thickness:cbW,
        };
        traces.push({
          x:finIdxs.map(i=>xV[i]),y:finIdxs.map(i=>yV[i]),mode:'markers',type:'scatter',
          marker:mk,name:'Data',
          hovertemplate:'X: %{x:.4g}<br>Y: %{y:.4g}<extra></extra>',
        });
      }
    }else{
      mk.color='#2563eb';
      traces.push({
        x:xV,y:yV,mode:'markers',type:'scatter',
        marker:mk,name:'Data',
        hovertemplate:'X: %{x:.4g}<br>Y: %{y:.4g}<extra></extra>',
      });
    }
  }else{
    const cats=[...new Set(cV.map(String))].filter(c=>c!=='NaN'&&c!=='').sort();
    if(cats.length>12)g('fileAlerts').innerHTML='<div class="alert warn">Color-by column has >12 categories — colors will repeat.</div>';
    const nanCatIdxs=cV.reduce((a,v,i)=>(!Number.isFinite(v)&&typeof v!=='string')||v===''?[...a,i]:a,[]);
    if(nanCatIdxs.length>0)traces.push({x:nanCatIdxs.map(i=>xV[i]),y:nanCatIdxs.map(i=>yV[i]),mode:'markers',type:'scatter',
      name:'No color data',marker:{...baseMarker,color:'#888888'},
      hovertemplate:'No color data<br>X: %{x:.4g}<br>Y: %{y:.4g}<extra></extra>'});
    cats.forEach((cat,ci)=>{
      const idxs=cV.reduce((a,v,i)=>String(v)===cat?[...a,i]:a,[]);
      traces.push({
        x:idxs.map(i=>xV[i]),y:idxs.map(i=>yV[i]),
        mode:'markers',type:'scatter',name:cat,
        marker:{...baseMarker,color:TABLEAU12[ci%TABLEAU12.length]},
        hovertemplate:`<b>${cat}</b><br>X: %{x:.4g}<br>Y: %{y:.4g}<extra></extra>`,
      });
    });
  }

  // Stats annotation
  const stats=computeStats(xV,yV);
  if(cb('showBestFit')&&stats&&stats.n>=3&&Number.isFinite(stats.slope)){
    const bfY0=stats.slope*bandMn+stats.intc,bfY1=stats.slope*bandMx+stats.intc;
    traces.push({x:[bandMn,bandMx],y:[bfY0,bfY1],mode:'lines',
      line:{color:sv('bfColor'),dash:sv('bfDash'),width:parseFloat(g('bfWidth').value)},
      name:'Best fit',hoverinfo:'skip',showlegend:true});
  }
  const fs=v=>isNaN(v)?'N/A':(+v).toPrecision(4);
  const annotText=stats
    ?`R² = ${fs(stats.r2p)}<br>MAE = ${fs(stats.mae)}<br>RMSE = ${fs(stats.rmse)}`
    :'No data';
  const annotX=state.annotPos?state.annotPos.x:0.98;
  const annotY=state.annotPos?state.annotPos.y:0.05;

  const axisBase={
    showgrid:showMaj,gridcolor:showMaj?'#e0e0e0':'rgba(0,0,0,0)',gridwidth:1,
    minor:{showgrid:showMin,gridcolor:'#f0f0f0',gridwidth:0.5},
    zerolinecolor:'#aaaaaa',zerolinewidth:1,
    linecolor:'#aaaaaa',linewidth:1,mirror:true,
    tickfont:{family:'JetBrains Mono,monospace',size:fsTk,color:'#222222'},
    tickcolor:'#aaaaaa',
  };

  const layout={
    paper_bgcolor:'#ffffff',plot_bgcolor:'#ffffff',
    width:figW,height:figH,
    font:{family:'IBM Plex Sans,system-ui,sans-serif',color:'#333333',size:12},
    title:{text:sv('inputTitle')||'Parity Comparison',x:0.5,xanchor:'center',xref:'paper',font:{size:fsT,color:'#111111'}},
    xaxis:{...axisBase,range:xRange,title:{text:sv('inputXLabel')||state.colA,font:{size:fsA,color:'#222222'}}},
    yaxis:{
      ...axisBase,range:yRange,
      title:{text:sv('inputYLabel')||state.colB,font:{size:fsA,color:'#222222'}},
      // scaleanchor keeps y=x at 45°; constrain:'domain' prevents Plotly from expanding the plot area to compensate
      scaleanchor:'x',scaleratio:1,constrain:'domain',
    },
    legend:{
      font:{size:fsL,color:'#333333'},
      bgcolor:'rgba(255,255,255,0.9)',bordercolor:'#cccccc',borderwidth:1,
      x:0.01,y:0.99,xanchor:'left',yanchor:'top',
    },
    annotations:[{
      x:annotX,y:annotY,
      xref:'paper',yref:'paper',
      xanchor:annotX>0.5?'right':'left',
      yanchor:annotY<0.5?'bottom':'top',
      text:annotText,
      showarrow:false,
      bgcolor:'rgba(255,255,255,0.88)',
      bordercolor:'#aaaaaa',
      borderwidth:1,
      borderpad:8,
      font:{family:'JetBrains Mono,monospace',size:fsAnnot,color:'#111111'},
      align:'left',
    }],
    // Margin heuristic keeps axis labels/ticks inside the export canvas as font size changes.
    // Plotly automargin conflicts with scaleanchor so margins are computed manually.
    margin:{l:Math.round(30+fsA*1+fsTk*3),r:30,t:Math.round(18+fsT*1.6),b:Math.round(20+fsA*1.5+fsTk*2.2)},
  };

  // Apply explicit size to plotDiv
  const pd=g('plotDiv');
  pd.style.width=figW+'px';
  pd.style.height=figH+'px';

  plotState.data=traces;plotState.layout=layout;plotState.meta={xV,yV,nan,stats,colA:state.colA,colB:state.colB,colorCol:state.colorCol,colorSource:state.colorSource};

  g('emptyState').classList.add('hidden');
  g('plotArea').classList.remove('hidden');

  Plotly.react('plotDiv',traces,layout,{
    responsive:false,
    displayModeBar:true,
    displaylogo:false,
    modeBarButtonsToRemove:['select2d','lasso2d'],
    edits:{legendPosition:true,annotationPosition:true},
  });

  // Capture annotation drag position
  pd.on('plotly_relayout',e=>{
    const ax=e['annotations[0].x'],ay=e['annotations[0].y'];
    if(ax!==undefined&&ay!==undefined){
      state.annotPos={x:ax,y:ay};
    }
  });

  state.plotRendered=true;
  g('downloadBtn').style.display='';
  g('showCbarRow').style.display=isNumC?'':'none';
  g('cbarExportBtn').style.display=isNumC?'':'none';
  ['typographySection','presetSection','saveSection'].forEach(id=>g(id).style.display='');
  g('renderBtn').textContent='Re-render';
  renderStats(xV,yV,nan,stats);
  g('statsPanel').style.display='';
}

function band(mn,mx,pct,color,name){
  const props={fill:'toself',fillcolor:color+'22',line:{color,width:1,dash:'dot'},mode:'lines',hoverinfo:'skip'};
  if(mn>=0){
    return[{...props,name,
      x:[mn,mx,mx,mn,mn],
      y:[mn*(1+pct),mx*(1+pct),mx*(1-pct),mn*(1-pct),mn*(1+pct)]}];
  }else if(mx<=0){
    return[{...props,name,
      x:[mn,mx,mx,mn,mn],
      y:[mn*(1-pct),mx*(1-pct),mx*(1+pct),mn*(1+pct),mn*(1-pct)]}];
  }else{
    // spans zero: two separate triangles to avoid self-intersecting polygon
    return[
      {...props,name,showlegend:false,x:[mn,0,mn,mn],y:[mn*(1-pct),0,mn*(1+pct),mn*(1-pct)]},
      {...props,name,x:[0,mx,mx,0],y:[0,mx*(1+pct),mx*(1-pct),0]},
    ];
  }
}

function downloadPlot(){
  Plotly.downloadImage('plotDiv',{format:'png',width:iv('figW'),height:iv('figH'),filename:'parity_compare'});
}
async function downloadColorbar(){
  if(!state.plotRendered||!state.colorCol)return;
  const rows=state.colorSource==='A'?state.joinedA:state.joinedB;
  const cVals=colVals(rows,state.colorCol).filter(v=>Number.isFinite(v));
  if(!cVals.length||!isNum(cVals))return;
  const cMin=Math.min(...cVals),cMax=Math.max(...cVals);
  const cbW=iv('cbarThickness'),fsCt=iv('fsCbarTick'),fsCT=iv('fsCbarTitle');
  const ph=Math.max(220,Math.round(iv('figH')*0.65));
  const pw=cbW+90;
  // 64 invisible dummy points (size 0.1) exist solely to give Plotly a color array
  // that activates the colorbar — there is no way to render a standalone colorbar otherwise.
  const n=64;
  const step=cMax===cMin?1:(cMax-cMin)/(n-1);
  const dummy=Array.from({length:n},(_,i)=>cMin+i*step);

  const div=document.createElement('div');
  div.style.cssText=`position:fixed;left:-9999px;top:0;width:${pw}px;height:${ph}px;visibility:hidden;`;
  document.body.appendChild(div);
  try{
    await Plotly.newPlot(div,[{
      x:dummy.map(()=>0),y:dummy,mode:'markers',type:'scatter',showlegend:false,hoverinfo:'none',
      marker:{size:0.1,color:dummy,colorscale:sv('cmapSelect'),cmin:cMin,cmax:cMax,showscale:true,
        colorbar:{
          title:{text:sv('inputCbarLabel')||state.colorCol,font:{size:fsCT,color:'#333333'}},
          tickfont:{size:fsCt,color:'#333333',family:'JetBrains Mono,monospace'},
          bgcolor:'#ffffff',outlinecolor:'#cccccc',outlinewidth:1,thickness:cbW,
          x:0,xanchor:'left',y:0.5,yanchor:'middle',len:0.88,
        },
      },
    }],{
      paper_bgcolor:'#ffffff',plot_bgcolor:'rgba(0,0,0,0)',
      width:pw,height:ph,
      xaxis:{visible:false,range:[0,1]},yaxis:{visible:false,range:[cMin,cMax]},
      margin:{l:0,r:0,t:10,b:10},
    },{staticPlot:true,displayModeBar:false});
    const url=await Plotly.toImage(div,{format:'png',width:pw,height:ph});
    const a=document.createElement('a');a.href=url;a.download='colorbar.png';a.click();
  }finally{Plotly.purge(div);div.remove();}
}
async function downloadZip(){
  const plots=state.savedPlots.filter(Boolean);
  if(!plots.length){
    const btn=g('zipBtn');
    btn.textContent='Nothing saved';btn.disabled=true;
    setTimeout(()=>{btn.textContent='↓ ZIP';btn.disabled=false;},2000);
    return;
  }
  const btn=g('zipBtn');
  const orig=btn.textContent;
  btn.disabled=true;
  const div=document.createElement('div');
  div.style.cssText='position:fixed;left:-9999px;top:0;';
  document.body.appendChild(div);
  try{
    const zip=new JSZip();
    for(let i=0;i<plots.length;i++){
      btn.textContent=`${i+1}/${plots.length}…`;
      const snap=plots[i];
      const w=snap.layout.width||800,h=snap.layout.height||700;
      div.style.width=w+'px';div.style.height=h+'px';
      await Plotly.newPlot(div,snap.data,snap.layout,{staticPlot:true,displayModeBar:false});
      const url=await Plotly.toImage(div,{format:'png',width:w,height:h});
      const base64=url.split(',')[1];
      const name=(snap.title||'').replace(/[^\w\s-]/g,'').trim().replace(/\s+/g,'_')||`plot_${i+1}`;
      zip.file(`${String(i+1).padStart(2,'0')}_${name}.png`,base64,{base64:true});
      Plotly.purge(div);
    }
    const blob=await zip.generateAsync({type:'blob'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='parity_plots.zip';a.click();
    URL.revokeObjectURL(url); // safe to revoke immediately — browser handles the download asynchronously
  }catch(e){console.error('ZIP export failed:',e);}
  finally{div.remove();btn.disabled=false;btn.textContent=orig;}
}
function savePreset(){
  const preset={
    _schema:'parity-style-preset-v1',
    colormap:sv('cmapSelect'),
    marker_size:iv('markerSize'),
    marker_opacity:iv('markerOpacity'),
    marker_edge_color:sv('edgeColor'),
    marker_edge_width:parseFloat(g('edgeWidth').value),
    colorbar_thickness:iv('cbarThickness'),
    show_band_5pct:cb('band5'),
    show_band_10pct:cb('band10'),
    show_best_fit:cb('showBestFit'),
    parity_line_color:sv('parityColor'),
    parity_line_width:parseFloat(g('parityWidth').value),
    parity_line_dash:sv('parityDash'),
    bestfit_line_color:sv('bfColor'),
    bestfit_line_width:parseFloat(g('bfWidth').value),
    bestfit_line_dash:sv('bfDash'),
    show_major_grid:cb('majorGrid'),
    show_minor_grid:cb('minorGrid'),
    fig_width_px:iv('figW'),
    fig_height_px:iv('figH'),
    font_size_title:iv('fsTitle'),
    font_size_axis_label:iv('fsAxisLabel'),
    font_size_tick:iv('fsTick'),
    font_size_legend:iv('fsLegend'),
    font_size_stats_box:iv('fsAnnot'),
    font_size_colorbar_tick:iv('fsCbarTick'),
    font_size_colorbar_title:iv('fsCbarTitle'),
    axis_x_min:sv('xMin')===''?null:parseFloat(sv('xMin')),
    axis_x_max:sv('xMax')===''?null:parseFloat(sv('xMax')),
    axis_y_min:sv('yMin')===''?null:parseFloat(sv('yMin')),
    axis_y_max:sv('yMax')===''?null:parseFloat(sv('yMax')),
    plot_title:sv('inputTitle'),
    label_x_axis:sv('inputXLabel'),
    label_y_axis:sv('inputYLabel'),
    label_colorbar:sv('inputCbarLabel'),
  };
  const blob=new Blob([JSON.stringify(preset,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='parity_style_preset.json';a.click();
  URL.revokeObjectURL(url);
}
function loadPreset(file){
  if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    let p;
    try{p=JSON.parse(e.target.result);}catch{g('presetAlert').innerHTML='<div class="alert danger">Invalid JSON.</div>';return;}
    if(p._schema!=='parity-style-preset-v1')g('presetAlert').innerHTML='<div class="alert warn">Unrecognised schema — applying anyway.</div>';
    else clearEl('presetAlert');
    const ss=(id,v)=>{if(v!=null){const el=g(id);if(el)el.value=v;}};
    const sc=(id,v)=>{if(v!=null){const el=g(id);if(el)el.checked=!!v;}};
    const sl=(id,vid,fmt,v)=>{
      if(v==null)return;const el=g(id);if(!el)return;el.value=v;
      const lbl=g(vid);if(!lbl)return;
      const isInput=lbl.tagName==='INPUT';
      if(fmt==='float1'){if(isInput)lbl.value=parseFloat(v).toFixed(1);else lbl.textContent=parseFloat(v).toFixed(1);}
      else if(fmt==='px'){if(isInput)lbl.value=v;else lbl.textContent=v+' px';}
      else{if(isInput)lbl.value=String(v);else lbl.textContent=String(v);}
    };
    ss('cmapSelect',p.colormap);
    sl('markerSize','markerSizeVal','int',p.marker_size);
    sl('markerOpacity','markerOpacityVal','pct',p.marker_opacity);
    ss('edgeColor',p.marker_edge_color);
    sl('edgeWidth','edgeWidthVal','float1',p.marker_edge_width);
    sl('cbarThickness','cbarThicknessVal','int',p.colorbar_thickness);
    sc('band5',p.show_band_5pct);sc('band10',p.show_band_10pct);
    sc('showBestFit',p.show_best_fit);
    ss('parityColor',p.parity_line_color);sl('parityWidth','parityWidthVal','float1',p.parity_line_width);ss('parityDash',p.parity_line_dash);
    ss('bfColor',p.bestfit_line_color);sl('bfWidth','bfWidthVal','float1',p.bestfit_line_width);ss('bfDash',p.bestfit_line_dash);
    sc('majorGrid',p.show_major_grid);sc('minorGrid',p.show_minor_grid);
    sl('figW','figWVal','px',p.fig_width_px);sl('figH','figHVal','px',p.fig_height_px);
    sl('fsTitle','fsTitleVal','int',p.font_size_title);
    sl('fsAxisLabel','fsAxisLabelVal','int',p.font_size_axis_label);
    sl('fsTick','fsTickVal','int',p.font_size_tick);
    sl('fsLegend','fsLegendVal','int',p.font_size_legend);
    sl('fsAnnot','fsAnnotVal','int',p.font_size_stats_box);
    sl('fsCbarTick','fsCbarTickVal','int',p.font_size_colorbar_tick);
    sl('fsCbarTitle','fsCbarTitleVal','int',p.font_size_colorbar_title);
    ['xMin','xMax','yMin','yMax'].forEach(id=>{g(id).value='';});
    if(p.axis_x_min!=null)g('xMin').value=p.axis_x_min;
    if(p.axis_x_max!=null)g('xMax').value=p.axis_x_max;
    if(p.axis_y_min!=null)g('yMin').value=p.axis_y_min;
    if(p.axis_y_max!=null)g('yMax').value=p.axis_y_max;
    if(p.plot_title!=null){g('inputTitle').value=p.plot_title;if(p.plot_title){state.titleLocked=true;updateTitleLockUi();}}
    if(p.label_x_axis!=null){g('inputXLabel').value=p.label_x_axis;if(p.label_x_axis){state.xLabelLocked=true;updateXLabelLockUi();}}
    if(p.label_y_axis!=null){g('inputYLabel').value=p.label_y_axis;if(p.label_y_axis){state.yLabelLocked=true;updateYLabelLockUi();}}
    if(p.label_colorbar!=null){g('inputCbarLabel').value=p.label_colorbar;if(p.label_colorbar){state.cbarLocked=true;updateCbarLockUi();}}
    if(state.plotRendered)renderPlot();
  };
  reader.readAsText(file);
}

// Control re-render wiring
['cmapSelect','band5','band10','showBestFit','majorGrid','minorGrid','showColorbar','parityDash','bfDash'].forEach(id=>{
  g(id)&&g(id).addEventListener('change',()=>{if(state.plotRendered)renderPlot();});
});
['inputTitle','inputXLabel','inputYLabel','inputCbarLabel'].forEach(id=>{
  const el=g(id);if(!el)return;
  el.addEventListener('change',()=>{if(state.plotRendered)renderPlot();});
  el.addEventListener('input',debounce(()=>{if(state.plotRendered)renderPlot();},450));
});
['xMin','xMax','yMin','yMax'].forEach(id=>{
  g(id)&&g(id).addEventListener('change',()=>{if(state.plotRendered)renderPlot();});
});
g('edgeColor').addEventListener('input',()=>{if(state.plotRendered)renderPlot();});
g('parityColor').addEventListener('input',()=>{if(state.plotRendered)renderPlot();});
g('bfColor').addEventListener('input',()=>{if(state.plotRendered)renderPlot();});

// Sliders
[
  ['markerSize','markerSizeVal','int'],
  ['markerOpacity','markerOpacityVal','pct'],
  ['cbarThickness','cbarThicknessVal','int'],
  ['edgeWidth','edgeWidthVal','float1'],
  ['parityWidth','parityWidthVal','float1'],
  ['bfWidth','bfWidthVal','float1'],
  ['figW','figWVal','px'],
  ['figH','figHVal','px'],
  ['fsTitle','fsTitleVal','int'],
  ['fsAxisLabel','fsAxisLabelVal','int'],
  ['fsTick','fsTickVal','int'],
  ['fsLegend','fsLegendVal','int'],
  ['fsAnnot','fsAnnotVal','int'],
  ['fsCbarTick','fsCbarTickVal','int'],
  ['fsCbarTitle','fsCbarTitleVal','int'],
].forEach(([sid,vid,fmt])=>{
  const el=g(sid),val=g(vid);if(!el||!val)return;
  const isNum=val.tagName==='INPUT';
  function setVal(v){
    if(fmt==='float1'){if(isNum)val.value=parseFloat(v).toFixed(1);else val.textContent=parseFloat(v).toFixed(1);}
    else if(fmt==='px'){if(isNum)val.value=v;else val.textContent=v+' px';}
    else if(fmt==='pct'){if(isNum)val.value=v;else val.textContent=v+'%';}
    else{if(isNum)val.value=v;else val.textContent=v;}
  }
  el.addEventListener('input',function(){setVal(this.value);if(state.plotRendered)renderPlot();});
  if(isNum){
    val.addEventListener('change',function(){
      let v=parseFloat(this.value);
      if(isNaN(v))v=parseFloat(el.value);
      v=Math.max(parseFloat(el.min),Math.min(parseFloat(el.max),v));
      v=fmt==='float1'?+v.toFixed(1):Math.round(v/parseFloat(el.step||1))*parseFloat(el.step||1);
      this.value=v;el.value=v;
      if(state.plotRendered)renderPlot();
    });
  }
});
