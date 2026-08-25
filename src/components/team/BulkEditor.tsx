import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Layers, 
  CheckSquare, 
  Square, 
  Save, 
  Sparkles, 
  Building2, 
  Globe, 
  Palette,
  Check
} from 'lucide-react';

export const BulkEditor: React.FC = () => {
  const { profiles, bulkUpdateProfiles, showToast, setActiveTab } = useApp();

  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>(profiles.map((p) => p.id));
  const [bulkCompany, setBulkCompany] = useState('BEST EXPERTS-GROUP');
  const [bulkWebsite, setBulkWebsite] = useState('https://bestexperts-group.com');
  const [bulkCtaLabel, setBulkCtaLabel] = useState('Échanger nos coordonnées');
  const [bulkDepartment, setBulkDepartment] = useState('');

  const handleToggleSelectAll = () => {
    if (selectedProfileIds.length === profiles.length) {
      setSelectedProfileIds([]);
    } else {
      setSelectedProfileIds(profiles.map((p) => p.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedProfileIds.includes(id)) {
      setSelectedProfileIds(selectedProfileIds.filter((pId) => pId !== id));
    } else {
      setSelectedProfileIds([...selectedProfileIds, id]);
    }
  };

  const handleApplyBulk = () => {
    if (selectedProfileIds.length === 0) {
      showToast('Veuillez sélectionner au moins un profil.');
      return;
    }

    const updates: any = {};
    if (bulkCompany.trim()) updates.company = bulkCompany.trim();
    if (bulkCtaLabel.trim()) updates.exchangeCtaLabel = bulkCtaLabel.trim();
    if (bulkDepartment.trim()) updates.department = bulkDepartment.trim();

    bulkUpdateProfiles(selectedProfileIds, updates);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-800 flex flex-col gap-8">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              Édition en Masse des Profils (Bulk Edit)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {selectedProfileIds.length} / {profiles.length} Profils Sélectionnés
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Uniformisez la marque de l’entreprise, l’adresse ou les liens d'action sur l'ensemble des collaborateurs en 1 clic.
          </p>
        </div>

        <button
          onClick={handleApplyBulk}
          className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-900/20 transition active:scale-95 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Appliquer aux {selectedProfileIds.length} profils sélectionnés</span>
        </button>
      </div>

      {/* BULK CONTROLS BOX */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-4">
        <h3 className="font-bold text-base text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          Champs à propager en masse
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nom de l'Entreprise</label>
            <input
              type="text"
              value={bulkCompany}
              onChange={(e) => setBulkCompany(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Site Web Corporate</label>
            <input
              type="url"
              value={bulkWebsite}
              onChange={(e) => setBulkWebsite(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Libellé CTA Échange</label>
            <input
              type="text"
              value={bulkCtaLabel}
              onChange={(e) => setBulkCtaLabel(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* PROFILES SELECTION TABLE */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50 border-y border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">
                  <button onClick={handleToggleSelectAll} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    {selectedProfileIds.length === profiles.length ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4 font-semibold">Collaborateur & Slug</th>
                <th className="py-3 px-4 font-semibold">Entreprise Actuelle</th>
                <th className="py-3 px-4 font-semibold">Fonction</th>
                <th className="py-3 px-4 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {profiles.map((p) => {
                const isSelected = selectedProfileIds.includes(p.id);
                return (
                  <tr
                    key={p.id}
                    onClick={() => handleToggleSelect(p.id)}
                    className={`hover:bg-slate-50/70 transition cursor-pointer ${
                      isSelected ? 'bg-indigo-50/50' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(p.id)}
                        className="rounded text-indigo-600 w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.avatarUrl}
                          alt={p.firstName}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{p.firstName} {p.lastName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">/p/{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{p.company}</td>
                    <td className="py-3.5 px-4 text-slate-500">{p.headline}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
