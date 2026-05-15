'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [statuses, setStatuses] = useState([]); // Agora dinâmico
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    origin: '',
    experiences_count: 0,
    phone: '',
    status: '',
    observations: ''
  });
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    } else {
      setUser(user);
      fetchData();
    }
  }

  async function fetchData() {
    setLoading(true);
    
    // Buscar contatos
    const { data: contactData } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Buscar status cadastrados
    const { data: statusData } = await supabase
      .from('statuses')
      .select('name')
      .order('name');

    if (contactData) setContacts(contactData);
    if (statusData) {
      setStatuses(statusData.map(s => s.name));
      if (!formData.status && statusData.length > 0) {
        setFormData(prev => ({ ...prev, status: statusData[0].name }));
      }
    }
    
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const { data, error } = await supabase
      .from('contacts')
      .insert([formData]);

    if (error) {
      alert('Erro ao salvar contato: ' + error.message);
    } else {
      setIsModalOpen(false);
      setFormData({ name: '', origin: '', experiences_count: 0, phone: '', status: 'Prospecto', observations: '' });
      fetchContacts();
    }
  }

  const openWhatsApp = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const getStatusClass = (status) => {
    const s = status?.toLowerCase().replace(' ', '-') || 'prospecto';
    return `status-badge status-${s}`;
  };

  if (!user) return <div style={{ textAlign: 'center', padding: '5rem' }}>Verificando acesso...</div>;

  return (
    <div className="container fade-in">
      <header>
        <div>
          <h1>Journey</h1>
          <p style={{ color: 'var(--text-muted)' }}>Bem-vindo, {user.email}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            + Novo Contato
          </button>
          <button className="btn" style={{ background: '#eee' }} onClick={() => router.push('/settings/statuses')}>
            Configurar Status
          </button>
          <button className="btn" style={{ background: '#eee' }} onClick={handleLogout}>
            Sair
          </button>
        </div>
      </header>

      <div className="view-toggle">
        <button 
          className={viewMode === 'grid' ? 'active' : ''} 
          onClick={() => setViewMode('grid')}
        >
          Grid
        </button>
        <button 
          className={viewMode === 'list' ? 'active' : ''} 
          onClick={() => setViewMode('list')}
        >
          Lista
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Carregando trilha...</div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="contact-grid">
              {contacts.map((contact) => (
                <div key={contact.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0 }}>{contact.name}</h3>
                    <span className={getStatusClass(contact.status)}>{contact.status || 'Prospecto'}</span>
                  </div>
                  <div className="meta">Origem: {contact.origin || 'Não informada'}</div>
                  <div className="stats">
                    <span className="badge">{contact.experiences_count} Experiências</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                    {contact.observations}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {contact.phone && (
                      <button 
                        className="btn btn-whatsapp" 
                        onClick={() => openWhatsApp(contact.phone)}
                      >
                        WhatsApp
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="contact-list-view">
              <div className="list-item" style={{ background: 'transparent', border: 'none', boxShadow: 'none', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                <div>Nome</div>
                <div>Origem</div>
                <div>Status</div>
                <div>Exp.</div>
                <div>Ações</div>
              </div>
              {contacts.map((contact) => (
                <div key={contact.id} className="list-item fade-in">
                  <div style={{ fontWeight: '600' }}>{contact.name}</div>
                  <div className="meta" style={{ marginBottom: 0 }}>{contact.origin || '-'}</div>
                  <div>
                    <span className={getStatusClass(contact.status)}>{contact.status || 'Prospecto'}</span>
                  </div>
                  <div>{contact.experiences_count}</div>
                  <div>
                    {contact.phone && (
                      <button 
                        className="btn btn-whatsapp" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        onClick={() => openWhatsApp(contact.phone)}
                      >
                        Zap
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {contacts.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              Nenhum contato encontrado.
            </p>
          )}
        </>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Novo Viajante</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome Completo</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Origem</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.origin}
                    onChange={(e) => setFormData({...formData, origin: e.target.value})}
                  />
                </div>
                <div>
                  <label>Status</label>
                  <select 
                    className="form-control"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    {statuses.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Experiências</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={formData.experiences_count}
                    onChange={(e) => setFormData({...formData, experiences_count: e.target.value})}
                  />
                </div>
                <div>
                  <label>Telefone</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ex: 5511999999999"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Observações</label>
                <textarea 
                  className="form-control" 
                  rows="3"
                  value={formData.observations}
                  onChange={(e) => setFormData({...formData, observations: e.target.value})}
                ></textarea>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Salvar</button>
                <button 
                  type="button" 
                  className="btn" 
                  style={{ background: '#eee' }}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
