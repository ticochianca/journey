'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    origin: '',
    experiences_count: 0,
    phone: '',
    observations: ''
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  async function fetchContacts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contacts:', error);
    } else {
      setContacts(data);
    }
    setLoading(false);
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
      setFormData({ name: '', origin: '', experiences_count: 0, phone: '', observations: '' });
      fetchContacts();
    }
  }

  const openWhatsApp = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  return (
    <div className="container fade-in">
      <header>
        <div>
          <h1>Journey</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestão de Contatos & Experiências</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          + Novo Contato
        </button>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Carregando trilha...</div>
      ) : (
        <div className="contact-grid">
          {contacts.map((contact) => (
            <div key={contact.id} className="card">
              <h3>{contact.name}</h3>
              <div className="meta">Origem: {contact.origin || 'Não informada'}</div>
              <div className="stats">
                <span className="badge">{contact.experiences_count} Experiências</span>
              </div>
              <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                {contact.observations}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {contact.phone && (
                  <button 
                    className="btn btn-whatsapp" 
                    onClick={() => openWhatsApp(contact.phone)}
                  >
                    WhatsApp
                  </button>
                )}
              </div>
            </div>
          ))}
          {contacts.length === 0 && (
            <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              Nenhum contato encontrado. Comece sua jornada adicionando um!
            </p>
          )}
        </div>
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
              <div className="form-group">
                <label>Origem (Indicação ou Local)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.origin}
                  onChange={(e) => setFormData({...formData, origin: e.target.value})}
                />
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
  );
}
