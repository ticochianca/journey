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
      console.error('Error fetching events:', error);
    } else {
      setEvents(data);
    }
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const { data, error } = await supabase
      .from('events')
      .insert([formData]);

    if (error) {
      alert('Erro ao criar evento: ' + error.message);
    } else {
      setIsModalOpen(false);
      setFormData({ name: '', date: '', description: '' });
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
          <a href="/events" className="navbar-link active">🎪 Eventos</a>
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
            <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>Eventos Journey</h1>
            <p style={{ color: 'var(--text-muted)' }}>Gerencie retiros e cerimônias</p>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            + Novo Evento
          </button>
        </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Carregando eventos...</div>
      ) : (
        <div className="contact-grid">
          {events.map((event) => (
            <div key={event.id} className="card" style={{ cursor: 'pointer' }} onClick={() => router.push(`/events/${event.id}`)}>
              <h3>{event.name}</h3>
              <div className="meta">Data: {event.date ? new Date(event.date).toLocaleDateString('pt-BR') : 'A definir'}</div>
              <div className="stats" style={{ marginTop: '1rem' }}>
                <span className="badge" style={{ background: 'var(--primary)', color: 'white' }}>
                  {event.event_participants?.[0]?.count || 0} Participantes
                </span>
              </div>
              <p style={{ fontSize: '0.9rem', marginTop: '1rem', color: 'var(--text-muted)' }}>
                {event.description}
              </p>
              <div style={{ marginTop: '1.5rem' }}>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Abrir Janela do Evento
                </button>
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              Nenhum evento criado ainda.
            </p>
          )}
        </div>
      )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Novo Evento</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome do Evento</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Retiro de Inverno"
                />
              </div>
              <div className="form-group">
                <label>Data</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Descrição</label>
                <textarea 
                  className="form-control" 
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Criar Evento</button>
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
