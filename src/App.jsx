import { useState, useEffect, useRef } from "react";

const PRIORITIES = {
  high:   { label: "High",   color: "#ef4444", bg: "#2a1515", dot: "#ef4444" },
  medium: { label: "Medium", color: "#f59e0b", bg: "#2a2010", dot: "#f59e0b" },
  low:    { label: "Low",    color: "#10b981", bg: "#0f2a1e", dot: "#10b981" },
};
const CATEGORIES = ["Work", "Personal", "Health", "Learning", "Finance", "Other"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function formatDate(key) {
  const [y,m,d] = key.split('-');
  const date = new Date(+y, +m-1, +d);
  return { day: DAYS[date.getDay()], date: d, month: MONTHS[date.getMonth()].slice(0,3), monthFull: MONTHS[date.getMonth()], full: date };
}
function getWeekDays() {
  const today = new Date(); today.setHours(0,0,0,0);
  return Array.from({length:7}, (_,i) => {
    const d = new Date(today); d.setDate(today.getDate() - today.getDay() + i);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });
}

// ── Storage bridge (works in both Electron and browser) ───────────────────
const store = {
  async get(key) {
    try { return await window.storage.get(key); } catch { return null; }
  },
  async set(key, value) {
    try { return await window.storage.set(key, value); } catch { return null; }
  }
};

export default function App() {
  const [tasks,       setTasks]       = useState({});
  const [selectedDay, setSelectedDay] = useState(getTodayKey());
  const [showForm,    setShowForm]    = useState(false);
  const [editTask,    setEditTask]    = useState(null);
  const [filter,      setFilter]      = useState("all");
  const [search,      setSearch]      = useState("");
  const [loaded,      setLoaded]      = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [view,        setView]        = useState("day");
  const [autoLaunch,  setAutoLaunch]  = useState(false);
  const [showSettings,setShowSettings]= useState(false);
  const [time,        setTime]        = useState(new Date());
  const weekDays = getWeekDays();
  const todayKey = getTodayKey();

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Load data
  useEffect(() => {
    async function load() {
      const r = await store.get("tasks-data");
      if (r?.value) { try { setTasks(JSON.parse(r.value)); } catch {} }
      if (isElectron) {
        const al = await window.electronAPI.getAutoLaunch();
        setAutoLaunch(al);
      }
      setLoaded(true);
    }
    load();
  }, []);

  async function save(newTasks) {
    setTasks(newTasks);
    setSaving(true);
    await store.set("tasks-data", JSON.stringify(newTasks));
    setTimeout(() => setSaving(false), 500);
  }

  async function toggleAutoLaunch() {
    if (!isElectron) return;
    const next = !autoLaunch;
    await window.electronAPI.setAutoLaunch(next);
    setAutoLaunch(next);
  }

  function dayTasks(key) { return tasks[key] || []; }

  function addTask(task) {
    const key = task.date;
    save({ ...tasks, [key]: [...(tasks[key]||[]), { ...task, id: genId(), done: false, createdAt: Date.now() }] });
    setShowForm(false);
  }
  function updateTask(updated) {
    save({ ...tasks, [updated.date]: (tasks[updated.date]||[]).map(t => t.id===updated.id ? updated : t) });
    setEditTask(null); setShowForm(false);
  }
  function toggleDone(dateKey, taskId) {
    save({ ...tasks, [dateKey]: (tasks[dateKey]||[]).map(t => t.id===taskId ? {...t, done:!t.done, doneAt:!t.done?Date.now():null} : t) });
  }
  function deleteTask(dateKey, taskId) {
    save({ ...tasks, [dateKey]: (tasks[dateKey]||[]).filter(t => t.id!==taskId) });
  }

  const currentTasks = dayTasks(selectedDay)
    .filter(t => filter==="done" ? t.done : filter==="pending" ? !t.done : true)
    .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()) || (t.notes||"").toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => { const o={high:0,medium:1,low:2}; return (o[a.priority]||1)-(o[b.priority]||1); });

  const allDayTasks = dayTasks(selectedDay);
  const stats = { total: allDayTasks.length, done: allDayTasks.filter(t=>t.done).length };
  stats.pct = stats.total ? Math.round(stats.done/stats.total*100) : 0;

  const { day, monthFull, date: dateNum } = formatDate(selectedDay);
  const clockStr = time.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' });

  if (!loaded) return (
    <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0f0f14",flexDirection:"column",gap:12,fontFamily:"'DM Mono',monospace"}}>
      <div style={{width:40,height:40,border:"2px solid #6366f1",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <div style={{color:"#6366f1",fontSize:11,letterSpacing:3}}>LOADING</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",background:"#0f0f14",fontFamily:"'DM Sans',sans-serif",color:"#e2e8f0",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:#0f0f14}::-webkit-scrollbar-thumb{background:#2d2d45;border-radius:2px}
        .task-row{transition:background 0.15s}.task-row:hover{background:#16161f!important}
        .day-pill{transition:all 0.2s;cursor:pointer}.day-pill:hover{transform:translateY(-2px)}
        .btn-glow{transition:all 0.15s}.btn-glow:hover{box-shadow:0 0 20px rgba(99,102,241,0.5);transform:translateY(-1px)}
        .icon-btn{transition:all 0.15s;opacity:0.4;cursor:pointer}.icon-btn:hover{opacity:1;transform:scale(1.15)}
        .check-box{transition:all 0.2s;cursor:pointer}.check-box:hover{transform:scale(1.1)}
        input,textarea,select{outline:none;font-family:'DM Sans',sans-serif;}
        .fade-in{animation:fadeIn 0.25s ease}@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .progress-fill{transition:width 0.6s cubic-bezier(.4,0,.2,1)}
        .pulse{animation:pulseAnim 1.5s ease infinite}@keyframes pulseAnim{0%,100%{opacity:1}50%{opacity:0.4}}
        .titlebar-drag{-webkit-app-region:drag}
        .titlebar-btn{-webkit-app-region:no-drag}
        .glow-dot{animation:glowDot 2s ease infinite}@keyframes glowDot{0%,100%{box-shadow:0 0 4px #6366f1}50%{box-shadow:0 0 12px #6366f1,0 0 24px #6366f1}}
        .modal-overlay{animation:fadeOverlay 0.2s ease}@keyframes fadeOverlay{from{opacity:0}to{opacity:1}}
        button:focus{outline:none}
      `}</style>

      {/* ── Custom Titlebar ──────────────────────────────────────── */}
      <div className="titlebar-drag" style={{height:40,background:"#0a0a10",borderBottom:"1px solid #1a1a28",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 12px 0 16px",flexShrink:0,userSelect:"none"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div className="glow-dot" style={{width:8,height:8,background:"#6366f1",borderRadius:"50%"}}/>
          <span style={{fontSize:12,fontWeight:700,color:"#6366f1",letterSpacing:2,fontFamily:"'DM Mono',monospace"}}>DAYSTACK</span>
          {saving && <span className="pulse" style={{fontSize:9,color:"#6366f1",letterSpacing:2,marginLeft:4}}>SAVING</span>}
        </div>

        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#334155"}}>{clockStr}</span>
          {isElectron && (
            <div className="titlebar-btn" style={{display:"flex",gap:4}}>
              <WinBtn color="#f59e0b" title="Minimize" onClick={() => window.electronAPI.minimize()}>─</WinBtn>
              <WinBtn color="#6366f1" title="Maximize" onClick={() => window.electronAPI.maximize()}>▢</WinBtn>
              <WinBtn color="#ef4444" title="Hide to tray" onClick={() => window.electronAPI.hide()}>×</WinBtn>
            </div>
          )}
        </div>
      </div>

      {/* ── Main layout ──────────────────────────────────────────── */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>

        {/* Sidebar */}
        <div style={{width:220,background:"#0a0a10",borderRight:"1px solid #1a1a28",display:"flex",flexDirection:"column",padding:"16px 0",flexShrink:0}}>
          {/* Today summary */}
          <div style={{padding:"0 16px 16px",borderBottom:"1px solid #1a1a28",marginBottom:8}}>
            <div style={{fontSize:10,fontWeight:600,color:"#334155",letterSpacing:2,marginBottom:6}}>TODAY</div>
            <div style={{fontSize:22,fontWeight:700,color:"#f1f5f9",lineHeight:1}}>{day}, {monthFull.slice(0,3)} {formatDate(todayKey).date}</div>
            {dayTasks(todayKey).length > 0 && (
              <div style={{marginTop:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:10,color:"#475569"}}>{dayTasks(todayKey).filter(t=>t.done).length}/{dayTasks(todayKey).length} tasks</span>
                  <span style={{fontSize:10,color:"#6366f1"}}>{Math.round(dayTasks(todayKey).filter(t=>t.done).length/dayTasks(todayKey).length*100)}%</span>
                </div>
                <div style={{height:3,background:"#1a1a28",borderRadius:4,overflow:"hidden"}}>
                  <div className="progress-fill" style={{height:"100%",background:"linear-gradient(90deg,#6366f1,#8b5cf6)",borderRadius:4,width:`${Math.round(dayTasks(todayKey).filter(t=>t.done).length/dayTasks(todayKey).length*100)}%`}}/>
                </div>
              </div>
            )}
          </div>

          {/* Week nav */}
          <div style={{padding:"0 16px 12px",borderBottom:"1px solid #1a1a28",marginBottom:8}}>
            <div style={{fontSize:10,fontWeight:600,color:"#334155",letterSpacing:2,marginBottom:8}}>THIS WEEK</div>
            {weekDays.map(key => {
              const {day:d, date:dt, month:mo} = formatDate(key);
              const isToday = key===todayKey, isSel = key===selectedDay;
              const cnt = dayTasks(key).length, dnCnt = dayTasks(key).filter(t=>t.done).length;
              return (
                <div key={key} onClick={() => { setSelectedDay(key); setView("day"); }}
                  style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 8px",borderRadius:8,marginBottom:2,cursor:"pointer",background:isSel?"#1e1e30":isToday?"#13131f":"transparent",border:`1px solid ${isSel?"#6366f1":isToday?"#2d2d45":"transparent"}`,transition:"all 0.15s"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:24,textAlign:"center"}}>
                      <div style={{fontSize:9,fontWeight:700,color:isSel?"#8b5cf6":isToday?"#6366f1":"#334155",letterSpacing:1}}>{d}</div>
                      <div style={{fontSize:13,fontWeight:700,color:isSel?"#e2e8f0":isToday?"#e2e8f0":"#64748b"}}>{dt}</div>
                    </div>
                  </div>
                  {cnt > 0 && (
                    <div style={{display:"flex",gap:2,alignItems:"center"}}>
                      {Array.from({length:Math.min(cnt,4)},(_,i)=>(
                        <div key={i} style={{width:4,height:4,borderRadius:"50%",background:i<dnCnt?"#6366f1":"#2d2d45"}}/>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Priority legend */}
          <div style={{padding:"0 16px",flex:1}}>
            <div style={{fontSize:10,fontWeight:600,color:"#334155",letterSpacing:2,marginBottom:8}}>PRIORITY</div>
            {Object.entries(PRIORITIES).map(([k,v]) => {
              const cnt = allDayTasks.filter(t=>t.priority===k).length;
              return (
                <div key={k} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:v.dot}}/>
                    <span style={{fontSize:11,color:"#475569"}}>{v.label}</span>
                  </div>
                  {cnt>0 && <span style={{fontSize:11,color:v.color,fontFamily:"'DM Mono',monospace"}}>{cnt}</span>}
                </div>
              );
            })}
          </div>

          {/* Settings / Auto-launch */}
          {isElectron && (
            <div style={{padding:"12px 16px",borderTop:"1px solid #1a1a28"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontSize:11,fontWeight:600,color:"#475569"}}>Launch on startup</div>
                  <div style={{fontSize:9,color:"#334155",marginTop:1}}>Auto-open on PC boot</div>
                </div>
                <div onClick={toggleAutoLaunch} style={{width:36,height:20,borderRadius:10,background:autoLaunch?"#6366f1":"#1e1e30",cursor:"pointer",position:"relative",transition:"background 0.2s",border:`1px solid ${autoLaunch?"#8b5cf6":"#2d2d45"}`}}>
                  <div style={{width:14,height:14,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:autoLaunch?19:2,transition:"left 0.2s"}}/>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main content */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

          {/* Toolbar */}
          <div style={{padding:"12px 20px",borderBottom:"1px solid #1a1a28",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
            <div style={{flex:1}}>
              <div style={{fontSize:10,fontWeight:600,color:selectedDay===todayKey?"#6366f1":"#475569",letterSpacing:2,marginBottom:2}}>
                {selectedDay===todayKey ? "TODAY" : selectedDay<todayKey ? "PAST" : "UPCOMING"} · {formatDate(selectedDay).day.toUpperCase()}, {formatDate(selectedDay).monthFull.toUpperCase()} {formatDate(selectedDay).date}
              </div>
              {stats.total>0 && (
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:120,height:3,background:"#1a1a28",borderRadius:4,overflow:"hidden"}}>
                    <div className="progress-fill" style={{height:"100%",background:"linear-gradient(90deg,#6366f1,#8b5cf6)",borderRadius:4,width:`${stats.pct}%`}}/>
                  </div>
                  <span style={{fontSize:11,color:"#334155",fontFamily:"'DM Mono',monospace"}}>{stats.done}/{stats.total}</span>
                </div>
              )}
            </div>

            {/* Search */}
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",fontSize:12,color:"#334155"}}>⌕</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..."
                style={{background:"#13131f",border:"1px solid #1a1a28",borderRadius:8,padding:"7px 10px 7px 28px",color:"#94a3b8",fontSize:12,width:160}}/>
            </div>

            {/* Filter */}
            <div style={{display:"flex",background:"#0a0a10",borderRadius:8,padding:3,border:"1px solid #1a1a28"}}>
              {["all","pending","done"].map(f => (
                <button key={f} onClick={()=>setFilter(f)} style={{padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",fontSize:10,fontWeight:700,fontFamily:"'DM Sans',sans-serif",background:filter===f?"#1e1e30":"transparent",color:filter===f?"#e2e8f0":"#334155",textTransform:"uppercase",letterSpacing:1,transition:"all 0.15s"}}>{f}</button>
              ))}
            </div>

            <button className="btn-glow" onClick={() => { setEditTask(null); setShowForm(true); }}
              style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",border:"none",borderRadius:9,padding:"8px 16px",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5,fontFamily:"'DM Sans',sans-serif",letterSpacing:0.5}}>
              <span style={{fontSize:16,lineHeight:1}}>+</span> ADD TASK
            </button>
          </div>

          {/* Task list */}
          <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
            {currentTasks.length===0 ? (
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:12,color:"#1e1e30"}}>
                <div style={{fontSize:48}}>◈</div>
                <div style={{fontSize:13,fontWeight:600,letterSpacing:1}}>{stats.total===0 ? "NO TASKS YET" : "NO TASKS MATCH"}</div>
                <div style={{fontSize:11,color:"#1e1e30"}}>{stats.total===0 ? "Hit + ADD TASK to get started" : "Try clearing your filters"}</div>
              </div>
            ) : (
              <div className="fade-in" style={{display:"flex",flexDirection:"column",gap:4}}>
                {["high","medium","low"].map(priority => {
                  const group = currentTasks.filter(t => (t.priority||"medium")===priority);
                  if (!group.length) return null;
                  return (
                    <div key={priority} style={{marginBottom:8}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                        <div style={{width:5,height:5,borderRadius:"50%",background:PRIORITIES[priority].dot}}/>
                        <span style={{fontSize:9,fontWeight:700,color:"#334155",letterSpacing:2}}>{priority.toUpperCase()} PRIORITY</span>
                        <div style={{flex:1,height:1,background:"#1a1a28"}}/>
                      </div>
                      {group.map(task => (
                        <TaskRow key={task.id} task={task} dateKey={selectedDay}
                          onToggle={toggleDone}
                          onEdit={() => { setEditTask(task); setShowForm(true); }}
                          onDelete={deleteTask}/>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Form Modal */}
      {showForm && (
        <TaskForm initial={editTask} defaultDate={selectedDay}
          onSave={editTask ? updateTask : addTask}
          onClose={() => { setShowForm(false); setEditTask(null); }}/>
      )}
    </div>
  );
}

// ── Window control button ───────────────────────────────────────────────────
function WinBtn({ color, title, onClick, children }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{width:28,height:28,borderRadius:6,border:"none",cursor:"pointer",background:hover?color+"22":"transparent",color:hover?color:"#334155",fontSize:13,fontFamily:"monospace",display:"inline-flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s",marginLeft:2}}>
      {children}
    </button>
  );
}

// ── Task Row ────────────────────────────────────────────────────────────────
function TaskRow({ task, dateKey, onToggle, onEdit, onDelete }) {
  const p = PRIORITIES[task.priority||"medium"];
  return (
    <div className="task-row fade-in" style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px",borderRadius:8,background:"#13131f",border:"1px solid #1a1a28",marginBottom:3,position:"relative",borderLeft:`2px solid ${task.done?"#1e1e30":p.dot}`}}>
      <div className="check-box" onClick={() => onToggle(dateKey, task.id)}
        style={{width:18,height:18,borderRadius:5,border:`2px solid ${task.done?"#6366f1":"#2d2d45"}`,background:task.done?"#6366f1":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
        {task.done && <span style={{color:"#fff",fontSize:10,fontWeight:700,lineHeight:1}}>✓</span>}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",flexWrap:"wrap",gap:6}}>
          <span style={{fontSize:13,fontWeight:500,color:task.done?"#334155":"#e2e8f0",textDecoration:task.done?"line-through":"none",transition:"all 0.2s"}}>{task.title}</span>
          {task.time && <span style={{fontSize:10,color:"#6366f1",fontFamily:"'DM Mono',monospace",background:"#1e1e30",padding:"1px 6px",borderRadius:4}}>{task.time}</span>}
          {task.category && <span style={{fontSize:10,color:"#475569",background:"#1a1a28",padding:"1px 6px",borderRadius:4,border:"1px solid #1e1e30"}}>{task.category}</span>}
        </div>
        {task.notes && <div style={{fontSize:11,color:"#334155",marginTop:3,lineHeight:1.5}}>{task.notes}</div>}
        {task.done && task.doneAt && <div style={{fontSize:9,color:"#2d2d45",marginTop:3,fontFamily:"'DM Mono',monospace"}}>DONE {new Date(task.doneAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>}
      </div>
      <div style={{display:"flex",gap:2,flexShrink:0}}>
        <span className="icon-btn" onClick={onEdit} title="Edit" style={{fontSize:12,padding:"2px 4px"}}>✎</span>
        <span className="icon-btn" onClick={() => onDelete(dateKey, task.id)} title="Delete" style={{fontSize:12,padding:"2px 4px"}}>⌫</span>
      </div>
    </div>
  );
}

// ── Task Form Modal ─────────────────────────────────────────────────────────
function TaskForm({ initial, defaultDate, onSave, onClose }) {
  const [title,    setTitle]    = useState(initial?.title    || "");
  const [notes,    setNotes]    = useState(initial?.notes    || "");
  const [priority, setPriority] = useState(initial?.priority || "medium");
  const [category, setCategory] = useState(initial?.category || "");
  const [date,     setDate]     = useState(initial?.date     || defaultDate);
  const [time,     setTime]     = useState(initial?.time     || "");
  const inputRef = useRef();

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 60); }, []);

  function handleSave() {
    if (!title.trim()) return;
    onSave({ ...(initial||{}), title: title.trim(), notes, priority, category, date, time });
  }

  return (
    <div className="modal-overlay" onClick={onClose}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20}}>
      <div className="fade-in" onClick={e=>e.stopPropagation()}
        style={{background:"#0d0d18",border:"1px solid #2d2d45",borderRadius:14,padding:24,width:"100%",maxWidth:460,boxShadow:"0 24px 80px rgba(0,0,0,0.7)"}}>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <div style={{fontSize:10,fontWeight:700,color:"#6366f1",letterSpacing:2}}>{initial?"EDIT TASK":"NEW TASK"}</div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#334155",fontSize:20,lineHeight:1}}>×</button>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <input ref={inputRef} value={title} onChange={e=>setTitle(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handleSave()}
            placeholder="What needs to be done?"
            style={{background:"#13131f",border:"1px solid #1e1e30",borderRadius:8,padding:"11px 12px",color:"#e2e8f0",fontSize:14,width:"100%",fontWeight:500}}/>

          <div style={{display:"flex",gap:8}}>
            <div style={{flex:1}}>
              <label style={{fontSize:9,fontWeight:700,color:"#334155",letterSpacing:2,display:"block",marginBottom:5}}>DATE</label>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)}
                style={{width:"100%",background:"#13131f",border:"1px solid #1e1e30",borderRadius:8,padding:"8px 10px",color:"#94a3b8",fontSize:12,colorScheme:"dark"}}/>
            </div>
            <div style={{flex:1}}>
              <label style={{fontSize:9,fontWeight:700,color:"#334155",letterSpacing:2,display:"block",marginBottom:5}}>TIME</label>
              <input type="time" value={time} onChange={e=>setTime(e.target.value)}
                style={{width:"100%",background:"#13131f",border:"1px solid #1e1e30",borderRadius:8,padding:"8px 10px",color:"#94a3b8",fontSize:12,colorScheme:"dark"}}/>
            </div>
          </div>

          <div>
            <label style={{fontSize:9,fontWeight:700,color:"#334155",letterSpacing:2,display:"block",marginBottom:5}}>PRIORITY</label>
            <div style={{display:"flex",gap:6}}>
              {Object.entries(PRIORITIES).map(([k,v]) => (
                <button key={k} onClick={()=>setPriority(k)}
                  style={{flex:1,padding:"8px 0",borderRadius:8,border:`1px solid ${priority===k?v.dot:"#1e1e30"}`,background:priority===k?v.bg:"#13131f",color:priority===k?v.color:"#334155",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",letterSpacing:0.5,transition:"all 0.15s",textTransform:"uppercase"}}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{fontSize:9,fontWeight:700,color:"#334155",letterSpacing:2,display:"block",marginBottom:5}}>CATEGORY</label>
            <select value={category} onChange={e=>setCategory(e.target.value)}
              style={{width:"100%",background:"#13131f",border:"1px solid #1e1e30",borderRadius:8,padding:"8px 10px",color:category?"#94a3b8":"#334155",fontSize:12,colorScheme:"dark",fontFamily:"'DM Sans',sans-serif"}}>
              <option value="">No category</option>
              {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes (optional)..." rows={2}
            style={{background:"#13131f",border:"1px solid #1e1e30",borderRadius:8,padding:"10px 12px",color:"#94a3b8",fontSize:12,resize:"none",width:"100%"}}/>

          <div style={{display:"flex",gap:8,marginTop:4}}>
            <button onClick={onClose}
              style={{flex:1,padding:"10px",background:"#13131f",border:"1px solid #1e1e30",borderRadius:8,color:"#475569",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",letterSpacing:0.5}}>
              CANCEL
            </button>
            <button onClick={handleSave} disabled={!title.trim()}
              style={{flex:2,padding:"10px",background:title.trim()?"linear-gradient(135deg,#6366f1,#8b5cf6)":"#1a1a28",border:"none",borderRadius:8,color:title.trim()?"#fff":"#334155",fontSize:12,fontWeight:700,cursor:title.trim()?"pointer":"not-allowed",fontFamily:"'DM Sans',sans-serif",letterSpacing:0.5,transition:"all 0.15s"}}>
              {initial?"SAVE CHANGES":"ADD TASK"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
