'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

// Base de remédios altamente abrangente (focada em psicotrópicos, uso contínuo e comuns no Brasil)
const MEDICATIONS_DATABASE = [
  // Antidepressivos / ISRS / Dual / Tricíclicos
  'Sertralina', 'Escitalopram', 'Lexapro', 'Reconter', 'Fluoxetina', 'Prozac', 'Daforin', 
  'Citalopram', 'Paroxetina', 'Aropax', 'Pondera', 'Venlafaxina', 'Efexor', 'Desvenlafaxina', 
  'Pristiq', 'Duloxetina', 'Cymbalta', 'Bupropiona', 'Wellbutrin', 'Bup', 'Mirtazapina', 
  'Remeron', 'Amitriptilina', 'Amytril', 'Nortriptilina', 'Pamelor', 'Clomipramina', 
  'Anafranil', 'Imipramina', 'Tofranil', 'Trazodona', 'Donaren', 'Vortioxetina', 'Brintellix',
  
  // Ansiolíticos / Benzodiazepínicos / Sono
  'Clonazepam', 'Rivotril', 'Alprazolam', 'Frontal', 'Diazepam', 'Valium', 'Lorazepam', 
  'Lorax', 'Zolpidem', 'Stilnox', 'Eszopiclona', 'Prysma', 'Pregabalina', 'Lyrica', 'Gabapentina',
  
  // Estabilizadores de Humor / Anticonvulsivantes
  'Carbonato de Lítio', 'Carbolitium', 'Ácido Valproico', 'Valproato de Sódio', 'Depakene', 
  'Depakote', 'Carbamazepina', 'Tegretol', 'Oxcarbazepina', 'Trileptal', 'Lamotrigina', 
  'Lamictal', 'Topiramato', 'Amato',
  
  // Antipsicóticos
  'Quetiapina', 'Seroquel', 'Risperidona', 'Risperdal', 'Olanzapina', 'Zyprexa', 'Aripiprazol', 
  'Aristab', 'Haloperidol', 'Haldol', 'Clorpromazina', 'Amplictil', 'Clozapina', 'Leponex',
  
  // Estimulantes / TDAH
  'Metilfenidato', 'Ritalina', 'Concerta', 'Lisdexanfetamina', 'Venvanse', 'Atomoxetina', 'Atentah',
  
  // Uso contínuo (Pressão, Diabetes, Tireoide, Coração)
  'Losartana', 'Atenolol', 'Propranolol', 'Enalapril', 'Captopril', 'Hidroclorotiazida', 
  'Anlodipino', 'Metformina', 'Glimepirida', 'Insulina', 'Levotiroxina Sódica', 'Puran T4', 
  'Synthroid', 'Atorvastatina', 'Simvastatina', 'Rosuvastatina', 'AAS',
  
  // Comuns e Gerais
  'Dipirona', 'Paracetamol', 'Ibuprofeno', 'Nimesulida', 'Cetoprofeno', 'Omeprazol', 'Pantoprazol',
  'Loratadina', 'Desloratadina', 'Allegra', 'Fexofenadina', 'Prednisona', 'Dexametasona'
].sort();

export default function PublicFicha() {
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const nameParam = params.get('nome');
      if (nameParam) {
        setName(nameParam);
      }
    }
  }, []);
  const [medications, setMedications] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados do remédio atual sendo preenchido
  const [currentMed, setCurrentMed] = useState('');
  const [currentDosage, setCurrentDosage] = useState('');
  const [currentFreq, setCurrentFreq] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  // Formata CPF em tempo real (000.000.000-00)
  const handleCpfChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 9) {
      value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9)}`;
    } else if (value.length > 6) {
      value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6)}`;
    } else if (value.length > 3) {
      value = `${value.slice(0, 3)}.${value.slice(3)}`;
    }
    setCpf(value);
  };

  // Sugestões de autocomplete de remédio
  const handleMedNameChange = (e) => {
    const val = e.target.value;
    setCurrentMed(val);
    if (val.trim() === '') {
      setSuggestions([]);
    } else {
      const filtered = MEDICATIONS_DATABASE.filter(m => 
        m.toLowerCase().startsWith(val.toLowerCase())
      ).slice(0, 5); // limite de 5 sugestões
      setSuggestions(filtered);
    }
  };

  const selectSuggestion = (name) => {
    setCurrentMed(name);
    setSuggestions([]);
  };

  // Adiciona o remédio à lista do participante
  const addMedication = () => {
    if (!currentMed.trim()) return;
    const newMed = {
      name: currentMed.trim(),
      dosage: currentDosage.trim() || 'Não informada',
      frequency: currentFreq.trim() || 'Não informada'
    };
    setMedications([...medications, newMed]);
    setCurrentMed('');
    setCurrentDosage('');
    setCurrentFreq('');
    setSuggestions([]);
  };

  // Remove remédio da lista
  const removeMedication = (indexToRemove) => {
    setMedications(medications.filter((_, idx) => idx !== indexToRemove));
  };

  // Submit da Ficha Médica
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !cpf.trim()) {
      alert('Por favor, preencha os campos obrigatórios (Nome e CPF).');
      return;
    }

    setLoading(true);

    // O status do remédio para o administrador será:
    // - 'em andamento' caso tome algum remédio (precisa de revisão)
    // - 'não' caso informe que não toma nenhum
    const remedioStatus = medications.length > 0 ? 'em andamento' : 'não';

    try {
      // 1. Verifica se já existe um contato com esse mesmo CPF
      const cleanCpf = cpf.replace(/\D/g, '');
      let { data: existingContacts, error: findError } = await supabase
        .from('contacts')
        .select('id, name, observations, cpf')
        .eq('cpf', cleanCpf);

      if (findError) throw findError;

      // Fallback: Se não encontrar por CPF, tenta encontrar por NOME exato (caso o contato no banco estivesse sem CPF)
      if (!existingContacts || existingContacts.length === 0) {
        const { data: byNameContacts, error: nameError } = await supabase
          .from('contacts')
          .select('id, name, observations, cpf')
          .ilike('name', name.trim());
        
        if (nameError) throw nameError;
        
        if (byNameContacts && byNameContacts.length > 0) {
          // Usa o contato por nome, contanto que o CPF dele esteja nulo/vazio ou coincida
          existingContacts = byNameContacts.filter(c => !c.cpf || c.cpf === cleanCpf);
        }
      }

      if (existingContacts && existingContacts.length > 0) {
        // Atualiza contato existente
        const contact = existingContacts[0];
        const updatedObs = contact.observations 
          ? `${contact.observations}\n\n[Ficha Médica preenchida online via link público]` 
          : '[Ficha Médica preenchida online via link público]';

        const { error: updateError } = await supabase
          .from('contacts')
          .update({
            name: name.trim(), // Atualiza caso tenha digitado diferente
            cpf: cleanCpf,      // Salva o CPF no contato original caso estivesse vazio!
            remedio: remedioStatus,
            medications_list: medications,
            observations: updatedObs
          })
          .eq('id', contact.id);

        if (updateError) throw updateError;
      } else {
        // Cria um novo contato no banco
        const { error: insertError } = await supabase
          .from('contacts')
          .insert([{
            name: name.trim(),
            cpf: cpf.replace(/\D/g, ''),
            remedio: remedioStatus,
            medications_list: medications,
            status: 'Prospecto',
            avisar: 'Sempre',
            experiences_count: 0
          }]);

        if (insertError) throw insertError;
      }

      setSubmitted(true);
    } catch (err) {
      alert('Ocorreu um erro ao salvar sua ficha: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1b2e26 0%, #0d1612 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#e2e8f0'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '560px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
      }}>
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{
              fontSize: '4.5rem',
              color: '#66bb6a',
              marginBottom: '1.5rem',
              animation: 'scaleUp 0.5s ease'
            }}>
              ✓
            </div>
            <h2 style={{ color: '#ffffff', marginBottom: '1rem', fontSize: '1.6rem' }}>Ficha Enviada com Sucesso!</h2>
            <p style={{ color: '#a0aec0', lineHeight: '1.6', fontSize: '0.95rem' }}>
              Suas informações médicas foram gravadas com segurança no sistema. Agradecemos imensamente pela sua colaboração e transparência!
            </p>
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{
                fontSize: '1.8rem',
                color: '#ffffff',
                fontWeight: '700',
                marginBottom: '0.5rem'
              }}>Ficha Médica e Terapêutica</h1>
              <p style={{ color: '#a0aec0', fontSize: '0.9rem' }}>
                Preencha suas informações com segurança para acompanhamento.
              </p>
            </div>

            {name && (
              <div className="fade-in" style={{
                background: 'rgba(102, 187, 106, 0.08)',
                border: '1px solid rgba(102, 187, 106, 0.2)',
                borderRadius: '16px',
                padding: '1rem',
                marginBottom: '1.5rem',
                textAlign: 'center',
                boxShadow: '0 4px 15px rgba(102, 187, 106, 0.05)'
              }}>
                <span style={{ fontSize: '1.2rem', fontWeight: '700', color: '#81c784', display: 'block', marginBottom: '0.2rem' }}>
                  Oi, {name.split(' ')[0]}! 👋
                </span>
                <span style={{ fontSize: '0.82rem', color: '#cbd5e0', lineHeight: '1.4', display: 'block' }}>
                  Preparamos este espaço seguro para você preencher seus medicamentos. Por favor, revise e confirme seus dados completos abaixo.
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Nome Completo */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e0' }}>
                  Nome Completo <span style={{ color: '#ef5350' }}>*</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.95rem',
                    color: '#ffffff',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#66bb6a'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>

              {/* CPF */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e0' }}>
                  CPF <span style={{ color: '#ef5350' }}>*</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.95rem',
                    color: '#ffffff',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#66bb6a'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>

              {/* Adicionar Medicamentos */}
              <div style={{
                borderTop: '1px dashed rgba(255,255,255,0.15)',
                paddingTop: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <h3 style={{ fontSize: '1rem', color: '#ffffff', fontWeight: '600', margin: 0 }}>
                  Medicamentos e Remédios de Uso Contínuo
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#a0aec0', marginTop: '-0.5rem', lineHeight: '1.4' }}>
                  Adicione todos os remédios que você toma. Se não tomar nenhum, pode pular esta seção e clicar direto em "Enviar Minha Ficha".
                </p>

                {/* Sub-formulário de Medicamento */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  padding: '1.2rem',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.8rem',
                  position: 'relative'
                }}>
                  {/* Nome do Remédio + Autocomplete */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', position: 'relative' }}>
                    <label style={{ fontSize: '0.8rem', color: '#cbd5e0' }}>Nome do Remédio</label>
                    <input 
                      type="text"
                      value={currentMed}
                      onChange={handleMedNameChange}
                      placeholder="Ex: Sertralina, Rivotril..."
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        padding: '0.6rem 0.8rem',
                        fontSize: '0.9rem',
                        color: '#ffffff',
                        outline: 'none'
                      }}
                    />
                    
                    {/* Lista de Sugestões de Autocomplete */}
                    {suggestions.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: '#1b2e26',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        marginTop: '0.2rem',
                        zIndex: 10,
                        overflow: 'hidden',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                      }}>
                        {suggestions.map(s => (
                          <div 
                            key={s}
                            onClick={() => selectSuggestion(s)}
                            style={{
                              padding: '0.6rem 0.8rem',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid rgba(255,255,255,0.05)',
                              transition: 'background 0.2s',
                              color: '#cbd5e0'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.08)'}
                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                          >
                            💊 {s}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dosagem & Frequência Lado a Lado */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.8rem', color: '#cbd5e0' }}>Dosagem</label>
                      <input 
                        type="text"
                        value={currentDosage}
                        onChange={(e) => setCurrentDosage(e.target.value)}
                        placeholder="Ex: 50mg, 10ml, 5gts"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '8px',
                          padding: '0.6rem 0.8rem',
                          fontSize: '0.9rem',
                          color: '#ffffff',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.8rem', color: '#cbd5e0' }}>Frequência</label>
                      <input 
                        type="text"
                        value={currentFreq}
                        onChange={(e) => setCurrentFreq(e.target.value)}
                        placeholder="Ex: 1x ao dia, 12h/12h"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '8px',
                          padding: '0.6rem 0.8rem',
                          fontSize: '0.9rem',
                          color: '#ffffff',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* Botão de Incluir */}
                  <button
                    type="button"
                    onClick={addMedication}
                    style={{
                      background: 'rgba(102, 187, 106, 0.15)',
                      color: '#81c784',
                      border: '1px solid rgba(102, 187, 106, 0.3)',
                      borderRadius: '8px',
                      padding: '0.6rem',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      marginTop: '0.4rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      transition: 'background 0.2s, transform 0.1s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(102, 187, 106, 0.25)'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(102, 187, 106, 0.15)'}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    ➕ Adicionar Remédio à Lista
                  </button>
                </div>

                {/* Lista de Remédios Já Adicionados */}
                {medications.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#81c784', fontWeight: '600' }}>
                      Medicamentos Adicionados ({medications.length}):
                    </div>
                    {medications.map((med, index) => (
                      <div 
                        key={index}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '12px',
                          padding: '0.6rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          animation: 'fadeIn 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#ffffff' }}>
                            💊 {med.name}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#cbd5e0' }}>
                            Dose: <strong style={{ color: '#fff' }}>{med.dosage}</strong> | Freq: <strong style={{ color: '#fff' }}>{med.frequency}</strong>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMedication(index)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef5350',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontWeight: '600'
                          }}
                          onMouseEnter={(e) => e.target.style.background = 'rgba(239, 83, 80, 0.15)'}
                          onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botão de Submeter Ficha */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #66bb6a 0%, #43a047 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '1rem',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  marginTop: '1.5rem',
                  boxShadow: '0 4px 15px rgba(102, 187, 106, 0.2)',
                  transition: 'opacity 0.2s, transform 0.1s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {loading ? 'Processando envio...' : 'Enviar Minha Ficha'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
