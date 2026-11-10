import React, { useState } from 'react';
import { Shield, Users, GraduationCap, Lock, ArrowLeft, Eye, EyeOff, AlertCircle, Church } from 'lucide-react';
import { Role, Teacher } from '../types';
import { DEFAULT_CHAPELS } from '../constants/initialData';

interface LoginPortalProps {
  teachers: Teacher[];
  adminPin: string;
  leaderPin: string;
  chapelList?: string[];
  onLoginSuccess: (role: Role, teacher?: Teacher, chapel?: string) => void;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({
  teachers,
  adminPin,
  leaderPin,
  chapelList = DEFAULT_CHAPELS,
  onLoginSuccess
}) => {
  const [activeRole, setActiveRole] = useState<Role | 'chapel_leader' | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number>(teachers[0]?.id || 1);
  const [selectedChapel, setSelectedChapel] = useState<string>(chapelList[0] || 'ኤልሮኢ ቻፕል');
  const [enteredPin, setEnteredPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSelectRole = (role: Role | 'chapel_leader') => {
    setActiveRole(role);
    setEnteredPin('');
    setErrorMsg('');
    if (role === 'teacher' && teachers.length > 0) {
      setSelectedTeacherId(teachers[0].id);
    }
    if (role === 'chapel_leader' && chapelList.length > 0) {
      setSelectedChapel(chapelList[0]);
    }
  };

  const handleBack = () => {
    setActiveRole(null);
    setEnteredPin('');
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pin = enteredPin.trim();

    if (!pin) {
      setErrorMsg('እባክዎን የPIN ቁጥር ያስገቡ!');
      return;
    }

    if (activeRole === 'admin') {
      if (pin === adminPin) {
        onLoginSuccess('admin');
      } else {
        setErrorMsg('የተሳሳተ የዋና አስተባባሪ PIN ቁጥር ነው!');
      }
    } else if (activeRole === 'leader') {
      if (pin === leaderPin) {
        onLoginSuccess('leader');
      } else {
        setErrorMsg('የተሳሳተ የመሪዎች PIN ቁጥር ነው!');
      }
    } else if (activeRole === 'chapel_leader') {
      if (pin === leaderPin || pin === adminPin) {
        onLoginSuccess('leader', undefined, selectedChapel);
      } else {
        setErrorMsg(`የተሳሳተ የ${selectedChapel} መሪ PIN ቁጥር ነው!`);
      }
    } else if (activeRole === 'teacher') {
      const teacher = teachers.find((t) => t.id === Number(selectedTeacherId));
      if (teacher && teacher.pin === pin) {
        onLoginSuccess('teacher', teacher);
      } else {
        setErrorMsg('የተሳሳተ የመምህር PIN ቁጥር ነው!');
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {!activeRole ? (
        <div>
          <div className="text-center mb-8">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center mb-3 shadow-xs">
              <Church className="w-7 h-7" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              የብርብር ከተማ ቃለ ሕይወት ቤተክርስቲያን - የመግቢያ ፖርታል
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-xl mx-auto font-medium">
              እባክዎን ወደ ስርዓቱ ለመግባት የአገልግሎት ድርሻዎን (ቤተክርስቲያን፣ ቻፕል ወይም የመማሪያ ክፍል) ይምረጡ
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Admin Portal Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-blue-600/50 transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center mb-4 group-hover:scale-105 group-hover:bg-blue-900 group-hover:text-amber-300 transition duration-200 shadow-xs">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-1.5">የቤተክርስቲያን አስተባባሪ</h3>
                <p className="text-slate-600 text-xs leading-relaxed mb-4">
                  የዋና ቤተክርስቲያን አስተባባሪ ገጽ፦ ሙሉ መቆጣጠሪያ፣ ዓመታዊ ዕቅድ፣ የሩብ ዓመት ሪፖርትና የPIN ቅንብር።
                </p>
              </div>
              <button
                onClick={() => handleSelectRole('admin')}
                className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-2.5 px-3 text-xs rounded-xl shadow transition duration-200 cursor-pointer"
              >
                በዋና አስተባባሪነት ግባ
              </button>
            </div>

            {/* General Leader Portal Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-teal-600/50 transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center mb-4 group-hover:scale-105 group-hover:bg-teal-700 group-hover:text-white transition duration-200 shadow-xs">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-1.5">የቤተክርስቲያን መሪዎች</h3>
                <p className="text-slate-600 text-xs leading-relaxed mb-4">
                  የዋና ቤተክርስቲያን የልጆች አገልግሎት መሪዎች፦ የሰንበት ት/ቤት፣ መዘምራንና መንፈሳዊ ቡድኖች ማስተባበሪያ።
                </p>
              </div>
              <button
                onClick={() => handleSelectRole('leader')}
                className="w-full bg-teal-800 hover:bg-teal-700 text-white font-bold py-2.5 px-3 text-xs rounded-xl shadow transition duration-200 cursor-pointer"
              >
                በዋና መሪነት ግባ
              </button>
            </div>

            {/* Chapel Leaders Portal Card (Dedicated for all 10 chapels) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-amber-600/50 transition-all duration-200 flex flex-col justify-between group ring-2 ring-amber-400/30">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center mb-4 group-hover:scale-105 group-hover:bg-amber-600 group-hover:text-white transition duration-200 shadow-xs">
                  <Church className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1 mb-1">
                  <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.2 rounded-full uppercase">10ሩም ቻፕሎች</span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-1.5">የቻፕሎች መሪዎች / ተወካዮች</h3>
                <p className="text-slate-600 text-xs leading-relaxed mb-4">
                  የ10ሩም ቻፕሎች (ኤልሮኢ፣ ሻሎም፣ ቤቴል፣ ያህዌ፣ ኤዴን፣ አቤንኤዘር፣ ርኆቦት፣ ኤልሻዳይ፣ ሩሐማ፣ አዶናይ) መግቢያ።
                </p>
              </div>
              <button
                onClick={() => handleSelectRole('chapel_leader')}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-3 text-xs rounded-xl shadow transition duration-200 cursor-pointer"
              >
                የቻፕል መግቢያ ይምረጡ →
              </button>
            </div>

            {/* Teacher Portal Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-indigo-600/50 transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-800 flex items-center justify-center mb-4 group-hover:scale-105 group-hover:bg-indigo-700 group-hover:text-white transition duration-200 shadow-xs">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-1.5">የመማሪያ ክፍል መምህራን</h3>
                <p className="text-slate-600 text-xs leading-relaxed mb-4">
                  በግል መግቢያ ቁልፍ (PIN) በመግባት ለተመደቡበት ክፍል ውጤትና የተማሪ አተንዳንስ መቆጣጠሪያ።
                </p>
              </div>
              <button
                onClick={() => handleSelectRole('teacher')}
                className="w-full bg-indigo-900 hover:bg-indigo-800 text-white font-bold py-2.5 px-3 text-xs rounded-xl shadow transition duration-200 cursor-pointer"
              >
                በመምህርነት ግባ
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Login Form Card */
        <div className="max-w-md mx-auto bg-white rounded-2xl p-8 border border-slate-200 shadow-xl">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold mb-6 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            ወደ ምርጫ ገጽ ተመለስ
          </button>

          <div className="text-center mb-6">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center mb-3 border border-blue-200">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">
              {activeRole === 'admin'
                ? 'የቤተክርስቲያን አስተባባሪ መግቢያ'
                : activeRole === 'leader'
                ? 'የቤተክርስቲያን መሪዎች መግቢያ'
                : activeRole === 'chapel_leader'
                ? 'የቻፕሎች መሪዎችና ተወካዮች መግቢያ'
                : 'የመማሪያ ክፍል መምህራን መግቢያ'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {activeRole === 'admin'
                ? 'የቤተክርስቲያን አስተባባሪ ምስጢር ቁጥር (PIN) ያስገቡ (ነባሪ: 1234)'
                : activeRole === 'leader'
                ? 'የቤተክርስቲያን መሪዎች ምስጢር ቁጥር (PIN) ያስገቡ (ነባሪ: 5678)'
                : activeRole === 'chapel_leader'
                ? 'የተመደቡበትን ቻፕል መርጠው የመሪዎች PIN (5678) ያስገቡ'
                : 'ስምዎን መርጠው የግል PIN ያስገቡ (ነባሪ: 1001-1033)'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Chapel Selection Dropdown for Chapel Leaders */}
            {activeRole === 'chapel_leader' && (
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  ቻፕል (አጥቢያ ማዕከል) ይምረጡ፦
                </label>
                <div className="relative">
                  <select
                    value={selectedChapel}
                    onChange={(e) => setSelectedChapel(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-amber-50/60 border border-amber-300 rounded-xl text-xs font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                  >
                    {chapelList.map((ch) => (
                      <option key={`login_ch_${ch}`} value={ch}>
                        🏛️ {ch}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Teacher Selection Dropdown */}
            {activeRole === 'teacher' && (
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  መምህር ይምረጡ፦
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                >
                  {[...teachers]
                    .sort((a, b) => a.name.localeCompare(b.name, 'am'))
                    .map((t, idx) => (
                      <option key={`teach_opt_${t.id}_${idx}`} value={t.id}>
                        {t.name} ({t.assignedClass}{t.assignedSubject ? ` - ${t.assignedSubject}` : ''})
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                የምስጢር ቁጥር (PIN)፦
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  placeholder="PIN ቁጥር ያስገቡ"
                  className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white tracking-widest"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-blue-900 hover:bg-blue-800 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition duration-200 cursor-pointer"
            >
              {activeRole === 'chapel_leader' ? `ወደ ${selectedChapel} ግባ` : 'ግባ'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

