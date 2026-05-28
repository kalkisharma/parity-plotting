/* ══════════════════════════════════════════════════
   SECTION 6 — STATS PANEL
══════════════════════════════════════════════════ */
function renderStats(xV,yV,nan,stats){
  const grid=g('statsGrid');
  if(!stats||stats.n===0){
    grid.innerHTML='<div class="stat-card"><div class="stat-label">No valid data</div><div class="stat-value muted">N/A</div></div>';
    return;
  }
  const{n,r2p,rmse,mae,maxE,bias,slope,intc,r2f}=stats;
  const f=(v,d=4)=>isNaN(v)?'N/A':(+v).toPrecision(d);
  const fs=f; // alias — toPrecision handles both tiny and large values
  grid.innerHTML=`
    <div class="stat-card"><div class="stat-label">N matched</div><div class="stat-value">${n}</div></div>
    <div class="stat-card"><div class="stat-label">N excluded (NaN)</div><div class="stat-value muted">${nan}</div></div>
    <div class="stat-card" title="Nash-Sutcliffe Efficiency (NSE). NSE=1 is perfect; NSE&lt;0 means the mean of observations is a better predictor than the model."><div class="stat-label">Parity R² (NSE)</div><div class="stat-value ${r2p>0.99?'good':r2p<0?'warn':''}">${fs(r2p)}</div></div>
    <div class="stat-card"><div class="stat-label">MAE</div><div class="stat-value">${f(mae)}</div></div>
    <div class="stat-card"><div class="stat-label">RMSE</div><div class="stat-value">${f(rmse)}</div></div>
    <div class="stat-card"><div class="stat-label">Max |error|</div><div class="stat-value">${f(maxE)}</div></div>
    <div class="stat-card"><div class="stat-label">Mean bias (B−A)</div><div class="stat-value">${f(bias)}</div></div>
    <div class="stat-card" style="grid-column:span 2"><div class="stat-label">Best-fit line</div><div class="stat-value" style="font-size:12px">${n>=3?`y = ${fs(slope)}x + ${fs(intc)} &nbsp;·&nbsp; R² = ${fs(r2f)}`:'n &lt; 3 — insufficient data for regression'}</div></div>`;
}
