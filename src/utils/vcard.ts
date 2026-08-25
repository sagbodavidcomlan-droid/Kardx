import { Profile } from '../types';

/**
 * Generate a RFC 6350 compliant VCF (vCard 3.0) string for instant mobile address book saving.
 */
export function generateVCardString(profile: Profile): string {
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${profile.lastName};${profile.firstName};;;`,
    `FN:${profile.firstName} ${profile.lastName}`,
    `ORG:${profile.company}${profile.department ? ';' + profile.department : ''}`,
    `TITLE:${profile.headline}`,
  ];

  if (profile.contacts.phone) {
    lines.push(`TEL;TYPE=WORK,VOICE:${profile.contacts.phone}`);
  }
  if (profile.contacts.mobile) {
    lines.push(`TEL;TYPE=CELL,VOICE:${profile.contacts.mobile}`);
  }
  if (profile.contacts.whatsapp) {
    lines.push(`TEL;TYPE=WHATSAPP:${profile.contacts.whatsapp}`);
  }
  if (profile.contacts.email) {
    lines.push(`EMAIL;TYPE=PREF,INTERNET:${profile.contacts.email}`);
  }
  if (profile.contacts.secondaryEmail) {
    lines.push(`EMAIL;TYPE=WORK,INTERNET:${profile.contacts.secondaryEmail}`);
  }
  if (profile.contacts.website) {
    lines.push(`URL:${profile.contacts.website}`);
  }

  // Address
  if (profile.contacts.address) {
    const addr = profile.contacts.address;
    lines.push(`ADR;TYPE=WORK:;;${addr.street || ''};${addr.city || ''};;${addr.postalCode || ''};${addr.country || ''}`);
  }

  // Bio / Note
  if (profile.bio) {
    const cleanBio = profile.bio.replace(/\r?\n/g, '\\n');
    lines.push(`NOTE:${cleanBio}`);
  }

  // Social Links as custom URLs
  profile.socials.forEach((social) => {
    if (social.url) {
      lines.push(`X-SOCIALPROFILE;type=${social.platform}:${social.url}`);
    }
  });

  // Profile URL
  const publicUrl = `${window.location.origin}/p/${profile.slug}`;
  lines.push(`URL;TYPE=DIGITAL_CARD:${publicUrl}`);

  // Avatar if available as web URL
  if (profile.avatarUrl && profile.avatarUrl.startsWith('http')) {
    lines.push(`PHOTO;VALUE=URI:${profile.avatarUrl}`);
  }

  lines.push('REV:' + new Date().toISOString());
  lines.push('END:VCARD');

  return lines.join('\r\n');
}

/**
 * Trigger immediate browser download of the VCF file.
 */
export function downloadVCard(profile: Profile): void {
  const vcardText = generateVCardString(profile);
  const blob = new Blob([vcardText], { type: 'text/vcard;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const sanitizedName = `${profile.firstName}_${profile.lastName}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  link.href = url;
  link.setAttribute('download', `${sanitizedName}_contact.vcf`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
