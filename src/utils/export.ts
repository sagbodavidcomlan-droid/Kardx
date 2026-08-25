import { Lead, AnalyticsEvent } from '../types';

/**
 * Export Leads list to CSV file
 */
export function exportLeadsToCsv(leads: Lead[], filename: string = 'kardx_leads_export.csv'): void {
  if (!leads.length) return;

  const headers = [
    'ID',
    'Prénom',
    'Nom',
    'Email',
    'Téléphone',
    'Entreprise',
    'Fonction',
    'Statut',
    'Source',
    'Tags',
    'Contexte / Rencontre',
    'Notes',
    'Consentement RGPD',
    'Date de création',
  ];

  const escapeCsv = (val: any) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = leads.map((l) => [
    escapeCsv(l.id),
    escapeCsv(l.firstName),
    escapeCsv(l.lastName),
    escapeCsv(l.email),
    escapeCsv(l.phone || ''),
    escapeCsv(l.company || ''),
    escapeCsv(l.jobTitle || ''),
    escapeCsv(l.status),
    escapeCsv(l.source),
    escapeCsv((l.tags || []).join(', ')),
    escapeCsv(l.meetingContext || ''),
    escapeCsv(l.notes || ''),
    escapeCsv(l.consentGiven ? 'Oui' : 'Non'),
    escapeCsv(new Date(l.createdAt).toLocaleString('fr-FR')),
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Analytics events to CSV
 */
export function exportAnalyticsToCsv(
  events: AnalyticsEvent[],
  filename: string = 'kardx_analytics_events.csv'
): void {
  if (!events.length) return;

  const headers = ['Event ID', 'Type', 'Profile ID', 'Source', 'Device', 'City', 'Country', 'Timestamp'];

  const escapeCsv = (val: any) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = events.map((e) => [
    escapeCsv(e.id),
    escapeCsv(e.type),
    escapeCsv(e.profileId),
    escapeCsv(e.source),
    escapeCsv(e.device),
    escapeCsv(e.location?.city || ''),
    escapeCsv(e.location?.country || ''),
    escapeCsv(new Date(e.timestamp).toLocaleString('fr-FR')),
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
