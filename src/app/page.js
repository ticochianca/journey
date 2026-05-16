'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // Padrão agora é lista
  const [statuses, setStatuses] = useState([]); // Agora dinâmico
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    origin: '',
    experiences_count: 0,
    phone: '',
    status: '',
    last_interaction: '',
    avisar: 'Nunca',
    observations: ''
  });
  const [avisarOption, setAvisarOption] = useState('Nunca');
  const [selectedMonth, setSelectedMonth] = useState('Janeiro');
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
      setFormData({ name: '', origin: '', experiences_count: 0, phone: '', status: statuses[0] || 'Prospecto', last_interaction: '', avisar: 'Nunca', observations: '' });
      setAvisarOption('Nunca');
      setSelectedMonth('Janeiro');
      fetchData(); // Correção: Chamando fetchData em vez do antigo fetchContacts
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
    <div>
      {/* Barra de Navegação Premium Sticky no Topo */}
      <nav className="navbar">
        <a href="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          Journey<span style={{ color: 'var(--accent)' }}>.</span>
        </a>
        <div className="navbar-menu">
          <a href="/" className="navbar-link active">👥 Pessoas</a>
          <a href="/events" className="navbar-link">🎪 Eventos</a>
          <a href="/settings/statuses" className="navbar-link">⚙️ Status</a>
          <button 
            className="btn" 
            style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', marginLeft: '1rem', padding: '0.4rem 0.8rem', cursor: 'pointer' }}
            onClick={handleLogout}
          >
            Sair
          </button>
        </div>
      </nav>

      <div className="container fade-in" style={{ paddingTop: '2rem' }}>
        <header style={{ borderBottom: 'none', marginBottom: '1.5rem', paddingBottom: 0 }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>Base de Viajantes</h1>
            <p style={{ color: 'var(--text-muted)' }}>Gerencie os contatos da sua rede</p>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            + Novo Viajante
          </button>
        </header>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>Carregando trilha...</div>
        ) : (
          <>
            <div className="contact-list-view">
              {/* Header da Tabela Compacta */}
              <div className="list-item" style={{ background: 'transparent', border: 'none', boxShadow: 'none', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                <div>Nome</div>
                <div>Origem</div>
                <div>Status</div>
                <div>Exp.</div>
                <div>Última Interação</div>
                <div>Avisar</div>
                <div>Ações</div>
              </div>
              
              {/* Linhas da Tabela */}
              {contacts.map((contact) => (
                <div key={contact.id} className="list-item fade-in">
                  <div style={{ fontWeight: '600' }}>{contact.name}</div>
                  <div className="meta" style={{ marginBottom: 0 }}>{contact.origin || '-'}</div>
                  <div>
                    <span className={getStatusClass(contact.status)}>{contact.status || 'Prospecto'}</span>
                  </div>
                  <div style={{ paddingLeft: '0.5rem' }}>{contact.experiences_count}</div>
                  <div>
                    {contact.last_interaction 
                      ? new Date(contact.last_interaction + 'T00:00:00').toLocaleDateString('pt-BR') 
                      : '-'
                    }
                  </div>
                  <div>
                    <span className="badge" style={{ 
                      background: contact.avisar === 'Nunca' ? 'rgba(239, 83, 80, 0.1)' : contact.avisar === 'Sempre' ? 'rgba(102, 187, 106, 0.1)' : 'rgba(66, 165, 245, 0.1)', 
                      color: contact.avisar === 'Nunca' ? '#ef5350' : contact.avisar === 'Sempre' ? '#66bb6a' : '#42a5f5',
                      padding: '0.2rem 0.6rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      borderRadius: '8px'
                    }}>
                      {contact.avisar || 'Nunca'}
                    </span>
                  </div>
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
                
                {/* Campos de data para Última Interação e Notificação */}
                <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label>Última Interação</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={formData.last_interaction}
                      onChange={(e) => setFormData({...formData, last_interaction: e.target.value})}
                    />
                  </div>
                  <div>
                    <label>Avisar</label>
                    <select 
                      className="form-control"
                      value={avisarOption}
                      onChange={(e) => {
                        const opt = e.target.value;
                        setAvisarOption(opt);
                        if (opt === 'Nunca' || opt === 'Sempre') {
                          setFormData({...formData, avisar: opt});
                        } else {
                          setFormData({...formData, avisar: 'A partir de ' + selectedMonth});
                        }
                      }}
                    >
                      <option value="Nunca">Nunca</option>
                      <option value="Sempre">Sempre</option>
                      <option value="mes">A partir do mês...</option>
                    </select>
                  </div>
                </div>

                {avisarOption === 'mes' && (
                  <div className="form-group fade-in">
                    <label>Selecione o mês para avisar</label>
                    <select
                      className="form-control"
                      value={selectedMonth}
                      onChange={(e) => {
                        const m = e.target.value;
                        setSelectedMonth(m);
                        setFormData({...formData, avisar: 'A partir de ' + m});
                      }}
                    >
                      {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                )}

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
    </div>
  );
}
