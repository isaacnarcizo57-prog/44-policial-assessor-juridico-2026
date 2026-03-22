import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Plus, 
  Menu, 
  Settings, 
  AlertCircle, 
  ArrowLeft,
  Scale,
  Gavel,
  Trash2,
  Copy,
  Check,
  ChevronRight,
  Users,
  Car,
  MapPin,
  UserPlus,
  FileText,
  Save,
  X,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { 
  db, 
  auth 
} from './firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  setDoc,
} from 'firebase/firestore';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { aiService } from './services/aiService';

// Types
interface ReportData {
  atendentes: string;
  vtr: string;
  localizacao: string;
  participantes: { id: string; name: string; role: string }[];
  complemento: string;
}

function AppContent() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reportData, setReportData] = useState<ReportData>({
    atendentes: '',
    vtr: '',
    localizacao: '',
    participantes: [],
    complemento: ''
  });

  const [legalAnalysisResult, setLegalAnalysisResult] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const getDraftHistory = (data: ReportData) => {
    const atendentes = data.atendentes ? data.atendentes.toUpperCase() : '[NÃO INFORMADO]';
    const vtrNum = data.vtr ? data.vtr.toUpperCase() : '[NÃO INFORMADO]';
    const local = data.localizacao ? data.localizacao.toUpperCase() : '[NÃO INFORMADO]';
    
    const participantes = data.participantes && data.participantes.length > 0
      ? data.participantes.map(p => `${p.name.toUpperCase()} (${p.role.toUpperCase()})`).join(', ')
      : '[NÃO INFORMADO]';

    let text = `PATRULHAMENTO OSTENSIVO MOTORIZADO, A GUARNIÇÃO COMPOSTA PELO ${atendentes}, A BORDO DA VTR ${vtrNum}, REALIZAVA PATRULHAMENTO QUANDO FOI DESPACHADA VIA COPOM PARA ATENDIMENTO DE OCORRÊNCIA NA ${local} E FIZERAM CONTATO COM ${participantes}...`.toUpperCase();
    
    if (data.complemento) {
      text += `\n\n${data.complemento.toUpperCase()}`;
    }
    
    return text;
  };

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
      
      if (currentUser) {
        try {
          await setDoc(doc(db, 'users', currentUser.uid), {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (error) {
          console.error("Error syncing user profile:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const addParticipant = () => {
    const id = Math.random().toString(36).substr(2, 9);
    setReportData(prev => ({
      ...prev,
      participantes: [...prev.participantes, { id, name: '', role: 'VÍTIMA' }]
    }));
  };

  const updateParticipant = (id: string, field: 'name' | 'role', value: string) => {
    setReportData(prev => ({
      ...prev,
      participantes: prev.participantes.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const removeParticipant = (id: string) => {
    setReportData(prev => ({
      ...prev,
      participantes: prev.participantes.filter(p => p.id !== id)
    }));
  };

  const resetReport = () => {
    if (window.confirm('DESEJA REALMENTE LIMPAR TODOS OS DADOS?')) {
      setReportData({
        atendentes: '',
        vtr: '',
        localizacao: '',
        participantes: [],
        complemento: ''
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } else {
        // Fallback for non-secure contexts or unsupported browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
          console.error('Fallback copy failed', err);
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const renderDashboard = () => {
    return (
      <div className="flex flex-col gap-8 p-4 pb-24">
        {/* ATENDENTES */}
        <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4 bg-slate-900 p-4 rounded-2xl shadow-lg shadow-slate-900/10">
            <h3 className="font-black text-white uppercase tracking-widest flex items-center gap-3 text-[11px]">
              <Users size={18} className="text-blue-400" />
              NOME E ID DO(S) ATENDENTE(S)
            </h3>
            <button 
              onClick={resetReport}
              className="p-2 text-slate-500 hover:text-red-500 transition-colors"
              title="LIMPAR TUDO"
            >
              <RotateCcw size={18} />
            </button>
          </div>
          <textarea
            value={reportData.atendentes}
            onChange={(e) => setReportData(prev => ({ ...prev, atendentes: e.target.value }))}
            placeholder="EX: SGT SILVA 123456, SD SANTOS 789012"
            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm min-h-[80px] outline-none focus:ring-2 focus:ring-blue-600/20 transition-all uppercase font-bold"
          />
        </section>

        {/* VTR */}
        <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="bg-slate-900 p-4 rounded-2xl shadow-lg shadow-slate-900/10 mb-4">
            <h3 className="font-black text-white uppercase tracking-widest flex items-center gap-3 text-[11px]">
              <Car size={18} className="text-blue-400" />
              NÚMERO DA VTR
            </h3>
          </div>
          <input
            type="text"
            value={reportData.vtr}
            onChange={(e) => setReportData(prev => ({ ...prev, vtr: e.target.value }))}
            placeholder="EX: 14741"
            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-blue-600/20 transition-all uppercase font-bold"
          />
        </section>

        {/* LOCAL */}
        <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="bg-slate-900 p-4 rounded-2xl shadow-lg shadow-slate-900/10 mb-4">
            <h3 className="font-black text-white uppercase tracking-widest flex items-center gap-3 text-[11px]">
              <MapPin size={18} className="text-blue-400" />
              LOCALIZAÇÃO (RUA, Nº, BAIRRO, CIDADE)
            </h3>
          </div>
          <textarea
            value={reportData.localizacao}
            onChange={(e) => setReportData(prev => ({ ...prev, localizacao: e.target.value }))}
            placeholder="EX: RUA DAS FLORES, 123, CENTRO, PORTO ALEGRE"
            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm min-h-[80px] outline-none focus:ring-2 focus:ring-blue-600/20 transition-all uppercase font-bold"
          />
        </section>

        {/* ENVOLVIDOS */}
        <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4 bg-slate-900 p-4 rounded-2xl shadow-lg shadow-slate-900/10">
            <h3 className="font-black text-white uppercase tracking-widest flex items-center gap-3 text-[11px]">
              <UserPlus size={18} className="text-blue-400" />
              PARTICIPANTES E SUAS CONDIÇÕES (VÍTIMA/AUTOR)
            </h3>
            <button 
              onClick={addParticipant}
              className="p-2 bg-slate-200 text-slate-800 rounded-xl hover:bg-slate-300 transition-colors shadow-sm"
            >
              <Plus size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            {reportData.participantes.length === 0 && (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-400 font-bold uppercase">Nenhum envolvido adicionado</p>
              </div>
            )}
            {reportData.participantes.map((p) => (
              <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 relative group">
                <button 
                  onClick={() => removeParticipant(p.id)}
                  className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => updateParticipant(p.id, 'name', e.target.value)}
                  placeholder="NOME COMPLETO"
                  className="w-full bg-white border-none rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-blue-600/20 uppercase font-bold"
                />
                <div className="flex gap-2">
                  {['VÍTIMA', 'AUTOR', 'TESTEMUNHA'].map((role) => (
                    <button
                      key={role}
                      onClick={() => updateParticipant(p.id, 'role', role)}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-[10px] font-bold transition-all border",
                        p.role === role 
                          ? "bg-slate-300 text-slate-900 border-slate-400" 
                          : "bg-white text-slate-500 border-slate-100"
                      )}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* HISTÓRICO & PARECER JURÍDICO */}
        <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="bg-slate-900 p-4 rounded-2xl shadow-lg shadow-slate-900/10 mb-6">
            <h3 className="font-black text-white uppercase tracking-widest flex items-center gap-3 text-[11px]">
              <FileText size={18} className="text-blue-400" />
              Histórico e Parecer Jurídico
            </h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold mb-2">Complemento do Relato</p>
              <textarea
                value={reportData.complemento}
                onChange={(e) => setReportData(prev => ({ ...prev, complemento: e.target.value }))}
                placeholder="DESCREVA O QUE ACONTECEU DE FATO..."
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm min-h-[120px] outline-none focus:ring-2 focus:ring-blue-600/20 transition-all uppercase font-bold"
              />
            </div>

            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Prévia do Histórico</p>
                <button 
                  onClick={() => copyToClipboard(getDraftHistory(reportData))}
                  className="p-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  {isCopied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <p className="text-xs text-slate-300 font-mono leading-relaxed uppercase">
                {getDraftHistory(reportData)}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => copyToClipboard(getDraftHistory(reportData))}
                className="w-full bg-slate-200 text-slate-800 font-bold py-4 rounded-2xl shadow-md hover:bg-slate-300 transition-all flex items-center justify-center gap-2"
              >
                <Save size={20} /> {isCopied ? 'COPIADO!' : 'COPIAR PARA BM-MOB'}
              </button>

              <button 
                onClick={() => handleLegalAnalysis(getDraftHistory(reportData))}
                disabled={isAnalyzing}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
              >
                <Gavel size={20} /> {isAnalyzing ? 'ANALISANDO...' : 'GERAR PARECER JURÍDICO'}
              </button>
            </div>

            {legalAnalysisResult && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-3xl border-2 border-slate-900 shadow-2xl space-y-4 mt-8"
              >
                <div className="flex items-center justify-between bg-slate-900 -mx-6 -mt-6 p-4 rounded-t-2xl mb-4">
                  <h4 className="font-black text-white text-sm uppercase tracking-[0.2em] flex items-center gap-3">
                    <Scale size={20} className="text-blue-400" />
                    Parecer Técnico Jurídico
                  </h4>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => copyToClipboard(legalAnalysisResult)}
                      className="p-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all border border-slate-700 shadow-sm"
                      title="Copiar Parecer"
                    >
                      {isCopied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                    </button>
                    <button 
                      onClick={() => setLegalAnalysisResult('')}
                      className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20 shadow-sm"
                      title="Limpar Parecer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="relative group">
                  <textarea
                    value={legalAnalysisResult}
                    onChange={(e) => setLegalAnalysisResult(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs leading-relaxed text-slate-700 font-mono min-h-[200px] outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all resize-y uppercase"
                    placeholder="O PARECER JURÍDICO APARECERÁ AQUI..."
                  />
                  <div className="absolute bottom-4 right-4 opacity-30 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Modo Edição Ativo</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => copyToClipboard(legalAnalysisResult)}
                    className="flex-1 bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 uppercase tracking-wider text-sm"
                  >
                    <Check size={20} /> {isCopied ? 'COPIADO COM SUCESSO!' : 'FINALIZAR E COPIAR'}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </section>
      </div>
    );
  };

  const handleLegalAnalysis = async (text: string) => {
    if (!text || text.length < 10) return;
    
    setLegalAnalysisResult('');
    setIsAnalyzing(true);
    
    // Create a timeout to prevent indefinite waiting
    const timeoutId = setTimeout(() => {
      if (isAnalyzing) {
        setIsAnalyzing(false);
        setLegalAnalysisResult("O PROCESSAMENTO ESTÁ DEMORANDO MAIS QUE O ESPERADO. POR FAVOR, TENTE NOVAMENTE EM ALGUNS INSTANTES.");
      }
    }, 45000); // 45 seconds timeout

    try {
      const result = await aiService.analyzeLegalOccurrence(text);
      clearTimeout(timeoutId);
      setLegalAnalysisResult(result);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("Legal Analysis Error:", error);
      setLegalAnalysisResult(`ERRO AO PROCESSAR ANÁLISE JURÍDICA: ${error instanceof Error ? error.message : 'ERRO DESCONHECIDO'}. TENTE NOVAMENTE.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-bold text-sm animate-pulse uppercase">CARREGANDO SISTEMA...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="size-20 rounded-3xl bg-white flex items-center justify-center overflow-hidden shadow-2xl shadow-blue-600/10 mb-8 border border-slate-100">
          <img 
            src="https://skilled-amber-kyxgml4xy2.edgeone.app/1773603287622.png?v=1" 
            className="w-full h-full object-cover" 
            alt="44 POLICIAL"
            referrerPolicy="no-referrer"
          />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2 uppercase">44 POLICIAL</h1>
        <p className="text-slate-500 mb-8 max-w-xs uppercase">
          Acesse o sistema de gestão de ocorrências com sua conta Google.
        </p>
        <button 
          onClick={handleLogin}
          className="flex items-center gap-3 bg-white text-slate-700 font-bold px-8 py-4 rounded-2xl shadow-lg border border-slate-100 hover:scale-105 transition-transform active:scale-95 uppercase"
        >
          <img src="https://www.gstatic.com/firebase/dashboards/images/google-logo.svg" className="size-5" alt="Google" />
          Entrar com Google
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 max-w-md mx-auto shadow-2xl relative overflow-x-hidden">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 max-w-md mx-auto"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 w-64 bg-white z-50 shadow-2xl p-6 flex flex-col gap-8"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-white flex items-center justify-center overflow-hidden border border-slate-100">
                  <img 
                    src="https://skilled-amber-kyxgml4xy2.edgeone.app/1773603287622.png?v=1" 
                    className="w-full h-full object-cover" 
                    alt="44 POLICIAL"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 uppercase">44 POLICIAL</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Enterprise v1.0</p>
                </div>
              </div>

              <nav className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl font-bold text-sm transition-all uppercase bg-blue-50 text-blue-600"
                >
                  <LayoutDashboard size={20} />
                  44 POLICIAL
                </button>
              </nav>

              <div className="mt-auto flex flex-col gap-4">
                <button className="flex items-center gap-3 p-3 rounded-xl font-bold text-sm text-slate-400 hover:bg-slate-50 uppercase">
                  <Settings size={20} />
                  Configurações
                </button>
                <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3">
                  <div className="size-10 rounded-full overflow-hidden border-2 border-white shadow-sm bg-white">
                    <img 
                      src="https://skilled-amber-kyxgml4xy2.edgeone.app/1773603287622.png?v=1" 
                      alt="" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate uppercase">{user?.displayName}</p>
                    <button onClick={handleLogout} className="text-[10px] font-bold text-red-500 uppercase">Sair</button>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <Menu size={20} className="text-slate-600" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-slate-900 leading-tight uppercase">
              44 POLICIAL
            </h1>
          </div>
        </div>
        <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 overflow-hidden border border-slate-100">
          <img 
            src="https://skilled-amber-kyxgml4xy2.edgeone.app/1773603287622.png?v=1" 
            alt={user?.displayName || ''} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">
        {renderDashboard()}
      </main>

      {/* Navigation Bar (Mobile Style) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-2 flex items-center justify-around max-w-md mx-auto z-30">
        <button 
          className="flex flex-col items-center gap-1 p-2 transition-colors text-blue-600"
        >
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-bold uppercase">44 POLICIAL</span>
        </button>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <AppContent />
  );
}
