'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    date2: '',
    description: ''
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
      fetchEvents();
    }
  }

  async function fetchEvents() {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*, event_participants(count)')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching ceremonies:', error);
    } else {
      setEvents(data);
    }
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    // Sanitiza o campo de data para enviar NULL ao invés de string vazia ""
    const dataToInsert = {
      ...formData,
      date: formData.date === '' ? null : formData.date,
      date2: formData.date2 === '' ? null : formData.date2
    };

    const { data, error } = await supabase
      .from('events')
      .insert([dataToInsert]);

    if (error) {
      alert('Erro ao criar cerimônia: ' + error.message);
    } else {
      setIsModalOpen(false);
      setFormData({ name: '', date: '', date2: '', description: '' });
      fetchEvents();
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (!user) return <div style={{ textAlign: 'center', padding: '5rem' }}>Verificando acesso...</div>;

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
          <div>
            <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>Cerimônias Journey</h1>
            <p style={{ color: 'var(--text-muted)' }}>Gerencie as jornadas e os diários dos encontros</p>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            + Nova Cerimônia
          </button>
        </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Carregando cerimônias...</div>
      ) : (
        <div className="contact-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {events.map((event) => (
            <div key={event.id} style={{
              position: 'relative',
              background: '#1c1c1c', // Moleskine black cover
              borderRadius: '3px 12px 12px 3px',
              boxShadow: 'inset -2px 0 5px rgba(0,0,0,0.4), 4px 4px 10px rgba(0,0,0,0.5)',
              padding: '0',
              cursor: 'pointer',
              minHeight: '220px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'visible', // To allow ribbon to peek out
              transition: 'transform 0.2s, box-shadow 0.2s',
              borderLeft: '4px solid #111', // Spine hinge
              marginTop: '10px' // For the ribbon shadow
            }}
            onClick={() => router.push(`/events/${event.id}`)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = 'inset -2px 0 5px rgba(0,0,0,0.4), 8px 8px 15px rgba(0,0,0,0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'inset -2px 0 5px rgba(0,0,0,0.4), 4px 4px 10px rgba(0,0,0,0.5)';
            }}
            >
              {/* Spine Groove */}
              <div style={{
                position: 'absolute',
                left: '8px',
                top: 0,
                bottom: 0,
                width: '3px',
                background: 'rgba(0,0,0,0.6)',
                boxShadow: '1px 0 2px rgba(255,255,255,0.05)',
              }}></div>
              
              {/* Elastic Band */}
              <div style={{
                position: 'absolute',
                right: '18px',
                top: '-1px',
                bottom: '-1px',
                width: '12px',
                background: '#222',
                boxShadow: 'inset 0 0 4px rgba(0,0,0,0.8), -2px 0 4px rgba(0,0,0,0.4)',
                borderRadius: '1px',
                zIndex: 10,
              }}></div>

              {/* Red Ribbon Bookmark */}
              <div style={{
                position: 'absolute',
                bottom: '-15px',
                left: '40px',
                width: '14px',
                height: '40px',
                background: '#8B0000',
                borderBottomLeftRadius: '2px',
                borderBottomRightRadius: '2px',
                boxShadow: '2px 2px 4px rgba(0,0,0,0.4)',
                zIndex: 1,
              }}></div>

              {/* Moleskine Paper Label (Sticker) */}
              <div style={{
                margin: '35px 45px 35px 25px', // Space for elastic, ribbon, and spine
                background: '#f4ecd8', // Ivory paper
                color: '#333',
                padding: '1.2rem',
                borderRadius: '2px',
                boxShadow: 'inset 0 0 10px rgba(200,180,150,0.1), 1px 1px 3px rgba(0,0,0,0.4)',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                zIndex: 5,
                fontFamily: '"Times New Roman", Times, serif'
              }}>
                 <h3 style={{ margin: '0 0 0.8rem 0', fontSize: '1.5rem', color: '#1a1a1a', borderBottom: '1px solid #c2b59b', paddingBottom: '0.4rem', fontWeight: 'bold' }}>
                   {event.name}
                 </h3>
                 
                 <div style={{ fontSize: '0.8rem', color: '#555', marginBottom: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                   <div><strong>D1:</strong> {event.date ? new Date(event.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'A definir'}</div>
                   {event.date2 && (
                     <div><strong>D2:</strong> {new Date(event.date2).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</div>
                   )}
                 </div>

                 <p style={{ flex: 1, fontSize: '0.85rem', fontStyle: 'italic', margin: 0, color: '#444', lineHeight: '1.4' }}>
                   {event.description || 'Diário de Bordo'}
                 </p>
                 
                 <div style={{ marginTop: '0.8rem', textAlign: 'right' }}>
                    <span style={{ color: '#8B0000', fontSize: '0.75rem', fontWeight: 'bold', fontFamily: 'sans-serif', letterSpacing: '1px' }}>
                      {event.event_participants?.[0]?.count || 0} PASSAPORTES
                    </span>
                 </div>
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              Nenhuma cerimônia criada ainda.
            </p>
          )}
        </div>
      )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Nova Cerimônia</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome da Cerimônia / Retiro</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Cerimônia da Primavera"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Data 1 (Obrigatória)</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Data 2 (Opcional)</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={formData.date2}
                    onChange={(e) => setFormData({...formData, date2: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Descrição / Anotações (Capa do Diário)</label>
                <textarea 
                  className="form-control" 
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Criar Cerimônia</button>
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
