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
              background: '#2b2d42', // Darker elegant leather color
              borderRadius: '4px 12px 12px 4px',
              boxShadow: 'inset -2px 0 5px rgba(0,0,0,0.2), 5px 5px 15px rgba(0,0,0,0.3)',
              padding: '1.5rem',
              cursor: 'pointer',
              minHeight: '220px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onClick={() => router.push(`/events/${event.id}`)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = 'inset -2px 0 5px rgba(0,0,0,0.2), 8px 8px 20px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'inset -2px 0 5px rgba(0,0,0,0.2), 5px 5px 15px rgba(0,0,0,0.3)';
            }}
            >
              {/* Spine binding effect */}
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '14px',
                background: 'linear-gradient(to right, rgba(255,255,255,0.05), rgba(0,0,0,0.3), rgba(255,255,255,0.02))',
                borderRight: '1px solid rgba(0,0,0,0.6)',
              }}></div>
              
              {/* Elastic band */}
              <div style={{
                position: 'absolute',
                right: '20px',
                top: 0,
                bottom: 0,
                width: '10px',
                background: '#1a1a1a',
                boxShadow: '1px 0 3px rgba(0,0,0,0.6), -1px 0 2px rgba(255,255,255,0.05)',
                zIndex: 2,
              }}></div>

              {/* Moleskine Paper Label */}
              <div style={{
                marginLeft: '15px',
                background: '#f4eed7', // Paper color
                color: '#333',
                padding: '1.2rem',
                borderRadius: '2px',
                boxShadow: '1px 1px 4px rgba(0,0,0,0.4)',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                zIndex: 1,
                paddingRight: '30px', // Space for elastic band
                fontFamily: 'Georgia, serif' // Gives that notebook feel
              }}>
                 <h3 style={{ margin: '0 0 0.8rem 0', fontSize: '1.4rem', color: '#1a1a1a', borderBottom: '2px solid #ddd', paddingBottom: '0.5rem' }}>
                   {event.name}
                 </h3>
                 
                 <div style={{ fontSize: '0.85rem', color: '#555', marginBottom: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                   <div>📅 <strong>Dia 1:</strong> {event.date ? new Date(event.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'A definir'}</div>
                   {event.date2 && (
                     <div>📅 <strong>Dia 2:</strong> {new Date(event.date2).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</div>
                   )}
                 </div>

                 <p style={{ flex: 1, fontSize: '0.9rem', fontStyle: 'italic', margin: 0, color: '#666', lineHeight: '1.4' }}>
                   {event.description || 'Sem anotações de capa.'}
                 </p>
                 
                 <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-start' }}>
                    <span style={{ background: '#2d4a3e', color: 'white', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', fontFamily: 'sans-serif' }}>
                      {event.event_participants?.[0]?.count || 0} Viajantes
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
