import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { supabase, supabaseConfigured } from './lib/supabase'
import { categories, Clothing } from './types'
import { Archive, Check, ChevronDown, Edit3, ImagePlus, LogOut, Plus, Search, Shirt, Sparkles, Trash2, X } from 'lucide-react'

type FormState = Omit<Clothing, 'id' | 'created_at'>
const emptyForm: FormState = { name: '', category: 'Camisetas', size: '', color: '', brand: '', season: 'Meia-estação', image_url: '', notes: '' }

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [authError, setAuthError] = useState('')
  const [items, setItems] = useState<Clothing[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todas')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Clothing | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthLoading(false) })
    const { data: listener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, next) => setSession(next))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => { if (session) loadItems() }, [session])

  async function loadItems() {
    if (!supabase || !session) return
    setLoading(true)
    const { data, error } = await supabase.from('clothing').select('*').order('created_at', { ascending: false })
    if (error) setMessage(error.message)
    else setItems(data ?? [])
    setLoading(false)
  }

  async function handleAuth(e: FormEvent) {
    e.preventDefault(); setAuthError('')
    if (!supabase) return
    const result = isRegister
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })
    if (result.error) setAuthError(result.error.message)
    else if (isRegister && !result.data.session) setAuthError('Cadastro criado. Confirme seu e-mail para entrar.')
  }

  function openCreate() { setEditing(null); setForm(emptyForm); setModalOpen(true) }
  function openEdit(item: Clothing) {
    setEditing(item)
    setForm({ name: item.name, category: item.category, size: item.size ?? '', color: item.color ?? '', brand: item.brand ?? '', season: item.season ?? 'Meia-estação', image_url: item.image_url ?? '', notes: item.notes ?? '' })
    setModalOpen(true)
  }

  async function saveItem(e: FormEvent) {
    e.preventDefault()
    if (!supabase || !session || !form.name.trim()) return
    setSaving(true); setMessage('')
    const payload = { ...form, name: form.name.trim(), user_id: session.user.id }
    const result = editing
      ? await supabase.from('clothing').update(payload).eq('id', editing.id).select().single()
      : await supabase.from('clothing').insert(payload).select().single()
    if (result.error) setMessage(result.error.message)
    else { setItems(prev => editing ? prev.map(x => x.id === editing.id ? result.data : x) : [result.data, ...prev]); setModalOpen(false); setMessage(editing ? 'Peça atualizada.' : 'Peça adicionada.') }
    setSaving(false)
  }

  async function removeItem(item: Clothing) {
    if (!supabase || !confirm(`Excluir “${item.name}”?`)) return
    const { error } = await supabase.from('clothing').delete().eq('id', item.id)
    if (error) setMessage(error.message); else { setItems(prev => prev.filter(x => x.id !== item.id)); setMessage('Peça removida.') }
  }

  const filtered = useMemo(() => items.filter(item => {
    const text = `${item.name} ${item.brand ?? ''} ${item.color ?? ''}`.toLowerCase()
    return text.includes(query.toLowerCase()) && (category === 'Todas' || item.category === category)
  }), [items, query, category])

  if (!supabaseConfigured || !supabase) return <SetupScreen />
  if (authLoading) return <div className="center-screen"><div className="loader" /></div>
  if (!session) return <AuthScreen email={email} password={password} setEmail={setEmail} setPassword={setPassword} isRegister={isRegister} setIsRegister={setIsRegister} error={authError} onSubmit={handleAuth} />

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><Shirt size={20} /></div><div><strong>Meu Guarda-Roupa</strong><span>Seu armário, organizado.</span></div></div>
      <div className="top-actions"><span className="user-email">{session.user.email}</span><button className="icon-btn" onClick={() => { if (supabase) void supabase.auth.signOut() }} title="Sair"><LogOut size={18} /></button></div>
    </header>

    <main className="content">
      <section className="hero">
        <div><div className="eyebrow"><Sparkles size={14} /> ORGANIZAÇÃO PESSOAL</div><h1>O que você<br /><em>vai vestir hoje?</em></h1><p>Cadastre suas peças e tenha seu guarda-roupa sempre à mão.</p></div>
        <button className="primary-btn" onClick={openCreate}><Plus size={19} /> Adicionar peça</button>
      </section>

      <section className="stats"><div><strong>{items.length}</strong><span>peças cadastradas</span></div><div><strong>{new Set(items.map(x => x.category)).size}</strong><span>categorias</span></div><div><strong>{items.filter(x => x.image_url).length}</strong><span>com foto</span></div></section>

      <section className="toolbar"><div className="search"><Search size={18} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nome, marca ou cor..." /></div><div className="select-wrap"><select value={category} onChange={e => setCategory(e.target.value)}><option>Todas</option>{categories.map(c => <option key={c}>{c}</option>)}</select><ChevronDown size={16} /></div></section>

      {message && <div className="toast"><Check size={16} /> {message}<button onClick={() => setMessage('')}><X size={15} /></button></div>}
      {loading ? <div className="empty"><div className="loader" /><p>Carregando seu guarda-roupa...</p></div> : filtered.length === 0 ? <div className="empty"><div className="empty-icon"><Archive size={25} /></div><h3>{items.length ? 'Nenhuma peça encontrada' : 'Seu guarda-roupa está vazio'}</h3><p>{items.length ? 'Tente mudar a busca ou o filtro.' : 'Comece cadastrando a primeira peça que você tem em casa.'}</p>{!items.length && <button className="primary-btn" onClick={openCreate}><Plus size={18} /> Cadastrar primeira peça</button>}</div> : <div className="grid">{filtered.map(item => <article className="card" key={item.id}>
        <div className="photo">{item.image_url ? <img src={item.image_url} alt={item.name} /> : <div className="photo-placeholder"><Shirt size={38} strokeWidth={1.3} /><span>Sem foto</span></div>}<span className="category-pill">{item.category}</span><div className="card-actions"><button onClick={() => openEdit(item)} title="Editar"><Edit3 size={16} /></button><button onClick={() => removeItem(item)} title="Excluir"><Trash2 size={16} /></button></div></div>
        <div className="card-body"><h3>{item.name}</h3><p>{[item.brand, item.color, item.size && `Tam. ${item.size}`].filter(Boolean).join(' · ') || 'Sem detalhes adicionais'}</p>{item.season && <span className="season">{item.season}</span>}</div>
      </article>)}</div>}
    </main>

    {modalOpen && <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && setModalOpen(false)}><div className="modal"><div className="modal-head"><div><span className="eyebrow">{editing ? 'EDITAR PEÇA' : 'NOVA PEÇA'}</span><h2>{editing ? 'Atualize os detalhes' : 'Cadastre uma peça'}</h2></div><button className="icon-btn" onClick={() => setModalOpen(false)}><X size={19} /></button></div><form onSubmit={saveItem}>
      <div className="photo-input"><ImagePlus size={22} /><div><strong>Foto da peça</strong><span>Adicione uma URL de imagem</span></div><input value={form.image_url ?? ''} onChange={e => setForm({...form, image_url: e.target.value})} placeholder="https://..." /></div>
      <label>Nome da peça *<input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ex.: Camiseta preta básica" /></label>
      <div className="form-grid"><label>Categoria<select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>{categories.map(c => <option key={c}>{c}</option>)}</select></label><label>Tamanho<input value={form.size ?? ''} onChange={e => setForm({...form, size: e.target.value})} placeholder="M, 42, 40..." /></label></div>
      <div className="form-grid"><label>Cor<input value={form.color ?? ''} onChange={e => setForm({...form, color: e.target.value})} placeholder="Preto" /></label><label>Marca<input value={form.brand ?? ''} onChange={e => setForm({...form, brand: e.target.value})} placeholder="Nike, Zara..." /></label></div>
      <label>Estação<select value={form.season ?? ''} onChange={e => setForm({...form, season: e.target.value})}><option>Verão</option><option>Inverno</option><option>Meia-estação</option></select></label>
      <label>Observações<textarea rows={3} value={form.notes ?? ''} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Ex.: usar em ocasiões casuais..." /></label>
      <div className="modal-footer"><button type="button" className="secondary-btn" onClick={() => setModalOpen(false)}>Cancelar</button><button className="primary-btn" disabled={saving}>{saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Adicionar peça'}</button></div>
    </form></div></div>}
  </div>
}

function AuthScreen(props: any) { return <div className="auth-screen"><div className="auth-card"><div className="brand auth-brand"><div className="brand-mark"><Shirt size={20} /></div><div><strong>Meu Guarda-Roupa</strong><span>Organize suas peças.</span></div></div><div className="auth-copy"><h1>{props.isRegister ? 'Crie seu guarda-roupa.' : 'Bem-vindo de volta.'}</h1><p>{props.isRegister ? 'Um espaço simples para catalogar tudo o que você tem.' : 'Entre para acessar suas peças e manter tudo organizado.'}</p></div><form onSubmit={props.onSubmit}><label>E-mail<input type="email" required value={props.email} onChange={e => props.setEmail(e.target.value)} placeholder="voce@email.com" /></label><label>Senha<input type="password" required minLength={6} value={props.password} onChange={e => props.setPassword(e.target.value)} placeholder="Mínimo de 6 caracteres" /></label>{props.error && <div className="error">{props.error}</div>}<button className="primary-btn full" type="submit">{props.isRegister ? 'Criar conta' : 'Entrar'}</button></form><button className="switch-auth" onClick={() => props.setIsRegister(!props.isRegister)} >{props.isRegister ? 'Já tenho uma conta' : 'Ainda não tenho conta'}</button></div></div> }

function SetupScreen() { return <div className="center-screen"><div className="setup"><div className="brand-mark"><Shirt size={22} /></div><h1>Quase pronto.</h1><p>Configure as variáveis do Supabase para conectar o aplicativo ao seu banco de dados.</p><code>VITE_SUPABASE_URL<br />VITE_SUPABASE_ANON_KEY</code><p className="muted">Veja o <strong>.env.example</strong> e o <strong>README.md</strong> para os próximos passos.</p></div></div> }

export default App
