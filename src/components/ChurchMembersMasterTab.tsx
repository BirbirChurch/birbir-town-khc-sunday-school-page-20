import React, { useState, useMemo, useRef } from 'react';
import {
  Church,
  Users,
  UserPlus,
  FileSpreadsheet,
  Download,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  ArrowRight,
  Filter,
  Phone,
  PhoneCall,
  SlidersHorizontal,
  FileUp,
  X,
  Printer,
  Copy,
  Check,
  Sparkles,
  HeartHandshake
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ChurchMember, ChurchChild, Role } from '../types';
import { DEFAULT_CHAPELS } from '../constants/initialData';
import { normalizeAmharicName, normalizeChapel, normalizeHeader, parseChildAge } from './ChurchChildrenTab';

interface ChurchMembersMasterTabProps {
  currentYear: string;
  churchMembers: ChurchMember[];
  chapelList?: string[];
  existingChurchChildren: ChurchChild[];
  onAddMember: (member: Omit<ChurchMember, 'id'>) => void;
  onUpdateMember: (member: ChurchMember) => void;
  onDeleteMember: (id: number) => void;
  onClearChurchMembers: (chapelFilter?: string | string[]) => void;
  onBatchAddMembers: (members: Omit<ChurchMember, 'id'>[], mode?: 'append' | 'replace') => void;
  onTransferChildrenToChurchChildren: (children: Omit<ChurchChild, 'id'>[]) => void;
  onNavigateToChildrenTab: () => void;
  currentUserRole: Role | null;
}

type AgeGroupFilter = 'all' | 'children_0_14' | 'youth_15_29' | 'adults_30_59' | 'elders_60';

export const ChurchMembersMasterTab: React.FC<ChurchMembersMasterTabProps> = ({
  currentYear,
  churchMembers = [],
  chapelList = DEFAULT_CHAPELS,
  existingChurchChildren = [],
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onClearChurchMembers,
  onBatchAddMembers,
  onTransferChildrenToChurchChildren,
  onNavigateToChildrenTab,
  currentUserRole
}) => {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedChapel, setSelectedChapel] = useState<string>('all');
  const [ageGroupFilter, setAgeGroupFilter] = useState<AgeGroupFilter>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [copiedPhoneId, setCopiedPhoneId] = useState<number | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<ChurchMember | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);
  const [clearScope, setClearScope] = useState<'all' | 'selected'>('all');
  const [clearChapel, setClearChapel] = useState<string>(chapelList[0] || 'ኤልሮኢ ቻፕል');

  // Form State
  const [formName, setFormName] = useState<string>('');
  const [formGender, setFormGender] = useState<'ወ' | 'ሴ' | ''>('ወ');
  const [formAge, setFormAge] = useState<string>('30');
  const [formEducation, setFormEducation] = useState<string>('ዲግሪ');
  const [formOccupation, setFormOccupation] = useState<string>('ነጋዴ');
  const [formChapel, setFormChapel] = useState<string>(chapelList[0] || 'ኤልሮኢ ቻፕል');
  const [formParent, setFormParent] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formResidence, setFormResidence] = useState<string>('ቀበሌ 01');
  const [formMarital, setFormMarital] = useState<string>('ያገባ');
  const [formFamilyRole, setFormFamilyRole] = useState<string>('አባት');
  const [formNotes, setFormNotes] = useState<string>('');

  // Transfer Modal Filter State
  const [transferSelectedChapels, setTransferSelectedChapels] = useState<string[]>([]);
  const [transferOnlyNew, setTransferOnlyNew] = useState<boolean>(false);

  // Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFileName, setImportFileName] = useState<string>('');
  const [importRawRows, setImportRawRows] = useState<any[][]>([]);
  const [importHeaderCols, setImportHeaderCols] = useState<{ index: number; label: string }[]>([]);
  const [importHeaderRowIdx, setImportHeaderRowIdx] = useState<number>(0);
  const [importColName, setImportColName] = useState<number>(0);
  const [importColFather, setImportColFather] = useState<number>(-1);
  const [importColGrandfather, setImportColGrandfather] = useState<number>(-1);
  const [importColGender, setImportColGender] = useState<number>(1);
  const [importColAge, setImportColAge] = useState<number>(2);
  const [importColEducation, setImportColEducation] = useState<number>(-1);
  const [importColOccupation, setImportColOccupation] = useState<number>(-1);
  const [importColChapel, setImportColChapel] = useState<number>(-1);
  const [importColParent, setImportColParent] = useState<number>(-1);
  const [importColPhone, setImportColPhone] = useState<number>(-1);
  const [importColResidence, setImportColResidence] = useState<number>(-1);
  const [importColMarital, setImportColMarital] = useState<number>(-1);
  const [importDefaultChapel, setImportDefaultChapel] = useState<string>(chapelList[0] || 'ኤልሮኢ ቻፕል');
  const [importRefYear, setImportRefYear] = useState<number>(parseInt(currentYear, 10) || 2018);
  const [importAgeMode, setImportAgeMode] = useState<'auto' | 'direct' | 'birthyear'>('auto');
  const [isColumnMappingOpen, setIsColumnMappingOpen] = useState<boolean>(false);
  const [importMembersPreview, setImportMembersPreview] = useState<Omit<ChurchMember, 'id'>[]>([]);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');

  // Stats & Demographic Calculations
  const memberStats = useMemo(() => {
    let maleCount = 0;
    let femaleCount = 0;
    let childrenCount = 0; // 0-14
    let youthCount = 0; // 15-29
    let adultCount = 0; // 30-59
    let elderCount = 0; // 60+

    const chapelMap: Record<string, { total: number; children: number; adults: number }> = {};
    chapelList.forEach((ch) => {
      chapelMap[ch] = { total: 0, children: 0, adults: 0 };
    });

    churchMembers.forEach((m) => {
      const numAge = parseInt(String(m.age || '0'), 10) || 0;
      if (m.gender === 'ወ') maleCount++;
      if (m.gender === 'ሴ') femaleCount++;

      if (numAge <= 14) childrenCount++;
      else if (numAge <= 29) youthCount++;
      else if (numAge <= 59) adultCount++;
      else elderCount++;

      const ch = m.chapel || 'ኤልሮኢ ቻፕል';
      if (!chapelMap[ch]) {
        chapelMap[ch] = { total: 0, children: 0, adults: 0 };
      }
      chapelMap[ch].total++;
      if (numAge <= 14) chapelMap[ch].children++;
      else chapelMap[ch].adults++;
    });

    return {
      total: churchMembers.length,
      male: maleCount,
      female: femaleCount,
      children: childrenCount,
      youth: youthCount,
      adults: adultCount,
      elders: elderCount,
      chapelMap
    };
  }, [churchMembers, chapelList]);

  // Set of existing children names in churchChildren for duplicate check
  const existingChildrenNormSet = useMemo(() => {
    return new Set(existingChurchChildren.map((c) => normalizeAmharicName(c.name)));
  }, [existingChurchChildren]);

  // Children (0-14) candidate list for transfer to Children Registry
  const childrenCandidatesForTransfer = useMemo(() => {
    const list: (Omit<ChurchChild, 'id'> & { memberId: number; isAlreadyInRegistry: boolean; ageNum: number })[] = [];

    churchMembers.forEach((m) => {
      const parsed = parseChildAge(m.age, parseInt(currentYear, 10) || 2018, 'auto');
      let ageNum = parsed.age;
      if (ageNum === -1) {
        const rawNum = parseInt(String(m.age || ''), 10);
        if (!isNaN(rawNum) && rawNum >= 0 && rawNum <= 14) ageNum = rawNum;
      }

      // Check education or occupation heuristic if age was unspecified
      if (ageNum === -1) {
        const edu = (m.educationLevel || '').toLowerCase();
        if (edu.includes('kg') || edu.includes('መዋዕለ') || edu.includes('1ኛ') || edu.includes('2ኛ') || edu.includes('3ኛ') || edu.includes('4ኛ') || edu.includes('5ኛ') || edu.includes('6ኛ') || edu.includes('7ኛ') || edu.includes('8ኛ')) {
          ageNum = 10;
        }
      }

      // Strict 0-14 filter
      if (ageNum >= 0 && ageNum <= 14) {
        const norm = normalizeAmharicName(m.name);
        const alreadyIn = existingChildrenNormSet.has(norm);

        // Format Education Level
        let edu = m.educationLevel;
        if (!edu) {
          if (ageNum <= 3) edu = 'ጨቅላ/ያልጀመረ';
          else if (ageNum <= 6) edu = `መዋዕለ ሕፃናት (KG ${Math.min(3, ageNum - 3 || 1)})`;
          else edu = `${ageNum - 6}ኛ ክፍል`;
        }

        // Format Occupation
        let occ = m.occupation;
        if (!occ) {
          occ = ageNum <= 3 ? 'የቤት ውስጥ' : 'ተማሪ';
        }

        list.push({
          memberId: m.id,
          name: m.name,
          gender: m.gender || 'ወ',
          age: ageNum,
          ageNum,
          educationLevel: edu,
          occupation: occ,
          chapel: m.chapel || chapelList[0] || 'ኤልሮኢ ቻፕል',
          parentName: m.parentName || undefined,
          phone: m.phone || undefined,
          residence: m.residence || undefined,
          fellowshipOrVillage: m.residence || undefined,
          notes: m.notes || `ከአጠቃላይ የቤተክርስቲያን ቋት የተዛወረ`,
          registeredDate: m.registeredDate || new Date().toISOString().split('T')[0],
          isAlreadyInRegistry: alreadyIn
        });
      }
    });

    return list;
  }, [churchMembers, currentYear, existingChildrenNormSet, chapelList]);

  // Filtered Children for Transfer modal
  const transferFilteredChildren = useMemo(() => {
    return childrenCandidatesForTransfer.filter((c) => {
      if (transferOnlyNew && c.isAlreadyInRegistry) return false;
      if (transferSelectedChapels.length > 0) {
        const cChapelNorm = normalizeChapel(c.chapel || '');
        const matches = transferSelectedChapels.some(
          (sel) => normalizeChapel(sel) === cChapelNorm || sel.includes(c.chapel || '') || (c.chapel || '').includes(sel)
        );
        if (!matches) return false;
      }
      return true;
    });
  }, [childrenCandidatesForTransfer, transferOnlyNew, transferSelectedChapels]);

  // Filtered Church Members for Main Display Table
  const filteredMembers = useMemo(() => {
    return churchMembers.filter((m) => {
      // 1. Search Query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = m.name?.toLowerCase().includes(q);
        const matchesPhone = m.phone?.toLowerCase().includes(q);
        const matchesParent = m.parentName?.toLowerCase().includes(q);
        const matchesChapel = m.chapel?.toLowerCase().includes(q);
        const matchesOcc = m.occupation?.toLowerCase().includes(q);
        const matchesRes = m.residence?.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesParent && !matchesChapel && !matchesOcc && !matchesRes) {
          return false;
        }
      }

      // 2. Chapel Filter
      if (selectedChapel !== 'all') {
        const mNorm = normalizeChapel(m.chapel || '');
        const fNorm = normalizeChapel(selectedChapel);
        if (mNorm !== fNorm && !(m.chapel || '').includes(selectedChapel) && !selectedChapel.includes(m.chapel || '')) {
          return false;
        }
      }

      // 3. Gender Filter
      if (genderFilter !== 'all' && m.gender !== genderFilter) {
        return false;
      }

      // 4. Age Group Filter
      if (ageGroupFilter !== 'all') {
        const numAge = parseInt(String(m.age || '0'), 10) || 0;
        if (ageGroupFilter === 'children_0_14' && (numAge < 0 || numAge > 14)) return false;
        if (ageGroupFilter === 'youth_15_29' && (numAge < 15 || numAge > 29)) return false;
        if (ageGroupFilter === 'adults_30_59' && (numAge < 30 || numAge > 59)) return false;
        if (ageGroupFilter === 'elders_60' && numAge < 60) return false;
      }

      return true;
    });
  }, [churchMembers, searchTerm, selectedChapel, genderFilter, ageGroupFilter]);

  // Copy phone handler
  const handleCopyPhone = (id: number, phone: string) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(id);
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  // Form Handlers
  const openAddModal = () => {
    setEditingMember(null);
    setFormName('');
    setFormGender('ወ');
    setFormAge('25');
    setFormEducation('ዲግሪ');
    setFormOccupation('ተማሪ');
    setFormChapel(chapelList[0] || 'ኤልሮኢ ቻፕል');
    setFormParent('');
    setFormPhone('');
    setFormResidence('ቀበሌ 01');
    setFormMarital('ያላገባ');
    setFormFamilyRole('ልጅ');
    setFormNotes('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (m: ChurchMember) => {
    setEditingMember(m);
    setFormName(m.name);
    setFormGender((m.gender as 'ወ' | 'ሴ') || 'ወ');
    setFormAge(String(m.age || ''));
    setFormEducation(m.educationLevel || '');
    setFormOccupation(m.occupation || '');
    setFormChapel(m.chapel || chapelList[0] || 'ኤልሮኢ ቻፕል');
    setFormParent(m.parentName || '');
    setFormPhone(m.phone || '');
    setFormResidence(m.residence || '');
    setFormMarital(m.maritalStatus || 'ያገባ');
    setFormFamilyRole(m.familyRole || '');
    setFormNotes(m.notes || '');
    setIsAddModalOpen(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('እባክዎ ሙሉ ስም ያስገቡ!');
      return;
    }

    const payload: Omit<ChurchMember, 'id'> = {
      name: formName.trim(),
      gender: formGender || 'ወ',
      age: parseInt(formAge, 10) || 0,
      educationLevel: formEducation.trim() || undefined,
      occupation: formOccupation.trim() || undefined,
      chapel: formChapel.trim() || chapelList[0] || 'ኤልሮኢ ቻፕል',
      parentName: formParent.trim() || undefined,
      phone: formPhone.trim() || undefined,
      residence: formResidence.trim() || undefined,
      maritalStatus: formMarital.trim() || undefined,
      familyRole: formFamilyRole.trim() || undefined,
      notes: formNotes.trim() || undefined,
      registeredDate: editingMember?.registeredDate || new Date().toISOString().split('T')[0]
    };

    if (editingMember) {
      onUpdateMember({
        ...payload,
        id: editingMember.id
      });
    } else {
      onAddMember(payload);
    }
    setIsAddModalOpen(false);
  };

  // Execute Excel Processing for Church Members
  const executeExcelProcessing = (
    rows: any[][],
    hIdx: number,
    mapping: {
      nameIdx: number;
      fatherIdx: number;
      grandfatherIdx: number;
      genderIdx: number;
      ageIdx: number;
      educationIdx: number;
      occupationIdx: number;
      chapelIdx: number;
      parentIdx: number;
      phoneIdx: number;
      residenceIdx: number;
      maritalIdx: number;
    },
    refYear: number,
    ageMode: 'auto' | 'direct' | 'birthyear',
    defChapel: string
  ) => {
    const membersList: Omit<ChurchMember, 'id'>[] = [];

    for (let i = hIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      let rawName = String(mapping.nameIdx !== -1 ? row[mapping.nameIdx] || '' : '').trim();
      if (!rawName || rawName === 'ተ.ቁ' || rawName === 'ስም' || rawName.includes('ድምር') || rawName.includes('ጠቅላላ')) continue;

      // Concatenate separate father or grandfather name
      if (mapping.fatherIdx !== -1 && row[mapping.fatherIdx]) {
        const father = String(row[mapping.fatherIdx]).trim();
        if (father && !rawName.includes(father)) {
          rawName += ` ${father}`;
        }
      }
      if (mapping.grandfatherIdx !== -1 && row[mapping.grandfatherIdx]) {
        const gf = String(row[mapping.grandfatherIdx]).trim();
        if (gf && !rawName.includes(gf)) {
          rawName += ` ${gf}`;
        }
      }

      // Gender
      const rawGender = String(mapping.genderIdx !== -1 ? row[mapping.genderIdx] || '' : '').trim();
      const gender =
        rawGender.startsWith('ሴ') || rawGender.toLowerCase().startsWith('f') || rawGender.toLowerCase().includes('female')
          ? 'ሴ'
          : 'ወ';

      // Age calculation
      const rawAgeVal = mapping.ageIdx !== -1 ? row[mapping.ageIdx] : undefined;
      const parsedAge = parseChildAge(rawAgeVal, refYear, ageMode);
      let calculatedAge = parsedAge.age !== -1 ? parsedAge.age : 25;

      // Chapel
      let chapel = mapping.chapelIdx !== -1 && row[mapping.chapelIdx] ? String(row[mapping.chapelIdx]).trim() : '';
      if (!chapel) {
        chapel = defChapel;
      } else {
        const chNorm = normalizeChapel(chapel);
        const matched = chapelList.find(
          (c) => normalizeChapel(c) === chNorm || c.includes(chapel) || chapel.includes(c)
        );
        if (matched) chapel = matched;
        else if (!chapel.endsWith('ቻፕል') && !chapel.endsWith('ማዕከል')) chapel = `${chapel} ቻፕል`;
      }

      // Education & Occupation
      const educationLevel = mapping.educationIdx !== -1 && row[mapping.educationIdx] ? String(row[mapping.educationIdx]).trim() : undefined;
      const occupation = mapping.occupationIdx !== -1 && row[mapping.occupationIdx] ? String(row[mapping.occupationIdx]).trim() : undefined;

      // Parent name
      let parentName: string | undefined = undefined;
      if (mapping.parentIdx !== -1 && row[mapping.parentIdx]) {
        parentName = String(row[mapping.parentIdx]).trim();
      } else if (mapping.fatherIdx !== -1 && row[mapping.fatherIdx]) {
        const father = String(row[mapping.fatherIdx]).trim();
        const gf = mapping.grandfatherIdx !== -1 && row[mapping.grandfatherIdx] ? String(row[mapping.grandfatherIdx]).trim() : '';
        parentName = gf ? `${father} ${gf}` : father;
      }

      // Phone
      let phone: string | undefined = undefined;
      if (mapping.phoneIdx !== -1 && row[mapping.phoneIdx]) {
        phone = String(row[mapping.phoneIdx]).trim();
      } else {
        for (let c = 0; c < row.length; c++) {
          if (c === mapping.nameIdx || c === mapping.ageIdx || c === mapping.genderIdx) continue;
          const val = String(row[c] || '').trim().replace(/[\s\-\(\)]/g, '');
          if (/^(\+?251|0)?[97]\d{8}$/.test(val)) {
            phone = val;
            break;
          }
        }
      }
      if (phone) {
        let cleanDigits = phone.replace(/[\s\-\(\)]/g, '');
        if (cleanDigits.startsWith('+251')) cleanDigits = '0' + cleanDigits.substring(4);
        else if (cleanDigits.startsWith('251')) cleanDigits = '0' + cleanDigits.substring(3);
        else if (cleanDigits.length === 9 && (cleanDigits.startsWith('9') || cleanDigits.startsWith('7'))) cleanDigits = '0' + cleanDigits;
        phone = cleanDigits;
      }

      const residence = mapping.residenceIdx !== -1 && row[mapping.residenceIdx] ? String(row[mapping.residenceIdx]).trim() : undefined;
      const maritalStatus = mapping.maritalIdx !== -1 && row[mapping.maritalIdx] ? String(row[mapping.maritalIdx]).trim() : undefined;

      membersList.push({
        name: rawName,
        gender,
        age: calculatedAge,
        educationLevel,
        occupation,
        chapel,
        parentName,
        phone,
        residence,
        maritalStatus,
        registeredDate: new Date().toISOString().split('T')[0]
      });
    }

    setImportMembersPreview(membersList);
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        const workbook = XLSX.read(buffer, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (!rawRows || rawRows.length < 2) {
          alert('ፋይሉ ምንም የመረጃ መስመር አልያዘም!');
          return;
        }

        let headerRowIndex = 0;
        let nameIdx = -1;
        let fatherIdx = -1;
        let grandfatherIdx = -1;
        let genderIdx = -1;
        let ageIdx = -1;
        let educationIdx = -1;
        let occupationIdx = -1;
        let chapelIdx = -1;
        let parentIdx = -1;
        let phoneIdx = -1;
        let residenceIdx = -1;
        let maritalIdx = -1;

        for (let r = 0; r < Math.min(10, rawRows.length); r++) {
          const row = rawRows[r] || [];
          let matches = 0;
          row.forEach((col: any) => {
            const str = normalizeHeader(String(col || ''));
            if (str.includes('ስም') || str.includes('name')) matches++;
            if (str.includes('ጾታ') || str.includes('gender') || str.includes('ወ/ሴ')) matches++;
            if (str.includes('እድሜ') || str.includes('age') || str.includes('ትውልድ')) matches++;
            if (str.includes('ቻፕል') || str.includes('አጥቢያ') || str.includes('ማዕከል')) matches++;
            if (str.includes('ስልክ') || str.includes('phone')) matches++;
          });
          if (matches >= 2) {
            headerRowIndex = r;
            break;
          }
        }

        const headerRow = rawRows[headerRowIndex] || [];
        const headerCols = headerRow.map((col: any, idx: number) => ({
          index: idx,
          label: String(col || `አምድ ${idx + 1}`).trim()
        }));

        headerRow.forEach((col: any, idx: number) => {
          const str = normalizeHeader(String(col || ''));
          if ((str.includes('ስም') || str.includes('name')) && !str.includes('ወላጅ') && !str.includes('አባት') && !str.includes('እናት') && !str.includes('አያት')) {
            if (nameIdx === -1) nameIdx = idx;
          }
          if (str.includes('አባት') || str.includes('father')) {
            if (fatherIdx === -1) fatherIdx = idx;
          }
          if (str.includes('አያት') || str.includes('grandfather')) {
            if (grandfatherIdx === -1) grandfatherIdx = idx;
          }
          if (str.includes('ጾታ') || str.includes('gender') || str === 'ወ/ሴ') {
            if (genderIdx === -1) genderIdx = idx;
          }
          if (str.includes('እድሜ') || str.includes('age') || str.includes('ትውልድ') || str.includes('ልደት')) {
            if (ageIdx === -1) ageIdx = idx;
          }
          if (str.includes('ትምህርት') || str.includes('ደረጃ') || str.includes('grade')) {
            if (educationIdx === -1) educationIdx = idx;
          }
          if (str.includes('ስራ') || str.includes('occupation') || str.includes('job') || str.includes('ሙያ')) {
            if (occupationIdx === -1) occupationIdx = idx;
          }
          if (str.includes('ቻፕል') || str.includes('chapel') || str.includes('አጥቢያ') || str.includes('ማዕከል')) {
            if (chapelIdx === -1) chapelIdx = idx;
          }
          if (str.includes('ወላጅ') || str.includes('አሳዳጊ') || str.includes('parent')) {
            if (parentIdx === -1) parentIdx = idx;
          }
          if (str.includes('ስልክ') || str.includes('phone') || str.includes('mobile')) {
            if (phoneIdx === -1 && !str.includes('ተ.ቁ')) phoneIdx = idx;
          }
          if (str.includes('መኖሪያ') || str.includes('ቀበሌ') || str.includes('አካባቢ')) {
            if (residenceIdx === -1) residenceIdx = idx;
          }
          if (str.includes('ጋብቻ') || str.includes('marital')) {
            if (maritalIdx === -1) maritalIdx = idx;
          }
        });

        if (nameIdx === -1) nameIdx = 0;
        if (genderIdx === -1) genderIdx = Math.min(1, headerRow.length - 1);
        if (ageIdx === -1) ageIdx = Math.min(2, headerRow.length - 1);

        setImportRawRows(rawRows);
        setImportHeaderCols(headerCols);
        setImportHeaderRowIdx(headerRowIndex);
        setImportColName(nameIdx);
        setImportColFather(fatherIdx);
        setImportColGrandfather(grandfatherIdx);
        setImportColGender(genderIdx);
        setImportColAge(ageIdx);
        setImportColEducation(educationIdx);
        setImportColOccupation(occupationIdx);
        setImportColChapel(chapelIdx);
        setImportColParent(parentIdx);
        setImportColPhone(phoneIdx);
        setImportColResidence(residenceIdx);
        setImportColMarital(maritalIdx);

        executeExcelProcessing(
          rawRows,
          headerRowIndex,
          {
            nameIdx,
            fatherIdx,
            grandfatherIdx,
            genderIdx,
            ageIdx,
            educationIdx,
            occupationIdx,
            chapelIdx,
            parentIdx,
            phoneIdx,
            residenceIdx,
            maritalIdx
          },
          importRefYear,
          importAgeMode,
          importDefaultChapel
        );
      } catch (err) {
        alert('ኤክሴል ፋይሉን በማንበብ ወቅት ስህተት አጋጥሟል!');
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleReapplyMapping = (
    updatedMapping?: Partial<{
      nameIdx: number;
      fatherIdx: number;
      grandfatherIdx: number;
      genderIdx: number;
      ageIdx: number;
      educationIdx: number;
      occupationIdx: number;
      chapelIdx: number;
      parentIdx: number;
      phoneIdx: number;
      residenceIdx: number;
      maritalIdx: number;
    }>,
    updatedYear?: number,
    updatedMode?: 'auto' | 'direct' | 'birthyear',
    updatedDefChapel?: string
  ) => {
    if (!importRawRows.length) return;
    const mapping = {
      nameIdx: updatedMapping?.nameIdx ?? importColName,
      fatherIdx: updatedMapping?.fatherIdx ?? importColFather,
      grandfatherIdx: updatedMapping?.grandfatherIdx ?? importColGrandfather,
      genderIdx: updatedMapping?.genderIdx ?? importColGender,
      ageIdx: updatedMapping?.ageIdx ?? importColAge,
      educationIdx: updatedMapping?.educationIdx ?? importColEducation,
      occupationIdx: updatedMapping?.occupationIdx ?? importColOccupation,
      chapelIdx: updatedMapping?.chapelIdx ?? importColChapel,
      parentIdx: updatedMapping?.parentIdx ?? importColParent,
      phoneIdx: updatedMapping?.phoneIdx ?? importColPhone,
      residenceIdx: updatedMapping?.residenceIdx ?? importColResidence,
      maritalIdx: updatedMapping?.maritalIdx ?? importColMarital
    };
    executeExcelProcessing(
      importRawRows,
      importHeaderRowIdx,
      mapping,
      updatedYear ?? importRefYear,
      updatedMode ?? importAgeMode,
      updatedDefChapel ?? importDefaultChapel
    );
  };

  const handleConfirmImport = () => {
    if (importMembersPreview.length === 0) return;
    onBatchAddMembers(importMembersPreview, importMode);
    setIsImportModalOpen(false);
    setImportMembersPreview([]);
    setImportRawRows([]);
    setImportFileName('');
  };

  // Transfer 0-14 children to Children's Registry
  const handleExecuteTransfer = () => {
    if (transferFilteredChildren.length === 0) return;

    const toTransfer: Omit<ChurchChild, 'id'>[] = transferFilteredChildren.map((c) => ({
      name: c.name,
      gender: c.gender,
      age: c.age,
      educationLevel: c.educationLevel,
      occupation: c.occupation,
      chapel: c.chapel,
      parentName: c.parentName,
      phone: c.phone,
      residence: c.residence,
      fellowshipOrVillage: c.fellowshipOrVillage,
      notes: c.notes || 'ከአጠቃላይ የቤተክርስቲያን ቋት የተዛወረ',
      registeredDate: new Date().toISOString().split('T')[0]
    }));

    onTransferChildrenToChurchChildren(toTransfer);
    setIsTransferModalOpen(false);
  };

  // Export Church Members to Excel
  const handleExportExcel = () => {
    const headers = [
      'ተ.ቁ',
      'ሙሉ ስም',
      'ጾታ',
      'ዕድሜ',
      'የትምህርት ደረጃ',
      'የስራ ዓይነት',
      'ቻፕል (አጥቢያ)',
      'የወላጅ/አሳዳጊ ስም',
      'ስልክ ቁጥር',
      'መኖሪያ ቀበሌ',
      'የጋብቻ ሁኔታ',
      'የቤተሰብ ድርሻ',
      'የተመዘገበበት ቀን'
    ];

    const rows = filteredMembers.map((m, idx) => [
      idx + 1,
      m.name,
      m.gender === 'ወ' ? 'ወንድ' : m.gender === 'ሴ' ? 'ሴት' : '-',
      m.age || '-',
      m.educationLevel || '-',
      m.occupation || '-',
      m.chapel || '-',
      m.parentName || '-',
      m.phone || '-',
      m.residence || '-',
      m.maritalStatus || '-',
      m.familyRole || '-',
      m.registeredDate || '-'
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'አጠቃላይ የቤተክርስቲያን አባላት');
    XLSX.writeFile(wb, `የብርብር_ቤተክርስቲያን_አጠቃላይ_አባላት_${currentYear}.xlsx`);
  };

  // Download Sample Template for Church Members
  const handleDownloadSample = () => {
    const headers = [
      'ተ.ቁ',
      'ሙሉ ስም',
      'ጾታ (ወ/ሴ)',
      'ዕድሜ',
      'የትምህርት ደረጃ',
      'የስራ ዓይነት',
      'ቻፕል',
      'የወላጅ/አሳዳጊ ስም',
      'ስልክ ቁጥር',
      'መኖሪያ ቀበሌ',
      'የጋብቻ ሁኔታ',
      'የቤተሰብ ድርሻ'
    ];
    const sampleRows = [
      [1, 'ዳዊት ታደሰ', 'ወ', 38, 'ዲግሪ', 'ነጋዴ', 'ኤልሮኢ ቻፕል', '', '0911223344', 'ቀበሌ 01', 'ያገባ', 'አባት'],
      [2, 'ሳራ በቀለ', 'ሴ', 34, 'ዲፕሎማ', 'መምህርት', 'ኤልሮኢ ቻፕል', '', '0911223344', 'ቀበሌ 01', 'ያገባች', 'እናት'],
      [3, 'ዮናታን ዳዊት', 'ወ', 3, 'ጨቅላ/ያልጀመረ', 'የቤት ውስጥ', 'ኤልሮኢ ቻፕል', 'ዳዊት ታደሰ', '0911223344', 'ቀበሌ 01', 'ህፃን', 'ልጅ'],
      [4, 'ተስፋዬ በቀለ', 'ወ', 42, '12ኛ ክፍል', 'ነጋዴ', 'ሻሎም ቻፕል', '', '0922334455', 'ቀበሌ 02', 'ያገባ', 'አባት'],
      [5, 'ሩት ተስፋዬ', 'ሴ', 6, 'መዋዕለ ሕፃናት (KG 3)', 'ተማሪ', 'ሻሎም ቻፕል', 'ተስፋዬ በቀለ', '0922334455', 'ቀበሌ 02', 'ህፃን', 'ልጅ'],
      [6, 'አማኑኤል መሠረት', 'ወ', 8, '2ኛ ክፍል', 'ተማሪ', 'ቤቴል ቻፕል', 'መሠረት ሌቃ', '0933445566', 'ቀበሌ 01', 'ህፃን', 'ልጅ']
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    XLSX.utils.book_append_sheet(wb, ws, 'የቤተክርስቲያን አባላት');
    XLSX.writeFile(wb, 'የቤተክርስቲያን_አባላት_መሙያ_ናሙና.xlsx');
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-900 flex items-center justify-center font-bold">
                <Church className="w-5 h-5 text-indigo-900" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  አጠቃላይ የቤተክርስቲያን መረጃ ቋት (Church Master Database)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  የቤተክርስቲያኒቱ ጠቅላላ አባላት መረጃ፣ የኤክሴል መጫኛ እና ከ0-14 ያሉ ልጆችን በቀጥታ ወደ ልጆች ቋት መለያ
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* The Main Attraction: 0-14 Extract & Transfer Button */}
            <button
              type="button"
              onClick={() => {
                setTransferSelectedChapels(chapelList);
                setTransferOnlyNew(false);
                setIsTransferModalOpen(true);
              }}
              className="bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-md hover:scale-[1.01] active:scale-95 cursor-pointer"
              title="ከአጠቃላይ መረጃው ውስጥ ከ0-14 ያሉ ልጆችን ለይተህ ወደ ልጆች ቋት አስገባ"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>👶 ልጆችን (0-14 ዓመት) ወደ ልጆች ቋት አስገባ ({childrenCandidatesForTransfer.length})</span>
            </button>

            <button
              type="button"
              onClick={openAddModal}
              className="bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-amber-300" />
              <span>+ አዲስ አባል መዝግብ</span>
            </button>

            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="bg-blue-800 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="የቤተክርስቲያን አባላት ኤክሴል ፋይል ጫን"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-300" />
              <span>📥 ኤክሴል አስገባ</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3 py-2.5 rounded-xl transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
              title="ሙሉ መረጃውን በExcel አውርድ"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>📤 ኤክሴል አውርድ</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>🖨️ ፕሪንት</span>
            </button>

            <button
              type="button"
              onClick={() => setIsClearModalOpen(true)}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs px-3 py-2.5 rounded-xl transition flex items-center gap-1 border border-rose-200 cursor-pointer"
              title="የአባላት መረጃ አጽዳ"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>🧹 አጽዳ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Synchronized Children Transfer Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-blue-950 text-white rounded-2xl p-4.5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-emerald-500/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
            <HeartHandshake className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
              <span>የልጆች ማዛወሪያ ድልድይ (0-14 Years Child Sync Bridge)</span>
              <span className="bg-amber-400 text-slate-950 font-black text-[11px] px-2.5 py-0.5 rounded-full">
                {childrenCandidatesForTransfer.length} ልጆች ተገኝተዋል
              </span>
            </h3>
            <p className="text-xs text-emerald-200/90 mt-0.5 max-w-2xl leading-relaxed">
              በዚህ አጠቃላይ ቋት ውስጥ ከተመዘገቡት {churchMembers.length} አባላት መሀል <strong>{childrenCandidatesForTransfer.length} ልጆች</strong> (ዕድሜ 0-14) ይገኛሉ። እነዚህን ልጆች በአንድ ጠቅታ ወደ <strong>"የልጆች ቋት"</strong> በማስገባት በየቻፕላቸው መመደብ እና ከሰንበት ት/ቤት ተማሪዎች ጋር ማስተያየት ይችላሉ።
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setTransferSelectedChapels(chapelList);
              setTransferOnlyNew(false);
              setIsTransferModalOpen(true);
            }}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>ልጆቹን አሁን ወደ ልጆች ቋት አስገባ →</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToChildrenTab}
            className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition border border-white/20 flex items-center gap-1.5 cursor-pointer"
          >
            <span>የልጆች ቋትን ክፈት</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500">ጠቅላላ አባላት</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900 tabular-nums">{memberStats.total}</span>
            <span className="text-xs font-bold text-slate-400">100%</span>
          </div>
        </div>

        <div
          onClick={() => setAgeGroupFilter(ageGroupFilter === 'children_0_14' ? 'all' : 'children_0_14')}
          className={`rounded-xl border p-3.5 shadow-xs cursor-pointer transition ${
            ageGroupFilter === 'children_0_14'
              ? 'bg-emerald-100 border-emerald-400 ring-2 ring-emerald-500/30'
              : 'bg-emerald-50/40 border-emerald-200/80 hover:bg-emerald-50'
          }`}
        >
          <p className="text-[11px] font-bold text-emerald-800 flex items-center justify-between">
            <span>👶 ልጆች (0-14 ዓመት)</span>
            {ageGroupFilter === 'children_0_14' && <span className="text-[9px] bg-emerald-700 text-white px-1.5 rounded">የተመረጠ</span>}
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-950 tabular-nums">{memberStats.children}</span>
            <span className="text-xs font-bold text-emerald-700">
              {memberStats.total > 0 ? `${Math.round((memberStats.children / memberStats.total) * 100)}%` : '0%'}
            </span>
          </div>
        </div>

        <div
          onClick={() => setAgeGroupFilter(ageGroupFilter === 'youth_15_29' ? 'all' : 'youth_15_29')}
          className={`rounded-xl border p-3.5 shadow-xs cursor-pointer transition ${
            ageGroupFilter === 'youth_15_29'
              ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-500/30'
              : 'bg-blue-50/40 border-blue-200/80 hover:bg-blue-50'
          }`}
        >
          <p className="text-[11px] font-bold text-blue-800 flex items-center justify-between">
            <span>🧑 ወጣቶች (15-29)</span>
            {ageGroupFilter === 'youth_15_29' && <span className="text-[9px] bg-blue-700 text-white px-1.5 rounded">የተመረጠ</span>}
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-blue-950 tabular-nums">{memberStats.youth}</span>
            <span className="text-xs font-bold text-blue-700">
              {memberStats.total > 0 ? `${Math.round((memberStats.youth / memberStats.total) * 100)}%` : '0%'}
            </span>
          </div>
        </div>

        <div
          onClick={() => setAgeGroupFilter(ageGroupFilter === 'adults_30_59' ? 'all' : 'adults_30_59')}
          className={`rounded-xl border p-3.5 shadow-xs cursor-pointer transition ${
            ageGroupFilter === 'adults_30_59'
              ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-500/30'
              : 'bg-amber-50/40 border-amber-200/80 hover:bg-amber-50'
          }`}
        >
          <p className="text-[11px] font-bold text-amber-800 flex items-center justify-between">
            <span>👨 አዋቂዎች (30-59)</span>
            {ageGroupFilter === 'adults_30_59' && <span className="text-[9px] bg-amber-700 text-white px-1.5 rounded">የተመረጠ</span>}
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-amber-950 tabular-nums">{memberStats.adults}</span>
            <span className="text-xs font-bold text-amber-700">
              {memberStats.total > 0 ? `${Math.round((memberStats.adults / memberStats.total) * 100)}%` : '0%'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-blue-200/80 p-3.5 shadow-xs">
          <p className="text-[11px] font-semibold text-blue-700">ወንዶች አባላት</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-blue-900 tabular-nums">{memberStats.male}</span>
            <span className="text-xs font-bold text-blue-600">
              {memberStats.total > 0 ? `${Math.round((memberStats.male / memberStats.total) * 100)}%` : '0%'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-rose-200/80 p-3.5 shadow-xs">
          <p className="text-[11px] font-semibold text-rose-700">ሴቶች አባላት</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-rose-900 tabular-nums">{memberStats.female}</span>
            <span className="text-xs font-bold text-rose-600">
              {memberStats.total > 0 ? `${Math.round((memberStats.female / memberStats.total) * 100)}%` : '0%'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="በስም፣ ስልክ፣ ቻፕል፣ ሙያ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white"
            />
          </div>

          {/* Chapel Select */}
          <div className="flex items-center gap-1.5">
            <Church className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedChapel}
              onChange={(e) => setSelectedChapel(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 font-bold text-slate-800"
            >
              <option value="all">-- ሁሉም ቻፕሎች ({chapelList.length}) --</option>
              {chapelList.map((ch) => (
                <option key={`ch_sel_${ch}`} value={ch}>
                  🏛️ {ch} ({memberStats.chapelMap[ch]?.total || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Age Group Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={ageGroupFilter}
              onChange={(e) => setAgeGroupFilter(e.target.value as AgeGroupFilter)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 font-bold text-slate-800"
            >
              <option value="all">-- የዕድሜ ምድብ (ሁሉም) --</option>
              <option value="children_0_14">👶 ልጆች ብቻ (ከ0-14 ዓመት - {memberStats.children})</option>
              <option value="youth_15_29">🧑 ወጣቶች ብቻ (15-29 ዓመት - {memberStats.youth})</option>
              <option value="adults_30_59">👨 አዋቂዎች ብቻ (30-59 ዓመት - {memberStats.adults})</option>
              <option value="elders_60">👴 አረጋውያን ብቻ (60+ ዓመት - {memberStats.elders})</option>
            </select>
          </div>

          {/* Gender Filter */}
          <div className="flex items-center gap-2">
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 font-bold text-slate-800"
            >
              <option value="all">ጾታ (ሁሉም)</option>
              <option value="ወ">ወንድ ብቻ</option>
              <option value="ሴ">ሴት ብቻ</option>
            </select>
            {(searchTerm || selectedChapel !== 'all' || ageGroupFilter !== 'all' || genderFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedChapel('all');
                  setAgeGroupFilter('all');
                  setGenderFilter('all');
                }}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold whitespace-nowrap px-2"
              >
                አጽዳ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Members Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden print:border-none print:shadow-none print:rounded-none">
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[11px] tracking-wider print:bg-slate-800 print:text-white">
                <th className="py-3 px-3 text-center w-12 font-bold">ተ.ቁ</th>
                <th className="py-3 px-4 font-extrabold text-[13pt] text-white min-w-[200px]">ሙሉ ስም</th>
                <th className="py-3 px-3 text-center font-bold w-16">ጾታ</th>
                <th className="py-3 px-3 text-center font-bold w-16">ዕድሜ</th>
                <th className="py-3 px-3 font-bold min-w-[130px]">ቻፕል (አጥቢያ)</th>
                <th className="py-3 px-3 font-bold min-w-[120px]">የትምህርት ደረጃ</th>
                <th className="py-3 px-3 font-bold min-w-[120px]">የስራ ዓይነት</th>
                <th className="py-3 px-3 font-bold min-w-[130px]">ስልክ ቁጥር</th>
                <th className="py-3 px-3 font-bold min-w-[120px]">የወላጅ/አሳዳጊ ስም</th>
                <th className="py-3 px-3 font-bold min-w-[100px]">መኖሪያ ቀበሌ</th>
                <th className="py-3 px-3 font-bold min-w-[100px]">የቤተሰብ ድርሻ</th>
                <th className="py-3 px-3 text-center font-bold w-24 print:hidden">እርምጃዎች</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-500">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-sm">በተመረጠው መስፈርት የተገኘ አባል የለም!</p>
                    <p className="text-xs text-slate-400 mt-1">የፍለጋ ቃሉን ይቀይሩ ወይም ኤክሴል ፋይል ይጫኑ።</p>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m, idx) => {
                  const isMale = m.gender === 'ወ';
                  const isFemale = m.gender === 'ሴ';
                  const numAge = parseInt(String(m.age || '0'), 10) || 0;
                  const isChild = numAge <= 14;
                  const isCopied = copiedPhoneId === m.id;

                  return (
                    <tr key={`member_row_${m.id}`} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-2.5 px-3 text-center font-bold text-slate-400 bg-slate-50/50">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-extrabold text-[13pt] text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{m.name}</span>
                          {isChild && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full shrink-0" title="ልጅ (0-14 ዓመት)">
                              👶 ልጅ
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] ${
                            isMale ? 'bg-blue-100 text-blue-800' : isFemale ? 'bg-rose-100 text-rose-800' : 'text-slate-400'
                          }`}
                        >
                          {isMale ? 'ወንድ' : isFemale ? 'ሴት' : '-'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-800 tabular-nums">
                        {m.age ? `${m.age} ዓመት` : '-'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-indigo-950">
                        🏛️ {m.chapel || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{m.educationLevel || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-700">{m.occupation || '-'}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        {m.phone ? (
                          <div className="flex items-center gap-1">
                            <a
                              href={`tel:${m.phone}`}
                              className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hover:underline"
                            >
                              <PhoneCall className="w-3 h-3 text-emerald-600" />
                              <span>{m.phone}</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopyPhone(m.id, m.phone!)}
                              className="p-1 text-slate-400 hover:text-slate-600"
                            >
                              {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{m.parentName || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-600">{m.residence || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-600">{m.familyRole || m.maritalStatus || '-'}</td>
                      <td className="py-2.5 px-3 text-center print:hidden">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(m)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition cursor-pointer"
                            title="አስተካክል"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`"${m.name}" ከቤተክርስቲያን መረጃ ቋት ይሰረዝ?`)) {
                                onDeleteMember(m.id);
                              }
                            }}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition cursor-pointer"
                            title="ሰርዝ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer 0-14 Children Preview Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
            <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                  <Sparkles className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    ልጆችን (ከ0-14 ዓመት) ወደ ልጆች ቋት ማዛወሪያና ማስገቢያ
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ከአጠቃላይ የቤተክርስቲያን ቋት የተገኙ {childrenCandidatesForTransfer.length} ልጆችን በቀጥታ ወደ ልጆች አገልግሎት ዘርፍ ቋት ያስገባል።
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-4 space-y-4 pr-1 text-xs">
              {/* Description strip */}
              <div className="bg-emerald-50 border border-emerald-200/80 p-3.5 rounded-xl text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-extrabold">የተካተቱ 8ቱ ዋና መረጃዎች፦</p>
                  <p className="text-[11px] text-emerald-900 mt-0.5 leading-relaxed">
                    1) የልጅ ስም 2) ጾታ 3) ዕድሜ (0-14) 4) የክፍል ደረጃ 5) የስራ ዓይነት 6) የወላጅ ስም 7) ያለበት ቻፕል 8) የወላጅ ስልክ
                  </p>
                </div>
                <label className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-emerald-300 font-bold text-slate-800 shrink-0 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={transferOnlyNew}
                    onChange={(e) => setTransferOnlyNew(e.target.checked)}
                    className="w-4 h-4 text-emerald-700 rounded"
                  />
                  <span>አዳዲስ ያልገቡትን ብቻ ለይ</span>
                </label>
              </div>

              {/* Chapel Filter Chips */}
              <div className="space-y-1.5">
                <span className="font-extrabold text-slate-700 text-[11px]">ማዛወር የሚፈልጉትን ቻፕል ይምረጡ፦</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setTransferSelectedChapels(chapelList)}
                    className="text-[10px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 px-2.5 py-1 rounded-lg"
                  >
                    ✓ ሁሉንም ምረጥ
                  </button>
                  {chapelList.map((ch) => {
                    const isChecked = transferSelectedChapels.includes(ch);
                    return (
                      <button
                        key={`trans_ch_${ch}`}
                        type="button"
                        onClick={() => {
                          setTransferSelectedChapels((prev) =>
                            prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
                          );
                        }}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition ${
                          isChecked
                            ? 'bg-emerald-800 text-white border-emerald-800'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        🏛️ {ch}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Children Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900 text-white font-bold sticky top-0 text-[11px]">
                      <tr>
                        <th className="py-2 px-2 text-center w-8">#</th>
                        <th className="py-2 px-3 font-extrabold text-[13pt] text-white">የልጅ ስም</th>
                        <th className="py-2 px-2 text-center">ጾታ</th>
                        <th className="py-2 px-2 text-center">ዕድሜ</th>
                        <th className="py-2 px-2.5">የክፍል ደረጃ</th>
                        <th className="py-2 px-2.5">የስራ ዓይነት</th>
                        <th className="py-2 px-2.5">ቻፕል</th>
                        <th className="py-2 px-2.5">የወላጅ ስም</th>
                        <th className="py-2 px-2.5">የወላጅ ስልክ</th>
                        <th className="py-2 px-2.5 text-center">ሁኔታ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transferFilteredChildren.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-6 text-center text-slate-400">
                            የተመረጠ ልጅ አልተገኘም!
                          </td>
                        </tr>
                      ) : (
                        transferFilteredChildren.map((c, idx) => (
                          <tr key={`trans_row_${idx}`} className="hover:bg-emerald-50/30">
                            <td className="py-2 px-2 text-center text-slate-400">{idx + 1}</td>
                            <td className="py-2 px-3 font-extrabold text-slate-900 text-[13pt]">{c.name}</td>
                            <td className="py-2 px-2 text-center font-bold">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] ${
                                  c.gender === 'ሴ' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {c.gender}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-center font-bold tabular-nums text-slate-800">{c.age} ዓመት</td>
                            <td className="py-2 px-2.5 text-indigo-900 font-semibold">{c.educationLevel || '-'}</td>
                            <td className="py-2 px-2.5 text-slate-700">{c.occupation || '-'}</td>
                            <td className="py-2 px-2.5 text-blue-900 font-bold">{c.chapel || '-'}</td>
                            <td className="py-2 px-2.5 text-slate-600">{c.parentName || '-'}</td>
                            <td className="py-2 px-2.5 font-mono text-[11px] font-bold text-emerald-900">{c.phone || '-'}</td>
                            <td className="py-2 px-2.5 text-center">
                              {c.isAlreadyInRegistry ? (
                                <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-bold">
                                  ቀድሞ የገባ
                                </span>
                              ) : (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-bold">
                                  ✨ አዲስ የሚገባ
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-bold">
                የሚዛወሩ ልጆች ብዛት፦ <strong>{transferFilteredChildren.length} ልጆች</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
                >
                  ሰርዝ
                </button>
                <button
                  type="button"
                  onClick={handleExecuteTransfer}
                  disabled={transferFilteredChildren.length === 0}
                  className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-black text-xs px-5 py-2.5 rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>ወደ ልጆች ቋት አስገባ ({transferFilteredChildren.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Modal for Church Members */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
            <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold shrink-0">
                  <FileSpreadsheet className="w-5 h-5 text-blue-800" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    የቤተክርስቲያን አባላት ኤክሴል ፋይል መጫኛ
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    የአባላት ዝርዝር የያዘ .xlsx, .xls ወይም .csv ፋይል እዚህ ይጫኑ። ስርዓቱ አምዶቹን በራሱ ያገናኛል።
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportMembersPreview([]);
                  setImportFileName('');
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-4 space-y-4 pr-1 text-xs">
              {/* Sample Template Download */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <p className="text-slate-600 font-medium">
                  የተሟላ የኤክሴል አሞላል ናሙና ማውረድ ከፈለጉ፦
                </p>
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="bg-white hover:bg-slate-100 text-blue-900 font-bold px-3 py-1.5 rounded-lg border border-slate-300 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-700" />
                  <span>📥 የExcel ናሙና አውርድ</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-400 hover:border-blue-600 bg-blue-50/20 hover:bg-blue-50/40 rounded-2xl p-6 text-center cursor-pointer transition group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                <FileUp className="w-10 h-10 text-blue-700 mx-auto mb-2 group-hover:scale-105 transition-transform" />
                <p className="text-xs font-bold text-slate-800">
                  {importFileName ? `የተመረጠ ፋይል፦ ${importFileName}` : 'የቤተክርስቲያን አባላት Excel ወይም CSV ፋይል እዚህ ይጫኑ'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  .xlsx, .xls ወይም .csv ፋይሎች (ስም፣ ጾታ፣ ዕድሜ፣ ቻፕል፣ ስልክ፣ የስራ ዓይነት፣ የትምህርት ደረጃ)
                </p>
              </div>

              {/* Column Mapping Panel */}
              {importMembersPreview.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                  <button
                    type="button"
                    onClick={() => setIsColumnMappingOpen(!isColumnMappingOpen)}
                    className="w-full flex items-center justify-between text-xs font-bold text-slate-800"
                  >
                    <span className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-blue-700" />
                      <span>⚙️ የኤክሴል አምዶች ማስተካከያ (Column Mapping)</span>
                    </span>
                    <span className="text-blue-800 font-bold underline text-[11px]">
                      {isColumnMappingOpen ? 'መደበቂያ ▲' : 'ማስተካከያ ክፈት ▼'}
                    </span>
                  </button>

                  {isColumnMappingOpen && (
                    <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">የስም አምድ፦</label>
                        <select
                          value={importColName}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            setImportColName(v);
                            handleReapplyMapping({ nameIdx: v });
                          }}
                          className="w-full text-xs font-bold border border-slate-300 rounded-lg p-1.5 bg-white"
                        >
                          {importHeaderCols.map((c) => (
                            <option key={`c_m_name_${c.index}`} value={c.index}>
                              {c.index + 1}. {c.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">ጾታ አምድ፦</label>
                        <select
                          value={importColGender}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            setImportColGender(v);
                            handleReapplyMapping({ genderIdx: v });
                          }}
                          className="w-full text-xs font-bold border border-slate-300 rounded-lg p-1.5 bg-white"
                        >
                          {importHeaderCols.map((c) => (
                            <option key={`c_m_gend_${c.index}`} value={c.index}>
                              {c.index + 1}. {c.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">ዕድሜ / የትውልድ ዓመት አምድ፦</label>
                        <select
                          value={importColAge}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            setImportColAge(v);
                            handleReapplyMapping({ ageIdx: v });
                          }}
                          className="w-full text-xs font-bold border border-slate-300 rounded-lg p-1.5 bg-white"
                        >
                          {importHeaderCols.map((c) => (
                            <option key={`c_m_age_${c.index}`} value={c.index}>
                              {c.index + 1}. {c.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">ቻፕል አምድ፦</label>
                        <select
                          value={importColChapel}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            setImportColChapel(v);
                            handleReapplyMapping({ chapelIdx: v });
                          }}
                          className="w-full text-xs font-bold border border-slate-300 rounded-lg p-1.5 bg-white"
                        >
                          <option value={-1}>-- በፋይሉ የለም (ነባሪ ተጠቀም) --</option>
                          {importHeaderCols.map((c) => (
                            <option key={`c_m_chap_${c.index}`} value={c.index}>
                              {c.index + 1}. {c.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">የትምህርት ደረጃ አምድ፦</label>
                        <select
                          value={importColEducation}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            setImportColEducation(v);
                            handleReapplyMapping({ educationIdx: v });
                          }}
                          className="w-full text-xs font-bold border border-slate-300 rounded-lg p-1.5 bg-white"
                        >
                          <option value={-1}>-- በፋይሉ የለም --</option>
                          {importHeaderCols.map((c) => (
                            <option key={`c_m_edu_${c.index}`} value={c.index}>
                              {c.index + 1}. {c.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">የስራ ዓይነት አምድ፦</label>
                        <select
                          value={importColOccupation}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            setImportColOccupation(v);
                            handleReapplyMapping({ occupationIdx: v });
                          }}
                          className="w-full text-xs font-bold border border-slate-300 rounded-lg p-1.5 bg-white"
                        >
                          <option value={-1}>-- በፋይሉ የለም --</option>
                          {importHeaderCols.map((c) => (
                            <option key={`c_m_occ_${c.index}`} value={c.index}>
                              {c.index + 1}. {c.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">ስልክ ቁጥር አምድ፦</label>
                        <select
                          value={importColPhone}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            setImportColPhone(v);
                            handleReapplyMapping({ phoneIdx: v });
                          }}
                          className="w-full text-xs font-bold border border-slate-300 rounded-lg p-1.5 bg-white"
                        >
                          <option value={-1}>-- ራስ-ሰር ፈልግ --</option>
                          {importHeaderCols.map((c) => (
                            <option key={`c_m_pho_${c.index}`} value={c.index}>
                              {c.index + 1}. {c.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">ነባሪ ቻፕል፦</label>
                        <select
                          value={importDefaultChapel}
                          onChange={(e) => {
                            const v = e.target.value;
                            setImportDefaultChapel(v);
                            handleReapplyMapping(undefined, undefined, undefined, v);
                          }}
                          className="w-full text-xs font-bold border border-slate-300 rounded-lg p-1.5 bg-white"
                        >
                          {chapelList.map((ch) => (
                            <option key={`def_m_ch_${ch}`} value={ch}>
                              {ch}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Preview Table */}
              {importMembersPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-800">
                      የተነበቡ አባላት ዝርዝር ({importMembersPreview.length} ሰዎች)፦
                    </span>
                    <span className="text-[11px] text-emerald-800 font-bold">
                      👶 {importMembersPreview.filter((m) => (parseInt(String(m.age || '0'), 10) || 0) <= 14).length} ልጆች ይገኛሉ
                    </span>
                  </div>
                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-900 text-white font-bold sticky top-0 text-[11px]">
                        <tr>
                          <th className="py-2 px-2 text-center w-8">#</th>
                          <th className="py-2 px-3">ሙሉ ስም</th>
                          <th className="py-2 px-2 text-center">ጾታ</th>
                          <th className="py-2 px-2 text-center">ዕድሜ</th>
                          <th className="py-2 px-2.5">ቻፕል</th>
                          <th className="py-2 px-2.5">የስራ ዓይነት</th>
                          <th className="py-2 px-2.5">ስልክ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importMembersPreview.slice(0, 50).map((m, idx) => (
                          <tr key={`imp_row_${idx}`} className="hover:bg-blue-50/40">
                            <td className="py-2 px-2 text-center text-slate-400">{idx + 1}</td>
                            <td className="py-2 px-3 font-bold text-slate-900">{m.name}</td>
                            <td className="py-2 px-2 text-center font-bold">
                              <span className={m.gender === 'ሴ' ? 'text-rose-700' : 'text-blue-700'}>{m.gender}</span>
                            </td>
                            <td className="py-2 px-2 text-center tabular-nums">{m.age}</td>
                            <td className="py-2 px-2.5 text-indigo-950 font-semibold">{m.chapel}</td>
                            <td className="py-2 px-2.5 text-slate-600">{m.occupation || '-'}</td>
                            <td className="py-2 px-2.5 font-mono text-[11px]">{m.phone || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                  />
                  <span>አሁን ባለው ላይ ጨምር</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                  />
                  <span>ቀድሞ የነበረውን በአዲሱ ተካ</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
                >
                  ሰርዝ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={importMembersPreview.length === 0}
                  className="bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-black text-xs px-5 py-2.5 rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-300" />
                  <span>አባላትን መዝግብ ({importMembersPreview.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingMember ? 'የአባል መረጃ ማስተካከያ' : '+ አዲስ የቤተክርስቲያን አባል መመዝገቢያ'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ሙሉ ስም (የልጁ/የአባሉ ስም) *</label>
                <input
                  type="text"
                  required
                  placeholder="ምሳሌ፡ ዮናታን ዳዊት ታደሰ"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ጾታ *</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as 'ወ' | 'ሴ')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-white"
                  >
                    <option value="ወ">ወንድ</option>
                    <option value="ሴ">ሴት</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ዕድሜ *</label>
                  <input
                    type="number"
                    value={formAge}
                    onChange={(e) => setFormAge(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ቻፕል (አጥቢያ) *</label>
                  <select
                    value={formChapel}
                    onChange={(e) => setFormChapel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-white"
                  >
                    {chapelList.map((ch) => (
                      <option key={`f_ch_${ch}`} value={ch}>
                        {ch}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">የትምህርት ደረጃ</label>
                  <input
                    type="text"
                    placeholder="ምሳሌ፡ 4ኛ ክፍል / ዲግሪ"
                    value={formEducation}
                    onChange={(e) => setFormEducation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">የስራ ዓይነት</label>
                  <input
                    type="text"
                    placeholder="ምሳሌ፡ ተማሪ / ነጋዴ / የመንግስት ሰራተኛ"
                    value={formOccupation}
                    onChange={(e) => setFormOccupation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">የወላጅ/አሳዳጊ ስም</label>
                  <input
                    type="text"
                    placeholder="ምሳሌ፡ ዳዊት ታደሰ"
                    value={formParent}
                    onChange={(e) => setFormParent(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ስልክ ቁጥር</label>
                  <input
                    type="text"
                    placeholder="ምሳሌ፡ 0911223344"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">መኖሪያ ቀበሌ / መንደር</label>
                  <input
                    type="text"
                    placeholder="ምሳሌ፡ ቀበሌ 01"
                    value={formResidence}
                    onChange={(e) => setFormResidence(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">የቤተሰብ ድርሻ / የጋብቻ ሁኔታ</label>
                  <input
                    type="text"
                    placeholder="ምሳሌ፡ አባት / እናት / ልጅ"
                    value={formFamilyRole}
                    onChange={(e) => setFormFamilyRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
                >
                  ሰርዝ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl shadow"
                >
                  {editingMember ? 'አስተካክል' : 'መዝግብ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clear Members Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-extrabold text-rose-900 mb-2">የአባላት መረጃ ማጽጃ</h3>
            <p className="text-xs text-slate-600 mb-4">
              ከአጠቃላይ የቤተክርስቲያን ቋት ውስጥ መረጃዎችን ለማጽዳት የሚፈልጉትን ወሰን ይምረጡ፦
            </p>

            <div className="space-y-3 mb-4 text-xs">
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="radio"
                  name="clearScope"
                  checked={clearScope === 'all'}
                  onChange={() => setClearScope('all')}
                />
                <span>ሁሉንም አባላት በሙሉ አጽዳ ({churchMembers.length} ሰዎች)</span>
              </label>

              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="radio"
                  name="clearScope"
                  checked={clearScope === 'selected'}
                  onChange={() => setClearScope('selected')}
                />
                <span>የተወሰነ ቻፕል አባላትን ብቻ አጽዳ፦</span>
              </label>

              {clearScope === 'selected' && (
                <select
                  value={clearChapel}
                  onChange={(e) => setClearChapel(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold bg-white text-xs"
                >
                  {chapelList.map((ch) => (
                    <option key={`clr_ch_${ch}`} value={ch}>
                      🏛️ {ch}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
              >
                ሰርዝ
              </button>
              <button
                type="button"
                onClick={() => {
                  if (clearScope === 'all') {
                    onClearChurchMembers('all');
                  } else {
                    onClearChurchMembers([clearChapel]);
                  }
                  setIsClearModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white rounded-xl shadow"
              >
                አዎ አጽዳ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
