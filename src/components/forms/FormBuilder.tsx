import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LeadForm, FormField } from '../../types';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Check, 
  Edit3, 
  Eye, 
  Copy, 
  Sparkles,
  CheckCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export const FormBuilder: React.FC = () => {
  const { forms, createForm, updateForm, showToast } = useApp();
  const [selectedFormId, setSelectedFormId] = useState<string>(forms[0]?.id || '');

  const selectedForm = forms.find((f) => f.id === selectedFormId) || forms[0] || {
    id: 'default',
    organizationId: 'org_bestexperts',
    name: 'Formulaire Standard',
    title: 'Échangeons nos coordonnées',
    description: 'Remplissez ce formulaire pour recevoir notre documentation.',
    submitButtonText: 'Envoyer mes coordonnées',
    successMessage: 'Merci !',
    consentText: 'J\'accepte d\'être recontacté.',
    active: true,
    fields: [],
    usedInProfilesCount: 0,
    submissionsCount: 0,
    createdAt: new Date().toISOString(),
  };

  // New field state
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FormField['type']>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  const handleAddField = () => {
    if (!newFieldLabel.trim()) return;
    const newField: FormField = {
      id: `fld_${Date.now()}`,
      name: newFieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      label: newFieldLabel.trim(),
      type: newFieldType,
      required: newFieldRequired,
    };

    const updatedFields = [...selectedForm.fields, newField];
    updateForm(selectedForm.id, { fields: updatedFields });
    setNewFieldLabel('');
    showToast('Champ ajouté au formulaire');
  };

  const handleRemoveField = (fieldId: string) => {
    const updatedFields = selectedForm.fields.filter((f) => f.id !== fieldId);
    updateForm(selectedForm.id, { fields: updatedFields });
    showToast('Champ supprimé');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-800 flex flex-col gap-8">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Générateur de Formulaires d'Échange
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Créez des formulaires sur mesure adaptés à vos salons, événements de networking ou besoins de recrutement.
          </p>
        </div>

        <button
          onClick={() => {
            createForm({
              name: `Nouveau Formulaire (${forms.length + 1})`,
              title: 'Échangeons nos coordonnées',
              description: 'Laissez vos coordonnées pour recevoir notre documentation.',
              submitButtonText: 'Envoyer',
              successMessage: 'Merci ! Nous reprenons contact avec vous rapidement.',
              consentText: 'J\'accepte d\'être recontacté dans le cadre de cet échange.',
              active: true,
              fields: [
                { id: 'f1', name: 'firstName', label: 'Prénom', type: 'text', required: true },
                { id: 'f2', name: 'lastName', label: 'Nom', type: 'text', required: true },
                { id: 'f3', name: 'email', label: 'Email', type: 'email', required: true },
              ],
            });
          }}
          className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-900/20 transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Créer un formulaire</span>
        </button>
      </div>

      {/* FORMS LIST & BUILDER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Forms Selector (4 Cols) */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-3">
          <h3 className="font-bold text-base text-slate-800 border-b border-slate-100 pb-3">
            Vos Formulaires ({forms.length})
          </h3>

          <div className="flex flex-col gap-2">
            {forms.map((form) => {
              const isSelected = selectedForm?.id === form.id;
              return (
                <button
                  key={form.id}
                  onClick={() => setSelectedFormId(form.id)}
                  className={`p-4 rounded-2xl border text-left flex flex-col gap-1 transition cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/60 text-slate-900 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-xs text-slate-800">{form.name}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                      {form.submissionsCount} leads
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{form.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Editor & Live Preview (8 Cols) */}
        <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-800">{selectedForm.name}</h3>
              <p className="text-xs text-slate-500">Configuration des champs et messages</p>
            </div>
          </div>

          {/* Form settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nom interne</label>
              <input
                type="text"
                value={selectedForm.name}
                onChange={(e) => {
                  updateForm(selectedForm.id, { name: e.target.value });
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Titre affiché au visiteur</label>
              <input
                type="text"
                value={selectedForm.title}
                onChange={(e) => {
                  updateForm(selectedForm.id, { title: e.target.value });
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white"
              />
            </div>
          </div>

          {/* Fields list */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Champs du formulaire</label>
            <div className="flex flex-col gap-2">
              {selectedForm.fields.map((field) => (
                <div key={field.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-slate-800">{field.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({field.type})</span>
                    {field.required && (
                      <span className="text-[10px] text-rose-600 font-semibold">*Obligatoire</span>
                    )}
                  </div>

                  <button
                    onClick={() => handleRemoveField(field.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new field bar */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row gap-2 mt-3">
              <input
                type="text"
                placeholder="Nom du champ (ex : Budget estimé)..."
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 font-semibold"
              >
                <option value="text">Texte court</option>
                <option value="email">Email</option>
                <option value="phone">Téléphone</option>
                <option value="textarea">Zone de texte</option>
              </select>
              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer px-2">
                <input
                  type="checkbox"
                  checked={newFieldRequired}
                  onChange={(e) => setNewFieldRequired(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Requis</span>
              </label>
              <button
                onClick={handleAddField}
                className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter</span>
              </button>
            </div>
          </div>

          {/* Consent Text */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Texte de consentement RGPD</label>
            <textarea
              rows={2}
              value={selectedForm.consentText}
              onChange={(e) => {
                updateForm(selectedForm.id, { consentText: e.target.value });
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 resize-none focus:bg-white"
            />
          </div>

        </div>

      </div>

    </div>
  );
};
