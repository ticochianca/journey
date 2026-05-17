'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EventDetail({ params }) {
  const [eventId, setEventId] = useState(null);
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [availableContacts, setAvailableContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState(new Set());
  const [activeRemedioSelect, setActiveRemedioSelect] = useState(null);
  const [activeFichaContact, setActiveFichaContact] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Resolve params de forma compatível com Next.js antigo (síncrono) e novo (assíncrono)
    Promise.resolve(params).then((resolved) => {
      if (resolved && resolved.id) {
        setEventId(resolved.id);
      }
    });
  }, [params]);

  useEffect(() => {
    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  async function fetchEventData() {
    setLoading(true);
    
    // Fetch Event Details
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventData) setEvent(eventData);

    // Fetch Participants
    const { data: partData } = await supabase
      .from('event_participants')
      .select('*, contacts(*)')
      .eq('event_id', eventId);
      
    if (partData) setParticipants(partData);
    
    setLoading(false);
  }

  async function openImportModal() {
    // Fetch all contacts
    const { data: allContacts } = await supabase
      .from('contacts')
      .select('*')
      .order('name');
      
    // Filter out those already in the event
    const participantIds = new Set(participants.map(p => p.contact_id));
    const available = allContacts.filter(c => !participantIds.has(c.id));
    
    setAvailableContacts(available);
    setSelectedContactIds(new Set());
    setIsImportModalOpen(true);
  }

  function toggleContactSelection(id) {
    const newSelection = new Set(selectedContactIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedContactIds(newSelection);
  }

  async function handleImport() {
    if (selectedContactIds.size === 0) return;
    
    const inserts = Array.from(selectedContactIds).map(contact_id => ({
      event_id: eventId,
      contact_id: contact_id,
      status: 'Confirmado',
      date1_confirmed: true,
      date2_confirmed: true
    }));

    const { error } = await supabase
      .from('event_participants')
      .insert(inserts);

    if (error) {
      alert('Erro ao importar viajantes: ' + error.message);
    } else {
      setIsImportModalOpen(false);
      fetchEventData(); // refresh list
    }
  }

  async function removeParticipant(contactId) {
    if (!confirm('Remover esta pessoa da cerimônia?')) return;
    
    const { error } = await supabase
      .from('event_participants')
      .delete()
      .match({ event_id: eventId, contact_id: contactId });
      
    if (!error) {
      fetchEventData();
    }
  }

  async function toggleDayPresence(contactId, day, currentStatus) {
    const field = day === 1 ? 'date1_confirmed' : 'date2_confirmed';
    const { error } = await supabase
      .from('event_participants')
      .update({ [field]: !currentStatus })
      .match({ event_id: eventId, contact_id: contactId });
      
    if (!error) {
      setParticipants(prev => prev.map(p => 
        p.contact_id === contactId ? { ...p, [field]: !currentStatus } : p
      ));
    }
  }

  async function updateParticipantStatus(contactId, newStatus) {
    const { error } = await supabase
      .from('event_participants')
      .update({ status: newStatus })
      .match({ event_id: eventId, contact_id: contactId });
      
    if (!error) {
      setParticipants(prev => prev.map(p => 
        p.contact_id === contactId ? { ...p, status: newStatus } : p
      ));
    }
  }

  async function updateRemedioStatus(contactId, newStatus) {
    const { error } = await supabase
      .from('event_participants')
      .update({ remedio_status: newStatus })
      .match({ event_id: eventId, contact_id: contactId });
      
    if (!error) {
      setParticipants(prev => prev.map(p => 
        p.contact_id === contactId ? { ...p, remedio_status: newStatus } : p
      ));
    }
  }

  async function togglePago(contactId, currentStatus) {
    const { error } = await supabase
      .from('event_participants')
      .update({ pago: !currentStatus })
      .match({ event_id: eventId, contact_id: contactId });
      
    if (!error) {
      setParticipants(prev => prev.map(p => 
        p.contact_id === contactId ? { ...p, pago: !currentStatus } : p
      ));
    }
  }

  async function updateVagaStatus(contactId, newStatus) {
    const { error } = await supabase
      .from('event_participants')
      .update({ vaga: newStatus })
      .match({ event_id: eventId, contact_id: contactId });
      
    if (!error) {
      setParticipants(prev => prev.map(p => 
        p.contact_id === contactId ? { ...p, vaga: newStatus } : p
      ));
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '5rem' }}>Carregando cerimônia...</div>;
  if (!event) return <div style={{ textAlign: 'center', padding: '5rem' }}>Cerimônia não encontrada.</div>;

  const hasTwoDates = !!event.date2;

  const remedioOptions = [
    { value: 'enviar', label: 'Enviar', icon: '✉️', color: '#bbb' },
    { value: 'enviado', label: 'Enviado', icon: '📲', color: '#5dade2' },
    { value: 'preenchido', label: 'Preenchido', icon: '📝', color: '#f39c12' },
    { value: 'Ok', label: 'Ok', icon: '✅', color: '#27ae60' },
    { value: 'Ok Manual', label: 'Ok Manual', icon: '🛡️', color: '#8e44ad' }
  ];

  return (
    <div>
      {/* Barra de Navegação Premium Sticky no Topo */}
      <nav className="navbar">
        <a href="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          Journey<span style={{ color: 'var(--accent)' }}>.</span>
        </a>
        <div className="navbar-menu">
          <a href="/" className="navbar-link">👥 Pessoas</a>
          <a href="/events" className="navbar-link active">🎪 Cerimônias</a>
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

      <div className="container fade-in" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
        <div style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          background: '#fdfbf7', // Ivory paper color
          borderRadius: '8px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
          padding: '3rem 3.5rem',
          fontFamily: '"Lora", "Georgia", serif',
          color: '#333',
          minHeight: '75vh',
          boxSizing: 'border-box'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #d4cbb8', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <Link href="/events" style={{ display: 'inline-block', marginBottom: '1.5rem', textDecoration: 'none', color: '#888', fontSize: '0.75rem', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'sans-serif' }}>
                ← Voltar às Cerimônias
              </Link>
              <h1 style={{ fontSize: '2.5rem', color: '#1a1a1a', margin: '0 0 1rem 0', fontWeight: 'normal' }}>
                {event.name}
              </h1>
              <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', color: '#555', fontStyle: 'italic', letterSpacing: '0.5px' }}>
                <div>
                  <span style={{ fontFamily: 'sans-serif', fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#2d4a3e', marginRight: '0.5rem' }}>Dia I</span>
                  {event.date ? new Date(event.date + 'T00:00:00').toLocaleDateString('pt-BR') : 'Data pendente'}
                </div>
                {event.date2 && (
                  <div>
                    <span style={{ fontFamily: 'sans-serif', fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#2d4a3e', marginRight: '0.5rem' }}>Dia II</span>
                    {new Date(event.date2 + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>
              {event.description && (
                <p style={{ color: '#666', lineHeight: '1.6', fontSize: '1rem', fontStyle: 'italic', marginTop: '1.5rem', marginBottom: 0, maxWidth: '800px' }}>
                  {event.description}
                </p>
              )}
            </div>
            
            <button onClick={openImportModal} style={{ background: 'transparent', border: '1px solid #2d4a3e', color: '#2d4a3e', padding: '0.5rem 1.5rem', borderRadius: '20px', fontSize: '0.75rem', letterSpacing: '1.5px', cursor: 'pointer', fontFamily: 'sans-serif', textTransform: 'uppercase', transition: 'all 0.3s' }} onMouseEnter={(e) => { e.target.style.background = '#2d4a3e'; e.target.style.color = '#fff'; }} onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#2d4a3e'; }}>
              + Adicionar Viajantes
            </button>
          </div>

          {/* Participant list layout */}
          {participants.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <p style={{ color: '#aaa', fontStyle: 'italic', fontSize: '1.05rem' }}>Esta cerimônia ainda não possui viajantes.</p>
              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={openImportModal}>Adicionar Viajantes</button>
            </div>
          ) : (
            <div>
              {/* Header Titles */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr 1fr 1.8fr 0.5fr', padding: '0 0 1rem 0', borderBottom: '2px solid #2d4a3e', fontWeight: 'bold', fontSize: '0.8rem', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: 'sans-serif', color: '#2d4a3e' }}>
                <div>Viajante</div>
                <div>Dias</div>
                <div>Status</div>
                <div>Remédio</div>
                <div>Pago</div>
                <div>Vaga</div>
                <div style={{ textAlign: 'right' }}>Ações</div>
              </div>

              {/* Items */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {participants.map((p) => {
                  const hasRemedioAccess = p.status === 'intenção de ir' || p.status === 'Confirmado';
                  
                  // Obter o status atual do remédio
                  const currentRemedio = remedioOptions.find(o => o.value === (p.remedio_status || 'enviar')) || remedioOptions[0];

                  // Estilização e cálculo da vaga
                  let badgeText = 'Livre';
                  let badgeStyle = {
                    background: 'rgba(0,0,0,0.04)',
                    border: '1px dashed #ccc',
                    color: '#888'
                  };

                  if (p.vaga === 'Comprometido') {
                    badgeText = 'Comprometido';
                    badgeStyle = {
                      background: 'rgba(155, 89, 182, 0.1)',
                      border: '1px solid rgba(155, 89, 182, 0.3)',
                      color: '#7d3c98'
                    };
                  } else {
                    const hasRemedioOk = p.remedio_status === 'Ok' || p.remedio_status === 'Ok Manual';
                    const hasRemedioPreenchidoOrOk = p.remedio_status === 'preenchido' || p.remedio_status === 'Ok' || p.remedio_status === 'Ok Manual';
                    const hasIntencaoOrHigher = p.status === 'intenção de ir' || p.status === 'Confirmado';
                    const isConfirmado = p.status === 'Confirmado';

                    if (hasRemedioOk && p.pago) {
                      badgeText = 'Confirmado';
                      badgeStyle = {
                        background: 'rgba(46, 204, 113, 0.15)',
                        border: '1px solid rgba(46, 204, 113, 0.4)',
                        color: '#1e8449'
                      };
                    } else if (isConfirmado && hasRemedioPreenchidoOrOk) {
                      badgeText = 'Confirmado';
                      badgeStyle = {
                        background: 'rgba(52, 152, 219, 0.15)',
                        border: '1px solid rgba(52, 152, 219, 0.4)',
                        color: '#2471a3'
                      };
                    } else if (hasIntencaoOrHigher && hasRemedioPreenchidoOrOk) {
                      badgeText = 'Reservado';
                      badgeStyle = {
                        background: 'rgba(241, 196, 15, 0.15)',
                        border: '1px solid rgba(241, 196, 15, 0.4)',
                        color: '#b7950b'
                      };
                    }
                  }

                  return (
                    <div key={p.contact_id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr 1fr 1.8fr 0.5fr', alignItems: 'center', padding: '1.2rem 0', borderBottom: '1px solid #e5dfd3', transition: 'background-color 0.2s', opacity: p.status === 'desistiu' ? 0.4 : 1 }}>
                      {/* 1. Viajante (Nome & Telefone) */}
                      <div>
                        <div style={{ fontSize: '1.1rem', color: '#1a1a1a', fontWeight: '500' }}>{p.contacts?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#888', letterSpacing: '0.5px', fontFamily: 'sans-serif', marginTop: '0.2rem' }}>{p.contacts?.phone || 'Sem telefone'}</div>
                      </div>

                      {/* 2. Dias Confirmados */}
                      <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                         <button onClick={() => toggleDayPresence(p.contact_id, 1, p.date1_confirmed)} style={{ background: 'transparent', border: 'none', color: p.date1_confirmed ? '#2d4a3e' : '#bbb', fontStyle: 'italic', fontSize: '0.9rem', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontWeight: p.date1_confirmed ? 'bold' : 'normal' }} title="Alternar Dia I">
                           {p.date1_confirmed ? 'D1' : <s>D1</s>}
                         </button>
                         {hasTwoDates && (
                           <button onClick={() => toggleDayPresence(p.contact_id, 2, p.date2_confirmed)} style={{ background: 'transparent', border: 'none', color: p.date2_confirmed ? '#2d4a3e' : '#bbb', fontStyle: 'italic', fontSize: '0.9rem', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontWeight: p.date2_confirmed ? 'bold' : 'normal' }} title="Alternar Dia II">
                             {p.date2_confirmed ? 'D2' : <s>D2</s>}
                           </button>
                         )}
                      </div>

                      {/* 3. Status da Cerimônia */}
                      <div>
                        <select 
                          value={p.status || 'Confirmado'} 
                          onChange={(e) => updateParticipantStatus(p.contact_id, e.target.value)}
                          style={{
                            background: 'transparent',
                            border: '1px solid #d4cbb8',
                            borderRadius: '4px',
                            padding: '0.35rem 0.6rem',
                            fontFamily: '"Lora", serif',
                            fontStyle: 'italic',
                            color: '#2d4a3e',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            outline: 'none',
                            width: '90%'
                          }}
                        >
                          <option value="avisar">Avisar</option>
                          <option value="avisado">Avisado</option>
                          <option value="intenção de ir">Intenção de ir</option>
                          <option value="Confirmado">Confirmado</option>
                          <option value="desistiu">Desistiu</option>
                        </select>
                      </div>

                      {/* 4. Remédio Dropdown (Custom Popover) */}
                      <div>
                        {hasRemedioAccess ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                              <button
                                onClick={() => setActiveRemedioSelect(activeRemedioSelect === p.contact_id ? null : p.contact_id)}
                                style={{
                                  background: 'transparent',
                                  border: '1px solid #d4cbb8',
                                  borderRadius: '4px',
                                  padding: '0.3rem 0.5rem',
                                  cursor: 'pointer',
                                  fontSize: '1.1rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  transition: 'all 0.2s',
                                }}
                                title={`Status do Remédio: ${currentRemedio.label}`}
                              >
                                <span>{currentRemedio.icon}</span>
                                <span style={{ fontSize: '0.5rem', color: '#888' }}>▼</span>
                              </button>

                              {activeRemedioSelect === p.contact_id && (
                                <>
                                  {/* Overlay para fechar popover no clique fora */}
                                  <div 
                                    onClick={() => setActiveRemedioSelect(null)}
                                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }}
                                  />
                                  <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    marginTop: '5px',
                                    background: 'white',
                                    border: '1px solid #d4cbb8',
                                    borderRadius: '6px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    zIndex: 999,
                                    minWidth: '165px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: '0.4rem 0'
                                  }}>
                                    {remedioOptions.map(opt => (
                                      <button
                                        key={opt.value}
                                        onClick={() => {
                                          updateRemedioStatus(p.contact_id, opt.value);
                                          setActiveRemedioSelect(null);
                                        }}
                                        style={{
                                          background: (p.remedio_status || 'enviar') === opt.value ? '#f5f3ef' : 'transparent',
                                          border: 'none',
                                          padding: '0.6rem 1rem',
                                          textAlign: 'left',
                                          cursor: 'pointer',
                                          fontFamily: 'sans-serif',
                                          fontSize: '0.85rem',
                                          color: '#333',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.6rem',
                                          width: '100%',
                                          transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.background = '#f5f3ef'}
                                        onMouseLeave={(e) => {
                                          if ((p.remedio_status || 'enviar') !== opt.value) {
                                            e.target.style.background = 'transparent';
                                          }
                                        }}
                                      >
                                        <span style={{ fontSize: '1.1rem' }}>{opt.icon}</span>
                                        <span>{opt.label}</span>
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>

                            {/* WhatsApp Send Icon */}
                            <button
                              onClick={() => {
                                const cleanPhone = p.contacts?.phone?.replace(/\D/g, '') || '';
                                if (!cleanPhone) {
                                  alert('Este viajante não tem telefone cadastrado para o envio da ficha.');
                                  return;
                                }
                                const publicLink = `${window.location.origin}/ficha?nome=${encodeURIComponent(p.contacts?.name || '')}`;
                                const firstName = p.contacts?.name?.split(' ')[0] || '';
                                const message = `Oi, ${firstName}! Por favor, preenche algumas informações sobre remédios que você está tomando.\n\nAlguns remédios interferem na experiência, ou mesmo inviabilizam ela.\n\nLink seguro para preenchimento: ${publicLink}`;
                                window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`, '_blank');
                                
                                // Auto update status to "enviado"
                                updateRemedioStatus(p.contact_id, 'enviado');
                              }}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem', opacity: 0.75 }}
                              title="Enviar ficha por WhatsApp (Muda status para Enviado)"
                            >
                              📲
                            </button>

                            {/* Copy Link Icon */}
                            <button
                              onClick={() => {
                                const publicLink = `${window.location.origin}/ficha?nome=${encodeURIComponent(p.contacts?.name || '')}`;
                                navigator.clipboard.writeText(publicLink);
                                alert('Link da ficha copiado para a área de transferência!');
                              }}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem', opacity: 0.75 }}
                              title="Copiar Link da Ficha Pública"
                            >
                              🔗
                            </button>

                            {/* View Ficha Icon */}
                            <button
                              onClick={() => {
                                if (p.contacts) {
                                  setActiveFichaContact(p.contacts);
                                }
                              }}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.15rem', opacity: 0.75 }}
                              title="Ver Ficha / Arquivo do Viajante"
                            >
                              👁️
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: '#ccc', fontStyle: 'italic', fontSize: '0.85rem' }}>Indisponível</span>
                        )}
                      </div>

                      {/* 5. Pago Toggle */}
                      <div>
                        <button 
                          onClick={() => togglePago(p.contact_id, p.pago)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            opacity: p.pago ? 1 : 0.3,
                            transition: 'opacity 0.2s',
                            fontSize: '0.85rem'
                          }}
                          title={p.pago ? "Pago!" : "Marcar como Pago"}
                        >
                          <span style={{ fontSize: '1.25rem' }}>💰</span>
                          <span style={{ fontSize: '0.75rem', fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '1px', color: p.pago ? '#d4af37' : '#666', fontWeight: p.pago ? 'bold' : 'normal' }}> Pago</span>
                        </button>
                      </div>

                      {/* 6. Status da Vaga */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <input 
                            type="checkbox"
                            checked={p.vaga === 'Comprometido'}
                            onChange={(e) => updateVagaStatus(p.contact_id, e.target.checked ? 'Comprometido' : 'Automático')}
                            style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#7d3c98' }}
                            title="Forçar manual (Comprometido)"
                          />
                          
                          <div style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontFamily: 'sans-serif',
                            fontWeight: 'bold',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            ...badgeStyle
                          }}>
                            {badgeText}
                          </div>
                        </div>
                      </div>

                      {/* 7. Ações (Remover) */}
                      <div style={{ textAlign: 'right' }}>
                        <button onClick={() => removeParticipant(p.contact_id)} style={{ border: 'none', background: 'transparent', color: '#c00', fontSize: '1.4rem', cursor: 'pointer', opacity: 0.5, transition: 'opacity 0.2s' }} onMouseEnter={(e) => e.target.style.opacity = 1} onMouseLeave={(e) => e.target.style.opacity = 0.5} title="Remover da lista">
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Importação */}
      {isImportModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Importar da Base de Viajantes</h2>
            
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem', paddingRight: '1rem' }}>
              {availableContacts.length === 0 ? (
                <p>Todos os viajantes da base já estão nesta cerimônia!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {availableContacts.map(contact => (
                    <label 
                      key={contact.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '1rem', 
                        padding: '1rem', 
                        background: selectedContactIds.has(contact.id) ? 'rgba(45, 74, 62, 0.1)' : '#f9f9f9',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: selectedContactIds.has(contact.id) ? '1px solid var(--primary)' : '1px solid transparent'
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedContactIds.has(contact.id)}
                        onChange={() => toggleContactSelection(contact.id)}
                        style={{ width: '20px', height: '20px' }}
                      />
                      <div>
                        <div style={{ fontWeight: '600' }}>{contact.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status Geral: {contact.status}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }} 
                onClick={handleImport}
                disabled={selectedContactIds.size === 0}
              >
                Importar Selecionados ({selectedContactIds.size})
              </button>
              <button 
                className="btn" 
                style={{ background: '#eee' }}
                onClick={() => setIsImportModalOpen(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {activeFichaContact && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: '500px', padding: '2.5rem', fontFamily: '"Lora", serif', color: '#333', background: '#fdfbf7', border: '1px solid #d4cbb8', borderRadius: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 'normal', color: '#1a1a1a', borderBottom: '1px solid #d4cbb8', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              Ficha Médica: {activeFichaContact.name}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', fontSize: '0.95rem' }}>
              {activeFichaContact.cpf && (
                <div>
                  <strong style={{ fontFamily: 'sans-serif', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', color: '#2d4a3e' }}>CPF:</strong>
                  <span style={{ marginLeft: '0.5rem' }}>{activeFichaContact.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</span>
                </div>
              )}

              <div>
                <strong style={{ fontFamily: 'sans-serif', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', color: '#2d4a3e' }}>Remédios Informados:</strong>
                {activeFichaContact.medications_list && activeFichaContact.medications_list.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem', paddingLeft: '0.5rem' }}>
                    {activeFichaContact.medications_list.map((med, idx) => (
                      <div key={idx} style={{ padding: '0.5rem 0.8rem', background: 'rgba(45, 74, 62, 0.05)', borderRadius: '6px', borderLeft: '3px solid #2d4a3e' }}>
                        <div style={{ fontWeight: 'bold' }}>{med.name}</div>
                        {med.frequency && <div style={{ fontSize: '0.8rem', color: '#666', fontStyle: 'italic', marginTop: '0.2rem' }}>Frequência: {med.frequency}</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ marginTop: '0.3rem', fontStyle: 'italic', color: '#888' }}>
                    Nenhum remédio de uso contínuo informado (declarou não tomar remédios).
                  </div>
                )}
              </div>

              {activeFichaContact.observations && (
                <div>
                  <strong style={{ fontFamily: 'sans-serif', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', color: '#2d4a3e' }}>Observações:</strong>
                  <p style={{ margin: '0.3rem 0 0 0', fontStyle: 'italic', color: '#555', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                    {activeFichaContact.observations}
                  </p>
                </div>
              )}
            </div>

            <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => {
                  const cleanPhone = activeFichaContact.phone?.replace(/\D/g, '') || '';
                  if (!cleanPhone) {
                    alert('Este viajante não tem telefone cadastrado para o envio da ficha.');
                    return;
                  }
                  const publicLink = `${window.location.origin}/ficha?nome=${encodeURIComponent(activeFichaContact.name || '')}`;
                  const firstName = activeFichaContact.name?.split(' ')[0] || '';
                  const message = `Oi, ${firstName}! Por favor, preenche algumas informações sobre remédios que você está tomando.\n\nAlguns remédios interferem na experiência, ou mesmo inviabilizam ela.\n\nLink seguro para preenchimento: ${publicLink}`;
                  window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`, '_blank');
                }}
                className="btn"
                style={{ background: 'transparent', border: '1px solid #2d4a3e', color: '#2d4a3e', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}
              >
                <span>📲 WhatsApp</span>
              </button>

              <button 
                onClick={() => setActiveFichaContact(null)} 
                className="btn btn-primary"
                style={{ background: '#2d4a3e', border: 'none', padding: '0.6rem 1.8rem', color: 'white', cursor: 'pointer', borderRadius: '4px', flex: 1 }}
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
