'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function StatusSettings() {
  const [statuses, setStatuses] = useState([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchStatuses();
  }, []);

  async function fetchStatuses() {
    setLoading(true);
    const { data, error } = await supabase
      .from('statuses')
      .select('*')
      .order('name');
    
    if (error) console.error(error);
    else setStatuses(data);
    setLoading(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    const { error } = await supabase
      .from('statuses')
      .insert([{ name: newName }]);

    if (error) {
      alert('Erro ao adicionar status: ' + error.message);
    } else {
      setNewName('');
      fetchStatuses();
    }
  }

  async function handleDelete(id) {
    if (!confirm('Tem certeza que deseja excluir este status?')) return;
    const { error } = await supabase.from('statuses').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchStatuses();
  }

  return (
    <div className="container fade-in">
      <header>
        <div>
          <h1>Gerenciar Status</h1>
          <p style={{ color: 'var(--text-muted)' }}>Configure as etapas da sua jornada</p>
        </div>
        <button className="btn" onClick={() => router.push('/')}>Voltar</button>
      </header>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Nome do novo status (ex: Desistiu)" 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary">Adicionar</button>
        </form>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="contact-list-view">
          {statuses.map((status) => (
            <div key={status.id} className="list-item">
              <div style={{ fontWeight: '600' }}>{status.name}</div>
              <div className="meta">Criado em: {new Date(status.created_at).toLocaleDateString()}</div>
              <div></div>
              <div></div>
              <button 
                className="btn" 
                style={{ background: '#fee', color: '#c00', padding: '0.4rem 0.8rem' }}
                onClick={() => handleDelete(status.id)}
              >
                Excluir
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
