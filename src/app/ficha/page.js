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
  const [phone, setPhone] = useState('');
  const [contactId, setContactId] = useState(null);
  const [isGenericLink, setIsGenericLink] = useState(true);
  
  // Novos estados adicionados
  const [observations, setObservations] = useState('');
  const [declarationChecked, setDeclarationChecked] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const nameParam = params.get('nome');
      const idParam = params.get('id');

      if (idParam) {
        // Carrega dados do contato a partir do id do banco de dados!
        const loadContact = async () => {
          const { data, error } = await supabase
            .from('contacts')
            .select('name, cpf, phone')
            .eq('id', idParam)
            .single();

          if (data && !error) {
            setName(data.name || '');
            setContactId(idParam);
            setIsGenericLink(false);
            
            // Se já tiver telefone cadastrado, formata e preenche
            if (data.phone) {
              let clean = data.phone.replace(/\D/g, '');
              if (clean.length > 2) {
                if (clean.length > 10) {
                  setPhone(`(${clean.slice(0,2)}) ${clean.slice(2,7)}-${clean.slice(7)}`);
                } else if (clean.length > 6) {
                  setPhone(`(${clean.slice(0,2)}) ${clean.slice(2,6)}-${clean.slice(6)}`);
                } else {
                  setPhone(`(${clean.slice(0,2)}) ${clean.slice(2)}`);
                }
              } else {
                setPhone(data.phone);
              }
            }
            if (data.cpf) {
              let clean = data.cpf.replace(/\D/g, '');
              if (clean.length > 9) {
                setCpf(`${clean.slice(0,3)}.${clean.slice(3,6)}.${clean.slice(6,9)}-${clean.slice(9)}`);
              } else {
                setCpf(data.cpf);
              }
            }
          }
        };
        loadContact();
      } else if (nameParam) {
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

  // Formata Telefone em tempo real
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 10) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 6) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
    } else if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
      value = `(${value.slice(0, 2)}`;
    }
    setPhone(value);
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
    
    const cleanCpf = cpf.replace(/\D/g, '');
    const cleanPhone = phone.replace(/\D/g, '');

    if (!name.trim() || !cleanCpf) {
      alert('Por favor, preencha os campos obrigatórios (Nome e CPF).');
      return;
    }

    if (isGenericLink && !cleanPhone) {
      alert('Por favor, preencha o seu Telefone.');
      return;
    }

    if (!declarationChecked) {
      alert('Você precisa declarar a veracidade das informações fornecidas marcando o campo de declaração.');
      return;
    }

    setLoading(true);

    const remedioStatus = medications.length > 0 ? 'em andamento' : 'não';

    try {
      let matchedContactId = null;
      let existingObs = '';

      if (contactId) {
        // Caminho 1: Temos o ID específico do contato via URL
        matchedContactId = contactId;
        const { data: c } = await supabase.from('contacts').select('observations').eq('id', contactId).single();
        if (c) existingObs = c.observations || '';
      } else {
        // Caminho 2: Link Genérico. Cruzamento inteligente de dados!
        // 1. Tenta cruzar pelo Telefone
        let { data: phoneMatches } = await supabase
          .from('contacts')
          .select('id, name, observations, cpf, phone')
          .eq('phone', cleanPhone);

        if (phoneMatches && phoneMatches.length > 0) {
          matchedContactId = phoneMatches[0].id;
          existingObs = phoneMatches[0].observations || '';
        } else {
          // Fallback: busca pelo telefone parcial (ex: últimos 9 ou 8 dígitos)
          const last9Digits = cleanPhone.slice(-9);
          if (last9Digits.length >= 8) {
            let { data: partialPhoneMatches } = await supabase
              .from('contacts')
              .select('id, name, observations, cpf, phone')
              .ilike('phone', `%${last9Digits}%`);
            
            if (partialPhoneMatches && partialPhoneMatches.length > 0) {
              matchedContactId = partialPhoneMatches[0].id;
              existingObs = partialPhoneMatches[0].observations || '';
            }
          }
        }

        // 2. Se não cruzou por telefone, tenta cruzar por CPF
        if (!matchedContactId) {
          let { data: cpfMatches } = await supabase
            .from('contacts')
            .select('id, name, observations, cpf')
            .eq('cpf', cleanCpf);

          if (cpfMatches && cpfMatches.length > 0) {
            matchedContactId = cpfMatches[0].id;
            existingObs = cpfMatches[0].observations || '';
          }
        }

        // 3. Se ainda não cruzou, tenta cruzar por Nome Exato
        if (!matchedContactId) {
          let { data: nameMatches } = await supabase
            .from('contacts')
            .select('id, name, observations, cpf, phone')
            .ilike('name', name.trim());

          if (nameMatches && nameMatches.length > 0) {
            const filtered = nameMatches.filter(c => !c.cpf || c.cpf === cleanCpf);
            if (filtered.length > 0) {
              matchedContactId = filtered[0].id;
              existingObs = filtered[0].observations || '';
            }
          }
        }
      }

      // Preparando as observações preenchidas
      let medicalNote = `[Ficha Médica preenchida online via link ${contactId ? 'exclusivo' : 'genérico'}]`;
      if (observations.trim()) {
        medicalNote += `\nObservações/Terapias Alternativas: ${observations.trim()}`;
      }
      medicalNote += `\nDeclaração: Aceita e declarada como verdadeira em ${new Date().toLocaleDateString('pt-BR')}.`;

      if (matchedContactId) {
        // Atualiza contato existente
        const updatedObs = existingObs 
          ? `${existingObs}\n\n${medicalNote}` 
          : medicalNote;

        const updatePayload = {
          name: name.trim(),
          cpf: cleanCpf,
          remedio: remedioStatus,
          medications_list: medications,
          observations: updatedObs
        };

        // Se for link genérico e cruzou com o contato, também salvamos/atualizamos o Telefone dele
        if (!contactId && cleanPhone) {
          updatePayload.phone = phone; // Mantém com máscara para exibição visual
        }

        const { error: updateError } = await supabase
          .from('contacts')
          .update(updatePayload)
          .eq('id', matchedContactId);

        if (updateError) throw updateError;
      } else {
        // Caminho 3: Não cruzou com nenhum contato existente, cria um novo!
        const { error: insertError } = await supabase
          .from('contacts')
          .insert([{
            name: name.trim(),
            cpf: cleanCpf,
            phone: phone, // Com máscara
            remedio: remedioStatus,
            medications_list: medications,
            status: 'Prospecto',
            avisar: 'Sempre',
            experiences_count: 0,
            observations: medicalNote
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
      background: '#f6f4f0', // Tom claro elegante de papel de linho (Aesthetic Premium)
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#3a413d'
    }}>
      <div style={{
        background: '#ffffff',
        border: '1px solid #d4cbb8', // Borda sutil de tom areia premium
        borderRadius: '20px',
        padding: '3rem',
        width: '100%',
        maxWidth: '580px',
        boxShadow: '0 16px 40px rgba(139, 126, 102, 0.08)',
      }}>
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{
              fontSize: '4rem',
              color: '#2d4a3e',
              marginBottom: '1.5rem',
            }}>
              ✓
            </div>
            <h2 style={{ color: '#2d4a3e', marginBottom: '1rem', fontSize: '1.6rem', fontWeight: '600' }}>
              Ficha Enviada com Sucesso!
            </h2>
            <p style={{ color: '#5a605c', lineHeight: '1.6', fontSize: '0.95rem' }}>
              Suas informações médicas e terapêuticas foram registradas formalmente e armazenadas com segurança em nossa base. Agradecemos sua colaboração e transparência.
            </p>
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#8b7e66',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                fontWeight: '700',
                marginBottom: '0.5rem'
              }}>
                Acompanhamento Seguro
              </div>
              <h1 style={{
                fontSize: '1.8rem',
                color: '#2d4a3e', // Deep premium forest green
                fontWeight: '700',
                margin: 0
              }}>
                Declaração Médica e Terapêutica
              </h1>
              <p style={{ color: '#6d7571', fontSize: '0.9rem', marginTop: '0.6rem', lineHeight: '1.4' }}>
                Este formulário possui caráter confidencial e formal. Por favor, forneça as informações completas sobre o uso de substâncias, remédios e terapias de uso contínuo ou recorrente.
              </p>
            </div>

            {name && (
              <div style={{
                background: '#f2eee5',
                borderLeft: '4px solid #2d4a3e',
                borderRadius: '8px',
                padding: '1.2rem',
                marginBottom: '2rem',
                textAlign: 'left'
              }}>
                <span style={{ fontSize: '1.05rem', fontWeight: '700', color: '#2d4a3e', display: 'block', marginBottom: '0.3rem' }}>
                  Olá, {name}! 👋
                </span>
                <span style={{ fontSize: '0.85rem', color: '#5a605c', lineHeight: '1.4', display: 'block' }}>
                  Preparamos este espaço exclusivo para que você possa declarar suas informações médicas de forma oficial. Revise e complete os campos abaixo.
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
              
              {/* Nome Completo */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#3a413d' }}>
                  Nome Completo <span style={{ color: '#c0392b' }}>*</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome completo do declarante"
                  style={{
                    background: '#faf9f6',
                    border: '1px solid #d4cbb8',
                    borderRadius: '10px',
                    padding: '0.8rem 1rem',
                    fontSize: '0.95rem',
                    color: '#1a1a1a',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2d4a3e';
                    e.target.style.boxShadow = '0 0 0 3px rgba(45, 74, 62, 0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d4cbb8';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* CPF */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#3a413d' }}>
                  CPF <span style={{ color: '#c0392b' }}>*</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  style={{
                    background: '#faf9f6',
                    border: '1px solid #d4cbb8',
                    borderRadius: '10px',
                    padding: '0.8rem 1rem',
                    fontSize: '0.95rem',
                    color: '#1a1a1a',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2d4a3e';
                    e.target.style.boxShadow = '0 0 0 3px rgba(45, 74, 62, 0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d4cbb8';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Telefone / WhatsApp */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#3a413d' }}>
                  Telefone / WhatsApp {isGenericLink && <span style={{ color: '#c0392b' }}>*</span>}
                </label>
                <input 
                  type="text" 
                  required={isGenericLink}
                  value={phone}
                  onChange={handlePhoneChange}
                  disabled={!isGenericLink}
                  placeholder="(00) 00000-0000"
                  style={{
                    background: isGenericLink ? '#faf9f6' : '#f5f3ef',
                    border: '1px solid #d4cbb8',
                    borderRadius: '10px',
                    padding: '0.8rem 1rem',
                    fontSize: '0.95rem',
                    color: isGenericLink ? '#1a1a1a' : '#777',
                    outline: 'none',
                    transition: 'all 0.2s',
                    cursor: isGenericLink ? 'text' : 'not-allowed'
                  }}
                  onFocus={(e) => {
                    if (isGenericLink) {
                      e.target.style.borderColor = '#2d4a3e';
                      e.target.style.boxShadow = '0 0 0 3px rgba(45, 74, 62, 0.08)';
                    }
                  }}
                  onBlur={(e) => {
                    if (isGenericLink) {
                      e.target.style.borderColor = '#d4cbb8';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                />
              </div>

              {/* Adicionar Medicamentos */}
              <div style={{
                borderTop: '1px dashed #d4cbb8',
                paddingTop: '1.8rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.2rem'
              }}>
                <h3 style={{ fontSize: '1.05rem', color: '#2d4a3e', fontWeight: '700', margin: 0 }}>
                  1. Medicamentos e Remédios de Uso Contínuo
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#5a605c', marginTop: '-0.5rem', lineHeight: '1.4' }}>
                  Adicione abaixo todos os medicamentos que você toma regularmente. Se você não utiliza nenhuma medicação de uso contínuo, pode deixar esta seção vazia e seguir para o próximo campo.
                </p>

                {/* Sub-formulário de Medicamento */}
                <div style={{
                  background: '#faf9f6',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: '1px solid #d4cbb8',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  position: 'relative'
                }}>
                  {/* Nome do Remédio + Autocomplete */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', position: 'relative' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#4a534f' }}>Nome do Medicamento</label>
                    <input 
                      type="text"
                      value={currentMed}
                      onChange={handleMedNameChange}
                      placeholder="Ex: Sertralina, Rivotril, Puran T4..."
                      style={{
                        background: '#ffffff',
                        border: '1px solid #d4cbb8',
                        borderRadius: '8px',
                        padding: '0.6rem 0.8rem',
                        fontSize: '0.9rem',
                        color: '#1a1a1a',
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
                        background: '#ffffff',
                        border: '1px solid #d4cbb8',
                        borderRadius: '8px',
                        marginTop: '0.2rem',
                        zIndex: 10,
                        overflow: 'hidden',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                      }}>
                        {suggestions.map(s => (
                          <div 
                            key={s}
                            onClick={() => selectSuggestion(s)}
                            style={{
                              padding: '0.6rem 0.8rem',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f0ebe1',
                              transition: 'background 0.2s',
                              color: '#2d4a3e'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#faf9f6'}
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
                      <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#4a534f' }}>Dosagem</label>
                      <input 
                        type="text"
                        value={currentDosage}
                        onChange={(e) => setCurrentDosage(e.target.value)}
                        placeholder="Ex: 50mg, 10ml, 5gts"
                        style={{
                          background: '#ffffff',
                          border: '1px solid #d4cbb8',
                          borderRadius: '8px',
                          padding: '0.6rem 0.8rem',
                          fontSize: '0.9rem',
                          color: '#1a1a1a',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#4a534f' }}>Frequência</label>
                      <input 
                        type="text"
                        value={currentFreq}
                        onChange={(e) => setCurrentFreq(e.target.value)}
                        placeholder="Ex: 1x ao dia, de 12h em 12h"
                        style={{
                          background: '#ffffff',
                          border: '1px solid #d4cbb8',
                          borderRadius: '8px',
                          padding: '0.6rem 0.8rem',
                          fontSize: '0.9rem',
                          color: '#1a1a1a',
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
                      background: 'rgba(45, 74, 62, 0.05)',
                      color: '#2d4a3e',
                      border: '1px solid rgba(45, 74, 62, 0.2)',
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
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(45, 74, 62, 0.1)'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(45, 74, 62, 0.05)'}
                  >
                    ➕ Adicionar Medicamento à Ficha
                  </button>
                </div>

                {/* Lista de Remédios Já Adicionados */}
                {medications.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.85rem', color: '#2d4a3e', fontWeight: '700' }}>
                      Medicamentos Inclusos ({medications.length}):
                    </div>
                    {medications.map((med, index) => (
                      <div 
                        key={index}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e5dfd3',
                          borderRadius: '10px',
                          padding: '0.6rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1a1a1a' }}>
                            💊 {med.name}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#5a605c' }}>
                            Dose: <strong>{med.dosage}</strong> | Frequência: <strong>{med.frequency}</strong>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMedication(index)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#c0392b',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontWeight: '600'
                          }}
                          onMouseEnter={(e) => e.target.style.background = 'rgba(192, 57, 43, 0.08)'}
                          onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Novo Campo: Observações / Terapias Alternativas */}
              <div style={{
                borderTop: '1px dashed #d4cbb8',
                paddingTop: '1.8rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <h3 style={{ fontSize: '1.05rem', color: '#2d4a3e', fontWeight: '700', margin: 0 }}>
                  2. Observações / Terapias Alternativas
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#5a605c', marginTop: '-0.2rem', lineHeight: '1.4' }}>
                  Declare o uso de substâncias naturais, homeopatia, fitoterápicos, rituais, chás específicos (como Ayahuasca, Cogumelos, etc.), florais, microdosagem ou qualquer terapia de saúde alternativa recorrente.
                </p>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Descreva aqui o uso de terapias alternativas, substâncias ou observações médicas importantes relevantes para a sua segurança..."
                  rows={4}
                  style={{
                    background: '#faf9f6',
                    border: '1px solid #d4cbb8',
                    borderRadius: '10px',
                    padding: '0.8rem 1rem',
                    fontSize: '0.9rem',
                    color: '#1a1a1a',
                    outline: 'none',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2d4a3e';
                    e.target.style.boxShadow = '0 0 0 3px rgba(45, 74, 62, 0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d4cbb8';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Novo Check: Declaração de Responsabilidade */}
              <div style={{
                background: '#faf9f6',
                border: '1px solid #e5dfd3',
                borderRadius: '12px',
                padding: '1.2rem',
                display: 'flex',
                gap: '0.8rem',
                alignItems: 'flex-start',
                cursor: 'pointer'
              }}
              onClick={() => setDeclarationChecked(!declarationChecked)}
              >
                <input 
                  type="checkbox"
                  checked={declarationChecked}
                  onChange={(e) => setDeclarationChecked(e.target.checked)}
                  onClick={(e) => e.stopPropagation()} // Evita duplo clique
                  style={{ 
                    cursor: 'pointer', 
                    width: '18px', 
                    height: '18px', 
                    accentColor: '#2d4a3e',
                    marginTop: '0.2rem'
                  }}
                />
                <label 
                  style={{ 
                    fontSize: '0.85rem', 
                    color: '#3a413d', 
                    lineHeight: '1.5',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <strong>Declaração de Veracidade e Responsabilidade:</strong><br />
                  Declaro que as informações fornecidas acima são totalmente verdadeiras e exatas, e que não utilizo nenhuma medicação contínua além das informadas. Declaro, também, que todo uso de terapias alternativas, fitoterápicos ou substâncias naturais recorrentes está formalmente declarado no campo de observações acima.
                </label>
              </div>

              {/* Botão de Submeter Ficha */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #2d4a3e 0%, #1c3028 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '1rem',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  marginTop: '1rem',
                  boxShadow: '0 4px 15px rgba(45, 74, 62, 0.15)',
                  transition: 'opacity 0.2s, transform 0.1s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.95'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {loading ? 'Processando envio...' : 'Enviar Minha Declaração'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
