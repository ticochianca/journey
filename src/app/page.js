'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const ddiOptions = [
  { code: '+55', name: '🇧🇷 Brasil' },
  { code: '+1', name: '🇺🇸 EUA/Canadá' },
  { code: '+351', name: '🇵🇹 Portugal' },
  { code: '+34', name: '🇪🇸 Espanha' },
  { code: '+44', name: '🇬🇧 Reino Unido' },
  { code: '+54', name: '🇦🇷 Argentina' },
  { code: '+56', name: '🇨🇱 Chile' },
  { code: '+598', name: '🇺🇾 Uruguai' },
  { code: '+57', name: '🇨🇴 Colômbia' },
  { code: '+52', name: '🇲🇽 México' },
  { code: '+39', name: '🇮🇹 Itália' },
  { code: '+49', name: '🇩🇪 Alemanha' }
];

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
    avisar: 'Sempre',
    observations: ''
  });
  const [avisarOption, setAvisarOption] = useState('Sempre');
  
  // Próximos 12 meses dinâmicos baseados no dia de hoje
  const getNext12Months = () => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const result = [];
    const now = new Date();
    for (let i = 1; i <= 12; i++) {
      const future = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthName = months[future.getMonth()];
      const shortYear = future.getFullYear().toString().slice(-2);
      result.push(`${monthName}/${shortYear}`);
    }
    return result;
  };

  const [selectedMonth, setSelectedMonth] = useState('');
  const [countryCode, setCountryCode] = useState('+55');
  const [phoneBody, setPhoneBody] = useState('');
  const [isFirstExperience, setIsFirstExperience] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkUser();
    setSelectedMonth(getNext12Months()[0]);
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
    
    // Combina o DDI e o corpo do telefone de forma limpa
    const combinedPhone = phoneBody ? `${countryCode}${phoneBody.replace(/\D/g, '')}` : '';
    
    // Define o número de experiências com base no checkbox de primeira experiência
    const expCount = isFirstExperience ? 0 : parseInt(formData.experiences_count || 1);

    // Sanitiza o campo de data para enviar NULL ao invés de string vazia ""
    const dataToInsert = {
      ...formData,
      phone: combinedPhone,
      experiences_count: expCount,
      last_interaction: formData.last_interaction === '' ? null : formData.last_interaction
    };

    const { data, error } = await supabase
      .from('contacts')
      .insert([dataToInsert]);

    if (error) {
      alert('Erro ao salvar contato: ' + error.message);
    } else {
      setIsModalOpen(false);
      resetFormState();
      fetchData();
    }
  }

  function resetFormState() {
    setFormData({ 
      name: '', 
      origin: '', 
      experiences_count: 0, 
      phone: '', 
      status: statuses[0] || 'Prospecto', 
      last_interaction: '', 
      avisar: 'Sempre', 
      observations: '' 
    });
    setAvisarOption('Sempre');
    setSelectedMonth(getNext12Months()[0]);
    setCountryCode('+55');
    setPhoneBody('');
    setIsFirstExperience(true);
  }

  async function handleStatusChange(contactId, newStatus) {
    const { error } = await supabase
      .from('contacts')
      .update({ status: newStatus })
      .eq('id', contactId);

    if (error) {
      alert('Erro ao atualizar status: ' + error.message);
    } else {
      // Atualização imediata no estado local (UX impecável)
      setContacts(prev => prev.map(c => c.id === contactId ? { ...c, status: newStatus } : c));
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

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

        {/* Busca Rápida e Imediata */}
        <div style={{ marginBottom: '1.5rem' }}>
          <input
            type="text"
            className="form-control"
            placeholder="🔍 Buscar viajante por nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '0.75rem 1.2rem',
              borderRadius: '12px',
              fontSize: '0.95rem',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              border: '1px solid rgba(45, 74, 62, 0.15)'
            }}
          />
        </div>

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
              {filteredContacts.map((contact) => (
                <div key={contact.id} className="list-item fade-in">
                  <div style={{ fontWeight: '600' }}>{contact.name}</div>
                  <div className="meta" style={{ marginBottom: 0 }}>{contact.origin || '-'}</div>
                  <div>
                    {/* Seletor Interativo de Status com Atualização Imediata */}
                    <select 
                      value={contact.status || 'Prospecto'} 
                      className={getStatusClass(contact.status)}
                      onChange={(e) => handleStatusChange(contact.id, e.target.value)}
                      style={{
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        outline: 'none',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        appearance: 'none',
                        textAlign: 'center',
                        display: 'inline-block'
                      }}
                    >
                      {statuses.map(opt => (
                        <option key={opt} value={opt} style={{ color: 'var(--text)', background: 'white' }}>{opt}</option>
                      ))}
                    </select>
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
            
            {filteredContacts.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                Nenhum contato encontrado.
              </p>
            )}
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Novo Viajante</h2>
            <form onSubmit={handleSubmit}>
              
              {/* Informações Obrigatórias */}
              <div className="form-group">
                <label style={{ fontWeight: '600' }}>
                  Nome Completo <span style={{ color: '#ef5350' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Thiago Chianca"
                />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: '600' }}>
                  Telefone <span style={{ color: '#ef5350' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select 
                    className="form-control" 
                    value={countryCode} 
                    onChange={(e) => setCountryCode(e.target.value)}
                    style={{ width: '130px', cursor: 'pointer' }}
                  >
                    {ddiOptions.map(opt => (
                      <option key={opt.code} value={opt.code}>{opt.name} ({opt.code})</option>
                    ))}
                  </select>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="DDD + Número (Ex: 11999999999)"
                    value={phoneBody}
                    onChange={(e) => setPhoneBody(e.target.value)}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: '600' }}>
                  Avisar <span style={{ color: '#ef5350' }}>*</span>
                </label>
                <select 
                  className="form-control"
                  value={avisarOption}
                  onChange={(e) => {
                    const opt = e.target.value;
                    setAvisarOption(opt);
                    if (opt === 'Nunca' || opt === 'Sempre') {
                      setFormData({...formData, avisar: opt});
                    } else {
                      const dynamicMonths = getNext12Months();
                      setFormData({...formData, avisar: 'A partir de ' + (selectedMonth || dynamicMonths[0])});
                    }
                  }}
                >
                  <option value="Sempre">Sempre</option>
                  <option value="Nunca">Nunca</option>
                  <option value="mes">A partir do mês...</option>
                </select>
              </div>

              {avisarOption === 'mes' && (
                <div className="form-group fade-in">
                  <label style={{ fontWeight: '600' }}>
                    Selecione o mês/ano para avisar <span style={{ color: '#ef5350' }}>*</span>
                  </label>
                  <select
                    className="form-control"
                    value={selectedMonth}
                    onChange={(e) => {
                      const m = e.target.value;
                      setSelectedMonth(m);
                      setFormData({...formData, avisar: 'A partir de ' + m});
                    }}
                  >
                    {getNext12Months().map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Caixa de Primeira Experiência (Obrigatória, Sim por padrão) */}
              <div className="form-group" style={{ 
                background: 'rgba(45, 74, 62, 0.05)', 
                padding: '1rem', 
                borderRadius: '12px', 
                border: '1px solid rgba(45, 74, 62, 0.1)',
                marginTop: '1.5rem'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontWeight: '600' }}>
                  <input 
                    type="checkbox" 
                    checked={isFirstExperience} 
                    onChange={(e) => setIsFirstExperience(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span>Primeira experiência com enteógenos?</span>
                </label>

                {!isFirstExperience && (
                  <div className="fade-in" style={{ marginTop: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>
                      Quantas experiências anteriores a pessoa possui? <span style={{ color: '#ef5350' }}>*</span>
                    </label>
                    <input 
                      type="number" 
                      min="1"
                      className="form-control" 
                      value={formData.experiences_count}
                      onChange={(e) => setFormData({...formData, experiences_count: e.target.value})}
                      placeholder="Ex: 3"
                      required={!isFirstExperience}
                    />
                  </div>
                )}
              </div>

              {/* Seção de Campos Opcionais */}
              <div style={{ borderTop: '1px dashed rgba(0,0,0,0.15)', marginTop: '2rem', paddingTop: '1.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '1.2rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Campos Opcionais
                </h4>
                
                <div className="form-group">
                  <label>Quem indicou</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.origin}
                    onChange={(e) => setFormData({...formData, origin: e.target.value})}
                    placeholder="Ex: Amigo X, Instagram"
                  />
                </div>

                <div className="form-group">
                  <label>Observações</label>
                  <textarea 
                    className="form-control" 
                    rows="3"
                    value={formData.observations}
                    onChange={(e) => setFormData({...formData, observations: e.target.value})}
                    placeholder="Histórico, cuidados médicos, detalhes importantes..."
                  ></textarea>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Salvar Viajante</button>
                <button 
                  type="button" 
                  className="btn" 
                  style={{ background: '#eee', justifyContent: 'center' }}
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
