// ▼ グローバル定義
const LS_KEY = 'paveAppAllSites_v5'; // 新バージョンに合わせて更新
let allSites = {};
let currentSite = '';
const paveTypes = ["アスファルト", "コンクリート", "オーバーレイ"];
const worksList = [
  { id: "Works", label: "工種設定", always: true, panel: "panelWorks" },
  { id: "Earth", label: "土工", chk: "chkWorksEarth", setting: "worksEarthSetting", panel: "panelEarth" },
  { id: "Pave", label: "舗装工", always: true, panel: "panelPave" },
  { id: "Demo", label: "取り壊し工", chk: "chkWorksDemo", setting: "worksDemoSetting", panel: "panelDemo" },
  { id: "Anzen", label: "安全施設工", chk: "chkWorksAnzen", panel: "panelAnzen" },
  { id: "Kari", label: "仮設工", chk: "chkWorksKari", panel: "panelKari" },
  { id: "Zatsu", label: "雑工", chk: "chkWorksZatsu", panel: null },
  { id: "Disclaimer", label: "免責事項", always: true, panel: "panelDisclaimer"}
];

// ▼ タブUI生成＆切り替え
function renderTabs() {
  if(currentSite && allSites[currentSite]) saveWorksChk();
  let tabHtml = '';
  for(const w of worksList) {
    const chkEl = document.getElementById(w.chk);
    if(w.always || (chkEl && chkEl.checked)) {      tabHtml += `<div class="tab" id="tab${w.id}" onclick="showTab('${w.id}')">${w.label}</div>`;
    }
    if(w.setting) {
      const settingDiv = document.getElementById(w.setting);
      if(settingDiv)
        document.getElementById(w.chk).checked ? settingDiv.classList.remove('hidden') : settingDiv.classList.add('hidden');
    }
    if(w.panel && w.chk) {
      document.getElementById(w.panel).classList[document.getElementById(w.chk).checked ? "remove" : "add"]('hidden');
    }
  }
  document.getElementById('tabsArea').innerHTML = tabHtml;
  const firstActive = worksList.find(w => {
    const el = document.getElementById(w.chk);
    return w.always || (el && el.checked);
  });  if(firstActive) showTab(firstActive.id);
  saveAndUpdate();
}
function showTab(tabId) {
  for(const w of worksList) {
    const tabEl = document.getElementById('tab'+w.id);
    if(tabEl) tabEl.classList.remove('active');
    if(w.panel) {
      const panelEl = document.getElementById(w.panel);
      if(panelEl) panelEl.classList.add('hidden');
    }
  }
  const activeTabEl = document.getElementById('tab'+tabId);
  if(activeTabEl) activeTabEl.classList.add('active');  worksList.forEach(w => {
    if(w.id === tabId && w.panel) {
      const panelEl = document.getElementById(w.panel);
      if(panelEl) panelEl.classList.remove('hidden');
    }  });
}

// ▼ データ保存・復元
function saveData() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(allSites)); } catch(e) {}
}
function loadData() {
  try {
    const dat = JSON.parse(localStorage.getItem(LS_KEY));
    if (dat && typeof dat === "object") {
      Object.values(dat).forEach(s => {
        if(!s.kari) s.kari = { traffic_b: 0, temp_signal: 0, machine_transport: 0 };
        if(!s.curb) s.curb = { use: false, std: 0, small: 0, hand: 0 };
        if(!s.works) s.works = { earth: false, demo: false, anzen: false, kari: false, zatsu: false };
        if(!s.demoSetting) s.demoSetting = { same: true, type: 'As', thick: 0, cutting: 0 };
        else if(s.demoSetting.cutting === undefined) s.demoSetting.cutting = 0;
      });
        allSites = dat;
      // サイトリスト描画
      const siteList = Object.keys(allSites);
      if (siteList.length) {
        currentSite = siteList[0];
        let opt = '';
        for (const s of siteList) opt += `<option>${s}</option>`;
        document.getElementById('siteList').innerHTML = opt;
        document.getElementById('siteList').value = currentSite;
      }
    }
  } catch(e){}
}

// ▼ バックアップ・インポート
function backupData() {
  const blob = new Blob([JSON.stringify(allSites)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'pave_backup.json';
  a.click();
}
function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const dat = JSON.parse(ev.target.result);
      if (dat && typeof dat === 'object') {
        allSites = dat;
        const siteList = Object.keys(allSites);
        if (siteList.length) {
          currentSite = siteList[0];
          let opt = '';
          for (const s of siteList) opt += `<option>${s}</option>`;
          document.getElementById('siteList').innerHTML = opt;
          document.getElementById('siteList').value = currentSite;
        }
        renderAllAndSave();
      } else {
        alert('読み込み失敗');
      }
    } catch (err) {
      alert('読み込み失敗');
    }
    e.target.value = '';
  };
  reader.readAsText(file);
}
function renderAllAndSave() {
  renderAll();
  saveData();
}
function addSite() {
  const name = document.getElementById('siteName').value.trim();
  if (!name || allSites[name]) return;
  saveAndUpdate();
  allSites[name] = {
    pave: [],
    earth: [],
    demo: [],
    anzen: { line_outer: 0, line_stop: 0, line_symbol: 0 },
    kari: { traffic_b: 0, temp_signal: 0, machine_transport: 0 },
    curb: { use: false, std: 0, small: 0, hand: 0 },
    works: { earth: false, demo: false, anzen: false, kari: false, zatsu: false },
    earthSetting: { same: true, type: '標準掘削', thick: 0 },
    demoSetting: { same: true, type: 'As', thick: 0, cutting: 0 }
  };
  document.getElementById('siteList').innerHTML += `<option>${name}</option>`;
  document.getElementById('siteList').value = name;
  currentSite = name;
  renderEarthSetting();
  renderDemoSetting();
  renderWorksChk();
  renderTabs();
  renderAllAndSave();
}
function switchSite() {
  saveAndUpdate();
  currentSite = document.getElementById('siteList').value;
  renderEarthSetting();
  renderDemoSetting();
  renderWorksChk();
  renderTabs();
  renderAllAndSave();
}

// ▼ 各工種設定値を工種設定タブから取得
function getEarthSetting() {
  return {
    same: document.getElementById('earthSamePave').checked,
    type: document.getElementById('earthType').value,
    thick: parseFloat(document.getElementById('earthThick').value)||0
  };
}
function getDemoSetting() {
  return {
    same: document.getElementById('demoSamePave').checked,
    type: document.getElementById('demoType').value,
    thick: parseFloat(document.getElementById('demoThick').value)||0,
    cutting: parseFloat(document.getElementById('demoCutting').value)||0  };
}

// ▼ 舗装工タブ
function addRow(type) {
  if (!currentSite) return;
  if(type === 'pave') {
    allSites[currentSite].pave.push({
      種別:"アスファルト", 測点:'', 単距:'', 追距:'', 幅員:'', 平均幅員:'', 面積:''
    });
   } else if (type === 'earth' || type === 'demo') {
    allSites[currentSite][type].push({測点:'', 単距:'', 追距:'', 幅員:'', 面積:''});
  }
  renderAllAndSave();
}
function editRow(type, idx, key, val, update = false) {
  if (type === "pave" && key === "種別") {
    for (let i = idx; i < allSites[currentSite][type].length; i++) {
      allSites[currentSite][type][i][key] = val;
    }
  } else {
    allSites[currentSite][type][idx][key] = val;
  }
  // 入力中は再描画しない！
  if (update) renderAllAndSave();
}
function editAnzen(key, val, update = false) {  if (!currentSite) return;
  if (!allSites[currentSite].anzen) {
    allSites[currentSite].anzen = { line_outer: 0, line_stop: 0, line_symbol: 0 };
  }
  allSites[currentSite].anzen[key] = parseFloat(val) || 0;
  if(update) renderAllAndSave();
}
function editKari(key, val, update = false) {
  if (!currentSite) return;
  if (!allSites[currentSite].kari) {
    allSites[currentSite].kari = { traffic_b: 0, temp_signal: 0, machine_transport: 0 };
  }
  allSites[currentSite].kari[key] = parseFloat(val) || 0;
  if(update) renderAllAndSave();
}
function toggleCurbInputs() {
  if(!currentSite) return;
  const use = document.getElementById('chkCurbUse').checked;
  const area = document.getElementById('curbInputs');
  if(use) area.classList.remove('hidden');
  else area.classList.add('hidden');
  if(!allSites[currentSite].curb) {
    allSites[currentSite].curb = { use: false, std: 0, small: 0, hand: 0 };
  }
  allSites[currentSite].curb.use = use;
  renderAllAndSave();
}
function editCurb(key, val, update = false) {
  if(!currentSite) return;
  if(!allSites[currentSite].curb) {
    allSites[currentSite].curb = { use: false, std: 0, small: 0, hand: 0 };
  }
  allSites[currentSite].curb[key] = parseFloat(val) || 0;
  if(update) renderAllAndSave();
}
function renderTablePave() {
  if(!currentSite) return;
  const list = allSites[currentSite].pave;
  let widthSum = 0, cnt = 0;
  list.forEach(r => {
    const w = parseFloat(r.幅員);
    if (!isNaN(w)) {
      widthSum += w;
      cnt++;
    }
  });
  let avgW = cnt ? widthSum / cnt : 0;
  let label = "";
  if (avgW < 1.4) label = "1.4未満";
  else if (avgW < 3.0) label = "1.4以上";
  else label = "3.0以上";
  for(let i=0;i<list.length;i++) {
    let r = list[i];
    r.追距 = (i===0) ? (parseFloat(r.単距)||0)
      : ((parseFloat(list[i-1].追距)||0)+(parseFloat(r.単距)||0));
    r.平均幅員 = label;
    r._平均幅員値 = avgW;
    if (i === 0) {
      r.面積 = (r.単距 && r.幅員) ? (parseFloat(r.単距)*parseFloat(r.幅員)).toFixed(2) : '';
    } else {
      let 上幅員 = parseFloat(list[i-1].幅員)||0;
      let 幅員 = parseFloat(r.幅員)||0;
      let 単距 = parseFloat(r.単距)||0;
      if (幅員 > 0 && 上幅員 > 0 && 単距 > 0) {
        r.面積 = (((幅員 + 上幅員)/2)*単距).toFixed(2);
      } else {
        r.面積 = '';
      }
    }
  }
  let tbody = '';
  list.forEach((r,idx)=>{
    tbody += `<tr>
      <td>
        <select class="pave-type" onchange="editRow('pave',${idx},'種別',this.value,true)">
          ${paveTypes.map(tp=>`<option value="${tp}"${r.種別===tp?' selected':''}>${tp}</option>`).join('')}
        </select>
      </td>
      <td><input value="${r.測点||''}" oninput="editRow('pave',${idx},'測点',this.value)" onblur="editRow('pave',${idx},'測点',this.value,true)" onkeydown="if(event.key==='Enter') this.blur();"></td>
      <td><input value="${r.単距||''}" oninput="editRow('pave',${idx},'単距',this.value)" onblur="editRow('pave',${idx},'単距',this.value,true)" onkeydown="if(event.key==='Enter') this.blur();"></td>
      <td><input value="${r.追距||''}" class="readonly" readonly></td>
      <td><input value="${r.幅員||''}" oninput="editRow('pave',${idx},'幅員',this.value)" onblur="editRow('pave',${idx},'幅員',this.value,true)" onkeydown="if(event.key==='Enter') this.blur();"></td>      <td><input value="${r.平均幅員||''}" class="readonly" readonly></td>
      <td><input value="${r.面積||''}" class="readonly" readonly></td>
    </tr>`;
  });
  document.getElementById('tbodyPave').innerHTML = tbody;
  let sum = {アスファルト:0, コンクリート:0, オーバーレイ:0};
  list.forEach(r=>{
    if(!isNaN(parseFloat(r.面積))){
      sum[r.種別] += parseFloat(r.面積);
    }
  });
  document.getElementById('sumPave').innerHTML =
    `<table class="ss-table">
      <tr>
        <th>現場名</th>
        <th>アスファルト合計</th>
        <th>コンクリート合計</th>
        <th>オーバーレイ合計</th>
      </tr>
      <tr>
        <td>${currentSite}</td>
        <td>${sum.アスファルト.toFixed(2)}</td>
        <td>${sum.コンクリート.toFixed(2)}</td>
        <td>${sum.オーバーレイ.toFixed(2)}</td>
      </tr>
    </table>`;
}

function renderTableEarth() {
  if(!currentSite) return;
  const setting = getEarthSetting();
  const table = document.getElementById('earthTable');
  if(setting.same) {
    table.classList.add('hidden');
  } else {
    table.classList.remove('hidden');
  }
  if(setting.same) return;
  const list = allSites[currentSite].earth;
  for(let i=0;i<list.length;i++) {
    let r = list[i];
    r.追距 = (i===0) ? (parseFloat(r.単距)||0)
      : ((parseFloat(list[i-1].追距)||0) + (parseFloat(r.単距)||0));
    if(i===0) {
      r.面積 = (r.単距 && r.幅員) ? (parseFloat(r.単距)*parseFloat(r.幅員)).toFixed(2) : '';
    } else {
      let 上幅員 = parseFloat(list[i-1].幅員)||0;
      let 幅員 = parseFloat(r.幅員)||0;
      let 単距 = parseFloat(r.単距)||0;
      if(幅員>0 && 上幅員>0 && 単距>0) {
        r.面積 = (((幅員 + 上幅員)/2)*単距).toFixed(2);
      } else {
        r.面積 = '';
      }
    }
  }
  let tbody = '';
  list.forEach((r,idx)=>{
    tbody += `<tr>
      <td><input value="${r.測点||''}" oninput="editRow('earth',${idx},'測点',this.value)" onblur="editRow('earth',${idx},'測点',this.value,true)" onkeydown="if(event.key==='Enter') this.blur();"></td>
      <td><input value="${r.単距||''}" oninput="editRow('earth',${idx},'単距',this.value)" onblur="editRow('earth',${idx},'単距',this.value,true)" onkeydown="if(event.key==='Enter') this.blur();"></td>
      <td><input value="${r.追距||''}" class="readonly" readonly></td>
      <td><input value="${r.幅員||''}" oninput="editRow('earth',${idx},'幅員',this.value)" onblur="editRow('earth',${idx},'幅員',this.value,true)" onkeydown="if(event.key==='Enter') this.blur();"></td>
      <td><input value="${r.面積||''}" class="readonly" readonly></td>
    </tr>`;
  });
  document.getElementById('tbodyEarth').innerHTML = tbody;
}

function renderTableDemo() {
  if(!currentSite) return;
  const setting = getDemoSetting();
  const table = document.getElementById('demoTable');
  if(setting.same) {
    table.classList.add('hidden');
  } else {
    table.classList.remove('hidden');
  }
  if(setting.same) return;
  const list = allSites[currentSite].demo;
  for(let i=0;i<list.length;i++) {
    let r = list[i];
    r.追距 = (i===0) ? (parseFloat(r.単距)||0)
      : ((parseFloat(list[i-1].追距)||0) + (parseFloat(r.単距)||0));
    if(i===0) {
      r.面積 = (r.単距 && r.幅員) ? (parseFloat(r.単距)*parseFloat(r.幅員)).toFixed(2) : '';
    } else {
      let 上幅員 = parseFloat(list[i-1].幅員)||0;
      let 幅員 = parseFloat(r.幅員)||0;
      let 単距 = parseFloat(r.単距)||0;
      if(幅員>0 && 上幅員>0 && 単距>0) {
        r.面積 = (((幅員 + 上幅員)/2)*単距).toFixed(2);
      } else {
        r.面積 = '';
      }
    }
  }
  let tbody = '';
  list.forEach((r,idx)=>{
    tbody += `<tr>
      <td><input value="${r.測点||''}" oninput="editRow('demo',${idx},'測点',this.value)" onblur="editRow('demo',${idx},'測点',this.value,true)" onkeydown="if(event.key==='Enter') this.blur();"></td>
      <td><input value="${r.単距||''}" oninput="editRow('demo',${idx},'単距',this.value)" onblur="editRow('demo',${idx},'単距',this.value,true)" onkeydown="if(event.key==='Enter') this.blur();"></td>
      <td><input value="${r.追距||''}" class="readonly" readonly></td>
      <td><input value="${r.幅員||''}" oninput="editRow('demo',${idx},'幅員',this.value)" onblur="editRow('demo',${idx},'幅員',this.value,true)" onkeydown="if(event.key==='Enter') this.blur();"></td>
      <td><input value="${r.面積||''}" class="readonly" readonly></td>
    </tr>`;
  });
  document.getElementById('tbodyDemo').innerHTML = tbody;
}

// ▼ 土工集計
function renderEarthResult() {
  if(!currentSite) return;
  const setting = getEarthSetting();
  const paveSum = (allSites[currentSite].pave||[]).reduce((a,r)=>a+(parseFloat(r.面積)||0),0);
  let html = '';
  if(setting.same) {
    const vol = (paveSum * setting.thick / 100).toFixed(2);
    html = `<div>合計体積：${vol} m³　（面積：${paveSum.toFixed(2)}㎡ × 厚さ：${setting.thick}cm）</div>`;
  } else {
    const list = allSites[currentSite].earth || [];
    const area = list.reduce((a,r)=>a+(parseFloat(r.面積)||0),0);
    const vol = (area * setting.thick / 100).toFixed(2);
    html = `<div>合計体積：${vol} m³　（面積：${area.toFixed(2)}㎡ × 厚さ：${setting.thick}cm）</div>`;  }
  document.getElementById('earthResult').innerHTML = html;
}
// ▼ 取壊し工集計
function renderDemoResult() {
  if(!currentSite) return;
  const setting = getDemoSetting();
  const paveSum = (allSites[currentSite].pave||[]).reduce((a,r)=>a+(parseFloat(r.面積)||0),0);
  let html = '';
  if(setting.same) {
    const vol = (paveSum * setting.thick / 100).toFixed(2);
    html = `<div>合計体積：${vol} m³　（面積：${paveSum.toFixed(2)}㎡ × 厚さ：${setting.thick}cm）</div>`;
  } else {
    const list = allSites[currentSite].demo || [];
    const area = list.reduce((a,r)=>a+(parseFloat(r.面積)||0),0);
    const vol = (area * setting.thick / 100).toFixed(2);
    html = `<div>合計体積：${vol} m³　（面積：${area.toFixed(2)}㎡ × 厚さ：${setting.thick}cm）</div>`;  }
  document.getElementById('demoResult').innerHTML = html;
}

function renderAnzenInputs() {
  if(!currentSite) return;
  const dat = allSites[currentSite].anzen || {};
  document.getElementById('anzenLineOuter').value = dat.line_outer || 0;
  document.getElementById('anzenLineStop').value = dat.line_stop || 0;
  document.getElementById('anzenLineSymbol').value = dat.line_symbol || 0;
}

function renderEarthSetting() {
  if(!currentSite) return;
  const set = allSites[currentSite].earthSetting || { same: true, type: '標準掘削', thick: 0 };
  document.getElementById('earthSamePave').checked = set.same || false;
  document.getElementById('earthType').value = set.type || '標準掘削';
  document.getElementById('earthThick').value = set.thick || 0;
}

function renderDemoSetting() {
  if(!currentSite) return;
  const set = allSites[currentSite].demoSetting || { same: true, type: 'As', thick: 0, cutting: 0 };
  document.getElementById('demoSamePave').checked = set.same || false;
  document.getElementById('demoType').value = set.type || 'As';
  document.getElementById('demoThick').value = set.thick || 0;
  document.getElementById('demoCutting').value = set.cutting || 0;
}
function renderKariInputs() {
  if(!currentSite) return;
  const dat = allSites[currentSite].kari || {};
  document.getElementById('kariTrafficB').value = dat.traffic_b || 0;
  document.getElementById('kariTempSignal').value = dat.temp_signal || 0;
  document.getElementById('kariMachineTrans').value = dat.machine_transport || 0;
}
function renderCurbInputs() {
  if(!currentSite) return;
  const dat = allSites[currentSite].curb || { use: false, std: 0, small: 0, hand: 0 };
  const chk = document.getElementById('chkCurbUse');
  const area = document.getElementById('curbInputs');
  if(chk) chk.checked = dat.use || false;
  if(area) {
    if(chk.checked) area.classList.remove('hidden');
    else area.classList.add('hidden');
  }
  document.getElementById('curbStd').value = dat.std || 0;
  document.getElementById('curbSmall').value = dat.small || 0;
  document.getElementById('curbHand').value = dat.hand || 0;
}

function renderWorksChk() {
  if(!currentSite) return;
  const w = allSites[currentSite].works || { earth:false, demo:false, anzen:false, kari:false, zatsu:false };
  document.getElementById('chkWorksEarth').checked = w.earth || false;
  document.getElementById('chkWorksDemo').checked = w.demo || false;
  document.getElementById('chkWorksAnzen').checked = w.anzen || false;
  document.getElementById('chkWorksKari').checked = w.kari || false;
  document.getElementById('chkWorksZatsu').checked = w.zatsu || false;
}

function saveWorksChk() {
  if(!currentSite) return;
  allSites[currentSite].works = {
    earth: document.getElementById('chkWorksEarth').checked,
    demo: document.getElementById('chkWorksDemo').checked,
    anzen: document.getElementById('chkWorksAnzen').checked,
    kari: document.getElementById('chkWorksKari').checked,
    zatsu: document.getElementById('chkWorksZatsu').checked
  };
}


// ▼ まとめて再描画
function renderAll() {
  renderWorksChk();
  renderEarthSetting();
  renderDemoSetting();
  renderTablePave();
  renderTableEarth();
  renderEarthResult();
  renderTableDemo();
  renderDemoResult();
  renderCurbInputs();
  renderAnzenInputs();
  renderKariInputs();
}

// ▼ DXFエクスポート
function exportDXF() {
  const list = (allSites[currentSite] && allSites[currentSite].pave) || [];
  if (list.length < 2) {
    alert('最低2行以上必要です');
    return;
  }
  let scale = 100;
  let points = [];
  let x = 0;

  // レイヤー名を日本語で
  const LAYER_FRAME   = 'FRAME';
  const LAYER_BASE    = '---';
  const LAYER_WIDTH   = 'W';
  const LAYER_LEN     = 'L';
  const LAYER_STATION = 'No';

  // 1点目
  let width0 = parseFloat((list[0].幅員 + '').replace(/[Ａ-Ｚａ-ｚ０-９＋]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).replace(/[^\d.-]/g, '')) || 0;
  points.push({
    x: 0,
    up: width0 / 2,
    down: -width0 / 2,
    width: width0,
    st: list[0].測点
  });

  // 2点目以降
  for (let i = 1; i < list.length; i++) {
    let len = (list[i].単距 + '').replace(/[Ａ-Ｚａ-ｚ０-９＋]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).replace(/[^\d.-]/g, '');
    let width = (list[i].幅員 + '').replace(/[Ａ-Ｚａ-ｚ０-９＋]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).replace(/[^\d.-]/g, '');
    len = parseFloat(len) || 0;
    width = parseFloat(width) || 0;
    x += len;
    points.push({
      x: x,
      up: width / 2,
      down: -width / 2,
      width: width,
      st: list[i].測点
    });
  }

  let lines = [];
  // 枠線（LAYER_FRAME）
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i], p1 = points[i + 1];
    lines.push(`0\nLINE\n8\n${LAYER_FRAME}\n10\n${p0.x * scale}\n20\n${p0.up * scale}\n11\n${p1.x * scale}\n21\n${p1.up * scale}\n`);
    lines.push(`0\nLINE\n8\n${LAYER_FRAME}\n10\n${p1.x * scale}\n20\n${p1.up * scale}\n11\n${p1.x * scale}\n21\n${p1.down * scale}\n`);
    lines.push(`0\nLINE\n8\n${LAYER_FRAME}\n10\n${p1.x * scale}\n20\n${p1.down * scale}\n11\n${p0.x * scale}\n21\n${p0.down * scale}\n`);
    lines.push(`0\nLINE\n8\n${LAYER_FRAME}\n10\n${p0.x * scale}\n20\n${p0.down * scale}\n11\n${p0.x * scale}\n21\n${p0.up * scale}\n`);
  }

  // 基準線（LAYER_BASE）＆点間距離（LAYER_LEN）
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i], p1 = points[i + 1];
    // 基準線
    lines.push(`0\nLINE\n8\n${LAYER_BASE}\n10\n${p0.x * scale}\n20\n0\n11\n${p1.x * scale}\n21\n0\n`);
    // 点間距離（ラベル：LAYER_LEN、横書き）
    const len = (p1.x - p0.x).toFixed(2);
    lines.push(`0\nTEXT\n8\n${LAYER_LEN}\n10\n${((p0.x + p1.x) / 2) * scale}\n20\n-35\n40\n7\n1\n${len}m\n50\n0\n`);
  }

  // 幅員線・幅員値（LAYER_WIDTH）、測点（LAYER_STATION, 90°時計回り＝-90°）
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    // 幅員線（LAYER_WIDTH）
    lines.push(`0\nLINE\n8\n${LAYER_WIDTH}\n10\n${p.x * scale}\n20\n${p.down * scale}\n11\n${p.x * scale}\n21\n${p.up * scale}\n`);
    // 幅員値（LAYER_WIDTH、-90°：時計回り90度回転）
    lines.push(`0\nTEXT\n8\n${LAYER_WIDTH}\n10\n${p.x * scale}\n20\n${((p.up + p.down) / 2) * scale}\n40\n7\n1\n${p.width.toFixed(2)}m\n50\n-90\n`);
    // 測点名（LAYER_STATION、-90°：時計回り90度回転）
    if (p.st && p.st.trim()) {
      lines.push(`0\nTEXT\n8\n${LAYER_STATION}\n10\n${p.x * scale}\n20\n${(p.up * scale + 30)}\n40\n7\n1\n${p.st}\n50\n-90\n`);
    }
  }

  let dxf = '0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nSECTION\n2\nTABLES\n0\nENDSEC\n0\nSECTION\n2\nBLOCKS\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n'
    + lines.join('')
    + '0\nENDSEC\n0\nEOF\n';

  let safeSiteName = currentSite.replace(/[\\/:*?"<>|]/g, "_");
  let a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([dxf], { type: 'text/plain' }));
  a.download = safeSiteName + ".dxf";
  a.click();
}

// ▼ 全集計（従来形式）
function getSummaryHtml(forExcel = false) {
  const border = forExcel ? "1px" : "2px";
  const tableStyle = `min-width:1200px;border-collapse:collapse;border:${border} solid #555;background:#fff;width:auto;`;
  const thStyle1 = `border:${border} solid #555;background:#e6eef5;color:#007acc;font-weight:bold;text-align:center;padding:8px 5px;`;
  const thStyle2 = `border:${border} solid #555;background:#f7fbff;color:#007acc;font-weight:bold;text-align:center;padding:5px 5px;`;
  const tdStyle = `border:${border} solid #555;text-align:center;padding:6px 5px;`;
  const tdStyleFirst = tdStyle + "border-bottom:none;";
  const tdStyleSecond = tdStyle + "border-top:none;";
  const dataCols = [
    "site",
    "machine_excavation", "residual_soil",
    "cutting", "break_as", "haizan_unpan_as", "haizan_shori_as",
    "break_con", "haizan_unpan_con", "haizan_shori_con",
    "as_lt1_4", "as_ge1_4", "as_ge3_0",
    "base_course",
    "ovl_lt1_4", "ovl_ge1_4", "ovl_ge3_0",
    "con_total",
    "curb_std", "curb_small", "curb_hand",
    "line_outer", "line_stop", "line_symbol",
    "traffic_b", "temp_signal", "machine_transport"  ];
  let html = `<div style="overflow-x:auto;"><table class="ss-table" style="${tableStyle}">`;
  html += `
<tr>
    <th rowspan="3" style="${thStyle1}">箇所名</th>
    <th colspan="2" style="${thStyle1}">土工</th>
    <th colspan="6" style="${thStyle1}">取壊工</th>
    <th colspan="12" style="${thStyle1}">舗装工</th>
    <th colspan="3" style="${thStyle1}">安全施設工</th>
    <th colspan="3" style="${thStyle1}">仮設工</th>
    <th colspan="3" style="${thStyle1}">雑工</th>
  </tr>
  <tr>
    <th rowspan="2" style="${thStyle2}">機械掘削</th>
    <th rowspan="2" style="${thStyle2}">残土処理</th>
    <th rowspan="2" style="${thStyle2}">舗装版切断</th>
    <th rowspan="2" style="${thStyle2}">舗装版破砕As</th>
    <th rowspan="2" style="${thStyle2}">廃材運搬As</th>
    <th rowspan="2" style="${thStyle2}">廃材処理As</th>
    <th rowspan="2" style="${thStyle2}">舗装版破砕Con</th>
    <th rowspan="2" style="${thStyle2}">廃材運搬Con</th>
    <th rowspan="2" style="${thStyle2}">廃材処理Con</th>
    <th colspan="3" style="${thStyle2}">アスファルト</th>
    <th rowspan="2" style="${thStyle2}">上層路盤工</th>
    <th colspan="3" style="${thStyle2}">オーバーレイ</th>
    <th rowspan="2" style="${thStyle2}">コンクリート</th>
    <th colspan="3" style="${thStyle2}">アスカーブ</th>
    <th colspan="3" style="${thStyle2}">区画線設置</th>
    <th rowspan="2" style="${thStyle2}">交通誘導員B</th>
    <th rowspan="2" style="${thStyle2}">仮設信号機</th>
    <th rowspan="2" style="${thStyle2}">重機運搬費</th>
  </tr>
  <tr>
    <th style="${thStyle2}">t=4cm<br>1.4未満</th>
    <th style="${thStyle2}">t=4cm<br>1.4以上</th>
    <th style="${thStyle2}">t=4cm<br>3.0以上</th>
    <th style="${thStyle2}">t=4cm<br>1.4未満</th>
    <th style="${thStyle2}">t=4cm<br>1.4以上</th>
    <th style="${thStyle2}">t=4cm<br>3.0以上</th>
    <th style="${thStyle2}">標準</th>
    <th style="${thStyle2}">小型</th>
    <th style="${thStyle2}">手盛</th>
    <th style="${thStyle2}">外側線</th>
    <th style="${thStyle2}">停止線</th>
    <th style="${thStyle2}">文字記号</th>
  </tr>`;

  let totalRow = {};
  dataCols.forEach(k => totalRow[k] = 0);
  totalRow.site = "総合計";

  Object.keys(allSites).forEach(site => {
    let row = {};
    row.site = site;

    let machine_excavation = 0, residual_soil = 0;
    let earthSetting = allSites[site].earthSetting || {};
    let paveSum = 0;
    (allSites[site].pave||[]).forEach(r=>paveSum+=parseFloat(r.面積)||0);
    if (allSites[site].works && allSites[site].works.earth) {
      let thick = parseFloat(earthSetting.thick) || 0;
      machine_excavation = residual_soil = paveSum * thick / 100;
    }
    row.machine_excavation = machine_excavation > 0 ? machine_excavation.toFixed(2) : "";
    row.residual_soil = residual_soil > 0 ? residual_soil.toFixed(2) : "";

    let cutting = 0, break_as = 0, break_con = 0;
    let haizan_unpan_as = 0, haizan_shori_as = 0, haizan_unpan_con = 0, haizan_shori_con = 0;
    let demoSetting = allSites[site].demoSetting || {};
    let demoType = demoSetting.type;
    let demoThick = parseFloat(demoSetting.thick)||0;
    if (allSites[site].works && allSites[site].works.demo) {
      cutting = parseFloat(demoSetting.cutting) || 0;
      let areaDemo = demoSetting.same ? paveSum : (allSites[site].demo || []).reduce((a, r) => a + (parseFloat(r.面積) || 0), 0);
      if (demoType === "As") {
        break_as = areaDemo;
      } else if (demoType === "Con") {
        break_con = areaDemo;
      } else if (demoType === "As+Con") {
        break_as = areaDemo;
        break_con = areaDemo;
      }
      haizan_unpan_as = break_as * demoThick / 100;
      haizan_shori_as = haizan_unpan_as * 2.35;
      haizan_unpan_con = break_con * demoThick / 100;
      haizan_shori_con = haizan_unpan_con * 2.35;
    }
    row.cutting = cutting > 0 ? cutting.toFixed(1) : "";
    row.break_as = break_as > 0 ? break_as.toFixed(1) : "";
    row.haizan_unpan_as = haizan_unpan_as > 0 ? haizan_unpan_as.toFixed(2) : "";
    row.haizan_shori_as = haizan_shori_as > 0 ? haizan_shori_as.toFixed(2) : "";
    row.break_con = break_con > 0 ? break_con.toFixed(1) : "";
    row.haizan_unpan_con = haizan_unpan_con > 0 ? haizan_unpan_con.toFixed(2) : "";
    row.haizan_shori_con = haizan_shori_con > 0 ? haizan_shori_con.toFixed(2) : "";

    let as_lt1_4 = 0, as_ge1_4 = 0, as_ge3_0 = 0,
        ovl_lt1_4 = 0, ovl_ge1_4 = 0, ovl_ge3_0 = 0, con_total = 0;

    (allSites[site].pave || []).forEach(r => {
      let area = parseFloat(r.面積) || 0;
      if (r.種別 === "アスファルト") {
        if (r.平均幅員 === "1.4未満") as_lt1_4 += area;
        else if (r.平均幅員 === "1.4以上") as_ge1_4 += area;
        else if (r.平均幅員 === "3.0以上") as_ge3_0 += area;
      } else if (r.種別 === "オーバーレイ") {
        if (r.平均幅員 === "1.4未満") ovl_lt1_4 += area;
        else if (r.平均幅員 === "1.4以上") ovl_ge1_4 += area;
        else if (r.平均幅員 === "3.0以上") ovl_ge3_0 += area;
      } else if (r.種別 === "コンクリート") {
        con_total += area;
      }
    });
    row.as_lt1_4 = as_lt1_4 > 0 ? as_lt1_4.toFixed(1) : "";
    row.as_ge1_4 = as_ge1_4 > 0 ? as_ge1_4.toFixed(1) : "";
    row.as_ge3_0 = as_ge3_0 > 0 ? as_ge3_0.toFixed(1) : "";
    row.base_course = "";
    row.ovl_lt1_4 = ovl_lt1_4 > 0 ? ovl_lt1_4.toFixed(1) : "";
    row.ovl_ge1_4 = ovl_ge1_4 > 0 ? ovl_ge1_4.toFixed(1) : "";
    row.ovl_ge3_0 = ovl_ge3_0 > 0 ? ovl_ge3_0.toFixed(1) : "";
    row.con_total = con_total > 0 ? con_total.toFixed(1) : "";
    const curb = allSites[site].curb || {};
    row.curb_std = (curb.use && curb.std > 0) ? curb.std : "";
    row.curb_small = (curb.use && curb.small > 0) ? curb.small : "";
    row.curb_hand = (curb.use && curb.hand > 0) ? curb.hand : "";
    const anzen = allSites[site].anzen || {};
    row.line_outer = anzen.line_outer || "";
    row.line_stop = anzen.line_stop || "";
    row.line_symbol = anzen.line_symbol || "";
    row.traffic_b = "";
    row.temp_signal = "";
    row.machine_transport = "";
    const kari = allSites[site].kari || {};
    row.traffic_b = kari.traffic_b || "";
    row.temp_signal = kari.temp_signal || "";
    row.machine_transport = kari.machine_transport || "";

    dataCols.forEach(k => {
      if (k !== "site") totalRow[k] += parseFloat(row[k]) || 0;
    });

    if (forExcel) {
      html += `<tr>${dataCols.map(k => `<td style="${tdStyleFirst}"></td>`).join("")}</tr>`;
      html += `<tr>${dataCols.map(k => `<td style="${tdStyleSecond}">${row[k] || ""}</td>`).join("")}</tr>`;
    } else {
      html += `<tr>${dataCols.map(k => `<td style="${tdStyle}">${row[k] || ""}</td>`).join("")}</tr>`;
    }
  });

  html += `<tr style="background:#f3f9ff;font-weight:bold;">${
    dataCols.map(k =>
      `<td style="${tdStyle}">${k==="site" ? "総合計" : (totalRow[k] ? totalRow[k].toFixed(2) : "")}</td>`
    ).join("")
  }</tr>`;
  html += '</table></div>';
  return html;
}

function showSummary() {
  document.getElementById('summary').innerHTML = getSummaryHtml(false);}

// ▼ 集計表をExcel形式でダウンロード
function exportSummaryExcel() {
  showSummary();
  const html = '<html><head><meta charset="UTF-8"></head><body>' +
               getSummaryHtml(true) +
               '</body></html>';
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'summary.xls';
  a.click();
}

function getQuantityHtml() {
  const border = '1px';
  const tableStyle = `min-width:1200px;border-collapse:collapse;border:${border} solid #555;background:#fff;width:auto;`;
  const thStyle = `border:${border} solid #555;background:#e6eef5;color:#007acc;font-weight:bold;text-align:center;padding:8px 5px;`;
  const tdStyle = `border:${border} solid #555;text-align:center;padding:6px 5px;`;
  const catStyle = `border:${border} solid #555;background:#f3f3f3;font-weight:bold;text-align:left;padding:6px 5px;`;

  let html = `<table class="ss-table" style="${tableStyle}">`;
  html += `<tr><th style="${thStyle}">箇所名</th><th style="${thStyle}">工種</th><th style="${thStyle}">規格</th><th style="${thStyle}">計算式</th><th style="${thStyle}">単位</th><th style="${thStyle}">数量</th></tr>`;

  const addRow = (site, work, spec, formula, unit, qty) => {
    html += `<tr><td style="${tdStyle}">${site}</td><td style="${tdStyle}">${work}</td><td style="${tdStyle}">${spec}</td><td style="${tdStyle}">${formula}</td><td style="${tdStyle}">${unit}</td><td style="${tdStyle}">${qty}</td></tr>`;
  };
  
  const addCatRow = (site, label) => {
    html += `<tr><td style="${tdStyle}">${site}</td><td style="${catStyle}" colspan="5">${label}</td></tr>`;
  };

  Object.keys(allSites).forEach(site => {
    const dat = allSites[site] || {};
    let first = true;
    const getSite = () => { const s = first ? site : ''; first = false; return s; };
    const row = (w,spec,f,u,q) => addRow(getSite(), w, spec, f, u, q);
    const cat = label => addCatRow(getSite(), label);
    
    let paveSum = 0;
    (dat.pave || []).forEach(r => paveSum += parseFloat(r.面積) || 0);

    if(dat.works && dat.works.earth) {
      const set = dat.earthSetting || {};
      const thick = parseFloat(set.thick) || 0;
      const vol = paveSum * thick / 100;
      if(vol > 0) {
        const formula = `${paveSum.toFixed(1)}×(${thick}/100)`;
        cat('土工');
        row('機械掘削', set.type || '', formula, 'm³', vol.toFixed(2));
        row('残土処理', set.type || '', formula, 'm³', vol.toFixed(2));
      }
    }

    if(dat.works && dat.works.demo) {
      const set = dat.demoSetting || {};
      const demoType = set.type;
      const thick = parseFloat(set.thick) || 0;
      const areaDemo = set.same ? paveSum : (dat.demo || []).reduce((a,r)=>a+(parseFloat(r.面積)||0),0);
      const cutting = parseFloat(set.cutting)||0;

      let break_as=0, break_con=0;
      if(demoType==='As') break_as = areaDemo;
      else if(demoType==='Con') break_con = areaDemo;
      else if(demoType==='As+Con') { break_as = areaDemo; break_con = areaDemo; }

      if(cutting>0 || break_as>0 || break_con>0) {
        cat('取り壊し工');
        if(cutting>0) row('舗装版切断','',`${cutting}`, 'm', cutting.toFixed(1));
        if(break_as>0) {
          row('舗装版破砕','As',`${areaDemo.toFixed(1)}`,'m²',break_as.toFixed(1));
          const unpan = break_as * thick / 100;
          row('廃材運搬','As',`${break_as.toFixed(1)}×(${thick}/100)`,'m³',unpan.toFixed(2));
          row('廃材処理','As',`${unpan.toFixed(2)}×2.35`,'t',(unpan*2.35).toFixed(2));
        }
        if(break_con>0) {
          row('舗装版破砕','Con',`${areaDemo.toFixed(1)}`,'m²',break_con.toFixed(1));
          const unpan = break_con * thick / 100;
          row('廃材運搬','Con',`${break_con.toFixed(1)}×(${thick}/100)`,'m³',unpan.toFixed(2));
          row('廃材処理','Con',`${unpan.toFixed(2)}×2.35`,'t',(unpan*2.35).toFixed(2));
        }
      }
    }

    let as_lt1_4 = 0, as_ge1_4 = 0, as_ge3_0 = 0,
        ovl_lt1_4 = 0, ovl_ge1_4 = 0, ovl_ge3_0 = 0, con_total = 0;

    (dat.pave || []).forEach(r => {
      const area = parseFloat(r.面積) || 0;
      if (r.種別 === 'アスファルト') {
        if (r.平均幅員 === '1.4未満') as_lt1_4 += area;
        else if (r.平均幅員 === '1.4以上') as_ge1_4 += area;
        else if (r.平均幅員 === '3.0以上') as_ge3_0 += area;
      } else if (r.種別 === 'オーバーレイ') {
        if (r.平均幅員 === '1.4未満') ovl_lt1_4 += area;
        else if (r.平均幅員 === '1.4以上') ovl_ge1_4 += area;
        else if (r.平均幅員 === '3.0以上') ovl_ge3_0 += area;
      } else if (r.種別 === 'コンクリート') {
        con_total += area;
      }
    });

    const paveRows = [];
    if(as_lt1_4>0) paveRows.push(['アスファルト','t=4cm 1.4未満','', 'm²', as_lt1_4.toFixed(1)]);
    if(as_ge1_4>0) paveRows.push(['アスファルト','t=4cm 1.4以上','', 'm²', as_ge1_4.toFixed(1)]);
    if(as_ge3_0>0) paveRows.push(['アスファルト','t=4cm 3.0以上','', 'm²', as_ge3_0.toFixed(1)]);
    if(ovl_lt1_4>0) paveRows.push(['オーバーレイ','t=4cm 1.4未満','', 'm²', ovl_lt1_4.toFixed(1)]);
    if(ovl_ge1_4>0) paveRows.push(['オーバーレイ','t=4cm 1.4以上','', 'm²', ovl_ge1_4.toFixed(1)]);
    if(ovl_ge3_0>0) paveRows.push(['オーバーレイ','t=4cm 3.0以上','', 'm²', ovl_ge3_0.toFixed(1)]);
    if(con_total>0) paveRows.push(['コンクリート','', '', 'm²', con_total.toFixed(1)]);

    const curb = dat.curb || {};
    if(curb.use) {
      if(curb.std>0) paveRows.push(['アスカーブ','標準','', 'm', curb.std]);
      if(curb.small>0) paveRows.push(['アスカーブ','小型','', 'm', curb.small]);
      if(curb.hand>0) paveRows.push(['アスカーブ','手盛','', 'm', curb.hand]);
    }

    if(paveRows.length>0) {
      cat('舗装工');
      paveRows.forEach(r => row(...r));
    }

    const anzen = dat.anzen || {};
    const anzenRows = [];
    if(anzen.line_outer>0) anzenRows.push(['区画線設置','外側線','', 'm', anzen.line_outer]);
    if(anzen.line_stop>0) anzenRows.push(['区画線設置','停止線','', 'm', anzen.line_stop]);
    if(anzen.line_symbol>0) anzenRows.push(['区画線設置','文字記号','', 'm²', anzen.line_symbol]);
    if(anzenRows.length>0) {
      cat('安全施設工');
      anzenRows.forEach(r => row(...r));
    }

    const kari = dat.kari || {};
    const kariRows = [];
    if(kari.traffic_b>0) kariRows.push(['仮設工','交通誘導員B','', '人日', kari.traffic_b]);
    if(kari.temp_signal>0) kariRows.push(['仮設工','仮設信号機','', '基', kari.temp_signal]);
    if(kari.machine_transport>0) kariRows.push(['仮設工','重機運搬費','', '式', kari.machine_transport]);
    if(kariRows.length>0) {
      cat('仮設工');
      kariRows.forEach(r => row(...r));
    }
  });
  html += '</table>';
  return html;
}

function exportQuantityExcel() {
  const html = '<html><head><meta charset="UTF-8"></head><body>' +
               getQuantityHtml() +
               '</body></html>';
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const a = document.createElement('a');
  const now = new Date();
  const ymd = now.getFullYear() +
              ('0'+(now.getMonth()+1)).slice(-2) +
              ('0'+now.getDate()).slice(-2);
  a.href = URL.createObjectURL(blob);
  a.download = `数量計算書_${ymd}.xls`;
  a.click();
}

// ▼ 設定保存＋再描画
function saveAndUpdate(update = true) {
  if(currentSite && allSites[currentSite]) {
    allSites[currentSite].earthSetting = getEarthSetting();
    allSites[currentSite].demoSetting = getDemoSetting();
  }
  if(update) renderAllAndSave();
}

window.addEventListener('DOMContentLoaded', () => {
  loadData();
  renderAll();
  renderTabs();
});
