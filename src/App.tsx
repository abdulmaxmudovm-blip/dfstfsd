import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  Loader2,
  ChevronRight,
  ClipboardList,
  BookOpen,
  LayoutGrid,
  Settings,
  Users,
  LogOut,
  User,
  PlusCircle,
  Play
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Types
interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

interface TestQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface Test {
  id: string;
  title: string;
  questions: TestQuestion[];
  createdAt: number;
}

interface Book {
  id: string;
  title: string;
  author: string;
  addedAt: number;
}

interface UserLog {
  id: string;
  userName: string;
  action: 'login' | 'logout';
  timestamp: number;
}

type View = 'checklist' | 'tests' | 'books' | 'admin';

export default function App() {
  // User State
  const [user, setUser] = useState<string | null>(() => localStorage.getItem('zen_user'));
  const [tempName, setTempName] = useState('');

  // App State
  const [view, setView] = useState<View>('checklist');
  const [items, setItems] = useState<ChecklistItem[]>(() => {
    const saved = localStorage.getItem('zencheck_items');
    return saved ? JSON.parse(saved) : [];
  });
  const [tests, setTests] = useState<Test[]>(() => {
    const saved = localStorage.getItem('zencheck_tests');
    return saved ? JSON.parse(saved) : [];
  });
  const [books, setBooks] = useState<Book[]>(() => {
    const saved = localStorage.getItem('zencheck_books');
    return saved ? JSON.parse(saved) : [];
  });
  const [logs, setLogs] = useState<UserLog[]>(() => {
    const saved = localStorage.getItem('zencheck_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // UI State
  const [inputValue, setInputValue] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('zencheck_items', JSON.stringify(items));
    localStorage.setItem('zencheck_tests', JSON.stringify(tests));
    localStorage.setItem('zencheck_books', JSON.stringify(books));
    localStorage.setItem('zencheck_logs', JSON.stringify(logs));
  }, [items, tests, books, logs]);

  const addLog = (name: string, action: 'login' | 'logout') => {
    const newLog: UserLog = {
      id: crypto.randomUUID(),
      userName: name,
      action,
      timestamp: Date.now(),
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      setUser(tempName.trim());
      localStorage.setItem('zen_user', tempName.trim());
      addLog(tempName.trim(), 'login');
    }
  };

  const handleLogout = () => {
    if (user) {
      addLog(user, 'logout');
      setUser(null);
      localStorage.removeItem('zen_user');
    }
  };

  // Checklist Actions
  const addItem = (text: string) => {
    if (!text.trim()) return;
    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: text.trim(),
      completed: false,
      createdAt: Date.now(),
    };
    setItems(prev => [newItem, ...prev]);
    setInputValue('');
    setSuggestion(null);
  };

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // AI Refinement
  const refineWithAi = async () => {
    if (!inputValue.trim()) return;
    setIsAiLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `I want to add an item to my checklist. I typed: "${inputValue}". Please provide a more polished, concise, and professional version of this checklist item in English. Only provide the corrected text, nothing else.`,
      });
      const text = response.text;
      if (text) {
        setSuggestion(text.trim());
      }
    } catch (error) {
      console.error("Gemini Error:", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Login View
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[120px] opacity-20"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600 rounded-full blur-[150px] opacity-20"></div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-md bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[32px] p-10 shadow-2xl"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30">
              <ClipboardList className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 font-serif uppercase tracking-widest">ZenCheck</h1>
            <p className="text-slate-400 text-center">Xush kelibsiz! Ilovadan foydalanish uchun ismingizni kiriting.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="text"
                placeholder="Ismingizni yozing..."
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-[0.98]"
            >
              Kirish
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-2 md:p-8 overflow-hidden bg-[#0f172a]">
      {/* Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600 rounded-full blur-[120px] opacity-20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-purple-600 rounded-full blur-[150px] opacity-20"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="z-10 w-full max-w-6xl h-[90vh] bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[40px] shadow-2xl flex overflow-hidden relative"
      >
        {/* Navigation Sidebar */}
        <aside className="w-20 md:w-64 bg-white/5 border-r border-white/10 flex flex-col items-center md:items-stretch py-8">
          <div className="px-4 mb-10 hidden md:block">
             <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center">
                <ClipboardList className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">ZenCheck</span>
            </div>
          </div>

          <nav className="flex-1 space-y-2 px-2 md:px-4">
            <NavItem 
              icon={<LayoutGrid />} 
              label="Checklist" 
              active={view === 'checklist'} 
              onClick={() => setView('checklist')} 
            />
            <NavItem 
              icon={<CheckCircle2 />} 
              label="Testlar" 
              active={view === 'tests'} 
              onClick={() => setView('tests')} 
            />
            <NavItem 
              icon={<BookOpen />} 
              label="Kitoblar" 
              active={view === 'books'} 
              onClick={() => setView('books')} 
            />
            <NavItem 
              icon={<Users />} 
              label="Admin Logs" 
              active={view === 'admin'} 
              onClick={() => setView('admin')} 
            />
          </nav>

          <div className="mt-auto px-4 pb-4">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full p-4 rounded-2xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all group"
            >
              <LogOut className="w-6 h-6 shrink-0 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden md:block font-bold truncate">Chiqish</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white/[0.02]">
          <header className="px-8 py-6 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white font-serif tracking-wide uppercase">
              {view === 'checklist' ? 'Daily Tasks' : view === 'tests' ? 'Tests' : view === 'books' ? 'Books Library' : 'System Logs'}
            </h2>
            <div className="flex items-center gap-4">
               <div className="text-right hidden sm:block">
                <p className="text-white font-bold text-sm">{user}</p>
                <p className="text-xs text-slate-500 uppercase tracking-widest leading-none">Online</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold uppercase">
                {user.charAt(0)}
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <AnimatePresence mode="wait">
              {view === 'checklist' && <ChecklistView items={items} addItem={addItem} toggleItem={toggleItem} deleteItem={deleteItem} inputValue={inputValue} setInputValue={setInputValue} refineWithAi={refineWithAi} isAiLoading={isAiLoading} suggestion={suggestion} />}
              {view === 'tests' && <TestsView tests={tests} setTests={setTests} />}
              {view === 'books' && <BooksView books={books} setBooks={setBooks} />}
              {view === 'admin' && <AdminView logs={logs} />}
            </AnimatePresence>
          </div>
        </main>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.1); }
      `}} />
    </div>
  );
}

// --- Components ---

function NavItem({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${
        active 
          ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
          : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <div className="shrink-0 text-current">
        {React.cloneElement(icon, { className: 'w-6 h-6' })}
      </div>
      <span className="hidden md:block font-bold tracking-tight">{label}</span>
    </button>
  );
}

function ChecklistView({ items, addItem, toggleItem, deleteItem, inputValue, setInputValue, refineWithAi, isAiLoading, suggestion }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-3xl mx-auto space-y-8">
      {/* Input Section */}
      <div className="relative group">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem(inputValue)}
          placeholder="New task here..."
          className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 px-8 pr-32 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 text-lg shadow-inner"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <button
            onClick={refineWithAi}
            disabled={isAiLoading || !inputValue}
            className="p-3 rounded-2xl hover:bg-white/10 text-indigo-400 transition-all disabled:opacity-30"
          >
            {isAiLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
          </button>
          <button
            onClick={() => addItem(inputValue)}
            disabled={!inputValue}
            className="bg-indigo-500 hover:bg-indigo-600 text-white p-3 rounded-2xl font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {suggestion && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-between gap-4">
             <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
              <p className="text-indigo-100 italic">"{suggestion}"</p>
             </div>
             <button onClick={() => addItem(suggestion)} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold text-white tracking-widest uppercase">Apply</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="py-20 text-center opacity-30">
            <ClipboardList className="w-20 h-20 mx-auto mb-6 text-slate-500" />
            <p className="text-xl font-serif italic text-slate-400">Your task list is waiting for its first item.</p>
          </div>
        ) : (
          items.map((item: any) => (
            <motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`group flex items-center gap-4 p-5 rounded-3xl border transition-all ${item.completed ? 'bg-transparent border-white/5 opacity-40' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
              <button onClick={() => toggleItem(item.id)} className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${item.completed ? 'bg-emerald-500 border-emerald-500 shadow-emerald-500/20 shadow-lg' : 'border-white/20'}`}>
                {item.completed && <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={3} />}
              </button>
              <span className={`text-lg flex-grow ${item.completed ? 'line-through decoration-emerald-500/50 italic text-slate-500' : 'text-slate-200'}`}>{item.text}</span>
              <button onClick={() => deleteItem(item.id)} className="p-2.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-5 h-5"/></button>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}

function TestsView({ tests, setTests }: { tests: Test[], setTests: any }) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const addTest = () => {
    if (!newTitle.trim()) return;
    const newTest: Test = {
      id: crypto.randomUUID(),
      title: newTitle,
      questions: [],
      createdAt: Date.now()
    };
    setTests([newTest, ...tests]);
    setNewTitle('');
    setIsCreating(false);
  };

  const deleteTest = (id: string) => {
    setTests(tests.filter(t => t.id !== id));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-xl text-white font-bold mb-1">Available Quizzes</h3>
          <p className="text-sm text-slate-500">Create tests to challenge yourself or others.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20"
        >
          <PlusCircle className="w-5 h-5" />
          <span>New Test</span>
        </button>
      </div>

      {isCreating && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-6 bg-white/5 border border-white/10 rounded-3xl">
          <input 
            type="text" 
            placeholder="Test nomi (e.g. English Grammar)..." 
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="w-full bg-[#1e293b] border border-white/10 rounded-2xl p-4 text-white placeholder-slate-600 mb-4 focus:outline-none focus:border-indigo-500/40"
          />
          <div className="flex gap-2">
            <button onClick={addTest} className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold">Saqlash</button>
            <button onClick={() => setIsCreating(false)} className="bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-xl font-bold">Bekor qilish</button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tests.map(test => (
          <div key={test.id} className="p-6 bg-white/5 border border-white/10 rounded-3xl group hover:border-indigo-500/30 transition-all flex justify-between items-center shadow-lg">
            <div>
              <h4 className="text-white font-bold text-lg mb-1">{test.title}</h4>
              <p className="text-xs text-slate-500 uppercase tracking-widest">{new Date(test.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex gap-2">
              <button className="p-3 bg-white/5 hover:bg-indigo-500/20 text-indigo-400 rounded-xl transition-all" title="Start Test"><Play className="w-5 h-5" /></button>
              <button onClick={() => deleteTest(test.id)} className="p-3 bg-white/5 hover:bg-red-500/20 text-red-400 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
            </div>
          </div>
        ))}
        {tests.length === 0 && !isCreating && (
          <div className="col-span-full py-12 text-center text-slate-500 italic opacity-40">Hozircha testlar yo'q.</div>
        )}
      </div>
    </motion.div>
  );
}

function BooksView({ books, setBooks }: { books: Book[], setBooks: any }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', author: '' });

  const addBook = () => {
    if (!newBook.title.trim()) return;
    const book: Book = {
      id: crypto.randomUUID(),
      title: newBook.title,
      author: newBook.author,
      addedAt: Date.now()
    };
    setBooks([book, ...books]);
    setNewBook({ title: '', author: '' });
    setIsAdding(false);
  };

  const deleteBook = (id: string) => {
    setBooks(books.filter((b: Book) => b.id !== id));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-xl text-white font-bold mb-1">Your Library</h3>
          <p className="text-sm text-slate-500">Keep track of the books you read.</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg">
          <BookOpen className="w-5 h-5" />
          <span>Add Book</span>
        </button>
      </div>

      {isAdding && (
         <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
          <input placeholder="Book Title" value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} className="w-full bg-[#1e293b] border border-white/10 rounded-2xl p-4 text-white" />
          <input placeholder="Author (optional)" value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} className="w-full bg-[#1e293b] border border-white/10 rounded-2xl p-4 text-white" />
          <div className="flex gap-2">
            <button onClick={addBook} className="bg-indigo-500 px-6 py-2.5 rounded-xl text-white font-bold">Add</button>
            <button onClick={() => setIsAdding(false)} className="bg-white/5 px-6 py-2.5 rounded-xl text-white font-bold">Cancel</button>
          </div>
         </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map(book => (
          <div key={book.id} className="relative p-6 bg-white/5 border border-white/10 rounded-3xl flex flex-col group overflow-hidden hover:border-indigo-500/30 transition-all">
            <div className="w-full aspect-[3/4] bg-indigo-500/10 rounded-xl mb-4 flex items-center justify-center p-4 text-center">
              <span className="text-indigo-400 font-serif italic text-lg line-clamp-3">{book.title}</span>
            </div>
            <h4 className="text-white font-bold truncate mb-1">{book.title}</h4>
            <p className="text-xs text-slate-500 truncate">{book.author || 'Unknown Author'}</p>
            <button onClick={() => deleteBook(book.id)} className="absolute top-4 right-4 p-2 bg-red-400/10 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {books.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center text-slate-500 italic opacity-40">Kutubxonangiz bo'sh.</div>
        )}
      </div>
    </motion.div>
  );
}

function AdminView({ logs }: { logs: UserLog[] }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
      <div className="bg-white/5 border border-white/10 rounded-[32px] overflow-hidden">
        <div className="p-6 bg-white/[0.02] border-b border-white/10">
          <h3 className="text-xl text-white font-bold">User Activity Logs</h3>
          <p className="text-sm text-slate-500 mt-1">Bu bo'limda foydalanuvchilarning tizimga kirganligi va chiqqanligi ko'rsatiladi.</p>
        </div>
        <div className="divide-y divide-white/[0.05]">
          {logs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 italic">Hozircha hech qanday log yo'q.</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${log.action === 'login' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40' : 'bg-red-500 shadow-lg shadow-red-500/40'}`}></div>
                  <div>
                    <p className="text-white font-bold uppercase tracking-tight">{log.userName}</p>
                    <p className="text-xs text-slate-500">{log.action === 'login' ? 'Tizimga kirdi' : 'Tizimdan chiqdi'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-slate-200 text-sm font-medium">{new Date(log.timestamp).toLocaleTimeString()}</p>
                  <p className="text-[10px] text-slate-600 uppercase tracking-widest">{new Date(log.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
