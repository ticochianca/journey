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
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    origin: '',
    experiences_count: 0,
    phone: '',
    status: '',
    last_interaction: '',
    avisar: 'Sempre',
    remedio: 'não informado',
    medications_list: [],
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
  const [openRemedioId, setOpenRemedioId] = useState(null);
  const [adminMedName, setAdminMedName] = useState('');
  const [adminMedDosage, setAdminMedDosage] = useState('');
  const [adminMedFreq, setAdminMedFreq] = useState('');
  const router = useRouter();

  const getRemedioIcon = (val) => {
    const r = val?.toLowerCase() || 'não informado';
    if (r === 'ok') return '✅';
    if (r === 'em andamento') return '⏳';
    if (r === 'não') return '🚫';
    if (r === 'enviando link') return '🔗';
    return '❓';
  };

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
    
    // Define o número de experiências com base no checkbox de primeira experiência. Fallback para 1 caso esteja vazio.
    const expCount = isFirstExperience ? 0 : (parseInt(formData.experiences_count) || 1);

    // Sanitiza o campo de data para enviar NULL ao invés de string vazia ""
    const dataToSave = {
      name: formData.name,
      cpf: formData.cpf ? formData.cpf.replace(/\D/g, '') : '',
      origin: formData.origin,
      experiences_count: expCount,
      phone: combinedPhone,
      status: formData.status || statuses[0] || 'Prospecto',
      last_interaction: formData.last_interaction === '' ? null : formData.last_interaction,
      avisar: formData.avisar,
      remedio: formData.remedio || 'não informado',
      medications_list: formData.medications_list || [],
      observations: formData.observations
    };

    if (editingContact) {
      const { error } = await supabase
        .from('contacts')
        .update(dataToSave)
        .eq('id', editingContact.id);

      if (error) {
        alert('Erro ao atualizar viajante: ' + error.message);
      } else {
        setIsModalOpen(false);
        resetFormState();
        fetchData();
      }
    } else {
      const { error } = await supabase
        .from('contacts')
        .insert([dataToSave]);

      if (error) {
        alert('Erro ao salvar contato: ' + error.message);
      } else {
        setIsModalOpen(false);
        resetFormState();
        fetchData();
      }
    }
  }

  function resetFormState() {
    setEditingContact(null);
    setFormData({ 
      name: '', 
      cpf: '',
      origin: '', 
      experiences_count: 0, 
      phone: '', 
      status: statuses[0] || 'Prospecto', 
      last_interaction: '', 
      avisar: 'Sempre', 
      remedio: 'não informado',
      medications_list: [],
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

  async function handleAvisarChange(contactId, newAvisar) {
    const { error } = await supabase
      .from('contacts')
      .update({ avisar: newAvisar })
      .eq('id', contactId);

    if (error) {
      alert('Erro ao atualizar notificação: ' + error.message);
    } else {
      // Atualização imediata no estado local
      setContacts(prev => prev.map(c => c.id === contactId ? { ...c, avisar: newAvisar } : c));
    }
  }

  const getAvisarOptions = () => {
    const list = ['Sempre', 'Nunca'];
    getNext12Months().forEach(m => {
      list.push(`A partir de ${m}`);
    });
    return list;
  };

  const getAvisarStyle = (avisar) => {
    const val = avisar || 'Nunca';
    const baseStyle = {
      border: 'none',
      cursor: 'pointer',
      fontWeight: '600',
      outline: 'none',
      padding: '0.25rem 0.5rem',
      borderRadius: '8px',
      fontSize: '0.75rem',
      appearance: 'none',
      textAlign: 'center',
      display: 'inline-block'
    };

    if (val === 'Nunca') {
      return {
        ...baseStyle,
        background: 'rgba(239, 83, 80, 0.1)',
        color: '#ef5350'
      };
    } else if (val === 'Sempre') {
      return {
        ...baseStyle,
        background: 'rgba(102, 187, 106, 0.1)',
        color: '#66bb6a'
      };
    } else {
      return {
        ...baseStyle,
        background: 'rgba(66, 165, 245, 0.1)',
        color: '#42a5f5'
      };
    }
  };

  const remedioOptions = [
    { value: 'não informado', label: '❓ Não informado' },
    { value: 'ok', label: '✅ Ok' },
    { value: 'em andamento', label: '⏳ Em andamento' },
    { value: 'não', label: '🚫 Não' },
    { value: 'enviando link', label: '🔗 Enviando link' }
  ];

  async function handleRemedioChange(contactId, newRemedio) {
    const { error } = await supabase
      .from('contacts')
      .update({ remedio: newRemedio })
      .eq('id', contactId);

    if (error) {
      alert('Erro ao atualizar remédio: ' + error.message);
    } else {
      // Atualização imediata no estado local
      setContacts(prev => prev.map(c => c.id === contactId ? { ...c, remedio: newRemedio } : c));

      // Se for "enviando link", abre o WhatsApp com o link dinâmico preenchido!
      if (newRemedio === 'enviando link') {
        const contact = contacts.find(c => c.id === contactId);
        if (contact && contact.phone) {
          const cleanPhone = contact.phone.replace(/\D/g, '');
          const firstName = contact.name.split(' ')[0];
          const publicLink = `${window.location.origin}/ficha?nome=${encodeURIComponent(contact.name)}`;
          const message = `Olá, ${firstName}! Por favor, preenche algumas informações sobre remédios que você está tomando.\n\nAlguns remédios interferem na experiência, ou mesmo inviabilizam ela.\n\nLink seguro para preenchimento: ${publicLink}`;
          
          window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`, '_blank');
        } else {
          alert('Este viajante não tem telefone cadastrado para o envio da ficha.');
        }
      }
    }
  }

  const getRemedioStyle = (remedio) => {
    const val = remedio || 'não informado';
    const baseStyle = {
      border: 'none',
      cursor: 'pointer',
      fontWeight: '600',
      outline: 'none',
      padding: '0.25rem 0.5rem',
      borderRadius: '8px',
      fontSize: '0.75rem',
      appearance: 'none',
      textAlign: 'center',
      display: 'inline-block'
    };

    if (val === 'ok') {
      return {
        ...baseStyle,
        background: 'rgba(102, 187, 106, 0.1)',
        color: '#66bb6a'
      };
    } else if (val === 'em andamento') {
      return {
        ...baseStyle,
        background: 'rgba(255, 167, 38, 0.1)',
        color: '#ffa726'
      };
    } else if (val === 'não') {
      return {
        ...baseStyle,
        background: 'rgba(239, 83, 80, 0.1)',
        color: '#ef5350'
      };
    } else if (val === 'enviando link') {
      return {
        ...baseStyle,
        background: 'rgba(66, 165, 245, 0.1)',
        color: '#42a5f5'
      };
    } else {
      return {
        ...baseStyle,
        background: 'rgba(158, 158, 158, 0.15)',
        color: '#9e9e9e'
      };
    }
  };

  const handleOpenContact = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name || '',
      cpf: contact.cpf || '',
      origin: contact.origin || '',
      experiences_count: contact.experiences_count || 0,
      phone: contact.phone || '',
      status: contact.status || '',
      last_interaction: contact.last_interaction || '',
      avisar: contact.avisar || 'Sempre',
      remedio: contact.remedio || 'não informado',
      medications_list: contact.medications_list || [],
      observations: contact.observations || ''
    });

    const phoneVal = contact.phone || '';
    let foundDdi = '+55';
    let foundBody = phoneVal;

    const sortedDdis = [...ddiOptions].sort((a, b) => b.code.length - a.code.length);
    for (const opt of sortedDdis) {
      if (phoneVal.startsWith(opt.code)) {
        foundDdi = opt.code;
        foundBody = phoneVal.slice(opt.code.length);
        break;
      }
    }
    setCountryCode(foundDdi);
    setPhoneBody(foundBody);
    setIsFirstExperience(contact.experiences_count === 0);

    if (contact.avisar === 'Sempre' || contact.avisar === 'Nunca') {
      setAvisarOption(contact.avisar);
    } else if (contact.avisar?.startsWith('A partir de ')) {
      setAvisarOption('mes');
      setSelectedMonth(contact.avisar.replace('A partir de ', ''));
    } else {
      setAvisarOption('Sempre');
    }

    setIsModalOpen(true);
  };

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
                <div>Status</div>
                <div>Exp.</div>
                <div>Última Interação</div>
                <div>Remédio</div>
                <div>Avisar</div>
                <div>Ações</div>
              </div>
              
              {/* Linhas da Tabela */}
              {filteredContacts.map((contact) => (
                <div 
                  key={contact.id} 
                  className="list-item fade-in"
                  style={{
                    position: 'relative',
                    zIndex: openRemedioId === contact.id ? 100 : 1
                  }}
                >
                  <div style={{ fontWeight: '600' }}>{contact.name}</div>
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
                  <div style={{ position: 'relative' }}>
                    {/* Seletor Interativo Customizado de Remédio */}
                    <button
                      type="button"
                      onClick={() => setOpenRemedioId(openRemedioId === contact.id ? null : contact.id)}
                      style={{
                        ...getRemedioStyle(contact.remedio),
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        fontSize: '1.1rem',
                        border: '1px solid rgba(0,0,0,0.08)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                        transition: 'all 0.2s ease',
                        padding: 0
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.12)';
                        e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.12)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)';
                      }}
                    >
                      {getRemedioIcon(contact.remedio)}
                    </button>
                    
                    {openRemedioId === contact.id && (
                      <>
                        {/* Overlay invisível para capturar o clique fora com zIndex altíssimo */}
                        <div 
                          onClick={() => setOpenRemedioId(null)} 
                          style={{ position: 'fixed', inset: 0, zIndex: 9999 }} 
                        />
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          marginTop: '0.5rem',
                          background: '#ffffff',
                          border: '1px solid rgba(45, 74, 62, 0.15)',
                          borderRadius: '10px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                          zIndex: 10000,
                          width: '160px',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '0.3rem'
                        }}>
                          {remedioOptions.map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                handleRemedioChange(contact.id, opt.value);
                                setOpenRemedioId(null);
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                padding: '0.6rem 0.8rem',
                                borderRadius: '6px',
                                textAlign: 'left',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.6rem',
                                color: '#2d4a3e', // Texto escuro de alto contraste garantido
                                fontWeight: contact.remedio === opt.value ? '600' : 'normal',
                                backgroundColor: contact.remedio === opt.value ? 'rgba(45, 74, 62, 0.08)' : 'transparent',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                if (contact.remedio !== opt.value) {
                                  e.currentTarget.style.backgroundColor = 'rgba(45, 74, 62, 0.04)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (contact.remedio !== opt.value) {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }
                              }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <div>
                    <select
                      value={contact.avisar || 'Nunca'}
                      onChange={(e) => handleAvisarChange(contact.id, e.target.value)}
                      style={getAvisarStyle(contact.avisar)}
                    >
                      {getAvisarOptions().map(opt => (
                        <option key={opt} value={opt} style={{ color: 'var(--text)', background: 'white' }}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <button 
                      className="btn" 
                      style={{ 
                        padding: '0.4rem 0.8rem', 
                        fontSize: '0.8rem', 
                        background: 'rgba(45, 74, 62, 0.1)', 
                        color: 'var(--primary)',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleOpenContact(contact)}
                    >
                      Abrir
                    </button>
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
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>
              {editingContact ? "Visualizar / Editar Viajante" : "Novo Viajante"}
            </h2>
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
                <label style={{ fontWeight: '600' }}>CPF</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.cpf || ''}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length > 11) value = value.slice(0, 11);
                    
                    if (value.length > 9) {
                      value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9)}`;
                    } else if (value.length > 6) {
                      value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6)}`;
                    } else if (value.length > 3) {
                      value = `${value.slice(0, 3)}.${value.slice(3)}`;
                    }
                    setFormData({...formData, cpf: value});
                  }}
                  placeholder="000.000.000-00"
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

              <div className="form-group">
                <label style={{ fontWeight: '600' }}>Remédio (Status Geral)</label>
                <select 
                  className="form-control"
                  value={formData.remedio || 'não informado'}
                  onChange={(e) => setFormData({...formData, remedio: e.target.value})}
                  style={{ cursor: 'pointer' }}
                >
                  {remedioOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Lista Detalhada de Medicamentos com Inclusão Manual */}
              <div style={{
                marginTop: '1rem',
                background: 'rgba(0,0,0,0.02)',
                padding: '1rem',
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.8rem'
              }}>
                <label style={{ fontWeight: '600', display: 'block', fontSize: '0.9rem', color: 'var(--primary)', margin: 0 }}>
                  Lista Detalhada de Remédios ({formData.medications_list?.length || 0})
                </label>
                
                {formData.medications_list && formData.medications_list.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {formData.medications_list.map((med, idx) => (
                      <div 
                        key={idx} 
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: 'white',
                          padding: '0.5rem 0.8rem',
                          borderRadius: '8px',
                          border: '1px solid rgba(0,0,0,0.05)',
                          fontSize: '0.8rem'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                          <span style={{ fontWeight: '600', color: 'var(--text)' }}>💊 {med.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dose: {med.dosage} | Freq: {med.frequency}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formData.medications_list.filter((_, i) => i !== idx);
                            setFormData({
                              ...formData,
                              medications_list: updated,
                              remedio: updated.length === 0 ? 'não' : formData.remedio
                            });
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef5350',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.75rem',
                            padding: '0.2rem 0.4rem',
                            borderRadius: '4px'
                          }}
                          onMouseEnter={(e) => e.target.style.background = 'rgba(239, 83, 80, 0.1)'}
                          onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
                    Nenhum medicamento detalhado cadastrado.
                  </p>
                )}

                {/* Sub-form para Adicionar Medicamento Manualmente */}
                <div style={{
                  borderTop: '1px solid rgba(0,0,0,0.06)',
                  marginTop: '0.4rem',
                  paddingTop: '0.6rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)', display: 'block' }}>
                    + Adicionar Remédio à Ficha
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.4rem' }}>
                    <input 
                      type="text"
                      className="form-control"
                      placeholder="Nome do remédio"
                      value={adminMedName}
                      onChange={(e) => setAdminMedName(e.target.value)}
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', height: '32px' }}
                    />
                    <input 
                      type="text"
                      className="form-control"
                      placeholder="Dose (Ex: 50mg)"
                      value={adminMedDosage}
                      onChange={(e) => setAdminMedDosage(e.target.value)}
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', height: '32px' }}
                    />
                    <input 
                      type="text"
                      className="form-control"
                      placeholder="Freq (Ex: 1x/dia)"
                      value={adminMedFreq}
                      onChange={(e) => setAdminMedFreq(e.target.value)}
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', height: '32px' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!adminMedName.trim()) return;
                      const newMed = {
                        name: adminMedName.trim(),
                        dosage: adminMedDosage.trim() || 'Não informada',
                        frequency: adminMedFreq.trim() || 'Não informada'
                      };
                      const currentList = formData.medications_list || [];
                      setFormData({
                        ...formData,
                        medications_list: [...currentList, newMed],
                        remedio: 'em andamento' // Define automaticamente como "em andamento" para revisão
                      });
                      setAdminMedName('');
                      setAdminMedDosage('');
                      setAdminMedFreq('');
                    }}
                    style={{
                      background: 'rgba(45, 74, 62, 0.1)',
                      color: 'var(--primary)',
                      border: '1px solid rgba(45, 74, 62, 0.2)',
                      padding: '0.4rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(45, 74, 62, 0.18)'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(45, 74, 62, 0.1)'}
                  >
                    Incluir na Ficha
                  </button>
                </div>
              </div>

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
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsFirstExperience(checked);
                      // Se desmarcou e estava 0, vira 1 automaticamente
                      if (!checked && (formData.experiences_count === 0 || formData.experiences_count === '0' || !formData.experiences_count)) {
                        setFormData({...formData, experiences_count: 1});
                      }
                    }}
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
