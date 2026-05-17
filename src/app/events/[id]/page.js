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

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '5rem' }}>Carregando cerimônia...</div>;
  if (!event) return <div style={{ textAlign: 'center', padding: '5rem' }}>Cerimônia não encontrada.</div>;

  const hasTwoDates = !!event.date2;

  // Components for rendering participant list
  const renderParticipantList = (filterFn, title, dateLabel) => {
    const filtered = participants.filter(filterFn);
    
    return (
      <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)', borderBottom: '2px solid rgba(0,0,0,0.05)', paddingBottom: '0.5rem' }}>
          {title} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({dateLabel})</span>
          <span style={{ float: 'right', background: 'var(--primary)', color: 'white', borderRadius: '12px', padding: '0.1rem 0.6rem', fontSize: '0.8rem' }}>
            {filtered.length}
          </span>
        </h3>
        
        {filtered.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>Nenhum viajante confirmado para este dia.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filtered.map(p => (
              <div key={p.contact_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '0.8rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{p.contacts?.name}</div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {hasTwoDates && (
                    <div style={{ display: 'flex', gap: '0.2rem', background: '#f5f5f5', padding: '0.2rem', borderRadius: '6px' }}>
                      <button 
                        onClick={() => toggleDayPresence(p.contact_id, 1, p.date1_confirmed)}
                        style={{ border: 'none', background: p.date1_confirmed ? '#4caf50' : '#ccc', color: 'white', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        title="Alternar presença no Dia 1"
                      >
                        D1
                      </button>
                      <button 
                        onClick={() => toggleDayPresence(p.contact_id, 2, p.date2_confirmed)}
                        style={{ border: 'none', background: p.date2_confirmed ? '#4caf50' : '#ccc', color: 'white', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        title="Alternar presença no Dia 2"
                      >
                        D2
                      </button>
                    </div>
                  )}
                  <button 
                    onClick={() => removeParticipant(p.contact_id)}
                    style={{ border: 'none', background: 'transparent', color: '#ef5350', cursor: 'pointer', fontSize: '1.2rem' }}
                    title="Remover da cerimônia"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

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

      <div className="container fade-in" style={{ paddingTop: '2rem' }}>
        <header style={{ borderBottom: 'none', marginBottom: '1.5rem', paddingBottom: 0 }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <Link href="/events" className="btn" style={{ background: '#eee', textDecoration: 'none' }}>
              ⬅ Voltar às Cerimônias
            </Link>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
            <div>
              <h1 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '1.8rem', fontFamily: 'Georgia, serif' }}>{event.name}</h1>
              <p style={{ color: 'var(--text-muted)' }}>
                <strong>Data 1:</strong> {event.date ? new Date(event.date + 'T00:00:00').toLocaleDateString('pt-BR') : 'A definir'}
                {event.date2 && <span> &nbsp;|&nbsp; <strong>Data 2:</strong> {new Date(event.date2 + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}
              </p>
              {event.description && <p style={{ marginTop: '0.5rem', fontStyle: 'italic', color: '#555' }}>{event.description}</p>}
            </div>
            <button className="btn btn-primary" onClick={openImportModal}>
              + Importar Viajantes
            </button>
          </div>
        </header>

      {participants.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Ninguém foi adicionado a esta cerimônia ainda.</p>
          <button className="btn btn-primary" onClick={openImportModal}>Importar da Base</button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {/* Se for 1 data, mostra lista única. Se for 2 datas, divide no meio! */}
          {renderParticipantList(p => p.date1_confirmed, 'Viajantes do Dia 1', event.date ? new Date(event.date + 'T00:00:00').toLocaleDateString('pt-BR') : 'Data 1')}
          
          {hasTwoDates && 
            renderParticipantList(p => p.date2_confirmed, 'Viajantes do Dia 2', new Date(event.date2 + 'T00:00:00').toLocaleDateString('pt-BR'))
          }
        </div>
      )}
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
