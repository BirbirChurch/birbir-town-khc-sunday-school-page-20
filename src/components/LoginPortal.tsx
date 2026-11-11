import React, { useState } from 'react';
import { Shield, Users, GraduationCap, ArrowLeft, Church, Check } from 'lucide-react';
import { Role, Teacher } from '../types';
import { DEFAULT_CHAPELS } from '../constants/initialData';

interface LoginPortalProps {
  teachers: Teacher[];
  chapelList?: string[];
  onLoginSuccess: (role: Role, teacher?: Teacher, chapel?: string) => void;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({
  teachers,
  chapelList = DEFAULT_CHAPELS,
  onLoginSuccess
}) => {
  const [activeRole, setActiveRole] = useState<Role | 'chapel_leader' | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number>(teachers[0]?.id || 1);
  const [selectedChapel, setSelectedChapel] = useState<string>(chapelList[0] || 'ኤልሮኢ ቻፕል');

  const handleSelectRole = (role: Role | 'chapel_leader') => {
    if (role === 'admin') {
      onLoginSuccess('admin');
      return;
    }
    if (role === 'leader') {
      onLoginSuccess('leader');
      return;
    }
    setActiveRole(role);
    if (role === 'teacher' && teachers.length > 0) {
      setSelectedTeacherId(teachers[0].id);
    }
    if (role === 'chapel_leader' && chapelList.length > 0) {
      setSelectedChapel(chapelList[0]);
    }
  };

  const handleBack = () => {
    setActiveRole(null);
  };

  const handleChapelLogin = (chapelName: string) => {
    onLoginSuccess('leader', undefined, chapelName);
  };

  const handleTeacherLogin = () => {
    const teacher = teachers.find((t) => t.id === Number(selectedTeacherId)) || teachers[0];
    if (teacher) {
      onLoginSuccess('teacher', teacher);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {!activeRole ? (
        <div>
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-900 text-amber-300 flex items-center justify-center mb-3 shadow-md border border-blue-700">
              <Church className="w-8 h-8" />
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
                  የዋና ቤተክርስቲያን አስተባባሪ ገጽ፦ ሙሉ መቆጣጠሪያ፣ ዓመታዊ ዕቅድና የሩብ ዓመት ሪፖርት።
                </p>
              </div>
              <button
                onClick={() => handleSelectRole('admin')}
                className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-2.5 px-3 text-xs rounded-xl shadow transition duration-200 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>በዋና አስተባባሪነት ግባ</span>
                <Check className="w-4 h-4 text-amber-300" />
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
                className="w-full bg-teal-800 hover:bg-teal-700 text-white font-bold py-2.5 px-3 text-xs rounded-xl shadow transition duration-200 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>በዋና መሪነት ግባ</span>
                <Check className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Chapel Leaders Portal Card */}
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
                  ለተመደቡበት ክፍል ውጤትና የተማሪ አተንዳንስ መቆጣጠሪያ መግቢያ።
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
        /* Direct Role Selection Sub-Card (No PIN entry needed) */
        <div className="max-w-xl mx-auto bg-white rounded-2xl p-8 border border-slate-200 shadow-xl">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold mb-6 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            ወደ ዋናው መግቢያ ገጽ ተመለስ
          </button>

          <div className="text-center mb-6">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center mb-3 border border-amber-200 shadow-xs">
              {activeRole === 'chapel_leader' ? <Church className="w-6 h-6" /> : <GraduationCap className="w-6 h-6" />}
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">
              {activeRole === 'chapel_leader' ? 'የቻፕል መሪዎችና ተወካዮች መግቢያ' : 'የመማሪያ ክፍል መምህራን መግቢያ'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {activeRole === 'chapel_leader'
                ? 'እባክዎን የሚመሩትን ቻፕል ይምረጡ'
                : 'እባክዎን ስምዎን መርጠው ይግቡ'}
            </p>
          </div>

          <div className="space-y-4">
            {/* Chapel Selection Dropdown & Grid for Chapel Leaders */}
            {activeRole === 'chapel_leader' && (
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  1) ከታች ካሉት 10ሩ ቻፕሎች አንዱን ጠቅ አድርገው ይግቡ፦
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 mb-4">
                  {chapelList.map((ch) => (
                    <button
                      key={`direct_ch_${ch}`}
                      type="button"
                      onClick={() => handleChapelLogin(ch)}
                      className={`p-3 rounded-xl border text-left transition font-extrabold text-xs flex items-center justify-between cursor-pointer ${
                        selectedChapel === ch
                          ? 'border-amber-500 bg-amber-50 text-slate-900 shadow-xs'
                          : 'border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-slate-800'
                      }`}
                    >
                      <span>🏛️ {ch}</span>
                      <span className="text-[10px] text-amber-800 bg-amber-200/70 font-bold px-2 py-0.5 rounded-full">
                        ገባ →
                      </span>
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    ወይም ከዝርዝር ውስጥ ይምረጡ፦
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedChapel}
                      onChange={(e) => setSelectedChapel(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 bg-amber-50/60 border border-amber-300 rounded-xl text-xs font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                    >
                      {chapelList.map((ch) => (
                        <option key={`login_ch_${ch}`} value={ch}>
                          🏛️ {ch}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleChapelLogin(selectedChapel)}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-4 text-xs rounded-xl shadow transition cursor-pointer"
                    >
                      ወደ {selectedChapel} ግባ
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Teacher Selection Dropdown */}
            {activeRole === 'teacher' && (
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  የመምህር ስም ይምረጡ፦
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition mb-4"
                >
                  {[...teachers]
                    .sort((a, b) => a.name.localeCompare(b.name, 'am'))
                    .map((t, idx) => (
                      <option key={`teach_opt_${t.id}_${idx}`} value={t.id}>
                        {t.name} ({t.assignedClass}{t.assignedSubject ? ` - ${t.assignedSubject}` : ''})
                      </option>
                    ))}
                </select>

                <button
                  type="button"
                  onClick={handleTeacherLogin}
                  className="w-full bg-indigo-900 hover:bg-indigo-800 text-white font-bold py-3 px-4 rounded-xl shadow-md transition duration-200 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>በመምህርነት ግባ</span>
                  <Check className="w-4 h-4 text-amber-300" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
