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
          display: 'flex',
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          background: '#fdfbf7', // Ivory paper color
          borderRadius: '8px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15), inset 0 0 10px rgba(0,0,0,0.05)',
          position: 'relative',
          minHeight: '75vh',
          fontFamily: '"Lora", "Georgia", serif',
          color: '#333'
        }}>
          {/* Spine Crease */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: '40px',
            background: 'linear-gradient(to right, rgba(0,0,0,0.02), rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.02))',
            transform: 'translateX(-50%)',
            borderLeft: '1px solid rgba(0,0,0,0.03)',
            borderRight: '1px solid rgba(0,0,0,0.03)',
            zIndex: 0
          }}></div>

          {/* LEFT PAGE: Ceremony Header & Diary */}
          <div style={{
            flex: 1,
            padding: '3rem 4rem',
            borderRight: '1px solid #e5dfd3',
            boxShadow: 'inset -20px 0 20px -20px rgba(0,0,0,0.15)', // Inner spine shadow
            zIndex: 1
          }}>
            <Link href="/events" style={{ display: 'inline-block', marginBottom: '2rem', textDecoration: 'none', color: '#888', fontSize: '0.75rem', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'sans-serif' }}>
              ← Voltar às Cerimônias
            </Link>
            
            <h1 style={{ fontSize: '2.5rem', color: '#1a1a1a', marginBottom: '1.5rem', fontWeight: 'normal' }}>
              {event.name}
            </h1>
            
            <div style={{ borderBottom: '1px solid #d4cbb8', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.9rem', color: '#555', fontStyle: 'italic', letterSpacing: '0.5px' }}>
                <span style={{ fontFamily: 'sans-serif', fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#2d4a3e', marginRight: '0.5rem' }}>Dia I</span>
                {event.date ? new Date(event.date + 'T00:00:00').toLocaleDateString('pt-BR') : 'Data pendente'}
              </div>
              {event.date2 && (
                <div style={{ fontSize: '0.9rem', color: '#555', fontStyle: 'italic', letterSpacing: '0.5px', marginTop: '0.6rem' }}>
                  <span style={{ fontFamily: 'sans-serif', fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#2d4a3e', marginRight: '0.5rem' }}>Dia II</span>
                  {new Date(event.date2 + 'T00:00:00').toLocaleDateString('pt-BR')}
                </div>
              )}
            </div>
            
            {event.description ? (
              <p style={{ color: '#444', lineHeight: '1.8', fontSize: '1.05rem', fontStyle: 'italic' }}>
                {event.description}
              </p>
            ) : (
              <p style={{ color: '#aaa', fontStyle: 'italic' }}>Nenhuma anotação de capa inserida.</p>
            )}
          </div>

          {/* RIGHT PAGE: The Elegant Participant List */}
          <div style={{
            flex: 1,
            padding: '3rem 4rem',
            boxShadow: 'inset 20px 0 20px -20px rgba(0,0,0,0.15)', // Inner spine shadow
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #d4cbb8', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
               <h2 style={{ fontSize: '1.6rem', color: '#1a1a1a', margin: 0, fontWeight: 'normal' }}>Lista de Viajantes</h2>
               <button onClick={openImportModal} style={{ background: 'transparent', border: '1px solid #2d4a3e', color: '#2d4a3e', padding: '0.4rem 1.2rem', borderRadius: '20px', fontSize: '0.7rem', letterSpacing: '1.5px', cursor: 'pointer', fontFamily: 'sans-serif', textTransform: 'uppercase', transition: 'all 0.3s' }} onMouseEnter={(e) => { e.target.style.background = '#2d4a3e'; e.target.style.color = '#fff'; }} onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#2d4a3e'; }}>
                 + Adicionar
               </button>
            </div>
            
            {participants.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <p style={{ color: '#888', fontStyle: 'italic' }}>Página em branco. Nenhum viajante adicionado ainda.</p>
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {participants.map((p) => (
                  <div key={p.contact_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 0', borderBottom: '1px dashed #e5dfd3', opacity: (!p.date1_confirmed && !p.date2_confirmed) ? 0.4 : 1, transition: 'opacity 0.3s' }}>
                    <div>
                      <div style={{ fontSize: '1.1rem', color: '#1a1a1a' }}>{p.contacts?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#888', letterSpacing: '0.5px', fontFamily: 'sans-serif', marginTop: '0.2rem' }}>{p.contacts?.phone || 'Sem telefone'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                       <button onClick={() => toggleDayPresence(p.contact_id, 1, p.date1_confirmed)} style={{ background: 'transparent', border: 'none', color: p.date1_confirmed ? '#2d4a3e' : '#bbb', fontStyle: 'italic', fontSize: '0.95rem', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }} title="Alternar Dia I">
                         {p.date1_confirmed ? 'Dia I' : <s>Dia I</s>}
                       </button>
                       {hasTwoDates && (
                         <button onClick={() => toggleDayPresence(p.contact_id, 2, p.date2_confirmed)} style={{ background: 'transparent', border: 'none', color: p.date2_confirmed ? '#2d4a3e' : '#bbb', fontStyle: 'italic', fontSize: '0.95rem', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }} title="Alternar Dia II">
                           {p.date2_confirmed ? 'Dia II' : <s>Dia II</s>}
                         </button>
                       )}
                       <button onClick={() => removeParticipant(p.contact_id)} style={{ border: 'none', background: 'transparent', color: '#c00', fontSize: '1.2rem', marginLeft: '0.5rem', cursor: 'pointer', opacity: 0.5, transition: 'opacity 0.2s' }} onMouseEnter={(e) => e.target.style.opacity = 1} onMouseLeave={(e) => e.target.style.opacity = 0.5} title="Remover da lista">
                         ×
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
