import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase.js';
import { createRoot } from 'react-dom/client';
import { Activity, ArrowDownRight, ArrowUpRight, Bell, CalendarDays, Check, CheckCheck, ChevronDown, Clock3, Flame, LayoutDashboard, ListTodo, LogOut, Menu, MoreHorizontal, Plus, Search, Settings2, Sparkles, Sun, Moon, Target, Trash2, UserRound, X } from 'lucide-react';
import './styles.css';

const seedTasks = [
  { id: 1, title: 'Review DBMS module notes', category: 'Study', priority: 'High', due: todayOffset(0), status: 'In progress' },
  { id: 2, title: 'Complete React component practice', category: 'Personal project', priority: 'High', due: todayOffset(0), status: 'To do' },
  { id: 3, title: 'Read one research paper', category: 'Research', priority: 'Medium', due: todayOffset(1), status: 'To do' },
  { id: 4, title: 'Organize weekly study plan', category: 'Planning', priority: 'Low', due: todayOffset(-1), status: 'Completed' },
  { id: 5, title: 'Practice Java problems', category: 'Study', priority: 'Medium', due: todayOffset(2), status: 'Completed' },
];
function todayOffset(n) { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
const initialTasks = () => { try { const saved = localStorage.getItem('mytrack-tasks'); return saved ? JSON.parse(saved) : seedTasks; } catch { return seedTasks; } };
const initialActivity = () => { try { return JSON.parse(localStorage.getItem('mytrack-activity') || '{}'); } catch { return {}; } };
function App() {
  const [tasks, setTasks] = useState(initialTasks);
  const totalTasks = tasks.length;
const completedTasks = tasks.filter(
  (task) => task.status === 'Completed'
).length;
  const pendingTasks = totalTasks - completedTasks;
  const progress =
  totalTasks === 0
    ? 0
    : Math.round((completedTasks / totalTasks) * 100);
  const [currentUser, setCurrentUser] = useState(null);
  const [activity, setActivity] = useState(initialActivity);
  const [theme, setTheme] = useState(() => localStorage.getItem('mytrack-theme') || 'light');
  const [active, setActive] = useState('Overview');
  const [filter, setFilter] = useState('All tasks');
  const [priorityFilter, setPriorityFilter] = useState('All priorities');
  const [categoryFilter, setCategoryFilter] = useState('All categories');
  const [sortOrder, setSortOrder] = useState('Earliest first');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'Study', priority: 'Medium', due: todayOffset(0), status: 'To do' });
  const [editing, setEditing] = useState(null);
 
  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error('Failed to load session:', error.message);
        return;
      }

      setCurrentUser(data.session?.user ?? null);
    }

    loadSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
  if (!currentUser) {
    return;
  }

  let cancelled = false;

  async function loadTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (cancelled) return;

    if (error) {
      console.error('Failed to load tasks:', error.message);
      return;
    }

    const loadedTasks = (data || []).map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description || '',
      due: task.due_date || '',
      status:
         task.status === 'completed'
            ? 'Completed'
            : task.status === 'in_progress'
             ? 'In progress'
             : 'To do',
      category: task.category || 'Study',
      priority: task.priority || 'Medium',
    }));

    setTasks(loadedTasks);
  }

  loadTasks();

  return () => {
    cancelled = true;
  };
  }, [currentUser]);
  useEffect(() => {
    localStorage.setItem('mytrack-tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('mytrack-activity', JSON.stringify(activity));
  }, [activity]);

  useEffect(() => {
    localStorage.setItem('mytrack-theme', theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out failed:', error.message);
      alert('Sign out failed. Please try again.');
    }
  }

  const completed = tasks.filter(t => t.status === 'Completed').length;
  const inProgress = tasks.filter(t => t.status === 'In progress').length;
  const overdue = tasks.filter(t => t.status !== 'Completed' && t.due < todayOffset(0)).length;
  const visibleTasks = useMemo(() => tasks.filter(t => {
  const matchesSearch =
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase());

  const matchesFilter =
    filter === 'All tasks' ||
    (filter === 'Today' && t.due === todayOffset(0)) ||
    (filter === 'Completed' && t.status === 'Completed') ||
    (filter === 'In progress' && t.status === 'In progress') ||
    (filter === 'To do' && t.status === 'To do');

  const matchesPriority =
    priorityFilter === 'All priorities' ||
    t.priority === priorityFilter;

  const matchesCategory =
    categoryFilter === 'All categories' ||
    t.category === categoryFilter;

  return matchesSearch && matchesFilter && matchesPriority && matchesCategory;
}).sort((a, b) => {
  return sortOrder === 'Earliest first'
    ? a.due.localeCompare(b.due)
    : b.due.localeCompare(a.due);
}), [
  tasks,
  filter,
  search,
  priorityFilter,
  categoryFilter,
  sortOrder
]);
  function openNew() { setEditing(null); setForm({ title: '',description: '', category: 'Study', priority: 'Medium', due: todayOffset(0), status: 'To do' }); setShowForm(true); }
  function openEdit(task) { setEditing(task.id); setForm({ title: task.title, description: task.description, category: task.category, priority: task.priority, due: task.due, status: task.status }); setShowForm(true); }
  
async function saveTask(e) {
  e.preventDefault();

  const title = form.title.trim();
  if (!title || !currentUser) return;

  const taskData = {
  user_id: currentUser.id,
  title,
  description: form.description || '',
  status:
    form.status === 'Completed'
      ? 'completed'
      : form.status === 'In progress'
        ? 'in_progress'
        : 'pending',
  due_date: form.due || null,
  category: form.category,
  priority: form.priority,
};
  if (editing) {
    const { data, error } = await supabase
      .from('tasks')
      .update(taskData)
      .eq('id', editing)
      .eq('user_id', currentUser.id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update task:', error.message);
      alert('Could not update task: ' + error.message);
      return;
    }

    setTasks((prev) =>
      prev.map((task) =>
        task.id === editing
          ? {
              ...task,
              title: data.title,
              due: data.due_date || '',
              status: data.status === 'completed' ? 'Completed' : 'To do',
            }
          : task
      )
    );
  } else {
    const { data, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single();

    if (error) {
      console.error('Failed to create task:', error.message);
      alert('Could not create task: ' + error.message);
      return;
    }

    setTasks((prev) => [
      {
        id: data.id,
        title: data.title,
        description: data.description || '',
        due: data.due_date || '',
        status: data.status === 'completed' ? 'Completed' : 'To do',
        category: form.category,
        priority: form.priority,
      },
      ...prev,
    ]);
  }

  setForm({
  title: '',
  description: '',
  category: 'Study',
  priority: 'Medium',
  due: todayOffset(0),
  status: 'To do',
});

  setEditing(null);
  setShowForm(false);
}

async function removeTask(id) {
  if (!window.confirm('Delete this task?')) return;

  if (!currentUser) return;

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', currentUser.id);

  if (error) {
    console.error('Failed to delete task:', error.message);
    alert('Could not delete task: ' + error.message);
    return;
  }

  setTasks((prev) => prev.filter((task) => task.id !== id));
}
async function cycleStatus(task) {
  const order = ['To do', 'In progress', 'Completed'];
  const next = order[(order.indexOf(task.status) + 1) % order.length];

  const dbStatus =
  next === 'Completed'
    ? 'completed'
    : next === 'In progress'
      ? 'in_progress'
      : 'pending';

  const { error } = await supabase
    .from('tasks')
    .update({ status: dbStatus })
    .eq('id', task.id)
    .eq('user_id', currentUser.id);

  if (error) {
    console.error('Failed to update task status:', error.message);
    alert('Could not update task status: ' + error.message);
    return;
  }

  setTasks((prev) =>
    prev.map((t) =>
      t.id === task.id
        ? {
            ...t,
            status: next,
            completedAt: next === 'Completed' ? todayOffset(0) : undefined,
          }
        : t
    )
  );

  if (next === 'Completed') {
    setActivity((prev) => ({
      ...prev,
      [todayOffset(0)]: (prev[todayOffset(0)] || 0) + 1,
    }));
  }
}
  const navItems = [{ name: 'Overview', icon: LayoutDashboard }, { name: 'My tasks', icon: ListTodo }, { name: 'Progress', icon: Activity }, { name: 'Streak calendar', icon: CalendarDays }];
  const title = active === 'Overview' ? `Good morning, ${currentUser?.user_metadata?.full_name || currentUser?.email || 'there'}` : active;
  const subtitle = active === 'Overview' ? 'A little progress each day adds up to big results.' : active === 'My tasks' ? 'Plan your work, then work your plan.' : 'See how consistently you are moving forward.';
  if (!currentUser) return <AuthScreen onSuccess={setCurrentUser} />;
  return <div className={`app-shell ${theme === 'dark' ? 'theme-dark' : ''}`}>
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Target size={21}/></div><span>mytrack<span className="brand-dot">.</span></span><button className="icon-btn mobile-close" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={18}/></button></div>
      <div className="workspace"><div className="workspace-avatar">S</div><div className="workspace-copy"><strong>Personal space</strong><span>Free workspace</span></div><ChevronDown size={15}/></div>
      <div className="nav-label">WORKSPACE</div>
      <nav>{navItems.map(item => <button key={item.name} className={`nav-item ${active===item.name?'nav-active':''}`} onClick={() => {setActive(item.name);setMobileNav(false);}}><item.icon size={18}/><span>{item.name}</span>{item.name==='My tasks'&&<span className="nav-count">{tasks.filter(t=>t.status!=='Completed').length}</span>}</button>)}</nav>
      <div className="nav-label second-label">YOUR SPACE</div>
      <button className={`nav-item ${filter==='Today'?'nav-active':''}`} onClick={() => {setActive('My tasks');setFilter('Today');setMobileNav(false);}}><CalendarDays size={18}/><span>Today</span><span className="nav-count">{tasks.filter(t=>t.due===todayOffset(0)&&t.status!=='Completed').length}</span></button>
      <div className="sidebar-bottom"><div className="tip-card"><div className="tip-icon"><Sparkles size={17}/></div><strong>Small steps matter</strong><p>Focus on progress, not perfection. Keep showing up.</p><div className="tip-progress"><span style={{width:`${progress}%`}}/></div><small>{progress}% of tasks completed</small></div><div className="profile-row"><div className="profile-avatar">{(currentUser.user_metadata?.full_name || currentUser.email || 'U').slice(0,1).toUpperCase()}</div><div className="profile-copy"><strong>{currentUser.user_metadata?.full_name || currentUser.email}</strong><span>Personal account</span></div><button className="signout-mini" onClick={signOut} aria-label="Sign out"><LogOut size={16}/></button></div></div>
    </aside>
    {mobileNav && <button className="scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation"/>}
    <main className="main-area"><header className="topbar"><button className="icon-btn menu-trigger" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={21}/></button><div className="breadcrumbs">Workspace <span>/</span> <strong>{active}</strong></div><div className="top-actions"><label className="search-box"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tasks..."/><kbd>⌘ K</kbd></label><button className="icon-btn theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>{theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}</button><button className="icon-btn notification" aria-label="Notifications"><Bell size={18}/><i/></button><div className="top-avatar">{(currentUser.user_metadata?.full_name || currentUser.email || 'U').slice(0,1).toUpperCase()}</div></div></header>
      <div className="page-content"><section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot"/> YOUR PERSONAL PRODUCTIVITY SPACE</div><h1>{title}<span className="wave">{active==='Overview'?' ✨':''}</span></h1><p className="subtitle">{subtitle}</p></div><button className="primary-btn" onClick={openNew}><Plus size={18}/> <span>New task</span></button></section>
      {active==='Overview' && <>
        <section className="stats-grid"><StatCard label="Total tasks" value={tasks.length} detail="Across all your plans" icon={ListTodo} tone="purple"/><StatCard label="Completed" value={completed} detail={`${progress}% completion rate`} icon={CheckCheck} tone="green" trend={progress>0?'+ Keep it up':''}/><StatCard label="In progress" value={inProgress} detail="Currently working on" icon={Activity} tone="blue"/><StatCard label="Overdue" value={overdue} detail={overdue?'Needs your attention':'You are all caught up'} icon={Clock3} tone="orange"/></section>
        <ContributionCalendar activity={activity} tasks={tasks} onOpen={() => setActive('Streak calendar')} />
        <section className="content-grid"><div className="panel task-panel"><div className="panel-heading"><div><h2>Focus for today <span className="heading-count">{tasks.filter(t=>t.due===todayOffset(0)&&t.status!=='Completed').length}</span></h2><p>Your next steps, all in one place.</p></div><button className="text-btn" onClick={()=>{setActive('My tasks');setFilter('All tasks')}}>View all <ArrowUpRight size={15}/></button></div><TaskList tasks={visibleTasks.filter(t=>t.due===todayOffset(0)).slice(0,5)} onCycle={cycleStatus} onEdit={openEdit} onDelete={removeTask} emptyText="Nothing scheduled for today. Add a task to get started."/></div><div className="panel progress-panel"><div className="panel-heading"><div><h2>Your progress</h2><p>Every completed task counts.</p></div><button className="icon-btn subtle-btn" aria-label="Progress options"><MoreHorizontal size={19}/></button></div><div className="progress-ring-wrap"><svg viewBox="0 0 160 160" className="progress-ring"><circle cx="80" cy="80" r="64" className="ring-bg"/><circle cx="80" cy="80" r="64" className="ring-value" strokeDasharray={`${progress/100*402.12} 402.12`}/></svg><div className="ring-label"><strong>{progress}%</strong><span>completed</span></div></div><div className="progress-summary"><span><i className="legend-dot done-dot"/> Completed</span><strong>{completed}</strong></div><div className="progress-summary"><span><i className="legend-dot active-dot"/> In progress</span><strong>{inProgress}</strong></div><div className="progress-summary"><span><i className="legend-dot todo-dot"/> To do</span><strong>{tasks.filter(t=>t.status==='To do').length}</strong></div><div className="encouragement"><Sparkles size={16}/><span>{progress===100&&tasks.length?'Amazing! Every task is complete.':progress>=50?'You are building great momentum!':'Start with one task. You’ve got this!'}</span></div></div></section>
        <section className="panel all-tasks-panel"><div className="panel-heading"><div><h2>All tasks</h2><p>A quick look at everything on your plate.</p></div><button className="text-btn" onClick={()=>{setActive('My tasks');setFilter('All tasks')}}>Manage tasks <ArrowUpRight size={15}/></button></div><TaskList tasks={visibleTasks.slice(0,4)} onCycle={cycleStatus} onEdit={openEdit} onDelete={removeTask} emptyText="No tasks found. Create your first task."/></section>
      </>}
      {active==='My tasks' && <section className="panel full-task-panel"><div className="panel-heading"><div><h2>Task list</h2><p>{visibleTasks.length} tasks match your selection.</p></div><button className="primary-btn small-primary" onClick={openNew}><Plus size={16}/> New task</button></div><div className="filter-row">{['All tasks','Today','To do','In progress','Completed'].map(f=><button key={f} className={`filter-chip ${filter===f?'filter-selected':''}`} onClick={()=>setFilter(f)}>{f}</button>)}</div>
<div className="filter-row">
  <select
    value={priorityFilter}
    onChange={e => setPriorityFilter(e.target.value)}
    className="filter-chip"
  >
    <option value="All priorities">All priorities</option>
    <option value="High">High priority</option>
    <option value="Medium">Medium priority</option>
    <option value="Low">Low priority</option>
  </select>

  <select
    value={categoryFilter}
    onChange={e => setCategoryFilter(e.target.value)}
    className="filter-chip"
  >
    <option value="All categories">All categories</option>
    <option value="Study">Study</option>
    <option value="Research">Research</option>
    <option value="Personal">Personal</option>
    <option value="Work">Work</option>
  </select>
  <select
  value={sortOrder}
  onChange={e => setSortOrder(e.target.value)}
  className="filter-chip"
>
  <option value="Earliest first">Earliest due date</option>
  <option value="Latest first">Latest due date</option>
</select>
</div>
<TaskList tasks={visibleTasks} onCycle={cycleStatus} onEdit={openEdit} onDelete={removeTask} emptyText="No tasks match this filter. Try another filter or add a task."/></section>}
      {active==='Progress' && <><section className="stats-grid"><StatCard label="Completion rate" value={`${progress}%`} detail="Of all tasks created" icon={Target} tone="purple"/><StatCard label="Completed tasks" value={completed} detail="Finished and checked off" icon={CheckCheck} tone="green"/><StatCard label="In progress" value={inProgress} detail="Keep the momentum going" icon={Activity} tone="blue"/><StatCard label="Overdue tasks" value={overdue} detail="Review your deadlines" icon={Clock3} tone="orange"/></section><section className="panel weekly-chart-panel"><div className="panel-heading"><div><h2>Weekly activity</h2><p>Tasks completed in the last seven days.</p></div><span className="chart-total">{lastSevenDays(activity).reduce((sum,d)=>sum+d.count,0)} completed</span></div><WeeklyActivityChart activity={activity}/></section><section className="panel progress-detail"><div className="panel-heading"><div><h2>Task breakdown</h2><p>Your current workload by status.</p></div></div>{[['Completed',completed,'#31a879'],['In progress',inProgress,'#6d72e8'],['To do',tasks.filter(t=>t.status==='To do').length,'#d5d8e3']].map(([name,count,color])=><div className="bar-stat" key={name}><div className="bar-stat-label"><span>{name}</span><strong>{count} <small>tasks</small></strong></div><div className="bar-track"><span style={{width:`${tasks.length?count/tasks.length*100:0}%`,background:color}}/></div></div>)}<div className="progress-note"><ArrowDownRight size={18}/><span>Progress is calculated automatically from your task statuses.</span></div></section></>}
      {active==='Streak calendar' && <section className="panel streak-page"><div className="panel-heading"><div><h2>Your consistency calendar</h2><p>Each square shows how many tasks you completed that day.</p></div><div className="streak-total"><Flame size={19}/><strong>{calculateStreak(activity)} day streak</strong></div></div><ContributionCalendar activity={activity} tasks={tasks} expanded /></section>}
      <footer className="footer"><span>Made for your next small win <span className="footer-heart">♥</span></span><span>MyTrack · Personal productivity</span></footer></div></main>
    {showForm && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setShowForm(false)}}><form className="task-modal" onSubmit={saveTask}><div className="modal-heading"><div><span className="modal-kicker">TASK DETAILS</span><h2>{editing?'Edit task':'Create a new task'}</h2><p>Give your next step a clear name.</p></div><button type="button" className="icon-btn" onClick={()=>setShowForm(false)} aria-label="Close"><X size={19}/></button></div><label className="field-label">Task name<input autoFocus required maxLength={120} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Finish DBMS assignment"/></label><label className="field-label">
  Description
  <textarea
    value={form.description}
    onChange={e => setForm({...form, description: e.target.value})}
    placeholder="Add details about this task..."
    rows={3}
    maxLength={1000}
  />
</label><div className="form-two"><label className="field-label">Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{['Study','Personal project','Research','Planning','Health','Personal','Work'].map(x=><option key={x}>{x}</option>)}</select></label><label className="field-label">Priority<select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>{['Low','Medium','High'].map(x=><option key={x}>{x}</option>)}</select></label></div><div className="form-two"><label className="field-label">Due date<input type="date" value={form.due} onChange={e=>setForm({...form,due:e.target.value})} required/></label><label className="field-label">Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{['To do','In progress','Completed'].map(x=><option key={x}>{x}</option>)}</select></label></div><div className="modal-actions"><button type="button" className="secondary-btn" onClick={()=>setShowForm(false)}>Cancel</button><button type="submit" className="primary-btn"><Check size={17}/>{editing?'Save changes':'Create task'}</button></div></form></div>}
  </div>;
}

function AuthScreen({ onSuccess }) {
  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (mode === 'signup') {
        if (name.trim().length < 2) {
          throw new Error('Enter your name (at least 2 characters).');
        }

        if (password.length < 6) {
          throw new Error('Use a password with at least 6 characters.');
        }

        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              full_name: name.trim()
            }
          }
        });

        if (error) throw error;

        if (data.session && data.user) {
          onSuccess(data.user);
        } else {
          setMessage(
            'Account created. Check your email to confirm your account, then sign in.'
          );
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password
        });

        if (error) throw error;

        if (data.user) {
          onSuccess(data.user);
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <div className="auth-brand">
          <span className="auth-brand-icon"><Target size={22} /></span>
          mytrack<span>.</span>
        </div>

        <div className="auth-hero-copy">
          <div className="auth-pill">
            <Sparkles size={14} /> YOUR DAYS, WITH DIRECTION
          </div>
          <h1>Make room for<br /><em>what matters.</em></h1>
          <p>
            A calmer way to organize your tasks, build momentum, and see your
            progress add up.
          </p>

          <div className="auth-preview">
            <div className="preview-top">
              <span>YOUR WEEK AT A GLANCE</span>
              <span className="preview-live"><i /> LIVE PREVIEW</span>
            </div>
            <div className="preview-bars">
              <span style={{ height: '34%' }} />
              <span style={{ height: '57%' }} />
              <span style={{ height: '44%' }} />
              <span style={{ height: '82%' }} />
              <span style={{ height: '64%' }} />
              <span style={{ height: '94%' }} />
              <span style={{ height: '52%' }} />
            </div>
            <div className="preview-bottom">
              <strong>Small steps. Real progress.</strong>
              <span>One day at a time ✦</span>
            </div>
          </div>
        </div>

        <div className="auth-visual-footer">
          PLAN WITH INTENTION <span>·</span> GROW AT YOUR PACE
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand">
            <Target size={21} /> mytrack<span>.</span>
          </div>

          <div className="auth-welcome">
            <div className="auth-icon"><UserRound size={20} /></div>
            <p className="auth-kicker">WELCOME TO MYTRACK</p>
            <h2>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h2>
            <p>
              {mode === 'signin'
                ? 'Sign in to pick up where you left off.'
                : 'Start building a routine that works for you.'}
            </p>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={mode === 'signin' ? 'auth-tab active' : 'auth-tab'}
              onClick={() => {
                setMode('signin');
                setError('');
                setMessage('');
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              className={mode === 'signup' ? 'auth-tab active' : 'auth-tab'}
              onClick={() => {
                setMode('signup');
                setError('');
                setMessage('');
              }}
            >
              Sign up
            </button>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {mode === 'signup' && (
              <label>
                Your name
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Sujana"
                  autoComplete="name"
                  required
                />
              </label>
            )}

            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={
                  mode === 'signup'
                    ? 'At least 6 characters'
                    : 'Enter your password'
                }
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                minLength={6}
                required
              />
            </label>

            {error && <div className="auth-error" role="alert">{error}</div>}

            {message && (
              <p role="status" className="auth-message">{message}</p>
            )}

            <button className="auth-submit" type="submit" disabled={busy}>
              {busy
                ? 'Please wait…'
                : mode === 'signin'
                  ? 'Sign in to MyTrack'
                  : 'Create my account'}
              <ArrowUpRight size={17} />
            </button>
          </form>

          <div className="auth-note">
            <span className="auth-note-line" />
            <span>YOUR PERSONAL SPACE</span>
            <span className="auth-note-line" />
          </div>

          <p className="auth-disclaimer">
            Your account is authenticated using Supabase.
          </p>
        </div>
      </div>
    </div>
  );
}

function calculateStreak(activity) {
  const has = d => (activity[d] || 0) > 0;
  let cursor = new Date(); cursor.setHours(12,0,0,0);
  if (!has(todayOffset(0))) cursor.setDate(cursor.getDate()-1);
  let streak = 0;
  while (has(`${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,'0')}-${String(cursor.getDate()).padStart(2,'0')}`)) { streak++; cursor.setDate(cursor.getDate()-1); }
  return streak;
}
function ContributionCalendar({ activity, tasks, expanded=false, onOpen }) {
  const days = useMemo(() => { const end = new Date(); end.setHours(12,0,0,0); const start = new Date(end); start.setDate(end.getDate()-363); start.setDate(start.getDate()-start.getDay()); const arr=[]; for (let d=new Date(start); d<=end; d.setDate(d.getDate()+1)) { const date=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; arr.push({date, count:activity[date]||0, day:new Date(d)}); } return arr; }, [activity]);
  const max = Math.max(1, ...days.map(d=>d.count));
  const months = days.filter(d=>d.day.getDate()===1).map(d=>({date:d.date,label:d.day.toLocaleDateString('en',{month:'short'})}));
  return <section className={`panel contribution-panel ${expanded?'contribution-expanded':''}`}><div className="contribution-heading"><div><div className="contribution-title"><h2>Consistency calendar</h2><span className="contribution-year">{new Date().getFullYear()}</span></div><p>Your GitHub-style activity map. Every completed task adds a square.</p></div>{!expanded&&<button className="text-btn" onClick={onOpen}>View streak <ArrowUpRight size={15}/></button>}</div><div className="contribution-stats"><div><strong>{Object.values(activity).reduce((a,b)=>a+b,0)}</strong><span>tasks completed in this tracker</span></div><div className="streak-chip"><Flame size={17}/><strong>{calculateStreak(activity)} day streak</strong></div></div><div className="heatmap-scroll"><div className="heatmap-months" style={{gridTemplateColumns:`repeat(${Math.ceil(days.length/7)}, 12px)`}}>{months.map((m,i)=><span key={`${m.date}-${i}`} style={{gridColumn:Math.floor(days.findIndex(d=>d.date===m.date)/7)+1}}>{m.label}</span>)}</div><div className="heatmap-body"><div className="heatmap-weekdays"><span>Mon</span><span></span><span>Wed</span><span></span><span>Fri</span><span></span><span></span></div><div className="heatmap-grid">{days.map(d=><span key={d.date} className={`heatmap-cell level-${d.count===0?0:Math.min(4,Math.ceil(d.count/max*4))}`} title={`${d.count} task${d.count===1?'':'s'} completed on ${d.date}`}/>)}</div></div></div><div className="heatmap-legend"><span>Less</span>{[0,1,2,3,4].map(n=><i key={n} className={`heatmap-cell level-${n}`}/>)}<span>More</span></div><p className="heatmap-footnote">Activity starts counting when you mark a task as completed. Your calendar is saved in this browser.</p></section>;
}
function lastSevenDays(activity) {
  return Array.from({length:7}, (_,i) => { const d = new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate() - (6-i)); const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; return { key, label: d.toLocaleDateString('en',{weekday:'short'}), count: activity[key] || 0 }; });
}
function WeeklyActivityChart({activity}) {
  const days = lastSevenDays(activity); const max = Math.max(1,...days.map(d=>d.count));
  return <div className="weekly-chart" role="img" aria-label="Bar chart showing tasks completed each of the last seven days">{days.map(d=><div className="chart-column" key={d.key}><span className="chart-count">{d.count || ''}</span><div className="chart-bar-track"><span className="chart-bar" style={{height:`${Math.max(d.count ? 12 : 4, d.count/max*100)}%`}} title={`${d.count} completed on ${d.key}`}/></div><span className="chart-day">{d.label}</span></div>)}</div>;
}
function StatCard({label,value,detail,icon:Icon,tone,trend}) { return <div className="stat-card"><div className="stat-top"><span>{label}</span><div className={`stat-icon ${tone}`}><Icon size={18}/></div></div><div className="stat-value">{value}</div><div className="stat-detail">{trend&&<span className="positive-trend">{trend}</span>}{detail}</div></div>; }
function TaskList({tasks,onCycle,onEdit,onDelete,emptyText}) { if(!tasks.length) return <div className="empty-state"><div className="empty-icon"><CheckCheck size={22}/></div><strong>All clear for now</strong><p>{emptyText}</p></div>; return <div className="task-list">{tasks.map(task=><div className="task-row" key={task.id}><button className={`task-check ${task.status==='Completed'?'is-checked':''}`} onClick={()=>onCycle(task)} aria-label={`Change status for ${task.title}`}>{task.status==='Completed'&&<Check size={13}/>}</button><div className="task-main">
  <button
    className={`task-title ${task.status === 'Completed' ? 'task-done' : ''}`}
    onClick={() => onEdit(task)}
  >
    {task.title}
  </button>

  {task.description && (
    <p className="task-description">{task.description}</p>
  )}

  <div className="task-meta"><span className="category-tag">{task.category}</span><span className={`priority priority-${task.priority.toLowerCase()}`}><i/>{task.priority}</span><span className="due-date"><CalendarDays size={12}/>{formatDue(task.due)}</span></div></div><span className={`status-pill status-${task.status.toLowerCase().replace(' ','-')}`}>{task.status}</span><div className="task-actions"><button className="icon-btn" onClick={()=>onEdit(task)} aria-label="Edit task"><Settings2 size={16}/></button><button className="icon-btn delete-btn" onClick={()=>onDelete(task.id)} aria-label="Delete task"><Trash2 size={15}/></button></div></div>)}</div>; }
function formatDue(value) { if(!value)return 'No date'; if(value===todayOffset(0))return 'Today'; if(value===todayOffset(1))return 'Tomorrow'; const d=new Date(`${value}T12:00:00`); return d.toLocaleDateString('en-IN',{day:'numeric',month:'short'}); }

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
