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

  async function toggleRemedioOk(contactId, currentStatus) {
    const { error } = await supabase
      .from('event_participants')
      .update({ remedio_ok: !currentStatus })
      .match({ event_id: eventId, contact_id: contactId });
      
    if (!error) {
      setParticipants(prev => prev.map(p => 
        p.contact_id === contactId ? { ...p, remedio_ok: !currentStatus } : p
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

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '5rem' }}>Carregando cerimônia...</div>;
  if (!event) return <div style={{ textAlign: 'center', padding: '5rem' }}>Cerimônia não encontrada.</div>;

  const hasTwoDates = !!event.date2;

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
              <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1.5fr 2fr 2fr 0.5fr', padding: '0 0 1rem 0', borderBottom: '2px solid #2d4a3e', fontWeight: 'bold', fontSize: '0.8rem', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: 'sans-serif', color: '#2d4a3e' }}>
                <div>Viajante</div>
                <div>Dias Confirmados</div>
                <div>Status</div>
                <div>Sub-Status</div>
                <div style={{ textAlign: 'right' }}>Ações</div>
              </div>

              {/* Items */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {participants.map((p) => {
                  const isConfirmado = p.status === 'Confirmado';
                  return (
                    <div key={p.contact_id} style={{ display: 'grid', gridTemplateColumns: '2.5fr 1.5fr 2fr 2fr 0.5fr', alignItems: 'center', padding: '1.2rem 0', borderBottom: '1px solid #e5dfd3', transition: 'background-color 0.2s', opacity: p.status === 'desistiu' ? 0.4 : 1 }}>
                      {/* 1. Name & Phone */}
                      <div>
                        <div style={{ fontSize: '1.1rem', color: '#1a1a1a', fontWeight: '500' }}>{p.contacts?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#888', letterSpacing: '0.5px', fontFamily: 'sans-serif', marginTop: '0.2rem' }}>{p.contacts?.phone || 'Sem telefone'}</div>
                      </div>

                      {/* 2. Days Presence Toggles */}
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                         <button onClick={() => toggleDayPresence(p.contact_id, 1, p.date1_confirmed)} style={{ background: 'transparent', border: 'none', color: p.date1_confirmed ? '#2d4a3e' : '#bbb', fontStyle: 'italic', fontSize: '0.95rem', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontWeight: p.date1_confirmed ? 'bold' : 'normal' }} title="Alternar Dia I">
                           {p.date1_confirmed ? 'Dia I' : <s>Dia I</s>}
                         </button>
                         {hasTwoDates && (
                           <button onClick={() => toggleDayPresence(p.contact_id, 2, p.date2_confirmed)} style={{ background: 'transparent', border: 'none', color: p.date2_confirmed ? '#2d4a3e' : '#bbb', fontStyle: 'italic', fontSize: '0.95rem', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontWeight: p.date2_confirmed ? 'bold' : 'normal' }} title="Alternar Dia II">
                             {p.date2_confirmed ? 'Dia II' : <s>Dia II</s>}
                           </button>
                         )}
                      </div>

                      {/* 3. Status Dropdown */}
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
                          <option value="remédio informado">Remédio Informado</option>
                          <option value="intenção de ir">Intenção de ir</option>
                          <option value="Confirmado">Confirmado</option>
                          <option value="desistiu">Desistiu</option>
                        </select>
                      </div>

                      {/* 4. Sub-Status (Remédio OK & Pago) - only for Confirmado */}
                      <div>
                        {isConfirmado ? (
                          <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
                            {/* Remédio OK Toggle */}
                            <button 
                              onClick={() => toggleRemedioOk(p.contact_id, p.remedio_ok)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                opacity: p.remedio_ok ? 1 : 0.3,
                                transition: 'opacity 0.2s',
                                fontSize: '0.85rem'
                              }}
                              title={p.remedio_ok ? "Remédio OK!" : "Marcar Remédio OK"}
                            >
                              <span style={{ fontSize: '1.1rem' }}>💊</span>
                              <span style={{ fontSize: '0.75rem', fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '1px', color: p.remedio_ok ? '#2d4a3e' : '#666', fontWeight: p.remedio_ok ? 'bold' : 'normal' }}>Ok</span>
                            </button>

                            {/* Pago! Toggle */}
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
                              <span style={{ fontSize: '1.1rem' }}>💰</span>
                              <span style={{ fontSize: '0.75rem', fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '1px', color: p.pago ? '#d4af37' : '#666', fontWeight: p.pago ? 'bold' : 'normal' }}>Pago</span>
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: '#ccc', fontStyle: 'italic', fontSize: '0.85rem' }}>Indisponível</span>
                        )}
                      </div>

                      {/* 5. Actions (Remove) */}
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
    </div>
  );
}
