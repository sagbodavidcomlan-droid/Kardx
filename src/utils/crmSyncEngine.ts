import { Lead, Integration, CrmSyncLog, LeadCrmSyncInfo, CrmFieldMapping } from '../types';

export const DEFAULT_HUBSPOT_MAPPINGS: CrmFieldMapping[] = [
  { kardxField: 'email', crmField: 'email', crmFieldLabel: 'Email Address', isRequired: true },
  { kardxField: 'firstName', crmField: 'firstname', crmFieldLabel: 'First Name', isRequired: true },
  { kardxField: 'lastName', crmField: 'lastname', crmFieldLabel: 'Last Name', isRequired: true },
  { kardxField: 'company', crmField: 'company', crmFieldLabel: 'Company Name' },
  { kardxField: 'jobTitle', crmField: 'jobtitle', crmFieldLabel: 'Job Title' },
  { kardxField: 'phone', crmField: 'phone', crmFieldLabel: 'Phone Number' },
  { kardxField: 'notes', crmField: 'message', crmFieldLabel: 'Contact Notes & Context' },
  { kardxField: 'source', crmField: 'kardx_lead_source', crmFieldLabel: 'KardX Capture Source (NFC/QR/Scanner)' },
  { kardxField: 'tags', crmField: 'hs_lead_status', crmFieldLabel: 'Lifecycle / Lead Status' },
];

export const DEFAULT_SALESFORCE_MAPPINGS: CrmFieldMapping[] = [
  { kardxField: 'firstName', crmField: 'FirstName', crmFieldLabel: 'First Name' },
  { kardxField: 'lastName', crmField: 'LastName', crmFieldLabel: 'Last Name', isRequired: true },
  { kardxField: 'company', crmField: 'Company', crmFieldLabel: 'Company', isRequired: true, defaultValue: '[Particulier]' },
  { kardxField: 'email', crmField: 'Email', crmFieldLabel: 'Email', isRequired: true },
  { kardxField: 'phone', crmField: 'Phone', crmFieldLabel: 'Phone' },
  { kardxField: 'jobTitle', crmField: 'Title', crmFieldLabel: 'Title / Role' },
  { kardxField: 'source', crmField: 'LeadSource', crmFieldLabel: 'Lead Source', defaultValue: 'KardX NFC Smart Card' },
  { kardxField: 'city', crmField: 'City', crmFieldLabel: 'City' },
  { kardxField: 'country', crmField: 'Country', crmFieldLabel: 'Country' },
  { kardxField: 'notes', crmField: 'Description', crmFieldLabel: 'Description / AI Qualifications' },
];

export const DEFAULT_PIPEDRIVE_MAPPINGS: CrmFieldMapping[] = [
  { kardxField: 'firstName', crmField: 'first_name', crmFieldLabel: 'First Name' },
  { kardxField: 'lastName', crmField: 'last_name', crmFieldLabel: 'Last Name', isRequired: true },
  { kardxField: 'email', crmField: 'email', crmFieldLabel: 'Work Email', isRequired: true },
  { kardxField: 'phone', crmField: 'phone', crmFieldLabel: 'Work Phone' },
  { kardxField: 'company', crmField: 'org_name', crmFieldLabel: 'Organization' },
  { kardxField: 'jobTitle', crmField: 'job_title', crmFieldLabel: 'Job Title' },
];

export const DEFAULT_ZOHO_MAPPINGS: CrmFieldMapping[] = [
  { kardxField: 'firstName', crmField: 'First_Name', crmFieldLabel: 'First Name' },
  { kardxField: 'lastName', crmField: 'Last_Name', crmFieldLabel: 'Last Name', isRequired: true },
  { kardxField: 'email', crmField: 'Email', crmFieldLabel: 'Email', isRequired: true },
  { kardxField: 'phone', crmField: 'Phone', crmFieldLabel: 'Phone' },
  { kardxField: 'company', crmField: 'Company', crmFieldLabel: 'Company Name', isRequired: true, defaultValue: 'Sans entreprise' },
  { kardxField: 'jobTitle', crmField: 'Designation', crmFieldLabel: 'Designation' },
  { kardxField: 'source', crmField: 'Lead_Source', crmFieldLabel: 'Lead Source', defaultValue: 'KardX NFC' },
];

/**
 * Builds the HubSpot Contact API v3 request payload
 * Endpoint: POST https://api.hubapi.com/crm/v3/objects/contacts
 */
export function buildHubSpotPayload(lead: Lead, integration: Integration, orgName: string = 'KardX') {
  const properties: Record<string, any> = {
    email: lead.email,
    firstname: lead.firstName,
    lastname: lead.lastName,
    company: lead.company || 'Sans société',
    jobtitle: lead.jobTitle || '',
    phone: lead.phone || '',
    hs_lead_status: lead.status === 'qualified' ? 'QUALIFIED' : lead.status === 'won' ? 'CUSTOMER' : 'NEW',
    lifecyclestage: lead.status === 'won' ? 'customer' : 'lead',
    kardx_source: lead.source,
    kardx_captured_at: lead.createdAt,
    kardx_organization: orgName,
    kardx_tags: (lead.tags || []).join('; '),
    message: lead.notes || (lead.meetingContext ? `Contexte rencontre: ${lead.meetingContext}` : 'Prospect capturé via KardX NFC Card'),
  };

  if (lead.city) properties.city = lead.city;
  if (lead.country) properties.country = lead.country;

  return {
    endpoint: 'https://api.hubapi.com/crm/v3/objects/contacts',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${integration.config.accessToken || integration.config.apiKey || 'pat-na1-kardx-live-token'}`,
      'Content-Type': 'application/json',
      'X-KardX-Source': 'KardX-NFC-Engine-v2',
    },
    body: {
      properties,
    },
    dealCreation: integration.config.createDealOnSync ? {
      endpoint: 'https://api.hubapi.com/crm/v3/objects/deals',
      properties: {
        dealname: `Opportunité Inbound NFC - ${lead.company || lead.lastName}`,
        pipeline: integration.config.dealPipeline || 'default',
        dealstage: integration.config.dealStage || 'appointmentscheduled',
        amount: String(integration.config.dealAmount || 3500),
      }
    } : null,
  };
}

/**
 * Builds the Salesforce Sales Cloud Lead REST API payload
 * Endpoint: POST https://{instance}.salesforce.com/services/data/v58.0/sobjects/Lead
 */
export function buildSalesforcePayload(lead: Lead, integration: Integration, orgName: string = 'KardX') {
  const instanceUrl = integration.config.instanceUrl || 'https://kardx-dev-ed.my.salesforce.com';
  
  const leadData: Record<string, any> = {
    FirstName: lead.firstName,
    LastName: lead.lastName || lead.firstName,
    Company: lead.company || '[Société à qualifier]',
    Title: lead.jobTitle || 'Contact',
    Email: lead.email,
    Phone: lead.phone || '',
    LeadSource: integration.config.leadSourceValue || `KardX NFC (${lead.source.toUpperCase()})`,
    Status: lead.status === 'qualified' ? 'Working - Contacted' : 'Open - Not Contacted',
    Rating: lead.isFavorite ? 'Hot' : 'Warm',
    Description: `Prospect enregistré via KardX Smart Card.\nContexte: ${lead.meetingContext || 'Échange direct'}\nNotes: ${lead.notes || 'Aucune note'}\nTags: ${(lead.tags || []).join(', ')}`,
    City: lead.city || '',
    Country: lead.country || '',
    KardX_NFC_Lead_ID__c: lead.id,
    KardX_Consent_GDPR__c: lead.consentGiven ? 'True' : 'False',
  };

  return {
    endpoint: `${instanceUrl}/services/data/v58.0/sobjects/Lead`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${integration.config.accessToken || '00D5g000000XYZ!AQ4AQKardXLiveOAuthToken'}`,
      'Content-Type': 'application/json',
      'Sforce-Auto-Assign': 'TRUE',
    },
    body: leadData,
  };
}

/**
 * Builds the Pipedrive Person API payload
 * Endpoint: POST https://api.pipedrive.com/v1/persons
 */
export function buildPipedrivePayload(lead: Lead, integration: Integration) {
  const payload = {
    name: `${lead.firstName} ${lead.lastName}`.trim(),
    first_name: lead.firstName,
    last_name: lead.lastName,
    email: [{ value: lead.email, primary: true, label: 'work' }],
    phone: lead.phone ? [{ value: lead.phone, primary: true, label: 'work' }] : [],
    org_name: lead.company || undefined,
    job_title: lead.jobTitle || undefined,
    add_time: lead.createdAt,
    visible_to: '3',
  };

  return {
    endpoint: `https://api.pipedrive.com/v1/persons?api_token=${integration.config.apiKey || 'kardx_pipe_token_live'}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: payload,
  };
}

/**
 * Builds the Zoho CRM Leads API v2 payload
 * Endpoint: POST https://www.zohoapis.com/crm/v2/Leads
 */
export function buildZohoPayload(lead: Lead, integration: Integration) {
  const payload = {
    data: [
      {
        First_Name: lead.firstName,
        Last_Name: lead.lastName || lead.firstName,
        Email: lead.email,
        Phone: lead.phone || '',
        Company: lead.company || 'Sans société',
        Designation: lead.jobTitle || '',
        Lead_Source: 'KardX NFC Smart Card',
        Description: lead.notes || 'Prospect importé automatiquement depuis KardX',
        City: lead.city || '',
        Country: lead.country || '',
      }
    ],
    trigger: ['approval', 'workflow', 'blueprint'],
  };

  return {
    endpoint: 'https://www.zohoapis.com/crm/v2/Leads',
    method: 'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${integration.config.accessToken || '1000.kardx.live.zoho.token'}`,
      'Content-Type': 'application/json',
    },
    body: payload,
  };
}

/**
 * Executes a simulated or real push of a lead to the target CRM
 */
export async function executeCrmLeadSync(
  lead: Lead,
  integration: Integration,
  orgName: string = 'KardX'
): Promise<{
  success: boolean;
  syncInfo: LeadCrmSyncInfo;
  log: CrmSyncLog;
}> {
  const startTime = Date.now();
  let requestData: { endpoint: string; method: string; headers: Record<string, string>; body: any; dealCreation?: any };
  let actionName = 'create_contact';

  switch (integration.provider) {
    case 'salesforce':
      requestData = buildSalesforcePayload(lead, integration, orgName);
      actionName = 'create_salesforce_lead';
      break;
    case 'pipedrive':
      requestData = buildPipedrivePayload(lead, integration);
      actionName = 'create_pipedrive_person';
      break;
    case 'zoho':
      requestData = buildZohoPayload(lead, integration);
      actionName = 'create_zoho_lead';
      break;
    case 'hubspot':
    default:
      requestData = buildHubSpotPayload(lead, integration, orgName);
      actionName = 'create_hubspot_contact';
      break;
  }

  // Artificial network roundtrip delay for realistic UI feedback
  await new Promise((resolve) => setTimeout(resolve, 240 + Math.random() * 150));

  const durationMs = Date.now() - startTime;
  const isSuccess = integration.status !== 'error';

  // Generated remote external IDs for reference
  const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
  const remoteId = integration.provider === 'salesforce' 
    ? `00Q5g0000${randomHex}` 
    : integration.provider === 'hubspot'
    ? `hs_vid_${Math.floor(10000000 + Math.random() * 90000000)}`
    : integration.provider === 'pipedrive'
    ? `pipe_p_${Math.floor(10000 + Math.random() * 90000)}`
    : `zoho_lead_${Math.floor(1000000 + Math.random() * 9000000)}`;

  const dealId = (integration.config.createDealOnSync && integration.provider === 'hubspot')
    ? `hs_deal_${Math.floor(100000 + Math.random() * 900000)}`
    : undefined;

  const responseBody = isSuccess ? {
    status: 'success',
    id: remoteId,
    dealId,
    createdAt: new Date().toISOString(),
    properties: requestData.body,
    message: `Contact successfully created and synchronized in ${integration.name}.`,
    sourceSystem: 'KardX NFC Integrations Engine',
  } : {
    status: 'error',
    error: 'AUTHENTICATION_REQUIRED',
    message: `Invalid or expired credentials for ${integration.name}. Please reconnect your OAuth token.`,
  };

  const syncInfo: LeadCrmSyncInfo = {
    provider: integration.provider as any,
    status: isSuccess ? 'synced' : 'failed',
    syncedAt: new Date().toISOString(),
    externalId: isSuccess ? remoteId : undefined,
    dealId,
    errorMessage: !isSuccess ? responseBody.message : undefined,
  };

  const log: CrmSyncLog = {
    id: `sync_log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    provider: integration.provider as any,
    leadId: lead.id,
    leadName: `${lead.firstName} ${lead.lastName}`,
    leadEmail: lead.email,
    status: isSuccess ? 'success' : 'error',
    statusCode: isSuccess ? 201 : 401,
    action: actionName,
    externalId: isSuccess ? remoteId : undefined,
    requestPayload: {
      endpoint: requestData.endpoint,
      method: requestData.method,
      headers: requestData.headers,
      body: requestData.body,
      dealCreation: requestData.dealCreation,
    },
    responseBody,
    durationMs,
    errorMessage: !isSuccess ? responseBody.message : undefined,
  };

  return {
    success: isSuccess,
    syncInfo,
    log,
  };
}

/**
 * Seed historical CRM sync logs for realistic demo & auditing
 */
export const SEED_CRM_SYNC_LOGS: CrmSyncLog[] = [
  {
    id: 'sync_log_seed_01',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    provider: 'hubspot',
    leadId: 'lead_01',
    leadName: 'Alexandre Dupont',
    leadEmail: 'a.dupont@energiagroup.fr',
    status: 'success',
    statusCode: 201,
    action: 'create_hubspot_contact',
    externalId: 'hs_vid_89124901',
    requestPayload: {
      endpoint: 'https://api.hubapi.com/crm/v3/objects/contacts',
      method: 'POST',
      body: {
        properties: {
          email: 'a.dupont@energiagroup.fr',
          firstname: 'Alexandre',
          lastname: 'Dupont',
          company: 'Energia Group',
          jobtitle: 'Directeur Achats & Innovation',
          phone: '+33 6 12 34 56 78',
          kardx_source: 'nfc',
          kardx_lead_status: 'QUALIFIED',
        }
      }
    },
    responseBody: {
      id: 'hs_vid_89124901',
      properties: { email: 'a.dupont@energiagroup.fr' },
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    durationMs: 142,
  },
  {
    id: 'sync_log_seed_02',
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
    provider: 'salesforce',
    leadId: 'lead_02',
    leadName: 'Sophie Benali',
    leadEmail: 'sophie.benali@fintech-ventures.com',
    status: 'success',
    statusCode: 201,
    action: 'create_salesforce_lead',
    externalId: '00Q5g00000XkL88',
    requestPayload: {
      endpoint: 'https://kardx-enterprise.my.salesforce.com/services/data/v58.0/sobjects/Lead',
      method: 'POST',
      body: {
        FirstName: 'Sophie',
        LastName: 'Benali',
        Company: 'Fintech Ventures',
        Email: 'sophie.benali@fintech-ventures.com',
        LeadSource: 'KardX NFC Smart Card',
        Status: 'Working - Contacted',
      }
    },
    responseBody: {
      id: '00Q5g00000XkL88',
      success: true,
      errors: [],
    },
    durationMs: 188,
  },
  {
    id: 'sync_log_seed_03',
    timestamp: new Date(Date.now() - 3600000 * 22).toISOString(),
    provider: 'hubspot',
    leadId: 'lead_03',
    leadName: 'Karim Mansouri',
    leadEmail: 'kmansouri@telecom-alliances.ma',
    status: 'success',
    statusCode: 201,
    action: 'create_hubspot_contact',
    externalId: 'hs_vid_89124765',
    requestPayload: {
      endpoint: 'https://api.hubapi.com/crm/v3/objects/contacts',
      method: 'POST',
      body: {
        properties: {
          email: 'kmansouri@telecom-alliances.ma',
          firstname: 'Karim',
          lastname: 'Mansouri',
          company: 'Telecom Alliances',
          jobtitle: 'VP Alliances Télécom',
        }
      }
    },
    responseBody: {
      id: 'hs_vid_89124765',
      properties: { email: 'kmansouri@telecom-alliances.ma' },
    },
    durationMs: 135,
  }
];
